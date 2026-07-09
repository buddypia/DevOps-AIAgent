export const HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION = "homepage-outcome-artifact.v1";
export const HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH = "/api/homepage-outcome-artifact/receipt/verify";

export type HomepageOutcomeArtifactReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
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

export function homepageOutcomeArtifactCanonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

export function homepageOutcomeArtifactReceiptChecksum(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function verifyHomepageOutcomeArtifactReceipt(input: { checksum: string; payload: unknown }): HomepageOutcomeArtifactReceiptVerification {
  const actualChecksum = homepageOutcomeArtifactReceiptChecksum(input.payload);
  const expectedChecksum = input.checksum.toLowerCase();
  const verified = actualChecksum === expectedChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Homepage outcome artifact receipt checksum matches the buyer packet replay payload."
      : "Homepage outcome artifact receipt checksum does not match the buyer packet replay payload. Re-export the buyer outcome packet before accepting it."
  };
}
