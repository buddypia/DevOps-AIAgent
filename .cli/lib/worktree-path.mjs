/**
 * worktree-path.mjs — 「この対象絶対パスがどの worktree に属するか」の単一 SSOT。
 *
 * 根本設計原則（R-CM-037 Worktree Target-Context）:
 *   path 分類 hook の worktree 判定は **編集対象の絶対パス** のみで決定する。
 *   トリガーセッションの ENV/cwd/CLAUDE_PROJECT_DIR（=resolveProjectDir）に絶対に
 *   依存しない。セッション軸は per-target 判定には誤った軸 — マルチセッション worktree で
 *   wt1 セッションが wt2/自分の worktree を誤判定する（cross-worktree コンテキストの誤伝達）。
 *
 * 本モジュールは **純粋関数のみ** を提供する — ファイル読み込み・git 呼び出し・グローバル状態は0。
 *   → マルチセッション・マルチ worktree の同時呼び出しでも共有状態の衝突が構造的に発生しない。
 *   → hook モジュールではないため、import しても standalone stdin 先行消費の副作用がない。
 *
 * worktree パス規約（R-CM-034「Worktree 運用」）: すべての worktree は
 *   `<repo-root>/.worktrees/<branch>` 配下。GitHub Flow ブランチは `<type>/<slug>`
 *   の2セグメント（`feature/foo`）— 最初のセグメントが KNOWN_BRANCH_PREFIXES の場合のみ 2-seg
 *   と判定する。escape 変形（`hotfix-foo`）・非標準の単一名（`wt1`）は 1-seg。
 */

import { KNOWN_BRANCH_PREFIXES } from './worktree-plan-path.mjs';

/**
 * 絶対パスが `.worktrees/<a>[/<b>]` 配下ならその worktree ルートの絶対パスを返す。
 * `.worktrees/` 配下でなければ null。
 *
 * - lastIndexOf — ネストした `.worktrees/` の場合、最も内側（ファイルの実際の所属）を優先。
 * - **2セグメント（`<prefix>/<slug>`）判定は最初のセグメントが正確に KNOWN_BRANCH_PREFIXES
 *   の場合のみ**。そうしないと単一セグメントの worktree（`hotfix-foo` / `wt1`）配下のファイルを
 *   2セグメントと誤判定し、自分の worktree 内の作業を false-deny してしまう（DEBT-182）。
 *
 * @param {string} absPath
 * @returns {string|null}
 */
export function resolveWorktreeRoot(absPath) {
  if (!absPath || typeof absPath !== 'string') return null;
  const norm = absPath.replace(/\\/g, '/');
  const idx = norm.lastIndexOf('/.worktrees/');
  if (idx === -1) return null;
  const after = norm.slice(idx + '/.worktrees/'.length).split('/').filter(Boolean);
  if (after.length === 0) return null;
  const base = norm.slice(0, idx) + '/.worktrees';
  if (after.length >= 2 && KNOWN_BRANCH_PREFIXES.includes(after[0])) {
    return `${base}/${after[0]}/${after[1]}`;
  }
  return `${base}/${after[0]}`;
}

/**
 * 絶対パスがいずれかの worktree 内かどうか（boolean shortcut）。
 * セッション ENV/cwd/projectDir とは完全に無関係 — 対象パスのセグメントのみを見る。
 *
 * @param {string} absPath
 * @returns {boolean}
 */
export function isWorktreeAbsPath(absPath) {
  return resolveWorktreeRoot(absPath) !== null;
}
