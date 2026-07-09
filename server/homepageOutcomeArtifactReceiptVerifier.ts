import { z } from "zod";
import {
  HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH,
  HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION,
  verifyHomepageOutcomeArtifactReceipt
} from "../src/homepageOutcomeArtifactReceipt.js";

export { HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH };

const HomepageOutcomeArtifactStatusSchema = z.enum(["ready", "attention", "blocked"]);
const BuyerOutcomeDecisionSchema = z.enum(["send-to-buyer", "sponsor-review", "repair-before-share"]);
const HomepageOutcomePacketItemIdSchema = z.enum(["buyer-one-pager", "value-proof", "proof-gate", "decision-handoff"]);

const HomepageOutcomeArtifactReceiptPayloadSchema = z.object({
  receiptVersion: z.literal(HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION),
  source: z.literal("homepage-outcome-artifact"),
  buyer: z.string().trim().min(1).max(220),
  decision: BuyerOutcomeDecisionSchema,
  status: HomepageOutcomeArtifactStatusSchema,
  readyCount: z.number().int().min(0).max(4),
  itemCount: z.number().int().min(1).max(4),
  items: z
    .array(
      z.object({
        id: HomepageOutcomePacketItemIdSchema,
        label: z.string().trim().min(1).max(140),
        status: HomepageOutcomeArtifactStatusSchema,
        value: z.string().trim().min(1).max(1000),
        proof: z.string().trim().min(1).max(1600),
        href: z.string().trim().min(1).max(8192),
        actionLabel: z.string().trim().min(1).max(180)
      })
    )
    .min(1)
    .max(4)
});

const HomepageOutcomeArtifactReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: HomepageOutcomeArtifactReceiptPayloadSchema
});

export function verifyHomepageOutcomeArtifactReceiptRequest(input: unknown) {
  const parsed = HomepageOutcomeArtifactReceiptVerificationSchema.safeParse(input);
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
  const verification = verifyHomepageOutcomeArtifactReceipt({
    checksum: parsed.data.checksum,
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "homepage-outcome-artifact.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        buyer: payload.buyer,
        decision: payload.decision,
        status: payload.status,
        readyCount: payload.readyCount,
        itemCount: payload.itemCount,
        blockedItems: payload.items.filter((item) => item.status === "blocked").length,
        firstAction: payload.items.find((item) => item.status !== "ready")?.actionLabel ?? payload.items[payload.items.length - 1]?.actionLabel ?? "Open buyer packet"
      }
    }
  };
}
