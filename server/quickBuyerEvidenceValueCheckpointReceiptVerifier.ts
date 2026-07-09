import { z } from "zod";
import {
  QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_RECEIPT_VERSION,
  QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_VERIFY_PATH,
  QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_RECEIPT_VERSION,
  QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_VERIFY_PATH,
  verifyQuickBuyerEvidenceValueCheckpointReceipt,
  verifyQuickBuyerEvidenceValueOwnerCloseoutReceipt,
  type QuickBuyerEvidenceValueCheckpointReceiptPayload,
  type QuickBuyerEvidenceValueOwnerCloseoutPayload
} from "../src/quickBuyerEvidenceValueCheckpointReceipt.js";

export { QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_VERIFY_PATH };
export { QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_VERIFY_PATH };

const CheckpointStatusSchema = z.enum(["ready", "watch", "blocked"]);
const CheckpointDecisionSchema = z.enum(["expand", "repair", "hold"]);
const CheckpointItemIdSchema = z.enum(["baseline", "proof-sample", "adoption-signal", "finance-decision", "next-window"]);

const CheckpointItemSchema = z.object({
  id: CheckpointItemIdSchema,
  label: z.string().trim().min(1).max(180),
  status: CheckpointStatusSchema,
  owner: z.string().trim().min(1).max(180),
  metric: z.string().trim().min(1).max(220),
  target: z.string().trim().min(1).max(500),
  evidence: z.string().trim().min(1).max(1800),
  action: z.string().trim().min(1).max(1800),
  href: z.string().max(30000)
});

const CheckpointPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_RECEIPT_VERSION),
  status: CheckpointStatusSchema,
  decision: CheckpointDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  workflow: z.string().trim().min(1).max(1800),
  reviewerName: z.string().trim().min(1).max(180),
  generatedAt: z.string().trim().min(1).max(80),
  checkpointStatus: CheckpointStatusSchema,
  readyCount: z.number().int().min(0).max(5),
  totalCount: z.number().int().min(5).max(5),
  currentOwner: z.string().trim().min(1).max(180),
  currentAction: z.string().trim().min(1).max(1800),
  actualValueSignal: z.string().trim().min(1).max(1800),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  sourceReceiptId: z.string().trim().min(1).max(220),
  sourceChecksum: z.string().trim().min(1).max(120),
  proof: z.string().trim().min(1).max(2400),
  items: z.array(CheckpointItemSchema).min(5).max(5)
});

const CheckpointVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: CheckpointPayloadSchema
});

const ValueOwnerCloseoutDecisionSchema = z.enum(["accept-owner-closeout", "hold-owner-closeout"]);

const ValueOwnerCloseoutTaskSchema = z.object({
  id: z.string().trim().min(1).max(160),
  label: z.string().trim().min(1).max(220),
  status: CheckpointStatusSchema,
  owner: z.string().trim().min(1).max(180),
  dueLabel: z.string().trim().min(1).max(120),
  action: z.string().trim().min(1).max(1800),
  closeCondition: z.string().trim().min(1).max(1800),
  evidence: z.string().trim().min(1).max(2400),
  href: z.string().max(30000),
  closed: z.boolean(),
  outcomeNote: z.string().trim().min(1).max(1800)
});

const ValueOwnerCloseoutPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_RECEIPT_VERSION),
  status: CheckpointStatusSchema,
  decision: ValueOwnerCloseoutDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  workflow: z.string().trim().min(1).max(1800),
  acceptedBy: z.string().trim().min(1).max(180),
  generatedAt: z.string().trim().min(1).max(80),
  evidenceNote: z.string().trim().min(1).max(1800),
  sourceReceiptId: z.string().trim().min(1).max(220),
  sourceChecksum: z.string().trim().min(1).max(120),
  sourceCheckpointChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  sourceHandoffStatus: CheckpointStatusSchema,
  closedTaskCount: z.number().int().min(0).max(8),
  taskCount: z.number().int().min(1).max(8),
  openTaskCount: z.number().int().min(0).max(8),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  tasks: z.array(ValueOwnerCloseoutTaskSchema).min(1).max(8)
});

const ValueOwnerCloseoutVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: ValueOwnerCloseoutPayloadSchema
});

export function verifyQuickBuyerEvidenceValueCheckpointRequest(input: unknown) {
  const parsed = CheckpointVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickBuyerEvidenceValueCheckpointReceiptPayload;
  const verification = verifyQuickBuyerEvidenceValueCheckpointReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-buyer-evidence-value-checkpoint.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        reviewerName: payload.reviewerName,
        checkpointStatus: payload.checkpointStatus,
        readyCount: payload.readyCount,
        totalCount: payload.totalCount,
        sourceReceiptId: payload.sourceReceiptId,
        sourceChecksum: payload.sourceChecksum,
        nextOwner: payload.nextOwner,
        nextAction: payload.nextAction,
        itemCount: payload.items.length
      }
    }
  };
}

export function verifyQuickBuyerEvidenceValueOwnerCloseoutRequest(input: unknown) {
  const parsed = ValueOwnerCloseoutVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickBuyerEvidenceValueOwnerCloseoutPayload;
  const verification = verifyQuickBuyerEvidenceValueOwnerCloseoutReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-buyer-evidence-value-owner-closeout.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        acceptedBy: payload.acceptedBy,
        sourceReceiptId: payload.sourceReceiptId,
        sourceCheckpointChecksum: payload.sourceCheckpointChecksum,
        sourceHandoffStatus: payload.sourceHandoffStatus,
        closedTaskCount: payload.closedTaskCount,
        taskCount: payload.taskCount,
        openTaskCount: payload.openTaskCount,
        nextOwner: payload.nextOwner,
        nextAction: payload.nextAction
      }
    }
  };
}
