/**
 * worktree-path.mjs — 「このターゲット絶対パスがどの worktree に属するか」の単一 SSOT。
 *
 * 根本的な設計原則 (R-CM-037 Worktree Target-Context):
 *   path 分類 hook の worktree 判定は **編集対象の絶対パス** のみで決定する。
 *   トリガーとなったセッションの ENV/cwd/CLAUDE_PROJECT_DIR(=resolveProjectDir) には絶対に
 *   依存しない。セッション軸は per-target 判定において誤った軸 — マルチセッション worktree で
 *   wt1 セッションが wt2/自身の worktree を誤判定(cross-worktree コンテキストの誤伝達)する。
 *
 * 本モジュールは **純粋関数のみ** を提供する — ファイル読み込み・git 呼び出し・グローバル状態は 0。
 *   → マルチセッション・マルチ worktree の同時呼び出しでも、共有状態の衝突が構造的に不可能。
 *   → hook モジュールではないため、import しても standalone な stdin 先行消費の副作用がない。
 *
 * worktree パス規約 (R-CM-034 "Worktree 運用"): すべての worktree は
 *   `<repo-root>/.worktrees/<branch>` の下。GitHub Flow ブランチは `<type>/<slug>` の
 *   2 セグメント (`feature/foo`) — 先頭セグメントが KNOWN_BRANCH_PREFIXES のときのみ 2-seg
 *   と判定する。escape 変形 (`hotfix-foo`) ・非標準の単一名 (`wt1`) は 1-seg。
 */

import { KNOWN_BRANCH_PREFIXES } from './worktree-plan-path.mjs';

/**
 * 絶対パスが `.worktrees/<a>[/<b>]` の下なら、その worktree ルートの絶対パスを返す。
 * `.worktrees/` の下でない → null。
 *
 * - lastIndexOf — 入れ子の `.worktrees/` 時は最も内側(ファイルの実際の所属)を優先。
 * - **2 セグメント(`<prefix>/<slug>`) 判定は先頭セグメントが正確に KNOWN_BRANCH_PREFIXES
 *   のときのみ**。そうすることで、単一セグメント worktree (`hotfix-foo` / `wt1`) の配下ファイルを
 *   2 セグメントと誤判定して自身の worktree 内の作業を false-deny しない (DEBT-182)。
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
 * 絶対パスが何らかの worktree 内にあるか (boolean shortcut)。
 * セッションの ENV/cwd/projectDir とは完全に無関係 — ターゲットパスのセグメントのみを見る。
 *
 * @param {string} absPath
 * @returns {boolean}
 */
export function isWorktreeAbsPath(absPath) {
  return resolveWorktreeRoot(absPath) !== null;
}
