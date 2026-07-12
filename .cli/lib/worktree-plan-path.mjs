/**
 * worktree-plan-path.mjs — worktree PLAN.md 配置場所 SSOT ヘルパー
 *
 * Why: PLAN.md が worktree ルートにあると、一度 tracked された瞬間に .gitignore が
 * 無効化されて main にマージされてしまう。`.tmp/worktree-<safeBranch>/PLAN.md` の配置は
 * .gitignore の `.tmp/` パターンにより git tracking 自体が封じられる。
 *
 * branch namespace 隔離により並列 worktree 作業の衝突も自然に解消される。
 *
 * Boundary（R-CM-028）: 観点1（brief2dev 自体）のみ適用。観点2（scaffold 内部の
 * feature-pilot の CONTEXT.json#execution.worktree.plan_path）は別扱い。
 */

import { basename, join } from 'node:path';

/**
 * branch 名をファイル/ディレクトリ安全なキーに変換。`/` → `__`。
 * pre-ship-review-guard.mjs は本関数を import する（SSOT）。
 */
export function safeBranchKey(branch) {
  return (branch || 'staged').replace(/[\/\\]/g, '__');
}

// GitHub Flow branch prefix — `.worktrees/<prefix>__name` escape 変形の reverse 対象。
// `release/*` `support/*` は意図的に未対応（R-CM-008 Rule 4: brief2dev = GitHub Flow only、git-flow 拒否）。
// ユーザー定義の brand prefix を追加する場合は本配列を更新 + tests/unit/worktree-plan-path.test.mjs に回帰ケースを追加。
// worktree-path.mjs#resolveWorktreeRoot も本配列を import（R-CM-037 2セグメント判定 SSOT 共有）。
export const KNOWN_BRANCH_PREFIXES = ['feature', 'fix', 'hotfix', 'chore', 'refactor', 'docs', 'test'];

/**
 * single-segment escape 変形（`feature__foo`）を slash 形式（`feature/foo`）に reverse する。
 * KNOWN_BRANCH_PREFIXES で始まらない場合は null を返す（正規化非適用のシグナル）。
 */
function reverseEscapeIfKnownPrefix(segment) {
  for (const prefix of KNOWN_BRANCH_PREFIXES) {
    if (segment.startsWith(`${prefix}__`)) {
      const suffix = segment.slice(prefix.length + 2);
      if (!suffix) return null; // `fix__` の空 suffix — git が trailing-slash branch を拒否するため正規化を skip
      return `${prefix}/${suffix}`;
    }
  }
  return null;
}

/**
 * worktree の絶対/相対パスから branch 名を推論する。両方の慣習を同じ branch に正規化する（R-CM-024）。
 *
 *   `.worktrees/feature/foo`            → `feature/foo`（slash 保持）
 *   `.worktrees/feature__foo`           → `feature/foo`（escape 変形の reverse、KNOWN_BRANCH_PREFIXES）
 *   `.worktrees/fix__bar-baz`           → `fix/bar-baz`
 *   `/abs/path/.worktrees/feature/baz`  → `feature/baz`
 *   `.worktrees/random__name`           → `.worktrees/random__name`（既知の prefix ではないため正規化 skip）
 *   `.worktrees/<single>`               → `.worktrees/<single>`（fallback）
 *   `<a>/<b>`                            → `<a>/<b>`（最後の2 segments）
 *
 * pre-ship-review-guard.mjs は本関数を import する（SSOT）。worktree-shipping-guard +
 * create-pr/ops.mjs も `resolveWorktreePlanPath` を通じて本関数に依存する。
 */
export function inferBranchFromWorktreePath(wtPath) {
  if (!wtPath) return null;
  const parts = wtPath.split(/[\/\\]/).filter(Boolean);
  const idx = parts.lastIndexOf('.worktrees');
  if (idx >= 0) {
    if (parts.length > idx + 2) {
      return parts.slice(idx + 1, idx + 3).join('/');
    }
    if (parts.length === idx + 2) {
      const normalized = reverseEscapeIfKnownPrefix(parts[idx + 1]);
      if (normalized) return normalized;
    }
  }
  if (parts.length >= 2 && parts[parts.length - 2] !== '.worktrees') {
    return parts.slice(-2).join('/');
  }
  return parts[parts.length - 1] || null;
}

/**
 * worktree 内での PLAN.md 相対パス（worktree ルート基準）。
 * `.tmp/worktree-<safeBranch>/PLAN.md`。
 */
export function planRelPath(branch) {
  return join('.tmp', `worktree-${safeBranchKey(branch)}`, 'PLAN.md');
}

/**
 * Pre-Ship Review Panel 確認マーカーの絶対パス。
 * pre-ship-review-guard.mjs（hook）+ mark-pre-ship-confirmed.mjs（CLI）両方から import。
 * 両呼び出し経路が同一キーを算出することを保証 → marker create/check 整合性 SSOT（R-CM-024）。
 *
 * @param {string} mainRoot — main project root の絶対パス（worktree ではない）
 * @param {string|null} branch — branch 名または null（ship-feature モード = 'staged'）
 */
export function preShipMarkerPath(mainRoot, branch) {
  return join(mainRoot, '.tmp', `pre-ship-review-confirmed-${safeBranchKey(branch)}`);
}

/**
 * worktree の絶対パスから PLAN.md の絶対パスを返す。
 * branch 未指定時は worktree path から推論する。
 */
export function resolveWorktreePlanPath(worktreePath, branch = null) {
  const inferred = branch || inferBranchFromWorktreePath(worktreePath) || basename(worktreePath);
  return join(worktreePath, planRelPath(inferred));
}

/**
 * worktree のセッション所有権サイドカー（`.session-owner`）の絶対パス（R-CM-036）。
 * `worktree-owner-tracker`（PostToolUse）が生成時に現在の session_id を1行記録し、
 * `worktree-session-owner-guard`（PreToolUse Layer 2）が読み取って所有権を判定する。
 *
 * PLAN.md と同じ `.tmp/worktree-<safeBranch>/` ディレクトリに置く — `.gitignore` の
 * `.tmp/` パターンで git tracking を封じ + branch namespace 隔離で並列 worktree 衝突を解消。
 *
 * @param {string} worktreePath — worktree ルートの絶対パス
 * @param {string|null} branch — branch 名または null（worktree path から推論）
 */
export function worktreeOwnerPath(worktreePath, branch = null) {
  const inferred = branch || inferBranchFromWorktreePath(worktreePath) || basename(worktreePath);
  return join(worktreePath, '.tmp', `worktree-${safeBranchKey(inferred)}`, '.session-owner');
}

/**
 * `git worktree list --porcelain` の出力をパースする。
 * 各 entry: { path, branch }（branch は 'refs/heads/' を除去した short name、detached 時は null）。
 * 副作用のない本 lib に置く（hook モジュール import 時の bottom auto-run 副実行を回避）。
 * worktree-shipping-guard.mjs / worktree-owner-tracker.mjs が本関数を import（SSOT）。
 * `.filter((e) => e.path)` — path のない detached/incomplete block を除外（worktree-shipping-guard の動作を保持）。
 *
 * @param {string} stdout
 * @returns {Array<{path: string, branch: string|null}>}
 */
export function parseWorktreeList(stdout) {
  if (!stdout) return [];
  const blocks = stdout.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const entry = { path: null, branch: null };
    for (const line of block.split('\n')) {
      if (line.startsWith('worktree ')) entry.path = line.slice('worktree '.length).trim();
      else if (line.startsWith('branch ')) {
        entry.branch = line.slice('branch '.length).trim().replace(/^refs\/heads\//, '');
      }
    }
    return entry;
  }).filter((e) => e.path);
}
