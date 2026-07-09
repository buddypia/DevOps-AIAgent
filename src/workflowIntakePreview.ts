import type { WorkflowIntakeDraft } from "./workflowIntakeDraft";

export type WorkflowIntakePreviewStatus = "ready" | "watch" | "missing";

export type WorkflowIntakePreviewRow = {
  id: "buyer" | "workflow" | "success" | "value" | "pilot" | "proof" | "data";
  label: string;
  value: string;
  status: WorkflowIntakePreviewStatus;
};

export type WorkflowIntakeStarter = {
  id: string;
  title: string;
  buyer: string;
  outcome: string;
  note: string;
};

export const WORKFLOW_INTAKE_STARTERS: WorkflowIntakeStarter[] = [
  {
    id: "release-readiness",
    title: "Release readiness review",
    buyer: "Platform release lead",
    outcome: "Save 6h/review and close public proof gaps",
    note: [
      "Buyer: Platform release lead",
      "Workflow: weekly Cloud Run release-readiness review is copied from tickets, CI logs, rollout checks, and chat by hand before sponsor sign-off.",
      "Baseline: release proof is scattered across tickets, spreadsheets, Cloud Run checks, and review threads.",
      "Success: save 6 hours per review and close all public proof gaps before sponsor review.",
      "Team 8 people, 5 reviews/month, manual 16 hours per review, 75% adoption, hourly ¥12000, risk ¥240000.",
      "Pilot: manual 480 min, assisted 140 min, 4 participants, 5/5 tasks accepted.",
      "Data: public-safe redacted evidence.",
      "Proof request: attach a public HTTPS artifact URL before external sharing."
    ].join("\n")
  },
  {
    id: "security-signoff",
    title: "Security sign-off",
    buyer: "Platform security lead",
    outcome: "Cut sign-off time and keep restricted data out",
    note: [
      "Buyer: Platform security lead",
      "Workflow: weekly security sign-off is assembled from tickets, CI logs, vulnerability notes, and approval chat before every release.",
      "Baseline: evidence is copied by hand and redaction ownership is unclear.",
      "Success: save 6 hours per sign-off and close 4 proof gaps before sponsor review.",
      "Team 7 people, 5 reviews/month, manual 12 hours per review, 72% adoption, hourly ¥11000, risk ¥250000.",
      "Pilot: manual 360 min, assisted 115 min, 3 participants, 4/5 tasks accepted.",
      "Data: public-safe redacted evidence.",
      "Proof request: attach a public HTTPS artifact URL before external sharing."
    ].join("\n")
  },
  {
    id: "support-escalation",
    title: "Support escalation triage",
    buyer: "Support operations lead",
    outcome: "Reduce escalation review time and prove handoff quality",
    note: [
      "Buyer: Support operations lead",
      "Workflow: daily enterprise escalation triage is reconciled from Zendesk exports, incident notes, account context, and Slack decisions.",
      "Baseline: operators spend the first hour rebuilding context and checking whether follow-up owners accepted the work.",
      "Success: save 4 hours per triage cycle and prove accepted owner handoffs before the customer update.",
      "Team 10 people, 18 runs/month, manual 6 hours per run, 68% adoption, hourly ¥9500, risk ¥180000.",
      "Pilot: manual 300 min, assisted 105 min, 5 participants, 6/7 tasks accepted.",
      "Data: public-safe synthetic customer names.",
      "Proof request: attach a public HTTPS artifact URL before external sharing."
    ].join("\n")
  }
];

function hasFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readyText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function rowStatus(value: string | undefined): WorkflowIntakePreviewStatus {
  return value?.trim() ? "ready" : "missing";
}

export function buildWorkflowIntakePreviewRows(draft: WorkflowIntakeDraft): WorkflowIntakePreviewRow[] {
  const valueParts = [
    hasFiniteNumber(draft.buyerScenario.teamSize) ? `${draft.buyerScenario.teamSize} people` : "",
    hasFiniteNumber(draft.buyerScenario.cyclesPerMonth) ? `${draft.buyerScenario.cyclesPerMonth} cycles/month` : "",
    hasFiniteNumber(draft.buyerScenario.manualHoursPerCycle) ? `${draft.buyerScenario.manualHoursPerCycle}h manual/cycle` : "",
    hasFiniteNumber(draft.buyerScenario.adoptionRatePercent) ? `${draft.buyerScenario.adoptionRatePercent}% adoption` : ""
  ].filter(Boolean);
  const pilotParts = [
    hasFiniteNumber(draft.pilotRun.observedManualMinutes) ? `${draft.pilotRun.observedManualMinutes}m manual` : "",
    hasFiniteNumber(draft.pilotRun.observedAssistedMinutes) ? `${draft.pilotRun.observedAssistedMinutes}m assisted` : "",
    hasFiniteNumber(draft.pilotRun.acceptedTasks) && hasFiniteNumber(draft.pilotRun.totalTasks) ? `${draft.pilotRun.acceptedTasks}/${draft.pilotRun.totalTasks} tasks accepted` : ""
  ].filter(Boolean);
  const extractedProofUrls = Object.values(draft.proofLinks).filter(Boolean);
  const proofUrl =
    extractedProofUrls.length === 1
      ? extractedProofUrls[0]
      : extractedProofUrls.length > 1
        ? `${extractedProofUrls.length}/5 launch proof URLs extracted`
        : draft.workOrder.evidenceUrl || draft.pilotRun.evidenceUrl || "";
  const dataBoundary = draft.workOrder.dataSensitivity;
  const valueStatus: WorkflowIntakePreviewStatus = valueParts.length >= 3 ? "ready" : valueParts.length > 0 ? "watch" : "missing";
  const pilotStatus: WorkflowIntakePreviewStatus = pilotParts.length >= 3 ? "ready" : pilotParts.length > 0 ? "watch" : "missing";
  const dataStatus: WorkflowIntakePreviewStatus = dataBoundary === "public" ? "ready" : dataBoundary ? "watch" : "missing";

  return [
    { id: "buyer", label: "Buyer", value: readyText(draft.workOrder.targetUser, "Missing target buyer"), status: rowStatus(draft.workOrder.targetUser) },
    { id: "workflow", label: "Workflow", value: readyText(draft.workOrder.request, "Missing workflow request"), status: rowStatus(draft.workOrder.request) },
    { id: "success", label: "Success metric", value: readyText(draft.workOrder.successMetric, "Missing success metric"), status: rowStatus(draft.workOrder.successMetric) },
    { id: "value", label: "Value model", value: valueParts.join(", ") || "Missing ROI assumptions", status: valueStatus },
    { id: "pilot", label: "Pilot run", value: pilotParts.join(", ") || "Missing measured pilot run", status: pilotStatus },
    { id: "proof", label: "Proof URL", value: proofUrl || "Missing public proof URL", status: proofUrl ? "ready" : "missing" },
    { id: "data", label: "Data boundary", value: dataBoundary ? `${dataBoundary} data` : "Missing data boundary", status: dataStatus }
  ];
}
