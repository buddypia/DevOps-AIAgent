import type { QuickBuyerDecisionReplyRecord, QuickBuyerRoomPreviewStatus } from "./QuickWorkflowIntakePanel";

export type QuickBuyerDecisionReplyHandoffStep = {
  id: string;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  action: string;
  evidence: string;
  href: string;
};

export type QuickBuyerDecisionReplyHandoff = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  openCount: number;
  copyText: string;
  steps: QuickBuyerDecisionReplyHandoffStep[];
};

function mergeHandoffStatus(statuses: QuickBuyerRoomPreviewStatus[]): QuickBuyerRoomPreviewStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("watch")) return "watch";
  return "ready";
}

function decisionHeadline(record: QuickBuyerDecisionReplyRecord) {
  if (record.decision === "continue") return "Buyer reply is ready for owner execution";
  if (record.decision === "revise") return "Buyer reply becomes a repair handoff";
  return "Buyer reply is preserved as a closeout packet";
}

export function buildQuickBuyerDecisionReplyHandoff(record: QuickBuyerDecisionReplyRecord): QuickBuyerDecisionReplyHandoff {
  const verificationStatus: QuickBuyerRoomPreviewStatus = record.receipt.verification.status === "verified" ? "ready" : "blocked";
  const activationSteps = record.activation.items.map((item, index) => ({
    id: `activation-${item.id}`,
    label: index === 0 ? "First owner task" : "Owner task",
    status: item.status,
    owner: item.owner,
    action: item.command,
    evidence: item.evidence,
    href: item.href
  }));
  const steps: QuickBuyerDecisionReplyHandoffStep[] = [
    {
      id: "decision",
      label: "Decision locked",
      status: record.status,
      owner: "Buyer",
      action: `${record.label} at ${record.confidence}/100 confidence.`,
      evidence: `Matched signals: ${record.matchedSignals.join(", ")}`,
      href: record.receiptHref
    },
    ...activationSteps,
    {
      id: "verify",
      label: "Proof trail",
      status: verificationStatus,
      owner: "Review coordinator",
      action: "Verify the reply receipt before updating the review kit or acceptance path.",
      evidence: `${record.receipt.receiptId} / ${record.receipt.checksumAlgorithm}:${record.receipt.checksum}`,
      href: record.verifierHref
    }
  ];
  const status = mergeHandoffStatus(steps.map((step) => step.status));
  const openCount = steps.filter((step) => step.status !== "ready").length;
  const copyText = [
    "# Buyer reply action packet",
    "",
    `Decision: ${record.label}`,
    `Detected: ${record.decision} / ${record.confidence}/100 confidence`,
    `Next owner: ${record.nextOwner}`,
    `Next action: ${record.nextAction}`,
    `Activation mode: ${record.activation.mode}`,
    `Reply receipt: ${record.receipt.receiptId}`,
    `Checksum: ${record.receipt.checksumAlgorithm}:${record.receipt.checksum}`,
    "",
    "## Buyer reply",
    record.buyerReply || "No reply text supplied.",
    "",
    "## Owner tasks",
    ...activationSteps.map((step) => `- [${step.status}] ${step.owner} / ${step.action} Evidence: ${step.evidence}`),
    "",
    "## Proof trail",
    `One-pager receipt: ${record.onePagerReceiptId}`,
    `One-pager checksum: ${record.onePagerChecksum}`,
    `Verifier: ${record.verifierHref}`,
    `Review kit: ${record.reviewKitHref}`,
    `Acceptance path: ${record.acceptancePathHref}`
  ].join("\n");

  return {
    status,
    headline: decisionHeadline(record),
    summary:
      openCount === 0
        ? `${record.activation.items.length} owner task${record.activation.items.length === 1 ? "" : "s"} can run with verified reply evidence attached.`
        : `${openCount} handoff step${openCount === 1 ? "" : "s"} still need owner evidence before the decision is closed.`,
    openCount,
    copyText,
    steps
  };
}
