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
    expect(page.jsonEndpoint).toBe(`${baseUrl}/api/submission-assets`);
    expect(page.valueSnapshot).toMatchObject({
      audience: expect.stringContaining("Platform and DevOps teams"),
      pain: expect.stringContaining("hide deployment proof"),
      promise: expect.stringContaining("inspectable buyer packet")
    });
    expect(page.valueSnapshot.proofMoment).toContain("autonomous agent decisions");
    expect(page.proofReadiness).toMatchObject({
      readyCount: 5,
      totalCount: 7,
      scoreLabel: "5/7 submission requirements ready"
    });
    expect(page.proofReadiness.blockers.map((blocker) => blocker.id)).toEqual(expect.arrayContaining(["protopedia", "video"]));
    expect(page.reviewerPath.map((item) => item.id)).toEqual(["live-product", "judge-snapshot", "recording-script"]);
    expect(page.agentDecisionProof.map((decision) => decision.id)).toEqual(expect.arrayContaining(["positioning", "weakness-repair", "next-hire"]));
    expect(page.claimProofMatrix.map((row) => row.id)).toEqual([
      "ai-agent-centrality",
      "approach-story",
      "usability",
      "practical-value",
      "implementation"
    ]);
    expect(page.claimProofMatrix.find((row) => row.id === "ai-agent-centrality")).toMatchObject({
      proofUrl: `${baseUrl}/.well-known/agent-card.json`,
      status: "proven",
      userValue: expect.stringContaining("inspect the agent surface")
    });
    expect(page.claimProofMatrix.find((row) => row.id === "practical-value")).toMatchObject({
      proofUrl: `${baseUrl}/mvp-readiness`,
      status: "watch",
      evidence: expect.stringContaining("5/7")
    });
    expect(page.claimProofMatrix.find((row) => row.id === "implementation")).toMatchObject({
      proofLabel: "Submission JSON",
      proofUrl: `${baseUrl}/api/submission-assets`,
      evidence: expect.stringContaining("7 evidence-chain checks")
    });
    expect(page.evidenceChain.map((item) => item.id)).toEqual([
      "cloud-run-health",
      "agent-card",
      "strategy-api",
      "judge-snapshot",
      "ci-workflow",
      "submission-assets",
      "submission-assets-json"
    ]);
    expect(page.evidenceChain.find((item) => item.id === "agent-card")).toMatchObject({
      url: `${baseUrl}/.well-known/agent-card.json`,
      command: expect.stringContaining("/.well-known/agent-card.json"),
      userValue: expect.stringContaining("inspect what the agent can actually do")
    });
    expect(page.evidenceChain.find((item) => item.id === "submission-assets")).toMatchObject({
      command: `curl -s ${baseUrl}/submission-assets`,
      proves: expect.stringContaining("submission blockers")
    });
    expect(page.evidenceChain.find((item) => item.id === "submission-assets-json")).toMatchObject({
      url: `${baseUrl}/api/submission-assets`,
      command: `curl -s ${baseUrl}/api/submission-assets`,
      userValue: expect.stringContaining("machine-readable proof contract")
    });
    expect(page.links.map((link) => link.id)).toEqual(
      expect.arrayContaining(["github", "cloud-run", "ci", "architecture", "story", "judge-snapshot", "mvp-readiness", "recording-script"])
    );
    expect(page.requirements.filter((requirement) => requirement.status === "needs-url").map((requirement) => requirement.id)).toEqual(
      expect.arrayContaining(["protopedia", "video"])
    );
    expect(page.pasteFields.map((field) => field.id)).toEqual(["title", "tags", "story", "demo", "github", "cloud-run"]);

    const html = renderSubmissionAssetsHtml(page);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("findy_hackathon");
    expect(html).toContain("Value In One Minute");
    expect(html).toContain("Claim-To-Proof Matrix");
    expect(html).toContain("AI agent centrality");
    expect(html).toContain("Submission JSON");
    expect(html).toContain("Reviewer Path");
    expect(html).toContain("AI Agent Proof");
    expect(html).toContain("Live Evidence Chain");
    expect(html).toContain("Machine-readable JSON");
    expect(html).toContain(`${baseUrl}/api/submission-assets`);
    expect(html).toContain(`${baseUrl}/.well-known/agent-card.json`);
    expect(html).toContain(`curl -s ${baseUrl}/submission-assets`);
    expect(html).toContain("5/7");
    expect(html).toContain("Open the live product");
    expect(html).toContain("30 Second Video Storyboard");
    expect(html).toContain(`${baseUrl}/judge-snapshot`);
    expect(html).toContain(`${baseUrl}/mvp-readiness`);
    expect(html).toContain(`${baseUrl}/recording-script`);
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
