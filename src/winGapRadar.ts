import type { AcceptanceRow, JudgeAcceptanceMatrix } from "./acceptanceMatrix.js";
import type { CompetitiveBattlecard } from "./competitiveBattlecard.js";
import type { FinalistGap, FinalistPanel, FinalistSimulation } from "./finalist.js";
import type { MarketIntelReport } from "./marketIntel.js";
import type { MoatStressScenario, MoatStressTest } from "./moatStress.js";
import type { MvpAuditGate, MvpAuditReport } from "./mvpAudit.js";
import type { PrizeCriterion, PrizeStrategyBoard } from "./prizeStrategy.js";
import type { SubmissionLaunchGate } from "./submissionLaunch.js";
import type { SwotItem, SwotQuadrant, WinningStrategy } from "./strategy.js";

export type WinGapReadiness = "winner-track" | "mvp-gap-watch" | "not-mvp";
export type WinGapStatus = "banked" | "watch" | "close-now";
export type WinGapPriority = "now" | "next" | "later";

export type WinGapSwotSignal = {
  quadrant: SwotQuadrant;
  title: string;
  signal: SwotItem["signal"];
};

export type WinGapLane = {
  id: string;
  label: string;
  status: WinGapStatus;
  priority: WinGapPriority;
  score: number;
  targetScore: number;
  delta: number;
  competitorPressure: string;
  swotSignal: WinGapSwotSignal;
  mvpEvidence: string;
  judgeImpact: string;
  featureHypothesis: string;
  nextAction: string;
  proofUrl: string;
  demoCue: string;
};

export type WinGapFeatureBet = {
  id: string;
  label: string;
  priority: WinGapPriority;
  status: WinGapStatus;
  why: string;
  build: string;
  acceptance: string;
  proofUrl: string;
};

export type WinGapCut = {
  id: string;
  label: string;
  reason: string;
};

export type WinGapRadar = {
  id: string;
  radarScore: number;
  readiness: WinGapReadiness;
  headline: string;
  hardTruth: string;
  mvpDecision: string;
  lanes: WinGapLane[];
  featureBets: WinGapFeatureBet[];
  cutList: WinGapCut[];
  proofScript: string[];
  externalGaps: FinalistGap[];
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function absoluteUrl(baseUrl: string, path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function acceptanceRow(acceptance: JudgeAcceptanceMatrix, id: string): AcceptanceRow | undefined {
  return acceptance.rows.find((row) => row.id === id);
}

function finalistPanel(finalist: FinalistSimulation, id: string): FinalistPanel | undefined {
  return finalist.panels.find((panel) => panel.id === id);
}

function mvpGate(mvpAudit: MvpAuditReport, id: string): MvpAuditGate | undefined {
  return mvpAudit.gates.find((gate) => gate.id === id);
}

function prizeCriterion(prizeStrategy: PrizeStrategyBoard, id: string): PrizeCriterion | undefined {
  return prizeStrategy.criteria.find((criterion) => criterion.id === id);
}

function weakestScenario(moatStress: MoatStressTest): MoatStressScenario | undefined {
  return [...moatStress.scenarios].sort((left, right) => left.score - right.score)[0];
}

function swotSignal(strategy: WinningStrategy, quadrant: SwotQuadrant, fallback: SwotQuadrant = quadrant): WinGapSwotSignal {
  const item = strategy.swot[quadrant][0] ?? strategy.swot[fallback][0] ?? strategy.swot.weaknesses[0];
  return {
    quadrant,
    title: item?.title ?? "SWOT signal missing",
    signal: item?.signal ?? "warning"
  };
}

function laneStatus(input: { score: number; targetScore: number; forcedNow?: boolean }): WinGapStatus {
  if (input.forcedNow || input.score < input.targetScore - 10) return "close-now";
  if (input.score < input.targetScore) return "watch";
  return "banked";
}

function lanePriority(status: WinGapStatus): WinGapPriority {
  if (status === "close-now") return "now";
  if (status === "watch") return "next";
  return "later";
}

function lane(input: {
  id: string;
  label: string;
  scores: number[];
  targetScore?: number;
  competitorPressure: string;
  swotSignal: WinGapSwotSignal;
  mvpEvidence: string;
  judgeImpact: string;
  featureHypothesis: string;
  nextAction: string;
  proofUrl: string;
  demoCue: string;
  forcedNow?: boolean;
}): WinGapLane {
  const targetScore = input.targetScore ?? 90;
  const score = Math.round(clamp(average(input.scores)));
  const status = laneStatus({ score, targetScore, forcedNow: input.forcedNow });
  return {
    id: input.id,
    label: input.label,
    status,
    priority: lanePriority(status),
    score,
    targetScore,
    delta: Math.max(0, targetScore - score),
    competitorPressure: input.competitorPressure,
    swotSignal: input.swotSignal,
    mvpEvidence: input.mvpEvidence,
    judgeImpact: input.judgeImpact,
    featureHypothesis: input.featureHypothesis,
    nextAction: input.nextAction,
    proofUrl: input.proofUrl,
    demoCue: input.demoCue
  };
}

function externalUrlGaps(finalist: FinalistSimulation, launchGate: SubmissionLaunchGate) {
  const finalistExternal = finalist.gaps.filter((gap) => gap.severity === "external");
  const launchMissing = launchGate.urlStatuses
    .filter((status) => status.status !== "ready")
    .map((status) => ({
      id: status.id.replace(/-url$/, ""),
      label: status.label,
      severity: "external" as const,
      owner: "Submission owner",
      action: status.action,
      proof: status.proof
    }));
  const seen = new Set<string>();
  return [...finalistExternal, ...launchMissing].filter((gap) => {
    if (seen.has(gap.id)) return false;
    seen.add(gap.id);
    return true;
  });
}

function featureBetStatus(priority: WinGapPriority, blocked: boolean): WinGapStatus {
  if (blocked || priority === "now") return "close-now";
  if (priority === "next") return "watch";
  return "banked";
}

export function buildWinGapRadar(input: {
  baseUrl: string;
  strategy: WinningStrategy;
  marketIntel: MarketIntelReport;
  moatStress: MoatStressTest;
  battlecard: CompetitiveBattlecard;
  mvpAudit: MvpAuditReport;
  finalist: FinalistSimulation;
  acceptance: JudgeAcceptanceMatrix;
  prizeStrategy: PrizeStrategyBoard;
  submissionLaunch: SubmissionLaunchGate;
}): WinGapRadar {
  const base = input.baseUrl.replace(/\/$/, "");
  const weakestBattlecard = [...input.battlecard.cards].sort((left, right) => left.score - right.score)[0];
  const weakestMoat = weakestScenario(input.moatStress);
  const externalGaps = externalUrlGaps(input.finalist, input.submissionLaunch);
  const submissionRow = acceptanceRow(input.acceptance, "submission-assets");
  const receiptRow = acceptanceRow(input.acceptance, "demo-receipt");
  const releaseRow = acceptanceRow(input.acceptance, "release-drift");

  const lanes = [
    lane({
      id: "agent-centrality",
      label: "AI agent centrality",
      scores: [
        input.strategy.judgeCriteria.find((criterion) => criterion.id === "agentCentrality")?.score ?? 0,
        acceptanceRow(input.acceptance, "a2a-agent-center")?.score ?? 0,
        finalistPanel(input.finalist, "agent-centrality")?.score ?? 0,
        prizeCriterion(input.prizeStrategy, "agent-centrality")?.currentScore ?? 0
      ],
      competitorPressure: "ADKやCrewAIに比べて、AIがただの画面部品に見えると負ける。",
      swotSignal: swotSignal(input.strategy, "strengths"),
      mvpEvidence: mvpGate(input.mvpAudit, "a2a-core")?.evidence ?? "Agent Card/A2A evidence missing.",
      judgeImpact: "審査基準1の中心。Agent Card、契約、A2A委任、Autonomy Ledgerを先頭に出す。",
      featureHypothesis: "A2A委任を証拠化する操作ログを最初のクリックに固定する。",
      nextAction: prizeCriterion(input.prizeStrategy, "agent-centrality")?.nextAction ?? "Agent CardとA2A payloadを先頭で見せる。",
      proofUrl: absoluteUrl(base, "/.well-known/agent-card.json"),
      demoCue: "Judge Command Center -> Agent Card -> A2A payload"
    }),
    lane({
      id: "approach-moat",
      label: "Competitive approach",
      scores: [
        input.marketIntel.marketScore,
        input.moatStress.stressScore,
        input.battlecard.battleScore,
        acceptanceRow(input.acceptance, "competitive-swot")?.score ?? 0,
        prizeCriterion(input.prizeStrategy, "approach")?.currentScore ?? 0
      ],
      competitorPressure:
        weakestBattlecard
          ? `${weakestBattlecard.competitor}: ${weakestBattlecard.judgeQuestion} 代替リスクとしてsource、SWOT、proof routeを先に開く。`
          : weakestMoat?.objection ?? "競合との差分が薄く見える。",
      swotSignal: swotSignal(input.strategy, "threats"),
      mvpEvidence: acceptanceRow(input.acceptance, "competitive-swot")?.evidence ?? input.battlecard.thesis,
      judgeImpact: "審査基準2。競合の強みを認めた上で、作る基盤ではなく調達体験へずらす。",
      featureHypothesis: "競合質問を受けた瞬間に、source、SWOT、proof routeを一行で返す。",
      nextAction: weakestBattlecard?.proofRoute ?? weakestMoat?.proofToShow ?? "Competitive Battlecardを録画導線へ入れる。",
      proofUrl: absoluteUrl(base, "/api/competitive-battlecard"),
      demoCue: "Demo Concierge submitter lane -> Competitive Battlecard"
    }),
    lane({
      id: "usability-first-run",
      label: "First-run usability",
      scores: [
        acceptanceRow(input.acceptance, "usability-first-run")?.score ?? 0,
        finalistPanel(input.finalist, "usability")?.score ?? 0,
        prizeCriterion(input.prizeStrategy, "usability")?.currentScore ?? 0
      ],
      competitorPressure: "DifyやGoogle Marketplaceより迷う導線だと、初見の体験価値で負ける。",
      swotSignal: swotSignal(input.strategy, "weaknesses"),
      mvpEvidence: acceptanceRow(input.acceptance, "usability-first-run")?.evidence ?? "User Pilot evidence missing.",
      judgeImpact: "審査基準3。機能数ではなく、最初の1クリックで価値へ到達させる。",
      featureHypothesis: "審査員、買い手、提出者ごとのfirst clickを常時見える場所へ置く。",
      nextAction: prizeCriterion(input.prizeStrategy, "usability")?.nextAction ?? "Demo Conciergeから審査導線を始める。",
      proofUrl: absoluteUrl(base, "/api/demo-concierge"),
      demoCue: "Demo Concierge -> Judge lane -> First 90 seconds"
    }),
    lane({
      id: "practical-value",
      label: "Practical value",
      scores: [
        acceptanceRow(input.acceptance, "practical-impact")?.score ?? 0,
        acceptanceRow(input.acceptance, "pilot-economics")?.score ?? 0,
        finalistPanel(input.finalist, "practicality")?.score ?? 0,
        prizeCriterion(input.prizeStrategy, "practicality")?.currentScore ?? 0
      ],
      competitorPressure: "AgentOpsやLangSmithに比べて、運用後の実利が弱いと実用性で落ちる。",
      swotSignal: swotSignal(input.strategy, "opportunities"),
      mvpEvidence: acceptanceRow(input.acceptance, "pilot-economics")?.evidence ?? "Pilot Economics evidence missing.",
      judgeImpact: "審査基準4。対象ユーザー、削減時間、payback、買い手反論を同じ画面で示す。",
      featureHypothesis: "buyer laneを前に出し、導入費用と回収日数を審査員の実用性質問へ直結させる。",
      nextAction: prizeCriterion(input.prizeStrategy, "practicality")?.nextAction ?? "Pilot EconomicsをProtoPedia本文に入れる。",
      proofUrl: absoluteUrl(base, "/api/pilot-economics"),
      demoCue: "Demo Concierge buyer lane -> Pilot Economics -> Impact Case"
    }),
    lane({
      id: "implementation-proof",
      label: "Implementation proof",
      scores: [
        acceptanceRow(input.acceptance, "implementation-quality")?.score ?? 0,
        acceptanceRow(input.acceptance, "live-public-proof")?.score ?? 0,
        releaseRow?.score ?? 88,
        finalistPanel(input.finalist, "implementation")?.score ?? 0,
        prizeCriterion(input.prizeStrategy, "implementation")?.currentScore ?? 0
      ],
      competitorPressure: "ADKやGoogle Cloud公式基盤に対し、公開Cloud Run/CI/A2A証拠が弱いと実装力で負ける。",
      swotSignal: swotSignal(input.strategy, "strengths", "opportunities"),
      mvpEvidence: acceptanceRow(input.acceptance, "implementation-quality")?.evidence ?? "Implementation proof missing.",
      judgeImpact: "審査基準5。CI、Release Drift、Security Reviewで公開URLの最新性まで検収する。",
      featureHypothesis: "提出前に最新Cloud Run revisionとskill surfaceを一発で再検証する。",
      nextAction: prizeCriterion(input.prizeStrategy, "implementation")?.nextAction ?? "Release Drift GuardとCIを再実行する。",
      proofUrl: absoluteUrl(base, "/api/release-drift"),
      demoCue: "Release Drift Guard -> Judge Proof -> GitHub Actions"
    }),
    lane({
      id: "submission-closeout",
      label: "External submission closeout",
      scores: [
        submissionRow?.score ?? 0,
        receiptRow?.score ?? 0,
        input.submissionLaunch.launchScore,
        input.finalist.finalistScore
      ],
      targetScore: 88,
      competitorPressure: "提出URLが未発行なら、どれだけ本体が良くても審査対象として閉じない。",
      swotSignal: swotSignal(input.strategy, "weaknesses"),
      mvpEvidence: `${submissionRow?.evidence ?? "submission row missing"} / ${input.submissionLaunch.readiness}`,
      judgeImpact: "提出3点とProtoPedia必須要件。ここは機能追加ではなく外部作業を閉じるゲート。",
      featureHypothesis: "ProtoPedia本文、動画録画、URL貼付、receipt封印を一画面で進めるcloseout workbenchを作る。",
      nextAction: externalGaps[0]?.action ?? input.submissionLaunch.verdict,
      proofUrl: absoluteUrl(base, "/api/submission-launch"),
      demoCue: "Submission Dossier -> Submission Launch Gate -> Demo Receipt",
      forcedNow: externalGaps.length > 0
    })
  ];

  const featureBets: WinGapFeatureBet[] = [
    {
      id: "submission-closeout",
      label: "Submission Closeout Workbench",
      priority: externalGaps.length > 0 ? "now" : "later",
      status: featureBetStatus(externalGaps.length > 0 ? "now" : "later", externalGaps.length > 0),
      why:
        externalGaps.length > 0
          ? `${externalGaps.map((gap) => gap.label).join(" / ")} が未登録で、finalistをborderlineにしている。`
          : "外部URLは揃っているため、提出前の再確認に使う。",
      build: "ProtoPedia貼付フィールド、30秒動画章立て、URL validation、receipt sealを1つの作業台に束ねる。",
      acceptance: "ProtoPedia URLと動画URLがvalidになり、Submission Launch Gateがsubmit-readyを返す。",
      proofUrl: absoluteUrl(base, "/api/submission-launch")
    },
    {
      id: "competitor-answer-replay",
      label: "Competitor Answer Replay",
      priority: input.battlecard.readiness === "judge-ready" ? "later" : "next",
      status: featureBetStatus(input.battlecard.readiness === "judge-ready" ? "later" : "next", false),
      why: weakestBattlecard
        ? `${weakestBattlecard.competitor} への回答が最弱の競合圧。`
        : "競合反論を録画で飛ばすと、既存ツールとの差分が薄く見える。",
      build: "最弱競合カードを選び、source、SWOT、短い回答、proof routeを30秒リールに差し込む。",
      acceptance: "Competitive Battlecardの最弱カードがleadまたはjudge-readyになり、Demo Conciergeのsubmitter laneに出る。",
      proofUrl: absoluteUrl(base, "/api/competitive-battlecard")
    },
    {
      id: "buyer-proof-forward",
      label: "Buyer Proof Forward",
      priority: (acceptanceRow(input.acceptance, "pilot-economics")?.status ?? "watch") === "accepted" ? "later" : "next",
      status: featureBetStatus((acceptanceRow(input.acceptance, "pilot-economics")?.status ?? "watch") === "accepted" ? "later" : "next", false),
      why: "実用性は“便利そう”では足りず、導入費用と回収日数を先に見せる必要がある。",
      build: "買い手導線をDemo Conciergeの上位に置き、Pilot EconomicsとImpact Caseを1クリックで開く。",
      acceptance: "Pilot Economicsがinvestment-readyで、buyer objectionsが全てaccepted/watch以下になる。",
      proofUrl: absoluteUrl(base, "/api/pilot-economics")
    }
  ];

  const laneAverage = average(lanes.map((item) => item.score));
  const externalPenalty = externalGaps.length * 3;
  const radarScore = Math.round(
    clamp(
      average([
        input.prizeStrategy.prizeScore,
        input.acceptance.acceptanceScore,
        input.battlecard.battleScore,
        input.mvpAudit.mvpScore,
        input.finalist.finalistScore,
        laneAverage
      ]) - externalPenalty
    )
  );
  const nonExternalCloseNow = lanes.some((item) => item.status === "close-now" && item.id !== "submission-closeout");
  const readiness: WinGapReadiness =
    radarScore >= 90 && externalGaps.length === 0 && lanes.every((item) => item.status === "banked")
      ? "winner-track"
      : nonExternalCloseNow || input.mvpAudit.band === "not-mvp"
        ? "not-mvp"
        : "mvp-gap-watch";
  const weakestLane = [...lanes].sort((left, right) => right.delta - left.delta)[0];

  return {
    id: `win-gap-radar-${radarScore}-${readiness}`,
    radarScore,
    readiness,
    headline:
      readiness === "winner-track"
        ? "競合、SWOT、MVP、提出ゲートが優勝線で接続されています。"
        : readiness === "mvp-gap-watch"
          ? "MVP本体は戦えます。勝ち切るには外部提出と最弱レーンを順に閉じます。"
          : "MVPとして押し出す前に、競合または実装証拠のclose-nowレーンを直してください。",
    hardTruth:
      "機能数を増やしても勝てません。競合に負ける角度、SWOTの弱み、審査5項目、提出URLを同じbacklogに変換し、証拠で閉じる必要があります。",
    mvpDecision:
      externalGaps.length > 0
        ? "コード側のMVPはcredible。ただしProtoPedia作品URLと動画URLが揃うまで、submit-readyやfinalist-readyとは呼ばない。"
        : weakestLane?.status === "banked"
          ? "新機能を増やすより、公開証拠の再実行と録画品質に集中する。"
          : `${weakestLane.label}を先に閉じる。${weakestLane.nextAction}`,
    lanes,
    featureBets,
    cutList: [
      {
        id: "full-workflow-builder",
        label: "汎用ワークフロービルダー",
        reason: "Dify/LangGraphが強い領域。今は能力調達と審査証拠に集中する。"
      },
      {
        id: "marketplace-payments",
        label: "本番決済・販売導線",
        reason: "Google Cloud Marketplaceが強い領域。ハッカソンMVPでは買う前の意思決定を証明する。"
      },
      {
        id: "enterprise-auth",
        label: "大規模OAuth/組織管理",
        reason: "公開デモの信頼境界はSecurity Reviewで足りる。提出前は外部URLと証拠を優先する。"
      }
    ],
    proofScript: [
      "Demo Conciergeで最初のクリックを固定する。",
      "Competitive Battlecardで最弱競合への短い回答、source、SWOTを見せる。",
      "Win Gap Radarで、MVP不足をfeature betsとcut listへ変換したことを見せる。",
      "Acceptance MatrixとRelease Driftで公開Cloud Runの検収を通す。",
      "Submission Launch Gateで外部URLの状態を正直に示す。"
    ],
    externalGaps,
    a2aPayload: {
      method: "message/send",
      skill: "win.gap.radar",
      radarScore,
      readiness,
      mvpDecision:
        externalGaps.length > 0
          ? "external-submission-closeout-required"
          : readiness === "winner-track"
            ? "proof-and-recording"
            : "close-weakest-lane",
      lanes: lanes.map((item) => ({
        id: item.id,
        status: item.status,
        score: item.score,
        delta: item.delta,
        priority: item.priority
      })),
      featureBets: featureBets.map((item) => ({
        id: item.id,
        priority: item.priority,
        status: item.status,
        acceptance: item.acceptance
      })),
      externalGaps: externalGaps.map((gap) => ({ id: gap.id, label: gap.label, action: gap.action })),
      endpoints: {
        app: base,
        winGapRadar: absoluteUrl(base, "/api/win-gap-radar"),
        competitiveBattlecard: absoluteUrl(base, "/api/competitive-battlecard"),
        acceptanceMatrix: absoluteUrl(base, "/api/acceptance-matrix"),
        prizeStrategy: absoluteUrl(base, "/api/prize-strategy"),
        submissionLaunch: absoluteUrl(base, "/api/submission-launch")
      }
    }
  };
}
