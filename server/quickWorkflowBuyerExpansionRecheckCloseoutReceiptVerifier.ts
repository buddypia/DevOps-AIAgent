import { z } from "zod";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_RECEIPT_VERSION,
  QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH,
  verifyQuickWorkflowBuyerExpansionRecheckCloseoutReceipt,
  type QuickWorkflowBuyerExpansionRecheckCloseoutPayload
} from "../src/quickWorkflowBuyerExpansionRecheckCloseoutReceipt.js";

export { QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH };

const CloseoutStatusSchema = z.enum(["ready", "watch", "blocked"]);
const CloseoutDecisionSchema = z.enum(["accept-expansion", "repair-before-expansion", "stop-expansion", "hold-closeout"]);

const CloseoutCheckSchema = z.object({
  id: z.enum(["signoff-verifier", "recheck-scheduled", "actual-value", "floor-decision", "receipt-chain"]),
  label: z.string().trim().min(1).max(220),
  status: CloseoutStatusSchema,
  owner: z.string().trim().min(1).max(180),
  matchedSignals: z.array(z.string().trim().min(1).max(220)).max(8),
  missingSignals: z.array(z.string().trim().min(1).max(220)).max(8),
  evidence: z.string().trim().min(1).max(6000),
  acceptance: z.string().trim().min(1).max(1800)
});

const CloseoutPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_RECEIPT_VERSION),
  source: z.literal("quick-workflow-buyer-expansion-recheck-closeout"),
  status: CloseoutStatusSchema,
  decision: CloseoutDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  workflow: z.string().trim().min(1).max(1600),
  sourceSignoffReceiptId: z.string().trim().regex(/^quick-buyer-expansion-handoff-signoff-(ready|watch|blocked)-[a-f0-9]{8}$/i),
  sourceSignoffChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  sourceHandoffReceiptId: z.string().trim().regex(/^quick-buyer-expansion-handoff-(ready|watch|blocked)-[a-f0-9]{8}$/i),
  sourceHandoffChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  scheduledDate: z.string().trim().min(1).max(40),
  actualMonthlyValueYen: z.number().int().min(0).max(1_000_000_000),
  valueFloorYen: z.number().int().min(0).max(1_000_000_000),
  readyCheckCount: z.number().int().min(0).max(5),
  checkCount: z.number().int().min(5).max(5),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  evidenceSummary: z.string().trim().min(1).max(2400),
  checks: z.array(CloseoutCheckSchema).min(5).max(5)
});

const CloseoutVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: CloseoutPayloadSchema
});

export function verifyQuickWorkflowBuyerExpansionRecheckCloseoutRequest(input: unknown) {
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

  const payload = parsed.data.payload as QuickWorkflowBuyerExpansionRecheckCloseoutPayload;
  const verification = verifyQuickWorkflowBuyerExpansionRecheckCloseoutReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-workflow-buyer-expansion-recheck-closeout.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        workflow: payload.workflow,
        sourceSignoffReceiptId: payload.sourceSignoffReceiptId,
        sourceHandoffReceiptId: payload.sourceHandoffReceiptId,
        scheduledDate: payload.scheduledDate,
        actualMonthlyValueYen: payload.actualMonthlyValueYen,
        valueFloorYen: payload.valueFloorYen,
        readyCheckCount: payload.readyCheckCount,
        checkCount: payload.checkCount,
        nextOwner: payload.nextOwner
      }
    }
  };
}
