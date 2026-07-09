import type { QuickWorkflowPilotRunLog } from "./quickWorkflowPilotRunLog";
import {
  QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION,
  QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH,
  quickWorkflowPilotDecisionBriefChecksum,
  quickWorkflowPilotDecisionBriefPayloadJson,
  quickWorkflowPilotDecisionBriefRequestJson,
  quickWorkflowPilotDecisionBriefVerifierHref,
  type QuickWorkflowPilotDecisionBriefDecision,
  type QuickWorkflowPilotDecisionBriefReceiptPayload,
  type QuickWorkflowPilotDecisionBriefStatus
} from "./quickWorkflowPilotDecisionBriefReceipt";
import type { QuickWorkflowValueAcceptanceContract } from "./quickWorkflowValueAcceptanceContract";

type PilotDecisionBriefStatus = QuickWorkflowPilotDecisionBriefStatus;
export type { QuickWorkflowPilotDecisionBriefDecision };

export type QuickWorkflowPilotDecisionBriefAction = {
  id: "verify-run-receipt" | "record-decision" | "schedule-value-recheck" | "hold-expansion";
  label: string;
  status: PilotDecisionBriefStatus;
  owner: string;
  action: string;
  acceptance: string;
};

export type QuickWorkflowPilotDecisionBrief = {
  status: PilotDecisionBriefStatus;
  decision: QuickWorkflowPilotDecisionBriefDecision;
  headline: string;
  summary: string;
  buyer: string;
  workflow: string;
  decisionAsk: string;
  valueLine: string;
  riskLine: string;
  nextOwner: string;
  nextAction: string;
  runVerifierHref: string;
  contractVerifierHref: string;
  actions: QuickWorkflowPilotDecisionBriefAction[];
  receipt: {
    receiptId: string;
    receiptVersion: typeof QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    verificationApiPath: typeof QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH;
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

function formatYen(value: number) {
  return `¥${Math.max(0, Math.round(value)).toLocaleString("ja-JP")}`;
}

function ratioLabel(value: number, base: number) {
  if (!Number.isFinite(value) || !Number.isFinite(base) || base <= 0) return "not priced";
  return `${(value / base).toFixed(value / base >= 10 ? 0 : 1)}x`;
}

function decisionFor(log: QuickWorkflowPilotRunLog, contract: QuickWorkflowValueAcceptanceContract): QuickWorkflowPilotDecisionBriefDecision {
  if (log.status === "blocked" || contract.status === "blocked") return "stop-before-expansion";
  if (log.status === "ready" && log.missingProofCount === 0 && contract.status === "ready") return "expand-with-guardrails";
  return "revise-evidence";
}

function statusFor(decision: QuickWorkflowPilotDecisionBriefDecision): PilotDecisionBriefStatus {
  if (decision === "expand-with-guardrails") return "ready";
  if (decision === "stop-before-expansion") return "blocked";
  return "watch";
}

function headlineFor(decision: QuickWorkflowPilotDecisionBriefDecision) {
  if (decision === "expand-with-guardrails") return "Expansion decision brief is ready";
  if (decision === "stop-before-expansion") return "Do not expand this pilot yet";
  return "Decision brief needs evidence repair";
}

function decisionAskFor(decision: QuickWorkflowPilotDecisionBriefDecision, contract: QuickWorkflowValueAcceptanceContract) {
  if (decision === "expand-with-guardrails") {
    return `Approve the next operating window only after the run receipt verifies and ${contract.buyer} keeps the value floor owner named.`;
  }
  if (decision === "stop-before-expansion") {
    return "Stop expansion and reopen the pilot only after the blocked receipt or contract gate is repaired.";
  }
  return "Hold expansion, repair the missing run evidence, and resend the decision brief with a verified run receipt.";
}

function actionStatus(decision: QuickWorkflowPilotDecisionBriefDecision, readyWhenExpand = true): PilotDecisionBriefStatus {
  if (decision === "expand-with-guardrails" && readyWhenExpand) return "ready";
  if (decision === "stop-before-expansion") return "blocked";
  return "watch";
}

function buildActions(input: {
  decision: QuickWorkflowPilotDecisionBriefDecision;
  log: QuickWorkflowPilotRunLog;
  contract: QuickWorkflowValueAcceptanceContract;
}): QuickWorkflowPilotDecisionBriefAction[] {
  const { decision, log, contract } = input;
  return [
    {
      id: "verify-run-receipt",
      label: "Verify run receipt",
      status: actionStatus(decision),
      owner: "Buyer reviewer",
      action: `Open ${log.receipt.receiptId} and attach the verifier result to the decision record.`,
      acceptance: "Receipt verifier returns HTTP 200 and the result names this buyer, workflow, evidence score, and missing proof count."
    },
    {
      id: "record-decision",
      label: "Record expansion decision",
      status: actionStatus(decision),
      owner: "Procurement owner",
      action:
        decision === "expand-with-guardrails"
          ? "Record expand with the run receipt, contract receipt, stop rule, and next value owner."
          : "Record hold with the missing evidence and repair owner before any expansion spend.",
      acceptance: "Decision record says expand, revise, or stop and includes both source receipts."
    },
    {
      id: "schedule-value-recheck",
      label: "Schedule value recheck",
      status: actionStatus(decision, decision === "expand-with-guardrails"),
      owner: "Finance owner",
      action: `Schedule a 30-day value recheck against ${formatYen(contract.valueFloorYen)}/month and the ${formatYen(contract.stopLossYen)}/month stop rule.`,
      acceptance: "Calendar entry names the value floor, stop rule, owner, and receipt source."
    },
    {
      id: "hold-expansion",
      label: "Keep expansion gated",
      status: decision === "expand-with-guardrails" ? "ready" : "watch",
      owner: "Pilot sponsor",
      action:
        decision === "expand-with-guardrails"
          ? "Keep expansion gated by verified value; do not remove the stop rule from the next agreement."
          : log.nextAction,
      acceptance: "No expansion work starts unless the decision brief and verifier results are attached."
    }
  ];
}

export function buildQuickWorkflowPilotDecisionBrief(input: {
  log: QuickWorkflowPilotRunLog;
  contract: QuickWorkflowValueAcceptanceContract;
}): QuickWorkflowPilotDecisionBrief {
  const { log, contract } = input;
  const decision = decisionFor(log, contract);
  const status = statusFor(decision);
  const actions = buildActions({ decision, log, contract });
  const firstOpenAction = actions.find((action) => action.status !== "ready");
  const nextOwner = firstOpenAction?.owner ?? "Procurement owner";
  const nextAction = firstOpenAction?.action ?? "Send the decision brief and attach both verifier results.";
  const valueLine = `${formatYen(contract.valueFloorYen)}/month accepted floor is ${ratioLabel(
    contract.valueFloorYen,
    contract.suggestedPilotPriceYen
  )} the ${formatYen(contract.suggestedPilotPriceYen)} pilot price.`;
  const riskLine =
    decision === "expand-with-guardrails"
      ? `Expansion stays gated by the ${formatYen(contract.stopLossYen)}/month stop rule and verified run receipt.`
      : `${log.missingProofCount} run evidence signals or contract gates still block an external expansion ask.`;
  const decisionAsk = decisionAskFor(decision, contract);
  const summary =
    decision === "expand-with-guardrails"
      ? "The verified run log and value acceptance contract can become a buyer decision record."
      : decision === "stop-before-expansion"
        ? "The pilot should not move into expansion until the blocked evidence is repaired."
        : "The buyer can use this as a repair brief, but not yet as an expansion ask.";
  const payload: QuickWorkflowPilotDecisionBriefReceiptPayload = {
    receiptVersion: QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION,
    source: "quick-workflow-pilot-decision-brief",
    status,
    decision,
    buyer: contract.buyer,
    workflow: contract.workflow,
    decisionAsk,
    valueLine,
    riskLine,
    runReceiptId: log.receipt.receiptId,
    runChecksum: `${log.receipt.checksumAlgorithm}:${log.receipt.checksum}`,
    contractReceiptId: contract.receipt.receiptId,
    contractChecksum: `${contract.receipt.checksumAlgorithm}:${contract.receipt.checksum}`,
    nextOwner,
    nextAction,
    actions: actions.map((action) => ({
      id: action.id,
      status: action.status,
      owner: action.owner,
      action: action.action,
      acceptance: action.acceptance
    }))
  };
  const payloadJson = quickWorkflowPilotDecisionBriefPayloadJson(payload);
  const checksum = quickWorkflowPilotDecisionBriefChecksum(payload);
  const verificationRequestJson = quickWorkflowPilotDecisionBriefRequestJson({ checksum, payload });
  const receipt: QuickWorkflowPilotDecisionBrief["receipt"] = {
    receiptId: `quick-pilot-decision-brief-${status}-${checksum}`,
    receiptVersion: QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    verificationApiPath: QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verifierHref: quickWorkflowPilotDecisionBriefVerifierHref(verificationRequestJson)
  };
  const sendNoteSubject =
    decision === "expand-with-guardrails" ? `Pilot decision: ${contract.buyer}` : `Pilot decision hold: ${contract.buyer}`;
  const sendNoteBody = [
    `${contract.buyer},`,
    "",
    summary,
    "",
    `Decision: ${decision}`,
    `Ask: ${decisionAsk}`,
    `Value: ${valueLine}`,
    `Risk: ${riskLine}`,
    `Run receipt: ${log.receipt.receiptId} / ${log.receipt.checksumAlgorithm}:${log.receipt.checksum}`,
    `Contract receipt: ${contract.receipt.receiptId} / ${contract.receipt.checksumAlgorithm}:${contract.receipt.checksum}`,
    `Decision receipt: ${receipt.receiptId} / ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    "",
    "Decision actions:",
    ...actions.map((action) => `- [${action.status}] ${action.label}: ${action.action}`),
    "",
    `Next action: ${nextAction}`
  ].join("\n");
  const exportMarkdown = [
    "# Quick workflow pilot decision brief",
    "",
    headlineFor(decision),
    summary,
    `Status: ${status}`,
    `Decision: ${decision}`,
    `Buyer: ${contract.buyer}`,
    `Workflow: ${contract.workflow}`,
    `Decision ask: ${decisionAsk}`,
    `Value: ${valueLine}`,
    `Risk: ${riskLine}`,
    `Run verifier: ${log.receipt.verifierHref}`,
    `Contract verifier: ${contract.receipt.verifierHref}`,
    `Decision receipt: ${receipt.receiptId} / ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `API verification: POST ${QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH}`,
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`,
    "",
    "## Actions",
    ...actions.map((action) => `- [${action.status}] ${action.label} (${action.owner}): ${action.action} Acceptance: ${action.acceptance}`)
  ].join("\n");

  return {
    status,
    decision,
    headline: headlineFor(decision),
    summary,
    buyer: contract.buyer,
    workflow: contract.workflow,
    decisionAsk,
    valueLine,
    riskLine,
    nextOwner,
    nextAction,
    runVerifierHref: log.receipt.verifierHref,
    contractVerifierHref: contract.receipt.verifierHref,
    actions,
    receipt,
    sendNoteSubject,
    sendNoteBody,
    mailtoHref: `mailto:?subject=${encodeURIComponent(sendNoteSubject)}&body=${encodeURIComponent(sendNoteBody)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}
