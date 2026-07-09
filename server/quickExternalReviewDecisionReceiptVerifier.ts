import { z } from "zod";
import {
  QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERIFY_PATH,
  QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION,
  verifyQuickExternalReviewDecisionReceipt,
  type QuickExternalReviewDecisionReceiptPayload
} from "../src/quickExternalReviewDecisionReceipt.js";

export { QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERIFY_PATH };

const QuickExternalReviewDecisionSchema = z.enum(["continue", "revise", "stop"]);
const QuickExternalReviewDecisionStatusSchema = z.enum(["ready", "watch", "blocked"]);

const QuickExternalReviewDecisionReceiptPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION),
  decision: QuickExternalReviewDecisionSchema,
  status: QuickExternalReviewDecisionStatusSchema,
  label: z.string().trim().min(1).max(180),
  reviewerName: z.string().trim().min(1).max(180),
  reviewerNote: z.string().trim().min(1).max(1600),
  buyer: z.string().trim().min(1).max(280),
  generatedAt: z.string().trim().min(1).max(80),
  manifestReceiptId: z.string().trim().regex(/^quick-(external-review|conversion)-(ready|watch|blocked)-[a-f0-9]{8}$/i),
  manifestChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  packetStatus: QuickExternalReviewDecisionStatusSchema,
  packetClearance: z.enum(["external-review", "internal-only"]),
  testsReady: z.number().int().min(0).max(20),
  testsTotal: z.number().int().min(1).max(20),
  confidence: z.number().int().min(0).max(100),
  reviewOutcome: z.string().trim().min(1).max(280),
  nextAction: z.string().trim().min(1).max(1800),
  proof: z.string().trim().min(1).max(1800)
});

const QuickExternalReviewDecisionReceiptRequestSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: QuickExternalReviewDecisionReceiptPayloadSchema
});

export function verifyQuickExternalReviewDecisionReceiptRequest(input: unknown) {
  const parsed = QuickExternalReviewDecisionReceiptRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickExternalReviewDecisionReceiptPayload;
  const verification = verifyQuickExternalReviewDecisionReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-external-review-decision.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        decision: payload.decision,
        status: payload.status,
        reviewerName: payload.reviewerName,
        buyer: payload.buyer,
        manifestReceiptId: payload.manifestReceiptId,
        packetStatus: payload.packetStatus,
        packetClearance: payload.packetClearance,
        testsReady: payload.testsReady,
        testsTotal: payload.testsTotal,
        confidence: payload.confidence,
        nextAction: payload.nextAction
      }
    }
  };
}
