export const QUICK_VALUE_REALIZATION_CLOSEOUT_RECEIPT_VERSION = "quick-value-realization-closeout.v1";
export const QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH = "/api/quick-value-realization-closeout/verify";

export type QuickValueRealizationCloseoutStatus = "ready" | "watch" | "blocked";
export type QuickValueRealizationCloseoutDecision = "expand" | "revise" | "stop" | "missing";

export type QuickValueRealizationCloseoutTaskPayload = {
  id: string;
  window: string;
  label: string;
  status: QuickValueRealizationCloseoutStatus;
  owner: string;
  outcome: string;
  matchedSignals: string[];
  missingSignals: string[];
  evidence: string;
  href: string;
};

export type QuickValueRealizationCloseoutRepairItemPayload = {
  id: string;
  taskId: string;
  label: string;
  status: QuickValueRealizationCloseoutStatus;
  reason: "source-ledger-repair" | "evidence-gap";
  owner: string;
  sourceStatus: QuickValueRealizationCloseoutStatus;
  evidenceStatus: QuickValueRealizationCloseoutStatus;
  action: string;
  proof: string;
  acceptance: string;
  href: string;
};

export type QuickValueRealizationCloseoutRepairQueuePayload = {
  status: QuickValueRealizationCloseoutStatus;
  headline: string;
  summary: string;
  itemCount: number;
  sourceRepairCount: number;
  evidenceGapCount: number;
  nextOwner: string;
  nextAction: string;
  items: QuickValueRealizationCloseoutRepairItemPayload[];
};

export type QuickValueRealizationCloseoutPayload = {
  receiptVersion: typeof QUICK_VALUE_REALIZATION_CLOSEOUT_RECEIPT_VERSION;
  status: QuickValueRealizationCloseoutStatus;
  buyer: string;
  primaryAsk: string;
  completedCount: number;
  blockedCount: number;
  retainedValueYen: number;
  retainedValueTargetYen: number;
  decision: QuickValueRealizationCloseoutDecision;
  nextOwner: string;
  nextAction: string;
  sourceLedgerReceiptId: string;
  sourceLedgerChecksum: string;
  closeoutEvidence: string;
  tasks: QuickValueRealizationCloseoutTaskPayload[];
  repairQueue: QuickValueRealizationCloseoutRepairQueuePayload;
};

export type QuickValueRealizationCloseoutVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickValueRealizationCloseoutVerificationRequest = {
  checksum: string;
  payload: QuickValueRealizationCloseoutPayload;
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

export function quickValueRealizationCloseoutPayloadJson(payload: QuickValueRealizationCloseoutPayload) {
  return canonicalJson(payload);
}

export function quickValueRealizationCloseoutChecksum(payload: QuickValueRealizationCloseoutPayload) {
  return stablePacketHash(quickValueRealizationCloseoutPayloadJson(payload));
}

export function quickValueRealizationCloseoutVerificationRequestJson(input: QuickValueRealizationCloseoutVerificationRequest) {
  return canonicalJson(input);
}

export function verifyQuickValueRealizationCloseoutReceipt(
  input: QuickValueRealizationCloseoutVerificationRequest
): QuickValueRealizationCloseoutVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickValueRealizationCloseoutChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Value realization closeout checksum matches the Day 0/7/14/30 evidence, retained value, decision, source ledger, and task outcomes."
      : "Value realization closeout checksum does not match the exported evidence payload. Do not accept this closeout until it is re-exported from the source workspace."
  };
}
