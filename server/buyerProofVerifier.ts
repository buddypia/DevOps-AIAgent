import { z } from "zod";
import { BUYER_PROOF_VERIFIER_API_PATH, buildBuyerProofVerifierReport, type BuyerProofVerifierManifest } from "../src/buyerProofVerifier.js";
import { BuyerTrustManifestPayloadSchema } from "./buyerTrustManifestReceiptVerifier.js";

export { BUYER_PROOF_VERIFIER_API_PATH };

const REPLAY_ROUTE_HREF_MAX_LENGTH = 30000;

const ManifestStatusSchema = z.enum(["pass", "watch", "block"]);
const ManifestReadinessSchema = z.enum(["external-ready", "needs-proof", "blocked"]);
const PublicationDecisionSchema = z.enum(["publish", "repair", "hold"]);
const PublicationWindowStatusSchema = z.enum(["current", "recheck-required", "blocked"]);

const VerifierArtifactSchema = z.object({
  id: z.string().trim().min(1).max(120),
  status: ManifestStatusSchema,
  href: z.string().trim().min(1).max(REPLAY_ROUTE_HREF_MAX_LENGTH),
  evidence: z.string().trim().min(1).max(2400).optional()
});

const VerifierReceiptSchema = z.object({
  id: z.string().trim().min(1).max(120),
  status: ManifestStatusSchema,
  algorithm: z.string().trim().min(1).max(80),
  digest: z.string().trim().min(1).max(260),
  evidence: z.string().trim().min(1).max(1800).optional(),
  verifier: z.string().trim().min(1).max(240).optional()
});

const BuyerProofVerifierManifestSchema = z.object({
  id: z.string().trim().min(1).max(260).optional(),
  manifestVersion: z.literal("buyer-trust-manifest.v1"),
  generatedAt: z.string().trim().min(1).max(80).optional(),
  subject: z.string().trim().min(1).max(240),
  readiness: ManifestReadinessSchema,
  score: z.number().min(0).max(100),
  proofPacketDigest: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  artifacts: z.array(VerifierArtifactSchema).min(1).max(24),
  receipts: z.array(VerifierReceiptSchema).min(1).max(8),
  publicationGate: z.object({
    decision: PublicationDecisionSchema,
    score: z.number().min(0).max(100),
    blockedCount: z.number().int().min(0).max(50),
    watchCount: z.number().int().min(0).max(50),
    firstAction: z.string().trim().min(1).max(1800),
    firstActionHref: z.string().trim().min(1).max(REPLAY_ROUTE_HREF_MAX_LENGTH)
  }),
  publicationWindow: z.object({
    status: PublicationWindowStatusSchema,
    proofExpiresAt: z.string().trim().min(1).max(80),
    manifestExpiresAt: z.string().trim().min(1).max(80),
    buyerReviewDueAt: z.string().trim().min(1).max(80),
    firstRecheck: z.string().trim().min(1).max(1800).optional(),
    firstRecheckHref: z.string().trim().min(1).max(REPLAY_ROUTE_HREF_MAX_LENGTH).optional()
  }),
  verification: z.object({
    digest: z.string().trim().regex(/^[a-f0-9]{16}$/i),
    payload: BuyerTrustManifestPayloadSchema
  })
});

const BuyerProofVerifierRequestSchema = z.object({
  expectedDigest: z.string().trim().regex(/^[a-f0-9]{16}$/i).optional(),
  manifest: BuyerProofVerifierManifestSchema
});

export function verifyBuyerProofManifestRequest(input: unknown, checkedAt?: string) {
  const parsed = BuyerProofVerifierRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const report = buildBuyerProofVerifierReport({
    manifest: parsed.data.manifest as BuyerProofVerifierManifest,
    expectedDigest: parsed.data.expectedDigest,
    checkedAt
  });

  return {
    statusCode: 200,
    body: {
      skill: "buyer-proof-verifier.report",
      report
    }
  };
}
