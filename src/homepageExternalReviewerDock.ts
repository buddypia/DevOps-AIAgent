import type {
  HomepageOutcomeArtifactAction,
  HomepageOutcomeArtifactSnapshot,
  HomepageOutcomeArtifactStatus,
  HomepageProofEntrySnapshot,
  HomepageReviewerHandoffKitSnapshot
} from "./App";

export type HomepageExternalReviewerDockItem = {
  id: "review-kit" | "packet-verifier" | "decision-receipt" | "acceptance-path";
  label: string;
  status: HomepageOutcomeArtifactStatus;
  title: string;
  evidence: string;
  href: string;
  actionLabel: string;
};

export type HomepageExternalReviewerDockSnapshot = {
  status: HomepageOutcomeArtifactStatus;
  headline: string;
  summary: string;
  buyer: string;
  decision: HomepageOutcomeArtifactSnapshot["decision"];
  reviewQuestion: string;
  score: number;
  readyCount: number;
  itemCount: number;
  sendRule: string;
  primaryAction: HomepageOutcomeArtifactAction;
  verifierAction: HomepageOutcomeArtifactAction;
  verifierRequestKey: string;
  verifierRequestJson: string;
  verifierFallbackHref: string;
  items: HomepageExternalReviewerDockItem[];
  exportMarkdown: string;
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function compactHref(href: string) {
  if (href.startsWith("data:")) return "inline-data";
  try {
    const url = new URL(href, "https://example.test");
    return `${url.pathname}${url.hash}`;
  } catch {
    return href;
  }
}

function actionFor(action: { label: string; href: string; external?: boolean }): HomepageOutcomeArtifactAction {
  return {
    label: action.label,
    href: action.href,
    external: action.external ?? isExternalHref(action.href)
  };
}

function worstStatus(statuses: HomepageOutcomeArtifactStatus[]): HomepageOutcomeArtifactStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function externalReviewerDockHeadline(status: HomepageOutcomeArtifactStatus) {
  if (status === "ready") return "External reviewer can inspect the decision path";
  if (status === "attention") return "External review is visible with one watch item";
  return "External review stays blocked with the reason named";
}

function externalReviewerDockSummary(status: HomepageOutcomeArtifactStatus, buyer: string) {
  if (status === "ready") {
    return `${buyer} can open the review kit, verify the packet receipt, inspect the decision receipt, and follow the acceptance path without a private walkthrough.`;
  }
  if (status === "attention") {
    return `${buyer} can see the review route, but the owner confirmation remains attached before the room is sent.`;
  }
  return `${buyer} gets a no-send explanation first, with the proof repair route and verifier attached instead of a sales promise.`;
}

function externalReviewerReceiptDeskHref(requestJson: string) {
  const params = new URLSearchParams({
    request: requestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

function buildExternalReviewerDockMarkdown(snapshot: Omit<HomepageExternalReviewerDockSnapshot, "exportMarkdown">) {
  return [
    "# External reviewer dock",
    "",
    `Status: ${snapshot.status}`,
    `Buyer: ${snapshot.buyer}`,
    `Decision: ${snapshot.decision}`,
    `Score: ${snapshot.score}/100`,
    `Ready surfaces: ${snapshot.readyCount}/${snapshot.itemCount}`,
    `Primary action: ${snapshot.primaryAction.label} (${compactHref(snapshot.primaryAction.href)})`,
    `Verifier: ${snapshot.verifierAction.label} (${compactHref(snapshot.verifierAction.href)})`,
    "",
    snapshot.headline,
    snapshot.summary,
    "",
    "## Reviewer question",
    snapshot.reviewQuestion,
    "",
    "## Send rule",
    snapshot.sendRule,
    "",
    "## Review surfaces",
    ...snapshot.items.map(
      (item) => `- [${item.status}] ${item.label}: ${item.title}. ${item.evidence} Action: ${item.actionLabel} (${compactHref(item.href)})`
    )
  ].join("\n");
}

export function buildHomepageExternalReviewerDockSnapshot({
  artifact,
  proofEntry,
  reviewerKit
}: {
  artifact: HomepageOutcomeArtifactSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
  reviewerKit: HomepageReviewerHandoffKitSnapshot;
}): HomepageExternalReviewerDockSnapshot {
  const status = worstStatus([artifact.status, proofEntry.status, reviewerKit.status]);
  const verifierRequestKey = artifact.packet.receipt.receiptId;
  const verifierFallbackHref = externalReviewerReceiptDeskHref(artifact.packet.receipt.verificationRequestJson);
  const verifierAction = actionFor({
    label: "Verify packet",
    href: verifierFallbackHref
  });
  const primaryAction = status === "ready" ? reviewerKit.primaryAction : reviewerKit.proofAction;
  const sendRule =
    status === "ready"
      ? "Send the room only when the review kit, packet verifier, decision receipt, and acceptance path are all attached."
      : `Hold external review until ${proofEntry.nextMove.headline.toLowerCase()}.`;
  const items: HomepageExternalReviewerDockItem[] = [
    {
      id: "review-kit",
      label: "Review kit",
      status: reviewerKit.status,
      title: reviewerKit.headline,
      evidence: reviewerKit.summary,
      href: reviewerKit.primaryAction.href,
      actionLabel: reviewerKit.primaryAction.label
    },
    {
      id: "packet-verifier",
      label: "Packet verifier",
      status: artifact.packet.status,
      title: `${artifact.packet.readyCount}/${artifact.packet.itemCount} packet artifacts`,
      evidence: `Receipt ${artifact.packet.receipt.receiptId} verifies with ${artifact.packet.receipt.checksumAlgorithm}:${artifact.packet.receipt.checksum}.`,
      href: verifierAction.href,
      actionLabel: verifierAction.label
    },
    {
      id: "decision-receipt",
      label: "Decision receipt",
      status: proofEntry.status,
      title: proofEntry.decisionHandoff.decisionReceipt.label,
      evidence: proofEntry.decisionHandoff.guardrail,
      href: proofEntry.decisionHandoff.decisionReceipt.href,
      actionLabel: proofEntry.decisionHandoff.decisionReceipt.label
    },
    {
      id: "acceptance-path",
      label: "Acceptance path",
      status: proofEntry.status,
      title: proofEntry.decisionHandoff.acceptancePath.label,
      evidence: proofEntry.nextMove.buyerImpact,
      href: proofEntry.decisionHandoff.acceptancePath.href,
      actionLabel: proofEntry.decisionHandoff.acceptancePath.label
    }
  ];
  const partial: Omit<HomepageExternalReviewerDockSnapshot, "exportMarkdown"> = {
    status,
    headline: externalReviewerDockHeadline(status),
    summary: externalReviewerDockSummary(status, artifact.buyer),
    buyer: artifact.buyer,
    decision: artifact.decision,
    reviewQuestion: reviewerKit.reviewQuestion,
    score: Math.round((artifact.score + proofEntry.proofScore + Math.round((reviewerKit.readyCount / reviewerKit.steps.length) * 100)) / 3),
    readyCount: items.filter((item) => item.status === "ready").length,
    itemCount: items.length,
    sendRule,
    primaryAction,
    verifierAction,
    verifierRequestKey,
    verifierRequestJson: artifact.packet.receipt.verificationRequestJson,
    verifierFallbackHref,
    items
  };

  return {
    ...partial,
    exportMarkdown: buildExternalReviewerDockMarkdown(partial)
  };
}
