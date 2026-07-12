# PLAN — feature/improve-demo-vis

## Goal
全体のフォントサイズ底上げ、グラフのドーナツチャート化、ワークフロー図解 React コンポーネントの追加によって、全体的なUI/UXを大幅に改善する。

## Why
従来の画面は文字が非常に小さく、棒グラフも視認性に欠け、文字だらけでエージェント連携の仕組みが分かりづらいため。

## Scope (Surgical — R-CM-029 Rule 4)
- `src/styles.css`
- `src/WorkflowDiagram.tsx` (新規)
- `src/AppHome.tsx`
- `src/MissionControl.tsx`
- `src/EvidenceDashboard.tsx`
- `outputs/judge-command-center.html`

## Out of scope
- バックエンドロジックの変更

## Verify

### AI 自動 (このターン内に実行)
- [x] `npm run build && npm run typecheck` が成功し、`npm test`（90 tests passed）に合格する
- [x] `node tools/validate.mjs` が成功し、HTMLの警告が0件になる

### ユーザー手動
- [x] 改善された画面（ドーナツグラフ、全体のワークフロー図）が正しく配置され、文字サイズが読みやすくなっていることをブラウザで目視確認すること。

## Status
- 2026-07-12: UI/UX改善作業の実施、検証完了、PR配備。

## Outstanding
- なし

## Decisions
- AI デフォルトで実装完了。
