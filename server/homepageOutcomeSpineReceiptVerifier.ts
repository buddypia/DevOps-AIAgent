import { z } from "zod";
import {
  HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH,
  HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERSION,
  verifyHomepageOutcomeSpineReceipt
} from "../src/homepageOutcomeSpineReceipt.js";

export { HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH };

const HomepageOutcomeSpineStatusSchema = z.enum(["ready", "attention", "blocked"]);
const HomepageOutcomeSpineStepIdSchema = z.enum(["workflow", "value", "proof", "packet", "decision"]);
const PublishabilityDecisionSchema = z.enum(["publish-ready", "review-first", "do-not-publish"]);
const ReviewerDecisionSchema = z.enum(["send-to-buyer", "sponsor-review", "repair-before-share"]);

const HomepageOutcomeSpineReceiptPayloadSchema = z.object({
  receiptVersion: z.literal(HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERSION),
  source: z.literal("homepage-outcome-spine"),
  buyer: z.string().trim().min(1).max(220),
  status: HomepageOutcomeSpineStatusSchema,
  proofScore: z.number().int().min(0).max(100),
  proofReadyCount: z.number().int().min(0).max(20),
  proofItemCount: z.number().int().min(1).max(20),
  packetReadyCount: z.number().int().min(0).max(20),
  packetItemCount: z.number().int().min(1).max(20),
  publishabilityDecision: PublishabilityDecisionSchema,
  reviewerDecision: ReviewerDecisionSchema,
  primaryAction: z.object({
    label: z.string().trim().min(1).max(180),
    href: z.string().trim().min(1).max(8192)
  }),
  sendRule: z.string().trim().min(1).max(1800),
  currentRoute: z.string().trim().min(1).max(1800),
  steps: z
    .array(
      z.object({
        id: HomepageOutcomeSpineStepIdSchema,
        label: z.string().trim().min(1).max(120),
        status: HomepageOutcomeSpineStatusSchema,
        title: z.string().trim().min(1).max(320),
        evidence: z.string().trim().min(1).max(1800),
        href: z.string().trim().min(1).max(8192),
        actionLabel: z.string().trim().min(1).max(180)
      })
    )
    .min(5)
    .max(5)
});

const HomepageOutcomeSpineReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: HomepageOutcomeSpineReceiptPayloadSchema
});

export function verifyHomepageOutcomeSpineReceiptRequest(input: unknown) {
  const parsed = HomepageOutcomeSpineReceiptVerificationSchema.safeParse(input);
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
  const verification = verifyHomepageOutcomeSpineReceipt({
    checksum: parsed.data.checksum,
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "homepage-outcome-spine.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        buyer: payload.buyer,
        status: payload.status,
        proofScore: payload.proofScore,
        proofReadyCount: payload.proofReadyCount,
        proofItemCount: payload.proofItemCount,
        packetReadyCount: payload.packetReadyCount,
        packetItemCount: payload.packetItemCount,
        publishabilityDecision: payload.publishabilityDecision,
        reviewerDecision: payload.reviewerDecision,
        stepCount: payload.steps.length,
        firstBlockedStep: payload.steps.find((step) => step.status === "blocked")?.label ?? null,
        firstAction: payload.primaryAction.label
      }
    }
  };
}
