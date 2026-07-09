import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario, normalizeBuyerValueScenarioInput } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";

describe("buyer value scenario", () => {
  test("turns selected agents and buyer assumptions into an adoption case", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist"], 140);
    const scenario = buildBuyerValueScenario(recommendation, {
      teamSize: 8,
      hourlyCostYen: 12000,
      cyclesPerMonth: 5,
      manualHoursPerCycle: 28,
      adoptionRatePercent: 75,
      incidentRiskYenPerMonth: 240000
    });

    expect(scenario.readiness).toBe("scales-now");
    expect(scenario.scenarioScore).toBeGreaterThanOrEqual(78);
    expect(scenario.monthlyGrossValueYen).toBeGreaterThan(scenario.pilotInvestmentYen);
    expect(scenario.paybackDays).toBeLessThanOrEqual(30);
    expect(scenario.metrics.map((metric) => metric.id)).toEqual(["automation", "labor-value", "risk-value", "confidence"]);
    expect(scenario.nextActions[0]).toMatchObject({
      owner: "Cloud Run SRE",
      priority: "next"
    });
    expect(scenario.exportMarkdown).toContain("## Scenario result");
  });

  test("flags low adoption and weak economics as not ready for rollout", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["brief-cartographer"], 140);
    const scenario = buildBuyerValueScenario(recommendation, {
      teamSize: 2,
      hourlyCostYen: 3500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 5,
      adoptionRatePercent: 15,
      incidentRiskYenPerMonth: 0
    });

    expect(scenario.readiness).toBe("not-yet");
    expect(scenario.paybackDays).toBeGreaterThan(90);
    expect(scenario.nextActions.map((action) => action.id)).toEqual(expect.arrayContaining(["adoption", "payback", "confidence"]));
  });

  test("normalizes unsafe scenario assumptions before persistence", () => {
    expect(
      normalizeBuyerValueScenarioInput({
        teamSize: 999,
        hourlyCostYen: -20,
        cyclesPerMonth: 0,
        manualHoursPerCycle: 999,
        adoptionRatePercent: 0,
        incidentRiskYenPerMonth: 123456789
      })
    ).toEqual({
      teamSize: 200,
      hourlyCostYen: 1000,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 120,
      adoptionRatePercent: 5,
      incidentRiskYenPerMonth: 10000000
    });
  });
});
