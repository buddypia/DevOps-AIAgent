import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH,
  verifyQuickValueRealizationCloseoutRepairAcknowledgementRequest
} from "../server/quickValueRealizationCloseoutRepairReceiptVerifier";
import {
  QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_RECEIPT_VERSION,
  quickValueRealizationCloseoutRepairAcknowledgementChecksum,
  type QuickValueRealizationCloseoutRepairAcknowledgementPayload
} from "../src/quickValueRealizationCloseoutRepairReceipt";

function repairAcknowledgementPayload(): QuickValueRealizationCloseoutRepairAcknowledgementPayload {
  return {
    receiptVersion: QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_RECEIPT_VERSION,
    status: "ready",
    buyer: "Global Platform VP",
    sourceCloseoutReceiptId: "quick-value-closeout-watch-12345678",
    sourceCloseoutChecksum: "fnv1a32:12345678",
    sourceLedgerReceiptId: "quick-value-realization-watch-87654321",
    sourceLedgerChecksum: "fnv1a32:87654321",
    repairQueueStatus: "watch",
    repairQueueItemCount: 2,
    sourceRepairCount: 2,
    evidenceGapCount: 0,
    acknowledgedCount: 2,
    requiredAcknowledgementCount: 2,
    nextOwner: "Ready",
    nextAction: "Attach this acknowledgement with the repaired value closeout packet.",
    ownerEvidence:
      "Global Platform VP accepted Day 0 source ledger repair; source ledger quick-value-realization-watch-87654321 was re-exported ready. Procurement owner accepted Day 30 source ledger repair.",
    items: [
      {
        id: "baseline-lock-source-ledger-repair-acknowledgement",
        taskId: "baseline-lock",
        label: "Day 0 source ledger repair",
        status: "ready",
        reason: "source-ledger-repair",
        owner: "Global Platform VP",
        matchedSignals: ["repair item named", "owner named", "repair accepted", "source ledger re-exported"],
        missingSignals: [],
        sourceStatus: "watch",
        evidenceStatus: "ready",
        requiredAction: "Update the source Day 0 value ledger row to ready using the matched closeout evidence already pasted here.",
        acceptance: "Baseline locked is ready in the source value ledger and Baseline closeout reruns ready.",
        href: "#buyer-launch-handoff"
      },
      {
        id: "expand-stop-source-ledger-repair-acknowledgement",
        taskId: "expand-stop",
        label: "Day 30 source ledger repair",
        status: "ready",
        reason: "source-ledger-repair",
        owner: "Procurement owner",
        matchedSignals: ["repair item named", "owner named", "repair accepted", "source ledger re-exported"],
        missingSignals: [],
        sourceStatus: "watch",
        evidenceStatus: "ready",
        requiredAction: "Update the source Day 30 value ledger row to ready using the matched closeout evidence already pasted here.",
        acceptance: "Expand or stop recorded is ready in the source value ledger and Decision closeout reruns ready.",
        href: "#launch-evidence-console"
      }
    ]
  };
}

describe("quick value realization closeout repair acknowledgement verifier", () => {
  test("verifies owner repair acknowledgement receipts", () => {
    const payload = repairAcknowledgementPayload();
    const checksum = quickValueRealizationCloseoutRepairAcknowledgementChecksum(payload);

    const result = verifyQuickValueRealizationCloseoutRepairAcknowledgementRequest({ checksum, payload });

    expect(QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH).toBe("/api/quick-value-realization-closeout-repair/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-value-realization-closeout-repair.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-value-realization-closeout-repair.v1",
          status: "ready",
          buyer: "Global Platform VP",
          sourceCloseoutReceiptId: "quick-value-closeout-watch-12345678",
          sourceLedgerReceiptId: "quick-value-realization-watch-87654321",
          acknowledgedCount: 2,
          requiredAcknowledgementCount: 2,
          itemCount: 2
        }
      }
    });
  });

  test("rejects changed owner acknowledgement payloads with a mismatch", () => {
    const payload = repairAcknowledgementPayload();
    const checksum = quickValueRealizationCloseoutRepairAcknowledgementChecksum(payload);

    const result = verifyQuickValueRealizationCloseoutRepairAcknowledgementRequest({
      checksum,
      payload: {
        ...payload,
        acknowledgedCount: 1
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

  test("keeps malformed repair acknowledgement requests out of the verifier", () => {
    const result = verifyQuickValueRealizationCloseoutRepairAcknowledgementRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-value-realization-closeout-repair.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches repair acknowledgement receipts through the receipt verification desk", () => {
    const payload = repairAcknowledgementPayload();
    const checksum = quickValueRealizationCloseoutRepairAcknowledgementChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-value-realization-closeout-repair.v1",
        receiptLabel: "Value closeout repair acknowledgement",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-value-realization-closeout-repair/verify",
        nativeSkill: "quick-value-realization-closeout-repair.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });
});
