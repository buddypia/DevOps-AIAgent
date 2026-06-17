import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildWinningStrategy, COMPETITORS } from "../src/strategy";

describe("winning strategy layer", () => {
  test("tracks direct competitive threats with source URLs and counter positions", () => {
    expect(COMPETITORS.map((competitor) => competitor.id)).toEqual(
      expect.arrayContaining(["google-adk", "a2a-marketplace", "langgraph", "crewai", "dify", "agentops"])
    );
    expect(COMPETITORS.every((competitor) => competitor.sourceUrl.startsWith("https://"))).toBe(true);
    expect(COMPETITORS.filter((competitor) => competitor.threatLevel === "high").length).toBeGreaterThanOrEqual(2);
    expect(COMPETITORS.every((competitor) => competitor.counterPosition.length > 20)).toBe(true);
  });

  test("turns the selected squad into SWOT, judge score, and MVP readiness evidence", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);

    expect(strategy.judgeScore).toBeGreaterThan(70);
    expect(strategy.judgeScore).toBeLessThanOrEqual(100);
    expect(strategy.moatScore).toBeGreaterThan(70);
    expect(strategy.mvpScore).toBeGreaterThanOrEqual(60);
    expect(strategy.mvpScore).toBeLessThan(100);
    expect(strategy.swot.strengths.length).toBeGreaterThanOrEqual(3);
    expect(strategy.swot.weaknesses.some((item) => item.title.includes("仮説"))).toBe(true);
    expect(strategy.swot.threats.some((item) => item.title.includes("Google"))).toBe(true);
  });

  test("recommends the next missing agent based on the weakest judging criterion", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);

    expect(strategy.nextBestAgent).not.toBeNull();
    expect(strategy.nextBestAgent?.agent.id).toBe("test-forge");
    expect(strategy.nextBestAgent?.reason).toContain("実装力");
  });

  test("marks external submission work as unproven until URLs and ProtoPedia are supplied", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const pending = strategy.submissionItems.filter((item) => !item.done).map((item) => item.id);

    expect(pending).toEqual(expect.arrayContaining(["public-github", "protopedia"]));
  });
});
