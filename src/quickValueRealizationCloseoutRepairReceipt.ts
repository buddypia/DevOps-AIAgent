import type {
  QuickValueRealizationCloseoutRepairItemPayload,
  QuickValueRealizationCloseoutStatus
} from "./quickValueRealizationCloseoutReceipt.js";

export const QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_RECEIPT_VERSION = "quick-value-realization-closeout-repair.v1";
export const QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH = "/api/quick-value-realization-closeout-repair/verify";

export type QuickValueRealizationCloseoutRepairAcknowledgementItemPayload = {
  id: string;
  taskId: string;
  label: string;
  status: QuickValueRealizationCloseoutStatus;
  reason: QuickValueRealizationCloseoutRepairItemPayload["reason"];
  owner: string;
  matchedSignals: string[];
  missingSignals: string[];
  sourceStatus: QuickValueRealizationCloseoutStatus;
  evidenceStatus: QuickValueRealizationCloseoutStatus;
  requiredAction: string;
  acceptance: string;
  href: string;
};

export type QuickValueRealizationCloseoutRepairAcknowledgementPayload = {
  receiptVersion: typeof QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_RECEIPT_VERSION;
  status: QuickValueRealizationCloseoutStatus;
  buyer: string;
  sourceCloseoutReceiptId: string;
  sourceCloseoutChecksum: string;
  sourceLedgerReceiptId: string;
  sourceLedgerChecksum: string;
  repairQueueStatus: QuickValueRealizationCloseoutStatus;
  repairQueueItemCount: number;
  sourceRepairCount: number;
  evidenceGapCount: number;
  acknowledgedCount: number;
  requiredAcknowledgementCount: number;
  nextOwner: string;
  nextAction: string;
  ownerEvidence: string;
  items: QuickValueRealizationCloseoutRepairAcknowledgementItemPayload[];
};

export type QuickValueRealizationCloseoutRepairAcknowledgementVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickValueRealizationCloseoutRepairAcknowledgementVerificationRequest = {
  checksum: string;
  payload: QuickValueRealizationCloseoutRepairAcknowledgementPayload;
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

export function quickValueRealizationCloseoutRepairAcknowledgementPayloadJson(
  payload: QuickValueRealizationCloseoutRepairAcknowledgementPayload
) {
  return canonicalJson(payload);
}

export function quickValueRealizationCloseoutRepairAcknowledgementChecksum(
  payload: QuickValueRealizationCloseoutRepairAcknowledgementPayload
) {
  return stablePacketHash(quickValueRealizationCloseoutRepairAcknowledgementPayloadJson(payload));
}

export function quickValueRealizationCloseoutRepairAcknowledgementRequestJson(
  input: QuickValueRealizationCloseoutRepairAcknowledgementVerificationRequest
) {
  return canonicalJson(input);
}

export function verifyQuickValueRealizationCloseoutRepairAcknowledgementReceipt(
  input: QuickValueRealizationCloseoutRepairAcknowledgementVerificationRequest
): QuickValueRealizationCloseoutRepairAcknowledgementVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickValueRealizationCloseoutRepairAcknowledgementChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Value closeout repair acknowledgement checksum matches the owner evidence, source closeout receipt, source ledger receipt, and repair item outcomes."
      : "Value closeout repair acknowledgement checksum does not match the exported owner evidence payload. Do not accept the repair acknowledgement until it is re-exported."
  };
}
