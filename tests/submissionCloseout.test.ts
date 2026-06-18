import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildWinningAutopilot } from "../src/autopilot";
import { buildSubmissionCloseoutWorkbench } from "../src/submissionCloseout";
import { buildSquadContract } from "../src/contracts";
import { buildDemoRunway } from "../src/demoRunway";
import { buildSubmissionDossier } from "../src/dossier";
import { buildFinalistSimulation } from "../src/finalist";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMissionRun } from "../src/mission";
import { buildMvpAudit } from "../src/mvpAudit";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildJudgeProof, type CiProof } from "../src/proof";
import { buildProtoPediaPublisher } from "../src/publisher";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildSubmissionLaunchGate } from "../src/submissionLaunch";
import { buildWinningStrategy } from "../src/strategy";

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
  const baseUrl = SUBMISSION_PROOF.deployedUrl;
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "提出直前の外部作業をcloseoutする。");
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
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
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

  return buildSubmissionCloseoutWorkbench({
    baseUrl,
    publisher,
    dossier,
    demoRunway,
    proof,
    launchGate
  });
}

describe("submission closeout workbench", () => {
  test("turns missing external URLs into an ordered closeout workbench", () => {
    const closeout = fixture();

    expect(closeout.readiness).toBe("needs-closeout");
    expect(closeout.closeoutScore).toBeGreaterThanOrEqual(80);
    expect(closeout.nextAction.id).toBe("record-video");
    expect(closeout.workItems.map((item) => item.id)).toEqual([
      "paste-protopedia-fields",
      "attach-architecture",
      "record-video",
      "publish-protopedia",
      "seal-launch-gate",
      "final-submit",
      "receipt-check"
    ]);
    expect(closeout.workItems.find((item) => item.id === "record-video")).toMatchObject({
      status: "watch",
      priority: "now"
    });
    expect(closeout.workItems.find((item) => item.id === "publish-protopedia")).toMatchObject({
      status: "watch",
      priority: "now"
    });
    expect(closeout.copyFields.length).toBeGreaterThanOrEqual(8);
    expect(closeout.videoSteps.length).toBeGreaterThanOrEqual(7);
    expect(closeout.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "submission.closeout",
      readiness: "needs-closeout",
      endpoints: {
        closeout: `${SUBMISSION_PROOF.deployedUrl}/api/submission-closeout`,
        launchGate: `${SUBMISSION_PROOF.deployedUrl}/api/submission-launch`
      }
    });
  });

  test("promotes the closeout to ready when valid external URLs are supplied", () => {
    const closeout = fixture({
      protopediaUrl: "https://protopedia.net/prototype/999999",
      videoUrl: "https://youtu.be/demo1234567"
    });

    expect(closeout.readiness).toBe("ready-to-submit");
    expect(closeout.workItems.every((item) => item.status === "ready")).toBe(true);
    expect(closeout.submitPacket).toMatchObject({
      protopediaUrl: "https://protopedia.net/prototype/999999",
      videoUrl: "https://youtu.be/demo1234567"
    });
  });

  test("blocks the closeout when external URL evidence is malformed", () => {
    const closeout = fixture({
      protopediaUrl: "https://example.com/not-protopedia",
      videoUrl: "nope"
    });

    expect(closeout.readiness).toBe("invalid-evidence");
    expect(closeout.nextAction.status).toBe("blocked");
    expect(closeout.workItems.find((item) => item.id === "record-video")?.status).toBe("blocked");
    expect(closeout.workItems.find((item) => item.id === "publish-protopedia")?.status).toBe("blocked");
  });
});
