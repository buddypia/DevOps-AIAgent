import { z } from "zod";
import {
  BUYER_DECISION_RECEIPT_VERIFY_PATH,
  verifyBuyerDecisionReceipt,
  type BuyerDecisionReceiptPayload
} from "../src/buyerDecisionReceipt.js";

export { BUYER_DECISION_RECEIPT_VERIFY_PATH };

const ConditionStatusSchema = z.enum(["clear", "watch", "blocked"]);
const ReceiptChoiceSchema = z.enum(["continue", "revise", "stop"]);
const ReceiptReadinessSchema = z.enum(["accepted", "conditional", "declined"]);
const ReceiptDecisionAlignmentSchema = z.enum(["aligned", "overridden"]);
const ProofVerifierStatusSchema = z.enum(["verified", "attention", "blocked"]);
const ProcurementReadinessSchema = z.enum(["buy-now", "pilot-first", "hold"]);
const ConditionIdSchema = z.enum(["proof-verifier", "procurement-decision", "decision-contract", "follow-up-ledger"]);
const REPLAY_ROUTE_HREF_MAX_LENGTH = 30000;

const BuyerDecisionReceiptDecisionGateSchema = z.object({
  recommendedChoice: ReceiptChoiceSchema,
  selectedChoice: ReceiptChoiceSchema,
  decisionAlignment: ReceiptDecisionAlignmentSchema,
  openConditionCount: z.number().int().min(0).max(8),
  blockedConditionCount: z.number().int().min(0).max(8),
  watchConditionCount: z.number().int().min(0).max(8),
  blockingSummary: z.string().trim().min(1).max(1200),
  overrideWarning: z.string().trim().min(1).max(1200),
  continueCriteria: z.array(z.string().trim().min(1).max(1800)).min(1).max(4)
});

const BuyerDecisionReceiptPayloadSchema = z.object({
  receiptVersion: z.literal("buyer-decision-receipt.v1"),
  receiptId: z.string().trim().min(1).max(220),
  choice: ReceiptChoiceSchema,
  readiness: ReceiptReadinessSchema,
  reviewerName: z.string().trim().min(1).max(160),
  decidedAt: z.string().trim().min(1).max(80),
  targetBuyer: z.string().trim().min(1).max(240),
  manifestDigest: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  proofVerifierStatus: ProofVerifierStatusSchema,
  procurementReadiness: ProcurementReadinessSchema,
  approvalAsk: z.string().trim().min(1).max(1000),
  firstCommitmentYen: z.number().int().min(0).max(1_000_000_000_000),
  expectedMonthlyValueYen: z.number().int().min(0).max(1_000_000_000_000),
  paybackDays: z.number().int().min(0).max(3650),
  buyerNote: z.string().trim().min(1).max(1200),
  conditionNote: z.string().trim().min(1).max(1200),
  decisionGate: BuyerDecisionReceiptDecisionGateSchema,
  conditions: z
    .array(
      z.object({
        id: ConditionIdSchema,
        status: ConditionStatusSchema,
        evidence: z.string().trim().min(1).max(2400),
        action: z.string().trim().min(1).max(1800),
        href: z.string().trim().min(1).max(REPLAY_ROUTE_HREF_MAX_LENGTH)
      })
    )
    .min(1)
    .max(8)
});

const BuyerDecisionReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: BuyerDecisionReceiptPayloadSchema
});

export function verifyBuyerDecisionReceiptRequest(input: unknown) {
  const parsed = BuyerDecisionReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as BuyerDecisionReceiptPayload;
  const verification = verifyBuyerDecisionReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "buyer-decision-receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        receiptId: payload.receiptId,
        choice: payload.choice,
        readiness: payload.readiness,
        reviewerName: payload.reviewerName,
        targetBuyer: payload.targetBuyer,
        conditionCount: payload.conditions.length,
        manifestDigest: payload.manifestDigest
      }
    }
  };
}
