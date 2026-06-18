import { describe, expect, test } from "vitest";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildSquadOptimizer } from "../src/squadOptimizer";

describe("squad optimizer", () => {
  test("keeps the current squad when it is the best 140-budget option but exposes the funding gap", () => {
    const optimizer = buildSquadOptimizer({
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
      budget: 140,
      maxSquadSize: 4
    });

    expect(optimizer.readiness).toBe("needs-more-budget");
    expect(optimizer.current.agentIds).toEqual(["market-broker", "cloud-run-sre", "gemini-strategist"]);
    expect(optimizer.recommended.agentIds).toEqual(["market-broker", "cloud-run-sre", "gemini-strategist"]);
    expect(optimizer.recommended.totalPrice).toBeLessThanOrEqual(140);
    expect(optimizer.recommended.coverageScore).toBe(80);
    expect(optimizer.stretch?.agentIds).toEqual(["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster"]);
    expect(optimizer.budgetGap).toBe(22);
    expect(optimizer.swapPlan.some((step) => step.action === "fund")).toBe(true);
    expect(optimizer.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "squad.optimize",
      readiness: "needs-more-budget"
    });
  });

  test("recommends swapping when the selected squad misses mandatory story coverage", () => {
    const optimizer = buildSquadOptimizer({
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds: ["cloud-run-sre"],
      budget: 140,
      maxSquadSize: 4
    });

    expect(optimizer.readiness).toBe("worth-swapping");
    expect(optimizer.delta.totalScore).toBeGreaterThanOrEqual(3);
    expect(optimizer.recommended.agentIds).toEqual(["market-broker", "cloud-run-sre", "gemini-strategist"]);
    expect(optimizer.swapPlan.map((step) => step.action)).toEqual(expect.arrayContaining(["keep", "add"]));
    expect(optimizer.alternatives.length).toBeGreaterThanOrEqual(3);
  });

  test("unlocks full story coverage when the budget can afford the UX owner", () => {
    const optimizer = buildSquadOptimizer({
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
      budget: 162,
      maxSquadSize: 4
    });

    expect(optimizer.readiness).toBe("worth-swapping");
    expect(optimizer.recommended.agentIds).toEqual(["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster"]);
    expect(optimizer.recommended.coverageScore).toBe(100);
    expect(optimizer.recommended.totalPrice).toBe(162);
    expect(optimizer.delta.coverageScore).toBe(20);
    expect(optimizer.delta.usability).toBeGreaterThan(0);
  });
});
