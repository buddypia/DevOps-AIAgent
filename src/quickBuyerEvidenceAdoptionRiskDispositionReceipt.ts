import type {
  QuickBuyerEvidenceAdoptionRisk,
  QuickBuyerEvidenceAdoptionRiskLedger,
  QuickBuyerEvidencePackSharePayload,
  QuickBuyerRoomPreviewStatus
} from "./quickBuyerEvidenceShare.js";

export const QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_RECEIPT_VERSION = "quick-buyer-evidence-adoption-risk-disposition.v1";
export const QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_VERIFY_PATH = "/api/quick-buyer-evidence-adoption-risk-disposition/verify";
export const QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_RECEIPT_VERSION = "quick-buyer-evidence-adoption-risk-owner-closeout.v1";
export const QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_VERIFY_PATH = "/api/quick-buyer-evidence-adoption-risk-owner-closeout/verify";
export const QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_RECEIPT_VERSION = "quick-buyer-evidence-adoption-risk-send-control.v1";
export const QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_VERIFY_PATH = "/api/quick-buyer-evidence-adoption-risk-send-control/verify";

export type QuickBuyerEvidenceAdoptionRiskDispositionDecision = "accept-risk-ledger" | "repair-open-risk" | "hold-buyer-send";
export type QuickBuyerEvidenceAdoptionRiskOwnerCloseoutDecision = "accept-risk-closeout" | "hold-risk-closeout";
export type QuickBuyerEvidenceAdoptionRiskSendControlDecision = "reopen-buyer-send" | "run-risk-recheck" | "hold-buyer-send";
export type QuickBuyerEvidenceAdoptionRiskSendControlCriterionStatus = "pass" | "watch" | "block";

export type QuickBuyerEvidenceAdoptionRiskDispositionItem = Pick<
  QuickBuyerEvidenceAdoptionRisk,
  "id" | "label" | "status" | "severity" | "owner" | "exposure" | "mitigation" | "proofRequired" | "evidence" | "href"
>;

export type QuickBuyerEvidenceAdoptionRiskDispositionPayload = {
  receiptVersion: typeof QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_RECEIPT_VERSION;
  status: QuickBuyerRoomPreviewStatus;
  decision: QuickBuyerEvidenceAdoptionRiskDispositionDecision;
  buyer: string;
  workflow: string;
  reviewerName: string;
  generatedAt: string;
  reviewerNote: string;
  ledgerStatus: QuickBuyerRoomPreviewStatus;
  clearanceScore: number;
  clearedCount: number;
  riskTotal: number;
  highRiskCount: number;
  sourceReceiptId: string;
  sourceChecksum: string;
  sourceLedgerHash: string;
  nextOwner: string;
  nextAction: string;
  proof: string;
  risks: QuickBuyerEvidenceAdoptionRiskDispositionItem[];
};

export type QuickBuyerEvidenceAdoptionRiskDispositionVerificationRequest = {
  checksum: string;
  payload: QuickBuyerEvidenceAdoptionRiskDispositionPayload;
};

export type QuickBuyerEvidenceAdoptionRiskDispositionVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickBuyerEvidenceAdoptionRiskDispositionReceipt = {
  payload: QuickBuyerEvidenceAdoptionRiskDispositionPayload;
  checksum: string;
  requestJson: string;
  requestHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
  verification: QuickBuyerEvidenceAdoptionRiskDispositionVerification;
};

export type QuickBuyerEvidenceAdoptionRiskDispositionOwnerTask = {
  id: string;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  dueLabel: string;
  action: string;
  closeCondition: string;
  evidence: string;
  href: string;
};

export type QuickBuyerEvidenceAdoptionRiskDispositionOwnerHandoff = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  taskTotal: number;
  firstOwner: string;
  firstAction: string;
  tasks: QuickBuyerEvidenceAdoptionRiskDispositionOwnerTask[];
  calendarStartDate: string;
  calendarEndDate: string;
  calendarText: string;
  calendarHref: string;
  csv: string;
  csvHref: string;
  exportMarkdown: string;
  exportHref: string;
  mailHref: string;
};

export type QuickBuyerEvidenceAdoptionRiskOwnerCloseoutTaskOutcome = Pick<
  QuickBuyerEvidenceAdoptionRiskDispositionOwnerTask,
  "id" | "label" | "status" | "owner" | "dueLabel" | "action" | "closeCondition" | "evidence" | "href"
> & {
  closed: boolean;
  outcomeNote: string;
};

export type QuickBuyerEvidenceAdoptionRiskOwnerCloseoutPayload = {
  receiptVersion: typeof QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_RECEIPT_VERSION;
  status: QuickBuyerRoomPreviewStatus;
  decision: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutDecision;
  buyer: string;
  workflow: string;
  acceptedBy: string;
  generatedAt: string;
  evidenceNote: string;
  sourceReceiptId: string;
  sourceChecksum: string;
  sourceDispositionChecksum: string;
  sourceLedgerHash: string;
  sourceHandoffStatus: QuickBuyerRoomPreviewStatus;
  closedTaskCount: number;
  taskCount: number;
  openTaskCount: number;
  nextOwner: string;
  nextAction: string;
  tasks: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutTaskOutcome[];
};

export type QuickBuyerEvidenceAdoptionRiskOwnerCloseoutVerificationRequest = {
  checksum: string;
  payload: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutPayload;
};

export type QuickBuyerEvidenceAdoptionRiskOwnerCloseoutVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt = {
  payload: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutPayload;
  checksum: string;
  requestJson: string;
  requestHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
  verification: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutVerification;
};

export type QuickBuyerEvidenceAdoptionRiskRecheckStep = {
  id: string;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  dayOffset: number;
  action: string;
  closeCondition: string;
  evidence: string;
  href: string;
};

export type QuickBuyerEvidenceAdoptionRiskRecheckPacket = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  startDate: string;
  endDate: string;
  readyCount: number;
  stepTotal: number;
  currentOwner: string;
  currentAction: string;
  steps: QuickBuyerEvidenceAdoptionRiskRecheckStep[];
  calendarText: string;
  calendarHref: string;
  exportMarkdown: string;
  exportHref: string;
  mailHref: string;
};

export type QuickBuyerEvidenceAdoptionRiskSendControlCriterion = {
  id: string;
  label: string;
  status: QuickBuyerEvidenceAdoptionRiskSendControlCriterionStatus;
  owner: string;
  evidence: string;
  action: string;
  closeCondition: string;
  href: string;
};

export type QuickBuyerEvidenceAdoptionRiskSendControlPayload = {
  receiptVersion: typeof QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_RECEIPT_VERSION;
  status: QuickBuyerRoomPreviewStatus;
  decision: QuickBuyerEvidenceAdoptionRiskSendControlDecision;
  buyer: string;
  workflow: string;
  generatedAt: string;
  sourceReceiptId: string;
  sourceChecksum: string;
  sourceDispositionChecksum: string;
  sourceRiskCloseoutChecksum: string;
  sourceLedgerHash: string;
  recheckStartDate: string;
  recheckEndDate: string;
  recheckReadyCount: number;
  recheckStepTotal: number;
  nextOwner: string;
  nextAction: string;
  stopRule: string;
  criteria: QuickBuyerEvidenceAdoptionRiskSendControlCriterion[];
};

export type QuickBuyerEvidenceAdoptionRiskSendControlVerificationRequest = {
  checksum: string;
  payload: QuickBuyerEvidenceAdoptionRiskSendControlPayload;
};

export type QuickBuyerEvidenceAdoptionRiskSendControlVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickBuyerEvidenceAdoptionRiskSendControlReceipt = {
  payload: QuickBuyerEvidenceAdoptionRiskSendControlPayload;
  checksum: string;
  requestJson: string;
  requestHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
  verification: QuickBuyerEvidenceAdoptionRiskSendControlVerification;
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

function parseIsoDateOnly(value: string) {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10) === trimmed ? date : null;
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addUtcBusinessDays(date: Date, businessDays: number) {
  let next = new Date(date.getTime());
  let remaining = Math.max(0, businessDays);
  while (remaining > 0) {
    next = addUtcDays(next, 1);
    const day = next.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return next;
}

function compactIcsDate(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function foldIcsLine(line: string) {
  const maxLength = 74;
  if (line.length <= maxLength) return line;
  const chunks = [];
  let remaining = line;
  while (remaining.length > maxLength) {
    chunks.push(remaining.slice(0, maxLength));
    remaining = ` ${remaining.slice(maxLength)}`;
  }
  chunks.push(remaining);
  return chunks.join("\r\n");
}

function receiptVerifierPrefillHref(verificationRequestJson: string) {
  const params = new URLSearchParams({
    request: verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

function receiptText(value: unknown, fallback: string, maxLength = 1200) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

export function quickBuyerEvidenceAdoptionRiskDispositionDefaultDecision(
  ledger: QuickBuyerEvidenceAdoptionRiskLedger
): QuickBuyerEvidenceAdoptionRiskDispositionDecision {
  if (ledger.status === "ready") return "accept-risk-ledger";
  if (ledger.status === "watch") return "repair-open-risk";
  return "hold-buyer-send";
}

function riskDispositionStatus(decision: QuickBuyerEvidenceAdoptionRiskDispositionDecision, ledger: QuickBuyerEvidenceAdoptionRiskLedger): QuickBuyerRoomPreviewStatus {
  if (decision === "hold-buyer-send") return "blocked";
  if (decision === "repair-open-risk") return ledger.status === "blocked" ? "blocked" : "watch";
  return ledger.status === "ready" ? "ready" : ledger.status === "watch" ? "watch" : "blocked";
}

function riskDispositionNextOwner(decision: QuickBuyerEvidenceAdoptionRiskDispositionDecision, ledger: QuickBuyerEvidenceAdoptionRiskLedger) {
  if (decision === "accept-risk-ledger") return "Launch owner";
  if (decision === "repair-open-risk") return ledger.firstOpenRisk?.owner ?? "Evidence owner";
  return "Decision owner";
}

function riskDispositionNextAction(decision: QuickBuyerEvidenceAdoptionRiskDispositionDecision, ledger: QuickBuyerEvidenceAdoptionRiskLedger) {
  if (decision === "accept-risk-ledger") return "Attach this verified risk disposition to the buyer approval thread.";
  if (decision === "repair-open-risk") return ledger.firstOpenRisk?.mitigation ?? "Repair the first open adoption risk before buyer send.";
  return "Keep buyer send held until the risk ledger is re-exported and verified.";
}

function ledgerHash(ledger: QuickBuyerEvidenceAdoptionRiskLedger) {
  return stablePacketHash(
    canonicalJson({
      status: ledger.status,
      clearanceScore: ledger.clearanceScore,
      clearedCount: ledger.clearedCount,
      riskTotal: ledger.riskTotal,
      highRiskCount: ledger.highRiskCount,
      risks: ledger.risks
    })
  );
}

function riskOwnerHandoffCsv(tasks: QuickBuyerEvidenceAdoptionRiskDispositionOwnerTask[]) {
  return [
    ["taskId", "label", "status", "owner", "due", "action", "closeCondition", "evidence", "href"],
    ...tasks.map((task) => [task.id, task.label, task.status, task.owner, task.dueLabel, task.action, task.closeCondition, task.evidence, task.href])
  ]
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(",")
    )
    .join("\n");
}

function riskOwnerTaskDueLabel(index: number) {
  if (index === 0) return "Today";
  if (index === 1) return "+1 business day";
  return `+${index} business days`;
}

function riskOwnerHandoffStartDate(receipt: QuickBuyerEvidenceAdoptionRiskDispositionReceipt) {
  const generatedDate = receipt.payload.generatedAt.slice(0, 10);
  return parseIsoDateOnly(generatedDate) ? generatedDate : "2026-07-08";
}

function riskOwnerTaskStartDate(start: Date, dueLabel: string, index: number) {
  if (dueLabel === "Today") return start;
  const businessDayMatch = /^\+(\d+) business days?$/.exec(dueLabel);
  if (businessDayMatch) return addUtcBusinessDays(start, Number(businessDayMatch[1]));
  const calendarDayMatch = /^\+(\d+) days?$/.exec(dueLabel);
  if (calendarDayMatch) return addUtcDays(start, Number(calendarDayMatch[1]));
  return addUtcBusinessDays(start, index);
}

function riskOwnerHandoffTasks(receipt: QuickBuyerEvidenceAdoptionRiskDispositionReceipt): QuickBuyerEvidenceAdoptionRiskDispositionOwnerTask[] {
  const receiptTask: QuickBuyerEvidenceAdoptionRiskDispositionOwnerTask = {
    id: "attach-risk-disposition-receipt",
    label: "Attach risk disposition receipt",
    status: "ready",
    owner: receipt.payload.reviewerName,
    dueLabel: "Today",
    action: "Attach the verified risk disposition receipt before buyer-send work starts.",
    closeCondition: `Owner can verify fnv1a32:${receipt.checksum} in the receipt desk.`,
    evidence: receipt.payload.proof,
    href: receipt.verifierHref
  };
  const openRisks = receipt.payload.risks.filter((risk) => risk.status !== "ready");

  if (receipt.payload.decision === "accept-risk-ledger" && openRisks.length === 0) {
    return [
      receiptTask,
      {
        id: "open-buyer-send-control",
        label: "Open buyer send control",
        status: "ready",
        owner: receipt.payload.nextOwner,
        dueLabel: "+1 business day",
        action: receipt.payload.nextAction,
        closeCondition: "Buyer-send thread includes receipt checksum, source ledger hash, owner, and stop rule.",
        evidence: receipt.payload.reviewerNote,
        href: receipt.verifierHref
      }
    ];
  }

  const risksToAssign = openRisks.length > 0 ? openRisks : receipt.payload.risks;
  return [
    receiptTask,
    ...risksToAssign.map((risk, index) => ({
      id: `${receipt.payload.decision === "hold-buyer-send" ? "hold" : "repair"}-${risk.id}`,
      label: `${receipt.payload.decision === "hold-buyer-send" ? "Hold" : "Repair"} ${risk.label}`,
      status: receipt.payload.decision === "hold-buyer-send" && risk.status === "ready" ? "watch" : risk.status,
      owner: risk.owner,
      dueLabel: riskOwnerTaskDueLabel(index + 1),
      action:
        receipt.payload.decision === "hold-buyer-send"
          ? `Hold buyer send until ${risk.label.toLowerCase()} is re-exported with proof.`
          : risk.mitigation,
      closeCondition: `${risk.owner} attaches proof: ${risk.proofRequired}`,
      evidence: risk.evidence,
      href: risk.href || receipt.verifierHref
    }))
  ];
}

function riskOwnerHandoffCalendar(input: {
  receipt: QuickBuyerEvidenceAdoptionRiskDispositionReceipt;
  tasks: QuickBuyerEvidenceAdoptionRiskDispositionOwnerTask[];
  startDate: string;
}) {
  const start = parseIsoDateOnly(input.startDate);
  if (!start) return { calendarEndDate: input.startDate, calendarText: "", calendarHref: "" };
  const events = input.tasks.map((task, index) => {
    const eventStart = riskOwnerTaskStartDate(start, task.dueLabel, index);
    return {
      task,
      eventStart,
      eventEnd: addUtcDays(eventStart, 1)
    };
  });
  const calendarEndDate = events.length
    ? events
        .map((event) => event.eventStart)
        .reduce((latest, candidate) => (candidate.getTime() > latest.getTime() ? candidate : latest), events[0].eventStart)
        .toISOString()
        .slice(0, 10)
    : input.startDate;
  const checksum = stablePacketHash(
    [
      input.startDate,
      calendarEndDate,
      input.receipt.checksum,
      input.receipt.payload.decision,
      input.receipt.payload.sourceLedgerHash,
      ...input.tasks.map((task) => `${task.id}:${task.status}:${task.owner}:${task.dueLabel}:${task.action}:${task.closeCondition}:${task.href}`)
    ].join("\n")
  );
  const calendarLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//Buyer Adoption Risk Owner Handoff//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap(({ task, eventStart, eventEnd }) => [
      "BEGIN:VEVENT",
      `UID:${task.id}-${compactIcsDate(eventStart)}-${checksum}@a2a-agent-marketplace`,
      `DTSTAMP:${compactIcsDate(start)}T000000Z`,
      `DTSTART;VALUE=DATE:${compactIcsDate(eventStart)}`,
      `DTEND;VALUE=DATE:${compactIcsDate(eventEnd)}`,
      `SUMMARY:${escapeIcsText(`${task.dueLabel} ${task.label} - ${task.owner}`)}`,
      `DESCRIPTION:${escapeIcsText(`Status: ${task.status}\nAction: ${task.action}\nClose: ${task.closeCondition}\nEvidence: ${task.evidence}\nReceipt: fnv1a32:${input.receipt.checksum}`)}`,
      `X-A2A-HREF:${escapeIcsText(task.href)}`,
      "END:VEVENT"
    ]),
    "END:VCALENDAR"
  ];
  const calendarText = calendarLines.map(foldIcsLine).join("\r\n");
  return {
    calendarEndDate,
    calendarText,
    calendarHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(calendarText)}`
  };
}

export function quickBuyerEvidenceAdoptionRiskDispositionPayloadJson(payload: QuickBuyerEvidenceAdoptionRiskDispositionPayload) {
  return canonicalJson(payload);
}

export function quickBuyerEvidenceAdoptionRiskDispositionChecksum(payload: QuickBuyerEvidenceAdoptionRiskDispositionPayload) {
  return stablePacketHash(quickBuyerEvidenceAdoptionRiskDispositionPayloadJson(payload));
}

export function quickBuyerEvidenceAdoptionRiskDispositionRequestJson(input: QuickBuyerEvidenceAdoptionRiskDispositionVerificationRequest) {
  return canonicalJson(input);
}

export function quickBuyerEvidenceAdoptionRiskOwnerCloseoutPayloadJson(payload: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutPayload) {
  return canonicalJson(payload);
}

export function quickBuyerEvidenceAdoptionRiskOwnerCloseoutChecksum(payload: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutPayload) {
  return stablePacketHash(quickBuyerEvidenceAdoptionRiskOwnerCloseoutPayloadJson(payload));
}

export function quickBuyerEvidenceAdoptionRiskOwnerCloseoutRequestJson(input: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutVerificationRequest) {
  return canonicalJson(input);
}

export function quickBuyerEvidenceAdoptionRiskSendControlPayloadJson(payload: QuickBuyerEvidenceAdoptionRiskSendControlPayload) {
  return canonicalJson(payload);
}

export function quickBuyerEvidenceAdoptionRiskSendControlChecksum(payload: QuickBuyerEvidenceAdoptionRiskSendControlPayload) {
  return stablePacketHash(quickBuyerEvidenceAdoptionRiskSendControlPayloadJson(payload));
}

export function quickBuyerEvidenceAdoptionRiskSendControlRequestJson(input: QuickBuyerEvidenceAdoptionRiskSendControlVerificationRequest) {
  return canonicalJson(input);
}

export function verifyQuickBuyerEvidenceAdoptionRiskDispositionReceipt(
  input: QuickBuyerEvidenceAdoptionRiskDispositionVerificationRequest
): QuickBuyerEvidenceAdoptionRiskDispositionVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickBuyerEvidenceAdoptionRiskDispositionChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Buyer adoption risk disposition checksum matches the source ledger, risk rows, reviewer note, disposition decision, and next owner action."
      : "Buyer adoption risk disposition checksum does not match the exported payload. Do not rely on this disposition until it is re-exported."
  };
}

export function verifyQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt(
  input: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutVerificationRequest
): QuickBuyerEvidenceAdoptionRiskOwnerCloseoutVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickBuyerEvidenceAdoptionRiskOwnerCloseoutChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Buyer adoption risk owner closeout checksum matches the disposition receipt, handoff status, task outcomes, evidence note, and next buyer-send action."
      : "Buyer adoption risk owner closeout checksum does not match the exported owner evidence. Do not reopen buyer send until this closeout is re-exported."
  };
}

export function verifyQuickBuyerEvidenceAdoptionRiskSendControlReceipt(
  input: QuickBuyerEvidenceAdoptionRiskSendControlVerificationRequest
): QuickBuyerEvidenceAdoptionRiskSendControlVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickBuyerEvidenceAdoptionRiskSendControlChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Buyer-send risk control checksum matches the risk closeout receipt, recheck window, control criteria, stop rule, and next owner action."
      : "Buyer-send risk control checksum does not match the exported control payload. Do not reopen buyer send until this control is re-exported."
  };
}

export function buildQuickBuyerEvidenceAdoptionRiskDispositionReceipt(input: {
  payload: QuickBuyerEvidencePackSharePayload;
  ledger: QuickBuyerEvidenceAdoptionRiskLedger;
  decision: QuickBuyerEvidenceAdoptionRiskDispositionDecision;
  reviewerName?: string;
  reviewerNote?: string;
  generatedAt?: string;
}): QuickBuyerEvidenceAdoptionRiskDispositionReceipt {
  const status = riskDispositionStatus(input.decision, input.ledger);
  const reviewerName = receiptText(input.reviewerName, "Buyer risk reviewer", 180);
  const reviewerNote = receiptText(input.reviewerNote, input.ledger.summary, 1800);
  const nextOwner = riskDispositionNextOwner(input.decision, input.ledger);
  const nextAction = riskDispositionNextAction(input.decision, input.ledger);
  const sourceLedgerHash = `fnv1a32:${ledgerHash(input.ledger)}`;
  const payload: QuickBuyerEvidenceAdoptionRiskDispositionPayload = {
    receiptVersion: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_RECEIPT_VERSION,
    status,
    decision: input.decision,
    buyer: input.payload.buyer || "Buyer",
    workflow: input.payload.workflow || "Workflow not included",
    reviewerName,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    reviewerNote,
    ledgerStatus: input.ledger.status,
    clearanceScore: input.ledger.clearanceScore,
    clearedCount: input.ledger.clearedCount,
    riskTotal: input.ledger.riskTotal,
    highRiskCount: input.ledger.highRiskCount,
    sourceReceiptId: input.payload.sourceReceiptId || "buyer-evidence-pack",
    sourceChecksum: input.payload.sourceChecksum || "checksum missing",
    sourceLedgerHash,
    nextOwner,
    nextAction,
    proof: `${input.payload.sourceReceiptId || "buyer-evidence-pack"} / ${input.payload.sourceChecksum || "checksum missing"} / ${sourceLedgerHash} / ${
      input.ledger.clearedCount
    }/${input.ledger.riskTotal} risks cleared / ${input.ledger.highRiskCount} high risks`,
    risks: input.ledger.risks.map((risk) => ({
      id: risk.id,
      label: risk.label,
      status: risk.status,
      severity: risk.severity,
      owner: risk.owner,
      exposure: risk.exposure,
      mitigation: risk.mitigation,
      proofRequired: risk.proofRequired,
      evidence: risk.evidence,
      href: risk.href
    }))
  };
  const checksum = quickBuyerEvidenceAdoptionRiskDispositionChecksum(payload);
  const requestJson = quickBuyerEvidenceAdoptionRiskDispositionRequestJson({ checksum, payload });
  const exportMarkdown = [
    "# Buyer adoption risk disposition receipt",
    "",
    `Buyer: ${payload.buyer}`,
    `Decision: ${payload.decision}`,
    `Status: ${payload.status}`,
    `Reviewer: ${payload.reviewerName}`,
    `Checksum: fnv1a32:${checksum}`,
    `Source ledger: ${payload.sourceLedgerHash}`,
    `Risk clearance: ${payload.clearedCount}/${payload.riskTotal}`,
    `High risks: ${payload.highRiskCount}`,
    "",
    "## Reviewer note",
    payload.reviewerNote,
    "",
    "## Next action",
    `${payload.nextOwner}: ${payload.nextAction}`,
    "",
    "## Risks",
    ...payload.risks.map((risk) => `- [${risk.status}/${risk.severity}] ${risk.label} / ${risk.owner}: ${risk.exposure} Mitigation: ${risk.mitigation}`)
  ].join("\n");

  return {
    payload,
    checksum,
    requestJson,
    requestHref: `data:application/json;charset=utf-8,${encodeURIComponent(requestJson)}`,
    verifierHref: receiptVerifierPrefillHref(requestJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    verification: verifyQuickBuyerEvidenceAdoptionRiskDispositionReceipt({ checksum, payload })
  };
}

export function buildQuickBuyerEvidenceAdoptionRiskDispositionOwnerHandoff(
  receipt: QuickBuyerEvidenceAdoptionRiskDispositionReceipt
): QuickBuyerEvidenceAdoptionRiskDispositionOwnerHandoff {
  const tasks = riskOwnerHandoffTasks(receipt);
  const readyCount = tasks.filter((task) => task.status === "ready").length;
  const taskStatus: QuickBuyerRoomPreviewStatus = tasks.some((task) => task.status === "blocked") ? "blocked" : tasks.some((task) => task.status === "watch") ? "watch" : "ready";
  const status: QuickBuyerRoomPreviewStatus = receipt.payload.decision === "hold-buyer-send" ? "blocked" : taskStatus;
  const firstOpenTask = tasks.find((task) => task.status !== "ready") ?? tasks[0];
  const calendarStartDate = riskOwnerHandoffStartDate(receipt);
  const calendar = riskOwnerHandoffCalendar({ receipt, tasks, startDate: calendarStartDate });
  const headline =
    receipt.payload.decision === "accept-risk-ledger" && status === "ready"
      ? "Risk disposition is ready for buyer-send ownership"
      : receipt.payload.decision === "hold-buyer-send"
        ? "Buyer send stays held until risk owner work closes"
        : "Risk disposition becomes an owner repair handoff";
  const summary =
    status === "ready"
      ? `${readyCount}/${tasks.length} owner tasks are ready with the risk disposition receipt attached.`
      : `${readyCount}/${tasks.length} owner tasks are ready. ${firstOpenTask.owner} owns: ${firstOpenTask.action}`;
  const csv = riskOwnerHandoffCsv(tasks);
  const exportMarkdown = [
    "# Buyer adoption risk owner handoff",
    "",
    `Buyer: ${receipt.payload.buyer}`,
    `Workflow: ${receipt.payload.workflow}`,
    `Decision: ${receipt.payload.decision}`,
    `Status: ${status}`,
    `Receipt: fnv1a32:${receipt.checksum}`,
    `Source ledger: ${receipt.payload.sourceLedgerHash}`,
    `First owner: ${firstOpenTask.owner}`,
    "",
    "## Summary",
    summary,
    "",
    "## Owner tasks",
    ...tasks.map((task) =>
      [
        `- [${task.status}] ${task.dueLabel} / ${task.owner} / ${task.label}`,
        `  Action: ${task.action}`,
        `  Close: ${task.closeCondition}`,
        `  Evidence: ${task.evidence}`
      ].join("\n")
    ),
    "",
    "## Calendar",
    `Calendar window: ${calendarStartDate} to ${calendar.calendarEndDate}`,
    `Calendar export: ${receipt.payload.sourceReceiptId || "buyer-evidence"}-risk-owner-handoff.ics`,
    "",
    "## CSV",
    "```csv",
    csv,
    "```"
  ].join("\n");
  const mailBody = [
    `${receipt.payload.buyer} adoption risk owner handoff`,
    "",
    summary,
    "",
    exportMarkdown
  ].join("\n");

  return {
    status,
    headline,
    summary,
    readyCount,
    taskTotal: tasks.length,
    firstOwner: firstOpenTask.owner,
    firstAction: firstOpenTask.action,
    tasks,
    calendarStartDate,
    calendarEndDate: calendar.calendarEndDate,
    calendarText: calendar.calendarText,
    calendarHref: calendar.calendarHref,
    csv,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    mailHref: `mailto:?subject=${encodeURIComponent(`Buyer adoption risk owner handoff: ${receipt.payload.buyer}`)}&body=${encodeURIComponent(mailBody)}`
  };
}

export function buildQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt(input: {
  receipt: QuickBuyerEvidenceAdoptionRiskDispositionReceipt;
  handoff: QuickBuyerEvidenceAdoptionRiskDispositionOwnerHandoff;
  closedTaskIds?: string[];
  acceptedBy?: string;
  evidenceNote?: string;
  generatedAt?: string;
}): QuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt {
  const closedTaskIds = new Set(input.closedTaskIds ?? input.handoff.tasks.filter((task) => task.status === "ready").map((task) => task.id));
  const acceptedBy = receiptText(input.acceptedBy, input.handoff.firstOwner, 180);
  const evidenceNote = receiptText(input.evidenceNote, input.handoff.summary, 1800);
  const tasks = input.handoff.tasks.map((task): QuickBuyerEvidenceAdoptionRiskOwnerCloseoutTaskOutcome => {
    const closed = closedTaskIds.has(task.id);
    return {
      id: task.id,
      label: task.label,
      status: task.status,
      owner: task.owner,
      dueLabel: task.dueLabel,
      action: task.action,
      closeCondition: task.closeCondition,
      evidence: task.evidence,
      href: task.href,
      closed,
      outcomeNote: closed ? `Closed by ${acceptedBy}: ${task.closeCondition}` : `Still open for ${task.owner}: ${task.closeCondition}`
    };
  });
  const closedTaskCount = tasks.filter((task) => task.closed).length;
  const openTaskCount = tasks.length - closedTaskCount;
  const status: QuickBuyerRoomPreviewStatus = openTaskCount === 0 ? "ready" : closedTaskCount > 0 ? "watch" : "blocked";
  const decision: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutDecision = status === "ready" ? "accept-risk-closeout" : "hold-risk-closeout";
  const firstOpenTask = tasks.find((task) => !task.closed) ?? tasks[tasks.length - 1]!;
  const payload: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutPayload = {
    receiptVersion: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_RECEIPT_VERSION,
    status,
    decision,
    buyer: input.receipt.payload.buyer,
    workflow: input.receipt.payload.workflow,
    acceptedBy,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    evidenceNote,
    sourceReceiptId: input.receipt.payload.sourceReceiptId,
    sourceChecksum: input.receipt.payload.sourceChecksum,
    sourceDispositionChecksum: `fnv1a32:${input.receipt.checksum}`,
    sourceLedgerHash: input.receipt.payload.sourceLedgerHash,
    sourceHandoffStatus: input.handoff.status,
    closedTaskCount,
    taskCount: tasks.length,
    openTaskCount,
    nextOwner: status === "ready" ? input.receipt.payload.nextOwner : firstOpenTask.owner,
    nextAction:
      status === "ready"
        ? "Attach this risk owner closeout receipt, rerun the adoption risk ledger, and reopen buyer-send approval."
        : `Keep buyer send held until ${firstOpenTask.owner} closes ${firstOpenTask.label}.`,
    tasks
  };
  const checksum = quickBuyerEvidenceAdoptionRiskOwnerCloseoutChecksum(payload);
  const requestJson = quickBuyerEvidenceAdoptionRiskOwnerCloseoutRequestJson({ checksum, payload });
  const exportMarkdown = [
    "# Buyer adoption risk owner closeout receipt",
    "",
    `Buyer: ${payload.buyer}`,
    `Decision: ${payload.decision}`,
    `Status: ${payload.status}`,
    `Accepted by: ${payload.acceptedBy}`,
    `Checksum: fnv1a32:${checksum}`,
    `Source disposition: ${payload.sourceDispositionChecksum}`,
    `Source ledger: ${payload.sourceLedgerHash}`,
    `Closed tasks: ${payload.closedTaskCount}/${payload.taskCount}`,
    "",
    "## Evidence note",
    payload.evidenceNote,
    "",
    "## Next action",
    `${payload.nextOwner}: ${payload.nextAction}`,
    "",
    "## Task outcomes",
    ...payload.tasks.map((task) => `- [${task.closed ? "closed" : "open"}] ${task.dueLabel} / ${task.owner} / ${task.label}: ${task.outcomeNote}`)
  ].join("\n");

  return {
    payload,
    checksum,
    requestJson,
    requestHref: `data:application/json;charset=utf-8,${encodeURIComponent(requestJson)}`,
    verifierHref: receiptVerifierPrefillHref(requestJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    verification: verifyQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt({ checksum, payload })
  };
}

function adoptionRiskRecheckStartDate(closeout: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt) {
  const generatedDate = closeout.payload.generatedAt.slice(0, 10);
  const parsed = parseIsoDateOnly(generatedDate);
  return (parsed ? addUtcDays(parsed, 1) : parseIsoDateOnly("2026-07-09")!).toISOString().slice(0, 10);
}

function adoptionRiskRecheckSteps(closeout: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt): QuickBuyerEvidenceAdoptionRiskRecheckStep[] {
  if (closeout.payload.status !== "ready") {
    return [
      {
        id: "close-risk-owner-work",
        label: "Close risk owner work",
        status: closeout.payload.status,
        owner: closeout.payload.nextOwner,
        dayOffset: 0,
        action: closeout.payload.nextAction,
        closeCondition: "All open risk owner tasks are closed and the risk owner closeout receipt verifies.",
        evidence: closeout.payload.evidenceNote,
        href: closeout.verifierHref
      },
      {
        id: "re-export-risk-closeout",
        label: "Re-export risk closeout",
        status: "watch",
        owner: closeout.payload.acceptedBy,
        dayOffset: 1,
        action: "Regenerate the risk owner closeout receipt after open owner evidence closes.",
        closeCondition: "Receipt desk verifies the new risk owner closeout checksum.",
        evidence: closeout.payload.sourceDispositionChecksum,
        href: closeout.verifierHref
      }
    ];
  }

  return [
    {
      id: "rerun-adoption-risk-ledger",
      label: "Rerun adoption risk ledger",
      status: "ready",
      owner: closeout.payload.nextOwner,
      dayOffset: 0,
      action: "Attach the verified risk closeout receipt and rerun the adoption risk ledger before buyer send.",
      closeCondition: "Rechecked ledger is ready or names the next held risk before any external send.",
      evidence: `fnv1a32:${closeout.checksum}`,
      href: closeout.verifierHref
    },
    {
      id: "reopen-buyer-send-approval",
      label: "Reopen buyer-send approval",
      status: "ready",
      owner: "Launch owner",
      dayOffset: 1,
      action: "Attach the source disposition and risk closeout receipts to the buyer-send approval thread.",
      closeCondition: "Approval thread includes source ledger hash, closeout checksum, next owner, and stop rule.",
      evidence: closeout.payload.sourceLedgerHash,
      href: closeout.verifierHref
    },
    {
      id: "rerun-live-proof-sweep",
      label: "Rerun live proof sweep",
      status: "watch",
      owner: "Proof owner",
      dayOffset: 2,
      action: "Run the live proof audit one more time before sharing externally.",
      closeCondition: "Public proof links respond from the shared buyer room or buyer send stays held.",
      evidence: `${closeout.payload.closedTaskCount}/${closeout.payload.taskCount} risk owner tasks closed.`,
      href: closeout.verifierHref
    },
    {
      id: "record-send-decision",
      label: "Record send decision",
      status: "watch",
      owner: "Decision owner",
      dayOffset: 3,
      action: "Record continue, revise, or stop after the adoption risk recheck.",
      closeCondition: "Buyer decision receipt cites the risk closeout checksum and the current owner.",
      evidence: closeout.payload.nextAction,
      href: closeout.verifierHref
    }
  ];
}

function adoptionRiskRecheckCalendar(input: {
  closeout: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt;
  steps: QuickBuyerEvidenceAdoptionRiskRecheckStep[];
  startDate: string;
}) {
  const start = parseIsoDateOnly(input.startDate);
  if (!start) return { calendarText: "", calendarHref: "" };
  const calendarLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//Buyer Adoption Risk Recheck//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...input.steps.flatMap((step) => {
      const eventStart = addUtcDays(start, step.dayOffset);
      const eventEnd = addUtcDays(eventStart, 1);
      return [
        "BEGIN:VEVENT",
        `UID:${step.id}-${compactIcsDate(eventStart)}-${input.closeout.checksum}@a2a-agent-marketplace`,
        `DTSTAMP:${compactIcsDate(start)}T000000Z`,
        `DTSTART;VALUE=DATE:${compactIcsDate(eventStart)}`,
        `DTEND;VALUE=DATE:${compactIcsDate(eventEnd)}`,
        `SUMMARY:${escapeIcsText(`Day ${step.dayOffset} ${step.label} - ${step.owner}`)}`,
        `DESCRIPTION:${escapeIcsText(`Status: ${step.status}\nAction: ${step.action}\nClose: ${step.closeCondition}\nEvidence: ${step.evidence}\nRisk closeout: fnv1a32:${input.closeout.checksum}`)}`,
        `X-A2A-HREF:${escapeIcsText(step.href)}`,
        "END:VEVENT"
      ];
    }),
    "END:VCALENDAR"
  ];
  const calendarText = calendarLines.map(foldIcsLine).join("\r\n");
  return {
    calendarText,
    calendarHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(calendarText)}`
  };
}

export function buildQuickBuyerEvidenceAdoptionRiskRecheckPacket(
  closeout: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt
): QuickBuyerEvidenceAdoptionRiskRecheckPacket {
  const steps = adoptionRiskRecheckSteps(closeout);
  const readyCount = steps.filter((step) => step.status === "ready").length;
  const status: QuickBuyerRoomPreviewStatus =
    closeout.payload.status === "ready" && steps.every((step) => step.status === "ready") ? "ready" : steps.some((step) => step.status === "blocked") ? "blocked" : "watch";
  const currentStep = steps.find((step) => step.status !== "ready") ?? steps[0];
  const startDate = adoptionRiskRecheckStartDate(closeout);
  const endDate = addUtcDays(parseIsoDateOnly(startDate)!, Math.max(...steps.map((step) => step.dayOffset))).toISOString().slice(0, 10);
  const headline =
    closeout.payload.status === "ready"
      ? "Risk recheck is ready to schedule from the verified closeout"
      : "Risk recheck packet stays held until owner work closes";
  const summary =
    closeout.payload.status === "ready"
      ? `${readyCount}/${steps.length} recheck steps are staged from ${startDate} to ${endDate}.`
      : `${readyCount}/${steps.length} recheck steps are staged. ${currentStep.owner} owns: ${currentStep.action}`;
  const calendar = adoptionRiskRecheckCalendar({ closeout, steps, startDate });
  const exportMarkdown = [
    "# Buyer adoption risk recheck packet",
    "",
    `Buyer: ${closeout.payload.buyer}`,
    `Workflow: ${closeout.payload.workflow}`,
    `Status: ${status}`,
    `Start date: ${startDate}`,
    `End date: ${endDate}`,
    `Risk closeout: fnv1a32:${closeout.checksum}`,
    `Source ledger: ${closeout.payload.sourceLedgerHash}`,
    "",
    "## Summary",
    summary,
    "",
    "## Steps",
    ...steps.map((step) => `- [${step.status}] Day ${step.dayOffset} / ${step.owner} / ${step.label}: ${step.action} Close: ${step.closeCondition} Evidence: ${step.evidence}`),
    "",
    "## Calendar",
    `Calendar export: ${closeout.payload.sourceReceiptId || "buyer-evidence"}-risk-recheck.ics`
  ].join("\n");
  const mailBody = [
    `${closeout.payload.buyer} adoption risk recheck`,
    "",
    summary,
    "",
    exportMarkdown
  ].join("\n");

  return {
    status,
    headline,
    summary,
    startDate,
    endDate,
    readyCount,
    stepTotal: steps.length,
    currentOwner: currentStep.owner,
    currentAction: currentStep.action,
    steps,
    calendarText: calendar.calendarText,
    calendarHref: calendar.calendarHref,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    mailHref: `mailto:?subject=${encodeURIComponent(`Buyer adoption risk recheck: ${closeout.payload.buyer}`)}&body=${encodeURIComponent(mailBody)}`
  };
}

function sendControlCriterionPreviewStatus(status: QuickBuyerEvidenceAdoptionRiskSendControlCriterionStatus): QuickBuyerRoomPreviewStatus {
  if (status === "pass") return "ready";
  if (status === "block") return "blocked";
  return "watch";
}

function adoptionRiskSendControlCriteria(input: {
  closeout: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt;
  recheck: QuickBuyerEvidenceAdoptionRiskRecheckPacket;
}): QuickBuyerEvidenceAdoptionRiskSendControlCriterion[] {
  const closeoutReady = input.closeout.payload.status === "ready" && input.closeout.verification.status === "verified" && input.closeout.payload.openTaskCount === 0;
  const recheckRunbookStaged = closeoutReady && input.recheck.stepTotal >= 4 && input.recheck.readyCount >= 2;
  const liveProofSweep = input.recheck.steps.find((step) => step.id === "rerun-live-proof-sweep");
  const sendDecision = input.recheck.steps.find((step) => step.id === "record-send-decision");
  return [
    {
      id: "risk-owner-closeout",
      label: "Risk owner closeout verifies",
      status: closeoutReady ? "pass" : "block",
      owner: input.closeout.payload.nextOwner,
      evidence: `${input.closeout.payload.closedTaskCount}/${input.closeout.payload.taskCount} owner tasks closed with fnv1a32:${input.closeout.checksum}.`,
      action: closeoutReady ? "Keep the verified risk owner closeout attached to the buyer-send thread." : input.closeout.payload.nextAction,
      closeCondition: "Risk owner closeout receipt verifies and all owner tasks are closed.",
      href: input.closeout.verifierHref
    },
    {
      id: "risk-recheck-runbook",
      label: "Risk recheck runbook is staged",
      status: recheckRunbookStaged ? "pass" : closeoutReady ? "watch" : "block",
      owner: input.recheck.currentOwner,
      evidence: `${input.recheck.readyCount}/${input.recheck.stepTotal} recheck steps staged for ${input.recheck.startDate} to ${input.recheck.endDate}.`,
      action: closeoutReady ? "Run the adoption risk recheck steps before external buyer send." : "Close owner work before scheduling the recheck runbook.",
      closeCondition: "Recheck packet includes ledger rerun, buyer-send approval, live proof sweep, and send decision steps.",
      href: input.closeout.verifierHref
    },
    {
      id: "live-proof-sweep",
      label: "Live proof sweep is current",
      status: liveProofSweep?.status === "ready" ? "pass" : closeoutReady ? "watch" : "block",
      owner: liveProofSweep?.owner ?? "Proof owner",
      evidence: liveProofSweep?.evidence ?? input.closeout.payload.evidenceNote,
      action: liveProofSweep?.action ?? "Run live proof verification after the risk closeout is ready.",
      closeCondition: liveProofSweep?.closeCondition ?? "Public proof links respond from the shared buyer room.",
      href: liveProofSweep?.href ?? input.closeout.verifierHref
    },
    {
      id: "send-decision-record",
      label: "Send decision is recorded",
      status: sendDecision?.status === "ready" ? "pass" : closeoutReady ? "watch" : "block",
      owner: sendDecision?.owner ?? "Decision owner",
      evidence: sendDecision?.evidence ?? input.closeout.payload.nextAction,
      action: sendDecision?.action ?? "Record continue, revise, or stop before buyer send.",
      closeCondition: sendDecision?.closeCondition ?? "Buyer decision receipt cites the risk closeout checksum and current owner.",
      href: sendDecision?.href ?? input.closeout.verifierHref
    }
  ];
}

export function buildQuickBuyerEvidenceAdoptionRiskSendControlReceipt(input: {
  closeout: QuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt;
  recheck: QuickBuyerEvidenceAdoptionRiskRecheckPacket;
  generatedAt?: string;
}): QuickBuyerEvidenceAdoptionRiskSendControlReceipt {
  const criteria = adoptionRiskSendControlCriteria(input);
  const previewStatuses = criteria.map((criterion) => sendControlCriterionPreviewStatus(criterion.status));
  const status: QuickBuyerRoomPreviewStatus = previewStatuses.some((item) => item === "blocked") ? "blocked" : previewStatuses.some((item) => item === "watch") ? "watch" : "ready";
  const decision: QuickBuyerEvidenceAdoptionRiskSendControlDecision =
    status === "ready" ? "reopen-buyer-send" : status === "watch" ? "run-risk-recheck" : "hold-buyer-send";
  const currentCriterion = criteria.find((criterion) => criterion.status !== "pass") ?? criteria[0];
  const stopRule = "Do not send externally unless every risk control criterion passes and this receipt verifies in the receipt desk.";
  const payload: QuickBuyerEvidenceAdoptionRiskSendControlPayload = {
    receiptVersion: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_RECEIPT_VERSION,
    status,
    decision,
    buyer: input.closeout.payload.buyer,
    workflow: input.closeout.payload.workflow,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    sourceReceiptId: input.closeout.payload.sourceReceiptId,
    sourceChecksum: input.closeout.payload.sourceChecksum,
    sourceDispositionChecksum: input.closeout.payload.sourceDispositionChecksum,
    sourceRiskCloseoutChecksum: `fnv1a32:${input.closeout.checksum}`,
    sourceLedgerHash: input.closeout.payload.sourceLedgerHash,
    recheckStartDate: input.recheck.startDate,
    recheckEndDate: input.recheck.endDate,
    recheckReadyCount: input.recheck.readyCount,
    recheckStepTotal: input.recheck.stepTotal,
    nextOwner: status === "ready" ? "Launch owner" : currentCriterion.owner,
    nextAction: status === "ready" ? "Reopen buyer send with the verified risk control receipt attached." : currentCriterion.action,
    stopRule,
    criteria
  };
  const checksum = quickBuyerEvidenceAdoptionRiskSendControlChecksum(payload);
  const requestJson = quickBuyerEvidenceAdoptionRiskSendControlRequestJson({ checksum, payload });
  const exportMarkdown = [
    "# Buyer-send risk control receipt",
    "",
    `Buyer: ${payload.buyer}`,
    `Workflow: ${payload.workflow}`,
    `Decision: ${payload.decision}`,
    `Status: ${payload.status}`,
    `Checksum: fnv1a32:${checksum}`,
    `Risk closeout: ${payload.sourceRiskCloseoutChecksum}`,
    `Source ledger: ${payload.sourceLedgerHash}`,
    `Recheck window: ${payload.recheckStartDate} to ${payload.recheckEndDate}`,
    `Stop rule: ${payload.stopRule}`,
    "",
    "## Next action",
    `${payload.nextOwner}: ${payload.nextAction}`,
    "",
    "## Control criteria",
    ...payload.criteria.map((criterion) =>
      [
        `- [${criterion.status}] ${criterion.label} / ${criterion.owner}`,
        `  Action: ${criterion.action}`,
        `  Close: ${criterion.closeCondition}`,
        `  Evidence: ${criterion.evidence}`
      ].join("\n")
    )
  ].join("\n");

  return {
    payload,
    checksum,
    requestJson,
    requestHref: `data:application/json;charset=utf-8,${encodeURIComponent(requestJson)}`,
    verifierHref: receiptVerifierPrefillHref(requestJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    verification: verifyQuickBuyerEvidenceAdoptionRiskSendControlReceipt({ checksum, payload })
  };
}
