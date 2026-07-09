export const QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_RECEIPT_VERSION = "quick-workflow-buyer-expansion-handoff-signoff.v1";
export const QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH = "/api/quick-workflow-buyer-expansion-handoff-signoff/verify";

export type QuickWorkflowBuyerExpansionHandoffSignoffDecision = "approve-next-window" | "hold-for-repair";
export type QuickWorkflowBuyerExpansionHandoffSignoffStatus = "ready" | "watch" | "blocked";

export type QuickWorkflowBuyerExpansionHandoffSignoffOperatingTaskId =
  | "archive-signoff-verifier"
  | "schedule-retained-value-recheck"
  | "reopen-receipt-chain"
  | "stop-or-repair-below-floor";

export type QuickWorkflowBuyerExpansionHandoffSignoffOperatingTask = {
  id: QuickWorkflowBuyerExpansionHandoffSignoffOperatingTaskId;
  label: string;
  status: QuickWorkflowBuyerExpansionHandoffSignoffStatus;
  owner: string;
  dueLabel: string;
  action: string;
  acceptance: string;
  proof: string;
};

export type QuickWorkflowBuyerExpansionHandoffSignoffCalendarStatus = "scheduled" | "held" | "needs-date";

export type QuickWorkflowBuyerExpansionHandoffSignoffOperatingCalendarPayload = {
  status: QuickWorkflowBuyerExpansionHandoffSignoffCalendarStatus;
  startDate: string;
  endDate: string;
  summary: string;
};

export type QuickWorkflowBuyerExpansionHandoffSignoffRecheckCloseoutStatus = "recordable" | "held" | "needs-date";

export type QuickWorkflowBuyerExpansionHandoffSignoffRecheckCloseoutPayload = {
  status: QuickWorkflowBuyerExpansionHandoffSignoffRecheckCloseoutStatus;
  label: string;
  scheduledDate: string;
  sourceHandoffReceiptId: string;
  sourceHandoffChecksum: string;
  sourceVerifierHref: string;
  valueFloorEvidence: string;
  decisionRule: string;
  nextOwner: string;
  nextAction: string;
  requiredSignals: string[];
  evidenceTemplate: string;
};

export type QuickWorkflowBuyerExpansionHandoffSignoffOperatingPacketPayload = {
  headline: string;
  summary: string;
  recheckWindow: string;
  calendar: QuickWorkflowBuyerExpansionHandoffSignoffOperatingCalendarPayload;
  recheckCloseout: QuickWorkflowBuyerExpansionHandoffSignoffRecheckCloseoutPayload;
  tasks: QuickWorkflowBuyerExpansionHandoffSignoffOperatingTask[];
};

export type QuickWorkflowBuyerExpansionHandoffSignoffOperatingPacket = QuickWorkflowBuyerExpansionHandoffSignoffOperatingPacketPayload & {
  readyCount: number;
  taskTotal: number;
  firstDueLabel: string;
  calendarFilename: string;
  calendarText: string;
  calendarHref: string;
  closeoutFilename: string;
  closeoutMarkdown: string;
  closeoutHref: string;
  csvText: string;
  csvHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickWorkflowBuyerExpansionHandoffSignoffPayload = {
  receiptVersion: typeof QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_RECEIPT_VERSION;
  source: "quick-workflow-buyer-expansion-handoff-signoff";
  decision: QuickWorkflowBuyerExpansionHandoffSignoffDecision;
  status: QuickWorkflowBuyerExpansionHandoffSignoffStatus;
  buyer: string;
  workflow: string;
  handoffReceiptId: string;
  handoffChecksum: string;
  handoffVerifierHref: string;
  approvalLine: string;
  riskLine: string;
  decisionMemo: string;
  controlOwner: string;
  nextAction: string;
  taskReadyCount: number;
  taskTotalCount: number;
  requiredProof: string[];
  operatingPacket: QuickWorkflowBuyerExpansionHandoffSignoffOperatingPacketPayload;
};

export type QuickWorkflowBuyerExpansionHandoffSignoffVerificationRequest = {
  checksum: string;
  payload: QuickWorkflowBuyerExpansionHandoffSignoffPayload;
};

export type QuickWorkflowBuyerExpansionHandoffSignoffVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickWorkflowBuyerExpansionHandoffSignoff = {
  decision: QuickWorkflowBuyerExpansionHandoffSignoffDecision;
  status: QuickWorkflowBuyerExpansionHandoffSignoffStatus;
  buyer: string;
  workflow: string;
  label: string;
  memo: string;
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  verificationApiPath: typeof QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
  operatingPacket: QuickWorkflowBuyerExpansionHandoffSignoffOperatingPacket;
};

export type QuickWorkflowBuyerExpansionHandoffSignoffSource = {
  status: QuickWorkflowBuyerExpansionHandoffSignoffStatus;
  buyer: string;
  workflow: string;
  handoffId: string;
  checksum: string;
  approvalLine: string;
  riskLine: string;
  nextOwner: string;
  nextAction: string;
  recheckDate?: string;
  readyCount: number;
  totalCount: number;
  receipt: {
    verifierHref: string;
  };
  tasks: Array<{
    label: string;
    status: QuickWorkflowBuyerExpansionHandoffSignoffStatus;
    owner: string;
    acceptance: string;
    proof: string;
    href?: string;
  }>;
};

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

function stablePacketHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDateOnly(value: string) {
  if (!DATE_RE.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function compactIcsDate(date: Date) {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function foldIcsLine(line: string) {
  if (line.length <= 74) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    chunks.push(rest.slice(0, 74));
    rest = rest.slice(74);
  }
  chunks.push(rest);
  return chunks.map((chunk, index) => (index === 0 ? chunk : ` ${chunk}`)).join("\r\n");
}

function signoffDecisionFor(status: QuickWorkflowBuyerExpansionHandoffSignoffStatus): QuickWorkflowBuyerExpansionHandoffSignoffDecision {
  return status === "ready" ? "approve-next-window" : "hold-for-repair";
}

function signoffLabelFor(decision: QuickWorkflowBuyerExpansionHandoffSignoffDecision) {
  return decision === "approve-next-window" ? "Procurement can approve the next window" : "Procurement holds until the packet is repaired";
}

function signoffMemoFor(input: QuickWorkflowBuyerExpansionHandoffSignoffSource, decision: QuickWorkflowBuyerExpansionHandoffSignoffDecision) {
  if (decision === "approve-next-window") {
    return `Approve the next operating window only with ${input.handoffId}, its verifier result, the receipt chain, and the retained-value recheck owner attached.`;
  }
  return `Hold procurement approval until ${input.nextOwner} completes: ${input.nextAction}`;
}

function operatingStatusFor(
  status: QuickWorkflowBuyerExpansionHandoffSignoffStatus,
  decision: QuickWorkflowBuyerExpansionHandoffSignoffDecision
): QuickWorkflowBuyerExpansionHandoffSignoffStatus {
  if (decision === "approve-next-window") return "ready";
  return status === "blocked" ? "blocked" : "watch";
}

function sourceTaskProof(input: QuickWorkflowBuyerExpansionHandoffSignoffSource, label: string, fallback: string) {
  return input.tasks.find((task) => task.label === label)?.proof ?? fallback;
}

function operatingTaskAction(input: {
  decision: QuickWorkflowBuyerExpansionHandoffSignoffDecision;
  readyAction: string;
  holdAction: string;
}) {
  return input.decision === "approve-next-window" ? input.readyAction : input.holdAction;
}

function operatingCalendarPayload(input: QuickWorkflowBuyerExpansionHandoffSignoffSource, decision: QuickWorkflowBuyerExpansionHandoffSignoffDecision) {
  const start = parseIsoDateOnly(input.recheckDate ?? "");
  if (!start) {
    return {
      status: "needs-date" as const,
      startDate: "",
      endDate: "",
      summary: "Add a retained-value recheck date before exporting calendar."
    };
  }
  const endDate = addUtcDays(start, 1).toISOString().slice(0, 10);
  if (decision !== "approve-next-window") {
    return {
      status: "held" as const,
      startDate: input.recheckDate ?? "",
      endDate,
      summary: "Calendar hold stays internal until procurement signoff verifies."
    };
  }
  return {
    status: "scheduled" as const,
    startDate: input.recheckDate ?? "",
    endDate,
    summary: `Retained-value recheck for ${input.buyer}`
  };
}

function sentenceLine(label: string, value: string) {
  const trimmed = value.trim();
  return `${label}: ${trimmed}${/[.!?]$/.test(trimmed) ? "" : "."}`;
}

function recheckCloseoutStatusFor(
  calendar: QuickWorkflowBuyerExpansionHandoffSignoffOperatingCalendarPayload,
  decision: QuickWorkflowBuyerExpansionHandoffSignoffDecision
): QuickWorkflowBuyerExpansionHandoffSignoffRecheckCloseoutStatus {
  if (!calendar.startDate) return "needs-date";
  if (decision !== "approve-next-window" || calendar.status !== "scheduled") return "held";
  return "recordable";
}

function buildRecheckCloseoutPayload(input: {
  source: QuickWorkflowBuyerExpansionHandoffSignoffSource;
  decision: QuickWorkflowBuyerExpansionHandoffSignoffDecision;
  calendar: QuickWorkflowBuyerExpansionHandoffSignoffOperatingCalendarPayload;
  receiptChainProof: string;
  valueRecheckProof: string;
}) {
  const status = recheckCloseoutStatusFor(input.calendar, input.decision);
  const scheduledDate = input.calendar.startDate || "not scheduled";
  const label =
    status === "recordable"
      ? "Ready for 30-day retained-value closeout"
      : status === "needs-date"
        ? "Closeout needs a recheck date"
        : "Closeout held until signoff verifies";
  const requiredSignals = [
    "signoff verifier verified HTTP 200",
    "retained-value recheck scheduled",
    "actual retained monthly value recorded",
    "value floor outcome stated",
    "receipt chain reopened",
    "expand, revise, or stop decision recorded"
  ];
  const evidenceTemplate = [
    `Recheck date: ${scheduledDate}.`,
    `Signoff verifier verified HTTP 200 before closeout.`,
    `Source handoff receipt: ${input.source.handoffId} / fnv1a32:${input.source.checksum}.`,
    "Handoff verifier output attached.",
    `Retained-value recheck scheduled on calendar for ${scheduledDate}.`,
    `Finance retained value target named from proof: ${input.valueRecheckProof}.`,
    "Actual retained monthly value: ¥____/month.",
    "Value floor outcome stated: clears floor | below floor.",
    `Receipt chain reopened before decision: ${input.receiptChainProof}.`,
    "Decision recorded: expand | revise | stop.",
    `Stop or repair rule: ${input.source.riskLine}`,
    sentenceLine("Next owner", input.source.nextOwner),
    sentenceLine("Next action", input.source.nextAction)
  ].join("\n");

  return {
    status,
    label,
    scheduledDate,
    sourceHandoffReceiptId: input.source.handoffId,
    sourceHandoffChecksum: `fnv1a32:${input.source.checksum}`,
    sourceVerifierHref: input.source.receipt.verifierHref,
    valueFloorEvidence: input.valueRecheckProof,
    decisionRule: input.source.riskLine,
    nextOwner: input.source.nextOwner,
    nextAction: input.source.nextAction,
    requiredSignals,
    evidenceTemplate
  };
}

function buildOperatingPacketPayload(
  input: QuickWorkflowBuyerExpansionHandoffSignoffSource,
  decision: QuickWorkflowBuyerExpansionHandoffSignoffDecision
): QuickWorkflowBuyerExpansionHandoffSignoffOperatingPacketPayload {
  const status = operatingStatusFor(input.status, decision);
  const handoffProof = `${input.handoffId} / fnv1a32:${input.checksum}`;
  const receiptChainProof = sourceTaskProof(input, "Verify receipt chain", handoffProof);
  const valueRecheckProof = sourceTaskProof(input, "Schedule value recheck", input.riskLine);
  const signoffProof = sourceTaskProof(input, "Record procurement signoff", input.approvalLine);
  const calendar = operatingCalendarPayload(input, decision);
  const recheckDueLabel = calendar.startDate || "Before renewal or wider rollout";
  const headline =
    decision === "approve-next-window" ? "Approval carries an owner ledger" : "Operating ledger is held until repair";
  const summary =
    decision === "approve-next-window"
      ? "Procurement approval now creates four owner commitments: archive the verifier, schedule the retained-value recheck, reopen proof before rollout, and stop or repair if value falls below the floor."
      : "The same owner ledger is prepared, but every commitment stays on hold until the source handoff can be approved.";
  const recheckCloseout = buildRecheckCloseoutPayload({
    source: input,
    decision,
    calendar,
    receiptChainProof,
    valueRecheckProof
  });

  return {
    headline,
    summary,
    recheckWindow: "Before renewal or wider rollout",
    calendar,
    recheckCloseout,
    tasks: [
      {
        id: "archive-signoff-verifier",
        label: "Archive signoff verifier",
        status,
        owner: "Procurement owner",
        dueLabel: "At approval",
        action: operatingTaskAction({
          decision,
          readyAction: `Save the signoff verifier output with ${input.handoffId} before the approval leaves procurement.`,
          holdAction: `Wait for a verified signoff before archiving ${input.handoffId} as approval evidence.`
        }),
        acceptance: "The approval record includes the signoff receipt, source handoff checksum, and verifier outcome.",
        proof: signoffProof
      },
      {
        id: "schedule-retained-value-recheck",
        label: "Schedule retained-value recheck",
        status,
        owner: "Finance owner",
        dueLabel: recheckDueLabel,
        action: operatingTaskAction({
          decision,
          readyAction: calendar.startDate
            ? `Import the retained-value recheck calendar for ${calendar.startDate} and name the value floor, owner, receipt to reopen, and stop condition.`
            : "Create the retained-value recheck hold and name the value floor, owner, receipt to reopen, and stop condition.",
          holdAction: "Do not schedule the recheck until the procurement signoff can reference a verified expansion handoff."
        }),
        acceptance: "Finance confirms retained value still clears the floor before renewal or wider rollout continues.",
        proof: valueRecheckProof
      },
      {
        id: "reopen-receipt-chain",
        label: "Reopen receipt chain",
        status,
        owner: "Proof owner",
        dueLabel: calendar.startDate ? `Before ${calendar.startDate}` : "Before recheck",
        action: operatingTaskAction({
          decision,
          readyAction: "Rerun the handoff, signoff, decision, run, and contract verifiers before the retained-value recheck is accepted.",
          holdAction: "Keep the receipt chain internal until the handoff verifier and signoff verifier both match."
        }),
        acceptance: "Verifier results still match the exported handoff and signoff before any rollout decision.",
        proof: receiptChainProof
      },
      {
        id: "stop-or-repair-below-floor",
        label: "Stop or repair below floor",
        status,
        owner: "Pilot sponsor",
        dueLabel: "If value misses floor",
        action: operatingTaskAction({
          decision,
          readyAction: "Stop expansion or open a repair run if the retained-value recheck no longer clears the floor.",
          holdAction: `Resolve ${input.nextOwner}'s blocker before treating this as an expansion approval.`
        }),
        acceptance: "No wider rollout proceeds with a failed value floor or stale verifier result.",
        proof: input.riskLine
      }
    ]
  };
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function operatingPacketCsv(tasks: QuickWorkflowBuyerExpansionHandoffSignoffOperatingTask[]) {
  return [
    ["task", "status", "owner", "due", "action", "acceptance", "proof"].map(csvCell).join(","),
    ...tasks.map((task) => [task.label, task.status, task.owner, task.dueLabel, task.action, task.acceptance, task.proof].map(csvCell).join(","))
  ].join("\n");
}

function operatingCalendarText(input: {
  payload: QuickWorkflowBuyerExpansionHandoffSignoffOperatingPacketPayload;
  buyer: string;
  workflow: string;
  receiptId: string;
  checksum: string;
}) {
  const start = parseIsoDateOnly(input.payload.calendar.startDate);
  if (!start || input.payload.calendar.status !== "scheduled") return "";
  const end = parseIsoDateOnly(input.payload.calendar.endDate) ?? addUtcDays(start, 1);
  const task = input.payload.tasks.find((item) => item.id === "schedule-retained-value-recheck") ?? input.payload.tasks[0];
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//Buyer Expansion Signoff//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:buyer-expansion-recheck-${compactIcsDate(start)}-${input.checksum}@a2a-agent-marketplace`,
    `DTSTAMP:${compactIcsDate(start)}T000000Z`,
    `DTSTART;VALUE=DATE:${compactIcsDate(start)}`,
    `DTEND;VALUE=DATE:${compactIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(`Retained-value recheck - ${task.owner}`)}`,
    `DESCRIPTION:${escapeIcsText(`Buyer: ${input.buyer}\nWorkflow: ${input.workflow}\nAction: ${task.action}\nAcceptance: ${task.acceptance}\nProof: ${task.proof}\nSignoff: ${input.receiptId} / fnv1a32:${input.checksum}`)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  return icsLines.map(foldIcsLine).join("\r\n");
}

export function quickWorkflowBuyerExpansionHandoffSignoffPayloadJson(payload: QuickWorkflowBuyerExpansionHandoffSignoffPayload) {
  return canonicalJson(payload);
}

export function quickWorkflowBuyerExpansionHandoffSignoffChecksum(payload: QuickWorkflowBuyerExpansionHandoffSignoffPayload) {
  return stablePacketHash(quickWorkflowBuyerExpansionHandoffSignoffPayloadJson(payload));
}

export function quickWorkflowBuyerExpansionHandoffSignoffRequestJson(input: QuickWorkflowBuyerExpansionHandoffSignoffVerificationRequest) {
  return canonicalJson(input);
}

export function quickWorkflowBuyerExpansionHandoffSignoffVerifierHref(verificationRequestJson: string) {
  const params = new URLSearchParams({
    request: verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

export function verifyQuickWorkflowBuyerExpansionHandoffSignoffReceipt(
  input: QuickWorkflowBuyerExpansionHandoffSignoffVerificationRequest
): QuickWorkflowBuyerExpansionHandoffSignoffVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickWorkflowBuyerExpansionHandoffSignoffChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Quick workflow buyer expansion handoff signoff checksum matches the source handoff, approval control, required proof, next action, and operating owner ledger."
      : "Quick workflow buyer expansion handoff signoff checksum does not match the exported procurement decision and operating packet. Re-export the signoff before accepting approval evidence."
  };
}

export function buildQuickWorkflowBuyerExpansionHandoffSignoff(input: QuickWorkflowBuyerExpansionHandoffSignoffSource): QuickWorkflowBuyerExpansionHandoffSignoff {
  const decision = signoffDecisionFor(input.status);
  const label = signoffLabelFor(decision);
  const memo = signoffMemoFor(input, decision);
  const operatingPacketPayload = buildOperatingPacketPayload(input, decision);
  const payload: QuickWorkflowBuyerExpansionHandoffSignoffPayload = {
    receiptVersion: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_RECEIPT_VERSION,
    source: "quick-workflow-buyer-expansion-handoff-signoff",
    decision,
    status: input.status,
    buyer: input.buyer,
    workflow: input.workflow,
    handoffReceiptId: input.handoffId,
    handoffChecksum: `fnv1a32:${input.checksum}`,
    handoffVerifierHref: input.receipt.verifierHref,
    approvalLine: input.approvalLine,
    riskLine: input.riskLine,
    decisionMemo: memo,
    controlOwner: input.nextOwner,
    nextAction: input.nextAction,
    taskReadyCount: input.readyCount,
    taskTotalCount: input.totalCount,
    requiredProof: input.tasks.map((task) => `${task.label} / ${task.owner} / ${task.status}: ${task.proof}`),
    operatingPacket: operatingPacketPayload
  };
  const payloadJson = quickWorkflowBuyerExpansionHandoffSignoffPayloadJson(payload);
  const checksum = quickWorkflowBuyerExpansionHandoffSignoffChecksum(payload);
  const verificationRequestJson = quickWorkflowBuyerExpansionHandoffSignoffRequestJson({ checksum, payload });
  const receiptId = `quick-buyer-expansion-handoff-signoff-${input.status}-${checksum}`;
  const signoffVerifierHref = quickWorkflowBuyerExpansionHandoffSignoffVerifierHref(verificationRequestJson);
  const operatingCsvText = operatingPacketCsv(operatingPacketPayload.tasks);
  const operatingCalendarFilename = operatingPacketPayload.calendar.startDate
    ? `quick-buyer-expansion-recheck-${operatingPacketPayload.calendar.startDate}.ics`
    : "quick-buyer-expansion-recheck.ics";
  const operatingCalendar = operatingCalendarText({
    payload: operatingPacketPayload,
    buyer: input.buyer,
    workflow: input.workflow,
    receiptId,
    checksum
  });
  const operatingReadyCount = operatingPacketPayload.tasks.filter((task) => task.status === "ready").length;
  const operatingFirstDueLabel = operatingPacketPayload.tasks.find((task) => task.status !== "ready")?.dueLabel ?? operatingPacketPayload.tasks[0]?.dueLabel ?? "No operating task";
  const closeoutFilename = operatingPacketPayload.calendar.startDate
    ? `quick-buyer-expansion-recheck-closeout-${operatingPacketPayload.calendar.startDate}.md`
    : "quick-buyer-expansion-recheck-closeout.md";
  const closeoutMarkdown = [
    "# Retained-value recheck closeout template",
    "",
    `Status: ${operatingPacketPayload.recheckCloseout.status}`,
    `Label: ${operatingPacketPayload.recheckCloseout.label}`,
    `Scheduled date: ${operatingPacketPayload.recheckCloseout.scheduledDate}`,
    `Signoff receipt: ${receiptId} / fnv1a32:${checksum}`,
    `Signoff verifier: ${signoffVerifierHref}`,
    `Source handoff: ${operatingPacketPayload.recheckCloseout.sourceHandoffReceiptId} / ${operatingPacketPayload.recheckCloseout.sourceHandoffChecksum}`,
    `Source verifier: ${operatingPacketPayload.recheckCloseout.sourceVerifierHref}`,
    `Value floor evidence: ${operatingPacketPayload.recheckCloseout.valueFloorEvidence}`,
    `Decision rule: ${operatingPacketPayload.recheckCloseout.decisionRule}`,
    "",
    "## Required closeout signals",
    ...operatingPacketPayload.recheckCloseout.requiredSignals.map((signal) => `- ${signal}`),
    "",
    "## Paste into closeout evidence",
    "```text",
    operatingPacketPayload.recheckCloseout.evidenceTemplate,
    "```"
  ].join("\n");
  const operatingExportMarkdown = [
    "# Quick workflow buyer expansion operating packet",
    "",
    operatingPacketPayload.headline,
    operatingPacketPayload.summary,
    `Status: ${input.status}`,
    `Decision: ${decision}`,
    `Signoff receipt: ${receiptId} / fnv1a32:${checksum}`,
    `Source handoff: ${input.handoffId} / fnv1a32:${input.checksum}`,
    `Recheck window: ${operatingPacketPayload.recheckWindow}`,
    `Calendar status: ${operatingPacketPayload.calendar.status}`,
    `Calendar start: ${operatingPacketPayload.calendar.startDate || "not scheduled"}`,
    `Calendar end: ${operatingPacketPayload.calendar.endDate || "not scheduled"}`,
    `Recheck closeout: ${operatingPacketPayload.recheckCloseout.status}`,
    `First due: ${operatingFirstDueLabel}`,
    "",
    "## Owner ledger",
    ...operatingPacketPayload.tasks.map((task) =>
      [
        `- [${task.status}] ${task.dueLabel} / ${task.owner} / ${task.label}`,
        `  Action: ${task.action}`,
        `  Acceptance: ${task.acceptance}`,
        `  Proof: ${task.proof}`
      ].join("\n")
    ),
    "",
    "## CSV",
    "```csv",
    operatingCsvText,
    "```",
    "",
    "## Calendar",
    operatingCalendar
      ? `Calendar export: ${operatingCalendarFilename}`
      : `Calendar export held: ${operatingPacketPayload.calendar.summary}`,
    "",
    "## Recheck closeout template",
    `Closeout export: ${closeoutFilename}`,
    operatingPacketPayload.recheckCloseout.evidenceTemplate
  ].join("\n");
  const operatingPacket: QuickWorkflowBuyerExpansionHandoffSignoffOperatingPacket = {
    ...operatingPacketPayload,
    readyCount: operatingReadyCount,
    taskTotal: operatingPacketPayload.tasks.length,
    firstDueLabel: operatingFirstDueLabel,
    calendarFilename: operatingCalendarFilename,
    calendarText: operatingCalendar,
    calendarHref: operatingCalendar ? `data:text/calendar;charset=utf-8,${encodeURIComponent(operatingCalendar)}` : "",
    closeoutFilename,
    closeoutMarkdown,
    closeoutHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(closeoutMarkdown)}`,
    csvText: operatingCsvText,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(operatingCsvText)}`,
    exportMarkdown: operatingExportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(operatingExportMarkdown)}`
  };
  const exportMarkdown = [
    "# Quick workflow buyer expansion procurement signoff",
    "",
    label,
    memo,
    `Decision: ${decision}`,
    `Status: ${input.status}`,
    `Signoff receipt: ${receiptId}`,
    `Checksum: fnv1a32:${checksum}`,
    `Source handoff: ${input.handoffId} / fnv1a32:${input.checksum}`,
    `Source verifier: ${input.receipt.verifierHref}`,
    `API verification: POST ${QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH}`,
    `Control owner: ${input.nextOwner}`,
    `Next action: ${input.nextAction}`,
    "",
    "## Required proof",
    ...payload.requiredProof.map((proof) => `- ${proof}`),
    "",
    "## Operating packet",
    operatingPacket.headline,
    operatingPacket.summary,
    `Recheck window: ${operatingPacket.recheckWindow}`,
    `Calendar status: ${operatingPacket.calendar.status}`,
    `Calendar start: ${operatingPacket.calendar.startDate || "not scheduled"}`,
    `Recheck closeout: ${operatingPacket.recheckCloseout.status}`,
    `Owner tasks: ${operatingPacket.readyCount}/${operatingPacket.taskTotal}`,
    ...operatingPacket.tasks.map((task) => `- [${task.status}] ${task.dueLabel} / ${task.owner} / ${task.label}: ${task.action}`)
  ].join("\n");

  return {
    decision,
    status: input.status,
    buyer: input.buyer,
    workflow: input.workflow,
    label,
    memo,
    receiptId,
    checksumAlgorithm: "fnv1a32",
    checksum,
    verificationApiPath: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verifierHref: signoffVerifierHref,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    operatingPacket
  };
}
