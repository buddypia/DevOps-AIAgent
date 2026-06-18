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
  const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";

  function buildSimulation(input: { protopediaUrl?: string; videoUrl?: string } = {}) {
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
      squadContract,
      submissionUrls: input
    });
    return simulation;
  }

  test("turns the current evidence stack into a judge-panel finalist verdict with honest external gaps", () => {
    const simulation = buildSimulation();

    expect(simulation.finalistScore).toBeGreaterThanOrEqual(86);
    expect(simulation.finalistBand).not.toBe("not-mvp");
    expect(simulation.panels).toHaveLength(5);
    expect(simulation.panels.map((panel) => panel.id)).toEqual(
      expect.arrayContaining(["agent-centrality", "approach", "usability", "practicality", "implementation"])
    );
    expect(simulation.panels.every((panel) => panel.evidenceUrl.startsWith("https://"))).toBe(true);
    expect(simulation.judgeConsensus).toMatch(/advance|watch/);
    expect(simulation.gaps.map((gap) => gap.id)).toEqual(expect.arrayContaining(["protopedia", "video"]));
    expect(simulation.gaps.find((gap) => gap.id === "protopedia")?.severity).toBe("external");
    expect(simulation.internalLock).toMatchObject({
      readiness: "internal-finalist-external-watch",
      internalScore: 100,
      sealedCount: 5,
      watchCount: 1,
      blockedCount: 0,
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "five-panel-floor", status: "sealed" }),
        expect.objectContaining({ id: "competitive-swot-proof", status: "sealed" }),
        expect.objectContaining({ id: "agent-necessity-proof", status: "sealed" }),
        expect.objectContaining({ id: "demo-route-proof", status: "sealed" }),
        expect.objectContaining({ id: "ops-ci-proof", status: "sealed" }),
        expect.objectContaining({ id: "external-submit-truth", status: "watch" })
      ])
    });
    expect(simulation.advanceDecision).toContain("内部MVP");
    expect(simulation.winningMove).toContain("Finalist Internal Lock");
    expect(simulation.winningMove).toContain("Demo Runway");
    expect(simulation.runbook.join("\n")).toContain("/api/finalist");
    expect(simulation.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "finalist.simulate",
      internalLock: {
        readiness: "internal-finalist-external-watch",
        checks: expect.arrayContaining([expect.objectContaining({ id: "external-submit-truth", status: "watch" })])
      }
    });
  });

  test("promotes the finalist verdict when real submission URLs are supplied", () => {
    const simulation = buildSimulation({
      protopediaUrl: "https://protopedia.net/prototype/999999",
      videoUrl: "https://youtu.be/demo1234567"
    });

    expect(simulation.finalistScore).toBeGreaterThanOrEqual(88);
    expect(simulation.finalistBand).toBe("finalist-ready");
    expect(simulation.gaps.map((gap) => gap.id)).not.toEqual(expect.arrayContaining(["protopedia", "video"]));
    expect(simulation.internalLock).toMatchObject({
      readiness: "internal-finalist-ready",
      sealedCount: 6,
      watchCount: 0,
      blockedCount: 0,
      checks: expect.arrayContaining([expect.objectContaining({ id: "external-submit-truth", status: "sealed" })])
    });
    expect(simulation.a2aPayload).toMatchObject({
      submissionUrls: {
        protopedia: { status: "ready", url: "https://protopedia.net/prototype/999999" },
        video: { status: "ready", url: "https://youtu.be/demo1234567" }
      }
    });
  });

  test("keeps malformed external URLs as finalist blockers", () => {
    const simulation = buildSimulation({
      protopediaUrl: "https://example.com/not-protopedia",
      videoUrl: "https://drive.google.com/file/d/demo/view"
    });

    expect(simulation.finalistBand).toBe("not-mvp");
    expect(simulation.gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "protopedia", severity: "blocker" }),
        expect.objectContaining({ id: "video", severity: "blocker" })
      ])
    );
    expect(simulation.internalLock).toMatchObject({
      readiness: "needs-finalist-proof",
      checks: expect.arrayContaining([expect.objectContaining({ id: "external-submit-truth", status: "blocked" })])
    });
  });
});
