import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH,
  verifyQuickValueRealizationCloseoutRequest
} from "../server/quickValueRealizationCloseoutReceiptVerifier";
import {
  QUICK_VALUE_REALIZATION_CLOSEOUT_RECEIPT_VERSION,
  quickValueRealizationCloseoutChecksum,
  type QuickValueRealizationCloseoutPayload
} from "../src/quickValueRealizationCloseoutReceipt";

function closeoutPayload(): QuickValueRealizationCloseoutPayload {
  return {
    receiptVersion: QUICK_VALUE_REALIZATION_CLOSEOUT_RECEIPT_VERSION,
    status: "ready",
    buyer: "Global Platform VP",
    primaryAsk: "Run the weekly release readiness review as a buyer-verifiable operating loop.",
    completedCount: 4,
    blockedCount: 0,
    retainedValueYen: 480000,
    retainedValueTargetYen: 404000,
    decision: "expand",
    nextOwner: "Global Platform VP",
    nextAction: "Ready",
    sourceLedgerReceiptId: "quick-value-realization-ready-12345678",
    sourceLedgerChecksum: "fnv1a32:12345678",
    closeoutEvidence: "Day 0 baseline, Day 7 accepted repeat use, Day 14 retained value, and Day 30 expansion approved.",
    repairQueue: {
      status: "ready",
      headline: "No value closeout repairs open",
      summary: "Global Platform VP has aligned closeout evidence and a source ledger that can be verified.",
      itemCount: 0,
      sourceRepairCount: 0,
      evidenceGapCount: 0,
      nextOwner: "Ready",
      nextAction: "Keep the closeout receipt attached to the buyer value packet.",
      items: []
    },
    tasks: [
      {
        id: "baseline-lock",
        window: "Day 0",
        label: "Baseline closeout",
        status: "ready",
        owner: "Global Platform VP",
        outcome: "Operating baseline, metric, proof packet, and stop rule are present.",
        matchedSignals: ["baseline or owner named", "metric or review cadence named", "proof packet or stop rule named"],
        missingSignals: [],
        evidence: "Owner can name the metric, proof packet, stop rule, and next review date.",
        href: "#buyer-launch-handoff"
      },
      {
        id: "repeat-usage",
        window: "Day 7",
        label: "Usage closeout",
        status: "ready",
        owner: "Pilot operator",
        outcome: "Repeated accepted use is backed by run evidence.",
        matchedSignals: ["repeat usage stated", "accepted use stated", "run evidence attached"],
        missingSignals: [],
        evidence: "Accepted task rate stays at or above 90%.",
        href: "#pilot-run-receipt"
      },
      {
        id: "value-retention",
        window: "Day 14",
        label: "Value closeout",
        status: "ready",
        owner: "Finance owner",
        outcome: "¥480,000/month clears the ¥404,000/month retained-value target.",
        matchedSignals: ["retained value meets target", "finance or retained value stated", "currency evidence attached"],
        missingSignals: [],
        evidence: "Retained value is at least ¥404,000/month.",
        href: "#buyer-value-simulator"
      },
      {
        id: "expand-stop",
        window: "Day 30",
        label: "Decision closeout",
        status: "ready",
        owner: "Procurement owner",
        outcome: "The Day 30 closeout records a expand decision with current proof.",
        matchedSignals: ["expand decision stated", "proof freshness stated", "closeout proof attached"],
        missingSignals: [],
        evidence: "Expansion is approved only if value, proof, trust boundary, and owners remain current.",
        href: "#launch-evidence-console"
      }
    ]
  };
}

describe("quick value realization closeout receipt verifier", () => {
  test("verifies a generated value closeout request", () => {
    const payload = closeoutPayload();
    const checksum = quickValueRealizationCloseoutChecksum(payload);

    const result = verifyQuickValueRealizationCloseoutRequest({ checksum, payload });

    expect(QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH).toBe("/api/quick-value-realization-closeout/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-value-realization-closeout.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-value-realization-closeout.v1",
          status: "ready",
          buyer: "Global Platform VP",
          decision: "expand",
          completedCount: 4,
          blockedCount: 0,
          retainedValueYen: 480000,
          retainedValueTargetYen: 404000,
          sourceLedgerReceiptId: "quick-value-realization-ready-12345678",
          taskCount: 4,
          repairQueue: {
            status: "ready",
            itemCount: 0,
            sourceRepairCount: 0,
            evidenceGapCount: 0,
            nextOwner: "Ready"
          }
        }
      }
    });
  });

  test("rejects a changed value closeout payload with a mismatch", () => {
    const payload = closeoutPayload();
    const checksum = quickValueRealizationCloseoutChecksum(payload);

    const result = verifyQuickValueRealizationCloseoutRequest({
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

  test("keeps malformed external closeout requests out of the verifier", () => {
    const result = verifyQuickValueRealizationCloseoutRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-value-realization-closeout.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches value closeout receipts through the receipt verification desk", () => {
    const payload = closeoutPayload();
    const checksum = quickValueRealizationCloseoutChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-value-realization-closeout.v1",
        receiptLabel: "Value realization closeout",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-value-realization-closeout/verify",
        nativeSkill: "quick-value-realization-closeout.receipt.verify"
      }
    });
  });
});
