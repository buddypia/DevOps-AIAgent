import { z } from "zod";
import {
  QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION,
  QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH,
  verifyQuickWorkflowPilotDecisionBriefReceipt,
  type QuickWorkflowPilotDecisionBriefReceiptPayload
} from "../src/quickWorkflowPilotDecisionBriefReceipt.js";

export { QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH };

const DecisionBriefStatusSchema = z.enum(["ready", "watch", "blocked"]);
const DecisionBriefDecisionSchema = z.enum(["expand-with-guardrails", "revise-evidence", "stop-before-expansion"]);
const DecisionBriefActionIdSchema = z.enum([
  "verify-run-receipt",
  "record-decision",
  "schedule-value-recheck",
  "hold-expansion"
]);

const DecisionBriefActionSchema = z.object({
  id: DecisionBriefActionIdSchema,
  status: DecisionBriefStatusSchema,
  owner: z.string().trim().min(1).max(180),
  action: z.string().trim().min(1).max(1800),
  acceptance: z.string().trim().min(1).max(1800)
});

const DecisionBriefPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION),
  source: z.literal("quick-workflow-pilot-decision-brief"),
  status: DecisionBriefStatusSchema,
  decision: DecisionBriefDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  workflow: z.string().trim().min(1).max(1600),
  decisionAsk: z.string().trim().min(1).max(1800),
  valueLine: z.string().trim().min(1).max(900),
  riskLine: z.string().trim().min(1).max(900),
  runReceiptId: z.string().trim().min(1).max(180),
  runChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  contractReceiptId: z.string().trim().min(1).max(180),
  contractChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  actions: z.array(DecisionBriefActionSchema).min(4).max(4)
});

const DecisionBriefVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: DecisionBriefPayloadSchema
});

export function verifyQuickWorkflowPilotDecisionBriefRequest(input: unknown) {
  const parsed = DecisionBriefVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickWorkflowPilotDecisionBriefReceiptPayload;
  const verification = verifyQuickWorkflowPilotDecisionBriefReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });
  const readyActionCount = payload.actions.filter((action) => action.status === "ready").length;
  const watchActionCount = payload.actions.filter((action) => action.status === "watch").length;
  const blockedActionCount = payload.actions.filter((action) => action.status === "blocked").length;

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-workflow-pilot-decision-brief.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        workflow: payload.workflow,
        runReceiptId: payload.runReceiptId,
        contractReceiptId: payload.contractReceiptId,
        actionCount: payload.actions.length,
        readyActionCount,
        watchActionCount,
        blockedActionCount,
        firstOpenAction: payload.actions.find((action) => action.status !== "ready")?.id ?? "none",
        nextOwner: payload.nextOwner,
        nextAction: payload.nextAction
      }
    }
  };
}
