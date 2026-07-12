#!/usr/bin/env node

/**
 * worktree-policy-guard.mjs - PreToolUse Edit|Write Hook
 *
 * main ブランチの直接作業を Tier 基準のホワイトリストで遮断する。
 *
 * ポリシー SSOT: .claude/config/worktree-policy.json
 *
 * 動作:
 *   - branch != main → passthrough (worktree 内で作業時は自動通過)
 *   - hotfix/* / hotfix-* branch → passthrough (escape hatch)
 *   - main + Tier 1 (allowed) → passthrough
 *   - main + Tier 2 (worktree smoke test 推奨) → allowWithWarning
 *   - main + Tier 3 (その他) → deny
 *   - error またはポリシーファイル不在 → passthrough (自己遮断の回避、R-CM-006 Rule 2)
 *
 * Reference パターン: destructive-git-guard.mjs
 */

import { join, relative, isAbsolute } from 'path';
import {
  readStdin,
  output,
  safeHookMainWithProfile,
  safeGit,
  safeReadJson,
  resolveProjectDir,
} from '../lib/utils.mjs';
import { HookOutput } from '../lib/hook-output.mjs';
import { extractApplyPatchFilePaths } from '../lib/apply-patch-paths.mjs';

/**
 * glob パターン → RegExp 変換 (minimatch 依存関係の回避)。
 *   `**`  → `.*`           (任意のパスセグメント)
 *   `*`   → `[^/]+`        (単一セグメントワイルドカード)
 *   その他正規表現メタ文字はエスケープ。
 */
export function matchesGlob(relPath, pattern) {
  // `*` も正規表現メタ文字のため一緒に escape 後、変換順序:
  //   1. 正規表現メタ文字 ( `*` 含む ) escape → `*` → `\*`
  //   2. `\*\*` → `@@GLOBSTAR@@` (任意のパスマッチング holder)
  //   3. `\*` → `[^/]+` (単一セグメント)
  //   4. `@@GLOBSTAR@@` → `.*`
  const regStr = pattern
    .replace(/[.+^${}()|[\]\\*]/g, '\\$&')
    .replace(/\\\*\\\*/g, '@@GLOBSTAR@@')
    .replace(/\\\*/g, '[^/]+')
    .replace(/@@GLOBSTAR@@/g, '.*');
  return new RegExp(`^${regStr}$`).test(relPath);
}

export function classifyTier(relPath, policy) {
  const tier1Patterns = policy?.tiers?.tier1_main_allowed?.patterns ?? [];
  if (tier1Patterns.some((p) => matchesGlob(relPath, p))) return 1;

  const tier2Patterns = policy?.tiers?.tier2_worktree_code_main_verify?.patterns ?? [];
  if (tier2Patterns.some((p) => matchesGlob(relPath, p))) return 2;

  return 3;
}

/**
 * Edit/Write/MultiEdit の file_path 抽出 + 正規化。
 *   - 相対パス → projectDir と join (絶対パス保証)
 *   - 空の string / 未サポート tool → 空配列
 *   - NotebookEdit / Read など他のツール → 空配列 (意図的な未適用 — `.ipynb` ファイルは本 hook 検証外)
 */
export function extractFilePaths(toolName, toolInput, projectDir = '') {
  if (!toolInput) return [];
  // Codex は編集時に常に tool_name="apply_patch" + tool_input.command (パッチ本文) を送信。
  if (toolName === 'apply_patch') {
    return extractApplyPatchFilePaths(toolInput.command, projectDir);
  }
  if (!['Edit', 'Write', 'MultiEdit'].includes(toolName)) return [];
  const raw = toolInput.file_path;
  if (!raw || typeof raw !== 'string') return [];
  const abs = isAbsolute(raw) ? raw : (projectDir ? join(projectDir, raw) : raw);
  return [abs];
}

/**
 * ポリシーオブジェクトが使用可能な形態であるか検証。
 *   - tiers 不在 / 両パターン配列ともに不在 → unusable (run() で fail-open passthrough)
 *   - corrupt JSON が空のオブジェクト `{}` としてパースされた場合の自己遮断事故の回避用
 */
export function isPolicyUsable(policy) {
  if (!policy || !policy.tiers) return false;
  const t1 = policy.tiers.tier1_main_allowed?.patterns;
  const t2 = policy.tiers.tier2_worktree_code_main_verify?.patterns;
  return Array.isArray(t1) || Array.isArray(t2);
}

/**
 * ファイルが .worktrees/ 配下であるか判定。
 *
 * cwd-based branch detection (`git branch --show-current` from main repo cwd) の
 * 限界 — main repo cwd で hook が実行され branch="main" と認識されるが、
 * 実際の編集対象ファイルは別の worktree 内 (`.worktrees/<name>/...`) にある場合、
 * worktree の実際の branch は main ではないため本 hook の遮断対象ではない。
 *
 * 本 helper は file-path-based の追加検出 — relPath が `.worktrees/` で始まれば、
 * 定義上 worktree 内のファイルと見なし tier 判定 skip + passthrough 処理する。
 *
 * @param {string} relPath - projectDir 基準で正規化された相対パス
 * @returns {boolean}
 */
export function isWorktreeRelPath(relPath) {
  return typeof relPath === 'string' && relPath.startsWith('.worktrees/');
}

export function isEscapeHatch(branch, policy) {
  const patterns = policy?.escape_hatch?.branch_patterns ?? [];
  return patterns.some((p) => matchesGlob(branch, p));
}

/**
 * 現在の branch が worktree ポリシーの保護対象 (直接編集遮断) であるか判定。
 * policy.protected_branches が明示されていればそれを、なければデフォルト ['main', 'master'] を使用。
 * 外部移植プロジェクトが master 基本であってもガードが動作するようにする (worktree-new の
 * base 自動検知と整合 — ハードコーディングの 'main' 想定が master repo で no-op になっていた罠を解消)。
 */
export function isProtectedBranch(branch, policy) {
  const list =
    Array.isArray(policy?.protected_branches) && policy.protected_branches.length
      ? policy.protected_branches
      : ['main', 'master'];
  return list.includes(branch);
}

function buildDenyMessage(relPath, branch = 'main') {
  return (
    `[Worktree Policy] ${branch} ブランチ直接編集遮断: ${relPath}\n\n` +
    `このファイルは worktree で作業する必要があります。\n` +
    `  → worktree 生成 (標準エントリーポイント、fetch + ff + 最新の base 基準):\n` +
    `      make wt.new BR=feature/<task>\n` +
    `      # または: node .claude/scripts/worktree-new.mjs --branch feature/<task>\n` +
    `  → 非常口: hotfix/* branch ではすべての遮断を免除\n` +
    `ポリシー SSOT: .claude/config/worktree-policy.json`
  );
}

/**
 * Orchestrator 互換エントリーポイント。
 */
export async function run(data) {
  try {
    const toolName = data?.tool_name || '';
    if (!['Edit', 'Write', 'MultiEdit', 'apply_patch'].includes(toolName)) {
      return HookOutput.passthrough();
    }

    const projectDir = resolveProjectDir(data);
    const branch = safeGit('branch --show-current', projectDir, { timeout: 2000 });
    if (!branch) return HookOutput.passthrough();

    const policy = safeReadJson(
      join(projectDir, '.claude/config/worktree-policy.json'),
      null
    );
    if (!isPolicyUsable(policy)) return HookOutput.passthrough();

    // 保護 branch (default main+master, policy.protected_branches で再定義) 以外は通過。
    if (!isProtectedBranch(branch, policy)) return HookOutput.passthrough();

    if (isEscapeHatch(branch, policy)) return HookOutput.passthrough();

    const filePaths = extractFilePaths(toolName, data.tool_input, projectDir);
    if (filePaths.length === 0) return HookOutput.passthrough();

    for (const filePath of filePaths) {
      const relPath = relative(projectDir, filePath).replace(/\\/g, '/');
      // 外部パス (project root 外、例: /tmp/foo, /var/...) 免除。
      // ユーザー報告 "shell 停止" root cause F4 — relPath が `..` で始まれば定義上
      // プロジェクト外部なため worktree ポリシーの適用対象ではない (false-positive 遮断)。
      if (relPath.startsWith('..')) continue;
      // .worktrees/ 配下のファイルは定義上、個別 worktree の branch (main ではない)。
      // hook の cwd-based branch 検出は main repo のみを見るため、worktree 内の作業が
      // main と誤認される罠を回避。file-path-based detection で補強。
      if (isWorktreeRelPath(relPath)) continue;
      const tier = classifyTier(relPath, policy);
      if (tier === 1) continue;
      // tier === 3 (tier 2 has been abolished)
      return HookOutput.deny(buildDenyMessage(relPath, branch));
    }

    return HookOutput.passthrough();
  } catch (_) {
    return HookOutput.passthrough();
  }
}

// Standalone fallback (settings.json から直接呼び出された場合)
if (!globalThis.__HOOK_ORCHESTRATOR__) {
  safeHookMainWithProfile('worktree-policy-guard', async () => {
    const data = await readStdin();
    return output(await run(data));
  });
}
