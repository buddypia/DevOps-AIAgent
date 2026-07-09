import { z } from "zod";
import {
  HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH,
  HOMEPAGE_VALUE_LENS_RECEIPT_VERSION,
  verifyHomepageValueLensReceipt
} from "../src/homepageValueLensReceipt.js";

export { HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH };

const HomepageValueLensStatusSchema = z.enum(["ready", "attention", "blocked"]);

const HomepageValueLensReceiptPayloadSchema = z.object({
  receiptVersion: z.literal(HOMEPAGE_VALUE_LENS_RECEIPT_VERSION),
  source: z.literal("homepage-value-lens"),
  buyer: z.string().trim().min(1).max(220),
  status: HomepageValueLensStatusSchema,
  headline: z.string().trim().min(1).max(240),
  valueClaim: z.string().trim().min(1).max(1000),
  monthlyValueYen: z.number().int().min(0).max(1000000000),
  measuredMonthlyValueYen: z.number().int().min(0).max(1000000000),
  measuredSupportPercent: z.number().int().min(0).max(1000000),
  paybackDays: z.number().int().min(0).max(3650),
  confidenceScore: z.number().int().min(0).max(100),
  monthlyHoursSaved: z.number().min(0).max(1000000),
  pilotBudgetCeilingYen: z.number().int().min(0).max(1000000000),
  assumptions: z.object({
    teamSize: z.number().min(1).max(100000),
    cyclesPerMonth: z.number().min(1).max(100000),
    manualHoursPerCycle: z.number().min(0).max(100000),
    adoptionRatePercent: z.number().min(0).max(100),
    hourlyCostYen: z.number().min(0).max(100000000),
    incidentRiskYenPerMonth: z.number().min(0).max(1000000000).optional()
  }),
  metrics: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        label: z.string().trim().min(1).max(140),
        value: z.string().trim().min(1).max(180),
        status: HomepageValueLensStatusSchema,
        evidence: z.string().trim().min(1).max(1000)
      })
    )
    .min(1)
    .max(8),
  primaryAction: z.object({
    label: z.string().trim().min(1).max(180),
    href: z.string().trim().min(1).max(8192)
  }),
  workflowAction: z.object({
    label: z.string().trim().min(1).max(180),
    href: z.string().trim().min(1).max(8192)
  })
});

const HomepageValueLensReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: HomepageValueLensReceiptPayloadSchema
});

export function verifyHomepageValueLensReceiptRequest(input: unknown) {
  const parsed = HomepageValueLensReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload;
  const verification = verifyHomepageValueLensReceipt({
    checksum: parsed.data.checksum,
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "homepage-value-lens.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        buyer: payload.buyer,
        status: payload.status,
        headline: payload.headline,
        monthlyValueYen: payload.monthlyValueYen,
        measuredMonthlyValueYen: payload.measuredMonthlyValueYen,
        measuredSupportPercent: payload.measuredSupportPercent,
        paybackDays: payload.paybackDays,
        confidenceScore: payload.confidenceScore,
        metricCount: payload.metrics.length,
        firstAction: payload.primaryAction.label
      }
    }
  };
}
