export const QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERSION = "quick-external-review-owner-packet.v1";
export const QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERIFY_PATH = "/api/quick-external-review-owner-packet/verify";

export type QuickExternalReviewOwnerPacketStatus = "ready" | "watch" | "blocked";

export type QuickExternalReviewOwnerPacketRunbookItem = {
  id: string;
  label: string;
  owner: string;
  window: string;
  action: string;
  evidence: string;
  proof: string;
  status: QuickExternalReviewOwnerPacketStatus;
};

export type QuickExternalReviewOwnerPacketFollowUpTask = {
  id: string;
  label: string;
  status: QuickExternalReviewOwnerPacketStatus;
  owner: string;
  dueLabel: string;
  action: string;
  closeCondition: string;
  evidence: string;
  proof: string;
  href: string;
};

export type QuickExternalReviewOwnerPacketFollowUpLedger = {
  status: QuickExternalReviewOwnerPacketStatus;
  headline: string;
  summary: string;
  readyCount: number;
  watchCount: number;
  blockedCount: number;
  taskTotal: number;
  firstDueLabel: string;
  calendarStartDate: string;
  calendarEndDate: string;
  tasks: QuickExternalReviewOwnerPacketFollowUpTask[];
  csv: string;
  calendarText: string;
  exportMarkdown: string;
};

export type QuickExternalReviewOwnerPacketReceiptPayload = {
  receiptVersion: typeof QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERSION;
  status: QuickExternalReviewOwnerPacketStatus;
  label: string;
  buyer: string;
  owner: string;
  nextAction: string;
  manifestReceiptId: string;
  manifestChecksum: string;
  responseReceiptChecksum: string;
  reviewerLine: string;
  acceptanceCriteria: string[];
  runbook: QuickExternalReviewOwnerPacketRunbookItem[];
  followUpLedger: QuickExternalReviewOwnerPacketFollowUpLedger;
  ownerPacketMarkdown: string;
  regenerationNote: string;
  proof: string;
};

export type QuickExternalReviewOwnerPacketReceiptVerificationRequest = {
  checksum: string;
  payload: QuickExternalReviewOwnerPacketReceiptPayload;
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

export function quickExternalReviewOwnerPacketReceiptPayloadJson(payload: QuickExternalReviewOwnerPacketReceiptPayload) {
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

export function quickExternalReviewOwnerPacketReceiptChecksum(payload: QuickExternalReviewOwnerPacketReceiptPayload) {
  return stablePacketHash(quickExternalReviewOwnerPacketReceiptPayloadJson(payload));
}

export function quickExternalReviewOwnerPacketReceiptRequestJson(input: QuickExternalReviewOwnerPacketReceiptVerificationRequest) {
  return JSON.stringify(canonicalize(input), null, 2);
}

export function verifyQuickExternalReviewOwnerPacketReceipt(input: QuickExternalReviewOwnerPacketReceiptVerificationRequest) {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickExternalReviewOwnerPacketReceiptChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? ("verified" as const) : ("mismatch" as const),
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "External review owner packet receipt checksum matches the owner packet, follow-up ledger, regeneration note, acceptance criteria, source response, and packet manifest."
      : "External review owner packet receipt checksum does not match the owner packet payload. Do not assign this repair handoff until it is re-exported."
  };
}
