import { describe, expect, test } from "vitest";
import {
  QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERIFY_PATH,
  verifyQuickExternalReviewDecisionReceiptRequest
} from "../server/quickExternalReviewDecisionReceiptVerifier";
import {
  QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION,
  quickExternalReviewDecisionReceiptChecksum,
  type QuickExternalReviewDecisionReceiptPayload
} from "../src/quickExternalReviewDecisionReceipt";

function decisionPayload(): QuickExternalReviewDecisionReceiptPayload {
  return {
    receiptVersion: QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION,
    decision: "revise",
    status: "watch",
    label: "External review revision",
    reviewerName: "External reviewer",
    reviewerNote: "Hold until live proof is refreshed.",
    buyer: "Platform release lead",
    generatedAt: "2026-06-25T00:00:00.000Z",
    manifestReceiptId: "quick-external-review-blocked-12345678",
    manifestChecksum: "fnv1a32:12345678",
    packetStatus: "blocked",
    packetClearance: "internal-only",
    testsReady: 1,
    testsTotal: 6,
    confidence: 52,
    reviewOutcome: "Do not send this packet",
    nextAction: "Proof freshness: Live proof is inside the current external review window.",
    proof: "Packet verifier verified; manifest quick-external-review-blocked-12345678; 1/6 acceptance tests ready."
  };
}

describe("quick external review decision receipt verifier", () => {
  test("verifies a generated reviewer decision receipt", () => {
    const payload = decisionPayload();
    const checksum = quickExternalReviewDecisionReceiptChecksum(payload);

    const result = verifyQuickExternalReviewDecisionReceiptRequest({ checksum, payload });

    expect(QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERIFY_PATH).toBe("/api/quick-external-review-decision/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-external-review-decision.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-external-review-decision.v1",
          decision: "revise",
          status: "watch",
          reviewerName: "External reviewer",
          buyer: "Platform release lead",
          manifestReceiptId: "quick-external-review-blocked-12345678",
          testsReady: 1,
          testsTotal: 6
        }
      }
    });
  });

  test("accepts buyer evidence decisions sourced from a quick conversion receipt", () => {
    const payload: QuickExternalReviewDecisionReceiptPayload = {
      ...decisionPayload(),
      decision: "continue",
      status: "ready",
      label: "Accept evidence",
      manifestReceiptId: "quick-conversion-ready-12345678",
      manifestChecksum: "fnv1a32:12345678",
      packetStatus: "ready",
      packetClearance: "external-review",
      testsReady: 6,
      testsTotal: 6,
      confidence: 100,
      nextAction: "Schedule the buyer decision meeting and attach the verified conversion receipt."
    };
    const checksum = quickExternalReviewDecisionReceiptChecksum(payload);

    const result = verifyQuickExternalReviewDecisionReceiptRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        receipt: {
          manifestReceiptId: "quick-conversion-ready-12345678",
          packetStatus: "ready",
          packetClearance: "external-review",
          testsReady: 6,
          testsTotal: 6
        }
      }
    });
  });

  test("returns mismatch when the reviewer response changes", () => {
    const payload = decisionPayload();
    const checksum = quickExternalReviewDecisionReceiptChecksum(payload);

    const result = verifyQuickExternalReviewDecisionReceiptRequest({
      checksum,
      payload: {
        ...payload,
        decision: "continue"
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

  test("rejects malformed reviewer decision receipts", () => {
    const result = verifyQuickExternalReviewDecisionReceiptRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-external-review-decision.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
