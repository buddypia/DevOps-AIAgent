import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildWinningStrategy } from "../src/strategy";

describe("pitch director", () => {
  test("turns the strategy, mission, ops, and submission proof into a 30 second recording plan", () => {
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

    expect(pitch.totalSeconds).toBe(30);
    expect(pitch.scenes.map((scene) => scene.id)).toEqual(["proof", "market", "strategy", "mission", "ops", "submission"]);
    expect(pitch.scenes.every((scene) => scene.evidenceUrl.startsWith("https://"))).toBe(true);
    expect(pitch.readinessScore).toBeGreaterThanOrEqual(80);
    expect(pitch.voiceoverScript).toContain("Cloud Run");
    expect(pitch.voiceoverScript).toContain("A2A");
    expect(pitch.recordingChecklist.map((item) => item.id)).toEqual(
      expect.arrayContaining(["cloud-run", "github", "ci", "agent-card", "protopedia", "video"])
    );
    expect(pitch.recordingChecklist.find((item) => item.id === "ci")?.status).toBe("ready");
    expect(pitch.submissionWarnings.map((item) => item.id)).toEqual(expect.arrayContaining(["protopedia", "video"]));
    expect(pitch.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "pitch.director",
      totalSeconds: 30
    });
  });
});
