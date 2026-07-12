/**
 * verification-patterns.mjs — Verification Command Pattern Library
 *
 * R-CM-010 (Verification Before Completion) の検証コマンドマッチングの単一SSOT。
 *
 * 使用箇所:
 *   - .claude/hooks/governance-capture.mjs (PostToolUse Bash → 自動capture)
 *   - .claude/hooks/completion-evidence-guard.mjs (Stop → governance-events.jsonl参照)
 *
 * 両hookが同一の正規表現集合を共有し、captureとverification判定の整合性を保証する。
 *
 * 正規表現追加時:
 *   1. test/lint/build/typecheck系の検証コマンドのみ追加
 *   2. tests/unit/governance-capture.test.mjsにfixtureを追加してリグレッションを防止
 *   3. completion-evidence-guardの動作への影響を事前に検討
 */

export const VERIFICATION_PATTERNS = [
  /\bnpm\s+(run\s+)?(test|lint|build|typecheck)\b/,
  /\bpnpm\s+(run\s+)?(test|lint|build|typecheck)\b/,
  /\byarn\s+(run\s+)?(test|lint|build|typecheck)\b/,
  /\bnpx\s+(vitest|jest|eslint|tsc|prettier)\b/,
  /\bmake\s+(q\.|test|lint|build|check)/,
  /\bcargo\s+(test|check|clippy|build)\b/,
  /\bgo\s+(test|vet|build)\b/,
  /\bflutter\s+(test|analyze|build)\b/,
  /\bpytest\b/,
  /\bruff\b/,
  /\bnode\s+--test\b/,
];

/**
 * コマンド文字列がverificationパターンにマッチするかを検査する。
 * @param {string} command - 実行されたbashコマンド
 * @returns {boolean}
 */
export function matchVerificationCommand(command) {
  if (!command || typeof command !== 'string') return false;
  return VERIFICATION_PATTERNS.some((p) => p.test(command));
}
