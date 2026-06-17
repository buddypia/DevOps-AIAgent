import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildSquadContract } from "../src/contracts";
import { buildDemoRunway } from "../src/demoRunway";
import { buildFinalistSimulation } from "../src/finalist";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildProtoPediaPublisher } from "../src/publisher";
import { buildWinningStrategy } from "../src/strategy";

describe("demo runway", () => {
  test("turns the evidence stack into a 30-second judge demo order with recording risks", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const opsDrill = buildOpsDrill(recommendation, strategy);
    const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
    const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
    const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
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
    const runway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });

    expect(runway.demoScore).toBeGreaterThanOrEqual(80);
    expect(runway.totalSeconds).toBe(30);
    expect(runway.readiness).toBe("needs-external-capture");
    expect(runway.steps).toHaveLength(8);
    expect(runway.steps[0]).toMatchObject({ id: "proof-first", order: 1, status: "ready" });
    expect(runway.steps.map((step) => step.id)).toEqual(
      expect.arrayContaining(["finalist-verdict", "publisher-kit", "market-loop", "strategy-swot", "contract-mission", "ops-release"])
    );
    expect(runway.proofLinks.map((link) => link.id)).toEqual(expect.arrayContaining(["app", "proof", "finalist", "publisher", "agent-card", "ci"]));
    expect(runway.risks.map((risk) => risk.id)).toEqual(expect.arrayContaining(["record-video", "publish-protopedia"]));
    expect(runway.recordingCues.join("\n")).toContain("Judge Proof");
    expect(runway.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "demo.runway",
      totalSeconds: 30
    });
  });
});
