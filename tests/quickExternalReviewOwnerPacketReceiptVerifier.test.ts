import { describe, expect, test } from "vitest";
import {
  QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERIFY_PATH,
  verifyQuickExternalReviewOwnerPacketReceiptRequest
} from "../server/quickExternalReviewOwnerPacketReceiptVerifier";
import {
  QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERSION,
  quickExternalReviewOwnerPacketReceiptChecksum,
  type QuickExternalReviewOwnerPacketReceiptPayload
} from "../src/quickExternalReviewOwnerPacketReceipt";

function ownerFollowUpLedger(): QuickExternalReviewOwnerPacketReceiptPayload["followUpLedger"] {
  return {
    status: "blocked",
    headline: "Reviewer stop becomes a no-send ledger",
    summary: "1 owner task carries the reviewer response into repair work.",
    readyCount: 0,
    watchCount: 0,
    blockedCount: 1,
    taskTotal: 1,
    firstDueLabel: "+1 business day",
    calendarStartDate: "2026-06-25",
    calendarEndDate: "2026-06-26",
    tasks: [
      {
        id: "repair-target",
        label: "Repair target",
        status: "blocked",
        owner: "Review coordinator",
        dueLabel: "+1 business day",
        action: "Refresh proof freshness before requesting another review.",
        closeCondition: "Review coordinator clears the blocker before another reviewer receives the packet.",
        evidence: "quick-external-review-blocked-12345678",
        proof: "fnv1a32:12345678",
        href: "/receipt-verifier?requestKey=quick-external-review-blocked-12345678"
      }
    ],
    csv: "taskId,label,status,owner,due,action,closeCondition,evidence,proof,href\nrepair-target,Repair target,blocked,Review coordinator,+1 business day,Refresh proof freshness before requesting another review.,Review coordinator clears the blocker before another reviewer receives the packet.,quick-external-review-blocked-12345678,fnv1a32:12345678,/receipt-verifier?requestKey=quick-external-review-blocked-12345678",
    calendarText: "BEGIN:VCALENDAR\r\nEND:VCALENDAR",
    exportMarkdown: "# External review response follow-up ledger\n\n- [blocked] Repair target"
  };
}

function ownerPacketPayload(): QuickExternalReviewOwnerPacketReceiptPayload {
  return {
    receiptVersion: QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERSION,
    status: "blocked",
    label: "Stop preserved",
    buyer: "Platform release lead",
    owner: "Review coordinator",
    nextAction: "Stop external sharing and repair the rendered packet before requesting another review.",
    manifestReceiptId: "quick-external-review-blocked-12345678",
    manifestChecksum: "fnv1a32:12345678",
    responseReceiptChecksum: "fnv1a32:abcdef12",
    reviewerLine: "External reviewer / 2026-06-25T00:00:00.000Z",
    acceptanceCriteria: [
      "Do not send this packet to another external reviewer until the repair is complete.",
      "Regenerate the external review packet and verify the new manifest before requesting another reviewer response."
    ],
    runbook: [
      {
        id: "repair-target",
        label: "Repair target",
        owner: "Review coordinator",
        window: "Before re-review",
        action: "Refresh proof freshness before requesting another review.",
        evidence: "quick-external-review-blocked-12345678",
        proof: "fnv1a32:12345678",
        status: "blocked"
      }
    ],
    followUpLedger: ownerFollowUpLedger(),
    ownerPacketMarkdown: "# External review owner packet\n\nOwner: Review coordinator",
    regenerationNote: "Buyer: Platform release lead\nRepair target: Proof freshness",
    proof: "Owner packet generated from a verified external review response."
  };
}

describe("quick external review owner packet receipt verifier", () => {
  test("verifies a generated owner repair packet receipt", () => {
    const payload = ownerPacketPayload();
    const checksum = quickExternalReviewOwnerPacketReceiptChecksum(payload);

    const result = verifyQuickExternalReviewOwnerPacketReceiptRequest({ checksum, payload });

    expect(QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERIFY_PATH).toBe("/api/quick-external-review-owner-packet/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-external-review-owner-packet.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-external-review-owner-packet.v1",
          status: "blocked",
          label: "Stop preserved",
          buyer: "Platform release lead",
          owner: "Review coordinator",
          manifestReceiptId: "quick-external-review-blocked-12345678",
          responseReceiptChecksum: "fnv1a32:abcdef12",
          acceptanceCriteriaCount: 2,
          runbookItemCount: 1,
          followUpTaskCount: 1,
          followUpFirstDue: "+1 business day",
          runbook: [
            {
              id: "repair-target",
              label: "Repair target",
              owner: "Review coordinator",
              window: "Before re-review",
              status: "blocked",
              action: "Refresh proof freshness before requesting another review.",
              evidence: "quick-external-review-blocked-12345678",
              proof: "fnv1a32:12345678"
            }
          ]
        }
      }
    });
  });

  test("returns mismatch when the owner packet markdown changes", () => {
    const payload = ownerPacketPayload();
    const checksum = quickExternalReviewOwnerPacketReceiptChecksum(payload);

    const result = verifyQuickExternalReviewOwnerPacketReceiptRequest({
      checksum,
      payload: {
        ...payload,
        ownerPacketMarkdown: "# External review owner packet\n\nOwner: Someone else"
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

  test("rejects malformed owner packet receipts", () => {
    const result = verifyQuickExternalReviewOwnerPacketReceiptRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-external-review-owner-packet.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
