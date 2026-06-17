import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildWinningAutopilot } from "../src/autopilot";
import { buildSquadContract } from "../src/contracts";
import { buildDemoRunway } from "../src/demoRunway";
import { buildSubmissionDossier } from "../src/dossier";
import { buildFinalistSimulation } from "../src/finalist";
import { buildImpactCase } from "../src/impact";
import { buildJudgeBrief } from "../src/judgeBrief";
import { buildJudgeDrill } from "../src/judgeDrill";
import { buildJudgeTour } from "../src/judgeTour";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMissionRun } from "../src/mission";
import { buildMvpAudit } from "../src/mvpAudit";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildJudgeProof } from "../src/proof";
import type { CiProof } from "../src/proof";
import { buildProtoPediaPublisher } from "../src/publisher";
import { buildSecurityReview } from "../src/security";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildSubmissionLaunchGate } from "../src/submissionLaunch";
import { buildWinningStrategy } from "../src/strategy";

const allowlist = {
  exactIpCount: 126,
  localDevelopmentCidrCount: 2,
  rakutenMobileCidrCount: 65
};

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

function fixture(options: { protopediaUrl?: string; videoUrl?: string } = {}) {
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
  const judgeBrief = buildJudgeBrief({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    dossier,
    proof,
    finalist
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist,
    ci,
    geminiSecretConfigured: true
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: options.protopediaUrl,
    videoUrl: options.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const tour = buildJudgeTour({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    judgeBrief,
    impactCase,
    securityReview,
    proof,
    demoRunway,
    submissionLaunch
  });
  return { tour, submissionLaunch };
}

describe("judge tour", () => {
  test("turns the proof stack into a judge walkthrough while keeping external URLs honest", () => {
    const { tour } = fixture();

    expect(tour.tourScore).toBeGreaterThanOrEqual(84);
    expect(tour.readiness).toBe("external-url-gaps");
    expect(tour.totalSeconds).toBe(90);
    expect(tour.steps.map((step) => step.id)).toEqual(["judge-brief", "market-intel", "impact-case", "security-review", "judge-proof", "submission-launch"]);
    expect(tour.steps.find((step) => step.id === "impact-case")?.endpoint).toContain("/api/impact-case");
    expect(tour.claims.map((claim) => claim.id)).toEqual(
      expect.arrayContaining(["agent-market", "competitive-moat", "practical-value", "trust-boundary", "submission-honesty"])
    );
    expect(tour.objections.map((objection) => objection.id)).toEqual(expect.arrayContaining(["dashboard", "competition", "practicality", "safe-demo", "submission"]));
    expect(tour.blockers.map((blocker) => blocker.id)).toEqual(expect.arrayContaining(["protopedia-url", "video-url"]));
    expect(tour.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "judge.tour",
      readiness: "external-url-gaps",
      totalSeconds: 90
    });
  });

  test("promotes to walkthrough-ready when final external URLs are valid", () => {
    const { tour, submissionLaunch } = fixture({
      protopediaUrl: "https://protopedia.net/prototype/999999",
      videoUrl: "https://youtu.be/demo1234567"
    });

    expect(submissionLaunch.readiness).toBe("submit-ready");
    expect(tour.tourScore).toBeGreaterThanOrEqual(88);
    expect(tour.readiness).toBe("walkthrough-ready");
    expect(tour.blockers).toHaveLength(0);
    expect(tour.steps.find((step) => step.id === "submission-launch")?.status).toBe("ready");
  });

  test("marks the walkthrough as needs-fix when final URLs are malformed", () => {
    const { tour } = fixture({
      protopediaUrl: "https://example.com/not-protopedia",
      videoUrl: "not-a-url"
    });

    expect(tour.readiness).toBe("needs-fix");
    expect(tour.steps.find((step) => step.id === "submission-launch")?.status).toBe("blocked");
    expect(tour.blockers.map((blocker) => blocker.id)).toEqual(expect.arrayContaining(["protopedia-url", "video-url"]));
  });
});
