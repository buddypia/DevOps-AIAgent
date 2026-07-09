import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerDecisionMatrix } from "../src/buyerDecisionMatrix";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotAgreement, renderPilotAgreementHtml } from "../src/pilotAgreement";
import { buildPilotProposal } from "../src/pilotProposal";
import { buildPilotRunReceipt } from "../src/pilotRunReceipt";
import { buildPilotWorkflowPlan } from "../src/pilotWorkflow";
import { buildValueBlueprint } from "../src/valueBlueprint";

const publicWorkspace = {
  targetUrl: "https://a2a-marketplace.run.app",
  protopediaUrl: "https://protopedia.net/prototype/a2a-marketplace",
  videoUrl: "https://youtu.be/demo",
  agentTrialEvidence: []
};

function strongAgreementInput() {
  const projectBrief = `${DEFAULT_PROJECT_BRIEF}\nGlobal platform teams need a buyer-ready pilot path with Cloud Run proof, security approval, and measurable operational value.`;
  const recommendation = recommendSquad(projectBrief, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
  const valueBlueprint = buildValueBlueprint(recommendation, projectBrief, "https://example.com");
  const buyerScenario = buildBuyerValueScenario(recommendation, {
    teamSize: 8,
    hourlyCostYen: 12000,
    cyclesPerMonth: 5,
    manualHoursPerCycle: 28,
    adoptionRatePercent: 75,
    incidentRiskYenPerMonth: 240000
  });
  const proposal = buildPilotProposal({ recommendation, valueBlueprint, buyerScenario, workspace: publicWorkspace });
  const workflow = buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
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
  });
  const decisionMatrix = buildBuyerDecisionMatrix({ recommendation, valueBlueprint, buyerScenario, pilotReceipt });
  return { recommendation, valueBlueprint, buyerScenario, proposal, workflow, pilotReceipt, decisionMatrix };
}

describe("pilot agreement", () => {
  test("builds a ready-to-sign pilot agreement from strong proof artifacts", () => {
    const agreement = buildPilotAgreement(strongAgreementInput());

    expect(agreement.readiness).toBe("ready-to-sign");
    expect(agreement.agreementScore).toBeGreaterThanOrEqual(82);
    expect(agreement.terms.every((term) => term.status === "clear")).toBe(true);
    expect(agreement.signatures.map((signature) => signature.role)).toEqual(["Buyer sponsor", "Pilot owner", "Security reviewer"]);
    expect(agreement.exportMarkdown).toContain("## Terms");
    expect(agreement.exportMarkdown).toContain("## Stop rules");
  });

  test("blocks signature when the buyer economics and proof are weak", () => {
    const projectBrief = "Short AI demo";
    const recommendation = recommendSquad(projectBrief, ["brief-cartographer"], 140);
    const valueBlueprint = buildValueBlueprint(recommendation, projectBrief, "https://example.com");
    const buyerScenario = buildBuyerValueScenario(recommendation, {
      teamSize: 2,
      hourlyCostYen: 3500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 5,
      adoptionRatePercent: 15,
      incidentRiskYenPerMonth: 0
    });
    const proposal = buildPilotProposal({ recommendation, valueBlueprint, buyerScenario, workspace: publicWorkspace });
    const workflow = buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario });
    const pilotReceipt = buildPilotRunReceipt({
      recommendation,
      valueBlueprint,
      buyerScenario,
      workflow,
      pilotRun: {
        observedManualMinutes: 50,
        observedAssistedMinutes: 55,
        participants: 1,
        acceptedTasks: 0,
        totalTasks: 2,
        evidenceUrl: "",
        reviewerName: "",
        notes: ""
      }
    });
    const decisionMatrix = buildBuyerDecisionMatrix({ recommendation, valueBlueprint, buyerScenario, pilotReceipt });
    const agreement = buildPilotAgreement({ recommendation, valueBlueprint, buyerScenario, proposal, workflow, decisionMatrix, pilotReceipt });

    expect(agreement.readiness).toBe("blocked");
    expect(agreement.terms.some((term) => term.status === "blocked")).toBe(true);
  });

  test("renders an escaped public agreement with artifact links", () => {
    const agreement = buildPilotAgreement(strongAgreementInput());
    const html = renderPilotAgreementHtml(
      {
        ...agreement,
        headline: "Agreement <script>alert(1)</script>"
      },
      {
        proposalUrl: "https://example.com/buyer-proposal",
        decisionUrl: "https://example.com/buyer-decision",
        receiptUrl: "https://example.com/pilot-run-receipt",
        jsonUrl: "https://example.com/api/pilot-agreement",
        markdownUrl: "https://example.com/pilot-agreement.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Pilot Agreement Draft");
    expect(html).toContain("https://example.com/api/pilot-agreement");
    expect(html).toContain("https://example.com/pilot-agreement.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Agreement &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
