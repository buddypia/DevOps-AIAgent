export const HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERSION = "homepage-outcome-spine.v1";
export const HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH = "/api/homepage-outcome-spine/receipt/verify";

export type HomepageOutcomeSpineReceiptStatus = "ready" | "attention" | "blocked";

export type HomepageOutcomeSpineReceiptStep = {
  id: "workflow" | "value" | "proof" | "packet" | "decision";
  label: string;
  status: HomepageOutcomeSpineReceiptStatus;
  title: string;
  evidence: string;
  href: string;
  actionLabel: string;
};

export type HomepageOutcomeSpineReceiptPayload = {
  receiptVersion: typeof HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERSION;
  source: "homepage-outcome-spine";
  buyer: string;
  status: HomepageOutcomeSpineReceiptStatus;
  proofScore: number;
  proofReadyCount: number;
  proofItemCount: number;
  packetReadyCount: number;
  packetItemCount: number;
  publishabilityDecision: "publish-ready" | "review-first" | "do-not-publish";
  reviewerDecision: "send-to-buyer" | "sponsor-review" | "repair-before-share";
  primaryAction: {
    label: string;
    href: string;
  };
  sendRule: string;
  currentRoute: string;
  steps: HomepageOutcomeSpineReceiptStep[];
};

export type HomepageOutcomeSpineReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type HomepageOutcomeSpineReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  verificationApiPath: typeof HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH;
  payload: HomepageOutcomeSpineReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: HomepageOutcomeSpineReceiptVerification;
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

export function homepageOutcomeSpineCanonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

export function homepageOutcomeSpineReceiptChecksum(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function verifyHomepageOutcomeSpineReceipt(input: {
  checksum: string;
  payload: HomepageOutcomeSpineReceiptPayload;
}): HomepageOutcomeSpineReceiptVerification {
  const actualChecksum = homepageOutcomeSpineReceiptChecksum(input.payload);
  const expectedChecksum = input.checksum.toLowerCase();
  const verified = actualChecksum === expectedChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Homepage outcome spine receipt checksum matches the first buyer decision route replay payload."
      : "Homepage outcome spine receipt checksum does not match the first buyer decision route replay payload. Re-export the route before accepting it."
  };
}

export function buildHomepageOutcomeSpineReceipt(payload: HomepageOutcomeSpineReceiptPayload): HomepageOutcomeSpineReceipt {
  const checksum = homepageOutcomeSpineReceiptChecksum(payload);
  const payloadJson = homepageOutcomeSpineCanonicalJson(payload);
  const verificationRequestJson = homepageOutcomeSpineCanonicalJson({ checksum, payload });
  const verification = verifyHomepageOutcomeSpineReceipt({ checksum, payload });

  return {
    receiptId: `homepage-outcome-spine-${payload.status}-${checksum}`,
    checksumAlgorithm: "fnv1a32",
    checksum,
    verificationApiPath: HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };
}
