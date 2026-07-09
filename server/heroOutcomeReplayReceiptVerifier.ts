import { z } from "zod";
import {
  HERO_OUTCOME_REPLAY_RECEIPT_VERIFY_PATH,
  HERO_OUTCOME_REPLAY_RECEIPT_VERSION,
  verifyHeroOutcomeReplayReceipt
} from "../src/heroOutcomeReplayReceipt.js";

export { HERO_OUTCOME_REPLAY_RECEIPT_VERIFY_PATH };

const LaunchRoomStatusSchema = z.enum(["ready", "attention", "blocked"]);
const HeroOutcomeReplayStatusSchema = z.enum(["ready", "attention", "blocked"]);
const HeroOutcomeReplayDecisionSchema = z.enum(["send", "review", "hold"]);
const HeroOutcomeReplaySensitivityVerdictSchema = z.enum(["defensible", "fragile", "not-defensible"]);

const ActionSchema = z.object({
  label: z.string().trim().min(1).max(220),
  href: z.string().trim().min(1).max(8192)
});

const OutcomeReplayStepSchema = z.object({
  id: z.enum(["manual-work", "agent-run", "proof-packet", "buyer-decision"]),
  label: z.string().trim().min(1).max(140),
  status: LaunchRoomStatusSchema,
  value: z.string().trim().min(1).max(220),
  detail: z.string().trim().min(1).max(1000),
  href: z.string().trim().min(1).max(8192)
});

const BuyerQuestionSchema = z.object({
  id: z.enum(["value-case", "proof-access", "trust-gate", "next-decision"]),
  question: z.string().trim().min(1).max(260),
  answer: z.string().trim().min(1).max(1000),
  status: LaunchRoomStatusSchema,
  href: z.string().trim().min(1).max(8192),
  evidence: z.string().trim().min(1).max(1000)
});

const ApprovalPathStepSchema = z.object({
  id: z.enum(["work-order", "receipt", "trust", "send-room"]),
  label: z.string().trim().min(1).max(140),
  status: LaunchRoomStatusSchema,
  owner: z.string().trim().min(1).max(180),
  href: z.string().trim().min(1).max(8192),
  summary: z.string().trim().min(1).max(1000)
});

const HeroOutcomeReplayReceiptPayloadSchema = z.object({
  receiptVersion: z.literal(HERO_OUTCOME_REPLAY_RECEIPT_VERSION),
  source: z.literal("hero-outcome-replay"),
  sourceReceiptId: z.string().trim().min(1).max(180),
  sourceChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  status: HeroOutcomeReplayStatusSchema,
  decision: HeroOutcomeReplayDecisionSchema,
  decisionLabel: z.string().trim().min(1).max(80),
  buyer: z.string().trim().min(1).max(220),
  score: z.number().int().min(0).max(100),
  primaryAction: ActionSchema,
  decisionReceiptHref: z.string().trim().min(1).max(8192),
  outcomeReplay: z.array(OutcomeReplayStepSchema).min(4).max(4),
  buyerQuestions: z.array(BuyerQuestionSchema).min(1).max(8),
  approvalPath: z.array(ApprovalPathStepSchema).min(1).max(8),
  sensitivity: z.object({
    verdict: HeroOutcomeReplaySensitivityVerdictSchema,
    confidenceBand: z.string().trim().min(1).max(240),
    breakEvenAdoptionPercent: z.number().int().min(0).max(150),
    valueAtRiskYen: z.number().int().min(0).max(1000000000),
    downsidePaybackDays: z.number().int().min(0).max(3650),
    downsideMonthlyValueYen: z.number().int().min(0).max(1000000000),
    downsideAdoptionRatePercent: z.number().int().min(0).max(100),
    downsideAutomationRatePercent: z.number().int().min(0).max(100)
  })
});

const HeroOutcomeReplayReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: HeroOutcomeReplayReceiptPayloadSchema
});

export function verifyHeroOutcomeReplayReceiptRequest(input: unknown) {
  const parsed = HeroOutcomeReplayReceiptVerificationSchema.safeParse(input);
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
  const verification = verifyHeroOutcomeReplayReceipt({
    checksum: parsed.data.checksum,
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "hero-outcome-replay.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        sourceReceiptId: payload.sourceReceiptId,
        buyer: payload.buyer,
        status: payload.status,
        decision: payload.decision,
        decisionLabel: payload.decisionLabel,
        score: payload.score,
        outcomeStepCount: payload.outcomeReplay.length,
        buyerQuestionCount: payload.buyerQuestions.length,
        approvalStepCount: payload.approvalPath.length,
        sensitivityVerdict: payload.sensitivity.verdict,
        breakEvenAdoptionPercent: payload.sensitivity.breakEvenAdoptionPercent,
        downsidePaybackDays: payload.sensitivity.downsidePaybackDays,
        firstAction: payload.primaryAction.label
      }
    }
  };
}
