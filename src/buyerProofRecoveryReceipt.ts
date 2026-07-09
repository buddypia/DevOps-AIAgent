import type {
  BuyerProofRecoveryPlan,
  BuyerProofRecoveryRepairPacket,
  BuyerProofRecoverySeverity,
  BuyerProofRecoveryStep,
  BuyerProofRecoveryTaskLedger
} from "./buyerProofRecoveryPlan.js";

export const BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH = "/api/buyer-proof-recovery/receipt/verify";

export type BuyerProofRecoveryReceiptPayload = {
  receiptVersion: "buyer-proof-recovery.v1";
  severity: BuyerProofRecoverySeverity;
  shareInstruction: string;
  checkedAt: string;
  openTaskCount: number;
  blockedTaskCount: number;
  watchTaskCount: number;
  firstAction: string;
  steps: Array<Pick<BuyerProofRecoveryStep, "id" | "label" | "status" | "owner" | "due" | "source" | "action" | "acceptance"> & { href: string }>;
  resumeCriteria: string[];
  repairPacket: Pick<BuyerProofRecoveryRepairPacket, "subject" | "owner" | "due" | "severity">;
  taskLedger: Pick<BuyerProofRecoveryTaskLedger, "filename" | "taskCount" | "csvText">;
};

export type BuyerProofRecoveryReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type BuyerProofRecoveryReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH;
  payload: BuyerProofRecoveryReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: BuyerProofRecoveryReceiptVerification;
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

export function verifyBuyerProofRecoveryReceipt(receipt: Pick<BuyerProofRecoveryReceipt, "checksum" | "payload">): BuyerProofRecoveryReceiptVerification {
  const actualChecksum = stableDigest(receipt.payload);
  const verified = actualChecksum === receipt.checksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum: receipt.checksum,
    actualChecksum,
    instruction: verified
      ? "Recovery receipt checksum matches the attached replay payload."
      : "Recovery receipt checksum does not match the attached replay payload. Do not accept this repair decision until the recovery desk is re-exported."
  };
}

function buildReceiptMarkdown(receipt: Omit<BuyerProofRecoveryReceipt, "copyText" | "href">) {
  return [
    "# Buyer proof recovery receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Severity: ${receipt.payload.severity}`,
    `Share instruction: ${receipt.payload.shareInstruction}`,
    `Open tasks: ${receipt.payload.openTaskCount}`,
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
    "Replay rule: Recompute fnv1a-64 over the recovery replay payload before accepting a forwarded repair decision."
  ].join("\n");
}

export function buildBuyerProofRecoveryReceipt(plan: BuyerProofRecoveryPlan): BuyerProofRecoveryReceipt {
  const payload: BuyerProofRecoveryReceiptPayload = {
    receiptVersion: "buyer-proof-recovery.v1",
    severity: plan.severity,
    shareInstruction: plan.shareInstruction,
    checkedAt: plan.checkedAt || "not checked",
    openTaskCount: plan.openTaskCount,
    blockedTaskCount: plan.blockedTaskCount,
    watchTaskCount: plan.watchTaskCount,
    firstAction: plan.firstAction,
    steps: plan.steps.map((step) => ({
      id: step.id,
      label: step.label,
      status: step.status,
      owner: step.owner,
      due: step.due,
      source: step.source,
      action: step.action,
      acceptance: step.acceptance,
      href: step.href ?? ""
    })),
    resumeCriteria: plan.resumeCriteria,
    repairPacket: {
      subject: plan.repairPacket.subject,
      owner: plan.repairPacket.owner,
      due: plan.repairPacket.due,
      severity: plan.repairPacket.severity
    },
    taskLedger: {
      filename: plan.taskLedger.filename,
      taskCount: plan.taskLedger.taskCount,
      csvText: plan.taskLedger.csvText
    }
  };
  const checksum = stableDigest(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyBuyerProofRecoveryReceipt({ checksum, payload });
  const partial: Omit<BuyerProofRecoveryReceipt, "copyText" | "href"> = {
    receiptId: `buyer-proof-recovery-${payload.severity}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH,
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
