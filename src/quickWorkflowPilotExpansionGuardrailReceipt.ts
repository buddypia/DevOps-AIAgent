export const QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION = "quick-workflow-pilot-expansion-guardrail.v1";
export const QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH = "/api/quick-workflow-pilot-expansion-guardrail/verify";

export type QuickWorkflowPilotExpansionGuardrailStatus = "ready" | "watch" | "blocked";

export type QuickWorkflowPilotExpansionGuardrailDecision =
  | "expand-next-window"
  | "repair-before-expansion"
  | "stop-expansion";

export type QuickWorkflowPilotExpansionGuardrailCheckId =
  | "decision-brief-verified"
  | "value-floor-met"
  | "stop-rule-safe"
  | "owner-acceptance-recorded"
  | "receipt-chain-attached"
  | "next-window-scoped";

export type QuickWorkflowPilotExpansionGuardrailReceiptPayload = {
  receiptVersion: typeof QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION;
  source: "quick-workflow-pilot-expansion-guardrail";
  status: QuickWorkflowPilotExpansionGuardrailStatus;
  decision: QuickWorkflowPilotExpansionGuardrailDecision;
  buyer: string;
  workflow: string;
  measuredMonthlyValueYen: number;
  valueFloorYen: number;
  stopLossYen: number;
  decisionBriefReceiptId: string;
  decisionBriefChecksum: string;
  runReceiptId: string;
  runChecksum: string;
  contractReceiptId: string;
  contractChecksum: string;
  nextOwner: string;
  nextAction: string;
  evidenceExcerpt: string;
  checks: Array<{
    id: QuickWorkflowPilotExpansionGuardrailCheckId;
    status: QuickWorkflowPilotExpansionGuardrailStatus;
    owner: string;
    evidence: string;
    action: string;
  }>;
};

export type QuickWorkflowPilotExpansionGuardrailVerificationRequest = {
  checksum: string;
  payload: QuickWorkflowPilotExpansionGuardrailReceiptPayload;
};

export type QuickWorkflowPilotExpansionGuardrailVerification = {
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

export function quickWorkflowPilotExpansionGuardrailPayloadJson(payload: QuickWorkflowPilotExpansionGuardrailReceiptPayload) {
  return canonicalJson(payload);
}

export function quickWorkflowPilotExpansionGuardrailChecksum(payload: QuickWorkflowPilotExpansionGuardrailReceiptPayload) {
  return stablePacketHash(quickWorkflowPilotExpansionGuardrailPayloadJson(payload));
}

export function quickWorkflowPilotExpansionGuardrailRequestJson(input: QuickWorkflowPilotExpansionGuardrailVerificationRequest) {
  return canonicalJson(input);
}

export function quickWorkflowPilotExpansionGuardrailVerifierHref(verificationRequestJson: string) {
  const params = new URLSearchParams({
    request: verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

export function verifyQuickWorkflowPilotExpansionGuardrailReceipt(
  input: QuickWorkflowPilotExpansionGuardrailVerificationRequest
): QuickWorkflowPilotExpansionGuardrailVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickWorkflowPilotExpansionGuardrailChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Quick workflow pilot expansion guardrail checksum matches the source decision, run and contract receipts, measured value, stop rule, owner acceptance, and next-window scope."
      : "Quick workflow pilot expansion guardrail checksum does not match the exported expansion ledger. Re-export the ledger before authorizing expansion."
  };
}
