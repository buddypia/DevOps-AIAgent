import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildJudgeAcceptanceMatrix } from "../src/acceptanceMatrix";
import { buildWinningAutopilot } from "../src/autopilot";
import { buildCompetitiveBattlecard } from "../src/competitiveBattlecard";
import { buildSquadContract } from "../src/contracts";
import { buildJudgeDemoReceipt } from "../src/demoReceipt";
import { buildDemoRunway } from "../src/demoRunway";
import { buildSubmissionDossier } from "../src/dossier";
import { buildFinalistSimulation } from "../src/finalist";
import { buildImpactCase } from "../src/impact";
import { buildJudgeBrief } from "../src/judgeBrief";
import { buildJudgeCommandCenter } from "../src/judgeCommandCenter";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMissionRun } from "../src/mission";
import { buildMoatStressTest } from "../src/moatStress";
import { buildMvpAudit } from "../src/mvpAudit";
import { buildOpsDrill } from "../src/ops";
import { buildPilotEconomics } from "../src/pilotEconomics";
import { buildPitchRun } from "../src/pitch";
import { buildJudgeProof } from "../src/proof";
import type { CiProof } from "../src/proof";
import { buildProtoPediaPublisher } from "../src/publisher";
import { buildReleaseDriftGuard, type ReleaseDriftProbe } from "../src/releaseDrift";
import { buildSecurityReview } from "../src/security";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildSubmissionLaunchGate } from "../src/submissionLaunch";
import { buildSquadOptimizer } from "../src/squadOptimizer";
import { buildWinningStrategy } from "../src/strategy";
import { buildJudgeTour } from "../src/judgeTour";
import { buildUserPilotLab } from "../src/userPilot";

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

const passedProbe = (id: string): ReleaseDriftProbe => ({
  id,
  label: id,
  status: "passed",
  score: 100,
  url: `${SUBMISSION_PROOF.deployedUrl}/${id}`,
  evidence: `${id} passed`,
  required: true
});

function fixture(options: { staleRelease?: boolean } = {}) {
  const baseUrl = SUBMISSION_PROOF.deployedUrl;
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査員の初回導線を固定する。");
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
  const competitiveBattlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
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
  const releaseDrift = options.staleRelease
    ? buildReleaseDriftGuard({
        currentBaseUrl: "http://127.0.0.1:8080",
        targetBaseUrl: SUBMISSION_PROOF.deployedUrl,
        expectedSkillIds: ["task.delegate",
  "external.evidence",
  "evidence.monitor", "observability.oracle", "demo.receipt", "acceptance.matrix", "release.drift", "pilot.economics", "demo.concierge", "judge.command", "judge.rehearsal", "winner.packet", "submission.runway", "submission.assets", "prize.strategy", "win.gap.radar", "submission.closeout", "deploy.recover", "competitive.battlecard", "competitive.snapshot"],
        observedSkillIds: ["evidence.monitor"],
        requiredSkillIds: ["task.delegate",
  "external.evidence",
  "evidence.monitor", "observability.oracle", "demo.receipt", "acceptance.matrix", "release.drift", "pilot.economics", "demo.concierge", "judge.command", "judge.rehearsal", "winner.packet", "submission.runway", "submission.assets", "prize.strategy", "win.gap.radar", "submission.closeout", "deploy.recover", "competitive.battlecard", "competitive.snapshot"],
        probes: [
          passedProbe("target-health"),
          {
            ...passedProbe("agent-card-skill-surface"),
            status: "watch",
            score: 58,
            evidence: "Target Agent Card exposes stale skills."
          },
          {
            ...passedProbe("acceptance-endpoint"),
            status: "missing",
            score: 24,
            evidence: "Acceptance Matrix endpoint is stale."
          },
          {
            ...passedProbe("a2a-artifact"),
            status: "watch",
            score: 62,
            evidence: "A2A artifact lacks command center."
          },
          passedProbe("ci-main")
        ]
      })
    : undefined;
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
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
  return { command, competitiveBattlecard };
}

describe("judge command center", () => {
  test("summarizes the first judge path when only external submission URLs are missing", () => {
    const { command, competitiveBattlecard } = fixture();

    expect(command.readiness).toBe("external-gaps");
    expect(command.commandScore).toBeGreaterThanOrEqual(88);
    expect(command.metrics.map((metric) => metric.id)).toEqual(["acceptance", "win", "tour", "battlecard", "economics", "release"]);
    expect(command.proofButtons.map((button) => button.id)).toEqual([
      "judge-tour",
      "acceptance-matrix",
      "release-drift",
      "competitive-battlecard",
      "pilot-economics",
      "win-autopilot"
    ]);
    expect(command.timeline).toHaveLength(6);
    expect(command.openingMove).toContain("Judge Tour");
    expect(command.openingMove).toContain("Competitive Battlecard");
    expect(command.a2aPayload).toMatchObject({
      competitiveBattlecard: {
        battleScore: competitiveBattlecard.battleScore,
        readiness: competitiveBattlecard.readiness
      }
    });
    expect(command.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "judge.command",
      readiness: "external-gaps"
    });
  });

  test("blocks the opening path when the public Cloud Run revision is stale", () => {
    const { command } = fixture({ staleRelease: true });

    expect(command.readiness).toBe("blocked");
    expect(command.metrics.find((metric) => metric.id === "release")?.status).toBe("blocked");
    expect(command.proofButtons.find((button) => button.id === "release-drift")?.status).toBe("blocked");
    expect(command.blockers.map((blocker) => blocker.id)).toEqual(expect.arrayContaining(["agent-card-skill-surface", "acceptance-endpoint"]));
    expect(command.hardTruth).toContain("公開Cloud Run");
  });
});
