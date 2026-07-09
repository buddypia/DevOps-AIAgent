import { z } from "zod";
import {
  BUYER_SHARE_GATE_RECEIPT_VERIFY_PATH,
  verifyBuyerShareGateReceipt,
  type BuyerShareGateReceiptPayload
} from "../src/buyerShareGate.js";

export { BUYER_SHARE_GATE_RECEIPT_VERIFY_PATH };

const CheckStatusSchema = z.enum(["pass", "watch", "block"]);
const BuyerShareGateCheckSchema = z.object({
  id: z.enum(["launch-room", "public-proof", "measured-run", "artifact-closure"]),
  label: z.string().trim().min(1).max(180),
  status: CheckStatusSchema,
  score: z.number().min(0).max(100),
  evidence: z.string().trim().min(1).max(1400),
  action: z.string().trim().min(1).max(1400),
  href: z.string().trim().min(1).max(1600)
});

const BuyerShareGateRepairPlanItemSchema = z.object({
  id: z.enum(["launch-room", "public-proof", "measured-run", "artifact-closure"]),
  sequence: z.number().int().min(1).max(4),
  label: z.string().trim().min(1).max(180),
  status: CheckStatusSchema,
  owner: z.string().trim().min(1).max(160),
  action: z.string().trim().min(1).max(1400),
  evidence: z.string().trim().min(1).max(1400),
  href: z.string().trim().min(1).max(1600),
  unlock: z.string().trim().min(1).max(600)
});

const BuyerShareGateRepairPlanSchema = z.object({
  status: z.enum(["ready", "review", "repair"]),
  headline: z.string().trim().min(1).max(220),
  summary: z.string().trim().min(1).max(800),
  items: z.array(BuyerShareGateRepairPlanItemSchema).max(4)
});

const BuyerShareGateReceiptPayloadSchema = z.object({
  receiptVersion: z.literal("buyer-share-gate.v1"),
  readiness: z.enum(["send-ready", "almost-ready", "needs-room", "needs-proof", "needs-measurement"]),
  score: z.number().min(0).max(100),
  mode: z.enum(["send", "review", "hold"]),
  subject: z.string().trim().min(1).max(280),
  primaryActionLabel: z.string().trim().min(1).max(160),
  primaryActionHref: z.string().trim().min(1).max(1600),
  blockerCount: z.number().int().min(0).max(4),
  watchCount: z.number().int().min(0).max(4),
  checks: z.array(BuyerShareGateCheckSchema).min(4).max(4),
  repairPlan: BuyerShareGateRepairPlanSchema.optional(),
  stopRules: z.array(z.string().trim().min(1).max(1000)).min(1).max(10)
});

const BuyerShareGateReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: BuyerShareGateReceiptPayloadSchema
});

export function verifyBuyerShareGateReceiptRequest(input: unknown) {
  const parsed = BuyerShareGateReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as BuyerShareGateReceiptPayload;
  const verification = verifyBuyerShareGateReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "buyer-share-gate.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        readiness: payload.readiness,
        mode: payload.mode,
        score: payload.score,
        blockerCount: payload.blockerCount,
        watchCount: payload.watchCount
      }
    }
  };
}
