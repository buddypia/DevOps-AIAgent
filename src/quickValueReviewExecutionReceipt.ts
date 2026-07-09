import type { QuickValueRealizationCloseoutStatus } from "./quickValueRealizationCloseoutReceipt.js";

export const QUICK_VALUE_REVIEW_EXECUTION_RECEIPT_VERSION = "quick-value-review-execution.v1";
export const QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH = "/api/quick-value-review-execution/verify";

export type QuickValueReviewExecutionDecision = "expand-rollout" | "revise-rollout" | "stop-rollout" | "hold-review";

export type QuickValueReviewExecutionTaskPayload = {
  id: string;
  label: string;
  status: QuickValueRealizationCloseoutStatus;
  owner: string;
  dueWindow: string;
  command: string;
  evidence: string;
  acceptance: string;
};

export type QuickValueReviewExecutionPayload = {
  receiptVersion: typeof QUICK_VALUE_REVIEW_EXECUTION_RECEIPT_VERSION;
  status: QuickValueRealizationCloseoutStatus;
  decision: QuickValueReviewExecutionDecision;
  buyer: string;
  sourceReviewDecision: string;
  sourceAcceptanceReceiptId: string;
  sourceAcceptanceChecksum: string;
  sourceCloseoutReceiptId: string;
  sourceCloseoutChecksum: string;
  retainedValueYen: number;
  retainedValueTargetYen: number;
  reviewQuestion: string;
  buyerAsk: string;
  readyTaskCount: number;
  taskCount: number;
  blockedTaskCount: number;
  nextOwner: string;
  nextAction: string;
  guardrails: string[];
  tasks: QuickValueReviewExecutionTaskPayload[];
};

export type QuickValueReviewExecutionVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickValueReviewExecutionVerificationRequest = {
  checksum: string;
  payload: QuickValueReviewExecutionPayload;
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

export function quickValueReviewExecutionPayloadJson(payload: QuickValueReviewExecutionPayload) {
  return canonicalJson(payload);
}

export function quickValueReviewExecutionChecksum(payload: QuickValueReviewExecutionPayload) {
  return stablePacketHash(quickValueReviewExecutionPayloadJson(payload));
}

export function quickValueReviewExecutionRequestJson(input: QuickValueReviewExecutionVerificationRequest) {
  return canonicalJson(input);
}

export function verifyQuickValueReviewExecutionReceipt(input: QuickValueReviewExecutionVerificationRequest): QuickValueReviewExecutionVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickValueReviewExecutionChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Value review execution checksum matches the source acceptance receipt, closeout receipt, review decision, guardrails, and execution tasks."
      : "Value review execution checksum does not match the exported execution packet. Do not assign post-review work until the packet is re-exported."
  };
}
