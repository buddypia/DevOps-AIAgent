import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerDecisionMatrix } from "../src/buyerDecisionMatrix";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotAgreement } from "../src/pilotAgreement";
import { buildPilotEvidenceLedger, renderPilotEvidenceLedgerHtml } from "../src/pilotEvidenceLedger";
import { buildPilotExecutionHandoff } from "../src/pilotExecution";
import { buildPilotProposal } from "../src/pilotProposal";
import { buildPilotRunReceipt } from "../src/pilotRunReceipt";
import { buildPilotWorkflowPlan } from "../src/pilotWorkflow";
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

function strongLedgerInput() {
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
  const agreement = buildPilotAgreement({ recommendation, valueBlueprint, buyerScenario, proposal, workflow, decisionMatrix, pilotReceipt });
  const execution = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl: "https://example.com" });
  return { recommendation, valueBlueprint, buyerScenario, proposal, workflow, pilotReceipt, decisionMatrix, agreement, execution };
}

describe("pilot evidence ledger", () => {
  test("summarizes the full buyer proof trail when every artifact is sponsor-ready", () => {
    const ledger = buildPilotEvidenceLedger(strongLedgerInput());

    expect(ledger.readiness).toBe("sponsor-ready");
    expect(ledger.events.map((event) => event.id)).toEqual(["buyer-case", "workflow", "measured-run", "procurement", "agreement", "execution"]);
    expect(ledger.exceptions).toEqual([]);
    expect(ledger.reviewMemo).toContain("evidence trail");
    expect(ledger.exportMarkdown).toContain("## Evidence events");
  });

  test("blocks sponsor review when proof artifacts are weak", () => {
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
    const proposal = buildPilotProposal({ recommendation, valueBlueprint, buyerScenario, workspace: { targetUrl: "", protopediaUrl: "", videoUrl: "", agentTrialEvidence: [] } });
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
    const execution = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl: "https://example.com" });
    const ledger = buildPilotEvidenceLedger({ recommendation, valueBlueprint, buyerScenario, proposal, workflow, pilotReceipt, decisionMatrix, agreement, execution });

    expect(ledger.readiness).toBe("blocked");
    expect(ledger.exceptions.length).toBeGreaterThan(0);
    expect(ledger.exceptions.some((exception) => exception.severity === "blocked")).toBe(true);
  });

  test("renders an escaped public ledger with artifact links", () => {
    const ledger = buildPilotEvidenceLedger(strongLedgerInput());
    const html = renderPilotEvidenceLedgerHtml(
      {
        ...ledger,
        headline: "Ledger <script>alert(1)</script>"
      },
      {
        proposalUrl: "https://example.com/buyer-proposal",
        decisionUrl: "https://example.com/buyer-decision",
        agreementUrl: "https://example.com/pilot-agreement",
        jsonUrl: "https://example.com/api/pilot-evidence-ledger",
        markdownUrl: "https://example.com/pilot-evidence-ledger.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Pilot Evidence Ledger");
    expect(html).toContain("https://example.com/api/pilot-evidence-ledger");
    expect(html).toContain("https://example.com/pilot-evidence-ledger.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Ledger &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
