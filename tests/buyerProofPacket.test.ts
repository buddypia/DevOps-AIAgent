import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerDecisionMatrix } from "../src/buyerDecisionMatrix";
import { buildBuyerDiligenceRoom } from "../src/buyerDiligence";
import {
  BUYER_PROOF_PACKET_RECEIPT_VERIFY_PATH,
  buildBuyerProofPacket,
  buyerProofPacketReceiptDigest,
  renderBuyerProofPacketHtml,
  verifyBuyerProofPacketReceipt
} from "../src/buyerProofPacket";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotAgreement } from "../src/pilotAgreement";
import { buildPilotEvidenceLedger } from "../src/pilotEvidenceLedger";
import { buildPilotExecutionHandoff } from "../src/pilotExecution";
import { buildPilotProposal } from "../src/pilotProposal";
import { buildPilotRunReceipt } from "../src/pilotRunReceipt";
import { buildPilotWorkflowPlan } from "../src/pilotWorkflow";
import { buildSponsorReviewRoom } from "../src/sponsorReviewRoom";
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

function buildPacketInput(overrides: { weak?: boolean } = {}) {
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
  const sponsorReview = buildSponsorReviewRoom({ valueBlueprint, buyerScenario, proposal, workflow, pilotReceipt, decisionMatrix, agreement, ledger, diligence, execution });
  return { recommendation, valueBlueprint, buyerScenario, proposal, workflow, pilotReceipt, decisionMatrix, agreement, ledger, diligence, execution, sponsorReview };
}

describe("buyer proof packet", () => {
  test("bundles the buyer evidence chain into a share-ready packet", () => {
    const packet = buildBuyerProofPacket(buildPacketInput());

    expect(packet.readiness).toBe("share-ready");
    expect(packet.packetScore).toBeGreaterThanOrEqual(85);
    expect(packet.rows.map((row) => row.id)).toEqual(["buyer-outcome", "inspectable-product", "first-workflow", "measured-run", "procurement-choice", "agreement-boundary", "sponsor-decision"]);
    expect(packet.gaps).toEqual([]);
    expect(packet.decisionAsk).toContain("Share this packet");
    expect(packet.receipt.algorithm).toBe("fnv1a-64");
    expect(packet.receipt.digest).toMatch(/^[a-f0-9]{16}$/);
    expect(JSON.parse(packet.receipt.verificationRequestJson)).toEqual({
      digest: packet.receipt.digest,
      payload: packet.receipt.payload
    });
    expect(packet.receipt.verificationRequestHref).toContain(encodeURIComponent(packet.receipt.verificationRequestJson));
    expect(packet.receipt.coveredArtifacts).toEqual([
      "value-report",
      "proposal",
      "workflow",
      "receipt",
      "decision",
      "agreement",
      "review",
      "ledger",
      "diligence",
      "execution"
    ]);
    expect(packet.receipt.checks.every((check) => check.status === "sealed")).toBe(true);
    expect(packet.exportMarkdown).toContain("## Reality checks");
    expect(packet.exportMarkdown).toContain("## Evidence rows");
    expect(packet.exportMarkdown).toContain("## Manifest receipt");
    expect(packet.exportMarkdown).toContain(packet.receipt.digest);
    expect(packet.exportMarkdown).toContain(`API verification: POST ${BUYER_PROOF_PACKET_RECEIPT_VERIFY_PATH}`);
    expect(packet.exportMarkdown).toContain("## Receipt replay payload");
    expect(packet.exportMarkdown).toContain("## Receipt API verification");
  });

  test("keeps weak demo evidence internal", () => {
    const packet = buildBuyerProofPacket(buildPacketInput({ weak: true }));

    expect(packet.readiness).toBe("blocked");
    expect(packet.gaps.some((gap) => gap.severity === "blocked")).toBe(true);
    expect(packet.receipt.checks.find((check) => check.id === "gap-declaration")?.status).toBe("blocked");
    expect(packet.decisionAsk).toContain("Keep this packet internal");
  });

  test("creates a deterministic receipt that changes when a claim changes", () => {
    const packet = buildBuyerProofPacket(buildPacketInput());
    const rebuilt = buildBuyerProofPacket(buildPacketInput());
    const mutatedPayload = {
      ...packet.receipt.payload,
      rows: packet.receipt.payload.rows.map((row) => (row.id === "buyer-outcome" ? { ...row, claim: `${row.claim} Edited.` } : row))
    };

    expect(rebuilt.receipt.digest).toBe(packet.receipt.digest);
    expect(buyerProofPacketReceiptDigest(packet.receipt.payload)).toBe(packet.receipt.digest);
    expect(verifyBuyerProofPacketReceipt(packet.receipt).status).toBe("verified");
    expect(verifyBuyerProofPacketReceipt(JSON.parse(packet.receipt.verificationRequestJson)).status).toBe("verified");
    expect(buyerProofPacketReceiptDigest(mutatedPayload)).not.toBe(packet.receipt.digest);
    expect(verifyBuyerProofPacketReceipt({ digest: packet.receipt.digest, payload: mutatedPayload }).status).toBe("mismatch");
  });

  test("renders escaped public HTML with packet links", () => {
    const packet = buildBuyerProofPacket(buildPacketInput());
    const html = renderBuyerProofPacketHtml(
      {
        ...packet,
        headline: "Packet <script>alert(1)</script>"
      },
      {
        review: "https://example.com/sponsor-review",
        "value-report": "https://example.com/buyer-value",
        ledger: "https://example.com/pilot-evidence-ledger",
        json: "https://example.com/api/buyer-proof-packet",
        markdown: "https://example.com/buyer-proof-packet.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer Proof Packet");
    expect(html).toContain("Manifest receipt");
    expect(html).toContain(packet.receipt.digest);
    expect(html).toContain(`POST ${BUYER_PROOF_PACKET_RECEIPT_VERIFY_PATH}`);
    expect(html).toContain('data-verify-receipt data-verify-api="/api/buyer-proof-packet/receipt/verify"');
    expect(html).toContain("Receipt not checked in this browser yet.");
    expect(html).toContain('id="buyer-proof-receipt-verify-request"');
    expect(html).toContain("Download receipt payload");
    expect(html).toContain("Download verify request");
    expect(html).toContain("https://example.com/api/buyer-proof-packet");
    expect(html).toContain("https://example.com/buyer-proof-packet.md");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Packet &lt;script&gt;alert(1)&lt;/script&gt;");
  });

  test("escapes the embedded receipt verification request for public HTML scripts", () => {
    const packet = buildBuyerProofPacket(buildPacketInput());
    const verificationRequestJson = JSON.stringify({
      digest: packet.receipt.digest,
      payload: {
        ...packet.receipt.payload,
        headline: '</script><script>alert("receipt")</script>'
      }
    });
    const html = renderBuyerProofPacketHtml({
      ...packet,
      receipt: {
        ...packet.receipt,
        verificationRequestJson
      }
    });

    expect(html).not.toContain('</script><script>alert("receipt")</script>');
    expect(html).toContain('\\u003c/script\\u003e\\u003cscript\\u003ealert(\\"receipt\\")\\u003c/script\\u003e');
  });
});
