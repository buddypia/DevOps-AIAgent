import { z } from "zod";
import {
  QUICK_BUYER_DECISION_REPLY_RECORD_RECEIPT_VERSION,
  QUICK_BUYER_DECISION_REPLY_RECORD_VERIFY_PATH,
  verifyQuickBuyerDecisionReplyRecordReceipt,
  type QuickBuyerDecisionReplyRecordPayload
} from "../src/quickBuyerDecisionReplyRecordReceipt.js";

export { QUICK_BUYER_DECISION_REPLY_RECORD_VERIFY_PATH };

const ReplyRecordStatusSchema = z.enum(["ready", "watch", "blocked"]);
const ReplyRecordDecisionSchema = z.enum(["continue", "revise", "stop"]);
const ReplyRecordActivationModeSchema = z.enum(["pilot-start", "proof-repair", "close-audit"]);

const ReplyRecordActivationItemSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(180),
  status: ReplyRecordStatusSchema,
  owner: z.string().trim().min(1).max(180),
  command: z.string().trim().min(1).max(1600),
  evidence: z.string().trim().min(1).max(1600),
  href: z.string().max(30000)
});

const QuickBuyerDecisionReplyRecordPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_BUYER_DECISION_REPLY_RECORD_RECEIPT_VERSION),
  status: ReplyRecordStatusSchema,
  decision: ReplyRecordDecisionSchema,
  label: z.string().trim().min(1).max(180),
  headline: z.string().trim().min(1).max(280),
  buyer: z.string().trim().min(1).max(280),
  confidence: z.number().int().min(0).max(100),
  buyerReply: z.string().trim().min(1).max(1600),
  matchedSignals: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  proof: z.string().trim().min(1).max(1800),
  onePagerReceiptId: z.string().trim().min(1).max(220),
  onePagerChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  activation: z.object({
    mode: ReplyRecordActivationModeSchema,
    status: ReplyRecordStatusSchema,
    label: z.string().trim().min(1).max(180),
    recommendedReply: ReplyRecordDecisionSchema,
    sourceReceiptId: z.string().trim().min(1).max(220),
    sourceChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
    primaryHref: z.string().max(30000),
    primaryLabel: z.string().trim().min(1).max(180),
    items: z.array(ReplyRecordActivationItemSchema).min(1).max(6)
  })
});

const QuickBuyerDecisionReplyRecordReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: QuickBuyerDecisionReplyRecordPayloadSchema
});

export function verifyQuickBuyerDecisionReplyRecordRequest(input: unknown) {
  const parsed = QuickBuyerDecisionReplyRecordReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickBuyerDecisionReplyRecordPayload;
  const verification = verifyQuickBuyerDecisionReplyRecordReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-buyer-decision-reply-record.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        confidence: payload.confidence,
        onePagerReceiptId: payload.onePagerReceiptId,
        activationMode: payload.activation.mode,
        activationItemCount: payload.activation.items.length,
        nextOwner: payload.nextOwner
      }
    }
  };
}
