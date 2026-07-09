import { z } from "zod";
import {
  QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH,
  QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION,
  verifyQuickWorkflowConversionReceipt,
  type QuickWorkflowConversionReceiptPayload
} from "../src/quickWorkflowConversionReceipt.js";

export { QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH };

const QuickWorkflowConversionStatusSchema = z.enum(["ready", "watch", "blocked"]);

const QuickWorkflowConversionRowSchema = z.object({
  id: z.enum(["scope", "value", "pilot", "proof", "a2a", "data"]),
  status: QuickWorkflowConversionStatusSchema,
  value: z.string().trim().min(1).max(1600),
  proof: z.string().trim().min(1).max(2400)
});

const QuickWorkflowConversionProofItemSchema = z.object({
  id: z.enum(["targetUrl", "protopediaUrl", "videoUrl", "pilotEvidenceUrl", "workOrderEvidenceUrl"]),
  status: QuickWorkflowConversionStatusSchema,
  value: z.string().trim().min(1).max(1600)
});

const QuickWorkflowConversionReceiptPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION),
  source: z.literal("quick-workflow-intake"),
  buyer: z.string().trim().min(1).max(220),
  workflow: z.string().trim().min(1).max(1200),
  status: QuickWorkflowConversionStatusSchema,
  decisionLabel: z.string().trim().min(1).max(220),
  decisionNextAction: z.string().trim().min(1).max(1600),
  pilotWeekReceiptId: z.string().trim().min(1).max(240),
  rows: z.array(QuickWorkflowConversionRowSchema).min(6).max(6),
  proofItems: z.array(QuickWorkflowConversionProofItemSchema).min(5).max(5)
});

const QuickWorkflowConversionReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: QuickWorkflowConversionReceiptPayloadSchema
});

export function verifyQuickWorkflowConversionReceiptRequest(input: unknown) {
  const parsed = QuickWorkflowConversionReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickWorkflowConversionReceiptPayload;
  const verification = verifyQuickWorkflowConversionReceipt({
    checksum: parsed.data.checksum,
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-workflow-conversion.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        buyer: payload.buyer,
        status: payload.status,
        rowCount: payload.rows.length,
        readyRows: payload.rows.filter((row) => row.status === "ready").length,
        proofReadyCount: payload.proofItems.filter((item) => item.status === "ready").length,
        firstOpenRow: payload.rows.find((row) => row.status !== "ready")?.id ?? "none",
        pilotWeekReceiptId: payload.pilotWeekReceiptId
      }
    }
  };
}
