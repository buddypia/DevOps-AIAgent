import { z } from "zod";
import {
  ADOPTION_SUCCESS_RECEIPT_VERIFY_PATH,
  verifyAdoptionSuccessReceipt,
  type AdoptionSuccessReceiptPayload
} from "../src/adoptionOperatingPlan.js";

export { ADOPTION_SUCCESS_RECEIPT_VERIFY_PATH };

const AdoptionStatusSchema = z.enum(["clear", "watch", "blocked"]);

const AdoptionSuccessLedgerRowSchema = z.object({
  id: z.string().trim().min(1).max(220),
  label: z.string().trim().min(1).max(220),
  status: AdoptionStatusSchema,
  value: z.string().trim().min(1).max(420),
  owner: z.string().trim().min(1).max(220),
  evidence: z.string().trim().min(1).max(1600),
  action: z.string().trim().min(1).max(1600)
});

const AdoptionSuccessReceiptPayloadSchema = z.object({
  receiptVersion: z.literal("adoption-success-ledger.v1"),
  planId: z.string().trim().min(1).max(220),
  ledgerId: z.string().trim().min(1).max(220),
  decision: z.enum(["expand-next-workflow", "revise-pilot", "hold-expansion"]),
  successScore: z.number().min(0).max(100),
  buyer: z.string().trim().min(1).max(240),
  operatingMetric: z.string().trim().min(1).max(800),
  reviewWindow: z.string().trim().min(1).max(220),
  renewalAsk: z.string().trim().min(1).max(1400),
  riskAdjustedMonthlyValueYen: z.number().min(0).max(1_000_000_000_000),
  rows: z.array(AdoptionSuccessLedgerRowSchema).min(1).max(24),
  expansionCriteria: z.array(z.string().trim().min(1).max(1000)).min(1).max(8)
});

const AdoptionSuccessReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: AdoptionSuccessReceiptPayloadSchema
});

export function verifyAdoptionSuccessReceiptRequest(input: unknown) {
  const parsed = AdoptionSuccessReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as AdoptionSuccessReceiptPayload;
  const verification = verifyAdoptionSuccessReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "adoption-success-ledger.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        decision: payload.decision,
        successScore: payload.successScore,
        buyer: payload.buyer,
        reviewWindow: payload.reviewWindow,
        renewalAsk: payload.renewalAsk,
        blockedRows: payload.rows.filter((row) => row.status === "blocked").length,
        watchRows: payload.rows.filter((row) => row.status === "watch").length,
        expansionCriteriaCount: payload.expansionCriteria.length
      }
    }
  };
}
