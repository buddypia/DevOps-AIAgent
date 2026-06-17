import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildWinningAutopilot } from "../src/autopilot";
import { buildSquadContract } from "../src/contracts";
import { buildDemoRunway } from "../src/demoRunway";
import { buildFinalistSimulation } from "../src/finalist";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildJudgeProof } from "../src/proof";
import type { CiProof } from "../src/proof";
import { buildProtoPediaPublisher } from "../src/publisher";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildWinningStrategy } from "../src/strategy";

describe("winning autopilot", () => {
  test("summarizes the full evidence stack into a one-click win verdict", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
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
    const proof = buildJudgeProof({
      baseUrl,
      recommendation,
      strategy,
      mission,
      opsDrill,
      gemini: localGeminiRecommendation(recommendation, "test"),
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

    expect(autopilot.winScore).toBeGreaterThanOrEqual(84);
    expect(autopilot.readiness).toBe("external-gaps");
    expect(autopilot.lanes.map((lane) => lane.id)).toEqual(
      expect.arrayContaining(["proof", "demo", "strategy", "autonomy", "finalist", "publisher", "ops", "contract"])
    );
    expect(autopilot.blockers.map((action) => action.id)).toEqual(expect.arrayContaining(["record-video", "publish-protopedia"]));
    expect(autopilot.evidenceDeck.map((item) => item.id)).toEqual(expect.arrayContaining(["app", "proof", "demo", "finalist", "publisher", "agent-card", "ci"]));
    expect(autopilot.autonomyTrace.map((item) => item.phase)).toEqual(["sense", "decide", "delegate", "verify", "rehearse", "submit"]);
    expect(autopilot.judgeNarrative).toContain("Win Autopilot");
    expect(autopilot.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "win.autopilot",
      readiness: "external-gaps"
    });
  });
});
