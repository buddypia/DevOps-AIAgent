import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildWinningStrategy } from "../src/strategy";

describe("judge drill", () => {
  test("builds skeptical judge questions, rebuttals, and evidence links for every criterion", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const opsDrill = buildOpsDrill(recommendation, strategy);
    const pitch = buildPitchRun({
      baseUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
      recommendation,
      strategy,
      mission,
      opsDrill
    });
    const drill = buildJudgeDrill({
      baseUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch
    });

    expect(drill.readinessScore).toBeGreaterThanOrEqual(80);
    expect(drill.hardestQuestion).toMatch(/[?？]/);
    expect(drill.objections).toHaveLength(strategy.judgeCriteria.length);
    expect(drill.objections.map((objection) => objection.criterionId)).toEqual(
      expect.arrayContaining(["agentCentrality", "approach", "usability", "practicality", "implementation"])
    );
    expect(drill.objections.every((objection) => objection.answer.length > 30)).toBe(true);
    expect(drill.objections.every((objection) => objection.evidenceUrl.startsWith("https://"))).toBe(true);
    expect(drill.objections.find((objection) => objection.criterionId === "implementation")?.evidenceUrl).toContain("actions/workflows/ci.yml");
    expect(drill.crossExamDeck.length).toBeGreaterThanOrEqual(3);
    expect(drill.crossExamDeck.map((card) => card.id)).toEqual(expect.arrayContaining(["google-adk", "langgraph"]));
    expect(drill.crossExamDeck[0].proofSteps.map((step) => step.id)).toEqual(["battlecard", "sources", "live-proof"]);
    expect(drill.crossExamDeck[0].answerPattern).toContain("作る基盤");
    expect(drill.timeboxedAnswer.map((step) => step.timeRange)).toEqual(["0-10s", "10-25s", "25-45s", "45-60s"]);
    expect(drill.timeboxedAnswer[2].proof).toContain("Competitive Battlecard");
    expect(drill.evidenceLinks.map((link) => link.id)).toEqual(expect.arrayContaining(["app", "github", "ci", "proof", "pitch"]));
    expect(drill.crossExamRunbook.join("\n")).toContain("Competitive Battlecard");
    expect(drill.crossExamRunbook.join("\n")).toContain("Winning Strategy");
    expect(drill.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "judge.drill",
      crossExamDeck: expect.arrayContaining([expect.objectContaining({ id: "google-adk" })])
    });
  });
});
