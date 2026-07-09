import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import HeroOutcomeReplayStrip from "../src/HeroOutcomeReplayStrip";
import { buildHeroOutcomeReplayReceipt } from "../src/heroOutcomeReplayReceipt";
import type { HeroBuyerDecisionBrief } from "../src/HeroBuyerDecisionBrief";
import type { BuyerValueSensitivity } from "../src/buyerValueSensitivity";

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
        detail: "86% accepted, ¥620,000 measured.",
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
      },
      {
        id: "upside",
        label: "Upside",
        adoptionRatePercent: 89,
        automationRatePercent: 67,
        monthlyHoursSaved: 92,
        monthlyValueYen: 1120000,
        paybackDays: 26,
        status: "clear",
        evidence: "Assumes smoother rollout and stronger automation reuse."
      }
    ],
    guardrails: [
      {
        id: "break-even-adoption",
        label: "Break-even adoption",
        status: "clear",
        value: "64%",
        evidence: "Current assumption is 70%. The pilot needs this adoption level to pay back within 45 days."
      },
      {
        id: "downside-payback",
        label: "Downside payback",
        status: "watch",
        value: "68 days",
        evidence: "Pessimistic case reduces adoption, automation, and risk capture before the rollout ask."
      }
    ],
    exportMarkdown: "# Buyer value sensitivity"
  };
}

describe("HeroOutcomeReplayStrip", () => {
  test("renders the first-screen buyer outcome replay with copy and export controls", () => {
    const replayBrief = brief();
    const replaySensitivity = sensitivity();
    const receipt = buildHeroOutcomeReplayReceipt(replayBrief, replaySensitivity);
    const html = renderToStaticMarkup(createElement(HeroOutcomeReplayStrip, { brief: replayBrief, sensitivity: replaySensitivity, onCopyText: async () => true }));

    expect(html).toContain("Buyer outcome replay");
    expect(html).toContain("Hold send / Downside 68d / BE 64%");
    expect(html).toContain("Platform release lead approval stops at Proof packet");
    expect(html).toContain("42h/month exposed -&gt; 180m saved/run -&gt; 3/5 -&gt; Hold / 72");
    expect(html).toContain("Next gate: Can the reviewer open proof? / Final send waits for public proof.");
    expect(html).toContain("Fix public proof");
    expect(html).toContain("Copy replay");
    expect(html).toContain("Verify");
    expect(html).toContain("Desk");
    const verifierHref = html.match(/<a class="hero-outcome-replay-strip-secondary" href="([^"]+)"[^>]*>[\s\S]*?Desk/)?.[1]?.replaceAll("&amp;", "&") ?? "";
    const verifierUrl = new URL(verifierHref, "https://example.com");
    expect(verifierUrl.pathname).toBe("/receipt-verifier");
    expect(verifierUrl.searchParams.get("request")).toBe(receipt.verificationRequestJson);
    expect(verifierUrl.searchParams.get("verify")).toBe("1");
    expect(verifierUrl.searchParams.has("requestKey")).toBe(false);
    expect(html).toContain('data-download-filename="buyer-outcome-replay.md"');
    expect(html).not.toContain('href="data:text/markdown');
  });
});
