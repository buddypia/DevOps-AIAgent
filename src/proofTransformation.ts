import { recommendSquad } from "./agentEngine.js";
import { buildBuyerOutcomeBrief, type BuyerOutcomeBriefDecision, type BuyerOutcomeBriefRedLine, type BuyerOutcomeBriefStatus } from "./buyerOutcomeBrief.js";
import { buildBuyerValueScenario } from "./buyerValueScenario.js";
import { mergeAgentCatalog } from "./customAgent.js";
import { buildLaunchRoom } from "./launchRoom.js";
import { buildProofBackedSampleWorkspaceDraft } from "./sampleWorkspace.js";
import { buildValueBlueprint } from "./valueBlueprint.js";
import type { WorkspaceDraft } from "./workspaceDraft.js";

export type ProofTransformationStage = {
  id: "current" | "sample";
  label: string;
  decision: BuyerOutcomeBriefDecision;
  status: BuyerOutcomeBriefStatus;
  score: number;
  targetBuyer: string;
  monthlyValue: string;
  measuredOutcome: string;
  proofClosure: string;
  acceptedTrials: string;
  blockerCount: number;
  summary: string;
};

export type ProofTransformationDelta = {
  id: string;
  label: string;
  before: string;
  after: string;
  proof: string;
  status: BuyerOutcomeBriefStatus;
};

export type ProofTransformationStep = {
  id: string;
  label: string;
  status: BuyerOutcomeBriefStatus;
  action: string;
  proof: string;
};

export type ProofTransformationGeneratedArtifact = {
  id: "promise-gate" | "repair-plan" | "receipt-trail";
  label: string;
  status: BuyerOutcomeBriefStatus;
  output: string;
  evidence: string;
  action: string;
};

export type ProofTransformationRepairItem = {
  id: string;
  label: string;
  status: BuyerOutcomeBriefStatus;
  owner: string;
  action: string;
  proof: string;
  href: string;
};

export type ProofTransformationCurrentDiagnosis = {
  status: BuyerOutcomeBriefStatus;
  headline: string;
  score: number;
  proofClosure: string;
  readyCount: number;
  watchCount: number;
  blockedCount: number;
  openCount: number;
  primaryAction: string;
  items: ProofTransformationRepairItem[];
};

export type ProofTransformation = {
  id: string;
  headline: string;
  hardTruth: string;
  before: ProofTransformationStage;
  after: ProofTransformationStage;
  current: ProofTransformationCurrentDiagnosis;
  deltas: ProofTransformationDelta[];
  generatedArtifacts: ProofTransformationGeneratedArtifact[];
  runway: ProofTransformationStep[];
};

function buildBriefForWorkspace(workspace: WorkspaceDraft, baseUrl: string, appUrl: string) {
  const recommendation = recommendSquad(workspace.projectBrief, workspace.selectedAgentIds, 260, mergeAgentCatalog(workspace.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, workspace.projectBrief, baseUrl);
  const buyerScenario = buildBuyerValueScenario(recommendation, workspace.buyerScenario);
  const launchRoom = buildLaunchRoom({ workspace, baseUrl, appUrl });
  const brief = buildBuyerOutcomeBrief({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace,
    pilotRun: workspace.pilotRun,
    launchRoom,
    generatedAt: workspace.updatedAt
  });

  return {
    recommendation,
    valueBlueprint,
    buyerScenario,
    launchRoom,
    brief
  };
}

function stageFor(input: ReturnType<typeof buildBriefForWorkspace>, workspace: WorkspaceDraft, id: ProofTransformationStage["id"], label: string): ProofTransformationStage {
  const acceptedTrialCount = workspace.agentTrialEvidence.filter((record) => record.status === "accepted").length;
  const proofClosure = input.launchRoom.proofHealth.checkedAt
    ? `${input.launchRoom.proofHealth.verifiedCount}/${input.launchRoom.proofHealth.totalCount}`
    : input.launchRoom.proofHealth.verifiedCount > 0
      ? `${input.launchRoom.proofHealth.verifiedCount}/${input.launchRoom.proofHealth.totalCount} attached`
      : "live check required";
  return {
    id,
    label,
    decision: input.brief.decision,
    status: input.brief.status,
    score: input.brief.briefScore,
    targetBuyer: input.brief.targetBuyer,
    monthlyValue: input.brief.primaryMetric,
    measuredOutcome: input.brief.measuredOutcome,
    proofClosure,
    acceptedTrials: `${acceptedTrialCount} accepted`,
    blockerCount: input.brief.redLines.filter((line) => line.status === "block").length,
    summary: input.brief.hardTruth
  };
}

function deltaStatus(before: string, after: string) {
  if (before === after) return "watch";
  return "pass";
}

function statusFromLaunch(status: "ready" | "attention" | "blocked"): BuyerOutcomeBriefStatus {
  if (status === "ready") return "pass";
  if (status === "attention") return "watch";
  return "block";
}

function buyerFacingText(value: string) {
  return value
    .replace(/\bSubmission proof\b/g, "Public proof")
    .replace(/\bsubmission proof\b/gi, "public proof")
    .replace(/\bfinal submission URLs\b/gi, "buyer-owned proof URLs")
    .replace(/\bfinal-submission\b/gi, "external review")
    .replace(/\bsubmission story\b/gi, "public story")
    .replace(/\bsubmission URLs\b/gi, "external proof URLs")
    .replace(/\bProtoPedia page\b/g, "public story page")
    .replace(/\bProtoPedia work page\b/g, "public story page")
    .replace(/\bProtoPedia work URL\b/g, "public story URL")
    .replace(/\bProtoPedia URL\b/g, "public story URL")
    .replace(/\bProtoPedia story\b/g, "public story")
    .replace(/\bProtoPedia\b/g, "public story")
    .replace(/\bdemo video\b/gi, "walkthrough video")
    .replace(/\bdemo\b/gi, "walkthrough");
}

function redLineRepairItem(line: BuyerOutcomeBriefRedLine): ProofTransformationRepairItem {
  return {
    id: line.id,
    label: buyerFacingText(line.label),
    status: line.status,
    owner: buyerFacingText(line.owner),
    action: buyerFacingText(line.action),
    proof: "Blocks external buyer review until repaired.",
    href: line.href
  };
}

function buildCurrentDiagnosis(input: ReturnType<typeof buildBriefForWorkspace>): ProofTransformationCurrentDiagnosis {
  const redLineItems = input.brief.redLines.map(redLineRepairItem);
  const liveProofStatus = statusFromLaunch(input.launchRoom.proofHealth.status);
  const hasLiveProofRedLine = redLineItems.some((item) => item.href.includes("proof") || item.label.toLowerCase().includes("proof"));
  const liveProofItem: ProofTransformationRepairItem | null =
    liveProofStatus === "pass" || hasLiveProofRedLine
      ? null
      : {
          id: "live-proof-health",
          label: "Live proof health",
          status: liveProofStatus,
          owner: "Proof owner",
          action: input.launchRoom.proofHealth.instruction,
          proof: input.launchRoom.proofHealth.summary,
          href: input.launchRoom.artifacts.find((artifact) => artifact.id === "live-proof-audit")?.href ?? "/buyer-proof-audit"
        };
  const openItems = [...redLineItems, ...(liveProofItem ? [liveProofItem] : [])].sort((left, right) => (left.status === right.status ? 0 : left.status === "block" ? -1 : 1));
  const readyItems: ProofTransformationRepairItem[] = [
    {
      id: "buyer-value-ready",
      label: "Buyer value",
      status: input.brief.metrics.find((metric) => metric.id === "modeled-value")?.status ?? "watch",
      owner: input.brief.targetBuyer,
      action: input.brief.valueNarrative,
      proof: input.brief.primaryMetric,
      href: input.launchRoom.artifacts.find((artifact) => artifact.id === "buyer-value")?.href ?? "/buyer-value"
    },
    {
      id: "measured-run-ready",
      label: "Measured run",
      status: input.brief.metrics.find((metric) => metric.id === "measured-value")?.status ?? "watch",
      owner: input.launchRoom.artifacts.find((artifact) => artifact.id === "pilot-run-receipt")?.owner ?? "Pilot reviewer",
      action: input.brief.measuredOutcome,
      proof: input.brief.metrics.find((metric) => metric.id === "measured-value")?.evidence ?? "Measured run is not attached yet.",
      href: input.launchRoom.artifacts.find((artifact) => artifact.id === "pilot-run-receipt")?.href ?? "/pilot-run-receipt"
    },
    {
      id: "buyer-decision-ready",
      label: "Buyer decision",
      status: statusFromLaunch(input.launchRoom.buyerDecision.status),
      owner: "Sponsor owner",
      action: input.launchRoom.buyerDecision.instruction,
      proof: input.launchRoom.buyerDecision.buyerQuestion,
      href: input.launchRoom.nextAction.href
    }
  ];
  const items = (openItems.length > 0 ? openItems : readyItems).slice(0, 4);
  const blockedCount = openItems.filter((item) => item.status === "block").length;
  const watchCount = openItems.filter((item) => item.status === "watch").length;
  const openCount = blockedCount + watchCount;
  const readyCount = Math.max(0, input.launchRoom.artifacts.filter((artifact) => artifact.status === "ready" && artifact.id !== "workspace").length);
  const status = openCount === 0 ? input.brief.status : blockedCount > 0 ? "block" : "watch";
  const firstOpen = openItems[0];

  return {
    status,
    headline: openCount === 0 ? "Current workspace is buyer-verifiable" : `${openCount} current repair item${openCount === 1 ? "" : "s"} before buyer sharing`,
    score: input.brief.briefScore,
    proofClosure: input.launchRoom.proofHealth.checkedAt ? `${input.launchRoom.proofHealth.verifiedCount}/${input.launchRoom.proofHealth.totalCount}` : "not checked",
    readyCount,
    watchCount,
    blockedCount,
    openCount,
    primaryAction: firstOpen ? `${firstOpen.label}: ${firstOpen.action}` : input.brief.decisionAsk,
    items
  };
}

export function buildProofTransformation(input: { current: WorkspaceDraft; sample?: WorkspaceDraft; baseUrl?: string; appUrl?: string }): ProofTransformation {
  const baseUrl = (input.baseUrl || "https://sample.example").replace(/\/$/, "");
  const appUrl = input.appUrl || `${baseUrl}/?workspace=share-token`;
  const sample = input.sample ?? buildProofBackedSampleWorkspaceDraft(input.current.updatedAt, baseUrl);
  const currentBrief = buildBriefForWorkspace(input.current, baseUrl, appUrl);
  const sampleBrief = buildBriefForWorkspace(sample, baseUrl, appUrl);
  const before = stageFor(currentBrief, input.current, "current", "Current workspace");
  const after = stageFor(sampleBrief, sample, "sample", "Buyer proof target");
  const current = buildCurrentDiagnosis(currentBrief);
  const acceptedTrialCount = sample.agentTrialEvidence.filter((record) => record.status === "accepted").length;
  const publicProofDelta = after.proofClosure === "live check required" ? "live check required" : `${after.proofClosure} proof links`;
  const publicProofDeltaProof =
    after.proofClosure === "live check required"
      ? "The proof template shows the required evidence shape; attach buyer-owned final URLs and run live verification before sharing."
      : after.proofClosure.startsWith("5/")
        ? "Deployment, public story, walkthrough, pilot receipt, and work order proof are attached as one buyer-inspectable chain."
        : `${after.proofClosure} proof links are attached; close buyer-owned proof URLs and live verification before external sharing.`;
  const deltas: ProofTransformationDelta[] = [
    {
      id: "buyer-value",
      label: "Buyer value",
      before: before.monthlyValue,
      after: after.monthlyValue,
      proof: `${sampleBrief.buyerScenario.monthlyHoursSaved}h/month modeled from the sample release-readiness workflow.`,
      status: deltaStatus(before.monthlyValue, after.monthlyValue)
    },
    {
      id: "measured-run",
      label: "Measured run",
      before: before.measuredOutcome,
      after: after.measuredOutcome,
      proof: `${sample.pilotRun.observedManualMinutes - sample.pilotRun.observedAssistedMinutes} minutes saved in the reference measured receipt.`,
      status: deltaStatus(before.measuredOutcome, after.measuredOutcome)
    },
    {
      id: "public-proof",
      label: "Public proof",
      before: before.proofClosure,
      after: publicProofDelta,
      proof: publicProofDeltaProof,
      status: after.proofClosure.startsWith("0/") || after.proofClosure === "live check required" ? "block" : after.proofClosure.startsWith("5/") ? "pass" : "watch"
    },
    {
      id: "a2a-trials",
      label: "A2A trials",
      before: before.acceptedTrials,
      after: `${acceptedTrialCount} accepted`,
      proof: "The proof template includes accepted trial receipts for Cloud Run SRE and Security Sentinel.",
      status: acceptedTrialCount > 0 ? "pass" : "block"
    }
  ];
  const runway: ProofTransformationStep[] = [
    {
      id: "load-sample",
      label: "Apply proof template",
      status: "pass",
      action: "Use the proof template to see the contract shape, then replace reference artifacts with buyer-owned proof.",
      proof: `${acceptedTrialCount} accepted A2A trial receipts are included as reference evidence.`
    },
    {
      id: "inspect-brief",
      label: "Inspect buyer brief",
      status: after.status,
      action: "Open the generated buyer brief and read the value claim, proof trail, and red lines.",
      proof: `${after.score}/100 buyer brief score.`
    },
    {
      id: "inspect-send-note",
      label: "Inspect send note",
      status: after.decision === "send-to-buyer" ? "pass" : after.status,
      action:
        after.decision === "send-to-buyer"
          ? "Open the buyer contract and inspect the send note, proof attachments, price, and stop rule."
          : "Review the open proof item before using the send note externally.",
      proof: `${after.blockerCount} blocking red line${after.blockerCount === 1 ? "" : "s"} in the target brief.`
    },
    {
      id: "share-room",
      label: "Share launch room",
      status: after.decision === "send-to-buyer" ? "pass" : after.decision === "sponsor-review" ? "watch" : "block",
      action: after.decision === "send-to-buyer" ? "Send the buyer room." : "Use the room as a sponsor repair brief until final proof closes.",
      proof: sampleBrief.launchRoom.buyerDecision.instruction
    }
  ];
  const closedProofCount = sample.proofVerification?.results.filter((result) => result.status === "pass").length ?? 0;
  const totalProofCount = sample.proofVerification?.results.length ?? 0;
  const generatedArtifacts: ProofTransformationGeneratedArtifact[] = [
    {
      id: "promise-gate",
      label: "Promise gate",
      status: after.status,
      output:
        after.status === "pass"
          ? `${after.monthlyValue} public-safe promise with ${after.measuredOutcome}.`
          : `Internal promise draft; ${after.blockerCount} blocker${after.blockerCount === 1 ? "" : "s"} still limit public use.`,
      evidence: after.summary,
      action: "Paste one workflow to generate the public-safe promise, proof-backed claim list, and do-not-claim guardrails."
    },
    {
      id: "repair-plan",
      label: "Proof repair plan",
      status: current.status,
      output:
        current.openCount === 0
          ? "No current repair items before buyer inspection."
          : `${current.openCount} current repair item${current.openCount === 1 ? "" : "s"} named before send.`,
      evidence: current.primaryAction,
      action: current.openCount === 0 ? "Keep proof fresh and open the buyer room." : "Close the first repair item or load the proof template to see the target shape."
    },
    {
      id: "receipt-trail",
      label: "Receipt trail",
      status: totalProofCount > 0 && closedProofCount === totalProofCount && acceptedTrialCount > 0 ? "pass" : totalProofCount > 0 || acceptedTrialCount > 0 ? "watch" : "block",
      output:
        totalProofCount > 0
          ? `${closedProofCount}/${totalProofCount} live proof checks plus ${acceptedTrialCount} accepted A2A receipt${acceptedTrialCount === 1 ? "" : "s"}.`
          : `${acceptedTrialCount} accepted A2A receipt${acceptedTrialCount === 1 ? "" : "s"}; live proof check still required.`,
      evidence: sampleBrief.launchRoom.buyerDecision.instruction,
      action: "Use the receipt verifier before sharing the generated buyer room externally."
    }
  ];

  return {
    id: `proof-transformation-${before.score}-${after.score}-${closedProofCount}-${current.openCount}`,
    headline: "Turn one workflow into buyer proof",
    hardTruth:
      current.openCount === 0
        ? `The current workspace is ready for inspection: ${current.proofClosure} public proof links are sealed, the buyer decision is visible, and the contract can be reviewed before sending.`
        : `The current workspace still has ${current.blockedCount} block and ${current.watchCount} watch item${current.openCount === 1 ? "" : "s"}; close those gaps with buyer-owned proof before treating the room as sendable.`,
    before,
    after,
    current,
    deltas,
    generatedArtifacts,
    runway
  };
}
