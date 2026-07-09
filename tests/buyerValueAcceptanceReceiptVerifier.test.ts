import { describe, expect, test } from "vitest";
import { verifyBuyerValueAcceptanceReceiptRequest } from "../server/buyerValueAcceptanceReceiptVerifier";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  BUYER_VALUE_ACCEPTANCE_RECEIPT_VERSION,
  buyerValueAcceptanceChecksum,
  type BuyerValueAcceptancePayload
} from "../src/buyerValueAcceptanceReceipt";

function acceptancePayload(): BuyerValueAcceptancePayload {
  return {
    receiptVersion: BUYER_VALUE_ACCEPTANCE_RECEIPT_VERSION,
    status: "ready",
    decision: "accept-sponsor-ask",
    targetBuyer: "Platform / DevOps Lead",
    reportId: "buyer-value-report-board-ready-91",
    scenarioId: "buyer-value-91-scales-now",
    sensitivityId: "buyer-value-sensitivity-defensible-42",
    commitmentId: "buyer-value-commitment-send-to-sponsor-91",
    generatedAt: "2026-06-25T00:00:00.000Z",
    valueReportHref: "https://example.com/buyer-value",
    reviewerName: "Platform sponsor",
    reportReadiness: "board-ready",
    commitmentDecision: "send-to-sponsor",
    monthlyGrossValueYen: 1440000,
    measuredMonthlyValueYen: 1200000,
    supportRatioPercent: 83,
    paybackDays: 8,
    downsidePaybackDays: 15,
    breakEvenAdoptionPercent: 42,
    recommendedAskYen: 264000,
    publicEvidenceUrl: "https://example.com/pilot-receipt",
    publicProofStatus: "ready",
    nextOwner: "Executive sponsor",
    nextAction: "Attach this receipt to the sponsor review packet with the value report and pilot evidence URL.",
    buyerClaim: "Platform / DevOps Lead can review 1,440,000 yen monthly value with 83% measured support and a 264,000 yen capped first ask.",
    checks: [
      {
        id: "value-report",
        label: "Value report",
        status: "ready",
        value: "board-ready",
        evidence: "The value report is board-ready.",
        acceptance: "Base value, payback, and sensitivity are summarized in a buyer-readable report."
      },
      {
        id: "assumption-audit",
        label: "Assumption audit",
        status: "ready",
        value: "5/5 clear",
        evidence: "All assumptions are clear.",
        acceptance: "Adoption, downside payback, measured support, public receipt, and budget ask have explicit owner actions."
      },
      {
        id: "measured-proof",
        label: "Measured proof",
        status: "ready",
        value: "83% model support",
        evidence: "Measured pilot evidence supports the value claim.",
        acceptance: "The value claim is tied to an observed pilot run instead of only modeled ROI."
      },
      {
        id: "public-receipt",
        label: "Public receipt",
        status: "ready",
        value: "https://example.com/pilot-receipt",
        evidence: "https://example.com/pilot-receipt",
        acceptance: "A reviewer can open the pilot proof without private workspace access."
      },
      {
        id: "sponsor-ask",
        label: "Sponsor ask",
        status: "ready",
        value: "send-to-sponsor / 264,000 yen",
        evidence: "Ask up to 264,000 yen and expand only after measured proof clears the red lines.",
        acceptance: "The first ask is capped by the buyer value ceiling and guarded by red lines."
      }
    ]
  };
}

describe("buyer value acceptance receipt verifier", () => {
  test("verifies sponsor-send value acceptance receipts", () => {
    const payload = acceptancePayload();
    const checksum = buyerValueAcceptanceChecksum(payload);

    const result = verifyBuyerValueAcceptanceReceiptRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "buyer-value-acceptance.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "buyer-value-acceptance.v1",
          status: "ready",
          decision: "accept-sponsor-ask",
          reportReadiness: "board-ready",
          commitmentDecision: "send-to-sponsor",
          publicProofStatus: "ready",
          checkCount: 5
        }
      }
    });
  });

  test("rejects changed value acceptance receipts with a mismatch", () => {
    const payload = acceptancePayload();
    const checksum = buyerValueAcceptanceChecksum(payload);

    const result = verifyBuyerValueAcceptanceReceiptRequest({
      checksum,
      payload: {
        ...payload,
        recommendedAskYen: 999000
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

  test("keeps malformed value acceptance requests out of the verifier", () => {
    const result = verifyBuyerValueAcceptanceReceiptRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "buyer-value-acceptance.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches value acceptance receipts through the receipt verification desk", () => {
    const payload = acceptancePayload();
    const checksum = buyerValueAcceptanceChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "buyer-value-acceptance.v1",
        receiptLabel: "Buyer value acceptance receipt",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/buyer-value-acceptance/verify",
        nativeSkill: "buyer-value-acceptance.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });
});
