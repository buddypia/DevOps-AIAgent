# Agent-To-Agent Marketplace

必要な能力を持つAIを市場から探し、雇い、A2Aで連携させる DevOps x AI Agent Hackathon 向けプロダクトです。

## Concept

`brief2dev` の「要件を開発・検証・運用へ落とす」考え方を、エージェント市場に変換しました。ユーザーはプロジェクトブリーフを貼り、AIエージェントを能力値・スキル・MCP成熟度・価格で比較して購入します。購入すると、企画、実装配送、運用信頼性、ユーザビリティ、A2A統制の改善量が可視化されます。

## Hackathon Fit

- Google Cloud: Cloud Run デプロイを前提にした `Dockerfile` / `cloudbuild.yaml` / `/api/healthz`
- AI: Gemini API `gemini-3.5-flash`
- A2A: `/.well-known/agent-card.json` と `/a2a` JSON-RPC互換エンドポイント
- DevOps: GitHub Actions CI/CD/Cloud Run運用を見据えた推薦、検証コマンド、MCP行列
- UX: Agent Studio の「AIをキャラクターとして管理する」発想を、市場・購入・編成のゲームループに再構成
- Contract: 選んだAIごとに成果物、受入条件、SLA、検証コマンド、支払い条件を生成
- Agent Task Board: 選んだAIごとにA2A `message/send` 形式の仕事票、受入条件、証拠URL、sha256 receiptを生成
- Strategy: ADK、A2A Marketplace、LangGraph、CrewAI、Dify、AgentOpsとの差分をアプリ内で比較し、SWOT、審査5項目、提出準備、次に雇うべきAIを算出
- Market Intel: Gemini Enterprise、ADK、A2A、LangGraph、CrewAI、Dify、AgentOps、Cloud Runの公式ソース付き比較とSource Freshness Lockで、差別化仮説、審査回答、ソース到達性を生成
- Moat Stress Test: ADK、A2A Marketplace、LangGraph、CrewAI、Dify、AgentOpsからの反論を想定し、証拠付き回答と録画順を返す
- Competitive Battlecard: 公式ソース、SWOT、競合反論、証拠routeを競合別の審査回答カードに束ね、Criteria Duelで審査5項目ごとの競合勝敗を固定し、Win/Loss Lockで各競合の譲る強み・反撃・証拠URL・MVP actionを検収し、Objection ReplayとCompetitive Proof Lockで最弱競合への30秒回答順と証拠完全性を固定する
- Win Gap Radar: 競合/SWOT、MVP監査、最終候補判定、Prize Strategyを横断し、優勝に必要なMVP gapをfeature bets、Feature Freeze Lock、cut listへ変換する
- MVP Audit: 必須技術、審査5項目、DevOps証拠、提出3点をハードゲートで判定し、外部未発行URLをwatchとして残す
- Judge Brief: 競合差別化、MVP監査、勝ち筋、提出証拠、30秒導線、残リスクを審査員の初見1ページに圧縮
- Judge First-Click Strip: Cloud Runのトップ画面直下からJudge Snapshot、Winner Packet、Objection Arena、Competitive SWOT、MVP Readiness、Deploy Recovery、Autonomy、Pilot Value、Recording、Architecture Pack、Submission Launch、Submission AssetsへPOSTなしで移動できる入口を固定し、Agent Card/A2A/Release Driftでも `judge.first-click` として検収する
- First-Click Smoke Lock: First-Clickの12本のGET証拠ページがSPA fallbackではなく固有の審査HTMLを返すかをsentinelで検収する
- Judge Command Center: Judge Tour、Competitive Battlecard、Acceptance Matrix、Release Drift、Pilot Economics、Win Autopilotを最初の90秒の司令塔に束ねる
- Demo Concierge: 審査員、買い手、提出者ごとの最初の1クリック、台詞、証拠URL、成功条件を固定し、Judge Route LockとFirst-Run Focus Lockで0-90秒の一本道に圧縮する
- Judge Rehearsal Room: 90秒の開く画面、話す台詞、想定質問、録画チェックを1つのrun roomに束ねる
- Winner Proof Packet: 審査5項目ごとの主張、証拠URL、競合/SWOT反論、録画cue、提出copyを1枚に束ねる
- Winner Sufficiency Lock: MVP、競合/SWOT、公開証拠、first-click、Feature Freeze、提出URLを束ね、「機能は本当に十分か」を優勝線でyes/no判定する
- Objection Arena: Winner Packetから競合/SWOT、AI中心性、実用性、公開revisionへの厳しい質問を抽出し、最終質疑で開く証拠URL付きの反論レーンへ束ねる
- Final Submission Runway: 2026/7/10 23:59 JSTから逆算し、動画、ProtoPedia、構成図、最終フォームを検収順に束ねる
- External Evidence Verifier: 公開GitHub、Cloud Run、ProtoPedia作品URL、動画URLが審査員から開けるかをライブ検証する
- Prize Strategy Board: 審査5項目の目標点、現在証拠、足りない証拠、Prize Criteria Lock、最終ピッチ順を優勝作戦として束ねる
- Judge Tour: Judge Brief、Market Intel/SWOT、Impact Case、Security Review、Judge Proof、Submission Launch Gateを90秒の審査導線に束ねる
- User Pilot Lab: 開発リード、Platform/SRE、提出者が最初の3分で価値へ到達できるかを検証し、摩擦と次クリックを出す
- Pilot Value Snapshot: Impact Case、User Pilot、Pilot EconomicsをGETで直接読める実用性・体験価値・導入採算の証拠ページへ束ねる
- Squad Optimizer: 予算内のAI編成を総当たりし、審査スコア、必須技術カバレッジ、交換計画、追加予算ギャップを返す
- Live Evidence Monitor: Cloud Run、Agent Card、A2A、Squad Optimizer、GitHub Actions CIを公開環境からライブ検証する
- Observability Oracle: Live Evidence、Ops Drill、Pilot Economicsを束ね、運用観測を継続/復旧判断、買い手価値、次のAI雇用へ変換し、Acceptance Matrix / Prize Strategy / Win Gap Radarの実用性証拠に接続する
- External Evidence Verifier: 最終提出の4 URLを許可ドメインだけでプローブし、外部提出ギャップを再実行可能な証拠にする
- Release Drift Guard: GitHub/CIが緑でも公開Cloud Runが古いrevisionなら、Agent Card、Acceptance Matrix、A2A artifactの差分で検知する
- Deploy Recovery: release drift、gcloud認証、Cloud Build、公開再検証を復旧コマンドと審査説明へ変換する
- Judge Demo Receipt: 審査導線、競合反論、編成判断、公開証拠、外部提出URL状態をReceipt Integrity Lockとsha256 digest付きの検収票にする
- Judge Acceptance Matrix: 必須技術、審査5項目、競合/SWOT、公開証拠、提出物、ProtoPedia complianceをaccepted/watch/blockedの受入表にする
- Autonomy Ledger: 市場探索、判断、契約、A2A委任、検証、運用、提出を検収可能なAI自律性台帳に変換
- Autonomy Snapshot: Autonomy LedgerとAgent Task BoardをGETで直接読めるAI中心性の審査証拠ページへ束ねる
- Agent Task Board: `task.delegate` を、委任先AI、目的、検収条件、proof URL、A2A payloadへ具体化する
- Security Sentinel Review: Secret Manager、IP allowlist、Zod入力制限、A2A信頼境界、CIを安全性証拠に変換
- Impact Case: 対象ユーザー、時間短縮、提出信頼度、運用リスク、導入計画を実用性・体験価値の証拠に変換
- Pilot Economics: 時間短縮、導入費用、回収日数、価格レーン、買い手の反論を投資判断の証拠に変換
- Submission Launch Gate: ProtoPedia作品URLとYouTube/Vimeo動画URLを入力し、提出3点、必須タグ、本文、構成図、ストーリー、CI、証拠receiptを最終判定
- Submission Closeout Workbench: ProtoPedia貼付、ProtoPedia Quality Lock、Publication Policy Lock、構成図、30秒動画、Video Proof Lock、Submission Dry Run Lock、外部URL、最終提出フォームを順番付きの作業台に束ねる
- Recording Script: Pitch Director、Demo Runway、Submission Closeoutを、録画担当者がGETで直接読める30秒動画台本、字幕、証拠リンク、公開手順へ束ねる
- Autonomy: Mission Controlが審査で弱い項目を検出し、A2A委任、検証runbook、ProtoPedia提出パックを生成
- Operate: Ops DrillがCloud Run公開デモの稼働シグナルを読み、継続・ロールバック・追加雇用を判断
- Proof: Judge ProofがGemini、Cloud Run、A2A、競合/SWOT、Mission、Ops、GitHub Actions CI、提出URLを1クリックで証拠束にする
- Pitch: Pitch Directorが30秒動画の録画順、字幕、証拠リンク、提出残リスクを生成する
- Judge Drill: 審査5項目と主要競合への厳しい質問、短い回答、60秒回答パス、証拠リンク、次アクションを生成する
- Finalist: 審査員5役の模擬判定で、最終候補スコア、Release Driftカード、Finalist Internal Lock、落選理由、残ギャップ、次の一手を生成する
- Publisher: ProtoPediaに貼る本文、タグ、URL、動画台本、残ギャップを提出直前パッケージにし、審査5項目・競合/SWOT・必須技術・外部URL状態をProtoPedia Quality Lockで、作品性・宣伝化リスク・Markdown安全性をPublication Policy Lockで検収する
- Demo Runway: Judge Proof、Finalist、Publisher、Marketplace、Strategy、Competitive Battlecard、Mission、Opsを30秒の審査員導線に束ね、競合反論リールを録画キューへ落とす
- Win Autopilot: 競合/SWOT、Live Evidence、Judge Demo Receipt、Moat Stress、Squad Optimizer、最終候補判定、提出、運用を一括で走らせ、勝てる状態と残アクションを返す
- Submission Dossier: ProtoPedia本文、競合反論レシート、実用性・買い手価値レシート、動画録画順、提出リンク、最終チェック、Markdownを1つに束ねる
- Visual asset: `image_gen` で生成した `public/assets/agent-marketplace-hero.png`

## Winning Strategy Layer

このMVPの勝ち筋は、既存のエージェントフレームワークと正面衝突しないことです。ADK/LangGraph/CrewAI/Difyが「AIエージェントをどう作るか」を強くしている一方、このプロダクトは「どのAI能力を買うべきか」を判断する市場体験に寄せています。

アプリ内の `Winning Strategy` では次を動的に表示します。

- 競合分析: Google ADK / AI Agent Marketplace / LangGraph / CrewAI / Dify / AgentOps
- SWOT: 選択したエージェント編成から強み、弱み、機会、脅威を再計算
- Judge Scorecard: ハッカソン審査5項目に対する現在スコアと次アクション
- MVP Proof: Cloud Run、Gemini、A2A、公開GitHub、ProtoPediaの提出準備
- Winning Moves: 優勝仮説と、次に雇うべきエージェント

## Market Intel Board

`Market Intel Board` は、競合分析を「やったつもり」にせず、審査員に見せられるソース付き証拠へ変換するパネルです。Gemini Enterprise Agent Platform、Google ADK、A2A protocol、Cloud Marketplace A2A agent requirements、LangGraph、CrewAI、Dify、AgentOps、Cloud Runの一次情報リンクを持ち、競合ごとの強み、露出する隙、こちらの反撃、デモで見せる証拠を返します。Source Ledgerでは、各ソースのreview日、fresh/watch、審査で使う一言、紐づく競合を表示します。Source Freshness Lockでは、公式ソースURLをライブプローブし、競合/SWOTの根拠として今使えるかをscore/readiness/probe evidence/runbookで固定します。

- API: `POST /api/market-intel`
- App UI: `Run market intel`
- Output: market score、source freshness、Source Freshness Lock、source ledger、source checklist、competitor cuts、judge answers、next moves、A2A `market.intel` payload

## Moat Stress Test

`Moat Stress Test` は、「それADK/LangGraph/CrewAI/Dify/AgentOpsでよくない？」という審査員の反論を先に受けるためのパネルです。競合ごとに想定ツッコミ、相手の強み、こちらの回答、見せる証拠、残リスク、録画順を返し、置き換えではなく「AI能力調達とA2A委任の体験」が勝ち筋だと説明できる形にします。

- API: `POST /api/moat-stress`
- App UI: `Stress-test moat`
- Output: moat score、competitor objections、proof routes、recording order、next actions、A2A `moat.stress` payload

## Competitive Battlecard

`Competitive Battlecard` は、Market Intel、Moat Stress Test、SWOTを審査員の質疑でそのまま使える競合別カードに圧縮します。各カードは、相手が勝つ領域、こちらが勝つ領域、短い回答、公式ソース、SWOT根拠、録画で開く証拠routeを持ちます。さらにCriteria Duelで審査5項目ごとに最も疑われる競合、相手の勝ち筋、こちらの証拠URL、SWOT signalを1行に固定します。Win/Loss Lockで各競合の譲る強み、反撃ポジション、必ず開く証拠URL、MVP actionをwin/contest/loss-riskで検収し、Objection Replayで最弱競合への質問、source ledger、SWOT receipt、Live Evidence proof routeを30秒の順番へ固定し、Competitive Proof Lockで6競合、公式ソース、SWOTリンク、反論receipt、replay、live source lockの完全性を検収します。

- API: `POST /api/competitive-battlecard`
- App UI: `Build battlecard`
- Output: battle score、readiness、competitor cards、Criteria Duel、Win/Loss Lock、Objection Replay、Competitive Proof Lock、top risks、SWOT receipts、objection receipts、judge script、A2A `competitive.battlecard` payload

## Competitive SWOT Snapshot

`Competitive SWOT Snapshot` は、競合分析とSWOTをPOST APIの奥に隠さず、審査員が直接読めるGETページにします。6競合、SWOT 4象限、公式ソース、Criteria Duel、Win/Loss Lock、Competitive Proof Lock、Source Freshness Lock、Source Ledger、深掘りcurlを1ページに束ね、提出本文やJudge Snapshotから「競合分析を実施済み」と確認できます。通常GETでは宣言済みソースを軽く表示し、`?live=1` では公式ソースURLをその場でプローブしてpassed/watch/failed、競合カバレッジ、次アクションまで表示します。

- Page: `GET /competitive-swot`
- API: `GET /api/competitive-swot`
- Live source check: `GET /competitive-swot?live=1` / `GET /api/competitive-swot?live=1`
- App UI: `SWOT Page`
- Output: competitor summary、SWOT matrix、Criteria Duel、Win/Loss Lock、Proof Lock、Source Freshness Lock、Source Ledger、judge script、A2A `competitive.snapshot` payload

## Public Judge Snapshot

`Public Judge Snapshot` は、POST専用の深い証拠APIとGETで直接開ける証拠ページを、審査員の初回入口へ束ねます。トップ画面のJudge First-Click StripからJudge Snapshot、Winner Packet、Objection Arena、Competitive SWOT、MVP Readiness、Deploy Recovery、Autonomy Snapshot、Pilot Value、Recording Script、Architecture Pack、Submission Launch、Submission AssetsへPOSTなしで移動できます。Judge Proof、Competitive Battlecard、Criteria Duel、Agent Card、CI、Cloud Run、深掘り用curlをHTMLで表示し、`/api/judge-snapshot?live=1` を付けた時だけRelease Drift Guardもライブ実行します。これによりProtoPediaや提出本文に貼った証拠URLをクリックしただけで、競合/SWOT・AI中心性・実用性・実装証拠・運用証拠の全体像を確認できます。

- Page: `GET /judge-snapshot`
- API: `GET /api/judge-snapshot`
- App UI: `Judge Proof` の `Live Links > Judge Snapshot`
- Output: human-readable proof page、directOpen、readiness、proof score、Criteria Duel、GET proof links、proof items、release lock、POST API curl、A2A `judge.snapshot` payload

## Win Gap Radar

`Win Gap Radar` は、競合分析/SWOTを「資料」ではなくMVP改善backlogに変換するパネルです。Competitive Battlecard、MVP Audit、Finalist Simulator、Judge Acceptance Matrix、Prize Strategy、Demo Concierge、Submission Launch Gateを横断し、審査5項目ごとのlane、今閉じるfeature bet、Feature Freeze Lock、やらないcut list、外部提出gapを返します。ProtoPedia作品URLと動画URLが未入力なら、コード側のMVPがcredibleでも `submit-ready` とは呼ばず `submission-closeout` を `close-now` にします。Feature Freeze Lockで、非外部のclose-nowが残る時だけ追加実装を許可し、外部提出だけが残る時はMVP本体を凍結して録画/公開検収へ集中します。

- API: `POST /api/win-gap-radar`
- App UI: `Build gap radar`
- Output: radar score、readiness、MVP decision、gap lanes、feature bets、Feature Freeze Lock、cut list、external gaps、A2A `win.gap.radar` payload

## MVP Audit

`MVP Audit` は、機能が多いだけでMVP判定が曖昧になる問題を避けるためのハードゲートです。Cloud Run、Gemini、A2A、競合/SWOT、GitHub Actions、運用判断、公開GitHub、デプロイ済みURL、ProtoPedia作品URL、動画URL、30秒審査導線をpass/watch/failで判定します。ProtoPedia作品URLと動画URLのような外部提出作業は、未発行なら合格扱いにせずwatchとして残します。

- API: `POST /api/mvp-audit`
- App UI: `Run MVP audit`
- Output: MVP score、band、hard-gate status、judge lanes、blockers、proof URLs、A2A `mvp.audit` payload

## MVP Readiness Snapshot

`MVP Readiness Snapshot` は、MVP Audit、Judge Acceptance Matrix、Release Drift Guard、Deploy Recovery、Autonomy Snapshot、Submission Assets、Recording Scriptを、審査員が直接読める提出可否ページに束ねます。通常のGETでは軽く開ける静的証拠を返し、`/mvp-readiness?live=1` または `/api/mvp-readiness?live=1` の時だけ公開Cloud RunのRelease Driftも実行します。コード側のMVPが十分でも、公開revisionが古い場合は `mvp-release-drift` として止め、ProtoPedia作品URLと動画URLだけが残る場合は外部gapとして正直に表示します。

- Page: `GET /mvp-readiness`
- API: `GET /api/mvp-readiness`
- App UI: `Judge Proof` の `Live Links > MVP Readiness`
- Output: readiness、MVP score、acceptance score、external gaps、release verdict、deploy recovery commands、deep proof curl、A2A `mvp.snapshot` payload

## Recording Script

`Recording Script` は、Pitch Director、Demo Runway、Submission Closeout Workbenchを、録画担当者がそのまま読める30秒動画台本へ束ねます。章ごとの画面、読み上げ、字幕、operator cue、証拠URL、Video Proof Lock、YouTube/Vimeo公開後の貼付手順をGETで返し、動画URL未発行は `recording-external-watch` として正直に残します。

- Page: `GET /recording-script`
- API: `GET /api/recording-script`
- App UI: `Judge Proof` の `Live Links > Recording Script` / `Submission Pack > Recording`
- Output: readiness、30秒chapter、voiceover、lower thirds、Video Proof Lock、publish steps、A2A `recording.script` payload

## Judge Brief

`Judge Brief` は、審査員の初見で情報量が多すぎる問題を避けるための1ページブリーフです。Market Intel、MVP Audit、Win Autopilot、Judge Proof、Finalist、Submission Dossierを束ね、勝ち筋、hard truth、key metrics、proof ladder、30秒導線、残リスク、A2A `judge.brief` payloadを返します。

- API: `POST /api/judge-brief`
- App UI: `Build judge brief`
- Output: brief score、readiness、hard truth、key metrics、proof ladder、30秒route、risk register、evidence links、A2A `judge.brief` payload

## Judge Command Center

`Judge Command Center` は、初見の審査員が機能一覧で迷う問題を避けるための司令塔です。Judge Tour、Competitive Battlecard、Acceptance Matrix、Release Drift Guard、Pilot Economics、Win Autopilotを1画面に集約し、最初に押す証拠、90秒タイムライン、残ブロッカー、A2A `judge.command` payloadを返します。公開Cloud Runが古いrevisionなら、良いローカル実装でも審査員には未実装に見えるため `blocked` として止めます。

- API: `POST /api/judge-command-center`
- App UI: `Build command center`
- Output: command score、readiness、Battlecard readiness、proof buttons、90秒timeline、blockers、judge script、A2A `judge.command` payload

## Demo Concierge

`Demo Concierge` は、機能が多いことで初見審査員が迷うリスクを、persona別の最初の1クリック、Judge Route Lock、First-Run Focus Lockへ圧縮するパネルです。初見審査員、Platform/SRE buyer、ハッカソン提出者ごとに、入口の質問、押すボタン、話す台詞、開く証拠URL、成功条件を固定し、0-90秒で見せる画面、後回しにする画面、外部URL watchを隠さないルール、proof URL到達率をPrize Strategyのusability/practicality/approach証拠にも接続します。

- API: `POST /api/demo-concierge`
- App UI: `Build concierge`
- Output: concierge score、readiness、Judge Route Lock、First-Run Focus Lock、3 persona lanes、success criteria、friction cuts、A2A `demo.concierge` payload

## Judge Rehearsal Room

`Judge Rehearsal Room` は、初見審査員に機能一覧を浴びせないための90秒実演リハーサルです。Judge Command Center、Demo Concierge、Judge Tour、Prize Strategy、Judge Drill、Pilot Economics、Submission Closeoutを束ね、どの画面を開き、何を言い、どの質問へどの証拠URLで答えるかを1つのrun roomにします。Final Pitch Defense Lockで、AI必然性、競合反論、買い手価値、公開実装、外部提出ギャップ、60秒回答パスを最終質疑の防御線として固定します。Judge Recording Lockで、公開証拠から始める画面順、90秒timebox、競合/SWOT反論、買い手価値、外部URL未発行を隠さない提出truth、字幕pack、Publication Policy Lock、YouTube/Vimeo公開先までを録画前に検収します。

- API: `POST /api/judge-rehearsal`
- App UI: `Build rehearsal`
- Output: rehearsal score、readiness、Final Pitch Defense Lock、Judge Recording Lock、90秒segments、question deck、scorecard、capture checklist、A2A `judge.rehearsal` payload

## Winner Proof Packet

`Winner Proof Packet` は、審査5項目をばらばらのパネルではなく1つの勝ち証拠に圧縮するパネルです。AI中心性、課題アプローチ、ユーザビリティ、実用性、実装力ごとに、短い主張、開く証拠URL、競合/SWOT反論、録画cue、ProtoPediaに貼るproof orderを返します。GETページでは審査員が直接読めるHTMLとして表示し、`?live=1` ではWinner Release Lockで公開Cloud Run revisionも同時に検収して、古い公開URLを勝ち証拠として扱いません。

- Page: `GET /winner-packet`
- JSON: `GET /api/winner-packet`
- Deep API: `POST /api/winner-packet`
- App UI: `Build packet`
- Output: human-readable proof page、packet score、readiness、Winner Release Lock、5 criteria proof cards、objection answers、recording order、submission copy、A2A `winner.packet` payload

## Winner Sufficiency Lock

`Winner Sufficiency Lock` は、「これで機能が本当に十分か？」を提出直前に曖昧にしないための最終判定ページです。MVP Readiness、Competitive SWOT、Win Gap Radar、First-Click Smoke、Submission Launchを束ね、公開revisionが古い、競合/SWOT証拠が弱い、非外部のfeature workが残る、外部URLだけが未完了、のどれなのかを1枚で分けます。`winner-sufficient` になった時だけ新機能追加を止め、録画・公開検収・提出URL維持へ切り替えます。

- Page: `GET /winner-sufficiency`
- API: `GET /api/winner-sufficiency`
- Output: sufficiency score、verdict、6 checks、next actions、judge script、A2A `winner.sufficiency` payload

## Objection Arena

`Objection Arena` は、Winner Proof Packetを最終質疑の反論レーンへ変換します。「ADKやLangGraphで十分では？」「これは単なるダッシュボードでは？」「ROIが机上では？」「提出URLは最新か？」のような厳しい質問に対して、短い回答、開く証拠URL、follow-up、公開revision状態を1ページに固定します。GETページは審査員が直接読めるHTML、APIはA2A/Release Drift用JSONとして返し、`judge.objection-arena` / `objection-lock` が公開Agent Cardに載らなければ最新releaseとして扱いません。

- Page: `GET /objection-arena`
- JSON: `GET /api/objection-arena`
- Deep API: `POST /api/objection-arena`
- Output: arena score、readiness、answered/blocked count、judge objection lanes、proof URLs、A2A `judge.objection-arena` payload

## First-Click Smoke Lock

`First-Click Smoke Lock` は、Cloud Runが新しいGET証拠ページを返しているかを、HTTP 200だけでなくページ固有のsentinel文字列で検収します。SPA fallbackで `/objection-arena` や `/winner-packet` が200を返しても、`Objection Arena` や `Winner Proof Packet` の見出しがなければ `smoke-failed` として止めます。これにより、審査員が最初に開く12本の証拠リンクが本当に証拠HTMLを返していることを録画前に確認できます。

- Page: `GET /first-click-smoke`
- JSON: `GET /api/first-click-smoke`
- Deep API: `POST /api/first-click-smoke`
- Output: smoke score、readiness、passed/missing count、sentinel probes、runbook、A2A `judge.first-click-smoke` payload

## Final Submission Runway

`Final Submission Runway` は、Winner Proof PacketとSubmission Closeoutを、2026/7/10 23:59 JSTの提出締切から逆算した実行計画へ変換します。動画録画、ProtoPedia貼付、構成図添付、Launch Gate、最終フォーム提出を、due date、owner、acceptance、proof URL付きのworkback planとして返します。

- API: `POST /api/submission-runway`
- App UI: `Build runway`
- Output: runway score、readiness、days remaining、4 tracks、daily plan、evidence locks、A2A `submission.runway` payload

## Prize Strategy Board

`Prize Strategy Board` は、MVPが足りるかではなく、ハッカソン優勝に必要な採点作戦を固定するパネルです。審査5項目ごとにtarget score、現在スコア、足りない証拠、demo move、次アクションを返し、Demo Concierge、Judge Route Lock、Prize Usability Lock、Prize Criteria Lock、Judge Command Center、Competitive Battlecard、Objection Replay、Acceptance Matrix、Release Drift Guard、Observability Oracle、Pilot Economicsを最終ピッチ順へ束ねます。Prize Usability Lockは外部URL watchをUsability不足として二重減点せず、first click、90秒route、proof URL、Focus path、persona lanes、opening command、外部gap honestyを分けて検収します。Prize Criteria LockはAI中心性、課題アプローチ、ユーザビリティ、実用性、実装力をsealed/watch/missingで検収し、ProtoPedia/動画URLだけを外部watchとして残します。

- API: `POST /api/prize-strategy`
- App UI: `Build prize strategy`
- Output: prize score、criteria、Prize Usability Lock、Prize Criteria Lock、proof moves、pitch order、risks、A2A `prize.strategy` payload

## Judge Tour

`Judge Tour` は、機能が多すぎて初見の審査員が迷う問題を解消する90秒ウォークスルーです。Judge Brief、Market Intel/SWOT、Impact Case、Security Sentinel Review、Judge Proof、Submission Launch Gateを、開く順番、話す台詞、反論、証拠リンク、残ブロッカーに変換します。ProtoPedia作品URLと動画URLが未入力なら、提出完了とは扱わず `external-url-gaps` として残します。

- API: `POST /api/judge-tour`
- App UI: `Build judge tour`
- Output: tour score、readiness、90秒steps、5つのjudge claims、想定反論、blockers、evidence links、A2A `judge.tour` payload

## User Pilot Lab

`User Pilot Lab` は、最弱になりやすいユーザビリティ審査を「使いやすいはず」という主張ではなく、対象ユーザー別の初回利用検証に変換します。開発リード、Platform/SRE、ハッカソン提出者ごとに、最初の3分で開く画面、押すボタン、成功条件、摩擦、次クリック、A2A `user.pilot` payloadを返します。

- API: `POST /api/user-pilot`
- App UI: `Run user pilot`
- Output: pilot score、readiness、3 persona paths、time-to-value、frictions、next clicks、validation checklist、A2A `user.pilot` payload

## Pilot Value Snapshot

`Pilot Value Snapshot` は、Impact Case、User Pilot、Pilot EconomicsをPOST APIの奥に隠さず、審査員が直接開ける実用性証拠へ束ねます。3 persona、初回価値到達秒数、時間短縮、月次価値、回収日数、Pilot Evidence Lock、買い手反論、導入計画を1ページで示し、「便利そう」ではなく「導入判断できる」形にします。

- Page: `GET /pilot-value`
- API: `GET /api/pilot-value`
- App UI: `Judge Proof` の `Live Links > Pilot Value`
- Output: readiness、Impact/User Pilot/Pilot Economics score、payback days、monthly value、buyer objections、A2A `pilot.value.snapshot` payload

## Squad Optimizer

`Squad Optimizer` は、単体の「次に雇うAI」ではなく、予算内の編成組み合わせを探索する自律判断レイヤーです。審査5項目、A2A/Gemini/Cloud Run/UX/DevOps feedbackの必須カバレッジ、予算余力を同時に評価し、現行維持、交換、追加予算のどれが勝ち筋かを返します。

- API: `POST /api/squad-optimizer`
- App UI: `Optimize squad`
- Output: optimizer score、readiness、current/recommended/stretch squad、budget gap、swap plan、decision rules、A2A `squad.optimize` payload

## Live Evidence Monitor

`Live Evidence Monitor` は、「公開URLは動いているはず」を審査員の前で再実行できる証拠に変換します。Cloud Run health、A2A Agent Card、Squad Optimizer API、A2A JSON-RPC artifact、GitHub Actions CIをライブプローブし、スコア、latency、runbook、A2A `evidence.monitor` payloadを返します。

- API: `POST /api/live-evidence`
- App UI: `Monitor evidence`
- Output: live proof score、readiness、5 probes、next actions、curl runbook、A2A `evidence.monitor` payload

## Observability Oracle

`Observability Oracle` は、Live Evidence、Cloud Run Ops Drill、Pilot Economicsをつなぎます。公開証拠を見たAIが、継続公開か復旧か、運用リスクをどう買い手価値へ変換するか、次に雇うAI能力は何かを判断し、審査向けreceiptとA2A `observability.oracle` payloadを返します。Acceptance MatrixのPractical value、Prize StrategyのOperational value proof、Win Gap Radarのpractical laneにも同じbuyer SLOを流し込みます。

- API: `POST /api/observability-oracle`
- App UI: `Run oracle`
- Output: oracle score、readiness、public proof/runtime/buyer SLO receipts、decisions、observe-decide-rebuy loop、runbook、A2A `observability.oracle` payload

## External Evidence Verifier

`External Evidence Verifier` は、提出直前に審査員が開くURLをライブ検証します。任意URLを無制限にfetchせず、公開GitHub、Cloud Run、ProtoPedia、YouTube/Vimeoを最終提出URLとして検証し、Google Driveはbackup watch扱いに留めます。ProtoPedia作品URLと動画URLが未入力・不正・非公開なら `needs-external-urls` として残します。

- API: `POST /api/external-evidence`
- App UI: `Verify external evidence`
- Output: external proof score、readiness、4 URL probes、next actions、curl runbook、A2A `external.evidence` payload

## Release Drift Guard

`Release Drift Guard` は、提出用Cloud Run URLが最新mainの機能を本当に返しているかを検査します。公開healthが通っていても、Agent Cardのskill数、`judge.command`、`deploy.recover`、`winner.sufficiency`、`acceptance.matrix`、`mvp.snapshot`、`autonomy.snapshot`、`recording.script`、`submission.launch`、`pilot.value.snapshot`、`demo.receipt`、`release.drift`、`pilot.economics`、`judge.rehearsal` の `recording-lock` tag、`win.gap.radar` の `feature-freeze-lock` tag、`winner.packet` の `winner-release-lock` / `get-proof` tag、`winner.sufficiency` の `winner-sufficiency-lock` tag、`judge.objection-arena` の `objection-lock` tag、`judge.first-click` の `first-click-route-lock` tag、`judge.first-click-smoke` の `first-click-smoke-lock` tag、`finalist.simulate` の `release-drift` tag、`competitive.battlecard` の `criteria-duel` / `win-loss-lock` tag、`competitive.snapshot` / `judge.snapshot` / `mvp.snapshot` / `autonomy.snapshot` / `recording.script` / `submission.launch` / `submission.package` / `pilot.value.snapshot` / `deploy.recover` の `get-proof` tag、A2A artifact、Acceptance Matrix endpoint、MVP Readiness endpoint、Autonomy Snapshot endpoint、Recording Script endpoint、Architecture Pack endpoint、Submission Launch endpoint、Pilot Value endpoint、Objection Arena endpoint、First-Click Smoke endpoint、Winner Sufficiency page、Deploy Recovery pageが古ければ `deploy-drift` として止めます。

- API: `POST /api/release-drift`
- App UI: `Check release drift`
- Output: drift score、verdict、expected/observed skill count、missing skills、redeploy runbook、A2A `release.drift` payload

## Deploy Recovery

`Deploy Recovery` は、Release Drift Guardの結果を運用復旧へ変換します。公開Cloud Runが古い時、または `gcloud builds submit` が `Reauthentication failed` で止まった時に、認証更新、Cloud Build再実行、Agent Card skill count、必須Agent Card signal tags、`/api/mvp-readiness`、`/api/recording-script`、`/api/pilot-value`、`/deploy-recovery`、`/api/deploy-recovery`、A2A `winnerPacketPageEndpoint` / `recordingScriptPageEndpoint` / `pilotValueSnapshotEndpoint` / `deployRecoveryEndpoint` / `deployRecoveryPageEndpoint` の再検証コマンドをまとめます。審査員は `GET /deploy-recovery` を開くだけで、復旧状況、copy/pasteコマンド、10分復旧手順、説明台本を読めます。

- Page: `GET /deploy-recovery`
- API: `GET /api/deploy-recovery`
- Deep API: `POST /api/deploy-recovery`
- App UI: `Plan deploy recovery`
- Output: recovery score、readiness、checks、commands、required signal verification、recovery steps、blockers、A2A `deploy.recover` payload

## Judge Demo Receipt

`Judge Demo Receipt` は、審査動画で実行した主張を1枚の検収票に固定します。Judge Tour、Moat Stress Test、Squad Optimizer、Live Evidence Monitor、Submission Launch Gateをstamp化し、ProtoPedia作品URLと動画URLが未入力ならwatchとして残します。Judge Route Lockで90秒導線、競合/SWOT、編成判断、runtime/A2A、外部URLの各routeを検収し、Receipt Integrity Lockでdigest coverage、stamp coverage、公開証拠route、A2A Agent Card、競合反論、外部URL watchの正直さを検査します。動画後の質疑でも「何を見せ、何が未完了か」を同じ証拠で再確認できます。

- API: `POST /api/demo-receipt`
- App UI: `Seal receipt`
- Output: receipt score、stamps、Judge Route Lock、Receipt Integrity Lock、recording order、next actions、sha256 digest、A2A `demo.receipt` payload

## Judge Acceptance Matrix

`Judge Acceptance Matrix` は、MVP判定を最後に曖昧にしないための受入表です。Cloud Run/Gemini/A2Aの必須技術、審査5項目、競合/SWOTとMoat反論、Live Evidence、Release Drift、Security/Impact/User Pilot/Pilot Economics/Observability Oracle、ProtoPedia compliance、Judge Demo Receiptを最大14行のaccepted/watch/blockedに束ねます。ProtoPedia作品URL、YouTube/Vimeo動画URL、構成図、ストーリー、タグがLaunch Gateで揃わない場合、または公開Cloud Runが古いrevisionなら、本体の実装だけを合格扱いにしません。

- API: `POST /api/acceptance-matrix`
- App UI: `Build acceptance matrix`
- Output: acceptance score、verdict、release drift row、ProtoPedia compliance、acceptance rows、next actions、sha256 digest、A2A `acceptance.matrix` payload

## Autonomy Ledger

`Autonomy Ledger` は、「AIエージェントが価値の中心」という審査基準を主張ではなく検収ログにします。Market Intel、Mission Control、Contract Desk、A2A Agent Card、Judge Proof、Ops Drill、Submission Dossierをつなぎ、どのAIが何を判断し、どのendpointで検証できるかを7段階の台帳として返します。

- API: `POST /api/autonomy-ledger`
- App UI: `Build autonomy ledger`
- Output: ledger score、verdict、7-phase decision chain、agent handoffs、judge challenge answers、sha256 receipt、A2A `autonomy.ledger` payload

## Autonomy Snapshot

`Autonomy Snapshot` は、Autonomy LedgerとAgent Task Boardを、審査員がGETで直接開けるAI中心性ページに束ねます。sense→decide→contract→delegate→verify→operate→submitの判断連鎖、A2A work order、検証コマンド、challenge answer、sha256 receiptを同じ画面で見せ、外部提出URLだけが残る場合は `autonomy-external-watch` として正直に残します。

- Page: `GET /autonomy-snapshot`
- API: `GET /api/autonomy-snapshot`
- App UI: `Judge Proof` の `Live Links > Autonomy Snapshot`
- Output: readiness、ledger score、task score、verified chain count、work orders、challenge answers、receipts、A2A `autonomy.snapshot` payload

## Agent Task Board

`Agent Task Board` は、Agent Cardの `task.delegate` を表示上の宣言で終わらせず、実行できる仕事票にします。選択済みAIごとに目的、受入条件、検証コマンド、proof URL、A2A `message/send` payloadを生成し、通常時は `delegation-ready`、運用障害時は `blocked` として提出録画前に止めます。

- API: `POST /api/task-board`
- App UI: `Build task board`
- Output: task score、readiness、agent work orders、execution order、verification queue、sha256 receipt、A2A `task.delegate` payload

## Submission Launch Gate

`Submission Launch Gate` は、外部提出URLを曖昧に合格扱いしない最終ゲートです。ProtoPedia作品URLとYouTube/Vimeo動画URLを入力すると、提出3点、`findy_hackathon` タグ、作品ステータス、作品タイトル、概要、ストーリー3要素、構成図、CI、MVP hard gates、Judge Proof receipt、Final Submit Lockをまとめて判定します。URL未入力なら `needs-external-urls`、形式不正または必須項目不備なら `invalid-urls`、全て揃ったときだけ `submit-ready` を返します。Final Submit LockはFindy提出フォームに貼るGitHub URL、Cloud Run URL、ProtoPedia作品URL、ProtoPedia側の動画URL、タグ、完成ステータス、receipt、2026/7/10 23:59 JST締切を1つのpaste orderに固定します。審査員と提出担当者は `GET /submission-launch` で同じロックを直接開けます。

- Page: `GET /submission-launch`
- JSON: `GET /api/submission-launch`
- Deep API: `POST /api/submission-launch`
- App UI: `Check launch gate`
- Output: launch score、readiness、URL status、ProtoPedia compliance、Final Submit Lock、final checklist、copy actions、submit packet、A2A `submission.launch` payload

## Submission Closeout Workbench

`Submission Closeout Workbench` は、Win Gap Radarが `close-now` とした外部提出作業を実際の順番へ落とします。Submission Dossier、Submission Publisher、Demo Runway、Judge Proof、Submission Launch Gateを束ね、ProtoPedia貼付、ProtoPedia Quality Lock、Publication Policy Lock、構成図添付、30秒動画、Video Proof Lock、Submission Dry Run Lock、作品URL、最終提出フォーム、receipt確認を `ready` / `watch` / `blocked` の作業項目として返します。動画URLが未発行でも、公開Cloud Run開始、30秒導線、Judge Proof receipt、競合反論、提出handoffの録画受入条件と、外部URL以外の提出dry runを先に固定します。Publication Policy Lockは、ProtoPediaの投稿方針に沿って、作品ページが宣伝・事例紹介・技術説明だけに見えず、作ったプロトタイプ、公開デモ、Markdown安全性、埋め込み動画枠を満たすかを検収します。

- API: `POST /api/submission-closeout`
- App UI: `Build closeout`
- Output: closeout score、readiness、next action、work items、copy tray、ProtoPedia Quality Lock、Publication Policy Lock、video run、Video Proof Lock、Submission Dry Run Lock、Submission Asset Lock、submit packet、A2A `submission.closeout` payload

## Security Sentinel Review

`Security Sentinel Review` は、公開デモの安全性を「気をつけています」ではなく、審査員に見せられる信頼境界として提示するパネルです。Secret Manager境界、IP allowlist、Zod入力制限、A2A委任境界、CI、Cloud Run runtime、提出URLの最小データ扱いをスコア化します。

- API: `POST /api/security-review`
- App UI: `Run security review`
- Output: security score、posture、controls、trust boundaries、threats、judge answers、runbook、A2A `security.review` payload

## Impact Case

`Impact Case` は、「面白いが現場で何がどれだけ良くなるのか」という実用性の弱点を潰すための価値証拠です。開発リード、Platform/SRE、ハッカソン提出者ごとに便益を分け、AI能力選定時間、提出証拠づくり、委任の手戻り、公開デモ運用リスク、提出信頼度、体験価値をbefore/afterで定量化します。

- API: `POST /api/impact-case`
- App UI: `Run impact case`
- Output: impact score、posture、6 metrics、3 personas、before/after workflow、adoption plan、risks、judge answers、A2A `impact.case` payload

## Pilot Economics

`Pilot Economics` は、Impact CaseのKPIを「買う理由」まで落とし込む導入採算レイヤーです。時間短縮、想定人件費、公開デモリスク低下、提出信頼度上昇を月次価値へ換算し、pilot cost、payback days、価格レーン、買い手の反論、導入マイルストーンを審査員の前で再計算できる形にします。Pilot Evidence Lockで、3 personaの初回価値到達、摩擦のオーナー、30日以内回収、買い手反論、公開証拠を1つの受入レシートに固定します。

- API: `POST /api/pilot-economics`
- App UI: `Build pilot economics`
- Output: economics score、posture、Pilot Evidence Lock、unit economics、pricing lanes、pilot plan、buyer objections、A2A `pilot.economics` payload

## Contract Desk

`Contract Desk` は、AIを雇った後の実務性を見せる契約・検収レイヤーです。選択済みエージェントごとに、スコープ、納品物、受入条件、MCP/A2A access、SLA、リスクコントロール、検証コマンド、支払い条件を生成します。

- API: `POST /api/contracts`
- App UI: `Issue contracts`
- Output: contract score、agent contracts、acceptance runbook、handoff ledger、A2A `contract.issue` payload

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
- Runbook: `/api/healthz`、`/api/ops-drill`、Cloud Run describe、Cloud Logging、traffic updateコマンドを固定
- A2A payload: `ops.drill` skillとしてseverity、signals、rollback判断、next ops hireを返す

## Submission Kit

提出に必要な素材はアプリとリポジトリの両方に固定しています。

- System architecture: `public/assets/a2a-marketplace-architecture.svg`
- ProtoPedia markdown draft: `docs/03_submission/submission-pack.md`
- Human-readable page: `GET /submission-assets`
- Recording teleprompter: `GET /recording-script`
- API: `GET /api/submission-kit`
- App UI: Mission Control実行後に `Assets Page` / `Recording` / `Architecture Diagram` / `30s Storyboard` / `Required Assets` を表示

## Judge Proof

`Judge Proof` はWin Autopilotの次に開く証拠束です。Gemini Proof Lock、Usability Proof Lock、Cloud Run公開URL、A2A Agent Card、競合/SWOT、Mission Control、Ops Drill、GitHub Actions CI、提出URLをまとめ、AI・Google Cloud・DevOps・A2A・初回UX・提出準備の状態を1レスポンスで確認できます。Geminiがliveなら `gemini-live`、鍵やAPI不調でfallbackなら `fallback-visible` として、必須AI技術の証拠境界を隠しません。UX導線は `usability-locked` / `usability-budget-watch` / `needs-usability-proof` で、140予算内の最適編成と+22のUX買い足しギャップを正直に分けます。

- API: `POST /api/proof`
- App UI: `Run judge proof`
- Output: overall proof score、Gemini Proof Lock、Usability Proof Lock、8カテゴリスコア、live links、proof runbook、sha256 receipt

## Win Autopilot

`Win Autopilot` は審査員と提出者が最初に開く一括実行入口です。競合/SWOT、Live Evidence、Judge Demo Receipt、Moat Stress Test、Squad Optimizer、Mission、Contract、Ops、Judge Proof、Finalist、Submission Publisher、Demo Runwayを束ね、win score、12 lanes、残ブロッカー、証拠デッキ、autonomy trace、A2A `win.autopilot` payloadをGET証拠ページでも返します。A2A payloadの `decisiveProof` にはlive evidence score、receipt digest、moat verdict、squad readinessを含めます。

- Page: `GET /win-autopilot`
- API: `GET /api/win-autopilot`
- API: `POST /api/win-run`
- App UI: `Run win autopilot`
- Output: win score、readiness、12 lane scorecards、decisive proof、next actions、evidence deck、autonomy trace

## Demo Runway

`Demo Runway` は審査員の初見体験を一本化する入口です。Judge Proof、Finalist Simulator、Submission Publisher、Marketplace、Winning Strategy、Competitive Battlecard、Contract/Mission、Ops Drillを30秒の順番に並べ、証拠リンク、競合反論リール、録画キュー、外部URL残リスクを返します。

- API: `POST /api/demo-run`
- App UI: `Run demo runway`
- Output: demo score、8-step judge route、proof links、competitive proof reel、recording cues、external risks、A2A `demo.runway` payload

## Pitch Director

`Pitch Director` はProtoPedia動画用の録画台本です。審査員が30秒で価値を理解できるように、Judge Proof、Marketplace、Winning Strategy、Mission Control、Ops Drill、Submission Kitの順で、画面操作、読み上げ台詞、字幕、証拠リンクを生成します。

- API: `POST /api/pitch`
- App UI: `Build pitch`
- Output: 30秒/6シーンのshot list、voiceover、lower thirds、recording checklist、ProtoPedia/video残リスク

## Judge Drill

`Judge Drill` は、審査員からの厳しい質問に備える反証ボードです。AIエージェント中心性、課題アプローチ、ユーザビリティ、実用性、実装力の5項目ごとの想定質問に加え、Competitive Battlecard、Market Intel、Moat Stressを束ねたCross-exam deckを生成し、ADK/LangGraph等への60秒回答パス、証拠リンク、デモで開くべき画面を固定します。

- API: `POST /api/judge-drill`
- App UI: `Run judge drill`
- Output: hardest question、5 objection cards、cross-exam deck、60s answer path、cross-exam runbook、evidence links、A2A payload

## Finalist Simulator

`Finalist Simulator` は、提出直前に「最終候補へ残れるか」を審査員5役で模擬判定するパネルです。競合/SWOT、Mission、Ops、Contract、Pitch、Judge Drill、Release Driftの証跡を束ね、点数だけでなく落選理由と次の一手を返します。Finalist Internal Lockは、5パネル、競合/SWOT、A2A必然性、30秒導線、Ops/CI、公開Cloud Run revisionを内部証拠として検収し、ProtoPedia作品URLや動画URLのような外部提出作業は、合格扱いにせず残ギャップとして明示します。実URLを入力した場合は、ProtoPedia `https://protopedia.net/...` とYouTube/Vimeo動画URLを検証し、妥当なら `finalist-ready` へ昇格、不正URLなら blocker として提出不能に落とします。

- API: `POST /api/finalist`
- Input: `projectBrief`、`selectedAgentIds`、任意の `protopediaUrl` / `videoUrl` / `targetUrl` / `skipReleaseDrift`
- App UI: `Simulate finalist`
- Output: finalist score、5 judge panels、Release Drift status、Finalist Internal Lock、URL status、remaining gaps、top concern、winning move、A2A payload

## Submission Publisher

`Submission Publisher` は、ProtoPedia登録の最後の作業を迷わず進めるための提出直前パッケージです。Mission、Pitch、Finalistの証跡から、作品タイトル、概要、課題、対象ユーザー、特徴、技術構成、タグ、動画説明、構成図、公開URL、残ギャップを貼り付け可能な形に変換し、ProtoPedia Quality Lockで本文が審査5項目、競合/SWOT、必須技術、30秒デモ導線、公開証拠、外部URL状態を満たすかを検収します。Publication Policy Lockでは、ProtoPedia Helpcenterの投稿内容案内とMarkdown案内に沿って、作品性、オリジナル実装証拠、宣伝化リスク、技術説明だけに見えないこと、安全なMarkdown、動画メディア枠を検収します。

- API: `POST /api/publisher`
- App UI: `Build publisher`
- Output: publish score、paste fields、ProtoPedia Quality Lock、Publication Policy Lock、assets、final checklist、recording script、A2A `submission.publish` payload

## Submission Dossier

`Submission Dossier` は外部提出直前の作業束です。Submission Publisher、Win Autopilot、Demo Runway、Competitive Battlecard、Impact Case、Pilot Economics、Judge Proofをまとめ、ProtoPediaに貼る本文、ProtoPedia Quality Lock、競合反論レシート、実用性・買い手価値レシート、提出リンク、30秒録画順、構成図パケット、最終チェック、Markdownドシエを返します。

- API: `POST /api/dossier`
- App UI: `Run submission dossier`
- Output: dossier score、copy blocks、submission links、recording plan、competitive receipts、buyer value receipts、handoff packet、architecture pack、final checks、Markdown、A2A `submission.dossier` payload

## Architecture Pack

`Architecture Pack` は、ProtoPedia必須のシステム構成図を、静的画像ではなく検証可能な提出証拠へ変換します。公開SVG、Mermaid、構成ノード/エッジ、Cloud Run/Gemini/A2A/CI/提出物への対応表、貼り付けチェックリストを返し、GETページ、JSON API、A2A `submission.package` payloadとして確認できます。

- Page: `GET /architecture-pack`
- JSON: `GET /api/architecture-pack`
- Deep API: `POST /api/architecture-pack`
- App UI: `Run submission dossier` 内の `Architecture pack`
- Output: architecture score、diagram URL、Mermaid、nodes/edges、requirement mapping、ProtoPedia checklist、A2A `submission.package` payload

## GitHub Actions CI

公開CIは `.github/workflows/ci.yml` で固定しています。

- Workflow: <https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml>
- Runs on: push to `main` and pull requests
- Checks: `npm run typecheck` / `npm test` / `npm run build` / `make q.check-architecture`
- Proof API: `/api/proof` が最新main runをGitHub public APIから読み、CI statusとrun URLを証拠束に含める

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

- `GET /api/healthz`
- `GET /.well-known/agent-card.json`
- `POST /a2a`
- `POST /api/recommend`
- `POST /api/strategy`
- `POST /api/market-intel`
- `POST /api/moat-stress`
- `POST /api/competitive-battlecard`
- `POST /api/win-gap-radar`
- `POST /api/mvp-audit`
- `GET /mvp-readiness`
- `GET /api/mvp-readiness`
- `POST /api/judge-brief`
- `POST /api/judge-command-center`
- `POST /api/demo-concierge`
- `POST /api/judge-rehearsal`
- `GET /winner-packet`
- `GET /api/winner-packet`
- `POST /api/winner-packet`
- `GET /winner-sufficiency`
- `GET /api/winner-sufficiency`
- `GET /judge-snapshot`
- `GET /api/judge-snapshot`
- `GET /competitive-swot`
- `GET /api/competitive-swot`
- `POST /api/submission-runway`
- `POST /api/prize-strategy`
- `POST /api/judge-tour`
- `POST /api/user-pilot`
- `GET /pilot-value`
- `GET /api/pilot-value`
- `POST /api/squad-optimizer`
- `POST /api/live-evidence`
- `POST /api/observability-oracle`
- `POST /api/external-evidence`
- `POST /api/release-drift`
- `GET /deploy-recovery`
- `GET /api/deploy-recovery`
- `POST /api/deploy-recovery`
- `POST /api/demo-receipt`
- `POST /api/acceptance-matrix`
- `GET /autonomy-snapshot`
- `GET /api/autonomy-snapshot`
- `POST /api/autonomy-ledger`
- `GET /submission-launch`
- `GET /api/submission-launch`
- `POST /api/submission-launch`
- `POST /api/submission-closeout`
- `POST /api/security-review`
- `POST /api/impact-case`
- `POST /api/pilot-economics`
- `POST /api/mission`
- `GET /win-autopilot`
- `GET /api/win-autopilot`
- `POST /api/win-run`
- `POST /api/dossier`
- `GET /architecture-pack`
- `GET /api/architecture-pack`
- `POST /api/architecture-pack`
- `POST /api/demo-run`
- `POST /api/publisher`
- `POST /api/ops-drill`
- `POST /api/contracts`
- `POST /api/pitch`
- `POST /api/judge-drill`
- `POST /api/finalist`
- `POST /api/proof`
- `GET /submission-assets`
- `GET /recording-script`
- `GET /api/recording-script`
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

GitHub Actions:

<https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml>

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

ProtoPediaには、公開GitHubリポジトリURL、Cloud Run URL、作品URLを提出します。GitHubは <https://github.com/buddypia/DevOps-AIAgent>、Cloud Runは <https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app>。公開CIは <https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml>。タグは `findy_hackathon`。提出本文はSubmission Publisherのpaste fieldsを貼り、最初にDemo Conciergeで審査員/買い手/提出者のfirst clickを固定し、Judge Command Centerで90秒導線、MVP受入状態、公開revision drift、pilot economics、win scoreを1画面で確認し、Judge Tourで話す順番と外部URL不足を確認し、Judge RehearsalのFinal Pitch Defense LockでAI必然性、競合反論、買い手価値、公開実装、60秒回答パスを確認し、Squad Optimizerで140予算内の最適編成と+22のUX追加ギャップを確認し、Moat Stress Testで「既存ツールでよくない？」への証拠付き反論を確認し、Competitive Battlecardで公式ソース、SWOT根拠、Criteria Duel、短い審査回答、録画で開く証拠routeを競合別に確認し、Live Evidence Monitorで公開Cloud Run/A2A/CIのライブ証拠を確認し、External Evidence VerifierでGitHub・Cloud Run・ProtoPedia・動画URLの外部到達性を確認し、Release Drift Guardで提出用Cloud Runが最新skill surfaceを返すか確認し、Deploy Recoveryでgcloud認証、Cloud Build、公開再検証の復旧手順を確認し、Judge Demo Receiptでsha256 digestと外部URL状態を控え、Judge Acceptance Matrixで必須技術、審査5項目、公開証拠、提出物がaccepted/watch/blockedのどれかを確認し、User Pilot Labで対象ユーザー別の初回価値到達を確認し、Winner Sufficiency Lockで機能十分性、公開drift、外部closeoutを最終確認し、Win Autopilotでwin scoreと残アクションを確認します。動画ではDemo Runwayの「Demo Concierge → Judge Command Center → Judge Tour → Squad Optimizer → Moat Stress Test → Competitive Battlecard → Live Evidence Monitor → Release Drift Guard → Deploy Recovery → Winner Sufficiency Lock → Judge Demo Receipt → Judge Acceptance Matrix → User Pilot Lab → Judge Brief → Autonomy Ledger → Security Sentinel Review → Impact Case → Pilot Economics → Submission Launch Gate → Judge Proof → Finalist Simulator → Submission Publisher → Marketplace → Winning Strategy → Contract/Mission → Ops Drill → Submission links」の30秒リールを録画します。質疑ではDemo Conciergeのfirst click/persona lanes、Judge Command Centerのreadiness/blockers、Judge RehearsalのDefense Lock checks、Competitive BattlecardのCriteria Duel/source-backed answers/SWOT receipts、Deploy Recoveryのmanual auth/redeploy commands、Winner Sufficiencyのyes-no判定、Release Drift Guardのmissing skills/redeploy runbook、Acceptance Matrixのwatch rows、Moat Stress Testのcompetitor objections、Judge Drillのhardest question、Live Evidence Monitorの5 probes、External Evidence Verifierのfinal URL probes、Judge Demo Receiptのsha256 digest、Squad Optimizerのbudget gap/swap plan、User Pilot Labのfrictions/next clicks、Impact Caseのユーザー別KPI、Pilot Economicsのpayback days/pricing lanes/buyer objections、Security Sentinel Reviewのtrust boundary、Finalist Simulatorのtop concern/evidence linksを使います。
