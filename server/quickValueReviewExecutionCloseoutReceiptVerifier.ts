import { z } from "zod";
import {
  QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_RECEIPT_VERSION,
  QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH,
  verifyQuickValueReviewExecutionCloseoutReceipt,
  type QuickValueReviewExecutionCloseoutPayload
} from "../src/quickValueReviewExecutionCloseoutReceipt.js";

export { QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH };

const CloseoutStatusSchema = z.enum(["ready", "watch", "blocked"]);
const CloseoutDecisionSchema = z.enum(["accept-execution-closeout", "hold-execution-closeout"]);
const ExecutionDecisionSchema = z.enum(["expand-rollout", "revise-rollout", "stop-rollout", "hold-review"]);

const CloseoutTaskSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(220),
  status: CloseoutStatusSchema,
  owner: z.string().trim().min(1).max(180),
  dueWindow: z.string().trim().min(1).max(220),
  command: z.string().trim().min(1).max(1800),
  matchedSignals: z.array(z.string().trim().min(1).max(220)).max(8),
  missingSignals: z.array(z.string().trim().min(1).max(220)).max(8),
  evidence: z.string().trim().min(1).max(1800),
  acceptance: z.string().trim().min(1).max(1800)
});

const CloseoutPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_RECEIPT_VERSION),
  status: CloseoutStatusSchema,
  decision: CloseoutDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  executionDecision: ExecutionDecisionSchema,
  sourceExecutionReceiptId: z.string().trim().min(1).max(220),
  sourceExecutionChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  sourceAcceptanceReceiptId: z.string().trim().min(1).max(220),
  sourceCloseoutReceiptId: z.string().trim().min(1).max(220),
  readyTaskCount: z.number().int().min(0).max(5),
  taskCount: z.number().int().min(5).max(5),
  blockedTaskCount: z.number().int().min(0).max(5),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  evidenceSummary: z.string().trim().min(1).max(1800),
  tasks: z.array(CloseoutTaskSchema).min(5).max(5)
});

const CloseoutVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: CloseoutPayloadSchema
});

export function verifyQuickValueReviewExecutionCloseoutRequest(input: unknown) {
  const parsed = CloseoutVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickValueReviewExecutionCloseoutPayload;
  const verification = verifyQuickValueReviewExecutionCloseoutReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-value-review-execution-closeout.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        executionDecision: payload.executionDecision,
        sourceExecutionReceiptId: payload.sourceExecutionReceiptId,
        sourceAcceptanceReceiptId: payload.sourceAcceptanceReceiptId,
        sourceCloseoutReceiptId: payload.sourceCloseoutReceiptId,
        readyTaskCount: payload.readyTaskCount,
        taskCount: payload.taskCount,
        blockedTaskCount: payload.blockedTaskCount,
        nextOwner: payload.nextOwner
      }
    }
  };
}
