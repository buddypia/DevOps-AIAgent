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
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMissionRun } from "../src/mission";
import { buildMoatStressTest } from "../src/moatStress";
import { buildMvpAudit } from "../src/mvpAudit";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildJudgeProof } from "../src/proof";
import type { CiProof } from "../src/proof";
import { buildProtoPediaPublisher } from "../src/publisher";
import { buildSecurityReview } from "../src/security";
import { SUBMISSION_PROOF } from "../src/submission";
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
    securityReview,
    demoReceipt
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
    expect(matrix.rows).toHaveLength(12);
    expect(matrix.rows.map((row) => row.id)).toEqual(
      expect.arrayContaining([
        "cloud-run-required",
        "google-ai-required",
        "a2a-agent-center",
        "competitive-swot",
        "moat-rebuttal",
        "usability-first-run",
        "practical-impact",
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
    expect(matrix.rows.find((row) => row.id === "demo-receipt")?.status).toBe("watch");
    expect(matrix.nextActions.map((action) => action.id)).toEqual(expect.arrayContaining(["submission-assets", "demo-receipt"]));
    expect(matrix.digest.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(matrix.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "acceptance.matrix",
      verdict: "accepted-with-external-gaps",
      endpoints: {
        acceptanceMatrix: `${SUBMISSION_PROOF.deployedUrl}/api/acceptance-matrix`
      }
    });
  });
});
