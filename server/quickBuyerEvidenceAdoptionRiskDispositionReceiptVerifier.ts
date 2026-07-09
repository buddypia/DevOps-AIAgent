import { z } from "zod";
import {
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_RECEIPT_VERSION,
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_VERIFY_PATH,
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_RECEIPT_VERSION,
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_VERIFY_PATH,
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_RECEIPT_VERSION,
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_VERIFY_PATH,
  verifyQuickBuyerEvidenceAdoptionRiskDispositionReceipt,
  verifyQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt,
  verifyQuickBuyerEvidenceAdoptionRiskSendControlReceipt,
  type QuickBuyerEvidenceAdoptionRiskSendControlPayload,
  type QuickBuyerEvidenceAdoptionRiskOwnerCloseoutPayload,
  type QuickBuyerEvidenceAdoptionRiskDispositionPayload
} from "../src/quickBuyerEvidenceAdoptionRiskDispositionReceipt.js";

export { QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_VERIFY_PATH };
export { QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_VERIFY_PATH };
export { QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_VERIFY_PATH };

const RiskStatusSchema = z.enum(["ready", "watch", "blocked"]);
const RiskSeveritySchema = z.enum(["low", "medium", "high"]);
const RiskDecisionSchema = z.enum(["accept-risk-ledger", "repair-open-risk", "hold-buyer-send"]);
const RiskOwnerCloseoutDecisionSchema = z.enum(["accept-risk-closeout", "hold-risk-closeout"]);
const RiskSendControlDecisionSchema = z.enum(["reopen-buyer-send", "run-risk-recheck", "hold-buyer-send"]);
const RiskSendControlCriterionStatusSchema = z.enum(["pass", "watch", "block"]);
const RiskIdSchema = z.enum(["source-trust", "disclosure-boundary", "proof-reachability", "value-proof", "decision-ownership"]);

const RiskItemSchema = z.object({
  id: RiskIdSchema,
  label: z.string().trim().min(1).max(180),
  status: RiskStatusSchema,
  severity: RiskSeveritySchema,
  owner: z.string().trim().min(1).max(180),
  exposure: z.string().trim().min(1).max(1800),
  mitigation: z.string().trim().min(1).max(1800),
  proofRequired: z.string().trim().min(1).max(1800),
  evidence: z.string().trim().min(1).max(2400),
  href: z.string().max(30000)
});

const RiskDispositionPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_RECEIPT_VERSION),
  status: RiskStatusSchema,
  decision: RiskDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  workflow: z.string().trim().min(1).max(1800),
  reviewerName: z.string().trim().min(1).max(180),
  generatedAt: z.string().trim().min(1).max(80),
  reviewerNote: z.string().trim().min(1).max(1800),
  ledgerStatus: RiskStatusSchema,
  clearanceScore: z.number().int().min(0).max(100),
  clearedCount: z.number().int().min(0).max(5),
  riskTotal: z.number().int().min(5).max(5),
  highRiskCount: z.number().int().min(0).max(5),
  sourceReceiptId: z.string().trim().min(1).max(220),
  sourceChecksum: z.string().trim().min(1).max(120),
  sourceLedgerHash: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  proof: z.string().trim().min(1).max(2600),
  risks: z.array(RiskItemSchema).min(5).max(5)
});

const RiskDispositionVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: RiskDispositionPayloadSchema
});

const RiskOwnerCloseoutTaskSchema = z.object({
  id: z.string().trim().min(1).max(180),
  label: z.string().trim().min(1).max(240),
  status: RiskStatusSchema,
  owner: z.string().trim().min(1).max(180),
  dueLabel: z.string().trim().min(1).max(120),
  action: z.string().trim().min(1).max(1800),
  closeCondition: z.string().trim().min(1).max(1800),
  evidence: z.string().trim().min(1).max(2600),
  href: z.string().max(30000),
  closed: z.boolean(),
  outcomeNote: z.string().trim().min(1).max(1800)
});

const RiskOwnerCloseoutPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_RECEIPT_VERSION),
  status: RiskStatusSchema,
  decision: RiskOwnerCloseoutDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  workflow: z.string().trim().min(1).max(1800),
  acceptedBy: z.string().trim().min(1).max(180),
  generatedAt: z.string().trim().min(1).max(80),
  evidenceNote: z.string().trim().min(1).max(1800),
  sourceReceiptId: z.string().trim().min(1).max(220),
  sourceChecksum: z.string().trim().min(1).max(120),
  sourceDispositionChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  sourceLedgerHash: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  sourceHandoffStatus: RiskStatusSchema,
  closedTaskCount: z.number().int().min(0).max(8),
  taskCount: z.number().int().min(1).max(8),
  openTaskCount: z.number().int().min(0).max(8),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  tasks: z.array(RiskOwnerCloseoutTaskSchema).min(1).max(8)
});

const RiskOwnerCloseoutVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: RiskOwnerCloseoutPayloadSchema
});

const RiskSendControlCriterionSchema = z.object({
  id: z.string().trim().min(1).max(180),
  label: z.string().trim().min(1).max(240),
  status: RiskSendControlCriterionStatusSchema,
  owner: z.string().trim().min(1).max(180),
  evidence: z.string().trim().min(1).max(2600),
  action: z.string().trim().min(1).max(1800),
  closeCondition: z.string().trim().min(1).max(1800),
  href: z.string().max(30000)
});

const RiskSendControlPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_RECEIPT_VERSION),
  status: RiskStatusSchema,
  decision: RiskSendControlDecisionSchema,
  buyer: z.string().trim().min(1).max(280),
  workflow: z.string().trim().min(1).max(1800),
  generatedAt: z.string().trim().min(1).max(80),
  sourceReceiptId: z.string().trim().min(1).max(220),
  sourceChecksum: z.string().trim().min(1).max(120),
  sourceDispositionChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  sourceRiskCloseoutChecksum: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  sourceLedgerHash: z.string().trim().regex(/^fnv1a32:[a-f0-9]{8}$/i),
  recheckStartDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  recheckEndDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  recheckReadyCount: z.number().int().min(0).max(8),
  recheckStepTotal: z.number().int().min(1).max(8),
  nextOwner: z.string().trim().min(1).max(180),
  nextAction: z.string().trim().min(1).max(1800),
  stopRule: z.string().trim().min(1).max(1800),
  criteria: z.array(RiskSendControlCriterionSchema).min(4).max(6)
});

const RiskSendControlVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: RiskSendControlPayloadSchema
});

export function verifyQuickBuyerEvidenceAdoptionRiskDispositionRequest(input: unknown) {
  const parsed = RiskDispositionVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickBuyerEvidenceAdoptionRiskDispositionPayload;
  const verification = verifyQuickBuyerEvidenceAdoptionRiskDispositionReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-buyer-evidence-adoption-risk-disposition.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        reviewerName: payload.reviewerName,
        ledgerStatus: payload.ledgerStatus,
        clearanceScore: payload.clearanceScore,
        clearedCount: payload.clearedCount,
        riskTotal: payload.riskTotal,
        highRiskCount: payload.highRiskCount,
        sourceReceiptId: payload.sourceReceiptId,
        sourceChecksum: payload.sourceChecksum,
        sourceLedgerHash: payload.sourceLedgerHash,
        nextOwner: payload.nextOwner,
        nextAction: payload.nextAction
      }
    }
  };
}

export function verifyQuickBuyerEvidenceAdoptionRiskSendControlRequest(input: unknown) {
  const parsed = RiskSendControlVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickBuyerEvidenceAdoptionRiskSendControlPayload;
  const verification = verifyQuickBuyerEvidenceAdoptionRiskSendControlReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-buyer-evidence-adoption-risk-send-control.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        sourceReceiptId: payload.sourceReceiptId,
        sourceDispositionChecksum: payload.sourceDispositionChecksum,
        sourceRiskCloseoutChecksum: payload.sourceRiskCloseoutChecksum,
        sourceLedgerHash: payload.sourceLedgerHash,
        recheckReadyCount: payload.recheckReadyCount,
        recheckStepTotal: payload.recheckStepTotal,
        nextOwner: payload.nextOwner,
        nextAction: payload.nextAction,
        stopRule: payload.stopRule
      }
    }
  };
}

export function verifyQuickBuyerEvidenceAdoptionRiskOwnerCloseoutRequest(input: unknown) {
  const parsed = RiskOwnerCloseoutVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickBuyerEvidenceAdoptionRiskOwnerCloseoutPayload;
  const verification = verifyQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-buyer-evidence-adoption-risk-owner-closeout.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        acceptedBy: payload.acceptedBy,
        sourceReceiptId: payload.sourceReceiptId,
        sourceDispositionChecksum: payload.sourceDispositionChecksum,
        sourceLedgerHash: payload.sourceLedgerHash,
        sourceHandoffStatus: payload.sourceHandoffStatus,
        closedTaskCount: payload.closedTaskCount,
        taskCount: payload.taskCount,
        openTaskCount: payload.openTaskCount,
        nextOwner: payload.nextOwner,
        nextAction: payload.nextAction
      }
    }
  };
}
