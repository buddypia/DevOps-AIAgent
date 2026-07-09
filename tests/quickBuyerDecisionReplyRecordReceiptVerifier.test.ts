import { describe, expect, test } from "vitest";
import {
  QUICK_BUYER_DECISION_REPLY_RECORD_VERIFY_PATH,
  verifyQuickBuyerDecisionReplyRecordRequest
} from "../server/quickBuyerDecisionReplyRecordReceiptVerifier";
import {
  QUICK_BUYER_DECISION_REPLY_RECORD_RECEIPT_VERSION,
  quickBuyerDecisionReplyRecordChecksum,
  type QuickBuyerDecisionReplyRecordPayload
} from "../src/quickBuyerDecisionReplyRecordReceipt";

function replyRecordPayload(): QuickBuyerDecisionReplyRecordPayload {
  return {
    receiptVersion: QUICK_BUYER_DECISION_REPLY_RECORD_RECEIPT_VERSION,
    status: "ready",
    decision: "continue",
    label: "Continue recorded",
    headline: "Platform sponsor approved the first buyer pilot",
    buyer: "Platform release lead",
    confidence: 94,
    buyerReply: "Approved. Continue with the bounded pilot after live proof verification.",
    matchedSignals: ["approved", "continue"],
    nextOwner: "Pilot operator",
    nextAction: "Open the launch room and start the day 0 kickoff.",
    proof: "Buyer reply explicitly approves the bounded pilot.",
    onePagerReceiptId: "quick-buyer-one-pager-ready-12345678",
    onePagerChecksum: "fnv1a32:12345678",
    activation: {
      mode: "pilot-start",
      status: "ready",
      label: "Pilot start work order",
      recommendedReply: "continue",
      sourceReceiptId: "quick-rollout-ready-abcdef12",
      sourceChecksum: "fnv1a32:abcdef12",
      primaryHref: "#quick-rollout-command-board",
      primaryLabel: "Owner brief",
      items: [
        {
          id: "kickoff",
          label: "Day 0 owner kickoff",
          status: "ready",
          owner: "Pilot operator",
          command: "Confirm owners, scope, stop rule, and live proof route.",
          evidence: "Launch room and buyer one-pager",
          href: "#quick-rollout-command-board"
        }
      ]
    }
  };
}

describe("quick buyer decision reply record receipt verifier", () => {
  test("verifies a generated buyer reply record request", () => {
    const payload = replyRecordPayload();
    const checksum = quickBuyerDecisionReplyRecordChecksum(payload);

    const result = verifyQuickBuyerDecisionReplyRecordRequest({ checksum, payload });

    expect(QUICK_BUYER_DECISION_REPLY_RECORD_VERIFY_PATH).toBe("/api/quick-buyer-decision-reply-record/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-buyer-decision-reply-record.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-buyer-decision-reply-record.v1",
          status: "ready",
          decision: "continue",
          buyer: "Platform release lead",
          activationMode: "pilot-start",
          activationItemCount: 1
        }
      }
    });
  });

  test("rejects a changed reply payload with a mismatch", () => {
    const payload = replyRecordPayload();
    const checksum = quickBuyerDecisionReplyRecordChecksum(payload);

    const result = verifyQuickBuyerDecisionReplyRecordRequest({
      checksum,
      payload: {
        ...payload,
        nextAction: "Start a larger rollout without the bounded pilot."
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

  test("keeps malformed external requests out of the verifier", () => {
    const result = verifyQuickBuyerDecisionReplyRecordRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-buyer-decision-reply-record.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
