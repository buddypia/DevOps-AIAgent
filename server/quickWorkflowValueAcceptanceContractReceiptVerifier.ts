import { z } from "zod";
import {
  QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION,
  QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH,
  verifyQuickWorkflowValueAcceptanceContractReceipt,
  type QuickWorkflowValueAcceptanceContractReceiptPayload
} from "../src/quickWorkflowValueAcceptanceContractReceipt.js";

export { QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH };

const ContractStatusSchema = z.enum(["ready", "watch", "blocked"]);
const ContractDecisionSchema = z.enum(["Issue value acceptance contract", "Draft contract internally", "Do not contract yet"]);
const ContractGateIdSchema = z.enum(["value-floor", "proof-receipt", "data-boundary", "buyer-commitment", "commercial-cap", "stop-rule"]);

const ContractGateSchema = z.object({
  id: ContractGateIdSchema,
  status: ContractStatusSchema,
  owner: z.string().trim().min(1).max(180),
  requirement: z.string().trim().min(1).max(1800)
});

const ContractPayloadSchema = z.object({
  receiptVersion: z.literal(QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION),
  source: z.literal("quick-workflow-intake"),
  buyer: z.string().trim().min(1).max(280),
  workflow: z.string().trim().min(1).max(1600),
  status: ContractStatusSchema,
  decision: ContractDecisionSchema,
  pilotWindow: z.literal("14-day proof pilot"),
  suggestedPilotPriceYen: z.number().int().min(0).max(1_000_000_000),
  valueFloorYen: z.number().int().min(0).max(1_000_000_000),
  stopLossYen: z.number().int().min(0).max(1_000_000_000),
  readinessScore: z.number().min(0).max(100),
  commercialStatus: ContractStatusSchema,
  acceptanceLine: z.string().trim().min(1).max(1800),
  creditLine: z.string().trim().min(1).max(1800),
  nextAction: z.string().trim().min(1).max(1800),
  gateStatuses: z.array(ContractGateSchema).min(6).max(6)
});

const ContractVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payload: ContractPayloadSchema
});

export function verifyQuickWorkflowValueAcceptanceContractRequest(input: unknown) {
  const parsed = ContractVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as QuickWorkflowValueAcceptanceContractReceiptPayload;
  const verification = verifyQuickWorkflowValueAcceptanceContractReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });
  const blockedCount = payload.gateStatuses.filter((gate) => gate.status === "blocked").length;
  const watchCount = payload.gateStatuses.filter((gate) => gate.status === "watch").length;

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-workflow-value-acceptance-contract.receipt.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        status: payload.status,
        decision: payload.decision,
        buyer: payload.buyer,
        workflow: payload.workflow,
        pilotWindow: payload.pilotWindow,
        suggestedPilotPriceYen: payload.suggestedPilotPriceYen,
        valueFloorYen: payload.valueFloorYen,
        stopLossYen: payload.stopLossYen,
        commercialStatus: payload.commercialStatus,
        gateCount: payload.gateStatuses.length,
        blockedCount,
        watchCount,
        firstOpenGate: payload.gateStatuses.find((gate) => gate.status !== "ready")?.id ?? "none",
        nextAction: payload.nextAction
      }
    }
  };
}
