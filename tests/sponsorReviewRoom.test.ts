import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerDecisionMatrix } from "../src/buyerDecisionMatrix";
import { buildBuyerDiligenceRoom } from "../src/buyerDiligence";
import { buildBuyerProofPacket } from "../src/buyerProofPacket";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotAgreement } from "../src/pilotAgreement";
import { buildPilotEvidenceLedger } from "../src/pilotEvidenceLedger";
import { buildPilotExecutionHandoff } from "../src/pilotExecution";
import { buildPilotProposal } from "../src/pilotProposal";
import { buildPilotRunReceipt } from "../src/pilotRunReceipt";
import { buildPilotWorkflowPlan } from "../src/pilotWorkflow";
import { buildSponsorDecisionReceipt, buildSponsorReviewRoom, recommendedSponsorDecision, renderSponsorReviewRoomHtml } from "../src/sponsorReviewRoom";
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

function buildRoomInput(overrides: { weak?: boolean } = {}) {
  const projectBrief = overrides.weak
    ? "Short AI demo"
    : `${DEFAULT_PROJECT_BRIEF}\nGlobal platform teams need a buyer-ready pilot path with Cloud Run proof, security approval, and measurable operational value.`;
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
  return { recommendation, valueBlueprint, buyerScenario, proposal, workflow, pilotReceipt, decisionMatrix, agreement, ledger, diligence, execution };
}

describe("sponsor review room", () => {
  test("answers sponsor questions from the complete buyer evidence chain", () => {
    const room = buildSponsorReviewRoom(buildRoomInput());

    expect(room.readiness).toBe("approve-review");
    expect(room.reviewScore).toBeGreaterThanOrEqual(85);
    expect(room.questions.map((question) => question.id)).toEqual(["business-value", "proof", "why-a2a", "operating-plan", "risk-boundary", "approval-ask"]);
    expect(room.questions.every((question) => question.status === "clear")).toBe(true);
    expect(room.approvalMeetingMode).toBe("ready-to-run");
    expect(room.pressureTestScore).toBeGreaterThanOrEqual(85);
    expect(room.objectionBriefs.map((brief) => brief.id)).toEqual(["finance-roi", "security-boundary", "procurement-choice", "delivery-accountability", "executive-stop"]);
    expect(room.objectionBriefs.every((brief) => brief.status === "clear")).toBe(true);
    expect(room.approvalAgenda).toHaveLength(5);
    expect(room.decisionAsk).toContain("Approve");
    expect(room.exportMarkdown).toContain("## Sponsor questions");
    expect(room.exportMarkdown).toContain("## Approval objection brief");
    expect(room.exportMarkdown).toContain("## Approval meeting agenda");
  });

  test("turns a complete sponsor room into a signed decision receipt", () => {
    const room = buildSponsorReviewRoom(buildRoomInput());
    const receipt = buildSponsorDecisionReceipt(room, {
      decision: recommendedSponsorDecision(room),
      signerName: "Platform sponsor",
      decidedAt: "2026-06-20",
      sponsorNote: "Approved for the first bounded pilot."
    });

    expect(receipt.decision).toBe("continue");
    expect(receipt.status).toBe("signed");
    expect(receipt.conditions.every((condition) => condition.status === "clear")).toBe(true);
    expect(receipt.nextStep).toContain("Start the bounded pilot");
    expect(receipt.exportMarkdown).toContain("Sponsor Decision Receipt");
    expect(receipt.exportMarkdown).toContain("Approved for the first bounded pilot.");
  });

  test("blocks sponsor review when the proof chain is still a demo", () => {
    const room = buildSponsorReviewRoom(buildRoomInput({ weak: true }));

    expect(room.readiness).toBe("blocked");
    expect(room.questions.some((question) => question.status === "blocked")).toBe(true);
    expect(room.approvalMeetingMode).toBe("do-not-schedule");
    expect(room.objectionBriefs.find((brief) => brief.id === "finance-roi")).toMatchObject({ status: "blocked" });
    expect(room.objectionBriefs.find((brief) => brief.id === "delivery-accountability")).toMatchObject({ status: "blocked" });
    expect(room.decisionAsk).toContain("Do not approve yet");
  });

  test("does not let a weak proof chain become a signed continue receipt", () => {
    const room = buildSponsorReviewRoom(buildRoomInput({ weak: true }));
    const receipt = buildSponsorDecisionReceipt(room, {
      decision: "continue",
      signerName: "Buyer sponsor",
      decidedAt: "2026-06-20",
      conditionNote: "Attach public evidence and rerun the review."
    });

    expect(receipt.status).toBe("needs-evidence");
    expect(receipt.conditions.some((condition) => condition.status === "blocked")).toBe(true);
    expect(receipt.nextStep).toContain("Do not start");
    expect(receipt.exportMarkdown).toContain("Attach public evidence and rerun the review.");
  });

  test("renders escaped public HTML with artifact links", () => {
    const input = buildRoomInput();
    const room = buildSponsorReviewRoom(input);
    const packet = buildBuyerProofPacket({ ...input, sponsorReview: room });
    const html = renderSponsorReviewRoomHtml(
      {
        ...room,
        headline: "Review <script>alert(1)</script>"
      },
      {
        "value-report": "https://example.com/buyer-value",
        ledger: "https://example.com/pilot-evidence-ledger",
        decision: "https://example.com/buyer-decision",
        agreement: "https://example.com/pilot-agreement",
        "proof-packet": "https://example.com/buyer-proof-packet",
        json: "https://example.com/api/sponsor-review",
        markdown: "https://example.com/sponsor-review.md"
      },
      packet.receipt
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Sponsor Review Room");
    expect(html).toContain("Decision receipt");
    expect(html).toContain("Proof packet receipt");
    expect(html).toContain(packet.receipt.digest);
    expect(html).toContain("https://example.com/buyer-proof-packet");
    expect(html).toContain("Approval objection brief");
    expect(html).toContain("Finance");
    expect(html).toContain("https://example.com/api/sponsor-review");
    expect(html).toContain("https://example.com/sponsor-review.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Review &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
