import { z } from "zod";
import {
  QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERIFY_PATH,
  QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERSION,
  verifyQuickBuyerEvidenceResponseOwnerPacketReceipt,
  type QuickBuyerEvidenceResponseOwnerPacketReceiptPayload
} from "../src/quickBuyerEvidenceResponseOwnerPacketReceipt.js";

export { QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERIFY_PATH };

const QuickBuyerEvidenceResponseOwnerPacketStatusSchema = z.enum(["ready", "watch", "blocked"]);
const QuickBuyerEvidenceResponseOwnerPacketStateSchema = z.enum(["empty", "invalid", "mismatch", "wrong-pack", "verified"]);

const QuickBuyerEvidenceResponseOwnerPacketRunbookItemSchema = z.object({
  id: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(180),
  owner: z.string().trim().min(1).max(180),
  window: z.string().trim().min(1).max(180),
  action: z.string().trim().min(1).max(1600),
  evidence: z.string().trim().min(1).max(1200),
  proof: z.string().trim().min(1).max(30000),
  status: QuickBuyerEvidenceResponseOwnerPacketStatusSchema
});

const QuickBuyerEvidenceResponseOwnerPacketReceiptPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERSION),
  status: QuickBuyerEvidenceResponseOwnerPacketStatusSchema,
  state: QuickBuyerEvidenceResponseOwnerPacketStateSchema,
  label: z.string().trim().min(1).max(180),
  buyer: z.string().trim().min(1).max(280),
  owner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  evidenceReceiptId: z.string().trim().regex(/^quick-conversion-(ready|watch|blocked)-[a-f0-9]{8}$/i),
  evidenceChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  responseReceiptChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  reviewerLine: z.string().trim().min(1).max(280),
  runbook: z.array(QuickBuyerEvidenceResponseOwnerPacketRunbookItemSchema).min(1).max(6),
  ownerPacketMarkdown: z.string().trim().min(1).max(12000),
  proof: z.string().trim().min(1).max(1800)
});

const QuickBuyerEvidenceResponseOwnerPacketReceiptRequestSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: QuickBuyerEvidenceResponseOwnerPacketReceiptPayloadSchema
});

export function verifyQuickBuyerEvidenceResponseOwnerPacketReceiptRequest(input: unknown) {
  const parsed = QuickBuyerEvidenceResponseOwnerPacketReceiptRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickBuyerEvidenceResponseOwnerPacketReceiptPayload;
  const verification = verifyQuickBuyerEvidenceResponseOwnerPacketReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-buyer-evidence-response-owner-packet.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        state: payload.state,
        label: payload.label,
        buyer: payload.buyer,
        owner: payload.owner,
        evidenceReceiptId: payload.evidenceReceiptId,
        evidenceChecksum: payload.evidenceChecksum,
        responseReceiptChecksum: payload.responseReceiptChecksum,
        runbookItemCount: payload.runbook.length,
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
