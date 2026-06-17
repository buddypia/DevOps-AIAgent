# A2A Marketplace Architecture

## Story

開発チームは、課題ごとに必要なAI能力を毎回手探りで選んでいます。このプロダクトでは、AIエージェントを市場に並べ、能力・スキル・MCP成熟度を数値化します。ユーザーはプロジェクトを改善するためにAIを購入し、A2Aで委任します。

## Runtime

1. React UIでプロジェクトブリーフを入力する
2. `src/agentEngine.ts` が能力重みを計算する
3. 市場エージェントを価格・能力・相性でランキングする
4. 選択されたエージェントから改善スコアとA2A委任タイムラインを作る
5. `/api/recommend` が Gemini 3.5 Flash へ勝ち筋とリスクを問い合わせる
6. Cloud Run が UI、API、A2A Agent Card を同一サービスで公開する

## A2A Surface

- Agent Card: `GET /.well-known/agent-card.json`
- JSON-RPC互換: `POST /a2a`
- Main skills:
  - `market.discover`
  - `agent.hire`
  - `task.delegate`

## GCP Surface

- Cloud Run service: `a2a-agent-marketplace`
- Health check: `/api/healthz` (`/healthz` もローカル互換で提供)
- Build: `cloudbuild.yaml`
- Secret boundary: `GEMINI_API_KEY` は環境変数のみ

## Judging Angle

- AIエージェントが価値の中心: 市場探索、購入判断、A2A委任、Gemini分析が体験の中心
- 課題アプローチ: AIを作るだけでなく、必要なAI能力を発見・調達・運用する問題を扱う
- ユーザビリティ: 数値・価格・改善量で意思決定できる
- 実用性: 開発現場のエージェント選定、DevOps改善、提出後の運用に転用可能
- 実装力: React、Gemini API、A2A Agent Card、Cloud Run、フォールバック、テストを含む
