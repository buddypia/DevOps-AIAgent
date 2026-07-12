/**
 * hook-anchors.mjs - Hook 正規表現 anchor SSOT
 *
 * PreToolUse Bash hook が命令の先頭（`^`）または chain operator（`;` `&&` `||` `|`）
 * または newline（shell 命令の区切り文字）の直後だけにマッチするための共通 anchor。
 *
 * 単純な word boundary `\b` は診断コード / quoted string / heredoc body / grep / echo
 * 内の trigger string まで false-positive でマッチしてしまう（PR #493 root cause F1-F5）。
 *
 * 本 lib により 5 hook（commit-guard / destructive-git-guard / dev-server-guard /
 * pre-ship-review-guard / worktree-policy-guard）の anchor inline 18箇所以上を単一の
 * SSOT に統合。silent diverge のリスクを遮断 — 1つの hook の anchor だけが変わっても他の
 * hook が stale になる cluster 再発経路を遮断する。
 */

/**
 * 命令の先頭 / chain operator / newline / command substitution 直後だけにマッチする anchor。
 *
 * 境界の種類:
 *   - `^`            命令の先頭
 *   - `[;&|\n]\s*`   chain operator（`;` `&&` `||` `|`）/ newline
 *   - `\$\(\s*`      command substitution `$(...)` — inner 命令は shell が実際に実行する（DEBT-79）
 *   - `` `\s* ``     legacy backtick substitution — 同様に実際に実行される
 *
 * subshell/backtick 内の git 命令は `echo` の *リテラル引数*（実行されない）とは異なり shell が
 * 実際に実行するため、destructive/commit/ship trigger の検査対象になる（例: `echo $(git stash clear)`
 * は stash clear が実際に実行される）。heredoc body（データ）は stripHeredocBodies が別途除去するため、
 * 本 anchor とは直交する。commit -m 本文内の `$(...)` は stripCommitMessageBody が先に除去する。
 *
 * Note: `\\n` という JS string literal は RegExp 生成時に `\n` regex metachar（実際の newline）として
 * 解釈される。将来の修正者が `\\n` → `\n`（single backslash）に誤って変更すると、regex は literal
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
 * @param {string} patternSrc - anchor の後ろに付ける正規表現 source（string、RegExp ではない）
 * @param {string} [flags=''] - RegExp flags（i/g など）
 * @returns {RegExp}
 */
export function anchoredPattern(patternSrc, flags = '') {
  return new RegExp(CMD_ANCHOR_SRC + patternSrc, flags);
}
