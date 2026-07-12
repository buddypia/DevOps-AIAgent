/**
 * apply-patch-paths.mjs — Codex `apply_patch` 対象ファイルパス抽出 (純粋 lib SSOT)
 *
 * Codex CLI はファイル編集時に常に `tool_name: "apply_patch"` を送り、パッチ本文は
 * `tool_input.command` 文字列に格納される (codex 公式 spec: "Bash and apply_patch use
 * tool_input.command" — https://developers.openai.com/codex/hooks)。本 lib はそのパッチ
 * 文字列から対象ファイルパスを抽出する。
 *
 * worktree-policy-guard (main 直接編集ブロック) と worktree-session-owner-guard
 * (cross-worktree 編集ブロック) が共有する。R-CM-037 Rule 5 (hook 間の直接 import 禁止、
 * 純粋 lib SSOT) 整合 — 両 hook が本 lib を import する。
 *
 * リファレンス: trip-jarvis `.agents/hooks/lib/worktree-policy-core.mjs#extractApplyPatchFilePaths`
 * (運用検証済みの実装)。apply_patch heredoc の `*** Add|Update|Delete File:` / `*** Move to:`
 * 行のパース + invocation fallback。
 *
 * Boundary: 観点 1 (brief2dev 自体) 専用 — worktree ガード hook は scaffold 未配備 (R-CM-028)。
 */

import { isAbsolute, join } from 'path';

/**
 * apply_patch command 文字列から対象ファイルの abs パス配列を抽出。
 *
 * @param {string} command - apply_patch パッチ本文 (tool_input.command)
 * @param {string} [baseDir] - 相対パス正規化の基準 (絶対パスならそのまま)
 * @returns {string[]} 重複除去された abs パス配列 (入力が不適合の場合は空配列)
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

  // CRLF 安全: split('\n') 後に残った \r を除去。JS 正規表現 `.` は \r をマッチしないため、
  // \r 除去なしでは CRLF パッチ行の `(.+)$` が丸ごと fail → パス 0 件 → ガード回避 (CRITICAL)。
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

  // invocation fallback を削除 (HIGH 誤検知ブロック): `(?:apply_patch|patch)\s+...` 正規表現は
  // パッチ本文の diff 行の 'patch' キーワードから誤検知パスを抽出 → policy-guard false deny。
  // codex apply_patch は常に heredoc (`*** ... File:` マーカー) 形式なので File 行が 0 件なら
  // fail-open (空配列 → passthrough, R-CM-006 Rule 2) の方が footgun fallback より安全。

  return [...new Set(paths)];
}
