import { z } from "zod";
import {
  GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERIFY_PATH,
  GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERSION,
  verifyGlobalPublishabilityReviewResponseReceipt,
  type GlobalPublishabilityReviewResponseReceiptPayload
} from "../src/globalPublishabilityReviewResponseReceipt.js";

export { GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERIFY_PATH };

const ReviewChoiceSchema = z.enum(["approve-bounded-pilot", "sponsor-review", "hold-public-launch"]);
const ReviewStatusSchema = z.enum(["accepted", "review", "blocked"]);
const ReviewOutcomeSchema = z.enum(["pilot-approved", "owner-follow-up", "no-send"]);
const ProofIdSchema = z.enum(["buyer-value", "measured-proof", "public-proof", "buyer-decision"]);
const SourceDecisionSchema = z.enum(["publish", "sponsor-review", "do-not-publish"]);
const SourceStatusSchema = z.enum(["pass", "watch", "block"]);

const GlobalPublishabilityReviewResponsePayloadSchema = z.object({
  receiptVersion: z.literal(GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERSION),
  reportId: z.string().trim().min(1).max(220),
  sourceReceiptChecksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  sourceDecision: SourceDecisionSchema,
  sourceStatus: SourceStatusSchema,
  sourceRecommendedDecision: ReviewChoiceSchema,
  sourcePublishabilityScore: z.number().min(0).max(100),
  targetBuyer: z.string().trim().min(1).max(280),
  reviewerName: z.string().trim().min(1).max(180),
  reviewerRole: z.string().trim().min(1).max(180),
  reviewerChoice: ReviewChoiceSchema,
  reviewerNote: z.string().trim().min(1).max(1600),
  reviewedAt: z.string().trim().min(1).max(80),
  checkedProofIds: z.array(ProofIdSchema).max(4),
  requiredProofIds: z.array(ProofIdSchema).min(1).max(4),
  missingProofIds: z.array(ProofIdSchema).max(4),
  blockedProofIds: z.array(ProofIdSchema).max(4),
  watchProofIds: z.array(ProofIdSchema).max(4),
  status: ReviewStatusSchema,
  outcome: ReviewOutcomeSchema,
  owner: z.string().trim().min(1).max(180),
  responseSummary: z.string().trim().min(1).max(1200),
  nextAction: z.string().trim().min(1).max(1800),
  proofSnapshot: z.object({
    passCount: z.number().int().min(0).max(4),
    watchCount: z.number().int().min(0).max(4),
    blockCount: z.number().int().min(0).max(4),
    totalCount: z.number().int().min(1).max(4)
  })
});

const GlobalPublishabilityReviewResponseRequestSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: GlobalPublishabilityReviewResponsePayloadSchema
});

export function verifyGlobalPublishabilityReviewResponseRequest(input: unknown) {
  const parsed = GlobalPublishabilityReviewResponseRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as GlobalPublishabilityReviewResponseReceiptPayload;
  const verification = verifyGlobalPublishabilityReviewResponseReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "global-publishability-review-response.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        reportId: payload.reportId,
        sourceReceiptChecksum: payload.sourceReceiptChecksum,
        targetBuyer: payload.targetBuyer,
        reviewerName: payload.reviewerName,
        reviewerChoice: payload.reviewerChoice,
        status: payload.status,
        outcome: payload.outcome,
        checkedProofCount: payload.checkedProofIds.length,
        missingProofCount: payload.missingProofIds.length,
        nextAction: payload.nextAction
      }
    }
  };
}
