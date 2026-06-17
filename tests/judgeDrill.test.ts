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
    expect(drill.evidenceLinks.map((link) => link.id)).toEqual(expect.arrayContaining(["app", "github", "ci", "proof", "pitch"]));
    expect(drill.crossExamRunbook.join("\n")).toContain("Winning Strategy");
    expect(drill.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "judge.drill"
    });
  });
});
