# Competitive Analysis

## Position

Agent-To-Agent Marketplaceは、エージェントフレームワークやノーコードビルダーを置き換えない。勝ち筋は、開発チームが「どのAI能力を調達すべきか」を判断し、A2Aで委任し、Cloud Run運用までつなげる市場体験にある。

## Moat Stress Test

競合分析は資料で終わらせず、`POST /api/moat-stress` とアプリ内 `Stress-test moat` で審査員の反論へ変換する。各競合に対して「相手が強い点」「こちらの回答」「見せる証拠」「残リスク」「録画順」を返し、ADK/LangGraph/CrewAI/Dify/AgentOpsを否定せず、調達・A2A委任・公開証拠の体験へ話を戻す。

## Source Ledger

`POST /api/market-intel` は、Source Ledgerとして公式/一次ソースのreview日、fresh/watch、審査で使う一言、紐づく競合を返す。2026-06-18時点で、Gemini Enterprise Agent Platform、Google ADK、A2A toolkit、Cloud Marketplace A2A agent requirements、LangGraph、CrewAI、Dify、AgentOps、Cloud Runを確認対象にし、競合比較が古い印象にならないようにする。

## Competitive Proof Lock

`POST /api/competitive-battlecard` は、Market IntelのSource Freshness Lockを再実行し、競合カバレッジ、公式ソース、SWOT mapping、反論receipt、Objection Replay、live source lockを `sealed` / `watch` / `missing` で検収する。審査員に「競合分析やSWOTは本当にやったのか」と聞かれたら、Competitive Proof Lockのscore、checks、coverageを見せて、資料ではなく公開APIで再検証できる状態にする。

## Win Gap Radar

`POST /api/win-gap-radar` は、競合分析/SWOT/MVP Audit/Finalist/Acceptance/Prize Strategyを横断し、優勝に必要なMVP gapをfeature betsへ変換する。現時点ではProtoPedia作品URLと動画URLが外部gapなので、`submission-closeout` を `close-now` として扱い、submit-readyとは呼ばない。

## Competitors

| Competitor | Category | Strength | Counter-position |
| --- | --- | --- | --- |
| Google ADK / Gemini Enterprise | 公式エージェント基盤 | Build / debug / evaluate / deploy をGoogle Cloud上で支える | ADKが作る基盤なら、本プロダクトは審査員が触れる調達・編成・委任体験を作る |
| Google Cloud AI Agent Marketplace | A2A商流 | A2Aエージェントの販売導線 | 企業向け販売導線の前段で、必要能力を見極めるワークベンチを狙う |
| LangGraph / LangSmith | 信頼性オーケストレーション | 状態グラフ、human-in-the-loop、評価ループ | 開発者の制御面ではなく、選ぶ人の意思決定面を持つ |
| CrewAI | マルチエージェント開発 | role-based crew、MCP/ツール統合、コミュニティ | crewを作るより、crewを雇うストーリーを見せる |
| Dify | ワークフロー/RAGアプリビルダー | AI workflow、RAG、agent capabilities、model management、observability | アプリ作成速度ではなく、DevOps改善に足りないAI能力の発見に寄せる |
| AgentOps | Agent observability | testing、debugging、deploying、framework integration | 動いた後の観測ではなく、何を雇えば勝てるかの事前判断を担う |

## SWOT

### Strengths

- A2A Agent Card、MCP成熟度、価格、能力値を購買UIに統合している。
- Gemini 3.5 Flash分析と鍵なしフォールバックでデモの継続性がある。
- Cloud Run、health check、Cloud Build、A2A endpointが同一サービスにまとまっている。

### Weaknesses

- 改善スコアは仮説モデルなので、提出後は実ログやユーザー操作で補強する必要がある。
- A2A認証、署名、タスク状態の永続化は最小実装。
- 公開GitHub URL、ProtoPedia、動画、構成図はコード外の提出作業として残る。

### Opportunities

- A2Aは異なるベンダー/フレームワークのエージェント協調を狙うため、市場・調達UIとの相性が高い。
- Google CloudがA2A、Agent Engine、Cloud Run、AI Agent Marketplaceの流れを強めているため、ハッカソン文脈に乗せやすい。
- AgentOps文脈を取り込むと、ログから次のエージェント推薦へ戻すDevOpsループに発展できる。

### Threats

- ADK/Gemini Enterpriseが公式基盤として非常に強い。
- LangGraph/CrewAI/Difyは既に開発者体験とコミュニティを持つ。
- AgentOps/LangSmith系は観測・評価で本番感を出しやすい。

## Sources

- Google Cloud ADK documentation: https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk
- Gemini Enterprise Agent Platform launch: https://cloud.google.com/blog/products/ai-machine-learning/introducing-gemini-enterprise-agent-platform
- Google A2A announcement: https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
- Google Cloud A2A upgrade / AI Agent Marketplace: https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade
- Cloud Marketplace A2A agent requirements: https://docs.cloud.google.com/marketplace/docs/partners/ai-agents
- LangGraph workflows and agents: https://docs.langchain.com/oss/python/langgraph/workflows-agents
- CrewAI open source: https://crewai.com/open-source
- Dify GitHub README: https://github.com/langgenius/dify
- AgentOps docs: https://docs.agentops.ai/v2/introduction
- Gemini API models: https://ai.google.dev/gemini-api/docs/models
