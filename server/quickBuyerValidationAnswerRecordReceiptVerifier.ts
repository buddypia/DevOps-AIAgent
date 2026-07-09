import { z } from "zod";
import {
  QUICK_BUYER_VALIDATION_ANSWER_RECORD_RECEIPT_VERSION,
  QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH,
  verifyQuickBuyerValidationAnswerRecordReceipt,
  type QuickBuyerValidationAnswerRecordPayload
} from "../src/quickBuyerValidationAnswerRecordReceipt.js";

export { QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH };

const ValidationAnswerRecordStatusSchema = z.enum(["ready", "watch", "blocked"]);
const ValidationAnswerRecordDecisionSchema = z.enum(["continue", "revise", "stop"]);
const ValidationAnswerQuestionIdSchema = z.enum(["pain", "frequency", "value", "trust", "commitment"]);

const ValidationAnswerRecordItemSchema = z.object({
  id: ValidationAnswerQuestionIdSchema,
  label: z.string().trim().min(1).max(180),
  status: ValidationAnswerRecordStatusSchema,
  sourceStatus: ValidationAnswerRecordStatusSchema,
  owner: z.string().trim().min(1).max(180),
  matchedSignals: z.array(z.string().trim().min(1).max(160)).max(20),
  missingSignals: z.array(z.string().trim().min(1).max(160)).max(20),
  action: z.string().trim().min(1).max(1800),
  href: z.string().max(30000)
});

const QuickBuyerValidationAnswerRecordPayloadSchema = z
  .object({
    receiptVersion: z.literal(QUICK_BUYER_VALIDATION_ANSWER_RECORD_RECEIPT_VERSION),
    status: ValidationAnswerRecordStatusSchema,
    buyer: z.string().trim().min(1).max(280),
    primaryAsk: z.string().trim().min(1).max(600),
    answeredCount: z.number().int().min(0).max(10),
    totalCount: z.number().int().min(1).max(10),
    confidence: z.number().int().min(0).max(100),
    recommendedBuyerDecision: ValidationAnswerRecordDecisionSchema,
    decisionReason: z.string().trim().min(1).max(600),
    decisionAction: z.string().trim().min(1).max(1200),
    nextOwner: z.string().trim().min(1).max(180),
    nextAction: z.string().trim().min(1).max(1800),
    sourceReceiptId: z.string().trim().min(1).max(220),
    sourceChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
    buyerAnswer: z.string().trim().min(1).max(2000),
    items: z.array(ValidationAnswerRecordItemSchema).min(1).max(8)
  })
  .superRefine((payload, context) => {
    if (payload.answeredCount > payload.totalCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answeredCount"],
        message: "answeredCount must not exceed totalCount"
      });
    }
    if (payload.items.length !== payload.totalCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "items length must match totalCount"
      });
    }
  });

const QuickBuyerValidationAnswerRecordReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: QuickBuyerValidationAnswerRecordPayloadSchema
});

export function verifyQuickBuyerValidationAnswerRecordRequest(input: unknown) {
  const parsed = QuickBuyerValidationAnswerRecordReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickBuyerValidationAnswerRecordPayload;
  const verification = verifyQuickBuyerValidationAnswerRecordReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-buyer-validation-answer-record.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        buyer: payload.buyer,
        answeredCount: payload.answeredCount,
        totalCount: payload.totalCount,
        confidence: payload.confidence,
        recommendedBuyerDecision: payload.recommendedBuyerDecision,
        decisionReason: payload.decisionReason,
        decisionAction: payload.decisionAction,
        sourceReceiptId: payload.sourceReceiptId,
        nextOwner: payload.nextOwner,
        nextAction: payload.nextAction,
        readyCount: payload.items.filter((item) => item.status === "ready").length,
        watchCount: payload.items.filter((item) => item.status === "watch").length,
        blockedCount: payload.items.filter((item) => item.status === "blocked").length
      }
    }
  };
}
