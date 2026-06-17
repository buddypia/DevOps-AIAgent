import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildWinningAutopilot } from "../src/autopilot";
import { buildSquadContract } from "../src/contracts";
import { buildDemoRunway } from "../src/demoRunway";
import { buildSubmissionDossier } from "../src/dossier";
import { buildFinalistSimulation } from "../src/finalist";
import { buildJudgeBrief } from "../src/judgeBrief";
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
import { buildWinningStrategy } from "../src/strategy";

describe("judge brief", () => {
  test("compresses market, MVP, proof, win, and submission evidence into one judge-facing artifact", () => {
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
    const brief = buildJudgeBrief({
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

    expect(brief.briefScore).toBeGreaterThanOrEqual(84);
    expect(brief.readiness).toBe("external-gaps");
    expect(brief.keyMetrics.map((metric) => metric.id)).toEqual(expect.arrayContaining(["brief", "mvp", "market", "win", "proof", "finalist"]));
    expect(brief.proofLadder.map((proofStep) => proofStep.id)).toEqual(
      expect.arrayContaining(["market-intel", "mvp-audit", "judge-proof", "win-autopilot", "submission-dossier"])
    );
    expect(brief.demoRoute[0]).toContain("Market Intel");
    expect(brief.riskRegister.map((risk) => risk.id)).toEqual(expect.arrayContaining(["protopedia-url", "video-url"]));
    expect(brief.links.map((link) => link.id)).toEqual(expect.arrayContaining(["app", "github", "ci", "agent-card", "architecture"]));
    expect(brief.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "judge.brief",
      readiness: "external-gaps"
    });
  });
});
