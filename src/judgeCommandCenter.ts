import type { JudgeAcceptanceMatrix } from "./acceptanceMatrix.js";
import type { WinningAutopilotRun } from "./autopilot.js";
import type { CompetitiveBattlecard } from "./competitiveBattlecard.js";
import type { JudgeTour } from "./judgeTour.js";
import type { PilotEconomics } from "./pilotEconomics.js";
import type { ReleaseDriftGuard } from "./releaseDrift.js";

export type CommandCenterReadiness = "pitch-ready" | "external-gaps" | "blocked";
export type CommandCenterStatus = "ready" | "watch" | "blocked";

export type CommandCenterMetric = {
  id: string;
  label: string;
  value: string;
  status: CommandCenterStatus;
  evidence: string;
};

export type CommandCenterProofButton = {
  id: string;
  label: string;
  buttonLabel: string;
  endpoint: string;
  status: CommandCenterStatus;
  score: number;
  reason: string;
};

export type CommandCenterTimelineStep = {
  id: string;
  timeRange: string;
  screen: string;
  click: string;
  say: string;
  proofButtonId: string;
  status: CommandCenterStatus;
};

export type CommandCenterBlocker = {
  id: string;
  priority: "now" | "next";
  owner: string;
  action: string;
  proof: string;
};

export type JudgeCommandCenter = {
  id: string;
  commandScore: number;
  readiness: CommandCenterReadiness;
  headline: string;
  hardTruth: string;
  openingMove: string;
  metrics: CommandCenterMetric[];
  proofButtons: CommandCenterProofButton[];
  timeline: CommandCenterTimelineStep[];
  blockers: CommandCenterBlocker[];
  judgeScript: string[];
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

function statusFromScore(score: number): CommandCenterStatus {
  if (score >= 88) return "ready";
  if (score >= 70) return "watch";
  return "blocked";
}

function readinessFrom(input: {
  acceptance: JudgeAcceptanceMatrix;
  autopilot: WinningAutopilotRun;
  competitiveBattlecard: CompetitiveBattlecard;
  judgeTour: JudgeTour;
  releaseDrift?: ReleaseDriftGuard;
}): CommandCenterReadiness {
  if (input.releaseDrift && input.releaseDrift.verdict !== "release-current") return "blocked";
  if (
    input.acceptance.verdict === "not-accepted" ||
    input.autopilot.readiness === "needs-build" ||
    input.competitiveBattlecard.readiness === "exposed" ||
    input.judgeTour.readiness === "needs-fix"
  ) {
    return "blocked";
  }
  if (
    input.acceptance.verdict === "accepted-with-external-gaps" ||
    input.autopilot.readiness === "external-gaps" ||
    input.competitiveBattlecard.readiness === "needs-proof" ||
    input.judgeTour.readiness === "external-url-gaps"
  ) {
    return "external-gaps";
  }
  return "pitch-ready";
}

function proofStatusForReadiness(readiness: string): CommandCenterStatus {
  if (readiness.includes("ready") || readiness === "optimized" || readiness === "investment-ready" || readiness === "release-current") return "ready";
  if (readiness.includes("gap") || readiness.includes("watch") || readiness.includes("needs")) return "watch";
  return "blocked";
}

function blockerFromAcceptance(row: JudgeAcceptanceMatrix["rows"][number]): CommandCenterBlocker {
  return {
    id: row.id,
    priority: row.status === "blocked" ? "now" : "next",
    owner: row.area === "submission" ? "Submission owner" : row.area === "proof" ? "Cloud Run SRE" : "A2A Market Broker",
    action: row.nextAction,
    proof: row.evidence
  };
}

function uniqueBlockers(blockers: CommandCenterBlocker[]) {
  const seen = new Set<string>();
  return blockers.filter((blocker) => {
    if (seen.has(blocker.id)) return false;
    seen.add(blocker.id);
    return true;
  });
}

export function buildJudgeCommandCenter(input: {
  baseUrl: string;
  acceptance: JudgeAcceptanceMatrix;
  autopilot: WinningAutopilotRun;
  competitiveBattlecard: CompetitiveBattlecard;
  judgeTour: JudgeTour;
  pilotEconomics: PilotEconomics;
  releaseDrift?: ReleaseDriftGuard;
}): JudgeCommandCenter {
  const { baseUrl, acceptance, autopilot, competitiveBattlecard, judgeTour, pilotEconomics, releaseDrift } = input;
  const readiness = readinessFrom({ acceptance, autopilot, competitiveBattlecard, judgeTour, releaseDrift });
  const releaseScore = releaseDrift?.driftScore ?? 92;
  const commandScore = Math.round(
    clamp(average([acceptance.acceptanceScore, autopilot.winScore, competitiveBattlecard.battleScore, judgeTour.tourScore, pilotEconomics.economicsScore, releaseScore]))
  );
  const blockedRows = acceptance.rows.filter((row) => row.status === "blocked");
  const watchRows = acceptance.rows.filter((row) => row.status === "watch");
  const releaseBlockers: CommandCenterBlocker[] =
    releaseDrift?.nextActions.map((action) => ({
      id: action.id,
      priority: action.priority,
      owner: action.owner,
      action: action.action,
      proof: action.proof
    })) ?? [];
  const autopilotBlockers: CommandCenterBlocker[] = autopilot.blockers.slice(0, 4).map((action) => ({
    id: action.id,
    priority: action.priority === "now" ? "now" : "next",
    owner: action.owner,
    action: action.command,
    proof: action.proof
  }));
  const blockers = uniqueBlockers([
    ...releaseBlockers,
    ...blockedRows.map(blockerFromAcceptance),
    ...watchRows.slice(0, 4).map(blockerFromAcceptance),
    ...autopilotBlockers
  ]);
  const firstNow = blockers.find((blocker) => blocker.priority === "now");
  const openingMove =
    readiness === "blocked"
      ? (firstNow?.action ?? "blockedの受入行を先に直し、Judge Command Centerを再実行する")
      : readiness === "external-gaps"
        ? "Judge Tourで価値を見せ、Competitive Battlecardで競合質問へ答え、Submission Launch Gateで外部URLをwatchとして正直に示す"
        : "Judge Tourを開き、Competitive Battlecard、Acceptance Matrix、Pilot Economics、Win Autopilotの順で証拠を見せる";
  const headline =
    readiness === "pitch-ready"
      ? "審査員の最初の90秒は、この司令塔から始めれば迷いません。"
      : readiness === "external-gaps"
        ? "MVPの核は説明できます。外部提出URLだけを正直にwatchとして残します。"
        : "最初に見せる前に直すべきblocked証拠があります。";
  const hardTruth =
    readiness === "blocked" && releaseDrift?.verdict === "deploy-drift"
      ? "公開Cloud Runが古いrevisionなので、ローカル実装が優れていても審査員には未実装に見えます。"
      : readiness === "blocked"
        ? "機能が多くても、受入表か公開証拠にblockedがある限りMVPとして説明できません。"
        : readiness === "external-gaps"
          ? "外部URLは未発行なら未完了扱いにしつつ、AI中心性、競合差別化、Battlecard、実用性、実装力の証拠は見せられます。"
          : "提出前の初回導線、価値、採算、公開証拠が同じ画面で説明できます。";

  const metrics: CommandCenterMetric[] = [
    {
      id: "acceptance",
      label: "Acceptance",
      value: `${acceptance.acceptanceScore}`,
      status: acceptance.verdict === "not-accepted" ? "blocked" : acceptance.verdict === "accepted-with-external-gaps" ? "watch" : "ready",
      evidence: `${acceptance.rows.length} rows / ${acceptance.verdict}`
    },
    {
      id: "win",
      label: "Win run",
      value: `${autopilot.winScore}`,
      status: proofStatusForReadiness(autopilot.readiness),
      evidence: `${autopilot.lanes.length} lanes / ${autopilot.readiness}`
    },
    {
      id: "tour",
      label: "90s tour",
      value: `${judgeTour.tourScore}`,
      status: proofStatusForReadiness(judgeTour.readiness),
      evidence: `${judgeTour.steps.length} steps / ${judgeTour.readiness}`
    },
    {
      id: "battlecard",
      label: "Battlecard",
      value: `${competitiveBattlecard.battleScore}`,
      status: proofStatusForReadiness(competitiveBattlecard.readiness),
      evidence: `${competitiveBattlecard.cards.length} competitors / ${competitiveBattlecard.readiness}`
    },
    {
      id: "economics",
      label: "Payback",
      value: `${pilotEconomics.unitEconomics.paybackDays}d`,
      status: proofStatusForReadiness(pilotEconomics.posture),
      evidence: `${pilotEconomics.economicsScore} score / ${pilotEconomics.posture}`
    },
    {
      id: "release",
      label: "Release",
      value: releaseDrift ? `${releaseDrift.observedSkillCount}/${releaseDrift.expectedSkillCount}` : "not checked",
      status: releaseDrift ? proofStatusForReadiness(releaseDrift.verdict) : "watch",
      evidence: releaseDrift?.summary ?? "Release Drift Guard was skipped."
    }
  ];

  const proofButtons: CommandCenterProofButton[] = [
    {
      id: "judge-tour",
      label: "Judge Tour",
      buttonLabel: "Open 90s route",
      endpoint: absoluteUrl(baseUrl, "/api/judge-tour"),
      status: proofStatusForReadiness(judgeTour.readiness),
      score: judgeTour.tourScore,
      reason: judgeTour.headline
    },
    {
      id: "acceptance-matrix",
      label: "Acceptance Matrix",
      buttonLabel: "Check MVP truth",
      endpoint: absoluteUrl(baseUrl, "/api/acceptance-matrix"),
      status: acceptance.verdict === "not-accepted" ? "blocked" : acceptance.verdict === "accepted-with-external-gaps" ? "watch" : "ready",
      score: acceptance.acceptanceScore,
      reason: acceptance.hardTruth
    },
    {
      id: "release-drift",
      label: "Release Drift",
      buttonLabel: "Verify public revision",
      endpoint: absoluteUrl(baseUrl, "/api/release-drift"),
      status: releaseDrift ? proofStatusForReadiness(releaseDrift.verdict) : "watch",
      score: releaseScore,
      reason: releaseDrift?.hardTruth ?? "公開Cloud Runのrevision driftを提出前に確認します。"
    },
    {
      id: "competitive-battlecard",
      label: "Competitive Battlecard",
      buttonLabel: "Answer competitor",
      endpoint: absoluteUrl(baseUrl, "/api/competitive-battlecard"),
      status: proofStatusForReadiness(competitiveBattlecard.readiness),
      score: competitiveBattlecard.battleScore,
      reason: competitiveBattlecard.headline
    },
    {
      id: "pilot-economics",
      label: "Pilot Economics",
      buttonLabel: "Show buyer proof",
      endpoint: absoluteUrl(baseUrl, "/api/pilot-economics"),
      status: proofStatusForReadiness(pilotEconomics.posture),
      score: pilotEconomics.economicsScore,
      reason: pilotEconomics.hardTruth
    },
    {
      id: "win-autopilot",
      label: "Win Autopilot",
      buttonLabel: "Run win verdict",
      endpoint: absoluteUrl(baseUrl, "/api/win-run"),
      status: proofStatusForReadiness(autopilot.readiness),
      score: autopilot.winScore,
      reason: autopilot.headline
    }
  ];

  const timeline: CommandCenterTimelineStep[] = [
    {
      id: "open",
      timeRange: "0-12s",
      screen: "Judge Command Center",
      click: "Build command center",
      say: headline,
      proofButtonId: "judge-tour",
      status: readiness === "blocked" ? "blocked" : "ready"
    },
    {
      id: "truth",
      timeRange: "12-28s",
      screen: "Acceptance Matrix",
      click: "Check MVP truth",
      say: acceptance.headline,
      proofButtonId: "acceptance-matrix",
      status: acceptance.verdict === "not-accepted" ? "blocked" : "ready"
    },
    {
      id: "public",
      timeRange: "28-42s",
      screen: "Release Drift Guard",
      click: "Verify public revision",
      say: releaseDrift?.summary ?? "公開revisionを提出前に検査します。",
      proofButtonId: "release-drift",
      status: releaseDrift ? proofStatusForReadiness(releaseDrift.verdict) : "watch"
    },
    {
      id: "battlecard",
      timeRange: "42-56s",
      screen: "Competitive Battlecard",
      click: "Answer competitor",
      say: competitiveBattlecard.headline,
      proofButtonId: "competitive-battlecard",
      status: proofStatusForReadiness(competitiveBattlecard.readiness)
    },
    {
      id: "value",
      timeRange: "56-68s",
      screen: "Pilot Economics",
      click: "Show buyer proof",
      say: pilotEconomics.verdict,
      proofButtonId: "pilot-economics",
      status: proofStatusForReadiness(pilotEconomics.posture)
    },
    {
      id: "close",
      timeRange: "68-90s",
      screen: "Judge Tour + Win Autopilot",
      click: "Open 90s route",
      say: judgeTour.openingScript,
      proofButtonId: "win-autopilot",
      status: proofStatusForReadiness(autopilot.readiness)
    }
  ];

  const judgeScript = [
    `Opening: ${headline}`,
    `Move: ${openingMove}`,
    `Truth: Acceptance ${acceptance.acceptanceScore}, ${acceptance.verdict}.`,
    `Competition: Battlecard ${competitiveBattlecard.battleScore}, ${competitiveBattlecard.readiness}, ${competitiveBattlecard.cards.length} competitors.`,
    `Value: Pilot payback ${pilotEconomics.unitEconomics.paybackDays} days, ${pilotEconomics.posture}.`,
    `Public proof: ${releaseDrift ? `${releaseDrift.observedSkillCount}/${releaseDrift.expectedSkillCount} skills, ${releaseDrift.verdict}` : "release drift not checked"}.`
  ];

  return {
    id: `judge-command-${commandScore}-${readiness}`,
    commandScore,
    readiness,
    headline,
    hardTruth,
    openingMove,
    metrics,
    proofButtons,
    timeline,
    blockers,
    judgeScript,
    a2aPayload: {
      method: "message/send",
      skill: "judge.command",
      commandScore,
      readiness,
      openingMove,
      metrics: metrics.map((metric) => ({ id: metric.id, value: metric.value, status: metric.status })),
      proofButtons: proofButtons.map((button) => ({ id: button.id, endpoint: button.endpoint, status: button.status, score: button.score })),
      competitiveBattlecard: {
        battleScore: competitiveBattlecard.battleScore,
        readiness: competitiveBattlecard.readiness,
        cards: competitiveBattlecard.cards.map((card) => ({ id: card.id, status: card.status, score: card.score }))
      },
      blockers: blockers.map((blocker) => ({ id: blocker.id, priority: blocker.priority, action: blocker.action }))
    }
  };
}
