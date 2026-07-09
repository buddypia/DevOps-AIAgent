import { z } from "zod";
import {
  QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERIFY_PATH,
  QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERSION,
  verifyQuickExternalReviewOwnerPacketReceipt,
  type QuickExternalReviewOwnerPacketReceiptPayload
} from "../src/quickExternalReviewOwnerPacketReceipt.js";

export { QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERIFY_PATH };

const QuickExternalReviewOwnerPacketStatusSchema = z.enum(["ready", "watch", "blocked"]);

const QuickExternalReviewOwnerPacketRunbookItemSchema = z.object({
  id: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(180),
  owner: z.string().trim().min(1).max(180),
  window: z.string().trim().min(1).max(180),
  action: z.string().trim().min(1).max(1600),
  evidence: z.string().trim().min(1).max(1200),
  proof: z.string().trim().min(1).max(1200),
  status: QuickExternalReviewOwnerPacketStatusSchema
});

const QuickExternalReviewOwnerPacketFollowUpTaskSchema = z.object({
  id: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(180),
  status: QuickExternalReviewOwnerPacketStatusSchema,
  owner: z.string().trim().min(1).max(180),
  dueLabel: z.string().trim().min(1).max(120),
  action: z.string().trim().min(1).max(1600),
  closeCondition: z.string().trim().min(1).max(1600),
  evidence: z.string().trim().min(1).max(1200),
  proof: z.string().trim().min(1).max(1200),
  href: z.string().trim().min(1).max(1600)
});

const QuickExternalReviewOwnerPacketFollowUpLedgerSchema = z.object({
  status: QuickExternalReviewOwnerPacketStatusSchema,
  headline: z.string().trim().min(1).max(240),
  summary: z.string().trim().min(1).max(1200),
  readyCount: z.number().int().min(0).max(12),
  watchCount: z.number().int().min(0).max(12),
  blockedCount: z.number().int().min(0).max(12),
  taskTotal: z.number().int().min(0).max(12),
  firstDueLabel: z.string().trim().min(1).max(120),
  calendarStartDate: z.string().trim().max(20),
  calendarEndDate: z.string().trim().max(20),
  tasks: z.array(QuickExternalReviewOwnerPacketFollowUpTaskSchema).min(1).max(8),
  csv: z.string().trim().min(1).max(12000),
  calendarText: z.string().max(20000),
  exportMarkdown: z.string().trim().min(1).max(20000)
});

const QuickExternalReviewOwnerPacketReceiptPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERSION),
  status: QuickExternalReviewOwnerPacketStatusSchema,
  label: z.string().trim().min(1).max(180),
  buyer: z.string().trim().min(1).max(280),
  owner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  manifestReceiptId: z.string().trim().regex(/^quick-external-review-(ready|watch|blocked)-[a-f0-9]{8}$/i),
  manifestChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  responseReceiptChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  reviewerLine: z.string().trim().min(1).max(280),
  acceptanceCriteria: z.array(z.string().trim().min(1).max(1200)).min(1).max(8),
  runbook: z.array(QuickExternalReviewOwnerPacketRunbookItemSchema).min(1).max(6),
  followUpLedger: QuickExternalReviewOwnerPacketFollowUpLedgerSchema,
  ownerPacketMarkdown: z.string().trim().min(1).max(12000),
  regenerationNote: z.string().trim().min(1).max(8000),
  proof: z.string().trim().min(1).max(1800)
});

const QuickExternalReviewOwnerPacketReceiptRequestSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: QuickExternalReviewOwnerPacketReceiptPayloadSchema
});

export function verifyQuickExternalReviewOwnerPacketReceiptRequest(input: unknown) {
  const parsed = QuickExternalReviewOwnerPacketReceiptRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickExternalReviewOwnerPacketReceiptPayload;
  const verification = verifyQuickExternalReviewOwnerPacketReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-external-review-owner-packet.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        label: payload.label,
        buyer: payload.buyer,
        owner: payload.owner,
        manifestReceiptId: payload.manifestReceiptId,
        manifestChecksum: payload.manifestChecksum,
        responseReceiptChecksum: payload.responseReceiptChecksum,
        acceptanceCriteriaCount: payload.acceptanceCriteria.length,
        runbookItemCount: payload.runbook.length,
        followUpTaskCount: payload.followUpLedger.taskTotal,
        followUpFirstDue: payload.followUpLedger.firstDueLabel,
        runbook: payload.runbook.map((item) => ({
          id: item.id,
          label: item.label,
          owner: item.owner,
          window: item.window,
          status: item.status,
          action: item.action,
          evidence: item.evidence,
          proof: item.proof
        })),
        nextAction: payload.nextAction
      }
    }
  };
}
