#!/usr/bin/env node

/**
 * worktree-shipping-guard.mjs - Stop Hook
 *
 * worktree 内に uncommitted な変更または unmerged な commit があれば Stop を BLOCK する。
 * uncommitted な変更は先に commit するように促し、unmerged な commit はユーザーに PR/merge の進行可否を
 * 確認した上で、明示的な確認がある場合のみ `/create-pr ship-worktree` の実行を誘導する。
 *
 * ポリシー SSOT: R-CM-030 (worktree-auto-ship.md) + R-CM-036 (worktree-session-ownership.md)
 *
 * 動作:
 *   - user abort / context limit → passthrough (ユーザーの明示的な中断を尊重)
 *   - .tmp/create-pr-active 新鮮 (30分) → passthrough (/create-pr 進行中)
 *   - すべての worktree が以下のいずれかであれば → passthrough
 *       · main ブランチ (worktree list の最初のエントリー)
 *       · hotfix/* / hotfix-* ブランチ (escape hatch、R-CM-008 整合)
 *       · 本セッション所有ではない worktree (他セッション / orphan — R-CM-036 セッション所有権フィルター)
 *       · 試行マーカー新鮮 (5分) — すでに1度 ship 試行した clean worktree
 *       · origin/main..HEAD が空で、uncommitted な変更もなし
 *   - 本セッション所有 (owned) + uncommitted な変更がある worktree 1+ → BLOCK (試行マーカーは生成しない)
 *   - 上記以外で owned + unmerged な commit がある worktree 1+ → 試行マーカー生成 + BLOCK
 *   - error → passthrough (R-CM-006 Rule 2 fail-open)
 *
 * セッション所有権 (R-CM-036, 2-Layer): Stop stdin の session_id + cwd で所有 worktree のみを遮断対象に
 *   含める。Layer 1 = cwd が worktree 内部 (Codex/Antigravity)、Layer 2 = `.session-owner`
 *   サイドカー === session_id (Claude Code、cwd=main)。他セッション/orphan は stderr での通知後 passthrough。
 *
 * ユーザー決定 (2026-05-10):
 *   - トリガー: uncommitted な変更または commit + unmerged 時に BLOCK
 *   - 失敗ポリシー: 1回試行後は次の Stop は通過 (ユーザーに報告して停止)
 *     ただし、uncommitted な変更は作業完了と見なせないため、マーカーによる通過はさせない。
 *
 * Reference パターン: worktree-policy-guard.mjs, quality-gate-stop-guard.mjs
 */

import { existsSync, statSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  output,
  safeHookMainWithProfile,
  readStdin,
  isUserAbort,
  isContextLimitStop,
  resolveProjectDir,
  safeGit,
} from '../lib/utils.mjs';
import { HookOutput } from '../lib/hook-output.mjs';
import {
  resolveWorktreePlanPath,
  parseWorktreeList,
  worktreeOwnerPath,
} from '../lib/worktree-plan-path.mjs';
import {
  readWorktreePlanChecklistStatus,
  formatPlanChecklistStatus,
} from '../lib/worktree-plan-status.mjs';
import {
  buildFileTree,
  buildPreShipApprovalReview,
  parseNameStatusRows,
} from '../lib/worktree-ship-report.mjs';
// worktree ルート判定 = 単一の SSOT (R-CM-037)。セッション軸無関係の純粋関数。
import { resolveWorktreeRoot } from '../lib/worktree-path.mjs';
// parseWorktreeList SSOT は worktree-plan-path.mjs (R-CM-036 worktree-owner-tracker と共有)。
// 既存の import 契約 (テスト + 外部 import) の保存のためローカルバインディングを re-export。
export { parseWorktreeList };

const CREATE_PR_ACTIVE_TTL_MS = 30 * 60 * 1000; // 30 分 — /create-pr 進行中マーカー
const ATTEMPT_MARKER_TTL_MS = 5 * 60 * 1000; // 5 分 — 1回試行後にユーザー報告/停止
const ESCAPE_HATCH_PATTERNS = [/^hotfix\//, /^hotfix-/];

// Layer 2 staleness 閾値 (ユーザー決定不在 — AI デフォルト; R-CM-033 #6 パターン、運用後に調整)。
// 測定は **すでに fetch された origin/main** 基準 (ネットワーク呼び出しなし — Stop hook コストの回避)。
// worktree-new.mjs が最初の進入時に fetch するため baseline は新鮮。時間の経過により stale が可視化される。
export const STALENESS_BEHIND_THRESHOLD = 20;
export const STALENESS_AGE_DAYS_THRESHOLD = 7;

/**
 * ファイルの mtime freshness 検査。不在 / stat 失敗 → false。
 */
export function isFresh(absPath, ttlMs) {
  if (!existsSync(absPath)) return false;
  try {
    const ageMs = Date.now() - statSync(absPath).mtime.getTime();
    return ageMs <= ttlMs;
  } catch {
    return false;
  }
}

export function isEscapeHatchBranch(branch) {
  if (!branch) return false;
  return ESCAPE_HATCH_PATTERNS.some((p) => p.test(branch));
}

/**
 * worktree の unmerged な commit 数。
 *   - origin/main を優先、不在時は main を fallback。
 *   - git rev-list 失敗 → 0 (保守的、fail-open により false negative)。
 */
export function countUnmergedCommits(worktreePath) {
  for (const base of ['origin/main', 'main']) {
    const out = safeGit(`rev-list --count ${base}..HEAD`, worktreePath, { timeout: 3000 });
    if (out !== null && /^\d+$/.test(out.trim())) return parseInt(out.trim(), 10);
  }
  return 0;
}

/**
 * worktree の uncommitted な変更数。
 *   - tracked の修正 + untracked ファイルを含む
 *   - git status 失敗 → 0 (fail-open)
 */
export function countUncommittedChanges(worktreePath) {
  const out = safeGit('status --porcelain --untracked-files=all', worktreePath, { timeout: 3000 });
  if (out === null) return 0;
  if (!out.trim()) return 0;
  return out.split('\n').filter((line) => line.trim().length > 0).length;
}

/**
 * worktree base freshness 測定 (Layer 2 — 測定のみ、遮断追加なし)。
 *   - behind: HEAD が origin/main からどれくらい遅れているか (commit 数)
 *   - merge_base_age_days: merge-base (HEAD, origin/main) commit の経過日数
 *   - origin/main がなければ main を fallback。両方なければ null (測定不可 — fail-open)。
 *   - ネットワーク呼び出しなし — すでに fetch された ref 基準。Stop hook コストの回避。
 */
export function measureStaleness(worktreePath, opts = {}) {
  const _safeGit = opts._safeGit || safeGit;
  const _now = opts._now || Date.now;
  for (const base of ['origin/main', 'main']) {
    const behindOut = _safeGit(`rev-list --count HEAD..${base}`, worktreePath, { timeout: 3000 });
    if (behindOut === null || !/^\d+$/.test(behindOut.trim())) continue;
    const mergeBaseOut = _safeGit(`merge-base HEAD ${base}`, worktreePath, { timeout: 3000 });
    if (mergeBaseOut === null || !mergeBaseOut.trim()) continue;
    const tsOut = _safeGit(`log -1 --format=%ct ${mergeBaseOut.trim()}`, worktreePath, {
      timeout: 3000,
    });
    if (tsOut === null || !/^\d+$/.test(tsOut.trim())) continue;
    const tsSec = parseInt(tsOut.trim(), 10);
    const ageDays = Math.floor((_now() / 1000 - tsSec) / 86400);
    return {
      base,
      behind: parseInt(behindOut.trim(), 10),
      merge_base_age_days: ageDays,
    };
  }
  return null;
}

/**
 * staleness 測定結果を閾値と比較。閾値超過時は reason 配列を返却、そうでなければ []。
 */
export function evaluateStaleness(staleness) {
  if (!staleness) return [];
  const reasons = [];
  if (staleness.behind > STALENESS_BEHIND_THRESHOLD) {
    reasons.push(`behind ${staleness.behind} commits (>${STALENESS_BEHIND_THRESHOLD})`);
  }
  if (staleness.merge_base_age_days > STALENESS_AGE_DAYS_THRESHOLD) {
    reasons.push(
      `base ${staleness.merge_base_age_days}d old (>${STALENESS_AGE_DAYS_THRESHOLD}d)`,
    );
  }
  return reasons;
}

/**
 * 試行マーカーパス。branch のスラッシュは `__` に置換 (filename safe)。
 */
export function attemptMarkerPath(projectDir, branch) {
  const safe = (branch || 'unknown').replace(/[\/\\]/g, '__');
  return join(projectDir, '.tmp', `worktree-shipping-attempted-${safe}`);
}

export function touchAttemptMarker(projectDir, branch) {
  const path = attemptMarkerPath(projectDir, branch);
  try {
    mkdirSync(join(projectDir, '.tmp'), { recursive: true });
    writeFileSync(path, `${new Date().toISOString()}\n`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Stop hook コア判定。
 *   @param {string} projectDir - main repo path
 *   @returns {{ block: boolean, candidates: Array<{path, branch, commits, uncommitted, commit_required?: boolean}>, reason: string }}
 */
/**
 * worktree 内に PLAN.md が存在するか検査 (M1 — stop loop 回避のための事前案内)。
 *   ship-worktree は PLAN.md 不在時に拒否 → 5分マーカー後に再遮断の無限ループの危険性。
 *   本検査は BLOCK メッセージに plan_missing 情報を載せ、AI が自動で作成するように誘導する。
 */
export function isPlanPresent(worktreePath, opts = {}) {
  const _existsSync = opts._existsSync || existsSync;
  // PLAN.md の位置: .tmp/worktree-<safeBranch>/PLAN.md (worktree-plan-path.mjs SSOT)。
  // 既存の worktree ルートの PLAN.md は、マージ漏洩防止のために廃棄。
  return _existsSync(resolveWorktreePlanPath(worktreePath));
}

export function collectReviewSnapshot(worktreePath, opts = {}) {
  const _safeGit = opts._safeGit || safeGit;
  const baseCandidates = opts.baseCandidates || ['origin/main', 'main'];
  let base = null;
  let git_log = '';

  for (const candidateBase of baseCandidates) {
    const out = _safeGit(`log --oneline ${candidateBase}..HEAD`, worktreePath, {
      timeout: 3000,
    });
    if (out !== null) {
      base = candidateBase;
      git_log = out.trim();
      break;
    }
  }

  const commit_count_out = base
    ? _safeGit(`rev-list --count ${base}..HEAD`, worktreePath, { timeout: 3000 })
    : null;
  const nameStatusText = base
    ? _safeGit(`diff --name-status ${base}...HEAD`, worktreePath, { timeout: 3000 })
    : null;
  const changedFilesText = base
    ? _safeGit(`diff --name-only ${base}...HEAD`, worktreePath, { timeout: 3000 })
    : null;

  const changed_files = (changedFilesText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const commit_count =
    commit_count_out && /^\d+$/.test(commit_count_out.trim())
      ? parseInt(commit_count_out.trim(), 10)
      : null;

  return {
    base_branch: base || 'main',
    git_log,
    commit_count,
    commit_range: base ? `${base}..HEAD` : null,
    latest_commit: git_log ? git_log.split('\n')[0] : null,
    changed_files,
    changed_files_tree: buildFileTree(changed_files),
    changed_rows: parseNameStatusRows(nameStatusText || ''),
  };
}

/**
 * worktree の `.session-owner` サイドカー 1行目 (session_id)。不在/失敗/空ファイル → null。
 *   R-CM-036 の worktree-session-owner-guard.readSessionOwner と同一の意味。サイドカーパスの SSOT は
 *   worktree-plan-path.mjs#worktreeOwnerPath — hook 間での直接 import 禁止 (R-CM-006) なため lib のみを共有する。
 *   `worktree-owner-tracker` (PostToolUse) が worktree 生成時に 1行記録する。
 */
export function readSessionOwner(worktreePath, branch = null) {
  try {
    const id = readFileSync(worktreeOwnerPath(worktreePath, branch), 'utf-8').split('\n')[0].trim();
    return id || null;
  } catch {
    return null;
  }
}

/**
 * 本 Stop セッションが worktree を所有するか判定 (R-CM-036 2-Layer モデルを Stop 時点で整合適用)。
 *   Layer 1 — cwd-confinement (session_id 無関係、決定論的): 現在の cwd がこの worktree 内部であれば 'owned'。
 *     Codex/Antigravity は worktree に cd して作業するため (cwd=worktree)、この軸で自身の worktree を
 *     判定する。session_id が stdin にない CLI でも shipping nag が維持される核心。
 *   Layer 2 — session_id サイドカー: `.session-owner` === 現在の session_id であれば 'owned'。
 *     brief2dev Claude Code は cwd=main 固定 (learnings bash-cwd-reset-worktree) のため、サイドカーが
 *     唯一の所有シグナルである。`make wt.new` が常にサイドカーを残すため、単一セッションは正常に 'owned'。
 *   サイドカー owner が存在するが現在の session_id と不一致 → 'other' (他セッション所有)。
 *   どちらも未確定 (サイドカー不在 + cwd 不一致、または session_id 不在) → 'orphan'。
 *
 *   判定の目的: 他セッション/orphan worktree の未完了作業により本セッションの Stop を遮断しないこと。
 *   R-CM-036 アンチパターン「すべての worktree を検査する Stop hook」の cross-session 誤遮断を回避。
 *
 *   @param {string} wtPath - worktree ルートの絶対パス (git worktree list porcelain 基準)
 *   @param {string|null} branch - branch 名 (サイドカーパス推論用)
 *   @param {{sessionId?: string, cwd?: string, _resolveWorktreeRoot?: Function, _readSessionOwner?: Function}} opts
 *   @returns {'owned'|'other'|'orphan'}
 */
export function classifyOwnership(wtPath, branch, opts = {}) {
  const _resolveWorktreeRoot = opts._resolveWorktreeRoot || resolveWorktreeRoot;
  const _readSessionOwner = opts._readSessionOwner || readSessionOwner;
  const sessionId = opts.sessionId;

  // Layer 1 — cwd-confinement (決定論的, session_id 無関係)
  const cwdWt = _resolveWorktreeRoot(opts.cwd || '');
  if (cwdWt && cwdWt === wtPath) return 'owned';

  // Layer 2 — session_id サイドカー
  const owner = _readSessionOwner(wtPath, branch);
  if (owner && sessionId) {
    return owner === sessionId ? 'owned' : 'other';
  }
  // サイドカー不在 (orphan) または session_id 不在 → 所有未確定
  return 'orphan';
}

export function evaluate(projectDir, opts = {}) {
  const _now = opts._now || Date.now;
  const _isFresh = opts._isFresh || isFresh;
  const _safeGit = opts._safeGit || safeGit;
  const _countUnmerged = opts._countUnmerged || countUnmergedCommits;
  const _countUncommitted = opts._countUncommitted || countUncommittedChanges;
  const _isPlanPresent = opts._isPlanPresent || ((p) => isPlanPresent(p, opts));
  const _readPlanChecklistStatus =
    opts._readPlanChecklistStatus ||
    ((wtPath, branch) => {
      if (Object.prototype.hasOwnProperty.call(opts, '_isPlanPresent')) {
        const present = _isPlanPresent(wtPath);
        return {
          present,
          complete: present,
          unreadable: false,
          unchecked_count: present ? 0 : null,
          unchecked: [],
          plan_path: resolveWorktreePlanPath(wtPath, branch),
        };
      }
      return readWorktreePlanChecklistStatus(wtPath, branch);
    });
  const _collectReviewSnapshot =
    opts._collectReviewSnapshot ||
    ((wtPath, branch) => collectReviewSnapshot(wtPath, { _safeGit, branch }));
  const _measureStaleness =
    opts._measureStaleness || ((p) => measureStaleness(p, { _safeGit, _now }));
  // R-CM-036 セッション所有権フィルター — 本 Stop セッションが所有しない worktree は遮断対象から除外。
  const _classifyOwnership =
    opts._classifyOwnership ||
    ((wtPath, branch) => classifyOwnership(wtPath, branch, { sessionId: opts.sessionId, cwd: opts.cwd }));

  // /create-pr 進行中 → 通過
  const activeFlag = join(projectDir, '.tmp', 'create-pr-active');
  if (_isFresh(activeFlag, CREATE_PR_ACTIVE_TTL_MS)) {
    return { block: false, candidates: [], skipped_attempt: [], not_owned: [], reason: 'create-pr-active 新鮮' };
  }

  // worktree リスト
  const wtOut = _safeGit('worktree list --porcelain', projectDir, { timeout: 3000 });
  if (wtOut === null) {
    return { block: false, candidates: [], skipped_attempt: [], not_owned: [], reason: 'worktree list 失敗' };
  }

  const worktrees = parseWorktreeList(wtOut);
  const candidates = [];
  const skipped_attempt = []; // M3 — マーカー新鮮により skip された worktree (ユーザー認知用)
  const not_owned = []; // R-CM-036 — 他セッション/orphan 所有のため遮断しなかった worktree (ユーザー認知用)

  for (const wt of worktrees) {
    if (!wt.branch) continue; // detached HEAD 無視
    if (wt.branch === 'main') continue; // main 自体の worktree は本 hook 対象外
    if (isEscapeHatchBranch(wt.branch)) continue; // escape hatch
    if (wt.path === projectDir) continue; // main repo 自体

    const uncommitted = _countUncommitted(wt.path);
    const commits = _countUnmerged(wt.path);
    if (commits === 0 && uncommitted === 0) continue;

    // R-CM-036 セッション所有権 — 本セッションが所有しない worktree (他セッション/orphan) は遮断しない。
    // (マルチセッション cross-session 誤遮断を回避。owned のみ candidate に進入。)
    const ownership = _classifyOwnership(wt.path, wt.branch);
    if (ownership !== 'owned') {
      not_owned.push({ path: wt.path, branch: wt.branch, commits, uncommitted, ownership });
      continue;
    }

    const staleness = _measureStaleness(wt.path);
    const stale_reasons = evaluateStaleness(staleness);

    if (uncommitted > 0) {
      const plan_status = commits > 0 ? _readPlanChecklistStatus(wt.path, wt.branch) : null;
      candidates.push({
        path: wt.path,
        branch: wt.branch,
        commits,
        uncommitted,
        commit_required: true,
        plan_missing: commits > 0 ? !(plan_status?.present ?? _isPlanPresent(wt.path)) : false,
        plan_status,
        review_ready: false,
        staleness,
        stale_reasons,
      });
      continue;
    }

    const marker = attemptMarkerPath(projectDir, wt.branch);
    if (_isFresh(marker, ATTEMPT_MARKER_TTL_MS)) {
      // すでに1回試行 — passthrough だがユーザー認知のために累積 (M3)
      skipped_attempt.push({
        path: wt.path,
        branch: wt.branch,
        commits,
        uncommitted,
        staleness,
        stale_reasons,
      });
      continue;
    }

    const plan_status = _readPlanChecklistStatus(wt.path, wt.branch);
    const review_ready = plan_status.present === true && plan_status.complete === true;

    candidates.push({
      path: wt.path,
      branch: wt.branch,
      commits,
      uncommitted,
      commit_required: false,
      plan_missing: !plan_status.present, // M1
      plan_status,
      review_ready,
      review: review_ready ? _collectReviewSnapshot(wt.path, wt.branch) : null,
      staleness,
      stale_reasons,
    });
  }

  if (candidates.length === 0) {
    return { block: false, candidates: [], skipped_attempt, not_owned, reason: 'no unmerged worktree' };
  }

  return {
    block: true,
    candidates,
    skipped_attempt,
    not_owned,
    reason: `${candidates.length} worktree(s) need completion`,
  };
}

/**
 * worktree path を projectDir 基準の相対パスに変換。外部パスであれば絶対パスのまま。
 */
function relativizePath(absPath, projectDir) {
  return absPath.startsWith(projectDir) ? absPath.slice(projectDir.length + 1) : absPath;
}

export function buildBlockMessage(projectDir, candidates) {
  const isReviewReady = (c) =>
    !c.commit_required &&
    (c.review_ready === true || (c.review_ready === undefined && c.plan_missing === false));
  const reviewReady = candidates.filter((c) => isReviewReady(c));
  const planBlocked = candidates.filter((c) => !c.commit_required && !isReviewReady(c));
  const lines = [
    '[worktree-shipping-guard] Stop 遮断: 完了していない worktree 作業があります。',
    '',
    'ユーザーポリシー (R-CM-030): worktree でシステムコードの変更を行った場合は、最終応答 of 前に必ず commit を残さなければなりません。',
    'commit された作業は、ユーザー確認後に /create-pr ship-worktree → squash merge → cleanup まで進行させる必要があります。',
    '誤検知防止: 本セッションが所有する worktree に uncommitted な変更または unmerged な commit がある場合のみ対象です。変更/コミットのない READ-ONLY セッションは通過します。',
    '',
    '対象 worktree:',
  ];
  for (const c of candidates) {
    const rel = relativizePath(c.path, projectDir);
    const planTag = c.plan_missing ? ' [PLAN.md 不在 — 自動作成が必要]' : '';
    const dirtyTag = c.uncommitted > 0 ? `, uncommitted=${c.uncommitted} file(s)` : '';
    const actionTag = c.commit_required ? ' [commit が必要]' : '';
    lines.push(`  - ${rel}  (branch=${c.branch}, unmerged=${c.commits} commit${dirtyTag})${actionTag}${planTag}`);
  }
  if (candidates.some((c) => c.commit_required)) {
    lines.push('');
    lines.push('uncommitted な変更がある worktree は作業完了とは見なしません。');
    lines.push('先に自身が作成した変更のみを stage/commit してください:');
    lines.push('');
    for (const c of candidates.filter((item) => item.commit_required)) {
      lines.push(`  cd "${relativizePath(c.path, projectDir)}"`);
      lines.push('  git status --short');
      lines.push('  git add <owned-files-only>');
      lines.push('  git commit -m "<Conventional Commits>"');
    }
  }
  if (candidates.some((c) => c.plan_missing)) {
    lines.push('');
    lines.push('PLAN.md 不在の worktree (M1 stop loop 回避):');
    lines.push('  - ship-worktree は PLAN.md の未チェックボックスの検証を独自に実施 — PLAN.md 不在時は拒否。');
    lines.push('  - 位置: `.tmp/worktree-<safeBranch>/PLAN.md` (worktree ルートではない、R-CM-008/R-CM-030 — マージ漏洩防止)。');
    lines.push('  - 上記の worktree に PLAN.md を先に作成 (目標 / チェックリスト / 検証 / handoff) してから ship を呼び出してください。');
    lines.push('  - またはユーザーに作業意図を確認した後に worktree 自体を廃棄。');
  }
  if (planBlocked.length > 0) {
    lines.push('');
    lines.push('PLAN.md checklist 未完了/未確認の worktree:');
    for (const c of planBlocked) {
      const status = c.plan_status ? formatPlanChecklistStatus(c.plan_status) : 'PLAN.md 状態未確認';
      lines.push(`  - ${relativizePath(c.path, projectDir)}: ${status}`);
      if (Array.isArray(c.plan_status?.unchecked) && c.plan_status.unchecked.length > 0) {
        for (const item of c.plan_status.unchecked.slice(0, 5)) lines.push(`    ${item}`);
      }
    }
    lines.push('  → 承認要請レビューは、PLAN.md checklist がすべて完了した worktree からのみ出力します。');
    lines.push('  → 先に PLAN.md を完了/キャンセル処理した後に、再度 Stop するか verify-plan を実行してください。');
  }
  lines.push('');
  if (reviewReady.length > 0) {
    lines.push('commit + 完了した PLAN.md checklist がある worktree は、以下のレビューをユーザーに出力して明示的な承認を得てください。');
    lines.push('ユーザーが「承認して進行」として明示的に確認した後にのみ、以下のコマンドを実行します (べき等 — すでに PR があれば再利用):');
    lines.push('');
    lines.push('  OPS="node .claude/scripts/create-pr/ops.mjs"');
    for (const c of reviewReady) {
      const rel = relativizePath(c.path, projectDir);
      const review = c.review || {};
      lines.push('');
      lines.push(buildPreShipApprovalReview({
        worktreePath: rel,
        branch: c.branch,
        baseBranch: review.base_branch || 'main',
        planPath: c.plan_status?.plan_path || resolveWorktreePlanPath(c.path, c.branch),
        planChecklist: c.plan_status ? formatPlanChecklistStatus(c.plan_status) : '完了',
        worktreeStatus: `clean, unmerged=${c.commits} commit`,
        gitLog: review.git_log,
        commitCount: review.commit_count ?? c.commits,
        commitRange: review.commit_range || 'origin/main..HEAD',
        latestCommit: review.latest_commit,
        changedFilesTree: review.changed_files_tree || '(収集が必要)',
        changedRows: review.changed_rows || [],
      }));
      lines.push('');
      lines.push('承認後に実行:');
      lines.push(`  $OPS verify-plan --worktree "${rel}"`);
      lines.push(`  node .claude/scripts/mark-pre-ship-confirmed.mjs "${c.branch}" --quality self_review_pass`);
      lines.push(`  $OPS ship-worktree --worktree "${rel}" --title "<Conventional Commits>" --body "<要約>"`);
    }
  } else {
    lines.push('現在、承認要請レビューを出力する worktree がありません。dirty な変更を commit するか、PLAN.md checklist を完了させてください。');
  }
  // Layer 2 — base staleness 警告 (BLOCK 追加なし — ship 時点 non-FF が遮断を担当)
  const stale = candidates.filter((c) => Array.isArray(c.stale_reasons) && c.stale_reasons.length);
  if (stale.length > 0) {
    lines.push('');
    lines.push('base freshness 警告 (Layer 2 — 遮断なし、事後ゲートは ship-worktree non-FF 検査):');
    for (const c of stale) {
      lines.push(`  - ${relativizePath(c.path, projectDir)}: ${c.stale_reasons.join(', ')}`);
    }
    lines.push('  → 次の worktree からは標準エントリーポイントを使用してください: make wt.new BR=<branch> (または node .claude/scripts/worktree-new.mjs --branch <branch>)');
    lines.push('  → 現在の worktree は ship 直前に rebase 推奨: git fetch origin main && git rebase origin/main');
  }
  lines.push('');
  lines.push('今回の試行がペンディング/失敗した場合、本 hook は次の Stop を通過させます (5分間は再遮断しません)。');
  lines.push('hotfix/* ブランチの worktree は免除されます。');
  return lines.join('\n');
}

/**
 * M3 — マーカー新鮮により passthrough 処理された worktree があれば stderr で通知。
 *   ユーザーが「ship 未遂行 + 5分再遮断なし」状態を認知できずに silently に進行する
 *   罠を遮断。settings.json hook の stderr はユーザーに露出されるが、Claude のコンテキストには
 *   影響なし — 正確に意図されたチャネル。
 */
export function emitSkippedAttemptNotice(skipped, write = (m) => process.stderr.write(m)) {
  if (!Array.isArray(skipped) || skipped.length === 0) return;
  const lines = ['[worktree-shipping-guard] passthrough — 5分試行マーカー新鮮 (再遮断なし):'];
  for (const c of skipped) {
    const staleTag =
      Array.isArray(c.stale_reasons) && c.stale_reasons.length
        ? ` [stale: ${c.stale_reasons.join(', ')}]`
        : '';
    lines.push(`  - branch=${c.branch}, unmerged=${c.commits} commit (path=${c.path})${staleTag}`);
  }
  lines.push('  → マーカー満了後に自動再遮断。即時処理するにはマーカー削除 + 再進入。');
  write(`${lines.join('\n')}\n`);
}

/**
 * R-CM-036 — 本セッションが所有しない (他セッション/orphan) worktree が未完了作業を持つが、
 *   遮断しなかった場合に stderr で通知。silent drop を遮断 — 他のセッションの WIP を本セッションが
 *   静かに無視せず、ユーザーに可視化する (block の有無に関わらず常に呼び出し)。
 *   stderr はユーザーに露出されるが、Claude のコンテキストには影響なし — 意図されたチャネル。
 */
export function emitNotOwnedNotice(notOwned, write = (m) => process.stderr.write(m)) {
  if (!Array.isArray(notOwned) || notOwned.length === 0) return;
  const lines = [
    '[worktree-shipping-guard] passthrough — 本セッション所有ではない worktree の未完了作業 (遮断なし、R-CM-036):',
  ];
  for (const c of notOwned) {
    const dirty = c.uncommitted > 0 ? `, uncommitted=${c.uncommitted} file(s)` : '';
    const tag = c.ownership === 'other' ? '他セッション所有' : 'orphan (所有セッション未詳)';
    lines.push(`  - branch=${c.branch}, unmerged=${c.commits} commit${dirty} [${tag}] (path=${c.path})`);
  }
  lines.push('  → 該当する worktree を作成したセッションで ship するか、自身の作業であればその worktree 内で進行してください。');
  write(`${lines.join('\n')}\n`);
}

export async function run(data) {
  try {
    if (isUserAbort(data) || isContextLimitStop(data)) {
      return HookOutput.passthrough();
    }
    const projectDir = resolveProjectDir(data);
    // session_id / cwd はすべての hook イベント共通の stdin フィールド (Stop 含む、公式文書) — R-CM-036 所有権判定入力。
    const verdict = evaluate(projectDir, { sessionId: data?.session_id, cwd: data?.cwd });

    // R-CM-036 — 他セッション/orphan worktree の未完了作業は block/passthrough に関わらず常に通知
    emitNotOwnedNotice(verdict.not_owned);

    // M3 — passthrough ケースでも試行マーカー新鮮により skip された項目があればユーザー通知
    if (!verdict.block) {
      emitSkippedAttemptNotice(verdict.skipped_attempt);
      return HookOutput.passthrough();
    }

    // 1回のみ試行 — ship 対象にのみマーカーを即時生成 (次の Stop は5分間通過)。
    // uncommitted な変更は「作業完了前の commit」義務があるため、マーカーによる通過はさせない。
    for (const c of verdict.candidates) {
      if (!c.commit_required && c.review_ready) touchAttemptMarker(projectDir, c.branch);
    }
    return HookOutput.block(buildBlockMessage(projectDir, verdict.candidates));
  } catch {
    return HookOutput.passthrough();
  }
}

if (!globalThis.__HOOK_ORCHESTRATOR__) {
  safeHookMainWithProfile('worktree-shipping-guard', async () => {
    const data = await readStdin();
    return output(await run(data));
  });
}
