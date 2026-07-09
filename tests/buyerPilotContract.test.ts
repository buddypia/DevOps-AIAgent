import { describe, expect, test } from "vitest";
import { buildAdoptionOperatingPlan } from "../src/adoptionOperatingPlan";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerDecisionMatrix } from "../src/buyerDecisionMatrix";
import {
  buildBuyerPilotContract,
  BUYER_PILOT_CONTRACT_RECEIPT_OMITTED_QUERY_VALUE,
  BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH,
  renderBuyerPilotContractHtml,
  verifyBuyerPilotContractReceipt
} from "../src/buyerPilotContract";
import { buildBuyerTrustCenter } from "../src/buyerTrustCenter";
import { buildBuyerValueReport } from "../src/buyerValueReport";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerWorkOrderBrief } from "../src/buyerWorkOrder";
import { buildCommercialOffer } from "../src/commercialOffer";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotAgreement } from "../src/pilotAgreement";
import { buildPilotEvidenceLedger } from "../src/pilotEvidenceLedger";
import { buildPilotExecutionHandoff } from "../src/pilotExecution";
import { buildPilotProposal } from "../src/pilotProposal";
import { buildPilotRunReceipt, type PilotRunReceiptInput } from "../src/pilotRunReceipt";
import { buildPilotWorkflowPlan } from "../src/pilotWorkflow";
import { buildValueBlueprint } from "../src/valueBlueprint";
import { verifyBuyerPilotContractReceiptRequest } from "../server/buyerPilotContractReceiptVerifier";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";

const strongPilotRun: PilotRunReceiptInput = {
  observedManualMinutes: 1680,
  observedAssistedMinutes: 560,
  participants: 4,
  acceptedTasks: 3,
  totalTasks: 3,
  evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-run/receipt.json",
  reviewerName: "Platform sponsor",
  notes: "Observed run completed with evidence attached."
};

const publicWorkspace = {
  targetUrl: "https://a2a-marketplace.run.app",
  protopediaUrl: "https://protopedia.net/prototype/a2a-marketplace",
  videoUrl: "https://youtu.be/walkthrough",
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

function buildContractInput(overrides: { weak?: boolean } = {}) {
  const projectBrief = overrides.weak
    ? "Short AI demo"
    : `${DEFAULT_PROJECT_BRIEF}\nGlobal platform teams need a buyer-ready pilot path with Cloud Run proof, security approval, measurable operational value, and a defensible pilot contract.`;
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
  const pilotRun = overrides.weak
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
    : strongPilotRun;
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
  const valueReport = buildBuyerValueReport({ recommendation, valueBlueprint, buyerScenario, pilotRun });
  const proposal = buildPilotProposal({ recommendation, valueBlueprint, buyerScenario, workspace });
  const workflow = buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario });
  const pilotReceipt = buildPilotRunReceipt({ recommendation, valueBlueprint, buyerScenario, workflow, pilotRun });
  const decisionMatrix = buildBuyerDecisionMatrix({ recommendation, valueBlueprint, buyerScenario, pilotReceipt });
  const agreement = buildPilotAgreement({ recommendation, valueBlueprint, buyerScenario, proposal, workflow, decisionMatrix, pilotReceipt });
  const execution = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl: "https://example.com" });
  const ledger = buildPilotEvidenceLedger({ recommendation, valueBlueprint, buyerScenario, proposal, workflow, pilotReceipt, decisionMatrix, agreement, execution });
  const adoptionPlan = buildAdoptionOperatingPlan({ recommendation, valueBlueprint, buyerScenario, workOrder, workflow, pilotReceipt, agreement, ledger });
  const trustCenter = buildBuyerTrustCenter({ recommendation, valueBlueprint, workOrder, workOrderInput, pilotReceipt, agreement, ledger, adoptionPlan, workspace });
  const commercialOffer = buildCommercialOffer({ recommendation, valueBlueprint, buyerScenario, pilotReceipt, decisionMatrix, agreement, adoptionPlan, trustCenter });

  return { valueReport, pilotReceipt, agreement, adoptionPlan, trustCenter, commercialOffer };
}

describe("buyer pilot contract", () => {
  test("builds a receipt-backed contract from strong buyer proof", () => {
    const input = buildContractInput();
    const contract = buildBuyerPilotContract({
      ...input,
      links: {
        valueReportUrl: "https://example.com/buyer-value",
        commercialOfferUrl: "https://example.com/commercial-offer",
        agreementUrl: "https://example.com/pilot-agreement",
        adoptionPlanUrl: "https://example.com/adoption-plan",
        trustCenterUrl: "https://example.com/trust-center",
        launchRoomUrl: "https://example.com/launch-room"
      }
    });

    expect(contract.readiness).toBe("contract-ready");
    expect(contract.approvalMemo.decision).toBe("approve-contained-pilot");
    expect(contract.contractScore).toBeGreaterThanOrEqual(85);
    expect(contract.milestones.map((milestone) => milestone.id)).toEqual([
      "value-proof",
      "commercial-boundary",
      "agreement-signature",
      "measured-acceptance",
      "trust-boundary",
      "operating-owner"
    ]);
    expect(contract.milestones.every((milestone) => milestone.status === "clear")).toBe(true);
    expect(contract.closeDecisions.map((decision) => decision.id)).toEqual(["scope", "price", "proof", "trust", "renewal"]);
    expect(contract.attachments.map((attachment) => attachment.id)).toEqual([
      "value-report",
      "commercial-offer",
      "pilot-agreement",
      "adoption-plan",
      "trust-center",
      "launch-room"
    ]);
    expect(contract.receipt.receiptId).toMatch(/^buyer-pilot-contract-contract-ready-[a-f0-9]{12}$/);
    expect(contract.receipt.verificationApiPath).toBe(BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH);
    expect(contract.receipt.payload).toMatchObject({
      receiptVersion: "buyer-pilot-contract.v1",
      readiness: "contract-ready",
      approvalDecision: "approve-contained-pilot",
      commercialOfferReceiptChecksum: input.commercialOffer.receipt.checksum
    });
    expect(verifyBuyerPilotContractReceipt(contract.receipt).status).toBe("verified");
    expect(contract.exportMarkdown).toContain("## Contract milestones");
    expect(contract.exportMarkdown).toContain("## Buyer close decisions");
    expect(contract.exportMarkdown).toContain("Receipt checksum: fnv1a-64:");
  });

  test("keeps long workspace query blobs out of the receipt payload links", () => {
    const longQuery = `?workspace=${"a".repeat(1800)}`;
    const contract = buildBuyerPilotContract({
      ...buildContractInput(),
      links: {
        valueReportUrl: `https://example.com/buyer-value${longQuery}`,
        commercialOfferUrl: `https://example.com/commercial-offer${longQuery}`,
        agreementUrl: `https://example.com/pilot-agreement${longQuery}`,
        adoptionPlanUrl: `https://example.com/adoption-plan${longQuery}`,
        trustCenterUrl: `https://example.com/trust-center${longQuery}`,
        launchRoomUrl: `https://example.com/launch-room${longQuery}`
      }
    });

    expect(contract.attachments.find((attachment) => attachment.id === "commercial-offer")?.href).toContain(longQuery);
    expect(contract.receipt.payload.attachments.find((attachment) => attachment.id === "commercial-offer")?.href).toBe(
      `https://example.com/commercial-offer?context=${encodeURIComponent(BUYER_PILOT_CONTRACT_RECEIPT_OMITTED_QUERY_VALUE)}`
    );
    expect(contract.receipt.verification.status).toBe("verified");
  });

  test("blocks the contract when value, proof, trust, and commercial evidence are weak", () => {
    const contract = buildBuyerPilotContract(buildContractInput({ weak: true }));

    expect(contract.readiness).toBe("blocked");
    expect(contract.approvalMemo.decision).toBe("hold-internal");
    expect(contract.firstCommitmentYen).toBe(0);
    expect(contract.milestones.some((milestone) => milestone.status === "blocked")).toBe(true);
    expect(contract.closeDecisions.find((decision) => decision.id === "price")?.buyerDecision).toBe("Hold pricing until proof, trust, and operating blockers close.");
    expect(contract.receipt.payload.approvalDecision).toBe("hold-internal");
    expect(contract.exportMarkdown).toContain("Do not send this pilot contract");
  });

  test("rejects tampered buyer pilot contract receipt replay payloads", () => {
    const contract = buildBuyerPilotContract(buildContractInput());
    const replayRequest = JSON.parse(contract.receipt.verificationRequestJson) as {
      checksum: string;
      payload: typeof contract.receipt.payload;
    };

    expect(verifyBuyerPilotContractReceiptRequest(replayRequest)).toMatchObject({
      statusCode: 200,
      body: {
        skill: "buyer-pilot-contract.receipt.verify",
        verification: { status: "verified" },
        receipt: {
          readiness: "contract-ready",
          approvalDecision: "approve-contained-pilot",
          firstCommitmentYen: contract.firstCommitmentYen
        }
      }
    });

    expect(
      verifyBuyerPilotContractReceiptRequest({
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

    expect(verifyBuyerPilotContractReceiptRequest({ checksum: "not-a-checksum", payload: replayRequest.payload })).toMatchObject({
      statusCode: 400,
      body: { error: "invalid_request" }
    });
  });

  test("dispatches through the generic receipt verifier", () => {
    const contract = buildBuyerPilotContract(buildContractInput());
    const replayRequest = JSON.parse(contract.receipt.verificationRequestJson);

    expect(verifyReceiptVerificationDeskRequest(replayRequest)).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        receiptType: "buyer-pilot-contract.v1",
        receiptLabel: "Buyer pilot contract",
        sourceVerifierApiPath: BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH
      }
    });
  });

  test("renders escaped public contract HTML with receipt verification controls", () => {
    const contract = buildBuyerPilotContract(buildContractInput());
    const html = renderBuyerPilotContractHtml(
      {
        ...contract,
        headline: "Pilot <script>alert(1)</script>"
      },
      {
        valueReportUrl: "https://example.com/buyer-value",
        commercialOfferUrl: "https://example.com/commercial-offer",
        agreementUrl: "https://example.com/pilot-agreement",
        adoptionPlanUrl: "https://example.com/adoption-plan",
        trustCenterUrl: "https://example.com/trust-center",
        launchRoomUrl: "https://example.com/launch-room",
        jsonUrl: "https://example.com/api/buyer-pilot-contract",
        markdownUrl: "https://example.com/buyer-pilot-contract.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer Pilot Contract");
    expect(html).toContain("Replayable contract receipt");
    expect(html).toContain(contract.receipt.receiptId);
    expect(html).toContain(BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH);
    expect(html).toContain('id="buyer-pilot-contract-receipt-verify-request"');
    expect(html).toContain("Verify receipt");
    expect(html).toContain("https://example.com/api/buyer-pilot-contract");
    expect(html).toContain("https://example.com/buyer-pilot-contract.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Pilot &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
