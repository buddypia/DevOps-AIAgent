import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerDecisionMatrix, renderBuyerDecisionMatrixHtml } from "../src/buyerDecisionMatrix";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotRunReceipt, type PilotRunReceiptInput } from "../src/pilotRunReceipt";
import { buildPilotWorkflowPlan } from "../src/pilotWorkflow";
import { buildValueBlueprint } from "../src/valueBlueprint";

function strongMatrixInput(pilotRun: Partial<PilotRunReceiptInput> = {
  observedManualMinutes: 1680,
  observedAssistedMinutes: 560,
  participants: 4,
  acceptedTasks: 3,
  totalTasks: 3,
  evidenceUrl: "https://proof.example.com/pilot-run/receipt.json",
  reviewerName: "Platform sponsor",
  notes: "Observed run completed with evidence attached."
}) {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
  const valueBlueprint = buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF, "https://example.com");
  const buyerScenario = buildBuyerValueScenario(recommendation, {
    teamSize: 8,
    hourlyCostYen: 12000,
    cyclesPerMonth: 5,
    manualHoursPerCycle: 28,
    adoptionRatePercent: 75,
    incidentRiskYenPerMonth: 240000
  });
  const workflow = buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun
  });
  return { recommendation, valueBlueprint, buyerScenario, pilotReceipt };
}

describe("buyer decision matrix", () => {
  test("recommends the A2A squad when the economics and first pilot receipt are strong", () => {
    const matrix = buildBuyerDecisionMatrix(strongMatrixInput());

    expect(matrix.readiness).toBe("buy-a2a");
    expect(matrix.winnerId).toBe("a2a-squad");
    expect(matrix.alternatives.map((alternative) => alternative.id)).toEqual(["a2a-squad", "generic-ai", "internal-build", "manual-process"]);
    expect(matrix.alternatives[0]).toMatchObject({
      status: "recommended",
      label: "A2A agent squad"
    });
    expect(matrix.checks.map((check) => check.id)).toEqual(["economic-winner", "proof-adjusted", "payback", "winner-gap"]);
    expect(matrix.exportMarkdown).toContain("## Alternatives");
  });

  test("compares A2A against the leading non-A2A alternative when it does not win", () => {
    const matrix = buildBuyerDecisionMatrix(strongMatrixInput({}));

    expect(matrix.winnerId).toBe("generic-ai");
    expect(matrix.checks.find((check) => check.id === "winner-gap")).toMatchObject({
      status: "blocked",
      evidence: "A2A is 8 points behind Generic AI subscription."
    });
  });

  test("does not mark A2A as a buy decision when pilot proof fails", () => {
    const recommendation = recommendSquad("Short AI demo", ["brief-cartographer"], 140);
    const valueBlueprint = buildValueBlueprint(recommendation, "Short AI demo", "https://example.com");
    const buyerScenario = buildBuyerValueScenario(recommendation, {
      teamSize: 2,
      hourlyCostYen: 3500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 5,
      adoptionRatePercent: 15,
      incidentRiskYenPerMonth: 0
    });
    const workflow = buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario });
    const pilotReceipt = buildPilotRunReceipt({
      recommendation,
      valueBlueprint,
      buyerScenario,
      workflow,
      pilotRun: {
        observedManualMinutes: 50,
        observedAssistedMinutes: 55,
        participants: 1,
        acceptedTasks: 0,
        totalTasks: 2,
        evidenceUrl: "",
        reviewerName: "",
        notes: ""
      }
    });
    const matrix = buildBuyerDecisionMatrix({ recommendation, valueBlueprint, buyerScenario, pilotReceipt });

    expect(matrix.readiness).not.toBe("buy-a2a");
    expect(matrix.checks.find((check) => check.id === "proof-adjusted")).toMatchObject({
      status: "blocked"
    });
  });

  test("renders an escaped public decision page with artifact links", () => {
    const matrix = buildBuyerDecisionMatrix(strongMatrixInput());
    const html = renderBuyerDecisionMatrixHtml(
      {
        ...matrix,
        headline: "Decision <script>alert(1)</script>"
      },
      {
        valueReportUrl: "https://example.com/buyer-value",
        pilotReceiptUrl: "https://example.com/pilot-run-receipt",
        jsonUrl: "https://example.com/api/buyer-decision",
        markdownUrl: "https://example.com/buyer-decision.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Procurement Decision Matrix");
    expect(html).toContain("https://example.com/api/buyer-decision");
    expect(html).toContain("https://example.com/buyer-decision.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Decision &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
