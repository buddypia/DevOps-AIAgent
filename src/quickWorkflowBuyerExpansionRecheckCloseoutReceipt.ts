import type { QuickWorkflowBuyerExpansionHandoffSignoff } from "./quickWorkflowBuyerExpansionHandoffSignoffReceipt.js";

export const QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_RECEIPT_VERSION = "quick-workflow-buyer-expansion-recheck-closeout.v1";
export const QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH = "/api/quick-workflow-buyer-expansion-recheck-closeout/verify";

export type QuickWorkflowBuyerExpansionRecheckCloseoutStatus = "ready" | "watch" | "blocked";
export type QuickWorkflowBuyerExpansionRecheckCloseoutDecision =
  | "accept-expansion"
  | "repair-before-expansion"
  | "stop-expansion"
  | "hold-closeout";

export type QuickWorkflowBuyerExpansionRecheckCloseoutCheckId =
  | "signoff-verifier"
  | "recheck-scheduled"
  | "actual-value"
  | "floor-decision"
  | "receipt-chain";

export type QuickWorkflowBuyerExpansionRecheckCloseoutCheck = {
  id: QuickWorkflowBuyerExpansionRecheckCloseoutCheckId;
  label: string;
  status: QuickWorkflowBuyerExpansionRecheckCloseoutStatus;
  owner: string;
  matchedSignals: string[];
  missingSignals: string[];
  evidence: string;
  acceptance: string;
};

export type QuickWorkflowBuyerExpansionRecheckCloseoutPayload = {
  receiptVersion: typeof QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_RECEIPT_VERSION;
  source: "quick-workflow-buyer-expansion-recheck-closeout";
  status: QuickWorkflowBuyerExpansionRecheckCloseoutStatus;
  decision: QuickWorkflowBuyerExpansionRecheckCloseoutDecision;
  buyer: string;
  workflow: string;
  sourceSignoffReceiptId: string;
  sourceSignoffChecksum: string;
  sourceHandoffReceiptId: string;
  sourceHandoffChecksum: string;
  scheduledDate: string;
  actualMonthlyValueYen: number;
  valueFloorYen: number;
  readyCheckCount: number;
  checkCount: number;
  nextOwner: string;
  nextAction: string;
  evidenceSummary: string;
  checks: QuickWorkflowBuyerExpansionRecheckCloseoutCheck[];
};

export type QuickWorkflowBuyerExpansionRecheckCloseoutVerificationRequest = {
  checksum: string;
  payload: QuickWorkflowBuyerExpansionRecheckCloseoutPayload;
};

export type QuickWorkflowBuyerExpansionRecheckCloseoutVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickWorkflowBuyerExpansionRecheckCloseout = {
  status: QuickWorkflowBuyerExpansionRecheckCloseoutStatus;
  decision: QuickWorkflowBuyerExpansionRecheckCloseoutDecision;
  headline: string;
  summary: string;
  actualMonthlyValueYen: number;
  valueFloorYen: number;
  readyCheckCount: number;
  checkCount: number;
  nextOwner: string;
  nextAction: string;
  checks: QuickWorkflowBuyerExpansionRecheckCloseoutCheck[];
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    verificationApiPath: typeof QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH;
    payload: QuickWorkflowBuyerExpansionRecheckCloseoutPayload;
    payloadJson: string;
    verificationRequestJson: string;
    verificationRequestHref: string;
    verification: QuickWorkflowBuyerExpansionRecheckCloseoutVerification;
  };
  receiptHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
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

function receiptVerifierPrefillHref(verificationRequestJson: string) {
  const params = new URLSearchParams({
    request: verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

function normalizedEvidenceText(value: string) {
  return value.toLowerCase().replace(/[￥]/g, "¥");
}

function evidenceHasAny(text: string, patterns: Array<string | RegExp>) {
  return patterns.some((pattern) => (typeof pattern === "string" ? text.includes(pattern) : pattern.test(text)));
}

function signalResult(text: string, label: string, patterns: Array<string | RegExp>) {
  return evidenceHasAny(text, patterns) ? label : "";
}

function extractYenAmounts(value: string) {
  const amounts: number[] = [];
  const patterns = [/¥\s*([\d,]+)/g, /([\d,]+)\s*(?:yen|円|jpy)/gi];
  for (const pattern of patterns) {
    let match = pattern.exec(value);
    while (match) {
      const amount = Number((match[1] ?? "").replace(/,/g, ""));
      if (Number.isFinite(amount) && amount > 0) amounts.push(amount);
      match = pattern.exec(value);
    }
  }
  return amounts;
}

function extractActualMonthlyValueYen(value: string) {
  const patterns = [
    /actual retained monthly value\s*[:：]?\s*¥\s*([\d,]+)/i,
    /actual value\s*(?:is|:|：)?\s*¥\s*([\d,]+)/i,
    /recorded actual value\s*¥\s*([\d,]+)/i
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    const amount = Number((match?.[1] ?? "").replace(/,/g, ""));
    if (Number.isFinite(amount) && amount > 0) return amount;
  }
  return 0;
}

function extractValueFloorYen(value: string) {
  const amounts = extractYenAmounts(value);
  return amounts.at(-1) ?? 0;
}

function closeoutDecisionFromEvidence(text: string) {
  if (evidenceHasAny(text, [/decision recorded\s*:\s*expand/i, /decision\s*:\s*expand/i, "expand decision", "approved expansion"])) return "expand";
  if (evidenceHasAny(text, [/decision recorded\s*:\s*revise/i, /decision\s*:\s*revise/i, "repair before expansion", "revise decision"])) return "revise";
  if (evidenceHasAny(text, [/decision recorded\s*:\s*stop/i, /decision\s*:\s*stop/i, "stop decision", "stopped expansion"])) return "stop";
  return "missing";
}

function checkStatus(sourceReady: boolean, matchedSignals: string[], requiredCount: number): QuickWorkflowBuyerExpansionRecheckCloseoutStatus {
  if (!sourceReady) return "blocked";
  if (matchedSignals.length >= requiredCount) return "ready";
  return matchedSignals.length > 0 ? "watch" : "blocked";
}

function formatYen(value: number) {
  return `¥${Math.max(0, Math.round(value)).toLocaleString("ja-JP")}`;
}

function evidenceSummaryFor(rawEvidence: string) {
  const summary = rawEvidence
    ? rawEvidence
        .split(/\s+/)
        .slice(0, 48)
        .join(" ")
    : "No retained-value recheck evidence pasted.";
  return summary.length > 1800 ? `${summary.slice(0, 1797)}...` : summary;
}

export function quickWorkflowBuyerExpansionRecheckCloseoutPayloadJson(payload: QuickWorkflowBuyerExpansionRecheckCloseoutPayload) {
  return canonicalJson(payload);
}

export function quickWorkflowBuyerExpansionRecheckCloseoutChecksum(payload: QuickWorkflowBuyerExpansionRecheckCloseoutPayload) {
  return stablePacketHash(quickWorkflowBuyerExpansionRecheckCloseoutPayloadJson(payload));
}

export function quickWorkflowBuyerExpansionRecheckCloseoutRequestJson(input: QuickWorkflowBuyerExpansionRecheckCloseoutVerificationRequest) {
  return canonicalJson(input);
}

export function verifyQuickWorkflowBuyerExpansionRecheckCloseoutReceipt(
  input: QuickWorkflowBuyerExpansionRecheckCloseoutVerificationRequest
): QuickWorkflowBuyerExpansionRecheckCloseoutVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickWorkflowBuyerExpansionRecheckCloseoutChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Quick workflow buyer expansion recheck closeout checksum matches the source signoff, measured retained value, floor decision, receipt-chain evidence, and next action."
      : "Quick workflow buyer expansion recheck closeout checksum does not match the exported recheck evidence. Re-export before accepting the closeout."
  };
}

export function buildQuickWorkflowBuyerExpansionRecheckCloseout(input: {
  signoff: QuickWorkflowBuyerExpansionHandoffSignoff;
  evidenceText: string;
}): QuickWorkflowBuyerExpansionRecheckCloseout {
  const rawEvidence = input.evidenceText.trim();
  const text = normalizedEvidenceText(rawEvidence);
  const sourceReady = input.signoff.status === "ready" && input.signoff.decision === "approve-next-window";
  const template = input.signoff.operatingPacket.recheckCloseout;
  const scheduledDate = template.scheduledDate;
  const actualMonthlyValueYen = extractActualMonthlyValueYen(rawEvidence);
  const valueFloorYen = extractValueFloorYen(template.valueFloorEvidence);
  const evidenceSummary = evidenceSummaryFor(rawEvidence);
  const evidenceDecision = closeoutDecisionFromEvidence(text);
  const valueClearsFloor = actualMonthlyValueYen > 0 && valueFloorYen > 0 && actualMonthlyValueYen >= valueFloorYen;
  const belowFloorHandled = actualMonthlyValueYen > 0 && valueFloorYen > 0 && actualMonthlyValueYen < valueFloorYen && ["revise", "stop"].includes(evidenceDecision);
  const floorDecisionAligned = valueClearsFloor ? evidenceDecision === "expand" : belowFloorHandled;
  const sourceSignoffChecksum = `${input.signoff.checksumAlgorithm}:${input.signoff.checksum}`;
  const signoffSignals = [
    sourceReady ? "source signoff approved" : "",
    signalResult(text, "signoff verifier named", ["signoff verifier", input.signoff.receiptId.toLowerCase()]),
    signalResult(text, "verifier result attached", ["verified", "http 200", "verifier"])
  ].filter(Boolean);
  const scheduleSignals = [
    scheduledDate && text.includes(scheduledDate.toLowerCase()) ? "scheduled date matched" : "",
    signalResult(text, "retained-value recheck scheduled", ["retained-value recheck scheduled", "value recheck scheduled", "calendar"])
  ].filter(Boolean);
  const valueSignals = [
    actualMonthlyValueYen > 0 ? "actual retained monthly value recorded" : "",
    valueFloorYen > 0 ? "value floor parsed from signoff proof" : "",
    signalResult(text, "finance or retained value stated", ["finance", "retained value", "actual retained"])
  ].filter(Boolean);
  const floorSignals = [
    floorDecisionAligned ? "floor decision aligned" : "",
    valueClearsFloor ? "value clears floor" : belowFloorHandled ? "below floor routed to repair or stop" : "",
    evidenceDecision !== "missing" ? `${evidenceDecision} decision recorded` : ""
  ].filter(Boolean);
  const receiptChainSignals = [
    signalResult(text, "receipt chain reopened", ["receipt chain reopened", "receipt chain", "reopened"]),
    signalResult(text, "source handoff attached", [template.sourceHandoffReceiptId.toLowerCase(), "source handoff"]),
    signalResult(text, "source signoff attached", [input.signoff.receiptId.toLowerCase(), "signoff receipt"])
  ].filter(Boolean);
  const checks: QuickWorkflowBuyerExpansionRecheckCloseoutCheck[] = [
    {
      id: "signoff-verifier",
      label: "Signoff verifier checked",
      status: checkStatus(sourceReady, signoffSignals, 3),
      owner: "Procurement owner",
      matchedSignals: signoffSignals,
      missingSignals: ["source signoff approved", "signoff verifier named", "verifier result attached"].filter((signal) => !signoffSignals.includes(signal)),
      evidence: evidenceSummary,
      acceptance: "Source procurement signoff is approved and verifier output is attached."
    },
    {
      id: "recheck-scheduled",
      label: "Recheck schedule matched",
      status: checkStatus(sourceReady, scheduleSignals, 2),
      owner: "Finance owner",
      matchedSignals: scheduleSignals,
      missingSignals: ["scheduled date matched", "retained-value recheck scheduled"].filter((signal) => !scheduleSignals.includes(signal)),
      evidence: scheduledDate,
      acceptance: "Evidence names the scheduled recheck date and calendar or scheduling proof."
    },
    {
      id: "actual-value",
      label: "Actual value recorded",
      status: checkStatus(sourceReady, valueSignals, 3),
      owner: "Finance owner",
      matchedSignals: valueSignals,
      missingSignals: ["actual retained monthly value recorded", "value floor parsed from signoff proof", "finance or retained value stated"].filter((signal) => !valueSignals.includes(signal)),
      evidence: actualMonthlyValueYen > 0 ? `${formatYen(actualMonthlyValueYen)}/month against ${formatYen(valueFloorYen)}/month floor` : "Actual retained monthly value is missing.",
      acceptance: "Actual retained monthly value and the source floor are both present."
    },
    {
      id: "floor-decision",
      label: "Floor decision aligned",
      status: checkStatus(sourceReady, floorSignals, 3),
      owner: "Pilot sponsor",
      matchedSignals: floorSignals,
      missingSignals: ["floor decision aligned", valueClearsFloor ? "value clears floor" : "below floor routed to repair or stop", "expand/revise/stop decision recorded"].filter(
        (signal) => {
          if (signal === "expand/revise/stop decision recorded") return evidenceDecision === "missing";
          return !floorSignals.includes(signal);
        }
      ),
      evidence: valueClearsFloor ? "Value clears the floor and expansion is recorded." : "Below-floor evidence must route to repair or stop.",
      acceptance: "Expand only when value clears the floor; otherwise revise or stop is recorded."
    },
    {
      id: "receipt-chain",
      label: "Receipt chain reopened",
      status: checkStatus(sourceReady, receiptChainSignals, 3),
      owner: "Proof owner",
      matchedSignals: receiptChainSignals,
      missingSignals: ["receipt chain reopened", "source handoff attached", "source signoff attached"].filter((signal) => !receiptChainSignals.includes(signal)),
      evidence: `${template.sourceHandoffReceiptId} / ${input.signoff.receiptId}`,
      acceptance: "Handoff and signoff receipts are attached to the recheck closeout record."
    }
  ];
  const readyCheckCount = checks.filter((check) => check.status === "ready").length;
  const checkCount = checks.length;
  const status: QuickWorkflowBuyerExpansionRecheckCloseoutStatus = !sourceReady ? "blocked" : readyCheckCount === checkCount ? "ready" : rawEvidence ? "watch" : "blocked";
  const decision: QuickWorkflowBuyerExpansionRecheckCloseoutDecision =
    status !== "ready"
      ? "hold-closeout"
      : valueClearsFloor
        ? "accept-expansion"
        : evidenceDecision === "stop"
          ? "stop-expansion"
          : "repair-before-expansion";
  const firstOpenCheck = checks.find((check) => check.status !== "ready");
  const nextOwner = status === "ready" ? "Ready" : (firstOpenCheck?.owner ?? template.nextOwner);
  const nextAction =
    status === "ready"
      ? decision === "accept-expansion"
        ? "Attach this recheck closeout receipt and continue the approved expansion window."
        : decision === "stop-expansion"
          ? "Attach this recheck closeout receipt and stop wider rollout until a new buyer decision is recorded."
          : "Attach this recheck closeout receipt and open a repair run before expansion continues."
      : !sourceReady
        ? "Approve and verify procurement signoff before accepting recheck closeout evidence."
        : `Close ${firstOpenCheck?.label ?? "recheck closeout"} evidence: ${firstOpenCheck?.missingSignals.join(", ") || "missing signal"}.`;
  const payload: QuickWorkflowBuyerExpansionRecheckCloseoutPayload = {
    receiptVersion: QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_RECEIPT_VERSION,
    source: "quick-workflow-buyer-expansion-recheck-closeout",
    status,
    decision,
    buyer: input.signoff.buyer,
    workflow: input.signoff.workflow,
    sourceSignoffReceiptId: input.signoff.receiptId,
    sourceSignoffChecksum,
    sourceHandoffReceiptId: template.sourceHandoffReceiptId,
    sourceHandoffChecksum: template.sourceHandoffChecksum,
    scheduledDate,
    actualMonthlyValueYen,
    valueFloorYen,
    readyCheckCount,
    checkCount,
    nextOwner,
    nextAction,
    evidenceSummary,
    checks
  };
  const checksum = quickWorkflowBuyerExpansionRecheckCloseoutChecksum(payload);
  const verificationRequest = { checksum, payload };
  const verificationRequestJson = quickWorkflowBuyerExpansionRecheckCloseoutRequestJson(verificationRequest);
  const verification = verifyQuickWorkflowBuyerExpansionRecheckCloseoutReceipt(verificationRequest);
  const receipt = {
    receiptId: `quick-buyer-expansion-recheck-closeout-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    verificationApiPath: QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH as typeof QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH,
    payload,
    payloadJson: quickWorkflowBuyerExpansionRecheckCloseoutPayloadJson(payload),
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };
  const headline =
    status === "ready"
      ? decision === "accept-expansion"
        ? "Recheck closeout accepts expansion"
        : decision === "stop-expansion"
          ? "Recheck closeout stops rollout"
          : "Recheck closeout opens repair"
      : status === "watch"
        ? "Recheck closeout needs evidence"
        : "Recheck closeout is blocked";
  const summary =
    status === "ready"
      ? `${formatYen(actualMonthlyValueYen)}/month is recorded against a ${formatYen(valueFloorYen)}/month floor with ${decision} preserved.`
      : `${readyCheckCount}/${checkCount} closeout checks are ready. ${nextOwner}: ${nextAction}`;
  const exportMarkdown = [
    "# Buyer expansion recheck closeout",
    "",
    `Status: ${status}`,
    `Decision: ${decision}`,
    `Buyer: ${payload.buyer}`,
    `Scheduled date: ${scheduledDate}`,
    `Actual retained value: ${formatYen(actualMonthlyValueYen)}/month`,
    `Value floor: ${formatYen(valueFloorYen)}/month`,
    `Source signoff: ${payload.sourceSignoffReceiptId} / ${payload.sourceSignoffChecksum}`,
    `Source handoff: ${payload.sourceHandoffReceiptId} / ${payload.sourceHandoffChecksum}`,
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `API verification: POST ${receipt.verificationApiPath}`,
    "",
    "## Evidence summary",
    evidenceSummary,
    "",
    "## Next action",
    `${nextOwner}: ${nextAction}`,
    "",
    "## Checks",
    ...checks.map((check) => `- [${check.status}] ${check.label} (${check.owner}): matched ${check.matchedSignals.join(", ") || "none"}; missing ${check.missingSignals.join(", ") || "none"}`),
    "",
    "## Verify request",
    "```json",
    receipt.verificationRequestJson,
    "```"
  ].join("\n");

  return {
    status,
    decision,
    headline,
    summary,
    actualMonthlyValueYen,
    valueFloorYen,
    readyCheckCount,
    checkCount,
    nextOwner,
    nextAction,
    checks,
    receipt,
    receiptHref: receipt.verificationRequestHref,
    verifierHref: receiptVerifierPrefillHref(receipt.verificationRequestJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}
