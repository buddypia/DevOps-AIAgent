import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH,
  verifyQuickWorkflowValueAcceptanceContractRequest
} from "../server/quickWorkflowValueAcceptanceContractReceiptVerifier";
import {
  QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION,
  quickWorkflowValueAcceptanceContractChecksum,
  type QuickWorkflowValueAcceptanceContractReceiptPayload
} from "../src/quickWorkflowValueAcceptanceContractReceipt";

function samplePayload(): QuickWorkflowValueAcceptanceContractReceiptPayload {
  return {
    receiptVersion: QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION,
    source: "quick-workflow-intake",
    buyer: "Platform release lead",
    workflow: "weekly release review",
    status: "ready",
    decision: "Issue value acceptance contract",
    pilotWindow: "14-day proof pilot",
    suggestedPilotPriceYen: 720000,
    valueFloorYen: 2800000,
    stopLossYen: 1800000,
    readinessScore: 100,
    commercialStatus: "ready",
    acceptanceLine: "Platform release lead accepts the 14-day proof pilot only when 6 hours saved and at least ¥2,800,000/month accepted value are recorded.",
    creditLine: "If Day 30 realized value is below ¥1,800,000/month, the next sprint becomes repair work and expansion stays blocked.",
    nextAction: "Attach the value contract to the buyer decision packet.",
    gateStatuses: [
      {
        id: "value-floor",
        status: "ready",
        owner: "Pilot sponsor",
        requirement: "¥2,800,000/month accepted value by Day 30"
      },
      {
        id: "proof-receipt",
        status: "ready",
        owner: "Proof owner",
        requirement: "All five public proof URLs pass live verification before buyer send"
      },
      {
        id: "data-boundary",
        status: "ready",
        owner: "Security reviewer",
        requirement: "Only public-safe or explicitly approved evidence enters the buyer room"
      },
      {
        id: "buyer-commitment",
        status: "ready",
        owner: "Buyer owner",
        requirement: "Buyer names a continue, revise, or stop decision path before kickoff"
      },
      {
        id: "commercial-cap",
        status: "ready",
        owner: "Pilot owner",
        requirement: "¥720,000 price under ¥3,000,000 cap"
      },
      {
        id: "stop-rule",
        status: "ready",
        owner: "Finance owner",
        requirement: "Stop expansion if realized value falls below ¥1,800,000/month"
      }
    ]
  };
}

describe("quick workflow value acceptance contract receipt verifier", () => {
  test("verifies exported value acceptance contracts", () => {
    const payload = samplePayload();
    const checksum = quickWorkflowValueAcceptanceContractChecksum(payload);

    const result = verifyQuickWorkflowValueAcceptanceContractRequest({ checksum, payload });

    expect(QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH).toBe("/api/quick-workflow-value-acceptance-contract/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-workflow-value-acceptance-contract.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-workflow-value-acceptance-contract.v1",
          source: "quick-workflow-intake",
          status: "ready",
          decision: "Issue value acceptance contract",
          buyer: "Platform release lead",
          gateCount: 6,
          blockedCount: 0,
          watchCount: 0,
          firstOpenGate: "none"
        }
      }
    });
  });

  test("rejects changed contract terms with a checksum mismatch", () => {
    const payload = samplePayload();
    const checksum = quickWorkflowValueAcceptanceContractChecksum(payload);

    const result = verifyQuickWorkflowValueAcceptanceContractRequest({
      checksum,
      payload: {
        ...payload,
        valueFloorYen: 120000
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

  test("keeps malformed contract requests out of the verifier", () => {
    const result = verifyQuickWorkflowValueAcceptanceContractRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches contract requests through the receipt verification desk", () => {
    const payload = samplePayload();
    const checksum = quickWorkflowValueAcceptanceContractChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-workflow-value-acceptance-contract.v1",
        receiptLabel: "Quick workflow value acceptance contract",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-workflow-value-acceptance-contract/verify",
        nativeSkill: "quick-workflow-value-acceptance-contract.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });
});
