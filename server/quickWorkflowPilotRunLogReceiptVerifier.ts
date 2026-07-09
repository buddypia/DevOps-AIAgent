import { z } from "zod";
import {
  QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION,
  QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH,
  verifyQuickWorkflowPilotRunLogReceipt,
  type QuickWorkflowPilotRunLogReceiptPayload
} from "../src/quickWorkflowPilotRunLogReceipt.js";

export { QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH };

const RunLogStatusSchema = z.enum(["ready", "watch", "blocked"]);
const RunLogDecisionSchema = z.enum(["send-closeout-note", "repair-evidence-gaps", "start-run-log", "hold-run"]);
const RunLogTaskIdSchema = z.enum([
  "day-0-kickoff",
  "day-3-proof-recheck",
  "day-7-value-snapshot",
  "day-14-pilot-review",
  "day-30-value-acceptance"
]);

const RunLogTaskSchema = z.object({
  id: RunLogTaskIdSchema,
  status: RunLogStatusSchema,
  owner: z.string().trim().min(1).max(180),
  dueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  foundSignals: z.array(z.string().trim().min(1).max(220)).max(8),
  missingSignals: z.array(z.string().trim().min(1).max(220)).max(8)
});

const RunLogPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION),
  source: z.literal("quick-workflow-pilot-run-log"),
  status: RunLogStatusSchema,
  decision: RunLogDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  workflow: z.string().trim().min(1).max(1600),
  runWindow: z.string().trim().min(1).max(80),
  sourceKickoffReceiptId: z.string().trim().min(1).max(180),
  sourceKickoffChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  evidenceScore: z.number().int().min(0).max(100),
  readyCount: z.number().int().min(0).max(5),
  watchCount: z.number().int().min(0).max(5),
  blockedCount: z.number().int().min(0).max(5),
  missingProofCount: z.number().int().min(0).max(40),
  evidenceExcerpt: z.string().max(600),
  tasks: z.array(RunLogTaskSchema).min(5).max(5)
});

const RunLogVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: RunLogPayloadSchema
});

export function verifyQuickWorkflowPilotRunLogRequest(input: unknown) {
  const parsed = RunLogVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickWorkflowPilotRunLogReceiptPayload;
  const verification = verifyQuickWorkflowPilotRunLogReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });
  const firstOpenTask = payload.tasks.find((task) => task.status !== "ready");

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-workflow-pilot-run-log.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        workflow: payload.workflow,
        runWindow: payload.runWindow,
        sourceKickoffReceiptId: payload.sourceKickoffReceiptId,
        evidenceScore: payload.evidenceScore,
        readyCount: payload.readyCount,
        watchCount: payload.watchCount,
        blockedCount: payload.blockedCount,
        missingProofCount: payload.missingProofCount,
        taskCount: payload.tasks.length,
        firstOpenTask: firstOpenTask?.id ?? "none"
      }
    }
  };
}
