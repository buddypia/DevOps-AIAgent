export const QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION = "quick-workflow-pilot-decision-brief.v1";
export const QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH = "/api/quick-workflow-pilot-decision-brief/verify";

export type QuickWorkflowPilotDecisionBriefStatus = "ready" | "watch" | "blocked";

export type QuickWorkflowPilotDecisionBriefDecision =
  | "expand-with-guardrails"
  | "revise-evidence"
  | "stop-before-expansion";

export type QuickWorkflowPilotDecisionBriefActionId =
  | "verify-run-receipt"
  | "record-decision"
  | "schedule-value-recheck"
  | "hold-expansion";

export type QuickWorkflowPilotDecisionBriefReceiptPayload = {
  receiptVersion: typeof QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION;
  source: "quick-workflow-pilot-decision-brief";
  status: QuickWorkflowPilotDecisionBriefStatus;
  decision: QuickWorkflowPilotDecisionBriefDecision;
  buyer: string;
  workflow: string;
  decisionAsk: string;
  valueLine: string;
  riskLine: string;
  runReceiptId: string;
  runChecksum: string;
  contractReceiptId: string;
  contractChecksum: string;
  nextOwner: string;
  nextAction: string;
  actions: Array<{
    id: QuickWorkflowPilotDecisionBriefActionId;
    status: QuickWorkflowPilotDecisionBriefStatus;
    owner: string;
    action: string;
    acceptance: string;
  }>;
};

export type QuickWorkflowPilotDecisionBriefVerificationRequest = {
  checksum: string;
  payload: QuickWorkflowPilotDecisionBriefReceiptPayload;
};

export type QuickWorkflowPilotDecisionBriefVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
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

export function quickWorkflowPilotDecisionBriefPayloadJson(payload: QuickWorkflowPilotDecisionBriefReceiptPayload) {
  return canonicalJson(payload);
}

export function quickWorkflowPilotDecisionBriefChecksum(payload: QuickWorkflowPilotDecisionBriefReceiptPayload) {
  return stablePacketHash(quickWorkflowPilotDecisionBriefPayloadJson(payload));
}

export function quickWorkflowPilotDecisionBriefRequestJson(input: QuickWorkflowPilotDecisionBriefVerificationRequest) {
  return canonicalJson(input);
}

export function quickWorkflowPilotDecisionBriefVerifierHref(verificationRequestJson: string) {
  const params = new URLSearchParams({
    request: verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

export function verifyQuickWorkflowPilotDecisionBriefReceipt(
  input: QuickWorkflowPilotDecisionBriefVerificationRequest
): QuickWorkflowPilotDecisionBriefVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickWorkflowPilotDecisionBriefChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Quick workflow pilot decision brief checksum matches the buyer, workflow, source receipts, decision ask, guardrails, next owner, and decision actions."
      : "Quick workflow pilot decision brief checksum does not match the exported decision brief. Re-export the brief before using it for expansion approval."
  };
}
