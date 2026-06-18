import type { JudgeAcceptanceMatrix } from "./acceptanceMatrix.js";
import type { DemoConcierge } from "./demoConcierge.js";
import type { JudgeCommandCenter } from "./judgeCommandCenter.js";
import type { JudgeTour } from "./judgeTour.js";
import type { PrizeStrategyBoard } from "./prizeStrategy.js";
import type { SubmissionCloseoutWorkbench } from "./submissionCloseout.js";

export type JudgeRehearsalReadiness = "rehearsal-ready" | "external-gap-rehearsal" | "needs-rehearsal-fix";
export type JudgeRehearsalStatus = "ready" | "watch" | "blocked";

export type JudgeRehearsalSegment = {
  id: string;
  timeRange: string;
  screen: string;
  open: string;
  say: string;
  proofUrl: string;
  successSignal: string;
  status: JudgeRehearsalStatus;
};

export type JudgeRehearsalQuestion = {
  id: string;
  question: string;
  answer: string;
  proofUrl: string;
  status: JudgeRehearsalStatus;
};

export type JudgeRehearsalScorecard = {
  id: string;
  label: string;
  currentScore: number;
  targetScore: number;
  rehearse: string;
  status: JudgeRehearsalStatus;
};

export type JudgeRehearsalCapture = {
  id: string;
  timeRange: string;
  screen: string;
  narration: string;
  evidenceUrl: string;
  status: JudgeRehearsalStatus;
};

export type JudgeRehearsalRoom = {
  id: string;
  rehearsalScore: number;
  readiness: JudgeRehearsalReadiness;
  headline: string;
  hardTruth: string;
  openingLine: string;
  nextRun: string;
  segments: JudgeRehearsalSegment[];
  questionDeck: JudgeRehearsalQuestion[];
  scorecard: JudgeRehearsalScorecard[];
  captureChecklist: JudgeRehearsalCapture[];
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

function statusFromScore(score: number, target = 88): JudgeRehearsalStatus {
  if (score >= target) return "ready";
  if (score >= target - 16) return "watch";
  return "blocked";
}

function statusFromReadiness(readiness: string): JudgeRehearsalStatus {
  if (readiness.includes("ready") || readiness === "guided" || readiness === "release-current") return "ready";
  if (readiness.includes("blocked") || readiness.includes("fix") || readiness.includes("invalid")) return "blocked";
  return "watch";
}

function statusFromPublisher(status: "ready" | "watch"): JudgeRehearsalStatus {
  return status === "ready" ? "ready" : "watch";
}

function readinessFrom(input: {
  rehearsalScore: number;
  acceptance: JudgeAcceptanceMatrix;
  command: JudgeCommandCenter;
  closeout: SubmissionCloseoutWorkbench;
  blockedCount: number;
}): JudgeRehearsalReadiness {
  if (input.blockedCount > 0 || input.acceptance.verdict === "not-accepted" || input.command.readiness === "blocked") return "needs-rehearsal-fix";
  if (input.closeout.readiness !== "ready-to-submit" || input.acceptance.verdict === "accepted-with-external-gaps" || input.rehearsalScore < 92) {
    return "external-gap-rehearsal";
  }
  return "rehearsal-ready";
}

function shortText(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function buildJudgeRehearsalRoom(input: {
  baseUrl: string;
  acceptance: JudgeAcceptanceMatrix;
  command: JudgeCommandCenter;
  concierge: DemoConcierge;
  tour: JudgeTour;
  prize: PrizeStrategyBoard;
  closeout: SubmissionCloseoutWorkbench;
}): JudgeRehearsalRoom {
  const { baseUrl, acceptance, command, concierge, tour, prize, closeout } = input;
  const base = baseUrl.replace(/\/$/, "");
  const externalGapCount = closeout.urlStatuses.filter((item) => item.status !== "ready").length;
  const blockedSignals = [
    command.readiness === "blocked",
    acceptance.verdict === "not-accepted",
    tour.readiness === "needs-fix",
    closeout.readiness === "invalid-evidence"
  ].filter(Boolean).length;
  const rehearsalScore = Math.round(
    clamp(
      average([acceptance.acceptanceScore, command.commandScore, concierge.conciergeScore, tour.tourScore, prize.prizeScore, closeout.closeoutScore]) -
        blockedSignals * 10 -
        Math.min(4, externalGapCount * 2)
    )
  );

  const commandButton = command.proofButtons.find((button) => button.id === "judge-tour") ?? command.proofButtons[0];
  const buyerLane = concierge.lanes.find((lane) => lane.id === "buyer") ?? concierge.lanes[0];
  const submitterLane = concierge.lanes.find((lane) => lane.id === "submitter") ?? concierge.lanes[0];
  const topPrizeMove = [...prize.proofMoves].sort((left, right) => right.score - left.score)[0];
  const closeoutStep = closeout.videoSteps.find((step) => step.status !== "ready") ?? closeout.videoSteps[closeout.videoSteps.length - 1];

  const segments: JudgeRehearsalSegment[] = [
    {
      id: "open-command",
      timeRange: "0-12s",
      screen: "Judge Command Center",
      open: commandButton?.buttonLabel ?? "Build command center",
      say: command.openingMove,
      proofUrl: commandButton?.endpoint ?? absoluteUrl(base, "/api/judge-command-center"),
      successSignal: `${command.commandScore} command score / ${command.readiness}`,
      status: statusFromReadiness(command.readiness)
    },
    {
      id: "first-click",
      timeRange: "12-25s",
      screen: "Demo Concierge",
      open: concierge.singleNextClick,
      say: concierge.headline,
      proofUrl: absoluteUrl(base, "/api/demo-concierge"),
      successSignal: `${concierge.lanes.length} persona lanes / ${concierge.readiness}`,
      status: statusFromReadiness(concierge.readiness)
    },
    {
      id: "judge-tour",
      timeRange: "25-42s",
      screen: "Judge Tour",
      open: "Build judge tour",
      say: tour.openingScript,
      proofUrl: absoluteUrl(base, "/api/judge-tour"),
      successSignal: `${tour.totalSeconds}s walkthrough / ${tour.readiness}`,
      status: statusFromReadiness(tour.readiness)
    },
    {
      id: "competitive-proof",
      timeRange: "42-58s",
      screen: topPrizeMove?.screen ?? "Prize Strategy Board",
      open: topPrizeMove?.label ?? "Build prize strategy",
      say: prize.winHypothesis,
      proofUrl: topPrizeMove?.endpoint ?? absoluteUrl(base, "/api/prize-strategy"),
      successSignal: `${prize.prizeScore} prize score / ${prize.readiness}`,
      status: statusFromReadiness(prize.readiness)
    },
    {
      id: "buyer-proof",
      timeRange: "58-74s",
      screen: buyerLane?.steps[0]?.screen ?? "Pilot Economics",
      open: buyerLane?.firstClick ?? "Build pilot economics",
      say: buyerLane?.valueMoment ?? "実用価値をPilot Economicsで示す。",
      proofUrl: buyerLane?.steps[0]?.endpoint ?? absoluteUrl(base, "/api/pilot-economics"),
      successSignal: buyerLane?.steps[0]?.successSignal ?? "buyer proof reachable",
      status: buyerLane?.steps[0]?.status ?? "watch"
    },
    {
      id: "submission-close",
      timeRange: "74-90s",
      screen: "Submission Closeout",
      open: "Build closeout",
      say: closeout.hardTruth,
      proofUrl: absoluteUrl(base, "/api/submission-closeout"),
      successSignal: `${closeout.closeoutScore} closeout score / ${closeout.readiness}`,
      status: statusFromReadiness(closeout.readiness)
    }
  ];

  const questionDeck: JudgeRehearsalQuestion[] = [
    ...tour.objections.slice(0, 3).map((objection) => ({
      id: objection.id,
      question: objection.question,
      answer: objection.response,
      proofUrl: tour.steps.find((step) => step.id === objection.openStepId)?.endpoint ?? absoluteUrl(base, "/api/judge-tour"),
      status: "ready" as JudgeRehearsalStatus
    })),
    {
      id: "business-value",
      question: buyerLane?.entryQuestion ?? "現場導入する理由はありますか？",
      answer: buyerLane?.valueMoment ?? "Pilot EconomicsとUser Pilotで実用価値を示します。",
      proofUrl: buyerLane?.steps[0]?.endpoint ?? absoluteUrl(base, "/api/pilot-economics"),
      status: buyerLane?.steps[0]?.status ?? "watch"
    },
    {
      id: "submission-gap",
      question: submitterLane?.entryQuestion ?? "提出物は揃っていますか？",
      answer:
        closeout.readiness === "ready-to-submit"
          ? "公開GitHub、Cloud Run、ProtoPedia作品URL、動画URLをsubmit packetとして揃えています。"
          : `残りは ${closeout.nextAction.label} です。提出完了とは言わず、closeout workbenchで順番付きにしています。`,
      proofUrl: absoluteUrl(base, "/api/submission-closeout"),
      status: statusFromReadiness(closeout.readiness)
    }
  ];

  const scorecard: JudgeRehearsalScorecard[] = prize.criteria.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    currentScore: criterion.currentScore,
    targetScore: criterion.targetScore,
    rehearse: criterion.demoMove,
    status: statusFromScore(criterion.currentScore, criterion.targetScore)
  }));

  const captureChecklist: JudgeRehearsalCapture[] = [
    ...closeout.videoSteps.slice(0, 5).map((step) => ({
      id: step.id,
      timeRange: step.timeRange,
      screen: step.screen,
      narration: step.narration,
      evidenceUrl: step.evidenceUrl,
      status: statusFromPublisher(step.status)
    })),
    {
      id: "rehearsal-receipt",
      timeRange: "after-recording",
      screen: "Judge Rehearsal Room",
      narration: `録画後に ${closeout.nextAction.label} をもう一度確認する。`,
      evidenceUrl: absoluteUrl(base, "/api/judge-rehearsal"),
      status: closeout.nextAction.status as JudgeRehearsalStatus
    }
  ];

  const readiness = readinessFrom({
    rehearsalScore,
    acceptance,
    command,
    closeout,
    blockedCount: [...segments, ...questionDeck, ...scorecard, ...captureChecklist].filter((item) => item.status === "blocked").length
  });
  const headline =
    readiness === "rehearsal-ready"
      ? "90秒デモはそのまま録画できます。"
      : readiness === "external-gap-rehearsal"
        ? "コード側の90秒デモは固まりました。外部URLだけをwatchとして残します。"
        : "録画前にblockedの証拠を直す必要があります。";
  const hardTruth =
    readiness === "needs-rehearsal-fix"
      ? "審査員は機能数ではなく、最初の90秒で価値、差別化、実用性、提出証拠が繋がるかを見ます。blockedがある間は録画に進めません。"
      : closeout.readiness === "ready-to-submit"
        ? "提出URLまで揃っているため、リハーサルを録画して最終提出へ進めます。"
        : "ProtoPedia作品URLと動画URLが未発行なら、録画台本は完成していてもsubmit-readyとは呼びません。";
  const openingLine = shortText(
    tour.openingScript,
    "AI能力を市場から雇い、A2Aで委任し、Cloud Run運用と提出証拠まで閉じる作品です。"
  );
  const nextRun =
    readiness === "needs-rehearsal-fix"
      ? segments.find((segment) => segment.status === "blocked")?.open ?? "Fix blocked rehearsal evidence"
      : closeout.readiness === "ready-to-submit"
        ? "Record the 90-second run and paste the submit packet"
        : closeout.nextAction.label;

  return {
    id: `judge-rehearsal-${rehearsalScore}-${readiness}`,
    rehearsalScore,
    readiness,
    headline,
    hardTruth,
    openingLine,
    nextRun,
    segments,
    questionDeck,
    scorecard,
    captureChecklist,
    a2aPayload: {
      method: "message/send",
      skill: "judge.rehearsal",
      readiness,
      rehearsalScore,
      nextRun,
      endpoints: {
        rehearsal: absoluteUrl(base, "/api/judge-rehearsal"),
        commandCenter: absoluteUrl(base, "/api/judge-command-center"),
        demoConcierge: absoluteUrl(base, "/api/demo-concierge"),
        submissionCloseout: absoluteUrl(base, "/api/submission-closeout")
      }
    }
  };
}
