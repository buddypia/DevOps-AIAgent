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
import type { QuickExternalReviewOwnerPacketRunbookItem } from "./quickExternalReviewOwnerPacketReceipt.js";
import { QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH } from "./quickWorkflowConversionReceipt.js";
import { QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION, quickBuyerEvidenceResponseShareHref } from "./quickExternalReviewPacketShare.js";

export type QuickBuyerRoomPreviewStatus = "ready" | "watch" | "blocked";

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

export type QuickBuyerEvidencePackBuyerQuestion = {
  id: string;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  question: string;
  answer: string;
  evidence: string;
  action: string;
  href: string;
};

export type QuickBuyerEvidenceAnswerBrief = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  totalCount: number;
  firstOpenQuestion: QuickBuyerEvidencePackBuyerQuestion | null;
  questions: QuickBuyerEvidencePackBuyerQuestion[];
  exportMarkdown: string;
  exportHref: string;
  csv: string;
  csvHref: string;
  mailHref: string;
};

export type QuickBuyerEvidenceDisclosureBoundaryItem = {
  id: "source-minimization" | "artifact-scope" | "public-redaction" | "claim-citation" | "send-boundary";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  disclosure: string;
  evidence: string;
  action: string;
  href: string;
};

export type QuickBuyerEvidenceDisclosureBoundary = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  totalCount: number;
  firstOpenItem: QuickBuyerEvidenceDisclosureBoundaryItem | null;
  items: QuickBuyerEvidenceDisclosureBoundaryItem[];
  exportMarkdown: string;
  exportHref: string;
  mailHref: string;
};

export type QuickBuyerEvidenceProcurementHandoffRoute = {
  id: "security" | "legal" | "finance" | "technical" | "sponsor";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  reviewQuestion: string;
  approvalSignal: string;
  evidence: string;
  action: string;
  href: string;
};

export type QuickBuyerEvidenceProcurementHandoff = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  totalCount: number;
  firstOpenRoute: QuickBuyerEvidenceProcurementHandoffRoute | null;
  routes: QuickBuyerEvidenceProcurementHandoffRoute[];
  exportMarkdown: string;
  exportHref: string;
  mailHref: string;
};

export type QuickBuyerEvidenceAdoptionRiskSeverity = "low" | "medium" | "high";

export type QuickBuyerEvidenceAdoptionRisk = {
  id: "source-trust" | "disclosure-boundary" | "proof-reachability" | "value-proof" | "decision-ownership";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  severity: QuickBuyerEvidenceAdoptionRiskSeverity;
  owner: string;
  exposure: string;
  mitigation: string;
  proofRequired: string;
  evidence: string;
  href: string;
};

export type QuickBuyerEvidenceAdoptionRiskLedger = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  clearanceScore: number;
  clearedCount: number;
  riskTotal: number;
  highRiskCount: number;
  firstOpenRisk: QuickBuyerEvidenceAdoptionRisk | null;
  risks: QuickBuyerEvidenceAdoptionRisk[];
  csv: string;
  csvHref: string;
  exportMarkdown: string;
  exportHref: string;
  mailHref: string;
};

export type QuickBuyerEvidenceDecisionMeetingAgendaItem = {
  id: "evidence-context" | "disclosure-review" | "value-case" | "technical-proof" | "decision-close";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  durationMinutes: number;
  owner: string;
  objective: string;
  evidence: string;
  decisionPrompt: string;
  action: string;
  href: string;
};

export type QuickBuyerEvidenceDecisionMeetingAgenda = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  totalCount: number;
  totalDurationMinutes: number;
  currentItem: QuickBuyerEvidenceDecisionMeetingAgendaItem;
  items: QuickBuyerEvidenceDecisionMeetingAgendaItem[];
  exportMarkdown: string;
  exportHref: string;
  mailHref: string;
};

export type QuickBuyerEvidenceCommitteeMinutesAttendee = {
  id: QuickBuyerEvidenceProcurementHandoffRoute["id"] | "reviewer";
  label: string;
  owner: string;
  status: QuickBuyerRoomPreviewStatus;
  responsibility: string;
};

export type QuickBuyerEvidenceCommitteeMinutesDecision = {
  id: "packet" | "committee-posture" | "approval-conditions" | "first-open-owner" | "response-record";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  value: string;
  evidence: string;
  action: string;
  href: string;
};

export type QuickBuyerEvidenceCommitteeMinutes = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  decision: QuickExternalReviewDecision;
  readyCount: number;
  totalCount: number;
  currentDecision: QuickBuyerEvidenceCommitteeMinutesDecision;
  attendees: QuickBuyerEvidenceCommitteeMinutesAttendee[];
  decisions: QuickBuyerEvidenceCommitteeMinutesDecision[];
  exportMarkdown: string;
  exportHref: string;
  mailHref: string;
};

export type QuickBuyerEvidenceActivationPlanStep = {
  id: "approval-gate" | "kickoff-owner" | "proof-recheck" | "value-baseline" | "stop-rule";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  dayOffset: number;
  owner: string;
  objective: string;
  evidence: string;
  closeCondition: string;
  action: string;
  href: string;
};

export type QuickBuyerEvidenceActivationPlan = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  totalCount: number;
  startDate: string;
  endDate: string;
  currentStep: QuickBuyerEvidenceActivationPlanStep;
  steps: QuickBuyerEvidenceActivationPlanStep[];
  calendarText: string;
  calendarHref: string;
  exportMarkdown: string;
  exportHref: string;
  mailHref: string;
};

export type QuickBuyerEvidenceValueCheckpointItem = {
  id: "baseline" | "proof-sample" | "adoption-signal" | "finance-decision" | "next-window";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  metric: string;
  target: string;
  evidence: string;
  action: string;
  href: string;
};

export type QuickBuyerEvidenceValueCheckpoint = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  readyCount: number;
  totalCount: number;
  currentItem: QuickBuyerEvidenceValueCheckpointItem;
  items: QuickBuyerEvidenceValueCheckpointItem[];
  csv: string;
  csvHref: string;
  exportMarkdown: string;
  exportHref: string;
  mailHref: string;
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
  buyerQuestions?: QuickBuyerEvidencePackBuyerQuestion[];
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

export type QuickBuyerEvidenceDecisionCockpitMetric = {
  id: "recommended-decision" | "required-artifacts" | "source-receipt" | "first-action";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  value: string;
  evidence: string;
  href?: string;
};

export type QuickBuyerEvidenceDecisionCockpit = {
  status: QuickBuyerRoomPreviewStatus;
  recommendedDecision: QuickExternalReviewDecision;
  headline: string;
  summary: string;
  confidence: number;
  requiredReady: number;
  requiredTotal: number;
  primaryQuestion: string;
  primaryAnswer: string;
  nextAction: string;
  metrics: QuickBuyerEvidenceDecisionCockpitMetric[];
};

export type QuickBuyerEvidenceDecisionMemoItem = {
  id: "buyer-outcome" | "trust-proof" | "open-risk" | "next-owner-action";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  value: string;
  evidence: string;
  href?: string;
};

export type QuickBuyerEvidenceDecisionMemoQuestion = {
  id: "trust" | "value" | "risk" | "next";
  question: string;
  answer: string;
  status: QuickBuyerRoomPreviewStatus;
  evidence: string;
  href?: string;
};

export type QuickBuyerEvidenceDecisionMemo = {
  status: QuickBuyerRoomPreviewStatus;
  recommendedDecision: QuickExternalReviewDecision;
  headline: string;
  summary: string;
  items: QuickBuyerEvidenceDecisionMemoItem[];
  questions: QuickBuyerEvidenceDecisionMemoQuestion[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerEvidenceApprovalChecklistItem = {
  id: "source-receipt" | "required-artifacts" | "open-risk" | "decision-readiness" | "response-path";
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  question: string;
  evidence: string;
  approvalCondition: string;
  action: string;
  href: string;
};

export type QuickBuyerEvidenceApprovalChecklist = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  decisionGate: string;
  readyCount: number;
  totalCount: number;
  currentItem: QuickBuyerEvidenceApprovalChecklistItem;
  items: QuickBuyerEvidenceApprovalChecklistItem[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerEvidenceLiveAuditTarget = {
  id: QuickBuyerEvidencePackShareArtifact["id"];
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  href: string;
  role: string;
  proof: string;
  requiredForSend: boolean;
};

export type QuickBuyerEvidenceLiveAuditPlan = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  targetCount: number;
  requiredTargetCount: number;
  readyTargetCount: number;
  firstTarget: QuickBuyerEvidenceLiveAuditTarget | null;
  targets: QuickBuyerEvidenceLiveAuditTarget[];
  exportMarkdown: string;
  exportHref: string;
};

export type QuickBuyerEvidenceLiveAuditResultStatus = "pass" | "watch" | "block";

export type QuickBuyerEvidenceLiveAuditResultInput = {
  id: string;
  label: string;
  status: QuickBuyerEvidenceLiveAuditResultStatus;
  url?: string;
  evidence: string;
  action: string;
  httpStatus?: number;
};

export type QuickBuyerEvidenceLiveAuditSummaryInput = {
  checkedAt: string;
  verifiedCount: number;
  totalCount: number;
  score: number;
  results: QuickBuyerEvidenceLiveAuditResultInput[];
};

export type QuickBuyerEvidenceAuditRepairTask = {
  id: string;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  dueLabel: string;
  evidence: string;
  action: string;
  closeCondition: string;
  href: string;
};

export type QuickBuyerEvidenceAuditRepairOrder = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  blockedCount: number;
  watchCount: number;
  taskTotal: number;
  firstTask: QuickBuyerEvidenceAuditRepairTask | null;
  tasks: QuickBuyerEvidenceAuditRepairTask[];
  markdown: string;
  exportHref: string;
  csv: string;
  csvHref: string;
  mailHref: string;
};

export type QuickBuyerEvidenceAuditReplacementSlot = {
  id: string;
  label: string;
  owner: string;
  currentHref: string;
  placeholder: string;
  closeCondition: string;
};

export type QuickBuyerEvidenceAuditReplacementWorkspace = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  slotTotal: number;
  slots: QuickBuyerEvidenceAuditReplacementSlot[];
  markdown: string;
  exportHref: string;
};

export type QuickBuyerEvidenceAuditReplacementCloseoutItem = {
  id: string;
  label: string;
  status: QuickBuyerRoomPreviewStatus;
  owner: string;
  currentHref: string;
  replacementHref: string;
  evidence: string;
  action: string;
  closeCondition: string;
};

export type QuickBuyerEvidenceAuditReplacementCloseout = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  checkedAt: string;
  readyCount: number;
  watchCount: number;
  blockedCount: number;
  missingCount: number;
  slotTotal: number;
  canReopen: boolean;
  firstOpenItem: QuickBuyerEvidenceAuditReplacementCloseoutItem | null;
  items: QuickBuyerEvidenceAuditReplacementCloseoutItem[];
  markdown: string;
  exportHref: string;
  csv: string;
  csvHref: string;
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

export type QuickBuyerEvidenceDecisionImpactPreview = {
  status: QuickBuyerRoomPreviewStatus;
  headline: string;
  summary: string;
  decisionLine: string;
  ownerLine: string;
  followUpLine: string;
  returnLine: string;
  nextAction: string;
};

export type QuickBuyerEvidenceResponseFollowUpLedgerInput = {
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
  ownerPacketHref?: string;
  ownerMailHref: string;
  ownerRunbook: QuickExternalReviewOwnerPacketRunbookItem[];
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

function stablePacketHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

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

function receiptVerifierPrefillHref(verificationRequestJson: string) {
  const params = new URLSearchParams({
    request: verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

export function quickBuyerEvidenceStatusLabel(status: QuickBuyerRoomPreviewStatus) {
  if (status === "ready") return "Ready";
  if (status === "watch") return "Needs repair";
  return "Blocked";
}

export function quickBuyerEvidenceShareText(value: unknown, maxLength = 1200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function quickBuyerEvidenceShareHref(value: unknown) {
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

function quickBuyerEvidenceBuyerQuestionFromUnknown(value: unknown): QuickBuyerEvidencePackBuyerQuestion | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const question = quickBuyerEvidenceShareText(source.question, 360);
  const answer = quickBuyerEvidenceShareText(source.answer, 700);
  if (!question || !answer) return null;

  return {
    id: quickBuyerEvidenceShareText(source.id, 80) || stablePacketHash(`${question}:${answer}`),
    label: quickBuyerEvidenceShareText(source.label, 160) || "Buyer question",
    status: quickBuyerEvidenceStatusFromUnknown(source.status),
    owner: quickBuyerEvidenceShareText(source.owner, 180) || "Evidence owner",
    question,
    answer,
    evidence: quickBuyerEvidenceShareText(source.evidence, 700),
    action: quickBuyerEvidenceShareText(source.action, 500),
    href: quickBuyerEvidenceShareHref(source.href)
  };
}

export function quickBuyerEvidencePackShareArtifactFrom(artifact: QuickBuyerEvidencePackArtifact): QuickBuyerEvidencePackShareArtifact {
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

function quickBuyerEvidenceFallbackBuyerQuestions(payload: Omit<QuickBuyerEvidencePackSharePayload, "buyerQuestions">): QuickBuyerEvidencePackBuyerQuestion[] {
  const requiredArtifacts = payload.artifacts.filter((artifact) => artifact.requiredForSend);
  const readyRequired = requiredArtifacts.filter((artifact) => artifact.status === "ready").length;
  const firstOpen = requiredArtifacts.find((artifact) => artifact.status !== "ready");
  const pilotArtifact = payload.artifacts.find((artifact) => artifact.id === "pilot-week");
  const sourceReady = Boolean(payload.sourceReceiptId && /^fnv1a32:[a-f0-9]{8}$/i.test(payload.sourceChecksum));
  const decisionReady = payload.status === "ready" && !firstOpen && sourceReady;

  return [
    {
      id: "trust",
      label: "Trust",
      status: sourceReady ? "ready" : "blocked",
      owner: "Reviewer",
      question: "Can I trust this evidence without a private walkthrough?",
      answer: sourceReady ? `Yes. The source receipt ${payload.sourceReceiptId} is attached with checksum ${payload.sourceChecksum}.` : "Not yet. The source receipt checksum is missing or malformed.",
      evidence: payload.sourceChecksum || "Source checksum is missing.",
      action: sourceReady ? "Keep the receipt verifier attached to the buyer meeting." : "Regenerate the evidence pack with a valid receipt verifier.",
      href: payload.verifierHref
    },
    {
      id: "value",
      label: "Value",
      status: pilotArtifact?.status ?? "watch",
      owner: pilotArtifact?.role ?? "Pilot owner",
      question: "What value am I being asked to approve?",
      answer: pilotArtifact?.proof || payload.workflow || "The value proof is not attached to this evidence pack.",
      evidence: pilotArtifact ? `${pilotArtifact.label}: ${pilotArtifact.proof}` : payload.workflow || "Workflow not included.",
      action: pilotArtifact?.status === "ready" ? "Use this as the value evidence in the buyer decision." : "Attach measured value proof before approval.",
      href: pilotArtifact?.href || payload.firstAction.href
    },
    {
      id: "risk",
      label: "Open risk",
      status: firstOpen?.status ?? "ready",
      owner: firstOpen?.role ?? "Launch owner",
      question: "What still blocks an external buyer send?",
      answer: firstOpen ? `${firstOpen.label} must be repaired first.` : "No required evidence blocker remains.",
      evidence: firstOpen?.proof || `${readyRequired}/${requiredArtifacts.length} required artifacts are ready.`,
      action: firstOpen ? payload.firstAction.label : "Keep the live proof window fresh and send with receipt verifier attached.",
      href: firstOpen?.href || payload.verifierHref
    },
    {
      id: "next",
      label: "Next decision",
      status: decisionReady ? "ready" : payload.status,
      owner: decisionReady ? "Buyer reviewer" : firstOpen?.role || "Evidence owner",
      question: "What should happen next?",
      answer: decisionReady ? "Record a buyer response and return the verified receipt to the owner workspace." : payload.sendRule,
      evidence: `${readyRequired}/${requiredArtifacts.length} required artifacts ready. ${payload.label}`,
      action: decisionReady ? "Record response" : payload.firstAction.label,
      href: decisionReady ? payload.verifierHref : payload.firstAction.href
    }
  ];
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
    const payloadWithoutQuestions: Omit<QuickBuyerEvidencePackSharePayload, "buyerQuestions"> = {
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
    const buyerQuestions = (Array.isArray(parsed.buyerQuestions) ? parsed.buyerQuestions : [])
      .map(quickBuyerEvidenceBuyerQuestionFromUnknown)
      .filter((question): question is QuickBuyerEvidencePackBuyerQuestion => Boolean(question));

    return {
      ...payloadWithoutQuestions,
      buyerQuestions: buyerQuestions.length > 0 ? buyerQuestions : quickBuyerEvidenceFallbackBuyerQuestions(payloadWithoutQuestions)
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

function quickBuyerEvidenceSourceReceiptReady(payload: QuickBuyerEvidencePackSharePayload) {
  return Boolean(payload.sourceReceiptId && /^fnv1a32:[a-f0-9]{8}$/i.test(payload.sourceChecksum));
}

function quickBuyerEvidenceAnswerBriefQuestions(payload: QuickBuyerEvidencePackSharePayload) {
  return payload.buyerQuestions?.length ? payload.buyerQuestions : quickBuyerEvidenceFallbackBuyerQuestions(payload);
}

function quickBuyerEvidenceAnswerBriefCsv(questions: QuickBuyerEvidencePackBuyerQuestion[]) {
  return [
    ["questionId", "label", "status", "owner", "question", "answer", "evidence", "action", "href"],
    ...questions.map((question) => [
      question.id,
      question.label,
      question.status,
      question.owner,
      question.question,
      question.answer,
      question.evidence,
      question.action,
      question.href
    ])
  ]
    .map((row) => row.map(quickBuyerEvidenceAuditCsvEscape).join(","))
    .join("\n");
}

function quickBuyerEvidenceAnswerBriefMarkdown(brief: Omit<QuickBuyerEvidenceAnswerBrief, "exportMarkdown" | "exportHref" | "csv" | "csvHref" | "mailHref">, payload: QuickBuyerEvidencePackSharePayload) {
  return [
    "# Buyer proof answer brief",
    "",
    `Buyer: ${payload.buyer || "Buyer"}`,
    `Workflow: ${payload.workflow || "Workflow not included"}`,
    `Status: ${brief.status}`,
    `Safe to cite: ${brief.readyCount}/${brief.totalCount}`,
    `Source receipt: ${payload.sourceReceiptId || "missing"} / ${payload.sourceChecksum || "checksum missing"}`,
    "",
    "## Summary",
    brief.headline,
    "",
    brief.summary,
    "",
    "## Buyer questions",
    ...brief.questions.map(
      (question) =>
        `- [${question.status}] ${question.question} Answer: ${question.answer} Owner: ${question.owner}. Evidence: ${question.evidence || "Evidence not attached."} Action: ${
          question.action || "No action recorded."
        }${question.href ? ` (${question.href})` : ""}`
    )
  ].join("\n");
}

export function buildQuickBuyerEvidenceAnswerBrief(payload: QuickBuyerEvidencePackSharePayload): QuickBuyerEvidenceAnswerBrief {
  const questions = quickBuyerEvidenceAnswerBriefQuestions(payload);
  const totalCount = questions.length;
  const readyCount = questions.filter((question) => question.status === "ready").length;
  const firstOpenQuestion = questions.find((question) => question.status === "blocked") ?? questions.find((question) => question.status === "watch") ?? null;
  const status: QuickBuyerRoomPreviewStatus =
    totalCount === 0 ? "blocked" : questions.some((question) => question.status === "blocked") ? "blocked" : questions.some((question) => question.status === "watch") ? "watch" : "ready";
  const headline =
    status === "ready"
      ? "Buyer answer brief is ready to send"
      : status === "watch"
        ? "Buyer answer brief needs proof repair before send"
        : "Buyer answer brief should stay internal";
  const summary =
    status === "ready"
      ? `${readyCount}/${totalCount} buyer questions are safe to cite with the receipt verifier attached.`
      : totalCount === 0
        ? "No buyer questions were attached to this evidence pack."
        : `${readyCount}/${totalCount} buyer questions are safe to cite. ${firstOpenQuestion?.owner ?? "Evidence owner"} owns: ${
            firstOpenQuestion?.action || payload.firstAction.label
          }`;
  const partial = {
    status,
    headline,
    summary,
    readyCount,
    totalCount,
    firstOpenQuestion,
    questions
  };
  const exportMarkdown = quickBuyerEvidenceAnswerBriefMarkdown(partial, payload);
  const csv = quickBuyerEvidenceAnswerBriefCsv(questions);
  const mailBody = [
    `${payload.buyer || "Buyer"} answer brief`,
    "",
    summary,
    "",
    exportMarkdown
  ].join("\n");

  return {
    ...partial,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    csv,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
    mailHref: `mailto:?subject=${encodeURIComponent(`Buyer answer brief: ${payload.buyer || "Buyer"}`)}&body=${encodeURIComponent(mailBody)}`
  };
}

function quickBuyerEvidenceDisclosureHrefIsShareable(href: string) {
  if (!href || href === "#" || /^data:/i.test(href)) return false;
  return href.startsWith("/") || /^https:\/\//i.test(href);
}

function quickBuyerEvidenceDisclosureBoundaryMarkdown(
  boundary: Omit<QuickBuyerEvidenceDisclosureBoundary, "exportMarkdown" | "exportHref" | "mailHref">,
  payload: QuickBuyerEvidencePackSharePayload
) {
  return [
    "# Evidence disclosure boundary",
    "",
    `Buyer: ${payload.buyer || "Buyer"}`,
    `Workflow: ${payload.workflow || "Workflow not included"}`,
    `Status: ${boundary.status}`,
    `Disclosure checks: ${boundary.readyCount}/${boundary.totalCount}`,
    `Source receipt: ${payload.sourceReceiptId || "missing"} / ${payload.sourceChecksum || "checksum missing"}`,
    "",
    "## Summary",
    boundary.headline,
    "",
    boundary.summary,
    "",
    "## Boundary checks",
    ...boundary.items.map(
      (item) =>
        `- [${item.status}] ${item.label} (${item.owner}): ${item.disclosure} Evidence: ${item.evidence} Action: ${item.action}${item.href ? ` (${item.href})` : ""}`
    )
  ].join("\n");
}

export function buildQuickBuyerEvidenceDisclosureBoundary(payload: QuickBuyerEvidencePackSharePayload): QuickBuyerEvidenceDisclosureBoundary {
  const requiredArtifacts = quickBuyerEvidenceRequiredArtifacts(payload);
  const sourceReady = quickBuyerEvidenceSourceReceiptReady(payload);
  const redactionArtifact = payload.artifacts.find((artifact) => artifact.id === "redaction") ?? null;
  const answerBrief = buildQuickBuyerEvidenceAnswerBrief(payload);
  const missingRequiredHref = requiredArtifacts.find((artifact) => !quickBuyerEvidenceDisclosureHrefIsShareable(artifact.href)) ?? null;
  const shareableRequiredCount = requiredArtifacts.filter((artifact) => quickBuyerEvidenceDisclosureHrefIsShareable(artifact.href)).length;
  const requiredArtifactStatus: QuickBuyerRoomPreviewStatus =
    requiredArtifacts.length === 0 ? "blocked" : missingRequiredHref ? (shareableRequiredCount > 0 ? "watch" : "blocked") : "ready";
  const claimStatus: QuickBuyerRoomPreviewStatus =
    answerBrief.totalCount === 0 ? "blocked" : answerBrief.readyCount === answerBrief.totalCount ? "ready" : answerBrief.readyCount > 0 ? "watch" : "blocked";
  const sendStatus: QuickBuyerRoomPreviewStatus = payload.status === "ready" ? "ready" : payload.status === "watch" ? "watch" : "blocked";
  const items: QuickBuyerEvidenceDisclosureBoundaryItem[] = [
    {
      id: "source-minimization",
      label: "Source data minimized",
      status: sourceReady ? "ready" : "blocked",
      owner: "Reviewer",
      disclosure: "The shared pack exposes a receipt id, checksum, artifact labels, and links instead of raw workspace notes.",
      evidence: sourceReady ? `${payload.sourceReceiptId} / ${payload.sourceChecksum}` : "Source receipt is missing or malformed.",
      action: sourceReady ? "Keep the receipt verifier attached to every external copy." : "Regenerate the pack with a valid source receipt.",
      href: payload.verifierHref
    },
    {
      id: "artifact-scope",
      label: "Artifact scope is shareable",
      status: requiredArtifactStatus,
      owner: missingRequiredHref?.role ?? "Launch owner",
      disclosure: `${shareableRequiredCount}/${requiredArtifacts.length} required artifact links are route-safe or https URLs for reviewer inspection.`,
      evidence: missingRequiredHref ? `${missingRequiredHref.label} has no shareable link.` : "All required artifacts include shareable routes or https links.",
      action: missingRequiredHref ? `Attach a shareable link for ${missingRequiredHref.label}.` : "Run live audit before buyer send.",
      href: missingRequiredHref?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "public-redaction",
      label: "Public-safe board exists",
      status: redactionArtifact?.status ?? "blocked",
      owner: redactionArtifact?.role ?? "Launch owner",
      disclosure: "The disclosed evidence should be the public-safe board, not unrestricted customer data or private notes.",
      evidence: redactionArtifact?.proof || "Public-safe evidence board is missing from this pack.",
      action: redactionArtifact?.status === "ready" ? "Keep the redacted board as the buyer-facing source." : "Finish the public-safe evidence board before broad sharing.",
      href: redactionArtifact?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "claim-citation",
      label: "Claims are citation-scoped",
      status: claimStatus,
      owner: answerBrief.firstOpenQuestion?.owner ?? "Evidence owner",
      disclosure: `${answerBrief.readyCount}/${answerBrief.totalCount} buyer answers are safe to cite; open answers stay as repair work.`,
      evidence: answerBrief.firstOpenQuestion ? `${answerBrief.firstOpenQuestion.question}: ${answerBrief.firstOpenQuestion.answer}` : "All buyer answers are citation-ready.",
      action: answerBrief.firstOpenQuestion?.action || "Cite answers with the verifier and evidence links attached.",
      href: answerBrief.firstOpenQuestion?.href || payload.verifierHref
    },
    {
      id: "send-boundary",
      label: "External send rule is explicit",
      status: sendStatus,
      owner: sendStatus === "ready" ? "Buyer reviewer" : "Evidence owner",
      disclosure: payload.sendRule || "No external send rule is attached.",
      evidence: payload.label || "Evidence pack status is not labeled.",
      action: sendStatus === "ready" ? "Share only with verifier, live audit, and boundary export attached." : payload.firstAction.label,
      href: sendStatus === "ready" ? payload.verifierHref : payload.firstAction.href
    }
  ];
  const readyCount = items.filter((item) => item.status === "ready").length;
  const status: QuickBuyerRoomPreviewStatus = items.some((item) => item.status === "blocked") ? "blocked" : items.some((item) => item.status === "watch") ? "watch" : "ready";
  const firstOpenItem = items.find((item) => item.status === "blocked") ?? items.find((item) => item.status === "watch") ?? null;
  const headline =
    status === "ready"
      ? "Disclosure boundary is safe for external review"
      : status === "watch"
        ? "Disclosure boundary needs one owner repair"
        : "Disclosure boundary keeps this pack internal";
  const summary =
    status === "ready"
      ? `${readyCount}/${items.length} disclosure checks pass. The pack can be shared with verifier, live audit, and boundary export attached.`
      : `${readyCount}/${items.length} disclosure checks pass. ${firstOpenItem?.owner ?? "Evidence owner"} owns: ${firstOpenItem?.action ?? payload.firstAction.label}`;
  const partial = {
    status,
    headline,
    summary,
    readyCount,
    totalCount: items.length,
    firstOpenItem,
    items
  };
  const exportMarkdown = quickBuyerEvidenceDisclosureBoundaryMarkdown(partial, payload);
  const mailBody = [
    `${payload.buyer || "Buyer"} disclosure boundary`,
    "",
    summary,
    "",
    exportMarkdown
  ].join("\n");

  return {
    ...partial,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    mailHref: `mailto:?subject=${encodeURIComponent(`Evidence disclosure boundary: ${payload.buyer || "Buyer"}`)}&body=${encodeURIComponent(mailBody)}`
  };
}

export function quickBuyerEvidenceRecommendedDecision(payload: QuickBuyerEvidencePackSharePayload): QuickExternalReviewDecision {
  const requiredArtifacts = quickBuyerEvidenceRequiredArtifacts(payload);
  if (payload.status === "ready" && requiredArtifacts.every((artifact) => artifact.status === "ready")) return "continue";
  if (payload.status === "blocked" || requiredArtifacts.every((artifact) => artifact.status !== "ready")) return "stop";
  return "revise";
}

export function quickBuyerEvidenceDecisionLabel(decision: QuickExternalReviewDecision) {
  if (decision === "continue") return "Accept evidence";
  if (decision === "revise") return "Request repairs";
  return "Hold buyer send";
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

export function quickBuyerEvidenceDefaultReviewerNote(payload: QuickBuyerEvidencePackSharePayload, decision: QuickExternalReviewDecision) {
  if (decision === "continue") return `Evidence accepted for ${payload.buyer || "the buyer"} with the verifier link attached.`;
  if (decision === "revise") return `Repair required evidence before sending: ${payload.firstAction.label}.`;
  return `Buyer send held because required evidence is not ready: ${payload.firstAction.label}.`;
}

export function buildQuickBuyerEvidenceDecisionCockpit(payload: QuickBuyerEvidencePackSharePayload): QuickBuyerEvidenceDecisionCockpit {
  const requiredArtifacts = quickBuyerEvidenceRequiredArtifacts(payload);
  const requiredReady = quickBuyerEvidenceReadyRequiredCount(payload);
  const requiredTotal = requiredArtifacts.length;
  const requiredWatch = requiredArtifacts.filter((artifact) => artifact.status === "watch").length;
  const requiredBlocked = requiredArtifacts.filter((artifact) => artifact.status === "blocked").length;
  const sourceReady = quickBuyerEvidenceSourceReceiptReady(payload);
  const recommendedDecision = quickBuyerEvidenceRecommendedDecision(payload);
  const requiredStatus: QuickBuyerRoomPreviewStatus = requiredReady === requiredTotal ? "ready" : requiredReady > 0 ? "watch" : "blocked";
  const status: QuickBuyerRoomPreviewStatus =
    recommendedDecision === "stop" || !sourceReady || payload.status === "blocked"
      ? "blocked"
      : recommendedDecision === "revise" || requiredStatus !== "ready" || payload.status === "watch"
        ? "watch"
        : "ready";
  const confidence = Math.round(((requiredReady + (sourceReady ? 1 : 0)) / Math.max(1, requiredTotal + 1)) * 100);
  const headline =
    status === "ready"
      ? "Evidence can be accepted with the verifier attached"
      : status === "watch"
        ? "Repair the open proof before buyer send"
        : "Hold buyer send until the evidence is defensible";
  const summary =
    status === "ready"
      ? `All ${requiredTotal} required artifacts and the source receipt are ready for a buyer decision.`
      : sourceReady
        ? `${requiredTotal - requiredReady} required artifact${requiredTotal - requiredReady === 1 ? "" : "s"} need attention before this pack is safe to send.`
        : "The evidence pack is missing a verifiable source receipt, so the buyer cannot rely on the artifacts yet.";
  const primaryAnswer =
    recommendedDecision === "continue"
      ? "Yes, if the receipt verifier stays attached to the buyer meeting."
      : recommendedDecision === "revise"
        ? `Not yet. ${payload.firstAction.label} first.`
        : "No. Keep this pack internal until the blocker is replaced and re-verified.";

  return {
    status,
    recommendedDecision,
    headline,
    summary,
    confidence,
    requiredReady,
    requiredTotal,
    primaryQuestion: "Can this evidence pack be used for buyer send?",
    primaryAnswer,
    nextAction: quickBuyerEvidenceDecisionNextAction(payload, recommendedDecision),
    metrics: [
      {
        id: "recommended-decision",
        label: "Recommended decision",
        status,
        value: quickBuyerEvidenceDecisionLabel(recommendedDecision),
        evidence: "Derived from packet status, required artifacts, and source receipt integrity."
      },
      {
        id: "required-artifacts",
        label: "Required artifacts",
        status: requiredStatus,
        value: `${requiredReady}/${requiredTotal} ready`,
        evidence: `${requiredBlocked} blocked and ${requiredWatch} watch required artifacts.`
      },
      {
        id: "source-receipt",
        label: "Source receipt",
        status: sourceReady ? "ready" : "blocked",
        value: payload.sourceReceiptId || "missing",
        evidence: payload.sourceChecksum || "Source checksum is missing.",
        href: payload.verifierHref
      },
      {
        id: "first-action",
        label: "First action",
        status: recommendedDecision === "continue" ? "ready" : status,
        value: payload.firstAction.label,
        evidence: payload.sendRule,
        href: payload.firstAction.href
      }
    ]
  };
}

function quickBuyerEvidenceFirstOpenRequiredArtifact(payload: QuickBuyerEvidencePackSharePayload) {
  const requiredArtifacts = quickBuyerEvidenceRequiredArtifacts(payload);
  return (
    requiredArtifacts.find((artifact) => artifact.id === "proof-repair" && artifact.status !== "ready") ??
    requiredArtifacts.find((artifact) => artifact.status !== "ready") ??
    null
  );
}

function quickBuyerEvidencePilotArtifact(payload: QuickBuyerEvidencePackSharePayload) {
  return payload.artifacts.find((artifact) => artifact.id === "pilot-week") ?? null;
}

function quickBuyerEvidenceDecisionMemoHeadline(decision: QuickExternalReviewDecision, buyer: string) {
  if (decision === "continue") return `${buyer} can move from proof review to a buyer decision`;
  if (decision === "revise") return `${buyer} has a clear repair order before the next send`;
  return `${buyer} send should stay held until proof is defensible`;
}

function quickBuyerEvidenceDecisionMemoSummary(input: {
  payload: QuickBuyerEvidencePackSharePayload;
  decision: QuickExternalReviewDecision;
  requiredReady: number;
  requiredTotal: number;
  sourceReady: boolean;
}) {
  const buyer = input.payload.buyer || "Buyer";
  if (input.decision === "continue") {
    return `${buyer} can inspect ${input.requiredReady}/${input.requiredTotal} required artifacts, the receipt verifier, and the owner handoff without needing the builder in the room.`;
  }
  if (input.decision === "revise") {
    return `${buyer} should not receive the pack yet, but the cockpit names the first repair and keeps the evidence trail exportable.`;
  }
  return input.sourceReady
    ? `${buyer} has a verifiable receipt, but the required artifacts do not yet support an external send.`
    : `${buyer} cannot rely on this pack until the source receipt and required evidence are repaired.`;
}

function quickBuyerEvidenceDecisionMemoMarkdown(memo: Omit<QuickBuyerEvidenceDecisionMemo, "exportMarkdown" | "exportHref">, payload: QuickBuyerEvidencePackSharePayload) {
  return [
    "# Buyer decision memo",
    "",
    `Buyer: ${payload.buyer || "Buyer"}`,
    `Workflow: ${payload.workflow || "Workflow not included"}`,
    `Recommended decision: ${quickBuyerEvidenceDecisionLabel(memo.recommendedDecision)}`,
    `Status: ${memo.status}`,
    `Source receipt: ${payload.sourceReceiptId || "missing"} / ${payload.sourceChecksum || "checksum missing"}`,
    "",
    "## Summary",
    memo.headline,
    "",
    memo.summary,
    "",
    "## Decision evidence",
    ...memo.items.map((item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.evidence}${item.href ? ` (${item.href})` : ""}`),
    "",
    "## Buyer questions",
    ...memo.questions.map((question) => `- [${question.status}] ${question.question} ${question.answer} Evidence: ${question.evidence}${question.href ? ` (${question.href})` : ""}`)
  ].join("\n");
}

export function buildQuickBuyerEvidenceDecisionMemo(payload: QuickBuyerEvidencePackSharePayload): QuickBuyerEvidenceDecisionMemo {
  const requiredArtifacts = quickBuyerEvidenceRequiredArtifacts(payload);
  const requiredReady = quickBuyerEvidenceReadyRequiredCount(payload);
  const requiredTotal = requiredArtifacts.length;
  const requiredBlocked = requiredArtifacts.filter((artifact) => artifact.status === "blocked").length;
  const requiredWatch = requiredArtifacts.filter((artifact) => artifact.status === "watch").length;
  const firstOpenArtifact = quickBuyerEvidenceFirstOpenRequiredArtifact(payload);
  const pilotArtifact = quickBuyerEvidencePilotArtifact(payload);
  const sourceReady = quickBuyerEvidenceSourceReceiptReady(payload);
  const recommendedDecision = quickBuyerEvidenceRecommendedDecision(payload);
  const cockpit = buildQuickBuyerEvidenceDecisionCockpit(payload);
  const buyer = payload.buyer || "Buyer";
  const readyLine = `${requiredReady}/${requiredTotal} required artifacts ready`;
  const openRiskLine = firstOpenArtifact
    ? `${firstOpenArtifact.label}: ${firstOpenArtifact.proof}`
    : "No required artifact blocker remains before buyer send.";
  const outcomeStatus: QuickBuyerRoomPreviewStatus = recommendedDecision === "continue" ? "ready" : recommendedDecision === "revise" ? "watch" : "blocked";
  const trustStatus: QuickBuyerRoomPreviewStatus = sourceReady && requiredReady > 0 ? (requiredReady === requiredTotal ? "ready" : "watch") : "blocked";
  const riskStatus: QuickBuyerRoomPreviewStatus = firstOpenArtifact?.status ?? "ready";
  const items: QuickBuyerEvidenceDecisionMemoItem[] = [
    {
      id: "buyer-outcome",
      label: "Buyer outcome",
      status: outcomeStatus,
      value: quickBuyerEvidenceDecisionLabel(recommendedDecision),
      evidence: cockpit.primaryAnswer,
      href: recommendedDecision === "continue" ? payload.verifierHref : payload.firstAction.href
    },
    {
      id: "trust-proof",
      label: "Trust proof",
      status: trustStatus,
      value: sourceReady ? payload.sourceReceiptId || "verified source receipt" : "source receipt missing",
      evidence: sourceReady ? `${payload.sourceChecksum} plus ${readyLine}.` : "A buyer cannot rely on the memo until the receipt checksum is present.",
      href: payload.verifierHref
    },
    {
      id: "open-risk",
      label: "Open risk",
      status: riskStatus,
      value: firstOpenArtifact ? firstOpenArtifact.label : "No required blocker",
      evidence: openRiskLine,
      href: firstOpenArtifact?.href || payload.verifierHref
    },
    {
      id: "next-owner-action",
      label: "Next owner action",
      status: recommendedDecision === "continue" ? "ready" : cockpit.status,
      value: cockpit.nextAction,
      evidence: payload.sendRule,
      href: payload.firstAction.href || payload.verifierHref
    }
  ];
  const questions: QuickBuyerEvidenceDecisionMemoQuestion[] = [
    {
      id: "trust",
      question: "Can I trust the evidence?",
      answer: sourceReady
        ? `Yes, the source receipt is present and ${readyLine}.`
        : "Not yet. The source receipt checksum is missing or malformed.",
      status: sourceReady ? "ready" : "blocked",
      evidence: payload.sourceChecksum || "Source checksum is missing.",
      href: payload.verifierHref
    },
    {
      id: "value",
      question: "What value is being claimed?",
      answer: pilotArtifact?.proof || payload.workflow || "The workflow value claim is not included in this pack.",
      status: pilotArtifact?.status ?? "watch",
      evidence: pilotArtifact ? `${pilotArtifact.label} / ${pilotArtifact.role}` : "No pilot-week artifact was included.",
      href: pilotArtifact?.href
    },
    {
      id: "risk",
      question: "What blocks external send?",
      answer: firstOpenArtifact
        ? `${firstOpenArtifact.label} must be repaired first.`
        : `${requiredBlocked} blocked and ${requiredWatch} watch required artifacts remain.`,
      status: firstOpenArtifact?.status ?? "ready",
      evidence: firstOpenArtifact?.proof || "All required artifacts are ready.",
      href: firstOpenArtifact?.href || payload.verifierHref
    },
    {
      id: "next",
      question: "What should happen next?",
      answer: cockpit.nextAction,
      status: recommendedDecision === "continue" ? "ready" : cockpit.status,
      evidence: payload.sendRule,
      href: payload.firstAction.href || payload.verifierHref
    }
  ];
  const partial = {
    status: cockpit.status,
    recommendedDecision,
    headline: quickBuyerEvidenceDecisionMemoHeadline(recommendedDecision, buyer),
    summary: quickBuyerEvidenceDecisionMemoSummary({ payload, decision: recommendedDecision, requiredReady, requiredTotal, sourceReady }),
    items,
    questions
  };
  const exportMarkdown = quickBuyerEvidenceDecisionMemoMarkdown(partial, payload);

  return {
    ...partial,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function quickBuyerEvidenceApprovalChecklistMarkdown(checklist: Omit<QuickBuyerEvidenceApprovalChecklist, "exportMarkdown" | "exportHref">, payload: QuickBuyerEvidencePackSharePayload) {
  return [
    "# Buyer approval checklist",
    "",
    `Buyer: ${payload.buyer || "Buyer"}`,
    `Workflow: ${payload.workflow || "Workflow not included"}`,
    `Status: ${checklist.status}`,
    `Approval conditions: ${checklist.readyCount}/${checklist.totalCount}`,
    `Decision gate: ${checklist.decisionGate}`,
    "",
    "## Conditions",
    ...checklist.items.map(
      (item) =>
        `- [${item.status}] ${item.label} (${item.owner}): ${item.question} Evidence: ${item.evidence} Approval: ${item.approvalCondition} Action: ${item.action} (${item.href})`
    )
  ].join("\n");
}

export function buildQuickBuyerEvidenceApprovalChecklist(payload: QuickBuyerEvidencePackSharePayload): QuickBuyerEvidenceApprovalChecklist {
  const requiredArtifacts = quickBuyerEvidenceRequiredArtifacts(payload);
  const requiredReady = quickBuyerEvidenceReadyRequiredCount(payload);
  const requiredTotal = requiredArtifacts.length;
  const sourceReady = quickBuyerEvidenceSourceReceiptReady(payload);
  const firstOpenArtifact = quickBuyerEvidenceFirstOpenRequiredArtifact(payload);
  const cockpit = buildQuickBuyerEvidenceDecisionCockpit(payload);
  const recommendedDecision = quickBuyerEvidenceRecommendedDecision(payload);
  const requiredStatus: QuickBuyerRoomPreviewStatus = requiredReady === requiredTotal ? "ready" : requiredReady > 0 ? "watch" : "blocked";
  const openRiskStatus: QuickBuyerRoomPreviewStatus = firstOpenArtifact?.status ?? "ready";
  const responsePathStatus: QuickBuyerRoomPreviewStatus =
    recommendedDecision === "continue"
      ? payload.status
      : sourceReady && requiredReady > 0
        ? "watch"
        : "blocked";
  const items: QuickBuyerEvidenceApprovalChecklistItem[] = [
    {
      id: "source-receipt",
      label: "Source receipt verifies",
      status: sourceReady ? "ready" : "blocked",
      owner: "Reviewer",
      question: "Can the source evidence be replayed from this shared page?",
      evidence: payload.sourceReceiptId ? `${payload.sourceReceiptId} / ${payload.sourceChecksum || "checksum missing"}` : "Source receipt is missing.",
      approvalCondition: sourceReady ? "Receipt verifier is attached and checksum-shaped." : "Approval cannot rely on this pack until the source receipt verifies.",
      action: sourceReady ? "Open the verifier before recording the response." : "Regenerate the evidence pack with a verifier-ready source receipt.",
      href: payload.verifierHref || "#"
    },
    {
      id: "required-artifacts",
      label: "Required artifacts are ready",
      status: requiredStatus,
      owner: "Launch owner",
      question: "Are all buyer-send artifacts present and public enough to inspect?",
      evidence: `${requiredReady}/${requiredTotal} required artifacts ready.`,
      approvalCondition:
        requiredStatus === "ready"
          ? "Decision case, send memo, proof ledger, public proof, evidence board, and receipt verifier are ready."
          : "Buyer-send approval stays held until every required artifact is ready.",
      action: requiredStatus === "ready" ? "Keep the artifact pack intact during the buyer review." : payload.firstAction.label,
      href: firstOpenArtifact?.href || payload.firstAction.href || payload.verifierHref || "#"
    },
    {
      id: "open-risk",
      label: "Open risk is named",
      status: openRiskStatus,
      owner: firstOpenArtifact?.role || "Decision owner",
      question: "If approval is held, is the first repair explicit?",
      evidence: firstOpenArtifact ? `${firstOpenArtifact.label}: ${firstOpenArtifact.proof}` : "No required artifact blocker remains.",
      approvalCondition: firstOpenArtifact ? "Record repair, not approval, until this blocker is closed." : "No required blocker remains before buyer send.",
      action: firstOpenArtifact ? `Repair ${firstOpenArtifact.label}` : "Proceed with receipt-backed approval review.",
      href: firstOpenArtifact?.href || payload.verifierHref || "#"
    },
    {
      id: "decision-readiness",
      label: "Decision can be defended",
      status: cockpit.status,
      owner: payload.buyer || "Buyer reviewer",
      question: cockpit.primaryQuestion,
      evidence: cockpit.primaryAnswer,
      approvalCondition:
        recommendedDecision === "continue"
          ? "Approval can be recorded only with the verifier attached."
          : "Record a repair or hold decision instead of buyer-send approval.",
      action: cockpit.nextAction,
      href: payload.firstAction.href || payload.verifierHref || "#"
    },
    {
      id: "response-path",
      label: "Response returns to owner",
      status: responsePathStatus,
      owner: recommendedDecision === "continue" ? "Launch owner" : recommendedDecision === "revise" ? "Proof owner" : "Decision owner",
      question: "Will the recorded response create an owner action instead of a dead-end note?",
      evidence: payload.sendRule,
      approvalCondition:
        responsePathStatus === "ready"
          ? "Response can become a verified buyer decision receipt."
          : "Response should route an owner repair before a buyer-send decision.",
      action: quickBuyerEvidenceDecisionNextAction(payload, recommendedDecision),
      href: payload.firstAction.href || payload.verifierHref || "#"
    }
  ];
  const readyCount = items.filter((item) => item.status === "ready").length;
  const status: QuickBuyerRoomPreviewStatus = items.some((item) => item.status === "blocked") ? "blocked" : items.some((item) => item.status === "watch") ? "watch" : "ready";
  const currentItem = items.find((item) => item.status === "blocked") ?? items.find((item) => item.status === "watch") ?? items[items.length - 1]!;
  const headline =
    status === "ready"
      ? "Buyer approval can be recorded with receipts attached"
      : status === "watch"
        ? "Approval needs repair evidence before buyer send"
        : "Buyer approval is blocked by evidence conditions";
  const summary =
    status === "ready"
      ? `${payload.buyer || "Buyer"} can record a response against ${readyCount}/${items.length} approval conditions.`
      : `${readyCount}/${items.length} approval conditions pass. ${currentItem.owner} owns: ${currentItem.action}`;
  const decisionGate =
    status === "ready"
      ? "Record approval only with the source verifier, required artifacts, and response receipt attached."
      : `Do not record buyer-send approval yet. First approval blocker: ${currentItem.label}. ${currentItem.owner}: ${currentItem.action}`;
  const partial = {
    status,
    headline,
    summary,
    decisionGate,
    readyCount,
    totalCount: items.length,
    currentItem,
    items
  };
  const exportMarkdown = quickBuyerEvidenceApprovalChecklistMarkdown(partial, payload);

  return {
    ...partial,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function quickBuyerEvidenceProcurementHandoffMarkdown(
  handoff: Omit<QuickBuyerEvidenceProcurementHandoff, "exportMarkdown" | "exportHref" | "mailHref">,
  payload: QuickBuyerEvidencePackSharePayload
) {
  return [
    "# Global procurement handoff",
    "",
    `Buyer: ${payload.buyer || "Buyer"}`,
    `Workflow: ${payload.workflow || "Workflow not included"}`,
    `Status: ${handoff.status}`,
    `Routes ready: ${handoff.readyCount}/${handoff.totalCount}`,
    `Source receipt: ${payload.sourceReceiptId || "missing"} / ${payload.sourceChecksum || "checksum missing"}`,
    "",
    "## Summary",
    handoff.headline,
    "",
    handoff.summary,
    "",
    "## Review routes",
    ...handoff.routes.map(
      (route) =>
        `- [${route.status}] ${route.label} (${route.owner}): ${route.reviewQuestion} Approval signal: ${route.approvalSignal} Evidence: ${route.evidence} Action: ${route.action}${
          route.href ? ` (${route.href})` : ""
        }`
    )
  ].join("\n");
}

export function buildQuickBuyerEvidenceProcurementHandoff(payload: QuickBuyerEvidencePackSharePayload): QuickBuyerEvidenceProcurementHandoff {
  const disclosureBoundary = buildQuickBuyerEvidenceDisclosureBoundary(payload);
  const answerBrief = buildQuickBuyerEvidenceAnswerBrief(payload);
  const approvalChecklist = buildQuickBuyerEvidenceApprovalChecklist(payload);
  const decisionMemo = buildQuickBuyerEvidenceDecisionMemo(payload);
  const sourceReady = quickBuyerEvidenceSourceReceiptReady(payload);
  const redactionCheck = disclosureBoundary.items.find((item) => item.id === "public-redaction");
  const sendBoundary = disclosureBoundary.items.find((item) => item.id === "send-boundary");
  const proofQuestion = answerBrief.questions.find((question) => question.id === "proof") ?? answerBrief.firstOpenQuestion;
  const valueQuestion = answerBrief.questions.find((question) => question.id === "value") ?? null;
  const sourceQuestion = answerBrief.questions.find((question) => question.id === "source-receipt") ?? null;
  const proofArtifact = payload.artifacts.find((artifact) => artifact.id === "proof-repair") ?? null;
  const pilotArtifact = quickBuyerEvidencePilotArtifact(payload);
  const financeStatus = valueQuestion?.status ?? pilotArtifact?.status ?? "watch";
  const legalStatus: QuickBuyerRoomPreviewStatus = sourceReady ? sendBoundary?.status ?? payload.status : "blocked";
  const technicalStatus = proofArtifact?.status ?? proofQuestion?.status ?? "blocked";
  const routes: QuickBuyerEvidenceProcurementHandoffRoute[] = [
    {
      id: "security",
      label: "Security review",
      status: redactionCheck?.status ?? "blocked",
      owner: redactionCheck?.owner ?? "Security owner",
      reviewQuestion: "Can security inspect this without private customer notes?",
      approvalSignal:
        redactionCheck?.status === "ready" ? "The public-safe board is the buyer-facing evidence source." : redactionCheck?.evidence ?? "Public-safe board evidence is missing.",
      evidence: redactionCheck?.evidence ?? "Public-safe evidence board is missing from this pack.",
      action: redactionCheck?.action ?? "Finish the public-safe evidence board before broad sharing.",
      href: redactionCheck?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "legal",
      label: "Legal and compliance",
      status: legalStatus,
      owner: sendBoundary?.owner ?? "Reviewer",
      reviewQuestion: "Can the send rule and source receipt be audited later?",
      approvalSignal: sourceReady ? "Source receipt, checksum, and send rule can travel with the packet." : "Source receipt must verify before legal review.",
      evidence: sourceReady
        ? `${payload.sourceReceiptId || "source receipt"} / ${payload.sourceChecksum || "checksum missing"} / ${payload.sendRule || "send rule missing"}`
        : "Source receipt is missing or malformed.",
      action: sourceReady ? sendBoundary?.action ?? "Attach the verifier to every external copy." : "Regenerate the evidence pack with a verifier-ready source receipt.",
      href: sourceReady ? sendBoundary?.href || payload.verifierHref : payload.firstAction.href || payload.verifierHref
    },
    {
      id: "finance",
      label: "Finance approval",
      status: financeStatus,
      owner: valueQuestion?.owner ?? pilotArtifact?.role ?? "Finance sponsor",
      reviewQuestion: "What value claim is being approved?",
      approvalSignal:
        financeStatus === "ready" ? valueQuestion?.answer ?? pilotArtifact?.proof ?? "Measured value proof is attached." : "Value proof needs citation before budget approval.",
      evidence: (valueQuestion?.evidence ?? pilotArtifact?.proof ?? payload.workflow) || "No value proof was attached.",
      action: valueQuestion?.action ?? (financeStatus === "ready" ? "Attach measured value proof to the approval thread." : "Attach measured value proof before finance approval."),
      href: valueQuestion?.href || pilotArtifact?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "technical",
      label: "Technical buyer",
      status: technicalStatus,
      owner: proofArtifact?.role ?? proofQuestion?.owner ?? "Proof owner",
      reviewQuestion: "Can live proof and packet links be rechecked without a private demo?",
      approvalSignal:
        technicalStatus === "ready" ? "Proof links are ready to inspect from the shared page." : proofQuestion?.answer ?? proofArtifact?.proof ?? "Live proof still needs repair.",
      evidence: proofArtifact?.proof ?? proofQuestion?.evidence ?? "Public proof links are not attached.",
      action: technicalStatus === "ready" ? "Run live audit and keep proof links attached." : proofQuestion?.action ?? payload.firstAction.label,
      href: proofArtifact?.href || proofQuestion?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "sponsor",
      label: "Executive sponsor",
      status: approvalChecklist.status,
      owner: approvalChecklist.currentItem.owner,
      reviewQuestion: "Can the sponsor record a decision without creating a dead-end note?",
      approvalSignal: approvalChecklist.decisionGate,
      evidence: decisionMemo.summary || sourceQuestion?.evidence || approvalChecklist.summary,
      action: approvalChecklist.status === "ready" ? "Record the response with verifier and receipt attached." : approvalChecklist.currentItem.action,
      href: approvalChecklist.currentItem.href || payload.firstAction.href || payload.verifierHref
    }
  ];
  const readyCount = routes.filter((route) => route.status === "ready").length;
  const status: QuickBuyerRoomPreviewStatus = routes.some((route) => route.status === "blocked") ? "blocked" : routes.some((route) => route.status === "watch") ? "watch" : "ready";
  const firstOpenRoute = routes.find((route) => route.status === "blocked") ?? routes.find((route) => route.status === "watch") ?? null;
  const headline =
    status === "ready"
      ? "Global procurement handoff is ready for buyer routing"
      : status === "watch"
        ? "Global procurement handoff needs one owner review"
        : "Global procurement handoff keeps buyer routing held";
  const summary =
    status === "ready"
      ? `${readyCount}/${routes.length} buyer-side review routes can inspect the evidence pack with verifier, boundary, and response path attached.`
      : `${readyCount}/${routes.length} buyer-side review routes are ready. ${firstOpenRoute?.owner ?? "Evidence owner"} owns: ${
          firstOpenRoute?.action ?? payload.firstAction.label
        }`;
  const partial = {
    status,
    headline,
    summary,
    readyCount,
    totalCount: routes.length,
    firstOpenRoute,
    routes
  };
  const exportMarkdown = quickBuyerEvidenceProcurementHandoffMarkdown(partial, payload);
  const mailBody = [
    `${payload.buyer || "Buyer"} procurement handoff`,
    "",
    summary,
    "",
    exportMarkdown
  ].join("\n");

  return {
    ...partial,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    mailHref: `mailto:?subject=${encodeURIComponent(`Global procurement handoff: ${payload.buyer || "Buyer"}`)}&body=${encodeURIComponent(mailBody)}`
  };
}

function quickBuyerEvidenceAdoptionRiskSeverity(status: QuickBuyerRoomPreviewStatus): QuickBuyerEvidenceAdoptionRiskSeverity {
  if (status === "ready") return "low";
  if (status === "watch") return "medium";
  return "high";
}

function quickBuyerEvidenceAdoptionRiskCsv(risks: QuickBuyerEvidenceAdoptionRisk[]) {
  return [
    ["riskId", "label", "status", "severity", "owner", "exposure", "mitigation", "proofRequired", "evidence", "href"],
    ...risks.map((risk) => [
      risk.id,
      risk.label,
      risk.status,
      risk.severity,
      risk.owner,
      risk.exposure,
      risk.mitigation,
      risk.proofRequired,
      risk.evidence,
      risk.href
    ])
  ]
    .map((row) => row.map(quickBuyerEvidenceAuditCsvEscape).join(","))
    .join("\n");
}

function quickBuyerEvidenceAdoptionRiskLedgerMarkdown(
  ledger: Omit<QuickBuyerEvidenceAdoptionRiskLedger, "csvHref" | "exportMarkdown" | "exportHref" | "mailHref">,
  payload: QuickBuyerEvidencePackSharePayload
) {
  return [
    "# Buyer adoption risk ledger",
    "",
    `Buyer: ${payload.buyer || "Buyer"}`,
    `Workflow: ${payload.workflow || "Workflow not included"}`,
    `Status: ${ledger.status}`,
    `Clearance score: ${ledger.clearanceScore}`,
    `Cleared risks: ${ledger.clearedCount}/${ledger.riskTotal}`,
    `High risks: ${ledger.highRiskCount}`,
    `Source receipt: ${payload.sourceReceiptId || "missing"} / ${payload.sourceChecksum || "checksum missing"}`,
    "",
    "## Summary",
    ledger.headline,
    "",
    ledger.summary,
    "",
    "## Risks",
    ...ledger.risks.map(
      (risk) =>
        `- [${risk.status}/${risk.severity}] ${risk.label} (${risk.owner}): ${risk.exposure} Mitigation: ${risk.mitigation} Proof required: ${risk.proofRequired} Evidence: ${
          risk.evidence
        }${risk.href ? ` (${risk.href})` : ""}`
    ),
    "",
    "## CSV",
    ledger.csv
  ].join("\n");
}

export function buildQuickBuyerEvidenceAdoptionRiskLedger(payload: QuickBuyerEvidencePackSharePayload): QuickBuyerEvidenceAdoptionRiskLedger {
  const sourceReady = quickBuyerEvidenceSourceReceiptReady(payload);
  const disclosureBoundary = buildQuickBuyerEvidenceDisclosureBoundary(payload);
  const procurementHandoff = buildQuickBuyerEvidenceProcurementHandoff(payload);
  const liveAuditPlan = buildQuickBuyerEvidenceLiveAuditPlan(payload);
  const approvalChecklist = buildQuickBuyerEvidenceApprovalChecklist(payload);
  const routeById = new Map(procurementHandoff.routes.map((route) => [route.id, route]));
  const financeRoute = routeById.get("finance");
  const responsePath = approvalChecklist.items.find((item) => item.id === "response-path");
  const risks: QuickBuyerEvidenceAdoptionRisk[] = [
    {
      id: "source-trust",
      label: "Source trust",
      status: sourceReady ? "ready" : "blocked",
      severity: quickBuyerEvidenceAdoptionRiskSeverity(sourceReady ? "ready" : "blocked"),
      owner: "Reviewer",
      exposure: sourceReady ? "The packet identity can be replayed from the receipt verifier." : "A buyer or auditor cannot replay the source packet identity.",
      mitigation: sourceReady ? "Keep the receipt verifier attached to every exported pack." : "Regenerate the pack with a verifier-ready source receipt and checksum.",
      proofRequired: "Receipt id, checksum, and verifier URL travel with the buyer room.",
      evidence: sourceReady ? `${payload.sourceReceiptId} / ${payload.sourceChecksum}` : "Source receipt is missing or malformed.",
      href: payload.verifierHref || payload.firstAction.href
    },
    {
      id: "disclosure-boundary",
      label: "Disclosure boundary",
      status: disclosureBoundary.status,
      severity: quickBuyerEvidenceAdoptionRiskSeverity(disclosureBoundary.status),
      owner: disclosureBoundary.firstOpenItem?.owner ?? "Security owner",
      exposure:
        disclosureBoundary.status === "ready"
          ? "Buyer-side security and legal reviewers can inspect the public-safe boundary."
          : "External forwarding could expose private notes or unsupported claims.",
      mitigation: disclosureBoundary.firstOpenItem?.action ?? "Attach the disclosure boundary to the buyer thread.",
      proofRequired: "Public-safe evidence board, scoped artifact links, and citation-ready claims.",
      evidence: disclosureBoundary.firstOpenItem?.evidence ?? disclosureBoundary.summary,
      href: disclosureBoundary.firstOpenItem?.href || disclosureBoundary.exportHref
    },
    {
      id: "proof-reachability",
      label: "Proof reachability",
      status: liveAuditPlan.status,
      severity: quickBuyerEvidenceAdoptionRiskSeverity(liveAuditPlan.status),
      owner: liveAuditPlan.firstTarget?.role ?? "Proof owner",
      exposure:
        liveAuditPlan.status === "ready"
          ? "The proof set is ready for a live reachability audit."
          : "Broken, private, or oversized proof links force a private demo instead of self-serve diligence.",
      mitigation: liveAuditPlan.firstTarget ? `Repair ${liveAuditPlan.firstTarget.label} and rerun the live audit.` : "Run the live proof audit before buyer send.",
      proofRequired: "Each required proof URL responds from the shared buyer room.",
      evidence: liveAuditPlan.firstTarget?.proof ?? liveAuditPlan.summary,
      href: liveAuditPlan.firstTarget?.href || liveAuditPlan.exportHref
    },
    {
      id: "value-proof",
      label: "Value proof",
      status: financeRoute?.status ?? "watch",
      severity: quickBuyerEvidenceAdoptionRiskSeverity(financeRoute?.status ?? "watch"),
      owner: financeRoute?.owner ?? "Finance sponsor",
      exposure:
        financeRoute?.status === "ready"
          ? "Finance can see the measured value claim before approval."
          : "Commercial approval may stall because value is described but not yet proven.",
      mitigation: financeRoute?.action ?? "Attach measured value proof before finance approval.",
      proofRequired: "A cited baseline or measured pilot outcome that finance can compare after launch.",
      evidence: financeRoute?.evidence ?? (payload.workflow || "Value proof is not attached."),
      href: financeRoute?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "decision-ownership",
      label: "Decision ownership",
      status: responsePath?.status ?? approvalChecklist.status,
      severity: quickBuyerEvidenceAdoptionRiskSeverity(responsePath?.status ?? approvalChecklist.status),
      owner: responsePath?.owner ?? approvalChecklist.currentItem.owner,
      exposure:
        (responsePath?.status ?? approvalChecklist.status) === "ready"
          ? "A buyer response can become an owner-visible receipt instead of a loose note."
          : "The decision can create a dead-end note if ownership and return path are not explicit.",
      mitigation: responsePath?.action ?? approvalChecklist.currentItem.action,
      proofRequired: "Response receipt, owner action, and return link are present before approval is recorded.",
      evidence: responsePath?.evidence ?? approvalChecklist.decisionGate,
      href: responsePath?.href || approvalChecklist.currentItem.href || payload.firstAction.href || payload.verifierHref
    }
  ];
  const clearedCount = risks.filter((risk) => risk.status === "ready").length;
  const watchCount = risks.filter((risk) => risk.status === "watch").length;
  const highRiskCount = risks.filter((risk) => risk.severity === "high").length;
  const status: QuickBuyerRoomPreviewStatus = risks.some((risk) => risk.status === "blocked") ? "blocked" : risks.some((risk) => risk.status === "watch") ? "watch" : "ready";
  const firstOpenRisk = risks.find((risk) => risk.status === "blocked") ?? risks.find((risk) => risk.status === "watch") ?? null;
  const clearanceScore = Math.round(((clearedCount * 100 + watchCount * 45) / Math.max(1, risks.length)));
  const headline =
    status === "ready"
      ? "Buyer adoption risk is cleared for external review"
      : status === "watch"
        ? "Buyer adoption risk needs one owner review"
        : "Buyer adoption risk keeps this pack from global send";
  const summary =
    status === "ready"
      ? `${clearedCount}/${risks.length} adoption risks are cleared. Keep the ledger attached to buyer approval and value follow-up.`
      : `${clearedCount}/${risks.length} adoption risks are cleared; ${highRiskCount} remain high. ${firstOpenRisk?.owner ?? "Evidence owner"} owns: ${
          firstOpenRisk?.mitigation ?? payload.firstAction.label
        }`;
  const partial = {
    status,
    headline,
    summary,
    clearanceScore,
    clearedCount,
    riskTotal: risks.length,
    highRiskCount,
    firstOpenRisk,
    risks
  };
  const csv = quickBuyerEvidenceAdoptionRiskCsv(risks);
  const exportMarkdown = quickBuyerEvidenceAdoptionRiskLedgerMarkdown({ ...partial, csv }, payload);
  const mailBody = [
    `${payload.buyer || "Buyer"} adoption risk ledger`,
    "",
    summary,
    "",
    exportMarkdown
  ].join("\n");

  return {
    ...partial,
    csv,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    mailHref: `mailto:?subject=${encodeURIComponent(`Buyer adoption risk ledger: ${payload.buyer || "Buyer"}`)}&body=${encodeURIComponent(mailBody)}`
  };
}

function quickBuyerEvidenceDecisionMeetingAgendaMarkdown(
  agenda: Omit<QuickBuyerEvidenceDecisionMeetingAgenda, "exportMarkdown" | "exportHref" | "mailHref">,
  payload: QuickBuyerEvidencePackSharePayload
) {
  return [
    "# Buyer decision meeting agenda",
    "",
    `Buyer: ${payload.buyer || "Buyer"}`,
    `Workflow: ${payload.workflow || "Workflow not included"}`,
    `Status: ${agenda.status}`,
    `Duration: ${agenda.totalDurationMinutes} minutes`,
    `Ready items: ${agenda.readyCount}/${agenda.totalCount}`,
    `Source receipt: ${payload.sourceReceiptId || "missing"} / ${payload.sourceChecksum || "checksum missing"}`,
    "",
    "## Summary",
    agenda.headline,
    "",
    agenda.summary,
    "",
    "## Agenda",
    ...agenda.items.map(
      (item) =>
        `- [${item.status}] ${item.durationMinutes} min / ${item.owner} / ${item.label}: ${item.objective} Decision prompt: ${item.decisionPrompt} Evidence: ${
          item.evidence
        } Action: ${item.action}${item.href ? ` (${item.href})` : ""}`
    )
  ].join("\n");
}

export function buildQuickBuyerEvidenceDecisionMeetingAgenda(payload: QuickBuyerEvidencePackSharePayload): QuickBuyerEvidenceDecisionMeetingAgenda {
  const procurementHandoff = buildQuickBuyerEvidenceProcurementHandoff(payload);
  const approvalChecklist = buildQuickBuyerEvidenceApprovalChecklist(payload);
  const decisionMemo = buildQuickBuyerEvidenceDecisionMemo(payload);
  const cockpit = buildQuickBuyerEvidenceDecisionCockpit(payload);
  const sourceReady = quickBuyerEvidenceSourceReceiptReady(payload);
  const routeById = new Map(procurementHandoff.routes.map((route) => [route.id, route]));
  const securityRoute = routeById.get("security");
  const legalRoute = routeById.get("legal");
  const financeRoute = routeById.get("finance");
  const technicalRoute = routeById.get("technical");
  const sponsorRoute = routeById.get("sponsor");
  const disclosureStatus: QuickBuyerRoomPreviewStatus =
    securityRoute?.status === "blocked" || legalRoute?.status === "blocked"
      ? "blocked"
      : securityRoute?.status === "watch" || legalRoute?.status === "watch"
        ? "watch"
        : "ready";
  const items: QuickBuyerEvidenceDecisionMeetingAgendaItem[] = [
    {
      id: "evidence-context",
      label: "Evidence context",
      status: sourceReady ? "ready" : "blocked",
      durationMinutes: 4,
      owner: "Reviewer",
      objective: "Confirm the buyer, workflow, receipt, checksum, and send rule before debate starts.",
      evidence: sourceReady ? `${payload.sourceReceiptId || "source receipt"} / ${payload.sourceChecksum || "checksum missing"}` : "Source receipt is missing or malformed.",
      decisionPrompt: sourceReady ? "Does everyone agree this is the packet under review?" : "Should this meeting stop until the source receipt verifies?",
      action: sourceReady ? "Keep the verifier open during the meeting." : "Regenerate the evidence pack with a verifier-ready source receipt.",
      href: payload.verifierHref || payload.firstAction.href
    },
    {
      id: "disclosure-review",
      label: "Disclosure review",
      status: disclosureStatus,
      durationMinutes: 6,
      owner: securityRoute?.status !== "ready" ? securityRoute?.owner ?? "Security owner" : legalRoute?.owner ?? "Legal reviewer",
      objective: "Decide whether the packet can be discussed with buyer-side security and legal stakeholders.",
      evidence: `${securityRoute?.evidence ?? "Security evidence missing"} ${legalRoute?.evidence ?? "Legal evidence missing"}`,
      decisionPrompt:
        disclosureStatus === "ready" ? "Can the packet leave the builder workspace under the stated send rule?" : "Which disclosure item must be repaired before forwarding?",
      action: disclosureStatus === "ready" ? "Attach the disclosure boundary to the meeting notes." : securityRoute?.action ?? legalRoute?.action ?? payload.firstAction.label,
      href: disclosureStatus === "ready" ? legalRoute?.href || securityRoute?.href || payload.verifierHref : securityRoute?.href || legalRoute?.href || payload.firstAction.href
    },
    {
      id: "value-case",
      label: "Value case",
      status: financeRoute?.status ?? "watch",
      durationMinutes: 6,
      owner: financeRoute?.owner ?? "Finance sponsor",
      objective: "Decide whether the claimed value is strong enough for budget approval or pilot expansion.",
      evidence: financeRoute?.evidence ?? decisionMemo.questions.find((question) => question.id === "value")?.evidence ?? "Value proof is not attached.",
      decisionPrompt: financeRoute?.status === "ready" ? "Is the value claim acceptable for commercial approval?" : "What measured value proof is missing?",
      action: financeRoute?.action ?? "Attach measured value proof before finance approval.",
      href: financeRoute?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "technical-proof",
      label: "Technical proof",
      status: technicalRoute?.status ?? "blocked",
      durationMinutes: 8,
      owner: technicalRoute?.owner ?? "Proof owner",
      objective: "Confirm the proof links and live audit can be rechecked without a private demo.",
      evidence: technicalRoute?.evidence ?? "Public proof links are not attached.",
      decisionPrompt: technicalRoute?.status === "ready" ? "Can the technical buyer trust this evidence without a walkthrough?" : "Which proof link blocks external review?",
      action: technicalRoute?.action ?? payload.firstAction.label,
      href: technicalRoute?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "decision-close",
      label: "Decision close",
      status: approvalChecklist.status,
      durationMinutes: 6,
      owner: sponsorRoute?.owner ?? approvalChecklist.currentItem.owner,
      objective: "Record accept, repair, or hold with the owner path attached.",
      evidence: approvalChecklist.decisionGate,
      decisionPrompt: cockpit.primaryQuestion,
      action: approvalChecklist.status === "ready" ? "Record the response with verifier and receipt attached." : approvalChecklist.currentItem.action,
      href: sponsorRoute?.href || approvalChecklist.currentItem.href || payload.firstAction.href || payload.verifierHref
    }
  ];
  const readyCount = items.filter((item) => item.status === "ready").length;
  const status: QuickBuyerRoomPreviewStatus = items.some((item) => item.status === "blocked") ? "blocked" : items.some((item) => item.status === "watch") ? "watch" : "ready";
  const currentItem = items.find((item) => item.status === "blocked") ?? items.find((item) => item.status === "watch") ?? items[items.length - 1];
  const totalDurationMinutes = items.reduce((total, item) => total + item.durationMinutes, 0);
  const headline =
    status === "ready"
      ? "Buyer decision meeting can close with a receipt"
      : status === "watch"
        ? "Buyer decision meeting should focus on one owner review"
        : "Buyer decision meeting should stay in repair mode";
  const summary =
    status === "ready"
      ? `${totalDurationMinutes} minutes covers context, disclosure, value, proof, and decision close with ${readyCount}/${items.length} agenda items ready.`
      : `${readyCount}/${items.length} agenda items are ready. ${currentItem.owner} owns the first meeting blocker: ${currentItem.action}`;
  const partial = {
    status,
    headline,
    summary,
    readyCount,
    totalCount: items.length,
    totalDurationMinutes,
    currentItem,
    items
  };
  const exportMarkdown = quickBuyerEvidenceDecisionMeetingAgendaMarkdown(partial, payload);
  const mailBody = [
    `${payload.buyer || "Buyer"} decision meeting agenda`,
    "",
    summary,
    "",
    exportMarkdown
  ].join("\n");

  return {
    ...partial,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    mailHref: `mailto:?subject=${encodeURIComponent(`Buyer decision meeting agenda: ${payload.buyer || "Buyer"}`)}&body=${encodeURIComponent(mailBody)}`
  };
}

function quickBuyerEvidenceCommitteeMinutesMarkdown(minutes: Omit<QuickBuyerEvidenceCommitteeMinutes, "exportMarkdown" | "exportHref" | "mailHref">, payload: QuickBuyerEvidencePackSharePayload) {
  return [
    "# Buyer committee minutes",
    "",
    `Buyer: ${payload.buyer || "Buyer"}`,
    `Workflow: ${payload.workflow || "Workflow not included"}`,
    `Status: ${minutes.status}`,
    `Recommended decision: ${quickBuyerEvidenceDecisionLabel(minutes.decision)}`,
    `Ready decisions: ${minutes.readyCount}/${minutes.totalCount}`,
    `Source receipt: ${payload.sourceReceiptId || "missing"} / ${payload.sourceChecksum || "checksum missing"}`,
    "",
    "## Summary",
    minutes.headline,
    "",
    minutes.summary,
    "",
    "## Attendees and owners",
    ...minutes.attendees.map((attendee) => `- [${attendee.status}] ${attendee.label} / ${attendee.owner}: ${attendee.responsibility}`),
    "",
    "## Decisions",
    ...minutes.decisions.map(
      (decision) =>
        `- [${decision.status}] ${decision.label}: ${decision.value}. Evidence: ${decision.evidence} Action: ${decision.action}${decision.href ? ` (${decision.href})` : ""}`
    )
  ].join("\n");
}

export function buildQuickBuyerEvidenceCommitteeMinutes(payload: QuickBuyerEvidencePackSharePayload): QuickBuyerEvidenceCommitteeMinutes {
  const procurementHandoff = buildQuickBuyerEvidenceProcurementHandoff(payload);
  const meetingAgenda = buildQuickBuyerEvidenceDecisionMeetingAgenda(payload);
  const approvalChecklist = buildQuickBuyerEvidenceApprovalChecklist(payload);
  const cockpit = buildQuickBuyerEvidenceDecisionCockpit(payload);
  const decision = quickBuyerEvidenceRecommendedDecision(payload);
  const sourceReady = quickBuyerEvidenceSourceReceiptReady(payload);
  const postureStatus: QuickBuyerRoomPreviewStatus = decision === "continue" ? "ready" : decision === "revise" ? "watch" : "blocked";
  const attendees: QuickBuyerEvidenceCommitteeMinutesAttendee[] = [
    {
      id: "reviewer",
      label: "Packet reviewer",
      owner: "Reviewer",
      status: sourceReady ? "ready" : "blocked",
      responsibility: "Owns receipt verifier, packet identity, and meeting record."
    },
    ...procurementHandoff.routes.map((route): QuickBuyerEvidenceCommitteeMinutesAttendee => ({
      id: route.id,
      label: route.label,
      owner: route.owner,
      status: route.status,
      responsibility: route.reviewQuestion
    }))
  ];
  const decisions: QuickBuyerEvidenceCommitteeMinutesDecision[] = [
    {
      id: "packet",
      label: "Packet under review",
      status: sourceReady ? "ready" : "blocked",
      value: payload.sourceReceiptId || "Source receipt missing",
      evidence: sourceReady ? payload.sourceChecksum || "Checksum attached" : "Source receipt is missing or malformed.",
      action: sourceReady ? "Attach the verifier to the minutes." : "Regenerate the evidence pack with a verifier-ready source receipt.",
      href: payload.verifierHref || payload.firstAction.href
    },
    {
      id: "committee-posture",
      label: "Committee posture",
      status: postureStatus,
      value: quickBuyerEvidenceDecisionLabel(decision),
      evidence: cockpit.primaryAnswer,
      action: cockpit.nextAction,
      href: decision === "continue" ? payload.verifierHref : payload.firstAction.href || payload.verifierHref
    },
    {
      id: "approval-conditions",
      label: "Approval conditions",
      status: approvalChecklist.status,
      value: `${approvalChecklist.readyCount}/${approvalChecklist.totalCount} conditions pass`,
      evidence: approvalChecklist.decisionGate,
      action: approvalChecklist.currentItem.action,
      href: approvalChecklist.currentItem.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "first-open-owner",
      label: "First open owner",
      status: meetingAgenda.currentItem.status,
      value: meetingAgenda.currentItem.owner,
      evidence: meetingAgenda.currentItem.evidence,
      action: meetingAgenda.currentItem.action,
      href: meetingAgenda.currentItem.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "response-record",
      label: "Response record",
      status: approvalChecklist.status,
      value: approvalChecklist.status === "ready" ? "Record acceptance receipt" : "Record repair minutes",
      evidence: payload.sendRule || "No send rule is attached.",
      action: approvalChecklist.status === "ready" ? "Record the response with verifier and receipt attached." : "Send minutes as repair context before recording approval.",
      href: "#buyer-response-receipt"
    }
  ];
  const readyCount = decisions.filter((item) => item.status === "ready").length;
  const status: QuickBuyerRoomPreviewStatus = decisions.some((item) => item.status === "blocked") ? "blocked" : decisions.some((item) => item.status === "watch") ? "watch" : "ready";
  const currentDecision = decisions.find((item) => item.status === "blocked") ?? decisions.find((item) => item.status === "watch") ?? decisions[decisions.length - 1]!;
  const headline =
    status === "ready"
      ? "Committee minutes can be sent with the decision receipt"
      : status === "watch"
        ? "Committee minutes name the owner review"
        : "Committee minutes should record repair, not approval";
  const summary =
    status === "ready"
      ? `${readyCount}/${decisions.length} committee decisions are ready to circulate with the verifier and response receipt.`
      : `${readyCount}/${decisions.length} committee decisions are ready. ${currentDecision.value} owns the next record: ${currentDecision.action}`;
  const partial = {
    status,
    headline,
    summary,
    decision,
    readyCount,
    totalCount: decisions.length,
    currentDecision,
    attendees,
    decisions
  };
  const exportMarkdown = quickBuyerEvidenceCommitteeMinutesMarkdown(partial, payload);
  const mailBody = [
    `${payload.buyer || "Buyer"} committee minutes`,
    "",
    summary,
    "",
    exportMarkdown
  ].join("\n");

  return {
    ...partial,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    mailHref: `mailto:?subject=${encodeURIComponent(`Buyer committee minutes: ${payload.buyer || "Buyer"}`)}&body=${encodeURIComponent(mailBody)}`
  };
}

function quickBuyerEvidenceActivationPlanMarkdown(plan: Omit<QuickBuyerEvidenceActivationPlan, "exportMarkdown" | "exportHref" | "mailHref">, payload: QuickBuyerEvidencePackSharePayload) {
  return [
    "# Buyer activation plan",
    "",
    `Buyer: ${payload.buyer || "Buyer"}`,
    `Workflow: ${payload.workflow || "Workflow not included"}`,
    `Status: ${plan.status}`,
    `Start date: ${plan.startDate}`,
    `End date: ${plan.endDate}`,
    `Ready steps: ${plan.readyCount}/${plan.totalCount}`,
    `Source receipt: ${payload.sourceReceiptId || "missing"} / ${payload.sourceChecksum || "checksum missing"}`,
    "",
    "## Summary",
    plan.headline,
    "",
    plan.summary,
    "",
    "## Activation steps",
    ...plan.steps.map(
      (step) =>
        `- [${step.status}] Day ${step.dayOffset} / ${step.owner} / ${step.label}: ${step.objective} Close: ${step.closeCondition} Evidence: ${step.evidence} Action: ${
          step.action
        }${step.href ? ` (${step.href})` : ""}`
    ),
    "",
    "## Calendar",
    `Calendar export: ${payload.sourceReceiptId || "buyer-evidence"}-activation.ics`
  ].join("\n");
}

function quickBuyerEvidenceActivationPlanCalendar(input: {
  payload: QuickBuyerEvidencePackSharePayload;
  plan: Omit<QuickBuyerEvidenceActivationPlan, "calendarText" | "calendarHref" | "exportMarkdown" | "exportHref" | "mailHref">;
}) {
  const start = parseIsoDateOnly(input.plan.startDate);
  if (!start) return { calendarText: "", calendarHref: "" };
  const checksum = stablePacketHash(
    [
      input.payload.sourceReceiptId,
      input.payload.sourceChecksum,
      input.plan.status,
      ...input.plan.steps.map((step) => `${step.id}:${step.status}:${step.dayOffset}:${step.owner}:${step.action}:${step.closeCondition}`)
    ].join("\n")
  );
  const calendarLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//Buyer Activation Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...input.plan.steps.flatMap((step) => {
      const eventStart = addUtcDays(start, step.dayOffset);
      const eventEnd = addUtcDays(eventStart, 1);
      return [
        "BEGIN:VEVENT",
        `UID:${step.id}-${compactIcsDate(eventStart)}-${checksum}@a2a-agent-marketplace`,
        `DTSTAMP:${compactIcsDate(start)}T000000Z`,
        `DTSTART;VALUE=DATE:${compactIcsDate(eventStart)}`,
        `DTEND;VALUE=DATE:${compactIcsDate(eventEnd)}`,
        `SUMMARY:${escapeIcsText(`Day ${step.dayOffset} ${step.label} - ${step.owner}`)}`,
        `DESCRIPTION:${escapeIcsText(`Status: ${step.status}\nObjective: ${step.objective}\nClose: ${step.closeCondition}\nEvidence: ${step.evidence}\nAction: ${step.action}`)}`,
        `X-A2A-HREF:${escapeIcsText(step.href)}`,
        "END:VEVENT"
      ];
    }),
    "END:VCALENDAR"
  ];
  const calendarText = calendarLines.map(foldIcsLine).join("\r\n");
  return {
    calendarText,
    calendarHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(calendarText)}`
  };
}

export function buildQuickBuyerEvidenceActivationPlan(payload: QuickBuyerEvidencePackSharePayload): QuickBuyerEvidenceActivationPlan {
  const committeeMinutes = buildQuickBuyerEvidenceCommitteeMinutes(payload);
  const procurementHandoff = buildQuickBuyerEvidenceProcurementHandoff(payload);
  const approvalChecklist = buildQuickBuyerEvidenceApprovalChecklist(payload);
  const decision = quickBuyerEvidenceRecommendedDecision(payload);
  const routeById = new Map(procurementHandoff.routes.map((route) => [route.id, route]));
  const technicalRoute = routeById.get("technical");
  const financeRoute = routeById.get("finance");
  const startDate = "2026-07-01";
  const proofRecheckStatus: QuickBuyerRoomPreviewStatus =
    decision === "continue" && technicalRoute?.status === "ready" ? "ready" : technicalRoute?.status === "blocked" ? "blocked" : "watch";
  const valueBaselineStatus: QuickBuyerRoomPreviewStatus =
    decision === "continue" && financeRoute?.status === "ready" ? "ready" : financeRoute?.status === "blocked" ? "blocked" : "watch";
  const launchStatus: QuickBuyerRoomPreviewStatus = decision === "continue" && approvalChecklist.status === "ready" ? "ready" : approvalChecklist.status;
  const steps: QuickBuyerEvidenceActivationPlanStep[] = [
    {
      id: "approval-gate",
      label: "Close approval gate",
      status: committeeMinutes.status,
      dayOffset: 0,
      owner: committeeMinutes.status === "ready" ? "Launch owner" : committeeMinutes.currentDecision.value,
      objective: "Confirm whether the committee record supports activation or only repair work.",
      evidence: committeeMinutes.currentDecision.evidence,
      closeCondition:
        committeeMinutes.status === "ready"
          ? "Committee minutes, verifier, and response receipt are attached to the activation thread."
          : "Open committee decision is repaired and minutes are regenerated before activation starts.",
      action: committeeMinutes.status === "ready" ? "Attach committee minutes and record the buyer response." : committeeMinutes.currentDecision.action,
      href: committeeMinutes.currentDecision.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "kickoff-owner",
      label: "Assign launch owner",
      status: launchStatus,
      dayOffset: 1,
      owner: "Launch owner",
      objective: "Name the owner who will move the accepted evidence into buyer onboarding.",
      evidence: approvalChecklist.decisionGate,
      closeCondition:
        launchStatus === "ready"
          ? "Launch owner has the verifier, committee minutes, and activation calendar in the buyer thread."
          : "Approval checklist is repaired before assigning launch ownership.",
      action: launchStatus === "ready" ? "Open the activation thread with the verifier attached." : approvalChecklist.currentItem.action,
      href: approvalChecklist.currentItem.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "proof-recheck",
      label: "Recheck proof links",
      status: proofRecheckStatus,
      dayOffset: 2,
      owner: technicalRoute?.owner ?? "Proof owner",
      objective: "Re-run the proof review before the first buyer operating checkpoint.",
      evidence: technicalRoute?.evidence ?? "Public proof links are not attached.",
      closeCondition:
        proofRecheckStatus === "ready"
          ? "Technical buyer can reopen every public proof link from the shared page."
          : "Proof owner repairs the first broken proof link and reruns the live audit.",
      action: proofRecheckStatus === "ready" ? "Run live audit and attach the result to the activation thread." : technicalRoute?.action ?? payload.firstAction.label,
      href: technicalRoute?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "value-baseline",
      label: "Capture value baseline",
      status: valueBaselineStatus,
      dayOffset: 4,
      owner: financeRoute?.owner ?? "Finance sponsor",
      objective: "Record the baseline value claim that finance can compare after the first operating window.",
      evidence: (financeRoute?.evidence ?? payload.workflow) || "Value proof is not attached.",
      closeCondition:
        valueBaselineStatus === "ready"
          ? "Finance sponsor has baseline value evidence and the next comparison window."
          : "Measured value proof is attached before activation is treated as commercially accepted.",
      action: valueBaselineStatus === "ready" ? "Attach the value baseline to the activation thread." : financeRoute?.action ?? "Attach measured value proof before finance approval.",
      href: financeRoute?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "stop-rule",
      label: "Confirm stop rule",
      status: payload.sendRule ? (committeeMinutes.status === "ready" ? "ready" : "watch") : "blocked",
      dayOffset: 7,
      owner: "Decision owner",
      objective: "Define when the buyer should stop, repair, or expand after activation starts.",
      evidence: payload.sendRule || "No send rule is attached.",
      closeCondition:
        payload.sendRule && committeeMinutes.status === "ready"
          ? "Stop rule is written into the buyer activation thread with the verifier attached."
          : "Stop rule is rewritten after the open committee repair is closed.",
      action:
        payload.sendRule && committeeMinutes.status === "ready"
          ? "Schedule the Day 7 stop, repair, or expand checkpoint."
          : "Use committee minutes to keep activation held until repair conditions are closed.",
      href: "#buyer-response-receipt"
    }
  ];
  const readyCount = steps.filter((step) => step.status === "ready").length;
  const status: QuickBuyerRoomPreviewStatus = steps.some((step) => step.status === "blocked") ? "blocked" : steps.some((step) => step.status === "watch") ? "watch" : "ready";
  const currentStep = steps.find((step) => step.status === "blocked") ?? steps.find((step) => step.status === "watch") ?? steps[steps.length - 1]!;
  const endDate = addUtcDays(parseIsoDateOnly(startDate)!, Math.max(...steps.map((step) => step.dayOffset))).toISOString().slice(0, 10);
  const headline =
    status === "ready"
      ? "Buyer activation plan is ready for the first week"
      : status === "watch"
        ? "Buyer activation plan starts with owner review"
        : "Buyer activation plan starts with repair closeout";
  const summary =
    status === "ready"
      ? `${readyCount}/${steps.length} activation steps are ready from ${startDate} to ${endDate}; calendar and verifier can travel with the buyer thread.`
      : `${readyCount}/${steps.length} activation steps are ready. ${currentStep.owner} owns the first activation blocker: ${currentStep.action}`;
  const partial = {
    status,
    headline,
    summary,
    readyCount,
    totalCount: steps.length,
    startDate,
    endDate,
    currentStep,
    steps
  };
  const calendar = quickBuyerEvidenceActivationPlanCalendar({ payload, plan: partial });
  const exportMarkdown = quickBuyerEvidenceActivationPlanMarkdown({ ...partial, calendarText: calendar.calendarText, calendarHref: calendar.calendarHref }, payload);
  const mailBody = [
    `${payload.buyer || "Buyer"} activation plan`,
    "",
    summary,
    "",
    exportMarkdown
  ].join("\n");

  return {
    ...partial,
    calendarText: calendar.calendarText,
    calendarHref: calendar.calendarHref,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    mailHref: `mailto:?subject=${encodeURIComponent(`Buyer activation plan: ${payload.buyer || "Buyer"}`)}&body=${encodeURIComponent(mailBody)}`
  };
}

function quickBuyerEvidenceValueCheckpointCsv(items: QuickBuyerEvidenceValueCheckpointItem[]) {
  return [
    ["checkpointId", "label", "status", "owner", "metric", "target", "evidence", "action", "href"],
    ...items.map((item) => [item.id, item.label, item.status, item.owner, item.metric, item.target, item.evidence, item.action, item.href])
  ]
    .map((row) => row.map(quickBuyerEvidenceAuditCsvEscape).join(","))
    .join("\n");
}

function quickBuyerEvidenceValueCheckpointMarkdown(
  checkpoint: Omit<QuickBuyerEvidenceValueCheckpoint, "exportMarkdown" | "exportHref" | "csvHref" | "mailHref">,
  payload: QuickBuyerEvidencePackSharePayload
) {
  return [
    "# Buyer value checkpoint",
    "",
    `Buyer: ${payload.buyer || "Buyer"}`,
    `Workflow: ${payload.workflow || "Workflow not included"}`,
    `Status: ${checkpoint.status}`,
    `Ready checks: ${checkpoint.readyCount}/${checkpoint.totalCount}`,
    `Current owner: ${checkpoint.currentItem.owner}`,
    `Source receipt: ${payload.sourceReceiptId || "missing"} / ${payload.sourceChecksum || "checksum missing"}`,
    "",
    "## Summary",
    checkpoint.headline,
    "",
    checkpoint.summary,
    "",
    "## Checks",
    ...checkpoint.items.map(
      (item) =>
        `- [${item.status}] ${item.label} (${item.owner}): ${item.metric}. Target: ${item.target} Evidence: ${item.evidence} Action: ${item.action}${
          item.href ? ` (${item.href})` : ""
        }`
    ),
    "",
    "## CSV",
    checkpoint.csv
  ].join("\n");
}

export function buildQuickBuyerEvidenceValueCheckpoint(payload: QuickBuyerEvidencePackSharePayload): QuickBuyerEvidenceValueCheckpoint {
  const activationPlan = buildQuickBuyerEvidenceActivationPlan(payload);
  const procurementHandoff = buildQuickBuyerEvidenceProcurementHandoff(payload);
  const decisionMemo = buildQuickBuyerEvidenceDecisionMemo(payload);
  const answerBrief = buildQuickBuyerEvidenceAnswerBrief(payload);
  const routeById = new Map(procurementHandoff.routes.map((route) => [route.id, route]));
  const financeRoute = routeById.get("finance");
  const technicalRoute = routeById.get("technical");
  const sponsorRoute = routeById.get("sponsor");
  const valueQuestion = answerBrief.questions.find((question) => question.id === "value") ?? null;
  const valueMemoQuestion = decisionMemo.questions.find((question) => question.id === "value") ?? null;
  const riskMemoQuestion = decisionMemo.questions.find((question) => question.id === "risk") ?? null;
  const activationStepById = new Map(activationPlan.steps.map((step) => [step.id, step]));
  const valueBaselineStep = activationStepById.get("value-baseline");
  const proofRecheckStep = activationStepById.get("proof-recheck");
  const stopRuleStep = activationStepById.get("stop-rule");
  const items: QuickBuyerEvidenceValueCheckpointItem[] = [
    {
      id: "baseline",
      label: "Baseline value",
      status: valueBaselineStep?.status ?? financeRoute?.status ?? valueQuestion?.status ?? "watch",
      owner: valueBaselineStep?.owner ?? financeRoute?.owner ?? valueQuestion?.owner ?? "Finance sponsor",
      metric: "Baseline value claim",
      target: "Value claim is cited before the Day 7 checkpoint.",
      evidence: valueMemoQuestion?.answer || financeRoute?.evidence || valueQuestion?.evidence || payload.workflow || "Value proof is not attached.",
      action: valueBaselineStep?.action ?? financeRoute?.action ?? valueQuestion?.action ?? "Attach measured value proof before finance approval.",
      href: valueBaselineStep?.href || financeRoute?.href || valueQuestion?.href || valueMemoQuestion?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "proof-sample",
      label: "Proof sample",
      status: proofRecheckStep?.status ?? technicalRoute?.status ?? riskMemoQuestion?.status ?? "blocked",
      owner: proofRecheckStep?.owner ?? technicalRoute?.owner ?? "Proof owner",
      metric: "Live proof sample",
      target: "A technical buyer can reopen the live proof from the shared page.",
      evidence: technicalRoute?.evidence ?? riskMemoQuestion?.evidence ?? "Public proof links are not attached.",
      action: proofRecheckStep?.action ?? technicalRoute?.action ?? "Run live audit and attach the result.",
      href: proofRecheckStep?.href || technicalRoute?.href || riskMemoQuestion?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "adoption-signal",
      label: "Adoption signal",
      status: activationPlan.status,
      owner: activationPlan.status === "ready" ? "Launch owner" : activationPlan.currentStep.owner,
      metric: "Activation thread",
      target: "Day 0-7 steps have owner, evidence, and close condition.",
      evidence: activationPlan.summary,
      action: activationPlan.status === "ready" ? "Review the first-week activation thread at the checkpoint." : activationPlan.currentStep.action,
      href: activationPlan.currentStep.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "finance-decision",
      label: "Finance decision",
      status: financeRoute?.status ?? valueMemoQuestion?.status ?? "watch",
      owner: financeRoute?.owner ?? "Finance sponsor",
      metric: "Finance decision",
      target: "Budget owner can accept, repair, or hold with cited evidence.",
      evidence: financeRoute?.approvalSignal ?? valueMemoQuestion?.answer ?? "Finance approval signal is not attached.",
      action: financeRoute?.action ?? "Attach measured value proof before finance approval.",
      href: financeRoute?.href || valueMemoQuestion?.href || payload.firstAction.href || payload.verifierHref
    },
    {
      id: "next-window",
      label: "Next window",
      status: stopRuleStep?.status ?? sponsorRoute?.status ?? "watch",
      owner: stopRuleStep?.owner ?? sponsorRoute?.owner ?? "Decision owner",
      metric: "Stop, repair, or expand window",
      target: "Next checkpoint is scheduled from the send rule.",
      evidence: stopRuleStep?.closeCondition ?? sponsorRoute?.evidence ?? payload.sendRule ?? "No stop rule is attached.",
      action: stopRuleStep?.action ?? sponsorRoute?.action ?? "Schedule the next buyer checkpoint with the verifier attached.",
      href: stopRuleStep?.href || sponsorRoute?.href || "#buyer-response-receipt"
    }
  ];
  const readyCount = items.filter((item) => item.status === "ready").length;
  const status: QuickBuyerRoomPreviewStatus = items.some((item) => item.status === "blocked") ? "blocked" : items.some((item) => item.status === "watch") ? "watch" : "ready";
  const currentItem = items.find((item) => item.status === "blocked") ?? items.find((item) => item.status === "watch") ?? items[items.length - 1]!;
  const headline =
    status === "ready"
      ? "Buyer value checkpoint is ready for Day 7"
      : status === "watch"
        ? "Buyer value checkpoint needs owner review"
        : currentItem.id === "baseline"
          ? "Buyer value checkpoint starts with baseline repair"
          : currentItem.id === "proof-sample"
            ? "Buyer value checkpoint starts with proof repair"
            : "Buyer value checkpoint starts with evidence repair";
  const summary =
    status === "ready"
      ? `${readyCount}/${items.length} value checks are ready; buyer can compare baseline, proof, adoption, finance, and next window.`
      : `${readyCount}/${items.length} value checks are ready. ${currentItem.owner} owns: ${currentItem.action}`;
  const csv = quickBuyerEvidenceValueCheckpointCsv(items);
  const partial = {
    status,
    headline,
    summary,
    readyCount,
    totalCount: items.length,
    currentItem,
    items,
    csv
  };
  const exportMarkdown = quickBuyerEvidenceValueCheckpointMarkdown(partial, payload);
  const mailBody = [
    `${payload.buyer || "Buyer"} value checkpoint`,
    "",
    summary,
    "",
    exportMarkdown
  ].join("\n");

  return {
    ...partial,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    mailHref: `mailto:?subject=${encodeURIComponent(`Buyer value checkpoint: ${payload.buyer || "Buyer"}`)}&body=${encodeURIComponent(mailBody)}`
  };
}

function quickBuyerEvidenceLiveAuditTargetFromArtifact(artifact: QuickBuyerEvidencePackShareArtifact): QuickBuyerEvidenceLiveAuditTarget | null {
  if (!artifact.href || artifact.href === "#" || /^data:/i.test(artifact.href)) return null;
  return {
    id: artifact.id,
    label: artifact.label,
    status: artifact.status,
    href: artifact.href,
    role: artifact.role,
    proof: artifact.proof,
    requiredForSend: artifact.requiredForSend
  };
}

function quickBuyerEvidenceLiveAuditPlanMarkdown(plan: Omit<QuickBuyerEvidenceLiveAuditPlan, "exportMarkdown" | "exportHref">, payload: QuickBuyerEvidencePackSharePayload) {
  return [
    "# Live buyer evidence audit plan",
    "",
    `Buyer: ${payload.buyer || "Buyer"}`,
    `Workflow: ${payload.workflow || "Workflow not included"}`,
    `Status: ${plan.status}`,
    `Audit targets: ${plan.targetCount}`,
    `Required targets: ${plan.requiredTargetCount}`,
    `Ready from packet: ${plan.readyTargetCount}`,
    `First target: ${plan.firstTarget ? `${plan.firstTarget.label} (${plan.firstTarget.href})` : "none"}`,
    "",
    "## Targets",
    ...plan.targets.map(
      (target) =>
        `- [${target.status}] ${target.label}: ${target.href}. Required: ${target.requiredForSend ? "yes" : "no"}. Role: ${target.role}. Proof: ${target.proof}`
    )
  ].join("\n");
}

export function buildQuickBuyerEvidenceLiveAuditPlan(payload: QuickBuyerEvidencePackSharePayload): QuickBuyerEvidenceLiveAuditPlan {
  const targets = payload.artifacts
    .map(quickBuyerEvidenceLiveAuditTargetFromArtifact)
    .filter((target): target is QuickBuyerEvidenceLiveAuditTarget => Boolean(target));
  const targetCount = targets.length;
  const requiredTargetCount = targets.filter((target) => target.requiredForSend).length;
  const readyTargetCount = targets.filter((target) => target.status === "ready").length;
  const firstTarget =
    targets.find((target) => target.id === "proof-repair" && target.status !== "ready") ??
    targets.find((target) => target.requiredForSend && target.status !== "ready") ??
    targets.find((target) => target.status !== "ready") ??
    targets.find((target) => target.requiredForSend) ??
    targets[0] ??
    null;
  const status: QuickBuyerRoomPreviewStatus =
    targetCount === 0 ? "blocked" : targets.some((target) => target.status === "blocked") ? "blocked" : targets.some((target) => target.status === "watch") ? "watch" : "ready";
  const headline =
    targetCount === 0
      ? "Live audit needs public artifact links"
      : status === "ready"
        ? "Recheck live evidence before buyer approval"
        : "Run a live audit before trusting this pack";
  const summary =
    targetCount === 0
      ? "This shared pack has no artifact links the reviewer can recheck from the page."
      : `${targetCount} artifact link${targetCount === 1 ? "" : "s"} can be rechecked from this shared page; ${requiredTargetCount} are required before buyer send.`;
  const partial = {
    status,
    headline,
    summary,
    targetCount,
    requiredTargetCount,
    readyTargetCount,
    firstTarget,
    targets
  };
  const exportMarkdown = quickBuyerEvidenceLiveAuditPlanMarkdown(partial, payload);

  return {
    ...partial,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function quickBuyerEvidenceAuditRepairOwner(id: string) {
  if (id === "decision-case" || id === "send-memo") return "Launch owner";
  if (id === "claim-ledger" || id === "proof-repair" || id === "redaction") return "Proof owner";
  if (id === "conversion-receipt") return "Review coordinator";
  if (id === "pilot-week") return "Pilot owner";
  if (id === "decision-close") return "Decision owner";
  return "Evidence owner";
}

function quickBuyerEvidenceAuditCsvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function quickBuyerEvidenceAuditRepairCsv(tasks: QuickBuyerEvidenceAuditRepairTask[]) {
  return [
    ["taskId", "label", "status", "owner", "due", "action", "closeCondition", "evidence", "href"],
    ...tasks.map((task) => [task.id, task.label, task.status, task.owner, task.dueLabel, task.action, task.closeCondition, task.evidence, task.href])
  ]
    .map((row) => row.map(quickBuyerEvidenceAuditCsvEscape).join(","))
    .join("\n");
}

function quickBuyerEvidenceAuditRepairMarkdown(input: {
  payload: QuickBuyerEvidencePackSharePayload;
  audit: QuickBuyerEvidenceLiveAuditSummaryInput;
  order: Omit<QuickBuyerEvidenceAuditRepairOrder, "markdown" | "exportHref" | "csv" | "csvHref" | "mailHref">;
}) {
  return [
    "# Live evidence audit repair order",
    "",
    `Buyer: ${input.payload.buyer || "Buyer"}`,
    `Workflow: ${input.payload.workflow || "Workflow not included"}`,
    `Audit: ${input.audit.verifiedCount}/${input.audit.totalCount} verified, score ${input.audit.score}/100`,
    `Checked at: ${input.audit.checkedAt}`,
    `Status: ${input.order.status}`,
    `Open tasks: ${input.order.taskTotal}`,
    "",
    "## Summary",
    input.order.headline,
    "",
    input.order.summary,
    "",
    "## Tasks",
    ...(input.order.tasks.length
      ? input.order.tasks.map(
          (task) =>
            `- [${task.status}] ${task.dueLabel} / ${task.owner} / ${task.label}: ${task.action} Close: ${task.closeCondition} Evidence: ${task.evidence} (${task.href})`
        )
      : ["- [ready] No live audit repair task remains. Keep the audit result attached to the buyer response."])
  ].join("\n");
}

export function buildQuickBuyerEvidenceAuditRepairOrder(
  payload: QuickBuyerEvidencePackSharePayload,
  audit: QuickBuyerEvidenceLiveAuditSummaryInput
): QuickBuyerEvidenceAuditRepairOrder {
  const artifactById = new Map(payload.artifacts.map((artifact) => [artifact.id, artifact]));
  const tasks = audit.results
    .filter((result) => result.status !== "pass")
    .map((result): QuickBuyerEvidenceAuditRepairTask => {
      const artifact = artifactById.get(result.id as QuickBuyerEvidencePackShareArtifact["id"]);
      const status: QuickBuyerRoomPreviewStatus = result.status === "block" ? "blocked" : "watch";
      const owner = quickBuyerEvidenceAuditRepairOwner(result.id);
      return {
        id: result.id,
        label: result.label || artifact?.label || "Evidence target",
        status,
        owner,
        dueLabel: status === "blocked" ? "Before buyer send" : "Next review",
        evidence: result.httpStatus ? `${result.evidence} HTTP ${result.httpStatus}.` : result.evidence,
        action: result.action || `Repair ${result.label || artifact?.label || "evidence target"} and rerun the live audit.`,
        closeCondition:
          status === "blocked"
            ? `Replace ${result.label || artifact?.label || "the evidence target"} with a public https URL and rerun Live evidence audit until it verifies.`
            : `Confirm ${result.label || artifact?.label || "the evidence target"} remains readable and attach the refreshed audit result.`,
        href: artifact?.href || result.url || payload.firstAction.href || payload.verifierHref || "#"
      };
    });
  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const watchCount = tasks.filter((task) => task.status === "watch").length;
  const status: QuickBuyerRoomPreviewStatus = blockedCount > 0 ? "blocked" : watchCount > 0 ? "watch" : "ready";
  const firstTask = tasks[0] ?? null;
  const headline =
    status === "ready"
      ? "Live audit leaves no repair order"
      : status === "watch"
        ? "Live audit needs owner review before buyer send"
        : "Live audit created a buyer-send repair order";
  const summary =
    status === "ready"
      ? `${audit.verifiedCount}/${audit.totalCount} public evidence targets verified. Keep the audit result attached to the buyer response.`
      : `${blockedCount} blocked and ${watchCount} watch target${blockedCount + watchCount === 1 ? "" : "s"} remain. ${firstTask?.owner ?? "Evidence owner"} owns the first repair: ${
          firstTask?.action ?? "Re-run live evidence audit."
        }`;
  const partial = {
    status,
    headline,
    summary,
    blockedCount,
    watchCount,
    taskTotal: tasks.length,
    firstTask,
    tasks
  };
  const markdown = quickBuyerEvidenceAuditRepairMarkdown({ payload, audit, order: partial });
  const csv = quickBuyerEvidenceAuditRepairCsv(tasks);
  const mailBody = [
    `${firstTask?.owner ?? "Evidence owner"},`,
    "",
    summary,
    "",
    markdown
  ].join("\n");

  return {
    ...partial,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`,
    csv,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
    mailHref: `mailto:?subject=${encodeURIComponent(`${headline}: ${payload.buyer || "Buyer"}`)}&body=${encodeURIComponent(mailBody)}`
  };
}

export function buildQuickBuyerEvidenceAuditReplacementWorkspace(order: QuickBuyerEvidenceAuditRepairOrder): QuickBuyerEvidenceAuditReplacementWorkspace {
  const slots = order.tasks.map((task): QuickBuyerEvidenceAuditReplacementSlot => ({
    id: task.id,
    label: task.label,
    owner: task.owner,
    currentHref: task.href,
    placeholder: "https://public.example.com/evidence",
    closeCondition: task.closeCondition
  }));
  const status = order.status;
  const headline = slots.length ? "Check replacement proof before reopening approval" : "No replacement proof is needed";
  const summary = slots.length
    ? `${slots.length} replacement URL${slots.length === 1 ? "" : "s"} can be checked here before the buyer approval gate is reopened.`
    : "The live audit repair order is already clean.";
  const markdown = [
    "# Live evidence replacement workspace",
    "",
    `Status: ${status}`,
    `Replacement slots: ${slots.length}`,
    "",
    "## Slots",
    ...(slots.length
      ? slots.map((slot) => `- ${slot.label} / ${slot.owner}: replace ${slot.currentHref}. Close: ${slot.closeCondition}`)
      : ["- No replacement URL is required."])
  ].join("\n");

  return {
    status,
    headline,
    summary,
    slotTotal: slots.length,
    slots,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}

function quickBuyerEvidenceReplacementCloseoutCsv(items: QuickBuyerEvidenceAuditReplacementCloseoutItem[]) {
  return [
    ["slotId", "label", "status", "owner", "replacementHref", "action", "closeCondition", "evidence", "currentHref"],
    ...items.map((item) => [item.id, item.label, item.status, item.owner, item.replacementHref, item.action, item.closeCondition, item.evidence, item.currentHref])
  ]
    .map((row) => row.map(quickBuyerEvidenceAuditCsvEscape).join(","))
    .join("\n");
}

function quickBuyerEvidenceReplacementCloseoutMarkdown(closeout: Omit<QuickBuyerEvidenceAuditReplacementCloseout, "markdown" | "exportHref" | "csv" | "csvHref">) {
  return [
    "# Replacement proof closeout",
    "",
    `Status: ${closeout.status}`,
    `Can reopen buyer approval: ${closeout.canReopen ? "yes" : "no"}`,
    `Checked at: ${closeout.checkedAt}`,
    `Replacement slots: ${closeout.readyCount}/${closeout.slotTotal} ready`,
    `Missing: ${closeout.missingCount}`,
    `Blocked: ${closeout.blockedCount}`,
    `Watch: ${closeout.watchCount}`,
    "",
    "## Summary",
    closeout.headline,
    "",
    closeout.summary,
    "",
    "## Closeout items",
    ...(closeout.items.length
      ? closeout.items.map(
          (item) =>
            `- [${item.status}] ${item.label} / ${item.owner}: ${item.replacementHref || "missing replacement URL"}. ${item.action} Close: ${item.closeCondition} Evidence: ${
              item.evidence
            }`
        )
      : ["- [ready] No replacement proof was required."])
  ].join("\n");
}

export function buildQuickBuyerEvidenceAuditReplacementCloseout(input: {
  workspace: QuickBuyerEvidenceAuditReplacementWorkspace;
  audit: QuickBuyerEvidenceLiveAuditSummaryInput;
  replacements: Record<string, string | undefined>;
}): QuickBuyerEvidenceAuditReplacementCloseout {
  const auditResults = new Map(input.audit.results.map((result) => [result.id, result]));
  const items = input.workspace.slots.map((slot): QuickBuyerEvidenceAuditReplacementCloseoutItem => {
    const replacementHref = (input.replacements[slot.id] ?? "").trim();
    const result = auditResults.get(slot.id);
    if (!replacementHref) {
      return {
        id: slot.id,
        label: slot.label,
        status: "blocked",
        owner: slot.owner,
        currentHref: slot.currentHref,
        replacementHref,
        evidence: "No replacement URL was checked for this repair slot.",
        action: `Add a replacement URL for ${slot.label} and run the replacement check.`,
        closeCondition: slot.closeCondition
      };
    }
    if (!result) {
      return {
        id: slot.id,
        label: slot.label,
        status: "watch",
        owner: slot.owner,
        currentHref: slot.currentHref,
        replacementHref,
        evidence: "This replacement URL is not included in the latest replacement check.",
        action: `Recheck ${slot.label} before reopening buyer approval.`,
        closeCondition: slot.closeCondition
      };
    }
    const status: QuickBuyerRoomPreviewStatus = result.status === "pass" ? "ready" : result.status === "watch" ? "watch" : "blocked";
    return {
      id: slot.id,
      label: slot.label,
      status,
      owner: slot.owner,
      currentHref: slot.currentHref,
      replacementHref: result.url || replacementHref,
      evidence: result.httpStatus ? `${result.evidence} HTTP ${result.httpStatus}.` : result.evidence,
      action:
        status === "ready"
          ? `Attach ${slot.label} replacement proof to the buyer pack and keep this closeout with the response receipt.`
          : result.action || `Repair ${slot.label} and run the replacement check again.`,
      closeCondition:
        status === "ready"
          ? `${slot.label} replacement URL passed the latest live check.`
          : slot.closeCondition
    };
  });
  const slotTotal = input.workspace.slots.length;
  const readyCount = items.filter((item) => item.status === "ready").length;
  const watchCount = items.filter((item) => item.status === "watch").length;
  const missingCount = items.filter((item) => !item.replacementHref).length;
  const blockedCount = items.filter((item) => item.status === "blocked" && item.replacementHref).length;
  const canReopen = slotTotal === 0 || (readyCount === slotTotal && watchCount === 0 && blockedCount === 0 && missingCount === 0);
  const status: QuickBuyerRoomPreviewStatus = canReopen ? "ready" : blockedCount > 0 || missingCount > 0 ? "blocked" : "watch";
  const firstOpenItem = items.find((item) => item.status === "blocked") ?? items.find((item) => item.status === "watch") ?? null;
  const headline =
    status === "ready"
      ? "Buyer approval gate can reopen"
      : status === "watch"
        ? "Buyer approval needs reviewer confirmation"
        : "Buyer approval stays held";
  const summary =
    status === "ready"
      ? slotTotal === 0
        ? "No replacement proof is required; keep the clean live audit attached to the buyer response."
        : `${readyCount}/${slotTotal} replacement proof URL${slotTotal === 1 ? "" : "s"} verified. Reopen buyer approval with this closeout attached.`
      : `${readyCount}/${slotTotal} replacement proof URL${slotTotal === 1 ? "" : "s"} verified; ${missingCount} missing, ${blockedCount} blocked, and ${watchCount} watch. ${
          firstOpenItem ? `${firstOpenItem.owner} owns ${firstOpenItem.label}.` : "Run the replacement check again before reopening."
        }`;
  const partial = {
    status,
    headline,
    summary,
    checkedAt: input.audit.checkedAt,
    readyCount,
    watchCount,
    blockedCount,
    missingCount,
    slotTotal,
    canReopen,
    firstOpenItem,
    items
  };
  const markdown = quickBuyerEvidenceReplacementCloseoutMarkdown(partial);
  const csv = quickBuyerEvidenceReplacementCloseoutCsv(items);

  return {
    ...partial,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`,
    csv,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
  };
}

export function quickBuyerEvidenceReplacementCloseoutReviewerNote(closeout: QuickBuyerEvidenceAuditReplacementCloseout) {
  if (closeout.canReopen) {
    return `Replacement closeout verified ${closeout.readyCount}/${closeout.slotTotal} repair slots at ${closeout.checkedAt}. Buyer approval gate can reopen with the closeout export attached.`;
  }
  return `Replacement closeout is not ready: ${closeout.missingCount} missing, ${closeout.blockedCount} blocked, ${closeout.watchCount} watch. Keep buyer send held and attach the closeout export to the repair response.`;
}

function quickBuyerEvidencePayloadWithReplacementCloseout(
  payload: QuickBuyerEvidencePackSharePayload,
  closeout?: QuickBuyerEvidenceAuditReplacementCloseout | null
): QuickBuyerEvidencePackSharePayload {
  if (!closeout?.canReopen) return payload;
  const itemById = new Map(closeout.items.map((item) => [item.id, item]));
  return {
    ...payload,
    status: "ready",
    label: "Replacement proof closeout ready",
    headline: "Buyer evidence pack reopened by replacement closeout",
    summary: `${closeout.readyCount}/${closeout.slotTotal} replacement proof URLs verified at ${closeout.checkedAt}. The buyer response can reference the closeout receipt before external send.`,
    sendRule: `Buyer send is reopened by the replacement closeout: ${closeout.readyCount}/${closeout.slotTotal} repair slots verified. Keep the closeout export and source verifier attached.`,
    firstAction: {
      label: "Open receipt verifier",
      href: payload.verifierHref
    },
    artifacts: payload.artifacts.map((artifact) => {
      const item = itemById.get(artifact.id);
      return {
        ...artifact,
        status: "ready",
        href: item?.replacementHref || artifact.href,
        proof: item ? `${artifact.proof} Replacement closeout: ${item.evidence}` : artifact.proof
      };
    })
  };
}

function quickBuyerEvidenceDecisionReceiptReplacementCloseout(
  closeout: QuickBuyerEvidenceAuditReplacementCloseout
): QuickExternalReviewDecisionReceiptReplacementCloseout {
  return {
    status: closeout.status,
    headline: closeout.headline,
    summary: closeout.summary,
    checkedAt: closeout.checkedAt,
    readyCount: closeout.readyCount,
    watchCount: closeout.watchCount,
    blockedCount: closeout.blockedCount,
    missingCount: closeout.missingCount,
    slotTotal: closeout.slotTotal,
    canReopen: closeout.canReopen,
    firstOpenItemId: closeout.firstOpenItem?.id ?? "",
    items: closeout.items.map((item) => ({
      id: item.id,
      label: item.label,
      status: item.status,
      replacementHref: item.replacementHref,
      evidence: item.evidence
    }))
  };
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
  const sourceReady = quickBuyerEvidenceSourceReceiptReady(input.payload);
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

function quickBuyerEvidenceFollowUpHref(item: QuickExternalReviewOwnerPacketRunbookItem, plan: QuickBuyerEvidenceResponseFollowUpLedgerInput) {
  if (/^(https?:\/\/|\/|#)/i.test(item.proof)) return item.proof;
  if (/^(https?:\/\/|\/|#)/i.test(item.evidence)) return item.evidence;
  return plan.verifierHref || plan.packVerifierHref || plan.evidencePackHref;
}

function quickBuyerEvidenceFollowUpCloseCondition(item: QuickExternalReviewOwnerPacketRunbookItem, plan: QuickBuyerEvidenceResponseFollowUpLedgerInput) {
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
  plan: QuickBuyerEvidenceResponseFollowUpLedgerInput;
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

function quickBuyerEvidenceFollowUpHeadline(plan: QuickBuyerEvidenceResponseFollowUpLedgerInput) {
  if (plan.state !== "verified") return "Returned response is held until it can be trusted";
  if (plan.status === "ready") return "Buyer response is ready to run";
  if (plan.status === "watch") return "Buyer response becomes a dated repair ledger";
  return "Buyer response blocks external send";
}

export function buildQuickBuyerEvidenceResponseFollowUpLedger(plan: QuickBuyerEvidenceResponseFollowUpLedgerInput): QuickBuyerEvidenceResponseFollowUpLedger {
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

export function quickBuyerEvidenceResponseHeadline(decision: QuickExternalReviewDecision, buyer: string) {
  if (decision === "continue") return `${buyer} accepted the evidence pack`;
  if (decision === "revise") return `${buyer} response is now a repair order`;
  return `${buyer} send is held by the returned response`;
}

export function buildQuickBuyerEvidenceDecisionImpactPreview(receipt: QuickBuyerEvidenceDecisionReceipt): QuickBuyerEvidenceDecisionImpactPreview {
  const headline =
    receipt.decision === "continue"
      ? receipt.payload.status === "ready"
        ? "Acceptance can route to launch owner"
        : "Acceptance still carries proof risk"
      : receipt.decision === "revise"
        ? "Repair request becomes an owner packet"
        : "Hold response becomes a blocker ledger";
  const followUpLine =
    receipt.followUpLedger.firstDueLabel === "No owner task"
      ? `${receipt.followUpLedger.taskTotal} owner tasks`
      : `${receipt.followUpLedger.taskTotal} owner tasks, first due ${receipt.followUpLedger.firstDueLabel}`;

  return {
    status: receipt.payload.status,
    headline,
    summary: `${receipt.label} assigns ${receipt.owner} and returns a verified response receipt.`,
    decisionLine: receipt.label,
    ownerLine: receipt.owner,
    followUpLine,
    returnLine: receipt.returnHref.includes("evidenceResponse=") ? "Owner workspace receives the response receipt" : "Response receipt return link is ready",
    nextAction: receipt.payload.nextAction
  };
}

export function buildQuickBuyerEvidenceDecisionReceipt(input: {
  payload: QuickBuyerEvidencePackSharePayload;
  decision?: QuickExternalReviewDecision;
  reviewerName?: string;
  reviewerNote?: string;
  generatedAt?: string;
  replacementCloseout?: QuickBuyerEvidenceAuditReplacementCloseout | null;
  returnBaseHref?: string;
}): QuickBuyerEvidenceDecisionReceipt {
  const receiptPayload = quickBuyerEvidencePayloadWithReplacementCloseout(input.payload, input.replacementCloseout);
  const recommendedDecision = quickBuyerEvidenceRecommendedDecision(receiptPayload);
  const decision = input.decision ?? recommendedDecision;
  const requiredArtifacts = quickBuyerEvidenceRequiredArtifacts(receiptPayload);
  const testsReady = quickBuyerEvidenceReadyRequiredCount(receiptPayload);
  const testsTotal = requiredArtifacts.length;
  const confidence = Math.round((testsReady / Math.max(1, testsTotal)) * 100);
  const label = quickBuyerEvidenceDecisionLabel(decision);
  const summary = quickBuyerEvidenceDecisionSummary(receiptPayload, decision);
  const reviewerName = quickBuyerEvidenceShareText(input.reviewerName, 160) || "Buyer reviewer";
  const reviewerNote =
    quickBuyerEvidenceShareText(input.reviewerNote, 1000) ||
    (input.replacementCloseout ? quickBuyerEvidenceReplacementCloseoutReviewerNote(input.replacementCloseout) : quickBuyerEvidenceDefaultReviewerNote(receiptPayload, decision));
  const decisionStatus = quickBuyerEvidenceDecisionPayloadStatus({ packetStatus: receiptPayload.status, decision, reviewerName });
  const scorecard = buildQuickBuyerEvidenceDecisionScorecard({
    payload: receiptPayload,
    decision,
    recommendedDecision,
    reviewerName,
    testsReady,
    testsTotal
  });
  const replacementCloseoutPayload = input.replacementCloseout ? quickBuyerEvidenceDecisionReceiptReplacementCloseout(input.replacementCloseout) : undefined;
  const payload: QuickExternalReviewDecisionReceiptPayload = {
    receiptVersion: QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION,
    decision,
    status: decisionStatus,
    label,
    reviewerName,
    reviewerNote,
    buyer: input.payload.buyer || "Buyer",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    manifestReceiptId: input.payload.sourceReceiptId || "quick-buyer-evidence-pack",
    manifestChecksum: input.payload.sourceChecksum || "unknown",
    packetStatus: receiptPayload.status,
    packetClearance: decisionStatus === "ready" ? "external-review" : "internal-only",
    testsReady,
    testsTotal,
    confidence,
    reviewOutcome: summary,
    nextAction: quickBuyerEvidenceDecisionNextAction(receiptPayload, decision),
    proof: `${input.payload.sourceReceiptId || "evidence-pack"} / ${input.payload.sourceChecksum || "checksum missing"} / ${testsReady}/${testsTotal} required artifacts ready${
      input.replacementCloseout ? ` / replacement closeout ${input.replacementCloseout.readyCount}/${input.replacementCloseout.slotTotal}` : ""
    }`,
    ...(replacementCloseoutPayload ? { replacementCloseout: replacementCloseoutPayload } : {})
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
    packVerifierHref: input.payload.verifierHref,
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
