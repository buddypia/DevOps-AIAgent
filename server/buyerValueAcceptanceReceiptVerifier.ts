import { z } from "zod";
import {
  BUYER_VALUE_ACCEPTANCE_RECEIPT_VERSION,
  BUYER_VALUE_ACCEPTANCE_VERIFY_PATH,
  verifyBuyerValueAcceptanceReceipt,
  type BuyerValueAcceptancePayload
} from "../src/buyerValueAcceptanceReceipt.js";

export { BUYER_VALUE_ACCEPTANCE_VERIFY_PATH };

const AcceptanceStatusSchema = z.enum(["ready", "watch", "blocked"]);
const AcceptanceDecisionSchema = z.enum(["accept-sponsor-ask", "accept-contained-pilot", "hold-value-claim"]);
const ReportReadinessSchema = z.enum(["board-ready", "pilot-only", "do-not-pitch"]);
const CommitmentDecisionSchema = z.enum(["send-to-sponsor", "run-contained-pilot", "hold-pitch"]);

const AcceptanceCheckSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(220),
  status: AcceptanceStatusSchema,
  value: z.string().trim().min(1).max(1200),
  evidence: z.string().trim().min(1).max(2200),
  acceptance: z.string().trim().min(1).max(1800)
});

const AcceptancePayloadSchema = z.object({
  receiptVersion: z.literal(BUYER_VALUE_ACCEPTANCE_RECEIPT_VERSION),
  status: AcceptanceStatusSchema,
  decision: AcceptanceDecisionSchema,
  targetBuyer: z.string().trim().min(1).max(280),
  reportId: z.string().trim().regex(/^buyer-value-report-(board-ready|pilot-only|do-not-pitch)-[0-9]{1,3}$/),
  scenarioId: z.string().trim().regex(/^buyer-value-[0-9]{1,3}-(scales-now|pilot-first|not-yet)$/),
  sensitivityId: z.string().trim().regex(/^buyer-value-sensitivity-(defensible|fragile|not-defensible)-[0-9]{1,3}$/),
  commitmentId: z.string().trim().regex(/^buyer-value-commitment-(send-to-sponsor|run-contained-pilot|hold-pitch)-[0-9]{1,3}$/),
  generatedAt: z.string().trim().min(1).max(80),
  valueReportHref: z.string().trim().max(12000),
  reviewerName: z.string().trim().max(180),
  reportReadiness: ReportReadinessSchema,
  commitmentDecision: CommitmentDecisionSchema,
  monthlyGrossValueYen: z.number().int().min(0).max(1_000_000_000),
  measuredMonthlyValueYen: z.number().int().min(0).max(1_000_000_000),
  supportRatioPercent: z.number().int().min(0).max(10000),
  paybackDays: z.number().int().min(0).max(999),
  downsidePaybackDays: z.number().int().min(0).max(999),
  breakEvenAdoptionPercent: z.number().int().min(0).max(150),
  recommendedAskYen: z.number().int().min(0).max(1_000_000_000),
  publicEvidenceUrl: z.string().trim().max(1600),
  publicProofStatus: AcceptanceStatusSchema,
  nextOwner: z.string().trim().min(1).max(220),
  nextAction: z.string().trim().min(1).max(2200),
  buyerClaim: z.string().trim().min(1).max(2200),
  checks: z.array(AcceptanceCheckSchema).min(5).max(5)
});

const AcceptanceVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: AcceptancePayloadSchema
});

export function verifyBuyerValueAcceptanceReceiptRequest(input: unknown) {
  const parsed = AcceptanceVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as BuyerValueAcceptancePayload;
  const verification = verifyBuyerValueAcceptanceReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "buyer-value-acceptance.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        decision: payload.decision,
        targetBuyer: payload.targetBuyer,
        reportId: payload.reportId,
        scenarioId: payload.scenarioId,
        reportReadiness: payload.reportReadiness,
        commitmentDecision: payload.commitmentDecision,
        monthlyGrossValueYen: payload.monthlyGrossValueYen,
        measuredMonthlyValueYen: payload.measuredMonthlyValueYen,
        supportRatioPercent: payload.supportRatioPercent,
        publicProofStatus: payload.publicProofStatus,
        recommendedAskYen: payload.recommendedAskYen,
        checkCount: payload.checks.length,
        nextOwner: payload.nextOwner
      }
    }
  };
}
