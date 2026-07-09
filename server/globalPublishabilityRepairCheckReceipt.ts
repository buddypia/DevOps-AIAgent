import type { GlobalPublishabilityReceiptPayload } from "../src/globalPublishabilityReceipt.js";
import type { GlobalPublishabilityRepairProofRequirement } from "../src/globalPublishabilityReport.js";
import type { PublicProofLinkVerification, PublicProofLinkVerificationSummary } from "./proofLinkVerifier.js";

export const GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERSION = "global-publishability-repair-check.v1";
export const GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERIFY_PATH = "/api/global-publishability/repair-check/receipt/verify";

export type GlobalPublishabilityRepairCheckStatus = "ready-to-rerun" | "needs-review" | "blocked";
export type GlobalPublishabilityRepairCheckDecision = "rerun-publishability" | "sponsor-review" | "no-send";

export type GlobalPublishabilityRepairCheckReceiptPayload = {
  receiptVersion: typeof GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERSION;
  reportId: string;
  sourceReceiptDecision: GlobalPublishabilityReceiptPayload["decision"];
  sourceReceiptChecksum: string;
  checkedAt: string;
  status: GlobalPublishabilityRepairCheckStatus;
  decision: GlobalPublishabilityRepairCheckDecision;
  summary: string;
  nextAction: string;
  requiredProofCount: number;
  suppliedProofCount: number;
  missingProofCount: number;
  verifiedCount: number;
  watchCount: number;
  blockedCount: number;
  score: number;
  step: {
    id: string;
    ticketId: string;
    sequence: number;
    priority: "now" | "next" | "verify";
    status: "pass" | "watch" | "block";
    owner: string;
    title: string;
    proofSlot: string;
    proofRequirements: GlobalPublishabilityRepairProofRequirement[];
    acceptanceSignal: string;
    recheckSignal: string;
    shareGate: string;
  };
  proofSummary: Pick<PublicProofLinkVerificationSummary, "checkedAt" | "verifiedCount" | "totalCount" | "score">;
  proofResults: PublicProofLinkVerification[];
};

export type GlobalPublishabilityRepairCheckReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type GlobalPublishabilityRepairCheckReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERIFY_PATH;
  payload: GlobalPublishabilityRepairCheckReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: GlobalPublishabilityRepairCheckReceiptVerification;
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

export function globalPublishabilityRepairCheckReceiptChecksum(payload: GlobalPublishabilityRepairCheckReceiptPayload) {
  const text = JSON.stringify(canonicalize(payload));
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= BigInt(text.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function verifyGlobalPublishabilityRepairCheckReceipt(input: {
  checksum: string;
  payload: GlobalPublishabilityRepairCheckReceiptPayload;
}): GlobalPublishabilityRepairCheckReceiptVerification {
  const actualChecksum = globalPublishabilityRepairCheckReceiptChecksum(input.payload);
  const expectedChecksum = input.checksum.toLowerCase();
  const verified = actualChecksum === expectedChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Global publishability repair-check receipt matches the replay payload and can be used as evidence for rerun or hold decisions."
      : "Global publishability repair-check receipt checksum does not match the replay payload. Do not accept this repair decision until the proof check is re-exported."
  };
}

function buildReceiptMarkdown(receipt: Omit<GlobalPublishabilityRepairCheckReceipt, "copyText" | "href">) {
  return [
    "# Global publishability repair-check receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Report: ${receipt.payload.reportId}`,
    `Source receipt checksum: ${receipt.payload.sourceReceiptChecksum}`,
    `Status: ${receipt.payload.status}`,
    `Decision: ${receipt.payload.decision}`,
    `Step: ${receipt.payload.step.sequence}. ${receipt.payload.step.title}`,
    `Proof: ${receipt.payload.verifiedCount}/${receipt.payload.requiredProofCount} verified, ${receipt.payload.missingProofCount} missing, ${receipt.payload.blockedCount} blocked, ${receipt.payload.watchCount} watch`,
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
    "```",
    "",
    "Replay rule: Recompute fnv1a-64 over the repair-check replay payload before accepting a forwarded repair or no-send decision."
  ].join("\n");
}

export function buildGlobalPublishabilityRepairCheckReceipt(
  payload: GlobalPublishabilityRepairCheckReceiptPayload
): GlobalPublishabilityRepairCheckReceipt {
  const checksum = globalPublishabilityRepairCheckReceiptChecksum(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyGlobalPublishabilityRepairCheckReceipt({ checksum, payload });
  const partial: Omit<GlobalPublishabilityRepairCheckReceipt, "copyText" | "href"> = {
    receiptId: `global-publishability-repair-check-${payload.status}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERIFY_PATH,
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
