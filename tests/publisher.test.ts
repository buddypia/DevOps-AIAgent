import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildSquadContract } from "../src/contracts";
import { buildFinalistSimulation } from "../src/finalist";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import {
  buildProtoPediaPublisher,
  buildProtoPediaPublisherLiveAudit,
  publisherProofLinks,
  renderProtoPediaPublisherHtml,
  SUBMISSION_PUBLISH_REQUIRED_SIGNAL,
  SUBMISSION_PUBLISH_SKILL_ID
} from "../src/publisher";
import { buildWinningStrategy } from "../src/strategy";
import { verifyWorkflowLiveProofAuditReceipt } from "../src/workflowLiveProofAudit";

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
    expect(publisher.copyTray).toMatchObject({
      readiness: "copy-ready-needs-external-urls",
      requiredReadyCount: 13,
      requiredTotalCount: 15,
      requiredGaps: ["動画URL", "ProtoPedia作品URL"]
    });
    expect(publisher.copyTray.pasteOrder).toEqual([
      "title",
      "one-liner",
      "problem",
      "users",
      "features",
      "technology",
      "demo-flow",
      "judge-proof",
      "tags",
      "github-url",
      "deployed-url",
      "architecture-url",
      "story-url",
      "video-url",
      "protopedia-url"
    ]);
    expect(publisher.copyTray.items.find((item) => item.id === "deployed-url")).toMatchObject({
      value: baseUrl,
      status: "ready",
      required: true
    });
    expect(publisher.copyTray.exportMarkdown).toContain("# ProtoPedia submission copy tray");
    expect(publisher.copyTray.exportMarkdown).toContain("Required gaps: 動画URL, ProtoPedia作品URL");
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
      copyTray: {
        readiness: "copy-ready-needs-external-urls",
        requiredGaps: ["動画URL", "ProtoPedia作品URL"],
        pasteOrder: expect.arrayContaining(["title", "deployed-url", "video-url", "protopedia-url"])
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
    expect(html).toContain("Submission Copy Tray");
    expect(html).toContain("Paste Fields");
    expect(html).toContain("ProtoPedia Quality Lock");
    expect(html).toContain("Publication Policy Lock");
    expect(html).toContain("Final Checklist");
    expect(html).toContain("&lt;script&gt;alert(&#39;publisher&#39;)&lt;/script&gt;");
    expect(html).toContain("Record &lt;strong&gt;proof&lt;/strong&gt;");
    expect(html).not.toContain("<script>alert('publisher')</script>");
  });

  test("uses supplied external URLs to complete the submission copy tray", () => {
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

    const publisher = buildProtoPediaPublisher({
      baseUrl,
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch,
      finalist,
      submissionUrls: {
        deployedUrl: "https://service.example.run.app",
        videoUrl: "https://youtu.be/demo",
        protopediaUrl: "https://protopedia.net/prototype/1234"
      }
    });

    expect(publisher.readiness).toBe("ready-to-register");
    expect(publisher.copyTray).toMatchObject({
      readiness: "ready-to-submit",
      requiredReadyCount: 15,
      requiredTotalCount: 15,
      requiredGaps: []
    });
    expect(publisher.assets.find((item) => item.id === "cloud-run")).toMatchObject({
      status: "ready",
      url: "https://service.example.run.app"
    });
    expect(publisher.assets.find((item) => item.id === "video")).toMatchObject({
      status: "ready",
      url: "https://youtu.be/demo"
    });
    expect(publisher.assets.find((item) => item.id === "protopedia")).toMatchObject({
      status: "ready",
      url: "https://protopedia.net/prototype/1234"
    });
    expect(publisher.copyTray.items.find((item) => item.id === "video-url")?.value).toBe("https://youtu.be/demo");
    expect(publisher.copyTray.exportMarkdown).toContain("Required gaps: none");

    const html = renderProtoPediaPublisherHtml(publisher, {
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
      liveAuditApiPath: "/api/publisher/live-audit"
    });
    expect(html).toContain("Public URL desk");
    expect(html).toContain('name="targetUrl"');
    expect(html).toContain('value="https://service.example.run.app"');
    expect(html).toContain('value="https://protopedia.net/prototype/1234"');
    expect(html).toContain('value="https://youtu.be/demo"');
    expect(html).toContain('id="publisher-live-audit-run"');
    expect(html).toContain("Run live audit");
    expect(html).toContain("Refresh package");
    expect(html).toContain('id="publisher-live-audit-payload"');
    expect(html).toContain("/api/publisher/live-audit");
    expect(html).toContain("verificationDeskHref");
  });

  test("turns publisher assets into a live audit receipt with external gaps explicit", () => {
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
    const proofLinks = publisherProofLinks(publisher);

    expect(proofLinks.map((link) => link.id)).toEqual(["github", "cloud-run", "ci", "architecture", "story", "protopedia", "video"]);
    expect(proofLinks.find((link) => link.id === "protopedia")).toMatchObject({ value: "", href: "#" });

    const audit = buildProtoPediaPublisherLiveAudit({
      publisher,
      proofVerification: {
        checkedAt: "2026-06-26T00:00:00.000Z",
        verifiedCount: 5,
        totalCount: 7,
        score: 71,
        results: proofLinks.map((link) => ({
          id: link.id,
          label: link.label,
          status: link.value ? "pass" : "block",
          httpStatus: link.value ? 200 : undefined,
          evidence: link.value ? "Public URL responded with HTTP 200." : "No public URL is attached.",
          action: link.value ? "Keep this link attached to the launch room." : `Attach a public URL for ${link.label}.`
        }))
      }
    });

    expect(audit).toMatchObject({
      source: "submission-publisher",
      publisherId: publisher.id,
      liveReadiness: "needs-live-repair",
      status: "action-required",
      verifiedCount: 5,
      totalCount: 7,
      assetReadyCount: 5,
      assetTotalCount: 7,
      requiredCopyReadyCount: 13,
      requiredCopyTotalCount: 15
    });
    expect(audit.rows.filter((row) => row.status === "block").map((row) => row.id)).toEqual(["protopedia", "video"]);
    expect(verifyWorkflowLiveProofAuditReceipt({ checksum: audit.checksum, payload: audit.payload })).toMatchObject({
      status: "verified"
    });
  });

  test("marks publisher live audit ready when every supplied public asset verifies", () => {
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
      squadContract,
      submissionUrls: {
        videoUrl: "https://youtu.be/demo",
        protopediaUrl: "https://protopedia.net/prototype/1234"
      }
    });
    const publisher = buildProtoPediaPublisher({
      baseUrl,
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch,
      finalist,
      submissionUrls: {
        deployedUrl: "https://service.example.run.app",
        videoUrl: "https://youtu.be/demo",
        protopediaUrl: "https://protopedia.net/prototype/1234"
      }
    });
    const proofLinks = publisherProofLinks(publisher);
    const audit = buildProtoPediaPublisherLiveAudit({
      publisher,
      proofVerification: {
        checkedAt: "2026-06-26T00:00:00.000Z",
        verifiedCount: proofLinks.length,
        totalCount: proofLinks.length,
        score: 100,
        results: proofLinks.map((link) => ({
          id: link.id,
          label: link.label,
          status: "pass",
          httpStatus: 200,
          evidence: "Public URL responded with HTTP 200.",
          action: "Keep this link attached to the launch room."
        }))
      }
    });

    expect(audit).toMatchObject({
      liveReadiness: "live-ready",
      status: "verified",
      score: 100,
      verifiedCount: 7,
      totalCount: 7,
      requiredCopyReadyCount: 15,
      requiredCopyTotalCount: 15
    });
    expect(audit.verificationRequestJson).toContain("workflow-live-proof-audit.v1");
    expect(audit.verificationDeskHref).toContain("/receipt-verifier?request=");
    expect(audit.verificationDeskHref).toContain("verify=1");
    expect(decodeURIComponent(audit.verificationDeskHref)).toContain("workflow-live-proof-audit.v1");
    expect(audit.exportMarkdown).toContain("All launch proof links are reachable for external review.");
  });
});
