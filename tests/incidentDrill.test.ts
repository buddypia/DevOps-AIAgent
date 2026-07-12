import { describe, expect, it } from "vitest";

import { INCIDENT_DRILL_SCENARIOS, toIncidentDrillScenarioView } from "../server/incidentDrill.js";

describe("incident drill scenarios", () => {
  it("should explain the baseline, observable change, and next verification", () => {
    const view = toIncidentDrillScenarioView(INCIDENT_DRILL_SCENARIOS[0]);

    expect(view.baseline).toBeTruthy();
    expect(view.observableChange).toBeTruthy();
    expect(view.expectedDetection).toBeTruthy();
    expect(view.signals).toHaveLength(2);
  });

  it("should preserve the two synthetic signals that the drill writes", () => {
    const view = toIncidentDrillScenarioView(INCIDENT_DRILL_SCENARIOS[1]);

    expect(view.signals.map((signal) => signal.message)).toEqual([
      INCIDENT_DRILL_SCENARIOS[1].primaryMessage,
      INCIDENT_DRILL_SCENARIOS[1].secondaryMessage
    ]);
    expect(view.signals.map((signal) => signal.severity)).toEqual([
      INCIDENT_DRILL_SCENARIOS[1].primarySeverity,
      INCIDENT_DRILL_SCENARIOS[1].secondarySeverity
    ]);
  });
});
