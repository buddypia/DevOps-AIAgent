/**
 * heredoc-strip.mjs - Bash heredoc body 除去 helper (lib SSOT)
 *
 * Bash heredoc body 内のテキストは *データ* であって *呼び出しコンテキスト* ではない。
 * Hook 群が命令 string を検査する際に、heredoc body 内の trigger string まで
 * false-positive で遮断してしまう問題を root cause から遮断する。
 *
 * 処理する変形:
 *   `<<EOF`         — 基本
 *   `<<-EOF`        — tab strip 変形
 *   `<<'EOF'`       — single-quoted (変数展開なし)
 *   `<<"EOF"`       — double-quoted
 *   複数 heredoc    — global flag で順次除去
 *
 * 非処理 (R-CM-029 Rule 4 Surgical):
 *   - quoted string 内の trigger (`echo "ship-worktree"`) — anchor (hook-anchors.mjs CMD_ANCHOR_SRC) で遮断
 *   - shell comment (`# ship-worktree`) — 別途 PR 候補
 *
 * 使用 hook: pre-ship-review-guard (line 58), destructive-git-guard (checkDestructiveGit)。
 * cross-hook circular execution の回避 — pre-ship-review-guard の top-level main ガードが
 * standalone 実行時にトリガーされ、直接 import すると stdout 衝突が発生する。本 lib として分離する。
 */

const HEREDOC_PATTERN =
  /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n[\s\S]*?\n[ \t]*\2(?=\r?\n|$)/g;

/**
 * 命令から heredoc body をすべて除去して inspection-safe な string を返す。
 *
 * @param {string} command - Bash 命令
 * @returns {string} heredoc body を除去した命令 (string 以外の入力はそのまま返す)
 */
export function stripHeredocBodies(command) {
  if (typeof command !== 'string') return command;
  // Fast-path — heredoc opener `<<` が不在の場合は regex への進入を回避。PreToolUse Bash hook の
  // 95%+ のケース (単純な git/ls/npm) は heredoc なし。.includes による scan は regex の
  // [\s\S]*? の backtracking コストよりはるかに安価。
  if (!command.includes('<<')) return command;
  return command.replace(HEREDOC_PATTERN, '');
}
