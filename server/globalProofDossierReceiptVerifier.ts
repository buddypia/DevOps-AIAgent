import { z } from "zod";
import {
  GLOBAL_PROOF_DOSSIER_RECEIPT_VERIFY_PATH,
  verifyGlobalProofDossierReceipt,
  type GlobalProofDossierReceiptPayload
} from "../src/globalProofDossierReceipt.js";

export { GLOBAL_PROOF_DOSSIER_RECEIPT_VERIFY_PATH };

const DossierStatusSchema = z.enum(["pass", "watch", "block"]);
const ClaimIdSchema = z.enum(["buyer-value", "measured-outcome", "public-reachability", "proof-depth", "production-ops", "trust-offer"]);
const LinkIdSchema = z.enum(["targetUrl", "protopediaUrl", "videoUrl", "pilotEvidenceUrl", "workOrderEvidenceUrl"]);

const GlobalProofDossierReceiptPayloadSchema = z.object({
  receiptVersion: z.literal("global-proof-dossier.v1"),
  dossierId: z.string().trim().min(1).max(220),
  generatedAt: z.string().trim().min(1).max(120),
  decision: z.enum(["share-with-buyer", "sponsor-review", "hold-public-launch"]),
  dossierScore: z.number().min(0).max(100),
  targetBuyer: z.string().trim().min(1).max(240),
  decisionAsk: z.string().trim().min(1).max(1200),
  verifiedSummary: z.string().trim().min(1).max(1200),
  proofWindow: z.string().trim().min(1).max(1200),
  claims: z
    .array(
      z.object({
        id: ClaimIdSchema,
        label: z.string().trim().min(1).max(220),
        status: DossierStatusSchema,
        score: z.number().min(0).max(100),
        claim: z.string().trim().min(1).max(1400),
        decisionRule: z.string().trim().min(1).max(1400)
      })
    )
    .min(1)
    .max(6),
  proofLinks: z
    .array(
      z.object({
        id: LinkIdSchema,
        label: z.string().trim().min(1).max(220),
        url: z.string().max(1800),
        status: DossierStatusSchema,
        httpStatus: z.number().int().min(100).max(599).optional(),
        evidence: z.string().trim().min(1).max(1400),
        action: z.string().trim().min(1).max(1400)
      })
    )
    .min(1)
    .max(5),
  redLines: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(220),
        status: DossierStatusSchema,
        label: z.string().trim().min(1).max(220),
        owner: z.string().trim().min(1).max(180),
        action: z.string().trim().min(1).max(1400)
      })
    )
    .max(12)
});

const GlobalProofDossierReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: GlobalProofDossierReceiptPayloadSchema
});

export function verifyGlobalProofDossierReceiptRequest(input: unknown) {
  const parsed = GlobalProofDossierReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as GlobalProofDossierReceiptPayload;
  const verification = verifyGlobalProofDossierReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "global-proof-dossier.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        decision: payload.decision,
        dossierScore: payload.dossierScore,
        targetBuyer: payload.targetBuyer,
        verifiedSummary: payload.verifiedSummary,
        blockedClaims: payload.claims.filter((claim) => claim.status === "block").length,
        blockedProofLinks: payload.proofLinks.filter((link) => link.status === "block").length,
        redLineCount: payload.redLines.length
      }
    }
  };
}
