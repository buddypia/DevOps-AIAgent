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
8. `src/moatStress.ts` が主要競合からの反論を想定し、証拠付き回答、残リスク、録画順を生成する
9. `src/mvpAudit.ts` が必須技術、審査5項目、DevOps証拠、提出3点をハードゲート判定する
10. `src/mission.ts` が弱点補強、A2A委任、検証runbook、ProtoPedia提出パックを生成する
11. `src/ops.ts` がCloud Run公開デモのシグナルから継続・ロールバック・追加雇用を判断する
12. `src/finalist.ts` が審査員5役の模擬判定、落選理由、残ギャップ、次の一手を生成する
13. `src/publisher.ts` がProtoPediaに貼る本文、タグ、URL、動画台本、残ギャップを提出直前パッケージにする
14. `src/demoRunway.ts` が証拠、最終候補判定、提出本文、AI市場、運用判断を30秒の審査員導線に束ねる
15. `src/autopilot.ts` が競合/SWOT、Live Evidence、Judge Demo Receipt、Moat Stress、Squad Optimizerを含む全証拠を一括判定し、win score、残ブロッカー、証拠デッキを返す
16. `src/dossier.ts` がProtoPedia本文、動画録画順、提出リンク、構成図パケット、最終チェックを1つのドシエに束ねる
17. `src/architecturePack.ts` がシステム構成図、Mermaid、ノード/エッジ、必須技術対応表を提出証拠に変換する
18. `src/proof.ts` がGemini、Cloud Run、A2A、競合/SWOT、Mission、Ops、提出URLを審査証拠束にまとめる
19. `src/judgeBrief.ts` が競合差別化、MVP監査、勝ち筋、提出証拠、30秒導線、残リスクを審査員向け1ページに圧縮する
20. `src/judgeTour.ts` がJudge Brief、Market Intel/SWOT、Impact Case、Security Review、Judge Proof、Submission Launch Gateを90秒の審査導線に束ねる
21. `src/judgeCommandCenter.ts` がJudge Tour、Competitive Battlecard、Acceptance Matrix、Release Drift、Pilot Economics、Win Autopilotを最初の90秒の司令塔に束ねる
22. `src/prizeStrategy.ts` が審査5項目の目標点、現在証拠、足りない証拠、最終ピッチ順を優勝作戦に束ねる
23. `src/userPilot.ts` が開発リード、Platform/SRE、提出者の初回利用導線、摩擦、次クリックを検証する
24. `src/squadOptimizer.ts` が予算内のAI編成を総当たりし、必須技術カバレッジ、交換計画、追加予算ギャップを返す
25. `src/liveEvidence.ts` が公開Cloud Run、Agent Card、A2A、Squad Optimizer、CIのライブ証拠をスコア化する
26. `src/releaseDrift.ts` が提出用Cloud Run URLのAgent Card、Acceptance Matrix、A2A artifactのrevision driftを検知する
27. `src/deployRecovery.ts` がrelease drift、gcloud認証、Cloud Build、公開再検証を復旧計画にする
28. `src/demoReceipt.ts` が審査導線、競合反論、編成判断、公開証拠、外部提出URLをsha256 digest付き検収票にする
29. `src/acceptanceMatrix.ts` が必須技術、審査5項目、公開証拠、提出物をaccepted/watch/blockedの受入表にする
30. `src/autonomyLedger.ts` が市場探索、判断、契約、A2A委任、検証、運用、提出をAI自律性台帳にする
31. `src/security.ts` がSecret Manager、IP allowlist、入力制限、A2A信頼境界、CIを審査用セキュリティ証拠にする
32. `src/impact.ts` が対象ユーザー、時間短縮、提出信頼度、運用リスク、導入計画を実用性証拠にする
33. `src/submissionLaunch.ts` が外部提出URLを受け取り、提出3点、タグ、本文、CI、証拠receiptを最終判定する
34. `/api/recommend` が Gemini 3.5 Flash へ勝ち筋、リスク、競合/SWOT文脈を問い合わせる
35. Cloud Run が UI、API、A2A Agent Card を同一サービスで公開する

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
  - `moat.stress`
  - `competitive.battlecard`
  - `mvp.audit`
  - `mission.run`
  - `autonomy.ledger`
  - `submission.publish`
  - `submission.dossier`
  - `submission.launch`
  - `security.review`
  - `impact.case`
  - `pilot.economics`
  - `demo.runway`
  - `win.autopilot`
  - `ops.drill`
  - `finalist.simulate`
  - `judge.proof`
  - `judge.brief`
  - `judge.command`
  - `prize.strategy`
  - `judge.tour`
  - `user.pilot`
  - `squad.optimize`
  - `evidence.monitor`
  - `release.drift`
  - `deploy.recover`
  - `demo.receipt`
  - `acceptance.matrix`

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

## Moat Stress Surface

- `POST /api/moat-stress`: ADK、A2A Marketplace、LangGraph、CrewAI、Dify、AgentOpsからの反論を競合別にストレステストする
- Objections: 「ADKで十分では」「LangGraphで代替できるのでは」などの審査員ツッコミを固定する
- Proof routes: 各反論に対してMarket Intel、Judge Tour、Live Evidence、Agent Cardのどれを見せるかを返す
- Recording order: 競合/SWOT、Moat Stress、Live Evidence、Submission Launch Gateを録画順に変換する
- A2A payload: `moat.stress` skillとしてmoat score、scenario verdicts、next actionsを返す

## Competitive Battlecard Surface

- `POST /api/competitive-battlecard`: Market Intel、Moat Stress、SWOTを競合別の審査回答カードへ束ねる
- Cards: 競合ごとに「審査員の質問」「短い回答」「相手が勝つ領域」「こちらが勝つ領域」「見せる証拠route」を返す
- Source/SWOT receipts: 公式ソースURLとSWOT項目を同じカードに載せ、競合分析が主張だけで終わらないようにする
- Judge script: 質疑で話す順番を「相手の強みを認める → 調達体験へずらす → 証拠を開く」に固定する
- A2A payload: `competitive.battlecard` skillとしてbattle score、readiness、card verdicts、top risksを返す

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

## Judge Command Center Surface

- `POST /api/judge-command-center`: Judge Tour、Competitive Battlecard、Acceptance Matrix、Release Drift、Pilot Economics、Win Autopilotを初回審査導線の司令塔に束ねる
- Proof buttons: 90秒導線、競合回答、MVP受入表、公開revision、導入採算、勝ち筋判定の6証拠へ移動できる
- Blockers: 公開Cloud Runのrevision drift、受入表blocked、外部提出URLwatchをowner付きの次アクションへ変換する
- A2A payload: `judge.command` skillとしてcommand score、readiness、metrics、proof buttons、blockersを返す

## Demo Concierge Surface

- `POST /api/demo-concierge`: 審査員、買い手、提出者の最初の1クリック、話す台詞、証拠URL、成功条件を固定し、Judge Route Lockで0-90秒の一本道に圧縮する
- Persona lanes: 初見審査員、Platform/SRE buyer、ハッカソン提出者ごとにentry question、first click、value moment、score lift、step endpointを返す
- Route lock: judge/buyer/submitter laneからlocked steps、proof URL到達率、ひと息台詞、捨てる導線を返し、初見審査員の自由探索を防ぐ
- Friction cuts: 機能過多、実用性説明、競合差別化の迷いを、どの証拠順で減らすかを返す
- A2A payload: `demo.concierge` skillとしてconcierge score、readiness、single next click、route lock、persona lanes、success criteriaを返す

## Judge Rehearsal Surface

- `POST /api/judge-rehearsal`: Judge Command、Demo Concierge、Judge Tour、Prize Strategy、Submission Closeoutを90秒の実演リハーサルへ束ねる
- Segments: 0-90秒で開く画面、押すボタン、話す台詞、成功signal、proof URLをready/watch/blockedで返す
- Question deck: 審査員の想定質問、短い回答、開く証拠URLを固定し、質疑で迷う時間を減らす
- Capture checklist: 動画録画のchapterとcloseout receipt確認を同じレスポンスに含める
- A2A payload: `judge.rehearsal` skillとしてrehearsal score、readiness、next run、endpoint群を返す

## Winner Proof Packet Surface

- `POST /api/winner-packet`: 審査5項目ごとの主張、証拠URL、競合/SWOT反論、録画cue、提出copyを1枚のpacketへ束ねる
- Criteria cards: AI中心性、課題アプローチ、ユーザビリティ、実用性、実装力をscore/status/proof URL付きで返す
- Objection answers: Judge Rehearsalのquestion deckとCompetitive Battlecardのtop risksを、質疑で開く証拠URLへ変換する
- Submission copy: ProtoPedia本文や動画説明へ貼るone-line、winner thesis、proof order、missing external URLを返す
- A2A payload: `winner.packet` skillとしてpacket score、readiness、criteria proof URLs、endpoint群を返す

## Final Submission Runway Surface

- `POST /api/submission-runway`: 2026/7/10 23:59 JSTから逆算し、動画、ProtoPedia、構成図、Launch Gate、最終フォームをworkback planへ束ねる
- Tracks: winner proof、ProtoPedia assets、demo video、final launchをscore/status/due date/proof URL付きで返す
- Evidence locks: Winner Packet、Submission Closeout、Submission Launch Gate、Release Drift Guardを提出直前の検収URLとして固定する
- A2A payload: `submission.runway` skillとしてrunway score、readiness、days remaining、next action、endpoint群を返す

## Prize Strategy Surface

- `POST /api/prize-strategy`: 審査5項目のtarget score、現在スコア、足りない証拠、最終ピッチ順を優勝作戦へ束ねる
- Criteria board: AI中心性、課題アプローチ、ユーザビリティ、実用性、実装力をtarget 92点のgapとして評価する
- Proof moves: Demo Concierge、Judge Route Lock、Judge Command Center、Competitive Battlecard、Acceptance Matrix、Release Drift、Pilot Economicsを最終ピッチで開く順番へ変換する
- Risks: 外部提出URL、公開revision、弱い採点軸、command blockerをowner付きの次アクションにする
- A2A payload: `prize.strategy` skillとしてprize score、readiness、criteria gaps、proof moves、risksを返す

## Win Gap Radar Surface

- `POST /api/win-gap-radar`: Competitive Battlecard、SWOT、MVP Audit、Finalist、Acceptance Matrix、Prize Strategy、Demo Concierge、Submission Launch Gateを横断し、優勝に必要なMVP gapをfeature betsへ変換する
- Gap lanes: AI中心性、競合アプローチ、初回UX、実用性、実装証拠、外部提出closeoutをscore/status/priority付きで返す
- Feature bets: Judge Route Lockなど、いま作るべき機能仮説、受入条件、証拠URLを返し、不要な汎用workflow builderや本番決済はcut listに落とす
- Honest external gate: ProtoPedia作品URLと動画URLが未発行なら、`submission-closeout` を `close-now` とし、submit-ready/finalist-readyとは呼ばない
- A2A payload: `win.gap.radar` skillとしてradar score、readiness、lane statuses、feature bets、external gapsを返す

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

## External Evidence Surface

- `POST /api/external-evidence`: 公開GitHub、Cloud Run、ProtoPedia作品URL、動画URLが審査員から開けるかをライブプローブする
- Safe URL policy: 任意URLを無制限にfetchせず、GitHub、Cloud Run、ProtoPedia、YouTube/Vimeo/Google Driveだけを許可する
- Runbook: 提出直前に同じ4 URLを再検証できるcurlを返す
- A2A payload: `external.evidence` skillとしてexternal proof score、finalUrlsReady、probe statuses、next actionsを返す

## Release Drift Surface

- `POST /api/release-drift`: 提出用Cloud Run URLが最新mainのAgent Card、Acceptance Matrix、A2A artifactを返しているかを検査する
- Drift probes: target health、Agent Card skill surface、Acceptance Matrix endpoint、A2A artifact endpoints、latest main CIを同時に評価する
- Verdict: 最新なら `release-current`、公開URLが古いなら `deploy-drift`、health/CIが落ちたら `release-blocked`
- Runbook: `gcloud auth login`、Cloud Build submit、Agent Card skill count、Acceptance Matrix、A2A artifactの再確認コマンドを返す
- A2A payload: `release.drift` skillとしてdrift score、missing skills、redeploy action、target endpointを返す

## Deploy Recovery Surface

- `POST /api/deploy-recovery`: Release Drift Guardの結果と直近gcloudエラーを、再デプロイ復旧計画に変換する
- Checks: target health、skill surface、Cloud Build auth、A2A artifact、latest main CIをready/watch/blockedで返す
- Commands: `gcloud auth login`、Cloud Build submit、Agent Card skill count、`/api/deploy-recovery`、A2A `deployRecoveryEndpoint` の再検証コマンドを返す
- A2A payload: `deploy.recover` skillとしてrecovery score、readiness、blocking commands、blockersを返す

## Demo Receipt Surface

- `POST /api/demo-receipt`: Judge Tour、Moat Stress Test、Squad Optimizer、Live Evidence Monitor、Submission Launch Gateを審査デモreceiptへ束ねる
- Stamps: 審査導線、競合反論、編成判断、公開証拠、A2A surface、外部提出URLをsealed/watch/missingで固定する
- Digest: stamp statuses、選択agent、外部URL、verdictからsha256 digestを作り、録画後の照合に使う
- External truth: ProtoPedia作品URLと動画URLは未入力ならwatchとして残し、提出完了扱いにしない
- A2A payload: `demo.receipt` skillとしてreceipt score、verdict、digest、next actions、endpointを返す

## Acceptance Matrix Surface

- `POST /api/acceptance-matrix`: 必須技術、審査5項目、競合/SWOT、公開証拠、Release Drift、提出物、Demo Receiptを最大14行の受入表へ束ねる
- Rows: Cloud Run、Google AI、A2A中心性、競合/SWOT、Moat反論、User Pilot、Impact、Pilot Economics、Implementation、Live Evidence、Release Drift、Security、Submission assets、Demo Receiptをaccepted/watch/blockedで返す
- Verdict: blockedがあれば `not-accepted`、外部URLなどwatchだけなら `accepted-with-external-gaps`、全行acceptedなら `ready-to-submit`
- Digest: row statuses、Judge Proof digest、Demo Receipt digest、Pilot Economics postureからsha256を作り、質疑で同じ受入状態を照合する
- A2A payload: `acceptance.matrix` skillとしてacceptance score、verdict、row statuses、next actions、endpointを返す

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

## Submission Closeout Surface

- `POST /api/submission-closeout`: Submission Dossier、Publisher、Demo Runway、Judge Proof、Launch Gateを束ね、外部提出作業を順番付きのworkbenchに変換する
- Work items: ProtoPedia貼付、構成図添付、30秒動画、ProtoPedia公開、Launch Gate封印、Findy提出、receipt確認をready/watch/blockedで返す
- Copy/video trays: ProtoPediaに貼るcopy fieldsと30秒動画のchapterを同じレスポンスで返す
- A2A payload: `submission.closeout` skillとしてcloseout score、readiness、next action、work items、URL status、endpoint群を返す

## Architecture Pack Surface

- `POST /api/architecture-pack`: ProtoPedia必須のシステム構成図を、公開SVG、Mermaid、ノード/エッジ、必須技術対応表、貼り付けチェックリストへ変換する
- Requirement map: Cloud Run、Gemini API、A2A委任、GitHub Actions/Release Drift、システム構成図、外部提出URLをready/watchで返す
- Dossier integration: `Submission Dossier` のhandoff packet内に構成図URL、architecture score、要件対応表を含める
- A2A payload: 既存の `submission.package` skillとしてarchitecture score、diagram URL、nodes/edges、requirements、endpointを返す

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

## Pilot Economics Surface

- `POST /api/pilot-economics`: Impact Case、User Pilot、Contract Desk、Ops Drill、Security Reviewを使い、導入費用、回収日数、価格レーン、買い手の反論を返す
- Unit economics: saved hours、assumed hourly cost、monthly value、pilot cost、payback days、confidence scoreを固定する
- Pricing lanes: 2-week pilot、team retainer、procurement deskを価格、対象買い手、受入条件つきで返す
- Buyer objections: 既存ツールで十分、ROI仮説、安全性、初回利用の4反論に証拠付きで答える
- A2A payload: `pilot.economics` skillとしてeconomics score、posture、unit economics、pricing、pilot plan、buyer objectionsを返す

## Contract Surface

- `POST /api/contracts`: 選択済みAIの契約、受入条件、SLA、検証runbook、A2A payloadを返す
- `POST /api/task-board`: 選択済みAIへA2A `message/send` 形式の仕事票、受入条件、proof URL、検証キューを返す
- Contract score: 予算、審査スコア、verification、ops readiness、契約リスクから算出する
- Acceptance runbook: GitHub Actions、Judge Proof、Ops Drill、Pitch Directorを検収条件へ接続する
- A2A payload: `contract.issue` skillとして価格、risk、acceptanceCriteriaを返す

## Mission Surface

- Autonomous proof: sense → decide → delegate → verify → ship の5段階で、AIが判断して動いた証跡を表示
- Decisions: 競合ポジション、最弱審査項目、次に雇うAIを明示
- Verification runbook: typecheck / test / build / `/api/healthz` / Agent Card / Strategy API を提出時の証拠として固定
- Submission pack: ProtoPediaタイトル、タグ、ストーリー、30秒動画スクリプト、構成図SVG、提出チェックリストを生成

## Operations Surface

- `POST /api/ops-drill`: Cloud Run health、p95 latency、5xx率、Gemini fallback、予算余力、外部提出URLの状態を評価する
- `POST /api/contracts`: AI契約、受入条件、SLA、検証コマンド、支払い条件を評価する
- `POST /api/market-intel`: ソース付き競合比較、審査回答、差別化次アクションを評価する
- `POST /api/moat-stress`: 主要競合からの反論、証拠付き回答、録画順を評価する
- `POST /api/competitive-battlecard`: 公式ソース、SWOT、競合反論、証拠routeを審査回答カードとして評価する
- `POST /api/mvp-audit`: MVPハードゲート、審査lane、提出blockerを評価する
- `POST /api/judge-command-center`: 初回審査用の証拠ボタン、90秒timeline、残ブロッカーを評価する
- `POST /api/demo-concierge`: persona別のfirst click、台詞、証拠URL、成功条件を返す
- `POST /api/judge-rehearsal`: 90秒segments、想定質問、scorecard、録画チェックを返す
- `POST /api/winner-packet`: 審査5項目の証拠URL、反論回答、録画cue、提出copyを返す
- `POST /api/submission-runway`: 提出締切から逆算した動画、ProtoPedia、構成図、最終フォームの検収順を返す
- `POST /api/prize-strategy`: 審査5項目の優勝作戦、proof moves、final pitch orderを返す
- `POST /api/pitch`: 30秒動画のshot list、voiceover、lower thirds、recording checklist、提出残リスクを返す
- `POST /api/judge-drill`: 審査5項目と主要競合への厳しめ質問、回答、60秒回答パス、証拠リンク、デモ画面を返す
- `POST /api/finalist`: 審査員5役の最終候補判定、落選理由、残ギャップ、次の一手を返す
- `POST /api/publisher`: ProtoPediaに貼る本文、タグ、URL、動画台本、提出チェックリストを返す
- `POST /api/dossier`: ProtoPedia本文、動画録画順、提出フォームhandoff packet、構成図パケット、提出リンク、証拠デッキ、最終チェックを返す
- `POST /api/architecture-pack`: 構成図URL、Mermaid、ノード/エッジ、必須技術対応表、ProtoPedia貼り付けチェックリストを返す
- `POST /api/demo-run`: Judge Proof、Finalist、Publisher、Marketplace、Strategy、Mission、Opsを30秒の審査員導線にする
- `POST /api/win-run`: 競合/SWOT、Live Evidence、Judge Demo Receipt、Moat Stress、Squad Optimizer、最終候補判定、提出、運用を一括実行し、勝てる状態と残アクションを返す
- `POST /api/impact-case`: 実用性のbefore/after、ユーザー別KPI、導入計画、審査回答を返す
- `POST /api/judge-tour`: 初見審査員向けに90秒の画面順、反論、証拠リンク、残ブロッカーを返す
- `POST /api/user-pilot`: 実利用者3ペルソナの初回導線、摩擦、次クリックを返す
- `POST /api/squad-optimizer`: 予算内の最適編成、追加予算ギャップ、交換計画を返す
- `POST /api/live-evidence`: 公開URL、Agent Card、A2A、Optimizer、CIをライブ検証する
- `POST /api/external-evidence`: 公開GitHub、Cloud Run、ProtoPedia、動画URLの外部到達性を検証する
- `POST /api/release-drift`: 提出用Cloud Run URLが最新revisionかを検査する
- `POST /api/deploy-recovery`: release driftとgcloud認証失敗をCloud Run復旧計画へ変換する
- `POST /api/demo-receipt`: 審査デモのstamp、外部URL状態、sha256 digestを検収票として返す
- `POST /api/acceptance-matrix`: 必須技術、審査5項目、公開証拠、提出物を受入表として返す
- `POST /api/task-board`: `task.delegate` の委任先、目的、検収条件、A2A payload、receiptを返す
- Release gate: Cloud Run SREが公開継続かrollbackかを判断する
- Rebuy loop: A2A Market BrokerがObservability Oracle / Test Forge / Security Sentinelの買い足しを推薦する
- Runbook: `/api/healthz`、ops drill、Cloud Run describe、Cloud Logging、traffic updateコマンドを提示する
- A2A payload: `ops.drill` skillとしてseverity、signals、rollbackRecommended、nextOpsAgentを返す

## Proof Surface

- `POST /api/proof`: Gemini実行、Cloud Run公開、A2A、競合/SWOT、Mission、Ops、GitHub Actions CI、提出URLを1つの審査証拠束にまとめる
- UI: `Run judge proof` ボタンでoverall proof score、7カテゴリスコア、live links、proof runbook、sha256 receiptを表示する
- A2A skill: `judge.proof` としてAgent Cardにも公開する
- Contract proof: `contract.issue` skillとして、AIの購入が成果物と検収条件に接続されていることを示す
- Task delegation proof: `task.delegate` skillとして、選んだAIへの仕事票、受入条件、proof URL、sha256 receiptをA2A payloadにも含める
- CI proof: `.github/workflows/ci.yml` が `npm run typecheck`、`npm test`、`npm run build`、`make q.check-architecture` を公開repo上で実行し、Proof APIが最新main runを取り込む
- Pitch proof: `pitch.director` skillとして、審査員に見せる順番と提出動画の残作業をA2A payloadにも含める
- Judge drill: `judge.drill` skillとして、審査員の反論、競合Cross-exam deck、60秒回答パス、証拠リンクをA2A payloadにも含める
- Finalist proof: `finalist.simulate` skillとして、最終候補スコア、judge consensus、残ギャップをA2A payloadにも含める
- Publisher proof: `submission.publish` skillとして、ProtoPedia貼り付け本文、メディアURL、未完了外部作業をA2A payloadにも含める
- Dossier proof: `submission.dossier` skillとして、提出コピー欄、録画順、提出フォームhandoff packet、構成図パケット、提出リンク、MarkdownドシエをA2A payloadにも含める
- Closeout proof: `submission.closeout` skillとして、外部提出の残作業、copy tray、video run、submit packetをA2A payloadにも含める
- Architecture proof: `submission.package` skillとして、システム構成図、Mermaid、必須技術対応表、ProtoPedia checklistをA2A payloadにも含める
- Demo runway proof: `demo.runway` skillとして、30秒デモ順、証拠リンク、録画キュー、外部残リスクをA2A payloadにも含める
- Win autopilot proof: `win.autopilot` skillとして、win score、12 lane scorecards、残ブロッカー、証拠デッキ、live evidence score、receipt digest、moat verdict、squad readinessをA2A payloadにも含める
- Judge brief proof: `judge.brief` skillとして、審査員の初見用にkey metrics、proof ladder、30秒route、risk registerをA2A payloadにも含める
- Autonomy ledger proof: `autonomy.ledger` skillとして、AIの判断連鎖、agent handoff、検証endpoint、sha256 receiptをA2A payloadにも含める
- Submission launch proof: `submission.launch` skillとして、外部URL入力後のsubmit-ready判定と提出フォーム用packetをA2A payloadにも含める
- Security review proof: `security.review` skillとして、Secret/IP/input/A2A/CIの安全境界をA2A payloadにも含める
- Impact proof: `impact.case` skillとして、実用性の定量指標、ユーザー別KPI、導入計画をA2A payloadにも含める
- Pilot economics proof: `pilot.economics` skillとして、導入費用、回収日数、価格レーン、買い手の反論をA2A payloadにも含める
- Demo concierge proof: `demo.concierge` skillとして、審査員/買い手/提出者のfirst click、証拠URL、成功条件、friction cutsをA2A payloadにも含める
- Judge command proof: `judge.command` skillとして、最初の90秒で押す証拠、Competitive Battlecard、公開revision drift、MVP受入状態、導入採算、残ブロッカーをA2A payloadにも含める
- Win gap radar proof: `win.gap.radar` skillとして、競合/SWOTから導いたMVP gap lanes、feature bets、cut list、外部提出closeoutをA2A payloadにも含める
- Judge tour proof: `judge.tour` skillとして、審査員が開く順番、反論、証拠リンク、外部URLギャップをA2A payloadにも含める
- User pilot proof: `user.pilot` skillとして、開発リード、Platform/SRE、提出者のfirst-run usabilityをA2A payloadにも含める
- Squad optimizer proof: `squad.optimize` skillとして、予算制約下の自律編成判断、coverage gap、funding stepをA2A payloadにも含める
- Live evidence proof: `evidence.monitor` skillとして、公開Cloud Run/A2A/CIの再実行可能なライブ証拠をA2A payloadにも含める
- External evidence proof: `external.evidence` skillとして、公開GitHub、Cloud Run、ProtoPedia、動画URLの到達性と残アクションをA2A payloadにも含める
- Release drift proof: `release.drift` skillとして、公開Cloud Runが最新Agent Card/Acceptance Matrix/A2A artifactを返すかをA2A payloadにも含める
- Deploy recovery proof: `deploy.recover` skillとして、gcloud認証、Cloud Build、公開再検証の復旧計画をA2A payloadにも含める
- Demo receipt proof: `demo.receipt` skillとして、審査導線、競合反論、編成判断、公開証拠、外部提出URL状態、sha256 digestをA2A payloadにも含める
- Acceptance matrix proof: `acceptance.matrix` skillとして、必須技術、審査5項目、公開証拠、提出物の受入状態をA2A payloadにも含める
- Task board proof: `task.delegate` skillとして、agent work orders、execution order、verification queue、receipt digestをA2A payloadにも含める
- Moat stress proof: `moat.stress` skillとして、競合別の想定反論、反証、見せる証拠、録画順をA2A payloadにも含める
- Competitive battlecard proof: `competitive.battlecard` skillとして、競合別の短い回答、公式ソース、SWOT receipts、top risksをA2A payloadにも含める

## Submission Surface

- `GET /api/submission-kit`: 提出タイトル、タグ、ストーリー、動画ストーリーボード、構成図URL、提出チェックリストを返す
- `public/assets/a2a-marketplace-architecture.svg`: ProtoPediaに貼れるシステム構成図
- `POST /api/architecture-pack`: 構成図を提出証拠、Mermaid、必須技術対応表として再生成する
- `docs/03_submission/submission-pack.md`: ProtoPediaストーリー欄に転記するMarkdown下書き
- UI: Mission Control実行後に Architecture Diagram / 30s Storyboard / Required Assets を表示し、Submission DossierでArchitecture packを提出直前に確認する

## GCP Surface

- Cloud Run service: `a2a-agent-marketplace`
- Health check: `/api/healthz`
- Market intel: `/api/market-intel`
- Moat stress: `/api/moat-stress`
- Competitive battlecard: `/api/competitive-battlecard`
- Win gap radar: `/api/win-gap-radar`
- MVP audit: `/api/mvp-audit`
- Judge brief: `/api/judge-brief`
- Judge command center: `/api/judge-command-center`
- Judge rehearsal: `/api/judge-rehearsal`
- Winner proof packet: `/api/winner-packet`
- Final submission runway: `/api/submission-runway`
- Judge tour: `/api/judge-tour`
- User pilot: `/api/user-pilot`
- Squad optimizer: `/api/squad-optimizer`
- Live evidence: `/api/live-evidence`
- External evidence: `/api/external-evidence`
- Release drift: `/api/release-drift`
- Deploy recovery: `/api/deploy-recovery`
- Demo receipt: `/api/demo-receipt`
- Acceptance matrix: `/api/acceptance-matrix`
- Autonomy ledger: `/api/autonomy-ledger`
- Agent task board: `/api/task-board`
- Submission launch: `/api/submission-launch`
- Submission closeout: `/api/submission-closeout`
- Security review: `/api/security-review`
- Impact case: `/api/impact-case`
- Pilot economics: `/api/pilot-economics`
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

- AIエージェントが価値の中心: 市場探索、購入判断、競合反論の証拠選択、予算内の編成最適化、A2A委任仕事票、ライブ証拠監視、release drift検知、deploy recovery、審査デモreceipt、受入表、Judge Command Center、自律ミッション、運用ドリル、Gemini分析が体験の中心
- 課題アプローチ: AIを作るだけでなく、必要なAI能力を発見・調達・運用する問題を扱う
- ユーザビリティ: 数値・価格・改善量・競合/SWOTに加え、Judge Command Center、Judge Tour、Squad Optimizer、User Pilot Labで審査員と実利用者の最初の導線まで意思決定できる
- 実用性: 開発現場のエージェント選定、DevOps改善、公開後の異常検知とrollback判断に加え、Deploy Recovery、Impact Case、Pilot Economics、Judge Command Centerで時間短縮、提出信頼度、回収日数、価格レーン、審査説明順を説明可能
- 実装力: React、Gemini API、A2A Agent Card、Cloud Run、戦略API、ミッションAPI、ライブ証拠プローブ、release drift検知、sha256 receipt、acceptance digest、フォールバック、テストを含む
