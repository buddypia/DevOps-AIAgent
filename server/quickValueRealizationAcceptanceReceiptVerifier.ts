import { z } from "zod";
import {
  QUICK_VALUE_REALIZATION_ACCEPTANCE_RECEIPT_VERSION,
  QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH,
  verifyQuickValueRealizationAcceptanceReceipt,
  type QuickValueRealizationAcceptancePayload
} from "../src/quickValueRealizationAcceptanceReceipt.js";

export { QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH };

const AcceptanceStatusSchema = z.enum(["ready", "watch", "blocked"]);
const AcceptanceDecisionSchema = z.enum(["accept-value-proof", "hold-for-operating-evidence", "hold-for-repair-acknowledgement"]);
const CloseoutDecisionSchema = z.enum(["expand", "revise", "stop", "missing"]);

const AcceptanceCheckSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(220),
  status: AcceptanceStatusSchema,
  owner: z.string().trim().min(1).max(180),
  evidence: z.string().trim().min(1).max(1800),
  acceptance: z.string().trim().min(1).max(1800)
});

const AcceptancePayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_VALUE_REALIZATION_ACCEPTANCE_RECEIPT_VERSION),
  status: AcceptanceStatusSchema,
  decision: AcceptanceDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  closeoutDecision: CloseoutDecisionSchema,
  retainedValueYen: z.number().int().min(0).max(1_000_000_000),
  retainedValueTargetYen: z.number().int().min(0).max(1_000_000_000),
  sourceCloseoutReceiptId: z.string().trim().min(1).max(220),
  sourceCloseoutChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  repairAcknowledgementReceiptId: z.string().trim().min(1).max(220),
  repairAcknowledgementChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  sourceLedgerReceiptId: z.string().trim().min(1).max(220),
  sourceLedgerChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  closeoutStatus: AcceptanceStatusSchema,
  closeoutCompletedCount: z.number().int().min(0).max(4),
  closeoutBlockedCount: z.number().int().min(0).max(4),
  repairQueueItemCount: z.number().int().min(0).max(4),
  evidenceGapCount: z.number().int().min(0).max(4),
  sourceRepairCount: z.number().int().min(0).max(4),
  repairAcknowledgementStatus: AcceptanceStatusSchema,
  acknowledgedCount: z.number().int().min(0).max(4),
  requiredAcknowledgementCount: z.number().int().min(0).max(4),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  buyerClaim: z.string().trim().min(1).max(1800),
  checks: z.array(AcceptanceCheckSchema).min(4).max(4)
});

const AcceptanceVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: AcceptancePayloadSchema
});

export function verifyQuickValueRealizationAcceptanceRequest(input: unknown) {
  const parsed = AcceptanceVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickValueRealizationAcceptancePayload;
  const verification = verifyQuickValueRealizationAcceptanceReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-value-realization-acceptance.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        closeoutDecision: payload.closeoutDecision,
        retainedValueYen: payload.retainedValueYen,
        retainedValueTargetYen: payload.retainedValueTargetYen,
        sourceCloseoutReceiptId: payload.sourceCloseoutReceiptId,
        repairAcknowledgementReceiptId: payload.repairAcknowledgementReceiptId,
        closeoutStatus: payload.closeoutStatus,
        repairAcknowledgementStatus: payload.repairAcknowledgementStatus,
        acknowledgedCount: payload.acknowledgedCount,
        requiredAcknowledgementCount: payload.requiredAcknowledgementCount,
        evidenceGapCount: payload.evidenceGapCount,
        sourceRepairCount: payload.sourceRepairCount,
        checkCount: payload.checks.length,
        nextOwner: payload.nextOwner
      }
    }
  };
}
