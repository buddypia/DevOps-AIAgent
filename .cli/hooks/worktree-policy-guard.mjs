#!/usr/bin/env node

/**
 * worktree-policy-guard.mjs - PreToolUse Edit|Write Hook
 *
 * main ブランチへの直接作業を Tier ベースのホワイトリストで遮断する。
 *
 * ポリシー SSOT: .claude/config/worktree-policy.json
 *
 * 動作:
 *   - branch != main → passthrough (worktree 内での作業時は自動通過)
 *   - hotfix/* / hotfix-* branch → passthrough (escape hatch)
 *   - main + Tier 1 (allowed) → passthrough
 *   - main + Tier 2 (worktree smoke test 推奨) → allowWithWarning
 *   - main + Tier 3 (それ以外) → deny
 *   - error または ポリシーファイル不在 → passthrough (自己遮断回避、R-CM-006 Rule 2)
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
 * glob パターン → RegExp 変換 (minimatch 依存回避)。
 *   `**`  → `.*`           (任意のパスセグメント)
 *   `*`   → `[^/]+`        (単一セグメントワイルドカード)
 *   その他の正規表現メタ文字はエスケープする。
 */
export function matchesGlob(relPath, pattern) {
  // `*` も正規表現メタ文字なので、あわせて escape した後の変換順序:
  //   1. 正規表現メタ文字 ( `*` を含む ) を escape → `*` → `\*`
  //   2. `\*\*` → `@@GLOBSTAR@@` (任意パスマッチング holder)
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
 *   - 相対パス → projectDir と join (絶対パスを保証)
 *   - 空 string / 未対応 tool → 空配列
 *   - NotebookEdit / Read など他のツール → 空配列 (意図的な非適用 — `.ipynb` ファイルは本 hook の検証対象外)
 */
export function extractFilePaths(toolName, toolInput, projectDir = '') {
  if (!toolInput) return [];
  // Codex は編集時、常に tool_name="apply_patch" + tool_input.command (パッチ本文) を送信する。
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
 * ポリシーオブジェクトが使用可能な形式か検証する。
 *   - tiers 不在 / 両パターン配列とも不在 → unusable (run() で fail-open passthrough)
 *   - corrupt JSON が空オブジェクト `{}` としてパースされた場合の自己遮断事故回避用
 */
export function isPolicyUsable(policy) {
  if (!policy || !policy.tiers) return false;
  const t1 = policy.tiers.tier1_main_allowed?.patterns;
  const t2 = policy.tiers.tier2_worktree_code_main_verify?.patterns;
  return Array.isArray(t1) || Array.isArray(t2);
}

/**
 * ファイルが .worktrees/ 配下かどうかを判定する。
 *
 * cwd-based branch detection (`git branch --show-current` from main repo cwd) の
 * 限界 — main repo cwd で hook が実行され branch="main" と認識されるが
 * 実際の編集対象ファイルは別の worktree 内 (`.worktrees/<name>/...`) にある場合、
 * worktree の実際の branch は main ではないため、本 hook の遮断対象ではない。
 *
 * 本 helper は file-path-based の追加検出 — relPath が `.worktrees/` で始まる場合、
 * 定義上 worktree 内のファイルとみなし、tier 判定を skip して passthrough 処理する。
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
 * 現在の branch が worktree ポリシーの保護対象(直接編集の遮断対象)かどうかを判定する。
 * policy.protected_branches が指定されていればそれを、なければ default ['main', 'master'] を使用する。
 * 外部移植プロジェクトが master をデフォルトとしていてもガードが動作するようにする (worktree-new の
 * base 自動検知と整合 — ハードコードされた 'main' という前提が master repo で no-op になっていた落とし穴を解消)。
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
    `[Worktree Policy] ${branch} ブランチへの直接編集を遮断: ${relPath}\n\n` +
    `このファイルは worktree で作業する必要があります。\n` +
    `  → worktree 作成 (標準エントリポイント、fetch + ff + 最新 base 基準):\n` +
    `      make wt.new BR=feature/<task>\n` +
    `      # または: node .claude/scripts/worktree-new.mjs --branch feature/<task>\n` +
    `  → 非常口: hotfix/* branch では全ての遮断が免除されます\n` +
    `ポリシー SSOT: .claude/config/worktree-policy.json`
  );
}

/**
 * Orchestrator 互換エントリポイント。
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

    // 保護対象 branch (default main+master, policy.protected_branches で再定義可能) 以外は通過。
    if (!isProtectedBranch(branch, policy)) return HookOutput.passthrough();

    if (isEscapeHatch(branch, policy)) return HookOutput.passthrough();

    const filePaths = extractFilePaths(toolName, data.tool_input, projectDir);
    if (filePaths.length === 0) return HookOutput.passthrough();

    for (const filePath of filePaths) {
      const relPath = relative(projectDir, filePath).replace(/\\/g, '/');
      // 外部 path (project root 外、例: /tmp/foo, /var/...) は免除。
      // ユーザー報告「shell 停止」root cause F4 — relPath が `..` で始まる場合は定義上
      // プロジェクト外部であるため worktree ポリシーの適用対象ではない (false-positive を回避)。
      if (relPath.startsWith('..')) continue;
      // .worktrees/ 配下のファイルは定義上、別の worktree の branch (main ではない)。
      // hook の cwd-based branch 検出は main repo しか見ないため、worktree 内での作業が
      // main と誤判定される落とし穴を回避。file-path-based detection で補強。
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
