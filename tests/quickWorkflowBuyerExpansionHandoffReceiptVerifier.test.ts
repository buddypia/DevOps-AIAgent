import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH,
  verifyQuickWorkflowBuyerExpansionHandoffRequest
} from "../server/quickWorkflowBuyerExpansionHandoffReceiptVerifier";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION,
  quickWorkflowBuyerExpansionHandoffChecksum,
  type QuickWorkflowBuyerExpansionHandoffReceiptPayload
} from "../src/quickWorkflowBuyerExpansionHandoffReceipt";

function handoffPayload(): QuickWorkflowBuyerExpansionHandoffReceiptPayload {
  return {
    receiptVersion: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION,
    source: "quick-workflow-buyer-expansion-handoff",
    status: "ready",
    buyer: "Platform release lead",
    workflow: "weekly release review",
    decisionAsk: "Approve the next operating window with the expansion receipt attached.",
    approvalLine: "Approve only with Expansion quick-pilot-expansion-guardrail-ready-12345678 links decision, run, and contract receipts.",
    riskLine: "Do not expand beyond the named window unless the next retained-value recheck still clears the floor.",
    receiptLine: "Expansion quick-pilot-expansion-guardrail-ready-12345678 links decision, run, and contract receipts.",
    packetReadyCount: 6,
    packetTotalCount: 6,
    nextOwner: "Procurement owner",
    nextAction: "Record procurement signoff, then schedule the next value recheck.",
    tasks: [
      {
        id: "attach-one-pager",
        status: "ready",
        owner: "Pilot sponsor",
        action: "Attach the HTML one-pager and markdown packet to the procurement room.",
        acceptance: "Procurement can read the decision ask, value floor, receipt chain, and all packet stages without asking for context.",
        proof: "6/6 packet stages; Buyer expansion packet is ready"
      },
      {
        id: "verify-receipt-chain",
        status: "ready",
        owner: "Proof owner",
        action: "Open every verifier link, preserve the result, and attach kickoff receipt ID as supporting proof.",
        acceptance: "Contract, run, decision, and expansion verifier links are attached; kickoff receipt ID is present.",
        proof: "quick-value-contract-ready-12345678 / verifier attached; quick-kickoff-pack-ready-20260701-23456789"
      },
      {
        id: "procurement-signoff",
        status: "ready",
        owner: "Procurement owner",
        action: "Approve the next operating window with the expansion receipt attached.",
        acceptance: "Approval names the next operating window, stop rule, value floor, and expansion receipt.",
        proof: "quick-pilot-expansion-guardrail-ready-12345678 / verifier attached"
      },
      {
        id: "value-recheck-window",
        status: "ready",
        owner: "Finance owner",
        action: "Schedule the next retained-value recheck before renewal or wider rollout.",
        acceptance: "Calendar entry names the owner, target value, receipt to reopen, and stop condition.",
        proof: "¥720,000/month clears the ¥616,000/month accepted floor."
      }
    ]
  };
}

describe("quick workflow buyer expansion handoff receipt verifier", () => {
  test("verifies procurement handoff receipts for buyer approval", () => {
    const payload = handoffPayload();
    const checksum = quickWorkflowBuyerExpansionHandoffChecksum(payload);

    const result = verifyQuickWorkflowBuyerExpansionHandoffRequest({ checksum, payload });

    expect(QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH).toBe("/api/quick-workflow-buyer-expansion-handoff/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-workflow-buyer-expansion-handoff.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-workflow-buyer-expansion-handoff.v1",
          status: "ready",
          buyer: "Platform release lead",
          packetReadyCount: 6,
          packetTotalCount: 6,
          taskCount: 4,
          readyTaskCount: 4,
          firstOpenTask: "none",
          nextOwner: "Procurement owner"
        }
      }
    });
  });

  test("rejects changed procurement handoffs with a mismatch", () => {
    const payload = handoffPayload();
    const checksum = quickWorkflowBuyerExpansionHandoffChecksum(payload);

    const result = verifyQuickWorkflowBuyerExpansionHandoffRequest({
      checksum,
      payload: {
        ...payload,
        riskLine: "Expansion approved without the retained-value recheck."
      }
    });

    expect(result).toMatchObject({
      statusCode: 422,
      body: {
        verification: {
          status: "mismatch",
          expectedChecksum: checksum
        }
      }
    });
  });

  test("rejects malformed handoff requests", () => {
    const result = verifyQuickWorkflowBuyerExpansionHandoffRequest({
      checksum: "not-a-checksum",
      payload: {
        receiptVersion: "quick-workflow-buyer-expansion-handoff.v1",
        source: "quick-workflow-buyer-expansion-handoff"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches procurement handoffs through the receipt verification desk", () => {
    const payload = handoffPayload();
    const checksum = quickWorkflowBuyerExpansionHandoffChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-workflow-buyer-expansion-handoff.v1",
        receiptLabel: "Quick workflow buyer expansion handoff",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-workflow-buyer-expansion-handoff/verify",
        nativeSkill: "quick-workflow-buyer-expansion-handoff.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });
});
