import { describe, expect, it } from "vitest";
import {
  BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH,
  verifyBuyerDecisionFollowUpReceiptRequest
} from "../server/buyerDecisionFollowUpReceiptVerifier";
import { buyerDecisionFollowUpReceiptChecksum, buildBuyerDecisionFollowUpLedger } from "../src/buyerDecisionFollowUp";
import { buildBuyerDecisionAgendaSnapshot, type BuyerDecisionAgendaBuildInput } from "../src/buyerDecisionAgenda";

function readyInput(): BuyerDecisionAgendaBuildInput {
  const action = { label: "Open launch room", href: "/launch-room", external: false };

  return {
    proofChain: {
      status: "ready",
      verdict: "send",
      score: 96,
      primaryAction: action
    },
    publicDecisionPath: {
      status: "ready",
      decision: "send-to-buyer",
      headline: "Public buyer path is ready",
      buyerLine: "Platform lead can approve the first workflow pilot.",
      firstAction: action,
      guardrails: ["Do not send if public proof is blocked.", "Do not expand without a measured run."]
    },
    pilotContract: {
      status: "ready",
      buyer: "Platform lead",
      pilotOffer: "30-day release-readiness pilot",
      firstCommitmentYen: 900000,
      expectedMonthlyValueYen: 2400000,
      paybackDays: 12,
      proofLine: "Live proof, receipt, and trust manifest are attached.",
      stopRule: "Stop if measured acceptance falls below 70%.",
      firstAction: action,
      sendNote: {
        status: "ready",
        subject: "Approve 30-day release-readiness pilot",
        instruction: "Send with proof attached.",
        body: ["Please review the attached proof room."]
      }
    },
    trustSnapshot: {
      status: "ready",
      trustScore: 100,
      headline: "Buyer trust is ready for external review",
      dataBoundary: "Public or synthetic data only",
      firstAction: { label: "Open trust manifest", href: "/buyer-trust-manifest", external: false }
    },
    commercialOffer: {
      status: "ready",
      recommendedTier: "Pilot",
      firstCommitmentYen: 900000,
      expectedMonthlyValueYen: 2400000,
      paybackDays: 12,
      contractLine: "Pilot tier at 900,000 yen with measured acceptance.",
      firstAction: action
    }
  };
}

function sampleReceipt() {
  return buildBuyerDecisionFollowUpLedger(buildBuyerDecisionAgendaSnapshot(readyInput())).receipt;
}

describe("buyer decision follow-up receipt verifier", () => {
  it("uses the public follow-up receipt verification API path", () => {
    expect(BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH).toBe("/api/buyer-decision-follow-up/receipt/verify");
    expect(sampleReceipt().verificationApiPath).toBe(BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH);
  });

  it("verifies an untampered follow-up receipt payload", () => {
    const receipt = sampleReceipt();

    const result = verifyBuyerDecisionFollowUpReceiptRequest({
      checksum: receipt.checksum,
      payload: receipt.payload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "buyer-decision-follow-up.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: receipt.checksum,
        actualChecksum: receipt.checksum
      },
      receipt: {
        receiptVersion: "buyer-decision-follow-up.v1",
        ledgerId: receipt.payload.ledgerId,
        status: "ready",
        mode: "buyer-send",
        readyCount: 4,
        csvLedger: {
          filename: "buyer-decision-follow-up-ledger.csv",
          rowCount: 4
        }
      }
    });
  });

  it("accepts long encoded artifact links in follow-up receipt rows", () => {
    const receipt = sampleReceipt();
    const longHref = `/buyer-decision-follow-up?brief=${"buyer-owner-task-proof-".repeat(180)}`;
    const payload = {
      ...receipt.payload,
      firstActionHref: longHref,
      tasks: receipt.payload.tasks.map((task, index) => (index === 0 ? { ...task, href: longHref } : task))
    };

    const result = verifyBuyerDecisionFollowUpReceiptRequest({
      checksum: buyerDecisionFollowUpReceiptChecksum(payload),
      payload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      verification: {
        status: "verified"
      }
    });
  });

  it("returns 422 when a follow-up receipt payload is changed after export", () => {
    const receipt = sampleReceipt();

    const result = verifyBuyerDecisionFollowUpReceiptRequest({
      checksum: receipt.checksum,
      payload: {
        ...receipt.payload,
        readyCount: receipt.payload.readyCount - 1
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

  it("rejects malformed follow-up receipt verification requests", () => {
    const result = verifyBuyerDecisionFollowUpReceiptRequest({
      checksum: "not-a-checksum",
      payload: {}
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
