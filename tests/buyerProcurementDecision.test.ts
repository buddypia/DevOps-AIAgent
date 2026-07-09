import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerProcurementDecision, renderBuyerProcurementDecisionHtml } from "../src/buyerProcurementDecision";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildValueBlueprint } from "../src/valueBlueprint";

function buildDecision(overrides: { weak?: boolean; restricted?: boolean; missingProof?: boolean; placeholderProof?: boolean } = {}) {
  const projectBrief = overrides.weak
    ? "Small AI helper demo for an unclear internal task."
    : `${DEFAULT_PROJECT_BRIEF}\nA global platform buyer wants an A2A squad to convert release-readiness work into a proof-backed procurement decision.`;
  const recommendation = overrides.weak
    ? recommendSquad(projectBrief, ["brief-cartographer"], 140)
    : recommendSquad(projectBrief, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
  const valueBlueprint = buildValueBlueprint(recommendation, projectBrief, "https://app.example.com");
  const buyerScenario = buildBuyerValueScenario(
    recommendation,
    overrides.weak
      ? {
          teamSize: 2,
          hourlyCostYen: 3500,
          cyclesPerMonth: 1,
          manualHoursPerCycle: 4,
          adoptionRatePercent: 15,
          incidentRiskYenPerMonth: 0
        }
      : {
          teamSize: 8,
          hourlyCostYen: 12000,
          cyclesPerMonth: 5,
          manualHoursPerCycle: 28,
          adoptionRatePercent: 75,
          incidentRiskYenPerMonth: 240000
        }
  );
  const evidenceUrl = overrides.missingProof
    ? ""
    : overrides.placeholderProof
      ? "https://proof.your-company.com/receipts/pilot"
      : "https://storage.googleapis.com/a2a-agent-marketplace-proof/procurement/pilot-receipt";

  return buildBuyerProcurementDecision({
    recommendation,
    valueBlueprint,
    buyerScenario,
    buyerWorkOrder: {
      request: "Convert our weekly release-readiness review into a public buyer proof packet with named owners, launch evidence, A2A receipt, and a continue or stop decision.",
      targetUser: "Platform sponsor",
      successMetric: "Close four proof gaps and save at least eight hours per release review",
      currentBaseline: "Release evidence is collected manually from scattered docs, CI runs, and review notes",
      dataSensitivity: overrides.restricted ? "restricted" : "public",
      evidenceUrl
    },
    pilotRun: {
      observedManualMinutes: overrides.weak ? 60 : 1680,
      observedAssistedMinutes: overrides.weak ? 58 : 420,
      participants: overrides.weak ? 1 : 4,
      acceptedTasks: overrides.weak ? 1 : 4,
      totalTasks: 4,
      reviewerName: overrides.missingProof ? "" : "Platform sponsor",
      evidenceUrl,
      notes: "Observed in the launch review pilot."
    }
  });
}

describe("buyer procurement decision", () => {
  test("approves a proof-backed A2A pilot when economics, scope, and receipt are clear", () => {
    const decision = buildDecision();

    expect(decision.readiness).toBe("buy-now");
    expect(decision.score).toBeGreaterThanOrEqual(80);
    expect(decision.winnerLabel).toBe("A2A agent squad");
    expect(decision.checks.every((check) => check.status === "clear")).toBe(true);
    expect(decision.approvalLadder.map((lane) => lane.id)).toEqual(["a2a-winner", "adoption-floor", "measured-run", "data-boundary", "public-proof"]);
    expect(decision.approvalLadder.every((lane) => lane.status === "clear")).toBe(true);
    expect(decision.approvalLadder.find((lane) => lane.id === "measured-run")).toMatchObject({
      target: expect.stringContaining("70% accepted")
    });
    expect(decision.mutualActionPlan).toMatchObject({
      readiness: "send-offer",
      daysToDecision: 3,
      decisionGate: "D+3 paid proof-pilot decision"
    });
    expect(decision.mutualActionPlan.steps).toHaveLength(5);
    expect(decision.mutualActionPlan.steps.every((step) => step.status === "clear")).toBe(true);
    expect(decision.mutualActionPlan.exportCsv).toContain('"Buyer owner","A2A owner"');
    expect(decision.decisionContract).toMatchObject({
      readiness: "ready-to-sign",
      clearClauseCount: 4,
      clauseCount: 4,
      decisionGate: "D+3 paid proof-pilot decision"
    });
    expect(decision.decisionContract.approvalAsk).toContain("Approve a");
    expect(decision.decisionContract.clauses.map((clause) => clause.id)).toEqual(["economic-floor", "public-proof", "mutual-owners", "stop-boundary"]);
    expect(decision.decisionContract.clauses.every((clause) => clause.status === "clear")).toBe(true);
    expect(decision.decisionContract.exportMarkdown).toContain("## Clauses");
    expect(decision.decisionContract.exportMarkdown).toContain("## Stop rules");
    expect(decision.approvalMemo).toMatchObject({
      readiness: "approve",
      headline: "Approval memo is ready for sponsor review",
      decisionGate: "D+3 paid proof-pilot decision"
    });
    expect(decision.approvalMemo.recommendation).toContain("Approve the");
    expect(decision.approvalMemo.sections.map((section) => section.id)).toEqual(["recommendation", "economics", "proof", "risk", "next-meeting"]);
    expect(decision.approvalMemo.sections.every((section) => section.status === "clear")).toBe(true);
    expect(decision.approvalMemo.exportMarkdown).toContain("# Approval memo is ready for sponsor review");
    expect(decision.approvalMemo.exportMarkdown).toContain("## Sponsor memo sections");
    expect(decision.approvalMemo.exportMarkdown).not.toContain("..");
    expect(decision.buyabilityLevers).toHaveLength(3);
    expect(decision.buyabilityLevers.every((lever) => lever.priority === "sealed")).toBe(true);
    expect(decision.actions[0]).toMatchObject({
      id: "send-proof-pilot-offer",
      href: "#commercial-offer",
      priority: "next"
    });
    expect(decision.exportMarkdown).toContain("## Buying numbers");
    expect(decision.exportMarkdown).toContain("## Mutual action plan");
    expect(decision.exportMarkdown).toContain("## Decision contract");
    expect(decision.exportMarkdown).toContain("## Approval memo");
    expect(decision.exportMarkdown).toContain("## Buyability levers");
    expect(decision.exportMarkdown).toContain("A2A agent squad");
  });

  test("keeps A2A in a proof-pilot lane when public receipt evidence is missing", () => {
    const decision = buildDecision({ missingProof: true });

    expect(decision.readiness).toBe("pilot-first");
    expect(decision.evidenceGapCount).toBeGreaterThan(0);
    expect(decision.checks.find((check) => check.id === "public-proof")).toMatchObject({
      status: "watch"
    });
    expect(decision.approvalLadder.find((lane) => lane.id === "public-proof")).toMatchObject({
      status: "watch",
      delta: "Attach an HTTPS proof URL and run live verification."
    });
    expect(decision.approvalLadder.find((lane) => lane.id === "measured-run")).toMatchObject({
      status: "clear"
    });
    expect(decision.mutualActionPlan).toMatchObject({
      readiness: "close-gaps",
      decisionGate: "D+8 proof-gap review"
    });
    expect(decision.mutualActionPlan.steps.find((step) => step.id === "map-public-proof")).toMatchObject({
      status: "watch",
      priority: "next",
      buyerOwner: expect.any(String),
      a2aOwner: expect.any(String)
    });
    expect(decision.decisionContract).toMatchObject({
      readiness: "needs-redlines",
      clearClauseCount: 2,
      clauseCount: 4
    });
    expect(decision.decisionContract.clauses.find((clause) => clause.id === "public-proof")).toMatchObject({
      status: "watch",
      failureRule: "If the buyer cannot open the proof room live, hold the offer and fix the proof link first."
    });
    expect(decision.decisionContract.clauses.find((clause) => clause.id === "mutual-owners")).toMatchObject({
      status: "watch",
      evidence: "4/5 action-plan steps clear."
    });
    expect(decision.approvalMemo).toMatchObject({
      readiness: "approve-after-gaps",
      headline: "Approval memo needs proof-gap closure first"
    });
    expect(decision.approvalMemo.recommendation).toContain("Approve only after");
    expect(decision.approvalMemo.proofLine).toContain("proof gap");
    expect(decision.approvalMemo.sections.find((section) => section.id === "proof")).toMatchObject({
      status: "watch"
    });
    expect(decision.buyabilityLevers).toEqual([
      expect.objectContaining({
        id: "public-proof",
        priority: "next",
        headline: "Close proof must open outside the workspace with evidence",
        applyLabel: undefined
      })
    ]);
    expect(decision.actions.map((action) => action.href)).toContain("#buyer-proof-intake");
  });

  test("keeps procurement in proof-gap review when the receipt URL is a placeholder host", () => {
    const decision = buildDecision({ placeholderProof: true });

    expect(decision.readiness).toBe("pilot-first");
    expect(decision.checks.find((check) => check.id === "public-proof")).toMatchObject({
      status: "watch",
      evidence: "Replace the placeholder proof host with a real public artifact URL.",
      action: expect.stringContaining("Replace the placeholder proof host")
    });
    expect(decision.approvalLadder.find((lane) => lane.id === "public-proof")).toMatchObject({
      status: "watch"
    });
    expect(decision.approvalMemo.proofLine).toContain("proof gap");
    expect(decision.buyabilityLevers).toEqual([
      expect.objectContaining({
        id: "public-proof",
        priority: "next"
      })
    ]);
  });

  test("holds procurement when data boundary or value proof is unsafe", () => {
    const decision = buildDecision({ restricted: true });

    expect(decision.readiness).toBe("hold");
    expect(decision.checks.find((check) => check.id === "data-boundary")).toMatchObject({
      status: "blocked"
    });
    expect(decision.approvalLadder.find((lane) => lane.id === "data-boundary")).toMatchObject({
      status: "blocked",
      delta: expect.stringContaining("synthetic")
    });
    expect(decision.mutualActionPlan).toMatchObject({
      readiness: "re-scope",
      daysToDecision: 14
    });
    expect(decision.mutualActionPlan.steps.find((step) => step.id === "map-data-boundary")).toMatchObject({
      priority: "now",
      due: "D+0",
      commitment: expect.stringContaining("data boundary")
    });
    expect(decision.decisionContract).toMatchObject({
      readiness: "blocked"
    });
    expect(decision.decisionContract.clauses.find((clause) => clause.id === "stop-boundary")).toMatchObject({
      status: "blocked",
      buyerCommitment: expect.stringContaining("restricted data boundary")
    });
    expect(decision.approvalMemo).toMatchObject({
      readiness: "do-not-approve",
      headline: "Approval memo recommends holding spend"
    });
    expect(decision.approvalMemo.recommendation).toContain("Do not approve spend");
    expect(decision.approvalMemo.sections.find((section) => section.id === "risk")).toMatchObject({
      status: "blocked"
    });
    expect(decision.buyabilityLevers.find((lever) => lever.id === "data-boundary")).toMatchObject({
      priority: "now",
      applyLabel: "Use public-safe data",
      patch: {
        buyerWorkOrder: {
          dataSensitivity: "public"
        }
      }
    });
    expect(decision.hardTruth).toContain("Tighten scope, economics, data boundary, or measured proof");
  });

  test("does not recommend purchase for a weak workflow even if the UI can still render actions", () => {
    const decision = buildDecision({ weak: true, missingProof: true });

    expect(decision.readiness).toBe("hold");
    expect(decision.checks.some((check) => check.status === "blocked")).toBe(true);
    expect(decision.approvalLadder.find((lane) => lane.id === "adoption-floor")).toMatchObject({
      status: "blocked"
    });
    expect(decision.approvalLadder.find((lane) => lane.id === "measured-run")).toMatchObject({
      status: "blocked"
    });
    expect(decision.actions[0]?.priority).toBe("now");
    expect(decision.exportMarkdown).toContain("## Alternatives");
    expect(decision.exportMarkdown).toContain("## Approval ladder");
    expect(decision.exportMarkdown).toContain("## Decision contract");
    expect(decision.buyabilityLevers.find((lever) => lever.id === "adoption-floor")?.patch?.buyerScenario?.adoptionRatePercent).toBeGreaterThan(15);
    expect(decision.buyabilityLevers.find((lever) => lever.id === "measured-run")?.patch?.pilotRun).toMatchObject({
      participants: 3,
      acceptedTasks: 3
    });
    expect(decision.mutualActionPlan.exportMarkdown).toContain("## Steps");
    expect(decision.decisionContract.stopRules).toHaveLength(3);
  });

  test("renders an escaped public procurement proof page with linked artifacts", () => {
    const decision = buildDecision();
    const html = renderBuyerProcurementDecisionHtml(
      {
        ...decision,
        headline: "Proof <script>alert(1)</script>",
        hardTruth: "Decision <script>alert(2)</script>",
        mutualActionPlan: {
          ...decision.mutualActionPlan,
          summary: "Plan <script>alert(3)</script>"
        },
        decisionContract: {
          ...decision.decisionContract,
          summary: "Contract <script>alert(4)</script>",
          approvalAsk: "Ask <script>alert(5)</script>"
        }
      },
      {
        valueReportUrl: "https://example.com/buyer-value",
        workOrderUrl: "https://example.com/work-order-brief",
        pilotReceiptUrl: "https://example.com/pilot-run-receipt",
        decisionMatrixUrl: "https://example.com/buyer-decision",
        commercialOfferUrl: "https://example.com/commercial-offer",
        jsonUrl: "https://example.com/api/procurement-decision",
        markdownUrl: "https://example.com/procurement-decision.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Procurement Decision Proof");
    expect(html).toContain("Approval checks");
    expect(html).toContain("Approval ladder");
    expect(html).toContain("Mutual action plan");
    expect(html).toContain("Decision contract");
    expect(html).toContain("Approval memo");
    expect(html).toContain("Buyability levers");
    expect(html).toContain("Approval memo is ready for sponsor review");
    expect(html).toContain("Recommended decision");
    expect(html).toContain("D+3 paid proof-pilot decision");
    expect(html).toContain("A2A must beat the buying table");
    expect(html).toContain("Keep a2a must beat the buying table sealed");
    expect(html).toContain("Economic floor");
    expect(html).toContain("Buying table");
    expect(html).toContain("https://example.com/api/procurement-decision");
    expect(html).toContain("https://example.com/procurement-decision.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<script>alert(2)</script>");
    expect(html).not.toContain("<script>alert(3)</script>");
    expect(html).not.toContain("<script>alert(4)</script>");
    expect(html).not.toContain("<script>alert(5)</script>");
    expect(html).toContain("Proof &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("Plan &lt;script&gt;alert(3)&lt;/script&gt;");
    expect(html).toContain("Contract &lt;script&gt;alert(4)&lt;/script&gt;");
    expect(html).toContain("Ask &lt;script&gt;alert(5)&lt;/script&gt;");
  });
});
