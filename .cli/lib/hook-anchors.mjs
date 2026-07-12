/**
 * hook-anchors.mjs - Hook 正規表現 anchor の SSOT
 *
 * PreToolUse Bash hook 群が、命令の開始 (`^`) または chain operator (`;` `&&` `||` `|`)
 * または newline (shell 命令の分離子) の直後のみをマッチさせるための共通 anchor。
 *
 * 単純な word boundary `\b` は、診断コード / quoted string / heredoc body / grep / echo
 * の中の trigger string まで false-positive でマッチしてしまう (PR #493 root cause F1-F5)。
 *
 * 本 lib により 5 hook (commit-guard / destructive-git-guard / dev-server-guard /
 * pre-ship-review-guard / worktree-policy-guard) の anchor inline 18+ 箇所を単一の
 * SSOT に統合する。silent diverge のリスクを遮断 — ある hook の anchor だけが変わっても他の
 * hook が stale になる cluster の再発経路を遮断する。
 */

/**
 * 命令の開始 / chain operator / newline / command substitution の直後のみをマッチする anchor。
 *
 * 境界の種類:
 *   - `^`            命令の開始
 *   - `[;&|\n]\s*`   chain operator (`;` `&&` `||` `|`) / newline
 *   - `\$\(\s*`      command substitution `$(...)` — inner の命令は shell が実際に実行する (DEBT-79)
 *   - `` `\s* ``     legacy backtick substitution — 同様に実際に実行される
 *
 * subshell/backtick 内の git 命令は、`echo` の *リテラル引数* (実行されない) と異なり shell が
 * 実際に実行するため、destructive/commit/ship trigger の検査対象である (例: `echo $(git stash clear)`
 * は stash clear が実際に実行される)。heredoc body (データ) は stripHeredocBodies が別途除去するため、
 * 本 anchor とは直交する。commit -m 本文内の `$(...)` は stripCommitMessageBody が先に除去する。
 *
 * Note: `\\n` の JS string literal → RegExp 生成時に `\n` regex metachar (実際の newline) として解釈される。
 * 今後の修正者が `\\n` → `\n` (single backslash) に誤って変更すると、regex は literal な
 * `\` + `n` の2文字として解釈され newline マッチが壊れる。JS string escape level の保存義務。
 */
export const CMD_ANCHOR_SRC = '(?:^|[;&|\\n]\\s*|\\$\\(\\s*|`\\s*)';

/**
 * pattern source の前に anchor を prepend して RegExp を生成する。
 *
 * 使用例:
 *   anchoredPattern('git\\s+commit\\b', 'i')
 *   → /(?:^|[;&|\n]\s*)git\s+commit\b/i
 *
 * @param {string} patternSrc - anchor の後に付ける正規表現 source (string であり RegExp ではない)
 * @param {string} [flags=''] - RegExp flags (i/g など)
 * @returns {RegExp}
 */
export function anchoredPattern(patternSrc, flags = '') {
  return new RegExp(CMD_ANCHOR_SRC + patternSrc, flags);
}
