import { describe, expect, test } from "vitest";
import { buildBuyerDecisionAgendaSnapshot, type BuyerDecisionAgendaBuildInput } from "../src/buyerDecisionAgenda";
import {
  BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH,
  buyerDecisionFollowUpReceiptChecksum,
  buildBuyerDecisionFollowUpLedger,
  renderBuyerDecisionFollowUpHtml,
  verifyBuyerDecisionFollowUpReceipt
} from "../src/buyerDecisionFollowUp";

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

function ledgerFrom(input: BuyerDecisionAgendaBuildInput) {
  return buildBuyerDecisionFollowUpLedger(buildBuyerDecisionAgendaSnapshot(input));
}

describe("buildBuyerDecisionFollowUpLedger", () => {
  test("turns a ready buyer agenda into owner due-window follow-up tasks", () => {
    const ledger = ledgerFrom(readyInput());

    expect(ledger.status).toBe("ready");
    expect(ledger.mode).toBe("buyer-send");
    expect(ledger.readyCount).toBe(4);
    expect(ledger.taskTotal).toBe(4);
    expect(ledger.firstAction).toMatchObject({ label: "Open buyer decision room", href: "/launch-room" });
    expect(ledger.tasks.every((task) => task.dueLabel === "Meeting day")).toBe(true);
    expect(ledger.csv).toContain("closeCondition");
    expect(ledger.receipt.verificationApiPath).toBe(BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH);
    expect(ledger.receipt.checksum).toMatch(/^[a-f0-9]{16}$/);
    expect(ledger.receipt.payload.csvLedger.rowCount).toBe(4);
    expect(ledger.receipt.verification).toMatchObject({
      status: "verified",
      actualChecksum: ledger.receipt.checksum
    });
    expect(ledger.exportMarkdown).toContain("## Follow-up tasks");
    expect(ledger.exportMarkdown).toContain("## Verification receipt");
    expect(ledger.exportMarkdown).toContain("## Receipt API verification");
    expect(ledger.exportMarkdown).toContain("## CSV ledger");
    expect(JSON.stringify(ledger)).not.toMatch(/demo/i);
  });

  test("detects changed follow-up receipt payloads", () => {
    const ledger = ledgerFrom(readyInput());

    expect(buyerDecisionFollowUpReceiptChecksum(ledger.receipt.payload)).toBe(ledger.receipt.checksum);
    const result = verifyBuyerDecisionFollowUpReceipt({
      checksum: ledger.receipt.checksum,
      payload: {
        ...ledger.receipt.payload,
        blockedCount: ledger.receipt.payload.blockedCount + 1
      }
    });

    expect(result).toMatchObject({
      status: "mismatch",
      expectedChecksum: ledger.receipt.checksum
    });
  });

  test("keeps blocked proof and trust work internal until the close condition is met", () => {
    const input = readyInput();
    const ledger = ledgerFrom({
      ...input,
      proofChain: {
        ...input.proofChain,
        status: "blocked",
        score: 48,
        primaryAction: { label: "Fix proof audit", href: "/buyer-proof-audit", external: false }
      },
      trustSnapshot: {
        ...input.trustSnapshot,
        status: "blocked",
        trustScore: 52,
        headline: "Trust blocks external buyer rollout",
        firstAction: { label: "Fix trust boundary", href: "/buyer-trust-manifest", external: false }
      }
    });

    expect(ledger.status).toBe("blocked");
    expect(ledger.mode).toBe("blocker-closure");
    expect(ledger.blockedCount).toBe(1);
    expect(ledger.firstDueLabel).toBe("Before external send");
    expect(ledger.firstAction).toMatchObject({ label: "Fix Proof and trust", href: "/buyer-trust-manifest" });
    expect(ledger.tasks.find((task) => task.id === "proof-trust")).toMatchObject({
      status: "blocked",
      closeCondition: expect.stringContaining("safe for an external buyer")
    });
    expect(ledger.escalationRules).toContain("Do not send the buyer room while 1 follow-up task remains open.");
  });

  test("uses sponsor-review mode when an agenda row needs attention", () => {
    const input = readyInput();
    const ledger = ledgerFrom({
      ...input,
      commercialOffer: {
        ...input.commercialOffer,
        status: "attention",
        firstAction: { label: "Review commercial terms", href: "/commercial-offer", external: false }
      }
    });

    expect(ledger.status).toBe("attention");
    expect(ledger.mode).toBe("sponsor-review");
    expect(ledger.attentionCount).toBe(1);
    expect(ledger.firstAction).toMatchObject({ label: "Review Commercial boundary", href: "/commercial-offer" });
    expect(ledger.tasks.find((task) => task.id === "commercial-boundary")).toMatchObject({
      dueLabel: "+2 business days",
      nextStep: expect.stringContaining("Lock the pilot tier")
    });
  });

  test("renders public follow-up HTML with escaped buyer-controlled text and artifact links", () => {
    const input = readyInput();
    const ledger = ledgerFrom({
      ...input,
      pilotContract: {
        ...input.pilotContract,
        buyer: "Platform <script>alert(1)</script> Lead"
      }
    });
    const html = renderBuyerDecisionFollowUpHtml(ledger, {
      jsonUrl: "https://example.com/api/buyer-decision-follow-up?brief=custom",
      csvUrl: "https://example.com/buyer-decision-follow-up.csv?brief=custom"
    });

    expect(html).toContain("Buyer decision follow-up ledger");
    expect(html).toContain("https://example.com/api/buyer-decision-follow-up?brief=custom");
    expect(html).toContain("Verification receipt");
    expect(html).toContain("Verify receipt");
    expect(html).toContain(BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH);
    expect(html).toContain("CSV ledger");
    expect(html).toContain("Platform &lt;script&gt;alert(1)&lt;/script&gt; Lead");
    expect(html).not.toContain("Platform <script>alert(1)</script> Lead");
  });
});
