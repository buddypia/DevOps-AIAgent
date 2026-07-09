import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildValueBlueprint } from "../src/valueBlueprint";

describe("value blueprint", () => {
  test("turns the selected squad into a buyer-ready operating plan", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const blueprint = buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF, "https://example.com");

    expect(blueprint.primaryUser).toBe("Platform / DevOps Lead");
    expect(blueprint.boardScore).toBeGreaterThanOrEqual(50);
    expect(blueprint.businessCase.hoursSaved).toBeGreaterThan(0);
    expect(blueprint.jobs.map((job) => job.id)).toEqual(["market-broker", "cloud-run-sre", "gemini-strategist"]);
    expect(blueprint.jobs.every((job) => job.acceptanceCriteria.length >= 3)).toBe(true);
    expect(blueprint.proofContract.qualityGate).toContain("npm run build");
    expect(blueprint.proofContract.evidenceUrls).toContain("https://example.com/api/value-blueprint");
  });

  test("adapts the primary user and proof contract to security-heavy briefs", () => {
    const brief = [
      "公開AIエージェントをグローバルに提供する。",
      "API key、privacy、security review、監査ログ、Cloud Runの安全な運用が必要。",
      "顧客が導入判断できるROIと検収条件を出したい。"
    ].join("\n");
    const recommendation = recommendSquad(brief, ["security-sentinel", "cloud-run-sre", "market-broker"], 140);
    const blueprint = buildValueBlueprint(recommendation, brief);

    expect(blueprint.primaryUser).toBe("Security-conscious Engineering Lead");
    expect(blueprint.jobs.map((job) => job.id)).toContain("security-sentinel");
    expect(blueprint.proofContract.mustProve.join(" ")).toContain("Every selected AI");
    expect(blueprint.metrics.find((metric) => metric.id === "readiness")?.delta).toMatch(/^\+/);
  });

  test("exports a markdown artifact that can leave the demo UI", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["brief-cartographer", "ux-guildmaster", "test-forge"], 140);
    const blueprint = buildValueBlueprint(recommendation);

    expect(blueprint.exportMarkdown).toContain("# Turn this AI-agent idea");
    expect(blueprint.exportMarkdown).toContain("## Jobs to be done");
    expect(blueprint.exportMarkdown).toContain("## Proof contract");
    expect(blueprint.exportMarkdown).toContain(blueprint.jobs[0].title);
  });
});
