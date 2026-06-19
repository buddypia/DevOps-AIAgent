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
    expect(battlecard.cards.find((card) => card.id === "microsoft-copilot-studio")?.sourceUrls.map((source) => source.url)).toEqual(
      expect.arrayContaining([
        "https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio",
        "https://www.microsoft.com/en-us/microsoft-365-copilot/microsoft-copilot-studio"
      ])
    );
    expect(battlecard.cards.find((card) => card.id === "openai-agents-sdk")?.sourceUrls.map((source) => source.url)).toEqual(
      expect.arrayContaining(["https://developers.openai.com/api/docs/guides/agents"])
    );
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
    expect(battlecard.criteriaDuel).toMatchObject({
      readiness: expect.stringMatching(/duel-/),
      rows: expect.arrayContaining([
        expect.objectContaining({
          id: "approach",
          targetCompetitor: "Google ADK / Gemini Enterprise",
          proofUrl: `${baseUrl}/api/competitive-battlecard`
        }),
        expect.objectContaining({
          id: "usability",
          targetCompetitor: "Microsoft Copilot Studio",
          proofUrl: `${baseUrl}/api/demo-concierge`
        }),
        expect.objectContaining({
          id: "implementation",
          proofUrl: `${baseUrl}/api/release-drift`
        })
      ])
    });
    expect(battlecard.criteriaDuel.rows).toHaveLength(5);
    expect(battlecard.criteriaDuel.rows.every((row) => row.status !== "exposed")).toBe(true);
    expect(battlecard.winLossLock).toMatchObject({
      readiness: "win-loss-locked",
      winLossScore: expect.any(Number),
      winCount: 8,
      contestCount: 0,
      lossRiskCount: 0
    });
    expect(battlecard.winLossLock.winLossScore).toBeGreaterThanOrEqual(90);
    expect(battlecard.winLossLock.rows).toHaveLength(8);
    expect(battlecard.winLossLock.rows.find((row) => row.id === "google-adk")).toMatchObject({
      status: "win",
      judgeCriterionId: "approach",
      mustShowProofUrl: `${baseUrl}/api/competitive-battlecard`,
      mvpAction: expect.stringContaining("証拠URL")
    });
    expect(battlecard.winLossLock.rows.find((row) => row.id === "a2a-marketplace")).toMatchObject({
      status: "win",
      judgeCriterionId: "agentCentrality",
      mustShowProofUrl: `${baseUrl}/.well-known/agent-card.json`
    });
    expect(battlecard.proofLock).toMatchObject({
      readiness: "proof-watch",
      proofScore: 95,
      sealedCount: 5,
      watchCount: 1,
      missingCount: 0,
      coverage: {
        competitorCount: 8,
        sourceUrlCount: 14,
        swotLinkCount: 27,
        proofRouteCount: 8,
        liveSourceReadiness: "source-lock-declared"
      }
    });
    expect(battlecard.proofLock.checks.map((check) => `${check.id}:${check.status}`)).toEqual([
      "competitor-coverage:sealed",
      "official-source-coverage:sealed",
      "swot-mapping:sealed",
      "objection-receipts:sealed",
      "objection-replay:sealed",
      "live-source-lock:watch"
    ]);
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
      criteriaDuel: {
        duelScore: expect.any(Number),
        readiness: expect.stringMatching(/duel-/),
        rows: expect.arrayContaining([
          expect.objectContaining({
            id: "implementation",
            proofUrl: `${baseUrl}/api/release-drift`
          })
        ])
      },
      winLossLock: {
        winLossScore: expect.any(Number),
        readiness: "win-loss-locked",
        rows: expect.arrayContaining([
          expect.objectContaining({
            id: "google-adk",
            mustShowProofUrl: `${baseUrl}/api/competitive-battlecard`
          })
        ])
      },
      proofLock: {
        proofScore: 95,
        readiness: "proof-watch",
        checks: expect.arrayContaining([
          expect.objectContaining({
            id: "live-source-lock",
            status: "watch"
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
