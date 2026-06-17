import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildJudgeProof, proofDigest } from "../src/proof";
import { buildWinningStrategy } from "../src/strategy";

describe("judge proof bundle", () => {
  test("combines Gemini, Cloud Run, A2A, strategy, mission, ops, and submission evidence", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const opsDrill = buildOpsDrill(recommendation, strategy);
    const gemini = localGeminiRecommendation(recommendation, "unit test fallback");
    const proof = buildJudgeProof({
      baseUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
      recommendation,
      strategy,
      mission,
      opsDrill,
      gemini
    });

    expect(proof.overallScore).toBeGreaterThanOrEqual(80);
    expect(proof.scores.cloudRun).toBe(100);
    expect(proof.scores.a2a).toBe(100);
    expect(proof.proofItems.map((item) => item.id)).toEqual(
      expect.arrayContaining(["gemini", "cloud-run", "a2a", "strategy", "mission", "ops", "ci", "submission"])
    );
    expect(proof.proofItems.find((item) => item.id === "gemini")?.status).toBe("watch");
    expect(proof.proofItems.find((item) => item.id === "ci")?.status).toBe("watch");
    expect(proof.scores.ci).toBeGreaterThanOrEqual(70);
    expect(proof.links.agentCard).toBe("https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app/.well-known/agent-card.json");
    expect(proof.links.github).toBe("https://github.com/buddypia/DevOps-AIAgent");
    expect(proof.links.ci).toBe("https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml");
    expect(proof.runbook.join("\n")).toContain("/api/proof");
    expect(proof.runbook.join("\n")).toContain("actions/workflows/ci.yml");
    expect(proof.runbook.join("\n")).toContain(".receipt");
    expect(proof.receipt.algorithm).toBe("sha256");
    expect(proof.receipt.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(proof.receipt.digest).toBe(proofDigest(proof.receipt.payload));
    expect(proof.receipt.payload.proofId).toBe(proof.id);
    expect(proof.receipt.payload.proofItemStatuses.length).toBe(8);
    expect(proof.receipt.payload.ci.conclusion).toBe("not-checked");
    expect(proof.strategy.topCompetitor).toContain("Google");
    expect(proof.mission.submissionScore).toBeGreaterThanOrEqual(80);
    expect(proof.opsDrill.nextOpsAgent).toBe("Observability Oracle");
  });
});
