import type {
  HomepageOutcomeArtifactSnapshot,
  HomepageOutcomeArtifactStatus,
  HomepageProofEntryAction,
  HomepageProofEntrySnapshot,
  HomepagePublishabilitySnapshot,
  HomepageReviewerHandoffKitSnapshot
} from "./App";
import type { BuyerOutcomeBriefStatus } from "./buyerOutcomeBrief";

export type HomepageOperatorNextMoveStatus = HomepageOutcomeArtifactStatus;

export type HomepageOperatorNextMoveAction = {
  label: string;
  href: string;
  external: boolean;
};

export type HomepageOperatorNextMoveCandidate = {
  id: "proof-route" | "publishability" | "buyer-packet" | "reviewer-handoff";
  label: string;
  status: HomepageOperatorNextMoveStatus;
  owner: string;
  due: string;
  title: string;
  command: string;
  buyerImpact: string;
  evidence: string;
  source: string;
  shareRule: string;
  currentScore: number;
  projectedScore: number;
  scoreDelta: number;
  action: HomepageOperatorNextMoveAction;
  acceptanceCriteria: string[];
};

export type HomepageOperatorNextMoveSnapshot = {
  status: HomepageOperatorNextMoveStatus;
  headline: string;
  summary: string;
  buyer: string;
  readyCount: number;
  blockedCount: number;
  candidateCount: number;
  currentScore: number;
  projectedScore: number;
  scoreDelta: number;
  primaryMove: HomepageOperatorNextMoveCandidate;
  moves: HomepageOperatorNextMoveCandidate[];
  copyText: string;
  exportMarkdown: string;
  markdownHref: string;
  csvText: string;
  csvHref: string;
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function action(input: HomepageProofEntryAction | { label: string; href: string; external?: boolean }): HomepageOperatorNextMoveAction {
  return {
    label: input.label,
    href: input.href,
    external: input.external ?? isExternalHref(input.href)
  };
}

function statusFromOutcome(status: BuyerOutcomeBriefStatus): HomepageOperatorNextMoveStatus {
  if (status === "pass") return "ready";
  if (status === "watch") return "attention";
  return "blocked";
}

function worstStatus(statuses: HomepageOperatorNextMoveStatus[]): HomepageOperatorNextMoveStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function scoreForStatus(status: HomepageOperatorNextMoveStatus) {
  if (status === "ready") return 100;
  if (status === "attention") return 66;
  return 18;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function estimatedLift(currentScore: number, status: HomepageOperatorNextMoveStatus, divisor: number) {
  if (status === "ready") return 0;
  const remaining = Math.max(0, 100 - currentScore);
  const floor = status === "blocked" ? 10 : 5;
  return Math.max(floor, Math.round(remaining / divisor));
}

function compactHref(href: string) {
  if (!href) return "#";
  if (href.startsWith("#")) return href;
  if (href.startsWith("data:")) return "data export";
  try {
    const url = new URL(href, "https://local.invalid");
    const search = url.searchParams.has("workspace") ? url.search : "";
    const path = `${url.pathname}${search}${url.hash}`;
    if (url.origin === "https://local.invalid") return path;
    return `${url.origin}${path}`;
  } catch {
    return href.split("?")[0] || href;
  }
}

function actionTargetLabel(label: string) {
  return label.replace(/^(?:Fix|Review|Open)\s+/i, "").trim() || label;
}

function csvCell(value: string | number) {
  const text = String(value);
  const escaped = text.replace(/"/g, "\"\"");
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function statusPriority(status: HomepageOperatorNextMoveStatus) {
  if (status === "blocked") return 0;
  if (status === "attention") return 1;
  return 2;
}

function sortCandidates(candidates: HomepageOperatorNextMoveCandidate[]) {
  return [...candidates].sort((left, right) => {
    const statusDiff = statusPriority(left.status) - statusPriority(right.status);
    if (statusDiff !== 0) return statusDiff;
    const liftDiff = right.scoreDelta - left.scoreDelta;
    if (liftDiff !== 0) return liftDiff;
    return left.label.localeCompare(right.label);
  });
}

function buildProofRouteCandidate(proofEntry: HomepageProofEntrySnapshot): HomepageOperatorNextMoveCandidate {
  const move = proofEntry.nextMove;
  const currentScore = clampScore(move.impact.currentScore);
  const projectedScore = clampScore(move.impact.projectedScore);
  const scoreDelta = Math.max(0, projectedScore - currentScore);

  return {
    id: "proof-route",
    label: "Proof route",
    status: move.status,
    owner: move.owner,
    due: move.ownerPacket.due,
    title: move.headline,
    command: move.command,
    buyerImpact: move.buyerImpact,
    evidence: move.ownerPacket.proofToAttach,
    source: "Buyer proof room",
    shareRule: move.ownerPacket.shareRule,
    currentScore,
    projectedScore,
    scoreDelta,
    action: action(move.action),
    acceptanceCriteria: move.acceptanceCriteria
  };
}

function buildPublishabilityCandidate(publishability: HomepagePublishabilitySnapshot): HomepageOperatorNextMoveCandidate {
  const firstLift = publishability.releaseLift.actions.find((item) => item.status !== "ready") ?? publishability.releaseLift.actions[0];
  const currentScore = clampScore(publishability.score);
  const projectedScore = clampScore(firstLift?.projectedScore ?? publishability.releaseLift.projectedScoreAfterFirstFix ?? currentScore);
  const status = firstLift?.status ?? publishability.status;
  const scoreDelta = Math.max(0, firstLift?.scoreLift ?? projectedScore - currentScore);
  const label = firstLift?.label ?? "Public release review";
  const href = firstLift?.href ?? publishability.reportAction.href;

  return {
    id: "publishability",
    label: "Global publishability",
    status,
    owner: "Launch owner",
    due: status === "ready" ? "Before broad traffic" : "Before public release",
    title: label,
    command: firstLift ? firstLift.decisionImpact : publishability.reviewerCover.summary,
    buyerImpact: publishability.hardTruth,
    evidence: firstLift?.proofRequired ?? publishability.proofSummary,
    source: "Publishability gate",
    shareRule:
      status === "ready"
        ? "Public release can proceed only with fresh proof verification attached."
        : "Do not route public traffic until the publishability lift is accepted and rechecked.",
    currentScore,
    projectedScore,
    scoreDelta,
    action: action({
      label: status === "ready" ? publishability.reportAction.label : `${status === "blocked" ? "Fix" : "Review"} ${label}`,
      href,
      external: isExternalHref(href)
    }),
    acceptanceCriteria: [
      firstLift?.proofRequired ?? "Publishability report is open and fresh.",
      "Rerun the public release verdict after the owner accepts the lift.",
      "Keep the reviewer cover attached to the release room."
    ]
  };
}

function buildBuyerPacketCandidate(outcomeArtifact: HomepageOutcomeArtifactSnapshot): HomepageOperatorNextMoveCandidate {
  const redLine = outcomeArtifact.redLines.find((item) => item.status === "block") ?? outcomeArtifact.redLines.find((item) => item.status === "watch");
  const status = redLine ? statusFromOutcome(redLine.status) : outcomeArtifact.packet.status;
  const currentScore = clampScore(outcomeArtifact.score);
  const scoreDelta = redLine ? estimatedLift(currentScore, status, 4) : 0;
  const projectedScore = clampScore(currentScore + scoreDelta);
  const href = redLine?.href ?? outcomeArtifact.primaryAction.href;
  const title = redLine?.label ?? outcomeArtifact.packet.headline;
  const command = redLine?.action ?? outcomeArtifact.decisionAsk;

  return {
    id: "buyer-packet",
    label: "Buyer packet",
    status,
    owner: redLine?.owner ?? "Sponsor",
    due: "Before buyer packet leaves workspace",
    title,
    command,
    buyerImpact: outcomeArtifact.valueClaim,
    evidence: outcomeArtifact.packet.summary,
    source: "Buyer outcome artifact",
    shareRule:
      status === "ready"
        ? "Send only with packet receipt, launch room, and proof route attached."
        : `Hold the buyer packet until ${title.toLowerCase()} is accepted.`,
    currentScore,
    projectedScore,
    scoreDelta,
    action: action({
      label: status === "ready" ? outcomeArtifact.primaryAction.label : `${status === "blocked" ? "Fix" : "Review"} ${title}`,
      href,
      external: isExternalHref(href)
    }),
    acceptanceCriteria: [
      command,
      "Packet receipt remains checksum-verifiable after the change.",
      "Buyer brief and launch room point at the same proof route."
    ]
  };
}

function buildReviewerHandoffCandidate(reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot): HomepageOperatorNextMoveCandidate {
  const step = reviewerHandoffKit.steps.find((item) => item.status === "blocked") ?? reviewerHandoffKit.steps.find((item) => item.status === "attention");
  const status = step?.status ?? reviewerHandoffKit.status;
  const currentScore = clampScore((reviewerHandoffKit.readyCount / Math.max(1, reviewerHandoffKit.steps.length)) * 100);
  const scoreDelta = step ? estimatedLift(currentScore, status, Math.max(2, reviewerHandoffKit.steps.length)) : 0;
  const projectedScore = clampScore(currentScore + scoreDelta);
  const href = step?.href ?? reviewerHandoffKit.primaryAction.href;
  const title = step ? actionTargetLabel(step.actionLabel || step.label) : reviewerHandoffKit.headline;

  return {
    id: "reviewer-handoff",
    label: "Reviewer handoff",
    status,
    owner: step?.owner ?? "Reviewer",
    due: status === "ready" ? "Before reviewer opens the kit" : "Before external review",
    title,
    command: step?.actionLabel ?? reviewerHandoffKit.primaryAction.label,
    buyerImpact: reviewerHandoffKit.reviewAnswer,
    evidence: step?.evidence ?? reviewerHandoffKit.summary,
    source: "Reviewer kit",
    shareRule: status === "ready" ? reviewerHandoffKit.sendRule : reviewerHandoffKit.holdRule,
    currentScore,
    projectedScore,
    scoreDelta,
    action: action({
      label: step?.actionLabel ?? reviewerHandoffKit.primaryAction.label,
      href,
      external: isExternalHref(href)
    }),
    acceptanceCriteria: [
      step?.evidence ?? reviewerHandoffKit.sendRule,
      "Reviewer can answer the decision question without a private walkthrough.",
      "Send rule and hold rule stay visible in the kit."
    ]
  };
}

function headlineFor(move: HomepageOperatorNextMoveCandidate, status: HomepageOperatorNextMoveStatus) {
  if (status === "ready") return "Operator queue is clear for buyer review";
  if (status === "attention") return `${move.owner} should review the next release move`;
  return `${move.owner} owns the next blocking move`;
}

function summaryFor(input: { buyer: string; move: HomepageOperatorNextMoveCandidate; status: HomepageOperatorNextMoveStatus }) {
  if (input.status === "ready") {
    return `${input.buyer} can receive the room with proof, packet, reviewer handoff, and release route attached.`;
  }
  if (input.status === "attention") {
    return `${input.move.label} is close, but ${input.move.owner} should accept ${input.move.title.toLowerCase()} before external sharing.`;
  }
  return `${input.buyer} should stay internal until ${input.move.owner} closes ${input.move.title.toLowerCase()} and reruns the proof route.`;
}

function buildMarkdown(snapshot: Omit<HomepageOperatorNextMoveSnapshot, "copyText" | "exportMarkdown" | "markdownHref" | "csvText" | "csvHref">) {
  return [
    "# Operator next move",
    "",
    `Status: ${snapshot.status}`,
    `Buyer: ${snapshot.buyer}`,
    `Primary owner: ${snapshot.primaryMove.owner}`,
    `Primary move: ${snapshot.primaryMove.label} - ${snapshot.primaryMove.title}`,
    `Action: ${snapshot.primaryMove.action.label} (${compactHref(snapshot.primaryMove.action.href)})`,
    `Score lift: ${snapshot.currentScore}/100 -> ${snapshot.projectedScore}/100 (+${snapshot.scoreDelta})`,
    `Ready lanes: ${snapshot.readyCount}/${snapshot.candidateCount}`,
    `Blocked lanes: ${snapshot.blockedCount}`,
    "",
    snapshot.headline,
    snapshot.summary,
    "",
    "## Owner command",
    snapshot.primaryMove.command,
    "",
    "## Buyer impact",
    snapshot.primaryMove.buyerImpact,
    "",
    "## Share rule",
    snapshot.primaryMove.shareRule,
    "",
    "## Acceptance criteria",
    ...snapshot.primaryMove.acceptanceCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Candidate queue",
    ...snapshot.moves.map(
      (move) =>
        `- [${move.status}] ${move.label} (${move.owner}): ${move.title}. +${move.scoreDelta} to ${move.projectedScore}/100. Action: ${move.action.label} (${compactHref(move.action.href)})`
    )
  ].join("\n");
}

function buildCsv(moves: HomepageOperatorNextMoveCandidate[]) {
  const rows = [
    ["moveId", "status", "owner", "due", "title", "command", "scoreDelta", "projectedScore", "source", "actionHref"],
    ...moves.map((move) => [
      move.id,
      move.status,
      move.owner,
      move.due,
      move.title,
      move.command,
      move.scoreDelta,
      move.projectedScore,
      move.source,
      compactHref(move.action.href)
    ])
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function buildHomepageOperatorNextMove({
  proofEntry,
  publishability,
  outcomeArtifact,
  reviewerHandoffKit
}: {
  proofEntry: HomepageProofEntrySnapshot;
  publishability: HomepagePublishabilitySnapshot;
  outcomeArtifact: HomepageOutcomeArtifactSnapshot;
  reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
}): HomepageOperatorNextMoveSnapshot {
  const moves = sortCandidates([
    buildProofRouteCandidate(proofEntry),
    buildPublishabilityCandidate(publishability),
    buildBuyerPacketCandidate(outcomeArtifact),
    buildReviewerHandoffCandidate(reviewerHandoffKit)
  ]);
  const primaryMove = moves[0];
  const status = worstStatus(moves.map((move) => move.status));
  const readyCount = moves.filter((move) => move.status === "ready").length;
  const blockedCount = moves.filter((move) => move.status === "blocked").length;
  const currentScore = primaryMove.currentScore ?? scoreForStatus(primaryMove.status);
  const projectedScore = primaryMove.projectedScore ?? currentScore;
  const partial: Omit<HomepageOperatorNextMoveSnapshot, "copyText" | "exportMarkdown" | "markdownHref" | "csvText" | "csvHref"> = {
    status,
    headline: headlineFor(primaryMove, status),
    summary: summaryFor({ buyer: proofEntry.buyer, move: primaryMove, status }),
    buyer: proofEntry.buyer,
    readyCount,
    blockedCount,
    candidateCount: moves.length,
    currentScore,
    projectedScore,
    scoreDelta: Math.max(0, projectedScore - currentScore),
    primaryMove,
    moves
  };
  const exportMarkdown = buildMarkdown(partial);
  const csvText = buildCsv(moves);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown,
    markdownHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    csvText,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`
  };
}
