#!/usr/bin/env node

/**
 * worktree-session-owner-guard.mjs - PreToolUse Edit|Write|MultiEdit|Bash Hook
 *
 * マルチセッション環境において AI セッションが **自身のセッションが作成した worktree のファイルのみ** 編集・コミットするように
 * 強制する。対象ファイル/コミットが属する worktree の `.session-owner` サイドカーが現在のセッション
 * (`data.session_id`) と一致しなければ deny。
 *
 * ポリシー SSOT: R-CM-036 (worktree-session-ownership.md).
 * サイドカー記録: worktree-owner-tracker.mjs (PostToolUse Bash)。
 *
 * 2-Layer 防御 (R-CM-036):
 *   Layer 1 — cwd-confinement (決定論的・orphan-proof・session_id 無関係、PRIMARY):
 *     対象 worktree ≠ cwd の worktree → deny。サイドカー不要 → orphan 穴なし。
 *     cwd が main repo (worktree 外) なのに対象が worktree → deny (cd せずに侵害 = 事故パターン)。
 *   Layer 2 — session_id サイドカー (SECONDARY、同一の worktree path 内の他セッション防御):
 *     `.session-owner` 存在 & ≠ 現在の session_id → deny。
 *
 * 動作 (carve-out はすべて fail-open passthrough — 誤遮断 0 優先):
 *   - tool が Edit|Write|MultiEdit|Bash 以外 → passthrough
 *   - 対象が .worktrees/ 配下ではない (main repo ファイル) → passthrough (worktree-policy-guard 領域)
 *   - `.tmp/create-pr-active` 存在 → passthrough (ship/create-pr フロー carve-out)
 *   - Bash が `git commit` 以外 / `--dry-run` → passthrough
 *   - Layer 1: cwd worktree ≠ 対象 worktree → **deny** (session_id 無関係 — orphan も遮断)
 *   - Layer 2: 同一 worktree だがサイドカー owner ≠ session_id → **deny**
 *   - error → passthrough (R-CM-006 Rule 2 fail-open)
 *
 * Reference パターン: worktree-policy-guard.mjs
 */

import { join, relative, isAbsolute } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import {
  readStdin,
  output,
  safeHookMainWithProfile,
  resolveProjectDir,
} from '../lib/utils.mjs';
import { worktreeOwnerPath } from '../lib/worktree-plan-path.mjs';
import { HookOutput } from '../lib/hook-output.mjs';
// worktree ルート判定 = 単一の SSOT (R-CM-037)。セッション軸無関係の純粋関数。
// テストは worktree-path.mjs から直接 import (re-export 依存の除去 — DEBT-183)。
import { resolveWorktreeRoot } from '../lib/worktree-path.mjs';
import { extractApplyPatchFilePaths } from '../lib/apply-patch-paths.mjs';

/**
 * worktree の `.session-owner` 1行目 (session_id)。不在/失敗/空ファイル → null。
 */
export function readSessionOwner(worktreeRoot) {
  try {
    const id = readFileSync(worktreeOwnerPath(worktreeRoot), 'utf-8').split('\n')[0].trim();
    return id || null;
  } catch {
    return null;
  }
}

function toAbs(raw, baseDir) {
  if (!raw || typeof raw !== 'string') return null;
  return isAbsolute(raw) ? raw : (baseDir ? join(baseDir, raw) : raw);
}

/**
 * Edit|Write|MultiEdit 対象ファイルの abs パス (単一)。
 */
export function editTargetPath(toolName, toolInput, baseDir) {
  // Codex は編集時に tool_name="apply_patch" + tool_input.command (パッチ本文) を送信。
  // 複数ファイルパッチ: worktree 所属のパスを優先選択 — innocent な main ファイルがパッチの前に
  // 来ても cross-worktree 侵害 (worktree-resident ファイル) を検出するように (単一 path 検査の
  // ordering 迂回防止)。worktree 所属のパスがない場合は最初のパス (main repo ファイル → 上位で passthrough)。
  if (toolName === 'apply_patch') {
    const paths = extractApplyPatchFilePaths(toolInput?.command, baseDir);
    return paths.find((p) => resolveWorktreeRoot(p)) || paths[0] || null;
  }
  if (!['Edit', 'Write', 'MultiEdit'].includes(toolName)) return null;
  return toAbs(toolInput?.file_path, baseDir);
}

/**
 * Bash コマンドが worktree を変更する `git commit` であれば、対象 worktree の基準パスを返却。
 *   - `git -C <path> ... commit`  → <path>
 *   - その他 `git commit`          → data.cwd (現在の cwd の worktree)
 *   - commit 以外 / `--dry-run`   → null (対象なし)
 */
export function commitTargetBase(cmd, cwd, baseDir) {
  if (!cmd || typeof cmd !== 'string') return null;
  if (!/\bgit\b[\s\S]*\bcommit\b/.test(cmd)) return null;
  if (/\bcommit\b[\s\S]*--dry-run/.test(cmd)) return null;
  const mC = cmd.match(/\bgit\s+-C\s+([^\s'"]+)/);
  if (mC) return toAbs(mC[1], baseDir);
  return cwd || null;
}

export async function run(data) {
  try {
    const toolName = data?.tool_name || '';
    if (!['Edit', 'Write', 'MultiEdit', 'apply_patch', 'Bash'].includes(toolName)) {
      return HookOutput.passthrough();
    }

    const sessionId = data?.session_id; // Layer 1 はなくても動作 (決定論的)

    const projectDir = resolveProjectDir(data);
    // ship / create-pr フローは worktree パスを合法的に扱う → carve-out
    if (existsSync(join(projectDir, '.tmp', 'create-pr-active'))) {
      return HookOutput.passthrough();
    }

    const baseDir = data?.cwd || projectDir;
    let targetAbs = null;
    if (toolName === 'Bash') {
      targetAbs = commitTargetBase(data.tool_input?.command, data.cwd, baseDir);
    } else {
      targetAbs = editTargetPath(toolName, data.tool_input, baseDir);
    }
    if (!targetAbs) return HookOutput.passthrough();

    const wtRoot = resolveWorktreeRoot(targetAbs);
    if (!wtRoot) return HookOutput.passthrough(); // main repo ファイル / 非 worktree

    const relRoot = relative(projectDir, wtRoot).replace(/\\/g, '/') || wtRoot;
    const action = toolName === 'Bash' ? 'commit' : 'edit';

    // ── Layer 1: cross-worktree confinement (cwd が *異なる* worktree の場合のみ deny) ──
    // brief2dev Claude Code の Edit/Bash cwd は常に main (PROJECT_DIR) に固定される
    // (learnings bash-cwd-reset-worktree) — 単一セッションが main cwd で自身の worktree を
    // 編集するのが *正常な* ワークフローである。したがって cwd=main(null) は deny せず、
    // Layer 2 (session_id サイドカー) へ委譲する。cwd が *異なる worktree* である場合のみ
    // cross-worktree 侵害として遮断する (trip-jarvis マルチ cd セッションシナリオ)。
    const cwdWt = resolveWorktreeRoot(data?.cwd || '');
    if (cwdWt !== null && cwdWt !== wtRoot) {
      return HookOutput.deny(
        `[Session Owner Guard] cross-worktree ${action} 遮断: ${relRoot}\n\n` +
          `現在の cwd は異なる worktree (${relative(projectDir, cwdWt).replace(/\\/g, '/')}) ですが、` +
          `対象は worktree ${relRoot} です。\n` +
          `各セッションは自身の worktree のファイルのみ編集・コミットできます (R-CM-036 Layer 1)。\n` +
          `  → 自身の worktree で作業するか、正常な ship フロー (/create-pr ship-worktree) を使用してください。`
      );
    }

    // ── Layer 2: session_id サイドカー (同一の worktree path 内の他セッション防御) ──
    if (sessionId && typeof sessionId === 'string') {
      const owner = readSessionOwner(wtRoot);
      if (owner && owner !== sessionId) {
        return HookOutput.deny(
          `[Session Owner Guard] 他セッション所有の worktree ${action} 遮断: ${relRoot}\n\n` +
            `この worktree は他のセッション (owner=${owner.slice(0, 12)}…) が作成しました。\n` +
            `現在のセッション (${sessionId.slice(0, 12)}…) は自身のセッションが作成した worktree のみ編集・コミットできます (R-CM-036 Layer 2)。\n` +
            `  → 自身の worktree で作業するか、該当する worktree を作成したセッションに委譲してください。`
        );
      }
    }
    return HookOutput.passthrough();
  } catch {
    return HookOutput.passthrough();
  }
}

if (!globalThis.__HOOK_ORCHESTRATOR__) {
  safeHookMainWithProfile('worktree-session-owner-guard', async () => {
    const data = await readStdin();
    return output(await run(data));
  });
}
