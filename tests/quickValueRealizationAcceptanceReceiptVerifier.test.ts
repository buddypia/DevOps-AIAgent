import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH,
  verifyQuickValueRealizationAcceptanceRequest
} from "../server/quickValueRealizationAcceptanceReceiptVerifier";
import {
  QUICK_VALUE_REALIZATION_ACCEPTANCE_RECEIPT_VERSION,
  quickValueRealizationAcceptanceChecksum,
  type QuickValueRealizationAcceptancePayload
} from "../src/quickValueRealizationAcceptanceReceipt";

function acceptancePayload(): QuickValueRealizationAcceptancePayload {
  return {
    receiptVersion: QUICK_VALUE_REALIZATION_ACCEPTANCE_RECEIPT_VERSION,
    status: "ready",
    decision: "accept-value-proof",
    buyer: "Global Platform VP",
    closeoutDecision: "expand",
    retainedValueYen: 480000,
    retainedValueTargetYen: 404000,
    sourceCloseoutReceiptId: "quick-value-closeout-ready-12345678",
    sourceCloseoutChecksum: "fnv1a32:12345678",
    repairAcknowledgementReceiptId: "quick-value-closeout-repair-ready-87654321",
    repairAcknowledgementChecksum: "fnv1a32:87654321",
    sourceLedgerReceiptId: "quick-value-realization-ready-abcdef12",
    sourceLedgerChecksum: "fnv1a32:abcdef12",
    closeoutStatus: "ready",
    closeoutCompletedCount: 4,
    closeoutBlockedCount: 0,
    repairQueueItemCount: 0,
    evidenceGapCount: 0,
    sourceRepairCount: 0,
    repairAcknowledgementStatus: "ready",
    acknowledgedCount: 0,
    requiredAcknowledgementCount: 0,
    nextOwner: "Ready",
    nextAction: "Attach this acceptance packet to the buyer value proof.",
    buyerClaim: "Global Platform VP can review ¥480,000/month retained value with closeout and repair receipts attached.",
    checks: [
      {
        id: "closeout-receipt",
        label: "Closeout receipt",
        status: "ready",
        owner: "Ready",
        evidence: "quick-value-closeout-ready-12345678 / fnv1a32:12345678",
        acceptance: "Closeout receipt verifies and no operating evidence gaps remain."
      },
      {
        id: "repair-acknowledgement",
        label: "Repair acknowledgement",
        status: "ready",
        owner: "Ready",
        evidence: "quick-value-closeout-repair-ready-87654321 / fnv1a32:87654321",
        acceptance: "Source-ledger repair acknowledgements are complete or no repair acknowledgement is required."
      },
      {
        id: "retained-value",
        label: "Retained value",
        status: "ready",
        owner: "Finance owner",
        evidence: "¥480,000/month against ¥404,000/month target.",
        acceptance: "Retained value meets or exceeds the buyer success target."
      },
      {
        id: "buyer-decision",
        label: "Buyer decision",
        status: "ready",
        owner: "Procurement owner",
        evidence: "expand decision recorded.",
        acceptance: "Day 30 expand, revise, or stop decision is recorded with current proof."
      }
    ]
  };
}

describe("quick value realization acceptance receipt verifier", () => {
  test("verifies final buyer value acceptance packets", () => {
    const payload = acceptancePayload();
    const checksum = quickValueRealizationAcceptanceChecksum(payload);

    const result = verifyQuickValueRealizationAcceptanceRequest({ checksum, payload });

    expect(QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH).toBe("/api/quick-value-realization-acceptance/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-value-realization-acceptance.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-value-realization-acceptance.v1",
          status: "ready",
          decision: "accept-value-proof",
          buyer: "Global Platform VP",
          closeoutDecision: "expand",
          retainedValueYen: 480000,
          retainedValueTargetYen: 404000,
          sourceCloseoutReceiptId: "quick-value-closeout-ready-12345678",
          repairAcknowledgementReceiptId: "quick-value-closeout-repair-ready-87654321",
          closeoutStatus: "ready",
          repairAcknowledgementStatus: "ready",
          acknowledgedCount: 0,
          requiredAcknowledgementCount: 0,
          evidenceGapCount: 0,
          sourceRepairCount: 0,
          checkCount: 4,
          nextOwner: "Ready"
        }
      }
    });
  });

  test("rejects changed acceptance packets with a mismatch", () => {
    const payload = acceptancePayload();
    const checksum = quickValueRealizationAcceptanceChecksum(payload);

    const result = verifyQuickValueRealizationAcceptanceRequest({
      checksum,
      payload: {
        ...payload,
        retainedValueYen: 120000
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

  test("keeps malformed acceptance requests out of the verifier", () => {
    const result = verifyQuickValueRealizationAcceptanceRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-value-realization-acceptance.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches acceptance packets through the receipt verification desk", () => {
    const payload = acceptancePayload();
    const checksum = quickValueRealizationAcceptanceChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-value-realization-acceptance.v1",
        receiptLabel: "Value realization acceptance packet",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-value-realization-acceptance/verify",
        nativeSkill: "quick-value-realization-acceptance.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });
});
