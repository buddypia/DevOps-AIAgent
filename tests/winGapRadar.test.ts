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
import { buildReleaseDriftGuard, type ReleaseDriftProbe } from "../src/releaseDrift";
import { buildSecurityReview } from "../src/security";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildSubmissionLaunchGate } from "../src/submissionLaunch";
import { buildSquadOptimizer } from "../src/squadOptimizer";
import { buildWinningStrategy } from "../src/strategy";
import { buildUserPilotLab } from "../src/userPilot";
import { buildWinGapRadar } from "../src/winGapRadar";

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

const requiredSkillIds = [
  "evidence.monitor",
  "demo.receipt",
  "acceptance.matrix",
  "release.drift",
  "pilot.economics",
  "demo.concierge",
  "judge.command",
  "prize.strategy",
  "deploy.recover",
  "competitive.battlecard",
  "win.autopilot",
  "win.gap.radar"
];

const passedProbe = (id: string): ReleaseDriftProbe => ({
  id,
  label: id,
  status: "passed",
  score: 100,
  url: `${SUBMISSION_PROOF.deployedUrl}/${id}`,
  evidence: `${id} passed`,
  required: true
});

function fixture() {
  const baseUrl = SUBMISSION_PROOF.deployedUrl;
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "競合/SWOTをMVP改善backlogへ変換する。");
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
  const submissionLaunch = buildSubmissionLaunchGate({
    mvpAudit,
    dossier,
    proof,
    publisher
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
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl,
    recommendation,
    strategy,
    moatStress,
    squadOptimizer
  });
  const releaseDrift = buildReleaseDriftGuard({
    currentBaseUrl: baseUrl,
    targetBaseUrl: baseUrl,
    expectedSkillIds: requiredSkillIds,
    observedSkillIds: requiredSkillIds,
    requiredSkillIds,
    generatedAt: "2026-06-18T00:00:00.000Z",
    probes: [
      passedProbe("target-health"),
      passedProbe("agent-card-skill-surface"),
      passedProbe("acceptance-endpoint"),
      passedProbe("a2a-artifact"),
      passedProbe("ci-main")
    ]
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
    demoReceipt,
    releaseDrift
  });
  const command = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard: battlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command,
    battlecard,
    userPilot,
    pilotEconomics
  });
  const prizeStrategy = buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command,
    battlecard,
    demoConcierge,
    pilotEconomics,
    releaseDrift
  });

  return buildWinGapRadar({
    baseUrl,
    strategy,
    marketIntel,
    moatStress,
    battlecard,
    mvpAudit,
    finalist,
    acceptance,
    prizeStrategy,
    submissionLaunch
  });
}

describe("win gap radar", () => {
  test("turns competitive/SWOT analysis into prioritized MVP feature bets", () => {
    const radar = fixture();

    expect(radar.radarScore).toBeGreaterThanOrEqual(70);
    expect(radar.readiness).toBe("mvp-gap-watch");
    expect(radar.mvpDecision).toContain("ProtoPedia作品URL");
    expect(radar.lanes.map((lane) => lane.id)).toEqual([
      "agent-centrality",
      "approach-moat",
      "usability-first-run",
      "practical-value",
      "implementation-proof",
      "submission-closeout"
    ]);
    expect(radar.lanes.find((lane) => lane.id === "approach-moat")?.competitorPressure).toContain("代替");
    expect(radar.lanes.find((lane) => lane.id === "submission-closeout")).toMatchObject({
      status: "close-now",
      priority: "now"
    });
    expect(radar.featureBets[0]).toMatchObject({
      id: "submission-closeout",
      priority: "now",
      status: "close-now"
    });
    expect(radar.cutList.map((item) => item.id)).toEqual(expect.arrayContaining(["full-workflow-builder", "marketplace-payments"]));
    expect(radar.externalGaps.map((gap) => gap.id)).toEqual(expect.arrayContaining(["protopedia", "video"]));
    expect(radar.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "win.gap.radar",
      readiness: "mvp-gap-watch",
      endpoints: {
        winGapRadar: `${SUBMISSION_PROOF.deployedUrl}/api/win-gap-radar`,
        competitiveBattlecard: `${SUBMISSION_PROOF.deployedUrl}/api/competitive-battlecard`,
        submissionLaunch: `${SUBMISSION_PROOF.deployedUrl}/api/submission-launch`
      }
    });
  });
});
