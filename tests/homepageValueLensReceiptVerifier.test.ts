import { describe, expect, test } from "vitest";
import { verifyHomepageValueLensReceiptRequest } from "../server/homepageValueLensReceiptVerifier";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH,
  HOMEPAGE_VALUE_LENS_RECEIPT_VERSION,
  homepageValueLensReceiptChecksum,
  type HomepageValueLensReceiptPayload
} from "../src/homepageValueLensReceipt";

function samplePayload(): HomepageValueLensReceiptPayload {
  return {
    receiptVersion: HOMEPAGE_VALUE_LENS_RECEIPT_VERSION,
    source: "homepage-value-lens",
    buyer: "Platform release lead",
    status: "ready",
    headline: "This workflow has a defendable value case",
    valueClaim:
      "Platform release lead can inspect 1,027,000 yen modeled monthly value, 1,005,000 yen measured support, and 23-day payback before opening the full report.",
    monthlyValueYen: 1027000,
    measuredMonthlyValueYen: 1005000,
    measuredSupportPercent: 98,
    paybackDays: 23,
    confidenceScore: 83,
    monthlyHoursSaved: 126,
    pilotBudgetCeilingYen: 770000,
    assumptions: {
      teamSize: 8,
      cyclesPerMonth: 6,
      manualHoursPerCycle: 32,
      adoptionRatePercent: 82,
      hourlyCostYen: 12000,
      incidentRiskYenPerMonth: 500000
    },
    metrics: [
      {
        id: "modeled-value",
        label: "Modeled value",
        value: "1,027,000 yen",
        status: "ready",
        evidence: "126 hours/month saved at 82% adoption."
      },
      {
        id: "measured-support",
        label: "Measured support",
        value: "98%",
        status: "ready",
        evidence: "1,005,000 yen measured value from 90% accepted tasks."
      }
    ],
    primaryAction: {
      label: "Open value report",
      href: "/buyer-value?workspace=share-token"
    },
    workflowAction: {
      label: "Start with workflow",
      href: "#quick-workflow-intake"
    }
  };
}

describe("homepage value lens receipt verifier", () => {
  test("verifies the first-screen value replay payload", () => {
    const payload = samplePayload();
    const checksum = homepageValueLensReceiptChecksum(payload);
    const result = verifyHomepageValueLensReceiptRequest({ checksum, payload });

    expect(HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH).toBe("/api/homepage-value-lens/receipt/verify");
    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "homepage-value-lens.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: checksum,
        actualChecksum: checksum
      },
      receipt: {
        receiptVersion: HOMEPAGE_VALUE_LENS_RECEIPT_VERSION,
        source: "homepage-value-lens",
        buyer: "Platform release lead",
        status: "ready",
        monthlyValueYen: 1027000,
        measuredMonthlyValueYen: 1005000,
        measuredSupportPercent: 98,
        paybackDays: 23,
        confidenceScore: 83,
        metricCount: 2,
        firstAction: "Open value report"
      }
    });
  });

  test("returns mismatch when the value claim changes after export", () => {
    const payload = samplePayload();
    const checksum = homepageValueLensReceiptChecksum(payload);
    const result = verifyHomepageValueLensReceiptRequest({
      checksum,
      payload: {
        ...payload,
        monthlyValueYen: 10
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

  test("rejects malformed homepage value lens receipts", () => {
    const result = verifyHomepageValueLensReceiptRequest({
      checksum: "not-valid",
      payload: {
        receiptVersion: HOMEPAGE_VALUE_LENS_RECEIPT_VERSION
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches through the generic receipt verification desk", () => {
    const payload = samplePayload();
    const checksum = homepageValueLensReceiptChecksum(payload);
    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "receipt-verifier.dispatch",
      status: "verified",
      verified: true,
      receiptType: HOMEPAGE_VALUE_LENS_RECEIPT_VERSION,
      receiptLabel: "Homepage value lens",
      sourceVerifierApiPath: HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH
    });
  });
});
