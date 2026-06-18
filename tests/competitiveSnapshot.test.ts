import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildCompetitiveBattlecard } from "../src/competitiveBattlecard";
import { buildCompetitiveSnapshot, renderCompetitiveSnapshotHtml } from "../src/competitiveSnapshot";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMoatStressTest } from "../src/moatStress";
import { buildWinningStrategy } from "../src/strategy";

const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];

function fixture() {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel, generatedAt: "2026-06-18T00:00:00.000Z" });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const snapshot = buildCompetitiveSnapshot({
    baseUrl,
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds,
    strategy,
    marketIntel,
    battlecard,
    generatedAt: "2026-06-18T00:00:00.000Z"
  });

  return { snapshot };
}

describe("competitive SWOT snapshot", () => {
  test("packages competitors, SWOT, sources, and criteria duel into a direct-open proof page", () => {
    const { snapshot } = fixture();

    expect(snapshot.readiness).toBe("competitive-swot-watch");
    expect(snapshot.summary).toMatchObject({
      competitorCount: 6,
      highThreatCount: 2,
      sourceUrlCount: 11,
      swotQuadrantCount: 4,
      sourceLockReadiness: "source-lock-declared"
    });
    expect(snapshot.swotMatrix.map((group) => group.quadrant)).toEqual(["strengths", "weaknesses", "opportunities", "threats"]);
    expect(snapshot.competitors.map((card) => card.id)).toEqual(expect.arrayContaining(["google-adk", "a2a-marketplace", "langgraph", "crewai", "dify", "agentops"]));
    expect(snapshot.competitors.find((card) => card.id === "google-adk")?.sourceUrls.map((source) => source.url)).toEqual(
      expect.arrayContaining(["https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/adk"])
    );
    expect(snapshot.criteriaDuel.rows).toHaveLength(5);
    expect(snapshot.proofLock.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining(["competitor-coverage", "official-source-coverage", "swot-mapping", "objection-replay"])
    );
    expect(snapshot.links.find((link) => link.id === "competitive-swot")).toMatchObject({
      method: "GET",
      url: `${baseUrl}/competitive-swot`
    });
    expect(snapshot.postApis.map((api) => `${api.method}:${api.url}`)).toEqual(
      expect.arrayContaining([`POST:${baseUrl}/api/market-intel`, `POST:${baseUrl}/api/competitive-battlecard`, `POST:${baseUrl}/api/moat-stress`])
    );
    expect(snapshot.a2aPayload).toMatchObject({
      skill: "competitive.snapshot",
      endpoints: {
        competitiveSwotSnapshot: `${baseUrl}/competitive-swot`,
        competitiveSwotJson: `${baseUrl}/api/competitive-swot`
      }
    });
  });

  test("renders safe HTML for judge-facing competitive proof", () => {
    const { snapshot } = fixture();
    snapshot.competitors[0].shortAnswer = "<script>alert('swot')</script>";

    const html = renderCompetitiveSnapshotHtml(snapshot);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Competitive SWOT Snapshot");
    expect(html).toContain("SWOT Matrix");
    expect(html).toContain("Google ADK / Gemini Enterprise");
    expect(html).toContain(`${baseUrl}/judge-snapshot`);
    expect(html).toContain("&lt;script&gt;alert(&#39;swot&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('swot')</script>");
  });
});
