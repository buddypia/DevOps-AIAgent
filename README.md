# Agent-To-Agent Marketplace

必要な能力を持つAIを市場から探し、雇い、A2Aで連携させる DevOps x AI Agent Hackathon 向けプロダクトです。

## Concept

`brief2dev` の「要件を開発・検証・運用へ落とす」考え方を、エージェント市場に変換しました。ユーザーはプロジェクトブリーフを貼り、AIエージェントを能力値・スキル・MCP成熟度・価格で比較して購入します。購入すると、企画、実装配送、運用信頼性、ユーザビリティ、A2A統制の改善量が可視化されます。

## Hackathon Fit

- Google Cloud: Cloud Run デプロイを前提にした `Dockerfile` / `cloudbuild.yaml` / `/healthz`
- AI: Gemini API `gemini-3.5-flash`
- A2A: `/.well-known/agent-card.json` と `/a2a` JSON-RPC互換エンドポイント
- DevOps: GitHub/CI/CD/Cloud Run運用を見据えた推薦、検証コマンド、MCP行列
- UX: Agent Studio の「AIをキャラクターとして管理する」発想を、市場・購入・編成のゲームループに再構成
- Strategy: ADK、A2A Marketplace、LangGraph、CrewAI、Dify、AgentOpsとの差分をアプリ内で比較し、SWOT、審査5項目、提出準備、次に雇うべきAIを算出
- Autonomy: Mission Controlが審査で弱い項目を検出し、A2A委任、検証runbook、ProtoPedia提出パックを生成
- Operate: Ops DrillがCloud Run公開デモの稼働シグナルを読み、継続・ロールバック・追加雇用を判断
- Visual asset: `image_gen` で生成した `public/assets/agent-marketplace-hero.png`

## Winning Strategy Layer

このMVPの勝ち筋は、既存のエージェントフレームワークと正面衝突しないことです。ADK/LangGraph/CrewAI/Difyが「AIエージェントをどう作るか」を強くしている一方、このプロダクトは「どのAI能力を買うべきか」を判断する市場体験に寄せています。

アプリ内の `Winning Strategy` では次を動的に表示します。

- 競合分析: Google ADK / AI Agent Marketplace / LangGraph / CrewAI / Dify / AgentOps
- SWOT: 選択したエージェント編成から強み、弱み、機会、脅威を再計算
- Judge Scorecard: ハッカソン審査5項目に対する現在スコアと次アクション
- MVP Proof: Cloud Run、Gemini、A2A、公開GitHub、ProtoPediaの提出準備
- Winning Moves: 優勝仮説と、次に雇うべきエージェント

## Mission Control

`Mission Control` は、審査基準の弱点を自動で読み、選択済みエージェントにA2A委任した体裁で提出証跡を生成します。Gemini APIキーが無い環境でも動くため、審査員の前でデモが止まりません。

- Decisions: 競合ポジション、弱点補強、次に雇うAIを決定
- Steps: sense → decide → delegate → verify → ship の5段階で自律実行を可視化
- Verification: `npm run typecheck` / `npm test` / `npm run build` / health check / Agent Card / Strategy API
- Submission Pack: ProtoPediaタイトル、タグ、ストーリー、30秒動画スクリプト、構成図SVG、提出チェックリスト

## Cloud Run Ops Drill

`Cloud Run Ops Drill` は、DevOpsハッカソンの「まわす」を操作として見せる運用デモです。ヘルスチェック、p95 latency、5xx率、Gemini fallback、予算余力、外部提出URLの状態をシグナル化し、AIエージェントが公開継続・ロールバック・追加雇用を判断します。

- Release gate: Cloud Run SREが継続公開か前revisionへのrollbackかを判定
- Rebuy loop: A2A Market BrokerがObservability Oracle / Test Forge / Security Sentinelの買い足しを推薦
- Runbook: healthz、`/api/ops-drill`、Cloud Run describe、Cloud Logging、traffic updateコマンドを固定
- A2A payload: `ops.drill` skillとしてseverity、signals、rollback判断、next ops hireを返す

## Submission Kit

提出に必要な素材はアプリとリポジトリの両方に固定しています。

- System architecture: `public/assets/a2a-marketplace-architecture.svg`
- ProtoPedia markdown draft: `docs/03_submission/submission-pack.md`
- API: `GET /api/submission-kit`
- App UI: Mission Control実行後に `Architecture Diagram` / `30s Storyboard` / `Required Assets` を表示

## Local Development

```bash
npm install
npm run dev
```

Open <http://localhost:8080>.

Geminiを使う場合:

```bash
cp .env.example .env
export GEMINI_API_KEY="..."
export GEMINI_MODEL="gemini-3.5-flash"
npm run dev
```

APIキーがない場合でも、ローカルフォールバックでデモは動きます。

## Endpoints

- `GET /api/healthz` (`/healthz` もローカル互換で提供)
- `GET /.well-known/agent-card.json`
- `POST /a2a`
- `POST /api/recommend`
- `POST /api/strategy`
- `POST /api/mission`
- `POST /api/ops-drill`
- `GET /api/submission-kit`
- `GET /api/market`

## IP Allowlist

The service only accepts requests from the supplied fixed IP addresses and Rakuten Mobile ranges. Rakuten Mobile ranges were collected from:

- Qiita article updated 2025-01-28: <https://qiita.com/shisuto3141/items/087ab79042c4aa608f75>
- NetworksDB page updated 2026-06-02: <https://networksdb.io/ip-addresses-of/rakuten-mobile-inc>
- Additional ASN search results for Rakuten Mobile AS23720/AS138384 ranges.

## Cloud Run

Deployed URL:

<https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app>

Public GitHub:

<https://github.com/buddypia/DevOps-AIAgent>

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _REGION=asia-northeast1,_SERVICE=a2a-agent-marketplace,_REPOSITORY=cloud-run-source-deploy,_GEMINI_SECRET=gemini-api-key-a2a-marketplace
```

またはローカルDocker:

```bash
docker build -t a2a-agent-marketplace .
docker run --rm -p 8080:8080 -e GEMINI_API_KEY="$GEMINI_API_KEY" a2a-agent-marketplace
```

The deployed Cloud Run service reads `GEMINI_API_KEY` from Secret Manager secret `gemini-api-key-a2a-marketplace` via `cloudbuild.yaml` and uses `GEMINI_MODEL=gemini-3.5-flash`.

## Submission Notes

ProtoPediaには、公開GitHubリポジトリURL、Cloud Run URL、作品URLを提出します。GitHubは <https://github.com/buddypia/DevOps-AIAgent>、Cloud Runは <https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app>。タグは `findy_hackathon`。動画では「ブリーフ入力 → 競合/SWOT確認 → Mission Control実行 → Ops Drillで運用判断 → Submission Kit確認 → Gemini分析 → Agent Card確認」を30秒で見せる構成が向いています。
