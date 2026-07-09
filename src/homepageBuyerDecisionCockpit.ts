import type { BuyerShareGateCheckStatus, BuyerShareGateProofVerificationSummary, BuyerShareGateSendPacketMode } from "./buyerShareGate";
import { normalizeBuyerValueScenarioInput } from "./buyerValueScenario";
import { normalizeBuyerWorkOrderInput } from "./buyerWorkOrder";
import {
  HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION,
  homepageOutcomeArtifactCanonicalJson,
  homepageOutcomeArtifactReceiptChecksum
} from "./homepageOutcomeArtifactReceipt";
import type { HomepageRouteLock } from "./homepageRouteLock";
import { normalizePilotRunReceiptInput } from "./pilotRunReceipt";
import { isBuyerFacingProofUrl } from "./publicProofUrl";
import { QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH } from "./quickWorkflowConversionReceipt";
import { QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION, quickBuyerEvidencePackShareHref } from "./quickExternalReviewPacketShare.js";
import type { QuickBuyerEvidencePackBuyerQuestion, QuickBuyerEvidencePackShareArtifact, QuickBuyerEvidencePackSharePayload, QuickBuyerRoomPreviewStatus } from "./quickBuyerEvidenceShare";
import { summarizeAgentTrialEvidence } from "./agentTrialEvidence";
import type { WorkspaceDraft } from "./workspaceDraft";

type HomepageDecisionStatus = HomepageRouteLock["status"];

type HomepageBuyerDecisionCockpitInput = {
  buyer: string;
  workflow: string;
  routeStatus: HomepageDecisionStatus;
  routeHeadline: string;
  routeOperatorLine: string;
  launchEvidenceHref: string;
  launchRoomHref: string;
  buyerEvidenceBoardHref: string;
  buyerProofRoomHref: string;
  valueClaim: string;
  decisionAsk: string;
  sourceReceipt: {
    receiptId: string;
    checksumAlgorithm: string;
    checksum: string;
    verificationRequestJson: string;
  };
  proofEntry: {
    status: HomepageDecisionStatus;
    proofScore: number;
    readyCount: number;
    itemCount: number;
    headline: string;
  };
  packet: {
    status: HomepageDecisionStatus;
    readyCount: number;
    itemCount: number;
  };
  shareGate: {
    mode: BuyerShareGateSendPacketMode;
    score: number;
    decision: string;
    primaryActionLabel: string;
    primaryActionHref: string;
    checks: Array<{
      id: string;
      label: string;
      status: BuyerShareGateCheckStatus;
      score: number;
      evidence: string;
      action: string;
      href: string;
    }>;
  };
  proofVerification: BuyerShareGateProofVerificationSummary | null;
};

export type HomepageBuyerDecisionCockpit = {
  status: QuickBuyerRoomPreviewStatus;
  readyRequiredCount: number;
  requiredCount: number;
  firstOpenArtifact: QuickBuyerEvidencePackShareArtifact | null;
  payload: QuickBuyerEvidencePackSharePayload;
  payloadJson: string;
  shareHref: string;
};

export type HomepageBuyerDecisionCockpitHrefSet = {
  launchEvidenceHref: string;
  launchRoomHref: string;
  buyerEvidenceBoardHref: string;
  buyerProofRoomHref: string;
};

type WorkspaceReceiptItem = {
  id: string;
  label: string;
  status: HomepageDecisionStatus;
  evidence: string;
  href: string;
};

const FALLBACK_BUYER = "Platform / DevOps Lead";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function roundYen(value: number) {
  return Math.round(value / 1000) * 1000;
}

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function firstLine(value: string, fallback: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
    ?.slice(0, 180) ?? fallback;
}

function statusScore(status: BuyerShareGateCheckStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 66;
  return 22;
}

function routeStatusFromQuick(status: QuickBuyerRoomPreviewStatus): HomepageDecisionStatus {
  if (status === "ready") return "ready";
  if (status === "watch") return "attention";
  return "blocked";
}

function checkStatusFromRoute(status: HomepageDecisionStatus): BuyerShareGateCheckStatus {
  if (status === "ready") return "pass";
  if (status === "attention") return "watch";
  return "block";
}

function routeStatusFromBoolean(isReady: boolean, isPartial = false): HomepageDecisionStatus {
  if (isReady) return "ready";
  if (isPartial) return "attention";
  return "blocked";
}

function proofStatusFromSummary(proofVerification: BuyerShareGateProofVerificationSummary | null): QuickBuyerRoomPreviewStatus {
  if (!proofVerification || proofVerification.totalCount === 0) return "blocked";
  if (proofVerification.verifiedCount === proofVerification.totalCount) return "ready";
  return proofVerification.verifiedCount > 0 ? "watch" : "blocked";
}

function worstRouteStatus(statuses: HomepageDecisionStatus[]): HomepageDecisionStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function proofLinksFromWorkspace(workspace: WorkspaceDraft) {
  const pilotRun = normalizePilotRunReceiptInput(workspace.pilotRun);
  const workOrder = normalizeBuyerWorkOrderInput(workspace.buyerWorkOrder);
  return [
    { id: "target-url", label: "Deployed URL", href: workspace.targetUrl },
    { id: "protopedia-url", label: "ProtoPedia story", href: workspace.protopediaUrl },
    { id: "video-url", label: "Walkthrough video", href: workspace.videoUrl },
    { id: "pilot-evidence", label: "Pilot receipt", href: pilotRun.evidenceUrl },
    { id: "work-order-evidence", label: "Work-order proof", href: workOrder.evidenceUrl }
  ];
}

function synthesizedProofVerification(workspace: WorkspaceDraft): BuyerShareGateProofVerificationSummary | null {
  if (workspace.proofVerification) return workspace.proofVerification;
  const proofLinks = proofLinksFromWorkspace(workspace);
  const attachedCount = proofLinks.filter((link) => link.href.trim()).length;
  if (attachedCount === 0) return null;
  const checkedAt = workspace.updatedAt || new Date().toISOString();
  const results = proofLinks.map((link) => {
    const publicUrl = isBuyerFacingProofUrl(link.href);
    return {
      id: link.id,
      label: link.label,
      status: publicUrl ? ("watch" as const) : ("block" as const),
      evidence: publicUrl ? `${link.label} is attached, but needs a fresh live reachability check.` : `${link.label} is missing or not public HTTPS proof.`,
      action: publicUrl ? "Run live proof verification before buyer send." : `Attach a public HTTPS URL for ${link.label}.`
    };
  });

  return {
    checkedAt,
    verifiedCount: 0,
    totalCount: results.length,
    score: Math.round(average(results.map((result) => statusScore(result.status)))),
    results
  };
}

function measuredValueClaim(workspace: WorkspaceDraft) {
  const scenario = normalizeBuyerValueScenarioInput(workspace.buyerScenario);
  const pilotRun = normalizePilotRunReceiptInput(workspace.pilotRun);
  const savedMinutes = Math.max(0, pilotRun.observedManualMinutes - pilotRun.observedAssistedMinutes);
  const acceptanceRate = pilotRun.acceptedTasks / Math.max(1, pilotRun.totalTasks);
  const measuredMonthlyHours = round1((savedMinutes / 60) * scenario.cyclesPerMonth * (scenario.adoptionRatePercent / 100));
  const measuredMonthlyValue = roundYen(measuredMonthlyHours * scenario.hourlyCostYen + scenario.incidentRiskYenPerMonth * acceptanceRate * 0.3);
  const expectedMonthlyHours = round1(scenario.manualHoursPerCycle * 0.5 * scenario.cyclesPerMonth * (scenario.adoptionRatePercent / 100));
  const expectedMonthlyValue = roundYen(expectedMonthlyHours * scenario.hourlyCostYen + scenario.incidentRiskYenPerMonth * 0.35 * (scenario.adoptionRatePercent / 100));
  const value = measuredMonthlyValue > 0 ? measuredMonthlyValue : expectedMonthlyValue;
  const hours = measuredMonthlyHours > 0 ? measuredMonthlyHours : expectedMonthlyHours;
  const basis = measuredMonthlyValue > 0 ? "measured pilot value" : "workspace value estimate";

  return `${yen(value)}/month ${basis} from ${hours}h saved across ${scenario.cyclesPerMonth} cycles.`;
}

function workspaceReceipt(input: {
  buyer: string;
  decision: "continue" | "revise" | "stop";
  status: HomepageDecisionStatus;
  readyCount: number;
  itemCount: number;
  items: WorkspaceReceiptItem[];
}) {
  const payload = {
    receiptVersion: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION,
    source: "workspace-buyer-decision-cockpit",
    buyer: input.buyer,
    decision: input.decision,
    status: input.status,
    readyCount: input.readyCount,
    itemCount: input.itemCount,
    items: input.items.map((item) => ({
      id: item.id,
      label: item.label,
      status: item.status,
      evidence: item.evidence,
      href: item.href
    }))
  };
  const checksum = homepageOutcomeArtifactReceiptChecksum(payload);

  return {
    receiptId: `workspace-decision-${input.status}-${checksum}`,
    checksumAlgorithm: "fnv1a32",
    checksum,
    verificationRequestJson: homepageOutcomeArtifactCanonicalJson({ checksum, payload })
  };
}

function routeStatusToQuick(status: HomepageDecisionStatus): QuickBuyerRoomPreviewStatus {
  if (status === "ready") return "ready";
  if (status === "attention") return "watch";
  return "blocked";
}

function shareGateModeToQuick(mode: BuyerShareGateSendPacketMode): QuickBuyerRoomPreviewStatus {
  if (mode === "send") return "ready";
  if (mode === "review") return "watch";
  return "blocked";
}

function shareGateCheckToQuick(status: BuyerShareGateCheckStatus): QuickBuyerRoomPreviewStatus {
  if (status === "pass") return "ready";
  if (status === "watch") return "watch";
  return "blocked";
}

function proofVerificationToQuick(proofVerification: BuyerShareGateProofVerificationSummary | null): QuickBuyerRoomPreviewStatus {
  if (!proofVerification || proofVerification.totalCount === 0) return "blocked";
  if (proofVerification.verifiedCount === proofVerification.totalCount) return "ready";
  return proofVerification.verifiedCount > 0 ? "watch" : "blocked";
}

function receiptVerifierHref(verificationRequestJson: string) {
  const params = new URLSearchParams({ request: verificationRequestJson, verify: "1" });
  return `/receipt-verifier?${params.toString()}`;
}

function statusFromRequiredArtifacts(artifacts: QuickBuyerEvidencePackShareArtifact[], shareGateMode: BuyerShareGateSendPacketMode): QuickBuyerRoomPreviewStatus {
  const required = artifacts.filter((artifact) => artifact.requiredForSend);
  const readyCount = required.filter((artifact) => artifact.status === "ready").length;
  if (readyCount === required.length && shareGateMode === "send") return "ready";
  return readyCount > 0 ? "watch" : "blocked";
}

function firstOpenRequiredArtifact(artifacts: QuickBuyerEvidencePackShareArtifact[]) {
  return artifacts.find((artifact) => artifact.id === "proof-repair" && artifact.requiredForSend && artifact.status !== "ready") ?? artifacts.find((artifact) => artifact.requiredForSend && artifact.status !== "ready") ?? null;
}

export function buildHomepageBuyerDecisionCockpit(input: HomepageBuyerDecisionCockpitInput): HomepageBuyerDecisionCockpit {
  const routeStatus = routeStatusToQuick(input.routeStatus);
  const proofEntryStatus = routeStatusToQuick(input.proofEntry.status);
  const packetStatus = routeStatusToQuick(input.packet.status);
  const proofStatus = proofVerificationToQuick(input.proofVerification);
  const shareGateStatus = shareGateModeToQuick(input.shareGate.mode);
  const firstShareGateBlocker = input.shareGate.checks.find((check) => check.status !== "pass");
  const verifierHref = receiptVerifierHref(input.sourceReceipt.verificationRequestJson);
  const sourceChecksum = `${input.sourceReceipt.checksumAlgorithm}:${input.sourceReceipt.checksum}`;

  const artifacts: QuickBuyerEvidencePackShareArtifact[] = [
    {
      id: "decision-case",
      label: "Buyer decision case",
      status: routeStatus,
      href: input.launchRoomHref,
      role: "Buyer reviewer",
      proof: `${input.decisionAsk} ${input.routeHeadline}. ${input.routeOperatorLine}`,
      requiredForSend: true
    },
    {
      id: "send-memo",
      label: "Buyer send memo",
      status: shareGateStatus,
      href: input.shareGate.primaryActionHref,
      role: "Sponsor owner",
      proof: `${input.shareGate.score}/100 share gate. ${input.shareGate.decision}`,
      requiredForSend: true
    },
    {
      id: "claim-ledger",
      label: "Claim-proof ledger",
      status: proofEntryStatus,
      href: input.launchEvidenceHref,
      role: "Proof owner",
      proof: `${input.proofEntry.readyCount}/${input.proofEntry.itemCount} proof rails ready at ${input.proofEntry.proofScore}/100. ${input.proofEntry.headline}`,
      requiredForSend: true
    },
    {
      id: "proof-repair",
      label: "Public proof links",
      status: proofStatus,
      href: input.launchEvidenceHref,
      role: "Proof owner",
      proof: input.proofVerification
        ? `${input.proofVerification.verifiedCount}/${input.proofVerification.totalCount} public proof links verified live. ${firstShareGateBlocker?.action ?? "Keep verified proof attached."}`
        : "Run live proof verification before buyer send.",
      requiredForSend: true
    },
    {
      id: "redaction",
      label: "Public-safe evidence board",
      status: packetStatus,
      href: input.buyerEvidenceBoardHref,
      role: "Launch owner",
      proof: `${input.packet.readyCount}/${input.packet.itemCount} packet artifacts ready for scope, value, proof, trust, and decision review.`,
      requiredForSend: true
    },
    {
      id: "conversion-receipt",
      label: "Outcome receipt verifier",
      status: input.sourceReceipt.checksumAlgorithm === "fnv1a32" && /^[a-f0-9]{8}$/i.test(input.sourceReceipt.checksum) ? "ready" : "blocked",
      href: verifierHref,
      role: "Reviewer",
      proof: `${input.sourceReceipt.receiptId} / ${sourceChecksum}`,
      requiredForSend: true
    },
    {
      id: "pilot-week",
      label: "Proof room",
      status: routeStatus,
      href: input.buyerProofRoomHref,
      role: "Pilot owner",
      proof: input.valueClaim,
      requiredForSend: false
    },
    {
      id: "decision-close",
      label: "Decision board closeout",
      status: shareGateCheckToQuick(firstShareGateBlocker?.status ?? "pass"),
      href: input.buyerEvidenceBoardHref,
      role: "Decision owner",
      proof: firstShareGateBlocker ? `${firstShareGateBlocker.label}: ${firstShareGateBlocker.action}` : "All gate checks are ready for buyer review.",
      requiredForSend: false
    }
  ];

  const status = statusFromRequiredArtifacts(artifacts, input.shareGate.mode);
  const firstOpenArtifact = firstOpenRequiredArtifact(artifacts);
  const readyRequiredCount = artifacts.filter((artifact) => artifact.requiredForSend && artifact.status === "ready").length;
  const requiredCount = artifacts.filter((artifact) => artifact.requiredForSend).length;
  const headline =
    status === "ready"
      ? `${input.buyer} can inspect a receipt-backed decision cockpit`
      : status === "watch"
        ? `Repair ${firstOpenArtifact?.label ?? "open evidence"} before buyer send`
        : `Keep ${input.buyer} evidence internal until proof is defensible`;
  const summary =
    status === "ready"
      ? "The buyer can see the decision case, proof ledger, public evidence board, and receipt verifier in one shareable cockpit."
      : `${readyRequiredCount}/${requiredCount} required artifacts are ready. The cockpit names the next repair and preserves the receipt verifier for review.`;
  const sendRule =
    status === "ready"
      ? "Send only with the receipt verifier attached and keep the launch evidence report available during the buyer meeting."
      : `Do not send externally until ${firstOpenArtifact?.label ?? "the open evidence item"} is ready and the receipt verifier remains attached.`;
  const firstAction = firstOpenArtifact
    ? { label: `Fix ${firstOpenArtifact.label}`, href: firstOpenArtifact.href }
    : { label: "Open receipt verifier", href: verifierHref };
  const sourceReceiptStatus: QuickBuyerRoomPreviewStatus = input.sourceReceipt.checksumAlgorithm === "fnv1a32" && /^[a-f0-9]{8}$/i.test(input.sourceReceipt.checksum) ? "ready" : "blocked";
  const buyerQuestions: QuickBuyerEvidencePackBuyerQuestion[] = [
    {
      id: "decision",
      label: "Decision",
      status: routeStatus,
      owner: "Buyer reviewer",
      question: input.decisionAsk,
      answer:
        routeStatus === "ready"
          ? `Yes. ${input.routeHeadline} ${input.routeOperatorLine}`
          : `Not yet. ${firstOpenArtifact?.label ?? "The first buyer blocker"} must be repaired before this can be sent.`,
      evidence: `${input.routeHeadline}. ${input.routeOperatorLine}`,
      action: routeStatus === "ready" ? "Record buyer response with the receipt verifier attached." : firstAction.label,
      href: routeStatus === "ready" ? verifierHref : firstAction.href
    },
    {
      id: "value",
      label: "Value",
      status: routeStatus,
      owner: "Pilot owner",
      question: "What value is being claimed?",
      answer: input.valueClaim,
      evidence: input.proofEntry.headline,
      action: routeStatus === "ready" ? "Use this value claim in the buyer decision memo." : "Keep value claims internal until proof and packet blockers are closed.",
      href: input.buyerProofRoomHref
    },
    {
      id: "proof",
      label: "Proof",
      status: proofStatus,
      owner: "Proof owner",
      question: "Can I verify the proof myself?",
      answer:
        proofStatus === "ready"
          ? `${input.proofVerification?.verifiedCount ?? 0}/${input.proofVerification?.totalCount ?? input.proofEntry.itemCount} public proof links verified live.`
          : "Not yet. Public proof links need live verification or replacement before buyer send.",
      evidence: input.proofVerification ? `Live proof score ${input.proofVerification.score}/100.` : "No live proof verification is attached.",
      action: proofStatus === "ready" ? "Keep the verification result attached to the cockpit." : "Run live proof verification and repair blocked URLs.",
      href: input.launchEvidenceHref
    },
    {
      id: "risk",
      label: "Open risk",
      status: firstOpenArtifact?.status ?? "ready",
      owner: firstOpenArtifact?.role ?? "Launch owner",
      question: "What still blocks an external send?",
      answer: firstOpenArtifact ? `${firstOpenArtifact.label}: ${firstOpenArtifact.proof}` : "No required artifact blocker remains.",
      evidence: `${readyRequiredCount}/${requiredCount} required artifacts ready.`,
      action: firstOpenArtifact ? firstAction.label : "Send with receipt verifier attached and proof window fresh.",
      href: firstOpenArtifact?.href ?? verifierHref
    },
    {
      id: "source-receipt",
      label: "Verifier",
      status: sourceReceiptStatus,
      owner: "Reviewer",
      question: "Can this decision be audited later?",
      answer: sourceReceiptStatus === "ready" ? `Yes. Source receipt ${input.sourceReceipt.receiptId} verifies as ${sourceChecksum}.` : "Not yet. The source receipt checksum is missing or malformed.",
      evidence: sourceChecksum,
      action: sourceReceiptStatus === "ready" ? "Keep the verifier link attached to every shared buyer response." : "Regenerate the cockpit with a valid source receipt.",
      href: verifierHref
    }
  ];

  const payload: QuickBuyerEvidencePackSharePayload = {
    version: QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION,
    buyer: input.buyer,
    workflow: input.workflow,
    status,
    label: status === "ready" ? "Homepage buyer decision cockpit" : "Homepage buyer repair cockpit",
    headline,
    summary,
    sendRule,
    verifierHref,
    verificationApiPath: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH,
    sourceReceiptId: input.sourceReceipt.receiptId,
    sourceChecksum,
    firstAction,
    buyerQuestions,
    artifacts
  };
  const payloadJson = JSON.stringify(payload, null, 2);

  return {
    status,
    readyRequiredCount,
    requiredCount,
    firstOpenArtifact,
    payload,
    payloadJson,
    shareHref: quickBuyerEvidencePackShareHref(payloadJson)
  };
}

export function buildHomepageBuyerDecisionCockpitFromWorkspace({
  workspace,
  hrefs
}: {
  workspace: WorkspaceDraft;
  hrefs: HomepageBuyerDecisionCockpitHrefSet;
}): HomepageBuyerDecisionCockpit {
  const workOrder = normalizeBuyerWorkOrderInput(workspace.buyerWorkOrder);
  const pilotRun = normalizePilotRunReceiptInput(workspace.pilotRun);
  const proofVerification = synthesizedProofVerification(workspace);
  const proofStatus = proofStatusFromSummary(proofVerification);
  const proofRouteStatus = routeStatusFromQuick(proofStatus);
  const buyer = workOrder.targetUser || FALLBACK_BUYER;
  const workflow = workOrder.request || firstLine(workspace.projectBrief, "Buyer proof workflow");
  const trialEvidence = summarizeAgentTrialEvidence(workspace.agentTrialEvidence);
  const acceptedTasks = pilotRun.acceptedTasks;
  const totalTasks = Math.max(1, pilotRun.totalTasks);
  const savedMinutes = Math.max(0, pilotRun.observedManualMinutes - pilotRun.observedAssistedMinutes);
  const pilotEvidenceReady = isBuyerFacingProofUrl(pilotRun.evidenceUrl);
  const measuredRunStatus = routeStatusFromBoolean(
    pilotEvidenceReady && savedMinutes > 0 && acceptedTasks === pilotRun.totalTasks,
    pilotEvidenceReady || savedMinutes > 0 || acceptedTasks > 0
  );
  const workOrderStatus = routeStatusFromBoolean(
    Boolean(workOrder.request && workOrder.targetUser && workOrder.successMetric && isBuyerFacingProofUrl(workOrder.evidenceUrl) && workOrder.dataSensitivity !== "restricted"),
    Boolean(workOrder.request && workOrder.targetUser && workOrder.successMetric)
  );
  const publicLaunchStatus = routeStatusFromBoolean(
    isBuyerFacingProofUrl(workspace.targetUrl) && isBuyerFacingProofUrl(workspace.protopediaUrl) && isBuyerFacingProofUrl(workspace.videoUrl),
    [workspace.targetUrl, workspace.protopediaUrl, workspace.videoUrl].some((url) => isBuyerFacingProofUrl(url))
  );
  const trialStatus = routeStatusFromBoolean(trialEvidence.status === "ready", trialEvidence.status === "watch");
  const routeStatus = worstRouteStatus([proofRouteStatus, measuredRunStatus, workOrderStatus, publicLaunchStatus, trialStatus]);
  const routeHeadline =
    routeStatus === "ready"
      ? "Send the buyer room now"
      : routeStatus === "attention"
        ? "Repair buyer proof before external send"
        : "Fix the first buyer blocker";
  const receiptItems: WorkspaceReceiptItem[] = [
    {
      id: "work-order",
      label: "Buyer work order",
      status: workOrderStatus,
      evidence: workOrderStatus === "ready" ? `${buyer} has a public work-order proof URL.` : "Buyer, success metric, sensitivity, or public work-order proof still needs closure.",
      href: hrefs.launchRoomHref
    },
    {
      id: "measured-run",
      label: "Measured pilot run",
      status: measuredRunStatus,
      evidence: `${savedMinutes}m saved/run; ${acceptedTasks}/${totalTasks} tasks accepted${pilotEvidenceReady ? " with public evidence." : ", public evidence missing."}`,
      href: hrefs.launchEvidenceHref
    },
    {
      id: "live-proof",
      label: "Live public proof",
      status: proofRouteStatus,
      evidence: proofVerification ? `${proofVerification.verifiedCount}/${proofVerification.totalCount} proof links verified from workspace evidence.` : "No live proof verification is attached.",
      href: hrefs.launchEvidenceHref
    },
    {
      id: "public-story",
      label: "Public story and walkthrough",
      status: publicLaunchStatus,
      evidence: publicLaunchStatus === "ready" ? "Deployment, ProtoPedia story, and walkthrough video are public HTTPS proof." : "Deployment, ProtoPedia story, or walkthrough video still needs public proof.",
      href: hrefs.buyerEvidenceBoardHref
    },
    {
      id: "a2a-trial-proof",
      label: "A2A trial proof",
      status: trialStatus,
      evidence: trialEvidence.evidence,
      href: hrefs.buyerProofRoomHref
    }
  ];
  const readyCount = receiptItems.filter((item) => item.status === "ready").length;
  const sourceReceipt = workspaceReceipt({
    buyer,
    decision: routeStatus === "ready" ? "continue" : routeStatus === "attention" ? "revise" : "stop",
    status: routeStatus,
    readyCount,
    itemCount: receiptItems.length,
    items: receiptItems
  });
  const checks = [
    {
      id: "launch-room" as const,
      label: "Launch room decision",
      status: checkStatusFromRoute(routeStatus),
      score: statusScore(checkStatusFromRoute(routeStatus)),
      evidence: routeStatus === "ready" ? "The workspace can be opened as a buyer decision room." : "The buyer room stays internal until the open blockers are closed.",
      action: routeStatus === "ready" ? "Open the buyer room with verifier attached." : "Repair the current blocker before sending the buyer room.",
      href: hrefs.launchRoomHref
    },
    {
      id: "public-proof" as const,
      label: "Live proof reachability",
      status: checkStatusFromRoute(proofRouteStatus),
      score: proofVerification?.score ?? statusScore(checkStatusFromRoute(proofRouteStatus)),
      evidence: proofVerification ? `${proofVerification.verifiedCount}/${proofVerification.totalCount} proof links verified.` : "Run live proof verification before buyer send.",
      action: proofRouteStatus === "ready" ? "Keep verified proof URLs attached." : "Repair or verify the public proof links.",
      href: hrefs.launchEvidenceHref
    },
    {
      id: "measured-run" as const,
      label: "Measured pilot receipt",
      status: checkStatusFromRoute(measuredRunStatus),
      score: statusScore(checkStatusFromRoute(measuredRunStatus)),
      evidence: `${savedMinutes}m saved/run, ${Math.round((acceptedTasks / totalTasks) * 100)}% accepted.`,
      action: measuredRunStatus === "ready" ? "Cite the measured run as buyer proof." : "Attach a stronger measured pilot receipt.",
      href: hrefs.launchEvidenceHref
    },
    {
      id: "artifact-closure" as const,
      label: "Artifact closure",
      status: checkStatusFromRoute(worstRouteStatus([workOrderStatus, publicLaunchStatus, trialStatus])),
      score: statusScore(checkStatusFromRoute(worstRouteStatus([workOrderStatus, publicLaunchStatus, trialStatus]))),
      evidence: `${readyCount}/${receiptItems.length} workspace decision artifacts are ready.`,
      action: readyCount === receiptItems.length ? "All artifact links are ready for external review." : "Close the open workspace artifacts before sending.",
      href: hrefs.buyerEvidenceBoardHref
    }
  ];
  const shareGateMode: BuyerShareGateSendPacketMode = checks.every((check) => check.status === "pass") ? "send" : checks.some((check) => check.status === "pass" || check.status === "watch") ? "review" : "hold";
  const firstOpenCheck = checks.find((check) => check.status !== "pass");
  const shareGateScore = Math.round(average(checks.map((check) => check.score)));

  return buildHomepageBuyerDecisionCockpit({
    buyer,
    workflow,
    routeStatus,
    routeHeadline,
    routeOperatorLine:
      routeStatus === "ready"
        ? `${buyer} can inspect live proof, measured value, A2A trial evidence, and the receipt verifier from one cockpit.`
        : `${firstOpenCheck?.label ?? "Open proof"} must be repaired before this buyer cockpit is sent externally.`,
    launchEvidenceHref: hrefs.launchEvidenceHref,
    launchRoomHref: hrefs.launchRoomHref,
    buyerEvidenceBoardHref: hrefs.buyerEvidenceBoardHref,
    buyerProofRoomHref: hrefs.buyerProofRoomHref,
    valueClaim: measuredValueClaim(workspace),
    decisionAsk: `Can ${buyer} continue, revise, or stop this ${firstLine(workflow, "buyer workflow")} from one public proof cockpit?`,
    sourceReceipt,
    proofEntry: {
      status: proofRouteStatus,
      proofScore: proofVerification?.score ?? statusScore(checkStatusFromRoute(proofRouteStatus)),
      readyCount: proofVerification?.verifiedCount ?? 0,
      itemCount: proofVerification?.totalCount ?? proofLinksFromWorkspace(workspace).length,
      headline:
        proofRouteStatus === "ready"
          ? "All public proof links are ready for buyer inspection."
          : proofRouteStatus === "attention"
            ? "Some public proof links are verified, but the buyer path still needs repair."
            : "Public proof links need verification before buyer send."
    },
    packet: {
      status: worstRouteStatus(receiptItems.map((item) => item.status)),
      readyCount,
      itemCount: receiptItems.length
    },
    shareGate: {
      mode: shareGateMode,
      score: shareGateScore,
      decision:
        shareGateMode === "send"
          ? "Send the cockpit with the receipt verifier attached."
          : shareGateMode === "review"
            ? "Review internally, then close the named blocker before buyer delivery."
            : "Hold external sharing until the proof and artifact blockers are defensible.",
      primaryActionLabel: shareGateMode === "send" ? "Open buyer room" : `Repair ${firstOpenCheck?.label ?? "open proof"}`,
      primaryActionHref: firstOpenCheck?.href ?? hrefs.launchRoomHref,
      checks
    },
    proofVerification
  });
}
