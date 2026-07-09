import type { GlobalPublishabilityReceiptPayload } from "./globalPublishabilityReceipt.js";

export const GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERSION = "global-publishability-review-response.v1";
export const GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_PATH = "/api/global-publishability/review-response";
export const GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERIFY_PATH = "/api/global-publishability/review-response/receipt/verify";

export type GlobalPublishabilityReviewResponseChoice = "approve-bounded-pilot" | "sponsor-review" | "hold-public-launch";
export type GlobalPublishabilityReviewResponseOutcome = "pilot-approved" | "owner-follow-up" | "no-send";
export type GlobalPublishabilityReviewResponseStatus = "accepted" | "review" | "blocked";
export type GlobalPublishabilityReviewResponseProofId = GlobalPublishabilityReceiptPayload["valueRoute"][number]["id"];

export type GlobalPublishabilityReviewResponseReceiptPayload = {
  receiptVersion: typeof GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERSION;
  reportId: string;
  sourceReceiptChecksum: string;
  sourceDecision: GlobalPublishabilityReceiptPayload["decision"];
  sourceStatus: GlobalPublishabilityReceiptPayload["status"];
  sourceRecommendedDecision: GlobalPublishabilityReceiptPayload["recommendedDecision"];
  sourcePublishabilityScore: number;
  targetBuyer: string;
  reviewerName: string;
  reviewerRole: string;
  reviewerChoice: GlobalPublishabilityReviewResponseChoice;
  reviewerNote: string;
  reviewedAt: string;
  checkedProofIds: GlobalPublishabilityReviewResponseProofId[];
  requiredProofIds: GlobalPublishabilityReviewResponseProofId[];
  missingProofIds: GlobalPublishabilityReviewResponseProofId[];
  blockedProofIds: GlobalPublishabilityReviewResponseProofId[];
  watchProofIds: GlobalPublishabilityReviewResponseProofId[];
  status: GlobalPublishabilityReviewResponseStatus;
  outcome: GlobalPublishabilityReviewResponseOutcome;
  owner: string;
  responseSummary: string;
  nextAction: string;
  proofSnapshot: {
    passCount: number;
    watchCount: number;
    blockCount: number;
    totalCount: number;
  };
};

export type GlobalPublishabilityReviewResponseReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type GlobalPublishabilityReviewResponseReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERIFY_PATH;
  payload: GlobalPublishabilityReviewResponseReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: GlobalPublishabilityReviewResponseReceiptVerification;
  copyText: string;
  href: string;
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

function stableDigest(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function globalPublishabilityReviewResponseChecksum(payload: GlobalPublishabilityReviewResponseReceiptPayload) {
  return stableDigest(payload);
}

export function verifyGlobalPublishabilityReviewResponseReceipt(input: {
  checksum: string;
  payload: GlobalPublishabilityReviewResponseReceiptPayload;
}): GlobalPublishabilityReviewResponseReceiptVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = globalPublishabilityReviewResponseChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Global publishability review-response receipt matches the reviewer decision, inspected proof IDs, source publishability receipt, and next action."
      : "Global publishability review-response receipt checksum does not match the reviewer response payload. Do not accept this external decision until it is re-exported."
  };
}

function buildReceiptMarkdown(receipt: Omit<GlobalPublishabilityReviewResponseReceipt, "copyText" | "href">) {
  return [
    "# Global publishability review response",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Report: ${receipt.payload.reportId}`,
    `Target buyer: ${receipt.payload.targetBuyer}`,
    `Reviewer: ${receipt.payload.reviewerName} (${receipt.payload.reviewerRole})`,
    `Choice: ${receipt.payload.reviewerChoice}`,
    `Outcome: ${receipt.payload.outcome}`,
    `Status: ${receipt.payload.status}`,
    `Source receipt checksum: ${receipt.payload.sourceReceiptChecksum}`,
    "",
    "## Summary",
    receipt.payload.responseSummary,
    "",
    "## Next action",
    receipt.payload.nextAction,
    "",
    "## Reviewer note",
    receipt.payload.reviewerNote,
    "",
    "## Proof inspection",
    `Checked proof IDs: ${receipt.payload.checkedProofIds.join(", ") || "none"}`,
    `Missing proof IDs: ${receipt.payload.missingProofIds.join(", ") || "none"}`,
    `Blocked proof IDs: ${receipt.payload.blockedProofIds.join(", ") || "none"}`,
    `Watch proof IDs: ${receipt.payload.watchProofIds.join(", ") || "none"}`,
    "",
    "## Replay payload",
    "```json",
    receipt.payloadJson,
    "```",
    "",
    "## Verification",
    `- Status: ${receipt.verification.status}`,
    `- Expected checksum: ${receipt.verification.expectedChecksum}`,
    `- Actual checksum: ${receipt.verification.actualChecksum}`,
    `- Instruction: ${receipt.verification.instruction}`,
    "",
    "## API verification",
    `POST ${receipt.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    receipt.verificationRequestJson,
    "```"
  ].join("\n");
}

export function buildGlobalPublishabilityReviewResponseReceipt(
  payload: GlobalPublishabilityReviewResponseReceiptPayload
): GlobalPublishabilityReviewResponseReceipt {
  const checksum = globalPublishabilityReviewResponseChecksum(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyGlobalPublishabilityReviewResponseReceipt({ checksum, payload });
  const partial: Omit<GlobalPublishabilityReviewResponseReceipt, "copyText" | "href"> = {
    receiptId: `global-publishability-review-response-${payload.outcome}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };
  const copyText = buildReceiptMarkdown(partial);

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}
