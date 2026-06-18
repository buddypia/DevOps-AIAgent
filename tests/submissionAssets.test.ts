import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildSubmissionAssetsPage, renderSubmissionAssetsHtml } from "../src/submissionAssets";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildWinningStrategy } from "../src/strategy";

describe("submission assets page", () => {
  test("renders ProtoPedia-ready assets with external URL gaps explicit", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const page = buildSubmissionAssetsPage({
      baseUrl,
      mission,
      generatedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(page.readiness).toBe("assets-ready-external-watch");
    expect(page.tags).toEqual(expect.arrayContaining(["findy_hackathon", "Cloud Run", "Gemini"]));
    expect(page.story).toHaveLength(3);
    expect(page.videoStoryboard).toHaveLength(6);
    expect(page.architecture.diagramUrl).toBe(`${baseUrl}/assets/a2a-marketplace-architecture.svg`);
    expect(page.links.map((link) => link.id)).toEqual(expect.arrayContaining(["github", "cloud-run", "ci", "architecture", "story", "judge-snapshot", "mvp-readiness"]));
    expect(page.requirements.filter((requirement) => requirement.status === "needs-url").map((requirement) => requirement.id)).toEqual(
      expect.arrayContaining(["protopedia", "video"])
    );
    expect(page.pasteFields.map((field) => field.id)).toEqual(["title", "tags", "story", "demo", "github", "cloud-run"]);

    const html = renderSubmissionAssetsHtml(page);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("findy_hackathon");
    expect(html).toContain("30 Second Video Storyboard");
    expect(html).toContain(`${baseUrl}/judge-snapshot`);
    expect(html).toContain(`${baseUrl}/mvp-readiness`);
    expect(html).toContain("ProtoPedia提出素材は揃っています");
  });

  test("escapes paste fields before rendering", () => {
    const baseUrl = "https://example.com";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const page = buildSubmissionAssetsPage({ baseUrl, mission, generatedAt: "2026-06-18T00:00:00.000Z" });
    page.pasteFields[0].value = "<script>alert('title')</script>";

    const html = renderSubmissionAssetsHtml(page);

    expect(html).toContain("&lt;script&gt;alert(&#39;title&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('title')</script>");
  });
});
