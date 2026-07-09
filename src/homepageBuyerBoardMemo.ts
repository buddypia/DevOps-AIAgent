import type { HomepageValueLensSnapshot, HomepageValueLensStatus } from "./HomepageValueLens";
import type { HomepageOutcomeArtifactSnapshot, HomepageProofEntrySnapshot, HomepageReviewerHandoffKitSnapshot } from "./AppHome";

export type HomepageBuyerBoardMemoStatus = HomepageValueLensStatus;

export type HomepageBuyerBoardMemoAction = {
  label: string;
  href: string;
  external: boolean;
};

export type HomepageBuyerBoardMemoMetric = {
  id: "value-at-stake" | "proof-gate" | "packet" | "receipt";
  label: string;
  value: string;
  evidence: string;
  status: HomepageBuyerBoardMemoStatus;
};

export type HomepageBuyerBoardMemoQuestion = {
  id: "worth-pilot" | "proof-open" | "what-sent" | "next-decision";
  question: string;
  answer: string;
  evidence: string;
  href: string;
  status: HomepageBuyerBoardMemoStatus;
};

export type HomepageBuyerBoardMemoSnapshot = {
  status: HomepageBuyerBoardMemoStatus;
  buyer: string;
  decisionLabel: string;
  headline: string;
  summary: string;
  boardScore: number;
  valueAtStakeYen: number;
  proofScore: number;
  readyProofCount: number;
  proofTotal: number;
  packetReadyCount: number;
  packetTotal: number;
  receiptId: string;
  primaryAction: HomepageBuyerBoardMemoAction;
  secondaryAction: HomepageBuyerBoardMemoAction;
  metrics: HomepageBuyerBoardMemoMetric[];
  questions: HomepageBuyerBoardMemoQuestion[];
  exportMarkdown: string;
};

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function memoAction(action: { label: string; href: string; external?: boolean }): HomepageBuyerBoardMemoAction {
  return {
    label: action.label,
    href: action.href,
    external: action.external ?? isExternalHref(action.href)
  };
}

function worstStatus(statuses: HomepageBuyerBoardMemoStatus[]): HomepageBuyerBoardMemoStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function statusScore(status: HomepageBuyerBoardMemoStatus) {
  if (status === "ready") return 100;
  if (status === "attention") return 72;
  return 38;
}

function metricStatus(ready: number, total: number): HomepageBuyerBoardMemoStatus {
  if (total <= 0) return "blocked";
  if (ready >= total) return "ready";
  if (ready > 0) return "attention";
  return "blocked";
}

function decisionLabelFor(status: HomepageBuyerBoardMemoStatus) {
  if (status === "ready") return "Approve bounded pilot";
  if (status === "attention") return "Review with sponsor";
  return "Hold external send";
}

function headlineFor(status: HomepageBuyerBoardMemoStatus) {
  if (status === "ready") return "What the buyer can decide from this room";
  if (status === "attention") return "What still needs sponsor review";
  return "Why this room should stay internal";
}

function summaryFor(status: HomepageBuyerBoardMemoStatus, buyer: string) {
  if (status === "ready") return `${buyer} can inspect value, proof, packet, and receipt before approving the first pilot.`;
  if (status === "attention") return `${buyer} has a credible memo, but one review item should be accepted before external sharing.`;
  return `${buyer} should see the repair owner before any public or buyer-facing send.`;
}

function compactHref(href: string) {
  if (!href) return "#";
  if (href.startsWith("#")) return href;
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

function buildMarkdown(snapshot: Omit<HomepageBuyerBoardMemoSnapshot, "exportMarkdown">) {
  return [
    "# Buyer board memo",
    "",
    `Buyer: ${snapshot.buyer}`,
    `Decision: ${snapshot.decisionLabel}`,
    `Status: ${snapshot.status}`,
    `Board score: ${snapshot.boardScore}/100`,
    `Value at stake: ${yen(snapshot.valueAtStakeYen)}`,
    `Proof: ${snapshot.readyProofCount}/${snapshot.proofTotal} ready, ${snapshot.proofScore}/100`,
    `Packet: ${snapshot.packetReadyCount}/${snapshot.packetTotal} ready`,
    `Receipt: ${snapshot.receiptId}`,
    "",
    snapshot.headline,
    snapshot.summary,
    "",
    "## Board metrics",
    ...snapshot.metrics.map((metric) => `- [${metric.status}] ${metric.label}: ${metric.value}. ${metric.evidence}`),
    "",
    "## Buyer questions",
    ...snapshot.questions.map((question) => `- [${question.status}] ${question.question} ${question.answer} Evidence: ${question.evidence} Link: ${compactHref(question.href)}`),
    "",
    `Primary action: ${snapshot.primaryAction.label} (${compactHref(snapshot.primaryAction.href)})`,
    `Secondary action: ${snapshot.secondaryAction.label} (${compactHref(snapshot.secondaryAction.href)})`
  ].join("\n");
}

export function buildHomepageBuyerBoardMemo({
  valueLens,
  proofEntry,
  outcomeArtifact,
  reviewerHandoffKit
}: {
  valueLens: HomepageValueLensSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
  outcomeArtifact: HomepageOutcomeArtifactSnapshot;
  reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
}): HomepageBuyerBoardMemoSnapshot {
  const status = worstStatus([valueLens.status, proofEntry.status, outcomeArtifact.status, reviewerHandoffKit.status]);
  const proofTotal = proofEntry.items.length;
  const packetTotal = outcomeArtifact.packet.itemCount;
  const packetStatus = metricStatus(outcomeArtifact.packet.readyCount, packetTotal);
  const receiptStatus = outcomeArtifact.packet.receipt.verification.status === "verified" ? outcomeArtifact.packet.status : "blocked";
  const valueAtStakeYen = Math.max(valueLens.measuredMonthlyValueYen, valueLens.monthlyValueYen);
  const boardScore = Math.round(
    (statusScore(valueLens.status) + statusScore(proofEntry.status) + statusScore(packetStatus) + statusScore(reviewerHandoffKit.status)) / 4
  );
  const primaryAction =
    status === "ready"
      ? memoAction(reviewerHandoffKit.primaryAction)
      : status === "attention"
        ? memoAction(outcomeArtifact.primaryAction)
        : memoAction(proofEntry.nextMove.action);
  const secondaryAction = memoAction({
    label: "Verify receipt",
    href: `/receipt-verifier?${new URLSearchParams({ request: outcomeArtifact.packet.receipt.verificationRequestJson, verify: "1" }).toString()}`
  });
  const metrics: HomepageBuyerBoardMemoMetric[] = [
    {
      id: "value-at-stake",
      label: "Value at stake",
      value: `${yen(valueAtStakeYen)} / month`,
      evidence: `${yen(valueLens.measuredMonthlyValueYen)} measured support, ${valueLens.measuredSupportPercent}% of model, ${valueLens.paybackDays} day payback.`,
      status: valueLens.status
    },
    {
      id: "proof-gate",
      label: "Proof gate",
      value: `${proofEntry.readyCount}/${proofTotal} ready`,
      evidence: `${proofEntry.proofScore}/100 proof score. ${proofEntry.nextMove.headline}.`,
      status: proofEntry.status
    },
    {
      id: "packet",
      label: "Buyer packet",
      value: `${outcomeArtifact.packet.readyCount}/${packetTotal} artifacts`,
      evidence: outcomeArtifact.packet.summary,
      status: packetStatus
    },
    {
      id: "receipt",
      label: "Receipt replay",
      value: outcomeArtifact.packet.receipt.receiptId,
      evidence: `Checksum ${outcomeArtifact.packet.receipt.checksumAlgorithm}:${outcomeArtifact.packet.receipt.checksum}, ${outcomeArtifact.packet.receipt.verification.status}.`,
      status: receiptStatus
    }
  ];
  const questions: HomepageBuyerBoardMemoQuestion[] = [
    {
      id: "worth-pilot",
      question: "Is this worth a pilot?",
      answer: valueLens.readinessCoach.buyerAsk,
      evidence: valueLens.valueClaim,
      href: valueLens.primaryAction.href,
      status: valueLens.status
    },
    {
      id: "proof-open",
      question: "Can the proof be opened?",
      answer: proofEntry.status === "ready" ? "Yes. The proof room is ready to inspect." : proofEntry.nextMove.command,
      evidence: `${proofEntry.readyCount}/${proofTotal} proof items ready, ${proofEntry.blockedCount} blocked.`,
      href: proofEntry.primaryAction.href,
      status: proofEntry.status
    },
    {
      id: "what-sent",
      question: "What exactly gets sent?",
      answer: outcomeArtifact.packet.headline,
      evidence: outcomeArtifact.packet.summary,
      href: outcomeArtifact.primaryAction.href,
      status: outcomeArtifact.status
    },
    {
      id: "next-decision",
      question: "Who decides next?",
      answer: reviewerHandoffKit.reviewAnswer,
      evidence: reviewerHandoffKit.sendRule,
      href: reviewerHandoffKit.primaryAction.href,
      status: reviewerHandoffKit.status
    }
  ];
  const partial: Omit<HomepageBuyerBoardMemoSnapshot, "exportMarkdown"> = {
    status,
    buyer: valueLens.buyer,
    decisionLabel: decisionLabelFor(status),
    headline: headlineFor(status),
    summary: summaryFor(status, valueLens.buyer),
    boardScore,
    valueAtStakeYen,
    proofScore: proofEntry.proofScore,
    readyProofCount: proofEntry.readyCount,
    proofTotal,
    packetReadyCount: outcomeArtifact.packet.readyCount,
    packetTotal,
    receiptId: outcomeArtifact.packet.receipt.receiptId,
    primaryAction,
    secondaryAction,
    metrics,
    questions
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}
