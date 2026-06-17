import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport, sourceForMarketIntel } from "../src/marketIntel";
import { buildWinningStrategy } from "../src/strategy";

describe("market intel board", () => {
  test("turns current competitor sources into a judge-ready market report", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const intel = buildMarketIntelReport({ baseUrl, recommendation, strategy });

    expect(intel.marketScore).toBeGreaterThanOrEqual(74);
    expect(intel.sources.map((source) => source.id)).toEqual(
      expect.arrayContaining(["gemini-enterprise", "google-adk", "a2a-protocol", "langgraph", "crewai", "dify", "agentops", "cloud-run"])
    );
    expect(intel.sources.every((source) => source.url.startsWith("https://"))).toBe(true);
    expect(intel.comparisons).toHaveLength(strategy.competitors.length);
    expect(intel.comparisons.find((comparison) => comparison.id === "google-adk")?.sourceIds).toEqual(
      expect.arrayContaining(["gemini-enterprise", "google-adk"])
    );
    expect(intel.comparisons.find((comparison) => comparison.id === "langgraph")?.ourCounter).toContain("意思決定");
    expect(intel.judgeAnswers.map((answer) => answer.criterionId)).toEqual(expect.arrayContaining(["agentCentrality", "approach", "implementation"]));
    expect(intel.moves.map((move) => move.id)).toEqual(expect.arrayContaining(["cite-sources", "record-market-intel", "connect-runtime-proof"]));
    expect(intel.a2aPayload).toMatchObject({
      skill: "market.intel",
      endpoints: {
        app: baseUrl,
        marketIntel: `${baseUrl}/api/market-intel`
      }
    });
  });

  test("looks up source metadata by id", () => {
    expect(sourceForMarketIntel("google-adk")?.label).toBe("Agent Development Kit");
    expect(sourceForMarketIntel("missing")).toBeUndefined();
  });
});
