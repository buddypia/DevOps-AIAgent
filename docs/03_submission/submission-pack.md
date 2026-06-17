# Agent-To-Agent Marketplace Submission Pack

## Title

Agent-To-Agent Marketplace

## Tags

- findy_hackathon
- DevOps
- AI Agent
- A2A
- Cloud Run
- Gemini

## One-liner

必要なAI能力を市場から探し、雇い、A2Aで委任し、Cloud Run運用と提出証跡まで閉じるエージェント調達ワークベンチ。

## Story

### 1. 解決したい課題と背景

AIエージェント開発では、エージェントを作る前に「どの能力を持つAIを選ぶべきか」が曖昧になりやすい。ADK、LangGraph、CrewAI、Dify、AgentOpsなどの基盤は強力だが、開発チームが審査基準、運用制約、A2A連携、検証証跡を見ながらAI能力を調達する体験はまだ弱い。

### 2. 想定ユーザー

- ハッカソンや新規事業でAIエージェントを短期間に企画、開発、デプロイする個人・チーム
- Cloud RunやGeminiを使った公開デモを作りたいエンジニア
- 複数のエージェントやMCPツールを、価値・価格・リスクで比較したい開発リード

### 3. プロダクトの特徴

- Project Briefを入力すると、必要能力を抽出し、AIエージェント市場から候補を推薦する
- 各エージェントを価格、能力値、MCP成熟度、A2Aスキルで比較できる
- Contract Deskで、選択したAIの成果物、受入条件、SLA、検証コマンドを発行する
- Winning Strategyで競合分析、SWOT、審査5項目、MVP proof、次に雇うべきAIを表示する
- Market Intel Boardで、Gemini Enterprise、Google ADK、A2A、LangGraph、CrewAI、Dify、AgentOps、Cloud Runの公式ソース付き比較、差別化仮説、審査回答を表示する
- MVP Auditで、必須技術、審査5項目、DevOps証拠、提出3点をpass/watch/failで監査し、外部未発行URLを合格扱いにしない
- Judge Briefで、競合差別化、MVP監査、勝ち筋、提出証拠、30秒導線、残リスクを審査員の初見1ページにまとめる
- Judge Tourで、Judge Brief、Market Intel/SWOT、Impact Case、Security Review、Judge Proof、Submission Launch Gateを90秒の審査導線に束ねる
- Autonomy Ledgerで、市場探索、判断、契約、A2A委任、検証、運用、提出を検収可能なAI自律性台帳として見せる
- Security Sentinel Reviewで、Secret Manager、IP allowlist、Zod入力制限、A2A信頼境界、CIを審査員向け安全性証拠にする
- Impact Caseで、対象ユーザー、時間短縮、提出信頼度、運用リスク、導入計画を実用性・体験価値の証拠にする
- Submission Launch Gateで、ProtoPedia作品URLと動画URLを入力し、提出3点、タグ、本文、CI、証拠receiptを最終判定する
- Mission Controlで、AIが弱点を検出し、A2A委任、検証runbook、提出パックを生成した証跡を見せる
- Ops Drillで、Cloud Run公開デモの稼働シグナルから継続・ロールバック・追加雇用を判断する
- Judge Proofで、Gemini、Cloud Run、A2A、競合/SWOT、Mission、Ops、GitHub Actions CI、提出URLを1クリックの証拠束にし、sha256 receiptで照合できるようにする
- Pitch Directorで、30秒動画の録画順、読み上げ台詞、字幕、証拠リンク、提出残リスクを生成する
- Judge Drillで、審査5項目ごとの厳しい質問、回答、証拠リンク、デモで開く画面を生成する
- Finalist Simulatorで、審査員5役の最終候補判定、落選理由、残ギャップ、次の一手を生成する
- Submission Publisherで、ProtoPediaに貼る本文、タグ、URL、動画台本、残ギャップを提出直前パッケージにする
- Demo Runwayで、Judge Proof、Finalist、Publisher、Marketplace、Strategy、Mission、Opsを30秒の審査員導線に束ねる
- Win Autopilotで、競合/SWOT、証拠、最終候補判定、提出、運用を一括判定し、win scoreと残アクションを返す
- Submission Dossierで、ProtoPedia本文、動画録画順、提出リンク、最終チェック、Markdownを1つに束ねる
- Gemini 3.5 Flashで勝ち筋、残リスク、30秒ピッチを生成する
- Cloud RunでUI、API、Agent Card、A2A endpointを単一サービスとして公開する

## System Architecture

![Agent-To-Agent Marketplace architecture](/assets/a2a-marketplace-architecture.svg)

```text
React UI
  -> Express API
  -> Recommendation / Contract / Strategy / Mission engines
  -> Market Intel source-backed competitor board
  -> MVP Audit hard gates
  -> Judge Brief one-page judge readout
  -> Judge Tour 90-second judge walkthrough
  -> Autonomy Ledger agent centrality audit
  -> Security Sentinel Review
  -> Impact Case
  -> Submission Launch Gate
  -> Ops Drill / Cloud Run runbook
  -> Judge Proof bundle
  -> Pitch Director
  -> Judge Drill
  -> Finalist Simulator
  -> Submission Publisher
  -> Demo Runway
  -> Win Autopilot
  -> Submission Dossier
  -> GitHub Actions CI
  -> Gemini 3.5 Flash
  -> A2A Agent Card + JSON-RPC endpoint
  -> Cloud Run
```

## 30 Second Demo Storyboard

| Time | Shot |
| --- | --- |
| 0-4s | Judge Tourで90秒導線、5つのjudge claims、外部URL不足を最初に見せる |
| 4-8s | Market Intelを実行し、公式ソース付き競合比較と「作る基盤ではなくAI能力調達で勝つ」仮説を見せる |
| 8-12s | Judge Briefでkey metrics、hard truth、proof ladder、risk registerを1画面で見せる |
| 12-16s | Autonomy LedgerでAIがsense -> decide -> contract -> delegate -> verify -> operate -> submitした台帳を見せる |
| 16-21s | Security Sentinel Review、Impact Case、Submission Launch Gate、Judge Proofで安全境界、実用性KPI、外部URL、Gemini/Cloud Run/A2A/CI/DevOpsの証拠束を見せる |
| 21-25s | Submission DossierでProtoPedia本文、提出リンク、録画順、最終チェックを見せる |
| 25-28s | Marketplace、Winning Strategy、Mission、Opsで必要能力、SWOT、A2A委任、運用判断を見せる |
| 28-30s | Cloud Run URL、GitHub Actions、Agent Card、構成図で締める |

## Verification Runbook

```bash
npm run typecheck
npm test
npm run build
make q.check-architecture
curl -s ${PUBLIC_BASE_URL:-http://localhost:8080}/api/healthz
curl -s ${PUBLIC_BASE_URL:-http://localhost:8080}/.well-known/agent-card.json
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/strategy \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/market-intel \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/mvp-audit \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/judge-brief \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/judge-tour \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"],"protopediaUrl":"https://protopedia.net/prototype/999999","videoUrl":"https://youtu.be/demo1234567"}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/autonomy-ledger \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/security-review \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/impact-case \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/submission-launch \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"],"protopediaUrl":"https://protopedia.net/prototype/999999","videoUrl":"https://youtu.be/demo1234567"}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/mission \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/win-run \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/dossier \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/demo-run \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/publisher \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/contracts \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/ops-drill \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/pitch \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/judge-drill \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/finalist \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/proof \
  -H 'Content-Type: application/json' \
  --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"]}'
curl -s https://api.github.com/repos/buddypia/DevOps-AIAgent/actions/workflows/ci.yml/runs?branch=main\&per_page=1
```

## Submission Checklist

- Public GitHub repository URL: <https://github.com/buddypia/DevOps-AIAgent>
- GitHub Actions CI: <https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml>
- Deployed URL: <https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app>
- ProtoPedia work URL: needs final URL
- Video URL: needs YouTube or Vimeo URL
- System architecture diagram: `public/assets/a2a-marketplace-architecture.svg`
- Required tag: `findy_hackathon`
