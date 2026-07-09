import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH,
  verifyQuickWorkflowPilotDecisionBriefRequest
} from "../server/quickWorkflowPilotDecisionBriefReceiptVerifier";
import {
  QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION,
  quickWorkflowPilotDecisionBriefChecksum,
  type QuickWorkflowPilotDecisionBriefReceiptPayload
} from "../src/quickWorkflowPilotDecisionBriefReceipt";

function decisionBriefPayload(): QuickWorkflowPilotDecisionBriefReceiptPayload {
  return {
    receiptVersion: QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION,
    source: "quick-workflow-pilot-decision-brief",
    status: "ready",
    decision: "expand-with-guardrails",
    buyer: "Platform release lead",
    workflow: "weekly release review",
    decisionAsk:
      "Approve the next operating window only after the run receipt verifies and Platform release lead keeps the value floor owner named.",
    valueLine: "¥616,000/month accepted floor is 1.5x the ¥420,000 pilot price.",
    riskLine: "Expansion stays gated by the ¥240,000/month stop rule and verified run receipt.",
    runReceiptId: "quick-pilot-run-log-ready-12345678",
    runChecksum: "fnv1a32:12345678",
    contractReceiptId: "quick-value-contract-ready-87654321",
    contractChecksum: "fnv1a32:87654321",
    nextOwner: "Procurement owner",
    nextAction: "Send the decision brief and attach both verifier results.",
    actions: [
      {
        id: "verify-run-receipt",
        status: "ready",
        owner: "Buyer reviewer",
        action: "Open quick-pilot-run-log-ready-12345678 and attach the verifier result to the decision record.",
        acceptance: "Receipt verifier returns HTTP 200 and names this buyer, workflow, evidence score, and missing proof count."
      },
      {
        id: "record-decision",
        status: "ready",
        owner: "Procurement owner",
        action: "Record expand with the run receipt, contract receipt, stop rule, and next value owner.",
        acceptance: "Decision record says expand and includes both source receipts."
      },
      {
        id: "schedule-value-recheck",
        status: "ready",
        owner: "Finance owner",
        action: "Schedule a 30-day value recheck against ¥616,000/month and the ¥240,000/month stop rule.",
        acceptance: "Calendar entry names the value floor, stop rule, owner, and receipt source."
      },
      {
        id: "hold-expansion",
        status: "ready",
        owner: "Pilot sponsor",
        action: "Keep expansion gated by verified value; do not remove the stop rule from the next agreement.",
        acceptance: "No expansion work starts unless the decision brief and verifier results are attached."
      }
    ]
  };
}

describe("quick workflow pilot decision brief receipt verifier", () => {
  test("verifies expansion decision briefs for buyer approval", () => {
    const payload = decisionBriefPayload();
    const checksum = quickWorkflowPilotDecisionBriefChecksum(payload);

    const result = verifyQuickWorkflowPilotDecisionBriefRequest({ checksum, payload });

    expect(QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH).toBe("/api/quick-workflow-pilot-decision-brief/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-workflow-pilot-decision-brief.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-workflow-pilot-decision-brief.v1",
          status: "ready",
          decision: "expand-with-guardrails",
          buyer: "Platform release lead",
          runReceiptId: "quick-pilot-run-log-ready-12345678",
          contractReceiptId: "quick-value-contract-ready-87654321",
          actionCount: 4,
          readyActionCount: 4,
          watchActionCount: 0,
          blockedActionCount: 0,
          firstOpenAction: "none",
          nextOwner: "Procurement owner"
        }
      }
    });
  });

  test("rejects changed decision briefs with a mismatch", () => {
    const payload = decisionBriefPayload();
    const checksum = quickWorkflowPilotDecisionBriefChecksum(payload);

    const result = verifyQuickWorkflowPilotDecisionBriefRequest({
      checksum,
      payload: {
        ...payload,
        decision: "revise-evidence",
        nextOwner: "Buyer reviewer"
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

  test("keeps malformed decision brief requests out of the verifier", () => {
    const result = verifyQuickWorkflowPilotDecisionBriefRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-workflow-pilot-decision-brief.v1",
        source: "quick-workflow-pilot-decision-brief"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches decision briefs through the receipt verification desk", () => {
    const payload = decisionBriefPayload();
    const checksum = quickWorkflowPilotDecisionBriefChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-workflow-pilot-decision-brief.v1",
        receiptLabel: "Quick workflow pilot decision brief",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-workflow-pilot-decision-brief/verify",
        nativeSkill: "quick-workflow-pilot-decision-brief.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });
});
