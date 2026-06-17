import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildSquadContract } from "../src/contracts";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildWinningStrategy } from "../src/strategy";

describe("agent contract desk", () => {
  test("turns hired agents into payable contracts with acceptance criteria and verification", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const opsDrill = buildOpsDrill(recommendation, strategy);
    const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });

    expect(squadContract.contractScore).toBeGreaterThanOrEqual(80);
    expect(squadContract.contracts).toHaveLength(recommendation.selected.length);
    expect(squadContract.totalPrice).toBe(recommendation.budgetUsed);
    expect(squadContract.remainingBudget).toBe(recommendation.remainingBudget);
    expect(squadContract.contracts.every((contract) => contract.acceptanceCriteria.length >= 4)).toBe(true);
    expect(squadContract.contracts.every((contract) => contract.verificationCommands.length >= 2)).toBe(true);
    expect(squadContract.contracts.find((contract) => contract.agentId === "market-broker")?.a2aSkills).toContain("market.discover");
    expect(squadContract.ledger.map((event) => event.id)).toEqual(expect.arrayContaining(["discover", "contract", "verify", "operate"]));
    expect(squadContract.acceptanceRunbook.join("\n")).toContain("GitHub Actions");
    expect(squadContract.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "contract.issue"
    });
  });
});
