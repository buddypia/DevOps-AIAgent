import { z } from "zod";
import {
  BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH,
  verifyBuyerProofRecoveryReceipt,
  type BuyerProofRecoveryReceiptPayload
} from "../src/buyerProofRecoveryReceipt.js";

export { BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH };

const RecoveryStepSchema = z.object({
  id: z.string().trim().min(1).max(160),
  label: z.string().trim().min(1).max(220),
  status: z.enum(["pass", "watch", "block"]),
  owner: z.string().trim().min(1).max(180),
  due: z.string().trim().min(1).max(160),
  source: z.string().trim().min(1).max(220),
  action: z.string().trim().min(1).max(1400),
  acceptance: z.string().trim().min(1).max(1200),
  href: z.string().max(1600)
});

const BuyerProofRecoveryReceiptPayloadSchema = z.object({
  receiptVersion: z.literal("buyer-proof-recovery.v1"),
  severity: z.enum(["no-incident", "watch", "incident"]),
  shareInstruction: z.string().trim().min(1).max(220),
  checkedAt: z.string().trim().min(1).max(120),
  openTaskCount: z.number().int().min(0).max(100),
  blockedTaskCount: z.number().int().min(0).max(100),
  watchTaskCount: z.number().int().min(0).max(100),
  firstAction: z.string().trim().min(1).max(1400),
  steps: z.array(RecoveryStepSchema).min(1).max(20),
  resumeCriteria: z.array(z.string().trim().min(1).max(1200)).min(1).max(10),
  repairPacket: z.object({
    subject: z.string().trim().min(1).max(1200),
    owner: z.string().trim().min(1).max(180),
    due: z.string().trim().min(1).max(160),
    severity: z.enum(["no-incident", "watch", "incident"])
  }),
  taskLedger: z.object({
    filename: z.string().trim().min(1).max(180),
    taskCount: z.number().int().min(0).max(100),
    csvText: z.string().trim().min(1).max(12000)
  })
});

const BuyerProofRecoveryReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: BuyerProofRecoveryReceiptPayloadSchema
});

export function verifyBuyerProofRecoveryReceiptRequest(input: unknown) {
  const parsed = BuyerProofRecoveryReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as BuyerProofRecoveryReceiptPayload;
  const verification = verifyBuyerProofRecoveryReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "buyer-proof-recovery.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        severity: payload.severity,
        shareInstruction: payload.shareInstruction,
        openTaskCount: payload.openTaskCount,
        blockedTaskCount: payload.blockedTaskCount,
        watchTaskCount: payload.watchTaskCount,
        taskLedger: {
          filename: payload.taskLedger.filename,
          taskCount: payload.taskLedger.taskCount
        }
      }
    }
  };
}
