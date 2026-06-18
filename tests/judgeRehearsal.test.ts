import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildJudgeAcceptanceMatrix } from "../src/acceptanceMatrix";
import { buildWinningAutopilot } from "../src/autopilot";
import { buildCompetitiveBattlecard } from "../src/competitiveBattlecard";
import { buildSquadContract } from "../src/contracts";
import { buildJudgeDemoReceipt } from "../src/demoReceipt";
import { buildDemoConcierge } from "../src/demoConcierge";
import { buildDemoRunway } from "../src/demoRunway";
import { buildSubmissionDossier } from "../src/dossier";
import { buildFinalistSimulation } from "../src/finalist";
import { buildImpactCase } from "../src/impact";
import { buildJudgeBrief } from "../src/judgeBrief";
import { buildJudgeCommandCenter } from "../src/judgeCommandCenter";
import { buildJudgeDrill } from "../src/judgeDrill";
import { buildJudgeRehearsalRoom } from "../src/judgeRehearsal";
import { buildJudgeTour } from "../src/judgeTour";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMissionRun } from "../src/mission";
import { buildMoatStressTest } from "../src/moatStress";
import { buildMvpAudit } from "../src/mvpAudit";
import { buildOpsDrill } from "../src/ops";
import { buildPilotEconomics } from "../src/pilotEconomics";
import { buildPitchRun } from "../src/pitch";
import { buildJudgeProof, type CiProof } from "../src/proof";
import { buildPrizeStrategyBoard } from "../src/prizeStrategy";
import { buildProtoPediaPublisher } from "../src/publisher";
import { buildSecurityReview } from "../src/security";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildSubmissionCloseoutWorkbench } from "../src/submissionCloseout";
import { buildSubmissionLaunchGate } from "../src/submissionLaunch";
import { buildSquadOptimizer } from "../src/squadOptimizer";
import { buildWinningStrategy } from "../src/strategy";
import { buildUserPilotLab } from "../src/userPilot";

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

const allowlist = {
  exactIpCount: 126,
  localDevelopmentCidrCount: 2,
  rakutenMobileCidrCount: 65
};

function fixture(input: { protopediaUrl?: string; videoUrl?: string } = {}) {
  const baseUrl = SUBMISSION_PROOF.deployedUrl;
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査員に90秒で価値を伝えるリハーサルを組む。");
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
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl,
    recommendation,
    strategy,
    moatStress,
    squadOptimizer: buildSquadOptimizer({
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds,
      budget: 140,
      maxSquadSize: 4
    })
  });
  const submissionLaunch = buildSubmissionLaunchGate({
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
    launchGate: submissionLaunch
  });
  const judgeTour = buildJudgeTour({
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
  const acceptance = buildJudgeAcceptanceMatrix({
    baseUrl,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    securityReview,
    demoReceipt
  });
  const command = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard: battlecard,
    judgeTour,
    pilotEconomics
  });
  const concierge = buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command,
    battlecard,
    userPilot,
    pilotEconomics
  });
  const prize = buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command,
    battlecard,
    demoConcierge: concierge,
    pilotEconomics
  });

  return buildJudgeRehearsalRoom({
    baseUrl,
    acceptance,
    command,
    concierge,
    tour: judgeTour,
    prize,
    closeout,
    judgeDrill
  });
}

describe("judge rehearsal room", () => {
  test("turns the first-run surfaces into a 90-second rehearsal", () => {
    const rehearsal = fixture();

    expect(rehearsal.readiness).toBe("external-gap-rehearsal");
    expect(rehearsal.rehearsalScore).toBeGreaterThanOrEqual(80);
    expect(rehearsal.nextRun).toContain("Record");
    expect(rehearsal.segments.map((segment) => segment.id)).toEqual([
      "open-command",
      "first-click",
      "judge-tour",
      "competitive-proof",
      "buyer-proof",
      "submission-close"
    ]);
    expect(rehearsal.questionDeck.length).toBeGreaterThanOrEqual(5);
    expect(rehearsal.scorecard).toHaveLength(5);
    expect(rehearsal.captureChecklist.length).toBeGreaterThanOrEqual(6);
    expect(rehearsal.defenseLock.readiness).toBe("external-gap-defense");
    expect(rehearsal.defenseLock.defenseScore).toBeGreaterThanOrEqual(88);
    expect(rehearsal.defenseLock.checks.map((check) => check.id)).toEqual([
      "ai-necessity-defense",
      "competitor-cross-exam",
      "buyer-value-defense",
      "public-implementation-proof",
      "honest-submission-gap",
      "sixty-second-answer-path"
    ]);
    expect(rehearsal.defenseLock.checks.find((check) => check.id === "sixty-second-answer-path")?.status).toBe("ready");
    expect(rehearsal.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "judge.rehearsal",
      readiness: "external-gap-rehearsal",
      defenseLock: {
        readiness: "external-gap-defense"
      },
      endpoints: {
        rehearsal: `${SUBMISSION_PROOF.deployedUrl}/api/judge-rehearsal`,
        judgeDrill: `${SUBMISSION_PROOF.deployedUrl}/api/judge-drill`,
        submissionCloseout: `${SUBMISSION_PROOF.deployedUrl}/api/submission-closeout`
      }
    });
  });

  test("uses supplied external URLs to make the closeout segment ready", () => {
    const rehearsal = fixture({
      protopediaUrl: "https://protopedia.net/prototype/999999",
      videoUrl: "https://youtu.be/demo1234567"
    });

    expect(rehearsal.segments.find((segment) => segment.id === "submission-close")).toMatchObject({
      status: "ready"
    });
    expect(rehearsal.captureChecklist.find((item) => item.id === "rehearsal-receipt")?.status).toBe("ready");
    expect(rehearsal.defenseLock.checks.find((check) => check.id === "honest-submission-gap")?.status).toBe("ready");
  });

  test("blocks rehearsal when supplied external evidence is malformed", () => {
    const rehearsal = fixture({
      protopediaUrl: "https://example.com/not-protopedia",
      videoUrl: "not-a-url"
    });

    expect(rehearsal.readiness).toBe("needs-rehearsal-fix");
    expect(rehearsal.segments.find((segment) => segment.id === "submission-close")).toMatchObject({
      status: "blocked"
    });
    expect(rehearsal.questionDeck.find((question) => question.id === "submission-gap")?.status).toBe("blocked");
    expect(rehearsal.defenseLock.readiness).toBe("needs-defense-proof");
    expect(rehearsal.defenseLock.checks.find((check) => check.id === "honest-submission-gap")?.status).toBe("blocked");
  });
});
