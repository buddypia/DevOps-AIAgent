import { describe, expect, test } from "vitest";
import { buildAdoptionOperatingPlan } from "../src/adoptionOperatingPlan";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerDecisionAgendaSnapshot } from "../src/buyerDecisionAgenda";
import { buildBuyerDecisionFollowUpLedger } from "../src/buyerDecisionFollowUp";
import { buildBuyerDecisionMatrix } from "../src/buyerDecisionMatrix";
import { buildBuyerDiligenceRoom } from "../src/buyerDiligence";
import { BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH, buildBuyerEvidenceBoard } from "../src/buyerEvidenceBoard";
import { BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH, buildBuyerPilotContract } from "../src/buyerPilotContract";
import { buildBuyerProofPacket } from "../src/buyerProofPacket";
import { buildBuyerTrustCenter } from "../src/buyerTrustCenter";
import {
  BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH,
  buildBuyerTrustManifest,
  buyerTrustManifestReceiptDigest,
  renderBuyerTrustManifestHtml,
  verifyBuyerTrustManifestReceipt
} from "../src/buyerTrustManifest";
import { buildBuyerValueReport } from "../src/buyerValueReport";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerWorkOrderBrief } from "../src/buyerWorkOrder";
import { COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH, buildCommercialOffer } from "../src/commercialOffer";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildPilotAgreement } from "../src/pilotAgreement";
import { buildPilotEvidenceLedger } from "../src/pilotEvidenceLedger";
import { buildPilotExecutionHandoff } from "../src/pilotExecution";
import { buildPilotProposal } from "../src/pilotProposal";
import { buildPilotRunReceipt } from "../src/pilotRunReceipt";
import { buildPilotWorkflowPlan } from "../src/pilotWorkflow";
import { buildSponsorDecisionReceipt, buildSponsorReviewRoom } from "../src/sponsorReviewRoom";
import { buildValueBlueprint } from "../src/valueBlueprint";

const workspace = {
  targetUrl: "https://a2a-marketplace.run.app",
  protopediaUrl: "https://protopedia.net/prototype/a2a-marketplace",
  videoUrl: "https://youtu.be/demo",
  agentTrialEvidence: [
    {
      id: "trial-proof-cloud-run-sre",
      receiptId: "trial-cloud-run-sre",
      agentId: "cloud-run-sre",
      agentName: "Cloud Run SRE",
      skillId: "cloud-run.release-proof",
      status: "accepted" as const,
      score: 96,
      artifactUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/cloud-run/receipt.json",
      evidenceSource: "Cloud Run public logs and signed A2A receipt",
      headline: "Cloud Run proof accepted",
      summary: "Cloud Run SRE returned an accepted A2A proof receipt.",
      attachedAt: "2026-06-20T00:00:00.000Z"
    }
  ]
};

function manifestInput() {
  const projectBrief = `${DEFAULT_PROJECT_BRIEF}\nGlobal platform teams need a buyer-ready proof chain with public evidence, sponsor approval, operating gates, and a procurement-safe commercial offer.`;
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
  const workOrderInput = {
    request: "Convert one release-readiness review into a buyer proof packet with owners, acceptance checks, and a continue or revise decision.",
    targetUser: "Platform lead",
    successMetric: "Minutes saved per review and proof gaps closed before sponsor review",
    currentBaseline: "Manual release notes, scattered screenshots, and unclear owner handoffs",
    dataSensitivity: "public" as const,
    evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
  };
  const pilotRunInput = {
    observedManualMinutes: 1680,
    observedAssistedMinutes: 560,
    participants: 4,
    acceptedTasks: 3,
    totalTasks: 3,
    evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-run/receipt.json",
    reviewerName: "Platform sponsor",
    notes: "Observed run completed with evidence attached."
  };
  const workOrder = buildBuyerWorkOrderBrief({ recommendation, valueBlueprint, buyerScenario, workOrder: workOrderInput });
  const valueReport = buildBuyerValueReport({ recommendation, valueBlueprint, buyerScenario, pilotRun: pilotRunInput });
  const proposal = buildPilotProposal({ recommendation, valueBlueprint, buyerScenario, workspace });
  const workflow = buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun: pilotRunInput
  });
  const decisionMatrix = buildBuyerDecisionMatrix({ recommendation, valueBlueprint, buyerScenario, pilotReceipt });
  const agreement = buildPilotAgreement({ recommendation, valueBlueprint, buyerScenario, proposal, workflow, decisionMatrix, pilotReceipt });
  const execution = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl: "https://example.com" });
  const ledger = buildPilotEvidenceLedger({ recommendation, valueBlueprint, buyerScenario, proposal, workflow, pilotReceipt, decisionMatrix, agreement, execution });
  const diligence = buildBuyerDiligenceRoom({ proposal, handoff: execution, buyerScenario, valueBlueprint, recommendation, baseUrl: "https://example.com" });
  const sponsorReview = buildSponsorReviewRoom({ valueBlueprint, buyerScenario, proposal, workflow, pilotReceipt, decisionMatrix, agreement, ledger, diligence, execution });
  const sponsorDecisionReceipt = buildSponsorDecisionReceipt(sponsorReview, { decidedAt: "2026-06-20" });
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
  const adoptionPlan = buildAdoptionOperatingPlan({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder,
    workflow,
    pilotReceipt,
    agreement,
    ledger,
    proofPacketReceipt: proofPacket.receipt,
    sponsorDecisionReceipt
  });
  const trustCenter = buildBuyerTrustCenter({
    recommendation,
    valueBlueprint,
    workOrder,
    workOrderInput,
    pilotReceipt,
    agreement,
    ledger,
    adoptionPlan,
    workspace
  });
  const commercialOffer = buildCommercialOffer({ recommendation, valueBlueprint, buyerScenario, pilotReceipt, decisionMatrix, agreement, adoptionPlan, trustCenter });
  const links = {
    valueReportUrl: "https://example.com/buyer-value",
    workOrderUrl: "https://example.com/work-order-brief",
    pilotReceiptUrl: "https://example.com/pilot-run-receipt",
    ledgerUrl: "https://example.com/pilot-evidence-ledger",
    deliveryMemoUrl: "https://example.com/buyer-delivery-memo",
    buyerEvidenceBoardUrl: "https://example.com/buyer-evidence-board",
    proofPacketUrl: "https://example.com/buyer-proof-packet",
    sponsorReviewUrl: "https://example.com/sponsor-review",
    agreementUrl: "https://example.com/pilot-agreement",
    adoptionPlanUrl: "https://example.com/adoption-plan",
    trustCenterUrl: "https://example.com/trust-center",
    commercialOfferUrl: "https://example.com/commercial-offer",
    buyerPilotContractUrl: "https://example.com/buyer-pilot-contract",
    launchRoomUrl: "https://example.com/launch-room",
    decisionFollowUpUrl: "https://example.com/buyer-decision-follow-up",
    proofAuditUrl: "https://example.com/buyer-proof-audit",
    jsonUrl: "https://example.com/api/buyer-trust-manifest",
    markdownUrl: "https://example.com/buyer-trust-manifest.md",
    wellKnownUrl: "https://example.com/.well-known/buyer-proof.json",
    appUrl: "https://example.com"
  };
  const buyerPilotContract = buildBuyerPilotContract({
    valueReport,
    pilotReceipt,
    agreement,
    adoptionPlan,
    trustCenter,
    commercialOffer,
    links
  });
  const decisionFollowUpLedger = buildBuyerDecisionFollowUpLedger(
    buildBuyerDecisionAgendaSnapshot({
      proofChain: {
        status: "ready",
        verdict: proofPacket.readiness,
        score: proofPacket.packetScore,
        primaryAction: {
          label: "Open proof packet",
          href: links.proofPacketUrl,
          external: false
        }
      },
      publicDecisionPath: {
        status: "ready",
        decision: "send-to-buyer",
        headline: "Sponsor can send the buyer room",
        buyerLine: "The buyer can inspect value, proof, trust, commercial terms, and follow-up owners.",
        firstAction: {
          label: "Open procurement decision",
          href: "https://example.com/procurement-decision",
          external: false
        },
        guardrails: ["Do not send if public proof changes.", "Regenerate the manifest after any commercial change."]
      },
      pilotContract: {
        status: "ready",
        buyer: workOrderInput.targetUser,
        pilotOffer: commercialOffer.contractAsk,
        firstCommitmentYen: commercialOffer.totalFirstCommitmentYen,
        expectedMonthlyValueYen: commercialOffer.expectedMonthlyValueYen,
        paybackDays: commercialOffer.tiers[0]?.paybackDays ?? 14,
        proofLine: proofPacket.decisionAsk,
        stopRule: agreement.stopRules[0] ?? "Stop if measured proof no longer supports the buyer decision.",
        firstAction: {
          label: "Open decision contract",
          href: "https://example.com/procurement-decision",
          external: false
        },
        sendNote: {
          status: "ready",
          subject: commercialOffer.contractAsk,
          instruction: "Send after the public manifest is regenerated.",
          body: [proofPacket.decisionAsk, commercialOffer.contractAsk]
        }
      },
      trustSnapshot: {
        status: "ready",
        trustScore: trustCenter.trustScore,
        headline: trustCenter.headline,
        dataBoundary: trustCenter.dataBoundary,
        firstAction: {
          label: "Open trust center",
          href: links.trustCenterUrl,
          external: false
        }
      },
      commercialOffer: {
        status: "ready",
        recommendedTier: commercialOffer.tiers[0]?.label ?? commercialOffer.recommendedTierId,
        firstCommitmentYen: commercialOffer.totalFirstCommitmentYen,
        expectedMonthlyValueYen: commercialOffer.expectedMonthlyValueYen,
        paybackDays: commercialOffer.tiers[0]?.paybackDays ?? 14,
        contractLine: commercialOffer.contractAsk,
        firstAction: {
          label: "Open commercial offer",
          href: links.commercialOfferUrl,
          external: false
        }
      }
    })
  );
  const buyerEvidenceBoard = buildBuyerEvidenceBoard({
    projectBrief,
    buyerScenario,
    pilotRun: pilotRunInput,
    buyerWorkOrder: workOrderInput,
    agentTrialEvidence: workspace.agentTrialEvidence,
    command: {
      readiness: "buyer-ready",
      launchScore: 94,
      headline: "Share the proof room with the buyer",
      targetBuyer: workOrderInput.targetUser,
      primaryMetric: "1120 minutes saved per review",
      proofClosure: "6/6 lanes ready",
      pathLabel: "Ready for external review",
      nextGap: {
        label: "Launch room",
        owner: "Pilot owner",
        action: "Open the launch room.",
        href: "https://example.com/launch-room?workspace=lz1.demo",
        editHref: "#launch-room"
      },
      gapQueue: [],
      steps: []
    },
    proofVerification: {
      checkedAt: "2026-06-20T01:00:00.000Z",
      verifiedCount: 5,
      totalCount: 5,
      score: 100,
      results: [
        { id: "targetUrl", label: "Live product", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep reachable." },
        { id: "pilotEvidenceUrl", label: "Pilot receipt", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep reachable." },
        { id: "workOrderEvidenceUrl", label: "Work order proof", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep reachable." },
        { id: "protopediaUrl", label: "ProtoPedia", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep reachable." },
        { id: "videoUrl", label: "Walkthrough", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep reachable." }
      ]
    },
    issuedAt: "2026-06-20T00:00:00.000Z",
    hrefs: {
      workflowIntake: "https://example.com/#quick-workflow-intake",
      valueReport: links.valueReportUrl,
      measuredRun: links.deliveryMemoUrl,
      proofAudit: links.proofAuditUrl,
      trustManifest: links.wellKnownUrl,
      launchRoom: "https://example.com/launch-room?workspace=lz1.demo",
      publicPage: links.buyerEvidenceBoardUrl
    }
  });
  return {
    proofPacket,
    sponsorReview,
    sponsorDecisionReceipt,
    adoptionPlan,
    trustCenter,
    commercialOffer,
    buyerPilotContract,
    decisionFollowUpLedger,
    buyerEvidenceBoardReceipt: buyerEvidenceBoard.receipt,
    links
  };
}

describe("buyer trust manifest", () => {
  test("indexes the buyer proof chain with receipts and verification payload", () => {
    const input = manifestInput();
    const manifest = buildBuyerTrustManifest({ ...input, generatedAt: "2026-06-20T00:00:00.000Z" });

    expect(manifest.manifestVersion).toBe("buyer-trust-manifest.v1");
    expect(manifest.artifacts.map((artifact) => artifact.id)).toEqual([
      "value-report",
      "work-order",
      "pilot-receipt",
      "evidence-ledger",
      "delivery-memo",
      "buyer-evidence-board",
      "proof-packet",
      "sponsor-review",
      "adoption-plan",
      "trust-center",
      "commercial-offer",
      "buyer-pilot-contract",
      "decision-follow-up",
      "live-proof-audit"
    ]);
    expect(manifest.receipts.map((receipt) => receipt.id)).toEqual([
      "buyer-proof-packet",
      "buyer-evidence-board",
      "commercial-offer",
      "buyer-pilot-contract",
      "sponsor-decision",
      "buyer-trust-manifest"
    ]);
    expect(manifest.proofPacketDigest).toBe(input.proofPacket.receipt.digest);
    expect(manifest.artifacts.find((artifact) => artifact.id === "buyer-evidence-board")).toMatchObject({
      status: "pass",
      href: "https://example.com/buyer-evidence-board",
      verifier: `POST ${BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH}`
    });
    expect(manifest.receipts.find((receipt) => receipt.id === "buyer-evidence-board")).toMatchObject({
      status: "pass",
      algorithm: "fnv1a-64",
      digest: input.buyerEvidenceBoardReceipt.checksum,
      verifier: `POST ${BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH}`
    });
    expect(manifest.receipts.find((receipt) => receipt.id === "commercial-offer")).toMatchObject({
      status: "pass",
      algorithm: "fnv1a-64",
      digest: input.commercialOffer.receipt.checksum,
      verifier: `POST ${COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH}`
    });
    expect(manifest.artifacts.find((artifact) => artifact.id === "buyer-pilot-contract")).toMatchObject({
      status: "pass",
      href: "https://example.com/buyer-pilot-contract",
      verifier: `POST ${BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH}`
    });
    expect(manifest.receipts.find((receipt) => receipt.id === "buyer-pilot-contract")).toMatchObject({
      status: "pass",
      algorithm: "fnv1a-64",
      digest: input.buyerPilotContract.receipt.checksum,
      verifier: `POST ${BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH}`
    });
    expect(manifest.receipts.find((receipt) => receipt.id === "buyer-trust-manifest")?.digest).toBe(manifest.verification.digest);
    expect(manifest.verification.verificationApiPath).toBe(BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH);
    expect(manifest.verification.digest).toBe(buyerTrustManifestReceiptDigest(manifest.verification.payload));
    expect(manifest.verification.replayVerification).toMatchObject({
      status: "verified",
      expectedDigest: manifest.verification.digest,
      actualDigest: manifest.verification.digest
    });
    expect(manifest.verification.payload.proofPacketReceiptDigest).toBe(input.proofPacket.receipt.digest);
    expect(manifest.verification.payload.buyerEvidenceBoardReceiptChecksum).toBe(input.buyerEvidenceBoardReceipt.checksum);
    expect(manifest.verification.payload.commercialOfferReceiptChecksum).toBe(input.commercialOffer.receipt.checksum);
    expect(manifest.verification.payload.buyerPilotContractId).toBe(input.buyerPilotContract.id);
    expect(manifest.verification.payload.buyerPilotContractReceiptChecksum).toBe(input.buyerPilotContract.receipt.checksum);
    expect(manifest.verification.payload.generatedAt).toBe("2026-06-20T00:00:00.000Z");
    expect(manifest.verification.payload.publicationWindow).toMatchObject({
      status: "recheck-required",
      proofExpiresAt: "2026-06-21T00:00:00.000Z",
      buyerReviewDueAt: "2026-06-23T00:00:00.000Z",
      manifestExpiresAt: "2026-06-27T00:00:00.000Z"
    });
    expect(manifest.verification.payload.publicationWindow.schedule.map((task) => task.id)).toEqual([
      "live-proof-recheck",
      "manifest-regeneration",
      "sponsor-decision-replay",
      "buyer-review-checkpoint"
    ]);
    expect(manifest.publicationGate).toMatchObject({
      decision: "repair",
      blockedCount: 0,
      watchCount: 1
    });
    expect(manifest.publicationWindow).toMatchObject({
      status: "recheck-required",
      generatedAt: "2026-06-20T00:00:00.000Z",
      proofExpiresAt: "2026-06-21T00:00:00.000Z",
      buyerReviewDueAt: "2026-06-23T00:00:00.000Z",
      manifestExpiresAt: "2026-06-27T00:00:00.000Z",
      firstRecheckHref: "https://example.com/buyer-proof-audit"
    });
    expect(manifest.publicationWindow.firstRecheck).toContain("Live proof recheck");
    expect(manifest.publicationWindow.schedule.find((task) => task.id === "live-proof-recheck")).toMatchObject({
      status: "watch",
      owner: "Launch operator",
      href: "https://example.com/buyer-proof-audit"
    });
    expect(manifest.publicationGate.checks.map((check) => check.id)).toContain("live-proof-audit");
    expect(manifest.publicationGate.checks.find((check) => check.id === "decision-follow-up")).toMatchObject({
      status: "pass",
      href: "https://example.com/buyer-decision-follow-up"
    });
    expect(manifest.verificationBrief).toMatchObject({
      machineManifestHref: "https://example.com/.well-known/buyer-proof.json",
      markdownHref: "https://example.com/buyer-trust-manifest.md",
      primaryArtifactHref: "https://example.com/buyer-proof-audit",
      digest: manifest.verification.digest,
      proofPacketDigest: input.proofPacket.receipt.digest
    });
    expect(manifest.verificationBrief.instructions.join("\n")).toContain("Recompute fnv1a-64");
    expect(manifest.verificationBrief.instructions.join("\n")).toContain("buyer-evidence-board");
    expect(manifest.verificationBrief.instructions.join("\n")).toContain("commercial-offer");
    expect(manifest.verificationBrief.instructions.join("\n")).toContain("buyer-pilot-contract");
    expect(manifest.exportMarkdown).toContain("## Verification");
    expect(manifest.exportMarkdown).toContain("## Verification brief");
    expect(manifest.exportMarkdown).toContain("## Publication gate");
    expect(manifest.exportMarkdown).toContain("## Publication window");
    expect(manifest.exportMarkdown).toContain("### Recheck schedule");
    expect(manifest.exportMarkdown).toContain("## Manifest API verification");
    expect(manifest.exportMarkdown).toContain(`POST ${BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH}`);
    expect(manifest.exportMarkdown).toContain(manifest.verification.verificationRequestJson);
  });

  test("detects a changed manifest verification payload", () => {
    const manifest = buildBuyerTrustManifest({ ...manifestInput(), generatedAt: "2026-06-20T00:00:00.000Z" });

    const result = verifyBuyerTrustManifestReceipt({
      digest: manifest.verification.digest,
      payload: {
        ...manifest.verification.payload,
        score: manifest.verification.payload.score - 1
      }
    });

    expect(result).toMatchObject({
      status: "mismatch",
      expectedDigest: manifest.verification.digest
    });
    expect(result.actualDigest).not.toBe(manifest.verification.digest);
  });

  test("keeps the live proof audit as a required external check", () => {
    const manifest = buildBuyerTrustManifest({ ...manifestInput(), generatedAt: "2026-06-20T00:00:00.000Z" });

    expect(manifest.readiness).toBe("needs-proof");
    expect(manifest.artifacts.find((artifact) => artifact.id === "live-proof-audit")).toMatchObject({
      status: "watch",
      owner: "Launch operator"
    });
    expect(manifest.publicationGate.firstAction).toContain("Run the live proof audit");
    expect(manifest.publicationGate.firstActionHref).toBe("https://example.com/buyer-proof-audit");
    expect(manifest.decision).toContain("Live proof audit");
  });

  test("renders escaped public HTML with manifest links", () => {
    const manifest = buildBuyerTrustManifest({
      ...manifestInput(),
      generatedAt: "2026-06-20T00:00:00.000Z",
      issuer: "Issuer <script>alert(1)</script>"
    });
    const html = renderBuyerTrustManifestHtml(
      {
        ...manifest,
        headline: "Manifest <script>alert(1)</script>"
      },
      {
        jsonUrl: "https://example.com/api/buyer-trust-manifest",
        markdownUrl: "https://example.com/buyer-trust-manifest.md",
        wellKnownUrl: "https://example.com/.well-known/buyer-proof.json",
        appUrl: "https://example.com"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer Trust Manifest");
    expect(html).toContain("Publication gate");
    expect(html).toContain("Publication window");
    expect(html).toContain("Recheck schedule");
    expect(html).toContain("Open first recheck");
    expect(html).toContain("Verification brief");
    expect(html).toContain("Verify manifest");
    expect(html).toContain(BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH);
    expect(html).toContain("Download verify request");
    expect(html).toContain("buyer-trust-manifest-verify-request");
    expect(html).toContain("Machine manifest");
    expect(html).toContain("Primary artifact");
    expect(html).toContain("Open first action");
    expect(html).toContain("JSON manifest");
    expect(html).toContain("Well-known JSON");
    expect(html).toContain("https://example.com/buyer-proof-packet");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Manifest &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
