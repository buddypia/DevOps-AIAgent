export const QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION = "quick-workflow-buyer-expansion-handoff.v1";
export const QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH = "/api/quick-workflow-buyer-expansion-handoff/verify";

export type QuickWorkflowBuyerExpansionHandoffStatus = "ready" | "watch" | "blocked";

export type QuickWorkflowBuyerExpansionHandoffReceiptTaskId =
  | "attach-one-pager"
  | "verify-receipt-chain"
  | "procurement-signoff"
  | "value-recheck-window";

export type QuickWorkflowBuyerExpansionHandoffReceiptPayload = {
  receiptVersion: typeof QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION;
  source: "quick-workflow-buyer-expansion-handoff";
  status: QuickWorkflowBuyerExpansionHandoffStatus;
  buyer: string;
  workflow: string;
  decisionAsk: string;
  approvalLine: string;
  riskLine: string;
  receiptLine: string;
  packetReadyCount: number;
  packetTotalCount: number;
  nextOwner: string;
  nextAction: string;
  tasks: Array<{
    id: QuickWorkflowBuyerExpansionHandoffReceiptTaskId;
    status: QuickWorkflowBuyerExpansionHandoffStatus;
    owner: string;
    action: string;
    acceptance: string;
    proof: string;
  }>;
};

export type QuickWorkflowBuyerExpansionHandoffVerificationRequest = {
  checksum: string;
  payload: QuickWorkflowBuyerExpansionHandoffReceiptPayload;
};

export type QuickWorkflowBuyerExpansionHandoffVerification = {
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

export function quickWorkflowBuyerExpansionHandoffPayloadJson(payload: QuickWorkflowBuyerExpansionHandoffReceiptPayload) {
  return canonicalJson(payload);
}

export function quickWorkflowBuyerExpansionHandoffChecksum(payload: QuickWorkflowBuyerExpansionHandoffReceiptPayload) {
  return stablePacketHash(quickWorkflowBuyerExpansionHandoffPayloadJson(payload));
}

export function quickWorkflowBuyerExpansionHandoffRequestJson(input: QuickWorkflowBuyerExpansionHandoffVerificationRequest) {
  return canonicalJson(input);
}

export function quickWorkflowBuyerExpansionHandoffVerifierHref(verificationRequestJson: string) {
  const params = new URLSearchParams({
    request: verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

export function verifyQuickWorkflowBuyerExpansionHandoffReceipt(
  input: QuickWorkflowBuyerExpansionHandoffVerificationRequest
): QuickWorkflowBuyerExpansionHandoffVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickWorkflowBuyerExpansionHandoffChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Quick workflow buyer expansion handoff checksum matches the one-pager, receipt chain, owner tasks, approval control, and next value recheck."
      : "Quick workflow buyer expansion handoff checksum does not match the exported procurement handoff. Re-export the handoff before accepting approval evidence."
  };
}
