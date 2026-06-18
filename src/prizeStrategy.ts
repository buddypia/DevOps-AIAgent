import type { JudgeAcceptanceMatrix, AcceptanceRow } from "./acceptanceMatrix.js";
import type { WinningAutopilotRun } from "./autopilot.js";
import type { CompetitiveBattlecard } from "./competitiveBattlecard.js";
import type { DemoConcierge } from "./demoConcierge.js";
import type { JudgeCommandCenter } from "./judgeCommandCenter.js";
import { observabilityProofScore, type ObservabilityOracle } from "./observabilityOracle.js";
import type { PilotEconomics } from "./pilotEconomics.js";
import type { ReleaseDriftGuard } from "./releaseDrift.js";
import type { JudgeCriterion, WinningStrategy } from "./strategy.js";

export type PrizeReadiness = "winner-ready" | "finalist-track" | "needs-proof";
export type PrizeCriterionStatus = "winner-ready" | "finalist-track" | "needs-proof";
export type PrizeActionPriority = "now" | "next";
export type PrizeUsabilityLockStatus = "sealed" | "watch" | "missing";
export type PrizeUsabilityLockReadiness = "usability-locked" | "usability-external-watch" | "needs-usability-proof";
export type PrizeCriteriaLockStatus = "sealed" | "watch" | "missing";
export type PrizeCriteriaLockReadiness = "criteria-locked" | "criteria-external-watch" | "needs-criteria-proof";

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

export type PrizeUsabilityLockCheck = {
  id: string;
  label: string;
  status: PrizeUsabilityLockStatus;
  score: number;
  proof: string;
  evidenceUrl: string;
};

export type PrizeUsabilityLock = {
  id: string;
  lockScore: number;
  internalScore: number;
  readiness: PrizeUsabilityLockReadiness;
  sealedCount: number;
  watchCount: number;
  missingCount: number;
  operatorLine: string;
  oneMinutePath: string[];
  checks: PrizeUsabilityLockCheck[];
};

export type PrizeCriteriaLockCheck = {
  id: string;
  criterionId: string;
  label: string;
  status: PrizeCriteriaLockStatus;
  score: number;
  proof: string;
  evidenceUrl: string;
};

export type PrizeCriteriaLock = {
  id: string;
  lockScore: number;
  internalScore: number;
  readiness: PrizeCriteriaLockReadiness;
  sealedCount: number;
  watchCount: number;
  missingCount: number;
  operatorLine: string;
  checks: PrizeCriteriaLockCheck[];
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
  usabilityLock?: PrizeUsabilityLock;
  criteriaLock?: PrizeCriteriaLock;
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

function usabilityLockScore(status: PrizeUsabilityLockStatus) {
  if (status === "sealed") return 100;
  if (status === "watch") return 88;
  return 20;
}

function criteriaLockScore(status: PrizeCriteriaLockStatus) {
  if (status === "sealed") return 100;
  if (status === "watch") return 88;
  return 20;
}

function usabilityLockCheck(input: Omit<PrizeUsabilityLockCheck, "score"> & { score?: number }): PrizeUsabilityLockCheck {
  return {
    ...input,
    score: Math.round(clamp(input.score ?? usabilityLockScore(input.status)))
  };
}

function criteriaLockCheck(input: Omit<PrizeCriteriaLockCheck, "score"> & { score?: number }): PrizeCriteriaLockCheck {
  return {
    ...input,
    score: Math.round(clamp(input.score ?? criteriaLockScore(input.status)))
  };
}

function criteriaLockValue(lock: PrizeCriteriaLock | undefined, criterionId: string) {
  return lock?.checks.find((check) => check.criterionId === criterionId)?.score ?? 0;
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
  usabilityLock?: PrizeUsabilityLock;
  criteriaLock?: PrizeCriteriaLock;
  pilotEconomics: PilotEconomics;
  observabilityOracle?: ObservabilityOracle;
  releaseDrift?: ReleaseDriftGuard;
}): PrizeProofMove[] {
  const { baseUrl, acceptance, command, battlecard, demoConcierge, usabilityLock, criteriaLock, pilotEconomics, observabilityOracle, releaseDrift } = input;
  const oracleScore = observabilityOracle ? observabilityProofScore(observabilityOracle) : undefined;
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
          },
          {
            id: "route-lock",
            label: "Judge route lock",
            screen: "Demo Concierge",
            endpoint: absoluteUrl(baseUrl, "/api/demo-concierge"),
            proof: `${demoConcierge.routeLock.lockScore} route lock / ${demoConcierge.routeLock.readiness}`,
            score: demoConcierge.routeLock.lockScore
          },
          ...(usabilityLock
            ? [
                {
                  id: "usability-lock",
                  label: "Prize usability lock",
                  screen: "Prize Strategy Board",
                  endpoint: absoluteUrl(baseUrl, "/api/prize-strategy"),
                  proof: `${usabilityLock.internalScore} internal usability / ${usabilityLock.readiness}`,
                  score: usabilityLock.internalScore
                }
              ]
            : [])
        ]
      : []),
    ...(criteriaLock
      ? [
          {
            id: "criteria-lock",
            label: "Five-criterion proof lock",
            screen: "Prize Strategy Board",
            endpoint: absoluteUrl(baseUrl, "/api/prize-strategy"),
            proof: `${criteriaLock.internalScore} internal criteria / ${criteriaLock.readiness}`,
            score: criteriaLock.internalScore
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
      id: "objection-replay",
      label: "Objection replay",
      screen: "Competitive Battlecard",
      endpoint: absoluteUrl(baseUrl, "/api/competitive-battlecard"),
      proof: `${battlecard.objectionReplay.replayScore} replay / ${battlecard.objectionReplay.weakestCompetitor}`,
      score: battlecard.objectionReplay.replayScore
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
    ...(observabilityOracle && oracleScore !== undefined
      ? [
          {
            id: "operations-value",
            label: "Operational value proof",
            screen: "Observability Oracle",
            endpoint: absoluteUrl(baseUrl, "/api/observability-oracle"),
            proof: `${oracleScore} operational buyer proof / ${observabilityOracle.readiness}`,
            score: oracleScore
          }
        ]
      : []),
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

function buildUsabilityLock(input: {
  baseUrl: string;
  acceptance: JudgeAcceptanceMatrix;
  command: JudgeCommandCenter;
  demoConcierge?: DemoConcierge;
}): PrizeUsabilityLock | undefined {
  if (!input.demoConcierge) return undefined;

  const normalizedBase = input.baseUrl.replace(/\/$/, "");
  const { demoConcierge, acceptance, command } = input;
  const externalWatchCount = acceptance.rows.filter((item) => item.area === "submission" && item.status !== "accepted").length;
  const routeBlocked = demoConcierge.routeLock.lockedSteps.some((step) => step.status === "blocked");
  const checks = [
    usabilityLockCheck({
      id: "single-first-click",
      label: "Single first click",
      status: demoConcierge.singleNextClick.length >= 20 ? "sealed" : "watch",
      proof: demoConcierge.singleNextClick,
      evidenceUrl: absoluteUrl(normalizedBase, "/api/demo-concierge")
    }),
    usabilityLockCheck({
      id: "route-lock",
      label: "90-second route lock",
      status:
        routeBlocked || demoConcierge.routeLock.lockScore < 88
          ? "missing"
          : demoConcierge.routeLock.lockScore >= 92
            ? "sealed"
            : "watch",
      proof: `${demoConcierge.routeLock.lockScore} route lock / ${demoConcierge.routeLock.lockedSteps.length} proof steps.`,
      evidenceUrl: absoluteUrl(normalizedBase, "/api/demo-concierge")
    }),
    usabilityLockCheck({
      id: "proof-url-coverage",
      label: "Proof URL coverage",
      status: demoConcierge.routeLock.proofLinkScore >= 100 ? "sealed" : demoConcierge.routeLock.proofLinkScore >= 88 ? "watch" : "missing",
      proof: `${demoConcierge.routeLock.proofLinkScore} proof-link score.`,
      evidenceUrl: absoluteUrl(normalizedBase, "/api/demo-concierge")
    }),
    usabilityLockCheck({
      id: "focus-path",
      label: "First-run focus path",
      status:
        demoConcierge.focusLock.blockedCount > 0
          ? "missing"
          : demoConcierge.focusLock.oneMinutePath.length >= 4 && demoConcierge.focusLock.focusScore >= 92
            ? "sealed"
            : "watch",
      proof: `${demoConcierge.focusLock.focusScore} focus score; ${demoConcierge.focusLock.oneMinutePath.join(" -> ")}.`,
      evidenceUrl: absoluteUrl(normalizedBase, "/api/demo-concierge")
    }),
    usabilityLockCheck({
      id: "persona-lanes",
      label: "Persona lane coverage",
      status:
        demoConcierge.lanes.length >= 3 && demoConcierge.lanes.every((lane) => lane.steps.length >= 2)
          ? "sealed"
          : demoConcierge.lanes.length >= 2
            ? "watch"
            : "missing",
      proof: demoConcierge.lanes.map((lane) => `${lane.persona}:${lane.firstClick}`).join(" / "),
      evidenceUrl: absoluteUrl(normalizedBase, "/api/demo-concierge")
    }),
    usabilityLockCheck({
      id: "opening-command",
      label: "Opening command ready",
      status: command.commandScore >= 88 && command.openingMove.length >= 20 ? "sealed" : command.commandScore >= 80 ? "watch" : "missing",
      proof: `${command.commandScore} command score; ${command.openingMove}`,
      evidenceUrl: absoluteUrl(normalizedBase, "/api/judge-command-center")
    }),
    usabilityLockCheck({
      id: "external-gap-honesty",
      label: "External gap honesty",
      status: acceptance.verdict === "not-accepted" ? "missing" : externalWatchCount > 0 ? "watch" : "sealed",
      proof:
        externalWatchCount > 0
          ? `${externalWatchCount} submission rows remain visible as watch.`
          : "No external submission watch rows remain.",
      evidenceUrl: absoluteUrl(normalizedBase, "/api/acceptance-matrix")
    })
  ];
  const nonExternalChecks = checks.filter((check) => check.id !== "external-gap-honesty");
  const sealedCount = checks.filter((check) => check.status === "sealed").length;
  const watchCount = checks.filter((check) => check.status === "watch").length;
  const missingCount = checks.filter((check) => check.status === "missing").length;
  const internalScore = Math.round(clamp(average(nonExternalChecks.map((check) => check.score))));
  const lockScore = Math.round(clamp(average(checks.map((check) => check.score))));
  const nonExternalSealed = nonExternalChecks.every((check) => check.status === "sealed");
  const readiness: PrizeUsabilityLockReadiness =
    missingCount > 0 || !nonExternalSealed
      ? "needs-usability-proof"
      : externalWatchCount > 0
        ? "usability-external-watch"
        : "usability-locked";

  return {
    id: `prize-usability-lock-${lockScore}-${readiness}`,
    lockScore,
    internalScore,
    readiness,
    sealedCount,
    watchCount,
    missingCount,
    operatorLine:
      readiness === "usability-locked"
        ? "First-click route, focus path, proof URLs, and submission truth are locked for the prize pitch."
        : readiness === "usability-external-watch"
          ? "First-run usability is internally locked; only external submission URL watch rows remain visible."
          : "The first-run path still needs a route, focus, or proof-link fix before it can carry the prize pitch.",
    oneMinutePath: demoConcierge.focusLock.oneMinutePath,
    checks
  };
}

function buildCriteriaLock(input: {
  baseUrl: string;
  acceptance: JudgeAcceptanceMatrix;
  autopilot: WinningAutopilotRun;
  command: JudgeCommandCenter;
  battlecard: CompetitiveBattlecard;
  usabilityLock?: PrizeUsabilityLock;
  pilotEconomics: PilotEconomics;
  observabilityOracle?: ObservabilityOracle;
  releaseDrift?: ReleaseDriftGuard;
}): PrizeCriteriaLock {
  const normalizedBase = input.baseUrl.replace(/\/$/, "");
  const { acceptance, autopilot, command, battlecard, usabilityLock, pilotEconomics, observabilityOracle, releaseDrift } = input;
  const oracleScore = observabilityOracle ? observabilityProofScore(observabilityOracle) : undefined;
  const externalWatchCount = acceptance.rows.filter((item) => item.area === "submission" && item.status !== "accepted").length;
  const agentScore = Math.round(
    clamp(
      average([
        row(acceptance, "a2a-agent-center")?.score ?? 0,
        lane(autopilot, "autonomy")?.score ?? 0,
        command.commandScore
      ])
    )
  );
  const approachSourceCount = battlecard.proofLock.coverage.sourceUrlCount;
  const approachSwotCount = battlecard.proofLock.coverage.swotLinkCount;
  const practicalityReady =
    pilotEconomics.economicsScore >= 90 &&
    pilotEconomics.unitEconomics.paybackDays <= 30 &&
    (pilotEconomics.evidenceLock.readiness === "buyer-ready" || pilotEconomics.evidenceLock.readiness === "pilot-locked") &&
    (oracleScore ?? pilotEconomics.economicsScore) >= 90;
  const publicReleaseCurrent =
    releaseDrift?.verdict === "release-current" &&
    releaseDrift.driftScore >= 96 &&
    releaseDrift.observedSkillCount >= releaseDrift.expectedSkillCount;
  const implementationReady =
    publicReleaseCurrent ||
    ((row(acceptance, "release-drift")?.score ?? 0) >= 90 &&
      (row(acceptance, "live-public-proof")?.score ?? 0) >= 90 &&
      (row(acceptance, "security-boundary")?.score ?? 0) >= 88);
  const checks = [
    criteriaLockCheck({
      id: "agent-centrality-proof",
      criterionId: "agent-centrality",
      label: "AI is the actor, not decoration",
      status:
        agentScore >= 90 && (row(acceptance, "a2a-agent-center")?.score ?? 0) >= 90 && command.commandScore >= 88
          ? "sealed"
          : agentScore >= 84
            ? "watch"
            : "missing",
      proof: `${agentScore} blended A2A/autonomy/command proof; ${command.openingMove}`,
      evidenceUrl: absoluteUrl(normalizedBase, "/api/judge-command-center")
    }),
    criteriaLockCheck({
      id: "approach-proof",
      criterionId: "approach",
      label: "Competitive/SWOT answer is rehearsed",
      status:
        battlecard.proofLock.proofScore >= 92 &&
        battlecard.objectionReplay.replayScore >= 92 &&
        approachSourceCount >= 10 &&
        approachSwotCount >= 12
          ? "sealed"
          : battlecard.proofLock.readiness === "needs-counterproof" || battlecard.objectionReplay.readiness === "needs-counterproof"
            ? "missing"
            : "watch",
      proof: `${battlecard.proofLock.proofScore} proof lock; ${battlecard.objectionReplay.replayScore} replay; ${approachSourceCount} sources / ${approachSwotCount} SWOT links.`,
      evidenceUrl: absoluteUrl(normalizedBase, "/api/competitive-battlecard")
    }),
    criteriaLockCheck({
      id: "usability-proof",
      criterionId: "usability",
      label: "First-run path is internally locked",
      status:
        usabilityLock && usabilityLock.internalScore >= 92 && usabilityLock.missingCount === 0
          ? "sealed"
          : usabilityLock && usabilityLock.internalScore >= 88
            ? "watch"
            : "missing",
      proof: usabilityLock
        ? `${usabilityLock.internalScore} internal usability; ${usabilityLock.sealedCount} sealed / ${usabilityLock.watchCount} watch.`
        : "Prize Usability Lock has not been generated.",
      evidenceUrl: absoluteUrl(normalizedBase, "/api/prize-strategy")
    }),
    criteriaLockCheck({
      id: "practicality-proof",
      criterionId: "practicality",
      label: "Buyer value and operation value are connected",
      status: practicalityReady ? "sealed" : pilotEconomics.economicsScore >= 84 ? "watch" : "missing",
      proof: `${pilotEconomics.economicsScore} economics / ${pilotEconomics.unitEconomics.paybackDays}d payback / ${oracleScore ?? pilotEconomics.economicsScore} oracle proof.`,
      evidenceUrl: absoluteUrl(normalizedBase, "/api/pilot-economics")
    }),
    criteriaLockCheck({
      id: "implementation-proof",
      criterionId: "implementation",
      label: "Public implementation can be rechecked",
      status: implementationReady ? "sealed" : (releaseDrift?.driftScore ?? row(acceptance, "release-drift")?.score ?? 0) >= 84 ? "watch" : "missing",
      proof: releaseDrift
        ? `${releaseDrift.driftScore} release drift / ${releaseDrift.verdict}; ${releaseDrift.observedSkillCount}/${releaseDrift.expectedSkillCount} skills visible.`
        : `${row(acceptance, "live-public-proof")?.score ?? 0} live proof; Release Drift Guard not checked.`,
      evidenceUrl: absoluteUrl(normalizedBase, "/api/release-drift")
    }),
    criteriaLockCheck({
      id: "external-submit-truth",
      criterionId: "submission",
      label: "External submission truth stays visible",
      status: acceptance.verdict === "not-accepted" ? "missing" : externalWatchCount > 0 ? "watch" : "sealed",
      proof:
        externalWatchCount > 0
          ? `${externalWatchCount} external submission rows remain watch, not hidden as winner-ready.`
          : "ProtoPedia, video, and public submission evidence are accepted.",
      evidenceUrl: absoluteUrl(normalizedBase, "/api/acceptance-matrix")
    })
  ];
  const nonExternalChecks = checks.filter((check) => check.id !== "external-submit-truth");
  const sealedCount = checks.filter((check) => check.status === "sealed").length;
  const watchCount = checks.filter((check) => check.status === "watch").length;
  const missingCount = checks.filter((check) => check.status === "missing").length;
  const internalScore = Math.round(clamp(average(nonExternalChecks.map((check) => check.score))));
  const lockScore = Math.round(clamp(average(checks.map((check) => check.score))));
  const nonExternalSealed = nonExternalChecks.every((check) => check.status === "sealed");
  const readiness: PrizeCriteriaLockReadiness =
    missingCount > 0 || !nonExternalSealed ? "needs-criteria-proof" : externalWatchCount > 0 ? "criteria-external-watch" : "criteria-locked";

  return {
    id: `prize-criteria-lock-${lockScore}-${readiness}`,
    lockScore,
    internalScore,
    readiness,
    sealedCount,
    watchCount,
    missingCount,
    operatorLine:
      readiness === "criteria-locked"
        ? "All five judging criteria and external submission proof are locked for the prize pitch."
        : readiness === "criteria-external-watch"
          ? "All five judging criteria are internally sealed; only ProtoPedia/video submission evidence remains watch."
          : "One or more judging criteria still lacks a sealed proof route before the prize pitch.",
    checks
  };
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
  observabilityOracle?: ObservabilityOracle;
  releaseDrift?: ReleaseDriftGuard;
}): PrizeStrategyBoard {
  const { baseUrl, strategy, acceptance, autopilot, command, battlecard, demoConcierge, pilotEconomics, observabilityOracle, releaseDrift } = input;
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const oracleScore = observabilityOracle ? observabilityProofScore(observabilityOracle) : undefined;
  const routeLock = demoConcierge?.routeLock;
  const usabilityLock = buildUsabilityLock({ baseUrl: normalizedBase, acceptance, command, demoConcierge });
  const criteriaLock = buildCriteriaLock({
    baseUrl: normalizedBase,
    acceptance,
    autopilot,
    command,
    battlecard,
    usabilityLock,
    pilotEconomics,
    observabilityOracle,
    releaseDrift
  });
  const criteria = [
    criterionItem({
      id: "agent-centrality",
      label: "AI agent centrality",
      scores: [
        criterion(strategy, "agentCentrality")?.score ?? 0,
        row(acceptance, "a2a-agent-center")?.score ?? 0,
        lane(autopilot, "autonomy")?.score ?? 0,
        command.commandScore,
        criteriaLockValue(criteriaLock, "agent-centrality"),
        criteriaLock.internalScore
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
        battlecard.objectionReplay.replayScore,
        demoConcierge?.conciergeScore ?? battlecard.battleScore,
        criteriaLockValue(criteriaLock, "approach"),
        criteriaLock.internalScore
      ],
      decisiveProof: "Competitive BattlecardのObjection Replayが、最弱競合への質問、公式ソース、SWOT、公開proof routeを30秒順に固定する。",
      missingProof: "ADK/LangGraph/Difyでよいのでは、という質問に飲み込まれるリスク。",
      demoMove: "Competitive BattlecardのObjection Replayを開き、最弱競合の質問からsource、SWOT、proof routeの順で辿る。",
      nextAction: "30秒動画の前半にObjection Replayを入れ、既存ツールとの差分を先に固定する。"
    }),
    criterionItem({
      id: "usability",
      label: "Usability",
      scores: [
        criterion(strategy, "usability")?.score ?? 0,
        row(acceptance, "usability-first-run")?.score ?? 0,
        routeLock?.lockScore ?? row(acceptance, "usability-first-run")?.score ?? 0,
        routeLock?.routeStepScore ?? row(acceptance, "usability-first-run")?.score ?? 0,
        routeLock?.proofLinkScore ?? row(acceptance, "usability-first-run")?.score ?? 0,
        demoConcierge?.focusLock.focusScore ?? command.commandScore,
        usabilityLock?.internalScore ?? demoConcierge?.conciergeScore ?? command.commandScore,
        usabilityLock?.lockScore ?? demoConcierge?.conciergeScore ?? command.commandScore,
        criteriaLockValue(criteriaLock, "usability"),
        criteriaLock.internalScore,
        numericMetric(command, "tour"),
        lane(autopilot, "demo")?.score ?? 0,
        command.commandScore
      ],
      decisiveProof:
        usabilityLock === undefined
          ? "Demo Concierge、Prize Strategy、Judge Command Center、Judge Tourが初見の採点作戦とクリック順を固定する。"
          : "Prize Usability Lockが、Judge Route Lock、最初の90秒、proof URL、Focus path、persona別first click、外部URL watchの正直表示まで固定する。",
      missingProof: "機能が多く、初見審査員がどこを押すべきか迷うリスク。",
      demoMove:
        usabilityLock === undefined
          ? "Demo Conciergeでpersona別のfirst clickを見せ、First 90 secondsのproof buttonsを上から辿る。"
          : "Prize Usability Lockを見せてから、Demo ConciergeのJudge Route LockとFocus pathだけを辿る。",
      nextAction:
        usabilityLock === undefined
          ? "Prize pitchでは機能一覧を話さず、Demo Conciergeのjudge laneから進める。"
          : "Prize pitchでは機能一覧を話さず、Usability Lockのsealed checksだけを録画する。"
    }),
    criterionItem({
      id: "practicality",
      label: "Practical value",
      scores: [
        criterion(strategy, "practicality")?.score ?? 0,
        row(acceptance, "practical-impact")?.score ?? 0,
        row(acceptance, "pilot-economics")?.score ?? 0,
        pilotEconomics.economicsScore,
        oracleScore ?? pilotEconomics.economicsScore,
        demoConcierge?.conciergeScore ?? pilotEconomics.economicsScore,
        criteriaLockValue(criteriaLock, "practicality"),
        criteriaLock.internalScore
      ],
      decisiveProof:
        oracleScore === undefined
          ? "Demo Concierge、Impact Case、Pilot Economicsが対象ユーザー、時間短縮、回収日数、買い手反論を示す。"
          : "Demo Concierge、Impact Case、Pilot Economics、Observability Oracleが対象ユーザー、時間短縮、回収日数、公開運用SLOを示す。",
      missingProof: "面白いが現場価値が薄い、という評価になるリスク。",
      demoMove:
        oracleScore === undefined
          ? "Demo Conciergeのbuyer laneからPilot Economicsのpayback daysとbuyer objectionsを見せる。"
          : "Demo Conciergeのbuyer laneからObservability Oracleのbuyer SLOとPilot Economicsのpayback daysを見せる。",
      nextAction:
        oracleScore === undefined
          ? "ProtoPedia本文にDemo Conciergeのbuyer lane、回収日数、対象ユーザー別KPIを入れる。"
          : "ProtoPedia本文にObservability Oracleのbuyer SLO、回収日数、対象ユーザー別KPIを入れる。"
    }),
    criterionItem({
      id: "implementation",
      label: "Implementation",
      scores: [
        criterion(strategy, "implementation")?.score ?? 0,
        row(acceptance, "implementation-quality")?.score ?? 0,
        row(acceptance, "live-public-proof")?.score ?? 0,
        row(acceptance, "release-drift")?.score ?? releaseDrift?.driftScore ?? 88,
        row(acceptance, "security-boundary")?.score ?? 0,
        observabilityOracle?.oracleScore ?? row(acceptance, "live-public-proof")?.score ?? 0,
        criteriaLockValue(criteriaLock, "implementation"),
        criteriaLock.internalScore
      ],
      decisiveProof:
        oracleScore === undefined
          ? "Cloud Run、GitHub Actions、Release Drift、Security Reviewで公開運用まで検証できる。"
          : "Cloud Run、GitHub Actions、Release Drift、Security Review、Observability Oracleで公開運用と継続判断まで検証できる。",
      missingProof: "ローカルでは動くが提出URLが古い、またはCI証拠が弱いリスク。",
      demoMove: oracleScore === undefined ? "Release Drift Guardでrelease-currentを見せ、CIリンクを開く。" : "Release Drift Guardでrelease-currentを見せ、Observability Oracleで継続/復旧判断を開く。",
      nextAction: "提出直前にRelease Drift Guard、Observability Oracle、GitHub Actions latest main runを再実行する。"
    })
  ];

  const prizeScore = Math.round(
    clamp(
      average(criteria.map((item) => item.currentScore)) * 0.74 +
        average([
          acceptance.acceptanceScore,
          command.commandScore,
          autopilot.winScore,
          battlecard.battleScore,
          pilotEconomics.economicsScore,
          oracleScore ?? pilotEconomics.economicsScore,
          releaseDrift?.driftScore ?? 88
        ]) *
          0.26
    )
  );
  const readiness = readinessFrom({ prizeScore, criteria, acceptance, command, autopilot, releaseDrift });
  const moves = proofMoves({ baseUrl, acceptance, command, battlecard, demoConcierge, usabilityLock, criteriaLock, pilotEconomics, observabilityOracle, releaseDrift });
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
        say: battlecard.judgeScript[1] ?? battlecard.objectionReplay.lockedAnswer,
        proofMoveId: "objection-replay"
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
        screen: observabilityOracle ? "Observability Oracle + Pilot Economics" : "Pilot Economics",
        say: observabilityOracle ? `${observabilityOracle.hardTruth} ${pilotEconomics.verdict}` : pilotEconomics.verdict,
        proofMoveId: observabilityOracle ? "operations-value" : "buyer-value"
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
    usabilityLock,
    criteriaLock,
    judgeClose:
      weakest && weakest.delta > 0
        ? `${weakest.label} is the next scoring lever: ${weakest.nextAction}`
        : criteriaLock.readiness === "criteria-external-watch"
          ? "All five judging criteria have winner-ready proof; only ProtoPedia and demo video URLs remain external watch rows."
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
      usabilityLock: usabilityLock
        ? {
            lockScore: usabilityLock.lockScore,
            internalScore: usabilityLock.internalScore,
            readiness: usabilityLock.readiness,
            checks: usabilityLock.checks.map((check) => ({ id: check.id, status: check.status, score: check.score, evidenceUrl: check.evidenceUrl }))
          }
        : null,
      criteriaLock: {
        lockScore: criteriaLock.lockScore,
        internalScore: criteriaLock.internalScore,
        readiness: criteriaLock.readiness,
        checks: criteriaLock.checks.map((check) => ({
          id: check.id,
          criterionId: check.criterionId,
          status: check.status,
          score: check.score,
          evidenceUrl: check.evidenceUrl
        }))
      },
      competitiveBattlecard: {
        score: battlecard.battleScore,
        readiness: battlecard.readiness,
        objectionReplay: {
          score: battlecard.objectionReplay.replayScore,
          readiness: battlecard.objectionReplay.readiness,
          weakestCompetitor: battlecard.objectionReplay.weakestCompetitor,
          steps: battlecard.objectionReplay.steps.map((step) => ({ id: step.id, status: step.status, proofUrl: step.proofUrl }))
        }
      },
      demoConcierge: demoConcierge
        ? {
            score: demoConcierge.conciergeScore,
            readiness: demoConcierge.readiness,
            singleNextClick: demoConcierge.singleNextClick,
            routeLock: {
              score: demoConcierge.routeLock.lockScore,
              readiness: demoConcierge.routeLock.readiness,
              steps: demoConcierge.routeLock.lockedSteps.map((step) => ({ id: step.id, status: step.status, proofUrl: step.proofUrl }))
            }
          }
        : null,
      observabilityOracle: observabilityOracle
        ? {
            score: oracleScore,
            readiness: observabilityOracle.readiness,
            receipts: observabilityOracle.receipts.map((receipt) => ({ id: receipt.id, status: receipt.status }))
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
        observabilityOracle: absoluteUrl(normalizedBase, "/api/observability-oracle"),
        pilotEconomics: absoluteUrl(normalizedBase, "/api/pilot-economics")
      }
    }
  };
}
