import { describe, expect, test } from "vitest";
import { buildAdoptionOperatingPlan } from "../src/adoptionOperatingPlan";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerDecisionMatrix } from "../src/buyerDecisionMatrix";
import { buildBuyerTrustCenter, renderBuyerTrustCenterHtml } from "../src/buyerTrustCenter";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerWorkOrderBrief } from "../src/buyerWorkOrder";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotAgreement } from "../src/pilotAgreement";
import { buildPilotEvidenceLedger } from "../src/pilotEvidenceLedger";
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

function buildTrustInput(overrides: { weak?: boolean } = {}) {
  const projectBrief = overrides.weak
    ? "Short AI demo"
    : `${DEFAULT_PROJECT_BRIEF}\nGlobal platform teams need a buyer-ready pilot path with Cloud Run proof, security approval, measurable operational value, and a real trust boundary.`;
  const recommendation = overrides.weak
    ? recommendSquad(projectBrief, ["brief-cartographer"], 140)
    : recommendSquad(projectBrief, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
  const valueBlueprint = buildValueBlueprint(recommendation, projectBrief, "https://example.com");
  const buyerScenario = buildBuyerValueScenario(
    recommendation,
    overrides.weak
      ? {
          teamSize: 2,
          hourlyCostYen: 3500,
          cyclesPerMonth: 1,
          manualHoursPerCycle: 5,
          adoptionRatePercent: 15,
          incidentRiskYenPerMonth: 0
        }
      : {
          teamSize: 8,
          hourlyCostYen: 12000,
          cyclesPerMonth: 5,
          manualHoursPerCycle: 28,
          adoptionRatePercent: 75,
          incidentRiskYenPerMonth: 240000
        }
  );
  const workspace = overrides.weak ? { targetUrl: "", protopediaUrl: "", videoUrl: "", agentTrialEvidence: [] } : publicWorkspace;
  const workOrderInput = overrides.weak
    ? {
        request: "Review launch",
        targetUser: "",
        successMetric: "Launch readiness",
        currentBaseline: "Manual notes",
        dataSensitivity: "restricted" as const,
        evidenceUrl: ""
      }
    : {
        request: "Convert one release-readiness review into a public buyer proof packet with owners, acceptance checks, and a continue or revise decision.",
        targetUser: "Platform lead",
        successMetric: "Minutes saved per review and proof gaps closed before sponsor review",
        currentBaseline: "Manual release notes, scattered screenshots, and unclear owner handoffs",
        dataSensitivity: "public" as const,
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
      };
  const workOrder = buildBuyerWorkOrderBrief({ recommendation, valueBlueprint, buyerScenario, workOrder: workOrderInput });
  const proposal = buildPilotProposal({ recommendation, valueBlueprint, buyerScenario, workspace });
  const workflow = buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun: overrides.weak
      ? {
          observedManualMinutes: 50,
          observedAssistedMinutes: 55,
          participants: 1,
          acceptedTasks: 0,
          totalTasks: 2,
          evidenceUrl: "",
          reviewerName: "",
          notes: ""
        }
      : {
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
  const ledger = buildPilotEvidenceLedger({ recommendation, valueBlueprint, buyerScenario, proposal, workflow, pilotReceipt, decisionMatrix, agreement, execution });
  const adoptionPlan = buildAdoptionOperatingPlan({ recommendation, valueBlueprint, buyerScenario, workOrder, workflow, pilotReceipt, agreement, ledger });

  return { recommendation, valueBlueprint, workOrder, workOrderInput, pilotReceipt, agreement, ledger, adoptionPlan, workspace };
}

describe("buyer trust center", () => {
  test("packages public proof, data boundary, and stop rules into buyer-ready trust evidence", () => {
    const center = buildBuyerTrustCenter(buildTrustInput());

    expect(center.readiness).toBe("trust-ready");
    expect(center.trustScore).toBeGreaterThanOrEqual(85);
    expect(center.controls.map((control) => control.id)).toEqual([
      "data-boundary",
      "security-owner",
      "public-product-proof",
      "agent-trial-proof",
      "measured-run-proof",
      "audit-trail",
      "stop-rules"
    ]);
    expect(center.risks[0]?.id).toBe("risk-expansion-discipline");
    expect(center.decisionMemo.verdict).toBe("approve-bounded-pilot");
    expect(center.decisionMemo.evidenceRequests.map((request) => request.id)).toEqual([
      "memo-maintain-measured-run-proof",
      "memo-maintain-audit-trail",
      "memo-maintain-stop-rules"
    ]);
    expect(center.decisionMemo.sponsorAsk).toContain("receipt, ledger, and stop rules");
    expect(center.exportMarkdown).toContain("## Trust controls");
    expect(center.exportMarkdown).toContain("## Buyer questions");
    expect(center.exportMarkdown).toContain("## Procurement decision memo");
    expect(center.exportMarkdown).toContain("Verdict: approve-bounded-pilot");
  });

  test("blocks external rollout when data and proof are still demo-only", () => {
    const center = buildBuyerTrustCenter(buildTrustInput({ weak: true }));

    expect(center.readiness).toBe("blocked");
    expect(center.controls.find((control) => control.id === "data-boundary")?.status).toBe("blocked");
    expect(center.risks.some((risk) => risk.severity === "blocked")).toBe(true);
    expect(center.decisionMemo.verdict).toBe("do-not-expand");
    expect(center.decisionMemo.evidenceRequests.some((request) => request.id === "memo-data-boundary")).toBe(true);
    expect(center.decisionMemo.redLines.some((redLine) => redLine.includes("Restricted data is outside the first pilot boundary"))).toBe(true);
  });

  test("renders escaped public trust center with artifact links", () => {
    const center = buildBuyerTrustCenter(buildTrustInput());
    const html = renderBuyerTrustCenterHtml(
      {
        ...center,
        headline: "Trust <script>alert(1)</script>"
      },
      {
        launchRoomUrl: "https://example.com/launch-room",
        proofPacketUrl: "https://example.com/buyer-proof-packet",
        jsonUrl: "https://example.com/api/trust-center",
        markdownUrl: "https://example.com/trust-center.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer Trust Center");
    expect(html).toContain("Procurement decision memo");
    expect(html).toContain("Approve the next buyer pilot only inside the current data boundary");
    expect(html).toContain("https://example.com/api/trust-center");
    expect(html).toContain("https://example.com/trust-center.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Trust &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
