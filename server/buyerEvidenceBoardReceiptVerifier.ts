import { z } from "zod";
import {
  BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH,
  verifyBuyerEvidenceBoardReceipt,
  type BuyerEvidenceBoardReceiptPayload
} from "../src/buyerEvidenceBoard.js";

export { BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH };

const BuyerEvidenceBoardStatusSchema = z.enum(["sendable", "review-first", "blocked"]);
const BuyerEvidenceBoardItemStatusSchema = z.enum(["ready", "watch", "blocked"]);
const BuyerEvidenceBoardItemIdSchema = z.enum(["scope", "value", "measured-run", "live-proof", "agent-trust", "decision-route"]);
const BuyerEvidenceBoardReviewQuestionIdSchema = z.enum(["workflow-approval", "value-proof", "public-proof", "agent-trust"]);
const BuyerEvidenceBoardReviewerDecisionSchema = z.enum(["send", "sponsor-review", "hold"]);

const BuyerEvidenceBoardReceiptItemSchema = z.object({
  id: BuyerEvidenceBoardItemIdSchema,
  label: z.string().trim().min(1).max(180),
  status: BuyerEvidenceBoardItemStatusSchema,
  value: z.string().trim().min(1).max(400),
  evidence: z.string().trim().min(1).max(1800),
  nextAction: z.string().trim().min(1).max(1800)
});

const BuyerEvidenceBoardReceiptReviewQuestionSchema = z.object({
  id: BuyerEvidenceBoardReviewQuestionIdSchema,
  label: z.string().trim().min(1).max(180),
  status: BuyerEvidenceBoardItemStatusSchema,
  question: z.string().trim().min(1).max(600),
  answer: z.string().trim().min(1).max(2400),
  nextAction: z.string().trim().min(1).max(1800)
});

const BuyerEvidenceBoardReceiptPayloadSchema = z.object({
  manifestVersion: z.literal("buyer-evidence-board.v1"),
  issuedAt: z.string().trim().min(1).max(80),
  status: BuyerEvidenceBoardStatusSchema,
  score: z.number().int().min(0).max(100),
  buyer: z.string().trim().min(1).max(280),
  decision: z.string().trim().min(1).max(1400),
  readyCount: z.number().int().min(0).max(6),
  itemCount: z.number().int().min(1).max(6),
  firstBlocker: z.string().trim().min(1).max(180),
  reviewerBrief: z.object({
    recommendedDecision: BuyerEvidenceBoardReviewerDecisionSchema,
    noSendRule: z.string().trim().min(1).max(1800),
    questions: z.array(BuyerEvidenceBoardReceiptReviewQuestionSchema).min(1).max(4)
  }),
  items: z.array(BuyerEvidenceBoardReceiptItemSchema).min(1).max(6)
});

const BuyerEvidenceBoardReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: BuyerEvidenceBoardReceiptPayloadSchema
});

export function verifyBuyerEvidenceBoardReceiptRequest(input: unknown) {
  const parsed = BuyerEvidenceBoardReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as BuyerEvidenceBoardReceiptPayload;
  const verification = verifyBuyerEvidenceBoardReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "buyer-evidence-board.receipt.verify",
      verification,
      receipt: {
        manifestVersion: payload.manifestVersion,
        status: payload.status,
        score: payload.score,
        buyer: payload.buyer,
        readyCount: payload.readyCount,
        itemCount: payload.itemCount,
        firstBlocker: payload.firstBlocker,
        reviewerDecision: payload.reviewerBrief.recommendedDecision,
        reviewerQuestionCount: payload.reviewerBrief.questions.length
      }
    }
  };
}
