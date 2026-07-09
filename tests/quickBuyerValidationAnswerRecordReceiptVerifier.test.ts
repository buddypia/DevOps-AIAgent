import { describe, expect, test } from "vitest";
import {
  QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH,
  verifyQuickBuyerValidationAnswerRecordRequest
} from "../server/quickBuyerValidationAnswerRecordReceiptVerifier";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_BUYER_VALIDATION_ANSWER_RECORD_RECEIPT_VERSION,
  quickBuyerValidationAnswerRecordChecksum,
  type QuickBuyerValidationAnswerRecordPayload
} from "../src/quickBuyerValidationAnswerRecordReceipt";

function validationAnswerPayload(): QuickBuyerValidationAnswerRecordPayload {
  return {
    receiptVersion: QUICK_BUYER_VALIDATION_ANSWER_RECORD_RECEIPT_VERSION,
    status: "ready",
    buyer: "Platform release lead",
    primaryAsk: "Approve a bounded pilot after buyer validation.",
    answeredCount: 5,
    totalCount: 5,
    confidence: 94,
    recommendedBuyerDecision: "continue",
    decisionReason: "All five answers matched required signals and proof is ready.",
    decisionAction: "Record continue and schedule the pilot review with the verifier.",
    nextOwner: "Ready",
    nextAction: "Record continue, revise, or stop with the decision recorder.",
    sourceReceiptId: "quick-workflow-conversion-ready-12345678",
    sourceChecksum: "fnv1a32:12345678",
    buyerAnswer:
      "Baseline owner confirmed pain, weekly frequency, accepted value metric, opened proof link, verified receipt checksum, and approved a bounded pilot with stop rule.",
    items: [
      {
        id: "pain",
        label: "Pain is owned",
        status: "ready",
        sourceStatus: "ready",
        owner: "Problem owner",
        matchedSignals: ["baseline owner stated", "pain stated"],
        missingSignals: [],
        action: "Use this answer as buyer validation evidence.",
        href: "#quick-buyer-room"
      },
      {
        id: "frequency",
        label: "Frequency is real",
        status: "ready",
        sourceStatus: "ready",
        owner: "Workflow owner",
        matchedSignals: ["frequency stated"],
        missingSignals: [],
        action: "Use this answer as buyer validation evidence.",
        href: "#quick-buyer-room"
      },
      {
        id: "value",
        label: "Value is accepted",
        status: "ready",
        sourceStatus: "ready",
        owner: "Finance owner",
        matchedSignals: ["value owner stated"],
        missingSignals: [],
        action: "Use this answer as buyer validation evidence.",
        href: "#quick-buyer-room"
      },
      {
        id: "trust",
        label: "Trust proof was checked",
        status: "ready",
        sourceStatus: "ready",
        owner: "Proof owner",
        matchedSignals: ["proof opened", "receipt or verifier stated", "trust condition stated"],
        missingSignals: [],
        action: "Use this answer as buyer validation evidence.",
        href: "#quick-live-proof-audit"
      },
      {
        id: "commitment",
        label: "Commitment is explicit",
        status: "ready",
        sourceStatus: "ready",
        owner: "Sponsor approver",
        matchedSignals: ["approval stated", "bounded pilot stated", "stop rule stated"],
        missingSignals: [],
        action: "Use this answer as buyer validation evidence.",
        href: "#quick-buyer-decision-reply"
      }
    ]
  };
}

describe("quick buyer validation answer record receipt verifier", () => {
  test("verifies a generated buyer validation answer record request", () => {
    const payload = validationAnswerPayload();
    const checksum = quickBuyerValidationAnswerRecordChecksum(payload);

    const result = verifyQuickBuyerValidationAnswerRecordRequest({ checksum, payload });

    expect(QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH).toBe("/api/quick-buyer-validation-answer-record/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-buyer-validation-answer-record.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-buyer-validation-answer-record.v1",
          status: "ready",
          buyer: "Platform release lead",
          answeredCount: 5,
          totalCount: 5,
          recommendedBuyerDecision: "continue",
          readyCount: 5,
          blockedCount: 0
        }
      }
    });
  });

  test("dispatches through the shared receipt verification desk", () => {
    const payload = validationAnswerPayload();
    const checksum = quickBuyerValidationAnswerRecordChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        status: "verified",
        receiptType: "quick-buyer-validation-answer-record.v1",
        receiptLabel: "Buyer validation answer record",
        sourceVerifierApiPath: "/api/quick-buyer-validation-answer-record/verify",
        nativeSkill: "quick-buyer-validation-answer-record.receipt.verify",
        summary: {
          status: "ready",
          buyer: "Platform release lead",
          answeredCount: 5,
          totalCount: 5
        },
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });

  test("rejects a changed validation answer payload with a mismatch", () => {
    const payload = validationAnswerPayload();
    const checksum = quickBuyerValidationAnswerRecordChecksum(payload);

    const result = verifyQuickBuyerValidationAnswerRecordRequest({
      checksum,
      payload: {
        ...payload,
        nextAction: "Skip the decision recorder and launch globally."
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
    const result = verifyQuickBuyerValidationAnswerRecordRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-buyer-validation-answer-record.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
