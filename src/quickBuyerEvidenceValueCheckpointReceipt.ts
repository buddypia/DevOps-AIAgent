import type {
  QuickBuyerEvidencePackSharePayload,
  QuickBuyerEvidenceValueCheckpoint,
  QuickBuyerEvidenceValueCheckpointItem,
  QuickBuyerRoomPreviewStatus
} from "./quickBuyerEvidenceShare.js";

export const QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_RECEIPT_VERSION = "quick-buyer-evidence-value-checkpoint.v1";
export const QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_VERIFY_PATH = "/api/quick-buyer-evidence-value-checkpoint/verify";
export const QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_RECEIPT_VERSION = "quick-buyer-evidence-value-owner-closeout.v1";
export const QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_VERIFY_PATH = "/api/quick-buyer-evidence-value-owner-closeout/verify";

export type QuickBuyerEvidenceValueCheckpointDecision = "expand" | "repair" | "hold";
export type QuickBuyerEvidenceValueOwnerCloseoutDecision = "accept-owner-closeout" | "hold-owner-closeout";

export type QuickBuyerEvidenceValueCheckpointReceiptItem = Pick<
  QuickBuyerEvidenceValueCheckpointItem,
  "id" | "label" | "status" | "owner" | "metric" | "target" | "evidence" | "action" | "href"
>;

export type QuickBuyerEvidenceValueCheckpointReceiptPayload = {
  receiptVersion: typeof QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_RECEIPT_VERSION;
  status: QuickBuyerRoomPreviewStatus;
  decision: QuickBuyerEvidenceValueCheckpointDecision;
  buyer: string;
  workflow: string;
  reviewerName: string;
  generatedAt: string;
  checkpointStatus: QuickBuyerRoomPreviewStatus;
  readyCount: number;
  totalCount: number;
  currentOwner: string;
  currentAction: string;
  actualValueSignal: string;
  nextOwner: string;
  nextAction: string;
  sourceReceiptId: string;
  sourceChecksum: string;
  proof: string;
  items: QuickBuyerEvidenceValueCheckpointReceiptItem[];
};

export type QuickBuyerEvidenceValueCheckpointVerificationRequest = {
  checksum: string;
  payload: QuickBuyerEvidenceValueCheckpointReceiptPayload;
};

export type QuickBuyerEvidenceValueCheckpointVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickBuyerEvidenceValueCheckpointReceipt = {
  payload: QuickBuyerEvidenceValueCheckpointReceiptPayload;
  checksum: string;
  requestJson: string;
  requestHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
  verification: QuickBuyerEvidenceValueCheckpointVerification;
};

export type QuickBuyerEvidenceValueCheckpointOwnerTask = {
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

export type QuickBuyerEvidenceValueCheckpointOwnerHandoff = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  taskTotal: number;
  firstOwner: string;
  firstAction: string;
  tasks: QuickBuyerEvidenceValueCheckpointOwnerTask[];
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

export type QuickBuyerEvidenceValueOwnerCloseoutTaskOutcome = Pick<
  QuickBuyerEvidenceValueCheckpointOwnerTask,
  "id" | "label" | "status" | "owner" | "dueLabel" | "action" | "closeCondition" | "evidence" | "href"
> & {
  closed: boolean;
  outcomeNote: string;
};

export type QuickBuyerEvidenceValueOwnerCloseoutPayload = {
  receiptVersion: typeof QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_RECEIPT_VERSION;
  status: QuickBuyerRoomPreviewStatus;
  decision: QuickBuyerEvidenceValueOwnerCloseoutDecision;
  buyer: string;
  workflow: string;
  acceptedBy: string;
  generatedAt: string;
  evidenceNote: string;
  sourceReceiptId: string;
  sourceChecksum: string;
  sourceCheckpointChecksum: string;
  sourceHandoffStatus: QuickBuyerRoomPreviewStatus;
  closedTaskCount: number;
  taskCount: number;
  openTaskCount: number;
  nextOwner: string;
  nextAction: string;
  tasks: QuickBuyerEvidenceValueOwnerCloseoutTaskOutcome[];
};

export type QuickBuyerEvidenceValueOwnerCloseoutVerificationRequest = {
  checksum: string;
  payload: QuickBuyerEvidenceValueOwnerCloseoutPayload;
};

export type QuickBuyerEvidenceValueOwnerCloseoutVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickBuyerEvidenceValueOwnerCloseoutReceipt = {
  payload: QuickBuyerEvidenceValueOwnerCloseoutPayload;
  checksum: string;
  requestJson: string;
  requestHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
  verification: QuickBuyerEvidenceValueOwnerCloseoutVerification;
};

export type QuickBuyerEvidenceValueNextWindowStep = {
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

export type QuickBuyerEvidenceValueNextWindowPacket = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  startDate: string;
  endDate: string;
  readyCount: number;
  stepTotal: number;
  currentOwner: string;
  currentAction: string;
  steps: QuickBuyerEvidenceValueNextWindowStep[];
  calendarText: string;
  calendarHref: string;
  exportMarkdown: string;
  exportHref: string;
  mailHref: string;
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

function checkpointReceiptText(value: unknown, fallback: string, maxLength = 1200) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function checkpointReceiptStatus(decision: QuickBuyerEvidenceValueCheckpointDecision, checkpoint: QuickBuyerEvidenceValueCheckpoint): QuickBuyerRoomPreviewStatus {
  if (decision === "hold") return "blocked";
  if (decision === "repair") return "watch";
  return checkpoint.status === "ready" ? "ready" : "watch";
}

function checkpointReceiptNextAction(decision: QuickBuyerEvidenceValueCheckpointDecision, checkpoint: QuickBuyerEvidenceValueCheckpoint) {
  if (decision === "expand" && checkpoint.status === "ready") {
    return "Expand to the next buyer operating window with the value checkpoint receipt attached.";
  }
  if (decision === "expand") {
    return "Keep expansion provisional until open value checkpoint items are repaired.";
  }
  if (decision === "repair") return checkpoint.currentItem.action;
  return "Hold expansion and re-export the value checkpoint after the buyer owner closes the open evidence.";
}

function checkpointReceiptNextOwner(decision: QuickBuyerEvidenceValueCheckpointDecision, checkpoint: QuickBuyerEvidenceValueCheckpoint) {
  if (decision === "hold") return "Decision owner";
  if (decision === "expand" && checkpoint.status === "ready") return "Launch owner";
  return checkpoint.currentItem.owner;
}

function checkpointOwnerHandoffCsv(tasks: QuickBuyerEvidenceValueCheckpointOwnerTask[]) {
  return [
    ["taskId", "label", "status", "owner", "due", "action", "closeCondition", "evidence", "href"],
    ...tasks.map((task) => [task.id, task.label, task.status, task.owner, task.dueLabel, task.action, task.closeCondition, task.evidence, task.href])
  ]
    .map((row) => row.map((value) => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }).join(","))
    .join("\n");
}

function checkpointOwnerTaskDueLabel(index: number) {
  if (index === 0) return "Today";
  if (index === 1) return "+1 business day";
  return `+${index} business days`;
}

function checkpointOwnerHandoffStartDate(receipt: QuickBuyerEvidenceValueCheckpointReceipt) {
  const generatedDate = receipt.payload.generatedAt.slice(0, 10);
  return parseIsoDateOnly(generatedDate) ? generatedDate : "2026-07-08";
}

function checkpointOwnerTaskStartDate(start: Date, dueLabel: string, index: number) {
  if (dueLabel === "Today") return start;
  const businessDayMatch = /^\+(\d+) business days?$/.exec(dueLabel);
  if (businessDayMatch) return addUtcBusinessDays(start, Number(businessDayMatch[1]));
  const calendarDayMatch = /^\+(\d+) days?$/.exec(dueLabel);
  if (calendarDayMatch) return addUtcDays(start, Number(calendarDayMatch[1]));
  return addUtcBusinessDays(start, index);
}

function checkpointOwnerHandoffTasks(receipt: QuickBuyerEvidenceValueCheckpointReceipt): QuickBuyerEvidenceValueCheckpointOwnerTask[] {
  const receiptTask: QuickBuyerEvidenceValueCheckpointOwnerTask = {
    id: "attach-checkpoint-receipt",
    label: "Attach checkpoint receipt",
    status: "ready",
    owner: receipt.payload.reviewerName,
    dueLabel: "Today",
    action: "Attach the verified value checkpoint receipt before assigning owner work.",
    closeCondition: `Owner can verify fnv1a32:${receipt.checksum} in the receipt desk.`,
    evidence: receipt.payload.proof,
    href: receipt.verifierHref
  };
  const openItems = receipt.payload.items.filter((item) => item.status !== "ready");
  if (receipt.payload.decision === "expand" && openItems.length === 0) {
    return [
      receiptTask,
      {
        id: "schedule-next-value-window",
        label: "Schedule next value window",
        status: "ready",
        owner: receipt.payload.nextOwner,
        dueLabel: "+7 days",
        action: receipt.payload.nextAction,
        closeCondition: "Next operating window has a date, owner, and receipt link in the buyer thread.",
        evidence: receipt.payload.actualValueSignal,
        href: receipt.verifierHref
      }
    ];
  }
  const repairItems = openItems.length > 0 ? openItems : receipt.payload.items;
  return [
    receiptTask,
    ...repairItems.map((item, index) => ({
      id: `close-${item.id}`,
      label: `Close ${item.label}`,
      status: receipt.payload.decision === "hold" && item.status === "ready" ? "watch" : item.status,
      owner: item.owner,
      dueLabel: checkpointOwnerTaskDueLabel(index + 1),
      action: receipt.payload.decision === "hold" ? `Hold expansion until ${item.metric.toLowerCase()} is re-exported with proof.` : item.action,
      closeCondition: `${item.owner} attaches evidence that meets target: ${item.target}`,
      evidence: item.evidence,
      href: item.href || receipt.verifierHref
    }))
  ];
}

function checkpointOwnerHandoffCalendar(input: {
  receipt: QuickBuyerEvidenceValueCheckpointReceipt;
  tasks: QuickBuyerEvidenceValueCheckpointOwnerTask[];
  startDate: string;
}) {
  const start = parseIsoDateOnly(input.startDate);
  if (!start) return { calendarEndDate: input.startDate, calendarText: "", calendarHref: "" };
  const events = input.tasks.map((task, index) => {
    const eventStart = checkpointOwnerTaskStartDate(start, task.dueLabel, index);
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
      ...input.tasks.map((task) => `${task.id}:${task.status}:${task.owner}:${task.dueLabel}:${task.action}:${task.closeCondition}:${task.href}`)
    ].join("\n")
  );
  const calendarLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//Buyer Value Checkpoint Owner Handoff//EN",
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

export function quickBuyerEvidenceValueCheckpointPayloadJson(payload: QuickBuyerEvidenceValueCheckpointReceiptPayload) {
  return canonicalJson(payload);
}

export function quickBuyerEvidenceValueCheckpointChecksum(payload: QuickBuyerEvidenceValueCheckpointReceiptPayload) {
  return stablePacketHash(quickBuyerEvidenceValueCheckpointPayloadJson(payload));
}

export function quickBuyerEvidenceValueCheckpointRequestJson(input: QuickBuyerEvidenceValueCheckpointVerificationRequest) {
  return canonicalJson(input);
}

export function verifyQuickBuyerEvidenceValueCheckpointReceipt(
  input: QuickBuyerEvidenceValueCheckpointVerificationRequest
): QuickBuyerEvidenceValueCheckpointVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickBuyerEvidenceValueCheckpointChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Buyer value checkpoint checksum matches the source evidence pack, checkpoint items, Day 7 decision, owner action, and actual value signal."
      : "Buyer value checkpoint checksum does not match the exported payload. Do not accept this value checkpoint until it is re-exported."
  };
}

export function quickBuyerEvidenceValueOwnerCloseoutPayloadJson(payload: QuickBuyerEvidenceValueOwnerCloseoutPayload) {
  return canonicalJson(payload);
}

export function quickBuyerEvidenceValueOwnerCloseoutChecksum(payload: QuickBuyerEvidenceValueOwnerCloseoutPayload) {
  return stablePacketHash(quickBuyerEvidenceValueOwnerCloseoutPayloadJson(payload));
}

export function quickBuyerEvidenceValueOwnerCloseoutRequestJson(input: QuickBuyerEvidenceValueOwnerCloseoutVerificationRequest) {
  return canonicalJson(input);
}

export function verifyQuickBuyerEvidenceValueOwnerCloseoutReceipt(
  input: QuickBuyerEvidenceValueOwnerCloseoutVerificationRequest
): QuickBuyerEvidenceValueOwnerCloseoutVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickBuyerEvidenceValueOwnerCloseoutChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Buyer value owner closeout checksum matches the checkpoint receipt, handoff status, task outcomes, evidence note, and next owner action."
      : "Buyer value owner closeout checksum does not match the exported owner evidence. Do not accept this closeout until it is re-exported."
  };
}

export function buildQuickBuyerEvidenceValueCheckpointReceipt(input: {
  payload: QuickBuyerEvidencePackSharePayload;
  checkpoint: QuickBuyerEvidenceValueCheckpoint;
  decision: QuickBuyerEvidenceValueCheckpointDecision;
  reviewerName?: string;
  actualValueSignal?: string;
  generatedAt?: string;
}): QuickBuyerEvidenceValueCheckpointReceipt {
  const status = checkpointReceiptStatus(input.decision, input.checkpoint);
  const reviewerName = checkpointReceiptText(input.reviewerName, "Buyer value reviewer", 180);
  const actualValueSignal = checkpointReceiptText(
    input.actualValueSignal,
    input.checkpoint.currentItem.evidence || input.checkpoint.summary || "No value signal was recorded.",
    1800
  );
  const nextOwner = checkpointReceiptNextOwner(input.decision, input.checkpoint);
  const nextAction = checkpointReceiptNextAction(input.decision, input.checkpoint);
  const payload: QuickBuyerEvidenceValueCheckpointReceiptPayload = {
    receiptVersion: QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_RECEIPT_VERSION,
    status,
    decision: input.decision,
    buyer: input.payload.buyer || "Buyer",
    workflow: input.payload.workflow || "Workflow not included",
    reviewerName,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    checkpointStatus: input.checkpoint.status,
    readyCount: input.checkpoint.readyCount,
    totalCount: input.checkpoint.totalCount,
    currentOwner: input.checkpoint.currentItem.owner,
    currentAction: input.checkpoint.currentItem.action,
    actualValueSignal,
    nextOwner,
    nextAction,
    sourceReceiptId: input.payload.sourceReceiptId || "buyer-evidence-pack",
    sourceChecksum: input.payload.sourceChecksum || "checksum missing",
    proof: `${input.payload.sourceReceiptId || "buyer-evidence-pack"} / ${input.payload.sourceChecksum || "checksum missing"} / ${
      input.checkpoint.readyCount
    }/${input.checkpoint.totalCount} value checks ready / ${actualValueSignal}`,
    items: input.checkpoint.items.map((item) => ({
      id: item.id,
      label: item.label,
      status: item.status,
      owner: item.owner,
      metric: item.metric,
      target: item.target,
      evidence: item.evidence,
      action: item.action,
      href: item.href
    }))
  };
  const checksum = quickBuyerEvidenceValueCheckpointChecksum(payload);
  const requestJson = quickBuyerEvidenceValueCheckpointRequestJson({ checksum, payload });
  const exportMarkdown = [
    "# Buyer value checkpoint receipt",
    "",
    `Buyer: ${payload.buyer}`,
    `Decision: ${payload.decision}`,
    `Status: ${payload.status}`,
    `Reviewer: ${payload.reviewerName}`,
    `Checksum: fnv1a32:${checksum}`,
    `Source: ${payload.sourceReceiptId} / ${payload.sourceChecksum}`,
    "",
    "## Actual value signal",
    payload.actualValueSignal,
    "",
    "## Next action",
    `${payload.nextOwner}: ${payload.nextAction}`,
    "",
    "## Checkpoint items",
    ...payload.items.map((item) => `- [${item.status}] ${item.label} / ${item.owner}: ${item.metric}. Target: ${item.target} Action: ${item.action}`)
  ].join("\n");

  return {
    payload,
    checksum,
    requestJson,
    requestHref: `data:application/json;charset=utf-8,${encodeURIComponent(requestJson)}`,
    verifierHref: receiptVerifierPrefillHref(requestJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    verification: verifyQuickBuyerEvidenceValueCheckpointReceipt({ checksum, payload })
  };
}

export function buildQuickBuyerEvidenceValueOwnerCloseoutReceipt(input: {
  receipt: QuickBuyerEvidenceValueCheckpointReceipt;
  handoff: QuickBuyerEvidenceValueCheckpointOwnerHandoff;
  closedTaskIds?: string[];
  acceptedBy?: string;
  evidenceNote?: string;
  generatedAt?: string;
}): QuickBuyerEvidenceValueOwnerCloseoutReceipt {
  const closedTaskIds = new Set(input.closedTaskIds ?? input.handoff.tasks.filter((task) => task.status === "ready").map((task) => task.id));
  const acceptedBy = checkpointReceiptText(input.acceptedBy, input.handoff.firstOwner, 180);
  const evidenceNote = checkpointReceiptText(input.evidenceNote, input.handoff.summary, 1800);
  const tasks = input.handoff.tasks.map((task): QuickBuyerEvidenceValueOwnerCloseoutTaskOutcome => {
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
  const decision: QuickBuyerEvidenceValueOwnerCloseoutDecision = status === "ready" ? "accept-owner-closeout" : "hold-owner-closeout";
  const firstOpenTask = tasks.find((task) => !task.closed) ?? tasks[tasks.length - 1]!;
  const payload: QuickBuyerEvidenceValueOwnerCloseoutPayload = {
    receiptVersion: QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_RECEIPT_VERSION,
    status,
    decision,
    buyer: input.receipt.payload.buyer,
    workflow: input.receipt.payload.workflow,
    acceptedBy,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    evidenceNote,
    sourceReceiptId: input.receipt.payload.sourceReceiptId,
    sourceChecksum: input.receipt.payload.sourceChecksum,
    sourceCheckpointChecksum: `fnv1a32:${input.receipt.checksum}`,
    sourceHandoffStatus: input.handoff.status,
    closedTaskCount,
    taskCount: tasks.length,
    openTaskCount,
    nextOwner: status === "ready" ? input.receipt.payload.nextOwner : firstOpenTask.owner,
    nextAction:
      status === "ready"
        ? "Attach this owner closeout receipt and run the next value checkpoint window."
        : `Keep value expansion held until ${firstOpenTask.owner} closes ${firstOpenTask.label}.`,
    tasks
  };
  const checksum = quickBuyerEvidenceValueOwnerCloseoutChecksum(payload);
  const requestJson = quickBuyerEvidenceValueOwnerCloseoutRequestJson({ checksum, payload });
  const exportMarkdown = [
    "# Buyer value owner closeout receipt",
    "",
    `Buyer: ${payload.buyer}`,
    `Decision: ${payload.decision}`,
    `Status: ${payload.status}`,
    `Accepted by: ${payload.acceptedBy}`,
    `Checksum: fnv1a32:${checksum}`,
    `Source checkpoint: ${payload.sourceCheckpointChecksum}`,
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
    verification: verifyQuickBuyerEvidenceValueOwnerCloseoutReceipt({ checksum, payload })
  };
}

function valueNextWindowStartDate(closeout: QuickBuyerEvidenceValueOwnerCloseoutReceipt) {
  const generatedDate = closeout.payload.generatedAt.slice(0, 10);
  const parsed = parseIsoDateOnly(generatedDate);
  return (parsed ? addUtcDays(parsed, 7) : parseIsoDateOnly("2026-07-16")!).toISOString().slice(0, 10);
}

function valueNextWindowSteps(closeout: QuickBuyerEvidenceValueOwnerCloseoutReceipt): QuickBuyerEvidenceValueNextWindowStep[] {
  if (closeout.payload.status !== "ready") {
    return [
      {
        id: "close-owner-work",
        label: "Close owner work",
        status: closeout.payload.status,
        owner: closeout.payload.nextOwner,
        dayOffset: 0,
        action: closeout.payload.nextAction,
        closeCondition: "All open owner tasks are closed and the owner closeout receipt verifies.",
        evidence: closeout.payload.evidenceNote,
        href: closeout.verifierHref
      },
      {
        id: "re-export-closeout",
        label: "Re-export closeout",
        status: "watch",
        owner: closeout.payload.acceptedBy,
        dayOffset: 1,
        action: "Regenerate the owner closeout receipt after the open task closes.",
        closeCondition: "Receipt desk verifies the new owner closeout checksum.",
        evidence: closeout.payload.sourceCheckpointChecksum,
        href: closeout.verifierHref
      }
    ];
  }
  return [
    {
      id: "open-next-value-thread",
      label: "Open next value thread",
      status: "ready",
      owner: closeout.payload.nextOwner,
      dayOffset: 0,
      action: "Attach the verified owner closeout receipt and open the next value checkpoint thread.",
      closeCondition: "Buyer thread includes the closeout checksum, owner, and next checkpoint date.",
      evidence: `fnv1a32:${closeout.checksum}`,
      href: closeout.verifierHref
    },
    {
      id: "refresh-value-baseline",
      label: "Refresh value baseline",
      status: "ready",
      owner: closeout.payload.acceptedBy,
      dayOffset: 1,
      action: "Confirm the measured value signal still matches the buyer operating window.",
      closeCondition: "Baseline evidence is cited before the next Day 7 checkpoint.",
      evidence: closeout.payload.evidenceNote,
      href: closeout.verifierHref
    },
    {
      id: "rerun-live-proof",
      label: "Rerun live proof",
      status: "watch",
      owner: "Proof owner",
      dayOffset: 3,
      action: "Run live proof verification again before the next value checkpoint is sent.",
      closeCondition: "Public proof blockers are either clear or named before the buyer sees the update.",
      evidence: `${closeout.payload.closedTaskCount}/${closeout.payload.taskCount} owner tasks closed.`,
      href: closeout.verifierHref
    },
    {
      id: "record-day7-decision",
      label: "Record Day 7 decision",
      status: "watch",
      owner: "Decision owner",
      dayOffset: 7,
      action: "Record expand, repair, or hold with the verified closeout receipt attached.",
      closeCondition: "Next value decision is recorded with owner, evidence, and receipt link.",
      evidence: closeout.payload.nextAction,
      href: closeout.verifierHref
    }
  ];
}

function valueNextWindowCalendar(input: {
  closeout: QuickBuyerEvidenceValueOwnerCloseoutReceipt;
  steps: QuickBuyerEvidenceValueNextWindowStep[];
  startDate: string;
}) {
  const start = parseIsoDateOnly(input.startDate);
  if (!start) return { calendarText: "", calendarHref: "" };
  const calendarLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//Buyer Value Next Window//EN",
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
        `DESCRIPTION:${escapeIcsText(`Status: ${step.status}\nAction: ${step.action}\nClose: ${step.closeCondition}\nEvidence: ${step.evidence}\nCloseout: fnv1a32:${input.closeout.checksum}`)}`,
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

export function buildQuickBuyerEvidenceValueNextWindowPacket(closeout: QuickBuyerEvidenceValueOwnerCloseoutReceipt): QuickBuyerEvidenceValueNextWindowPacket {
  const steps = valueNextWindowSteps(closeout);
  const readyCount = steps.filter((step) => step.status === "ready").length;
  const status: QuickBuyerRoomPreviewStatus =
    closeout.payload.status === "ready" && steps.every((step) => step.status === "ready") ? "ready" : steps.some((step) => step.status === "blocked") ? "blocked" : "watch";
  const currentStep = steps.find((step) => step.status !== "ready") ?? steps[0];
  const startDate = valueNextWindowStartDate(closeout);
  const endDate = addUtcDays(parseIsoDateOnly(startDate)!, Math.max(...steps.map((step) => step.dayOffset))).toISOString().slice(0, 10);
  const headline =
    closeout.payload.status === "ready"
      ? "Next value window is ready to schedule from the verified closeout"
      : "Next value window stays held until owner work closes";
  const summary =
    closeout.payload.status === "ready"
      ? `${readyCount}/${steps.length} next-window steps are staged from ${startDate} to ${endDate}.`
      : `${readyCount}/${steps.length} next-window steps are staged. ${currentStep.owner} owns: ${currentStep.action}`;
  const calendar = valueNextWindowCalendar({ closeout, steps, startDate });
  const exportMarkdown = [
    "# Buyer value next window packet",
    "",
    `Buyer: ${closeout.payload.buyer}`,
    `Workflow: ${closeout.payload.workflow}`,
    `Status: ${status}`,
    `Start date: ${startDate}`,
    `End date: ${endDate}`,
    `Owner closeout: fnv1a32:${closeout.checksum}`,
    "",
    "## Summary",
    summary,
    "",
    "## Steps",
    ...steps.map((step) => `- [${step.status}] Day ${step.dayOffset} / ${step.owner} / ${step.label}: ${step.action} Close: ${step.closeCondition} Evidence: ${step.evidence}`),
    "",
    "## Calendar",
    `Calendar export: ${closeout.payload.sourceReceiptId || "buyer-evidence"}-value-next-window.ics`
  ].join("\n");
  const mailBody = [
    `${closeout.payload.buyer} next value window`,
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
    mailHref: `mailto:?subject=${encodeURIComponent(`Next value window: ${closeout.payload.buyer}`)}&body=${encodeURIComponent(mailBody)}`
  };
}

export function buildQuickBuyerEvidenceValueCheckpointOwnerHandoff(
  receipt: QuickBuyerEvidenceValueCheckpointReceipt
): QuickBuyerEvidenceValueCheckpointOwnerHandoff {
  const tasks = checkpointOwnerHandoffTasks(receipt);
  const readyCount = tasks.filter((task) => task.status === "ready").length;
  const status: QuickBuyerRoomPreviewStatus = tasks.some((task) => task.status === "blocked") ? "blocked" : tasks.some((task) => task.status === "watch") ? "watch" : "ready";
  const firstOpenTask = tasks.find((task) => task.status !== "ready") ?? tasks[0];
  const calendarStartDate = checkpointOwnerHandoffStartDate(receipt);
  const calendar = checkpointOwnerHandoffCalendar({ receipt, tasks, startDate: calendarStartDate });
  const headline =
    receipt.payload.decision === "expand" && status === "ready"
      ? "Value checkpoint can move into the next operating window"
      : receipt.payload.decision === "hold"
        ? "Value checkpoint is held until owner proof is re-exported"
        : "Value checkpoint becomes an owner repair handoff";
  const summary =
    status === "ready"
      ? `${readyCount}/${tasks.length} owner tasks are ready with the value checkpoint receipt attached.`
      : `${readyCount}/${tasks.length} owner tasks are ready. ${firstOpenTask.owner} owns: ${firstOpenTask.action}`;
  const csv = checkpointOwnerHandoffCsv(tasks);
  const exportMarkdown = [
    "# Buyer value checkpoint owner handoff",
    "",
    `Buyer: ${receipt.payload.buyer}`,
    `Decision: ${receipt.payload.decision}`,
    `Status: ${status}`,
    `Receipt: fnv1a32:${receipt.checksum}`,
    `First owner: ${firstOpenTask.owner}`,
    "",
    "## Summary",
    summary,
    "",
    "## Owner tasks",
    ...tasks.map((task) => [
      `- [${task.status}] ${task.dueLabel} / ${task.owner} / ${task.label}`,
      `  Action: ${task.action}`,
      `  Close: ${task.closeCondition}`,
      `  Evidence: ${task.evidence}`
    ].join("\n")),
    "",
    "## Calendar",
    `Calendar window: ${calendarStartDate} to ${calendar.calendarEndDate}`,
    `Calendar export: ${receipt.payload.sourceReceiptId || "buyer-evidence"}-value-owner-handoff.ics`,
    "",
    "## CSV",
    "```csv",
    csv,
    "```"
  ].join("\n");
  const mailBody = [
    `${receipt.payload.buyer} value checkpoint owner handoff`,
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
    mailHref: `mailto:?subject=${encodeURIComponent(`Value checkpoint owner handoff: ${receipt.payload.buyer}`)}&body=${encodeURIComponent(mailBody)}`
  };
}
