import { describe, expect, it } from "vitest";
import { buildBuyerPilotRunCalibration } from "../src/buyerPilotRunCalibration";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { recommendSquad } from "../src/agentEngine";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";

function scenario() {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
  return buildBuyerValueScenario(recommendation, {
    teamSize: 12,
    hourlyCostYen: 12000,
    cyclesPerMonth: 6,
    manualHoursPerCycle: 32,
    adoptionRatePercent: 88,
    incidentRiskYenPerMonth: 900000
  });
}

describe("buyer pilot run calibration", () => {
  it("shows the exact savings gap against the buyer-ready receipt target", () => {
    const calibration = buildBuyerPilotRunCalibration(
      {
        observedManualMinutes: 120,
        observedAssistedMinutes: 38,
        participants: 5,
        acceptedTasks: 9,
        totalTasks: 10,
        evidenceUrl: "https://launch.example/pilot-receipt",
        reviewerName: "Pilot reviewer",
        notes: ""
      },
      scenario()
    );

    expect(calibration.readiness).toBe("needs-savings");
    expect(calibration.plannedMinutesSavedPerRun).toBe(1380);
    expect(calibration.minimumAcceptedSavingsMinutes).toBe(966);
    expect(calibration.actualMinutesSavedPerRun).toBe(82);
    expect(calibration.savingsGapMinutes).toBe(884);
    expect(calibration.checks.find((check) => check.id === "savings")).toMatchObject({
      status: "watch",
      target: "966m minimum"
    });
  });

  it("passes when savings, acceptance, public evidence, and participant scope are credible", () => {
    const calibration = buildBuyerPilotRunCalibration(
      {
        observedManualMinutes: 1680,
        observedAssistedMinutes: 520,
        participants: 5,
        acceptedTasks: 9,
        totalTasks: 10,
        evidenceUrl: "https://launch.example/pilot-receipt",
        reviewerName: "Pilot reviewer",
        notes: ""
      },
      scenario()
    );

    expect(calibration.readiness).toBe("target-met");
    expect(calibration.actualMinutesSavedPerRun).toBe(1160);
    expect(calibration.savingsGapMinutes).toBe(0);
    expect(calibration.checks.every((check) => check.status === "pass")).toBe(true);
  });

  it("keeps public evidence and participant scope explicit after savings pass", () => {
    const calibration = buildBuyerPilotRunCalibration(
      {
        observedManualMinutes: 1680,
        observedAssistedMinutes: 520,
        participants: 2,
        acceptedTasks: 9,
        totalTasks: 10,
        evidenceUrl: "",
        reviewerName: "Pilot reviewer",
        notes: ""
      },
      scenario()
    );

    expect(calibration.readiness).toBe("needs-evidence");
    expect(calibration.checks.find((check) => check.id === "evidence")).toMatchObject({
      status: "block",
      action: "Attach a public run log, recording, issue, or receipt URL."
    });
    expect(calibration.checks.find((check) => check.id === "participants")).toMatchObject({
      status: "watch",
      target: "3+ people"
    });
  });

  it("does not pass receipt evidence when the evidence URL is plain HTTP", () => {
    const calibration = buildBuyerPilotRunCalibration(
      {
        observedManualMinutes: 1680,
        observedAssistedMinutes: 520,
        participants: 5,
        acceptedTasks: 9,
        totalTasks: 10,
        evidenceUrl: "http://launch.example/pilot-receipt",
        reviewerName: "Pilot reviewer",
        notes: ""
      },
      scenario()
    );

    expect(calibration.readiness).toBe("needs-evidence");
    expect(calibration.checks.find((check) => check.id === "evidence")).toMatchObject({
      status: "block",
      value: "missing"
    });
  });
});
