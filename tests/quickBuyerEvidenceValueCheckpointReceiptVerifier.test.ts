import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_VERIFY_PATH,
  QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_VERIFY_PATH,
  verifyQuickBuyerEvidenceValueCheckpointRequest,
  verifyQuickBuyerEvidenceValueOwnerCloseoutRequest
} from "../server/quickBuyerEvidenceValueCheckpointReceiptVerifier";
import {
  QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_RECEIPT_VERSION,
  QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_RECEIPT_VERSION,
  quickBuyerEvidenceValueCheckpointChecksum,
  quickBuyerEvidenceValueOwnerCloseoutChecksum,
  type QuickBuyerEvidenceValueCheckpointReceiptPayload,
  type QuickBuyerEvidenceValueOwnerCloseoutPayload
} from "../src/quickBuyerEvidenceValueCheckpointReceipt";

function checkpointPayload(): QuickBuyerEvidenceValueCheckpointReceiptPayload {
  return {
    receiptVersion: QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_RECEIPT_VERSION,
    status: "ready",
    decision: "expand",
    buyer: "Global Platform VP",
    workflow: "Weekly Cloud Run release-readiness review",
    reviewerName: "Finance reviewer",
    generatedAt: "2026-07-08T00:00:00.000Z",
    checkpointStatus: "ready",
    readyCount: 5,
    totalCount: 5,
    currentOwner: "Launch owner",
    currentAction: "Review the first-week activation thread at the checkpoint.",
    actualValueSignal: "Day 7 evidence shows the release review saved 21.3h and retained ¥295,000/month.",
    nextOwner: "Launch owner",
    nextAction: "Expand to the next buyer operating window with the value checkpoint receipt attached.",
    sourceReceiptId: "homepage-outcome-ready-12345678",
    sourceChecksum: "fnv1a32:12345678",
    proof: "homepage-outcome-ready-12345678 / fnv1a32:12345678 / 5/5 value checks ready / Day 7 evidence shows retained value.",
    items: [
      {
        id: "baseline",
        label: "Baseline value",
        status: "ready",
        owner: "Finance sponsor",
        metric: "Baseline value claim",
        target: "Value claim is cited before the Day 7 checkpoint.",
        evidence: "¥295,000/month and 21.3h saved.",
        action: "Attach the value baseline to the activation thread.",
        href: "/launch-evidence"
      },
      {
        id: "proof-sample",
        label: "Proof sample",
        status: "ready",
        owner: "Proof owner",
        metric: "Live proof sample",
        target: "A technical buyer can reopen the live proof from the shared page.",
        evidence: "Proof links respond.",
        action: "Run live audit and attach the result.",
        href: "/proof"
      },
      {
        id: "adoption-signal",
        label: "Adoption signal",
        status: "ready",
        owner: "Launch owner",
        metric: "Activation thread",
        target: "Day 0-7 steps have owner, evidence, and close condition.",
        evidence: "Activation thread contains owner updates.",
        action: "Review the first-week activation thread at the checkpoint.",
        href: "/launch-room"
      },
      {
        id: "finance-decision",
        label: "Finance decision",
        status: "ready",
        owner: "Finance sponsor",
        metric: "Finance decision",
        target: "Budget owner can accept, repair, or hold with cited evidence.",
        evidence: "Finance accepted the value claim.",
        action: "Attach measured value proof to the approval thread.",
        href: "/finance"
      },
      {
        id: "next-window",
        label: "Next window",
        status: "ready",
        owner: "Decision owner",
        metric: "Stop, repair, or expand window",
        target: "Next checkpoint is scheduled from the send rule.",
        evidence: "Stop rule is scheduled.",
        action: "Schedule the Day 7 stop, repair, or expand checkpoint.",
        href: "#buyer-response-receipt"
      }
    ]
  };
}

function valueOwnerCloseoutPayload(): QuickBuyerEvidenceValueOwnerCloseoutPayload {
  return {
    receiptVersion: QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_RECEIPT_VERSION,
    status: "watch",
    decision: "hold-owner-closeout",
    buyer: "Global Platform VP",
    workflow: "Weekly Cloud Run release-readiness review",
    acceptedBy: "Pilot owner",
    generatedAt: "2026-07-09T00:00:00.000Z",
    evidenceNote: "Baseline proof was attached, but proof links still need repair.",
    sourceReceiptId: "homepage-outcome-ready-12345678",
    sourceChecksum: "fnv1a32:12345678",
    sourceCheckpointChecksum: "fnv1a32:abcdef12",
    sourceHandoffStatus: "watch",
    closedTaskCount: 1,
    taskCount: 2,
    openTaskCount: 1,
    nextOwner: "Proof owner",
    nextAction: "Keep value expansion held until Proof owner closes Close proof sample.",
    tasks: [
      {
        id: "attach-checkpoint-receipt",
        label: "Attach checkpoint receipt",
        status: "ready",
        owner: "Finance reviewer",
        dueLabel: "Today",
        action: "Attach the verified value checkpoint receipt before assigning owner work.",
        closeCondition: "Owner can verify fnv1a32:abcdef12 in the receipt desk.",
        evidence: "Value checkpoint receipt attached.",
        href: "/receipt-verifier?request=checkpoint",
        closed: true,
        outcomeNote: "Closed by Pilot owner: receipt is attached."
      },
      {
        id: "close-proof-sample",
        label: "Close proof sample",
        status: "watch",
        owner: "Proof owner",
        dueLabel: "+1 business day",
        action: "Repair blocked proof links.",
        closeCondition: "Proof owner attaches evidence that meets target: public proof reopens.",
        evidence: "3/5 links verified.",
        href: "/launch-evidence",
        closed: false,
        outcomeNote: "Still open for Proof owner: public proof reopens."
      }
    ]
  };
}

describe("quick buyer evidence value checkpoint receipt verifier", () => {
  test("verifies a generated value checkpoint receipt", () => {
    const payload = checkpointPayload();
    const checksum = quickBuyerEvidenceValueCheckpointChecksum(payload);

    const result = verifyQuickBuyerEvidenceValueCheckpointRequest({ checksum, payload });

    expect(QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_VERIFY_PATH).toBe("/api/quick-buyer-evidence-value-checkpoint/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-buyer-evidence-value-checkpoint.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-buyer-evidence-value-checkpoint.v1",
          status: "ready",
          decision: "expand",
          buyer: "Global Platform VP",
          readyCount: 5,
          totalCount: 5,
          sourceReceiptId: "homepage-outcome-ready-12345678",
          itemCount: 5
        }
      }
    });
  });

  test("returns mismatch when the checkpoint decision changes", () => {
    const payload = checkpointPayload();
    const checksum = quickBuyerEvidenceValueCheckpointChecksum(payload);

    const result = verifyQuickBuyerEvidenceValueCheckpointRequest({
      checksum,
      payload: {
        ...payload,
        decision: "hold"
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

  test("rejects malformed checkpoint receipts", () => {
    const result = verifyQuickBuyerEvidenceValueCheckpointRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-buyer-evidence-value-checkpoint.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches checkpoint receipts through the receipt verification desk", () => {
    const payload = checkpointPayload();
    const checksum = quickBuyerEvidenceValueCheckpointChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-buyer-evidence-value-checkpoint.v1",
        receiptLabel: "Buyer value checkpoint receipt",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-buyer-evidence-value-checkpoint/verify",
        nativeSkill: "quick-buyer-evidence-value-checkpoint.receipt.verify"
      }
    });
  });

  test("verifies a generated value owner closeout receipt", () => {
    const payload = valueOwnerCloseoutPayload();
    const checksum = quickBuyerEvidenceValueOwnerCloseoutChecksum(payload);

    const result = verifyQuickBuyerEvidenceValueOwnerCloseoutRequest({ checksum, payload });

    expect(QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_VERIFY_PATH).toBe("/api/quick-buyer-evidence-value-owner-closeout/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-buyer-evidence-value-owner-closeout.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-buyer-evidence-value-owner-closeout.v1",
          status: "watch",
          decision: "hold-owner-closeout",
          buyer: "Global Platform VP",
          acceptedBy: "Pilot owner",
          closedTaskCount: 1,
          taskCount: 2,
          openTaskCount: 1,
          nextOwner: "Proof owner"
        }
      }
    });
  });

  test("returns mismatch when value owner closeout evidence changes", () => {
    const payload = valueOwnerCloseoutPayload();
    const checksum = quickBuyerEvidenceValueOwnerCloseoutChecksum(payload);

    const result = verifyQuickBuyerEvidenceValueOwnerCloseoutRequest({
      checksum,
      payload: {
        ...payload,
        evidenceNote: "Changed after export."
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

  test("rejects malformed value owner closeout receipts", () => {
    const result = verifyQuickBuyerEvidenceValueOwnerCloseoutRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-buyer-evidence-value-owner-closeout.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches value owner closeout receipts through the receipt verification desk", () => {
    const payload = valueOwnerCloseoutPayload();
    const checksum = quickBuyerEvidenceValueOwnerCloseoutChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-buyer-evidence-value-owner-closeout.v1",
        receiptLabel: "Buyer value owner closeout",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-buyer-evidence-value-owner-closeout/verify",
        nativeSkill: "quick-buyer-evidence-value-owner-closeout.receipt.verify"
      }
    });
  });
});
