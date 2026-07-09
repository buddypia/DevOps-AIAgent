import { z } from "zod";
import {
  BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH,
  verifyBuyerPilotContractReceipt,
  type BuyerPilotContractReceiptPayload
} from "../src/buyerPilotContract.js";

export { BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH };

const BuyerValueScenarioStatusSchema = z.enum(["clear", "watch", "blocked"]);
const BuyerPilotContractReadinessSchema = z.enum(["contract-ready", "needs-redlines", "blocked"]);
const BuyerPilotContractDecisionSchema = z.enum(["approve-contained-pilot", "owner-redline", "hold-internal"]);
const BuyerPilotContractMilestoneIdSchema = z.enum([
  "value-proof",
  "commercial-boundary",
  "agreement-signature",
  "measured-acceptance",
  "trust-boundary",
  "operating-owner"
]);
const BuyerPilotContractCloseDecisionIdSchema = z.enum(["scope", "price", "proof", "trust", "renewal"]);
const BuyerPilotContractAttachmentIdSchema = z.enum(["value-report", "commercial-offer", "pilot-agreement", "adoption-plan", "trust-center", "launch-room"]);

const BuyerPilotContractMilestoneSchema = z.object({
  id: BuyerPilotContractMilestoneIdSchema,
  label: z.string().trim().min(1).max(180),
  status: BuyerValueScenarioStatusSchema,
  owner: z.string().trim().min(1).max(180),
  promise: z.string().trim().min(1).max(1800),
  proof: z.string().trim().min(1).max(1800),
  requiredBefore: z.string().trim().min(1).max(180)
});

const BuyerPilotContractCloseDecisionSchema = z.object({
  id: BuyerPilotContractCloseDecisionIdSchema,
  label: z.string().trim().min(1).max(180),
  status: BuyerValueScenarioStatusSchema,
  buyerDecision: z.string().trim().min(1).max(1800),
  evidence: z.string().trim().min(1).max(1800),
  owner: z.string().trim().min(1).max(180)
});

const BuyerPilotContractAttachmentSchema = z.object({
  id: BuyerPilotContractAttachmentIdSchema,
  label: z.string().trim().min(1).max(180),
  status: BuyerValueScenarioStatusSchema,
  href: z.string().trim().min(1).max(2200),
  evidence: z.string().trim().min(1).max(1800)
});

const BuyerPilotContractReceiptPayloadSchema = z.object({
  receiptVersion: z.literal("buyer-pilot-contract.v1"),
  contractId: z.string().trim().min(1).max(260),
  readiness: BuyerPilotContractReadinessSchema,
  contractScore: z.number().int().min(0).max(100),
  approvalDecision: BuyerPilotContractDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  pilotOffer: z.string().trim().min(1).max(180),
  firstCommitmentYen: z.number().int().min(0).max(1_000_000_000),
  expectedMonthlyValueYen: z.number().int().min(0).max(1_000_000_000),
  paybackDays: z.number().int().min(0).max(999),
  valueCoveragePercent: z.number().int().min(0).max(10000),
  approvalSigner: z.string().trim().min(1).max(180),
  commercialOfferReceiptChecksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  milestones: z.array(BuyerPilotContractMilestoneSchema).min(1).max(8),
  closeDecisions: z.array(BuyerPilotContractCloseDecisionSchema).min(1).max(8),
  stopRules: z.array(z.string().trim().min(1).max(1800)).min(1).max(8),
  attachments: z.array(BuyerPilotContractAttachmentSchema).min(1).max(8)
});

const BuyerPilotContractReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: BuyerPilotContractReceiptPayloadSchema
});

export function verifyBuyerPilotContractReceiptRequest(input: unknown) {
  const parsed = BuyerPilotContractReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as BuyerPilotContractReceiptPayload;
  const verification = verifyBuyerPilotContractReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "buyer-pilot-contract.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        contractId: payload.contractId,
        readiness: payload.readiness,
        contractScore: payload.contractScore,
        approvalDecision: payload.approvalDecision,
        buyer: payload.buyer,
        pilotOffer: payload.pilotOffer,
        firstCommitmentYen: payload.firstCommitmentYen,
        commercialOfferReceiptChecksum: payload.commercialOfferReceiptChecksum
      }
    }
  };
}
