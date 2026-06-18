import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { attachSourceProofLock, buildMarketIntelReport, probeMarketIntelSources, sourceForMarketIntel } from "../src/marketIntel";
import { buildWinningStrategy } from "../src/strategy";

describe("market intel board", () => {
  test("turns current competitor sources into a judge-ready market report", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const intel = buildMarketIntelReport({ baseUrl, recommendation, strategy });

    expect(intel.marketScore).toBeGreaterThanOrEqual(74);
    expect(intel.sources.map((source) => source.id)).toEqual(
      expect.arrayContaining([
        "gemini-agent-platform-launch",
        "gemini-enterprise",
        "google-adk",
        "a2a-protocol",
        "a2a-upgrade",
        "google-marketplace-ai-agents",
        "langgraph",
        "crewai",
        "dify",
        "agentops",
        "cloud-run"
      ])
    );
    expect(intel.sources.every((source) => source.url.startsWith("https://"))).toBe(true);
    expect(intel.sourceFreshness).toMatchObject({
      reviewedAt: "2026-06-18",
      competitorCoveragePercent: 100
    });
    expect(intel.sourceFreshness.freshCount).toBeGreaterThanOrEqual(9);
    expect(intel.sourceProofLock).toMatchObject({
      readiness: "source-lock-declared",
      liveProbeCount: 0
    });
    expect(intel.sourceProofLock.uncheckedCount).toBe(intel.sourceLedger.length);
    expect(intel.sourceLedger.find((source) => source.id === "google-marketplace-ai-agents")?.competitorIds).toContain("a2a-marketplace");
    expect(intel.sourceLedger.every((source) => source.judgeUse.length > 20)).toBe(true);
    expect(intel.comparisons).toHaveLength(strategy.competitors.length);
    expect(intel.comparisons.find((comparison) => comparison.id === "google-adk")?.sourceIds).toEqual(
      expect.arrayContaining(["gemini-agent-platform-launch", "gemini-enterprise", "google-adk"])
    );
    expect(intel.comparisons.find((comparison) => comparison.id === "a2a-marketplace")?.sourceIds).toEqual(
      expect.arrayContaining(["a2a-upgrade", "google-marketplace-ai-agents"])
    );
    expect(intel.comparisons.find((comparison) => comparison.id === "langgraph")?.ourCounter).toContain("意思決定");
    expect(intel.judgeAnswers.map((answer) => answer.criterionId)).toEqual(expect.arrayContaining(["agentCentrality", "approach", "implementation"]));
    expect(intel.moves.map((move) => move.id)).toEqual(expect.arrayContaining(["cite-sources", "record-market-intel", "connect-runtime-proof"]));
    expect(intel.a2aPayload).toMatchObject({
      skill: "market.intel",
      sourceFreshness: {
        reviewedAt: "2026-06-18",
        competitorCoveragePercent: 100
      },
      sourceProofLock: {
        readiness: "source-lock-declared",
        liveProbeCount: 0
      },
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

  test("builds a live source freshness lock from injected probes", async () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const intel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
    const sourceLock = await probeMarketIntelSources({
      sourceLedger: intel.sourceLedger,
      checkedAt: "2026-06-19T00:00:00.000Z",
      fetcher: async (url) => new Response("", { status: url.includes("agentops") ? 403 : 200 })
    });
    const lockedIntel = attachSourceProofLock(intel, sourceLock);

    expect(sourceLock.readiness).toBe("source-lock-watch");
    expect(sourceLock.passedCount).toBe(intel.sourceLedger.length - 1);
    expect(sourceLock.watchCount).toBe(1);
    expect(sourceLock.failedCount).toBe(0);
    expect(sourceLock.liveProbeCount).toBe(intel.sourceLedger.length);
    expect(sourceLock.competitorCoveragePercent).toBe(100);
    expect(lockedIntel.a2aPayload).toMatchObject({
      sourceProofLock: {
        readiness: "source-lock-watch",
        passedCount: intel.sourceLedger.length - 1,
        watchCount: 1,
        liveProbeCount: intel.sourceLedger.length,
        competitorCoveragePercent: 100
      }
    });
  });

  test("blocks unsupported competitor claims when a source probe fails", async () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const intel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
    const sourceLock = await probeMarketIntelSources({
      sourceLedger: intel.sourceLedger,
      checkedAt: "2026-06-19T00:00:00.000Z",
      fetcher: async (url) => new Response("", { status: url.includes("dify") ? 404 : 200 })
    });

    expect(sourceLock.readiness).toBe("source-lock-blocked");
    expect(sourceLock.failedCount).toBe(1);
    expect(sourceLock.probes.find((probe) => probe.id === "dify")).toMatchObject({
      status: "failed",
      statusCode: 404
    });
    expect(sourceLock.nextActions[0]).toContain("Dify");
  });
});
