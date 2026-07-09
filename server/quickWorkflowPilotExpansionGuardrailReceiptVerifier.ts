import { z } from "zod";
import {
  QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION,
  QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH,
  verifyQuickWorkflowPilotExpansionGuardrailReceipt,
  type QuickWorkflowPilotExpansionGuardrailReceiptPayload
} from "../src/quickWorkflowPilotExpansionGuardrailReceipt.js";

export { QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH };

const ExpansionGuardrailStatusSchema = z.enum(["ready", "watch", "blocked"]);
const ExpansionGuardrailDecisionSchema = z.enum(["expand-next-window", "repair-before-expansion", "stop-expansion"]);
const ExpansionGuardrailCheckIdSchema = z.enum([
  "decision-brief-verified",
  "value-floor-met",
  "stop-rule-safe",
  "owner-acceptance-recorded",
  "receipt-chain-attached",
  "next-window-scoped"
]);

const ExpansionGuardrailCheckSchema = z.object({
  id: ExpansionGuardrailCheckIdSchema,
  status: ExpansionGuardrailStatusSchema,
  owner: z.string().trim().min(1).max(180),
  evidence: z.string().trim().min(1).max(1800),
  action: z.string().trim().min(1).max(1800)
});

const ExpansionGuardrailPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION),
  source: z.literal("quick-workflow-pilot-expansion-guardrail"),
  status: ExpansionGuardrailStatusSchema,
  decision: ExpansionGuardrailDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  workflow: z.string().trim().min(1).max(1600),
  measuredMonthlyValueYen: z.number().int().min(0).max(1_000_000_000),
  valueFloorYen: z.number().int().min(0).max(1_000_000_000),
  stopLossYen: z.number().int().min(0).max(1_000_000_000),
  decisionBriefReceiptId: z.string().trim().min(1).max(180),
  decisionBriefChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  runReceiptId: z.string().trim().min(1).max(180),
  runChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  contractReceiptId: z.string().trim().min(1).max(180),
  contractChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  evidenceExcerpt: z.string().max(600),
  checks: z.array(ExpansionGuardrailCheckSchema).min(6).max(6)
});

const ExpansionGuardrailVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: ExpansionGuardrailPayloadSchema
});

export function verifyQuickWorkflowPilotExpansionGuardrailRequest(input: unknown) {
  const parsed = ExpansionGuardrailVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickWorkflowPilotExpansionGuardrailReceiptPayload;
  const verification = verifyQuickWorkflowPilotExpansionGuardrailReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });
  const readyCheckCount = payload.checks.filter((check) => check.status === "ready").length;
  const watchCheckCount = payload.checks.filter((check) => check.status === "watch").length;
  const blockedCheckCount = payload.checks.filter((check) => check.status === "blocked").length;

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-workflow-pilot-expansion-guardrail.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        workflow: payload.workflow,
        measuredMonthlyValueYen: payload.measuredMonthlyValueYen,
        valueFloorYen: payload.valueFloorYen,
        stopLossYen: payload.stopLossYen,
        decisionBriefReceiptId: payload.decisionBriefReceiptId,
        runReceiptId: payload.runReceiptId,
        contractReceiptId: payload.contractReceiptId,
        checkCount: payload.checks.length,
        readyCheckCount,
        watchCheckCount,
        blockedCheckCount,
        firstOpenCheck: payload.checks.find((check) => check.status !== "ready")?.id ?? "none",
        nextOwner: payload.nextOwner,
        nextAction: payload.nextAction
      }
    }
  };
}
