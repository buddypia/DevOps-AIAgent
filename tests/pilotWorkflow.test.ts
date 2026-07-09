import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotWorkflowPlan, renderPilotWorkflowHtml } from "../src/pilotWorkflow";
import { buildValueBlueprint } from "../src/valueBlueprint";

describe("pilot workflow plan", () => {
  test("turns a strong buyer case into a run-ready first workflow", () => {
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
    const plan = buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario });

    expect(plan.readiness).toBe("ready-to-run");
    expect(plan.workflowScore).toBeGreaterThanOrEqual(80);
    expect(plan.workflowName).toContain("Cloud Run");
    expect(plan.manualMinutesPerRun).toBe(1680);
    expect(plan.assistedMinutesPerRun).toBeLessThan(plan.manualMinutesPerRun);
    expect(plan.steps.map((step) => step.id)).toEqual(["intake", "delegate", "assemble", "decide"]);
    expect(plan.steps.find((step) => step.id === "delegate")?.acceptance).toContain("A2A");
    expect(plan.checkpoints.every((checkpoint) => checkpoint.status === "clear")).toBe(true);
    expect(plan.exportMarkdown).toContain("## Handoff script");
  });

  test("blocks the workflow when economics and user scope are not ready", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["brief-cartographer"], 140);
    const valueBlueprint = buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF);
    const buyerScenario = buildBuyerValueScenario(recommendation, {
      teamSize: 1,
      hourlyCostYen: 3500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 5,
      adoptionRatePercent: 15,
      incidentRiskYenPerMonth: 0
    });
    const plan = buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario });

    expect(plan.readiness).toBe("blocked");
    expect(plan.checkpoints.map((checkpoint) => checkpoint.id)).toEqual(["real-user", "value-threshold", "proof-contract", "ops-owner"]);
    expect(plan.checkpoints.some((checkpoint) => checkpoint.status === "blocked")).toBe(true);
    expect(plan.handoffScript.join(" ")).toContain("Stop if");
    expect(plan.exportMarkdown).toContain("[blocked]");
  });

  test("renders a shareable escaped public workflow page", () => {
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
    const plan = buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario });
    const html = renderPilotWorkflowHtml(
      {
        ...plan,
        workflowName: "Workflow <script>alert(1)</script>",
        trigger: "Start <script>alert(2)</script>"
      },
      {
        proposalUrl: "https://example.com/buyer-proposal",
        diligenceUrl: "https://example.com/buyer-diligence",
        executionUrl: "https://example.com/pilot-execution",
        jsonUrl: "https://example.com/api/pilot-workflow",
        markdownUrl: "https://example.com/pilot-workflow.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Pilot Workflow");
    expect(html).toContain("Run Sequence");
    expect(html).toContain("https://example.com/api/pilot-workflow");
    expect(html).toContain("https://example.com/pilot-workflow.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<script>alert(2)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
