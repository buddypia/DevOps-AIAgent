import { z } from "zod";
import {
  WORKFLOW_LIVE_PROOF_AUDIT_RECEIPT_VERSION,
  WORKFLOW_LIVE_PROOF_AUDIT_VERIFY_PATH,
  verifyWorkflowLiveProofAuditReceipt,
  type WorkflowLiveProofAuditPayload
} from "../src/workflowLiveProofAudit.js";

export { WORKFLOW_LIVE_PROOF_AUDIT_VERIFY_PATH };

const LiveProofAuditStatusSchema = z.enum(["verified", "action-required", "not-run"]);
const LiveProofAuditRowStatusSchema = z.enum(["pass", "watch", "block", "missing"]);

const LiveProofAuditRowSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(220),
  url: z.string().trim().max(1000),
  status: LiveProofAuditRowStatusSchema,
  evidence: z.string().trim().min(1).max(1200),
  action: z.string().trim().min(1).max(1200)
});

const LiveProofAuditPayloadSchema = z.object({
  receiptVersion: z.literal(WORKFLOW_LIVE_PROOF_AUDIT_RECEIPT_VERSION),
  status: LiveProofAuditStatusSchema,
  headline: z.string().trim().min(1).max(220),
  summary: z.string().trim().min(1).max(1200),
  checkedAt: z.string().trim().max(120),
  score: z.number().finite().min(0).max(100),
  verifiedCount: z.number().int().min(0).max(8),
  totalCount: z.number().int().min(0).max(8),
  rows: z.array(LiveProofAuditRowSchema).min(1).max(8),
  nextAction: z.string().trim().min(1).max(1200)
});

const LiveProofAuditVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: LiveProofAuditPayloadSchema
});

export function verifyWorkflowLiveProofAuditRequest(input: unknown) {
  const parsed = LiveProofAuditVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as WorkflowLiveProofAuditPayload;
  const verification = verifyWorkflowLiveProofAuditReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "workflow-live-proof-audit.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        checkedAt: payload.checkedAt,
        score: payload.score,
        verifiedCount: payload.verifiedCount,
        totalCount: payload.totalCount,
        blockedCount: payload.rows.filter((row) => row.status === "block" || row.status === "missing").length,
        watchCount: payload.rows.filter((row) => row.status === "watch").length,
        nextAction: payload.nextAction
      }
    }
  };
}
