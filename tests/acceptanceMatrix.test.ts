import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildJudgeAcceptanceMatrix } from "../src/acceptanceMatrix";
import { buildWinningAutopilot } from "../src/autopilot";
import { buildSquadContract } from "../src/contracts";
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
import { buildObservabilityOracle } from "../src/observabilityOracle";
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

const passedDriftProbe = (id: string): ReleaseDriftProbe => ({
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
  const mission = buildMissionRun(recommendation, strategy, "審査5項目、必須技術、提出物、公開証拠を受入表として閉じる。");
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

  return {
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
    submissionLaunch,
    dossier,
    publisher
  };
}

describe("judge acceptance matrix", () => {
  test("maps hackathon requirements, judge criteria, proof, and submission gaps into acceptance rows", () => {
    const matrix = buildJudgeAcceptanceMatrix({
      ...fixture(),
      generatedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(matrix.acceptanceScore).toBeGreaterThanOrEqual(84);
    expect(matrix.verdict).toBe("accepted-with-external-gaps");
    expect(matrix.rows).toHaveLength(13);
    expect(matrix.rows.map((row) => row.id)).toEqual(
      expect.arrayContaining([
        "cloud-run-required",
        "google-ai-required",
        "a2a-agent-center",
        "competitive-swot",
        "moat-rebuttal",
        "usability-first-run",
        "practical-impact",
        "pilot-economics",
        "implementation-quality",
        "live-public-proof",
        "security-boundary",
        "submission-assets",
        "demo-receipt"
      ])
    );
    expect(matrix.rows.find((row) => row.id === "cloud-run-required")?.status).toBe("accepted");
    expect(matrix.rows.find((row) => row.id === "google-ai-required")?.status).toBe("accepted");
    expect(matrix.rows.find((row) => row.id === "a2a-agent-center")?.status).toBe("accepted");
    expect(matrix.rows.find((row) => row.id === "competitive-swot")?.evidence).toContain("競合");
    expect(matrix.rows.find((row) => row.id === "competitive-swot")?.evidence).toContain("SWOT");
    expect(matrix.rows.find((row) => row.id === "submission-assets")?.status).toBe("watch");
    expect(matrix.rows.find((row) => row.id === "submission-assets")?.evidence).toContain("ProtoPedia compliance 8/9");
    expect(matrix.rows.find((row) => row.id === "demo-receipt")?.status).toBe("watch");
    expect(matrix.rows.find((row) => row.id === "usability-first-run")?.status).toBe("accepted");
    expect(matrix.rows.find((row) => row.id === "practical-impact")).toMatchObject({
      status: "accepted",
      proofUrl: `${SUBMISSION_PROOF.deployedUrl}/api/observability-oracle`,
      evidence: expect.stringContaining("Observability Oracle")
    });
    expect(matrix.rows.find((row) => row.id === "pilot-economics")?.status).toBe("accepted");
    expect(matrix.decisiveProof.find((proof) => proof.id === "observability")).toMatchObject({
      value: expect.any(String),
      proof: expect.stringContaining("operational buyer proof")
    });
    expect(matrix.nextActions.map((action) => action.id)).toEqual(expect.arrayContaining(["submission-assets", "demo-receipt"]));
    expect(matrix.nextActions.map((action) => action.id)).not.toContain("usability-first-run");
    expect(matrix.digest.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(matrix.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "acceptance.matrix",
      verdict: "accepted-with-external-gaps",
      submissionLaunch: {
        readiness: "needs-external-urls",
        complianceReady: 8,
        complianceTotal: 9
      },
      observabilityOracle: {
        score: expect.any(Number),
        buyerSlo: {
          metric: expect.stringContaining("payback")
        }
      },
      endpoints: {
        acceptanceMatrix: `${SUBMISSION_PROOF.deployedUrl}/api/acceptance-matrix`,
        pilotEconomics: `${SUBMISSION_PROOF.deployedUrl}/api/pilot-economics`,
        observabilityOracle: `${SUBMISSION_PROOF.deployedUrl}/api/observability-oracle`
      }
    });
  });

  test("accepts submission assets when the shared launch gate is submit-ready", () => {
    const data = fixture();
    const submissionLaunch = buildSubmissionLaunchGate({
      mvpAudit: data.mvpAudit,
      dossier: data.dossier,
      proof: data.proof,
      publisher: data.publisher,
      protopediaUrl: "https://protopedia.net/prototype/999999",
      videoUrl: "https://youtu.be/demo1234567"
    });
    const matrix = buildJudgeAcceptanceMatrix({
      ...data,
      submissionLaunch,
      generatedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(matrix.rows.find((row) => row.id === "submission-assets")).toMatchObject({
      status: "accepted",
      evidence: expect.stringContaining("ProtoPedia compliance 9/9")
    });
    expect(matrix.nextActions.map((action) => action.id)).not.toContain("submission-assets");
    expect(matrix.decisiveProof.find((proof) => proof.id === "protopedia")).toMatchObject({
      value: "9/9",
      proof: "submit-ready"
    });
    expect(matrix.a2aPayload).toMatchObject({
      submissionLaunch: {
        readiness: "submit-ready",
        complianceReady: 9,
        complianceTotal: 9
      }
    });
  });

  test("does not accept the MVP when the deployed Cloud Run revision is stale", () => {
    const data = fixture();
    const releaseDrift = buildReleaseDriftGuard({
      currentBaseUrl: "http://127.0.0.1:8090",
      targetBaseUrl: SUBMISSION_PROOF.deployedUrl,
      expectedSkillIds: ["task.delegate",
  "external.evidence",
  "evidence.monitor", "observability.oracle", "demo.receipt", "acceptance.matrix", "release.drift", "pilot.economics", "demo.concierge", "judge.command", "judge.rehearsal", "winner.packet", "submission.runway", "submission.assets", "prize.strategy", "win.gap.radar", "submission.closeout", "deploy.recover", "competitive.battlecard"],
      observedSkillIds: ["evidence.monitor"],
      requiredSkillIds: ["task.delegate",
  "external.evidence",
  "evidence.monitor", "observability.oracle", "demo.receipt", "acceptance.matrix", "release.drift", "pilot.economics", "demo.concierge", "judge.command", "judge.rehearsal", "winner.packet", "submission.runway", "submission.assets", "prize.strategy", "win.gap.radar", "submission.closeout", "deploy.recover", "competitive.battlecard"],
      probes: [
        passedDriftProbe("target-health"),
        {
          ...passedDriftProbe("agent-card-skill-surface"),
          status: "watch",
          score: 58,
          evidence: "Target Agent Card exposes 29/44 skills."
        },
        {
          ...passedDriftProbe("acceptance-endpoint"),
          status: "missing",
          score: 24,
          evidence: "Acceptance Matrix endpoint is stale."
        },
        {
          ...passedDriftProbe("a2a-artifact"),
          status: "watch",
          score: 62,
          evidence: "A2A artifact lacks releaseDriftEndpoint."
        },
        passedDriftProbe("ci-main")
      ]
    });
    const matrix = buildJudgeAcceptanceMatrix({
      ...data,
      releaseDrift,
      generatedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(matrix.verdict).toBe("not-accepted");
    expect(matrix.rows).toHaveLength(14);
    expect(matrix.rows.find((row) => row.id === "release-drift")).toMatchObject({
      status: "blocked",
      score: releaseDrift.driftScore
    });
    expect(matrix.nextActions.map((action) => action.id)).toContain("release-drift");
    expect(matrix.decisiveProof.find((proof) => proof.id === "release")).toMatchObject({
      value: "deploy-drift"
    });
    expect(matrix.a2aPayload).toMatchObject({
      skill: "acceptance.matrix",
      verdict: "not-accepted",
      endpoints: {
        releaseDrift: `${SUBMISSION_PROOF.deployedUrl}/api/release-drift`
      }
    });
  });
});
