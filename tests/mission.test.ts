import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildMissionRun } from "../src/mission";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildWinningStrategy } from "../src/strategy";

describe("autonomous mission engine", () => {
  test("generates an end-to-end mission with decisions, A2A delegation, verification, and submission pack", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);

    expect(mission.summary).toContain("A2A");
    expect(mission.autonomyScore).toBeGreaterThanOrEqual(70);
    expect(mission.decisions.map((decision) => decision.id)).toEqual(expect.arrayContaining(["positioning", "weakness-repair", "next-hire"]));
    expect(mission.steps.map((step) => step.phase)).toEqual(["sense", "decide", "delegate", "verify", "ship"]);
    expect(mission.steps.every((step) => step.status === "completed")).toBe(true);
    expect(mission.artifacts.map((artifact) => artifact.type)).toEqual(expect.arrayContaining(["story", "architecture", "verification", "a2a", "video"]));
    expect(mission.verificationCommands).toEqual(expect.arrayContaining(["npm test", "npm run build"]));
    expect(mission.verificationCommands.join("\n")).toContain("/api/ops-drill");
    expect(mission.submissionPack.tags).toContain("findy_hackathon");
    expect(mission.submissionPack.architectureDiagramUrl).toBe("/assets/a2a-marketplace-architecture.svg");
    expect(mission.submissionPack.storyMarkdownPath).toBe("/docs/03_submission/submission-pack.md");
    expect(mission.submissionPack.publicGitHubUrl).toBe("https://github.com/buddypia/DevOps-AIAgent");
    expect(mission.submissionPack.ciWorkflowUrl).toBe("https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml");
    expect(mission.submissionPack.deployedUrl).toBe("https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app");
    expect(mission.submissionPack.videoStoryboard.length).toBeGreaterThanOrEqual(6);
    expect(mission.submissionPack.requirements.map((item) => item.id)).toEqual(
      expect.arrayContaining(["github", "deployed-url", "github-ci", "protopedia", "video", "architecture", "tag"])
    );
    expect(mission.verificationCommands.join("\n")).toContain("actions/workflows/ci.yml");
    expect(mission.submissionPack.requirements.find((item) => item.id === "github")?.status).toBe("ready");
    expect(mission.submissionPack.requirements.find((item) => item.id === "github-ci")?.status).toBe("ready");
    expect(mission.submissionPack.requirements.find((item) => item.id === "protopedia")?.status).toBe("needs-url");
  });

  test("routes the next mission action to the weakest judging criterion", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy, "審査に勝つための追加検証を作る");

    expect(mission.objective).toBe("審査に勝つための追加検証を作る");
    expect(mission.weakestCriterion.label).toBe("実装力");
    expect(mission.steps.find((step) => step.phase === "decide")?.output).toContain("Test Forge");
    expect(mission.artifacts.find((artifact) => artifact.id === "a2a-delegation")?.content).toContain("test-forge");
  });
});
