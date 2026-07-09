import { z } from "zod";
import {
  COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH,
  verifyCommercialOfferReceipt,
  type CommercialOfferReceiptPayload
} from "../src/commercialOffer.js";

export { COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH };

const CommercialOfferReadinessSchema = z.enum(["offer-ready", "needs-redlines", "blocked"]);
const CommercialOfferTierIdSchema = z.enum(["proof-pilot", "team-rollout", "operating-pack"]);
const BuyerValueScenarioStatusSchema = z.enum(["clear", "watch", "blocked"]);
const CommercialOfferApprovalDecisionSchema = z.enum(["approve", "redline", "hold"]);
const CommercialOfferValueStressCaseIdSchema = z.enum(["contract-case", "downside-half-adoption", "break-even-floor"]);

const CommercialOfferTierSchema = z.object({
  id: CommercialOfferTierIdSchema,
  label: z.string().trim().min(1).max(180),
  status: BuyerValueScenarioStatusSchema,
  priceYen: z.number().int().min(0).max(1_000_000_000),
  term: z.string().trim().min(1).max(120),
  buyerValueYen: z.number().int().min(0).max(1_000_000_000),
  paybackDays: z.number().int().min(0).max(999),
  acceptance: z.string().trim().min(1).max(1200)
});

const CommercialOfferValueStressCaseSchema = z.object({
  id: CommercialOfferValueStressCaseIdSchema,
  label: z.string().trim().min(1).max(180),
  status: BuyerValueScenarioStatusSchema,
  monthlyValueYen: z.number().int().min(0).max(1_000_000_000),
  paybackDays: z.number().int().min(0).max(999),
  assumption: z.string().trim().min(1).max(1600),
  buyerDecision: z.string().trim().min(1).max(1600)
});

const CommercialOfferGuardrailSchema = z.object({
  id: z.string().trim().min(1).max(180),
  label: z.string().trim().min(1).max(180),
  status: BuyerValueScenarioStatusSchema,
  owner: z.string().trim().min(1).max(180),
  evidence: z.string().trim().min(1).max(1600),
  rule: z.string().trim().min(1).max(1600)
});

const CommercialOfferApprovalConditionSchema = z.object({
  id: z.string().trim().min(1).max(180),
  label: z.string().trim().min(1).max(180),
  status: BuyerValueScenarioStatusSchema,
  owner: z.string().trim().min(1).max(180),
  evidence: z.string().trim().min(1).max(1600),
  requiredBefore: z.string().trim().min(1).max(180)
});

const CommercialOfferReceiptPayloadSchema = z.object({
  receiptVersion: z.literal("commercial-offer.v1"),
  offerId: z.string().trim().min(1).max(260),
  readiness: CommercialOfferReadinessSchema,
  offerScore: z.number().int().min(0).max(100),
  buyer: z.string().trim().min(1).max(280),
  recommendedTierId: CommercialOfferTierIdSchema,
  contractAsk: z.string().trim().min(1).max(1600),
  firstCommitmentYen: z.number().int().min(0).max(1_000_000_000),
  expectedMonthlyValueYen: z.number().int().min(0).max(1_000_000_000),
  breakEvenMonthlyValueYen: z.number().int().min(0).max(1_000_000_000),
  breakEvenAdoptionRatePercent: z.number().int().min(0).max(999),
  approvalDecision: CommercialOfferApprovalDecisionSchema,
  approvalScore: z.number().int().min(0).max(100),
  approvalSigner: z.string().trim().min(1).max(180),
  tiers: z.array(CommercialOfferTierSchema).min(1).max(3),
  valueStressCases: z.array(CommercialOfferValueStressCaseSchema).min(1).max(3),
  guardrails: z.array(CommercialOfferGuardrailSchema).min(1).max(8),
  approvalConditions: z.array(CommercialOfferApprovalConditionSchema).min(1).max(10),
  renewalCriteria: z.array(z.string().trim().min(1).max(1200)).min(1).max(8)
});

const CommercialOfferReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: CommercialOfferReceiptPayloadSchema
});

export function verifyCommercialOfferReceiptRequest(input: unknown) {
  const parsed = CommercialOfferReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as CommercialOfferReceiptPayload;
  const verification = verifyCommercialOfferReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "commercial-offer.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        offerId: payload.offerId,
        readiness: payload.readiness,
        offerScore: payload.offerScore,
        buyer: payload.buyer,
        recommendedTierId: payload.recommendedTierId,
        firstCommitmentYen: payload.firstCommitmentYen,
        approvalDecision: payload.approvalDecision,
        approvalScore: payload.approvalScore
      }
    }
  };
}
