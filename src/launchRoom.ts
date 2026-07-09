import { recommendSquad } from "./agentEngine.js";
import { buildAdoptionOperatingPlan, type AdoptionOperatingPlanReadiness } from "./adoptionOperatingPlan.js";
import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence.js";
import { buildBuyerDecisionMatrix } from "./buyerDecisionMatrix.js";
import { buildBuyerProofMonitor, type BuyerProofMonitorReadiness } from "./buyerProofMonitor.js";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";
import { buildBuyerTrustCenter, type BuyerTrustCenterReadiness } from "./buyerTrustCenter.js";
import { buildBuyerValueScenario, type BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import { buildBuyerValueSensitivity } from "./buyerValueSensitivity.js";
import { buildBuyerWorkOrderBrief } from "./buyerWorkOrder.js";
import { buildCommercialOffer, type CommercialOfferReadiness } from "./commercialOffer.js";
import { encodeCustomAgentsParam, mergeAgentCatalog } from "./customAgent.js";
import { buildOutcomeSnapshot, type OutcomeSnapshotStatus } from "./outcomeSnapshot.js";
import { buildPilotAgreement } from "./pilotAgreement.js";
import { buildPilotEvidenceLedger } from "./pilotEvidenceLedger.js";
import { buildPilotExecutionHandoff } from "./pilotExecution.js";
import { buildPilotProposal } from "./pilotProposal.js";
import { buildPilotRunReceipt } from "./pilotRunReceipt.js";
import { buildPilotWorkflowPlan } from "./pilotWorkflow.js";
import type { MarketAgent } from "./types.js";
import { buildValueBlueprint } from "./valueBlueprint.js";
import type { WorkspaceDraft } from "./workspaceDraft.js";

export type LaunchRoomReadiness = "buyer-ready" | "needs-proof" | "needs-work-order" | "needs-value";
export type LaunchRoomStatus = "ready" | "attention" | "blocked";

export type LaunchRoomMetric = {
  id: string;
  label: string;
  value: string;
  status: LaunchRoomStatus;
  evidence: string;
};

export type LaunchRoomArtifact = {
  id: string;
  label: string;
  href: string;
  status: LaunchRoomStatus;
  owner: string;
  summary: string;
  proof: string;
};

export type LaunchRoomClosureStep = {
  id: string;
  artifactId: string;
  label: string;
  href: string;
  editHref: string;
  status: LaunchRoomStatus;
  owner: string;
  action: string;
  acceptanceSignal: string;
  proofToAttach: string;
};

export type LaunchRoomAgent = {
  id: string;
  name: string;
  role: string;
  proof: string;
};

export type LaunchRoomProofHealth = {
  readiness: BuyerProofMonitorReadiness;
  status: LaunchRoomStatus;
  score: number;
  checkedAt: string;
  verifiedCount: number;
  totalCount: number;
  blockedCount: number;
  watchCount: number;
  summary: string;
  instruction: string;
};

export type LaunchRoomValueProofCase = {
  id: "pessimistic" | "base" | "upside";
  label: string;
  status: LaunchRoomStatus;
  monthlyValue: string;
  monthlyHoursSaved: string;
  paybackDays: string;
  adoption: string;
  evidence: string;
};

export type LaunchRoomValueProofGuardrail = {
  id: string;
  label: string;
  status: LaunchRoomStatus;
  value: string;
  evidence: string;
};

export type LaunchRoomValueProofLedger = {
  status: LaunchRoomStatus;
  headline: string;
  summary: string;
  confidenceBand: string;
  breakEvenAdoption: string;
  valueAtRisk: string;
  pilotEvidence: {
    status: LaunchRoomStatus;
    value: string;
    evidence: string;
    href: string;
  };
  cases: LaunchRoomValueProofCase[];
  guardrails: LaunchRoomValueProofGuardrail[];
  exportMarkdown: string;
  href: string;
};

export type LaunchRoomDecisionVerdict = "send" | "pilot-review" | "hold";
export const LAUNCH_ROOM_HANDOFF_RECEIPT_VERIFY_PATH = "/api/launch-room/handoff-receipt/verify";
export const LAUNCH_ROOM_FOLLOW_UP_RECEIPT_VERIFY_PATH = "/api/launch-room/follow-up-receipt/verify";
export const LAUNCH_ROOM_ACCEPTANCE_PATH_QUERY_PARAM = "acceptancePathRequest";

export type LaunchRoomHtmlLinks = {
  jsonUrl?: string;
  markdownUrl?: string;
  appUrl?: string;
  shareGateUrl?: string;
  quickAuditReceipt?: LaunchRoomQuickAuditReceipt;
  handoffVerifyRequestUrl?: string;
  handoffCopyUrl?: string;
  followUpVerifyRequestUrl?: string;
  artifactUrls?: Record<string, string>;
  valueProofLedgerUrl?: string;
  buyerCoverSheetUrl?: string;
  stakeholderBriefUrls?: Record<string, string>;
  buyerActivityTrailUrl?: string;
  buyerActivityCrmNoteUrl?: string;
  buyerActivitySlackUpdateUrl?: string;
  buyerActivityTaskCsvUrl?: string;
  buyerFollowUpReceiptUrl?: string;
  buyerFollowUpReplayPayloadUrl?: string;
  handoffDecisionReceiptUrl?: string;
  handoffDecisionReplayPayloadUrl?: string;
};

export type LaunchRoomAcceptancePathAttachment = {
  status: "verified" | "mismatch" | "invalid_request" | "unsupported";
  verified: boolean;
  receiptType: string;
  pathId: string;
  pathStatus: string;
  decision: string;
  decisionRecommendation?: string;
  selectedDecision?: string;
  decisionAlignment?: string;
  openDecisionConditionCount?: number;
  blockedDecisionConditionCount?: number;
  watchDecisionConditionCount?: number;
  blockingSummary?: string;
  overrideWarning?: string;
  continueCriteria?: string[];
  buyer: string;
  checksum: string;
  verifierUrl: string;
  stageCount: number;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  nextAction: string;
};

export type LaunchRoomDecisionCheck = {
  id: "value-case" | "measured-pilot" | "live-proof" | "operating-gates" | "acceptance-path";
  label: string;
  value: string;
  status: LaunchRoomStatus;
  evidence: string;
};

export type LaunchRoomBuyerDecision = {
  verdict: LaunchRoomDecisionVerdict;
  status: LaunchRoomStatus;
  headline: string;
  instruction: string;
  buyerQuestion: string;
  checks: LaunchRoomDecisionCheck[];
};

export type LaunchRoomHandoffAgendaItem = {
  id: string;
  label: string;
  duration: string;
  owner: string;
  proof: string;
};

export type LaunchRoomHandoffCheck = {
  id: "decision" | "proof" | "pilot" | "operating" | "acceptance-path";
  label: string;
  status: LaunchRoomStatus;
  evidence: string;
};

export type LaunchRoomHandoffReplyRouteId = "approve" | "revise" | "hold";

export type LaunchRoomHandoffReplyRoute = {
  id: LaunchRoomHandoffReplyRouteId;
  label: string;
  status: LaunchRoomStatus;
  owner: string;
  trigger: string;
  record: string;
  nextAction: string;
  evidence: string;
};

export type LaunchRoomHandoffDecisionReceiptPayload = {
  launchRoomId: string;
  launchDecision: LaunchRoomDecisionVerdict;
  targetBuyer: string;
  selectedReply: LaunchRoomHandoffReplyRouteId;
  routeStatus: LaunchRoomStatus;
  record: string;
  nextAction: string;
  evidence: string;
  proofHealth: {
    readiness: BuyerProofMonitorReadiness;
    score: number;
    verifiedCount: number;
    totalCount: number;
    checkedAt: string;
  };
  primaryMetric: {
    label: string;
    value: string;
    evidence: string;
  };
  acceptancePath?: {
    pathId: string;
    status: string;
    decision: string;
    decisionRecommendation?: string;
    selectedDecision?: string;
    decisionAlignment?: string;
    openDecisionConditionCount?: number;
    blockedDecisionConditionCount?: number;
    watchDecisionConditionCount?: number;
    verified: boolean;
    checksum: string;
  };
};

export type LaunchRoomHandoffDecisionReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type LaunchRoomHandoffDecisionReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof LAUNCH_ROOM_HANDOFF_RECEIPT_VERIFY_PATH;
  selectedReply: LaunchRoomHandoffReplyRouteId;
  status: LaunchRoomStatus;
  launchDecision: LaunchRoomDecisionVerdict;
  targetBuyer: string;
  owner: string;
  subject: string;
  record: string;
  nextAction: string;
  evidence: string;
  replayFields: string[];
  replayPayload: LaunchRoomHandoffDecisionReceiptPayload;
  replayPayloadJson: string;
  payloadHref: string;
  verification: LaunchRoomHandoffDecisionReceiptVerification;
  copyText: string;
  href: string;
};

export type LaunchRoomHandoffPacket = {
  status: LaunchRoomStatus;
  sendInstruction: string;
  subject: string;
  preview: string;
  emailBody: string[];
  agenda: LaunchRoomHandoffAgendaItem[];
  acceptanceChecks: LaunchRoomHandoffCheck[];
  recommendedReply: LaunchRoomHandoffReplyRouteId;
  replyRoutes: LaunchRoomHandoffReplyRoute[];
  decisionReceipt: LaunchRoomHandoffDecisionReceipt;
};

export type LaunchRoomBuyerCoverStatus = "sendable" | "review-needed" | "hold";

export type LaunchRoomBuyerCoverSignal = {
  id: "buyer-ask" | "value-proof" | "measured-proof" | "trust-boundary" | "acceptance-path" | "reply-route";
  label: string;
  status: LaunchRoomStatus;
  value: string;
  evidence: string;
  href: string;
};

export type LaunchRoomBuyerCoverSheet = {
  status: LaunchRoomBuyerCoverStatus;
  headline: string;
  buyerPromise: string;
  primaryAsk: string;
  doNotSendIf: string;
  reviewTime: string;
  signals: LaunchRoomBuyerCoverSignal[];
  copyText: string;
  href: string;
};

export type LaunchRoomStakeholderBriefId = "economic-buyer" | "security-reviewer" | "pilot-operator" | "procurement-owner";

export type LaunchRoomStakeholderBrief = {
  id: LaunchRoomStakeholderBriefId;
  role: string;
  status: LaunchRoomStatus;
  owner: string;
  decisionAsk: string;
  proofToOpen: string;
  concern: string;
  response: string;
  nextAction: string;
  artifactHref: string;
  copyText: string;
  href: string;
};

export type LaunchRoomBuyerActivityEventId =
  | "cover-sheet-prepared"
  | LaunchRoomStakeholderBriefId
  | "acceptance-path-attached"
  | "reply-route-recorded"
  | "decision-receipt-sealed";

export type LaunchRoomBuyerActivityEvent = {
  id: LaunchRoomBuyerActivityEventId;
  label: string;
  status: LaunchRoomStatus;
  actor: string;
  signal: string;
  evidence: string;
  nextAction: string;
  href: string;
};

export type LaunchRoomFollowUpReceiptPayload = {
  launchRoomId: string;
  targetBuyer: string;
  trailStatus: LaunchRoomStatus;
  headline: string;
  summary: string;
  nextOwner: string;
  nextAction: string;
  events: LaunchRoomBuyerActivityEvent[];
  exports: {
    crmNote: string;
    slackUpdate: string;
    taskCsv: string;
  };
};

export type LaunchRoomFollowUpReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type LaunchRoomFollowUpReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof LAUNCH_ROOM_FOLLOW_UP_RECEIPT_VERIFY_PATH;
  status: LaunchRoomStatus;
  targetBuyer: string;
  owner: string;
  summary: string;
  replayFields: string[];
  replayPayload: LaunchRoomFollowUpReceiptPayload;
  replayPayloadJson: string;
  payloadHref: string;
  verification: LaunchRoomFollowUpReceiptVerification;
  copyText: string;
  href: string;
};

export type LaunchRoomBuyerActivityTrail = {
  status: LaunchRoomStatus;
  headline: string;
  summary: string;
  nextOwner: string;
  nextAction: string;
  events: LaunchRoomBuyerActivityEvent[];
  copyText: string;
  href: string;
  crmNote: string;
  crmNoteHref: string;
  slackUpdate: string;
  slackUpdateHref: string;
  taskCsv: string;
  taskCsvHref: string;
  followUpReceipt: LaunchRoomFollowUpReceipt;
};

export type LaunchRoom = {
  id: string;
  readiness: LaunchRoomReadiness;
  launchScore: number;
  headline: string;
  hardTruth: string;
  targetBuyer: string;
  projectBrief: string;
  primaryMetric: LaunchRoomMetric;
  metrics: LaunchRoomMetric[];
  nextAction: {
    label: string;
    owner: string;
    action: string;
    href: string;
  };
  artifacts: LaunchRoomArtifact[];
  closurePlan: LaunchRoomClosureStep[];
  agents: LaunchRoomAgent[];
  proofHealth: LaunchRoomProofHealth;
  valueProofLedger: LaunchRoomValueProofLedger;
  buyerDecision: LaunchRoomBuyerDecision;
  handoffPacket: LaunchRoomHandoffPacket;
  buyerCoverSheet: LaunchRoomBuyerCoverSheet;
  stakeholderBriefs: LaunchRoomStakeholderBrief[];
  buyerActivityTrail: LaunchRoomBuyerActivityTrail;
  quickAuditReceipt?: LaunchRoomQuickAuditReceipt;
  acceptancePath?: LaunchRoomAcceptancePathAttachment;
  exportMarkdown: string;
};

export type LaunchRoomQuickAuditReceipt = {
  status: "verified";
  receiptId: string;
  checksum: string;
  checkedAt: string;
  score: number;
  verifiedCount: number;
  totalCount: number;
};

export type LaunchRoomQuickAuditReceiptInput = {
  packet?: string;
  receiptId?: string;
  checksum?: string;
  status?: string;
  checkedAt?: string;
  score?: string | number;
  verified?: string;
};

export type BuildLaunchRoomInput = {
  workspace: WorkspaceDraft;
  baseUrl?: string;
  appUrl?: string;
  now?: Date;
  quickAuditReceipt?: LaunchRoomQuickAuditReceipt;
  acceptancePath?: LaunchRoomAcceptancePathAttachment;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function cleanQuickAuditValue(value: string | number | undefined) {
  return typeof value === "number" ? String(value) : (value ?? "").trim();
}

export function buildLaunchRoomQuickAuditReceipt(input: LaunchRoomQuickAuditReceiptInput): LaunchRoomQuickAuditReceipt | null {
  const packet = cleanQuickAuditValue(input.packet);
  const status = cleanQuickAuditValue(input.status);
  const receiptId = cleanQuickAuditValue(input.receiptId);
  const checksum = cleanQuickAuditValue(input.checksum);
  const checkedAt = cleanQuickAuditValue(input.checkedAt);
  const score = Number(cleanQuickAuditValue(input.score));
  const verifiedParts = cleanQuickAuditValue(input.verified).split("/");
  const verifiedCount = Number(verifiedParts[0]);
  const totalCount = Number(verifiedParts[1]);

  if (packet !== "verified" || status !== "verified") return null;
  if (!/^workflow-live-proof-verified-[a-f0-9]{8}$/i.test(receiptId)) return null;
  if (!/^fnv1a32:[a-f0-9]{8}$/i.test(checksum)) return null;
  if (!Number.isInteger(score) || score < 0 || score > 100) return null;
  if (!Number.isInteger(verifiedCount) || !Number.isInteger(totalCount) || verifiedCount < 1 || totalCount < 1 || verifiedCount !== totalCount) return null;
  if (Number.isNaN(Date.parse(checkedAt))) return null;

  return {
    status: "verified",
    receiptId,
    checksum,
    checkedAt,
    score,
    verifiedCount,
    totalCount
  };
}

function statusFromOutcome(status: OutcomeSnapshotStatus): LaunchRoomStatus {
  if (status === "complete") return "ready";
  if (status === "attention") return "attention";
  return "blocked";
}

function workOrderStatus(readiness: string): LaunchRoomStatus {
  if (readiness === "ready-to-run") return "ready";
  if (readiness === "needs-proof") return "attention";
  return "blocked";
}

function adoptionPlanStatus(readiness: AdoptionOperatingPlanReadiness): LaunchRoomStatus {
  if (readiness === "ready-to-operate") return "ready";
  if (readiness === "needs-owner-commitment") return "attention";
  return "blocked";
}

function trustCenterStatus(readiness: BuyerTrustCenterReadiness): LaunchRoomStatus {
  if (readiness === "trust-ready") return "ready";
  if (readiness === "needs-review") return "attention";
  return "blocked";
}

function commercialOfferStatus(readiness: CommercialOfferReadiness): LaunchRoomStatus {
  if (readiness === "offer-ready") return "ready";
  if (readiness === "needs-redlines") return "attention";
  return "blocked";
}

function proofHealthStatus(readiness: BuyerProofMonitorReadiness): LaunchRoomStatus {
  if (readiness === "evidence-current") return "ready";
  if (readiness === "evidence-watch") return "attention";
  return "blocked";
}

function proofHealthInstruction(readiness: BuyerProofMonitorReadiness) {
  if (readiness === "evidence-current") return "Keep daily live proof checks while the launch room is under review.";
  if (readiness === "evidence-watch") return "Keep the room internal until the warning proof is rechecked or replaced.";
  if (readiness === "evidence-blocked") return "Freeze external sharing until blocked buyer proof is fixed and verified.";
  return "Run live proof verification in the workspace before treating this launch room as buyer-ready.";
}

function buyerValueStatus(readiness: string): LaunchRoomStatus {
  if (readiness === "scales-now") return "ready";
  if (readiness === "pilot-first") return "attention";
  return "blocked";
}

function pilotReceiptStatus(readiness: string): LaunchRoomStatus {
  if (readiness === "accepted") return "ready";
  if (readiness === "needs-evidence") return "attention";
  return "blocked";
}

function valueScenarioStatus(status: BuyerValueScenarioStatus): LaunchRoomStatus {
  if (status === "clear") return "ready";
  if (status === "watch") return "attention";
  return "blocked";
}

function worstStatus(...statuses: LaunchRoomStatus[]): LaunchRoomStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function decisionStatus(verdict: LaunchRoomDecisionVerdict): LaunchRoomStatus {
  if (verdict === "send") return "ready";
  if (verdict === "pilot-review") return "attention";
  return "blocked";
}

function acceptancePathStatus(attachment: LaunchRoomAcceptancePathAttachment | undefined): LaunchRoomStatus | undefined {
  if (!attachment) return undefined;
  if (!attachment.verified) return "blocked";
  if (attachment.decision === "do-not-send") return "blocked";
  if (attachment.decision === "sponsor-review") return "attention";
  if (attachment.decisionAlignment === "overridden" && attachment.decisionRecommendation === "stop") return "blocked";
  if (attachment.decisionAlignment === "overridden") return "attention";
  if (attachment.pathStatus === "ready") return "ready";
  if (attachment.pathStatus === "review") return "attention";
  return "blocked";
}

function acceptancePathEvidence(attachment: LaunchRoomAcceptancePathAttachment) {
  const gate =
    attachment.decisionRecommendation || attachment.selectedDecision || attachment.decisionAlignment
      ? ` Decision gate recommends ${attachment.decisionRecommendation || "unknown"}, selected ${attachment.selectedDecision || attachment.decision}; alignment ${attachment.decisionAlignment || "unknown"}.`
      : "";
  const blocked = typeof attachment.blockedDecisionConditionCount === "number" ? ` ${attachment.blockedDecisionConditionCount} blocked decision condition(s).` : "";
  const summary = attachment.blockingSummary ? ` ${attachment.blockingSummary}` : "";
  if (attachment.verified) {
    return `${attachment.readyCount}/${attachment.stageCount} acceptance stages ready; ${attachment.pathId} verified with checksum ${attachment.checksum}.${gate}${blocked}${summary}`;
  }
  return `Acceptance path receipt is ${attachment.status}. ${attachment.nextAction}`;
}

function acceptancePathValue(attachment: LaunchRoomAcceptancePathAttachment) {
  if (!attachment.verified) return attachment.status;
  return attachment.decisionRecommendation ? `${attachment.decision} / ${attachment.pathStatus} / ${attachment.decisionRecommendation} recommended` : `${attachment.decision} / ${attachment.pathStatus}`;
}

function decisionHeadline(verdict: LaunchRoomDecisionVerdict) {
  if (verdict === "send") return "Send this to a buyer pilot";
  if (verdict === "pilot-review") return "Keep this in sponsor review";
  return "Hold buyer sharing";
}

function decisionInstruction(verdict: LaunchRoomDecisionVerdict) {
  if (verdict === "send") return "The value case, measured pilot, live proof, and operating gates support external buyer review.";
  if (verdict === "pilot-review") return "The case is close, but a sponsor should clear the open warning before buyer delivery.";
  return "Do not send this externally until the first blocked decision check is fixed and re-exported.";
}

function decisionQuestion(verdict: LaunchRoomDecisionVerdict) {
  if (verdict === "send") return "Will the buyer approve the bounded pilot on this evidence?";
  if (verdict === "pilot-review") return "What must the sponsor close before the buyer sees this?";
  return "Which blocker would make this credible enough for first buyer review?";
}

function buildBuyerDecision(input: {
  readiness: LaunchRoomReadiness;
  launchScore: number;
  buyerScenario: ReturnType<typeof buildBuyerValueScenario>;
  pilotRunReceipt: ReturnType<typeof buildPilotRunReceipt>;
  proofHealth: LaunchRoomProofHealth;
  adoptionStatus: LaunchRoomStatus;
  trustStatus: LaunchRoomStatus;
  commercialStatus: LaunchRoomStatus;
  acceptancePath?: LaunchRoomAcceptancePathAttachment;
}): LaunchRoomBuyerDecision {
  const operatingStatus = worstStatus(input.adoptionStatus, input.trustStatus, input.commercialStatus);
  const attachedAcceptanceStatus = acceptancePathStatus(input.acceptancePath);
  const checks: LaunchRoomDecisionCheck[] = [
    {
      id: "value-case",
      label: "Buyer value case",
      value: `${yen(input.buyerScenario.monthlyGrossValueYen)} / month`,
      status: buyerValueStatus(input.buyerScenario.readiness),
      evidence: `${input.buyerScenario.monthlyHoursSaved}h/month saved, ${input.buyerScenario.paybackDays}-day payback, ${input.buyerScenario.confidenceScore}/100 confidence.`
    },
    {
      id: "measured-pilot",
      label: "Measured pilot",
      value: `${input.pilotRunReceipt.acceptanceRatePercent}% accepted`,
      status: pilotReceiptStatus(input.pilotRunReceipt.readiness),
      evidence: `${input.pilotRunReceipt.actualMinutesSavedPerRun}m saved/run and ${yen(input.pilotRunReceipt.measuredMonthlyValueYen)} measured monthly value.`
    },
    {
      id: "live-proof",
      label: "Live proof health",
      value: input.proofHealth.checkedAt ? `${input.proofHealth.verifiedCount}/${input.proofHealth.totalCount}` : "not checked",
      status: input.proofHealth.status,
      evidence: input.proofHealth.instruction
    },
    {
      id: "operating-gates",
      label: "Operating gates",
      value: operatingStatus,
      status: operatingStatus,
      evidence: `Adoption ${input.adoptionStatus}, trust ${input.trustStatus}, commercial ${input.commercialStatus}.`
    },
    ...(input.acceptancePath && attachedAcceptanceStatus
      ? [
          {
            id: "acceptance-path" as const,
            label: "Acceptance path",
            value: acceptancePathValue(input.acceptancePath),
            status: attachedAcceptanceStatus,
            evidence: acceptancePathEvidence(input.acceptancePath)
          }
        ]
      : [])
  ];
  const firstBlocker = checks.find((check) => check.status === "blocked");
  const firstWarning = checks.find((check) => check.status === "attention");
  const verdict: LaunchRoomDecisionVerdict =
    input.readiness === "buyer-ready" && input.launchScore >= 82 && !firstBlocker && !firstWarning
      ? "send"
      : firstBlocker || input.launchScore < 62
        ? "hold"
        : "pilot-review";

  return {
    verdict,
    status: decisionStatus(verdict),
    headline: decisionHeadline(verdict),
    instruction: firstBlocker
      ? `${decisionInstruction(verdict)} First blocker: ${firstBlocker.label}.`
      : firstWarning
        ? `${decisionInstruction(verdict)} First warning: ${firstWarning.label}.`
        : decisionInstruction(verdict),
    buyerQuestion: decisionQuestion(verdict),
    checks
  };
}

function valueLedgerHeadline(status: LaunchRoomStatus) {
  if (status === "ready") return "Value proof survives downside review";
  if (status === "attention") return "Value proof needs sponsor calibration";
  return "Value proof is not buyer-defensible yet";
}

function valueLedgerSummary(input: {
  status: LaunchRoomStatus;
  baseValue: string;
  pessimisticValue: string;
  breakEvenAdoption: string;
  pilotEvidence: string;
}) {
  if (input.status === "ready") {
    return `Base case is ${input.baseValue} per month and the downside case still has a defensible payback.`;
  }
  if (input.status === "attention") {
    return `Base case is ${input.baseValue} per month, but the buyer should validate ${input.breakEvenAdoption} adoption and measured pilot support before rollout.`;
  }
  return `Do not pitch the value case externally until the downside case improves beyond ${input.pessimisticValue} per month and ${input.pilotEvidence} is stronger.`;
}

function buildValueProofLedgerMarkdown(input: Omit<LaunchRoomValueProofLedger, "exportMarkdown" | "href">) {
  return [
    "# Launch room value proof ledger",
    "",
    `Status: ${input.status}`,
    `Headline: ${input.headline}`,
    `Confidence band: ${input.confidenceBand}`,
    `Break-even adoption: ${input.breakEvenAdoption}`,
    `Value at risk: ${input.valueAtRisk}`,
    "",
    input.summary,
    "",
    "## Sensitivity cases",
    ...input.cases.map(
      (item) => `- [${item.status}] ${item.label}: ${item.monthlyValue} / month, ${item.monthlyHoursSaved} saved, ${item.paybackDays} payback, ${item.adoption}. ${item.evidence}`
    ),
    "",
    "## Guardrails",
    ...input.guardrails.map((item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.evidence}`),
    "",
    "## Measured pilot support",
    `- [${input.pilotEvidence.status}] ${input.pilotEvidence.value}`,
    `- Evidence: ${input.pilotEvidence.evidence}`,
    `- Link: ${input.pilotEvidence.href}`
  ].join("\n");
}

function buildValueProofLedger(input: {
  buyerScenario: ReturnType<typeof buildBuyerValueScenario>;
  pilotRunReceipt: ReturnType<typeof buildPilotRunReceipt>;
  buyerValueHref: string;
  pilotReceiptHref: string;
}): LaunchRoomValueProofLedger {
  const sensitivity = buildBuyerValueSensitivity(input.buyerScenario);
  const baseCase = sensitivity.cases.find((item) => item.id === "base") ?? sensitivity.cases[1] ?? sensitivity.cases[0];
  const pessimisticCase = sensitivity.cases.find((item) => item.id === "pessimistic") ?? sensitivity.cases[0];
  const caseStatus = worstStatus(...sensitivity.cases.map((item) => valueScenarioStatus(item.status)));
  const guardrailStatus = worstStatus(...sensitivity.guardrails.map((item) => valueScenarioStatus(item.status)));
  const pilotStatus = pilotReceiptStatus(input.pilotRunReceipt.readiness);
  const status = worstStatus(
    sensitivity.verdict === "defensible" ? "ready" : sensitivity.verdict === "fragile" ? "attention" : "blocked",
    caseStatus,
    guardrailStatus,
    pilotStatus
  );
  const pilotEvidence = {
    status: pilotStatus,
    value: `${yen(input.pilotRunReceipt.measuredMonthlyValueYen)} measured / month`,
    evidence: `${input.pilotRunReceipt.actualMinutesSavedPerRun}m saved/run, ${input.pilotRunReceipt.acceptanceRatePercent}% accepted, reviewer ${input.pilotRunReceipt.reviewerName || "not named"}.`,
    href: input.pilotReceiptHref
  };
  const partial: Omit<LaunchRoomValueProofLedger, "exportMarkdown" | "href"> = {
    status,
    headline: valueLedgerHeadline(status),
    summary: valueLedgerSummary({
      status,
      baseValue: yen(baseCase?.monthlyValueYen ?? input.buyerScenario.monthlyGrossValueYen),
      pessimisticValue: yen(pessimisticCase?.monthlyValueYen ?? 0),
      breakEvenAdoption: `${sensitivity.breakEvenAdoptionPercent}%`,
      pilotEvidence: pilotEvidence.value
    }),
    confidenceBand: sensitivity.confidenceBand,
    breakEvenAdoption: `${sensitivity.breakEvenAdoptionPercent}%`,
    valueAtRisk: yen(sensitivity.valueAtRiskYen),
    pilotEvidence,
    cases: sensitivity.cases.map((item) => ({
      id: item.id,
      label: item.label,
      status: valueScenarioStatus(item.status),
      monthlyValue: yen(item.monthlyValueYen),
      monthlyHoursSaved: `${item.monthlyHoursSaved}h`,
      paybackDays: `${item.paybackDays} days`,
      adoption: `${item.adoptionRatePercent}% adoption / ${item.automationRatePercent}% automation`,
      evidence: item.evidence
    })),
    guardrails: sensitivity.guardrails.map((item) => ({
      id: item.id,
      label: item.label,
      status: valueScenarioStatus(item.status),
      value: item.value,
      evidence: item.evidence
    }))
  };
  const exportMarkdown = buildValueProofLedgerMarkdown(partial);

  return {
    ...partial,
    exportMarkdown,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function handoffInstruction(verdict: LaunchRoomDecisionVerdict) {
  if (verdict === "send") return "Send this packet to the buyer sponsor and use the agenda as the first pilot review script.";
  if (verdict === "pilot-review") return "Keep this packet internal until the sponsor clears the warning called out in the buyer decision.";
  return "Do not send this packet externally; use it as the internal repair brief until the blocked check is fixed.";
}

function handoffPreview(verdict: LaunchRoomDecisionVerdict, primaryMetric: LaunchRoomMetric, proofHealth: LaunchRoomProofHealth) {
  if (verdict === "send") {
    return `${primaryMetric.value} modeled monthly value with ${proofHealth.verifiedCount}/${proofHealth.totalCount} live proof links verified.`;
  }
  if (verdict === "pilot-review") return `${primaryMetric.value} modeled monthly value, pending sponsor review of the open warning.`;
  return `Buyer sharing is held until ${proofHealth.status === "blocked" ? "live proof health" : "the first blocked decision check"} is fixed.`;
}

type LaunchRoomBeforeHandoff = Omit<LaunchRoom, "handoffPacket" | "buyerCoverSheet" | "stakeholderBriefs" | "buyerActivityTrail" | "exportMarkdown">;
type LaunchRoomBeforeCoverSheet = Omit<LaunchRoom, "buyerCoverSheet" | "stakeholderBriefs" | "buyerActivityTrail" | "exportMarkdown">;
type LaunchRoomBeforeStakeholderBriefs = Omit<LaunchRoom, "buyerCoverSheet" | "stakeholderBriefs" | "buyerActivityTrail" | "exportMarkdown">;
type LaunchRoomBeforeActivityTrail = Omit<LaunchRoom, "buyerActivityTrail" | "exportMarkdown">;

function firstHandoffBlocker(room: LaunchRoomBeforeHandoff) {
  return room.buyerDecision.checks.find((check) => check.status === "blocked") ?? room.buyerDecision.checks.find((check) => check.status === "attention");
}

function handoffNextAction(room: LaunchRoomBeforeHandoff) {
  const ownerPrefix = `${room.nextAction.owner}:`;
  const rawAction = room.nextAction.action.startsWith(ownerPrefix) ? room.nextAction.action.slice(ownerPrefix.length).trim() : room.nextAction.action;
  return `Close ${room.nextAction.label}: ${trimTerminalPunctuation(rawAction)}.`;
}

function buildHandoffReplyRoutes(room: LaunchRoomBeforeHandoff): {
  recommendedReply: LaunchRoomHandoffReplyRouteId;
  replyRoutes: LaunchRoomHandoffReplyRoute[];
} {
  const blocker = firstHandoffBlocker(room);
  const nextAction = handoffNextAction(room);
  if (room.buyerDecision.verdict === "send") {
    return {
      recommendedReply: "approve",
      replyRoutes: [
        {
          id: "approve",
          label: "Approve pilot",
          status: "ready",
          owner: room.targetBuyer,
          trigger: "Buyer accepts the bounded pilot on the attached proof.",
          record: "Record buyer approval against this launch room.",
          nextAction: "Send the pilot agreement and start the first work order.",
          evidence: room.buyerDecision.buyerQuestion
        },
        {
          id: "revise",
          label: "Revise scope",
          status: "attention",
          owner: room.nextAction.owner,
          trigger: "Buyer wants a narrower scope, different owner, or extra proof.",
          record: "Record the requested edit before changing the pilot ask.",
          nextAction,
          evidence: blocker?.evidence ?? room.buyerDecision.instruction
        },
        {
          id: "hold",
          label: "Hold decision",
          status: "attention",
          owner: room.targetBuyer,
          trigger: "Buyer needs another reviewer or date before deciding.",
          record: "Record a dated hold with the buyer-side owner.",
          nextAction: "Keep live proof checks running and schedule the next review.",
          evidence: room.proofHealth.summary
        }
      ]
    };
  }

  if (room.buyerDecision.verdict === "pilot-review") {
    return {
      recommendedReply: "revise",
      replyRoutes: [
        {
          id: "approve",
          label: "Approve pilot",
          status: "blocked",
          owner: room.targetBuyer,
          trigger: "Buyer says yes before the sponsor warning is cleared.",
          record: "Do not record external approval from this packet.",
          nextAction: "Clear the sponsor warning, then export a fresh launch room.",
          evidence: blocker?.evidence ?? room.buyerDecision.instruction
        },
        {
          id: "revise",
          label: "Revise and resend",
          status: "ready",
          owner: room.nextAction.owner,
          trigger: "Sponsor accepts the warning and assigns the repair.",
          record: "Record the revision owner and blocker being cleared.",
          nextAction,
          evidence: blocker?.label ?? room.nextAction.label
        },
        {
          id: "hold",
          label: "Hold internal",
          status: "attention",
          owner: room.nextAction.owner,
          trigger: "The warning needs more evidence before a buyer can review it.",
          record: "Hold buyer delivery inside the launch room.",
          nextAction: "Keep the packet internal until the warning is verified.",
          evidence: room.buyerDecision.instruction
        }
      ]
    };
  }

  return {
    recommendedReply: "hold",
    replyRoutes: [
      {
        id: "approve",
        label: "Approve pilot",
        status: "blocked",
        owner: room.targetBuyer,
        trigger: "Buyer approval is requested while a decision check is blocked.",
        record: "Do not record external approval from this packet.",
        nextAction: "Fix the first blocked decision check before reopening the ask.",
        evidence: blocker?.evidence ?? room.buyerDecision.instruction
      },
      {
        id: "revise",
        label: "Revise package",
        status: "attention",
        owner: room.nextAction.owner,
        trigger: "The team wants to rebuild the buyer package from the blocker.",
        record: "Record the revision scope and regenerate the launch room.",
        nextAction,
        evidence: blocker?.label ?? room.nextAction.label
      },
      {
        id: "hold",
        label: "Hold external launch",
        status: "ready",
        owner: room.nextAction.owner,
        trigger: "The packet is not credible enough for buyer review.",
        record: "Hold external launch until the first blocker is closed.",
        nextAction,
        evidence: blocker?.evidence ?? room.buyerDecision.instruction
      }
    ]
  };
}

const HANDOFF_DECISION_RECEIPT_REPLAY_FIELDS = [
  "launchRoomId",
  "launchDecision",
  "targetBuyer",
  "selectedReply",
  "routeStatus",
  "record",
  "nextAction",
  "evidence",
  "proofHealth",
  "primaryMetric"
];

function handoffDecisionReceiptReplayFields(room: LaunchRoomBeforeHandoff) {
  return room.acceptancePath ? [...HANDOFF_DECISION_RECEIPT_REPLAY_FIELDS, "acceptancePath"] : HANDOFF_DECISION_RECEIPT_REPLAY_FIELDS;
}

function buildHandoffDecisionReceiptMarkdown(receipt: Omit<LaunchRoomHandoffDecisionReceipt, "copyText" | "href">) {
  return [
    "# Launch room handoff decision receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Selected reply: ${receipt.selectedReply}`,
    `Status: ${receipt.status}`,
    `Launch decision: ${receipt.launchDecision}`,
    `Target buyer: ${receipt.targetBuyer}`,
    `Owner: ${receipt.owner}`,
    `Subject: ${receipt.subject}`,
    "",
    "## Decision record",
    `- Record: ${receipt.record}`,
    `- Next action: ${receipt.nextAction}`,
    `- Evidence: ${receipt.evidence}`,
    "",
    "## Replay fields",
    ...receipt.replayFields.map((field) => `- ${field}`),
    "",
    "## Replay payload",
    "```json",
    receipt.replayPayloadJson,
    "```",
    "",
    "## Verification",
    `- Status: ${receipt.verification.status}`,
    `- Expected checksum: ${receipt.verification.expectedChecksum}`,
    `- Actual checksum: ${receipt.verification.actualChecksum}`,
    `- Instruction: ${receipt.verification.instruction}`,
    "",
    "## API verification",
    `POST ${receipt.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    canonicalJson({ checksum: receipt.checksum, replayPayload: receipt.replayPayload }),
    "```",
    "",
    "Replay rule: Recompute fnv1a-64 over the receipt replay payload before accepting a forwarded handoff decision."
  ].join("\n");
}

function buildHandoffDecisionReceipt({
  room,
  subject,
  route
}: {
  room: LaunchRoomBeforeHandoff;
  subject: string;
  route: LaunchRoomHandoffReplyRoute;
}): LaunchRoomHandoffDecisionReceipt {
  const replayPayload: LaunchRoomHandoffDecisionReceiptPayload = {
    launchRoomId: room.id,
    launchDecision: room.buyerDecision.verdict,
    targetBuyer: room.targetBuyer,
    selectedReply: route.id,
    routeStatus: route.status,
    record: route.record,
    nextAction: route.nextAction,
    evidence: route.evidence,
    proofHealth: {
      readiness: room.proofHealth.readiness,
      score: room.proofHealth.score,
      verifiedCount: room.proofHealth.verifiedCount,
      totalCount: room.proofHealth.totalCount,
      checkedAt: room.proofHealth.checkedAt || "not checked"
    },
    primaryMetric: {
      label: room.primaryMetric.label,
      value: room.primaryMetric.value,
      evidence: room.primaryMetric.evidence
    },
    ...(room.acceptancePath
      ? {
        acceptancePath: {
          pathId: room.acceptancePath.pathId,
          status: room.acceptancePath.pathStatus,
          decision: room.acceptancePath.decision,
          decisionRecommendation: room.acceptancePath.decisionRecommendation,
          selectedDecision: room.acceptancePath.selectedDecision,
          decisionAlignment: room.acceptancePath.decisionAlignment,
          openDecisionConditionCount: room.acceptancePath.openDecisionConditionCount,
          blockedDecisionConditionCount: room.acceptancePath.blockedDecisionConditionCount,
          watchDecisionConditionCount: room.acceptancePath.watchDecisionConditionCount,
          verified: room.acceptancePath.verified,
          checksum: room.acceptancePath.checksum
        }
      }
      : {})
  };
  const checksum = stableDigest(replayPayload);
  const replayPayloadJson = canonicalJson(replayPayload);
  const verification = verifyLaunchRoomHandoffDecisionReceipt({ checksum, replayPayload });
  const partial: Omit<LaunchRoomHandoffDecisionReceipt, "copyText" | "href"> = {
    receiptId: `launch-handoff-${route.id}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: LAUNCH_ROOM_HANDOFF_RECEIPT_VERIFY_PATH,
    selectedReply: route.id,
    status: route.status,
    launchDecision: room.buyerDecision.verdict,
    targetBuyer: room.targetBuyer,
    owner: route.owner,
    subject,
    record: route.record,
    nextAction: route.nextAction,
    evidence: route.evidence,
    replayFields: handoffDecisionReceiptReplayFields(room),
    replayPayload,
    replayPayloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(replayPayloadJson)}`,
    verification
  };
  const copyText = buildHandoffDecisionReceiptMarkdown(partial);

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}

function buildHandoffPacket(room: LaunchRoomBeforeHandoff): LaunchRoomHandoffPacket {
  const deliveryMemo = room.artifacts.find((artifact) => artifact.id === "delivery-memo");
  const pilotRun = room.artifacts.find((artifact) => artifact.id === "pilot-run-receipt");
  const trust = room.artifacts.find((artifact) => artifact.id === "trust-center");
  const commercial = room.artifacts.find((artifact) => artifact.id === "commercial-offer");
  const blocker = firstHandoffBlocker(room);
  const replyRouting = buildHandoffReplyRoutes(room);
  const acceptancePathCheck = room.buyerDecision.checks.find((check) => check.id === "acceptance-path");
  const subject =
    room.buyerDecision.verdict === "send"
      ? `Pilot review: ${room.targetBuyer} proof room is ready`
      : `Internal repair: ${blocker?.label ?? room.nextAction.label} blocks buyer sharing`;
  const emailBody = [
    `Hi ${room.targetBuyer} team,`,
    room.buyerDecision.verdict === "send"
      ? `We have a buyer-ready launch room for the proposed AI agent pilot. The current model shows ${room.primaryMetric.value} in monthly buyer value, with the pilot receipt and operating gates attached.`
      : `This launch room is not ready for external buyer review yet. ${room.buyerDecision.instruction}`,
    `Decision requested: ${room.buyerDecision.buyerQuestion}`,
    `Delivery memo: ${deliveryMemo?.href ?? "open this launch room first, then generate the buyer delivery memo"}.`,
    `Launch room link: send this page URL. First artifact to review: ${room.nextAction.label}.`,
    `Proof status: ${room.proofHealth.checkedAt ? `${room.proofHealth.verifiedCount}/${room.proofHealth.totalCount} live links verified` : "live proof has not been checked"}.`,
    ...(room.acceptancePath
      ? [
          `Acceptance path: ${acceptancePathEvidence(room.acceptancePath)}`
        ]
      : []),
    ...(room.quickAuditReceipt
      ? [`Quick intake audit: ${room.quickAuditReceipt.receiptId} (${room.quickAuditReceipt.checksum}), ${room.quickAuditReceipt.verifiedCount}/${room.quickAuditReceipt.totalCount} verified at ${room.quickAuditReceipt.checkedAt}.`]
      : []),
    "Please use the agenda below to approve, revise, or hold the pilot."
  ];
  const selectedRoute = replyRouting.replyRoutes.find((route) => route.id === replyRouting.recommendedReply) ?? replyRouting.replyRoutes[0];

  return {
    status: room.buyerDecision.status,
    sendInstruction: handoffInstruction(room.buyerDecision.verdict),
    subject,
    preview: handoffPreview(room.buyerDecision.verdict, room.primaryMetric, room.proofHealth),
    emailBody,
    agenda: [
      {
        id: "value",
        label: "Confirm the buyer value claim",
        duration: "6 min",
        owner: room.targetBuyer,
        proof: `${room.primaryMetric.label}: ${room.primaryMetric.value}. ${room.primaryMetric.evidence}`
      },
      {
        id: "pilot",
        label: "Inspect the measured pilot receipt",
        duration: "8 min",
        owner: pilotRun?.owner ?? "Pilot reviewer",
        proof: pilotRun?.proof ?? "Pilot receipt is missing."
      },
      {
        id: "trust",
        label: "Clear operating and trust gates",
        duration: "7 min",
        owner: trust?.owner ?? "Security reviewer",
        proof: `${trust?.proof ?? "Trust center needs review."} ${commercial?.proof ?? "Commercial offer needs review."}`
      },
      ...(room.acceptancePath
        ? [
            {
              id: "acceptance-path",
              label: "Confirm acceptance path receipt",
              duration: "4 min",
              owner: room.acceptancePath.buyer || room.targetBuyer,
              proof: acceptancePathEvidence(room.acceptancePath)
            }
          ]
        : []),
      {
        id: "decision",
        label: "Decide send, revise, or hold",
        duration: room.acceptancePath ? "3 min" : "4 min",
        owner: room.nextAction.owner,
        proof: room.buyerDecision.instruction
      }
    ],
    acceptanceChecks: [
      {
        id: "decision",
        label: "Buyer decision",
        status: room.buyerDecision.status,
        evidence: room.buyerDecision.headline
      },
      {
        id: "proof",
        label: "Live proof",
        status: room.proofHealth.status,
        evidence: room.proofHealth.instruction
      },
      {
        id: "pilot",
        label: "Measured pilot",
        status: room.buyerDecision.checks.find((check) => check.id === "measured-pilot")?.status ?? "blocked",
        evidence: room.buyerDecision.checks.find((check) => check.id === "measured-pilot")?.evidence ?? "Measured pilot evidence is missing."
      },
      {
        id: "operating",
        label: "Operating gates",
        status: room.buyerDecision.checks.find((check) => check.id === "operating-gates")?.status ?? "blocked",
        evidence: room.buyerDecision.checks.find((check) => check.id === "operating-gates")?.evidence ?? "Operating gates are missing."
      },
      ...(acceptancePathCheck
        ? [
            {
              id: "acceptance-path" as const,
              label: "Acceptance path",
              status: acceptancePathCheck.status,
              evidence: acceptancePathCheck.evidence
            }
          ]
        : [])
    ],
    recommendedReply: replyRouting.recommendedReply,
    replyRoutes: replyRouting.replyRoutes,
    decisionReceipt: buildHandoffDecisionReceipt({ room, subject, route: selectedRoute })
  };
}

function buyerCoverStatus(verdict: LaunchRoomDecisionVerdict): LaunchRoomBuyerCoverStatus {
  if (verdict === "send") return "sendable";
  if (verdict === "pilot-review") return "review-needed";
  return "hold";
}

function buyerCoverHeadline(status: LaunchRoomBuyerCoverStatus, blocker?: LaunchRoomDecisionCheck) {
  if (status === "sendable") return "Buyer can decide from this page";
  if (status === "review-needed") return `Sponsor review should clear ${blocker?.label ?? "the open warning"}`;
  return `Keep internal until ${blocker?.label ?? "the first blocker"} is repaired`;
}

function buyerCoverPromise(room: LaunchRoomBeforeCoverSheet) {
  const base = `${room.targetBuyer} gets the value claim, measured pilot proof, live proof health, operating gates`;
  if (!room.acceptancePath) return `${base}, and reply route without a separate status meeting.`;
  if (acceptancePathStatus(room.acceptancePath) === "ready") {
    return `${base}, verified acceptance path, and reply route without a separate status meeting.`;
  }
  return `${base}, acceptance path repair gate, and reply route without a separate status meeting.`;
}

function buyerCoverPrimaryAsk(room: LaunchRoomBeforeCoverSheet, status: LaunchRoomBuyerCoverStatus) {
  if (status === "sendable") return `Approve the bounded pilot and record the ${room.handoffPacket.decisionReceipt.selectedReply} handoff decision.`;
  if (status === "review-needed") return `Assign ${room.nextAction.owner} to close ${room.nextAction.label}, then resend the launch room.`;
  return `Hold external launch and repair ${room.nextAction.label} before reopening buyer review.`;
}

function buyerCoverDoNotSendIf(status: LaunchRoomBuyerCoverStatus, blocker?: LaunchRoomDecisionCheck) {
  if (status === "sendable") return "Do not send if a live proof link regresses, the pilot receipt changes, or the buyer data boundary changes.";
  if (!blocker) return "Do not send if the sponsor cannot name the next owner, proof target, and reply route.";
  return `Do not send if ${blocker.label} is still ${blocker.status}: ${blocker.evidence}`;
}

function reviewTimeForAgenda(agenda: LaunchRoomHandoffAgendaItem[]) {
  const minutes = agenda.reduce((total, item) => {
    const match = item.duration.match(/\d+/);
    return total + (match ? Number(match[0]) : 0);
  }, 0);
  return minutes > 0 ? `${minutes} min` : "25 min";
}

function buildBuyerCoverSheetCopyText(cover: Omit<LaunchRoomBuyerCoverSheet, "copyText" | "href">) {
  return [
    "# Buyer cover sheet",
    "",
    `Status: ${cover.status}`,
    `Headline: ${cover.headline}`,
    `Review time: ${cover.reviewTime}`,
    "",
    "## What buyer gets",
    cover.buyerPromise,
    "",
    "## Primary ask",
    cover.primaryAsk,
    "",
    "## Do not send if",
    cover.doNotSendIf,
    "",
    "## Decision signals",
    ...cover.signals.map((signal) => `- [${signal.status}] ${signal.label}: ${signal.value}. ${signal.evidence} Link: ${signal.href}`)
  ].join("\n");
}

function buildBuyerCoverSheet(room: LaunchRoomBeforeCoverSheet): LaunchRoomBuyerCoverSheet {
  const status = buyerCoverStatus(room.buyerDecision.verdict);
  const blocker = room.buyerDecision.checks.find((check) => check.status === "blocked") ?? room.buyerDecision.checks.find((check) => check.status === "attention");
  const deliveryMemo = room.artifacts.find((artifact) => artifact.id === "delivery-memo");
  const buyerValue = room.artifacts.find((artifact) => artifact.id === "buyer-value");
  const pilotRun = room.artifacts.find((artifact) => artifact.id === "pilot-run-receipt");
  const trustCenter = room.artifacts.find((artifact) => artifact.id === "trust-center");
  const measuredPilot = room.buyerDecision.checks.find((check) => check.id === "measured-pilot");
  const operatingGates = room.buyerDecision.checks.find((check) => check.id === "operating-gates");
  const replyRoute =
    room.handoffPacket.replyRoutes.find((route) => route.id === room.handoffPacket.recommendedReply) ?? room.handoffPacket.replyRoutes[0];
  const signals: LaunchRoomBuyerCoverSignal[] = [
    {
      id: "buyer-ask",
      label: "Buyer ask",
      status: room.buyerDecision.status,
      value: room.buyerDecision.buyerQuestion,
      evidence: room.handoffPacket.sendInstruction,
      href: deliveryMemo?.href ?? room.nextAction.href
    },
    {
      id: "value-proof",
      label: "Value proof",
      status: room.primaryMetric.status,
      value: room.primaryMetric.value,
      evidence: room.primaryMetric.evidence,
      href: buyerValue?.href ?? room.nextAction.href
    },
    {
      id: "measured-proof",
      label: "Measured proof",
      status: measuredPilot?.status ?? "blocked",
      value: measuredPilot?.value ?? "missing",
      evidence: measuredPilot?.evidence ?? "Measured pilot evidence is missing.",
      href: pilotRun?.href ?? room.nextAction.href
    },
    {
      id: "trust-boundary",
      label: "Trust boundary",
      status: operatingGates?.status ?? "blocked",
      value: operatingGates?.value ?? "missing",
      evidence: operatingGates?.evidence ?? "Operating gates are missing.",
      href: trustCenter?.href ?? room.nextAction.href
    },
    ...(room.acceptancePath
      ? [
          {
            id: "acceptance-path" as const,
            label: "Acceptance path",
            status: acceptancePathStatus(room.acceptancePath) ?? "blocked",
            value: acceptancePathValue(room.acceptancePath),
            evidence: acceptancePathEvidence(room.acceptancePath),
            href: room.acceptancePath.verifierUrl
          }
        ]
      : []),
    {
      id: "reply-route",
      label: "Reply route",
      status: replyRoute?.status ?? "blocked",
      value: replyRoute?.label ?? "No route",
      evidence: replyRoute ? `${replyRoute.record} ${replyRoute.nextAction}` : "No reply route has been selected.",
      href: room.handoffPacket.decisionReceipt.href
    }
  ];
  const partial: Omit<LaunchRoomBuyerCoverSheet, "copyText" | "href"> = {
    status,
    headline: buyerCoverHeadline(status, blocker),
    buyerPromise: buyerCoverPromise(room),
    primaryAsk: buyerCoverPrimaryAsk(room, status),
    doNotSendIf: buyerCoverDoNotSendIf(status, blocker),
    reviewTime: reviewTimeForAgenda(room.handoffPacket.agenda),
    signals
  };
  const copyText = buildBuyerCoverSheetCopyText(partial);

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}

function artifactFor(room: Pick<LaunchRoom, "artifacts" | "nextAction">, artifactId: string) {
  return room.artifacts.find((artifact) => artifact.id === artifactId);
}

function decisionCheckFor(room: Pick<LaunchRoom, "buyerDecision">, checkId: LaunchRoomDecisionCheck["id"]) {
  return room.buyerDecision.checks.find((check) => check.id === checkId);
}

function buildStakeholderBriefCopyText(brief: Omit<LaunchRoomStakeholderBrief, "copyText" | "href">) {
  return [
    `# ${brief.role}`,
    "",
    `Status: ${brief.status}`,
    `Owner: ${brief.owner}`,
    "",
    "## Decision ask",
    brief.decisionAsk,
    "",
    "## Proof to open",
    `${brief.proofToOpen}: ${brief.artifactHref}`,
    "",
    "## Likely concern",
    brief.concern,
    "",
    "## Response",
    brief.response,
    "",
    "## Next action",
    brief.nextAction
  ].join("\n");
}

function stakeholderBrief(partial: Omit<LaunchRoomStakeholderBrief, "copyText" | "href">): LaunchRoomStakeholderBrief {
  const copyText = buildStakeholderBriefCopyText(partial);

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}

function buildStakeholderBriefs(room: LaunchRoomBeforeStakeholderBriefs): LaunchRoomStakeholderBrief[] {
  const buyerValue = artifactFor(room, "buyer-value");
  const pilotRun = artifactFor(room, "pilot-run-receipt");
  const adoption = artifactFor(room, "adoption-plan");
  const trust = artifactFor(room, "trust-center");
  const commercial = artifactFor(room, "commercial-offer");
  const deliveryMemo = artifactFor(room, "delivery-memo");
  const valueCheck = decisionCheckFor(room, "value-case");
  const measuredCheck = decisionCheckFor(room, "measured-pilot");
  const liveProofCheck = decisionCheckFor(room, "live-proof");
  const operatingCheck = decisionCheckFor(room, "operating-gates");
  const acceptanceCheck = decisionCheckFor(room, "acceptance-path");
  const recommendedRoute =
    room.handoffPacket.replyRoutes.find((route) => route.id === room.handoffPacket.recommendedReply) ?? room.handoffPacket.replyRoutes[0];

  return [
    stakeholderBrief({
      id: "economic-buyer",
      role: "Economic buyer brief",
      status: worstStatus(valueCheck?.status ?? "blocked", commercial?.status ?? "blocked"),
      owner: room.targetBuyer,
      decisionAsk: room.buyerDecision.verdict === "send" ? "Approve the bounded pilot on measured value and explicit spend guardrails." : "Decide whether the value case is strong enough to keep sponsor review moving.",
      proofToOpen: buyerValue?.label ?? "Buyer value memo",
      concern: "Will the modeled value justify the first commitment and renewal conversation?",
      response: `${room.primaryMetric.value} modeled monthly value. ${valueCheck?.evidence ?? room.primaryMetric.evidence} ${commercial?.proof ?? "Commercial guardrails are not ready yet."}`,
      nextAction: room.buyerDecision.verdict === "send" ? recommendedRoute?.nextAction ?? room.nextAction.action : room.nextAction.action,
      artifactHref: buyerValue?.href ?? room.nextAction.href
    }),
    stakeholderBrief({
      id: "security-reviewer",
      role: "Security reviewer brief",
      status: worstStatus(operatingCheck?.status ?? "blocked", trust?.status ?? "blocked", liveProofCheck?.status ?? "blocked"),
      owner: trust?.owner ?? "Security reviewer",
      decisionAsk: "Confirm the data boundary, public proof surface, and stop rules before any buyer expansion.",
      proofToOpen: trust?.label ?? "Buyer trust center",
      concern: "Does the pilot expose private data or rely on proof that cannot be audited later?",
      response: `${operatingCheck?.evidence ?? "Operating gates are missing."} ${trust?.proof ?? "Trust center proof is missing."} Live proof: ${room.proofHealth.summary}`,
      nextAction: trust?.status === "ready" && room.proofHealth.status === "ready" ? "Keep the trust center attached to the buyer room and recheck live proof before each review." : room.proofHealth.instruction,
      artifactHref: trust?.href ?? room.nextAction.href
    }),
    stakeholderBrief({
      id: "pilot-operator",
      role: "Pilot operator brief",
      status: worstStatus(measuredCheck?.status ?? "blocked", adoption?.status ?? "blocked"),
      owner: adoption?.owner ?? pilotRun?.owner ?? "Pilot operator",
      decisionAsk: "Run the first workflow with a named owner, measured receipt, adoption cadence, and day-30 stop or expand gate.",
      proofToOpen: adoption?.label ?? "Adoption operating plan",
      concern: "Will this survive the first week after the demo without the builder in the room?",
      response: `${measuredCheck?.evidence ?? "Measured pilot evidence is missing."} ${adoption?.proof ?? "Adoption operating proof is missing."}`,
      nextAction: adoption?.status === "ready" ? "Import the operating calendar, keep the success ledger current, and review the day-30 receipt." : room.nextAction.action,
      artifactHref: adoption?.href ?? pilotRun?.href ?? room.nextAction.href
    }),
    stakeholderBrief({
      id: "procurement-owner",
      role: "Procurement owner brief",
      status: worstStatus(room.buyerDecision.status, commercial?.status ?? "blocked", recommendedRoute?.status ?? "blocked", acceptanceCheck?.status ?? "ready"),
      owner: commercial?.owner ?? "Procurement owner",
      decisionAsk: "Record approve, revise, or hold with a checksum-backed handoff receipt and bounded commercial terms.",
      proofToOpen: deliveryMemo?.label ?? "Buyer delivery memo",
      concern: "Can procurement see scope, price, decision route, and replayable proof without another meeting?",
      response: `${commercial?.proof ?? "Commercial offer is missing."} ${
        acceptanceCheck ? `Acceptance path: ${acceptanceCheck.evidence}` : "No acceptance path receipt is attached."
      } Recommended reply: ${room.handoffPacket.recommendedReply}. Receipt ${room.handoffPacket.decisionReceipt.receiptId}.`,
      nextAction: recommendedRoute?.nextAction ?? room.handoffPacket.sendInstruction,
      artifactHref: deliveryMemo?.href ?? commercial?.href ?? room.nextAction.href
    })
  ];
}

function buildBuyerActivityTrailCopyText(
  trail: Pick<LaunchRoomBuyerActivityTrail, "status" | "summary" | "nextOwner" | "nextAction" | "events"> & {
    followUpReceipt?: LaunchRoomFollowUpReceipt;
  }
) {
  return [
    "# Buyer activity trail",
    "",
    `Status: ${trail.status}`,
    `Summary: ${trail.summary}`,
    `Next owner: ${trail.nextOwner}`,
    `Next action: ${trail.nextAction}`,
    "",
    "## Events",
    ...trail.events.map((event) => [
      `### ${event.label}`,
      `- Status: ${event.status}`,
      `- Actor: ${event.actor}`,
      `- Signal: ${event.signal}`,
      `- Evidence: ${event.evidence}`,
      `- Next action: ${event.nextAction}`,
      `- Link: ${event.href}`
    ].join("\n")),
    "",
    ...(trail.followUpReceipt
      ? [
          "## Follow-up receipt",
          `- Receipt: ${trail.followUpReceipt.receiptId}`,
          `- Checksum: ${trail.followUpReceipt.checksumAlgorithm}:${trail.followUpReceipt.checksum}`,
          `- Verification: ${trail.followUpReceipt.verification.status}`,
          `- API verification: POST ${trail.followUpReceipt.verificationApiPath}`,
          "Replay rule: Recompute fnv1a-64 over the CRM note, Slack update, task CSV, and event log before accepting forwarded follow-up records."
        ]
      : [])
  ].join("\n");
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildBuyerActivityTaskCsv(events: LaunchRoomBuyerActivityEvent[]) {
  const rows = [
    ["eventId", "label", "status", "actor", "signal", "nextAction", "evidence", "href"],
    ...events.map((event) => [event.id, event.label, event.status, event.actor, event.signal, event.nextAction, event.evidence, event.href])
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function buildBuyerActivityCrmNote(
  trail: Omit<LaunchRoomBuyerActivityTrail, "copyText" | "href" | "crmNote" | "crmNoteHref" | "slackUpdate" | "slackUpdateHref" | "taskCsv" | "taskCsvHref" | "followUpReceipt">
) {
  return [
    "# Buyer follow-up CRM note",
    "",
    `Stage: ${trail.status}`,
    `Summary: ${trail.summary}`,
    `Next owner: ${trail.nextOwner}`,
    `Next action: ${trail.nextAction}`,
    "",
    "Open items:",
    ...trail.events
      .filter((event) => event.status !== "ready")
      .map((event) => `- [${event.status}] ${event.label} / ${event.actor}: ${event.nextAction}`),
    "",
    "Evidence log:",
    ...trail.events.map((event) => `- ${event.label}: ${event.evidence} (${event.href})`)
  ].join("\n");
}

function buildBuyerActivitySlackUpdate(
  trail: Omit<LaunchRoomBuyerActivityTrail, "copyText" | "href" | "crmNote" | "crmNoteHref" | "slackUpdate" | "slackUpdateHref" | "taskCsv" | "taskCsvHref" | "followUpReceipt">
) {
  const blockers = trail.events.filter((event) => event.status === "blocked");
  const warnings = trail.events.filter((event) => event.status === "attention");
  const riskLine = blockers.length > 0 ? `${blockers.length} blocked` : warnings.length > 0 ? `${warnings.length} review` : "no blockers";
  return [
    `Buyer follow-up: ${trail.status} (${riskLine})`,
    trail.summary,
    `Next: ${trail.nextOwner} - ${trail.nextAction}`,
    `Receipt: ${trail.events.find((event) => event.id === "decision-receipt-sealed")?.signal ?? "not sealed"}`
  ].join("\n");
}

const FOLLOW_UP_RECEIPT_REPLAY_FIELDS = ["launchRoomId", "targetBuyer", "trailStatus", "headline", "summary", "nextOwner", "nextAction", "events", "exports"];

function buildFollowUpReceiptMarkdown(receipt: Omit<LaunchRoomFollowUpReceipt, "copyText" | "href">) {
  return [
    "# Buyer follow-up receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Status: ${receipt.status}`,
    `Target buyer: ${receipt.targetBuyer}`,
    `Owner: ${receipt.owner}`,
    `Summary: ${receipt.summary}`,
    "",
    "## Replay fields",
    ...receipt.replayFields.map((field) => `- ${field}`),
    "",
    "## Replay payload",
    "```json",
    receipt.replayPayloadJson,
    "```",
    "",
    "## Verification",
    `- Status: ${receipt.verification.status}`,
    `- Expected checksum: ${receipt.verification.expectedChecksum}`,
    `- Actual checksum: ${receipt.verification.actualChecksum}`,
    `- Instruction: ${receipt.verification.instruction}`,
    "",
    "## API verification",
    `POST ${receipt.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    canonicalJson({ checksum: receipt.checksum, replayPayload: receipt.replayPayload }),
    "```",
    "",
    "Replay rule: Recompute fnv1a-64 over the CRM note, Slack update, task CSV, and event log before accepting forwarded follow-up records."
  ].join("\n");
}

function buildFollowUpReceipt(input: {
  launchRoomId: string;
  targetBuyer: string;
  trail: Pick<LaunchRoomBuyerActivityTrail, "status" | "headline" | "summary" | "nextOwner" | "nextAction" | "events" | "crmNote" | "slackUpdate" | "taskCsv">;
}): LaunchRoomFollowUpReceipt {
  const replayPayload: LaunchRoomFollowUpReceiptPayload = {
    launchRoomId: input.launchRoomId,
    targetBuyer: input.targetBuyer,
    trailStatus: input.trail.status,
    headline: input.trail.headline,
    summary: input.trail.summary,
    nextOwner: input.trail.nextOwner,
    nextAction: input.trail.nextAction,
    events: input.trail.events,
    exports: {
      crmNote: input.trail.crmNote,
      slackUpdate: input.trail.slackUpdate,
      taskCsv: input.trail.taskCsv
    }
  };
  const checksum = stableDigest(replayPayload);
  const replayPayloadJson = canonicalJson(replayPayload);
  const verification = verifyLaunchRoomFollowUpReceipt({ checksum, replayPayload });
  const partial: Omit<LaunchRoomFollowUpReceipt, "copyText" | "href"> = {
    receiptId: `launch-follow-up-${input.trail.status}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: LAUNCH_ROOM_FOLLOW_UP_RECEIPT_VERIFY_PATH,
    status: input.trail.status,
    targetBuyer: input.targetBuyer,
    owner: input.trail.nextOwner,
    summary: input.trail.summary,
    replayFields: FOLLOW_UP_RECEIPT_REPLAY_FIELDS,
    replayPayload,
    replayPayloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(replayPayloadJson)}`,
    verification
  };
  const copyText = buildFollowUpReceiptMarkdown(partial);

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}

function activityTrailHeadline(status: LaunchRoomStatus) {
  if (status === "ready") return "Buyer follow-up is ready to track across stakeholders";
  if (status === "attention") return "Buyer follow-up needs one recorded revision before approval";
  return "Buyer follow-up stays internal until the blocker is cleared";
}

function activityTrailSummary(input: {
  events: LaunchRoomBuyerActivityEvent[];
  recommendedReply: LaunchRoomHandoffReplyRouteId;
}) {
  const readyCount = input.events.filter((event) => event.status === "ready").length;
  const attentionCount = input.events.filter((event) => event.status === "attention").length;
  const blockedCount = input.events.filter((event) => event.status === "blocked").length;
  return `${readyCount}/${input.events.length} events ready; ${attentionCount} need review and ${blockedCount} are blocked. Recommended reply: ${input.recommendedReply}.`;
}

function buildBuyerActivityTrail(room: LaunchRoomBeforeActivityTrail): LaunchRoomBuyerActivityTrail {
  const recommendedRoute =
    room.handoffPacket.replyRoutes.find((route) => route.id === room.handoffPacket.recommendedReply) ?? room.handoffPacket.replyRoutes[0];
  const receipt = room.handoffPacket.decisionReceipt;
  const events: LaunchRoomBuyerActivityEvent[] = [
    {
      id: "cover-sheet-prepared",
      label: "Cover sheet prepared",
      status: room.buyerDecision.status,
      actor: room.nextAction.owner,
      signal: room.buyerCoverSheet.headline,
      evidence: room.buyerCoverSheet.buyerPromise,
      nextAction: room.buyerCoverSheet.primaryAsk,
      href: room.buyerCoverSheet.href
    },
    ...room.stakeholderBriefs.map((brief): LaunchRoomBuyerActivityEvent => ({
      id: brief.id,
      label: brief.role,
      status: brief.status,
      actor: brief.owner,
      signal: brief.decisionAsk,
      evidence: `${brief.proofToOpen}: ${brief.response}`,
      nextAction: brief.nextAction,
      href: brief.artifactHref
    })),
    ...(room.acceptancePath
      ? [
          {
            id: "acceptance-path-attached" as const,
            label: "Acceptance path attached",
            status: acceptancePathStatus(room.acceptancePath) ?? "blocked",
            actor: room.acceptancePath.buyer || room.targetBuyer,
            signal: `${room.acceptancePath.decision} / ${room.acceptancePath.pathStatus}`,
            evidence: acceptancePathEvidence(room.acceptancePath),
            nextAction: acceptancePathStatus(room.acceptancePath) === "ready" ? "Keep this receipt attached to the launch-room handoff." : room.acceptancePath.nextAction,
            href: room.acceptancePath.verifierUrl
          }
        ]
      : []),
    {
      id: "reply-route-recorded",
      label: "Reply route recorded",
      status: recommendedRoute?.status ?? "blocked",
      actor: recommendedRoute?.owner ?? receipt.owner,
      signal: recommendedRoute?.label ?? "No recommended reply",
      evidence: recommendedRoute?.record ?? "No reply route is ready.",
      nextAction: recommendedRoute?.nextAction ?? room.handoffPacket.sendInstruction,
      href: receipt.href
    },
    {
      id: "decision-receipt-sealed",
      label: "Decision receipt sealed",
      status: receipt.status,
      actor: receipt.owner,
      signal: `Receipt ${receipt.receiptId}`,
      evidence: `Verification ${receipt.verification.status}; checksum ${receipt.checksumAlgorithm}:${receipt.checksum}.`,
      nextAction: receipt.nextAction,
      href: receipt.href
    }
  ];
  const status = worstStatus(...events.map((event) => event.status));
  const nextEvent = events.find((event) => event.status === "blocked") ?? events.find((event) => event.status === "attention") ?? events.find((event) => event.id === "reply-route-recorded") ?? events[0];
  const partial: Omit<LaunchRoomBuyerActivityTrail, "copyText" | "href" | "followUpReceipt"> = {
    status,
    headline: activityTrailHeadline(status),
    summary: activityTrailSummary({ events, recommendedReply: room.handoffPacket.recommendedReply }),
    nextOwner: nextEvent?.actor ?? room.nextAction.owner,
    nextAction: nextEvent?.nextAction ?? room.nextAction.action,
    events,
    crmNote: "",
    crmNoteHref: "",
    slackUpdate: "",
    slackUpdateHref: "",
    taskCsv: "",
    taskCsvHref: ""
  };
  const portable = {
    status: partial.status,
    headline: partial.headline,
    summary: partial.summary,
    nextOwner: partial.nextOwner,
    nextAction: partial.nextAction,
    events: partial.events
  };
  const crmNote = buildBuyerActivityCrmNote(portable);
  const slackUpdate = buildBuyerActivitySlackUpdate(portable);
  const taskCsv = buildBuyerActivityTaskCsv(events);
  const followUpReceipt = buildFollowUpReceipt({
    launchRoomId: room.id,
    targetBuyer: room.targetBuyer,
    trail: {
      ...portable,
      crmNote,
      slackUpdate,
      taskCsv
    }
  });
  const copyText = buildBuyerActivityTrailCopyText({ ...partial, followUpReceipt });

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`,
    crmNote,
    crmNoteHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(crmNote)}`,
    slackUpdate,
    slackUpdateHref: `data:text/plain;charset=utf-8,${encodeURIComponent(slackUpdate)}`,
    taskCsv,
    taskCsvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(taskCsv)}`,
    followUpReceipt
  };
}

function tone(status: string) {
  if (["buyer-ready", "ready", "sendable"].includes(status)) return "good";
  if (["blocked", "needs-value", "needs-work-order", "hold"].includes(status)) return "bad";
  return "watch";
}

function cleanBaseUrl(baseUrl = "") {
  return baseUrl.replace(/\/$/, "");
}

function absolutePath(baseUrl: string, path: string, query = "") {
  return `${cleanBaseUrl(baseUrl)}${path}${query}`;
}

export function launchRoomEditAnchorFor(artifactId: string) {
  if (artifactId === "buyer-value") return "#buyer-value-simulator";
  if (artifactId === "work-order-brief") return "#buyer-work-order-studio";
  if (artifactId === "delivery-memo") return "#marketplace-workbench";
  if (artifactId === "buyer-proof-packet") return "#launch-evidence-console";
  if (artifactId === "live-proof-audit") return "#launch-evidence-console";
  if (artifactId === "sponsor-review") return "#sponsor-review-room";
  if (artifactId === "pilot-run-receipt") return "#pilot-run-receipt";
  if (artifactId === "adoption-plan") return "#adoption-operating-plan";
  if (artifactId === "trust-center") return "#buyer-trust-center";
  if (artifactId === "commercial-offer") return "#commercial-offer";
  if (artifactId === "buyer-pilot-contract") return "#commercial-offer";
  return "#marketplace-workbench";
}

function workspaceEditHrefFor(artifactId: string, appUrl?: string) {
  const anchor = launchRoomEditAnchorFor(artifactId);
  if (!appUrl) return anchor;
  return `${appUrl.replace(/#.*$/, "")}${anchor}`;
}

function setNumber(params: URLSearchParams, key: string, value: number) {
  params.set(key, String(value));
}

function artifactQuery(workspace: WorkspaceDraft) {
  const params = new URLSearchParams();
  params.set("brief", workspace.projectBrief);
  if (workspace.selectedAgentIds.length > 0) params.set("agents", workspace.selectedAgentIds.join(","));
  if (workspace.targetUrl) params.set("targetUrl", workspace.targetUrl);
  if (workspace.protopediaUrl) params.set("protopediaUrl", workspace.protopediaUrl);
  if (workspace.videoUrl) params.set("videoUrl", workspace.videoUrl);
  if (workspace.customAgents.length > 0) params.set("customAgents", encodeCustomAgentsParam(workspace.customAgents));
  if (workspace.agentTrialEvidence.length > 0) params.set("trialEvidence", encodeAgentTrialEvidenceParam(workspace.agentTrialEvidence));

  setNumber(params, "teamSize", workspace.buyerScenario.teamSize);
  setNumber(params, "hourlyCostYen", workspace.buyerScenario.hourlyCostYen);
  setNumber(params, "cyclesPerMonth", workspace.buyerScenario.cyclesPerMonth);
  setNumber(params, "manualHoursPerCycle", workspace.buyerScenario.manualHoursPerCycle);
  setNumber(params, "adoptionRatePercent", workspace.buyerScenario.adoptionRatePercent);
  setNumber(params, "incidentRiskYenPerMonth", workspace.buyerScenario.incidentRiskYenPerMonth);

  setNumber(params, "pilotManualMinutes", workspace.pilotRun.observedManualMinutes);
  setNumber(params, "pilotAssistedMinutes", workspace.pilotRun.observedAssistedMinutes);
  setNumber(params, "pilotParticipants", workspace.pilotRun.participants);
  setNumber(params, "pilotAcceptedTasks", workspace.pilotRun.acceptedTasks);
  setNumber(params, "pilotTotalTasks", workspace.pilotRun.totalTasks);
  if (workspace.pilotRun.evidenceUrl) params.set("pilotEvidenceUrl", workspace.pilotRun.evidenceUrl);
  if (workspace.pilotRun.reviewerName) params.set("pilotReviewer", workspace.pilotRun.reviewerName);
  if (workspace.pilotRun.notes) params.set("pilotNotes", workspace.pilotRun.notes);

  params.set("workOrder", workspace.buyerWorkOrder.request);
  if (workspace.buyerWorkOrder.targetUser) params.set("workOrderTargetUser", workspace.buyerWorkOrder.targetUser);
  params.set("workOrderSuccessMetric", workspace.buyerWorkOrder.successMetric);
  params.set("workOrderBaseline", workspace.buyerWorkOrder.currentBaseline);
  params.set("workOrderDataSensitivity", workspace.buyerWorkOrder.dataSensitivity);
  if (workspace.buyerWorkOrder.evidenceUrl) params.set("workOrderEvidenceUrl", workspace.buyerWorkOrder.evidenceUrl);

  const query = params.toString();
  return query ? `?${query}` : "";
}

function proofLinksForWorkspace(workspace: WorkspaceDraft) {
  return [
    { id: "targetUrl", label: "Deployed URL", value: workspace.targetUrl, href: "#launch-evidence-console" },
    { id: "protopediaUrl", label: "ProtoPedia URL", value: workspace.protopediaUrl, href: "#launch-evidence-console" },
    { id: "videoUrl", label: "Walkthrough video", value: workspace.videoUrl, href: "#launch-evidence-console" },
    { id: "pilotEvidenceUrl", label: "Pilot receipt", value: workspace.pilotRun.evidenceUrl, href: "#pilot-run-receipt" },
    { id: "workOrderEvidenceUrl", label: "Work order proof", value: workspace.buyerWorkOrder.evidenceUrl, href: "#buyer-work-order-studio" }
  ];
}

function quickAuditProofVerificationForWorkspace(workspace: WorkspaceDraft, receipt: LaunchRoomQuickAuditReceipt | undefined): BuyerShareGateProofVerificationSummary | null {
  if (!receipt) return workspace.proofVerification;
  const proofLinks = proofLinksForWorkspace(workspace);
  const allLinksAttached = proofLinks.every((link) => link.value.trim().startsWith("https://"));
  if (!allLinksAttached || receipt.verifiedCount !== proofLinks.length || receipt.totalCount !== proofLinks.length) {
    return workspace.proofVerification;
  }

  return {
    checkedAt: receipt.checkedAt,
    verifiedCount: receipt.verifiedCount,
    totalCount: receipt.totalCount,
    score: receipt.score,
    results: proofLinks.map((link) => ({
      id: link.id,
      label: link.label,
      status: "pass" as const,
      httpStatus: 200,
      evidence: `Quick intake live proof receipt ${receipt.receiptId} verified this public URL at ${receipt.checkedAt}.`,
      action: "Keep this verified proof URL attached and recheck before the next buyer review."
    }))
  };
}

function readinessFor(input: {
  outcomeReadiness: string;
  workOrderReadiness: string;
  operatingArtifactStatuses?: LaunchRoomStatus[];
}): LaunchRoomReadiness {
  if (input.outcomeReadiness === "needs-value") return "needs-value";
  if (input.workOrderReadiness === "blocked" || input.workOrderReadiness === "needs-scope") return "needs-work-order";
  if (input.outcomeReadiness === "needs-proof" || input.workOrderReadiness === "needs-proof") return "needs-proof";
  if (input.operatingArtifactStatuses?.some((status) => status !== "ready")) return "needs-proof";
  return "buyer-ready";
}

function nextArtifactFor(readiness: LaunchRoomReadiness, artifacts: LaunchRoomArtifact[], openArtifacts: LaunchRoomArtifact[]) {
  const actionableOpenArtifacts = openArtifacts.filter((artifact) => artifact.id !== "delivery-memo");
  if (readiness === "needs-value") return artifacts.find((artifact) => artifact.id === "buyer-value") ?? openArtifacts[0];
  if (readiness === "needs-work-order") return artifacts.find((artifact) => artifact.id === "work-order-brief") ?? openArtifacts[0];
  if (readiness === "needs-proof") return actionableOpenArtifacts.find((artifact) => artifact.status === "blocked") ?? actionableOpenArtifacts[0] ?? openArtifacts[0];
  return artifacts.find((artifact) => artifact.id === "delivery-memo") ?? artifacts.find((artifact) => artifact.id === "buyer-proof-packet") ?? artifacts[0];
}

function headlineFor(readiness: LaunchRoomReadiness) {
  if (readiness === "buyer-ready") return "Buyer-facing launch room is ready";
  if (readiness === "needs-proof") return "Value is credible; public proof still needs closure";
  if (readiness === "needs-work-order") return "The public story needs a sharper work order";
  return "The launch room still needs a stronger buyer value case";
}

function hardTruthFor(input: { readiness: LaunchRoomReadiness; openArtifacts: LaunchRoomArtifact[]; outcomeHardTruth: string; workOrderHardTruth: string }) {
  if (input.readiness === "buyer-ready") {
    return "An outside reviewer can inspect the buyer delivery memo, buyer value, work order, proof packet, live proof audit, sponsor review, measured pilot receipt, adoption plan, trust center, commercial offer, and pilot contract from one public room.";
  }
  if (input.readiness === "needs-work-order") return input.workOrderHardTruth;
  if (input.readiness === "needs-value") return input.outcomeHardTruth;
  const first = input.openArtifacts[0];
  return first ? `${input.openArtifacts.length} artifact${input.openArtifacts.length === 1 ? "" : "s"} still need public proof. Start with ${first.label}.` : input.outcomeHardTruth;
}

function metricStatus(status: LaunchRoomStatus): LaunchRoomStatus {
  return status;
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function selectedAgents(agents: MarketAgent[]): LaunchRoomAgent[] {
  return agents.slice(0, 4).map((agent) => ({
    id: agent.id,
    name: agent.name,
    role: agent.outcome,
    proof: agent.a2aSkillIds[0] ?? agent.mcp[0]?.tools[0] ?? "agent capability"
  }));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return value;
}

function stableDigest(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

function escapeScriptJson(value: unknown) {
  return canonicalJson(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function renderHandoffEmailLine(line: string, compactHref: (href: string) => string = (href) => href) {
  const deliveryMemoPrefix = "Delivery memo: ";
  if (line.startsWith(deliveryMemoPrefix)) {
    const url = line.slice(deliveryMemoPrefix.length).replace(/\.$/, "");
    if (/^https?:\/\//.test(url)) {
      return `<p><strong>Delivery memo:</strong> <a href="${escapeHtml(compactHref(url))}">Open delivery memo</a>.</p>`;
    }
  }

  return `<p>${escapeHtml(line)}</p>`;
}

export function verifyLaunchRoomHandoffDecisionReceipt(receipt: Pick<LaunchRoomHandoffDecisionReceipt, "checksum" | "replayPayload">): LaunchRoomHandoffDecisionReceiptVerification {
  const actualChecksum = stableDigest(receipt.replayPayload);
  const verified = actualChecksum === receipt.checksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum: receipt.checksum,
    actualChecksum,
    instruction: verified
      ? "Receipt checksum matches the attached replay payload."
      : "Receipt checksum does not match the attached replay payload. Do not accept this handoff decision until the source launch room is re-exported."
  };
}

export function verifyLaunchRoomFollowUpReceipt(receipt: Pick<LaunchRoomFollowUpReceipt, "checksum" | "replayPayload">): LaunchRoomFollowUpReceiptVerification {
  const actualChecksum = stableDigest(receipt.replayPayload);
  const verified = actualChecksum === receipt.checksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum: receipt.checksum,
    actualChecksum,
    instruction: verified
      ? "Follow-up receipt checksum matches the attached CRM note, Slack update, task CSV, and event log."
      : "Follow-up receipt checksum does not match the attached replay payload. Do not accept forwarded follow-up records until the source launch room is re-exported."
  };
}

function closureCopyFor(artifact: LaunchRoomArtifact) {
  switch (artifact.id) {
    case "buyer-value":
      return {
        action: "Tune the value model until the buyer can see base, downside, and break-even economics without a sales explanation.",
        acceptanceSignal: "Buyer Value Report shows monthly value, payback, break-even adoption, and downside risk in one public page.",
        proofToAttach: "Modeled ROI assumptions, sensitivity case, and the smallest credible pilot cap."
      };
    case "work-order-brief":
      return {
        action: "Sharpen the delegated work into one bounded pilot request with a named user, success metric, baseline, data boundary, and evidence URL.",
        acceptanceSignal: "Work Order Brief makes the agent assignment and stop/revise/continue criteria inspectable before kickoff.",
        proofToAttach: "Public receipt, issue, run log, recording, or artifact URL for the work order."
      };
    case "delivery-memo":
      return {
        action: "Open the memo to see the exact buyer-share decision, then fix the named open risk before using it externally.",
        acceptanceSignal: "Buyer Delivery Memo decision reads send-to-buyer and every proof row is verified.",
        proofToAttach: "Verified launch URL, ProtoPedia URL, walkthrough video, pilot receipt, and work order evidence."
      };
    case "buyer-proof-packet":
      return {
        action: "Collect the proof that an outside buyer cannot infer from the dashboard: deployed URL, ProtoPedia URL, walkthrough video, and accepted A2A trial evidence.",
        acceptanceSignal: "Buyer Proof Packet can answer value, implementation, usability, and operating-risk objections from public evidence.",
        proofToAttach: "Cloud Run URL, ProtoPedia URL, walkthrough video URL, accepted A2A receipt, and pilot receipt URL."
      };
    case "live-proof-audit":
      return {
        action: "Run the live proof audit after every public URL change and repair the first blocked or unstable proof lane it reports.",
        acceptanceSignal: "Live Proof Audit shows the deployed URL, ProtoPedia story, walkthrough video, pilot receipt, and work order proof are externally reachable.",
        proofToAttach: "Buyer proof audit JSON, Markdown export, and the current repair queue."
      };
    case "sponsor-review":
      return {
        action: "Give the sponsor a decision room with approve, revise, and stop criteria tied to the proof packet.",
        acceptanceSignal: "Sponsor Review Room can approve or reject the pilot without asking for a separate status meeting.",
        proofToAttach: "Decision matrix, proof packet, receipt summary, and next owner."
      };
    case "pilot-run-receipt":
      return {
        action: "Run or import one measured pilot and attach observed manual minutes, assisted minutes, accepted tasks, reviewer, and evidence URL.",
        acceptanceSignal: "Pilot Run Receipt shows measured time saved and acceptance quality, not only projected ROI.",
        proofToAttach: "Reviewer name, accepted task count, pilot evidence URL, and notes from the measured run."
      };
    case "adoption-plan":
      return {
        action: "Assign the first-week owner commitments and cadence so the buyer sees how the pilot survives kickoff.",
        acceptanceSignal: "Adoption Operating Plan names owners, cadence, health checks, and escalation gates for week one.",
        proofToAttach: "Owner commitments, rollout cadence, health signals, and escalation path."
      };
    case "trust-center":
      return {
        action: "Make the data boundary, security owner, retention stance, and evidence limits explicit before sharing externally.",
        acceptanceSignal: "Buyer Trust Center states what data is used, what is excluded, who owns review, and where proof lives.",
        proofToAttach: "Security owner, data sensitivity, retention posture, evidence URL, and known limitations."
      };
    case "commercial-offer":
      return {
        action: "Turn the pilot into a bounded offer with cap, renewal gate, trust gate, and stop condition.",
        acceptanceSignal: "Commercial Offer is safe for procurement: price, scope, success gate, and renewal trigger are visible.",
        proofToAttach: "Pilot cap, recommended tier, acceptance gate, trust gate, and renewal condition."
      };
    case "buyer-pilot-contract":
      return {
        action: "Open the pilot contract and confirm the buyer can approve scope, first commitment, proof, trust, owner, renewal, and stop rules from one receipt-backed artifact.",
        acceptanceSignal: "Buyer Pilot Contract verifies the contract checksum and all contract milestones are clear before external approval.",
        proofToAttach: "Contract receipt, commercial offer checksum, scope, price, measured proof, trust boundary, adoption owner, and renewal stop rule."
      };
    default:
      return {
        action: `Open ${artifact.label} and close the gap that keeps it from buyer-ready status.`,
        acceptanceSignal: `${artifact.label} has a public owner, evidence URL, and buyer-facing proof summary.`,
        proofToAttach: artifact.proof
      };
  }
}

function buildClosurePlan(artifacts: LaunchRoomArtifact[], appUrl?: string): LaunchRoomClosureStep[] {
  const openArtifacts = artifacts.filter((artifact) => artifact.id !== "workspace" && artifact.status !== "ready");
  if (openArtifacts.length === 0) {
    const pilotReview = artifacts.find((artifact) => artifact.id === "sponsor-review") ?? artifacts[0];
    return [
      {
        id: "closure-ready",
        artifactId: pilotReview.id,
        label: "Start buyer pilot review",
        href: pilotReview.href,
        editHref: workspaceEditHrefFor(pilotReview.id, appUrl),
        status: "ready",
        owner: pilotReview.owner,
        action: "Send the public launch room to the sponsor and use the room as the pilot kickoff source of truth.",
        acceptanceSignal: "Sponsor can approve, revise, or stop the pilot from one public room.",
        proofToAttach: "No missing launch-room proof remains."
      }
    ];
  }

  return openArtifacts.map((artifact, index) => {
    const copy = closureCopyFor(artifact);
    return {
      id: `closure-${index + 1}-${artifact.id}`,
      artifactId: artifact.id,
      label: artifact.label,
      href: artifact.href,
      editHref: workspaceEditHrefFor(artifact.id, appUrl),
      status: artifact.status,
      owner: artifact.owner,
      action: copy.action,
      acceptanceSignal: copy.acceptanceSignal,
      proofToAttach: copy.proofToAttach
    };
  });
}

function buildMarkdown(room: Omit<LaunchRoom, "exportMarkdown">) {
  return [
    `# ${room.headline}`,
    "",
    `Readiness: ${room.readiness}`,
    `Launch score: ${room.launchScore}/100`,
    `Target buyer: ${room.targetBuyer}`,
    "",
    room.hardTruth,
    "",
    "## Primary metric",
    `- ${room.primaryMetric.label}: ${room.primaryMetric.value}`,
    `- Evidence: ${room.primaryMetric.evidence}`,
    "",
    "## Value proof ledger",
    `- Status: ${room.valueProofLedger.status}`,
    `- Headline: ${room.valueProofLedger.headline}`,
    `- Confidence band: ${room.valueProofLedger.confidenceBand}`,
    `- Break-even adoption: ${room.valueProofLedger.breakEvenAdoption}`,
    `- Value at risk: ${room.valueProofLedger.valueAtRisk}`,
    `- Measured pilot support: [${room.valueProofLedger.pilotEvidence.status}] ${room.valueProofLedger.pilotEvidence.value}. ${room.valueProofLedger.pilotEvidence.evidence}`,
    ...room.valueProofLedger.cases.map(
      (item) => `- [${item.status}] ${item.label}: ${item.monthlyValue} / month, ${item.monthlyHoursSaved} saved, ${item.paybackDays} payback, ${item.adoption}. ${item.evidence}`
    ),
    ...room.valueProofLedger.guardrails.map((item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.evidence}`),
    "",
    "## Next action",
    `- ${room.nextAction.owner}: ${room.nextAction.action}`,
    `- Link: ${room.nextAction.href}`,
    "",
    "## Live proof health",
    `- Readiness: ${room.proofHealth.readiness}`,
    `- Score: ${room.proofHealth.score}/100`,
    `- Verified links: ${room.proofHealth.verifiedCount}/${room.proofHealth.totalCount}`,
    `- Checked at: ${room.proofHealth.checkedAt || "not checked"}`,
    `- Instruction: ${room.proofHealth.instruction}`,
    ...(room.quickAuditReceipt
      ? [
          "",
          "## Quick intake audit receipt",
          `- Receipt: ${room.quickAuditReceipt.receiptId}`,
          `- Checksum: ${room.quickAuditReceipt.checksum}`,
          `- Checked at: ${room.quickAuditReceipt.checkedAt}`,
          `- Verified links: ${room.quickAuditReceipt.verifiedCount}/${room.quickAuditReceipt.totalCount}`,
          `- Score: ${room.quickAuditReceipt.score}/100`
        ]
      : []),
    ...(room.acceptancePath
      ? [
          "",
          "## Acceptance path attachment",
          `- Status: ${room.acceptancePath.status}`,
          `- Verified: ${room.acceptancePath.verified ? "yes" : "no"}`,
          `- Path: ${room.acceptancePath.pathId}`,
          `- Decision: ${room.acceptancePath.decision}`,
          ...(room.acceptancePath.decisionRecommendation
            ? [
                `- Evidence recommendation: ${room.acceptancePath.decisionRecommendation}`,
                `- Selected decision: ${room.acceptancePath.selectedDecision ?? room.acceptancePath.decision}`,
                `- Decision alignment: ${room.acceptancePath.decisionAlignment ?? "unknown"}`,
                `- Open decision conditions: ${room.acceptancePath.openDecisionConditionCount ?? 0} (${room.acceptancePath.blockedDecisionConditionCount ?? 0} blocked, ${room.acceptancePath.watchDecisionConditionCount ?? 0} watch)`,
                ...(room.acceptancePath.blockingSummary ? [`- Blocking summary: ${room.acceptancePath.blockingSummary}`] : []),
                ...(room.acceptancePath.overrideWarning ? [`- Override warning: ${room.acceptancePath.overrideWarning}`] : []),
                ...(room.acceptancePath.continueCriteria?.length
                  ? ["", "### Acceptance path continue criteria", ...room.acceptancePath.continueCriteria.map((criterion) => `- ${criterion}`)]
                  : [])
              ]
            : []),
          `- Checksum: ${room.acceptancePath.checksum}`,
          `- Stages: ${room.acceptancePath.readyCount}/${room.acceptancePath.stageCount} ready`,
          `- Verifier: ${room.acceptancePath.verifierUrl}`,
          `- Next action: ${room.acceptancePath.nextAction}`
        ]
      : []),
    "",
    "## Buyer cover sheet",
    `- Status: ${room.buyerCoverSheet.status}`,
    `- Headline: ${room.buyerCoverSheet.headline}`,
    `- What buyer gets: ${room.buyerCoverSheet.buyerPromise}`,
    `- Primary ask: ${room.buyerCoverSheet.primaryAsk}`,
    `- Do not send if: ${room.buyerCoverSheet.doNotSendIf}`,
    `- Review time: ${room.buyerCoverSheet.reviewTime}`,
    ...room.buyerCoverSheet.signals.map((signal) => `- [${signal.status}] ${signal.label}: ${signal.value}. ${signal.evidence} Link: ${signal.href}`),
    "",
    "## Stakeholder brief pack",
    ...room.stakeholderBriefs.flatMap((brief) => [
      `### ${brief.role}`,
      `- Status: ${brief.status}`,
      `- Owner: ${brief.owner}`,
      `- Decision ask: ${brief.decisionAsk}`,
      `- Proof to open: ${brief.proofToOpen} (${brief.artifactHref})`,
      `- Concern: ${brief.concern}`,
      `- Response: ${brief.response}`,
      `- Next action: ${brief.nextAction}`
    ]),
    "",
    "## Buyer activity trail",
    `- Status: ${room.buyerActivityTrail.status}`,
    `- Headline: ${room.buyerActivityTrail.headline}`,
    `- Summary: ${room.buyerActivityTrail.summary}`,
    `- Next owner: ${room.buyerActivityTrail.nextOwner}`,
    `- Next action: ${room.buyerActivityTrail.nextAction}`,
    `- CRM note: buyer-follow-up-crm-note.md`,
    `- Slack update: buyer-follow-up-slack-update.txt`,
    `- Task CSV: buyer-follow-up-tasks.csv`,
    `- Follow-up receipt: ${room.buyerActivityTrail.followUpReceipt.receiptId}`,
    `- Follow-up checksum: ${room.buyerActivityTrail.followUpReceipt.checksumAlgorithm}:${room.buyerActivityTrail.followUpReceipt.checksum}`,
    `- Follow-up API verification: POST ${room.buyerActivityTrail.followUpReceipt.verificationApiPath}`,
    ...room.buyerActivityTrail.events.map((event) => `- [${event.status}] ${event.label}: ${event.actor}. ${event.signal} Evidence: ${event.evidence} Next: ${event.nextAction} Link: ${event.href}`),
    "",
    "## Buyer decision",
    `- Verdict: ${room.buyerDecision.verdict}`,
    `- Instruction: ${room.buyerDecision.instruction}`,
    `- Buyer question: ${room.buyerDecision.buyerQuestion}`,
    ...room.buyerDecision.checks.map((check) => `- [${check.status}] ${check.label}: ${check.value}. ${check.evidence}`),
    "",
    "## Buyer handoff packet",
    `- Send instruction: ${room.handoffPacket.sendInstruction}`,
    `- Subject: ${room.handoffPacket.subject}`,
    `- Preview: ${room.handoffPacket.preview}`,
    "- Email body:",
    ...room.handoffPacket.emailBody.map((line) => `  - ${line}`),
    "- Review agenda:",
    ...room.handoffPacket.agenda.map((item) => `  - ${item.duration} ${item.owner}: ${item.label}. Proof: ${item.proof}`),
    "- Acceptance checks:",
    ...room.handoffPacket.acceptanceChecks.map((check) => `  - [${check.status}] ${check.label}: ${check.evidence}`),
    "- Reply router:",
    `  - Recommended: ${room.handoffPacket.recommendedReply}`,
    ...room.handoffPacket.replyRoutes.map((route) => `  - [${route.status}] ${route.label}: ${route.record} Next: ${route.nextAction} Evidence: ${route.evidence}`),
    "- Decision receipt:",
    `  - Receipt: ${room.handoffPacket.decisionReceipt.receiptId}`,
    `  - Checksum: ${room.handoffPacket.decisionReceipt.checksumAlgorithm}:${room.handoffPacket.decisionReceipt.checksum}`,
    `  - Selected reply: ${room.handoffPacket.decisionReceipt.selectedReply}`,
    `  - Verification: ${room.handoffPacket.decisionReceipt.verification.status}`,
    `  - API verification: POST ${room.handoffPacket.decisionReceipt.verificationApiPath}`,
    `  - Replay rule: Recompute fnv1a-64 over the receipt replay payload before accepting a forwarded handoff decision.`,
    "",
    "## Proof closure plan",
    ...room.closurePlan.map(
      (step) =>
        `- [${step.status}] ${step.owner} closes ${step.label}: ${step.action} Acceptance: ${step.acceptanceSignal} Proof: ${step.proofToAttach} Edit: ${step.editHref} Review: ${step.href}`
    ),
    "",
    "## Artifact links",
    ...room.artifacts.map((artifact) => `- [${artifact.status}] ${artifact.label}: ${artifact.href} - ${artifact.summary}`),
    "",
    "## AI squad",
    ...room.agents.map((agent) => `- ${agent.name}: ${agent.role} Proof: ${agent.proof}`)
  ].join("\n");
}

export function launchRoomHandoffCopyText(room: LaunchRoom) {
  return [
    `Subject: ${room.handoffPacket.subject}`,
    "",
    ...room.handoffPacket.emailBody,
    "",
    "Review agenda:",
    ...room.handoffPacket.agenda.map((item) => `- ${item.duration} / ${item.owner}: ${item.label}. Proof: ${item.proof}`),
    "",
    "Acceptance checks:",
    ...room.handoffPacket.acceptanceChecks.map((check) => `- [${check.status}] ${check.label}: ${check.evidence}`),
    "",
    "Reply router:",
    `Recommended: ${room.handoffPacket.recommendedReply}`,
    ...room.handoffPacket.replyRoutes.map((route) => `- [${route.status}] ${route.label} / ${route.owner}: ${route.record} Next: ${route.nextAction}`),
    "",
    "Decision receipt:",
    `Receipt: ${room.handoffPacket.decisionReceipt.receiptId}`,
    `Checksum: ${room.handoffPacket.decisionReceipt.checksumAlgorithm}:${room.handoffPacket.decisionReceipt.checksum}`,
    `Selected reply: ${room.handoffPacket.decisionReceipt.selectedReply}`,
    `Verification: ${room.handoffPacket.decisionReceipt.verification.status}`,
    `API verification: POST ${room.handoffPacket.decisionReceipt.verificationApiPath}`,
    ...(room.acceptancePath
      ? [
          "",
          "Acceptance path:",
          `Path: ${room.acceptancePath.pathId}`,
          `Decision: ${room.acceptancePath.decision}`,
          `Checksum: ${room.acceptancePath.checksum}`,
          `Verification: ${room.acceptancePath.status}`,
          `Verifier: ${room.acceptancePath.verifierUrl}`
        ]
      : []),
    "",
    `Launch decision: ${room.buyerDecision.verdict}`,
    `Next action: ${room.nextAction.owner}: ${room.nextAction.action}`
  ].join("\n");
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function trimTerminalPunctuation(value: string) {
  return value.replace(/[.。]+$/, "");
}

export function buildLaunchRoom(input: BuildLaunchRoomInput): LaunchRoom {
  const baseUrl = cleanBaseUrl(input.baseUrl);
  const workspace = input.workspace;
  const recommendation = recommendSquad(workspace.projectBrief, workspace.selectedAgentIds, 260, mergeAgentCatalog(workspace.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, workspace.projectBrief, baseUrl);
  const buyerScenario = buildBuyerValueScenario(recommendation, workspace.buyerScenario);
  const outcome = buildOutcomeSnapshot({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace,
    pilotRun: workspace.pilotRun
  });
  const workOrder = buildBuyerWorkOrderBrief({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder: workspace.buyerWorkOrder
  });
  const proposal = buildPilotProposal({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace
  });
  const workflow = buildPilotWorkflowPlan({
    recommendation,
    valueBlueprint,
    buyerScenario
  });
  const pilotRunReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun: workspace.pilotRun
  });
  const decisionMatrix = buildBuyerDecisionMatrix({
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotReceipt: pilotRunReceipt
  });
  const agreement = buildPilotAgreement({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    decisionMatrix,
    pilotReceipt: pilotRunReceipt
  });
  const execution = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl });
  const ledger = buildPilotEvidenceLedger({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt: pilotRunReceipt,
    decisionMatrix,
    agreement,
    execution
  });
  const adoptionPlan = buildAdoptionOperatingPlan({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder,
    workflow,
    pilotReceipt: pilotRunReceipt,
    agreement,
    ledger
  });
  const trustCenter = buildBuyerTrustCenter({
    recommendation,
    valueBlueprint,
    workOrder,
    workOrderInput: workspace.buyerWorkOrder,
    pilotReceipt: pilotRunReceipt,
    agreement,
    ledger,
    adoptionPlan,
    workspace
  });
  const commercialOffer = buildCommercialOffer({
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotReceipt: pilotRunReceipt,
    decisionMatrix,
    agreement,
    adoptionPlan,
    trustCenter
  });
  const query = artifactQuery(workspace);
  const proofVerification = quickAuditProofVerificationForWorkspace(workspace, input.quickAuditReceipt);
  const proofMonitor = buildBuyerProofMonitor({
    proofLinks: proofLinksForWorkspace(workspace),
    verification: proofVerification,
    now: input.now
  });
  const quickAuditReceipt =
    input.quickAuditReceipt &&
    proofVerification?.checkedAt === input.quickAuditReceipt.checkedAt &&
    proofVerification.verifiedCount === input.quickAuditReceipt.verifiedCount &&
    proofVerification.totalCount === input.quickAuditReceipt.totalCount &&
    proofVerification.score === input.quickAuditReceipt.score
      ? input.quickAuditReceipt
      : undefined;
  const proofHealth: LaunchRoomProofHealth = {
    readiness: proofMonitor.readiness,
    status: proofHealthStatus(proofMonitor.readiness),
    score: proofMonitor.score,
    checkedAt: proofMonitor.checkedAt,
    verifiedCount: proofMonitor.verifiedCount,
    totalCount: proofMonitor.totalCount,
    blockedCount: proofMonitor.checks.filter((check) => check.status === "block").length,
    watchCount: proofMonitor.checks.filter((check) => check.status === "watch").length,
    summary: proofMonitor.hardTruth,
    instruction: proofHealthInstruction(proofMonitor.readiness)
  };
  const checks = new Map(outcome.checks.map((check) => [check.id, check]));
  const buyerValue = checks.get("buyer-value");
  const proofPacket = checks.get("buyer-proof-packet");
  const pilotReceipt = checks.get("pilot-receipt");
  const deployment = checks.get("deployment-proof");
  const submission = checks.get("submission-proof");
  const trial = checks.get("a2a-trial-proof");
  const adoptionStatus = adoptionPlanStatus(adoptionPlan.readiness);
  const trustStatus = trustCenterStatus(trustCenter.readiness);
  const commercialStatus = commercialOfferStatus(commercialOffer.readiness);
  const attachedAcceptanceStatus = acceptancePathStatus(input.acceptancePath);
  const buyerProofPacketStatus = worstStatus(statusFromOutcome(proofPacket?.status ?? "blocked"), proofHealth.status);
  const pilotContractStatus = worstStatus(statusFromOutcome(buyerValue?.status ?? "blocked"), statusFromOutcome(pilotReceipt?.status ?? "blocked"), adoptionStatus, trustStatus, commercialStatus);

  const workOrderArtifact: LaunchRoomArtifact = {
    id: "work-order-brief",
    label: "Work order brief",
    href: absolutePath(baseUrl, "/work-order-brief", query),
    status: workOrderStatus(workOrder.readiness),
    owner: workOrder.assignments[0]?.agentName ?? "Pilot facilitator",
    summary: workOrder.request,
    proof: workOrder.nextAction
  };
  const coreArtifacts: LaunchRoomArtifact[] = [
    {
      id: "buyer-value",
      label: "Buyer value memo",
      href: absolutePath(baseUrl, "/buyer-value", query),
      status: statusFromOutcome(buyerValue?.status ?? "blocked"),
      owner: buyerValue?.owner ?? valueBlueprint.primaryUser,
      summary: buyerScenario.hardTruth,
      proof: `${buyerScenario.monthlyHoursSaved}h/month and ${yen(buyerScenario.monthlyGrossValueYen)} modeled value.`
    },
    workOrderArtifact,
    {
      id: "buyer-proof-packet",
      label: "Buyer proof packet",
      href: absolutePath(baseUrl, "/buyer-proof-packet", query),
      status: buyerProofPacketStatus,
      owner: proofPacket?.owner ?? "Sponsor owner",
      summary: proofHealth.status === "ready" ? (proofPacket?.action ?? "Close proof gaps before external approval.") : proofHealth.summary,
      proof: proofHealth.status === "ready" ? (proofPacket?.evidence ?? "Proof packet has not been sealed yet.") : proofHealth.instruction
    },
    {
      id: "live-proof-audit",
      label: "Live proof audit",
      href: absolutePath(baseUrl, "/buyer-proof-audit", query),
      status: proofHealth.status,
      owner: "Proof owner",
      summary: proofHealth.summary,
      proof:
        proofHealth.status === "ready"
          ? `${proofHealth.verifiedCount}/${proofHealth.totalCount} public proof links verified${proofHealth.checkedAt ? ` at ${proofHealth.checkedAt}` : ""}.`
          : proofHealth.instruction
    },
    {
      id: "sponsor-review",
      label: "Sponsor review room",
      href: absolutePath(baseUrl, "/sponsor-review", query),
      status: buyerProofPacketStatus,
      owner: "Sponsor owner",
      summary: "Decision room with approval, revise, and stop criteria.",
      proof: proofHealth.status === "ready" ? (proofPacket?.evidence ?? "Sponsor review needs proof packet inputs.") : proofHealth.instruction
    },
    {
      id: "pilot-run-receipt",
      label: "Pilot run receipt",
      href: absolutePath(baseUrl, "/pilot-run-receipt", query),
      status: statusFromOutcome(pilotReceipt?.status ?? "blocked"),
      owner: pilotReceipt?.owner ?? (workspace.pilotRun.reviewerName || "Pilot reviewer"),
      summary: pilotReceipt?.action ?? "Attach measured pilot receipt evidence.",
      proof: pilotReceipt?.evidence ?? "Pilot receipt is missing."
    },
    {
      id: "adoption-plan",
      label: "Adoption operating plan",
      href: absolutePath(baseUrl, "/adoption-plan", query),
      status: adoptionStatus,
      owner: adoptionPlan.ownerCommitments[0]?.owner ?? valueBlueprint.primaryUser,
      summary: adoptionPlan.hardTruth,
      proof: `${adoptionPlan.planScore}/100 plan score; ${adoptionPlan.cadence.filter((step) => step.status === "clear").length}/${adoptionPlan.cadence.length} cadence steps clear.`
    },
    {
      id: "trust-center",
      label: "Buyer trust center",
      href: absolutePath(baseUrl, "/trust-center", query),
      status: trustStatus,
      owner: trustCenter.controls.find((control) => control.id === "security-owner")?.owner ?? "Security reviewer",
      summary: trustCenter.hardTruth,
      proof: `${trustCenter.trustScore}/100 trust score; ${trustCenter.controls.filter((control) => control.status === "clear").length}/${trustCenter.controls.length} controls clear.`
    },
    {
      id: "commercial-offer",
      label: "Commercial offer",
      href: absolutePath(baseUrl, "/commercial-offer", query),
      status: commercialStatus,
      owner: agreement.signatures[0]?.name ?? valueBlueprint.primaryUser,
      summary: commercialOffer.hardTruth,
      proof: `${commercialOffer.offerScore}/100 offer score; ${commercialOffer.recommendedTierId} at ${yen(commercialOffer.totalFirstCommitmentYen)}.`
    },
    {
      id: "buyer-pilot-contract",
      label: "Buyer pilot contract",
      href: absolutePath(baseUrl, "/buyer-pilot-contract", query),
      status: pilotContractStatus,
      owner: commercialOffer.approvalMemo.signer,
      summary:
        pilotContractStatus === "ready"
          ? "Shareable contract with scope, first commitment, measured proof, trust boundary, renewal gate, and receipt verification."
          : "Contract stays internal until value, measured proof, trust, adoption, and commercial guardrails are clear.",
      proof: `${commercialOffer.approvalMemo.decision} commercial memo; ${adoptionPlan.readiness} adoption plan; ${trustCenter.readiness} trust center.`
    },
    {
      id: "workspace",
      label: "Editable workspace",
      href: input.appUrl || absolutePath(baseUrl, "/"),
      status: "ready",
      owner: "Product owner",
      summary: "Open the saved workspace behind this launch room.",
      proof: "Workspace share token preserves brief, squad, value model, proof links, pilot run, and work order."
    }
  ];
  const readiness = readinessFor({
    outcomeReadiness: outcome.readiness,
    workOrderReadiness: workOrder.readiness,
    operatingArtifactStatuses: [proofHealth.status, adoptionStatus, trustStatus, commercialStatus, pilotContractStatus, ...(attachedAcceptanceStatus ? [attachedAcceptanceStatus] : [])]
  });
  const launchScore = Math.round(
    clamp(
      outcome.outcomeScore * 0.22 +
        workOrder.workOrderScore * 0.17 +
        buyerScenario.scenarioScore * 0.14 +
        adoptionPlan.planScore * 0.13 +
        trustCenter.trustScore * 0.12 +
        commercialOffer.offerScore * 0.12 +
        proofHealth.score * 0.1
    )
  );
  const buyerDecision = buildBuyerDecision({
    readiness,
    launchScore,
    buyerScenario,
    pilotRunReceipt,
    proofHealth,
    adoptionStatus,
    trustStatus,
    commercialStatus,
    ...(input.acceptancePath ? { acceptancePath: input.acceptancePath } : {})
  });
  const deliveryMemoArtifact: LaunchRoomArtifact = {
    id: "delivery-memo",
    label: "Buyer delivery memo",
    href: absolutePath(baseUrl, "/buyer-delivery-memo", query),
    status: decisionStatus(buyerDecision.verdict),
    owner: workspace.buyerWorkOrder.targetUser || valueBlueprint.primaryUser,
    summary:
      buyerDecision.verdict === "send"
        ? "Sendable memo with buyer ask, measured pilot value, live proof rows, and review links."
        : "Internal memo shows the open proof, operating, or value risk blocking buyer delivery.",
    proof:
      buyerDecision.verdict === "send"
        ? `${proofHealth.verifiedCount}/${proofHealth.totalCount} live proof links verified; ${buyerDecision.buyerQuestion}`
        : buyerDecision.instruction
  };
  const acceptancePathArtifact: LaunchRoomArtifact | undefined = input.acceptancePath
    ? {
        id: "acceptance-path",
        label: "Buyer acceptance path",
        href: input.acceptancePath.verifierUrl,
        status: attachedAcceptanceStatus ?? "blocked",
        owner: input.acceptancePath.buyer || valueBlueprint.primaryUser,
        summary: input.acceptancePath.verified
          ? `${input.acceptancePath.pathId} records ${input.acceptancePath.decision} / ${input.acceptancePath.pathStatus} with ${input.acceptancePath.readyCount}/${input.acceptancePath.stageCount} stages ready.`
          : `Acceptance path receipt is ${input.acceptancePath.status}.`,
        proof: acceptancePathEvidence(input.acceptancePath)
      }
    : undefined;
  const artifacts: LaunchRoomArtifact[] = [
    ...coreArtifacts.slice(0, 4),
    deliveryMemoArtifact,
    ...(acceptancePathArtifact ? [acceptancePathArtifact] : []),
    ...coreArtifacts.slice(4)
  ];
  const openArtifacts = artifacts.filter((artifact) => artifact.id !== "workspace" && artifact.status !== "ready");
  const nextArtifact = nextArtifactFor(readiness, artifacts, openArtifacts);
  const valueProofLedger = buildValueProofLedger({
    buyerScenario,
    pilotRunReceipt,
    buyerValueHref: absolutePath(baseUrl, "/buyer-value", query),
    pilotReceiptHref: absolutePath(baseUrl, "/pilot-run-receipt", query)
  });
  const primaryMetric: LaunchRoomMetric = {
    id: "modeled-monthly-value",
    label: "Modeled monthly buyer value",
    value: yen(buyerScenario.monthlyGrossValueYen),
    status: metricStatus(statusFromOutcome(buyerValue?.status ?? "blocked")),
    evidence: `${buyerScenario.monthlyHoursSaved} hours saved per month with ${buyerScenario.confidenceScore}/100 confidence.`
  };
  const metrics: LaunchRoomMetric[] = [
    primaryMetric,
    {
      id: "work-order-score",
      label: "Work order score",
      value: `${workOrder.workOrderScore}/100`,
      status: workOrderArtifact.status,
      evidence: workOrder.hardTruth
    },
    {
      id: "public-proof",
      label: "Live proof health",
      value: proofHealth.checkedAt ? `${proofHealth.verifiedCount}/${proofHealth.totalCount}` : "not checked",
      status: proofHealth.status,
      evidence: `${proofHealth.summary} Artifact closure: ${artifacts.filter((artifact) => artifact.id !== "workspace" && artifact.status === "ready").length}/${artifacts.length - 1}. ${[deployment, submission, trial]
        .filter(Boolean)
        .map((check) => check?.evidence)
        .join(" ")}`
    },
    {
      id: "selected-agents",
      label: "Accountable AI squad",
      value: `${recommendation.selected.length} agents`,
      status: recommendation.selected.length > 0 ? "ready" : "blocked",
      evidence: recommendation.selected.map((agent) => agent.name).join(", ") || "No accountable agents selected."
    }
  ];
  const basePartial: LaunchRoomBeforeHandoff = {
    id: `launch-room-${readiness}-${launchScore}`,
    readiness,
    launchScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor({
      readiness,
      openArtifacts,
      outcomeHardTruth: outcome.hardTruth,
      workOrderHardTruth: workOrder.hardTruth
    }),
    targetBuyer: valueBlueprint.primaryUser,
    projectBrief: workspace.projectBrief,
    primaryMetric,
    metrics,
    nextAction: {
      label: nextArtifact?.label ?? outcome.nextAction.label,
      owner: nextArtifact?.owner ?? outcome.nextAction.owner,
      action: nextArtifact?.proof ?? outcome.nextAction.action,
      href: nextArtifact?.href ?? outcome.nextAction.href
    },
    artifacts,
    closurePlan: buildClosurePlan(artifacts, input.appUrl),
    agents: selectedAgents(recommendation.selected),
    proofHealth,
    valueProofLedger,
    buyerDecision,
    quickAuditReceipt,
    ...(input.acceptancePath ? { acceptancePath: input.acceptancePath } : {})
  };
  const handoffPacket = buildHandoffPacket(basePartial);
  const preBriefs = { ...basePartial, handoffPacket };
  const preActivity = {
    ...preBriefs,
    buyerCoverSheet: buildBuyerCoverSheet(preBriefs),
    stakeholderBriefs: buildStakeholderBriefs(preBriefs)
  };
  const partial: Omit<LaunchRoom, "exportMarkdown"> = {
    ...preActivity,
    buyerActivityTrail: buildBuyerActivityTrail(preActivity)
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderLaunchRoomHtml(
  room: LaunchRoom,
  links: LaunchRoomHtmlLinks = {}
) {
  const actionConfigJson = escapeScriptJson({
    handoffVerifyRequestUrl: links.handoffVerifyRequestUrl ?? "/api/launch-room/handoff-receipt/request",
    handoffCopyUrl: links.handoffCopyUrl ?? "/api/launch-room/handoff-copy",
    followUpVerifyRequestUrl: links.followUpVerifyRequestUrl ?? "/api/launch-room/follow-up-receipt/request"
  });
  const handoffVerificationApiPathJson = JSON.stringify(room.handoffPacket.decisionReceipt.verificationApiPath);
  const followUpVerificationApiPathJson = JSON.stringify(room.buyerActivityTrail.followUpReceipt.verificationApiPath);
  const deliveryMemo = room.artifacts.find((artifact) => artifact.id === "delivery-memo");
  const valueProofLedgerHref = links.valueProofLedgerUrl ?? "/launch-room/value-proof-ledger.md";
  const buyerCoverSheetHref = links.buyerCoverSheetUrl ?? "/launch-room/buyer-cover-sheet.md";
  const buyerActivityTrailHref = links.buyerActivityTrailUrl ?? "/launch-room/buyer-activity-trail.md";
  const buyerActivityCrmNoteHref = links.buyerActivityCrmNoteUrl ?? "/launch-room/buyer-follow-up-crm-note.md";
  const buyerActivitySlackUpdateHref = links.buyerActivitySlackUpdateUrl ?? "/launch-room/buyer-follow-up-slack-update.txt";
  const buyerActivityTaskCsvHref = links.buyerActivityTaskCsvUrl ?? "/launch-room/buyer-follow-up-tasks.csv";
  const buyerFollowUpReceiptHref = links.buyerFollowUpReceiptUrl ?? "/launch-room/buyer-follow-up-receipt.md";
  const buyerFollowUpReplayPayloadHref = links.buyerFollowUpReplayPayloadUrl ?? "/launch-room/buyer-follow-up-replay-payload.json";
  const handoffDecisionReceiptHref = links.handoffDecisionReceiptUrl ?? "/launch-room/handoff-decision-receipt.md";
  const handoffDecisionReplayPayloadHref = links.handoffDecisionReplayPayloadUrl ?? "/launch-room/handoff-replay-payload.json";
  const defaultArtifactPathById: Record<string, string> = {
    "work-order-brief": "/work-order-brief",
    "buyer-value": "/buyer-value",
    "buyer-proof-packet": "/buyer-proof-packet",
    "live-proof-audit": "/buyer-proof-audit",
    "sponsor-review": "/sponsor-review",
    "pilot-run-receipt": "/pilot-run-receipt",
    "adoption-plan": "/adoption-plan",
    "trust-center": "/trust-center",
    "commercial-offer": "/commercial-offer",
    "buyer-pilot-contract": "/buyer-pilot-contract",
    "delivery-memo": "/buyer-delivery-memo",
    workspace: links.appUrl ?? "/"
  };
  const artifactIdByPath = Object.fromEntries(Object.entries(defaultArtifactPathById).map(([id, path]) => [path, id]));
  const compactArtifactHref = (href: string) => {
    try {
      const path = new URL(href, "https://launch-room.local").pathname;
      const artifactId = artifactIdByPath[path];
      return artifactId ? (links.artifactUrls?.[artifactId] ?? defaultArtifactPathById[artifactId] ?? href) : href;
    } catch {
      return href;
    }
  };
  const artifactHref = (artifact: LaunchRoom["artifacts"][number]) =>
    links.artifactUrls?.[artifact.id] ?? defaultArtifactPathById[artifact.id] ?? compactArtifactHref(artifact.href);
  const coverSignalHref = (signal: LaunchRoom["buyerCoverSheet"]["signals"][number]) =>
    signal.id === "reply-route" ? handoffDecisionReceiptHref : compactArtifactHref(signal.href);
  const buyerActivityEventHref = (event: LaunchRoom["buyerActivityTrail"]["events"][number]) => {
    if (event.id === "cover-sheet-prepared") return buyerCoverSheetHref;
    if (event.id === "reply-route-recorded" || event.id === "decision-receipt-sealed") return handoffDecisionReceiptHref;
    return compactArtifactHref(event.href);
  };
  const nav = [
    deliveryMemo ? `<a href="${escapeHtml(artifactHref(deliveryMemo))}">Delivery memo</a>` : "",
    links.shareGateUrl ? `<a href="${escapeHtml(links.shareGateUrl)}">Share gate</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workspace</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const visibleQuickAuditReceipt = room.quickAuditReceipt ?? links.quickAuditReceipt;
  const quickAuditReceipt = visibleQuickAuditReceipt
    ? `
      <section class="quick-audit-receipt good" aria-label="Verified Quick intake audit">
        <div>
          <span class="eyebrow">Verified Quick intake audit</span>
          <strong>Live proof receipt is attached to this buyer room</strong>
          <p>The workflow packet opened from Quick intake carried a verified public-proof audit. Keep this receipt with the launch room before buyer review.</p>
        </div>
        <dl>
          <dt>Receipt</dt>
          <dd>${escapeHtml(visibleQuickAuditReceipt.receiptId)}</dd>
          <dt>Checksum</dt>
          <dd>${escapeHtml(visibleQuickAuditReceipt.checksum)}</dd>
          <dt>Checked</dt>
          <dd>${escapeHtml(visibleQuickAuditReceipt.checkedAt)}</dd>
          <dt>Verified</dt>
          <dd>${escapeHtml(`${visibleQuickAuditReceipt.verifiedCount}/${visibleQuickAuditReceipt.totalCount}`)}</dd>
          <dt>Score</dt>
          <dd>${escapeHtml(`${visibleQuickAuditReceipt.score}/100`)}</dd>
        </dl>
      </section>`
    : "";
  const metrics = room.metrics
    .map(
      (metric) => `
        <article class="metric ${tone(metric.status)}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
          <small>${escapeHtml(metric.evidence)}</small>
        </article>`
    )
    .join("");
  const valueLedgerCases = room.valueProofLedger.cases
    .map(
      (item) => `
        <article class="${tone(item.status)}">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.monthlyValue)}</strong>
          <p>${escapeHtml(`${item.monthlyHoursSaved} saved / ${item.paybackDays} payback`)}</p>
          <small>${escapeHtml(item.adoption)}. ${escapeHtml(item.evidence)}</small>
        </article>`
    )
    .join("");
  const valueLedgerGuardrails = room.valueProofLedger.guardrails
    .map(
      (item) => `
        <article class="${tone(item.status)}">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <small>${escapeHtml(item.evidence)}</small>
        </article>`
    )
    .join("");
  const valueProofLedger = `
      <section class="value-ledger ${tone(room.valueProofLedger.status)}" aria-label="Value proof ledger">
        <div class="value-ledger-head">
          <div>
            <span class="eyebrow">Value proof ledger</span>
            <strong>${escapeHtml(room.valueProofLedger.headline)}</strong>
            <p>${escapeHtml(room.valueProofLedger.summary)}</p>
          </div>
          <aside>
            <span>Confidence band</span>
            <strong>${escapeHtml(room.valueProofLedger.confidenceBand)}</strong>
            <small>${escapeHtml(`Break-even adoption ${room.valueProofLedger.breakEvenAdoption}; value at risk ${room.valueProofLedger.valueAtRisk}`)}</small>
            <a href="${escapeHtml(valueProofLedgerHref)}" download="launch-room-value-proof-ledger.md">Download ledger</a>
          </aside>
        </div>
        <div class="value-ledger-cases" aria-label="Value sensitivity cases">${valueLedgerCases}</div>
        <div class="value-ledger-proof">
          <article class="${tone(room.valueProofLedger.pilotEvidence.status)}">
            <span>Measured pilot support</span>
            <strong>${escapeHtml(room.valueProofLedger.pilotEvidence.value)}</strong>
            <p>${escapeHtml(room.valueProofLedger.pilotEvidence.evidence)}</p>
            <a href="${escapeHtml(compactArtifactHref(room.valueProofLedger.pilotEvidence.href))}">Open pilot receipt</a>
          </article>
          <div class="value-ledger-guardrails" aria-label="Value guardrails">${valueLedgerGuardrails}</div>
        </div>
      </section>`;
  const artifacts = room.artifacts
    .map(
      (artifact) => `
        <article class="artifact ${tone(artifact.status)}">
          <div>
            <span>${escapeHtml(artifact.status)}</span>
            <strong>${escapeHtml(artifact.label)}</strong>
          </div>
          <p>${escapeHtml(artifact.summary)}</p>
          <small>${escapeHtml(artifact.owner)}: ${escapeHtml(artifact.proof)}</small>
          <a href="${escapeHtml(artifactHref(artifact))}">Open artifact</a>
        </article>`
    )
    .join("");
  const closurePlan = room.closurePlan
    .map(
      (step, index) => `
        <li class="closure-step ${tone(step.status)}">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>${escapeHtml(step.label)}</strong>
            <small>${escapeHtml(step.owner)}</small>
          </div>
          <p>${escapeHtml(step.action)}</p>
          <dl>
            <dt>Acceptance</dt>
            <dd>${escapeHtml(step.acceptanceSignal)}</dd>
            <dt>Proof to attach</dt>
            <dd>${escapeHtml(step.proofToAttach)}</dd>
          </dl>
          <div class="closure-actions">
            <a href="${escapeHtml(step.editHref)}">Fix in workspace</a>
          <a href="${escapeHtml(compactArtifactHref(step.href))}">Review artifact</a>
          </div>
        </li>`
    )
    .join("");
  const proofQueueLead = room.closurePlan[0];
  const proofQueueSummary = proofQueueLead ? `Start with ${proofQueueLead.label}: ${proofQueueLead.owner} attaches ${trimTerminalPunctuation(proofQueueLead.proofToAttach)}.` : room.hardTruth;
  const proofQueue = room.closurePlan
    .slice(0, 3)
    .map(
      (step, index) => `
        <li class="${tone(step.status)}">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>${escapeHtml(step.label)}</strong>
            <small>${escapeHtml(step.owner)}</small>
          </div>
          <a href="${escapeHtml(step.editHref)}">Fix in workspace</a>
        </li>`
    )
    .join("");
  const coverSignals = room.buyerCoverSheet.signals
    .map(
      (signal) => `
        <article class="${tone(signal.status)}">
          <span>${escapeHtml(signal.label)}</span>
          <strong>${escapeHtml(signal.value)}</strong>
          <small>${escapeHtml(signal.evidence)}</small>
          <a href="${escapeHtml(coverSignalHref(signal))}">Open proof</a>
        </article>`
    )
    .join("");
  const recommendedRoute = room.handoffPacket.replyRoutes.find((route) => route.id === room.handoffPacket.recommendedReply) ?? room.handoffPacket.replyRoutes[0];
  const firstBlockedCheck = room.buyerDecision.checks.find((check) => check.status === "blocked") ?? room.buyerDecision.checks.find((check) => check.status === "attention");
  const decisionRoomChecks = [
    {
      label: "Recommended reply",
      status: recommendedRoute?.status ?? room.buyerDecision.status,
      value: recommendedRoute?.label ?? room.handoffPacket.recommendedReply,
      evidence: recommendedRoute?.record ?? room.handoffPacket.sendInstruction
    },
    {
      label: "Live proof",
      status: room.proofHealth.status,
      value: room.proofHealth.checkedAt ? `${room.proofHealth.verifiedCount}/${room.proofHealth.totalCount} verified` : "not checked",
      evidence: room.proofHealth.instruction
    },
    {
      label: "First risk",
      status: firstBlockedCheck?.status ?? "ready",
      value: firstBlockedCheck?.label ?? "No blocking check",
      evidence: firstBlockedCheck?.evidence ?? "All decision checks are ready for buyer review."
    },
    {
      label: "Receipt",
      status: room.handoffPacket.decisionReceipt.status,
      value: room.handoffPacket.decisionReceipt.selectedReply,
      evidence: `${room.handoffPacket.decisionReceipt.checksumAlgorithm}:${room.handoffPacket.decisionReceipt.checksum}`
    }
  ]
    .map(
      (check) => `
        <article class="${tone(check.status)}">
          <span>${escapeHtml(check.label)}</span>
          <strong>${escapeHtml(check.value)}</strong>
          <small>${escapeHtml(check.evidence)}</small>
        </article>`
    )
    .join("");
  const decisionRoom = `
      <section class="decision-room ${tone(room.buyerDecision.status)}" aria-label="Buyer decision room">
        <div class="decision-room-main">
          <span class="eyebrow">Buyer decision room</span>
          <strong>${escapeHtml(room.buyerDecision.buyerQuestion)}</strong>
          <p>${escapeHtml(room.handoffPacket.preview)}</p>
          <div class="decision-room-actions">
            <a href="${escapeHtml(deliveryMemo ? artifactHref(deliveryMemo) : compactArtifactHref(room.nextAction.href))}">Open decision memo</a>
            <button type="button" data-launch-room-copy-handoff>Copy handoff</button>
            <button type="button" data-launch-room-handoff-verify>Verify receipt</button>
            <output data-launch-room-copy-result aria-live="polite">Handoff not copied in this browser yet.</output>
            <output data-launch-room-handoff-verify-result aria-live="polite">Receipt not verified in this browser yet.</output>
          </div>
        </div>
        <aside class="decision-room-reply">
          <span>Recommended reply</span>
          <strong>${escapeHtml(recommendedRoute?.label ?? room.handoffPacket.recommendedReply)}</strong>
          <p>${escapeHtml(recommendedRoute?.nextAction ?? room.handoffPacket.sendInstruction)}</p>
        </aside>
        <div class="decision-room-checks">${decisionRoomChecks}</div>
      </section>`;
  const buyerCoverSheet = `
      <section class="buyer-cover ${tone(room.buyerCoverSheet.status)}" aria-label="Buyer cover sheet">
        <div class="buyer-cover-main">
          <span class="eyebrow">Buyer cover sheet</span>
          <strong>${escapeHtml(room.buyerCoverSheet.headline)}</strong>
          <p><b>What buyer gets</b> ${escapeHtml(room.buyerCoverSheet.buyerPromise)}</p>
          <p><b>Primary ask</b> ${escapeHtml(room.buyerCoverSheet.primaryAsk)}</p>
        </div>
        <aside class="buyer-cover-action">
          <span>${escapeHtml(room.buyerCoverSheet.status)}</span>
          <strong>${escapeHtml(room.buyerCoverSheet.reviewTime)}</strong>
          <small>${escapeHtml(room.buyerCoverSheet.doNotSendIf)}</small>
          <a href="${escapeHtml(buyerCoverSheetHref)}" download="buyer-cover-sheet.md">Download cover sheet</a>
        </aside>
        <div class="buyer-cover-signals">${coverSignals}</div>
      </section>`;
  const stakeholderBriefs = room.stakeholderBriefs
    .map(
      (brief) => `
        <article class="${tone(brief.status)}">
          <div>
            <span>${escapeHtml(brief.status)}</span>
            <strong>${escapeHtml(brief.role)}</strong>
          </div>
          <p>${escapeHtml(brief.decisionAsk)}</p>
          <dl>
            <dt>Owner</dt>
            <dd>${escapeHtml(brief.owner)}</dd>
            <dt>Proof</dt>
            <dd><a href="${escapeHtml(compactArtifactHref(brief.artifactHref))}">${escapeHtml(brief.proofToOpen)}</a></dd>
            <dt>Concern</dt>
            <dd>${escapeHtml(brief.concern)}</dd>
            <dt>Response</dt>
            <dd>${escapeHtml(brief.response)}</dd>
            <dt>Next</dt>
            <dd>${escapeHtml(brief.nextAction)}</dd>
          </dl>
          <a href="${escapeHtml(links.stakeholderBriefUrls?.[brief.id] ?? `/launch-room/stakeholder-brief.md?brief=${encodeURIComponent(brief.id)}`)}" download="${escapeHtml(`launch-room-${brief.id}-brief.md`)}">Download brief</a>
        </article>`
    )
    .join("");
  const stakeholderBriefPack = `
      <section class="stakeholder-pack" aria-label="Stakeholder brief pack">
        <div class="stakeholder-pack-head">
          <div>
            <span class="eyebrow">Stakeholder brief pack</span>
            <strong>Route the same launch room to finance, security, operations, and procurement.</strong>
          </div>
          <p>Each brief names the decision ask, likely objection, proof link, and next action so the buyer can forward the room internally without rewriting the story.</p>
        </div>
        <div class="stakeholder-grid">${stakeholderBriefs}</div>
      </section>`;
  const buyerActivityEvents = room.buyerActivityTrail.events
    .map(
      (event, index) => `
        <article class="${tone(event.status)}">
          <span>${String(index + 1).padStart(2, "0")} / ${escapeHtml(event.status)}</span>
          <strong>${escapeHtml(event.label)}</strong>
          <p>${escapeHtml(event.signal)}</p>
          <dl>
            <dt>Actor</dt>
            <dd>${escapeHtml(event.actor)}</dd>
            <dt>Evidence</dt>
            <dd>${escapeHtml(event.evidence)}</dd>
            <dt>Next</dt>
            <dd>${escapeHtml(event.nextAction)}</dd>
          </dl>
          <a href="${escapeHtml(buyerActivityEventHref(event))}">Open trail link</a>
        </article>`
    )
    .join("");
  const buyerActivityTrail = `
      <section class="activity-trail ${tone(room.buyerActivityTrail.status)}" aria-label="Buyer activity trail">
        <div class="activity-trail-head">
          <div>
            <span class="eyebrow">Buyer activity trail</span>
            <strong>${escapeHtml(room.buyerActivityTrail.headline)}</strong>
            <p>${escapeHtml(room.buyerActivityTrail.summary)}</p>
          </div>
          <aside>
            <span>Next owner</span>
            <strong>${escapeHtml(room.buyerActivityTrail.nextOwner)}</strong>
            <small>${escapeHtml(room.buyerActivityTrail.nextAction)}</small>
            <a href="${escapeHtml(buyerActivityTrailHref)}" download="buyer-activity-trail.md">Download trail</a>
            <a href="${escapeHtml(buyerActivityCrmNoteHref)}" download="buyer-follow-up-crm-note.md">CRM note</a>
            <a href="${escapeHtml(buyerActivitySlackUpdateHref)}" download="buyer-follow-up-slack-update.txt">Slack update</a>
            <a href="${escapeHtml(buyerActivityTaskCsvHref)}" download="buyer-follow-up-tasks.csv">Task CSV</a>
            <small>${escapeHtml(`${room.buyerActivityTrail.followUpReceipt.checksumAlgorithm}:${room.buyerActivityTrail.followUpReceipt.checksum}`)}</small>
            <a href="${escapeHtml(buyerFollowUpReceiptHref)}" download="buyer-follow-up-receipt.md">Download receipt</a>
            <a href="${escapeHtml(buyerFollowUpReplayPayloadHref)}" download="buyer-follow-up-replay-payload.json">Replay payload</a>
            <div class="activity-verify">
              <button type="button" data-launch-room-follow-up-verify>Verify follow-up</button>
              <output data-launch-room-follow-up-verify-result aria-live="polite">Not verified in this browser yet.</output>
            </div>
          </aside>
        </div>
        <div class="activity-trail-events">${buyerActivityEvents}</div>
      </section>`;
  const decisionChecks = room.buyerDecision.checks
    .map(
      (check) => `
        <article class="${tone(check.status)}">
          <span>${escapeHtml(check.label)}</span>
          <strong>${escapeHtml(check.value)}</strong>
          <small>${escapeHtml(check.evidence)}</small>
        </article>`
    )
    .join("");
  const buyerDecision = `
      <section class="buyer-decision ${tone(room.buyerDecision.status)}" aria-label="Buyer decision">
        <div class="buyer-decision-main">
          <span class="eyebrow">Buyer decision</span>
          <strong>${escapeHtml(room.buyerDecision.headline)}</strong>
          <p>${escapeHtml(room.buyerDecision.instruction)}</p>
          <small>${escapeHtml(room.buyerDecision.buyerQuestion)}</small>
        </div>
        <div class="buyer-decision-verdict">
          <span>${escapeHtml(room.buyerDecision.verdict)}</span>
          <strong>${escapeHtml(room.launchScore)}</strong>
          <small>${escapeHtml(room.readiness)}</small>
        </div>
        <div class="buyer-decision-checks">${decisionChecks}</div>
      </section>`;
  const handoffEmail = room.handoffPacket.emailBody.map((line) => renderHandoffEmailLine(line, compactArtifactHref)).join("");
  const handoffAgenda = room.handoffPacket.agenda
    .map(
      (item) => `
        <article>
          <span>${escapeHtml(item.duration)}</span>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.owner)}</p>
          <small>${escapeHtml(item.proof)}</small>
        </article>`
    )
    .join("");
  const handoffChecks = room.handoffPacket.acceptanceChecks
    .map(
      (check) => `
        <article class="${tone(check.status)}">
          <span>${escapeHtml(check.status)}</span>
          <strong>${escapeHtml(check.label)}</strong>
          <small>${escapeHtml(check.evidence)}</small>
        </article>`
    )
    .join("");
  const handoffRoutes = room.handoffPacket.replyRoutes
    .map(
      (route) => `
        <article class="${tone(route.status)} ${route.id === room.handoffPacket.recommendedReply ? "recommended" : ""}">
          <span>${escapeHtml(route.label)}</span>
          <strong>${escapeHtml(route.record)}</strong>
          <p>${escapeHtml(route.nextAction)}</p>
          <small>${escapeHtml(route.owner)}: ${escapeHtml(route.evidence)}</small>
        </article>`
    )
    .join("");
  const handoffReceipt = `
          <section id="handoff-decision-receipt" class="handoff-receipt ${tone(room.handoffPacket.decisionReceipt.status)}" aria-label="Handoff decision receipt">
            <div>
              <span class="eyebrow">Decision receipt</span>
              <strong>${escapeHtml(room.handoffPacket.decisionReceipt.receiptId)}</strong>
              <p>${escapeHtml(room.handoffPacket.decisionReceipt.record)}</p>
            </div>
            <dl>
              <dt>Checksum</dt>
              <dd>${escapeHtml(`${room.handoffPacket.decisionReceipt.checksumAlgorithm}:${room.handoffPacket.decisionReceipt.checksum}`)}</dd>
              <dt>Selected reply</dt>
              <dd>${escapeHtml(room.handoffPacket.decisionReceipt.selectedReply)}</dd>
              <dt>Verification</dt>
              <dd>${escapeHtml(room.handoffPacket.decisionReceipt.verification.status)}</dd>
              <dt>API</dt>
              <dd><code>POST ${escapeHtml(room.handoffPacket.decisionReceipt.verificationApiPath)}</code></dd>
              <dt>Next action</dt>
              <dd>${escapeHtml(room.handoffPacket.decisionReceipt.nextAction)}</dd>
              <dt>Receipt</dt>
              <dd><a href="${escapeHtml(handoffDecisionReceiptHref)}" download="launch-room-handoff-decision-receipt.md">Download markdown receipt</a></dd>
              <dt>Payload</dt>
              <dd><a href="${escapeHtml(handoffDecisionReplayPayloadHref)}" download="launch-room-handoff-replay-payload.json">Download replay payload</a></dd>
            </dl>
            <div class="handoff-verify">
              <button type="button" data-launch-room-handoff-verify>Verify receipt</button>
              <output data-launch-room-handoff-verify-result aria-live="polite">Not verified in this browser yet.</output>
            </div>
          </section>`;
  const handoffPacket = `
      <section class="handoff-packet ${tone(room.handoffPacket.status)}" aria-label="Buyer handoff packet">
        <div class="handoff-head">
          <div>
            <span class="eyebrow">Buyer handoff packet</span>
            <strong>${escapeHtml(room.handoffPacket.subject)}</strong>
            <p>${escapeHtml(room.handoffPacket.sendInstruction)}</p>
          </div>
          <div class="handoff-preview">
            <span>${escapeHtml(room.buyerDecision.verdict)}</span>
            <p>${escapeHtml(room.handoffPacket.preview)}</p>
          </div>
        </div>
        <div class="handoff-body">
          <section class="handoff-email" aria-label="Suggested buyer email">
            <span class="eyebrow">Suggested email</span>
            ${handoffEmail}
          </section>
          <section class="handoff-agenda" aria-label="Buyer review agenda">
            <span class="eyebrow">Review agenda</span>
            <div>${handoffAgenda}</div>
          </section>
          <section class="handoff-checks" aria-label="Handoff acceptance checks">
            <span class="eyebrow">Acceptance checks</span>
            <div>${handoffChecks}</div>
          </section>
          <section class="handoff-routes" aria-label="Buyer reply router">
            <span class="eyebrow">Reply router</span>
            <div>${handoffRoutes}</div>
          </section>
        </div>
        ${handoffReceipt}
      </section>`;
  const proofHealth = `
      <section class="proof-health ${tone(room.proofHealth.status)}" aria-label="Live proof health">
        <div>
          <span class="eyebrow">Live proof health</span>
          <strong>${escapeHtml(room.proofHealth.checkedAt ? `${room.proofHealth.verifiedCount}/${room.proofHealth.totalCount} links verified` : "Proof has not been checked live")}</strong>
          <p>${escapeHtml(room.proofHealth.summary)}</p>
        </div>
        <div class="proof-health-score">
          <span>${escapeHtml(room.proofHealth.readiness)}</span>
          <strong>${escapeHtml(room.proofHealth.score)}</strong>
          <small>${escapeHtml(room.proofHealth.blockedCount)} block / ${escapeHtml(room.proofHealth.watchCount)} watch</small>
        </div>
        <div>
          <span class="eyebrow">Share instruction</span>
          <p>${escapeHtml(room.proofHealth.instruction)}</p>
          <small>${escapeHtml(room.proofHealth.checkedAt ? `Checked ${room.proofHealth.checkedAt}` : "No checkedAt timestamp yet")}</small>
        </div>
      </section>`;
  const agents = room.agents
    .map(
      (agent) => `
        <li>
          <strong>${escapeHtml(agent.name)}</strong>
          <span>${escapeHtml(agent.role)}</span>
          <small>${escapeHtml(agent.proof)}</small>
        </li>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(room.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #18211f; --muted: #53645e; --paper: #f5f7f2; --panel: #fffefa; --line: #cbd8d0; --green: #0d7a61; --blue: #275da8; --yellow: #a66a00; --red: #b4233b; --good-bg: #e9f8ef; --watch-bg: #fff5d6; --bad-bg: #fff0f2; --shadow: 0 18px 48px rgba(24, 33, 31, .09); }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.52; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 24px; align-items: end; padding: 42px 0 18px; }
      .eyebrow, h2, .metric span, .artifact span, .closure-step > span, .proof-queue li > span, dt { color: var(--green); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 920px; margin: 6px 0 12px; font-size: clamp(2.25rem, 5.2vw, 4.8rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0 0 12px; }
      p { margin: 0; color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
      nav a, .decision-room a, .decision-room button, .artifact a, .closure-step a, .proof-queue a, .buyer-cover a, .value-ledger a, .stakeholder-grid a, .activity-trail a { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: var(--panel); color: inherit; font: inherit; font-size: .9rem; font-weight: 900; line-height: 1.1; text-decoration: none; cursor: pointer; }
      .decision-room button:disabled { cursor: wait; opacity: .72; }
      .score { min-height: 210px; border: 1px solid #0d7a61; border-radius: 8px; background: #15302d; color: #fffefa; display: grid; align-content: center; justify-items: center; gap: 8px; box-shadow: var(--shadow); }
      .score span { color: #98e6cf; font-size: .78rem; font-weight: 950; text-transform: uppercase; }
      .score strong { font-size: 4.8rem; line-height: .88; }
      .score small { max-width: 210px; color: rgba(255, 254, 250, .78); font-weight: 900; text-align: center; }
      main { display: grid; gap: 12px; padding: 0 0 34px; }
      .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .metric, .panel, .artifact, .proof-queue, .buyer-cover, .value-ledger, .buyer-decision, .handoff-packet { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: var(--shadow); }
      .metric { padding: 14px; }
      .metric strong { display: block; margin: 6px 0 8px; font-size: 1.24rem; line-height: 1.12; overflow-wrap: anywhere; }
      .metric small, .artifact small, li small { color: var(--muted); overflow-wrap: anywhere; }
      .decision-room { min-width: 0; display: grid; grid-template-columns: minmax(0, .86fr) minmax(230px, .3fr); gap: 12px; padding: 18px; border: 1px solid rgba(39, 93, 168, .38); border-left: 7px solid var(--blue); border-radius: 8px; background: linear-gradient(105deg, #fffefa, #eef6ff); box-shadow: var(--shadow); }
      .decision-room.good { border-color: rgba(13, 122, 97, .32); border-left-color: var(--green); background: linear-gradient(105deg, #fffefa, #e9f8ef); }
      .decision-room.watch { border-color: rgba(166, 106, 0, .28); border-left-color: var(--yellow); background: linear-gradient(105deg, #fffefa, #fff5d6); }
      .decision-room.bad { border-color: rgba(180, 35, 59, .24); border-left-color: var(--red); background: linear-gradient(105deg, #fffefa, #fff0f2); }
      .decision-room-main, .decision-room-reply { min-width: 0; }
      .decision-room-main strong { display: block; margin-top: 6px; color: var(--ink); font-size: clamp(1.8rem, 3.4vw, 3.15rem); line-height: 1.02; overflow-wrap: anywhere; }
      .decision-room-main p { max-width: 760px; margin-top: 10px; font-size: 1.02rem; overflow-wrap: anywhere; }
      .decision-room-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 16px; }
      .decision-room-actions output { flex-basis: 100%; color: var(--muted); font-size: .86rem; font-weight: 850; overflow-wrap: anywhere; }
      .decision-room-actions output[data-status="copied"], .decision-room-actions output[data-status="verified"] { color: var(--green); }
      .decision-room-actions output[data-status="checking"] { color: var(--blue); }
      .decision-room-actions output[data-status="mismatch"], .decision-room-actions output[data-status="error"] { color: var(--red); }
      .decision-room-reply { display: grid; align-content: center; gap: 8px; padding: 14px; border: 1px solid rgba(24, 33, 31, .12); border-radius: 8px; background: rgba(255, 254, 250, .8); }
      .decision-room-reply span { color: var(--blue); font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .decision-room-reply strong { font-size: 1.42rem; line-height: 1.05; overflow-wrap: anywhere; }
      .decision-room-reply p { color: var(--ink); font-size: .92rem; line-height: 1.36; overflow-wrap: anywhere; }
      .decision-room-checks { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
      .decision-room-checks article { min-width: 0; display: grid; align-content: start; gap: 6px; padding: 10px; border: 1px solid var(--line); border-left: 4px solid var(--green); border-radius: 8px; background: rgba(255, 254, 250, .78); }
      .decision-room-checks article.watch { border-left-color: var(--yellow); }
      .decision-room-checks article.bad { border-left-color: var(--red); }
      .decision-room-checks span { color: var(--green); font-size: .7rem; font-weight: 950; text-transform: uppercase; overflow-wrap: anywhere; }
      .decision-room-checks strong { color: var(--ink); font-size: .95rem; line-height: 1.1; overflow-wrap: anywhere; }
      .decision-room-checks small { color: var(--muted); font-size: .8rem; line-height: 1.3; overflow-wrap: anywhere; }
      .buyer-cover { display: grid; grid-template-columns: minmax(0, .78fr) minmax(230px, .28fr); gap: 12px; align-items: stretch; padding: 16px; border-color: rgba(13, 122, 97, .36); background: linear-gradient(105deg, #fffefa, #eef8f5); }
      .buyer-cover-main { min-width: 0; }
      .buyer-cover-main strong { display: block; margin-top: 5px; font-size: 1.56rem; line-height: 1.08; overflow-wrap: anywhere; }
      .buyer-cover-main p { margin-top: 8px; overflow-wrap: anywhere; }
      .buyer-cover-main b { color: var(--ink); }
      .buyer-cover-action { min-width: 0; display: grid; align-content: center; gap: 8px; padding: 12px; border: 1px solid rgba(24, 33, 31, .12); border-radius: 8px; background: rgba(255, 254, 250, .78); }
      .buyer-cover-action span { color: var(--blue); font-size: .74rem; font-weight: 950; text-transform: uppercase; }
      .buyer-cover-action strong { font-size: 1.5rem; line-height: 1.02; }
      .buyer-cover-action small { color: var(--muted); font-weight: 850; overflow-wrap: anywhere; }
      .buyer-cover-action a { justify-self: start; }
      .buyer-cover-signals { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
      .buyer-cover-signals article { min-width: 0; display: grid; align-content: start; gap: 6px; padding: 10px; border: 1px solid var(--line); border-left: 4px solid var(--green); border-radius: 8px; background: rgba(255, 254, 250, .78); }
      .buyer-cover-signals article.watch { border-left-color: var(--yellow); }
      .buyer-cover-signals article.bad { border-left-color: var(--red); }
      .buyer-cover-signals span { color: var(--green); font-size: .7rem; font-weight: 950; text-transform: uppercase; overflow-wrap: anywhere; }
      .buyer-cover-signals strong { color: var(--ink); font-size: .95rem; line-height: 1.1; overflow-wrap: anywhere; }
      .buyer-cover-signals small { color: var(--muted); font-size: .8rem; line-height: 1.3; overflow-wrap: anywhere; }
      .buyer-cover-signals a { justify-self: start; padding: 6px 10px; font-size: .82rem; }
      .value-ledger { display: grid; gap: 10px; padding: 16px; border-color: rgba(39, 93, 168, .34); border-left: 6px solid var(--blue); background: linear-gradient(105deg, #fffefa, #eef6ff); }
      .value-ledger.good { border-color: rgba(13, 122, 97, .32); border-left-color: var(--green); background: linear-gradient(105deg, #fffefa, #e9f8ef); }
      .value-ledger.watch { border-color: rgba(166, 106, 0, .28); border-left-color: var(--yellow); background: linear-gradient(105deg, #fffefa, #fff5d6); }
      .value-ledger.bad { border-color: rgba(180, 35, 59, .24); border-left-color: var(--red); background: linear-gradient(105deg, #fffefa, #fff0f2); }
      .value-ledger-head { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, .45fr); gap: 12px; align-items: stretch; }
      .value-ledger-head > div, .value-ledger-head aside { min-width: 0; }
      .value-ledger-head strong { display: block; margin-top: 5px; color: var(--ink); font-size: 1.45rem; line-height: 1.08; overflow-wrap: anywhere; }
      .value-ledger-head p { margin-top: 7px; overflow-wrap: anywhere; }
      .value-ledger-head aside { display: grid; align-content: center; gap: 7px; padding: 12px; border: 1px solid rgba(24, 33, 31, .12); border-radius: 8px; background: rgba(255, 254, 250, .78); }
      .value-ledger-head aside span, .value-ledger-cases span, .value-ledger-proof span, .value-ledger-guardrails span { color: var(--green); font-size: .7rem; font-weight: 950; text-transform: uppercase; overflow-wrap: anywhere; }
      .value-ledger-head aside strong { margin: 0; font-size: 1.04rem; line-height: 1.15; }
      .value-ledger-head aside small { color: var(--muted); font-weight: 850; line-height: 1.32; overflow-wrap: anywhere; }
      .value-ledger-head aside a { justify-self: start; padding: 6px 10px; font-size: .82rem; }
      .value-ledger-cases { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .value-ledger-cases article, .value-ledger-proof article, .value-ledger-guardrails article { min-width: 0; display: grid; align-content: start; gap: 6px; padding: 10px; border: 1px solid var(--line); border-left: 4px solid var(--green); border-radius: 8px; background: rgba(255, 254, 250, .78); }
      .value-ledger-cases article.watch, .value-ledger-proof article.watch, .value-ledger-guardrails article.watch { border-left-color: var(--yellow); }
      .value-ledger-cases article.bad, .value-ledger-proof article.bad, .value-ledger-guardrails article.bad { border-left-color: var(--red); }
      .value-ledger-cases strong, .value-ledger-proof strong, .value-ledger-guardrails strong { color: var(--ink); font-size: .98rem; line-height: 1.1; overflow-wrap: anywhere; }
      .value-ledger-cases p, .value-ledger-proof p { color: var(--ink); font-size: .84rem; line-height: 1.32; overflow-wrap: anywhere; }
      .value-ledger-cases small, .value-ledger-proof small, .value-ledger-guardrails small { color: var(--muted); font-size: .8rem; line-height: 1.3; overflow-wrap: anywhere; }
      .value-ledger-proof { display: grid; grid-template-columns: minmax(260px, .42fr) minmax(0, 1fr); gap: 8px; align-items: stretch; }
      .value-ledger-proof article a { justify-self: start; padding: 6px 10px; font-size: .82rem; }
      .value-ledger-guardrails { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .stakeholder-pack { display: grid; gap: 10px; padding: 4px 0; }
      .stakeholder-pack-head { display: grid; grid-template-columns: minmax(0, .72fr) minmax(280px, .48fr); gap: 12px; align-items: end; }
      .stakeholder-pack-head strong { display: block; margin-top: 5px; font-size: 1.3rem; line-height: 1.1; overflow-wrap: anywhere; }
      .stakeholder-pack-head p { overflow-wrap: anywhere; }
      .stakeholder-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .stakeholder-grid article { min-width: 0; display: grid; gap: 9px; padding: 12px; border: 1px solid var(--line); border-left: 5px solid var(--green); border-radius: 8px; background: var(--panel); box-shadow: var(--shadow); }
      .stakeholder-grid article.watch { border-left-color: var(--yellow); }
      .stakeholder-grid article.bad { border-left-color: var(--red); }
      .stakeholder-grid article > div { display: grid; gap: 4px; }
      .stakeholder-grid span { color: var(--green); font-size: .7rem; font-weight: 950; text-transform: uppercase; overflow-wrap: anywhere; }
      .stakeholder-grid strong { color: var(--ink); line-height: 1.12; overflow-wrap: anywhere; }
      .stakeholder-grid p { color: var(--ink); font-size: .9rem; line-height: 1.35; overflow-wrap: anywhere; }
      .stakeholder-grid dl { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 5px 8px; margin: 0; }
      .stakeholder-grid dd { min-width: 0; margin: 0; color: var(--muted); font-size: .82rem; line-height: 1.32; overflow-wrap: anywhere; }
      .stakeholder-grid a { justify-self: start; padding: 6px 10px; font-size: .82rem; }
      .activity-trail { display: grid; gap: 12px; padding: 16px; border: 1px solid rgba(39, 93, 168, .36); border-left: 6px solid var(--blue); border-radius: 8px; background: linear-gradient(105deg, #fffefa, #eef6ff); box-shadow: var(--shadow); }
      .activity-trail.watch { border-color: rgba(166, 106, 0, .28); border-left-color: var(--yellow); background: linear-gradient(105deg, #fffefa, #fff5d6); }
      .activity-trail.bad { border-color: rgba(180, 35, 59, .24); border-left-color: var(--red); background: linear-gradient(105deg, #fffefa, #fff0f2); }
      .activity-trail-head { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, .36fr); gap: 12px; align-items: stretch; }
      .activity-trail-head > div { min-width: 0; }
      .activity-trail-head strong { display: block; margin-top: 5px; font-size: 1.38rem; line-height: 1.1; overflow-wrap: anywhere; }
      .activity-trail-head p { margin-top: 7px; overflow-wrap: anywhere; }
      .activity-trail-head aside { min-width: 0; display: grid; align-content: center; gap: 7px; padding: 12px; border: 1px solid rgba(24, 33, 31, .12); border-radius: 8px; background: rgba(255, 254, 250, .78); }
      .activity-trail-head aside span { color: var(--blue); font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .activity-trail-head aside small { color: var(--muted); font-weight: 850; line-height: 1.32; overflow-wrap: anywhere; }
      .activity-trail-head aside a { justify-self: start; padding: 6px 10px; font-size: .82rem; }
      .activity-verify { display: grid; gap: 6px; padding-top: 8px; border-top: 1px solid rgba(24, 33, 31, .12); }
      .activity-trail-events { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .activity-trail-events article { min-width: 0; display: grid; gap: 8px; padding: 12px; border: 1px solid var(--line); border-left: 5px solid var(--green); border-radius: 8px; background: rgba(255, 254, 250, .78); }
      .activity-trail-events article.watch { border-left-color: var(--yellow); }
      .activity-trail-events article.bad { border-left-color: var(--red); }
      .activity-trail-events span { color: var(--green); font-size: .7rem; font-weight: 950; text-transform: uppercase; overflow-wrap: anywhere; }
      .activity-trail-events strong { color: var(--ink); line-height: 1.12; overflow-wrap: anywhere; }
      .activity-trail-events p { color: var(--ink); font-size: .9rem; line-height: 1.35; overflow-wrap: anywhere; }
      .activity-trail-events dl { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 5px 8px; margin: 0; }
      .activity-trail-events dd { min-width: 0; margin: 0; color: var(--muted); font-size: .82rem; line-height: 1.32; overflow-wrap: anywhere; }
      .activity-trail-events a { justify-self: start; padding: 6px 10px; font-size: .82rem; }
      .buyer-decision { display: grid; grid-template-columns: minmax(0, .8fr) 168px minmax(420px, 1fr); gap: 12px; align-items: stretch; padding: 16px; }
      .buyer-decision-main { min-width: 0; }
      .buyer-decision-main strong { display: block; margin-top: 5px; font-size: 1.5rem; line-height: 1.08; overflow-wrap: anywhere; }
      .buyer-decision-main p { margin-top: 7px; }
      .buyer-decision-main small { display: block; margin-top: 9px; color: var(--ink); font-weight: 900; overflow-wrap: anywhere; }
      .buyer-decision-verdict { display: grid; place-items: center; align-content: center; gap: 4px; border: 1px solid rgba(24, 33, 31, .12); border-radius: 8px; background: rgba(255, 254, 250, .74); text-align: center; }
      .buyer-decision-verdict span { color: var(--blue); font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .buyer-decision-verdict strong { font-size: 3.2rem; line-height: .9; }
      .buyer-decision-verdict small { color: var(--muted); font-size: .76rem; font-weight: 900; text-transform: uppercase; overflow-wrap: anywhere; }
      .buyer-decision-checks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
      .buyer-decision-checks article { min-width: 0; display: grid; align-content: start; gap: 5px; padding: 10px; border: 1px solid var(--line); border-left: 4px solid var(--green); border-radius: 8px; background: rgba(255, 254, 250, .72); }
      .buyer-decision-checks article.watch { border-left-color: var(--yellow); }
      .buyer-decision-checks article.bad { border-left-color: var(--red); }
      .buyer-decision-checks span { color: var(--green); font-size: .7rem; font-weight: 950; text-transform: uppercase; overflow-wrap: anywhere; }
      .buyer-decision-checks strong { color: var(--ink); font-size: .95rem; line-height: 1.1; overflow-wrap: anywhere; }
      .buyer-decision-checks small { color: var(--muted); font-size: .8rem; line-height: 1.3; overflow-wrap: anywhere; }
      .handoff-packet { display: grid; gap: 12px; padding: 16px; border-color: rgba(39, 93, 168, .36); background: linear-gradient(105deg, #fffefa, #eef6ff); }
      .handoff-head { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, .34fr); gap: 12px; align-items: stretch; }
      .handoff-head > div { min-width: 0; }
      .handoff-head strong { display: block; margin-top: 5px; font-size: 1.36rem; line-height: 1.08; overflow-wrap: anywhere; }
      .handoff-head p { margin-top: 7px; overflow-wrap: anywhere; }
      .handoff-preview { display: grid; align-content: center; gap: 6px; padding: 12px; border: 1px solid rgba(24, 33, 31, .12); border-radius: 8px; background: rgba(255, 254, 250, .78); }
      .handoff-preview span { color: var(--blue); font-size: .74rem; font-weight: 950; text-transform: uppercase; }
      .handoff-preview p { color: var(--ink); font-weight: 900; line-height: 1.28; }
      .handoff-body { display: grid; grid-template-columns: minmax(0, .9fr) repeat(3, minmax(210px, .7fr)); gap: 10px; align-items: start; }
      .handoff-body > section { min-width: 0; display: grid; gap: 8px; padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255, 254, 250, .78); }
      .handoff-email p { color: var(--ink); font-size: .92rem; line-height: 1.42; overflow-wrap: anywhere; }
      .handoff-agenda > div, .handoff-checks > div, .handoff-routes > div { display: grid; gap: 8px; }
      .handoff-agenda article, .handoff-checks article, .handoff-routes article { min-width: 0; display: grid; gap: 4px; padding: 9px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      .handoff-routes article.recommended { box-shadow: inset 0 0 0 1px rgba(13, 122, 97, .28); }
      .handoff-agenda article span, .handoff-checks article span, .handoff-routes article span { color: var(--green); font-size: .7rem; font-weight: 950; text-transform: uppercase; }
      .handoff-agenda article strong, .handoff-checks article strong, .handoff-routes article strong { color: var(--ink); line-height: 1.12; overflow-wrap: anywhere; }
      .handoff-agenda article p, .handoff-routes article p { color: var(--muted); font-size: .84rem; overflow-wrap: anywhere; }
      .handoff-agenda article small, .handoff-checks article small, .handoff-routes article small { color: var(--muted); font-size: .8rem; line-height: 1.3; overflow-wrap: anywhere; }
      .handoff-receipt { display: grid; grid-template-columns: minmax(0, .72fr) minmax(320px, 1fr); gap: 12px; align-items: start; padding: 12px; border: 1px solid var(--line); border-left: 5px solid var(--green); border-radius: 8px; background: rgba(255, 254, 250, .82); }
      .handoff-receipt.watch { border-left-color: var(--yellow); }
      .handoff-receipt.bad { border-left-color: var(--red); }
      .handoff-receipt strong { display: block; margin-top: 4px; color: var(--ink); line-height: 1.12; overflow-wrap: anywhere; }
      .handoff-receipt p { margin-top: 6px; overflow-wrap: anywhere; }
      .handoff-receipt dl { display: grid; grid-template-columns: 118px minmax(0, 1fr); gap: 5px 10px; margin: 0; }
      .handoff-receipt dd { min-width: 0; margin: 0; color: var(--muted); overflow-wrap: anywhere; }
      .handoff-receipt a { font-weight: 900; }
      .handoff-verify { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding-top: 10px; border-top: 1px solid rgba(24, 33, 31, .12); }
      .handoff-verify button, .activity-verify button { border: 0; border-radius: 999px; padding: 9px 13px; background: #15302d; color: #fffefa; font: inherit; font-size: .9rem; font-weight: 950; cursor: pointer; }
      .handoff-verify button:disabled, .activity-verify button:disabled { cursor: wait; opacity: .72; }
      .handoff-verify output, .activity-verify output { min-width: 220px; color: var(--muted); font-size: .88rem; font-weight: 850; overflow-wrap: anywhere; }
      .handoff-verify output[data-status="checking"], .activity-verify output[data-status="checking"] { color: var(--blue); }
      .handoff-verify output[data-status="verified"], .activity-verify output[data-status="verified"] { color: var(--green); }
      .handoff-verify output[data-status="mismatch"], .handoff-verify output[data-status="error"], .activity-verify output[data-status="mismatch"], .activity-verify output[data-status="error"] { color: var(--red); }
      .proof-queue { display: grid; grid-template-columns: minmax(0, .56fr) minmax(360px, .74fr); gap: 14px; align-items: center; padding: 16px; border-color: rgba(39, 93, 168, .42); background: linear-gradient(105deg, #fffefa, #eef6ff); }
      .proof-queue strong { display: block; margin-top: 5px; font-size: 1.28rem; line-height: 1.12; overflow-wrap: anywhere; }
      .proof-queue p { margin-top: 7px; }
      .proof-queue ol { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 0; margin: 0; list-style: none; }
      .proof-queue li { min-width: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px; align-items: start; padding: 10px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255, 254, 250, .78); }
      .proof-queue li > span { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 999px; background: rgba(13, 122, 97, .1); }
      .proof-queue li strong, .proof-queue li small { display: block; overflow-wrap: anywhere; }
      .proof-queue li a { grid-column: 1 / -1; justify-self: start; padding: 6px 10px; font-size: .82rem; }
      .proof-health { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(160px, .2fr) minmax(260px, .45fr); gap: 12px; align-items: stretch; padding: 16px; border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow); }
      .proof-health > div { min-width: 0; }
      .proof-health strong { display: block; margin-top: 5px; color: var(--ink); font-size: 1.22rem; line-height: 1.12; overflow-wrap: anywhere; }
      .proof-health p { margin-top: 7px; overflow-wrap: anywhere; }
      .proof-health small { display: block; margin-top: 7px; color: var(--muted); font-weight: 850; overflow-wrap: anywhere; }
      .proof-health-score { display: grid; place-items: center; align-content: center; gap: 4px; border: 1px solid rgba(24, 33, 31, .12); border-radius: 8px; background: rgba(255, 254, 250, .72); text-align: center; }
      .proof-health-score span { color: var(--blue); font-size: .7rem; font-weight: 950; text-transform: uppercase; overflow-wrap: anywhere; }
      .proof-health-score strong { margin: 0; font-size: 3rem; line-height: .92; }
      .layout { display: grid; grid-template-columns: minmax(0, .7fr) minmax(300px, .45fr); gap: 12px; align-items: start; }
      .panel { padding: 16px; }
      .artifact-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .artifact { display: grid; gap: 9px; padding: 14px; }
      .artifact div { display: flex; gap: 12px; justify-content: space-between; align-items: start; }
      .artifact strong { overflow-wrap: anywhere; }
      .artifact a { justify-self: start; }
      .quick-audit-receipt { display: grid; grid-template-columns: minmax(0, .78fr) minmax(320px, .44fr); gap: 14px; padding: 16px; border: 1px solid var(--line); border-left: 6px solid var(--green); border-radius: 8px; background: linear-gradient(90deg, rgba(13, 122, 97, .12), rgba(255, 255, 255, .92)); box-shadow: var(--shadow); }
      .quick-audit-receipt strong { display: block; font-size: 1.08rem; overflow-wrap: anywhere; }
      .quick-audit-receipt p { margin-top: 6px; color: var(--muted); }
      .quick-audit-receipt dl { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 6px 10px; margin: 0; }
      .quick-audit-receipt dt { color: var(--muted); font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; }
      .quick-audit-receipt dd { min-width: 0; margin: 0; font-weight: 750; overflow-wrap: anywhere; }
      .closure-panel { display: grid; gap: 12px; }
      .closure-head { display: flex; gap: 12px; justify-content: space-between; align-items: start; }
      .closure-head p { max-width: 720px; }
      .closure-list { display: grid; gap: 10px; padding: 0; margin: 0; list-style: none; }
      .closure-step { display: grid; grid-template-columns: 46px minmax(180px, .36fr) minmax(0, .74fr) minmax(280px, 1fr) auto; gap: 12px; align-items: start; padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      .closure-step > span { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 999px; background: rgba(13, 122, 97, .1); }
      .closure-step strong { display: block; overflow-wrap: anywhere; }
      .closure-step small { color: var(--muted); overflow-wrap: anywhere; }
      .closure-step p { color: var(--ink); }
      .closure-step dl { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 5px 10px; margin: 0; }
      .closure-step dd { min-width: 0; margin: 0; color: var(--muted); overflow-wrap: anywhere; }
      .closure-actions { justify-self: end; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
      .closure-actions a { white-space: nowrap; }
      .good { border-color: #a9d7bb; background: var(--good-bg); }
      .watch { border-color: #e7cd82; background: var(--watch-bg); }
      .bad { border-color: #e5a9b4; background: var(--bad-bg); }
      .next { border-left: 6px solid var(--blue); }
      .agent-list { display: grid; gap: 10px; padding: 0; margin: 0; list-style: none; }
      .agent-list li { display: grid; gap: 4px; padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      .agent-list li span { color: var(--muted); }
      footer { padding: 0 0 30px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 860px) {
        header, main, footer { width: min(100% - 24px, 640px); }
        header, .metrics, .layout, .artifact-grid, .proof-queue, .proof-queue ol, .proof-health, .quick-audit-receipt, .decision-room, .decision-room-checks, .buyer-cover, .buyer-cover-signals, .value-ledger-head, .value-ledger-cases, .value-ledger-proof, .value-ledger-guardrails, .stakeholder-pack-head, .stakeholder-grid, .activity-trail-head, .activity-trail-events, .buyer-decision, .buyer-decision-checks, .handoff-head, .handoff-body, .handoff-receipt { grid-template-columns: 1fr; }
        .proof-queue { padding: 14px; }
        .buyer-decision { padding: 14px; }
        .proof-queue p { font-size: .96rem; line-height: 1.4; }
        .proof-queue li { grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; }
        .proof-queue li a { grid-column: auto; justify-self: end; }
        .closure-head { display: grid; }
        .closure-step { grid-template-columns: 1fr; }
        .closure-actions { justify-self: start; justify-content: flex-start; }
        header { padding-top: 28px; }
        .score { min-height: 142px; }
        .score strong { font-size: 3.4rem; }
      }
    </style>
  </head>
  <body>
    <header>
      <div>
        <span class="eyebrow">Public Launch Room</span>
        <h1>${escapeHtml(room.headline)}</h1>
        <p>${escapeHtml(room.hardTruth)}</p>
        <nav>${nav}</nav>
      </div>
      <aside class="score">
        <span>Launch score</span>
        <strong>${escapeHtml(room.launchScore)}</strong>
        <small>${escapeHtml(room.readiness)}</small>
      </aside>
    </header>
    <main>
      ${quickAuditReceipt}
      ${decisionRoom}
      ${buyerCoverSheet}
      ${valueProofLedger}
      ${stakeholderBriefPack}
      ${buyerActivityTrail}
      ${buyerDecision}
      ${handoffPacket}
      <section class="proof-queue" aria-label="Proof queue">
        <div>
          <span class="eyebrow">Proof queue</span>
          <strong>${escapeHtml(room.closurePlan.length === 1 && proofQueueLead?.status === "ready" ? "Ready for buyer pilot review" : `${room.closurePlan.length} proof tasks before buyer-ready`)}</strong>
          <p>${escapeHtml(proofQueueSummary)}</p>
        </div>
        <ol>${proofQueue}</ol>
      </section>
      ${proofHealth}
      <section class="metrics" aria-label="Launch room metrics">${metrics}</section>
      <section class="layout">
        <article class="panel">
          <h2>Buyer story</h2>
          <p><strong>${escapeHtml(room.targetBuyer)}</strong></p>
          <p>${escapeHtml(room.projectBrief)}</p>
        </article>
        <aside class="panel next">
          <h2>Next action</h2>
          <p><strong>${escapeHtml(room.nextAction.label)}</strong></p>
          <p>${escapeHtml(room.nextAction.owner)}: ${escapeHtml(room.nextAction.action)}</p>
          <nav><a href="${escapeHtml(compactArtifactHref(room.nextAction.href))}">Open next artifact</a></nav>
        </aside>
      </section>
      <section class="panel closure-panel">
        <div class="closure-head">
          <div>
            <h2>Proof closure plan</h2>
            <p>Turn every non-ready artifact into a buyer-visible proof task with an owner, acceptance signal, and evidence target.</p>
          </div>
          <nav><a href="${escapeHtml(compactArtifactHref(room.nextAction.href))}">Start with ${escapeHtml(room.nextAction.label)}</a></nav>
        </div>
        <ol class="closure-list">${closurePlan}</ol>
      </section>
      <section class="panel">
        <h2>Artifact links</h2>
        <div class="artifact-grid">${artifacts}</div>
      </section>
      <section class="panel">
        <h2>Accountable AI squad</h2>
        <ul class="agent-list">${agents}</ul>
      </section>
    </main>
    <script id="launch-room-action-config" type="application/json">${actionConfigJson}</script>
    <script>
      (() => {
        const configSource = document.getElementById("launch-room-action-config");
        const config = configSource ? JSON.parse(configSource.textContent || "{}") : {};
        const loadJson = async (url) => {
          if (!url) throw new Error("missing launch room action URL");
          const response = await fetch(url, { headers: { Accept: "application/json" } });
          if (!response.ok) throw new Error("launch room action payload unavailable");
          return response.json();
        };
        document.querySelectorAll("[data-launch-room-handoff-verify]").forEach((button) => {
          const root = button.closest(".decision-room-actions, .handoff-verify") || document;
          const output = root.querySelector("[data-launch-room-handoff-verify-result]");
          if (!output) return;
          button.addEventListener("click", async () => {
            button.disabled = true;
            output.dataset.status = "checking";
            output.textContent = "Verifying receipt...";
            try {
              const request = await loadJson(config.handoffVerifyRequestUrl);
              const response = await fetch(${handoffVerificationApiPathJson}, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request)
              });
              const data = await response.json().catch(() => ({}));
              const verification = data.verification || {};
              output.dataset.status = verification.status === "verified" ? "verified" : "mismatch";
              output.textContent = verification.status === "verified"
                ? "Verified in this browser. Checksum " + (verification.actualChecksum || request.checksum) + " matches the replay payload."
                : "Receipt mismatch. Re-export the launch room before accepting this handoff decision.";
            } catch (error) {
              output.dataset.status = "error";
              output.textContent = "Could not verify receipt. Check the API route and try again.";
            } finally {
              button.disabled = false;
            }
          });
        });
      })();
      (() => {
        const configSource = document.getElementById("launch-room-action-config");
        const config = configSource ? JSON.parse(configSource.textContent || "{}") : {};
        const loadJson = async (url) => {
          if (!url) throw new Error("missing launch room action URL");
          const response = await fetch(url, { headers: { Accept: "application/json" } });
          if (!response.ok) throw new Error("launch room action payload unavailable");
          return response.json();
        };
        document.querySelectorAll("[data-launch-room-copy-handoff]").forEach((button) => {
          const root = button.closest(".decision-room-actions") || document;
          const output = root.querySelector("[data-launch-room-copy-result]");
          if (!output) return;
          button.addEventListener("click", async () => {
            try {
              const payload = await loadJson(config.handoffCopyUrl);
              await navigator.clipboard.writeText(payload.text || "");
              output.dataset.status = "copied";
              output.textContent = "Handoff copied. Paste it into the buyer thread with the launch room link.";
            } catch (error) {
              output.dataset.status = "error";
              output.textContent = "Could not copy handoff in this browser. Download the Markdown instead.";
            }
          });
        });
      })();
      (() => {
        const button = document.querySelector("[data-launch-room-follow-up-verify]");
        const output = document.querySelector("[data-launch-room-follow-up-verify-result]");
        const configSource = document.getElementById("launch-room-action-config");
        const config = configSource ? JSON.parse(configSource.textContent || "{}") : {};
        const loadJson = async (url) => {
          if (!url) throw new Error("missing launch room action URL");
          const response = await fetch(url, { headers: { Accept: "application/json" } });
          if (!response.ok) throw new Error("launch room action payload unavailable");
          return response.json();
        };
        if (!button || !output) return;
        button.addEventListener("click", async () => {
          button.disabled = true;
          output.dataset.status = "checking";
          output.textContent = "Verifying follow-up receipt...";
          try {
            const request = await loadJson(config.followUpVerifyRequestUrl);
            const response = await fetch(${followUpVerificationApiPathJson}, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(request)
            });
            const data = await response.json().catch(() => ({}));
            const verification = data.verification || {};
            output.dataset.status = verification.status === "verified" ? "verified" : "mismatch";
            output.textContent = verification.status === "verified"
              ? "Verified in this browser. Follow-up checksum " + (verification.actualChecksum || request.checksum) + " matches the exported records."
              : "Follow-up receipt mismatch. Re-export the launch room before accepting these records.";
          } catch (error) {
            output.dataset.status = "error";
            output.textContent = "Could not verify follow-up receipt. Check the API route and try again.";
          } finally {
            button.disabled = false;
          }
        });
      })();
    </script>
    <footer>Generated by A2A Agent Marketplace. This room is intended for public review, sponsor approval, and first buyer pilot kickoff.</footer>
  </body>
</html>`;
}
