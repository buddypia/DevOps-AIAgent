import { describe, expect, it } from "vitest";
import { verifyAdoptionSuccessReceiptRequest } from "../server/adoptionSuccessReceiptVerifier";
import { buildAdoptionSuccessReceipt, type AdoptionSuccessReceiptPayload } from "../src/adoptionOperatingPlan";

function samplePayload(): AdoptionSuccessReceiptPayload {
  return {
    receiptVersion: "adoption-success-ledger.v1",
    planId: "adoption-operating-plan-ready-to-operate-92",
    ledgerId: "adoption-success-ledger-expand-next-workflow-94",
    decision: "expand-next-workflow",
    successScore: 94,
    buyer: "Platform lead",
    operatingMetric: "Minutes saved per release-readiness review",
    reviewWindow: "Day 30 operating review",
    renewalAsk: "Ask Platform lead to approve the next named workflow while keeping the same success ledger and stop rules.",
    riskAdjustedMonthlyValueYen: 1_240_000,
    rows: [
      {
        id: "health-first-run-proof",
        label: "First-run proof",
        status: "clear",
        value: "1120m saved",
        owner: "Platform sponsor",
        evidence: "100% acceptance and public pilot receipt attached.",
        action: "Keep First-run proof attached to the day-30 operating review."
      },
      {
        id: "approval-day-30-review",
        label: "Day-30 expand or stop gate",
        status: "clear",
        value: "Adoption operating plan",
        owner: "Platform lead",
        evidence: "92/100 ledger score and agreement stop rules accepted.",
        action: "Use the operating review to approve only the next named workflow."
      }
    ],
    expansionCriteria: [
      "Measured monthly value remains above 900,000 yen.",
      "Task acceptance stays at or above 70%."
    ]
  };
}

describe("adoption success receipt verifier", () => {
  it("verifies an untampered adoption success receipt payload", () => {
    const receipt = buildAdoptionSuccessReceipt(samplePayload());

    const result = verifyAdoptionSuccessReceiptRequest({
      checksum: receipt.checksum,
      payload: receipt.payload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "adoption-success-ledger.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: receipt.checksum,
        actualChecksum: receipt.checksum
      },
      receipt: {
        receiptVersion: "adoption-success-ledger.v1",
        decision: "expand-next-workflow",
        successScore: 94,
        buyer: "Platform lead",
        blockedRows: 0,
        watchRows: 0,
        expansionCriteriaCount: 2
      }
    });
  });

  it("returns 422 when the adoption success payload is changed after export", () => {
    const receipt = buildAdoptionSuccessReceipt(samplePayload());

    const result = verifyAdoptionSuccessReceiptRequest({
      checksum: receipt.checksum,
      payload: {
        ...receipt.payload,
        decision: "hold-expansion"
      }
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      verification: {
        status: "mismatch",
        expectedChecksum: receipt.checksum
      }
    });
  });

  it("rejects malformed adoption success receipt verification requests", () => {
    const result = verifyAdoptionSuccessReceiptRequest({
      checksum: "not-a-checksum",
      payload: {}
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
