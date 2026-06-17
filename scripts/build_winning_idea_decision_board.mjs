#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skillRoot = '/Users/a13973/.agents/skills/html-artifacts';
const outPath = path.join(root, 'outputs', 'winning_idea_decision_board.html');
const debateRealityPath = path.join(root, 'outputs', 'multi_llm_debate_reality_check_2026-06-13.json');
const debatePath = fs.existsSync(debateRealityPath)
  ? debateRealityPath
  : path.join(root, 'outputs', 'multi_llm_debate_winning_ideas.json');

const read = (file) => fs.readFileSync(file, 'utf8');
const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function moduleCss(name) {
  const src = read(path.join(skillRoot, 'templates', 'modules', `${name}.html`)).replace(/<!--[\s\S]*?-->/g, '');
  const match = src.match(/<style data-module="[^"]*">([\s\S]*?)<\/style>/);
  return match ? match[1].trim() : '';
}

function debateSummary() {
  if (!fs.existsSync(debatePath)) {
    return {
      status: 'skill-run-pending-or-unavailable',
      proponent: '勝ち筋は、AIがDevOps上の判断を一段引き受ける案に寄せること。特にリリース可否、カナリア昇格、評価データ更新は、審査員に価値が伝わりやすい。',
      opponent: '弱い案は、ログ要約や汎用ダッシュボードに見えるもの。実連携が薄いと、AIエージェントではなく説明生成に見える危険がある。',
      moderator: '最終候補は、DevOpsの意思決定を中心に置き、Cloud RunとGemini/ADKの必然性があり、画面デモでBefore/Afterが見える案を優先する。'
    };
  }

  try {
    const raw = JSON.parse(read(debatePath));
    return {
      status: raw.status || 'multi-llm-debate-result-captured',
      proponent: raw.proponent || raw.proponent_position || 'Proponent output captured.',
      opponent: raw.opponent || raw.opponent_position || 'Opponent output captured.',
      moderator: raw.moderator || raw.finalVerdict || raw.final_verdict || 'Moderator output captured.'
    };
  } catch {
    return {
      status: 'debate-output-present-but-unparsed',
      proponent: '討論出力は保存済みだが、HTML生成時には構造化抽出できなかった。',
      opponent: '保存済みファイルを直接確認すること。',
      moderator: 'このHTMLではローカル資料と審査軸からの統合判断を採用している。'
    };
  }
}

const ideas = [
  {
    rank: 1,
    name: 'ShipGuard AI',
    slug: '01-shipguard-ai',
    verdict: 'GO',
    score: 96,
    sharp: 88,
    feasibility: 92,
    gcp: 94,
    demo: 90,
    role: 'past-incident release rehearsal agent',
    labels: 'SHIP / WATCH / BLOCK',
    tagline: 'Cloud Run canaryを過去障害と照合し、人間の承認前に再発リスクを判定する。',
    whyWin: '「このリリースは過去障害を再現していないか」という高圧なDevOps判断を1画面で扱うため、実務の痛み、AIエージェント性、デモの緊張感がそろう。',
    diff: '単なるPR/ログ要約ではなく、Incident Replay Dossier、Cloud Run canary drift、Runbook patch、人間の承認ポイントをまとめて出す。',
    mvp: 'PR URL、Cloud Run canary window、過去インシデント、Runbook状態を入力し、Geminiがincident replay verdict、証拠カード、PRコメント案を返す。',
    screen: ['左: PR/canary/過去障害入力', '中央: Incident Replay Dossier', '右: SHIP/WATCH/BLOCK + human gate', '下: Runbook patchとPRコメント案', 'フッタ: フィードバックとJSON export'],
    demoScript: 'Clean replayではSHIP/WATCHに留まり、April retry stormに似たcanaryではBLOCKとRunbook patchが出る2本を切り替える。',
    scope: 'GitHub PR取得は補助。MVPの主役はCloud Run canary、過去障害fixture、Runbook stale fixture、Gemini判定、Cloud Runデプロイに絞る。',
    risks: ['過去障害fixtureが弱いと普通のログ判定に見える', '自動traffic変更まで踏み込むと安全説明が重い', '人間の承認点が見えないとAI任せに見える'],
    next: ['Clean replay / Incident echo / Runbook stale の3シナリオを固定する', '否定表現と過去障害参照を誤判定しないスコアリングにする', 'Incident Replay Dossierを画面の中心に置く'],
    kill: '過去障害との照合、canary差分、人間の承認点が一目で伝わらないならKill。',
    input: 'PR diff + Cloud Run canary + past incident + runbook',
    agent: 'Gemini incident replay gate + safety rubric',
    output: 'Ship/Watch/Block + dossier + runbook patch'
  },
  {
    rank: 2,
    name: 'Canary Diff Judge',
    slug: '03-canary-diff-judge',
    verdict: 'GO',
    score: 91,
    sharp: 84,
    feasibility: 86,
    gcp: 98,
    demo: 91,
    role: 'canary promotion judge',
    labels: 'PROMOTE / HOLD / ROLLBACK',
    tagline: 'Cloud Runのstable/candidate revisionを比較し、カナリア昇格か戻しかをAIが裁定する。',
    whyWin: 'Cloud Run、Cloud Logging、Monitoring、Geminiの必然性が非常に高く、Google Cloud枠で強い。',
    diff: 'ログ要約ではなく、traffic splitを動かす判断まで踏み込む。',
    mvp: 'stable/candidateのエラー率、p95、ログ差分を入力し、昇格/保留/戻しとtraffic変更案を返す。',
    screen: ['上: revision比較ヘッダー', '左: stable metrics', '中央: candidate metrics', '右: PROMOTE/HOLD/ROLLBACK判定', '下: traffic shift planとrollback command'],
    demoScript: 'candidateの5xx増加、p95悪化、特定ログ増加を差し替え、PROMOTEからROLLBACKへ変える。',
    scope: 'Cloud Run実revision連携は後回し可。fixtureで比較データを持ち、Cloud Runにデプロイして見せる。',
    risks: ['メトリクス比較だけなら普通の監視に見える', '自動traffic変更までやると権限リスクがある', 'ログサンプルが薄いとAI判断の価値が出ない'],
    next: ['revision A/B fixtureを作る', 'p95/error/log anomalyを3指標に固定する', 'gcloud traffic update案を表示する'],
    kill: 'Cloud Run revision差分が画面上で見えないならKill。',
    input: 'stable/candidate metrics + log deltas',
    agent: 'Gemini canary judge',
    output: 'Promotion verdict + traffic plan'
  },
  {
    rank: 3,
    name: 'Deploy Rehearsal Agent',
    slug: '06-deploy-rehearsal-agent',
    verdict: 'GO',
    score: 88,
    sharp: 82,
    feasibility: 92,
    gcp: 82,
    demo: 84,
    role: 'pre-production rehearsal director',
    labels: 'READY / CHECK / STOP',
    tagline: '本番前にデプロイ手順をリハーサルし、Secret、環境変数、順序ミスを止める。',
    whyWin: '障害後の対応ではなく、障害前に介入する。DevOpsの予防線として実務感が強い。',
    diff: 'RunbookとActionsとCloud Run設定の齟齬を、実行前のSTOP条件に変える。',
    mvp: 'README、GitHub Actions、env.example、Cloud Run設定メモを入力し、手順の穴と修正PRコメント案を出す。',
    screen: ['左: runbook/actions/env入力', '中央: rehearsal checklist', '右: READY/CHECK/STOP判定', '下: missing secret/envと実行順序', '別タブ: PR comment draft'],
    demoScript: '新しい環境変数をコードに追加し、Cloud Run側未設定としてSTOP判定を出す。',
    scope: 'env抽出は正規表現とGeminiの併用でよい。実Cloud Run APIは後続。',
    risks: ['地味に見えやすい', '検出ロジックが緩いと説得力が落ちる', '入力の形式差に弱い'],
    next: ['ENV_MISSINGのfixtureを作る', '手順を5ステップに正規化する', 'STOP条件を赤く固定表示する'],
    kill: '本番前に止める理由が一目で伝わらないならWatchに落とす。',
    input: 'README + Actions + env.example + deploy notes',
    agent: 'Gemini rehearsal director',
    output: 'Stop conditions + checklist'
  },
  {
    rank: 4,
    name: 'Eval Dataset Gardener',
    slug: '09-eval-dataset-gardener',
    verdict: 'GO',
    score: 86,
    sharp: 95,
    feasibility: 80,
    gcp: 82,
    demo: 83,
    role: 'AI eval maintenance agent',
    labels: 'ADD CASES / CURATE / BLOCK MODEL CHANGE',
    tagline: '失敗したAI応答や低評価ログを、次回の回帰evalケースへ育てる。',
    whyWin: 'AIエージェントを作るだけでなく、AIエージェントを運用改善するメタDevOps。かなり尖っている。',
    diff: 'AI品質を「感想」ではなく、デプロイゲートで使う評価データに変換する。',
    mvp: '失敗応答、期待動作、ユーザー評価を入力し、eval case、expected answer、regression run planを生成する。',
    screen: ['左: failed response intake', '中央: generated eval cases', '右: model release gate判定', '下: dataset diff', '別枠: next regression command'],
    demoScript: '悪いAI応答を投入し、次回モデル変更をBLOCK MODEL CHANGEに変える。',
    scope: 'BigQueryや本番ログ連携は不要。CSV/JSON貼り付けとダウンロードでMVPになる。',
    risks: ['DevOps文脈が伝わりにくいとAI品質管理ツールに見える', '評価指標が抽象的だと弱い', 'モデル比較まで広げると重い'],
    next: ['失敗応答3件のfixtureを作る', 'eval JSONL出力を作る', 'before/afterのpass rateを可視化する'],
    kill: '生成されたevalをそのまま保存/実行できないなら差別化が弱い。',
    input: 'Failed AI outputs + feedback + expected behavior',
    agent: 'Gemini eval curator',
    output: 'Eval cases + model gate'
  },
  {
    rank: 5,
    name: 'AI Exploratory Tester',
    slug: '16-ai-exploratory-tester',
    verdict: 'GO',
    score: 84,
    sharp: 86,
    feasibility: 76,
    gcp: 76,
    demo: 96,
    role: 'exploratory QA agent',
    labels: 'TEST NOW / EXPLORE MORE / BLOCK RELEASE',
    tagline: 'AIがユーザー役として画面導線を探索し、壊れた体験を再現手順つきで報告する。',
    whyWin: '画面が動くデモは強い。エージェントが自分で観点を立てて巡回するため、会場で伝わりやすい。',
    diff: '定型E2Eではなく、PR差分から探索チャーターを作ってから操作する。',
    mvp: '対象URLと変更メモを入力し、探索チャーター、想定操作、発見バグ、再現手順を生成する。',
    screen: ['上: target URLと変更メモ', '左: exploration charter', '中央: screenshot/observations', '右: BLOCK RELEASE判定', '下: GitHub issue draft'],
    demoScript: '壊れたログイン導線やボタン遷移を用意し、AIが再現手順を作る。',
    scope: '初期MVPは実ブラウザ自動操作なしでも、チャーター生成と手動スクショ添付で成立。余力があればPlaywright連携。',
    risks: ['ブラウザ自動操作に時間を吸われる', 'GCP必然性が弱め', '不安定なデモになりやすい'],
    next: ['壊れた導線fixtureを作る', '探索チャーターを3つに限定する', 'issue draftを強く作る'],
    kill: '実画面のBefore/Afterが出せないならWatch。',
    input: 'Target URL + PR notes + optional screenshot',
    agent: 'Gemini exploratory planner',
    output: 'Charters + issue draft'
  },
  {
    rank: 6,
    name: 'Blast Radius Agent',
    slug: '04-blast-radius-agent',
    verdict: 'GO AS MODULE',
    score: 83,
    sharp: 80,
    feasibility: 92,
    gcp: 72,
    demo: 82,
    role: 'change impact forecaster',
    labels: 'LOW RADIUS / WATCH RADIUS / HIGH RADIUS',
    tagline: 'PR差分から、影響しそうな画面、API、DB、運用手順を地図化する。',
    whyWin: 'リリース判断の中核部品として強い。単体よりShipGuardに内包すると勝ち筋が太くなる。',
    diff: '変更ファイル一覧ではなく、壊れそうな場所と確認すべき観点に変換する。',
    mvp: 'PR diff貼り付けから、影響面、テストギャップ、オーナー、監視ポイントを出す。',
    screen: ['左: changed files tree', '中央: impact map', '右: HIGH RADIUS判定', '下: required tests', '別枠: owner routing'],
    demoScript: '認証処理変更から、ログイン画面、API、env、runbookまで爆風が広がる図を見せる。',
    scope: '依存解析は浅くてよい。AI分類と手動fixtureで、影響マップを美しく見せる。',
    risks: ['単体では地味', 'AIの推測が外れると信頼を失う', '図が弱いと差別化が消える'],
    next: ['認証PR fixtureを作る', 'impact mapをSVGで固定する', 'ShipGuardのEvidenceタブに組み込む'],
    kill: '単独プロダクトとして作るならWatch。ShipGuardモジュール化ならGo。',
    input: 'PR diff + service map hints',
    agent: 'Gemini impact forecaster',
    output: 'Impact map + test gaps'
  },
  {
    rank: 7,
    name: 'Privacy Impact Diff Agent',
    slug: '05-privacy-impact-diff-agent',
    verdict: 'WATCH',
    score: 81,
    sharp: 84,
    feasibility: 84,
    gcp: 74,
    demo: 76,
    role: 'privacy diff reviewer',
    labels: 'CLEAR / REVIEW / BLOCK PRIVACY',
    tagline: 'PRから個人情報の取得、保存、ログ出力、外部送信の変更を検出する。',
    whyWin: '企業利用に刺さり、セキュリティ/法務/DevOpsをつなげられる。信頼性テーマとして強い。',
    diff: '個人情報影響を「レビュー観点」ではなく、リリースゲートへ変換する。',
    mvp: 'PR diffとログ例を入力し、PII path、retention、log exposure、external sharingのチェックリストを返す。',
    screen: ['左: PR diff/log sample', '中央: PII flow map', '右: CLEAR/REVIEW/BLOCK PRIVACY', '下: mitigation checklist', '別枠: privacy comment draft'],
    demoScript: 'email/tokenをログ出力する変更を入れ、BLOCK PRIVACYを出す。',
    scope: '法的断定は避け、技術リスク判定に絞る。サンプルPII辞書とGemini分類でMVP。',
    risks: ['法務判断に見えると重い', '審査で地味に見える可能性', '誤検出への説明が必要'],
    next: ['PII辞書とログ露出fixtureを作る', '技術判定に限定する文言を入れる', 'mitigationを具体化する'],
    kill: '法務レビュー代替に見えるならKill。技術リリースゲートとして見せるならWatch。',
    input: 'PR diff + log sample + data policy note',
    agent: 'Gemini privacy reviewer',
    output: 'Privacy gate + mitigations'
  },
  {
    rank: 8,
    name: 'Recovery Confidence Meter',
    slug: '08-recovery-confidence-meter',
    verdict: 'WATCH',
    score: 78,
    sharp: 82,
    feasibility: 86,
    gcp: 84,
    demo: 78,
    role: 'recovery verification agent',
    labels: 'CLOSE / VERIFY / KEEP INCIDENT OPEN',
    tagline: '障害復旧後のログとメトリクスを読み、本当に閉じてよいかの確信度を出す。',
    whyWin: '原因分析より一段深い「復旧判断」を扱う。SRE/運用経験者には刺さる。',
    diff: '直った気がする、をbaseline比較と残存症状で数値化する。',
    mvp: '復旧前後のerror/p95/traffic/log anomalyを比較し、confidenceと残タスクを返す。',
    screen: ['上: incident timeline', '左: before metrics', '中央: after metrics', '右: confidence meter', '下: close/keep-open checklist'],
    demoScript: '全体エラーは減ったが特定APIだけ遅いケースでKEEP INCIDENT OPENを出す。',
    scope: 'Cloud Monitoring実接続は後回し。メトリクスfixtureとログ貼り付けで成立。',
    risks: ['復旧後デモは緊張感が弱い', '指標が少ないと判断が軽い', 'ShipGuard/Canaryと重複しやすい'],
    next: ['before/after fixtureを作る', 'confidenceの分解式を見せる', 'closing statement draftを作る'],
    kill: '単体で作るより、CanaryやIncident系のサブ機能にした方がよければWatch継続。',
    input: 'Before/after logs + metrics + incident notes',
    agent: 'Gemini recovery verifier',
    output: 'Confidence + closure criteria'
  },
  {
    rank: 9,
    name: 'Runbook Decay Detector',
    slug: '11-runbook-decay-detector',
    verdict: 'WATCH',
    score: 76,
    sharp: 90,
    feasibility: 94,
    gcp: 82,
    demo: 86,
    role: 'runbook freshness agent',
    labels: 'FRESH / PATCH DOCS / STALE',
    tagline: 'Runbookのコマンド、URL、環境変数、担当者が現状とズレていないかを検出する。',
    whyWin: 'multi-llm-debateのリスク調整後Go案。古いrunbookはどのチームにも痛みがあり、既存の監視AIやリリースAIと被りにくい。安全に修正PRまで見せられる。',
    diff: 'ドキュメント校正ではなく、現行repo、CI/CD、Cloud Run設定、過去インシデントとの照合で修正PRコメントまで出す。',
    mvp: 'runbook、env.example、package scripts、Cloud Run設定メモを照合し、古い手順と修正案を出す。',
    screen: ['左: runbook text', '中央: detected decay list', '右: FRESH/PATCH DOCS/STALE', '下: doc patch proposal', '別枠: verification commands'],
    demoScript: '存在しないenv名や古いgcloud commandを含むrunbookを投入し、修正案を生成する。',
    scope: '静的解析とGemini補助で十分。Docs PR作成はコメント案まで。',
    risks: ['画面演出が弱いと地味に見える', 'GCP必然性をCloud Run設定差分で明確にする必要がある', '修正PRまで出せないと単なる文書レビューに落ちる'],
    next: ['古いrunbook fixtureを2本作る', 'Repo Scanner、Runtime Evidence Judge、PR Writerの3エージェント構成にする', 'diff風の修正PRプレビューを作る'],
    kill: '修正PR案まで出せない、または現行repo/Cloud Run設定との照合が見えないならKill。',
    input: 'Runbook + repo scripts + env notes',
    agent: 'Gemini runbook reviewer',
    output: 'Decay report + doc patch'
  },
  {
    rank: 10,
    name: 'Incident Commander Karaoke',
    slug: '20-incident-commander-karaoke',
    verdict: 'WATCH',
    score: 74,
    sharp: 98,
    feasibility: 72,
    gcp: 86,
    demo: 94,
    role: 'incident command rehearsal coach',
    labels: 'GOOD COMMAND / COACH / RETRY COMMAND',
    tagline: '障害指揮の発話を採点し、より良い指示へ言い換える訓練エージェント。',
    whyWin: '名前とデモの記憶残りが強い。Speech-to-Textを入れるとGoogle Cloud AIの幅も見せられる。',
    diff: '障害対応を「読む」だけでなく、人間の指示品質を練習として改善する。',
    mvp: '音声文字起こしまたはテキスト指示を入力し、明確性、担当割当、頻度、次アクションを採点する。',
    screen: ['左: transcript input', '中央: score sheet', '右: GOOD/COACH/RETRY判定', '下: improved command', '別枠: role assignment map'],
    demoScript: '曖昧な指示を入力し、担当者/時間/確認条件が入った良い指示へ変換する。',
    scope: 'Speech-to-Textは余力枠。まずテキスト入力で成立させ、音声は発表演出に使う。',
    risks: ['ネタに見えすぎる', 'DevOps実務価値の説明が必要', '音声連携で時間を溶かしやすい'],
    next: ['悪い指示/良い指示fixtureを作る', '採点rubricを4軸に固定する', '音声は最後の演出にする'],
    kill: '実務価値を説明できず、ただ面白いだけならKill。',
    input: 'Incident command transcript',
    agent: 'Gemini command coach',
    output: 'Score + improved command'
  }
];

const decisionOrder = new Map([
  ['ShipGuard AI', 1],
  ['Runbook Decay Detector', 2],
  ['Canary Diff Judge', 3],
  ['Deploy Rehearsal Agent', 4],
  ['Privacy Impact Diff Agent', 5],
  ['Eval Dataset Gardener', 6],
  ['Recovery Confidence Meter', 7],
  ['AI Exploratory Tester', 8],
  ['Blast Radius Agent', 9],
  ['Incident Commander Karaoke', 10]
]);

const scoreOverride = new Map([
  ['ShipGuard AI', 94],
  ['Runbook Decay Detector', 88],
  ['Canary Diff Judge', 87],
  ['Deploy Rehearsal Agent', 86],
  ['Privacy Impact Diff Agent', 84],
  ['Eval Dataset Gardener', 83],
  ['Recovery Confidence Meter', 80],
  ['AI Exploratory Tester', 79],
  ['Blast Radius Agent', 76],
  ['Incident Commander Karaoke', 74]
]);

const verdictOverride = new Map([
  ['ShipGuard AI', 'GO / BUILD NOW'],
  ['Runbook Decay Detector', 'MODULE / WATCH'],
  ['Canary Diff Judge', 'WATCH / MODULE'],
  ['Deploy Rehearsal Agent', 'WATCH / MODULE'],
  ['Privacy Impact Diff Agent', 'WATCH'],
  ['Eval Dataset Gardener', 'WATCH'],
  ['Recovery Confidence Meter', 'WATCH'],
  ['AI Exploratory Tester', 'WATCH'],
  ['Blast Radius Agent', 'MODULE'],
  ['Incident Commander Karaoke', 'KILL-LEANING WATCH']
]);

const decisionRank = (idea) => decisionOrder.get(idea.name) ?? idea.rank;
const ideaScore = (idea) => scoreOverride.get(idea.name) ?? idea.score;
const ideaVerdict = (idea) => verdictOverride.get(idea.name) ?? idea.verdict;
const displayIdeas = [...ideas].sort((a, b) => decisionRank(a) - decisionRank(b));

const rejected = [
  ['Two Minute Triage', '便利だが、上位案に比べると「ログ要約」に見えやすい。ShipGuardのIncidentタブに吸収する方が強い。'],
  ['Cloud Run Traffic Mixer', 'Cloud Runらしさは強いが、自動traffic変更の権限と安全説明が重い。Canary Diff Judgeに統合する。'],
  ['Post Deploy Judge', 'Canary Diff JudgeとRecovery Confidence Meterに近い。単体だと差別化が弱い。'],
  ['Chaos Drill Agent', 'デモ映えはあるが、障害注入の安全設計まで作るには重い。発表品質がぶれやすい。']
];

const sources = [
  ['Official hackathon page', 'https://findy.notion.site/devops-ai-agent-hackathon-2026'],
  ['Google Cloud: Build and deploy an ADK agent to Cloud Run', 'https://docs.cloud.google.com/run/docs/ai/build-and-deploy-ai-agents/deploy-adk-agent'],
  ['Agent Development Kit official site', 'https://adk.dev/'],
  ['GitHub Actions continuous integration docs', 'https://docs.github.com/en/actions/get-started/continuous-integration'],
  ['Local idea bank', 'docs/01_hackathon/idea_recommendations_500_scored.md'],
  ['Local MVP manifest', 'outputs/manifest.json'],
  ['Local startup product audit', 'outputs/STARTUP_PRODUCT_AUDIT_2026-05-25.md']
];

function scoreBar(label, value) {
  return `<div class="score-row"><span>${esc(label)}</span><div class="bar" aria-label="${esc(label)} ${value}"><i style="--w:${value}%"></i></div><b>${value}</b></div>`;
}

function flowSvg(idea) {
  const nodes = [
    [42, 52, 160, idea.input],
    [250, 52, 160, idea.agent],
    [458, 52, 160, idea.output]
  ];
  return `<svg class="mini-flow" viewBox="0 0 660 164" role="img" aria-label="${esc(idea.name)} workflow diagram">
    <title>${esc(idea.name)} workflow</title>
    <defs>
      <marker id="arrow-${idea.rank}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)"></path>
      </marker>
    </defs>
    ${nodes.map(([x, y, w, text], index) => `<g>
      <rect x="${x}" y="${y}" width="${w}" height="60" rx="12" class="flow-node ${index === 1 ? 'agent' : ''}"></rect>
      <text x="${x + 16}" y="${y + 28}" class="flow-label">${esc(text).slice(0, 28)}</text>
      <text x="${x + 16}" y="${y + 46}" class="flow-sub">${index === 0 ? 'Evidence' : index === 1 ? 'Agent' : 'Decision'}</text>
    </g>`).join('')}
    <line x1="202" y1="82" x2="248" y2="82" class="flow-edge" marker-end="url(#arrow-${idea.rank})"></line>
    <line x1="410" y1="82" x2="456" y2="82" class="flow-edge" marker-end="url(#arrow-${idea.rank})"></line>
  </svg>`;
}

function wireframeSvg(idea) {
  return `<svg class="wire" viewBox="0 0 640 360" role="img" aria-label="${esc(idea.name)} MVP screen wireframe">
    <title>${esc(idea.name)} MVP screen</title>
    <rect class="wf-bg" x="20" y="24" width="600" height="312" rx="18"></rect>
    <rect class="wf-head" x="44" y="48" width="552" height="42" rx="10"></rect>
    <text class="wf-title" x="64" y="75">${esc(idea.name)}</text>
    <rect class="wf-panel" x="44" y="112" width="168" height="174" rx="12"></rect>
    <rect class="wf-panel main" x="236" y="112" width="184" height="174" rx="12"></rect>
    <rect class="wf-panel" x="444" y="112" width="152" height="174" rx="12"></rect>
    <rect class="wf-foot" x="44" y="300" width="552" height="18" rx="9"></rect>
    <text class="wf-small" x="60" y="138">${esc(idea.screen[0]).slice(0, 31)}</text>
    <text class="wf-small" x="252" y="138">${esc(idea.screen[1]).slice(0, 30)}</text>
    <text class="wf-small" x="460" y="138">${esc(idea.screen[2]).slice(0, 24)}</text>
    <line class="wf-line" x1="60" y1="158" x2="196" y2="158"></line>
    <line class="wf-line" x1="60" y1="180" x2="178" y2="180"></line>
    <line class="wf-line" x1="252" y1="160" x2="402" y2="160"></line>
    <line class="wf-line" x1="252" y1="184" x2="382" y2="184"></line>
    <circle class="wf-meter" cx="520" cy="204" r="42"></circle>
    <text class="wf-score" x="520" y="210">${ideaScore(idea)}</text>
  </svg>`;
}

function funnelSvg() {
  return `<svg class="wide-svg" viewBox="0 0 980 360" role="img" aria-label="candidate filtering funnel">
    <title>Candidate filtering funnel</title>
    <path class="funnel f1" d="M80 44h820l-80 66H160z"></path>
    <path class="funnel f2" d="M176 124h628l-78 66H254z"></path>
    <path class="funnel f3" d="M270 204h440l-72 66H342z"></path>
    <path class="funnel f4" d="M360 284h260l-54 46H414z"></path>
    <text class="svg-label big" x="490" y="84">500 ideas</text>
    <text class="svg-label" x="490" y="164">20 built candidates</text>
    <text class="svg-label" x="490" y="244">10 decision-ready options</text>
    <text class="svg-label dark" x="490" y="316">Build 1 flagship</text>
    <text class="svg-note" x="104" y="30">Scoring filter: agentic core, DevOps fit, GCP fit, feasibility, demo, differentiation</text>
  </svg>`;
}

function architectureSvg() {
  return `<svg class="wide-svg" viewBox="0 0 1040 430" role="img" aria-label="recommended ShipGuard architecture">
    <title>Recommended flagship architecture</title>
    <defs>
      <marker id="arch-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)"></path>
      </marker>
    </defs>
    <rect class="arch-zone" x="36" y="44" width="234" height="320" rx="18"></rect>
    <rect class="arch-zone z2" x="306" y="44" width="264" height="320" rx="18"></rect>
    <rect class="arch-zone z3" x="606" y="44" width="398" height="320" rx="18"></rect>
    <text class="zone-title" x="58" y="78">Evidence</text>
    <text class="zone-title" x="328" y="78">Agent Brain</text>
    <text class="zone-title" x="628" y="78">Decision UI</text>
    ${['GitHub PR diff', 'Cloud Run canary', 'Past incident notes', 'Runbook state'].map((t, i) => `<rect class="arch-card" x="70" y="${106 + i * 58}" width="168" height="38" rx="10"></rect><text class="arch-text" x="90" y="${131 + i * 58}">${esc(t)}</text>`).join('')}
    ${['Incident Replay Gate', 'Canary Drift Judge', 'Runbook Freshness', 'Human Approval Guard'].map((t, i) => `<rect class="arch-card agent" x="344" y="${106 + i * 58}" width="188" height="38" rx="10"></rect><text class="arch-text" x="364" y="${131 + i * 58}">${esc(t)}</text>`).join('')}
    ${['Verdict: SHIP/WATCH/BLOCK', 'Incident Replay Dossier', 'Runbook patch', 'PR comment + report'].map((t, i) => `<rect class="arch-card out" x="654" y="${106 + i * 58}" width="280" height="38" rx="10"></rect><text class="arch-text" x="674" y="${131 + i * 58}">${esc(t)}</text>`).join('')}
    <line class="arch-line" x1="238" y1="205" x2="344" y2="205" marker-end="url(#arch-arrow)"></line>
    <line class="arch-line" x1="532" y1="205" x2="654" y2="205" marker-end="url(#arch-arrow)"></line>
    <text class="svg-note" x="44" y="398">MVP note: real API integrations can be replaced by fixtures at first; the Cloud Run deployment and Gemini-backed structured decision should be real.</text>
  </svg>`;
}

function ideaCard(idea) {
  const riskItems = idea.risks.map((item) => `<li>${esc(item)}</li>`).join('');
  const nextItems = idea.next.map((item) => `<li>${esc(item)}</li>`).join('');
  const screenItems = idea.screen.map((item) => `<li>${esc(item)}</li>`).join('');
  return `<article class="idea-card" id="idea-${idea.rank}">
    <header class="idea-head">
      <div>
        <p class="eyebrow">Decision Rank ${decisionRank(idea)} / Source Rank ${idea.rank} / ${esc(ideaVerdict(idea))}</p>
        <h3>${esc(idea.name)}</h3>
        <p>${esc(idea.tagline)}</p>
      </div>
      <div class="score-badge"><span>${ideaScore(idea)}</span><small>win score</small></div>
    </header>
    <div class="idea-grid">
      <section class="stack">
        ${flowSvg(idea)}
        <h4>勝ち筋</h4>
        <p>${esc(idea.whyWin)}</p>
        <h4>差別化ポイント</h4>
        <p>${esc(idea.diff)}</p>
        <h4>MVPで作るもの</h4>
        <p>${esc(idea.mvp)}</p>
      </section>
      <section class="stack">
        ${wireframeSvg(idea)}
        <h4>画面構成</h4>
        <ul>${screenItems}</ul>
      </section>
      <section class="stack">
        <div class="metric-box">
          ${scoreBar('尖り', idea.sharp)}
          ${scoreBar('実現性', idea.feasibility)}
          ${scoreBar('GCP必然性', idea.gcp)}
          ${scoreBar('デモ映え', idea.demo)}
        </div>
        <h4>デモ脚本</h4>
        <p>${esc(idea.demoScript)}</p>
        <h4>実装スコープ</h4>
        <p>${esc(idea.scope)}</p>
        <h4>リスク</h4>
        <ul>${riskItems}</ul>
        <h4>48時間の次アクション</h4>
        <ul>${nextItems}</ul>
        <p class="kill"><b>Kill/Watch基準:</b> ${esc(idea.kill)}</p>
        <p class="path-ref">Existing MVP: <code>outputs/${esc(idea.slug)}</code></p>
      </section>
    </div>
  </article>`;
}

const debate = debateSummary();
const css = [
  read(path.join(skillRoot, 'templates', 'core', 'reset.css')),
  read(path.join(skillRoot, 'templates', 'core', 'tokens.css')),
  read(path.join(skillRoot, 'templates', 'core', 'themes.css')),
  read(path.join(skillRoot, 'templates', 'core', 'elements.css')),
  moduleCss('data-table'),
  moduleCss('tabs'),
  moduleCss('callout-box'),
  moduleCss('comparison-grid'),
  `
  :root { color-scheme: light dark; }
  body { background: var(--bg-page); color: var(--text-primary); }
  .hero { padding-block: var(--sp-8) var(--sp-6); border-bottom: 1px solid var(--border-default); }
  .hero-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(280px, .75fr); gap: var(--sp-5); align-items: stretch; }
  .hero-panel, .idea-card, .decision-card, .source-box { border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-card); box-shadow: var(--shadow-sm); }
  .hero-panel { padding: var(--sp-5); }
  .hero h1 { max-width: 13ch; }
  .summary-list { display: grid; gap: var(--sp-3); }
  .summary-list b { color: var(--text-primary); }
  .nav-pills { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin-top: var(--sp-4); }
  .nav-pills a { text-decoration: none; border: 1px solid var(--border-default); border-radius: var(--radius-pill); padding: .45rem .7rem; color: var(--text-secondary); background: var(--bg-muted); font: var(--type-small); }
  .section-title { display: flex; align-items: end; justify-content: space-between; gap: var(--sp-4); margin-bottom: var(--sp-4); }
  .section-title p { max-width: 72ch; margin: 0; color: var(--text-secondary); }
  .decision-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sp-4); }
  .decision-card { padding: var(--sp-4); }
  .decision-card h3 { margin-bottom: var(--sp-2); }
  .decision-card strong { color: var(--accent); }
  .wide-svg, .mini-flow, .wire { display: block; width: 100%; height: auto; border-radius: var(--radius-md); background: var(--bg-muted); }
  .funnel { fill: color-mix(in srgb, var(--accent) 16%, var(--bg-card)); stroke: var(--accent); stroke-width: 1.5; }
  .f2 { fill: color-mix(in srgb, var(--cat-2) 17%, var(--bg-card)); stroke: var(--cat-2); }
  .f3 { fill: color-mix(in srgb, var(--cat-3) 18%, var(--bg-card)); stroke: var(--cat-3); }
  .f4 { fill: var(--accent); stroke: var(--accent); }
  .svg-label { text-anchor: middle; fill: var(--text-primary); font: var(--type-h3); font-weight: 800; }
  .svg-label.big { font: var(--type-h2); }
  .svg-label.dark { fill: var(--on-accent); }
  .svg-note { fill: var(--text-secondary); font: var(--type-caption); }
  .arch-zone { fill: color-mix(in srgb, var(--cat-1) 8%, var(--bg-card)); stroke: var(--cat-1); stroke-width: 1.4; }
  .arch-zone.z2 { fill: color-mix(in srgb, var(--cat-2) 8%, var(--bg-card)); stroke: var(--cat-2); }
  .arch-zone.z3 { fill: color-mix(in srgb, var(--cat-3) 8%, var(--bg-card)); stroke: var(--cat-3); }
  .zone-title { fill: var(--text-primary); font: var(--type-h3); font-weight: 800; }
  .arch-card { fill: var(--bg-card); stroke: var(--border-default); stroke-width: 1.3; }
  .arch-card.agent { stroke: var(--accent); fill: color-mix(in srgb, var(--accent) 9%, var(--bg-card)); }
  .arch-card.out { stroke: var(--cat-3); fill: color-mix(in srgb, var(--cat-3) 9%, var(--bg-card)); }
  .arch-text { fill: var(--text-primary); font: var(--type-small); font-weight: 650; }
  .arch-line, .flow-edge { stroke: var(--text-muted); stroke-width: 2; fill: none; }
  .flow-node { fill: var(--bg-card); stroke: var(--border-default); stroke-width: 1.4; }
  .flow-node.agent { fill: color-mix(in srgb, var(--accent) 10%, var(--bg-card)); stroke: var(--accent); }
  .flow-label { fill: var(--text-primary); font: var(--type-small); font-weight: 750; }
  .flow-sub { fill: var(--text-muted); font: var(--type-caption); text-transform: uppercase; }
  .wf-bg { fill: var(--bg-card); stroke: var(--border-default); stroke-width: 1.5; }
  .wf-head, .wf-foot { fill: color-mix(in srgb, var(--accent) 10%, var(--bg-card)); }
  .wf-panel { fill: var(--bg-muted); stroke: var(--border-default); stroke-width: 1.3; }
  .wf-panel.main { fill: color-mix(in srgb, var(--cat-2) 10%, var(--bg-card)); }
  .wf-title, .wf-small, .wf-score { fill: var(--text-primary); font-family: var(--font-sans); }
  .wf-title { font: var(--type-small); font-weight: 800; }
  .wf-small { font-size: 12px; }
  .wf-line { stroke: var(--text-muted); stroke-width: 4; stroke-linecap: round; opacity: .45; }
  .wf-meter { fill: none; stroke: var(--accent); stroke-width: 8; }
  .wf-score { text-anchor: middle; font-size: 20px; font-weight: 850; }
  .idea-card { padding: var(--sp-5); margin-bottom: var(--sp-5); scroll-margin-top: var(--sp-5); }
  .idea-head { display: flex; justify-content: space-between; gap: var(--sp-4); align-items: start; padding-bottom: var(--sp-4); border-bottom: 1px solid var(--border-default); margin-bottom: var(--sp-4); }
  .idea-head h3 { margin: 0 0 var(--sp-1); font: var(--type-h2); }
  .idea-head p:last-child { color: var(--text-secondary); margin: 0; max-width: 72ch; }
  .score-badge { min-width: 96px; aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; background: var(--accent); color: var(--on-accent); text-align: center; }
  .score-badge span { display: block; font-size: 2rem; line-height: 1; font-weight: 900; }
  .score-badge small { display: block; font: var(--type-caption); color: var(--on-accent); }
  .idea-grid { display: grid; grid-template-columns: 1.05fr 1fr .95fr; gap: var(--sp-4); align-items: start; }
  .idea-grid h4 { margin: var(--sp-2) 0 0; font: var(--type-h4); }
  .idea-grid p, .idea-grid li { color: var(--text-secondary); }
  .idea-grid ul { margin: 0; padding-left: 1.2rem; }
  .metric-box { border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: var(--sp-3); background: var(--bg-muted); display: grid; gap: var(--sp-2); }
  .score-row { display: grid; grid-template-columns: 4.5rem 1fr 2.5rem; gap: var(--sp-2); align-items: center; font: var(--type-small); }
  .bar { height: 10px; border-radius: var(--radius-pill); background: color-mix(in srgb, var(--text-muted) 18%, transparent); overflow: hidden; }
  .bar i { display: block; height: 100%; width: var(--w); background: var(--accent); border-radius: inherit; }
  .kill { border-left: 3px solid var(--accent); padding-left: var(--sp-3); background: color-mix(in srgb, var(--accent) 7%, transparent); }
  .path-ref { font: var(--type-caption); }
  .rank-table td, .rank-table th { vertical-align: top; }
  .data-table { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .data-table table { min-width: 760px; }
  .verdict { display: inline-flex; align-items: center; border-radius: var(--radius-pill); padding: .2rem .55rem; background: color-mix(in srgb, var(--accent) 10%, var(--bg-card)); color: var(--text-primary); border: 1px solid var(--border-default); font: var(--type-caption); font-weight: 800; }
  .callout-local { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--sp-4); }
  .callout-local article { border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: var(--sp-4); background: var(--bg-muted); }
  .source-box { padding: var(--sp-4); }
  .source-box code { white-space: normal; overflow-wrap: anywhere; }
  .source-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-4); }
  .footer-note { color: var(--text-muted); font: var(--type-small); padding-block: var(--sp-5); }
  @media (max-width: 980px) {
    .hero-grid, .idea-grid, .decision-grid, .callout-local, .source-grid { grid-template-columns: 1fr; }
    .hero h1 { max-width: none; }
    .idea-head { flex-direction: column; }
    .score-badge { width: 88px; min-width: 88px; }
  }
  @media print {
    .no-print { display: none !important; }
    .idea-card { break-inside: avoid; }
  }
  `
].join('\n\n');

const rankRows = displayIdeas.map((idea) => `<tr>
  <td>${decisionRank(idea)}<br><small>source ${idea.rank}</small></td>
  <td><b>${esc(idea.name)}</b><br><small>${esc(idea.role)}</small></td>
  <td><span class="verdict">${esc(ideaVerdict(idea))}</span></td>
  <td>${ideaScore(idea)}</td>
  <td>${idea.sharp}</td>
  <td>${idea.feasibility}</td>
  <td>${idea.gcp}</td>
  <td>${idea.demo}</td>
  <td>${esc(idea.diff)}</td>
</tr>`).join('');

const rejectedRows = rejected.map(([name, reason]) => `<tr><td><b>${esc(name)}</b></td><td>${esc(reason)}</td></tr>`).join('');

const html = `<!DOCTYPE html>
<html lang="ja" data-theme="birchline">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="data:,">
<title>DevOps x AI Agent Hackathon Winning Idea Decision Board</title>
<style>${css}</style>
</head>
<body>
<header class="hero">
  <div class="container hero-grid">
    <div>
      <p class="eyebrow">DevOps x AI Agent Hackathon / Decision Artifact / 2026-06-09</p>
      <h1>優勝を狙う10案 Decision Board</h1>
      <p class="lede">500案と既存20個のMVP候補を、尖り、差別化、Google Cloud必然性、MVP現実性、デモ映えで再評価した意思決定資料です。現実性チェック後の結論は、ShipGuard AIを過去障害リプレイ型に絞り、Runbookを証拠モジュールとして内包することです。</p>
      <nav class="nav-pills no-print" aria-label="Jump links">
        <a href="#summary">結論</a>
        <a href="#rubric">評価軸</a>
        <a href="#shortlist">10案比較</a>
        <a href="#details">詳細</a>
        <a href="#mvp-plan">MVP計画</a>
        <a href="#sources">Sources</a>
      </nav>
    </div>
    <aside class="hero-panel">
      <button class="btn-ghost btn-sm no-print" data-theme-toggle aria-label="Toggle theme">Theme</button>
      <div class="summary-list" id="summary">
        <p><b>Build now:</b> ShipGuard AI / Incident Replay Release Gate。Cloud Run canaryが過去障害を再現していないかを人間の承認前に判定する。</p>
        <p><b>Runbookの扱い:</b> 単独プロダクトではなく、過去障害とrollback freshnessを支える証拠モジュールにする。</p>
        <p><b>現実性:</b> 現状の優勝確率は中位だが、過去障害リプレイに絞ると「なぜAIエージェントなのか」が強くなる。</p>
        <p><b>MVP方針:</b> 実API連携の広さより、Incident Replay Dossier、human gate、コピーできる成果物を優先する。</p>
      </div>
    </aside>
  </div>
</header>

<main class="container stack-lg">
  <section aria-labelledby="debate">
    <div class="section-title">
      <div>
        <p class="eyebrow">multi-llm-debate synthesis</p>
        <h2 id="debate">討論からの意思決定</h2>
      </div>
      <p>Status: <code>${esc(debate.status)}</code></p>
    </div>
    <div class="callout-local">
      <article>
        <h3>Proponent</h3>
        <p>${esc(debate.proponent)}</p>
      </article>
      <article>
        <h3>Opponent</h3>
        <p>${esc(debate.opponent)}</p>
      </article>
      <article>
        <h3>Moderator</h3>
        <p>${esc(debate.moderator)}</p>
      </article>
    </div>
  </section>

  <section aria-labelledby="funnel">
    <div class="section-title">
      <div>
        <p class="eyebrow">selection funnel</p>
        <h2 id="funnel">500案から本命1案へ絞る</h2>
      </div>
      <p>上位10案の中でも、単体で優勝を狙う案と、旗艦プロダクトに統合した方が強い案を分けます。</p>
    </div>
    ${funnelSvg()}
  </section>

  <section aria-labelledby="arch">
    <div class="section-title">
      <div>
        <p class="eyebrow">recommended architecture</p>
        <h2 id="arch">ShipGuardを選ぶなら旗艦化する</h2>
      </div>
      <p>ShipGuardを旗艦にし、Canary、Runbook、過去インシデントを「再発していない証拠」として統合します。自動実行ではなく、人間の承認前ゲートとして見せるのが現実的です。</p>
    </div>
    ${architectureSvg()}
  </section>

  <section id="rubric" aria-labelledby="rubric-title">
    <div class="section-title">
      <div>
        <p class="eyebrow">scoring rubric</p>
        <h2 id="rubric-title">評価軸</h2>
      </div>
      <p>既存の500案評価軸をベースに、今回は「尖り」と「単独で審査員に伝わるか」を少し強く見ています。</p>
    </div>
    <div class="decision-grid">
      <article class="decision-card"><h3>勝ち筋</h3><p><strong>AIが判断すること</strong>。要約や検索ではなく、Ship/Block、Promote/Rollback、Add eval/Block model changeのような運用判断を出す。</p></article>
      <article class="decision-card"><h3>差別化</h3><p><strong>既存ツールに見えないこと</strong>。CI可視化、ログ要約、汎用チャットに寄る案は、画面で判断・行動・学習を見せて差別化する。</p></article>
      <article class="decision-card"><h3>実現性</h3><p><strong>fixtureでも価値が出ること</strong>。ハッカソン内では実API連携を全部やらず、構造化判定、Cloud Run公開、コピー可能な成果物を先に完成させる。</p></article>
    </div>
  </section>

  <section id="shortlist" aria-labelledby="shortlist-title">
    <div class="section-title">
      <div>
        <p class="eyebrow">decision matrix</p>
        <h2 id="shortlist-title">10案比較</h2>
      </div>
      <p>GOは単独でMVP着手可。GO AS MODULEは旗艦プロダクトに統合すると強い。WATCHはMVP化できるが、優勝狙いでは見せ方に注意が必要です。</p>
    </div>
    <div class="data-table rank-table">
      <table>
        <thead>
          <tr><th>Rank</th><th>Idea</th><th>Verdict</th><th>Win</th><th>Sharp</th><th>Feasible</th><th>GCP</th><th>Demo</th><th>Differentiation</th></tr>
        </thead>
        <tbody>${rankRows}</tbody>
      </table>
    </div>
  </section>

  <section id="details" aria-labelledby="details-title">
    <div class="section-title">
      <div>
        <p class="eyebrow">idea details</p>
        <h2 id="details-title">各案のMVP判断カード</h2>
      </div>
      <p>各カードは、画面構成、デモ脚本、実装スコープ、弱点、48時間の次アクションまで落としています。</p>
    </div>
    ${displayIdeas.map(ideaCard).join('\n')}
  </section>

  <section id="mvp-plan" aria-labelledby="mvp-plan-title">
    <div class="section-title">
      <div>
        <p class="eyebrow">MVP plan</p>
        <h2 id="mvp-plan-title">最短MVPロードマップ</h2>
      </div>
      <p>最短で勝ち筋を作るなら、ShipGuard AIをIncident Replay Release Gateとして固定し、Runbook Decay Detectorは単独化せず証拠カードと修正文に吸収します。</p>
    </div>
    <div class="decision-grid">
      <article class="decision-card"><h3>Day 0.5</h3><p>Clean replay、Incident echo、Runbook staleの3シナリオを作る。April retry stormの過去障害メモを軸に固定する。</p></article>
      <article class="decision-card"><h3>Day 1</h3><p>Gemini判定JSON schema、否定表現に強いfallback scoring、Incident Replay Dossier、human approval checklistを完成させる。</p></article>
      <article class="decision-card"><h3>Day 2</h3><p>Cloud Runへデプロイし、過去障害再発をBLOCKするデモ、README、スクショ、録画フォールバック、発表用ストーリーを揃える。</p></article>
    </div>
  </section>

  <section aria-labelledby="reject-title">
    <div class="section-title">
      <div>
        <p class="eyebrow">not first build</p>
        <h2 id="reject-title">惜しいが単体本命から外す案</h2>
      </div>
      <p>悪い案ではありません。優勝狙いでは、より強い案へ統合した方が価値が伝わります。</p>
    </div>
    <div class="data-table">
      <table>
        <thead><tr><th>Idea</th><th>Reason</th></tr></thead>
        <tbody>${rejectedRows}</tbody>
      </table>
    </div>
  </section>

  <section id="sources" aria-labelledby="sources-title">
    <div class="section-title">
      <div>
        <p class="eyebrow">evidence baseline</p>
        <h2 id="sources-title">参照ソース</h2>
      </div>
      <p>このHTMLはオフライン単一ファイルにするため、外部URLはリンクではなくテキストとして載せています。</p>
    </div>
    <div class="source-grid">
      ${sources.map(([label, url]) => `<article class="source-box"><h3>${esc(label)}</h3><code>${esc(url)}</code></article>`).join('')}
    </div>
  </section>
</main>

<footer class="container footer-note">
  Generated with the html-artifacts workflow: single offline HTML, inline CSS/JS, inline SVG diagrams, no external CDN.
</footer>
<script>${read(path.join(skillRoot, 'templates', 'core', 'interactions.js'))}</script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log(`wrote ${outPath}`);
