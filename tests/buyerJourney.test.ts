import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerJourney } from "../src/buyerJourney";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildValueBlueprint } from "../src/valueBlueprint";

const publicWorkspace = {
  targetUrl: "https://a2a-marketplace.run.app",
  protopediaUrl: "https://protopedia.net/prototype/a2a-marketplace",
  videoUrl: "https://youtu.be/demo",
  agentTrialEvidence: [
    {
      id: "trial-proof-trial-custom-agent-card-auditor",
      receiptId: "trial-custom-agent-card-auditor",
      agentId: "custom-agent-card-auditor",
      agentName: "Agent Card Auditor",
      skillId: "agent-card.audit",
      status: "accepted" as const,
      score: 100,
      artifactUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/agent-card-audit/receipt.json",
      evidenceSource: "Cloud Run public logs and signed A2A receipt",
      headline: "Trial evidence satisfies the generated A2A receipt",
      summary: "Agent Card Auditor returned an accepted A2A proof receipt.",
      attachedAt: "2026-06-18T00:00:00.000Z"
    }
  ],
  pilotRun: {
    observedManualMinutes: 1680,
    observedAssistedMinutes: 560,
    participants: 4,
    acceptedTasks: 3,
    totalTasks: 3,
    evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-run/receipt.json",
    reviewerName: "Platform sponsor",
    notes: "Observed run completed with evidence attached."
  }
};

function buildStrongJourney(workspace = publicWorkspace) {
  const projectBrief = `${DEFAULT_PROJECT_BRIEF}\nGlobal platform teams need a buyer-ready pilot path with Cloud Run proof, security approval, and measurable operational value.`;
  const recommendation = recommendSquad(projectBrief, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
  const buyerScenario = buildBuyerValueScenario(recommendation, {
    teamSize: 8,
    hourlyCostYen: 12000,
    cyclesPerMonth: 5,
    manualHoursPerCycle: 28,
    adoptionRatePercent: 75,
    incidentRiskYenPerMonth: 240000
  });
  const valueBlueprint = buildValueBlueprint(recommendation, projectBrief, "https://example.com");
  return buildBuyerJourney({
    projectBrief,
    recommendation,
    buyerScenario,
    valueBlueprint,
    buyerWorkOrder: {
      request: "Turn one Cloud Run release-readiness review into a buyer proof packet with owner, acceptance, receipt, and stop decision.",
      targetUser: "Platform lead",
      successMetric: "Minutes saved per release review and proof gaps closed before sponsor review",
      currentBaseline: "Manual review notes, scattered proof links, and unclear ownership before launch",
      dataSensitivity: "public",
      evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order/brief.json"
    },
    workspace,
    baseUrl: "https://example.com"
  });
}

describe("buyer journey", () => {
  test("summarizes a complete buyer path through the proof-backed commercial offer", () => {
    const journey = buildStrongJourney();

    expect(journey.readiness).toBe("ready-for-sponsor");
    expect(journey.journeyScore).toBeGreaterThanOrEqual(90);
    expect(journey.completedSteps).toBe(journey.totalSteps);
    expect(journey.nextAction).toMatchObject({
      id: "share-commercial-offer",
      owner: "Buyer sponsor"
    });
    expect(journey.remainingStepCount).toBe(0);
    expect(journey.focusSteps.map((step) => step.id)).toEqual(["commercial-offer", "sponsor-review", "proof-packet", "pilot-execution"]);
    expect(journey.nextAction.href).toContain("/commercial-offer?");
    expect(journey.artifacts.map((artifact) => artifact.id)).toEqual([
      "proposal",
      "value-report",
      "work-order",
      "pilot-workflow",
      "pilot-receipt",
      "sponsor-review",
      "proof-packet",
      "decision-matrix",
      "pilot-agreement",
      "evidence-ledger",
      "adoption-plan",
      "trust-center",
      "commercial-offer",
      "diligence-room",
      "execution-handoff"
    ]);
    expect(journey.artifacts.find((artifact) => artifact.id === "value-report")?.href).toContain("/buyer-value?");
    expect(journey.artifacts.find((artifact) => artifact.id === "work-order")?.href).toContain("/work-order-brief?");
    expect(journey.artifacts.find((artifact) => artifact.id === "sponsor-review")?.href).toContain("/sponsor-review?");
    expect(journey.artifacts.find((artifact) => artifact.id === "proof-packet")?.href).toContain("/buyer-proof-packet?");
    expect(journey.artifacts.find((artifact) => artifact.id === "decision-matrix")?.href).toContain("/buyer-decision?");
    expect(journey.artifacts.find((artifact) => artifact.id === "pilot-agreement")?.href).toContain("/pilot-agreement?");
    expect(journey.artifacts.find((artifact) => artifact.id === "evidence-ledger")?.href).toContain("/pilot-evidence-ledger?");
    expect(journey.artifacts.find((artifact) => artifact.id === "adoption-plan")?.href).toContain("/adoption-plan?");
    expect(journey.artifacts.find((artifact) => artifact.id === "trust-center")?.href).toContain("/trust-center?");
    expect(journey.artifacts.find((artifact) => artifact.id === "commercial-offer")?.href).toContain("/commercial-offer?");
    expect(journey.artifacts.find((artifact) => artifact.id === "pilot-workflow")?.href).toContain("/pilot-workflow?");
    expect(journey.artifacts.find((artifact) => artifact.id === "pilot-receipt")?.href).toContain("/pilot-run-receipt?");
  });

  test("prioritizes public proof when launch URLs are missing", () => {
    const journey = buildStrongJourney({
      targetUrl: "",
      protopediaUrl: "",
      videoUrl: "",
      agentTrialEvidence: [],
      pilotRun: publicWorkspace.pilotRun
    });

    expect(journey.readiness).toBe("needs-evidence");
    expect(journey.steps.find((step) => step.id === "public-proof")?.status).toBe("blocked");
    expect(journey.remainingStepCount).toBeGreaterThan(0);
    expect(journey.focusSteps.map((step) => step.id)).toEqual(["work-order", "public-proof", "pilot-workflow", "pilot-receipt"]);
    expect(journey.nextAction).toMatchObject({
      label: "Attach public launch proof",
      owner: "Cloud Run SRE",
      href: "#launch-evidence-console"
    });
  });

  test("does not treat public URLs alone as sponsor-ready without accepted A2A trial proof", () => {
    const journey = buildStrongJourney({
      targetUrl: "https://a2a-marketplace.run.app",
      protopediaUrl: "https://protopedia.net/prototype/a2a-marketplace",
      videoUrl: "https://youtu.be/demo",
      agentTrialEvidence: [],
      pilotRun: publicWorkspace.pilotRun
    });

    expect(journey.readiness).toBe("needs-evidence");
    expect(journey.steps.find((step) => step.id === "public-proof")).toMatchObject({
      status: "attention",
      action: "Attach verified A2A trial proof"
    });
  });

  test("blocks the path when buyer economics cannot support approval", () => {
    const projectBrief = "Short AI demo";
    const recommendation = recommendSquad(projectBrief, ["brief-cartographer"], 140);
    const buyerScenario = buildBuyerValueScenario(recommendation, {
      teamSize: 2,
      hourlyCostYen: 3500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 5,
      adoptionRatePercent: 15,
      incidentRiskYenPerMonth: 0
    });
    const valueBlueprint = buildValueBlueprint(recommendation, projectBrief, "https://example.com");
    const journey = buildBuyerJourney({
      projectBrief,
      recommendation,
      buyerScenario,
      valueBlueprint,
      workspace: publicWorkspace
    });

    expect(journey.readiness).toBe("blocked");
    expect(journey.steps.find((step) => step.id === "buyer-value")?.status).toBe("blocked");
    expect(journey.nextAction).toMatchObject({
      label: "Tighten the project brief",
      href: "#marketplace-workbench"
    });
    expect(journey.hardTruth).toContain("feels like a demo");
  });
});
