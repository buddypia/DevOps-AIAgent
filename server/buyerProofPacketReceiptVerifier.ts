import { z } from "zod";
import {
  BUYER_PROOF_PACKET_RECEIPT_VERIFY_PATH,
  verifyBuyerProofPacketReceipt,
  type BuyerProofPacketReceiptPayload
} from "../src/buyerProofPacket.js";

export { BUYER_PROOF_PACKET_RECEIPT_VERIFY_PATH };

const ArtifactIdSchema = z.enum(["value-report", "proposal", "workflow", "receipt", "decision", "agreement", "ledger", "diligence", "execution", "review"]);
const EvidenceRowSchema = z.object({
  id: z.string().trim().min(1).max(160),
  status: z.enum(["clear", "watch", "blocked"]),
  owner: z.string().trim().min(1).max(180),
  artifactId: ArtifactIdSchema,
  claim: z.string().trim().min(1).max(1200),
  evidence: z.string().trim().min(1).max(1200),
  nextAction: z.string().trim().min(1).max(1200)
});

const BuyerProofPacketReceiptPayloadSchema = z.object({
  manifestVersion: z.literal("buyer-proof-packet.v1"),
  packetId: z.string().trim().min(1).max(180),
  readiness: z.enum(["share-ready", "needs-evidence", "blocked"]),
  packetScore: z.number().min(0).max(100),
  headline: z.string().trim().min(1).max(240),
  targetBuyer: z.string().trim().min(1).max(240),
  decisionAsk: z.string().trim().min(1).max(1000),
  coveredArtifacts: z.array(ArtifactIdSchema).min(1).max(10),
  sourceScores: z.object({
    recommendation: z.number().min(0).max(100),
    valueBlueprint: z.number().min(0).max(100),
    buyerScenario: z.number().min(0).max(100),
    proposal: z.number().min(0).max(100),
    ledger: z.number().min(0).max(100),
    diligence: z.number().min(0).max(100),
    sponsorReview: z.number().min(0).max(100),
    evidenceRows: z.number().min(0).max(100)
  }),
  rows: z.array(EvidenceRowSchema).min(1).max(20),
  gaps: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(160),
        severity: z.enum(["watch", "blocked"]),
        owner: z.string().trim().min(1).max(180),
        fix: z.string().trim().min(1).max(1200)
      })
    )
    .max(20),
  realityChecks: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(160),
        value: z.string().trim().min(1).max(240),
        source: z.string().trim().min(1).max(160)
      })
    )
    .min(1)
    .max(10)
});

const BuyerProofPacketReceiptVerificationSchema = z.object({
  digest: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: BuyerProofPacketReceiptPayloadSchema
});

export function verifyBuyerProofPacketReceiptRequest(input: unknown) {
  const parsed = BuyerProofPacketReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as BuyerProofPacketReceiptPayload;
  const verification = verifyBuyerProofPacketReceipt({
    digest: parsed.data.digest.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "buyer-proof-packet.receipt.verify",
      verification,
      receipt: {
        manifestVersion: payload.manifestVersion,
        packetId: payload.packetId,
        readiness: payload.readiness,
        targetBuyer: payload.targetBuyer,
        coveredArtifacts: payload.coveredArtifacts
      }
    }
  };
}
