import { z } from "zod";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_RECEIPT_VERSION,
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH,
  verifyQuickWorkflowBuyerExpansionHandoffSignoffReceipt,
  type QuickWorkflowBuyerExpansionHandoffSignoffPayload
} from "../src/quickWorkflowBuyerExpansionHandoffSignoffReceipt.js";

export { QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH };

const SignoffDecisionSchema = z.enum(["approve-next-window", "hold-for-repair"]);
const SignoffStatusSchema = z.enum(["ready", "watch", "blocked"]);

const OperatingTaskSchema = z.object({
  id: z.enum(["archive-signoff-verifier", "schedule-retained-value-recheck", "reopen-receipt-chain", "stop-or-repair-below-floor"]),
  label: z.string().trim().min(1).max(180),
  status: SignoffStatusSchema,
  owner: z.string().trim().min(1).max(180),
  dueLabel: z.string().trim().min(1).max(180),
  action: z.string().trim().min(1).max(1800),
  acceptance: z.string().trim().min(1).max(1800),
  proof: z.string().trim().min(1).max(3000)
});

const OperatingCalendarSchema = z.object({
  status: z.enum(["scheduled", "held", "needs-date"]),
  startDate: z.string().trim().max(20),
  endDate: z.string().trim().max(20),
  summary: z.string().trim().min(1).max(600)
});

const RecheckCloseoutSchema = z.object({
  status: z.enum(["recordable", "held", "needs-date"]),
  label: z.string().trim().min(1).max(240),
  scheduledDate: z.string().trim().min(1).max(40),
  sourceHandoffReceiptId: z.string().trim().regex(/^quick-buyer-expansion-handoff-(ready|watch|blocked)-[a-f0-9]{8}$/i),
  sourceHandoffChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  sourceVerifierHref: z.string().trim().min(1).max(12000),
  valueFloorEvidence: z.string().trim().min(1).max(3000),
  decisionRule: z.string().trim().min(1).max(1800),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  requiredSignals: z.array(z.string().trim().min(1).max(180)).min(6).max(6),
  evidenceTemplate: z.string().trim().min(1).max(6000)
});

const OperatingPacketSchema = z.object({
  headline: z.string().trim().min(1).max(280),
  summary: z.string().trim().min(1).max(2400),
  recheckWindow: z.string().trim().min(1).max(240),
  calendar: OperatingCalendarSchema,
  recheckCloseout: RecheckCloseoutSchema,
  tasks: z.array(OperatingTaskSchema).min(4).max(4)
});

const SignoffPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_RECEIPT_VERSION),
  source: z.literal("quick-workflow-buyer-expansion-handoff-signoff"),
  decision: SignoffDecisionSchema,
  status: SignoffStatusSchema,
  buyer: z.string().trim().min(1).max(280),
  workflow: z.string().trim().min(1).max(1600),
  handoffReceiptId: z.string().trim().regex(/^quick-buyer-expansion-handoff-(ready|watch|blocked)-[a-f0-9]{8}$/i),
  handoffChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  handoffVerifierHref: z.string().trim().min(1).max(12000),
  approvalLine: z.string().trim().min(1).max(1800),
  riskLine: z.string().trim().min(1).max(1800),
  decisionMemo: z.string().trim().min(1).max(1800),
  controlOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  taskReadyCount: z.number().int().min(0).max(4),
  taskTotalCount: z.number().int().min(1).max(4),
  requiredProof: z.array(z.string().trim().min(1).max(3000)).min(4).max(4),
  operatingPacket: OperatingPacketSchema
});

const SignoffVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: SignoffPayloadSchema
});

export function verifyQuickWorkflowBuyerExpansionHandoffSignoffRequest(input: unknown) {
  const parsed = SignoffVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickWorkflowBuyerExpansionHandoffSignoffPayload;
  const verification = verifyQuickWorkflowBuyerExpansionHandoffSignoffReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-workflow-buyer-expansion-handoff-signoff.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        decision: payload.decision,
        status: payload.status,
        buyer: payload.buyer,
        workflow: payload.workflow,
        handoffReceiptId: payload.handoffReceiptId,
        handoffChecksum: payload.handoffChecksum,
        taskReadyCount: payload.taskReadyCount,
        taskTotalCount: payload.taskTotalCount,
        controlOwner: payload.controlOwner,
        nextAction: payload.nextAction,
        operatingPacket: {
          headline: payload.operatingPacket.headline,
          recheckWindow: payload.operatingPacket.recheckWindow,
          calendarStatus: payload.operatingPacket.calendar.status,
          calendarStartDate: payload.operatingPacket.calendar.startDate,
          closeoutStatus: payload.operatingPacket.recheckCloseout.status,
          closeoutScheduledDate: payload.operatingPacket.recheckCloseout.scheduledDate,
          taskCount: payload.operatingPacket.tasks.length,
          firstDueLabel: payload.operatingPacket.tasks[0]?.dueLabel ?? "none"
        }
      }
    }
  };
}
