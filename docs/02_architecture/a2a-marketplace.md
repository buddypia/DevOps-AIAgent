# A2A Marketplace Architecture

## Story

開発チームは、課題ごとに必要なAI能力を毎回手探りで選んでいます。このプロダクトでは、AIエージェントを市場に並べ、能力・スキル・MCP成熟度を数値化します。ユーザーはプロジェクトを改善するためにAIを購入し、A2Aで委任します。

## Runtime

1. React UIでプロジェクトブリーフを入力する
2. `src/agentEngine.ts` が能力重みを計算する
3. 市場エージェントを価格・能力・相性でランキングする
4. 選択されたエージェントから改善スコアとA2A委任タイムラインを作る
5. `src/contracts.ts` が選択済みAIの成果物、受入条件、SLA、検証コマンドを契約化する
6. `src/strategy.ts` が競合、SWOT、審査5項目、MVP提出準備、次に雇うべきAIを算出する
7. `src/mission.ts` が弱点補強、A2A委任、検証runbook、ProtoPedia提出パックを生成する
8. `src/ops.ts` がCloud Run公開デモのシグナルから継続・ロールバック・追加雇用を判断する
9. `src/finalist.ts` が審査員5役の模擬判定、落選理由、残ギャップ、次の一手を生成する
10. `src/proof.ts` がGemini、Cloud Run、A2A、競合/SWOT、Mission、Ops、提出URLを審査証拠束にまとめる
11. `/api/recommend` が Gemini 3.5 Flash へ勝ち筋、リスク、競合/SWOT文脈を問い合わせる
12. Cloud Run が UI、API、A2A Agent Card を同一サービスで公開する

## A2A Surface

- Agent Card: `GET /.well-known/agent-card.json`
- JSON-RPC互換: `POST /a2a`
- Main skills:
  - `market.discover`
  - `agent.hire`
  - `contract.issue`
  - `task.delegate`
  - `strategy.audit`
  - `mission.run`
  - `ops.drill`
  - `finalist.simulate`
  - `judge.proof`

## Strategy Surface

- Competitive arena: ADK / Google Cloud AI Agent Marketplace / LangGraph / CrewAI / Dify / AgentOps を比較
- SWOT: 現在の編成から strengths / weaknesses / opportunities / threats を再計算
- Judge scorecard: 審査5項目ごとのスコア、証拠、次アクションを表示
- MVP proof: Cloud Run、Gemini、A2A、公開GitHub、ProtoPediaの提出準備を分離
- Next hire: 最も弱い審査項目に効くエージェントを推薦

## Contract Surface

- `POST /api/contracts`: 選択済みAIの契約、受入条件、SLA、検証runbook、A2A payloadを返す
- Contract score: 予算、審査スコア、verification、ops readiness、契約リスクから算出する
- Acceptance runbook: GitHub Actions、Judge Proof、Ops Drill、Pitch Directorを検収条件へ接続する
- A2A payload: `contract.issue` skillとして価格、risk、acceptanceCriteriaを返す

## Mission Surface

- Autonomous proof: sense → decide → delegate → verify → ship の5段階で、AIが判断して動いた証跡を表示
- Decisions: 競合ポジション、最弱審査項目、次に雇うAIを明示
- Verification runbook: typecheck / test / build / healthz / Agent Card / Strategy API を提出時の証拠として固定
- Submission pack: ProtoPediaタイトル、タグ、ストーリー、30秒動画スクリプト、構成図SVG、提出チェックリストを生成

## Operations Surface

- `POST /api/ops-drill`: Cloud Run health、p95 latency、5xx率、Gemini fallback、予算余力、外部提出URLの状態を評価する
- `POST /api/contracts`: AI契約、受入条件、SLA、検証コマンド、支払い条件を評価する
- `POST /api/pitch`: 30秒動画のshot list、voiceover、lower thirds、recording checklist、提出残リスクを返す
- `POST /api/judge-drill`: 審査5項目ごとの厳しめ質問、回答、証拠リンク、デモ画面を返す
- `POST /api/finalist`: 審査員5役の最終候補判定、落選理由、残ギャップ、次の一手を返す
- Release gate: Cloud Run SREが公開継続かrollbackかを判断する
- Rebuy loop: A2A Market BrokerがObservability Oracle / Test Forge / Security Sentinelの買い足しを推薦する
- Runbook: healthz、ops drill、Cloud Run describe、Cloud Logging、traffic updateコマンドを提示する
- A2A payload: `ops.drill` skillとしてseverity、signals、rollbackRecommended、nextOpsAgentを返す

## Proof Surface

- `POST /api/proof`: Gemini実行、Cloud Run公開、A2A、競合/SWOT、Mission、Ops、GitHub Actions CI、提出URLを1つの審査証拠束にまとめる
- UI: `Run judge proof` ボタンでoverall proof score、7カテゴリスコア、live links、proof runbook、sha256 receiptを表示する
- A2A skill: `judge.proof` としてAgent Cardにも公開する
- Contract proof: `contract.issue` skillとして、AIの購入が成果物と検収条件に接続されていることを示す
- CI proof: `.github/workflows/ci.yml` が `npm run typecheck`、`npm test`、`npm run build`、`make q.check-architecture` を公開repo上で実行し、Proof APIが最新main runを取り込む
- Pitch proof: `pitch.director` skillとして、審査員に見せる順番と提出動画の残作業をA2A payloadにも含める
- Judge drill: `judge.drill` skillとして、審査員の反論に対する回答と証拠リンクをA2A payloadにも含める
- Finalist proof: `finalist.simulate` skillとして、最終候補スコア、judge consensus、残ギャップをA2A payloadにも含める

## Submission Surface

- `GET /api/submission-kit`: 提出タイトル、タグ、ストーリー、動画ストーリーボード、構成図URL、提出チェックリストを返す
- `public/assets/a2a-marketplace-architecture.svg`: ProtoPediaに貼れるシステム構成図
- `docs/03_submission/submission-pack.md`: ProtoPediaストーリー欄に転記するMarkdown下書き
- UI: Mission Control実行後に Architecture Diagram / 30s Storyboard / Required Assets を表示

## GCP Surface

- Cloud Run service: `a2a-agent-marketplace`
- Health check: `/api/healthz` (`/healthz` もローカル互換で提供)
- Ops drill: `/api/ops-drill`
- Contracts: `/api/contracts`
- Pitch director: `/api/pitch`
- Judge drill: `/api/judge-drill`
- Finalist simulator: `/api/finalist`
- Judge proof: `/api/proof`
- Build: `cloudbuild.yaml`
- Secret boundary: `GEMINI_API_KEY` は環境変数のみ

## Judging Angle

- AIエージェントが価値の中心: 市場探索、購入判断、A2A委任、自律ミッション、運用ドリル、Gemini分析が体験の中心
- 課題アプローチ: AIを作るだけでなく、必要なAI能力を発見・調達・運用する問題を扱う
- ユーザビリティ: 数値・価格・改善量・競合/SWOTで意思決定できる
- 実用性: 開発現場のエージェント選定、DevOps改善、公開後の異常検知とrollback判断に転用可能
- 実装力: React、Gemini API、A2A Agent Card、Cloud Run、戦略API、ミッションAPI、フォールバック、テストを含む
