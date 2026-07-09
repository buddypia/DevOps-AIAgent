import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerJourney } from "../src/buyerJourney";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildSponsorHandoffPacket } from "../src/sponsorHandoff";
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

function buildJourney(workspace = publicWorkspace) {
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

describe("sponsor handoff packet", () => {
  test("builds a sponsor-ready note with the share link and buyer artifacts", () => {
    const packet = buildSponsorHandoffPacket({
      journey: buildJourney(),
      shareHref: "https://example.com/?workspace=ready",
      agentTrialEvidence: publicWorkspace.agentTrialEvidence
    });

    expect(packet.tone).toBe("ready");
    expect(packet.subject).toContain("Sponsor review ready");
    expect(packet.links.map((link) => link.id)).toEqual([
      "workspace",
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
    expect(packet.proofHighlights.find((proof) => proof.id === "a2a-trial")).toMatchObject({
      tone: "ready",
      value: "Agent Card Auditor / agent-card.audit"
    });
    expect(packet.decisionAsk).toContain("Approve the first buyer pilot review");
    expect(packet.copyText).toContain("https://example.com/?workspace=ready");
    expect(packet.copyText).toContain("A2A trial proof");
    expect(packet.copyText).toContain("https://storage.googleapis.com/a2a-agent-marketplace-proof/agent-card-audit/receipt.json");
    expect(packet.copyText).toContain("Review");
    expect(packet.copyText).toContain("Packet");
    expect(packet.copyText).toContain("Work order");
    expect(packet.copyText).toContain("Adoption");
    expect(packet.copyText).toContain("Trust");
    expect(packet.copyText).toContain("Offer");
    expect(packet.copyText).toContain("Diligence");
    expect(packet.copyText).toContain("Decision");
    expect(packet.copyText).toContain("Agreement");
    expect(packet.copyText).toContain("Ledger");
    expect(packet.copyText).toContain("Workflow");
    expect(packet.copyText).toContain("Receipt");
    expect(packet.copyText).toContain("Execution");
  });

  test("keeps evidence gaps explicit before approval", () => {
    const packet = buildSponsorHandoffPacket({
      journey: buildJourney({
        targetUrl: "",
        protopediaUrl: "",
        videoUrl: "",
        agentTrialEvidence: [],
        pilotRun: publicWorkspace.pilotRun
      }),
      shareHref: "https://example.com/?workspace=evidence"
    });

    expect(packet.tone).toBe("evidence");
    expect(packet.subject).toContain("Evidence needed");
    expect(packet.nextActionLine).toContain("Attach public launch proof");
    expect(packet.proofHighlights.find((proof) => proof.id === "a2a-trial")?.tone).toBe("blocked");
    expect(packet.decisionAsk).toContain("Hold sponsor approval");
    expect(packet.copyText).toContain("needs-evidence");
  });

  test("labels blocked journeys as draft context only", () => {
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
    const packet = buildSponsorHandoffPacket({
      journey,
      shareHref: "https://example.com/?workspace=blocked",
      agentTrialEvidence: publicWorkspace.agentTrialEvidence
    });

    expect(packet.tone).toBe("blocked");
    expect(packet.subject).toContain("Draft only");
    expect(packet.summary).toContain("weak demo");
    expect(packet.copyText).toContain("blocked");
  });
});
