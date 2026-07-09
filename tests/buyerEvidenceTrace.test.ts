import { describe, expect, it } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerEvidenceTrace, renderBuyerEvidenceTraceHtml } from "../src/buyerEvidenceTrace";
import { buildBuyerDecisionMatrix } from "../src/buyerDecisionMatrix";
import { buildBuyerDiligenceRoom } from "../src/buyerDiligence";
import { buildBuyerPilotCommand } from "../src/buyerPilotCommand";
import { buildBuyerPilotMeasuredRunSummary } from "../src/buyerPilotMeasuredRun";
import { buildBuyerPilotRunCalibration } from "../src/buyerPilotRunCalibration";
import { buildBuyerProofPacket } from "../src/buyerProofPacket";
import { buildBuyerShareGate, type BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { mergeAgentCatalog } from "../src/customAgent";
import { buildLaunchRoom } from "../src/launchRoom";
import { buildPilotAgreement } from "../src/pilotAgreement";
import { buildPilotEvidenceLedger } from "../src/pilotEvidenceLedger";
import { buildPilotExecutionHandoff } from "../src/pilotExecution";
import { buildPilotProposal } from "../src/pilotProposal";
import { buildPilotRunReceipt } from "../src/pilotRunReceipt";
import { buildPilotWorkflowPlan } from "../src/pilotWorkflow";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";
import { buildSponsorReviewRoom } from "../src/sponsorReviewRoom";
import { buildValueBlueprint } from "../src/valueBlueprint";
import { buildWorkspaceDraft, defaultWorkspaceDraft, type WorkspaceDraft } from "../src/workspaceDraft";

const proofCheckedNow = new Date("2026-06-20T08:00:00.000Z");
const submissionProof = {
  protopediaUrl: "https://protopedia.net/prototype/release-ready",
  videoUrl: "https://youtu.be/releaseReady12345"
};

function proofLinks(workspace: WorkspaceDraft) {
  return [
    { id: "targetUrl", label: "Deployed URL", value: workspace.targetUrl, href: "#launch-evidence-console" },
    { id: "protopediaUrl", label: "ProtoPedia URL", value: workspace.protopediaUrl, href: "#launch-evidence-console" },
    { id: "videoUrl", label: "Demo video", value: workspace.videoUrl, href: "#launch-evidence-console" },
    { id: "pilotEvidenceUrl", label: "Pilot receipt", value: workspace.pilotRun.evidenceUrl, href: "#pilot-run-receipt" },
    { id: "workOrderEvidenceUrl", label: "Work order proof", value: workspace.buyerWorkOrder.evidenceUrl, href: "#buyer-work-order-studio" }
  ];
}

function rebuildWorkspace(workspace: WorkspaceDraft, patch: Partial<WorkspaceDraft>) {
  return buildWorkspaceDraft({
    activeTemplateId: patch.activeTemplateId ?? workspace.activeTemplateId,
    projectBrief: patch.projectBrief ?? workspace.projectBrief,
    selectedAgentIds: patch.selectedAgentIds ?? workspace.selectedAgentIds,
    customAgents: patch.customAgents ?? workspace.customAgents,
    agentTrialEvidence: patch.agentTrialEvidence ?? workspace.agentTrialEvidence,
    buyerScenario: patch.buyerScenario ?? workspace.buyerScenario,
    pilotRun: patch.pilotRun ?? workspace.pilotRun,
    buyerWorkOrder: patch.buyerWorkOrder ?? workspace.buyerWorkOrder,
    targetUrl: patch.targetUrl ?? workspace.targetUrl,
    protopediaUrl: patch.protopediaUrl ?? workspace.protopediaUrl,
    videoUrl: patch.videoUrl ?? workspace.videoUrl,
    proofVerification: Object.hasOwn(patch, "proofVerification") ? (patch.proofVerification ?? null) : workspace.proofVerification,
    updatedAt: patch.updatedAt ?? workspace.updatedAt
  });
}

function passingProofVerification(workspace: WorkspaceDraft): BuyerShareGateProofVerificationSummary {
  return {
    checkedAt: "2026-06-20T00:00:00.000Z",
    verifiedCount: 5,
    totalCount: 5,
    score: 100,
    results: proofLinks(workspace).map((link) => ({
      id: link.id,
      label: link.label,
      status: "pass" as const,
      httpStatus: 200,
      evidence: `${link.label} responded with HTTP 200.`,
      action: "Keep this link attached."
    }))
  };
}

function buildTrace(workspace: WorkspaceDraft) {
  const recommendation = recommendSquad(workspace.projectBrief, workspace.selectedAgentIds, 260, mergeAgentCatalog(workspace.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, workspace.projectBrief, "https://launch.example");
  const buyerScenario = buildBuyerValueScenario(recommendation, workspace.buyerScenario);
  const proposal = buildPilotProposal({ recommendation, valueBlueprint, buyerScenario, workspace });
  const workflow = buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario });
  const pilotReceipt = buildPilotRunReceipt({ recommendation, valueBlueprint, buyerScenario, workflow, pilotRun: workspace.pilotRun });
  const decisionMatrix = buildBuyerDecisionMatrix({ recommendation, valueBlueprint, buyerScenario, pilotReceipt });
  const agreement = buildPilotAgreement({ recommendation, valueBlueprint, buyerScenario, proposal, workflow, decisionMatrix, pilotReceipt });
  const execution = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl: "https://launch.example" });
  const ledger = buildPilotEvidenceLedger({ recommendation, valueBlueprint, buyerScenario, proposal, workflow, pilotReceipt, decisionMatrix, agreement, execution });
  const diligence = buildBuyerDiligenceRoom({ proposal, handoff: execution, buyerScenario, valueBlueprint, recommendation, baseUrl: "https://launch.example" });
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
  const room = buildLaunchRoom({
    workspace,
    baseUrl: "https://launch.example",
    appUrl: "https://launch.example/?workspace=share-token",
    now: proofCheckedNow
  });
  const command = buildBuyerPilotCommand(room);
  const measuredRun = buildBuyerPilotMeasuredRunSummary(workspace.pilotRun, buyerScenario);
  const runCalibration = buildBuyerPilotRunCalibration(workspace.pilotRun, buyerScenario);
  const shareGate = buildBuyerShareGate({
    command,
    proofLinks: proofLinks(workspace),
    measuredRun,
    runCalibration,
    proofVerification: workspace.proofVerification ?? undefined,
    now: proofCheckedNow
  });
  return buildBuyerEvidenceTrace({ room, shareGate, proofPacketReceipt: proofPacket.receipt, generatedAt: "2026-06-20T00:00:00.000Z" });
}

describe("buyer evidence trace", () => {
  it("traces the proof-backed sample as a buyer-safe packet", () => {
    const trace = buildTrace(buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://launch.example", submissionProof));

    expect(trace.readiness).toBe("buyer-safe");
    expect(trace.claims.map((claim) => claim.id)).toEqual(["value-case", "measured-pilot", "public-proof", "work-order", "operating-gates", "buyer-decision"]);
    expect(trace.primaryClaim.id).toBe("value-case");
    expect(trace.claims.every((claim) => claim.status === "pass")).toBe(true);
    expect(trace.claims.find((claim) => claim.id === "public-proof")?.source.value).toContain("5/5");
    expect(trace.claims.find((claim) => claim.id === "public-proof")?.artifact.label).toBe("Live proof audit");
    expect(trace.claims.find((claim) => claim.id === "public-proof")?.artifact.href).toContain("/buyer-proof-audit?");
    expect(trace.auditSummary.readiness).toBe("audit-ready");
    expect(trace.auditSummary.primaryFailure).toBeNull();
    expect(trace.claims.find((claim) => claim.id === "public-proof")?.auditChecks.map((check) => check.id)).toEqual(["source-check", "artifact-link", "claim-match"]);
    expect(trace.blockers).toEqual([]);
    expect(trace.exportMarkdown).toContain("## Claim trace matrix");
    expect(trace.exportMarkdown).toContain("## Verification checklist");
    expect(trace.exportMarkdown).toContain("## Approval trail");
    expect(trace.approvalTrail.receiptDigest).toMatch(/^[a-f0-9]{16}$/);
    expect(trace.approvalTrail.items.map((item) => item.id)).toEqual(["claim-trace", "share-gate", "packet-receipt", "sponsor-decision"]);
    expect(trace.exportMarkdown).toContain("Open blockers");
    expect(trace.exportMarkdown).toContain("- None.");
  });

  it("marks a fully sealed workspace as buyer-safe when all claims trace to proof", () => {
    const sample = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://launch.example");
    const sealed = rebuildWorkspace(sample, {
      protopediaUrl: "https://protopedia.net/project/a2a-agent-marketplace",
      videoUrl: "https://youtu.be/a2a-agent-marketplace",
      proofVerification: passingProofVerification({
        ...sample,
        protopediaUrl: "https://protopedia.net/project/a2a-agent-marketplace",
        videoUrl: "https://youtu.be/a2a-agent-marketplace"
      })
    });
    const trace = buildTrace(sealed);

    expect(trace.readiness).toBe("buyer-safe");
    expect(trace.score).toBeGreaterThanOrEqual(90);
    expect(trace.blockers).toEqual([]);
    expect(trace.claims.every((claim) => claim.status === "pass")).toBe(true);
    expect(trace.auditSummary).toMatchObject({
      readiness: "audit-ready",
      passCount: 18,
      totalCount: 18,
      primaryFailure: null
    });
    expect(trace.approvalTrail.readiness).toBe("pass");
    expect(trace.approvalTrail.receiptDigest).toMatch(/^[a-f0-9]{16}$/);
    expect(trace.claims.every((claim) => claim.auditChecks.every((check) => check.status === "pass"))).toBe(true);
    expect(trace.shareDecision).toContain("Send");
  });

  it("renders a public trace artifact with source, artifact, and blocker evidence", () => {
    const trace = buildTrace(defaultWorkspaceDraft("2026-06-20T00:00:00.000Z"));
    const html = renderBuyerEvidenceTraceHtml(trace, {
      appUrl: "https://launch.example",
      launchRoomUrl: "https://launch.example/launch-room",
      buyerBriefUrl: "https://launch.example/buyer-outcome-brief",
      proofDossierUrl: "https://launch.example/global-proof-dossier",
      jsonUrl: "https://launch.example/api/buyer-evidence-trace",
      markdownUrl: "https://launch.example/buyer-evidence-trace.md"
    });

    expect(trace.readiness).toBe("not-shareable");
    expect(html).toContain("Buyer Evidence Trace");
    expect(html).toContain("Claim trace matrix");
    expect(html).toContain("Verification checklist");
    expect(html).toContain("Approval trail");
    expect(html).toContain("Live proof audit");
    expect(html).toContain(trace.approvalTrail.receiptDigest ?? "");
    expect(html).toContain("audit checks pass");
    expect(html).toContain("Source");
    expect(html).toContain("Artifact");
    expect(html).toContain("Open artifact");
    expect(html).toContain("JSON");
  });
});
