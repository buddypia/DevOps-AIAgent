import type {
  QuickWorkflowPilotKickoffPack,
  QuickWorkflowPilotKickoffTask,
  QuickWorkflowPilotKickoffTaskId
} from "./quickWorkflowPilotKickoffPack";
import {
  QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION,
  QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH,
  quickWorkflowPilotRunLogChecksum,
  quickWorkflowPilotRunLogPayloadJson,
  quickWorkflowPilotRunLogRequestJson,
  quickWorkflowPilotRunLogVerifierHref,
  type QuickWorkflowPilotRunLogDecision,
  type QuickWorkflowPilotRunLogReceiptPayload,
  type QuickWorkflowPilotRunLogStatus
} from "./quickWorkflowPilotRunLogReceipt";

type PilotRunLogStatus = QuickWorkflowPilotRunLogStatus;
export type { QuickWorkflowPilotRunLogDecision };

type EvidenceGroup = {
  label: string;
  patterns: RegExp[];
};

export type QuickWorkflowPilotRunLogTask = {
  id: QuickWorkflowPilotKickoffTaskId;
  label: string;
  dayLabel: string;
  dueDate: string;
  owner: string;
  status: PilotRunLogStatus;
  foundSignals: string[];
  missingSignals: string[];
  nextAction: string;
  acceptance: string;
};

export type QuickWorkflowPilotRunLog = {
  status: PilotRunLogStatus;
  decision: QuickWorkflowPilotRunLogDecision;
  headline: string;
  summary: string;
  buyer: string;
  workflow: string;
  runWindow: string;
  evidenceScore: number;
  readyCount: number;
  watchCount: number;
  blockedCount: number;
  missingProofCount: number;
  nextOwner: string;
  nextAction: string;
  evidenceText: string;
  tasks: QuickWorkflowPilotRunLogTask[];
  closeoutNoteSubject: string;
  closeoutNoteBody: string;
  mailtoHref: string;
  taskCsvText: string;
  taskCsvHref: string;
  receipt: {
    receiptId: string;
    receiptVersion: typeof QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    verificationApiPath: typeof QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH;
    payloadJson: string;
    payloadHref: string;
    verificationRequestJson: string;
    verificationRequestHref: string;
    verifierHref: string;
  };
  exportMarkdown: string;
  exportHref: string;
};

const EVIDENCE_GROUPS: Record<QuickWorkflowPilotKickoffTaskId, EvidenceGroup[]> = {
  "day-0-kickoff": [
    { label: "kickoff opened", patterns: [/\bkickoff\b/i, /\bopened\b/i, /\bstarted\b/i, /\blaunched\b/i] },
    { label: "buyer owner accepted continue, revise, or stop criteria", patterns: [/\bbuyer owner\b/i, /\bcontinue\b/i, /\brevise\b/i, /\bstop\b/i] },
    { label: "source contract receipt attached", patterns: [/\bcontract receipt\b/i, /\bquick-value-contract\b/i] }
  ],
  "day-3-proof-recheck": [
    { label: "live proof verification rerun", patterns: [/\blive proof\b/i, /\bverification\b/i, /\bverified\b/i, /\baudit receipt\b/i] },
    { label: "public proof links still open", patterns: [/\bpublic proof\b/i, /\burls?\b/i, /\bopen\b/i, /\blink/i] },
    { label: "receipt linked to buyer room", patterns: [/\breceipt\b/i, /\bbuyer room\b/i, /\blink/i] }
  ],
  "day-7-value-snapshot": [
    { label: "assisted minutes recorded", patterns: [/\bassisted minutes?\b/i, /\bminutes saved\b/i, /\bsaved\b/i] },
    { label: "accepted task count recorded", patterns: [/\baccepted tasks?\b/i, /\b5\/5\b/i, /\baccepted\b/i] },
    { label: "value trend checked by finance", patterns: [/\bvalue trend\b/i, /\bfinance\b/i, /¥\s?\d/i, /\bmonth\b/i] }
  ],
  "day-14-pilot-review": [
    { label: "buyer review completed", patterns: [/\bday 14\b/i, /\bpilot review\b/i, /\breview\b/i] },
    { label: "continue, revise, or stop decision recorded", patterns: [/\bcontinue\b/i, /\brevise\b/i, /\bstop\b/i, /\bdecision\b/i] },
    { label: "current evidence attached", patterns: [/\bevidence attached\b/i, /\bcurrent evidence\b/i, /\bproof\b/i] }
  ],
  "day-30-value-acceptance": [
    { label: "value floor compared", patterns: [/\bvalue floor\b/i, /\babove floor\b/i, /\baccepted value\b/i] },
    { label: "stop-loss rule checked", patterns: [/\bstop[- ]?loss\b/i, /\bstop rule\b/i, /\brepair work\b/i] },
    { label: "procurement or sponsor acceptance recorded", patterns: [/\bprocurement\b/i, /\bsponsor\b/i, /\baccepted\b/i, /\bacceptance\b/i] }
  ]
};

function compactLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function groupFound(text: string, group: EvidenceGroup) {
  return group.patterns.some((pattern) => pattern.test(text));
}

function taskStatus(pack: QuickWorkflowPilotKickoffPack, sourceTask: QuickWorkflowKickoffTaskLike, foundCount: number, groupCount: number): PilotRunLogStatus {
  if (pack.status === "blocked" || sourceTask.status === "blocked") return "blocked";
  if (foundCount === groupCount) return "ready";
  return "watch";
}

type QuickWorkflowKickoffTaskLike = Pick<QuickWorkflowPilotKickoffTask, "status">;

function buildRunTasks(pack: QuickWorkflowPilotKickoffPack, evidenceText: string): QuickWorkflowPilotRunLogTask[] {
  return pack.tasks.map((task) => {
    const groups = EVIDENCE_GROUPS[task.id];
    const foundSignals = groups.filter((group) => groupFound(evidenceText, group)).map((group) => group.label);
    const missingSignals = groups.filter((group) => !foundSignals.includes(group.label)).map((group) => group.label);
    const status = taskStatus(pack, task, foundSignals.length, groups.length);
    const nextAction =
      status === "ready"
        ? `${task.label} evidence is ready for the closeout packet.`
        : status === "blocked"
          ? task.action
          : `Attach ${missingSignals[0] ?? "pilot evidence"} evidence for ${task.label}.`;

    return {
      id: task.id,
      label: task.label,
      dayLabel: task.dayLabel,
      dueDate: task.dueDate,
      owner: task.owner,
      status,
      foundSignals,
      missingSignals,
      nextAction,
      acceptance: task.acceptance
    };
  });
}

function decisionFor(input: { pack: QuickWorkflowPilotKickoffPack; tasks: QuickWorkflowPilotRunLogTask[]; evidenceText: string }): QuickWorkflowPilotRunLogDecision {
  if (input.pack.status === "blocked") return "hold-run";
  if (!input.evidenceText) return "start-run-log";
  if (input.tasks.every((task) => task.status === "ready")) return "send-closeout-note";
  return "repair-evidence-gaps";
}

function headlineFor(decision: QuickWorkflowPilotRunLogDecision) {
  if (decision === "send-closeout-note") return "Pilot run log is ready for closeout";
  if (decision === "repair-evidence-gaps") return "Pilot run log needs evidence repairs";
  if (decision === "hold-run") return "Pilot run is blocked before evidence logging";
  return "Paste live pilot evidence to start the run log";
}

function summaryFor(decision: QuickWorkflowPilotRunLogDecision, readyCount: number, total: number, missingProofCount: number) {
  if (decision === "send-closeout-note") return `${readyCount}/${total} pilot tasks have evidence, so the buyer can receive the closeout note.`;
  if (decision === "repair-evidence-gaps") return `${missingProofCount} evidence signals are missing before this run is buyer-ready.`;
  if (decision === "hold-run") return "The source kickoff pack is blocked, so run evidence should stay internal.";
  return "Use the buyer meeting notes, proof receipts, accepted task counts, and value checks to build a verified run record.";
}

function taskCsv(tasks: QuickWorkflowPilotRunLogTask[]) {
  return [
    ["day", "date", "task", "status", "owner", "found_signals", "missing_signals", "next_action"].map(csvCell).join(","),
    ...tasks.map((task) =>
      [
        task.dayLabel,
        task.dueDate,
        task.label,
        task.status,
        task.owner,
        task.foundSignals.join("; "),
        task.missingSignals.join("; "),
        task.nextAction
      ]
        .map(csvCell)
        .join(",")
    )
  ].join("\n");
}

export function buildQuickWorkflowPilotRunLog(input: {
  pack: QuickWorkflowPilotKickoffPack;
  evidenceText: string;
}): QuickWorkflowPilotRunLog {
  const { pack } = input;
  const evidenceText = compactLine(input.evidenceText);
  const tasks = buildRunTasks(pack, evidenceText);
  const readyCount = tasks.filter((task) => task.status === "ready").length;
  const watchCount = tasks.filter((task) => task.status === "watch").length;
  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const missingProofCount = tasks.reduce((count, task) => count + task.missingSignals.length, 0);
  const totalSignalCount = Object.values(EVIDENCE_GROUPS).reduce((count, groups) => count + groups.length, 0);
  const foundSignalCount = tasks.reduce((count, task) => count + task.foundSignals.length, 0);
  const evidenceScore = totalSignalCount === 0 ? 0 : Math.round((foundSignalCount / totalSignalCount) * 100);
  const decision = decisionFor({ pack, tasks, evidenceText });
  const status: PilotRunLogStatus = decision === "send-closeout-note" ? "ready" : decision === "hold-run" ? "blocked" : "watch";
  const firstOpenTask = tasks.find((task) => task.status !== "ready");
  const nextOwner = firstOpenTask?.owner ?? "Pilot sponsor";
  const nextAction =
    decision === "send-closeout-note"
      ? "Send the closeout note with the run receipt and keep expansion gated by accepted value."
      : firstOpenTask?.nextAction ?? "Paste pilot run evidence before sending the closeout note.";
  const runWindow = `${pack.kickoffStartDate || "not set"} to ${pack.endDate || "not set"}`;
  const taskCsvText = taskCsv(tasks);
  const payload: QuickWorkflowPilotRunLogReceiptPayload = {
    receiptVersion: QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION,
    source: "quick-workflow-pilot-run-log",
    status,
    decision,
    buyer: pack.buyer,
    workflow: pack.workflow,
    runWindow,
    sourceKickoffReceiptId: pack.receipt.receiptId,
    sourceKickoffChecksum: `${pack.receipt.checksumAlgorithm}:${pack.receipt.checksum}`,
    evidenceScore,
    readyCount,
    watchCount,
    blockedCount,
    missingProofCount,
    evidenceExcerpt: evidenceText.slice(0, 600),
    tasks: tasks.map((task) => ({
      id: task.id,
      status: task.status,
      owner: task.owner,
      dueDate: task.dueDate,
      foundSignals: task.foundSignals,
      missingSignals: task.missingSignals
    }))
  };
  const payloadJson = quickWorkflowPilotRunLogPayloadJson(payload);
  const checksum = quickWorkflowPilotRunLogChecksum(payload);
  const verificationRequestJson = quickWorkflowPilotRunLogRequestJson({ checksum, payload });
  const receipt: QuickWorkflowPilotRunLog["receipt"] = {
    receiptId: `quick-pilot-run-log-${status}-${checksum}`,
    receiptVersion: QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    verificationApiPath: QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verifierHref: quickWorkflowPilotRunLogVerifierHref(verificationRequestJson)
  };
  const closeoutNoteSubject =
    status === "ready" ? `Pilot closeout: ${pack.buyer}` : `Pilot evidence repair: ${pack.buyer}`;
  const closeoutNoteBody = [
    `${pack.buyer},`,
    "",
    status === "ready"
      ? "The pilot run log has evidence for every owner task and is ready for closeout review."
      : "The pilot run log is not ready for buyer closeout yet. The open evidence gaps are below.",
    "",
    `Workflow: ${pack.workflow}`,
    `Run window: ${runWindow}`,
    `Kickoff receipt: ${pack.receipt.receiptId} / ${pack.receipt.checksumAlgorithm}:${pack.receipt.checksum}`,
    `Run receipt: ${receipt.receiptId} / ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Evidence score: ${evidenceScore}/100`,
    "",
    "Task evidence:",
    ...tasks.map((task) => `- [${task.status}] ${task.dayLabel} ${task.label}: ${task.nextAction}`),
    "",
    `Next action: ${nextAction}`
  ].join("\n");
  const exportMarkdown = [
    "# Quick workflow pilot run log",
    "",
    headlineFor(decision),
    summaryFor(decision, readyCount, tasks.length, missingProofCount),
    `Status: ${status}`,
    `Decision: ${decision}`,
    `Buyer: ${pack.buyer}`,
    `Workflow: ${pack.workflow}`,
    `Run window: ${runWindow}`,
    `Evidence score: ${evidenceScore}/100`,
    `Kickoff receipt: ${pack.receipt.receiptId} / ${pack.receipt.checksumAlgorithm}:${pack.receipt.checksum}`,
    `Run receipt: ${receipt.receiptId} / ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `API verification: POST ${QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH}`,
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`,
    "",
    "## Evidence tasks",
    ...tasks.map(
      (task) =>
        `- [${task.status}] ${task.dayLabel} ${task.label} (${task.owner}, ${task.dueDate || "no date"}): ${task.nextAction} Missing: ${
          task.missingSignals.join(", ") || "none"
        }`
    ),
    "",
    "## Closeout note",
    closeoutNoteBody,
    "",
    "## CSV",
    "```csv",
    taskCsvText,
    "```"
  ].join("\n");

  return {
    status,
    decision,
    headline: headlineFor(decision),
    summary: summaryFor(decision, readyCount, tasks.length, missingProofCount),
    buyer: pack.buyer,
    workflow: pack.workflow,
    runWindow,
    evidenceScore,
    readyCount,
    watchCount,
    blockedCount,
    missingProofCount,
    nextOwner,
    nextAction,
    evidenceText,
    tasks,
    closeoutNoteSubject,
    closeoutNoteBody,
    mailtoHref: `mailto:?subject=${encodeURIComponent(closeoutNoteSubject)}&body=${encodeURIComponent(closeoutNoteBody)}`,
    taskCsvText,
    taskCsvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(taskCsvText)}`,
    receipt,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}
