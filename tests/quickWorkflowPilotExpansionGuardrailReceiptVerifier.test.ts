import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH,
  verifyQuickWorkflowPilotExpansionGuardrailRequest
} from "../server/quickWorkflowPilotExpansionGuardrailReceiptVerifier";
import {
  QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION,
  quickWorkflowPilotExpansionGuardrailChecksum,
  type QuickWorkflowPilotExpansionGuardrailReceiptPayload
} from "../src/quickWorkflowPilotExpansionGuardrailReceipt";

function expansionGuardrailPayload(): QuickWorkflowPilotExpansionGuardrailReceiptPayload {
  return {
    receiptVersion: QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION,
    source: "quick-workflow-pilot-expansion-guardrail",
    status: "ready",
    decision: "expand-next-window",
    buyer: "Platform release lead",
    workflow: "weekly release review",
    measuredMonthlyValueYen: 720000,
    valueFloorYen: 616000,
    stopLossYen: 396000,
    decisionBriefReceiptId: "quick-pilot-decision-brief-ready-12345678",
    decisionBriefChecksum: "fnv1a32:12345678",
    runReceiptId: "quick-pilot-run-log-ready-23456789",
    runChecksum: "fnv1a32:23456789",
    contractReceiptId: "quick-value-contract-ready-3456789a",
    contractChecksum: "fnv1a32:3456789a",
    nextOwner: "Procurement owner",
    nextAction: "Approve the next operating window with the receipt chain and value recheck attached.",
    evidenceExcerpt:
      "30-day value recheck recorded actual value ¥720,000/month. Finance owner approved expansion, procurement recorded acceptance, decision receipt and verifier results attached, next operating window scoped.",
    checks: [
      {
        id: "decision-brief-verified",
        status: "ready",
        owner: "Buyer reviewer",
        evidence: "quick-pilot-decision-brief-ready-12345678 / fnv1a32:12345678",
        action: "Attach the verified decision brief to the expansion record."
      },
      {
        id: "value-floor-met",
        status: "ready",
        owner: "Finance owner",
        evidence: "¥720,000/month measured against ¥616,000/month floor.",
        action: "Record this as the accepted expansion value."
      },
      {
        id: "stop-rule-safe",
        status: "ready",
        owner: "Finance owner",
        evidence: "¥720,000/month measured against ¥396,000/month stop rule.",
        action: "Keep the stop rule attached to the next agreement."
      },
      {
        id: "owner-acceptance-recorded",
        status: "ready",
        owner: "Procurement owner",
        evidence: "Owner approval or acceptance is present in the recheck evidence.",
        action: "Attach the owner decision to the expansion record."
      },
      {
        id: "receipt-chain-attached",
        status: "ready",
        owner: "Proof owner",
        evidence: "Decision or verifier receipt reference is present.",
        action: "Keep the receipt chain with the expansion approval."
      },
      {
        id: "next-window-scoped",
        status: "ready",
        owner: "Pilot sponsor",
        evidence: "The next operating window or 30-day recheck is named.",
        action: "Schedule the next value recheck before renewal."
      }
    ]
  };
}

describe("quick workflow pilot expansion guardrail receipt verifier", () => {
  test("verifies expansion guardrail ledgers for buyer approval", () => {
    const payload = expansionGuardrailPayload();
    const checksum = quickWorkflowPilotExpansionGuardrailChecksum(payload);

    const result = verifyQuickWorkflowPilotExpansionGuardrailRequest({ checksum, payload });

    expect(QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH).toBe("/api/quick-workflow-pilot-expansion-guardrail/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-workflow-pilot-expansion-guardrail.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-workflow-pilot-expansion-guardrail.v1",
          status: "ready",
          decision: "expand-next-window",
          buyer: "Platform release lead",
          measuredMonthlyValueYen: 720000,
          valueFloorYen: 616000,
          stopLossYen: 396000,
          decisionBriefReceiptId: "quick-pilot-decision-brief-ready-12345678",
          checkCount: 6,
          readyCheckCount: 6,
          watchCheckCount: 0,
          blockedCheckCount: 0,
          firstOpenCheck: "none",
          nextOwner: "Procurement owner"
        }
      }
    });
  });

  test("rejects changed expansion guardrails with a mismatch", () => {
    const payload = expansionGuardrailPayload();
    const checksum = quickWorkflowPilotExpansionGuardrailChecksum(payload);

    const result = verifyQuickWorkflowPilotExpansionGuardrailRequest({
      checksum,
      payload: {
        ...payload,
        measuredMonthlyValueYen: 300000,
        decision: "stop-expansion"
      }
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      verification: {
        status: "mismatch",
        expectedChecksum: checksum
      }
    });
  });

  test("keeps malformed expansion guardrail requests out of the verifier", () => {
    const result = verifyQuickWorkflowPilotExpansionGuardrailRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-workflow-pilot-expansion-guardrail.v1",
        source: "quick-workflow-pilot-expansion-guardrail"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches expansion guardrails through the receipt verification desk", () => {
    const payload = expansionGuardrailPayload();
    const checksum = quickWorkflowPilotExpansionGuardrailChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-workflow-pilot-expansion-guardrail.v1",
        receiptLabel: "Quick workflow pilot expansion guardrail",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-workflow-pilot-expansion-guardrail/verify",
        nativeSkill: "quick-workflow-pilot-expansion-guardrail.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });
});
