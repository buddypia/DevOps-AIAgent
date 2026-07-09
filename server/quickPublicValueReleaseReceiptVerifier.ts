import { z } from "zod";
import {
  QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERIFY_PATH,
  QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION,
  verifyQuickPublicValueReleaseReceipt,
  type QuickPublicValueReleaseReceiptPayload
} from "../src/quickPublicValueReleaseReceipt.js";

export { QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERIFY_PATH };

const QuickPublicValueReleaseStatusSchema = z.enum(["ready", "watch", "blocked"]);

const QuickPublicValueReleaseCheckSchema = z.object({
  id: z.enum(["value", "sponsor", "publication", "live-proof"]),
  label: z.string().trim().min(1).max(180),
  status: QuickPublicValueReleaseStatusSchema,
  value: z.string().trim().min(1).max(1200),
  evidence: z.string().trim().min(1).max(2400),
  owner: z.string().trim().min(1).max(180),
  action: z.string().trim().min(1).max(1600)
});

const QuickPublicValueReleaseReceiptPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION),
  source: z.literal("quick-workflow-intake"),
  buyer: z.string().trim().min(1).max(220),
  workflow: z.string().trim().min(1).max(1200),
  status: QuickPublicValueReleaseStatusSchema,
  label: z.string().trim().min(1).max(180),
  releaseScore: z.number().int().min(0).max(100),
  shareableMonthlyValueYen: z.number().int().min(0).max(1000000000),
  lockedMonthlyValueYen: z.number().int().min(0).max(1000000000),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1600),
  releaseRule: z.string().trim().min(1).max(2200),
  sourceReceiptId: z.string().trim().regex(/^quick-conversion-(ready|watch|blocked)-[a-f0-9]{8}$/i),
  sourceChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  sponsorGateReceiptId: z.string().trim().regex(/^quick-sponsor-gate-(send-after-live-proof|repair-before-sponsor|hold-internal)-[a-f0-9]{8}$/i),
  liveProofAuditReceiptId: z.string().trim().max(180),
  liveProofAuditChecksum: z.string().trim().max(80),
  publicationReadyCount: z.number().int().min(0).max(12),
  publicationTotalCount: z.number().int().min(1).max(12),
  checks: z.array(QuickPublicValueReleaseCheckSchema).min(4).max(4)
});

const QuickPublicValueReleaseVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: QuickPublicValueReleaseReceiptPayloadSchema
});

export function verifyQuickPublicValueReleaseReceiptRequest(input: unknown) {
  const parsed = QuickPublicValueReleaseVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickPublicValueReleaseReceiptPayload;
  const verification = verifyQuickPublicValueReleaseReceipt({
    checksum: parsed.data.checksum,
    payload
  });
  const blockedCount = payload.checks.filter((check) => check.status === "blocked").length;
  const watchCount = payload.checks.filter((check) => check.status === "watch").length;

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-public-value-release.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        buyer: payload.buyer,
        status: payload.status,
        releaseScore: payload.releaseScore,
        shareableMonthlyValueYen: payload.shareableMonthlyValueYen,
        lockedMonthlyValueYen: payload.lockedMonthlyValueYen,
        blockedCount,
        watchCount,
        publicationReadyCount: payload.publicationReadyCount,
        publicationTotalCount: payload.publicationTotalCount,
        sourceReceiptId: payload.sourceReceiptId,
        sourceChecksum: payload.sourceChecksum,
        nextOwner: payload.nextOwner,
        nextAction: payload.nextAction
      }
    }
  };
}
