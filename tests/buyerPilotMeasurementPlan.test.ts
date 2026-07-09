import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerPilotMeasurementPlan } from "../src/buyerPilotMeasurementPlan";
import { buildBuyerPilotRunCalibration } from "../src/buyerPilotRunCalibration";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";

const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist"]);
const buyerScenario = buildBuyerValueScenario(recommendation, {
  teamSize: 6,
  hourlyCostYen: 9000,
  cyclesPerMonth: 4,
  manualHoursPerCycle: 24,
  adoptionRatePercent: 70,
  incidentRiskYenPerMonth: 180000
});

describe("buyer pilot measurement plan", () => {
  test("turns a weak measured run into exact rerun targets", () => {
    const pilotRun = {
      observedManualMinutes: 90,
      observedAssistedMinutes: 55,
      participants: 2,
      acceptedTasks: 2,
      totalTasks: 4,
      evidenceUrl: "",
      reviewerName: "",
      notes: ""
    };
    const calibration = buildBuyerPilotRunCalibration(pilotRun, buyerScenario);
    const plan = buildBuyerPilotMeasurementPlan({ calibration, buyerScenario, pilotRun });

    expect(plan.status).toBe("rerun-required");
    expect(plan.headline).toContain("buyer-ready measurement");
    expect(plan.targetAssistedMinutesMax).toBe(plan.targetManualMinutes - calibration.minimumAcceptedSavingsMinutes);
    expect(plan.targets.find((target) => target.id === "savings")).toMatchObject({
      status: "watch",
      target: `${calibration.minimumAcceptedSavingsMinutes}m saved`
    });
    expect(plan.targets.find((target) => target.id === "acceptance")).toMatchObject({
      status: "watch",
      target: "3/4 accepted"
    });
    expect(plan.targets.find((target) => target.id === "evidence")).toMatchObject({
      status: "block"
    });
    expect(plan.exportMarkdown).toContain("## Run script");
    expect(plan.exportMarkdown).toContain("Stop if evidence cannot be shared publicly");
  });

  test("keeps an accepted measured run as buyer proof with a portable plan", () => {
    const pilotRun = {
      observedManualMinutes: 1440,
      observedAssistedMinutes: 400,
      participants: 4,
      acceptedTasks: 4,
      totalTasks: 4,
      evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/run-log",
      reviewerName: "Buyer Sponsor",
      notes: "Accepted by sponsor."
    };
    const calibration = buildBuyerPilotRunCalibration(pilotRun, buyerScenario);
    const plan = buildBuyerPilotMeasurementPlan({ calibration, buyerScenario, pilotRun });

    expect(calibration.readiness).toBe("target-met");
    expect(plan.status).toBe("proof-ready");
    expect(plan.targets.every((target) => target.status === "pass")).toBe(true);
    expect(plan.runScript).toHaveLength(5);
    expect(plan.evidenceChecklist).toContain("Public receipt URL that a buyer can open without internal access.");
    expect(plan.exportMarkdown).toContain("Buyer proof receipt");
  });
});
