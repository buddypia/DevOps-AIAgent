export const QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION = "quick-external-review-decision.v1";
export const QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERIFY_PATH = "/api/quick-external-review-decision/verify";

export type QuickExternalReviewDecision = "continue" | "revise" | "stop";
export type QuickExternalReviewDecisionStatus = "ready" | "watch" | "blocked";

export type QuickExternalReviewDecisionReceiptReplacementCloseoutItem = {
  id: string;
  label: string;
  status: QuickExternalReviewDecisionStatus;
  replacementHref: string;
  evidence: string;
};

export type QuickExternalReviewDecisionReceiptReplacementCloseout = {
  status: QuickExternalReviewDecisionStatus;
  headline: string;
  summary: string;
  checkedAt: string;
  readyCount: number;
  watchCount: number;
  blockedCount: number;
  missingCount: number;
  slotTotal: number;
  canReopen: boolean;
  firstOpenItemId: string;
  items: QuickExternalReviewDecisionReceiptReplacementCloseoutItem[];
};

export type QuickExternalReviewDecisionReceiptPayload = {
  receiptVersion: typeof QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION;
  decision: QuickExternalReviewDecision;
  status: QuickExternalReviewDecisionStatus;
  label: string;
  reviewerName: string;
  reviewerNote: string;
  buyer: string;
  generatedAt: string;
  manifestReceiptId: string;
  manifestChecksum: string;
  packetStatus: QuickExternalReviewDecisionStatus;
  packetClearance: "external-review" | "internal-only";
  testsReady: number;
  testsTotal: number;
  confidence: number;
  reviewOutcome: string;
  nextAction: string;
  proof: string;
  replacementCloseout?: QuickExternalReviewDecisionReceiptReplacementCloseout;
};

export type QuickExternalReviewDecisionReceiptVerificationRequest = {
  checksum: string;
  payload: QuickExternalReviewDecisionReceiptPayload;
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

export function quickExternalReviewDecisionReceiptPayloadJson(payload: QuickExternalReviewDecisionReceiptPayload) {
  return JSON.stringify(canonicalize(payload), null, 2);
}

function stablePacketHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function quickExternalReviewDecisionReceiptChecksum(payload: QuickExternalReviewDecisionReceiptPayload) {
  return stablePacketHash(quickExternalReviewDecisionReceiptPayloadJson(payload));
}

export function quickExternalReviewDecisionReceiptRequestJson(input: QuickExternalReviewDecisionReceiptVerificationRequest) {
  return JSON.stringify(canonicalize(input), null, 2);
}

export function verifyQuickExternalReviewDecisionReceipt(input: QuickExternalReviewDecisionReceiptVerificationRequest) {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickExternalReviewDecisionReceiptChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? ("verified" as const) : ("mismatch" as const),
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "External review decision receipt checksum matches the reviewer response, source packet manifest, and next action."
      : "External review decision receipt checksum does not match the reviewer response payload. Do not accept this decision until the reviewer re-exports the receipt."
  };
}
