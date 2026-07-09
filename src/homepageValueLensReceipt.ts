export const HOMEPAGE_VALUE_LENS_RECEIPT_VERSION = "homepage-value-lens.v1";
export const HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH = "/api/homepage-value-lens/receipt/verify";

export type HomepageValueLensReceiptStatus = "ready" | "attention" | "blocked";

export type HomepageValueLensReceiptPayload = {
  receiptVersion: typeof HOMEPAGE_VALUE_LENS_RECEIPT_VERSION;
  source: "homepage-value-lens";
  buyer: string;
  status: HomepageValueLensReceiptStatus;
  headline: string;
  valueClaim: string;
  monthlyValueYen: number;
  measuredMonthlyValueYen: number;
  measuredSupportPercent: number;
  paybackDays: number;
  confidenceScore: number;
  monthlyHoursSaved: number;
  pilotBudgetCeilingYen: number;
  assumptions: {
    teamSize: number;
    cyclesPerMonth: number;
    manualHoursPerCycle: number;
    adoptionRatePercent: number;
    hourlyCostYen: number;
    incidentRiskYenPerMonth?: number;
  };
  metrics: Array<{
    id: string;
    label: string;
    value: string;
    status: HomepageValueLensReceiptStatus;
    evidence: string;
  }>;
  primaryAction: {
    label: string;
    href: string;
  };
  workflowAction: {
    label: string;
    href: string;
  };
};

export type HomepageValueLensReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type HomepageValueLensReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  verificationApiPath: typeof HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH;
  payload: HomepageValueLensReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: HomepageValueLensReceiptVerification;
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

export function homepageValueLensCanonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

export function homepageValueLensReceiptChecksum(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function verifyHomepageValueLensReceipt(input: {
  checksum: string;
  payload: HomepageValueLensReceiptPayload;
}): HomepageValueLensReceiptVerification {
  const actualChecksum = homepageValueLensReceiptChecksum(input.payload);
  const expectedChecksum = input.checksum.toLowerCase();
  const verified = actualChecksum === expectedChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Homepage value lens receipt checksum matches the first-screen value replay payload."
      : "Homepage value lens receipt checksum does not match the first-screen value replay payload. Re-export the value lens before accepting the claim."
  };
}

export function buildHomepageValueLensReceipt(payload: HomepageValueLensReceiptPayload): HomepageValueLensReceipt {
  const checksum = homepageValueLensReceiptChecksum(payload);
  const payloadJson = homepageValueLensCanonicalJson(payload);
  const verificationRequestJson = homepageValueLensCanonicalJson({ checksum, payload });
  const verification = verifyHomepageValueLensReceipt({ checksum, payload });

  return {
    receiptId: `homepage-value-${payload.status}-${checksum}`,
    checksumAlgorithm: "fnv1a32",
    checksum,
    verificationApiPath: HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };
}
