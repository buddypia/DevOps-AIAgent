import { describe, expect, test } from "vitest";
import type { HeroBuyerDecisionBrief } from "../src/HeroBuyerDecisionBrief";
import type { BuyerValueSensitivity } from "../src/buyerValueSensitivity";
import {
  HERO_OUTCOME_REPLAY_RECEIPT_VERIFY_PATH,
  buildHeroOutcomeReplayReceipt,
  verifyHeroOutcomeReplayReceipt
} from "../src/heroOutcomeReplayReceipt";
import { verifyHeroOutcomeReplayReceiptRequest } from "../server/heroOutcomeReplayReceiptVerifier";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";

function brief(): HeroBuyerDecisionBrief {
  return {
    status: "blocked",
    decision: "hold",
    decisionLabel: "Hold",
    headline: "Hold external sharing: 1 buyer repair item open",
    evidence: "Attach the public proof receipt before buyer sharing.",
    buyer: "Platform release lead",
    score: 72,
    primaryAction: {
      label: "Fix public proof",
      href: "#quick-workflow-intake"
    },
    secondaryAction: {
      label: "Open proof audit",
      href: "/buyer-proof-audit"
    },
    decisionReceiptAction: {
      label: "Open decision receipt",
      href: "/buyer-decision-receipt"
    },
    metrics: [],
    outcomeReplay: [
      {
        id: "manual-work",
        label: "Manual work",
        status: "ready",
        value: "42h/month exposed",
        detail: "Platform release lead has a 12d payback pressure.",
        href: "#buyer-value-simulator"
      },
      {
        id: "agent-run",
        label: "Agent run",
        status: "ready",
        value: "180m saved/run",
        detail: "86% accepted, 620,000 yen measured.",
        href: "#pilot-run-receipt"
      },
      {
        id: "proof-packet",
        label: "Proof packet",
        status: "blocked",
        value: "3/5",
        detail: "Attach the public proof receipt before buyer sharing.",
        href: "/buyer-proof-audit"
      },
      {
        id: "buyer-decision",
        label: "Buyer decision",
        status: "blocked",
        value: "Hold / 72",
        detail: "Fix public proof before external sharing.",
        href: "#quick-workflow-intake"
      }
    ],
    buyerQuestions: [
      {
        id: "proof-access",
        question: "Can the reviewer open proof?",
        answer: "Not yet. Attach the public proof receipt before buyer sharing.",
        status: "blocked",
        href: "/buyer-proof-audit",
        evidence: "3/5 public proof links are ready."
      },
      {
        id: "next-decision",
        question: "What should happen next?",
        answer: "Keep internal until public proof is fixed.",
        status: "blocked",
        href: "#quick-workflow-intake",
        evidence: "Fix public proof before external sharing."
      }
    ],
    approvalPath: [
      {
        id: "send-room",
        label: "Send room",
        status: "blocked",
        owner: "Sponsor owner",
        href: "/launch-room",
        summary: "Final send waits for public proof."
      }
    ],
    packetReceipt: {
      receiptId: "buyer-send-hold-12345678",
      checksumAlgorithm: "fnv1a32",
      checksum: "12345678"
    },
    exportMarkdown: "# Buyer send packet"
  };
}

function sensitivity(): BuyerValueSensitivity {
  return {
    id: "buyer-value-sensitivity-fragile-64",
    verdict: "fragile",
    confidenceBand: "420,000 yen - 1,120,000 yen / month",
    breakEvenAdoptionPercent: 64,
    valueAtRiskYen: 380000,
    cases: [
      {
        id: "pessimistic",
        label: "Pessimistic",
        adoptionRatePercent: 46,
        automationRatePercent: 42,
        monthlyHoursSaved: 36,
        monthlyValueYen: 420000,
        paybackDays: 68,
        status: "watch",
        evidence: "65% of assumed adoption and 75% of modeled automation."
      },
      {
        id: "base",
        label: "Base",
        adoptionRatePercent: 70,
        automationRatePercent: 56,
        monthlyHoursSaved: 68,
        monthlyValueYen: 800000,
        paybackDays: 36,
        status: "clear",
        evidence: "Uses the current Buyer Value Simulator assumptions."
      }
    ],
    guardrails: [],
    exportMarkdown: "# Buyer value sensitivity"
  };
}

describe("hero outcome replay receipt verifier", () => {
  test("verifies a first-screen replay receipt through the native verifier and receipt desk", () => {
    const receipt = buildHeroOutcomeReplayReceipt(brief(), sensitivity());
    const request = JSON.parse(receipt.verificationRequestJson);

    expect(receipt.receiptId).toMatch(/^hero-outcome-replay-hold-[a-f0-9]{8}$/);
    expect(receipt.verificationApiPath).toBe(HERO_OUTCOME_REPLAY_RECEIPT_VERIFY_PATH);
    expect(receipt.payload.receiptVersion).toBe("hero-outcome-replay.v1");
    expect(receipt.payload.sourceReceiptId).toBe("buyer-send-hold-12345678");
    expect(receipt.payload.sensitivity.downsidePaybackDays).toBe(68);
    expect(verifyHeroOutcomeReplayReceipt({ checksum: receipt.checksum, payload: receipt.payload })).toMatchObject({
      status: "verified",
      expectedChecksum: receipt.checksum,
      actualChecksum: receipt.checksum
    });
    expect(verifyHeroOutcomeReplayReceiptRequest(request)).toMatchObject({
      statusCode: 200,
      body: {
        skill: "hero-outcome-replay.receipt.verify",
        receipt: {
          receiptVersion: "hero-outcome-replay.v1",
          source: "hero-outcome-replay",
          sourceReceiptId: "buyer-send-hold-12345678",
          decision: "hold",
          breakEvenAdoptionPercent: 64,
          firstAction: "Fix public proof"
        }
      }
    });
    expect(verifyReceiptVerificationDeskRequest(request)).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "hero-outcome-replay.v1",
        receiptLabel: "Hero outcome replay",
        sourceVerifierApiPath: HERO_OUTCOME_REPLAY_RECEIPT_VERIFY_PATH
      }
    });
  });

  test("rejects a replay receipt when the exported decision payload changes", () => {
    const receipt = buildHeroOutcomeReplayReceipt(brief(), sensitivity());
    const request = JSON.parse(receipt.verificationRequestJson);
    const tampered = {
      ...request,
      payload: {
        ...request.payload,
        score: 99
      }
    };

    expect(verifyHeroOutcomeReplayReceiptRequest(tampered)).toMatchObject({
      statusCode: 422,
      body: {
        verification: {
          status: "mismatch"
        }
      }
    });
    expect(verifyReceiptVerificationDeskRequest(tampered)).toMatchObject({
      statusCode: 422,
      body: {
        status: "mismatch",
        verified: false,
        receiptType: "hero-outcome-replay.v1"
      }
    });
  });
});
