import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildAutonomyLedger } from "../src/autonomyLedger";
import { buildSquadContract } from "../src/contracts";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildJudgeProof } from "../src/proof";
import type { CiProof } from "../src/proof";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildWinningStrategy } from "../src/strategy";

describe("autonomy ledger", () => {
  test("proves agent centrality as a verified decision, handoff, verification, and ops chain", () => {
    const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const mission = buildMissionRun(recommendation, strategy);
    const opsDrill = buildOpsDrill(recommendation, strategy);
    const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
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
    const ledger = buildAutonomyLedger({ baseUrl, recommendation, strategy, mission, opsDrill, squadContract, proof });

    expect(ledger.ledgerScore).toBeGreaterThanOrEqual(84);
    expect(ledger.verdict).toBe("agent-led-with-external-gaps");
    expect(ledger.metrics.map((metric) => metric.id)).toEqual(
      expect.arrayContaining(["ledger", "agent-centrality", "mission", "a2a", "contract", "ops"])
    );
    expect(ledger.chain.map((event) => event.phase)).toEqual(["sense", "decide", "contract", "delegate", "verify", "operate", "submit"]);
    expect(ledger.chain.map((event) => event.endpoint)).toEqual(expect.arrayContaining([`${baseUrl}/api/market-intel`, `${baseUrl}/api/proof`]));
    expect(ledger.handoffs).toHaveLength(recommendation.selected.length);
    expect(ledger.handoffs.every((handoff) => handoff.acceptance.length > 0)).toBe(true);
    expect(ledger.challengeAnswers.map((challenge) => challenge.id)).toEqual(expect.arrayContaining(["not-dashboard", "why-agent-needed", "devops-loop"]));
    expect(ledger.receipt.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(ledger.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "autonomy.ledger",
      verdict: "agent-led-with-external-gaps"
    });
  });
});
