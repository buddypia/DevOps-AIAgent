import type { QuickValueRealizationCloseoutStatus } from "./quickValueRealizationCloseoutReceipt.js";
import type { QuickValueReviewExecutionDecision } from "./quickValueReviewExecutionReceipt.js";

export const QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_RECEIPT_VERSION = "quick-value-review-execution-closeout.v1";
export const QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH = "/api/quick-value-review-execution-closeout/verify";

export type QuickValueReviewExecutionCloseoutDecision = "accept-execution-closeout" | "hold-execution-closeout";

export type QuickValueReviewExecutionCloseoutTaskPayload = {
  id: string;
  label: string;
  status: QuickValueRealizationCloseoutStatus;
  owner: string;
  dueWindow: string;
  command: string;
  matchedSignals: string[];
  missingSignals: string[];
  evidence: string;
  acceptance: string;
};

export type QuickValueReviewExecutionCloseoutPayload = {
  receiptVersion: typeof QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_RECEIPT_VERSION;
  status: QuickValueRealizationCloseoutStatus;
  decision: QuickValueReviewExecutionCloseoutDecision;
  buyer: string;
  executionDecision: QuickValueReviewExecutionDecision;
  sourceExecutionReceiptId: string;
  sourceExecutionChecksum: string;
  sourceAcceptanceReceiptId: string;
  sourceCloseoutReceiptId: string;
  readyTaskCount: number;
  taskCount: number;
  blockedTaskCount: number;
  nextOwner: string;
  nextAction: string;
  evidenceSummary: string;
  tasks: QuickValueReviewExecutionCloseoutTaskPayload[];
};

export type QuickValueReviewExecutionCloseoutVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickValueReviewExecutionCloseoutVerificationRequest = {
  checksum: string;
  payload: QuickValueReviewExecutionCloseoutPayload;
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

export function quickValueReviewExecutionCloseoutPayloadJson(payload: QuickValueReviewExecutionCloseoutPayload) {
  return canonicalJson(payload);
}

export function quickValueReviewExecutionCloseoutChecksum(payload: QuickValueReviewExecutionCloseoutPayload) {
  return stablePacketHash(quickValueReviewExecutionCloseoutPayloadJson(payload));
}

export function quickValueReviewExecutionCloseoutRequestJson(input: QuickValueReviewExecutionCloseoutVerificationRequest) {
  return canonicalJson(input);
}

export function verifyQuickValueReviewExecutionCloseoutReceipt(
  input: QuickValueReviewExecutionCloseoutVerificationRequest
): QuickValueReviewExecutionCloseoutVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickValueReviewExecutionCloseoutChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Value review execution closeout checksum matches the execution receipt, source receipts, completion evidence summary, and task outcomes."
      : "Value review execution closeout checksum does not match the exported completion evidence. Do not mark post-review work complete until it is re-exported."
  };
}
