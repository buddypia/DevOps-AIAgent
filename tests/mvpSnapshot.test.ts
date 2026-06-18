import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildJudgeAcceptanceMatrix } from "../src/acceptanceMatrix";
import { buildWinningAutopilot } from "../src/autopilot";
import { buildSquadContract } from "../src/contracts";
import { buildDeployRecoveryPlan } from "../src/deployRecovery";
import { buildJudgeDemoReceipt } from "../src/demoReceipt";
import { buildDemoRunway } from "../src/demoRunway";
import { buildSubmissionDossier } from "../src/dossier";
import { buildFinalistSimulation } from "../src/finalist";
import { buildImpactCase } from "../src/impact";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildLiveEvidenceRun } from "../src/liveEvidence";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMissionRun } from "../src/mission";
import { buildMoatStressTest } from "../src/moatStress";
import { buildMvpAudit } from "../src/mvpAudit";
import { buildMvpSnapshot, renderMvpSnapshotHtml } from "../src/mvpSnapshot";
import { buildObservabilityOracle } from "../src/observabilityOracle";
import { buildOpsDrill } from "../src/ops";
import { buildPilotEconomics } from "../src/pilotEconomics";
import { buildPitchRun } from "../src/pitch";
import { buildJudgeProof, type CiProof } from "../src/proof";
import { buildProtoPediaPublisher } from "../src/publisher";
import { buildReleaseDriftGuard, type ReleaseDriftProbe } from "../src/releaseDrift";
import { buildSecurityReview } from "../src/security";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildSubmissionLaunchGate } from "../src/submissionLaunch";
import { buildSquadOptimizer } from "../src/squadOptimizer";
import { buildWinningStrategy } from "../src/strategy";
import { buildUserPilotLab } from "../src/userPilot";

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

const allowlist = {
  exactIpCount: 126,
  localDevelopmentCidrCount: 2,
  rakutenMobileCidrCount: 65
};

const expectedSkillIds = [
  "task.delegate",
  "external.evidence",
  "evidence.monitor",
  "observability.oracle",
  "demo.receipt",
  "acceptance.matrix",
  "release.drift",
  "mvp.snapshot",
  "pilot.economics",
  "demo.concierge",
  "judge.command",
  "judge.rehearsal",
  "winner.packet",
  "submission.runway",
  "submission.assets",
  "recording.script",
  "prize.strategy",
  "win.gap.radar",
  "submission.closeout",
  "deploy.recover",
  "competitive.battlecard",
  "competitive.snapshot",
  "judge.snapshot",
  "win.autopilot"
];

const passedProbe = (id: string): ReleaseDriftProbe => ({
  id,
  label: id,
  status: "passed",
  score: 100,
  url: `${baseUrl}/${id}`,
  evidence: `${id} passed`,
  required: true
});

function passedLiveProbe(id: string) {
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
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "MVP readinessを審査員向けの単一判断に束ねる。");
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
  const submissionLaunch = buildSubmissionLaunchGate({ mvpAudit, dossier, proof, publisher });
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
      probes: [passedLiveProbe("health"), passedLiveProbe("agent-card"), passedLiveProbe("a2a"), passedLiveProbe("ci")]
    }),
    opsDrill,
    pilotEconomics
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
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
    targetBaseUrl: SUBMISSION_PROOF.deployedUrl,
    expectedSkillIds,
    observedSkillIds: expectedSkillIds.filter((skill) => skill !== "mvp.snapshot"),
    requiredSkillIds: expectedSkillIds,
    generatedAt: "2026-06-18T00:00:00.000Z",
    probes: [
      passedProbe("target-health"),
      {
        ...passedProbe("agent-card-skill-surface"),
        status: "watch",
        score: 58,
        evidence: "Target Agent Card does not expose mvp.snapshot yet."
      },
      passedProbe("acceptance-endpoint"),
      {
        ...passedProbe("a2a-artifact"),
        status: "watch",
        score: 62,
        evidence: "A2A artifact lacks mvpReadinessSnapshotEndpoint."
      },
      passedProbe("ci-main")
    ]
  });
  const deployRecovery = buildDeployRecoveryPlan({
    baseUrl,
    releaseDrift,
    lastDeployError: "Reauthentication failed. Please run: gcloud auth login"
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
    releaseDrift,
    submissionLaunch,
    generatedAt: "2026-06-18T00:00:00.000Z"
  });

  return { mvpAudit, acceptance, releaseDrift, deployRecovery };
}

describe("MVP readiness snapshot", () => {
  test("combines MVP audit, acceptance, release drift, and submit assets into a direct-open readiness page", () => {
    const data = fixture();
    const snapshot = buildMvpSnapshot({
      baseUrl,
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds,
      ...data,
      generatedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(snapshot.readiness).toBe("mvp-release-drift");
    expect(snapshot.summary.releaseVerdict).toBe("deploy-drift");
    expect(snapshot.summary.blockedRows).toBeGreaterThan(0);
    expect(snapshot.links.map((link) => link.url)).toEqual(
      expect.arrayContaining([`${baseUrl}/judge-snapshot`, `${baseUrl}/competitive-swot`, `${baseUrl}/submission-assets`, `${baseUrl}/recording-script`])
    );
    expect(snapshot.postApis.map((api) => api.url)).toEqual(
      expect.arrayContaining([`${baseUrl}/api/mvp-audit`, `${baseUrl}/api/acceptance-matrix`, `${baseUrl}/api/release-drift`, `${baseUrl}/api/deploy-recovery`])
    );
    expect(snapshot.releaseLock.missingSkills).toContain("mvp.snapshot");
    expect(snapshot.deployRecovery?.readiness).toBe("manual-auth-required");
    expect(snapshot.a2aPayload).toMatchObject({
      skill: "mvp.snapshot",
      endpoints: {
        mvpReadiness: `${baseUrl}/mvp-readiness`,
        mvpReadinessJson: `${baseUrl}/api/mvp-readiness`,
        competitiveSwotSnapshot: `${baseUrl}/competitive-swot`,
        submissionAssetsPage: `${baseUrl}/submission-assets`,
        recordingScript: `${baseUrl}/recording-script`,
        recordingScriptJson: `${baseUrl}/api/recording-script`
      }
    });
  });

  test("renders safe HTML with release and submission proof links", () => {
    const data = fixture();
    const snapshot = buildMvpSnapshot({
      baseUrl,
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds,
      ...data,
      generatedAt: "2026-06-18T00:00:00.000Z"
    });
    snapshot.rows[0].evidence = "<script>alert('mvp')</script>";

    const html = renderMvpSnapshotHtml(snapshot);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("MVP Readiness Snapshot");
    expect(html).toContain("Release Drift");
    expect(html).toContain("Submission Assets");
    expect(html).toContain("Recording Script");
    expect(html).toContain("mvp.snapshot");
    expect(html).toContain("&lt;script&gt;alert(&#39;mvp&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('mvp')</script>");
  });
});
