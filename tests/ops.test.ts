import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildOpsDrill } from "../src/ops";
import { buildWinningStrategy } from "../src/strategy";

describe("Cloud Run operations drill", () => {
  test("keeps the public demo serving when only watch signals remain", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const drill = buildOpsDrill(recommendation, strategy);

    expect(drill.incidentTitle).toContain("Cloud Run");
    expect(drill.severity).toBe("watch");
    expect(drill.rollbackRecommended).toBe(false);
    expect(drill.readinessScore).toBeGreaterThanOrEqual(70);
    expect(drill.signals.map((signal) => signal.id)).toEqual(
      expect.arrayContaining(["healthz", "latency", "errors", "gemini-fallback", "budget", "submission-urls"])
    );
    expect(drill.decisions.map((decision) => decision.id)).toEqual(expect.arrayContaining(["release-gate", "rebuy-loop", "judge-proof"]));
    expect(drill.steps.map((step) => step.phase)).toEqual(["observe", "triage", "mitigate", "verify", "rebuy"]);
    expect(drill.runbookCommands.join("\n")).toContain("/api/ops-drill");
    expect(drill.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "ops.drill",
      rollbackRecommended: false
    });
    expect(drill.nextOpsAgent?.id).toBe("observability-oracle");
  });

  test("recommends rollback when runtime signals cross failure thresholds", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const drill = buildOpsDrill(recommendation, strategy, {
      healthOk: false,
      latencyP95Ms: 1600,
      errorRatePercent: 9.4,
      budgetBurnPercent: 98
    });

    expect(drill.severity).toBe("critical");
    expect(drill.rollbackRecommended).toBe(true);
    expect(drill.signals.filter((signal) => signal.status === "fail").length).toBeGreaterThanOrEqual(3);
    expect(drill.decisions.find((decision) => decision.id === "release-gate")?.decision).toContain("Rollback");
    expect(drill.runbookCommands.at(-1)).toContain("--to-revisions");
  });
});
