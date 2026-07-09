import type { QuickWorkflowBuyerExpansionPacket, QuickWorkflowBuyerExpansionPacketStage } from "./quickWorkflowBuyerExpansionPacket";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION,
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH,
  quickWorkflowBuyerExpansionHandoffChecksum,
  quickWorkflowBuyerExpansionHandoffPayloadJson,
  quickWorkflowBuyerExpansionHandoffRequestJson,
  quickWorkflowBuyerExpansionHandoffVerifierHref,
  type QuickWorkflowBuyerExpansionHandoffReceiptPayload
} from "./quickWorkflowBuyerExpansionHandoffReceipt";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH,
  buildQuickWorkflowBuyerExpansionHandoffSignoff,
  type QuickWorkflowBuyerExpansionHandoffSignoff
} from "./quickWorkflowBuyerExpansionHandoffSignoffReceipt";

type BuyerExpansionHandoffStatus = QuickWorkflowBuyerExpansionPacket["status"];

export type QuickWorkflowBuyerExpansionHandoffSource = Pick<
  QuickWorkflowBuyerExpansionPacket,
  | "status"
  | "headline"
  | "buyer"
  | "workflow"
  | "decisionAsk"
  | "primaryMetric"
  | "receiptLine"
  | "readyCount"
  | "totalCount"
  | "nextOwner"
  | "nextAction"
  | "stages"
>;

export type QuickWorkflowBuyerExpansionHandoffTaskId =
  | "attach-one-pager"
  | "verify-receipt-chain"
  | "procurement-signoff"
  | "value-recheck-window";

export type QuickWorkflowBuyerExpansionHandoffTask = {
  id: QuickWorkflowBuyerExpansionHandoffTaskId;
  label: string;
  status: BuyerExpansionHandoffStatus;
  owner: string;
  action: string;
  acceptance: string;
  proof: string;
  href?: string;
};

export type QuickWorkflowBuyerExpansionHandoff = {
  status: BuyerExpansionHandoffStatus;
  handoffId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  headline: string;
  summary: string;
  buyer: string;
  workflow: string;
  readyCount: number;
  totalCount: number;
  nextOwner: string;
  nextAction: string;
  approvalLine: string;
  riskLine: string;
  tasks: QuickWorkflowBuyerExpansionHandoffTask[];
  taskCsvText: string;
  taskCsvHref: string;
  signoff: QuickWorkflowBuyerExpansionHandoffSignoff;
  receipt: {
    receiptId: string;
    receiptVersion: typeof QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    verificationApiPath: typeof QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH;
    payloadJson: string;
    payloadHref: string;
    verificationRequestJson: string;
    verificationRequestHref: string;
    verifierHref: string;
  };
  sendNoteSubject: string;
  sendNoteBody: string;
  mailtoHref: string;
  exportMarkdown: string;
  exportHref: string;
};

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function statusRank(status: BuyerExpansionHandoffStatus) {
  if (status === "blocked") return 0;
  if (status === "watch") return 1;
  return 2;
}

function taskCsv(tasks: QuickWorkflowBuyerExpansionHandoffTask[]) {
  return [
    ["task", "status", "owner", "action", "acceptance", "proof"].map(csvCell).join(","),
    ...tasks.map((task) => [task.label, task.status, task.owner, task.action, task.acceptance, task.proof].map(csvCell).join(","))
  ].join("\n");
}

function stageById(packet: QuickWorkflowBuyerExpansionHandoffSource, id: QuickWorkflowBuyerExpansionPacketStage["id"]) {
  return packet.stages.find((stage) => stage.id === id);
}

function receiptProofLine(stage: QuickWorkflowBuyerExpansionPacketStage | undefined) {
  if (!stage) return "No stage yet";
  if (stage.verifierHref && stage.receiptId) return `${stage.receiptId} / verifier attached`;
  if (stage.receiptId) return stage.receiptId;
  return stage.value;
}

function recheckDateFor(packet: QuickWorkflowBuyerExpansionHandoffSource) {
  const kickoff = stageById(packet, "kickoff");
  const dates = kickoff?.value.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
  return dates.at(-1) ?? "";
}

function handoffStatusFor(packet: QuickWorkflowBuyerExpansionHandoffSource, taskId: QuickWorkflowBuyerExpansionHandoffTaskId): BuyerExpansionHandoffStatus {
  if (packet.status === "blocked") return "blocked";
  if (packet.status === "ready") return "ready";
  if (taskId === "attach-one-pager" && packet.readyCount > 0) return "watch";
  return "watch";
}

function headlineFor(status: BuyerExpansionHandoffStatus) {
  if (status === "ready") return "Procurement handoff is ready";
  if (status === "watch") return "Procurement handoff is assembling";
  return "Procurement handoff is blocked";
}

function buildTasks(packet: QuickWorkflowBuyerExpansionHandoffSource): QuickWorkflowBuyerExpansionHandoffTask[] {
  const contract = stageById(packet, "contract");
  const kickoff = stageById(packet, "kickoff");
  const run = stageById(packet, "run");
  const decision = stageById(packet, "decision");
  const expansion = stageById(packet, "expansion");
  const receiptStages = [contract, kickoff, run, decision, expansion].filter(Boolean) as QuickWorkflowBuyerExpansionPacketStage[];
  const receiptProof = receiptStages.map((stage) => receiptProofLine(stage)).join("; ") || packet.receiptLine;

  return [
    {
      id: "attach-one-pager",
      label: "Attach one-pager",
      status: handoffStatusFor(packet, "attach-one-pager"),
      owner: "Pilot sponsor",
      action:
        packet.status === "ready"
          ? "Attach the HTML one-pager and markdown packet to the procurement room."
          : "Keep the one-pager internal until the packet has a ready expansion guardrail.",
      acceptance: "Procurement can read the decision ask, value floor, receipt chain, and all packet stages without asking for context.",
      proof: `${packet.readyCount}/${packet.totalCount} packet stages; ${packet.headline}`
    },
    {
      id: "verify-receipt-chain",
      label: "Verify receipt chain",
      status: handoffStatusFor(packet, "verify-receipt-chain"),
      owner: "Proof owner",
      action:
        packet.status === "ready"
          ? "Open every verifier link, preserve the result, and attach kickoff receipt ID as supporting proof."
          : "Repair the first open packet stage before asking proof owner to verify the chain.",
      acceptance: "Contract, run, decision, and expansion verifier links are attached; kickoff receipt ID is present.",
      proof: receiptProof
    },
    {
      id: "procurement-signoff",
      label: "Record procurement signoff",
      status: handoffStatusFor(packet, "procurement-signoff"),
      owner: "Procurement owner",
      action: packet.status === "ready" ? packet.decisionAsk : packet.nextAction,
      acceptance: "Approval names the next operating window, stop rule, value floor, and expansion receipt.",
      proof: receiptProofLine(expansion),
      href: expansion?.verifierHref
    },
    {
      id: "value-recheck-window",
      label: "Schedule value recheck",
      status: handoffStatusFor(packet, "value-recheck-window"),
      owner: "Finance owner",
      action:
        packet.status === "ready"
          ? "Schedule the next retained-value recheck before renewal or wider rollout."
          : "Record measured value, owner acceptance, and next window before scheduling recheck.",
      acceptance: "Calendar entry names the owner, target value, receipt to reopen, and stop condition.",
      proof: packet.primaryMetric,
      href: decision?.verifierHref
    }
  ];
}

export function buildQuickWorkflowBuyerExpansionHandoff(packet: QuickWorkflowBuyerExpansionHandoffSource): QuickWorkflowBuyerExpansionHandoff {
  const tasks = buildTasks(packet);
  const readyCount = tasks.filter((task) => task.status === "ready").length;
  const firstOpenTask = [...tasks].sort((left, right) => statusRank(left.status) - statusRank(right.status)).find((task) => task.status !== "ready");
  const nextOwner = packet.status === "ready" ? "Procurement owner" : (firstOpenTask?.owner ?? packet.nextOwner);
  const nextAction = packet.status === "ready" ? "Record procurement signoff, then schedule the next value recheck." : (firstOpenTask?.action ?? packet.nextAction);
  const approvalLine =
    packet.status === "ready"
      ? `Approve only with ${packet.receiptLine}`
      : `Hold approval until ${packet.nextOwner} clears: ${packet.nextAction}`;
  const riskLine =
    packet.status === "ready"
      ? "Do not expand beyond the named window unless the next retained-value recheck still clears the floor."
      : "Do not forward this as an approval packet while any stage remains outside ready state.";
  const summary =
    packet.status === "ready"
      ? `${tasks.length} owner tasks turn the one-pager into a procurement decision with the receipt chain attached.`
      : `${readyCount}/${tasks.length} handoff tasks are ready; keep this internal until the packet reaches 6/6.`;
  const taskCsvText = taskCsv(tasks);
  const payload: QuickWorkflowBuyerExpansionHandoffReceiptPayload = {
    receiptVersion: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION,
    source: "quick-workflow-buyer-expansion-handoff",
    status: packet.status,
    buyer: packet.buyer,
    workflow: packet.workflow,
    decisionAsk: packet.decisionAsk,
    approvalLine,
    riskLine,
    receiptLine: packet.receiptLine,
    packetReadyCount: packet.readyCount,
    packetTotalCount: packet.totalCount,
    nextOwner,
    nextAction,
    tasks: tasks.map((task) => ({
      id: task.id,
      status: task.status,
      owner: task.owner,
      action: task.action,
      acceptance: task.acceptance,
      proof: task.proof
    }))
  };
  const payloadJson = quickWorkflowBuyerExpansionHandoffPayloadJson(payload);
  const checksum = quickWorkflowBuyerExpansionHandoffChecksum(payload);
  const verificationRequestJson = quickWorkflowBuyerExpansionHandoffRequestJson({ checksum, payload });
  const receipt: QuickWorkflowBuyerExpansionHandoff["receipt"] = {
    receiptId: `quick-buyer-expansion-handoff-${packet.status}-${checksum}`,
    receiptVersion: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    verificationApiPath: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verifierHref: quickWorkflowBuyerExpansionHandoffVerifierHref(verificationRequestJson)
  };
  const handoffId = receipt.receiptId;
  const signoff = buildQuickWorkflowBuyerExpansionHandoffSignoff({
    status: packet.status,
    buyer: packet.buyer,
    workflow: packet.workflow,
    handoffId,
    checksum,
    approvalLine,
    riskLine,
    nextOwner,
    nextAction,
    recheckDate: recheckDateFor(packet),
    readyCount,
    totalCount: tasks.length,
    receipt,
    tasks
  });
  const sendNoteSubject = packet.status === "ready" ? `Procurement handoff: ${packet.buyer}` : `Hold procurement handoff: ${packet.buyer}`;
  const sendNoteBody = [
    `${packet.buyer},`,
    "",
    summary,
    "",
    `Handoff ID: ${handoffId} / fnv1a32:${checksum}`,
    `Workflow: ${packet.workflow}`,
    `Decision ask: ${packet.decisionAsk}`,
    `Approval line: ${approvalLine}`,
    `Risk line: ${riskLine}`,
    `Receipt chain: ${packet.receiptLine}`,
    `Handoff receipt: ${receipt.receiptId} / ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Verifier: ${receipt.verifierHref}`,
    `Signoff receipt: ${signoff.receiptId} / ${signoff.checksumAlgorithm}:${signoff.checksum}`,
    `Signoff verifier: ${signoff.verifierHref}`,
    "",
    "Owner tasks:",
    ...tasks.map((task) => `- [${task.status}] ${task.label} (${task.owner}): ${task.action} Acceptance: ${task.acceptance}`),
    "",
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`
  ].join("\n");
  const exportMarkdown = [
    "# Quick workflow buyer expansion procurement handoff",
    "",
    headlineFor(packet.status),
    summary,
    `Status: ${packet.status}`,
    `Handoff ID: ${handoffId}`,
    `Checksum: fnv1a32:${checksum}`,
    `Buyer: ${packet.buyer}`,
    `Workflow: ${packet.workflow}`,
    `Decision ask: ${packet.decisionAsk}`,
    `Approval line: ${approvalLine}`,
    `Risk line: ${riskLine}`,
    `Receipt chain: ${packet.receiptLine}`,
    `Handoff receipt: ${receipt.receiptId} / ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `API verification: POST ${QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH}`,
    `Verifier: ${receipt.verifierHref}`,
    `Signoff decision: ${signoff.decision}`,
    `Signoff receipt: ${signoff.receiptId} / ${signoff.checksumAlgorithm}:${signoff.checksum}`,
    `Signoff API verification: POST ${QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH}`,
    `Signoff verifier: ${signoff.verifierHref}`,
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`,
    "",
    "## Owner tasks",
    ...tasks.map((task) => `- [${task.status}] ${task.label} (${task.owner}): ${task.action} Acceptance: ${task.acceptance} Proof: ${task.proof}`),
    "",
    "## CSV",
    "```csv",
    taskCsvText,
    "```"
  ].join("\n");

  return {
    status: packet.status,
    handoffId,
    checksumAlgorithm: "fnv1a32",
    checksum,
    headline: headlineFor(packet.status),
    summary,
    buyer: packet.buyer,
    workflow: packet.workflow,
    readyCount,
    totalCount: tasks.length,
    nextOwner,
    nextAction,
    approvalLine,
    riskLine,
    tasks,
    taskCsvText,
    taskCsvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(taskCsvText)}`,
    signoff,
    receipt,
    sendNoteSubject,
    sendNoteBody,
    mailtoHref: `mailto:?subject=${encodeURIComponent(sendNoteSubject)}&body=${encodeURIComponent(sendNoteBody)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}
