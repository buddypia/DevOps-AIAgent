import type { JudgeAcceptanceMatrix, AcceptanceRow } from "./acceptanceMatrix.js";
import type { WinningAutopilotRun } from "./autopilot.js";
import type { CompetitiveBattlecard } from "./competitiveBattlecard.js";
import type { DemoConcierge } from "./demoConcierge.js";
import type { JudgeCommandCenter } from "./judgeCommandCenter.js";
import type { PilotEconomics } from "./pilotEconomics.js";
import type { ReleaseDriftGuard } from "./releaseDrift.js";
import type { JudgeCriterion, WinningStrategy } from "./strategy.js";

export type PrizeReadiness = "winner-ready" | "finalist-track" | "needs-proof";
export type PrizeCriterionStatus = "winner-ready" | "finalist-track" | "needs-proof";
export type PrizeActionPriority = "now" | "next";

export type PrizeCriterion = {
  id: string;
  label: string;
  targetScore: number;
  currentScore: number;
  delta: number;
  status: PrizeCriterionStatus;
  decisiveProof: string;
  missingProof: string;
  demoMove: string;
  nextAction: string;
};

export type PrizeProofMove = {
  id: string;
  label: string;
  screen: string;
  endpoint: string;
  proof: string;
  score: number;
};

export type PrizePitchStep = {
  id: string;
  timeRange: string;
  screen: string;
  say: string;
  proofMoveId: string;
};

export type PrizeRisk = {
  id: string;
  priority: PrizeActionPriority;
  owner: string;
  risk: string;
  action: string;
  proof: string;
};

export type PrizeStrategyBoard = {
  id: string;
  prizeScore: number;
  readiness: PrizeReadiness;
  headline: string;
  hardTruth: string;
  winHypothesis: string;
  criteria: PrizeCriterion[];
  proofMoves: PrizeProofMove[];
  pitchOrder: PrizePitchStep[];
  risks: PrizeRisk[];
  judgeClose: string;
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

function criterion(strategy: WinningStrategy, id: string): JudgeCriterion | undefined {
  return strategy.judgeCriteria.find((item) => item.id === id);
}

function row(acceptance: JudgeAcceptanceMatrix, id: string): AcceptanceRow | undefined {
  return acceptance.rows.find((item) => item.id === id);
}

function lane(autopilot: WinningAutopilotRun, id: string) {
  return autopilot.lanes.find((item) => item.id === id);
}

function numericMetric(command: JudgeCommandCenter, id: string) {
  const value = command.metrics.find((item) => item.id === id)?.value ?? "0";
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusFor(score: number, target: number): PrizeCriterionStatus {
  if (score >= target) return "winner-ready";
  if (score >= target - 8) return "finalist-track";
  return "needs-proof";
}

function criterionItem(input: {
  id: string;
  label: string;
  targetScore?: number;
  scores: number[];
  decisiveProof: string;
  missingProof: string;
  demoMove: string;
  nextAction: string;
}): PrizeCriterion {
  const targetScore = input.targetScore ?? 92;
  const currentScore = Math.round(clamp(average(input.scores)));
  return {
    id: input.id,
    label: input.label,
    targetScore,
    currentScore,
    delta: Math.max(0, targetScore - currentScore),
    status: statusFor(currentScore, targetScore),
    decisiveProof: input.decisiveProof,
    missingProof: input.missingProof,
    demoMove: input.demoMove,
    nextAction: input.nextAction
  };
}

function readinessFrom(input: {
  prizeScore: number;
  criteria: PrizeCriterion[];
  acceptance: JudgeAcceptanceMatrix;
  command: JudgeCommandCenter;
  autopilot: WinningAutopilotRun;
  releaseDrift?: ReleaseDriftGuard;
}): PrizeReadiness {
  if (input.releaseDrift && input.releaseDrift.verdict !== "release-current") return "needs-proof";
  if (input.criteria.some((item) => item.status === "needs-proof")) return "needs-proof";
  if (
    input.prizeScore >= 92 &&
    input.criteria.every((item) => item.status === "winner-ready") &&
    input.acceptance.verdict === "ready-to-submit" &&
    input.command.readiness === "pitch-ready" &&
    input.autopilot.readiness === "finalist-ready"
  ) {
    return "winner-ready";
  }
  return "finalist-track";
}

function proofMoves(input: {
  baseUrl: string;
  acceptance: JudgeAcceptanceMatrix;
  command: JudgeCommandCenter;
  battlecard: CompetitiveBattlecard;
  demoConcierge?: DemoConcierge;
  pilotEconomics: PilotEconomics;
  releaseDrift?: ReleaseDriftGuard;
}): PrizeProofMove[] {
  const { baseUrl, acceptance, command, battlecard, demoConcierge, pilotEconomics, releaseDrift } = input;
  return [
    ...(demoConcierge
      ? [
          {
            id: "concierge",
            label: "First-click guide",
            screen: "Demo Concierge",
            endpoint: absoluteUrl(baseUrl, "/api/demo-concierge"),
            proof: `${demoConcierge.conciergeScore} concierge score / ${demoConcierge.readiness}`,
            score: demoConcierge.conciergeScore
          }
        ]
      : []),
    {
      id: "command",
      label: "Opening command",
      screen: "Judge Command Center",
      endpoint: absoluteUrl(baseUrl, "/api/judge-command-center"),
      proof: `${command.commandScore} command score / ${command.readiness}`,
      score: command.commandScore
    },
    {
      id: "battlecard",
      label: "Competitive answer",
      screen: "Competitive Battlecard",
      endpoint: absoluteUrl(baseUrl, "/api/competitive-battlecard"),
      proof: `${battlecard.cards.length} competitors / ${battlecard.readiness}`,
      score: battlecard.battleScore
    },
    {
      id: "truth-table",
      label: "MVP truth table",
      screen: "Acceptance Matrix",
      endpoint: absoluteUrl(baseUrl, "/api/acceptance-matrix"),
      proof: `${acceptance.rows.length} rows / ${acceptance.verdict}`,
      score: acceptance.acceptanceScore
    },
    {
      id: "public-release",
      label: "Public release proof",
      screen: "Release Drift Guard",
      endpoint: absoluteUrl(baseUrl, "/api/release-drift"),
      proof: releaseDrift ? `${releaseDrift.observedSkillCount}/${releaseDrift.expectedSkillCount} skills / ${releaseDrift.verdict}` : "Release Drift Guard not checked",
      score: releaseDrift?.driftScore ?? 82
    },
    {
      id: "buyer-value",
      label: "Buyer value proof",
      screen: "Pilot Economics",
      endpoint: absoluteUrl(baseUrl, "/api/pilot-economics"),
      proof: `${pilotEconomics.unitEconomics.paybackDays}d payback / ${pilotEconomics.posture}`,
      score: pilotEconomics.economicsScore
    }
  ];
}

function risks(input: {
  acceptance: JudgeAcceptanceMatrix;
  command: JudgeCommandCenter;
  battlecard: CompetitiveBattlecard;
  criteria: PrizeCriterion[];
  releaseDrift?: ReleaseDriftGuard;
}): PrizeRisk[] {
  const externalRows = input.acceptance.rows.filter((item) => item.area === "submission" && item.status !== "accepted");
  const weakCriteria = input.criteria.filter((item) => item.status !== "winner-ready").sort((left, right) => right.delta - left.delta);
  const releaseRisk =
    input.releaseDrift && input.releaseDrift.verdict !== "release-current"
      ? [
          {
            id: "release-current",
            priority: "now" as const,
            owner: "Cloud Run SRE",
            risk: "公開Cloud Runが最新能力を返していない。",
            action: "Cloud Buildで再デプロイし、Release Drift Guardをrelease-currentに戻す。",
            proof: input.releaseDrift.summary
          }
        ]
      : [];

  return [
    ...releaseRisk,
    ...externalRows.map((item) => ({
      id: item.id,
      priority: "now" as const,
      owner: "Submission owner",
      risk: item.requirement,
      action: item.nextAction,
      proof: item.evidence
    })),
    ...(input.battlecard.readiness === "judge-ready"
      ? []
      : [
          {
            id: "battlecard-proof",
            priority: "next" as const,
            owner: "Gemini Strategist",
            risk: input.battlecard.hardTruth,
            action: "Competitive Battlecardで最弱競合カードを動画内に入れる。",
            proof: input.battlecard.headline
          }
        ]),
    ...weakCriteria.slice(0, 3).map((item) => ({
      id: item.id,
      priority: item.status === "needs-proof" ? ("now" as const) : ("next" as const),
      owner: "A2A Market Broker",
      risk: item.missingProof,
      action: item.nextAction,
      proof: `${item.currentScore}/${item.targetScore}: ${item.decisiveProof}`
    })),
    ...input.command.blockers.slice(0, 2).map((blocker) => ({
      id: `command-${blocker.id}`,
      priority: blocker.priority,
      owner: blocker.owner,
      risk: blocker.proof,
      action: blocker.action,
      proof: "Judge Command Center blocker"
    }))
  ];
}

export function buildPrizeStrategyBoard(input: {
  baseUrl: string;
  strategy: WinningStrategy;
  acceptance: JudgeAcceptanceMatrix;
  autopilot: WinningAutopilotRun;
  command: JudgeCommandCenter;
  battlecard: CompetitiveBattlecard;
  demoConcierge?: DemoConcierge;
  pilotEconomics: PilotEconomics;
  releaseDrift?: ReleaseDriftGuard;
}): PrizeStrategyBoard {
  const { baseUrl, strategy, acceptance, autopilot, command, battlecard, demoConcierge, pilotEconomics, releaseDrift } = input;
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const criteria = [
    criterionItem({
      id: "agent-centrality",
      label: "AI agent centrality",
      scores: [
        criterion(strategy, "agentCentrality")?.score ?? 0,
        row(acceptance, "a2a-agent-center")?.score ?? 0,
        lane(autopilot, "autonomy")?.score ?? 0,
        command.commandScore
      ],
      decisiveProof: "Agent Card、A2A payload、Mission/Autonomy LedgerでAIが判断と委任を担う。",
      missingProof: "AIが価値の中心ではなくダッシュボードに見えるリスク。",
      demoMove: "Agent CardとJudge Command CenterのA2A payloadを最初に開く。",
      nextAction: "Judge Command Centerのopening moveでA2A委任を先頭に話す。"
    }),
    criterionItem({
      id: "approach",
      label: "Problem approach",
      scores: [
        criterion(strategy, "approach")?.score ?? 0,
        row(acceptance, "competitive-swot")?.score ?? 0,
        row(acceptance, "moat-rebuttal")?.score ?? 0,
        battlecard.battleScore,
        demoConcierge?.conciergeScore ?? battlecard.battleScore
      ],
      decisiveProof: "Competitive BattlecardとDemo Conciergeが公式ソース、SWOT、競合反論、録画順を束ねる。",
      missingProof: "ADK/LangGraph/Difyでよいのでは、という質問に飲み込まれるリスク。",
      demoMove: "Demo Conciergeのsubmitter laneからBattlecardを開き、Google ADKまたはA2A Marketplaceへの短い回答を見せる。",
      nextAction: "Demo Conciergeのsubmitter laneを30秒動画の前半に入れる。"
    }),
    criterionItem({
      id: "usability",
      label: "Usability",
      scores: [
        criterion(strategy, "usability")?.score ?? 0,
        row(acceptance, "usability-first-run")?.score ?? 0,
        row(acceptance, "usability-first-run")?.score ?? 0,
        numericMetric(command, "tour"),
        lane(autopilot, "demo")?.score ?? 0,
        command.commandScore,
        demoConcierge?.conciergeScore ?? command.commandScore
      ],
      decisiveProof: "Demo Concierge、Prize Strategy、Judge Command Center、Judge Tourが初見の採点作戦とクリック順を固定する。",
      missingProof: "機能が多く、初見審査員がどこを押すべきか迷うリスク。",
      demoMove: "Demo Conciergeでpersona別のfirst clickを見せ、First 90 secondsのproof buttonsを上から辿る。",
      nextAction: "Prize pitchでは機能一覧を話さず、Demo Conciergeのjudge laneから進める。"
    }),
    criterionItem({
      id: "practicality",
      label: "Practical value",
      scores: [
        criterion(strategy, "practicality")?.score ?? 0,
        row(acceptance, "practical-impact")?.score ?? 0,
        row(acceptance, "pilot-economics")?.score ?? 0,
        pilotEconomics.economicsScore,
        demoConcierge?.conciergeScore ?? pilotEconomics.economicsScore
      ],
      decisiveProof: "Demo Concierge、Impact Case、Pilot Economicsが対象ユーザー、時間短縮、回収日数、買い手反論を示す。",
      missingProof: "面白いが現場価値が薄い、という評価になるリスク。",
      demoMove: "Demo Conciergeのbuyer laneからPilot Economicsのpayback daysとbuyer objectionsを見せる。",
      nextAction: "ProtoPedia本文にDemo Conciergeのbuyer lane、回収日数、対象ユーザー別KPIを入れる。"
    }),
    criterionItem({
      id: "implementation",
      label: "Implementation",
      scores: [
        criterion(strategy, "implementation")?.score ?? 0,
        row(acceptance, "implementation-quality")?.score ?? 0,
        row(acceptance, "live-public-proof")?.score ?? 0,
        row(acceptance, "release-drift")?.score ?? releaseDrift?.driftScore ?? 88,
        row(acceptance, "security-boundary")?.score ?? 0
      ],
      decisiveProof: "Cloud Run、GitHub Actions、Release Drift、Security Reviewで公開運用まで検証できる。",
      missingProof: "ローカルでは動くが提出URLが古い、またはCI証拠が弱いリスク。",
      demoMove: "Release Drift Guardでrelease-currentを見せ、CIリンクを開く。",
      nextAction: "提出直前にRelease Drift GuardとGitHub Actions latest main runを再実行する。"
    })
  ];

  const prizeScore = Math.round(
    clamp(
      average(criteria.map((item) => item.currentScore)) * 0.74 +
        average([acceptance.acceptanceScore, command.commandScore, autopilot.winScore, battlecard.battleScore, pilotEconomics.economicsScore, releaseDrift?.driftScore ?? 88]) * 0.26
    )
  );
  const readiness = readinessFrom({ prizeScore, criteria, acceptance, command, autopilot, releaseDrift });
  const moves = proofMoves({ baseUrl, acceptance, command, battlecard, demoConcierge, pilotEconomics, releaseDrift });
  const riskItems = risks({ acceptance, command, battlecard, criteria, releaseDrift });
  const weakest = [...criteria].sort((left, right) => left.currentScore - right.currentScore)[0];

  return {
    id: `prize-strategy-${prizeScore}-${readiness}`,
    prizeScore,
    readiness,
    headline:
      readiness === "winner-ready"
        ? "優勝を狙う採点作戦まで閉じています。証拠をこの順番で見せれば十分に戦えます。"
        : readiness === "finalist-track"
          ? "本体は最終候補圏です。外部提出URLと最弱採点軸を締めると優勝線に乗ります。"
          : "優勝を狙うには、採点軸のどれかが証拠不足です。先にそこを実装か公開証拠で補強します。",
    hardTruth:
      "MVPは機能数では勝てません。審査5項目それぞれに、何点を取り、どの画面で証明し、どのリスクを正直に残すかを一つの作戦にする必要があります。",
    winHypothesis:
      "勝ち筋は、ADK等の作る基盤と戦わず、AI能力を選び、雇い、A2A委任し、Cloud Run/CI/Release Driftで検収する市場体験を最初の90秒で証明することです。",
    criteria,
    proofMoves: moves,
    pitchOrder: [
      {
        id: "open",
        timeRange: "0-25s",
        screen: demoConcierge ? "Demo Concierge" : "Judge Command Center",
        say: demoConcierge?.singleNextClick ?? command.openingMove,
        proofMoveId: demoConcierge ? "concierge" : "command"
      },
      {
        id: "why-now",
        timeRange: "25-55s",
        screen: "Competitive Battlecard",
        say: battlecard.judgeScript[1] ?? battlecard.headline,
        proofMoveId: "battlecard"
      },
      {
        id: "mvp-truth",
        timeRange: "55-90s",
        screen: "Acceptance Matrix + Release Drift",
        say: `${acceptance.headline} ${releaseDrift?.summary ?? "Release Drift Guardで公開revisionを確認します。"}`,
        proofMoveId: "truth-table"
      },
      {
        id: "buyer-value",
        timeRange: "90-125s",
        screen: "Pilot Economics",
        say: pilotEconomics.verdict,
        proofMoveId: "buyer-value"
      },
      {
        id: "close",
        timeRange: "125-150s",
        screen: "Submission Launch Gate",
        say: "外部URLは未発行ならwatchとして正直に残し、提出直前にsubmit-readyへ封印します。",
        proofMoveId: "public-release"
      }
    ],
    risks: riskItems,
    judgeClose:
      weakest && weakest.delta > 0
        ? `${weakest.label} is the next scoring lever: ${weakest.nextAction}`
        : "All five judging criteria have winner-ready proof; rerun Release Drift and seal the submission URLs before final submission.",
    a2aPayload: {
      method: "message/send",
      skill: "prize.strategy",
      prizeScore,
      readiness,
      criteria: criteria.map((item) => ({
        id: item.id,
        score: item.currentScore,
        target: item.targetScore,
        status: item.status,
        delta: item.delta
      })),
      proofMoves: moves.map((item) => ({ id: item.id, score: item.score, endpoint: item.endpoint })),
      demoConcierge: demoConcierge
        ? {
            score: demoConcierge.conciergeScore,
            readiness: demoConcierge.readiness,
            singleNextClick: demoConcierge.singleNextClick
          }
        : null,
      risks: riskItems.map((item) => ({ id: item.id, priority: item.priority, owner: item.owner })),
      endpoints: {
        app: normalizedBase,
        prizeStrategy: absoluteUrl(normalizedBase, "/api/prize-strategy"),
        demoConcierge: absoluteUrl(normalizedBase, "/api/demo-concierge"),
        judgeCommand: absoluteUrl(normalizedBase, "/api/judge-command-center"),
        competitiveBattlecard: absoluteUrl(normalizedBase, "/api/competitive-battlecard"),
        acceptanceMatrix: absoluteUrl(normalizedBase, "/api/acceptance-matrix"),
        releaseDrift: absoluteUrl(normalizedBase, "/api/release-drift"),
        pilotEconomics: absoluteUrl(normalizedBase, "/api/pilot-economics")
      }
    }
  };
}
