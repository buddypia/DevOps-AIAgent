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
7. `src/marketIntel.ts` が公式ソース付き競合比較、差別化仮説、審査回答、次アクションを生成する
8. `src/mvpAudit.ts` が必須技術、審査5項目、DevOps証拠、提出3点をハードゲート判定する
9. `src/mission.ts` が弱点補強、A2A委任、検証runbook、ProtoPedia提出パックを生成する
10. `src/ops.ts` がCloud Run公開デモのシグナルから継続・ロールバック・追加雇用を判断する
11. `src/finalist.ts` が審査員5役の模擬判定、落選理由、残ギャップ、次の一手を生成する
12. `src/publisher.ts` がProtoPediaに貼る本文、タグ、URL、動画台本、残ギャップを提出直前パッケージにする
13. `src/demoRunway.ts` が証拠、最終候補判定、提出本文、AI市場、運用判断を30秒の審査員導線に束ねる
14. `src/autopilot.ts` が全証拠を一括判定し、win score、残ブロッカー、証拠デッキを返す
15. `src/dossier.ts` がProtoPedia本文、動画録画順、提出リンク、最終チェックを1つのドシエに束ねる
16. `src/proof.ts` がGemini、Cloud Run、A2A、競合/SWOT、Mission、Ops、提出URLを審査証拠束にまとめる
17. `src/judgeBrief.ts` が競合差別化、MVP監査、勝ち筋、提出証拠、30秒導線、残リスクを審査員向け1ページに圧縮する
18. `src/judgeTour.ts` がJudge Brief、Market Intel/SWOT、Impact Case、Security Review、Judge Proof、Submission Launch Gateを90秒の審査導線に束ねる
19. `src/userPilot.ts` が開発リード、Platform/SRE、提出者の初回利用導線、摩擦、次クリックを検証する
20. `src/squadOptimizer.ts` が予算内のAI編成を総当たりし、必須技術カバレッジ、交換計画、追加予算ギャップを返す
21. `src/liveEvidence.ts` が公開Cloud Run、Agent Card、A2A、Squad Optimizer、CIのライブ証拠をスコア化する
22. `src/autonomyLedger.ts` が市場探索、判断、契約、A2A委任、検証、運用、提出をAI自律性台帳にする
23. `src/security.ts` がSecret Manager、IP allowlist、入力制限、A2A信頼境界、CIを審査用セキュリティ証拠にする
24. `src/impact.ts` が対象ユーザー、時間短縮、提出信頼度、運用リスク、導入計画を実用性証拠にする
25. `src/submissionLaunch.ts` が外部提出URLを受け取り、提出3点、タグ、本文、CI、証拠receiptを最終判定する
26. `/api/recommend` が Gemini 3.5 Flash へ勝ち筋、リスク、競合/SWOT文脈を問い合わせる
27. Cloud Run が UI、API、A2A Agent Card を同一サービスで公開する

## A2A Surface

- Agent Card: `GET /.well-known/agent-card.json`
- JSON-RPC互換: `POST /a2a`
- Main skills:
  - `market.discover`
  - `agent.hire`
  - `contract.issue`
  - `task.delegate`
  - `strategy.audit`
  - `market.intel`
  - `mvp.audit`
  - `mission.run`
  - `autonomy.ledger`
  - `submission.publish`
  - `submission.dossier`
  - `submission.launch`
  - `security.review`
  - `impact.case`
  - `demo.runway`
  - `win.autopilot`
  - `ops.drill`
  - `finalist.simulate`
  - `judge.proof`
  - `judge.brief`
  - `judge.tour`
  - `user.pilot`
  - `squad.optimize`
  - `evidence.monitor`

## Strategy Surface

- Competitive arena: ADK / Google Cloud AI Agent Marketplace / LangGraph / CrewAI / Dify / AgentOps を比較
- SWOT: 現在の編成から strengths / weaknesses / opportunities / threats を再計算
- Judge scorecard: 審査5項目ごとのスコア、証拠、次アクションを表示
- MVP proof: Cloud Run、Gemini、A2A、公開GitHub、ProtoPediaの提出準備を分離
- Next hire: 最も弱い審査項目に効くエージェントを推薦

## Market Intel Surface

- `POST /api/market-intel`: Gemini Enterprise、Google ADK、A2A、LangGraph、CrewAI、Dify、AgentOps、Cloud Runの公式ソース付き比較を返す
- Source checklist: 審査員に見せられる一次情報URLを固定する
- Competitor cuts: 競合ごとに「相手が強い点」「露出する隙」「こちらの反撃」「デモ証拠」を分ける
- Judge answers: 審査5項目へそのまま返せる短い回答と証拠を生成する
- A2A payload: `market.intel` skillとしてmarket score、source ids、next movesを返す

## MVP Audit Surface

- `POST /api/mvp-audit`: 必須技術、審査5項目、DevOps証拠、提出3点をpass/watch/failで判定する
- Hard gates: Cloud Run、Gemini、A2A、競合/SWOT、CI、Ops、公開GitHub、デプロイ済みURL、ProtoPedia作品URL、動画URL、30秒導線
- Judge lanes: 審査5項目のスコア、証拠、次アクションを監査結果に含める
- Blockers: 未発行のProtoPedia作品URLと動画URLをwatchとして残し、外部作業を合格扱いしない
- A2A payload: `mvp.audit` skillとしてMVP score、band、gate statuses、blockersを返す

## Judge Brief Surface

- `POST /api/judge-brief`: Market Intel、MVP Audit、Win Autopilot、Judge Proof、Finalist、Submission Dossierを審査員向け1ページに束ねる
- Key metrics: brief、MVP、market、win、proof、finalistの6指標を横断表示する
- Proof ladder: 競合差別化、MVP判定、実行証拠、次アクション、提出ドシエを証拠URL付きで並べる
- Risk register: ProtoPedia作品URLと動画URLなど、外部作業の未完了を提出完了扱いせず明示する
- A2A payload: `judge.brief` skillとしてbrief score、readiness、metrics、risksを返す

## Judge Tour Surface

- `POST /api/judge-tour`: Judge Brief、Market Intel/SWOT、Impact Case、Security Review、Judge Proof、Submission Launch Gateを90秒ウォークスルーに束ねる
- Walkthrough steps: 0-90秒を6区間に分け、開く画面、話す台詞、証拠、endpoint、statusを返す
- Judge claims: AI中心性、競合差別化、実用性、安全境界、提出誠実性の5主張をscoreとevidenceに変換する
- Blockers: ProtoPedia作品URLと動画URLは未入力ならexternal、形式不正ならqualityとして扱い、提出完了にしない
- A2A payload: `judge.tour` skillとしてtour score、readiness、steps、claims、blockersを返す

## User Pilot Surface

- `POST /api/user-pilot`: 開発リード、Platform/SRE、ハッカソン提出者が最初の3分で価値へ到達できるかを検証する
- Persona paths: 各対象ユーザーにgoal、time-to-value、task list、success signal、proofを持たせる
- Frictions: ユーザビリティ、配送信頼度、公開デモwatch、安全境界をowner付き改善アクションに変換する
- Next clicks: Judge Tour、Contract Desk、Impact Case、Marketplaceなど、次に押すべきボタンを明示する
- A2A payload: `user.pilot` skillとしてpilot score、readiness、paths、frictions、next clicksを返す

## Squad Optimizer Surface

- `POST /api/squad-optimizer`: 予算と最大編成数を受け取り、候補編成を総当たりして最適解を返す
- Coverage gates: A2A marketplace、Gemini、Cloud Run、First-run UX、DevOps feedbackを同時に評価する
- Budget decision: 140予算では現行3体を維持し、UX Guildmaster追加に必要な+22をstretch squadとして明示する
- Swap plan: keep/add/remove/fundの手順に分け、審査動画で説明できる交換計画にする
- A2A payload: `squad.optimize` skillとしてoptimizer score、recommended squad、budget gap、swap planを返す

## Live Evidence Surface

- `POST /api/live-evidence`: 公開環境のCloud Run health、Agent Card、Squad Optimizer、A2A artifact、GitHub Actions CIをライブプローブする
- Probes: 各証拠にstatus、score、latency、URL、evidenceを持たせる
- Runbook: 審査員が同じ確認を再実行できるcurlを返す
- A2A payload: `evidence.monitor` skillとしてlive proof score、probe statuses、next actionsを返す

## Autonomy Ledger Surface

- `POST /api/autonomy-ledger`: AIエージェント中心性を、sense、decide、contract、delegate、verify、operate、submitの7段階台帳で返す
- Decision chain: 各段階にactor、decision、action、evidence、verifier、endpoint、statusを持たせる
- Handoffs: Contract Deskのagent contractsからscope、acceptance、verification proofを抽出する
- Judge challenges: 「単なるダッシュボードではないか」「なぜAIが必然か」「DevOpsサイクルが閉じているか」への反証を返す
- A2A payload: `autonomy.ledger` skillとしてledger score、verdict、phases、handoffs、receiptを返す

## Submission Launch Surface

- `POST /api/submission-launch`: ProtoPedia作品URLと動画URLを受け取り、最終提出可否を判定する
- URL gate: ProtoPediaは `protopedia.net`、動画はYouTube/Vimeo/Google Driveのhttps URL形式を検証する
- Final checklist: GitHub、Cloud Run、ProtoPedia、動画、findy_hackathonタグ、CI、MVP hard gates、本文、Judge Proof receiptを並べる
- Submit packet: Findy提出フォームに貼るGitHub URL、デプロイ済みURL、ProtoPedia URL、動画URL、タグを返す
- A2A payload: `submission.launch` skillとしてlaunch score、readiness、URL status、checklist、submit packetを返す

## Security Review Surface

- `POST /api/security-review`: Secret Manager、IP allowlist、Zod入力制限、A2A信頼境界、CI、Cloud Run runtimeを監査する
- Security controls: secret boundary、public demo allowlist、input contract、A2A trust、CI、prompt/output boundary、runtime guard、submission data minimizationをpass/watch/failで返す
- Trust boundaries: browser -> Express、Express -> Gemini、A2A broker -> skills、Cloud Run -> public URLの境界とguardrailを明示する
- Judge answers: Gemini APIキー、A2A権限、公開URL運用に関する厳しい質問へ短く答える
- A2A payload: `security.review` skillとしてsecurity score、posture、controls、threats、next security hireを返す

## Impact Case Surface

- `POST /api/impact-case`: 対象ユーザー、時間短縮、提出信頼度、運用リスク、導入計画を実用性・体験価値の証拠に変換する
- Metrics: AI能力選定時間、提出証拠づくり、委任の手戻り、公開デモ運用リスク、提出信頼度、体験価値をbefore/afterで返す
- Personas: 開発リード、Platform/SRE、ハッカソン提出者ごとのpain、workflow win、KPI、proofを返す
- Workflow: sense -> buy -> delegate -> operate -> submit のbefore/afterを、A2A Market Broker、Contract Desk、Autonomy Ledger、Cloud Run SRE、Gemini Strategistへ割り当てる
- A2A payload: `impact.case` skillとしてimpact score、posture、saved hours、runtime risk、submission confidence、next impact hireを返す

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
- `POST /api/market-intel`: ソース付き競合比較、審査回答、差別化次アクションを評価する
- `POST /api/mvp-audit`: MVPハードゲート、審査lane、提出blockerを評価する
- `POST /api/pitch`: 30秒動画のshot list、voiceover、lower thirds、recording checklist、提出残リスクを返す
- `POST /api/judge-drill`: 審査5項目ごとの厳しめ質問、回答、証拠リンク、デモ画面を返す
- `POST /api/finalist`: 審査員5役の最終候補判定、落選理由、残ギャップ、次の一手を返す
- `POST /api/publisher`: ProtoPediaに貼る本文、タグ、URL、動画台本、提出チェックリストを返す
- `POST /api/dossier`: ProtoPedia本文、動画録画順、提出リンク、証拠デッキ、最終チェックを返す
- `POST /api/demo-run`: Judge Proof、Finalist、Publisher、Marketplace、Strategy、Mission、Opsを30秒の審査員導線にする
- `POST /api/win-run`: 競合/SWOT、証拠、最終候補判定、提出、運用を一括実行し、勝てる状態と残アクションを返す
- `POST /api/impact-case`: 実用性のbefore/after、ユーザー別KPI、導入計画、審査回答を返す
- `POST /api/judge-tour`: 初見審査員向けに90秒の画面順、反論、証拠リンク、残ブロッカーを返す
- `POST /api/user-pilot`: 実利用者3ペルソナの初回導線、摩擦、次クリックを返す
- `POST /api/squad-optimizer`: 予算内の最適編成、追加予算ギャップ、交換計画を返す
- `POST /api/live-evidence`: 公開URL、Agent Card、A2A、Optimizer、CIをライブ検証する
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
- Publisher proof: `submission.publish` skillとして、ProtoPedia貼り付け本文、メディアURL、未完了外部作業をA2A payloadにも含める
- Dossier proof: `submission.dossier` skillとして、提出コピー欄、録画順、提出リンク、MarkdownドシエをA2A payloadにも含める
- Demo runway proof: `demo.runway` skillとして、30秒デモ順、証拠リンク、録画キュー、外部残リスクをA2A payloadにも含める
- Win autopilot proof: `win.autopilot` skillとして、win score、lane scorecards、残ブロッカー、証拠デッキをA2A payloadにも含める
- Judge brief proof: `judge.brief` skillとして、審査員の初見用にkey metrics、proof ladder、30秒route、risk registerをA2A payloadにも含める
- Autonomy ledger proof: `autonomy.ledger` skillとして、AIの判断連鎖、agent handoff、検証endpoint、sha256 receiptをA2A payloadにも含める
- Submission launch proof: `submission.launch` skillとして、外部URL入力後のsubmit-ready判定と提出フォーム用packetをA2A payloadにも含める
- Security review proof: `security.review` skillとして、Secret/IP/input/A2A/CIの安全境界をA2A payloadにも含める
- Impact proof: `impact.case` skillとして、実用性の定量指標、ユーザー別KPI、導入計画をA2A payloadにも含める
- Judge tour proof: `judge.tour` skillとして、審査員が開く順番、反論、証拠リンク、外部URLギャップをA2A payloadにも含める
- User pilot proof: `user.pilot` skillとして、開発リード、Platform/SRE、提出者のfirst-run usabilityをA2A payloadにも含める
- Squad optimizer proof: `squad.optimize` skillとして、予算制約下の自律編成判断、coverage gap、funding stepをA2A payloadにも含める
- Live evidence proof: `evidence.monitor` skillとして、公開Cloud Run/A2A/CIの再実行可能なライブ証拠をA2A payloadにも含める

## Submission Surface

- `GET /api/submission-kit`: 提出タイトル、タグ、ストーリー、動画ストーリーボード、構成図URL、提出チェックリストを返す
- `public/assets/a2a-marketplace-architecture.svg`: ProtoPediaに貼れるシステム構成図
- `docs/03_submission/submission-pack.md`: ProtoPediaストーリー欄に転記するMarkdown下書き
- UI: Mission Control実行後に Architecture Diagram / 30s Storyboard / Required Assets を表示

## GCP Surface

- Cloud Run service: `a2a-agent-marketplace`
- Health check: `/api/healthz` (`/healthz` もローカル互換で提供)
- Market intel: `/api/market-intel`
- MVP audit: `/api/mvp-audit`
- Judge brief: `/api/judge-brief`
- Judge tour: `/api/judge-tour`
- User pilot: `/api/user-pilot`
- Squad optimizer: `/api/squad-optimizer`
- Live evidence: `/api/live-evidence`
- Autonomy ledger: `/api/autonomy-ledger`
- Submission launch: `/api/submission-launch`
- Security review: `/api/security-review`
- Impact case: `/api/impact-case`
- Ops drill: `/api/ops-drill`
- Contracts: `/api/contracts`
- Publisher: `/api/publisher`
- Submission dossier: `/api/dossier`
- Demo runway: `/api/demo-run`
- Win autopilot: `/api/win-run`
- Pitch director: `/api/pitch`
- Judge drill: `/api/judge-drill`
- Finalist simulator: `/api/finalist`
- Judge proof: `/api/proof`
- Build: `cloudbuild.yaml`
- Secret boundary: `GEMINI_API_KEY` は環境変数のみ

## Judging Angle

- AIエージェントが価値の中心: 市場探索、購入判断、予算内の編成最適化、A2A委任、ライブ証拠監視、自律ミッション、運用ドリル、Gemini分析が体験の中心
- 課題アプローチ: AIを作るだけでなく、必要なAI能力を発見・調達・運用する問題を扱う
- ユーザビリティ: 数値・価格・改善量・競合/SWOTに加え、Judge Tour、Squad Optimizer、User Pilot Labで審査員と実利用者の最初の導線まで意思決定できる
- 実用性: 開発現場のエージェント選定、DevOps改善、公開後の異常検知とrollback判断に加え、Impact CaseとJudge Tourで時間短縮、提出信頼度、ユーザー別KPI、審査説明順を説明可能
- 実装力: React、Gemini API、A2A Agent Card、Cloud Run、戦略API、ミッションAPI、ライブ証拠プローブ、フォールバック、テストを含む
