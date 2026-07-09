import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueCommitment } from "../src/buyerValueCommitment";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerValueSensitivity } from "../src/buyerValueSensitivity";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";

describe("buyer value commitment", () => {
  test("turns a defensible value case into a capped sponsor ask", () => {
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
    const commitment = buildBuyerValueCommitment({ scenario, sensitivity });

    expect(commitment.decision).toBe("send-to-sponsor");
    expect(commitment.recommendedAskYen).toBeGreaterThan(0);
    expect(commitment.recommendedAskYen).toBeLessThanOrEqual(scenario.pilotBudgetCeilingYen);
    expect(commitment.conditions.map((condition) => condition.id)).toEqual([
      "adoption-floor",
      "downside-payback",
      "evidence-confidence",
      "pilot-ask",
      "value-at-risk"
    ]);
    expect(commitment.conditions.every((condition) => condition.status !== "blocked")).toBe(true);
    expect(commitment.conditions.find((condition) => condition.id === "value-at-risk")?.status).toBe("watch");
    expect(commitment.redLines.map((redLine) => redLine.id)).toEqual(["adoption", "measured-savings", "proof"]);
    expect(commitment.exportMarkdown).toContain("## What must be true");
    expect(commitment.exportMarkdown).toContain("## Red lines");
  });

  test("blocks budget ask when assumptions are not buyer safe", () => {
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
    const commitment = buildBuyerValueCommitment({ scenario, sensitivity });

    expect(commitment.decision).toBe("hold-pitch");
    expect(commitment.recommendedAskYen).toBe(0);
    expect(commitment.askInstruction).toContain("Do not request budget");
    expect(commitment.conditions.some((condition) => condition.status === "blocked")).toBe(true);
    expect(commitment.nextProofMove.priority).toBe("now");
  });
});
