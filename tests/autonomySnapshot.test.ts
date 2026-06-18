import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildAutonomyLedger } from "../src/autonomyLedger";
import { buildAutonomySnapshot, renderAutonomySnapshotHtml } from "../src/autonomySnapshot";
import { buildSquadContract } from "../src/contracts";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildJudgeProof, type CiProof } from "../src/proof";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildWinningStrategy } from "../src/strategy";
import { buildAgentTaskBoard } from "../src/taskBoard";

const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];

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
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "AIエージェント中心性をGET証拠に束ねる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
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
  const autonomyLedger = buildAutonomyLedger({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    proof
  });
  const taskBoard = buildAgentTaskBoard({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract
  });
  const snapshot = buildAutonomySnapshot({
    baseUrl,
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds,
    autonomyLedger,
    taskBoard,
    mission,
    generatedAt: "2026-06-18T00:00:00.000Z"
  });
  return { snapshot, autonomyLedger, taskBoard, mission };
}

describe("autonomy snapshot", () => {
  test("bundles the autonomy ledger and task board into direct-open agent-centrality proof", () => {
    const { snapshot } = fixture();

    expect(snapshot.readiness).toBe("autonomy-external-watch");
    expect(snapshot.summary).toMatchObject({
      ledgerScore: expect.any(Number),
      taskScore: expect.any(Number),
      missionAutonomyScore: expect.any(Number),
      verifiedChainCount: expect.any(Number),
      handoffCount: 3,
      challengeCount: 3,
      externalGapCount: 2,
      receiptCount: 3
    });
    expect(snapshot.summary.verifiedChainCount).toBeGreaterThanOrEqual(5);
    expect(snapshot.links.map((link) => link.url)).toEqual(
      expect.arrayContaining([
        `${baseUrl}/autonomy-snapshot`,
        `${baseUrl}/api/autonomy-snapshot`,
        `${baseUrl}/api/autonomy-ledger`,
        `${baseUrl}/api/task-board`,
        `${baseUrl}/.well-known/agent-card.json`,
        `${baseUrl}/mvp-readiness`,
        `${baseUrl}/pilot-value`
      ])
    );
    expect(snapshot.a2aPayload).toMatchObject({
      skill: "autonomy.snapshot",
      readiness: "autonomy-external-watch",
      endpoints: {
        autonomySnapshot: `${baseUrl}/autonomy-snapshot`,
        autonomySnapshotJson: `${baseUrl}/api/autonomy-snapshot`,
        autonomyLedger: `${baseUrl}/api/autonomy-ledger`,
        taskBoard: `${baseUrl}/api/task-board`
      }
    });
  });

  test("does not hide blocked autonomy evidence", () => {
    const { autonomyLedger, taskBoard, mission } = fixture();
    autonomyLedger.chain[0].status = "blocked";

    const snapshot = buildAutonomySnapshot({
      baseUrl,
      autonomyLedger,
      taskBoard,
      mission,
      generatedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(snapshot.readiness).toBe("autonomy-blocked");
    expect(snapshot.hardTruth).toContain("A2A委任先");
    expect(snapshot.a2aPayload).toMatchObject({
      skill: "autonomy.snapshot",
      readiness: "autonomy-blocked"
    });
  });

  test("renders safe HTML for the autonomy proof page", () => {
    const { snapshot } = fixture();
    snapshot.challengeAnswers[0].answer = "<script>alert('autonomy')</script>";

    const html = renderAutonomySnapshotHtml(snapshot);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Autonomy Snapshot");
    expect(html).toContain("Agent Decision Chain");
    expect(html).toContain("A2A Work Orders");
    expect(html).toContain("Verification Commands");
    expect(html).toContain("Receipts");
    expect(html).toContain("&lt;script&gt;alert(&#39;autonomy&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('autonomy')</script>");
  });
});
