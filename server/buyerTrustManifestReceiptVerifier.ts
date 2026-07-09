import { z } from "zod";
import {
  BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH,
  verifyBuyerTrustManifestReceipt,
  type BuyerTrustManifestPayload
} from "../src/buyerTrustManifest.js";

export { BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH };

const REPLAY_ROUTE_HREF_MAX_LENGTH = 30000;

const ManifestReadinessSchema = z.enum(["external-ready", "needs-proof", "blocked"]);
const ManifestStatusSchema = z.enum(["pass", "watch", "block"]);
const ManifestArtifactIdSchema = z.enum([
  "value-report",
  "work-order",
  "pilot-receipt",
  "evidence-ledger",
  "delivery-memo",
  "buyer-evidence-board",
  "proof-packet",
  "sponsor-review",
  "adoption-plan",
  "trust-center",
  "commercial-offer",
  "buyer-pilot-contract",
  "decision-follow-up",
  "live-proof-audit"
]);
const PublicationWindowStatusSchema = z.enum(["current", "recheck-required", "blocked"]);
const ReviewTaskIdSchema = z.enum(["live-proof-recheck", "manifest-regeneration", "sponsor-decision-replay", "buyer-review-checkpoint"]);

const ManifestArtifactSchema = z.object({
  id: ManifestArtifactIdSchema,
  status: ManifestStatusSchema,
  href: z.string().trim().min(1).max(REPLAY_ROUTE_HREF_MAX_LENGTH),
  evidence: z.string().trim().min(1).max(2400)
});

const ReviewTaskSchema = z.object({
  id: ReviewTaskIdSchema,
  status: ManifestStatusSchema,
  dueAt: z.string().trim().min(1).max(80),
  href: z.string().trim().min(1).max(REPLAY_ROUTE_HREF_MAX_LENGTH),
  action: z.string().trim().min(1).max(1800)
});

export const BuyerTrustManifestPayloadSchema = z.object({
  manifestVersion: z.literal("buyer-trust-manifest.v1"),
  subject: z.string().trim().min(1).max(240),
  generatedAt: z.string().trim().min(1).max(80),
  readiness: ManifestReadinessSchema,
  score: z.number().min(0).max(100),
  proofPacketReceiptDigest: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  buyerEvidenceBoardReceiptChecksum: z.string().trim().regex(/^[a-f0-9]{16}$/i).optional(),
  commercialOfferReceiptChecksum: z.string().trim().regex(/^[a-f0-9]{16}$/i).optional(),
  buyerPilotContractId: z.string().trim().min(1).max(260).optional(),
  buyerPilotContractReceiptChecksum: z.string().trim().regex(/^[a-f0-9]{16}$/i).optional(),
  sponsorDecisionReceiptId: z.string().trim().min(1).max(220),
  adoptionPlanId: z.string().trim().min(1).max(220),
  trustCenterId: z.string().trim().min(1).max(220),
  commercialOfferId: z.string().trim().min(1).max(220),
  artifacts: z.array(ManifestArtifactSchema).min(1).max(18),
  publicationWindow: z.object({
    status: PublicationWindowStatusSchema,
    proofExpiresAt: z.string().trim().min(1).max(80),
    manifestExpiresAt: z.string().trim().min(1).max(80),
    buyerReviewDueAt: z.string().trim().min(1).max(80),
    schedule: z.array(ReviewTaskSchema).min(1).max(4)
  })
});

const BuyerTrustManifestReceiptVerificationSchema = z.object({
  digest: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: BuyerTrustManifestPayloadSchema
});

export function verifyBuyerTrustManifestReceiptRequest(input: unknown) {
  const parsed = BuyerTrustManifestReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as BuyerTrustManifestPayload;
  const verification = verifyBuyerTrustManifestReceipt({
    digest: parsed.data.digest.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "buyer-trust-manifest.receipt.verify",
      verification,
      manifest: {
        manifestVersion: payload.manifestVersion,
        subject: payload.subject,
        readiness: payload.readiness,
        score: payload.score,
        artifactCount: payload.artifacts.length,
        publicationWindowStatus: payload.publicationWindow.status,
        proofPacketReceiptDigest: payload.proofPacketReceiptDigest
      }
    }
  };
}
