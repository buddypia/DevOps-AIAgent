export const QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION = "quick-workflow-pilot-run-log.v1";
export const QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH = "/api/quick-workflow-pilot-run-log/verify";

export type QuickWorkflowPilotRunLogStatus = "ready" | "watch" | "blocked";

export type QuickWorkflowPilotRunLogDecision =
  | "send-closeout-note"
  | "repair-evidence-gaps"
  | "start-run-log"
  | "hold-run";

export type QuickWorkflowPilotRunLogTaskId =
  | "day-0-kickoff"
  | "day-3-proof-recheck"
  | "day-7-value-snapshot"
  | "day-14-pilot-review"
  | "day-30-value-acceptance";

export type QuickWorkflowPilotRunLogReceiptPayload = {
  receiptVersion: typeof QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION;
  source: "quick-workflow-pilot-run-log";
  status: QuickWorkflowPilotRunLogStatus;
  decision: QuickWorkflowPilotRunLogDecision;
  buyer: string;
  workflow: string;
  runWindow: string;
  sourceKickoffReceiptId: string;
  sourceKickoffChecksum: string;
  evidenceScore: number;
  readyCount: number;
  watchCount: number;
  blockedCount: number;
  missingProofCount: number;
  evidenceExcerpt: string;
  tasks: Array<{
    id: QuickWorkflowPilotRunLogTaskId;
    status: QuickWorkflowPilotRunLogStatus;
    owner: string;
    dueDate: string;
    foundSignals: string[];
    missingSignals: string[];
  }>;
};

export type QuickWorkflowPilotRunLogVerificationRequest = {
  checksum: string;
  payload: QuickWorkflowPilotRunLogReceiptPayload;
};

export type QuickWorkflowPilotRunLogVerification = {
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

export function quickWorkflowPilotRunLogPayloadJson(payload: QuickWorkflowPilotRunLogReceiptPayload) {
  return canonicalJson(payload);
}

export function quickWorkflowPilotRunLogChecksum(payload: QuickWorkflowPilotRunLogReceiptPayload) {
  return stablePacketHash(quickWorkflowPilotRunLogPayloadJson(payload));
}

export function quickWorkflowPilotRunLogRequestJson(input: QuickWorkflowPilotRunLogVerificationRequest) {
  return canonicalJson(input);
}

export function quickWorkflowPilotRunLogVerifierHref(verificationRequestJson: string) {
  const params = new URLSearchParams({
    request: verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

export function verifyQuickWorkflowPilotRunLogReceipt(input: QuickWorkflowPilotRunLogVerificationRequest): QuickWorkflowPilotRunLogVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickWorkflowPilotRunLogChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Quick workflow pilot run log checksum matches the buyer, workflow, kickoff receipt, run window, evidence score, missing proof count, and task evidence status."
      : "Quick workflow pilot run log checksum does not match the exported run log. Re-export the run log before using it for buyer closeout."
  };
}
