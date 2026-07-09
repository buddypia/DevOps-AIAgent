export const QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION = "quick-workflow-value-acceptance-contract.v1";
export const QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH = "/api/quick-workflow-value-acceptance-contract/verify";

export type QuickWorkflowValueAcceptanceContractStatus = "ready" | "watch" | "blocked";

export type QuickWorkflowValueAcceptanceContractDecision =
  | "Issue value acceptance contract"
  | "Draft contract internally"
  | "Do not contract yet";

export type QuickWorkflowValueAcceptanceContractGateId =
  | "value-floor"
  | "proof-receipt"
  | "data-boundary"
  | "buyer-commitment"
  | "commercial-cap"
  | "stop-rule";

export type QuickWorkflowValueAcceptanceContractReceiptPayload = {
  receiptVersion: typeof QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION;
  source: "quick-workflow-intake";
  buyer: string;
  workflow: string;
  status: QuickWorkflowValueAcceptanceContractStatus;
  decision: QuickWorkflowValueAcceptanceContractDecision;
  pilotWindow: "14-day proof pilot";
  suggestedPilotPriceYen: number;
  valueFloorYen: number;
  stopLossYen: number;
  readinessScore: number;
  commercialStatus: QuickWorkflowValueAcceptanceContractStatus;
  acceptanceLine: string;
  creditLine: string;
  nextAction: string;
  gateStatuses: Array<{
    id: QuickWorkflowValueAcceptanceContractGateId;
    status: QuickWorkflowValueAcceptanceContractStatus;
    owner: string;
    requirement: string;
  }>;
};

export type QuickWorkflowValueAcceptanceContractVerificationRequest = {
  checksum: string;
  payload: QuickWorkflowValueAcceptanceContractReceiptPayload;
};

export type QuickWorkflowValueAcceptanceContractVerification = {
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

export function quickWorkflowValueAcceptanceContractPayloadJson(payload: QuickWorkflowValueAcceptanceContractReceiptPayload) {
  return canonicalJson(payload);
}

export function quickWorkflowValueAcceptanceContractChecksum(payload: QuickWorkflowValueAcceptanceContractReceiptPayload) {
  return stablePacketHash(quickWorkflowValueAcceptanceContractPayloadJson(payload));
}

export function quickWorkflowValueAcceptanceContractRequestJson(input: QuickWorkflowValueAcceptanceContractVerificationRequest) {
  return canonicalJson(input);
}

export function quickWorkflowValueAcceptanceContractVerifierHref(verificationRequestJson: string) {
  const params = new URLSearchParams({
    request: verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

export function verifyQuickWorkflowValueAcceptanceContractReceipt(
  input: QuickWorkflowValueAcceptanceContractVerificationRequest
): QuickWorkflowValueAcceptanceContractVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickWorkflowValueAcceptanceContractChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Quick workflow value acceptance contract checksum matches the buyer, workflow, pilot price, value floor, stop rule, acceptance line, and contract gates."
      : "Quick workflow value acceptance contract checksum does not match the exported contract. Re-export the contract before sharing it with a buyer."
  };
}
