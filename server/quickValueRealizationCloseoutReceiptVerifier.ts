import { z } from "zod";
import {
  QUICK_VALUE_REALIZATION_CLOSEOUT_RECEIPT_VERSION,
  QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH,
  verifyQuickValueRealizationCloseoutReceipt,
  type QuickValueRealizationCloseoutPayload
} from "../src/quickValueRealizationCloseoutReceipt.js";

export { QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH };

const CloseoutStatusSchema = z.enum(["ready", "watch", "blocked"]);
const CloseoutDecisionSchema = z.enum(["expand", "revise", "stop", "missing"]);

const CloseoutTaskSchema = z.object({
  id: z.string().trim().min(1).max(120),
  window: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(180),
  status: CloseoutStatusSchema,
  owner: z.string().trim().min(1).max(180),
  outcome: z.string().trim().min(1).max(1800),
  matchedSignals: z.array(z.string().trim().min(1).max(180)).max(12),
  missingSignals: z.array(z.string().trim().min(1).max(180)).max(12),
  evidence: z.string().trim().min(1).max(1800),
  href: z.string().max(30000)
});

const CloseoutRepairItemSchema = z.object({
  id: z.string().trim().min(1).max(160),
  taskId: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(220),
  status: CloseoutStatusSchema,
  reason: z.enum(["source-ledger-repair", "evidence-gap"]),
  owner: z.string().trim().min(1).max(180),
  sourceStatus: CloseoutStatusSchema,
  evidenceStatus: CloseoutStatusSchema,
  action: z.string().trim().min(1).max(1800),
  proof: z.string().trim().min(1).max(1800),
  acceptance: z.string().trim().min(1).max(1800),
  href: z.string().max(30000)
});

const CloseoutRepairQueueSchema = z.object({
  status: CloseoutStatusSchema,
  headline: z.string().trim().min(1).max(280),
  summary: z.string().trim().min(1).max(1800),
  itemCount: z.number().int().min(0).max(4),
  sourceRepairCount: z.number().int().min(0).max(4),
  evidenceGapCount: z.number().int().min(0).max(4),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  items: z.array(CloseoutRepairItemSchema).max(4)
});

const QuickValueRealizationCloseoutPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_VALUE_REALIZATION_CLOSEOUT_RECEIPT_VERSION),
  status: CloseoutStatusSchema,
  buyer: z.string().trim().min(1).max(280),
  primaryAsk: z.string().trim().min(1).max(1200),
  completedCount: z.number().int().min(0).max(4),
  blockedCount: z.number().int().min(0).max(4),
  retainedValueYen: z.number().int().min(0).max(1_000_000_000),
  retainedValueTargetYen: z.number().int().min(0).max(1_000_000_000),
  decision: CloseoutDecisionSchema,
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  sourceLedgerReceiptId: z.string().trim().min(1).max(220),
  sourceLedgerChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  closeoutEvidence: z.string().trim().min(1).max(12000),
  tasks: z.array(CloseoutTaskSchema).min(4).max(4),
  repairQueue: CloseoutRepairQueueSchema
});

const QuickValueRealizationCloseoutVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: QuickValueRealizationCloseoutPayloadSchema
});

export function verifyQuickValueRealizationCloseoutRequest(input: unknown) {
  const parsed = QuickValueRealizationCloseoutVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickValueRealizationCloseoutPayload;
  const verification = verifyQuickValueRealizationCloseoutReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-value-realization-closeout.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        buyer: payload.buyer,
        decision: payload.decision,
        completedCount: payload.completedCount,
        blockedCount: payload.blockedCount,
        retainedValueYen: payload.retainedValueYen,
        retainedValueTargetYen: payload.retainedValueTargetYen,
        sourceLedgerReceiptId: payload.sourceLedgerReceiptId,
        taskCount: payload.tasks.length,
        nextOwner: payload.nextOwner,
        repairQueue: {
          status: payload.repairQueue.status,
          itemCount: payload.repairQueue.itemCount,
          sourceRepairCount: payload.repairQueue.sourceRepairCount,
          evidenceGapCount: payload.repairQueue.evidenceGapCount,
          nextOwner: payload.repairQueue.nextOwner,
          nextAction: payload.repairQueue.nextAction
        }
      }
    }
  };
}
