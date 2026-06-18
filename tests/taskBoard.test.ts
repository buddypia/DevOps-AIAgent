import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildSquadContract } from "../src/contracts";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildAgentTaskBoard } from "../src/taskBoard";
import { buildWinningStrategy } from "../src/strategy";

describe("agent task board", () => {
  test("turns hired agents into A2A work orders with acceptance proof", () => {
    const baseUrl = "https://a2a-agent-marketplace.example.com";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const opsDrill = buildOpsDrill(recommendation, strategy);
    const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
    const board = buildAgentTaskBoard({ baseUrl, recommendation, strategy, mission, opsDrill, squadContract });

    expect(board.readiness).toBe("delegation-ready");
    expect(board.taskScore).toBeGreaterThanOrEqual(88);
    expect(board.workOrders).toHaveLength(recommendation.selected.length);
    expect(board.workOrders.map((order) => order.agentId)).toEqual(recommendation.selected.map((agent) => agent.id));
    expect(board.workOrders.every((order) => order.delegatedPayload.method === "message/send")).toBe(true);
    expect(board.workOrders.every((order) => order.acceptance.length >= 4)).toBe(true);
    expect(board.workOrders.map((order) => order.proofUrl)).toEqual(
      expect.arrayContaining([`${baseUrl}/api/market-intel`, `${baseUrl}/api/competitive-battlecard`, `${baseUrl}/api/release-drift`])
    );
    expect(board.executionOrder.join("\n")).toContain("Cloud Run");
    expect(board.verifications.length).toBeGreaterThanOrEqual(4);
    expect(board.receipt.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(board.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "task.delegate",
      readiness: "delegation-ready",
      endpoints: {
        taskBoard: `${baseUrl}/api/task-board`
      }
    });
  });

  test("blocks Cloud Run work orders when ops rollback is recommended", () => {
    const baseUrl = "https://a2a-agent-marketplace.example.com";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["cloud-run-sre", "test-forge"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const opsDrill = buildOpsDrill(recommendation, strategy, { healthOk: false, errorRatePercent: 12 });
    const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
    const board = buildAgentTaskBoard({ baseUrl, recommendation, strategy, mission, opsDrill, squadContract });

    const cloudRunOrder = board.workOrders.find((order) => order.agentId === "cloud-run-sre");
    expect(board.readiness).toBe("blocked");
    expect(cloudRunOrder?.status).toBe("blocked");
    expect(cloudRunOrder?.nextAction).toContain("rollback");
  });
});
