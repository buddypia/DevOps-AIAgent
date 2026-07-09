import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerValueSensitivity } from "../src/buyerValueSensitivity";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";

describe("buyer value sensitivity", () => {
  test("keeps a strong buyer case defensible under downside pressure", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist"], 140);
    const scenario = buildBuyerValueScenario(recommendation, {
      teamSize: 8,
      hourlyCostYen: 12000,
      cyclesPerMonth: 5,
      manualHoursPerCycle: 28,
      adoptionRatePercent: 75,
      incidentRiskYenPerMonth: 240000
    });
    const sensitivity = buildBuyerValueSensitivity(scenario);

    expect(sensitivity.verdict).toBe("defensible");
    expect(sensitivity.cases.map((item) => item.id)).toEqual(["pessimistic", "base", "upside"]);
    expect(sensitivity.cases[0].monthlyValueYen).toBeLessThan(sensitivity.cases[1].monthlyValueYen);
    expect(sensitivity.cases[1].monthlyValueYen).toBeLessThan(sensitivity.cases[2].monthlyValueYen);
    expect(sensitivity.breakEvenAdoptionPercent).toBeLessThanOrEqual(scenario.assumptions.adoptionRatePercent);
    expect(sensitivity.exportMarkdown).toContain("## Sensitivity cases");
  });

  test("blocks a weak buyer case when adoption cannot cover pilot payback", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["brief-cartographer"], 140);
    const scenario = buildBuyerValueScenario(recommendation, {
      teamSize: 2,
      hourlyCostYen: 3500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 5,
      adoptionRatePercent: 15,
      incidentRiskYenPerMonth: 0
    });
    const sensitivity = buildBuyerValueSensitivity(scenario);

    expect(sensitivity.verdict).toBe("not-defensible");
    expect(sensitivity.breakEvenAdoptionPercent).toBeGreaterThan(scenario.assumptions.adoptionRatePercent);
    expect(sensitivity.guardrails.some((guardrail) => guardrail.status === "blocked")).toBe(true);
    expect(sensitivity.cases[0]).toMatchObject({
      id: "pessimistic",
      status: "blocked"
    });
  });
});
