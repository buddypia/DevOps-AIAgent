import type { JudgeAcceptanceMatrix } from "./acceptanceMatrix.js";
import type { CompetitiveBattlecard } from "./competitiveBattlecard.js";
import type { JudgeRehearsalRoom, JudgeRehearsalStatus } from "./judgeRehearsal.js";
import type { PilotEconomics } from "./pilotEconomics.js";
import type { PrizeCriterion, PrizeStrategyBoard } from "./prizeStrategy.js";
import type { SubmissionCloseoutWorkbench } from "./submissionCloseout.js";

export type WinnerPacketReadiness = "winner-packet-ready" | "external-gap-packet" | "needs-proof";
export type WinnerPacketStatus = "ready" | "watch" | "blocked";

export type WinnerCriterionPacket = {
  id: string;
  label: string;
  status: WinnerPacketStatus;
  score: number;
  target: number;
  judgeLine: string;
  proofUrl: string;
  show: string;
  objection: string;
  answer: string;
  recordingCue: string;
};

export type WinnerQuestionPacket = {
  id: string;
  question: string;
  answer: string;
  proofUrl: string;
  status: WinnerPacketStatus;
};

export type WinnerPacketSubmissionCopy = {
  oneLine: string;
  winnerThesis: string;
  proofOrder: string[];
  missingExternal: string[];
  tags: string[];
};

export type WinnerProofPacket = {
  id: string;
  packetScore: number;
  readiness: WinnerPacketReadiness;
  headline: string;
  hardTruth: string;
  nextAction: string;
  criteria: WinnerCriterionPacket[];
  judgeQuestions: WinnerQuestionPacket[];
  recordingOrder: Array<{ id: string; timeRange: string; screen: string; proofUrl: string; status: WinnerPacketStatus }>;
  submissionCopy: WinnerPacketSubmissionCopy;
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

function statusFromScore(score: number): WinnerPacketStatus {
  if (score >= 86) return "ready";
  if (score >= 74) return "watch";
  return "blocked";
}

function statusFromRehearsal(status: JudgeRehearsalStatus): WinnerPacketStatus {
  return status;
}

function criterionById(prize: PrizeStrategyBoard, id: string): PrizeCriterion | undefined {
  return prize.criteria.find((criterion) => criterion.id === id);
}

function criterionPacket(input: {
  baseUrl: string;
  prize: PrizeStrategyBoard;
  id: string;
  label: string;
  proofPath: string;
  show: string;
  objection: string;
  answer: string;
  recordingCue: string;
}): WinnerCriterionPacket {
  const criterion = criterionById(input.prize, input.id);
  const score = criterion?.currentScore ?? input.prize.prizeScore;
  const target = criterion?.targetScore ?? 92;
  return {
    id: input.id,
    label: input.label,
    status: statusFromScore(score),
    score,
    target,
    judgeLine: criterion?.decisiveProof ?? input.answer,
    proofUrl: absoluteUrl(input.baseUrl, input.proofPath),
    show: input.show,
    objection: input.objection,
    answer: input.answer,
    recordingCue: input.recordingCue
  };
}

function readinessFrom(input: {
  packetScore: number;
  acceptance: JudgeAcceptanceMatrix;
  closeout: SubmissionCloseoutWorkbench;
  criteria: WinnerCriterionPacket[];
}): WinnerPacketReadiness {
  if (input.acceptance.verdict === "not-accepted" || input.criteria.some((criterion) => criterion.status === "blocked")) return "needs-proof";
  if (input.closeout.readiness !== "ready-to-submit" || input.acceptance.verdict === "accepted-with-external-gaps") return "external-gap-packet";
  return input.packetScore >= 90 ? "winner-packet-ready" : "external-gap-packet";
}

export function buildWinnerProofPacket(input: {
  baseUrl: string;
  acceptance: JudgeAcceptanceMatrix;
  battlecard: CompetitiveBattlecard;
  pilotEconomics: PilotEconomics;
  prize: PrizeStrategyBoard;
  rehearsal: JudgeRehearsalRoom;
  closeout: SubmissionCloseoutWorkbench;
}): WinnerProofPacket {
  const { baseUrl, acceptance, battlecard, pilotEconomics, prize, rehearsal, closeout } = input;
  const base = baseUrl.replace(/\/$/, "");
  const strongestBattlecard = [...battlecard.cards].sort((left, right) => right.score - left.score)[0];
  const highestBuyerObjection = pilotEconomics.buyerObjections[0];
  const criteria: WinnerCriterionPacket[] = [
    criterionPacket({
      baseUrl: base,
      prize,
      id: "agent-centrality",
      label: "AI agent centrality",
      proofPath: "/.well-known/agent-card.json",
      show: "Agent CardとA2A artifactを開き、AI能力の探索、購入判断、委任、検収が主操作であることを見せる。",
      objection: "これは単なるダッシュボードでは？",
      answer: "市場探索、契約、A2A委任、検証、運用、提出までをAIの判断連鎖として返します。",
      recordingCue: "最初の10秒でAgent Cardのskill surfaceとA2A payloadを見せる。"
    }),
    criterionPacket({
      baseUrl: base,
      prize,
      id: "approach",
      label: "Problem approach",
      proofPath: "/api/competitive-battlecard",
      show: "Competitive Battlecardで公式ソース、SWOT receipt、競合反論を開く。",
      objection: strongestBattlecard?.judgeQuestion ?? "ADKやCrewAIで十分では？",
      answer: strongestBattlecard?.shortAnswer ?? battlecard.thesis,
      recordingCue: strongestBattlecard?.recordingCue ?? "Battlecardの最上位カードを30秒以内に開く。"
    }),
    criterionPacket({
      baseUrl: base,
      prize,
      id: "usability",
      label: "Usability",
      proofPath: "/api/judge-rehearsal",
      show: "Judge RehearsalのsegmentsとQuestion Deckで、審査員がどこを押せばよいかを固定する。",
      objection: "機能が多すぎて初見では迷うのでは？",
      answer: "最初の90秒をsegments、proof URL、想定質問に分解し、機能一覧ではなく証拠順に進めます。",
      recordingCue: "Judge Rehearsal Roomの0-90s segmentsをそのまま動画本編にする。"
    }),
    criterionPacket({
      baseUrl: base,
      prize,
      id: "practicality",
      label: "Practical value",
      proofPath: "/api/pilot-economics",
      show: "Pilot Economicsでpayback days、価格レーン、買い手反論を見せる。",
      objection: highestBuyerObjection?.objection ?? "現場価値はスコアだけでは？",
      answer: highestBuyerObjection?.answer ?? pilotEconomics.verdict,
      recordingCue: `${pilotEconomics.unitEconomics.paybackDays}d paybackをbuyer laneで読み上げる。`
    }),
    criterionPacket({
      baseUrl: base,
      prize,
      id: "implementation",
      label: "Implementation",
      proofPath: "/api/release-drift",
      show: "Release Drift Guard、GitHub Actions、Cloud Run revisionを見せる。",
      objection: "提出URLは本当に最新実装ですか？",
      answer: "Agent Card、A2A artifact、Acceptance Matrixを公開URLで再プローブし、古いrevisionなら提出前に止めます。",
      recordingCue: "Release Drift Guardのrelease-currentとskill countを最後に開く。"
    })
  ];

  const judgeQuestions: WinnerQuestionPacket[] = [
    ...rehearsal.questionDeck.slice(0, 4).map((question) => ({
      id: question.id,
      question: question.question,
      answer: question.answer,
      proofUrl: question.proofUrl,
      status: statusFromRehearsal(question.status)
    })),
    ...battlecard.topRisks.slice(0, 2).map((risk) => ({
      id: `battlecard-${risk.id}`,
      question: risk.risk,
      answer: risk.response,
      proofUrl: absoluteUrl(base, "/api/competitive-battlecard"),
      status: risk.severity === "high" ? ("watch" as const) : ("ready" as const)
    }))
  ];

  const externalGaps = closeout.urlStatuses.filter((item) => item.status !== "ready").map((item) => item.id);
  const packetScore = Math.round(
    clamp(
      average([acceptance.acceptanceScore, battlecard.battleScore, pilotEconomics.economicsScore, prize.prizeScore, rehearsal.rehearsalScore, closeout.closeoutScore]) +
        (criteria.every((criterion) => criterion.status === "ready") ? 3 : 0) -
        Math.min(5, externalGaps.length * 2)
    )
  );
  const readiness = readinessFrom({ packetScore, acceptance, closeout, criteria });
  const nextAction =
    readiness === "needs-proof"
      ? (criteria.find((criterion) => criterion.status === "blocked")?.show ?? "Fix blocked winner proof")
      : readiness === "external-gap-packet"
        ? closeout.nextAction.label
        : "Record the winner packet and submit the three URLs";

  return {
    id: `winner-packet-${packetScore}-${readiness}`,
    packetScore,
    readiness,
    headline:
      readiness === "winner-packet-ready"
        ? "審査5項目の勝ち証拠を1枚で提示できます。"
        : readiness === "external-gap-packet"
          ? "勝ち証拠は揃っています。外部URLだけを正直にwatchとして残します。"
          : "勝ち証拠のどれかがblockedです。録画前に補強が必要です。",
    hardTruth:
      "優勝作戦は機能数ではなく、審査5項目それぞれに短い主張、開く証拠URL、反論への回答、録画cueが揃っているかで決まります。",
    nextAction,
    criteria,
    judgeQuestions,
    recordingOrder: rehearsal.segments.map((segment) => ({
      id: segment.id,
      timeRange: segment.timeRange,
      screen: segment.screen,
      proofUrl: segment.proofUrl,
      status: statusFromRehearsal(segment.status)
    })),
    submissionCopy: {
      oneLine: "AI能力を市場から選び、雇い、A2Aで委任し、Cloud Run運用と提出証拠まで閉じるDevOpsエージェント。",
      winnerThesis: prize.winHypothesis,
      proofOrder: criteria.map((criterion) => `${criterion.label}: ${criterion.proofUrl}`),
      missingExternal: externalGaps,
      tags: ["findy_hackathon", "Cloud Run", "Gemini", "A2A", "DevOps"]
    },
    a2aPayload: {
      method: "message/send",
      skill: "winner.packet",
      packetScore,
      readiness,
      nextAction,
      criteria: criteria.map((criterion) => ({
        id: criterion.id,
        status: criterion.status,
        proofUrl: criterion.proofUrl
      })),
      endpoints: {
        winnerPacket: absoluteUrl(base, "/api/winner-packet"),
        judgeRehearsal: absoluteUrl(base, "/api/judge-rehearsal"),
        competitiveBattlecard: absoluteUrl(base, "/api/competitive-battlecard"),
        pilotEconomics: absoluteUrl(base, "/api/pilot-economics"),
        submissionCloseout: absoluteUrl(base, "/api/submission-closeout")
      }
    }
  };
}
