import { z } from "zod";
import {
  BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH,
  verifyBuyerDecisionFollowUpReceipt,
  type BuyerDecisionFollowUpReceiptPayload
} from "../src/buyerDecisionFollowUp.js";

export { BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH };

const FollowUpStatusSchema = z.enum(["ready", "attention", "blocked"]);
const FollowUpModeSchema = z.enum(["buyer-send", "sponsor-review", "blocker-closure"]);
const FollowUpTaskIdSchema = z.enum(["decision-request", "commercial-boundary", "proof-trust", "stop-rule"]);
const REPLAY_ROUTE_HREF_MAX_LENGTH = 30000;

const FollowUpTaskSchema = z.object({
  id: FollowUpTaskIdSchema,
  label: z.string().trim().min(1).max(180),
  status: FollowUpStatusSchema,
  owner: z.string().trim().min(1).max(180),
  dueLabel: z.string().trim().min(1).max(180),
  nextStep: z.string().trim().min(1).max(1400),
  closeCondition: z.string().trim().min(1).max(1400),
  evidence: z.string().trim().min(1).max(1800),
  href: z.string().max(REPLAY_ROUTE_HREF_MAX_LENGTH)
});

const BuyerDecisionFollowUpReceiptPayloadSchema = z.object({
  receiptVersion: z.literal("buyer-decision-follow-up.v1"),
  ledgerId: z.string().trim().min(1).max(180),
  status: FollowUpStatusSchema,
  mode: FollowUpModeSchema,
  headline: z.string().trim().min(1).max(260),
  meetingDecision: z.string().trim().min(1).max(180),
  readyCount: z.number().int().min(0).max(4),
  blockedCount: z.number().int().min(0).max(4),
  attentionCount: z.number().int().min(0).max(4),
  taskTotal: z.number().int().min(1).max(4),
  firstDueLabel: z.string().trim().min(1).max(180),
  firstActionLabel: z.string().trim().min(1).max(220),
  firstActionHref: z.string().trim().min(1).max(REPLAY_ROUTE_HREF_MAX_LENGTH),
  tasks: z.array(FollowUpTaskSchema).min(1).max(4),
  escalationRules: z.array(z.string().trim().min(1).max(1200)).min(1).max(5),
  csvLedger: z.object({
    filename: z.literal("buyer-decision-follow-up-ledger.csv"),
    rowCount: z.number().int().min(1).max(4),
    csvText: z.string().trim().min(1).max(40000)
  })
});

const BuyerDecisionFollowUpReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: BuyerDecisionFollowUpReceiptPayloadSchema
});

export function verifyBuyerDecisionFollowUpReceiptRequest(input: unknown) {
  const parsed = BuyerDecisionFollowUpReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as BuyerDecisionFollowUpReceiptPayload;
  const verification = verifyBuyerDecisionFollowUpReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "buyer-decision-follow-up.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        ledgerId: payload.ledgerId,
        status: payload.status,
        mode: payload.mode,
        readyCount: payload.readyCount,
        blockedCount: payload.blockedCount,
        attentionCount: payload.attentionCount,
        csvLedger: {
          filename: payload.csvLedger.filename,
          rowCount: payload.csvLedger.rowCount
        }
      }
    }
  };
}
