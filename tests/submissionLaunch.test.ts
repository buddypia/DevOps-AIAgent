import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildWinningAutopilot } from "../src/autopilot";
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
import { buildJudgeProof } from "../src/proof";
import type { CiProof } from "../src/proof";
import { buildProtoPediaPublisher } from "../src/publisher";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildSubmissionLaunchGate } from "../src/submissionLaunch";
import { buildWinningStrategy } from "../src/strategy";

function fixture() {
  const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
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
  const gemini = {
    ...localGeminiRecommendation(recommendation, "test"),
    source: "gemini" as const,
    model: "gemini-3.5-flash"
  };
  const proof = buildJudgeProof({ baseUrl, recommendation, strategy, mission, opsDrill, gemini, ci });
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
  return { mvpAudit, dossier, proof, publisher };
}

describe("submission launch gate", () => {
  test("keeps the launch blocked until ProtoPedia and video URLs are supplied", () => {
    const launch = buildSubmissionLaunchGate(fixture());

    expect(launch.readiness).toBe("needs-external-urls");
    expect(launch.urlStatuses.map((item) => item.status)).toEqual(["missing", "missing"]);
    expect(launch.checklist.find((item) => item.id === "protopedia-url")?.status).toBe("missing");
    expect(launch.checklist.find((item) => item.id === "video-url")?.status).toBe("missing");
    expect(launch.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "submission.launch",
      readiness: "needs-external-urls"
    });
  });

  test("promotes to submit-ready when valid external URLs are supplied", () => {
    const launch = buildSubmissionLaunchGate({
      ...fixture(),
      protopediaUrl: "https://protopedia.net/prototype/999999",
      videoUrl: "https://youtu.be/demo1234567"
    });

    expect(launch.launchScore).toBeGreaterThanOrEqual(88);
    expect(launch.readiness).toBe("submit-ready");
    expect(launch.urlStatuses.map((item) => item.status)).toEqual(["ready", "ready"]);
    expect(launch.checklist.every((item) => item.status === "ready")).toBe(true);
    expect(launch.submitPacket).toMatchObject({
      githubUrl: "https://github.com/buddypia/DevOps-AIAgent",
      deployedUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
      protopediaUrl: "https://protopedia.net/prototype/999999",
      videoUrl: "https://youtu.be/demo1234567",
      protoPediaTag: "findy_hackathon"
    });
  });

  test("rejects malformed external URLs instead of marking the launch ready", () => {
    const launch = buildSubmissionLaunchGate({
      ...fixture(),
      protopediaUrl: "https://example.com/not-protopedia",
      videoUrl: "not-a-url"
    });

    expect(launch.readiness).toBe("invalid-urls");
    expect(launch.urlStatuses.map((item) => item.status)).toEqual(["invalid", "invalid"]);
    expect(launch.verdict).toBe("Fix invalid external URL evidence");
  });
});
