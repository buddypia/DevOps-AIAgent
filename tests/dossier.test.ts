import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildWinningAutopilot } from "../src/autopilot";
import { buildSquadContract } from "../src/contracts";
import { buildDemoRunway } from "../src/demoRunway";
import { buildSubmissionDossier } from "../src/dossier";
import { buildFinalistSimulation } from "../src/finalist";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildJudgeProof } from "../src/proof";
import type { CiProof } from "../src/proof";
import { buildProtoPediaPublisher } from "../src/publisher";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildWinningStrategy } from "../src/strategy";

describe("submission dossier", () => {
  test("packages copy blocks, proof links, and recording steps for final external submission", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const opsDrill = buildOpsDrill(recommendation, strategy);
    const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
    const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
    const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
    const finalist = buildFinalistSimulation({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, judgeDrill, squadContract });
    const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
    const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
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
    const proof = buildJudgeProof({
      baseUrl,
      recommendation,
      strategy,
      mission,
      opsDrill,
      gemini: localGeminiRecommendation(recommendation, "test"),
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

    expect(dossier.dossierScore).toBeGreaterThanOrEqual(84);
    expect(dossier.readiness).toBe("needs-external-urls");
    expect(dossier.copyBlocks.map((block) => block.id)).toEqual(
      expect.arrayContaining(["title", "one-liner", "problem", "users", "features", "technology", "demo-flow", "judge-proof", "tags"])
    );
    expect(dossier.links.map((link) => link.id)).toEqual(expect.arrayContaining(["github", "cloud-run", "ci", "architecture", "protopedia", "video"]));
    expect(dossier.links.filter((link) => link.status === "watch").map((link) => link.id)).toEqual(expect.arrayContaining(["protopedia", "video"]));
    expect(dossier.recordingPlan[0]).toContain("Market Intel");
    expect(dossier.recordingPlan[1]).toContain("MVP Audit");
    expect(dossier.recordingPlan[2]).toContain("Win Autopilot");
    expect(dossier.handoffPacket.submitFields.map((field) => field.id)).toEqual(["github-url", "deployed-url", "protopedia-url", "video-url", "findy-tag"]);
    expect(dossier.handoffPacket.submitFields.find((field) => field.id === "findy-tag")).toMatchObject({
      value: "findy_hackathon",
      status: "ready"
    });
    expect(dossier.handoffPacket.protopediaFields.map((field) => field.id)).toEqual(expect.arrayContaining(["problem", "features", "technology", "tags"]));
    expect(dossier.handoffPacket.videoChapters.length).toBeGreaterThanOrEqual(8);
    expect(dossier.handoffPacket.missingOnly.map((item) => item.id)).toEqual(expect.arrayContaining(["protopedia-url", "video-url"]));
    expect(dossier.markdown).toContain("30秒動画録画順");
    expect(dossier.markdown).toContain("提出フォームパケット");
    expect(dossier.markdown).toContain("動画チャプター");
    expect(dossier.markdown).toContain("needs external URL");
    expect(dossier.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "submission.dossier",
      readiness: "needs-external-urls",
      handoffPacket: {
        submitFields: expect.arrayContaining([expect.objectContaining({ id: "github-url", status: "ready" })]),
        videoChapters: expect.arrayContaining([expect.objectContaining({ id: "proof-first" })]),
        missingOnly: expect.arrayContaining([expect.objectContaining({ id: "protopedia-url" })])
      }
    });
  });
});
