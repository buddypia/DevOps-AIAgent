import type {
  QuickValueRealizationCloseoutDecision,
  QuickValueRealizationCloseoutStatus
} from "./quickValueRealizationCloseoutReceipt.js";

export const QUICK_VALUE_REALIZATION_ACCEPTANCE_RECEIPT_VERSION = "quick-value-realization-acceptance.v1";
export const QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH = "/api/quick-value-realization-acceptance/verify";

export type QuickValueRealizationAcceptanceDecision =
  | "accept-value-proof"
  | "hold-for-operating-evidence"
  | "hold-for-repair-acknowledgement";

export type QuickValueRealizationAcceptanceCheckPayload = {
  id: string;
  label: string;
  status: QuickValueRealizationCloseoutStatus;
  owner: string;
  evidence: string;
  acceptance: string;
};

export type QuickValueRealizationAcceptancePayload = {
  receiptVersion: typeof QUICK_VALUE_REALIZATION_ACCEPTANCE_RECEIPT_VERSION;
  status: QuickValueRealizationCloseoutStatus;
  decision: QuickValueRealizationAcceptanceDecision;
  buyer: string;
  closeoutDecision: QuickValueRealizationCloseoutDecision;
  retainedValueYen: number;
  retainedValueTargetYen: number;
  sourceCloseoutReceiptId: string;
  sourceCloseoutChecksum: string;
  repairAcknowledgementReceiptId: string;
  repairAcknowledgementChecksum: string;
  sourceLedgerReceiptId: string;
  sourceLedgerChecksum: string;
  closeoutStatus: QuickValueRealizationCloseoutStatus;
  closeoutCompletedCount: number;
  closeoutBlockedCount: number;
  repairQueueItemCount: number;
  evidenceGapCount: number;
  sourceRepairCount: number;
  repairAcknowledgementStatus: QuickValueRealizationCloseoutStatus;
  acknowledgedCount: number;
  requiredAcknowledgementCount: number;
  nextOwner: string;
  nextAction: string;
  buyerClaim: string;
  checks: QuickValueRealizationAcceptanceCheckPayload[];
};

export type QuickValueRealizationAcceptanceVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickValueRealizationAcceptanceVerificationRequest = {
  checksum: string;
  payload: QuickValueRealizationAcceptancePayload;
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

export function quickValueRealizationAcceptancePayloadJson(payload: QuickValueRealizationAcceptancePayload) {
  return canonicalJson(payload);
}

export function quickValueRealizationAcceptanceChecksum(payload: QuickValueRealizationAcceptancePayload) {
  return stablePacketHash(quickValueRealizationAcceptancePayloadJson(payload));
}

export function quickValueRealizationAcceptanceRequestJson(input: QuickValueRealizationAcceptanceVerificationRequest) {
  return canonicalJson(input);
}

export function verifyQuickValueRealizationAcceptanceReceipt(
  input: QuickValueRealizationAcceptanceVerificationRequest
): QuickValueRealizationAcceptanceVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickValueRealizationAcceptanceChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Value realization acceptance checksum matches the closeout receipt, repair acknowledgement receipt, retained value, decision, and acceptance checks."
      : "Value realization acceptance checksum does not match the exported value proof packet. Do not accept this buyer-facing value claim until it is re-exported."
  };
}
