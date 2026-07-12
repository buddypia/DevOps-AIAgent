# PLAN — feature/ui-clarity-refresh

## Goal
既存のダーク・発光中心のテーマを、読みやすく判断しやすい明るい運用コンソールへ刷新する。

## Why
現状は背景・カード・ステータスのコントラストが近く、補助文字と発光表現が多いため、調査開始・実行状況・根拠の優先順位を追いにくい。

## Scope (Surgical — R-CM-029 Rule 4)
- `src/styles.css`: 全体トークン、レイアウト、状態表示、レスポンシブ、フォーカス状態

## Out of scope
- API、状態管理、調査ロジック、既存の画像アセット

## Verify

### AI 自動 (このターン内に実行)
- [x] `npm run typecheck` — PASS (`make q.check` 内で実行)
- [x] `npm test` — PASS (9 files / 77 tests)
- [x] `npm run build` — PASS (Vite build、asset budget、server typecheck)

### ユーザー手動
- [x] ブラウザでデスクトップ幅とスマホ幅を確認 — PASS (1440px / 390px、モバイル横スクロールなし)

## Status
- 2026-07-12: worktree 作成、UI/UXデザインシステム確認済み。
- 2026-07-12: 実装、ブラウザ確認、品質ゲート完了。コミット `704ef2a`。

## Outstanding
- なし (開始時点)

## Decisions
- AI判断: Modern SaaS Blue をベースに、状態色を意味ごとに限定した明るい dashboard-ui を採用。
- AI判断: 外部フォント依存を増やさず、日本語の可読性を優先したシステムフォント構成にする。
