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
    expect(battlecard.cards.find((card) => card.id === "a2a-marketplace")?.sourceUrls.map((source) => source.url)).toEqual(
      expect.arrayContaining(["https://docs.cloud.google.com/marketplace/docs/partners/ai-agents"])
    );
    expect(battlecard.cards.find((card) => card.id === "a2a-marketplace")?.swotLinks.map((link) => link.quadrant)).toEqual(
      expect.arrayContaining(["strengths", "opportunities", "threats", "weaknesses"])
    );
    expect(battlecard.swotReceipts.map((receipt) => receipt.quadrant)).toEqual(
      expect.arrayContaining(["strengths", "weaknesses", "opportunities", "threats"])
    );
    expect(battlecard.topRisks.length).toBeGreaterThan(0);
    expect(battlecard.objectionReceipts).toHaveLength(battlecard.cards.length);
    expect(battlecard.objectionReplay).toMatchObject({
      readiness: "replay-ready",
      weakestCompetitor: "Google ADK / Gemini Enterprise",
      openingObjection: expect.stringContaining("ADK"),
      sourceCount: 3,
      swotSignalCount: 4
    });
    expect(battlecard.objectionReplay.replayScore).toBeGreaterThanOrEqual(90);
    expect(battlecard.objectionReplay.steps.map((step) => step.id)).toEqual(["objection", "source-ledger", "swot-receipt", "proof-route"]);
    expect(battlecard.objectionReplay.steps.every((step) => step.status === "ready")).toBe(true);
    expect(battlecard.objectionReceipts[0]).toMatchObject({
      proofRoute: expect.any(String),
      acceptance: expect.stringContaining("公式ソース"),
      protopediaLine: expect.stringContaining("本作")
    });
    expect(battlecard.objectionReceipts.find((receipt) => receipt.id === "a2a-marketplace")).toMatchObject({
      swotSignal: expect.objectContaining({ quadrant: "threats" }),
      mvpUpgrade: expect.stringContaining("SWOT")
    });
    expect(battlecard.judgeScript.join("\n")).toContain("Live Evidence");
    expect(battlecard.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "competitive.battlecard",
      objectionReceipts: expect.arrayContaining([
        expect.objectContaining({
          id: "a2a-marketplace",
          swot: "threats"
        })
      ]),
      objectionReplay: {
        replayScore: expect.any(Number),
        readiness: "replay-ready",
        weakestCompetitor: "Google ADK / Gemini Enterprise",
        steps: expect.arrayContaining([
          expect.objectContaining({
            id: "proof-route",
            proofUrl: `${baseUrl}/api/live-evidence`
          })
        ])
      },
      endpoints: {
        competitiveBattlecard: `${baseUrl}/api/competitive-battlecard`,
        moatStress: `${baseUrl}/api/moat-stress`
      }
    });
  });
});
