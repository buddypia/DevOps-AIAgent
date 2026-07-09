import { z } from "zod";
import {
  GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH,
  verifyGlobalPublishabilityReceipt,
  type GlobalPublishabilityReceiptPayload
} from "../src/globalPublishabilityReceipt.js";

export { GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH };

const PublishabilityStatusSchema = z.enum(["pass", "watch", "block"]);
const PublishabilityDecisionSchema = z.enum(["publish", "sponsor-review", "do-not-publish"]);
const PublishabilityGateIdSchema = z.enum(["value-story", "live-reachability", "proof-substance", "ops-trust", "buyer-decision-path"]);
const PublishabilityValueRouteIdSchema = z.enum(["buyer-value", "measured-proof", "public-proof", "buyer-decision"]);
const ReviewerDecisionIdSchema = z.enum(["approve-bounded-pilot", "sponsor-review", "hold-public-launch"]);
const LaunchPacketPrioritySchema = z.enum(["now", "next", "verify"]);
const RepairRunbookModeSchema = z.enum(["send-ready", "sponsor-review", "repair-required"]);
const RepairProofRequirementKindSchema = z.enum(["product-url", "story-url", "video-url", "receipt-url", "review-url", "ops-url", "launch-url"]);

const LinkSchema = z.object({
  id: z.string().trim().min(1).max(220),
  label: z.string().trim().min(1).max(220),
  href: z.string().trim().min(1).max(2200)
});

const GlobalPublishabilityReceiptPayloadSchema = z.object({
  receiptVersion: z.literal("global-publishability.v1"),
  reportId: z.string().trim().min(1).max(240),
  generatedAt: z.string().trim().min(1).max(120),
  decision: PublishabilityDecisionSchema,
  status: PublishabilityStatusSchema,
  publishabilityScore: z.number().min(0).max(100),
  targetBuyer: z.string().trim().min(1).max(240),
  verifiedSummary: z.string().trim().min(1).max(1400),
  recommendedDecision: ReviewerDecisionIdSchema,
  primaryAction: z.object({
    label: z.string().trim().min(1).max(240),
    href: z.string().trim().min(1).max(2200)
  }),
  gates: z
    .array(
      z.object({
        id: PublishabilityGateIdSchema,
        label: z.string().trim().min(1).max(240),
        status: PublishabilityStatusSchema,
        score: z.number().min(0).max(100),
        action: z.string().trim().min(1).max(1600),
        href: z.string().trim().min(1).max(2200)
      })
    )
    .min(1)
    .max(5),
  valueRoute: z
    .array(
      z.object({
        id: PublishabilityValueRouteIdSchema,
        label: z.string().trim().min(1).max(160),
        status: PublishabilityStatusSchema,
        score: z.number().min(0).max(100),
        href: z.string().trim().min(1).max(2200)
      })
    )
    .min(1)
    .max(4),
  repairs: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(220),
        priority: z.enum(["now", "next"]),
        owner: z.string().trim().min(1).max(180),
        label: z.string().trim().min(1).max(240),
        action: z.string().trim().min(1).max(1600),
        href: z.string().trim().min(1).max(2200)
      })
    )
    .max(6),
  repairTickets: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(260),
        sourceItemId: z.string().trim().min(1).max(220),
        status: PublishabilityStatusSchema,
        priority: LaunchPacketPrioritySchema,
        owner: z.string().trim().min(1).max(180),
        title: z.string().trim().min(1).max(240),
        command: z.string().trim().min(1).max(1600),
        proofToAttach: z.string().trim().min(1).max(2400),
        acceptanceCriteria: z.array(z.string().trim().min(1).max(1200)).min(1).max(5),
        recheck: z.object({
          label: z.string().trim().min(1).max(220),
          href: z.string().trim().min(1).max(2200),
          expectedSignal: z.string().trim().min(1).max(1200)
        }),
        receiptGuard: z.string().trim().min(1).max(1400)
      })
    )
    .min(1)
    .max(6),
  repairRunbook: z.object({
    mode: RepairRunbookModeSchema,
    status: PublishabilityStatusSchema,
    headline: z.string().trim().min(1).max(260),
    externalShareLocked: z.boolean(),
    currentOwner: z.string().trim().min(1).max(180),
    currentCommand: z.string().trim().min(1).max(1600),
    verificationCommand: z.string().trim().min(1).max(1800),
    shareRule: z.string().trim().min(1).max(1600),
    stepCount: z.number().int().min(1).max(6),
    nowCount: z.number().int().min(0).max(6),
    nextCount: z.number().int().min(0).max(6),
    verifyCount: z.number().int().min(0).max(6),
    steps: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(260),
          ticketId: z.string().trim().min(1).max(260),
          sequence: z.number().int().min(1).max(6),
          status: PublishabilityStatusSchema,
          priority: LaunchPacketPrioritySchema,
          owner: z.string().trim().min(1).max(180),
          title: z.string().trim().min(1).max(240),
          inputHref: z.string().trim().min(1).max(2200),
          proofSlot: z.string().trim().min(1).max(1200),
          proofRequirements: z
            .array(
              z.object({
                id: z.string().trim().min(1).max(120),
                label: z.string().trim().min(1).max(220),
                kind: RepairProofRequirementKindSchema,
                required: z.boolean(),
                placeholder: z.string().trim().min(1).max(300),
                description: z.string().trim().min(1).max(1000)
              })
            )
            .min(1)
            .max(5),
          acceptanceSignal: z.string().trim().min(1).max(1200),
          recheckSignal: z.string().trim().min(1).max(1200),
          shareGate: z.string().trim().min(1).max(1200)
        })
      )
      .min(1)
      .max(6)
  }),
  proofLinks: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(120),
        label: z.string().trim().min(1).max(220),
        url: z.string().max(2200),
        status: PublishabilityStatusSchema,
        httpStatus: z.number().int().min(100).max(599).optional(),
        evidence: z.string().trim().min(1).max(1600),
        action: z.string().trim().min(1).max(1600)
      })
    )
    .max(5),
  launchPacket: z.object({
    status: PublishabilityStatusSchema,
    headline: z.string().trim().min(1).max(260),
    currentOwner: z.string().trim().min(1).max(180),
    currentCommand: z.string().trim().min(1).max(1600),
    publishRule: z.string().trim().min(1).max(1600),
    escalationRule: z.string().trim().min(1).max(1600),
    blockedCount: z.number().int().min(0).max(5),
    watchCount: z.number().int().min(0).max(5),
    itemCount: z.number().int().min(1).max(6),
    additionalItemCount: z.number().int().min(0).max(6),
    items: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(220),
          status: PublishabilityStatusSchema,
          priority: LaunchPacketPrioritySchema,
          owner: z.string().trim().min(1).max(180),
          label: z.string().trim().min(1).max(240),
          command: z.string().trim().min(1).max(1600),
          proofToAttach: z.string().trim().min(1).max(2400),
          doneSignal: z.string().trim().min(1).max(1000),
          href: z.string().trim().min(1).max(2200)
        })
      )
      .min(1)
      .max(6)
  }),
  handoffMemo: z.object({
    audience: z.enum(["buyer-sponsor", "internal-sponsor", "launch-owner"]),
    subject: z.string().trim().min(1).max(260),
    requestedDecision: z.string().trim().min(1).max(1000),
    noSendWarning: z.string().trim().min(1).max(1000).optional(),
    proofLinks: z.array(LinkSchema).max(6)
  })
});

const GlobalPublishabilityReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: GlobalPublishabilityReceiptPayloadSchema
});

export function verifyGlobalPublishabilityReceiptRequest(input: unknown) {
  const parsed = GlobalPublishabilityReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as GlobalPublishabilityReceiptPayload;
  const verification = verifyGlobalPublishabilityReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "global-publishability.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        decision: payload.decision,
        status: payload.status,
        publishabilityScore: payload.publishabilityScore,
        targetBuyer: payload.targetBuyer,
        recommendedDecision: payload.recommendedDecision,
        blockedGates: payload.gates.filter((gate) => gate.status === "block").length,
        blockedProofLinks: payload.proofLinks.filter((link) => link.status === "block").length,
        repairCount: payload.repairs.length,
        repairTicketCount: payload.repairTickets.length,
        firstRepairTicket: payload.repairTickets[0]?.title ?? null
      }
    }
  };
}
