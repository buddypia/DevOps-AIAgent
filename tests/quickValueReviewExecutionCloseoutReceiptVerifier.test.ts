import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH,
  verifyQuickValueReviewExecutionCloseoutRequest
} from "../server/quickValueReviewExecutionCloseoutReceiptVerifier";
import {
  QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_RECEIPT_VERSION,
  quickValueReviewExecutionCloseoutChecksum,
  type QuickValueReviewExecutionCloseoutPayload
} from "../src/quickValueReviewExecutionCloseoutReceipt";

function closeoutPayload(): QuickValueReviewExecutionCloseoutPayload {
  return {
    receiptVersion: QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_RECEIPT_VERSION,
    status: "ready",
    decision: "accept-execution-closeout",
    buyer: "Global Platform VP",
    executionDecision: "expand-rollout",
    sourceExecutionReceiptId: "quick-value-review-execution-ready-12345678",
    sourceExecutionChecksum: "fnv1a32:12345678",
    sourceAcceptanceReceiptId: "quick-value-acceptance-ready-87654321",
    sourceCloseoutReceiptId: "quick-value-closeout-ready-abcdef12",
    readyTaskCount: 5,
    taskCount: 5,
    blockedTaskCount: 0,
    nextOwner: "Ready",
    nextAction: "Attach this execution closeout receipt to the buyer record and start the next retained-value recheck window.",
    evidenceSummary: "Acceptance receipt verified. Decision recorded. Owner accepted. Recheck scheduled. Executive brief published.",
    tasks: [
      {
        id: "verify-acceptance-receipt",
        label: "Verify accepted value proof",
        status: "ready",
        owner: "Buyer reviewer",
        dueWindow: "Before the decision is recorded",
        command: "Verify the accepted receipt.",
        matchedSignals: ["acceptance receipt verified", "verifier result attached"],
        missingSignals: [],
        evidence: "Acceptance receipt verified HTTP 200.",
        acceptance: "Receipt verifier returns HTTP 200 and the receipt id appears in the decision record."
      },
      {
        id: "record-review-decision",
        label: "Record review decision",
        status: "ready",
        owner: "Procurement owner",
        dueWindow: "Decision meeting",
        command: "Record expansion approval.",
        matchedSignals: ["decision recorded", "execution decision named", "source acceptance attached"],
        missingSignals: [],
        evidence: "Decision recorded for expand rollout.",
        acceptance: "Decision record names expand, revise, or stop and includes the source acceptance receipt."
      },
      {
        id: "assign-operating-owner",
        label: "Assign operating owner",
        status: "ready",
        owner: "Platform sponsor",
        dueWindow: "Within 1 business day",
        command: "Assign operating owner.",
        matchedSignals: ["operating owner accepted", "operating window named"],
        missingSignals: [],
        evidence: "Operating owner accepted the next operating window.",
        acceptance: "Owner accepts the next operating window, proof source, and escalation rule."
      },
      {
        id: "schedule-value-recheck",
        label: "Schedule value recheck",
        status: "ready",
        owner: "Finance owner",
        dueWindow: "Within 30 days of the decision",
        command: "Schedule retained value recheck.",
        matchedSignals: ["value recheck scheduled", "retained value target named"],
        missingSignals: [],
        evidence: "Finance scheduled retained value recheck.",
        acceptance: "Calendar entry names retained value, target, owner, and receipt source."
      },
      {
        id: "publish-executive-brief",
        label: "Publish executive brief",
        status: "ready",
        owner: "Sponsor owner",
        dueWindow: "Same day as the decision",
        command: "Publish executive brief.",
        matchedSignals: ["executive brief published", "buyer ask and verifier included"],
        missingSignals: [],
        evidence: "Executive brief published with buyer ask and verifier link.",
        acceptance: "Brief contains the buyer ask, verifier link, decision rule, and next owner."
      }
    ]
  };
}

describe("quick value review execution closeout receipt verifier", () => {
  test("verifies execution closeout packets", () => {
    const payload = closeoutPayload();
    const checksum = quickValueReviewExecutionCloseoutChecksum(payload);

    const result = verifyQuickValueReviewExecutionCloseoutRequest({ checksum, payload });

    expect(QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH).toBe("/api/quick-value-review-execution-closeout/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-value-review-execution-closeout.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-value-review-execution-closeout.v1",
          status: "ready",
          decision: "accept-execution-closeout",
          buyer: "Global Platform VP",
          executionDecision: "expand-rollout",
          sourceExecutionReceiptId: "quick-value-review-execution-ready-12345678",
          sourceAcceptanceReceiptId: "quick-value-acceptance-ready-87654321",
          readyTaskCount: 5,
          taskCount: 5,
          blockedTaskCount: 0,
          nextOwner: "Ready"
        }
      }
    });
  });

  test("rejects changed closeout packets with a mismatch", () => {
    const payload = closeoutPayload();
    const checksum = quickValueReviewExecutionCloseoutChecksum(payload);

    const result = verifyQuickValueReviewExecutionCloseoutRequest({
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

  test("keeps malformed closeout requests out of the verifier", () => {
    const result = verifyQuickValueReviewExecutionCloseoutRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-value-review-execution-closeout.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches execution closeout packets through the receipt verification desk", () => {
    const payload = closeoutPayload();
    const checksum = quickValueReviewExecutionCloseoutChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-value-review-execution-closeout.v1",
        receiptLabel: "Value review execution closeout",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-value-review-execution-closeout/verify",
        nativeSkill: "quick-value-review-execution-closeout.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });
});
