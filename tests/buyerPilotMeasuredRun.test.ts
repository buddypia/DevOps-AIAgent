import { describe, expect, it } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerPilotMeasuredRunSummary } from "../src/buyerPilotMeasuredRun";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";

const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist"], 180);
const buyerScenario = buildBuyerValueScenario(recommendation, {
  teamSize: 8,
  hourlyCostYen: 12000,
  cyclesPerMonth: 5,
  manualHoursPerCycle: 28,
  adoptionRatePercent: 80,
  incidentRiskYenPerMonth: 240000
});

describe("buyer pilot measured run summary", () => {
  it("turns a measured accepted run into citation-ready value", () => {
    const summary = buildBuyerPilotMeasuredRunSummary(
      {
        observedManualMinutes: 1680,
        observedAssistedMinutes: 560,
        participants: 4,
        acceptedTasks: 3,
        totalTasks: 3,
        reviewerName: "Platform sponsor"
      },
      buyerScenario
    );

    expect(summary.readiness).toBe("measured");
    expect(summary.actualMinutesSavedPerRun).toBe(1120);
    expect(summary.acceptanceRatePercent).toBe(100);
    expect(summary.measuredMonthlyHoursSaved).toBe(74.7);
    expect(summary.measuredMonthlyLaborValueYen).toBe(896000);
    expect(summary.measuredMonthlyValueYen).toBeGreaterThan(summary.measuredMonthlyLaborValueYen);
  });

  it("requires a named reviewer before the result is citation-ready", () => {
    const summary = buildBuyerPilotMeasuredRunSummary(
      {
        observedManualMinutes: 1680,
        observedAssistedMinutes: 560,
        acceptedTasks: 3,
        totalTasks: 3,
        reviewerName: ""
      },
      buyerScenario
    );

    expect(summary.readiness).toBe("needs-reviewer");
    expect(summary.headline).toContain("reviewer");
  });

  it("flags weak acceptance before reviewer polish", () => {
    const summary = buildBuyerPilotMeasuredRunSummary(
      {
        observedManualMinutes: 1680,
        observedAssistedMinutes: 560,
        acceptedTasks: 1,
        totalTasks: 3,
        reviewerName: "Platform sponsor"
      },
      buyerScenario
    );

    expect(summary.readiness).toBe("needs-acceptance");
  });

  it("blocks measured value when the assisted run saves no time", () => {
    const summary = buildBuyerPilotMeasuredRunSummary(
      {
        observedManualMinutes: 80,
        observedAssistedMinutes: 90,
        acceptedTasks: 3,
        totalTasks: 3,
        reviewerName: "Platform sponsor"
      },
      buyerScenario
    );

    expect(summary.readiness).toBe("needs-savings");
    expect(summary.actualMinutesSavedPerRun).toBe(0);
  });
});
