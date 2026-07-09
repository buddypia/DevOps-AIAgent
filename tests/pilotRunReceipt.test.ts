import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotRunReceipt, normalizePilotRunReceiptInput, renderPilotRunReceiptHtml } from "../src/pilotRunReceipt";
import { buildPilotWorkflowPlan } from "../src/pilotWorkflow";
import { buildValueBlueprint } from "../src/valueBlueprint";

const PILOT_RECEIPT_URL = "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-run/receipt.json";

function strongReceiptInput() {
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
  const workflow = buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario });
  return { recommendation, valueBlueprint, buyerScenario, workflow };
}

describe("pilot run receipt", () => {
  test("accepts a first pilot receipt only when measured savings, acceptance, scope, and evidence are present", () => {
    const input = strongReceiptInput();
    const receipt = buildPilotRunReceipt({
      ...input,
      pilotRun: {
        observedManualMinutes: 1680,
        observedAssistedMinutes: 560,
        participants: 4,
        acceptedTasks: 3,
        totalTasks: 3,
        evidenceUrl: PILOT_RECEIPT_URL,
        reviewerName: "Platform sponsor",
        notes: "Observed run completed with evidence attached."
      }
    });

    expect(receipt.readiness).toBe("accepted");
    expect(receipt.receiptScore).toBeGreaterThanOrEqual(80);
    expect(receipt.actualMinutesSavedPerRun).toBe(1120);
    expect(receipt.acceptanceRatePercent).toBe(100);
    expect(receipt.checks.every((check) => check.status === "clear")).toBe(true);
    expect(receipt.exportMarkdown).toContain("## Measured result");
  });

  test("keeps a run in evidence mode when the public proof URL is missing", () => {
    const input = strongReceiptInput();
    const receipt = buildPilotRunReceipt({
      ...input,
      pilotRun: {
        observedManualMinutes: 1680,
        observedAssistedMinutes: 560,
        participants: 4,
        acceptedTasks: 3,
        totalTasks: 3,
        evidenceUrl: "",
        reviewerName: "Platform sponsor",
        notes: ""
      }
    });

    expect(receipt.readiness).toBe("needs-evidence");
    expect(receipt.checks.find((check) => check.id === "public-evidence")).toMatchObject({
      status: "blocked"
    });
  });

  test("does not accept plain HTTP evidence as public pilot receipt proof", () => {
    const input = strongReceiptInput();
    const receipt = buildPilotRunReceipt({
      ...input,
      pilotRun: {
        observedManualMinutes: 1680,
        observedAssistedMinutes: 560,
        participants: 4,
        acceptedTasks: 3,
        totalTasks: 3,
        evidenceUrl: "http://proof.example.com/pilot-run/receipt.json",
        reviewerName: "Platform sponsor",
        notes: ""
      }
    });

    expect(receipt.readiness).toBe("needs-evidence");
    expect(receipt.checks.find((check) => check.id === "public-evidence")).toMatchObject({
      status: "blocked"
    });
  });

  test("normalizes unsafe pilot run fields before persistence", () => {
    expect(
      normalizePilotRunReceiptInput({
        observedManualMinutes: -1,
        observedAssistedMinutes: 99999,
        participants: 0,
        acceptedTasks: 99,
        totalTasks: 2,
        evidenceUrl: " https://proof.example.com/run ",
        reviewerName: " reviewer ",
        notes: " note "
      })
    ).toEqual({
      observedManualMinutes: 1,
      observedAssistedMinutes: 7200,
      participants: 1,
      acceptedTasks: 2,
      totalTasks: 2,
      evidenceUrl: "https://proof.example.com/run",
      reviewerName: "reviewer",
      notes: "note"
    });
  });

  test("renders an escaped public receipt with artifact links", () => {
    const input = strongReceiptInput();
    const receipt = buildPilotRunReceipt({
      ...input,
      pilotRun: {
        observedManualMinutes: 1680,
        observedAssistedMinutes: 560,
        participants: 4,
        acceptedTasks: 3,
        totalTasks: 3,
        evidenceUrl: PILOT_RECEIPT_URL,
        reviewerName: "Platform sponsor",
        notes: "Observed <script>alert(1)</script>"
      }
    });
    const html = renderPilotRunReceiptHtml(
      {
        ...receipt,
        headline: "Pilot <script>alert(2)</script>"
      },
      {
        valueReportUrl: "https://example.com/buyer-value",
        workflowUrl: "https://example.com/pilot-workflow",
        jsonUrl: "https://example.com/api/pilot-run-receipt",
        markdownUrl: "https://example.com/pilot-run-receipt.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("First Pilot Receipt");
    expect(html).toContain("https://example.com/api/pilot-run-receipt");
    expect(html).toContain("https://example.com/pilot-run-receipt.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<script>alert(2)</script>");
    expect(html).toContain("&lt;script&gt;alert(2)&lt;/script&gt;");
  });
});
