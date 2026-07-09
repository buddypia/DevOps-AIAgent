import { z } from "zod";
import {
  GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERIFY_PATH,
  GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERSION,
  verifyGlobalPublishabilityRepairCheckReceipt,
  type GlobalPublishabilityRepairCheckReceiptPayload
} from "./globalPublishabilityRepairCheckReceipt.js";

export { GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERIFY_PATH };

const PublishabilityStatusSchema = z.enum(["pass", "watch", "block"]);
const RepairCheckStatusSchema = z.enum(["ready-to-rerun", "needs-review", "blocked"]);
const RepairCheckDecisionSchema = z.enum(["rerun-publishability", "sponsor-review", "no-send"]);
const SourceReceiptDecisionSchema = z.enum(["publish", "sponsor-review", "do-not-publish"]);
const RepairPrioritySchema = z.enum(["now", "next", "verify"]);
const RepairProofRequirementKindSchema = z.enum(["product-url", "story-url", "video-url", "receipt-url", "review-url", "ops-url", "launch-url"]);

const RepairProofRequirementSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(220),
  kind: RepairProofRequirementKindSchema,
  required: z.boolean(),
  placeholder: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(1000)
});

const ProofResultSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(220),
  url: z.string().trim().max(2200),
  status: PublishabilityStatusSchema,
  httpStatus: z.number().int().min(100).max(599).optional(),
  finalUrl: z.string().trim().max(2200).optional(),
  contentType: z.string().trim().max(300).optional(),
  evidence: z.string().trim().min(1).max(1600),
  action: z.string().trim().min(1).max(1600)
});

const GlobalPublishabilityRepairCheckReceiptPayloadSchema = z.object({
  receiptVersion: z.literal(GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERSION),
  reportId: z.string().trim().min(1).max(240),
  sourceReceiptDecision: SourceReceiptDecisionSchema,
  sourceReceiptChecksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  checkedAt: z.string().trim().min(1).max(120),
  status: RepairCheckStatusSchema,
  decision: RepairCheckDecisionSchema,
  summary: z.string().trim().min(1).max(1600),
  nextAction: z.string().trim().min(1).max(1600),
  requiredProofCount: z.number().int().min(0).max(5),
  suppliedProofCount: z.number().int().min(0).max(5),
  missingProofCount: z.number().int().min(0).max(5),
  verifiedCount: z.number().int().min(0).max(5),
  watchCount: z.number().int().min(0).max(5),
  blockedCount: z.number().int().min(0).max(5),
  score: z.number().min(0).max(100),
  step: z.object({
    id: z.string().trim().min(1).max(260),
    ticketId: z.string().trim().min(1).max(260),
    sequence: z.number().int().min(1).max(6),
    priority: RepairPrioritySchema,
    status: PublishabilityStatusSchema,
    owner: z.string().trim().min(1).max(180),
    title: z.string().trim().min(1).max(240),
    proofSlot: z.string().trim().min(1).max(1200),
    proofRequirements: z.array(RepairProofRequirementSchema).min(1).max(5),
    acceptanceSignal: z.string().trim().min(1).max(1200),
    recheckSignal: z.string().trim().min(1).max(1200),
    shareGate: z.string().trim().min(1).max(1200)
  }),
  proofSummary: z.object({
    checkedAt: z.string().trim().min(1).max(120),
    verifiedCount: z.number().int().min(0).max(5),
    totalCount: z.number().int().min(0).max(5),
    score: z.number().min(0).max(100)
  }),
  proofResults: z.array(ProofResultSchema).max(5)
});

const GlobalPublishabilityRepairCheckReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: GlobalPublishabilityRepairCheckReceiptPayloadSchema
});

export function verifyGlobalPublishabilityRepairCheckReceiptRequest(input: unknown) {
  const parsed = GlobalPublishabilityRepairCheckReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as GlobalPublishabilityRepairCheckReceiptPayload;
  const verification = verifyGlobalPublishabilityRepairCheckReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "global-publishability-repair-check.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        reportId: payload.reportId,
        status: payload.status,
        decision: payload.decision,
        sourceReceiptDecision: payload.sourceReceiptDecision,
        sourceReceiptChecksum: payload.sourceReceiptChecksum,
        checkedAt: payload.checkedAt,
        stepId: payload.step.id,
        stepTitle: payload.step.title,
        owner: payload.step.owner,
        proofScore: payload.score,
        requiredProofCount: payload.requiredProofCount,
        suppliedProofCount: payload.suppliedProofCount,
        missingProofCount: payload.missingProofCount,
        verifiedCount: payload.verifiedCount,
        watchCount: payload.watchCount,
        blockedCount: payload.blockedCount,
        nextAction: payload.nextAction
      }
    }
  };
}
