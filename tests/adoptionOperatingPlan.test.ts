import { describe, expect, test } from "vitest";
import { buildAdoptionOperatingPlan, renderAdoptionOperatingPlanHtml, verifyAdoptionSuccessReceipt } from "../src/adoptionOperatingPlan";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerDecisionMatrix } from "../src/buyerDecisionMatrix";
import { buildBuyerDiligenceRoom } from "../src/buyerDiligence";
import { buildBuyerProofPacket } from "../src/buyerProofPacket";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerWorkOrderBrief } from "../src/buyerWorkOrder";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotAgreement } from "../src/pilotAgreement";
import { buildPilotEvidenceLedger } from "../src/pilotEvidenceLedger";
import { buildPilotExecutionHandoff } from "../src/pilotExecution";
import { buildPilotProposal } from "../src/pilotProposal";
import { buildPilotRunReceipt } from "../src/pilotRunReceipt";
import { buildPilotWorkflowPlan } from "../src/pilotWorkflow";
import { buildSponsorDecisionReceipt, buildSponsorReviewRoom } from "../src/sponsorReviewRoom";
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

function buildPlanInput(overrides: { weak?: boolean } = {}) {
  const projectBrief = overrides.weak
    ? "Short AI demo"
    : `${DEFAULT_PROJECT_BRIEF}\nGlobal platform teams need a buyer-ready pilot path with Cloud Run proof, security approval, measurable operational value, and a real adoption owner.`;
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
  const workOrder = buildBuyerWorkOrderBrief({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder: overrides.weak
      ? {
          request: "Review launch",
          targetUser: "",
          successMetric: "Launch readiness",
          currentBaseline: "Manual notes",
          dataSensitivity: "restricted",
          evidenceUrl: ""
        }
      : {
          request: "Convert one release-readiness review into a public buyer proof packet with owners, acceptance checks, and a continue or revise decision.",
          targetUser: "Platform lead",
          successMetric: "Minutes saved per review and proof gaps closed before sponsor review",
          currentBaseline: "Manual release notes, scattered screenshots, and unclear owner handoffs",
          dataSensitivity: "public",
          evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
        }
  });
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
  const diligence = buildBuyerDiligenceRoom({ proposal, handoff: execution, buyerScenario, valueBlueprint, recommendation, baseUrl: "https://example.com" });
  const sponsorReview = buildSponsorReviewRoom({ valueBlueprint, buyerScenario, proposal, workflow, pilotReceipt, decisionMatrix, agreement, ledger, diligence, execution });
  const proofPacket = buildBuyerProofPacket({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    ledger,
    diligence,
    execution,
    sponsorReview
  });
  const sponsorDecisionReceipt = buildSponsorDecisionReceipt(sponsorReview, { decidedAt: "2026-06-20" });

  return {
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder,
    workflow,
    pilotReceipt,
    agreement,
    ledger,
    proofPacketReceipt: proofPacket.receipt,
    sponsorDecisionReceipt,
    now: new Date("2026-06-23T12:00:00.000Z")
  };
}

describe("adoption operating plan", () => {
  test("turns buyer proof into a real 30-day operating motion", () => {
    const plan = buildAdoptionOperatingPlan(buildPlanInput());

    expect(plan.readiness).toBe("ready-to-operate");
    expect(plan.planScore).toBeGreaterThanOrEqual(85);
    expect(plan.healthMetrics.map((metric) => metric.id)).toEqual(["value-realism", "work-order-operability", "first-run-proof", "sponsor-ledger", "operating-ownership"]);
    expect(plan.cadence.map((step) => step.id)).toEqual(["day-0-kickoff", "week-1-activation", "week-2-health-review", "day-30-expand-or-stop"]);
    expect(plan.approvalAnchors.map((anchor) => anchor.id)).toEqual(["proof-packet-receipt", "sponsor-decision", "day-30-review"]);
    expect(plan.approvalAnchors[0]?.evidence).toContain("fnv1a-64 digest");
    expect(plan.approvalAnchors[1]?.evidence).toContain("continue decision is signed");
    expect(plan.interventions[0]?.id).toBe("scale-with-proof");
    expect(plan.successLedger).toMatchObject({
      decision: "expand-next-workflow",
      headline: "Adoption proof supports the next workflow",
      reviewWindow: "Day 30 operating review"
    });
    expect(plan.successLedger.successScore).toBeGreaterThanOrEqual(90);
    expect(plan.successLedger.rows.map((row) => row.id)).toContain("approval-day-30-review");
    expect(plan.successLedger.markdown).toContain("Adoption Success Ledger");
    expect(plan.successLedger.markdown).toContain("Decision: expand-next-workflow");
    expect(plan.successLedger.csvText).toContain("rowId,label,status,value,owner,evidence,action");
    expect(plan.successLedger.href).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(plan.successLedger.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(plan.successLedger.receipt).toMatchObject({
      checksumAlgorithm: "fnv1a-64",
      verificationApiPath: "/api/adoption-success-ledger/receipt/verify",
      payload: {
        receiptVersion: "adoption-success-ledger.v1",
        planId: plan.id,
        ledgerId: plan.successLedger.id,
        decision: "expand-next-workflow",
        successScore: plan.successLedger.successScore,
        buyer: plan.buyer
      },
      verification: {
        status: "verified"
      }
    });
    expect(plan.successLedger.receipt.receiptId).toMatch(/^adoption-success-expand-next-workflow-[a-f0-9]{12}$/);
    expect(plan.successLedger.receipt.checksum).toMatch(/^[a-f0-9]{16}$/);
    expect(plan.successLedger.receipt.copyText).toContain("# Adoption success receipt");
    expect(plan.successLedger.receipt.copyText).toContain("Replay rule: Recompute fnv1a-64");
    expect(decodeURIComponent(plan.successLedger.receipt.payloadHref)).toContain('"receiptVersion": "adoption-success-ledger.v1"');
    expect(verifyAdoptionSuccessReceipt(plan.successLedger.receipt).status).toBe("verified");
    expect(
      verifyAdoptionSuccessReceipt({
        checksum: plan.successLedger.receipt.checksum,
        payload: {
          ...plan.successLedger.receipt.payload,
          decision: "hold-expansion"
        }
      }).status
    ).toBe("mismatch");
    expect(plan.operatingCalendar).toMatchObject({
      startDate: "2026-06-29",
      endDate: "2026-07-30",
      timezone: "UTC"
    });
    expect(plan.operatingCalendar.events.map((event) => [event.id, event.startDate, event.dayOffset])).toEqual([
      ["day-0-kickoff", "2026-06-29", 0],
      ["week-1-activation", "2026-07-06", 7],
      ["week-2-health-review", "2026-07-13", 14],
      ["day-30-expand-or-stop", "2026-07-29", 30]
    ]);
    expect(plan.operatingCalendar.copyText).toContain("# Adoption Operating Calendar");
    expect(plan.operatingCalendar.icsText).toContain("BEGIN:VCALENDAR");
    expect(plan.operatingCalendar.icsText).toContain("DTSTART;VALUE=DATE:20260629");
    expect(plan.operatingCalendar.icsText).toContain("SUMMARY:Day 30: Decide expand\\, revise\\, or stop");
    expect(plan.operatingCalendar.icsHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(plan.exportMarkdown).toContain("## 30-day cadence");
    expect(plan.exportMarkdown).toContain("## Approval anchors");
    expect(plan.exportMarkdown).toContain("## Success ledger");
    expect(plan.exportMarkdown).toContain(`Receipt: ${plan.successLedger.receipt.receiptId}`);
    expect(plan.exportMarkdown).toContain("API verification: POST /api/adoption-success-ledger/receipt/verify");
    expect(plan.exportMarkdown).toContain("## Operating calendar");
    expect(plan.exportMarkdown).toContain("Pilot start: 2026-06-29");
    expect(plan.exportMarkdown).toContain("## Expansion criteria");
  });

  test("blocks adoption when the product only has weak demo proof", () => {
    const plan = buildAdoptionOperatingPlan(buildPlanInput({ weak: true }));

    expect(plan.readiness).toBe("blocked");
    expect(plan.successLedger.decision).toBe("hold-expansion");
    expect(plan.approvalAnchors.find((anchor) => anchor.id === "sponsor-decision")?.status).toBe("blocked");
    expect(plan.interventions.some((intervention) => intervention.severity === "blocked")).toBe(true);
    expect(plan.riskAdjustedMonthlyValueYen).toBeLessThan(plan.expectedMonthlyValueYen);
  });

  test("renders escaped public HTML with operating links", () => {
    const plan = buildAdoptionOperatingPlan(buildPlanInput());
    const html = renderAdoptionOperatingPlanHtml(
      {
        ...plan,
        headline: "Adoption <script>alert(1)</script>"
      },
      {
        launchRoomUrl: "https://example.com/launch-room",
        workOrderUrl: "https://example.com/work-order-brief",
        proofPacketUrl: "https://example.com/buyer-proof-packet",
        sponsorReviewUrl: "https://example.com/sponsor-review",
        jsonUrl: "https://example.com/api/adoption-plan",
        markdownUrl: "https://example.com/adoption-plan.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Adoption Operating Plan");
    expect(html).toContain("Approval anchors");
    expect(html).toContain("Success ledger");
    expect(html).toContain('aria-label="Adoption success receipt"');
    expect(html).toContain("Adoption success receipt");
    expect(html).toContain("Download markdown receipt");
    expect(html).toContain("Download replay payload");
    expect(html).toContain("Verify receipt");
    expect(html).toContain('id="adoption-success-verify-request"');
    expect(html).toContain("POST /api/adoption-success-ledger/receipt/verify");
    expect(html).toContain(`"checksum": "${plan.successLedger.receipt.checksum}"`);
    expect(html).toContain("Adoption proof supports the next workflow");
    expect(html).toContain('aria-label="Adoption operating calendar"');
    expect(html).toContain("Operating calendar");
    expect(html).toContain("2026-06-29 to 2026-07-30");
    expect(html).toContain("Download ICS");
    expect(html).toContain("adoption-operating-calendar.ics");
    expect(html).toContain("Proof packet receipt");
    expect(html).toContain("https://example.com/buyer-proof-packet");
    expect(html).toContain("https://example.com/sponsor-review");
    expect(html).toContain("https://example.com/api/adoption-plan");
    expect(html).toContain("https://example.com/adoption-plan.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Adoption &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
