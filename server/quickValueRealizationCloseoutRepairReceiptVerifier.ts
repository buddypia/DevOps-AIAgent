import { z } from "zod";
import {
  QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_RECEIPT_VERSION,
  QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH,
  verifyQuickValueRealizationCloseoutRepairAcknowledgementReceipt,
  type QuickValueRealizationCloseoutRepairAcknowledgementPayload
} from "../src/quickValueRealizationCloseoutRepairReceipt.js";

export { QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH };

const RepairStatusSchema = z.enum(["ready", "watch", "blocked"]);

const RepairAcknowledgementItemSchema = z.object({
  id: z.string().trim().min(1).max(180),
  taskId: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(220),
  status: RepairStatusSchema,
  reason: z.enum(["source-ledger-repair", "evidence-gap"]),
  owner: z.string().trim().min(1).max(180),
  matchedSignals: z.array(z.string().trim().min(1).max(180)).max(10),
  missingSignals: z.array(z.string().trim().min(1).max(180)).max(10),
  sourceStatus: RepairStatusSchema,
  evidenceStatus: RepairStatusSchema,
  requiredAction: z.string().trim().min(1).max(1800),
  acceptance: z.string().trim().min(1).max(1800),
  href: z.string().max(30000)
});

const RepairAcknowledgementPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_RECEIPT_VERSION),
  status: RepairStatusSchema,
  buyer: z.string().trim().min(1).max(280),
  sourceCloseoutReceiptId: z.string().trim().min(1).max(220),
  sourceCloseoutChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  sourceLedgerReceiptId: z.string().trim().min(1).max(220),
  sourceLedgerChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  repairQueueStatus: RepairStatusSchema,
  repairQueueItemCount: z.number().int().min(0).max(4),
  sourceRepairCount: z.number().int().min(0).max(4),
  evidenceGapCount: z.number().int().min(0).max(4),
  acknowledgedCount: z.number().int().min(0).max(4),
  requiredAcknowledgementCount: z.number().int().min(0).max(4),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  ownerEvidence: z.string().trim().min(1).max(12000),
  items: z.array(RepairAcknowledgementItemSchema).max(4)
});

const RepairAcknowledgementVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: RepairAcknowledgementPayloadSchema
});

export function verifyQuickValueRealizationCloseoutRepairAcknowledgementRequest(input: unknown) {
  const parsed = RepairAcknowledgementVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickValueRealizationCloseoutRepairAcknowledgementPayload;
  const verification = verifyQuickValueRealizationCloseoutRepairAcknowledgementReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-value-realization-closeout-repair.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        buyer: payload.buyer,
        sourceCloseoutReceiptId: payload.sourceCloseoutReceiptId,
        sourceLedgerReceiptId: payload.sourceLedgerReceiptId,
        repairQueueStatus: payload.repairQueueStatus,
        repairQueueItemCount: payload.repairQueueItemCount,
        sourceRepairCount: payload.sourceRepairCount,
        evidenceGapCount: payload.evidenceGapCount,
        acknowledgedCount: payload.acknowledgedCount,
        requiredAcknowledgementCount: payload.requiredAcknowledgementCount,
        nextOwner: payload.nextOwner,
        nextAction: payload.nextAction,
        itemCount: payload.items.length
      }
    }
  };
}
