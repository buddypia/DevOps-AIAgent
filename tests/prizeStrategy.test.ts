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
import { buildLiveEvidenceRun } from "../src/liveEvidence";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMissionRun } from "../src/mission";
import { buildMoatStressTest } from "../src/moatStress";
import { buildMvpAudit } from "../src/mvpAudit";
import { buildObservabilityOracle } from "../src/observabilityOracle";
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
  "task.delegate",
  "external.evidence",
  "evidence.monitor",
  "observability.oracle",
  "demo.receipt",
  "acceptance.matrix",
  "release.drift",
  "pilot.economics",
  "demo.concierge",
  "judge.command",
  "judge.rehearsal",
  "winner.packet",
  "submission.runway",
  "prize.strategy",
  "win.gap.radar",
  "submission.closeout",
  "deploy.recover",
  "competitive.battlecard",
  "win.autopilot"
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

function passedLiveProbe(id: string, baseUrl: string) {
  return {
    id,
    label: id,
    status: "passed" as const,
    score: 100,
    url: `${baseUrl}/${id}`,
    evidence: `${id} passed`,
    required: true
  };
}

function fixture() {
  const baseUrl = SUBMISSION_PROOF.deployedUrl;
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査5項目の優勝作戦を検証する。");
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
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildLiveEvidenceRun({
      baseUrl,
      generatedAt: "2026-06-18T00:00:00.000Z",
      probes: [
        passedLiveProbe("health", baseUrl),
        passedLiveProbe("agent-card", baseUrl),
        passedLiveProbe("a2a", baseUrl),
        passedLiveProbe("ci", baseUrl)
      ]
    }),
    opsDrill,
    pilotEconomics
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
    observabilityOracle,
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

  return buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command,
    battlecard,
    demoConcierge,
    pilotEconomics,
    observabilityOracle,
    releaseDrift
  });
}

describe("prize strategy board", () => {
  test("turns judge evidence into a five-criterion winning plan", () => {
    const board = fixture();

    expect(board.prizeScore).toBeGreaterThanOrEqual(88);
    expect(board.readiness).toBe("finalist-track");
    expect(board.criteria.map((criterion) => criterion.id)).toEqual([
      "agent-centrality",
      "approach",
      "usability",
      "practicality",
      "implementation"
    ]);
    expect(board.criteria.every((criterion) => criterion.targetScore === 92)).toBe(true);
    expect(board.criteria.find((criterion) => criterion.id === "usability")).toMatchObject({
      status: "winner-ready",
      decisiveProof: expect.stringContaining("Prize Usability Lock")
    });
    expect(board.usabilityLock).toMatchObject({
      readiness: "usability-external-watch",
      internalScore: 100,
      sealedCount: 6,
      watchCount: 1,
      missingCount: 0,
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "route-lock", status: "sealed" }),
        expect.objectContaining({ id: "focus-path", status: "sealed" }),
        expect.objectContaining({ id: "external-gap-honesty", status: "watch" })
      ])
    });
    expect(board.proofMoves.map((move) => move.id)).toEqual([
      "concierge",
      "route-lock",
      "usability-lock",
      "command",
      "battlecard",
      "objection-replay",
      "truth-table",
      "public-release",
      "operations-value",
      "buyer-value"
    ]);
    expect(board.proofMoves.find((move) => move.id === "objection-replay")).toMatchObject({
      screen: "Competitive Battlecard",
      endpoint: `${SUBMISSION_PROOF.deployedUrl}/api/competitive-battlecard`,
      proof: expect.stringContaining("replay"),
      score: expect.any(Number)
    });
    expect(board.proofMoves.find((move) => move.id === "objection-replay")?.score).toBeGreaterThanOrEqual(90);
    expect(board.proofMoves.find((move) => move.id === "route-lock")).toMatchObject({
      screen: "Demo Concierge",
      endpoint: `${SUBMISSION_PROOF.deployedUrl}/api/demo-concierge`,
      proof: expect.stringContaining("route lock"),
      score: expect.any(Number)
    });
    expect(board.proofMoves.find((move) => move.id === "route-lock")?.score).toBeGreaterThanOrEqual(92);
    expect(board.proofMoves.find((move) => move.id === "usability-lock")).toMatchObject({
      screen: "Prize Strategy Board",
      endpoint: `${SUBMISSION_PROOF.deployedUrl}/api/prize-strategy`,
      proof: expect.stringContaining("internal usability"),
      score: 100
    });
    expect(board.proofMoves.find((move) => move.id === "operations-value")).toMatchObject({
      screen: "Observability Oracle",
      endpoint: `${SUBMISSION_PROOF.deployedUrl}/api/observability-oracle`,
      proof: expect.stringContaining("operational buyer proof")
    });
    expect(board.pitchOrder[0]).toMatchObject({ screen: "Demo Concierge", proofMoveId: "concierge" });
    expect(board.criteria.find((criterion) => criterion.id === "usability")?.decisiveProof).toContain("Judge Route Lock");
    expect(board.criteria.find((criterion) => criterion.id === "approach")?.decisiveProof).toContain("Objection Replay");
    expect(board.pitchOrder.find((step) => step.id === "why-now")).toMatchObject({
      screen: "Competitive Battlecard",
      proofMoveId: "objection-replay"
    });
    expect(board.pitchOrder.find((step) => step.id === "buyer-value")).toMatchObject({
      screen: "Observability Oracle + Pilot Economics",
      proofMoveId: "operations-value"
    });
    expect(board.pitchOrder).toHaveLength(5);
    expect(board.risks.map((risk) => risk.id)).toEqual(expect.arrayContaining(["submission-assets", "demo-receipt"]));
    expect(board.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "prize.strategy",
      usabilityLock: {
        readiness: "usability-external-watch",
        internalScore: 100,
        checks: expect.arrayContaining([
          expect.objectContaining({ id: "external-gap-honesty", status: "watch" })
        ])
      },
      competitiveBattlecard: {
        objectionReplay: {
          readiness: "replay-ready",
          weakestCompetitor: "Google ADK / Gemini Enterprise",
          steps: expect.arrayContaining([
            expect.objectContaining({
              id: "proof-route",
              proofUrl: `${SUBMISSION_PROOF.deployedUrl}/api/live-evidence`
            })
          ])
        }
      },
      demoConcierge: {
        readiness: expect.any(String),
        routeLock: {
          readiness: "locked-external-watch",
          score: expect.any(Number),
          steps: expect.arrayContaining([
            expect.objectContaining({
              id: "judge-command",
              proofUrl: `${SUBMISSION_PROOF.deployedUrl}/api/judge-command-center`
            })
          ])
        }
      },
      observabilityOracle: {
        readiness: expect.any(String),
        score: expect.any(Number)
      },
      endpoints: {
        demoConcierge: `${SUBMISSION_PROOF.deployedUrl}/api/demo-concierge`,
        prizeStrategy: `${SUBMISSION_PROOF.deployedUrl}/api/prize-strategy`,
        competitiveBattlecard: `${SUBMISSION_PROOF.deployedUrl}/api/competitive-battlecard`,
        observabilityOracle: `${SUBMISSION_PROOF.deployedUrl}/api/observability-oracle`
      }
    });
  });
});
