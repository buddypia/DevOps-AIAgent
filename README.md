# Agent-To-Agent Marketplace

必要な能力を持つAIを市場から探し、雇い、A2Aで連携させる DevOps x AI Agent Hackathon 向けプロダクトです。

## Concept

`brief2dev` の「要件を開発・検証・運用へ落とす」考え方を、エージェント市場に変換しました。ユーザーはプロジェクトブリーフを貼り、AIエージェントを能力値・スキル・MCP成熟度・価格で比較して購入します。購入すると、企画、実装配送、運用信頼性、ユーザビリティ、A2A統制の改善量が可視化されます。

## Hackathon Fit

- Google Cloud: Cloud Run デプロイを前提にした `Dockerfile` / `cloudbuild.yaml` / `/healthz`
- AI: Gemini API `gemini-3.5-flash`
- A2A: `/.well-known/agent-card.json` と `/a2a` JSON-RPC互換エンドポイント
- DevOps: GitHub Actions CI/CD/Cloud Run運用を見据えた推薦、検証コマンド、MCP行列
- UX: Agent Studio の「AIをキャラクターとして管理する」発想を、市場・購入・編成のゲームループに再構成
- Contract: 選んだAIごとに成果物、受入条件、SLA、検証コマンド、支払い条件を生成
- Strategy: ADK、A2A Marketplace、LangGraph、CrewAI、Dify、AgentOpsとの差分をアプリ内で比較し、SWOT、審査5項目、提出準備、次に雇うべきAIを算出
- Market Intel: Gemini Enterprise、ADK、A2A、LangGraph、CrewAI、Dify、AgentOps、Cloud Runの公式ソース付き比較で、差別化仮説と審査回答を生成
- Moat Stress Test: ADK、A2A Marketplace、LangGraph、CrewAI、Dify、AgentOpsからの反論を想定し、証拠付き回答と録画順を返す
- MVP Audit: 必須技術、審査5項目、DevOps証拠、提出3点をハードゲートで判定し、外部未発行URLをwatchとして残す
- Judge Brief: 競合差別化、MVP監査、勝ち筋、提出証拠、30秒導線、残リスクを審査員の初見1ページに圧縮
- Judge Tour: Judge Brief、Market Intel/SWOT、Impact Case、Security Review、Judge Proof、Submission Launch Gateを90秒の審査導線に束ねる
- User Pilot Lab: 開発リード、Platform/SRE、提出者が最初の3分で価値へ到達できるかを検証し、摩擦と次クリックを出す
- Squad Optimizer: 予算内のAI編成を総当たりし、審査スコア、必須技術カバレッジ、交換計画、追加予算ギャップを返す
- Live Evidence Monitor: Cloud Run、Agent Card、A2A、Squad Optimizer、GitHub Actions CIを公開環境からライブ検証する
- Release Drift Guard: GitHub/CIが緑でも公開Cloud Runが古いrevisionなら、Agent Card、Acceptance Matrix、A2A artifactの差分で検知する
- Judge Demo Receipt: 審査導線、競合反論、編成判断、公開証拠、外部提出URL状態をsha256 digest付きの検収票にする
- Judge Acceptance Matrix: 必須技術、審査5項目、競合/SWOT、公開証拠、提出物をaccepted/watch/blockedの受入表にする
- Autonomy Ledger: 市場探索、判断、契約、A2A委任、検証、運用、提出を検収可能なAI自律性台帳に変換
- Security Sentinel Review: Secret Manager、IP allowlist、Zod入力制限、A2A信頼境界、CIを安全性証拠に変換
- Impact Case: 対象ユーザー、時間短縮、提出信頼度、運用リスク、導入計画を実用性・体験価値の証拠に変換
- Submission Launch Gate: ProtoPedia作品URLと動画URLを入力し、提出3点、タグ、本文、CI、証拠receiptを最終判定
- Autonomy: Mission Controlが審査で弱い項目を検出し、A2A委任、検証runbook、ProtoPedia提出パックを生成
- Operate: Ops DrillがCloud Run公開デモの稼働シグナルを読み、継続・ロールバック・追加雇用を判断
- Proof: Judge ProofがGemini、Cloud Run、A2A、競合/SWOT、Mission、Ops、GitHub Actions CI、提出URLを1クリックで証拠束にする
- Pitch: Pitch Directorが30秒動画の録画順、字幕、証拠リンク、提出残リスクを生成する
- Judge Drill: 審査5項目ごとの厳しい質問、短い回答、証拠リンク、次アクションを生成する
- Finalist: 審査員5役の模擬判定で、最終候補スコア、落選理由、残ギャップ、次の一手を生成する
- Publisher: ProtoPediaに貼る本文、タグ、URL、動画台本、残ギャップを提出直前パッケージにする
- Demo Runway: Judge Proof、Finalist、Publisher、Marketplace、Strategy、Mission、Opsを30秒の審査員導線に束ねる
- Win Autopilot: 競合/SWOT、Live Evidence、Judge Demo Receipt、Moat Stress、Squad Optimizer、最終候補判定、提出、運用を一括で走らせ、勝てる状態と残アクションを返す
- Submission Dossier: ProtoPedia本文、動画録画順、提出リンク、最終チェック、Markdownを1つに束ねる
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

`Market Intel Board` は、競合分析を「やったつもり」にせず、審査員に見せられるソース付き証拠へ変換するパネルです。Gemini Enterprise Agent Platform、Google ADK、A2A protocol、LangGraph、CrewAI、Dify、AgentOps、Cloud Runの一次情報リンクを持ち、競合ごとの強み、露出する隙、こちらの反撃、デモで見せる証拠を返します。

- API: `POST /api/market-intel`
- App UI: `Run market intel`
- Output: market score、source checklist、competitor cuts、judge answers、next moves、A2A `market.intel` payload

## Moat Stress Test

`Moat Stress Test` は、「それADK/LangGraph/CrewAI/Dify/AgentOpsでよくない？」という審査員の反論を先に受けるためのパネルです。競合ごとに想定ツッコミ、相手の強み、こちらの回答、見せる証拠、残リスク、録画順を返し、置き換えではなく「AI能力調達とA2A委任の体験」が勝ち筋だと説明できる形にします。

- API: `POST /api/moat-stress`
- App UI: `Stress-test moat`
- Output: moat score、competitor objections、proof routes、recording order、next actions、A2A `moat.stress` payload

## MVP Audit

`MVP Audit` は、機能が多いだけでMVP判定が曖昧になる問題を避けるためのハードゲートです。Cloud Run、Gemini、A2A、競合/SWOT、GitHub Actions、運用判断、公開GitHub、デプロイ済みURL、ProtoPedia作品URL、動画URL、30秒審査導線をpass/watch/failで判定します。ProtoPedia作品URLと動画URLのような外部提出作業は、未発行なら合格扱いにせずwatchとして残します。

- API: `POST /api/mvp-audit`
- App UI: `Run MVP audit`
- Output: MVP score、band、hard-gate status、judge lanes、blockers、proof URLs、A2A `mvp.audit` payload

## Judge Brief

`Judge Brief` は、審査員の初見で情報量が多すぎる問題を避けるための1ページブリーフです。Market Intel、MVP Audit、Win Autopilot、Judge Proof、Finalist、Submission Dossierを束ね、勝ち筋、hard truth、key metrics、proof ladder、30秒導線、残リスク、A2A `judge.brief` payloadを返します。

- API: `POST /api/judge-brief`
- App UI: `Build judge brief`
- Output: brief score、readiness、hard truth、key metrics、proof ladder、30秒route、risk register、evidence links、A2A `judge.brief` payload

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

## Release Drift Guard

`Release Drift Guard` は、提出用Cloud Run URLが最新mainの機能を本当に返しているかを検査します。公開healthが通っていても、Agent Cardのskill数、`acceptance.matrix`、`demo.receipt`、`release.drift`、A2A artifact、Acceptance Matrix endpointが古ければ `deploy-drift` として止めます。

- API: `POST /api/release-drift`
- App UI: `Check release drift`
- Output: drift score、verdict、expected/observed skill count、missing skills、redeploy runbook、A2A `release.drift` payload

## Judge Demo Receipt

`Judge Demo Receipt` は、審査動画で実行した主張を1枚の検収票に固定します。Judge Tour、Moat Stress Test、Squad Optimizer、Live Evidence Monitor、Submission Launch Gateをstamp化し、ProtoPedia作品URLと動画URLが未入力ならwatchとして残します。最後にsha256 digestを控えることで、動画後の質疑でも「何を見せ、何が未完了か」を同じ証拠で再確認できます。

- API: `POST /api/demo-receipt`
- App UI: `Seal receipt`
- Output: receipt score、stamps、recording order、next actions、sha256 digest、A2A `demo.receipt` payload

## Judge Acceptance Matrix

`Judge Acceptance Matrix` は、MVP判定を最後に曖昧にしないための受入表です。Cloud Run/Gemini/A2Aの必須技術、審査5項目、競合/SWOTとMoat反論、Live Evidence、Security/Impact/User Pilot、ProtoPedia/動画URL、Judge Demo Receiptを12行のaccepted/watch/blockedに束ねます。外部提出URLが未発行なら、本体が受入可能でも `accepted-with-external-gaps` として残します。

- API: `POST /api/acceptance-matrix`
- App UI: `Build acceptance matrix`
- Output: acceptance score、verdict、12 acceptance rows、next actions、sha256 digest、A2A `acceptance.matrix` payload

## Autonomy Ledger

`Autonomy Ledger` は、「AIエージェントが価値の中心」という審査基準を主張ではなく検収ログにします。Market Intel、Mission Control、Contract Desk、A2A Agent Card、Judge Proof、Ops Drill、Submission Dossierをつなぎ、どのAIが何を判断し、どのendpointで検証できるかを7段階の台帳として返します。

- API: `POST /api/autonomy-ledger`
- App UI: `Build autonomy ledger`
- Output: ledger score、verdict、7-phase decision chain、agent handoffs、judge challenge answers、sha256 receipt、A2A `autonomy.ledger` payload

## Submission Launch Gate

`Submission Launch Gate` は、外部提出URLを曖昧に合格扱いしない最終ゲートです。ProtoPedia作品URLと動画URLを入力すると、提出3点、`findy_hackathon` タグ、ProtoPedia本文、CI、MVP hard gates、Judge Proof receiptをまとめて判定します。URL未入力なら `needs-external-urls`、形式不正なら `invalid-urls`、両方揃ったときだけ `submit-ready` を返します。

- API: `POST /api/submission-launch`
- App UI: `Check launch gate`
- Output: launch score、readiness、URL status、final checklist、copy actions、submit packet、A2A `submission.launch` payload

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
- Runbook: healthz、`/api/ops-drill`、Cloud Run describe、Cloud Logging、traffic updateコマンドを固定
- A2A payload: `ops.drill` skillとしてseverity、signals、rollback判断、next ops hireを返す

## Submission Kit

提出に必要な素材はアプリとリポジトリの両方に固定しています。

- System architecture: `public/assets/a2a-marketplace-architecture.svg`
- ProtoPedia markdown draft: `docs/03_submission/submission-pack.md`
- API: `GET /api/submission-kit`
- App UI: Mission Control実行後に `Architecture Diagram` / `30s Storyboard` / `Required Assets` を表示

## Judge Proof

`Judge Proof` はWin Autopilotの次に開く証拠束です。Geminiの実応答、Cloud Run公開URL、A2A Agent Card、競合/SWOT、Mission Control、Ops Drill、GitHub Actions CI、提出URLをまとめ、AI・Google Cloud・DevOps・A2A・提出準備の状態を1レスポンスで確認できます。

- API: `POST /api/proof`
- App UI: `Run judge proof`
- Output: overall proof score、7カテゴリスコア、live links、proof runbook、sha256 receipt

## Win Autopilot

`Win Autopilot` は審査員と提出者が最初に押す一括実行入口です。競合/SWOT、Live Evidence、Judge Demo Receipt、Moat Stress Test、Squad Optimizer、Mission、Contract、Ops、Judge Proof、Finalist、Submission Publisher、Demo Runwayを束ね、win score、12 lanes、残ブロッカー、証拠デッキ、A2A `win.autopilot` payloadを返します。A2A payloadの `decisiveProof` にはlive evidence score、receipt digest、moat verdict、squad readinessを含めます。

- API: `POST /api/win-run`
- App UI: `Run win autopilot`
- Output: win score、readiness、12 lane scorecards、decisive proof、next actions、evidence deck、autonomy trace

## Demo Runway

`Demo Runway` は審査員の初見体験を一本化する入口です。Judge Proof、Finalist Simulator、Submission Publisher、Marketplace、Winning Strategy、Contract/Mission、Ops Drillを30秒の順番に並べ、証拠リンク、録画キュー、外部URL残リスクを返します。

- API: `POST /api/demo-run`
- App UI: `Run demo runway`
- Output: demo score、8-step judge route、proof links、recording cues、external risks、A2A `demo.runway` payload

## Pitch Director

`Pitch Director` はProtoPedia動画用の録画台本です。審査員が30秒で価値を理解できるように、Judge Proof、Marketplace、Winning Strategy、Mission Control、Ops Drill、Submission Kitの順で、画面操作、読み上げ台詞、字幕、証拠リンクを生成します。

- API: `POST /api/pitch`
- App UI: `Build pitch`
- Output: 30秒/6シーンのshot list、voiceover、lower thirds、recording checklist、ProtoPedia/video残リスク

## Judge Drill

`Judge Drill` は、審査員からの厳しい質問に備える反証ボードです。AIエージェント中心性、課題アプローチ、ユーザビリティ、実用性、実装力の5項目ごとに、想定質問、15秒回答、証拠リンク、デモで開くべき画面を生成します。

- API: `POST /api/judge-drill`
- App UI: `Run judge drill`
- Output: hardest question、5 objection cards、cross-exam runbook、evidence links、A2A payload

## Finalist Simulator

`Finalist Simulator` は、提出直前に「最終候補へ残れるか」を審査員5役で模擬判定するパネルです。競合/SWOT、Mission、Ops、Contract、Pitch、Judge Drillの証跡を束ね、点数だけでなく落選理由と次の一手を返します。ProtoPedia作品URLや動画URLのような外部提出作業は、合格扱いにせず残ギャップとして明示します。

- API: `POST /api/finalist`
- App UI: `Simulate finalist`
- Output: finalist score、5 judge panels、remaining gaps、top concern、winning move、A2A payload

## Submission Publisher

`Submission Publisher` は、ProtoPedia登録の最後の作業を迷わず進めるための提出直前パッケージです。Mission、Pitch、Finalistの証跡から、作品タイトル、概要、課題、対象ユーザー、特徴、技術構成、タグ、動画説明、構成図、公開URL、残ギャップを貼り付け可能な形に変換します。

- API: `POST /api/publisher`
- App UI: `Build publisher`
- Output: publish score、paste fields、assets、final checklist、recording script、A2A `submission.publish` payload

## Submission Dossier

`Submission Dossier` は外部提出直前の作業束です。Submission Publisher、Win Autopilot、Demo Runway、Judge Proofをまとめ、ProtoPediaに貼る本文、提出リンク、30秒録画順、最終チェック、Markdownドシエを返します。

- API: `POST /api/dossier`
- App UI: `Run submission dossier`
- Output: dossier score、copy blocks、submission links、recording plan、final checks、Markdown、A2A `submission.dossier` payload

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

- `GET /api/healthz` (`/healthz` もローカル互換で提供)
- `GET /.well-known/agent-card.json`
- `POST /a2a`
- `POST /api/recommend`
- `POST /api/strategy`
- `POST /api/market-intel`
- `POST /api/moat-stress`
- `POST /api/mvp-audit`
- `POST /api/judge-brief`
- `POST /api/judge-tour`
- `POST /api/user-pilot`
- `POST /api/squad-optimizer`
- `POST /api/live-evidence`
- `POST /api/release-drift`
- `POST /api/demo-receipt`
- `POST /api/acceptance-matrix`
- `POST /api/autonomy-ledger`
- `POST /api/submission-launch`
- `POST /api/security-review`
- `POST /api/impact-case`
- `POST /api/mission`
- `POST /api/win-run`
- `POST /api/dossier`
- `POST /api/demo-run`
- `POST /api/publisher`
- `POST /api/ops-drill`
- `POST /api/contracts`
- `POST /api/pitch`
- `POST /api/judge-drill`
- `POST /api/finalist`
- `POST /api/proof`
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

ProtoPediaには、公開GitHubリポジトリURL、Cloud Run URL、作品URLを提出します。GitHubは <https://github.com/buddypia/DevOps-AIAgent>、Cloud Runは <https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app>。公開CIは <https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml>。タグは `findy_hackathon`。提出本文はSubmission Publisherのpaste fieldsを貼り、最初にJudge Tourで90秒導線と外部URL不足を確認し、Squad Optimizerで140予算内の最適編成と+22のUX追加ギャップを確認し、Moat Stress Testで「既存ツールでよくない？」への証拠付き反論を確認し、Live Evidence Monitorで公開Cloud Run/A2A/CIのライブ証拠を確認し、Release Drift Guardで提出用Cloud Runが最新skill surfaceを返すか確認し、Judge Demo Receiptでsha256 digestと外部URL状態を控え、Judge Acceptance Matrixで必須技術、審査5項目、公開証拠、提出物がaccepted/watch/blockedのどれかを確認し、User Pilot Labで対象ユーザー別の初回価値到達を確認し、Win Autopilotでwin scoreと残アクションを確認します。動画ではDemo Runwayの「Judge Tour → Squad Optimizer → Moat Stress Test → Live Evidence Monitor → Release Drift Guard → Judge Demo Receipt → Judge Acceptance Matrix → User Pilot Lab → Judge Brief → Autonomy Ledger → Security Sentinel Review → Impact Case → Submission Launch Gate → Judge Proof → Finalist Simulator → Submission Publisher → Marketplace → Winning Strategy → Contract/Mission → Ops Drill → Submission links」の30秒リールを録画します。質疑ではRelease Drift Guardのmissing skills/redeploy runbook、Acceptance Matrixのwatch rows、Moat Stress Testのcompetitor objections、Judge Drillのhardest question、Live Evidence Monitorの5 probes、Judge Demo Receiptのsha256 digest、Squad Optimizerのbudget gap/swap plan、User Pilot Labのfrictions/next clicks、Impact Caseのユーザー別KPI、Security Sentinel Reviewのtrust boundary、Finalist Simulatorのtop concern/evidence linksを使います。
