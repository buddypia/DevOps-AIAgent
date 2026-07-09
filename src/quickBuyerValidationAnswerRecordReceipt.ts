export const QUICK_BUYER_VALIDATION_ANSWER_RECORD_RECEIPT_VERSION = "quick-buyer-validation-answer-record.v1";
export const QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH = "/api/quick-buyer-validation-answer-record/verify";

export type QuickBuyerValidationAnswerRecordStatus = "ready" | "watch" | "blocked";
export type QuickBuyerValidationAnswerRecordDecision = "continue" | "revise" | "stop";
export type QuickBuyerValidationAnswerRecordQuestionId = "pain" | "frequency" | "value" | "trust" | "commitment";

export type QuickBuyerValidationAnswerRecordPayload = {
  receiptVersion: typeof QUICK_BUYER_VALIDATION_ANSWER_RECORD_RECEIPT_VERSION;
  status: QuickBuyerValidationAnswerRecordStatus;
  buyer: string;
  primaryAsk: string;
  answeredCount: number;
  totalCount: number;
  confidence: number;
  recommendedBuyerDecision: QuickBuyerValidationAnswerRecordDecision;
  decisionReason: string;
  decisionAction: string;
  nextOwner: string;
  nextAction: string;
  sourceReceiptId: string;
  sourceChecksum: string;
  buyerAnswer: string;
  items: Array<{
    id: QuickBuyerValidationAnswerRecordQuestionId;
    label: string;
    status: QuickBuyerValidationAnswerRecordStatus;
    sourceStatus: QuickBuyerValidationAnswerRecordStatus;
    owner: string;
    matchedSignals: string[];
    missingSignals: string[];
    action: string;
    href: string;
  }>;
};

export type QuickBuyerValidationAnswerRecordVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type QuickBuyerValidationAnswerRecordVerificationRequest = {
  checksum: string;
  payload: QuickBuyerValidationAnswerRecordPayload;
};

export function quickBuyerValidationAnswerRecordDecision(input: {
  status: QuickBuyerValidationAnswerRecordStatus;
  answeredCount: number;
  totalCount: number;
  confidence: number;
  firstOpen?: {
    label: string;
    missingSignal?: string;
    action: string;
  };
}): {
  recommendedBuyerDecision: QuickBuyerValidationAnswerRecordDecision;
  decisionReason: string;
  decisionAction: string;
} {
  if (input.status === "ready" && input.answeredCount === input.totalCount && input.confidence >= 85) {
    return {
      recommendedBuyerDecision: "continue",
      decisionReason: "All five answers matched required signals and proof is ready.",
      decisionAction: "Record continue and schedule the pilot review with the verifier."
    };
  }
  if (input.answeredCount > 0 || input.confidence >= 35) {
    return {
      recommendedBuyerDecision: "revise",
      decisionReason: input.firstOpen?.missingSignal ? `${input.firstOpen.label} is missing ${input.firstOpen.missingSignal}.` : "Answer or proof evidence still needs repair.",
      decisionAction: input.firstOpen?.action ?? "Repair the buyer answer evidence, then rerun validation before asking for approval."
    };
  }
  return {
    recommendedBuyerDecision: "stop",
    decisionReason: "The validation record has too little concrete evidence.",
    decisionAction: "Do not route approval; reopen discovery or stop this pilot ask."
  };
}

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

export function quickBuyerValidationAnswerRecordPayloadJson(payload: QuickBuyerValidationAnswerRecordPayload) {
  return canonicalJson(payload);
}

export function quickBuyerValidationAnswerRecordChecksum(payload: QuickBuyerValidationAnswerRecordPayload) {
  return stablePacketHash(quickBuyerValidationAnswerRecordPayloadJson(payload));
}

export function quickBuyerValidationAnswerRecordVerificationRequestJson(input: QuickBuyerValidationAnswerRecordVerificationRequest) {
  return canonicalJson(input);
}

export function verifyQuickBuyerValidationAnswerRecordReceipt(
  input: QuickBuyerValidationAnswerRecordVerificationRequest
): QuickBuyerValidationAnswerRecordVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = quickBuyerValidationAnswerRecordChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Buyer validation answer record checksum matches the structured answer evidence payload."
      : "Buyer validation answer record checksum does not match the structured answer evidence payload. Do not accept this validation answer until the record is re-exported from the source workspace."
  };
}
