import { z } from "zod";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION,
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH,
  verifyQuickWorkflowBuyerExpansionHandoffReceipt,
  type QuickWorkflowBuyerExpansionHandoffReceiptPayload
} from "../src/quickWorkflowBuyerExpansionHandoffReceipt.js";

export { QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH };

const HandoffStatusSchema = z.enum(["ready", "watch", "blocked"]);
const HandoffTaskIdSchema = z.enum(["attach-one-pager", "verify-receipt-chain", "procurement-signoff", "value-recheck-window"]);

const HandoffTaskSchema = z.object({
  id: HandoffTaskIdSchema,
  status: HandoffStatusSchema,
  owner: z.string().trim().min(1).max(180),
  action: z.string().trim().min(1).max(1800),
  acceptance: z.string().trim().min(1).max(1800),
  proof: z.string().trim().min(1).max(2600)
});

const HandoffPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION),
  source: z.literal("quick-workflow-buyer-expansion-handoff"),
  status: HandoffStatusSchema,
  buyer: z.string().trim().min(1).max(280),
  workflow: z.string().trim().min(1).max(1600),
  decisionAsk: z.string().trim().min(1).max(1800),
  approvalLine: z.string().trim().min(1).max(1800),
  riskLine: z.string().trim().min(1).max(1800),
  receiptLine: z.string().trim().min(1).max(1800),
  packetReadyCount: z.number().int().min(0).max(6),
  packetTotalCount: z.number().int().min(1).max(6),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  tasks: z.array(HandoffTaskSchema).min(4).max(4)
});

const HandoffVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: HandoffPayloadSchema
});

export function verifyQuickWorkflowBuyerExpansionHandoffRequest(input: unknown) {
  const parsed = HandoffVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickWorkflowBuyerExpansionHandoffReceiptPayload;
  const verification = verifyQuickWorkflowBuyerExpansionHandoffReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });
  const readyTaskCount = payload.tasks.filter((task) => task.status === "ready").length;
  const watchTaskCount = payload.tasks.filter((task) => task.status === "watch").length;
  const blockedTaskCount = payload.tasks.filter((task) => task.status === "blocked").length;

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-workflow-buyer-expansion-handoff.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        status: payload.status,
        buyer: payload.buyer,
        workflow: payload.workflow,
        packetReadyCount: payload.packetReadyCount,
        packetTotalCount: payload.packetTotalCount,
        receiptLine: payload.receiptLine,
        taskCount: payload.tasks.length,
        readyTaskCount,
        watchTaskCount,
        blockedTaskCount,
        firstOpenTask: payload.tasks.find((task) => task.status !== "ready")?.id ?? "none",
        nextOwner: payload.nextOwner,
        nextAction: payload.nextAction
      }
    }
  };
}
