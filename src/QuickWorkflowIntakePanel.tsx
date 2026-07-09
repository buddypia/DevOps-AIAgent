import { BadgeCheck, CalendarDays, ClipboardCheck, Copy, Crosshair, Download, ExternalLink, FileText, Gauge, Rocket, RotateCcw, Send, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { rankAgents } from "./agentEngine";
import { buildBuyerProofReplacementPacket, type BuyerProofReplacementPacket } from "./buyerProofReplacementPacket.js";
import { buildBuyerDecisionAgendaSnapshot, type BuyerDecisionAgendaSnapshot, type BuyerDecisionAgendaStatus } from "./buyerDecisionAgenda.js";
import { buildBuyerDecisionFollowUpLedger, renderBuyerDecisionFollowUpHtml, type BuyerDecisionFollowUpLedger } from "./buyerDecisionFollowUp.js";
import { BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM, BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM } from "./buyerReviewKit.js";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate";
import { downloadJsonFile } from "./downloadArtifact";
import { normalizeBuyerValueScenarioInput } from "./buyerValueScenario.js";
import { normalizeBuyerWorkOrderInput } from "./buyerWorkOrder.js";
import { normalizePilotRunReceiptInput } from "./pilotRunReceipt.js";
import {
  QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION,
  quickExternalReviewDecisionReceiptChecksum,
  quickExternalReviewDecisionReceiptRequestJson,
  verifyQuickExternalReviewDecisionReceipt,
  type QuickExternalReviewDecision,
  type QuickExternalReviewDecisionReceiptReplacementCloseout,
  type QuickExternalReviewDecisionReceiptPayload,
  type QuickExternalReviewDecisionReceiptVerificationRequest
} from "./quickExternalReviewDecisionReceipt.js";
import {
  QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERSION,
  quickExternalReviewOwnerPacketReceiptChecksum,
  quickExternalReviewOwnerPacketReceiptRequestJson,
  type QuickExternalReviewOwnerPacketFollowUpLedger,
  type QuickExternalReviewOwnerPacketRunbookItem,
  type QuickExternalReviewOwnerPacketReceiptPayload
} from "./quickExternalReviewOwnerPacketReceipt.js";
import {
  quickBuyerEvidencePayloadWithReceiptReplacementCloseout,
  quickBuyerEvidenceReceiptReplacementCloseoutFromPayload
} from "./quickBuyerEvidenceCloseoutReceiptImport.js";
import {
  QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERSION,
  quickBuyerEvidenceResponseOwnerPacketReceiptChecksum,
  quickBuyerEvidenceResponseOwnerPacketReceiptRequestJson,
  type QuickBuyerEvidenceResponseOwnerPacketReceiptPayload
} from "./quickBuyerEvidenceResponseOwnerPacketReceipt.js";
import {
  QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH,
  QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION,
  quickWorkflowConversionCanonicalJson,
  quickWorkflowConversionReceiptChecksum,
  verifyQuickWorkflowConversionReceipt,
  type QuickWorkflowConversionReceiptPayload,
  type QuickWorkflowConversionReceiptVerification
} from "./quickWorkflowConversionReceipt";
import {
  QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION,
  buildQuickPublicValueReleaseReceipt,
  type QuickPublicValueReleaseReceipt
} from "./quickPublicValueReleaseReceipt.js";
import {
  QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM,
  QUICK_EXTERNAL_REVIEW_RESPONSE_KEY_PARAM,
  QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PARAM,
  QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM,
  QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION,
  QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PARAM,
  decodeQuickBuyerEvidencePackShareParam,
  decodeQuickBuyerEvidenceResponseShareParam,
  decodeQuickExternalReviewPacketShareParam,
  decodeQuickExternalReviewResponseShareParam,
  quickBuyerEvidencePackShareHref,
  quickBuyerEvidenceResponseShareHref,
  quickExternalReviewPacketShareHref
} from "./quickExternalReviewPacketShare.js";
import {
  QUICK_BUYER_DECISION_REPLY_RECORD_RECEIPT_VERSION,
  QUICK_BUYER_DECISION_REPLY_RECORD_VERIFY_PATH,
  quickBuyerDecisionReplyRecordChecksum,
  quickBuyerDecisionReplyRecordPayloadJson,
  quickBuyerDecisionReplyRecordVerificationRequestJson,
  verifyQuickBuyerDecisionReplyRecordReceipt,
  type QuickBuyerDecisionReplyRecordPayload,
  type QuickBuyerDecisionReplyRecordVerification
} from "./quickBuyerDecisionReplyRecordReceipt.js";
import {
  QUICK_BUYER_VALIDATION_ANSWER_RECORD_RECEIPT_VERSION,
  QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH,
  quickBuyerValidationAnswerRecordDecision,
  quickBuyerValidationAnswerRecordChecksum,
  quickBuyerValidationAnswerRecordPayloadJson,
  quickBuyerValidationAnswerRecordVerificationRequestJson,
  verifyQuickBuyerValidationAnswerRecordReceipt,
  type QuickBuyerValidationAnswerRecordDecision,
  type QuickBuyerValidationAnswerRecordPayload,
  type QuickBuyerValidationAnswerRecordVerification
} from "./quickBuyerValidationAnswerRecordReceipt.js";
import {
  QUICK_VALUE_REALIZATION_CLOSEOUT_RECEIPT_VERSION,
  QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH,
  quickValueRealizationCloseoutChecksum,
  quickValueRealizationCloseoutPayloadJson,
  quickValueRealizationCloseoutVerificationRequestJson,
  verifyQuickValueRealizationCloseoutReceipt,
  type QuickValueRealizationCloseoutPayload,
  type QuickValueRealizationCloseoutRepairQueuePayload,
  type QuickValueRealizationCloseoutVerification
} from "./quickValueRealizationCloseoutReceipt.js";
import {
  QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_RECEIPT_VERSION,
  QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH,
  quickValueRealizationCloseoutRepairAcknowledgementChecksum,
  quickValueRealizationCloseoutRepairAcknowledgementPayloadJson,
  quickValueRealizationCloseoutRepairAcknowledgementRequestJson,
  verifyQuickValueRealizationCloseoutRepairAcknowledgementReceipt,
  type QuickValueRealizationCloseoutRepairAcknowledgementPayload,
  type QuickValueRealizationCloseoutRepairAcknowledgementVerification
} from "./quickValueRealizationCloseoutRepairReceipt.js";
import {
  QUICK_VALUE_REALIZATION_ACCEPTANCE_RECEIPT_VERSION,
  QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH,
  quickValueRealizationAcceptanceChecksum,
  quickValueRealizationAcceptancePayloadJson,
  quickValueRealizationAcceptanceRequestJson,
  verifyQuickValueRealizationAcceptanceReceipt,
  type QuickValueRealizationAcceptanceDecision,
  type QuickValueRealizationAcceptancePayload,
  type QuickValueRealizationAcceptanceVerification
} from "./quickValueRealizationAcceptanceReceipt.js";
import {
  QUICK_VALUE_REVIEW_EXECUTION_RECEIPT_VERSION,
  QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH,
  quickValueReviewExecutionChecksum,
  quickValueReviewExecutionPayloadJson,
  quickValueReviewExecutionRequestJson,
  verifyQuickValueReviewExecutionReceipt,
  type QuickValueReviewExecutionDecision,
  type QuickValueReviewExecutionPayload,
  type QuickValueReviewExecutionVerification
} from "./quickValueReviewExecutionReceipt.js";
import {
  QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_RECEIPT_VERSION,
  QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH,
  quickValueReviewExecutionCloseoutChecksum,
  quickValueReviewExecutionCloseoutPayloadJson,
  quickValueReviewExecutionCloseoutRequestJson,
  verifyQuickValueReviewExecutionCloseoutReceipt,
  type QuickValueReviewExecutionCloseoutDecision,
  type QuickValueReviewExecutionCloseoutPayload,
  type QuickValueReviewExecutionCloseoutVerification
} from "./quickValueReviewExecutionCloseoutReceipt.js";
import { SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH, SAMPLE_PILOT_RECEIPT_PATH, SAMPLE_WORK_ORDER_PATH } from "./sampleProofPaths";
import { SUBMISSION_PROOF, validProtoPediaUrl, validVideoUrl } from "./submission";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";
import type { AgentFit, MarketAgent } from "./types";
import { buildWorkflowIntakeBrief } from "./workflowIntake.js";
import { buildWorkflowIntakeDraftFromText, type WorkflowIntakeDraft } from "./workflowIntakeDraft";
import type { WorkflowIntakeProofSlot } from "./workflowIntakeShareGate";
import { buildWorkflowLiveProofAudit, type WorkflowLiveProofAudit } from "./workflowLiveProofAudit";
import { buildWorkspaceDraft } from "./workspaceDraft.js";

const QuickWorkflowLiveBuyerCasePanel = lazy(() =>
  import("./QuickWorkflowSupportingPanels").then((module) => ({ default: module.QuickWorkflowLiveBuyerCasePanel }))
);
const QuickA2ATrialStarterPanel = lazy(() =>
  import("./QuickWorkflowSupportingPanels").then((module) => ({ default: module.QuickA2ATrialStarterPanel }))
);
const QuickExternalReviewReadinessPanel = lazy(() => import("./QuickExternalReviewReadinessPanel"));
const QuickBuyerDecisionReplyPanel = lazy(() => import("./QuickBuyerDecisionReplyPanel"));
const QuickBuyerDecisionSuccessPanel = lazy(() => import("./QuickBuyerDecisionSuccessPanel"));
const QuickBuyerValidationDecisionHandoffPanel = lazy(() => import("./QuickBuyerValidationDecisionHandoffPanel"));
const QuickWorkflowCommercialPilotOfferPanel = lazy(() => import("./QuickWorkflowCommercialPilotOfferPanel"));
const QuickProofPreflightPanel = lazy(() => import("./QuickProofPreflightPanel"));

const WORKFLOW_INTAKE_EXTRACT_API_PATH = "/api/workflow-intake/extract";
const QUICK_PROOF_REPAIR_PLAN_ID = "quick-proof-repair-plan";
const QUICK_LIVE_PROOF_AUDIT_ID = "quick-live-proof-audit";
const QUICK_WORKFLOW_SOURCE_TRACE_ID = "quick-workflow-source-trace";
const QUICK_BUYER_ROOM_PREVIEW_ID = "quick-buyer-room-preview";
const QUICK_BUYER_DECISION_REPLY_PATH_ID = "quick-buyer-decision-reply-path";
const QUICK_BUYER_VALIDATION_RECORDER_ID = "quick-buyer-validation-answer-recorder";
const QUICK_GLOBAL_PROOF_FRESHNESS_TTL_HOURS = 24;
const QUICK_LIVE_PROOF_FRESHNESS_TTL_HOURS = QUICK_GLOBAL_PROOF_FRESHNESS_TTL_HOURS;
export const QUICK_WORKFLOW_BROWSER_DRAFT_STORAGE_KEY = "quick-workflow-intake:draft:v1";
export const QUICK_WORKFLOW_BROWSER_DRAFT_FILENAME = "quick-workflow-draft.json";
export const QUICK_WORKFLOW_BROWSER_DRAFT_SHARE_PARAM = "workflowDraft";
const QUICK_WORKFLOW_BROWSER_DRAFT_VERSION = 1;

type QuickProofLinkId = keyof WorkflowIntakeDraft["proofLinks"];
const QUICK_PROOF_LINK_IDS: readonly QuickProofLinkId[] = ["targetUrl", "protopediaUrl", "videoUrl", "pilotEvidenceUrl", "workOrderEvidenceUrl"];

export type QuickWorkflowIntakeExampleLinks = {
  proofBaseUrl?: string;
  protopediaUrl?: string;
  videoUrl?: string;
};

function cleanPublicHttpsUrl(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function demoProofHostReason(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname)) return "local-only host";
    if (hostname === "example.com" || hostname.endsWith(".example.com")) return "example.com demo domain";
    if (hostname === "example.org" || hostname.endsWith(".example.org")) return "example.org demo domain";
    if (hostname === "example.net" || hostname.endsWith(".example.net")) return "example.net demo domain";
    if (hostname.endsWith(".example")) return ".example demo domain";
    if (hostname.endsWith(".test")) return ".test placeholder domain";
    if (hostname.endsWith(".invalid")) return ".invalid placeholder domain";
    if (hostname.endsWith(".localhost")) return ".localhost local-only domain";
    if (hostname.includes("your-cloud-run-url") || hostname.includes("your-service")) return "placeholder deployment host";
    return "";
  } catch {
    return "";
  }
}

function placeholderProofUrlReason(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  const normalized = trimmed.toLowerCase();
  if (trimmed.includes("...") || normalized.includes("%2e%2e%2e") || /[<>]/.test(trimmed) || normalized.includes("%3c") || normalized.includes("%3e")) {
    return "placeholder proof URL";
  }
  return "";
}

function cleanBuyerFacingProofUrl(value: string | undefined) {
  const normalized = cleanPublicHttpsUrl(value);
  if (!normalized) return "";
  if (placeholderProofUrlReason(normalized)) return "";
  return demoProofHostReason(normalized) ? "" : normalized;
}

function buyerFacingProofUrlBlockerReason(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "missing artifact URL";
  const normalized = cleanPublicHttpsUrl(trimmed);
  if (!normalized) return "not a public HTTPS URL";
  return placeholderProofUrlReason(normalized) || demoProofHostReason(normalized);
}

function hasBuyerFacingAgentTrial(draft: WorkflowIntakeDraft) {
  return Boolean(cleanBuyerFacingProofUrl(draft.agentTrialEvidence?.artifactUrl) && draft.agentTrialEvidence?.score && draft.agentTrialEvidence.score > 0);
}

function agentTrialReadinessEvidence(draft: WorkflowIntakeDraft) {
  const trial = draft.agentTrialEvidence;
  if (!trial) {
    return {
      evidence: "Accepted A2A trial receipt is not attached yet.",
      action: "Attach accepted A2A trial receipt with skill, score, and HTTPS artifact."
    };
  }
  const label = `${trial.agentName || "A2A agent"} / ${trial.skillId || "accepted trial"} / ${trial.score}/100`;
  const artifactIssue = buyerFacingProofUrlBlockerReason(trial.artifactUrl);
  if (artifactIssue) {
    return {
      evidence: `${label}, but artifact is ${artifactIssue}.`,
      action: "Replace the accepted A2A trial artifact with a public HTTPS receipt URL."
    };
  }
  return {
    evidence: `${label}.`,
    action: "Attach accepted A2A trial receipt with skill, score, and HTTPS artifact."
  };
}

function currentPublicOrigin() {
  if (typeof window === "undefined") return "";
  return cleanPublicHttpsUrl(window.location.origin);
}

function externalReviewResponseStorageKey(key: string) {
  return `quick-external-review-response:${key}`;
}

function quickExternalReviewPacketTextFromUrl() {
  if (typeof window === "undefined") return "";
  try {
    return decodeQuickExternalReviewPacketShareParam(new URL(window.location.href).searchParams.get(QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM));
  } catch {
    return "";
  }
}

function quickExternalReviewResponseTextFromUrl() {
  if (typeof window === "undefined") return "";
  try {
    const url = new URL(window.location.href);
    const sharedResponse = decodeQuickExternalReviewResponseShareParam(url.searchParams.get(QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PARAM));
    if (sharedResponse) return sharedResponse;
    const responseKey = url.searchParams.get(QUICK_EXTERNAL_REVIEW_RESPONSE_KEY_PARAM)?.trim() ?? "";
    if (!responseKey) return "";
    const storageKey = externalReviewResponseStorageKey(responseKey);
    return window.localStorage.getItem(storageKey) || window.sessionStorage.getItem(storageKey) || "";
  } catch {
    return "";
  }
}

function quickBuyerEvidencePackTextFromUrl() {
  if (typeof window === "undefined") return "";
  try {
    return decodeQuickBuyerEvidencePackShareParam(new URL(window.location.href).searchParams.get(QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM));
  } catch {
    return "";
  }
}

function quickBuyerEvidenceResponseTextFromUrl() {
  if (typeof window === "undefined") return "";
  try {
    return decodeQuickBuyerEvidenceResponseShareParam(new URL(window.location.href).searchParams.get(QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PARAM));
  } catch {
    return "";
  }
}

export function buildQuickWorkflowIntakeExample(links: QuickWorkflowIntakeExampleLinks = {}) {
  const proofBaseUrl = cleanBuyerFacingProofUrl(links.proofBaseUrl || SUBMISSION_PROOF.deployedUrl);
  const protopediaUrl = links.protopediaUrl?.trim() || SUBMISSION_PROOF.protopediaUrl;
  const videoUrl = links.videoUrl?.trim() || SUBMISSION_PROOF.videoUrl;
  const pilotReceiptUrl = proofBaseUrl ? `${proofBaseUrl}${SAMPLE_PILOT_RECEIPT_PATH}` : "";
  const workOrderProofUrl = proofBaseUrl ? `${proofBaseUrl}${SAMPLE_WORK_ORDER_PATH}` : "";
  const a2aTrialReceiptUrl = proofBaseUrl ? `${proofBaseUrl}${SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH}` : "";

  const lines = [
    "Buyer: Platform release lead",
    "Workflow: weekly Cloud Run release-readiness review is copied from tickets, CI logs, rollout checks, and chat by hand before sponsor sign-off.",
    "Baseline: release proof is scattered across tickets, spreadsheets, Cloud Run checks, and review threads.",
    "Success: save 6 hours per review and close all public proof gaps before sponsor review.",
    "Team 8 people, 5 reviews/month, manual 28 hours per review, 75% adoption, hourly ¥12000, risk ¥240000.",
    "Pilot: manual 1680 min, assisted 560 min, 4 participants, 5/5 tasks accepted.",
    "Reviewer: Platform sponsor",
    "Pilot notes: observed run completed with public receipt, accepted tasks, and sponsor stop rule reviewed.",
    "Data: public-safe redacted evidence.",
    "Publication gaps: public ProtoPedia story and walkthrough video are pending publication."
  ];

  if (proofBaseUrl) lines.push(`Deployment: ${proofBaseUrl}`);
  if (validProtoPediaUrl(protopediaUrl) && !placeholderProofUrlReason(protopediaUrl)) lines.push(`ProtoPedia: ${protopediaUrl}`);
  if (validVideoUrl(videoUrl) && !placeholderProofUrlReason(videoUrl)) lines.push(`Walkthrough: ${videoUrl}`);
  if (pilotReceiptUrl) lines.push(`Pilot receipt: ${pilotReceiptUrl}`);
  if (workOrderProofUrl) lines.push(`Work order proof: ${workOrderProofUrl}`);
  if (a2aTrialReceiptUrl) lines.push(`Accepted A2A trial receipt: Cloud Run SRE / cloudrun.release-proof / score 94 / ${a2aTrialReceiptUrl}`);
  if (proofBaseUrl) lines.push(`Evidence: ${proofBaseUrl}`);

  return lines.join("\n");
}

export const QUICK_WORKFLOW_INTAKE_EXAMPLE = buildQuickWorkflowIntakeExample();

type QuickWorkflowIntakeStatus = "idle" | "extracting" | "previewed" | "applied" | "failed";
export type QuickBuyerRoomPreviewStatus = "ready" | "watch" | "blocked";
type QuickLiveProofStatus = "idle" | "checking" | "checked" | "failed";
type QuickExtractionReceiptStatus = "idle" | "checking" | "verified" | "failed";
type QuickExtractionSource = "gemini" | "local-fallback";
type QuickWorkflowInputReadinessStatus = "ready" | "watch" | "blocked";

function quickProofRepairFieldId(id: QuickProofLinkId) {
  return `${QUICK_PROOF_REPAIR_PLAN_ID}-${id}`;
}

function quickProofRepairFieldHref(id: QuickProofLinkId) {
  return `#${quickProofRepairFieldId(id)}`;
}

function quickProofLinkIdFromRepairHref(href: string): QuickProofLinkId | null {
  return QUICK_PROOF_LINK_IDS.find((id) => href === quickProofRepairFieldHref(id)) ?? null;
}

export type QuickWorkflowInputReadinessItem = {
  id: "scope" | "value-model" | "measured-run" | "public-proof" | "data-boundary" | "agent-trust";
  label: string;
  status: QuickWorkflowInputReadinessStatus;
  evidence: string;
  action: string;
};

export type QuickWorkflowInputReadiness = {
  status: QuickWorkflowInputReadinessStatus;
  score: number;
  readyCount: number;
  totalCount: number;
  headline: string;
  nextAction: string;
  items: QuickWorkflowInputReadinessItem[];
};

type QuickWorkflowExtractionReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: string;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  href: string;
  verification: {
    status: "verified" | "mismatch";
    expectedChecksum: string;
    actualChecksum: string;
    instruction: string;
  };
};

type QuickWorkflowExtractionReceiptVerificationResponse = {
  error?: string;
  verification?: QuickWorkflowExtractionReceipt["verification"];
};

type QuickWorkflowExtractionResult = {
  source: QuickExtractionSource;
  model: string;
  extractedAt: string;
  draft: WorkflowIntakeDraft;
  guardrails: string[];
  fallbackReason?: string;
  receipt?: QuickWorkflowExtractionReceipt;
};

const QUICK_WORKFLOW_EXTRACT_TIMEOUT_MS = 6500;

export type QuickBuyerRoomPreviewRow = {
  id: "scope" | "value" | "pilot" | "proof" | "a2a" | "data";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  value: string;
  proof: string;
};

export type QuickPilotWeekPlanStep = {
  id: "scope" | "instrument" | "trial" | "verify" | "decide";
  day: "Day 0" | "Day 1" | "Day 2" | "Day 3" | "Day 5";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  action: string;
  acceptance: string;
  proof: string;
  href: string;
};

export type QuickPilotWeekTaskPacket = {
  csvText: string;
  csvHref: string;
  kickoffText: string;
  kickoffHref: string;
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    generatedFrom: string[];
  };
  receiptHref: string;
};

export type QuickBuyerHandoffBrief = {
  decision: "send-ready" | "repair-before-send" | "do-not-send";
  label: string;
  headline: string;
  promise: string;
  proofSummary: string;
  nextAction: {
    label: string;
    owner: string;
    action: string;
    proof: string;
    href: string;
    status: QuickBuyerRoomPreviewStatus;
  };
  buyerMessage: string[];
  handoffText: string;
  handoffHref: string;
};

export type QuickBuyerDecisionCase = {
  status: QuickBuyerRoomPreviewStatus;
  decision: "send" | "repair" | "hold";
  decisionLabel: string;
  headline: string;
  summary: string;
  buyerQuestion: string;
  answer: string;
  valueEvidence: string;
  proofEvidence: string;
  trustEvidence: string;
  dataBoundary: string;
  owner: string;
  nextAction: string;
  caseText: string;
  caseHref: string;
};

export type QuickPilotEconomicsScenario = {
  id: "downside" | "base" | "upside";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  adoptionRatePercent: number;
  savedMinutesPerRun: number;
  monthlyHoursSaved: number;
  monthlyValueYen: number;
  evidence: string;
  action: string;
};

export type QuickPilotEconomicsStressTest = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  monthlyValueRange: string;
  riskAdjustedMonthlyValueYen: number;
  scenarios: QuickPilotEconomicsScenario[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickClaimProofItem = {
  id:
    | "workflow-scope"
    | "value-model"
    | "measured-run"
    | "public-proof"
    | "agent-trust"
    | "data-boundary"
    | "approval-path"
    | "procurement-choice";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  claim: string;
  evidence: string;
  source: string;
  sourceTraceIds: Array<WorkflowIntakeDraft["sourceTrace"][number]["id"]>;
  sourceStatus: WorkflowIntakeDraft["sourceTrace"][number]["status"] | "derived";
  sourceLine: string;
  sourceLineNumber: number | null;
  proof: string;
  owner: string;
  verification: string;
  risk: string;
  nextAction: string;
  href: string;
};

export type QuickClaimProofLedger = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  score: number;
  readyCount: number;
  watchCount: number;
  blockedCount: number;
  primaryRisk: string;
  items: QuickClaimProofItem[];
  csvText: string;
  csvHref: string;
  exportMarkdown: string;
  exportHref: string;
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
  };
  receiptHref: string;
};

export type QuickBuyerPromiseGateItem = {
  id: "value-promise" | "proof-promise" | "agent-promise" | "commercial-promise";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  allowedClaim: string;
  evidence: string;
  blockedClaim: string;
  nextAction: string;
  href: string;
};

export type QuickBuyerPromiseGate = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  safeUse: string;
  publicPromise: string;
  nextAction: string;
  readyCount: number;
  blockedCount: number;
  notAllowedClaims: string[];
  items: QuickBuyerPromiseGateItem[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickPublicSafeRedactionFinding = {
  id: string;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  sourceLabel: string;
  sourceLineNumber: number | null;
  redactedLine: string;
  action: string;
};

export type QuickPublicSafeRedactionPacket = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  blockedCount: number;
  watchCount: number;
  findings: QuickPublicSafeRedactionFinding[];
  redactedWorkflowNote: string;
  publicSafeWorkflowNote: string;
  publicSafeWorkflowNoteHref: string;
  rewriteLineCount: number;
  exportMarkdown: string;
  exportHref: string;
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
  };
  receiptHref: string;
};

export type QuickEvidenceCompletionItem = {
  id: string;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  ask: string;
  sourceLine: string;
  evidence: string;
  href: string;
};

export type QuickEvidenceCompletionPacket = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  openCount: number;
  blockedCount: number;
  watchCount: number;
  items: QuickEvidenceCompletionItem[];
  completionNote: string;
  completionNoteHref: string;
  exportMarkdown: string;
  exportHref: string;
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
  };
  receiptHref: string;
};

export type QuickStakeholderApprovalStep = {
  id: "finance" | "security" | "pilot-owner" | "procurement";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  gate: string;
  evidence: string;
  nextAction: string;
  href: string;
};

export type QuickStakeholderApprovalRoute = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  blockedCount: number;
  steps: QuickStakeholderApprovalStep[];
  routeText: string;
  routeHref: string;
};

export type QuickStakeholderApprovalEmail = {
  id: QuickStakeholderApprovalStep["id"];
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  subject: string;
  body: string;
  mailtoHref: string;
  replyTarget: string;
  evidence: string;
  risk: string;
};

export type QuickStakeholderApprovalEmailPack = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  nextRecipient: string;
  approvalDeadline: string;
  messages: QuickStakeholderApprovalEmail[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickPilotContractTerm = {
  id: "commercial-cap" | "scope-boundary" | "proof-gate" | "data-boundary" | "stop-rule" | "signature-path";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  clause: string;
  acceptance: string;
  evidence: string;
  href: string;
};

export type QuickPilotContractTerms = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  budgetCapYen: number;
  effectiveWindow: string;
  clearCount: number;
  blockedCount: number;
  terms: QuickPilotContractTerm[];
  stopRules: string[];
  signatures: string[];
  contractText: string;
  contractHref: string;
};

export type QuickPilotProofContractItem = {
  id: "buyer-promise" | "value-floor" | "proof-gate" | "budget-cap" | "stop-rule" | "renewal-rule";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  value: string;
  detail: string;
  action: string;
  href: string;
};

export type QuickPilotProofContract = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  nextOwner: string;
  nextAction: string;
  buyerPromise: string;
  valueFloor: string;
  budgetCap: string;
  renewalAsk: string;
  items: QuickPilotProofContractItem[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickProcurementAlternative = {
  id: "a2a-pilot" | "manual-status-quo" | "generic-ai" | "internal-build";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  monthlyValueYen: number;
  setupCostYen: number;
  paybackDays: number | null;
  proofReadiness: string;
  risk: string;
  decision: string;
  evidence: string;
};

export type QuickProcurementAlternativeMatrix = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  recommendedAlternativeId: QuickProcurementAlternative["id"];
  alternatives: QuickProcurementAlternative[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickAdoptionSuccessMetric = {
  id: "value-retention" | "repeat-usage" | "proof-freshness" | "owner-commitment" | "trust-boundary";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  target: string;
  evidence: string;
  action: string;
};

export type QuickAdoptionSuccessCheckpoint = {
  id: "day-0" | "day-7" | "day-14" | "day-30";
  window: "Day 0" | "Day 7" | "Day 14" | "Day 30";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  objective: string;
  evidence: string;
  exitCriteria: string;
  href: string;
};

export type QuickAdoptionSuccessPlan = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  reviewWindow: string;
  adoptionTargetPercent: number;
  retainedMonthlyValueYen: number;
  readyCount: number;
  blockedCount: number;
  renewalAsk: string;
  metrics: QuickAdoptionSuccessMetric[];
  checkpoints: QuickAdoptionSuccessCheckpoint[];
  expansionCriteria: string[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickRolloutCommand = {
  id: "kickoff" | "proof-recheck" | "usage-review" | "value-review" | "expansion-decision";
  window: "Day 0" | "Day 3" | "Day 7" | "Day 14" | "Day 30";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  command: string;
  evidence: string;
  risk: string;
  href: string;
};

export type QuickRolloutOwnerLoad = {
  owner: string;
  commandCount: number;
  blockedCount: number;
  nextCommand: string;
};

export type QuickRolloutCommandBoard = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  blockedCount: number;
  nextOwner: string;
  nextCommand: string;
  commands: QuickRolloutCommand[];
  ownerLoads: QuickRolloutOwnerLoad[];
  taskCsvText: string;
  taskCsvHref: string;
  ownerBriefText: string;
  ownerBriefHref: string;
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
  };
  receiptHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickRolloutCalendarExport = {
  startDate: string;
  endDate: string;
  eventCount: number;
  icsText: string;
  icsHref: string;
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
  };
  receiptHref: string;
};

export type QuickDecisionClosePack = {
  status: BuyerDecisionAgendaStatus;
  headline: string;
  summary: string;
  agenda: BuyerDecisionAgendaSnapshot;
  agendaHref: string;
  followUpLedger: BuyerDecisionFollowUpLedger;
  followUpHref: string;
  followUpHtmlHref: string;
};

export type QuickProofRepairItem = {
  id: QuickProofLinkId;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  action: string;
  value: string;
  href: string;
  placeholder: string;
};

export type QuickProofRepairImpactItem = {
  id: "proof-slots" | "live-verification" | "buyer-send" | "global-review";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  evidence: string;
  nextAction: string;
  href: string;
};

export type QuickProofRepairImpact = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readinessScore: number;
  readyCount: number;
  repairCount: number;
  firstOpenLabel: string;
  firstOpenOwner: string;
  nextVerifierAction: string;
  items: QuickProofRepairImpactItem[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickProofRepairPlan = {
  readyCount: number;
  missingCount: number;
  invalidCount: number;
  repairCount: number;
  headline: string;
  summary: string;
  items: QuickProofRepairItem[];
  impact: QuickProofRepairImpact;
  repairText: string;
  repairHref: string;
};

export type QuickProofVerificationHandoffItem = {
  id: QuickProofLinkId;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  verificationStatus: WorkflowLiveProofAudit["rows"][number]["status"] | "not-run";
  url: string;
  owner: string;
  evidence: string;
  nextAction: string;
  href: string;
};

export type QuickProofVerificationHandoff = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  buyerSendDecision: string;
  receiptId: string;
  checkedAt: string;
  score: number;
  readyCount: number;
  totalCount: number;
  firstOpenLabel: string;
  items: QuickProofVerificationHandoffItem[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickProofVerificationRequestLink = {
  id: string;
  label: string;
  value: string;
};

export const QUICK_WORKFLOW_INTAKE_OUTPUTS = [
  {
    label: "Buyer room preview",
    detail: "Decision status, buyer ask, value proof, A2A receipt, data boundary, and close rule before the workspace is changed."
  },
  {
    label: "Evidence pack",
    detail: "A single buyer-send or internal-repair bundle with decision case, send memo, claim ledger, redaction packet, and receipt verifier."
  },
  {
    label: "Buyer value map",
    detail: "Before-state, agent run, measured value, buyer proof, and decision are tied into one buyer-facing story."
  },
  {
    label: "Buyer validation script",
    detail: "Five buyer-facing questions validate pain, frequency, value, trust, and commitment before asking for pilot approval."
  },
  {
    label: "Proof repair plan",
    detail: "Five public proof slots with owners, missing links, invalid domains, and the exact repair action for each slot."
  },
  {
    label: "Claim-proof ledger",
    detail: "Every buyer-facing claim is mapped to its source, proof, owner, verification method, risk, next action, CSV export, and checksum receipt."
  },
  {
    label: "Procurement matrix",
    detail: "A2A pilot, manual status quo, generic AI, and internal build compared by downside value, setup cost, payback, proof readiness, and risk."
  },
  {
    label: "Adoption success plan",
    detail: "Day 0, 7, 14, and 30 owner checkpoints that prove retained value, usage, proof freshness, and expansion readiness after the pilot."
  },
  {
    label: "Rollout command board",
    detail: "Day 0, 3, 7, 14, and 30 execution commands with owner workload, task-tracker CSV, owner brief, checksum receipt, evidence, and risk."
  },
  {
    label: "Decision close pack",
    detail: "A buyer meeting agenda plus owner-by-owner follow-up ledger, CSV, receipt, and publishable HTML page so the meeting turns into closed actions."
  },
  {
    label: "Pilot-week packet",
    detail: "Task CSV, kickoff note, procurement matrix, adoption plan, objection brief, handoff text, and a checksum receipt for the first buyer pilot week."
  },
  {
    label: "Publication kit",
    detail: "ProtoPedia-ready story copy, walkthrough shot list, required tag, and the public evidence gaps still blocking launch."
  },
  {
    label: "Reviewer decision memo",
    detail: "Accept, hold, or do-not-send outcome derived from manifest verification, proof freshness, claim trace, value route, and objection defense."
  }
] as const;

export const QUICK_WORKFLOW_INTAKE_PRIMARY_OUTCOMES = [
  {
    label: "Buyer decision room",
    value: "Continue, revise, or stop",
    detail: "A buyer-safe room with value, risk, data boundary, owner, and close rule."
  },
  {
    label: "Proof repair queue",
    value: "Every gap has an owner",
    detail: "Missing or invalid proof stays visible as a repair action instead of becoming fake evidence."
  },
  {
    label: "Pilot-week packet",
    value: "Tasks, kickoff, receipt",
    detail: "Exports the first-week task CSV, kickoff note, and checksum receipt for handoff."
  }
] as const;

function readinessScore(status: QuickWorkflowInputReadinessStatus) {
  if (status === "ready") return 100;
  if (status === "watch") return 65;
  return 0;
}

function readinessStatusFor(items: QuickWorkflowInputReadinessItem[]): QuickWorkflowInputReadinessStatus {
  if (items.some((item) => item.status === "blocked")) return "blocked";
  if (items.some((item) => item.status === "watch")) return "watch";
  return "ready";
}

function readinessHeadlineFor(status: QuickWorkflowInputReadinessStatus, hasInput: boolean) {
  if (!hasInput) return "Paste a workflow note to see buyer readiness";
  if (status === "ready") return "Input can become a buyer room";
  if (status === "watch") return "Input is usable, proof still needs closure";
  return "Add the missing buyer facts first";
}

function valueEvidenceFor(draft: WorkflowIntakeDraft) {
  const scenario = draft.buyerScenario;
  const fields = [
    scenario.teamSize ? `${scenario.teamSize} people` : "",
    scenario.cyclesPerMonth ? `${scenario.cyclesPerMonth} cycles/month` : "",
    scenario.manualHoursPerCycle ? `${scenario.manualHoursPerCycle}h manual/cycle` : "",
    scenario.adoptionRatePercent ? `${scenario.adoptionRatePercent}% adoption` : "",
    scenario.hourlyCostYen ? `¥${scenario.hourlyCostYen.toLocaleString("ja-JP")}/h` : ""
  ].filter(Boolean);
  return fields.length > 0 ? fields.join(" / ") : "No recurring value model found yet.";
}

function measuredRunEvidenceFor(draft: WorkflowIntakeDraft) {
  const pilot = draft.pilotRun;
  const manual = typeof pilot.observedManualMinutes === "number" ? pilot.observedManualMinutes : 0;
  const assisted = typeof pilot.observedAssistedMinutes === "number" ? pilot.observedAssistedMinutes : 0;
  const accepted = typeof pilot.acceptedTasks === "number" ? pilot.acceptedTasks : 0;
  const total = typeof pilot.totalTasks === "number" ? pilot.totalTasks : 0;
  if (!manual && !assisted && !total) return "No manual/assisted run or accepted task count found yet.";
  return `${Math.max(0, manual - assisted)} minutes saved/run; ${accepted}/${total || "?"} tasks accepted.`;
}

function publicProofValuesFor(draft: WorkflowIntakeDraft) {
  return [
    draft.proofLinks.targetUrl,
    draft.proofLinks.protopediaUrl,
    draft.proofLinks.videoUrl,
    draft.proofLinks.pilotEvidenceUrl,
    draft.proofLinks.workOrderEvidenceUrl,
    draft.workOrder.evidenceUrl,
    draft.pilotRun.evidenceUrl
  ]
    .map((value) => cleanBuyerFacingProofUrl(value))
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function proofEvidenceFor(draft: WorkflowIntakeDraft) {
  const proofLabels = [
    cleanBuyerFacingProofUrl(draft.proofLinks.targetUrl) ? "deployment" : "",
    cleanBuyerFacingProofUrl(draft.proofLinks.protopediaUrl) ? "ProtoPedia" : "",
    cleanBuyerFacingProofUrl(draft.proofLinks.videoUrl) ? "walkthrough" : "",
    cleanBuyerFacingProofUrl(draft.proofLinks.pilotEvidenceUrl) ? "pilot receipt" : "",
    cleanBuyerFacingProofUrl(draft.proofLinks.workOrderEvidenceUrl) || cleanBuyerFacingProofUrl(draft.workOrder.evidenceUrl) ? "work order proof" : ""
  ].filter(Boolean);
  const fallbackCount = publicProofValuesFor(draft).length;
  if (proofLabels.length > 0) return `${proofLabels.length}/5 proof links: ${proofLabels.join(", ")}.`;
  return fallbackCount > 0 ? `${fallbackCount} public proof URL captured.` : "No buyer-facing proof link found yet.";
}

export function buildQuickWorkflowInputReadiness(raw: string, parsedDraft?: WorkflowIntakeDraft): QuickWorkflowInputReadiness {
  const hasInput = raw.trim().length > 0;
  const draft = parsedDraft ?? buildWorkflowIntakeDraftFromText(raw);
  const signals = new Set(draft.detectedSignals);
  const valueFieldCount = Object.values(draft.buyerScenario).filter((value) => typeof value === "number" && Number.isFinite(value)).length;
  const proofLinkCount = publicProofValuesFor(draft).length;
  const hasMeasuredMinutes = signals.has("measured minutes");
  const hasAcceptedTasks = signals.has("accepted tasks");
  const hasScope = signals.has("workflow request") && signals.has("target buyer") && signals.has("success metric") && signals.has("baseline");
  const hasPartialScope = signals.has("workflow request") || signals.has("target buyer");
  const hasAgentTrial = hasBuyerFacingAgentTrial(draft);
  const agentTrialReadiness = agentTrialReadinessEvidence(draft);

  const items: QuickWorkflowInputReadinessItem[] = [
    {
      id: "scope",
      label: "Buyer scope",
      status: hasScope ? "ready" : hasPartialScope ? "watch" : "blocked",
      evidence: hasPartialScope ? `${draft.workOrder.targetUser || "Target buyer missing"}: ${draft.workOrder.request || "workflow request missing"}` : "No buyer or bounded workflow found yet.",
      action: "Add buyer, workflow, success metric, and current baseline."
    },
    {
      id: "value-model",
      label: "Value model",
      status: valueFieldCount >= 4 ? "ready" : valueFieldCount >= 2 ? "watch" : "blocked",
      evidence: valueEvidenceFor(draft),
      action: "Add team size, cycles/month, manual hours, adoption rate, and hourly cost."
    },
    {
      id: "measured-run",
      label: "Measured run",
      status: hasMeasuredMinutes && hasAcceptedTasks ? "ready" : hasMeasuredMinutes || hasAcceptedTasks ? "watch" : "blocked",
      evidence: measuredRunEvidenceFor(draft),
      action: "Add manual vs assisted minutes and accepted task count."
    },
    {
      id: "public-proof",
      label: "Public proof",
      status: proofLinkCount >= 3 ? "ready" : proofLinkCount > 0 ? "watch" : "blocked",
      evidence: proofEvidenceFor(draft),
      action: "Attach deployment, pilot receipt, work order proof, walkthrough, or ProtoPedia URLs."
    },
    {
      id: "data-boundary",
      label: "Data boundary",
      status: draft.workOrder.dataSensitivity === "restricted" ? "blocked" : draft.workOrder.dataSensitivity === "public" ? "ready" : "watch",
      evidence: `${draft.workOrder.dataSensitivity || "internal"} data boundary detected.`,
      action: "State whether evidence is public-safe, redacted, internal, or restricted."
    },
    {
      id: "agent-trust",
      label: "Agent trust",
      status: hasAgentTrial ? "ready" : "watch",
      evidence: agentTrialReadiness.evidence,
      action: agentTrialReadiness.action
    }
  ];
  const status = hasInput ? readinessStatusFor(items) : "blocked";
  const readyCount = hasInput ? items.filter((item) => item.status === "ready").length : 0;
  const score = hasInput ? Math.round(items.reduce((sum, item) => sum + readinessScore(item.status), 0) / items.length) : 0;
  const nextAction = hasInput ? items.find((item) => item.status !== "ready")?.action || "Preview the buyer room and run proof verification." : "Paste a workflow note with buyer, value, proof, and data boundary.";

  return {
    status,
    score,
    readyCount,
    totalCount: items.length,
    headline: readinessHeadlineFor(status, hasInput),
    nextAction,
    items
  };
}

export function quickWorkflowApplyGate(readiness: QuickWorkflowInputReadiness, hasDraft: boolean, isExtracting = false) {
  if (isExtracting) {
    return {
      canApply: false,
      message: "Wait for extraction to finish before applying this workspace."
    };
  }
  if (!hasDraft) {
    return {
      canApply: false,
      message: "Preview a workflow note before applying it to the workspace."
    };
  }
  if (readiness.status === "ready") {
    return {
      canApply: true,
      message: "Buyer-ready input can update the workspace."
    };
  }
  const firstOpen = readiness.items.find((item) => item.status !== "ready");
  return {
    canApply: false,
    message: firstOpen ? `Cannot apply yet: ${firstOpen.action}` : `Cannot apply yet: ${readiness.nextAction}`
  };
}

const GEMINI_GUARDRAIL_WARNING_PATTERN = /^Gemini suggested .+ that was not present in the pasted note, so it was ignored\.$/;

export function quickWorkflowExtractionGuardrailAudit(warnings: string[], limit = 4) {
  const ignoredSuggestions = warnings.filter((warning) => GEMINI_GUARDRAIL_WARNING_PATTERN.test(warning));
  return {
    ignoredSuggestions: ignoredSuggestions.slice(0, Math.max(0, limit)),
    totalIgnored: ignoredSuggestions.length,
    hiddenIgnored: Math.max(0, ignoredSuggestions.length - Math.max(0, limit))
  };
}

export type QuickBuyerObjectionItem = {
  id: "valueProof" | "publicProof" | "agentTrust" | "dataBoundary" | "adoptionPath";
  label: string;
  question: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  answer: string;
  evidence: string;
  href: string;
};

export type QuickBuyerObjectionBrief = {
  readyCount: number;
  unresolvedCount: number;
  headline: string;
  summary: string;
  items: QuickBuyerObjectionItem[];
  defenseText: string;
  defenseHref: string;
};

export type QuickBuyerValueMapItem = {
  id: "before" | "agent-run" | "measured-value" | "buyer-proof" | "decision";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  value: string;
  detail: string;
  evidence: string;
  href: string;
};

export type QuickBuyerValueMap = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  beforeState: string;
  afterState: string;
  buyerOutcome: string;
  nextAction: string;
  items: QuickBuyerValueMapItem[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerImpactSnapshotMetric = {
  id: "manual-burden" | "monthly-value" | "proof-risk" | "decision-gate";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  value: string;
  detail: string;
  evidence: string;
  href: string;
};

export type QuickBuyerImpactSnapshot = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  beforeState: string;
  afterState: string;
  nextAction: string;
  metrics: QuickBuyerImpactSnapshotMetric[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerValidationQuestion = {
  id: "pain" | "frequency" | "value" | "trust" | "commitment";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  question: string;
  listenFor: string;
  evidence: string;
  owner: string;
  href: string;
};

export type QuickBuyerValidationScript = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  openingLine: string;
  closeAsk: string;
  nextAction: string;
  questions: QuickBuyerValidationQuestion[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerValidationRubricDecision = "pilot-ready" | "needs-review" | "hold-internal";

export type QuickBuyerValidationRubricCriterion = {
  id: QuickBuyerValidationQuestion["id"];
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  passSignal: string;
  failSignal: string;
  evidence: string;
  href: string;
};

export type QuickBuyerValidationRubric = {
  status: QuickBuyerRoomPreviewStatus;
  decision: QuickBuyerValidationRubricDecision;
  headline: string;
  summary: string;
  passCount: number;
  totalCount: number;
  decisionRule: string;
  nextAction: string;
  criteria: QuickBuyerValidationRubricCriterion[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerValidationAnswerSheetItem = {
  id: QuickBuyerValidationQuestion["id"];
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  question: string;
  answerField: string;
  passSignal: string;
  failTrigger: string;
  evidence: string;
  owner: string;
  ownerAction: string;
  href: string;
};

export type QuickBuyerValidationAnswerSheet = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  decisionRule: string;
  nextAction: string;
  readyCount: number;
  totalCount: number;
  items: QuickBuyerValidationAnswerSheetItem[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerValidationAnswerRecordItem = {
  id: QuickBuyerValidationQuestion["id"];
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  sourceStatus: QuickBuyerRoomPreviewStatus;
  owner: string;
  action: string;
  matchedSignals: string[];
  missingSignals: string[];
  evidence: string;
  href: string;
};

export type QuickBuyerValidationAnswerRecord = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  confidence: number;
  answeredCount: number;
  totalCount: number;
  recommendedBuyerDecision: QuickBuyerValidationAnswerRecordDecision;
  decisionReason: string;
  decisionAction: string;
  nextOwner: string;
  nextAction: string;
  sourceReceiptId: string;
  sourceChecksum: string;
  buyerAnswer: string;
  items: QuickBuyerValidationAnswerRecordItem[];
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    verificationApiPath: typeof QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH;
    payload: QuickBuyerValidationAnswerRecordPayload;
    payloadJson: string;
    verificationRequestJson: string;
    verificationRequestHref: string;
    verification: QuickBuyerValidationAnswerRecordVerification;
    generatedFrom: string[];
  };
  receiptHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerValidationCallBriefItem = {
  id: QuickBuyerValidationQuestion["id"];
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  answerField: string;
  passSignal: string;
  recordStatus: QuickBuyerRoomPreviewStatus | "not-recorded";
  recordEvidence: string;
  href: string;
};

export type QuickBuyerValidationCallBrief = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  primaryQuestion: string;
  nextAsk: string;
  recordLine: string;
  readyCount: number;
  totalCount: number;
  items: QuickBuyerValidationCallBriefItem[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerSendMemoItem = {
  id: "decision" | "value" | "proof" | "trust" | "next-action";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  value: string;
  detail: string;
};

export type QuickBuyerSendMemo = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  subject: string;
  summary: string;
  nextAction: string;
  bodyText: string;
  exportMarkdown: string;
  exportHref: string;
  mailtoHref: string;
  items: QuickBuyerSendMemoItem[];
};

export type QuickBuyerDecisionOnePagerItem = {
  id: "decision" | "value" | "proof" | "contract";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  value: string;
  detail: string;
  href: string;
};

export type QuickBuyerDecisionOnePagerReceiptVerification = {
  status: "verified" | "mismatch";
  label: string;
  payloadChecksum: string;
  receiptChecksum: string;
  detail: string;
};

export type QuickBuyerDecisionOnePagerReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  generatedFrom: string[];
  verification: QuickBuyerDecisionOnePagerReceiptVerification;
};

export type QuickBuyerDecisionOnePager = {
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  buyer: string;
  decision: string;
  nextOwner: string;
  nextAction: string;
  valueLine: string;
  proofLine: string;
  trustLine: string;
  sourceTraceLine: string;
  sourceTraceAction: string;
  sourceTrace: WorkflowIntakeDraft["sourceTrace"];
  sendSubject: string;
  sendPreview: string;
  mailtoHref: string;
  items: QuickBuyerDecisionOnePagerItem[];
  receipt: QuickBuyerDecisionOnePagerReceipt;
  receiptHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerDecisionReplyOptionId = "continue" | "revise" | "stop";

export type QuickBuyerDecisionReplyOption = {
  id: QuickBuyerDecisionReplyOptionId;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  recommended: boolean;
  headline: string;
  buyerSays: string;
  nextOwner: string;
  nextAction: string;
  proof: string;
  replyText: string;
  mailtoHref: string;
};

export type QuickBuyerDecisionReplyDeck = {
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  recommendedOptionId: QuickBuyerDecisionReplyOptionId;
  onePagerReceiptId: string;
  onePagerChecksum: string;
  options: QuickBuyerDecisionReplyOption[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerDecisionActivationMode = "pilot-start" | "proof-repair" | "close-audit";

export type QuickBuyerDecisionActivationItem = {
  id: string;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  command: string;
  evidence: string;
  href: string;
};

export type QuickBuyerDecisionActivationBrief = {
  mode: QuickBuyerDecisionActivationMode;
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  recommendedReply: QuickBuyerDecisionReplyOptionId;
  sourceReceiptId: string;
  sourceChecksum: string;
  primaryHref: string;
  primaryLabel: string;
  items: QuickBuyerDecisionActivationItem[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerDecisionReplyRecordReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  verificationApiPath: typeof QUICK_BUYER_DECISION_REPLY_RECORD_VERIFY_PATH;
  payload: QuickBuyerDecisionReplyRecordPayload;
  payloadJson: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: QuickBuyerDecisionReplyRecordVerification;
  generatedFrom: string[];
};

export type QuickBuyerDecisionReplyRecord = {
  status: QuickBuyerRoomPreviewStatus;
  decision: QuickBuyerDecisionReplyOptionId;
  label: string;
  headline: string;
  summary: string;
  confidence: number;
  buyerReply: string;
  matchedSignals: string[];
  nextOwner: string;
  nextAction: string;
  proof: string;
  onePagerReceiptId: string;
  onePagerChecksum: string;
  activation: QuickBuyerDecisionActivationBrief;
  receipt: QuickBuyerDecisionReplyRecordReceipt;
  receiptHref: string;
  verifierHref: string;
  reviewKitHref: string;
  acceptancePathHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerDecisionSuccessCommitmentItem = {
  id: QuickAdoptionSuccessMetric["id"];
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  target: string;
  evidence: string;
  action: string;
};

export type QuickBuyerDecisionValueRealizationTask = {
  id: "baseline-lock" | "repeat-usage" | "value-retention" | "expand-stop";
  window: QuickAdoptionSuccessCheckpoint["window"];
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  action: string;
  evidence: string;
  closeCriteria: string;
  proof: string;
  href: string;
};

export type QuickBuyerDecisionValueRealizationLedger = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  blockedCount: number;
  nextOwner: string;
  nextAction: string;
  sourceReceiptId: string;
  sourceChecksum: string;
  tasks: QuickBuyerDecisionValueRealizationTask[];
  taskCsvText: string;
  taskCsvHref: string;
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
  };
  receiptHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickValueRealizationCalendarExport = {
  startDate: string;
  endDate: string;
  eventCount: number;
  icsText: string;
  icsHref: string;
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
  };
  receiptHref: string;
};

export type QuickValueRealizationCloseoutTask = {
  id: QuickBuyerDecisionValueRealizationTask["id"];
  window: QuickBuyerDecisionValueRealizationTask["window"];
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  outcome: string;
  matchedSignals: string[];
  missingSignals: string[];
  evidence: string;
  href: string;
};

export type QuickValueRealizationCloseoutRepairQueue = QuickValueRealizationCloseoutRepairQueuePayload & {
  exportMarkdown: string;
  exportHref: string;
};

export type QuickValueRealizationCloseoutRepairAcknowledgementItem =
  QuickValueRealizationCloseoutRepairAcknowledgementPayload["items"][number];

export type QuickValueRealizationCloseoutRepairAcknowledgement = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  acknowledgedCount: number;
  requiredAcknowledgementCount: number;
  nextOwner: string;
  nextAction: string;
  items: QuickValueRealizationCloseoutRepairAcknowledgementItem[];
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    verificationApiPath: typeof QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH;
    payload: QuickValueRealizationCloseoutRepairAcknowledgementPayload;
    payloadJson: string;
    verificationRequestJson: string;
    verificationRequestHref: string;
    verification: QuickValueRealizationCloseoutRepairAcknowledgementVerification;
    generatedFrom: string[];
  };
  receiptHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickValueRealizationAcceptancePacket = {
  status: QuickBuyerRoomPreviewStatus;
  decision: QuickValueRealizationAcceptanceDecision;
  headline: string;
  summary: string;
  buyerClaim: string;
  nextOwner: string;
  nextAction: string;
  checks: QuickValueRealizationAcceptancePayload["checks"];
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    verificationApiPath: typeof QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH;
    payload: QuickValueRealizationAcceptancePayload;
    payloadJson: string;
    verificationRequestJson: string;
    verificationRequestHref: string;
    verification: QuickValueRealizationAcceptanceVerification;
    generatedFrom: string[];
  };
  receiptHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickValueRealizationBuyerReviewDossierItem = {
  id: "value-claim" | "receipt-chain" | "day-30-decision" | "operating-conditions";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  question: string;
  answer: string;
  evidence: string;
  owner: string;
  href: string;
};

export type QuickValueRealizationBuyerReviewDossier = {
  status: QuickBuyerRoomPreviewStatus;
  decision: "review-expand" | "review-revise" | "review-stop" | "hold-review";
  headline: string;
  summary: string;
  reviewQuestion: string;
  buyerAsk: string;
  decisionRule: string;
  confidenceScore: number;
  readyCount: number;
  totalCount: number;
  nextOwner: string;
  nextAction: string;
  items: QuickValueRealizationBuyerReviewDossierItem[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickValueReviewExecutionPacketTask = QuickValueReviewExecutionPayload["tasks"][number];

export type QuickValueReviewExecutionPacket = {
  status: QuickBuyerRoomPreviewStatus;
  decision: QuickValueReviewExecutionDecision;
  headline: string;
  summary: string;
  readyTaskCount: number;
  taskCount: number;
  blockedTaskCount: number;
  nextOwner: string;
  nextAction: string;
  guardrails: string[];
  tasks: QuickValueReviewExecutionPacketTask[];
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    verificationApiPath: typeof QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH;
    payload: QuickValueReviewExecutionPayload;
    payloadJson: string;
    verificationRequestJson: string;
    verificationRequestHref: string;
    verification: QuickValueReviewExecutionVerification;
    generatedFrom: string[];
  };
  receiptHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickValueReviewExecutionCloseoutTask = QuickValueReviewExecutionCloseoutPayload["tasks"][number];

export type QuickValueReviewExecutionCloseout = {
  status: QuickBuyerRoomPreviewStatus;
  decision: QuickValueReviewExecutionCloseoutDecision;
  headline: string;
  summary: string;
  readyTaskCount: number;
  taskCount: number;
  blockedTaskCount: number;
  nextOwner: string;
  nextAction: string;
  evidenceSummary: string;
  tasks: QuickValueReviewExecutionCloseoutTask[];
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    verificationApiPath: typeof QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH;
    payload: QuickValueReviewExecutionCloseoutPayload;
    payloadJson: string;
    verificationRequestJson: string;
    verificationRequestHref: string;
    verification: QuickValueReviewExecutionCloseoutVerification;
    generatedFrom: string[];
  };
  receiptHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickValueRealizationCloseout = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  completedCount: number;
  blockedCount: number;
  retainedValueYen: number;
  retainedValueTargetYen: number;
  decision: "expand" | "revise" | "stop" | "missing";
  nextOwner: string;
  nextAction: string;
  sourceLedgerReceiptId: string;
  sourceLedgerChecksum: string;
  tasks: QuickValueRealizationCloseoutTask[];
  repairQueue: QuickValueRealizationCloseoutRepairQueue;
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    verificationApiPath: typeof QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH;
    payload: QuickValueRealizationCloseoutPayload;
    payloadJson: string;
    verificationRequestJson: string;
    verificationRequestHref: string;
    verification: QuickValueRealizationCloseoutVerification;
    generatedFrom: string[];
  };
  receiptHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerDecisionSuccessCommitment = {
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  reviewWindow: string;
  retainedValueLine: string;
  adoptionTargetLine: string;
  renewalAsk: string;
  sourceReceiptId: string;
  sourceChecksum: string;
  items: QuickBuyerDecisionSuccessCommitmentItem[];
  valueRealizationLedger: QuickBuyerDecisionValueRealizationLedger;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickWorkflowConversionReceiptItem = {
  id: "buyer-facts" | "artifact-pack" | "proof-status" | "decision-gate";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  value: string;
  detail: string;
};

export type QuickWorkflowConversionReceipt = {
  status: QuickBuyerRoomPreviewStatus;
  receiptId: string;
  receiptVersion: typeof QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  verificationApiPath: typeof QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH;
  payload: QuickWorkflowConversionReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verifierHref: string;
  verification: QuickWorkflowConversionReceiptVerification;
  headline: string;
  summary: string;
  items: QuickWorkflowConversionReceiptItem[];
};

export type QuickBuyerEvidencePackArtifact = {
  id: "decision-case" | "send-memo" | "claim-ledger" | "proof-repair" | "redaction" | "pilot-week" | "decision-close" | "conversion-receipt";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  href: string;
  role: string;
  proof: string;
  requiredForSend: boolean;
};

export type QuickBuyerEvidencePackShareArtifact = Omit<QuickBuyerEvidencePackArtifact, "href"> & {
  href: string;
};

export type QuickBuyerEvidencePackSharePayload = {
  version: typeof QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION;
  buyer: string;
  workflow: string;
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  sendRule: string;
  verifierHref: string;
  verificationApiPath: typeof QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH;
  sourceReceiptId: string;
  sourceChecksum: string;
  firstAction: {
    label: string;
    href: string;
  };
  artifacts: QuickBuyerEvidencePackShareArtifact[];
};

export type QuickBuyerEvidencePack = {
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  sendRule: string;
  verifierHref: string;
  firstAction: {
    label: string;
    href: string;
  };
  artifacts: QuickBuyerEvidencePackArtifact[];
  sharePayloadJson: string;
  shareHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerEvidenceDecisionReceipt = {
  decision: QuickExternalReviewDecision;
  recommendedDecision: QuickExternalReviewDecision;
  label: string;
  summary: string;
  owner: string;
  ownerPacketMarkdown: string;
  ownerPacketHref: string;
  ownerMailHref: string;
  ownerRunbook: QuickExternalReviewOwnerPacketRunbookItem[];
  scorecard: QuickBuyerEvidenceDecisionScorecard;
  followUpLedger: QuickBuyerEvidenceResponseFollowUpLedger;
  payload: QuickExternalReviewDecisionReceiptPayload;
  checksum: string;
  requestJson: string;
  requestHref: string;
  returnHref: string;
  verifierHref: string;
  verification: ReturnType<typeof verifyQuickExternalReviewDecisionReceipt>;
};

export type QuickBuyerEvidenceDecisionScorecardItem = {
  id: "source-receipt" | "required-artifacts" | "reviewer-identity" | "recommended-decision" | "send-rule";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  value: string;
  evidence: string;
};

export type QuickBuyerEvidenceDecisionScorecard = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  totalCount: number;
  items: QuickBuyerEvidenceDecisionScorecardItem[];
};

export type QuickSponsorSendGateDecision = "send-after-live-proof" | "repair-before-sponsor" | "hold-internal";

export type QuickSponsorSendGateCheck = {
  id: "value" | "proof" | "trust" | "data" | "approval";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  question: string;
  answer: string;
  evidence: string;
  owner: string;
  action: string;
  href: string;
};

export type QuickSponsorSendGate = {
  status: QuickBuyerRoomPreviewStatus;
  decision: QuickSponsorSendGateDecision;
  label: string;
  headline: string;
  summary: string;
  score: number;
  readyCount: number;
  totalCount: number;
  nextOwner: string;
  nextAction: string;
  sendRule: string;
  sourceReceiptId: string;
  sourceChecksum: string;
  verifierHref: string;
  checks: QuickSponsorSendGateCheck[];
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
  };
  receiptHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickPublicValueReleaseGateCheck = {
  id: "value" | "sponsor" | "publication" | "live-proof";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  value: string;
  evidence: string;
  owner: string;
  action: string;
  href: string;
};

export type QuickPublicValueReleaseGate = {
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  releaseScore: number;
  shareableMonthlyValueYen: number;
  lockedMonthlyValueYen: number;
  nextOwner: string;
  nextAction: string;
  releaseRule: string;
  sourceReceiptId: string;
  sourceChecksum: string;
  verifierHref: string;
  receipt: QuickPublicValueReleaseReceipt;
  checks: QuickPublicValueReleaseGateCheck[];
  exportMarkdown: string;
  exportHref: string;
};

const QUICK_BUYER_EVIDENCE_PACK_ARTIFACT_IDS: QuickBuyerEvidencePackArtifact["id"][] = [
  "decision-case",
  "send-memo",
  "claim-ledger",
  "proof-repair",
  "redaction",
  "pilot-week",
  "decision-close",
  "conversion-receipt"
];

function quickBuyerEvidenceShareText(value: unknown, maxLength = 1200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function quickBuyerEvidenceShareHref(value: unknown) {
  const href = quickBuyerEvidenceShareText(value, 4000);
  if (!href || /^data:/i.test(href) || /[\u0000-\u001f<>]/.test(href)) return "";
  if (href.startsWith("#") || href.startsWith("/")) return href;
  return /^https?:\/\//i.test(href) ? href : "";
}

function quickBuyerEvidenceStatusFromUnknown(value: unknown): QuickBuyerRoomPreviewStatus {
  return value === "ready" || value === "watch" || value === "blocked" ? value : "blocked";
}

function quickBuyerEvidenceArtifactIdFromUnknown(value: unknown): QuickBuyerEvidencePackArtifact["id"] | null {
  if (typeof value !== "string") return null;
  return QUICK_BUYER_EVIDENCE_PACK_ARTIFACT_IDS.includes(value as QuickBuyerEvidencePackArtifact["id"])
    ? (value as QuickBuyerEvidencePackArtifact["id"])
    : null;
}

function quickBuyerEvidencePackShareArtifactFrom(artifact: QuickBuyerEvidencePackArtifact): QuickBuyerEvidencePackShareArtifact {
  return {
    id: artifact.id,
    label: artifact.label,
    status: artifact.status,
    href: quickBuyerEvidenceShareHref(artifact.href),
    role: artifact.role,
    proof: artifact.proof,
    requiredForSend: artifact.requiredForSend
  };
}

export function parseQuickBuyerEvidencePackSharePayload(raw: string): QuickBuyerEvidencePackSharePayload | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || parsed.version !== QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION) return null;
    const artifacts = (Array.isArray(parsed.artifacts) ? parsed.artifacts : [])
      .map((candidate) => {
        if (!candidate || typeof candidate !== "object") return null;
        const source = candidate as Record<string, unknown>;
        const id = quickBuyerEvidenceArtifactIdFromUnknown(source.id);
        if (!id) return null;
        return {
          id,
          label: quickBuyerEvidenceShareText(source.label, 160),
          status: quickBuyerEvidenceStatusFromUnknown(source.status),
          href: quickBuyerEvidenceShareHref(source.href),
          role: quickBuyerEvidenceShareText(source.role, 200),
          proof: quickBuyerEvidenceShareText(source.proof, 600),
          requiredForSend: source.requiredForSend === true
        };
      })
      .filter((artifact): artifact is QuickBuyerEvidencePackShareArtifact => Boolean(artifact));
    if (artifacts.length === 0) return null;

    const firstAction = parsed.firstAction && typeof parsed.firstAction === "object" ? (parsed.firstAction as Record<string, unknown>) : {};

    return {
      version: QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION,
      buyer: quickBuyerEvidenceShareText(parsed.buyer, 220),
      workflow: quickBuyerEvidenceShareText(parsed.workflow, 1200),
      status: quickBuyerEvidenceStatusFromUnknown(parsed.status),
      label: quickBuyerEvidenceShareText(parsed.label, 180),
      headline: quickBuyerEvidenceShareText(parsed.headline, 260),
      summary: quickBuyerEvidenceShareText(parsed.summary, 700),
      sendRule: quickBuyerEvidenceShareText(parsed.sendRule, 700),
      verifierHref: quickBuyerEvidenceShareHref(parsed.verifierHref) || "/receipt-verifier",
      verificationApiPath: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH,
      sourceReceiptId: quickBuyerEvidenceShareText(parsed.sourceReceiptId, 160),
      sourceChecksum: quickBuyerEvidenceShareText(parsed.sourceChecksum, 120),
      firstAction: {
        label: quickBuyerEvidenceShareText(firstAction.label, 180) || "Open receipt verifier",
        href: quickBuyerEvidenceShareHref(firstAction.href) || "/receipt-verifier"
      },
      artifacts
    };
  } catch {
    return null;
  }
}

function quickBuyerEvidenceRequiredArtifacts(payload: QuickBuyerEvidencePackSharePayload) {
  return payload.artifacts.filter((artifact) => artifact.requiredForSend);
}

function quickBuyerEvidenceReadyRequiredCount(payload: QuickBuyerEvidencePackSharePayload) {
  return quickBuyerEvidenceRequiredArtifacts(payload).filter((artifact) => artifact.status === "ready").length;
}

function quickBuyerEvidenceRecommendedDecision(payload: QuickBuyerEvidencePackSharePayload): QuickExternalReviewDecision {
  const requiredArtifacts = quickBuyerEvidenceRequiredArtifacts(payload);
  if (payload.status === "ready" && requiredArtifacts.every((artifact) => artifact.status === "ready")) return "continue";
  if (payload.status === "blocked" || requiredArtifacts.every((artifact) => artifact.status !== "ready")) return "stop";
  return "revise";
}

function quickBuyerEvidenceDecisionLabel(decision: QuickExternalReviewDecision) {
  if (decision === "continue") return "Accept evidence";
  if (decision === "revise") return "Request repairs";
  return "Hold buyer send";
}

function quickBuyerEvidenceDecisionStatus(decision: QuickExternalReviewDecision): QuickBuyerRoomPreviewStatus {
  if (decision === "continue") return "ready";
  if (decision === "revise") return "watch";
  return "blocked";
}

function quickBuyerEvidenceDecisionSummary(payload: QuickBuyerEvidencePackSharePayload, decision: QuickExternalReviewDecision) {
  if (decision === "continue") return `${payload.buyer || "Buyer"} can proceed with the evidence pack while keeping the receipt verifier attached.`;
  if (decision === "revise") return `${payload.firstAction.label} before the next buyer decision.`;
  return `Do not send this evidence pack externally until ${payload.firstAction.label.toLowerCase()} is complete.`;
}

function quickBuyerEvidenceDecisionNextAction(payload: QuickBuyerEvidencePackSharePayload, decision: QuickExternalReviewDecision) {
  if (decision === "continue") return "Schedule the buyer decision meeting and attach the verified conversion receipt.";
  if (decision === "revise") return payload.firstAction.label;
  return `Keep the pack internal; ${payload.firstAction.label}.`;
}

function quickBuyerEvidenceDefaultReviewerNote(payload: QuickBuyerEvidencePackSharePayload, decision: QuickExternalReviewDecision) {
  if (decision === "continue") return `Evidence accepted for ${payload.buyer || "the buyer"} with the verifier link attached.`;
  if (decision === "revise") return `Repair required evidence before sending: ${payload.firstAction.label}.`;
  return `Buyer send held because required evidence is not ready: ${payload.firstAction.label}.`;
}

function quickBuyerEvidenceDecisionOwner(decision: QuickExternalReviewDecision) {
  if (decision === "continue") return "Launch owner";
  if (decision === "revise") return "Proof owner";
  return "Decision owner";
}

function quickBuyerEvidenceDecisionPayloadStatus(input: {
  packetStatus: QuickBuyerRoomPreviewStatus;
  decision: QuickExternalReviewDecision;
  reviewerName: string;
}) {
  const hasNamedReviewer = input.reviewerName.trim() && input.reviewerName.trim().toLowerCase() !== "buyer reviewer";
  if (input.decision === "continue") {
    if (input.packetStatus === "blocked") return "blocked";
    if (input.packetStatus === "watch" || !hasNamedReviewer) return "watch";
    return "ready";
  }
  if (input.decision === "revise") return "watch";
  return "blocked";
}

function buildQuickBuyerEvidenceDecisionScorecard(input: {
  payload: QuickBuyerEvidencePackSharePayload;
  decision: QuickExternalReviewDecision;
  recommendedDecision: QuickExternalReviewDecision;
  reviewerName: string;
  testsReady: number;
  testsTotal: number;
}): QuickBuyerEvidenceDecisionScorecard {
  const sourceReady = Boolean(input.payload.sourceReceiptId && /^fnv1a32:[a-f0-9]{8}$/i.test(input.payload.sourceChecksum));
  const requiredStatus: QuickBuyerRoomPreviewStatus =
    input.testsReady === input.testsTotal ? "ready" : input.testsReady > 0 ? "watch" : "blocked";
  const reviewerIsNamed = Boolean(input.reviewerName.trim() && input.reviewerName.trim().toLowerCase() !== "buyer reviewer");
  const decisionMatchesRecommendation = input.decision === input.recommendedDecision;
  const sendRuleStatus: QuickBuyerRoomPreviewStatus =
    input.decision !== "continue" ? "ready" : input.payload.status === "ready" ? "ready" : input.payload.status === "watch" ? "watch" : "blocked";
  const items: QuickBuyerEvidenceDecisionScorecardItem[] = [
    {
      id: "source-receipt",
      label: "Source receipt",
      status: sourceReady ? "ready" : "blocked",
      value: input.payload.sourceReceiptId || "missing",
      evidence: input.payload.sourceChecksum || "Source checksum is missing."
    },
    {
      id: "required-artifacts",
      label: "Required artifacts",
      status: requiredStatus,
      value: `${input.testsReady}/${input.testsTotal} ready`,
      evidence:
        requiredStatus === "ready"
          ? "All required buyer-send artifacts are present."
          : `${input.testsTotal - input.testsReady} required artifact${input.testsTotal - input.testsReady === 1 ? "" : "s"} still need repair.`
    },
    {
      id: "reviewer-identity",
      label: "Reviewer identity",
      status: reviewerIsNamed ? "ready" : "watch",
      value: reviewerIsNamed ? input.reviewerName : "name required",
      evidence: reviewerIsNamed ? "The response names who made the decision." : "Add a named reviewer before treating this response as final."
    },
    {
      id: "recommended-decision",
      label: "Recommended decision",
      status: decisionMatchesRecommendation ? "ready" : "watch",
      value: quickBuyerEvidenceDecisionLabel(input.decision),
      evidence: decisionMatchesRecommendation
        ? "Reviewer decision matches the evidence pack recommendation."
        : `Evidence recommends ${quickBuyerEvidenceDecisionLabel(input.recommendedDecision)}; reviewer override must be explained.`
    },
    {
      id: "send-rule",
      label: "Send rule",
      status: sendRuleStatus,
      value: input.decision === "continue" ? quickBuyerEvidenceStatusLabel(input.payload.status) : "send held",
      evidence: input.decision === "continue" ? input.payload.sendRule : "No buyer-send approval is granted by this response."
    }
  ];
  const readyCount = items.filter((item) => item.status === "ready").length;
  const status = items.some((item) => item.status === "blocked") ? "blocked" : items.some((item) => item.status === "watch") ? "watch" : "ready";
  const headline =
    status === "ready"
      ? "Decision is externally defendable"
      : status === "watch"
        ? "Decision needs reviewer attention"
        : "Decision cannot be used for buyer send";
  const summary =
    status === "ready"
      ? "The response has a named reviewer, matching recommendation, ready artifacts, and intact receipt source."
      : status === "watch"
        ? "Keep the response as review evidence, but close the watch items before treating it as final."
        : "Do not use this response to send the buyer pack until the blocked scorecard item is repaired.";

  return {
    status,
    headline,
    summary,
    readyCount,
    totalCount: items.length,
    items
  };
}

function quickBuyerEvidenceDecisionOwnerRunbook(input: {
  payload: QuickBuyerEvidencePackSharePayload;
  decision: QuickExternalReviewDecision;
  receiptChecksum: string;
}): QuickExternalReviewOwnerPacketRunbookItem[] {
  const verifierProof = `${input.payload.sourceReceiptId || "evidence-pack"} / ${input.payload.sourceChecksum || "checksum missing"}`;
  const decisionProof = `fnv1a32:${input.receiptChecksum}`;
  if (input.decision === "continue") {
    return [
      {
        id: "attach-decision-receipt",
        label: "Attach decision receipt",
        owner: "Launch owner",
        window: "Now",
        action: "Attach the verified buyer response receipt to the sponsor handoff.",
        evidence: decisionProof,
        proof: decisionProof,
        status: "ready"
      },
      {
        id: "schedule-buyer-meeting",
        label: "Schedule buyer meeting",
        owner: "Launch owner",
        window: "Next review",
        action: "Schedule the buyer decision meeting and keep the conversion receipt verifier in the invite.",
        evidence: verifierProof,
        proof: input.payload.verifierHref,
        status: "ready"
      },
      {
        id: "recheck-proof-window",
        label: "Recheck proof window",
        owner: "Proof owner",
        window: "Before send",
        action: input.payload.sendRule,
        evidence: `${quickBuyerEvidenceReadyRequiredCount(input.payload)}/${quickBuyerEvidenceRequiredArtifacts(input.payload).length} required artifacts ready`,
        proof: input.payload.verifierHref,
        status: input.payload.status
      }
    ];
  }
  if (input.decision === "revise") {
    return [
      {
        id: "record-repair-request",
        label: "Record repair request",
        owner: "Proof owner",
        window: "Now",
        action: input.payload.firstAction.label,
        evidence: decisionProof,
        proof: decisionProof,
        status: "watch"
      },
      {
        id: "repair-required-evidence",
        label: "Repair required evidence",
        owner: "Proof owner",
        window: "Before buyer send",
        action: input.payload.sendRule,
        evidence: `${quickBuyerEvidenceReadyRequiredCount(input.payload)}/${quickBuyerEvidenceRequiredArtifacts(input.payload).length} required artifacts ready`,
        proof: input.payload.firstAction.href || input.payload.verifierHref,
        status: input.payload.status
      },
      {
        id: "regenerate-evidence-pack",
        label: "Regenerate evidence pack",
        owner: "Review coordinator",
        window: "After repair",
        action: "Regenerate the buyer evidence pack and ask for a fresh buyer response after the verifier still passes.",
        evidence: verifierProof,
        proof: input.payload.verifierHref,
        status: "watch"
      }
    ];
  }
  return [
    {
      id: "hold-buyer-send",
      label: "Hold buyer send",
      owner: "Decision owner",
      window: "Now",
      action: "Keep this evidence pack internal and do not forward it to the buyer.",
      evidence: decisionProof,
      proof: decisionProof,
      status: "blocked"
    },
    {
      id: "close-stop-reason",
      label: "Close stop reason",
      owner: "Proof owner",
      window: "Before re-review",
      action: input.payload.firstAction.label,
      evidence: input.payload.sendRule,
      proof: input.payload.firstAction.href || input.payload.verifierHref,
      status: input.payload.status
    },
    {
      id: "request-new-decision",
      label: "Request new decision",
      owner: "Review coordinator",
      window: "After repair",
      action: "Share a new evidence pack only after all required artifacts are ready.",
      evidence: verifierProof,
      proof: input.payload.verifierHref,
      status: "watch"
    }
  ];
}

function quickBuyerEvidenceOwnerPacketMarkdown(input: {
  payload: QuickBuyerEvidencePackSharePayload;
  receipt: QuickExternalReviewDecisionReceiptPayload;
  checksum: string;
  owner: string;
  runbook: QuickExternalReviewOwnerPacketRunbookItem[];
  scorecard: QuickBuyerEvidenceDecisionScorecard;
}) {
  return [
    "# Buyer evidence response owner packet",
    "",
    `Buyer: ${input.payload.buyer || input.receipt.buyer}`,
    `Owner: ${input.owner}`,
    `Decision: ${input.receipt.label}`,
    `Status: ${input.receipt.status}`,
    `Receipt: fnv1a32:${input.checksum}`,
    `Source evidence: ${input.payload.sourceReceiptId || input.receipt.manifestReceiptId} / ${input.payload.sourceChecksum || input.receipt.manifestChecksum}`,
    "",
    "## Reviewer note",
    input.receipt.reviewerNote,
    "",
    "## Next action",
    input.receipt.nextAction,
    "",
    "## Decision scorecard",
    `${input.scorecard.readyCount}/${input.scorecard.totalCount} ready / ${input.scorecard.headline}`,
    ...input.scorecard.items.map((item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.evidence}`),
    "",
    "## Runbook",
    ...input.runbook.map((item) => `- [${item.status}] ${item.window} / ${item.owner} / ${item.label}: ${item.action} Evidence: ${item.evidence} Proof: ${item.proof}`)
  ].join("\n");
}

function quickBuyerEvidenceOwnerMailHref(input: {
  payload: QuickBuyerEvidencePackSharePayload;
  receipt: QuickExternalReviewDecisionReceiptPayload;
  checksum: string;
  owner: string;
  ownerPacketMarkdown: string;
}) {
  const subject = `${input.receipt.label}: ${input.payload.buyer || input.receipt.buyer}`;
  const body = [
    `${input.owner},`,
    "",
    input.receipt.reviewOutcome,
    "",
    `Next action: ${input.receipt.nextAction}`,
    `Decision receipt: fnv1a32:${input.checksum}`,
    `Evidence receipt: ${input.payload.sourceReceiptId || input.receipt.manifestReceiptId} / ${input.payload.sourceChecksum || input.receipt.manifestChecksum}`,
    "",
    input.ownerPacketMarkdown
  ].join("\n");
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildQuickBuyerEvidenceDecisionReceipt(input: {
  payload: QuickBuyerEvidencePackSharePayload;
  decision?: QuickExternalReviewDecision;
  reviewerName?: string;
  reviewerNote?: string;
  generatedAt?: string;
  closeout?: QuickExternalReviewDecisionReceiptReplacementCloseout | null;
  returnBaseHref?: string;
}): QuickBuyerEvidenceDecisionReceipt {
  const sourcePayload = input.payload;
  const replacementCloseout = input.closeout;
  const receiptPayload = quickBuyerEvidencePayloadWithReceiptReplacementCloseout(sourcePayload, replacementCloseout);
  const recommendedDecision = quickBuyerEvidenceRecommendedDecision(receiptPayload);
  const decision = input.decision ?? recommendedDecision;
  const requiredArtifacts = quickBuyerEvidenceRequiredArtifacts(receiptPayload);
  const testsReady = quickBuyerEvidenceReadyRequiredCount(receiptPayload);
  const testsTotal = requiredArtifacts.length;
  const confidence = Math.round((testsReady / Math.max(1, testsTotal)) * 100);
  const label = quickBuyerEvidenceDecisionLabel(decision);
  const summary = quickBuyerEvidenceDecisionSummary(receiptPayload, decision);
  const reviewerName = quickBuyerEvidenceShareText(input.reviewerName, 160) || "Buyer reviewer";
  const reviewerNote = quickBuyerEvidenceShareText(input.reviewerNote, 1000) || quickBuyerEvidenceDefaultReviewerNote(receiptPayload, decision);
  const decisionStatus = quickBuyerEvidenceDecisionPayloadStatus({ packetStatus: receiptPayload.status, decision, reviewerName });
  const scorecard = buildQuickBuyerEvidenceDecisionScorecard({
    payload: receiptPayload,
    decision,
    recommendedDecision,
    reviewerName,
    testsReady,
    testsTotal
  });
  const payload: QuickExternalReviewDecisionReceiptPayload = {
    receiptVersion: QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION,
    decision,
    status: decisionStatus,
    label,
    reviewerName,
    reviewerNote,
    buyer: sourcePayload.buyer || "Buyer",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    manifestReceiptId: sourcePayload.sourceReceiptId || "evidence-pack",
    manifestChecksum: sourcePayload.sourceChecksum || "",
    packetStatus: receiptPayload.status,
    packetClearance: decisionStatus === "ready" ? "external-review" : "internal-only",
    testsReady,
    testsTotal,
    confidence,
    reviewOutcome: summary,
    nextAction: quickBuyerEvidenceDecisionNextAction(receiptPayload, decision),
    proof: `${sourcePayload.sourceReceiptId || "pack"} / ${sourcePayload.sourceChecksum || "missing"} / ${testsReady}/${testsTotal} required artifacts ready${
      replacementCloseout ? ` / replacement closeout ${replacementCloseout.readyCount}/${replacementCloseout.slotTotal}` : ""
    }`,
    ...(replacementCloseout ? { replacementCloseout } : {})
  };
  const checksum = quickExternalReviewDecisionReceiptChecksum(payload);
  const verificationRequest: QuickExternalReviewDecisionReceiptVerificationRequest = { checksum, payload };
  const requestJson = quickExternalReviewDecisionReceiptRequestJson(verificationRequest);
  const owner = quickBuyerEvidenceDecisionOwner(decision);
  const ownerRunbook = quickBuyerEvidenceDecisionOwnerRunbook({ payload: receiptPayload, decision, receiptChecksum: checksum });
  const ownerPacketMarkdown = quickBuyerEvidenceOwnerPacketMarkdown({ payload: receiptPayload, receipt: payload, checksum, owner, runbook: ownerRunbook, scorecard });
  const followUpLedger = buildQuickBuyerEvidenceResponseFollowUpLedger({
    state: "verified",
    status: payload.status,
    label,
    headline: quickBuyerEvidenceResponseHeadline(decision, payload.buyer),
    summary,
    buyer: payload.buyer,
    reviewerLine: `${payload.reviewerName} / ${payload.generatedAt}`,
    receiptLine: `fnv1a32:${checksum} / ${payload.manifestReceiptId}`,
    evidenceReceiptId: payload.manifestReceiptId,
    evidenceChecksum: payload.manifestChecksum,
    nextOwner: owner,
    nextAction: payload.nextAction,
    verificationRequestJson: requestJson,
    verifierHref: receiptVerifierPrefillHref(requestJson),
    evidencePackHref: receiptPayload.firstAction.href || receiptPayload.verifierHref,
    packVerifierHref: sourcePayload.verifierHref,
    ownerPacketMarkdown,
    ownerPacketHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(ownerPacketMarkdown)}`,
    ownerMailHref: quickBuyerEvidenceOwnerMailHref({ payload: receiptPayload, receipt: payload, checksum, owner, ownerPacketMarkdown }),
    ownerRunbook
  });

  return {
    decision,
    recommendedDecision,
    label,
    summary,
    owner,
    ownerPacketMarkdown,
    ownerPacketHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(ownerPacketMarkdown)}`,
    ownerMailHref: quickBuyerEvidenceOwnerMailHref({ payload: receiptPayload, receipt: payload, checksum, owner, ownerPacketMarkdown }),
    ownerRunbook,
    scorecard,
    followUpLedger,
    payload,
    checksum,
    requestJson,
    requestHref: `data:application/json;charset=utf-8,${encodeURIComponent(requestJson)}`,
    returnHref: quickBuyerEvidenceResponseShareHref(requestJson, input.returnBaseHref),
    verifierHref: receiptVerifierPrefillHref(requestJson),
    verification: verifyQuickExternalReviewDecisionReceipt(verificationRequest)
  };
}

export type QuickBuyerRoomPreview = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  primaryAsk: string;
  closeRule: string;
  buyer: string;
  sourceTrace: WorkflowIntakeDraft["sourceTrace"];
  rows: QuickBuyerRoomPreviewRow[];
  pilotWeekPlan: QuickPilotWeekPlanStep[];
  pilotWeekTaskPacket: QuickPilotWeekTaskPacket;
  handoffBrief: QuickBuyerHandoffBrief;
  decisionCase: QuickBuyerDecisionCase;
  valueMap: QuickBuyerValueMap;
  impactSnapshot: QuickBuyerImpactSnapshot;
  validationScript: QuickBuyerValidationScript;
  validationRubric: QuickBuyerValidationRubric;
  validationAnswerSheet: QuickBuyerValidationAnswerSheet;
  sendMemo: QuickBuyerSendMemo;
  economicsStressTest: QuickPilotEconomicsStressTest;
  claimProofLedger: QuickClaimProofLedger;
  publicSafeRedactionPacket: QuickPublicSafeRedactionPacket;
  evidenceCompletionPacket: QuickEvidenceCompletionPacket;
  approvalRoute: QuickStakeholderApprovalRoute;
  approvalEmailPack: QuickStakeholderApprovalEmailPack;
  pilotContractTerms: QuickPilotContractTerms;
  procurementMatrix: QuickProcurementAlternativeMatrix;
  adoptionSuccessPlan: QuickAdoptionSuccessPlan;
  rolloutCommandBoard: QuickRolloutCommandBoard;
  decisionClosePack: QuickDecisionClosePack;
  pilotProofContract: QuickPilotProofContract;
  conversionReceipt: QuickWorkflowConversionReceipt;
  evidencePack: QuickBuyerEvidencePack;
  sponsorSendGate: QuickSponsorSendGate;
  buyerPromiseGate: QuickBuyerPromiseGate;
  proofRepairPlan: QuickProofRepairPlan;
  objectionBrief: QuickBuyerObjectionBrief;
  exportMarkdown: string;
};

export type QuickSharedWorkflowReviewBrief = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  decisionLabel: string;
  nextOwner: string;
  nextAction: string;
  readyCount: number;
  totalCount: number;
  blockerCount: number;
  watchCount: number;
  proofReadyCount: number;
  proofTotalCount: number;
  receiptLine: string;
  copyText: string;
  items: Array<{
    id: string;
    label: string;
    status: QuickBuyerRoomPreviewStatus;
    value: string;
    detail: string;
  }>;
};

export function buildQuickSharedWorkflowReviewBrief(preview: QuickBuyerRoomPreview): QuickSharedWorkflowReviewBrief {
  const readyCount = preview.rows.filter((row) => row.status === "ready").length;
  const blockerCount = preview.rows.filter((row) => row.status === "blocked").length;
  const watchCount = preview.rows.filter((row) => row.status === "watch").length;
  const firstOpenRepair = preview.proofRepairPlan.items.find((item) => item.status !== "ready");
  const firstOpenRow = preview.rows.find((row) => row.status === "blocked") ?? preview.rows.find((row) => row.status === "watch");
  const decisionLabel =
    preview.status === "ready"
      ? "Ready for live proof verification"
      : preview.status === "watch"
        ? "Owner review before buyer send"
        : "Internal repair before sharing";
  const nextOwner = firstOpenRepair?.owner || preview.sponsorSendGate.nextOwner;
  const nextAction = firstOpenRepair?.action || firstOpenRow?.proof || preview.primaryAsk;
  const headline =
    preview.status === "ready"
      ? `${preview.buyer} can review the buyer room`
      : preview.status === "watch"
        ? `${preview.buyer} needs owner review first`
        : `${preview.buyer} has ${blockerCount} blocker${blockerCount === 1 ? "" : "s"} before sharing`;
  const summary =
    preview.status === "ready"
      ? "The workflow is preview-ready. Verify live links before forwarding the buyer packet."
      : `Do not forward externally yet. ${nextOwner} should ${nextAction.charAt(0).toLowerCase()}${nextAction.slice(1)}`;
  const receiptLine = `${preview.conversionReceipt.receiptId} / ${preview.conversionReceipt.checksumAlgorithm}:${preview.conversionReceipt.checksum}`;
  const items: QuickSharedWorkflowReviewBrief["items"] = [
    {
      id: "decision",
      label: "Decision",
      status: preview.status,
      value: decisionLabel,
      detail: `${readyCount}/${preview.rows.length} checks ready`
    },
    {
      id: "proof",
      label: "Public proof",
      status: preview.proofRepairPlan.repairCount === 0 ? "ready" : preview.proofRepairPlan.readyCount > 0 ? "watch" : "blocked",
      value: `${preview.proofRepairPlan.readyCount}/${preview.proofRepairPlan.items.length} URLs ready`,
      detail: firstOpenRepair ? `${firstOpenRepair.owner}: ${firstOpenRepair.action}` : preview.proofRepairPlan.summary
    },
    {
      id: "receipt",
      label: "Integrity",
      status: preview.conversionReceipt.status,
      value: preview.conversionReceipt.verification.status === "verified" ? "Receipt verified" : "Receipt needs review",
      detail: receiptLine
    }
  ];
  const copyText = [
    "Shared workflow review",
    `Buyer: ${preview.buyer}`,
    `Decision: ${decisionLabel}`,
    `Readiness: ${readyCount}/${preview.rows.length} checks ready (${blockerCount} blocked, ${watchCount} watch)`,
    `Public proof: ${preview.proofRepairPlan.readyCount}/${preview.proofRepairPlan.items.length} URLs ready`,
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`,
    `Close rule: ${preview.closeRule}`,
    `Receipt: ${receiptLine}`
  ].join("\n");

  return {
    status: preview.status,
    headline,
    summary,
    decisionLabel,
    nextOwner,
    nextAction,
    readyCount,
    totalCount: preview.rows.length,
    blockerCount,
    watchCount,
    proofReadyCount: preview.proofRepairPlan.readyCount,
    proofTotalCount: preview.proofRepairPlan.items.length,
    receiptLine,
    copyText,
    items
  };
}

export type QuickBuyerEvidenceResponseImportPlan = {
  state: "empty" | "invalid" | "mismatch" | "wrong-pack" | "verified";
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  buyer: string;
  reviewerLine: string;
  receiptLine: string;
  evidenceReceiptId: string;
  evidenceChecksum: string;
  nextOwner: string;
  nextAction: string;
  verificationRequestJson: string;
  verifierHref: string;
  evidencePackHref: string;
  packVerifierHref: string;
  ownerPacketMarkdown: string;
  ownerPacketHref: string;
  ownerPacketReceiptJson: string;
  ownerPacketReceiptHref: string;
  ownerPacketVerifierStorageKey: string;
  ownerPacketVerifierHref: string;
  ownerMailHref: string;
  ownerRunbook: QuickExternalReviewOwnerPacketRunbookItem[];
  followUpLedger: QuickBuyerEvidenceResponseFollowUpLedger;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerEvidenceResponseFollowUpTask = {
  id: string;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  dueLabel: string;
  action: string;
  closeCondition: string;
  evidence: string;
  proof: string;
  href: string;
};

export type QuickBuyerEvidenceResponseFollowUpLedger = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  watchCount: number;
  blockedCount: number;
  taskTotal: number;
  firstDueLabel: string;
  tasks: QuickBuyerEvidenceResponseFollowUpTask[];
  csv: string;
  csvHref: string;
  calendarStartDate: string;
  calendarEndDate: string;
  calendarText: string;
  calendarHref: string;
  exportMarkdown: string;
  exportHref: string;
};

type QuickBuyerEvidenceResponseImportPlanBase = Omit<
  QuickBuyerEvidenceResponseImportPlan,
  | "exportMarkdown"
  | "exportHref"
  | "ownerPacketHref"
  | "ownerPacketReceiptJson"
  | "ownerPacketReceiptHref"
  | "ownerPacketVerifierStorageKey"
  | "ownerPacketVerifierHref"
  | "followUpLedger"
> & {
  ownerPacketHref?: string;
};

function quickBuyerEvidenceResponseFallbackRunbook(input: {
  status: QuickBuyerRoomPreviewStatus;
  state: QuickBuyerEvidenceResponseImportPlan["state"];
  nextOwner: string;
  nextAction: string;
  receiptLine: string;
  evidencePackHref: string;
  packVerifierHref: string;
}): QuickExternalReviewOwnerPacketRunbookItem[] {
  if (input.state === "empty") {
    return [
      {
        id: "request-buyer-response",
        label: "Request buyer response",
        owner: "Review coordinator",
        window: "Now",
        action: input.nextAction,
        evidence: input.receiptLine,
        proof: input.evidencePackHref,
        status: "watch"
      },
      {
        id: "keep-pack-verifier",
        label: "Keep pack verifier",
        owner: "Review coordinator",
        window: "Before send",
        action: "Keep the conversion receipt verifier attached while waiting for the returned buyer response.",
        evidence: input.receiptLine,
        proof: input.packVerifierHref,
        status: input.status
      }
    ];
  }

  return [
    {
      id: "hold-returned-response",
      label: "Hold returned response",
      owner: input.nextOwner,
      window: "Now",
      action: input.nextAction,
      evidence: input.receiptLine,
      proof: input.receiptLine,
      status: "blocked"
    },
    {
      id: "request-matching-response",
      label: "Request matching response",
      owner: "Review coordinator",
      window: "Before buyer send",
      action: "Open the current evidence pack share page and return a fresh buyer response from that page.",
      evidence: input.receiptLine,
      proof: input.evidencePackHref,
      status: "watch"
    }
  ];
}

function quickBuyerEvidenceResponseExport(plan: QuickBuyerEvidenceResponseImportPlanBase) {
  return [
    "# Buyer evidence response intake",
    "",
    `State: ${plan.state}`,
    `Status: ${plan.status}`,
    `Label: ${plan.label}`,
    `Reviewer: ${plan.reviewerLine}`,
    `Receipt: ${plan.receiptLine}`,
    `Evidence: ${plan.evidenceReceiptId} / ${plan.evidenceChecksum}`,
    "",
    "## Summary",
    plan.summary,
    "",
    "## Owner action",
    `${plan.nextOwner}: ${plan.nextAction}`,
    "",
    "## Runbook",
    ...plan.ownerRunbook.map((item) => `- [${item.status}] ${item.window} / ${item.owner} / ${item.label}: ${item.action} Evidence: ${item.evidence} Proof: ${item.proof}`),
    "",
    "## Links",
    `Response verifier: ${plan.verifierHref || "No response verifier yet."}`,
    `Evidence pack: ${plan.evidencePackHref}`,
    `Pack verifier: ${plan.packVerifierHref}`
  ].join("\n");
}

function quickBuyerEvidenceResponseOwnerPacket(plan: QuickBuyerEvidenceResponseImportPlanBase) {
  return [
    "# Buyer evidence response owner packet",
    "",
    `Owner: ${plan.nextOwner}`,
    `Decision: ${plan.label}`,
    `Status: ${plan.status}`,
    `Receipt: ${plan.receiptLine}`,
    "",
    "## Next action",
    plan.nextAction,
    "",
    "## Runbook",
    ...plan.ownerRunbook.map((item) => `- [${item.status}] ${item.window} / ${item.owner} / ${item.label}: ${item.action} Evidence: ${item.evidence} Proof: ${item.proof}`)
  ].join("\n");
}

function quickBuyerEvidenceFollowUpStartDate(reviewerLine: string) {
  const match = reviewerLine.match(/\d{4}-\d{2}-\d{2}/);
  if (!match) return "";
  return parseIsoDateOnly(match[0]) ? match[0] : "";
}

function quickBuyerEvidenceFollowUpDueLabel(item: QuickExternalReviewOwnerPacketRunbookItem, index: number) {
  const window = item.window.toLowerCase();
  if (window.includes("now")) return "Today";
  if (window.includes("before buyer send") || window.includes("before send") || window.includes("before assignment")) return "+1 business day";
  if (window.includes("before re-review") || window.includes("before public forwarding")) return "+1 business day";
  if (window.includes("after repair") || window.includes("after sponsor reply") || window.includes("after verifier passes")) return "+2 business days";
  return index === 0 ? "Today" : `+${index + 1} business days`;
}

function quickBuyerEvidenceFollowUpDayOffset(dueLabel: string, index: number) {
  const match = dueLabel.match(/^\+(\d+)/);
  if (match) return Number(match[1]);
  return index === 0 ? 0 : index + 1;
}

function quickBuyerEvidenceFollowUpHref(item: QuickExternalReviewOwnerPacketRunbookItem, plan: QuickBuyerEvidenceResponseImportPlanBase) {
  if (/^(https?:\/\/|\/|#)/i.test(item.proof)) return item.proof;
  if (/^(https?:\/\/|\/|#)/i.test(item.evidence)) return item.evidence;
  return plan.verifierHref || plan.packVerifierHref || plan.evidencePackHref;
}

function quickBuyerEvidenceFollowUpCloseCondition(item: QuickExternalReviewOwnerPacketRunbookItem, plan: QuickBuyerEvidenceResponseImportPlanBase) {
  if (item.status === "ready") return `${item.owner} attaches the proof link and confirms it still matches ${plan.receiptLine}.`;
  if (item.status === "watch") return `${item.owner} records the outcome, regenerates any changed artifact, and keeps the verifier attached.`;
  return `${item.owner} clears the blocker, returns a fresh buyer response if needed, and verifies the replacement receipt.`;
}

function quickBuyerEvidenceCsvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function quickBuyerEvidenceFollowUpCsv(tasks: QuickBuyerEvidenceResponseFollowUpTask[]) {
  return [
    ["taskId", "label", "status", "owner", "due", "action", "closeCondition", "evidence", "proof", "href"],
    ...tasks.map((task) => [task.id, task.label, task.status, task.owner, task.dueLabel, task.action, task.closeCondition, task.evidence, task.proof, task.href])
  ]
    .map((row) => row.map(quickBuyerEvidenceCsvEscape).join(","))
    .join("\n");
}

function quickBuyerEvidenceFollowUpCalendar(input: {
  plan: QuickBuyerEvidenceResponseImportPlanBase;
  tasks: QuickBuyerEvidenceResponseFollowUpTask[];
  startDate: string;
}) {
  const start = parseIsoDateOnly(input.startDate);
  if (!start) return { calendarEndDate: "", calendarText: "", calendarHref: "" };
  const events = input.tasks.map((task, index) => {
    const eventStart = addUtcDays(start, quickBuyerEvidenceFollowUpDayOffset(task.dueLabel, index));
    return {
      task,
      eventStart,
      eventEnd: addUtcDays(eventStart, 1)
    };
  });
  const calendarEndDate = events.length
    ? events
        .map((event) => event.eventStart)
        .reduce((latest, candidate) => (candidate.getTime() > latest.getTime() ? candidate : latest), events[0].eventStart)
        .toISOString()
        .slice(0, 10)
    : input.startDate;
  const checksum = stablePacketHash(
    [
      input.startDate,
      calendarEndDate,
      input.plan.state,
      input.plan.status,
      input.plan.receiptLine,
      ...input.tasks.map((task) => `${task.id}:${task.status}:${task.owner}:${task.dueLabel}:${task.action}:${task.closeCondition}:${task.href}`)
    ].join("\n")
  );
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//Buyer Evidence Response//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap(({ task, eventStart, eventEnd }) => [
      "BEGIN:VEVENT",
      `UID:${task.id}-${compactIcsDate(eventStart)}-${checksum}@a2a-agent-marketplace`,
      `DTSTAMP:${compactIcsDate(start)}T000000Z`,
      `DTSTART;VALUE=DATE:${compactIcsDate(eventStart)}`,
      `DTEND;VALUE=DATE:${compactIcsDate(eventEnd)}`,
      `SUMMARY:${escapeIcsText(`${task.dueLabel} ${task.label} - ${task.owner}`)}`,
      `DESCRIPTION:${escapeIcsText(`Status: ${task.status}\nAction: ${task.action}\nClose: ${task.closeCondition}\nEvidence: ${task.evidence}\nResponse: ${input.plan.receiptLine}`)}`,
      `X-A2A-HREF:${escapeIcsText(task.href)}`,
      "END:VEVENT"
    ]),
    "END:VCALENDAR"
  ];
  const calendarText = icsLines.map(foldIcsLine).join("\r\n");
  return {
    calendarEndDate,
    calendarText,
    calendarHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(calendarText)}`
  };
}

function quickBuyerEvidenceFollowUpHeadline(plan: QuickBuyerEvidenceResponseImportPlanBase) {
  if (plan.state !== "verified") return "Returned response is held until it can be trusted";
  if (plan.status === "ready") return "Buyer response is ready to run";
  if (plan.status === "watch") return "Buyer response becomes a dated repair ledger";
  return "Buyer response blocks external send";
}

function buildQuickBuyerEvidenceResponseFollowUpLedger(plan: QuickBuyerEvidenceResponseImportPlanBase): QuickBuyerEvidenceResponseFollowUpLedger {
  const tasks = plan.ownerRunbook.map((item, index) => ({
    id: item.id,
    label: item.label,
    status: item.status,
    owner: item.owner,
    dueLabel: quickBuyerEvidenceFollowUpDueLabel(item, index),
    action: item.action,
    closeCondition: quickBuyerEvidenceFollowUpCloseCondition(item, plan),
    evidence: item.evidence,
    proof: item.proof,
    href: quickBuyerEvidenceFollowUpHref(item, plan)
  }));
  const readyCount = tasks.filter((task) => task.status === "ready").length;
  const watchCount = tasks.filter((task) => task.status === "watch").length;
  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const firstOpenTask = tasks.find((task) => task.status !== "ready") ?? tasks[0];
  const csv = quickBuyerEvidenceFollowUpCsv(tasks);
  const calendarStartDate = quickBuyerEvidenceFollowUpStartDate(plan.reviewerLine);
  const calendar = quickBuyerEvidenceFollowUpCalendar({ plan, tasks, startDate: calendarStartDate });
  const headline = quickBuyerEvidenceFollowUpHeadline(plan);
  const summary =
    plan.state === "verified"
      ? `${tasks.length} owner task${tasks.length === 1 ? "" : "s"} are tied to the returned response, with ${blockedCount} blocked and ${watchCount} watch item${watchCount === 1 ? "" : "s"}.`
      : `${tasks.length} hold task${tasks.length === 1 ? "" : "s"} keep the response from being applied until the receipt matches this evidence pack.`;
  const exportMarkdown = [
    "# Buyer evidence response follow-up ledger",
    "",
    `State: ${plan.state}`,
    `Status: ${plan.status}`,
    `Buyer: ${plan.buyer}`,
    `Response: ${plan.receiptLine}`,
    `Evidence: ${plan.evidenceReceiptId} / ${plan.evidenceChecksum}`,
    `First due: ${firstOpenTask?.dueLabel ?? "No owner task"}`,
    "",
    "## Summary",
    summary,
    "",
    "## Tasks",
    ...tasks.map((task) => [
      `- [${task.status}] ${task.dueLabel} / ${task.owner} / ${task.label}`,
      `  Action: ${task.action}`,
      `  Close: ${task.closeCondition}`,
      `  Evidence: ${task.evidence}`,
      `  Proof: ${task.proof}`
    ].join("\n")),
    "",
    "## CSV",
    "```csv",
    csv,
    "```",
    "",
    "## Calendar",
    calendar.calendarHref ? `Calendar window: ${calendarStartDate} to ${calendar.calendarEndDate}` : "Calendar hold is generated after a returned response includes a valid generated date."
  ].join("\n");

  return {
    status: plan.status,
    headline,
    summary,
    readyCount,
    watchCount,
    blockedCount,
    taskTotal: tasks.length,
    firstDueLabel: firstOpenTask?.dueLabel ?? "No owner task",
    tasks,
    csv,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
    calendarStartDate,
    calendarEndDate: calendar.calendarEndDate,
    calendarText: calendar.calendarText,
    calendarHref: calendar.calendarHref,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function completeQuickBuyerEvidenceResponseImportPlan(plan: QuickBuyerEvidenceResponseImportPlanBase): QuickBuyerEvidenceResponseImportPlan {
  const ownerPacketMarkdown = plan.ownerPacketMarkdown || quickBuyerEvidenceResponseOwnerPacket(plan);
  const completedPlan = { ...plan, ownerPacketMarkdown };
  const ownerPacketReceiptPayload: QuickBuyerEvidenceResponseOwnerPacketReceiptPayload = {
    receiptVersion: QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERSION,
    status: plan.status,
    state: plan.state,
    label: plan.label,
    buyer: plan.buyer,
    owner: plan.nextOwner,
    nextAction: plan.nextAction,
    evidenceReceiptId: plan.evidenceReceiptId,
    evidenceChecksum: plan.evidenceChecksum,
    responseReceiptChecksum: responseChecksumFromLine(plan.receiptLine),
    reviewerLine: plan.reviewerLine,
    runbook: plan.ownerRunbook,
    ownerPacketMarkdown,
    proof: `Owner packet generated from buyer evidence response state ${plan.state}, conversion evidence ${plan.evidenceReceiptId}, and response receipt ${responseChecksumFromLine(plan.receiptLine)}.`
  };
  const ownerPacketReceiptChecksum = quickBuyerEvidenceResponseOwnerPacketReceiptChecksum(ownerPacketReceiptPayload);
  const ownerPacketReceiptJson = quickBuyerEvidenceResponseOwnerPacketReceiptRequestJson({
    checksum: ownerPacketReceiptChecksum,
    payload: ownerPacketReceiptPayload
  });
  const ownerPacketVerifierStorageKey = `quick-buyer-evidence-response-owner-${ownerPacketReceiptChecksum}`;
  const exportMarkdown = quickBuyerEvidenceResponseExport(completedPlan);
  return {
    ...plan,
    ownerPacketMarkdown,
    ownerPacketHref: plan.ownerPacketHref || `data:text/markdown;charset=utf-8,${encodeURIComponent(ownerPacketMarkdown)}`,
    ownerPacketReceiptJson,
    ownerPacketReceiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(ownerPacketReceiptJson)}`,
    ownerPacketVerifierStorageKey,
    ownerPacketVerifierHref: receiptVerifierPrefillHref(ownerPacketReceiptJson),
    followUpLedger: buildQuickBuyerEvidenceResponseFollowUpLedger(completedPlan),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function quickBuyerEvidenceResponseHeadline(decision: QuickExternalReviewDecision, buyer: string) {
  if (decision === "continue") return `${buyer} accepted the evidence pack`;
  if (decision === "revise") return `${buyer} response is now a repair order`;
  return `${buyer} send is held by the returned response`;
}

export type QuickBuyerEvidenceResponseImportTarget = {
  buyer: string;
  conversionReceipt: {
    receiptId: string;
    checksumAlgorithm: string;
    checksum: string;
  };
  evidencePack: Pick<QuickBuyerEvidencePack, "sharePayloadJson" | "shareHref" | "verifierHref">;
};

export function buildQuickBuyerEvidenceResponseImportPlan(
  rawResponse: string,
  target: QuickBuyerEvidenceResponseImportTarget
): QuickBuyerEvidenceResponseImportPlan {
  const evidencePackPayload = parseQuickBuyerEvidencePackSharePayload(target.evidencePack.sharePayloadJson);
  const targetReceiptId = evidencePackPayload?.sourceReceiptId || target.conversionReceipt.receiptId;
  const rawTargetChecksum = evidencePackPayload?.sourceChecksum || `${target.conversionReceipt.checksumAlgorithm}:${target.conversionReceipt.checksum}`;
  const [targetChecksumPrefix, ...targetChecksumParts] = rawTargetChecksum.split(":");
  const targetChecksumAlgorithm =
    targetChecksumParts.length > 0 && targetChecksumPrefix ? targetChecksumPrefix : target.conversionReceipt.checksumAlgorithm;
  const targetChecksum = normalizeExternalReviewChecksum(rawTargetChecksum || target.conversionReceipt.checksum);
  const currentReceiptLine = `${targetReceiptId} / ${targetChecksumAlgorithm}:${targetChecksum}`;
  const evidenceChecksum = `${targetChecksumAlgorithm}:${targetChecksum}`;
  const emptyBase: QuickBuyerEvidenceResponseImportPlanBase = {
    state: "empty",
    status: "watch",
    label: "Awaiting buyer response",
    headline: "Return the buyer response to this room",
    summary: "Open the share page, record the buyer decision, then return the generated response URL to turn it into owner work.",
    buyer: target.buyer || "Buyer",
    reviewerLine: "No buyer response imported.",
    receiptLine: currentReceiptLine,
    evidenceReceiptId: targetReceiptId,
    evidenceChecksum,
    nextOwner: "Review coordinator",
    nextAction: "Open the shared evidence pack, record the buyer decision, then paste the Return response URL or receipt here.",
    verificationRequestJson: "",
    verifierHref: "",
    evidencePackHref: target.evidencePack.shareHref,
    packVerifierHref: target.evidencePack.verifierHref,
    ownerPacketMarkdown: "",
    ownerMailHref: "",
    ownerRunbook: quickBuyerEvidenceResponseFallbackRunbook({
      status: "watch",
        state: "empty",
        nextOwner: "Review coordinator",
        nextAction: "Open the shared evidence pack, record the buyer decision, then paste the Return response URL or receipt here.",
        receiptLine: currentReceiptLine,
        evidencePackHref: target.evidencePack.shareHref,
        packVerifierHref: target.evidencePack.verifierHref
      })
    };

  if (!rawResponse.trim()) return completeQuickBuyerEvidenceResponseImportPlan(emptyBase);

  if (!evidencePackPayload) {
    return completeQuickBuyerEvidenceResponseImportPlan({
      ...emptyBase,
      state: "invalid",
      status: "blocked",
      label: "Current pack cannot be checked",
      headline: "Evidence pack payload is unavailable",
      summary: "Regenerate the buyer room before importing a returned buyer response.",
      nextAction: "Regenerate the buyer evidence pack, then request a fresh returned response.",
      ownerRunbook: quickBuyerEvidenceResponseFallbackRunbook({
        status: "blocked",
        state: "invalid",
        nextOwner: "Review coordinator",
        nextAction: "Regenerate the buyer evidence pack, then request a fresh returned response.",
        receiptLine: currentReceiptLine,
        evidencePackHref: target.evidencePack.shareHref,
        packVerifierHref: target.evidencePack.verifierHref
      })
    });
  }

  const parsed = parseExternalReviewResponseRequest(rawResponse);
  if (!parsed.request) {
    return completeQuickBuyerEvidenceResponseImportPlan({
      ...emptyBase,
      state: "invalid",
      status: "blocked",
      label: "Response not accepted",
      headline: "Buyer response could not be read",
      summary: parsed.error,
      nextOwner: "Review coordinator",
      nextAction: "Paste the exact Return response URL or buyer response receipt JSON from the shared evidence page.",
      reviewerLine: "Unreadable buyer response.",
      ownerRunbook: quickBuyerEvidenceResponseFallbackRunbook({
        status: "blocked",
        state: "invalid",
        nextOwner: "Review coordinator",
        nextAction: "Paste the exact Return response URL or buyer response receipt JSON from the shared evidence page.",
        receiptLine: currentReceiptLine,
        evidencePackHref: target.evidencePack.shareHref,
        packVerifierHref: target.evidencePack.verifierHref
      })
    });
  }

  const verification = verifyQuickExternalReviewDecisionReceipt(parsed.request);
  const verificationRequestJson = quickExternalReviewDecisionReceiptRequestJson(parsed.request);
  const verifierHref = receiptVerifierPrefillHref(verificationRequestJson);
  const payload = parsed.request.payload;
  const receiptLine = `fnv1a32:${parsed.request.checksum} / ${payload.manifestReceiptId}`;
  const manifestMatches =
    payload.manifestReceiptId === targetReceiptId &&
    normalizeExternalReviewChecksum(payload.manifestChecksum) === targetChecksum;
  const replacementCloseout = quickBuyerEvidenceReceiptReplacementCloseoutFromPayload(payload.replacementCloseout);
  const rebuiltReceipt = buildQuickBuyerEvidenceDecisionReceipt({
    payload: evidencePackPayload,
    decision: payload.decision,
    reviewerName: payload.reviewerName,
    reviewerNote: payload.reviewerNote,
    generatedAt: payload.generatedAt,
    closeout: replacementCloseout
  });
  const generatedByEvidenceDesk = rebuiltReceipt.checksum === parsed.request.checksum.trim().toLowerCase();

  if (verification.status !== "verified" || (manifestMatches && !generatedByEvidenceDesk)) {
    const summary =
      verification.status !== "verified"
        ? verification.instruction
        : "The receipt checksum verifies, but the payload was not generated from this buyer evidence pack share page.";
    return completeQuickBuyerEvidenceResponseImportPlan({
      ...emptyBase,
      state: "mismatch",
      status: "blocked",
      label: "Receipt checksum mismatch",
      headline: "Do not apply an edited buyer response",
      summary,
      reviewerLine: `${payload.reviewerName} / ${payload.generatedAt}`,
      receiptLine,
      nextOwner: "Review coordinator",
      nextAction: "Ask the reviewer to regenerate the response from the current buyer evidence share page.",
      verificationRequestJson,
      verifierHref,
      ownerRunbook: quickBuyerEvidenceResponseFallbackRunbook({
        status: "blocked",
        state: "mismatch",
        nextOwner: "Review coordinator",
        nextAction: "Ask the reviewer to regenerate the response from the current buyer evidence share page.",
        receiptLine,
        evidencePackHref: target.evidencePack.shareHref,
        packVerifierHref: target.evidencePack.verifierHref
      })
    });
  }

  if (!manifestMatches) {
    return completeQuickBuyerEvidenceResponseImportPlan({
      ...emptyBase,
      state: "wrong-pack",
      status: "blocked",
      label: "Receipt is for another evidence pack",
      headline: "Do not apply this response to the current room",
      summary: `The receipt verifies, but it belongs to ${payload.manifestReceiptId} / ${payload.manifestChecksum}, not ${currentReceiptLine}.`,
      reviewerLine: `${payload.reviewerName} / ${payload.generatedAt}`,
      receiptLine,
      nextOwner: "Review coordinator",
      nextAction: "Open the matching evidence pack or request a fresh buyer response for the current room.",
      verificationRequestJson,
      verifierHref,
      ownerRunbook: quickBuyerEvidenceResponseFallbackRunbook({
        status: "blocked",
        state: "wrong-pack",
        nextOwner: "Review coordinator",
        nextAction: "Open the matching evidence pack or request a fresh buyer response for the current room.",
        receiptLine,
        evidencePackHref: target.evidencePack.shareHref,
        packVerifierHref: target.evidencePack.verifierHref
      })
    });
  }

  return completeQuickBuyerEvidenceResponseImportPlan({
    state: "verified",
    status: rebuiltReceipt.payload.status,
    label: rebuiltReceipt.label,
    headline: quickBuyerEvidenceResponseHeadline(rebuiltReceipt.decision, target.buyer || rebuiltReceipt.payload.buyer),
    summary: `${payload.reviewerName} returned ${payload.reviewOutcome.toLowerCase()} with ${payload.testsReady}/${payload.testsTotal} required artifacts ready and ${payload.confidence}/100 confidence.`,
    buyer: target.buyer || rebuiltReceipt.payload.buyer,
    reviewerLine: `${payload.reviewerName} / ${payload.generatedAt}`,
    receiptLine,
    evidenceReceiptId: targetReceiptId,
    evidenceChecksum,
    nextOwner: rebuiltReceipt.owner,
    nextAction: payload.nextAction,
    verificationRequestJson,
    verifierHref,
    evidencePackHref: target.evidencePack.shareHref,
    packVerifierHref: target.evidencePack.verifierHref,
    ownerPacketMarkdown: rebuiltReceipt.ownerPacketMarkdown,
    ownerPacketHref: rebuiltReceipt.ownerPacketHref,
    ownerMailHref: rebuiltReceipt.ownerMailHref,
    ownerRunbook: rebuiltReceipt.ownerRunbook
  });
}

export type QuickAppliedLaunchPacketLink = {
  id: "launch-room" | "review-kit" | "acceptance-path" | "decision-receipt" | "trust-manifest" | "delivery-memo";
  label: string;
  href: string;
  role: string;
};

export type QuickAppliedSendDeskMetric = {
  id: "decision" | "proof" | "pilot";
  label: string;
  value: string;
  detail: string;
  status: QuickBuyerRoomPreviewStatus;
};

export type QuickAppliedStakeholderRoute = {
  id: "buyer" | "reviewer" | "proof-owner" | "operator";
  label: string;
  owner: string;
  action: string;
  proof: string;
  status: QuickBuyerRoomPreviewStatus;
  href?: string;
};

export type QuickAppliedAcceptanceCheck = {
  id: "buyer-ask" | "measured-value" | "public-proof" | "decision-record";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  evidence: string;
  action: string;
};

export type QuickAppliedSendDesk = {
  headline: string;
  summary: string;
  metrics: QuickAppliedSendDeskMetric[];
  routes: QuickAppliedStakeholderRoute[];
  checks: QuickAppliedAcceptanceCheck[];
};

export type QuickAppliedLaunchPacket = {
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  subject: string;
  sendDesk: QuickAppliedSendDesk;
  messageText: string;
  previewText: string;
  exportMarkdown: string;
  exportHref: string;
  links: QuickAppliedLaunchPacketLink[];
};

export type QuickPublicationKitItem = {
  id: "story" | "walkthrough" | "proof" | "tag";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  action: string;
  evidence: string;
};

export type QuickPublicationKit = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  storyText: string;
  storyHref: string;
  walkthroughText: string;
  walkthroughHref: string;
  exportMarkdown: string;
  exportHref: string;
  items: QuickPublicationKitItem[];
};

export type QuickGlobalPublishabilityGate = {
  id: "buyer-decision" | "public-proof" | "proof-freshness" | "submission-assets" | "rollout-plan" | "success-standard";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  evidence: string;
  action: string;
  href: string;
};

export type QuickGlobalPublishabilityFreshness = {
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  auditReceiptId: string;
  auditChecksum: string;
  auditRows: WorkflowLiveProofAudit["rows"];
  auditRowSummary: string;
  checkedAt: string;
  expiresAt: string;
  ttlHours: number;
  remainingHours: number;
  summary: string;
  nextAction: string;
  href: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickGlobalPublishabilityCertificate = {
  status: QuickBuyerRoomPreviewStatus;
  clearance: "external-review" | "internal-only";
  label: string;
  headline: string;
  sharePolicy: string;
  holdReason: string;
  receipts: Array<{ label: string; value: string }>;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickGlobalPublishabilityReviewerBrief = {
  status: QuickBuyerRoomPreviewStatus;
  clearance: QuickGlobalPublishabilityCertificate["clearance"];
  label: string;
  headline: string;
  summary: string;
  reviewQuestion: string;
  messageText: string;
  readOrder: Array<{
    label: string;
    status: QuickBuyerRoomPreviewStatus;
    detail: string;
    href: string;
  }>;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickGlobalPublishabilityClaimAuditRow = {
  id: QuickClaimProofItem["id"] | "proof-freshness";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  claim: string;
  evidence: string;
  proof: string;
  owner: string;
  verification: string;
  risk: string;
  nextAction: string;
  href: string;
};

export type QuickGlobalPublishabilityClaimAudit = {
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  traceScore: number;
  readyCount: number;
  totalCount: number;
  primaryRisk: string;
  rows: QuickGlobalPublishabilityClaimAuditRow[];
  receiptId: string;
  ledgerHref: string;
  csvHref: string;
  receiptHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickGlobalPublishabilityValueRouteStep = {
  id: "review-decision" | "day-0" | "day-7" | "day-14" | "day-30";
  window: "Review" | QuickRolloutCommand["window"];
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  outcome: string;
  evidence: string;
  proof: string;
  href: string;
};

export type QuickGlobalPublishabilityValueRoute = {
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  retainedValueLine: string;
  routeQuestion: string;
  nextAction: string;
  steps: QuickGlobalPublishabilityValueRouteStep[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickGlobalPublishabilityObjectionRow = {
  id: QuickBuyerObjectionItem["id"] | "proofFreshness";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  question: string;
  answer: string;
  evidence: string;
  owner: string;
  href: string;
};

export type QuickGlobalPublishabilityObjectionDeck = {
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  readyCount: number;
  totalCount: number;
  primaryQuestion: string;
  rows: QuickGlobalPublishabilityObjectionRow[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickGlobalPublishabilityReviewPacketItem = {
  id: "launch-certificate" | "reviewer-brief" | "claim-audit" | "value-route" | "objection-answers" | "proof-freshness";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  role: string;
  evidence: string;
  href: string;
};

export type QuickGlobalPublishabilityReviewPacketManifest = {
  receiptVersion: "quick-external-review-packet.v1";
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  payloadChecksum: string;
  status: QuickBuyerRoomPreviewStatus;
  clearance: QuickGlobalPublishabilityCertificate["clearance"];
  buyer: string;
  score: number;
  readyCount: number;
  totalCount: number;
  sendRule: string;
  nextAction: string;
  generatedFrom: string[];
  artifacts: Array<QuickGlobalPublishabilityReviewPacketItem & { contentKind: "markdown"; contentChecksum: string; contentLength: number; requiredOrder: number }>;
  sourceReceipts: Array<{ label: string; value: string }>;
};

export type QuickGlobalPublishabilityReviewPacket = {
  status: QuickBuyerRoomPreviewStatus;
  clearance: QuickGlobalPublishabilityCertificate["clearance"];
  label: string;
  headline: string;
  summary: string;
  sendRule: string;
  readyCount: number;
  totalCount: number;
  nextAction: string;
  items: QuickGlobalPublishabilityReviewPacketItem[];
  manifest: QuickGlobalPublishabilityReviewPacketManifest;
  manifestJson: string;
  manifestHref: string;
  manifestVerificationRequestJson: string;
  manifestVerificationStorageKey: string;
  manifestVerifierHref: string;
  reviewDeskHref: string;
  artifactBundleJson: string;
  artifactBundleHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickGlobalPublishabilityDecisionMemoTest = {
  id: "manifest-integrity" | "proof-freshness" | "external-clearance" | "claim-trace" | "value-route" | "objection-defense";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  test: string;
  evidence: string;
  href: string;
};

export type QuickGlobalPublishabilityDecisionMemo = {
  status: QuickBuyerRoomPreviewStatus;
  decision: "accept-external-review" | "hold-for-recheck" | "do-not-send";
  label: string;
  headline: string;
  summary: string;
  reviewerOutcome: string;
  confidenceScore: number;
  readyCount: number;
  totalCount: number;
  decisionRule: string;
  nextAction: string;
  tests: QuickGlobalPublishabilityDecisionMemoTest[];
  reviewDeskHref: string;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickGlobalPublishabilityRepairImpact = {
  targetLabel: string;
  targetHref: string;
  currentScore: number;
  projectedScore: number;
  scoreDelta: number;
  projectedStatus: QuickBuyerRoomPreviewStatus;
  nextAction: string;
  summary: string;
  ownerCommand: {
    owner: string;
    action: string;
    acceptanceCriteria: string[];
    verification: string;
    exportText: string;
    exportHref: string;
  };
};

export type QuickGlobalPublishabilityBrief = {
  status: QuickBuyerRoomPreviewStatus;
  score: number;
  label: string;
  headline: string;
  summary: string;
  primaryAction: string;
  primaryHref: string;
  sourceReceiptId: string;
  sourceChecksum: string;
  gates: QuickGlobalPublishabilityGate[];
  freshness: QuickGlobalPublishabilityFreshness;
  certificate: QuickGlobalPublishabilityCertificate;
  reviewerBrief: QuickGlobalPublishabilityReviewerBrief;
  claimAudit: QuickGlobalPublishabilityClaimAudit;
  valueRoute: QuickGlobalPublishabilityValueRoute;
  objectionDeck: QuickGlobalPublishabilityObjectionDeck;
  reviewPacket: QuickGlobalPublishabilityReviewPacket;
  decisionMemo: QuickGlobalPublishabilityDecisionMemo;
  repairImpact: QuickGlobalPublishabilityRepairImpact | null;
  exportMarkdown: string;
  exportHref: string;
};

export type QuickExternalReviewReadinessItem = {
  id: "launch-certificate" | "review-packet" | "decision-memo" | "fresh-proof";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  value: string;
  detail: string;
  action: string;
  href: string;
};

export type QuickExternalReviewRepairPath = {
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  targetLabel: string;
  proofLinkId?: QuickProofLinkId;
  sampleValue?: string;
  owner: string;
  action: string;
  href: string;
  currentScore: number;
  projectedScore: number;
  scoreDelta: number;
  projectedStatus: QuickBuyerRoomPreviewStatus;
  summary: string;
  nextAction: string;
  acceptanceCriteria: string[];
  verification: string;
  verificationLabel: string;
  exportHref: string;
};

export type QuickExternalReviewSendPacket = {
  headline: string;
  summary: string;
  subject: string;
  messageText: string;
  proofWindow: string;
  decisionAsk: string;
  attachments: Array<{
    label: string;
    detail: string;
    href: string;
    download?: string;
  }>;
  acceptanceCriteria: string[];
};

export type QuickExternalReviewReadiness = {
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  scoreLine: string;
  clearance: string;
  primaryAction: string;
  primaryHref: string;
  receiptLine: string;
  manifestLine: string;
  manifestVerificationStorageKey: string;
  manifestVerificationRequestJson: string;
  verifyHref: string;
  items: QuickExternalReviewReadinessItem[];
  repairPath: QuickExternalReviewRepairPath | null;
  sendPacket: QuickExternalReviewSendPacket | null;
  exportMarkdown: string;
  exportHref: string;
};

type QuickWorkflowIntakePanelProps = {
  currentOpenCount: number;
  currentPrimaryAction: string;
  onApplyDraft: (draft: WorkflowIntakeDraft) => void;
  launchRoomHref?: string;
  reviewKitHref?: string;
  acceptancePathHref?: string;
  decisionReceiptHref?: string;
  trustManifestHref?: string;
  deliveryMemoHref?: string;
  buyerEvidenceResponseTarget?: QuickBuyerEvidenceResponseImportTarget;
  onCopyText?: (text: string) => Promise<boolean>;
  variant?: "embedded" | "topline";
};

export type QuickWorkflowGuidedFields = {
  buyer: string;
  workflow: string;
  baseline: string;
  successMetric: string;
  teamSize: string;
  cyclesPerMonth: string;
  manualHoursPerCycle: string;
  adoptionRatePercent: string;
  hourlyCostYen: string;
  incidentRiskYenPerMonth: string;
  pilotManualMinutes: string;
  pilotAssistedMinutes: string;
  acceptedTasks: string;
  totalTasks: string;
  reviewer: string;
  dataBoundary: "public" | "internal" | "restricted";
  deployedUrl: string;
  protopediaUrl: string;
  videoUrl: string;
  pilotEvidenceUrl: string;
  workOrderEvidenceUrl: string;
  evidenceUrl: string;
  agentTrial: string;
};

export type QuickWorkflowGuidedProofCheck = {
  id: QuickProofLinkId;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  value: string;
  evidence: string;
  action: string;
};

export type QuickWorkflowBrowserDraft = {
  version: typeof QUICK_WORKFLOW_BROWSER_DRAFT_VERSION;
  savedAt: string;
  rawIntake: string;
  guidedFields: QuickWorkflowGuidedFields;
  draft: WorkflowIntakeDraft | null;
};

type QuickWorkflowBrowserDraftRestoreSource = "local" | "share-link";

type QuickWorkflowBrowserDraftRestore = {
  draft: QuickWorkflowBrowserDraft;
  source: QuickWorkflowBrowserDraftRestoreSource;
};

type QuickWorkflowBrowserDraftStatus = "idle" | "restored" | "link-restored" | "saved" | "failed" | "cleared" | "imported" | "import-failed";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function defaultQuickWorkflowGuidedFields(): QuickWorkflowGuidedFields {
  return {
    buyer: "",
    workflow: "",
    baseline: "",
    successMetric: "",
    teamSize: "",
    cyclesPerMonth: "",
    manualHoursPerCycle: "",
    adoptionRatePercent: "",
    hourlyCostYen: "",
    incidentRiskYenPerMonth: "",
    pilotManualMinutes: "",
    pilotAssistedMinutes: "",
    acceptedTasks: "",
    totalTasks: "",
    reviewer: "",
    dataBoundary: "public",
    deployedUrl: "",
    protopediaUrl: "",
    videoUrl: "",
    pilotEvidenceUrl: "",
    workOrderEvidenceUrl: "",
    evidenceUrl: "",
    agentTrial: ""
  };
}

export function quickWorkflowReferenceGuidedFields(links: QuickWorkflowIntakeExampleLinks = {}): QuickWorkflowGuidedFields {
  const proofBaseUrl = cleanBuyerFacingProofUrl(links.proofBaseUrl || SUBMISSION_PROOF.deployedUrl);
  const protopediaUrl = links.protopediaUrl?.trim() || SUBMISSION_PROOF.protopediaUrl;
  const videoUrl = links.videoUrl?.trim() || SUBMISSION_PROOF.videoUrl;

  return {
    ...defaultQuickWorkflowGuidedFields(),
    buyer: "Platform release lead",
    workflow: "Weekly Cloud Run release-readiness review across tickets, CI logs, rollout checks, and sponsor sign-off.",
    baseline: "Release proof is scattered across tickets, spreadsheets, Cloud Run checks, and review threads.",
    successMetric: "Save 6 hours per review and close all public proof gaps before sponsor review.",
    teamSize: "8",
    cyclesPerMonth: "5",
    manualHoursPerCycle: "28",
    adoptionRatePercent: "75",
    hourlyCostYen: "12000",
    incidentRiskYenPerMonth: "240000",
    pilotManualMinutes: "1680",
    pilotAssistedMinutes: "560",
    acceptedTasks: "5",
    totalTasks: "5",
    reviewer: "Platform sponsor",
    dataBoundary: "public",
    deployedUrl: proofBaseUrl,
    protopediaUrl: validProtoPediaUrl(protopediaUrl) && !placeholderProofUrlReason(protopediaUrl) ? protopediaUrl : "",
    videoUrl: validVideoUrl(videoUrl) && !placeholderProofUrlReason(videoUrl) ? videoUrl : "",
    pilotEvidenceUrl: proofBaseUrl ? `${proofBaseUrl}${SAMPLE_PILOT_RECEIPT_PATH}` : "",
    workOrderEvidenceUrl: proofBaseUrl ? `${proofBaseUrl}${SAMPLE_WORK_ORDER_PATH}` : "",
    evidenceUrl: "",
    agentTrial: proofBaseUrl ? `agent=Cloud Run SRE, skill=cloudrun.release-proof, score 94, artifact ${proofBaseUrl}${SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH}` : ""
  };
}

function textField(value: unknown) {
  return typeof value === "string" ? value : "";
}

function guidedBoundary(value: unknown): QuickWorkflowGuidedFields["dataBoundary"] {
  return value === "internal" || value === "restricted" || value === "public" ? value : "public";
}

function quickWorkflowBase64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function quickWorkflowBase64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

function normalizeQuickWorkflowGuidedFields(value: unknown): QuickWorkflowGuidedFields {
  const defaults = defaultQuickWorkflowGuidedFields();
  if (!value || typeof value !== "object") return defaults;
  const candidate = value as Partial<Record<keyof QuickWorkflowGuidedFields, unknown>>;
  return {
    buyer: textField(candidate.buyer),
    workflow: textField(candidate.workflow),
    baseline: textField(candidate.baseline),
    successMetric: textField(candidate.successMetric),
    teamSize: textField(candidate.teamSize),
    cyclesPerMonth: textField(candidate.cyclesPerMonth),
    manualHoursPerCycle: textField(candidate.manualHoursPerCycle),
    adoptionRatePercent: textField(candidate.adoptionRatePercent),
    hourlyCostYen: textField(candidate.hourlyCostYen),
    incidentRiskYenPerMonth: textField(candidate.incidentRiskYenPerMonth),
    pilotManualMinutes: textField(candidate.pilotManualMinutes),
    pilotAssistedMinutes: textField(candidate.pilotAssistedMinutes),
    acceptedTasks: textField(candidate.acceptedTasks),
    totalTasks: textField(candidate.totalTasks),
    reviewer: textField(candidate.reviewer),
    dataBoundary: guidedBoundary(candidate.dataBoundary),
    deployedUrl: textField(candidate.deployedUrl),
    protopediaUrl: textField(candidate.protopediaUrl),
    videoUrl: textField(candidate.videoUrl),
    pilotEvidenceUrl: textField(candidate.pilotEvidenceUrl),
    workOrderEvidenceUrl: textField(candidate.workOrderEvidenceUrl),
    evidenceUrl: textField(candidate.evidenceUrl),
    agentTrial: textField(candidate.agentTrial)
  };
}

function workflowDraftFromUnknown(value: unknown): WorkflowIntakeDraft | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<WorkflowIntakeDraft>;
  if (typeof candidate.confidence !== "number") return null;
  if (!candidate.workOrder || typeof candidate.workOrder !== "object") return null;
  if (!candidate.buyerScenario || typeof candidate.buyerScenario !== "object") return null;
  if (!candidate.proofLinks || typeof candidate.proofLinks !== "object") return null;
  if (!Array.isArray(candidate.detectedSignals) || !Array.isArray(candidate.warnings) || !Array.isArray(candidate.sourceTrace)) return null;
  return candidate as WorkflowIntakeDraft;
}

export function buildQuickWorkflowBrowserDraft(
  rawIntake: string,
  guidedFields: QuickWorkflowGuidedFields,
  draft: WorkflowIntakeDraft | null,
  savedAt = new Date().toISOString()
): QuickWorkflowBrowserDraft {
  const normalizedGuidedFields = normalizeQuickWorkflowGuidedFields(guidedFields);
  const persistedRawIntake = rawIntake.trim() ? rawIntake : buildQuickWorkflowNoteFromFields(normalizedGuidedFields);
  return {
    version: QUICK_WORKFLOW_BROWSER_DRAFT_VERSION,
    savedAt,
    rawIntake: persistedRawIntake,
    guidedFields: normalizedGuidedFields,
    draft
  };
}

const QUICK_WORKFLOW_PUBLIC_SAFE_SHARE_BUYER = "External reviewer";
const QUICK_WORKFLOW_PUBLIC_SAFE_SHARE_FALLBACK_WORKFLOW = "Public-safe workflow review";
const QUICK_WORKFLOW_PUBLIC_SAFE_SHARE_URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s)]+|\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:\/[^\s)]*)?/gi;
const QUICK_WORKFLOW_PUBLIC_SAFE_SHARE_EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

function quickWorkflowPublicSafeShareRegExp(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
}

function quickWorkflowPublicSafeShareTerms(...values: Array<string | undefined>) {
  const seen = new Set<string>();
  return values
    .flatMap((value) => value?.match(QUICK_WORKFLOW_PUBLIC_SAFE_SHARE_URL_PATTERN) ?? [value])
    .map((value) => cleanGuidedWorkflowField(value ?? ""))
    .filter((value) => {
      const key = value.toLowerCase();
      if (key.length < 4 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function quickWorkflowPublicSafeShareText(value: string | undefined, sensitiveTerms: string[], fallback: string) {
  let text = publicSafeWorkflowRewriteLine(value ?? "")
    .replace(QUICK_WORKFLOW_PUBLIC_SAFE_SHARE_EMAIL_PATTERN, "redacted email")
    .replace(QUICK_WORKFLOW_PUBLIC_SAFE_SHARE_URL_PATTERN, "public proof link omitted");
  for (const term of sensitiveTerms) {
    text = text.replace(quickWorkflowPublicSafeShareRegExp(term), QUICK_WORKFLOW_PUBLIC_SAFE_SHARE_BUYER);
  }
  return cleanGuidedWorkflowField(text) || fallback;
}

export function buildQuickWorkflowPublicSafeShareDraft(
  rawIntake: string,
  guidedFields: QuickWorkflowGuidedFields,
  draft: WorkflowIntakeDraft | null,
  savedAt = new Date().toISOString()
): QuickWorkflowBrowserDraft | null {
  if (!draft) return null;

  const normalizedGuidedFields = normalizeQuickWorkflowGuidedFields(guidedFields);
  const rawSource = rawIntake.trim() || buildQuickWorkflowNoteFromFields(normalizedGuidedFields);
  const redactionPacket = buildQuickPublicSafeRedactionPacket(draft);
  const sensitiveTerms = quickWorkflowPublicSafeShareTerms(
    draft.workOrder.targetUser,
    normalizedGuidedFields.buyer,
    draft.pilotRun.reviewerName,
    normalizedGuidedFields.reviewer,
    draft.proofLinks.targetUrl,
    draft.proofLinks.protopediaUrl,
    draft.proofLinks.videoUrl,
    draft.proofLinks.pilotEvidenceUrl,
    draft.proofLinks.workOrderEvidenceUrl,
    draft.workOrder.evidenceUrl,
    draft.pilotRun.evidenceUrl,
    normalizedGuidedFields.deployedUrl,
    normalizedGuidedFields.protopediaUrl,
    normalizedGuidedFields.videoUrl,
    normalizedGuidedFields.pilotEvidenceUrl,
    normalizedGuidedFields.workOrderEvidenceUrl,
    normalizedGuidedFields.evidenceUrl,
    ...(rawSource.match(QUICK_WORKFLOW_PUBLIC_SAFE_SHARE_URL_PATTERN) ?? [])
  );
  const publicSafeGuidedFields: QuickWorkflowGuidedFields = {
    ...defaultQuickWorkflowGuidedFields(),
    buyer: QUICK_WORKFLOW_PUBLIC_SAFE_SHARE_BUYER,
    workflow: quickWorkflowPublicSafeShareText(draft.workOrder.request || normalizedGuidedFields.workflow, sensitiveTerms, QUICK_WORKFLOW_PUBLIC_SAFE_SHARE_FALLBACK_WORKFLOW),
    baseline: quickWorkflowPublicSafeShareText(draft.workOrder.currentBaseline || normalizedGuidedFields.baseline, sensitiveTerms, "Current baseline redacted for public review"),
    successMetric: quickWorkflowPublicSafeShareText(draft.workOrder.successMetric || normalizedGuidedFields.successMetric, sensitiveTerms, "Public-safe success metric pending proof"),
    teamSize: normalizedGuidedFields.teamSize,
    cyclesPerMonth: normalizedGuidedFields.cyclesPerMonth,
    manualHoursPerCycle: normalizedGuidedFields.manualHoursPerCycle,
    adoptionRatePercent: normalizedGuidedFields.adoptionRatePercent,
    hourlyCostYen: normalizedGuidedFields.hourlyCostYen,
    incidentRiskYenPerMonth: normalizedGuidedFields.incidentRiskYenPerMonth,
    pilotManualMinutes: normalizedGuidedFields.pilotManualMinutes,
    pilotAssistedMinutes: normalizedGuidedFields.pilotAssistedMinutes,
    acceptedTasks: normalizedGuidedFields.acceptedTasks,
    totalTasks: normalizedGuidedFields.totalTasks,
    reviewer: QUICK_WORKFLOW_PUBLIC_SAFE_SHARE_BUYER,
    dataBoundary: "public",
    agentTrial: normalizedGuidedFields.agentTrial
      ? quickWorkflowPublicSafeShareText(normalizedGuidedFields.agentTrial, sensitiveTerms, "")
      : ""
  };
  const publicSafeWorkflowNote = buildQuickWorkflowNoteFromFields(publicSafeGuidedFields);
  const publicSafeRawIntake = [
    publicSafeWorkflowNote,
    `Public-safe status: ${redactionPacket.status}`,
    `Public-safe receipt: ${redactionPacket.receipt.receiptId}`
  ].join("\n");

  return buildQuickWorkflowBrowserDraft(publicSafeRawIntake, publicSafeGuidedFields, null, savedAt);
}

export function quickWorkflowBrowserDraftHasContent(draft: Pick<QuickWorkflowBrowserDraft, "rawIntake" | "guidedFields" | "draft">) {
  return Boolean(draft.rawIntake.trim() || quickWorkflowGuidedReadyCount(draft.guidedFields) > 0 || draft.draft);
}

export function parseQuickWorkflowBrowserDraft(serialized: string | null): QuickWorkflowBrowserDraft | null {
  if (!serialized) return null;
  try {
    const parsed = JSON.parse(serialized) as Partial<QuickWorkflowBrowserDraft>;
    if (parsed.version !== QUICK_WORKFLOW_BROWSER_DRAFT_VERSION || typeof parsed.savedAt !== "string") return null;
    const draft = buildQuickWorkflowBrowserDraft(textField(parsed.rawIntake), normalizeQuickWorkflowGuidedFields(parsed.guidedFields), workflowDraftFromUnknown(parsed.draft), parsed.savedAt);
    return quickWorkflowBrowserDraftHasContent(draft) ? draft : null;
  } catch {
    return null;
  }
}

export function quickWorkflowBrowserDraftShareParam(draft: QuickWorkflowBrowserDraft) {
  const shareDraft = buildQuickWorkflowBrowserDraft(draft.rawIntake, draft.guidedFields, null, draft.savedAt);
  return quickWorkflowBase64UrlEncode(JSON.stringify(shareDraft));
}

export function parseQuickWorkflowBrowserDraftShareParam(value: string | null): QuickWorkflowBrowserDraft | null {
  if (!value) return null;
  try {
    return parseQuickWorkflowBrowserDraft(quickWorkflowBase64UrlDecode(value));
  } catch {
    return null;
  }
}

export function quickWorkflowBrowserDraftShareHref(draft: QuickWorkflowBrowserDraft, href: string) {
  try {
    const url = new URL(href);
    url.searchParams.set(QUICK_WORKFLOW_BROWSER_DRAFT_SHARE_PARAM, quickWorkflowBrowserDraftShareParam(draft));
    url.hash = "quick-workflow-intake";
    return url.toString();
  } catch {
    return "";
  }
}

function readQuickWorkflowBrowserDraftRestore(): QuickWorkflowBrowserDraftRestore | null {
  if (typeof window === "undefined") return null;
  try {
    const sharedDraft = parseQuickWorkflowBrowserDraftShareParam(new URL(window.location.href).searchParams.get(QUICK_WORKFLOW_BROWSER_DRAFT_SHARE_PARAM));
    if (sharedDraft) {
      writeQuickWorkflowBrowserDraft(sharedDraft);
      return { draft: sharedDraft, source: "share-link" };
    }
    const parsed = parseQuickWorkflowBrowserDraft(window.localStorage.getItem(QUICK_WORKFLOW_BROWSER_DRAFT_STORAGE_KEY));
    if (!parsed) window.localStorage.removeItem(QUICK_WORKFLOW_BROWSER_DRAFT_STORAGE_KEY);
    return parsed ? { draft: parsed, source: "local" } : null;
  } catch {
    return null;
  }
}

function writeQuickWorkflowBrowserDraft(draft: QuickWorkflowBrowserDraft) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(QUICK_WORKFLOW_BROWSER_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

function clearQuickWorkflowBrowserDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(QUICK_WORKFLOW_BROWSER_DRAFT_STORAGE_KEY);
  } catch {
    // The draft is already gone from the current React state; storage cleanup is best effort.
  }
}

function quickWorkflowBrowserDraftSavedAtLabel(savedAt: string) {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return "Saved locally.";
  return `Saved ${date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}.`;
}

function cleanGuidedWorkflowField(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function guidedNumber(value: string) {
  return cleanGuidedWorkflowField(value).replace(/[^\d.]/g, "");
}

export function buildQuickWorkflowNoteFromFields(fields: QuickWorkflowGuidedFields) {
  const lines: string[] = [];
  const buyer = cleanGuidedWorkflowField(fields.buyer);
  const workflow = cleanGuidedWorkflowField(fields.workflow);
  const baseline = cleanGuidedWorkflowField(fields.baseline);
  const successMetric = cleanGuidedWorkflowField(fields.successMetric);
  const reviewer = cleanGuidedWorkflowField(fields.reviewer);
  const deployedUrl = cleanGuidedWorkflowField(fields.deployedUrl);
  const protopediaUrl = cleanGuidedWorkflowField(fields.protopediaUrl);
  const videoUrl = cleanGuidedWorkflowField(fields.videoUrl);
  const pilotEvidenceUrl = cleanGuidedWorkflowField(fields.pilotEvidenceUrl);
  const workOrderEvidenceUrl = cleanGuidedWorkflowField(fields.workOrderEvidenceUrl);
  const evidenceUrl = cleanGuidedWorkflowField(fields.evidenceUrl);
  const agentTrial = cleanGuidedWorkflowField(fields.agentTrial);
  const teamSize = guidedNumber(fields.teamSize);
  const cyclesPerMonth = guidedNumber(fields.cyclesPerMonth);
  const manualHoursPerCycle = guidedNumber(fields.manualHoursPerCycle);
  const adoptionRatePercent = guidedNumber(fields.adoptionRatePercent);
  const hourlyCostYen = guidedNumber(fields.hourlyCostYen);
  const incidentRiskYenPerMonth = guidedNumber(fields.incidentRiskYenPerMonth);
  const pilotManualMinutes = guidedNumber(fields.pilotManualMinutes);
  const pilotAssistedMinutes = guidedNumber(fields.pilotAssistedMinutes);
  const acceptedTasks = guidedNumber(fields.acceptedTasks);
  const totalTasks = guidedNumber(fields.totalTasks);
  const hasUserField = [
    buyer,
    workflow,
    baseline,
    successMetric,
    reviewer,
    evidenceUrl,
    agentTrial,
    teamSize,
    cyclesPerMonth,
    manualHoursPerCycle,
    adoptionRatePercent,
    hourlyCostYen,
    incidentRiskYenPerMonth,
    pilotManualMinutes,
    pilotAssistedMinutes,
    acceptedTasks,
    totalTasks,
    deployedUrl,
    protopediaUrl,
    videoUrl,
    pilotEvidenceUrl,
    workOrderEvidenceUrl
  ].some(Boolean);

  if (buyer) lines.push(`Buyer: ${buyer}`);
  if (workflow) lines.push(`Workflow: ${workflow}`);
  if (baseline) lines.push(`Baseline: ${baseline}`);
  if (successMetric) lines.push(`Success: ${successMetric}`);

  const valueParts = [
    teamSize ? `team ${teamSize} people` : "",
    cyclesPerMonth ? `${cyclesPerMonth} reviews/month` : "",
    manualHoursPerCycle ? `manual ${manualHoursPerCycle} hours/review` : "",
    adoptionRatePercent ? `${adoptionRatePercent}% adoption` : "",
    hourlyCostYen ? `hourly cost ${hourlyCostYen} yen` : "",
    incidentRiskYenPerMonth ? `incident risk ${incidentRiskYenPerMonth} yen/month` : ""
  ].filter(Boolean);
  if (valueParts.length > 0) lines.push(`Value model: ${valueParts.join(", ")}.`);

  const pilotParts = [
    pilotManualMinutes ? `manual ${pilotManualMinutes} min` : "",
    pilotAssistedMinutes ? `assisted ${pilotAssistedMinutes} min` : "",
    acceptedTasks && totalTasks ? `${acceptedTasks}/${totalTasks} accepted tasks` : ""
  ].filter(Boolean);
  if (pilotParts.length > 0) lines.push(`Pilot: ${pilotParts.join(", ")}.`);
  if (reviewer) lines.push(`Reviewer: ${reviewer}`);

  if (hasUserField) lines.push(`Data boundary: ${fields.dataBoundary} evidence only.`);
  if (deployedUrl) lines.push(`Deployment: ${deployedUrl}`);
  if (protopediaUrl) lines.push(`ProtoPedia: ${protopediaUrl}`);
  if (videoUrl) lines.push(`Walkthrough: ${videoUrl}`);
  if (pilotEvidenceUrl) lines.push(`Pilot receipt: ${pilotEvidenceUrl}`);
  if (workOrderEvidenceUrl || evidenceUrl) lines.push(`Work order proof: ${workOrderEvidenceUrl || evidenceUrl}`);
  if (agentTrial) lines.push(`Accepted A2A trial: ${agentTrial}`);

  return lines.join("\n");
}

function quickWorkflowGuidedReadyCount(fields: QuickWorkflowGuidedFields) {
  const hasUserField = Object.entries(fields).some(([key, value]) => key !== "dataBoundary" && cleanGuidedWorkflowField(String(value)).length > 0);
  const groups = [
    cleanGuidedWorkflowField(fields.buyer),
    cleanGuidedWorkflowField(fields.workflow),
    cleanGuidedWorkflowField(fields.baseline),
    cleanGuidedWorkflowField(fields.successMetric),
    guidedNumber(fields.teamSize) && guidedNumber(fields.cyclesPerMonth) && guidedNumber(fields.manualHoursPerCycle) && guidedNumber(fields.adoptionRatePercent) && guidedNumber(fields.hourlyCostYen),
    guidedNumber(fields.pilotManualMinutes) && guidedNumber(fields.pilotAssistedMinutes) && guidedNumber(fields.acceptedTasks) && guidedNumber(fields.totalTasks),
    hasUserField ? fields.dataBoundary : "",
    cleanGuidedWorkflowField(fields.agentTrial)
  ];
  return groups.filter(Boolean).length;
}

export function quickWorkflowGuidedProofReadyCount(fields: QuickWorkflowGuidedFields) {
  return [fields.deployedUrl, fields.protopediaUrl, fields.videoUrl, fields.pilotEvidenceUrl, fields.workOrderEvidenceUrl || fields.evidenceUrl]
    .map((value) => cleanBuyerFacingProofUrl(cleanGuidedWorkflowField(value)))
    .filter(Boolean).length;
}

export function buildQuickWorkflowGuidedProofChecks(fields: QuickWorkflowGuidedFields): QuickWorkflowGuidedProofCheck[] {
  const specs: Array<{ id: QuickProofLinkId; label: string; value: string }> = [
    { id: "targetUrl", label: "Deployed URL", value: fields.deployedUrl },
    { id: "protopediaUrl", label: "ProtoPedia URL", value: fields.protopediaUrl },
    { id: "videoUrl", label: "Walkthrough video", value: fields.videoUrl },
    { id: "pilotEvidenceUrl", label: "Pilot receipt", value: fields.pilotEvidenceUrl },
    { id: "workOrderEvidenceUrl", label: "Work order proof", value: fields.workOrderEvidenceUrl || fields.evidenceUrl }
  ];

  return specs.map((spec) => {
    const value = cleanGuidedWorkflowField(spec.value);
    const status = proofSlotStatus(spec.id, value);
    const displayValue = normalizedProofDisplayValue(spec.id, value);
    const action =
      status === "ready"
        ? "Ready for live proof verification."
        : value
          ? invalidProofAction(spec.id, value)
          : `Attach ${spec.label.toLowerCase()} as a public https URL.`;

    return {
      id: spec.id,
      label: spec.label,
      status,
      value: displayValue,
      evidence: status === "ready" ? displayValue : value ? displayValue : "Missing public URL",
      action
    };
  });
}

function draftProofLine(draft: WorkflowIntakeDraft) {
  const proofValues = Object.values(draft.proofLinks).filter(Boolean);
  if (proofValues.length === 1) return proofValues[0] ?? "";
  if (proofValues.length > 1) return `${proofValues.length}/5 launch proof URLs extracted`;
  return draft.workOrder.evidenceUrl || draft.pilotRun.evidenceUrl || "No public proof URL extracted yet.";
}

function proofReadinessLine(plan: QuickProofRepairPlan) {
  if (plan.repairCount === 0) return "5/5 public proof URLs ready";
  if (plan.readyCount > 0) return `${plan.readyCount}/5 public proof URLs ready / ${plan.repairCount} need repair`;
  return "No public proof URL ready yet.";
}

export function buildQuickProofReplacementPacket(
  draft: WorkflowIntakeDraft,
  options: {
    proofVerification?: BuyerShareGateProofVerificationSummary | null;
    workflowIntakeHref?: string;
    currentAuditHref?: string;
    launchRoomHref?: string;
    updatedAt?: string;
  } = {}
): BuyerProofReplacementPacket {
  const buyerWorkOrder = normalizeBuyerWorkOrderInput({
    ...draft.workOrder,
    ...(draft.proofLinks.workOrderEvidenceUrl ? { evidenceUrl: draft.proofLinks.workOrderEvidenceUrl } : {})
  });
  const buyerScenario = normalizeBuyerValueScenarioInput(draft.buyerScenario);
  const pilotRun = normalizePilotRunReceiptInput({
    ...draft.pilotRun,
    ...(draft.proofLinks.pilotEvidenceUrl ? { evidenceUrl: draft.proofLinks.pilotEvidenceUrl } : {})
  });
  const workspace = buildWorkspaceDraft({
    activeTemplateId: "custom",
    projectBrief: buildWorkflowIntakeBrief({ workOrder: buyerWorkOrder, buyerScenario, pilotRun }),
    selectedAgentIds: ["market-broker", "cloud-run-sre", "security-sentinel"],
    buyerScenario,
    pilotRun,
    buyerWorkOrder,
    targetUrl: draft.proofLinks.targetUrl || "",
    protopediaUrl: draft.proofLinks.protopediaUrl || "",
    videoUrl: draft.proofLinks.videoUrl || "",
    proofVerification: options.proofVerification ?? null,
    updatedAt: options.updatedAt ?? "2026-06-25T00:00:00.000Z"
  });

  return buildBuyerProofReplacementPacket({
    workspace,
    proofVerification: options.proofVerification ?? null,
    workflowIntakeHref: options.workflowIntakeHref ?? `#${QUICK_PROOF_REPAIR_PLAN_ID}`,
    currentAuditHref: options.currentAuditHref ?? `#${QUICK_LIVE_PROOF_AUDIT_ID}`,
    launchRoomHref: options.launchRoomHref ?? "#quick-workflow-intake"
  });
}

function buildQuickProofRepairImpact(input: {
  readyCount: number;
  repairCount: number;
  items: QuickProofRepairItem[];
}): QuickProofRepairImpact {
  const firstOpen = input.items.find((item) => item.status !== "ready");
  const readinessScore = Math.round((input.readyCount / Math.max(1, input.items.length)) * 100);
  const status: QuickBuyerRoomPreviewStatus = input.repairCount === 0 ? "ready" : input.readyCount > 0 ? "watch" : "blocked";
  const headline =
    status === "ready"
      ? "Proof repair unlocks buyer-send preparation"
      : status === "watch"
        ? `${input.repairCount} proof repair item${input.repairCount === 1 ? "" : "s"} still hold buyer send`
        : "Public proof repair has not started";
  const summary =
    status === "ready"
      ? "All proof slots are attached; the next proof move is a live verification receipt before external sharing."
      : `${firstOpen?.owner ?? "Proof owner"} must close ${firstOpen?.label ?? "the first missing proof link"} before the buyer evidence pack can be sent.`;
  const nextVerifierAction =
    status === "ready"
      ? "Run live proof verification and attach the timestamped audit receipt before buyer send."
      : `Attach or replace ${firstOpen?.label ?? "the missing proof link"}, then rerun live proof verification.`;
  const items: QuickProofRepairImpactItem[] = [
    {
      id: "proof-slots",
      label: "Proof slots",
      status,
      evidence: `${input.readyCount}/5 public proof links ready`,
      nextAction: status === "ready" ? "Keep all five public URLs attached." : firstOpen?.action ?? "Attach public proof URLs.",
      href: firstOpen ? quickProofRepairFieldHref(firstOpen.id) : `#${QUICK_PROOF_REPAIR_PLAN_ID}`
    },
    {
      id: "live-verification",
      label: "Live verifier",
      status: status === "ready" ? "watch" : "blocked",
      evidence: status === "ready" ? "Proof URLs are ready for live verification." : "Live verification waits for repaired public URLs.",
      nextAction: nextVerifierAction,
      href: `#${QUICK_LIVE_PROOF_AUDIT_ID}`
    },
    {
      id: "buyer-send",
      label: "Buyer evidence send",
      status,
      evidence: status === "ready" ? "Buyer evidence pack can be regenerated with complete proof links." : `${input.repairCount} repair item${input.repairCount === 1 ? "" : "s"} still block buyer-send.`,
      nextAction: status === "ready" ? "Regenerate the buyer evidence pack and request the buyer response." : firstOpen?.action ?? "Close proof repairs before sharing.",
      href: `#${QUICK_PROOF_REPAIR_PLAN_ID}`
    },
    {
      id: "global-review",
      label: "Global review",
      status: status === "ready" ? "watch" : "blocked",
      evidence: status === "ready" ? "Proof links no longer block the global launch certificate." : "Global launch remains internal until proof links are attached.",
      nextAction: status === "ready" ? "Run live proof, then refresh the launch certificate." : "Close proof repair before requesting external review.",
      href: "#quick-global-publishability"
    }
  ];
  const exportMarkdown = [
    "# Proof repair impact preview",
    "",
    `Status: ${status}`,
    `Readiness: ${readinessScore}/100`,
    `Ready: ${input.readyCount}/5`,
    `Repairs remaining: ${input.repairCount}`,
    `First open: ${firstOpen?.label ?? "none"}`,
    "",
    "## Summary",
    summary,
    "",
    "## Unlocks",
    ...items.map((item) => `- [${item.status}] ${item.label}: ${item.evidence} Next: ${item.nextAction}`)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    readinessScore,
    readyCount: input.readyCount,
    repairCount: input.repairCount,
    firstOpenLabel: firstOpen?.label ?? "none",
    firstOpenOwner: firstOpen?.owner ?? "Proof owner",
    nextVerifierAction,
    items,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function draftValueLine(draft: WorkflowIntakeDraft) {
  const parts = [
    draft.buyerScenario.teamSize ? `${draft.buyerScenario.teamSize} people` : "",
    draft.buyerScenario.cyclesPerMonth ? `${draft.buyerScenario.cyclesPerMonth} cycles/month` : "",
    draft.buyerScenario.manualHoursPerCycle ? `${draft.buyerScenario.manualHoursPerCycle}h manual/cycle` : "",
    draft.buyerScenario.adoptionRatePercent ? `${draft.buyerScenario.adoptionRatePercent}% adoption` : ""
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Value assumptions not extracted yet.";
}

function draftPilotLine(draft: WorkflowIntakeDraft) {
  const manual = draft.pilotRun.observedManualMinutes;
  const assisted = draft.pilotRun.observedAssistedMinutes;
  const accepted = draft.pilotRun.acceptedTasks;
  const total = draft.pilotRun.totalTasks;
  const parts = [
    manual && assisted ? `${manual - assisted} minutes saved/run` : "",
    accepted && total ? `${accepted}/${total} accepted tasks` : "",
    draft.pilotRun.participants ? `${draft.pilotRun.participants} reviewers` : ""
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Measured run not extracted yet.";
}

function draftAgentTrialLine(draft: WorkflowIntakeDraft) {
  const trial = draft.agentTrialEvidence;
  if (!trial) return "No accepted A2A trial receipt extracted yet.";
  return [trial.agentName || "A2A agent", trial.skillId || "trial skill", `${trial.score}/100`].filter(Boolean).join(" / ");
}

function statusFromParts(required: unknown[], partial: unknown[] = []): QuickBuyerRoomPreviewStatus {
  if (required.every(Boolean)) return "ready";
  if ([...required, ...partial].some(Boolean)) return "watch";
  return "blocked";
}

function rowStatusScore(status: QuickBuyerRoomPreviewStatus) {
  if (status === "ready") return 100;
  if (status === "watch") return 62;
  return 18;
}

function formatYen(value: number) {
  return `¥${Math.round(value).toLocaleString("en-US")}`;
}

function formatHours(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export type QuickWorkflowLiveBuyerCaseItem = {
  id: "buyer" | "value" | "proof";
  label: string;
  status: QuickWorkflowInputReadinessStatus;
  value: string;
  detail: string;
};

export type QuickWorkflowLiveBuyerCase = {
  status: QuickWorkflowInputReadinessStatus;
  headline: string;
  summary: string;
  valueLine: string;
  proofLine: string;
  nextAction: string;
  items: QuickWorkflowLiveBuyerCaseItem[];
};

export type QuickWorkflowValueDiagnosisItem = {
  id: "measured-value" | "break-even" | "scope-fit" | "pilot-boundary" | "proof-gap" | "next-fix";
  label: string;
  status: QuickWorkflowInputReadinessStatus;
  value: string;
  detail: string;
};

type QuickWorkflowValueTuneField = Extract<keyof QuickWorkflowGuidedFields, "pilotAssistedMinutes" | "cyclesPerMonth" | "adoptionRatePercent">;

export type QuickWorkflowValueLever = {
  id: "automation" | "scope" | "adoption";
  label: string;
  status: QuickWorkflowInputReadinessStatus;
  value: string;
  detail: string;
  targetField?: QuickWorkflowValueTuneField;
  targetValue?: string;
  targetAction?: string;
  targetEffect?: string;
  targetMonthlyValueYen?: number;
  targetMonthlyHoursSaved?: number;
  targetOutcome?: string;
};

export type QuickWorkflowValueDiagnosis = {
  status: QuickWorkflowInputReadinessStatus;
  headline: string;
  summary: string;
  monthlyValueYen: number;
  monthlyHoursSaved: number;
  pilotBudgetCeilingYen: number;
  proofReadyCount: number;
  proofRepairCount: number;
  nextAction: string;
  exportMarkdown: string;
  exportHref: string;
  items: QuickWorkflowValueDiagnosisItem[];
  levers: QuickWorkflowValueLever[];
};

export type QuickWorkflowCommercialPilotOfferTerm = {
  id: "price" | "cap" | "send-rule" | "acceptance";
  label: string;
  status: QuickWorkflowInputReadinessStatus;
  value: string;
  detail: string;
};

export type QuickWorkflowCommercialPilotOfferStressCase = {
  id: "base-payback" | "downside-value" | "approval-floor";
  label: string;
  status: QuickWorkflowInputReadinessStatus;
  value: string;
  detail: string;
  buyerDecision: string;
};

export type QuickWorkflowCommercialPilotOfferObjection = {
  id: "price-defense" | "proof-trust" | "stop-rule";
  status: QuickWorkflowInputReadinessStatus;
  question: string;
  answer: string;
  evidence: string;
};

export type QuickWorkflowCommercialPilotOfferApprovalMemo = {
  status: QuickWorkflowInputReadinessStatus;
  score: number;
  decision: "approve" | "revise" | "hold";
  signer: string;
  summary: string;
  sendLine: string;
  redlines: string[];
};

export type QuickWorkflowCommercialDecisionPacketAttachment = {
  id: "offer" | "public-proof" | "pilot-receipt" | "work-order-proof" | "a2a-trial";
  label: string;
  status: QuickWorkflowInputReadinessStatus;
  value: string;
  action: string;
};

export type QuickWorkflowCommercialDecisionPacket = {
  status: QuickWorkflowInputReadinessStatus;
  mode: "buyer-ready" | "internal-redline" | "hold";
  headline: string;
  subject: string;
  body: string;
  meetingGoal: string;
  decisionAsk: string;
  sendRule: string;
  agenda: string[];
  attachments: QuickWorkflowCommercialDecisionPacketAttachment[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickWorkflowCommercialPilotOffer = {
  status: QuickWorkflowInputReadinessStatus;
  headline: string;
  summary: string;
  decision: string;
  suggestedPilotPriceYen: number;
  pilotBudgetCeilingYen: number;
  priceLine: string;
  guardrail: string;
  sendRule: string;
  acceptance: string;
  owner: string;
  nextAction: string;
  exportMarkdown: string;
  exportHref: string;
  terms: QuickWorkflowCommercialPilotOfferTerm[];
  stressCases: QuickWorkflowCommercialPilotOfferStressCase[];
  objections: QuickWorkflowCommercialPilotOfferObjection[];
  approvalMemo: QuickWorkflowCommercialPilotOfferApprovalMemo;
  decisionPacket: QuickWorkflowCommercialDecisionPacket;
};

export type QuickA2ATrialCandidate = {
  agentId: string;
  name: string;
  handle: string;
  fitScore: number;
  trialScore: number;
  skillId: string;
  skillLabel: string;
  reason: string;
  proof: string;
  href: string;
};

export type QuickA2ATrialStarter = {
  status: QuickWorkflowInputReadinessStatus;
  headline: string;
  summary: string;
  trialMethod: "message/send";
  recommended: QuickA2ATrialCandidate;
  acceptanceCriteria: string[];
  payloadJson: string;
  payloadHref: string;
  receipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    payloadChecksum: string;
    generatedFrom: string[];
  };
  receiptHref: string;
  candidates: QuickA2ATrialCandidate[];
};

export function buildQuickWorkflowLiveBuyerCase(draft: WorkflowIntakeDraft, readiness: QuickWorkflowInputReadiness): QuickWorkflowLiveBuyerCase {
  const buyer = (draft.workOrder.targetUser || "Target buyer").replace(/[.:;]+$/, "");
  const workflow = draft.workOrder.request || "Workflow request still missing.";
  const manual = draft.pilotRun.observedManualMinutes || 0;
  const assisted = draft.pilotRun.observedAssistedMinutes || 0;
  const savedMinutes = Math.max(0, manual - assisted);
  const cyclesPerMonth = draft.buyerScenario.cyclesPerMonth || 0;
  const adoptionRatePercent = draft.buyerScenario.adoptionRatePercent || 0;
  const hourlyCostYen = draft.buyerScenario.hourlyCostYen || 0;
  const monthlyHours = savedMinutes && cyclesPerMonth && adoptionRatePercent ? (savedMinutes / 60) * cyclesPerMonth * (adoptionRatePercent / 100) : 0;
  const monthlyValueYen = monthlyHours && hourlyCostYen ? Math.round((monthlyHours * hourlyCostYen) / 1000) * 1000 : 0;
  const proofValues = publicProofValuesFor(draft);
  const scope = readiness.items.find((item) => item.id === "scope");
  const value = readiness.items.find((item) => item.id === "value-model");
  const proof = readiness.items.find((item) => item.id === "public-proof");
  const valueLine = monthlyValueYen
    ? `${formatYen(monthlyValueYen)}/mo`
    : savedMinutes
      ? `${savedMinutes}m saved/run`
      : value?.evidence || "Value proof pending";
  const proofLine =
    proofValues.length > 0 ? `${proofValues.length} proof URL${proofValues.length === 1 ? "" : "s"} captured` : "No public proof URL yet";
  const nextActionSentence = readiness.nextAction ? `${readiness.nextAction.charAt(0).toLowerCase()}${readiness.nextAction.slice(1)}` : "close the open proof gap.";
  const summary =
    readiness.status === "ready"
      ? "This note can become a buyer room. Preview it, verify proof, then apply."
      : readiness.status === "watch"
        ? `${buyer} has a reviewable case, but ${nextActionSentence}`
        : `Add the missing facts before ${buyer} sees this workflow.`;

  return {
    status: readiness.status,
    headline: `${buyer}: ${readiness.headline}`,
    summary,
    valueLine,
    proofLine,
    nextAction: readiness.nextAction,
    items: [
      {
        id: "buyer",
        label: "Buyer case",
        status: scope?.status ?? "blocked",
        value: buyer,
        detail: workflow
      },
      {
        id: "value",
        label: "Value proof",
        status: value?.status ?? "blocked",
        value: valueLine,
        detail: monthlyHours ? `${formatHours(monthlyHours)}h/month at extracted adoption.` : value?.evidence || "Add recurring volume and cost."
      },
      {
        id: "proof",
        label: "Proof path",
        status: proof?.status ?? "blocked",
        value: proofLine,
        detail: proof?.action || "Attach proof before external sharing."
      }
    ]
  };
}

export function buildQuickWorkflowValueDiagnosis(draft: WorkflowIntakeDraft, readiness: QuickWorkflowInputReadiness): QuickWorkflowValueDiagnosis {
  const manual = draft.pilotRun.observedManualMinutes || 0;
  const assisted = draft.pilotRun.observedAssistedMinutes || 0;
  const savedMinutes = Math.max(0, manual - assisted);
  const cyclesPerMonth = draft.buyerScenario.cyclesPerMonth || 0;
  const adoptionRatePercent = draft.buyerScenario.adoptionRatePercent || 0;
  const hourlyCostYen = draft.buyerScenario.hourlyCostYen || 0;
  const hasMeasuredValueInputs = savedMinutes > 0 && cyclesPerMonth > 0 && adoptionRatePercent > 0 && hourlyCostYen > 0;
  const measuredValue = monthlyValueFor({
    savedMinutes,
    cyclesPerMonth,
    adoptionRatePercent,
    hourlyCostYen,
    incidentRiskYenPerMonth: draft.buyerScenario.incidentRiskYenPerMonth || 0,
    riskCaptureRate: 0.22
  });
  const monthlyHoursSaved = Math.round(measuredValue.monthlyHoursSaved * 10) / 10;
  const monthlyValueYen = hasMeasuredValueInputs ? measuredValue.monthlyValueYen : 0;
  const buyerValueTargetYen = 250000;
  const adoptionRate = adoptionRatePercent > 0 ? adoptionRatePercent / 100 : 0;
  const incidentRiskYenPerMonth = draft.buyerScenario.incidentRiskYenPerMonth || 0;
  const riskContributionYen = incidentRiskYenPerMonth * 0.22 * adoptionRate;
  const requiredProductivityValueYen = Math.max(0, buyerValueTargetYen - riskContributionYen);
  const breakEvenSavedMinutes =
    cyclesPerMonth > 0 && adoptionRate > 0 && hourlyCostYen > 0
      ? Math.max(1, Math.ceil(((requiredProductivityValueYen / hourlyCostYen) * 60) / cyclesPerMonth / adoptionRate))
      : 0;
  const breakEvenCyclesAtFullAutomation =
    manual > 0 && adoptionRate > 0 && hourlyCostYen > 0
      ? Math.max(1, Math.ceil(requiredProductivityValueYen / ((manual / 60) * adoptionRate * hourlyCostYen)))
      : 0;
  const breakEvenCyclesAtCurrentSavings =
    savedMinutes > 0 && adoptionRate > 0 && hourlyCostYen > 0
      ? Math.max(1, Math.ceil(requiredProductivityValueYen / ((savedMinutes / 60) * adoptionRate * hourlyCostYen)))
      : 0;
  const adoptionValueAtFullAdoption = savedMinutes > 0 && cyclesPerMonth > 0 && hourlyCostYen > 0
    ? (savedMinutes / 60) * cyclesPerMonth * hourlyCostYen + incidentRiskYenPerMonth * 0.22
    : 0;
  const requiredAdoptionPercent = adoptionValueAtFullAdoption > 0 ? Math.max(1, Math.ceil((buyerValueTargetYen / adoptionValueAtFullAdoption) * 100)) : 0;
  const pilotBudgetCeilingYen = monthlyValueYen > 0 ? Math.max(1000, Math.round((monthlyValueYen * 0.5) / 1000) * 1000) : 0;
  const proofRepairPlan = buildProofRepairPlan(draft);
  const firstOpen = readiness.items.find((item) => item.status !== "ready");
  const valueStatus: QuickWorkflowInputReadinessStatus =
    !hasMeasuredValueInputs ? "blocked" : monthlyValueYen >= buyerValueTargetYen ? "ready" : monthlyValueYen > 0 ? "watch" : "blocked";
  const breakEvenStatus: QuickWorkflowInputReadinessStatus =
    !hasMeasuredValueInputs ? "blocked" : monthlyValueYen >= buyerValueTargetYen ? "ready" : "watch";
  const scopeFitStatus: QuickWorkflowInputReadinessStatus =
    !hasMeasuredValueInputs
      ? "blocked"
      : monthlyValueYen >= buyerValueTargetYen
        ? "ready"
        : breakEvenSavedMinutes > 0 && manual > 0 && breakEvenSavedMinutes <= manual
          ? "watch"
          : "blocked";
  const pilotBoundaryStatus: QuickWorkflowInputReadinessStatus =
    pilotBudgetCeilingYen <= 0 ? "blocked" : pilotBudgetCeilingYen >= 50000 ? "ready" : "watch";
  const proofStatus: QuickWorkflowInputReadinessStatus =
    proofRepairPlan.repairCount === 0 ? "ready" : proofRepairPlan.readyCount > 0 ? "watch" : "blocked";
  const scopeIsTooSmall = hasMeasuredValueInputs && monthlyValueYen > 0 && scopeFitStatus === "blocked";
  const status: QuickWorkflowInputReadinessStatus =
    valueStatus === "blocked" || readiness.status === "blocked" || scopeIsTooSmall
      ? "blocked"
      : valueStatus === "ready" && proofStatus === "ready" && readiness.status === "ready"
        ? "ready"
        : "watch";
  const headline =
    scopeIsTooSmall
      ? "Workflow is too small for a paid pilot"
      : status === "ready"
      ? "This workflow has a buyer-grade value case"
      : valueStatus === "watch" && scopeFitStatus === "watch"
        ? "Value needs stronger automation to clear the floor"
        : status === "watch"
        ? "Value is visible, but proof still gates sharing"
        : "Value case needs grounded input before a buyer sees it";
  const summary =
    scopeIsTooSmall
      ? `Even perfect automation cannot reach ${formatYen(buyerValueTargetYen)}/month at the current frequency and scope.`
      : hasMeasuredValueInputs && monthlyValueYen > 0
      ? `Measured run supports ${formatHours(monthlyHoursSaved)}h/month and ${formatYen(monthlyValueYen)}/month from extracted facts.`
      : savedMinutes > 0
        ? "Measured savings are present; add frequency, adoption, and cost before quoting buyer value."
        : "Add manual vs assisted minutes, frequency, adoption, and cost before this becomes a real value case.";
  const valueAction =
    scopeIsTooSmall
      ? breakEvenCyclesAtFullAutomation > 0
        ? `Broaden the workflow to about ${breakEvenCyclesAtFullAutomation} cycles/month or pick a larger manual run before collecting more proof.`
        : "Choose a higher-frequency or broader workflow before collecting more proof."
      : valueStatus === "watch" && scopeFitStatus === "watch"
        ? `Reduce assisted time to ${Math.max(0, manual - breakEvenSavedMinutes)}m/run or better, then rerun the pilot measurement.`
        : "";
  const nextAction =
    valueAction ||
    firstOpen?.action ||
    (proofRepairPlan.repairCount > 0 ? proofRepairPlan.items.find((item) => item.status !== "ready")?.action : "") ||
    "Preview the buyer room and run proof verification.";
  const automationSavedGapMinutes = Math.max(0, breakEvenSavedMinutes - savedMinutes);
  const automationTargetAssistedMinutes = breakEvenSavedMinutes > 0 && manual > 0 ? Math.max(0, manual - breakEvenSavedMinutes) : 0;
  const targetOutcomeFor = (input: { savedMinutes: number; cyclesPerMonth: number; adoptionRatePercent: number }) => {
    const outcome = monthlyValueFor({
      savedMinutes: input.savedMinutes,
      cyclesPerMonth: input.cyclesPerMonth,
      adoptionRatePercent: input.adoptionRatePercent,
      hourlyCostYen,
      incidentRiskYenPerMonth,
      riskCaptureRate: 0.22
    });
    const monthlyHoursSaved = Math.round(outcome.monthlyHoursSaved * 10) / 10;
    return {
      monthlyValueYen: outcome.monthlyValueYen,
      monthlyHoursSaved,
      label: `${formatYen(outcome.monthlyValueYen)}/month / ${formatHours(monthlyHoursSaved)}h/month`
    };
  };
  const automationTargetOutcome =
    automationTargetAssistedMinutes >= 0 && breakEvenSavedMinutes > 0 && cyclesPerMonth > 0 && adoptionRatePercent > 0 && hourlyCostYen > 0
      ? targetOutcomeFor({ savedMinutes: breakEvenSavedMinutes, cyclesPerMonth, adoptionRatePercent })
      : null;
  const scopeTargetOutcome =
    breakEvenCyclesAtCurrentSavings > 0 && savedMinutes > 0 && adoptionRatePercent > 0 && hourlyCostYen > 0
      ? targetOutcomeFor({ savedMinutes, cyclesPerMonth: breakEvenCyclesAtCurrentSavings, adoptionRatePercent })
      : null;
  const adoptionTargetOutcome =
    requiredAdoptionPercent > 0 && savedMinutes > 0 && cyclesPerMonth > 0 && hourlyCostYen > 0
      ? targetOutcomeFor({ savedMinutes, cyclesPerMonth, adoptionRatePercent: requiredAdoptionPercent })
      : null;
  const automationLeverStatus: QuickWorkflowInputReadinessStatus =
    !hasMeasuredValueInputs || breakEvenSavedMinutes <= 0 || manual <= 0
      ? "blocked"
      : monthlyValueYen >= buyerValueTargetYen
        ? "ready"
        : breakEvenSavedMinutes <= manual
          ? "watch"
          : "blocked";
  const scopeLeverStatus: QuickWorkflowInputReadinessStatus =
    !hasMeasuredValueInputs || breakEvenCyclesAtFullAutomation <= 0
      ? "blocked"
      : monthlyValueYen >= buyerValueTargetYen
        ? "ready"
        : "watch";
  const adoptionLeverStatus: QuickWorkflowInputReadinessStatus =
    !hasMeasuredValueInputs || requiredAdoptionPercent <= 0
      ? "blocked"
      : monthlyValueYen >= buyerValueTargetYen
        ? "ready"
        : requiredAdoptionPercent <= 100
          ? "watch"
          : "blocked";
  const levers: QuickWorkflowValueLever[] = [
    {
      id: "automation",
      label: "Automation lever",
      status: automationLeverStatus,
      value:
        automationLeverStatus === "ready"
          ? "Current run clears floor"
          : automationLeverStatus === "watch"
            ? `${automationTargetAssistedMinutes}m assisted target`
            : hasMeasuredValueInputs && manual > 0 && breakEvenSavedMinutes > manual
              ? "0m assisted is still short"
              : "Measured run missing",
      detail:
        automationLeverStatus === "ready"
          ? `Current ${savedMinutes}m saved/run already clears ${formatYen(buyerValueTargetYen)}/month.`
          : automationLeverStatus === "watch"
            ? `Save ${breakEvenSavedMinutes}m/run instead of ${savedMinutes}m/run; ${automationSavedGapMinutes}m/run more closes the value gap.`
            : hasMeasuredValueInputs && manual > 0 && breakEvenSavedMinutes > manual
              ? `Perfect automation saves ${manual}m/run, below the ${breakEvenSavedMinutes}m/run break-even.`
              : "Add measured manual and assisted minutes before tuning automation.",
      ...(automationLeverStatus === "watch"
        ? {
            targetField: "pilotAssistedMinutes" as const,
            targetValue: String(automationTargetAssistedMinutes),
            targetAction: `Use ${automationTargetAssistedMinutes}m assisted target`,
            targetEffect: `Closes ${automationSavedGapMinutes}m/run value gap at current volume.`,
            ...(automationTargetOutcome
              ? {
                  targetMonthlyValueYen: automationTargetOutcome.monthlyValueYen,
                  targetMonthlyHoursSaved: automationTargetOutcome.monthlyHoursSaved,
                  targetOutcome: automationTargetOutcome.label
                }
              : {})
          }
        : {})
    },
    {
      id: "scope",
      label: "Scope lever",
      status: scopeLeverStatus,
      value:
        scopeLeverStatus === "ready"
          ? `${cyclesPerMonth} cycles/month clears`
          : scopeIsTooSmall && breakEvenCyclesAtFullAutomation > 0
            ? `${breakEvenCyclesAtFullAutomation} cycles/month at full automation`
            : breakEvenCyclesAtCurrentSavings > 0
              ? `${breakEvenCyclesAtCurrentSavings} cycles/month target`
              : "Scope target unavailable",
      detail:
        scopeLeverStatus === "ready"
          ? `Current ${cyclesPerMonth} cycles/month clears with ${savedMinutes}m saved/run.`
          : scopeIsTooSmall && breakEvenCyclesAtFullAutomation > 0
            ? `Current savings would need ${breakEvenCyclesAtCurrentSavings} cycles/month; full automation lowers the target to ${breakEvenCyclesAtFullAutomation}.`
            : breakEvenCyclesAtCurrentSavings > 0
              ? `Broaden from ${cyclesPerMonth} to about ${breakEvenCyclesAtCurrentSavings} cycles/month at the current ${savedMinutes}m/run savings.`
              : "Add cycles/month, adoption, hourly cost, and measured savings before tuning scope.",
      ...(scopeLeverStatus === "watch" && breakEvenCyclesAtCurrentSavings > cyclesPerMonth
        ? {
            targetField: "cyclesPerMonth" as const,
            targetValue: String(breakEvenCyclesAtCurrentSavings),
            targetAction: `Use ${breakEvenCyclesAtCurrentSavings} cycles/month`,
            targetEffect: `Clears the floor at current ${savedMinutes}m/run savings.`,
            ...(scopeTargetOutcome
              ? {
                  targetMonthlyValueYen: scopeTargetOutcome.monthlyValueYen,
                  targetMonthlyHoursSaved: scopeTargetOutcome.monthlyHoursSaved,
                  targetOutcome: scopeTargetOutcome.label
                }
              : {})
          }
        : {})
    },
    {
      id: "adoption",
      label: "Adoption lever",
      status: adoptionLeverStatus,
      value:
        adoptionLeverStatus === "ready"
          ? `${adoptionRatePercent}% adoption clears`
          : requiredAdoptionPercent > 0
            ? `${requiredAdoptionPercent}% adoption ${requiredAdoptionPercent <= 100 ? "target" : "required"}`
            : "Adoption target unavailable",
      detail:
        adoptionLeverStatus === "ready"
          ? "Buyer value floor clears at the current adoption rate."
          : adoptionLeverStatus === "watch"
            ? `Increase adoption from ${adoptionRatePercent}% to about ${requiredAdoptionPercent}% if savings and volume stay flat.`
            : requiredAdoptionPercent > 100
              ? `Would need ${requiredAdoptionPercent}% adoption, so adoption alone cannot close this at current savings and volume.`
              : "Add adoption rate, measured savings, volume, and cost before tuning adoption.",
      ...(adoptionLeverStatus === "watch" && requiredAdoptionPercent > adoptionRatePercent && requiredAdoptionPercent <= 100
        ? {
            targetField: "adoptionRatePercent" as const,
            targetValue: String(requiredAdoptionPercent),
            targetAction: `Use ${requiredAdoptionPercent}% adoption target`,
            targetEffect: `Closes the value gap without changing run time or monthly volume.`,
            ...(adoptionTargetOutcome
              ? {
                  targetMonthlyValueYen: adoptionTargetOutcome.monthlyValueYen,
                  targetMonthlyHoursSaved: adoptionTargetOutcome.monthlyHoursSaved,
                  targetOutcome: adoptionTargetOutcome.label
                }
              : {})
          }
        : {})
    }
  ];
  const items: QuickWorkflowValueDiagnosisItem[] = [
    {
      id: "measured-value",
      label: "Measured value",
      status: valueStatus,
      value: monthlyValueYen > 0 ? `${formatYen(monthlyValueYen)}/month` : "Not defensible yet",
      detail: hasMeasuredValueInputs
        ? `${savedMinutes}m saved/run x ${cyclesPerMonth} cycles/month x ${adoptionRatePercent}% adoption.`
        : "Needs measured savings, cycles/month, adoption rate, and hourly cost."
    },
    {
      id: "break-even",
      label: "Break-even",
      status: breakEvenStatus,
      value:
        breakEvenStatus === "ready"
          ? `Clears ${formatYen(buyerValueTargetYen)}/month`
          : breakEvenSavedMinutes > 0
            ? `${breakEvenSavedMinutes}m/run target`
            : "Target unavailable",
      detail:
        breakEvenStatus === "ready"
          ? `${formatYen(monthlyValueYen)}/month is above the buyer-value floor.`
          : breakEvenSavedMinutes > 0
            ? `Current ${savedMinutes}m/run must reach about ${breakEvenSavedMinutes}m/run at ${cyclesPerMonth} cycles/month and ${adoptionRatePercent}% adoption.`
            : "Add cycles/month, adoption rate, hourly cost, and measured savings to calculate the target."
    },
    {
      id: "scope-fit",
      label: "Scope fit",
      status: scopeFitStatus,
      value:
        scopeFitStatus === "ready"
          ? "Paid pilot scope"
          : scopeFitStatus === "watch"
            ? "Automation can close it"
            : hasMeasuredValueInputs && breakEvenSavedMinutes > manual && manual > 0
              ? "Scope too small"
              : "Scope unknown",
      detail:
        scopeFitStatus === "ready"
          ? "The current workflow already clears the buyer-value floor."
          : scopeFitStatus === "watch"
            ? `Reduce assisted time to ${Math.max(0, manual - breakEvenSavedMinutes)}m/run or better to clear the floor.`
            : hasMeasuredValueInputs && breakEvenSavedMinutes > manual && manual > 0
              ? `Break-even needs ${breakEvenSavedMinutes}m saved/run, but the whole manual run is ${manual}m. Broaden to about ${breakEvenCyclesAtFullAutomation} cycles/month at full automation.`
              : "Add manual run length, frequency, adoption, and cost before judging scope fit."
    },
    {
      id: "pilot-boundary",
      label: "Pilot boundary",
      status: pilotBoundaryStatus,
      value: pilotBudgetCeilingYen > 0 ? `${formatYen(pilotBudgetCeilingYen)} cap` : "No cap yet",
      detail:
        pilotBoundaryStatus === "ready"
          ? "Keep the first paid pilot under half of one month of measured value."
          : pilotBudgetCeilingYen > 0
            ? "Measured value only supports a tiny cap; keep this unpaid or improve the workflow economics."
            : "Compute the cap only after measured monthly value exists."
    },
    {
      id: "proof-gap",
      label: "Proof gap",
      status: proofStatus,
      value: proofReadinessLine(proofRepairPlan),
      detail:
        proofRepairPlan.repairCount === 0
          ? "Buyer can inspect the proof packet after live verification."
          : `${proofRepairPlan.repairCount} proof item${proofRepairPlan.repairCount === 1 ? "" : "s"} still block external sharing.`
    },
    {
      id: "next-fix",
      label: "Next fix",
      status: valueAction ? scopeFitStatus : firstOpen ? firstOpen.status : proofStatus,
      value: valueAction ? "Scope fit" : firstOpen?.label || (proofRepairPlan.repairCount > 0 ? "Proof repair" : "Ready for preview"),
      detail: nextAction
    }
  ];
  const exportMarkdown = [
    "# Quick workflow value diagnosis",
    "",
    headline,
    summary,
    `Status: ${status}`,
    `Measured monthly value: ${monthlyValueYen > 0 ? `${formatYen(monthlyValueYen)}/month` : "missing"}`,
    `Measured monthly hours: ${monthlyHoursSaved > 0 ? `${formatHours(monthlyHoursSaved)}h` : "missing"}`,
    `Break-even target: ${breakEvenSavedMinutes > 0 ? `${breakEvenSavedMinutes}m saved/run for ${formatYen(buyerValueTargetYen)}/month` : "missing"}`,
    `Scope fit: ${items.find((item) => item.id === "scope-fit")?.detail ?? "missing"}`,
    `Pilot cap: ${pilotBudgetCeilingYen > 0 ? formatYen(pilotBudgetCeilingYen) : "missing"}`,
    `Proof readiness: ${proofReadinessLine(proofRepairPlan)}`,
    `Next action: ${nextAction}`,
    "",
    "## Signals",
    ...items.map((item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.detail}`),
    "",
    "## Value levers",
    ...levers.map((lever) => `- [${lever.status}] ${lever.label}: ${lever.value}. ${lever.detail}${lever.targetOutcome ? ` Target outcome: ${lever.targetOutcome}.` : ""}`)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    monthlyValueYen,
    monthlyHoursSaved,
    pilotBudgetCeilingYen,
    proofReadyCount: proofRepairPlan.readyCount,
    proofRepairCount: proofRepairPlan.repairCount,
    nextAction,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    items,
    levers
  };
}

function suggestedQuickPilotPrice(monthlyValueYen: number, pilotBudgetCeilingYen: number) {
  if (monthlyValueYen <= 0 || pilotBudgetCeilingYen <= 0) return 0;
  const valueAnchoredPrice = Math.round((monthlyValueYen * 0.35) / 1000) * 1000;
  return Math.min(pilotBudgetCeilingYen, Math.max(50000, valueAnchoredPrice));
}

function quickPilotPaybackDays(priceYen: number, monthlyValueYen: number) {
  if (priceYen <= 0 || monthlyValueYen <= 0) return 999;
  return Math.ceil((priceYen / monthlyValueYen) * 30);
}

function quickPilotPaybackStatus(paybackDays: number): QuickWorkflowInputReadinessStatus {
  if (paybackDays <= 30) return "ready";
  if (paybackDays <= 45) return "watch";
  return "blocked";
}

function quickWorkflowStatusScore(status: QuickWorkflowInputReadinessStatus) {
  if (status === "ready") return 100;
  if (status === "watch") return 62;
  return 18;
}

export function buildQuickWorkflowCommercialPilotOffer(
  draft: WorkflowIntakeDraft,
  readiness: QuickWorkflowInputReadiness,
  valueDiagnosis: QuickWorkflowValueDiagnosis
): QuickWorkflowCommercialPilotOffer {
  const buyerValueFloorYen = 250000;
  const proofRepairPlan = buildProofRepairPlan(draft);
  const hasMeasuredValue = valueDiagnosis.monthlyValueYen > 0;
  const clearsValueFloor = valueDiagnosis.monthlyValueYen >= buyerValueFloorYen && valueDiagnosis.status !== "blocked";
  const proofComplete = valueDiagnosis.proofReadyCount >= 5 && valueDiagnosis.proofRepairCount === 0;
  const canPrice = hasMeasuredValue && clearsValueFloor;
  const suggestedPilotPriceYen = canPrice ? suggestedQuickPilotPrice(valueDiagnosis.monthlyValueYen, valueDiagnosis.pilotBudgetCeilingYen) : 0;
  const basePaybackDays = quickPilotPaybackDays(suggestedPilotPriceYen, valueDiagnosis.monthlyValueYen);
  const downsideMonthlyValueYen = valueDiagnosis.monthlyValueYen > 0 ? Math.round((valueDiagnosis.monthlyValueYen * 0.5) / 1000) * 1000 : 0;
  const downsidePaybackDays = quickPilotPaybackDays(suggestedPilotPriceYen, downsideMonthlyValueYen);
  const basePaybackStatus = suggestedPilotPriceYen > 0 ? quickPilotPaybackStatus(basePaybackDays) : "blocked";
  const downsideStatus = suggestedPilotPriceYen > 0 ? quickPilotPaybackStatus(downsidePaybackDays) : "blocked";
  const approvalFloorStatus: QuickWorkflowInputReadinessStatus =
    suggestedPilotPriceYen <= 0 ? "blocked" : valueDiagnosis.monthlyValueYen >= suggestedPilotPriceYen * 2 ? "ready" : valueDiagnosis.monthlyValueYen >= suggestedPilotPriceYen ? "watch" : "blocked";
  const status: QuickWorkflowInputReadinessStatus =
    !canPrice || suggestedPilotPriceYen <= 0
      ? "blocked"
      : proofComplete && readiness.status === "ready"
        ? "ready"
        : "watch";
  const proofOfferStatus: QuickWorkflowInputReadinessStatus =
    proofComplete ? "ready" : valueDiagnosis.proofReadyCount > 0 ? "watch" : "blocked";
  const firstOpenInput = readiness.items.find((item) => item.status !== "ready");
  const proofBlocker =
    valueDiagnosis.proofRepairCount > 0
      ? `${valueDiagnosis.proofRepairCount} public proof repair item${valueDiagnosis.proofRepairCount === 1 ? "" : "s"} remain.`
      : "";
  const decision =
    status === "ready"
      ? "Quote a bounded paid pilot"
      : suggestedPilotPriceYen > 0
        ? "Draft the offer; hold buyer send"
        : "Do not quote a paid pilot";
  const headline =
    status === "ready"
      ? "Ready to quote a bounded paid pilot"
      : suggestedPilotPriceYen > 0
        ? "Price is defensible, but proof gates buyer send"
        : hasMeasuredValue
          ? "Keep this unpaid until the value case changes"
          : "Do not price this workflow yet";
  const summary =
    status === "ready"
      ? `${formatYen(suggestedPilotPriceYen)} is under the ${formatYen(valueDiagnosis.pilotBudgetCeilingYen)} cap and backed by complete public proof.`
      : suggestedPilotPriceYen > 0
        ? `${formatYen(suggestedPilotPriceYen)} can be drafted internally, but buyer send waits for ${proofBlocker || firstOpenInput?.label || "readiness repair"}.`
        : hasMeasuredValue
          ? `${formatYen(valueDiagnosis.monthlyValueYen)}/month does not justify a paid pilot against the ${formatYen(buyerValueFloorYen)}/month floor.`
          : "Measured minutes, monthly volume, adoption, and hourly cost must exist before any price is defensible.";
  const priceLine = suggestedPilotPriceYen > 0 ? `${formatYen(suggestedPilotPriceYen)} for a 14-day proof pilot` : "No paid price yet";
  const guardrail =
    suggestedPilotPriceYen > 0
      ? `Never exceed ${formatYen(valueDiagnosis.pilotBudgetCeilingYen)} before buyer accepts measured value.`
      : "Keep the workflow in discovery until measured value clears the paid-pilot floor.";
  const sendRule =
    status === "ready"
      ? "Can send after a live proof verification receipt is attached."
      : suggestedPilotPriceYen > 0
        ? `Do not send externally until ${proofBlocker || firstOpenInput?.action || valueDiagnosis.nextAction}`
        : valueDiagnosis.nextAction;
  const successMetric = (draft.workOrder.successMetric || "the named success metric").replace(/[.!?]+$/, "");
  const acceptance =
    suggestedPilotPriceYen > 0
      ? `Buyer accepts only when the pilot receipt proves the success metric: ${successMetric}.`
      : "No paid acceptance condition until the workflow clears the value floor.";
  const owner = suggestedPilotPriceYen > 0 ? "Finance owner + pilot sponsor" : "Workflow owner";
  const nextAction =
    status === "ready"
      ? "Run live proof verification, then attach this offer to the buyer room."
      : suggestedPilotPriceYen > 0
        ? sendRule
        : valueDiagnosis.nextAction;
  const terms: QuickWorkflowCommercialPilotOfferTerm[] = [
    {
      id: "price",
      label: "Pilot price",
      status,
      value: priceLine,
      detail:
        suggestedPilotPriceYen > 0
          ? `Anchored at 35% of measured monthly value: ${formatYen(valueDiagnosis.monthlyValueYen)}/month.`
          : "No non-zero price until measured value clears the buyer floor."
    },
    {
      id: "cap",
      label: "Spend cap",
      status: valueDiagnosis.pilotBudgetCeilingYen >= 50000 ? "ready" : valueDiagnosis.pilotBudgetCeilingYen > 0 ? "watch" : "blocked",
      value: valueDiagnosis.pilotBudgetCeilingYen > 0 ? formatYen(valueDiagnosis.pilotBudgetCeilingYen) : "Missing",
      detail: guardrail
    },
    {
      id: "send-rule",
      label: "Buyer send",
      status,
      value: status === "ready" ? "Allowed after live proof" : "Hold internally",
      detail: sendRule
    },
    {
      id: "acceptance",
      label: "Acceptance",
      status: suggestedPilotPriceYen > 0 ? "ready" : "blocked",
      value: suggestedPilotPriceYen > 0 ? "Proof receipt + stop rule" : "Not available",
      detail: acceptance
    }
  ];
  const stressCases: QuickWorkflowCommercialPilotOfferStressCase[] = [
    {
      id: "base-payback",
      label: "Base payback",
      status: basePaybackStatus,
      value: suggestedPilotPriceYen > 0 ? `${basePaybackDays} days` : "No price",
      detail:
        suggestedPilotPriceYen > 0
          ? `${priceLine} pays back against ${formatYen(valueDiagnosis.monthlyValueYen)}/month measured value.`
          : "Payback cannot be tested without a paid pilot price.",
      buyerDecision:
        basePaybackStatus === "ready"
          ? "Price clears a 30-day buyer payback check."
          : basePaybackStatus === "watch"
            ? "Buyer can review only with a tighter stop rule."
            : "Do not ask for budget until value or price changes."
    },
    {
      id: "downside-value",
      label: "Downside value",
      status: downsideStatus,
      value: suggestedPilotPriceYen > 0 ? `${downsidePaybackDays} days` : "No price",
      detail:
        suggestedPilotPriceYen > 0
          ? `If adoption or realized value halves to ${formatYen(downsideMonthlyValueYen)}/month, payback is ${downsidePaybackDays} days.`
          : "Downside value cannot be tested without a paid pilot price.",
      buyerDecision:
        downsideStatus === "ready"
          ? "Downside case still supports a paid pilot."
          : downsideStatus === "watch"
            ? "Reduce price or require sponsor acceptance before sending."
            : "Hold procurement; downside economics fail."
    },
    {
      id: "approval-floor",
      label: "Approval floor",
      status: approvalFloorStatus,
      value: suggestedPilotPriceYen > 0 ? `${formatYen(suggestedPilotPriceYen)}/month floor` : "Missing",
      detail:
        suggestedPilotPriceYen > 0
          ? `Buyer must see at least ${formatYen(suggestedPilotPriceYen)}/month realized value for a 30-day payback.`
          : "A monthly approval floor appears only after the workflow earns a paid price.",
      buyerDecision:
        approvalFloorStatus === "ready"
          ? "Approval floor is far below measured value."
          : approvalFloorStatus === "watch"
            ? "Approval floor is close; require a narrow pilot scope."
            : "Approval floor is not credible yet."
    }
  ];
  const objections: QuickWorkflowCommercialPilotOfferObjection[] = [
    {
      id: "price-defense",
      status: basePaybackStatus,
      question: "Why is this price defensible?",
      answer:
        suggestedPilotPriceYen > 0
          ? `${priceLine} is capped below half of one measured value month and pays back in ${basePaybackDays} days.`
          : "There is no defensible paid price yet.",
      evidence:
        suggestedPilotPriceYen > 0
          ? `Measured value ${formatYen(valueDiagnosis.monthlyValueYen)}/month; cap ${formatYen(valueDiagnosis.pilotBudgetCeilingYen)}.`
          : "Measured value must clear the paid-pilot floor first."
    },
    {
      id: "proof-trust",
      status: proofOfferStatus,
      question: "Can the buyer trust the proof?",
      answer:
        proofOfferStatus === "ready"
          ? "Yes, after the live verifier issues the buyer-send receipt."
          : "Not externally; keep the offer internal until the proof repair queue closes.",
      evidence: proofOfferStatus === "ready" ? "5/5 public proof URLs are attached." : proofReadinessLine(proofRepairPlan)
    },
    {
      id: "stop-rule",
      status: suggestedPilotPriceYen > 0 ? "ready" : "blocked",
      question: "What protects the buyer if the pilot underperforms?",
      answer:
        suggestedPilotPriceYen > 0
          ? "Stop before expansion if live proof fails, the pilot receipt misses the success metric, or realized value drops below the approval floor."
          : "No paid stop rule is available until the workflow has a real price.",
      evidence: suggestedPilotPriceYen > 0 ? `Approval floor: ${formatYen(suggestedPilotPriceYen)}/month realized value.` : valueDiagnosis.nextAction
    }
  ];
  const approvalScoreSignals = [
    quickWorkflowStatusScore(status),
    quickWorkflowStatusScore(basePaybackStatus),
    quickWorkflowStatusScore(downsideStatus),
    quickWorkflowStatusScore(approvalFloorStatus),
    quickWorkflowStatusScore(proofOfferStatus)
  ];
  const approvalScore = Math.round(approvalScoreSignals.reduce((sum, score) => sum + score, 0) / approvalScoreSignals.length);
  const approvalDecision: QuickWorkflowCommercialPilotOfferApprovalMemo["decision"] =
    suggestedPilotPriceYen <= 0 ? "hold" : status === "ready" && downsideStatus === "ready" && proofOfferStatus === "ready" ? "approve" : "revise";
  const approvalRedlines = [
    ...(suggestedPilotPriceYen <= 0 ? ["Add enough measured buyer value before pricing the workflow."] : []),
    ...(proofOfferStatus !== "ready" ? ["Attach all five public proof URLs and a live verification receipt before buyer send."] : []),
    ...(downsideStatus !== "ready" ? [`Repair downside economics; half-value payback is ${downsidePaybackDays} days.`] : []),
    ...(approvalFloorStatus === "blocked" ? ["Lower the price or raise measured value until the approval floor is credible."] : [])
  ];
  const approvalMemo: QuickWorkflowCommercialPilotOfferApprovalMemo = {
    status: approvalDecision === "approve" ? "ready" : approvalDecision === "revise" ? "watch" : "blocked",
    score: approvalScore,
    decision: approvalDecision,
    signer: owner,
    summary:
      approvalDecision === "approve"
        ? `${owner} can approve the bounded pilot after live proof verification.`
        : approvalDecision === "revise"
          ? `${owner} should keep this internal until ${approvalRedlines[0] ?? "the open redline closes"}.`
          : "Do not route this to procurement until value and price are defensible.",
    sendLine:
      approvalDecision === "approve"
        ? `Approve ${priceLine} with ${formatYen(valueDiagnosis.pilotBudgetCeilingYen)} cap and receipt-based acceptance.`
        : approvalDecision === "revise"
          ? `Revise before buyer send: ${approvalRedlines[0] ?? nextAction}`
          : `Hold procurement: ${nextAction}`,
    redlines: approvalRedlines.length > 0 ? approvalRedlines : ["No commercial redlines before live proof verification."]
  };
  const buyer = (draft.workOrder.targetUser || "Target buyer").replace(/[.:;]+$/, "");
  const workflow = (draft.workOrder.request || "the workflow").replace(/[.!?]+$/, "");
  const pilotReceipt = proofRepairPlan.items.find((item) => item.id === "pilotEvidenceUrl");
  const workOrderProof = proofRepairPlan.items.find((item) => item.id === "workOrderEvidenceUrl");
  const agentTrust = readiness.items.find((item) => item.id === "agent-trust");
  const packetMode: QuickWorkflowCommercialDecisionPacket["mode"] =
    approvalMemo.decision === "approve" ? "buyer-ready" : approvalMemo.decision === "revise" ? "internal-redline" : "hold";
  const packetStatus: QuickWorkflowInputReadinessStatus =
    packetMode === "buyer-ready" ? "ready" : packetMode === "internal-redline" ? "watch" : "blocked";
  const packetHeadline =
    packetMode === "buyer-ready"
      ? "Buyer decision packet is ready"
      : packetMode === "internal-redline"
        ? "Decision packet stays internal until redlines close"
        : "Decision packet is a hold notice";
  const packetSubject =
    packetMode === "buyer-ready"
      ? `Approval request: ${priceLine} for ${buyer}`
      : packetMode === "internal-redline"
        ? `Internal redline: repair proof before ${priceLine}`
        : `Hold paid pilot: ${buyer} workflow is not priced`;
  const meetingGoal =
    packetMode === "buyer-ready"
      ? "Get a yes/no decision on the bounded proof pilot."
      : packetMode === "internal-redline"
        ? "Close redlines before a buyer-facing review."
        : "Agree the next value repair before any commercial ask.";
  const decisionAsk =
    packetMode === "buyer-ready"
      ? `${buyer} approves ${priceLine} with ${formatYen(valueDiagnosis.pilotBudgetCeilingYen)} cap, proof receipt acceptance, and no expansion without realized value.`
      : packetMode === "internal-redline"
        ? approvalMemo.sendLine
        : `Hold procurement and complete: ${nextAction}`;
  const packetSendRule =
    packetMode === "buyer-ready"
      ? "Send after attaching the live proof verification receipt."
      : packetMode === "internal-redline"
        ? `Do not send externally. ${approvalMemo.redlines[0] ?? sendRule}`
        : `Do not send as an offer. ${nextAction}`;
  const agenda = [
    `Confirm workflow: ${workflow}.`,
    `Review economics: ${priceLine}; measured value ${valueDiagnosis.monthlyValueYen > 0 ? `${formatYen(valueDiagnosis.monthlyValueYen)}/month` : "missing"}.`,
    `Verify proof: ${proofReadinessLine(proofRepairPlan)}.`,
    `Approve stop rule: ${acceptance}`,
    decisionAsk
  ];
  const attachments: QuickWorkflowCommercialDecisionPacketAttachment[] = [
    {
      id: "offer",
      label: "Commercial offer",
      status: suggestedPilotPriceYen > 0 ? "ready" : "blocked",
      value: suggestedPilotPriceYen > 0 ? priceLine : "No paid offer",
      action: suggestedPilotPriceYen > 0 ? "Attach exported offer markdown." : "Repair value before attaching a paid offer."
    },
    {
      id: "public-proof",
      label: "Public proof packet",
      status: proofOfferStatus,
      value: proofReadinessLine(proofRepairPlan),
      action: proofOfferStatus === "ready" ? "Attach live verification receipt." : proofRepairPlan.summary
    },
    {
      id: "pilot-receipt",
      label: "Pilot receipt",
      status: pilotReceipt?.status ?? "blocked",
      value: pilotReceipt?.value ?? "Missing",
      action: pilotReceipt?.action ?? "Attach pilot receipt as a public HTTPS URL."
    },
    {
      id: "work-order-proof",
      label: "Work order proof",
      status: workOrderProof?.status ?? "blocked",
      value: workOrderProof?.value ?? "Missing",
      action: workOrderProof?.action ?? "Attach work order proof as a public HTTPS URL."
    },
    {
      id: "a2a-trial",
      label: "A2A trial receipt",
      status: agentTrust?.status ?? "blocked",
      value: agentTrust?.evidence ?? "Missing",
      action: agentTrust?.action ?? "Attach accepted A2A trial receipt with skill, score, and HTTPS artifact."
    }
  ];
  const body = [
    `Hi ${buyer},`,
    "",
    packetMode === "buyer-ready"
      ? `Requesting approval for ${priceLine}. The offer stays under the ${formatYen(valueDiagnosis.pilotBudgetCeilingYen)} cap and pays back in ${basePaybackDays} days against measured value.`
      : packetMode === "internal-redline"
        ? `This is not ready for buyer send. ${approvalMemo.redlines[0] ?? sendRule}`
        : `We should hold the paid pilot for now. ${nextAction}`,
    "",
    `Decision ask: ${decisionAsk}`,
    `Meeting goal: ${meetingGoal}`,
    `Send rule: ${packetSendRule}`,
    "",
    "Attachments to review:",
    ...attachments.map((attachment) => `- [${attachment.status}] ${attachment.label}: ${attachment.value}. ${attachment.action}`),
    "",
    "Agenda:",
    ...agenda.map((item, index) => `${index + 1}. ${item}`)
  ].join("\n");
  const decisionPacketExportMarkdown = [
    "# Quick workflow buyer decision packet",
    "",
    packetHeadline,
    `Status: ${packetStatus}`,
    `Mode: ${packetMode}`,
    `Subject: ${packetSubject}`,
    `Decision ask: ${decisionAsk}`,
    `Meeting goal: ${meetingGoal}`,
    `Send rule: ${packetSendRule}`,
    "",
    "## Message",
    body,
    "",
    "## Attachments",
    ...attachments.map((attachment) => `- [${attachment.status}] ${attachment.label}: ${attachment.value}. ${attachment.action}`),
    "",
    "## Agenda",
    ...agenda.map((item, index) => `${index + 1}. ${item}`)
  ].join("\n");
  const decisionPacket: QuickWorkflowCommercialDecisionPacket = {
    status: packetStatus,
    mode: packetMode,
    headline: packetHeadline,
    subject: packetSubject,
    body,
    meetingGoal,
    decisionAsk,
    sendRule: packetSendRule,
    agenda,
    attachments,
    exportMarkdown: decisionPacketExportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(decisionPacketExportMarkdown)}`
  };
  const exportMarkdown = [
    "# Quick workflow commercial pilot offer",
    "",
    headline,
    summary,
    `Status: ${status}`,
    `Decision: ${decision}`,
    `Pilot price: ${priceLine}`,
    `Pilot cap: ${valueDiagnosis.pilotBudgetCeilingYen > 0 ? formatYen(valueDiagnosis.pilotBudgetCeilingYen) : "missing"}`,
    `Measured value: ${valueDiagnosis.monthlyValueYen > 0 ? `${formatYen(valueDiagnosis.monthlyValueYen)}/month` : "missing"}`,
    `Buyer send rule: ${sendRule}`,
    `Acceptance: ${acceptance}`,
    `Owner: ${owner}`,
    `Next action: ${nextAction}`,
    `Approval memo: ${approvalMemo.decision} / ${approvalMemo.score}/100`,
    `Approval send line: ${approvalMemo.sendLine}`,
    `Decision packet: ${decisionPacket.mode} / ${decisionPacket.subject}`,
    "",
    "## Terms",
    ...terms.map((term) => `- [${term.status}] ${term.label}: ${term.value}. ${term.detail}`),
    "",
    "## Stress cases",
    ...stressCases.map((stressCase) => `- [${stressCase.status}] ${stressCase.label}: ${stressCase.value}. ${stressCase.detail} Decision: ${stressCase.buyerDecision}`),
    "",
    "## Buyer objections",
    ...objections.map((objection) => `- [${objection.status}] ${objection.question} ${objection.answer} Evidence: ${objection.evidence}`),
    "",
    "## Approval redlines",
    ...approvalMemo.redlines.map((redline) => `- ${redline}`),
    "",
    "## Decision packet",
    decisionPacket.body
  ].join("\n");

  return {
    status,
    headline,
    summary,
    decision,
    suggestedPilotPriceYen,
    pilotBudgetCeilingYen: valueDiagnosis.pilotBudgetCeilingYen,
    priceLine,
    guardrail,
    sendRule,
    acceptance,
    owner,
    nextAction,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    terms,
    stressCases,
    objections,
    approvalMemo,
    decisionPacket
  };
}

function workflowTrialText(draft: WorkflowIntakeDraft, raw = "") {
  return [
    raw,
    draft.workOrder.targetUser,
    draft.workOrder.request,
    draft.workOrder.currentBaseline,
    draft.workOrder.successMetric,
    draft.workOrder.dataSensitivity,
    draft.pilotRun.notes,
    publicProofValuesFor(draft).join(" ")
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

function workflowTrialFocusBonus(agent: MarketAgent, trialText: string) {
  let bonus = 0;
  const cloudRelease = /(cloud run|deploy|deployment|release|rollout|ci|log|sre|health)/i.test(trialText);
  if (cloudRelease) {
    bonus += agent.capabilities.cloudRun * 0.24 + agent.capabilities.observability * 0.12;
    if (agent.stage === "deploy") bonus += 16;
    if (agent.id === "cloud-run-sre") bonus += 12;
  }
  if (/(security|secret|credential|vulnerability|risk|restricted|sign-off|approval)/i.test(trialText)) {
    bonus += agent.capabilities.security * 0.24;
  }
  if (/(proof|evidence|receipt|agent card|a2a|handoff|acceptance)/i.test(trialText)) {
    bonus += agent.capabilities.a2a * 0.16 + agent.capabilities.mcp * 0.1;
  }
  if (/(test|quality|regression|verify|verification)/i.test(trialText)) {
    bonus += agent.capabilities.testing * 0.16;
  }
  if (/(support|escalation|customer|zendesk|operator|triage)/i.test(trialText)) {
    bonus += agent.capabilities.autonomy * 0.1 + agent.capabilities.ux * 0.08 + agent.capabilities.planning * 0.08;
  }
  return Math.round(bonus);
}

function workflowTrialSkillId(agent: MarketAgent, trialText: string) {
  const skillIds = agent.a2aSkillIds;
  const preferred = [
    /(proof|evidence|receipt)/i.test(trialText) ? skillIds.find((skillId) => /(evidence|monitor|verify|receipt|audit)/i.test(skillId)) : "",
    /(cloud run|deploy|release|rollout)/i.test(trialText) ? skillIds.find((skillId) => /(cloudrun|deploy|release|observe)/i.test(skillId)) : "",
    /(security|secret|credential|restricted)/i.test(trialText) ? skillIds.find((skillId) => /(security|policy|trust|guard)/i.test(skillId)) : "",
    /(test|quality|regression|verify)/i.test(trialText) ? skillIds.find((skillId) => /(test|verify|quality)/i.test(skillId)) : "",
    skillIds[0]
  ].find((skillId): skillId is string => Boolean(skillId));
  return preferred || "task.delegate";
}

function workflowTrialSkillLabel(agent: MarketAgent, skillId: string) {
  const token = skillId.split(".").at(-1)?.replace(/[-_]/g, " ").toLowerCase() ?? "";
  return agent.skills.find((skill) => {
    const haystack = `${skill.id} ${skill.label} ${skill.proof}`.toLowerCase();
    return token.split(/\s+/).some((part) => part && haystack.includes(part));
  })?.label ?? skillId;
}

function workflowTrialReason(agent: MarketAgent, fit: AgentFit, trialScore: number, trialText: string) {
  const focus = [
    /(cloud run|deploy|release|rollout|ci|log|health)/i.test(trialText) ? `Cloud Run ${agent.capabilities.cloudRun}` : "",
    /(proof|evidence|receipt|a2a|agent card)/i.test(trialText) ? `A2A ${agent.capabilities.a2a}` : "",
    /(security|secret|credential|restricted)/i.test(trialText) ? `security ${agent.capabilities.security}` : "",
    /(test|quality|verify)/i.test(trialText) ? `testing ${agent.capabilities.testing}` : ""
  ].filter(Boolean);
  const focusLine = focus.length > 0 ? focus.slice(0, 2).join(" / ") : `catalog fit ${fit.valueScore}`;
  return `${focusLine}; trial score ${trialScore}.`;
}

function buildQuickA2ATrialAcceptanceCriteria(draft: WorkflowIntakeDraft) {
  const successMetric = draft.workOrder.successMetric?.trim();
  const workflow = draft.workOrder.request?.trim();
  return [
    successMetric ? `Show whether the run can satisfy: ${successMetric}` : "State the measurable success condition before claiming the run is accepted.",
    workflow ? `Return a buyer-safe artifact for: ${workflow}` : "Return a buyer-safe artifact for the bounded workflow.",
    "Report manual minutes, assisted minutes, accepted tasks, reviewer, and stop rule.",
    "Use public-safe or redacted data only. Do not request secrets, credentials, or private customer data."
  ];
}

export function buildQuickA2ATrialStarter(draft: WorkflowIntakeDraft, readiness: QuickWorkflowInputReadiness, raw = ""): QuickA2ATrialStarter {
  const trialText = workflowTrialText(draft, raw);
  const ranked = rankAgents(trialText || raw || draft.summary)
    .slice(0, 7)
    .map((fit) => {
      const skillId = workflowTrialSkillId(fit.agent, trialText);
      const trialScore = Math.min(96, Math.max(0, Math.round(fit.valueScore * 0.55 + workflowTrialFocusBonus(fit.agent, trialText) * 0.35)));
      return {
        fit,
        candidate: {
          agentId: fit.agent.id,
          name: fit.agent.name,
          handle: fit.agent.handle,
          fitScore: fit.valueScore,
          trialScore,
          skillId,
          skillLabel: workflowTrialSkillLabel(fit.agent, skillId),
          reason: workflowTrialReason(fit.agent, fit, trialScore, trialText),
          proof: fit.agent.skills[0]?.proof ?? fit.agent.outcome,
          href: "#agent-card-intake"
        } satisfies QuickA2ATrialCandidate
      };
    })
    .sort((a, b) => b.candidate.trialScore - a.candidate.trialScore);
  const candidates = ranked.slice(0, 3).map((item) => item.candidate);
  const recommended =
    candidates[0] ??
    ({
      agentId: "market-broker",
      name: "A2A Market Broker",
      handle: "market broker",
      fitScore: 0,
      trialScore: 0,
      skillId: "task.delegate",
      skillLabel: "task.delegate",
      reason: "No marketplace candidate could be scored from the current workflow.",
      proof: "Attach a valid Agent Card before trial.",
      href: "#agent-card-intake"
    } satisfies QuickA2ATrialCandidate);
  const hasAcceptedTrial = hasBuyerFacingAgentTrial(draft);
  const hasWorkflow = Boolean(draft.workOrder.request?.trim() && draft.workOrder.targetUser?.trim());
  const status: QuickWorkflowInputReadinessStatus = hasAcceptedTrial ? "ready" : hasWorkflow ? "watch" : "blocked";
  const buyer = draft.workOrder.targetUser?.trim().replace(/[.:;]+$/, "") || "Target buyer";
  const workflow = draft.workOrder.request?.trim() || "Bounded workflow is missing.";
  const acceptanceCriteria = buildQuickA2ATrialAcceptanceCriteria(draft);
  const payload = {
    protocol: "a2a.message/send",
    source: "quick-workflow-intake",
    agentId: recommended.agentId,
    agentName: recommended.name,
    method: "message/send",
    skillId: recommended.skillId,
    buyer,
    workflow,
    successMetric: draft.workOrder.successMetric || "Measure the buyer-visible success condition before approval.",
    dataBoundary: draft.workOrder.dataSensitivity || "public-safe redacted evidence required",
    proofLinks: publicProofValuesFor(draft),
    acceptanceCriteria,
    safetyBoundary: "Use public-safe or redacted data only. Do not request secrets, credentials, or private customer data.",
    expectedReturn: {
      acceptedTasks: "number",
      artifactUrl: "public HTTPS receipt URL",
      reviewerSummary: "buyer-safe markdown summary"
    }
  };
  const payloadJson = JSON.stringify(payload, null, 2);
  const checksum = stablePacketHash(payloadJson);
  const receipt = {
    receiptId: `quick-a2a-trial-${recommended.agentId}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    payloadChecksum: checksum,
    generatedFrom: [
      "quick workflow intake",
      "marketplace agent ranking",
      "buyer readiness checks",
      "A2A trial payload"
    ]
  };

  return {
    status,
    headline: hasAcceptedTrial
      ? `${draft.agentTrialEvidence?.agentName || "A2A agent"} trial receipt is attached`
      : status === "watch"
        ? `Run ${recommended.name} as the first A2A trial`
        : "Add buyer workflow before choosing an A2A trial",
    summary: hasAcceptedTrial
      ? `${draft.agentTrialEvidence?.skillId || "accepted trial"} scored ${draft.agentTrialEvidence?.score}/100 with a public artifact.`
      : status === "watch"
        ? `${recommended.skillId} is ready to receive a buyer-safe ${payload.method} task for ${buyer}.`
        : readiness.items.find((item) => item.status === "blocked")?.action || "Add buyer, workflow, and success metric before running a trial.",
    trialMethod: "message/send",
    recommended,
    acceptanceCriteria,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    receipt,
    receiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(receipt, null, 2))}`,
    candidates
  };
}

function formatPaybackDays(value: number | null) {
  return value ? `${value} days` : "not defendable";
}

function mergedPreviewStatus(...statuses: QuickBuyerRoomPreviewStatus[]): QuickBuyerRoomPreviewStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("watch")) return "watch";
  return "ready";
}

type QuickSourceTraceId = WorkflowIntakeDraft["sourceTrace"][number]["id"];
type QuickSourceTraceStatus = WorkflowIntakeDraft["sourceTrace"][number]["status"] | "derived";

type QuickSourceGrounding = {
  sourceTraceIds: QuickSourceTraceId[];
  sourceStatus: QuickSourceTraceStatus;
  sourceLine: string;
  sourceLineNumber: number | null;
  sourceLabel: string;
};

function sourceGroundingFor(draft: WorkflowIntakeDraft, sourceTraceIds: QuickSourceTraceId[], derivedLabel?: string): QuickSourceGrounding {
  if (sourceTraceIds.length === 0) {
    return {
      sourceTraceIds,
      sourceStatus: "derived",
      sourceLine: "",
      sourceLineNumber: null,
      sourceLabel: derivedLabel || "Derived from source-grounded buyer claims"
    };
  }

  const traces = sourceTraceIds.map((id) => draft.sourceTrace.find((item) => item.id === id) ?? null);
  const statuses = traces.map((item) => item?.status ?? "missing");
  const sourceStatus: QuickSourceTraceStatus = statuses.includes("missing") ? "missing" : statuses.includes("inferred") ? "inferred" : "traced";
  const line = traces.find((item) => item?.sourceLine)?.sourceLine ?? "";
  const lineNumber = traces.find((item) => item?.sourceLineNumber)?.sourceLineNumber ?? null;
  const labels = traces.map((item, index) => item?.label ?? sourceTraceIds[index]).filter(Boolean);

  return {
    sourceTraceIds,
    sourceStatus,
    sourceLine: line,
    sourceLineNumber: lineNumber,
    sourceLabel: lineNumber ? `Pasted note L${lineNumber}: ${labels.join(" / ")}` : `Pasted note: ${labels.join(" / ")} ${sourceStatus}`
  };
}

function sourceStatusPreviewStatus(sourceStatus: QuickSourceTraceStatus): QuickBuyerRoomPreviewStatus {
  if (sourceStatus === "missing") return "blocked";
  if (sourceStatus === "inferred") return "watch";
  return "ready";
}

function statusWithSourceGrounding(status: QuickBuyerRoomPreviewStatus, grounding: QuickSourceGrounding) {
  return mergedPreviewStatus(status, sourceStatusPreviewStatus(grounding.sourceStatus));
}

function sourceGroundingAction(label: string, status: QuickBuyerRoomPreviewStatus, grounding: QuickSourceGrounding, currentAction: string) {
  if (grounding.sourceStatus === "missing" && status !== "blocked") {
    return `Add a source line for ${label.toLowerCase()} in the workflow note before using this claim.`;
  }
  if (grounding.sourceStatus === "inferred" && status === "ready") {
    return `Confirm ${label.toLowerCase()} with an explicit source line before external sharing.`;
  }
  return currentAction;
}

function sourceGroundingEvidence(grounding: QuickSourceGrounding) {
  if (grounding.sourceStatus === "derived") return grounding.sourceLabel;
  if (grounding.sourceLineNumber) return `Source ${grounding.sourceStatus}: L${grounding.sourceLineNumber} ${grounding.sourceLine}`;
  return `Source ${grounding.sourceStatus}: ${grounding.sourceLabel}`;
}

function rowWithSourceGrounding(row: QuickBuyerRoomPreviewRow, grounding: QuickSourceGrounding): QuickBuyerRoomPreviewRow {
  const groundedStatus = statusWithSourceGrounding(row.status, grounding);
  if (groundedStatus === row.status && grounding.sourceStatus === "traced") return row;
  return {
    ...row,
    status: groundedStatus,
    proof: `${row.proof} ${sourceGroundingEvidence(grounding)}`
  };
}

function labelList(labels: string[]) {
  if (labels.length <= 2) return labels.join(" and ");
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

function sentence(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function proofRepairVerb(items: QuickProofRepairItem[]) {
  if (items.every((item) => item.status === "blocked")) return "Add";
  if (items.every((item) => item.status === "watch")) return "Replace";
  return "Repair";
}

function proofRepairActionVerb(items: QuickProofRepairItem[]) {
  if (items.every((item) => item.status === "blocked")) return "Attach";
  if (items.every((item) => item.status === "watch")) return "Replace";
  return "Repair";
}

function validGenericPublicProofUrl(value: string | undefined) {
  return Boolean(cleanBuyerFacingProofUrl(value));
}

function proofSlotStatus(id: QuickProofLinkId, value: string | undefined): QuickBuyerRoomPreviewStatus {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "blocked";
  if (placeholderProofUrlReason(trimmed)) return "watch";
  if (id === "protopediaUrl") return validProtoPediaUrl(trimmed) ? "ready" : "watch";
  if (id === "videoUrl") return validVideoUrl(trimmed) ? "ready" : "watch";
  return validGenericPublicProofUrl(trimmed) ? "ready" : "watch";
}

function normalizedProofDisplayValue(id: QuickProofLinkId, value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "Missing public URL";
  const normalized = cleanPublicHttpsUrl(trimmed);
  if (normalized) return normalized;
  return trimmed;
}

function invalidProofAction(id: QuickProofLinkId, value: string | undefined) {
  const placeholderReason = placeholderProofUrlReason(value);
  if (placeholderReason) return "Replace the placeholder proof URL with a real public artifact URL reviewers can open.";
  const demoReason = demoProofHostReason(value);
  if (demoReason) return `Replace the ${demoReason} with a real public artifact URL reviewers can open.`;
  if (id === "protopediaUrl") return "Replace with a public https://protopedia.net work page URL.";
  if (id === "videoUrl") return "Replace with a public YouTube or Vimeo walkthrough URL.";
  if (id === "targetUrl") return "Replace with a public https deployment URL reviewers can open.";
  if (id === "pilotEvidenceUrl") return "Replace with a public https pilot receipt URL.";
  return "Replace with a public https work-order proof URL.";
}

export function withQuickProofLinkRepair(draft: WorkflowIntakeDraft, id: QuickProofLinkId, value: string): WorkflowIntakeDraft {
  const trimmed = value.trim();
  const proofLinks = { ...draft.proofLinks };
  if (trimmed) proofLinks[id] = trimmed;
  else delete proofLinks[id];
  return { ...draft, proofLinks };
}

export function quickProofLinksForVerification(plan: QuickProofRepairPlan): QuickProofVerificationRequestLink[] {
  return plan.items.map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value === "Missing public URL" ? "" : item.value.trim()
  }));
}

function quickProofSlotsForAudit(plan: QuickProofRepairPlan): WorkflowIntakeProofSlot[] {
  return plan.items.map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value === "Missing public URL" ? "" : item.value.trim(),
    href: item.href
  }));
}

export function buildQuickLiveProofAudit(input: {
  proofRepairPlan: QuickProofRepairPlan;
  proofVerification?: BuyerShareGateProofVerificationSummary | null;
  proofVerifyError?: string;
}) {
  return buildWorkflowLiveProofAudit({
    proofLinks: quickProofSlotsForAudit(input.proofRepairPlan),
    proofVerification: input.proofVerification,
    proofVerifyError: input.proofVerifyError
  });
}

function quickLiveProofFreshness(audit: WorkflowLiveProofAudit | null | undefined, nowMs = Date.now()) {
  const checkedAt = audit?.checkedAt || "";
  const checkedAtMs = checkedAt ? Date.parse(checkedAt) : Number.NaN;
  const hasValidCheckedAt = Number.isFinite(checkedAtMs);
  const expiresAtMs = hasValidCheckedAt ? checkedAtMs + QUICK_LIVE_PROOF_FRESHNESS_TTL_HOURS * 60 * 60 * 1000 : Number.NaN;
  const expiresAt = Number.isFinite(expiresAtMs) ? new Date(expiresAtMs).toISOString() : "";
  const remainingHours = Number.isFinite(expiresAtMs) ? Math.max(0, Math.ceil((expiresAtMs - nowMs) / (60 * 60 * 1000))) : 0;
  const isFresh = Boolean(audit?.status === "verified" && hasValidCheckedAt && nowMs < expiresAtMs);
  const label = isFresh
    ? `Fresh for ${remainingHours} hour${remainingHours === 1 ? "" : "s"}`
    : audit?.status === "verified"
      ? "Freshness expired"
      : audit?.status === "action-required"
        ? "Live proof needs repair"
        : "Live proof not run";
  const summary = isFresh
    ? `Live proof audit ${audit?.receiptId} is inside the ${QUICK_LIVE_PROOF_FRESHNESS_TTL_HOURS}-hour buyer-send window.`
    : audit?.status === "verified"
      ? `Live proof audit ${audit.receiptId} was checked at ${checkedAt || "unknown time"}, but the ${QUICK_LIVE_PROOF_FRESHNESS_TTL_HOURS}-hour buyer-send window has expired.`
      : audit?.summary || "Run live proof verification before buyer-send.";

  return { isFresh, label, summary, checkedAt, expiresAt, remainingHours };
}

export function buildQuickProofVerificationHandoff(input: {
  proofRepairPlan: QuickProofRepairPlan;
  liveProofAudit: WorkflowLiveProofAudit;
  nowMs?: number;
}): QuickProofVerificationHandoff {
  const freshness = quickLiveProofFreshness(input.liveProofAudit, input.nowMs);
  const verifiedButStale = input.liveProofAudit.status === "verified" && !freshness.isFresh;
  const auditRowById = new Map(input.liveProofAudit.rows.map((row) => [row.id, row]));
  const items = input.proofRepairPlan.items.map((item): QuickProofVerificationHandoffItem => {
    const row = auditRowById.get(item.id);
    const verificationStatus = row?.status ?? "not-run";
    const status: QuickBuyerRoomPreviewStatus =
      item.status !== "ready" || verificationStatus === "block" || verificationStatus === "missing"
        ? "blocked"
        : input.liveProofAudit.status === "not-run" || verifiedButStale || verificationStatus === "watch" || verificationStatus === "not-run"
          ? "watch"
          : "ready";
    const evidence =
      item.status !== "ready"
        ? item.action
        : input.liveProofAudit.status === "not-run"
          ? "Public URL is attached but no live verifier receipt has been issued."
          : verifiedButStale
            ? freshness.summary
          : (row?.evidence ?? "Live verifier did not return a result for this proof link.");
    const nextAction =
      item.status !== "ready"
        ? item.action
        : input.liveProofAudit.status === "not-run"
          ? "Run live proof verification before buyer-send."
          : verifiedButStale
            ? "Rerun live proof verification before buyer-send."
          : verificationStatus === "pass"
            ? "Keep this verified proof in the buyer launch packet."
            : (row?.action ?? "Rerun live proof verification for this proof link.");

    return {
      id: item.id,
      label: item.label,
      status,
      verificationStatus,
      url: item.value === "Missing public URL" ? "" : item.value,
      owner: item.owner,
      evidence,
      nextAction,
      href: quickProofRepairFieldHref(item.id)
    };
  });
  const readyCount = items.filter((item) => item.status === "ready").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const watchCount = items.filter((item) => item.status === "watch").length;
  const status: QuickBuyerRoomPreviewStatus = blockedCount > 0 ? "blocked" : watchCount > 0 ? "watch" : "ready";
  const firstOpen = items.find((item) => item.status === "blocked") ?? items.find((item) => item.status === "watch");
  const buyerSendDecision =
    status === "ready"
      ? "Buyer-send unlocked with live proof receipt"
      : input.proofRepairPlan.repairCount > 0
        ? "Buyer-send held until public proof slots are repaired"
        : input.liveProofAudit.status === "not-run"
          ? "Buyer-send held until live proof receipt exists"
          : verifiedButStale
            ? "Buyer-send held until live proof receipt is refreshed"
          : "Buyer-send held until live proof repair is closed";
  const headline =
    status === "ready"
      ? "Buyer-send proof handoff is verified"
      : status === "watch"
        ? verifiedButStale
          ? "Buyer-send proof handoff needs a fresh receipt"
          : "Buyer-send proof handoff needs live receipt"
        : "Buyer-send proof handoff is blocked";
  const summary =
    status === "ready"
      ? `${readyCount}/${items.length} proof links are live-verified under receipt ${input.liveProofAudit.receiptId}.`
      : input.proofRepairPlan.repairCount > 0
        ? `${input.proofRepairPlan.repairCount} public proof repair item${input.proofRepairPlan.repairCount === 1 ? "" : "s"} still block the buyer-send route.`
        : input.liveProofAudit.status === "not-run"
        ? `${input.proofRepairPlan.readyCount}/${items.length} proof links are attached; run the live verifier to issue the buyer-send receipt.`
          : verifiedButStale
            ? freshness.summary
          : `${blockedCount + watchCount} live proof result${blockedCount + watchCount === 1 ? "" : "s"} still need repair before buyer-send.`;
  const exportMarkdown = [
    "# Buyer-send proof verification handoff",
    "",
    `Status: ${status}`,
    `Buyer-send decision: ${buyerSendDecision}`,
    `Receipt: ${input.liveProofAudit.receiptId}`,
    `Checked: ${input.liveProofAudit.checkedAt || "not run"}`,
    `Freshness: ${freshness.label}`,
    `Expires: ${freshness.expiresAt || "not available"}`,
    `Score: ${input.liveProofAudit.score}/100`,
    `Verified: ${readyCount}/${items.length}`,
    `First open: ${firstOpen?.label ?? "none"}`,
    "",
    "## Summary",
    summary,
    "",
    "## Proof links",
    ...items.map(
      (item) =>
        `- [${item.status}] ${item.label}: ${item.url || "missing"} / verifier ${item.verificationStatus}. Evidence: ${item.evidence} Next: ${item.nextAction}`
    )
  ].join("\n");

  return {
    status,
    headline,
    summary,
    buyerSendDecision,
    receiptId: input.liveProofAudit.receiptId,
    checkedAt: input.liveProofAudit.checkedAt,
    score: input.liveProofAudit.score,
    readyCount,
    totalCount: items.length,
    firstOpenLabel: firstOpen?.label ?? "none",
    items,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function liveProofButtonLabel(status: QuickLiveProofStatus) {
  if (status === "checking") return "Checking links";
  if (status === "checked") return "Recheck live proof";
  if (status === "failed") return "Retry live proof";
  return "Check live proof";
}

function extractionSourceLabel(source: QuickExtractionSource) {
  return source === "gemini" ? "Gemini-assisted extraction" : "Audited local extraction";
}

function fallbackReasonFrom(error: unknown) {
  return error instanceof Error ? error.message : "Workflow extraction API was unavailable.";
}

function proofInputAriaLabel(label: string) {
  return /\burl\b/i.test(label) ? label : `${label} URL`;
}

function buildPilotWeekPlan(input: {
  draft: WorkflowIntakeDraft;
  rows: QuickBuyerRoomPreviewRow[];
  previewStatus: QuickBuyerRoomPreviewStatus;
  buyer: string;
}): QuickPilotWeekPlanStep[] {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => input.rows.find((item) => item.id === id);
  const targetBuyer = input.buyer;
  const reviewer = input.draft.pilotRun.reviewerName || "Pilot reviewer";
  const trialOwner = input.draft.agentTrialEvidence?.agentName || "A2A operator";
  const successMetric = input.draft.workOrder.successMetric || "the success metric";
  const evidenceUrl = input.draft.workOrder.evidenceUrl || input.draft.pilotRun.evidenceUrl || "public proof URL";

  return [
    {
      id: "scope",
      day: "Day 0",
      label: "Freeze buyer workflow",
      status: row("scope")?.status ?? "blocked",
      owner: targetBuyer,
      action: `Confirm the workflow, baseline, success metric, and data boundary for ${targetBuyer}.`,
      acceptance: `The room states what changes, who approves it, and how "${successMetric}" is measured.`,
      proof: row("scope")?.proof ?? "Buyer workflow note",
      href: "#buyer-work-order-studio"
    },
    {
      id: "instrument",
      day: "Day 1",
      label: "Instrument value baseline",
      status: mergedPreviewStatus(row("value")?.status ?? "blocked", row("data")?.status ?? "blocked"),
      owner: "Value owner",
      action: "Lock the ROI assumptions and decide which data can be shown outside the team.",
      acceptance: "Team size, monthly cycles, manual hours, adoption rate, and data sensitivity are explicit.",
      proof: row("value")?.value ?? "Value model",
      href: "#buyer-value-simulator"
    },
    {
      id: "trial",
      day: "Day 2",
      label: "Run supervised A2A trial",
      status: mergedPreviewStatus(row("pilot")?.status ?? "blocked", row("a2a")?.status ?? "blocked"),
      owner: trialOwner,
      action: "Run one bounded task with the selected agent and attach the measured run receipt.",
      acceptance: `Manual/assisted minutes, accepted tasks, reviewer, and A2A trial score are recorded by ${reviewer}.`,
      proof: row("a2a")?.proof || row("pilot")?.proof || "A2A trial receipt",
      href: "#agent-card-intake"
    },
    {
      id: "verify",
      day: "Day 3",
      label: "Verify public proof",
      status: row("proof")?.status ?? "blocked",
      owner: "Proof owner",
      action: "Run live verification and replace every missing, private, or reference proof link.",
      acceptance: "The launch room can cite deployed URL, ProtoPedia, video, pilot receipt, and work-order proof.",
      proof: evidenceUrl,
      href: "#launch-evidence-console"
    },
    {
      id: "decide",
      day: "Day 5",
      label: "Record sponsor decision",
      status: input.previewStatus,
      owner: reviewer,
      action: "Use the launch room to record continue, revise, or stop with the current proof packet attached.",
      acceptance: "Sponsor can inspect value, measured run, trust boundary, live proof, and stop rule before approval.",
      proof: "Launch room and buyer proof packet",
      href: "#buyer-launch-handoff"
    }
  ];
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function stablePacketHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const QUICK_PUBLIC_SAFE_REDACTION_REPLACEMENT = "[redacted data boundary]";
const QUICK_PUBLIC_SAFE_REWRITE_REPLACEMENT = "public-safe redacted evidence";
const QUICK_PUBLIC_SAFE_REDACTION_RULES: Array<{
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  pattern: RegExp;
}> = [
  { label: "Credential marker", status: "blocked", pattern: /\b(api[-_\s]?key|credentials?|password|secret|token)\b/i },
  { label: "Customer/person data marker", status: "blocked", pattern: /\b(restricted\s+customer\s+data|customer\s+data|personal\s+data|pii)\b/i },
  { label: "Confidential marker", status: "blocked", pattern: /\b(restricted|confidential)\b/i },
  { label: "Japanese sensitive data marker", status: "blocked", pattern: /(個人情報|機密|秘匿)/i },
  { label: "Internal-only marker", status: "watch", pattern: /\binternal\b/i }
];
const QUICK_PUBLIC_SAFE_REDACTION_PATTERN =
  /\b(restricted\s+customer\s+data|api[-_\s]?key|credentials?|password|secret|token|customer\s+data|personal\s+data|confidential|restricted|pii|internal)\b|個人情報|機密|秘匿/gi;

type QuickPublicSafetySourceLine = {
  id: QuickSourceTraceId | "field-fallback";
  label: string;
  line: string;
  lineNumber: number | null;
};

function redactedPublicSafetyLine(value: string) {
  return value
    .replace(QUICK_PUBLIC_SAFE_REDACTION_PATTERN, QUICK_PUBLIC_SAFE_REDACTION_REPLACEMENT)
    .replace(new RegExp(`(?:${QUICK_PUBLIC_SAFE_REDACTION_REPLACEMENT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*){2,}`, "g"), QUICK_PUBLIC_SAFE_REDACTION_REPLACEMENT)
    .trim();
}

function publicSafeWorkflowRewriteLine(value: string) {
  return value
    .replace(QUICK_PUBLIC_SAFE_REDACTION_PATTERN, QUICK_PUBLIC_SAFE_REWRITE_REPLACEMENT)
    .replace(new RegExp(`(?:${QUICK_PUBLIC_SAFE_REWRITE_REPLACEMENT}\\s*){2,}`, "g"), QUICK_PUBLIC_SAFE_REWRITE_REPLACEMENT)
    .replace(/Data:\s*(?:public-safe\s+)?redacted\s+evidence\.?/i, "Data: public-safe redacted evidence.")
    .trim();
}

function publicSafeWorkflowRewriteFrom(sourceLines: QuickPublicSafetySourceLine[], draft: WorkflowIntakeDraft) {
  if (sourceLines.length === 0) return "Data: public-safe redacted evidence.";
  const rewrittenLines = sourceLines.map((line) => publicSafeWorkflowRewriteLine(line.line));
  const hasDataLine = rewrittenLines.some((line) => /^Data\s*:/i.test(line));
  if (!hasDataLine && draft.workOrder.dataSensitivity) rewrittenLines.push("Data: public-safe redacted evidence.");
  const seen = new Set<string>();
  return rewrittenLines
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return Boolean(line);
    })
    .join("\n");
}

function quickPublicSafetySourceLines(draft: WorkflowIntakeDraft): QuickPublicSafetySourceLine[] {
  const sourceLines: QuickPublicSafetySourceLine[] = draft.sourceTrace
    .filter((item) => item.sourceLine.trim())
    .map((item) => ({
      id: item.id,
      label: item.label,
      line: item.sourceLine.trim(),
      lineNumber: item.sourceLineNumber
    }));
  const hasSourceFor = (id: QuickSourceTraceId) => sourceLines.some((line) => line.id === id);
  const fallbackLines: QuickPublicSafetySourceLine[] = [];
  if (!hasSourceFor("buyer") && draft.workOrder.targetUser) fallbackLines.push({ id: "field-fallback", label: "Target buyer", line: `Buyer: ${draft.workOrder.targetUser}`, lineNumber: null });
  if (!hasSourceFor("workflow") && draft.workOrder.request) fallbackLines.push({ id: "field-fallback", label: "Workflow request", line: `Workflow: ${draft.workOrder.request}`, lineNumber: null });
  if (!hasSourceFor("baseline") && draft.workOrder.currentBaseline) fallbackLines.push({ id: "field-fallback", label: "Current baseline", line: `Baseline: ${draft.workOrder.currentBaseline}`, lineNumber: null });
  if (!hasSourceFor("success") && draft.workOrder.successMetric) fallbackLines.push({ id: "field-fallback", label: "Success metric", line: `Success: ${draft.workOrder.successMetric}`, lineNumber: null });
  if (!hasSourceFor("data-boundary") && draft.workOrder.dataSensitivity) fallbackLines.push({ id: "field-fallback", label: "Data boundary", line: `Data: ${draft.workOrder.dataSensitivity}`, lineNumber: null });
  if (!hasSourceFor("pilot-run") && draft.pilotRun.notes) fallbackLines.push({ id: "field-fallback", label: "Pilot notes", line: `Pilot notes: ${draft.pilotRun.notes}`, lineNumber: null });
  const seen = new Set<string>();
  return [...sourceLines, ...fallbackLines].filter((line) => {
    const key = line.line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildQuickPublicSafeRedactionPacket(draft: WorkflowIntakeDraft): QuickPublicSafeRedactionPacket {
  const sourceLines = quickPublicSafetySourceLines(draft);
  const findings: QuickPublicSafeRedactionFinding[] = [];
  sourceLines.forEach((line, index) => {
    const rule = QUICK_PUBLIC_SAFE_REDACTION_RULES.find((candidate) => candidate.pattern.test(line.line));
    if (!rule) return;
    findings.push({
      id: `public-safe-${line.id}-${line.lineNumber ?? index}`,
      label: rule.label,
      status: rule.status,
      sourceLabel: line.label,
      sourceLineNumber: line.lineNumber,
      redactedLine: redactedPublicSafetyLine(line.line),
      action:
        rule.status === "blocked"
          ? "Replace this source line with public-safe evidence or attach security approval before external sharing."
          : "Confirm this line is redacted into public-safe wording before external sharing."
    });
  });
  if (draft.workOrder.dataSensitivity === "restricted" && !findings.some((finding) => finding.status === "blocked")) {
    findings.push({
      id: "public-safe-restricted-boundary",
      label: "Restricted data boundary",
      status: "blocked",
      sourceLabel: "Data boundary",
      sourceLineNumber: draft.sourceTrace.find((item) => item.id === "data-boundary")?.sourceLineNumber ?? null,
      redactedLine: "Data: [redacted data boundary]",
      action: "Replace restricted evidence with public-safe or synthetic proof before external sharing."
    });
  }
  if (draft.workOrder.dataSensitivity === "internal" && findings.length === 0) {
    findings.push({
      id: "public-safe-internal-boundary",
      label: "Internal-only boundary",
      status: "watch",
      sourceLabel: "Data boundary",
      sourceLineNumber: draft.sourceTrace.find((item) => item.id === "data-boundary")?.sourceLineNumber ?? null,
      redactedLine: "Data: [redacted data boundary]",
      action: "Confirm the internal evidence is redacted into public-safe wording before external sharing."
    });
  }
  const redactedWorkflowNote = sourceLines.length
    ? sourceLines.map((line) => `${line.lineNumber ? `L${line.lineNumber}: ` : ""}${redactedPublicSafetyLine(line.line)}`).join("\n")
    : "No source lines were available. Regenerate from a pasted workflow note before public sharing.";
  const publicSafeWorkflowNote = publicSafeWorkflowRewriteFrom(sourceLines, draft);
  const rewriteLineCount = publicSafeWorkflowNote.split("\n").filter(Boolean).length;
  const blockedCount = findings.filter((finding) => finding.status === "blocked").length;
  const watchCount = findings.filter((finding) => finding.status === "watch").length;
  const status: QuickBuyerRoomPreviewStatus = blockedCount > 0 ? "blocked" : watchCount > 0 ? "watch" : "ready";
  const headline =
    status === "ready"
      ? "Public-safe packet has no sensitive markers"
      : status === "watch"
        ? "Public-safe packet needs redaction review"
        : "Public-safe packet blocks external sharing";
  const summary =
    status === "ready"
      ? "The source lines can be carried into public proof after live-link verification."
      : `${blockedCount || watchCount} source line${blockedCount + watchCount === 1 ? "" : "s"} must be redacted or approved before buyer-visible sharing.`;
  const exportMarkdown = [
    "# Public-safe redaction packet",
    "",
    `Status: ${status}`,
    headline,
    summary,
    "",
    "## Findings",
    ...(findings.length
      ? findings.map(
          (finding) =>
            `- [${finding.status}] ${finding.label}: ${finding.sourceLabel}${finding.sourceLineNumber ? ` L${finding.sourceLineNumber}` : ""}. Redacted: ${finding.redactedLine}. Next: ${finding.action}`
        )
      : ["- [ready] No sensitive markers found in traced source lines."]),
    "",
    "## Redacted workflow note",
    redactedWorkflowNote,
    "",
    "## Public-safe rewrite",
    "Paste this back into Quick Workflow Intake after replacing private evidence with buyer-approved public proof.",
    "",
    publicSafeWorkflowNote
  ].join("\n");
  const checksum = stablePacketHash(exportMarkdown);
  const receipt = {
    receiptId: `quick-public-safe-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum
  };

  return {
    status,
    headline,
    summary,
    blockedCount,
    watchCount,
    findings,
    redactedWorkflowNote,
    publicSafeWorkflowNote,
    publicSafeWorkflowNoteHref: `data:text/plain;charset=utf-8,${encodeURIComponent(publicSafeWorkflowNote)}`,
    rewriteLineCount,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    receipt,
    receiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(receipt, null, 2))}`
  };
}

export function verifyQuickBuyerDecisionOnePagerReceipt(
  payloadMarkdown: string,
  receipt: Pick<QuickBuyerDecisionOnePagerReceipt, "checksumAlgorithm" | "checksum">
): QuickBuyerDecisionOnePagerReceiptVerification {
  const payloadChecksum = stablePacketHash(payloadMarkdown);
  const status = payloadChecksum === receipt.checksum ? "verified" : "mismatch";

  return {
    status,
    label: status === "verified" ? "Receipt matches signed payload" : "Receipt does not match payload",
    payloadChecksum,
    receiptChecksum: receipt.checksum,
    detail:
      status === "verified"
        ? "Computed from the one-pager payload before the integrity receipt is appended."
        : "Regenerate the one-pager and receipt from the same buyer room snapshot."
  };
}

function mailtoHref(subject: string, body: string) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildPilotWeekTaskPacket(input: {
  buyer: string;
  status: QuickBuyerRoomPreviewStatus;
  primaryAsk: string;
  closeRule: string;
  pilotWeekPlan: QuickPilotWeekPlanStep[];
  decisionCaseText: string;
  handoffText: string;
  claimProofLedgerText: string;
  approvalRouteText: string;
  approvalEmailPackText: string;
  contractTermsText: string;
  procurementMatrixText: string;
  adoptionSuccessText: string;
  rolloutCommandBoardText: string;
  decisionClosePackText: string;
  proofRepairText: string;
  objectionText: string;
}): QuickPilotWeekTaskPacket {
  const csvText = [
    ["day", "label", "status", "owner", "action", "acceptance", "proof", "href"].map(csvCell).join(","),
    ...input.pilotWeekPlan.map((step) =>
      [step.day, step.label, step.status, step.owner, step.action, step.acceptance, step.proof, step.href].map(csvCell).join(",")
    )
  ].join("\n");
  const kickoffText = [
    `Pilot week kickoff: ${input.buyer}`,
    `Status: ${input.status}`,
    `Primary ask: ${input.primaryAsk}`,
    `Close rule: ${input.closeRule}`,
    "",
    "Plan",
    ...input.pilotWeekPlan.map((step) => `- ${step.day} / ${step.status} / ${step.owner}: ${step.label}. ${step.acceptance}`)
  ].join("\n");
  const checksumSource = [
    input.buyer,
    input.status,
    input.primaryAsk,
    input.closeRule,
    csvText,
    kickoffText,
    input.decisionCaseText,
    input.handoffText,
    input.claimProofLedgerText,
    input.approvalRouteText,
    input.approvalEmailPackText,
    input.contractTermsText,
    input.procurementMatrixText,
    input.adoptionSuccessText,
    input.rolloutCommandBoardText,
    input.decisionClosePackText,
    input.proofRepairText,
    input.objectionText,
    ...input.pilotWeekPlan.map((step) => `${step.id}:${step.day}:${step.status}:${step.owner}:${step.acceptance}:${step.proof}:${step.href}`)
  ].join("\n");
  const checksum = stablePacketHash(checksumSource);
  const receipt = {
    receiptId: `quick-pilot-week-${input.status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    generatedFrom: [
      "quick buyer room preview",
      "buyer decision case",
      "claim-proof ledger",
      "stakeholder approval route",
      "stakeholder approval email pack",
      "pilot contract terms",
      "procurement alternative matrix",
      "adoption success plan",
      "rollout command board",
      "decision close pack",
      "pilot week plan",
      "task csv",
      "kickoff note",
      "buyer handoff brief",
      "proof repair plan",
      "buyer objection brief"
    ]
  };
  const receiptText = JSON.stringify(receipt, null, 2);

  return {
    csvText,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`,
    kickoffText,
    kickoffHref: `data:text/plain;charset=utf-8,${encodeURIComponent(kickoffText)}`,
    receipt,
    receiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(receiptText)}`
  };
}

function buildProofRepairPlan(draft: WorkflowIntakeDraft): QuickProofRepairPlan {
  const slotDefinitions: Array<Omit<QuickProofRepairItem, "status" | "value" | "action"> & { value: string | undefined; missingAction: string }> = [
    {
      id: "targetUrl",
      label: "Deployed URL",
      owner: "Release owner",
      missingAction: "Attach the public Cloud Run or deployed application URL that a reviewer can open.",
      value: draft.proofLinks.targetUrl,
      href: "#launch-evidence-console",
      placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.targetUrl
    },
    {
      id: "protopediaUrl",
      label: "ProtoPedia URL",
      owner: "Publication owner",
      missingAction: "Publish the ProtoPedia story page and attach its public URL.",
      value: draft.proofLinks.protopediaUrl,
      href: "#launch-evidence-console",
      placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl
    },
    {
      id: "videoUrl",
      label: "Walkthrough video",
      owner: "Recording owner",
      missingAction: "Attach a public walkthrough video showing the buyer workflow from input to proof packet.",
      value: draft.proofLinks.videoUrl,
      href: "#launch-evidence-console",
      placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl
    },
    {
      id: "pilotEvidenceUrl",
      label: "Pilot receipt",
      owner: draft.pilotRun.reviewerName || "Pilot reviewer",
      missingAction: "Attach the measured pilot receipt with manual minutes, assisted minutes, accepted tasks, and reviewer.",
      value: draft.proofLinks.pilotEvidenceUrl || draft.pilotRun.evidenceUrl,
      href: "#pilot-run-receipt",
      placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.pilotEvidenceUrl
    },
    {
      id: "workOrderEvidenceUrl",
      label: "Work order proof",
      owner: draft.workOrder.targetUser || "Work owner",
      missingAction: "Attach the bounded work order proof that states buyer, workflow, baseline, metric, and data boundary.",
      value: draft.proofLinks.workOrderEvidenceUrl || draft.workOrder.evidenceUrl,
      href: "#buyer-work-order-studio",
      placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.workOrderEvidenceUrl
    }
  ];
  const items = slotDefinitions.map((slot) => {
    const status = proofSlotStatus(slot.id, slot.value);
    const action =
      status === "ready" ? "Keep this public proof link attached and verify it before sending." : status === "watch" ? invalidProofAction(slot.id, slot.value) : slot.missingAction;
    return {
      id: slot.id,
      label: slot.label,
      status,
      owner: slot.owner,
      action,
      value: normalizedProofDisplayValue(slot.id, slot.value),
      href: slot.href,
      placeholder: slot.placeholder
    };
  });
  const readyCount = items.filter((item) => item.status === "ready").length;
  const missingItems = items.filter((item) => item.status === "blocked");
  const invalidItems = items.filter((item) => item.status === "watch");
  const repairItems = items.filter((item) => item.status !== "ready");
  const missingCount = missingItems.length;
  const invalidCount = invalidItems.length;
  const repairCount = repairItems.length;
  const headline =
    repairCount === 0
      ? "Public proof packet is complete"
      : repairCount <= 2
        ? `${proofRepairVerb(repairItems)} ${labelList(repairItems.map((item) => item.label))}`
        : invalidCount > 0
          ? `Repair ${repairCount} proof links`
          : `Add ${missingCount} missing proof links`;
  const summary =
    repairCount === 0
      ? "All five public proof links are attached. Run live verification before sending."
      : [
          missingCount > 0 ? `${missingCount} proof link${missingCount === 1 ? "" : "s"} missing` : "",
          invalidCount > 0 ? `${invalidCount} proof link${invalidCount === 1 ? " has" : "s have"} invalid domains` : ""
        ]
          .filter(Boolean)
          .join(" and ") + " before this can be sent outside the team.";
  const repairText = [
    "Proof repair plan",
    `Ready: ${readyCount}/5`,
    `Missing: ${missingCount}`,
    `Invalid: ${invalidCount}`,
    "",
    ...items.map((item) => `[${item.status}] ${item.label} - ${item.owner}: ${item.action} Proof: ${item.value}`)
  ].join("\n");
  const impact = buildQuickProofRepairImpact({ readyCount, repairCount, items });
  const repairExportText = [
    repairText,
    "",
    "Impact preview",
    `Status: ${impact.status}`,
    `Readiness: ${impact.readinessScore}/100`,
    `First open: ${impact.firstOpenLabel}`,
    `Next verifier action: ${impact.nextVerifierAction}`,
    "",
    ...impact.items.map((item) => `[${item.status}] ${item.label}: ${item.evidence}. ${item.nextAction}`)
  ].join("\n");

  return {
    readyCount,
    missingCount,
    invalidCount,
    repairCount,
    headline,
    summary,
    items,
    impact,
    repairText,
    repairHref: `data:text/plain;charset=utf-8,${encodeURIComponent(repairExportText)}`
  };
}

function buildHandoffPromise(draft: WorkflowIntakeDraft) {
  const savedMinutes =
    draft.pilotRun.observedManualMinutes && draft.pilotRun.observedAssistedMinutes && draft.pilotRun.observedManualMinutes > draft.pilotRun.observedAssistedMinutes
      ? draft.pilotRun.observedManualMinutes - draft.pilotRun.observedAssistedMinutes
      : 0;
  const cyclesPerMonth = draft.buyerScenario.cyclesPerMonth || 0;
  const adoptionRate = draft.buyerScenario.adoptionRatePercent ? draft.buyerScenario.adoptionRatePercent / 100 : 1;
  const hourlyCost = draft.buyerScenario.hourlyCostYen || 0;
  const monthlyHours = savedMinutes && cyclesPerMonth ? (savedMinutes / 60) * cyclesPerMonth * adoptionRate : 0;
  const monthlyValue = monthlyHours && hourlyCost ? Math.round((monthlyHours * hourlyCost) / 1000) * 1000 : 0;

  if (savedMinutes && monthlyValue) {
    return `Evidence shows ${savedMinutes} minutes saved per run, about ${formatHours(monthlyHours)}h/month or ${formatYen(monthlyValue)}/month at the extracted adoption rate.`;
  }
  if (savedMinutes) return `Evidence shows ${savedMinutes} minutes saved per run; monthly value needs cost and adoption assumptions.`;
  if (draft.buyerScenario.teamSize || draft.buyerScenario.cyclesPerMonth || draft.buyerScenario.manualHoursPerCycle) {
    return "Value assumptions are present, but measured pilot minutes still need proof before a buyer review.";
  }
  return "The buyer value claim is not ready until savings, frequency, and acceptance evidence are attached.";
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function monthlyValueFor(input: { savedMinutes: number; cyclesPerMonth: number; adoptionRatePercent: number; hourlyCostYen: number; incidentRiskYenPerMonth: number; riskCaptureRate: number }) {
  const monthlyHoursSaved = (input.savedMinutes / 60) * input.cyclesPerMonth * (input.adoptionRatePercent / 100);
  const productivityValue = monthlyHoursSaved * input.hourlyCostYen;
  const riskValue = input.incidentRiskYenPerMonth * input.riskCaptureRate * (input.adoptionRatePercent / 100);
  return {
    monthlyHoursSaved,
    monthlyValueYen: Math.round((productivityValue + riskValue) / 1000) * 1000
  };
}

function buildQuickPilotEconomicsStressTest(draft: WorkflowIntakeDraft): QuickPilotEconomicsStressTest {
  const manual = draft.pilotRun.observedManualMinutes || 0;
  const assisted = draft.pilotRun.observedAssistedMinutes || 0;
  const savedMinutes = Math.max(0, manual - assisted);
  const cyclesPerMonth = draft.buyerScenario.cyclesPerMonth || 0;
  const baseAdoption = draft.buyerScenario.adoptionRatePercent || 0;
  const hourlyCostYen = draft.buyerScenario.hourlyCostYen || 0;
  const incidentRiskYenPerMonth = draft.buyerScenario.incidentRiskYenPerMonth || 0;
  const missing = [
    savedMinutes > 0 ? "" : "measured minutes",
    cyclesPerMonth > 0 ? "" : "cycles/month",
    baseAdoption > 0 ? "" : "adoption rate",
    hourlyCostYen > 0 ? "" : "hourly cost"
  ].filter(Boolean);
  const scenarioInputs = [
    {
      id: "downside" as const,
      label: "Downside",
      adoptionRatePercent: clampPercent(baseAdoption * 0.5),
      savedMinutesPerRun: Math.max(0, Math.round(savedMinutes * 0.75)),
      riskCaptureRate: 0.1
    },
    {
      id: "base" as const,
      label: "Base",
      adoptionRatePercent: clampPercent(baseAdoption),
      savedMinutesPerRun: savedMinutes,
      riskCaptureRate: 0.22
    },
    {
      id: "upside" as const,
      label: "Upside",
      adoptionRatePercent: clampPercent(baseAdoption + 15),
      savedMinutesPerRun: Math.round(savedMinutes * 1.15),
      riskCaptureRate: 0.35
    }
  ];
  const scenarios = scenarioInputs.map((scenario): QuickPilotEconomicsScenario => {
    const value = monthlyValueFor({
      savedMinutes: scenario.savedMinutesPerRun,
      cyclesPerMonth,
      adoptionRatePercent: scenario.adoptionRatePercent,
      hourlyCostYen,
      incidentRiskYenPerMonth,
      riskCaptureRate: scenario.riskCaptureRate
    });
    const status: QuickBuyerRoomPreviewStatus =
      missing.length > 0 ? "blocked" : value.monthlyValueYen >= 250000 ? "ready" : value.monthlyValueYen > 0 ? "watch" : "blocked";
    return {
      id: scenario.id,
      label: scenario.label,
      status,
      adoptionRatePercent: scenario.adoptionRatePercent,
      savedMinutesPerRun: scenario.savedMinutesPerRun,
      monthlyHoursSaved: Math.round(value.monthlyHoursSaved * 10) / 10,
      monthlyValueYen: value.monthlyValueYen,
      evidence:
        missing.length > 0
          ? `Missing ${labelList(missing)} before this value claim can be defended.`
          : `${scenario.savedMinutesPerRun}m saved/run x ${cyclesPerMonth} cycles/month x ${scenario.adoptionRatePercent}% adoption + risk buffer.`,
      action:
        status === "ready"
          ? "Keep this scenario attached to the buyer decision case."
          : missing.length > 0
            ? `Add ${labelList(missing)} to defend the economics.`
            : "Treat this as sponsor-review only until measured value gets stronger."
    };
  });
  const status = mergedPreviewStatus(...scenarios.map((scenario) => scenario.status));
  const monthlyValues = scenarios.map((scenario) => scenario.monthlyValueYen);
  const riskAdjustedMonthlyValueYen = Math.min(...monthlyValues);
  const monthlyValueRange = `${formatYen(Math.min(...monthlyValues))} - ${formatYen(Math.max(...monthlyValues))}/month`;
  const headline =
    status === "ready"
      ? "Pilot economics survive the downside case"
      : status === "watch"
        ? "Pilot economics need sponsor review"
        : "Pilot economics are not defendable yet";
  const summary =
    missing.length > 0
      ? `Missing ${labelList(missing)} before a buyer can trust the value claim.`
      : `Risk-adjusted floor is ${formatYen(riskAdjustedMonthlyValueYen)}/month from extracted pilot evidence.`;
  const exportMarkdown = [
    "# Pilot economics stress test",
    "",
    headline,
    summary,
    `Range: ${monthlyValueRange}`,
    `Risk-adjusted floor: ${formatYen(riskAdjustedMonthlyValueYen)}/month`,
    "",
    ...scenarios.map(
      (scenario) =>
        `- [${scenario.status}] ${scenario.label}: ${formatYen(scenario.monthlyValueYen)}/month, ${scenario.monthlyHoursSaved}h saved, ${scenario.adoptionRatePercent}% adoption. ${scenario.evidence}`
    )
  ].join("\n");

  return {
    status,
    headline,
    summary,
    monthlyValueRange,
    riskAdjustedMonthlyValueYen,
    scenarios,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickClaimProofLedger(input: {
  draft: WorkflowIntakeDraft;
  buyer: string;
  workflow: string;
  rows: QuickBuyerRoomPreviewRow[];
  decisionCase: QuickBuyerDecisionCase;
  economicsStressTest: QuickPilotEconomicsStressTest;
  approvalRoute: QuickStakeholderApprovalRoute;
  pilotContractTerms: QuickPilotContractTerms;
  procurementMatrix: QuickProcurementAlternativeMatrix;
  proofRepairPlan: QuickProofRepairPlan;
}): QuickClaimProofLedger {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => input.rows.find((item) => item.id === id);
  const recommended =
    input.procurementMatrix.alternatives.find((alternative) => alternative.id === input.procurementMatrix.recommendedAlternativeId) ??
    input.procurementMatrix.alternatives[0];
  const firstProofRepair = input.proofRepairPlan.items.find((item) => item.status !== "ready");
  const proofStatus: QuickBuyerRoomPreviewStatus =
    input.proofRepairPlan.repairCount === 0 ? "ready" : input.proofRepairPlan.readyCount > 0 ? "watch" : "blocked";
  type QuickClaimProofItemSeed = Omit<QuickClaimProofItem, "sourceTraceIds" | "sourceStatus" | "sourceLine" | "sourceLineNumber">;
  const item = (entry: QuickClaimProofItemSeed, sourceTraceIds: QuickSourceTraceId[], derivedLabel?: string): QuickClaimProofItem => {
    const grounding = sourceGroundingFor(input.draft, sourceTraceIds, derivedLabel);
    const status = statusWithSourceGrounding(entry.status, grounding);
    return {
      ...entry,
      status,
      source: grounding.sourceLabel,
      sourceTraceIds: grounding.sourceTraceIds,
      sourceStatus: grounding.sourceStatus,
      sourceLine: grounding.sourceLine,
      sourceLineNumber: grounding.sourceLineNumber,
      nextAction: sourceGroundingAction(entry.label, entry.status, grounding, entry.nextAction)
    };
  };
  const items = [
    item({
      id: "workflow-scope",
      label: "Workflow scope",
      status: row("scope")?.status ?? "blocked",
      claim: `${input.buyer} has one bounded workflow to review.`,
      evidence: row("scope")?.proof || input.workflow,
      source: "Workflow intake",
      proof: row("scope")?.value || input.buyer,
      owner: input.buyer,
      verification: "Confirm the target buyer, workflow request, success metric, and baseline are present.",
      risk: "A vague workflow cannot be priced, piloted, or assigned to an agent.",
      nextAction: row("scope")?.status === "ready" ? "Keep the scope unchanged through the buyer review." : "Name the buyer, bounded workflow, success metric, and baseline.",
      href: "#quick-workflow-intake"
    }, ["buyer", "workflow", "success"]),
    item({
      id: "value-model",
      label: "Value model",
      status: input.economicsStressTest.status,
      claim: "The pilot has enough downside value to justify a buyer review.",
      evidence: `${input.economicsStressTest.summary} Range: ${input.economicsStressTest.monthlyValueRange}.`,
      source: "Pilot economics stress test",
      proof: `${formatYen(input.economicsStressTest.riskAdjustedMonthlyValueYen)}/month risk-adjusted floor`,
      owner: "Finance owner",
      verification: "Inspect downside, base, and upside scenarios and confirm measured minutes, cycles, adoption, and hourly cost.",
      risk: "Without downside value, the room reads as a demo instead of a business case.",
      nextAction: input.economicsStressTest.status === "ready" ? "Attach the downside case to the decision packet." : input.economicsStressTest.scenarios[0]?.action ?? "Repair the value model.",
      href: "#buyer-value-simulator"
    }, ["value-model"]),
    item({
      id: "measured-run",
      label: "Measured run",
      status: row("pilot")?.status ?? "blocked",
      claim: "The workflow has measured manual-vs-assisted evidence.",
      evidence: row("pilot")?.value || "Measured pilot missing",
      source: "Pilot run receipt",
      proof: row("pilot")?.proof || input.draft.pilotRun.evidenceUrl || "Pilot receipt missing",
      owner: input.draft.pilotRun.reviewerName || input.buyer,
      verification: "Confirm manual minutes, assisted minutes, accepted tasks, participants, reviewer, and receipt link.",
      risk: "Unmeasured savings cannot survive procurement review.",
      nextAction: row("pilot")?.status === "ready" ? "Keep the pilot receipt attached." : "Run one measured pilot and record accepted tasks.",
      href: "#pilot-run-receipt"
    }, ["pilot-run"]),
    item({
      id: "public-proof",
      label: "Public proof",
      status: proofStatus,
      claim: "An outside reviewer can inspect the proof packet.",
      evidence: proofReadinessLine(input.proofRepairPlan),
      source: "Proof repair plan",
      proof: input.proofRepairPlan.items
        .filter((proofItem) => proofItem.status === "ready")
        .map((proofItem) => proofItem.value)
        .join(" / ") || "No public proof URL ready yet.",
      owner: firstProofRepair?.owner || "Proof owner",
      verification: "Open deployed URL, ProtoPedia, walkthrough, pilot receipt, and work-order proof before sharing.",
      risk: proofStatus === "ready" ? "Proof can still go stale before buyer review." : "External sharing will stall if proof links are missing or stale.",
      nextAction: proofStatus === "ready" ? "Run live verification before the next buyer review." : input.proofRepairPlan.summary,
      href: `#${QUICK_PROOF_REPAIR_PLAN_ID}`
    }, ["public-proof"]),
    item({
      id: "agent-trust",
      label: "Agent trust",
      status: row("a2a")?.status ?? "blocked",
      claim: "The agent action is backed by an accepted A2A trial receipt.",
      evidence: input.decisionCase.trustEvidence,
      source: "A2A trial evidence",
      proof: input.draft.agentTrialEvidence?.artifactUrl || "Accepted A2A trial receipt missing",
      owner: input.draft.agentTrialEvidence?.agentName || "A2A operator",
      verification: "Confirm agent name, skill ID, score, and artifact URL in the accepted trial receipt.",
      risk: "Without an accepted A2A receipt, this looks like a generic assistant workflow.",
      nextAction: row("a2a")?.status === "ready" ? "Keep the A2A receipt in the buyer room." : "Attach an accepted A2A trial receipt.",
      href: "#agent-card-intake"
    }, ["agent-trial"]),
    item({
      id: "data-boundary",
      label: "Data boundary",
      status: row("data")?.status ?? "blocked",
      claim: "The buyer-safe data boundary is explicit before sharing.",
      evidence: input.decisionCase.dataBoundary,
      source: "Workflow intake data boundary",
      proof: row("data")?.value || "Data boundary missing",
      owner: "Security owner",
      verification: "Confirm whether evidence is public, internal-redacted, or restricted before external sharing.",
      risk: "A missing boundary can leak restricted context or block security approval.",
      nextAction: row("data")?.status === "ready" ? "Keep the redacted/public boundary visible." : "Redact internal evidence or get security approval.",
      href: "#buyer-trust-center"
    }, ["data-boundary"]),
    item({
      id: "approval-path",
      label: "Approval path",
      status: input.approvalRoute.status,
      claim: "Finance, security, pilot owner, and procurement know their approval gates.",
      evidence: input.approvalRoute.summary,
      source: "Stakeholder approval route",
      proof: `${input.approvalRoute.readyCount}/4 gates ready; ${input.approvalRoute.blockedCount} blocked.`,
      owner: input.approvalRoute.steps.find((step) => step.status !== "ready")?.owner || "Procurement owner",
      verification: "Confirm every gate has an owner, evidence line, next action, and sendable approval message.",
      risk: "A good demo still fails if ownership is unclear.",
      nextAction: input.approvalRoute.steps.find((step) => step.status !== "ready")?.nextAction || "Record stakeholder replies before procurement routing.",
      href: "#launch-evidence-console"
    }, ["buyer", "workflow", "public-proof", "data-boundary"]),
    item({
      id: "procurement-choice",
      label: "Procurement choice",
      status: input.procurementMatrix.status,
      claim: "The recommended path is compared against realistic alternatives.",
      evidence: input.procurementMatrix.summary,
      source: "Procurement alternative matrix",
      proof: recommended ? `Recommended: ${recommended.label}. ${recommended.decision}` : "Recommendation missing",
      owner: "Procurement owner",
      verification: "Compare A2A pilot, manual status quo, generic AI, and internal build by value, setup cost, payback, proof, and risk.",
      risk: "Without alternatives, the recommendation looks like a sales pitch.",
      nextAction: input.procurementMatrix.status === "ready" ? "Keep the matrix attached to the buyer room." : "Repair value, proof, approval, or contract gates before procurement receives it.",
      href: "#launch-evidence-console"
    }, ["value-model", "pilot-run", "public-proof"])
  ];
  const status = mergedPreviewStatus(...items.map((proofItem) => proofItem.status));
  const readyCount = items.filter((proofItem) => proofItem.status === "ready").length;
  const watchCount = items.filter((proofItem) => proofItem.status === "watch").length;
  const blockedCount = items.filter((proofItem) => proofItem.status === "blocked").length;
  const score = Math.round(items.reduce((sum, proofItem) => sum + rowStatusScore(proofItem.status), 0) / items.length);
  const claimRiskPriority: QuickClaimProofItem["id"][] = [
    "value-model",
    "measured-run",
    "public-proof",
    "agent-trust",
    "data-boundary",
    "workflow-scope",
    "approval-path",
    "procurement-choice"
  ];
  const firstClaimByPriority = (statusToFind: QuickBuyerRoomPreviewStatus) =>
    claimRiskPriority.map((id) => items.find((proofItem) => proofItem.id === id && proofItem.status === statusToFind)).find(Boolean);
  const firstOpen = firstClaimByPriority("blocked") ?? firstClaimByPriority("watch");
  const primaryRisk = firstOpen ? `${firstOpen.label}: ${firstOpen.risk}` : "Every buyer-facing claim has an attached proof path.";
  const headline =
    status === "ready"
      ? "Every buyer claim is traceable"
      : status === "watch"
        ? "Claim-proof ledger needs owner review"
        : "Claim-proof ledger blocks buyer sharing";
  const summary =
    status === "ready"
      ? `${readyCount}/${items.length} claims have source, proof, owner, and verification instructions.`
      : `${readyCount}/${items.length} claims ready. Next: ${firstOpen?.owner || "Proof owner"} must ${firstOpen?.nextAction.toLowerCase() || "repair the claim proof"}`;
  const csvText = [
    ["label", "status", "claim", "evidence", "source", "sourceStatus", "sourceLineNumber", "sourceLine", "proof", "owner", "verification", "risk", "nextAction", "href"].map(csvCell).join(","),
    ...items.map((proofItem) =>
      [
        proofItem.label,
        proofItem.status,
        proofItem.claim,
        proofItem.evidence,
        proofItem.source,
        proofItem.sourceStatus,
        proofItem.sourceLineNumber ?? "",
        proofItem.sourceLine,
        proofItem.proof,
        proofItem.owner,
        proofItem.verification,
        proofItem.risk,
        proofItem.nextAction,
        proofItem.href
      ].map(csvCell).join(",")
    )
  ].join("\n");
  const checksum = stablePacketHash(
    [
      input.buyer,
      input.workflow,
      status,
      score,
      summary,
      primaryRisk,
      csvText,
      ...items.map((proofItem) => `${proofItem.id}:${proofItem.status}:${proofItem.claim}:${proofItem.evidence}:${proofItem.proof}:${proofItem.nextAction}`)
    ].join("\n")
  );
  const receipt = {
    receiptId: `quick-claim-proof-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum
  };
  const receiptText = JSON.stringify(receipt, null, 2);
  const exportMarkdown = [
    "# Claim-proof ledger",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Score: ${score}/100`,
    `Ready: ${readyCount}/${items.length}`,
    `Watch: ${watchCount}`,
    `Blocked: ${blockedCount}`,
    `Primary risk: ${primaryRisk}`,
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    "",
    summary,
    "",
    "## Claims",
    ...items.flatMap((proofItem) => [
      `- [${proofItem.status}] ${proofItem.label}: ${proofItem.claim}`,
      `  Evidence: ${proofItem.evidence}`,
      `  Source: ${proofItem.source}`,
      `  Source status: ${proofItem.sourceStatus}`,
      `  Source line: ${proofItem.sourceLineNumber ? `L${proofItem.sourceLineNumber} ${proofItem.sourceLine}` : "missing"}`,
      `  Proof: ${proofItem.proof}`,
      `  Verification: ${proofItem.verification}`,
      `  Owner: ${proofItem.owner}`,
      `  Risk: ${proofItem.risk}`,
      `  Next action: ${proofItem.nextAction}`,
      `  Link: ${proofItem.href}`
    ])
  ].join("\n");

  return {
    status,
    headline,
    summary,
    score,
    readyCount,
    watchCount,
    blockedCount,
    primaryRisk,
    items,
    csvText,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    receipt,
    receiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(receiptText)}`
  };
}

function buildQuickBuyerPromiseGate(input: {
  buyer: string;
  workflow: string;
  handoffBrief: QuickBuyerHandoffBrief;
  economicsStressTest: QuickPilotEconomicsStressTest;
  claimProofLedger: QuickClaimProofLedger;
  proofRepairPlan: QuickProofRepairPlan;
  pilotContractTerms: QuickPilotContractTerms;
  procurementMatrix: QuickProcurementAlternativeMatrix;
}): QuickBuyerPromiseGate {
  const claim = (id: QuickClaimProofItem["id"]) => input.claimProofLedger.items.find((item) => item.id === id);
  const firstProofRepair = input.proofRepairPlan.items.find((item) => item.status !== "ready");
  const valueClaim = claim("value-model");
  const proofClaim = claim("public-proof");
  const agentClaim = claim("agent-trust");
  const procurementClaim = claim("procurement-choice");
  const riskFloor = input.economicsStressTest.riskAdjustedMonthlyValueYen;
  const budgetCap = input.pilotContractTerms.budgetCapYen;
  const recommended =
    input.procurementMatrix.alternatives.find((alternative) => alternative.id === input.procurementMatrix.recommendedAlternativeId) ??
    input.procurementMatrix.alternatives[0];
  const proofStatus: QuickBuyerRoomPreviewStatus =
    input.proofRepairPlan.repairCount === 0 ? "ready" : input.proofRepairPlan.readyCount > 0 ? "watch" : "blocked";
  const valueStatus = valueClaim?.status ?? input.economicsStressTest.status;
  const commercialStatus = mergedPreviewStatus(input.pilotContractTerms.status, input.procurementMatrix.status, procurementClaim?.status ?? "blocked");
  const items: QuickBuyerPromiseGateItem[] = [
    {
      id: "value-promise",
      label: "Value promise",
      status: valueStatus,
      allowedClaim:
        valueStatus === "ready"
          ? `${formatYen(riskFloor)}/month risk-adjusted floor from measured workflow evidence.`
          : "Internal only: do not quote a monthly yen outcome yet.",
      evidence: valueClaim?.evidence || input.economicsStressTest.summary,
      blockedClaim: "Do not claim guaranteed ROI or a monthly yen result without traced measured minutes, volume, adoption, and cost.",
      nextAction:
        valueStatus === "ready"
          ? "Keep the downside economics and source trace attached to the buyer packet."
          : valueClaim?.nextAction || input.economicsStressTest.scenarios.find((scenario) => scenario.status !== "ready")?.action || "Repair the measured value model.",
      href: valueClaim?.href || "#buyer-value-simulator"
    },
    {
      id: "proof-promise",
      label: "Proof promise",
      status: proofStatus,
      allowedClaim:
        proofStatus === "ready"
          ? "Five public proof artifacts are attached for final live verification."
          : `${input.proofRepairPlan.readyCount}/5 public proof artifacts are attached; keep this internal.`,
      evidence: proofClaim?.evidence || proofReadinessLine(input.proofRepairPlan),
      blockedClaim: "Do not say public proof is complete or live-verified while any proof URL is missing, placeholder, stale, or unverified.",
      nextAction:
        proofStatus === "ready"
          ? "Run live proof verification immediately before publishing the buyer promise."
          : firstProofRepair?.action || input.proofRepairPlan.summary,
      href: `#${QUICK_PROOF_REPAIR_PLAN_ID}`
    },
    {
      id: "agent-promise",
      label: "Agent necessity",
      status: agentClaim?.status ?? "blocked",
      allowedClaim:
        agentClaim?.status === "ready"
          ? "The workflow is backed by an accepted A2A trial receipt, not a generic assistant workflow."
          : "Do not position this as autonomous agent execution yet.",
      evidence: agentClaim?.evidence || "A2A trial receipt missing",
      blockedClaim: "Do not claim autonomous execution until an accepted A2A trial receipt with agent, skill, score, and artifact URL is attached.",
      nextAction: agentClaim?.nextAction || "Attach an accepted A2A trial receipt.",
      href: agentClaim?.href || "#agent-card-intake"
    },
    {
      id: "commercial-promise",
      label: "Commercial promise",
      status: commercialStatus,
      allowedClaim:
        commercialStatus === "ready"
          ? `Buyer can start with a ${formatYen(budgetCap)} capped A2A pilot; ${recommended?.label ?? "A2A pilot"} is the recommended path.`
          : "Do not route this as a paid pilot offer yet.",
      evidence: `${input.pilotContractTerms.summary} ${input.procurementMatrix.summary}`,
      blockedClaim: "Do not ask for budget until cap, stop rule, proof gate, and procurement alternative are defensible.",
      nextAction:
        commercialStatus === "ready"
          ? "Use the capped pilot ask only with the proof gate and stop rules attached."
          : input.pilotContractTerms.terms.find((term) => term.status !== "ready")?.acceptance || procurementClaim?.nextAction || "Repair commercial terms before buyer routing.",
      href: input.pilotContractTerms.contractHref
    }
  ];
  const status = mergedPreviewStatus(...items.map((item) => item.status));
  const readyCount = items.filter((item) => item.status === "ready").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const firstOpen = items.find((item) => item.status === "blocked") ?? items.find((item) => item.status === "watch");
  const safeUse =
    status === "ready"
      ? "Website-ready claim, pending final live proof check"
      : status === "watch"
        ? "Sponsor review only"
        : "Internal repair only";
  const publicPromise =
    status === "ready"
      ? `${input.handoffBrief.promise} Public-safe offer: ${formatYen(riskFloor)}/month floor, ${formatYen(budgetCap)} capped pilot, live proof check before publishing.`
      : status === "watch"
        ? `Internal-only promise draft: ${riskFloor > 0 ? `${formatYen(riskFloor)}/month floor is modeled` : "value is still being modeled"}, but ${firstOpen?.label ?? "proof"} must close before public use.`
        : `Do not publish a buyer value promise yet. ${firstOpen?.label ?? "Buyer proof"} is not defensible.`;
  const headline =
    status === "ready"
      ? "Buyer promise is safe to publish after live proof"
      : status === "watch"
        ? "Buyer promise needs owner review before public use"
        : "Buyer promise is not publishable yet";
  const nextAction =
    firstOpen?.nextAction ||
    "Run live proof verification, then reuse this promise in the public page and buyer handoff.";
  const notAllowedClaims = [
    ...items.filter((item) => item.status !== "ready").map((item) => item.blockedClaim),
    "Do not say live proof has passed until the live proof audit receipt is attached."
  ];
  const summary =
    status === "ready"
      ? `${readyCount}/${items.length} promise gates are backed by value, proof, A2A, and commercial evidence.`
      : `${readyCount}/${items.length} promise gates ready. Next: ${nextAction}`;
  const exportMarkdown = [
    "# Buyer promise gate",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Safe use: ${safeUse}`,
    `Ready: ${readyCount}/${items.length}`,
    `Blocked: ${blockedCount}`,
    "",
    headline,
    summary,
    "",
    "## Public-safe promise",
    publicPromise,
    "",
    "## Promise gates",
    ...items.map((item) => `- [${item.status}] ${item.label}: ${item.allowedClaim} Evidence: ${item.evidence} Next: ${item.nextAction}`),
    "",
    "## Do not claim yet",
    ...notAllowedClaims.map((claimText) => `- ${claimText}`)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    safeUse,
    publicPromise,
    nextAction,
    readyCount,
    blockedCount,
    notAllowedClaims,
    items,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickStakeholderApprovalRoute(input: {
  draft: WorkflowIntakeDraft;
  buyer: string;
  workflow: string;
  status: QuickBuyerRoomPreviewStatus;
  rows: QuickBuyerRoomPreviewRow[];
  handoffBrief: QuickBuyerHandoffBrief;
  decisionCase: QuickBuyerDecisionCase;
  economicsStressTest: QuickPilotEconomicsStressTest;
  proofRepairPlan: QuickProofRepairPlan;
  objectionBrief: QuickBuyerObjectionBrief;
}): QuickStakeholderApprovalRoute {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => input.rows.find((item) => item.id === id);
  const objection = (id: QuickBuyerObjectionItem["id"]) => input.objectionBrief.items.find((item) => item.id === id);
  const valueProof = objection("valueProof");
  const publicProof = objection("publicProof");
  const dataBoundary = objection("dataBoundary");
  const agentTrust = objection("agentTrust");
  const financeStatus = mergedPreviewStatus(input.economicsStressTest.status, valueProof?.status ?? "blocked");
  const securityStatus = dataBoundary?.status ?? row("data")?.status ?? "blocked";
  const pilotOwnerStatus = mergedPreviewStatus(row("pilot")?.status ?? "blocked", row("a2a")?.status ?? "blocked");
  const procurementStatus = mergedPreviewStatus(input.decisionCase.status, publicProof?.status ?? "blocked");
  const steps: QuickStakeholderApprovalStep[] = [
    {
      id: "finance",
      label: "Finance",
      status: financeStatus,
      owner: "Finance owner",
      gate: "Does the downside case still justify a paid pilot?",
      evidence:
        financeStatus === "blocked"
          ? input.economicsStressTest.summary
          : `Risk-adjusted floor ${formatYen(input.economicsStressTest.riskAdjustedMonthlyValueYen)}/month; range ${input.economicsStressTest.monthlyValueRange}.`,
      nextAction:
        financeStatus === "ready"
          ? "Share the downside/base/upside economics and ask for pilot budget approval."
          : financeStatus === "watch"
            ? "Have the sponsor review the economics before finance approval."
            : "Complete measured minutes, cycles/month, adoption rate, and hourly cost before finance review.",
      href: "#buyer-value-simulator"
    },
    {
      id: "security",
      label: "Security",
      status: securityStatus,
      owner: "Security owner",
      gate: "Can the proof leave the team without exposing private data?",
      evidence: dataBoundary?.evidence || row("data")?.proof || "Data boundary must be explicit.",
      nextAction:
        securityStatus === "ready"
          ? "Confirm the redacted evidence boundary before external sharing."
          : securityStatus === "watch"
            ? "Redact internal evidence and name the security reviewer."
            : "Get security approval for restricted data before any buyer sharing.",
      href: "#buyer-trust-center"
    },
    {
      id: "pilot-owner",
      label: "Pilot owner",
      status: pilotOwnerStatus,
      owner: input.draft.pilotRun.reviewerName || input.buyer,
      gate: "Is the measured run accepted enough to schedule a buyer pilot?",
      evidence: `${row("pilot")?.value || "Measured pilot missing"} / ${row("a2a")?.value || "A2A trial missing"}`,
      nextAction:
        pilotOwnerStatus === "ready"
          ? "Approve the supervised buyer pilot follow-up and keep the stop rule visible."
          : pilotOwnerStatus === "watch"
            ? "Review partial pilot evidence before scheduling the buyer session."
            : "Run the measured pilot and accepted A2A trial before assigning the buyer session.",
      href: "#pilot-run-receipt"
    },
    {
      id: "procurement",
      label: "Procurement",
      status: procurementStatus,
      owner: "Procurement owner",
      gate: "Is there enough public proof to route the decision case?",
      evidence: `${input.proofRepairPlan.readyCount}/5 public proof links; decision is ${input.decisionCase.decisionLabel}.`,
      nextAction:
        procurementStatus === "ready"
          ? "Route the decision case with proof links, stop rule, and live verification receipt."
          : procurementStatus === "watch"
            ? "Repair public proof gaps before procurement receives the packet."
            : "Hold procurement until the buyer decision case and public proof are no longer blocked.",
      href: "#launch-evidence-console"
    }
  ];
  const status = mergedPreviewStatus(...steps.map((step) => step.status));
  const readyCount = steps.filter((step) => step.status === "ready").length;
  const blockedCount = steps.filter((step) => step.status === "blocked").length;
  const firstOpenStep = steps.find((step) => step.status !== "ready");
  const headline =
    status === "ready"
      ? "Stakeholder approval route is board-ready"
      : status === "watch"
        ? "Stakeholder approval route needs owner review"
        : "Stakeholder approval route is blocked";
  const summary = firstOpenStep
    ? `${readyCount}/4 stakeholder gates ready for ${input.buyer}. Next: ${firstOpenStep.owner} must ${firstOpenStep.nextAction.toLowerCase()}`
    : `Finance, security, pilot owner, and procurement can review ${input.workflow} from the same proof packet.`;
  const routeText = [
    "# Stakeholder approval route",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Ready: ${readyCount}/4`,
    `Blocked: ${blockedCount}`,
    `Summary: ${summary}`,
    "",
    ...steps.map((step) => `- [${step.status}] ${step.label} (${step.owner})\n  Gate: ${step.gate}\n  Evidence: ${step.evidence}\n  Next action: ${step.nextAction}`)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    readyCount,
    blockedCount,
    steps,
    routeText,
    routeHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(routeText)}`
  };
}

function buildQuickPilotContractTerms(input: {
  draft: WorkflowIntakeDraft;
  buyer: string;
  workflow: string;
  rows: QuickBuyerRoomPreviewRow[];
  closeRule: string;
  decisionCase: QuickBuyerDecisionCase;
  economicsStressTest: QuickPilotEconomicsStressTest;
  approvalRoute: QuickStakeholderApprovalRoute;
  proofRepairPlan: QuickProofRepairPlan;
  objectionBrief: QuickBuyerObjectionBrief;
}): QuickPilotContractTerms {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => input.rows.find((item) => item.id === id);
  const approvalStep = (id: QuickStakeholderApprovalStep["id"]) => input.approvalRoute.steps.find((step) => step.id === id);
  const objection = (id: QuickBuyerObjectionItem["id"]) => input.objectionBrief.items.find((item) => item.id === id);
  const riskFloor = input.economicsStressTest.riskAdjustedMonthlyValueYen;
  const budgetCapYen = riskFloor > 0 ? Math.round(Math.max(50000, riskFloor * 0.35) / 1000) * 1000 : 0;
  const proofGateStatus = input.proofRepairPlan.repairCount === 0 ? "ready" : row("proof")?.status ?? "blocked";
  const dataStatus = approvalStep("security")?.status ?? row("data")?.status ?? "blocked";
  const stopRuleStatus = mergedPreviewStatus(row("pilot")?.status ?? "blocked", row("a2a")?.status ?? "blocked");
  const signatureStatus = input.approvalRoute.status;
  const terms: QuickPilotContractTerm[] = [
    {
      id: "commercial-cap",
      label: "Commercial cap",
      status: riskFloor > 0 ? input.economicsStressTest.status : "blocked",
      owner: "Finance owner",
      clause:
        budgetCapYen > 0
          ? `Pilot spend is capped at ${formatYen(budgetCapYen)} until the reviewer accepts the measured outcome.`
          : "Pilot spend is not offered until the value model has measured minutes, adoption, cycles, and hourly cost.",
      acceptance:
        riskFloor > 0
          ? `Risk-adjusted monthly floor remains at or above ${formatYen(riskFloor)}.`
          : "Measured economics must be attached before commercial approval.",
      evidence: input.economicsStressTest.summary,
      href: "#buyer-value-simulator"
    },
    {
      id: "scope-boundary",
      label: "Scope boundary",
      status: row("scope")?.status ?? "blocked",
      owner: input.buyer,
      clause: `Run only this workflow during the first pilot: ${input.workflow}`,
      acceptance: row("scope")?.proof || "Buyer, workflow, success metric, and baseline must be explicit.",
      evidence: row("scope")?.value || input.buyer,
      href: "#quick-workflow-intake"
    },
    {
      id: "proof-gate",
      label: "Proof gate",
      status: proofGateStatus,
      owner: "Proof owner",
      clause: "No external buyer review happens until deployed URL, ProtoPedia, walkthrough, pilot receipt, and work-order proof are attached.",
      acceptance: proofReadinessLine(input.proofRepairPlan),
      evidence: `${input.proofRepairPlan.readyCount}/5 proof links ready; ${input.proofRepairPlan.repairCount} need repair.`,
      href: `#${QUICK_PROOF_REPAIR_PLAN_ID}`
    },
    {
      id: "data-boundary",
      label: "Data boundary",
      status: dataStatus,
      owner: "Security owner",
      clause:
        input.draft.workOrder.dataSensitivity === "public"
          ? "Only public-safe or redacted evidence is used in the buyer session."
          : input.draft.workOrder.dataSensitivity === "restricted"
            ? "Restricted data cannot leave the team until the security owner signs the boundary."
            : "Internal evidence is redacted before external sharing.",
      acceptance: approvalStep("security")?.nextAction || objection("dataBoundary")?.answer || "Security owner confirms the data boundary.",
      evidence: objection("dataBoundary")?.evidence || row("data")?.proof || "Data boundary must be explicit.",
      href: "#buyer-trust-center"
    },
    {
      id: "stop-rule",
      label: "Stop rule",
      status: stopRuleStatus,
      owner: input.draft.pilotRun.reviewerName || input.buyer,
      clause: "Stop or revise the pilot if measured savings disappear, task acceptance falls below 50%, live proof fails, or the close rule is violated.",
      acceptance: input.closeRule,
      evidence: `${row("pilot")?.value || "Measured pilot missing"} / ${row("a2a")?.value || "A2A trial missing"}`,
      href: "#pilot-run-receipt"
    },
    {
      id: "signature-path",
      label: "Signature path",
      status: signatureStatus,
      owner: "Procurement owner",
      clause: "Finance, security, pilot owner, and procurement each approve their gate before a paid expansion is discussed.",
      acceptance: input.approvalRoute.summary,
      evidence: `${input.approvalRoute.readyCount}/4 stakeholder gates ready; decision is ${input.decisionCase.decisionLabel}.`,
      href: "#launch-evidence-console"
    }
  ];
  const status = mergedPreviewStatus(...terms.map((term) => term.status));
  const clearCount = terms.filter((term) => term.status === "ready").length;
  const blockedCount = terms.filter((term) => term.status === "blocked").length;
  const firstOpenTerm = terms.find((term) => term.status !== "ready");
  const headline =
    status === "ready"
      ? "Pilot contract terms are ready to send"
      : status === "watch"
        ? "Pilot contract terms need redlines"
        : "Pilot contract terms are not signable";
  const summary = firstOpenTerm
    ? `${clearCount}/6 terms clear. Next redline: ${firstOpenTerm.owner} must clear ${firstOpenTerm.label.toLowerCase()}.`
    : `${input.buyer} can review a bounded pilot with cap, scope, proof gate, data boundary, stop rule, and signatures.`;
  const effectiveWindow = "5 business days from pilot kickoff";
  const stopRules = [
    `Stop if risk-adjusted monthly value falls below ${formatYen(Math.round(riskFloor * 0.45))}.`,
    "Stop if accepted tasks fall below 50% on the first buyer-facing run.",
    `Stop if live proof verification fails after publishing. ${input.proofRepairPlan.repairCount} proof repair item${input.proofRepairPlan.repairCount === 1 ? "" : "s"} remain now.`,
    `Stop if the close rule is violated: ${input.closeRule}`
  ];
  const signatures = [
    `Buyer sponsor: ${input.draft.pilotRun.reviewerName || input.buyer}`,
    "Finance owner: approves commercial cap",
    "Security owner: approves data boundary",
    "Procurement owner: approves proof gate and signature path"
  ];
  const contractText = [
    "# Quick pilot contract terms",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Budget cap: ${budgetCapYen > 0 ? formatYen(budgetCapYen) : "not ready"}`,
    `Effective window: ${effectiveWindow}`,
    `Clear terms: ${clearCount}/6`,
    `Blocked terms: ${blockedCount}`,
    "",
    summary,
    "",
    "## Terms",
    ...terms.map((term) => `- [${term.status}] ${term.label} (${term.owner}): ${term.clause} Acceptance: ${term.acceptance} Evidence: ${term.evidence}`),
    "",
    "## Stop rules",
    ...stopRules.map((rule) => `- ${rule}`),
    "",
    "## Signatures",
    ...signatures.map((signature) => `- ${signature}`)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    budgetCapYen,
    effectiveWindow,
    clearCount,
    blockedCount,
    terms,
    stopRules,
    signatures,
    contractText,
    contractHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(contractText)}`
  };
}

function conservativePaybackDays(setupCostYen: number, monthlyValueYen: number) {
  if (setupCostYen <= 0 || monthlyValueYen <= 0) return null;
  return Math.max(1, Math.ceil((setupCostYen / monthlyValueYen) * 30));
}

function buildQuickProcurementAlternativeMatrix(input: {
  buyer: string;
  workflow: string;
  status: QuickBuyerRoomPreviewStatus;
  decisionCase: QuickBuyerDecisionCase;
  economicsStressTest: QuickPilotEconomicsStressTest;
  approvalRoute: QuickStakeholderApprovalRoute;
  pilotContractTerms: QuickPilotContractTerms;
  proofRepairPlan: QuickProofRepairPlan;
}): QuickProcurementAlternativeMatrix {
  const riskFloor = input.economicsStressTest.riskAdjustedMonthlyValueYen;
  const budgetCapYen = input.pilotContractTerms.budgetCapYen;
  const decisionBasisStatus = mergedPreviewStatus(input.status, input.decisionCase.status, input.economicsStressTest.status, input.approvalRoute.status, input.pilotContractTerms.status);
  const genericAiSetupCostYen = riskFloor > 0 ? Math.round(Math.max(30000, budgetCapYen * 0.45) / 1000) * 1000 : 0;
  const genericAiMonthlyValueYen = riskFloor > 0 ? Math.round((riskFloor * 0.28) / 1000) * 1000 : 0;
  const internalBuildSetupCostYen = riskFloor > 0 ? Math.round(Math.max(600000, budgetCapYen * 5) / 1000) * 1000 : 0;
  const internalBuildMonthlyValueYen = riskFloor > 0 ? Math.round((riskFloor * 0.72) / 1000) * 1000 : 0;
  const a2aPaybackDays = conservativePaybackDays(budgetCapYen, riskFloor);
  const alternatives: QuickProcurementAlternative[] = [
    {
      id: "a2a-pilot",
      label: "A2A pilot",
      status: decisionBasisStatus,
      monthlyValueYen: riskFloor,
      setupCostYen: budgetCapYen,
      paybackDays: a2aPaybackDays,
      proofReadiness: `${input.proofRepairPlan.readyCount}/5 proof links, ${input.approvalRoute.readyCount}/4 stakeholder gates`,
      risk:
        decisionBasisStatus === "blocked"
          ? "Cannot be bought until value, proof, approval, and contract gates stop blocking the case."
          : "Bounded by commercial cap, proof gate, data boundary, and pilot stop rules.",
      decision:
        decisionBasisStatus === "ready"
          ? "Recommended as the paid pilot path."
          : decisionBasisStatus === "watch"
            ? "Recommended after the open owner review is closed."
            : "Do not route to procurement yet.",
      evidence: `${input.economicsStressTest.summary} ${input.pilotContractTerms.summary}`
    },
    {
      id: "manual-status-quo",
      label: "Manual status quo",
      status: "watch",
      monthlyValueYen: 0,
      setupCostYen: 0,
      paybackDays: null,
      proofReadiness: "No new proof packet, no agent receipt, no procurement artifact.",
      risk: "Preserves the current manual cost and leaves proof gaps to be closed by people.",
      decision: decisionBasisStatus === "blocked" ? "Temporary fallback until evidence is repaired." : "Do not select if the measured savings are accepted.",
      evidence: "Baseline remains unchanged, so there is no defendable upside to approve."
    },
    {
      id: "generic-ai",
      label: "Generic AI assistant",
      status: riskFloor > 0 ? "watch" : "blocked",
      monthlyValueYen: genericAiMonthlyValueYen,
      setupCostYen: genericAiSetupCostYen,
      paybackDays: conservativePaybackDays(genericAiSetupCostYen, genericAiMonthlyValueYen),
      proofReadiness: input.proofRepairPlan.repairCount === 0 ? "Proof links can be reused, but no accepted A2A action receipt." : "Proof links still need repair before comparison.",
      risk: "Lower setup friction, but weaker ownership, weaker audit trail, and no bounded agent action contract.",
      decision: "Use only for personal drafting, not as the procurement choice for the buyer workflow.",
      evidence: "Estimated at 28% of the downside value because it lacks the A2A receipt, stop rule, and stakeholder route."
    },
    {
      id: "internal-build",
      label: "Internal build",
      status: riskFloor > 0 ? "watch" : "blocked",
      monthlyValueYen: internalBuildMonthlyValueYen,
      setupCostYen: internalBuildSetupCostYen,
      paybackDays: conservativePaybackDays(internalBuildSetupCostYen, internalBuildMonthlyValueYen),
      proofReadiness: "Can match the workflow later, but starts without the pilot proof packet or launch-room receipt.",
      risk: "Higher first cost and longer time to evidence before a buyer can approve the workflow.",
      decision: "Keep as a phase-two option after the pilot proves repeatable demand.",
      evidence: "Estimated at 72% of downside value with a minimum internal build cost of ¥600,000."
    }
  ];
  const recommendedAlternativeId: QuickProcurementAlternative["id"] =
    decisionBasisStatus === "blocked" || riskFloor <= 0 || !a2aPaybackDays ? "manual-status-quo" : "a2a-pilot";
  const recommendedAlternative = alternatives.find((alternative) => alternative.id === recommendedAlternativeId) ?? alternatives[0];
  const status = decisionBasisStatus;
  const headline =
    status === "ready"
      ? "A2A pilot is the procurement default"
      : status === "watch"
        ? "Procurement matrix needs owner review"
        : "Procurement choice is not defensible yet";
  const summary =
    recommendedAlternativeId === "a2a-pilot"
      ? `${input.buyer} gets the strongest proof-to-payback path: ${formatYen(riskFloor)}/month floor, ${formatYen(budgetCapYen)} cap, ${formatPaybackDays(a2aPaybackDays)} payback.`
      : "Manual status quo is the only defensible fallback until value, proof, approval, and contract evidence are repaired.";
  const exportMarkdown = [
    "# Procurement alternative matrix",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Recommended: ${recommendedAlternative.label}`,
    `Summary: ${summary}`,
    "",
    "## Alternatives",
    ...alternatives.map(
      (alternative) =>
        `- [${alternative.status}] ${alternative.label}: ${formatYen(alternative.monthlyValueYen)}/month floor, ${formatYen(alternative.setupCostYen)} setup, ${formatPaybackDays(alternative.paybackDays)} payback. Decision: ${alternative.decision} Proof: ${alternative.proofReadiness} Risk: ${alternative.risk} Evidence: ${alternative.evidence}`
    )
  ].join("\n");

  return {
    status,
    headline,
    summary,
    recommendedAlternativeId,
    alternatives,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickStakeholderApprovalEmailPack(input: {
  buyer: string;
  workflow: string;
  decisionCase: QuickBuyerDecisionCase;
  approvalRoute: QuickStakeholderApprovalRoute;
  pilotContractTerms: QuickPilotContractTerms;
  procurementMatrix: QuickProcurementAlternativeMatrix;
}): QuickStakeholderApprovalEmailPack {
  const compactWorkflow = input.workflow.length > 72 ? `${input.workflow.slice(0, 69)}...` : input.workflow;
  const recommended =
    input.procurementMatrix.alternatives.find((alternative) => alternative.id === input.procurementMatrix.recommendedAlternativeId) ??
    input.procurementMatrix.alternatives[0];
  const term = (id: QuickPilotContractTerm["id"]) => input.pilotContractTerms.terms.find((item) => item.id === id);
  const deadlineFor = (id: QuickStakeholderApprovalStep["id"]) => {
    if (id === "finance") return "Before pilot budget is offered";
    if (id === "security") return "Before proof leaves the internal workspace";
    if (id === "pilot-owner") return "Before Day 0 kickoff";
    return "Before procurement routing";
  };
  const replyTargetFor = (status: QuickBuyerRoomPreviewStatus) => {
    if (status === "ready") return "Approve the gate or name one required revision.";
    if (status === "watch") return "Confirm whether the current evidence is enough or name the missing review.";
    return "Name the exact evidence needed before this gate can proceed.";
  };
  const riskFor = (status: QuickBuyerRoomPreviewStatus) => {
    if (status === "ready") return "Without a recorded reply, the buyer room is not approved.";
    if (status === "watch") return "Owner review is still required before this gate counts as approved.";
    return "Do not route externally until this gate has new evidence.";
  };
  const evidenceFor = (step: QuickStakeholderApprovalStep) => {
    if (step.id === "finance") {
      const budgetCap = input.pilotContractTerms.budgetCapYen > 0 ? formatYen(input.pilotContractTerms.budgetCapYen) : "not ready";
      return `${step.evidence} Budget cap: ${budgetCap}.`;
    }
    if (step.id === "security") {
      return `${step.evidence} Data term: ${term("data-boundary")?.clause ?? "Data boundary must be signed."}`;
    }
    if (step.id === "pilot-owner") {
      return `${step.evidence} Stop rule: ${term("stop-rule")?.acceptance ?? "Stop rule must stay visible."}`;
    }
    return `${step.evidence} Recommended path: ${recommended.label}. ${input.procurementMatrix.summary}`;
  };
  const messages: QuickStakeholderApprovalEmail[] = input.approvalRoute.steps.map((step) => {
    const subject = `A2A pilot approval: ${step.label} gate for ${input.buyer}`;
    const evidence = evidenceFor(step);
    const replyTarget = replyTargetFor(step.status);
    const risk = riskFor(step.status);
    const body = [
      `Hi ${step.owner},`,
      "",
      `Please review the ${step.label.toLowerCase()} gate for ${input.buyer}.`,
      `Workflow: ${compactWorkflow}`,
      `Current status: ${step.status}`,
      `Decision question: ${input.decisionCase.buyerQuestion}`,
      `Ask: ${step.nextAction}`,
      `Evidence: ${evidence}`,
      `Contract guardrail: ${input.pilotContractTerms.summary}`,
      `Reply needed: ${replyTarget}`,
      `Deadline: ${deadlineFor(step.id)}`,
      `Fail-closed rule: ${risk}`,
      "",
      "Reply with approve, revise, or block. If you block, name the exact evidence needed."
    ].join("\n");

    return {
      id: step.id,
      label: step.label,
      status: step.status,
      owner: step.owner,
      subject,
      body,
      mailtoHref: mailtoHref(subject, body),
      replyTarget,
      evidence,
      risk
    };
  });
  const status = input.approvalRoute.status;
  const next = messages.find((message) => message.status !== "ready") ?? messages[0];
  const headline =
    status === "ready"
      ? "Approval email pack is ready to send"
      : status === "watch"
        ? "Approval email pack needs owner review"
        : "Approval email pack is blocked";
  const summary = next
    ? `Next message: ${next.owner} must ${next.replyTarget.toLowerCase()}`
    : `${input.buyer} has finance, security, pilot owner, and procurement messages ready.`;
  const approvalDeadline = next?.id ? deadlineFor(next.id) : "Before buyer review";
  const exportMarkdown = [
    "# Stakeholder approval email pack",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Next recipient: ${next?.owner ?? "All stakeholders"}`,
    `Deadline: ${approvalDeadline}`,
    `Summary: ${summary}`,
    "",
    ...messages.flatMap((message) => [
      `## ${message.label} - ${message.status}`,
      `Owner: ${message.owner}`,
      `Subject: ${message.subject}`,
      `Reply needed: ${message.replyTarget}`,
      `Evidence: ${message.evidence}`,
      `Risk: ${message.risk}`,
      "",
      message.body,
      ""
    ])
  ].join("\n");

  return {
    status,
    headline,
    summary,
    nextRecipient: next?.owner ?? "All stakeholders",
    approvalDeadline,
    messages,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickAdoptionSuccessPlan(input: {
  draft: WorkflowIntakeDraft;
  buyer: string;
  workflow: string;
  rows: QuickBuyerRoomPreviewRow[];
  economicsStressTest: QuickPilotEconomicsStressTest;
  approvalRoute: QuickStakeholderApprovalRoute;
  procurementMatrix: QuickProcurementAlternativeMatrix;
  proofRepairPlan: QuickProofRepairPlan;
}): QuickAdoptionSuccessPlan {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => input.rows.find((item) => item.id === id);
  const riskFloor = input.economicsStressTest.riskAdjustedMonthlyValueYen;
  const retainedMonthlyValueYen = riskFloor > 0 ? Math.round((riskFloor * 0.75) / 1000) * 1000 : 0;
  const adoptionTargetPercent = clampPercent(input.draft.buyerScenario.adoptionRatePercent || 0);
  const acceptedRate =
    input.draft.pilotRun.acceptedTasks && input.draft.pilotRun.totalTasks
      ? clampPercent((input.draft.pilotRun.acceptedTasks / input.draft.pilotRun.totalTasks) * 100)
      : 0;
  const acceptanceFloorPercent = acceptedRate > 0 ? Math.max(50, Math.min(90, acceptedRate - 10)) : 0;
  const proofStatus: QuickBuyerRoomPreviewStatus =
    input.proofRepairPlan.repairCount === 0 ? "ready" : input.proofRepairPlan.readyCount > 0 ? "watch" : "blocked";
  const usageStatus = mergedPreviewStatus(row("value")?.status ?? "blocked", row("pilot")?.status ?? "blocked");
  const trustStatus = mergedPreviewStatus(row("a2a")?.status ?? "blocked", row("data")?.status ?? "blocked");
  const metrics: QuickAdoptionSuccessMetric[] = [
    {
      id: "value-retention",
      label: "Value retention",
      status: retainedMonthlyValueYen > 0 ? input.economicsStressTest.status : "blocked",
      owner: "Finance owner",
      target: retainedMonthlyValueYen > 0 ? `Retain at least ${formatYen(retainedMonthlyValueYen)}/month by Day 30.` : "Measure retained monthly value before expansion.",
      evidence: input.economicsStressTest.summary,
      action:
        retainedMonthlyValueYen > 0
          ? "Recalculate the downside case after the first month of repeated use."
          : "Attach measured minutes, cycles, adoption, and hourly cost before the adoption plan is usable."
    },
    {
      id: "repeat-usage",
      label: "Repeat usage",
      status: usageStatus,
      owner: input.draft.pilotRun.reviewerName || input.buyer,
      target:
        adoptionTargetPercent > 0 && input.draft.buyerScenario.cyclesPerMonth
          ? `${input.draft.buyerScenario.cyclesPerMonth} cycles/month with ${adoptionTargetPercent}% active use.`
          : "Record cycle frequency and adoption target before rollout.",
      evidence: `${row("value")?.value || "Value model missing"} / ${row("pilot")?.value || "Measured pilot missing"}`,
      action: usageStatus === "ready" ? "Keep repeat usage visible through the Day 7 check." : "Close value and pilot evidence before rollout."
    },
    {
      id: "proof-freshness",
      label: "Proof freshness",
      status: proofStatus,
      owner: "Proof owner",
      target: "All five public proof links pass live verification again at Day 30.",
      evidence: `${input.proofRepairPlan.readyCount}/5 public proof links ready; ${input.proofRepairPlan.repairCount} repair item${input.proofRepairPlan.repairCount === 1 ? "" : "s"} remain.`,
      action: proofStatus === "ready" ? "Recheck proof immediately before the Day 30 decision." : "Repair public proof before any expansion ask."
    },
    {
      id: "owner-commitment",
      label: "Owner commitment",
      status: input.approvalRoute.status,
      owner: "Pilot owner",
      target: "Finance, security, pilot owner, and procurement keep their gate owners named.",
      evidence: input.approvalRoute.summary,
      action: input.approvalRoute.status === "ready" ? "Use the route as the standing operating review list." : "Close the open stakeholder gate before rollout."
    },
    {
      id: "trust-boundary",
      label: "Trust boundary",
      status: trustStatus,
      owner: input.draft.agentTrialEvidence?.agentName || "A2A operator",
      target: acceptanceFloorPercent > 0 ? `Keep task acceptance at or above ${acceptanceFloorPercent}% and preserve the data boundary.` : "Measure accepted tasks and data boundary before expansion.",
      evidence: `${row("a2a")?.value || "A2A trial missing"} / ${row("data")?.proof || "Data boundary missing"}`,
      action: trustStatus === "ready" ? "Keep the accepted A2A receipt and data boundary attached to the review." : "Repair agent trust and data boundary before expanding."
    }
  ];
  const checkpoints: QuickAdoptionSuccessCheckpoint[] = [
    {
      id: "day-0",
      window: "Day 0",
      label: "Operating owner kickoff",
      status: input.approvalRoute.status,
      owner: input.draft.pilotRun.reviewerName || input.buyer,
      objective: `Assign the operating owner and baseline for ${input.workflow}.`,
      evidence: input.approvalRoute.summary,
      exitCriteria: "Owner can name the metric, proof packet, stop rule, and next review date.",
      href: "#buyer-launch-handoff"
    },
    {
      id: "day-7",
      window: "Day 7",
      label: "Repeat usage check",
      status: usageStatus,
      owner: input.draft.agentTrialEvidence?.agentName || "Pilot operator",
      objective: "Confirm the workflow repeats outside the initial supervised run.",
      evidence: `${row("pilot")?.value || "Measured pilot missing"} / ${row("value")?.value || "Value model missing"}`,
      exitCriteria: acceptanceFloorPercent > 0 ? `Accepted task rate stays at or above ${acceptanceFloorPercent}%.` : "Accepted task rate is measured.",
      href: "#pilot-run-receipt"
    },
    {
      id: "day-14",
      window: "Day 14",
      label: "Value health review",
      status: retainedMonthlyValueYen > 0 ? input.economicsStressTest.status : "blocked",
      owner: "Finance owner",
      objective: "Compare repeated use against the downside economics.",
      evidence: input.economicsStressTest.monthlyValueRange,
      exitCriteria: retainedMonthlyValueYen > 0 ? `Retained value is at least ${formatYen(retainedMonthlyValueYen)}/month.` : "Monthly retained value is measurable.",
      href: "#buyer-value-simulator"
    },
    {
      id: "day-30",
      window: "Day 30",
      label: "Expand or stop decision",
      status: mergedPreviewStatus(input.procurementMatrix.status, proofStatus, input.approvalRoute.status),
      owner: "Procurement owner",
      objective: "Decide whether to expand, revise, or stop with current proof attached.",
      evidence: input.procurementMatrix.summary,
      exitCriteria: "Expansion is approved only if value, proof, trust boundary, and owners remain current.",
      href: "#launch-evidence-console"
    }
  ];
  const status = mergedPreviewStatus(...metrics.map((metric) => metric.status), ...checkpoints.map((checkpoint) => checkpoint.status));
  const readyCount = metrics.filter((metric) => metric.status === "ready").length;
  const blockedCount = metrics.filter((metric) => metric.status === "blocked").length;
  const firstOpenMetric = metrics.find((metric) => metric.status !== "ready");
  const reviewWindow = "Day 30 operating review";
  const headline =
    status === "ready"
      ? "30-day adoption plan is expansion-ready"
      : status === "watch"
        ? "30-day adoption plan needs owner review"
        : "30-day adoption plan is not operable yet";
  const summary = firstOpenMetric
    ? `${readyCount}/5 adoption metrics ready. Next: ${firstOpenMetric.owner} must ${firstOpenMetric.action.toLowerCase()}`
    : `${input.buyer} has Day 0/7/14/30 checkpoints tied to retained value, repeat usage, proof freshness, owner commitment, and trust boundary.`;
  const renewalAsk =
    status === "ready"
      ? `Approve expansion after ${reviewWindow} if retained value stays above ${formatYen(retainedMonthlyValueYen)}/month.`
      : `Hold expansion until ${firstOpenMetric?.label.toLowerCase() || "adoption"} is ready.`;
  const expansionCriteria = [
    retainedMonthlyValueYen > 0 ? `Retained value stays at or above ${formatYen(retainedMonthlyValueYen)}/month by Day 30.` : "Retained monthly value is measured before expansion.",
    acceptanceFloorPercent > 0 ? `Accepted task rate stays at or above ${acceptanceFloorPercent}% on repeated runs.` : "Accepted task rate is measured before expansion.",
    "All five public proof links pass live verification at the Day 30 review.",
    "Finance, security, pilot owner, and procurement keep their approval route current."
  ];
  const exportMarkdown = [
    "# 30-day adoption success plan",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Review window: ${reviewWindow}`,
    `Adoption target: ${adoptionTargetPercent > 0 ? `${adoptionTargetPercent}%` : "not ready"}`,
    `Retained value threshold: ${retainedMonthlyValueYen > 0 ? `${formatYen(retainedMonthlyValueYen)}/month` : "not ready"}`,
    `Renewal ask: ${renewalAsk}`,
    "",
    summary,
    "",
    "## Health metrics",
    ...metrics.map((metric) => `- [${metric.status}] ${metric.label} (${metric.owner}): ${metric.target} Evidence: ${metric.evidence} Action: ${metric.action}`),
    "",
    "## Checkpoints",
    ...checkpoints.map(
      (checkpoint) =>
        `- [${checkpoint.status}] ${checkpoint.window} ${checkpoint.label} (${checkpoint.owner}): ${checkpoint.objective} Exit: ${checkpoint.exitCriteria} Evidence: ${checkpoint.evidence}`
    ),
    "",
    "## Expansion criteria",
    ...expansionCriteria.map((criterion) => `- ${criterion}`)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    reviewWindow,
    adoptionTargetPercent,
    retainedMonthlyValueYen,
    readyCount,
    blockedCount,
    renewalAsk,
    metrics,
    checkpoints,
    expansionCriteria,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickPilotProofContract(input: {
  buyer: string;
  workflow: string;
  decisionCase: QuickBuyerDecisionCase;
  handoffBrief: QuickBuyerHandoffBrief;
  economicsStressTest: QuickPilotEconomicsStressTest;
  proofRepairPlan: QuickProofRepairPlan;
  pilotContractTerms: QuickPilotContractTerms;
  procurementMatrix: QuickProcurementAlternativeMatrix;
  adoptionSuccessPlan: QuickAdoptionSuccessPlan;
}): QuickPilotProofContract {
  const term = (id: QuickPilotContractTerm["id"]) => input.pilotContractTerms.terms.find((item) => item.id === id);
  const commercialCap = term("commercial-cap");
  const proofGate = term("proof-gate");
  const stopRule = term("stop-rule");
  const repairProofItems = input.proofRepairPlan.items.filter((item) => item.status !== "ready");
  const proofAction =
    repairProofItems.length > 0
      ? `${proofRepairActionVerb(repairProofItems)} ${labelList(repairProofItems.map((item) => item.label))} before buyer sharing.`
      : "Recheck live proof before the buyer room is sent.";
  const recommended =
    input.procurementMatrix.alternatives.find((alternative) => alternative.id === input.procurementMatrix.recommendedAlternativeId) ??
    input.procurementMatrix.alternatives[0];
  const valueFloor =
    input.economicsStressTest.riskAdjustedMonthlyValueYen > 0
      ? `${formatYen(input.economicsStressTest.riskAdjustedMonthlyValueYen)}/month risk-adjusted floor`
      : "Value floor not ready";
  const budgetCap = input.pilotContractTerms.budgetCapYen > 0 ? `${formatYen(input.pilotContractTerms.budgetCapYen)} pilot cap` : "Budget cap not ready";
  const items: QuickPilotProofContractItem[] = [
    {
      id: "buyer-promise",
      label: "Buyer promise",
      status: input.decisionCase.status,
      owner: input.decisionCase.status === "ready" ? input.buyer : input.decisionCase.owner,
      value: input.handoffBrief.promise,
      detail: input.decisionCase.buyerQuestion,
      action: input.decisionCase.status === "ready" ? "Use this as the first line of the pilot ask." : input.decisionCase.nextAction,
      href: input.decisionCase.caseHref
    },
    {
      id: "value-floor",
      label: "Value floor",
      status: input.economicsStressTest.status,
      owner: "Finance owner",
      value: valueFloor,
      detail: input.economicsStressTest.monthlyValueRange,
      action:
        input.economicsStressTest.status === "ready"
          ? "Keep the downside case attached to the buyer decision."
          : input.economicsStressTest.scenarios.find((scenario) => scenario.status !== "ready")?.action || "Repair the value model before buyer review.",
      href: input.economicsStressTest.exportHref
    },
    {
      id: "proof-gate",
      label: "Proof gate",
      status: proofGate?.status ?? "blocked",
      owner: proofGate?.owner ?? "Proof owner",
      value: proofReadinessLine(input.proofRepairPlan),
      detail: proofGate?.clause ?? "Public proof must be attached before external review.",
      action: proofAction,
      href: proofGate?.href ?? `#${QUICK_PROOF_REPAIR_PLAN_ID}`
    },
    {
      id: "budget-cap",
      label: "Budget cap",
      status: commercialCap?.status ?? "blocked",
      owner: commercialCap?.owner ?? "Finance owner",
      value: budgetCap,
      detail: commercialCap?.clause ?? "Pilot spend is not offered until value is measurable.",
      action: commercialCap?.acceptance ?? "Attach measured economics before commercial approval.",
      href: commercialCap?.href ?? "#buyer-value-simulator"
    },
    {
      id: "stop-rule",
      label: "Stop rule",
      status: stopRule?.status ?? "blocked",
      owner: stopRule?.owner ?? input.buyer,
      value: "Stop or revise before expansion",
      detail: stopRule?.clause ?? "Stop the pilot if measured value, proof, or trust falls below the floor.",
      action: stopRule?.acceptance ?? input.pilotContractTerms.stopRules[0] ?? "Keep the stop rule visible through the buyer review.",
      href: stopRule?.href ?? "#pilot-run-receipt"
    },
    {
      id: "renewal-rule",
      label: "Renewal rule",
      status: input.adoptionSuccessPlan.status,
      owner: "Procurement owner",
      value: input.adoptionSuccessPlan.renewalAsk,
      detail: input.adoptionSuccessPlan.expansionCriteria[0] ?? input.procurementMatrix.summary,
      action:
        input.adoptionSuccessPlan.status === "ready"
          ? "Use the Day 30 review as the expansion gate."
          : input.adoptionSuccessPlan.metrics.find((metric) => metric.status !== "ready")?.action || "Close the adoption plan before expansion.",
      href: input.adoptionSuccessPlan.exportHref
    }
  ];
  const status = mergedPreviewStatus(...items.map((item) => item.status), input.procurementMatrix.status);
  const firstOpenItem = items.find((item) => item.status !== "ready");
  const nextOwner = firstOpenItem?.owner ?? "Proof owner";
  const nextAction = firstOpenItem?.action ?? "Run live proof verification before sending the buyer room.";
  const headline =
    status === "ready"
      ? "Pilot proof contract is buyer-defensible"
      : status === "watch"
        ? "Pilot proof contract needs owner review"
        : "Pilot proof contract is not defensible";
  const summary =
    status === "ready"
      ? `${input.buyer} can inspect promise, cap, proof gate, stop rule, and Day 30 renewal criteria without reading the full room.`
      : `Next: ${nextOwner} - ${nextAction}`;
  const exportMarkdown = [
    "# Pilot proof contract",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Decision: ${input.decisionCase.decisionLabel}`,
    `Recommended path: ${recommended.label}`,
    `Buyer promise: ${input.handoffBrief.promise}`,
    `Value floor: ${valueFloor}`,
    `Budget cap: ${budgetCap}`,
    `Renewal ask: ${input.adoptionSuccessPlan.renewalAsk}`,
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`,
    "",
    "## Contract rows",
    ...items.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.value}. ${item.detail} Action: ${item.action}`)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    nextOwner,
    nextAction,
    buyerPromise: input.handoffBrief.promise,
    valueFloor,
    budgetCap,
    renewalAsk: input.adoptionSuccessPlan.renewalAsk,
    items,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickRolloutCommandBoard(input: {
  draft: WorkflowIntakeDraft;
  buyer: string;
  workflow: string;
  pilotWeekPlan: QuickPilotWeekPlanStep[];
  proofRepairPlan: QuickProofRepairPlan;
  approvalRoute: QuickStakeholderApprovalRoute;
  adoptionSuccessPlan: QuickAdoptionSuccessPlan;
  procurementMatrix: QuickProcurementAlternativeMatrix;
}): QuickRolloutCommandBoard {
  const checkpoint = (id: QuickAdoptionSuccessCheckpoint["id"]) => input.adoptionSuccessPlan.checkpoints.find((item) => item.id === id);
  const pilotStep = (id: QuickPilotWeekPlanStep["id"]) => input.pilotWeekPlan.find((item) => item.id === id);
  const day0 = checkpoint("day-0");
  const day7 = checkpoint("day-7");
  const day14 = checkpoint("day-14");
  const day30 = checkpoint("day-30");
  const kickoffStatus: QuickBuyerRoomPreviewStatus =
    input.draft.workOrder.targetUser && input.draft.workOrder.request && input.draft.pilotRun.reviewerName
      ? "ready"
      : input.draft.workOrder.targetUser && input.draft.workOrder.request
        ? "watch"
        : "blocked";
  const proofStatus: QuickBuyerRoomPreviewStatus =
    input.proofRepairPlan.repairCount === 0 ? "ready" : input.proofRepairPlan.readyCount > 0 ? "watch" : "blocked";
  const proofOwner = input.proofRepairPlan.items.find((item) => item.status !== "ready")?.owner || "Proof owner";
  const proofAction =
    input.proofRepairPlan.repairCount === 0
      ? "Run the final live proof check and attach the receipt to the launch room."
      : `${proofRepairActionVerb(input.proofRepairPlan.items.filter((item) => item.status !== "ready"))} ${labelList(
          input.proofRepairPlan.items.filter((item) => item.status !== "ready").map((item) => item.label)
        )}, then rerun live verification.`;
  const commands: QuickRolloutCommand[] = [
    {
      id: "kickoff",
      window: "Day 0",
      label: "Owner kickoff",
      status: kickoffStatus,
      owner: day0?.owner || input.draft.pilotRun.reviewerName || input.buyer,
      command: `Open the pilot kickoff and assign the operating owner for ${sentence(input.workflow)}`,
      evidence: day0?.exitCriteria || input.approvalRoute.summary,
      risk: kickoffStatus === "ready" ? "Owner, metric, proof packet, and review date are named." : "Rollout starts without a named operating owner.",
      href: day0?.href || "#buyer-launch-handoff"
    },
    {
      id: "proof-recheck",
      window: "Day 3",
      label: "Proof recheck",
      status: proofStatus,
      owner: proofOwner,
      command: proofAction,
      evidence: `${input.proofRepairPlan.readyCount}/5 public proof links ready; ${input.proofRepairPlan.repairCount} repair item${input.proofRepairPlan.repairCount === 1 ? "" : "s"}.`,
      risk: proofStatus === "ready" ? "Buyer can inspect current public proof." : "External sharing can stall because proof links are missing or stale.",
      href: `#${QUICK_PROOF_REPAIR_PLAN_ID}`
    },
    {
      id: "usage-review",
      window: "Day 7",
      label: "Usage review",
      status: day7?.status ?? pilotStep("trial")?.status ?? "blocked",
      owner: day7?.owner || input.draft.agentTrialEvidence?.agentName || "Pilot operator",
      command: "Compare the first repeated run against the supervised pilot receipt.",
      evidence: day7?.exitCriteria || pilotStep("trial")?.acceptance || "Accepted task rate is measured.",
      risk: day7?.status === "ready" ? "Repeated use can be defended with accepted task evidence." : "Pilot may remain a one-off demo instead of an operating workflow.",
      href: day7?.href || "#pilot-run-receipt"
    },
    {
      id: "value-review",
      window: "Day 14",
      label: "Value review",
      status: day14?.status ?? input.adoptionSuccessPlan.status,
      owner: day14?.owner || "Finance owner",
      command: "Recalculate retained value against the downside economics before any expansion ask.",
      evidence: day14?.exitCriteria || input.adoptionSuccessPlan.renewalAsk,
      risk: day14?.status === "ready" ? "Finance can see whether value survives repeat usage." : "The buyer may approve activity without retained value.",
      href: day14?.href || "#buyer-value-simulator"
    },
    {
      id: "expansion-decision",
      window: "Day 30",
      label: "Expand or stop",
      status: day30?.status ?? input.procurementMatrix.status,
      owner: day30?.owner || "Procurement owner",
      command: "Record expand, revise, or stop with the current proof packet and procurement comparison attached.",
      evidence: day30?.exitCriteria || input.procurementMatrix.summary,
      risk: day30?.status === "ready" ? "The paid-pilot decision has value, proof, trust, and owner evidence." : "Expansion would be a sales ask, not an evidence-backed decision.",
      href: day30?.href || "#launch-evidence-console"
    }
  ];
  const status = mergedPreviewStatus(...commands.map((command) => command.status));
  const readyCount = commands.filter((command) => command.status === "ready").length;
  const blockedCount = commands.filter((command) => command.status === "blocked").length;
  const next = commands.find((command) => command.status !== "ready") ?? commands[0];
  const ownerLoads = commands.reduce<QuickRolloutOwnerLoad[]>((loads, command) => {
    const existing = loads.find((load) => load.owner === command.owner);
    if (existing) {
      existing.commandCount += 1;
      if (command.status === "blocked") existing.blockedCount += 1;
      if (existing.nextCommand === "Ready" && command.status !== "ready") existing.nextCommand = command.command;
      return loads;
    }
    loads.push({
      owner: command.owner,
      commandCount: 1,
      blockedCount: command.status === "blocked" ? 1 : 0,
      nextCommand: command.status === "ready" ? "Ready" : command.command
    });
    return loads;
  }, []);
  const headline =
    status === "ready"
      ? "Rollout command board is ready"
      : status === "watch"
        ? "Rollout command board needs owner review"
        : "Rollout command board is blocked";
  const summary =
    status === "ready"
      ? `${input.buyer} has Day 0/3/7/14/30 commands with owners, evidence, and risks attached.`
      : `${readyCount}/5 rollout commands ready. Next: ${next.owner} must ${next.command.toLowerCase()}`;
  const taskCsvText = [
    ["window", "label", "status", "owner", "command", "evidence", "risk", "href"].map(csvCell).join(","),
    ...commands.map((command) => [command.window, command.label, command.status, command.owner, command.command, command.evidence, command.risk, command.href].map(csvCell).join(","))
  ].join("\n");
  const ownerBriefText = [
    "# Rollout owner brief",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Next owner: ${next.owner}`,
    `Next command: ${next.command}`,
    "",
    "## Owner workload",
    ...ownerLoads.map((load) => `- ${load.owner}: ${load.commandCount} command${load.commandCount === 1 ? "" : "s"}, ${load.blockedCount} blocked. Next: ${load.nextCommand}`),
    "",
    "## Commands",
    ...commands.map((command) => `- [${command.status}] ${command.window} ${command.label}: ${command.owner} must ${command.command} Evidence: ${command.evidence} Risk: ${command.risk}`)
  ].join("\n");
  const checksum = stablePacketHash(
    [
      input.buyer,
      input.workflow,
      status,
      summary,
      taskCsvText,
      ownerBriefText,
      ...commands.map((command) => `${command.id}:${command.window}:${command.status}:${command.owner}:${command.command}:${command.evidence}:${command.risk}:${command.href}`),
      ...ownerLoads.map((load) => `${load.owner}:${load.commandCount}:${load.blockedCount}:${load.nextCommand}`)
    ].join("\n")
  );
  const receipt = {
    receiptId: `quick-rollout-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum
  };
  const receiptText = JSON.stringify(receipt, null, 2);
  const exportMarkdown = [
    "# Rollout command board",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Ready: ${readyCount}/5`,
    `Blocked: ${blockedCount}`,
    `Next owner: ${next.owner}`,
    `Next command: ${next.command}`,
    "",
    summary,
    "",
    "## Commands",
    ...commands.map((command) => `- [${command.status}] ${command.window} ${command.label} (${command.owner}): ${command.command} Evidence: ${command.evidence} Risk: ${command.risk}`),
    "",
    "## Owner workload",
    ...ownerLoads.map((load) => `- ${load.owner}: ${load.commandCount} command${load.commandCount === 1 ? "" : "s"}, ${load.blockedCount} blocked. Next: ${load.nextCommand}`),
    "",
    "## Import artifacts",
    `Task CSV receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    "Task CSV columns: window, label, status, owner, command, evidence, risk, href",
    "Owner brief: paste into the next owner handoff thread before the pilot starts."
  ].join("\n");

  return {
    status,
    headline,
    summary,
    readyCount,
    blockedCount,
    nextOwner: next.owner,
    nextCommand: next.command,
    commands,
    ownerLoads,
    taskCsvText,
    taskCsvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(taskCsvText)}`,
    ownerBriefText,
    ownerBriefHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(ownerBriefText)}`,
    receipt,
    receiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(receiptText)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

const ROLLOUT_COMMAND_DAY_OFFSETS: Record<QuickRolloutCommand["window"], number> = {
  "Day 0": 0,
  "Day 3": 3,
  "Day 7": 7,
  "Day 14": 14,
  "Day 30": 30
};

function parseIsoDateOnly(value: string) {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10) === trimmed ? date : null;
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function compactIcsDate(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function foldIcsLine(line: string) {
  const maxLength = 74;
  if (line.length <= maxLength) return line;
  const chunks = [];
  let remaining = line;
  while (remaining.length > maxLength) {
    chunks.push(remaining.slice(0, maxLength));
    remaining = ` ${remaining.slice(maxLength)}`;
  }
  chunks.push(remaining);
  return chunks.join("\r\n");
}

export function buildQuickRolloutCalendarExport(board: QuickRolloutCommandBoard, startDate: string): QuickRolloutCalendarExport | null {
  const start = parseIsoDateOnly(startDate);
  if (!start) return null;
  const events = board.commands.map((command) => {
    const eventStart = addUtcDays(start, ROLLOUT_COMMAND_DAY_OFFSETS[command.window]);
    const eventEnd = addUtcDays(eventStart, 1);
    return {
      command,
      eventStart,
      eventEnd
    };
  });
  const endDate = events.length > 0 ? events[events.length - 1].eventStart.toISOString().slice(0, 10) : startDate;
  const checksumSource = [
    startDate,
    endDate,
    board.status,
    board.nextOwner,
    board.nextCommand,
    ...events.map(({ command, eventStart }) => `${compactIcsDate(eventStart)}:${command.id}:${command.status}:${command.owner}:${command.command}:${command.evidence}:${command.risk}`)
  ].join("\n");
  const checksum = stablePacketHash(checksumSource);
  const receipt = {
    receiptId: `quick-rollout-calendar-${board.status}-${compactIcsDate(start)}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum
  };
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//Quick Rollout//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap(({ command, eventStart, eventEnd }) => [
      "BEGIN:VEVENT",
      `UID:${command.id}-${compactIcsDate(eventStart)}-${checksum}@a2a-agent-marketplace`,
      `DTSTAMP:${compactIcsDate(start)}T000000Z`,
      `DTSTART;VALUE=DATE:${compactIcsDate(eventStart)}`,
      `DTEND;VALUE=DATE:${compactIcsDate(eventEnd)}`,
      `SUMMARY:${escapeIcsText(`${command.window} ${command.label} - ${command.owner}`)}`,
      `DESCRIPTION:${escapeIcsText(`Status: ${command.status}\nCommand: ${command.command}\nEvidence: ${command.evidence}\nRisk: ${command.risk}\nReceipt: ${receipt.receiptId}`)}`,
      `X-A2A-HREF:${escapeIcsText(command.href)}`,
      "END:VEVENT"
    ]),
    "END:VCALENDAR"
  ];
  const icsText = icsLines.map(foldIcsLine).join("\r\n");
  const receiptText = JSON.stringify(receipt, null, 2);

  return {
    startDate,
    endDate,
    eventCount: events.length,
    icsText,
    icsHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsText)}`,
    receipt,
    receiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(receiptText)}`
  };
}

function quickAgendaStatus(status: QuickBuyerRoomPreviewStatus): BuyerDecisionAgendaStatus {
  if (status === "ready") return "ready";
  if (status === "watch") return "attention";
  return "blocked";
}

function quickDecisionPath(status: QuickBuyerRoomPreviewStatus) {
  if (status === "ready") return "send-to-buyer" as const;
  if (status === "watch") return "sponsor-review" as const;
  return "hold-internal" as const;
}

function quickAgendaAction(label: string, href: string) {
  return {
    label,
    href,
    external: /^https?:\/\//i.test(href)
  };
}

function buildQuickDecisionClosePack(input: {
  buyer: string;
  workflow: string;
  status: QuickBuyerRoomPreviewStatus;
  closeRule: string;
  rows: QuickBuyerRoomPreviewRow[];
  handoffBrief: QuickBuyerHandoffBrief;
  decisionCase: QuickBuyerDecisionCase;
  economicsStressTest: QuickPilotEconomicsStressTest;
  claimProofLedger: QuickClaimProofLedger;
  approvalRoute: QuickStakeholderApprovalRoute;
  approvalEmailPack: QuickStakeholderApprovalEmailPack;
  pilotContractTerms: QuickPilotContractTerms;
  procurementMatrix: QuickProcurementAlternativeMatrix;
  proofRepairPlan: QuickProofRepairPlan;
}): QuickDecisionClosePack {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => input.rows.find((item) => item.id === id);
  const firstProofRepair = input.proofRepairPlan.items.find((item) => item.status !== "ready");
  const firstContractTerm = input.pilotContractTerms.terms.find((term) => term.status !== "ready");
  const recommended =
    input.procurementMatrix.alternatives.find((alternative) => alternative.id === input.procurementMatrix.recommendedAlternativeId) ??
    input.procurementMatrix.alternatives[0];
  const proofTrustStatus = mergedPreviewStatus(
    input.claimProofLedger.status,
    row("proof")?.status ?? "blocked",
    row("a2a")?.status ?? "blocked",
    row("data")?.status ?? "blocked"
  );
  const commercialStatus = mergedPreviewStatus(input.procurementMatrix.status, input.pilotContractTerms.status, input.approvalRoute.status);
  const paybackDays = recommended?.paybackDays ?? 0;
  const stopRule = input.pilotContractTerms.stopRules[0] || input.closeRule;
  const sendMessage = input.approvalEmailPack.messages[0];
  const dataBoundary = input.decisionCase.dataBoundary.trim().replace(/[.。]+$/, "");
  const agenda = buildBuyerDecisionAgendaSnapshot({
    proofChain: {
      status: quickAgendaStatus(mergedPreviewStatus(input.claimProofLedger.status, row("proof")?.status ?? "blocked")),
      verdict: input.decisionCase.decisionLabel,
      score: input.claimProofLedger.score,
      primaryAction: quickAgendaAction(firstProofRepair ? `Fix ${firstProofRepair.label}` : "Open claim-proof ledger", firstProofRepair?.href ?? "#quick-decision-close-pack")
    },
    publicDecisionPath: {
      status: quickAgendaStatus(input.status),
      decision: quickDecisionPath(input.status),
      headline: input.decisionCase.headline,
      buyerLine: input.decisionCase.answer,
      firstAction: quickAgendaAction(
        input.status === "ready" ? "Open buyer handoff" : `Close ${input.handoffBrief.nextAction.label}`,
        input.status === "ready" ? "#buyer-launch-handoff" : input.handoffBrief.nextAction.href
      ),
      guardrails: [
        input.closeRule,
        "Do not send until live proof verification passes after publishing.",
        "Do not expand without Day 30 retained value evidence."
      ]
    },
    pilotContract: {
      status: quickAgendaStatus(input.pilotContractTerms.status),
      buyer: input.buyer,
      pilotOffer: `Bounded pilot for ${input.workflow}`,
      firstCommitmentYen: input.pilotContractTerms.budgetCapYen,
      expectedMonthlyValueYen: input.economicsStressTest.riskAdjustedMonthlyValueYen,
      paybackDays,
      proofLine: `${input.proofRepairPlan.readyCount}/5 proof links; ${input.claimProofLedger.score}/100 claim trace score.`,
      stopRule,
      firstAction: quickAgendaAction(firstContractTerm ? `Fix ${firstContractTerm.label}` : "Open contract terms", firstContractTerm?.href ?? "#quick-decision-close-pack"),
      sendNote: {
        status: quickAgendaStatus(input.approvalEmailPack.status),
        subject: sendMessage?.subject || `Approve bounded pilot for ${input.buyer}`,
        instruction: input.approvalEmailPack.summary,
        body: sendMessage ? [sendMessage.body] : input.handoffBrief.buyerMessage
      }
    },
    trustSnapshot: {
      status: quickAgendaStatus(proofTrustStatus),
      trustScore: input.claimProofLedger.score,
      headline: proofTrustStatus === "ready" ? "Proof, agent trust, and data boundary are ready" : "Proof, agent trust, or data boundary still needs owner review",
      dataBoundary,
      firstAction: quickAgendaAction(
        proofTrustStatus === "ready" ? "Open trust boundary" : firstProofRepair ? `Fix ${firstProofRepair.label}` : "Review trust boundary",
        proofTrustStatus === "ready" ? "#buyer-trust-center" : firstProofRepair?.href ?? "#buyer-trust-center"
      )
    },
    commercialOffer: {
      status: quickAgendaStatus(commercialStatus),
      recommendedTier: recommended?.label ?? "Manual status quo",
      firstCommitmentYen: input.pilotContractTerms.budgetCapYen,
      expectedMonthlyValueYen: input.economicsStressTest.riskAdjustedMonthlyValueYen,
      paybackDays,
      contractLine: input.procurementMatrix.summary,
      firstAction: quickAgendaAction(
        commercialStatus === "ready" ? "Open procurement matrix" : "Repair commercial decision",
        commercialStatus === "ready" ? "#quick-decision-close-pack" : firstContractTerm?.href ?? "#launch-evidence-console"
      )
    }
  });
  const followUpLedger = buildBuyerDecisionFollowUpLedger(agenda);
  const agendaHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(agenda.exportMarkdown)}`;
  const followUpHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(followUpLedger.exportMarkdown)}`;
  const followUpHtml = renderBuyerDecisionFollowUpHtml(followUpLedger, {
    agendaUrl: "#quick-decision-close-pack",
    procurementDecisionUrl: "#quick-decision-close-pack",
    proofPacketUrl: `#${QUICK_PROOF_REPAIR_PLAN_ID}`,
    trustCenterUrl: "#buyer-trust-center",
    commercialOfferUrl: "#quick-decision-close-pack",
    markdownUrl: "quick-decision-follow-up-ledger.md",
    csvUrl: "quick-decision-follow-up-ledger.csv",
    appUrl: "#quick-workflow-intake"
  });
  const status = followUpLedger.status;
  const headline =
    status === "ready"
      ? "Decision close pack is buyer-send ready"
      : status === "attention"
        ? "Decision close pack needs sponsor review"
        : "Decision close pack blocks external send";
  const summary =
    status === "ready"
      ? `${input.buyer} has a meeting agenda and follow-up ledger with ${followUpLedger.taskTotal} owner tasks, close conditions, CSV, and receipt.`
      : `${followUpLedger.blockedCount} blocked and ${followUpLedger.attentionCount} attention task${followUpLedger.blockedCount + followUpLedger.attentionCount === 1 ? "" : "s"} must close before the buyer room is sendable.`;

  return {
    status,
    headline,
    summary,
    agenda,
    agendaHref,
    followUpLedger,
    followUpHref,
    followUpHtmlHref: `data:text/html;charset=utf-8,${encodeURIComponent(followUpHtml)}`
  };
}

function nextHandoffAction(input: {
  buyer: string;
  draft: WorkflowIntakeDraft;
  status: QuickBuyerRoomPreviewStatus;
  blockers: QuickBuyerRoomPreviewRow[];
  warnings: QuickBuyerRoomPreviewRow[];
  proofCount: number;
  proofRepairPlan: QuickProofRepairPlan;
}) {
  if (input.status === "ready") {
    return {
      label: "Final live verification",
      owner: "Proof owner",
      action: "Run live link verification once more after applying this draft.",
      proof: `${input.proofCount}/5 public proof links attached`,
      href: "#launch-evidence-console",
      status: "ready" as const
    };
  }

  const handoffPriority: QuickBuyerRoomPreviewRow["id"][] = ["value", "pilot", "proof", "a2a", "data", "scope"];
  const firstByPriority = (rows: QuickBuyerRoomPreviewRow[]) => handoffPriority.map((id) => rows.find((row) => row.id === id)).find(Boolean);
  const row = firstByPriority(input.blockers) || firstByPriority(input.warnings) || input.blockers[0] || input.warnings[0];
  const repairProofItems = input.proofRepairPlan.items.filter((item) => item.status !== "ready");
  const repairProofLabels = repairProofItems.map((item) => item.label);
  const actionById: Record<QuickBuyerRoomPreviewRow["id"], { owner: string; action: string; href: string }> = {
    scope: {
      owner: input.buyer,
      action: "Name the workflow, target buyer, baseline, and success metric in one bounded pilot request.",
      href: "#buyer-work-order-studio"
    },
    value: {
      owner: "Value owner",
      action: "Complete team size, cycle frequency, manual hours, adoption rate, and cost assumptions.",
      href: "#buyer-value-simulator"
    },
    pilot: {
      owner: input.draft.pilotRun.reviewerName || "Pilot reviewer",
      action: "Attach measured manual and assisted minutes with accepted task counts.",
      href: "#pilot-run-receipt"
    },
    proof: {
      owner: "Proof owner",
      action:
        repairProofLabels.length > 0
          ? `${proofRepairActionVerb(repairProofItems)} ${labelList(repairProofLabels)} and rerun live proof verification.`
          : "Rerun live proof verification before sending.",
      href: "#launch-evidence-console"
    },
    a2a: {
      owner: input.draft.agentTrialEvidence?.agentName || "A2A operator",
      action: "Attach an accepted A2A trial receipt with a score of 80 or higher.",
      href: "#agent-card-intake"
    },
    data: {
      owner: "Security owner",
      action: "Redact or approve the data boundary before any buyer-facing packet is sent.",
      href: "#buyer-trust-center"
    }
  };
  const action = actionById[row.id];
  return {
    label: row.label,
    owner: action.owner,
    action: action.action,
    proof: row.proof,
    href: action.href,
    status: row.status
  };
}

function buildQuickBuyerHandoffBrief(input: {
  draft: WorkflowIntakeDraft;
  buyer: string;
  workflow: string;
  status: QuickBuyerRoomPreviewStatus;
  blockers: QuickBuyerRoomPreviewRow[];
  warnings: QuickBuyerRoomPreviewRow[];
  proofCount: number;
  primaryAsk: string;
  proofRepairPlan: QuickProofRepairPlan;
}): QuickBuyerHandoffBrief {
  const decision = input.status === "ready" ? "send-ready" : input.blockers.length > 0 ? "do-not-send" : "repair-before-send";
  const label =
    decision === "send-ready" ? "Send-ready after live check" : decision === "repair-before-send" ? "Hold for owner review" : "Do not send";
  const nextAction = nextHandoffAction({
    buyer: input.buyer,
    draft: input.draft,
    status: input.status,
    blockers: input.blockers,
    warnings: input.warnings,
    proofCount: input.proofCount,
    proofRepairPlan: input.proofRepairPlan
  });
  const promise = buildHandoffPromise(input.draft);
  const proofSummary = `${input.proofCount}/5 public proof links / ${
    input.draft.agentTrialEvidence ? `A2A trial ${input.draft.agentTrialEvidence.score}/100` : "A2A trial missing"
  }`;
  const headline =
    decision === "send-ready"
      ? "Buyer can review a scoped pilot contract"
      : decision === "repair-before-send"
        ? `Close ${nextAction.label} before sending`
        : `Repair ${nextAction.label} before buyer review`;
  const buyerMessage =
    decision === "send-ready"
      ? [
          `We can pilot ${input.workflow} for ${input.buyer}.`,
          promise,
          `Approval ask: ${input.primaryAsk}`
        ]
      : [
          `Do not send to ${input.buyer} yet.`,
          promise,
          `${nextAction.owner}: ${nextAction.action}`
        ];
  const handoffText = [
    `Buyer handoff brief: ${input.buyer}`,
    `Decision: ${label}`,
    `Promise: ${promise}`,
    `Proof: ${proofSummary}`,
    `Next action: ${nextAction.owner} - ${nextAction.action}`,
    "",
    "Buyer message",
    ...buyerMessage.map((line) => `- ${line}`)
  ].join("\n");

  return {
    decision,
    label,
    headline,
    promise,
    proofSummary,
    nextAction,
    buyerMessage,
    handoffText,
    handoffHref: `data:text/plain;charset=utf-8,${encodeURIComponent(handoffText)}`
  };
}

function buildQuickBuyerObjectionBrief(input: {
  draft: WorkflowIntakeDraft;
  buyer: string;
  workflow: string;
  status: QuickBuyerRoomPreviewStatus;
  rows: QuickBuyerRoomPreviewRow[];
  primaryAsk: string;
  handoffBrief: QuickBuyerHandoffBrief;
  proofRepairPlan: QuickProofRepairPlan;
}): QuickBuyerObjectionBrief {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => input.rows.find((item) => item.id === id);
  const valueRow = row("value");
  const pilotRow = row("pilot");
  const proofRow = row("proof");
  const a2aRow = row("a2a");
  const dataRow = row("data");
  const repairProofItems = input.proofRepairPlan.items.filter((item) => item.status !== "ready");
  const repairProofLabels = repairProofItems.map((item) => item.label);
  const publicProofStatus: QuickBuyerRoomPreviewStatus =
    input.proofRepairPlan.repairCount === 0 ? "ready" : input.proofRepairPlan.repairCount <= 2 && proofRow?.status !== "blocked" ? "watch" : "blocked";
  const trial = input.draft.agentTrialEvidence;
  const dataSensitivity = input.draft.workOrder.dataSensitivity || "internal";
  const dataAnswer =
    dataSensitivity === "public"
      ? "Evidence is marked public-safe or redacted for external review."
      : dataSensitivity === "restricted"
        ? "Restricted data needs security approval before sharing."
        : "Internal evidence needs redaction before sharing.";
  const adoptionOwner = input.status === "ready" ? input.draft.pilotRun.reviewerName || input.buyer : input.handoffBrief.nextAction.owner;
  const adoptionAnswer =
    input.status === "ready"
      ? "Next action is live verification, then launch room approval."
      : `Next owner: ${input.handoffBrief.nextAction.owner}. ${input.handoffBrief.nextAction.action}`;
  const items: QuickBuyerObjectionItem[] = [
    {
      id: "valueProof",
      label: "Value proof",
      question: "What value is proven?",
      status: mergedPreviewStatus(valueRow?.status ?? "blocked", pilotRow?.status ?? "blocked"),
      owner: "Value owner",
      answer:
        valueRow?.status === "ready" && pilotRow?.status === "ready"
          ? input.handoffBrief.promise
          : "ROI assumptions and measured pilot savings need complete proof before buyer review.",
      evidence: `${valueRow?.value || "Value model missing"} / ${pilotRow?.value || "Measured pilot missing"}`,
      href: "#buyer-value-simulator"
    },
    {
      id: "publicProof",
      label: "Public proof",
      question: "Can the reviewer open the proof?",
      status: publicProofStatus,
      owner: "Proof owner",
      answer:
        repairProofLabels.length === 0
          ? "All five public proof links are attached."
          : `${proofRepairActionVerb(repairProofItems)} ${labelList(repairProofLabels)} before buyer sharing.`,
      evidence: `${input.proofRepairPlan.readyCount}/5 public proof links ready`,
      href: "#launch-evidence-console"
    },
    {
      id: "agentTrust",
      label: "Agent trust",
      question: "Why trust the agent action?",
      status: a2aRow?.status ?? "blocked",
      owner: trial?.agentName || "A2A operator",
      answer: trial
        ? trial.score >= 80
          ? `Accepted A2A trial receipt: ${trial.agentName || "A2A agent"} / ${trial.skillId || "trial skill"} / ${trial.score}/100.`
          : `A2A trial scored ${trial.score}/100. Rerun before unsupervised buyer use.`
        : "No accepted A2A trial receipt is attached.",
      evidence: a2aRow?.proof || "Attach an accepted A2A trial receipt.",
      href: "#agent-card-intake"
    },
    {
      id: "dataBoundary",
      label: "Data boundary",
      question: "What data can leave the team?",
      status: dataRow?.status ?? "blocked",
      owner: "Security owner",
      answer: dataAnswer,
      evidence: dataRow?.proof || "Data boundary must be explicit.",
      href: "#buyer-trust-center"
    },
    {
      id: "adoptionPath",
      label: "Decision path",
      question: "What happens after the pilot?",
      status: input.status,
      owner: adoptionOwner,
      answer: adoptionAnswer,
      evidence: input.primaryAsk,
      href: input.status === "ready" ? "#buyer-launch-handoff" : input.handoffBrief.nextAction.href
    }
  ];
  const readyCount = items.filter((item) => item.status === "ready").length;
  const unresolvedCount = items.length - readyCount;
  const headline = unresolvedCount === 0 ? "Buyer objections are answered" : `${unresolvedCount} buyer question${unresolvedCount === 1 ? "" : "s"} need evidence`;
  const summary = `${readyCount}/5 answers have buyer-safe evidence for ${input.buyer}.`;
  const defenseText = [
    "Buyer objection brief",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Ready: ${readyCount}/5`,
    `Unresolved: ${unresolvedCount}`,
    "",
    ...items.map((item) => `[${item.status}] ${item.label}: ${item.question}\nOwner: ${item.owner}\nAnswer: ${item.answer}\nEvidence: ${item.evidence}`)
  ].join("\n");

  return {
    readyCount,
    unresolvedCount,
    headline,
    summary,
    items,
    defenseText,
    defenseHref: `data:text/plain;charset=utf-8,${encodeURIComponent(defenseText)}`
  };
}

function buildQuickBuyerDecisionCase(input: {
  buyer: string;
  workflow: string;
  status: QuickBuyerRoomPreviewStatus;
  rows: QuickBuyerRoomPreviewRow[];
  primaryAsk: string;
  closeRule: string;
  handoffBrief: QuickBuyerHandoffBrief;
  proofRepairPlan: QuickProofRepairPlan;
  objectionBrief: QuickBuyerObjectionBrief;
}): QuickBuyerDecisionCase {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => input.rows.find((item) => item.id === id);
  const decision = input.status === "ready" ? "send" : input.status === "watch" ? "repair" : "hold";
  const decisionLabel =
    decision === "send" ? "Send after live verification" : decision === "repair" ? "Repair before buyer sharing" : "Hold internal";
  const buyerQuestion = `Should ${input.buyer} pilot this workflow now?`;
  const nextAction = `${input.handoffBrief.nextAction.owner}: ${input.handoffBrief.nextAction.action}`;
  const valueEvidence = [row("value")?.value, row("pilot")?.value].filter(Boolean).join(" / ") || "Value and pilot evidence missing";
  const proofEvidence = `${input.proofRepairPlan.readyCount}/5 public proof links ready. ${row("proof")?.proof || input.handoffBrief.proofSummary}`;
  const trustEvidence = [row("a2a")?.value, input.objectionBrief.items.find((item) => item.id === "agentTrust")?.answer].filter(Boolean).join(" / ");
  const dataBoundary = row("data")?.proof || "Data boundary must be explicit before buyer review.";
  const answer =
    decision === "send"
      ? `${input.handoffBrief.promise} Buyer review can proceed after live proof verification.`
      : decision === "repair"
        ? `Not yet. ${nextAction}`
        : `No. Keep this internal until ${input.handoffBrief.nextAction.label} is repaired. ${nextAction}`;
  const headline =
    decision === "send"
      ? "Decision case is ready for buyer review"
      : decision === "repair"
        ? `Decision case needs ${input.handoffBrief.nextAction.label}`
        : `Decision case is blocked by ${input.handoffBrief.nextAction.label}`;
  const summary =
    decision === "send"
      ? `${input.buyer} gets value, measured run, trust, data boundary, and public proof in one review case.`
      : `${input.buyer} should not receive this case until ${input.handoffBrief.nextAction.owner} closes the next action.`;
  const caseText = [
    "Buyer decision case",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Decision: ${decisionLabel}`,
    `Question: ${buyerQuestion}`,
    `Answer: ${answer}`,
    `Value evidence: ${valueEvidence}`,
    `Public proof: ${proofEvidence}`,
    `Agent trust: ${trustEvidence || "Accepted agent trial receipt missing"}`,
    `Data boundary: ${dataBoundary}`,
    `Owner: ${input.handoffBrief.nextAction.owner}`,
    `Next action: ${input.handoffBrief.nextAction.action}`,
    `Primary ask: ${input.primaryAsk}`,
    `Close rule: ${input.closeRule}`
  ].join("\n");

  return {
    status: input.status,
    decision,
    decisionLabel,
    headline,
    summary,
    buyerQuestion,
    answer,
    valueEvidence,
    proofEvidence,
    trustEvidence: trustEvidence || "Accepted agent trial receipt missing",
    dataBoundary,
    owner: input.handoffBrief.nextAction.owner,
    nextAction: input.handoffBrief.nextAction.action,
    caseText,
    caseHref: `data:text/plain;charset=utf-8,${encodeURIComponent(caseText)}`
  };
}

function buildQuickBuyerValueMap(input: {
  draft: WorkflowIntakeDraft;
  buyer: string;
  workflow: string;
  status: QuickBuyerRoomPreviewStatus;
  rows: QuickBuyerRoomPreviewRow[];
  handoffBrief: QuickBuyerHandoffBrief;
  decisionCase: QuickBuyerDecisionCase;
  proofRepairPlan: QuickProofRepairPlan;
}): QuickBuyerValueMap {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => input.rows.find((item) => item.id === id);
  const scopeRow = row("scope");
  const valueRow = row("value");
  const pilotRow = row("pilot");
  const proofRow = row("proof");
  const a2aRow = row("a2a");
  const baseline = input.draft.workOrder.currentBaseline?.trim() || "Current manual baseline is not stated yet.";
  const proofStatus: QuickBuyerRoomPreviewStatus =
    input.proofRepairPlan.repairCount === 0 ? "ready" : input.proofRepairPlan.readyCount > 0 ? "watch" : "blocked";
  const beforeStatus: QuickBuyerRoomPreviewStatus =
    input.draft.workOrder.currentBaseline?.trim() ? scopeRow?.status ?? "blocked" : scopeRow?.status === "blocked" ? "blocked" : "watch";
  const afterState =
    input.status === "ready"
      ? `${draftAgentTrialLine(input.draft)} turns the manual workflow into a supervised buyer pilot.`
      : `${input.handoffBrief.nextAction.owner} must close ${input.handoffBrief.nextAction.label.toLowerCase()} before the new workflow is buyer-safe.`;
  const buyerOutcome = input.handoffBrief.promise;
  const nextAction =
    input.status === "ready"
      ? "Run live proof verification, then use this as the buyer story."
      : `${input.handoffBrief.nextAction.owner}: ${input.handoffBrief.nextAction.action}`;
  const items: QuickBuyerValueMapItem[] = [
    {
      id: "before",
      label: "Before",
      status: beforeStatus,
      owner: input.buyer,
      value: baseline,
      detail: input.workflow,
      evidence: scopeRow?.proof || "Buyer, workflow, baseline, and success metric must be explicit.",
      href: "#quick-workflow-intake"
    },
    {
      id: "agent-run",
      label: "Agent run",
      status: mergedPreviewStatus(a2aRow?.status ?? "blocked", pilotRow?.status ?? "blocked"),
      owner: input.draft.agentTrialEvidence?.agentName || "A2A operator",
      value: draftAgentTrialLine(input.draft),
      detail: draftPilotLine(input.draft),
      evidence: [a2aRow?.proof, pilotRow?.proof].filter(Boolean).join(" / ") || "Accepted A2A trial and measured pilot must be attached.",
      href: "#agent-card-intake"
    },
    {
      id: "measured-value",
      label: "Measured value",
      status: mergedPreviewStatus(valueRow?.status ?? "blocked", pilotRow?.status ?? "blocked"),
      owner: "Value owner",
      value: buyerOutcome,
      detail: input.decisionCase.valueEvidence,
      evidence: valueRow?.proof || "Success metric must be explicit before buyer review.",
      href: "#buyer-value-simulator"
    },
    {
      id: "buyer-proof",
      label: "Buyer proof",
      status: proofStatus,
      owner: "Proof owner",
      value: proofReadinessLine(input.proofRepairPlan),
      detail: input.decisionCase.proofEvidence,
      evidence: proofRow?.proof || "Attach launch, work-order, pilot, walkthrough, and ProtoPedia proof.",
      href: `#${QUICK_PROOF_REPAIR_PLAN_ID}`
    },
    {
      id: "decision",
      label: "Decision",
      status: input.decisionCase.status,
      owner: input.decisionCase.owner,
      value: input.decisionCase.decisionLabel,
      detail: input.decisionCase.answer,
      evidence: input.decisionCase.buyerQuestion,
      href: input.decisionCase.caseHref
    }
  ];
  const status = mergedPreviewStatus(...items.map((item) => item.status));
  const headline =
    status === "ready"
      ? "Buyer value map is buyer-ready"
      : status === "watch"
        ? "Buyer value map needs proof closure"
        : "Buyer value map is missing buyer evidence";
  const summary =
    status === "ready"
      ? `${input.buyer} can see the before-state, agent run, measured value, public proof, and decision in one story.`
      : `Next: ${nextAction}`;
  const exportMarkdown = [
    "# Buyer value map",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Before: ${baseline}`,
    `After: ${afterState}`,
    `Buyer outcome: ${buyerOutcome}`,
    `Next action: ${nextAction}`,
    "",
    "## Map",
    ...items.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.value}. ${item.detail} Evidence: ${item.evidence}`)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    beforeState: baseline,
    afterState,
    buyerOutcome,
    nextAction,
    items,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickBuyerValidationScript(input: {
  buyer: string;
  workflow: string;
  status: QuickBuyerRoomPreviewStatus;
  rows: QuickBuyerRoomPreviewRow[];
  handoffBrief: QuickBuyerHandoffBrief;
  decisionCase: QuickBuyerDecisionCase;
  valueMap: QuickBuyerValueMap;
  proofRepairPlan: QuickProofRepairPlan;
  pilotProofContract: QuickPilotProofContract;
}): QuickBuyerValidationScript {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => input.rows.find((item) => item.id === id);
  const valueMapItem = (id: QuickBuyerValueMapItem["id"]) => input.valueMap.items.find((item) => item.id === id);
  const beforeItem = valueMapItem("before");
  const valueItem = valueMapItem("measured-value");
  const proofItem = valueMapItem("buyer-proof");
  const sentenceFragment = (value: string) => value.trim().replace(/\.+$/, "");
  const decisionStatus = mergedPreviewStatus(input.decisionCase.status, input.pilotProofContract.status);
  const nextAction =
    input.status === "ready"
      ? "Use the answers to confirm the pilot owner, then run live proof verification."
      : `${input.handoffBrief.nextAction.owner}: ${input.handoffBrief.nextAction.action}`;
  const openingLine = `I want to verify whether this workflow is worth a bounded pilot for ${input.buyer}.`;
  const closeAsk =
    input.status === "ready"
      ? `If these answers hold, can ${input.decisionCase.owner} approve the pilot after live proof verification?`
      : `If we close ${input.handoffBrief.nextAction.label.toLowerCase()}, can ${input.decisionCase.owner} review the pilot decision?`;
  const questions: QuickBuyerValidationQuestion[] = [
    {
      id: "pain",
      label: "Pain",
      status: beforeItem?.status ?? "blocked",
      question: "Where does this current baseline break for your team today?",
      listenFor: beforeItem?.value || "The buyer can name the manual baseline and why it hurts.",
      evidence: beforeItem?.evidence || "Buyer, workflow, baseline, and success metric must be explicit.",
      owner: input.buyer,
      href: "#quick-workflow-intake"
    },
    {
      id: "frequency",
      label: "Frequency",
      status: row("value")?.status ?? "blocked",
      question: "How often does this workflow repeat, and who feels the delay?",
      listenFor: row("value")?.value || "The buyer can state team size, cycle count, manual hours, and adoption.",
      evidence: row("value")?.proof || "A recurring value model must be present before pilot approval.",
      owner: "Value owner",
      href: "#buyer-value-simulator"
    },
    {
      id: "value",
      label: "Value",
      status: valueItem?.status ?? "blocked",
      question: "If the pilot saves this amount, who owns the monthly value decision?",
      listenFor: input.handoffBrief.promise,
      evidence: valueItem?.detail || input.decisionCase.valueEvidence,
      owner: "Value owner",
      href: "#buyer-value-simulator"
    },
    {
      id: "trust",
      label: "Trust",
      status: proofItem?.status ?? "blocked",
      question: "What proof must be visible before you trust the agent output?",
      listenFor: proofReadinessLine(input.proofRepairPlan),
      evidence: proofItem?.detail || input.decisionCase.proofEvidence,
      owner: "Proof owner",
      href: `#${QUICK_PROOF_REPAIR_PLAN_ID}`
    },
    {
      id: "commitment",
      label: "Commitment",
      status: decisionStatus,
      question: "If proof passes, who can approve the bounded pilot and stop rule?",
      listenFor: input.pilotProofContract.renewalAsk,
      evidence: input.decisionCase.buyerQuestion,
      owner: input.decisionCase.owner,
      href: input.decisionCase.caseHref
    }
  ];
  const status = mergedPreviewStatus(...questions.map((question) => question.status));
  const headline =
    status === "ready"
      ? "Buyer validation script is ready"
      : status === "watch"
        ? "Buyer validation script needs proof closure"
        : "Buyer validation script needs buyer evidence";
  const summary =
    status === "ready"
      ? `${input.buyer} has five questions that validate pain, frequency, value, trust, and commitment before pilot approval.`
      : `Use this internally until ${nextAction}`;
  const exportMarkdown = [
    "# Buyer validation script",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Opening: ${openingLine}`,
    `Close ask: ${closeAsk}`,
    `Next action: ${nextAction}`,
    "",
    "## Questions",
    ...questions.map(
      (question) =>
        `- [${question.status}] ${question.label} (${question.owner}): ${question.question} Listen for: ${sentenceFragment(question.listenFor)}. Evidence: ${sentenceFragment(question.evidence)}`
    )
  ].join("\n");

  return {
    status,
    headline,
    summary,
    openingLine,
    closeAsk,
    nextAction,
    questions,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickBuyerValidationRubric(input: {
  buyer: string;
  status: QuickBuyerRoomPreviewStatus;
  handoffBrief: QuickBuyerHandoffBrief;
  decisionCase: QuickBuyerDecisionCase;
  validationScript: QuickBuyerValidationScript;
}): QuickBuyerValidationRubric {
  const question = (id: QuickBuyerValidationQuestion["id"]) => input.validationScript.questions.find((item) => item.id === id);
  const criteria: QuickBuyerValidationRubricCriterion[] = [
    {
      id: "pain",
      label: "Pain is owned",
      status: question("pain")?.status ?? "blocked",
      owner: question("pain")?.owner ?? input.buyer,
      passSignal: "Buyer repeats the current baseline and names why it is costly now.",
      failSignal: "Pain is generic, occasional, or owned by nobody in the buying team.",
      evidence: question("pain")?.evidence ?? "Baseline and buyer pain are missing.",
      href: question("pain")?.href ?? "#quick-workflow-intake"
    },
    {
      id: "frequency",
      label: "Frequency is repeatable",
      status: question("frequency")?.status ?? "blocked",
      owner: question("frequency")?.owner ?? "Value owner",
      passSignal: "Buyer confirms the workflow repeats often enough to measure in the pilot window.",
      failSignal: "The workflow is rare, ad hoc, or not tied to a named operating cadence.",
      evidence: question("frequency")?.evidence ?? "Recurring frequency and manual effort are missing.",
      href: question("frequency")?.href ?? "#buyer-value-simulator"
    },
    {
      id: "value",
      label: "Value owner can act",
      status: question("value")?.status ?? "blocked",
      owner: question("value")?.owner ?? "Value owner",
      passSignal: "Buyer names who owns the monthly value decision and what improvement matters.",
      failSignal: "Savings sound interesting, but no owner can approve or reject the value case.",
      evidence: question("value")?.evidence ?? input.decisionCase.valueEvidence,
      href: question("value")?.href ?? "#buyer-value-simulator"
    },
    {
      id: "trust",
      label: "Proof clears trust",
      status: question("trust")?.status ?? "blocked",
      owner: question("trust")?.owner ?? "Proof owner",
      passSignal: "Buyer can open the proof and agrees it is enough to trust the agent run.",
      failSignal: "Proof requires internal access, is stale, or does not show the workflow result.",
      evidence: question("trust")?.evidence ?? input.decisionCase.proofEvidence,
      href: question("trust")?.href ?? `#${QUICK_PROOF_REPAIR_PLAN_ID}`
    },
    {
      id: "commitment",
      label: "Commitment has a signer",
      status: question("commitment")?.status ?? "blocked",
      owner: question("commitment")?.owner ?? input.decisionCase.owner,
      passSignal: "Buyer names the pilot approver, stop rule, and next decision date.",
      failSignal: "The meeting ends with interest, but no approver or stop rule is named.",
      evidence: question("commitment")?.evidence ?? input.decisionCase.buyerQuestion,
      href: question("commitment")?.href ?? input.decisionCase.caseHref
    }
  ];
  const status = mergedPreviewStatus(...criteria.map((criterion) => criterion.status));
  const decision: QuickBuyerValidationRubricDecision =
    status === "ready" ? "pilot-ready" : status === "watch" ? "needs-review" : "hold-internal";
  const passCount = criteria.filter((criterion) => criterion.status === "ready").length;
  const nextAction =
    decision === "pilot-ready"
      ? "Ask for continue, revise, or stop after live proof verification."
      : `${input.handoffBrief.nextAction.owner}: ${input.handoffBrief.nextAction.action}`;
  const headline =
    decision === "pilot-ready"
      ? "Validation rubric clears the pilot ask"
      : decision === "needs-review"
        ? "Validation rubric needs owner review"
        : "Validation rubric blocks the buyer ask";
  const summary =
    decision === "pilot-ready"
      ? `${input.buyer} can use the five answers as a go/no-go gate before approval.`
      : `Do not request approval until ${nextAction}`;
  const decisionRule =
    decision === "pilot-ready"
      ? "Advance only when all five buyer signals are ready and live proof still passes."
      : decision === "needs-review"
        ? "Run the conversation internally, then close watch items before asking for approval."
        : "Keep the script internal until blocked criteria have buyer-safe evidence.";
  const exportMarkdown = [
    "# Buyer validation rubric",
    "",
    `Decision: ${decision}`,
    `Status: ${status}`,
    `Pass count: ${passCount}/${criteria.length}`,
    `Decision rule: ${decisionRule}`,
    `Next action: ${nextAction}`,
    "",
    "## Criteria",
    ...criteria.map(
      (criterion) =>
        `- [${criterion.status}] ${criterion.label} (${criterion.owner}): Pass if ${criterion.passSignal} Fail if ${criterion.failSignal} Evidence: ${criterion.evidence}`
    )
  ].join("\n");

  return {
    status,
    decision,
    headline,
    summary,
    passCount,
    totalCount: criteria.length,
    decisionRule,
    nextAction,
    criteria,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickBuyerValidationAnswerSheet(input: {
  buyer: string;
  workflow: string;
  validationScript: QuickBuyerValidationScript;
  validationRubric: QuickBuyerValidationRubric;
  handoffBrief: QuickBuyerHandoffBrief;
}): QuickBuyerValidationAnswerSheet {
  const question = (id: QuickBuyerValidationQuestion["id"]) => input.validationScript.questions.find((item) => item.id === id);
  const criterion = (id: QuickBuyerValidationQuestion["id"]) => input.validationRubric.criteria.find((item) => item.id === id);
  const answerField = (id: QuickBuyerValidationQuestion["id"]) => {
    if (id === "pain") return "Buyer answer: baseline, owner, and why the current workflow hurts now.";
    if (id === "frequency") return "Buyer answer: cadence, affected team, and repeatable pilot window.";
    if (id === "value") return "Buyer answer: value owner, monthly value threshold, and decision metric.";
    if (id === "trust") return "Buyer answer: proof links opened, missing proof, and trust condition.";
    return "Buyer answer: approver, stop rule, decision date, and pilot boundary.";
  };
  const ownerAction = (id: QuickBuyerValidationQuestion["id"], status: QuickBuyerRoomPreviewStatus) => {
    if (status === "ready") return "Record the buyer answer beside the linked evidence before asking for approval.";
    if (id === "trust") return "Close public proof gaps before the answer can be used externally.";
    if (id === "commitment") return "Name the approver and stop rule before pilot approval.";
    return `${input.handoffBrief.nextAction.owner}: ${input.handoffBrief.nextAction.action}`;
  };
  const ids: QuickBuyerValidationQuestion["id"][] = ["pain", "frequency", "value", "trust", "commitment"];
  const items: QuickBuyerValidationAnswerSheetItem[] = ids.map((id) => {
    const scriptQuestion = question(id);
    const rubricCriterion = criterion(id);
    const status = mergedPreviewStatus(scriptQuestion?.status ?? "blocked", rubricCriterion?.status ?? "blocked");
    return {
      id,
      label: scriptQuestion?.label ?? rubricCriterion?.label ?? id,
      status,
      question: scriptQuestion?.question ?? "Ask the buyer to validate this signal.",
      answerField: answerField(id),
      passSignal: rubricCriterion?.passSignal ?? scriptQuestion?.listenFor ?? "Buyer gives a concrete answer.",
      failTrigger: rubricCriterion?.failSignal ?? "Buyer answer is vague or missing.",
      evidence: scriptQuestion?.evidence ?? rubricCriterion?.evidence ?? "Evidence missing.",
      owner: scriptQuestion?.owner ?? rubricCriterion?.owner ?? input.buyer,
      ownerAction: ownerAction(id, status),
      href: scriptQuestion?.href ?? rubricCriterion?.href ?? "#quick-workflow-intake"
    };
  });
  const status = mergedPreviewStatus(...items.map((item) => item.status));
  const readyCount = items.filter((item) => item.status === "ready").length;
  const totalCount = items.length;
  const firstOpen = items.find((item) => item.status !== "ready");
  const headline =
    status === "ready"
      ? "Buyer answer sheet is ready to use"
      : status === "watch"
        ? "Buyer answer sheet needs proof closure"
        : "Buyer answer sheet stays internal";
  const summary =
    status === "ready"
      ? `${input.buyer} can record the five validation answers against evidence before the pilot decision.`
      : `${firstOpen?.owner ?? input.handoffBrief.nextAction.owner} must close ${firstOpen?.label ?? "the first buyer answer"} before approval.`;
  const decisionRule =
    status === "ready"
      ? "Advance only when each answer names a buyer owner, a concrete signal, and a linked proof artifact."
      : "Do not use unanswered or ungrounded buyer validation as approval evidence.";
  const nextAction =
    status === "ready"
      ? "Run the buyer conversation, fill the answer sheet, then record continue, revise, or stop."
      : firstOpen?.ownerAction ?? input.handoffBrief.nextAction.action;
  const exportMarkdown = [
    "# Buyer validation answer sheet",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Ready: ${readyCount}/${totalCount}`,
    `Decision rule: ${decisionRule}`,
    `Next action: ${nextAction}`,
    "",
    "## Answer fields",
    ...items.map(
      (item) =>
        `- [${item.status}] ${item.label} (${item.owner}): ${item.question} ${item.answerField} Pass: ${item.passSignal} Fail: ${item.failTrigger} Evidence: ${item.evidence} Action: ${item.ownerAction}`
    )
  ].join("\n");

  return {
    status,
    headline,
    summary,
    decisionRule,
    nextAction,
    readyCount,
    totalCount,
    items,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

export function buildQuickBuyerValidationCallBrief(
  preview: QuickBuyerRoomPreview,
  record?: QuickBuyerValidationAnswerRecord | null
): QuickBuyerValidationCallBrief {
  const sheet = preview.validationAnswerSheet;
  const recordItemById = new Map(record?.items.map((item) => [item.id, item]));
  const items = sheet.items.map((item): QuickBuyerValidationCallBriefItem => {
    const recorded = recordItemById.get(item.id);
    return {
      id: item.id,
      label: item.label,
      status: item.status,
      answerField: item.answerField,
      passSignal: item.passSignal,
      recordStatus: recorded?.status ?? "not-recorded",
      recordEvidence: recorded
        ? recorded.matchedSignals.length > 0
          ? `Matched: ${recorded.matchedSignals.join(", ")}`
          : `Missing: ${recorded.missingSignals.join(", ")}`
        : item.ownerAction,
      href: item.href
    };
  });
  const status = record ? mergedPreviewStatus(sheet.status, record.status) : sheet.status;
  const headline = record
    ? record.status === "ready"
      ? "Buyer validation answers are recorded"
      : "Buyer validation answers need follow-up"
    : sheet.status === "ready"
      ? "Run this buyer validation call before approval"
      : "Validation call needs proof closure";
  const summary = record
    ? record.summary
    : `${sheet.readyCount}/${sheet.totalCount} answer fields are ready. ${sheet.decisionRule}`;
  const primaryQuestion = preview.validationScript.closeAsk;
  const nextAsk = record?.nextAction ?? sheet.nextAction;
  const recordLine = record
    ? `${record.answeredCount}/${record.totalCount} validation fields ready at ${record.confidence}/100 confidence.`
    : "Paste buyer answers after the call to create a receipt.";
  const exportMarkdown = [
    "# Buyer validation call brief",
    "",
    `Buyer: ${preview.buyer}`,
    `Workflow: ${preview.summary}`,
    `Status: ${status}`,
    `Ready: ${sheet.readyCount}/${sheet.totalCount}`,
    `Close ask: ${primaryQuestion}`,
    `Next ask: ${nextAsk}`,
    `Record: ${recordLine}`,
    "",
    "## Questions and answer fields",
    ...items.map(
      (item) =>
        `- [${item.status}] ${item.label}: ${item.answerField} Pass: ${item.passSignal} Record: ${item.recordStatus}. ${item.recordEvidence}`
    )
  ].join("\n");

  return {
    status,
    headline,
    summary,
    primaryQuestion,
    nextAsk,
    recordLine,
    readyCount: sheet.readyCount,
    totalCount: sheet.totalCount,
    items,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function validationAnswerSignalGroups(item: QuickBuyerValidationAnswerSheetItem) {
  const common = [item.passSignal.toLowerCase(), item.evidence.toLowerCase()];
  const groups: Record<QuickBuyerValidationQuestion["id"], Array<{ label: string; patterns: Array<string | RegExp> }>> = {
    pain: [
      { label: "baseline named", patterns: ["baseline", "current", "today", "現状"] },
      { label: "manual pain stated", patterns: ["manual", "hand", "copy", "spreadsheet", "手作業"] },
      { label: "owner or affected user named", patterns: ["owner", "lead", "team", "担当", item.owner.toLowerCase()] }
    ],
    frequency: [
      { label: "cadence stated", patterns: ["weekly", "monthly", "month", "cycle", "cadence", "週", "月"] },
      { label: "repeatability stated", patterns: ["repeat", "again", "every", "repeated", "繰り返"] },
      { label: "affected team stated", patterns: ["team", "people", "member", "Platform", "チーム"] }
    ],
    value: [
      { label: "value owner named", patterns: ["finance", "owner", "sponsor", "approval", "承認", item.owner.toLowerCase()] },
      { label: "amount or threshold stated", patterns: [/¥\s*[\d,]+/, /[\d,]+\s*(?:yen|円|jpy)/i, "threshold", "budget"] },
      { label: "metric stated", patterns: ["metric", "value", "hours", "saving", "payback", "価値"] }
    ],
    trust: [
      { label: "proof opened", patterns: ["proof opened", "opened proof", "open proof", "proof url", "url", "link", "https://", "証跡"] },
      { label: "receipt or verifier stated", patterns: ["receipt", "checksum", "verifier", "verified", "検証"] },
      { label: "trust condition stated", patterns: ["trust", "enough", "condition", "missing proof", "信頼"] }
    ],
    commitment: [
      { label: "approver named", patterns: ["approver", "approve", "approval", "sponsor", "承認者", item.owner.toLowerCase()] },
      { label: "stop rule stated", patterns: ["stop rule", "stop", "revise", "boundary", "停止"] },
      { label: "decision date or pilot boundary stated", patterns: ["date", "day", "pilot", "decision", "bounded", "日付"] }
    ]
  };

  return groups[item.id].map((group) => ({
    ...group,
    patterns: [...group.patterns, ...common]
  }));
}

function buyerAnswerProofUrls(value: string) {
  return Array.from(value.matchAll(/https?:\/\/[^\s<>"')\]]+/gi), (match) => match[0].replace(/[),.;]+$/g, ""));
}

export function buildQuickBuyerValidationAnswerRecord(
  preview: QuickBuyerRoomPreview,
  buyerAnswerText: string
): QuickBuyerValidationAnswerRecord {
  const buyerAnswer = buyerAnswerText.trim().slice(0, 2000);
  const text = normalizedEvidenceText(buyerAnswer);
  const proofUrls = buyerAnswerProofUrls(buyerAnswer);
  const hasBuyerFacingAnswerProofUrl = proofUrls.some((url) => cleanBuyerFacingProofUrl(url));
  const sourceReceiptId = preview.conversionReceipt.receiptId;
  const sourceChecksum = `${preview.conversionReceipt.checksumAlgorithm}:${preview.conversionReceipt.checksum}`;
  const items: QuickBuyerValidationAnswerRecordItem[] = preview.validationAnswerSheet.items.map((item) => {
    const groups = validationAnswerSignalGroups(item);
    let matchedSignals = buyerAnswer ? groups.map((group) => signalResult(text, group.label, group.patterns)).filter(Boolean) : [];
    let missingSignals = groups.filter((group) => !buyerAnswer || !evidenceHasAny(text, group.patterns)).map((group) => group.label);
    if (item.id === "trust" && proofUrls.length > 0 && !hasBuyerFacingAnswerProofUrl) {
      matchedSignals = matchedSignals.filter((signal) => signal !== "proof opened");
      missingSignals = ["proof opened", ...missingSignals.filter((signal) => signal !== "proof opened")];
    }
    const answerStatus: QuickBuyerRoomPreviewStatus = !buyerAnswer ? "blocked" : missingSignals.length === 0 ? "ready" : matchedSignals.length > 0 ? "watch" : "blocked";
    const status = mergedPreviewStatus(item.status, answerStatus);
    const action =
      item.status !== "ready"
        ? item.ownerAction
        : missingSignals.length
          ? `Capture ${item.label.toLowerCase()} evidence: ${missingSignals.join(", ")}.`
          : "Use this answer as buyer validation evidence.";

    return {
      id: item.id,
      label: item.label,
      status,
      sourceStatus: item.status,
      owner: item.owner,
      action,
      matchedSignals,
      missingSignals,
      evidence: buyerAnswer || "No buyer validation answers pasted yet.",
      href: item.href
    };
  });
  const answeredCount = items.filter((item) => item.status === "ready").length;
  const totalCount = items.length;
  const matchedTotal = items.reduce((sum, item) => sum + item.matchedSignals.length, 0);
  const requiredTotal = Math.max(1, items.reduce((sum, item) => sum + item.matchedSignals.length + item.missingSignals.length, 0));
  const confidence = buyerAnswer ? Math.min(96, Math.round((matchedTotal / requiredTotal) * 100)) : 0;
  const status = buyerAnswer ? mergedPreviewStatus(...items.map((item) => item.status)) : "blocked";
  const firstOpen = items.find((item) => item.status !== "ready");
  const validationDecision = quickBuyerValidationAnswerRecordDecision({
    status,
    answeredCount,
    totalCount,
    confidence,
    firstOpen: firstOpen
      ? {
          label: firstOpen.label,
          missingSignal: firstOpen.missingSignals[0],
          action: firstOpen.action
        }
      : undefined
  });
  const nextOwner = status === "ready" ? "Ready" : (firstOpen?.owner ?? preview.buyer);
  const nextAction =
    status === "ready"
      ? "Record continue, revise, or stop with the decision recorder."
      : firstOpen?.action ?? "Paste buyer answers before using validation as approval evidence.";
  const headline =
    status === "ready"
      ? "Buyer validation answers are recorded"
      : status === "watch"
        ? "Buyer validation answers need proof review"
        : "Buyer validation answers are incomplete";
  const summary =
    buyerAnswer
      ? `${answeredCount}/${totalCount} answers are ready with ${confidence}/100 signal confidence.`
      : "Paste the buyer conversation notes to score whether the five validation answers are actually evidenced.";
  const payload: QuickBuyerValidationAnswerRecordPayload = {
    receiptVersion: QUICK_BUYER_VALIDATION_ANSWER_RECORD_RECEIPT_VERSION,
    status,
    buyer: preview.buyer,
    primaryAsk: preview.primaryAsk,
    answeredCount,
    totalCount,
    confidence,
    recommendedBuyerDecision: validationDecision.recommendedBuyerDecision,
    decisionReason: validationDecision.decisionReason,
    decisionAction: validationDecision.decisionAction,
    nextOwner,
    nextAction,
    sourceReceiptId,
    sourceChecksum,
    buyerAnswer: buyerAnswer || "No buyer validation answers pasted yet.",
    items: items.map((item) => ({
      id: item.id,
      label: item.label,
      status: item.status,
      sourceStatus: item.sourceStatus,
      owner: item.owner,
      matchedSignals: item.matchedSignals,
      missingSignals: item.missingSignals,
      action: item.action,
      href: item.href
    }))
  };
  const checksum = quickBuyerValidationAnswerRecordChecksum(payload);
  const verificationRequest = { checksum, payload };
  const verificationRequestJson = quickBuyerValidationAnswerRecordVerificationRequestJson(verificationRequest);
  const verification = verifyQuickBuyerValidationAnswerRecordReceipt(verificationRequest);
  const receipt = {
    receiptId: `quick-validation-answer-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    verificationApiPath: QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH as typeof QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH,
    payload,
    payloadJson: quickBuyerValidationAnswerRecordPayloadJson(payload),
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification,
    generatedFrom: ["buyer-validation-answer-text", "validation-answer-sheet", "workflow-conversion-receipt"]
  };
  const exportMarkdown = [
    "# Buyer validation answer record",
    "",
    `Buyer: ${preview.buyer}`,
    `Status: ${status}`,
    `Answered: ${answeredCount}/${totalCount}`,
    `Confidence: ${confidence}/100`,
    `Recommended buyer decision: ${validationDecision.recommendedBuyerDecision}`,
    `Decision reason: ${validationDecision.decisionReason}`,
    `Decision action: ${validationDecision.decisionAction}`,
    `Source receipt: ${sourceReceiptId}`,
    `Source checksum: ${sourceChecksum}`,
    `Record receipt: ${receipt.receiptId}`,
    `Record checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `API verification: POST ${receipt.verificationApiPath}`,
    "",
    "## Summary",
    summary,
    "",
    "## Buyer decision triage",
    `Recommended decision: ${validationDecision.recommendedBuyerDecision}`,
    `Reason: ${validationDecision.decisionReason}`,
    `Action: ${validationDecision.decisionAction}`,
    "",
    "## Next action",
    `${nextOwner}: ${nextAction}`,
    "",
    "## Answer checks",
    ...items.map(
      (item) =>
        `- [${item.status}] ${item.label} (${item.owner}): matched ${item.matchedSignals.join(", ") || "none"}; missing ${item.missingSignals.join(", ") || "none"}. Action: ${item.action}`
    ),
    "",
    "## Buyer answer",
    buyerAnswer || "No buyer validation answers pasted yet.",
    "",
    "## Verify request",
    "```json",
    receipt.verificationRequestJson,
    "```"
  ].join("\n");

  return {
    status,
    headline,
    summary,
    confidence,
    answeredCount,
    totalCount,
    recommendedBuyerDecision: validationDecision.recommendedBuyerDecision,
    decisionReason: validationDecision.decisionReason,
    decisionAction: validationDecision.decisionAction,
    nextOwner,
    nextAction,
    sourceReceiptId,
    sourceChecksum,
    buyerAnswer,
    items,
    receipt,
    receiptHref: receipt.verificationRequestHref,
    verifierHref: receiptVerifierPrefillHref(receipt.verificationRequestJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickBuyerImpactSnapshot(input: {
  buyer: string;
  workflow: string;
  valueMap: QuickBuyerValueMap;
  handoffBrief: QuickBuyerHandoffBrief;
  decisionCase: QuickBuyerDecisionCase;
  validationRubric: QuickBuyerValidationRubric;
  proofRepairPlan: QuickProofRepairPlan;
}): QuickBuyerImpactSnapshot {
  const valueMapItem = (id: QuickBuyerValueMapItem["id"]) => input.valueMap.items.find((item) => item.id === id);
  const beforeItem = valueMapItem("before");
  const agentRunItem = valueMapItem("agent-run");
  const measuredValueItem = valueMapItem("measured-value");
  const proofItem = valueMapItem("buyer-proof");
  const decisionStatus = mergedPreviewStatus(input.decisionCase.status, input.validationRubric.status);
  const metrics: QuickBuyerImpactSnapshotMetric[] = [
    {
      id: "manual-burden",
      label: "Manual burden",
      status: mergedPreviewStatus(beforeItem?.status ?? "blocked", agentRunItem?.status ?? "blocked"),
      value: agentRunItem?.detail || agentRunItem?.value || "Measured run not extracted yet.",
      detail: input.valueMap.beforeState,
      evidence: beforeItem?.evidence || "Buyer, workflow, baseline, and success metric must be explicit.",
      href: beforeItem?.href || "#quick-workflow-intake"
    },
    {
      id: "monthly-value",
      label: "Monthly value",
      status: measuredValueItem?.status ?? "blocked",
      value: input.valueMap.buyerOutcome,
      detail: measuredValueItem?.detail || input.decisionCase.valueEvidence,
      evidence: measuredValueItem?.evidence || "Success metric must be explicit before buyer review.",
      href: measuredValueItem?.href || "#buyer-value-simulator"
    },
    {
      id: "proof-risk",
      label: "Proof risk",
      status: proofItem?.status ?? "blocked",
      value: proofReadinessLine(input.proofRepairPlan),
      detail: input.decisionCase.proofEvidence,
      evidence: proofItem?.evidence || "Attach buyer-facing public proof links before sharing.",
      href: proofItem?.href || `#${QUICK_PROOF_REPAIR_PLAN_ID}`
    },
    {
      id: "decision-gate",
      label: "Decision gate",
      status: decisionStatus,
      value: input.decisionCase.decisionLabel,
      detail: input.validationRubric.decisionRule,
      evidence: input.decisionCase.buyerQuestion,
      href: input.decisionCase.caseHref
    }
  ];
  const status = mergedPreviewStatus(...metrics.map((metric) => metric.status));
  const nextAction =
    status === "ready" ? "Run live verification, then route the buyer room." : `${input.handoffBrief.nextAction.owner}: ${input.handoffBrief.nextAction.action}`;
  const headline =
    status === "ready"
      ? "Impact snapshot is buyer-ready"
      : status === "watch"
        ? "Impact snapshot needs proof closure"
        : "Impact snapshot needs buyer evidence";
  const summary =
    status === "ready"
      ? `${input.buyer} can see the baseline, measured value, proof risk, and decision gate before opening exports.`
      : `The buyer story is visible, but ${nextAction}`;
  const afterState =
    status === "ready"
      ? "Manual review becomes a supervised pilot with public proof and a decision gate."
      : `${input.handoffBrief.nextAction.owner} must close ${input.handoffBrief.nextAction.label.toLowerCase()} before this is buyer-safe.`;
  const exportMarkdown = [
    "# Buyer impact snapshot",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Before: ${input.valueMap.beforeState}`,
    `After: ${afterState}`,
    `Next action: ${nextAction}`,
    "",
    "## Metrics",
    ...metrics.map((metric) => `- [${metric.status}] ${metric.label}: ${metric.value}. ${metric.detail} Evidence: ${metric.evidence}`)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    beforeState: input.valueMap.beforeState,
    afterState,
    nextAction,
    metrics,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickBuyerSendMemo(input: {
  buyer: string;
  workflow: string;
  status: QuickBuyerRoomPreviewStatus;
  rows: QuickBuyerRoomPreviewRow[];
  primaryAsk: string;
  closeRule: string;
  handoffBrief: QuickBuyerHandoffBrief;
  decisionCase: QuickBuyerDecisionCase;
  proofRepairPlan: QuickProofRepairPlan;
}): QuickBuyerSendMemo {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => input.rows.find((item) => item.id === id);
  const valueStatus = mergedPreviewStatus(row("value")?.status ?? "blocked", row("pilot")?.status ?? "blocked");
  const proofStatus = input.proofRepairPlan.repairCount === 0 ? "ready" : input.proofRepairPlan.readyCount > 0 ? "watch" : "blocked";
  const trustStatus = row("a2a")?.status ?? "blocked";
  const subject =
    input.status === "ready"
      ? `Buyer pilot packet ready: ${input.buyer}`
      : input.status === "watch"
        ? `Review buyer pilot packet: ${input.buyer}`
        : `Hold buyer pilot packet: ${input.buyer}`;
  const headline =
    input.status === "ready"
      ? "Send memo is ready after live proof"
      : input.status === "watch"
        ? "Send memo is drafted, but held"
        : "Send memo is internal only";
  const summary =
    input.status === "ready"
      ? "A short buyer-facing note is ready to export once live proof is checked."
      : "The note names the buyer value and the exact owner action before anything is sent.";
  const nextAction =
    input.status === "ready"
      ? "Run live proof verification, then send the launch room."
      : `${input.handoffBrief.nextAction.owner}: ${input.handoffBrief.nextAction.action}`;
  const bodyText = [
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Decision: ${input.decisionCase.decisionLabel}`,
    `Question: ${input.decisionCase.buyerQuestion}`,
    "",
    "Buyer message",
    ...input.handoffBrief.buyerMessage.map((line) => `- ${line}`),
    "",
    `Value proof: ${input.decisionCase.valueEvidence}`,
    `Public proof: ${input.decisionCase.proofEvidence}`,
    `Agent trust: ${input.decisionCase.trustEvidence}`,
    `Data boundary: ${input.decisionCase.dataBoundary}`,
    "",
    `Next action: ${nextAction}`,
    `Close rule: ${input.closeRule}`
  ].join("\n");
  const items: QuickBuyerSendMemoItem[] = [
    {
      id: "decision",
      label: "Decision",
      status: input.decisionCase.status,
      value: input.decisionCase.decisionLabel,
      detail: input.decisionCase.answer
    },
    {
      id: "value",
      label: "Value proof",
      status: valueStatus,
      value: input.handoffBrief.promise,
      detail: input.decisionCase.valueEvidence
    },
    {
      id: "proof",
      label: "Proof gate",
      status: proofStatus,
      value: proofReadinessLine(input.proofRepairPlan),
      detail: input.decisionCase.proofEvidence
    },
    {
      id: "trust",
      label: "Trust boundary",
      status: trustStatus,
      value: input.decisionCase.trustEvidence,
      detail: input.decisionCase.dataBoundary
    },
    {
      id: "next-action",
      label: "Next action",
      status: input.handoffBrief.nextAction.status,
      value: nextAction,
      detail: input.primaryAsk
    }
  ];
  const exportMarkdown = [
    "# Buyer send memo",
    "",
    `Status: ${input.status}`,
    `Subject: ${subject}`,
    `Buyer: ${input.buyer}`,
    `Decision: ${input.decisionCase.decisionLabel}`,
    `Next action: ${nextAction}`,
    "",
    "## Proof rows",
    ...items.map((item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.detail}`),
    "",
    "## Body",
    bodyText
  ].join("\n");

  return {
    status: input.status,
    headline,
    subject,
    summary,
    nextAction,
    bodyText,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    mailtoHref: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`,
    items
  };
}

function agendaStatusToQuick(status: BuyerDecisionAgendaStatus): QuickBuyerRoomPreviewStatus {
  return status === "attention" ? "watch" : status;
}

function buildQuickBuyerEvidencePack(input: {
  buyer: string;
  workflow: string;
  previewStatus: QuickBuyerRoomPreviewStatus;
  decisionCase: QuickBuyerDecisionCase;
  sendMemo: QuickBuyerSendMemo;
  claimProofLedger: QuickClaimProofLedger;
  proofRepairPlan: QuickProofRepairPlan;
  publicSafeRedactionPacket: QuickPublicSafeRedactionPacket;
  evidenceCompletionPacket: QuickEvidenceCompletionPacket;
  pilotWeekTaskPacket: QuickPilotWeekTaskPacket;
  decisionClosePack: QuickDecisionClosePack;
  conversionReceipt: QuickWorkflowConversionReceipt;
}): QuickBuyerEvidencePack {
  const proofRepairStatus: QuickBuyerRoomPreviewStatus =
    input.proofRepairPlan.repairCount === 0 ? "ready" : input.proofRepairPlan.readyCount > 0 || input.proofRepairPlan.invalidCount > 0 ? "watch" : "blocked";
  const conversionStatus: QuickBuyerRoomPreviewStatus = input.conversionReceipt.verification.status === "verified" ? input.conversionReceipt.status : "blocked";
  const firstProofRepairItem = input.proofRepairPlan.items.find((item) => item.status !== "ready");
  const proofRepairHref = firstProofRepairItem ? quickProofRepairFieldHref(firstProofRepairItem.id) : input.proofRepairPlan.repairHref;
  const artifacts: QuickBuyerEvidencePackArtifact[] = [
    {
      id: "decision-case",
      label: "Buyer decision case",
      status: input.decisionCase.status,
      href: input.decisionCase.caseHref,
      role: input.decisionCase.owner,
      proof: input.decisionCase.answer,
      requiredForSend: true
    },
    {
      id: "send-memo",
      label: "Buyer send memo",
      status: input.sendMemo.status,
      href: input.sendMemo.exportHref,
      role: "Sponsor owner",
      proof: input.sendMemo.subject,
      requiredForSend: true
    },
    {
      id: "claim-ledger",
      label: "Claim-proof ledger",
      status: input.claimProofLedger.status,
      href: input.claimProofLedger.exportHref,
      role: "Proof owner",
      proof: `${input.claimProofLedger.readyCount}/${input.claimProofLedger.items.length} claims ready; ${input.claimProofLedger.primaryRisk}`,
      requiredForSend: true
    },
    {
      id: "proof-repair",
      label: "Public proof repair",
      status: proofRepairStatus,
      href: proofRepairHref,
      role: firstProofRepairItem?.owner ?? "Proof owner",
      proof: proofReadinessLine(input.proofRepairPlan),
      requiredForSend: true
    },
    {
      id: "redaction",
      label: "Public-safe redaction",
      status: input.publicSafeRedactionPacket.status,
      href: input.publicSafeRedactionPacket.exportHref,
      role: "Security owner",
      proof: input.publicSafeRedactionPacket.headline,
      requiredForSend: true
    },
    {
      id: "conversion-receipt",
      label: "Conversion receipt verifier",
      status: conversionStatus,
      href: input.conversionReceipt.verifierHref,
      role: "Reviewer",
      proof: `${input.conversionReceipt.receiptId} / ${input.conversionReceipt.checksumAlgorithm}:${input.conversionReceipt.checksum}`,
      requiredForSend: true
    },
    {
      id: "pilot-week",
      label: "Pilot week task pack",
      status: input.previewStatus,
      href: input.pilotWeekTaskPacket.kickoffHref,
      role: "Pilot owner",
      proof: `${input.pilotWeekTaskPacket.receipt.receiptId} task receipt`,
      requiredForSend: false
    },
    {
      id: "decision-close",
      label: "Decision close pack",
      status: agendaStatusToQuick(input.decisionClosePack.status),
      href: input.decisionClosePack.followUpHref,
      role: input.decisionClosePack.followUpLedger.tasks.find((task) => task.status !== "ready")?.owner ?? "Decision owner",
      proof: `${input.decisionClosePack.followUpLedger.readyCount}/${input.decisionClosePack.followUpLedger.taskTotal} follow-up tasks ready`,
      requiredForSend: false
    }
  ];
  const firstOpenRequired =
    artifacts.find((artifact) => artifact.id === "proof-repair" && artifact.requiredForSend && artifact.status !== "ready") ??
    artifacts.find((artifact) => artifact.requiredForSend && artifact.status !== "ready");
  const status: QuickBuyerRoomPreviewStatus = input.previewStatus === "blocked" ? "blocked" : firstOpenRequired ? "watch" : "ready";
  const label =
    status === "ready"
      ? "Buyer-send evidence pack"
      : status === "watch"
        ? "Sponsor repair evidence pack"
        : "Internal repair evidence pack";
  const headline =
    status === "ready"
      ? `${input.buyer} can receive a verifiable evidence pack`
      : status === "watch"
        ? `Hold buyer send until ${firstOpenRequired?.label ?? "evidence"} closes`
        : `Keep ${input.buyer} evidence internal`;
  const summary =
    status === "ready"
      ? "Decision case, send memo, claim ledger, public-safe redaction, and receipt verifier are bundled for the next review."
      : status === "watch"
        ? `${firstOpenRequired?.role ?? "Owner"} must close ${firstOpenRequired?.label ?? "the open evidence item"} before this becomes buyer-sendable.`
        : "Use this as the internal repair path; it names the open proof and keeps the buyer route closed.";
  const sendRule =
    status === "ready"
      ? "Send only after live proof verification passes in the current review window and keep the receipt verifier link attached."
      : status === "watch"
        ? `Do not send externally until ${firstOpenRequired?.label ?? "the open evidence item"} is ready and the conversion receipt verifier still passes.`
        : "Internal repair only. Do not send to a buyer or external reviewer until the required evidence artifacts are ready.";
  const firstAction = firstOpenRequired
    ? { label: `Fix ${firstOpenRequired.label}`, href: firstOpenRequired.href }
    : { label: "Open receipt verifier", href: input.conversionReceipt.verifierHref };
  const exportMarkdown = [
    "# Buyer evidence pack",
    "",
    `Status: ${status}`,
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Label: ${label}`,
    `Decision: ${input.decisionCase.decisionLabel}`,
    `Send rule: ${sendRule}`,
    `Verifier: ${input.conversionReceipt.verifierHref}`,
    `First action: ${firstAction.label} (${firstAction.href})`,
    "",
    headline,
    summary,
    "",
    "## Required before buyer send",
    ...artifacts
      .filter((artifact) => artifact.requiredForSend)
      .map((artifact) => `- [${artifact.status}] ${artifact.label} (${artifact.role}): ${artifact.proof} (${artifact.href})`),
    "",
    "## Operating packet",
    ...artifacts
      .filter((artifact) => !artifact.requiredForSend)
      .map((artifact) => `- [${artifact.status}] ${artifact.label} (${artifact.role}): ${artifact.proof} (${artifact.href})`)
  ].join("\n");
  const sharePayload: QuickBuyerEvidencePackSharePayload = {
    version: QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION,
    buyer: input.buyer,
    workflow: input.workflow,
    status,
    label,
    headline,
    summary,
    sendRule,
    verifierHref: quickBuyerEvidenceShareHref(input.conversionReceipt.verifierHref) || "/receipt-verifier",
    verificationApiPath: input.conversionReceipt.verificationApiPath,
    sourceReceiptId: input.conversionReceipt.receiptId,
    sourceChecksum: `${input.conversionReceipt.checksumAlgorithm}:${input.conversionReceipt.checksum}`,
    firstAction: {
      label: firstAction.label,
      href: quickBuyerEvidenceShareHref(firstAction.href) || "#"
    },
    artifacts: artifacts.map(quickBuyerEvidencePackShareArtifactFrom)
  };
  const sharePayloadJson = JSON.stringify(sharePayload, null, 2);

  return {
    status,
    label,
    headline,
    summary,
    sendRule,
    verifierHref: input.conversionReceipt.verifierHref,
    firstAction,
    artifacts,
    sharePayloadJson,
    shareHref: quickBuyerEvidencePackShareHref(sharePayloadJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickBuyerRoomMarkdown(preview: Omit<QuickBuyerRoomPreview, "exportMarkdown">) {
  return [
    `# ${preview.headline}`,
    "",
    `Status: ${preview.status}`,
    `Buyer: ${preview.buyer}`,
    `Primary ask: ${preview.primaryAsk}`,
    `Close rule: ${preview.closeRule}`,
    "",
    preview.summary,
    "",
    "## Buyer evidence pack",
    `Status: ${preview.evidencePack.status}`,
    `Label: ${preview.evidencePack.label}`,
    `Send rule: ${preview.evidencePack.sendRule}`,
    `Verifier: ${preview.evidencePack.verifierHref}`,
    `First action: ${preview.evidencePack.firstAction.label} (${preview.evidencePack.firstAction.href})`,
    ...preview.evidencePack.artifacts.map(
      (artifact) => `- [${artifact.status}] ${artifact.label} (${artifact.role}): ${artifact.proof}. Required for send: ${artifact.requiredForSend ? "yes" : "no"}`
    ),
    "",
    "## Sponsor send gate",
    `Decision: ${preview.sponsorSendGate.label}`,
    `Score: ${preview.sponsorSendGate.score}/100`,
    `Ready: ${preview.sponsorSendGate.readyCount}/${preview.sponsorSendGate.totalCount}`,
    `Send rule: ${preview.sponsorSendGate.sendRule}`,
    `Next action: ${preview.sponsorSendGate.nextOwner} - ${preview.sponsorSendGate.nextAction}`,
    `Source receipt: ${preview.sponsorSendGate.sourceReceiptId}`,
    `Source checksum: ${preview.sponsorSendGate.sourceChecksum}`,
    `Verifier: ${preview.sponsorSendGate.verifierHref}`,
    ...preview.sponsorSendGate.checks.map(
      (check) => `- [${check.status}] ${check.label} (${check.owner}): ${check.question} Answer: ${check.answer} Evidence: ${check.evidence} Action: ${check.action}`
    ),
    "",
    "## Workflow conversion receipt",
    `Receipt: ${preview.conversionReceipt.receiptId}`,
    `Checksum: ${preview.conversionReceipt.checksumAlgorithm}:${preview.conversionReceipt.checksum}`,
    `Verification: ${preview.conversionReceipt.verification.status}`,
    `API verification: POST ${preview.conversionReceipt.verificationApiPath}`,
    `Verifier: ${preview.conversionReceipt.verifierHref}`,
    preview.conversionReceipt.headline,
    preview.conversionReceipt.summary,
    ...preview.conversionReceipt.items.map(
      (item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.detail}`
    ),
    "",
    "## Source trace",
    ...preview.sourceTrace.map((item) =>
      `- [${item.status}] ${item.label}: ${item.extracted}. Source: ${item.sourceLineNumber ? `L${item.sourceLineNumber} ${item.sourceLine}` : "missing"}. Next: ${item.action}`
    ),
    "",
    "## Public-safe redaction packet",
    `Status: ${preview.publicSafeRedactionPacket.status}`,
    `Receipt: ${preview.publicSafeRedactionPacket.receipt.receiptId}`,
    preview.publicSafeRedactionPacket.headline,
    preview.publicSafeRedactionPacket.summary,
    ...preview.publicSafeRedactionPacket.findings.map(
      (finding) =>
        `- [${finding.status}] ${finding.label}: ${finding.sourceLabel}${finding.sourceLineNumber ? ` L${finding.sourceLineNumber}` : ""}. Redacted: ${finding.redactedLine}. Next: ${finding.action}`
    ),
    "",
    "### Redacted workflow note",
    preview.publicSafeRedactionPacket.redactedWorkflowNote,
    "",
    "### Public-safe rewrite",
    preview.publicSafeRedactionPacket.publicSafeWorkflowNote,
    "",
    "## Evidence completion packet",
    `Status: ${preview.evidenceCompletionPacket.status}`,
    `Receipt: ${preview.evidenceCompletionPacket.receipt.receiptId}`,
    preview.evidenceCompletionPacket.headline,
    preview.evidenceCompletionPacket.summary,
    ...preview.evidenceCompletionPacket.items.map(
      (item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.ask} Source line: ${item.sourceLine.replace(/\n/g, " / ")} Evidence: ${item.evidence}`
    ),
    "",
    "### Completion note",
    preview.evidenceCompletionPacket.completionNote,
    "",
    "## Buyer decision case",
    `Decision: ${preview.decisionCase.decisionLabel}`,
    `Question: ${preview.decisionCase.buyerQuestion}`,
    `Answer: ${preview.decisionCase.answer}`,
    `Value evidence: ${preview.decisionCase.valueEvidence}`,
    `Public proof: ${preview.decisionCase.proofEvidence}`,
    `Agent trust: ${preview.decisionCase.trustEvidence}`,
    `Data boundary: ${preview.decisionCase.dataBoundary}`,
    `Next action: ${preview.decisionCase.owner} - ${preview.decisionCase.nextAction}`,
    "",
    "## Buyer impact snapshot",
    preview.impactSnapshot.headline,
    preview.impactSnapshot.summary,
    `Before: ${preview.impactSnapshot.beforeState}`,
    `After: ${preview.impactSnapshot.afterState}`,
    `Next action: ${preview.impactSnapshot.nextAction}`,
    ...preview.impactSnapshot.metrics.map((metric) => `- [${metric.status}] ${metric.label}: ${metric.value}. ${metric.detail} Evidence: ${metric.evidence}`),
    "",
    "## Buyer value map",
    preview.valueMap.headline,
    preview.valueMap.summary,
    `Before: ${preview.valueMap.beforeState}`,
    `After: ${preview.valueMap.afterState}`,
    `Buyer outcome: ${preview.valueMap.buyerOutcome}`,
    `Next action: ${preview.valueMap.nextAction}`,
    ...preview.valueMap.items.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.value}. ${item.detail} Evidence: ${item.evidence}`),
    "",
    "## Buyer validation script",
    preview.validationScript.headline,
    preview.validationScript.summary,
    `Opening: ${preview.validationScript.openingLine}`,
    `Close ask: ${preview.validationScript.closeAsk}`,
    `Next action: ${preview.validationScript.nextAction}`,
    ...preview.validationScript.questions.map(
      (question) =>
        `- [${question.status}] ${question.label} (${question.owner}): ${question.question} Listen for: ${question.listenFor}. Evidence: ${question.evidence}`
    ),
    "",
    "## Buyer validation rubric",
    preview.validationRubric.headline,
    preview.validationRubric.summary,
    `Decision: ${preview.validationRubric.decision}`,
    `Pass count: ${preview.validationRubric.passCount}/${preview.validationRubric.totalCount}`,
    `Decision rule: ${preview.validationRubric.decisionRule}`,
    `Next action: ${preview.validationRubric.nextAction}`,
    ...preview.validationRubric.criteria.map(
      (criterion) =>
        `- [${criterion.status}] ${criterion.label} (${criterion.owner}): Pass if ${criterion.passSignal} Fail if ${criterion.failSignal} Evidence: ${criterion.evidence}`
    ),
    "",
    "## Buyer validation answer sheet",
    preview.validationAnswerSheet.headline,
    preview.validationAnswerSheet.summary,
    `Ready: ${preview.validationAnswerSheet.readyCount}/${preview.validationAnswerSheet.totalCount}`,
    `Decision rule: ${preview.validationAnswerSheet.decisionRule}`,
    `Next action: ${preview.validationAnswerSheet.nextAction}`,
    ...preview.validationAnswerSheet.items.map(
      (item) =>
        `- [${item.status}] ${item.label} (${item.owner}): ${item.question} Answer field: ${item.answerField} Pass: ${item.passSignal} Fail: ${item.failTrigger} Evidence: ${item.evidence} Action: ${item.ownerAction}`
    ),
    "",
    "## Buyer send memo",
    `Subject: ${preview.sendMemo.subject}`,
    `Status: ${preview.sendMemo.status}`,
    `Next action: ${preview.sendMemo.nextAction}`,
    ...preview.sendMemo.items.map((item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.detail}`),
    "",
    "### Buyer send body",
    preview.sendMemo.bodyText,
    "",
    "## Pilot proof contract",
    preview.pilotProofContract.headline,
    preview.pilotProofContract.summary,
    `Value floor: ${preview.pilotProofContract.valueFloor}`,
    `Budget cap: ${preview.pilotProofContract.budgetCap}`,
    `Renewal ask: ${preview.pilotProofContract.renewalAsk}`,
    `Next owner: ${preview.pilotProofContract.nextOwner}`,
    `Next action: ${preview.pilotProofContract.nextAction}`,
    ...preview.pilotProofContract.items.map(
      (item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.value}. ${item.detail} Action: ${item.action}`
    ),
    "",
    "## Pilot economics stress test",
    preview.economicsStressTest.headline,
    preview.economicsStressTest.summary,
    `Range: ${preview.economicsStressTest.monthlyValueRange}`,
    `Risk-adjusted floor: ${formatYen(preview.economicsStressTest.riskAdjustedMonthlyValueYen)}/month`,
    ...preview.economicsStressTest.scenarios.map(
      (scenario) => `- [${scenario.status}] ${scenario.label}: ${formatYen(scenario.monthlyValueYen)}/month, ${scenario.monthlyHoursSaved}h saved. ${scenario.evidence}`
    ),
    "",
    "## Claim-proof ledger",
    preview.claimProofLedger.headline,
    preview.claimProofLedger.summary,
    `Score: ${preview.claimProofLedger.score}/100`,
    `Ready: ${preview.claimProofLedger.readyCount}/${preview.claimProofLedger.items.length}`,
    `Watch: ${preview.claimProofLedger.watchCount}`,
    `Blocked: ${preview.claimProofLedger.blockedCount}`,
    `Primary risk: ${preview.claimProofLedger.primaryRisk}`,
    `Receipt: ${preview.claimProofLedger.receipt.receiptId}`,
    ...preview.claimProofLedger.items.map(
      (item) =>
        `- [${item.status}] ${item.label}: ${item.claim} Evidence: ${item.evidence} Source: ${item.source} (${item.sourceStatus}${item.sourceLineNumber ? ` L${item.sourceLineNumber}` : ""}) Proof: ${item.proof} Next: ${item.nextAction}`
    ),
    "",
    "## Buyer promise gate",
    preview.buyerPromiseGate.headline,
    preview.buyerPromiseGate.summary,
    `Safe use: ${preview.buyerPromiseGate.safeUse}`,
    `Public-safe promise: ${preview.buyerPromiseGate.publicPromise}`,
    `Next action: ${preview.buyerPromiseGate.nextAction}`,
    ...preview.buyerPromiseGate.items.map(
      (item) => `- [${item.status}] ${item.label}: ${item.allowedClaim} Evidence: ${item.evidence} Do not claim: ${item.blockedClaim} Next: ${item.nextAction}`
    ),
    ...preview.buyerPromiseGate.notAllowedClaims.map((claimText) => `- Do not claim yet: ${claimText}`),
    "",
    "## Stakeholder approval route",
    preview.approvalRoute.headline,
    preview.approvalRoute.summary,
    `Ready: ${preview.approvalRoute.readyCount}/4`,
    `Blocked: ${preview.approvalRoute.blockedCount}`,
    ...preview.approvalRoute.steps.map(
      (step) => `- [${step.status}] ${step.label} (${step.owner}): ${step.gate} Evidence: ${step.evidence} Next: ${step.nextAction}`
    ),
    "",
    "## Stakeholder approval email pack",
    preview.approvalEmailPack.headline,
    preview.approvalEmailPack.summary,
    `Next recipient: ${preview.approvalEmailPack.nextRecipient}`,
    `Deadline: ${preview.approvalEmailPack.approvalDeadline}`,
    ...preview.approvalEmailPack.messages.map(
      (message) => `- [${message.status}] ${message.label} (${message.owner}): ${message.subject} Reply: ${message.replyTarget} Evidence: ${message.evidence}`
    ),
    "",
    "## Pilot contract terms",
    preview.pilotContractTerms.headline,
    preview.pilotContractTerms.summary,
    `Budget cap: ${preview.pilotContractTerms.budgetCapYen > 0 ? formatYen(preview.pilotContractTerms.budgetCapYen) : "not ready"}`,
    `Effective window: ${preview.pilotContractTerms.effectiveWindow}`,
    `Clear terms: ${preview.pilotContractTerms.clearCount}/6`,
    `Blocked terms: ${preview.pilotContractTerms.blockedCount}`,
    ...preview.pilotContractTerms.terms.map(
      (term) => `- [${term.status}] ${term.label} (${term.owner}): ${term.clause} Acceptance: ${term.acceptance} Evidence: ${term.evidence}`
    ),
    "",
    "## Pilot contract stop rules",
    ...preview.pilotContractTerms.stopRules.map((rule) => `- ${rule}`),
    "",
    "## Procurement alternative matrix",
    preview.procurementMatrix.headline,
    preview.procurementMatrix.summary,
    `Recommended: ${preview.procurementMatrix.alternatives.find((alternative) => alternative.id === preview.procurementMatrix.recommendedAlternativeId)?.label ?? preview.procurementMatrix.recommendedAlternativeId}`,
    ...preview.procurementMatrix.alternatives.map(
      (alternative) =>
        `- [${alternative.status}] ${alternative.label}: ${formatYen(alternative.monthlyValueYen)}/month floor, ${formatYen(alternative.setupCostYen)} setup, ${formatPaybackDays(alternative.paybackDays)} payback. Decision: ${alternative.decision} Evidence: ${alternative.evidence}`
    ),
    "",
    "## 30-day adoption success plan",
    preview.adoptionSuccessPlan.headline,
    preview.adoptionSuccessPlan.summary,
    `Review window: ${preview.adoptionSuccessPlan.reviewWindow}`,
    `Adoption target: ${preview.adoptionSuccessPlan.adoptionTargetPercent > 0 ? `${preview.adoptionSuccessPlan.adoptionTargetPercent}%` : "not ready"}`,
    `Retained value threshold: ${preview.adoptionSuccessPlan.retainedMonthlyValueYen > 0 ? `${formatYen(preview.adoptionSuccessPlan.retainedMonthlyValueYen)}/month` : "not ready"}`,
    `Renewal ask: ${preview.adoptionSuccessPlan.renewalAsk}`,
    ...preview.adoptionSuccessPlan.metrics.map(
      (metric) => `- [${metric.status}] ${metric.label} (${metric.owner}): ${metric.target} Evidence: ${metric.evidence}`
    ),
    ...preview.adoptionSuccessPlan.checkpoints.map(
      (checkpoint) => `- [${checkpoint.status}] ${checkpoint.window} ${checkpoint.label} (${checkpoint.owner}): ${checkpoint.objective} Exit: ${checkpoint.exitCriteria}`
    ),
    "",
    "## Rollout command board",
    preview.rolloutCommandBoard.headline,
    preview.rolloutCommandBoard.summary,
    `Ready: ${preview.rolloutCommandBoard.readyCount}/5`,
    `Blocked: ${preview.rolloutCommandBoard.blockedCount}`,
    `Next owner: ${preview.rolloutCommandBoard.nextOwner}`,
    `Next command: ${preview.rolloutCommandBoard.nextCommand}`,
    ...preview.rolloutCommandBoard.commands.map(
      (command) => `- [${command.status}] ${command.window} ${command.label} (${command.owner}): ${command.command} Evidence: ${command.evidence} Risk: ${command.risk}`
    ),
    ...preview.rolloutCommandBoard.ownerLoads.map(
      (load) => `- Owner load ${load.owner}: ${load.commandCount} command${load.commandCount === 1 ? "" : "s"}, ${load.blockedCount} blocked. Next: ${load.nextCommand}`
    ),
    "",
    "## Decision close pack",
    preview.decisionClosePack.headline,
    preview.decisionClosePack.summary,
    `Agenda: ${preview.decisionClosePack.agenda.readyCount}/${preview.decisionClosePack.agenda.agendaTotal} ready`,
    `Follow-up: ${preview.decisionClosePack.followUpLedger.readyCount}/${preview.decisionClosePack.followUpLedger.taskTotal} ready`,
    `First action: ${preview.decisionClosePack.followUpLedger.firstAction.label} (${preview.decisionClosePack.followUpLedger.firstAction.href})`,
    `Receipt: ${preview.decisionClosePack.followUpLedger.receipt.receiptId}`,
    ...preview.decisionClosePack.followUpLedger.tasks.map(
      (task) => `- [${task.status}] ${task.label} (${task.owner}, ${task.dueLabel}): ${task.nextStep} Close when: ${task.closeCondition}`
    ),
    "",
    "## Buyer handoff brief",
    `Decision: ${preview.handoffBrief.label}`,
    `Promise: ${preview.handoffBrief.promise}`,
    `Proof: ${preview.handoffBrief.proofSummary}`,
    `Next action: ${preview.handoffBrief.nextAction.owner} - ${preview.handoffBrief.nextAction.action}`,
    ...preview.handoffBrief.buyerMessage.map((line) => `- ${line}`),
    "",
    "## Proof repair plan",
    `Ready: ${preview.proofRepairPlan.readyCount}/5`,
    `Missing: ${preview.proofRepairPlan.missingCount}`,
    ...preview.proofRepairPlan.items.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.action} Proof: ${item.value}`),
    "",
    "## Buyer objection brief",
    `Ready: ${preview.objectionBrief.readyCount}/5`,
    `Unresolved: ${preview.objectionBrief.unresolvedCount}`,
    ...preview.objectionBrief.items.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.question} Answer: ${item.answer} Evidence: ${item.evidence}`),
    "",
    "## Buyer room contents",
    ...preview.rows.map((row) => `- [${row.status}] ${row.label}: ${row.value}. Proof: ${row.proof}`),
    "",
    "## Pilot week plan",
    ...preview.pilotWeekPlan.map((step) => `- [${step.status}] ${step.day} ${step.label} (${step.owner}): ${step.action} Acceptance: ${step.acceptance} Proof: ${step.proof}`),
    "",
    "## Pilot week kickoff",
    preview.pilotWeekTaskPacket.kickoffText,
    "",
    "## Receipt",
    `Receipt: ${preview.pilotWeekTaskPacket.receipt.receiptId}`,
    `Checksum: ${preview.pilotWeekTaskPacket.receipt.checksumAlgorithm}:${preview.pilotWeekTaskPacket.receipt.checksum}`
  ].join("\n");
}

function buildQuickWorkflowConversionReceipt({
  buyer,
  workflow,
  status,
  rows,
  proofRepairPlan,
  decisionCase,
  pilotWeekTaskPacket
}: {
  buyer: string;
  workflow: string;
  status: QuickBuyerRoomPreviewStatus;
  rows: QuickBuyerRoomPreviewRow[];
  proofRepairPlan: QuickProofRepairPlan;
  decisionCase: QuickBuyerDecisionCase;
  pilotWeekTaskPacket: QuickPilotWeekTaskPacket;
}): QuickWorkflowConversionReceipt {
  const readyRows = rows.filter((row) => row.status === "ready").length;
  const firstOpenRow = rows.find((row) => row.status === "blocked") ?? rows.find((row) => row.status === "watch");
  const items: QuickWorkflowConversionReceiptItem[] = [
    {
      id: "buyer-facts",
      label: "Extracted buyer facts",
      status: readyRows === rows.length ? "ready" : readyRows > 0 ? "watch" : "blocked",
      value: `${readyRows}/${rows.length} ready`,
      detail: `${buyer}: ${workflow}`
    },
    {
      id: "artifact-pack",
      label: "Generated artifact pack",
      status,
      value: "Room, decision case, task CSV, kickoff, receipt",
      detail: `Pilot-week receipt ${pilotWeekTaskPacket.receipt.receiptId} is attached to the export.`
    },
    {
      id: "proof-status",
      label: "Public proof status",
      status: proofRepairPlan.repairCount === 0 ? "ready" : proofRepairPlan.readyCount > 0 ? "watch" : "blocked",
      value: proofReadinessLine(proofRepairPlan),
      detail: proofRepairPlan.repairCount === 0 ? "All public proof slots are attached." : proofRepairPlan.items.find((item) => item.status !== "ready")?.action ?? proofRepairPlan.summary
    },
    {
      id: "decision-gate",
      label: "Buyer decision gate",
      status: decisionCase.status,
      value: decisionCase.decisionLabel,
      detail: `${decisionCase.owner}: ${decisionCase.nextAction}`
    }
  ];
  const payload: QuickWorkflowConversionReceiptPayload = {
    receiptVersion: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION,
    source: "quick-workflow-intake",
    buyer,
    workflow,
    status,
    decisionLabel: decisionCase.decisionLabel,
    decisionNextAction: decisionCase.nextAction,
    pilotWeekReceiptId: pilotWeekTaskPacket.receipt.receiptId,
    rows: rows.map((row) => ({
      id: row.id,
      status: row.status,
      value: row.value,
      proof: row.proof
    })),
    proofItems: proofRepairPlan.items.map((item) => ({
      id: item.id,
      status: item.status,
      value: item.value
    }))
  };
  const checksum = quickWorkflowConversionReceiptChecksum(payload);
  const payloadJson = quickWorkflowConversionCanonicalJson(payload);
  const verificationRequestJson = quickWorkflowConversionCanonicalJson({ checksum, payload });
  const verification = verifyQuickWorkflowConversionReceipt({ checksum, payload });

  return {
    status,
    receiptId: `quick-conversion-${status}-${checksum}`,
    receiptVersion: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION,
    checksumAlgorithm: "fnv1a32",
    checksum,
    verificationApiPath: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verifierHref: receiptVerifierPrefillHref(verificationRequestJson),
    verification,
    headline:
      status === "ready"
        ? "Workflow note became a sendable buyer packet"
        : status === "watch"
          ? "Workflow note became a reviewable buyer packet"
          : "Workflow note became an internal repair packet",
    summary:
      status === "ready"
        ? "The buyer facts, proof links, decision case, and pilot-week exports are joined by one checksum trail."
        : `The packet is useful, but ${firstOpenRow?.label ?? "buyer proof"} still needs owner closure before external sharing.`,
    items
  };
}

function completionPlaceholder(label: string) {
  return `<${label}>`;
}

function completionValueLine(draft: WorkflowIntakeDraft) {
  const teamSize = draft.buyerScenario.teamSize ?? completionPlaceholder("team size");
  const cycles = draft.buyerScenario.cyclesPerMonth ?? completionPlaceholder("cycles per month");
  const manualHours = draft.buyerScenario.manualHoursPerCycle ?? completionPlaceholder("manual hours per cycle");
  const adoption = draft.buyerScenario.adoptionRatePercent ?? completionPlaceholder("adoption percent");
  const hourlyCost = draft.buyerScenario.hourlyCostYen ?? completionPlaceholder("hourly cost yen");
  const risk = draft.buyerScenario.incidentRiskYenPerMonth ?? completionPlaceholder("monthly risk yen");
  return `Team ${teamSize} people, ${cycles} reviews/month, manual ${manualHours} hours per review, ${adoption}% adoption, hourly ¥${hourlyCost}, risk ¥${risk}.`;
}

function completionPilotLine(draft: WorkflowIntakeDraft) {
  const pilot = draft.pilotRun;
  return `Pilot: manual ${pilot.observedManualMinutes ?? completionPlaceholder("manual minutes")} min, assisted ${pilot.observedAssistedMinutes ?? completionPlaceholder("assisted minutes")} min, ${pilot.participants ?? completionPlaceholder("participants")} participants, ${pilot.acceptedTasks ?? completionPlaceholder("accepted tasks")}/${pilot.totalTasks ?? completionPlaceholder("total tasks")} tasks accepted.`;
}

function completionA2ALine(draft: WorkflowIntakeDraft) {
  const trial = draft.agentTrialEvidence;
  return `Accepted A2A trial receipt: ${trial?.agentName ?? completionPlaceholder("agent name")} / ${trial?.skillId ?? completionPlaceholder("skill id")} / score ${trial?.score ?? completionPlaceholder("score")} / ${trial?.artifactUrl ?? completionPlaceholder("https receipt url")}.`;
}

function completionScopeLine(draft: WorkflowIntakeDraft) {
  return [
    draft.workOrder.targetUser ? "" : `Buyer: ${completionPlaceholder("target buyer")}`,
    draft.workOrder.request ? "" : `Workflow: ${completionPlaceholder("bounded workflow request")}`,
    `Baseline: ${draft.workOrder.currentBaseline || completionPlaceholder("current manual/scattered baseline")}`,
    `Success: ${draft.workOrder.successMetric || completionPlaceholder("measurable buyer outcome and close rule")}`
  ]
    .filter(Boolean)
    .join("\n");
}

function completionDataLine(publicSafeRedactionPacket: QuickPublicSafeRedactionPacket) {
  const dataLine = publicSafeRedactionPacket.publicSafeWorkflowNote
    .split("\n")
    .find((line) => /^Data\s*:/i.test(line.trim()));
  return dataLine || "Data: public-safe redacted evidence.";
}

function completionProofLine(item: QuickProofRepairItem) {
  const prefixById: Record<QuickProofLinkId, string> = {
    targetUrl: "Deployment",
    protopediaUrl: "ProtoPedia",
    videoUrl: "Walkthrough",
    pilotEvidenceUrl: "Pilot receipt",
    workOrderEvidenceUrl: "Work order proof"
  };
  return `${prefixById[item.id]}: ${item.value === "Missing public URL" ? item.placeholder : item.value}`;
}

function completionNoteFrom(baseNote: string, items: QuickEvidenceCompletionItem[]) {
  const lines = [
    ...baseNote.split("\n"),
    ...items.flatMap((item) => item.sourceLine.split("\n"))
  ]
    .map((line) => line.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  return lines
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");
}

function buildQuickEvidenceCompletionPacket(input: {
  draft: WorkflowIntakeDraft;
  buyer: string;
  workflow: string;
  rows: QuickBuyerRoomPreviewRow[];
  proofRepairPlan: QuickProofRepairPlan;
  publicSafeRedactionPacket: QuickPublicSafeRedactionPacket;
}): QuickEvidenceCompletionPacket {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => input.rows.find((item) => item.id === id);
  const candidateItems: QuickEvidenceCompletionItem[] = [
    {
      id: "row-scope",
      label: "Buyer scope",
      status: row("scope")?.status ?? "blocked",
      owner: input.buyer,
      ask: "Add explicit baseline and success lines so the workflow can be evaluated.",
      sourceLine: completionScopeLine(input.draft),
      evidence: row("scope")?.proof || input.workflow,
      href: "#quick-workflow-intake"
    },
    {
      id: "row-value",
      label: "Value model",
      status: row("value")?.status ?? "blocked",
      owner: "Finance owner",
      ask: "Collect the recurring value model with team size, frequency, manual hours, adoption, cost, and risk.",
      sourceLine: completionValueLine(input.draft),
      evidence: row("value")?.value || "Value model missing",
      href: "#buyer-value-simulator"
    },
    {
      id: "row-pilot",
      label: "Measured pilot",
      status: row("pilot")?.status ?? "blocked",
      owner: input.draft.pilotRun.reviewerName || "Pilot reviewer",
      ask: "Run or record one measured manual-vs-assisted pilot with accepted tasks and participants.",
      sourceLine: completionPilotLine(input.draft),
      evidence: row("pilot")?.value || "Measured run missing",
      href: "#pilot-run-receipt"
    },
    ...input.proofRepairPlan.items.map((item): QuickEvidenceCompletionItem => ({
      id: `proof-${item.id}`,
      label: item.label,
      status: item.status,
      owner: item.owner,
      ask: item.action,
      sourceLine: completionProofLine(item),
      evidence: item.value,
      href: quickProofRepairFieldHref(item.id)
    })),
    {
      id: "row-a2a",
      label: "A2A trial receipt",
      status: row("a2a")?.status ?? "blocked",
      owner: input.draft.agentTrialEvidence?.agentName || "A2A operator",
      ask: "Attach an accepted A2A trial receipt with agent name, skill ID, score, and public receipt URL.",
      sourceLine: completionA2ALine(input.draft),
      evidence: row("a2a")?.value || "A2A trial missing",
      href: "#agent-card-intake"
    },
    {
      id: "row-data",
      label: "Data boundary",
      status: row("data")?.status ?? "blocked",
      owner: "Security owner",
      ask: "Replace restricted or internal evidence with the public-safe data line before sharing.",
      sourceLine: completionDataLine(input.publicSafeRedactionPacket),
      evidence: row("data")?.proof || "Data boundary missing",
      href: "#buyer-trust-center"
    }
  ];
  const items = candidateItems.filter((item) => item.status !== "ready" || /<[^>]+>/.test(item.sourceLine));
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const watchCount = items.filter((item) => item.status === "watch").length;
  const openCount = items.length;
  const status: QuickBuyerRoomPreviewStatus = blockedCount > 0 ? "blocked" : watchCount > 0 ? "watch" : "ready";
  const firstItem = items[0];
  const headline =
    status === "ready"
      ? "Evidence completion packet is closed"
      : status === "watch"
        ? "Evidence completion packet needs owner review"
        : "Evidence completion packet gives the next source lines";
  const summary =
    status === "ready"
      ? "The pasted workflow has the source lines needed for external buyer review."
      : `${openCount} source line${openCount === 1 ? "" : "s"} still need owner input before the buyer room can be sent. Next: ${firstItem?.owner ?? "Owner"} must ${firstItem?.ask.toLowerCase() ?? "complete the evidence"}`;
  const completionNote = completionNoteFrom(input.publicSafeRedactionPacket.publicSafeWorkflowNote, items);
  const exportMarkdown = [
    "# Evidence completion packet",
    "",
    `Status: ${status}`,
    headline,
    summary,
    "",
    "## Owner asks",
    ...(items.length
      ? items.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.ask} Source line: ${item.sourceLine.replace(/\n/g, " / ")} Evidence: ${item.evidence}`)
      : ["- [ready] No missing source lines remain."]),
    "",
    "## Completion note",
    completionNote
  ].join("\n");
  const checksum = stablePacketHash(exportMarkdown);
  const receipt = {
    receiptId: `quick-evidence-completion-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum
  };

  return {
    status,
    headline,
    summary,
    openCount,
    blockedCount,
    watchCount,
    items,
    completionNote,
    completionNoteHref: `data:text/plain;charset=utf-8,${encodeURIComponent(completionNote)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    receipt,
    receiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(receipt, null, 2))}`
  };
}

function sendGateLabel(decision: QuickSponsorSendGateDecision) {
  if (decision === "send-after-live-proof") return "Send after live proof";
  if (decision === "repair-before-sponsor") return "Repair before sponsor";
  return "Hold internal";
}

function sentenceStem(value: string) {
  return value.trim().replace(/[.!?]+$/, "");
}

function buildQuickSponsorSendGate(input: {
  buyer: string;
  workflow: string;
  status: QuickBuyerRoomPreviewStatus;
  closeRule: string;
  handoffBrief: QuickBuyerHandoffBrief;
  objectionBrief: QuickBuyerObjectionBrief;
  buyerPromiseGate: QuickBuyerPromiseGate;
  economicsStressTest: QuickPilotEconomicsStressTest;
  conversionReceipt: QuickWorkflowConversionReceipt;
}): QuickSponsorSendGate {
  const objection = (id: QuickBuyerObjectionItem["id"]) => input.objectionBrief.items.find((item) => item.id === id);
  const value = objection("valueProof");
  const proof = objection("publicProof");
  const trust = objection("agentTrust");
  const data = objection("dataBoundary");
  const approval = objection("adoptionPath");
  const checks: QuickSponsorSendGateCheck[] = [
    {
      id: "value",
      label: "Value claim",
      status: mergedPreviewStatus(value?.status ?? "blocked", input.economicsStressTest.status),
      question: value?.question ?? "What value is proven?",
      answer: value?.answer ?? input.economicsStressTest.summary,
      evidence: `${input.economicsStressTest.monthlyValueRange}; ${value?.evidence ?? "Value proof missing"}`,
      owner: value?.owner ?? "Value owner",
      action: value?.status === "ready" && input.economicsStressTest.status === "ready" ? "Keep the value range attached to the sponsor packet." : "Attach measured savings and downside value before sponsor review.",
      href: value?.href ?? "#buyer-value-simulator"
    },
    {
      id: "proof",
      label: "Open proof",
      status: proof?.status ?? "blocked",
      question: proof?.question ?? "Can the reviewer open the proof?",
      answer: proof?.answer ?? "Public proof is missing.",
      evidence: proof?.evidence ?? "Proof links must be public HTTPS URLs.",
      owner: proof?.owner ?? "Proof owner",
      action: proof?.status === "ready" ? "Run live verification immediately before sending." : "Close the first public proof repair before sponsor review.",
      href: proof?.href ?? "#launch-evidence-console"
    },
    {
      id: "trust",
      label: "Agent trust",
      status: trust?.status ?? "blocked",
      question: trust?.question ?? "Why trust the agent action?",
      answer: trust?.answer ?? "Accepted A2A trial receipt is missing.",
      evidence: trust?.evidence ?? "Attach an accepted A2A receipt.",
      owner: trust?.owner ?? "A2A operator",
      action: trust?.status === "ready" ? "Keep the accepted A2A receipt in the evidence pack." : "Run or attach the accepted A2A trial receipt.",
      href: trust?.href ?? "#agent-card-intake"
    },
    {
      id: "data",
      label: "Data boundary",
      status: data?.status ?? "blocked",
      question: data?.question ?? "What data can leave the team?",
      answer: data?.answer ?? "Data boundary must be explicit.",
      evidence: data?.evidence ?? "Public-safe or redacted evidence line is required.",
      owner: data?.owner ?? "Security owner",
      action: data?.status === "ready" ? "Keep public-safe evidence language in the sponsor packet." : "Replace internal or restricted context before sponsor review.",
      href: data?.href ?? "#buyer-trust-center"
    },
    {
      id: "approval",
      label: "Approval path",
      status: mergedPreviewStatus(approval?.status ?? "blocked", input.buyerPromiseGate.status),
      question: approval?.question ?? "What happens after the pilot?",
      answer: approval?.answer ?? input.buyerPromiseGate.nextAction,
      evidence: approval?.evidence ?? input.buyerPromiseGate.publicPromise,
      owner: approval?.owner ?? input.handoffBrief.nextAction.owner,
      action: input.buyerPromiseGate.status === "ready" ? "Attach the promise gate and stop rule to the sponsor ask." : input.buyerPromiseGate.nextAction,
      href: approval?.href ?? input.handoffBrief.nextAction.href
    }
  ];
  const readyCount = checks.filter((check) => check.status === "ready").length;
  const blockedCount = checks.filter((check) => check.status === "blocked").length;
  const score = Math.round(checks.reduce((sum, check) => sum + rowStatusScore(check.status), 0) / checks.length);
  const status: QuickBuyerRoomPreviewStatus = blockedCount > 0 ? "blocked" : readyCount === checks.length ? "ready" : "watch";
  const firstOpen = checks.find((check) => check.status === "blocked") ?? checks.find((check) => check.status === "watch");
  const decision: QuickSponsorSendGateDecision =
    status === "ready" && score >= 90 ? "send-after-live-proof" : blockedCount >= 2 || data?.status === "blocked" ? "hold-internal" : "repair-before-sponsor";
  const label = sendGateLabel(decision);
  const sendRule =
    decision === "send-after-live-proof"
      ? "Sponsor can receive this packet after live proof verification passes."
      : decision === "repair-before-sponsor"
        ? `${firstOpen?.owner ?? input.handoffBrief.nextAction.owner} must close ${firstOpen?.label ?? input.handoffBrief.nextAction.label} before sponsor review.`
        : `Keep this packet internal until ${firstOpen?.owner ?? input.handoffBrief.nextAction.owner} closes ${firstOpen?.label ?? input.handoffBrief.nextAction.label}.`;
  const headline =
    decision === "send-after-live-proof"
      ? `${input.buyer} has a sponsor-ready send gate`
      : decision === "repair-before-sponsor"
        ? `Sponsor gate needs ${firstOpen?.label ?? input.handoffBrief.nextAction.label}`
        : `Sponsor gate blocks external sharing`;
  const summary = `${readyCount}/${checks.length} sponsor questions are answered for ${sentenceStem(input.workflow)}. ${sendRule}`;
  const nextOwner = firstOpen?.owner ?? input.handoffBrief.nextAction.owner;
  const nextAction = firstOpen?.action ?? "Run live proof verification before sending.";
  const sourceChecksum = `${input.conversionReceipt.checksumAlgorithm}:${input.conversionReceipt.checksum}`;
  const exportMarkdown = [
    "# Sponsor send gate",
    "",
    `Buyer: ${input.buyer}`,
    `Workflow: ${input.workflow}`,
    `Decision: ${label}`,
    `Score: ${score}/100`,
    `Ready: ${readyCount}/${checks.length}`,
    `Send rule: ${sendRule}`,
    `Close rule: ${input.closeRule}`,
    `Source receipt: ${input.conversionReceipt.receiptId}`,
    `Source checksum: ${sourceChecksum}`,
    `Verifier: ${input.conversionReceipt.verifierHref}`,
    "",
    "## Checks",
    ...checks.map((check) => `- [${check.status}] ${check.label} (${check.owner}): ${check.question} Answer: ${check.answer} Evidence: ${check.evidence} Action: ${check.action}`)
  ].join("\n");
  const receiptPayload = {
    gateVersion: "quick-sponsor-send-gate.v1",
    buyer: input.buyer,
    workflow: input.workflow,
    decision,
    score,
    readyCount,
    totalCount: checks.length,
    sourceReceiptId: input.conversionReceipt.receiptId,
    sourceChecksum,
    checks: checks.map((check) => ({
      id: check.id,
      label: check.label,
      status: check.status,
      owner: check.owner,
      evidence: check.evidence,
      action: check.action
    }))
  };
  const checksum = stablePacketHash(JSON.stringify(receiptPayload));
  const receipt = {
    receiptId: `quick-sponsor-gate-${decision}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum
  };

  return {
    status,
    decision,
    label,
    headline,
    summary,
    score,
    readyCount,
    totalCount: checks.length,
    nextOwner,
    nextAction,
    sendRule,
    sourceReceiptId: input.conversionReceipt.receiptId,
    sourceChecksum,
    verifierHref: input.conversionReceipt.verifierHref,
    checks,
    receipt,
    receiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ ...receipt, payload: receiptPayload }, null, 2))}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

export function buildQuickBuyerRoomPreview(draft: WorkflowIntakeDraft, currentOpenCount = 0): QuickBuyerRoomPreview {
  const buyer = draft.workOrder.targetUser || "Target buyer";
  const workflow = draft.workOrder.request || "Workflow request missing";
  const evidenceUrl = draft.workOrder.evidenceUrl || draft.pilotRun.evidenceUrl || "";
  const proofRepairPlan = buildProofRepairPlan(draft);
  const publicSafeRedactionPacket = buildQuickPublicSafeRedactionPacket(draft);
  const proofRowStatus: QuickBuyerRoomPreviewStatus =
    proofRepairPlan.repairCount === 0 ? "ready" : proofRepairPlan.readyCount > 0 || proofRepairPlan.invalidCount > 0 || evidenceUrl ? "watch" : "blocked";
  const primaryProofUrl = proofRepairPlan.items.find((item) => item.status === "ready")?.value || evidenceUrl || "";
  const hasValueModel = Boolean(
    draft.buyerScenario.teamSize && draft.buyerScenario.cyclesPerMonth && draft.buyerScenario.manualHoursPerCycle && draft.buyerScenario.adoptionRatePercent
  );
  const hasMeasuredRun = Boolean(
    draft.pilotRun.observedManualMinutes &&
      draft.pilotRun.observedAssistedMinutes &&
      draft.pilotRun.acceptedTasks &&
      draft.pilotRun.totalTasks &&
      draft.pilotRun.participants
  );
  const rowSourceGrounding = {
    scope: sourceGroundingFor(draft, ["buyer", "workflow", "success"]),
    value: sourceGroundingFor(draft, ["value-model"]),
    pilot: sourceGroundingFor(draft, ["pilot-run"]),
    proof: sourceGroundingFor(draft, ["public-proof"]),
    a2a: sourceGroundingFor(draft, ["agent-trial"]),
    data: sourceGroundingFor(draft, ["data-boundary"])
  };
  const rows: QuickBuyerRoomPreviewRow[] = [
    rowWithSourceGrounding(
      {
        id: "scope",
        label: "Buyer workflow",
        status: statusFromParts([draft.workOrder.targetUser, draft.workOrder.request, draft.workOrder.successMetric], [draft.workOrder.currentBaseline]),
        value: buyer,
        proof: workflow
      },
      rowSourceGrounding.scope
    ),
    rowWithSourceGrounding(
      {
        id: "value",
        label: "Value model",
        status: hasValueModel ? "ready" : Object.keys(draft.buyerScenario).length > 0 ? "watch" : "blocked",
        value: draftValueLine(draft),
        proof: draft.workOrder.successMetric || "Success metric must be explicit before buyer review."
      },
      rowSourceGrounding.value
    ),
    rowWithSourceGrounding(
      {
        id: "pilot",
        label: "Measured pilot",
        status: hasMeasuredRun ? "ready" : draft.pilotRun.observedManualMinutes || draft.pilotRun.observedAssistedMinutes || draft.pilotRun.acceptedTasks ? "watch" : "blocked",
        value: draftPilotLine(draft),
        proof: draft.pilotRun.reviewerName ? `Reviewer: ${draft.pilotRun.reviewerName}` : "Reviewer must be named before buyer review."
      },
      rowSourceGrounding.pilot
    ),
    rowWithSourceGrounding(
      {
        id: "proof",
        label: "Public proof",
        status: proofRowStatus,
        value: proofReadinessLine(proofRepairPlan),
        proof: primaryProofUrl || "Attach launch, work-order, or pilot receipt URLs."
      },
      rowSourceGrounding.proof
    ),
    rowWithSourceGrounding(
      {
        id: "a2a",
        label: "A2A trial",
        status: draft.agentTrialEvidence ? (draft.agentTrialEvidence.score >= 80 ? "ready" : "watch") : "blocked",
        value: draftAgentTrialLine(draft),
        proof: draft.agentTrialEvidence?.artifactUrl || "Attach an accepted A2A trial receipt."
      },
      rowSourceGrounding.a2a
    ),
    rowWithSourceGrounding(
      {
        id: "data",
        label: "Data boundary",
        status: mergedPreviewStatus(
          draft.workOrder.dataSensitivity === "public" ? "ready" : draft.workOrder.dataSensitivity === "internal" ? "watch" : "blocked",
          publicSafeRedactionPacket.status
        ),
        value: `${draft.workOrder.dataSensitivity || "internal"} data`,
        proof:
          publicSafeRedactionPacket.status === "ready"
            ? "Public-safe redaction packet has no sensitive markers."
            : `${publicSafeRedactionPacket.headline}: ${publicSafeRedactionPacket.findings[0]?.action ?? "Review the redaction packet before sharing."}`
      },
      rowSourceGrounding.data
    )
  ];
  const blockers = rows.filter((row) => row.status === "blocked");
  const warnings = rows.filter((row) => row.status === "watch");
  const averageScore = Math.round(rows.reduce((sum, row) => sum + rowStatusScore(row.status), 0) / rows.length);
  const status: QuickBuyerRoomPreviewStatus = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "watch" : "ready";
  const evidenceCompletionPacket = buildQuickEvidenceCompletionPacket({
    draft,
    buyer,
    workflow,
    rows,
    proofRepairPlan,
    publicSafeRedactionPacket
  });
  const headline =
    status === "ready"
      ? `Buyer room preview is ready for ${buyer}`
      : status === "watch"
        ? `Buyer room preview needs ${warnings.length} owner review${warnings.length === 1 ? "" : "s"}`
        : `Buyer room preview has ${blockers.length} blocker${blockers.length === 1 ? "" : "s"}`;
  const primaryAsk =
    status === "ready"
      ? "Apply this draft, verify live links, then open the launch room."
      : `Close ${blockers.length || warnings.length} preview gap${blockers.length + warnings.length === 1 ? "" : "s"} before external buyer sharing.`;
  const closeRule =
    status === "ready"
      ? "Do not send until live verification still passes after publishing."
      : `Do not send externally while ${blockers[0]?.label || warnings[0]?.label || "buyer proof"} is unresolved.`;
  const pilotWeekPlan = buildPilotWeekPlan({ draft, rows, previewStatus: status, buyer });
  const closeRuleWithContext = `${closeRule} Current workspace has ${currentOpenCount} open repair item${currentOpenCount === 1 ? "" : "s"} before this draft is applied. Preview score: ${averageScore}/100.`;
  const handoffBrief = buildQuickBuyerHandoffBrief({
    draft,
    buyer,
    workflow,
    status,
    blockers,
    warnings,
    proofCount: proofRepairPlan.readyCount,
    primaryAsk,
    proofRepairPlan
  });
  const objectionBrief = buildQuickBuyerObjectionBrief({
    draft,
    buyer,
    workflow,
    status,
    rows,
    primaryAsk,
    handoffBrief,
    proofRepairPlan
  });
  const decisionCase = buildQuickBuyerDecisionCase({
    buyer,
    workflow,
    status,
    rows,
    primaryAsk,
    closeRule: closeRuleWithContext,
    handoffBrief,
    proofRepairPlan,
    objectionBrief
  });
  const valueMap = buildQuickBuyerValueMap({
    draft,
    buyer,
    workflow,
    status,
    rows,
    handoffBrief,
    decisionCase,
    proofRepairPlan
  });
  const sendMemo = buildQuickBuyerSendMemo({
    buyer,
    workflow,
    status,
    rows,
    primaryAsk,
    closeRule: closeRuleWithContext,
    handoffBrief,
    decisionCase,
    proofRepairPlan
  });
  const economicsStressTest = buildQuickPilotEconomicsStressTest(draft);
  const approvalRoute = buildQuickStakeholderApprovalRoute({
    draft,
    buyer,
    workflow,
    status,
    rows,
    handoffBrief,
    decisionCase,
    economicsStressTest,
    proofRepairPlan,
    objectionBrief
  });
  const pilotContractTerms = buildQuickPilotContractTerms({
    draft,
    buyer,
    workflow,
    rows,
    closeRule: closeRuleWithContext,
    decisionCase,
    economicsStressTest,
    approvalRoute,
    proofRepairPlan,
    objectionBrief
  });
  const procurementMatrix = buildQuickProcurementAlternativeMatrix({
    buyer,
    workflow,
    status,
    decisionCase,
    economicsStressTest,
    approvalRoute,
    pilotContractTerms,
    proofRepairPlan
  });
  const claimProofLedger = buildQuickClaimProofLedger({
    draft,
    buyer,
    workflow,
    rows,
    decisionCase,
    economicsStressTest,
    approvalRoute,
    pilotContractTerms,
    procurementMatrix,
    proofRepairPlan
  });
  const buyerPromiseGate = buildQuickBuyerPromiseGate({
    buyer,
    workflow,
    handoffBrief,
    economicsStressTest,
    claimProofLedger,
    proofRepairPlan,
    pilotContractTerms,
    procurementMatrix
  });
  const approvalEmailPack = buildQuickStakeholderApprovalEmailPack({
    buyer,
    workflow,
    decisionCase,
    approvalRoute,
    pilotContractTerms,
    procurementMatrix
  });
  const adoptionSuccessPlan = buildQuickAdoptionSuccessPlan({
    draft,
    buyer,
    workflow,
    rows,
    economicsStressTest,
    approvalRoute,
    procurementMatrix,
    proofRepairPlan
  });
  const pilotProofContract = buildQuickPilotProofContract({
    buyer,
    workflow,
    decisionCase,
    handoffBrief,
    economicsStressTest,
    proofRepairPlan,
    pilotContractTerms,
    procurementMatrix,
    adoptionSuccessPlan
  });
  const validationScript = buildQuickBuyerValidationScript({
    buyer,
    workflow,
    status,
    rows,
    handoffBrief,
    decisionCase,
    valueMap,
    proofRepairPlan,
    pilotProofContract
  });
  const validationRubric = buildQuickBuyerValidationRubric({
    buyer,
    status,
    handoffBrief,
    decisionCase,
    validationScript
  });
  const validationAnswerSheet = buildQuickBuyerValidationAnswerSheet({
    buyer,
    workflow,
    validationScript,
    validationRubric,
    handoffBrief
  });
  const impactSnapshot = buildQuickBuyerImpactSnapshot({
    buyer,
    workflow,
    valueMap,
    handoffBrief,
    decisionCase,
    validationRubric,
    proofRepairPlan
  });
  const rolloutCommandBoard = buildQuickRolloutCommandBoard({
    draft,
    buyer,
    workflow,
    pilotWeekPlan,
    proofRepairPlan,
    approvalRoute,
    adoptionSuccessPlan,
    procurementMatrix
  });
  const decisionClosePack = buildQuickDecisionClosePack({
    buyer,
    workflow,
    status,
    closeRule: closeRuleWithContext,
    rows,
    handoffBrief,
    decisionCase,
    economicsStressTest,
    claimProofLedger,
    approvalRoute,
    approvalEmailPack,
    pilotContractTerms,
    procurementMatrix,
    proofRepairPlan
  });
  const pilotWeekTaskPacket = buildPilotWeekTaskPacket({
    buyer,
    status,
    primaryAsk,
    closeRule: closeRuleWithContext,
    pilotWeekPlan,
    decisionCaseText: decisionCase.caseText,
    handoffText: handoffBrief.handoffText,
    claimProofLedgerText: claimProofLedger.exportMarkdown,
    approvalRouteText: approvalRoute.routeText,
    approvalEmailPackText: approvalEmailPack.exportMarkdown,
    contractTermsText: pilotContractTerms.contractText,
    procurementMatrixText: procurementMatrix.exportMarkdown,
    adoptionSuccessText: adoptionSuccessPlan.exportMarkdown,
    rolloutCommandBoardText: rolloutCommandBoard.exportMarkdown,
    decisionClosePackText: decisionClosePack.followUpLedger.exportMarkdown,
    proofRepairText: proofRepairPlan.repairText,
    objectionText: objectionBrief.defenseText
  });
  const conversionReceipt = buildQuickWorkflowConversionReceipt({
    buyer,
    workflow,
    status,
    rows,
    proofRepairPlan,
    decisionCase,
    pilotWeekTaskPacket
  });
  const sponsorSendGate = buildQuickSponsorSendGate({
    buyer,
    workflow,
    status,
    closeRule: closeRuleWithContext,
    handoffBrief,
    objectionBrief,
    buyerPromiseGate,
    economicsStressTest,
    conversionReceipt
  });
  const evidencePack = buildQuickBuyerEvidencePack({
    buyer,
    workflow,
    previewStatus: status,
    decisionCase,
    sendMemo,
    claimProofLedger,
    proofRepairPlan,
    publicSafeRedactionPacket,
    evidenceCompletionPacket,
    pilotWeekTaskPacket,
    decisionClosePack,
    conversionReceipt
  });
  const partial = {
    status,
    headline,
    summary: `${buyer} gets a bounded pilot room for: ${workflow}`,
    primaryAsk,
    closeRule: closeRuleWithContext,
    buyer,
    sourceTrace: draft.sourceTrace,
    rows,
    pilotWeekPlan,
    pilotWeekTaskPacket,
    handoffBrief,
    decisionCase,
    valueMap,
    impactSnapshot,
    validationScript,
    validationRubric,
    validationAnswerSheet,
    sendMemo,
    economicsStressTest,
    claimProofLedger,
    publicSafeRedactionPacket,
    evidenceCompletionPacket,
    approvalRoute,
    approvalEmailPack,
    pilotContractTerms,
    procurementMatrix,
    adoptionSuccessPlan,
    rolloutCommandBoard,
    decisionClosePack,
    pilotProofContract,
    conversionReceipt,
    evidencePack,
    sponsorSendGate,
    buyerPromiseGate,
    proofRepairPlan,
    objectionBrief
  };

  return {
    ...partial,
    exportMarkdown: buildQuickBuyerRoomMarkdown(partial)
  };
}

function decisionOnePagerLabel(status: QuickBuyerRoomPreviewStatus) {
  if (status === "ready") return "Buyer-sendable one-pager";
  if (status === "watch") return "Owner review one-pager";
  return "Internal repair one-pager";
}

function decisionOnePagerSummary(preview: QuickBuyerRoomPreview) {
  if (preview.status === "ready") return "Send this after live proof verification so the buyer sees decision, value, proof, trust boundary, and next step in one pass.";
  if (preview.status === "watch") return "Use this for sponsor review, then close the remaining owner question before external sharing.";
  return "Use this as the repair brief before sending anything to the buyer.";
}

function decisionOnePagerSourceTraceLine(sourceTrace: WorkflowIntakeDraft["sourceTrace"]) {
  if (sourceTrace.length === 0) return "0/0 source facts traced. Regenerate from a pasted workflow note.";
  const tracedCount = sourceTrace.filter((item) => item.status === "traced").length;
  const inferredCount = sourceTrace.filter((item) => item.status === "inferred").length;
  const missingCount = sourceTrace.filter((item) => item.status === "missing").length;
  const openParts = [
    inferredCount ? `${inferredCount} inferred` : "",
    missingCount ? `${missingCount} missing` : ""
  ].filter(Boolean);
  return `${tracedCount}/${sourceTrace.length} source facts traced to the pasted workflow note${openParts.length ? ` / ${openParts.join(", ")}` : ""}`;
}

function decisionOnePagerSourceTraceAction(sourceTrace: WorkflowIntakeDraft["sourceTrace"]) {
  const openItem = sourceTrace.find((item) => item.status === "missing") ?? sourceTrace.find((item) => item.status === "inferred");
  if (openItem) return openItem.action;
  return "Keep the source trace attached when forwarding the one-pager.";
}

function compactSendPreview(bodyText: string) {
  return bodyText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join("\n");
}

function buildQuickBuyerDecisionOnePagerMarkdown(
  snapshot: Omit<QuickBuyerDecisionOnePager, "exportMarkdown" | "exportHref" | "receipt" | "receiptHref">,
  receipt?: QuickBuyerDecisionOnePager["receipt"]
) {
  const lines = [
    `# ${snapshot.headline}`,
    "",
    `Status: ${snapshot.label}`,
    `Buyer: ${snapshot.buyer}`,
    `Decision: ${snapshot.decision}`,
    `Summary: ${snapshot.summary}`,
    "",
    "## Source trace",
    snapshot.sourceTraceLine,
    `Next: ${snapshot.sourceTraceAction}`,
    ...snapshot.sourceTrace.map((item) =>
      `- [${item.status}] ${item.label}: ${item.extracted}. Source: ${item.sourceLineNumber ? `L${item.sourceLineNumber} ${item.sourceLine}` : "missing"}. Next: ${item.action}`
    ),
    "",
    "## Buyer value",
    snapshot.valueLine,
    "",
    "## Public proof",
    snapshot.proofLine,
    "",
    "## Trust boundary",
    snapshot.trustLine,
    "",
    "## Next action",
    `Owner: ${snapshot.nextOwner}`,
    `Action: ${snapshot.nextAction}`,
    "",
    "## Decision rows",
    ...snapshot.items.map((item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.detail}`),
    "",
    "## Send memo",
    `Subject: ${snapshot.sendSubject}`,
    "",
    snapshot.sendPreview
  ];

  if (receipt) {
    lines.push(
      "",
      "## Integrity receipt",
      `Receipt: ${receipt.receiptId}`,
      `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
      `Generated from: ${receipt.generatedFrom.join(", ")}`,
      "",
      "## Receipt verification",
      `Result: ${receipt.verification.label}`,
      `Payload checksum: ${receipt.checksumAlgorithm}:${receipt.verification.payloadChecksum}`,
      `Receipt checksum: ${receipt.checksumAlgorithm}:${receipt.verification.receiptChecksum}`,
      `Detail: ${receipt.verification.detail}`
    );
  }

  return lines.join("\n");
}

export function buildQuickBuyerDecisionOnePager(preview: QuickBuyerRoomPreview): QuickBuyerDecisionOnePager {
  const proofAction = preview.proofRepairPlan.items.find((item) => item.status !== "ready")?.action ?? preview.decisionCase.nextAction;
  const status = preview.proofRepairPlan.repairCount > 0 ? "blocked" : preview.status;
  const items: QuickBuyerDecisionOnePagerItem[] = [
    {
      id: "decision",
      label: "Decision",
      status: preview.decisionCase.status,
      value: preview.decisionCase.decisionLabel,
      detail: preview.decisionCase.answer,
      href: preview.decisionCase.caseHref
    },
    {
      id: "value",
      label: "Buyer value",
      status: preview.impactSnapshot.status,
      value: preview.decisionCase.valueEvidence,
      detail: preview.impactSnapshot.summary,
      href: preview.impactSnapshot.exportHref
    },
    {
      id: "proof",
      label: "Public proof",
      status: preview.proofRepairPlan.repairCount === 0 ? "ready" : "blocked",
      value: proofReadinessLine(preview.proofRepairPlan),
      detail: preview.decisionCase.proofEvidence,
      href: `#${QUICK_PROOF_REPAIR_PLAN_ID}`
    },
    {
      id: "contract",
      label: "Pilot contract",
      status: preview.pilotProofContract.status,
      value: preview.pilotProofContract.valueFloor,
      detail: `${preview.pilotProofContract.nextOwner}: ${preview.pilotProofContract.nextAction}`,
      href: preview.pilotProofContract.exportHref
    }
  ];
  const partial: Omit<QuickBuyerDecisionOnePager, "exportMarkdown" | "exportHref" | "receipt" | "receiptHref"> = {
    status,
    label: decisionOnePagerLabel(status),
    headline: `${preview.buyer}: ${preview.decisionCase.decisionLabel}`,
    summary: decisionOnePagerSummary({ ...preview, status }),
    buyer: preview.buyer,
    decision: preview.decisionCase.decisionLabel,
    nextOwner: preview.decisionCase.owner,
    nextAction: proofAction,
    valueLine: preview.decisionCase.valueEvidence,
    proofLine: proofReadinessLine(preview.proofRepairPlan),
    trustLine: preview.decisionCase.trustEvidence,
    sourceTraceLine: decisionOnePagerSourceTraceLine(preview.sourceTrace),
    sourceTraceAction: decisionOnePagerSourceTraceAction(preview.sourceTrace),
    sourceTrace: preview.sourceTrace,
    sendSubject: preview.sendMemo.subject,
    sendPreview: compactSendPreview(preview.sendMemo.bodyText),
    mailtoHref: preview.sendMemo.mailtoHref,
    items
  };
  const payloadMarkdown = buildQuickBuyerDecisionOnePagerMarkdown(partial);
  const checksum = stablePacketHash(payloadMarkdown);
  const baseReceipt = {
    receiptId: `quick-buyer-one-pager-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    generatedFrom: [
      "buyer-decision-case",
      "buyer-impact-snapshot",
      "proof-repair-plan",
      "pilot-proof-contract",
      "buyer-send-memo",
      "workflow-source-trace"
    ]
  };
  const receipt: QuickBuyerDecisionOnePagerReceipt = {
    ...baseReceipt,
    verification: verifyQuickBuyerDecisionOnePagerReceipt(payloadMarkdown, baseReceipt)
  };
  const receiptJson = JSON.stringify(receipt, null, 2);
  const exportMarkdown = buildQuickBuyerDecisionOnePagerMarkdown(partial, receipt);

  return {
    ...partial,
    receipt,
    receiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(receiptJson)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function decisionReplyDeckLabel(status: QuickBuyerRoomPreviewStatus) {
  if (status === "ready") return "Buyer reply path ready";
  if (status === "watch") return "Owner reply path";
  return "Internal reply path";
}

function decisionReplyDeckSummary(status: QuickBuyerRoomPreviewStatus, proofLine: string) {
  if (status === "ready") return "Send the one-pager with a clear continue, revise, or stop reply so the buyer decision can be recorded without another meeting.";
  if (status === "watch") return `Ask for revise until the owner review closes: ${proofLine}.`;
  return `Keep the reply path internal until proof repair closes: ${proofLine}.`;
}

function decisionReplyText(input: {
  buyer: string;
  option: string;
  buyerSays: string;
  nextOwner: string;
  nextAction: string;
  proof: string;
  receiptId: string;
}) {
  return [
    `Buyer: ${input.buyer}`,
    `Decision reply: ${input.option}`,
    input.buyerSays,
    `Next owner: ${input.nextOwner}`,
    `Next action: ${input.nextAction}`,
    `Proof: ${input.proof}`,
    `One-pager receipt: ${input.receiptId}`
  ].join("\n");
}

export function buildQuickBuyerDecisionReplyDeck(
  preview: QuickBuyerRoomPreview,
  onePager = buildQuickBuyerDecisionOnePager(preview)
): QuickBuyerDecisionReplyDeck {
  const status = onePager.status;
  const recommendedOptionId: QuickBuyerDecisionReplyOptionId = status === "ready" ? "continue" : "revise";
  const proofAction = preview.proofRepairPlan.items.find((item) => item.status !== "ready")?.action ?? preview.decisionCase.nextAction;
  const continueStatus: QuickBuyerRoomPreviewStatus = status === "ready" ? "ready" : "blocked";
  const reviseStatus: QuickBuyerRoomPreviewStatus = status === "ready" ? "watch" : "ready";
  const stopStatus: QuickBuyerRoomPreviewStatus = "watch";
  const optionInputs = [
    {
      id: "continue" as const,
      label: "Continue",
      status: continueStatus,
      headline: status === "ready" ? "Approve bounded pilot" : "Locked until proof passes",
      buyerSays:
        status === "ready"
          ? `Continue with ${preview.primaryAsk}`
          : "Do not ask the buyer to continue until public proof repair is closed.",
      nextOwner: status === "ready" ? preview.buyer : "Proof owner",
      nextAction: status === "ready" ? "Open the verified launch room and record continue with the receipt attached." : proofAction,
      proof: status === "ready" ? `${onePager.valueLine} / ${onePager.trustLine}` : onePager.proofLine
    },
    {
      id: "revise" as const,
      label: "Revise",
      status: reviseStatus,
      headline: status === "ready" ? "Ask for one bounded change" : "Request proof repair",
      buyerSays:
        status === "ready"
          ? "Revise the scope, value floor, or stop rule before approval."
          : `Revise after this proof gap is closed: ${onePager.proofLine}`,
      nextOwner: status === "ready" ? preview.decisionCase.owner : "Proof owner",
      nextAction: proofAction,
      proof: onePager.proofLine
    },
    {
      id: "stop" as const,
      label: "Stop",
      status: stopStatus,
      headline: "Decline this pilot",
      buyerSays: `Stop if ${preview.buyer} cannot validate the value case, trust boundary, or stop rule.`,
      nextOwner: preview.decisionCase.owner,
      nextAction: "Record the missing condition and keep the proof packet as the audit trail.",
      proof: preview.closeRule
    }
  ];
  const options: QuickBuyerDecisionReplyOption[] = optionInputs.map((option) => {
    const replyText = decisionReplyText({
      buyer: preview.buyer,
      option: option.label,
      buyerSays: option.buyerSays,
      nextOwner: option.nextOwner,
      nextAction: option.nextAction,
      proof: option.proof,
      receiptId: onePager.receipt.receiptId
    });
    return {
      ...option,
      recommended: option.id === recommendedOptionId,
      replyText,
      mailtoHref: mailtoHref(`Decision reply: ${option.label} for ${preview.buyer}`, replyText)
    };
  });
  const recommended = options.find((option) => option.id === recommendedOptionId) ?? options[0];
  const exportMarkdown = [
    "# Buyer decision reply path",
    "",
    `Status: ${decisionReplyDeckLabel(status)}`,
    `Buyer: ${preview.buyer}`,
    `Recommended reply: ${recommended.label}`,
    `One-pager receipt: ${onePager.receipt.receiptId}`,
    `One-pager checksum: ${onePager.receipt.checksumAlgorithm}:${onePager.receipt.checksum}`,
    "",
    "## Summary",
    decisionReplyDeckSummary(status, onePager.proofLine),
    "",
    "## Reply options",
    ...options.flatMap((option) => [
      `- [${option.status}] ${option.label}: ${option.headline}${option.recommended ? " (recommended)" : ""}`,
      `  Buyer says: ${option.buyerSays}`,
      `  Next owner: ${option.nextOwner}`,
      `  Next action: ${option.nextAction}`,
      `  Proof: ${option.proof}`
    ]),
    "",
    "## Recommended reply",
    recommended.replyText
  ].join("\n");

  return {
    status,
    label: decisionReplyDeckLabel(status),
    headline: status === "ready" ? "Buyer can answer continue, revise, or stop" : "Reply path is held until proof is repaired",
    summary: decisionReplyDeckSummary(status, onePager.proofLine),
    recommendedOptionId,
    onePagerReceiptId: onePager.receipt.receiptId,
    onePagerChecksum: `${onePager.receipt.checksumAlgorithm}:${onePager.receipt.checksum}`,
    options,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function replyRecordLabel(decision: QuickBuyerDecisionReplyOptionId) {
  if (decision === "continue") return "Continue recorded";
  if (decision === "revise") return "Revision recorded";
  return "Stop recorded";
}

function replyRecordHeadline(decision: QuickBuyerDecisionReplyOptionId, buyer: string) {
  if (decision === "continue") return `${buyer} reply starts the pilot work order`;
  if (decision === "revise") return `${buyer} reply becomes a revision work order`;
  return `${buyer} reply closes the pilot ask`;
}

function replyRecordSummary(decision: QuickBuyerDecisionReplyOptionId, activation: QuickBuyerDecisionActivationBrief) {
  if (decision === "continue") return `${activation.items.length} owner task${activation.items.length === 1 ? "" : "s"} are ready for rollout from the recorded buyer reply.`;
  if (decision === "revise") return `${activation.items.length} revision task${activation.items.length === 1 ? "" : "s"} must close before the buyer ask is sent again.`;
  return "The stop decision is preserved with the one-pager receipt and closeout action.";
}

function replySignalMatches(text: string, patterns: RegExp[]) {
  return patterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source.replace(/\\b/g, "").replace(/[()?:|\\]/g, " ").replace(/\s+/g, " ").trim());
}

function detectBuyerReplyDecision(replyText: string, fallback: QuickBuyerDecisionReplyOptionId) {
  const text = replyText.toLowerCase();
  const reviseSignals = replySignalMatches(text, [
    /\brevise\b/i,
    /\bchange\b/i,
    /\badjust\b/i,
    /\bupdate\b/i,
    /\bfix\b/i,
    /\bmissing\b/i,
    /\bneed\b/i,
    /\bbefore\b/i,
    /\buntil\b/i,
    /\bproof gap\b/i,
    /\bmissing proof\b/i,
    /\brepair proof\b/i,
    /\bscope\b/i,
    /\bstop rule\b/i,
    /修正|変更|直し|不足|必要|条件/i
  ]);
  const stopSignals = replySignalMatches(text, [
    /\bstop\b/i,
    /\bdecline\b/i,
    /\breject\b/i,
    /\bcancel\b/i,
    /\bnot approve\b/i,
    /\bno go\b/i,
    /停止|中止|却下|見送り/i
  ]);
  const continueSignals = replySignalMatches(text, [
    /\bcontinue\b/i,
    /\bapprove\b/i,
    /\bapproved\b/i,
    /\bgo ahead\b/i,
    /\bproceed\b/i,
    /\bstart\b/i,
    /\bpilot\b/i,
    /承認|進め|継続|開始/i
  ]);
  const decision: QuickBuyerDecisionReplyOptionId = reviseSignals.length
    ? "revise"
    : stopSignals.length
      ? "stop"
      : continueSignals.length
        ? "continue"
        : fallback;
  const matchedSignals = decision === "revise" ? reviseSignals : decision === "stop" ? stopSignals : continueSignals;
  const confidence = matchedSignals.length >= 2 ? 92 : matchedSignals.length === 1 ? 78 : 56;

  return {
    decision,
    matchedSignals: matchedSignals.length ? matchedSignals : [`defaulted to ${fallback}`],
    confidence
  };
}

function withSelectedDecisionReply(replyDeck: QuickBuyerDecisionReplyDeck, selectedId: QuickBuyerDecisionReplyOptionId): QuickBuyerDecisionReplyDeck {
  return {
    ...replyDeck,
    recommendedOptionId: selectedId,
    options: replyDeck.options.map((option) => ({
      ...option,
      recommended: option.id === selectedId
    }))
  };
}

function receiptVerifierPrefillHref(verificationRequestJson: string) {
  const params = new URLSearchParams({
    request: verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

function externalReviewPacketShareHref(verificationRequestJson: string) {
  return quickExternalReviewPacketShareHref(verificationRequestJson);
}

export type QuickExternalReviewResponseFollowUpLedger = QuickExternalReviewOwnerPacketFollowUpLedger & {
  csvHref: string;
  calendarHref: string;
  exportHref: string;
};

function storeReceiptVerifierRequest(requestKey: string, verificationRequestJson: string) {
  if (typeof window === "undefined") return;
  const storageKey = `receipt-verifier-request:${requestKey}`;
  try {
    window.localStorage.setItem(storageKey, verificationRequestJson);
  } catch {
    // Session storage gives the same-tab verifier a fallback when persistent storage is unavailable.
  }
  try {
    window.sessionStorage.setItem(storageKey, verificationRequestJson);
  } catch {
    // The verifier page will fall back to its sample request if storage is unavailable.
  }
}

export type QuickExternalReviewResponseActionPlan = {
  state: "empty" | "invalid" | "mismatch" | "wrong-packet" | "closed" | "verified";
  status: QuickBuyerRoomPreviewStatus;
  label: string;
  headline: string;
  summary: string;
  reviewerLine: string;
  receiptLine: string;
  nextOwner: string;
  nextAction: string;
  verificationRequestJson: string;
  verifierHref: string;
  packetVerifierHref: string;
  reviewDeskHref: string;
  acceptanceCriteria: string[];
  runbook: QuickExternalReviewOwnerPacketRunbookItem[];
  followUpLedger: QuickExternalReviewResponseFollowUpLedger;
  regenerationNote: string;
  regenerationHref: string;
  ownerPacketMarkdown: string;
  ownerPacketHref: string;
  ownerPacketReceiptJson: string;
  ownerPacketReceiptHref: string;
  ownerPacketVerifierStorageKey: string;
  ownerPacketVerifierHref: string;
  exportMarkdown: string;
  exportHref: string;
};

type QuickExternalReviewResponseActionPlanBase = Omit<
  QuickExternalReviewResponseActionPlan,
  | "exportMarkdown"
  | "exportHref"
  | "regenerationHref"
  | "ownerPacketMarkdown"
  | "ownerPacketHref"
  | "ownerPacketReceiptJson"
  | "ownerPacketReceiptHref"
  | "ownerPacketVerifierStorageKey"
  | "ownerPacketVerifierHref"
  | "followUpLedger"
>;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function quickExternalReviewStatusFromUnknown(value: unknown): QuickBuyerRoomPreviewStatus {
  return value === "ready" || value === "watch" || value === "blocked" ? value : "blocked";
}

function quickExternalReviewClearanceFromUnknown(value: unknown): QuickGlobalPublishabilityCertificate["clearance"] {
  return value === "external-review" ? "external-review" : "internal-only";
}

function quickExternalReviewPacketItemIdFromUnknown(value: unknown): QuickGlobalPublishabilityReviewPacketItem["id"] | null {
  if (
    value === "launch-certificate" ||
    value === "reviewer-brief" ||
    value === "claim-audit" ||
    value === "value-route" ||
    value === "objection-answers" ||
    value === "proof-freshness"
  ) {
    return value;
  }
  return null;
}

function stringsFromUnknown(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function externalReviewPacketArtifactsFromUnknown(value: unknown): QuickGlobalPublishabilityReviewPacketManifest["artifacts"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate, index) => {
    if (!isPlainRecord(candidate)) return [];
    const id = quickExternalReviewPacketItemIdFromUnknown(candidate.id);
    if (!id) return [];
    const label = typeof candidate.label === "string" && candidate.label.trim() ? candidate.label.trim() : id;
    const role = typeof candidate.role === "string" && candidate.role.trim() ? candidate.role.trim() : "Review evidence";
    const evidence = typeof candidate.evidence === "string" && candidate.evidence.trim() ? candidate.evidence.trim() : "Imported from review packet manifest.";
    const href = typeof candidate.href === "string" && candidate.href.trim() ? candidate.href.trim() : "#quick-workflow-intake";
    const contentChecksum =
      typeof candidate.contentChecksum === "string" && /^[a-f0-9]{8}$/i.test(candidate.contentChecksum) ? candidate.contentChecksum.toLowerCase() : "00000000";
    const contentLength = typeof candidate.contentLength === "number" && Number.isFinite(candidate.contentLength) ? Math.max(0, Math.round(candidate.contentLength)) : 0;
    const requiredOrder = typeof candidate.requiredOrder === "number" && Number.isFinite(candidate.requiredOrder) ? candidate.requiredOrder : index + 1;
    return [
      {
        id,
        label,
        status: quickExternalReviewStatusFromUnknown(candidate.status),
        role,
        evidence,
        href,
        contentKind: "markdown" as const,
        contentChecksum,
        contentLength,
        requiredOrder
      }
    ];
  });
}

function externalReviewSourceReceiptsFromUnknown(value: unknown): QuickGlobalPublishabilityReviewPacketManifest["sourceReceipts"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (!isPlainRecord(candidate) || typeof candidate.label !== "string" || typeof candidate.value !== "string") return [];
    return [{ label: candidate.label, value: candidate.value }];
  });
}

export function importedQuickExternalReviewPacketFromRequestJson(rawRequestJson: string): QuickGlobalPublishabilityReviewPacket | null {
  const requestJson = rawRequestJson.trim();
  if (!requestJson) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(requestJson);
  } catch {
    return null;
  }
  if (!isPlainRecord(parsed) || !isPlainRecord(parsed.manifest)) return null;
  const source = parsed.manifest;
  if (source.receiptVersion !== "quick-external-review-packet.v1") return null;
  if (
    typeof source.receiptId !== "string" ||
    !source.receiptId.trim() ||
    source.checksumAlgorithm !== "fnv1a32" ||
    typeof source.checksum !== "string" ||
    !/^[a-f0-9]{8}$/i.test(source.checksum)
  ) {
    return null;
  }

  const artifacts = externalReviewPacketArtifactsFromUnknown(source.artifacts);
  const status = quickExternalReviewStatusFromUnknown(source.status);
  const clearance = quickExternalReviewClearanceFromUnknown(source.clearance);
  const checksum = source.checksum.toLowerCase();
  const readyCount = typeof source.readyCount === "number" && Number.isFinite(source.readyCount) ? source.readyCount : artifacts.filter((item) => item.status === "ready").length;
  const totalCount = typeof source.totalCount === "number" && Number.isFinite(source.totalCount) ? source.totalCount : artifacts.length;
  const score = typeof source.score === "number" && Number.isFinite(source.score) ? source.score : 0;
  const sendRule = typeof source.sendRule === "string" && source.sendRule.trim() ? source.sendRule.trim() : "Use the imported packet manifest before external sharing.";
  const nextAction = typeof source.nextAction === "string" && source.nextAction.trim() ? source.nextAction.trim() : "Use the reviewer response attached to this imported packet.";
  const manifest: QuickGlobalPublishabilityReviewPacketManifest = {
    receiptVersion: "quick-external-review-packet.v1",
    receiptId: source.receiptId.trim(),
    checksumAlgorithm: "fnv1a32",
    checksum,
    payloadChecksum: typeof source.payloadChecksum === "string" && /^[a-f0-9]{8}$/i.test(source.payloadChecksum) ? source.payloadChecksum.toLowerCase() : checksum,
    status,
    clearance,
    buyer: typeof source.buyer === "string" && source.buyer.trim() ? source.buyer.trim() : "Imported buyer",
    score,
    readyCount,
    totalCount,
    sendRule,
    nextAction,
    generatedFrom: stringsFromUnknown(source.generatedFrom),
    artifacts,
    sourceReceipts: externalReviewSourceReceiptsFromUnknown(source.sourceReceipts)
  };
  const items = artifacts.map((artifact) => ({
    id: artifact.id,
    label: artifact.label,
    status: artifact.status,
    role: artifact.role,
    evidence: artifact.evidence,
    href: artifact.href
  }));
  const manifestJson = JSON.stringify(manifest, null, 2);
  const manifestVerificationRequestJson = JSON.stringify({ manifest }, null, 2);
  const manifestVerifierHref = receiptVerifierPrefillHref(manifestVerificationRequestJson);
  const reviewDeskHref = externalReviewPacketShareHref(manifestVerificationRequestJson);
  const label = status === "ready" ? "Imported external review packet" : "Imported packet hold";
  const headline = status === "ready" ? "Reviewer response is matched to its original packet" : "Imported packet remains restricted";
  const summary =
    status === "ready"
      ? `${manifest.buyer}'s response is validated against the packet manifest returned from the public review desk.`
      : `${manifest.buyer}'s response is preserved with the packet manifest that produced it.`;
  const exportMarkdown = [
    "# Imported external review packet",
    "",
    `Buyer: ${manifest.buyer}`,
    `Status: ${manifest.status}`,
    `Clearance: ${manifest.clearance}`,
    `Manifest: ${manifest.receiptId} / fnv1a32:${manifest.checksum}`,
    `Send rule: ${manifest.sendRule}`,
    `Next action: ${manifest.nextAction}`,
    "",
    "## Packet contents",
    ...artifacts.map((artifact) => `- [${artifact.status}] ${artifact.label} (${artifact.role}): ${artifact.evidence}`)
  ].join("\n");
  const artifactBundleJson = JSON.stringify(
    {
      receiptVersion: "quick-external-review-artifact-bundle.v1",
      manifestReceiptId: manifest.receiptId,
      manifestChecksum: `fnv1a32:${manifest.checksum}`,
      manifest,
      artifacts: []
    },
    null,
    2
  );

  return {
    status,
    clearance,
    label,
    headline,
    summary,
    sendRule,
    readyCount,
    totalCount,
    nextAction,
    items,
    manifest,
    manifestJson,
    manifestHref: `data:application/json;charset=utf-8,${encodeURIComponent(manifestJson)}`,
    manifestVerificationRequestJson,
    manifestVerificationStorageKey: manifest.receiptId,
    manifestVerifierHref,
    reviewDeskHref,
    artifactBundleJson,
    artifactBundleHref: `data:application/json;charset=utf-8,${encodeURIComponent(artifactBundleJson)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function extractExternalReviewResponseRequestJson(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed, "https://local.invalid");
    const buyerEvidenceResponse = decodeQuickBuyerEvidenceResponseShareParam(url.searchParams.get(QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PARAM));
    if (buyerEvidenceResponse) return buyerEvidenceResponse;
    const externalReviewResponse = decodeQuickExternalReviewResponseShareParam(url.searchParams.get(QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PARAM));
    if (externalReviewResponse) return externalReviewResponse;
    return url.searchParams.get("request")?.trim() || trimmed;
  } catch {
    return trimmed;
  }
}

function parseExternalReviewResponseRequest(raw: string) {
  const requestJson = extractExternalReviewResponseRequestJson(raw);
  if (!requestJson) return { request: null, error: "Paste a reviewer response receipt JSON or verifier URL." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(requestJson);
  } catch {
    return { request: null, error: "The response receipt could not be parsed as JSON." };
  }
  if (!isPlainRecord(parsed) || typeof parsed.checksum !== "string" || !isPlainRecord(parsed.payload)) {
    return { request: null, error: "The response receipt must include checksum and payload." };
  }
  const payload = parsed.payload;
  if (payload.receiptVersion !== QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION) {
    return { request: null, error: `Expected ${QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION}.` };
  }
  if (payload.decision !== "continue" && payload.decision !== "revise" && payload.decision !== "stop") {
    return { request: null, error: "The response receipt decision must be continue, revise, or stop." };
  }
  const requiredStrings = [
    "status",
    "label",
    "reviewerName",
    "reviewerNote",
    "buyer",
    "generatedAt",
    "manifestReceiptId",
    "manifestChecksum",
    "packetStatus",
    "packetClearance",
    "reviewOutcome",
    "nextAction",
    "proof"
  ];
  if (requiredStrings.some((key) => typeof payload[key] !== "string")) {
    return { request: null, error: "The response receipt payload is missing reviewer, manifest, or next-action fields." };
  }
  const requiredNumbers = ["testsReady", "testsTotal", "confidence"];
  if (requiredNumbers.some((key) => typeof payload[key] !== "number")) {
    return { request: null, error: "The response receipt payload is missing test or confidence numbers." };
  }
  return { request: parsed as QuickExternalReviewDecisionReceiptVerificationRequest, error: "" };
}

function normalizeExternalReviewChecksum(value: string) {
  return value.trim().toLowerCase().replace(/^fnv1a32:/, "");
}

function externalReviewResponseLabel(decision: QuickExternalReviewDecisionReceiptVerificationRequest["payload"]["decision"]) {
  if (decision === "continue") return "Continue accepted";
  if (decision === "revise") return "Revision required";
  return "Stop preserved";
}

function externalReviewResponseHeadline(
  decision: QuickExternalReviewDecisionReceiptVerificationRequest["payload"]["decision"],
  buyer: string
) {
  if (decision === "continue") return `${buyer} can move from review to sponsor send`;
  if (decision === "revise") return `${buyer} review becomes a repair work order`;
  return `${buyer} packet is stopped before public sharing`;
}

function externalReviewResponseStatus(
  decision: QuickExternalReviewDecisionReceiptVerificationRequest["payload"]["decision"],
  receiptStatus: QuickExternalReviewDecisionReceiptVerificationRequest["payload"]["status"]
): QuickBuyerRoomPreviewStatus {
  if (receiptStatus === "ready" || receiptStatus === "watch" || receiptStatus === "blocked") return receiptStatus;
  if (decision === "continue") return "ready";
  if (decision === "revise") return "watch";
  return "blocked";
}

function buildExternalReviewResponseExport(plan: QuickExternalReviewResponseActionPlanBase & { followUpLedger: QuickExternalReviewResponseFollowUpLedger }) {
  return [
    "# External review response intake",
    "",
    `State: ${plan.state}`,
    `Label: ${plan.label}`,
    `Headline: ${plan.headline}`,
    `Reviewer: ${plan.reviewerLine}`,
    `Receipt: ${plan.receiptLine}`,
    "",
    "## Summary",
    plan.summary,
    "",
    "## Next action",
    `${plan.nextOwner}: ${plan.nextAction}`,
    "",
    "## Acceptance criteria",
    ...plan.acceptanceCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Runbook",
    ...plan.runbook.map((item) => `- [${item.status}] ${item.window} / ${item.owner} / ${item.label}: ${item.action} Evidence: ${item.evidence} Proof: ${item.proof}`),
    "",
    "## Follow-up ledger",
    plan.followUpLedger.summary,
    `First due: ${plan.followUpLedger.firstDueLabel}`,
    ...plan.followUpLedger.tasks.map((task) => `- [${task.status}] ${task.dueLabel} / ${task.owner} / ${task.label}: ${task.closeCondition}`),
    "",
    "## Regeneration note",
    plan.regenerationNote,
    "",
    "## Verifier",
    plan.verifierHref || "No verifier link available.",
    "",
    "## Current packet",
    `Packet verifier: ${plan.packetVerifierHref || "No packet verifier available."}`,
    `Review desk: ${plan.reviewDeskHref || "No review desk available."}`
  ].join("\n");
}

function externalReviewRepairTarget(reviewPacket: QuickGlobalPublishabilityReviewPacket) {
  const item = reviewPacket.items.find((candidate) => candidate.status === "blocked") ?? reviewPacket.items.find((candidate) => candidate.status === "watch");
  if (!item) return reviewPacket.nextAction;
  return `${item.label} (${item.role}): ${item.evidence}`;
}

function externalReviewResponseCriteria(input: {
  accepted: boolean;
  closed?: boolean;
  decision?: QuickExternalReviewDecisionReceiptVerificationRequest["payload"]["decision"];
  status: QuickBuyerRoomPreviewStatus;
  reviewPacket: QuickGlobalPublishabilityReviewPacket;
}) {
  const repairTarget = externalReviewRepairTarget(input.reviewPacket);
  if (input.closed) {
    return [
      "Keep the old reviewer stop or revision receipt attached as repair-closure evidence.",
      `Verify current packet manifest ${input.reviewPacket.manifest.receiptId} before sending it to a reviewer.`,
      "Request a fresh external reviewer response for the current manifest; do not reuse the old stop or revision receipt as approval."
    ];
  }
  if (!input.accepted) {
    return [
      "Do not change the launch packet from this response.",
      "Keep the current packet manifest attached while requesting a matching verified reviewer response.",
      "Accept the response only after the verifier link matches the current manifest receipt and checksum."
    ];
  }
  if (input.decision === "continue" && input.status === "ready") {
    return [
      "Attach the verified response receipt to the sponsor handoff.",
      "Send the launch certificate and reviewer brief before any additional artifact.",
      "Record the sponsor reply as continue, revise, or stop before expanding the pilot."
    ];
  }
  return [
    "Do not send this packet to another external reviewer until the repair is complete.",
    `Repair target: ${repairTarget}`,
    "Regenerate the external review packet and verify the new manifest before requesting another reviewer response."
  ];
}

function externalReviewResponseRunbook(input: {
  accepted: boolean;
  closed: boolean;
  state: QuickExternalReviewResponseActionPlan["state"];
  status: QuickBuyerRoomPreviewStatus;
  decision?: QuickExternalReviewDecisionReceiptVerificationRequest["payload"]["decision"];
  reviewPacket: QuickGlobalPublishabilityReviewPacket;
  nextOwner: string;
  nextAction: string;
  reviewerLine: string;
  receiptLine: string;
  verifierHref: string;
}): QuickExternalReviewOwnerPacketRunbookItem[] {
  const manifestLine = `${input.reviewPacket.manifest.receiptId} / fnv1a32:${input.reviewPacket.manifest.checksum}`;
  const responseLine = input.receiptLine.includes("fnv1a32:") ? input.receiptLine : "Response receipt pending";
  if (input.closed) {
    return [
      {
        id: "archive-prior-response",
        label: "Archive prior response",
        owner: "Review coordinator",
        window: "Now",
        action: "Keep the old stop or revision receipt as closure evidence, not as approval.",
        evidence: responseLine,
        proof: responseLine,
        status: "ready"
      },
      {
        id: "verify-current-manifest",
        label: "Verify repaired manifest",
        owner: "Review coordinator",
        window: "Before re-review",
        action: `Verify current packet manifest ${input.reviewPacket.manifest.receiptId}.`,
        evidence: manifestLine,
        proof: input.reviewPacket.manifestVerifierHref,
        status: input.reviewPacket.status
      },
      {
        id: "request-fresh-response",
        label: "Request fresh response",
        owner: input.nextOwner,
        window: "After verifier passes",
        action: input.nextAction,
        evidence: manifestLine,
        proof: input.reviewPacket.manifestVerifierHref,
        status: "watch"
      }
    ];
  }
  if (!input.accepted) {
    return [
      {
        id: "hold-response",
        label: "Hold response",
        owner: "Review coordinator",
        window: "Now",
        action: input.nextAction,
        evidence: responseLine,
        proof: responseLine,
        status: "blocked"
      },
      {
        id: "match-current-manifest",
        label: "Match packet manifest",
        owner: "Review coordinator",
        window: "Before assignment",
        action: `Use only a response for ${input.reviewPacket.manifest.receiptId}.`,
        evidence: manifestLine,
        proof: input.reviewPacket.manifestVerifierHref,
        status: input.reviewPacket.status
      },
      {
        id: "regenerate-response",
        label: "Regenerate response",
        owner: "External reviewer",
        window: "After matching packet opens",
        action: "Open the review desk and generate a matching continue, revise, or stop receipt.",
        evidence: manifestLine,
        proof: input.reviewPacket.manifestVerifierHref,
        status: "watch"
      }
    ];
  }
  if (input.decision === "continue" && input.status === "ready") {
    return [
      {
        id: "send-sponsor-handoff",
        label: "Send sponsor handoff",
        owner: input.nextOwner,
        window: "Now",
        action: input.nextAction,
        evidence: responseLine,
        proof: responseLine,
        status: "ready"
      },
      {
        id: "record-sponsor-reply",
        label: "Record sponsor reply",
        owner: "Review coordinator",
        window: "After sponsor reply",
        action: "Record the sponsor reply as continue, revise, or stop before expanding the pilot.",
        evidence: input.reviewPacket.manifest.receiptId,
        proof: "Sponsor reply receipt should point back to this review response.",
        status: "watch"
      },
      {
        id: "recheck-proof-window",
        label: "Recheck proof window",
        owner: "Proof owner",
        window: "Before public forwarding",
        action: input.reviewPacket.sendRule,
        evidence: manifestLine,
        proof: input.reviewPacket.manifestVerifierHref,
        status: input.reviewPacket.status
      }
    ];
  }
  return [
    {
      id: "freeze-external-send",
      label: "Freeze external send",
      owner: "Review coordinator",
      window: "Now",
      action: "Do not send this packet to another external reviewer until the repair is complete.",
      evidence: responseLine,
      proof: responseLine,
      status: "blocked"
    },
    {
      id: "repair-target",
      label: "Repair target",
      owner: input.nextOwner,
      window: "Before re-review",
      action: externalReviewRepairTarget(input.reviewPacket),
      evidence: input.reviewPacket.manifest.receiptId,
      proof: input.reviewPacket.manifestVerifierHref,
      status: input.status
    },
      {
        id: "regenerate-packet",
        label: "Regenerate packet",
        owner: "Review coordinator",
        window: "After repair",
        action: "Regenerate the external review packet and verify the new manifest before requesting another reviewer response.",
        evidence: manifestLine,
        proof: input.reviewPacket.manifestVerifierHref,
        status: "watch"
      }
  ];
}

function externalReviewFollowUpHref(item: QuickExternalReviewOwnerPacketRunbookItem, plan: QuickExternalReviewResponseActionPlanBase) {
  if (/^(https?:\/\/|\/|#)/i.test(item.proof)) return item.proof;
  if (/^(https?:\/\/|\/|#)/i.test(item.evidence)) return item.evidence;
  return plan.verifierHref || plan.packetVerifierHref || plan.reviewDeskHref || "#quick-workflow-intake";
}

function externalReviewFollowUpCloseCondition(item: QuickExternalReviewOwnerPacketRunbookItem, plan: QuickExternalReviewResponseActionPlanBase) {
  if (plan.state !== "verified" && plan.state !== "closed") {
    return `${item.owner} keeps the packet internal until the response receipt matches ${plan.receiptLine}.`;
  }
  if (item.id === "send-sponsor-handoff") {
    return `${item.owner} sends the certificate-first handoff and attaches ${plan.receiptLine}.`;
  }
  if (item.id === "record-sponsor-reply") {
    return "Review coordinator records the sponsor continue, revise, or stop reply before any expansion ask.";
  }
  if (item.id === "recheck-proof-window") {
    return "Proof owner reruns live proof verification and confirms the launch packet still matches the verifier.";
  }
  if (plan.state === "closed") {
    return `${item.owner} verifies the repaired manifest and requests a fresh reviewer response.`;
  }
  if (item.status === "ready") return `${item.owner} attaches proof and keeps the response verifier linked.`;
  if (item.status === "watch") return `${item.owner} records the next outcome and regenerates changed artifacts before sharing.`;
  return `${item.owner} clears the blocker before another reviewer receives the packet.`;
}

function externalReviewFollowUpHeadline(plan: QuickExternalReviewResponseActionPlanBase) {
  if (plan.state !== "verified" && plan.state !== "closed") return "Reviewer response is held until the receipt is trusted";
  if (plan.state === "closed") return "Repair closure has dated re-review work";
  if (plan.status === "ready") return "Reviewer continue becomes sponsor-send work";
  if (plan.status === "watch") return "Reviewer revision becomes dated repair work";
  return "Reviewer stop becomes a no-send ledger";
}

function externalReviewFollowUpCsv(tasks: QuickExternalReviewOwnerPacketFollowUpLedger["tasks"]) {
  return [
    ["taskId", "label", "status", "owner", "due", "action", "closeCondition", "evidence", "proof", "href"],
    ...tasks.map((task) => [task.id, task.label, task.status, task.owner, task.dueLabel, task.action, task.closeCondition, task.evidence, task.proof, task.href])
  ]
    .map((row) => row.map(quickBuyerEvidenceCsvEscape).join(","))
    .join("\n");
}

function externalReviewFollowUpCalendar(input: {
  plan: QuickExternalReviewResponseActionPlanBase;
  tasks: QuickExternalReviewOwnerPacketFollowUpLedger["tasks"];
  startDate: string;
}) {
  const start = parseIsoDateOnly(input.startDate);
  if (!start) return { calendarEndDate: "", calendarText: "", calendarHref: "" };
  const events = input.tasks.map((task, index) => {
    const eventStart = addUtcDays(start, quickBuyerEvidenceFollowUpDayOffset(task.dueLabel, index));
    return {
      task,
      eventStart,
      eventEnd: addUtcDays(eventStart, 1)
    };
  });
  const calendarEndDate = events.length
    ? events
        .map((event) => event.eventStart)
        .reduce((latest, candidate) => (candidate.getTime() > latest.getTime() ? candidate : latest), events[0].eventStart)
        .toISOString()
        .slice(0, 10)
    : input.startDate;
  const checksum = stablePacketHash(
    [
      input.startDate,
      calendarEndDate,
      input.plan.state,
      input.plan.status,
      input.plan.receiptLine,
      ...input.tasks.map((task) => `${task.id}:${task.status}:${task.owner}:${task.dueLabel}:${task.action}:${task.closeCondition}:${task.href}`)
    ].join("\n")
  );
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//External Review Response//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap(({ task, eventStart, eventEnd }) => [
      "BEGIN:VEVENT",
      `UID:external-review-${task.id}-${compactIcsDate(eventStart)}-${checksum}@a2a-agent-marketplace`,
      `DTSTAMP:${compactIcsDate(start)}T000000Z`,
      `DTSTART;VALUE=DATE:${compactIcsDate(eventStart)}`,
      `DTEND;VALUE=DATE:${compactIcsDate(eventEnd)}`,
      `SUMMARY:${escapeIcsText(`${task.dueLabel} ${task.label} - ${task.owner}`)}`,
      `DESCRIPTION:${escapeIcsText(`Status: ${task.status}\nAction: ${task.action}\nClose: ${task.closeCondition}\nEvidence: ${task.evidence}\nResponse: ${input.plan.receiptLine}`)}`,
      `X-A2A-HREF:${escapeIcsText(task.href)}`,
      "END:VEVENT"
    ]),
    "END:VCALENDAR"
  ];
  const calendarText = icsLines.map(foldIcsLine).join("\r\n");
  return {
    calendarEndDate,
    calendarText,
    calendarHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(calendarText)}`
  };
}

function buildExternalReviewResponseFollowUpLedger(plan: QuickExternalReviewResponseActionPlanBase): QuickExternalReviewResponseFollowUpLedger {
  const tasks = plan.runbook.map((item, index) => ({
    id: item.id,
    label: item.label,
    status: item.status,
    owner: item.owner,
    dueLabel: quickBuyerEvidenceFollowUpDueLabel(item, index),
    action: item.action,
    closeCondition: externalReviewFollowUpCloseCondition(item, plan),
    evidence: item.evidence,
    proof: item.proof,
    href: externalReviewFollowUpHref(item, plan)
  }));
  const readyCount = tasks.filter((task) => task.status === "ready").length;
  const watchCount = tasks.filter((task) => task.status === "watch").length;
  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const firstOpenTask = tasks.find((task) => task.status !== "ready") ?? tasks[0];
  const csv = externalReviewFollowUpCsv(tasks);
  const calendarStartDate = quickBuyerEvidenceFollowUpStartDate(plan.reviewerLine);
  const calendar = externalReviewFollowUpCalendar({ plan, tasks, startDate: calendarStartDate });
  const headline = externalReviewFollowUpHeadline(plan);
  const summary =
    plan.state === "verified" && plan.status === "ready"
      ? `${tasks.length} owner task${tasks.length === 1 ? "" : "s"} carry the reviewer response into sponsor send, proof recheck, and outcome capture.`
      : plan.state === "verified" && plan.status === "watch"
        ? `${tasks.length} owner tasks turn the reviewer revision into repair work before another external send.`
        : plan.state === "verified"
          ? `${tasks.length} owner tasks preserve the reviewer stop as a no-send ledger until repair closes.`
      : plan.state === "closed"
        ? `${tasks.length} owner tasks preserve the old response while the repaired packet goes back to review.`
        : `${tasks.length} hold task${tasks.length === 1 ? "" : "s"} keep the response from changing the packet until the receipt is trusted.`;
  const exportMarkdown = [
    "# External review response follow-up ledger",
    "",
    `State: ${plan.state}`,
    `Status: ${plan.status}`,
    `Headline: ${headline}`,
    `Response: ${plan.receiptLine}`,
    `First due: ${firstOpenTask?.dueLabel ?? "No owner task"}`,
    "",
    "## Summary",
    summary,
    "",
    "## Tasks",
    ...tasks.map((task) => [
      `- [${task.status}] ${task.dueLabel} / ${task.owner} / ${task.label}`,
      `  Action: ${task.action}`,
      `  Close: ${task.closeCondition}`,
      `  Evidence: ${task.evidence}`,
      `  Proof: ${task.proof}`
    ].join("\n")),
    "",
    "## CSV",
    "```csv",
    csv,
    "```",
    "",
    "## Calendar",
    calendar.calendarHref ? `Calendar window: ${calendarStartDate} to ${calendar.calendarEndDate}` : "Calendar hold is generated after a reviewer response includes a valid generated date."
  ].join("\n");

  return {
    status: plan.status,
    headline,
    summary,
    readyCount,
    watchCount,
    blockedCount,
    taskTotal: tasks.length,
    firstDueLabel: firstOpenTask?.dueLabel ?? "No owner task",
    calendarStartDate,
    calendarEndDate: calendar.calendarEndDate,
    tasks,
    csv,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
    calendarText: calendar.calendarText,
    calendarHref: calendar.calendarHref,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function externalReviewRegenerationNote(input: {
  reviewPacket: QuickGlobalPublishabilityReviewPacket;
  nextOwner: string;
  nextAction: string;
  reviewerLine: string;
  receiptLine: string;
  verifierHref: string;
  reviewerNote?: string;
}) {
  return [
    `Buyer: ${input.reviewPacket.manifest.buyer}`,
    `External review manifest: ${input.reviewPacket.manifest.receiptId} / fnv1a32:${input.reviewPacket.manifest.checksum}`,
    `Reviewer response: ${input.reviewerLine}`,
    `Response receipt: ${input.receiptLine}`,
    `Reviewer note: ${input.reviewerNote || "No reviewer note imported."}`,
    `Owner: ${input.nextOwner}`,
    `Next action: ${input.nextAction}`,
    `Repair target: ${externalReviewRepairTarget(input.reviewPacket)}`,
    `Verifier: ${input.verifierHref || "Paste a matching verified response receipt first."}`
  ].join("\n");
}

function responseChecksumFromLine(receiptLine: string) {
  const match = receiptLine.match(/fnv1a32:([a-f0-9]{8})/i);
  return match ? `fnv1a32:${match[1].toLowerCase()}` : "fnv1a32:00000000";
}

function completeExternalReviewResponsePlan(plan: QuickExternalReviewResponseActionPlanBase) {
  const followUpLedger = buildExternalReviewResponseFollowUpLedger(plan);
  const followUpLedgerReceiptPayload: QuickExternalReviewOwnerPacketFollowUpLedger = {
    status: followUpLedger.status,
    headline: followUpLedger.headline,
    summary: followUpLedger.summary,
    readyCount: followUpLedger.readyCount,
    watchCount: followUpLedger.watchCount,
    blockedCount: followUpLedger.blockedCount,
    taskTotal: followUpLedger.taskTotal,
    firstDueLabel: followUpLedger.firstDueLabel,
    calendarStartDate: followUpLedger.calendarStartDate,
    calendarEndDate: followUpLedger.calendarEndDate,
    tasks: followUpLedger.tasks,
    csv: followUpLedger.csv,
    calendarText: followUpLedger.calendarText,
    exportMarkdown: followUpLedger.exportMarkdown
  };
  const ownerPacketMarkdown = [
    "# External review owner packet",
    "",
    `Owner: ${plan.nextOwner}`,
    `Status: ${plan.status}`,
    `Decision: ${plan.label}`,
    "",
    "## Owner action",
    plan.nextAction,
    "",
    "## Acceptance criteria",
    ...plan.acceptanceCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Runbook",
    ...plan.runbook.map((item) => `- [${item.status}] ${item.window} / ${item.owner} / ${item.label}: ${item.action} Evidence: ${item.evidence} Proof: ${item.proof}`),
    "",
    "## Follow-up ledger",
    followUpLedger.summary,
    `First due: ${followUpLedger.firstDueLabel}`,
    ...followUpLedger.tasks.map((task) => `- [${task.status}] ${task.dueLabel} / ${task.owner} / ${task.label}: ${task.closeCondition}`),
    "",
    "## Regeneration note",
    plan.regenerationNote,
    "",
    "## Evidence",
    `Reviewer: ${plan.reviewerLine}`,
    `Receipt: ${plan.receiptLine}`,
    `Verifier: ${plan.verifierHref || "No verifier link available."}`,
    `Current packet verifier: ${plan.packetVerifierHref || "No packet verifier available."}`,
    `Current review desk: ${plan.reviewDeskHref || "No review desk available."}`
  ].join("\n");
  const ownerPacketReceiptPayload: QuickExternalReviewOwnerPacketReceiptPayload = {
    receiptVersion: QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERSION,
    status: plan.status,
    label: plan.label,
    buyer: plan.regenerationNote.match(/^Buyer: (.+)$/m)?.[1]?.trim() || "Unknown buyer",
    owner: plan.nextOwner,
    nextAction: plan.nextAction,
    manifestReceiptId: plan.regenerationNote.match(/^External review manifest: ([^/]+) \//m)?.[1]?.trim() || "quick-external-review-blocked-00000000",
    manifestChecksum: plan.regenerationNote.match(/^External review manifest: [^/]+ \/ (fnv1a32:[a-f0-9]{8})$/im)?.[1]?.toLowerCase() || "fnv1a32:00000000",
    responseReceiptChecksum: responseChecksumFromLine(plan.receiptLine),
    reviewerLine: plan.reviewerLine,
    acceptanceCriteria: plan.acceptanceCriteria,
    runbook: plan.runbook,
    followUpLedger: followUpLedgerReceiptPayload,
    ownerPacketMarkdown,
    regenerationNote: plan.regenerationNote,
    proof: "Owner packet generated from a verified external review response, follow-up ledger, current packet manifest, and response intake action plan."
  };
  const ownerPacketReceiptChecksum = quickExternalReviewOwnerPacketReceiptChecksum(ownerPacketReceiptPayload);
  const ownerPacketReceiptJson = quickExternalReviewOwnerPacketReceiptRequestJson({
    checksum: ownerPacketReceiptChecksum,
    payload: ownerPacketReceiptPayload
  });
  const ownerPacketVerifierStorageKey = `quick-external-review-owner-packet-${ownerPacketReceiptChecksum}`;
  const completedPlan = { ...plan, followUpLedger };
  const exportMarkdown = buildExternalReviewResponseExport(completedPlan);

  return {
    ...completedPlan,
    regenerationHref: `data:text/plain;charset=utf-8,${encodeURIComponent(plan.regenerationNote)}`,
    ownerPacketMarkdown,
    ownerPacketHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(ownerPacketMarkdown)}`,
    ownerPacketReceiptJson,
    ownerPacketReceiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(ownerPacketReceiptJson)}`,
    ownerPacketVerifierStorageKey,
    ownerPacketVerifierHref: receiptVerifierPrefillHref(ownerPacketReceiptJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

export function buildQuickExternalReviewResponseActionPlan(
  rawResponse: string,
  reviewPacket: QuickGlobalPublishabilityReviewPacket
): QuickExternalReviewResponseActionPlan {
  const emptyBase = {
    state: "empty" as const,
    status: "watch" as const,
    label: "Awaiting reviewer response",
    headline: "Paste the verified reviewer response",
    summary: "After the external reviewer records continue, revise, or stop, paste the response receipt JSON or verifier URL here.",
    reviewerLine: "No reviewer response imported.",
    receiptLine: reviewPacket.manifest.receiptId,
    nextOwner: "Review coordinator",
    nextAction: "Open the review desk, generate the reviewer response receipt, then paste the verifier URL or receipt JSON.",
    verificationRequestJson: "",
    verifierHref: "",
    packetVerifierHref: reviewPacket.manifestVerifierHref,
    reviewDeskHref: reviewPacket.reviewDeskHref,
    acceptanceCriteria: [
      "Generate the reviewer response receipt from the external review desk.",
      "Paste the Verify receipt URL or JSON into this intake.",
      "Apply the resulting owner packet only after it verifies against the current manifest."
    ],
    runbook: externalReviewResponseRunbook({
      accepted: false,
      closed: false,
      state: "empty",
      status: "watch",
      reviewPacket,
      nextOwner: "Review coordinator",
      nextAction: "Open the review desk, generate the reviewer response receipt, then paste the verifier URL or receipt JSON.",
      reviewerLine: "No reviewer response imported.",
      receiptLine: reviewPacket.manifest.receiptId,
      verifierHref: ""
    }),
    regenerationNote: [
      `Buyer: ${reviewPacket.manifest.buyer}`,
      `External review manifest: ${reviewPacket.manifest.receiptId} / fnv1a32:${reviewPacket.manifest.checksum}`,
      "Reviewer response: pending",
      `Repair target: ${externalReviewRepairTarget(reviewPacket)}`
    ].join("\n")
  };

  if (!rawResponse.trim()) {
    return completeExternalReviewResponsePlan(emptyBase);
  }

  const parsed = parseExternalReviewResponseRequest(rawResponse);
  if (!parsed.request) {
    const planBase = {
      ...emptyBase,
      state: "invalid" as const,
      status: "blocked" as const,
      label: "Response not accepted",
      headline: "Reviewer response could not be read",
      summary: parsed.error,
      nextAction: "Paste the exact response receipt JSON or the Verify receipt URL from the external review desk.",
      acceptanceCriteria: [
        "Use the response receipt generated by the external review desk.",
        "Keep checksum and payload unchanged when pasting the receipt.",
        "Verify against the current manifest before assigning owner work."
      ],
      runbook: externalReviewResponseRunbook({
        accepted: false,
        closed: false,
        state: "invalid",
        status: "blocked",
        reviewPacket,
        nextOwner: "Review coordinator",
        nextAction: "Paste the exact response receipt JSON or the Verify receipt URL from the external review desk.",
        reviewerLine: "Unreadable response",
        receiptLine: reviewPacket.manifest.receiptId,
        verifierHref: ""
      }),
      regenerationNote: externalReviewRegenerationNote({
        reviewPacket,
        nextOwner: "Review coordinator",
        nextAction: "Paste the exact response receipt JSON or the Verify receipt URL from the external review desk.",
        reviewerLine: "Unreadable response",
        receiptLine: reviewPacket.manifest.receiptId,
        verifierHref: ""
      })
    };
    return completeExternalReviewResponsePlan(planBase);
  }

  const verification = verifyQuickExternalReviewDecisionReceipt(parsed.request);
  const verificationRequestJson = quickExternalReviewDecisionReceiptRequestJson(parsed.request);
  const verifierHref = receiptVerifierPrefillHref(verificationRequestJson);
  const payload = parsed.request.payload;
  const manifestMatches =
    payload.manifestReceiptId === reviewPacket.manifest.receiptId &&
    normalizeExternalReviewChecksum(payload.manifestChecksum) === reviewPacket.manifest.checksum;
  const closesPriorRepair =
    verification.status === "verified" &&
    !manifestMatches &&
    (payload.decision === "stop" || payload.decision === "revise") &&
    reviewPacket.status === "ready" &&
    reviewPacket.clearance === "external-review";
  const state =
    verification.status !== "verified"
      ? ("mismatch" as const)
      : manifestMatches
        ? ("verified" as const)
        : closesPriorRepair
          ? ("closed" as const)
          : ("wrong-packet" as const);
  const accepted = state === "verified";
  const closed = state === "closed";
  const label = accepted
    ? externalReviewResponseLabel(payload.decision)
    : closed
      ? "Repair loop closed"
      : state === "wrong-packet"
        ? "Receipt is for another packet"
        : "Receipt checksum mismatch";
  const status = accepted ? externalReviewResponseStatus(payload.decision, payload.status) : closed ? ("watch" as const) : ("blocked" as const);
  const headline = accepted
    ? externalReviewResponseHeadline(payload.decision, reviewPacket.manifest.buyer)
    : closed
      ? `${reviewPacket.manifest.buyer} has a repaired packet ready for a new review`
      : state === "wrong-packet"
      ? "Do not apply this response to the current packet"
      : "Do not apply an edited reviewer response";
  const summary = accepted
    ? `${payload.reviewerName} recorded ${payload.reviewOutcome.toLowerCase()} with ${payload.testsReady}/${payload.testsTotal} tests ready and ${payload.confidence}/100 confidence.`
    : closed
      ? `${payload.reviewerName}'s ${payload.decision} receipt for ${payload.manifestReceiptId} is preserved as closure evidence. Current manifest ${reviewPacket.manifest.receiptId} is ready for a fresh reviewer response.`
    : state === "wrong-packet"
      ? `The receipt verifies, but it belongs to ${payload.manifestReceiptId}, not ${reviewPacket.manifest.receiptId}.`
      : verification.instruction;
  const nextOwner =
    accepted && payload.decision === "continue" && status === "ready"
      ? "Launch owner"
      : accepted && payload.decision === "revise"
        ? "Proof owner"
        : "Review coordinator";
  const nextAction = accepted
    ? payload.nextAction || reviewPacket.nextAction
    : closed
      ? "Open the new review desk and request a fresh reviewer response for the current manifest."
    : state === "wrong-packet"
      ? "Open the matching packet or request a new reviewer response for the current manifest."
      : "Ask the reviewer to regenerate the response receipt from the public review desk.";
  const reviewerLine = `${payload.reviewerName} / ${payload.generatedAt}`;
  const receiptLine = `fnv1a32:${parsed.request.checksum} / ${payload.manifestReceiptId}`;
  const planBase = {
    state,
    status,
    label,
    headline,
    summary,
    reviewerLine,
    receiptLine,
    nextOwner,
    nextAction,
    verificationRequestJson,
    verifierHref,
    packetVerifierHref: reviewPacket.manifestVerifierHref,
    reviewDeskHref: reviewPacket.reviewDeskHref,
    acceptanceCriteria: externalReviewResponseCriteria({
      accepted,
      closed,
      decision: payload.decision,
      status,
      reviewPacket
    }),
    runbook: externalReviewResponseRunbook({
      accepted,
      closed,
      state,
      status,
      decision: payload.decision,
      reviewPacket,
      nextOwner,
      nextAction,
      reviewerLine,
      receiptLine,
      verifierHref
    }),
    regenerationNote: externalReviewRegenerationNote({
      reviewPacket,
      nextOwner,
      nextAction,
      reviewerLine,
      receiptLine,
      verifierHref,
      reviewerNote: payload.reviewerNote
    })
  };
  return completeExternalReviewResponsePlan(planBase);
}

export function buyerReviewKitReplyRecordHref(verificationRequestJson: string, baseHref = "/buyer-review-kit") {
  const trimmedBaseHref = baseHref.trim() || "/buyer-review-kit";
  const isAbsolute = /^[a-z][a-z\d+\-.]*:/i.test(trimmedBaseHref);
  const url = new URL(trimmedBaseHref, "https://example.com");
  url.searchParams.set(BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM, verificationRequestJson);
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

export function buyerAcceptancePathReplyRecordHref(verificationRequestJson: string, baseHref = "/buyer-acceptance-path") {
  const trimmedBaseHref = baseHref.trim() || "/buyer-acceptance-path";
  const isAbsolute = /^[a-z][a-z\d+\-.]*:/i.test(trimmedBaseHref);
  const url = new URL(trimmedBaseHref, "https://example.com");
  url.searchParams.set(BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM, verificationRequestJson);
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

export function buyerReviewKitValidationAnswerRecordHref(verificationRequestJson: string, baseHref = "/buyer-review-kit") {
  const trimmedBaseHref = baseHref.trim() || "/buyer-review-kit";
  const isAbsolute = /^[a-z][a-z\d+\-.]*:/i.test(trimmedBaseHref);
  const url = new URL(trimmedBaseHref, "https://example.com");
  url.searchParams.set(BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM, verificationRequestJson);
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

export function buyerAcceptancePathValidationAnswerRecordHref(verificationRequestJson: string, baseHref = "/buyer-acceptance-path") {
  const trimmedBaseHref = baseHref.trim() || "/buyer-acceptance-path";
  const isAbsolute = /^[a-z][a-z\d+\-.]*:/i.test(trimmedBaseHref);
  const url = new URL(trimmedBaseHref, "https://example.com");
  url.searchParams.set(BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM, verificationRequestJson);
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

export function buildQuickBuyerDecisionReplyRecord(
  preview: QuickBuyerRoomPreview,
  onePager = buildQuickBuyerDecisionOnePager(preview),
  replyText: string
): QuickBuyerDecisionReplyRecord {
  const cleanReply = replyText.trim().slice(0, 1600);
  const baseReplyDeck = buildQuickBuyerDecisionReplyDeck(preview, onePager);
  const detected = detectBuyerReplyDecision(cleanReply, baseReplyDeck.recommendedOptionId);
  const selectedReplyDeck = withSelectedDecisionReply(baseReplyDeck, detected.decision);
  const selectedOption = selectedReplyDeck.options.find((option) => option.id === detected.decision) ?? selectedReplyDeck.options[0];
  const activation = buildQuickBuyerDecisionActivationBrief(preview, selectedReplyDeck, onePager);
  const status = mergedPreviewStatus(selectedOption.status, activation.status);
  const onePagerChecksum = `${onePager.receipt.checksumAlgorithm}:${onePager.receipt.checksum}`;
  const payload: QuickBuyerDecisionReplyRecordPayload = {
    receiptVersion: QUICK_BUYER_DECISION_REPLY_RECORD_RECEIPT_VERSION,
    status,
    decision: detected.decision,
    label: replyRecordLabel(detected.decision),
    headline: replyRecordHeadline(detected.decision, preview.buyer),
    buyer: preview.buyer,
    confidence: detected.confidence,
    buyerReply: cleanReply || "No reply text supplied.",
    matchedSignals: detected.matchedSignals,
    nextOwner: selectedOption.nextOwner,
    nextAction: selectedOption.nextAction,
    proof: selectedOption.proof,
    onePagerReceiptId: onePager.receipt.receiptId,
    onePagerChecksum,
    activation: {
      mode: activation.mode,
      status: activation.status,
      label: activation.label,
      recommendedReply: activation.recommendedReply,
      sourceReceiptId: activation.sourceReceiptId,
      sourceChecksum: activation.sourceChecksum,
      primaryHref: activation.primaryHref,
      primaryLabel: activation.primaryLabel,
      items: activation.items.map((item) => ({
        id: item.id,
        label: item.label,
        status: item.status,
        owner: item.owner,
        command: item.command,
        evidence: item.evidence,
        href: item.href
      }))
    }
  };
  const payloadMarkdown = [
    "# Buyer decision reply record",
    "",
    `Status: ${status}`,
    `Decision: ${selectedOption.label}`,
    `Buyer: ${preview.buyer}`,
    `Confidence: ${detected.confidence}/100`,
    `One-pager receipt: ${onePager.receipt.receiptId}`,
    `One-pager checksum: ${onePagerChecksum}`,
    "",
    "## Buyer reply",
    cleanReply || "No reply text supplied.",
    "",
    "## Matched signals",
    ...detected.matchedSignals.map((signal) => `- ${signal}`),
    "",
    "## Next action",
    `Owner: ${selectedOption.nextOwner}`,
    `Action: ${selectedOption.nextAction}`,
    `Proof: ${selectedOption.proof}`,
    "",
    "## Activation work order",
    `Mode: ${activation.mode}`,
    `Status: ${activation.status}`,
    `Source receipt: ${activation.sourceReceiptId}`,
    ...activation.items.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.command}`)
  ].join("\n");
  const checksum = quickBuyerDecisionReplyRecordChecksum(payload);
  const verificationRequest = { checksum, payload };
  const verificationRequestJson = quickBuyerDecisionReplyRecordVerificationRequestJson(verificationRequest);
  const verification = verifyQuickBuyerDecisionReplyRecordReceipt(verificationRequest);
  const receipt: QuickBuyerDecisionReplyRecordReceipt = {
    receiptId: `quick-buyer-reply-${detected.decision}-${checksum}`,
    checksumAlgorithm: "fnv1a32",
    checksum,
    verificationApiPath: QUICK_BUYER_DECISION_REPLY_RECORD_VERIFY_PATH,
    payload,
    payloadJson: quickBuyerDecisionReplyRecordPayloadJson(payload),
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification,
    generatedFrom: ["buyer-reply-text", "buyer-reply-path", "buyer-one-pager", "decision-activation"]
  };
  const exportMarkdown = [
    payloadMarkdown,
    "",
    "## Integrity receipt",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Generated from: ${receipt.generatedFrom.join(", ")}`,
    `API verification: POST ${receipt.verificationApiPath}`,
    "",
    "## Verify request",
    "```json",
    receipt.verificationRequestJson,
    "```"
  ].join("\n");

  return {
    status,
    decision: detected.decision,
    label: replyRecordLabel(detected.decision),
    headline: replyRecordHeadline(detected.decision, preview.buyer),
    summary: replyRecordSummary(detected.decision, activation),
    confidence: detected.confidence,
    buyerReply: cleanReply,
    matchedSignals: detected.matchedSignals,
    nextOwner: selectedOption.nextOwner,
    nextAction: selectedOption.nextAction,
    proof: selectedOption.proof,
    onePagerReceiptId: onePager.receipt.receiptId,
    onePagerChecksum,
    activation,
    receipt,
    receiptHref: receipt.verificationRequestHref,
    verifierHref: receiptVerifierPrefillHref(receipt.verificationRequestJson),
    reviewKitHref: buyerReviewKitReplyRecordHref(receipt.verificationRequestJson),
    acceptancePathHref: buyerAcceptancePathReplyRecordHref(receipt.verificationRequestJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function activationStatusForProofRepair(plan: QuickProofRepairPlan): QuickBuyerRoomPreviewStatus {
  if (plan.repairCount === 0) return "ready";
  return plan.readyCount > 0 ? "watch" : "blocked";
}

function activationItemFromRollout(command: QuickRolloutCommand): QuickBuyerDecisionActivationItem {
  return {
    id: command.id,
    label: `${command.window} ${command.label}`,
    status: command.status,
    owner: command.owner,
    command: command.command,
    evidence: command.evidence,
    href: command.href
  };
}

function activationItemFromProofRepair(item: QuickProofRepairItem): QuickBuyerDecisionActivationItem {
  return {
    id: item.id,
    label: item.label,
    status: item.status,
    owner: item.owner,
    command: item.action,
    evidence: item.value,
    href: item.href
  };
}

export function buildQuickBuyerDecisionActivationBrief(
  preview: QuickBuyerRoomPreview,
  replyDeck = buildQuickBuyerDecisionReplyDeck(preview),
  onePager = buildQuickBuyerDecisionOnePager(preview)
): QuickBuyerDecisionActivationBrief {
  const recommended = replyDeck.options.find((option) => option.id === replyDeck.recommendedOptionId) ?? replyDeck.options[0];
  const usePilotStart = recommended.id === "continue" && onePager.status === "ready";
  const mode: QuickBuyerDecisionActivationMode = usePilotStart ? "pilot-start" : recommended.id === "stop" ? "close-audit" : "proof-repair";
  const items =
    mode === "pilot-start"
      ? preview.rolloutCommandBoard.commands.slice(0, 3).map(activationItemFromRollout)
      : mode === "proof-repair"
        ? preview.proofRepairPlan.items.filter((item) => item.status !== "ready").map(activationItemFromProofRepair)
        : [
            {
              id: "close-audit",
              label: "Close audit",
              status: "watch" as const,
              owner: recommended.nextOwner,
              command: recommended.nextAction,
              evidence: recommended.proof,
              href: onePager.exportHref
            }
          ];
  const status =
    mode === "pilot-start"
      ? preview.rolloutCommandBoard.status
      : mode === "proof-repair"
        ? activationStatusForProofRepair(preview.proofRepairPlan)
        : "watch";
  const sourceReceiptId = mode === "pilot-start" ? preview.rolloutCommandBoard.receipt.receiptId : onePager.receipt.receiptId;
  const sourceChecksum =
    mode === "pilot-start"
      ? `${preview.rolloutCommandBoard.receipt.checksumAlgorithm}:${preview.rolloutCommandBoard.receipt.checksum}`
      : `${onePager.receipt.checksumAlgorithm}:${onePager.receipt.checksum}`;
  const primaryHref = mode === "pilot-start" ? preview.rolloutCommandBoard.ownerBriefHref : `#${QUICK_PROOF_REPAIR_PLAN_ID}`;
  const primaryLabel = mode === "pilot-start" ? "Owner brief" : mode === "proof-repair" ? "Repair queue" : "Audit trail";
  const label = mode === "pilot-start" ? "Pilot start work order" : mode === "proof-repair" ? "Proof repair work order" : "Decision closeout";
  const headline =
    mode === "pilot-start"
      ? "Continue creates the first three rollout tasks"
      : mode === "proof-repair"
        ? "Revise creates the proof repair tasks"
        : "Stop keeps the decision auditable";
  const summary =
    mode === "pilot-start"
      ? `${preview.buyer} can move from decision to Day 0, Day 3, and Day 7 owner work with the rollout receipt attached.`
      : mode === "proof-repair"
        ? `${preview.proofRepairPlan.repairCount} proof repair task${preview.proofRepairPlan.repairCount === 1 ? "" : "s"} must close before buyer sharing resumes.`
        : "Record the missing condition, preserve the one-pager receipt, and keep the proof packet as the audit trail.";
  const exportMarkdown = [
    "# Buyer decision activation brief",
    "",
    `Mode: ${mode}`,
    `Status: ${status}`,
    `Buyer: ${preview.buyer}`,
    `Recommended reply: ${recommended.label}`,
    `Source receipt: ${sourceReceiptId}`,
    `Source checksum: ${sourceChecksum}`,
    "",
    "## Summary",
    summary,
    "",
    "## Activation tasks",
    ...items.flatMap((item) => [
      `- [${item.status}] ${item.label}: ${item.owner}`,
      `  Command: ${item.command}`,
      `  Evidence: ${item.evidence}`,
      `  Link: ${item.href}`
    ])
  ].join("\n");

  return {
    mode,
    status,
    label,
    headline,
    summary,
    recommendedReply: recommended.id,
    sourceReceiptId,
    sourceChecksum,
    primaryHref,
    primaryLabel,
    items,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function decisionSuccessCommitmentLabel(status: QuickBuyerRoomPreviewStatus) {
  if (status === "ready") return "Success commitment";
  if (status === "watch") return "Success commitment review";
  return "Success commitment blocked";
}

function buildQuickBuyerDecisionValueRealizationLedger(input: {
  preview: QuickBuyerRoomPreview;
  plan: QuickAdoptionSuccessPlan;
  workflow: string;
  onePager: QuickBuyerDecisionOnePager;
  sourceChecksum: string;
}): QuickBuyerDecisionValueRealizationLedger {
  const metric = (id: QuickAdoptionSuccessMetric["id"]) => input.plan.metrics.find((item) => item.id === id);
  const checkpoint = (id: QuickAdoptionSuccessCheckpoint["id"]) => input.plan.checkpoints.find((item) => item.id === id);
  const ownerMetric = metric("owner-commitment");
  const usageMetric = metric("repeat-usage");
  const valueMetric = metric("value-retention");
  const proofMetric = metric("proof-freshness");
  const trustMetric = metric("trust-boundary");
  const day0 = checkpoint("day-0");
  const day7 = checkpoint("day-7");
  const day14 = checkpoint("day-14");
  const day30 = checkpoint("day-30");
  const tasks: QuickBuyerDecisionValueRealizationTask[] = [
    {
      id: "baseline-lock",
      window: "Day 0",
      label: "Baseline locked",
      status: mergedPreviewStatus(day0?.status ?? "blocked", ownerMetric?.status ?? "blocked"),
      owner: day0?.owner || ownerMetric?.owner || input.preview.buyer,
      action: day0?.objective || `Assign the operating owner and baseline for ${input.workflow}.`,
      evidence: day0?.evidence || ownerMetric?.evidence || input.plan.summary,
      closeCriteria: day0?.exitCriteria || ownerMetric?.target || "Owner can name the metric, proof packet, stop rule, and next review date.",
      proof: `Source receipt ${input.onePager.receipt.receiptId}`,
      href: day0?.href || input.onePager.exportHref
    },
    {
      id: "repeat-usage",
      window: "Day 7",
      label: "Repeat usage proven",
      status: mergedPreviewStatus(day7?.status ?? "blocked", usageMetric?.status ?? "blocked", trustMetric?.status ?? "blocked"),
      owner: day7?.owner || usageMetric?.owner || input.preview.buyer,
      action: day7?.objective || "Confirm the workflow repeats outside the initial supervised run.",
      evidence: usageMetric?.evidence || day7?.evidence || input.plan.summary,
      closeCriteria: day7?.exitCriteria || usageMetric?.target || "Accepted task rate is measured.",
      proof: usageMetric?.target || input.plan.renewalAsk,
      href: day7?.href || input.plan.exportHref
    },
    {
      id: "value-retention",
      window: "Day 14",
      label: "Value retained",
      status: mergedPreviewStatus(day14?.status ?? "blocked", valueMetric?.status ?? "blocked"),
      owner: day14?.owner || valueMetric?.owner || "Finance owner",
      action: day14?.objective || "Compare repeated use against the downside economics.",
      evidence: valueMetric?.evidence || day14?.evidence || input.plan.summary,
      closeCriteria: day14?.exitCriteria || valueMetric?.target || "Monthly retained value is measurable.",
      proof: valueMetric?.target || input.plan.renewalAsk,
      href: day14?.href || input.plan.exportHref
    },
    {
      id: "expand-stop",
      window: "Day 30",
      label: "Expand or stop recorded",
      status: mergedPreviewStatus(day30?.status ?? "blocked", proofMetric?.status ?? "blocked", valueMetric?.status ?? "blocked"),
      owner: day30?.owner || "Procurement owner",
      action: day30?.objective || "Decide whether to expand, revise, or stop with current proof attached.",
      evidence: day30?.evidence || proofMetric?.evidence || input.plan.summary,
      closeCriteria: day30?.exitCriteria || input.plan.expansionCriteria[0] || "Expansion is approved only if value, proof, trust boundary, and owners remain current.",
      proof: [proofMetric?.target, trustMetric?.target].filter(Boolean).join(" / ") || input.plan.renewalAsk,
      href: day30?.href || input.plan.exportHref
    }
  ];
  const status = mergedPreviewStatus(...tasks.map((task) => task.status));
  const readyCount = tasks.filter((task) => task.status === "ready").length;
  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const next = tasks.find((task) => task.status !== "ready");
  const nextOwner = next?.owner ?? "Review owner";
  const nextAction = next?.action ?? "Attach the value calendar, CSV, and ledger receipt to the external review packet.";
  const headline =
    status === "ready"
      ? "Value realization ledger is ready"
      : status === "watch"
        ? "Value realization ledger needs owner review"
        : "Value realization ledger is blocked";
  const summary =
    status === "ready"
      ? `${input.preview.buyer} has Day 0/7/14/30 value tasks tied to owner evidence, retained value, proof freshness, and the expand-or-stop decision.`
      : `${readyCount}/4 value tasks ready. Next: ${nextOwner} must ${nextAction.toLowerCase()}`;
  const taskCsvText = [
    ["window", "label", "status", "owner", "action", "evidence", "close_criteria", "proof", "href"].map(csvCell).join(","),
    ...tasks.map((task) =>
      [task.window, task.label, task.status, task.owner, task.action, task.evidence, task.closeCriteria, task.proof, task.href].map(csvCell).join(",")
    )
  ].join("\n");
  const checksum = stablePacketHash(
    [
      input.preview.buyer,
      input.workflow,
      status,
      summary,
      input.onePager.receipt.receiptId,
      input.sourceChecksum,
      taskCsvText,
      ...tasks.map((task) => `${task.id}:${task.window}:${task.status}:${task.owner}:${task.action}:${task.evidence}:${task.closeCriteria}:${task.proof}:${task.href}`)
    ].join("\n")
  );
  const receipt = {
    receiptId: `quick-value-realization-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum
  };
  const receiptText = JSON.stringify(receipt, null, 2);
  const exportMarkdown = [
    "# Value realization ledger",
    "",
    `Buyer: ${input.preview.buyer}`,
    `Workflow: ${input.workflow}`,
    `Status: ${status}`,
    `Ready: ${readyCount}/4`,
    `Blocked: ${blockedCount}`,
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`,
    `Source receipt: ${input.onePager.receipt.receiptId}`,
    `Source checksum: ${input.sourceChecksum}`,
    `Ledger receipt: ${receipt.receiptId}`,
    `Ledger checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    "",
    summary,
    "",
    "## Tasks",
    ...tasks.map(
      (task) =>
        `- [${task.status}] ${task.window} ${task.label} (${task.owner}): ${task.action} Close: ${task.closeCriteria} Evidence: ${task.evidence} Proof: ${task.proof}`
    ),
    "",
    "## Import artifacts",
    "Task CSV columns: window, label, status, owner, action, evidence, close_criteria, proof, href",
    "Calendar export: use the same pilot start date as the rollout command board."
  ].join("\n");

  return {
    status,
    headline,
    summary,
    readyCount,
    blockedCount,
    nextOwner,
    nextAction,
    sourceReceiptId: input.onePager.receipt.receiptId,
    sourceChecksum: input.sourceChecksum,
    tasks,
    taskCsvText,
    taskCsvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(taskCsvText)}`,
    receipt,
    receiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(receiptText)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

const VALUE_REALIZATION_DAY_OFFSETS: Record<QuickBuyerDecisionValueRealizationTask["window"], number> = {
  "Day 0": 0,
  "Day 7": 7,
  "Day 14": 14,
  "Day 30": 30
};

export function buildQuickValueRealizationCalendarExport(
  ledger: QuickBuyerDecisionValueRealizationLedger,
  startDate: string
): QuickValueRealizationCalendarExport | null {
  const start = parseIsoDateOnly(startDate);
  if (!start) return null;
  const events = ledger.tasks.map((task) => {
    const eventStart = addUtcDays(start, VALUE_REALIZATION_DAY_OFFSETS[task.window]);
    const eventEnd = addUtcDays(eventStart, 1);
    return {
      task,
      eventStart,
      eventEnd
    };
  });
  const endDate = events.length > 0 ? events[events.length - 1].eventStart.toISOString().slice(0, 10) : startDate;
  const checksumSource = [
    startDate,
    endDate,
    ledger.status,
    ledger.nextOwner,
    ledger.nextAction,
    ledger.receipt.receiptId,
    ...events.map(({ task, eventStart }) => `${compactIcsDate(eventStart)}:${task.id}:${task.status}:${task.owner}:${task.action}:${task.closeCriteria}:${task.proof}`)
  ].join("\n");
  const checksum = stablePacketHash(checksumSource);
  const receipt = {
    receiptId: `quick-value-realization-calendar-${ledger.status}-${compactIcsDate(start)}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum
  };
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//Quick Value Realization//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap(({ task, eventStart, eventEnd }) => [
      "BEGIN:VEVENT",
      `UID:${task.id}-${compactIcsDate(eventStart)}-${checksum}@a2a-agent-marketplace`,
      `DTSTAMP:${compactIcsDate(start)}T000000Z`,
      `DTSTART;VALUE=DATE:${compactIcsDate(eventStart)}`,
      `DTEND;VALUE=DATE:${compactIcsDate(eventEnd)}`,
      `SUMMARY:${escapeIcsText(`${task.window} ${task.label} - ${task.owner}`)}`,
      `DESCRIPTION:${escapeIcsText(`Status: ${task.status}\nAction: ${task.action}\nClose: ${task.closeCriteria}\nEvidence: ${task.evidence}\nProof: ${task.proof}\nReceipt: ${receipt.receiptId}`)}`,
      `X-A2A-HREF:${escapeIcsText(task.href)}`,
      "END:VEVENT"
    ]),
    "END:VCALENDAR"
  ];
  const icsText = icsLines.map(foldIcsLine).join("\r\n");
  const receiptText = JSON.stringify(receipt, null, 2);

  return {
    startDate,
    endDate,
    eventCount: events.length,
    icsText,
    icsHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsText)}`,
    receipt,
    receiptHref: `data:application/json;charset=utf-8,${encodeURIComponent(receiptText)}`
  };
}

function normalizedEvidenceText(value: string) {
  return value.toLowerCase().replace(/[￥]/g, "¥");
}

function evidenceHasAny(text: string, patterns: Array<string | RegExp>) {
  return patterns.some((pattern) => (typeof pattern === "string" ? text.includes(pattern) : pattern.test(text)));
}

function signalResult(text: string, label: string, patterns: Array<string | RegExp>) {
  return evidenceHasAny(text, patterns) ? label : "";
}

function extractYenAmounts(value: string) {
  const amounts: number[] = [];
  const patterns = [/¥\s*([\d,]+)/g, /([\d,]+)\s*(?:yen|円|jpy)/gi];
  for (const pattern of patterns) {
    let match = pattern.exec(value);
    while (match) {
      const amount = Number((match[1] ?? "").replace(/,/g, ""));
      if (Number.isFinite(amount) && amount > 0) amounts.push(amount);
      match = pattern.exec(value);
    }
  }
  return amounts;
}

function closeoutEvidenceStatus(sourceStatus: QuickBuyerRoomPreviewStatus, matchedSignals: string[], requiredCount: number): QuickBuyerRoomPreviewStatus {
  const evidenceStatus: QuickBuyerRoomPreviewStatus = matchedSignals.length >= requiredCount ? "ready" : matchedSignals.length > 0 ? "watch" : "blocked";
  return mergedPreviewStatus(sourceStatus, evidenceStatus);
}

function closeoutDecisionFromEvidence(text: string): QuickValueRealizationCloseout["decision"] {
  if (evidenceHasAny(text, [/decision\s*:\s*expand/, "expansion approved", "approve expansion", "approved expansion", "expand decision"])) return "expand";
  if (evidenceHasAny(text, [/decision\s*:\s*revise/, "revise decision", "revision requested", "repair before expansion", "hold expansion"])) return "revise";
  if (evidenceHasAny(text, [/decision\s*:\s*stop/, "stop decision", "stopped expansion", "expansion stopped", "do not expand", "no expansion"])) return "stop";
  return "missing";
}

function closeoutRequiredSignalCount(id: QuickBuyerDecisionValueRealizationTask["id"], retainedValueTargetYen: number) {
  return id === "value-retention" && retainedValueTargetYen <= 0 ? 2 : 3;
}

function closeoutSignalOnlyStatus(matchedSignals: string[], requiredCount: number): QuickBuyerRoomPreviewStatus {
  if (matchedSignals.length >= requiredCount) return "ready";
  return matchedSignals.length > 0 ? "watch" : "blocked";
}

type QuickValueRealizationSourceTaskMap = Record<QuickBuyerDecisionValueRealizationTask["id"], QuickBuyerDecisionValueRealizationTask | undefined>;

function buildQuickValueRealizationCloseoutRepairQueue(input: {
  buyer: string;
  sourceLedgerReceiptId: string;
  sourceLedgerChecksum: string;
  retainedValueTargetYen: number;
  tasks: QuickValueRealizationCloseoutTask[];
  sourceTasks: QuickValueRealizationSourceTaskMap;
}): QuickValueRealizationCloseoutRepairQueue {
  const items = input.tasks.flatMap((task) => {
    if (task.status === "ready") return [];
    const sourceTask = input.sourceTasks[task.id];
    const sourceStatus = sourceTask?.status ?? "blocked";
    const requiredCount = closeoutRequiredSignalCount(task.id, input.retainedValueTargetYen);
    const evidenceStatus = closeoutSignalOnlyStatus(task.matchedSignals, requiredCount);
    const sourceRepairReady = evidenceStatus === "ready" && sourceStatus !== "ready";
    const reason = sourceRepairReady ? ("source-ledger-repair" as const) : ("evidence-gap" as const);
    const status = sourceRepairReady ? sourceStatus : mergedPreviewStatus(sourceStatus, evidenceStatus);
    const missingText = task.missingSignals.join(", ") || `${requiredCount} matched signals`;
    const matchedText = task.matchedSignals.join(", ") || "no matched closeout signals yet";
    const label = sourceRepairReady ? `${task.window} source ledger repair` : `${task.window} closeout evidence gap`;
    const owner = sourceRepairReady ? sourceTask?.owner ?? task.owner : task.owner;
    const action = sourceRepairReady
      ? `Update the source ${task.window} value ledger row to ready using the matched closeout evidence already pasted here.`
      : `Add closeout evidence for ${missingText}, then rerun this closeout before sharing it as value proof.`;
    const proof = sourceRepairReady
      ? `Attach matched signals: ${matchedText}. Re-export source ledger ${input.sourceLedgerReceiptId}.`
      : `Expected proof: ${task.evidence}`;
    const acceptance = sourceRepairReady
      ? `${sourceTask?.label ?? task.label} is ready in the source value ledger and ${task.label} reruns ready.`
      : `${task.label} has ${requiredCount}/${requiredCount} matched closeout signals and no missing evidence.`;

    return [
      {
        id: `${task.id}-${reason}`,
        taskId: task.id,
        label,
        status,
        reason,
        owner,
        sourceStatus,
        evidenceStatus,
        action,
        proof,
        acceptance,
        href: sourceTask?.href ?? task.href
      }
    ];
  });
  const status = items.length > 0 ? mergedPreviewStatus(...items.map((item) => item.status)) : "ready";
  const sourceRepairCount = items.filter((item) => item.reason === "source-ledger-repair").length;
  const evidenceGapCount = items.filter((item) => item.reason === "evidence-gap").length;
  const next = items.find((item) => item.status === "blocked") ?? items[0];
  const nextOwner = next?.owner ?? "Ready";
  const nextAction = next?.action ?? "Keep the closeout receipt attached to the buyer value packet.";
  const headline =
    status === "ready"
      ? "No value closeout repairs open"
      : sourceRepairCount > 0 && evidenceGapCount === 0
        ? "Closeout evidence is present; repair the source ledger"
        : "Closeout repair queue has evidence gaps";
  const summary =
    status === "ready"
      ? `${input.buyer} has aligned closeout evidence and a source ledger that can be verified.`
      : sourceRepairCount > 0 && evidenceGapCount === 0
        ? `${sourceRepairCount} source ledger row${sourceRepairCount === 1 ? "" : "s"} must be updated before the closeout receipt can be accepted.`
        : `${items.length} repair item${items.length === 1 ? "" : "s"} open. Next: ${nextOwner} must ${nextAction.toLowerCase()}`;
  const exportMarkdown = [
    "# Value closeout repair queue",
    "",
    `Buyer: ${input.buyer}`,
    `Status: ${status}`,
    `Source ledger: ${input.sourceLedgerReceiptId}`,
    `Source ledger checksum: ${input.sourceLedgerChecksum}`,
    `Items: ${items.length}`,
    `Source repairs: ${sourceRepairCount}`,
    `Evidence gaps: ${evidenceGapCount}`,
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`,
    "",
    summary,
    "",
    "## Repair items",
    ...(items.length > 0
      ? items.flatMap((item) => [
          `- [${item.status}] ${item.label} (${item.owner})`,
          `  Reason: ${item.reason}`,
          `  Source status: ${item.sourceStatus}`,
          `  Evidence status: ${item.evidenceStatus}`,
          `  Action: ${item.action}`,
          `  Proof: ${item.proof}`,
          `  Acceptance: ${item.acceptance}`,
          `  Link: ${item.href}`
        ])
      : ["No repair queue open."])
  ].join("\n");

  return {
    status,
    headline,
    summary,
    itemCount: items.length,
    sourceRepairCount,
    evidenceGapCount,
    nextOwner,
    nextAction,
    items,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function closeoutRepairAcknowledgementItemStatus(matchedSignals: string[], requiredCount: number): QuickBuyerRoomPreviewStatus {
  if (matchedSignals.length >= requiredCount) return "ready";
  return matchedSignals.length > 0 ? "watch" : "blocked";
}

function closeoutRepairItemNamePatterns(item: QuickValueRealizationCloseoutRepairQueue["items"][number]) {
  return [
    item.id.toLowerCase(),
    item.taskId.toLowerCase(),
    item.taskId.replace(/-/g, " ").toLowerCase(),
    item.label.toLowerCase(),
    item.label.replace(" source ledger repair", "").replace(" closeout evidence gap", "").toLowerCase()
  ];
}

export function buildQuickValueRealizationCloseoutRepairAcknowledgement(input: {
  closeout: QuickValueRealizationCloseout;
  ownerEvidenceText: string;
}): QuickValueRealizationCloseoutRepairAcknowledgement {
  const rawEvidence = input.ownerEvidenceText.trim();
  const text = normalizedEvidenceText(rawEvidence);
  const sourceCloseoutChecksum = `${input.closeout.receipt.checksumAlgorithm}:${input.closeout.receipt.checksum}`;
  const sourceRepairItems = input.closeout.repairQueue.items.filter((item) => item.reason === "source-ledger-repair");
  const items: QuickValueRealizationCloseoutRepairAcknowledgementItem[] = input.closeout.repairQueue.items.map((item) => {
    if (item.reason === "evidence-gap") {
      return {
        id: `${item.id}-acknowledgement`,
        taskId: item.taskId,
        label: item.label,
        status: "blocked",
        reason: item.reason,
        owner: item.owner,
        matchedSignals: [],
        missingSignals: ["repair operating evidence first"],
        sourceStatus: item.sourceStatus,
        evidenceStatus: item.evidenceStatus,
        requiredAction: "Repair the operating evidence field before owner acknowledgement can close this item.",
        acceptance: item.acceptance,
        href: item.href
      };
    }

    const matchedSignals = [
      signalResult(text, "repair item named", closeoutRepairItemNamePatterns(item)),
      signalResult(text, "owner named", [item.owner.toLowerCase()]),
      signalResult(text, "repair accepted", ["accepted", "approved", "acknowledged", "completed", "ready", "signed"]),
      signalResult(text, "source ledger re-exported", [
        input.closeout.sourceLedgerReceiptId.toLowerCase(),
        input.closeout.sourceLedgerChecksum.toLowerCase(),
        "re-exported",
        "reexported",
        "source ledger ready",
        "ledger row ready"
      ])
    ].filter(Boolean);
    const missingSignals = ["repair item named", "owner named", "repair accepted", "source ledger re-exported"].filter((signal) => !matchedSignals.includes(signal));

    return {
      id: `${item.id}-acknowledgement`,
      taskId: item.taskId,
      label: item.label,
      status: closeoutRepairAcknowledgementItemStatus(matchedSignals, 4),
      reason: item.reason,
      owner: item.owner,
      matchedSignals,
      missingSignals,
      sourceStatus: item.sourceStatus,
      evidenceStatus: item.evidenceStatus,
      requiredAction: item.action,
      acceptance: item.acceptance,
      href: item.href
    };
  });
  const acknowledgedCount = items.filter((item) => item.reason === "source-ledger-repair" && item.status === "ready").length;
  const requiredAcknowledgementCount = sourceRepairItems.length;
  const status: QuickBuyerRoomPreviewStatus =
    input.closeout.repairQueue.itemCount === 0
      ? "ready"
      : input.closeout.repairQueue.evidenceGapCount > 0
        ? "blocked"
        : requiredAcknowledgementCount > 0 && acknowledgedCount === requiredAcknowledgementCount
          ? "ready"
          : rawEvidence
            ? "watch"
            : "blocked";
  const next = items.find((item) => item.status !== "ready") ?? items[0];
  const nextOwner = status === "ready" ? "Ready" : next?.owner ?? input.closeout.repairQueue.nextOwner;
  const nextAction =
    status === "ready"
      ? "Attach this acknowledgement with the repaired value closeout packet."
      : next?.requiredAction ?? input.closeout.repairQueue.nextAction;
  const headline =
    status === "ready"
      ? "Repair acknowledgement is verifiable"
      : input.closeout.repairQueue.evidenceGapCount > 0
        ? "Operating evidence must be repaired first"
        : "Owner acknowledgement still needs proof";
  const summary =
    status === "ready"
      ? `${acknowledgedCount}/${requiredAcknowledgementCount} source-ledger repair acknowledgements are tied to the closeout receipt.`
      : input.closeout.repairQueue.evidenceGapCount > 0
        ? "Owner acknowledgement cannot close evidence gaps; update the operating evidence and rerun the closeout first."
        : `${acknowledgedCount}/${requiredAcknowledgementCount} source-ledger repair acknowledgements accepted. Next: ${nextOwner} must ${nextAction.toLowerCase()}`;
  const payload: QuickValueRealizationCloseoutRepairAcknowledgementPayload = {
    receiptVersion: QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_RECEIPT_VERSION,
    status,
    buyer: input.closeout.receipt.payload.buyer,
    sourceCloseoutReceiptId: input.closeout.receipt.receiptId,
    sourceCloseoutChecksum,
    sourceLedgerReceiptId: input.closeout.sourceLedgerReceiptId,
    sourceLedgerChecksum: input.closeout.sourceLedgerChecksum,
    repairQueueStatus: input.closeout.repairQueue.status,
    repairQueueItemCount: input.closeout.repairQueue.itemCount,
    sourceRepairCount: input.closeout.repairQueue.sourceRepairCount,
    evidenceGapCount: input.closeout.repairQueue.evidenceGapCount,
    acknowledgedCount,
    requiredAcknowledgementCount,
    nextOwner,
    nextAction,
    ownerEvidence: rawEvidence || "No owner acknowledgement pasted.",
    items
  };
  const checksum = quickValueRealizationCloseoutRepairAcknowledgementChecksum(payload);
  const verificationRequest = { checksum, payload };
  const verificationRequestJson = quickValueRealizationCloseoutRepairAcknowledgementRequestJson(verificationRequest);
  const verification = verifyQuickValueRealizationCloseoutRepairAcknowledgementReceipt(verificationRequest);
  const receipt = {
    receiptId: `quick-value-closeout-repair-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    verificationApiPath: QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH as typeof QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH,
    payload,
    payloadJson: quickValueRealizationCloseoutRepairAcknowledgementPayloadJson(payload),
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification,
    generatedFrom: ["value-closeout-repair-queue", "owner-acknowledgement", "value-closeout-receipt"]
  };
  const exportMarkdown = [
    "# Value closeout repair acknowledgement",
    "",
    `Buyer: ${payload.buyer}`,
    `Status: ${status}`,
    `Acknowledged: ${acknowledgedCount}/${requiredAcknowledgementCount}`,
    `Source closeout: ${payload.sourceCloseoutReceiptId}`,
    `Source closeout checksum: ${payload.sourceCloseoutChecksum}`,
    `Source ledger: ${payload.sourceLedgerReceiptId}`,
    `Source ledger checksum: ${payload.sourceLedgerChecksum}`,
    `Repair receipt: ${receipt.receiptId}`,
    `Repair checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `API verification: POST ${receipt.verificationApiPath}`,
    "",
    summary,
    "",
    "## Acknowledgement items",
    ...(items.length > 0
      ? items.map(
          (item) =>
            `- [${item.status}] ${item.label} (${item.owner}): matched ${item.matchedSignals.join(", ") || "none"}; missing ${item.missingSignals.join(", ") || "none"}. Acceptance: ${item.acceptance}`
        )
      : ["No repair acknowledgements required."]),
    "",
    "## Owner evidence",
    payload.ownerEvidence,
    "",
    "## Verify request",
    "```json",
    receipt.verificationRequestJson,
    "```"
  ].join("\n");

  return {
    status,
    headline,
    summary,
    acknowledgedCount,
    requiredAcknowledgementCount,
    nextOwner,
    nextAction,
    items,
    receipt,
    receiptHref: receipt.verificationRequestHref,
    verifierHref: receiptVerifierPrefillHref(receipt.verificationRequestJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

export function buildQuickValueRealizationAcceptancePacket(input: {
  closeout: QuickValueRealizationCloseout;
  repairAcknowledgement: QuickValueRealizationCloseoutRepairAcknowledgement;
}): QuickValueRealizationAcceptancePacket {
  const retainedValueReady =
    input.closeout.retainedValueTargetYen > 0 && input.closeout.retainedValueYen >= input.closeout.retainedValueTargetYen;
  const decisionReady = input.closeout.decision !== "missing";
  const closeoutReceiptReady = input.closeout.receipt.verification.status === "verified";
  const repairReceiptReady = input.repairAcknowledgement.receipt.verification.status === "verified";
  const noEvidenceGaps = input.closeout.repairQueue.evidenceGapCount === 0;
  const noRepairsOpen = input.closeout.repairQueue.itemCount === 0;
  const sourceRepairsAccepted =
    noRepairsOpen ||
    (input.closeout.repairQueue.sourceRepairCount > 0 &&
      input.repairAcknowledgement.status === "ready" &&
      input.repairAcknowledgement.acknowledgedCount === input.repairAcknowledgement.requiredAcknowledgementCount);
  const accepted = closeoutReceiptReady && repairReceiptReady && noEvidenceGaps && sourceRepairsAccepted && retainedValueReady && decisionReady;
  const decision: QuickValueRealizationAcceptanceDecision = accepted
    ? "accept-value-proof"
    : !noEvidenceGaps || !retainedValueReady || !decisionReady
      ? "hold-for-operating-evidence"
      : "hold-for-repair-acknowledgement";
  const status: QuickBuyerRoomPreviewStatus = accepted ? "ready" : decision === "hold-for-operating-evidence" ? "blocked" : "watch";
  const buyerClaim = accepted
    ? `${input.closeout.receipt.payload.buyer} can review ${formatYen(input.closeout.retainedValueYen)}/month retained value with closeout and repair receipts attached.`
    : `Hold the buyer-facing value claim until ${decision === "hold-for-operating-evidence" ? "operating evidence is complete" : "source-ledger repair acknowledgement is complete"}.`;
  const nextOwner =
    status === "ready"
      ? "Ready"
      : decision === "hold-for-operating-evidence"
        ? input.closeout.nextOwner
        : input.repairAcknowledgement.nextOwner;
  const nextAction =
    status === "ready"
      ? "Attach this acceptance packet to the buyer value proof."
      : decision === "hold-for-operating-evidence"
        ? input.closeout.nextAction
        : input.repairAcknowledgement.nextAction;
  const checks: QuickValueRealizationAcceptancePayload["checks"] = [
    {
      id: "closeout-receipt",
      label: "Closeout receipt",
      status: closeoutReceiptReady && noEvidenceGaps ? "ready" : "blocked",
      owner: input.closeout.nextOwner,
      evidence: `${input.closeout.receipt.receiptId} / ${input.closeout.receipt.checksumAlgorithm}:${input.closeout.receipt.checksum}`,
      acceptance: "Closeout receipt verifies and no operating evidence gaps remain."
    },
    {
      id: "repair-acknowledgement",
      label: "Repair acknowledgement",
      status: sourceRepairsAccepted && repairReceiptReady ? "ready" : noEvidenceGaps ? "watch" : "blocked",
      owner: input.repairAcknowledgement.nextOwner,
      evidence: `${input.repairAcknowledgement.receipt.receiptId} / ${input.repairAcknowledgement.receipt.checksumAlgorithm}:${input.repairAcknowledgement.receipt.checksum}`,
      acceptance: "Source-ledger repair acknowledgements are complete or no repair acknowledgement is required."
    },
    {
      id: "retained-value",
      label: "Retained value",
      status: retainedValueReady ? "ready" : "blocked",
      owner: "Finance owner",
      evidence:
        input.closeout.retainedValueYen > 0
          ? `${formatYen(input.closeout.retainedValueYen)}/month against ${formatYen(input.closeout.retainedValueTargetYen)}/month target.`
          : "Retained value evidence is missing.",
      acceptance: "Retained value meets or exceeds the buyer success target."
    },
    {
      id: "buyer-decision",
      label: "Buyer decision",
      status: decisionReady ? "ready" : "blocked",
      owner: "Procurement owner",
      evidence: input.closeout.decision === "missing" ? "No expand/revise/stop decision recorded." : `${input.closeout.decision} decision recorded.`,
      acceptance: "Day 30 expand, revise, or stop decision is recorded with current proof."
    }
  ];
  const sourceCloseoutChecksum = `${input.closeout.receipt.checksumAlgorithm}:${input.closeout.receipt.checksum}`;
  const repairAcknowledgementChecksum = `${input.repairAcknowledgement.receipt.checksumAlgorithm}:${input.repairAcknowledgement.receipt.checksum}`;
  const payload: QuickValueRealizationAcceptancePayload = {
    receiptVersion: QUICK_VALUE_REALIZATION_ACCEPTANCE_RECEIPT_VERSION,
    status,
    decision,
    buyer: input.closeout.receipt.payload.buyer,
    closeoutDecision: input.closeout.decision,
    retainedValueYen: input.closeout.retainedValueYen,
    retainedValueTargetYen: input.closeout.retainedValueTargetYen,
    sourceCloseoutReceiptId: input.closeout.receipt.receiptId,
    sourceCloseoutChecksum,
    repairAcknowledgementReceiptId: input.repairAcknowledgement.receipt.receiptId,
    repairAcknowledgementChecksum,
    sourceLedgerReceiptId: input.closeout.sourceLedgerReceiptId,
    sourceLedgerChecksum: input.closeout.sourceLedgerChecksum,
    closeoutStatus: input.closeout.status,
    closeoutCompletedCount: input.closeout.completedCount,
    closeoutBlockedCount: input.closeout.blockedCount,
    repairQueueItemCount: input.closeout.repairQueue.itemCount,
    evidenceGapCount: input.closeout.repairQueue.evidenceGapCount,
    sourceRepairCount: input.closeout.repairQueue.sourceRepairCount,
    repairAcknowledgementStatus: input.repairAcknowledgement.status,
    acknowledgedCount: input.repairAcknowledgement.acknowledgedCount,
    requiredAcknowledgementCount: input.repairAcknowledgement.requiredAcknowledgementCount,
    nextOwner,
    nextAction,
    buyerClaim,
    checks
  };
  const checksum = quickValueRealizationAcceptanceChecksum(payload);
  const verificationRequest = { checksum, payload };
  const verificationRequestJson = quickValueRealizationAcceptanceRequestJson(verificationRequest);
  const verification = verifyQuickValueRealizationAcceptanceReceipt(verificationRequest);
  const receipt = {
    receiptId: `quick-value-acceptance-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    verificationApiPath: QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH as typeof QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH,
    payload,
    payloadJson: quickValueRealizationAcceptancePayloadJson(payload),
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification,
    generatedFrom: ["value-closeout-receipt", "value-repair-acknowledgement", "buyer-value-acceptance-checks"]
  };
  const headline =
    status === "ready"
      ? "Value proof can move to buyer review"
      : decision === "hold-for-operating-evidence"
        ? "Value proof is still missing operating evidence"
        : "Value proof needs repair acknowledgement";
  const summary =
    status === "ready"
      ? "The closeout receipt, repair acknowledgement, retained value, and Day 30 decision form one verifiable buyer value packet."
      : `${nextOwner} must ${nextAction.toLowerCase()}`;
  const exportMarkdown = [
    "# Value realization acceptance packet",
    "",
    `Buyer: ${payload.buyer}`,
    `Status: ${status}`,
    `Decision: ${decision}`,
    `Closeout receipt: ${payload.sourceCloseoutReceiptId}`,
    `Closeout checksum: ${payload.sourceCloseoutChecksum}`,
    `Repair acknowledgement: ${payload.repairAcknowledgementReceiptId}`,
    `Repair acknowledgement checksum: ${payload.repairAcknowledgementChecksum}`,
    `Acceptance receipt: ${receipt.receiptId}`,
    `Acceptance checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `API verification: POST ${receipt.verificationApiPath}`,
    "",
    summary,
    "",
    "## Buyer claim",
    buyerClaim,
    "",
    "## Acceptance checks",
    ...checks.map((check) => `- [${check.status}] ${check.label} (${check.owner}): ${check.evidence} Acceptance: ${check.acceptance}`),
    "",
    "## Verify request",
    "```json",
    receipt.verificationRequestJson,
    "```"
  ].join("\n");

  return {
    status,
    decision,
    headline,
    summary,
    buyerClaim,
    nextOwner,
    nextAction,
    checks,
    receipt,
    receiptHref: receipt.verificationRequestHref,
    verifierHref: receiptVerifierPrefillHref(receipt.verificationRequestJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

export function buildQuickValueRealizationBuyerReviewDossier(input: {
  closeout: QuickValueRealizationCloseout;
  repairAcknowledgement: QuickValueRealizationCloseoutRepairAcknowledgement;
  acceptance: QuickValueRealizationAcceptancePacket;
}): QuickValueRealizationBuyerReviewDossier {
  const accepted = input.acceptance.status === "ready" && input.acceptance.decision === "accept-value-proof";
  const retainedValueCheck = input.acceptance.checks.find((check) => check.id === "retained-value");
  const receiptCheck = input.acceptance.checks.find((check) => check.id === "closeout-receipt");
  const repairCheck = input.acceptance.checks.find((check) => check.id === "repair-acknowledgement");
  const decisionCheck = input.acceptance.checks.find((check) => check.id === "buyer-decision");
  const decision: QuickValueRealizationBuyerReviewDossier["decision"] = !accepted
    ? "hold-review"
    : input.closeout.decision === "stop"
      ? "review-stop"
      : input.closeout.decision === "revise"
        ? "review-revise"
        : "review-expand";
  const status: QuickBuyerRoomPreviewStatus = accepted ? "ready" : input.acceptance.status;
  const reviewQuestion =
    decision === "review-expand"
      ? `Should ${input.acceptance.receipt.payload.buyer} approve expansion with ${formatYen(input.closeout.retainedValueYen)}/month retained value?`
      : decision === "review-revise"
        ? `Should ${input.acceptance.receipt.payload.buyer} approve a revised rollout from the accepted value proof?`
        : decision === "review-stop"
          ? `Should ${input.acceptance.receipt.payload.buyer} stop the rollout based on the accepted Day 30 value proof?`
          : `What must close before ${input.acceptance.receipt.payload.buyer} reviews the value proof?`;
  const buyerAsk =
    decision === "review-expand"
      ? "Approve expansion only after verifying the acceptance receipt and confirming the retained-value owner remains accountable."
      : decision === "review-revise"
        ? "Approve a revised rollout plan only after the same acceptance receipt is attached to the revision scope."
        : decision === "review-stop"
          ? "Approve stop only after the value proof, closeout receipt, and owner acknowledgement are archived together."
          : `Hold review until ${input.acceptance.nextOwner} completes: ${input.acceptance.nextAction}`;
  const decisionRule = accepted
    ? "Review may proceed only if the receipt verifier returns HTTP 200, retained value meets target, and Day 30 decision is recorded."
    : "Do not ask the buyer to decide until the acceptance packet changes to accept-value-proof.";
  const items: QuickValueRealizationBuyerReviewDossierItem[] = [
    {
      id: "value-claim",
      label: "Value claim",
      status: retainedValueCheck?.status ?? "blocked",
      question: "What value is the buyer being asked to trust?",
      answer:
        input.closeout.retainedValueYen > 0
          ? `${formatYen(input.closeout.retainedValueYen)}/month retained value against a ${formatYen(input.closeout.retainedValueTargetYen)}/month target.`
          : "Retained value is not yet stated.",
      evidence: retainedValueCheck?.evidence ?? "Retained value check missing.",
      owner: retainedValueCheck?.owner ?? "Finance owner",
      href: input.closeout.exportHref
    },
    {
      id: "receipt-chain",
      label: "Receipt chain",
      status: accepted && receiptCheck?.status === "ready" && repairCheck?.status === "ready" ? "ready" : input.acceptance.status,
      question: "Can the buyer independently verify the value proof?",
      answer: accepted
        ? `Yes. Verify ${input.acceptance.receipt.receiptId}, then inspect closeout ${input.closeout.receipt.receiptId} and repair acknowledgement ${input.repairAcknowledgement.receipt.receiptId}.`
        : "Not yet. The acceptance packet is still holding the review.",
      evidence: `${input.acceptance.receipt.receiptId} / ${input.acceptance.receipt.checksumAlgorithm}:${input.acceptance.receipt.checksum}`,
      owner: accepted ? "Buyer reviewer" : input.acceptance.nextOwner,
      href: input.acceptance.verifierHref
    },
    {
      id: "day-30-decision",
      label: "Day 30 decision",
      status: decisionCheck?.status ?? "blocked",
      question: "What decision is this proof supporting?",
      answer: input.closeout.decision === "missing" ? "No expand, revise, or stop decision is recorded yet." : `${input.closeout.decision} decision is recorded.`,
      evidence: decisionCheck?.evidence ?? "Decision check missing.",
      owner: decisionCheck?.owner ?? "Procurement owner",
      href: input.closeout.verifierHref
    },
    {
      id: "operating-conditions",
      label: "Operating conditions",
      status: accepted ? "ready" : input.acceptance.status,
      question: "What must stay true after the review?",
      answer: accepted
        ? "Keep the closeout receipt, repair acknowledgement, retained-value target, and Day 30 decision attached to the buyer record."
        : `Close the current hold first: ${input.acceptance.nextAction}`,
      evidence: `Evidence gaps ${input.closeout.repairQueue.evidenceGapCount}; source repairs ${input.closeout.repairQueue.sourceRepairCount}; acknowledgements ${input.repairAcknowledgement.acknowledgedCount}/${input.repairAcknowledgement.requiredAcknowledgementCount}.`,
      owner: accepted ? "Review owner" : input.acceptance.nextOwner,
      href: input.repairAcknowledgement.verifierHref
    }
  ];
  const readyCount = items.filter((item) => item.status === "ready").length;
  const totalCount = items.length;
  const confidenceScore = Math.round((readyCount / totalCount) * 100);
  const headline =
    decision === "review-expand"
      ? "Buyer can review expansion from verified value proof"
      : decision === "review-revise"
        ? "Buyer can review a revised rollout path"
        : decision === "review-stop"
          ? "Buyer can review a stop decision"
          : "Buyer review dossier is on hold";
  const summary = accepted
    ? `${readyCount}/${totalCount} buyer review questions are answered with receipt-backed evidence.`
    : `${readyCount}/${totalCount} buyer review questions are ready. Keep the value claim internal until the hold clears.`;
  const nextOwner = accepted ? "Buyer reviewer" : input.acceptance.nextOwner;
  const nextAction = accepted ? "Verify the acceptance receipt, then answer the review question." : input.acceptance.nextAction;
  const exportMarkdown = [
    "# Buyer value review dossier",
    "",
    `Buyer: ${input.acceptance.receipt.payload.buyer}`,
    `Status: ${status}`,
    `Decision: ${decision}`,
    `Confidence: ${confidenceScore}/100`,
    `Review question: ${reviewQuestion}`,
    `Buyer ask: ${buyerAsk}`,
    `Decision rule: ${decisionRule}`,
    `Acceptance receipt: ${input.acceptance.receipt.receiptId}`,
    `Acceptance checksum: ${input.acceptance.receipt.checksumAlgorithm}:${input.acceptance.receipt.checksum}`,
    `Verifier: ${input.acceptance.receipt.verificationApiPath}`,
    "",
    "## Summary",
    summary,
    "",
    "## Review questions",
    ...items.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.question} Answer: ${item.answer} Evidence: ${item.evidence}`),
    "",
    "## Next action",
    `${nextOwner}: ${nextAction}`
  ].join("\n");

  return {
    status,
    decision,
    headline,
    summary,
    reviewQuestion,
    buyerAsk,
    decisionRule,
    confidenceScore,
    readyCount,
    totalCount,
    nextOwner,
    nextAction,
    items,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

export function buildQuickValueReviewExecutionPacket(input: {
  closeout: QuickValueRealizationCloseout;
  acceptance: QuickValueRealizationAcceptancePacket;
  dossier: QuickValueRealizationBuyerReviewDossier;
}): QuickValueReviewExecutionPacket {
  const canExecute = input.dossier.status === "ready" && input.dossier.decision !== "hold-review";
  const valueItem = input.dossier.items.find((item) => item.id === "value-claim");
  const receiptItem = input.dossier.items.find((item) => item.id === "receipt-chain");
  const decisionItem = input.dossier.items.find((item) => item.id === "day-30-decision");
  const operatingItem = input.dossier.items.find((item) => item.id === "operating-conditions");
  const decision: QuickValueReviewExecutionDecision =
    input.dossier.decision === "review-expand"
      ? "expand-rollout"
      : input.dossier.decision === "review-revise"
        ? "revise-rollout"
        : input.dossier.decision === "review-stop"
          ? "stop-rollout"
          : "hold-review";
  const status: QuickBuyerRoomPreviewStatus = canExecute ? "ready" : input.dossier.status;
  const decisionCommand =
    decision === "expand-rollout"
      ? "Record expansion approval, attach the value dossier, and open the rollout command board."
      : decision === "revise-rollout"
        ? "Record the revised rollout scope, attach the value dossier, and reject any expansion ask outside the revised scope."
        : decision === "stop-rollout"
          ? "Record the stop decision, archive the value proof, and close the rollout queue."
          : `Hold execution until ${input.dossier.nextOwner} completes: ${input.dossier.nextAction}`;
  const nextOwner = canExecute ? "Execution owner" : input.dossier.nextOwner;
  const nextAction = canExecute ? decisionCommand : input.dossier.nextAction;
  const holdStatus: QuickBuyerRoomPreviewStatus = input.dossier.status === "watch" ? "watch" : "blocked";
  const taskStatus = canExecute ? "ready" : holdStatus;
  const tasks: QuickValueReviewExecutionPacketTask[] = [
    {
      id: "verify-acceptance-receipt",
      label: "Verify accepted value proof",
      status: canExecute && receiptItem?.status === "ready" ? "ready" : taskStatus,
      owner: "Buyer reviewer",
      dueWindow: "Before the decision is recorded",
      command: canExecute ? `Verify ${input.acceptance.receipt.receiptId} and attach the verifier result to the decision record.` : "Keep the review internal until the acceptance verifier is ready.",
      evidence: receiptItem?.evidence ?? `${input.acceptance.receipt.receiptId} / ${input.acceptance.receipt.checksumAlgorithm}:${input.acceptance.receipt.checksum}`,
      acceptance: "Receipt verifier returns HTTP 200 and the receipt id appears in the decision record."
    },
    {
      id: "record-review-decision",
      label: "Record review decision",
      status: canExecute && decisionItem?.status === "ready" ? "ready" : taskStatus,
      owner: "Procurement owner",
      dueWindow: "Decision meeting",
      command: decisionCommand,
      evidence: decisionItem?.evidence ?? input.dossier.reviewQuestion,
      acceptance: "Decision record names expand, revise, or stop and includes the source acceptance receipt."
    },
    {
      id: "assign-operating-owner",
      label: "Assign operating owner",
      status: taskStatus,
      owner: "Platform sponsor",
      dueWindow: "Within 1 business day",
      command: canExecute
        ? "Assign the named owner for the next operating window and keep the closeout receipt attached."
        : "Do not assign downstream work until the review dossier is ready.",
      evidence: operatingItem?.evidence ?? input.dossier.decisionRule,
      acceptance: "Owner accepts the next operating window, proof source, and escalation rule."
    },
    {
      id: "schedule-value-recheck",
      label: "Schedule value recheck",
      status: canExecute && valueItem?.status === "ready" ? "ready" : taskStatus,
      owner: "Finance owner",
      dueWindow: "Within 30 days of the decision",
      command:
        decision === "expand-rollout"
          ? "Schedule the next retained-value recheck before the expansion renewal ask."
          : decision === "revise-rollout"
            ? "Schedule a revised retained-value recheck against the new rollout scope."
            : decision === "stop-rollout"
              ? "Archive the retained-value result and stop rule as the closure benchmark."
              : "Wait for accepted retained-value proof before scheduling a recheck.",
      evidence: valueItem?.evidence ?? input.acceptance.buyerClaim,
      acceptance: "Calendar entry names retained value, target, owner, and receipt source."
    },
    {
      id: "publish-executive-brief",
      label: "Publish executive brief",
      status: taskStatus,
      owner: "Sponsor owner",
      dueWindow: "Same day as the decision",
      command: canExecute
        ? "Publish a short executive brief with the buyer ask, decision rule, value claim, and verifier link."
        : "Hold the executive brief until the buyer review is ready.",
      evidence: input.dossier.buyerAsk,
      acceptance: "Brief contains the buyer ask, verifier link, decision rule, and next owner."
    }
  ];
  const readyTaskCount = tasks.filter((task) => task.status === "ready").length;
  const taskCount = tasks.length;
  const blockedTaskCount = tasks.filter((task) => task.status === "blocked").length;
  const guardrails = canExecute
    ? [
        "Do not change the buyer-facing value claim without re-exporting the acceptance receipt.",
        "Do not start expansion, revision, or stop work unless the execution receipt verifies.",
        "Keep the Day 30 decision, closeout receipt, and next value recheck attached to the same buyer record."
      ]
    : [
        "Do not assign post-review work while the value proof is on hold.",
        "Do not publish an executive brief until the acceptance packet verifies.",
        "Do not ask the buyer for expansion, revision, or stop approval until the dossier is ready."
      ];
  const payload: QuickValueReviewExecutionPayload = {
    receiptVersion: QUICK_VALUE_REVIEW_EXECUTION_RECEIPT_VERSION,
    status,
    decision,
    buyer: input.acceptance.receipt.payload.buyer,
    sourceReviewDecision: input.dossier.decision,
    sourceAcceptanceReceiptId: input.acceptance.receipt.receiptId,
    sourceAcceptanceChecksum: `${input.acceptance.receipt.checksumAlgorithm}:${input.acceptance.receipt.checksum}`,
    sourceCloseoutReceiptId: input.closeout.receipt.receiptId,
    sourceCloseoutChecksum: `${input.closeout.receipt.checksumAlgorithm}:${input.closeout.receipt.checksum}`,
    retainedValueYen: input.closeout.retainedValueYen,
    retainedValueTargetYen: input.closeout.retainedValueTargetYen,
    reviewQuestion: input.dossier.reviewQuestion,
    buyerAsk: input.dossier.buyerAsk,
    readyTaskCount,
    taskCount,
    blockedTaskCount,
    nextOwner,
    nextAction,
    guardrails,
    tasks
  };
  const checksum = quickValueReviewExecutionChecksum(payload);
  const verificationRequest = { checksum, payload };
  const verificationRequestJson = quickValueReviewExecutionRequestJson(verificationRequest);
  const verification = verifyQuickValueReviewExecutionReceipt(verificationRequest);
  const receipt = {
    receiptId: `quick-value-review-execution-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    verificationApiPath: QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH as typeof QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH,
    payload,
    payloadJson: quickValueReviewExecutionPayloadJson(payload),
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification,
    generatedFrom: ["buyer-value-review-dossier", "value-realization-acceptance", "value-realization-closeout"]
  };
  const headline = canExecute
    ? decision === "expand-rollout"
      ? "Expansion execution packet is ready"
      : decision === "revise-rollout"
        ? "Revision execution packet is ready"
        : "Stop execution packet is ready"
    : "Post-review execution is on hold";
  const summary = canExecute
    ? `${readyTaskCount}/${taskCount} execution tasks have owners, due windows, evidence, and acceptance checks.`
    : `${nextOwner} must complete the review hold before downstream work starts.`;
  const exportMarkdown = [
    "# Value review execution packet",
    "",
    `Buyer: ${payload.buyer}`,
    `Status: ${status}`,
    `Decision: ${decision}`,
    `Source review decision: ${payload.sourceReviewDecision}`,
    `Ready tasks: ${readyTaskCount}/${taskCount}`,
    `Blocked tasks: ${blockedTaskCount}`,
    `Acceptance receipt: ${payload.sourceAcceptanceReceiptId}`,
    `Acceptance checksum: ${payload.sourceAcceptanceChecksum}`,
    `Closeout receipt: ${payload.sourceCloseoutReceiptId}`,
    `Closeout checksum: ${payload.sourceCloseoutChecksum}`,
    `Execution receipt: ${receipt.receiptId}`,
    `Execution checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `API verification: POST ${receipt.verificationApiPath}`,
    "",
    "## Buyer ask",
    payload.buyerAsk,
    "",
    "## Next action",
    `${nextOwner}: ${nextAction}`,
    "",
    "## Guardrails",
    ...guardrails.map((guardrail) => `- ${guardrail}`),
    "",
    "## Execution tasks",
    ...tasks.map((task) => `- [${task.status}] ${task.label} (${task.owner}, ${task.dueWindow}): ${task.command} Evidence: ${task.evidence} Acceptance: ${task.acceptance}`),
    "",
    "## Verify request",
    "```json",
    receipt.verificationRequestJson,
    "```"
  ].join("\n");

  return {
    status,
    decision,
    headline,
    summary,
    readyTaskCount,
    taskCount,
    blockedTaskCount,
    nextOwner,
    nextAction,
    guardrails,
    tasks,
    receipt,
    receiptHref: receipt.verificationRequestHref,
    verifierHref: receiptVerifierPrefillHref(receipt.verificationRequestJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

export function buildQuickValueReviewExecutionCloseout(input: {
  executionPacket: QuickValueReviewExecutionPacket;
  evidenceText: string;
}): QuickValueReviewExecutionCloseout {
  const rawEvidence = input.evidenceText.trim();
  const text = normalizedEvidenceText(rawEvidence);
  const sourceExecutionReady = input.executionPacket.status === "ready" && input.executionPacket.receipt.verification.status === "verified";
  const sourceAcceptanceReceipt = input.executionPacket.receipt.payload.sourceAcceptanceReceiptId.toLowerCase();
  const executionDecision = input.executionPacket.decision.replace("-", " ");
  const signalGroupsByTask: Record<string, Array<{ label: string; patterns: Array<string | RegExp> }>> = {
    "verify-acceptance-receipt": [
      { label: "acceptance receipt verified", patterns: [sourceAcceptanceReceipt, "acceptance receipt", "accepted value proof"] },
      { label: "verifier result attached", patterns: ["verifier", "verified", "http 200"] }
    ],
    "record-review-decision": [
      { label: "decision recorded", patterns: ["decision recorded", "recorded decision", "approval recorded", "approved", "stopped", "revised"] },
      { label: "execution decision named", patterns: [executionDecision, input.executionPacket.decision, "expand", "revise", "stop"] },
      { label: "source acceptance attached", patterns: [sourceAcceptanceReceipt, "acceptance receipt"] }
    ],
    "assign-operating-owner": [
      { label: "operating owner accepted", patterns: ["operating owner", "owner accepted", "owner assigned", "platform sponsor"] },
      { label: "operating window named", patterns: ["operating window", "next window", "within 1 business day", "business day"] }
    ],
    "schedule-value-recheck": [
      { label: "value recheck scheduled", patterns: ["value recheck", "recheck scheduled", "calendar", "scheduled"] },
      { label: "retained value target named", patterns: ["retained value", "target", "finance", /¥\s*[\d,]+/] }
    ],
    "publish-executive-brief": [
      { label: "executive brief published", patterns: ["executive brief", "brief published", "published brief", "published"] },
      { label: "buyer ask and verifier included", patterns: ["buyer ask", "verifier link", "decision rule", "next owner"] }
    ]
  };
  const tasks: QuickValueReviewExecutionCloseoutTask[] = input.executionPacket.tasks.map((task) => {
    const signalGroups = signalGroupsByTask[task.id] ?? [];
    const matchedSignals = signalGroups.map((group) => signalResult(text, group.label, group.patterns)).filter(Boolean);
    const missingSignals = sourceExecutionReady && task.status === "ready" ? signalGroups.filter((group) => !evidenceHasAny(text, group.patterns)).map((group) => group.label) : ["source execution packet must be ready"];
    const status: QuickBuyerRoomPreviewStatus =
      !sourceExecutionReady || task.status !== "ready" ? "blocked" : missingSignals.length === 0 ? "ready" : "watch";

    return {
      id: task.id,
      label: task.label,
      status,
      owner: task.owner,
      dueWindow: task.dueWindow,
      command: task.command,
      matchedSignals,
      missingSignals,
      evidence: rawEvidence || "No execution completion evidence pasted.",
      acceptance: task.acceptance
    };
  });
  const readyTaskCount = tasks.filter((task) => task.status === "ready").length;
  const taskCount = tasks.length;
  const blockedTaskCount = tasks.filter((task) => task.status === "blocked").length;
  const status: QuickBuyerRoomPreviewStatus = !sourceExecutionReady ? "blocked" : readyTaskCount === taskCount ? "ready" : "watch";
  const decision: QuickValueReviewExecutionCloseoutDecision = status === "ready" ? "accept-execution-closeout" : "hold-execution-closeout";
  const firstOpenTask = tasks.find((task) => task.status !== "ready");
  const nextOwner = status === "ready" ? "Ready" : (firstOpenTask?.owner ?? input.executionPacket.nextOwner);
  const nextAction =
    status === "ready"
      ? "Attach this execution closeout receipt to the buyer record and start the next retained-value recheck window."
      : !sourceExecutionReady
        ? "Move the value review execution packet to ready before closing execution."
        : `Close ${firstOpenTask?.label ?? "execution evidence"} evidence: ${firstOpenTask?.missingSignals.join(", ") || "missing completion signal"}.`;
  const evidenceSummary = rawEvidence
    ? rawEvidence
        .split(/\s+/)
        .slice(0, 42)
        .join(" ")
    : "No execution completion evidence pasted.";
  const payload: QuickValueReviewExecutionCloseoutPayload = {
    receiptVersion: QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_RECEIPT_VERSION,
    status,
    decision,
    buyer: input.executionPacket.receipt.payload.buyer,
    executionDecision: input.executionPacket.decision,
    sourceExecutionReceiptId: input.executionPacket.receipt.receiptId,
    sourceExecutionChecksum: `${input.executionPacket.receipt.checksumAlgorithm}:${input.executionPacket.receipt.checksum}`,
    sourceAcceptanceReceiptId: input.executionPacket.receipt.payload.sourceAcceptanceReceiptId,
    sourceCloseoutReceiptId: input.executionPacket.receipt.payload.sourceCloseoutReceiptId,
    readyTaskCount,
    taskCount,
    blockedTaskCount,
    nextOwner,
    nextAction,
    evidenceSummary,
    tasks
  };
  const checksum = quickValueReviewExecutionCloseoutChecksum(payload);
  const verificationRequest = { checksum, payload };
  const verificationRequestJson = quickValueReviewExecutionCloseoutRequestJson(verificationRequest);
  const verification = verifyQuickValueReviewExecutionCloseoutReceipt(verificationRequest);
  const receipt = {
    receiptId: `quick-value-review-execution-closeout-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    verificationApiPath: QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH as typeof QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH,
    payload,
    payloadJson: quickValueReviewExecutionCloseoutPayloadJson(payload),
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification,
    generatedFrom: ["value-review-execution-packet", "execution-completion-evidence", "buyer-value-record"]
  };
  const headline =
    status === "ready"
      ? "Execution closeout is accepted"
      : status === "blocked"
        ? "Execution closeout is blocked"
        : "Execution closeout needs completion evidence";
  const summary =
    status === "ready"
      ? `${readyTaskCount}/${taskCount} execution tasks are closed with evidence and verifier-backed receipts.`
      : `${readyTaskCount}/${taskCount} execution tasks are closed. ${nextOwner} must ${nextAction.toLowerCase()}`;
  const exportMarkdown = [
    "# Value review execution closeout",
    "",
    `Buyer: ${payload.buyer}`,
    `Status: ${status}`,
    `Decision: ${decision}`,
    `Execution decision: ${payload.executionDecision}`,
    `Closed tasks: ${readyTaskCount}/${taskCount}`,
    `Blocked tasks: ${blockedTaskCount}`,
    `Execution receipt: ${payload.sourceExecutionReceiptId}`,
    `Execution checksum: ${payload.sourceExecutionChecksum}`,
    `Acceptance receipt: ${payload.sourceAcceptanceReceiptId}`,
    `Closeout receipt: ${payload.sourceCloseoutReceiptId}`,
    `Closeout verification receipt: ${receipt.receiptId}`,
    `Closeout checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `API verification: POST ${receipt.verificationApiPath}`,
    "",
    "## Evidence summary",
    evidenceSummary,
    "",
    "## Next action",
    `${nextOwner}: ${nextAction}`,
    "",
    "## Task outcomes",
    ...tasks.map(
      (task) =>
        `- [${task.status}] ${task.label} (${task.owner}, ${task.dueWindow}): matched ${task.matchedSignals.join(", ") || "none"}; missing ${task.missingSignals.join(", ") || "none"}. Acceptance: ${task.acceptance}`
    ),
    "",
    "## Verify request",
    "```json",
    receipt.verificationRequestJson,
    "```"
  ].join("\n");

  return {
    status,
    decision,
    headline,
    summary,
    readyTaskCount,
    taskCount,
    blockedTaskCount,
    nextOwner,
    nextAction,
    evidenceSummary,
    tasks,
    receipt,
    receiptHref: receipt.verificationRequestHref,
    verifierHref: receiptVerifierPrefillHref(receipt.verificationRequestJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

export function buildQuickValueRealizationCloseout(input: {
  preview: QuickBuyerRoomPreview;
  commitment: QuickBuyerDecisionSuccessCommitment;
  evidenceText: string;
}): QuickValueRealizationCloseout {
  const ledger = input.commitment.valueRealizationLedger;
  const rawEvidence = input.evidenceText.trim();
  const text = normalizedEvidenceText(rawEvidence);
  const task = (id: QuickBuyerDecisionValueRealizationTask["id"]) => ledger.tasks.find((item) => item.id === id);
  const sourceLedgerChecksum = `${ledger.receipt.checksumAlgorithm}:${ledger.receipt.checksum}`;
  const retainedValueTargetYen = input.preview.adoptionSuccessPlan.retainedMonthlyValueYen;
  const retainedValueYen = Math.max(0, ...extractYenAmounts(rawEvidence));
  const decision = closeoutDecisionFromEvidence(text);
  const hasPublicProof = evidenceHasAny(text, [/https?:\/\//i, ledger.receipt.receiptId.toLowerCase(), input.commitment.sourceReceiptId.toLowerCase()]);
  const buyerSignal = input.preview.buyer.trim().toLowerCase();
  const baselineSignals = [
    signalResult(text, "baseline or owner named", ["baseline", "owner", ...(buyerSignal ? [buyerSignal] : [])]),
    signalResult(text, "metric or review cadence named", ["metric", "review date", "review cadence", "day 0"]),
    signalResult(text, "proof packet or stop rule named", ["proof", "receipt", "stop rule", "ledger"])
  ].filter(Boolean);
  const repeatSignals = [
    signalResult(text, "repeat usage stated", ["repeat", "repeated", "day 7", "second run", "weekly"]),
    signalResult(text, "accepted use stated", ["accepted", "acceptance", "task rate", "active use"]),
    signalResult(text, "run evidence attached", [/https?:\/\//i, "pilot receipt", "usage receipt", "a2a"])
  ].filter(Boolean);
  const valueSignals = [
    retainedValueTargetYen > 0 && retainedValueYen >= retainedValueTargetYen ? "retained value meets target" : "",
    signalResult(text, "finance or retained value stated", ["finance", "retained", "value", "day 14"]),
    signalResult(text, "currency evidence attached", [/¥\s*[\d,]+/, /[\d,]+\s*(?:yen|円|jpy)/i])
  ].filter(Boolean);
  const decisionSignals = [
    decision !== "missing" ? `${decision} decision stated` : "",
    signalResult(text, "proof freshness stated", ["proof", "fresh", "verified", "live proof", "day 30"]),
    hasPublicProof ? "closeout proof attached" : ""
  ].filter(Boolean);
  const sourceTasks = {
    baseline: task("baseline-lock"),
    repeat: task("repeat-usage"),
    value: task("value-retention"),
    decision: task("expand-stop")
  };
  const sourceTaskById: QuickValueRealizationSourceTaskMap = {
    "baseline-lock": sourceTasks.baseline,
    "repeat-usage": sourceTasks.repeat,
    "value-retention": sourceTasks.value,
    "expand-stop": sourceTasks.decision
  };
  const tasks: QuickValueRealizationCloseoutTask[] = [
    {
      id: "baseline-lock",
      window: "Day 0",
      label: "Baseline closeout",
      status: closeoutEvidenceStatus(sourceTasks.baseline?.status ?? "blocked", baselineSignals, 3),
      owner: sourceTasks.baseline?.owner ?? input.preview.buyer,
      outcome:
        sourceTasks.baseline?.status === "blocked" && baselineSignals.length >= 3
          ? "Evidence matches, but the source ledger baseline is blocked; repair the ledger before closeout can pass."
          : sourceTasks.baseline?.status === "watch" && baselineSignals.length >= 3
            ? "Evidence matches, but the source ledger baseline still needs owner review."
            :
        baselineSignals.length >= 3
          ? "Operating baseline, metric, proof packet, and stop rule are present."
          : "Closeout needs owner baseline, metric cadence, proof packet, and stop rule evidence.",
      matchedSignals: baselineSignals,
      missingSignals: ["baseline or owner named", "metric or review cadence named", "proof packet or stop rule named"].filter((signal) => !baselineSignals.includes(signal)),
      evidence: sourceTasks.baseline?.closeCriteria ?? "Owner can name the metric, proof packet, stop rule, and next review date.",
      href: sourceTasks.baseline?.href ?? ledger.exportHref
    },
    {
      id: "repeat-usage",
      window: "Day 7",
      label: "Usage closeout",
      status: closeoutEvidenceStatus(sourceTasks.repeat?.status ?? "blocked", repeatSignals, 3),
      owner: sourceTasks.repeat?.owner ?? input.preview.buyer,
      outcome:
        sourceTasks.repeat?.status === "blocked" && repeatSignals.length >= 3
          ? "Evidence matches, but the source usage ledger is blocked; repair the ledger before closeout can pass."
          : sourceTasks.repeat?.status === "watch" && repeatSignals.length >= 3
            ? "Evidence matches, but the source usage ledger still needs owner review."
            :
        repeatSignals.length >= 3
          ? "Repeated accepted use is backed by run evidence."
          : "Closeout needs repeated-use, accepted-task, and run-proof evidence.",
      matchedSignals: repeatSignals,
      missingSignals: ["repeat usage stated", "accepted use stated", "run evidence attached"].filter((signal) => !repeatSignals.includes(signal)),
      evidence: sourceTasks.repeat?.closeCriteria ?? "Accepted task rate is measured.",
      href: sourceTasks.repeat?.href ?? ledger.exportHref
    },
    {
      id: "value-retention",
      window: "Day 14",
      label: "Value closeout",
      status: closeoutEvidenceStatus(sourceTasks.value?.status ?? "blocked", valueSignals, closeoutRequiredSignalCount("value-retention", retainedValueTargetYen)),
      owner: sourceTasks.value?.owner ?? "Finance owner",
      outcome:
        sourceTasks.value?.status === "blocked" && valueSignals.length >= closeoutRequiredSignalCount("value-retention", retainedValueTargetYen)
          ? "Evidence matches, but the source value ledger is blocked; repair the ledger before closeout can pass."
          : sourceTasks.value?.status === "watch" && valueSignals.length >= closeoutRequiredSignalCount("value-retention", retainedValueTargetYen)
            ? "Evidence matches, but the source value ledger still needs owner review."
            :
        retainedValueTargetYen > 0 && retainedValueYen >= retainedValueTargetYen
          ? `${formatYen(retainedValueYen)}/month clears the ${formatYen(retainedValueTargetYen)}/month retained-value target.`
          : retainedValueTargetYen > 0
            ? `Retained value evidence is below or missing the ${formatYen(retainedValueTargetYen)}/month target.`
            : "Closeout needs a retained monthly value target before finance can sign off.",
      matchedSignals: valueSignals,
      missingSignals: ["retained value meets target", "finance or retained value stated", "currency evidence attached"].filter((signal) => !valueSignals.includes(signal)),
      evidence: sourceTasks.value?.closeCriteria ?? "Monthly retained value is measurable.",
      href: sourceTasks.value?.href ?? ledger.exportHref
    },
    {
      id: "expand-stop",
      window: "Day 30",
      label: "Decision closeout",
      status: closeoutEvidenceStatus(sourceTasks.decision?.status ?? "blocked", decisionSignals, 3),
      owner: sourceTasks.decision?.owner ?? "Procurement owner",
      outcome:
        sourceTasks.decision?.status === "blocked" && decisionSignals.length >= 3
          ? "Evidence matches, but the source decision ledger is blocked; repair the ledger before closeout can pass."
          : sourceTasks.decision?.status === "watch" && decisionSignals.length >= 3
            ? "Evidence matches, but the source decision ledger still needs owner review."
            :
        decision !== "missing"
          ? `The Day 30 closeout records a ${decision} decision with current proof.`
          : "Closeout needs an expand, revise, or stop decision with current proof.",
      matchedSignals: decisionSignals,
      missingSignals: ["expand/revise/stop decision stated", "proof freshness stated", "closeout proof attached"].filter((signal) => {
        if (signal === "expand/revise/stop decision stated") return decision === "missing";
        if (signal === "closeout proof attached") return !hasPublicProof;
        return !decisionSignals.includes(signal);
      }),
      evidence: sourceTasks.decision?.closeCriteria ?? "Expansion is approved only if value, proof, trust boundary, and owners remain current.",
      href: sourceTasks.decision?.href ?? ledger.exportHref
    }
  ];
  const status = rawEvidence ? mergedPreviewStatus(...tasks.map((item) => item.status)) : "blocked";
  const completedCount = tasks.filter((item) => item.status === "ready").length;
  const blockedCount = tasks.filter((item) => item.status === "blocked").length;
  const next = tasks.find((item) => item.status !== "ready") ?? tasks[0];
  const headline =
    status === "ready"
      ? "Value closeout is buyer-verifiable"
      : status === "watch"
        ? "Value closeout needs evidence review"
        : "Value closeout is missing operating evidence";
  const summary =
    status === "ready"
      ? `${input.preview.buyer} can inspect completed Day 0/7/14/30 outcomes, retained value, and the ${decision} decision.`
      : rawEvidence
        ? `${completedCount}/4 closeout tasks verified. Next: ${next.owner} must close ${next.label.toLowerCase()}.`
        : "Paste Day 0/7/14/30 operating evidence to prove the ledger was completed before claiming expansion value.";
  const nextAction = next.status === "ready" ? "Ready" : next.outcome;
  const repairQueue = buildQuickValueRealizationCloseoutRepairQueue({
    buyer: input.preview.buyer,
    sourceLedgerReceiptId: ledger.receipt.receiptId,
    sourceLedgerChecksum,
    retainedValueTargetYen,
    tasks,
    sourceTasks: sourceTaskById
  });
  const repairQueuePayload: QuickValueRealizationCloseoutRepairQueuePayload = {
    status: repairQueue.status,
    headline: repairQueue.headline,
    summary: repairQueue.summary,
    itemCount: repairQueue.itemCount,
    sourceRepairCount: repairQueue.sourceRepairCount,
    evidenceGapCount: repairQueue.evidenceGapCount,
    nextOwner: repairQueue.nextOwner,
    nextAction: repairQueue.nextAction,
    items: repairQueue.items
  };
  const payload: QuickValueRealizationCloseoutPayload = {
    receiptVersion: QUICK_VALUE_REALIZATION_CLOSEOUT_RECEIPT_VERSION,
    status,
    buyer: input.preview.buyer,
    primaryAsk: input.preview.primaryAsk,
    completedCount,
    blockedCount,
    retainedValueYen,
    retainedValueTargetYen,
    decision,
    nextOwner: next.owner,
    nextAction,
    sourceLedgerReceiptId: ledger.receipt.receiptId,
    sourceLedgerChecksum,
    closeoutEvidence: rawEvidence || "No closeout evidence pasted.",
    repairQueue: repairQueuePayload,
    tasks: tasks.map((item) => ({
      id: item.id,
      window: item.window,
      label: item.label,
      status: item.status,
      owner: item.owner,
      outcome: item.outcome,
      matchedSignals: item.matchedSignals,
      missingSignals: item.missingSignals,
      evidence: item.evidence,
      href: item.href
    }))
  };
  const checksum = quickValueRealizationCloseoutChecksum(payload);
  const verificationRequest = { checksum, payload };
  const verificationRequestJson = quickValueRealizationCloseoutVerificationRequestJson(verificationRequest);
  const verification = verifyQuickValueRealizationCloseoutReceipt(verificationRequest);
  const receipt = {
    receiptId: `quick-value-closeout-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32" as const,
    checksum,
    verificationApiPath: QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH as typeof QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH,
    payload,
    payloadJson: quickValueRealizationCloseoutPayloadJson(payload),
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification,
    generatedFrom: ["value-closeout-evidence", "value-realization-ledger", "buyer-success-commitment"]
  };
  const exportMarkdown = [
    "# Value realization closeout",
    "",
    `Buyer: ${input.preview.buyer}`,
    `Status: ${status}`,
    `Completed: ${completedCount}/4`,
    `Blocked: ${blockedCount}`,
    `Decision: ${decision}`,
    `Retained value target: ${retainedValueTargetYen > 0 ? `${formatYen(retainedValueTargetYen)}/month` : "not ready"}`,
    `Retained value evidence: ${retainedValueYen > 0 ? `${formatYen(retainedValueYen)}/month` : "missing"}`,
    `Source ledger: ${ledger.receipt.receiptId}`,
    `Source ledger checksum: ${sourceLedgerChecksum}`,
    `Closeout receipt: ${receipt.receiptId}`,
    `Closeout checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `API verification: POST ${receipt.verificationApiPath}`,
    "",
    summary,
    "",
    "## Closeout tasks",
    ...tasks.map(
      (item) =>
        `- [${item.status}] ${item.window} ${item.label} (${item.owner}): ${item.outcome} Matched: ${item.matchedSignals.join(", ") || "none"}. Missing: ${item.missingSignals.join(", ") || "none"}.`
    ),
    "",
    "## Repair queue",
    `Queue status: ${repairQueue.status}`,
    `Items: ${repairQueue.itemCount}`,
    `Source ledger repairs: ${repairQueue.sourceRepairCount}`,
    `Evidence gaps: ${repairQueue.evidenceGapCount}`,
    `Next owner: ${repairQueue.nextOwner}`,
    `Next action: ${repairQueue.nextAction}`,
    ...repairQueue.items.map(
      (item) =>
        `- [${item.status}] ${item.label} (${item.owner}): ${item.action} Proof: ${item.proof} Acceptance: ${item.acceptance}`
    ),
    "",
    "## Evidence note",
    rawEvidence || "No closeout evidence pasted.",
    "",
    "## Verify request",
    "```json",
    receipt.verificationRequestJson,
    "```"
  ].join("\n");

  return {
    status,
    headline,
    summary,
    completedCount,
    blockedCount,
    retainedValueYen,
    retainedValueTargetYen,
    decision,
    nextOwner: next.owner,
    nextAction,
    sourceLedgerReceiptId: ledger.receipt.receiptId,
    sourceLedgerChecksum,
    tasks,
    repairQueue,
    receipt,
    receiptHref: receipt.verificationRequestHref,
    verifierHref: receiptVerifierPrefillHref(receipt.verificationRequestJson),
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

export function buildQuickBuyerDecisionSuccessCommitment(
  preview: QuickBuyerRoomPreview,
  onePager = buildQuickBuyerDecisionOnePager(preview)
): QuickBuyerDecisionSuccessCommitment {
  const plan = preview.adoptionSuccessPlan;
  const workflow = preview.rows.find((row) => row.id === "scope")?.value || preview.primaryAsk;
  const firstOpenMetric = plan.metrics.find((metric) => metric.status !== "ready");
  const day30 = plan.checkpoints.find((checkpoint) => checkpoint.id === "day-30");
  const retainedValueLine =
    plan.retainedMonthlyValueYen > 0 ? `${formatYen(plan.retainedMonthlyValueYen)}/month retained floor` : "Retained value not measurable yet";
  const adoptionTargetLine = plan.adoptionTargetPercent > 0 ? `${plan.adoptionTargetPercent}% adoption target` : "Adoption target not set";
  const sourceChecksum = `${onePager.receipt.checksumAlgorithm}:${onePager.receipt.checksum}`;
  const items = plan.metrics.map((metric) => ({
    id: metric.id,
    label: metric.label,
    status: metric.status,
    owner: metric.owner,
    target: metric.target,
    evidence: metric.evidence,
    action: metric.action
  }));
  const valueRealizationLedger = buildQuickBuyerDecisionValueRealizationLedger({
    preview,
    plan,
    workflow,
    onePager,
    sourceChecksum
  });
  const headline =
    plan.status === "ready"
      ? "Day 30 success standard is buyer-ready"
      : plan.status === "watch"
        ? "Day 30 success standard needs owner review"
        : "Day 30 success standard is blocked";
  const summary =
    plan.status === "ready"
      ? `${preview.buyer} can judge expansion by retained value, repeat usage, proof freshness, named owners, and trust boundary.`
      : firstOpenMetric
        ? `Hold renewal until ${firstOpenMetric.owner} closes ${firstOpenMetric.label.toLowerCase()}: ${firstOpenMetric.action}`
        : plan.summary;
  const exportMarkdown = [
    "# Buyer success commitment",
    "",
    `Buyer: ${preview.buyer}`,
    `Workflow: ${workflow}`,
    `Status: ${plan.status}`,
    `Review window: ${plan.reviewWindow}`,
    `Retained value: ${retainedValueLine}`,
    `Adoption target: ${adoptionTargetLine}`,
    `Renewal ask: ${plan.renewalAsk}`,
    `Source receipt: ${onePager.receipt.receiptId}`,
    `Source checksum: ${sourceChecksum}`,
    "",
    "## Commitment",
    summary,
    "",
    "## Success metrics",
    ...items.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.target} Evidence: ${item.evidence} Action: ${item.action}`),
    "",
    "## Day 30 checkpoint",
    day30
      ? `- [${day30.status}] ${day30.window} ${day30.label} (${day30.owner}): ${day30.objective} Exit: ${day30.exitCriteria} Evidence: ${day30.evidence}`
      : "- Day 30 checkpoint is not available.",
    "",
    "## Value realization ledger",
    `Ledger receipt: ${valueRealizationLedger.receipt.receiptId}`,
    `Ledger checksum: ${valueRealizationLedger.receipt.checksumAlgorithm}:${valueRealizationLedger.receipt.checksum}`,
    ...valueRealizationLedger.tasks.map(
      (task) =>
        `- [${task.status}] ${task.window} ${task.label} (${task.owner}): ${task.action} Close: ${task.closeCriteria} Evidence: ${task.evidence} Proof: ${task.proof}`
    ),
    "",
    "## Expansion criteria",
    ...plan.expansionCriteria.map((criterion) => `- ${criterion}`)
  ].join("\n");

  return {
    status: plan.status,
    label: decisionSuccessCommitmentLabel(plan.status),
    headline,
    summary,
    reviewWindow: plan.reviewWindow,
    retainedValueLine,
    adoptionTargetLine,
    renewalAsk: plan.renewalAsk,
    sourceReceiptId: onePager.receipt.receiptId,
    sourceChecksum,
    items,
    valueRealizationLedger,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function launchPacketLink(id: QuickAppliedLaunchPacketLink["id"], label: string, role: string, href?: string): QuickAppliedLaunchPacketLink | null {
  const trimmed = href?.trim() ?? "";
  return trimmed ? { id, label, role, href: trimmed } : null;
}

function launchPacketLabel(status: QuickBuyerRoomPreviewStatus) {
  if (status === "ready") return "Send-ready packet";
  if (status === "watch") return "Sponsor-review packet";
  return "Internal repair packet";
}

function buildQuickAppliedSendDesk(preview: QuickBuyerRoomPreview, packetLinks: QuickAppliedLaunchPacketLink[]): QuickAppliedSendDesk {
  const row = (id: QuickBuyerRoomPreviewRow["id"]) => preview.rows.find((item) => item.id === id);
  const link = (id: QuickAppliedLaunchPacketLink["id"]) => packetLinks.find((item) => item.id === id);
  const proofRow = row("proof");
  const pilotRow = row("pilot");
  const valueRow = row("value");
  const scopeRow = row("scope");
  const dataRow = row("data");
  const a2aRow = row("a2a");
  const nextProofRepair = preview.proofRepairPlan.items.find((item) => item.status !== "ready");
  const reviewerRoute = preview.pilotWeekPlan.find((step) => step.id === "decide");
  const operatorRoute = preview.pilotWeekPlan.find((step) => step.id === "trial");
  const routeProofStatus = mergedPreviewStatus(proofRow?.status ?? "blocked", dataRow?.status ?? "blocked", a2aRow?.status ?? "blocked");
  const measuredValueStatus = mergedPreviewStatus(valueRow?.status ?? "blocked", pilotRow?.status ?? "blocked");

  return {
    headline:
      preview.status === "ready"
        ? "Buyer send desk is ready"
        : preview.status === "watch"
          ? "Buyer send desk needs owner review"
          : "Buyer send desk is internal only",
    summary:
      preview.status === "ready"
        ? `${preview.buyer} can open the launch room, inspect proof, and answer continue, revise, or stop.`
        : `${preview.buyer} should not receive a broad external link until the listed owner action is closed.`,
    metrics: [
      {
        id: "decision",
        label: "Decision",
        value: preview.decisionCase.decisionLabel,
        detail: preview.decisionCase.answer,
        status: preview.status
      },
      {
        id: "proof",
        label: "Proof",
        value: preview.handoffBrief.proofSummary,
        detail: nextProofRepair ? nextProofRepair.action : "All public proof slots are attached before live recheck.",
        status: proofRow?.status ?? "blocked"
      },
      {
        id: "pilot",
        label: "Pilot",
        value: pilotRow?.value ?? "Measured pilot missing",
        detail: pilotRow?.proof ?? "Attach measured run reviewer evidence.",
        status: pilotRow?.status ?? "blocked"
      }
    ],
    routes: [
      {
        id: "buyer",
        label: "Buyer sponsor",
        owner: preview.buyer,
        action: "Open launch room and answer continue, revise, or stop.",
        proof: preview.closeRule,
        status: preview.status,
        href: link("launch-room")?.href
      },
      {
        id: "reviewer",
        label: "External reviewer",
        owner: reviewerRoute?.owner ?? preview.handoffBrief.nextAction.owner,
        action: "Inspect review kit, proof packet, trust boundary, and approval path.",
        proof: preview.objectionBrief.summary,
        status: routeProofStatus,
        href: link("review-kit")?.href
      },
      {
        id: "proof-owner",
        label: "Proof owner",
        owner: nextProofRepair?.owner ?? "Proof owner",
        action: nextProofRepair?.action ?? "Run the final live proof check and keep the manifest attached.",
        proof: proofRow?.value ?? preview.handoffBrief.proofSummary,
        status: proofRow?.status ?? "blocked",
        href: link("trust-manifest")?.href
      },
      {
        id: "operator",
        label: "Pilot operator",
        owner: operatorRoute?.owner ?? "Pilot operator",
        action: operatorRoute?.action ?? "Keep the measured run receipt attached to the delivery memo.",
        proof: a2aRow?.value ?? pilotRow?.value ?? "Pilot run receipt",
        status: mergedPreviewStatus(pilotRow?.status ?? "blocked", a2aRow?.status ?? "blocked"),
        href: link("delivery-memo")?.href
      }
    ],
    checks: [
      {
        id: "buyer-ask",
        label: "Buyer ask is explicit",
        status: scopeRow?.status ?? "blocked",
        evidence: scopeRow?.proof ?? "Buyer workflow request missing.",
        action: scopeRow?.status === "ready" ? "Keep the buyer workflow unchanged through review." : "Name the buyer, workflow, and success metric."
      },
      {
        id: "measured-value",
        label: "Measured value is attached",
        status: measuredValueStatus,
        evidence: `${valueRow?.value ?? "Value model missing"} / ${pilotRow?.value ?? "Measured run missing"}`,
        action: measuredValueStatus === "ready" ? "Ask the buyer to validate the value case." : "Complete the value model and measured run evidence."
      },
      {
        id: "public-proof",
        label: "Public proof can be opened",
        status: proofRow?.status ?? "blocked",
        evidence: proofRow?.value ?? "Proof links missing.",
        action: nextProofRepair?.action ?? "Recheck public proof immediately before sending."
      },
      {
        id: "decision-record",
        label: "Decision record is ready",
        status: link("decision-receipt") ? preview.status : "watch",
        evidence: `Receipt ${preview.pilotWeekTaskPacket.receipt.receiptId}`,
        action: link("decision-receipt") ? "Record continue, revise, or stop from the same packet." : "Attach the decision receipt link before buyer review."
      }
    ]
  };
}

export function buildQuickAppliedLaunchPacket(
  preview: QuickBuyerRoomPreview,
  links: {
    launchRoomHref?: string;
    reviewKitHref?: string;
    acceptancePathHref?: string;
    decisionReceiptHref?: string;
    trustManifestHref?: string;
    deliveryMemoHref?: string;
  } = {}
): QuickAppliedLaunchPacket {
  const packetLinks = [
    launchPacketLink("launch-room", "Launch room", "Buyer-facing room", links.launchRoomHref),
    launchPacketLink("review-kit", "Review kit", "External reviewer packet", links.reviewKitHref),
    launchPacketLink("acceptance-path", "Acceptance path", "Approval path", links.acceptancePathHref),
    launchPacketLink("decision-receipt", "Decision receipt", "Continue/revise/stop record", links.decisionReceiptHref),
    launchPacketLink("trust-manifest", "Trust manifest", "Machine-readable proof manifest", links.trustManifestHref),
    launchPacketLink("delivery-memo", "Delivery memo", "Implementation handoff", links.deliveryMemoHref)
  ].filter((link): link is QuickAppliedLaunchPacketLink => Boolean(link));
  const sendDesk = buildQuickAppliedSendDesk(preview, packetLinks);
  const launchRoom = packetLinks.find((link) => link.id === "launch-room");
  const subject = `Buyer pilot room for ${preview.buyer}: ${launchPacketLabel(preview.status)}`;
  const repairSummary = preview.proofRepairPlan.repairCount > 0 ? ` Next: ${preview.proofRepairPlan.headline}.` : "";
  const summary =
    preview.status === "ready"
      ? "Workspace applied. Send the launch room after the final live proof check."
      : preview.status === "watch"
        ? `Workspace applied. Repair public proof before broad buyer sharing.${repairSummary}`
        : `Workspace applied. Keep this internal until proof repair is closed.${repairSummary}`;
  const messageLines = [
    subject,
    "",
    preview.handoffBrief.promise,
    `Buyer decision case: ${preview.decisionCase.decisionLabel}`,
    `Buyer question: ${preview.decisionCase.buyerQuestion}`,
    `Decision answer: ${preview.decisionCase.answer}`,
    `Decision ask: ${preview.primaryAsk}`,
    `Proof status: ${preview.handoffBrief.proofSummary}`,
    `Close rule: ${preview.closeRule}`,
    "",
    ...(launchRoom ? [`Launch room: ${launchRoom.href}`] : []),
    packetLinks.length > 1 ? "The launch packet also includes review kit, acceptance path, receipt, trust manifest, and delivery memo links." : "",
    "",
    "Send desk:",
    ...sendDesk.routes.map((route) => `- ${route.label} / ${route.owner}: ${route.action}`),
    "Acceptance checks:",
    ...sendDesk.checks.map((check) => `- [${check.status}] ${check.label}: ${check.action}`)
  ]
    .filter(Boolean)
    .join("\n");
  const previewText = [
    subject,
    "",
    preview.handoffBrief.promise,
    `Decision case: ${preview.decisionCase.decisionLabel}. ${preview.decisionCase.buyerQuestion}`,
    `Decision ask: ${preview.primaryAsk}`,
    `Proof status: ${preview.handoffBrief.proofSummary}`,
    `Close rule: ${preview.closeRule}`,
    "",
    launchRoom ? "Launch room: use the Launch room link in this packet." : "",
    packetLinks.length > 1 ? "Review kit, acceptance path, receipt, trust manifest, and delivery memo links are included above." : "",
    `Send desk: ${sendDesk.headline}. ${sendDesk.routes.length} routes and ${sendDesk.checks.length} checks are staged.`
  ]
    .filter(Boolean)
    .join("\n");
  const exportMarkdown = [
    `# ${subject}`,
    "",
    summary,
    "",
    "## Buyer message",
    messageLines,
    "",
    "## Buyer decision case",
    `Decision: ${preview.decisionCase.decisionLabel}`,
    `Question: ${preview.decisionCase.buyerQuestion}`,
    `Answer: ${preview.decisionCase.answer}`,
    `Value evidence: ${preview.decisionCase.valueEvidence}`,
    `Public proof: ${preview.decisionCase.proofEvidence}`,
    `Agent trust: ${preview.decisionCase.trustEvidence}`,
    `Data boundary: ${preview.decisionCase.dataBoundary}`,
    `Next action: ${preview.decisionCase.owner} - ${preview.decisionCase.nextAction}`,
    "",
    "## Send desk",
    sendDesk.headline,
    sendDesk.summary,
    "",
    "### Metrics",
    ...sendDesk.metrics.map((metric) => `- [${metric.status}] ${metric.label}: ${metric.value}. ${metric.detail}`),
    "",
    "### Stakeholder routes",
    ...sendDesk.routes.map((route) => `- [${route.status}] ${route.label} (${route.owner}): ${route.action} Proof: ${route.proof}${route.href ? ` Link: ${route.href}` : ""}`),
    "",
    "### Acceptance checks",
    ...sendDesk.checks.map((check) => `- [${check.status}] ${check.label}: ${check.action} Evidence: ${check.evidence}`),
    "",
    "## Links",
    ...packetLinks.map((link) => `- ${link.label}: ${link.href} - ${link.role}`),
    "",
    "## Preview receipt",
    `Receipt: ${preview.pilotWeekTaskPacket.receipt.receiptId}`,
    `Checksum: ${preview.pilotWeekTaskPacket.receipt.checksumAlgorithm}:${preview.pilotWeekTaskPacket.receipt.checksum}`
  ].join("\n");

  return {
    status: preview.status,
    label: launchPacketLabel(preview.status),
    headline: preview.status === "ready" ? "Applied workspace can be sent as a buyer room" : preview.status === "watch" ? "Applied workspace needs sponsor review first" : "Applied workspace stays internal",
    summary,
    subject,
    sendDesk,
    messageText: messageLines,
    previewText,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    links: packetLinks
  };
}

export function buildQuickLiveProofPendingMessage(packet: QuickAppliedLaunchPacket, audit: WorkflowLiveProofAudit) {
  return [
    packet.subject,
    "",
    "Hold buyer sharing until live proof verification passes.",
    packet.summary,
    "",
    "Live proof gate:",
    `Audit status: ${audit.headline}`,
    `Receipt: ${audit.receiptId}`,
    `Checksum: ${audit.checksumAlgorithm}:${audit.checksum}`,
    `Verified: ${audit.verifiedCount}/${audit.totalCount}`,
    `Score: ${audit.score}/100`,
    `Next action: ${audit.nextAction}`,
    "",
    "Acceptance checks:",
    ...packet.sendDesk.checks.map((check) => `- [${check.status}] ${check.label}: ${check.action}`)
  ].join("\n");
}

export function buildQuickLiveProofPendingExportMarkdown(packet: QuickAppliedLaunchPacket, audit: WorkflowLiveProofAudit) {
  return [
    `# ${packet.subject}`,
    "",
    "Hold buyer sharing until live proof verification passes.",
    "",
    "## Live proof gate",
    audit.headline,
    audit.summary,
    "",
    `Receipt: ${audit.receiptId}`,
    `Checksum: ${audit.checksumAlgorithm}:${audit.checksum}`,
    `Score: ${audit.score}/100`,
    `Verified: ${audit.verifiedCount}/${audit.totalCount}`,
    `Checked: ${audit.checkedAt || "not run"}`,
    "",
    "## Send desk",
    packet.sendDesk.headline,
    packet.sendDesk.summary,
    "",
    "### Acceptance checks",
    ...packet.sendDesk.checks.map((check) => `- [${check.status}] ${check.label}: ${check.action} Evidence: ${check.evidence}`),
    "",
    "## Links after live proof",
    ...packet.links.filter((link) => link.id !== "launch-room").map((link) => `- ${link.label}: ${link.href} - ${link.role}`),
    "",
    "## Next action",
    audit.nextAction
  ].join("\n");
}

export function buildQuickVerifiedLaunchRoomHref(baseHref: string, audit: WorkflowLiveProofAudit, nowMs = Date.now()) {
  const href = baseHref.trim();
  if (!quickLiveProofFreshness(audit, nowMs).isFresh) return "";
  if (!href) return "";
  try {
    const fallbackOrigin = "https://quick-workflow.local";
    const url = new URL(href, fallbackOrigin);
    url.searchParams.set("quickPacket", "verified");
    url.searchParams.set("quickAuditReceipt", audit.receiptId);
    url.searchParams.set("quickAuditChecksum", `${audit.checksumAlgorithm}:${audit.checksum}`);
    url.searchParams.set("quickAuditStatus", audit.status);
    url.searchParams.set("quickAuditCheckedAt", audit.checkedAt || "not-run");
    url.searchParams.set("quickAuditFreshUntil", quickLiveProofFreshness(audit, nowMs).expiresAt || "not-available");
    url.searchParams.set("quickAuditScore", String(audit.score));
    url.searchParams.set("quickAuditVerified", `${audit.verifiedCount}/${audit.totalCount}`);
    return href.startsWith("/") ? `${url.pathname}${url.search}${url.hash}` : url.toString();
  } catch {
    return href;
  }
}

export function buildQuickVerifiedLaunchMessage(packet: QuickAppliedLaunchPacket, audit: WorkflowLiveProofAudit, verifiedLaunchRoomHref = "") {
  return [
    packet.messageText,
    ...(verifiedLaunchRoomHref ? [`Verified launch room: ${verifiedLaunchRoomHref}`] : []),
    "",
    "Live proof audit:",
    `Receipt: ${audit.receiptId}`,
    `Checksum: ${audit.checksumAlgorithm}:${audit.checksum}`,
    `Status: ${audit.status}`,
    `Checked: ${audit.checkedAt || "not run"}`,
    `Verified: ${audit.verifiedCount}/${audit.totalCount}`,
    `Score: ${audit.score}/100`,
    `Next action: ${audit.nextAction}`
  ].join("\n");
}

export function buildQuickVerifiedLaunchExportMarkdown(packet: QuickAppliedLaunchPacket, audit: WorkflowLiveProofAudit, verifiedLaunchRoomHref = "") {
  return [
    packet.exportMarkdown,
    "",
    "## Live proof audit receipt",
    audit.headline,
    audit.summary,
    "",
    ...(verifiedLaunchRoomHref ? [`Verified launch room: ${verifiedLaunchRoomHref}`] : []),
    `Receipt: ${audit.receiptId}`,
    `Checksum: ${audit.checksumAlgorithm}:${audit.checksum}`,
    `Status: ${audit.status}`,
    `Checked: ${audit.checkedAt || "not run"}`,
    `Verified: ${audit.verifiedCount}/${audit.totalCount}`,
    `Score: ${audit.score}/100`,
    "",
    "### Live proof rows",
    ...audit.rows.map((row) => `- [${row.status}] ${row.label}: ${row.url || "missing"} - ${row.evidence} Action: ${row.action}`),
    "",
    "### Live proof next action",
    audit.nextAction
  ].join("\n");
}

export function buildQuickPublicationKit(draft: WorkflowIntakeDraft, preview: QuickBuyerRoomPreview): QuickPublicationKit {
  const buyer = preview.buyer;
  const workflow = draft.workOrder.request || "the selected workflow";
  const baseline = draft.workOrder.currentBaseline || "The current baseline is still scattered across manual notes and review threads.";
  const successMetric = draft.workOrder.successMetric || "A buyer-visible success metric still needs to be named.";
  const proofRow = preview.rows.find((row) => row.id === "proof");
  const protopediaItem = preview.proofRepairPlan.items.find((item) => item.id === "protopediaUrl");
  const walkthroughItem = preview.proofRepairPlan.items.find((item) => item.id === "videoUrl");
  const protopediaReady = validProtoPediaUrl(draft.proofLinks.protopediaUrl);
  const storyStatus: QuickBuyerRoomPreviewStatus = statusFromParts(
    [draft.workOrder.targetUser, draft.workOrder.request, draft.workOrder.successMetric],
    [draft.workOrder.currentBaseline, draft.pilotRun.reviewerName]
  );
  const items: QuickPublicationKitItem[] = [
    {
      id: "story",
      label: "ProtoPedia story",
      status: storyStatus,
      owner: draft.workOrder.targetUser || "Publication owner",
      action: storyStatus === "ready" ? "Paste the story copy and keep the buyer workflow unchanged." : "Name the buyer, workflow, baseline, and success metric before publishing.",
      evidence: `${buyer}: ${workflow}`
    },
    {
      id: "walkthrough",
      label: "Walkthrough video",
      status: walkthroughItem?.status ?? "blocked",
      owner: walkthroughItem?.owner ?? "Recording owner",
      action: walkthroughItem?.status === "ready" ? "Attach the public walkthrough URL to the publication kit." : "Record the five-shot walkthrough and attach a public video URL.",
      evidence: walkthroughItem?.value ?? "Missing public URL"
    },
    {
      id: "proof",
      label: "Public proof packet",
      status: proofRow?.status ?? "blocked",
      owner: preview.handoffBrief.nextAction.owner,
      action: preview.proofRepairPlan.repairCount === 0 ? "Run live proof verification immediately before sharing." : preview.handoffBrief.nextAction.action,
      evidence: preview.handoffBrief.proofSummary
    },
    {
      id: "tag",
      label: "Story publication",
      status: protopediaReady ? "ready" : "watch",
      owner: protopediaItem?.owner ?? "Publication owner",
      action: protopediaReady ? "Keep the published story page reachable." : "Publish the ProtoPedia story page and attach its public URL.",
      evidence: protopediaReady ? draft.proofLinks.protopediaUrl || "ProtoPedia URL attached" : "Public story page URL missing"
    }
  ];
  const status = mergedPreviewStatus(...items.map((item) => item.status));
  const unresolvedItems = items.filter((item) => item.status !== "ready");
  const headline =
    status === "ready"
      ? "Publication kit is ready for external review"
      : status === "watch"
        ? `${unresolvedItems.length} publication item${unresolvedItems.length === 1 ? "" : "s"} need owner review`
        : `${unresolvedItems.length} publication item${unresolvedItems.length === 1 ? "" : "s"} block public launch`;
  const summary =
    status === "ready"
      ? "Story copy, walkthrough plan, public story page, and proof packet are aligned with the buyer room."
      : `${labelList(unresolvedItems.map((item) => item.label))} must be closed before this feels globally publishable.`;
  const storyText = [
    `Title: ${buyer} proof room for ${workflow}`,
    "",
    "Problem",
    baseline,
    "",
    "Target user",
    buyer,
    "",
    "What the AI agent does",
    "The agent turns one messy workflow note into a buyer room with scope, value model, measured run, proof repair actions, A2A trial evidence, and a continue/revise/stop decision path.",
    "",
    "Why AI is necessary",
    "The useful work is not another static checklist: the operator extracts facts, refuses invented proof URLs, preserves missing evidence as owner actions, and exports replayable receipts.",
    "",
    "Measured value",
    `${draftValueLine(draft)}. ${draftPilotLine(draft)}.`,
    "",
    "Public proof",
    ...preview.proofRepairPlan.items.map((item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.action}`),
    "",
    "Technology",
    "Gemini-assisted workflow extraction, Cloud Run public delivery, A2A trial evidence, live proof verification, and checksum receipts.",
    "",
    "Public story page",
    draft.proofLinks.protopediaUrl || "ProtoPedia story page URL pending"
  ].join("\n");
  const walkthroughText = [
    `Walkthrough shot list: ${buyer}`,
    "",
    "0:00 Show the painful workflow note and name the buyer.",
    `0:15 Paste the note, preview the buyer room, and point to ${draftValueLine(draft)}.`,
    "0:35 Verify the extraction receipt and show that invented proof URLs are not accepted.",
    `0:55 Open the proof repair plan and close the next public gap: ${preview.handoffBrief.nextAction.action}`,
    "1:15 Open the launch room, review kit, decision receipt, and trust manifest.",
    "1:35 End on the continue/revise/stop decision path and the next owner action.",
    "",
    "Do not claim public launch readiness until every proof item in the kit is ready."
  ].join("\n");
  const exportMarkdown = [
    `# ${headline}`,
    "",
    summary,
    "",
    "## Publication checklist",
    ...items.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.action} Evidence: ${item.evidence}`),
    "",
    "## ProtoPedia story copy",
    storyText,
    "",
    "## Walkthrough shot list",
    walkthroughText,
    "",
    "## Buyer room receipt",
    `Receipt: ${preview.pilotWeekTaskPacket.receipt.receiptId}`,
    `Checksum: ${preview.pilotWeekTaskPacket.receipt.checksumAlgorithm}:${preview.pilotWeekTaskPacket.receipt.checksum}`
  ].join("\n");

  return {
    status,
    headline,
    summary,
    storyText,
    storyHref: `data:text/plain;charset=utf-8,${encodeURIComponent(storyText)}`,
    walkthroughText,
    walkthroughHref: `data:text/plain;charset=utf-8,${encodeURIComponent(walkthroughText)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    items
  };
}

function globalPublishabilityLabel(status: QuickBuyerRoomPreviewStatus) {
  if (status === "ready") return "Publishable proof room";
  if (status === "watch") return "Publication needs owner review";
  return "Publication blocked";
}

function quickFreshnessAuditRowLine(row: WorkflowLiveProofAudit["rows"][number]) {
  return `- [${row.status}] ${row.label}: ${row.url || "missing"} - ${row.evidence} Action: ${row.action}`;
}

function buildQuickGlobalPublishabilityFreshness(
  liveProofAudit?: WorkflowLiveProofAudit | null,
  nowMs = Date.now()
): QuickGlobalPublishabilityFreshness {
  const ttlHours = QUICK_GLOBAL_PROOF_FRESHNESS_TTL_HOURS;
  const checkedAt = liveProofAudit?.checkedAt || "";
  const auditReceiptId = liveProofAudit && checkedAt ? liveProofAudit.receiptId : "";
  const auditChecksum = liveProofAudit && checkedAt ? `${liveProofAudit.checksumAlgorithm}:${liveProofAudit.checksum}` : "";
  const auditRows = liveProofAudit && checkedAt ? liveProofAudit.rows : [];
  const auditVerifiedCount = liveProofAudit && checkedAt ? liveProofAudit.verifiedCount : 0;
  const auditTotalCount = liveProofAudit && checkedAt ? liveProofAudit.totalCount : 0;
  const auditRepairCount = auditRows.filter((row) => row.status !== "pass").length;
  const auditStatus = liveProofAudit && checkedAt ? liveProofAudit.status : "not-run";
  const checkedAtMs = checkedAt ? Date.parse(checkedAt) : Number.NaN;
  const hasValidCheckedAt = Number.isFinite(checkedAtMs);
  const expiresAtMs = hasValidCheckedAt ? checkedAtMs + ttlHours * 60 * 60 * 1000 : Number.NaN;
  const expiresAt = Number.isFinite(expiresAtMs) ? new Date(expiresAtMs).toISOString() : "";
  const remainingHours = Number.isFinite(expiresAtMs) ? Math.max(0, Math.ceil((expiresAtMs - nowMs) / (60 * 60 * 1000))) : 0;
  const isFresh = liveProofAudit?.status === "verified" && hasValidCheckedAt && nowMs < expiresAtMs;
  const auditRowSummary =
    auditRows.length === 0
      ? "No live proof rows sealed yet."
      : isFresh
        ? `${auditVerifiedCount}/${auditTotalCount} live proof rows sealed in the audit receipt.`
        : auditStatus === "verified"
          ? `${auditVerifiedCount}/${auditTotalCount} live proof rows were sealed, but the freshness window expired.`
          : `${auditVerifiedCount}/${auditTotalCount} live proof rows responded; ${auditRepairCount} row${auditRepairCount === 1 ? "" : "s"} require repair.`;
  const status: QuickBuyerRoomPreviewStatus = isFresh ? "ready" : "blocked";
  const label = isFresh
    ? "Fresh proof receipt"
    : liveProofAudit?.status === "verified"
      ? "Freshness expired"
      : liveProofAudit?.status === "action-required"
        ? "Live proof needs repair"
        : "Live proof not run";
  const summary = isFresh
    ? `Live proof audit is verified for ${remainingHours} more hour${remainingHours === 1 ? "" : "s"}.`
    : liveProofAudit?.status === "verified"
      ? `Live proof was checked at ${checkedAt}, but the ${ttlHours}-hour freshness window has expired.`
      : liveProofAudit?.status === "action-required"
        ? liveProofAudit.summary
        : "Run live verification to issue a timestamped audit receipt before public sharing.";
  const nextAction = isFresh
    ? "Attach the live proof audit receipt to the launch room."
    : liveProofAudit?.status === "action-required"
      ? liveProofAudit.nextAction
      : "Run live proof verification before public sharing.";
  const exportMarkdown = [
    "# Proof freshness window",
    "",
    `Status: ${status}`,
    `Label: ${label}`,
    `Checked: ${checkedAt || "not run"}`,
    `Audit receipt: ${auditReceiptId || "not issued"}`,
    `Audit checksum: ${auditChecksum || "not issued"}`,
    `Expires: ${expiresAt || "not available"}`,
    `Window: ${ttlHours} hours`,
    `Remaining: ${remainingHours} hours`,
    "",
    summary,
    auditRowSummary,
    "",
    "## Sealed live proof rows",
    ...(auditRows.length > 0 ? auditRows.map(quickFreshnessAuditRowLine) : ["- none"]),
    "",
    `Next action: ${nextAction}`,
    auditReceiptId ? `Verified audit: ${auditReceiptId} / ${auditChecksum}` : "Verified audit: not issued"
  ].join("\n");

  return {
    status,
    label,
    auditReceiptId,
    auditChecksum,
    auditRows,
    auditRowSummary,
    checkedAt,
    expiresAt,
    ttlHours,
    remainingHours,
    summary,
    nextAction,
    href: isFresh ? `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}` : `#${QUICK_LIVE_PROOF_AUDIT_ID}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function publicationKitItemHref(item: QuickPublicationKitItem | undefined) {
  if (!item) return "#quick-workflow-intake";
  if (item.id === "walkthrough") return quickProofRepairFieldHref("videoUrl");
  if (item.id === "tag") return quickProofRepairFieldHref("protopediaUrl");
  if (item.id === "proof") return `#${QUICK_PROOF_REPAIR_PLAN_ID}`;
  return "#quick-workflow-intake";
}

export function buildQuickPublicValueReleaseGate(input: {
  preview: QuickBuyerRoomPreview;
  publicationKit: QuickPublicationKit;
  liveProofAudit?: WorkflowLiveProofAudit | null;
  freshnessNowMs?: number;
}): QuickPublicValueReleaseGate {
  const monthlyFloor = Math.max(0, input.preview.economicsStressTest.riskAdjustedMonthlyValueYen);
  const publicationReadyCount = input.publicationKit.items.filter((item) => item.status === "ready").length;
  const firstPublicationGap = input.publicationKit.items.find((item) => item.status !== "ready");
  const liveProofFreshness = quickLiveProofFreshness(input.liveProofAudit, input.freshnessNowMs);
  const liveProofStatus: QuickBuyerRoomPreviewStatus = liveProofFreshness.isFresh ? "ready" : "blocked";
  const liveProofValue = liveProofFreshness.isFresh
    ? `${input.liveProofAudit?.verifiedCount ?? 0}/${input.liveProofAudit?.totalCount ?? 0} proof rows fresh`
    : "No fresh proof receipt";
  const checks: QuickPublicValueReleaseGateCheck[] = [
    {
      id: "value",
      label: "Value floor",
      status: input.preview.economicsStressTest.status,
      value: monthlyFloor > 0 ? `${formatYen(monthlyFloor)}/month` : "Value floor missing",
      evidence: input.preview.economicsStressTest.summary,
      owner: "Finance owner",
      action:
        input.preview.economicsStressTest.status === "ready"
          ? "Keep downside assumptions attached to the public value claim."
          : "Add measured run evidence until the downside value floor is defensible.",
      href: input.preview.economicsStressTest.exportHref
    },
    {
      id: "sponsor",
      label: "Sponsor send gate",
      status: input.preview.sponsorSendGate.status,
      value: `${input.preview.sponsorSendGate.label} / ${input.preview.sponsorSendGate.score}/100`,
      evidence: input.preview.sponsorSendGate.summary,
      owner: input.preview.sponsorSendGate.nextOwner,
      action: input.preview.sponsorSendGate.nextAction,
      href: input.preview.sponsorSendGate.exportHref
    },
    {
      id: "publication",
      label: "Publication kit",
      status: input.publicationKit.status,
      value: `${publicationReadyCount}/${input.publicationKit.items.length} items ready`,
      evidence: input.publicationKit.summary,
      owner: firstPublicationGap?.owner ?? "Publication owner",
      action: firstPublicationGap?.action ?? "Keep story copy, walkthrough, public story page, and proof packet together.",
      href: publicationKitItemHref(firstPublicationGap)
    },
    {
      id: "live-proof",
      label: "Live proof freshness",
      status: liveProofStatus,
      value: liveProofValue,
      evidence: liveProofFreshness.summary,
      owner: "Proof owner",
      action: liveProofFreshness.isFresh ? "Keep the fresh live proof receipt attached to the public value claim." : "Run live proof verification before public sharing.",
      href: input.liveProofAudit ? `data:text/markdown;charset=utf-8,${encodeURIComponent(input.liveProofAudit.exportMarkdown)}` : `#${QUICK_LIVE_PROOF_AUDIT_ID}`
    }
  ];
  const status = mergedPreviewStatus(...checks.map((check) => check.status));
  const releaseScore = Math.round(checks.reduce((sum, check) => sum + rowStatusScore(check.status), 0) / checks.length);
  const shareableMonthlyValueYen = status === "ready" ? monthlyFloor : 0;
  const lockedMonthlyValueYen = Math.max(0, monthlyFloor - shareableMonthlyValueYen);
  const firstOpen = checks.find((check) => check.status === "blocked") ?? checks.find((check) => check.status === "watch");
  const label = status === "ready" ? "Value released" : status === "watch" ? "Value needs final proof" : "Value locked";
  const headline =
    status === "ready"
      ? `${formatYen(monthlyFloor)}/month can be shown externally`
      : `${formatYen(monthlyFloor)}/month is not shareable yet`;
  const summary =
    status === "ready"
      ? `${input.preview.buyer} can see the downside value floor with sponsor, publication, and live proof gates attached.`
      : `${formatYen(lockedMonthlyValueYen)}/month remains internal until ${firstOpen?.owner ?? "Owner"} closes ${firstOpen?.label ?? "the open gate"}.`;
  const nextOwner = firstOpen?.owner ?? "Proof owner";
  const nextAction = firstOpen?.action ?? "Attach the fresh proof receipt before public sharing.";
  const releaseRule =
    status === "ready"
      ? "Share the monthly value only with the fresh live proof receipt attached."
      : `Do not cite the monthly value externally until ${nextOwner} completes: ${nextAction}`;
  const sourceChecksum = `${input.preview.conversionReceipt.checksumAlgorithm}:${input.preview.conversionReceipt.checksum}`;
  const exportMarkdown = [
    "# Public value release gate",
    "",
    `Buyer: ${input.preview.buyer}`,
    `Status: ${status}`,
    `Label: ${label}`,
    `Release score: ${releaseScore}/100`,
    `Shareable monthly value: ${formatYen(shareableMonthlyValueYen)}`,
    `Locked monthly value: ${formatYen(lockedMonthlyValueYen)}`,
    `Release rule: ${releaseRule}`,
    `Next action: ${nextOwner} - ${nextAction}`,
    `Source receipt: ${input.preview.conversionReceipt.receiptId}`,
    `Source checksum: ${sourceChecksum}`,
    "",
    "## Gates",
    ...checks.map((check) => `- [${check.status}] ${check.label} (${check.owner}): ${check.value}. ${check.evidence} Action: ${check.action}`)
  ].join("\n");
  const liveProofAuditReceiptId = input.liveProofAudit?.receiptId ?? "";
  const liveProofAuditChecksum = input.liveProofAudit ? `${input.liveProofAudit.checksumAlgorithm}:${input.liveProofAudit.checksum}` : "";
  const receipt = buildQuickPublicValueReleaseReceipt({
    receiptVersion: QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION,
    source: "quick-workflow-intake",
    buyer: input.preview.buyer,
    workflow: input.preview.conversionReceipt.payload.workflow,
    status,
    label,
    releaseScore,
    shareableMonthlyValueYen,
    lockedMonthlyValueYen,
    nextOwner,
    nextAction,
    releaseRule,
    sourceReceiptId: input.preview.conversionReceipt.receiptId,
    sourceChecksum,
    sponsorGateReceiptId: input.preview.sponsorSendGate.receipt.receiptId,
    liveProofAuditReceiptId,
    liveProofAuditChecksum,
    publicationReadyCount,
    publicationTotalCount: input.publicationKit.items.length,
    checks: checks.map((check) => ({
      id: check.id,
      label: check.label,
      status: check.status,
      value: check.value,
      evidence: check.evidence,
      owner: check.owner,
      action: check.action
    }))
  });

  return {
    status,
    label,
    headline,
    summary,
    releaseScore,
    shareableMonthlyValueYen,
    lockedMonthlyValueYen,
    nextOwner,
    nextAction,
    releaseRule,
    sourceReceiptId: input.preview.conversionReceipt.receiptId,
    sourceChecksum,
    verifierHref: receiptVerifierPrefillHref(receipt.verificationRequestJson),
    receipt,
    checks,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function quickProofRepairSampleValue(id: QuickProofLinkId) {
  if (id === "targetUrl") return SUBMISSION_PROOF.deployedUrl;
  if (id === "protopediaUrl") return "https://protopedia.net/prototype/release-ready";
  if (id === "videoUrl") return "https://youtu.be/releaseReady12345";
  if (id === "pilotEvidenceUrl") return `${SUBMISSION_PROOF.deployedUrl}/proof/pilot-receipt`;
  return `${SUBMISSION_PROOF.deployedUrl}/proof/work-order-proof`;
}

function globalPublishabilityScore(gates: QuickGlobalPublishabilityGate[]) {
  return Math.round(gates.reduce((sum, gate) => sum + rowStatusScore(gate.status), 0) / gates.length);
}

function quickRepairAcceptanceCriteria(item: QuickProofRepairItem, projectedScore: number, projectedStatus: QuickBuyerRoomPreviewStatus) {
  const fieldCriteria = `${item.label} is attached as a public https URL in the proof repair plan.`;
  const recalculationCriteria = `Global publishability recalculates to ${projectedScore}/100 with status ${projectedStatus}.`;
  if (item.id === "protopediaUrl") {
    return ["ProtoPedia story page is public and reachable without private access.", fieldCriteria, recalculationCriteria];
  }
  if (item.id === "videoUrl") {
    return ["Walkthrough shows intake, buyer proof room, one-pager, and proof packet in one pass.", fieldCriteria, recalculationCriteria];
  }
  if (item.id === "targetUrl") {
    return ["Reviewer can open the deployed Cloud Run or production URL without private credentials.", fieldCriteria, recalculationCriteria];
  }
  if (item.id === "pilotEvidenceUrl") {
    return ["Pilot receipt includes manual minutes, assisted minutes, accepted tasks, and reviewer.", fieldCriteria, recalculationCriteria];
  }
  return ["Work order proof states buyer, workflow, baseline, metric, and data boundary.", fieldCriteria, recalculationCriteria];
}

function buildQuickGlobalPublishabilityCertificate(input: {
  preview: QuickBuyerRoomPreview;
  publicationKit: QuickPublicationKit;
  onePager: QuickBuyerDecisionOnePager;
  freshness: QuickGlobalPublishabilityFreshness;
  gates: QuickGlobalPublishabilityGate[];
  status: QuickBuyerRoomPreviewStatus;
  score: number;
  sourceChecksum: string;
  primaryAction: string;
}): QuickGlobalPublishabilityCertificate {
  const firstOpenGate = input.gates.find((gate) => gate.status !== "ready");
  const isReady = input.status === "ready";
  const clearance: QuickGlobalPublishabilityCertificate["clearance"] = isReady ? "external-review" : "internal-only";
  const label = isReady ? "External review allowed" : "Internal only";
  const headline = isReady ? "Launch certificate clears external sharing" : `${firstOpenGate?.label ?? "Open gate"} holds external sharing`;
  const sharePolicy = isReady
    ? `${input.preview.buyer} can share the buyer one-pager, publication kit, and live proof audit until ${input.freshness.expiresAt}.`
    : `Keep the launch room internal until ${firstOpenGate?.owner ?? "the owner"} closes ${firstOpenGate?.label.toLowerCase() ?? "the open gate"}.`;
  const holdReason = isReady ? "Recheck live proof before the freshness window expires." : `${firstOpenGate?.owner ?? "Owner"}: ${input.primaryAction}`;
  const receipts = [
    { label: "One-pager receipt", value: input.onePager.receipt.receiptId },
    { label: "One-pager checksum", value: input.sourceChecksum },
    { label: "Claim ledger", value: input.preview.claimProofLedger.receipt.receiptId },
    { label: "Rollout receipt", value: input.preview.rolloutCommandBoard.receipt.receiptId },
    { label: "Live proof audit", value: input.freshness.auditReceiptId ? `${input.freshness.auditReceiptId} / ${input.freshness.auditChecksum}` : "not issued" },
    { label: "Live proof rows", value: input.freshness.auditRowSummary },
    { label: "Freshness window", value: input.freshness.expiresAt ? `expires ${input.freshness.expiresAt}` : "not issued" },
    { label: "Publication kit", value: input.publicationKit.headline }
  ];
  const exportMarkdown = [
    "# Launch certificate",
    "",
    `Clearance: ${label}`,
    `Status: ${input.status}`,
    `Score: ${input.score}/100`,
    `Buyer: ${input.preview.buyer}`,
    "",
    "## Share policy",
    sharePolicy,
    "",
    "## Hold reason",
    holdReason,
    "",
    "## Receipt chain",
    ...receipts.map((receipt) => `- ${receipt.label}: ${receipt.value}`),
    "",
    "## Gate summary",
    ...input.gates.map((gate) => `- [${gate.status}] ${gate.label}: ${gate.action}`)
  ].join("\n");

  return {
    status: input.status,
    clearance,
    label,
    headline,
    sharePolicy,
    holdReason,
    receipts,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickGlobalPublishabilityReviewerBrief(input: {
  preview: QuickBuyerRoomPreview;
  onePager: QuickBuyerDecisionOnePager;
  successCommitment: QuickBuyerDecisionSuccessCommitment;
  freshness: QuickGlobalPublishabilityFreshness;
  certificate: QuickGlobalPublishabilityCertificate;
  status: QuickBuyerRoomPreviewStatus;
  score: number;
  primaryAction: string;
}): QuickGlobalPublishabilityReviewerBrief {
  const isReady = input.status === "ready";
  const label = isReady ? "Reviewer brief" : "Hold brief";
  const headline = isReady ? "Reviewer can start with four artifacts" : "Reviewer packet stays internal";
  const summary = isReady
    ? `${input.preview.buyer} can judge value, proof freshness, and Day 30 success criteria without reading the full room.`
    : "Use this brief to close the hold reason before sending a broad external reviewer link.";
  const reviewQuestion = isReady
    ? `Can ${input.preview.buyer} trust this workflow enough to continue, revise, or stop from the proof packet?`
    : `What must close before external review: ${input.certificate.holdReason}`;
  const messageText = isReady
    ? [
        `Review packet for ${input.preview.buyer}`,
        `Clearance: ${input.certificate.label}`,
        `Score: ${input.score}/100`,
        `Question: ${reviewQuestion}`,
        `Start with the launch certificate, then read the buyer one-pager and live proof freshness window.`
      ].join("\n")
    : [
        `Hold reviewer packet for ${input.preview.buyer}`,
        `Clearance: ${input.certificate.label}`,
        `Score: ${input.score}/100`,
        `Do not forward a broad external link yet.`,
        `Hold reason: ${input.certificate.holdReason}`,
        `Next action: ${input.primaryAction}`
      ].join("\n");
  const readOrder = [
    {
      label: "Launch certificate",
      status: input.certificate.status,
      detail: input.certificate.sharePolicy,
      href: input.certificate.exportHref
    },
    {
      label: "Buyer one-pager",
      status: input.onePager.status,
      detail: input.onePager.valueLine,
      href: input.onePager.exportHref
    },
    {
      label: "Fresh proof window",
      status: input.freshness.status,
      detail: input.freshness.summary,
      href: input.freshness.exportHref
    },
    {
      label: "Day 30 success rule",
      status: input.successCommitment.status,
      detail: input.successCommitment.renewalAsk,
      href: input.successCommitment.exportHref
    }
  ];
  const exportMarkdown = [
    "# Reviewer brief",
    "",
    `Clearance: ${input.certificate.label}`,
    `Status: ${input.status}`,
    `Score: ${input.score}/100`,
    `Buyer: ${input.preview.buyer}`,
    "",
    "## Review question",
    reviewQuestion,
    "",
    "## Message",
    messageText,
    "",
    "## Read order",
    ...readOrder.map((item) => `- [${item.status}] ${item.label}: ${item.detail}`),
    "",
    "## Hold reason",
    input.certificate.holdReason
  ].join("\n");

  return {
    status: input.status,
    clearance: input.certificate.clearance,
    label,
    headline,
    summary,
    reviewQuestion,
    messageText,
    readOrder,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickGlobalPublishabilityClaimAudit(input: {
  preview: QuickBuyerRoomPreview;
  freshness: QuickGlobalPublishabilityFreshness;
}): QuickGlobalPublishabilityClaimAudit {
  const ledger = input.preview.claimProofLedger;
  const workflow = input.preview.rows.find((row) => row.id === "scope")?.proof || input.preview.primaryAsk;
  const freshnessRow: QuickGlobalPublishabilityClaimAuditRow = {
    id: "proof-freshness",
    label: "Live proof freshness",
    status: input.freshness.status,
    claim: "The public proof packet is fresh enough for an outside reviewer.",
    evidence: input.freshness.summary,
    proof: input.freshness.checkedAt ? `Checked ${input.freshness.checkedAt}; expires ${input.freshness.expiresAt}` : "No live proof receipt issued yet.",
    owner: "Proof owner",
    verification: "Run live proof verification and confirm every public proof URL passes inside the 24-hour review window.",
    risk: "Stale proof makes otherwise traceable claims unsafe to share.",
    nextAction: input.freshness.nextAction,
    href: input.freshness.href
  };
  const rowFromClaim = (claim: QuickClaimProofItem): QuickGlobalPublishabilityClaimAuditRow => ({
    id: claim.id,
    label: claim.label,
    status: claim.status,
    claim: claim.claim,
    evidence: claim.evidence,
    proof: claim.proof,
    owner: claim.owner,
    verification: claim.verification,
    risk: claim.risk,
    nextAction: claim.nextAction,
    href: claim.href
  });
  const priorityIds: QuickClaimProofItem["id"][] = ["value-model", "measured-run", "public-proof", "agent-trust", "procurement-choice"];
  const priorityClaims = priorityIds.map((id) => ledger.items.find((claim) => claim.id === id)).filter((claim): claim is QuickClaimProofItem => Boolean(claim));
  const openClaims = ledger.items.filter((claim) => claim.status !== "ready");
  const rowsById = new Map<QuickGlobalPublishabilityClaimAuditRow["id"], QuickGlobalPublishabilityClaimAuditRow>();
  if (input.freshness.status !== "ready") rowsById.set(freshnessRow.id, freshnessRow);
  [...openClaims, ...priorityClaims].map(rowFromClaim).forEach((row) => rowsById.set(row.id, row));
  if (input.freshness.status === "ready") rowsById.set(freshnessRow.id, freshnessRow);
  const rows = Array.from(rowsById.values()).slice(0, 4);
  const status = mergedPreviewStatus(ledger.status, input.freshness.status);
  const totalCount = ledger.items.length + 1;
  const readyCount = ledger.readyCount + (input.freshness.status === "ready" ? 1 : 0);
  const traceScore = Math.round((ledger.items.reduce((sum, claim) => sum + rowStatusScore(claim.status), 0) + rowStatusScore(input.freshness.status)) / totalCount);
  const firstOpen = rows.find((row) => row.status !== "ready") ?? (input.freshness.status !== "ready" ? freshnessRow : undefined);
  const label = status === "ready" ? "Decision-grade claims" : "Claim audit hold";
  const headline =
    status === "ready"
      ? "Reviewer can challenge the business case claim by claim"
      : input.freshness.status !== "ready"
        ? "Proof freshness makes the claim packet internal-only"
        : `${firstOpen?.label ?? "Claim proof"} needs proof before global review`;
  const primaryRisk = firstOpen ? `${firstOpen.label}: ${firstOpen.risk}` : ledger.primaryRisk;
  const summary =
    status === "ready"
      ? `${readyCount}/${totalCount} decision claims include source, proof, owner, and verification instructions.`
      : `${readyCount}/${totalCount} decision claims are review-safe. Next: ${firstOpen?.owner ?? "Owner"} must ${firstOpen?.nextAction.toLowerCase() ?? "repair claim proof"}`;
  const exportMarkdown = [
    "# Decision-grade claim audit",
    "",
    `Buyer: ${input.preview.buyer}`,
    `Workflow: ${workflow}`,
    `Status: ${status}`,
    `Trace score: ${traceScore}/100`,
    `Ready: ${readyCount}/${totalCount}`,
    `Primary risk: ${primaryRisk}`,
    `Claim ledger receipt: ${ledger.receipt.receiptId}`,
    "",
    "## Summary",
    summary,
    "",
    "## Reviewer rows",
    ...rows.map(
      (row) =>
        `- [${row.status}] ${row.label}: ${row.claim} Evidence: ${row.evidence} Proof: ${row.proof} Owner: ${row.owner} Verification: ${row.verification} Risk: ${row.risk} Next: ${row.nextAction}`
    ),
    "",
    "## Exports",
    `Ledger: ${ledger.exportHref}`,
    `CSV: ${ledger.csvHref}`,
    `Receipt: ${ledger.receipt.receiptId}`
  ].join("\n");

  return {
    status,
    label,
    headline,
    summary,
    traceScore,
    readyCount,
    totalCount,
    primaryRisk,
    rows,
    receiptId: ledger.receipt.receiptId,
    ledgerHref: ledger.exportHref,
    csvHref: ledger.csvHref,
    receiptHref: ledger.receiptHref,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickGlobalPublishabilityValueRoute(input: {
  preview: QuickBuyerRoomPreview;
  onePager: QuickBuyerDecisionOnePager;
  successCommitment: QuickBuyerDecisionSuccessCommitment;
  freshness: QuickGlobalPublishabilityFreshness;
}): QuickGlobalPublishabilityValueRoute {
  const command = (id: QuickRolloutCommand["id"]) => input.preview.rolloutCommandBoard.commands.find((item) => item.id === id);
  const metric = (id: QuickAdoptionSuccessMetric["id"]) => input.preview.adoptionSuccessPlan.metrics.find((item) => item.id === id);
  const kickoff = command("kickoff");
  const usage = command("usage-review");
  const value = command("value-review");
  const expansion = command("expansion-decision");
  const retainedValueLine =
    input.preview.adoptionSuccessPlan.retainedMonthlyValueYen > 0
      ? `${formatYen(input.preview.adoptionSuccessPlan.retainedMonthlyValueYen)}/month retained value by Day 30`
      : "Retained value threshold is not ready";
  const steps: QuickGlobalPublishabilityValueRouteStep[] = [
    {
      id: "review-decision",
      window: "Review",
      label: "Continue decision",
      status: input.onePager.status,
      owner: input.onePager.nextOwner,
      outcome: input.onePager.decision,
      evidence: input.onePager.valueLine,
      proof: input.onePager.proofLine,
      href: input.onePager.exportHref
    },
    {
      id: "day-0",
      window: kickoff?.window ?? "Day 0",
      label: kickoff?.label ?? "Owner kickoff",
      status: kickoff?.status ?? "blocked",
      owner: kickoff?.owner ?? input.preview.rolloutCommandBoard.nextOwner,
      outcome: kickoff?.command ?? "Assign the operating owner and review date.",
      evidence: kickoff?.evidence ?? input.preview.rolloutCommandBoard.summary,
      proof: input.preview.rolloutCommandBoard.receipt.receiptId,
      href: kickoff?.href ?? input.preview.rolloutCommandBoard.ownerBriefHref
    },
    {
      id: "day-7",
      window: usage?.window ?? "Day 7",
      label: usage?.label ?? "Usage review",
      status: usage?.status ?? "blocked",
      owner: usage?.owner ?? "Pilot operator",
      outcome: usage?.command ?? "Confirm the workflow repeats outside the first supervised run.",
      evidence: usage?.evidence ?? metric("repeat-usage")?.evidence ?? input.preview.adoptionSuccessPlan.summary,
      proof: metric("repeat-usage")?.target ?? input.preview.adoptionSuccessPlan.renewalAsk,
      href: usage?.href ?? input.preview.adoptionSuccessPlan.exportHref
    },
    {
      id: "day-14",
      window: value?.window ?? "Day 14",
      label: value?.label ?? "Value review",
      status: value?.status ?? "blocked",
      owner: value?.owner ?? "Finance owner",
      outcome: value?.command ?? "Recalculate retained value against the downside case.",
      evidence: value?.evidence ?? metric("value-retention")?.evidence ?? input.successCommitment.retainedValueLine,
      proof: metric("value-retention")?.target ?? input.successCommitment.retainedValueLine,
      href: value?.href ?? input.successCommitment.exportHref
    },
    {
      id: "day-30",
      window: expansion?.window ?? "Day 30",
      label: expansion?.label ?? "Expand or stop",
      status: mergedPreviewStatus(expansion?.status ?? "blocked", input.freshness.status),
      owner: expansion?.owner ?? "Procurement owner",
      outcome: expansion?.command ?? "Record expand, revise, or stop with current proof attached.",
      evidence: expansion?.evidence ?? input.preview.procurementMatrix.summary,
      proof: input.preview.adoptionSuccessPlan.renewalAsk,
      href: expansion?.href ?? input.successCommitment.exportHref
    }
  ];
  const status = mergedPreviewStatus(...steps.map((step) => step.status), input.successCommitment.status);
  const readyCount = steps.filter((step) => step.status === "ready").length;
  const firstOpen = steps.find((step) => step.status !== "ready");
  const label = status === "ready" ? "Review-to-value route" : "Value route hold";
  const headline =
    status === "ready"
      ? "Continue turns into a Day 30 value decision"
      : input.freshness.status !== "ready"
        ? "Fresh proof must close before the value route is sendable"
        : `${firstOpen?.window ?? "Next"} ${firstOpen?.label ?? "value route"} needs owner closure`;
  const routeQuestion = `If ${input.preview.buyer} says continue, can the team prove retained value by Day 30?`;
  const nextAction = firstOpen ? `${firstOpen.owner}: ${firstOpen.outcome}` : input.preview.adoptionSuccessPlan.renewalAsk;
  const summary =
    status === "ready"
      ? `${input.preview.buyer} can see the path from Continue to ${retainedValueLine}, with owners and proof at every checkpoint.`
      : `${readyCount}/5 route steps ready. Next: ${nextAction}`;
  const exportMarkdown = [
    "# Review-to-value route",
    "",
    `Buyer: ${input.preview.buyer}`,
    `Status: ${status}`,
    `Question: ${routeQuestion}`,
    `Retained value: ${retainedValueLine}`,
    `Next action: ${nextAction}`,
    "",
    "## Summary",
    summary,
    "",
    "## Route",
    ...steps.map((step) => `- [${step.status}] ${step.window} ${step.label} (${step.owner}): ${step.outcome} Evidence: ${step.evidence} Proof: ${step.proof}`),
    "",
    "## Day 30 rule",
    input.preview.adoptionSuccessPlan.renewalAsk
  ].join("\n");

  return {
    status,
    label,
    headline,
    summary,
    retainedValueLine,
    routeQuestion,
    nextAction,
    steps,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickGlobalPublishabilityObjectionDeck(input: {
  preview: QuickBuyerRoomPreview;
  freshness: QuickGlobalPublishabilityFreshness;
}): QuickGlobalPublishabilityObjectionDeck {
  const objectionRows: QuickGlobalPublishabilityObjectionRow[] = input.preview.objectionBrief.items.map((item) => ({
    id: item.id,
    label: item.label,
    status: item.status,
    question: item.question,
    answer: item.answer,
    evidence: item.evidence,
    owner: item.owner,
    href: item.href
  }));
  const freshnessRow: QuickGlobalPublishabilityObjectionRow = {
    id: "proofFreshness",
    label: "Proof freshness",
    status: input.freshness.status,
    question: "Is the proof fresh enough to forward?",
    answer: input.freshness.status === "ready" ? input.freshness.summary : "No. Re-run live proof verification before forwarding the reviewer packet.",
    evidence: input.freshness.checkedAt ? `Checked ${input.freshness.checkedAt}; expires ${input.freshness.expiresAt}` : "Live proof verification has not issued a fresh receipt.",
    owner: "Proof owner",
    href: input.freshness.href
  };
  const rows = input.freshness.status === "ready" ? objectionRows : [freshnessRow, ...objectionRows].slice(0, 6);
  const status = mergedPreviewStatus(...rows.map((row) => row.status));
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const totalCount = rows.length;
  const firstOpen = rows.find((row) => row.status !== "ready");
  const label = status === "ready" ? "Objection answers" : "Objection hold";
  const headline =
    status === "ready"
      ? "Reviewer objections are answered with evidence"
      : input.freshness.status !== "ready"
        ? "Fresh proof must close before objections can be forwarded"
        : `${firstOpen?.label ?? "Buyer question"} still needs evidence`;
  const primaryQuestion = firstOpen ? firstOpen.question : "Can a buyer challenge value, proof, trust, data, and adoption without finding a gap?";
  const summary =
    status === "ready"
      ? `${readyCount}/${totalCount} likely reviewer objections have buyer-safe answers and proof links.`
      : `${readyCount}/${totalCount} objection answers are send-safe. Next: ${firstOpen?.owner ?? "Owner"} must answer "${primaryQuestion}"`;
  const exportMarkdown = [
    "# Reviewer objection answers",
    "",
    `Buyer: ${input.preview.buyer}`,
    `Status: ${status}`,
    `Ready: ${readyCount}/${totalCount}`,
    `Primary question: ${primaryQuestion}`,
    "",
    "## Summary",
    summary,
    "",
    "## Answers",
    ...rows.map((row) => `- [${row.status}] ${row.label} (${row.owner}): ${row.question} Answer: ${row.answer} Evidence: ${row.evidence}`),
    "",
    "## Source defense",
    input.preview.objectionBrief.headline,
    input.preview.objectionBrief.summary
  ].join("\n");

  return {
    status,
    label,
    headline,
    summary,
    readyCount,
    totalCount,
    primaryQuestion,
    rows,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickGlobalPublishabilityReviewPacket(input: {
  preview: QuickBuyerRoomPreview;
  publicationKit: QuickPublicationKit;
  onePager: QuickBuyerDecisionOnePager;
  certificate: QuickGlobalPublishabilityCertificate;
  reviewerBrief: QuickGlobalPublishabilityReviewerBrief;
  claimAudit: QuickGlobalPublishabilityClaimAudit;
  valueRoute: QuickGlobalPublishabilityValueRoute;
  objectionDeck: QuickGlobalPublishabilityObjectionDeck;
  freshness: QuickGlobalPublishabilityFreshness;
  score: number;
  primaryAction: string;
}): QuickGlobalPublishabilityReviewPacket {
  const items: QuickGlobalPublishabilityReviewPacketItem[] = [
    {
      id: "launch-certificate",
      label: "Launch certificate",
      status: input.certificate.status,
      role: "Clearance",
      evidence: input.certificate.sharePolicy,
      href: input.certificate.exportHref
    },
    {
      id: "reviewer-brief",
      label: "Reviewer brief",
      status: input.reviewerBrief.status,
      role: "60-second read order",
      evidence: input.reviewerBrief.reviewQuestion,
      href: input.reviewerBrief.exportHref
    },
    {
      id: "claim-audit",
      label: "Claim audit",
      status: input.claimAudit.status,
      role: "Claim trace",
      evidence: `${input.claimAudit.traceScore}/100 trace score; ${input.claimAudit.primaryRisk}`,
      href: input.claimAudit.exportHref
    },
    {
      id: "value-route",
      label: "Review-to-value route",
      status: input.valueRoute.status,
      role: "After-continue proof",
      evidence: input.valueRoute.retainedValueLine,
      href: input.valueRoute.exportHref
    },
    {
      id: "objection-answers",
      label: "Objection answers",
      status: input.objectionDeck.status,
      role: "Reviewer objections",
      evidence: `${input.objectionDeck.readyCount}/${input.objectionDeck.totalCount} answers ready`,
      href: input.objectionDeck.exportHref
    },
    {
      id: "proof-freshness",
      label: "Proof freshness",
      status: input.freshness.status,
      role: "Live proof window",
      evidence: input.freshness.summary,
      href: input.freshness.exportHref
    }
  ];
  const status = mergedPreviewStatus(...items.map((item) => item.status));
  const isReady = status === "ready";
  const readyCount = items.filter((item) => item.status === "ready").length;
  const freshnessHold = items.find((item) => item.id === "proof-freshness" && item.status !== "ready");
  const firstOpen = freshnessHold ?? items.find((item) => item.status !== "ready");
  const label = isReady ? "External review packet" : "Packet hold";
  const headline = isReady ? "One packet is ready to send" : `${firstOpen?.label ?? "Open evidence"} keeps the packet internal`;
  const summary = isReady
    ? `${input.preview.buyer} can forward certificate, reviewer brief, claim audit, value route, objection answers, and proof freshness as one review packet.`
    : `${readyCount}/${items.length} packet items are send-ready. Keep external reviewers on hold until the open evidence is closed.`;
  const sendRule = isReady
    ? `Forward after final live proof check; recheck before ${input.freshness.expiresAt}.`
    : `Keep internal until ${firstOpen?.label ?? "the packet"} is ready.`;
  const nextAction = isReady ? "Send the packet with the launch certificate first." : input.primaryAction;
  const artifactContentById: Record<QuickGlobalPublishabilityReviewPacketItem["id"], string> = {
    "launch-certificate": input.certificate.exportMarkdown,
    "reviewer-brief": input.reviewerBrief.exportMarkdown,
    "claim-audit": input.claimAudit.exportMarkdown,
    "value-route": input.valueRoute.exportMarkdown,
    "objection-answers": input.objectionDeck.exportMarkdown,
    "proof-freshness": input.freshness.exportMarkdown
  };
  const artifacts = items.map((item, index) => ({
    ...item,
    href: item.href.startsWith("data:") ? `#external-review-artifact-${item.id}` : item.href,
    contentKind: "markdown" as const,
    contentChecksum: stablePacketHash(artifactContentById[item.id]),
    contentLength: artifactContentById[item.id].length,
    requiredOrder: index + 1
  }));
  const sourceReceipts = [
    ...input.certificate.receipts,
    { label: "Review packet source", value: `${input.onePager.receipt.receiptId} / ${input.onePager.receipt.checksumAlgorithm}:${input.onePager.receipt.checksum}` },
    { label: "Claim audit receipt", value: input.claimAudit.receiptId }
  ];
  const manifestPayload = {
    receiptVersion: "quick-external-review-packet.v1" as const,
    status,
    clearance: input.certificate.clearance,
    buyer: input.preview.buyer,
    score: input.score,
    readyCount,
    totalCount: items.length,
    sendRule,
    nextAction,
    generatedFrom: ["global publishability gates", "launch certificate", "reviewer brief", "claim audit", "proof freshness window"],
    artifacts,
    sourceReceipts
  };
  const manifestChecksum = stablePacketHash(JSON.stringify(manifestPayload, null, 2));
  const manifest: QuickGlobalPublishabilityReviewPacketManifest = {
    receiptId: `quick-external-review-${status}-${manifestChecksum}`,
    checksumAlgorithm: "fnv1a32",
    checksum: manifestChecksum,
    payloadChecksum: manifestChecksum,
    ...manifestPayload
  };
  const manifestJson = JSON.stringify(manifest, null, 2);
  const manifestVerificationRequestJson = JSON.stringify({ manifest }, null, 2);
  const manifestVerificationStorageKey = manifest.receiptId;
  const manifestVerifierHref = receiptVerifierPrefillHref(manifestVerificationRequestJson);
  const reviewDeskHref = externalReviewPacketShareHref(manifestVerificationRequestJson);
  const artifactBundleJson = JSON.stringify(
    {
      receiptVersion: "quick-external-review-artifact-bundle.v1",
      manifestReceiptId: manifest.receiptId,
      manifestChecksum: `${manifest.checksumAlgorithm}:${manifest.checksum}`,
      manifest,
      artifacts: artifacts.map((artifact) => ({
        artifactId: artifact.id,
        label: artifact.label,
        contentKind: artifact.contentKind,
        content: artifactContentById[artifact.id]
      }))
    },
    null,
    2
  );
  const exportMarkdown = [
    "# External review packet",
    "",
    `Clearance: ${input.certificate.label}`,
    `Status: ${status}`,
    `Score: ${input.score}/100`,
    `Buyer: ${input.preview.buyer}`,
    `Send rule: ${sendRule}`,
    `Next action: ${nextAction}`,
    "",
    "## Packet contents",
    ...items.map((item) => `- [${item.status}] ${item.label} (${item.role}): ${item.evidence}`),
    "",
    "## Read first",
    `Launch certificate: ${input.certificate.headline}`,
    `Reviewer brief: ${input.reviewerBrief.reviewQuestion}`,
    "",
    "## Evidence checks",
    `Trace score: ${input.claimAudit.traceScore}/100`,
    `Value route: ${input.valueRoute.retainedValueLine}`,
    `Objections: ${input.objectionDeck.readyCount}/${input.objectionDeck.totalCount} ready`,
    `Freshness: ${input.freshness.summary}`,
    `Live proof audit: ${input.freshness.auditReceiptId ? `${input.freshness.auditReceiptId} / ${input.freshness.auditChecksum}` : "not issued"}`,
    `Live proof rows: ${input.freshness.auditRowSummary}`,
    "",
    "## Manifest receipt",
    `Receipt: ${manifest.receiptId}`,
    `Checksum: ${manifest.checksumAlgorithm}:${manifest.checksum}`,
    `Payload checksum: ${manifest.checksumAlgorithm}:${manifest.payloadChecksum}`,
    "Verifier: /receipt-verifier",
    "Review desk: /external-review-packet",
    "Artifact bundle: quick-external-review-artifact-bundle.json",
    "Verifier input: Paste the downloaded manifest JSON, or use Verify from the live packet screen.",
    "",
    "## Artifact content checksums",
    ...artifacts.map((artifact) => `- ${artifact.label}: ${artifact.contentKind} ${artifact.contentLength} chars / ${manifest.checksumAlgorithm}:${artifact.contentChecksum}`),
    "",
    "## Linked artifacts",
    `Buyer one-pager: ${input.onePager.receipt.receiptId}`,
    `Publication kit: ${input.publicationKit.headline}`,
    `Claim audit: ${input.claimAudit.receiptId}`
  ].join("\n");

  return {
    status,
    clearance: input.certificate.clearance,
    label,
    headline,
    summary,
    sendRule,
    readyCount,
    totalCount: items.length,
    nextAction,
    items,
    manifest,
    manifestJson,
    manifestHref: `data:application/json;charset=utf-8,${encodeURIComponent(manifestJson)}`,
    manifestVerificationRequestJson,
    manifestVerificationStorageKey,
    manifestVerifierHref,
    reviewDeskHref,
    artifactBundleJson,
    artifactBundleHref: `data:application/json;charset=utf-8,${encodeURIComponent(artifactBundleJson)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickGlobalPublishabilityDecisionMemo(input: {
  preview: QuickBuyerRoomPreview;
  score: number;
  certificate: QuickGlobalPublishabilityCertificate;
  freshness: QuickGlobalPublishabilityFreshness;
  claimAudit: QuickGlobalPublishabilityClaimAudit;
  valueRoute: QuickGlobalPublishabilityValueRoute;
  objectionDeck: QuickGlobalPublishabilityObjectionDeck;
  reviewPacket: QuickGlobalPublishabilityReviewPacket;
}): QuickGlobalPublishabilityDecisionMemo {
  const tests: QuickGlobalPublishabilityDecisionMemoTest[] = [
    {
      id: "manifest-integrity",
      label: "Manifest verification",
      status: input.reviewPacket.manifest.receiptId && input.reviewPacket.manifestVerifierHref ? "ready" : "blocked",
      test: "Receipt desk can verify the packet manifest before any reviewer accepts the export.",
      evidence: `${input.reviewPacket.manifest.receiptId} / ${input.reviewPacket.manifest.checksumAlgorithm}:${input.reviewPacket.manifest.checksum}`,
      href: input.reviewPacket.manifestVerifierHref
    },
    {
      id: "proof-freshness",
      label: "Proof freshness",
      status: input.freshness.status,
      test: "Live proof is inside the 24-hour review window.",
      evidence: input.freshness.summary,
      href: input.freshness.href
    },
    {
      id: "external-clearance",
      label: "External clearance",
      status: input.certificate.status,
      test: "Launch certificate allows the packet to leave the internal room.",
      evidence: input.certificate.sharePolicy,
      href: input.certificate.exportHref
    },
    {
      id: "claim-trace",
      label: "Claim trace",
      status: input.claimAudit.status,
      test: "Decision claims have source, proof, owner, verification instruction, and risk.",
      evidence: `${input.claimAudit.traceScore}/100 trace score; ${input.claimAudit.readyCount}/${input.claimAudit.totalCount} claims ready.`,
      href: input.claimAudit.exportHref
    },
    {
      id: "value-route",
      label: "Review-to-value route",
      status: input.valueRoute.status,
      test: "A continue decision has Day 0, 7, 14, and 30 owner proof.",
      evidence: input.valueRoute.retainedValueLine,
      href: input.valueRoute.exportHref
    },
    {
      id: "objection-defense",
      label: "Objection defense",
      status: input.objectionDeck.status,
      test: "Likely reviewer objections are answered with evidence and owner accountability.",
      evidence: `${input.objectionDeck.readyCount}/${input.objectionDeck.totalCount} answers ready; ${input.objectionDeck.primaryQuestion}`,
      href: input.objectionDeck.exportHref
    }
  ];
  const status = mergedPreviewStatus(...tests.map((test) => test.status));
  const readyCount = tests.filter((test) => test.status === "ready").length;
  const totalCount = tests.length;
  const firstOpen = tests.find((test) => test.id === "proof-freshness" && test.status !== "ready") ?? tests.find((test) => test.status !== "ready");
  const readyRatioScore = Math.round((readyCount / totalCount) * 100);
  const confidenceScore = Math.round((input.score + input.claimAudit.traceScore + readyRatioScore) / 3);
  const decision: QuickGlobalPublishabilityDecisionMemo["decision"] =
    status === "ready" && input.reviewPacket.clearance === "external-review"
      ? "accept-external-review"
      : input.score >= 75
        ? "hold-for-recheck"
        : "do-not-send";
  const label =
    decision === "accept-external-review"
      ? "Reviewer decision memo"
      : decision === "hold-for-recheck"
        ? "Reviewer hold memo"
        : "Do-not-send memo";
  const reviewerOutcome =
    decision === "accept-external-review"
      ? "Accept for external review"
      : decision === "hold-for-recheck"
        ? "Hold internal until recheck"
        : "Do not send this packet";
  const headline =
    decision === "accept-external-review"
      ? "External reviewer can accept the packet"
      : decision === "hold-for-recheck"
        ? `Hold until ${firstOpen?.label ?? "open evidence"} closes`
        : "Current packet should not leave the room";
  const summary =
    decision === "accept-external-review"
      ? `${input.preview.buyer} can verify the manifest, read the packet in order, and answer continue, revise, or stop from proof.`
      : decision === "hold-for-recheck"
        ? `${readyCount}/${totalCount} reviewer acceptance tests pass. Keep the packet internal; next: ${firstOpen?.test ?? input.reviewPacket.nextAction}`
        : `${readyCount}/${totalCount} reviewer acceptance tests pass and the launch score is ${input.score}/100. Repair the source packet before external review.`;
  const decisionRule =
    decision === "accept-external-review"
      ? "Accept only after the receipt desk verifies the manifest and every memo test is ready."
      : decision === "hold-for-recheck"
        ? "Hold if any test is open; re-export only after the named owner closes the first hold."
        : "Do not send when launch score is below 75 or the packet has unresolved source proof.";
  const nextAction =
    decision === "accept-external-review"
      ? "Send the packet and ask the reviewer to verify the manifest before reading artifacts."
      : firstOpen
        ? `${firstOpen.label}: ${firstOpen.test}`
        : input.reviewPacket.nextAction;
  const exportMarkdown = [
    "# External reviewer decision memo",
    "",
    `Buyer: ${input.preview.buyer}`,
    `Decision: ${reviewerOutcome}`,
    `Status: ${status}`,
    `Confidence: ${confidenceScore}/100`,
    `Ready: ${readyCount}/${totalCount}`,
    `Manifest: ${input.reviewPacket.manifest.receiptId}`,
    `Review desk: ${input.reviewPacket.reviewDeskHref}`,
    "",
    "## Summary",
    summary,
    "",
    "## Decision rule",
    decisionRule,
    "",
    "## Next action",
    nextAction,
    "",
    "## Acceptance tests",
    ...tests.map((test) => `- [${test.status}] ${test.label}: ${test.test} Evidence: ${test.evidence}`),
    "",
    "## Review outcome",
    reviewerOutcome
  ].join("\n");

  return {
    status,
    decision,
    label,
    headline,
    summary,
    reviewerOutcome,
    confidenceScore,
    readyCount,
    totalCount,
    decisionRule,
    nextAction,
    tests,
    reviewDeskHref: input.reviewPacket.reviewDeskHref,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickGlobalPublishabilityGates(
  preview: QuickBuyerRoomPreview,
  publicationKit: QuickPublicationKit,
  onePager: QuickBuyerDecisionOnePager,
  successCommitment: QuickBuyerDecisionSuccessCommitment,
  freshness: QuickGlobalPublishabilityFreshness
): QuickGlobalPublishabilityGate[] {
  const firstProofRepairItem = preview.proofRepairPlan.items.find((item) => item.status !== "ready");
  const firstPublicationGap = publicationKit.items.find((item) => item.status !== "ready");
  const firstSuccessGap = successCommitment.items.find((item) => item.status !== "ready");
  const firstProofRepairHref = firstProofRepairItem ? quickProofRepairFieldHref(firstProofRepairItem.id) : `#${QUICK_PROOF_REPAIR_PLAN_ID}`;
  const firstClaimProofGap = preview.claimProofLedger.items.find((item) => item.status !== "ready");
  const firstClaimProofHref = firstClaimProofGap?.id === "public-proof" ? firstProofRepairHref : firstClaimProofGap?.href || firstProofRepairHref;
  return [
    {
      id: "buyer-decision",
      label: "Buyer decision",
      status: onePager.status,
      owner: onePager.nextOwner,
      evidence: `${onePager.decision}. ${onePager.valueLine}`,
      action: onePager.status === "ready" ? "Share the one-pager with the integrity receipt attached." : onePager.nextAction,
      href: onePager.status === "ready" ? onePager.exportHref : firstProofRepairHref
    },
    {
      id: "public-proof",
      label: "Public proof",
      status: preview.claimProofLedger.status,
      owner: "Proof owner",
      evidence: `${preview.claimProofLedger.score}/100 trace score; ${preview.claimProofLedger.readyCount}/${preview.claimProofLedger.items.length} claims ready.`,
      action:
        preview.claimProofLedger.status === "ready"
          ? "Run live proof verification immediately before public sharing."
          : preview.claimProofLedger.items.find((item) => item.status !== "ready")?.nextAction || preview.claimProofLedger.primaryRisk,
      href: preview.claimProofLedger.status === "ready" ? preview.claimProofLedger.exportHref : firstClaimProofHref
    },
    {
      id: "proof-freshness",
      label: "Proof freshness",
      status: freshness.status,
      owner: "Proof owner",
      evidence: freshness.summary,
      action: freshness.nextAction,
      href: freshness.href
    },
    {
      id: "submission-assets",
      label: "Publication assets",
      status: publicationKit.status,
      owner: firstPublicationGap?.owner ?? "Publication owner",
      evidence: publicationKit.summary,
      action: publicationKit.status === "ready" ? "Publish the ProtoPedia story, walkthrough, and proof packet together." : firstPublicationGap?.action ?? publicationKit.summary,
      href: publicationKit.status === "ready" ? publicationKit.exportHref : publicationKitItemHref(firstPublicationGap)
    },
    {
      id: "rollout-plan",
      label: "Rollout plan",
      status: preview.rolloutCommandBoard.status,
      owner: preview.rolloutCommandBoard.nextOwner,
      evidence: `${preview.rolloutCommandBoard.readyCount}/5 commands ready; ${preview.rolloutCommandBoard.blockedCount} blocked.`,
      action: preview.rolloutCommandBoard.status === "ready" ? "Attach the owner brief and calendar before launch." : preview.rolloutCommandBoard.nextCommand,
      href: preview.rolloutCommandBoard.ownerBriefHref
    },
    {
      id: "success-standard",
      label: "Success standard",
      status: successCommitment.status,
      owner: firstSuccessGap?.owner ?? "Pilot owner",
      evidence: `${successCommitment.reviewWindow}; ${successCommitment.retainedValueLine}.`,
      action: successCommitment.status === "ready" ? "Use the Day 30 commitment as the renewal and expansion rule." : successCommitment.summary,
      href: successCommitment.exportHref
    }
  ];
}

function buildQuickGlobalPublishabilityRepairImpact(input: {
  draft: WorkflowIntakeDraft;
  currentOpenCount: number;
  currentScore: number;
  firstProofRepairItem: QuickProofRepairItem | undefined;
}): QuickGlobalPublishabilityRepairImpact | null {
  if (!input.firstProofRepairItem) return null;
  const repairedDraft = withQuickProofLinkRepair(input.draft, input.firstProofRepairItem.id, quickProofRepairSampleValue(input.firstProofRepairItem.id));
  const repairedPreview = buildQuickBuyerRoomPreview(repairedDraft, input.currentOpenCount);
  const repairedOnePager = buildQuickBuyerDecisionOnePager(repairedPreview);
  const repairedPublicationKit = buildQuickPublicationKit(repairedDraft, repairedPreview);
  const repairedSuccessCommitment = buildQuickBuyerDecisionSuccessCommitment(repairedPreview, repairedOnePager);
  const projectedFreshness = buildQuickGlobalPublishabilityFreshness(null);
  const projectedGates = buildQuickGlobalPublishabilityGates(repairedPreview, repairedPublicationKit, repairedOnePager, repairedSuccessCommitment, projectedFreshness);
  const projectedStatus = mergedPreviewStatus(...projectedGates.map((gate) => gate.status));
  const projectedScore = globalPublishabilityScore(projectedGates);
  const scoreDelta = projectedScore - input.currentScore;
  const projectedFirstOpenGate = projectedGates.find((gate) => gate.status !== "ready");
  const nextAction = projectedFirstOpenGate?.action ?? "Open the publishable proof room and share the buyer one-pager.";
  const summary =
    scoreDelta > 0
      ? `Adding ${input.firstProofRepairItem.label} moves launch score to ${projectedScore}/100. Next: ${nextAction}`
      : `Adding ${input.firstProofRepairItem.label} is required, but launch score stays ${projectedScore}/100 until the next proof gap is closed. Next: ${nextAction}`;
  const acceptanceCriteria = quickRepairAcceptanceCriteria(input.firstProofRepairItem, projectedScore, projectedStatus);
  const verification =
    scoreDelta > 0
      ? `Reopen the global publishability verdict and confirm the score moves from ${input.currentScore}/100 to ${projectedScore}/100.`
      : `Reopen the global publishability verdict and confirm the next open gate moves to: ${nextAction}`;
  const exportText = [
    `Repair owner command: ${input.firstProofRepairItem.label}`,
    `Owner: ${input.firstProofRepairItem.owner}`,
    `Action: ${input.firstProofRepairItem.action}`,
    `Target: ${quickProofRepairFieldHref(input.firstProofRepairItem.id)}`,
    `Impact: ${summary}`,
    "",
    "Acceptance criteria",
    ...acceptanceCriteria.map((criterion) => `- ${criterion}`),
    "",
    `Verification: ${verification}`
  ].join("\n");

  return {
    targetLabel: input.firstProofRepairItem.label,
    targetHref: quickProofRepairFieldHref(input.firstProofRepairItem.id),
    currentScore: input.currentScore,
    projectedScore,
    scoreDelta,
    projectedStatus,
    nextAction,
    summary,
    ownerCommand: {
      owner: input.firstProofRepairItem.owner,
      action: input.firstProofRepairItem.action,
      acceptanceCriteria,
      verification,
      exportText,
      exportHref: `data:text/plain;charset=utf-8,${encodeURIComponent(exportText)}`
    }
  };
}

export function buildQuickGlobalPublishabilityBrief(
  draft: WorkflowIntakeDraft,
  preview: QuickBuyerRoomPreview,
  publicationKit = buildQuickPublicationKit(draft, preview),
  onePager = buildQuickBuyerDecisionOnePager(preview),
  successCommitment = buildQuickBuyerDecisionSuccessCommitment(preview, onePager),
  currentOpenCount = 0,
  options: { liveProofAudit?: WorkflowLiveProofAudit | null; freshnessNowMs?: number } = {}
): QuickGlobalPublishabilityBrief {
  const firstProofRepairItem = preview.proofRepairPlan.items.find((item) => item.status !== "ready");
  const freshness = buildQuickGlobalPublishabilityFreshness(options.liveProofAudit, options.freshnessNowMs);
  const gates = buildQuickGlobalPublishabilityGates(preview, publicationKit, onePager, successCommitment, freshness);
  const status = mergedPreviewStatus(...gates.map((gate) => gate.status));
  const score = globalPublishabilityScore(gates);
  const firstOpenGate = gates.find((gate) => gate.status !== "ready");
  const repairImpact = buildQuickGlobalPublishabilityRepairImpact({ draft, currentOpenCount, currentScore: score, firstProofRepairItem });
  const sourceChecksum = `${onePager.receipt.checksumAlgorithm}:${onePager.receipt.checksum}`;
  const headline =
    status === "ready"
      ? "Global publishability verdict is ready"
      : status === "watch"
        ? `${firstOpenGate?.label ?? "Publication"} needs owner review before launch`
        : `${firstOpenGate?.label ?? "Publication"} blocks global launch`;
  const primaryAction = firstOpenGate?.action ?? "Open the publishable proof room and share the buyer one-pager.";
  const primaryHref = firstOpenGate?.href ?? onePager.exportHref;
  const summary =
    status === "ready"
      ? `${preview.buyer} has buyer decision, public proof, submission assets, rollout plan, and success standard aligned for external review.`
      : `Do not publish globally until ${firstOpenGate?.owner ?? "the owner"} closes ${firstOpenGate?.label.toLowerCase() ?? "the open gate"}: ${primaryAction}`;
  const certificate = buildQuickGlobalPublishabilityCertificate({
    preview,
    publicationKit,
    onePager,
    freshness,
    gates,
    status,
    score,
    sourceChecksum,
    primaryAction
  });
  const claimAudit = buildQuickGlobalPublishabilityClaimAudit({ preview, freshness });
  const valueRoute = buildQuickGlobalPublishabilityValueRoute({
    preview,
    onePager,
    successCommitment,
    freshness
  });
  const objectionDeck = buildQuickGlobalPublishabilityObjectionDeck({ preview, freshness });
  const reviewerBrief = buildQuickGlobalPublishabilityReviewerBrief({
    preview,
    onePager,
    successCommitment,
    freshness,
    certificate,
    status,
    score,
    primaryAction
  });
  const reviewPacket = buildQuickGlobalPublishabilityReviewPacket({
    preview,
    publicationKit,
    onePager,
    certificate,
    reviewerBrief,
    claimAudit,
    valueRoute,
    objectionDeck,
    freshness,
    score,
    primaryAction
  });
  const decisionMemo = buildQuickGlobalPublishabilityDecisionMemo({
    preview,
    score,
    certificate,
    freshness,
    claimAudit,
    valueRoute,
    objectionDeck,
    reviewPacket
  });
  const exportMarkdown = [
    "# Global publishability verdict",
    "",
    `Buyer: ${preview.buyer}`,
    `Status: ${status}`,
    `Score: ${score}/100`,
    `Primary action: ${primaryAction}`,
    `Source receipt: ${onePager.receipt.receiptId}`,
    `Source checksum: ${sourceChecksum}`,
    "",
    "## Summary",
    summary,
    "",
    "## Gates",
    ...gates.map((gate) => `- [${gate.status}] ${gate.label} (${gate.owner}): ${gate.action} Evidence: ${gate.evidence} Link: ${gate.href}`),
    "",
    "## Proof freshness window",
    `Status: ${freshness.status}`,
    `Checked: ${freshness.checkedAt || "not run"}`,
    `Audit receipt: ${freshness.auditReceiptId || "not issued"}`,
    `Audit checksum: ${freshness.auditChecksum || "not issued"}`,
    `Expires: ${freshness.expiresAt || "not available"}`,
    `Window: ${freshness.ttlHours} hours`,
    `Remaining: ${freshness.remainingHours} hours`,
    freshness.summary,
    freshness.auditRowSummary,
    "",
    "## Sealed live proof rows",
    ...(freshness.auditRows.length > 0 ? freshness.auditRows.map(quickFreshnessAuditRowLine) : ["- none"]),
    "",
    "## Launch certificate",
    `Clearance: ${certificate.label}`,
    certificate.sharePolicy,
    `Hold reason: ${certificate.holdReason}`,
    "Receipt chain:",
    ...certificate.receipts.map((receipt) => `- ${receipt.label}: ${receipt.value}`),
    "",
    "## Reviewer brief",
    `Clearance: ${reviewerBrief.label}`,
    reviewerBrief.reviewQuestion,
    "Read order:",
    ...reviewerBrief.readOrder.map((item) => `- [${item.status}] ${item.label}: ${item.detail}`),
    "",
    "## Decision-grade claim audit",
    `Status: ${claimAudit.status}`,
    `Trace score: ${claimAudit.traceScore}/100`,
    `Ready: ${claimAudit.readyCount}/${claimAudit.totalCount}`,
    `Primary risk: ${claimAudit.primaryRisk}`,
    ...claimAudit.rows.map((row) => `- [${row.status}] ${row.label}: ${row.claim} Proof: ${row.proof} Verification: ${row.verification}`),
    "",
    "## Review-to-value route",
    `Status: ${valueRoute.status}`,
    `Question: ${valueRoute.routeQuestion}`,
    `Retained value: ${valueRoute.retainedValueLine}`,
    `Next action: ${valueRoute.nextAction}`,
    ...valueRoute.steps.map((step) => `- [${step.status}] ${step.window} ${step.label} (${step.owner}): ${step.outcome} Proof: ${step.proof}`),
    "",
    "## Reviewer objection answers",
    `Status: ${objectionDeck.status}`,
    `Ready: ${objectionDeck.readyCount}/${objectionDeck.totalCount}`,
    `Primary question: ${objectionDeck.primaryQuestion}`,
    ...objectionDeck.rows.map((row) => `- [${row.status}] ${row.label} (${row.owner}): ${row.question} Answer: ${row.answer} Evidence: ${row.evidence}`),
    "",
    "## External review packet",
    `Clearance: ${certificate.label}`,
    `Status: ${reviewPacket.status}`,
    `Ready: ${reviewPacket.readyCount}/${reviewPacket.totalCount}`,
    `Send rule: ${reviewPacket.sendRule}`,
    `Next action: ${reviewPacket.nextAction}`,
    ...reviewPacket.items.map((item) => `- [${item.status}] ${item.label} (${item.role}): ${item.evidence}`),
    "",
    "## External reviewer decision memo",
    `Decision: ${decisionMemo.reviewerOutcome}`,
    `Confidence: ${decisionMemo.confidenceScore}/100`,
    `Ready: ${decisionMemo.readyCount}/${decisionMemo.totalCount}`,
    `Rule: ${decisionMemo.decisionRule}`,
    `Next action: ${decisionMemo.nextAction}`,
    ...decisionMemo.tests.map((test) => `- [${test.status}] ${test.label}: ${test.test} Evidence: ${test.evidence}`),
    repairImpact
      ? [
          "",
          "## Repair impact",
          `Target: ${repairImpact.targetLabel}`,
          `Target link: ${repairImpact.targetHref}`,
          `Projected score: ${repairImpact.projectedScore}/100`,
          `Score delta: ${repairImpact.scoreDelta >= 0 ? `+${repairImpact.scoreDelta}` : repairImpact.scoreDelta}`,
          `Projected status: ${repairImpact.projectedStatus}`,
          `Next action: ${repairImpact.nextAction}`,
          "",
          "## Owner repair command",
          `Owner: ${repairImpact.ownerCommand.owner}`,
          `Action: ${repairImpact.ownerCommand.action}`,
          "Acceptance criteria:",
          ...repairImpact.ownerCommand.acceptanceCriteria.map((criterion) => `- ${criterion}`),
          `Verification: ${repairImpact.ownerCommand.verification}`
        ].join("\n")
      : "",
    "",
    "## Linked proof",
    `One-pager: ${onePager.receipt.receiptId}`,
    `Claim ledger: ${preview.claimProofLedger.receipt.receiptId}`,
    `Rollout receipt: ${preview.rolloutCommandBoard.receipt.receiptId}`,
    `Publication kit: ${publicationKit.headline}`
  ].join("\n");

  return {
    status,
    score,
    label: globalPublishabilityLabel(status),
    headline,
    summary,
    primaryAction,
    primaryHref,
    sourceReceiptId: onePager.receipt.receiptId,
    sourceChecksum,
    gates,
    freshness,
    certificate,
    reviewerBrief,
    claimAudit,
    valueRoute,
    objectionDeck,
    reviewPacket,
    decisionMemo,
    repairImpact,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

export function buildQuickExternalReviewReadiness(verdict: QuickGlobalPublishabilityBrief): QuickExternalReviewReadiness {
  const headline =
    verdict.status === "ready"
      ? "External review packet can leave the room"
      : verdict.status === "watch"
        ? "External review needs owner review before sharing"
	        : "External review is blocked until proof is repaired";
  const primaryAction =
    verdict.status === "ready" ? "Open the external review desk with the verified packet manifest." : verdict.primaryAction;
  const primaryHref = verdict.status === "ready" ? verdict.reviewPacket.reviewDeskHref : verdict.primaryHref;
  const manifestLine = `${verdict.reviewPacket.manifest.receiptId} / ${verdict.reviewPacket.manifest.checksumAlgorithm}:${verdict.reviewPacket.manifest.checksum}`;
  const certificateHoldReason = verdict.certificate.holdReason || verdict.primaryAction;
  const firstOpenGate = verdict.gates.find((gate) => gate.status !== "ready");
  const repairImpactProofLinkId = verdict.repairImpact ? quickProofLinkIdFromRepairHref(verdict.repairImpact.targetHref) : null;
  const fallbackRepairProofLinkId = firstOpenGate ? quickProofLinkIdFromRepairHref(firstOpenGate.href) : null;
  const fallbackRepairText = firstOpenGate
    ? [
        `Repair owner command: ${firstOpenGate.label}`,
        `Owner: ${firstOpenGate.owner}`,
        `Action: ${firstOpenGate.action}`,
        `Target: ${firstOpenGate.href}`,
        `Impact: ${firstOpenGate.label} must close before external review can advance beyond ${verdict.score}/100.`,
        "",
        "Acceptance criteria",
        `- ${firstOpenGate.label} evidence is ready.`,
        `- External review readiness no longer lists ${firstOpenGate.label} as the first open gate.`,
        "",
        `Verification: Open ${firstOpenGate.href} and rerun the publishability verdict.`
      ].join("\n")
    : "";
  const repairPath: QuickExternalReviewRepairPath | null = verdict.repairImpact
    ? {
        status: verdict.repairImpact.projectedStatus,
        label: "First repair path",
        headline:
          verdict.repairImpact.scoreDelta > 0
            ? `${verdict.repairImpact.targetLabel} raises launch score to ${verdict.repairImpact.projectedScore}/100`
            : `${verdict.repairImpact.targetLabel} unlocks the next repair gate`,
        targetLabel: verdict.repairImpact.targetLabel,
        ...(repairImpactProofLinkId
          ? {
              proofLinkId: repairImpactProofLinkId,
              sampleValue: quickProofRepairSampleValue(repairImpactProofLinkId)
            }
          : {}),
        owner: verdict.repairImpact.ownerCommand.owner,
        action: verdict.repairImpact.ownerCommand.action,
        href: verdict.repairImpact.targetHref,
        currentScore: verdict.repairImpact.currentScore,
        projectedScore: verdict.repairImpact.projectedScore,
        scoreDelta: verdict.repairImpact.scoreDelta,
        projectedStatus: verdict.repairImpact.projectedStatus,
        summary: verdict.repairImpact.summary,
        nextAction: verdict.repairImpact.nextAction,
        acceptanceCriteria: verdict.repairImpact.ownerCommand.acceptanceCriteria,
        verification: verdict.repairImpact.ownerCommand.verification,
        verificationLabel:
          verdict.repairImpact.scoreDelta > 0
            ? `Confirm score moves to ${verdict.repairImpact.projectedScore}/100.`
            : "Confirm the next open gate changes after this repair.",
        exportHref: verdict.repairImpact.ownerCommand.exportHref
      }
    : firstOpenGate
      ? {
          status: verdict.status,
          label: "First repair path",
          headline: `${firstOpenGate.label} is the next launch hold`,
          targetLabel: firstOpenGate.label,
          ...(fallbackRepairProofLinkId
            ? {
                proofLinkId: fallbackRepairProofLinkId,
                sampleValue: quickProofRepairSampleValue(fallbackRepairProofLinkId)
              }
            : {}),
          owner: firstOpenGate.owner,
          action: firstOpenGate.action,
          href: firstOpenGate.href,
          currentScore: verdict.score,
          projectedScore: verdict.score,
          scoreDelta: 0,
          projectedStatus: verdict.status,
          summary: `${firstOpenGate.label} must close before external review can advance beyond ${verdict.score}/100.`,
          nextAction: firstOpenGate.action,
          acceptanceCriteria: [
            `${firstOpenGate.label} evidence is ready.`,
            `External review readiness no longer lists ${firstOpenGate.label} as the first open gate.`
          ],
          verification: `Open ${firstOpenGate.href} and rerun the publishability verdict.`,
          verificationLabel: "Rerun the publishability verdict after this hold closes.",
          exportHref: `data:text/plain;charset=utf-8,${encodeURIComponent(fallbackRepairText)}`
        }
      : null;
  const items: QuickExternalReviewReadinessItem[] = [
    {
      id: "launch-certificate",
      label: "Launch certificate",
      status: verdict.certificate.status,
      value: verdict.certificate.label,
      detail: verdict.certificate.sharePolicy,
      action: verdict.certificate.status === "ready" ? "Open the launch certificate before sharing." : certificateHoldReason,
      href: verdict.certificate.exportHref
    },
    {
      id: "review-packet",
      label: "Review packet",
      status: verdict.reviewPacket.status,
      value: `${verdict.reviewPacket.readyCount}/${verdict.reviewPacket.totalCount} artifacts ready`,
      detail: verdict.reviewPacket.sendRule,
      action: verdict.reviewPacket.nextAction,
      href: verdict.reviewPacket.exportHref
    },
    {
      id: "decision-memo",
      label: "Decision memo",
      status: verdict.decisionMemo.status,
      value: verdict.decisionMemo.reviewerOutcome,
      detail: `${verdict.decisionMemo.confidenceScore}/100 confidence; ${verdict.decisionMemo.readyCount}/${verdict.decisionMemo.totalCount} tests ready.`,
      action: verdict.decisionMemo.nextAction,
      href: verdict.decisionMemo.exportHref
    },
    {
      id: "fresh-proof",
      label: "Fresh proof receipt",
      status: verdict.freshness.status,
      value: verdict.freshness.label,
      detail: verdict.freshness.summary,
      action: verdict.freshness.nextAction,
      href: verdict.freshness.href
    }
  ];
  const sendPacket: QuickExternalReviewSendPacket | null =
    verdict.status === "ready" && verdict.reviewPacket.status === "ready" && verdict.decisionMemo.status === "ready"
      ? buildQuickExternalReviewSendPacket(verdict, manifestLine)
      : null;
  const exportMarkdown = [
    "# External review readiness",
    "",
    `Status: ${verdict.status}`,
    `Launch score: ${verdict.score}/100`,
    `Clearance: ${verdict.certificate.label}`,
    `Primary action: ${primaryAction}`,
    `Primary link: ${primaryHref}`,
    `Source receipt: ${verdict.sourceReceiptId} / ${verdict.sourceChecksum}`,
    `Packet manifest: ${manifestLine}`,
    "",
    "## Summary",
    verdict.summary,
    "",
    "## Readiness chain",
    ...items.map((item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.detail} Next: ${item.action} Link: ${item.href}`),
    repairPath
      ? [
          "",
          "## First repair path",
          `Target: ${repairPath.targetLabel}`,
          `Owner: ${repairPath.owner}`,
          `Action: ${repairPath.action}`,
          `Target link: ${repairPath.href}`,
          `Current score: ${repairPath.currentScore}/100`,
          `Projected score: ${repairPath.projectedScore}/100`,
          `Score delta: ${repairPath.scoreDelta >= 0 ? `+${repairPath.scoreDelta}` : repairPath.scoreDelta}`,
          `Projected status: ${repairPath.projectedStatus}`,
          `Next action: ${repairPath.nextAction}`,
          "Acceptance criteria:",
          ...repairPath.acceptanceCriteria.map((criterion) => `- ${criterion}`),
          `Verification: ${repairPath.verification}`
        ].join("\n")
      : "",
    "",
    "## Share rule",
    verdict.reviewPacket.sendRule,
    sendPacket
      ? [
          "",
          "## Reviewer send packet",
          `Subject: ${sendPacket.subject}`,
          `Decision ask: ${sendPacket.decisionAsk}`,
          `Proof window: ${sendPacket.proofWindow}`,
          `Review desk: ${verdict.reviewPacket.reviewDeskHref}`,
          `Manifest verifier: ${verdict.reviewPacket.manifestVerifierHref}`,
          "Attachments:",
          ...sendPacket.attachments.map((attachment) => `- ${attachment.label}: ${attachment.detail} Link: ${attachment.href}`),
          "Acceptance criteria:",
          ...sendPacket.acceptanceCriteria.map((criterion) => `- ${criterion}`)
        ].join("\n")
      : "",
    "",
    "## Reviewer decision",
    `Outcome: ${verdict.decisionMemo.reviewerOutcome}`,
    `Confidence: ${verdict.decisionMemo.confidenceScore}/100`,
    `Rule: ${verdict.decisionMemo.decisionRule}`,
    `Next action: ${verdict.decisionMemo.nextAction}`
  ].join("\n");

  return {
    status: verdict.status,
    label: "External review readiness",
    headline,
    summary: verdict.summary,
    scoreLine: `${verdict.score}/100 launch score`,
    clearance: verdict.certificate.label,
    primaryAction,
    primaryHref,
    receiptLine: `${verdict.sourceReceiptId} / ${verdict.sourceChecksum}`,
    manifestLine,
    manifestVerificationStorageKey: verdict.reviewPacket.manifestVerificationStorageKey,
    manifestVerificationRequestJson: verdict.reviewPacket.manifestVerificationRequestJson,
    verifyHref: verdict.reviewPacket.manifestVerifierHref,
    items,
    repairPath,
    sendPacket,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildQuickExternalReviewSendPacket(verdict: QuickGlobalPublishabilityBrief, manifestLine: string): QuickExternalReviewSendPacket {
  const buyer = verdict.reviewPacket.manifest.buyer;
  const subject = `External review packet: ${buyer}`;
  const decisionAsk = "Verify the manifest, read the artifacts in order, then choose continue, revise, or stop from the proof.";
  const proofWindow = verdict.freshness.expiresAt
    ? `Live proof is valid until ${verdict.freshness.expiresAt}.`
    : verdict.freshness.summary;
  const attachments = [
    {
      label: "Review desk",
      detail: "Open the verified packet and export the reviewer decision receipt.",
      href: verdict.reviewPacket.reviewDeskHref
    },
    {
      label: "Manifest verifier",
      detail: manifestLine,
      href: verdict.reviewPacket.manifestVerifierHref
    },
    {
      label: "Readiness memo",
      detail: `${verdict.score}/100 launch score and clearance chain.`,
      href: verdict.exportHref,
      download: "quick-global-publishability-brief.md"
    },
    {
      label: "Packet memo",
      detail: `${verdict.reviewPacket.readyCount}/${verdict.reviewPacket.totalCount} artifacts ready.`,
      href: verdict.reviewPacket.exportHref,
      download: "quick-external-review-packet.md"
    },
    {
      label: "Artifact bundle",
      detail: "All packet artifact markdown sealed against the manifest.",
      href: verdict.reviewPacket.artifactBundleHref,
      download: "quick-external-review-artifact-bundle.json"
    },
    {
      label: "Decision memo",
      detail: `${verdict.decisionMemo.confidenceScore}/100 reviewer confidence tests.`,
      href: verdict.decisionMemo.exportHref,
      download: "quick-external-reviewer-decision-memo.md"
    }
  ];
  const acceptanceCriteria = [
    "Reviewer verifies the manifest before reading artifacts.",
    "Reviewer starts with the launch certificate and freshness window.",
    "Reviewer exports a continue, revise, or stop decision receipt from the review desk."
  ];
  const messageText = [
    `Please review the verified packet for ${buyer}.`,
    "",
    decisionAsk,
    proofWindow,
    "",
    `Review desk: ${verdict.reviewPacket.reviewDeskHref}`,
    `Manifest verifier: ${verdict.reviewPacket.manifestVerifierHref}`,
    `Manifest: ${manifestLine}`,
    "",
    "Read order:",
    "1. Launch certificate",
    "2. Reviewer brief",
    "3. Claim audit",
    "4. Review-to-value route",
    "5. Objection answers",
    "6. Proof freshness",
    "",
    "Acceptance criteria:",
    ...acceptanceCriteria.map((criterion) => `- ${criterion}`)
  ].join("\n");
  return {
    headline: "Sendable reviewer message is ready",
    summary: `${buyer} gets one verified review desk, one manifest verifier, and a clear decision ask.`,
    subject,
    messageText,
    proofWindow,
    decisionAsk,
    attachments,
    acceptanceCriteria
  };
}

function quickBuyerEvidenceStatusLabel(status: QuickBuyerRoomPreviewStatus) {
  if (status === "ready") return "Ready";
  if (status === "watch") return "Needs repair";
  return "Blocked";
}

export function QuickSponsorSendGatePanel({ gate }: { gate: QuickSponsorSendGate }) {
  return (
    <div className={cx("quick-sponsor-send-gate", gate.status)} aria-label="Sponsor send gate">
      <div className="quick-sponsor-send-gate-main">
        <span>
          <ShieldCheck size={14} />
          Sponsor send gate
        </span>
        <strong>{gate.headline}</strong>
        <p>{gate.summary}</p>
        <div className="quick-sponsor-send-gate-actions" aria-label="Sponsor send gate actions">
          <a href={gate.exportHref} download="quick-sponsor-send-gate.md">
            <Download size={14} />
            Gate memo
          </a>
          <a href={gate.receiptHref} download={`${gate.receipt.receiptId}.json`}>
            <FileText size={14} />
            Gate receipt
          </a>
          <a href={gate.verifierHref} target="_blank" rel="noreferrer">
            <ShieldCheck size={14} />
            Verify source
          </a>
        </div>
      </div>
      <aside className="quick-sponsor-send-gate-score" aria-label="Sponsor send gate score">
        <span>{gate.label}</span>
        <strong>{gate.score}/100</strong>
        <small>
          {gate.readyCount}/{gate.totalCount} checks ready
        </small>
        <small>{gate.sourceReceiptId}</small>
        <small>{gate.sourceChecksum}</small>
      </aside>
      <div className="quick-sponsor-send-gate-rule">
        <span>Send rule</span>
        <strong>{gate.sendRule}</strong>
        <small>
          {gate.nextOwner}: {gate.nextAction}
        </small>
      </div>
      <div className="quick-sponsor-send-gate-checks" aria-label="Sponsor send gate checks">
        {gate.checks.map((check) => (
          <a key={check.id} className={check.status} href={check.href}>
            <span>{check.status === "ready" ? "Ready" : check.status === "watch" ? "Review" : "Blocked"}</span>
            <strong>{check.label}</strong>
            <p>{check.answer}</p>
            <small>{check.owner}</small>
            <em>{check.action}</em>
          </a>
        ))}
      </div>
    </div>
  );
}

export function QuickPublicValueReleaseGatePanel({ gate }: { gate: QuickPublicValueReleaseGate }) {
  return (
    <div className={cx("quick-public-value-release-gate", gate.status)} aria-label="Public value release gate">
      <div className="quick-public-value-release-main">
        <span>
          <Gauge size={14} />
          Public value release
        </span>
        <strong>{gate.headline}</strong>
        <p>{gate.summary}</p>
        <div className="quick-public-value-release-actions" aria-label="Public value release actions">
          <a href={gate.exportHref} download="quick-public-value-release-gate.md">
            <Download size={14} />
            Release memo
          </a>
          <a href={gate.receipt.verificationRequestHref} download={`${gate.receipt.receiptId}-verify.json`}>
            <FileText size={14} />
            Release receipt
          </a>
          <a
            href={gate.verifierHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => storeReceiptVerifierRequest(gate.receipt.receiptId, gate.receipt.verificationRequestJson)}
          >
            <ShieldCheck size={14} />
            Verify release
          </a>
          <a href={`#${QUICK_LIVE_PROOF_AUDIT_ID}`}>
            <ShieldCheck size={14} />
            Live proof
          </a>
        </div>
      </div>
      <aside className="quick-public-value-release-score" aria-label="Public value release score">
        <span>{gate.label}</span>
        <strong>{gate.releaseScore}/100</strong>
        <small>Shareable {formatYen(gate.shareableMonthlyValueYen)}</small>
        <small>Locked {formatYen(gate.lockedMonthlyValueYen)}</small>
      </aside>
      <div className="quick-public-value-release-rule">
        <span>Release rule</span>
        <strong>{gate.releaseRule}</strong>
        <small>
          {gate.nextOwner}: {gate.nextAction}
        </small>
        <small>{gate.sourceReceiptId}</small>
        <small>{gate.sourceChecksum}</small>
        <small>
          {gate.receipt.receiptId} / {gate.receipt.checksumAlgorithm}:{gate.receipt.checksum}
        </small>
      </div>
      <div className="quick-public-value-release-checks" aria-label="Public value release checks">
        {gate.checks.map((check) => (
          <a key={check.id} className={check.status} href={check.href}>
            <span>{check.status === "ready" ? "Ready" : check.status === "watch" ? "Review" : "Blocked"}</span>
            <strong>{check.label}</strong>
            <p>{check.value}</p>
            <small>{check.owner}</small>
            <em>{check.action}</em>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function QuickWorkflowIntakePanel({
  currentOpenCount,
  currentPrimaryAction,
  onApplyDraft,
  launchRoomHref,
  reviewKitHref,
  acceptancePathHref,
  decisionReceiptHref,
  trustManifestHref,
  deliveryMemoHref,
  buyerEvidenceResponseTarget,
  onCopyText,
  variant = "embedded"
}: QuickWorkflowIntakePanelProps) {
  const [initialBrowserDraftRestore] = useState(() => readQuickWorkflowBrowserDraftRestore());
  const [browserDraft, setBrowserDraft] = useState<QuickWorkflowBrowserDraft | null>(() => initialBrowserDraftRestore?.draft ?? null);
  const [rawIntake, setRawIntake] = useState(() =>
    browserDraft
      ? buildQuickWorkflowBrowserDraft(browserDraft.rawIntake, browserDraft.guidedFields, browserDraft.draft, browserDraft.savedAt).rawIntake
      : variant === "topline"
        ? buildQuickWorkflowIntakeExample({ proofBaseUrl: currentPublicOrigin() || SUBMISSION_PROOF.deployedUrl })
        : ""
  );
  const [guidedFields, setGuidedFields] = useState(() =>
    browserDraft?.guidedFields ?? (variant === "topline" ? quickWorkflowReferenceGuidedFields({ proofBaseUrl: currentPublicOrigin() || SUBMISSION_PROOF.deployedUrl }) : defaultQuickWorkflowGuidedFields())
  );
  const [draft, setDraft] = useState<WorkflowIntakeDraft | null>(() => browserDraft?.draft ?? null);
  const [status, setStatus] = useState<QuickWorkflowIntakeStatus>(() => (browserDraft?.draft ? "previewed" : "idle"));
  const [draftPersistenceStatus, setDraftPersistenceStatus] = useState<QuickWorkflowBrowserDraftStatus>(() =>
    initialBrowserDraftRestore?.source === "share-link" ? "link-restored" : browserDraft ? "restored" : "idle"
  );
  const [extractionResult, setExtractionResult] = useState<QuickWorkflowExtractionResult | null>(null);
  const [extractionReceiptVerifyStatus, setExtractionReceiptVerifyStatus] = useState<QuickExtractionReceiptStatus>("idle");
  const [extractionReceiptVerifyError, setExtractionReceiptVerifyError] = useState("");
  const [conversionReceiptVerifyStatus, setConversionReceiptVerifyStatus] = useState<QuickExtractionReceiptStatus>("idle");
  const [conversionReceiptVerifyMessage, setConversionReceiptVerifyMessage] = useState("Conversion receipt not checked in this browser yet.");
  const [verifyStatus, setVerifyStatus] = useState<QuickLiveProofStatus>("idle");
  const [liveProof, setLiveProof] = useState<BuyerShareGateProofVerificationSummary | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [launchPacketCopyStatus, setLaunchPacketCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [draftLinkCopyStatus, setDraftLinkCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [safeDraftLinkCopyStatus, setSafeDraftLinkCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [sharedReviewBriefCopyStatus, setSharedReviewBriefCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [sharedDecisionReplyCopyStatus, setSharedDecisionReplyCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [externalReviewSendCopyStatus, setExternalReviewSendCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [rolloutStartDate, setRolloutStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [buyerReplyText, setBuyerReplyText] = useState("");
  const [buyerValidationAnswerText, setBuyerValidationAnswerText] = useState("");
  const [sharedExternalReviewPacketText] = useState(() => quickExternalReviewPacketTextFromUrl());
  const [externalReviewResponseText, setExternalReviewResponseText] = useState(() => quickExternalReviewResponseTextFromUrl());
  const [buyerEvidenceResponseText, setBuyerEvidenceResponseText] = useState(() => quickBuyerEvidenceResponseTextFromUrl());
  const [valueRealizationCloseoutText, setValueRealizationCloseoutText] = useState("");
  const [valueRealizationRepairAcknowledgementText, setValueRealizationRepairAcknowledgementText] = useState("");
  const [valueReviewExecutionCloseoutText, setValueReviewExecutionCloseoutText] = useState("");
  const rawIntakeRef = useRef<HTMLTextAreaElement | null>(null);
  const buyerEvidenceResponseIntakeRef = useRef<HTMLDivElement | null>(null);
  const browserDraftImportInputRef = useRef<HTMLInputElement | null>(null);
  const sharedDraftAutoPreviewStartedRef = useRef(false);
  const responseReturnAutoPreviewStartedRef = useRef(false);
  const buyerEvidenceResponseAutoScrollDoneRef = useRef(false);
  const guidedReadyCount = quickWorkflowGuidedReadyCount(guidedFields);
  const guidedProofReadyCount = quickWorkflowGuidedProofReadyCount(guidedFields);
  const browserDraftHasContent = Boolean(rawIntake.trim() || guidedReadyCount > 0 || draft);
  const guidedProofChecks = useMemo(() => buildQuickWorkflowGuidedProofChecks(guidedFields), [guidedFields]);
  const guidedWorkflowNote = useMemo(() => buildQuickWorkflowNoteFromFields(guidedFields), [guidedFields]);
  const guidedInputIsSource = guidedWorkflowNote.trim().length > 0 && rawIntake.trim() === guidedWorkflowNote.trim();
  const sharedBrowserDraft = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      return parseQuickWorkflowBrowserDraftShareParam(new URL(window.location.href).searchParams.get(QUICK_WORKFLOW_BROWSER_DRAFT_SHARE_PARAM));
    } catch {
      return null;
    }
  }, []);
  const importedExternalReviewPacket = useMemo(
    () => importedQuickExternalReviewPacketFromRequestJson(sharedExternalReviewPacketText),
    [sharedExternalReviewPacketText]
  );
  const rawReadinessDraft = useMemo(() => draft ?? buildWorkflowIntakeDraftFromText(rawIntake), [draft, rawIntake]);
  const inputReadiness = useMemo(() => buildQuickWorkflowInputReadiness(rawIntake, rawReadinessDraft), [rawIntake, rawReadinessDraft]);
  const extractionGuardrailAudit = useMemo(() => quickWorkflowExtractionGuardrailAudit(draft?.warnings ?? []), [draft]);
  const valueDiagnosis = useMemo(
    () => (rawIntake.trim() || draft ? buildQuickWorkflowValueDiagnosis(rawReadinessDraft, inputReadiness) : null),
    [draft, inputReadiness, rawIntake, rawReadinessDraft]
  );
  const commercialPilotOffer = useMemo(
    () => (valueDiagnosis ? buildQuickWorkflowCommercialPilotOffer(rawReadinessDraft, inputReadiness, valueDiagnosis) : null),
    [inputReadiness, rawReadinessDraft, valueDiagnosis]
  );
  const liveBuyerCase = useMemo(
    () => (rawIntake.trim() && !draft ? buildQuickWorkflowLiveBuyerCase(rawReadinessDraft, inputReadiness) : null),
    [draft, inputReadiness, rawIntake, rawReadinessDraft]
  );
  const a2aTrialStarter = useMemo(
    () => (rawIntake.trim() || draft ? buildQuickA2ATrialStarter(rawReadinessDraft, inputReadiness, rawIntake) : null),
    [draft, inputReadiness, rawIntake, rawReadinessDraft]
  );
  const guidedValueTuneLevers = guidedInputIsSource
    ? (valueDiagnosis?.levers.filter((lever) => lever.targetAction && lever.targetField && lever.targetValue) ?? [])
    : [];
  const roomPreview = draft ? buildQuickBuyerRoomPreview(draft, currentOpenCount) : null;
  const decisionOnePager = roomPreview ? buildQuickBuyerDecisionOnePager(roomPreview) : null;
  const decisionReplyDeck = roomPreview && decisionOnePager ? buildQuickBuyerDecisionReplyDeck(roomPreview, decisionOnePager) : null;
  const decisionReplyRecord =
    roomPreview && decisionOnePager && buyerReplyText.trim()
      ? buildQuickBuyerDecisionReplyRecord(roomPreview, decisionOnePager, buyerReplyText)
      : null;
  const validationAnswerRecord =
    roomPreview && buyerValidationAnswerText.trim() ? buildQuickBuyerValidationAnswerRecord(roomPreview, buyerValidationAnswerText) : null;
  const validationCallBrief = roomPreview ? buildQuickBuyerValidationCallBrief(roomPreview, validationAnswerRecord) : null;
  const decisionReplyReviewKitHref = decisionReplyRecord
    ? buyerReviewKitReplyRecordHref(decisionReplyRecord.receipt.verificationRequestJson, reviewKitHref || decisionReplyRecord.reviewKitHref)
    : "";
  const decisionReplyAcceptancePathHref = decisionReplyRecord
    ? buyerAcceptancePathReplyRecordHref(decisionReplyRecord.receipt.verificationRequestJson, acceptancePathHref || decisionReplyRecord.acceptancePathHref)
    : "";
  const validationAnswerReviewKitHref = validationAnswerRecord
    ? buyerReviewKitValidationAnswerRecordHref(validationAnswerRecord.receipt.verificationRequestJson, decisionReplyReviewKitHref || reviewKitHref || "/buyer-review-kit")
    : "";
  const validationAnswerAcceptancePathHref = validationAnswerRecord
    ? buyerAcceptancePathValidationAnswerRecordHref(
        validationAnswerRecord.receipt.verificationRequestJson,
        decisionReplyAcceptancePathHref || acceptancePathHref || "/buyer-acceptance-path"
      )
    : "";
  const decisionActivationBrief =
    roomPreview && decisionReplyDeck && decisionOnePager ? buildQuickBuyerDecisionActivationBrief(roomPreview, decisionReplyDeck, decisionOnePager) : null;
  const decisionSuccessCommitment = roomPreview && decisionOnePager ? buildQuickBuyerDecisionSuccessCommitment(roomPreview, decisionOnePager) : null;
  const roomPreviewHref = roomPreview ? `data:text/markdown;charset=utf-8,${encodeURIComponent(roomPreview.exportMarkdown)}` : "";
  const appliedLaunchPacket =
    roomPreview && status === "applied"
      ? buildQuickAppliedLaunchPacket(roomPreview, {
          launchRoomHref,
          reviewKitHref,
          acceptancePathHref,
          decisionReceiptHref,
          trustManifestHref,
          deliveryMemoHref
        })
      : null;
  const publicationKit = draft && roomPreview ? buildQuickPublicationKit(draft, roomPreview) : null;
  const liveProofAudit = roomPreview
    ? buildQuickLiveProofAudit({
        proofRepairPlan: roomPreview.proofRepairPlan,
        proofVerification: liveProof,
        proofVerifyError: verifyError
      })
    : null;
  const publicValueReleaseGate =
    roomPreview && publicationKit
      ? buildQuickPublicValueReleaseGate({
          preview: roomPreview,
          publicationKit,
          liveProofAudit
        })
      : null;
  const proofPreflightRepairItems = roomPreview?.proofRepairPlan.items.filter((item) => item.status !== "ready").slice(0, 3) ?? [];
  const publishabilityBrief =
    draft && roomPreview && publicationKit && decisionOnePager && decisionSuccessCommitment
      ? buildQuickGlobalPublishabilityBrief(draft, roomPreview, publicationKit, decisionOnePager, decisionSuccessCommitment, currentOpenCount, { liveProofAudit })
      : null;
  const externalReviewReadiness = publishabilityBrief ? buildQuickExternalReviewReadiness(publishabilityBrief) : null;
  const externalReviewRepairProofLinkId = externalReviewReadiness?.repairPath?.proofLinkId ?? null;
  const externalReviewRepairValue = externalReviewRepairProofLinkId && draft ? (draft.proofLinks[externalReviewRepairProofLinkId] ?? "") : "";
  const externalReviewResponsePacket = publishabilityBrief ? (importedExternalReviewPacket ?? publishabilityBrief.reviewPacket) : null;
  const externalReviewResponsePlan =
    publishabilityBrief && externalReviewResponsePacket
      ? buildQuickExternalReviewResponseActionPlan(externalReviewResponseText, externalReviewResponsePacket)
      : null;
  const buyerEvidenceResponseImportTarget = buyerEvidenceResponseTarget ?? roomPreview;
  const buyerEvidenceResponsePlan = buyerEvidenceResponseImportTarget ? buildQuickBuyerEvidenceResponseImportPlan(buyerEvidenceResponseText, buyerEvidenceResponseImportTarget) : null;
  const liveProofAuditHref = liveProofAudit ? `data:text/markdown;charset=utf-8,${encodeURIComponent(liveProofAudit.exportMarkdown)}` : "";
  const proofVerificationHandoff =
    roomPreview && liveProofAudit
      ? buildQuickProofVerificationHandoff({
          proofRepairPlan: roomPreview.proofRepairPlan,
          liveProofAudit
        })
      : null;
  const liveProofAuditVerifierHref = liveProofAudit ? receiptVerifierPrefillHref(liveProofAudit.verificationRequestJson) : "";
  const proofReplacementPacket = draft
    ? buildQuickProofReplacementPacket(draft, {
        proofVerification: liveProof,
        workflowIntakeHref: `#${QUICK_PROOF_REPAIR_PLAN_ID}`,
        currentAuditHref: `#${QUICK_LIVE_PROOF_AUDIT_ID}`,
        launchRoomHref: launchRoomHref || "#quick-workflow-intake"
      })
    : null;
  const proofReplacementExportHref = proofReplacementPacket ? `data:text/markdown;charset=utf-8,${encodeURIComponent(proofReplacementPacket.exportMarkdown)}` : "";
  const proofReplacementCsvHref = proofReplacementPacket ? `data:text/csv;charset=utf-8,${encodeURIComponent(proofReplacementPacket.csv)}` : "";
  const proofReplacementVerifierHref = proofReplacementPacket ? receiptVerifierPrefillHref(proofReplacementPacket.receipt.verificationRequestJson) : "";
  const rolloutCalendarExport = roomPreview && rolloutStartDate ? buildQuickRolloutCalendarExport(roomPreview.rolloutCommandBoard, rolloutStartDate) : null;
  const valueRealizationCalendarExport =
    decisionSuccessCommitment && rolloutStartDate
      ? buildQuickValueRealizationCalendarExport(decisionSuccessCommitment.valueRealizationLedger, rolloutStartDate)
      : null;
  const valueRealizationCloseout =
    roomPreview && decisionSuccessCommitment
      ? buildQuickValueRealizationCloseout({
          preview: roomPreview,
          commitment: decisionSuccessCommitment,
          evidenceText: valueRealizationCloseoutText
        })
      : null;
  const valueRealizationRepairAcknowledgement = valueRealizationCloseout
    ? buildQuickValueRealizationCloseoutRepairAcknowledgement({
        closeout: valueRealizationCloseout,
        ownerEvidenceText: valueRealizationRepairAcknowledgementText
      })
    : null;
  const valueRealizationAcceptancePacket =
    valueRealizationCloseout && valueRealizationRepairAcknowledgement
      ? buildQuickValueRealizationAcceptancePacket({
          closeout: valueRealizationCloseout,
          repairAcknowledgement: valueRealizationRepairAcknowledgement
        })
      : null;
  const valueRealizationBuyerReviewDossier =
    valueRealizationCloseout && valueRealizationRepairAcknowledgement && valueRealizationAcceptancePacket
      ? buildQuickValueRealizationBuyerReviewDossier({
          closeout: valueRealizationCloseout,
          repairAcknowledgement: valueRealizationRepairAcknowledgement,
          acceptance: valueRealizationAcceptancePacket
        })
      : null;
  const valueReviewExecutionPacket =
    valueRealizationCloseout && valueRealizationAcceptancePacket && valueRealizationBuyerReviewDossier
      ? buildQuickValueReviewExecutionPacket({
          closeout: valueRealizationCloseout,
          acceptance: valueRealizationAcceptancePacket,
          dossier: valueRealizationBuyerReviewDossier
        })
      : null;
  const valueReviewExecutionCloseout = valueReviewExecutionPacket
    ? buildQuickValueReviewExecutionCloseout({
        executionPacket: valueReviewExecutionPacket,
        evidenceText: valueReviewExecutionCloseoutText
      })
    : null;
  const canPreview = rawIntake.trim().length > 0 && status !== "extracting";
  const applyGate = quickWorkflowApplyGate(inputReadiness, Boolean(draft), status === "extracting");
  const canApply = Boolean(applyGate.canApply && status !== "applied");
  const applyGateMessage = status === "applied" ? "Workspace was updated from a buyer-ready note." : applyGate.message;
  const proofRepairComplete = Boolean(roomPreview && roomPreview.proofRepairPlan.repairCount === 0);
  const liveProofFreshness = quickLiveProofFreshness(liveProofAudit);
  const liveProofVerified = liveProofFreshness.isFresh;
  const statusLabel =
    status === "extracting"
      ? "Reading note"
      : status === "applied"
        ? "Workspace updated"
          : status === "failed"
            ? "Needs clearer input"
            : draft
              ? `${draft.confidence}/100 extraction confidence`
              : rawIntake.trim()
                ? `${inputReadiness.readyCount}/${inputReadiness.totalCount} buyer facts ready for preview`
              : currentOpenCount > 0
                ? `Paste one workflow note to replace ${currentOpenCount} repair item${currentOpenCount === 1 ? "" : "s"}`
                : "Paste one workflow note to generate a buyer room";
  const appliedLaunchRoomLink = appliedLaunchPacket?.links.find((link) => link.id === "launch-room");
  const appliedLiveProofPending = Boolean(appliedLaunchPacket && liveProofAudit && !liveProofVerified);
  const verifiedLaunchRoomHref =
    appliedLaunchRoomLink && liveProofVerified && liveProofAudit
      ? buildQuickVerifiedLaunchRoomHref(appliedLaunchRoomLink.href, liveProofAudit)
      : (appliedLaunchRoomLink?.href ?? "");
  const appliedLaunchMessageText =
    appliedLaunchPacket && liveProofVerified && liveProofAudit
      ? buildQuickVerifiedLaunchMessage(appliedLaunchPacket, liveProofAudit, verifiedLaunchRoomHref)
      : appliedLaunchPacket && appliedLiveProofPending && liveProofAudit
        ? buildQuickLiveProofPendingMessage(appliedLaunchPacket, liveProofAudit)
        : (appliedLaunchPacket?.messageText ?? "");
  const appliedLaunchExportMarkdown =
    appliedLaunchPacket && liveProofVerified && liveProofAudit
      ? buildQuickVerifiedLaunchExportMarkdown(appliedLaunchPacket, liveProofAudit, verifiedLaunchRoomHref)
      : appliedLaunchPacket && appliedLiveProofPending && liveProofAudit
        ? buildQuickLiveProofPendingExportMarkdown(appliedLaunchPacket, liveProofAudit)
        : (appliedLaunchPacket?.exportMarkdown ?? "");
  const appliedLaunchExportHref = appliedLaunchPacket ? `data:text/markdown;charset=utf-8,${encodeURIComponent(appliedLaunchExportMarkdown)}` : "";
  const appliedLaunchExportFilename = liveProofVerified ? "verified-buyer-launch-packet.md" : "applied-buyer-launch-packet.md";
  const appliedLaunchLinks =
    appliedLaunchPacket?.links
      .filter((link) => link.id !== "launch-room" || (appliedLaunchPacket.status === "ready" && liveProofVerified))
      .map((link) =>
        link.id === "launch-room" && verifiedLaunchRoomHref
          ? {
              ...link,
              href: verifiedLaunchRoomHref,
              role: "Buyer-facing room with verified live proof receipt"
            }
          : link
      ) ?? [];
  const copyLaunchPacketLabel =
    launchPacketCopyStatus === "copied"
      ? "Copied"
      : launchPacketCopyStatus === "failed"
        ? "Copy failed"
        : liveProofVerified
          ? "Copy verified message"
          : appliedLiveProofPending
            ? "Copy internal note"
            : "Copy message";
  const draftLinkCopyLabel = draftLinkCopyStatus === "copied" ? "Copied link" : draftLinkCopyStatus === "failed" ? "Copy failed" : "Copy link";
  const safeDraftLinkCopyLabel =
    safeDraftLinkCopyStatus === "copied" ? "Copied safe link" : safeDraftLinkCopyStatus === "failed" ? "Copy failed" : "Copy safe link";
  const browserDraftRestoredFromShareLink =
    Boolean(sharedBrowserDraft && rawIntake.trim() === sharedBrowserDraft.rawIntake.trim()) &&
    draftPersistenceStatus !== "failed" &&
    draftPersistenceStatus !== "import-failed" &&
    draftPersistenceStatus !== "cleared" &&
    draftPersistenceStatus !== "imported";
  const sharedWorkflowReviewBrief = browserDraftRestoredFromShareLink && roomPreview ? buildQuickSharedWorkflowReviewBrief(roomPreview) : null;
  const sharedDecisionReplyOption =
    sharedWorkflowReviewBrief && decisionReplyDeck
      ? (decisionReplyDeck.options.find((option) => option.id === decisionReplyDeck.recommendedOptionId) ?? decisionReplyDeck.options[0])
      : null;
  const sharedReviewBriefCopyLabel =
    sharedReviewBriefCopyStatus === "copied" ? "Copied brief" : sharedReviewBriefCopyStatus === "failed" ? "Copy failed" : "Copy review brief";
  const sharedDecisionReplyCopyLabel =
    sharedDecisionReplyCopyStatus === "copied" ? "Copied decision" : sharedDecisionReplyCopyStatus === "failed" ? "Copy failed" : "Copy decision";
  const externalReviewSendCopyLabel =
    externalReviewSendCopyStatus === "copied" ? "Copied message" : externalReviewSendCopyStatus === "failed" ? "Copy failed" : "Copy message";
  const browserDraftHeadline =
    draftPersistenceStatus === "failed"
      ? "Browser could not save this draft"
      : draftPersistenceStatus === "import-failed"
        ? "Draft import failed"
      : draftPersistenceStatus === "cleared"
        ? "Draft cleared"
        : draftPersistenceStatus === "imported"
          ? "Imported draft"
        : browserDraftRestoredFromShareLink
          ? "Restored shared link"
        : draftPersistenceStatus === "restored"
          ? "Restored saved draft"
          : browserDraftHasContent
            ? "Draft saved in this browser"
            : "Draft saves in this browser";
  const browserDraftDetail =
    draftPersistenceStatus === "failed"
      ? "Copy the note before leaving this tab."
      : draftPersistenceStatus === "import-failed"
        ? "Use a quick-workflow-draft.json exported from this panel."
      : draftPersistenceStatus === "cleared"
        ? "Start a new workflow note when you are ready."
      : draftPersistenceStatus === "imported"
        ? "Imported locally. You can preview, edit, or apply it."
      : browserDraftRestoredFromShareLink
        ? status === "extracting"
          ? "This link restored the workflow note. Preparing the buyer room locally."
          : draft
            ? "This link restored the workflow note and prepared the buyer room locally."
            : "This link restored the workflow note and guided facts locally."
      : browserDraftHasContent && browserDraft?.savedAt
        ? quickWorkflowBrowserDraftSavedAtLabel(browserDraft.savedAt)
        : "Your workflow note, guided facts, and preview stay available after refresh.";

  useEffect(() => {
    if (launchPacketCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setLaunchPacketCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [launchPacketCopyStatus]);

  useEffect(() => {
    if (draftLinkCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setDraftLinkCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [draftLinkCopyStatus]);

  useEffect(() => {
    if (safeDraftLinkCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setSafeDraftLinkCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [safeDraftLinkCopyStatus]);

  useEffect(() => {
    if (sharedReviewBriefCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setSharedReviewBriefCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [sharedReviewBriefCopyStatus]);

  useEffect(() => {
    if (sharedDecisionReplyCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setSharedDecisionReplyCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [sharedDecisionReplyCopyStatus]);

  useEffect(() => {
    if (externalReviewSendCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setExternalReviewSendCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [externalReviewSendCopyStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timeout = window.setTimeout(() => {
      if (!browserDraftHasContent) {
        clearQuickWorkflowBrowserDraft();
        setBrowserDraft(null);
        return;
      }
      const nextBrowserDraft = buildQuickWorkflowBrowserDraft(rawIntake, guidedFields, draft);
      if (writeQuickWorkflowBrowserDraft(nextBrowserDraft)) {
        setBrowserDraft(nextBrowserDraft);
        setDraftPersistenceStatus((currentStatus) =>
          currentStatus === "restored" || currentStatus === "link-restored" || currentStatus === "imported" ? currentStatus : "saved"
        );
      } else {
        setDraftPersistenceStatus("failed");
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [browserDraftHasContent, draft, guidedFields, rawIntake]);

  useEffect(() => {
    if (!sharedBrowserDraft || sharedDraftAutoPreviewStartedRef.current || draft || status !== "idle") return;
    const intakeText = rawIntake.trim();
    if (!intakeText || intakeText !== sharedBrowserDraft.rawIntake.trim()) return;

    let cancelled = false;
    sharedDraftAutoPreviewStartedRef.current = true;
    setExtractionResult(null);
    setStatus("extracting");
    void buildLocalWorkflowExtractionResult(intakeText, "Shared workflow link used the audited local parser so the buyer room is ready on open.", [
      "Shared workflow link used the audited local parser for immediate reviewer preview."
    ])
      .then((payload) => {
        if (cancelled) return;
        setDraft(payload.draft);
        setExtractionResult(payload);
        setStatus(payload.draft.detectedSignals.length > 0 ? "previewed" : "failed");
      })
      .catch(() => {
        if (cancelled) return;
        setExtractionResult(null);
        setStatus("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [draft, rawIntake, sharedBrowserDraft, status]);

  useEffect(() => {
    const hasReturnedResponse = Boolean(buyerEvidenceResponseText.trim() || externalReviewResponseText.trim());
    if (!hasReturnedResponse || responseReturnAutoPreviewStartedRef.current || draft || status !== "idle") return;
    const intakeText = rawIntake.trim();
    if (!intakeText) return;

    let cancelled = false;
    responseReturnAutoPreviewStartedRef.current = true;
    setExtractionResult(null);
    setStatus("extracting");
    void buildLocalWorkflowExtractionResult(intakeText, "Returned reviewer response used the audited local parser so the matching buyer room is ready on open.", [
      "Returned reviewer response triggered audited local parser preview before importing the response."
    ])
      .then((payload) => {
        if (cancelled) return;
        setDraft(payload.draft);
        setExtractionResult(payload);
        setStatus(payload.draft.detectedSignals.length > 0 ? "previewed" : "failed");
      })
      .catch(() => {
        if (cancelled) return;
        setExtractionResult(null);
        setStatus("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [buyerEvidenceResponseText, draft, externalReviewResponseText, rawIntake, status]);

  useEffect(() => {
    if (!buyerEvidenceResponseText.trim() || !buyerEvidenceResponsePlan || buyerEvidenceResponsePlan.state === "empty" || buyerEvidenceResponseAutoScrollDoneRef.current) return;
    if (responseReturnAutoPreviewStartedRef.current && !draft && status !== "failed") return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        buyerEvidenceResponseAutoScrollDoneRef.current = true;
        buyerEvidenceResponseIntakeRef.current?.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
      });
    });
  }, [buyerEvidenceResponsePlan, buyerEvidenceResponseText, draft, status]);

  function resetLiveVerification() {
    setVerifyStatus("idle");
    setLiveProof(null);
    setVerifyError("");
  }

  function resetExtractionReceiptVerification() {
    setExtractionReceiptVerifyStatus("idle");
    setExtractionReceiptVerifyError("");
  }

  function resetConversionReceiptVerification() {
    setConversionReceiptVerifyStatus("idle");
    setConversionReceiptVerifyMessage("Conversion receipt not checked in this browser yet.");
  }

  function clearWorkflowInputPreview() {
    setDraft(null);
    setExtractionResult(null);
    setStatus("idle");
    setBuyerReplyText("");
    setExternalReviewResponseText("");
    setBuyerEvidenceResponseText("");
    setDraftLinkCopyStatus("idle");
    setSafeDraftLinkCopyStatus("idle");
    setSharedReviewBriefCopyStatus("idle");
    setSharedDecisionReplyCopyStatus("idle");
    setExternalReviewSendCopyStatus("idle");
    setDraftPersistenceStatus("idle");
    resetLiveVerification();
    resetExtractionReceiptVerification();
    resetConversionReceiptVerification();
  }

  function resetWorkflowBrowserDraft() {
    setRawIntake("");
    setGuidedFields(defaultQuickWorkflowGuidedFields());
    clearWorkflowInputPreview();
    setLaunchPacketCopyStatus("idle");
    setDraftLinkCopyStatus("idle");
    setSafeDraftLinkCopyStatus("idle");
    setSharedReviewBriefCopyStatus("idle");
    setSharedDecisionReplyCopyStatus("idle");
    setExternalReviewSendCopyStatus("idle");
    setBrowserDraft(null);
    setDraftPersistenceStatus("cleared");
    clearQuickWorkflowBrowserDraft();
  }

  function exportWorkflowBrowserDraft() {
    if (!browserDraftHasContent) return;
    const nextBrowserDraft = buildQuickWorkflowBrowserDraft(rawIntake, guidedFields, draft);
    downloadJsonFile(QUICK_WORKFLOW_BROWSER_DRAFT_FILENAME, nextBrowserDraft);
    if (writeQuickWorkflowBrowserDraft(nextBrowserDraft)) {
      setBrowserDraft(nextBrowserDraft);
      setDraftPersistenceStatus("saved");
    } else {
      setDraftPersistenceStatus("failed");
    }
  }

  async function copyWorkflowBrowserDraftShareLink() {
    if (!browserDraftHasContent || typeof window === "undefined") return;
    const nextBrowserDraft = buildQuickWorkflowBrowserDraft(rawIntake, guidedFields, draft);
    const shareHref = quickWorkflowBrowserDraftShareHref(nextBrowserDraft, window.location.href);
    if (!shareHref) {
      setDraftLinkCopyStatus("failed");
      return;
    }

    try {
      const copied = onCopyText ? await onCopyText(shareHref) : await navigator.clipboard.writeText(shareHref).then(() => true, () => false);
      if (copied && writeQuickWorkflowBrowserDraft(nextBrowserDraft)) {
        setBrowserDraft(nextBrowserDraft);
        setDraftPersistenceStatus("saved");
      }
      setDraftLinkCopyStatus(copied ? "copied" : "failed");
    } catch {
      setDraftLinkCopyStatus("failed");
    }
  }

  async function copyWorkflowPublicSafeShareLink() {
    if (!draft || typeof window === "undefined") return;
    const nextSafeBrowserDraft = buildQuickWorkflowPublicSafeShareDraft(rawIntake, guidedFields, draft);
    const shareHref = nextSafeBrowserDraft ? quickWorkflowBrowserDraftShareHref(nextSafeBrowserDraft, window.location.href) : "";
    if (!shareHref) {
      setSafeDraftLinkCopyStatus("failed");
      return;
    }

    try {
      const copied = onCopyText ? await onCopyText(shareHref) : await navigator.clipboard.writeText(shareHref).then(() => true, () => false);
      setSafeDraftLinkCopyStatus(copied ? "copied" : "failed");
    } catch {
      setSafeDraftLinkCopyStatus("failed");
    }
  }

  async function copySharedWorkflowReviewBrief() {
    if (!sharedWorkflowReviewBrief) return;
    try {
      const copied = onCopyText ? await onCopyText(sharedWorkflowReviewBrief.copyText) : await navigator.clipboard.writeText(sharedWorkflowReviewBrief.copyText).then(() => true, () => false);
      setSharedReviewBriefCopyStatus(copied ? "copied" : "failed");
    } catch {
      setSharedReviewBriefCopyStatus("failed");
    }
  }

  async function copySharedDecisionReply() {
    if (!sharedDecisionReplyOption) return;
    try {
      const copied = onCopyText ? await onCopyText(sharedDecisionReplyOption.replyText) : await navigator.clipboard.writeText(sharedDecisionReplyOption.replyText).then(() => true, () => false);
      setSharedDecisionReplyCopyStatus(copied ? "copied" : "failed");
    } catch {
      setSharedDecisionReplyCopyStatus("failed");
    }
  }

  async function copyExternalReviewSendPacket() {
    const sendPacket = externalReviewReadiness?.sendPacket;
    if (!sendPacket) return;
    try {
      const copyText = [`Subject: ${sendPacket.subject}`, sendPacket.messageText].join("\n\n");
      const copied = onCopyText ? await onCopyText(copyText) : await navigator.clipboard.writeText(copyText).then(() => true, () => false);
      setExternalReviewSendCopyStatus(copied ? "copied" : "failed");
    } catch {
      setExternalReviewSendCopyStatus("failed");
    }
  }

  async function importWorkflowBrowserDraftFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > 750_000) {
      setDraftPersistenceStatus("import-failed");
      return;
    }

    try {
      const importedDraft = parseQuickWorkflowBrowserDraft(await file.text());
      if (!importedDraft) {
        setDraftPersistenceStatus("import-failed");
        return;
      }

      const nextBrowserDraft = buildQuickWorkflowBrowserDraft(importedDraft.rawIntake, importedDraft.guidedFields, importedDraft.draft);
      setRawIntake(nextBrowserDraft.rawIntake);
      setGuidedFields(nextBrowserDraft.guidedFields);
      setDraft(nextBrowserDraft.draft);
      setExtractionResult(null);
      setStatus(nextBrowserDraft.draft ? "previewed" : "idle");
      setLaunchPacketCopyStatus("idle");
      setDraftLinkCopyStatus("idle");
      setSafeDraftLinkCopyStatus("idle");
      setSharedReviewBriefCopyStatus("idle");
      setSharedDecisionReplyCopyStatus("idle");
      setExternalReviewSendCopyStatus("idle");
      setBuyerReplyText("");
      setExternalReviewResponseText(quickExternalReviewResponseTextFromUrl());
      setBuyerEvidenceResponseText(quickBuyerEvidenceResponseTextFromUrl());
      resetLiveVerification();
      resetExtractionReceiptVerification();
      resetConversionReceiptVerification();
      setBrowserDraft(nextBrowserDraft);
      setDraftPersistenceStatus(writeQuickWorkflowBrowserDraft(nextBrowserDraft) ? "imported" : "failed");
      window.requestAnimationFrame(() => {
        rawIntakeRef.current?.focus();
        rawIntakeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } catch {
      setDraftPersistenceStatus("import-failed");
    }
  }

  function updateGuidedField<Field extends keyof QuickWorkflowGuidedFields>(field: Field, value: QuickWorkflowGuidedFields[Field]) {
    const next = {
      ...guidedFields,
      [field]: value
    };
    setGuidedFields(next);
    setRawIntake(buildQuickWorkflowNoteFromFields(next));
    setDraftLinkCopyStatus("idle");
    setSharedReviewBriefCopyStatus("idle");
    setExternalReviewSendCopyStatus("idle");
    clearWorkflowInputPreview();
  }

  function applyGuidedValueTarget(lever: QuickWorkflowValueLever) {
    if (!lever.targetField || !lever.targetValue) return;
    updateGuidedField(lever.targetField, lever.targetValue);
  }

  async function buildLocalWorkflowExtractionResult(intakeText: string, fallbackReason?: string, guardrails?: string[]): Promise<QuickWorkflowExtractionResult> {
    const fallbackDraft = buildWorkflowIntakeDraftFromText(intakeText);
    return {
      source: "local-fallback",
      model: "browser-deterministic-workflow-intake-v1",
      extractedAt: new Date().toISOString(),
      draft: fallbackDraft,
      guardrails: guardrails ?? ["Browser fallback used the audited local parser because the extraction API was unavailable."],
      fallbackReason: fallbackReason || "The audited local extractor produced this buyer room without waiting on external AI."
    };
  }

  async function fetchWorkflowIntakeExtraction(intakeText: string): Promise<QuickWorkflowExtractionResult> {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, QUICK_WORKFLOW_EXTRACT_TIMEOUT_MS);

    try {
      const response = await fetch(WORKFLOW_INTAKE_EXTRACT_API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: intakeText }),
        signal: controller.signal
      });
      const payload = (await response.json()) as QuickWorkflowExtractionResult | { error?: string };
      if (!response.ok || !("draft" in payload)) {
        throw new Error("error" in payload && payload.error ? payload.error : `Workflow extraction failed with HTTP ${response.status}.`);
      }
      return payload;
    } catch (error) {
      if (timedOut) {
        throw new Error("Workflow extraction timed out, so the browser kept the buyer room usable with the audited local extractor.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function previewIntakeText(text: string) {
    const intakeText = text.trim();
    if (!intakeText) return;
    resetLiveVerification();
    resetExtractionReceiptVerification();
    resetConversionReceiptVerification();
    setLaunchPacketCopyStatus("idle");
    setBuyerReplyText("");
    setExternalReviewResponseText(quickExternalReviewResponseTextFromUrl());
    setBuyerEvidenceResponseText(quickBuyerEvidenceResponseTextFromUrl());
    setStatus("extracting");
    try {
      const payload = await fetchWorkflowIntakeExtraction(intakeText);
      setDraft(payload.draft);
      setExtractionResult(payload);
      setStatus(payload.draft.detectedSignals.length > 0 ? "previewed" : "failed");
    } catch (error) {
      try {
        const fallbackPayload = await buildLocalWorkflowExtractionResult(intakeText, fallbackReasonFrom(error));
        setDraft(fallbackPayload.draft);
        setExtractionResult(fallbackPayload);
        setStatus(fallbackPayload.draft.detectedSignals.length > 0 ? "previewed" : "failed");
      } catch {
        setExtractionResult(null);
        setStatus("failed");
      }
    }
  }

  async function previewDraft() {
    if (!canPreview) return;
    await previewIntakeText(rawIntake);
  }

  function useCompletionNote() {
    if (!roomPreview || roomPreview.evidenceCompletionPacket.openCount === 0) return;
    setRawIntake(roomPreview.evidenceCompletionPacket.completionNote);
    setDraft(null);
    setExtractionResult(null);
    setStatus("idle");
    setLaunchPacketCopyStatus("idle");
    setDraftLinkCopyStatus("idle");
    setSharedReviewBriefCopyStatus("idle");
    setExternalReviewSendCopyStatus("idle");
    setDraftPersistenceStatus("idle");
    setBuyerReplyText("");
    setExternalReviewResponseText("");
    setBuyerEvidenceResponseText("");
    resetLiveVerification();
    resetExtractionReceiptVerification();
    resetConversionReceiptVerification();
    window.requestAnimationFrame(() => {
      rawIntakeRef.current?.focus();
      rawIntakeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function applyDraft() {
    if (!draft || !canApply) return;
    onApplyDraft(draft);
    setStatus("applied");
    setLaunchPacketCopyStatus("idle");
    setDraftLinkCopyStatus("idle");
    setSharedReviewBriefCopyStatus("idle");
    setExternalReviewSendCopyStatus("idle");
    setBuyerReplyText("");
    setExternalReviewResponseText("");
    setBuyerEvidenceResponseText("");
  }

  function updateProofLink(id: QuickProofLinkId, value: string) {
    setDraft((currentDraft) => (currentDraft ? withQuickProofLinkRepair(currentDraft, id, value) : currentDraft));
    setStatus((currentStatus) => (currentStatus === "applied" ? "previewed" : currentStatus));
    setDraftLinkCopyStatus("idle");
    setSharedReviewBriefCopyStatus("idle");
    setExternalReviewSendCopyStatus("idle");
    setDraftPersistenceStatus("idle");
    setBuyerReplyText("");
    setExternalReviewResponseText("");
    setBuyerEvidenceResponseText("");
    resetLiveVerification();
    resetExtractionReceiptVerification();
    resetConversionReceiptVerification();
  }

  async function verifyExtractionReceipt() {
    const receipt = extractionResult?.receipt;
    if (!receipt || extractionReceiptVerifyStatus === "checking") return;
    setExtractionReceiptVerifyStatus("checking");
    setExtractionReceiptVerifyError("");
    try {
      const response = await fetch(receipt.verificationApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: receipt.verificationRequestJson
      });
      const body = (await response.json()) as QuickWorkflowExtractionReceiptVerificationResponse;
      if (!response.ok || body.verification?.status !== "verified") {
        throw new Error(body.verification?.instruction || body.error || `Extraction receipt verification failed with HTTP ${response.status}.`);
      }
      setExtractionReceiptVerifyStatus("verified");
    } catch (error) {
      setExtractionReceiptVerifyStatus("failed");
      setExtractionReceiptVerifyError(error instanceof Error ? error.message : "Extraction receipt verification failed.");
    }
  }

  async function verifyConversionReceipt() {
    const receipt = roomPreview?.conversionReceipt;
    if (!receipt || conversionReceiptVerifyStatus === "checking") return;
    setConversionReceiptVerifyStatus("checking");
    setConversionReceiptVerifyMessage("Checking buyer room conversion receipt...");
    try {
      const response = await fetch(receipt.verificationApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: receipt.verificationRequestJson
      });
      const body = (await response.json()) as { verification?: { status?: string; instruction?: string }; error?: string };
      if (!response.ok || body.verification?.status !== "verified") {
        throw new Error(body.verification?.instruction || body.error || `Conversion receipt verification failed with HTTP ${response.status}.`);
      }
      setConversionReceiptVerifyStatus("verified");
      setConversionReceiptVerifyMessage(body.verification.instruction || "Conversion receipt checksum verified.");
    } catch (error) {
      setConversionReceiptVerifyStatus("failed");
      setConversionReceiptVerifyMessage(error instanceof Error ? error.message : "Conversion receipt verification failed.");
    }
  }

  async function verifyProofLinks() {
    if (!roomPreview || verifyStatus === "checking") return;
    setVerifyStatus("checking");
    setVerifyError("");
    try {
      const response = await fetch("/api/proof-links/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: quickProofLinksForVerification(roomPreview.proofRepairPlan) })
      });
      const body = (await response.json()) as BuyerShareGateProofVerificationSummary | { error?: string };
      if (!response.ok) throw new Error("error" in body && body.error ? body.error : `Live proof verification failed with HTTP ${response.status}.`);
      setLiveProof(body as BuyerShareGateProofVerificationSummary);
      setVerifyStatus("checked");
    } catch (error) {
      setLiveProof(null);
      setVerifyError(error instanceof Error ? error.message : "Live proof verification failed.");
      setVerifyStatus("failed");
    }
  }

  async function copyAppliedLaunchPacket() {
    if (!appliedLaunchPacket) return;
    try {
      const copied = onCopyText ? await onCopyText(appliedLaunchMessageText) : await navigator.clipboard.writeText(appliedLaunchMessageText).then(() => true, () => false);
      setLaunchPacketCopyStatus(copied ? "copied" : "failed");
    } catch {
      setLaunchPacketCopyStatus("failed");
    }
  }

  async function loadExample() {
    const proofBaseUrl = currentPublicOrigin() || SUBMISSION_PROOF.deployedUrl;
    const example = buildQuickWorkflowIntakeExample({ proofBaseUrl });
    setGuidedFields(quickWorkflowReferenceGuidedFields({ proofBaseUrl }));
    setRawIntake(example);
    setDraft(null);
    setExtractionResult(null);
    resetLiveVerification();
    resetExtractionReceiptVerification();
    resetConversionReceiptVerification();
    setLaunchPacketCopyStatus("idle");
    setDraftLinkCopyStatus("idle");
    setSharedReviewBriefCopyStatus("idle");
    setExternalReviewSendCopyStatus("idle");
    setDraftPersistenceStatus("idle");
    setBuyerReplyText("");
    setExternalReviewResponseText(quickExternalReviewResponseTextFromUrl());
    setBuyerEvidenceResponseText(quickBuyerEvidenceResponseTextFromUrl());
    setStatus("extracting");
    try {
      const payload = await buildLocalWorkflowExtractionResult(
        example,
        "Public proof brief uses the audited local extractor so the first-click preview is immediate.",
        ["Public proof brief used the audited local parser for immediate first-click preview."]
      );
      setDraft(payload.draft);
      setExtractionResult(payload);
      setStatus(payload.draft.detectedSignals.length > 0 ? "previewed" : "failed");
    } catch {
      setExtractionResult(null);
      setStatus("failed");
    }
  }

  return (
    <section
      id="quick-workflow-intake"
      className={cx(
        "quick-workflow-intake",
        variant === "topline" && "is-topline",
        Boolean(draft) && "has-draft",
        Boolean(commercialPilotOffer) && "has-commercial-offer",
        status === "applied" && "is-applied",
        status === "failed" && "is-failed"
      )}
      aria-label="Quick workflow intake"
    >
      <div className="quick-workflow-intake-main">
        <span>Start with your workflow</span>
        <strong>{statusLabel}</strong>
        <p>
          {draft?.summary ||
            "Paste a messy note. The parser returns a buyer room, proof repair queue, and pilot-week packet before changing your workspace."}
        </p>
        <div className="quick-workflow-intake-outcomes" aria-label="Primary workflow intake outcomes">
          {QUICK_WORKFLOW_INTAKE_PRIMARY_OUTCOMES.map((outcome) => (
            <article key={outcome.label}>
              <span>{outcome.label}</span>
              <strong>{outcome.value}</strong>
              <small>{outcome.detail}</small>
            </article>
          ))}
        </div>
        <div className={cx("quick-workflow-readiness-strip", inputReadiness.status)} aria-label="Workflow note buyer readiness">
          <div>
            <span>Input readiness</span>
            <strong>{inputReadiness.headline}</strong>
          </div>
          <p>{inputReadiness.nextAction}</p>
          <b>
            {inputReadiness.readyCount}/{inputReadiness.totalCount} buyer facts
          </b>
        </div>
        {validationCallBrief && (
          <div className={cx("quick-buyer-validation-call-brief", validationCallBrief.status)} aria-label="Buyer validation call brief">
            <div className="quick-buyer-validation-call-main">
              <span>
                <ClipboardCheck size={13} />
                Buyer validation call
              </span>
              <strong>{validationCallBrief.headline}</strong>
              <p>{validationCallBrief.summary}</p>
            </div>
            <aside className="quick-buyer-validation-call-score" aria-label="Buyer validation answer readiness">
              <span>{validationAnswerRecord ? "Recorded" : "Call ready"}</span>
              <strong>
                {validationCallBrief.readyCount}/{validationCallBrief.totalCount}
              </strong>
              <small>{validationCallBrief.recordLine}</small>
            </aside>
            <div className="quick-buyer-validation-call-question">
              <span>Close ask</span>
              <strong>{validationCallBrief.primaryQuestion}</strong>
              <small>{validationCallBrief.nextAsk}</small>
            </div>
            <div className="quick-buyer-validation-call-answers" aria-label="Buyer validation answer fields">
              {validationCallBrief.items.map((item) => (
                <a key={item.id} href={item.href} className={cx(item.status, item.recordStatus !== "not-recorded" && `record-${item.recordStatus}`)}>
                  <span>{item.label}</span>
                  <strong>{item.answerField}</strong>
                  <small>{item.passSignal}</small>
                  <em>{item.recordEvidence}</em>
                </a>
              ))}
            </div>
            <div className={cx("quick-buyer-validation-call-capture", validationAnswerRecord?.status)} aria-label="Buyer validation answer capture">
              <label>
                <span>Buyer answer notes</span>
                <textarea
                  value={buyerValidationAnswerText}
                  onChange={(event) => setBuyerValidationAnswerText(event.target.value)}
                  placeholder="Buyer confirms pain, value threshold, proof URLs, and pilot stop rule."
                />
              </label>
              <aside aria-label="Buyer validation answer score">
                <span>{validationAnswerRecord ? validationAnswerRecord.status : "not recorded"}</span>
                <strong>{validationAnswerRecord ? `${validationAnswerRecord.confidence}/100 confidence` : "Paste answers to score evidence"}</strong>
                {validationAnswerRecord && (
                  <small className="quick-buyer-validation-decision">
                    Decision: {validationAnswerRecord.recommendedBuyerDecision}. {validationAnswerRecord.decisionReason}
                  </small>
                )}
                <small>{validationCallBrief.recordLine}</small>
              </aside>
            </div>
            <div className="quick-buyer-validation-call-actions" aria-label="Buyer validation call actions">
              <a href={validationCallBrief.exportHref} download="quick-buyer-validation-call-brief.md">
                <Download size={14} />
                Export call brief
              </a>
              <a href={`#${QUICK_BUYER_VALIDATION_RECORDER_ID}`}>
                <ClipboardCheck size={14} />
                Full recorder
              </a>
            </div>
          </div>
        )}
        {valueDiagnosis && (
          <div className={cx("quick-workflow-value-diagnosis", valueDiagnosis.status)} aria-label="Workflow value diagnosis">
            <div className="quick-workflow-value-diagnosis-main">
              <span>
                <Gauge size={13} />
                Value diagnosis
              </span>
              <strong>{valueDiagnosis.headline}</strong>
              <p>{valueDiagnosis.summary}</p>
              <a href={valueDiagnosis.exportHref} download="quick-workflow-value-diagnosis.md">
                <Download size={14} />
                Export diagnosis
              </a>
            </div>
            <div className="quick-workflow-value-diagnosis-metrics" aria-label="Workflow value diagnosis metrics">
              {valueDiagnosis.items.map((item) => (
                <article key={item.id} className={item.status}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </article>
              ))}
            </div>
            <div className="quick-workflow-value-levers" aria-label="Workflow value levers">
              <span>Value levers</span>
              {valueDiagnosis.levers.map((lever) => (
                <article key={lever.id} className={lever.status}>
                  <b>{lever.label}</b>
                  <strong>{lever.value}</strong>
                  <small>{lever.detail}</small>
                </article>
              ))}
            </div>
          </div>
        )}
        {valueDiagnosis && commercialPilotOffer && (
          <Suspense fallback={<div className="quick-workflow-panel-loading">Loading offer...</div>}>
            <QuickWorkflowCommercialPilotOfferPanel
              commercialPilotOffer={commercialPilotOffer}
              draft={rawReadinessDraft}
              readiness={inputReadiness}
              valueDiagnosis={valueDiagnosis}
            />
          </Suspense>
        )}
        {externalReviewReadiness && (
          <Suspense fallback={<div className="quick-workflow-panel-loading">Loading review readiness...</div>}>
            <QuickExternalReviewReadinessPanel
              readiness={externalReviewReadiness}
              decisionSuccessCommitment={decisionSuccessCommitment}
              valueRealizationCalendarExport={valueRealizationCalendarExport}
              repairValue={externalReviewRepairValue}
              proofVerifyStatus={verifyStatus}
              sendCopyLabel={externalReviewSendCopyLabel}
              onRepairValueChange={updateProofLink}
              onVerifyProofLinks={verifyProofLinks}
              onCopySendPacket={copyExternalReviewSendPacket}
            />
          </Suspense>
        )}
        {liveBuyerCase && (
          <Suspense fallback={<div className="quick-workflow-panel-loading">Loading live buyer case...</div>}>
            <QuickWorkflowLiveBuyerCasePanel liveBuyerCase={liveBuyerCase} />
          </Suspense>
        )}
        {a2aTrialStarter && (
          <Suspense fallback={<div className="quick-workflow-panel-loading">Loading A2A trial starter...</div>}>
            <QuickA2ATrialStarterPanel a2aTrialStarter={a2aTrialStarter} />
          </Suspense>
        )}
        <div className="quick-workflow-intake-actions">
          <button type="button" onClick={previewDraft} disabled={!canPreview}>
            <Sparkles size={14} />
            {draft ? "Refresh buyer room" : "Preview buyer room"}
          </button>
          <button type="button" className="is-primary" onClick={applyDraft} disabled={!canApply} title={applyGateMessage}>
            {status === "applied" ? <BadgeCheck size={14} /> : <ClipboardCheck size={14} />}
            {status === "applied" ? "Applied" : "Apply to workspace"}
          </button>
          <button type="button" onClick={loadExample} disabled={status === "extracting"}>
            <Crosshair size={14} />
            {status === "extracting" ? "Loading brief" : "Load public brief"}
          </button>
          {(rawIntake.trim() || draft) && <span className={cx("quick-workflow-apply-gate", applyGate.canApply && "ready")}>{applyGateMessage}</span>}
        </div>
        <div
          className={cx(
            "quick-workflow-browser-draft",
            (draftPersistenceStatus === "failed" || draftPersistenceStatus === "import-failed") && "is-risk",
            draftPersistenceStatus === "cleared" && "is-cleared"
          )}
          aria-live="polite"
        >
          <div className="quick-workflow-browser-draft-copy">
            <span>Local draft</span>
            <strong>{browserDraftHeadline}</strong>
            <small>{browserDraftDetail}</small>
          </div>
          <div className="quick-workflow-browser-draft-actions">
            <button type="button" onClick={() => browserDraftImportInputRef.current?.click()}>
              <Upload size={14} />
              Import draft
            </button>
            <input
              ref={browserDraftImportInputRef}
              className="quick-workflow-browser-draft-input"
              type="file"
              accept="application/json,.json"
              aria-label="Import workflow draft JSON"
              onChange={importWorkflowBrowserDraftFile}
            />
            {browserDraftHasContent && (
              <>
                <button type="button" className={cx(draftLinkCopyStatus === "copied" && "is-confirmed", draftLinkCopyStatus === "failed" && "is-risk")} onClick={copyWorkflowBrowserDraftShareLink}>
                  <Copy size={14} />
                  {draftLinkCopyLabel}
                </button>
                {draft && (
                  <button
                    type="button"
                    className={cx(safeDraftLinkCopyStatus === "copied" && "is-confirmed", safeDraftLinkCopyStatus === "failed" && "is-risk")}
                    onClick={copyWorkflowPublicSafeShareLink}
                  >
                    <ShieldCheck size={14} />
                    {safeDraftLinkCopyLabel}
                  </button>
                )}
                <button type="button" data-download-filename={QUICK_WORKFLOW_BROWSER_DRAFT_FILENAME} onClick={exportWorkflowBrowserDraft}>
                  <Download size={14} />
                  Export draft
                </button>
                <button type="button" onClick={resetWorkflowBrowserDraft}>
                  <RotateCcw size={14} />
                  Reset draft
                </button>
              </>
            )}
          </div>
        </div>
        {sharedWorkflowReviewBrief && (
          <section className={cx("quick-shared-review-brief", sharedWorkflowReviewBrief.status)} aria-label="Shared workflow review brief">
            <div className="quick-shared-review-brief-main">
              <span>
                <ShieldCheck size={13} />
                Shared review brief
              </span>
              <strong>{sharedWorkflowReviewBrief.headline}</strong>
              <p>{sharedWorkflowReviewBrief.summary}</p>
              <small>{sharedWorkflowReviewBrief.receiptLine}</small>
            </div>
            <div className="quick-shared-review-brief-items" aria-label="Shared workflow review checks">
              {sharedWorkflowReviewBrief.items.map((item) => (
                <article key={item.id} className={item.status}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </article>
              ))}
            </div>
            <div className="quick-shared-review-brief-actions" aria-label="Shared workflow review actions">
              <button
                type="button"
                className={cx(sharedReviewBriefCopyStatus === "copied" && "is-confirmed", sharedReviewBriefCopyStatus === "failed" && "is-risk")}
                onClick={copySharedWorkflowReviewBrief}
              >
                <Copy size={14} />
                {sharedReviewBriefCopyLabel}
              </button>
              {sharedDecisionReplyOption && (
                <button
                  type="button"
                  className={cx(sharedDecisionReplyCopyStatus === "copied" && "is-confirmed", sharedDecisionReplyCopyStatus === "failed" && "is-risk")}
                  onClick={copySharedDecisionReply}
                >
                  <Send size={14} />
                  {sharedDecisionReplyCopyLabel}
                </button>
              )}
              {decisionReplyDeck && (
                <a href={`#${QUICK_BUYER_DECISION_REPLY_PATH_ID}`}>
                  <ClipboardCheck size={14} />
                  Decision path
                </a>
              )}
              <a href={`#${QUICK_BUYER_ROOM_PREVIEW_ID}`}>
                <ExternalLink size={14} />
                Buyer room
              </a>
              <a href={`#${QUICK_PROOF_REPAIR_PLAN_ID}`}>
                <Crosshair size={14} />
                Proof gaps
              </a>
            </div>
          </section>
        )}
        {roomPreview && liveProofAudit && (
          <Suspense fallback={<div className="quick-workflow-panel-loading">Loading proof preflight...</div>}>
            <QuickProofPreflightPanel
              liveProofAudit={liveProofAudit}
              proofRepairPlan={roomPreview.proofRepairPlan}
              repairItems={proofPreflightRepairItems}
              verifyStatus={verifyStatus}
              liveProofAuditVerifierHref={liveProofAuditVerifierHref}
              liveProofAuditId={QUICK_LIVE_PROOF_AUDIT_ID}
              onVerifyProofLinks={verifyProofLinks}
              onProofLinkChange={updateProofLink}
            />
          </Suspense>
        )}
        {appliedLaunchPacket && (
          <div className={cx("quick-applied-inline-result", appliedLaunchPacket.status)} aria-label="Applied workspace result">
            <div>
              <span>
                <BadgeCheck size={13} />
                {appliedLaunchPacket.label}
              </span>
              <strong>{appliedLaunchPacket.sendDesk.headline}</strong>
              <p>{appliedLaunchPacket.summary}</p>
            </div>
            <div className="quick-applied-inline-metrics" aria-label="Applied workspace metrics">
              {appliedLaunchPacket.sendDesk.metrics.map((metric) => (
                <article key={metric.id} className={metric.status}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </article>
              ))}
            </div>
            <div className="quick-applied-inline-actions" aria-label="Applied workspace actions">
              <button type="button" className={cx(launchPacketCopyStatus === "copied" && "is-confirmed", launchPacketCopyStatus === "failed" && "is-risk")} onClick={copyAppliedLaunchPacket}>
                <Copy size={14} />
                {copyLaunchPacketLabel}
              </button>
              {appliedLaunchPacket.status === "ready" ? (
                liveProofVerified ? (
                  appliedLaunchRoomLink && (
                    <a href={verifiedLaunchRoomHref} target={verifiedLaunchRoomHref.startsWith("#") ? undefined : "_blank"} rel={verifiedLaunchRoomHref.startsWith("#") ? undefined : "noreferrer"}>
                      <ExternalLink size={14} />
                      Launch room
                    </a>
                  )
                ) : (
                  <button type="button" className="is-live-proof" onClick={verifyProofLinks} disabled={verifyStatus === "checking"}>
                    <Gauge size={14} />
                    {liveProofButtonLabel(verifyStatus)}
                  </button>
                )
              ) : (
                <a className="is-repair" href={`#${QUICK_PROOF_REPAIR_PLAN_ID}`}>
                  <Crosshair size={14} />
                  Fix proof gaps
                </a>
              )}
              <a href={appliedLaunchExportHref} download={appliedLaunchExportFilename}>
                <Download size={14} />
                Export packet
              </a>
            </div>
          </div>
        )}
      </div>
      <div className="quick-workflow-intake-compose">
        <section className="quick-workflow-guided-builder" aria-label="Guided workflow builder">
          <div className="quick-workflow-guided-builder-head">
            <span>
              <FileText size={13} />
              Guided workflow builder
            </span>
            <strong>
              {guidedReadyCount}/8 core facts / {guidedProofReadyCount}/5 proof URLs
            </strong>
          </div>
          <div className="quick-workflow-guided-grid" aria-label="Structured intake facts">
            <label className="is-wide">
              <span>Buyer</span>
              <input value={guidedFields.buyer} onChange={(event) => updateGuidedField("buyer", event.currentTarget.value)} placeholder="Platform release lead" />
            </label>
            <label className="is-wide">
              <span>Workflow</span>
              <input
                value={guidedFields.workflow}
                onChange={(event) => updateGuidedField("workflow", event.currentTarget.value)}
                placeholder="Weekly release review across Jira, GitHub, Cloud Run, and risk notes"
              />
            </label>
            <label className="is-wide">
              <span>Baseline</span>
              <input
                value={guidedFields.baseline}
                onChange={(event) => updateGuidedField("baseline", event.currentTarget.value)}
                placeholder="Proof is copied by hand before each go/no-go decision"
              />
            </label>
            <label className="is-wide">
              <span>Success metric</span>
              <input
                value={guidedFields.successMetric}
                onChange={(event) => updateGuidedField("successMetric", event.currentTarget.value)}
                placeholder="Save 6 hours and make every release decision auditable"
              />
            </label>
            <label>
              <span>Team</span>
              <input value={guidedFields.teamSize} onChange={(event) => updateGuidedField("teamSize", event.currentTarget.value)} inputMode="numeric" placeholder="8" />
            </label>
            <label>
              <span>Runs/month</span>
              <input value={guidedFields.cyclesPerMonth} onChange={(event) => updateGuidedField("cyclesPerMonth", event.currentTarget.value)} inputMode="numeric" placeholder="5" />
            </label>
            <label>
              <span>Hours/run</span>
              <input value={guidedFields.manualHoursPerCycle} onChange={(event) => updateGuidedField("manualHoursPerCycle", event.currentTarget.value)} inputMode="decimal" placeholder="28" />
            </label>
            <label>
              <span>Adoption %</span>
              <input value={guidedFields.adoptionRatePercent} onChange={(event) => updateGuidedField("adoptionRatePercent", event.currentTarget.value)} inputMode="numeric" placeholder="75" />
            </label>
            <label>
              <span>Yen/hour</span>
              <input value={guidedFields.hourlyCostYen} onChange={(event) => updateGuidedField("hourlyCostYen", event.currentTarget.value)} inputMode="numeric" placeholder="12000" />
            </label>
            <label>
              <span>Risk/month</span>
              <input
                value={guidedFields.incidentRiskYenPerMonth}
                onChange={(event) => updateGuidedField("incidentRiskYenPerMonth", event.currentTarget.value)}
                inputMode="numeric"
                placeholder="240000"
              />
            </label>
            <label>
              <span>Manual min</span>
              <input
                value={guidedFields.pilotManualMinutes}
                onChange={(event) => updateGuidedField("pilotManualMinutes", event.currentTarget.value)}
                inputMode="numeric"
                placeholder="1680"
              />
            </label>
            <label>
              <span>Assisted min</span>
              <input
                value={guidedFields.pilotAssistedMinutes}
                onChange={(event) => updateGuidedField("pilotAssistedMinutes", event.currentTarget.value)}
                inputMode="numeric"
                placeholder="560"
              />
            </label>
            <label>
              <span>Accepted</span>
              <input value={guidedFields.acceptedTasks} onChange={(event) => updateGuidedField("acceptedTasks", event.currentTarget.value)} inputMode="numeric" placeholder="5" />
            </label>
            <label>
              <span>Total</span>
              <input value={guidedFields.totalTasks} onChange={(event) => updateGuidedField("totalTasks", event.currentTarget.value)} inputMode="numeric" placeholder="5" />
            </label>
            <label>
              <span>Reviewer</span>
              <input value={guidedFields.reviewer} onChange={(event) => updateGuidedField("reviewer", event.currentTarget.value)} placeholder="Platform sponsor" />
            </label>
            <label>
              <span>Boundary</span>
              <select value={guidedFields.dataBoundary} onChange={(event) => updateGuidedField("dataBoundary", event.currentTarget.value as QuickWorkflowGuidedFields["dataBoundary"])}>
                <option value="public">public</option>
                <option value="internal">internal</option>
                <option value="restricted">restricted</option>
              </select>
            </label>
            <div className="quick-workflow-guided-subhead">Public proof URLs</div>
            <label className="is-wide">
              <span>Deployed URL</span>
              <input
                value={guidedFields.deployedUrl}
                onChange={(event) => updateGuidedField("deployedUrl", event.currentTarget.value)}
                inputMode="url"
                placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.targetUrl}
              />
            </label>
            <label className="is-wide">
              <span>ProtoPedia URL</span>
              <input
                value={guidedFields.protopediaUrl}
                onChange={(event) => updateGuidedField("protopediaUrl", event.currentTarget.value)}
                inputMode="url"
                placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl}
              />
            </label>
            <label className="is-wide">
              <span>Video URL</span>
              <input value={guidedFields.videoUrl} onChange={(event) => updateGuidedField("videoUrl", event.currentTarget.value)} inputMode="url" placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl} />
            </label>
            <label className="is-wide">
              <span>Pilot receipt URL</span>
              <input
                value={guidedFields.pilotEvidenceUrl}
                onChange={(event) => updateGuidedField("pilotEvidenceUrl", event.currentTarget.value)}
                inputMode="url"
                placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.pilotEvidenceUrl}
              />
            </label>
            <label className="is-wide">
              <span>Work order proof URL</span>
              <input
                value={guidedFields.workOrderEvidenceUrl}
                onChange={(event) => updateGuidedField("workOrderEvidenceUrl", event.currentTarget.value)}
                inputMode="url"
                placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.workOrderEvidenceUrl}
              />
            </label>
            <label className="is-wide">
              <span>A2A trial receipt</span>
              <input
                value={guidedFields.agentTrial}
                onChange={(event) => updateGuidedField("agentTrial", event.currentTarget.value)}
                placeholder={`agent=Cloud Run SRE, skill=cloudrun.release-proof, score 94, artifact ${PUBLIC_PROOF_INPUT_PLACEHOLDERS.agentTrialArtifactUrl}`}
              />
            </label>
          </div>
          <div className="quick-workflow-guided-proof-checks" aria-label="Guided proof URL checks">
            <div className="quick-workflow-guided-proof-checks-head">
              <span>
                <ShieldCheck size={13} />
                Public proof quality
              </span>
              <strong>{guidedProofReadyCount}/5 buyer-facing URLs</strong>
            </div>
            {guidedProofChecks.map((check) => (
              <article key={check.id} className={check.status}>
                <span>{check.label}</span>
                <strong>{check.status === "ready" ? "Ready" : check.status === "watch" ? "Review" : "Missing"}</strong>
                <small>{check.evidence}</small>
                <em>{check.action}</em>
              </article>
            ))}
          </div>
          {guidedValueTuneLevers.length > 0 && (
            <div className="quick-workflow-guided-value-tuning" aria-label="Guided value tuning actions">
              <div className="quick-workflow-guided-value-tuning-head">
                <span>
                  <Gauge size={13} />
                  Value tuning
                </span>
                <strong>Close the buyer-value floor</strong>
              </div>
              {guidedValueTuneLevers.map((lever) => (
                <article key={lever.id} className={lever.status}>
                  <span>{lever.label}</span>
                  <strong>{lever.value}</strong>
                  <small>{lever.targetEffect || lever.detail}</small>
                  {lever.targetOutcome && <small className="quick-workflow-guided-value-tuning-outcome">Target: {lever.targetOutcome}</small>}
                  <button type="button" onClick={() => applyGuidedValueTarget(lever)}>
                    {lever.targetAction}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
        <label className="quick-workflow-intake-raw">
          <span>Workflow note</span>
          <textarea
            ref={rawIntakeRef}
            value={rawIntake}
            onChange={(event) => {
              setRawIntake(event.target.value);
              clearWorkflowInputPreview();
            }}
            placeholder={`Buyer: Platform lead\nWorkflow: weekly release review is copied from tickets, CI logs, and chat by hand.\nSuccess: save 6 hours per review. Team 8, 5 reviews/month, manual 28h/review, 75% adoption. Pilot: manual 1680 min, assisted 560 min, 5/5 accepted. Reviewer: Platform sponsor. Evidence: ${PUBLIC_PROOF_INPUT_PLACEHOLDERS.genericProofUrl}`}
          />
        </label>
      </div>
      <div className="quick-workflow-readiness-checks" aria-label="Buyer readiness checks">
        {inputReadiness.items.map((item) => (
          <article key={item.id} className={item.status}>
            <span>{item.label}</span>
            <strong>{item.status === "ready" ? "Ready" : item.status === "watch" ? "Needs proof" : "Missing"}</strong>
            <small>{item.evidence}</small>
            <em>{item.action}</em>
          </article>
        ))}
      </div>
      {decisionOnePager && (
        <section className={cx("quick-buyer-decision-one-pager", decisionOnePager.status)} aria-label="Buyer decision one-pager">
          <div className="quick-buyer-decision-one-pager-main">
            <span>
              <ClipboardCheck size={14} />
              Buyer one-pager
            </span>
            <strong>{decisionOnePager.headline}</strong>
            <p>{decisionOnePager.summary}</p>
            <div className="quick-buyer-decision-one-pager-actions" aria-label="Buyer one-pager actions">
              <a href={decisionOnePager.exportHref} download="quick-buyer-decision-one-pager.md">
                <Download size={14} />
                One-pager
              </a>
              <a href={decisionOnePager.receiptHref} download={`${decisionOnePager.receipt.receiptId}.json`}>
                <ShieldCheck size={14} />
                Receipt
              </a>
              <a href={decisionOnePager.mailtoHref}>
                <Send size={14} />
                Draft email
              </a>
              {decisionOnePager.status !== "ready" && (
                <a className="is-repair" href={`#${QUICK_PROOF_REPAIR_PLAN_ID}`}>
                  <Crosshair size={14} />
                  Repair proof
                </a>
              )}
            </div>
          </div>
          <div className="quick-buyer-decision-one-pager-verdict">
            <span>{decisionOnePager.label}</span>
            <strong>{decisionOnePager.decision}</strong>
            <small>
              {decisionOnePager.nextOwner}: {decisionOnePager.nextAction}
            </small>
            <small>
              {decisionOnePager.receipt.receiptId} / {decisionOnePager.receipt.checksumAlgorithm}:{decisionOnePager.receipt.checksum}
            </small>
          </div>
          <div className={cx("quick-buyer-decision-one-pager-receipt", decisionOnePager.receipt.verification.status)}>
            <span>
              <ShieldCheck size={14} />
              Receipt check
            </span>
            <strong>{decisionOnePager.receipt.verification.label}</strong>
            <small>
              Payload {decisionOnePager.receipt.checksumAlgorithm}:{decisionOnePager.receipt.verification.payloadChecksum}
            </small>
            <small>
              Receipt {decisionOnePager.receipt.checksumAlgorithm}:{decisionOnePager.receipt.verification.receiptChecksum}
            </small>
            <small>{decisionOnePager.receipt.verification.detail}</small>
          </div>
          <div className="quick-buyer-decision-source-trace" aria-label="Buyer one-pager source trace">
            <span>
              <FileText size={14} />
              Source trace
            </span>
            <strong>{decisionOnePager.sourceTraceLine}</strong>
            <small>{decisionOnePager.sourceTraceAction}</small>
            <a href={`#${QUICK_WORKFLOW_SOURCE_TRACE_ID}`}>
              <ExternalLink size={14} />
              Open source lines
            </a>
          </div>
          {decisionReplyDeck && (
            <Suspense fallback={<div className="quick-workflow-panel-loading">Loading buyer reply packet...</div>}>
              <QuickBuyerDecisionReplyPanel
                replyPathId={QUICK_BUYER_DECISION_REPLY_PATH_ID}
                decisionReplyDeck={decisionReplyDeck}
                buyerReplyText={buyerReplyText}
                setBuyerReplyText={setBuyerReplyText}
                decisionReplyRecord={decisionReplyRecord}
                decisionReplyReviewKitHref={decisionReplyReviewKitHref}
                decisionReplyAcceptancePathHref={decisionReplyAcceptancePathHref}
                decisionActivationBrief={decisionReplyRecord?.activation ?? decisionActivationBrief}
              />
            </Suspense>
          )}
          {roomPreview && decisionSuccessCommitment && (
            <Suspense fallback={<div className="quick-workflow-panel-loading">Loading buyer success commitment...</div>}>
              <QuickBuyerDecisionSuccessPanel
                roomPreview={roomPreview}
                decisionSuccessCommitment={decisionSuccessCommitment}
                valueRealizationCalendarExport={valueRealizationCalendarExport}
                valueRealizationCloseout={valueRealizationCloseout}
                valueRealizationCloseoutText={valueRealizationCloseoutText}
                setValueRealizationCloseoutText={setValueRealizationCloseoutText}
                valueRealizationRepairAcknowledgement={valueRealizationRepairAcknowledgement}
                valueRealizationRepairAcknowledgementText={valueRealizationRepairAcknowledgementText}
                setValueRealizationRepairAcknowledgementText={setValueRealizationRepairAcknowledgementText}
                valueRealizationAcceptancePacket={valueRealizationAcceptancePacket}
                valueRealizationBuyerReviewDossier={valueRealizationBuyerReviewDossier}
                valueReviewExecutionPacket={valueReviewExecutionPacket}
                valueReviewExecutionCloseout={valueReviewExecutionCloseout}
                valueReviewExecutionCloseoutText={valueReviewExecutionCloseoutText}
                setValueReviewExecutionCloseoutText={setValueReviewExecutionCloseoutText}
              />
            </Suspense>
          )}
          <div className="quick-buyer-decision-one-pager-items" aria-label="Buyer one-pager proof rows">
            {decisionOnePager.items.map((item) => (
              <a
                key={item.id}
                className={item.status}
                href={item.href}
                download={item.href.startsWith("data:text") ? `quick-${item.id}.md` : undefined}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </a>
            ))}
          </div>
          <pre aria-label="Buyer one-pager email preview">{decisionOnePager.sendPreview}</pre>
        </section>
      )}
      {publishabilityBrief && (
        <section className={cx("quick-global-publishability-brief", publishabilityBrief.status)} aria-label="Global publishability verdict">
          <div className="quick-global-publishability-main">
            <span>
              <Rocket size={14} />
              {publishabilityBrief.label}
            </span>
            <strong>{publishabilityBrief.headline}</strong>
            <p>{publishabilityBrief.summary}</p>
            <small>
              {publishabilityBrief.sourceReceiptId} / {publishabilityBrief.sourceChecksum}
            </small>
            <div className="quick-global-publishability-actions" aria-label="Global publishability actions">
              <a href={publishabilityBrief.exportHref} download="quick-global-publishability-verdict.md">
                <Download size={14} />
                Verdict
              </a>
              <a href={publishabilityBrief.primaryHref} download={publishabilityBrief.primaryHref.startsWith("data:text") ? "quick-publishability-action.md" : undefined}>
                <ExternalLink size={14} />
                Next action
              </a>
            </div>
          </div>
          <div className="quick-global-publishability-score">
            <span>Launch score</span>
            <strong>{publishabilityBrief.score}/100</strong>
            <small>{publishabilityBrief.primaryAction}</small>
            {publishabilityBrief.repairImpact && (
              <div className="quick-global-publishability-impact" aria-label="Repair impact forecast">
                <span>After this fix</span>
                <strong>{publishabilityBrief.repairImpact.projectedScore}/100</strong>
                <small>
                  {publishabilityBrief.repairImpact.scoreDelta > 0
                    ? `+${publishabilityBrief.repairImpact.scoreDelta} points after ${publishabilityBrief.repairImpact.targetLabel}.`
                    : `${publishabilityBrief.repairImpact.targetLabel} is required before the next score move.`}
                </small>
              </div>
            )}
          </div>
          <div className={cx("quick-global-publishability-freshness", publishabilityBrief.freshness.status)}>
            <span>Proof freshness</span>
            <strong>{publishabilityBrief.freshness.label}</strong>
            <small>{publishabilityBrief.freshness.summary}</small>
            <small>
              Audit receipt {publishabilityBrief.freshness.auditReceiptId || "not issued"}
              {publishabilityBrief.freshness.auditChecksum ? ` / ${publishabilityBrief.freshness.auditChecksum}` : ""}
            </small>
            <small>{publishabilityBrief.freshness.auditRowSummary}</small>
            <div className="quick-global-publishability-freshness-actions">
              <a href={publishabilityBrief.freshness.exportHref} download="quick-proof-freshness-window.md">
                <Download size={14} />
                Window
              </a>
              <a
                href={publishabilityBrief.freshness.href}
                download={publishabilityBrief.freshness.href.startsWith("data:text") ? "quick-proof-freshness-window.md" : undefined}
              >
                <Gauge size={14} />
                Audit
              </a>
            </div>
          </div>
          <div className="quick-global-publishability-gates" aria-label="Global publishability gates">
            {publishabilityBrief.gates.map((gate) => (
              <a key={gate.id} className={gate.status} href={gate.href} download={gate.href.startsWith("data:text") ? `quick-${gate.id}.md` : undefined}>
                <span>{gate.label}</span>
                <strong>{gate.owner}</strong>
                <p>{gate.action}</p>
              </a>
            ))}
          </div>
          <div className={cx("quick-global-publishability-claim-audit", publishabilityBrief.claimAudit.status)} aria-label="Decision-grade claim audit">
            <div className="quick-global-publishability-claim-audit-head">
              <div>
                <span>
                  <ShieldCheck size={14} />
                  {publishabilityBrief.claimAudit.label}
                </span>
                <strong>{publishabilityBrief.claimAudit.headline}</strong>
                <p>{publishabilityBrief.claimAudit.summary}</p>
                <small>{publishabilityBrief.claimAudit.primaryRisk}</small>
              </div>
              <div className="quick-global-publishability-claim-audit-score">
                <span>Trace score</span>
                <strong>{publishabilityBrief.claimAudit.traceScore}/100</strong>
                <small>
                  {publishabilityBrief.claimAudit.readyCount}/{publishabilityBrief.claimAudit.totalCount} claims ready
                </small>
              </div>
            </div>
            <div className="quick-global-publishability-claim-audit-rows">
              {publishabilityBrief.claimAudit.rows.map((row) => (
                <a key={row.id} className={row.status} href={row.href} download={row.href.startsWith("data:text") ? `quick-${row.id}-claim.md` : undefined}>
                  <span>{row.label}</span>
                  <strong>{row.claim}</strong>
                  <p>{row.proof}</p>
                  <small>{row.verification}</small>
                </a>
              ))}
            </div>
            <div className="quick-global-publishability-claim-audit-actions" aria-label="Claim audit exports">
              <a href={publishabilityBrief.claimAudit.exportHref} download="quick-decision-grade-claim-audit.md">
                <Download size={14} />
                Claim audit
              </a>
              <a href={publishabilityBrief.claimAudit.csvHref} download="quick-claim-proof-ledger.csv">
                <Download size={14} />
                CSV
              </a>
              <a href={publishabilityBrief.claimAudit.receiptHref} download={`${publishabilityBrief.claimAudit.receiptId}.json`}>
                <ShieldCheck size={14} />
                Receipt
              </a>
            </div>
          </div>
          <div className={cx("quick-global-publishability-value-route", publishabilityBrief.valueRoute.status)} aria-label="Review-to-value route">
            <div className="quick-global-publishability-value-route-head">
              <div>
                <span>
                  <Crosshair size={14} />
                  {publishabilityBrief.valueRoute.label}
                </span>
                <strong>{publishabilityBrief.valueRoute.headline}</strong>
                <p>{publishabilityBrief.valueRoute.summary}</p>
                <small>{publishabilityBrief.valueRoute.routeQuestion}</small>
              </div>
              <div className="quick-global-publishability-value-route-target">
                <span>Day 30 rule</span>
                <strong>{publishabilityBrief.valueRoute.retainedValueLine}</strong>
                <a href={publishabilityBrief.valueRoute.exportHref} download="quick-review-to-value-route.md">
                  <Download size={14} />
                  Value route
                </a>
              </div>
            </div>
            <div className="quick-global-publishability-value-route-steps">
              {publishabilityBrief.valueRoute.steps.map((step) => (
                <a key={step.id} className={step.status} href={step.href} download={step.href.startsWith("data:text") ? `quick-${step.id}-value-route.md` : undefined}>
                  <span>{step.window}</span>
                  <strong>{step.label}</strong>
                  <p>{step.outcome}</p>
                  <small>{step.owner}: {step.proof}</small>
                </a>
              ))}
            </div>
          </div>
          <div className={cx("quick-global-publishability-objections", publishabilityBrief.objectionDeck.status)} aria-label="Reviewer objection answers">
            <div className="quick-global-publishability-objections-head">
              <div>
                <span>
                  <ClipboardCheck size={14} />
                  {publishabilityBrief.objectionDeck.label}
                </span>
                <strong>{publishabilityBrief.objectionDeck.headline}</strong>
                <p>{publishabilityBrief.objectionDeck.summary}</p>
                <small>{publishabilityBrief.objectionDeck.primaryQuestion}</small>
              </div>
              <a href={publishabilityBrief.objectionDeck.exportHref} download="quick-reviewer-objection-answers.md">
                <Download size={14} />
                Answers
              </a>
            </div>
            <div className="quick-global-publishability-objections-grid">
              {publishabilityBrief.objectionDeck.rows.map((row) => (
                <a key={row.id} className={row.status} href={row.href} download={row.href.startsWith("data:text") ? `quick-${row.id}-objection.md` : undefined}>
                  <span>{row.label}</span>
                  <strong>{row.question}</strong>
                  <p>{row.answer}</p>
                  <small>{row.owner}: {row.evidence}</small>
                </a>
              ))}
            </div>
          </div>
          <div className={cx("quick-global-publishability-review-packet", publishabilityBrief.reviewPacket.status)} aria-label="External review packet">
            <div className="quick-global-publishability-review-packet-head">
              <div>
                <span>
                  <Send size={14} />
                  {publishabilityBrief.reviewPacket.label}
                </span>
                <strong>{publishabilityBrief.reviewPacket.headline}</strong>
                <p>{publishabilityBrief.reviewPacket.summary}</p>
                <small>{publishabilityBrief.reviewPacket.sendRule}</small>
              </div>
              <div className="quick-global-publishability-review-packet-clearance">
                <span>Clearance</span>
                <strong>{publishabilityBrief.certificate.label}</strong>
                <small>
                  {publishabilityBrief.reviewPacket.readyCount}/{publishabilityBrief.reviewPacket.totalCount} items ready
                </small>
                <small>
                  {publishabilityBrief.reviewPacket.manifest.receiptId} / {publishabilityBrief.reviewPacket.manifest.checksumAlgorithm}:{publishabilityBrief.reviewPacket.manifest.checksum}
                </small>
                <small>
                  {publishabilityBrief.reviewPacket.manifest.artifacts.length} markdown artifacts /{" "}
                  {publishabilityBrief.reviewPacket.manifest.artifacts
                    .reduce((sum, artifact) => sum + artifact.contentLength, 0)
                    .toLocaleString("en-US")}{" "}
                  chars hashed
                </small>
                <a href={publishabilityBrief.reviewPacket.exportHref} download="quick-external-review-packet.md">
                  <Download size={14} />
                  Packet
                </a>
                <a href={publishabilityBrief.reviewPacket.manifestHref} download={`${publishabilityBrief.reviewPacket.manifest.receiptId}.json`}>
                  <ShieldCheck size={14} />
                  Manifest
                </a>
                <a href={publishabilityBrief.reviewPacket.artifactBundleHref} download="quick-external-review-artifact-bundle.json">
                  <FileText size={14} />
                  Bundle
                </a>
                <a
                  href={publishabilityBrief.reviewPacket.manifestVerifierHref}
                  onClick={() =>
                    storeReceiptVerifierRequest(
                      publishabilityBrief.reviewPacket.manifestVerificationStorageKey,
                      publishabilityBrief.reviewPacket.manifestVerificationRequestJson
                    )
                  }
                >
                  <ExternalLink size={14} />
                  Verify
                </a>
                <a
                  href={publishabilityBrief.reviewPacket.reviewDeskHref}
                  onClick={() =>
                    storeReceiptVerifierRequest(
                      publishabilityBrief.reviewPacket.manifestVerificationStorageKey,
                      publishabilityBrief.reviewPacket.manifestVerificationRequestJson
                    )
                  }
                >
                  <ExternalLink size={14} />
                  Review desk
                </a>
              </div>
            </div>
            <div className="quick-global-publishability-review-packet-items">
              {publishabilityBrief.reviewPacket.items.map((item) => (
                <a key={item.id} className={item.status} href={item.href} download={item.href.startsWith("data:text") ? `quick-${item.id}.md` : undefined}>
                  <span>{item.role}</span>
                  <strong>{item.label}</strong>
                  <p>{item.evidence}</p>
                </a>
              ))}
            </div>
          </div>
          <div className={cx("quick-global-publishability-decision-memo", publishabilityBrief.decisionMemo.status)} aria-label="External reviewer decision memo">
            <div className="quick-global-publishability-decision-memo-head">
              <div>
                <span>
                  <ClipboardCheck size={14} />
                  {publishabilityBrief.decisionMemo.label}
                </span>
                <strong>{publishabilityBrief.decisionMemo.headline}</strong>
                <p>{publishabilityBrief.decisionMemo.summary}</p>
                <small>{publishabilityBrief.decisionMemo.decisionRule}</small>
              </div>
              <div className="quick-global-publishability-decision-memo-verdict">
                <span>Review outcome</span>
                <strong>{publishabilityBrief.decisionMemo.reviewerOutcome}</strong>
                <small>
                  {publishabilityBrief.decisionMemo.confidenceScore}/100 confidence / {publishabilityBrief.decisionMemo.readyCount}/{publishabilityBrief.decisionMemo.totalCount} tests ready
                </small>
                <a href={publishabilityBrief.decisionMemo.exportHref} download="quick-external-reviewer-decision-memo.md">
                  <Download size={14} />
                  Memo
                </a>
                <a
                  href={publishabilityBrief.decisionMemo.reviewDeskHref}
                  onClick={() =>
                    storeReceiptVerifierRequest(
                      publishabilityBrief.reviewPacket.manifestVerificationStorageKey,
                      publishabilityBrief.reviewPacket.manifestVerificationRequestJson
                    )
                  }
                >
                  <ExternalLink size={14} />
                  Review desk
                </a>
              </div>
            </div>
            <div className="quick-global-publishability-decision-memo-tests">
              {publishabilityBrief.decisionMemo.tests.map((test) => (
                <a key={test.id} className={test.status} href={test.href} download={test.href.startsWith("data:text") ? `quick-${test.id}-review-test.md` : undefined}>
                  <span>{test.label}</span>
                  <strong>{test.test}</strong>
                  <p>{test.evidence}</p>
                </a>
              ))}
            </div>
          </div>
          {externalReviewResponsePlan && (
            <div
              className={cx("quick-global-publishability-response-intake", externalReviewResponsePlan.status)}
              aria-label="External review response intake"
            >
              <div className="quick-global-publishability-response-intake-main">
                <span>
                  <ClipboardCheck size={14} />
                  Response intake
                </span>
                <strong>{externalReviewResponsePlan.headline}</strong>
                <p>{externalReviewResponsePlan.summary}</p>
                {importedExternalReviewPacket && (
                  <small className="quick-global-publishability-response-context">
                    Imported packet context: {importedExternalReviewPacket.manifest.receiptId} / fnv1a32:{importedExternalReviewPacket.manifest.checksum}
                  </small>
                )}
                <label>
                  <span>Reviewer response receipt or verifier URL</span>
                  <textarea
                    value={externalReviewResponseText}
                    onChange={(event) => setExternalReviewResponseText(event.target.value)}
                    placeholder="Paste the Verify receipt URL or quick-external-review-decision.v1 JSON from the review desk."
                  />
                </label>
              </div>
              <div className={cx("quick-global-publishability-response-result", externalReviewResponsePlan.state)}>
                <span>{externalReviewResponsePlan.label}</span>
                <strong>{externalReviewResponsePlan.nextOwner}</strong>
                <p>{externalReviewResponsePlan.nextAction}</p>
                <small>{externalReviewResponsePlan.reviewerLine}</small>
                <small>{externalReviewResponsePlan.receiptLine}</small>
                <ul>
                  {externalReviewResponsePlan.acceptanceCriteria.map((criterion) => (
                    <li key={criterion}>{criterion}</li>
                  ))}
                </ul>
                <div className="quick-global-publishability-response-runbook" aria-label="External review response runbook">
                  {externalReviewResponsePlan.runbook.map((item) => (
                    <article key={item.id} className={item.status}>
                      <span>{item.window}</span>
                      <strong>{item.label}</strong>
                      <p>{item.action}</p>
                      <small>{item.owner}: {item.evidence}</small>
                    </article>
                  ))}
                </div>
                <div className="quick-global-publishability-response-follow-up-ledger" aria-label="External review response follow-up ledger">
                  <div className="quick-global-publishability-response-follow-up-head">
                    <span>Follow-up ledger</span>
                    <strong>{externalReviewResponsePlan.followUpLedger.headline}</strong>
                    <p>{externalReviewResponsePlan.followUpLedger.summary}</p>
                    <small>
                      {externalReviewResponsePlan.followUpLedger.readyCount}/{externalReviewResponsePlan.followUpLedger.taskTotal} ready / first due{" "}
                      {externalReviewResponsePlan.followUpLedger.firstDueLabel}
                    </small>
                  </div>
                  <div className="quick-global-publishability-response-follow-up-tasks">
                    {externalReviewResponsePlan.followUpLedger.tasks.map((task) => (
                      <a key={task.id} className={task.status} href={task.href}>
                        <span>{task.dueLabel}</span>
                        <strong>{task.label}</strong>
                        <small>{task.owner}</small>
                        <em>{task.closeCondition}</em>
                      </a>
                    ))}
                  </div>
                </div>
                <div className="quick-global-publishability-response-actions" aria-label="External review response actions">
                  {externalReviewResponsePlan.verifierHref && (
                    <a href={externalReviewResponsePlan.verifierHref} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} />
                      Verifier
                    </a>
                  )}
                  {externalReviewResponsePlan.packetVerifierHref && (
                    <a
                      href={externalReviewResponsePlan.packetVerifierHref}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        if (externalReviewResponsePacket) {
                          storeReceiptVerifierRequest(
                            externalReviewResponsePacket.manifestVerificationStorageKey,
                            externalReviewResponsePacket.manifestVerificationRequestJson
                          );
                        }
                      }}
                    >
                      <ShieldCheck size={14} />
                      Packet verifier
                    </a>
                  )}
                  {externalReviewResponsePlan.reviewDeskHref && (
                    <a
                      href={externalReviewResponsePlan.reviewDeskHref}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        if (externalReviewResponsePacket) {
                          storeReceiptVerifierRequest(
                            externalReviewResponsePacket.manifestVerificationStorageKey,
                            externalReviewResponsePacket.manifestVerificationRequestJson
                          );
                        }
                      }}
                    >
                      <Send size={14} />
                      New review desk
                    </a>
                  )}
                  <a href={externalReviewResponsePlan.exportHref} download="quick-external-review-response-intake.md">
                    <Download size={14} />
                    Action memo
                  </a>
                  <a href={externalReviewResponsePlan.ownerPacketHref} download="quick-external-review-owner-packet.md">
                    <ClipboardCheck size={14} />
                    Owner packet
                  </a>
                  <a href={externalReviewResponsePlan.followUpLedger.exportHref} download="quick-external-review-follow-up-ledger.md">
                    <FileText size={14} />
                    Follow-up
                  </a>
                  <a href={externalReviewResponsePlan.followUpLedger.csvHref} download="quick-external-review-follow-up.csv">
                    <Download size={14} />
                    CSV
                  </a>
                  {externalReviewResponsePlan.followUpLedger.calendarHref && (
                    <a href={externalReviewResponsePlan.followUpLedger.calendarHref} download="quick-external-review-follow-up.ics">
                      <CalendarDays size={14} />
                      Calendar
                    </a>
                  )}
                  <a href={externalReviewResponsePlan.ownerPacketReceiptHref} download="quick-external-review-owner-packet-receipt.json">
                    <ShieldCheck size={14} />
                    Owner receipt
                  </a>
                  <a
                    href={externalReviewResponsePlan.ownerPacketVerifierHref}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      storeReceiptVerifierRequest(
                        externalReviewResponsePlan.ownerPacketVerifierStorageKey,
                        externalReviewResponsePlan.ownerPacketReceiptJson
                      )
                    }
                  >
                    <ExternalLink size={14} />
                    Owner verifier
                  </a>
                  <a href={externalReviewResponsePlan.regenerationHref} download="quick-external-review-regeneration-note.txt">
                    <FileText size={14} />
                    Regeneration note
                  </a>
                </div>
              </div>
            </div>
          )}
          <div className={cx("quick-global-publishability-certificate", publishabilityBrief.certificate.status)} aria-label="Launch certificate">
            <div>
              <span>{publishabilityBrief.certificate.label}</span>
              <strong>{publishabilityBrief.certificate.headline}</strong>
              <p>{publishabilityBrief.certificate.sharePolicy}</p>
              <small>{publishabilityBrief.certificate.holdReason}</small>
            </div>
            <dl>
              {publishabilityBrief.certificate.receipts.slice(0, 4).map((receipt) => (
                <div key={receipt.label}>
                  <dt>{receipt.label}</dt>
                  <dd>{receipt.value}</dd>
                </div>
              ))}
            </dl>
            <a href={publishabilityBrief.certificate.exportHref} download="quick-launch-certificate.md">
              <Download size={14} />
              Certificate
            </a>
          </div>
          <div className={cx("quick-global-publishability-reviewer", publishabilityBrief.reviewerBrief.status)} aria-label="Reviewer brief">
            <div>
              <span>{publishabilityBrief.reviewerBrief.label}</span>
              <strong>{publishabilityBrief.reviewerBrief.headline}</strong>
              <p>{publishabilityBrief.reviewerBrief.summary}</p>
              <small>{publishabilityBrief.reviewerBrief.reviewQuestion}</small>
            </div>
            <div className="quick-global-publishability-reviewer-order">
              {publishabilityBrief.reviewerBrief.readOrder.map((item) => (
                <a key={item.label} className={item.status} href={item.href} download={item.href.startsWith("data:text") ? `quick-${item.label.toLowerCase().replace(/\s+/g, "-")}.md` : undefined}>
                  <span>{item.label}</span>
                  <strong>{item.status}</strong>
                  <small>{item.detail}</small>
                </a>
              ))}
            </div>
            <a className="quick-global-publishability-reviewer-export" href={publishabilityBrief.reviewerBrief.exportHref} download="quick-reviewer-brief.md">
              <FileText size={14} />
              Reviewer brief
            </a>
          </div>
          {publishabilityBrief.repairImpact && (
            <div className="quick-global-publishability-command" aria-label="Repair owner command">
              <div>
                <span>Owner command</span>
                <strong>
                  {publishabilityBrief.repairImpact.ownerCommand.owner}: {publishabilityBrief.repairImpact.targetLabel}
                </strong>
                <p>{publishabilityBrief.repairImpact.ownerCommand.action}</p>
              </div>
              <ul>
                {publishabilityBrief.repairImpact.ownerCommand.acceptanceCriteria.map((criterion) => (
                  <li key={criterion}>{criterion}</li>
                ))}
              </ul>
              <a href={publishabilityBrief.repairImpact.ownerCommand.exportHref} download="quick-repair-owner-command.txt">
                <Download size={14} />
                Command
              </a>
            </div>
          )}
        </section>
      )}
      <details
        key={roomPreview ? "generated-artifact-audit" : "locked-artifact-audit"}
        className="quick-workflow-intake-output-map"
        aria-label="What quick workflow intake generates"
        open={Boolean(roomPreview)}
      >
        <summary>
          <span>Generated artifact audit</span>
          <strong>{roomPreview ? `${QUICK_WORKFLOW_INTAKE_OUTPUTS.length} artifacts generated from this workflow` : "Preview unlocks the generated artifact set"}</strong>
          <small>{roomPreview ? "Open each generated section below before sending anything to a buyer." : "No artifact is counted as real until the workflow note is parsed."}</small>
        </summary>
        <div className="quick-workflow-intake-output-map-grid">
          {QUICK_WORKFLOW_INTAKE_OUTPUTS.map((output) => (
            <article key={output.label}>
              <span>{output.label}</span>
              <p>{output.detail}</p>
            </article>
          ))}
        </div>
      </details>
      {extractionResult && (
        <div className={cx("quick-workflow-intake-provenance", extractionResult.source)} aria-label="Workflow extraction provenance">
          <div>
            <span>
              <Sparkles size={13} />
              {extractionSourceLabel(extractionResult.source)}
            </span>
            <strong>{extractionResult.model}</strong>
            <p>
              {extractionResult.source === "gemini"
                ? "The buyer room was structured by the AI operator, then checked against URL and data-boundary guardrails."
                : extractionResult.fallbackReason || "The audited local extractor produced this buyer room."}
            </p>
          </div>
          <ul>
            {extractionResult.guardrails.slice(0, 3).map((guardrail) => (
              <li key={guardrail}>{guardrail}</li>
            ))}
          </ul>
          {extractionResult.source === "gemini" && extractionGuardrailAudit.totalIgnored > 0 && (
            <div className="quick-workflow-intake-guardrail-audit" aria-label="Ignored model-suggested facts">
              <div>
                <span>
                  <ShieldCheck size={13} />
                  Ignored model facts
                </span>
                <strong>
                  {extractionGuardrailAudit.totalIgnored} ungrounded suggestion{extractionGuardrailAudit.totalIgnored === 1 ? "" : "s"} rejected
                </strong>
                <p>Only facts present in the pasted note can unlock buyer readiness.</p>
              </div>
              <ul>
                {extractionGuardrailAudit.ignoredSuggestions.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              {extractionGuardrailAudit.hiddenIgnored > 0 && <small>+{extractionGuardrailAudit.hiddenIgnored} more source-grounding rejection{extractionGuardrailAudit.hiddenIgnored === 1 ? "" : "s"} in the receipt.</small>}
            </div>
          )}
          {extractionResult.receipt && (
            <div className="quick-workflow-intake-provenance-actions" aria-label="Extraction receipt controls">
              <button type="button" onClick={verifyExtractionReceipt} disabled={extractionReceiptVerifyStatus === "checking"}>
                <ShieldCheck size={14} />
                {extractionReceiptVerifyStatus === "checking" ? "Checking receipt" : "Verify extraction"}
              </button>
              <a href={extractionResult.receipt.href} download={`${extractionResult.receipt.receiptId}.md`}>
                <FileText size={14} />
                Receipt
              </a>
              <a href={extractionResult.receipt.payloadHref} download={`${extractionResult.receipt.receiptId}-payload.json`}>
                <Download size={14} />
                Payload
              </a>
              <p className={cx("quick-workflow-intake-receipt-status", extractionReceiptVerifyStatus === "verified" && "good", extractionReceiptVerifyStatus === "failed" && "bad")}>
                {extractionReceiptVerifyStatus === "verified"
                  ? "Receipt checksum verified in this browser."
                  : extractionReceiptVerifyStatus === "failed"
                    ? extractionReceiptVerifyError
                    : extractionReceiptVerifyStatus === "checking"
                      ? "Checking the extraction replay payload."
                      : "Receipt not checked in this browser yet."}
              </p>
            </div>
          )}
        </div>
      )}
      {draft && (
        <div className="quick-workflow-intake-preview" aria-label="Quick extraction preview">
          <article>
            <span>Buyer</span>
            <strong>{draft.workOrder.targetUser || "Target buyer missing"}</strong>
          </article>
          <article>
            <span>Value</span>
            <strong>{draftValueLine(draft)}</strong>
          </article>
          <article>
            <span>Pilot</span>
            <strong>{draftPilotLine(draft)}</strong>
          </article>
          <article>
            <span>Proof</span>
            <strong>{draftProofLine(draft)}</strong>
          </article>
          {draft.agentTrialEvidence && (
            <article>
              <span>A2A trial</span>
              <strong>{draftAgentTrialLine(draft)}</strong>
            </article>
          )}
        </div>
      )}
      {roomPreview && (
        <section id={QUICK_BUYER_ROOM_PREVIEW_ID} className={cx("quick-buyer-room-preview", roomPreview.status)} aria-label="Buyer room preview">
          <header>
            <div>
              <span>
                <FileText size={14} />
                Buyer room preview
              </span>
              <strong>{roomPreview.headline}</strong>
              <p>{roomPreview.primaryAsk}</p>
            </div>
            <div className="quick-buyer-room-preview-actions" aria-label="Buyer room exports">
              <a href={roomPreviewHref} download="quick-buyer-room-preview.md">
                <Download size={14} />
                Export room
              </a>
              <a href={roomPreview.pilotWeekTaskPacket.csvHref} download="quick-pilot-week-tasks.csv">
                <Download size={14} />
                Task CSV
              </a>
              <a href={roomPreview.pilotWeekTaskPacket.kickoffHref} download="quick-pilot-week-kickoff.txt">
                <Download size={14} />
                Kickoff note
              </a>
              <a href={roomPreview.pilotWeekTaskPacket.receiptHref} download="quick-pilot-week-receipt.json">
                <Download size={14} />
                Receipt
              </a>
            </div>
          </header>
          <div className={cx("quick-workflow-conversion-receipt", roomPreview.conversionReceipt.status)} aria-label="Workflow conversion receipt">
            <div>
              <span>
                <ShieldCheck size={14} />
                Workflow conversion receipt
              </span>
              <strong>{roomPreview.conversionReceipt.headline}</strong>
              <p>{roomPreview.conversionReceipt.summary}</p>
            </div>
            <div className="quick-workflow-conversion-receipt-id" aria-label="Workflow conversion checksum">
              <span>{roomPreview.conversionReceipt.receiptId}</span>
              <strong>
                {roomPreview.conversionReceipt.checksumAlgorithm}:{roomPreview.conversionReceipt.checksum}
              </strong>
              <div className="quick-workflow-conversion-receipt-actions" aria-label="Workflow conversion receipt controls">
                <button type="button" onClick={verifyConversionReceipt} disabled={conversionReceiptVerifyStatus === "checking"}>
                  <ShieldCheck size={14} />
                  {conversionReceiptVerifyStatus === "verified" ? "Verified" : conversionReceiptVerifyStatus === "checking" ? "Checking" : "Verify conversion"}
                </button>
                <a href={roomPreview.conversionReceipt.payloadHref} download={`${roomPreview.conversionReceipt.receiptId}-payload.json`}>
                  <Download size={14} />
                  Payload
                </a>
                <a href={roomPreview.conversionReceipt.verificationRequestHref} download={`${roomPreview.conversionReceipt.receiptId}-verify.json`}>
                  <FileText size={14} />
                  Verify JSON
                </a>
                <a href={roomPreview.conversionReceipt.verifierHref} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} />
                  Open verifier
                </a>
              </div>
              <small className="quick-workflow-conversion-receipt-endpoint">POST {roomPreview.conversionReceipt.verificationApiPath}</small>
              <small
                className={cx(
                  "quick-workflow-conversion-receipt-status",
                  conversionReceiptVerifyStatus === "verified" && "good",
                  conversionReceiptVerifyStatus === "failed" && "bad"
                )}
              >
                {conversionReceiptVerifyMessage}
              </small>
            </div>
            <div className="quick-workflow-conversion-receipt-items" aria-label="Workflow conversion receipt items">
              {roomPreview.conversionReceipt.items.map((item) => (
                <article key={item.id} className={item.status}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </article>
              ))}
            </div>
          </div>
          <QuickSponsorSendGatePanel gate={roomPreview.sponsorSendGate} />
          {publicValueReleaseGate && <QuickPublicValueReleaseGatePanel gate={publicValueReleaseGate} />}
          <div className={cx("quick-buyer-evidence-pack", roomPreview.evidencePack.status)} aria-label="Buyer evidence pack">
            <div className="quick-buyer-evidence-pack-main">
              <span>
                <ClipboardCheck size={14} />
                {roomPreview.evidencePack.label}
              </span>
              <strong>{roomPreview.evidencePack.headline}</strong>
              <p>{roomPreview.evidencePack.summary}</p>
              <small>{roomPreview.evidencePack.sendRule}</small>
              <div className="quick-buyer-evidence-pack-actions" aria-label="Buyer evidence pack actions">
                <a href={roomPreview.evidencePack.exportHref} download="quick-buyer-evidence-pack.md">
                  <Download size={14} />
                  Evidence pack
                </a>
                <a href={roomPreview.evidencePack.shareHref} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} />
                  Share page
                </a>
                <a href={roomPreview.evidencePack.verifierHref} target="_blank" rel="noreferrer">
                  <ShieldCheck size={14} />
                  Receipt verifier
                </a>
                <a href={roomPreview.evidencePack.firstAction.href} className={roomPreview.evidencePack.status === "ready" ? undefined : "is-repair"}>
                  {roomPreview.evidencePack.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
                  {roomPreview.evidencePack.firstAction.label}
                </a>
              </div>
            </div>
            <div className="quick-buyer-evidence-pack-artifacts" aria-label="Evidence pack artifacts">
              {roomPreview.evidencePack.artifacts.map((artifact) => (
                <a key={artifact.id} href={artifact.href} className={cx(artifact.status, artifact.requiredForSend && "is-required")}>
                  <span>{artifact.requiredForSend ? "Required" : "Operating"}</span>
                  <strong>{artifact.label}</strong>
                  <small>{artifact.role}</small>
                  <em>{artifact.proof}</em>
                </a>
              ))}
            </div>
          </div>
          {buyerEvidenceResponsePlan && (
            <div ref={buyerEvidenceResponseIntakeRef} className={cx("quick-buyer-evidence-response-intake", buyerEvidenceResponsePlan.status)} aria-label="Buyer evidence response intake">
              <div className="quick-buyer-evidence-response-intake-main">
                <span>
                  <ClipboardCheck size={14} />
                  Response return
                </span>
                <strong>{buyerEvidenceResponsePlan.headline}</strong>
                <p>{buyerEvidenceResponsePlan.summary}</p>
                <small className="quick-buyer-evidence-response-context">
                  Current evidence: {roomPreview.conversionReceipt.receiptId} / {roomPreview.conversionReceipt.checksumAlgorithm}:{roomPreview.conversionReceipt.checksum}
                </small>
                <label>
                  <span>Buyer response receipt or return URL</span>
                  <textarea
                    value={buyerEvidenceResponseText}
                    onChange={(event) => setBuyerEvidenceResponseText(event.target.value)}
                    placeholder="Paste the Return response URL or quick-external-review-decision.v1 JSON from the shared evidence page."
                  />
                </label>
              </div>
              <div className={cx("quick-buyer-evidence-response-result", buyerEvidenceResponsePlan.state)}>
                <span>{buyerEvidenceResponsePlan.label}</span>
                <strong>{buyerEvidenceResponsePlan.nextOwner}</strong>
                <p>{buyerEvidenceResponsePlan.nextAction}</p>
                <small>{buyerEvidenceResponsePlan.reviewerLine}</small>
                <small>{buyerEvidenceResponsePlan.receiptLine}</small>
                <div className="quick-buyer-evidence-response-runbook" aria-label="Buyer evidence response runbook">
                  {buyerEvidenceResponsePlan.ownerRunbook.map((item) => (
                    <article key={item.id} className={item.status}>
                      <span>{item.window}</span>
                      <strong>{item.label}</strong>
                      <p>{item.action}</p>
                      <small>{item.owner}: {item.evidence}</small>
                    </article>
                  ))}
                </div>
                <div className="quick-buyer-evidence-follow-up-ledger" aria-label="Buyer evidence response follow-up ledger">
                  <div className="quick-buyer-evidence-follow-up-head">
                    <span>
                      <ClipboardCheck size={14} />
                      Follow-up ledger
                    </span>
                    <strong>{buyerEvidenceResponsePlan.followUpLedger.headline}</strong>
                    <p>{buyerEvidenceResponsePlan.followUpLedger.summary}</p>
                    <small>
                      {buyerEvidenceResponsePlan.followUpLedger.readyCount}/{buyerEvidenceResponsePlan.followUpLedger.taskTotal} ready / first due {buyerEvidenceResponsePlan.followUpLedger.firstDueLabel}
                    </small>
                  </div>
                  <div className="quick-buyer-evidence-follow-up-tasks">
                    {buyerEvidenceResponsePlan.followUpLedger.tasks.map((task) => (
                      <a key={task.id} href={task.href} className={task.status}>
                        <span>{task.dueLabel}</span>
                        <strong>{task.owner}</strong>
                        <small>{task.label}</small>
                        <em>{task.closeCondition}</em>
                      </a>
                    ))}
                  </div>
                </div>
                <div className="quick-buyer-evidence-response-actions" aria-label="Buyer evidence response actions">
                  {buyerEvidenceResponsePlan.verifierHref && (
                    <a href={buyerEvidenceResponsePlan.verifierHref} target="_blank" rel="noreferrer">
                      <ShieldCheck size={14} />
                      Response verifier
                    </a>
                  )}
                  <a href={buyerEvidenceResponsePlan.evidencePackHref} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} />
                    Evidence pack
                  </a>
                  <a href={buyerEvidenceResponsePlan.packVerifierHref} target="_blank" rel="noreferrer">
                    <ShieldCheck size={14} />
                    Pack verifier
                  </a>
                  <a href={buyerEvidenceResponsePlan.ownerPacketHref} download="quick-buyer-evidence-response-owner-packet.md">
                    <ClipboardCheck size={14} />
                    Owner packet
                  </a>
                  <a href={buyerEvidenceResponsePlan.ownerPacketReceiptHref} download="quick-buyer-evidence-response-owner-packet-receipt.json">
                    <ShieldCheck size={14} />
                    Owner receipt
                  </a>
                  <a href={buyerEvidenceResponsePlan.followUpLedger.exportHref} download="quick-buyer-evidence-response-follow-up-ledger.md">
                    <ClipboardCheck size={14} />
                    Follow-up ledger
                  </a>
                  <a href={buyerEvidenceResponsePlan.followUpLedger.csvHref} download="quick-buyer-evidence-response-follow-up.csv">
                    <FileText size={14} />
                    Task CSV
                  </a>
                  {buyerEvidenceResponsePlan.followUpLedger.calendarHref && (
                    <a href={buyerEvidenceResponsePlan.followUpLedger.calendarHref} download="quick-buyer-evidence-response-follow-up.ics">
                      <Download size={14} />
                      Calendar hold
                    </a>
                  )}
                  <a
                    href={buyerEvidenceResponsePlan.ownerPacketVerifierHref}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      storeReceiptVerifierRequest(
                        buyerEvidenceResponsePlan.ownerPacketVerifierStorageKey,
                        buyerEvidenceResponsePlan.ownerPacketReceiptJson
                      )
                    }
                  >
                    <ExternalLink size={14} />
                    Owner verifier
                  </a>
                  {buyerEvidenceResponsePlan.ownerMailHref && (
                    <a href={buyerEvidenceResponsePlan.ownerMailHref}>
                      <Send size={14} />
                      Email owner
                    </a>
                  )}
                  <a href={buyerEvidenceResponsePlan.exportHref} download="quick-buyer-evidence-response-intake.md">
                    <Download size={14} />
                    Action memo
                  </a>
                </div>
              </div>
            </div>
          )}
          <details id={QUICK_WORKFLOW_SOURCE_TRACE_ID} className="quick-workflow-source-trace" open aria-label="Workflow source trace">
            <summary>
              <span>
                <FileText size={14} />
                Source trace
              </span>
              <strong>{roomPreview.sourceTrace.filter((item) => item.status === "traced").length}/{roomPreview.sourceTrace.length} extracted facts traced to the pasted note</strong>
              <small>Every generated artifact below must tie back to a source line or stay marked as missing.</small>
            </summary>
            <div className="quick-workflow-source-trace-grid">
              {roomPreview.sourceTrace.map((item) => (
                <article key={item.id} className={item.status}>
                  <span>{item.label}</span>
                  <strong>{item.extracted}</strong>
                  <p>{item.sourceLineNumber ? `L${item.sourceLineNumber}: ${item.sourceLine}` : item.action}</p>
                </article>
              ))}
            </div>
          </details>
          <div className={cx("quick-public-safe-redaction-packet", roomPreview.publicSafeRedactionPacket.status)} aria-label="Public-safe redaction packet">
            <div className="quick-public-safe-redaction-head">
              <div>
                <span>
                  <ShieldCheck size={14} />
                  Public-safe packet
                </span>
                <strong>{roomPreview.publicSafeRedactionPacket.headline}</strong>
                <p>{roomPreview.publicSafeRedactionPacket.summary}</p>
              </div>
              <div className="quick-public-safe-redaction-actions" aria-label="Public-safe packet exports">
                <a href={roomPreview.publicSafeRedactionPacket.exportHref} download="quick-public-safe-redaction-packet.md">
                  <Download size={14} />
                  Redaction packet
                </a>
                <a href={roomPreview.publicSafeRedactionPacket.publicSafeWorkflowNoteHref} download="quick-public-safe-workflow-note.txt">
                  <Download size={14} />
                  Safe rewrite
                </a>
                <a href={roomPreview.publicSafeRedactionPacket.receiptHref} download={`${roomPreview.publicSafeRedactionPacket.receipt.receiptId}.json`}>
                  <FileText size={14} />
                  Receipt
                </a>
              </div>
            </div>
            <div className="quick-public-safe-redaction-stats" aria-label="Public-safe redaction counts">
              <span>{roomPreview.publicSafeRedactionPacket.blockedCount} blocked</span>
              <span>{roomPreview.publicSafeRedactionPacket.watchCount} review</span>
              <span>{roomPreview.publicSafeRedactionPacket.findings.length} findings</span>
              <span>{roomPreview.publicSafeRedactionPacket.rewriteLineCount} rewrite lines</span>
            </div>
            {roomPreview.publicSafeRedactionPacket.findings.length > 0 && (
              <div className="quick-public-safe-redaction-findings" aria-label="Public-safe redaction findings">
                {roomPreview.publicSafeRedactionPacket.findings.map((finding) => (
                  <article key={finding.id} className={finding.status}>
                    <span>{finding.label}</span>
                    <strong>
                      {finding.sourceLabel}
                      {finding.sourceLineNumber ? ` L${finding.sourceLineNumber}` : ""}
                    </strong>
                    <p>{finding.redactedLine}</p>
                    <small>{finding.action}</small>
                  </article>
                ))}
              </div>
            )}
            <div className="quick-public-safe-redaction-notes" aria-label="Public-safe redaction notes">
              <article>
                <span>Private trace</span>
                <strong>Redacted source</strong>
                <pre>{roomPreview.publicSafeRedactionPacket.redactedWorkflowNote}</pre>
              </article>
              <article className="is-rewrite">
                <span>Next input</span>
                <strong>Public-safe rewrite</strong>
                <pre>{roomPreview.publicSafeRedactionPacket.publicSafeWorkflowNote}</pre>
              </article>
            </div>
          </div>
          {roomPreview.evidenceCompletionPacket.openCount > 0 && (
            <div className={cx("quick-evidence-completion-packet", roomPreview.evidenceCompletionPacket.status)} aria-label="Evidence completion packet">
              <div className="quick-evidence-completion-head">
                <div>
                  <span>
                    <ClipboardCheck size={14} />
                    Evidence completion
                  </span>
                  <strong>{roomPreview.evidenceCompletionPacket.headline}</strong>
                  <p>{roomPreview.evidenceCompletionPacket.summary}</p>
                </div>
                <div className="quick-evidence-completion-actions" aria-label="Evidence completion actions">
                  <button type="button" onClick={useCompletionNote}>
                    <ClipboardCheck size={14} />
                    Use note
                  </button>
                  <a href={roomPreview.evidenceCompletionPacket.exportHref} download="quick-evidence-completion-packet.md">
                    <Download size={14} />
                    Completion packet
                  </a>
                  <a href={roomPreview.evidenceCompletionPacket.completionNoteHref} download="quick-evidence-completion-note.txt">
                    <Download size={14} />
                    Completion note
                  </a>
                  <a href={roomPreview.evidenceCompletionPacket.receiptHref} download={`${roomPreview.evidenceCompletionPacket.receipt.receiptId}.json`}>
                    <FileText size={14} />
                    Receipt
                  </a>
                </div>
              </div>
              <div className="quick-evidence-completion-stats" aria-label="Evidence completion counts">
                <span>{roomPreview.evidenceCompletionPacket.openCount} open lines</span>
                <span>{roomPreview.evidenceCompletionPacket.blockedCount} blocked</span>
                <span>{roomPreview.evidenceCompletionPacket.watchCount} review</span>
              </div>
              <div className="quick-evidence-completion-grid" aria-label="Evidence completion owner asks">
                {roomPreview.evidenceCompletionPacket.items.map((item) => (
                  <article key={item.id} className={item.status}>
                    <span>{item.label}</span>
                    <strong>{item.owner}</strong>
                    <p>{item.ask}</p>
                    <pre>{item.sourceLine}</pre>
                    <a href={item.href}>Open source</a>
                  </article>
                ))}
              </div>
              <article className="quick-evidence-completion-note">
                <span>Paste-ready note</span>
                <strong>Completion note</strong>
                <pre>{roomPreview.evidenceCompletionPacket.completionNote}</pre>
              </article>
            </div>
          )}
          <div className={cx("quick-buyer-room-decision-rail", roomPreview.decisionCase.status)} aria-label="Buyer decision summary">
            <article className="quick-buyer-room-decision-rail-main">
              <span>
                <ClipboardCheck size={14} />
                Decision
              </span>
              <strong>{roomPreview.decisionCase.decisionLabel}</strong>
              <small>{roomPreview.decisionCase.answer}</small>
            </article>
            <article>
              <span>Proof</span>
              <strong>{proofReadinessLine(roomPreview.proofRepairPlan)}</strong>
              <small>{roomPreview.decisionCase.proofEvidence}</small>
            </article>
            <article>
              <span>Next owner</span>
              <strong>{roomPreview.decisionCase.owner}</strong>
              <small>{roomPreview.decisionCase.nextAction}</small>
            </article>
            <article>
              <span>Buyer value</span>
              <strong>{roomPreview.decisionCase.valueEvidence}</strong>
              <small>{roomPreview.decisionCase.dataBoundary}</small>
            </article>
            <div className="quick-buyer-room-decision-rail-actions" aria-label="Decision summary actions">
              <a href={roomPreview.decisionCase.caseHref} download="quick-buyer-decision-case.txt">
                <Download size={14} />
                Decision case
              </a>
              {roomPreview.decisionCase.status !== "ready" && (
                <a className="is-repair" href={`#${QUICK_PROOF_REPAIR_PLAN_ID}`}>
                  <Crosshair size={14} />
                  Fix proof gaps
                </a>
              )}
            </div>
          </div>
          <div className={cx("quick-buyer-impact-snapshot", roomPreview.impactSnapshot.status)} aria-label="Buyer impact snapshot">
            <div className="quick-buyer-impact-snapshot-main">
              <span>
                <Gauge size={14} />
                Buyer impact snapshot
              </span>
              <strong>{roomPreview.impactSnapshot.headline}</strong>
              <p>{roomPreview.impactSnapshot.summary}</p>
              <div className="quick-buyer-impact-snapshot-states" aria-label="Buyer impact before and after">
                <article>
                  <span>Before</span>
                  <p>{roomPreview.impactSnapshot.beforeState}</p>
                </article>
                <article>
                  <span>After</span>
                  <p>{roomPreview.impactSnapshot.afterState}</p>
                </article>
              </div>
              <div className="quick-buyer-impact-snapshot-actions" aria-label="Buyer impact snapshot actions">
                <a href={roomPreview.impactSnapshot.exportHref} download="quick-buyer-impact-snapshot.md">
                  <Download size={14} />
                  Export snapshot
                </a>
                {roomPreview.impactSnapshot.status !== "ready" && (
                  <a className="is-repair" href={`#${QUICK_PROOF_REPAIR_PLAN_ID}`}>
                    <Crosshair size={14} />
                    Fix proof gaps
                  </a>
                )}
              </div>
            </div>
            <div className="quick-buyer-impact-snapshot-metrics" aria-label="Buyer impact snapshot metrics">
              {roomPreview.impactSnapshot.metrics.map((metric) => (
                <a key={metric.id} href={metric.href} className={metric.status}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.detail}</small>
                </a>
              ))}
            </div>
          </div>
          <div className={cx("quick-buyer-value-map", roomPreview.valueMap.status)} aria-label="Buyer value map">
            <div className="quick-buyer-value-map-main">
              <span>
                <Gauge size={14} />
                Buyer value map
              </span>
              <strong>{roomPreview.valueMap.headline}</strong>
              <p>{roomPreview.valueMap.summary}</p>
              <div className="quick-buyer-value-map-actions" aria-label="Buyer value map actions">
                <a href={roomPreview.valueMap.exportHref} download="quick-buyer-value-map.md">
                  <Download size={14} />
                  Export map
                </a>
                <a href={roomPreview.decisionCase.caseHref} download="quick-buyer-decision-case.txt">
                  <ClipboardCheck size={14} />
                  Decision case
                </a>
              </div>
            </div>
            <div className="quick-buyer-value-map-items" aria-label="Buyer value map rows">
              {roomPreview.valueMap.items.map((item) => (
                <a key={item.id} href={item.href} className={item.status}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.owner}</small>
                  <em>{item.detail}</em>
                </a>
              ))}
            </div>
          </div>
          <div className={cx("quick-buyer-validation-script", roomPreview.validationScript.status)} aria-label="Buyer validation script">
            <div className="quick-buyer-validation-script-main">
              <span>
                <ClipboardCheck size={14} />
                Buyer validation script
              </span>
              <strong>{roomPreview.validationScript.headline}</strong>
              <p>{roomPreview.validationScript.summary}</p>
              <div className="quick-buyer-validation-script-actions" aria-label="Buyer validation script actions">
                <a href={roomPreview.validationScript.exportHref} download="quick-buyer-validation-script.md">
                  <Download size={14} />
                  Export script
                </a>
                {roomPreview.validationScript.status === "ready" ? (
                  <a href={roomPreview.decisionCase.caseHref} download="quick-buyer-decision-case.txt">
                    <ClipboardCheck size={14} />
                    Decision case
                  </a>
                ) : (
                  <a href={`#${QUICK_PROOF_REPAIR_PLAN_ID}`}>
                    <Crosshair size={14} />
                    Proof gaps
                  </a>
                )}
              </div>
            </div>
            <div className="quick-buyer-validation-script-body" aria-label="Buyer validation script opening and close">
              <span>Opening line</span>
              <p>{roomPreview.validationScript.openingLine}</p>
              <span>Close ask</span>
              <p>{roomPreview.validationScript.closeAsk}</p>
            </div>
            <div className="quick-buyer-validation-script-questions" aria-label="Buyer validation questions">
              {roomPreview.validationScript.questions.map((question) => (
                <a key={question.id} href={question.href} className={question.status}>
                  <span>{question.label}</span>
                  <strong>{question.question}</strong>
                  <small>{question.owner}</small>
                  <em>{question.listenFor}</em>
                </a>
              ))}
            </div>
            <div className={cx("quick-buyer-validation-rubric", roomPreview.validationRubric.status)} aria-label="Buyer validation rubric">
              <div className="quick-buyer-validation-rubric-main">
                <span>
                  <Gauge size={14} />
                  Decision rubric
                </span>
                <strong>{roomPreview.validationRubric.headline}</strong>
                <p>{roomPreview.validationRubric.summary}</p>
                <small>
                  {roomPreview.validationRubric.passCount}/{roomPreview.validationRubric.totalCount} signals ready. {roomPreview.validationRubric.decisionRule}
                </small>
                <a href={roomPreview.validationRubric.exportHref} download="quick-buyer-validation-rubric.md">
                  <Download size={14} />
                  Export rubric
                </a>
              </div>
              <div className="quick-buyer-validation-rubric-criteria" aria-label="Buyer validation rubric criteria">
                {roomPreview.validationRubric.criteria.map((criterion) => (
                  <a key={criterion.id} href={criterion.href} className={criterion.status}>
                    <span>{criterion.label}</span>
                    <strong>{criterion.owner}</strong>
                    <small>{criterion.passSignal}</small>
                    <em>{criterion.failSignal}</em>
                  </a>
                ))}
              </div>
            </div>
            <div className={cx("quick-buyer-validation-answer-sheet", roomPreview.validationAnswerSheet.status)} aria-label="Buyer validation answer sheet">
              <div className="quick-buyer-validation-answer-sheet-main">
                <span>
                  <ClipboardCheck size={14} />
                  Answer sheet
                </span>
                <strong>{roomPreview.validationAnswerSheet.headline}</strong>
                <p>{roomPreview.validationAnswerSheet.summary}</p>
                <small>
                  {roomPreview.validationAnswerSheet.readyCount}/{roomPreview.validationAnswerSheet.totalCount} answer fields ready. {roomPreview.validationAnswerSheet.decisionRule}
                </small>
                <a href={roomPreview.validationAnswerSheet.exportHref} download="quick-buyer-validation-answer-sheet.md">
                  <Download size={14} />
                  Export sheet
                </a>
              </div>
              <div className="quick-buyer-validation-answer-fields" aria-label="Buyer validation answer fields">
                {roomPreview.validationAnswerSheet.items.map((item) => (
                  <a key={item.id} href={item.href} className={item.status}>
                    <span>{item.label}</span>
                    <strong>{item.answerField}</strong>
                    <small>{item.passSignal}</small>
                    <em>{item.owner}: {item.ownerAction}</em>
                  </a>
                ))}
              </div>
              <div
                id={QUICK_BUYER_VALIDATION_RECORDER_ID}
                className={cx("quick-buyer-validation-answer-recorder", validationAnswerRecord?.status)}
                aria-label="Buyer validation answer recorder"
              >
                <div className="quick-buyer-validation-answer-recorder-main">
                  <span>
                    <ClipboardCheck size={14} />
                    Answer recorder
                  </span>
                  <strong>{validationAnswerRecord ? validationAnswerRecord.headline : "Paste buyer answers to score validation evidence"}</strong>
                  <p>
                    {validationAnswerRecord
                      ? validationAnswerRecord.summary
                      : "Score the conversation against baseline, cadence, value, proof, and commitment before using it as approval evidence."}
                  </p>
                  <label>
                    <span>Buyer answer notes</span>
                    <textarea
                      value={buyerValidationAnswerText}
                      onChange={(event) => setBuyerValidationAnswerText(event.target.value)}
                      placeholder="Baseline owner confirmed manual proof work every week. Finance accepts a ¥840,000 monthly value threshold. Proof URLs and receipt opened. Sponsor approves a bounded pilot with stop rule and decision date."
                    />
                  </label>
                </div>
                {validationAnswerRecord ? (
                  <div className="quick-buyer-validation-answer-record" aria-label="Recorded validation answers">
                    <span>{validationAnswerRecord.status}</span>
                    <strong>
                      {validationAnswerRecord.answeredCount}/{validationAnswerRecord.totalCount} answers / {validationAnswerRecord.confidence}/100 confidence
                    </strong>
                    <small>
                      Recommended buyer decision: {validationAnswerRecord.recommendedBuyerDecision}. {validationAnswerRecord.decisionReason}
                    </small>
                    <small>{validationAnswerRecord.decisionAction}</small>
                    <small>
                      {validationAnswerRecord.nextOwner}: {validationAnswerRecord.nextAction}
                    </small>
                    <small>
                      {validationAnswerRecord.receipt.receiptId} / {validationAnswerRecord.receipt.checksumAlgorithm}:{validationAnswerRecord.receipt.checksum}
                    </small>
                    <div className="quick-buyer-validation-answer-record-actions" aria-label="Validation answer record actions">
                      <a href={validationAnswerRecord.exportHref} download="quick-buyer-validation-answer-record.md">
                        <Download size={14} />
                        Answer record
                      </a>
                      <a href={validationAnswerRecord.receiptHref} download={`${validationAnswerRecord.receipt.receiptId}.json`}>
                        <ShieldCheck size={14} />
                        Verify JSON
                      </a>
                      <a href={validationAnswerRecord.verifierHref} target="_blank" rel="noreferrer">
                        <ExternalLink size={14} />
                        Verifier
                      </a>
                      <a href={validationAnswerReviewKitHref} target="_blank" rel="noreferrer">
                        <FileText size={14} />
                        Review kit
                      </a>
                      <a href={validationAnswerAcceptancePathHref} target="_blank" rel="noreferrer">
                        <Rocket size={14} />
                        Acceptance path
                      </a>
                    </div>
                    <Suspense fallback={<div className="quick-workflow-panel-loading">Loading validation handoff...</div>}>
                      <QuickBuyerValidationDecisionHandoffPanel
                        validationAnswerRecord={validationAnswerRecord}
                        proofRepairPlan={roomPreview.proofRepairPlan}
                        reviewKitHref={validationAnswerReviewKitHref}
                        acceptancePathHref={validationAnswerAcceptancePathHref}
                      />
                    </Suspense>
                    <div className="quick-buyer-validation-answer-record-items" aria-label="Validation answer record checks">
                      {validationAnswerRecord.items.map((item) => (
                        <article key={item.id} className={item.status}>
                          <span>{item.label}</span>
                          <strong>
                            {item.status} / matched {item.matchedSignals.length}
                          </strong>
                          <small>Matched: {item.matchedSignals.join(", ") || "none"}</small>
                          <em>Missing: {item.missingSignals.join(", ") || "none"}</em>
                          <small>
                            Source: {item.sourceStatus}. {item.action}
                          </small>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="quick-buyer-validation-answer-record is-empty" aria-label="Validation answer recorder empty state">
                    <span>waiting</span>
                    <strong>Answers not recorded yet</strong>
                    <small>Do not count buyer validation as approval evidence until the conversation has been pasted and scored.</small>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={cx("quick-buyer-send-memo", roomPreview.sendMemo.status)} aria-label="Buyer send memo">
            <div className="quick-buyer-send-memo-main">
              <span>
                <Send size={14} />
                Buyer send memo
              </span>
              <strong>{roomPreview.sendMemo.headline}</strong>
              <p>{roomPreview.sendMemo.summary}</p>
              <div className="quick-buyer-send-memo-actions" aria-label="Buyer send memo actions">
                <a href={roomPreview.sendMemo.mailtoHref}>
                  <Send size={14} />
                  Draft email
                </a>
                <a href={roomPreview.sendMemo.exportHref} download="quick-buyer-send-memo.md">
                  <Download size={14} />
                  Export memo
                </a>
              </div>
            </div>
            <div className="quick-buyer-send-memo-body" aria-label="Buyer send memo body">
              <span>{roomPreview.sendMemo.subject}</span>
              <pre>{roomPreview.sendMemo.bodyText}</pre>
            </div>
            <div className="quick-buyer-send-memo-items" aria-label="Buyer send memo proof rows">
              {roomPreview.sendMemo.items.map((item) => (
                <article key={item.id} className={item.status}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </article>
              ))}
            </div>
          </div>
          <div className={cx("quick-pilot-proof-contract", roomPreview.pilotProofContract.status)} aria-label="Pilot proof contract">
            <div className="quick-pilot-proof-contract-main">
              <span>
                <ShieldCheck size={14} />
                Pilot proof contract
              </span>
              <strong>{roomPreview.pilotProofContract.headline}</strong>
              <p>{roomPreview.pilotProofContract.summary}</p>
              <div className="quick-pilot-proof-contract-actions" aria-label="Pilot proof contract actions">
                <a href={roomPreview.pilotProofContract.exportHref} download="quick-pilot-proof-contract.md">
                  <Download size={14} />
                  Export contract
                </a>
                <a href="#quick-decision-close-pack">
                  <ClipboardCheck size={14} />
                  Close pack
                </a>
              </div>
            </div>
            <div className="quick-pilot-proof-contract-terms" aria-label="Pilot proof contract terms">
              {roomPreview.pilotProofContract.items.map((item) => (
                <a key={item.id} href={item.href} className={item.status}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.owner}</small>
                  <em>{item.action}</em>
                </a>
              ))}
            </div>
          </div>
          {appliedLaunchPacket && (
            <div className={cx("quick-applied-launch-packet", appliedLaunchPacket.status)} aria-label="Applied launch packet">
              <div className="quick-applied-launch-packet-main">
                <span>
                  <BadgeCheck size={14} />
                  {appliedLaunchPacket.label}
                </span>
                <strong>{appliedLaunchPacket.headline}</strong>
                <p>{appliedLaunchPacket.summary}</p>
                <div className="quick-applied-launch-packet-actions" aria-label="Applied launch packet actions">
                  <button type="button" className={cx(launchPacketCopyStatus === "copied" && "is-confirmed", launchPacketCopyStatus === "failed" && "is-risk")} onClick={copyAppliedLaunchPacket}>
                    <Copy size={14} />
                    {copyLaunchPacketLabel}
                  </button>
                  <a href={appliedLaunchExportHref} download={appliedLaunchExportFilename}>
                    <Download size={14} />
                    Export packet
                  </a>
                  {appliedLaunchPacket.status !== "ready" && (
                    <a className="is-repair" href={`#${QUICK_PROOF_REPAIR_PLAN_ID}`}>
                      <Crosshair size={14} />
                      Fix proof gaps
                    </a>
                  )}
                </div>
              </div>
              <section className="quick-applied-send-desk" aria-label="Buyer send desk">
                <header>
                  <span>
                    <Gauge size={14} />
                    Buyer send desk
                  </span>
                  <strong>{appliedLaunchPacket.sendDesk.headline}</strong>
                  <p>{appliedLaunchPacket.sendDesk.summary}</p>
                </header>
                <div className="quick-applied-send-desk-metrics" aria-label="Send desk metrics">
                  {appliedLaunchPacket.sendDesk.metrics.map((metric) => (
                    <article key={metric.id} className={metric.status}>
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                      <p>{metric.detail}</p>
                    </article>
                  ))}
                </div>
                <div className="quick-applied-send-routes" aria-label="Stakeholder routes">
                  {appliedLaunchPacket.sendDesk.routes.map((route) => {
                    const launchRouteGated = route.id === "buyer" && appliedLaunchPacket.status === "ready" && !liveProofVerified;
                    const routeHref = launchRouteGated ? "" : route.id === "buyer" && verifiedLaunchRoomHref ? verifiedLaunchRoomHref : route.href;
                    const routeContent = (
                      <>
                        <span>{route.label}</span>
                        <strong>{route.owner}</strong>
                        <p>{launchRouteGated ? "Run live proof verification, then open the launch room for continue, revise, or stop." : route.action}</p>
                        <small>{launchRouteGated ? liveProofAudit?.nextAction : route.proof}</small>
                      </>
                    );
                    return routeHref ? (
                      <a key={route.id} className={route.status} href={routeHref} target="_blank" rel="noreferrer">
                        {routeContent}
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <article key={route.id} className={route.status}>
                        {routeContent}
                      </article>
                    );
                  })}
                </div>
                <div className="quick-applied-acceptance-checks" aria-label="Acceptance checks">
                  {appliedLaunchPacket.sendDesk.checks.map((check) => (
                    <article key={check.id} className={check.status}>
                      <span>
                        <ShieldCheck size={13} />
                        {check.label}
                      </span>
                      <strong>{check.action}</strong>
                      <p>{check.evidence}</p>
                    </article>
                  ))}
                </div>
              </section>
              <div className="quick-applied-launch-packet-links" aria-label="Applied launch links">
                  {appliedLaunchLinks.map((link) => (
                    <a key={link.id} href={link.href} target={link.href.startsWith("#") ? undefined : "_blank"} rel={link.href.startsWith("#") ? undefined : "noreferrer"}>
                    <span>{link.label}</span>
                    <strong>{link.role}</strong>
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
              <pre>{appliedLaunchPacket.previewText}</pre>
            </div>
          )}
          {publicationKit && (
            <div className={cx("quick-publication-kit", publicationKit.status)} aria-label="Publication kit">
              <div className="quick-publication-kit-main">
                <span>
                  <FileText size={14} />
                  Publication kit
                </span>
                <strong>{publicationKit.headline}</strong>
                <p>{publicationKit.summary}</p>
                <div className="quick-publication-kit-actions" aria-label="Publication kit exports">
                  <a href={publicationKit.storyHref} download="quick-protopedia-story.txt">
                    <Download size={14} />
                    Story copy
                  </a>
                  <a href={publicationKit.walkthroughHref} download="quick-walkthrough-shot-list.txt">
                    <Download size={14} />
                    Walkthrough
                  </a>
                  <a href={publicationKit.exportHref} download="quick-publication-kit.md">
                    <Download size={14} />
                    Export kit
                  </a>
                </div>
              </div>
              <div className="quick-publication-kit-copy" aria-label="ProtoPedia story preview">
                <span>Story copy</span>
                <pre>{publicationKit.storyText.split("\n").slice(0, 18).join("\n")}</pre>
              </div>
              <div className="quick-publication-kit-copy" aria-label="Walkthrough shot list preview">
                <span>Walkthrough shot list</span>
                <pre>{publicationKit.walkthroughText}</pre>
              </div>
              <div className="quick-publication-kit-items" aria-label="Publication checklist">
                {publicationKit.items.map((item) => (
                  <article key={item.id} className={item.status}>
                    <span>{item.label}</span>
                    <strong>{item.action}</strong>
                    <small>
                      {item.owner}: {item.evidence}
                    </small>
                  </article>
                ))}
              </div>
            </div>
          )}
          <div className={cx("quick-buyer-decision-case", roomPreview.decisionCase.status)} aria-label="Buyer decision case">
            <div className="quick-buyer-decision-case-main">
              <span>
                <ClipboardCheck size={14} />
                Buyer decision case
              </span>
              <strong>{roomPreview.decisionCase.headline}</strong>
              <p>{roomPreview.decisionCase.summary}</p>
            </div>
            <div className="quick-buyer-decision-case-next">
              <span>{roomPreview.decisionCase.decisionLabel}</span>
              <strong>{roomPreview.decisionCase.answer}</strong>
              <small>
                {roomPreview.decisionCase.owner}: {roomPreview.decisionCase.nextAction}
              </small>
              <a href={roomPreview.decisionCase.caseHref} download="quick-buyer-decision-case.txt">
                <Download size={14} />
                Decision case
              </a>
            </div>
            <div className="quick-buyer-decision-case-evidence" aria-label="Decision evidence">
              <article>
                <span>Buyer question</span>
                <strong>{roomPreview.decisionCase.buyerQuestion}</strong>
              </article>
              <article>
                <span>Value evidence</span>
                <strong>{roomPreview.decisionCase.valueEvidence}</strong>
              </article>
              <article>
                <span>Public proof</span>
                <strong>{roomPreview.decisionCase.proofEvidence}</strong>
              </article>
              <article>
                <span>Trust boundary</span>
                <strong>{roomPreview.decisionCase.trustEvidence}</strong>
                <small>{roomPreview.decisionCase.dataBoundary}</small>
              </article>
            </div>
          </div>
          <div className={cx("quick-economics-stress", roomPreview.economicsStressTest.status)} aria-label="Pilot economics stress test">
            <div className="quick-economics-stress-main">
              <span>
                <Gauge size={14} />
                Pilot economics stress test
              </span>
              <strong>{roomPreview.economicsStressTest.headline}</strong>
              <p>{roomPreview.economicsStressTest.summary}</p>
            </div>
            <div className="quick-economics-stress-floor">
              <span>Risk-adjusted floor</span>
              <strong>{formatYen(roomPreview.economicsStressTest.riskAdjustedMonthlyValueYen)}</strong>
              <small>{roomPreview.economicsStressTest.monthlyValueRange}</small>
              <a href={roomPreview.economicsStressTest.exportHref} download="quick-pilot-economics-stress-test.md">
                <Download size={14} />
                Stress test
              </a>
            </div>
            <div className="quick-economics-scenarios" aria-label="Economics scenarios">
              {roomPreview.economicsStressTest.scenarios.map((scenario) => (
                <article key={scenario.id} className={scenario.status}>
                  <span>{scenario.label}</span>
                  <strong>{formatYen(scenario.monthlyValueYen)}/month</strong>
                  <small>
                    {scenario.monthlyHoursSaved}h saved / {scenario.adoptionRatePercent}% adoption / {scenario.savedMinutesPerRun}m per run
                  </small>
                  <p>{scenario.action}</p>
                </article>
              ))}
            </div>
          </div>
          <div className={cx("quick-claim-proof-ledger", roomPreview.claimProofLedger.status)} aria-label="Claim-proof ledger">
            <div className="quick-claim-proof-head">
              <div>
                <span>
                  <ShieldCheck size={14} />
                  Claim-proof ledger
                </span>
                <strong>{roomPreview.claimProofLedger.headline}</strong>
                <p>{roomPreview.claimProofLedger.summary}</p>
              </div>
              <div className="quick-claim-proof-score">
                <span>Trace score</span>
                <strong>{roomPreview.claimProofLedger.score}/100</strong>
                <small>{roomPreview.claimProofLedger.primaryRisk}</small>
                <div className="quick-claim-proof-actions" aria-label="Claim-proof exports">
                  <a href={roomPreview.claimProofLedger.exportHref} download="quick-claim-proof-ledger.md">
                    <Download size={14} />
                    Ledger
                  </a>
                  <a href={roomPreview.claimProofLedger.csvHref} download="quick-claim-proof-ledger.csv">
                    <Download size={14} />
                    Claim CSV
                  </a>
                  <a href={roomPreview.claimProofLedger.receiptHref} download={`${roomPreview.claimProofLedger.receipt.receiptId}.json`}>
                    <ShieldCheck size={14} />
                    Receipt
                  </a>
                </div>
              </div>
            </div>
            <div className="quick-claim-proof-stats">
              <span>{roomPreview.claimProofLedger.readyCount}/{roomPreview.claimProofLedger.items.length} ready</span>
              <span>{roomPreview.claimProofLedger.watchCount} watch</span>
              <span>{roomPreview.claimProofLedger.blockedCount} blocked</span>
              <span>{roomPreview.claimProofLedger.receipt.receiptId}</span>
            </div>
            <div className="quick-claim-proof-grid" aria-label="Claim proof rows">
              {roomPreview.claimProofLedger.items.map((item) => (
                <a key={item.id} className={item.status} href={item.href}>
                  <span>{item.label}</span>
                  <strong>{item.claim}</strong>
                  <small>{item.evidence}</small>
                  <small>{item.sourceLineNumber ? `Source ${item.sourceStatus}: L${item.sourceLineNumber}` : `Source ${item.sourceStatus}: ${item.source}`}</small>
                  <em>{item.nextAction}</em>
                </a>
              ))}
            </div>
          </div>
          <div className={cx("quick-buyer-promise-gate", roomPreview.buyerPromiseGate.status)} aria-label="Buyer promise gate">
            <div className="quick-buyer-promise-head">
              <div>
                <span>
                  <FileText size={14} />
                  Buyer promise gate
                </span>
                <strong>{roomPreview.buyerPromiseGate.headline}</strong>
                <p>{roomPreview.buyerPromiseGate.summary}</p>
              </div>
              <div className="quick-buyer-promise-safe-use">
                <span>{roomPreview.buyerPromiseGate.safeUse}</span>
                <strong>
                  {roomPreview.buyerPromiseGate.readyCount}/{roomPreview.buyerPromiseGate.items.length} gates
                </strong>
                <small>{roomPreview.buyerPromiseGate.nextAction}</small>
                <a href={roomPreview.buyerPromiseGate.exportHref} download="quick-buyer-promise-gate.md">
                  <Download size={14} />
                  Promise gate
                </a>
              </div>
            </div>
            <blockquote className="quick-buyer-promise-copy">{roomPreview.buyerPromiseGate.publicPromise}</blockquote>
            <div className="quick-buyer-promise-grid" aria-label="Buyer promise gates">
              {roomPreview.buyerPromiseGate.items.map((item) => (
                <a key={item.id} className={item.status} href={item.href}>
                  <span>{item.label}</span>
                  <strong>{item.allowedClaim}</strong>
                  <small>{item.evidence}</small>
                  <em>{item.nextAction}</em>
                </a>
              ))}
            </div>
            <div className="quick-buyer-promise-dont-claim" aria-label="Claims not allowed yet">
              <span>Do not claim yet</span>
              <ul>
                {roomPreview.buyerPromiseGate.notAllowedClaims.map((claimText) => (
                  <li key={claimText}>{claimText}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className={cx("quick-buyer-handoff", roomPreview.handoffBrief.decision)} aria-label="Buyer handoff brief">
            <div className="quick-buyer-handoff-main">
              <span>
                <Send size={14} />
                Buyer handoff
              </span>
              <strong>{roomPreview.handoffBrief.headline}</strong>
              <p>{roomPreview.handoffBrief.promise}</p>
            </div>
            <div className="quick-buyer-handoff-next">
              <span>{roomPreview.handoffBrief.label}</span>
              <strong>{roomPreview.handoffBrief.proofSummary}</strong>
              <small>
                {roomPreview.handoffBrief.nextAction.owner}: {roomPreview.handoffBrief.nextAction.action}
              </small>
              <a href={roomPreview.handoffBrief.handoffHref} download="quick-buyer-handoff-brief.txt">
                <Download size={14} />
                Handoff brief
              </a>
            </div>
            <ul className="quick-buyer-handoff-message">
              {roomPreview.handoffBrief.buyerMessage.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="quick-buyer-room-preview-grid">
            {roomPreview.rows.map((row) => (
              <article key={row.id} className={row.status}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
                <small>{row.proof}</small>
              </article>
            ))}
          </div>
          <div id={QUICK_PROOF_REPAIR_PLAN_ID} className="quick-proof-repair-plan" aria-label="Proof repair plan">
            <div className="quick-proof-repair-head">
              <div>
                <span>Proof repair plan</span>
                <strong>{roomPreview.proofRepairPlan.headline}</strong>
                <p>{roomPreview.proofRepairPlan.summary}</p>
              </div>
              <a href={roomPreview.proofRepairPlan.repairHref} download="quick-proof-repair-plan.txt">
                <Download size={14} />
                Repair plan
              </a>
            </div>
            <div className="quick-proof-repair-items">
              {roomPreview.proofRepairPlan.items.map((item) => (
                <article key={item.id} id={quickProofRepairFieldId(item.id)} className={item.status}>
                  <label>
                    <span>{item.label}</span>
                    <input
                      type="url"
                      value={item.value === "Missing public URL" ? "" : item.value}
                      onChange={(event) => updateProofLink(item.id, event.target.value)}
                      placeholder={item.placeholder}
                      aria-label={proofInputAriaLabel(item.label)}
                    />
                  </label>
                  <small>
                    {item.owner}: {item.action}
                  </small>
                  <a href={item.href}>Open panel</a>
                </article>
              ))}
            </div>
            <div className={cx("quick-proof-repair-impact-preview", roomPreview.proofRepairPlan.impact.status)} aria-label="Proof repair impact preview">
              <div className="quick-proof-repair-impact-main">
                <span>
                  <Gauge size={13} />
                  Repair impact
                </span>
                <strong>{roomPreview.proofRepairPlan.impact.headline}</strong>
                <p>{roomPreview.proofRepairPlan.impact.summary}</p>
                <small>
                  {roomPreview.proofRepairPlan.impact.readinessScore}/100 proof readiness / first open: {roomPreview.proofRepairPlan.impact.firstOpenLabel}
                </small>
                <a href={roomPreview.proofRepairPlan.impact.exportHref} download="quick-proof-repair-impact.md">
                  <Download size={14} />
                  Impact preview
                </a>
              </div>
              <div className="quick-proof-repair-impact-items">
                {roomPreview.proofRepairPlan.impact.items.map((item) => (
                  <a key={item.id} href={item.href} className={item.status}>
                    <span>{item.label}</span>
                    <strong>{item.evidence}</strong>
                    <small>{item.nextAction}</small>
                  </a>
                ))}
              </div>
            </div>
            {proofVerificationHandoff && (
              <div className={cx("quick-proof-verification-handoff", proofVerificationHandoff.status)} aria-label="Buyer-send proof verification handoff">
                <div className="quick-proof-verification-handoff-main">
                  <span>
                    <ShieldCheck size={13} />
                    Verification handoff
                  </span>
                  <strong>{proofVerificationHandoff.headline}</strong>
                  <p>{proofVerificationHandoff.summary}</p>
                  <small>{proofVerificationHandoff.buyerSendDecision}</small>
                  <div className="quick-proof-verification-handoff-actions" aria-label="Proof verification handoff actions">
                    <button type="button" onClick={verifyProofLinks} disabled={verifyStatus === "checking"}>
                      <Gauge size={14} />
                      {liveProofButtonLabel(verifyStatus)}
                    </button>
                    <a href={proofVerificationHandoff.exportHref} download="quick-proof-verification-handoff.md">
                      <Download size={14} />
                      Handoff
                    </a>
                    {liveProofAudit?.status !== "not-run" && (
                      <a href={liveProofAuditHref} download="quick-live-proof-audit.md">
                        <FileText size={14} />
                        Audit receipt
                      </a>
                    )}
                  </div>
                </div>
                <div className="quick-proof-verification-handoff-detail">
                  <div className="quick-proof-verification-handoff-stats" aria-label="Proof verification handoff status">
                    <span>{proofVerificationHandoff.readyCount}/{proofVerificationHandoff.totalCount} verified</span>
                    <span>Receipt {proofVerificationHandoff.receiptId}</span>
                    <span>Score {proofVerificationHandoff.score}/100</span>
                    <span>Checked {proofVerificationHandoff.checkedAt || "not run"}</span>
                  </div>
                  <div className="quick-proof-verification-handoff-items" aria-label="Proof verification handoff rows">
                    {proofVerificationHandoff.items.map((item) => (
                      <a key={item.id} href={item.href} className={item.status}>
                        <span>{item.label}</span>
                        <strong>{item.status === "ready" ? "verified" : item.verificationStatus}</strong>
                        <small>{item.evidence}</small>
                        <em>
                          {item.owner}: {item.nextAction}
                        </em>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {proofReplacementPacket && (
              <div className={cx("quick-proof-replacement-packet", proofReplacementPacket.status)} aria-label="Quick buyer proof replacement packet">
                <div className="quick-proof-replacement-main">
                  <span>
                    <Crosshair size={13} />
                    Buyer proof replacement packet
                  </span>
                  <strong>{proofReplacementPacket.headline}</strong>
                  <p>{proofReplacementPacket.summary}</p>
                  <div className="quick-proof-replacement-actions" aria-label="Quick proof replacement actions">
                    <button type="button" onClick={verifyProofLinks} disabled={proofReplacementPacket.mode === "replace" || verifyStatus === "checking"}>
                      <Gauge size={14} />
                      {verifyStatus === "checking" ? "Checking links" : proofReplacementPacket.mode === "send" ? "Recheck live links" : "Verify live links"}
                    </button>
                    <a href={proofReplacementExportHref} download="quick-buyer-proof-replacement-packet.md">
                      <Download size={14} />
                      Packet
                    </a>
                    <a href={proofReplacementCsvHref} download="quick-buyer-proof-replacement-ledger.csv">
                      <Download size={14} />
                      CSV
                    </a>
                    <a href={proofReplacementPacket.receipt.verificationRequestHref} download="quick-buyer-proof-replacement-receipt.json">
                      <ShieldCheck size={14} />
                      Receipt
                    </a>
                    <a href={proofReplacementVerifierHref}>
                      <ExternalLink size={14} />
                      Verify
                    </a>
                  </div>
                </div>
                <div className="quick-proof-replacement-score" aria-label="Quick proof replacement score">
                  <span>{proofReplacementPacket.mode}</span>
                  <strong>
                    {proofReplacementPacket.readyCount}/{proofReplacementPacket.totalCount}
                  </strong>
                  <small>{proofReplacementPacket.receipt.receiptId}</small>
                </div>
                <div className="quick-proof-replacement-rows" aria-label="Quick proof replacement rows">
                  {proofReplacementPacket.items.map((item) => (
                    <a key={item.id} href={item.href} className={item.status}>
                      <span>{item.label}</span>
                      <strong>{item.displayValue}</strong>
                      <small>{item.owner}</small>
                      <em>{item.action}</em>
                    </a>
                  ))}
                </div>
                <div className="quick-proof-replacement-send" aria-label="Quick proof replacement send packet">
                  <div>
                    <span>Buyer send packet</span>
                    <strong>{proofReplacementPacket.sendPacket.headline}</strong>
                    <p>{proofReplacementPacket.sendPacket.detail}</p>
                  </div>
                  <ol>
                    {proofReplacementPacket.sendPacket.steps.map((step) => (
                      <li key={step.id} className={step.status}>
                        <span>{step.label}</span>
                        <small>{step.detail}</small>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
            {proofRepairComplete && (
              <div className={cx("quick-proof-repair-completion", status === "applied" && "is-applied")} aria-label="Proof repair completion">
                <div>
                  <span>
                    <BadgeCheck size={13} />
                    {status === "applied" && liveProofVerified ? "Live proof verified" : "Public proof complete"}
                  </span>
                  <strong>{status === "applied" ? (liveProofVerified ? "Repaired workspace is live-verified" : "Run final live proof check") : "Apply the repaired workspace"}</strong>
                  <p>
                    {status === "applied"
                      ? liveProofVerified
                        ? "All five public proof links responded live. The launch room can be opened with the audit receipt attached."
                        : liveProofAudit?.status === "action-required"
                          ? liveProofAudit.summary
                          : "All five public proof links are attached to the applied packet. Run live proof before opening the launch room."
                      : "All five public proof links are attached. Apply this repaired workspace to regenerate the buyer room packet."}
                  </p>
                </div>
                <div className="quick-proof-repair-completion-actions">
                  {status === "applied" ? (
                    <>
                      {liveProofVerified ? (
                        <>
                          {appliedLaunchRoomLink && (
                            <a href={verifiedLaunchRoomHref} target={verifiedLaunchRoomHref.startsWith("#") ? undefined : "_blank"} rel={verifiedLaunchRoomHref.startsWith("#") ? undefined : "noreferrer"}>
                              <ExternalLink size={14} />
                              Launch room
                            </a>
                          )}
                          <a href={liveProofAuditHref} download="quick-live-proof-audit.md">
                            <Download size={14} />
                            Audit receipt
                          </a>
                        </>
                      ) : (
                        <>
                          <button type="button" className="is-live-proof" onClick={verifyProofLinks} disabled={verifyStatus === "checking"}>
                            <Gauge size={14} />
                            {liveProofButtonLabel(verifyStatus)}
                          </button>
                          <a href={`#${QUICK_LIVE_PROOF_AUDIT_ID}`}>
                            <Gauge size={14} />
                            Open audit
                          </a>
                        </>
                      )}
                      {appliedLaunchPacket && (
                        <a href={appliedLaunchExportHref} download={appliedLaunchExportFilename}>
                          <Download size={14} />
                          Export packet
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <button type="button" className="is-primary" onClick={applyDraft} disabled={!canApply} title={applyGateMessage}>
                        <ClipboardCheck size={14} />
                        Apply repaired workspace
                      </button>
                      <a href={roomPreviewHref} download="quick-buyer-room-preview.md">
                        <Download size={14} />
                        Export preview
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {liveProofAudit && (
            <div id={QUICK_LIVE_PROOF_AUDIT_ID} className={cx("quick-live-proof-audit", liveProofAudit.status, verifyStatus === "failed" && "is-failed")} aria-label="Live proof audit">
              <div className="quick-live-proof-audit-head">
                <div>
                  <span>
                    <Gauge size={14} />
                    Live proof audit
                  </span>
                  <strong>{liveProofAudit.headline}</strong>
                  <p>{liveProofAudit.summary}</p>
                </div>
                <div className="quick-live-proof-audit-actions">
                  <button type="button" onClick={verifyProofLinks} disabled={verifyStatus === "checking"}>
                    <Gauge size={14} />
                    {liveProofButtonLabel(verifyStatus)}
                  </button>
                  {verifyStatus === "checked" && (
                    <a href={liveProofAudit.verificationRequestHref} download="workflow-live-proof-audit-receipt.json">
                      <Download size={14} />
                      Receipt
                    </a>
                  )}
                  {verifyStatus === "checked" && (
                    <a href={liveProofAuditVerifierHref}>
                      <ShieldCheck size={14} />
                      Verify
                    </a>
                  )}
                </div>
              </div>
              <div className="quick-live-proof-audit-stats">
                <span>Receipt {liveProofAudit.receiptId}</span>
                <span>
                  Checksum {liveProofAudit.checksumAlgorithm}:{liveProofAudit.checksum}
                </span>
                <span>Score {liveProofAudit.score}/100</span>
                <span>
                  Verified {liveProofAudit.verifiedCount}/{liveProofAudit.totalCount}
                </span>
                <span>Checked {liveProofAudit.checkedAt || "not run"}</span>
              </div>
              <div className="quick-live-proof-audit-rows">
                {liveProofAudit.rows.map((row) => (
                  <article key={row.id} className={row.status}>
                    <span>{row.label}</span>
                    <strong>{row.status}</strong>
                    <small>{row.evidence}</small>
                  </article>
                ))}
              </div>
              <p>{liveProofAudit.nextAction}</p>
            </div>
          )}
          <div className="quick-buyer-objection-brief" aria-label="Buyer objection brief">
            <div className="quick-buyer-objection-head">
              <div>
                <span>
                  <ShieldCheck size={14} />
                  Buyer objection brief
                </span>
                <strong>{roomPreview.objectionBrief.headline}</strong>
                <p>{roomPreview.objectionBrief.summary}</p>
              </div>
              <a href={roomPreview.objectionBrief.defenseHref} download="quick-buyer-objection-brief.txt">
                <Download size={14} />
                Objection brief
              </a>
            </div>
            <div className="quick-buyer-objection-items">
              {roomPreview.objectionBrief.items.map((item) => (
                <a key={item.id} className={item.status} href={item.href}>
                  <span>{item.label}</span>
                  <strong>{item.question}</strong>
                  <small>
                    {item.answer} {item.owner}: {item.evidence}
                  </small>
                </a>
              ))}
            </div>
          </div>
          <div className={cx("quick-approval-route", roomPreview.approvalRoute.status)} aria-label="Stakeholder approval route">
            <div className="quick-approval-route-head">
              <div>
                <span>
                  <ClipboardCheck size={14} />
                  Stakeholder approval route
                </span>
                <strong>{roomPreview.approvalRoute.headline}</strong>
                <p>{roomPreview.approvalRoute.summary}</p>
              </div>
              <a href={roomPreview.approvalRoute.routeHref} download="quick-stakeholder-approval-route.md">
                <Download size={14} />
                Approval route
              </a>
            </div>
            <div className="quick-approval-route-stats">
              <span>{roomPreview.approvalRoute.readyCount}/4 ready</span>
              <span>{roomPreview.approvalRoute.blockedCount} blocked</span>
              <span>{roomPreview.approvalRoute.status}</span>
            </div>
            <div className="quick-approval-route-steps">
              {roomPreview.approvalRoute.steps.map((step) => (
                <a key={step.id} className={step.status} href={step.href}>
                  <span>{step.label}</span>
                  <strong>{step.gate}</strong>
                  <small>
                    {step.owner}: {step.evidence} Next: {step.nextAction}
                  </small>
                </a>
              ))}
            </div>
            <div className="quick-approval-email-pack" aria-label="Stakeholder approval email pack">
              <div className="quick-approval-email-pack-head">
                <div>
                  <span>
                    <Send size={14} />
                    Approval email pack
                  </span>
                  <strong>{roomPreview.approvalEmailPack.headline}</strong>
                  <p>{roomPreview.approvalEmailPack.summary}</p>
                </div>
                <a href={roomPreview.approvalEmailPack.exportHref} download="quick-stakeholder-approval-email-pack.md">
                  <Download size={14} />
                  Email pack
                </a>
              </div>
              <div className="quick-approval-email-meta">
                <span>Next: {roomPreview.approvalEmailPack.nextRecipient}</span>
                <span>{roomPreview.approvalEmailPack.approvalDeadline}</span>
              </div>
              <div className="quick-approval-email-list">
                {roomPreview.approvalEmailPack.messages.map((message) => (
                  <a key={message.id} className={message.status} href={message.mailtoHref}>
                    <span>{message.label}</span>
                    <strong>{message.subject}</strong>
                    <small>{message.replyTarget}</small>
                    <em>{message.risk}</em>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className={cx("quick-contract-terms", roomPreview.pilotContractTerms.status)} aria-label="Pilot contract terms">
            <div className="quick-contract-terms-head">
              <div>
                <span>
                  <FileText size={14} />
                  Pilot contract terms
                </span>
                <strong>{roomPreview.pilotContractTerms.headline}</strong>
                <p>{roomPreview.pilotContractTerms.summary}</p>
              </div>
              <div className="quick-contract-terms-cap">
                <span>Budget cap</span>
                <strong>{roomPreview.pilotContractTerms.budgetCapYen > 0 ? formatYen(roomPreview.pilotContractTerms.budgetCapYen) : "Not ready"}</strong>
                <small>{roomPreview.pilotContractTerms.effectiveWindow}</small>
                <a href={roomPreview.pilotContractTerms.contractHref} download="quick-pilot-contract-terms.md">
                  <Download size={14} />
                  Contract terms
                </a>
              </div>
            </div>
            <div className="quick-contract-terms-stats">
              <span>{roomPreview.pilotContractTerms.clearCount}/6 clear</span>
              <span>{roomPreview.pilotContractTerms.blockedCount} blocked</span>
              <span>{roomPreview.pilotContractTerms.status}</span>
            </div>
            <div className="quick-contract-term-grid">
              {roomPreview.pilotContractTerms.terms.map((term) => (
                <a key={term.id} className={term.status} href={term.href}>
                  <span>{term.label}</span>
                  <strong>{term.clause}</strong>
                  <small>
                    {term.owner}: {term.acceptance} Evidence: {term.evidence}
                  </small>
                </a>
              ))}
            </div>
            <div className="quick-contract-stop-rules" aria-label="Contract stop rules">
              {roomPreview.pilotContractTerms.stopRules.map((rule) => (
                <span key={rule}>{rule}</span>
              ))}
            </div>
          </div>
          <div className={cx("quick-procurement-matrix", roomPreview.procurementMatrix.status)} aria-label="Procurement alternative matrix">
            <div className="quick-procurement-matrix-head">
              <div>
                <span>
                  <ClipboardCheck size={14} />
                  Procurement matrix
                </span>
                <strong>{roomPreview.procurementMatrix.headline}</strong>
                <p>{roomPreview.procurementMatrix.summary}</p>
              </div>
              <div className="quick-procurement-matrix-choice">
                <span>Recommended</span>
                <strong>{roomPreview.procurementMatrix.alternatives.find((alternative) => alternative.id === roomPreview.procurementMatrix.recommendedAlternativeId)?.label}</strong>
                <small>{roomPreview.procurementMatrix.status}</small>
                <a href={roomPreview.procurementMatrix.exportHref} download="quick-procurement-alternative-matrix.md">
                  <Download size={14} />
                  Matrix
                </a>
              </div>
            </div>
            <div className="quick-procurement-alternatives">
              {roomPreview.procurementMatrix.alternatives.map((alternative) => (
                <article key={alternative.id} className={cx(alternative.status, alternative.id === roomPreview.procurementMatrix.recommendedAlternativeId && "is-recommended")}>
                  <span>{alternative.label}</span>
                  <strong>{formatYen(alternative.monthlyValueYen)}/month</strong>
                  <small>
                    Setup {formatYen(alternative.setupCostYen)} / payback {formatPaybackDays(alternative.paybackDays)}
                  </small>
                  <p>{alternative.decision}</p>
                  <em>{alternative.proofReadiness}</em>
                </article>
              ))}
            </div>
          </div>
          <div className="quick-pilot-week-plan" aria-label="Pilot week plan">
            {roomPreview.pilotWeekPlan.map((step) => (
              <a key={step.id} className={step.status} href={step.href}>
                <span>{step.day}</span>
                <strong>{step.label}</strong>
                <small>{step.owner}: {step.acceptance}</small>
              </a>
            ))}
          </div>
          <p className="quick-pilot-week-receipt">
            Receipt {roomPreview.pilotWeekTaskPacket.receipt.receiptId} / {roomPreview.pilotWeekTaskPacket.receipt.checksumAlgorithm}:{roomPreview.pilotWeekTaskPacket.receipt.checksum}
          </p>
          <div className={cx("quick-adoption-success-plan", roomPreview.adoptionSuccessPlan.status)} aria-label="30-day adoption success plan">
            <div className="quick-adoption-success-head">
              <div>
                <span>
                  <Gauge size={14} />
                  Adoption success
                </span>
                <strong>{roomPreview.adoptionSuccessPlan.headline}</strong>
                <p>{roomPreview.adoptionSuccessPlan.summary}</p>
              </div>
              <div className="quick-adoption-success-target">
                <span>{roomPreview.adoptionSuccessPlan.reviewWindow}</span>
                <strong>{roomPreview.adoptionSuccessPlan.retainedMonthlyValueYen > 0 ? `${formatYen(roomPreview.adoptionSuccessPlan.retainedMonthlyValueYen)}/month` : "Not ready"}</strong>
                <small>{roomPreview.adoptionSuccessPlan.adoptionTargetPercent > 0 ? `${roomPreview.adoptionSuccessPlan.adoptionTargetPercent}% adoption target` : "Adoption target missing"}</small>
                <a href={roomPreview.adoptionSuccessPlan.exportHref} download="quick-30-day-adoption-success-plan.md">
                  <Download size={14} />
                  Adoption plan
                </a>
              </div>
            </div>
            <div className="quick-adoption-success-stats">
              <span>{roomPreview.adoptionSuccessPlan.readyCount}/5 ready</span>
              <span>{roomPreview.adoptionSuccessPlan.blockedCount} blocked</span>
              <span>{roomPreview.adoptionSuccessPlan.status}</span>
            </div>
            <div className="quick-adoption-success-metrics">
              {roomPreview.adoptionSuccessPlan.metrics.map((metric) => (
                <article key={metric.id} className={metric.status}>
                  <span>{metric.label}</span>
                  <strong>{metric.target}</strong>
                  <small>
                    {metric.owner}: {metric.evidence}
                  </small>
                </article>
              ))}
            </div>
            <div className="quick-adoption-success-checkpoints">
              {roomPreview.adoptionSuccessPlan.checkpoints.map((checkpoint) => (
                <a key={checkpoint.id} className={checkpoint.status} href={checkpoint.href}>
                  <span>{checkpoint.window}</span>
                  <strong>{checkpoint.label}</strong>
                  <small>
                    {checkpoint.owner}: {checkpoint.exitCriteria}
                  </small>
                </a>
              ))}
            </div>
            <p className="quick-adoption-success-renewal">{roomPreview.adoptionSuccessPlan.renewalAsk}</p>
          </div>
          <div className={cx("quick-rollout-command-board", roomPreview.rolloutCommandBoard.status)} aria-label="Rollout command board">
            <div className="quick-rollout-command-head">
              <div>
                <span>
                  <Crosshair size={14} />
                  Rollout command board
                </span>
                <strong>{roomPreview.rolloutCommandBoard.headline}</strong>
                <p>{roomPreview.rolloutCommandBoard.summary}</p>
              </div>
              <div className="quick-rollout-command-next">
                <span>Next owner</span>
                <strong>{roomPreview.rolloutCommandBoard.nextOwner}</strong>
                <small>{roomPreview.rolloutCommandBoard.nextCommand}</small>
                <label className="quick-rollout-calendar-field">
                  <span>Pilot start</span>
                  <input type="date" value={rolloutStartDate} onChange={(event) => setRolloutStartDate(event.currentTarget.value)} aria-label="Pilot rollout start date" />
                </label>
                <div className="quick-rollout-command-actions" aria-label="Rollout command exports">
                  <a href={roomPreview.rolloutCommandBoard.exportHref} download="quick-rollout-command-board.md">
                    <Download size={14} />
                    Board
                  </a>
                  <a href={roomPreview.rolloutCommandBoard.taskCsvHref} download="quick-rollout-tasks.csv">
                    <Download size={14} />
                    Task CSV
                  </a>
                  <a href={roomPreview.rolloutCommandBoard.ownerBriefHref} download="quick-rollout-owner-brief.md">
                    <FileText size={14} />
                    Owner brief
                  </a>
                  <a href={roomPreview.rolloutCommandBoard.receiptHref} download={`${roomPreview.rolloutCommandBoard.receipt.receiptId}.json`}>
                    <ShieldCheck size={14} />
                    Receipt
                  </a>
                  {rolloutCalendarExport ? (
                    <a href={rolloutCalendarExport.icsHref} download={`${rolloutCalendarExport.receipt.receiptId}.ics`}>
                      <Download size={14} />
                      Calendar
                    </a>
                  ) : (
                    <button type="button" disabled>
                      <Download size={14} />
                      Calendar
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="quick-rollout-command-stats">
              <span>{roomPreview.rolloutCommandBoard.readyCount}/5 ready</span>
              <span>{roomPreview.rolloutCommandBoard.blockedCount} blocked</span>
              <span>{roomPreview.rolloutCommandBoard.status}</span>
            </div>
            <div className="quick-rollout-command-grid">
              {roomPreview.rolloutCommandBoard.commands.map((command) => (
                <a key={command.id} className={command.status} href={command.href}>
                  <span>{command.window}</span>
                  <strong>{command.label}</strong>
                  <small>
                    {command.owner}: {command.command}
                  </small>
                  <em>{command.risk}</em>
                </a>
              ))}
            </div>
            <div className="quick-rollout-owner-load" aria-label="Rollout owner workload">
              {roomPreview.rolloutCommandBoard.ownerLoads.map((load) => (
                <article key={load.owner} className={load.blockedCount > 0 ? "blocked" : "ready"}>
                  <span>{load.owner}</span>
                  <strong>
                    {load.commandCount} command{load.commandCount === 1 ? "" : "s"}
                  </strong>
                  <small>{load.blockedCount} blocked</small>
                  <p>{load.nextCommand}</p>
                </article>
              ))}
            </div>
          </div>
          <div id="quick-decision-close-pack" className={cx("quick-decision-close-pack", roomPreview.decisionClosePack.status)} aria-label="Decision close pack">
            <div className="quick-decision-close-head">
              <div>
                <span>
                  <ClipboardCheck size={14} />
                  Decision close pack
                </span>
                <strong>{roomPreview.decisionClosePack.headline}</strong>
                <p>{roomPreview.decisionClosePack.summary}</p>
              </div>
              <div className="quick-decision-close-state">
                <span>{roomPreview.decisionClosePack.agenda.decisionLabel}</span>
                <strong>
                  {roomPreview.decisionClosePack.followUpLedger.readyCount}/{roomPreview.decisionClosePack.followUpLedger.taskTotal} closed
                </strong>
                <small>{roomPreview.decisionClosePack.agenda.valueLine}</small>
                <div className="quick-decision-close-actions" aria-label="Decision close exports">
                  <a href={roomPreview.decisionClosePack.agendaHref} download="quick-buyer-decision-agenda.md">
                    <FileText size={14} />
                    Agenda
                  </a>
                  <a href={roomPreview.decisionClosePack.followUpHref} download="quick-decision-follow-up-ledger.md">
                    <Download size={14} />
                    Ledger
                  </a>
                  <a href={roomPreview.decisionClosePack.followUpLedger.csvHref} download="quick-decision-follow-up-ledger.csv">
                    <Download size={14} />
                    CSV
                  </a>
                  <a href={roomPreview.decisionClosePack.followUpHtmlHref} download="quick-decision-follow-up-page.html">
                    <ExternalLink size={14} />
                    Page
                  </a>
                  <a href={roomPreview.decisionClosePack.followUpLedger.receipt.href} download={`${roomPreview.decisionClosePack.followUpLedger.receipt.receiptId}.md`}>
                    <ShieldCheck size={14} />
                    Receipt
                  </a>
                </div>
              </div>
            </div>
            <div className="quick-decision-close-stats">
              <span>{roomPreview.decisionClosePack.agenda.readyCount}/{roomPreview.decisionClosePack.agenda.agendaTotal} agenda ready</span>
              <span>{roomPreview.decisionClosePack.followUpLedger.blockedCount} blocked</span>
              <span>{roomPreview.decisionClosePack.followUpLedger.attentionCount} attention</span>
              <span>{roomPreview.decisionClosePack.followUpLedger.receipt.receiptId}</span>
            </div>
            <div className="quick-decision-close-agenda" aria-label="Buyer decision agenda rows">
              {roomPreview.decisionClosePack.agenda.items.map((item) => (
                <a key={item.id} className={item.status} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noreferrer" : undefined}>
                  <span>{item.label}</span>
                  <strong>{item.owner}</strong>
                  <small>{item.outcome}</small>
                  <em>{item.evidence}</em>
                </a>
              ))}
            </div>
            <div className="quick-decision-close-tasks" aria-label="Decision follow-up owner tasks">
              {roomPreview.decisionClosePack.followUpLedger.tasks.map((task) => (
                <a key={task.id} className={task.status} href={task.href} target={task.href.startsWith("http") ? "_blank" : undefined} rel={task.href.startsWith("http") ? "noreferrer" : undefined}>
                  <span>
                    {task.label} / {task.dueLabel}
                  </span>
                  <strong>{task.owner}</strong>
                  <small>{task.nextStep}</small>
                  <em>{task.closeCondition}</em>
                </a>
              ))}
            </div>
            <div className="quick-decision-close-rules" aria-label="Decision close escalation rules">
              {roomPreview.decisionClosePack.followUpLedger.escalationRules.map((rule) => (
                <span key={rule}>{rule}</span>
              ))}
            </div>
          </div>
          <footer>{roomPreview.closeRule}</footer>
        </section>
      )}
      <div className="quick-workflow-intake-signals" aria-label="Detected quick workflow signals">
        {draft?.detectedSignals.length ? draft.detectedSignals.slice(0, 8).map((signal) => <span key={signal}>{signal}</span>) : <span>waiting for buyer workflow</span>}
      </div>
      {draft?.warnings.length ? (
        <ul className="quick-workflow-intake-warnings">
          {draft.warnings.slice(0, 2).map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
