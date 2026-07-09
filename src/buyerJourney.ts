import { encodeAgentTrialEvidenceParam, summarizeAgentTrialEvidence } from "./agentTrialEvidence.js";
import { buildAdoptionOperatingPlan } from "./adoptionOperatingPlan.js";
import { buildBuyerDecisionMatrix } from "./buyerDecisionMatrix.js";
import type { BuyerValueScenario } from "./buyerValueScenario.js";
import { buildBuyerDiligenceRoom } from "./buyerDiligence.js";
import { buildBuyerProofPacket } from "./buyerProofPacket.js";
import { buildBuyerTrustCenter } from "./buyerTrustCenter.js";
import { buildBuyerWorkOrderBrief, DEFAULT_BUYER_WORK_ORDER_INPUT, normalizeBuyerWorkOrderInput, type BuyerWorkOrderInput } from "./buyerWorkOrder.js";
import { buildCommercialOffer } from "./commercialOffer.js";
import { encodeCustomAgentsParam } from "./customAgent.js";
import { buildPilotExecutionHandoff } from "./pilotExecution.js";
import { buildPilotAgreement } from "./pilotAgreement.js";
import { buildPilotEvidenceLedger } from "./pilotEvidenceLedger.js";
import { buildPilotProposal } from "./pilotProposal.js";
import { buildPilotRunReceipt } from "./pilotRunReceipt.js";
import { buildPilotWorkflowPlan } from "./pilotWorkflow.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import { buildSponsorReviewRoom } from "./sponsorReviewRoom.js";
import type { MarketAgent, Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";
import type { WorkspaceDraft } from "./workspaceDraft.js";

export type BuyerJourneyReadiness = "ready-for-sponsor" | "needs-evidence" | "blocked";
export type BuyerJourneyStepStatus = "complete" | "attention" | "blocked";

export type BuyerJourneyStep = {
  id: string;
  label: string;
  status: BuyerJourneyStepStatus;
  owner: string;
  href: string;
  evidence: string;
  action: string;
};

export type BuyerJourneyAction = {
  id: string;
  label: string;
  owner: string;
  href: string;
  reason: string;
};

export type BuyerJourneyArtifact = {
  id: string;
  label: string;
  href: string;
  purpose: string;
};

export type BuyerJourney = {
  id: string;
  readiness: BuyerJourneyReadiness;
  journeyScore: number;
  headline: string;
  hardTruth: string;
  nextAction: BuyerJourneyAction;
  focusSteps: BuyerJourneyStep[];
  steps: BuyerJourneyStep[];
  artifacts: BuyerJourneyArtifact[];
  completedSteps: number;
  totalSteps: number;
  remainingStepCount: number;
};

type BuildBuyerJourneyInput = {
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  buyerWorkOrder?: Partial<BuyerWorkOrderInput>;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl"> & Partial<Pick<WorkspaceDraft, "agentTrialEvidence" | "pilotRun">>;
  customAgents?: MarketAgent[];
  baseUrl?: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeBaseUrl(value: string | undefined) {
  return (value || "").replace(/\/$/, "");
}

function url(baseUrl: string | undefined, path: string) {
  const base = normalizeBaseUrl(baseUrl);
  return base ? `${base}${path}` : path;
}

function statusScore(status: BuyerJourneyStepStatus) {
  if (status === "complete") return 100;
  if (status === "attention") return 64;
  return 20;
}

function buyerStatus(scenario: BuyerValueScenario): BuyerJourneyStepStatus {
  if (scenario.readiness === "scales-now") return "complete";
  if (scenario.readiness === "pilot-first") return "attention";
  return "blocked";
}

function proofState(workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl"> & Partial<Pick<WorkspaceDraft, "agentTrialEvidence">>) {
  const runtimeReady = isBuyerFacingProofUrl(workspace.targetUrl);
  const submissionCount = [workspace.protopediaUrl, workspace.videoUrl].filter(isBuyerFacingProofUrl).length;
  const trial = summarizeAgentTrialEvidence(workspace.agentTrialEvidence ?? []);
  const urlsReady = runtimeReady && submissionCount === 2;
  const status: BuyerJourneyStepStatus = urlsReady && trial.status === "ready" ? "complete" : runtimeReady || submissionCount > 0 || trial.status !== "missing" ? "attention" : "blocked";
  const action = urlsReady && trial.status !== "ready" ? "Attach verified A2A trial proof" : "Attach public launch proof";
  const evidence = [
    `Runtime proof: ${runtimeReady ? "ready" : "missing"}`,
    `Submission proof: ${submissionCount}/2`,
    `A2A trial proof: ${trial.status === "ready" ? "ready" : trial.status}`
  ].join(" / ");
  return { status, action, evidence };
}

function briefStatus(projectBrief: string): BuyerJourneyStepStatus {
  const wordish = projectBrief.trim().split(/\s+/).filter(Boolean).length;
  if (projectBrief.trim().length >= 120 || wordish >= 18) return "complete";
  if (projectBrief.trim().length >= 40) return "attention";
  return "blocked";
}

function squadStatus(recommendation: Recommendation): BuyerJourneyStepStatus {
  if (recommendation.selected.length >= 4 && recommendation.after.total >= 72) return "complete";
  if (recommendation.selected.length >= 2) return "attention";
  return "blocked";
}

function queryFor(input: BuildBuyerJourneyInput, workOrder: BuyerWorkOrderInput) {
  const params = new URLSearchParams({
    brief: input.projectBrief.slice(0, 4000),
    agents: input.recommendation.selected.map((agent) => agent.id).join(","),
    teamSize: String(input.buyerScenario.assumptions.teamSize),
    hourlyCostYen: String(input.buyerScenario.assumptions.hourlyCostYen),
    cyclesPerMonth: String(input.buyerScenario.assumptions.cyclesPerMonth),
    manualHoursPerCycle: String(input.buyerScenario.assumptions.manualHoursPerCycle),
    adoptionRatePercent: String(input.buyerScenario.assumptions.adoptionRatePercent),
    incidentRiskYenPerMonth: String(input.buyerScenario.assumptions.incidentRiskYenPerMonth),
    pilotManualMinutes: String(input.workspace.pilotRun?.observedManualMinutes ?? ""),
    pilotAssistedMinutes: String(input.workspace.pilotRun?.observedAssistedMinutes ?? ""),
    pilotParticipants: String(input.workspace.pilotRun?.participants ?? ""),
    pilotAcceptedTasks: String(input.workspace.pilotRun?.acceptedTasks ?? ""),
    pilotTotalTasks: String(input.workspace.pilotRun?.totalTasks ?? ""),
    workOrder: workOrder.request,
    workOrderSuccessMetric: workOrder.successMetric,
    workOrderBaseline: workOrder.currentBaseline,
    workOrderDataSensitivity: workOrder.dataSensitivity
  });
  if (workOrder.targetUser) params.set("workOrderTargetUser", workOrder.targetUser);
  if (workOrder.evidenceUrl) params.set("workOrderEvidenceUrl", workOrder.evidenceUrl);
  if (input.workspace.pilotRun?.evidenceUrl) params.set("pilotEvidenceUrl", input.workspace.pilotRun.evidenceUrl);
  if (input.workspace.pilotRun?.reviewerName) params.set("pilotReviewer", input.workspace.pilotRun.reviewerName);
  if (input.workspace.pilotRun?.notes) params.set("pilotNotes", input.workspace.pilotRun.notes);
  if (input.workspace.targetUrl) params.set("targetUrl", input.workspace.targetUrl);
  if (input.workspace.protopediaUrl) params.set("protopediaUrl", input.workspace.protopediaUrl);
  if (input.workspace.videoUrl) params.set("videoUrl", input.workspace.videoUrl);
  if (input.customAgents?.length) params.set("customAgents", encodeCustomAgentsParam(input.customAgents));
  if (input.workspace.agentTrialEvidence?.length) params.set("trialEvidence", encodeAgentTrialEvidenceParam(input.workspace.agentTrialEvidence));
  return params.toString();
}

function headlineFor(readiness: BuyerJourneyReadiness) {
  if (readiness === "ready-for-sponsor") return "The buyer path has one clear next move";
  if (readiness === "needs-evidence") return "The buyer path is useful, but proof is still open";
  return "The buyer path is blocked before approval";
}

function hardTruthFor(readiness: BuyerJourneyReadiness) {
  if (readiness === "ready-for-sponsor") {
    return "A sponsor can inspect the buyer value, work order, proof packet, adoption plan, trust center, and commercial offer without hunting across the workspace.";
  }
  if (readiness === "needs-evidence") {
    return "Do not let users hunt through the page. Close the highlighted proof gap first, then share the buyer room.";
  }
  return "The current path still feels like a demo because the buyer value or public proof cannot support an approval decision yet.";
}

function nextActionFor(input: { steps: BuyerJourneyStep[]; artifacts: BuyerJourneyArtifact[] }): BuyerJourneyAction {
  const blocked = input.steps.find((step) => step.status === "blocked");
  if (blocked) {
    return {
      id: `fix-${blocked.id}`,
      label: blocked.action,
      owner: blocked.owner,
      href: blocked.href,
      reason: blocked.evidence
    };
  }
  const attention = input.steps.find((step) => step.status === "attention");
  if (attention) {
    return {
      id: `tighten-${attention.id}`,
      label: attention.action,
      owner: attention.owner,
      href: attention.href,
      reason: attention.evidence
    };
  }
  const reviewArtifact =
    input.artifacts.find((artifact) => artifact.id === "commercial-offer") ??
    input.artifacts.find((artifact) => artifact.id === "proof-packet") ??
    input.artifacts.find((artifact) => artifact.id === "sponsor-review") ??
    input.artifacts.find((artifact) => artifact.id === "diligence-room") ??
    input.artifacts[0];
  return {
    id: "share-commercial-offer",
    label: "Share the proof-backed offer",
    owner: "Buyer sponsor",
    href: reviewArtifact.href,
    reason: "All buyer-path steps are ready enough for a buyer to review price, scope, trust, and proof."
  };
}

function focusStepsFor(steps: BuyerJourneyStep[]) {
  const blockedIndex = steps.findIndex((step) => step.status === "blocked");
  const openIndex = blockedIndex >= 0 ? blockedIndex : steps.findIndex((step) => step.status === "attention");
  if (openIndex === -1) {
    const closeoutIds = new Set(["commercial-offer", "sponsor-review", "proof-packet", "pilot-execution"]);
    const closeout = steps.filter((step) => closeoutIds.has(step.id));
    return closeout.length > 0 ? closeout : steps.slice(-4);
  }
  const start = Math.max(0, Math.min(openIndex - 1, steps.length - 4));
  return steps.slice(start, start + 4);
}

export function buildBuyerJourney(input: BuildBuyerJourneyInput): BuyerJourney {
  const workOrderInput = normalizeBuyerWorkOrderInput(input.buyerWorkOrder, {
    ...DEFAULT_BUYER_WORK_ORDER_INPUT,
    targetUser: input.valueBlueprint.primaryUser,
    evidenceUrl: input.workspace.targetUrl
  });
  const workOrder = buildBuyerWorkOrderBrief({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    workOrder: workOrderInput
  });
  const proposal = buildPilotProposal({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    workspace: input.workspace
  });
  const handoff = buildPilotExecutionHandoff({ proposal, recommendation: input.recommendation, baseUrl: input.baseUrl });
  const room = buildBuyerDiligenceRoom({
    proposal,
    handoff,
    buyerScenario: input.buyerScenario,
    valueBlueprint: input.valueBlueprint,
    recommendation: input.recommendation,
    baseUrl: input.baseUrl
  });
  const query = queryFor(input, workOrderInput);
  const proposalHref = url(input.baseUrl, `/buyer-proposal?${query}`);
  const valueReportHref = url(input.baseUrl, `/buyer-value?${query}`);
  const workOrderHref = url(input.baseUrl, `/work-order-brief?${query}`);
  const workflowHref = url(input.baseUrl, `/pilot-workflow?${query}`);
  const pilotReceiptHref = url(input.baseUrl, `/pilot-run-receipt?${query}`);
  const decisionHref = url(input.baseUrl, `/buyer-decision?${query}`);
  const agreementHref = url(input.baseUrl, `/pilot-agreement?${query}`);
  const ledgerHref = url(input.baseUrl, `/pilot-evidence-ledger?${query}`);
  const adoptionPlanHref = url(input.baseUrl, `/adoption-plan?${query}`);
  const trustCenterHref = url(input.baseUrl, `/trust-center?${query}`);
  const commercialOfferHref = url(input.baseUrl, `/commercial-offer?${query}`);
  const sponsorReviewHref = url(input.baseUrl, `/sponsor-review?${query}`);
  const proofPacketHref = url(input.baseUrl, `/buyer-proof-packet?${query}`);
  const diligenceHref = url(input.baseUrl, `/buyer-diligence?${query}`);
  const executionHref = url(input.baseUrl, `/pilot-execution?${query}`);
  const workflow = buildPilotWorkflowPlan({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario
  });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    workflow,
    pilotRun: input.workspace.pilotRun ?? {}
  });
  const decisionMatrix = buildBuyerDecisionMatrix({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    pilotReceipt
  });
  const agreement = buildPilotAgreement({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    proposal,
    workflow,
    decisionMatrix,
    pilotReceipt
  });
  const ledger = buildPilotEvidenceLedger({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    execution: handoff
  });
  const adoptionPlan = buildAdoptionOperatingPlan({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    workOrder,
    workflow,
    pilotReceipt,
    agreement,
    ledger
  });
  const trustCenter = buildBuyerTrustCenter({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    workOrder,
    workOrderInput,
    pilotReceipt,
    agreement,
    ledger,
    adoptionPlan,
    workspace: {
      targetUrl: input.workspace.targetUrl,
      protopediaUrl: input.workspace.protopediaUrl,
      videoUrl: input.workspace.videoUrl,
      agentTrialEvidence: input.workspace.agentTrialEvidence ?? []
    }
  });
  const commercialOffer = buildCommercialOffer({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    pilotReceipt,
    decisionMatrix,
    agreement,
    adoptionPlan,
    trustCenter
  });
  const sponsorReview = buildSponsorReviewRoom({
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    ledger,
    diligence: room,
    execution: handoff
  });
  const proofPacket = buildBuyerProofPacket({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    ledger,
    diligence: room,
    execution: handoff,
    sponsorReview
  });
  const proof = proofState(input.workspace);
  const steps: BuyerJourneyStep[] = [
    {
      id: "brief",
      label: "Shape the buyer problem",
      status: briefStatus(input.projectBrief),
      owner: "Product owner",
      href: "#marketplace-workbench",
      evidence: `${input.valueBlueprint.primaryUser} is the current buyer profile.`,
      action: "Tighten the project brief"
    },
    {
      id: "squad",
      label: "Hire the accountable squad",
      status: squadStatus(input.recommendation),
      owner: "A2A Market Broker",
      href: "#squad-decision-board",
      evidence: `${input.recommendation.selected.length} agents selected, ${input.recommendation.after.total}/100 squad score.`,
      action: "Choose the stronger squad"
    },
    {
      id: "buyer-value",
      label: "Prove buyer value",
      status: buyerStatus(input.buyerScenario),
      owner: "A2A Market Broker",
      href: "#buyer-value-simulator",
      evidence: `${input.buyerScenario.scenarioScore}/100 value score, ${input.buyerScenario.paybackDays}-day payback.`,
      action: "Tighten the value assumptions"
    },
    {
      id: "work-order",
      label: "Define buyer work order",
      status: workOrder.readiness === "ready-to-run" ? "complete" : workOrder.readiness === "blocked" ? "blocked" : "attention",
      owner: workOrder.assignments[0]?.agentName ?? "Pilot facilitator",
      href: "#buyer-work-order-studio",
      evidence: `${workOrder.workOrderScore}/100 work order score, next ${workOrder.nextAction}.`,
      action: "Open the work order studio"
    },
    {
      id: "public-proof",
      label: "Attach public proof",
      status: proof.status,
      owner: "Cloud Run SRE",
      href: "#launch-evidence-console",
      evidence: proof.evidence,
      action: proof.action
    },
    {
      id: "pilot-workflow",
      label: "Package first workflow",
      status: workflow.readiness === "ready-to-run" ? "complete" : workflow.readiness === "needs-scope" ? "attention" : "blocked",
      owner: "Pilot facilitator",
      href: workflowHref,
      evidence: `${workflow.workflowScore}/100 workflow score, ${workflow.minutesSavedPerRun} minutes saved per run.`,
      action: "Open the pilot workflow"
    },
    {
      id: "pilot-receipt",
      label: "Record first pilot",
      status: pilotReceipt.readiness === "accepted" ? "complete" : pilotReceipt.readiness === "needs-evidence" ? "attention" : "blocked",
      owner: "Pilot facilitator",
      href: "#pilot-run-receipt",
      evidence: `${pilotReceipt.receiptScore}/100 receipt score, ${pilotReceipt.actualMinutesSavedPerRun} minutes saved, ${pilotReceipt.acceptanceRatePercent}% acceptance.`,
      action: "Record the pilot receipt"
    },
    {
      id: "buyer-decision",
      label: "Compare buying options",
      status: decisionMatrix.readiness === "buy-a2a" ? "complete" : decisionMatrix.readiness === "pilot-more" ? "attention" : "blocked",
      owner: "Buyer sponsor",
      href: "#buyer-decision-matrix",
      evidence: `${decisionMatrix.confidenceScore}/100 confidence, winner ${decisionMatrix.alternatives.find((alternative) => alternative.id === decisionMatrix.winnerId)?.label ?? decisionMatrix.winnerId}.`,
      action: "Open the decision matrix"
    },
    {
      id: "pilot-agreement",
      label: "Draft the pilot agreement",
      status: agreement.readiness === "ready-to-sign" ? "complete" : agreement.readiness === "needs-redlines" ? "attention" : "blocked",
      owner: "Buyer sponsor",
      href: "#pilot-agreement",
      evidence: `${agreement.agreementScore}/100 agreement score, ${agreement.terms.filter((term) => term.status !== "clear").length} open terms.`,
      action: "Open the pilot agreement"
    },
    {
      id: "evidence-ledger",
      label: "Review the evidence ledger",
      status: ledger.readiness === "sponsor-ready" ? "complete" : ledger.readiness === "needs-proof" ? "attention" : "blocked",
      owner: "Buyer sponsor",
      href: "#pilot-evidence-ledger",
      evidence: `${ledger.ledgerScore}/100 ledger score, ${ledger.exceptions.length} open exceptions.`,
      action: "Open the evidence ledger"
    },
    {
      id: "adoption-plan",
      label: "Plan adoption operations",
      status: adoptionPlan.readiness === "ready-to-operate" ? "complete" : adoptionPlan.readiness === "blocked" ? "blocked" : "attention",
      owner: adoptionPlan.ownerCommitments[0]?.owner ?? input.valueBlueprint.primaryUser,
      href: "#adoption-operating-plan",
      evidence: `${adoptionPlan.planScore}/100 adoption score, ${adoptionPlan.cadence.filter((step) => step.status !== "clear").length} cadence gaps.`,
      action: "Open the adoption plan"
    },
    {
      id: "trust-center",
      label: "Clear buyer trust",
      status: trustCenter.readiness === "trust-ready" ? "complete" : trustCenter.readiness === "blocked" ? "blocked" : "attention",
      owner: trustCenter.controls.find((control) => control.id === "security-owner")?.owner ?? "Security reviewer",
      href: "#buyer-trust-center",
      evidence: `${trustCenter.trustScore}/100 trust score, ${trustCenter.risks.length} open trust items.`,
      action: "Open the trust center"
    },
    {
      id: "commercial-offer",
      label: "Send proof-backed offer",
      status: commercialOffer.readiness === "offer-ready" ? "complete" : commercialOffer.readiness === "blocked" ? "blocked" : "attention",
      owner: agreement.signatures[0]?.name ?? input.valueBlueprint.primaryUser,
      href: "#commercial-offer",
      evidence: `${commercialOffer.offerScore}/100 offer score, ${commercialOffer.recommendedTierId} at ${commercialOffer.totalFirstCommitmentYen.toLocaleString("ja-JP")} yen.`,
      action: "Open the commercial offer"
    },
    {
      id: "sponsor-review",
      label: "Answer sponsor questions",
      status: sponsorReview.readiness === "approve-review" ? "complete" : sponsorReview.readiness === "close-evidence" ? "attention" : "blocked",
      owner: "Buyer sponsor",
      href: "#sponsor-review-room",
      evidence: `${sponsorReview.reviewScore}/100 review score, next ${sponsorReview.nextQuestion.label}.`,
      action: "Open the sponsor review room"
    },
    {
      id: "proof-packet",
      label: "Package buyer proof",
      status: proofPacket.readiness === "share-ready" ? "complete" : proofPacket.readiness === "needs-evidence" ? "attention" : "blocked",
      owner: "Buyer sponsor",
      href: "#buyer-proof-packet",
      evidence: `${proofPacket.packetScore}/100 packet score, ${proofPacket.gaps.length} open gaps.`,
      action: "Open the buyer proof packet"
    },
    {
      id: "approval-room",
      label: "Prepare sponsor approval",
      status: room.readiness === "approval-ready" ? "complete" : room.readiness === "needs-evidence" ? "attention" : "blocked",
      owner: "Buyer sponsor",
      href: diligenceHref,
      evidence: `${room.diligenceScore}/100 diligence score, ${room.riskRegister.filter((risk) => risk.status !== "clear").length} open risks.`,
      action: "Open the diligence room"
    },
    {
      id: "pilot-execution",
      label: "Hand off the pilot",
      status: handoff.readiness === "ready-to-start" ? "complete" : handoff.readiness === "needs-proof" ? "attention" : "blocked",
      owner: "Pilot owner",
      href: executionHref,
      evidence: `${handoff.executionScore}/100 execution score, ${handoff.workOrders.length} work orders.`,
      action: "Open the execution handoff"
    }
  ];
  const artifacts: BuyerJourneyArtifact[] = [
    {
      id: "proposal",
      label: "Proposal",
      href: proposalHref,
      purpose: "Buyer-facing pilot offer"
    },
    {
      id: "value-report",
      label: "Value",
      href: valueReportHref,
      purpose: "ROI base case, sensitivity range, and decision checks"
    },
    {
      id: "work-order",
      label: "Work order",
      href: workOrderHref,
      purpose: "Named buyer request, success metric, owners, acceptance checks, and A2A delegation payload"
    },
    {
      id: "pilot-workflow",
      label: "Workflow",
      href: workflowHref,
      purpose: "First pilot run sequence, checkpoints, and handoff script"
    },
    {
      id: "pilot-receipt",
      label: "Receipt",
      href: pilotReceiptHref,
      purpose: "Measured first-run evidence, acceptance, and proof URL"
    },
    {
      id: "sponsor-review",
      label: "Review",
      href: sponsorReviewHref,
      purpose: "Sponsor-facing question room with answers, evidence, owners, and the approval ask"
    },
    {
      id: "proof-packet",
      label: "Packet",
      href: proofPacketHref,
      purpose: "Single buyer-facing proof packet that bundles ROI, measured proof, procurement choice, agreement boundary, and sponsor Q&A"
    },
    {
      id: "decision-matrix",
      label: "Decision",
      href: decisionHref,
      purpose: "Procurement comparison against manual work, generic AI, and an internal build"
    },
    {
      id: "pilot-agreement",
      label: "Agreement",
      href: agreementHref,
      purpose: "Non-binding pilot SOW draft with terms, stop rules, and signature conditions"
    },
    {
      id: "evidence-ledger",
      label: "Ledger",
      href: ledgerHref,
      purpose: "One sponsor-readable audit trail across proposal, workflow, receipt, decision, agreement, and execution"
    },
    {
      id: "adoption-plan",
      label: "Adoption",
      href: adoptionPlanHref,
      purpose: "30-day operating cadence, health metrics, interventions, and expansion criteria"
    },
    {
      id: "trust-center",
      label: "Trust",
      href: trustCenterHref,
      purpose: "Data boundary, security owner, public product proof, agent proof, audit trail, and stop rules"
    },
    {
      id: "commercial-offer",
      label: "Offer",
      href: commercialOfferHref,
      purpose: "Proof-backed price, scope, guardrails, objections, and renewal criteria"
    },
    {
      id: "diligence-room",
      label: "Diligence",
      href: diligenceHref,
      purpose: "Approval questions and risks"
    },
    {
      id: "execution-handoff",
      label: "Execution",
      href: executionHref,
      purpose: "Owners, gates, and stop rules"
    }
  ];
  const completedSteps = steps.filter((step) => step.status === "complete").length;
  const focusSteps = focusStepsFor(steps);
  const journeyScore = Math.round(
    clamp(
      average([
        ...steps.map((step) => statusScore(step.status)),
        workOrder.workOrderScore,
        room.diligenceScore,
        sponsorReview.reviewScore,
        proofPacket.packetScore,
        adoptionPlan.planScore,
        trustCenter.trustScore,
        commercialOffer.offerScore,
        handoff.executionScore
      ])
    )
  );
  const readiness: BuyerJourneyReadiness =
    room.readiness === "blocked" || sponsorReview.readiness === "blocked" || input.buyerScenario.readiness === "not-yet"
      ? "blocked"
      : steps.some((step) => step.status === "blocked" || step.status === "attention")
        ? "needs-evidence"
        : "ready-for-sponsor";

  return {
    id: `buyer-journey-${journeyScore}-${readiness}`,
    readiness,
    journeyScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness),
    nextAction: nextActionFor({ steps, artifacts }),
    focusSteps,
    steps,
    artifacts,
    completedSteps,
    totalSteps: steps.length,
    remainingStepCount: steps.length - completedSteps
  };
}
