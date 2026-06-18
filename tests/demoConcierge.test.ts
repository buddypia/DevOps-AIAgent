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
import { buildProtoPediaPublisher } from "../src/publisher";
import { buildSecurityReview } from "../src/security";
import { SUBMISSION_PROOF } from "../src/submission";
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

function fixture() {
  const baseUrl = SUBMISSION_PROOF.deployedUrl;
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査員の最初の1クリックを固定する。");
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
  const submissionLaunch = buildSubmissionLaunchGate({ mvpAudit, dossier, proof, publisher });
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

  return buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command,
    battlecard,
    userPilot,
    pilotEconomics
  });
}

describe("demo concierge", () => {
  test("turns first-run complexity into persona-specific first clicks", () => {
    const concierge = fixture();

    expect(concierge.conciergeScore).toBeGreaterThanOrEqual(87);
    expect(concierge.readiness).toBe("external-watch");
    expect(concierge.lanes.map((lane) => lane.id)).toEqual(["judge", "buyer", "submitter"]);
    expect(concierge.lanes.every((lane) => lane.steps.length >= 2)).toBe(true);
    expect(concierge.lanes.find((lane) => lane.id === "buyer")?.steps[0]?.endpoint).toBe(`${SUBMISSION_PROOF.deployedUrl}/api/pilot-economics`);
    expect(concierge.routeLock).toMatchObject({
      readiness: "locked-external-watch",
      proofLinkScore: 100
    });
    expect(concierge.routeLock.lockScore).toBeGreaterThanOrEqual(92);
    expect(concierge.routeLock.lockedSteps.map((step) => step.id)).toEqual([
      "judge-command",
      "judge-acceptance",
      "submitter-battlecard",
      "buyer-economics",
      "submitter-prize"
    ]);
    expect(concierge.routeLock.bypassedDistractions.map((item) => item.id)).toEqual(["feature-tour", "free-navigation", "external-gap-hiding"]);
    expect(concierge.focusLock).toMatchObject({
      readiness: "focus-external-watch",
      firstScreen: "Judge Command Center",
      visibleCount: 6,
      deferredCount: 2,
      blockedCount: 0
    });
    expect(concierge.focusLock.focusScore).toBeGreaterThanOrEqual(92);
    expect(concierge.focusLock.oneMinutePath).toEqual([
      "Judge Command Center",
      "Acceptance Matrix",
      "Competitive Battlecard",
      "Pilot Economics"
    ]);
    expect(concierge.focusLock.rules.map((rule) => rule.id)).toEqual([
      "show-command-first",
      "show-acceptance-second",
      "show-objection-third",
      "show-buyer-fourth",
      "show-prize-close",
      "defer-marketplace-browsing",
      "defer-raw-json",
      "keep-external-gaps-visible"
    ]);
    expect(concierge.focusLock.rules.find((rule) => rule.id === "keep-external-gaps-visible")).toMatchObject({
      action: "keep-visible",
      status: "watch"
    });
    expect(concierge.successCriteria.map((item) => item.id)).toEqual([
      "single-next-click",
      "three-persona-lanes",
      "business-value-proof",
      "competitive-answer-proof"
    ]);
    expect(concierge.frictionCuts.map((item) => item.id)).toEqual(["feature-overload", "business-proof-gap", "competitor-drift"]);
    expect(concierge.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "demo.concierge",
      routeLock: {
        readiness: "locked-external-watch",
        proofLinkScore: 100,
        lockedSteps: expect.arrayContaining([
          expect.objectContaining({
            id: "judge-command",
            proofUrl: `${SUBMISSION_PROOF.deployedUrl}/api/judge-command-center`
          })
        ])
      },
      focusLock: {
        readiness: "focus-external-watch",
        firstScreen: "Judge Command Center",
        deferredCount: 2
      },
      endpoints: {
        demoConcierge: `${SUBMISSION_PROOF.deployedUrl}/api/demo-concierge`
      }
    });
  });
});
