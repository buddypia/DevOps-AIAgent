import { z } from "zod";
import {
  BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH,
  verifyBuyerAcceptancePathReceipt,
  type BuyerAcceptancePathReceiptPayload
} from "../src/buyerAcceptancePath.js";

export { BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH };

const AcceptancePathStatusSchema = z.enum(["ready", "review", "blocked"]);
const AcceptancePathDecisionSchema = z.enum(["approve-pilot", "sponsor-review", "do-not-send"]);
const AcceptanceCriterionStatusSchema = z.enum(["accepted", "review", "blocked"]);
const AcceptanceStageIdSchema = z.enum(["external-review", "buyer-validation", "buyer-reply", "procurement-case", "commercial-approval", "adoption-operation", "owner-follow-up"]);
const ReceiptChoiceSchema = z.enum(["continue", "revise", "stop"]);
const ReceiptDecisionAlignmentSchema = z.enum(["aligned", "overridden"]);
const ReplyRecordStatusSchema = z.enum(["verified", "mismatch", "invalid_request", "unsupported"]);
const ValidationAnswerStatusSchema = z.enum(["ready", "watch", "blocked"]);
const REPLAY_ROUTE_HREF_MAX_LENGTH = 120000;

const AcceptanceActionSchema = z.object({
  label: z.string().trim().min(1).max(220),
  href: z.string().trim().min(1).max(REPLAY_ROUTE_HREF_MAX_LENGTH),
  owner: z.string().trim().min(1).max(240),
  due: z.string().trim().min(1).max(180)
});

const AcceptanceStageSchema = z.object({
  id: AcceptanceStageIdSchema,
  label: z.string().trim().min(1).max(220),
  status: AcceptanceCriterionStatusSchema,
  owner: z.string().trim().min(1).max(240),
  due: z.string().trim().min(1).max(180),
  evidence: z.string().trim().min(1).max(6000),
  acceptance: z.string().trim().min(1).max(6000),
  action: z.string().trim().min(1).max(4000),
  href: z.string().trim().min(1).max(REPLAY_ROUTE_HREF_MAX_LENGTH)
});

const OwnerCommitmentSchema = z.object({
  role: z.string().trim().min(1).max(240),
  owner: z.string().trim().min(1).max(240),
  commitment: z.string().trim().min(1).max(5000),
  artifact: z.string().trim().min(1).max(REPLAY_ROUTE_HREF_MAX_LENGTH)
});

const DecisionGateSchema = z.object({
  recommendedChoice: ReceiptChoiceSchema,
  selectedChoice: ReceiptChoiceSchema,
  decisionAlignment: ReceiptDecisionAlignmentSchema,
  openConditionCount: z.number().int().min(0).max(8),
  blockedConditionCount: z.number().int().min(0).max(8),
  watchConditionCount: z.number().int().min(0).max(8),
  blockingSummary: z.string().trim().min(1).max(1600),
  overrideWarning: z.string().trim().min(1).max(1600),
  continueCriteria: z.array(z.string().trim().min(1).max(1800)).min(1).max(4)
});

const BuyerAcceptancePathReceiptPayloadSchema = z.object({
  receiptVersion: z.literal("buyer-acceptance-path.v1"),
  pathId: z.string().trim().min(1).max(260),
  status: AcceptancePathStatusSchema,
  decision: AcceptancePathDecisionSchema,
  headline: z.string().trim().min(1).max(500),
  summary: z.string().trim().min(1).max(1600),
  buyer: z.string().trim().min(1).max(280),
  score: z.number().int().min(0).max(200),
  readyCount: z.number().int().min(0).max(20),
  reviewCount: z.number().int().min(0).max(20),
  blockedCount: z.number().int().min(0).max(20),
  firstCommitmentYen: z.number().int().min(0).max(1_000_000_000_000),
  expectedMonthlyValueYen: z.number().int().min(0).max(1_000_000_000_000),
  paybackDays: z.number().int().min(0).max(3650),
  decisionGate: DecisionGateSchema,
  replyRecord: z
    .object({
      status: ReplyRecordStatusSchema,
      verified: z.boolean(),
      receiptType: z.string().trim().min(1).max(180),
      decision: z.string().trim().min(1).max(120),
      checksum: z.string().trim().min(1).max(120)
    })
    .optional(),
  validationAnswerRecord: z
    .object({
      status: ReplyRecordStatusSchema,
      verified: z.boolean(),
      receiptType: z.string().trim().min(1).max(180),
      answerStatus: ValidationAnswerStatusSchema.or(z.string().trim().min(1).max(120)),
      answeredCount: z.number().int().min(0).max(10).optional(),
      totalCount: z.number().int().min(1).max(10).optional(),
      checksum: z.string().trim().min(1).max(120)
    })
    .optional(),
  primaryAction: AcceptanceActionSchema,
  stages: z.array(AcceptanceStageSchema).min(1).max(8),
  ownerCommitments: z.array(OwnerCommitmentSchema).min(1).max(8),
  guardrails: z.array(z.string().trim().min(1).max(2400)).min(1).max(10)
});

const BuyerAcceptancePathReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: BuyerAcceptancePathReceiptPayloadSchema
});

export function verifyBuyerAcceptancePathReceiptRequest(input: unknown) {
  const parsed = BuyerAcceptancePathReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as BuyerAcceptancePathReceiptPayload;
  const verification = verifyBuyerAcceptancePathReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "buyer-acceptance-path.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        pathId: payload.pathId,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        stageCount: payload.stages.length,
        readyCount: payload.readyCount,
        reviewCount: payload.reviewCount,
        blockedCount: payload.blockedCount,
        decisionRecommendation: payload.decisionGate.recommendedChoice,
        selectedDecision: payload.decisionGate.selectedChoice,
        decisionAlignment: payload.decisionGate.decisionAlignment,
        openDecisionConditionCount: payload.decisionGate.openConditionCount,
        blockedDecisionConditionCount: payload.decisionGate.blockedConditionCount,
        watchDecisionConditionCount: payload.decisionGate.watchConditionCount,
        blockingSummary: payload.decisionGate.blockingSummary,
        overrideWarning: payload.decisionGate.overrideWarning,
        continueCriteria: payload.decisionGate.continueCriteria,
        validationAnswerStatus: payload.validationAnswerRecord?.answerStatus ?? null,
        validationAnswerVerified: payload.validationAnswerRecord?.verified ?? null,
        replyDecision: payload.replyRecord?.decision ?? null,
        firstCommitmentYen: payload.firstCommitmentYen,
        expectedMonthlyValueYen: payload.expectedMonthlyValueYen
      }
    }
  };
}
