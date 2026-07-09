export const QUICK_BUYER_DECISION_REPLY_RECORD_RECEIPT_VERSION = "quick-buyer-decision-reply-record.v1";
export const QUICK_BUYER_DECISION_REPLY_RECORD_VERIFY_PATH = "/api/quick-buyer-decision-reply-record/verify";

export type QuickBuyerDecisionReplyRecordStatus = "ready" | "watch" | "blocked";
export type QuickBuyerDecisionReplyRecordDecision = "continue" | "revise" | "stop";
export type QuickBuyerDecisionReplyActivationMode = "pilot-start" | "proof-repair" | "close-audit";

export type QuickBuyerDecisionReplyRecordPayload = {
  receiptVersion: typeof QUICK_BUYER_DECISION_REPLY_RECORD_RECEIPT_VERSION;
  status: QuickBuyerDecisionReplyRecordStatus;
  decision: QuickBuyerDecisionReplyRecordDecision;
  label: string;
  headline: string;
  buyer: string;
  confidence: number;
  buyerReply: string;
  matchedSignals: string[];
  nextOwner: string;
  nextAction: string;
  proof: string;
  onePagerReceiptId: string;
  onePagerChecksum: string;
  activation: {
    mode: QuickBuyerDecisionReplyActivationMode;
    status: QuickBuyerDecisionReplyRecordStatus;
    label: string;
    recommendedReply: QuickBuyerDecisionReplyRecordDecision;
    sourceReceiptId: string;
    sourceChecksum: string;
    primaryHref: string;
    primaryLabel: string;
    items: Array<{
      id: string;
      label: string;
      status: QuickBuyerDecisionReplyRecordStatus;
      owner: string;
      command: string;
      evidence: string;
      href: string;
    }>;
  };
};

export type QuickBuyerDecisionReplyRecordVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickBuyerDecisionReplyRecordVerificationRequest = {
  checksum: string;
  payload: QuickBuyerDecisionReplyRecordPayload;
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

export function quickBuyerDecisionReplyRecordPayloadJson(payload: QuickBuyerDecisionReplyRecordPayload) {
  return canonicalJson(payload);
}

export function quickBuyerDecisionReplyRecordChecksum(payload: QuickBuyerDecisionReplyRecordPayload) {
  return stablePacketHash(quickBuyerDecisionReplyRecordPayloadJson(payload));
}

export function quickBuyerDecisionReplyRecordVerificationRequestJson(input: QuickBuyerDecisionReplyRecordVerificationRequest) {
  return canonicalJson(input);
}

export function verifyQuickBuyerDecisionReplyRecordReceipt(input: QuickBuyerDecisionReplyRecordVerificationRequest): QuickBuyerDecisionReplyRecordVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickBuyerDecisionReplyRecordChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Buyer reply record checksum matches the structured reply and activation payload."
      : "Buyer reply record checksum does not match the structured reply payload. Do not accept this buyer reply until the record is re-exported from the source workspace."
  };
}
