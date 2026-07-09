export const QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERSION = "quick-buyer-evidence-response-owner-packet.v1";
export const QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERIFY_PATH = "/api/quick-buyer-evidence-response-owner-packet/verify";

export type QuickBuyerEvidenceResponseOwnerPacketStatus = "ready" | "watch" | "blocked";
export type QuickBuyerEvidenceResponseOwnerPacketState = "empty" | "invalid" | "mismatch" | "wrong-pack" | "verified";

export type QuickBuyerEvidenceResponseOwnerPacketRunbookItem = {
  id: string;
  label: string;
  owner: string;
  window: string;
  action: string;
  evidence: string;
  proof: string;
  status: QuickBuyerEvidenceResponseOwnerPacketStatus;
};

export type QuickBuyerEvidenceResponseOwnerPacketReceiptPayload = {
  receiptVersion: typeof QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERSION;
  status: QuickBuyerEvidenceResponseOwnerPacketStatus;
  state: QuickBuyerEvidenceResponseOwnerPacketState;
  label: string;
  buyer: string;
  owner: string;
  nextAction: string;
  evidenceReceiptId: string;
  evidenceChecksum: string;
  responseReceiptChecksum: string;
  reviewerLine: string;
  runbook: QuickBuyerEvidenceResponseOwnerPacketRunbookItem[];
  ownerPacketMarkdown: string;
  proof: string;
};

export type QuickBuyerEvidenceResponseOwnerPacketReceiptVerificationRequest = {
  checksum: string;
  payload: QuickBuyerEvidenceResponseOwnerPacketReceiptPayload;
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

export function quickBuyerEvidenceResponseOwnerPacketReceiptPayloadJson(payload: QuickBuyerEvidenceResponseOwnerPacketReceiptPayload) {
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

export function quickBuyerEvidenceResponseOwnerPacketReceiptChecksum(payload: QuickBuyerEvidenceResponseOwnerPacketReceiptPayload) {
  return stablePacketHash(quickBuyerEvidenceResponseOwnerPacketReceiptPayloadJson(payload));
}

export function quickBuyerEvidenceResponseOwnerPacketReceiptRequestJson(
  input: QuickBuyerEvidenceResponseOwnerPacketReceiptVerificationRequest
) {
  return JSON.stringify(canonicalize(input), null, 2);
}

export function verifyQuickBuyerEvidenceResponseOwnerPacketReceipt(
  input: QuickBuyerEvidenceResponseOwnerPacketReceiptVerificationRequest
) {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickBuyerEvidenceResponseOwnerPacketReceiptChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? ("verified" as const) : ("mismatch" as const),
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Buyer evidence response owner packet receipt checksum matches the returned response state, conversion evidence receipt, owner runbook, and packet markdown."
      : "Buyer evidence response owner packet receipt checksum does not match the owner packet payload. Do not assign this buyer evidence handoff until it is re-exported."
  };
}
