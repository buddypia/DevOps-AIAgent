export const QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION = "quick-workflow-conversion.v1";
export const QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH = "/api/quick-workflow-conversion/receipt/verify";

export type QuickWorkflowConversionReceiptStatus = "ready" | "watch" | "blocked";

export type QuickWorkflowConversionReceiptPayload = {
  receiptVersion: typeof QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION;
  source: "quick-workflow-intake";
  buyer: string;
  workflow: string;
  status: QuickWorkflowConversionReceiptStatus;
  decisionLabel: string;
  decisionNextAction: string;
  pilotWeekReceiptId: string;
  rows: Array<{
    id: "scope" | "value" | "pilot" | "proof" | "a2a" | "data";
    status: QuickWorkflowConversionReceiptStatus;
    value: string;
    proof: string;
  }>;
  proofItems: Array<{
    id: "targetUrl" | "protopediaUrl" | "videoUrl" | "pilotEvidenceUrl" | "workOrderEvidenceUrl";
    status: QuickWorkflowConversionReceiptStatus;
    value: string;
  }>;
};

export type QuickWorkflowConversionReceiptVerification = {
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

function stablePacketHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function quickWorkflowConversionCanonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

export function quickWorkflowConversionReceiptChecksum(payload: QuickWorkflowConversionReceiptPayload) {
  return stablePacketHash(
    [
      payload.buyer,
      payload.workflow,
      payload.status,
      payload.decisionLabel,
      payload.decisionNextAction,
      payload.pilotWeekReceiptId,
      ...payload.rows.map((row) => `${row.id}:${row.status}:${row.value}:${row.proof}`),
      ...payload.proofItems.map((item) => `${item.id}:${item.status}:${item.value}`)
    ].join("\n")
  );
}

export function verifyQuickWorkflowConversionReceipt(input: {
  checksum: string;
  payload: QuickWorkflowConversionReceiptPayload;
}): QuickWorkflowConversionReceiptVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickWorkflowConversionReceiptChecksum(input.payload);
  const verified = actualChecksum === expectedChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Quick workflow conversion receipt checksum matches the buyer room replay payload."
      : "Quick workflow conversion receipt checksum does not match the buyer room replay payload. Regenerate the buyer room before accepting this packet."
  };
}
