import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildCompetitiveBattlecard } from "../src/competitiveBattlecard";
import {
  buildCompetitiveDecisionMatrix,
  COMPETITIVE_DECISION_MATRIX_REQUIRED_SIGNAL,
  COMPETITIVE_DECISION_MATRIX_SKILL_ID,
  renderCompetitiveDecisionMatrixHtml
} from "../src/competitiveDecisionMatrix";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMoatStressTest } from "../src/moatStress";
import { buildWinningStrategy } from "../src/strategy";

const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];

function fixture() {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel, generatedAt: "2026-06-19T00:00:00.000Z" });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const matrix = buildCompetitiveDecisionMatrix({
    baseUrl,
    strategy,
    battlecard,
    generatedAt: "2026-06-19T00:00:00.000Z"
  });

  return { matrix };
}

describe("competitive decision matrix", () => {
  test("turns competitor battlecards into a head-to-head judge decision table", () => {
    const { matrix } = fixture();

    expect(matrix.matrixScore).toBeGreaterThanOrEqual(88);
    expect(matrix.summary).toMatchObject({
      competitorCount: 8,
      criteriaCount: 5,
      cellCount: 40,
      highThreatCount: 3,
      sourceUrlCount: 14,
      swotSignalCount: 40
    });
    expect(matrix.summary.riskCount).toBe(0);
    expect(matrix.rows.map((row) => row.id)).toEqual(
      expect.arrayContaining(["google-adk", "a2a-marketplace", "microsoft-copilot-studio", "langgraph", "agentops"])
    );
    expect(matrix.rows.find((row) => row.id === "google-adk")).toMatchObject({
      competitor: "Google ADK / Gemini Enterprise",
      cells: expect.arrayContaining([
        expect.objectContaining({
          criterionId: "approach",
          proofUrl: `${baseUrl}/competitive-swot`,
          swotSignal: expect.objectContaining({ quadrant: expect.stringMatching(/strengths|weaknesses|opportunities|threats/) })
        }),
        expect.objectContaining({
          criterionId: "implementation",
          proofUrl: `${baseUrl}/deploy-recovery`
        })
      ])
    });
    expect(matrix.lock.checks.map((check) => `${check.id}:${check.status}`)).toEqual(
      expect.arrayContaining([
        "competitor-coverage:sealed",
        "criteria-coverage:sealed",
        "swot-cell-coverage:sealed",
        "proof-url-coverage:sealed",
        "high-threat-response:sealed",
        "battlecard-lock:sealed"
      ])
    );
    expect(matrix.a2aPayload).toMatchObject({
      method: "message/send",
      skill: COMPETITIVE_DECISION_MATRIX_SKILL_ID,
      summary: {
        competitorCount: 8,
        criteriaCount: 5,
        cellCount: 40
      },
      endpoints: {
        competitiveDecisionMatrix: `${baseUrl}/competitive-decision-matrix`,
        competitiveDecisionMatrixJson: `${baseUrl}/api/competitive-decision-matrix`,
        competitiveSwot: `${baseUrl}/competitive-swot`
      }
    });
    expect(COMPETITIVE_DECISION_MATRIX_REQUIRED_SIGNAL).toBe("competitive.decision-matrix:tag:decision-matrix-lock");
  });

  test("renders safe HTML for the head-to-head matrix", () => {
    const { matrix } = fixture();
    matrix.rows[0].decisiveCounter = "<script>alert('matrix')</script>";
    matrix.rows[0].cells[0].ourCounter = "<script>alert('cell')</script>";

    const html = renderCompetitiveDecisionMatrixHtml(matrix);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Competitive Decision Matrix");
    expect(html).toContain("Head-to-Head Matrix");
    expect(html).toContain("Decision Matrix Lock");
    expect(html).toContain(`${baseUrl}/competitive-swot`);
    expect(html).toContain("&lt;script&gt;alert(&#39;cell&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('cell')</script>");
  });
});
