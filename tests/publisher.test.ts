import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildSquadContract } from "../src/contracts";
import { buildFinalistSimulation } from "../src/finalist";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildProtoPediaPublisher, renderProtoPediaPublisherHtml, SUBMISSION_PUBLISH_REQUIRED_SIGNAL, SUBMISSION_PUBLISH_SKILL_ID } from "../src/publisher";
import { buildWinningStrategy } from "../src/strategy";

describe("protopedia publisher", () => {
  test("packages paste-ready submission fields while preserving external URL gaps", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const opsDrill = buildOpsDrill(recommendation, strategy);
    const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
    const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
    const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
    const finalist = buildFinalistSimulation({
      baseUrl,
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch,
      judgeDrill,
      squadContract
    });
    const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });

    expect(publisher.publishScore).toBeGreaterThanOrEqual(80);
    expect(publisher.readiness).toBe("needs-external-urls");
    expect(publisher.pasteFields.map((item) => item.id)).toEqual(
      expect.arrayContaining(["title", "one-liner", "problem", "features", "technology", "demo-flow", "judge-proof", "tags"])
    );
    expect(publisher.pasteFields.find((item) => item.id === "tags")?.value).toContain("findy_hackathon");
    expect(publisher.qualityLock).toMatchObject({
      readiness: "copy-locked",
      requiredTag: "findy_hackathon",
      externalUrlState: "watch"
    });
    expect(publisher.qualityLock.qualityScore).toBeGreaterThanOrEqual(90);
    expect(publisher.qualityLock.checks.map((check) => check.id)).toEqual([
      "story-triad",
      "required-tech",
      "judge-criteria",
      "competitive-swot",
      "demo-route",
      "public-assets",
      "external-url-closure"
    ]);
    expect(publisher.qualityLock.checks.find((check) => check.id === "required-tech")).toMatchObject({
      status: "ready",
      sourceFieldIds: ["technology"]
    });
    expect(publisher.qualityLock.checks.find((check) => check.id === "external-url-closure")).toMatchObject({
      status: "watch",
      acceptance: expect.stringContaining("提出完了扱いにしない")
    });
    expect(publisher.policyLock).toMatchObject({
      readiness: "prototype-copy-locked",
      policyScore: 95,
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "original-prototype", status: "ready" }),
        expect.objectContaining({ id: "not-info-only", status: "ready" }),
        expect.objectContaining({ id: "not-promo-only", status: "ready" }),
        expect.objectContaining({ id: "embeddable-media", status: "watch" })
      ])
    });
    expect(publisher.policyLock.sourceUrls).toEqual(
      expect.arrayContaining([
        "https://protopedia.gitbook.io/helpcenter/info/2025.09.05",
        "https://protopedia.gitbook.io/helpcenter/markdown"
      ])
    );
    expect(publisher.assets.find((item) => item.id === "cloud-run")?.status).toBe("ready");
    expect(publisher.assets.find((item) => item.id === "protopedia")?.status).toBe("watch");
    expect(publisher.missingExternal.map((item) => item.id)).toEqual(expect.arrayContaining(["record-video", "publish-protopedia"]));
    expect(publisher.recordingScript).toContain("AI能力");
    expect(publisher.a2aPayload).toMatchObject({
      method: "message/send",
      skill: SUBMISSION_PUBLISH_SKILL_ID,
      qualityLock: {
        readiness: "copy-locked",
        checks: expect.arrayContaining([expect.objectContaining({ id: "external-url-closure", status: "watch" })])
      },
      policyLock: {
        readiness: "prototype-copy-locked",
        checks: expect.arrayContaining([expect.objectContaining({ id: "embeddable-media", status: "watch" })])
      },
      endpoints: {
        publisher: `${baseUrl}/api/publisher`,
        publisherPage: `${baseUrl}/publisher`,
        submissionAssetsPage: `${baseUrl}/submission-assets`,
        architecturePackPage: `${baseUrl}/architecture-pack`,
        submissionLaunchPage: `${baseUrl}/submission-launch`
      }
    });

    expect(SUBMISSION_PUBLISH_REQUIRED_SIGNAL).toBe("submission.publish:tag:submission-publish-lock");

    const html = renderProtoPediaPublisherHtml({
      ...publisher,
      summary: "<script>alert('publisher')</script>",
      recordingScript: "Record <strong>proof</strong>"
    });
    expect(html).toContain("Submission Publisher Proof");
    expect(html).toContain("Paste Fields");
    expect(html).toContain("ProtoPedia Quality Lock");
    expect(html).toContain("Publication Policy Lock");
    expect(html).toContain("Final Checklist");
    expect(html).toContain("&lt;script&gt;alert(&#39;publisher&#39;)&lt;/script&gt;");
    expect(html).toContain("Record &lt;strong&gt;proof&lt;/strong&gt;");
    expect(html).not.toContain("<script>alert('publisher')</script>");
  });
});
