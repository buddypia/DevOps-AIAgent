import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerDiligenceRoom, renderBuyerDiligenceHtml } from "../src/buyerDiligence";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotExecutionHandoff } from "../src/pilotExecution";
import { buildPilotProposal } from "../src/pilotProposal";
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
  ]
};

function buildStrongRoom(workspace = publicWorkspace) {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
  const buyerScenario = buildBuyerValueScenario(recommendation, {
    teamSize: 8,
    hourlyCostYen: 12000,
    cyclesPerMonth: 5,
    manualHoursPerCycle: 28,
    adoptionRatePercent: 75,
    incidentRiskYenPerMonth: 240000
  });
  const valueBlueprint = buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF, "https://example.com");
  const proposal = buildPilotProposal({
    recommendation,
    buyerScenario,
    valueBlueprint,
    workspace
  });
  const handoff = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl: "https://example.com" });
  return {
    recommendation,
    buyerScenario,
    valueBlueprint,
    proposal,
    handoff,
    room: buildBuyerDiligenceRoom({
      proposal,
      handoff,
      buyerScenario,
      valueBlueprint,
      recommendation,
      baseUrl: "https://example.com"
    })
  };
}

describe("buyer diligence room", () => {
  test("turns a buyer-ready pilot into an approval-ready room", () => {
    const { room } = buildStrongRoom();

    expect(room.readiness).toBe("approval-ready");
    expect(room.diligenceScore).toBeGreaterThanOrEqual(85);
    expect(room.approvalQuestions.map((question) => question.status)).toEqual(["clear", "clear", "clear", "clear", "clear", "clear"]);
    expect(room.approvalQuestions.find((question) => question.id === "agent-proof")).toMatchObject({
      label: "Agent proof",
      status: "clear",
      owner: "A2A Market Broker"
    });
    expect(room.evidenceLedger.find((item) => item.id === "proposal-a2a-trial")).toMatchObject({
      status: "clear",
      proofUrl: "https://example.com/buyer-proposal#a2a-trial"
    });
    expect(room.riskRegister.find((risk) => risk.id === "agent-proof")?.status).toBe("clear");
    expect(room.evidenceLedger.every((item) => item.status === "clear")).toBe(true);
    expect(room.commercialTerms.map((term) => term.label)).toEqual(["Monthly value", "Payback target", "Pilot ceiling", "Pilot users"]);
    expect(room.exportMarkdown).toContain("Buyer Due Diligence Room");
    expect(room.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "buyer.diligence",
      readiness: "approval-ready"
    });
  });

  test("keeps the room in evidence mode when public proof is missing", () => {
    const { proposal, room } = buildStrongRoom({
      targetUrl: "",
      protopediaUrl: "",
      videoUrl: "",
      agentTrialEvidence: []
    });

    expect(proposal.readiness).toBe("pilot-ready");
    expect(room.readiness).toBe("needs-evidence");
    expect(room.approvalQuestions.find((question) => question.id === "inspectable-product")?.status).toBe("blocked");
    expect(room.approvalQuestions.find((question) => question.id === "agent-proof")?.status).toBe("blocked");
    expect(room.riskRegister.find((risk) => risk.id === "public-proof")?.status).toBe("blocked");
    expect(room.riskRegister.find((risk) => risk.id === "agent-proof")?.status).toBe("blocked");
    expect(room.hardTruth).toContain("blocked evidence");
  });

  test("blocks approval when economics are too weak", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["brief-cartographer"], 140);
    const buyerScenario = buildBuyerValueScenario(recommendation, {
      teamSize: 2,
      hourlyCostYen: 3500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 5,
      adoptionRatePercent: 15,
      incidentRiskYenPerMonth: 0
    });
    const valueBlueprint = buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF, "https://example.com");
    const proposal = buildPilotProposal({
      recommendation,
      buyerScenario,
      valueBlueprint,
      workspace: publicWorkspace
    });
    const handoff = buildPilotExecutionHandoff({ proposal, recommendation });
    const room = buildBuyerDiligenceRoom({ proposal, handoff, buyerScenario, valueBlueprint, recommendation });

    expect(proposal.readiness).toBe("draft");
    expect(room.readiness).toBe("blocked");
    expect(room.approvalQuestions.find((question) => question.id === "commercial-fit")?.status).toBe("blocked");
    expect(room.riskRegister.find((risk) => risk.id === "economics")?.status).toBe("blocked");
  });

  test("renders escaped public diligence HTML", () => {
    const { room } = buildStrongRoom();
    const html = renderBuyerDiligenceHtml(
      {
        ...room,
        headline: "Diligence <script>alert(1)</script>",
        hardTruth: "Close <script>alert(2)</script> first"
      },
      {
        proposalUrl: "https://example.com/buyer-proposal",
        executionUrl: "https://example.com/pilot-execution",
        jsonUrl: "https://example.com/api/buyer-diligence",
        markdownUrl: "https://example.com/buyer-diligence.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer Due Diligence Room");
    expect(html).toContain("Agent proof");
    expect(html).toContain("A2A trial proof");
    expect(html).toContain("https://example.com/api/buyer-diligence");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<script>alert(2)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
