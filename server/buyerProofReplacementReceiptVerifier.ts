import { z } from "zod";
import {
  BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH,
  verifyBuyerProofReplacementReceipt,
  type BuyerProofReplacementReceiptPayload
} from "../src/buyerProofReplacementPacket.js";

export { BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH };

const ReplacementStatusSchema = z.enum(["ready", "attention", "blocked"]);
const ReplacementModeSchema = z.enum(["send", "verify", "replace"]);
const ReplacementSlotSchema = z.enum(["targetUrl", "protopediaUrl", "videoUrl", "pilotEvidenceUrl", "workOrderEvidenceUrl"]);
const ReplacementStateSchema = z.enum(["own-public", "unchecked", "unstable", "failed", "missing", "starter", "private"]);
const REPLAY_ROUTE_HREF_MAX_LENGTH = 30000;

const ReplacementRowSchema = z.object({
  id: ReplacementSlotSchema,
  label: z.string().trim().min(1).max(180),
  owner: z.string().trim().min(1).max(180),
  status: ReplacementStatusSchema,
  state: ReplacementStateSchema,
  value: z.string().max(1600),
  action: z.string().trim().min(1).max(1400),
  acceptance: z.string().trim().min(1).max(1400),
  href: z.string().max(REPLAY_ROUTE_HREF_MAX_LENGTH)
});

const BuyerProofReplacementReceiptPayloadSchema = z.object({
  receiptVersion: z.literal("buyer-proof-replacement.v1"),
  packetId: z.string().trim().min(1).max(180),
  status: ReplacementStatusSchema,
  mode: ReplacementModeSchema,
  headline: z.string().trim().min(1).max(260),
  readyCount: z.number().int().min(0).max(5),
  attentionCount: z.number().int().min(0).max(5),
  blockedCount: z.number().int().min(0).max(5),
  totalCount: z.number().int().min(1).max(5),
  primaryActionLabel: z.string().trim().min(1).max(180),
  primaryActionHref: z.string().trim().min(1).max(REPLAY_ROUTE_HREF_MAX_LENGTH),
  reviewSubject: z.string().trim().min(1).max(320),
  rows: z.array(ReplacementRowSchema).min(1).max(5),
  csvLedger: z.object({
    filename: z.literal("buyer-proof-replacement-ledger.csv"),
    rowCount: z.number().int().min(1).max(5),
    csvText: z.string().trim().min(1).max(12000)
  })
});

const BuyerProofReplacementReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: BuyerProofReplacementReceiptPayloadSchema
});

export function verifyBuyerProofReplacementReceiptRequest(input: unknown) {
  const parsed = BuyerProofReplacementReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as BuyerProofReplacementReceiptPayload;
  const verification = verifyBuyerProofReplacementReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "buyer-proof-replacement.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        packetId: payload.packetId,
        status: payload.status,
        mode: payload.mode,
        readyCount: payload.readyCount,
        attentionCount: payload.attentionCount,
        blockedCount: payload.blockedCount,
        csvLedger: {
          filename: payload.csvLedger.filename,
          rowCount: payload.csvLedger.rowCount
        }
      }
    }
  };
}
