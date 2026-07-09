import { describe, expect, test } from "vitest";
import { buildAdoptionOperatingPlan } from "../src/adoptionOperatingPlan";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerDecisionMatrix } from "../src/buyerDecisionMatrix";
import { buildBuyerTrustCenter } from "../src/buyerTrustCenter";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerWorkOrderBrief } from "../src/buyerWorkOrder";
import { COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH, buildCommercialOffer, renderCommercialOfferHtml, verifyCommercialOfferReceipt } from "../src/commercialOffer";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotAgreement } from "../src/pilotAgreement";
import { buildPilotEvidenceLedger } from "../src/pilotEvidenceLedger";
import { buildPilotExecutionHandoff } from "../src/pilotExecution";
import { buildPilotProposal } from "../src/pilotProposal";
import { buildPilotRunReceipt } from "../src/pilotRunReceipt";
import { buildPilotWorkflowPlan } from "../src/pilotWorkflow";
import { buildValueBlueprint } from "../src/valueBlueprint";
import { verifyCommercialOfferReceiptRequest } from "../server/commercialOfferReceiptVerifier";

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

function buildOfferInput(overrides: { weak?: boolean } = {}) {
  const projectBrief = overrides.weak
    ? "Short AI demo"
    : `${DEFAULT_PROJECT_BRIEF}\nGlobal platform teams need a buyer-ready pilot path with Cloud Run proof, security approval, measurable operational value, and a defensible commercial offer.`;
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
  const trustCenter = buildBuyerTrustCenter({ recommendation, valueBlueprint, workOrder, workOrderInput, pilotReceipt, agreement, ledger, adoptionPlan, workspace });

  return { recommendation, valueBlueprint, buyerScenario, pilotReceipt, decisionMatrix, agreement, adoptionPlan, trustCenter };
}

describe("commercial offer", () => {
  test("builds a proof-backed offer from strong buyer evidence", () => {
    const offer = buildCommercialOffer(buildOfferInput());

    expect(offer.readiness).toBe("offer-ready");
    expect(offer.offerScore).toBeGreaterThanOrEqual(85);
    expect(offer.tiers.map((tier) => tier.id)).toEqual(["proof-pilot", "team-rollout", "operating-pack"]);
    expect(offer.recommendedTierId).toBe("proof-pilot");
    expect(offer.totalFirstCommitmentYen).toBeGreaterThan(0);
    expect(offer.breakEvenMonthlyValueYen).toBe(456000);
    expect(offer.breakEvenAdoptionRatePercent).toBe(46);
    expect(offer.valueStressCases.map((stressCase) => stressCase.id)).toEqual(["contract-case", "downside-half-adoption", "break-even-floor"]);
    expect(offer.valueStressCases.find((stressCase) => stressCase.id === "contract-case")).toMatchObject({
      status: "clear",
      monthlyValueYen: 892000,
      paybackDays: 16,
      buyerDecision: "Send the commercial ask with measured proof attached."
    });
    expect(offer.valueStressCases.find((stressCase) => stressCase.id === "downside-half-adoption")).toMatchObject({
      status: "watch",
      monthlyValueYen: 446000,
      paybackDays: 31
    });
    expect(offer.valueStressCases.find((stressCase) => stressCase.id === "break-even-floor")).toMatchObject({
      status: "clear",
      monthlyValueYen: 456000,
      buyerDecision: "The extracted adoption case clears the payback floor."
    });
    expect(offer.approvalMemo.decision).toBe("approve");
    expect(offer.approvalMemo.conditions.map((condition) => condition.status)).toEqual(["clear", "clear", "clear", "clear", "clear", "clear"]);
    expect(offer.approvalMemo.sendLine).toContain("Approve Proof pilot");
    expect(offer.receipt.receiptId).toMatch(/^commercial-offer-offer-ready-[a-f0-9]{12}$/);
    expect(offer.receipt.verificationApiPath).toBe(COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH);
    expect(offer.receipt.verification.status).toBe("verified");
    expect(verifyCommercialOfferReceipt(offer.receipt).status).toBe("verified");
    expect(offer.receipt.payload).toMatchObject({
      receiptVersion: "commercial-offer.v1",
      readiness: "offer-ready",
      buyer: offer.buyer,
      recommendedTierId: "proof-pilot",
      firstCommitmentYen: offer.totalFirstCommitmentYen,
      approvalDecision: "approve"
    });
    expect(offer.exportMarkdown).toContain("## Value stress test");
    expect(offer.exportMarkdown).toContain(`Receipt checksum: fnv1a-64:${offer.receipt.checksum}`);
    expect(offer.exportMarkdown).toContain("[watch] Downside half adoption");
    expect(offer.exportMarkdown).toContain("Break-even adoption: 46%");
    expect(offer.exportMarkdown).toContain("## Commercial guardrails");
    expect(offer.exportMarkdown).toContain("## Procurement approval memo");
    expect(offer.exportMarkdown).toContain("## Buyer objections");
  });

  test("blocks commercial approval when proof and trust are weak", () => {
    const offer = buildCommercialOffer(buildOfferInput({ weak: true }));

    expect(offer.readiness).toBe("blocked");
    expect(offer.guardrails.some((guardrail) => guardrail.status === "blocked")).toBe(true);
    expect(offer.valueStressCases.every((stressCase) => stressCase.status === "blocked")).toBe(true);
    expect(offer.valueStressCases.find((stressCase) => stressCase.id === "contract-case")?.buyerDecision).toContain("Do not send pricing");
    expect(offer.breakEvenAdoptionRatePercent).toBe(999);
    expect(offer.approvalMemo.decision).toBe("hold");
    expect(offer.approvalMemo.redlineQueue.some((condition) => condition.status === "blocked")).toBe(true);
    expect(offer.recommendedTierId).toBe("proof-pilot");
    expect(offer.receipt.receiptId).toMatch(/^commercial-offer-blocked-[a-f0-9]{12}$/);
    expect(offer.receipt.payload.approvalDecision).toBe("hold");
  });

  test("rejects tampered commercial offer receipt replay payloads", () => {
    const offer = buildCommercialOffer(buildOfferInput());
    const replayRequest = JSON.parse(offer.receipt.verificationRequestJson) as {
      checksum: string;
      payload: typeof offer.receipt.payload;
    };

    expect(verifyCommercialOfferReceiptRequest(replayRequest)).toMatchObject({
      statusCode: 200,
      body: {
        skill: "commercial-offer.receipt.verify",
        verification: { status: "verified" },
        receipt: {
          readiness: "offer-ready",
          approvalDecision: "approve",
          firstCommitmentYen: offer.totalFirstCommitmentYen
        }
      }
    });

    expect(
      verifyCommercialOfferReceiptRequest({
        checksum: replayRequest.checksum,
        payload: {
          ...replayRequest.payload,
          firstCommitmentYen: replayRequest.payload.firstCommitmentYen + 1000
        }
      })
    ).toMatchObject({
      statusCode: 422,
      body: {
        verification: { status: "mismatch" }
      }
    });

    expect(verifyCommercialOfferReceiptRequest({ checksum: "not-a-checksum", payload: replayRequest.payload })).toMatchObject({
      statusCode: 400,
      body: { error: "invalid_request" }
    });
  });

  test("renders escaped public offer with commercial links", () => {
    const offer = buildCommercialOffer(buildOfferInput());
    const html = renderCommercialOfferHtml(
      {
        ...offer,
        headline: "Offer <script>alert(1)</script>"
      },
      {
        decisionUrl: "https://example.com/buyer-decision",
        agreementUrl: "https://example.com/pilot-agreement",
        jsonUrl: "https://example.com/api/commercial-offer",
        markdownUrl: "https://example.com/commercial-offer.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Commercial Offer");
    expect(html).toContain("Procurement approval memo");
    expect(html).toContain("Replayable commercial receipt");
    expect(html).toContain(offer.receipt.receiptId);
    expect(html).toContain(`fnv1a-64:${offer.receipt.checksum}`);
    expect(html).toContain("Download receipt JSON");
    expect(html).toContain(COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH);
    expect(html).toContain('id="commercial-offer-receipt-verify-request"');
    expect(html).toContain("Verify receipt");
    expect(html).toContain("Value stress test");
    expect(html).toContain("Break-even floor: 456,000 yen/month or 46% adoption.");
    expect(html).toContain("approval score");
    expect(html).toContain("https://example.com/api/commercial-offer");
    expect(html).toContain("https://example.com/commercial-offer.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Offer &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
