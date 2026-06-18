import type { JudgeAcceptanceMatrix } from "./acceptanceMatrix.js";
import type { DemoConcierge } from "./demoConcierge.js";
import type { JudgeCommandCenter } from "./judgeCommandCenter.js";
import type { JudgeDrill } from "./judgeDrill.js";
import type { JudgeTour } from "./judgeTour.js";
import type { PrizeStrategyBoard } from "./prizeStrategy.js";
import type { SubmissionCloseoutWorkbench } from "./submissionCloseout.js";

export type JudgeRehearsalReadiness = "rehearsal-ready" | "external-gap-rehearsal" | "needs-rehearsal-fix";
export type JudgeRehearsalStatus = "ready" | "watch" | "blocked";
export type FinalPitchDefenseReadiness = "defense-ready" | "external-gap-defense" | "needs-defense-proof";

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

export type FinalPitchDefenseCheck = {
  id: string;
  label: string;
  status: JudgeRehearsalStatus;
  proof: string;
  proofUrl: string;
  acceptance: string;
};

export type FinalPitchDefenseLock = {
  id: string;
  defenseScore: number;
  readiness: FinalPitchDefenseReadiness;
  headline: string;
  hardQuestion: string;
  answerPath: string[];
  checks: FinalPitchDefenseCheck[];
  closingMove: string;
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
  defenseLock: FinalPitchDefenseLock;
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

function statusScore(status: JudgeRehearsalStatus) {
  if (status === "ready") return 100;
  if (status === "watch") return 76;
  return 42;
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

function defenseStatus(score: number): JudgeRehearsalStatus {
  if (score >= 88) return "ready";
  if (score >= 72) return "watch";
  return "blocked";
}

function buildDefenseLock(input: {
  baseUrl: string;
  rehearsalScore: number;
  command: JudgeCommandCenter;
  prize: PrizeStrategyBoard;
  closeout: SubmissionCloseoutWorkbench;
  segments: JudgeRehearsalSegment[];
  questionDeck: JudgeRehearsalQuestion[];
  scorecard: JudgeRehearsalScorecard[];
  captureChecklist: JudgeRehearsalCapture[];
  judgeDrill?: JudgeDrill;
}): FinalPitchDefenseLock {
  const { baseUrl, rehearsalScore, command, prize, closeout, segments, questionDeck, scorecard, captureChecklist, judgeDrill } = input;
  const agentCentrality = scorecard.find((item) => item.id === "agent-centrality");
  const approach = scorecard.find((item) => item.id === "approach");
  const practicality = scorecard.find((item) => item.id === "practicality");
  const implementation = scorecard.find((item) => item.id === "implementation");
  const objectionReplay = prize.proofMoves.find((move) => move.id === "objection-replay");
  const buyerValue = prize.proofMoves.find((move) => move.id === "buyer-value") ?? prize.proofMoves.find((move) => move.id === "operations-value");
  const publicRelease = prize.proofMoves.find((move) => move.id === "public-release");
  const blockedRecording = [...segments, ...captureChecklist].some((item) => item.status === "blocked");
  const allExternalReady = closeout.urlStatuses.every((item) => item.status === "ready");
  const malformedExternal = closeout.readiness === "invalid-evidence";
  const timeboxReady = (judgeDrill?.timeboxedAnswer.length ?? 0) >= 4;
  const highRiskObjections = judgeDrill?.objections.filter((objection) => objection.risk === "high").length ?? 0;

  const checks: FinalPitchDefenseCheck[] = [
    {
      id: "ai-necessity-defense",
      label: "AI necessity answer",
      status: agentCentrality?.status ?? statusFromReadiness(command.readiness),
      proof: agentCentrality
        ? `${agentCentrality.currentScore}/${agentCentrality.targetScore}: ${agentCentrality.rehearse}`
        : `${command.commandScore} command score / ${command.readiness}`,
      proofUrl: absoluteUrl(baseUrl, "/.well-known/agent-card.json"),
      acceptance: "単なるダッシュボードではなく、Agent CardとA2A payloadで判断、委任、検収の連鎖を示せる。"
    },
    {
      id: "competitor-cross-exam",
      label: "Competitor cross-exam",
      status: objectionReplay ? defenseStatus(Math.min(objectionReplay.score, approach?.currentScore ?? objectionReplay.score)) : "watch",
      proof: objectionReplay ? `${objectionReplay.score} objection replay / ${objectionReplay.proof}` : "Objection Replay proof move is not present.",
      proofUrl: objectionReplay?.endpoint ?? absoluteUrl(baseUrl, "/api/competitive-battlecard"),
      acceptance: "ADK、LangGraph、Dify等への反論を、相手の強み、SWOT、公開proof routeの順で30秒以内に返せる。"
    },
    {
      id: "buyer-value-defense",
      label: "Buyer value answer",
      status: buyerValue ? defenseStatus(Math.min(buyerValue.score, practicality?.currentScore ?? buyerValue.score)) : "watch",
      proof: buyerValue ? `${buyerValue.score} buyer proof / ${buyerValue.proof}` : "Buyer value proof move is not present.",
      proofUrl: buyerValue?.endpoint ?? absoluteUrl(baseUrl, "/api/pilot-economics"),
      acceptance: "面白いだけではなく、Pilot EconomicsやObservabilityの回収日数、買い手反論、導入価値に戻せる。"
    },
    {
      id: "public-implementation-proof",
      label: "Public implementation proof",
      status: publicRelease ? defenseStatus(Math.min(publicRelease.score, implementation?.currentScore ?? publicRelease.score)) : "watch",
      proof: publicRelease ? `${publicRelease.score} public proof / ${publicRelease.proof}` : "Public release proof move is not present.",
      proofUrl: publicRelease?.endpoint ?? absoluteUrl(baseUrl, "/api/release-drift"),
      acceptance: "Cloud Run、GitHub Actions、Release Drift、A2A artifactを最終質疑中に開き、最新公開実装であることを示せる。"
    },
    {
      id: "honest-submission-gap",
      label: "Honest submission gap",
      status: malformedExternal ? "blocked" : allExternalReady ? "ready" : "watch",
      proof: closeout.urlStatuses.map((item) => `${item.id}:${item.status}`).join(" / "),
      proofUrl: absoluteUrl(baseUrl, "/api/submission-closeout"),
      acceptance: "ProtoPedia作品URLや動画URLが未発行ならsubmit-readyと言わず、残ギャップとして正直に説明できる。"
    },
    {
      id: "sixty-second-answer-path",
      label: "60s answer path",
      status: timeboxReady && highRiskObjections === 0 && !blockedRecording ? "ready" : timeboxReady ? "watch" : "blocked",
      proof: timeboxReady
        ? `${judgeDrill?.timeboxedAnswer.length} timeboxes / ${highRiskObjections} high-risk objections`
        : `${questionDeck.length} rehearsal questions / Judge Drill timebox missing`,
      proofUrl: absoluteUrl(baseUrl, "/api/judge-drill"),
      acceptance: "どの厳しい質問でも、0-60秒の順番、開く画面、締めの採点軸を固定して答えられる。"
    }
  ];

  const blockedCount = checks.filter((check) => check.status === "blocked").length;
  const defenseScore = Math.round(clamp(average([rehearsalScore, prize.prizeScore, ...checks.map((check) => statusScore(check.status))])));
  const readiness: FinalPitchDefenseReadiness =
    blockedCount > 0
      ? "needs-defense-proof"
      : !allExternalReady || closeout.readiness !== "ready-to-submit" || defenseScore < 92
        ? "external-gap-defense"
        : "defense-ready";
  const answerPath =
    judgeDrill?.timeboxedAnswer.map((step) => `${step.timeRange}: ${step.move} (${step.proof})`) ??
    segments.slice(0, 4).map((segment) => `${segment.timeRange}: ${segment.screen} - ${segment.say}`);

  return {
    id: `final-pitch-defense-${defenseScore}-${readiness}`,
    defenseScore,
    readiness,
    headline:
      readiness === "defense-ready"
        ? "最終質疑は証拠順に答えられます。"
        : readiness === "external-gap-defense"
          ? "質疑の防御線は固まりました。外部提出URLだけをwatchとして残します。"
          : "最終質疑で崩れるblocked証拠があります。",
    hardQuestion: judgeDrill?.hardestQuestion ?? questionDeck[0]?.question ?? "最初の質疑で、どの証拠を開いて答えますか？",
    answerPath,
    checks,
    closingMove:
      readiness === "needs-defense-proof"
        ? checks.find((check) => check.status === "blocked")?.acceptance ?? "Fix blocked final pitch proof."
        : "反論を受けたら、Objection Replay、Pilot Economics、Release Drift、Submission Closeoutの順に戻す。"
  };
}

export function buildJudgeRehearsalRoom(input: {
  baseUrl: string;
  acceptance: JudgeAcceptanceMatrix;
  command: JudgeCommandCenter;
  concierge: DemoConcierge;
  tour: JudgeTour;
  prize: PrizeStrategyBoard;
  closeout: SubmissionCloseoutWorkbench;
  judgeDrill?: JudgeDrill;
}): JudgeRehearsalRoom {
  const { baseUrl, acceptance, command, concierge, tour, prize, closeout, judgeDrill } = input;
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

  const defenseLock = buildDefenseLock({
    baseUrl: base,
    rehearsalScore,
    command,
    prize,
    closeout,
    segments,
    questionDeck,
    scorecard,
    captureChecklist,
    judgeDrill
  });

  const readiness = readinessFrom({
    rehearsalScore,
    acceptance,
    command,
    closeout,
    blockedCount: [...segments, ...questionDeck, ...scorecard, ...captureChecklist, ...defenseLock.checks].filter((item) => item.status === "blocked").length
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
    defenseLock,
    a2aPayload: {
      method: "message/send",
      skill: "judge.rehearsal",
      readiness,
      rehearsalScore,
      nextRun,
      defenseLock: {
        readiness: defenseLock.readiness,
        defenseScore: defenseLock.defenseScore,
        hardQuestion: defenseLock.hardQuestion,
        checks: defenseLock.checks.map((check) => ({
          id: check.id,
          status: check.status,
          proofUrl: check.proofUrl
        }))
      },
      endpoints: {
        rehearsal: absoluteUrl(base, "/api/judge-rehearsal"),
        commandCenter: absoluteUrl(base, "/api/judge-command-center"),
        demoConcierge: absoluteUrl(base, "/api/demo-concierge"),
        judgeDrill: absoluteUrl(base, "/api/judge-drill"),
        submissionCloseout: absoluteUrl(base, "/api/submission-closeout")
      }
    }
  };
}
