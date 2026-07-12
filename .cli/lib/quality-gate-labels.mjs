/**
 * quality-gate-labels.mjs — Quality Gate label enum 単一 SSOT
 *
 * R-CM-030 Rule 8（Pre-Ship Quality Gate）の環境分岐 + 自己点検 fallback における
 * marker JSON `quality_gate` フィールドの enum。mark-pre-ship-confirmed.mjs（CLI 発行者）
 * と pre-ship-review-guard.mjs（hook 検証者）の両方が import して使用する。
 *
 * ラベルの意味:
 * - `agent_go`         : `/code-review --fix`（Claude Code、simplification + correctness 統合）と code-reviewer agent の両方が Go（正常経路）。2026-05-27 のユーザー決定により `/simplify` を完全廃止 + `simplifit` スキルを deprecate した後、`/code-review` が単一エントリポイント
 * - `self_review_pass` : agent 呼び出しの失敗/skip 時に自己点検が通過（Panel Decisions に理由を明示）
 * - `trivial_skip`     : R-CM-030 Rule 10 の trivial 免除（≤2 ファイル + ≤20 LOC + non-substantive）
 *
 * 新しいラベルを追加する際は本ファイルのみ更新すれば発行者/検証者に同時反映される — mismatch 回帰を遮断。
 */
export const VALID_QUALITY_LABELS = new Set(['agent_go', 'self_review_pass', 'trivial_skip']);
