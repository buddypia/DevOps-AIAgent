import type { QuickWorkflowCommercialResponseRecord } from "./quickWorkflowCommercialResponse";
import type { QuickWorkflowValueAcceptanceContract } from "./quickWorkflowValueAcceptanceContract";

type KickoffStatus = "ready" | "watch" | "blocked";

export type QuickWorkflowPilotKickoffTaskId =
  | "day-0-kickoff"
  | "day-3-proof-recheck"
  | "day-7-value-snapshot"
  | "day-14-pilot-review"
  | "day-30-value-acceptance";

export type QuickWorkflowPilotKickoffTask = {
  id: QuickWorkflowPilotKickoffTaskId;
  label: string;
  status: KickoffStatus;
  owner: string;
  dayLabel: string;
  dueDate: string;
  action: string;
  acceptance: string;
  evidence: string;
};

export type QuickWorkflowPilotKickoffPack = {
  status: KickoffStatus;
  headline: string;
  summary: string;
  buyer: string;
  workflow: string;
  kickoffStartDate: string;
  endDate: string;
  nextOwner: string;
  nextAction: string;
  sendNoteSubject: string;
  sendNoteBody: string;
  mailtoHref: string;
  tasks: QuickWorkflowPilotKickoffTask[];
  readyCount: number;
  blockedCount: number;
  taskCsvText: string;
  taskCsvHref: string;
  icsText: string;
  icsHref: string;
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    payloadJson: string;
    payloadHref: string;
  };
  exportMarkdown: string;
  exportHref: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatYen(value: number) {
  return `¥${Math.max(0, Math.round(value)).toLocaleString("ja-JP")}`;
}

function yyyymmdd(value: string) {
  return value.replaceAll("-", "");
}

function addDays(value: string, days: number) {
  if (!DATE_RE.test(value)) return "";
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "";
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function escapeIcs(value: string) {
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

function fnv1a32(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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

function statusFor(contract: QuickWorkflowValueAcceptanceContract, response: QuickWorkflowCommercialResponseRecord): KickoffStatus {
  if (contract.status === "blocked" || response.decision === "declined") return "blocked";
  if (contract.status === "ready" && response.decision === "approved") return "ready";
  return "watch";
}

function headlineFor(status: KickoffStatus) {
  if (status === "ready") return "Pilot kickoff pack is ready";
  if (status === "watch") return "Kickoff pack is drafted, approval still needs closure";
  return "Do not schedule kickoff yet";
}

function taskStatus(packStatus: KickoffStatus, id: QuickWorkflowPilotKickoffTaskId): KickoffStatus {
  if (packStatus === "ready") return "ready";
  if (packStatus === "watch" && id === "day-0-kickoff") return "watch";
  return "blocked";
}

function buildTasks(input: {
  contract: QuickWorkflowValueAcceptanceContract;
  response: QuickWorkflowCommercialResponseRecord;
  startDate: string;
  status: KickoffStatus;
}): QuickWorkflowPilotKickoffTask[] {
  const { contract, response, startDate, status } = input;
  const due = (days: number) => addDays(startDate, days);
  return [
    {
      id: "day-0-kickoff",
      label: "Owner kickoff",
      status: taskStatus(status, "day-0-kickoff"),
      owner: "Pilot sponsor",
      dayLabel: "Day 0",
      dueDate: due(0),
      action:
        status === "ready"
          ? `Open the pilot, attach ${contract.receipt.receiptId}, and confirm the Day 14 review owner.`
          : response.nextAction,
      acceptance: "Buyer owner confirms continue, revise, or stop criteria before work starts.",
      evidence: `${contract.receipt.receiptId} / fnv1a32:${contract.receipt.checksum}`
    },
    {
      id: "day-3-proof-recheck",
      label: "Live proof recheck",
      status: taskStatus(status, "day-3-proof-recheck"),
      owner: "Proof owner",
      dayLabel: "Day 3",
      dueDate: due(3),
      action: "Run live proof verification and attach the audit receipt to the buyer room.",
      acceptance: "All public proof URLs still open and the receipt is linked from the pilot room.",
      evidence: contract.gates.find((gate) => gate.id === "proof-receipt")?.evidence ?? "Proof receipt gate"
    },
    {
      id: "day-7-value-snapshot",
      label: "Value snapshot",
      status: taskStatus(status, "day-7-value-snapshot"),
      owner: "Finance owner",
      dayLabel: "Day 7",
      dueDate: due(7),
      action: "Record actual assisted minutes, accepted tasks, and value trend against the floor.",
      acceptance: `Trend is on path to ${formatYen(contract.valueFloorYen)}/month accepted value.`,
      evidence: contract.acceptanceLine
    },
    {
      id: "day-14-pilot-review",
      label: "Pilot review",
      status: taskStatus(status, "day-14-pilot-review"),
      owner: "Buyer owner",
      dayLabel: "Day 14",
      dueDate: due(14),
      action: "Review proof, value, and stop-rule evidence with the buyer owner.",
      acceptance: "Buyer records continue, revise, or stop with current evidence attached.",
      evidence: response.closeoutLine
    },
    {
      id: "day-30-value-acceptance",
      label: "Value acceptance",
      status: taskStatus(status, "day-30-value-acceptance"),
      owner: "Procurement owner",
      dayLabel: "Day 30",
      dueDate: due(30),
      action: "Compare realized value to the value floor and stop-loss rule before expansion.",
      acceptance: contract.creditLine,
      evidence: `${formatYen(contract.valueFloorYen)}/month floor; ${formatYen(contract.stopLossYen)}/month stop rule.`
    }
  ];
}

function taskCsv(tasks: QuickWorkflowPilotKickoffTask[]) {
  return [
    ["day", "date", "label", "status", "owner", "action", "acceptance", "evidence"].map(csvCell).join(","),
    ...tasks.map((task) =>
      [task.dayLabel, task.dueDate, task.label, task.status, task.owner, task.action, task.acceptance, task.evidence].map(csvCell).join(",")
    )
  ].join("\n");
}

function taskCalendar(pack: Pick<QuickWorkflowPilotKickoffPack, "tasks" | "buyer" | "workflow" | "receipt">) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//Quick Workflow Pilot Kickoff//EN",
    "CALSCALE:GREGORIAN",
    ...pack.tasks.flatMap((task) => [
      "BEGIN:VEVENT",
      `UID:${task.id}-${pack.receipt.checksum}@a2a-agent-marketplace`,
      `DTSTAMP:${yyyymmdd(pack.tasks[0]?.dueDate || "2026-01-01")}T000000Z`,
      `DTSTART;VALUE=DATE:${yyyymmdd(task.dueDate)}`,
      `SUMMARY:${escapeIcs(`${task.dayLabel} ${task.label} - ${task.owner}`)}`,
      `DESCRIPTION:${escapeIcs(`${task.action} Acceptance: ${task.acceptance} Receipt: ${pack.receipt.receiptId}`)}`,
      "STATUS:TENTATIVE",
      "END:VEVENT"
    ]),
    "END:VCALENDAR"
  ];
  return lines.map(foldIcsLine).join("\r\n");
}

export function buildQuickWorkflowPilotKickoffPack(input: {
  contract: QuickWorkflowValueAcceptanceContract;
  responseRecord: QuickWorkflowCommercialResponseRecord;
  kickoffStartDate: string;
}): QuickWorkflowPilotKickoffPack {
  const { contract, responseRecord } = input;
  const kickoffStartDate = DATE_RE.test(input.kickoffStartDate) ? input.kickoffStartDate : "";
  const baseStatus = statusFor(contract, responseRecord);
  const status: KickoffStatus = kickoffStartDate ? baseStatus : "blocked";
  const tasks = buildTasks({ contract, response: responseRecord, startDate: kickoffStartDate, status });
  const readyCount = tasks.filter((task) => task.status === "ready").length;
  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const firstOpenTask = tasks.find((task) => task.status !== "ready");
  const nextOwner = firstOpenTask?.owner ?? "Pilot sponsor";
  const nextAction = !kickoffStartDate
    ? "Pick a kickoff date before exporting the calendar."
    : firstOpenTask?.action ?? "Send the kickoff note and import the pilot calendar.";
  const sendNoteSubject =
    status === "ready"
      ? `Pilot kickoff: ${contract.buyer}`
      : `Hold kickoff: ${contract.buyer}`;
  const sendNoteBody = [
    `${contract.buyer},`,
    "",
    status === "ready"
      ? `The ${contract.pilotWindow} can start on ${kickoffStartDate}.`
      : "Keep this kickoff internal until the buyer approval and contract gates are closed.",
    "",
    `Workflow: ${contract.workflow}`,
    `Pilot price: ${formatYen(contract.suggestedPilotPriceYen)}`,
    `Accepted value floor: ${formatYen(contract.valueFloorYen)}/month`,
    `Stop rule: ${formatYen(contract.stopLossYen)}/month`,
    `Contract receipt: ${contract.receipt.receiptId} / fnv1a32:${contract.receipt.checksum}`,
    `Buyer response: ${responseRecord.decision}`,
    "",
    "Pilot checks:",
    ...tasks.map((task) => `- ${task.dayLabel} ${task.label}: ${task.action}`),
    "",
    `Next action: ${nextAction}`
  ].join("\n");
  const taskCsvText = taskCsv(tasks);
  const payload = {
    source: "quick-workflow-pilot-kickoff-pack",
    status,
    buyer: contract.buyer,
    workflow: contract.workflow,
    kickoffStartDate,
    contractReceiptId: contract.receipt.receiptId,
    contractChecksum: contract.receipt.checksum,
    responseDecision: responseRecord.decision,
    tasks: tasks.map((task) => ({
      id: task.id,
      status: task.status,
      owner: task.owner,
      dueDate: task.dueDate,
      action: task.action,
      acceptance: task.acceptance
    }))
  };
  const payloadJson = canonicalJson(payload);
  const checksum = fnv1a32(payloadJson);
  const receipt = {
    receiptId: `quick-kickoff-pack-${status}-${yyyymmdd(kickoffStartDate || "0000-00-00")}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`
  };
  const calendarHost = { tasks, buyer: contract.buyer, workflow: contract.workflow, receipt };
  const icsText = kickoffStartDate ? taskCalendar(calendarHost) : "";
  const summary =
    status === "ready"
      ? `${tasks.length} dated owner tasks turn the verified contract into a pilot the buyer can run.`
      : status === "watch"
        ? "The pack is useful for planning, but the buyer response or contract gate still needs closure."
        : "The pack stays internal until the contract, buyer response, and kickoff date are ready.";
  const exportMarkdown = [
    "# Quick workflow pilot kickoff pack",
    "",
    headlineFor(status),
    summary,
    `Status: ${status}`,
    `Buyer: ${contract.buyer}`,
    `Workflow: ${contract.workflow}`,
    `Kickoff start: ${kickoffStartDate || "not set"}`,
    `Pilot window: ${contract.pilotWindow}`,
    `Contract receipt: ${contract.receipt.receiptId} / fnv1a32:${contract.receipt.checksum}`,
    `Kickoff receipt: ${receipt.receiptId} / fnv1a32:${receipt.checksum}`,
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`,
    "",
    "## Send note",
    sendNoteBody,
    "",
    "## Owner tasks",
    ...tasks.map((task) => `- [${task.status}] ${task.dayLabel} ${task.label} (${task.owner}, ${task.dueDate || "no date"}): ${task.action}`),
    "",
    "## CSV",
    "```csv",
    taskCsvText,
    "```"
  ].join("\n");

  return {
    status,
    headline: headlineFor(status),
    summary,
    buyer: contract.buyer,
    workflow: contract.workflow,
    kickoffStartDate,
    endDate: addDays(kickoffStartDate, 30),
    nextOwner,
    nextAction,
    sendNoteSubject,
    sendNoteBody,
    mailtoHref: `mailto:?subject=${encodeURIComponent(sendNoteSubject)}&body=${encodeURIComponent(sendNoteBody)}`,
    tasks,
    readyCount,
    blockedCount,
    taskCsvText,
    taskCsvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(taskCsvText)}`,
    icsText,
    icsHref: icsText ? `data:text/calendar;charset=utf-8,${encodeURIComponent(icsText)}` : "",
    receipt,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}
