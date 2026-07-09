import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import { QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH, verifyQuickValueReviewExecutionRequest } from "../server/quickValueReviewExecutionReceiptVerifier";
import {
  QUICK_VALUE_REVIEW_EXECUTION_RECEIPT_VERSION,
  quickValueReviewExecutionChecksum,
  type QuickValueReviewExecutionPayload
} from "../src/quickValueReviewExecutionReceipt";

function executionPayload(): QuickValueReviewExecutionPayload {
  return {
    receiptVersion: QUICK_VALUE_REVIEW_EXECUTION_RECEIPT_VERSION,
    status: "ready",
    decision: "expand-rollout",
    buyer: "Global Platform VP",
    sourceReviewDecision: "review-expand",
    sourceAcceptanceReceiptId: "quick-value-acceptance-ready-12345678",
    sourceAcceptanceChecksum: "fnv1a32:12345678",
    sourceCloseoutReceiptId: "quick-value-closeout-ready-87654321",
    sourceCloseoutChecksum: "fnv1a32:87654321",
    retainedValueYen: 480000,
    retainedValueTargetYen: 404000,
    reviewQuestion: "Should Global Platform VP approve expansion with ¥480,000/month retained value?",
    buyerAsk: "Approve expansion only after verifying the acceptance receipt and confirming the retained-value owner remains accountable.",
    readyTaskCount: 5,
    taskCount: 5,
    blockedTaskCount: 0,
    nextOwner: "Execution owner",
    nextAction: "Record expansion approval, attach the value dossier, and open the rollout command board.",
    guardrails: [
      "Do not change the buyer-facing value claim without re-exporting the acceptance receipt.",
      "Do not start expansion, revision, or stop work unless the execution receipt verifies.",
      "Keep the Day 30 decision, closeout receipt, and next value recheck attached to the same buyer record."
    ],
    tasks: [
      {
        id: "verify-acceptance-receipt",
        label: "Verify accepted value proof",
        status: "ready",
        owner: "Buyer reviewer",
        dueWindow: "Before the decision is recorded",
        command: "Verify quick-value-acceptance-ready-12345678 and attach the verifier result to the decision record.",
        evidence: "quick-value-acceptance-ready-12345678 / fnv1a32:12345678",
        acceptance: "Receipt verifier returns HTTP 200 and the receipt id appears in the decision record."
      },
      {
        id: "record-review-decision",
        label: "Record review decision",
        status: "ready",
        owner: "Procurement owner",
        dueWindow: "Decision meeting",
        command: "Record expansion approval, attach the value dossier, and open the rollout command board.",
        evidence: "expand decision recorded.",
        acceptance: "Decision record names expand, revise, or stop and includes the source acceptance receipt."
      },
      {
        id: "assign-operating-owner",
        label: "Assign operating owner",
        status: "ready",
        owner: "Platform sponsor",
        dueWindow: "Within 1 business day",
        command: "Assign the named owner for the next operating window and keep the closeout receipt attached.",
        evidence: "Evidence gaps 0; source repairs 0; acknowledgements 0/0.",
        acceptance: "Owner accepts the next operating window, proof source, and escalation rule."
      },
      {
        id: "schedule-value-recheck",
        label: "Schedule value recheck",
        status: "ready",
        owner: "Finance owner",
        dueWindow: "Within 30 days of the decision",
        command: "Schedule the next retained-value recheck before the expansion renewal ask.",
        evidence: "¥480,000/month against ¥404,000/month target.",
        acceptance: "Calendar entry names retained value, target, owner, and receipt source."
      },
      {
        id: "publish-executive-brief",
        label: "Publish executive brief",
        status: "ready",
        owner: "Sponsor owner",
        dueWindow: "Same day as the decision",
        command: "Publish a short executive brief with the buyer ask, decision rule, value claim, and verifier link.",
        evidence: "Approve expansion only after verifying the acceptance receipt.",
        acceptance: "Brief contains the buyer ask, verifier link, decision rule, and next owner."
      }
    ]
  };
}

describe("quick value review execution receipt verifier", () => {
  test("verifies post-review execution packets", () => {
    const payload = executionPayload();
    const checksum = quickValueReviewExecutionChecksum(payload);

    const result = verifyQuickValueReviewExecutionRequest({ checksum, payload });

    expect(QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH).toBe("/api/quick-value-review-execution/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-value-review-execution.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-value-review-execution.v1",
          status: "ready",
          decision: "expand-rollout",
          buyer: "Global Platform VP",
          sourceReviewDecision: "review-expand",
          sourceAcceptanceReceiptId: "quick-value-acceptance-ready-12345678",
          sourceCloseoutReceiptId: "quick-value-closeout-ready-87654321",
          readyTaskCount: 5,
          taskCount: 5,
          blockedTaskCount: 0,
          nextOwner: "Execution owner",
          guardrailCount: 3
        }
      }
    });
  });

  test("rejects changed execution packets with a mismatch", () => {
    const payload = executionPayload();
    const checksum = quickValueReviewExecutionChecksum(payload);

    const result = verifyQuickValueReviewExecutionRequest({
      checksum,
      payload: {
        ...payload,
        readyTaskCount: 4
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

  test("keeps malformed execution requests out of the verifier", () => {
    const result = verifyQuickValueReviewExecutionRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-value-review-execution.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches execution packets through the receipt verification desk", () => {
    const payload = executionPayload();
    const checksum = quickValueReviewExecutionChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-value-review-execution.v1",
        receiptLabel: "Value review execution packet",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-value-review-execution/verify",
        nativeSkill: "quick-value-review-execution.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });
});
