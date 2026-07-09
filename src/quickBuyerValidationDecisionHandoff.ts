import type { QuickBuyerValidationAnswerRecord, QuickProofRepairPlan } from "./QuickWorkflowIntakePanel";

export type QuickBuyerValidationDecisionHandoffStep = {
  id: "decision" | "owner-repair" | "verify";
  label: string;
  status: QuickBuyerValidationAnswerRecord["status"];
  owner: string;
  action: string;
  evidence: string;
  href: string;
};

export type QuickBuyerValidationDecisionHandoff = {
  status: QuickBuyerValidationAnswerRecord["status"];
  headline: string;
  summary: string;
  copyText: string;
  exportMarkdown: string;
  exportHref: string;
  mailtoHref: string;
  steps: QuickBuyerValidationDecisionHandoffStep[];
};

function dataMarkdownHref(markdown: string) {
  return `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;
}

function mailtoHref(subject: string, body: string) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildQuickBuyerValidationDecisionHandoff(input: {
  record: QuickBuyerValidationAnswerRecord;
  proofRepairPlan: QuickProofRepairPlan;
  reviewKitHref: string;
  acceptancePathHref: string;
}): QuickBuyerValidationDecisionHandoff {
  const openProofItems = input.proofRepairPlan.items.filter((item) => item.status !== "ready");
  const firstOpenProof = openProofItems[0];
  const status = input.record.status;
  const owner = status === "ready" ? "Pilot owner" : firstOpenProof?.owner || input.record.nextOwner;
  const repairAction =
    firstOpenProof && openProofItems.length > 1
      ? `Repair ${openProofItems.map((item) => item.label).join(" and ")} before buyer approval.`
      : firstOpenProof?.action || input.record.decisionAction;
  const headline =
    input.record.recommendedBuyerDecision === "continue"
      ? "Validation can move to buyer decision"
      : input.record.recommendedBuyerDecision === "revise"
        ? "Validation becomes an owner repair packet"
        : "Validation stops the buyer route";
  const summary =
    input.record.recommendedBuyerDecision === "continue"
      ? "All validation answers are evidenced. Attach the verifier and schedule the bounded pilot decision."
      : `${owner} gets the exact repair, receipt, and review route before this is used as buyer evidence.`;
  const steps: QuickBuyerValidationDecisionHandoffStep[] = [
    {
      id: "decision",
      label: "Decision",
      status,
      owner: input.record.nextOwner,
      action: input.record.decisionAction,
      evidence: `${input.record.answeredCount}/${input.record.totalCount} answers, ${input.record.confidence}/100 confidence.`,
      href: input.record.verifierHref
    },
    {
      id: "owner-repair",
      label: input.record.recommendedBuyerDecision === "continue" ? "Buyer route" : "Owner repair",
      status: firstOpenProof?.status ?? status,
      owner,
      action: repairAction,
      evidence: firstOpenProof ? `${input.proofRepairPlan.readyCount}/${input.proofRepairPlan.items.length} proof URLs ready.` : input.record.decisionReason,
      href: firstOpenProof?.href || input.acceptancePathHref
    },
    {
      id: "verify",
      label: "Verify",
      status: input.record.receipt.verification.status === "verified" ? "ready" : "blocked",
      owner: "Reviewer",
      action: "Open the validation record in the review kit and keep the receipt verifier attached.",
      evidence: `${input.record.receipt.receiptId} / ${input.record.receipt.checksumAlgorithm}:${input.record.receipt.checksum}`,
      href: input.reviewKitHref
    }
  ];
  const copyText = [
    "# Buyer validation decision handoff",
    "",
    `Recommended decision: ${input.record.recommendedBuyerDecision}`,
    `Reason: ${input.record.decisionReason}`,
    `Action: ${input.record.decisionAction}`,
    `Receipt: ${input.record.receipt.receiptId}`,
    `Verifier: ${input.record.verifierHref}`,
    "",
    "## Owner steps",
    ...steps.map((step) => `- [${step.status}] ${step.label} / ${step.owner}: ${step.action} Evidence: ${step.evidence} Link: ${step.href}`)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    copyText,
    exportMarkdown: copyText,
    exportHref: dataMarkdownHref(copyText),
    mailtoHref: mailtoHref(`Validation decision: ${input.record.recommendedBuyerDecision}`, copyText),
    steps
  };
}
