import { describe, expect, test } from "vitest";
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

describe("buildBuyerDecisionAgendaSnapshot", () => {
  test("turns ready proof, trust, and commercial terms into a buyer agenda", () => {
    const agenda = buildBuyerDecisionAgendaSnapshot(readyInput());

    expect(agenda.status).toBe("ready");
    expect(agenda.decisionLabel).toBe("Send to buyer");
    expect(agenda.headline).toMatch(/ready/i);
    expect(agenda.readyCount).toBe(4);
    expect(agenda.items.map((item) => item.id)).toEqual(["decision-request", "commercial-boundary", "proof-trust", "stop-rule"]);
    expect(agenda.firstAction).toMatchObject({ label: "Copy send note", href: "/launch-room" });
    expect(agenda.valueLine).toContain("2,400,000 yen");
    expect(agenda.exportMarkdown).toContain("## No-send rules");
    expect(JSON.stringify(agenda)).not.toMatch(/demo/i);
  });

  test("blocks the buyer agenda when proof and trust are not ready", () => {
    const input = readyInput();
    const agenda = buildBuyerDecisionAgendaSnapshot({
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

    expect(agenda.status).toBe("blocked");
    expect(agenda.firstAction).toMatchObject({ label: "Fix Proof and trust", href: "/buyer-trust-manifest" });
    expect(agenda.items.find((item) => item.id === "proof-trust")).toMatchObject({
      status: "blocked",
      evidence: expect.stringContaining("48/100 proof score")
    });
    expect(agenda.noSendRules).toContain("Do not send while proof chain is blocked.");
    expect(agenda.noSendRules).toContain("Do not send while trust review is blocked.");
  });
});
