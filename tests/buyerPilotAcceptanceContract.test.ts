import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerPilotAcceptanceContract } from "../src/buyerPilotAcceptanceContract";
import type { BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import type { BuyerWorkOrderInput } from "../src/buyerWorkOrder";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import type { PilotRunReceiptInput } from "../src/pilotRunReceipt";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "../src/publicProofUrl";
import MarketHeroAcceptanceContract from "../src/MarketHeroAcceptanceContract";

const strongWorkOrder: BuyerWorkOrderInput = {
  request: "Convert the release readiness review into a buyer-safe packet with owners, proof links, and a continue or stop decision before launch.",
  targetUser: "Platform release lead",
  successMetric: "Minutes saved per release review and proof gaps closed before sponsor approval",
  currentBaseline: "Manual notes, spreadsheet follow-up, and proof URLs collected after the review",
  dataSensitivity: "public",
  evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
};

const strongPilotRun: PilotRunReceiptInput = {
  observedManualMinutes: 150,
  observedAssistedMinutes: 82,
  participants: 4,
  acceptedTasks: 4,
  totalTasks: 4,
  evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-run",
  reviewerName: "Platform sponsor",
  notes: "Observed run accepted."
};

const proofLinks = [
  { id: "targetUrl", label: "Cloud Run URL", value: "https://a2a-marketplace.run.app" },
  { id: "protopediaUrl", label: "ProtoPedia URL", value: "https://protopedia.net/prototype/a2a-marketplace" },
  { id: "videoUrl", label: "Walkthrough video", value: "https://youtu.be/demo-recording" },
  { id: "pilotEvidenceUrl", label: "Pilot evidence", value: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-run" },
  { id: "workOrderEvidenceUrl", label: "Work-order evidence", value: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order" }
];

const proofFields = [
  { key: "targetUrl", label: "Deployed URL", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.targetUrl, href: "#launch-evidence-console" },
  { key: "protopediaUrl", label: "ProtoPedia URL", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl, href: "#launch-evidence-console" },
  { key: "videoUrl", label: "Walkthrough video", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl, href: "#launch-evidence-console" },
  { key: "pilotEvidenceUrl", label: "Pilot receipt", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.pilotEvidenceUrl, href: "#pilot-run-receipt" },
  { key: "workOrderEvidenceUrl", label: "Work order proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.workOrderEvidenceUrl, href: "#buyer-work-order-studio" }
];

function strongScenario() {
  const recommendation = recommendSquad(
    `${DEFAULT_PROJECT_BRIEF}\nGlobal platform teams need a buyer-ready pilot path with Cloud Run proof, security review, and measured operational value.`,
    ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"],
    260
  );
  return buildBuyerValueScenario(recommendation, {
    teamSize: 8,
    hourlyCostYen: 12000,
    cyclesPerMonth: 5,
    manualHoursPerCycle: 28,
    adoptionRatePercent: 78,
    incidentRiskYenPerMonth: 260000
  });
}

function verifiedProof(): BuyerShareGateProofVerificationSummary {
  return {
    checkedAt: "2026-06-26T00:00:00.000Z",
    verifiedCount: proofLinks.length,
    totalCount: proofLinks.length,
    score: 100,
    results: proofLinks.map((link) => ({
      id: link.id,
      label: link.label,
      status: "pass",
      httpStatus: 200,
      evidence: `${link.label} returned HTTP 200.`,
      action: "Keep this proof URL attached."
    }))
  };
}

describe("buyer pilot acceptance contract", () => {
  test("clears the contract when scope, value, measured run, proof, data, and cap are buyer-safe", () => {
    const contract = buildBuyerPilotAcceptanceContract({
      workOrder: strongWorkOrder,
      buyerScenario: strongScenario(),
      pilotRun: strongPilotRun,
      proofLinks,
      proofVerification: verifiedProof(),
      launchRoomHref: "/launch-room"
    });

    expect(contract.decision).toBe("ready-to-send");
    expect(contract.status).toBe("clear");
    expect(contract.score).toBe(100);
    expect(contract.openGateCount).toBe(0);
    expect(contract.gates.every((gate) => gate.status === "clear")).toBe(true);
    expect(contract.repairCommands).toEqual([]);
    expect(contract.repairPacketText).toContain("No repair commands");
    expect(contract.primaryAction).toMatchObject({ label: "Open launch room", href: "/launch-room" });
    expect(contract.exportMarkdown).toContain("## Acceptance gates");
    expect(contract.exportMarkdown).toContain("Continue:");
    expect(contract.exportMarkdown).toContain("Revise:");
    expect(contract.exportMarkdown).toContain("Stop:");
  });

  test("keeps public URLs in redline mode until live verification runs", () => {
    const contract = buildBuyerPilotAcceptanceContract({
      workOrder: strongWorkOrder,
      buyerScenario: strongScenario(),
      pilotRun: strongPilotRun,
      proofLinks,
      proofVerification: null,
      proofRoomHref: "/buyer-proof-room"
    });

    expect(contract.decision).toBe("redline-first");
    expect(contract.status).toBe("watch");
    expect(contract.gates.find((gate) => gate.id === "public-proof")).toMatchObject({
      status: "watch",
      value: "5/5 public",
      fix: "Run Verify live links before sending.",
      href: "/buyer-proof-room"
    });
    expect(contract.repairCommands[0]).toMatchObject({
      gateId: "public-proof",
      label: "Verify public proof",
      priority: "now",
      command: "Run Verify live links before sending and attach the latest result to the buyer room.",
      href: "/buyer-proof-room"
    });
    expect(contract.repairPacketText).toContain("## Repair commands");
    expect(contract.repairPacketText).toContain("Run Verify live links before sending");
    expect(contract.exportMarkdown).toContain("## Repair commands");
    expect(contract.primaryAction).toMatchObject({ label: "Fix Live proof", href: "/buyer-proof-room" });
  });

  test("targets the exact missing public proof field for inline repair", () => {
    const missingStoryProofLinks = proofLinks.map((link) => (link.id === "protopediaUrl" ? { ...link, value: "" } : link));
    const contract = buildBuyerPilotAcceptanceContract({
      workOrder: strongWorkOrder,
      buyerScenario: strongScenario(),
      pilotRun: strongPilotRun,
      proofLinks: missingStoryProofLinks,
      proofVerification: null,
      proofRoomHref: "/buyer-proof-room"
    });

    expect(contract.decision).toBe("hold");
    expect(contract.repairCommands[0]).toMatchObject({
      gateId: "public-proof",
      label: "Attach public proof",
      target: {
        type: "proof-link",
        fieldId: "protopediaUrl",
        label: "ProtoPedia URL",
        currentValue: "",
        href: "/buyer-proof-room"
      }
    });
    expect(contract.repairPacketText).toContain("Target: ProtoPedia URL (protopediaUrl)");
  });

  test("holds buyer sharing when scope, evidence, measurement, and data boundary are unsafe", () => {
    const weakRecommendation = recommendSquad("Short internal AI experiment", ["brief-cartographer"], 140);
    const weakScenario = buildBuyerValueScenario(weakRecommendation, {
      teamSize: 1,
      hourlyCostYen: 2500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 2,
      adoptionRatePercent: 10,
      incidentRiskYenPerMonth: 0
    });
    const contract = buildBuyerPilotAcceptanceContract({
      workOrder: {
        request: "Try AI",
        targetUser: "",
        successMetric: "Save time",
        currentBaseline: "Manual",
        dataSensitivity: "restricted",
        evidenceUrl: ""
      },
      buyerScenario: weakScenario,
      pilotRun: {
        observedManualMinutes: 20,
        observedAssistedMinutes: 25,
        participants: 1,
        acceptedTasks: 0,
        totalTasks: 2,
        evidenceUrl: "",
        reviewerName: "",
        notes: ""
      },
      proofLinks: [{ id: "targetUrl", label: "Cloud Run URL", value: "" }]
    });

    expect(contract.decision).toBe("hold");
    expect(contract.status).toBe("blocked");
    expect(contract.openGateCount).toBeGreaterThanOrEqual(4);
    expect(contract.gates.find((gate) => gate.id === "data-boundary")).toMatchObject({
      status: "blocked",
      fix: "Redact restricted inputs or keep the pilot internal."
    });
    expect(contract.repairCommands[0]).toMatchObject({
      gateId: "scope",
      label: "Rewrite buyer scope",
      priority: "now"
    });
    expect(contract.repairPacketText).toContain("Rewrite the work order with one target buyer");
    expect(contract.hardTruth).toMatch(/blocks external sharing/i);
  });

  test("renders the first-screen contract with exportable terms and gate links", () => {
    const html = renderToStaticMarkup(
      createElement(MarketHeroAcceptanceContract, {
        workOrder: strongWorkOrder,
        buyerScenario: strongScenario(),
        pilotRun: strongPilotRun,
        proofLinks,
        proofVerification: null,
        workflowIntakeHref: "#quick-workflow-intake",
        valueReportHref: "#buyer-value-simulator",
        measuredRunHref: "#pilot-run-receipt",
        proofRoomHref: "/buyer-proof-room",
        launchRoomHref: "/launch-room",
        onCopyText: async () => true
      })
    );

    expect(html).toContain("Acceptance contract");
    expect(html).toContain("Redline first");
    expect(html).toContain("Fix Live proof");
    expect(html).toContain("Next repair");
    expect(html).toContain("Verify public proof");
    expect(html).toContain("Copy repair");
    expect(html).toContain("Export repair");
    expect(html).toContain("Copy terms");
    expect(html).toContain("Export");
    expect(html).toContain("/buyer-proof-room");
    expect(html).toContain("buyer-pilot-acceptance-contract.md");
    expect(html).toContain("buyer-pilot-acceptance-repair.md");
  });

  test("renders an inline proof URL repair action when the contract knows the missing proof field", () => {
    const missingStoryProofLinks = proofLinks.map((link) => (link.id === "protopediaUrl" ? { ...link, value: "" } : link));
    const proofIntake = Object.fromEntries(missingStoryProofLinks.map((link) => [link.id, link.value]));
    const html = renderToStaticMarkup(
      createElement(MarketHeroAcceptanceContract, {
        workOrder: strongWorkOrder,
        buyerScenario: strongScenario(),
        pilotRun: strongPilotRun,
        proofLinks: missingStoryProofLinks,
        proofVerification: null,
        workflowIntakeHref: "#quick-workflow-intake",
        valueReportHref: "#buyer-value-simulator",
        measuredRunHref: "#pilot-run-receipt",
        proofRoomHref: "/buyer-proof-room",
        launchRoomHref: "/launch-room",
        proofFields,
        proofIntake,
        proofRepairDraft: { protopediaUrl: "https://protopedia.net/prototype/repaired" },
        proofVerifyStatus: "idle",
        onProofRepairDraftChange: () => undefined,
        onApplyProofRepairDraft: () => undefined,
        onVerifyProofLinks: () => undefined,
        onCopyText: async () => true
      })
    );

    expect(html).toContain("Attach public proof");
    expect(html).toContain("Paste proof URL");
    expect(html).toContain("ProtoPedia URL");
    expect(html).toContain("https://protopedia.net/prototype/repaired");
    expect(html).toContain("Apply &amp; verify");
  });
});
