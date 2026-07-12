/**
 * apply-patch-paths.mjs — Codex `apply_patch` 対象ファイルパス抽出（純粋 lib SSOT）
 *
 * Codex CLI はファイル編集時に必ず `tool_name: "apply_patch"` を送信し、パッチ本文は
 * `tool_input.command` 文字列に格納される（codex 公式 spec: "Bash and apply_patch use
 * tool_input.command" — https://developers.openai.com/codex/hooks）。本 lib はそのパッチ
 * 文字列から対象ファイルパスを抽出する。
 *
 * worktree-policy-guard（main 直接編集の遮断）と worktree-session-owner-guard
 * （cross-worktree 編集の遮断）が共有する。R-CM-037 Rule 5（hook 間の直接 import 禁止、
 * 純粋 lib SSOT）に整合 — 両 hook が本 lib を import する。
 *
 * リファレンス: trip-jarvis `.agents/hooks/lib/worktree-policy-core.mjs#extractApplyPatchFilePaths`
 * （運用検証済みの実装）。apply_patch heredoc の `*** Add|Update|Delete File:` / `*** Move to:`
 * 行パース + invocation fallback。
 *
 * Boundary: 観点1（brief2dev 自体）専用 — worktree ガード hook は scaffold 未配布（R-CM-028）。
 */

import { isAbsolute, join } from 'path';

/**
 * apply_patch command 文字列から対象ファイルの abs パス配列を抽出。
 *
 * @param {string} command - apply_patch パッチ本文（tool_input.command）
 * @param {string} [baseDir] - 相対パス正規化の基準（絶対パスの場合はそのまま）
 * @returns {string[]} 重複除去済みの abs パス配列（不正な入力時は空配列）
 */
export function extractApplyPatchFilePaths(command, baseDir = '') {
  if (typeof command !== 'string' || !command.trim()) return [];

  const paths = [];
  const addPath = (raw) => {
    if (!raw || typeof raw !== 'string') return;
    const p = raw.trim();
    if (!p) return;
    paths.push(isAbsolute(p) ? p : (baseDir ? join(baseDir, p) : p));
  };

  // CRLF 安全対応: split('\n') 後に残った \r を除去。JS 正規表現の `.` は \r にマッチしないため、
  // \r を除去しないと CRLF パッチ行の `(.+)$` が丸ごと fail → パス 0件 → ガード回避（CRITICAL）。
  for (const rawLine of command.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    const hunk = line.match(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/);
    if (hunk) {
      addPath(hunk[1]);
      continue;
    }
    const move = line.match(/^\*\*\* Move to: (.+)$/);
    if (move) addPath(move[1]);
  }

  // invocation fallback は削除（HIGH 誤検知の遮断）: `(?:apply_patch|patch)\s+...` 正規表現は
  // パッチ本文 diff 行の 'patch' キーワードから誤検知パスを抽出してしまう → policy-guard の false deny。
  // codex apply_patch は常に heredoc（`*** ... File:` マーカー）形式のため、File 行が 0件なら
  // fail-open（空配列 → passthrough、R-CM-006 Rule 2）の方が footgun fallback より安全。

  return [...new Set(paths)];
}
