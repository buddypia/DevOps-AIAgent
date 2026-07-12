#!/usr/bin/env node

/**
 * worktree-shipping-guard.mjs - Stop Hook
 *
 * worktree 内に uncommitted な変更または unmerged commit がある場合、Stop を BLOCK する。
 * uncommitted な変更はまず commit するよう促し、unmerged commit はユーザーに PR/merge を進めるか
 * 確認したうえで、明示的な確認があった場合のみ `/create-pr ship-worktree` の実行を誘導する。
 *
 * ポリシー SSOT: R-CM-030 (worktree-auto-ship.md) + R-CM-036 (worktree-session-ownership.md)
 *
 * 動作:
 *   - user abort / context limit → passthrough (ユーザーの明示的な中断を尊重)
 *   - .tmp/create-pr-active が新鮮 (30min) → passthrough (/create-pr 進行中)
 *   - すべての worktree が次のいずれかに該当する場合 → passthrough
 *       · main ブランチ (worktree list の先頭 entry)
 *       · hotfix/* / hotfix-* ブランチ (escape hatch, R-CM-008 整合)
 *       · 本セッション所有でない worktree (他セッション / orphan — R-CM-036 セッション所有権フィルタ)
 *       · 試行マーカーが新鮮 (5min) — すでに一度 ship を試行した clean worktree
 *       · origin/main..HEAD が空で uncommitted な変更もない
 *   - 本セッション所有 (owned) + uncommitted な変更がある worktree が 1 件以上 → BLOCK (試行マーカーは生成しない)
 *   - 上記以外で owned + unmerged commit がある worktree が 1 件以上 → 試行マーカー生成 + BLOCK
 *   - error → passthrough (R-CM-006 Rule 2 fail-open)
 *
 * セッション所有権 (R-CM-036, 2-Layer): Stop stdin の session_id + cwd で、所有する worktree のみを
 *   遮断対象に含める。Layer 1 = cwd が worktree 内部 (Codex/Antigravity)、Layer 2 = `.session-owner`
 *   サイドカー === session_id (Claude Code, cwd=main)。他セッション/orphan は stderr 通知後 passthrough。
 *
 * ユーザー決定 (2026-05-10):
 *   - トリガー: uncommitted な変更、または commit + unmerged 時に BLOCK
 *   - 失敗ポリシー: 一度試行した後は次の Stop を通過させる (ユーザーに報告して停止)
 *     ただし uncommitted な変更は作業完了とみなせないため、マーカーで通過させない。
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
// worktree ルート判定 = 単一 SSOT (R-CM-037)。セッション軸と無関係な純粋関数。
import { resolveWorktreeRoot } from '../lib/worktree-path.mjs';
// parseWorktreeList SSOT は worktree-plan-path.mjs (R-CM-036 worktree-owner-tracker と共有)。
// 既存の import 契約 (テスト + 外部 import) を保存するためローカルバインディングを re-export。
export { parseWorktreeList };

const CREATE_PR_ACTIVE_TTL_MS = 30 * 60 * 1000; // 30 min — /create-pr 進行中マーカー
const ATTEMPT_MARKER_TTL_MS = 5 * 60 * 1000; // 5 min — 一度試行した後、ユーザーに報告して停止
const ESCAPE_HATCH_PATTERNS = [/^hotfix\//, /^hotfix-/];

// Layer 2 staleness 閾値 (ユーザー決定なし — AI default; R-CM-033 #6 パターン、運用後に調整)。
// 測定は **すでに fetch 済みの origin/main** 基準 (ネットワーク呼び出しなし — Stop hook のコスト回避)。
// worktree-new.mjs が初回進入時に fetch するため baseline は新鮮。時間経過で stale が可視化される。
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
 * worktree の unmerged commit 数。
 *   - origin/main を優先、不在時は main にフォールバック。
 *   - git rev-list 失敗 → 0 (保守的、fail-open による false negative)。
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
 *   - tracked の変更 + untracked ファイルを含む
 *   - git status 失敗 → 0 (fail-open)
 */
export function countUncommittedChanges(worktreePath) {
  const out = safeGit('status --porcelain --untracked-files=all', worktreePath, { timeout: 3000 });
  if (out === null) return 0;
  if (!out.trim()) return 0;
  return out.split('\n').filter((line) => line.trim().length > 0).length;
}

/**
 * worktree base freshness 測定 (Layer 2 — 測定のみ、遮断は追加しない)。
 *   - behind: HEAD が origin/main からどれだけ遅れているか (commit 数)
 *   - merge_base_age_days: merge-base(HEAD, origin/main) commit からの経過日数
 *   - origin/main がなければ main にフォールバック。両方なければ null (測定不可 — fail-open)。
 *   - ネットワーク呼び出しはしない — すでに fetch 済みの ref 基準。Stop hook のコスト回避。
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
 * staleness 測定結果を閾値と比較。閾値超過時は reason 配列を返し、そうでなければ [] を返す。
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
 * 試行マーカーのパス。branch のスラッシュは `__` に置換 (filename safe)。
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
 * Stop hook のコア判定。
 *   @param {string} projectDir - main repo path
 *   @returns {{ block: boolean, candidates: Array<{path, branch, commits, uncommitted, commit_required?: boolean}>, reason: string }}
 */
/**
 * worktree 内に PLAN.md が存在するか検査 (M1 — stop loop 回避のための事前案内)。
 *   ship-worktree は PLAN.md 不在時に拒否 → 5分マーカー後の再遮断が無限に繰り返される危険がある。
 *   本検査は BLOCK メッセージに plan_missing 情報を載せ、AI が自動作成するよう誘導する。
 */
export function isPlanPresent(worktreePath, opts = {}) {
  const _existsSync = opts._existsSync || existsSync;
  // PLAN.md の位置: .tmp/worktree-<safeBranch>/PLAN.md (worktree-plan-path.mjs SSOT)。
  // 従来の worktree ルート直下の PLAN.md は、マージ漏出を防ぐため廃止。
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
 * worktree の `.session-owner` サイドカーの 1 行目 (session_id)。不在/失敗/空ファイル → null。
 *   R-CM-036 の worktree-session-owner-guard.readSessionOwner と同義。サイドカーのパス SSOT は
 *   worktree-plan-path.mjs#worktreeOwnerPath — hook 間の直接 import は禁止 (R-CM-006) のため lib のみ共有する。
 *   `worktree-owner-tracker` (PostToolUse) が worktree 生成時に 1 行記録する。
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
 * 本 Stop セッションが worktree を所有しているか判定する (R-CM-036 の 2-Layer モデルを Stop 時点で整合適用)。
 *   Layer 1 — cwd-confinement (session_id 無関係、決定論的): 現在の cwd がこの worktree 内部なら 'owned'。
 *     Codex/Antigravity は worktree に cd して作業するため (cwd=worktree)、この軸で自分の worktree を
 *     判定する。session_id が stdin にない CLI でも shipping nag が維持される要。
 *   Layer 2 — session_id サイドカー: `.session-owner` === 現在の session_id なら 'owned'。
 *     brief2dev の Claude Code は cwd=main 固定 (learnings bash-cwd-reset-worktree) のためサイドカーが
 *     唯一の所有シグナルとなる。`make wt.new` が常にサイドカーを残すため単一セッションは正常に 'owned' となる。
 *   サイドカーの owner が存在するが現在の session_id と不一致 → 'other' (他セッション所有)。
 *   両方とも未確定 (サイドカー不在 + cwd 不一致、または session_id 不在) → 'orphan'。
 *
 *   判定の目的: 他セッション/orphan worktree の未完了作業によって本セッションの Stop を遮断しない。
 *   R-CM-036 Anti-Pattern「すべての worktree を検査する Stop hook」の cross-session 誤遮断回避。
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

  // Layer 1 — cwd-confinement (決定論的、session_id 無関係)
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
  // R-CM-036 セッション所有権フィルタ — 本 Stop セッションが所有しない worktree は遮断対象から除外。
  const _classifyOwnership =
    opts._classifyOwnership ||
    ((wtPath, branch) => classifyOwnership(wtPath, branch, { sessionId: opts.sessionId, cwd: opts.cwd }));

  // /create-pr 進行中 → 通過
  const activeFlag = join(projectDir, '.tmp', 'create-pr-active');
  if (_isFresh(activeFlag, CREATE_PR_ACTIVE_TTL_MS)) {
    return { block: false, candidates: [], skipped_attempt: [], not_owned: [], reason: 'create-pr-active が新鮮' };
  }

  // worktree 一覧
  const wtOut = _safeGit('worktree list --porcelain', projectDir, { timeout: 3000 });
  if (wtOut === null) {
    return { block: false, candidates: [], skipped_attempt: [], not_owned: [], reason: 'worktree list 失敗' };
  }

  const worktrees = parseWorktreeList(wtOut);
  const candidates = [];
  const skipped_attempt = []; // M3 — マーカーが新鮮なため skip された worktree (ユーザー認知用)
  const not_owned = []; // R-CM-036 — 他セッション/orphan 所有のため遮断しなかった worktree (ユーザー認知用)

  for (const wt of worktrees) {
    if (!wt.branch) continue; // detached HEAD は無視
    if (wt.branch === 'main') continue; // main 自体の worktree は本 hook の対象外
    if (isEscapeHatchBranch(wt.branch)) continue; // escape hatch
    if (wt.path === projectDir) continue; // main repo 自体

    const uncommitted = _countUncommitted(wt.path);
    const commits = _countUnmerged(wt.path);
    if (commits === 0 && uncommitted === 0) continue;

    // R-CM-036 セッション所有権 — 本セッションが所有しない worktree (他セッション/orphan) は遮断しない。
    // (マルチセッション cross-session 誤遮断の回避。owned のみ candidate に進入。)
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
      // すでに一度試行済み — passthrough だがユーザー認知のため累積 (M3)
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
 * worktree path を projectDir 基準の相対パスに変換。外部パスならそのまま絶対パスを返す。
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
    '[worktree-shipping-guard] Stop 遮断: 未完了の worktree 作業があります。',
    '',
    'ユーザーポリシー (R-CM-030): worktree でシステムコードの変更を行った場合、最終応答前に必ず commit を残す必要があります。',
    'commit された作業は、ユーザー確認後 /create-pr ship-worktree → squash merge → cleanup まで進める必要があります。',
    '誤検知防止: 本セッション所有の worktree に uncommitted な変更または unmerged commit がある場合のみ対象です。変更/commit がない READ-ONLY セッションは通過します。',
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
    lines.push('uncommitted な変更がある worktree は作業完了とみなしません。');
    lines.push('まず自分が作成した変更のみを stage/commit してください:');
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
    lines.push('  - ship-worktree は PLAN.md のチェックボックス未検証を自ら実施 — PLAN.md 不在時は拒否します。');
    lines.push('  - 位置: `.tmp/worktree-<safeBranch>/PLAN.md` (worktree ルートではない、R-CM-008/R-CM-030 — マージ漏出防止)。');
    lines.push('  - 上記 worktree に PLAN.md を先に作成 (目標 / チェックリスト / 検証 / handoff) してから ship を呼び出してください。');
    lines.push('  - またはユーザーに作業意図を確認したうえで worktree 自体を破棄してください。');
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
    lines.push('  → 承認依頼レビューは PLAN.md checklist がすべて完了した worktree でのみ出力します。');
    lines.push('  → 先に PLAN.md を完了/キャンセル処理したうえで再度 Stop するか、verify-plan を実行してください。');
  }
  lines.push('');
  if (reviewReady.length > 0) {
    lines.push('commit + 完了した PLAN.md checklist がある worktree は、以下のレビューをユーザーに出力し、明示的な承認を得てください。');
    lines.push('ユーザーが「承認して進める」と明示的に確認した後にのみ次のコマンドを実行します (冪等 — 既に PR があれば再利用):');
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
    lines.push('現在、承認依頼レビューを出力できる worktree がありません。dirty な変更を commit するか、PLAN.md checklist を完了してください。');
  }
  // Layer 2 — base staleness 警告 (BLOCK は追加しない — ship 時点の non-FF 検査が遮断を担当)
  const stale = candidates.filter((c) => Array.isArray(c.stale_reasons) && c.stale_reasons.length);
  if (stale.length > 0) {
    lines.push('');
    lines.push('base freshness 警告 (Layer 2 — 遮断なし、事後ゲートは ship-worktree の non-FF 検査):');
    for (const c of stale) {
      lines.push(`  - ${relativizePath(c.path, projectDir)}: ${c.stale_reasons.join(', ')}`);
    }
    lines.push('  → 次回の worktree からは標準エントリポイントを使用してください: make wt.new BR=<branch> (または node .claude/scripts/worktree-new.mjs --branch <branch>)');
    lines.push('  → 現在の worktree は ship 直前の rebase を推奨します: git fetch origin main && git rebase origin/main');
  }
  lines.push('');
  lines.push('今回一度の試行後、pending/失敗の場合、本 hook は次の Stop を通過させます (5分間は再遮断しません)。');
  lines.push('hotfix/* ブランチの worktree は対象外です。');
  return lines.join('\n');
}

/**
 * M3 — マーカーが新鮮なため passthrough 処理された worktree があれば stderr 通知。
 *   ユーザーが「ship 未実行 + 5分間再遮断なし」の状態に気づかず silently 進行してしまう
 *   落とし穴を防止する。settings.json hook の stderr はユーザーに露出されるが Claude の
 *   コンテキストには影響しない — 意図された通知チャネル。
 */
export function emitSkippedAttemptNotice(skipped, write = (m) => process.stderr.write(m)) {
  if (!Array.isArray(skipped) || skipped.length === 0) return;
  const lines = ['[worktree-shipping-guard] passthrough — 5分試行マーカーが新鮮 (再遮断しません):'];
  for (const c of skipped) {
    const staleTag =
      Array.isArray(c.stale_reasons) && c.stale_reasons.length
        ? ` [stale: ${c.stale_reasons.join(', ')}]`
        : '';
    lines.push(`  - branch=${c.branch}, unmerged=${c.commits} commit (path=${c.path})${staleTag}`);
  }
  lines.push('  → マーカー失効後に自動で再遮断されます。即座に処理する場合はマーカーを削除して再進入してください。');
  write(`${lines.join('\n')}\n`);
}

/**
 * R-CM-036 — 本セッションが所有していない (他セッション/orphan) worktree に未完了作業があるが
 *   遮断しなかった場合の stderr 通知。silent drop の防止 — 他セッションの WIP を本セッションが
 *   黙って無視せず、ユーザーに可視化する (block の有無にかかわらず常に呼び出す)。
 *   stderr はユーザーに露出されるが Claude のコンテキストには影響しない — 意図された通知チャネル。
 */
export function emitNotOwnedNotice(notOwned, write = (m) => process.stderr.write(m)) {
  if (!Array.isArray(notOwned) || notOwned.length === 0) return;
  const lines = [
    '[worktree-shipping-guard] passthrough — 本セッション所有でない worktree の未完了作業 (遮断しません, R-CM-036):',
  ];
  for (const c of notOwned) {
    const dirty = c.uncommitted > 0 ? `, uncommitted=${c.uncommitted} file(s)` : '';
    const tag = c.ownership === 'other' ? '他セッション所有' : 'orphan (所有セッション不明)';
    lines.push(`  - branch=${c.branch}, unmerged=${c.commits} commit${dirty} [${tag}] (path=${c.path})`);
  }
  lines.push('  → 該当 worktree を作成したセッションで ship するか、自分の作業であればその worktree 内で進めてください。');
  write(`${lines.join('\n')}\n`);
}

export async function run(data) {
  try {
    if (isUserAbort(data) || isContextLimitStop(data)) {
      return HookOutput.passthrough();
    }
    const projectDir = resolveProjectDir(data);
    // session_id / cwd はすべての hook イベント共通の stdin フィールド (Stop を含む、公式文書) — R-CM-036 所有権判定の入力。
    const verdict = evaluate(projectDir, { sessionId: data?.session_id, cwd: data?.cwd });

    // R-CM-036 — 他セッション/orphan worktree の未完了作業は block/passthrough に関係なく常に通知
    emitNotOwnedNotice(verdict.not_owned);

    // M3 — passthrough のケースでも試行マーカーが新鮮で skip された項目があればユーザーに通知
    if (!verdict.block) {
      emitSkippedAttemptNotice(verdict.skipped_attempt);
      return HookOutput.passthrough();
    }

    // 一度だけ試行 — ship 対象にのみマーカーを即座に生成 (次の Stop は5分間通過)。
    // uncommitted な変更は「作業完了前に commit」する義務があるため、マーカーで通過させない。
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
