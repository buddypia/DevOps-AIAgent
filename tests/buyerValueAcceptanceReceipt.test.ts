import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import {
  BUYER_VALUE_ACCEPTANCE_RECEIPT_VERSION,
  buildBuyerValueAcceptanceReceipt,
  buyerValueAcceptanceChecksum,
  verifyBuyerValueAcceptanceReceipt
} from "../src/buyerValueAcceptanceReceipt";
import { buildBuyerValueReport } from "../src/buyerValueReport";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildValueBlueprint } from "../src/valueBlueprint";

const PILOT_RECEIPT_URL = "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-receipt";

function strongReport() {
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

  return buildBuyerValueReport({
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
}

describe("buyer value acceptance receipt", () => {
  test("seals a measured buyer value report into a sponsor-send receipt", () => {
    const receipt = buildBuyerValueAcceptanceReceipt({
      report: strongReport(),
      valueReportHref: "https://example.com/buyer-value",
      generatedAt: "2026-06-25T00:00:00.000Z"
    });

    expect(receipt.receiptId).toMatch(/^buyer-value-acceptance-ready-[a-f0-9]{8}$/);
    expect(receipt.payload).toMatchObject({
      receiptVersion: BUYER_VALUE_ACCEPTANCE_RECEIPT_VERSION,
      status: "ready",
      decision: "accept-sponsor-ask",
      reviewerName: "Platform sponsor",
      valueReportHref: "https://example.com/buyer-value",
      publicProofStatus: "ready",
      commitmentDecision: "send-to-sponsor"
    });
    expect(receipt.payload.checks.map((check) => check.id)).toEqual([
      "value-report",
      "assumption-audit",
      "measured-proof",
      "public-receipt",
      "sponsor-ask"
    ]);
    expect(receipt.payload.checks.every((check) => check.status === "ready")).toBe(true);
    expect(receipt.requestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(receipt.verifierHref).toContain("/receipt-verifier?request=");
    expect(receipt.exportMarkdown).toContain("## Acceptance checks");
    expect(receipt.exportMarkdown).toContain("fnv1a32:");

    const verification = verifyBuyerValueAcceptanceReceipt({
      checksum: receipt.checksum,
      payload: receipt.payload
    });

    expect(verification).toMatchObject({
      status: "verified",
      expectedChecksum: receipt.checksum,
      actualChecksum: buyerValueAcceptanceChecksum(receipt.payload)
    });
  });

  test("blocks external value acceptance when measured proof is missing", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["brief-cartographer"], 140);
    const valueBlueprint = buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF, "https://example.com");
    const buyerScenario = buildBuyerValueScenario(recommendation, {
      teamSize: 2,
      hourlyCostYen: 3500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 5,
      adoptionRatePercent: 15,
      incidentRiskYenPerMonth: 0
    });
    const report = buildBuyerValueReport({ recommendation, valueBlueprint, buyerScenario });
    const receipt = buildBuyerValueAcceptanceReceipt({
      report,
      generatedAt: "2026-06-25T00:00:00.000Z"
    });

    expect(receipt.payload).toMatchObject({
      status: "blocked",
      decision: "hold-value-claim",
      publicProofStatus: "blocked",
      commitmentDecision: "hold-pitch"
    });
    expect(receipt.payload.checks.some((check) => check.status === "blocked")).toBe(true);
    expect(receipt.summary).toContain("Do not use this value proof externally");
  });
});
