import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import { verifyQuickWorkflowConversionReceiptRequest } from "../server/quickWorkflowConversionReceiptVerifier";
import {
  QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH,
  QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION,
  quickWorkflowConversionReceiptChecksum,
  type QuickWorkflowConversionReceiptPayload
} from "../src/quickWorkflowConversionReceipt";

function samplePayload(): QuickWorkflowConversionReceiptPayload {
  return {
    receiptVersion: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION,
    source: "quick-workflow-intake",
    buyer: "Platform release lead",
    workflow: "Weekly release readiness review",
    status: "ready",
    decisionLabel: "Send to buyer",
    decisionNextAction: "Run live proof verification before sharing the launch room.",
    pilotWeekReceiptId: "quick-pilot-week-ready-12345678",
    rows: [
      { id: "scope", status: "ready", value: "Buyer, workflow, baseline, and success metric attached.", proof: "Source line 1" },
      { id: "value", status: "ready", value: "¥328,000/month", proof: "Source line 2" },
      { id: "pilot", status: "ready", value: "1120 minutes saved/run", proof: "Source line 3" },
      { id: "proof", status: "ready", value: "5/5 public proof URLs ready", proof: "Source line 4" },
      { id: "a2a", status: "ready", value: "Accepted A2A trial receipt", proof: "Source line 5" },
      { id: "data", status: "ready", value: "public", proof: "Source line 6" }
    ],
    proofItems: [
      { id: "targetUrl", status: "ready", value: "https://example.com" },
      { id: "protopediaUrl", status: "ready", value: "https://protopedia.net/prototype/release-ready" },
      { id: "videoUrl", status: "ready", value: "https://youtu.be/releaseReady12345" },
      { id: "pilotEvidenceUrl", status: "ready", value: "https://example.com/pilot-run-receipt.json" },
      { id: "workOrderEvidenceUrl", status: "ready", value: "https://example.com/work-order.json" }
    ]
  };
}

describe("quick workflow conversion receipt verifier", () => {
  test("verifies a buyer room conversion replay payload", () => {
    const payload = samplePayload();
    const checksum = quickWorkflowConversionReceiptChecksum(payload);
    const result = verifyQuickWorkflowConversionReceiptRequest({ checksum, payload });

    expect(QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH).toBe("/api/quick-workflow-conversion/receipt/verify");
    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "quick-workflow-conversion.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: checksum,
        actualChecksum: checksum
      },
      receipt: {
        receiptVersion: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION,
        source: "quick-workflow-intake",
        buyer: "Platform release lead",
        status: "ready",
        rowCount: 6,
        readyRows: 6,
        proofReadyCount: 5,
        firstOpenRow: "none",
        pilotWeekReceiptId: "quick-pilot-week-ready-12345678"
      }
    });
  });

  test("returns mismatch if a generated buyer room row changes", () => {
    const payload = samplePayload();
    const checksum = quickWorkflowConversionReceiptChecksum(payload);
    const result = verifyQuickWorkflowConversionReceiptRequest({
      checksum,
      payload: {
        ...payload,
        rows: payload.rows.map((row) => (row.id === "value" ? { ...row, value: "¥1" } : row))
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

  test("rejects malformed conversion receipt requests", () => {
    const result = verifyQuickWorkflowConversionReceiptRequest({
      checksum: "not-valid",
      payload: {
        receiptVersion: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches through the generic receipt verification desk", () => {
    const payload = samplePayload();
    const checksum = quickWorkflowConversionReceiptChecksum(payload);
    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "receipt-verifier.dispatch",
      status: "verified",
      verified: true,
      receiptType: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION,
      receiptLabel: "Quick workflow conversion",
      sourceVerifierApiPath: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH
    });
  });
});
