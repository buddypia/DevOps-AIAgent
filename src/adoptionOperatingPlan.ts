import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import type { BuyerWorkOrderBrief } from "./buyerWorkOrder.js";
import type { BuyerProofPacketReceipt } from "./buyerProofPacket.js";
import type { PilotAgreement } from "./pilotAgreement.js";
import type { PilotEvidenceLedger } from "./pilotEvidenceLedger.js";
import type { PilotRunReceipt } from "./pilotRunReceipt.js";
import type { PilotWorkflowPlan } from "./pilotWorkflow.js";
import type { SponsorDecisionReceipt } from "./sponsorReviewRoom.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";

export type AdoptionOperatingPlanReadiness = "ready-to-operate" | "needs-owner-commitment" | "blocked";

export type AdoptionHealthMetric = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  value: string;
  evidence: string;
  owner: string;
};

export type AdoptionCadenceStep = {
  id: string;
  label: string;
  window: string;
  owner: string;
  status: BuyerValueScenarioStatus;
  objective: string;
  evidence: string;
  exitCriteria: string;
};

export type AdoptionIntervention = {
  id: string;
  trigger: string;
  owner: string;
  severity: "watch" | "blocked";
  action: string;
  proof: string;
};

export type AdoptionOwnerCommitment = {
  role: string;
  owner: string;
  commitment: string;
  artifact: string;
};

export type AdoptionApprovalAnchor = {
  id: "proof-packet-receipt" | "sponsor-decision" | "day-30-review";
  label: string;
  status: BuyerValueScenarioStatus;
  owner: string;
  evidence: string;
  action: string;
  artifact: string;
  href?: string;
};

export type AdoptionSuccessLedgerDecision = "expand-next-workflow" | "revise-pilot" | "hold-expansion";

export type AdoptionSuccessLedgerRow = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  value: string;
  owner: string;
  evidence: string;
  action: string;
};

export const ADOPTION_SUCCESS_RECEIPT_VERIFY_PATH = "/api/adoption-success-ledger/receipt/verify";

export type AdoptionSuccessReceiptPayload = {
  receiptVersion: "adoption-success-ledger.v1";
  planId: string;
  ledgerId: string;
  decision: AdoptionSuccessLedgerDecision;
  successScore: number;
  buyer: string;
  operatingMetric: string;
  reviewWindow: string;
  renewalAsk: string;
  riskAdjustedMonthlyValueYen: number;
  rows: AdoptionSuccessLedgerRow[];
  expansionCriteria: string[];
};

export type AdoptionSuccessReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type AdoptionSuccessReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof ADOPTION_SUCCESS_RECEIPT_VERIFY_PATH;
  payload: AdoptionSuccessReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: AdoptionSuccessReceiptVerification;
  copyText: string;
  href: string;
};

export type AdoptionSuccessLedger = {
  id: string;
  decision: AdoptionSuccessLedgerDecision;
  successScore: number;
  headline: string;
  reviewWindow: string;
  renewalAsk: string;
  rows: AdoptionSuccessLedgerRow[];
  markdown: string;
  href: string;
  csvText: string;
  csvHref: string;
  receipt: AdoptionSuccessReceipt;
};

export type AdoptionOperatingCalendarEvent = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  owner: string;
  window: string;
  dayOffset: number;
  startDate: string;
  endDate: string;
  objective: string;
  evidence: string;
  exitCriteria: string;
  calendarSummary: string;
  calendarDescription: string;
};

export type AdoptionOperatingCalendar = {
  id: string;
  startDate: string;
  endDate: string;
  timezone: "UTC";
  events: AdoptionOperatingCalendarEvent[];
  icsText: string;
  icsHref: string;
  copyText: string;
  href: string;
};

export type AdoptionOperatingPlan = {
  id: string;
  readiness: AdoptionOperatingPlanReadiness;
  planScore: number;
  headline: string;
  hardTruth: string;
  buyer: string;
  operatingMetric: string;
  expectedMonthlyValueYen: number;
  riskAdjustedMonthlyValueYen: number;
  healthMetrics: AdoptionHealthMetric[];
  cadence: AdoptionCadenceStep[];
  interventions: AdoptionIntervention[];
  ownerCommitments: AdoptionOwnerCommitment[];
  approvalAnchors: AdoptionApprovalAnchor[];
  successLedger: AdoptionSuccessLedger;
  operatingCalendar: AdoptionOperatingCalendar;
  expansionCriteria: string[];
  exportMarkdown: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statusScore(status: BuyerValueScenarioStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 66;
  return 18;
}

function statusFrom(condition: boolean, watchCondition = false): BuyerValueScenarioStatus {
  if (condition) return "clear";
  if (watchCondition) return "watch";
  return "blocked";
}

function readinessFrom(input: { planScore: number; metrics: AdoptionHealthMetric[]; cadence: AdoptionCadenceStep[] }): AdoptionOperatingPlanReadiness {
  if (input.metrics.some((metric) => metric.status === "blocked") || input.cadence.some((step) => step.status === "blocked")) return "blocked";
  if (input.planScore >= 82 && input.metrics.every((metric) => metric.status === "clear") && input.cadence.every((step) => step.status === "clear")) return "ready-to-operate";
  return "needs-owner-commitment";
}

function headlineFor(readiness: AdoptionOperatingPlanReadiness) {
  if (readiness === "ready-to-operate") return "The buyer has a real adoption operating plan";
  if (readiness === "needs-owner-commitment") return "The adoption plan needs owner commitment before rollout";
  return "Do not roll this out until adoption blockers are fixed";
}

function hardTruthFor(readiness: AdoptionOperatingPlanReadiness, openCount: number) {
  if (readiness === "ready-to-operate") {
    return "A buyer can see the cadence, accountable owners, health checks, interventions, and expansion criteria needed to operate this beyond a demo.";
  }
  if (readiness === "needs-owner-commitment") {
    return `${openCount} adoption item${openCount === 1 ? "" : "s"} need owner confirmation before the pilot can become an operating motion.`;
  }
  return `${openCount} adoption blocker${openCount === 1 ? "" : "s"} would make rollout feel unsupported. Fix the operating proof before external expansion.`;
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tone(status: string) {
  if (["ready-to-operate", "clear"].includes(status)) return "good";
  if (["blocked"].includes(status)) return "bad";
  return "watch";
}

function buildHealthMetrics(input: {
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  workOrder: BuyerWorkOrderBrief;
  workflow: PilotWorkflowPlan;
  pilotReceipt: PilotRunReceipt;
  agreement: PilotAgreement;
  ledger: PilotEvidenceLedger;
}): AdoptionHealthMetric[] {
  return [
    {
      id: "value-realism",
      label: "Value realism",
      status: statusFrom(input.buyerScenario.readiness === "scales-now", input.buyerScenario.readiness === "pilot-first"),
      value: `${yen(input.buyerScenario.monthlyGrossValueYen)} / month`,
      evidence: `${input.buyerScenario.paybackDays}-day payback with ${input.buyerScenario.confidenceScore}/100 confidence.`,
      owner: input.valueBlueprint.primaryUser
    },
    {
      id: "work-order-operability",
      label: "Work order operability",
      status: statusFrom(input.workOrder.readiness === "ready-to-run", input.workOrder.readiness === "needs-proof"),
      value: `${input.workOrder.workOrderScore}/100`,
      evidence: input.workOrder.nextAction,
      owner: input.workOrder.assignments[0]?.agentName ?? "Pilot facilitator"
    },
    {
      id: "first-run-proof",
      label: "First-run proof",
      status: statusFrom(input.pilotReceipt.readiness === "accepted", input.pilotReceipt.readiness === "needs-evidence"),
      value: `${input.pilotReceipt.actualMinutesSavedPerRun}m saved`,
      evidence: `${input.pilotReceipt.acceptanceRatePercent}% acceptance; evidence URL ${input.pilotReceipt.evidenceUrl ? "attached" : "missing"}.`,
      owner: input.pilotReceipt.reviewerName || "Pilot reviewer"
    },
    {
      id: "sponsor-ledger",
      label: "Sponsor ledger",
      status: statusFrom(input.ledger.readiness === "sponsor-ready", input.ledger.readiness === "needs-proof"),
      value: `${input.ledger.ledgerScore}/100`,
      evidence: `${input.ledger.events.filter((event) => event.status === "clear").length}/${input.ledger.events.length} evidence events clear.`,
      owner: "Sponsor owner"
    },
    {
      id: "operating-ownership",
      label: "Operating ownership",
      status: statusFrom(input.agreement.readiness === "ready-to-sign" && input.workflow.readiness === "ready-to-run", input.agreement.readiness === "needs-redlines" || input.workflow.readiness === "needs-scope"),
      value: `${input.agreement.signatures.length} sign-offs`,
      evidence: `${input.workflow.workflowName}; ${input.agreement.terms.filter((term) => term.status === "clear").length}/${input.agreement.terms.length} agreement terms clear.`,
      owner: input.agreement.signatures[0]?.name ?? input.valueBlueprint.primaryUser
    }
  ];
}

function buildCadence(input: {
  recommendation: Recommendation;
  buyerScenario: BuyerValueScenario;
  workOrder: BuyerWorkOrderBrief;
  workflow: PilotWorkflowPlan;
  pilotReceipt: PilotRunReceipt;
  agreement: PilotAgreement;
  ledger: PilotEvidenceLedger;
}): AdoptionCadenceStep[] {
  const squadOwner = input.recommendation.selected[0]?.name ?? "A2A Market Broker";
  return [
    {
      id: "day-0-kickoff",
      label: "Kickoff with one real work order",
      window: "Day 0",
      owner: input.workOrder.assignments[0]?.agentName ?? "Pilot facilitator",
      status: statusFrom(input.workOrder.readiness === "ready-to-run", input.workOrder.readiness === "needs-proof"),
      objective: input.workOrder.request,
      evidence: input.workOrder.pilotQuestion,
      exitCriteria: input.workOrder.stopRule
    },
    {
      id: "week-1-activation",
      label: "Activate the first repeatable workflow",
      window: "Week 1",
      owner: squadOwner,
      status: statusFrom(input.workflow.readiness === "ready-to-run", input.workflow.readiness === "needs-scope"),
      objective: `Run ${input.workflow.workflowName} for ${input.workflow.targetUser}.`,
      evidence: `${input.workflow.minutesSavedPerRun} planned minutes saved per run; ${input.workflow.checkpoints.filter((checkpoint) => checkpoint.status === "clear").length}/${input.workflow.checkpoints.length} checkpoints clear.`,
      exitCriteria: input.workflow.handoffScript[0] ?? "The buyer can repeat the workflow without builder intervention."
    },
    {
      id: "week-2-health-review",
      label: "Review measured usage and acceptance",
      window: "Week 2",
      owner: input.pilotReceipt.reviewerName || "Pilot reviewer",
      status: statusFrom(input.pilotReceipt.readiness === "accepted", input.pilotReceipt.readiness === "needs-evidence"),
      objective: "Compare measured run time, acceptance, and proof URL against the value model.",
      evidence: input.pilotReceipt.hardTruth,
      exitCriteria: `${input.pilotReceipt.acceptedTasks}/${input.pilotReceipt.totalTasks} tasks accepted and ${input.pilotReceipt.actualMinutesSavedPerRun} minutes saved per run.`
    },
    {
      id: "day-30-expand-or-stop",
      label: "Decide expand, revise, or stop",
      window: "Day 30",
      owner: input.agreement.signatures[0]?.name ?? "Buyer sponsor",
      status: statusFrom(input.ledger.readiness === "sponsor-ready" && input.agreement.readiness === "ready-to-sign", input.ledger.readiness === "needs-proof" || input.agreement.readiness === "needs-redlines"),
      objective: "Use the evidence ledger and agreement terms to make the next funding decision.",
      evidence: input.ledger.reviewMemo,
      exitCriteria: input.agreement.stopRules[0] ?? "Expansion only proceeds when measured value and proof gates are accepted."
    }
  ];
}

function buildOwnerCommitments(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  workOrder: BuyerWorkOrderBrief;
  pilotReceipt: PilotRunReceipt;
  agreement: PilotAgreement;
}): AdoptionOwnerCommitment[] {
  return [
    {
      role: "Buyer sponsor",
      owner: input.agreement.signatures[0]?.name ?? (input.pilotReceipt.reviewerName || input.valueBlueprint.primaryUser),
      commitment: "Own the day-30 expand, revise, or stop decision against the agreed stop rules.",
      artifact: "Pilot agreement"
    },
    {
      role: "Pilot operator",
      owner: input.recommendation.selected[0]?.name ?? "A2A Market Broker",
      commitment: "Run the workflow, collect proof, and keep the buyer-facing room current.",
      artifact: "Pilot workflow"
    },
    {
      role: "Proof owner",
      owner: input.workOrder.assignments.find((assignment) => assignment.role === "prove")?.agentName ?? input.valueBlueprint.proofContract.owner,
      commitment: "Attach public evidence before sponsor review or mark the item blocked.",
      artifact: "Evidence ledger"
    },
    {
      role: "Security reviewer",
      owner: input.agreement.signatures.find((signature) => signature.role === "Security reviewer")?.name ?? "Named security reviewer",
      commitment: "Confirm the data boundary before any buyer session expands beyond the pilot.",
      artifact: "Pilot agreement"
    }
  ];
}

function buildInterventions(metrics: AdoptionHealthMetric[], cadence: AdoptionCadenceStep[]): AdoptionIntervention[] {
  const open = [...metrics, ...cadence].filter((item) => item.status !== "clear");
  if (open.length === 0) {
    return [
      {
        id: "scale-with-proof",
        trigger: "All operating checks are clear",
        owner: "Buyer sponsor",
        severity: "watch",
        action: "Expand only to the next named workflow and keep the same receipt and stop-rule discipline.",
        proof: "Day-30 operating review"
      }
    ];
  }

  return open.slice(0, 5).map((item) => ({
    id: `intervention-${item.id}`,
    trigger: item.label,
    owner: item.owner,
    severity: item.status === "blocked" ? ("blocked" as const) : ("watch" as const),
    action: item.status === "blocked" ? "Do not expand. Fix the blocker and rerun the affected proof step." : "Keep scope bounded and get owner confirmation before the next cadence step.",
    proof: "Updated adoption operating plan"
  }));
}

function receiptCheckStatus(receipt?: BuyerProofPacketReceipt): BuyerValueScenarioStatus {
  if (!receipt) return "watch";
  if (receipt.checks.some((check) => check.status === "blocked")) return "blocked";
  if (receipt.checks.some((check) => check.status === "watch")) return "watch";
  return "clear";
}

function decisionStatus(receipt?: SponsorDecisionReceipt): BuyerValueScenarioStatus {
  if (!receipt) return "watch";
  if (receipt.status === "signed") return "clear";
  if (receipt.status === "needs-evidence") return "watch";
  return "blocked";
}

function buildApprovalAnchors(input: {
  ledger: PilotEvidenceLedger;
  agreement: PilotAgreement;
  proofPacketReceipt?: BuyerProofPacketReceipt;
  sponsorDecisionReceipt?: SponsorDecisionReceipt;
}): AdoptionApprovalAnchor[] {
  const openReceiptCheck = input.proofPacketReceipt?.checks.find((check) => check.status !== "sealed");
  const proofReceiptStatus = receiptCheckStatus(input.proofPacketReceipt);
  const sponsorStatus = decisionStatus(input.sponsorDecisionReceipt);
  const day30Status = statusFrom(
    input.ledger.readiness === "sponsor-ready" && input.agreement.readiness === "ready-to-sign" && sponsorStatus === "clear",
    input.ledger.readiness === "needs-proof" || input.agreement.readiness === "needs-redlines" || sponsorStatus === "watch"
  );

  return [
    {
      id: "proof-packet-receipt",
      label: "Proof packet receipt",
      status: proofReceiptStatus,
      owner: "Proof owner",
      evidence: input.proofPacketReceipt
        ? `${input.proofPacketReceipt.algorithm} digest ${input.proofPacketReceipt.digest}; ${input.proofPacketReceipt.coveredArtifacts.length} artifacts covered.${openReceiptCheck ? ` Open check: ${openReceiptCheck.label}.` : ""}`
        : "Attach the buyer proof packet receipt before treating this as an operating handoff.",
      action: proofReceiptStatus === "clear" ? "Keep this digest attached to every sponsor handoff." : "Close proof receipt checks before expanding the pilot.",
      artifact: "Buyer proof packet",
      href: "/buyer-proof-packet"
    },
    {
      id: "sponsor-decision",
      label: "Sponsor decision receipt",
      status: sponsorStatus,
      owner: input.sponsorDecisionReceipt?.signerName ?? "Buyer sponsor",
      evidence: input.sponsorDecisionReceipt
        ? `${input.sponsorDecisionReceipt.decision} decision is ${input.sponsorDecisionReceipt.status}; ${input.sponsorDecisionReceipt.conditions.length} conditions recorded.`
        : "Record continue, revise, or stop from the sponsor review room before day-30 operation.",
      action: input.sponsorDecisionReceipt?.nextStep ?? "Run sponsor review and attach the decision receipt.",
      artifact: "Sponsor review room",
      href: "/sponsor-review"
    },
    {
      id: "day-30-review",
      label: "Day-30 expand or stop gate",
      status: day30Status,
      owner: input.agreement.signatures[0]?.name ?? "Buyer sponsor",
      evidence: `${input.ledger.ledgerScore}/100 ledger score; ${input.agreement.agreementScore}/100 agreement score; ${input.ledger.exceptions.length} ledger exceptions open.`,
      action:
        day30Status === "clear"
          ? "Use the operating review to approve only the next named workflow."
          : "Keep rollout bounded until the sponsor receipt, ledger, and agreement are clear.",
      artifact: "Adoption operating plan"
    }
  ];
}

function buildExpansionCriteria(input: { buyerScenario: BuyerValueScenario; pilotReceipt: PilotRunReceipt; ledger: PilotEvidenceLedger; agreement: PilotAgreement }) {
  return [
    `Measured monthly value remains above ${yen(Math.round(input.buyerScenario.monthlyGrossValueYen * 0.65))}.`,
    `Task acceptance stays at or above 70%; current receipt is ${input.pilotReceipt.acceptanceRatePercent}%.`,
    `No blocked evidence ledger events remain; current exceptions ${input.ledger.exceptions.length}.`,
    `Agreement stop rules are reviewed before spend exceeds ${yen(input.agreement.budgetCapYen)}.`
  ];
}

function ledgerDecision(readiness: AdoptionOperatingPlanReadiness, successScore: number, rows: AdoptionSuccessLedgerRow[]): AdoptionSuccessLedgerDecision {
  if (readiness === "blocked" || rows.some((row) => row.status === "blocked")) return "hold-expansion";
  if (successScore >= 84 && rows.every((row) => row.status === "clear")) return "expand-next-workflow";
  return "revise-pilot";
}

function ledgerHeadline(decision: AdoptionSuccessLedgerDecision) {
  if (decision === "expand-next-workflow") return "Adoption proof supports the next workflow";
  if (decision === "revise-pilot") return "Adoption proof needs one focused pilot revision";
  return "Adoption proof says to hold expansion";
}

function renewalAsk(decision: AdoptionSuccessLedgerDecision, input: { buyer: string; riskAdjustedMonthlyValueYen: number; operatingMetric: string }) {
  if (decision === "expand-next-workflow") {
    return `Ask ${input.buyer} to approve the next named workflow while keeping the same success ledger and stop rules.`;
  }
  if (decision === "revise-pilot") {
    return `Ask ${input.buyer} to revise the pilot around ${input.operatingMetric} before requesting broader rollout.`;
  }
  return `Do not request expansion. Protect the remaining ${yen(input.riskAdjustedMonthlyValueYen)} risk-adjusted monthly value by fixing blocked adoption proof first.`;
}

function ledgerAction(status: BuyerValueScenarioStatus, label: string) {
  if (status === "clear") return `Keep ${label} attached to the day-30 operating review.`;
  if (status === "watch") return `Assign an owner to confirm ${label} before any expansion ask.`;
  return `Block expansion until ${label} is repaired and re-exported.`;
}

function csvCell(value: unknown) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function utcDateOnly(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function parseDateOnly(value?: string) {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return parsed;
}

function nextMonday(now: Date) {
  const date = utcDateOnly(now);
  const day = date.getUTCDay();
  const daysUntilMonday = (8 - day) % 7;
  return addDays(date, daysUntilMonday);
}

function addDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function icsDate(value: string) {
  return value.replace(/-/g, "");
}

function icsEscape(value: unknown) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function calendarOffset(window: string) {
  if (/day\s*0/i.test(window)) return 0;
  if (/week\s*1/i.test(window)) return 7;
  if (/week\s*2/i.test(window)) return 14;
  const dayMatch = window.match(/day\s*(\d+)/i);
  if (dayMatch) return Number(dayMatch[1]);
  return 0;
}

function buildCalendarMarkdown(calendar: Omit<AdoptionOperatingCalendar, "copyText" | "href" | "icsText" | "icsHref">) {
  return [
    "# Adoption Operating Calendar",
    "",
    `Calendar: ${calendar.id}`,
    `Pilot start: ${calendar.startDate}`,
    `Pilot end: ${calendar.endDate}`,
    `Timezone: ${calendar.timezone}`,
    "",
    "## Events",
    ...calendar.events.map(
      (event) =>
        `- [${event.status}] ${event.startDate} ${event.label} (${event.owner}): ${event.objective} Exit: ${event.exitCriteria}`
    )
  ].join("\n");
}

function buildCalendarIcs(calendar: Omit<AdoptionOperatingCalendar, "copyText" | "href" | "icsText" | "icsHref">) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//Adoption Operating Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape("A2A buyer pilot adoption")}`,
    ...calendar.events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${icsEscape(`${calendar.id}-${event.id}@a2a-agent-marketplace`)}`,
      `DTSTAMP:${icsDate(calendar.startDate)}T000000Z`,
      `DTSTART;VALUE=DATE:${icsDate(event.startDate)}`,
      `DTEND;VALUE=DATE:${icsDate(event.endDate)}`,
      `SUMMARY:${icsEscape(event.calendarSummary)}`,
      `DESCRIPTION:${icsEscape(event.calendarDescription)}`,
      `STATUS:${event.status === "blocked" ? "TENTATIVE" : "CONFIRMED"}`,
      "END:VEVENT"
    ]),
    "END:VCALENDAR"
  ];
  return `${lines.join("\r\n")}\r\n`;
}

function buildOperatingCalendar(input: {
  planId: string;
  buyer: string;
  cadence: AdoptionCadenceStep[];
  successLedger: AdoptionSuccessLedger;
  expansionCriteria: string[];
  now?: Date;
  pilotStartDate?: string;
}): AdoptionOperatingCalendar {
  const start = parseDateOnly(input.pilotStartDate) ?? nextMonday(input.now ?? new Date());
  const events = input.cadence.map((step) => {
    const dayOffset = calendarOffset(step.window);
    const eventStart = addDays(start, dayOffset);
    const eventEnd = addDays(eventStart, 1);
    const startDate = dateOnly(eventStart);
    const endDate = dateOnly(eventEnd);
    return {
      id: step.id,
      label: step.label,
      status: step.status,
      owner: step.owner,
      window: step.window,
      dayOffset,
      startDate,
      endDate,
      objective: step.objective,
      evidence: step.evidence,
      exitCriteria: step.exitCriteria,
      calendarSummary: `${step.window}: ${step.label}`,
      calendarDescription: [
        `Owner: ${step.owner}`,
        `Objective: ${step.objective}`,
        `Evidence: ${step.evidence}`,
        `Exit criteria: ${step.exitCriteria}`,
        `Ledger decision: ${input.successLedger.decision}`,
        `Renewal ask: ${input.successLedger.renewalAsk}`
      ].join("\n")
    };
  });
  const endDate = events.at(-1)?.endDate ?? dateOnly(addDays(start, 31));
  const partial: Omit<AdoptionOperatingCalendar, "copyText" | "href" | "icsText" | "icsHref"> = {
    id: `adoption-operating-calendar-${input.successLedger.decision}-${dateOnly(start)}`,
    startDate: dateOnly(start),
    endDate,
    timezone: "UTC",
    events
  };
  const copyText = buildCalendarMarkdown(partial);
  const icsText = buildCalendarIcs(partial);

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`,
    icsText,
    icsHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsText)}`
  };
}

function buildSuccessLedgerMarkdown(ledger: Omit<AdoptionSuccessLedger, "markdown" | "href" | "csvText" | "csvHref">) {
  return [
    `# ${ledger.headline}`,
    "",
    "Adoption Success Ledger",
    "",
    `Decision: ${ledger.decision}`,
    `Success score: ${ledger.successScore}/100`,
    `Review window: ${ledger.reviewWindow}`,
    `Renewal ask: ${ledger.renewalAsk}`,
    "",
    "## Evidence rows",
    ...ledger.rows.map((row) => `- [${row.status}] ${row.label} (${row.owner}): ${row.value}. ${row.evidence} Action: ${row.action}`)
  ].join("\n");
}

function buildSuccessLedgerCsv(rows: AdoptionSuccessLedgerRow[]) {
  return [
    "rowId,label,status,value,owner,evidence,action",
    ...rows.map((row) => [row.id, row.label, row.status, row.value, row.owner, row.evidence, row.action].map(csvCell).join(","))
  ].join("\n");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return value;
}

function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

function stableDigest(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function escapeScriptJson(value: unknown) {
  return canonicalJson(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function verifyAdoptionSuccessReceipt(receipt: Pick<AdoptionSuccessReceipt, "checksum" | "payload">): AdoptionSuccessReceiptVerification {
  const actualChecksum = stableDigest(receipt.payload);
  const verified = actualChecksum === receipt.checksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum: receipt.checksum,
    actualChecksum,
    instruction: verified
      ? "Adoption success receipt checksum matches the attached day-30 replay payload."
      : "Adoption success receipt checksum does not match the attached replay payload. Do not accept this expansion or renewal decision until the adoption plan is re-exported."
  };
}

function buildSuccessReceiptMarkdown(receipt: Omit<AdoptionSuccessReceipt, "copyText" | "href">) {
  return [
    "# Adoption success receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Decision: ${receipt.payload.decision}`,
    `Success score: ${receipt.payload.successScore}/100`,
    `Buyer: ${receipt.payload.buyer}`,
    `Review window: ${receipt.payload.reviewWindow}`,
    `Renewal ask: ${receipt.payload.renewalAsk}`,
    "",
    "## Replay payload",
    "```json",
    receipt.payloadJson,
    "```",
    "",
    "## Verification",
    `- Status: ${receipt.verification.status}`,
    `- Expected checksum: ${receipt.verification.expectedChecksum}`,
    `- Actual checksum: ${receipt.verification.actualChecksum}`,
    `- Instruction: ${receipt.verification.instruction}`,
    "",
    "## API verification",
    `POST ${receipt.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    receipt.verificationRequestJson,
    "```",
    "",
    "Replay rule: Recompute fnv1a-64 over the adoption success replay payload before accepting a forwarded expansion or renewal decision."
  ].join("\n");
}

export function buildAdoptionSuccessReceipt(payload: AdoptionSuccessReceiptPayload): AdoptionSuccessReceipt {
  const checksum = stableDigest(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyAdoptionSuccessReceipt({ checksum, payload });
  const partial: Omit<AdoptionSuccessReceipt, "copyText" | "href"> = {
    receiptId: `adoption-success-${payload.decision}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: ADOPTION_SUCCESS_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };
  const copyText = buildSuccessReceiptMarkdown(partial);

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}

function buildSuccessLedger(input: {
  planId: string;
  readiness: AdoptionOperatingPlanReadiness;
  buyer: string;
  operatingMetric: string;
  riskAdjustedMonthlyValueYen: number;
  healthMetrics: AdoptionHealthMetric[];
  cadence: AdoptionCadenceStep[];
  approvalAnchors: AdoptionApprovalAnchor[];
  expansionCriteria: string[];
}): AdoptionSuccessLedger {
  const rows: AdoptionSuccessLedgerRow[] = [
    ...input.healthMetrics.map((metric) => ({
      id: `health-${metric.id}`,
      label: metric.label,
      status: metric.status,
      value: metric.value,
      owner: metric.owner,
      evidence: metric.evidence,
      action: ledgerAction(metric.status, metric.label)
    })),
    ...input.cadence.map((step) => ({
      id: `cadence-${step.id}`,
      label: step.label,
      status: step.status,
      value: step.window,
      owner: step.owner,
      evidence: step.exitCriteria,
      action: ledgerAction(step.status, step.label)
    })),
    ...input.approvalAnchors.map((anchor) => ({
      id: `approval-${anchor.id}`,
      label: anchor.label,
      status: anchor.status,
      value: anchor.artifact,
      owner: anchor.owner,
      evidence: anchor.evidence,
      action: anchor.action
    }))
  ];
  const successScore = Math.round(average(rows.map((row) => statusScore(row.status))));
  const decision = ledgerDecision(input.readiness, successScore, rows);
  const partial: Omit<AdoptionSuccessLedger, "markdown" | "href" | "csvText" | "csvHref"> = {
    id: `adoption-success-ledger-${decision}-${successScore}`,
    decision,
    successScore,
    headline: ledgerHeadline(decision),
    reviewWindow: "Day 30 operating review",
    renewalAsk: renewalAsk(decision, input),
    rows,
    receipt: buildAdoptionSuccessReceipt({
      receiptVersion: "adoption-success-ledger.v1",
      planId: input.planId,
      ledgerId: `adoption-success-ledger-${decision}-${successScore}`,
      decision,
      successScore,
      buyer: input.buyer,
      operatingMetric: input.operatingMetric,
      reviewWindow: "Day 30 operating review",
      renewalAsk: renewalAsk(decision, input),
      riskAdjustedMonthlyValueYen: input.riskAdjustedMonthlyValueYen,
      rows,
      expansionCriteria: input.expansionCriteria
    })
  };
  const markdown = buildSuccessLedgerMarkdown(partial);
  const csvText = buildSuccessLedgerCsv(rows);

  return {
    ...partial,
    markdown,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`,
    csvText,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`
  };
}

function buildMarkdown(input: Omit<AdoptionOperatingPlan, "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    "Adoption Operating Plan",
    "",
    `Readiness: ${input.readiness}`,
    `Plan score: ${input.planScore}/100`,
    `Buyer: ${input.buyer}`,
    `Operating metric: ${input.operatingMetric}`,
    `Expected monthly value: ${yen(input.expectedMonthlyValueYen)}`,
    `Risk-adjusted monthly value: ${yen(input.riskAdjustedMonthlyValueYen)}`,
    "",
    input.hardTruth,
    "",
    "## Health metrics",
    ...input.healthMetrics.map((metric) => `- [${metric.status}] ${metric.label} (${metric.owner}): ${metric.value}. ${metric.evidence}`),
    "",
    "## 30-day cadence",
    ...input.cadence.map((step) => `- [${step.status}] ${step.window} - ${step.label} (${step.owner}): ${step.objective} Exit: ${step.exitCriteria}`),
    "",
    "## Interventions",
    ...input.interventions.map((intervention) => `- [${intervention.severity}] ${intervention.trigger} (${intervention.owner}): ${intervention.action} Proof: ${intervention.proof}`),
    "",
    "## Owner commitments",
    ...input.ownerCommitments.map((commitment) => `- ${commitment.role}: ${commitment.owner}. ${commitment.commitment} Artifact: ${commitment.artifact}`),
    "",
    "## Approval anchors",
    ...input.approvalAnchors.map((anchor) => `- [${anchor.status}] ${anchor.label} (${anchor.owner}): ${anchor.evidence} Action: ${anchor.action}`),
    "",
    "## Success ledger",
    `Decision: ${input.successLedger.decision}`,
    `Success score: ${input.successLedger.successScore}/100`,
    `Renewal ask: ${input.successLedger.renewalAsk}`,
    `Receipt: ${input.successLedger.receipt.receiptId}`,
    `Checksum: ${input.successLedger.receipt.checksumAlgorithm}:${input.successLedger.receipt.checksum}`,
    `Verification: ${input.successLedger.receipt.verification.status}`,
    `API verification: POST ${input.successLedger.receipt.verificationApiPath}`,
    ...input.successLedger.rows.map((row) => `- [${row.status}] ${row.label} (${row.owner}): ${row.value}. ${row.evidence}`),
    "",
    "## Operating calendar",
    `Calendar: ${input.operatingCalendar.id}`,
    `Pilot start: ${input.operatingCalendar.startDate}`,
    `Pilot end: ${input.operatingCalendar.endDate}`,
    ...input.operatingCalendar.events.map((event) => `- [${event.status}] ${event.startDate} ${event.label} (${event.owner}): ${event.objective} Exit: ${event.exitCriteria}`),
    "",
    "## Expansion criteria",
    ...input.expansionCriteria.map((criterion) => `- ${criterion}`)
  ].join("\n");
}

export function buildAdoptionOperatingPlan(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  workOrder: BuyerWorkOrderBrief;
  workflow: PilotWorkflowPlan;
  pilotReceipt: PilotRunReceipt;
  agreement: PilotAgreement;
  ledger: PilotEvidenceLedger;
  proofPacketReceipt?: BuyerProofPacketReceipt;
  sponsorDecisionReceipt?: SponsorDecisionReceipt;
  now?: Date;
  pilotStartDate?: string;
}): AdoptionOperatingPlan {
  const healthMetrics = buildHealthMetrics(input);
  const cadence = buildCadence(input);
  const ownerCommitments = buildOwnerCommitments(input);
  const approvalAnchors = buildApprovalAnchors(input);
  const interventions = buildInterventions(healthMetrics, cadence);
  const planScore = Math.round(
    clamp(
      average([
        input.buyerScenario.scenarioScore,
        input.workOrder.workOrderScore,
        input.workflow.workflowScore,
        input.pilotReceipt.receiptScore,
        input.agreement.agreementScore,
        input.ledger.ledgerScore,
        average([...healthMetrics.map((metric) => statusScore(metric.status)), ...cadence.map((step) => statusScore(step.status))])
      ])
    )
  );
  const readiness = readinessFrom({ planScore, metrics: healthMetrics, cadence });
  const openCount = [...healthMetrics, ...cadence].filter((item) => item.status !== "clear").length;
  const riskPenalty = readiness === "ready-to-operate" ? 0.9 : readiness === "needs-owner-commitment" ? 0.62 : 0.35;
  const buyer = input.valueBlueprint.primaryUser;
  const operatingMetric = input.workOrder.successMetric;
  const riskAdjustedMonthlyValueYen = Math.round(input.buyerScenario.monthlyGrossValueYen * riskPenalty);
  const planId = `adoption-operating-plan-${readiness}-${planScore}`;
  const expansionCriteria = buildExpansionCriteria(input);
  const successLedger = buildSuccessLedger({
    planId,
    readiness,
    buyer,
    operatingMetric,
    riskAdjustedMonthlyValueYen,
    healthMetrics,
    cadence,
    approvalAnchors,
    expansionCriteria
  });
  const operatingCalendar = buildOperatingCalendar({
    planId,
    buyer,
    cadence,
    successLedger,
    expansionCriteria,
    now: input.now,
    pilotStartDate: input.pilotStartDate
  });
  const partial = {
    id: planId,
    readiness,
    planScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, openCount),
    buyer,
    operatingMetric,
    expectedMonthlyValueYen: input.buyerScenario.monthlyGrossValueYen,
    riskAdjustedMonthlyValueYen,
    healthMetrics,
    cadence,
    interventions,
    ownerCommitments,
    approvalAnchors,
    successLedger,
    operatingCalendar,
    expansionCriteria
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderAdoptionOperatingPlanHtml(
  plan: AdoptionOperatingPlan,
  links: {
    launchRoomUrl?: string;
    workOrderUrl?: string;
    receiptUrl?: string;
    ledgerUrl?: string;
    agreementUrl?: string;
    proofPacketUrl?: string;
    sponsorReviewUrl?: string;
    trustManifestUrl?: string;
    jsonUrl?: string;
    markdownUrl?: string;
    appUrl?: string;
  } = {}
) {
  const linkList = [
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.workOrderUrl ? `<a href="${escapeHtml(links.workOrderUrl)}">Work order</a>` : "",
    links.receiptUrl ? `<a href="${escapeHtml(links.receiptUrl)}">Pilot receipt</a>` : "",
    links.ledgerUrl ? `<a href="${escapeHtml(links.ledgerUrl)}">Evidence ledger</a>` : "",
    links.agreementUrl ? `<a href="${escapeHtml(links.agreementUrl)}">Agreement</a>` : "",
    links.proofPacketUrl ? `<a href="${escapeHtml(links.proofPacketUrl)}">Proof packet</a>` : "",
    links.sponsorReviewUrl ? `<a href="${escapeHtml(links.sponsorReviewUrl)}">Sponsor review</a>` : "",
    links.trustManifestUrl ? `<a href="${escapeHtml(links.trustManifestUrl)}">Trust manifest</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON plan</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown plan</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const metrics = plan.healthMetrics
    .map(
      (metric) => `
        <article class="metric ${tone(metric.status)}">
          <span>${escapeHtml(metric.status)}</span>
          <strong>${escapeHtml(metric.label)}</strong>
          <b>${escapeHtml(metric.value)}</b>
          <p>${escapeHtml(metric.evidence)}</p>
          <small>${escapeHtml(metric.owner)}</small>
        </article>`
    )
    .join("");
  const approvalAnchors = plan.approvalAnchors
    .map(
      (anchor) => {
        const href = anchor.id === "proof-packet-receipt" ? links.proofPacketUrl : anchor.id === "sponsor-decision" ? links.sponsorReviewUrl : anchor.href;
        return `
        <article class="anchor ${tone(anchor.status)}">
          <span>${escapeHtml(anchor.status)}</span>
          <strong>${href ? `<a href="${escapeHtml(href)}">${escapeHtml(anchor.label)}</a>` : escapeHtml(anchor.label)}</strong>
          <p>${escapeHtml(anchor.evidence)}</p>
          <small>${escapeHtml(anchor.owner)} - ${escapeHtml(anchor.action)}</small>
        </article>`;
      }
    )
    .join("");
  const cadence = plan.cadence
    .map(
      (step) => `
        <article class="cadence ${tone(step.status)}">
          <span>${escapeHtml(step.window)}</span>
          <strong>${escapeHtml(step.label)}</strong>
          <p>${escapeHtml(step.objective)}</p>
          <small>${escapeHtml(step.owner)} - ${escapeHtml(step.exitCriteria)}</small>
        </article>`
    )
    .join("");
  const interventions = plan.interventions
    .map(
      (intervention) => `
        <article class="intervention ${tone(intervention.severity)}">
          <div><strong>${escapeHtml(intervention.trigger)}</strong><span>${escapeHtml(intervention.severity)}</span></div>
          <p>${escapeHtml(intervention.action)}</p>
          <small>${escapeHtml(intervention.owner)} - ${escapeHtml(intervention.proof)}</small>
        </article>`
    )
    .join("");
  const commitments = plan.ownerCommitments
    .map(
      (commitment) => `
        <li>
          <strong>${escapeHtml(commitment.role)}: ${escapeHtml(commitment.owner)}</strong>
          <span>${escapeHtml(commitment.commitment)}</span>
          <small>${escapeHtml(commitment.artifact)}</small>
        </li>`
    )
    .join("");
  const criteria = plan.expansionCriteria.map((criterion) => `<li>${escapeHtml(criterion)}</li>`).join("");
  const successRows = plan.successLedger.rows
    .slice(0, 8)
    .map(
      (row) => `
        <article class="ledger-row ${tone(row.status)}">
          <span>${escapeHtml(row.status)}</span>
          <strong>${escapeHtml(row.label)}</strong>
          <b>${escapeHtml(row.value)}</b>
          <p>${escapeHtml(row.evidence)}</p>
          <small>${escapeHtml(row.owner)} - ${escapeHtml(row.action)}</small>
        </article>`
    )
    .join("");
  const calendarEvents = plan.operatingCalendar.events
    .map(
      (event) => `
        <article class="calendar-event ${tone(event.status)}">
          <span>${escapeHtml(event.startDate)}</span>
          <strong>${escapeHtml(event.label)}</strong>
          <b>${escapeHtml(event.window)}</b>
          <p>${escapeHtml(event.objective)}</p>
          <small>${escapeHtml(event.owner)} - ${escapeHtml(event.exitCriteria)}</small>
        </article>`
    )
    .join("");
  const receiptVerifyRequestJson = escapeScriptJson({
    checksum: plan.successLedger.receipt.checksum,
    payload: plan.successLedger.receipt.payload
  });
  const verificationApiPathJson = JSON.stringify(plan.successLedger.receipt.verificationApiPath);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(plan.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #15211f; --muted: #52625d; --line: #c9d6d0; --paper: #f4f7f3; --panel: #fffdf7; --teal: #0f766e; --blue: #2b5b9f; --green-bg: #ebf8ef; --amber-bg: #fff7dc; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 20px; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: end; }
      .eyebrow, .metric span, .anchor span, .cadence span, .intervention span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.25rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p, small, li span { color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      .stamp { min-height: 200px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #15211f, #2b5b9f); text-align: center; }
      .stamp span { color: #d8fff5; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { font-size: 4rem; line-height: .9; }
      .stamp small { max-width: 240px; color: rgba(255, 253, 247, .76); font-weight: 850; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .metrics, .anchors, .cadence-grid, .lower { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      .anchors { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .cadence-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .success-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .calendar-head { display: flex; flex-wrap: wrap; gap: 12px; align-items: start; justify-content: space-between; }
      .calendar-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .calendar-actions a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      .calendar-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
      .lower { grid-template-columns: minmax(0, .78fr) minmax(320px, .5fr); align-items: start; }
      .panel, .metric, .anchor, .cadence, .intervention, .ledger-row, .calendar-event, li { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(21, 33, 31, .07); }
      .panel, .metric, .anchor, .cadence, .intervention, .ledger-row, .calendar-event, li { padding: 14px; }
      .metric, .anchor, .cadence, .intervention, .ledger-row, .calendar-event { display: grid; gap: 7px; }
      .metric b, .ledger-row b, .calendar-event b { width: fit-content; border-radius: 999px; padding: 4px 8px; background: #d8fff5; color: #102226; }
      .receipt { display: grid; grid-template-columns: minmax(0, .72fr) minmax(320px, 1fr); gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(21, 33, 31, .12); border-left: 5px solid var(--teal); }
      .receipt strong { display: block; margin-top: 4px; overflow-wrap: anywhere; }
      .receipt dl { display: grid; grid-template-columns: 118px minmax(0, 1fr); gap: 5px 10px; margin: 0; }
      .receipt dd { min-width: 0; margin: 0; color: var(--muted); overflow-wrap: anywhere; }
      .receipt a { font-weight: 900; }
      .receipt-actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding-top: 10px; border-top: 1px solid rgba(21, 33, 31, .12); }
      .receipt-actions button { border: 0; border-radius: 999px; padding: 9px 13px; background: #15211f; color: #fffdf7; font: inherit; font-size: .9rem; font-weight: 950; cursor: pointer; }
      .receipt-actions button:disabled { cursor: wait; opacity: .72; }
      .receipt-actions output { min-width: 220px; color: var(--muted); font-size: .88rem; font-weight: 850; overflow-wrap: anywhere; }
      .receipt-actions output[data-status="checking"] { color: var(--blue); }
      .receipt-actions output[data-status="verified"] { color: var(--teal); }
      .receipt-actions output[data-status="mismatch"], .receipt-actions output[data-status="error"] { color: #b4233b; }
      .intervention div { display: flex; align-items: start; justify-content: space-between; gap: 10px; }
      ul { display: grid; gap: 9px; padding: 0; margin: 0; list-style: none; }
      li { display: grid; gap: 5px; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      .metric strong, .anchor strong, .cadence strong, .intervention strong, .ledger-row strong, .calendar-event strong, li strong, p, small { overflow-wrap: anywhere; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 860px) { header, main, footer { width: min(100% - 24px, 640px); } .hero, .metrics, .anchors, .cadence-grid, .success-grid, .calendar-grid, .lower, .receipt { grid-template-columns: 1fr; } .stamp { min-height: 132px; } .stamp strong { font-size: 3rem; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Adoption Operating Plan</span>
          <h1>${escapeHtml(plan.headline)}</h1>
          <p>${escapeHtml(plan.hardTruth)}</p>
          <nav>${linkList}</nav>
        </div>
        <aside class="stamp">
          <span>Plan score</span>
          <strong>${escapeHtml(plan.planScore)}</strong>
          <small>${escapeHtml(plan.readiness)}</small>
        </aside>
      </div>
    </header>
    <main>
      <section class="panel">
        <h2>Operating metric</h2>
        <p><strong>${escapeHtml(plan.operatingMetric)}</strong></p>
        <p>Expected monthly value: ${escapeHtml(yen(plan.expectedMonthlyValueYen))}. Risk-adjusted value: ${escapeHtml(yen(plan.riskAdjustedMonthlyValueYen))}.</p>
      </section>
      <section class="metrics" aria-label="Adoption health metrics">${metrics}</section>
      <section class="panel">
        <h2>Approval anchors</h2>
        <div class="anchors">${approvalAnchors}</div>
      </section>
      <section class="panel">
        <h2>30-day cadence</h2>
        <div class="cadence-grid">${cadence}</div>
      </section>
      <section class="panel">
        <h2>Success ledger</h2>
        <p><strong>${escapeHtml(plan.successLedger.headline)}</strong></p>
        <p>Decision: ${escapeHtml(plan.successLedger.decision)}. ${escapeHtml(plan.successLedger.renewalAsk)} Score: ${escapeHtml(plan.successLedger.successScore)}/100.</p>
        <div class="success-grid">${successRows}</div>
        <section class="receipt ${tone(plan.successLedger.receipt.verification.status === "verified" ? "clear" : "blocked")}" aria-label="Adoption success receipt">
          <div>
            <h2>Adoption success receipt</h2>
            <strong>${escapeHtml(plan.successLedger.receipt.receiptId)}</strong>
            <p>${escapeHtml(plan.successLedger.receipt.verification.instruction)}</p>
          </div>
          <dl>
            <dt>Checksum</dt>
            <dd>${escapeHtml(`${plan.successLedger.receipt.checksumAlgorithm}:${plan.successLedger.receipt.checksum}`)}</dd>
            <dt>Decision</dt>
            <dd>${escapeHtml(plan.successLedger.receipt.payload.decision)}</dd>
            <dt>Verification</dt>
            <dd>${escapeHtml(plan.successLedger.receipt.verification.status)}</dd>
            <dt>API</dt>
            <dd><code>POST ${escapeHtml(plan.successLedger.receipt.verificationApiPath)}</code></dd>
            <dt>Receipt</dt>
            <dd><a href="${escapeHtml(plan.successLedger.receipt.href)}" download="adoption-success-receipt.md">Download markdown receipt</a></dd>
            <dt>Payload</dt>
            <dd><a href="${escapeHtml(plan.successLedger.receipt.payloadHref)}" download="adoption-success-payload.json">Download replay payload</a></dd>
          </dl>
          <div class="receipt-actions">
            <button type="button" data-adoption-success-verify>Verify receipt</button>
            <output data-adoption-success-verify-result aria-live="polite">Not verified in this browser yet.</output>
          </div>
        </section>
      </section>
      <section class="panel" aria-label="Adoption operating calendar">
        <div class="calendar-head">
          <div>
            <h2>Operating calendar</h2>
            <p><strong>${escapeHtml(plan.operatingCalendar.startDate)} to ${escapeHtml(plan.operatingCalendar.endDate)}</strong></p>
            <p>Import the buyer pilot cadence into a calendar so owners can run the adoption motion after approval.</p>
          </div>
          <div class="calendar-actions">
            <a href="${escapeHtml(plan.operatingCalendar.icsHref)}" download="adoption-operating-calendar.ics">Download ICS</a>
            <a href="${escapeHtml(plan.operatingCalendar.href)}" download="adoption-operating-calendar.md">Download calendar</a>
          </div>
        </div>
        <div class="calendar-grid">${calendarEvents}</div>
      </section>
      <section class="lower">
        <article class="panel">
          <h2>Interventions</h2>
          <div class="metrics">${interventions}</div>
        </article>
        <aside class="panel">
          <h2>Owner commitments</h2>
          <ul>${commitments}</ul>
          <h2>Expansion criteria</h2>
          <ul>${criteria}</ul>
        </aside>
      </section>
    </main>
    <script id="adoption-success-verify-request" type="application/json">${receiptVerifyRequestJson}</script>
    <script>
      (() => {
        const button = document.querySelector("[data-adoption-success-verify]");
        const output = document.querySelector("[data-adoption-success-verify-result]");
        const source = document.getElementById("adoption-success-verify-request");
        if (!button || !output || !source) return;
        button.addEventListener("click", async () => {
          button.disabled = true;
          output.dataset.status = "checking";
          output.textContent = "Verifying receipt...";
          try {
            const request = JSON.parse(source.textContent || "{}");
            const response = await fetch(${verificationApiPathJson}, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(request)
            });
            const data = await response.json().catch(() => ({}));
            const verification = data.verification || {};
            output.dataset.status = verification.status === "verified" ? "verified" : "mismatch";
            output.textContent = verification.status === "verified"
              ? "Verified in this browser. Checksum " + (verification.actualChecksum || request.checksum) + " matches the day-30 replay payload."
              : "Receipt mismatch. Re-export the adoption plan before accepting this expansion or renewal decision.";
          } catch (error) {
            output.dataset.status = "error";
            output.textContent = "Could not verify receipt. Check the API route and try again.";
          } finally {
            button.disabled = false;
          }
        });
      })();
    </script>
    <footer>Generated by A2A Agent Marketplace as an operating plan for first buyer adoption.</footer>
  </body>
</html>`;
}
