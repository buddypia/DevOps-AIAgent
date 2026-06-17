import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildWinningAutopilot } from "../src/autopilot";
import { buildSquadContract } from "../src/contracts";
import { buildDemoRunway } from "../src/demoRunway";
import { buildSubmissionDossier } from "../src/dossier";
import { buildFinalistSimulation } from "../src/finalist";
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

describe("MVP audit", () => {
  test("keeps external submission URLs as watch while passing core MVP gates", () => {
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
    const audit = buildMvpAudit({
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

    expect(audit.mvpScore).toBeGreaterThanOrEqual(84);
    expect(audit.band).toBe("mvp-with-external-gaps");
    expect(audit.gates.find((gate) => gate.id === "cloud-run-runtime")?.status).toBe("pass");
    expect(audit.gates.find((gate) => gate.id === "gemini-ai")?.status).toBe("pass");
    expect(audit.gates.find((gate) => gate.id === "market-swot")?.status).toBe("pass");
    expect(audit.gates.find((gate) => gate.id === "protopedia-url")?.status).toBe("watch");
    expect(audit.gates.find((gate) => gate.id === "video-url")?.status).toBe("watch");
    expect(audit.blockers.map((action) => action.id)).toEqual(expect.arrayContaining(["protopedia-url", "video-url"]));
    expect(audit.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "mvp.audit",
      band: "mvp-with-external-gaps"
    });
  });
});
