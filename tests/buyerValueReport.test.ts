import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueReport, renderBuyerValueReportHtml } from "../src/buyerValueReport";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildValueBlueprint } from "../src/valueBlueprint";

describe("buyer value report", () => {
  const PILOT_RECEIPT_URL = "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-receipt";

  test("packages a strong buyer scenario into a board-ready shareable report", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
    const valueBlueprint = buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF, "https://example.com");
    const buyerScenario = buildBuyerValueScenario(recommendation, {
      teamSize: 8,
      hourlyCostYen: 12000,
      cyclesPerMonth: 5,
      manualHoursPerCycle: 28,
      adoptionRatePercent: 75,
      incidentRiskYenPerMonth: 240000
    });
    const report = buildBuyerValueReport({ recommendation, valueBlueprint, buyerScenario });

    expect(report.readiness).toBe("board-ready");
    expect(report.sensitivity.verdict).toBe("defensible");
    expect(report.checks.map((check) => check.id)).toEqual(["base-payback", "downside-case", "adoption-threshold", "evidence-confidence"]);
    expect(report.checks.every((check) => check.status === "clear")).toBe(true);
    expect(report.evidence.mode).toBe("measurement-needed");
    expect(report.assumptionAudit.items.map((item) => item.id)).toEqual(["adoption-floor", "downside-payback", "measured-support", "public-receipt", "budget-ask"]);
    expect(report.assumptionAudit.items.find((item) => item.id === "public-receipt")).toMatchObject({
      status: "blocked",
      target: "Public HTTPS pilot receipt"
    });
    expect(report.assumptionAudit.hardTruth).toContain("assumptions are clear");
    expect(report.exportMarkdown).toContain("## Measured proof");
    expect(report.exportMarkdown).toContain("## Assumption audit");
    expect(report.exportMarkdown).toContain("## Sensitivity");
  });

  test("promotes accepted pilot data into measured-supported proof", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
    const valueBlueprint = buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF, "https://example.com");
    const buyerScenario = buildBuyerValueScenario(recommendation, {
      teamSize: 8,
      hourlyCostYen: 12000,
      cyclesPerMonth: 5,
      manualHoursPerCycle: 28,
      adoptionRatePercent: 75,
      incidentRiskYenPerMonth: 240000
    });
    const report = buildBuyerValueReport({
      recommendation,
      valueBlueprint,
      buyerScenario,
      pilotRun: {
        observedManualMinutes: 1680,
        observedAssistedMinutes: 420,
        participants: 4,
        acceptedTasks: 3,
        totalTasks: 3,
        reviewerName: "Platform sponsor",
        evidenceUrl: PILOT_RECEIPT_URL
      }
    });

    expect(report.evidence.mode).toBe("measured-supported");
    expect(report.evidence.supportRatioPercent).toBeGreaterThanOrEqual(70);
    expect(report.evidence.checks.map((check) => check.id)).toEqual(["measured-value", "acceptance", "reviewer", "receipt-url"]);
    expect(report.evidence.checks.every((check) => check.status === "clear")).toBe(true);
    expect(report.assumptionAudit.items.find((item) => item.id === "measured-support")).toMatchObject({
      status: "clear"
    });
    expect(report.assumptionAudit.clearCount).toBeGreaterThanOrEqual(4);
    expect(report.exportMarkdown).toContain("Measured monthly value");
    expect(report.exportMarkdown).toContain(PILOT_RECEIPT_URL);
  });

  test("keeps measured evidence partial when the receipt URL is plain HTTP", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
    const valueBlueprint = buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF, "https://example.com");
    const buyerScenario = buildBuyerValueScenario(recommendation, {
      teamSize: 8,
      hourlyCostYen: 12000,
      cyclesPerMonth: 5,
      manualHoursPerCycle: 28,
      adoptionRatePercent: 75,
      incidentRiskYenPerMonth: 240000
    });
    const report = buildBuyerValueReport({
      recommendation,
      valueBlueprint,
      buyerScenario,
      pilotRun: {
        observedManualMinutes: 1680,
        observedAssistedMinutes: 420,
        participants: 4,
        acceptedTasks: 3,
        totalTasks: 3,
        reviewerName: "Platform sponsor",
        evidenceUrl: "http://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-receipt"
      }
    });

    expect(report.evidence.mode).toBe("measured-partial");
    expect(report.evidence.checks.find((check) => check.id === "receipt-url")).toMatchObject({
      status: "watch"
    });
  });

  test("renders an escaped public report with linked artifacts", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist"], 260);
    const valueBlueprint = buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF, "https://example.com");
    const buyerScenario = buildBuyerValueScenario(recommendation);
    const report = buildBuyerValueReport({ recommendation, valueBlueprint, buyerScenario });
    const html = renderBuyerValueReportHtml(
      {
        ...report,
        headline: "Value <script>alert(1)</script>",
        hardTruth: "Risk <script>alert(2)</script>"
      },
      {
        proposalUrl: "https://example.com/buyer-proposal",
        diligenceUrl: "https://example.com/buyer-diligence",
        workflowUrl: "https://example.com/pilot-workflow",
        jsonUrl: "https://example.com/api/buyer-value",
        markdownUrl: "https://example.com/buyer-value.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer Value Report");
    expect(html).toContain("Measured proof");
    expect(html).toContain("Assumption audit");
    expect(html).toContain("This value case has buyer-visible assumption gaps");
    expect(html).toContain("Acceptance receipt");
    expect(html).toContain("Verify acceptance");
    expect(html).toContain("buyer-value-acceptance");
    expect(html).toContain("Value sensitivity");
    expect(html).toContain("https://example.com/api/buyer-value");
    expect(html).toContain("https://example.com/buyer-value.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<script>alert(2)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
