import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, Download, ExternalLink, FileText, Gauge, ListChecks, Lock, Rocket, Scale, Send, ShieldCheck } from "lucide-react";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate";
import { buildBuyerProofRepairProjection, type BuyerProofRepairProjection } from "./buyerProofRepairQueue";
import { downloadHrefFile, downloadTextFile } from "./downloadArtifact";
import { HomepageExternalReviewerDockRuntimePanel } from "./HomepageExternalReviewerDockPanel";
import type { HomepageValueLensSnapshot } from "./HomepageValueLens";
import type { HomepageOutcomeArtifactSnapshot, HomepageProofEntrySnapshot, HomepageReviewerHandoffKitSnapshot } from "./App";
import {
  buildHomepageFirstRunValueProofCommand,
  type HomepageFirstRunValueProofAction,
  type HomepageFirstRunValueProofCommandSnapshot,
  type HomepageFirstRunValueProofStatus
} from "./homepageFirstRunValueProofCommand";
import { buildWorkflowLiveProofAudit, type WorkflowLiveProofAudit, type WorkflowLiveProofAuditRow } from "./workflowLiveProofAudit";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";
import type { WorkflowIntakeProofSlot } from "./workflowIntakeShareGate";
import type { WorkspaceDraft } from "./workspaceDraft";
import "./HomepageFirstRunValueProofCommandPanel.css";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function routeActionAttrs(action: HomepageFirstRunValueProofAction) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function statusIcon(status: HomepageFirstRunValueProofStatus) {
  if (status === "ready") return <BadgeCheck size={15} />;
  if (status === "attention") return <Gauge size={15} />;
  return <AlertTriangle size={15} />;
}

type FirstRunProofVerifyStatus = "idle" | "checking" | "checked" | "failed";

function proofAuditButtonLabel(status: FirstRunProofVerifyStatus) {
  if (status === "checking") return "Checking";
  if (status === "checked") return "Live checked";
  if (status === "failed") return "Retry check";
  return "Live check";
}

function auditStatusIcon(status: WorkflowLiveProofAuditRow["status"]) {
  if (status === "pass") return <BadgeCheck size={13} />;
  if (status === "watch") return <Gauge size={13} />;
  return <AlertTriangle size={13} />;
}

function auditStatusClass(status: "verified" | "action-required" | "not-run") {
  if (status === "verified") return "ready";
  if (status === "action-required") return "attention";
  return "blocked";
}

function receiptVerifierPrefillHref(verificationRequestJson: string) {
  return `/receipt-verifier?${new URLSearchParams({ request: verificationRequestJson, verify: "1" }).toString()}`;
}

function liveProofAuditReceiptHref(liveProofAudit: WorkflowLiveProofAudit | null) {
  return liveProofAudit ? receiptVerifierPrefillHref(liveProofAudit.verificationRequestJson) : "#launch-evidence-console";
}

const FIRST_RUN_SECTION_HREFS = {
  buyerDecisionRehearsal: "#first-run-decision-rehearsal",
  buyerFollowUp: "#first-run-follow-up",
  buyerMeetingBrief: "#first-run-meeting-brief",
  externalDecisionPacket: "#first-run-decision-packet",
  externalVerification: "#first-run-external-verification",
  proofCloseout: "#first-run-proof-closeout",
  publicRepairPayoff: "#first-run-public-repair-payoff",
  publicValueRelease: "#first-run-public-value-release",
  repairImpactSimulation: "#first-run-repair-impact-simulation",
  repairRunbook: "#first-run-repair-runbook",
  reviewerPacket: "#first-run-reviewer-packet",
  submissionManifest: "#first-run-submission-manifest"
} as const;

const PROOF_FRESHNESS_WINDOW_HOURS = 24;

type FirstRunPublicValueReleaseGateCheck = {
  id: "value" | "packet" | "live-proof" | "delivery-lock";
  label: string;
  status: HomepageFirstRunValueProofStatus;
  value: string;
  evidence: string;
  owner: string;
  action: string;
  href: string;
};

type FirstRunPublicValueReleaseGate = {
  status: HomepageFirstRunValueProofStatus;
  label: string;
  headline: string;
  summary: string;
  releaseScore: number;
  shareableMonthlyValueYen: number;
  lockedMonthlyValueYen: number;
  nextOwner: string;
  nextAction: string;
  releaseRule: string;
  checks: FirstRunPublicValueReleaseGateCheck[];
  exportMarkdown: string;
  exportHref: string;
};

type FirstRunReviewerPacketProofStatus = "pass" | "watch" | "block" | "missing";

type FirstRunReviewerPacketProofLine = {
  id: string;
  label: string;
  status: FirstRunReviewerPacketProofStatus;
  value: string;
  href: string;
  evidence: string;
  action: string;
};

type FirstRunReviewerPacket = {
  status: HomepageFirstRunValueProofStatus;
  label: string;
  headline: string;
  summary: string;
  subject: string;
  body: string;
  proofSummary: string;
  nextActionLine: string;
  proofLines: FirstRunReviewerPacketProofLine[];
  exportHref: string;
};

type FirstRunRepairWorkOrderPriority = "now" | "next" | "monitor";

type FirstRunRepairWorkOrder = {
  id: string;
  priority: FirstRunRepairWorkOrderPriority;
  owner: string;
  label: string;
  evidence: string;
  action: string;
  acceptance: string;
  href: string;
};

type FirstRunRepairRunbook = {
  status: HomepageFirstRunValueProofStatus;
  headline: string;
  summary: string;
  ownerLine: string;
  orderCount: number;
  nowCount: number;
  nextCount: number;
  orders: FirstRunRepairWorkOrder[];
  markdown: string;
  exportHref: string;
};

type FirstRunSubmissionManifestCheck = {
  id: "deployed-url" | "protopedia-url" | "walkthrough-video" | "reviewer-packet" | "live-proof-audit" | "repair-runbook";
  label: string;
  status: HomepageFirstRunValueProofStatus;
  owner: string;
  value: string;
  evidence: string;
  action: string;
  href: string;
};

type FirstRunProofFreshnessWindow = {
  status: HomepageFirstRunValueProofStatus;
  label: string;
  checkedAt: string;
  expiresAt: string;
  owner: string;
  receiptLine: string;
  rule: string;
  action: string;
};

type FirstRunSubmissionManifest = {
  status: HomepageFirstRunValueProofStatus;
  headline: string;
  summary: string;
  readinessScore: number;
  readyCount: number;
  checkTotal: number;
  nextOwner: string;
  nextAction: string;
  freshnessWindow: FirstRunProofFreshnessWindow;
  checks: FirstRunSubmissionManifestCheck[];
  markdown: string;
  exportHref: string;
};

type FirstRunExternalDecisionPacket = {
  status: HomepageFirstRunValueProofStatus;
  label: string;
  headline: string;
  summary: string;
  recipient: string;
  safeValueLine: string;
  sendRule: string;
  nextAsk: string;
  blockers: FirstRunSubmissionManifestCheck[];
  artifactCount: number;
  body: string;
  exportHref: string;
};

type FirstRunPublicRepairPayoffAction = {
  id: string;
  status: HomepageFirstRunValueProofStatus;
  label: string;
  owner: string;
  value: string;
  action: string;
  acceptance: string;
  href: string;
};

type FirstRunPublicRepairPayoff = {
  status: HomepageFirstRunValueProofStatus;
  headline: string;
  summary: string;
  lockedMonthlyValueYen: number;
  gateLine: string;
  recoveryLine: string;
  nextAction: string;
  actions: FirstRunPublicRepairPayoffAction[];
  markdown: string;
  exportHref: string;
};

type FirstRunBuyerDecisionRehearsalRoute = {
  id: "review-kit" | "decision-receipt" | "acceptance-path";
  status: HomepageFirstRunValueProofStatus;
  label: string;
  value: string;
  evidence: string;
  action: string;
  href: string;
};

type FirstRunBuyerDecisionRehearsal = {
  status: HomepageFirstRunValueProofStatus;
  headline: string;
  summary: string;
  recommendedDecision: string;
  guardrail: string;
  sendRule: string;
  nextAction: string;
  routes: FirstRunBuyerDecisionRehearsalRoute[];
  markdown: string;
  exportHref: string;
};

type FirstRunBuyerMeetingBriefAgendaItem = {
  id: "value-case" | "receipt-check" | "pilot-decision";
  status: HomepageFirstRunValueProofStatus;
  label: string;
  owner: string;
  question: string;
  evidence: string;
  exitCriteria: string;
  href: string;
};

type FirstRunBuyerMeetingBrief = {
  status: HomepageFirstRunValueProofStatus;
  label: string;
  headline: string;
  decisionAsk: string;
  meetingGoal: string;
  stopRule: string;
  agenda: FirstRunBuyerMeetingBriefAgendaItem[];
  markdown: string;
  exportHref: string;
};

type FirstRunBuyerQuestionAnswer = {
  id: FirstRunBuyerMeetingBriefAgendaItem["id"];
  status: HomepageFirstRunValueProofStatus;
  label: string;
  owner: string;
  question: string;
  answer: string;
  proof: string;
  decisionCriteria: string;
  href: string;
};

type FirstRunBuyerQuestionBoard = {
  status: HomepageFirstRunValueProofStatus;
  label: string;
  headline: string;
  summary: string;
  answeredCount: number;
  questionTotal: number;
  currentQuestion: FirstRunBuyerQuestionAnswer;
  answerRule: string;
  questions: FirstRunBuyerQuestionAnswer[];
  markdown: string;
  exportHref: string;
};

type FirstRunBuyerApprovalChecklistItem = {
  id: "value-clearance" | "receipt-verification" | "decision-route" | "meeting-ask" | "follow-up-package";
  status: HomepageFirstRunValueProofStatus;
  label: string;
  owner: string;
  approvalQuestion: string;
  evidence: string;
  approvalCondition: string;
  repairAction: string;
  href: string;
};

type FirstRunBuyerApprovalChecklist = {
  status: HomepageFirstRunValueProofStatus;
  label: string;
  headline: string;
  summary: string;
  decisionGate: string;
  approvedCount: number;
  itemTotal: number;
  currentItem: FirstRunBuyerApprovalChecklistItem;
  items: FirstRunBuyerApprovalChecklistItem[];
  markdown: string;
  exportHref: string;
};

type FirstRunBuyerFollowUpStep = {
  id: "proof-state" | "meeting-ask" | "decision-record";
  status: HomepageFirstRunValueProofStatus;
  label: string;
  owner: string;
  instruction: string;
  evidence: string;
  href: string;
};

type FirstRunBuyerFollowUpAttachment = {
  id: "reviewer-packet" | "public-manifest" | "decision-route" | "fresh-live-proof";
  status: HomepageFirstRunValueProofStatus;
  label: string;
  owner: string;
  evidence: string;
  action: string;
  href: string;
};

type FirstRunBuyerFollowUp = {
  status: HomepageFirstRunValueProofStatus;
  label: string;
  headline: string;
  recipient: string;
  subject: string;
  opening: string;
  nextAsk: string;
  safetyLine: string;
  attachmentRule: string;
  body: string;
  steps: FirstRunBuyerFollowUpStep[];
  attachments: FirstRunBuyerFollowUpAttachment[];
  exportHref: string;
};

type FirstRunProofCloseoutStep = {
  id: "paste-url" | "run-check" | "release-value";
  status: HomepageFirstRunValueProofStatus;
  label: string;
  owner: string;
  instruction: string;
  acceptance: string;
  href: string;
};

type FirstRunProofCloseout = {
  status: HomepageFirstRunValueProofStatus;
  label: string;
  headline: string;
  summary: string;
  owner: string;
  targetLabel: string;
  targetValue: string;
  acceptanceLine: string;
  valueUnlockLine: string;
  inputHref: string;
  steps: FirstRunProofCloseoutStep[];
  markdown: string;
  exportHref: string;
};

type FirstRunCriticalPathStep = {
  id: "proof-closeout" | "value-release" | "decision-packet" | "buyer-follow-up";
  status: HomepageFirstRunValueProofStatus;
  label: string;
  owner: string;
  evidence: string;
  action: string;
  href: string;
};

type FirstRunCriticalPath = {
  status: HomepageFirstRunValueProofStatus;
  label: string;
  headline: string;
  summary: string;
  readyCount: number;
  stepTotal: number;
  currentStep: FirstRunCriticalPathStep;
  primaryActionLabel: string;
  valueLine: string;
  steps: FirstRunCriticalPathStep[];
  markdown: string;
  exportHref: string;
};

type FirstRunExternalVerificationCheck = {
  id: "packet-verifier" | "public-proof" | "live-audit" | "value-release" | "decision-packet";
  status: HomepageFirstRunValueProofStatus;
  label: string;
  owner: string;
  evidence: string;
  action: string;
  href: string;
};

type FirstRunExternalVerificationDesk = {
  status: HomepageFirstRunValueProofStatus;
  label: string;
  headline: string;
  summary: string;
  readinessScore: number;
  readyCount: number;
  checkTotal: number;
  currentCheck: FirstRunExternalVerificationCheck;
  sendRule: string;
  checks: FirstRunExternalVerificationCheck[];
  markdown: string;
  exportHref: string;
};

type FirstRunRepairImpactSimulationAction = {
  id: FirstRunSubmissionManifestCheck["id"];
  status: HomepageFirstRunValueProofStatus;
  label: string;
  owner: string;
  value: string;
  evidence: string;
  action: string;
  href: string;
  selected: boolean;
};

type FirstRunRepairImpactAcceptanceItem = {
  id: FirstRunSubmissionManifestCheck["id"];
  sequence: number;
  status: HomepageFirstRunValueProofStatus;
  phase: string;
  label: string;
  owner: string;
  acceptance: string;
  valueEffect: string;
  href: string;
  selected: boolean;
};

type FirstRunRepairImpactSimulation = {
  status: HomepageFirstRunValueProofStatus;
  headline: string;
  summary: string;
  acceptanceHeadline: string;
  acceptanceSummary: string;
  selectedCount: number;
  actionCount: number;
  currentReadyCount: number;
  projectedReadyCount: number;
  checkTotal: number;
  currentReadinessScore: number;
  projectedReadinessScore: number;
  projectedShareableMonthlyValueYen: number;
  projectedLockedMonthlyValueYen: number;
  remainingBlockerCount: number;
  decisionLine: string;
  nextAction: string;
  actions: FirstRunRepairImpactSimulationAction[];
  acceptanceItems: FirstRunRepairImpactAcceptanceItem[];
  markdown: string;
  exportHref: string;
};

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function releaseStatusScore(status: HomepageFirstRunValueProofStatus) {
  if (status === "ready") return 100;
  if (status === "attention") return 65;
  return 0;
}

function releaseWorstStatus(statuses: HomepageFirstRunValueProofStatus[]) {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function releaseGateLine(check: FirstRunPublicValueReleaseGateCheck) {
  const value = check.value.trim().replace(/[.。]\s*$/, "");
  return `- [${check.status}] ${check.label} (${check.owner}): ${value}. ${check.evidence} Action: ${check.action}`;
}

function compactProofValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "missing";
  return trimmed.length > 90 ? `${trimmed.slice(0, 87)}...` : trimmed;
}

function proofOwnerFor(id: string) {
  if (id === "pilotEvidenceUrl") return "Pilot reviewer";
  if (id === "workOrderEvidenceUrl") return "Scope owner";
  if (id === "targetUrl" || id === "protopediaUrl" || id === "videoUrl") return "Publication owner";
  return "Proof owner";
}

function proofAcceptanceFor(line: FirstRunReviewerPacketProofLine) {
  if (line.status === "missing") return `${line.label} has a public HTTPS URL and the live proof audit no longer reports it as missing.`;
  if (line.status === "block") return `${line.label} opens for an external reviewer and the live proof audit returns pass.`;
  if (line.status === "watch") return `${line.label} is checked live again and remains reachable during the review window.`;
  return `${line.label} remains reachable and attached to the reviewer packet.`;
}

function proofLineManifestStatus(line?: FirstRunReviewerPacketProofLine): HomepageFirstRunValueProofStatus {
  if (!line) return "blocked";
  if (line.status === "pass") return "ready";
  if (line.status === "watch") return "attention";
  return "blocked";
}

function liveAuditManifestStatus(liveProofAudit: WorkflowLiveProofAudit | null): HomepageFirstRunValueProofStatus {
  return liveProofAudit?.status === "verified" ? "ready" : "blocked";
}

function addHoursIso(value: string, hours: number) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "";
  return new Date(parsed + hours * 60 * 60 * 1000).toISOString();
}

function buildFirstRunProofFreshnessWindow(liveProofAudit: WorkflowLiveProofAudit | null, nowMs = Date.now()): FirstRunProofFreshnessWindow {
  const checkedAt = liveProofAudit?.checkedAt ?? "";
  const expiresAt = checkedAt ? addHoursIso(checkedAt, PROOF_FRESHNESS_WINDOW_HOURS) : "";
  const expiresAtMs = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  const expired = Number.isFinite(expiresAtMs) && nowMs > expiresAtMs;
  const verified = liveProofAudit?.status === "verified";
  const status: HomepageFirstRunValueProofStatus =
    verified && expiresAt && !expired
      ? "ready"
      : verified && expired
        ? "blocked"
        : checkedAt
          ? "attention"
          : "blocked";
  const label =
    status === "ready"
      ? "Fresh for review"
      : verified && expired
        ? "Freshness expired"
        : status === "attention"
          ? "Recheck after repair"
          : "Freshness missing";
  const action =
    status === "ready"
      ? `Recheck before ${expiresAt} or before the next reviewer forward, whichever comes first.`
      : verified && expired
        ? "Reissue live proof verification before public sharing; do not reuse the expired receipt."
      : status === "attention"
        ? "Repair failed proof links, then reissue a fresh live proof receipt before forwarding."
        : "Run live proof verification immediately before public sharing.";

  return {
    status,
    label,
    checkedAt: checkedAt || "not checked",
    expiresAt: expiresAt || "not scheduled",
    owner: "Proof owner",
    receiptLine: liveProofAudit ? `${liveProofAudit.receiptId} / ${liveProofAudit.checksumAlgorithm}:${liveProofAudit.checksum}` : "not issued",
    rule: `Treat live proof as fresh for ${PROOF_FRESHNESS_WINDOW_HOURS} hours; hold public value claims after expiry or any failed audit row.`,
    action
  };
}

function proofCloseoutRowStatus(row?: WorkflowLiveProofAuditRow, link?: WorkflowIntakeProofSlot): HomepageFirstRunValueProofStatus {
  if (row?.status === "pass") return "ready";
  if (row?.status === "watch") return "attention";
  if (link?.value.trim()) return "attention";
  return "blocked";
}

function submissionManifestLine(check: FirstRunSubmissionManifestCheck) {
  return `- [${check.status}] ${check.label} (${check.owner}): ${check.value}. ${check.evidence} Action: ${check.action}`;
}

function decisionPacketBlockerLine(check: FirstRunSubmissionManifestCheck) {
  return `- [${check.status}] ${check.label}: ${check.owner} must ${check.action}`;
}

function proofRepairProjectionStatus(status: BuyerProofRepairProjection["status"]): HomepageFirstRunValueProofStatus {
  return status === "ready" ? "ready" : status === "attention" ? "attention" : "blocked";
}

function repairPayoffActionLine(action: FirstRunPublicRepairPayoffAction) {
  return `- [${action.status}] ${action.label} (${action.owner}): ${action.value}. Action: ${action.action}. Acceptance: ${action.acceptance}`;
}

function decisionRehearsalRouteLine(route: FirstRunBuyerDecisionRehearsalRoute) {
  return `- [${route.status}] ${route.label}: ${route.value}. ${route.evidence} Action: ${route.action}`;
}

function buyerMeetingBriefAgendaLine(item: FirstRunBuyerMeetingBriefAgendaItem) {
  return `- [${item.status}] ${item.label} (${item.owner}): ${item.question} Evidence: ${item.evidence} Exit: ${item.exitCriteria}`;
}

function buyerQuestionAnswerLine(question: FirstRunBuyerQuestionAnswer) {
  return `- [${question.status}] ${question.label} (${question.owner}): ${question.question} Answer: ${question.answer} Proof: ${question.proof} Decision criteria: ${question.decisionCriteria}`;
}

function buyerApprovalChecklistLine(item: FirstRunBuyerApprovalChecklistItem) {
  return `- [${item.status}] ${item.label} (${item.owner}): ${item.approvalQuestion} Evidence: ${item.evidence} Approval: ${item.approvalCondition} Repair: ${item.repairAction}`;
}

function buyerFollowUpStepLine(step: FirstRunBuyerFollowUpStep) {
  return `- [${step.status}] ${step.label} (${step.owner}): ${step.instruction} Evidence: ${step.evidence}`;
}

function buyerFollowUpAttachmentLine(attachment: FirstRunBuyerFollowUpAttachment) {
  return `- [${attachment.status}] ${attachment.label} (${attachment.owner}): ${attachment.evidence} Action: ${attachment.action}`;
}

function proofCloseoutStepLine(step: FirstRunProofCloseoutStep) {
  return `- [${step.status}] ${step.label} (${step.owner}): ${step.instruction} Acceptance: ${step.acceptance}`;
}

function criticalPathStepLine(step: FirstRunCriticalPathStep) {
  return `- [${step.status}] ${step.label} (${step.owner}): ${step.evidence}. Action: ${step.action}`;
}

function externalVerificationCheckLine(check: FirstRunExternalVerificationCheck) {
  return `- [${check.status}] ${check.label} (${check.owner}): ${check.evidence}. Action: ${check.action}`;
}

function repairImpactSimulationActionLine(action: FirstRunRepairImpactSimulationAction) {
  return `- [${action.selected ? "simulated" : action.status}] ${action.label} (${action.owner}): ${action.value}. Action: ${action.action}`;
}

function repairImpactAcceptanceLine(item: FirstRunRepairImpactAcceptanceItem) {
  return `- ${item.sequence}. [${item.phase}] ${item.label} (${item.owner}): ${item.acceptance} ${item.valueEffect}`;
}

function buildFirstRunPublicValueReleaseGate(input: {
  snapshot: HomepageFirstRunValueProofCommandSnapshot;
  valueLens: HomepageValueLensSnapshot;
  liveProofAudit: WorkflowLiveProofAudit | null;
  freshnessNowMs?: number;
}): FirstRunPublicValueReleaseGate {
  const valueCheck = input.snapshot.checks.find((check) => check.id === "value-case");
  const packetCheck = input.snapshot.checks.find((check) => check.id === "buyer-packet");
  const measuredMonthlyValue = Math.max(0, input.valueLens.measuredMonthlyValueYen);
  const liveProofAudit = input.liveProofAudit;
  const freshnessWindow = buildFirstRunProofFreshnessWindow(liveProofAudit, input.freshnessNowMs);
  const liveProofStatus: HomepageFirstRunValueProofStatus = freshnessWindow.status === "ready" ? "ready" : "blocked";
  const noSendStatus: HomepageFirstRunValueProofStatus = input.snapshot.repairGuide ? "blocked" : input.snapshot.status === "ready" ? "ready" : "attention";
  const checks: FirstRunPublicValueReleaseGateCheck[] = [
    {
      id: "value",
      label: "Value receipt",
      status: valueCheck?.status ?? input.snapshot.status,
      value: input.snapshot.valueLine,
      evidence: valueCheck?.evidence ?? "Value receipt must verify before the claim leaves the room.",
      owner: "Finance owner",
      action: valueCheck?.status === "ready" ? "Keep the value receipt attached to the public claim." : valueCheck?.actionLabel ?? "Repair the value case.",
      href: valueCheck?.href ?? input.valueLens.primaryAction.href
    },
    {
      id: "packet",
      label: "Buyer packet",
      status: packetCheck?.status ?? input.snapshot.status,
      value: input.snapshot.packetLine,
      evidence: packetCheck?.evidence ?? "Buyer packet receipt must verify before external review.",
      owner: "Launch owner",
      action: packetCheck?.status === "ready" ? "Keep packet receipt verification attached." : packetCheck?.actionLabel ?? "Repair the buyer packet.",
      href: packetCheck?.href ?? input.snapshot.primaryAction.href
    },
    {
      id: "live-proof",
      label: "Live proof freshness",
      status: liveProofStatus,
      value: liveProofAudit ? `${liveProofAudit.verifiedCount}/${liveProofAudit.totalCount} proof links; ${freshnessWindow.label}` : "not checked",
      evidence: liveProofAudit ? `${liveProofAudit.summary} ${freshnessWindow.rule}` : "Run live proof verification before any public value claim.",
      owner: "Proof owner",
      action: freshnessWindow.action,
      href: liveProofAuditReceiptHref(liveProofAudit)
    },
    {
      id: "delivery-lock",
      label: "No-send lock",
      status: noSendStatus,
      value: input.snapshot.status === "ready" ? "clear" : input.snapshot.sendRule,
      evidence: input.snapshot.repairGuide?.noSendSummary ?? input.snapshot.summary,
      owner: input.snapshot.repairGuide?.firstOwner ?? "Review owner",
      action: input.snapshot.repairGuide?.firstAction ?? "Keep the packet verifier and live proof audit attached.",
      href: input.snapshot.repairGuide?.firstInputAction.href ?? input.snapshot.primaryAction.href
    }
  ];
  const status = releaseWorstStatus(checks.map((check) => check.status));
  const releaseScore = Math.round(checks.reduce((sum, check) => sum + releaseStatusScore(check.status), 0) / checks.length);
  const shareableMonthlyValueYen = status === "ready" ? measuredMonthlyValue : 0;
  const lockedMonthlyValueYen = Math.max(0, measuredMonthlyValue - shareableMonthlyValueYen);
  const firstOpen = checks.find((check) => check.status === "blocked") ?? checks.find((check) => check.status === "attention");
  const label = status === "ready" ? "Value released" : status === "attention" ? "Value needs review" : "Value locked";
  const headline = status === "ready" ? `${yen(measuredMonthlyValue)}/month can be shown publicly` : `${yen(measuredMonthlyValue)}/month stays internal`;
  const summary =
    status === "ready"
      ? `${input.snapshot.buyer} can see the public value claim with packet and live proof receipts attached.`
      : `${yen(lockedMonthlyValueYen)}/month remains internal until ${firstOpen?.owner ?? "Owner"} closes ${firstOpen?.label ?? "the open release gate"}.`;
  const nextOwner = firstOpen?.owner ?? "Review owner";
  const nextAction = firstOpen?.action ?? "Attach the verified release evidence before public sharing.";
  const releaseRule =
    status === "ready"
      ? "Cite the measured monthly value only with the packet receipt and fresh live proof audit attached."
      : `Do not cite the measured monthly value externally until ${nextOwner} completes: ${nextAction}`;
  const exportMarkdown = [
    "# First-run public value release gate",
    "",
    `Status: ${status}`,
    `Buyer: ${input.snapshot.buyer}`,
    `Release score: ${releaseScore}/100`,
    `Shareable monthly value: ${yen(shareableMonthlyValueYen)}`,
    `Locked monthly value: ${yen(lockedMonthlyValueYen)}`,
    `Release rule: ${releaseRule}`,
    `Next action: ${nextOwner} - ${nextAction}`,
    "",
    "## Gates",
    ...checks.map(releaseGateLine)
  ].join("\n");

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
    checks,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function proofLineFromLink(link: WorkflowIntakeProofSlot, row?: WorkflowLiveProofAuditRow): FirstRunReviewerPacketProofLine {
  if (row) {
    return {
      id: link.id,
      label: link.label,
      status: row.status,
      value: compactProofValue(link.value),
      href: link.href,
      evidence: row.evidence,
      action: row.action
    };
  }
  const hasValue = Boolean(link.value.trim());
  return {
    id: link.id,
    label: link.label,
    status: hasValue ? "watch" : "block",
    value: compactProofValue(link.value),
    href: link.href,
    evidence: hasValue ? "Public URL is attached, but live verification has not run." : "No buyer-facing HTTPS URL is attached.",
    action: hasValue ? "Run live proof verification before external review." : "Attach a buyer-facing HTTPS URL before external review."
  };
}

function workOrderLine(order: FirstRunRepairWorkOrder) {
  return [
    `- [${order.priority}] ${order.label}`,
    `  Owner: ${order.owner}`,
    `  Evidence: ${order.evidence}`,
    `  Action: ${order.action}`,
    `  Acceptance: ${order.acceptance}`,
    `  Input: ${order.href}`
  ].join("\n");
}

function buildFirstRunRepairRunbook(input: {
  releaseGate: FirstRunPublicValueReleaseGate;
  reviewerPacket: FirstRunReviewerPacket;
}): FirstRunRepairRunbook {
  const proofOrders = input.reviewerPacket.proofLines
    .filter((line) => line.status !== "pass")
    .map((line): FirstRunRepairWorkOrder => ({
      id: `proof-${line.id}`,
      priority: line.status === "watch" ? "next" : "now",
      owner: proofOwnerFor(line.id),
      label: line.status === "missing" ? `Attach ${line.label}` : `Repair ${line.label}`,
      evidence: line.evidence,
      action: line.action,
      acceptance: proofAcceptanceFor(line),
      href: line.href
    }));
  const firstOpenGate = input.releaseGate.checks.find((check) => check.status !== "ready");
  const releaseOrder: FirstRunRepairWorkOrder = {
    id: "release-verification",
    priority: input.releaseGate.status === "ready" ? "monitor" : "now",
    owner: input.releaseGate.status === "ready" ? "Launch owner" : input.releaseGate.nextOwner,
    label: input.releaseGate.status === "ready" ? "Keep release evidence attached" : "Rerun public value release gate",
    evidence: input.releaseGate.releaseRule,
    action: input.releaseGate.status === "ready" ? "Send the reviewer note with packet and live proof verifier links attached." : input.releaseGate.nextAction,
    acceptance:
      input.releaseGate.status === "ready"
        ? "Release score remains 100/100 and the reviewer packet stays send-ready."
        : "Release score reaches 100/100 and shareable monthly value is greater than zero.",
    href: firstOpenGate?.href ?? FIRST_RUN_SECTION_HREFS.publicValueRelease
  };
  const orders = [...proofOrders, releaseOrder];
  const nowCount = orders.filter((order) => order.priority === "now").length;
  const nextCount = orders.filter((order) => order.priority === "next").length;
  const status: HomepageFirstRunValueProofStatus = nowCount > 0 ? "blocked" : nextCount > 0 ? "attention" : "ready";
  const ownerLine = status === "ready" ? "Launch owner keeps the verified packet attached." : `${orders.find((order) => order.priority === "now")?.owner ?? input.releaseGate.nextOwner} owns the first repair.`;
  const headline = status === "ready" ? "Release watchlist is clear" : "Repair work orders are ready";
  const summary =
    status === "ready"
      ? "The live proof packet can move to review with monitoring only."
      : `${nowCount} immediate repairs and ${nextCount} follow-up checks are packaged for owner handoff.`;
  const markdown = [
    "# First-run live repair runbook",
    "",
    `Status: ${status}`,
    `Owner: ${ownerLine}`,
    `Orders: ${orders.length}`,
    `Immediate repairs: ${nowCount}`,
    `Follow-up checks: ${nextCount}`,
    "",
    "## Work orders",
    ...orders.map(workOrderLine)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    ownerLine,
    orderCount: orders.length,
    nowCount,
    nextCount,
    orders,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}

function buildFirstRunReviewerPacket(input: {
  snapshot: HomepageFirstRunValueProofCommandSnapshot;
  valueLens: HomepageValueLensSnapshot;
  liveProofAudit: WorkflowLiveProofAudit | null;
  proofLinks?: WorkflowIntakeProofSlot[];
  freshnessNowMs?: number;
}): FirstRunReviewerPacket {
  const releaseGate = buildFirstRunPublicValueReleaseGate(input);
  const liveProofRowById = new Map((input.liveProofAudit?.rows ?? []).map((row) => [row.id, row]));
  const proofLines = (input.proofLinks ?? []).map((link) => proofLineFromLink(link, liveProofRowById.get(link.id)));
  const attachedProofCount = proofLines.filter((line) => line.value !== "missing").length;
  const proofSummary = input.liveProofAudit
    ? `${input.liveProofAudit.verifiedCount}/${input.liveProofAudit.totalCount} proof links verified live`
    : `${attachedProofCount}/${Math.max(1, proofLines.length)} proof URLs attached, live check pending`;
  const label = releaseGate.status === "ready" ? "Send-ready" : releaseGate.status === "attention" ? "Needs owner check" : "Internal only";
  const headline = releaseGate.status === "ready" ? "Reviewer note is ready to send" : "Reviewer note stays internal";
  const summary =
    releaseGate.status === "ready"
      ? `${input.snapshot.buyer} gets the value claim, packet receipt, and live proof audit in one note.`
      : `This note keeps the value claim internal and gives ${releaseGate.nextOwner} the next repair.`;
  const subject =
    releaseGate.status === "ready"
      ? `${input.snapshot.buyer} value proof packet is ready`
      : `${input.snapshot.buyer} value proof packet needs proof repair`;
  const nextActionLine = `${releaseGate.nextOwner}: ${releaseGate.nextAction}`;
  const body = [
    `Subject: ${subject}`,
    "",
    `Status: ${label}`,
    `Buyer: ${input.snapshot.buyer}`,
    `Measured value: ${releaseGate.status === "ready" ? `${yen(releaseGate.shareableMonthlyValueYen)}/month shareable` : `${yen(releaseGate.lockedMonthlyValueYen)}/month remains internal`}`,
    `Release score: ${releaseGate.releaseScore}/100`,
    `Proof state: ${proofSummary}`,
    `Release rule: ${releaseGate.releaseRule}`,
    `Next action: ${nextActionLine}`,
    "",
    "Proof links",
    ...(proofLines.length > 0 ? proofLines.map((line) => `- [${line.status}] ${line.label}: ${line.value}. ${line.action}`) : ["- [block] Proof links: missing. Attach public proof URLs before review."]),
    "",
    `Packet verifier: ${input.snapshot.verifierAction.href}`
  ].join("\n");

  return {
    status: releaseGate.status,
    label,
    headline,
    summary,
    subject,
    body,
    proofSummary,
    nextActionLine,
    proofLines,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(body)}`
  };
}

function buildFirstRunSubmissionManifest(input: {
  snapshot: HomepageFirstRunValueProofCommandSnapshot;
  liveProofAudit: WorkflowLiveProofAudit | null;
  releaseGate: FirstRunPublicValueReleaseGate;
  reviewerPacket: FirstRunReviewerPacket;
  repairRunbook: FirstRunRepairRunbook;
  freshnessNowMs?: number;
}): FirstRunSubmissionManifest {
  const proofLineById = new Map(input.reviewerPacket.proofLines.map((line) => [line.id, line]));
  const proofCheck = (
    id: "deployed-url" | "protopedia-url" | "walkthrough-video",
    proofId: string,
    label: string,
    owner: string,
    fallbackAction: string,
    fallbackHref: string
  ): FirstRunSubmissionManifestCheck => {
    const line = proofLineById.get(proofId);
    const status = proofLineManifestStatus(line);
    return {
      id,
      label,
      status,
      owner,
      value: line?.value ?? "missing",
      evidence: line?.evidence ?? `${label} has not been attached to the proof intake.`,
      action: status === "ready" ? line?.action ?? `Keep ${label} attached to the public proof manifest.` : line?.action ?? fallbackAction,
      href: line?.href ?? fallbackHref
    };
  };
  const liveProofStatus = liveAuditManifestStatus(input.liveProofAudit);
  const freshnessWindow = buildFirstRunProofFreshnessWindow(input.liveProofAudit, input.freshnessNowMs);
  const checks: FirstRunSubmissionManifestCheck[] = [
    proofCheck("deployed-url", "targetUrl", "Deployed URL", "Cloud Run owner", "Attach the public Cloud Run URL before the manifest leaves the workspace.", "#homepage-proof-entry"),
    proofCheck("protopedia-url", "protopediaUrl", "ProtoPedia URL", "Publication owner", "Attach the ProtoPedia story URL before publication.", "#workflow-intake"),
    proofCheck("walkthrough-video", "videoUrl", "Walkthrough video", "Story owner", "Attach the public walkthrough video before publication.", "#workflow-intake"),
    {
      id: "reviewer-packet",
      label: "Reviewer packet",
      status: input.reviewerPacket.status,
      owner: "Launch owner",
      value: input.reviewerPacket.subject,
      evidence: input.reviewerPacket.proofSummary,
      action: input.reviewerPacket.status === "ready" ? "Attach the reviewer note to the public proof package and buyer handoff." : input.reviewerPacket.nextActionLine,
      href: FIRST_RUN_SECTION_HREFS.reviewerPacket
    },
    {
      id: "live-proof-audit",
      label: "Live proof audit",
      status: liveProofStatus,
      owner: "Proof owner",
      value: input.liveProofAudit ? `${input.liveProofAudit.verifiedCount}/${input.liveProofAudit.totalCount} proof links` : "not checked",
      evidence: input.liveProofAudit?.summary ?? "No timestamped live proof audit has been issued.",
      action: liveProofStatus === "ready" ? "Keep the timestamped live proof receipt attached." : input.liveProofAudit?.nextAction ?? "Run live proof verification before public sharing.",
      href: liveProofAuditReceiptHref(input.liveProofAudit)
    },
    {
      id: "repair-runbook",
      label: "Repair runbook",
      status: input.repairRunbook.status,
      owner: input.repairRunbook.status === "ready" ? "Launch owner" : input.repairRunbook.ownerLine.replace(/\.$/, ""),
      value: `${input.repairRunbook.nowCount} immediate repairs, ${input.repairRunbook.nextCount} follow-up checks`,
      evidence: input.repairRunbook.summary,
      action: input.repairRunbook.status === "ready" ? "Attach the runbook as the operating appendix." : "Close the live repair work orders before publishing public proof links.",
      href: FIRST_RUN_SECTION_HREFS.repairRunbook
    }
  ];
  const status = releaseWorstStatus([...checks.map((check) => check.status), freshnessWindow.status]);
  const readinessScore = Math.round(checks.reduce((sum, check) => sum + releaseStatusScore(check.status), 0) / checks.length);
  const readyCount = checks.filter((check) => check.status === "ready").length;
  const firstOpen = checks.find((check) => check.status === "blocked") ?? checks.find((check) => check.status === "attention");
  const firstOpenControl = firstOpen ?? (freshnessWindow.status !== "ready" ? freshnessWindow : undefined);
  const headline =
    status === "ready"
      ? "Global public proof manifest is publish-ready"
      : status === "attention"
        ? "Global public proof manifest needs owner review"
        : "Global public proof manifest is blocked";
  const summary =
    status === "ready"
      ? "Deployed URL, ProtoPedia, walkthrough video, reviewer packet, live audit, runbook, and freshness window are packaged together."
      : `${readyCount}/${checks.length} proof assets are ready. ${firstOpenControl?.owner ?? "Launch owner"} owns: ${firstOpenControl?.action ?? input.releaseGate.nextAction}`;
  const nextOwner = firstOpenControl?.owner ?? "Launch owner";
  const nextAction = firstOpenControl?.action ?? "Publish with the current reviewer packet and live proof audit attached.";
  const markdown = [
    "# First-run global public proof manifest",
    "",
    `Status: ${status}`,
    `Buyer: ${input.snapshot.buyer}`,
    `Readiness score: ${readinessScore}/100`,
    `Assets ready: ${readyCount}/${checks.length}`,
    `Public value release: ${input.releaseGate.label}`,
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`,
    "",
    "## Proof freshness window",
    `Status: ${freshnessWindow.status}`,
    `Label: ${freshnessWindow.label}`,
    `Checked at: ${freshnessWindow.checkedAt}`,
    `Recheck before: ${freshnessWindow.expiresAt}`,
    `Receipt: ${freshnessWindow.receiptLine}`,
    `Rule: ${freshnessWindow.rule}`,
    `Action: ${freshnessWindow.action}`,
    "",
    "## Public proof checks",
    ...checks.map(submissionManifestLine)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    readinessScore,
    readyCount,
    checkTotal: checks.length,
    nextOwner,
    nextAction,
    freshnessWindow,
    checks,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}

function buildFirstRunExternalDecisionPacket(input: {
  snapshot: HomepageFirstRunValueProofCommandSnapshot;
  releaseGate: FirstRunPublicValueReleaseGate;
  reviewerPacket: FirstRunReviewerPacket;
  submissionManifest: FirstRunSubmissionManifest;
  liveProofAudit: WorkflowLiveProofAudit | null;
}): FirstRunExternalDecisionPacket {
  const status = releaseWorstStatus([input.releaseGate.status, input.submissionManifest.status]);
  const blockers = input.submissionManifest.checks.filter((check) => check.status !== "ready").slice(0, 3);
  const artifactCount = 3 + (input.liveProofAudit ? 1 : 0);
  const label = status === "ready" ? "Send-ready" : status === "attention" ? "Needs owner review" : "Internal only";
  const recipient = status === "ready" ? input.snapshot.buyer : input.submissionManifest.nextOwner;
  const safeValueLine =
    input.releaseGate.status === "ready"
      ? `${yen(input.releaseGate.shareableMonthlyValueYen)}/month can be cited with proof receipts.`
      : `${yen(input.releaseGate.lockedMonthlyValueYen)}/month cannot be cited externally yet.`;
  const headline = status === "ready" ? "External decision packet is ready" : "External decision packet stays internal";
  const summary =
    status === "ready"
      ? `${recipient} gets the value claim, reviewer note, manifest, and audit evidence in one packet.`
      : `${recipient} gets a repair-specific packet before any public value claim leaves the workspace.`;
  const sendRule =
    status === "ready"
      ? "Send the packet with reviewer note, public proof manifest, live proof audit, and receipt verifier link attached."
      : `Hold external send. ${input.submissionManifest.nextOwner} must complete: ${input.submissionManifest.nextAction}`;
  const nextAsk =
    status === "ready"
      ? "Ask the reviewer to confirm the buyer acceptance path and attach this packet to the public proof package."
      : input.submissionManifest.nextAction;
  const body = [
    `Subject: ${input.reviewerPacket.subject}`,
    "",
    "# First-run external decision packet",
    "",
    `Status: ${status}`,
    `Recipient: ${recipient}`,
    `Safe value claim: ${safeValueLine}`,
    `Readiness: ${input.submissionManifest.readyCount}/${input.submissionManifest.checkTotal} assets, ${input.submissionManifest.readinessScore}/100`,
    `Release rule: ${input.releaseGate.releaseRule}`,
    `Send rule: ${sendRule}`,
    `Next ask: ${nextAsk}`,
    "",
    "## Attached artifacts",
    `- Reviewer note: ${input.reviewerPacket.label}`,
    `- Public proof manifest: ${input.submissionManifest.status}`,
    `- Public value release memo: ${input.releaseGate.label}`,
    input.liveProofAudit ? `- Live proof audit: ${input.liveProofAudit.receiptId}` : "- Live proof audit: not issued",
    "",
    "## Open blockers",
    ...(blockers.length > 0 ? blockers.map(decisionPacketBlockerLine) : ["- None. Keep receipts fresh until review."])
  ].join("\n");

  return {
    status,
    label,
    headline,
    summary,
    recipient,
    safeValueLine,
    sendRule,
    nextAsk,
    blockers,
    artifactCount,
    body,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(body)}`
  };
}

function buildFirstRunPublicRepairPayoff(input: {
  snapshot: HomepageFirstRunValueProofCommandSnapshot;
  releaseGate: FirstRunPublicValueReleaseGate;
  submissionManifest: FirstRunSubmissionManifest;
  proofRepairProjection?: BuyerProofRepairProjection;
}): FirstRunPublicRepairPayoff {
  const blockers = input.submissionManifest.checks.filter((check) => check.status !== "ready");
  const status =
    input.proofRepairProjection?.publicShareLock.status === "locked"
      ? "blocked"
      : releaseWorstStatus([input.releaseGate.status, input.submissionManifest.status]);
  const workOrderHrefById = new Map((input.proofRepairProjection?.workOrderPacket.workOrders ?? []).map((order) => [order.id, order.inputHref]));
  const projectionActions =
    input.proofRepairProjection?.requiredReplacements.slice(0, 3).map(
      (item): FirstRunPublicRepairPayoffAction => ({
        id: `replacement-${item.id}`,
        status: proofRepairProjectionStatus(item.afterStatus),
        label: item.label,
        owner: item.owner,
        value: `${item.remainingDecisionLift} decision-lift points still need buyer-owned proof`,
        action: item.replacementTarget,
        acceptance: item.acceptanceCriteria,
        href: workOrderHrefById.get(item.id) ?? input.proofRepairProjection?.operatorBrief.firstInputHref ?? "#buyer-proof-intake"
      })
    ) ?? [];
  const fallbackActions = blockers.slice(0, 3).map(
    (check): FirstRunPublicRepairPayoffAction => ({
      id: `manifest-${check.id}`,
      status: check.status,
      label: check.label,
      owner: check.owner,
      value: check.value,
      action: check.action,
      acceptance: `${check.label} changes to ready in the public proof manifest.`,
      href: check.href
    })
  );
  const readyAction: FirstRunPublicRepairPayoffAction = {
    id: "release-ready",
    status: "ready",
    label: "Public value claim",
    owner: "Launch owner",
    value: `${yen(input.releaseGate.shareableMonthlyValueYen)}/month shareable`,
    action: "Keep reviewer packet, public proof manifest, and live proof receipts attached.",
    acceptance: "External reviewers can open the attached receipts without private credentials.",
    href: FIRST_RUN_SECTION_HREFS.publicValueRelease
  };
  const actions: FirstRunPublicRepairPayoffAction[] =
    projectionActions.length > 0
      ? projectionActions
      : fallbackActions.length > 0
        ? fallbackActions
        : [readyAction];
  const lockedMonthlyValueYen = input.releaseGate.lockedMonthlyValueYen;
  const gateLine =
    status === "ready"
      ? `${yen(input.releaseGate.shareableMonthlyValueYen)}/month can leave the workspace with receipts attached.`
      : `${blockers.length} public gates still block external value.`;
  const recoveryLine = input.proofRepairProjection
    ? input.proofRepairProjection.closedByAvailableFixes > 0
      ? `${input.proofRepairProjection.closedByAvailableFixes} proof gaps can close now; ${input.proofRepairProjection.remainingDecisionLift} decision-lift points still need buyer-owned proof.`
      : `${input.proofRepairProjection.remainingDecisionLift} decision-lift points still need buyer-owned proof before public sharing.`
    : status === "ready"
      ? "No repair is required before external review."
      : `${blockers.length} publish blockers must close before the value claim leaves the workspace.`;
  const nextAction =
    input.proofRepairProjection?.publicShareLock.nextTask
      ? `${input.proofRepairProjection.publicShareLock.nextTask.owner}: ${input.proofRepairProjection.publicShareLock.nextTask.replacementTarget}`
      : `${input.submissionManifest.nextOwner}: ${input.submissionManifest.nextAction}`;
  const headline =
    status === "ready" ? `${yen(input.releaseGate.shareableMonthlyValueYen)}/month is cleared for external review` : `${yen(lockedMonthlyValueYen)}/month is waiting on proof repair`;
  const summary =
    status === "ready"
      ? `${input.snapshot.buyer} can see the measured value with the reviewer packet, public proof manifest, and proof audit attached.`
      : input.proofRepairProjection
        ? `${input.proofRepairProjection.publicShareLock.summary} ${input.proofRepairProjection.nextActionAfterApply}`
        : `${gateLine} ${input.submissionManifest.nextOwner} owns: ${input.submissionManifest.nextAction}`;
  const markdown = [
    "# First-run public repair payoff",
    "",
    `Status: ${status}`,
    `Buyer: ${input.snapshot.buyer}`,
    `Locked monthly value: ${yen(lockedMonthlyValueYen)}`,
    `Readiness: ${input.submissionManifest.readyCount}/${input.submissionManifest.checkTotal} assets, ${input.submissionManifest.readinessScore}/100`,
    `Gate line: ${gateLine}`,
    `Repair payoff: ${recoveryLine}`,
    `Next action: ${nextAction}`,
    "",
    "## Repair actions",
    ...actions.map(repairPayoffActionLine)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    lockedMonthlyValueYen,
    gateLine,
    recoveryLine,
    nextAction,
    actions,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}

function buildFirstRunRepairImpactSimulation(input: {
  releaseGate: FirstRunPublicValueReleaseGate;
  submissionManifest: FirstRunSubmissionManifest;
  selectedRepairIds: string[];
}): FirstRunRepairImpactSimulation {
  const selectedIds = new Set(input.selectedRepairIds);
  const openChecks = input.submissionManifest.checks.filter((check) => check.status !== "ready");
  const actions = openChecks.map(
    (check): FirstRunRepairImpactSimulationAction => ({
      id: check.id,
      status: check.status,
      label: check.label,
      owner: check.owner,
      value: check.value,
      evidence: check.evidence,
      action: check.action,
      href: check.href,
      selected: selectedIds.has(check.id)
    })
  );
  const selectedCount = actions.filter((action) => action.selected).length;
  const actionCount = actions.length;
  const projectedChecks = input.submissionManifest.checks.map((check) => (selectedIds.has(check.id) ? { ...check, status: "ready" as const } : check));
  const projectedReadyCount = projectedChecks.filter((check) => check.status === "ready").length;
  const projectedReadinessScore = Math.round(projectedChecks.reduce((sum, check) => sum + releaseStatusScore(check.status), 0) / Math.max(1, projectedChecks.length));
  const remainingBlockerCount = actions.length - selectedCount;
  const measuredMonthlyValueYen = input.releaseGate.shareableMonthlyValueYen + input.releaseGate.lockedMonthlyValueYen;
  const projectedStatus: HomepageFirstRunValueProofStatus =
    remainingBlockerCount === 0 ? "ready" : selectedCount > 0 ? "attention" : input.submissionManifest.status;
  const projectedShareableMonthlyValueYen = projectedStatus === "ready" ? measuredMonthlyValueYen : input.releaseGate.shareableMonthlyValueYen;
  const projectedLockedMonthlyValueYen = Math.max(0, measuredMonthlyValueYen - projectedShareableMonthlyValueYen);
  const nextOpenAction = actions.find((action) => !action.selected);
  const planActions = actions
    .map((action, index) => ({ action, index }))
    .sort((left, right) => Number(left.action.selected) - Number(right.action.selected) || releaseStatusScore(left.action.status) - releaseStatusScore(right.action.status) || left.index - right.index)
    .map(({ action }) => action);
  const acceptanceItems = planActions.map((action, index): FirstRunRepairImpactAcceptanceItem => {
    const remainingAfterThis = Math.max(0, actionCount - index - 1);
    const phase = action.selected ? "Simulated" : index === 0 ? "Close first" : "Then close";
    const valueEffect = action.selected
      ? "This gate is already included in the simulated release path."
      : remainingAfterThis === 0
        ? `${yen(input.releaseGate.lockedMonthlyValueYen)}/month can move into the external decision packet after this final gate closes.`
        : `${yen(input.releaseGate.lockedMonthlyValueYen)}/month stays locked until this and ${remainingAfterThis} later gate${remainingAfterThis === 1 ? "" : "s"} close.`;
    return {
      id: action.id,
      sequence: index + 1,
      status: action.status,
      phase,
      label: action.label,
      owner: action.owner,
      acceptance: `${action.label} changes to ready in the global public proof manifest.`,
      valueEffect,
      href: action.href,
      selected: action.selected
    };
  });
  const headline =
    actionCount === 0
      ? `${yen(measuredMonthlyValueYen)}/month already has no simulated blockers`
      : projectedStatus === "ready"
        ? `${yen(measuredMonthlyValueYen)}/month becomes externally shareable in this simulation`
        : selectedCount > 0
          ? `${selectedCount}/${actionCount} repairs move the public proof manifest toward release`
          : "Choose repairs to see value unlock";
  const summary =
    actionCount === 0
      ? "The public proof manifest is already ready, so the simulation stays in monitoring mode."
      : projectedStatus === "ready"
        ? "All open gates are simulated as closed, so the measured value can move into the external decision packet."
        : `${projectedReadyCount}/${input.submissionManifest.checkTotal} assets would be ready. ${remainingBlockerCount} gates still hold public value.`;
  const decisionLine =
    projectedStatus === "ready"
      ? "External packet can move to buyer decision rehearsal."
      : selectedCount > 0
        ? `${remainingBlockerCount} gates still keep the acceptance path internal.`
        : "External packet stays internal until at least one repair is selected.";
  const nextAction = nextOpenAction ? `${nextOpenAction.owner}: ${nextOpenAction.action}` : "Send reviewer packet, public proof manifest, repair payoff, and decision rehearsal together.";
  const acceptanceHeadline =
    actionCount === 0
      ? "Public proof contract is already closed"
      : projectedStatus === "ready"
        ? "All selected repairs close the public value contract"
        : selectedCount > 0
          ? `${remainingBlockerCount} acceptance checks still block public sharing`
          : "Close the public proof contract in order";
  const acceptanceSummary =
    actionCount === 0
      ? "No repair acceptance work remains; keep the proof freshness window current."
      : projectedStatus === "ready"
        ? `${yen(measuredMonthlyValueYen)}/month can be rehearsed as externally shareable once the selected repairs are completed and receipts are reissued.`
        : `${yen(input.releaseGate.lockedMonthlyValueYen)}/month stays internal until ${remainingBlockerCount} gate${remainingBlockerCount === 1 ? "" : "s"} pass with receipts attached.`;
  const markdown = [
    "# First-run repair impact simulation",
    "",
    `Status: ${projectedStatus}`,
    `Repairs simulated: ${selectedCount}/${actionCount}`,
    `Readiness: ${input.submissionManifest.readyCount}/${input.submissionManifest.checkTotal} -> ${projectedReadyCount}/${input.submissionManifest.checkTotal}`,
    `Readiness score: ${input.submissionManifest.readinessScore}/100 -> ${projectedReadinessScore}/100`,
    `Shareable monthly value after simulation: ${yen(projectedShareableMonthlyValueYen)}`,
    `Locked monthly value after simulation: ${yen(projectedLockedMonthlyValueYen)}`,
    `Decision path: ${decisionLine}`,
    `Next action: ${nextAction}`,
    "",
    "## Acceptance plan",
    `Headline: ${acceptanceHeadline}`,
    acceptanceSummary,
    ...acceptanceItems.map(repairImpactAcceptanceLine),
    "",
    "## Simulated repairs",
    ...(actions.length > 0 ? actions.map(repairImpactSimulationActionLine) : ["- No open repair gates. Keep receipts fresh until review."])
  ].join("\n");

  return {
    status: projectedStatus,
    headline,
    summary,
    acceptanceHeadline,
    acceptanceSummary,
    selectedCount,
    actionCount,
    currentReadyCount: input.submissionManifest.readyCount,
    projectedReadyCount,
    checkTotal: input.submissionManifest.checkTotal,
    currentReadinessScore: input.submissionManifest.readinessScore,
    projectedReadinessScore,
    projectedShareableMonthlyValueYen,
    projectedLockedMonthlyValueYen,
    remainingBlockerCount,
    decisionLine,
    nextAction,
    actions,
    acceptanceItems,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}

function buildFirstRunBuyerMeetingBrief(input: {
  snapshot: HomepageFirstRunValueProofCommandSnapshot;
  valueLens: HomepageValueLensSnapshot;
  reviewerPacket: FirstRunReviewerPacket;
  publicValueReleaseGate: FirstRunPublicValueReleaseGate;
  buyerDecisionRehearsal: FirstRunBuyerDecisionRehearsal;
}): FirstRunBuyerMeetingBrief {
  const rawStatus = releaseWorstStatus([
    input.snapshot.status,
    input.valueLens.status,
    input.reviewerPacket.status,
    input.publicValueReleaseGate.status,
    input.buyerDecisionRehearsal.status
  ]);
  const status =
    rawStatus === "blocked" && input.snapshot.status === "ready" && input.valueLens.status === "ready"
      ? "attention"
      : rawStatus;
  const receiptCheck = input.snapshot.checks.find((check) => check.id === "buyer-packet");
  const decisionRoute = input.buyerDecisionRehearsal.routes.find((route) => route.id === "acceptance-path");
  const label = status === "ready" ? "Ready to run" : status === "attention" ? "Review only" : "Internal only";
  const headline =
    status === "ready"
      ? "Buyer meeting can end in a pilot decision"
      : status === "attention"
        ? "Buyer meeting should stay in proof review"
        : "Keep the buyer meeting internal";
  const decisionAsk =
    status === "ready"
      ? `Ask ${input.snapshot.buyer} to inspect the receipts and approve a bounded pilot.`
      : status === "attention"
        ? `Ask ${input.snapshot.buyer} to review proof gaps before any pilot approval.`
        : `Do not ask ${input.snapshot.buyer} for approval until the proof blocker is closed.`;
  const meetingGoal =
    status === "ready"
      ? "Leave with continue, revise, or hold recorded against the packet receipt."
      : "Leave with the next proof owner and no external approval request.";
  const stopRule =
    status === "ready"
      ? input.buyerDecisionRehearsal.guardrail
      : input.publicValueReleaseGate.releaseRule;
  const agenda: FirstRunBuyerMeetingBriefAgendaItem[] = [
    {
      id: "value-case",
      status: input.valueLens.status,
      label: "Value case",
      owner: input.snapshot.buyer,
      question: `Is ${yen(input.valueLens.measuredMonthlyValueYen)}/month measured support enough to open a pilot?`,
      evidence: `${input.valueLens.measuredSupportPercent}% measured support, ${input.valueLens.paybackDays}-day payback, ${input.valueLens.receipt.receiptId}.`,
      exitCriteria: input.valueLens.status === "ready" ? "Buyer accepts the value receipt as meeting evidence." : input.valueLens.readinessCoach.nextMove,
      href: input.valueLens.primaryAction.href
    },
    {
      id: "receipt-check",
      status: receiptCheck?.status ?? input.snapshot.status,
      label: "Receipt check",
      owner: "Review owner",
      question: "Can the buyer verify the packet without private access?",
      evidence: `${input.snapshot.receipts[0]?.receiptId ?? "Value receipt"} and ${input.snapshot.receipts[1]?.receiptId ?? "packet receipt"} attached.`,
      exitCriteria: input.reviewerPacket.status === "ready" ? "Verifier opens from the packet and proof links stay public." : input.reviewerPacket.nextActionLine,
      href: input.snapshot.verifierAction.href
    },
    {
      id: "pilot-decision",
      status: decisionRoute?.status ?? input.buyerDecisionRehearsal.status,
      label: "Pilot decision",
      owner: input.snapshot.buyer,
      question: `Should the first decision be ${input.buyerDecisionRehearsal.recommendedDecision}?`,
      evidence: decisionRoute?.evidence ?? input.buyerDecisionRehearsal.guardrail,
      exitCriteria: decisionRoute?.action ?? input.buyerDecisionRehearsal.nextAction,
      href: decisionRoute?.href ?? input.snapshot.primaryAction.href
    }
  ];
  const markdown = [
    "# First buyer meeting brief",
    "",
    `Status: ${status}`,
    `Buyer: ${input.snapshot.buyer}`,
    `Decision ask: ${decisionAsk}`,
    `Meeting goal: ${meetingGoal}`,
    `Stop rule: ${stopRule}`,
    "",
    "## Agenda",
    ...agenda.map(buyerMeetingBriefAgendaLine)
  ].join("\n");

  return {
    status,
    label,
    headline,
    decisionAsk,
    meetingGoal,
    stopRule,
    agenda,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}

function buildFirstRunBuyerDecisionRehearsal(input: {
  proofEntry: HomepageProofEntrySnapshot;
  reviewerPacket: FirstRunReviewerPacket;
  submissionManifest: FirstRunSubmissionManifest;
  externalDecisionPacket: FirstRunExternalDecisionPacket;
  publicRepairPayoff: FirstRunPublicRepairPayoff;
}): FirstRunBuyerDecisionRehearsal {
  const status = releaseWorstStatus([input.proofEntry.status, input.submissionManifest.status, input.externalDecisionPacket.status]);
  const recommendedDecision = input.proofEntry.decisionHandoff.recommendedDecision;
  const routeStatus = status === "ready" ? "ready" : recommendedDecision === "stop" ? "blocked" : "attention";
  const decisionReceiptStatus: HomepageFirstRunValueProofStatus = recommendedDecision === "continue" && status !== "ready" ? "attention" : "ready";
  const routes: FirstRunBuyerDecisionRehearsalRoute[] = [
    {
      id: "review-kit",
      status: input.reviewerPacket.status,
      label: input.proofEntry.decisionHandoff.reviewKit.label,
      value: input.reviewerPacket.label,
      evidence: input.reviewerPacket.proofSummary,
      action: input.reviewerPacket.status === "ready" ? "Open the review kit with value, proof, and handoff attached." : input.reviewerPacket.nextActionLine,
      href: input.proofEntry.decisionHandoff.reviewKit.href
    },
    {
      id: "decision-receipt",
      status: decisionReceiptStatus,
      label: input.proofEntry.decisionHandoff.decisionReceipt.label,
      value: `Recommended decision: ${recommendedDecision}`,
      evidence: input.proofEntry.decisionHandoff.headline,
      action:
        recommendedDecision === "continue"
          ? "Record continue only when the external packet is send-ready."
          : recommendedDecision === "revise"
            ? "Record revise before buyer delivery and attach the owner repair."
            : "Record stop while the public value claim is blocked.",
      href: input.proofEntry.decisionHandoff.decisionReceipt.href
    },
    {
      id: "acceptance-path",
      status: routeStatus,
      label: input.proofEntry.decisionHandoff.acceptancePath.label,
      value: status === "ready" ? "Buyer can accept from the proof path" : input.publicRepairPayoff.recoveryLine,
      evidence: input.proofEntry.decisionHandoff.guardrail,
      action: status === "ready" ? "Ask the buyer to inspect the acceptance path and record a bounded pilot decision." : input.publicRepairPayoff.nextAction,
      href: input.proofEntry.decisionHandoff.acceptancePath.href
    }
  ];
  const readyCount = routes.filter((route) => route.status === "ready").length;
  const headline =
    recommendedDecision === "continue" && status === "ready"
      ? "Buyer can rehearse the continue decision"
      : recommendedDecision === "revise"
        ? "Buyer decision needs sponsor revision first"
        : "Buyer decision is held before external sharing";
  const summary =
    status === "ready"
      ? `${input.proofEntry.buyer} can move from review kit to decision receipt to acceptance path without another walkthrough.`
      : `${readyCount}/${routes.length} decision routes are usable now. The acceptance path stays internal until ${input.submissionManifest.nextOwner} closes the next proof move.`;
  const sendRule =
    status === "ready"
      ? "Send the review kit, decision receipt, and acceptance path together."
      : `Do not send the acceptance path externally. ${input.externalDecisionPacket.sendRule}`;
  const nextAction = status === "ready" ? input.externalDecisionPacket.nextAsk : input.publicRepairPayoff.nextAction;
  const markdown = [
    "# First-run buyer decision rehearsal",
    "",
    `Status: ${status}`,
    `Buyer: ${input.proofEntry.buyer}`,
    `Recommended decision: ${recommendedDecision}`,
    `Routes ready: ${readyCount}/${routes.length}`,
    `Guardrail: ${input.proofEntry.decisionHandoff.guardrail}`,
    `Send rule: ${sendRule}`,
    `Next action: ${nextAction}`,
    "",
    "## Decision routes",
    ...routes.map(decisionRehearsalRouteLine)
  ].join("\n");

  return {
    status,
    headline,
    summary,
    recommendedDecision,
    guardrail: input.proofEntry.decisionHandoff.guardrail,
    sendRule,
    nextAction,
    routes,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}

function buildFirstRunBuyerFollowUp(input: {
  snapshot: HomepageFirstRunValueProofCommandSnapshot;
  reviewerPacket: FirstRunReviewerPacket;
  repairRunbook: FirstRunRepairRunbook;
  submissionManifest: FirstRunSubmissionManifest;
  buyerMeetingBrief: FirstRunBuyerMeetingBrief;
  buyerDecisionRehearsal: FirstRunBuyerDecisionRehearsal;
}): FirstRunBuyerFollowUp {
  const status = releaseWorstStatus([input.buyerMeetingBrief.status, input.reviewerPacket.status, input.submissionManifest.status, input.buyerDecisionRehearsal.status]);
  const firstRepair = input.repairRunbook.orders.find((order) => order.priority === "now") ?? input.repairRunbook.orders[0];
  const decisionRoute = input.buyerDecisionRehearsal.routes.find((route) => route.id === "acceptance-path") ?? input.buyerDecisionRehearsal.routes[0];
  const recipient =
    status === "ready"
      ? input.snapshot.buyer
      : firstRepair?.owner ?? input.submissionManifest.nextOwner;
  const label = status === "ready" ? "Buyer send" : status === "attention" ? "Review follow-up" : "Repair follow-up";
  const headline =
    status === "ready"
      ? "Buyer follow-up is ready to send"
      : status === "attention"
        ? "Send a proof review note before the buyer ask"
        : "Send the repair request before buyer follow-up";
  const subject =
    status === "ready"
      ? `${input.snapshot.buyer} pilot proof is ready for review`
      : `${input.snapshot.buyer} proof repair needed before buyer follow-up`;
  const opening =
    status === "ready"
      ? `The first buyer meeting can use the value receipt, reviewer packet, and decision route as live evidence.`
      : `Do not send the buyer ask yet. ${recipient} owns the next repair before external sharing.`;
  const nextAsk =
    status === "ready"
      ? input.buyerMeetingBrief.decisionAsk
      : firstRepair
        ? `${recipient}: ${firstRepair.action}`
        : `${input.submissionManifest.nextOwner}: ${input.submissionManifest.nextAction}`;
  const safetyLine =
    status === "ready"
      ? input.buyerDecisionRehearsal.sendRule
      : input.buyerMeetingBrief.stopRule;
  const freshnessWindow = input.submissionManifest.freshnessWindow;
  const attachments: FirstRunBuyerFollowUpAttachment[] = [
    {
      id: "reviewer-packet",
      status: input.reviewerPacket.status,
      label: "Reviewer packet",
      owner: "Launch owner",
      evidence: input.reviewerPacket.proofSummary,
      action: input.reviewerPacket.status === "ready" ? "Attach the reviewer packet to the buyer thread." : input.reviewerPacket.nextActionLine,
      href: FIRST_RUN_SECTION_HREFS.reviewerPacket
    },
    {
      id: "public-manifest",
      status: input.submissionManifest.status,
      label: "Public proof manifest",
      owner: input.submissionManifest.nextOwner,
      evidence: `${input.submissionManifest.readyCount}/${input.submissionManifest.checkTotal} proof assets ready.`,
      action: input.submissionManifest.status === "ready" ? "Attach the manifest and keep the evidence links public." : input.submissionManifest.nextAction,
      href: FIRST_RUN_SECTION_HREFS.submissionManifest
    },
    {
      id: "decision-route",
      status: decisionRoute?.status ?? input.buyerDecisionRehearsal.status,
      label: "Decision route",
      owner: input.snapshot.buyer,
      evidence: decisionRoute?.evidence ?? input.buyerDecisionRehearsal.guardrail,
      action: decisionRoute?.action ?? input.buyerDecisionRehearsal.nextAction,
      href: decisionRoute?.href ?? FIRST_RUN_SECTION_HREFS.buyerDecisionRehearsal
    },
    {
      id: "fresh-live-proof",
      status: freshnessWindow.status,
      label: "Fresh live proof",
      owner: freshnessWindow.owner,
      evidence: `${freshnessWindow.label}. Checked ${freshnessWindow.checkedAt}; recheck before ${freshnessWindow.expiresAt}.`,
      action: freshnessWindow.action,
      href: FIRST_RUN_SECTION_HREFS.submissionManifest
    }
  ];
  const readyAttachmentCount = attachments.filter((attachment) => attachment.status === "ready").length;
  const attachmentRule =
    status === "ready" && readyAttachmentCount === attachments.length
      ? "Send the buyer follow-up only with reviewer packet, public manifest, decision route, and fresh live proof attached."
      : `Keep the follow-up internal: ${readyAttachmentCount}/${attachments.length} attachments are send-ready, and ${recipient} owns ${nextAsk}.`;
  const steps: FirstRunBuyerFollowUpStep[] = [
    {
      id: "proof-state",
      status: input.reviewerPacket.status,
      label: "Proof state",
      owner: status === "ready" ? "Launch owner" : recipient,
      instruction: status === "ready" ? "Attach the reviewer note and keep the live proof verifier in the thread." : nextAsk,
      evidence: input.reviewerPacket.proofSummary,
      href: FIRST_RUN_SECTION_HREFS.reviewerPacket
    },
    {
      id: "meeting-ask",
      status: input.buyerMeetingBrief.status,
      label: "Meeting ask",
      owner: input.snapshot.buyer,
      instruction: input.buyerMeetingBrief.decisionAsk,
      evidence: input.buyerMeetingBrief.meetingGoal,
      href: FIRST_RUN_SECTION_HREFS.buyerMeetingBrief
    },
    {
      id: "decision-record",
      status: decisionRoute?.status ?? input.buyerDecisionRehearsal.status,
      label: "Decision record",
      owner: input.snapshot.buyer,
      instruction: decisionRoute?.action ?? input.buyerDecisionRehearsal.nextAction,
      evidence: decisionRoute?.evidence ?? input.buyerDecisionRehearsal.guardrail,
      href: decisionRoute?.href ?? FIRST_RUN_SECTION_HREFS.buyerDecisionRehearsal
    }
  ];
  const body = [
    `Subject: ${subject}`,
    "",
    `To: ${recipient}`,
    `Status: ${status}`,
    "",
    opening,
    "",
    `Next ask: ${nextAsk}`,
    `Safety line: ${safetyLine}`,
    `Attachment rule: ${attachmentRule}`,
    "",
    "Attachment contract",
    ...attachments.map(buyerFollowUpAttachmentLine),
    "",
    "Follow-up steps",
    ...steps.map(buyerFollowUpStepLine)
  ].join("\n");

  return {
    status,
    label,
    headline,
    recipient,
    subject,
    opening,
    nextAsk,
    safetyLine,
    attachmentRule,
    body,
    steps,
    attachments,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(body)}`
  };
}

function buildFirstRunProofCloseout(input: {
  releaseGate: FirstRunPublicValueReleaseGate;
  liveProofAudit: WorkflowLiveProofAudit | null;
  proofRepairLinks: WorkflowIntakeProofSlot[];
  proofVerifyStatus: FirstRunProofVerifyStatus;
}): FirstRunProofCloseout {
  const rowById = new Map((input.liveProofAudit?.rows ?? []).map((row) => [row.id, row]));
  const firstOpenLink =
    input.proofRepairLinks.find((link) => rowById.get(link.id)?.status !== "pass") ??
    input.proofRepairLinks[0];
  const targetRow = firstOpenLink ? rowById.get(firstOpenLink.id) : input.liveProofAudit?.rows.find((row) => row.status !== "pass");
  const targetId = firstOpenLink?.id ?? targetRow?.id ?? "public-proof";
  const targetLabel = firstOpenLink?.label ?? targetRow?.label ?? "Public proof URL";
  const targetValue = compactProofValue(firstOpenLink?.value ?? targetRow?.url ?? "");
  const owner = proofOwnerFor(targetId);
  const targetStatus = proofCloseoutRowStatus(targetRow, firstOpenLink);
  const status =
    input.releaseGate.status === "ready" && targetStatus === "ready"
      ? "ready"
      : targetStatus === "ready"
        ? "attention"
        : targetStatus;
  const inputHref = firstOpenLink ? `#first-run-proof-input-${firstOpenLink.id}` : "#launch-evidence-console";
  const label = status === "ready" ? "Closeout clear" : status === "attention" ? "Check attached" : "Proof blocker";
  const headline =
    status === "ready"
      ? "Proof closeout can release the buyer packet"
      : status === "attention"
        ? "Run the live check to clear proof closeout"
        : `Close ${targetLabel} before buyer sharing`;
  const summary =
    status === "ready"
      ? `${input.releaseGate.label}: ${yen(input.releaseGate.shareableMonthlyValueYen)}/month can be cited with receipts attached.`
      : status === "attention"
        ? `${targetLabel} has a URL, but it needs a fresh live pass before the buyer packet leaves the workspace.`
        : `${targetLabel} is blocking ${yen(input.releaseGate.lockedMonthlyValueYen)}/month from external use.`;
  const acceptanceLine =
    status === "ready"
      ? "Release score stays 100/100 and reviewer packet stays send-ready."
      : targetRow?.status === "watch"
        ? `${targetLabel} returns pass on the next live proof check.`
        : `${targetLabel} has a buyer-facing HTTPS URL and the live audit no longer reports it as blocked.`;
  const valueUnlockLine =
    status === "ready"
      ? `${yen(input.releaseGate.shareableMonthlyValueYen)}/month is already shareable.`
      : `Close this proof to move ${yen(input.releaseGate.lockedMonthlyValueYen)}/month toward the external decision packet.`;
  const runCheckStatus: HomepageFirstRunValueProofStatus =
    input.liveProofAudit?.status === "verified"
      ? "ready"
      : input.proofVerifyStatus === "checking"
        ? "attention"
        : "blocked";
  const steps: FirstRunProofCloseoutStep[] = [
    {
      id: "paste-url",
      status: targetStatus,
      label: "Paste public URL",
      owner,
      instruction:
        targetStatus === "ready"
          ? `Keep ${targetLabel} attached.`
          : firstOpenLink?.value.trim()
            ? `Replace ${targetLabel} with a buyer-facing HTTPS URL if this one is not public.`
            : `Paste a buyer-facing HTTPS URL for ${targetLabel}.`,
      acceptance: targetStatus === "ready" ? `${targetLabel} is attached and live-checked.` : acceptanceLine,
      href: inputHref
    },
    {
      id: "run-check",
      status: runCheckStatus,
      label: "Run live check",
      owner: "Proof owner",
      instruction: input.proofVerifyStatus === "checking" ? "Wait for the live check to finish." : "Run the live proof check from this panel.",
      acceptance: input.liveProofAudit?.status === "verified" ? "All proof links passed the latest live audit." : "Live proof audit status changes to verified.",
      href: liveProofAuditReceiptHref(input.liveProofAudit)
    },
    {
      id: "release-value",
      status: input.releaseGate.status,
      label: "Release value",
      owner: input.releaseGate.nextOwner,
      instruction:
        input.releaseGate.status === "ready"
          ? "Attach the public value release memo to the reviewer packet."
          : input.releaseGate.releaseRule,
      acceptance: "Shareable monthly value is greater than zero and release score reaches 100/100.",
      href: FIRST_RUN_SECTION_HREFS.publicValueRelease
    }
  ];
  const markdown = [
    "# First-run proof closeout",
    "",
    `Status: ${status}`,
    `Target: ${targetLabel}`,
    `Owner: ${owner}`,
    `Current value: ${targetValue}`,
    `Acceptance: ${acceptanceLine}`,
    `Value unlock: ${valueUnlockLine}`,
    "",
    "## Closeout steps",
    ...steps.map(proofCloseoutStepLine)
  ].join("\n");

  return {
    status,
    label,
    headline,
    summary,
    owner,
    targetLabel,
    targetValue,
    acceptanceLine,
    valueUnlockLine,
    inputHref,
    steps,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}

function buildFirstRunCriticalPath(input: {
  snapshot: HomepageFirstRunValueProofCommandSnapshot;
  proofCloseout: FirstRunProofCloseout;
  releaseGate: FirstRunPublicValueReleaseGate;
  externalDecisionPacket: FirstRunExternalDecisionPacket;
  buyerFollowUp: FirstRunBuyerFollowUp;
}): FirstRunCriticalPath {
  const proofStep = input.proofCloseout.steps.find((step) => step.status !== "ready") ?? input.proofCloseout.steps[0];
  const steps: FirstRunCriticalPathStep[] = [
    {
      id: "proof-closeout",
      status: input.proofCloseout.status,
      label: "Proof closeout",
      owner: input.proofCloseout.owner,
      evidence: `${input.proofCloseout.targetLabel}: ${input.proofCloseout.targetValue}. ${input.proofCloseout.acceptanceLine}`,
      action: input.proofCloseout.status === "ready" ? "Keep proof attached to the reviewer packet." : proofStep?.instruction ?? input.proofCloseout.valueUnlockLine,
      href: input.proofCloseout.inputHref
    },
    {
      id: "value-release",
      status: input.releaseGate.status,
      label: "Value release",
      owner: input.releaseGate.nextOwner,
      evidence: `${input.releaseGate.releaseScore}/100 release score, ${yen(input.releaseGate.shareableMonthlyValueYen)} shareable, ${yen(input.releaseGate.lockedMonthlyValueYen)} locked.`,
      action: input.releaseGate.status === "ready" ? "Attach the public value release memo to the external packet." : input.releaseGate.nextAction,
      href: FIRST_RUN_SECTION_HREFS.publicValueRelease
    },
    {
      id: "decision-packet",
      status: input.externalDecisionPacket.status,
      label: "Decision packet",
      owner: input.externalDecisionPacket.recipient,
      evidence: input.externalDecisionPacket.safeValueLine,
      action: input.externalDecisionPacket.status === "ready" ? input.externalDecisionPacket.nextAsk : input.externalDecisionPacket.sendRule,
      href: FIRST_RUN_SECTION_HREFS.externalDecisionPacket
    },
    {
      id: "buyer-follow-up",
      status: input.buyerFollowUp.status,
      label: "Buyer follow-up",
      owner: input.buyerFollowUp.recipient,
      evidence: input.buyerFollowUp.subject,
      action: input.buyerFollowUp.status === "ready" ? input.buyerFollowUp.nextAsk : input.buyerFollowUp.safetyLine,
      href: FIRST_RUN_SECTION_HREFS.buyerFollowUp
    }
  ];
  const status = releaseWorstStatus(steps.map((step) => step.status));
  const readyCount = steps.filter((step) => step.status === "ready").length;
  const currentStep = steps.find((step) => step.status === "blocked") ?? steps.find((step) => step.status === "attention") ?? steps[steps.length - 1];
  const label = status === "ready" ? "Path ready" : status === "attention" ? "Review path" : "Blocked path";
  const headline =
    status === "ready"
      ? "Critical path is ready for buyer delivery"
      : status === "attention"
        ? `Critical path needs review at ${currentStep.label}`
        : `Critical path is blocked at ${currentStep.label}`;
  const summary =
    status === "ready"
      ? `${input.snapshot.buyer} can receive the proof closeout, value release, decision packet, and follow-up in one thread.`
      : `${readyCount}/${steps.length} steps are clear. ${currentStep.owner} owns: ${currentStep.action}`;
  const primaryActionLabel = status === "ready" ? "Open buyer follow-up" : `Open ${currentStep.label}`;
  const valueLine =
    input.releaseGate.status === "ready"
      ? `${yen(input.releaseGate.shareableMonthlyValueYen)}/month is ready for the external packet.`
      : `${yen(input.releaseGate.lockedMonthlyValueYen)}/month remains locked until ${currentStep.owner} clears ${currentStep.label}.`;
  const markdown = [
    "# First-run critical path",
    "",
    `Status: ${status}`,
    `Buyer: ${input.snapshot.buyer}`,
    `Ready steps: ${readyCount}/${steps.length}`,
    `Current step: ${currentStep.label}`,
    `Current owner: ${currentStep.owner}`,
    `Value line: ${valueLine}`,
    `Next action: ${currentStep.action}`,
    "",
    "## Path steps",
    ...steps.map(criticalPathStepLine)
  ].join("\n");

  return {
    status,
    label,
    headline,
    summary,
    readyCount,
    stepTotal: steps.length,
    currentStep,
    primaryActionLabel,
    valueLine,
    steps,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}

function buildFirstRunExternalVerificationDesk(input: {
  snapshot: HomepageFirstRunValueProofCommandSnapshot;
  proofCloseout: FirstRunProofCloseout;
  releaseGate: FirstRunPublicValueReleaseGate;
  externalDecisionPacket: FirstRunExternalDecisionPacket;
  liveProofAudit: WorkflowLiveProofAudit | null;
}): FirstRunExternalVerificationDesk {
  const packetCheck = input.snapshot.checks.find((check) => check.id === "buyer-packet");
  const packetVerifierStatus = packetCheck?.status ?? input.snapshot.status;
  const liveAuditStatus: HomepageFirstRunValueProofStatus =
    input.liveProofAudit?.status === "verified"
      ? "ready"
      : input.liveProofAudit
        ? "blocked"
        : "attention";
  const liveAuditHref = input.liveProofAudit
    ? liveProofAuditReceiptHref(input.liveProofAudit)
    : "#launch-evidence-console";
  const checks: FirstRunExternalVerificationCheck[] = [
    {
      id: "packet-verifier",
      status: packetVerifierStatus,
      label: "Packet verifier",
      owner: "Review owner",
      evidence: `${input.snapshot.receipts.length} receipts available through ${input.snapshot.verifierAction.requestKey}.`,
      action: packetVerifierStatus === "ready" ? "Open the verifier without private workspace access." : packetCheck?.actionLabel ?? "Repair the buyer packet verifier.",
      href: input.snapshot.verifierAction.href
    },
    {
      id: "public-proof",
      status: input.proofCloseout.status,
      label: "Public proof",
      owner: input.proofCloseout.owner,
      evidence: `${input.proofCloseout.targetLabel}: ${input.proofCloseout.targetValue}.`,
      action: input.proofCloseout.status === "ready" ? "Keep the public proof URL attached." : input.proofCloseout.acceptanceLine,
      href: input.proofCloseout.inputHref
    },
    {
      id: "live-audit",
      status: liveAuditStatus,
      label: "Live audit verifier",
      owner: "Proof owner",
      evidence: input.liveProofAudit
        ? `${input.liveProofAudit.verifiedCount}/${input.liveProofAudit.totalCount} proof links verified by ${input.liveProofAudit.receiptId}.`
        : "No live proof audit receipt has been issued.",
      action: liveAuditStatus === "ready" ? "Open the live audit verifier from the packet." : input.liveProofAudit?.nextAction ?? "Run live proof verification before review.",
      href: liveAuditHref
    },
    {
      id: "value-release",
      status: input.releaseGate.status,
      label: "Value release memo",
      owner: input.releaseGate.nextOwner,
      evidence: `${input.releaseGate.releaseScore}/100 release score, ${yen(input.releaseGate.shareableMonthlyValueYen)} shareable, ${yen(input.releaseGate.lockedMonthlyValueYen)} locked.`,
      action: input.releaseGate.status === "ready" ? "Attach the release memo to the reviewer packet." : input.releaseGate.nextAction,
      href: FIRST_RUN_SECTION_HREFS.publicValueRelease
    },
    {
      id: "decision-packet",
      status: input.externalDecisionPacket.status,
      label: "Decision packet",
      owner: input.externalDecisionPacket.recipient,
      evidence: input.externalDecisionPacket.safeValueLine,
      action: input.externalDecisionPacket.status === "ready" ? input.externalDecisionPacket.nextAsk : input.externalDecisionPacket.sendRule,
      href: FIRST_RUN_SECTION_HREFS.externalDecisionPacket
    }
  ];
  const status = releaseWorstStatus(checks.map((check) => check.status));
  const readyCount = checks.filter((check) => check.status === "ready").length;
  const readinessScore = Math.round(checks.reduce((sum, check) => sum + releaseStatusScore(check.status), 0) / checks.length);
  const currentCheck = checks.find((check) => check.status === "blocked") ?? checks.find((check) => check.status === "attention") ?? checks[checks.length - 1];
  const label = status === "ready" ? "Verification ready" : status === "attention" ? "Evidence review" : "Verification blocked";
  const headline =
    status === "ready"
      ? "External reviewer can verify the packet"
      : status === "attention"
        ? `External verification needs review at ${currentCheck.label}`
        : `External verification blocked at ${currentCheck.label}`;
  const summary =
    status === "ready"
      ? `${input.snapshot.buyer} can inspect receipts, public proof, live audit, and decision packet without private workspace access.`
      : `${readyCount}/${checks.length} verification surfaces are ready. ${currentCheck.owner} owns: ${currentCheck.action}`;
  const sendRule =
    status === "ready"
      ? input.externalDecisionPacket.sendRule
      : `Hold external review. ${currentCheck.owner} must complete: ${currentCheck.action}`;
  const markdown = [
    "# First-run external verification desk",
    "",
    `Status: ${status}`,
    `Buyer: ${input.snapshot.buyer}`,
    `Readiness score: ${readinessScore}/100`,
    `Verification surfaces ready: ${readyCount}/${checks.length}`,
    `Current verification check: ${currentCheck.label}`,
    `Current owner: ${currentCheck.owner}`,
    `Send rule: ${sendRule}`,
    "",
    "## Verification checks",
    ...checks.map(externalVerificationCheckLine)
  ].join("\n");

  return {
    status,
    label,
    headline,
    summary,
    readinessScore,
    readyCount,
    checkTotal: checks.length,
    currentCheck,
    sendRule,
    checks,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}

function buildFirstRunBuyerQuestionBoard(input: {
  snapshot: HomepageFirstRunValueProofCommandSnapshot;
  meetingBrief: FirstRunBuyerMeetingBrief;
  publicValueReleaseGate: FirstRunPublicValueReleaseGate;
  buyerDecisionRehearsal: FirstRunBuyerDecisionRehearsal;
  externalVerificationDesk: FirstRunExternalVerificationDesk;
}): FirstRunBuyerQuestionBoard {
  const decisionRoute = input.buyerDecisionRehearsal.routes.find((route) => route.id === "acceptance-path");
  const questions = input.meetingBrief.agenda.map((item): FirstRunBuyerQuestionAnswer => {
    if (item.id === "value-case") {
      const status = releaseWorstStatus([item.status, input.publicValueReleaseGate.status]);
      return {
        id: item.id,
        status,
        label: item.label,
        owner: status === "ready" ? item.owner : input.publicValueReleaseGate.nextOwner,
        question: item.question,
        answer:
          status === "ready"
            ? `${yen(input.publicValueReleaseGate.shareableMonthlyValueYen)}/month is cleared for buyer discussion with the release memo attached.`
            : `Do not cite the monthly value externally yet. ${input.publicValueReleaseGate.releaseRule}`,
        proof: `${input.publicValueReleaseGate.checks.filter((check) => check.status === "ready").length}/${input.publicValueReleaseGate.checks.length} value release gates ready. ${item.evidence}`,
        decisionCriteria: item.exitCriteria,
        href: FIRST_RUN_SECTION_HREFS.publicValueRelease
      };
    }

    if (item.id === "receipt-check") {
      const status = releaseWorstStatus([item.status, input.externalVerificationDesk.status]);
      return {
        id: item.id,
        status,
        label: item.label,
        owner: status === "ready" ? item.owner : input.externalVerificationDesk.currentCheck.owner,
        question: item.question,
        answer:
          status === "ready"
            ? "Yes. The reviewer can open the verifier, public proof, live audit, release memo, and decision packet without private workspace access."
            : `Not yet. ${input.externalVerificationDesk.currentCheck.owner} must close ${input.externalVerificationDesk.currentCheck.label}: ${input.externalVerificationDesk.currentCheck.action}`,
        proof: `${input.externalVerificationDesk.readyCount}/${input.externalVerificationDesk.checkTotal} verification surfaces ready. ${item.evidence}`,
        decisionCriteria: item.exitCriteria,
        href: input.externalVerificationDesk.currentCheck.href
      };
    }

    const status = releaseWorstStatus([item.status, input.buyerDecisionRehearsal.status]);
    return {
      id: item.id,
      status,
      label: item.label,
      owner: status === "ready" ? item.owner : "Pilot owner",
      question: item.question,
      answer:
        status === "ready"
          ? `Recommend ${input.buyerDecisionRehearsal.recommendedDecision} and record it with the decision receipt before handoff.`
          : `Keep the ${input.buyerDecisionRehearsal.recommendedDecision} decision internal. ${input.buyerDecisionRehearsal.nextAction}`,
      proof: `${input.buyerDecisionRehearsal.routes.filter((route) => route.status === "ready").length}/${input.buyerDecisionRehearsal.routes.length} decision routes usable. ${item.evidence}`,
      decisionCriteria: item.exitCriteria,
      href: decisionRoute?.href ?? item.href
    };
  });
  const status = releaseWorstStatus(questions.map((question) => question.status));
  const answeredCount = questions.filter((question) => question.status === "ready").length;
  const currentQuestion = questions.find((question) => question.status === "blocked") ?? questions.find((question) => question.status === "attention") ?? questions[0];
  const label = status === "ready" ? "Answers ready" : status === "attention" ? "Answer with caveat" : "Internal answers only";
  const headline =
    status === "ready"
      ? "Buyer questions have evidence-backed answers"
      : status === "attention"
        ? "Buyer answers need caveats before sharing"
        : "Buyer answers stay internal until proof closes";
  const summary =
    status === "ready"
      ? `${input.snapshot.buyer} can ask the value, verifier, and pilot-decision questions in one meeting.`
      : `${answeredCount}/${questions.length} buyer questions are answerable now. ${currentQuestion.owner} owns: ${currentQuestion.decisionCriteria}`;
  const answerRule =
    status === "ready"
      ? "Use this board in the meeting and record the decision against the attached receipt."
      : `Keep the board internal. First non-answerable question: ${currentQuestion.label}.`;
  const markdown = [
    "# First buyer question answer board",
    "",
    `Status: ${status}`,
    `Buyer: ${input.snapshot.buyer}`,
    `Answers ready: ${answeredCount}/${questions.length}`,
    `Current question: ${currentQuestion.label}`,
    `Current owner: ${currentQuestion.owner}`,
    `Answer rule: ${answerRule}`,
    "",
    "## Questions",
    ...questions.map(buyerQuestionAnswerLine)
  ].join("\n");

  return {
    status,
    label,
    headline,
    summary,
    answeredCount,
    questionTotal: questions.length,
    currentQuestion,
    answerRule,
    questions,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}

function buildFirstRunBuyerApprovalChecklist(input: {
  snapshot: HomepageFirstRunValueProofCommandSnapshot;
  meetingBrief: FirstRunBuyerMeetingBrief;
  questionBoard: FirstRunBuyerQuestionBoard;
  publicValueReleaseGate: FirstRunPublicValueReleaseGate;
  externalVerificationDesk: FirstRunExternalVerificationDesk;
  buyerDecisionRehearsal: FirstRunBuyerDecisionRehearsal;
  buyerFollowUp: FirstRunBuyerFollowUp;
}): FirstRunBuyerApprovalChecklist {
  const followUpAttachmentStatus = releaseWorstStatus(input.buyerFollowUp.attachments.map((attachment) => attachment.status));
  const readyAttachmentCount = input.buyerFollowUp.attachments.filter((attachment) => attachment.status === "ready").length;
  const decisionRoute = input.buyerDecisionRehearsal.routes.find((route) => route.id === "acceptance-path");
  const items: FirstRunBuyerApprovalChecklistItem[] = [
    {
      id: "value-clearance",
      status: input.publicValueReleaseGate.status,
      label: "Value can be cited",
      owner: input.publicValueReleaseGate.status === "ready" ? input.snapshot.buyer : input.publicValueReleaseGate.nextOwner,
      approvalQuestion: `Can ${input.snapshot.buyer} approve based on the measured value claim?`,
      evidence: `${input.publicValueReleaseGate.releaseScore}/100 release score, ${yen(input.publicValueReleaseGate.shareableMonthlyValueYen)} shareable, ${yen(input.publicValueReleaseGate.lockedMonthlyValueYen)} locked.`,
      approvalCondition:
        input.publicValueReleaseGate.status === "ready"
          ? "Measured value may be cited with the value receipt and release memo attached."
          : "Measured value stays out of the buyer approval ask.",
      repairAction: input.publicValueReleaseGate.status === "ready" ? "Keep release evidence attached." : input.publicValueReleaseGate.nextAction,
      href: FIRST_RUN_SECTION_HREFS.publicValueRelease
    },
    {
      id: "receipt-verification",
      status: input.externalVerificationDesk.status,
      label: "Receipts verify outside workspace",
      owner: input.externalVerificationDesk.status === "ready" ? "Review owner" : input.externalVerificationDesk.currentCheck.owner,
      approvalQuestion: "Can a reviewer replay the receipts and public proof without private access?",
      evidence: `${input.externalVerificationDesk.readyCount}/${input.externalVerificationDesk.checkTotal} verification surfaces ready.`,
      approvalCondition:
        input.externalVerificationDesk.status === "ready"
          ? "Verifier, public proof, live audit, value release, and decision packet all open."
          : `${input.externalVerificationDesk.currentCheck.label} must pass before approval.`,
      repairAction:
        input.externalVerificationDesk.status === "ready"
          ? "Recheck if any linked receipt or public URL changes."
          : input.externalVerificationDesk.currentCheck.action,
      href: FIRST_RUN_SECTION_HREFS.externalVerification
    },
    {
      id: "decision-route",
      status: input.buyerDecisionRehearsal.status,
      label: "Decision route is bounded",
      owner: input.snapshot.buyer,
      approvalQuestion: `Is the recommended ${input.buyerDecisionRehearsal.recommendedDecision} decision safe to record?`,
      evidence: input.buyerDecisionRehearsal.guardrail,
      approvalCondition:
        input.buyerDecisionRehearsal.status === "ready"
          ? input.buyerDecisionRehearsal.sendRule
          : "Approval path stays internal until the decision route and evidence packet agree.",
      repairAction: input.buyerDecisionRehearsal.status === "ready" ? "Record the decision against the receipt." : input.buyerDecisionRehearsal.nextAction,
      href: FIRST_RUN_SECTION_HREFS.buyerDecisionRehearsal
    },
    {
      id: "meeting-ask",
      status: input.meetingBrief.status,
      label: "Meeting ask is safe",
      owner: input.meetingBrief.status === "ready" ? input.snapshot.buyer : input.publicValueReleaseGate.nextOwner,
      approvalQuestion: input.meetingBrief.decisionAsk,
      evidence: `${input.questionBoard.answeredCount}/${input.questionBoard.questionTotal} buyer questions answerable. ${input.meetingBrief.meetingGoal}`,
      approvalCondition:
        input.meetingBrief.status === "ready"
          ? "The meeting can end in approve, revise, or hold with the receipt attached."
          : "Use the meeting for proof review only.",
      repairAction: input.meetingBrief.status === "ready" ? "Keep the question board attached." : input.meetingBrief.stopRule,
      href: FIRST_RUN_SECTION_HREFS.buyerMeetingBrief
    },
    {
      id: "follow-up-package",
      status: followUpAttachmentStatus,
      label: "Buyer package has attachments",
      owner: followUpAttachmentStatus === "ready" ? input.snapshot.buyer : input.buyerFollowUp.recipient,
      approvalQuestion: "Can the follow-up leave the workspace with every required proof attachment?",
      evidence: `${readyAttachmentCount}/${input.buyerFollowUp.attachments.length} follow-up attachments ready.`,
      approvalCondition:
        followUpAttachmentStatus === "ready"
          ? "Reviewer packet, public manifest, decision route, and fresh live proof are attached."
          : "The follow-up stays internal until all required attachments are ready.",
      repairAction: followUpAttachmentStatus === "ready" ? "Send only with the attachment contract intact." : input.buyerFollowUp.attachmentRule,
      href: FIRST_RUN_SECTION_HREFS.buyerFollowUp
    }
  ];
  const status = releaseWorstStatus(items.map((item) => item.status));
  const approvedCount = items.filter((item) => item.status === "ready").length;
  const currentItem = items.find((item) => item.status === "blocked") ?? items.find((item) => item.status === "attention") ?? items[items.length - 1];
  const label = status === "ready" ? "Approval ready" : status === "attention" ? "Approval review" : "Approval held";
  const headline =
    status === "ready"
      ? "Buyer can approve a bounded pilot with evidence attached"
      : status === "attention"
        ? "Buyer approval needs one review condition"
        : "Buyer approval is blocked by proof conditions";
  const summary =
    status === "ready"
      ? `${input.snapshot.buyer} can evaluate value, verification, decision route, meeting ask, and follow-up package in one approval record.`
      : `${approvedCount}/${items.length} approval conditions pass. ${currentItem.owner} owns: ${currentItem.repairAction}`;
  const decisionGate =
    status === "ready"
      ? "Record approve, revise, or hold only against the packet receipt and fresh proof audit."
      : `Do not ask for approval yet. First approval blocker: ${currentItem.label}. ${currentItem.owner}: ${currentItem.repairAction}`;
  const markdown = [
    "# First buyer approval checklist",
    "",
    `Status: ${status}`,
    `Buyer: ${input.snapshot.buyer}`,
    `Approved conditions: ${approvedCount}/${items.length}`,
    `Current approval condition: ${currentItem.label}`,
    `Decision gate: ${decisionGate}`,
    "",
    "## Approval conditions",
    ...items.map(buyerApprovalChecklistLine)
  ].join("\n");

  return {
    status,
    label,
    headline,
    summary,
    decisionGate,
    approvedCount,
    itemTotal: items.length,
    currentItem,
    items,
    markdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}

export function HomepageFirstRunValueProofCommandPanel({
  valueLens,
  proofEntry,
  outcomeArtifact,
  reviewerHandoffKit,
  workspace,
  proofSampleWorkspace,
  proofLinks,
  proofVerification,
  proofVerifyStatus = "idle",
  proofVerifyError = "",
  freshnessNowMs = Date.now(),
  onVerifyProofLinks,
  onProofLinkChange,
  onCopyText
}: {
  valueLens: HomepageValueLensSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
  outcomeArtifact: HomepageOutcomeArtifactSnapshot;
  reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
  workspace?: WorkspaceDraft;
  proofSampleWorkspace?: WorkspaceDraft;
  proofLinks?: WorkflowIntakeProofSlot[];
  proofVerification?: BuyerShareGateProofVerificationSummary | null;
  proofVerifyStatus?: FirstRunProofVerifyStatus;
  proofVerifyError?: string;
  freshnessNowMs?: number;
  onVerifyProofLinks?: () => void;
  onProofLinkChange?: (id: WorkflowIntakeProofSlot["id"], value: string) => void;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [reviewerPacketCopyStatus, setReviewerPacketCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [repairRunbookCopyStatus, setRepairRunbookCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [submissionManifestCopyStatus, setSubmissionManifestCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [decisionPacketCopyStatus, setDecisionPacketCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [publicRepairPayoffCopyStatus, setPublicRepairPayoffCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [repairImpactSimulationCopyStatus, setRepairImpactSimulationCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [simulatedRepairIds, setSimulatedRepairIds] = useState<string[]>([]);
  const [decisionRehearsalCopyStatus, setDecisionRehearsalCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [buyerMeetingBriefCopyStatus, setBuyerMeetingBriefCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [buyerQuestionBoardCopyStatus, setBuyerQuestionBoardCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [buyerApprovalChecklistCopyStatus, setBuyerApprovalChecklistCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [buyerFollowUpCopyStatus, setBuyerFollowUpCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [criticalPathCopyStatus, setCriticalPathCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [externalVerificationCopyStatus, setExternalVerificationCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const proofRepairProjection = useMemo(
    () => (workspace && proofSampleWorkspace ? buildBuyerProofRepairProjection({ current: workspace, sample: proofSampleWorkspace }) : undefined),
    [proofSampleWorkspace, workspace]
  );
  const snapshot = useMemo(
    () =>
      buildHomepageFirstRunValueProofCommand({
        valueLens,
        proofEntry,
        outcomeArtifact,
        reviewerHandoffKit,
        proofRepairProjection
      }),
    [outcomeArtifact, proofEntry, proofRepairProjection, reviewerHandoffKit, valueLens]
  );
  const liveProofAudit = useMemo(
    () =>
      proofLinks?.length
        ? buildWorkflowLiveProofAudit({
            proofLinks,
            proofVerification: proofVerification ?? null,
            proofVerifyError
          })
        : null,
    [proofLinks, proofVerification, proofVerifyError]
  );
  const liveProofHrefById = useMemo(() => new Map((proofLinks ?? []).map((link) => [link.id, link.href])), [proofLinks]);
  const liveProofOpenRows = liveProofAudit?.rows.filter((row) => row.status !== "pass") ?? [];
  const liveProofRows = liveProofOpenRows.length > 0 ? liveProofOpenRows.slice(0, 3) : liveProofAudit?.rows.slice(0, 3) ?? [];
  const liveProofRowById = new Map((liveProofAudit?.rows ?? []).map((row) => [row.id, row]));
  const proofRepairLinks = (() => {
    if (!onProofLinkChange || !proofLinks?.length) return [];
    const openRowIds = new Set(liveProofOpenRows.map((row) => row.id));
    const openLinks = proofLinks.filter((link) => openRowIds.has(link.id));
    return (openLinks.length > 0 ? openLinks : proofLinks).slice(0, 5);
  })();
  const publicValueReleaseGate = useMemo(
    () => buildFirstRunPublicValueReleaseGate({ snapshot, valueLens, liveProofAudit, freshnessNowMs }),
    [freshnessNowMs, liveProofAudit, snapshot, valueLens]
  );
  const proofCloseout = buildFirstRunProofCloseout({
    releaseGate: publicValueReleaseGate,
    liveProofAudit,
    proofRepairLinks,
    proofVerifyStatus
  });
  const reviewerPacket = useMemo(
    () =>
      buildFirstRunReviewerPacket({
        snapshot,
        valueLens,
        liveProofAudit,
        proofLinks,
        freshnessNowMs
      }),
    [freshnessNowMs, liveProofAudit, proofLinks, snapshot, valueLens]
  );
  const repairRunbook = useMemo(
    () =>
      buildFirstRunRepairRunbook({
        releaseGate: publicValueReleaseGate,
        reviewerPacket
      }),
    [publicValueReleaseGate, reviewerPacket]
  );
  const submissionManifest = useMemo(
    () =>
      buildFirstRunSubmissionManifest({
        snapshot,
        liveProofAudit,
        releaseGate: publicValueReleaseGate,
        reviewerPacket,
        repairRunbook,
        freshnessNowMs
      }),
    [freshnessNowMs, liveProofAudit, publicValueReleaseGate, repairRunbook, reviewerPacket, snapshot]
  );
  const externalDecisionPacket = useMemo(
    () =>
      buildFirstRunExternalDecisionPacket({
        snapshot,
        releaseGate: publicValueReleaseGate,
        reviewerPacket,
        submissionManifest,
        liveProofAudit
      }),
    [liveProofAudit, publicValueReleaseGate, reviewerPacket, snapshot, submissionManifest]
  );
  const publicRepairPayoff = useMemo(
    () =>
      buildFirstRunPublicRepairPayoff({
        snapshot,
        releaseGate: publicValueReleaseGate,
        submissionManifest,
        proofRepairProjection
      }),
    [proofRepairProjection, publicValueReleaseGate, snapshot, submissionManifest]
  );
  const repairImpactSimulation = useMemo(
    () =>
      buildFirstRunRepairImpactSimulation({
        releaseGate: publicValueReleaseGate,
        submissionManifest,
        selectedRepairIds: simulatedRepairIds
      }),
    [publicValueReleaseGate, simulatedRepairIds, submissionManifest]
  );
  const buyerDecisionRehearsal = useMemo(
    () =>
      buildFirstRunBuyerDecisionRehearsal({
        proofEntry,
        reviewerPacket,
        submissionManifest,
        externalDecisionPacket,
        publicRepairPayoff
      }),
    [externalDecisionPacket, proofEntry, publicRepairPayoff, reviewerPacket, submissionManifest]
  );
  const buyerMeetingBrief = useMemo(
    () =>
      buildFirstRunBuyerMeetingBrief({
        snapshot,
        valueLens,
        reviewerPacket,
        publicValueReleaseGate,
        buyerDecisionRehearsal
      }),
    [buyerDecisionRehearsal, publicValueReleaseGate, reviewerPacket, snapshot, valueLens]
  );
  const buyerFollowUp = useMemo(
    () =>
      buildFirstRunBuyerFollowUp({
        snapshot,
        reviewerPacket,
        repairRunbook,
        submissionManifest,
        buyerMeetingBrief,
        buyerDecisionRehearsal
      }),
    [buyerDecisionRehearsal, buyerMeetingBrief, repairRunbook, reviewerPacket, snapshot, submissionManifest]
  );
  const criticalPath = buildFirstRunCriticalPath({
    snapshot,
    proofCloseout,
    releaseGate: publicValueReleaseGate,
    externalDecisionPacket,
    buyerFollowUp
  });
  const externalVerificationDesk = buildFirstRunExternalVerificationDesk({
    snapshot,
    proofCloseout,
    releaseGate: publicValueReleaseGate,
    externalDecisionPacket,
    liveProofAudit
  });
  const buyerQuestionBoard = buildFirstRunBuyerQuestionBoard({
    snapshot,
    meetingBrief: buyerMeetingBrief,
    publicValueReleaseGate,
    buyerDecisionRehearsal,
    externalVerificationDesk
  });
  const buyerApprovalChecklist = useMemo(
    () =>
      buildFirstRunBuyerApprovalChecklist({
        snapshot,
        meetingBrief: buyerMeetingBrief,
        questionBoard: buyerQuestionBoard,
        publicValueReleaseGate,
        externalVerificationDesk,
        buyerDecisionRehearsal,
        buyerFollowUp
      }),
    [buyerDecisionRehearsal, buyerFollowUp, buyerMeetingBrief, buyerQuestionBoard, externalVerificationDesk, publicValueReleaseGate, snapshot]
  );
  const repairGuide = snapshot.repairGuide;
  useEffect(() => {
    const validRepairIds = new Set(repairImpactSimulation.actions.map((action) => action.id));
    setSimulatedRepairIds((current) => {
      const next = current.filter((id) => validRepairIds.has(id as FirstRunSubmissionManifestCheck["id"]));
      return next.length === current.length ? current : next;
    });
  }, [repairImpactSimulation.actions]);

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  useEffect(() => {
    if (reviewerPacketCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setReviewerPacketCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [reviewerPacketCopyStatus]);

  useEffect(() => {
    if (repairRunbookCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setRepairRunbookCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [repairRunbookCopyStatus]);

  useEffect(() => {
    if (submissionManifestCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setSubmissionManifestCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [submissionManifestCopyStatus]);

  useEffect(() => {
    if (decisionPacketCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setDecisionPacketCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [decisionPacketCopyStatus]);

  useEffect(() => {
    if (publicRepairPayoffCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setPublicRepairPayoffCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [publicRepairPayoffCopyStatus]);

  useEffect(() => {
    if (repairImpactSimulationCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setRepairImpactSimulationCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [repairImpactSimulationCopyStatus]);

  useEffect(() => {
    if (decisionRehearsalCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setDecisionRehearsalCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [decisionRehearsalCopyStatus]);

  useEffect(() => {
    if (buyerMeetingBriefCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setBuyerMeetingBriefCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [buyerMeetingBriefCopyStatus]);

  useEffect(() => {
    if (buyerQuestionBoardCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setBuyerQuestionBoardCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [buyerQuestionBoardCopyStatus]);

  useEffect(() => {
    if (buyerApprovalChecklistCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setBuyerApprovalChecklistCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [buyerApprovalChecklistCopyStatus]);

  useEffect(() => {
    if (buyerFollowUpCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setBuyerFollowUpCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [buyerFollowUpCopyStatus]);

  useEffect(() => {
    if (criticalPathCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCriticalPathCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [criticalPathCopyStatus]);

  useEffect(() => {
    if (externalVerificationCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setExternalVerificationCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [externalVerificationCopyStatus]);

  async function copyCommand() {
    const copied = await onCopyText(snapshot.exportMarkdown);
    setCopyStatus(copied ? "copied" : "failed");
  }

  async function copyReviewerPacket() {
    const copied = await onCopyText(reviewerPacket.body);
    setReviewerPacketCopyStatus(copied ? "copied" : "failed");
  }

  async function copyRepairRunbook() {
    const copied = await onCopyText(repairRunbook.markdown);
    setRepairRunbookCopyStatus(copied ? "copied" : "failed");
  }

  async function copySubmissionManifest() {
    const copied = await onCopyText(submissionManifest.markdown);
    setSubmissionManifestCopyStatus(copied ? "copied" : "failed");
  }

  async function copyExternalDecisionPacket() {
    const copied = await onCopyText(externalDecisionPacket.body);
    setDecisionPacketCopyStatus(copied ? "copied" : "failed");
  }

  async function copyPublicRepairPayoff() {
    const copied = await onCopyText(publicRepairPayoff.markdown);
    setPublicRepairPayoffCopyStatus(copied ? "copied" : "failed");
  }

  async function copyRepairImpactSimulation() {
    const copied = await onCopyText(repairImpactSimulation.markdown);
    setRepairImpactSimulationCopyStatus(copied ? "copied" : "failed");
  }

  async function copyBuyerDecisionRehearsal() {
    const copied = await onCopyText(buyerDecisionRehearsal.markdown);
    setDecisionRehearsalCopyStatus(copied ? "copied" : "failed");
  }

  async function copyBuyerMeetingBrief() {
    const copied = await onCopyText(buyerMeetingBrief.markdown);
    setBuyerMeetingBriefCopyStatus(copied ? "copied" : "failed");
  }

  async function copyBuyerQuestionBoard() {
    const copied = await onCopyText(buyerQuestionBoard.markdown);
    setBuyerQuestionBoardCopyStatus(copied ? "copied" : "failed");
  }

  async function copyBuyerApprovalChecklist() {
    const copied = await onCopyText(buyerApprovalChecklist.markdown);
    setBuyerApprovalChecklistCopyStatus(copied ? "copied" : "failed");
  }

  async function copyBuyerFollowUp() {
    const copied = await onCopyText(buyerFollowUp.body);
    setBuyerFollowUpCopyStatus(copied ? "copied" : "failed");
  }

  async function copyCriticalPath() {
    const copied = await onCopyText(criticalPath.markdown);
    setCriticalPathCopyStatus(copied ? "copied" : "failed");
  }

  async function copyExternalVerificationDesk() {
    const copied = await onCopyText(externalVerificationDesk.markdown);
    setExternalVerificationCopyStatus(copied ? "copied" : "failed");
  }

  function toggleSimulatedRepair(id: string) {
    setSimulatedRepairIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function selectAllSimulatedRepairs() {
    setSimulatedRepairIds(repairImpactSimulation.actions.map((action) => action.id));
  }

  function resetSimulatedRepairs() {
    setSimulatedRepairIds([]);
  }

  function openVerifierDesk(event: MouseEvent<HTMLAnchorElement>) {
    if (typeof window === "undefined") return;
    event.preventDefault();
    try {
      const storageKey = `receipt-verifier-request:${snapshot.verifierAction.requestKey}`;
      window.sessionStorage.setItem(storageKey, snapshot.verifierAction.requestJson);
      window.localStorage.setItem(storageKey, snapshot.verifierAction.requestJson);
    } catch {
      // The verifier link is self-contained; storage only preserves the restore path.
    }
    window.location.assign(snapshot.verifierAction.href);
  }

  function openLiveProofAuditVerifier(event: MouseEvent<HTMLAnchorElement>) {
    if (!liveProofAudit || typeof window === "undefined") return;
    event.preventDefault();
    const storageKey = `receipt-verifier-request:${liveProofAudit.receiptId}`;
    try {
      window.sessionStorage.setItem(storageKey, liveProofAudit.verificationRequestJson);
      window.localStorage.setItem(storageKey, liveProofAudit.verificationRequestJson);
    } catch {
      // The verifier can still open; it will ask for the request JSON if storage is unavailable.
    }
    window.location.assign(receiptVerifierPrefillHref(liveProofAudit.verificationRequestJson));
  }

  return (
    <>
      <HomepageExternalReviewerDockRuntimePanel artifact={outcomeArtifact} proofEntry={proofEntry} reviewerKit={reviewerHandoffKit} />
      <section className={cx("homepage-first-run-value-proof", `is-${snapshot.status}`)} aria-label="First-run buyer value command">
      <div className="homepage-first-run-value-proof-main">
        <span>
          <Rocket size={14} />
          Buyer value command
        </span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.summary}</p>
        {repairGuide && (
          <div className="homepage-first-run-repair-summary" aria-label="First repair summary">
            <span>First repair</span>
            <strong>
              {repairGuide.firstOwner}: {repairGuide.tasks[0]?.label ?? "proof repair"} first
            </strong>
            <small>
              {repairGuide.buyerOwnedCount}/{repairGuide.proofGateCount} buyer-owned gates, {repairGuide.remainingDecisionLift} lift at stake. {repairGuide.firstInputAction.label}.
            </small>
          </div>
        )}
        <div className="homepage-first-run-value-proof-actions" aria-label="First-run value proof actions">
          <a className="homepage-first-run-value-proof-primary" href={snapshot.primaryAction.href} {...routeActionAttrs(snapshot.primaryAction)}>
            <ExternalLink size={14} />
            {snapshot.primaryAction.label}
          </a>
          <a className="homepage-first-run-value-proof-link" href={snapshot.verifierAction.href} onClick={openVerifierDesk}>
            <ShieldCheck size={14} />
            {snapshot.verifierAction.label}
          </a>
          {liveProofAudit && onVerifyProofLinks && (
            <button
              className={cx("homepage-first-run-value-proof-link", proofVerifyStatus === "checked" && "is-confirmed", proofVerifyStatus === "failed" && "is-risk")}
              type="button"
              onClick={onVerifyProofLinks}
              disabled={proofVerifyStatus === "checking"}
            >
              <Gauge size={14} />
              {proofAuditButtonLabel(proofVerifyStatus)}
            </button>
          )}
          <button
            className={cx("homepage-first-run-value-proof-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")}
            type="button"
            onClick={copyCommand}
          >
            <ClipboardCheck size={14} />
            {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Failed" : "Copy command"}
          </button>
          <button type="button" className="homepage-first-run-value-proof-link" data-download-filename="first-run-buyer-value-command.md" onClick={() => downloadTextFile("first-run-buyer-value-command.md", snapshot.exportMarkdown)}>
            <Download size={14} />
            Export command
          </button>
        </div>
      </div>
      <aside className="homepage-first-run-value-proof-score" aria-label="First-run command readiness">
        <span>{snapshot.status}</span>
        <strong>
          {snapshot.readyCount}/{snapshot.checkTotal}
        </strong>
        <small>{snapshot.valueLine}</small>
        <small>{snapshot.proofLine}</small>
      </aside>
      <div id="first-run-critical-path" className={cx("homepage-first-run-critical-path", criticalPath.status)} aria-label="First-run critical path">
        <div className="homepage-first-run-critical-path-head">
          <span>
            <ListChecks size={14} />
            Critical path
          </span>
          <strong>{criticalPath.headline}</strong>
          <p>{criticalPath.summary}</p>
        </div>
        <aside className="homepage-first-run-critical-path-score" aria-label="Critical path status">
          <span>{criticalPath.label}</span>
          <strong>
            {criticalPath.readyCount}/{criticalPath.stepTotal}
          </strong>
          <small>{criticalPath.valueLine}</small>
        </aside>
        <div className="homepage-first-run-critical-path-current" aria-label="Current critical path step">
          <span>Current step</span>
          <strong>{criticalPath.currentStep.label}</strong>
          <p>{criticalPath.currentStep.action}</p>
          <small>{criticalPath.currentStep.owner}</small>
        </div>
        <div className="homepage-first-run-critical-path-actions" aria-label="Critical path actions">
          <a href={criticalPath.currentStep.href} {...routeActionAttrs({ label: criticalPath.primaryActionLabel, href: criticalPath.currentStep.href, external: isExternalHref(criticalPath.currentStep.href) })}>
            <ExternalLink size={13} />
            {criticalPath.primaryActionLabel}
          </a>
          <button
            type="button"
            className={cx(criticalPathCopyStatus === "copied" && "is-confirmed", criticalPathCopyStatus === "failed" && "is-risk")}
            onClick={copyCriticalPath}
          >
            <ClipboardCheck size={13} />
            {criticalPathCopyStatus === "copied" ? "Copied" : criticalPathCopyStatus === "failed" ? "Failed" : "Copy path"}
          </button>
          <button type="button" data-download-filename="first-run-critical-path.md" onClick={() => downloadTextFile("first-run-critical-path.md", criticalPath.markdown)}>
            <Download size={13} />
            Export path
          </button>
        </div>
        <div className="homepage-first-run-critical-path-steps" aria-label="Critical path steps">
          {criticalPath.steps.map((step) => (
            <article key={step.id} className={step.status}>
              <span>
                {statusIcon(step.status)}
                {step.label}
              </span>
              <strong>{step.action}</strong>
              <small>{step.owner}</small>
              <p>{step.evidence}</p>
              <a href={step.href} {...routeActionAttrs({ label: step.label, href: step.href, external: isExternalHref(step.href) })}>
                <ExternalLink size={12} />
                Open path step
              </a>
            </article>
          ))}
        </div>
      </div>
      <div id="first-run-external-verification" className={cx("homepage-first-run-external-verification", externalVerificationDesk.status)} aria-label="First-run external verification desk">
        <div className="homepage-first-run-external-verification-head">
          <span>
            <ShieldCheck size={14} />
            External verification desk
          </span>
          <strong>{externalVerificationDesk.headline}</strong>
          <p>{externalVerificationDesk.summary}</p>
        </div>
        <aside className="homepage-first-run-external-verification-score" aria-label="External verification score">
          <span>{externalVerificationDesk.label}</span>
          <strong>{externalVerificationDesk.readinessScore}/100</strong>
          <small>
            {externalVerificationDesk.readyCount}/{externalVerificationDesk.checkTotal} verification surfaces ready
          </small>
        </aside>
        <div className="homepage-first-run-external-verification-current" aria-label="Current external verification check">
          <span>Verification check</span>
          <strong>{externalVerificationDesk.currentCheck.label}</strong>
          <p>{externalVerificationDesk.currentCheck.action}</p>
          <small>{externalVerificationDesk.currentCheck.owner}</small>
        </div>
        <p className="homepage-first-run-external-verification-rule">{externalVerificationDesk.sendRule}</p>
        <div className="homepage-first-run-external-verification-actions" aria-label="External verification actions">
          <a href={externalVerificationDesk.currentCheck.href} {...routeActionAttrs({ label: externalVerificationDesk.currentCheck.label, href: externalVerificationDesk.currentCheck.href, external: isExternalHref(externalVerificationDesk.currentCheck.href) })}>
            <ExternalLink size={13} />
            Open verification
          </a>
          <button
            type="button"
            className={cx(externalVerificationCopyStatus === "copied" && "is-confirmed", externalVerificationCopyStatus === "failed" && "is-risk")}
            onClick={copyExternalVerificationDesk}
          >
            <ClipboardCheck size={13} />
            {externalVerificationCopyStatus === "copied" ? "Copied" : externalVerificationCopyStatus === "failed" ? "Failed" : "Copy verification"}
          </button>
          <button type="button" data-download-filename="first-run-external-verification-desk.md" onClick={() => downloadTextFile("first-run-external-verification-desk.md", externalVerificationDesk.markdown)}>
            <Download size={13} />
            Export verification
          </button>
        </div>
        <div className="homepage-first-run-external-verification-checks" aria-label="External verification checks">
          {externalVerificationDesk.checks.map((check) => (
            <article key={check.id} className={check.status}>
              <span>
                {statusIcon(check.status)}
                {check.label}
              </span>
              <strong>{check.action}</strong>
              <small>{check.owner}</small>
              <p>{check.evidence}</p>
              <a href={check.href} {...routeActionAttrs({ label: check.label, href: check.href, external: isExternalHref(check.href) })}>
                <ExternalLink size={12} />
                Open verifier
              </a>
            </article>
          ))}
        </div>
      </div>
      <div id="first-run-meeting-brief" className={cx("homepage-first-run-meeting-brief", buyerMeetingBrief.status)} aria-label="First buyer meeting brief">
        <div className="homepage-first-run-meeting-brief-head">
          <span>
            <Scale size={14} />
            First buyer meeting brief
          </span>
          <strong>{buyerMeetingBrief.headline}</strong>
          <p>{buyerMeetingBrief.decisionAsk}</p>
        </div>
        <aside className="homepage-first-run-meeting-brief-score" aria-label="First buyer meeting status">
          <span>{buyerMeetingBrief.label}</span>
          <strong>{buyerMeetingBrief.status}</strong>
          <small>{buyerMeetingBrief.meetingGoal}</small>
        </aside>
        <div className="homepage-first-run-meeting-brief-rule" aria-label="First buyer meeting stop rule">
          <span>Stop rule</span>
          <strong>{buyerMeetingBrief.stopRule}</strong>
        </div>
        <div className="homepage-first-run-meeting-brief-actions" aria-label="First buyer meeting brief actions">
          <button
            type="button"
            className={cx(buyerMeetingBriefCopyStatus === "copied" && "is-confirmed", buyerMeetingBriefCopyStatus === "failed" && "is-risk")}
            onClick={copyBuyerMeetingBrief}
          >
            <ClipboardCheck size={13} />
            {buyerMeetingBriefCopyStatus === "copied" ? "Copied" : buyerMeetingBriefCopyStatus === "failed" ? "Failed" : "Copy meeting brief"}
          </button>
          <button type="button" data-download-filename="first-buyer-meeting-brief.md" onClick={() => downloadTextFile("first-buyer-meeting-brief.md", buyerMeetingBrief.markdown)}>
            <Download size={13} />
            Export meeting brief
          </button>
        </div>
        <div className="homepage-first-run-meeting-brief-agenda" aria-label="First buyer meeting agenda">
          {buyerMeetingBrief.agenda.map((item) => (
            <article key={item.id} className={item.status}>
              <span>
                {statusIcon(item.status)}
                {item.label}
              </span>
              <strong>{item.question}</strong>
              <small>{item.owner}</small>
              <p>{item.evidence}</p>
              <small>Exit: {item.exitCriteria}</small>
              <a href={item.href} {...routeActionAttrs({ label: item.label, href: item.href, external: isExternalHref(item.href) })}>
                <ExternalLink size={12} />
                Open artifact
              </a>
            </article>
          ))}
        </div>
      </div>
      <div id="first-run-question-board" className={cx("homepage-first-run-question-board", buyerQuestionBoard.status)} aria-label="First buyer question answer board">
        <div className="homepage-first-run-question-board-head">
          <span>
            <Scale size={14} />
            Buyer question answers
          </span>
          <strong>{buyerQuestionBoard.headline}</strong>
          <p>{buyerQuestionBoard.summary}</p>
        </div>
        <aside className="homepage-first-run-question-board-score" aria-label="Buyer question answer readiness">
          <span>{buyerQuestionBoard.label}</span>
          <strong>
            {buyerQuestionBoard.answeredCount}/{buyerQuestionBoard.questionTotal}
          </strong>
          <small>answers ready</small>
        </aside>
        <div className="homepage-first-run-question-board-current" aria-label="Current buyer question answer">
          <span>Current question</span>
          <strong>{buyerQuestionBoard.currentQuestion.label}</strong>
          <p>{buyerQuestionBoard.currentQuestion.answer}</p>
          <small>{buyerQuestionBoard.currentQuestion.owner}</small>
        </div>
        <p className="homepage-first-run-question-board-rule">{buyerQuestionBoard.answerRule}</p>
        <div className="homepage-first-run-question-board-actions" aria-label="Buyer question board actions">
          <button
            type="button"
            className={cx(buyerQuestionBoardCopyStatus === "copied" && "is-confirmed", buyerQuestionBoardCopyStatus === "failed" && "is-risk")}
            onClick={copyBuyerQuestionBoard}
          >
            <ClipboardCheck size={13} />
            {buyerQuestionBoardCopyStatus === "copied" ? "Copied" : buyerQuestionBoardCopyStatus === "failed" ? "Failed" : "Copy answers"}
          </button>
          <button type="button" data-download-filename="first-buyer-question-answer-board.md" onClick={() => downloadTextFile("first-buyer-question-answer-board.md", buyerQuestionBoard.markdown)}>
            <Download size={13} />
            Export answers
          </button>
        </div>
        <div className="homepage-first-run-question-board-questions" aria-label="Evidence-backed buyer question answers">
          {buyerQuestionBoard.questions.map((question) => (
            <article key={question.id} className={question.status}>
              <span>
                {statusIcon(question.status)}
                {question.label}
              </span>
              <strong>{question.question}</strong>
              <small>{question.owner}</small>
              <p>{question.answer}</p>
              <small>Proof: {question.proof}</small>
              <small>Decision criteria: {question.decisionCriteria}</small>
              <a href={question.href} {...routeActionAttrs({ label: question.label, href: question.href, external: isExternalHref(question.href) })}>
                <ExternalLink size={12} />
                Open proof
              </a>
            </article>
          ))}
        </div>
      </div>
      <div id="first-run-approval-checklist" className={cx("homepage-first-run-approval-checklist", buyerApprovalChecklist.status)} aria-label="First buyer approval checklist">
        <div className="homepage-first-run-approval-checklist-head">
          <span>
            <ListChecks size={14} />
            Buyer approval checklist
          </span>
          <strong>{buyerApprovalChecklist.headline}</strong>
          <p>{buyerApprovalChecklist.summary}</p>
        </div>
        <aside className="homepage-first-run-approval-checklist-score" aria-label="Buyer approval checklist score">
          <span>{buyerApprovalChecklist.label}</span>
          <strong>
            {buyerApprovalChecklist.approvedCount}/{buyerApprovalChecklist.itemTotal}
          </strong>
          <small>approval conditions</small>
        </aside>
        <div className="homepage-first-run-approval-checklist-current" aria-label="Current buyer approval condition">
          <span>Current condition</span>
          <strong>{buyerApprovalChecklist.currentItem.label}</strong>
          <p>{buyerApprovalChecklist.currentItem.repairAction}</p>
          <small>{buyerApprovalChecklist.currentItem.owner}</small>
        </div>
        <p className="homepage-first-run-approval-checklist-gate">{buyerApprovalChecklist.decisionGate}</p>
        <div className="homepage-first-run-approval-checklist-actions" aria-label="Buyer approval checklist actions">
          <button
            type="button"
            className={cx(buyerApprovalChecklistCopyStatus === "copied" && "is-confirmed", buyerApprovalChecklistCopyStatus === "failed" && "is-risk")}
            onClick={copyBuyerApprovalChecklist}
          >
            <ClipboardCheck size={13} />
            {buyerApprovalChecklistCopyStatus === "copied" ? "Copied" : buyerApprovalChecklistCopyStatus === "failed" ? "Failed" : "Copy checklist"}
          </button>
          <button type="button" data-download-filename="first-buyer-approval-checklist.md" onClick={() => downloadTextFile("first-buyer-approval-checklist.md", buyerApprovalChecklist.markdown)}>
            <Download size={13} />
            Export checklist
          </button>
        </div>
        <div className="homepage-first-run-approval-checklist-items" aria-label="Buyer approval conditions">
          {buyerApprovalChecklist.items.map((item) => (
            <article key={item.id} className={item.status}>
              <span>
                {statusIcon(item.status)}
                {item.label}
              </span>
              <strong>{item.approvalQuestion}</strong>
              <small>{item.owner}</small>
              <p>{item.evidence}</p>
              <small>Approval: {item.approvalCondition}</small>
              <small>Repair: {item.repairAction}</small>
              <a href={item.href} {...routeActionAttrs({ label: item.label, href: item.href, external: isExternalHref(item.href) })}>
                <ExternalLink size={12} />
                Open condition
              </a>
            </article>
          ))}
        </div>
      </div>
      <div id="first-run-follow-up" className={cx("homepage-first-run-follow-up", buyerFollowUp.status)} aria-label="First buyer follow-up composer">
        <div className="homepage-first-run-follow-up-head">
          <span>
            <Send size={14} />
            First buyer follow-up
          </span>
          <strong>{buyerFollowUp.headline}</strong>
          <p>{buyerFollowUp.opening}</p>
        </div>
        <aside className="homepage-first-run-follow-up-score" aria-label="First buyer follow-up status">
          <span>{buyerFollowUp.label}</span>
          <strong>{buyerFollowUp.status}</strong>
          <small>To: {buyerFollowUp.recipient}</small>
        </aside>
        <div className="homepage-first-run-follow-up-subject" aria-label="First buyer follow-up subject">
          <span>Subject</span>
          <strong>{buyerFollowUp.subject}</strong>
          <p>{buyerFollowUp.nextAsk}</p>
        </div>
        <div className="homepage-first-run-follow-up-rule" aria-label="First buyer follow-up safety line">
          <span>Safety line</span>
          <strong>{buyerFollowUp.safetyLine}</strong>
        </div>
        <div className="homepage-first-run-follow-up-attachments" aria-label="First buyer follow-up attachment contract">
          <div>
            <span>Attachment contract</span>
            <strong>{buyerFollowUp.attachmentRule}</strong>
          </div>
          {buyerFollowUp.attachments.map((attachment) => (
            <article key={attachment.id} className={attachment.status}>
              <span>
                {statusIcon(attachment.status)}
                {attachment.label}
              </span>
              <strong>{attachment.action}</strong>
              <small>{attachment.owner}</small>
              <p>{attachment.evidence}</p>
              <a href={attachment.href} {...routeActionAttrs({ label: attachment.label, href: attachment.href, external: isExternalHref(attachment.href) })}>
                <ExternalLink size={12} />
                Open attachment
              </a>
            </article>
          ))}
        </div>
        <div className="homepage-first-run-follow-up-actions" aria-label="First buyer follow-up actions">
          <button
            type="button"
            className={cx(buyerFollowUpCopyStatus === "copied" && "is-confirmed", buyerFollowUpCopyStatus === "failed" && "is-risk")}
            onClick={copyBuyerFollowUp}
          >
            <ClipboardCheck size={13} />
            {buyerFollowUpCopyStatus === "copied" ? "Copied" : buyerFollowUpCopyStatus === "failed" ? "Failed" : "Copy follow-up"}
          </button>
          <button type="button" data-download-filename="first-buyer-follow-up.md" onClick={() => downloadTextFile("first-buyer-follow-up.md", buyerFollowUp.body)}>
            <Download size={13} />
            Export follow-up
          </button>
        </div>
        <div className="homepage-first-run-follow-up-steps" aria-label="First buyer follow-up steps">
          {buyerFollowUp.steps.map((step) => (
            <article key={step.id} className={step.status}>
              <span>
                {statusIcon(step.status)}
                {step.label}
              </span>
              <strong>{step.instruction}</strong>
              <small>{step.owner}</small>
              <p>{step.evidence}</p>
              <a href={step.href} {...routeActionAttrs({ label: step.label, href: step.href, external: isExternalHref(step.href) })}>
                <ExternalLink size={12} />
                Open evidence
              </a>
            </article>
          ))}
        </div>
      </div>
      <div id="first-run-proof-closeout" className={cx("homepage-first-run-proof-closeout", proofCloseout.status)} aria-label="First-run proof closeout">
        <div className="homepage-first-run-proof-closeout-head">
          <span>
            <ListChecks size={14} />
            Proof closeout
          </span>
          <strong>{proofCloseout.headline}</strong>
          <p>{proofCloseout.summary}</p>
        </div>
        <aside className="homepage-first-run-proof-closeout-score" aria-label="Proof closeout status">
          <span>{proofCloseout.label}</span>
          <strong>{proofCloseout.status}</strong>
          <small>{proofCloseout.owner}</small>
        </aside>
        <div className="homepage-first-run-proof-closeout-target" aria-label="Proof closeout target">
          <span>Target proof</span>
          <strong>{proofCloseout.targetLabel}</strong>
          <p>{proofCloseout.targetValue}</p>
        </div>
        <div className="homepage-first-run-proof-closeout-rule" aria-label="Proof closeout acceptance">
          <span>Acceptance</span>
          <strong>{proofCloseout.acceptanceLine}</strong>
          <p>{proofCloseout.valueUnlockLine}</p>
        </div>
        <div className="homepage-first-run-proof-closeout-actions" aria-label="Proof closeout actions">
          <a href={proofCloseout.inputHref}>
            <ExternalLink size={13} />
            Open URL input
          </a>
          {onVerifyProofLinks && (
            <button type="button" onClick={onVerifyProofLinks} disabled={proofVerifyStatus === "checking"}>
              <Gauge size={13} />
              {proofAuditButtonLabel(proofVerifyStatus)}
            </button>
          )}
          <button type="button" data-download-filename="first-run-proof-closeout.md" onClick={() => downloadTextFile("first-run-proof-closeout.md", proofCloseout.markdown)}>
            <Download size={13} />
            Export closeout
          </button>
        </div>
        <div className="homepage-first-run-proof-closeout-steps" aria-label="Proof closeout steps">
          {proofCloseout.steps.map((step) => (
            <article key={step.id} className={step.status}>
              <span>
                {statusIcon(step.status)}
                {step.label}
              </span>
              <strong>{step.instruction}</strong>
              <small>{step.owner}</small>
              <p>{step.acceptance}</p>
              <a href={step.href} {...routeActionAttrs({ label: step.label, href: step.href, external: isExternalHref(step.href) })}>
                <ExternalLink size={12} />
                Open step
              </a>
            </article>
          ))}
        </div>
      </div>
      <div className="homepage-first-run-value-proof-rules" aria-label="First-run send rules">
        <article>
          <span>Command</span>
          <p>{snapshot.command}</p>
        </article>
        <article>
          <span>Send rule</span>
          <p>{snapshot.sendRule}</p>
        </article>
        <article>
          <span>Proof to attach</span>
          <p>{snapshot.proofToAttach}</p>
        </article>
      </div>
      {liveProofAudit && (
        <div id="first-run-live-proof-audit" className={cx("homepage-first-run-live-proof-audit", auditStatusClass(liveProofAudit.status))} aria-label="First-run live proof audit">
          <div className="homepage-first-run-live-proof-audit-head">
            <span>
              <ShieldCheck size={14} />
              Live proof audit
            </span>
            <strong>{liveProofAudit.headline}</strong>
            <p>{liveProofAudit.summary}</p>
          </div>
          <div className="homepage-first-run-live-proof-audit-score" aria-label="Live proof audit score">
            <span>{liveProofAudit.status}</span>
            <strong>{liveProofAudit.verifiedCount}/{liveProofAudit.totalCount}</strong>
            <small>{liveProofAudit.checkedAt || "not checked"}</small>
            <small>Score {liveProofAudit.score}/100</small>
          </div>
          <p className="homepage-first-run-live-proof-audit-next">{liveProofAudit.nextAction}</p>
          <div className="homepage-first-run-live-proof-audit-actions" aria-label="Live proof audit actions">
            {onVerifyProofLinks && (
              <button type="button" onClick={onVerifyProofLinks} disabled={proofVerifyStatus === "checking"}>
                <Gauge size={13} />
                {proofAuditButtonLabel(proofVerifyStatus)}
              </button>
            )}
            <button type="button" data-download-filename={`${liveProofAudit.receiptId}.md`} onClick={() => downloadTextFile(`${liveProofAudit.receiptId}.md`, liveProofAudit.exportMarkdown)}>
              <Download size={13} />
              Export audit
            </button>
            <button type="button" data-download-filename={`${liveProofAudit.receiptId}-verify.json`} onClick={() => downloadHrefFile(`${liveProofAudit.receiptId}-verify.json`, liveProofAudit.verificationRequestHref)}>
              <FileText size={13} />
              Verify JSON
            </button>
            <a href={liveProofAuditReceiptHref(liveProofAudit)} onClick={openLiveProofAuditVerifier}>
              <ShieldCheck size={13} />
              Verify audit
            </a>
          </div>
          <div className="homepage-first-run-live-proof-audit-rows" aria-label="Live proof audit rows">
            {liveProofRows.map((row) => (
              <article key={row.id} className={row.status}>
                <span>
                  {auditStatusIcon(row.status)}
                  {row.label}
                </span>
                <strong>{row.status}</strong>
                <small>{row.evidence}</small>
                <p>{row.action}</p>
                <a href={liveProofHrefById.get(row.id) ?? "#launch-evidence-console"}>
                  <ExternalLink size={12} />
                  Repair slot
                </a>
              </article>
            ))}
          </div>
        </div>
      )}
      {onProofLinkChange && proofRepairLinks.length > 0 && (
        <div className="homepage-first-run-proof-repair-inputs" aria-label="First-run proof repair inputs">
          <div className="homepage-first-run-proof-repair-inputs-head">
            <span>
              <ListChecks size={14} />
              Public proof inputs
            </span>
            <strong>Replace sample proof with your public URLs</strong>
            <p>Editing here updates the live audit, release memo, and shared workspace before verification.</p>
          </div>
          <div className="homepage-first-run-proof-repair-inputs-fields">
            {proofRepairLinks.map((link) => {
              const row = liveProofRowById.get(link.id);
              const status = row?.status ?? (link.value.trim() ? "watch" : "block");
              const inputId = `first-run-proof-input-${link.id}`;
              return (
                <label key={link.id} className={status} htmlFor={inputId}>
                  <span>{link.label}</span>
                  <input
                    id={inputId}
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    value={link.value}
                    aria-invalid={status === "block" || status === "missing"}
                    placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.genericProofUrl}
                    onChange={(event) => onProofLinkChange(link.id, event.currentTarget.value)}
                  />
                  <small>{row?.action ?? "Attach a buyer-facing HTTPS URL, then run live verification."}</small>
                </label>
              );
            })}
          </div>
        </div>
      )}
      <div id="first-run-public-value-release" className={cx("homepage-first-run-public-value-release", publicValueReleaseGate.status)} aria-label="First-run public value release gate">
        <div className="homepage-first-run-public-value-release-head">
          <span>
            <Gauge size={14} />
            Public value release
          </span>
          <strong>{publicValueReleaseGate.headline}</strong>
          <p>{publicValueReleaseGate.summary}</p>
        </div>
        <aside className="homepage-first-run-public-value-release-score" aria-label="Public value release score">
          <span>{publicValueReleaseGate.label}</span>
          <strong>{publicValueReleaseGate.releaseScore}/100</strong>
          <small>Shareable {yen(publicValueReleaseGate.shareableMonthlyValueYen)}</small>
          <small>Locked {yen(publicValueReleaseGate.lockedMonthlyValueYen)}</small>
        </aside>
        <p className="homepage-first-run-public-value-release-rule">{publicValueReleaseGate.releaseRule}</p>
        <div className="homepage-first-run-public-value-release-actions" aria-label="Public value release actions">
          <button type="button" data-download-filename="first-run-public-value-release-gate.md" onClick={() => downloadTextFile("first-run-public-value-release-gate.md", publicValueReleaseGate.exportMarkdown)}>
            <Download size={13} />
            Release memo
          </button>
          <a href={snapshot.verifierAction.href} onClick={openVerifierDesk}>
            <ShieldCheck size={13} />
            Verify packet
          </a>
          {liveProofAudit ? (
            <a href={liveProofAuditReceiptHref(liveProofAudit)} onClick={openLiveProofAuditVerifier}>
              <ShieldCheck size={13} />
              Verify audit
            </a>
          ) : onVerifyProofLinks ? (
            <button type="button" onClick={onVerifyProofLinks} disabled={proofVerifyStatus === "checking"}>
              <Gauge size={13} />
              {proofAuditButtonLabel(proofVerifyStatus)}
            </button>
          ) : null}
        </div>
        <div className="homepage-first-run-public-value-release-checks" aria-label="Public value release gates">
          {publicValueReleaseGate.checks.map((check) => (
            <a key={check.id} className={check.status} href={check.href}>
              <span>{check.status}</span>
              <strong>{check.label}</strong>
              <small>{check.owner}</small>
              <p>{check.action}</p>
            </a>
          ))}
        </div>
      </div>
      <div id="first-run-reviewer-packet" className={cx("homepage-first-run-reviewer-packet", reviewerPacket.status)} aria-label="First-run reviewer packet">
        <div className="homepage-first-run-reviewer-packet-head">
          <span>
            <FileText size={14} />
            Reviewer packet
          </span>
          <strong>{reviewerPacket.headline}</strong>
          <p>{reviewerPacket.summary}</p>
        </div>
        <aside className="homepage-first-run-reviewer-packet-score" aria-label="Reviewer packet status">
          <span>{reviewerPacket.label}</span>
          <strong>{reviewerPacket.status}</strong>
          <small>{reviewerPacket.proofSummary}</small>
        </aside>
        <div className="homepage-first-run-reviewer-packet-copy" aria-label="Reviewer packet copy">
          <span>Subject</span>
          <strong>{reviewerPacket.subject}</strong>
          <p>{reviewerPacket.nextActionLine}</p>
        </div>
        <div className="homepage-first-run-reviewer-packet-actions" aria-label="Reviewer packet actions">
          <button
            type="button"
            className={cx(reviewerPacketCopyStatus === "copied" && "is-confirmed", reviewerPacketCopyStatus === "failed" && "is-risk")}
            onClick={copyReviewerPacket}
          >
            <ClipboardCheck size={13} />
            {reviewerPacketCopyStatus === "copied" ? "Copied" : reviewerPacketCopyStatus === "failed" ? "Failed" : "Copy reviewer note"}
          </button>
          <button type="button" data-download-filename="first-run-reviewer-packet.md" onClick={() => downloadTextFile("first-run-reviewer-packet.md", reviewerPacket.body)}>
            <Download size={13} />
            Export reviewer note
          </button>
        </div>
        <div className="homepage-first-run-reviewer-packet-proofs" aria-label="Reviewer packet proof links">
          {reviewerPacket.proofLines.length > 0 ? (
            reviewerPacket.proofLines.map((line) => (
              <article key={line.id} className={line.status}>
                <span>{line.status}</span>
                <strong>{line.label}</strong>
                <small>{line.value}</small>
                <p>{line.action}</p>
              </article>
            ))
          ) : (
            <article className="block">
              <span>block</span>
              <strong>Proof links</strong>
              <small>missing</small>
              <p>Attach public proof URLs before review.</p>
            </article>
          )}
        </div>
      </div>
      <div id="first-run-repair-runbook" className={cx("homepage-first-run-repair-runbook", repairRunbook.status)} aria-label="First-run live repair runbook">
        <div className="homepage-first-run-repair-runbook-head">
          <span>
            <ListChecks size={14} />
            Live repair runbook
          </span>
          <strong>{repairRunbook.headline}</strong>
          <p>{repairRunbook.summary}</p>
        </div>
        <aside className="homepage-first-run-repair-runbook-score" aria-label="Live repair runbook status">
          <span>{repairRunbook.status}</span>
          <strong>{repairRunbook.nowCount}/{repairRunbook.orderCount}</strong>
          <small>{repairRunbook.ownerLine}</small>
          <small>{repairRunbook.nextCount} follow-up checks</small>
        </aside>
        <div className="homepage-first-run-repair-runbook-actions" aria-label="Live repair runbook actions">
          <button
            type="button"
            className={cx(repairRunbookCopyStatus === "copied" && "is-confirmed", repairRunbookCopyStatus === "failed" && "is-risk")}
            onClick={copyRepairRunbook}
          >
            <ClipboardCheck size={13} />
            {repairRunbookCopyStatus === "copied" ? "Copied" : repairRunbookCopyStatus === "failed" ? "Failed" : "Copy live runbook"}
          </button>
          <button type="button" data-download-filename="first-run-live-repair-runbook.md" onClick={() => downloadTextFile("first-run-live-repair-runbook.md", repairRunbook.markdown)}>
            <Download size={13} />
            Export live runbook
          </button>
        </div>
        <div className="homepage-first-run-repair-runbook-orders" aria-label="Live repair work orders">
          {repairRunbook.orders.map((order) => (
            <article key={order.id} className={order.priority}>
              <span>{order.priority}</span>
              <strong>{order.label}</strong>
              <small>{order.owner}</small>
              <p>{order.action}</p>
              <small>Acceptance: {order.acceptance}</small>
              <a href={order.href}>
                <ExternalLink size={12} />
                Open input
              </a>
            </article>
          ))}
        </div>
      </div>
      <div id="first-run-submission-manifest" className={cx("homepage-first-run-submission-manifest", submissionManifest.status)} aria-label="First-run global public proof manifest">
        <div className="homepage-first-run-submission-manifest-head">
          <span>
            <ShieldCheck size={14} />
            Global public proof manifest
          </span>
          <strong>{submissionManifest.headline}</strong>
          <p>{submissionManifest.summary}</p>
        </div>
        <aside className="homepage-first-run-submission-manifest-score" aria-label="Global public proof manifest status">
          <span>{submissionManifest.status}</span>
          <strong>{submissionManifest.readinessScore}/100</strong>
          <small>
            {submissionManifest.readyCount}/{submissionManifest.checkTotal} proof assets ready
          </small>
          <small>{submissionManifest.nextOwner}</small>
        </aside>
        <p className="homepage-first-run-submission-manifest-next">
          Next action: {submissionManifest.nextAction}
        </p>
        <aside className={cx("homepage-first-run-submission-manifest-freshness", submissionManifest.freshnessWindow.status)} aria-label="Proof freshness window">
          <span>Proof freshness window</span>
          <strong>{submissionManifest.freshnessWindow.label}</strong>
          <small>Checked: {submissionManifest.freshnessWindow.checkedAt}</small>
          <small>Recheck before: {submissionManifest.freshnessWindow.expiresAt}</small>
          <small>{submissionManifest.freshnessWindow.receiptLine}</small>
          <p>{submissionManifest.freshnessWindow.rule} {submissionManifest.freshnessWindow.action}</p>
        </aside>
        <div className="homepage-first-run-submission-manifest-actions" aria-label="Global public proof manifest actions">
          <button
            type="button"
            className={cx(submissionManifestCopyStatus === "copied" && "is-confirmed", submissionManifestCopyStatus === "failed" && "is-risk")}
            onClick={copySubmissionManifest}
          >
            <ClipboardCheck size={13} />
            {submissionManifestCopyStatus === "copied" ? "Copied" : submissionManifestCopyStatus === "failed" ? "Failed" : "Copy manifest"}
          </button>
          <button type="button" data-download-filename="first-run-global-public-proof-manifest.md" onClick={() => downloadTextFile("first-run-global-public-proof-manifest.md", submissionManifest.markdown)}>
            <Download size={13} />
            Export manifest
          </button>
        </div>
        <div className="homepage-first-run-submission-manifest-checks" aria-label="Global public proof manifest checks">
          {submissionManifest.checks.map((check) => (
            <article key={check.id} className={check.status}>
              <span>{check.status}</span>
              <strong>{check.label}</strong>
              <small>{check.owner}</small>
              <small>{check.value}</small>
              <small>{check.evidence}</small>
              <p>{check.action}</p>
              <a href={check.href} {...routeActionAttrs({ label: check.label, href: check.href, external: isExternalHref(check.href) })}>
                <ExternalLink size={12} />
                Open evidence
              </a>
            </article>
          ))}
        </div>
      </div>
      <div id="first-run-decision-packet" className={cx("homepage-first-run-decision-packet", externalDecisionPacket.status)} aria-label="First-run external decision packet">
        <div className="homepage-first-run-decision-packet-head">
          <span>
            <FileText size={14} />
            External decision packet
          </span>
          <strong>{externalDecisionPacket.headline}</strong>
          <p>{externalDecisionPacket.summary}</p>
        </div>
        <aside className="homepage-first-run-decision-packet-score" aria-label="External decision packet status">
          <span>{externalDecisionPacket.label}</span>
          <strong>{externalDecisionPacket.status}</strong>
          <small>Recipient: {externalDecisionPacket.recipient}</small>
          <small>{externalDecisionPacket.artifactCount} artifacts attached</small>
        </aside>
        <div className="homepage-first-run-decision-packet-claim" aria-label="Safe external value claim">
          <span>Safe value claim</span>
          <strong>{externalDecisionPacket.safeValueLine}</strong>
          <p>{externalDecisionPacket.sendRule}</p>
        </div>
        <p className="homepage-first-run-decision-packet-next">
          Next ask: {externalDecisionPacket.nextAsk}
        </p>
        <div className="homepage-first-run-decision-packet-actions" aria-label="External decision packet actions">
          <button
            type="button"
            className={cx(decisionPacketCopyStatus === "copied" && "is-confirmed", decisionPacketCopyStatus === "failed" && "is-risk")}
            onClick={copyExternalDecisionPacket}
          >
            <ClipboardCheck size={13} />
            {decisionPacketCopyStatus === "copied" ? "Copied" : decisionPacketCopyStatus === "failed" ? "Failed" : "Copy decision packet"}
          </button>
          <button type="button" data-download-filename="first-run-external-decision-packet.md" onClick={() => downloadTextFile("first-run-external-decision-packet.md", externalDecisionPacket.body)}>
            <Download size={13} />
            Export decision packet
          </button>
        </div>
        <div className="homepage-first-run-decision-packet-blockers" aria-label="External decision packet blockers">
          {externalDecisionPacket.blockers.length > 0 ? (
            externalDecisionPacket.blockers.map((blocker) => (
              <article key={blocker.id} className={blocker.status}>
                <span>{blocker.status}</span>
                <strong>{blocker.label}</strong>
                <small>{blocker.owner}</small>
                <p>{blocker.action}</p>
                <a href={blocker.href} {...routeActionAttrs({ label: blocker.label, href: blocker.href, external: isExternalHref(blocker.href) })}>
                  <ExternalLink size={12} />
                  Open blocker
                </a>
              </article>
            ))
          ) : (
            <article className="ready">
              <span>ready</span>
              <strong>No send blockers</strong>
              <small>{externalDecisionPacket.recipient}</small>
              <p>{externalDecisionPacket.nextAsk}</p>
            </article>
          )}
        </div>
      </div>
      <div id="first-run-public-repair-payoff" className={cx("homepage-first-run-public-repair-payoff", publicRepairPayoff.status)} aria-label="First-run public repair payoff">
        <div className="homepage-first-run-public-repair-payoff-head">
          <span>
            <Rocket size={14} />
            Public repair payoff
          </span>
          <strong>{publicRepairPayoff.headline}</strong>
          <p>{publicRepairPayoff.summary}</p>
        </div>
        <aside className="homepage-first-run-public-repair-payoff-score" aria-label="Public repair payoff status">
          <span>{publicRepairPayoff.status}</span>
          <strong>{yen(publicRepairPayoff.lockedMonthlyValueYen)}</strong>
          <small>Locked monthly value</small>
          <small>{publicRepairPayoff.gateLine}</small>
        </aside>
        <div className="homepage-first-run-public-repair-payoff-claim" aria-label="Public repair payoff claim">
          <span>Repair payoff</span>
          <strong>{publicRepairPayoff.recoveryLine}</strong>
          <p>Next action: {publicRepairPayoff.nextAction}</p>
        </div>
        <div className="homepage-first-run-public-repair-payoff-actions" aria-label="Public repair payoff actions">
          <button
            type="button"
            className={cx(publicRepairPayoffCopyStatus === "copied" && "is-confirmed", publicRepairPayoffCopyStatus === "failed" && "is-risk")}
            onClick={copyPublicRepairPayoff}
          >
            <ClipboardCheck size={13} />
            {publicRepairPayoffCopyStatus === "copied" ? "Copied" : publicRepairPayoffCopyStatus === "failed" ? "Failed" : "Copy payoff"}
          </button>
          <button type="button" data-download-filename="first-run-public-repair-payoff.md" onClick={() => downloadTextFile("first-run-public-repair-payoff.md", publicRepairPayoff.markdown)}>
            <Download size={13} />
            Export payoff
          </button>
        </div>
        <div className="homepage-first-run-public-repair-payoff-actions-list" aria-label="Public repair payoff work items">
          {publicRepairPayoff.actions.map((action) => (
            <article key={action.id} className={action.status}>
              <span>{action.status}</span>
              <strong>{action.label}</strong>
              <small>{action.owner}</small>
              <small>{action.value}</small>
              <p>{action.action}</p>
              <small>Acceptance: {action.acceptance}</small>
              <a href={action.href} {...routeActionAttrs({ label: action.label, href: action.href, external: isExternalHref(action.href) })}>
                <ExternalLink size={12} />
                Open repair
              </a>
            </article>
          ))}
        </div>
      </div>
      <div id="first-run-repair-impact-simulation" className={cx("homepage-first-run-repair-impact-simulation", repairImpactSimulation.status)} aria-label="First-run repair impact simulator">
        <div className="homepage-first-run-repair-impact-simulation-head">
          <span>
            <Gauge size={14} />
            Repair impact simulator
          </span>
          <strong>{repairImpactSimulation.headline}</strong>
          <p>{repairImpactSimulation.summary}</p>
        </div>
        <aside className="homepage-first-run-repair-impact-simulation-score" aria-label="Repair impact simulator status">
          <span>{repairImpactSimulation.status}</span>
          <strong>{repairImpactSimulation.projectedReadinessScore}/100</strong>
          <small>
            {repairImpactSimulation.selectedCount}/{repairImpactSimulation.actionCount} repairs simulated
          </small>
          <small>
            Readiness {repairImpactSimulation.currentReadyCount}/{repairImpactSimulation.checkTotal} -&gt; {repairImpactSimulation.projectedReadyCount}/{repairImpactSimulation.checkTotal}
          </small>
        </aside>
        <div className="homepage-first-run-repair-impact-simulation-value" aria-label="Repair impact simulator projected value">
          <span>Projected value</span>
          <strong>{yen(repairImpactSimulation.projectedShareableMonthlyValueYen)}/month shareable</strong>
          <p>Locked after simulation: {yen(repairImpactSimulation.projectedLockedMonthlyValueYen)}/month</p>
        </div>
        <div className="homepage-first-run-repair-impact-simulation-rule" aria-label="Repair impact simulator decision path">
          <span>Decision path</span>
          <strong>{repairImpactSimulation.decisionLine}</strong>
          <p>Next action: {repairImpactSimulation.nextAction}</p>
        </div>
        <div className="homepage-first-run-repair-impact-simulation-acceptance" aria-label="Repair acceptance plan">
          <div>
            <span>Repair acceptance plan</span>
            <strong>{repairImpactSimulation.acceptanceHeadline}</strong>
            <p>{repairImpactSimulation.acceptanceSummary}</p>
          </div>
          <ol>
            {repairImpactSimulation.acceptanceItems.length > 0 ? (
              repairImpactSimulation.acceptanceItems.map((item) => (
                <li key={item.id} className={cx(item.status, item.selected && "selected")}>
                  <span>{item.phase}</span>
                  <strong>{item.label}</strong>
                  <small>{item.owner}</small>
                  <p>{item.acceptance}</p>
                  <small>{item.valueEffect}</small>
                  <a href={item.href} {...routeActionAttrs({ label: item.label, href: item.href, external: isExternalHref(item.href) })}>
                    <ExternalLink size={12} />
                    Open acceptance input
                  </a>
                </li>
              ))
            ) : (
              <li className="ready">
                <span>Ready</span>
                <strong>Monitor proof freshness</strong>
                <small>Proof owner</small>
                <p>Keep the global public proof manifest and live proof receipt fresh until review.</p>
              </li>
            )}
          </ol>
        </div>
        <div className="homepage-first-run-repair-impact-simulation-actions" aria-label="Repair impact simulator actions">
          <button type="button" onClick={selectAllSimulatedRepairs} disabled={repairImpactSimulation.actionCount === 0 || repairImpactSimulation.selectedCount === repairImpactSimulation.actionCount}>
            <ListChecks size={13} />
            Select all repairs
          </button>
          <button type="button" onClick={resetSimulatedRepairs} disabled={repairImpactSimulation.selectedCount === 0}>
            <Lock size={13} />
            Reset simulation
          </button>
          <button
            type="button"
            className={cx(repairImpactSimulationCopyStatus === "copied" && "is-confirmed", repairImpactSimulationCopyStatus === "failed" && "is-risk")}
            onClick={copyRepairImpactSimulation}
          >
            <ClipboardCheck size={13} />
            {repairImpactSimulationCopyStatus === "copied" ? "Copied" : repairImpactSimulationCopyStatus === "failed" ? "Failed" : "Copy simulation"}
          </button>
          <button type="button" data-download-filename="first-run-repair-impact-simulation.md" onClick={() => downloadTextFile("first-run-repair-impact-simulation.md", repairImpactSimulation.markdown)}>
            <Download size={13} />
            Export simulation
          </button>
        </div>
        <div className="homepage-first-run-repair-impact-simulation-checks" aria-label="Repair impact simulator repair toggles">
          {repairImpactSimulation.actions.length > 0 ? (
            repairImpactSimulation.actions.map((action) => (
              <article key={action.id} className={cx(action.status, action.selected && "selected")}>
                <label htmlFor={`first-run-repair-impact-${action.id}`}>
                  <input id={`first-run-repair-impact-${action.id}`} type="checkbox" checked={action.selected} onChange={() => toggleSimulatedRepair(action.id)} />
                  <span>{action.selected ? "simulated" : action.status}</span>
                  <strong>{action.label}</strong>
                </label>
                <small>{action.owner}</small>
                <small>{action.value}</small>
                <p>{action.action}</p>
                <a href={action.href} {...routeActionAttrs({ label: action.label, href: action.href, external: isExternalHref(action.href) })}>
                  <ExternalLink size={12} />
                  Open repair
                </a>
              </article>
            ))
          ) : (
            <article className="ready">
              <span>ready</span>
              <strong>No repair gates open</strong>
              <small>Keep the attached receipts fresh.</small>
              <p>{repairImpactSimulation.nextAction}</p>
            </article>
          )}
        </div>
      </div>
      <div id="first-run-decision-rehearsal" className={cx("homepage-first-run-decision-rehearsal", buyerDecisionRehearsal.status)} aria-label="First-run buyer decision rehearsal">
        <div className="homepage-first-run-decision-rehearsal-head">
          <span>
            <Scale size={14} />
            Buyer decision rehearsal
          </span>
          <strong>{buyerDecisionRehearsal.headline}</strong>
          <p>{buyerDecisionRehearsal.summary}</p>
        </div>
        <aside className="homepage-first-run-decision-rehearsal-score" aria-label="Buyer decision rehearsal status">
          <span>{buyerDecisionRehearsal.status}</span>
          <strong>{buyerDecisionRehearsal.recommendedDecision}</strong>
          <small>Recommended decision</small>
          <small>{buyerDecisionRehearsal.guardrail}</small>
        </aside>
        <div className="homepage-first-run-decision-rehearsal-rule" aria-label="Buyer decision rehearsal send rule">
          <span>Send rule</span>
          <strong>{buyerDecisionRehearsal.sendRule}</strong>
          <p>Next action: {buyerDecisionRehearsal.nextAction}</p>
        </div>
        <div className="homepage-first-run-decision-rehearsal-actions" aria-label="Buyer decision rehearsal actions">
          <button
            type="button"
            className={cx(decisionRehearsalCopyStatus === "copied" && "is-confirmed", decisionRehearsalCopyStatus === "failed" && "is-risk")}
            onClick={copyBuyerDecisionRehearsal}
          >
            <ClipboardCheck size={13} />
            {decisionRehearsalCopyStatus === "copied" ? "Copied" : decisionRehearsalCopyStatus === "failed" ? "Failed" : "Copy decision rehearsal"}
          </button>
          <button type="button" data-download-filename="first-run-buyer-decision-rehearsal.md" onClick={() => downloadTextFile("first-run-buyer-decision-rehearsal.md", buyerDecisionRehearsal.markdown)}>
            <Download size={13} />
            Export decision rehearsal
          </button>
        </div>
        <div className="homepage-first-run-decision-rehearsal-routes" aria-label="Buyer decision rehearsal routes">
          {buyerDecisionRehearsal.routes.map((route) => (
            <article key={route.id} className={route.status}>
              <span>{route.status}</span>
              <strong>{route.label}</strong>
              <small>{route.value}</small>
              <small>{route.evidence}</small>
              <p>{route.action}</p>
              <a href={route.href} {...routeActionAttrs({ label: route.label, href: route.href, external: isExternalHref(route.href) })}>
                <ExternalLink size={12} />
                Open decision route
              </a>
            </article>
          ))}
        </div>
      </div>
      {repairGuide && (
        <div className={cx("homepage-first-run-repair-guide", repairGuide.status)} aria-label="First-run proof repair guide">
          <div className="homepage-first-run-repair-guide-head">
            <span>
              <Lock size={14} />
              No-send repair
            </span>
            <strong>{repairGuide.headline}</strong>
            <p>{repairGuide.summary}</p>
          </div>
          <div className="homepage-first-run-repair-guide-owner">
            <span>{repairGuide.firstOwner}</span>
            <strong>{repairGuide.firstAction}</strong>
            <a href={repairGuide.firstInputAction.href} {...routeActionAttrs(repairGuide.firstInputAction)}>
              <ExternalLink size={13} />
              {repairGuide.firstInputAction.label}
            </a>
          </div>
          <div className="homepage-first-run-repair-guide-stats" aria-label="First-run repair stats">
            <b>{repairGuide.buyerOwnedCount}/{repairGuide.proofGateCount}</b>
            <small>buyer-owned gates</small>
            <b>{repairGuide.remainingDecisionLift}</b>
            <small>decision lift at stake</small>
            <b>{repairGuide.nowCount}/{repairGuide.nextCount}</b>
            <small>now / next</small>
          </div>
          <p className="homepage-first-run-repair-guide-rule">{repairGuide.shareRule}</p>
          <div className="homepage-first-run-repair-guide-actions" aria-label="First-run repair exports">
            <button type="button" data-download-filename={repairGuide.operatorBriefFilename} onClick={() => downloadHrefFile(repairGuide.operatorBriefFilename, repairGuide.operatorBriefAction.href)}>
              <FileText size={13} />
              {repairGuide.operatorBriefAction.label}
            </button>
            <button type="button" data-download-filename={repairGuide.workOrdersFilename} onClick={() => downloadHrefFile(repairGuide.workOrdersFilename, repairGuide.workOrdersAction.href)}>
              <ListChecks size={13} />
              {repairGuide.workOrdersAction.label}
            </button>
            <button type="button" data-download-filename={repairGuide.csvFilename} onClick={() => downloadHrefFile(repairGuide.csvFilename, repairGuide.csvAction.href)}>
              <Download size={13} />
              {repairGuide.csvAction.label}
            </button>
          </div>
          {repairGuide.tasks.length > 0 && (
            <div className="homepage-first-run-repair-guide-tasks" aria-label="First-run repair tasks">
              {repairGuide.tasks.map((task) => (
                <article key={task.id} className={task.priority}>
                  <span>{task.priority}</span>
                  <strong>{task.label}</strong>
                  <small>
                    {task.owner} / +{task.decisionLiftAtStake} / {task.proofState}
                  </small>
                  <p>{task.target}</p>
                  <a href={task.inputHref}>
                    <ExternalLink size={12} />
                    {task.inputLabel}
                  </a>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="homepage-first-run-value-proof-receipts" aria-label="First-run receipts">
        {snapshot.receipts.map((receipt) => (
          <button key={receipt.id} type="button" data-download-filename={`${receipt.receiptId}.json`} onClick={() => downloadHrefFile(`${receipt.receiptId}.json`, receipt.href)}>
            <FileText size={14} />
            <span>{receipt.label}</span>
            <strong>{receipt.receiptId}</strong>
            <small>{receipt.checksum}</small>
          </button>
        ))}
        <button type="button" data-download-filename="homepage-proof-owner-packet.md" onClick={() => downloadHrefFile("homepage-proof-owner-packet.md", snapshot.ownerPacketAction.href)}>
          <ClipboardCheck size={14} />
          <span>Owner packet</span>
          <strong>{snapshot.ownerPacketAction.label}</strong>
          <small>{snapshot.holdRule}</small>
        </button>
      </div>
      <div className="homepage-first-run-value-proof-checks" aria-label="First-run value proof checks">
        {snapshot.checks.map((check) => (
          <a key={check.id} className={check.status} href={check.href} {...routeActionAttrs({ label: check.actionLabel, href: check.href, external: isExternalHref(check.href) })}>
            <span>
              {statusIcon(check.status)}
              {check.label}
            </span>
            <strong>{check.value}</strong>
            <small>{check.evidence}</small>
          </a>
        ))}
      </div>
      </section>
    </>
  );
}

export default HomepageFirstRunValueProofCommandPanel;
