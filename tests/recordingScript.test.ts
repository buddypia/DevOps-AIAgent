import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildWinningAutopilot } from "../src/autopilot";
import { buildCompetitiveBattlecard } from "../src/competitiveBattlecard";
import { buildSquadContract } from "../src/contracts";
import { buildDemoRunway } from "../src/demoRunway";
import { buildSubmissionDossier } from "../src/dossier";
import { buildFinalistSimulation } from "../src/finalist";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMissionRun } from "../src/mission";
import { buildMoatStressTest } from "../src/moatStress";
import { buildMvpAudit } from "../src/mvpAudit";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildJudgeProof, type CiProof } from "../src/proof";
import { buildProtoPediaPublisher } from "../src/publisher";
import { buildRecordingScriptPage, renderRecordingScriptHtml } from "../src/recordingScript";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildSubmissionCloseoutWorkbench } from "../src/submissionCloseout";
import { buildSubmissionLaunchGate } from "../src/submissionLaunch";
import { buildWinningStrategy } from "../src/strategy";

const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];

const ci: CiProof = {
  status: "passed",
  conclusion: "success",
  url: SUBMISSION_PROOF.ciWorkflowUrl,
  workflowUrl: SUBMISSION_PROOF.ciWorkflowUrl,
  branch: "main",
  checkedAt: "2026-06-18T00:00:00.000Z",
  evidence: "Latest main CI run completed successfully.",
  runId: 1
};

function fixture(input: { protopediaUrl?: string; videoUrl?: string } = {}) {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const mission = buildMissionRun(recommendation, strategy, "30秒動画の録画台本をGETで出す。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
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
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher, battlecard });
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: {
      ...localGeminiRecommendation(recommendation, "test"),
      source: "gemini" as const,
      model: "gemini-3.5-flash"
    },
    ci
  });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const launchGate = buildSubmissionLaunchGate({
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const closeout = buildSubmissionCloseoutWorkbench({
    baseUrl,
    publisher,
    dossier,
    demoRunway,
    proof,
    launchGate
  });
  const page = buildRecordingScriptPage({
    baseUrl,
    pitch,
    demoRunway,
    closeout,
    generatedAt: "2026-06-18T00:00:00.000Z"
  });

  return { page };
}

describe("recording script page", () => {
  test("turns pitch, demo runway, and closeout locks into a direct-open teleprompter", () => {
    const { page } = fixture();

    expect(page.readiness).toBe("recording-external-watch");
    expect(page.summary).toMatchObject({
      targetDurationSeconds: 30,
      videoLockReadiness: "recording-locked"
    });
    expect(page.summary.chapterCount).toBeGreaterThanOrEqual(7);
    expect(page.summary.externalGapCount).toBeGreaterThan(0);
    expect(page.chapters[0]).toMatchObject({
      timeRange: expect.stringContaining("0-"),
      evidenceUrl: expect.stringContaining("https://")
    });
    expect(page.videoChecks.map((check) => check.id)).toEqual(
      expect.arrayContaining(["public-opening", "thirty-second-route", "judge-proof-receipt", "competitive-objection", "publish-url"])
    );
    expect(page.publishSteps.map((step) => step.id)).toEqual(["record", "publish-video", "paste-protopedia", "seal-launch"]);
    expect(page.links.map((link) => link.url)).toEqual(expect.arrayContaining([`${baseUrl}/recording-script`, `${baseUrl}/submission-assets`, `${baseUrl}/mvp-readiness`]));
    expect(page.a2aPayload).toMatchObject({
      skill: "recording.script",
      readiness: "recording-external-watch",
      endpoints: {
        recordingScript: `${baseUrl}/recording-script`,
        recordingScriptJson: `${baseUrl}/api/recording-script`
      }
    });
  });

  test("promotes the script when video URL is ready", () => {
    const { page } = fixture({
      protopediaUrl: "https://protopedia.net/prototype/999999",
      videoUrl: "https://youtu.be/demo1234567"
    });

    expect(page.readiness).toBe("recording-ready");
    expect(page.summary.externalGapCount).toBe(0);
    expect(page.publishSteps.find((step) => step.id === "publish-video")?.status).toBe("ready");
  });

  test("renders safe HTML for recording operators", () => {
    const { page } = fixture();
    page.chapters[0].narration = "<script>alert('record')</script>";

    const html = renderRecordingScriptHtml(page);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Recording Script");
    expect(html).toContain("30-Second Chapters");
    expect(html).toContain("Video Proof Lock");
    expect(html).toContain("&lt;script&gt;alert(&#39;record&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('record')</script>");
  });
});
