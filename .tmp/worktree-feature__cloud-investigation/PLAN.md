# PLAN — feature/cloud-investigation

## Goal
Cloud実測調査の結論とCloud Loggingの検証サマリを、再確認可能なレポートとして保存する。

## Why
Firestore上のミッション状態、Cloud Runの実行状態、ログ、Gemini利用見積りを画面表示と区別して記録する必要があるため。

## Scope (Surgical — R-CM-029 Rule 4)
- `reports/cloud-investigation-2026-07-11.md`
- `reports/cloud-logging-180m-summary.json`
- このPLANの完了記録

## Out of scope
- 本番Cloud Run、Firestore、Cloud Logging設定の変更
- アプリケーションコードの修正
- Cloud Billingの請求設定変更

## Verify

### AI 自動 (このターン内に実行)
- [x] `npm test`（レポートのみの変更だが、既存コードの回帰がないことを確認）
- [x] `npm audit --omit=dev --audit-level=high`、`jq empty reports/cloud-logging-180m-summary.json`、`git diff --check`

### ユーザー手動
- (dropped) ユーザー手動確認は不要。成果物は調査レポートと機械可読ログサマリのみ。

## Status
- 2026-07-11: Cloud Run、Cloud Logging、Firestore API、Billing設定、npm audit、配信HTMLを実測。
- 2026-07-11: レポートとログサマリを作成し、`de6e2f2 docs: add cloud investigation report` にcommit。
- 2026-07-11: Verify項目を実行し、本PLANの完了記録を追加。

## Outstanding
- なし (開始時点)

## Decisions
- AI判断: 調査はread-onlyとし、実請求額は取得不能であることを明記。概算Gemini費用とGCP実請求を混同しない。
- AI判断: worktree shipping guardに従い、調査成果物のみを隔離worktreeへ保存する。
