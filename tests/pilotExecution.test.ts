import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildPilotExecutionHandoff, renderPilotExecutionHtml } from "../src/pilotExecution";
import { buildPilotProposal } from "../src/pilotProposal";
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
  ]
};

function buildStrongProposal(workspace = publicWorkspace) {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster"], 200);
  const buyerScenario = buildBuyerValueScenario(recommendation, {
    teamSize: 8,
    hourlyCostYen: 12000,
    cyclesPerMonth: 5,
    manualHoursPerCycle: 28,
    adoptionRatePercent: 75,
    incidentRiskYenPerMonth: 240000
  });
  const proposal = buildPilotProposal({
    recommendation,
    buyerScenario,
    valueBlueprint: buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF, "https://example.com"),
    workspace
  });
  return { recommendation, proposal };
}

describe("pilot execution handoff", () => {
  test("turns a buyer-ready proposal into a ready execution handoff", () => {
    const { recommendation, proposal } = buildStrongProposal();
    const handoff = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl: "https://example.com" });

    expect(handoff.readiness).toBe("ready-to-start");
    expect(handoff.executionScore).toBeGreaterThanOrEqual(85);
    expect(handoff.gates.map((gate) => gate.status)).toEqual(["ready", "ready", "ready", "ready", "ready"]);
    expect(handoff.workOrders).toHaveLength(3);
    expect(handoff.workOrders.map((order) => order.status)).toEqual(["ready", "ready", "ready"]);
    expect(handoff.workOrders[0].proofUrl).toBe("https://example.com/buyer-proposal");
    expect(handoff.exportMarkdown).toContain("Pilot Execution Handoff");
    expect(handoff.exportMarkdown).toContain("Continue");
    expect(handoff.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "pilot.execute",
      readiness: "ready-to-start"
    });
  });

  test("keeps a credible pilot on proof watch when public proof is missing", () => {
    const { recommendation, proposal } = buildStrongProposal({
      targetUrl: "",
      protopediaUrl: "",
      videoUrl: "",
      agentTrialEvidence: []
    });
    const handoff = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl: "https://example.com" });

    expect(proposal.readiness).toBe("pilot-ready");
    expect(handoff.readiness).toBe("needs-proof");
    expect(handoff.gates.filter((gate) => gate.status === "blocked").map((gate) => gate.id)).toEqual(expect.arrayContaining(["runtime", "submission", "a2a-trial"]));
    expect(handoff.workOrders.map((order) => order.status)).toEqual(["watch", "watch", "watch"]);
    expect(handoff.hardTruth).toContain("Do not start");
  });

  test("blocks execution when the proposal is still a draft", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["brief-cartographer"], 140);
    const buyerScenario = buildBuyerValueScenario(recommendation, {
      teamSize: 2,
      hourlyCostYen: 3500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 5,
      adoptionRatePercent: 15,
      incidentRiskYenPerMonth: 0
    });
    const proposal = buildPilotProposal({
      recommendation,
      buyerScenario,
      valueBlueprint: buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF, "https://example.com"),
      workspace: publicWorkspace
    });
    const handoff = buildPilotExecutionHandoff({ proposal, recommendation });

    expect(proposal.readiness).toBe("draft");
    expect(handoff.readiness).toBe("blocked");
    expect(handoff.workOrders.every((order) => order.status === "blocked")).toBe(true);
    expect(handoff.kickoffCommand).toContain("Do not assign");
  });

  test("renders escaped public handoff HTML", () => {
    const { recommendation, proposal } = buildStrongProposal();
    const handoff = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl: "https://example.com" });
    const html = renderPilotExecutionHtml(
      {
        ...handoff,
        headline: "Pilot <script>alert(1)</script>",
        hardTruth: "Close <script>alert(2)</script> proof"
      },
      {
        proposalUrl: "https://example.com/buyer-proposal",
        diligenceUrl: "https://example.com/buyer-diligence",
        jsonUrl: "https://example.com/api/pilot-execution",
        markdownUrl: "https://example.com/pilot-execution.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Pilot Execution Handoff");
    expect(html).toContain("https://example.com/api/pilot-execution");
    expect(html).toContain("https://example.com/buyer-diligence");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<script>alert(2)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
