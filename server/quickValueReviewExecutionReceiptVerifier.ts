import { z } from "zod";
import {
  QUICK_VALUE_REVIEW_EXECUTION_RECEIPT_VERSION,
  QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH,
  verifyQuickValueReviewExecutionReceipt,
  type QuickValueReviewExecutionPayload
} from "../src/quickValueReviewExecutionReceipt.js";

export { QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH };

const ExecutionStatusSchema = z.enum(["ready", "watch", "blocked"]);
const ExecutionDecisionSchema = z.enum(["expand-rollout", "revise-rollout", "stop-rollout", "hold-review"]);

const ExecutionTaskSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(220),
  status: ExecutionStatusSchema,
  owner: z.string().trim().min(1).max(180),
  dueWindow: z.string().trim().min(1).max(220),
  command: z.string().trim().min(1).max(1800),
  evidence: z.string().trim().min(1).max(1800),
  acceptance: z.string().trim().min(1).max(1800)
});

const ExecutionPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_VALUE_REVIEW_EXECUTION_RECEIPT_VERSION),
  status: ExecutionStatusSchema,
  decision: ExecutionDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  sourceReviewDecision: z.string().trim().min(1).max(80),
  sourceAcceptanceReceiptId: z.string().trim().min(1).max(220),
  sourceAcceptanceChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  sourceCloseoutReceiptId: z.string().trim().min(1).max(220),
  sourceCloseoutChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  retainedValueYen: z.number().int().min(0).max(1_000_000_000),
  retainedValueTargetYen: z.number().int().min(0).max(1_000_000_000),
  reviewQuestion: z.string().trim().min(1).max(1800),
  buyerAsk: z.string().trim().min(1).max(1800),
  readyTaskCount: z.number().int().min(0).max(5),
  taskCount: z.number().int().min(5).max(5),
  blockedTaskCount: z.number().int().min(0).max(5),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  guardrails: z.array(z.string().trim().min(1).max(800)).min(3).max(3),
  tasks: z.array(ExecutionTaskSchema).min(5).max(5)
});

const ExecutionVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: ExecutionPayloadSchema
});

export function verifyQuickValueReviewExecutionRequest(input: unknown) {
  const parsed = ExecutionVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickValueReviewExecutionPayload;
  const verification = verifyQuickValueReviewExecutionReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-value-review-execution.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        sourceReviewDecision: payload.sourceReviewDecision,
        sourceAcceptanceReceiptId: payload.sourceAcceptanceReceiptId,
        sourceCloseoutReceiptId: payload.sourceCloseoutReceiptId,
        retainedValueYen: payload.retainedValueYen,
        retainedValueTargetYen: payload.retainedValueTargetYen,
        readyTaskCount: payload.readyTaskCount,
        taskCount: payload.taskCount,
        blockedTaskCount: payload.blockedTaskCount,
        nextOwner: payload.nextOwner,
        guardrailCount: payload.guardrails.length
      }
    }
  };
}
