import type { QuickWorkflowPilotDecisionBrief } from "./quickWorkflowPilotDecisionBrief";
import type { QuickWorkflowPilotRunLog } from "./quickWorkflowPilotRunLog";
import {
  QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION,
  QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH,
  quickWorkflowPilotExpansionGuardrailChecksum,
  quickWorkflowPilotExpansionGuardrailPayloadJson,
  quickWorkflowPilotExpansionGuardrailRequestJson,
  quickWorkflowPilotExpansionGuardrailVerifierHref,
  type QuickWorkflowPilotExpansionGuardrailCheckId,
  type QuickWorkflowPilotExpansionGuardrailDecision,
  type QuickWorkflowPilotExpansionGuardrailReceiptPayload,
  type QuickWorkflowPilotExpansionGuardrailStatus
} from "./quickWorkflowPilotExpansionGuardrailReceipt";
import type { QuickWorkflowValueAcceptanceContract } from "./quickWorkflowValueAcceptanceContract";

type ExpansionGuardrailStatus = QuickWorkflowPilotExpansionGuardrailStatus;
export type { QuickWorkflowPilotExpansionGuardrailDecision };

export type QuickWorkflowPilotExpansionGuardrailCheck = {
  id: QuickWorkflowPilotExpansionGuardrailCheckId;
  label: string;
  status: ExpansionGuardrailStatus;
  owner: string;
  evidence: string;
  action: string;
};

export type QuickWorkflowPilotExpansionRecheckEvidenceInput = {
  measuredMonthlyValueYen: number;
  ownerName: string;
  ownerDecision: "approved" | "hold" | "not-recorded";
  receiptChainAttached: boolean;
  nextWindow: string;
  note: string;
  decisionBriefReceiptId?: string;
};

export type QuickWorkflowPilotExpansionValueRuler = {
  status: ExpansionGuardrailStatus;
  label: string;
  detail: string;
  maxValueYen: number;
  measuredPositionPercent: number;
  stopPositionPercent: number;
  floorPositionPercent: number;
};

export type QuickWorkflowPilotExpansionGuardrail = {
  status: ExpansionGuardrailStatus;
  decision: QuickWorkflowPilotExpansionGuardrailDecision;
  headline: string;
  summary: string;
  buyer: string;
  workflow: string;
  measuredMonthlyValueYen: number;
  valueFloorYen: number;
  stopLossYen: number;
  valueDeltaYen: number;
  valueRuler: QuickWorkflowPilotExpansionValueRuler;
  nextOwner: string;
  nextAction: string;
  evidenceText: string;
  checks: QuickWorkflowPilotExpansionGuardrailCheck[];
  sendNoteSubject: string;
  sendNoteBody: string;
  mailtoHref: string;
  checkCsvText: string;
  checkCsvHref: string;
  receipt: {
    receiptId: string;
    receiptVersion: typeof QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    verificationApiPath: typeof QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH;
    payloadJson: string;
    payloadHref: string;
    verificationRequestJson: string;
    verificationRequestHref: string;
    verifierHref: string;
  };
  exportMarkdown: string;
  exportHref: string;
};

function formatYen(value: number) {
  return `¥${Math.max(0, Math.round(value)).toLocaleString("ja-JP")}`;
}

function compactLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function trimText(value: string, fallback = "") {
  return value.replace(/\s+/g, " ").trim() || fallback;
}

function yenValue(value: string) {
  return Number(value.replace(/,/g, ""));
}

function extractMeasuredMonthlyValueYen(evidenceText: string) {
  const text = compactLine(evidenceText);
  const labelledPatterns = [
    /(?:actual|realized|accepted|measured|recheck|monthly value|value trend)[^¥]{0,90}¥\s?([\d,]+)/i,
    /¥\s?([\d,]+)[^.\n]{0,90}(?:actual|realized|accepted|measured|monthly|recheck)/i
  ];
  for (const pattern of labelledPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) return yenValue(match[1]);
  }
  const values = [...text.matchAll(/¥\s?([\d,]+)/g)].map((match) => yenValue(match[1] ?? "0")).filter((value) => value > 0);
  return values.length ? Math.max(...values) : 0;
}

function hasOwnerAcceptance(evidenceText: string) {
  return (
    /(finance|procurement|sponsor|buyer owner|buyer reviewer)[^.]{0,80}(accepted|approved|confirmed|recorded|signed)/i.test(evidenceText) ||
    /(accepted|approved|confirmed|recorded|signed)[^.]{0,80}(finance|procurement|sponsor|buyer owner|buyer reviewer)/i.test(evidenceText)
  );
}

function hasReceiptChain(evidenceText: string, brief: QuickWorkflowPilotDecisionBrief) {
  return (
    evidenceText.includes(brief.receipt.receiptId) ||
    /decision receipt/i.test(evidenceText) ||
    (/verif(?:y|ied|ier)/i.test(evidenceText) && /(run receipt|contract receipt|brief receipt)/i.test(evidenceText))
  );
}

function hasNextWindowScope(evidenceText: string) {
  return /(next window|next operating window|30[- ]?day|value recheck|expansion window|rollout|renewal)/i.test(evidenceText);
}

function checkCsv(checks: QuickWorkflowPilotExpansionGuardrailCheck[]) {
  return [
    ["check", "status", "owner", "evidence", "action"].map(csvCell).join(","),
    ...checks.map((check) => [check.label, check.status, check.owner, check.evidence, check.action].map(csvCell).join(","))
  ].join("\n");
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function valueRulerFor(input: {
  measuredMonthlyValueYen: number;
  valueFloorYen: number;
  stopLossYen: number;
}): QuickWorkflowPilotExpansionValueRuler {
  const { measuredMonthlyValueYen, valueFloorYen, stopLossYen } = input;
  const maxValueYen = Math.max(valueFloorYen * 1.25, stopLossYen * 1.4, measuredMonthlyValueYen * 1.1, 1);
  const measuredPositionPercent = clampPercent((measuredMonthlyValueYen / maxValueYen) * 100);
  const stopPositionPercent = clampPercent((stopLossYen / maxValueYen) * 100);
  const floorPositionPercent = clampPercent((valueFloorYen / maxValueYen) * 100);
  if (measuredMonthlyValueYen <= 0) {
    return {
      status: "watch",
      label: "Awaiting value recheck",
      detail: `Record actual monthly value to compare against ${formatYen(stopLossYen)} stop and ${formatYen(valueFloorYen)} floor.`,
      maxValueYen,
      measuredPositionPercent,
      stopPositionPercent,
      floorPositionPercent
    };
  }
  if (measuredMonthlyValueYen < stopLossYen) {
    return {
      status: "blocked",
      label: "Below stop rule",
      detail: `${formatYen(measuredMonthlyValueYen)}/month is below the ${formatYen(stopLossYen)}/month stop rule.`,
      maxValueYen,
      measuredPositionPercent,
      stopPositionPercent,
      floorPositionPercent
    };
  }
  if (measuredMonthlyValueYen < valueFloorYen) {
    return {
      status: "watch",
      label: "Between stop and floor",
      detail: `${formatYen(measuredMonthlyValueYen)}/month is safe to continue, but not enough to expand.`,
      maxValueYen,
      measuredPositionPercent,
      stopPositionPercent,
      floorPositionPercent
    };
  }
  return {
    status: "ready",
    label: "Clears expansion floor",
    detail: `${formatYen(measuredMonthlyValueYen)}/month clears the ${formatYen(valueFloorYen)}/month accepted floor.`,
    maxValueYen,
    measuredPositionPercent,
    stopPositionPercent,
    floorPositionPercent
  };
}

export function buildQuickWorkflowPilotExpansionRecheckEvidence(input: QuickWorkflowPilotExpansionRecheckEvidenceInput) {
  const lines: string[] = [];
  const measuredValue = Math.max(0, Math.round(input.measuredMonthlyValueYen));
  if (measuredValue > 0) {
    lines.push(`30-day value recheck recorded actual value ${formatYen(measuredValue)}/month.`);
  }

  const ownerName = trimText(input.ownerName, "Finance owner");
  if (input.ownerDecision === "approved") {
    lines.push(`${ownerName} approved expansion and procurement recorded acceptance.`);
  } else if (input.ownerDecision === "hold") {
    lines.push(`${ownerName} recorded hold before expansion.`);
  }

  if (input.receiptChainAttached) {
    const decisionReceipt = trimText(input.decisionBriefReceiptId ?? "", "decision receipt");
    lines.push(`Decision receipt ${decisionReceipt} and verifier results attached with run receipt and contract receipt.`);
  }

  const nextWindow = trimText(input.nextWindow);
  if (nextWindow) {
    lines.push(`Next operating window scoped: ${nextWindow}.`);
  }

  const note = trimText(input.note);
  if (note) lines.push(note);
  return lines.join(" ");
}

function buildChecks(input: {
  brief: QuickWorkflowPilotDecisionBrief;
  contract: QuickWorkflowValueAcceptanceContract;
  measuredMonthlyValueYen: number;
  evidenceText: string;
}): QuickWorkflowPilotExpansionGuardrailCheck[] {
  const { brief, contract, measuredMonthlyValueYen, evidenceText } = input;
  const valueMissing = measuredMonthlyValueYen <= 0;
  const stopRuleBroken = !valueMissing && measuredMonthlyValueYen < contract.stopLossYen;
  const valueFloorMet = !valueMissing && measuredMonthlyValueYen >= contract.valueFloorYen;
  const ownerAccepted = hasOwnerAcceptance(evidenceText);
  const receiptChainAttached = hasReceiptChain(evidenceText, brief);
  const nextWindowScoped = hasNextWindowScope(evidenceText);

  return [
    {
      id: "decision-brief-verified",
      label: "Decision brief verified",
      status: brief.status,
      owner: "Buyer reviewer",
      evidence: `${brief.receipt.receiptId} / ${brief.receipt.checksumAlgorithm}:${brief.receipt.checksum}`,
      action:
        brief.status === "ready"
          ? "Attach the verified decision brief to the expansion record."
          : "Repair the decision brief before using it for expansion."
    },
    {
      id: "value-floor-met",
      label: "Value floor met",
      status: valueMissing ? "watch" : valueFloorMet ? "ready" : stopRuleBroken ? "blocked" : "watch",
      owner: "Finance owner",
      evidence: valueMissing
        ? "No measured monthly value found in the recheck evidence."
        : `${formatYen(measuredMonthlyValueYen)}/month measured against ${formatYen(contract.valueFloorYen)}/month floor.`,
      action: valueFloorMet
        ? "Record this as the accepted expansion value."
        : `Do not expand until the recheck reaches ${formatYen(contract.valueFloorYen)}/month.`
    },
    {
      id: "stop-rule-safe",
      label: "Stop rule safe",
      status: valueMissing ? "watch" : stopRuleBroken ? "blocked" : "ready",
      owner: "Finance owner",
      evidence: valueMissing
        ? `Stop rule is ${formatYen(contract.stopLossYen)}/month, but no measured value is recorded.`
        : `${formatYen(measuredMonthlyValueYen)}/month measured against ${formatYen(contract.stopLossYen)}/month stop rule.`,
      action: stopRuleBroken
        ? "Stop expansion and convert the next sprint into repair work."
        : "Keep the stop rule attached to the next agreement."
    },
    {
      id: "owner-acceptance-recorded",
      label: "Owner acceptance recorded",
      status: ownerAccepted ? "ready" : evidenceText ? "watch" : "watch",
      owner: "Procurement owner",
      evidence: ownerAccepted ? "Owner approval or acceptance is present in the recheck evidence." : "No finance, procurement, sponsor, or buyer owner acceptance found yet.",
      action: ownerAccepted ? "Attach the owner decision to the expansion record." : "Record the named owner and approval before expansion starts."
    },
    {
      id: "receipt-chain-attached",
      label: "Receipt chain attached",
      status: receiptChainAttached ? "ready" : evidenceText ? "watch" : "watch",
      owner: "Proof owner",
      evidence: receiptChainAttached ? "Decision or verifier receipt reference is present." : "No decision receipt or verifier result is attached in the recheck evidence.",
      action: receiptChainAttached ? "Keep the receipt chain with the expansion approval." : "Attach decision, run, and contract verifier results."
    },
    {
      id: "next-window-scoped",
      label: "Next window scoped",
      status: nextWindowScoped ? "ready" : evidenceText ? "watch" : "watch",
      owner: "Pilot sponsor",
      evidence: nextWindowScoped ? "The next operating window or 30-day recheck is named." : "The expansion window is not named yet.",
      action: nextWindowScoped ? "Schedule the next value recheck before renewal." : "Name the expansion window and value recheck date."
    }
  ];
}

function decisionFor(checks: QuickWorkflowPilotExpansionGuardrailCheck[]): QuickWorkflowPilotExpansionGuardrailDecision {
  if (checks.some((check) => check.status === "blocked")) return "stop-expansion";
  if (checks.every((check) => check.status === "ready")) return "expand-next-window";
  return "repair-before-expansion";
}

function headlineFor(decision: QuickWorkflowPilotExpansionGuardrailDecision) {
  if (decision === "expand-next-window") return "Expansion can move with guardrails";
  if (decision === "stop-expansion") return "Stop expansion and repair value";
  return "Repair the expansion packet before approval";
}

export function buildQuickWorkflowPilotExpansionGuardrail(input: {
  brief: QuickWorkflowPilotDecisionBrief;
  log: QuickWorkflowPilotRunLog;
  contract: QuickWorkflowValueAcceptanceContract;
  recheckEvidenceText: string;
}): QuickWorkflowPilotExpansionGuardrail {
  const { brief, log, contract } = input;
  const evidenceText = compactLine(input.recheckEvidenceText);
  const measuredMonthlyValueYen = extractMeasuredMonthlyValueYen(evidenceText);
  const checks = buildChecks({ brief, contract, measuredMonthlyValueYen, evidenceText });
  const decision = decisionFor(checks);
  const status: ExpansionGuardrailStatus = decision === "expand-next-window" ? "ready" : decision === "stop-expansion" ? "blocked" : "watch";
  const firstOpenCheck = checks.find((check) => check.status !== "ready");
  const nextOwner = firstOpenCheck?.owner ?? "Procurement owner";
  const nextAction =
    decision === "expand-next-window"
      ? "Approve the next operating window with the receipt chain and value recheck attached."
      : firstOpenCheck?.action ?? "Repair the expansion packet before approval.";
  const valueDeltaYen = measuredMonthlyValueYen - contract.valueFloorYen;
  const valueRuler = valueRulerFor({
    measuredMonthlyValueYen,
    valueFloorYen: contract.valueFloorYen,
    stopLossYen: contract.stopLossYen
  });
  const summary =
    decision === "expand-next-window"
      ? `${formatYen(measuredMonthlyValueYen)}/month clears the accepted floor and keeps the stop rule attached.`
      : decision === "stop-expansion"
        ? `${formatYen(measuredMonthlyValueYen)}/month breaks a hard guardrail, so expansion should stop.`
        : "The expansion packet is useful, but it still needs measured value, receipt chain, owner acceptance, or next-window scope.";
  const checkCsvText = checkCsv(checks);
  const payload: QuickWorkflowPilotExpansionGuardrailReceiptPayload = {
    receiptVersion: QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION,
    source: "quick-workflow-pilot-expansion-guardrail",
    status,
    decision,
    buyer: contract.buyer,
    workflow: contract.workflow,
    measuredMonthlyValueYen,
    valueFloorYen: contract.valueFloorYen,
    stopLossYen: contract.stopLossYen,
    decisionBriefReceiptId: brief.receipt.receiptId,
    decisionBriefChecksum: `${brief.receipt.checksumAlgorithm}:${brief.receipt.checksum}`,
    runReceiptId: log.receipt.receiptId,
    runChecksum: `${log.receipt.checksumAlgorithm}:${log.receipt.checksum}`,
    contractReceiptId: contract.receipt.receiptId,
    contractChecksum: `${contract.receipt.checksumAlgorithm}:${contract.receipt.checksum}`,
    nextOwner,
    nextAction,
    evidenceExcerpt: evidenceText.slice(0, 600),
    checks: checks.map((check) => ({
      id: check.id,
      status: check.status,
      owner: check.owner,
      evidence: check.evidence,
      action: check.action
    }))
  };
  const payloadJson = quickWorkflowPilotExpansionGuardrailPayloadJson(payload);
  const checksum = quickWorkflowPilotExpansionGuardrailChecksum(payload);
  const verificationRequestJson = quickWorkflowPilotExpansionGuardrailRequestJson({ checksum, payload });
  const receipt: QuickWorkflowPilotExpansionGuardrail["receipt"] = {
    receiptId: `quick-pilot-expansion-guardrail-${status}-${checksum}`,
    receiptVersion: QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    verificationApiPath: QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verifierHref: quickWorkflowPilotExpansionGuardrailVerifierHref(verificationRequestJson)
  };
  const sendNoteSubject =
    decision === "expand-next-window" ? `Expansion guardrail: ${contract.buyer}` : `Expansion hold: ${contract.buyer}`;
  const sendNoteBody = [
    `${contract.buyer},`,
    "",
    summary,
    "",
    `Decision: ${decision}`,
    `Measured value: ${measuredMonthlyValueYen > 0 ? `${formatYen(measuredMonthlyValueYen)}/month` : "not recorded"}`,
    `Value floor: ${formatYen(contract.valueFloorYen)}/month`,
    `Stop rule: ${formatYen(contract.stopLossYen)}/month`,
    `Value band: ${valueRuler.label} - ${valueRuler.detail}`,
    `Decision receipt: ${brief.receipt.receiptId} / ${brief.receipt.checksumAlgorithm}:${brief.receipt.checksum}`,
    `Expansion receipt: ${receipt.receiptId} / ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    "",
    "Guardrail checks:",
    ...checks.map((check) => `- [${check.status}] ${check.label}: ${check.action}`),
    "",
    `Next action: ${nextAction}`
  ].join("\n");
  const exportMarkdown = [
    "# Quick workflow pilot expansion guardrail",
    "",
    headlineFor(decision),
    summary,
    `Status: ${status}`,
    `Decision: ${decision}`,
    `Buyer: ${contract.buyer}`,
    `Workflow: ${contract.workflow}`,
    `Measured value: ${measuredMonthlyValueYen > 0 ? `${formatYen(measuredMonthlyValueYen)}/month` : "not recorded"}`,
    `Value floor: ${formatYen(contract.valueFloorYen)}/month`,
    `Stop rule: ${formatYen(contract.stopLossYen)}/month`,
    `Value band: ${valueRuler.label} - ${valueRuler.detail}`,
    `Decision receipt: ${brief.receipt.receiptId} / ${brief.receipt.checksumAlgorithm}:${brief.receipt.checksum}`,
    `Run receipt: ${log.receipt.receiptId} / ${log.receipt.checksumAlgorithm}:${log.receipt.checksum}`,
    `Contract receipt: ${contract.receipt.receiptId} / ${contract.receipt.checksumAlgorithm}:${contract.receipt.checksum}`,
    `Expansion receipt: ${receipt.receiptId} / ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `API verification: POST ${QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH}`,
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`,
    "",
    "## Guardrail checks",
    ...checks.map((check) => `- [${check.status}] ${check.label} (${check.owner}): ${check.evidence} Action: ${check.action}`),
    "",
    "## CSV",
    "```csv",
    checkCsvText,
    "```"
  ].join("\n");

  return {
    status,
    decision,
    headline: headlineFor(decision),
    summary,
    buyer: contract.buyer,
    workflow: contract.workflow,
    measuredMonthlyValueYen,
    valueFloorYen: contract.valueFloorYen,
    stopLossYen: contract.stopLossYen,
    valueDeltaYen,
    valueRuler,
    nextOwner,
    nextAction,
    evidenceText,
    checks,
    sendNoteSubject,
    sendNoteBody,
    mailtoHref: `mailto:?subject=${encodeURIComponent(sendNoteSubject)}&body=${encodeURIComponent(sendNoteBody)}`,
    checkCsvText,
    checkCsvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(checkCsvText)}`,
    receipt,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}
