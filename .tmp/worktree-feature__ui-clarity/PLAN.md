# PLAN — feature/ui-clarity

## Goal
審査員が初見で本番監査、個別実行、安全な模擬デモの違いを理解できるUIへ改善する。

## Why
既存画面では実行導線が密集し、模擬インシデント注入が本番実行と同じ場所に表示され、保存されたstaleミッションも実行中に見えていたため。

## Scope (Surgical — R-CM-029 Rule 4)
- `index.html`
- `server/index.ts`
- `src/AppHome.tsx`
- `src/IncidentDrillPanel.tsx`
- `src/MissionControl.tsx`
- `src/OpsAgentConsole.tsx`
- `src/AgentRoster.tsx`
- `src/styles.css`

## Out of scope
- Cloud Run本番サービス、Firestore、Cloud Logging設定の変更
- 既存APIのURL・認証モデル・ミッション実行基盤の再設計
- 外部画像・追加UIライブラリの導入

## Verify

### AI 自動 (このターン内に実行)
- [x] `npm run typecheck`
- [x] `npm test`（9 files / 77 tests passed）
- [x] `npm run build`（build asset budget PASS）
- [x] `npm audit --omit=dev --audit-level=high`（脆弱性0件）
- [x] `git diff --check`、em dash/icon preflight、JSON smoke

### ユーザー手動
- [x] Playwrightで1440pxと390pxを確認。モバイルの横スクロールなし。
- [x] Playwrightで安全デモを1回実行し、ランダムシナリオ、drill ID、合成ログ結果を表示することを確認。

## Status
- 2026-07-11: 既存UIの情報設計、実行導線、初期HTML、アクセシビリティ状態を監査。
- 2026-07-11: 本番監査、個別実行、安全デモを分離し、初見向け3ステップ説明を追加。
- 2026-07-11: staleミッションのpolling停止と「要確認」表示、模擬ドリルのサーバー側ランダムシナリオを実装。
- 2026-07-11: typecheck、test、build、audit、Playwright確認を完了。

## Outstanding
- なし (開始時点)

## Decisions
- ユーザー明示: 審査員の初見理解、模擬インシデントの別検証、ランダム性、3つのUIスキル利用。
- AI判断: 既存のダークな技術感と画像資産を維持し、teal/blueの単一アクセントと既存Lucideアイコンを使う。
- AI判断: 模擬ドリルは既存endpointを維持し、サーバー側で合成シナリオだけをランダム選択する。
