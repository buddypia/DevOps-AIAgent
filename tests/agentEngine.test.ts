import { describe, expect, test } from "vitest";
import { createA2ATimeline, profileProject, recommendSquad, scoreSquad } from "../src/agentEngine";
import { DEFAULT_PROJECT_BRIEF, MARKET_AGENTS } from "../src/market";

describe("agent marketplace engine", () => {
  test("extracts A2A, MCP, Cloud Run, and Gemini intent from the hackathon brief", () => {
    const profile = profileProject(DEFAULT_PROJECT_BRIEF);

    expect(profile.weights.a2a).toBeGreaterThan(1.5);
    expect(profile.weights.mcp).toBeGreaterThan(1.2);
    expect(profile.weights.cloudRun).toBeGreaterThan(1.2);
    expect(profile.matchedTerms).toEqual(expect.arrayContaining(["a2a", "mcp"]));
  });

  test("buying agents improves the project score over the empty baseline", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist"], 140);

    expect(recommendation.budgetUsed).toBeLessThanOrEqual(140);
    expect(recommendation.after.total).toBeGreaterThan(recommendation.before.total);
    expect(recommendation.uplift.governance).toBeGreaterThan(25);
    expect(recommendation.mcpMatrix.length).toBeGreaterThanOrEqual(3);
  });

  test("A2A timeline exposes discovery, negotiation, delegation, and shipping steps", () => {
    const selected = MARKET_AGENTS.filter((agent) => ["market-broker", "cloud-run-sre"].includes(agent.id));
    const timeline = createA2ATimeline(selected);

    expect(timeline.map((item) => item.verb)).toEqual(expect.arrayContaining(["discover", "negotiate", "message/send", "ship"]));
    expect(timeline[0].payload).toContain("agent-card.json");
  });

  test("squad score remains bounded", () => {
    const score = scoreSquad(MARKET_AGENTS);

    expect(score.total).toBeGreaterThan(0);
    expect(score.total).toBeLessThanOrEqual(100);
    expect(Object.values(score).every((value) => value >= 0 && value <= 100)).toBe(true);
  });
});
