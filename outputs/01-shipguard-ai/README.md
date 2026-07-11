# ShipGuard AI

Decides Ship, Watch, or Block from PR, CI, and Cloud Run evidence.

## 概要

ShipGuard AI は、DevOps x AI Agent Hackathon 向けの `AI release captain` です。Reads PR, CI, deployment, and Cloud Run signal fragments to produce a release verdict and next actions.

MVPでは、スコープを絞って次の体験を作ります。A web app where a GitHub PR URL, CI summary, and Cloud Run logs become a Gemini-backed release report and PR comment draft.

## ハッカソン上の位置づけ

- Rank: 1
- Idea No: 001
- Role: AI release captain
- Source: `docs/01_hackathon/idea_recommendations_500_scored.md`
- 判断ラベル: `SHIP` / `WATCH` / `BLOCK`

## 解決する課題

現代のDevOpsチームには、判断に必要な情報自体は存在しています。しかし実際には、Pull Request、CIログ、Cloud Run revision、Cloud Logging、Monitoring、Runbook、障害対応メモ、リリース判断の会話などに分散しています。問題は「情報がないこと」ではなく、限られた時間の中で、それらを読み解いて次の一手に変えることです。

ShipGuard AI は、その中でも次の運用判断にフォーカスします。

- release verdict
- CI failure clustering
- Cloud Run regression signals

AIエージェントがない場合、これらの確認は「詳しい人がたまたまオンラインか」「Runbookが古くなっていないか」「レビュー担当者が文脈を覚えているか」に依存しがちです。このプロジェクトは、散らばった運用シグナルを、再現性のある判断ワークフローに変換します。

## なぜ必要なのか

`AI release captain` の仕事は影響範囲が大きく、ひとつの誤ったデプロイ判断、ロールバック判断、初動対応、確認漏れが、数時間の調査やユーザー信頼の低下につながります。チームには、次のような軽量な支援役が必要です。

- 雑多な運用情報を素早く読む
- 判断を `SHIP` / `WATCH` / `BLOCK` のように明確化する
- 判断の根拠を提示する
- PRコメント、障害対応メモ、Runbook更新案など、人間がそのまま使える文面を作る
- リリースや障害対応ごとに判断基準がぶれないようにする

目的は運用担当者を置き換えることではありません。繰り返し発生する情報整理をAIに任せ、人間は最終判断、責任分担、コミュニケーションに集中できるようにすることです。

## 提供価値

- 人間の担当者は、曖昧な要約ではなく `SHIP` / `WATCH` / `BLOCK` の具体的な判断を受け取れます。
- 判断理由が summary、risks、evidence、actions、automationPlan に分解されるため、レビューや引き継ぎで説明しやすくなります。
- Gemini API が使える本番モードと、APIキーなしでも動く deterministic fallback の両方を備えているため、デモや審査時の不確実性を下げられます。
- 最初から Cloud Run に載せやすい構成にしているため、ハッカソン提出用URLから実運用プロトタイプまで発展させやすいです。

## どのように動くのか

1. ユーザーが、PR URL、Cloud Run revision、障害名、Runbookパス、Feature Flag、音声文字起こしなどの対象を入力します。
2. CI結果、ログ、メトリクス差分、Runbook、スキーマ変更、問い合わせ、リリース制約などの文脈を貼り付けます。
3. Express API が Zod で入力を検証し、プロジェクト固有の Gemini プロンプトを組み立てます。
4. Gemini に、decision、confidence、summary、risks、actions、evidence、automationPlan、commentDraft を含む厳密なJSONを返させます。
5. フロントエンドは、判断、信頼度、根拠、次アクション、担当者、コメント案をダッシュボードとして表示します。
6. Gemini APIキーがない場合でも、 deterministic fallback により同じUIで判定フローを確認できます。

## エージェント設計

エージェントの人格は `AI release captain` です。プロンプトは、プロジェクトの目的と次のフォーカス領域に制約しています。

- release verdict
- CI failure clustering
- Cloud Run regression signals

エージェントは常に次の構造化レスポンスを返します。

- `decision`: `SHIP` / `WATCH` / `BLOCK` のいずれか
- `confidence`: 0から100の信頼度
- `summary`: 短い運用判断
- `risks`: 確認すべきリスク
- `actions`: owner と priority つきの次アクション
- `evidence`: ダッシュボードに表示する重み付き根拠
- `automationPlan`: 本番連携時に自動化できる手順
- `commentDraft`: PR、障害対応、Runbook、リリース判断に貼れる文面

## インフラ構成

```text
Browser UI
  |
  | HTTPS
  v
Cloud Run service
  |
  | Express API: /api/project, /api/health, /api/analyze
  v
Gemini API via @google/genai
  |
  v
Structured decision JSON
```

Cloud Run service の1コンテナで、Viteでビルドした静的フロントエンドと Express API の両方を配信します。サーバーは `0.0.0.0` で待ち受け、Cloud Run が注入する `PORT` を読み取るため、Cloud Run のコンテナ要件にそのまま合います。

## 技術選定

- Cloud Run
- Gemini API
- Cloud Logging
- GitHub Actions
- Node.js 22: Cloud Run と相性がよく、現在のJavaScript実行環境として扱いやすい
- TypeScript 6: project data、server、UIを型でつなぎ、20個の実装を安定させる
- Vite 8: 小さく高速なフロントエンドビルドを実現する
- Express 5: ローカルでもCloud Runでも動かしやすいシンプルなHTTP APIを作る
- Zod 4: 入力とAIレスポンスのスキーマ検証に使う
- `@google/genai`: Gemini API 連携に使う
- Dockerfile: Cloud Run デプロイ時の再現性を高める

MVPは小さく保ちつつ、GitHub、Cloud Logging、Cloud Monitoring、BigQuery、Secret Manager、各サービスAPIへ拡張しやすい構成にしています。

## 入力と出力

### サンプル入力

- Target: `https://github.com/example/checkout/pull/184`
- Context: Checkout API PR changes payment retry handling. Cloud Run service checkout-api in asia-northeast1. Previous revision checkout-api-00152-pak is stable.
- Signals: CI: unit pass, integration pass, e2e flaky retry passed. Diff: payment/retry.ts +82 lines, checkout controller +31. Logs after preview: 3 timeout warnings, no 5xx, p95 latency +18ms. Rollback: previous revision has 100% traffic snapshot.

### 判断指標

- Ship risk
- Log anomaly
- Rollback ease

### 期待される出力

アプリは次の要素を含む判断ダッシュボードを返します。

- 最上位の判断
- 信頼度スコア
- 根拠と重み
- リスク一覧
- 優先度つきアクション
- 自動化プラン
- そのまま貼れるコメント案

## ローカル開発

```bash
npm install
cp .env.example .env
npm run dev
```

ターミナルに表示される Vite URL を開きます。フロントエンドは `/api` をローカルの Express API `PORT=8080` にプロキシします。

## ビルドと起動

```bash
npm run build
npm start
```

本番サーバーは `dist/client` の静的ファイルを配信し、`dist/server/server.js` からAPIを提供します。

## 環境変数

詳細は `docs/environment.md` を参照してください。

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | live AIでは必須 | empty | Google Gemini APIキー |
| `GEMINI_MODEL` | 任意 | `gemini-3.1-flash-lite` | Gemini Flash 3.1のモデルID。利用環境に別IDがある場合は差し替えます |
| `PORT` | 任意 | `8080` | HTTP port。Cloud Runでは自動注入されます |

## Cloud Run デプロイ

```bash
gcloud run deploy shipguard-ai \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_MODEL=gemini-3.1-flash-lite
```

本番運用では、`GEMINI_API_KEY` を Secret Manager に保存し、`--set-secrets` で渡す構成を推奨します。

## Terraform / Cloud Run IaC

このプロジェクトは、ハッカソン提出要件の「Google Cloudアプリケーション実行プロダクト」と「デプロイ済みURL」を満たすため、Cloud Run向けTerraformを同梱しています。

- [Terraform deploy guide](./docs/terraform.md)
- [Terraform HTML guide](./docs/terraform.html)
- [Architecture SVG](./docs/architecture.svg)
- [Terraform module](./infra/terraform/)

最短実行:

```bash
cd infra/terraform
terraform init
terraform apply \
  -var project_id="$GOOGLE_CLOUD_PROJECT" \
  -var source_revision="$(date +%Y%m%d%H%M%S)"
```

デプロイ後は `terraform output -raw service_url` を作品提出フォームのデプロイURLとして使います。

## デモシナリオ

1. アプリを開き、サンプル入力を読み込んだ状態にします。
2. Runボタンで分析を実行します。
3. 生の運用情報が、どのように `SHIP` / `WATCH` / `BLOCK` の判断へ変換されるか説明します。
4. evidence bar、リスク、action owner を見せます。
5. 生成された comment draft を、PR、障害対応チャンネル、Runbook、リリースノートなどに貼る流れを見せます。

## 本番拡張アイデア

- GitHub APIから実PR、差分、CI結果を取得する
- Cloud LoggingからCloud Run revisionごとのログを読む
- Cloud Monitoringからlatency、error rate、saturation、ビジネスKPIを取得する
- 判断履歴をBigQueryに保存し、リリースや障害対応の振り返りに使う
- Slack、Google Chat、GitHub commentへの投稿を追加する
- 自動実行してよい判断と人間承認が必要な判断をポリシーで分ける

## HTMLマニュアルと開発ドキュメント

- [操作マニュアル](./docs/manual.html): ShipGuard AI の仮説、操作手順、判断の読み方、デモ確認項目をHTML図解で確認できます。
- [開発ガイド](./docs/development.html): アーキテクチャ、API、検証コマンド、本番MVPチェック、Web調査に基づく基準をHTML図解で確認できます。

## ProductionレベルMVPとしての保証

- `/api/health`, `/api/ready`, `/api/version` を提供します。
- 全APIレスポンスに `X-Request-Id` を付与し、構造化ログにも同じIDを残します。
- セキュリティヘッダ、CSP、no-store API cache、統一JSONエラー形式を設定しています。
- `CORS_ORIGIN`, `SERVICE_VERSION`, `JSON_BODY_LIMIT` で本番環境ごとの調整ができます。
- Dockerfileはmulti-stage build、runtimeはdevDependenciesを除外し、non-root `node` ユーザーで実行します。
- `npm run verify` は typecheck、unit/contract tests、client build、server build を一括で実行します。

## Startup Product Validation

- [Product strategy](./docs/product.md) defines ICP, job-to-be-done, wedge hypothesis, activation, retention, pricing hypothesis, validation plan, and no-go criteria.
- The UI captures product feedback after each decision.
- `POST /api/events` records activation and feedback events as structured logs for learning loops.

## Production Security Hardening

- Protected POST APIs support Bearer token or `X-API-Key` auth via `API_AUTH_TOKEN`.
- In `NODE_ENV=production`, API auth is required unless `ALLOW_UNAUTHENTICATED=true` is set intentionally.
- `helmet` applies production security headers and CSP.
- `express-rate-limit` protects AI/API cost surfaces with `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`.
- `/api/ready` fails closed when required auth or Gemini configuration is missing.
- GitHub Actions CI, Dependabot, `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE`, and [production runbook](./docs/runbook.md) are included.

## リポジトリ構成

```text
.
├── docs/environment.md
├── src/agent.ts
├── src/main.ts
├── src/project.ts
├── src/server.ts
├── src/styles.css
├── Dockerfile
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vite.server.config.ts
```
