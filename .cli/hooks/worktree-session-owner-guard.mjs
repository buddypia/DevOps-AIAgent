#!/usr/bin/env node

/**
 * worktree-session-owner-guard.mjs - PreToolUse Edit|Write|MultiEdit|Bash Hook
 *
 * マルチセッション環境において、AIセッションが**自分のセッションが作成したworktreeのファイルのみ**を
 * 編集・コミットできるよう強制する。対象ファイル/コミットが属するworktreeの `.session-owner` サイドカーが
 * 現在のセッション(`data.session_id`)と一致しない場合はdenyする。
 *
 * ポリシーSSOT: R-CM-036 (worktree-session-ownership.md)。
 * サイドカー記録: worktree-owner-tracker.mjs (PostToolUse Bash)。
 *
 * 2層防御 (R-CM-036):
 *   Layer 1 — cwd-confinement (決定論的・orphan-proof・session_id 非依存, PRIMARY):
 *     対象worktree ≠ cwdのworktree → deny。サイドカー不要 → orphanの抜け穴なし。
 *     cwdがmain repo(worktree外)なのに対象がworktree → deny (cdせずに侵入する = 事故パターン)。
 *   Layer 2 — session_id サイドカー (SECONDARY, 同一worktree path内の他セッション防御):
 *     `.session-owner` が存在 & ≠ 現在のsession_id → deny。
 *
 * 動作 (carve-outはすべてfail-open passthrough — 誤遮断0を優先):
 *   - toolがEdit|Write|MultiEdit|Bashでない → passthrough
 *   - 対象が.worktrees/配下でない (main repoのファイル) → passthrough (worktree-policy-guardの管轄)
 *   - `.tmp/create-pr-active` が存在 → passthrough (ship/create-pr フローのcarve-out)
 *   - Bashが`git commit`でない / `--dry-run` → passthrough
 *   - Layer 1: cwd worktree ≠ 対象worktree → **deny** (session_id 非依存 — orphanも遮断)
 *   - Layer 2: 同一worktreeだがサイドカーowner ≠ session_id → **deny**
 *   - error → passthrough (R-CM-006 Rule 2 fail-open)
 *
 * Referenceパターン: worktree-policy-guard.mjs
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
// worktreeルート判定 = 単一SSOT (R-CM-037)。セッション軸に依存しない純粋関数。
// テストはworktree-path.mjsから直接import (re-export依存を削除 — DEBT-183)。
import { resolveWorktreeRoot } from '../lib/worktree-path.mjs';
import { extractApplyPatchFilePaths } from '../lib/apply-patch-paths.mjs';

/**
 * worktreeの `.session-owner` の1行目(session_id)。不在/失敗/空ファイル → null。
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
 * Edit|Write|MultiEdit 対象ファイルの絶対パス (単一)。
 */
export function editTargetPath(toolName, toolInput, baseDir) {
  // Codexは編集時にtool_name="apply_patch" + tool_input.command (パッチ本文) を送信する。
  // 複数ファイルパッチ: worktree所属パスを優先選択 — innocentなmainファイルがパッチの
  // 先頭に来てもcross-worktree侵入(worktree常駐ファイル)を検出できるようにする (単一path検査の
  // ordering回避を防止)。worktree所属パスが不在の場合は最初のpath (main repoファイル → 上位でpassthrough)。
  if (toolName === 'apply_patch') {
    const paths = extractApplyPatchFilePaths(toolInput?.command, baseDir);
    return paths.find((p) => resolveWorktreeRoot(p)) || paths[0] || null;
  }
  if (!['Edit', 'Write', 'MultiEdit'].includes(toolName)) return null;
  return toAbs(toolInput?.file_path, baseDir);
}

/**
 * Bashコマンドがworktreeを変更する `git commit` であれば、対象worktreeの基準パスを返す。
 *   - `git -C <path> ... commit`  → <path>
 *   - それ以外の `git commit`     → data.cwd (現在のcwdのworktree)
 *   - commitでない / `--dry-run`  → null (対象なし)
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

    const sessionId = data?.session_id; // Layer 1 はなくても動作する (決定論的)

    const projectDir = resolveProjectDir(data);
    // ship / create-pr フローはworktreeパスを正当に扱う → carve-out
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
    if (!wtRoot) return HookOutput.passthrough(); // main repoファイル / 非worktree

    const relRoot = relative(projectDir, wtRoot).replace(/\\/g, '/') || wtRoot;
    const action = toolName === 'Bash' ? 'commit' : 'edit';

    // ── Layer 1: cross-worktree confinement (cwdが*別の*worktreeの時のみdeny) ──
    // brief2dev Claude CodeのEdit/Bash cwdは常にmain(PROJECT_DIR)に固定される
    // (learnings bash-cwd-reset-worktree) — 単一セッションがmain cwdで自分のworktreeを
    // 編集するのが*正常な*ワークフローである。したがってcwd=main(null)はdenyせず、
    // Layer 2(session_idサイドカー)に委譲する。cwdが*別のworktree*である場合のみ
    // cross-worktree侵入として遮断する (trip-jarvisマルチ-cdセッションシナリオ)。
    const cwdWt = resolveWorktreeRoot(data?.cwd || '');
    if (cwdWt !== null && cwdWt !== wtRoot) {
      return HookOutput.deny(
        `[Session Owner Guard] cross-worktree ${action} を遮断: ${relRoot}\n\n` +
          `現在のcwdは別のworktree (${relative(projectDir, cwdWt).replace(/\\/g, '/')}) ですが、` +
          `対象はworktree ${relRoot} です。\n` +
          `各セッションは自分のworktreeのファイルのみ編集・コミットできます (R-CM-036 Layer 1)。\n` +
          `  → 自分のworktreeで作業するか、正規のshipフロー(/create-pr ship-worktree)を使用してください。`
      );
    }

    // ── Layer 2: session_id サイドカー (同一worktree path内の他セッション防御) ──
    if (sessionId && typeof sessionId === 'string') {
      const owner = readSessionOwner(wtRoot);
      if (owner && owner !== sessionId) {
        return HookOutput.deny(
          `[Session Owner Guard] 他セッション所有worktreeの${action}を遮断: ${relRoot}\n\n` +
            `このworktreeは別のセッション(owner=${owner.slice(0, 12)}…)が作成しました。\n` +
            `現在のセッション(${sessionId.slice(0, 12)}…)は、自分のセッションが作成したworktreeのみ編集・コミットできます (R-CM-036 Layer 2)。\n` +
            `  → 自分のworktreeで作業するか、そのworktreeを作成したセッションに委譲してください。`
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
