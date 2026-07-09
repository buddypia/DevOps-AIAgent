import { z } from "zod";
import {
  SUBMISSION_FINAL_SUBMIT_RECEIPT_VERIFY_PATH,
  SUBMISSION_FINAL_SUBMIT_RECEIPT_VERSION,
  verifySubmissionFinalSubmitReceipt,
  type SubmissionFinalSubmitReceiptPayload
} from "../src/submissionFinalSubmitReceipt.js";

export { SUBMISSION_FINAL_SUBMIT_RECEIPT_VERIFY_PATH };

const SubmissionFinalSubmitStatusSchema = z.enum(["submit-ready", "action-required"]);
const SubmissionFinalSubmitRowStatusSchema = z.enum(["pass", "watch", "block", "missing"]);

const SubmissionFinalSubmitRowSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(220),
  url: z.string().trim().max(1000),
  status: SubmissionFinalSubmitRowStatusSchema,
  httpStatus: z.number().int().min(100).max(599).optional(),
  evidence: z.string().trim().min(1).max(1200),
  action: z.string().trim().min(1).max(1200)
});

const SubmissionFinalSubmitPayloadSchema = z.object({
  receiptVersion: z.literal(SUBMISSION_FINAL_SUBMIT_RECEIPT_VERSION),
  status: SubmissionFinalSubmitStatusSchema,
  headline: z.string().trim().min(1).max(220),
  summary: z.string().trim().min(1).max(1200),
  checkedAt: z.string().trim().min(1).max(120),
  score: z.number().finite().min(0).max(100),
  deadline: z.string().trim().min(1).max(120),
  readyFieldCount: z.number().int().min(0).max(20),
  totalFieldCount: z.number().int().min(1).max(20),
  openFieldCount: z.number().int().min(0).max(20),
  invalidFieldCount: z.number().int().min(0).max(20),
  verifiedCount: z.number().int().min(0).max(8),
  totalCount: z.number().int().min(1).max(8),
  blockedCount: z.number().int().min(0).max(8),
  watchCount: z.number().int().min(0).max(8),
  rows: z.array(SubmissionFinalSubmitRowSchema).min(1).max(8),
  nextAction: z.string().trim().min(1).max(1200)
});

const SubmissionFinalSubmitVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: SubmissionFinalSubmitPayloadSchema
});

export function verifySubmissionFinalSubmitReceiptRequest(input: unknown) {
  const parsed = SubmissionFinalSubmitVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as SubmissionFinalSubmitReceiptPayload;
  const verification = verifySubmissionFinalSubmitReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "submission-final-submit.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        checkedAt: payload.checkedAt,
        score: payload.score,
        deadline: payload.deadline,
        readyFieldCount: payload.readyFieldCount,
        totalFieldCount: payload.totalFieldCount,
        verifiedCount: payload.verifiedCount,
        totalCount: payload.totalCount,
        blockedCount: payload.blockedCount,
        watchCount: payload.watchCount,
        nextAction: payload.nextAction
      }
    }
  };
}
