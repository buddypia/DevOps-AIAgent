import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildCompetitiveBattlecard } from "../src/competitiveBattlecard";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMoatStressTest } from "../src/moatStress";
import { buildWinningStrategy } from "../src/strategy";

describe("competitive battlecard", () => {
  test("turns market intel, moat stress, and SWOT into judge-ready competitor cards", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
    const moatStress = buildMoatStressTest({
      baseUrl,
      recommendation,
      strategy,
      marketIntel,
      generatedAt: "2026-06-18T00:00:00.000Z"
    });
    const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });

    expect(battlecard.battleScore).toBeGreaterThanOrEqual(80);
    expect(battlecard.readiness).not.toBe("exposed");
    expect(battlecard.cards).toHaveLength(strategy.competitors.length);
    expect(battlecard.cards.find((card) => card.id === "google-adk")?.judgeQuestion).toContain("ADK");
    expect(battlecard.cards.find((card) => card.id === "google-adk")?.sourceUrls.map((source) => source.url)).toEqual(
      expect.arrayContaining(["https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk"])
    );
    expect(battlecard.cards.find((card) => card.id === "a2a-marketplace")?.swotLinks.map((link) => link.quadrant)).toEqual(
      expect.arrayContaining(["strengths", "opportunities", "threats", "weaknesses"])
    );
    expect(battlecard.swotReceipts.map((receipt) => receipt.quadrant)).toEqual(
      expect.arrayContaining(["strengths", "weaknesses", "opportunities", "threats"])
    );
    expect(battlecard.topRisks.length).toBeGreaterThan(0);
    expect(battlecard.judgeScript.join("\n")).toContain("Live Evidence");
    expect(battlecard.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "competitive.battlecard",
      endpoints: {
        competitiveBattlecard: `${baseUrl}/api/competitive-battlecard`,
        moatStress: `${baseUrl}/api/moat-stress`
      }
    });
  });
});
