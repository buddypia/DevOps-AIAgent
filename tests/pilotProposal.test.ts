import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotProposal, renderPilotProposalHtml } from "../src/pilotProposal";
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

describe("pilot proposal", () => {
  test("turns a strong public workspace into a buyer-ready proposal", () => {
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
      valueBlueprint: buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF),
      workspace: publicWorkspace
    });

    expect(proposal.readiness).toBe("buyer-ready");
    expect(proposal.proposalScore).toBeGreaterThanOrEqual(82);
    expect(proposal.targetBuyer).toBe("Platform / DevOps Lead");
    expect(proposal.measurablePromise).toContain("h/month saved");
    expect(proposal.proofs.map((proof) => proof.status)).toEqual(["ready", "ready", "ready", "ready", "ready"]);
    expect(proposal.commitments.map((commitment) => commitment.owner)).toEqual(
      expect.arrayContaining(["A2A Market Broker", "Cloud Run SRE", "Gemini Strategist", "UX Guildmaster"])
    );
    expect(proposal.exportMarkdown).toContain("## Buyer objections");
  });

  test("keeps a credible offer as pilot-ready when public proof is missing", () => {
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
      valueBlueprint: buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF),
      workspace: {
        targetUrl: "",
        protopediaUrl: "",
        videoUrl: "",
        agentTrialEvidence: []
      }
    });

    expect(proposal.readiness).toBe("pilot-ready");
    expect(proposal.proofs.find((proof) => proof.id === "runtime")?.status).toBe("missing");
    expect(proposal.proofs.find((proof) => proof.id === "a2a-trial")?.status).toBe("missing");
    expect(proposal.objections.map((objection) => objection.id)).toContain("proof-gap");
    expect(proposal.objections.map((objection) => objection.id)).toContain("a2a-proof-gap");
  });

  test("does not mark a proposal buyer-ready when launch proof links are plain HTTP", () => {
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
      valueBlueprint: buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF),
      workspace: {
        ...publicWorkspace,
        targetUrl: "http://a2a-marketplace.run.app",
        protopediaUrl: "http://protopedia.net/prototype/a2a-marketplace",
        videoUrl: "http://youtu.be/demo"
      }
    });

    expect(proposal.readiness).toBe("pilot-ready");
    expect(proposal.proofs.find((proof) => proof.id === "runtime")?.status).toBe("missing");
    expect(proposal.proofs.find((proof) => proof.id === "submission")?.status).toBe("missing");
  });

  test("marks weak economics as a draft and tells the user not to pitch rollout", () => {
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
      valueBlueprint: buildValueBlueprint(recommendation, DEFAULT_PROJECT_BRIEF),
      workspace: publicWorkspace
    });

    expect(proposal.readiness).toBe("draft");
    expect(proposal.exclusions[0]).toContain("Do not sell this as a full rollout");
    expect(proposal.objections.map((objection) => objection.id)).toContain("economics-gap");
    expect(proposal.exportMarkdown).toContain("Readiness: draft");
  });

  test("renders a shareable escaped buyer proposal page", () => {
    const recommendation = recommendSquad("Platform <script>alert(1)</script> launch", ["market-broker", "cloud-run-sre", "gemini-strategist"], 200);
    const buyerScenario = buildBuyerValueScenario(recommendation);
    const proposal = buildPilotProposal({
      recommendation,
      buyerScenario,
      valueBlueprint: buildValueBlueprint(recommendation, "Platform <script>alert(1)</script> launch"),
      workspace: {
        targetUrl: "",
        protopediaUrl: "",
        videoUrl: "",
        agentTrialEvidence: []
      }
    });

    const html = renderPilotProposalHtml({
      ...proposal,
      title: "Pilot <script>alert(1)</script>"
    }, {
      jsonUrl: "https://example.com/api/buyer-proposal",
      markdownUrl: "https://example.com/buyer-proposal.md",
      executionUrl: "https://example.com/pilot-execution",
      diligenceUrl: "https://example.com/buyer-diligence",
      appUrl: "https://example.com"
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer Pilot Proposal");
    expect(html).toContain("https://example.com/api/buyer-proposal");
    expect(html).toContain("https://example.com/buyer-proposal.md");
    expect(html).toContain("https://example.com/pilot-execution");
    expect(html).toContain("https://example.com/buyer-diligence");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
