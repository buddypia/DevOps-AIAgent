import { describe, expect, test } from "vitest";
import {
  QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERIFY_PATH,
  verifyQuickBuyerEvidenceResponseOwnerPacketReceiptRequest
} from "../server/quickBuyerEvidenceResponseOwnerPacketReceiptVerifier";
import {
  QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERSION,
  quickBuyerEvidenceResponseOwnerPacketReceiptChecksum,
  type QuickBuyerEvidenceResponseOwnerPacketReceiptPayload
} from "../src/quickBuyerEvidenceResponseOwnerPacketReceipt";

function ownerPacketPayload(): QuickBuyerEvidenceResponseOwnerPacketReceiptPayload {
  return {
    receiptVersion: QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERSION,
    status: "watch",
    state: "verified",
    label: "Request repairs",
    buyer: "Platform release lead",
    owner: "Proof owner",
    nextAction: "Fix Public proof repair",
    evidenceReceiptId: "quick-conversion-watch-12345678",
    evidenceChecksum: "fnv1a32:12345678",
    responseReceiptChecksum: "fnv1a32:abcdef12",
    reviewerLine: "Platform sponsor / 2026-06-25T00:00:00.000Z",
    runbook: [
      {
        id: "repair-required-evidence",
        label: "Repair required evidence",
        owner: "Proof owner",
        window: "Before buyer send",
        action: "Fix Public proof repair",
        evidence: "1/6 required artifacts ready",
        proof: "/receipt-verifier",
        status: "watch"
      }
    ],
    ownerPacketMarkdown: "# Buyer evidence response owner packet\n\nOwner: Proof owner",
    proof: "Owner packet generated from a returned buyer evidence response."
  };
}

describe("quick buyer evidence response owner packet receipt verifier", () => {
  test("verifies a generated buyer evidence response owner packet receipt", () => {
    const payload = ownerPacketPayload();
    const checksum = quickBuyerEvidenceResponseOwnerPacketReceiptChecksum(payload);

    const result = verifyQuickBuyerEvidenceResponseOwnerPacketReceiptRequest({ checksum, payload });

    expect(QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERIFY_PATH).toBe("/api/quick-buyer-evidence-response-owner-packet/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-buyer-evidence-response-owner-packet.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-buyer-evidence-response-owner-packet.v1",
          status: "watch",
          state: "verified",
          label: "Request repairs",
          buyer: "Platform release lead",
          owner: "Proof owner",
          evidenceReceiptId: "quick-conversion-watch-12345678",
          responseReceiptChecksum: "fnv1a32:abcdef12",
          runbookItemCount: 1,
          runbook: [
            {
              id: "repair-required-evidence",
              label: "Repair required evidence",
              owner: "Proof owner",
              window: "Before buyer send",
              status: "watch",
              action: "Fix Public proof repair",
              evidence: "1/6 required artifacts ready",
              proof: "/receipt-verifier"
            }
          ]
        }
      }
    });
  });

  test("returns mismatch when the owner packet markdown changes", () => {
    const payload = ownerPacketPayload();
    const checksum = quickBuyerEvidenceResponseOwnerPacketReceiptChecksum(payload);

    const result = verifyQuickBuyerEvidenceResponseOwnerPacketReceiptRequest({
      checksum,
      payload: {
        ...payload,
        ownerPacketMarkdown: "# Buyer evidence response owner packet\n\nOwner: Someone else"
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

  test("rejects malformed buyer evidence response owner packet receipts", () => {
    const result = verifyQuickBuyerEvidenceResponseOwnerPacketReceiptRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-buyer-evidence-response-owner-packet.v1",
        evidenceReceiptId: "quick-external-review-ready-12345678"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
