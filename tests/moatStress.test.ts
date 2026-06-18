import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMoatStressTest } from "../src/moatStress";
import { buildWinningStrategy } from "../src/strategy";

describe("moat stress test", () => {
  test("turns competitive intel into judge objections and proof routes", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
    const moat = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel, generatedAt: "2026-06-18T00:00:00.000Z" });

    expect(moat.stressScore).toBeGreaterThanOrEqual(80);
    expect(moat.scenarios).toHaveLength(marketIntel.comparisons.length);
    expect(moat.scenarios.map((scenario) => scenario.id)).toEqual(expect.arrayContaining(["google-adk", "langgraph", "agentops"]));
    expect(moat.scenarios.find((scenario) => scenario.id === "google-adk")?.objection).toContain("ADK");
    expect(moat.scenarios.find((scenario) => scenario.id === "a2a-marketplace")?.evidenceLinks.map((link) => link.label)).toEqual(
      expect.arrayContaining(["Agent Card", "Live Evidence"])
    );
    expect(moat.recordingOrder).toEqual(expect.arrayContaining(["Moat Stress Testで反論ごとの証拠を選ぶ"]));
    expect(moat.actions.map((action) => action.id)).toEqual(expect.arrayContaining(["lead-with-moat", "record-counterproof"]));
    expect(moat.a2aPayload).toMatchObject({
      skill: "moat.stress",
      endpoints: {
        app: baseUrl,
        moatStress: `${baseUrl}/api/moat-stress`
      }
    });
  });

  test("flags a weak squad as needing stronger proof against competitors", () => {
    const baseUrl = "https://example.com";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["brief-cartographer"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
    const moat = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });

    expect(moat.verdict).not.toBe("defensible");
    expect(moat.actions.map((action) => action.id)).toContain("shore-up-google-adk");
    expect(moat.scenarios.some((scenario) => scenario.verdict !== "defensible")).toBe(true);
  });
});
