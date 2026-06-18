import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildJudgeDemoReceipt } from "../src/demoReceipt";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMoatStressTest } from "../src/moatStress";
import { buildSquadOptimizer } from "../src/squadOptimizer";
import { buildWinningStrategy } from "../src/strategy";

function fixture() {
  const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const squadOptimizer = buildSquadOptimizer({ projectBrief: DEFAULT_PROJECT_BRIEF, selectedAgentIds, budget: 140, maxSquadSize: 4 });
  return { baseUrl, recommendation, strategy, moatStress, squadOptimizer };
}

describe("judge demo receipt", () => {
  test("keeps missing external submission URLs as a receipt gap", () => {
    const receipt = buildJudgeDemoReceipt({ ...fixture(), generatedAt: "2026-06-18T00:00:00.000Z" });

    expect(receipt.receiptScore).toBeGreaterThanOrEqual(85);
    expect(receipt.verdict).toBe("needs-external-submit");
    expect(receipt.stamps.map((stamp) => stamp.id)).toEqual(
      expect.arrayContaining(["judge-route", "competitive-moat", "squad-choice", "runtime-proof", "a2a-surface", "external-submit"])
    );
    expect(receipt.stamps.find((stamp) => stamp.id === "external-submit")?.status).toBe("watch");
    expect(receipt.actions.map((action) => action.id)).toContain("external-submit");
    expect(receipt.digest.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(receipt.a2aPayload).toMatchObject({
      skill: "demo.receipt",
      verdict: "needs-external-submit"
    });
  });

  test("seals the receipt when external URLs are ready and no proof stamp is missing", () => {
    const receipt = buildJudgeDemoReceipt({
      ...fixture(),
      protopediaUrl: "https://protopedia.net/prototype/999999",
      videoUrl: "https://youtu.be/demo1234567"
    });

    expect(receipt.verdict).toBe("sealed");
    expect(receipt.stamps.some((stamp) => stamp.status === "missing")).toBe(false);
    expect(receipt.stamps.find((stamp) => stamp.id === "external-submit")?.status).toBe("sealed");
    expect(receipt.actions.every((action) => action.priority === "next")).toBe(true);
    expect(receipt.digest.payload.externalUrls.protopediaUrl).toBe("https://protopedia.net/prototype/999999");
  });
});
