export const QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION = "quick-public-value-release.v1";
export const QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERIFY_PATH = "/api/quick-public-value-release/receipt/verify";

export type QuickPublicValueReleaseReceiptStatus = "ready" | "watch" | "blocked";
export type QuickPublicValueReleaseReceiptCheckId = "value" | "sponsor" | "publication" | "live-proof";

export type QuickPublicValueReleaseReceiptPayload = {
  receiptVersion: typeof QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION;
  source: "quick-workflow-intake";
  buyer: string;
  workflow: string;
  status: QuickPublicValueReleaseReceiptStatus;
  label: string;
  releaseScore: number;
  shareableMonthlyValueYen: number;
  lockedMonthlyValueYen: number;
  nextOwner: string;
  nextAction: string;
  releaseRule: string;
  sourceReceiptId: string;
  sourceChecksum: string;
  sponsorGateReceiptId: string;
  liveProofAuditReceiptId: string;
  liveProofAuditChecksum: string;
  publicationReadyCount: number;
  publicationTotalCount: number;
  checks: Array<{
    id: QuickPublicValueReleaseReceiptCheckId;
    label: string;
    status: QuickPublicValueReleaseReceiptStatus;
    value: string;
    evidence: string;
    owner: string;
    action: string;
  }>;
};

export type QuickPublicValueReleaseReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickPublicValueReleaseReceiptVerificationRequest = {
  checksum: string;
  payload: QuickPublicValueReleaseReceiptPayload;
};

export type QuickPublicValueReleaseReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  verificationApiPath: typeof QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERIFY_PATH;
  payload: QuickPublicValueReleaseReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: QuickPublicValueReleaseReceiptVerification;
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

function stablePacketHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function quickPublicValueReleasePayloadJson(payload: QuickPublicValueReleaseReceiptPayload) {
  return JSON.stringify(canonicalize(payload), null, 2);
}

export function quickPublicValueReleaseReceiptChecksum(payload: QuickPublicValueReleaseReceiptPayload) {
  return stablePacketHash(quickPublicValueReleasePayloadJson(payload));
}

export function quickPublicValueReleaseRequestJson(input: QuickPublicValueReleaseReceiptVerificationRequest) {
  return JSON.stringify(canonicalize(input), null, 2);
}

export function verifyQuickPublicValueReleaseReceipt(
  input: QuickPublicValueReleaseReceiptVerificationRequest
): QuickPublicValueReleaseReceiptVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickPublicValueReleaseReceiptChecksum(input.payload);
  const verified = actualChecksum === expectedChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Public value release receipt checksum matches the release gate, source conversion receipt, publication state, and live proof state."
      : "Public value release receipt checksum does not match the exported release gate. Re-export the gate before citing the value externally."
  };
}

export function buildQuickPublicValueReleaseReceipt(payload: QuickPublicValueReleaseReceiptPayload): QuickPublicValueReleaseReceipt {
  const checksum = quickPublicValueReleaseReceiptChecksum(payload);
  const payloadJson = quickPublicValueReleasePayloadJson(payload);
  const verificationRequestJson = quickPublicValueReleaseRequestJson({ checksum, payload });
  const verification = verifyQuickPublicValueReleaseReceipt({ checksum, payload });

  return {
    receiptId: `quick-public-value-${payload.status}-${checksum}`,
    checksumAlgorithm: "fnv1a32",
    checksum,
    verificationApiPath: QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };
}
