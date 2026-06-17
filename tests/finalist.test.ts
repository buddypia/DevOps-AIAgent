import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildSquadContract } from "../src/contracts";
import { buildFinalistSimulation } from "../src/finalist";
import { buildJudgeDrill } from "../src/judgeDrill";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildPitchRun } from "../src/pitch";
import { buildWinningStrategy } from "../src/strategy";

describe("finalist simulator", () => {
  test("turns the current evidence stack into a judge-panel finalist verdict with honest external gaps", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const opsDrill = buildOpsDrill(recommendation, strategy);
    const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
    const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
    const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
    const simulation = buildFinalistSimulation({
      baseUrl,
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch,
      judgeDrill,
      squadContract
    });

    expect(simulation.finalistScore).toBeGreaterThanOrEqual(78);
    expect(simulation.finalistBand).not.toBe("not-mvp");
    expect(simulation.panels).toHaveLength(5);
    expect(simulation.panels.map((panel) => panel.id)).toEqual(
      expect.arrayContaining(["agent-centrality", "approach", "usability", "practicality", "implementation"])
    );
    expect(simulation.panels.every((panel) => panel.evidenceUrl.startsWith("https://"))).toBe(true);
    expect(simulation.judgeConsensus).toMatch(/advance|watch/);
    expect(simulation.gaps.map((gap) => gap.id)).toEqual(expect.arrayContaining(["protopedia", "video"]));
    expect(simulation.gaps.find((gap) => gap.id === "protopedia")?.severity).toBe("external");
    expect(simulation.winningMove).toContain("Win Autopilot");
    expect(simulation.winningMove).toContain("Demo Runway");
    expect(simulation.runbook.join("\n")).toContain("/api/finalist");
    expect(simulation.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "finalist.simulate"
    });
  });
});
