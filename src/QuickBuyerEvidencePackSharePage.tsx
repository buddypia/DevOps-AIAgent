import { CalendarDays, ClipboardCheck, Crosshair, Download, ExternalLink, FileText, Gauge, ListChecks, Radar, Send, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate";
import {
  buildQuickBuyerEvidenceValueOwnerCloseoutReceipt,
  buildQuickBuyerEvidenceValueCheckpointOwnerHandoff,
  buildQuickBuyerEvidenceValueCheckpointReceipt,
  buildQuickBuyerEvidenceValueNextWindowPacket,
  type QuickBuyerEvidenceValueCheckpointDecision
} from "./quickBuyerEvidenceValueCheckpointReceipt.js";
import {
  buildQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt,
  buildQuickBuyerEvidenceAdoptionRiskRecheckPacket,
  buildQuickBuyerEvidenceAdoptionRiskSendControlReceipt,
  buildQuickBuyerEvidenceAdoptionRiskDispositionOwnerHandoff,
  buildQuickBuyerEvidenceAdoptionRiskDispositionReceipt,
  quickBuyerEvidenceAdoptionRiskDispositionDefaultDecision,
  type QuickBuyerEvidenceAdoptionRiskDispositionDecision,
  type QuickBuyerEvidenceAdoptionRiskSendControlCriterionStatus
} from "./quickBuyerEvidenceAdoptionRiskDispositionReceipt.js";
import {
  QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM,
  decodeQuickBuyerEvidencePackShareParam
} from "./quickExternalReviewPacketShare.js";
import {
  buildQuickBuyerEvidenceAuditRepairOrder,
  buildQuickBuyerEvidenceAuditReplacementCloseout,
  buildQuickBuyerEvidenceAuditReplacementWorkspace,
  buildQuickBuyerEvidenceActivationPlan,
  buildQuickBuyerEvidenceAdoptionRiskLedger,
  buildQuickBuyerEvidenceAnswerBrief,
  buildQuickBuyerEvidenceApprovalChecklist,
  buildQuickBuyerEvidenceCommitteeMinutes,
  buildQuickBuyerEvidenceDecisionReceipt,
  buildQuickBuyerEvidenceDecisionCockpit,
  buildQuickBuyerEvidenceDecisionImpactPreview,
  buildQuickBuyerEvidenceDecisionMeetingAgenda,
  buildQuickBuyerEvidenceDecisionMemo,
  buildQuickBuyerEvidenceDisclosureBoundary,
  buildQuickBuyerEvidenceLiveAuditPlan,
  buildQuickBuyerEvidenceProcurementHandoff,
  buildQuickBuyerEvidenceValueCheckpoint,
  parseQuickBuyerEvidencePackSharePayload,
  quickBuyerEvidenceDecisionLabel,
  quickBuyerEvidenceDefaultReviewerNote,
  quickBuyerEvidenceReplacementCloseoutReviewerNote,
  quickBuyerEvidenceRecommendedDecision,
  quickBuyerEvidenceStatusLabel
} from "./quickBuyerEvidenceShare.js";
import type { QuickBuyerEvidenceLiveAuditTarget } from "./quickBuyerEvidenceShare.js";
import type { QuickExternalReviewDecision } from "./quickExternalReviewDecisionReceipt.js";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function quickBuyerEvidencePackTextFromUrl() {
  if (typeof window === "undefined") return "";
  try {
    return decodeQuickBuyerEvidencePackShareParam(new URL(window.location.href).searchParams.get(QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM));
  } catch {
    return "";
  }
}

function quickBuyerEvidenceExternalLinkAttrs(href: string) {
  return /^https?:\/\//i.test(href) ? { target: "_blank", rel: "noreferrer" } : {};
}

type QuickBuyerEvidenceLiveAuditStatus = "idle" | "checking" | "checked" | "failed";
type QuickBuyerEvidenceInlineVerificationStatus = "idle" | "checking" | "verified" | "failed";
type QuickBuyerEvidenceInlineVerificationResult = {
  status?: string;
  verified?: boolean;
  receiptType?: string;
  receiptLabel?: string;
  nativeSkill?: string;
  sourceVerifierApiPath?: string;
  error?: string;
  handoff?: {
    title?: string;
    summary?: string;
    nextAction?: string;
  };
};
type QuickBuyerEvidenceLiveAuditSummary = Omit<BuyerShareGateProofVerificationSummary, "results"> & {
  results: Array<
    BuyerShareGateProofVerificationSummary["results"][number] & {
      url?: string;
      finalUrl?: string;
      contentType?: string;
    }
  >;
};
const QUICK_BUYER_EVIDENCE_AUDIT_MAX_URL_LENGTH = 1000;

function quickBuyerEvidenceAuditUrl(href: string) {
  if (typeof window === "undefined") return href;
  try {
    return new URL(href, window.location.href).toString();
  } catch {
    return href;
  }
}

function quickBuyerEvidenceLiveAuditLabel(status: QuickBuyerEvidenceLiveAuditSummary["results"][number]["status"]) {
  if (status === "pass") return "Verified";
  if (status === "watch") return "Watch";
  return "Blocked";
}

function quickBuyerEvidenceLiveAuditClass(status: QuickBuyerEvidenceLiveAuditSummary["results"][number]["status"]) {
  if (status === "pass") return "ready";
  if (status === "watch") return "watch";
  return "blocked";
}

function quickBuyerEvidenceDefaultValueCheckpointDecision(status: "ready" | "watch" | "blocked"): QuickBuyerEvidenceValueCheckpointDecision {
  if (status === "ready") return "expand";
  if (status === "watch") return "repair";
  return "repair";
}

function quickBuyerEvidenceValueCheckpointDecisionLabel(decision: QuickBuyerEvidenceValueCheckpointDecision) {
  if (decision === "expand") return "Expand";
  if (decision === "repair") return "Repair";
  return "Hold";
}

function quickBuyerEvidenceAdoptionRiskDispositionDecisionLabel(decision: QuickBuyerEvidenceAdoptionRiskDispositionDecision) {
  if (decision === "accept-risk-ledger") return "Accept ledger";
  if (decision === "repair-open-risk") return "Repair risk";
  return "Hold send";
}

function quickBuyerEvidenceRiskControlCriterionClass(status: QuickBuyerEvidenceAdoptionRiskSendControlCriterionStatus) {
  if (status === "pass") return "ready";
  if (status === "block") return "blocked";
  return "watch";
}

function quickBuyerEvidenceRiskControlCriterionLabel(status: QuickBuyerEvidenceAdoptionRiskSendControlCriterionStatus) {
  if (status === "pass") return "Pass";
  if (status === "block") return "Block";
  return "Watch";
}

function quickBuyerEvidenceRiskControlDecisionLabel(decision: "reopen-buyer-send" | "run-risk-recheck" | "hold-buyer-send") {
  if (decision === "reopen-buyer-send") return "Reopen send";
  if (decision === "run-risk-recheck") return "Run recheck";
  return "Hold send";
}

function quickBuyerEvidenceLiveAuditTone(status: QuickBuyerEvidenceLiveAuditStatus, audit: QuickBuyerEvidenceLiveAuditSummary | null, fallback: "ready" | "watch" | "blocked") {
  if (status === "checking") return "watch";
  if (status === "failed") return "blocked";
  if (!audit) return fallback;
  if (audit.results.some((result) => result.status === "block")) return "blocked";
  if (audit.results.some((result) => result.status === "watch")) return "watch";
  return "ready";
}

function quickBuyerEvidenceLiveAuditMarkdown(audit: QuickBuyerEvidenceLiveAuditSummary) {
  return [
    "# Live buyer evidence audit",
    "",
    `Checked at: ${audit.checkedAt}`,
    `Verified: ${audit.verifiedCount}/${audit.totalCount}`,
    `Score: ${audit.score}`,
    "",
    "## Results",
    ...audit.results.map(
      (result) =>
        `- [${result.status}] ${result.label}: ${result.url ?? "URL not returned"}. ${result.evidence} Action: ${result.action}${result.httpStatus ? ` HTTP ${result.httpStatus}.` : ""}`
    )
  ].join("\n");
}

function quickBuyerEvidenceCompactAuditUrl(value: string | undefined) {
  if (!value) return "URL not returned";
  if (value.length <= 96) return value;
  try {
    const url = new URL(value);
    const route = `${url.origin}${url.pathname}`;
    return route.length <= 92 ? `${route}?...` : `${route.slice(0, 89)}...`;
  } catch {
    return `${value.slice(0, 93)}...`;
  }
}

function quickBuyerEvidenceLiveAuditSummaryFromResults(results: QuickBuyerEvidenceLiveAuditSummary["results"], checkedAt = new Date().toISOString()): QuickBuyerEvidenceLiveAuditSummary {
  const verifiedCount = results.filter((result) => result.status === "pass").length;
  const watchCount = results.filter((result) => result.status === "watch").length;
  return {
    checkedAt,
    verifiedCount,
    totalCount: results.length,
    score: Math.round(Math.max(0, Math.min(100, (verifiedCount / Math.max(1, results.length)) * 100 + watchCount * 8))),
    results
  };
}

function quickBuyerEvidenceLongUrlAuditResult(target: QuickBuyerEvidenceLiveAuditTarget, url: string): QuickBuyerEvidenceLiveAuditSummary["results"][number] {
  return {
    id: target.id,
    label: target.label,
    status: "block",
    url,
    evidence: "Audit target URL is too large to verify safely from this page.",
    action: "Open the artifact directly or regenerate the buyer pack with a shorter public evidence URL."
  };
}

type QuickBuyerEvidencePackSharePageProps = {
  payloadText?: string;
  homeHref?: string;
  responseReturnHref?: string;
};

export default function QuickBuyerEvidencePackSharePage({
  payloadText,
  homeHref = "/#quick-workflow-intake",
  responseReturnHref = homeHref
}: QuickBuyerEvidencePackSharePageProps) {
  const rawPayload = payloadText ?? quickBuyerEvidencePackTextFromUrl();
  const payload = useMemo(() => parseQuickBuyerEvidencePackSharePayload(rawPayload), [rawPayload]);
  const recommendedDecision = payload ? quickBuyerEvidenceRecommendedDecision(payload) : "revise";
  const [buyerDecision, setBuyerDecision] = useState<QuickExternalReviewDecision>(recommendedDecision);
  const [buyerReviewerName, setBuyerReviewerName] = useState("");
  const [buyerReviewerNote, setBuyerReviewerNote] = useState(() => (payload ? quickBuyerEvidenceDefaultReviewerNote(payload, recommendedDecision) : ""));
  const [liveAudit, setLiveAudit] = useState<QuickBuyerEvidenceLiveAuditSummary | null>(null);
  const [liveAuditStatus, setLiveAuditStatus] = useState<QuickBuyerEvidenceLiveAuditStatus>("idle");
  const [liveAuditError, setLiveAuditError] = useState("");
  const [replacementDraft, setReplacementDraft] = useState<Record<string, string>>({});
  const [replacementAudit, setReplacementAudit] = useState<QuickBuyerEvidenceLiveAuditSummary | null>(null);
  const [replacementAuditStatus, setReplacementAuditStatus] = useState<QuickBuyerEvidenceLiveAuditStatus>("idle");
  const [replacementAuditError, setReplacementAuditError] = useState("");
  const liveAuditPlan = useMemo(() => (payload ? buildQuickBuyerEvidenceLiveAuditPlan(payload) : null), [payload]);
  const valueCheckpoint = useMemo(() => (payload ? buildQuickBuyerEvidenceValueCheckpoint(payload) : null), [payload]);
  const adoptionRiskLedger = useMemo(() => (payload ? buildQuickBuyerEvidenceAdoptionRiskLedger(payload) : null), [payload]);
  const [valueCheckpointDecision, setValueCheckpointDecision] = useState<QuickBuyerEvidenceValueCheckpointDecision>("repair");
  const [valueCheckpointReviewerName, setValueCheckpointReviewerName] = useState("");
  const [valueCheckpointSignal, setValueCheckpointSignal] = useState("");
  const [adoptionRiskDecision, setAdoptionRiskDecision] = useState<QuickBuyerEvidenceAdoptionRiskDispositionDecision>("repair-open-risk");
  const [adoptionRiskReviewerName, setAdoptionRiskReviewerName] = useState("");
  const [adoptionRiskReviewerNote, setAdoptionRiskReviewerNote] = useState("");
  const [adoptionRiskVerifyStatus, setAdoptionRiskVerifyStatus] = useState<QuickBuyerEvidenceInlineVerificationStatus>("idle");
  const [adoptionRiskVerifyResult, setAdoptionRiskVerifyResult] = useState<QuickBuyerEvidenceInlineVerificationResult | null>(null);
  const [adoptionRiskVerifyError, setAdoptionRiskVerifyError] = useState("");
  const [adoptionRiskOwnerAcceptedBy, setAdoptionRiskOwnerAcceptedBy] = useState("");
  const [adoptionRiskOwnerEvidenceNote, setAdoptionRiskOwnerEvidenceNote] = useState("");
  const [adoptionRiskOwnerClosedTaskIds, setAdoptionRiskOwnerClosedTaskIds] = useState<Record<string, boolean>>({});
  const [adoptionRiskOwnerVerifyStatus, setAdoptionRiskOwnerVerifyStatus] = useState<QuickBuyerEvidenceInlineVerificationStatus>("idle");
  const [adoptionRiskOwnerVerifyResult, setAdoptionRiskOwnerVerifyResult] = useState<QuickBuyerEvidenceInlineVerificationResult | null>(null);
  const [adoptionRiskOwnerVerifyError, setAdoptionRiskOwnerVerifyError] = useState("");
  const [adoptionRiskSendControlVerifyStatus, setAdoptionRiskSendControlVerifyStatus] = useState<QuickBuyerEvidenceInlineVerificationStatus>("idle");
  const [adoptionRiskSendControlVerifyResult, setAdoptionRiskSendControlVerifyResult] = useState<QuickBuyerEvidenceInlineVerificationResult | null>(null);
  const [adoptionRiskSendControlVerifyError, setAdoptionRiskSendControlVerifyError] = useState("");
  const [valueOwnerAcceptedBy, setValueOwnerAcceptedBy] = useState("");
  const [valueOwnerEvidenceNote, setValueOwnerEvidenceNote] = useState("");
  const [valueOwnerClosedTaskIds, setValueOwnerClosedTaskIds] = useState<Record<string, boolean>>({});
  const [valueOwnerVerifyStatus, setValueOwnerVerifyStatus] = useState<QuickBuyerEvidenceInlineVerificationStatus>("idle");
  const [valueOwnerVerifyResult, setValueOwnerVerifyResult] = useState<QuickBuyerEvidenceInlineVerificationResult | null>(null);
  const [valueOwnerVerifyError, setValueOwnerVerifyError] = useState("");
  const liveAuditExportHref = useMemo(() => {
    if (!liveAudit) return "";
    return `data:text/markdown;charset=utf-8,${encodeURIComponent(quickBuyerEvidenceLiveAuditMarkdown(liveAudit))}`;
  }, [liveAudit]);
  const liveAuditRepairOrder = useMemo(() => (payload && liveAudit ? buildQuickBuyerEvidenceAuditRepairOrder(payload, liveAudit) : null), [liveAudit, payload]);
  const replacementWorkspace = useMemo(() => (liveAuditRepairOrder ? buildQuickBuyerEvidenceAuditReplacementWorkspace(liveAuditRepairOrder) : null), [liveAuditRepairOrder]);
  const replacementAuditExportHref = useMemo(() => {
    if (!replacementAudit) return "";
    return `data:text/markdown;charset=utf-8,${encodeURIComponent(quickBuyerEvidenceLiveAuditMarkdown(replacementAudit))}`;
  }, [replacementAudit]);
  const replacementCloseout = useMemo(
    () =>
      replacementWorkspace && replacementAudit
        ? buildQuickBuyerEvidenceAuditReplacementCloseout({
            workspace: replacementWorkspace,
            audit: replacementAudit,
            replacements: replacementDraft
          })
        : null,
    [replacementAudit, replacementDraft, replacementWorkspace]
  );
  const decisionReceipt = useMemo(
    () =>
      payload
        ? buildQuickBuyerEvidenceDecisionReceipt({
            payload,
            decision: buyerDecision,
            reviewerName: buyerReviewerName,
            reviewerNote: buyerReviewerNote,
            replacementCloseout,
            returnBaseHref: responseReturnHref
          })
        : null,
    [buyerDecision, buyerReviewerName, buyerReviewerNote, payload, replacementCloseout, responseReturnHref]
  );
  const decisionImpact = useMemo(() => (decisionReceipt ? buildQuickBuyerEvidenceDecisionImpactPreview(decisionReceipt) : null), [decisionReceipt]);
  const adoptionRiskDispositionReceipt = useMemo(
    () =>
      payload && adoptionRiskLedger
        ? buildQuickBuyerEvidenceAdoptionRiskDispositionReceipt({
            payload,
            ledger: adoptionRiskLedger,
            decision: adoptionRiskDecision,
            reviewerName: adoptionRiskReviewerName,
            reviewerNote: adoptionRiskReviewerNote
          })
        : null,
    [adoptionRiskDecision, adoptionRiskLedger, adoptionRiskReviewerName, adoptionRiskReviewerNote, payload]
  );
  const adoptionRiskOwnerHandoff = useMemo(
    () => (adoptionRiskDispositionReceipt ? buildQuickBuyerEvidenceAdoptionRiskDispositionOwnerHandoff(adoptionRiskDispositionReceipt) : null),
    [adoptionRiskDispositionReceipt]
  );
  const adoptionRiskOwnerCloseoutReceipt = useMemo(
    () =>
      adoptionRiskDispositionReceipt && adoptionRiskOwnerHandoff
        ? buildQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt({
            receipt: adoptionRiskDispositionReceipt,
            handoff: adoptionRiskOwnerHandoff,
            acceptedBy: adoptionRiskOwnerAcceptedBy,
            evidenceNote: adoptionRiskOwnerEvidenceNote,
            closedTaskIds: Object.entries(adoptionRiskOwnerClosedTaskIds)
              .filter(([, closed]) => closed)
              .map(([id]) => id)
          })
        : null,
    [adoptionRiskDispositionReceipt, adoptionRiskOwnerAcceptedBy, adoptionRiskOwnerClosedTaskIds, adoptionRiskOwnerEvidenceNote, adoptionRiskOwnerHandoff]
  );
  const adoptionRiskRecheckPacket = useMemo(
    () => (adoptionRiskOwnerCloseoutReceipt ? buildQuickBuyerEvidenceAdoptionRiskRecheckPacket(adoptionRiskOwnerCloseoutReceipt) : null),
    [adoptionRiskOwnerCloseoutReceipt]
  );
  const adoptionRiskSendControlReceipt = useMemo(
    () =>
      adoptionRiskOwnerCloseoutReceipt && adoptionRiskRecheckPacket
        ? buildQuickBuyerEvidenceAdoptionRiskSendControlReceipt({
            closeout: adoptionRiskOwnerCloseoutReceipt,
            recheck: adoptionRiskRecheckPacket
          })
        : null,
    [adoptionRiskOwnerCloseoutReceipt, adoptionRiskRecheckPacket]
  );
  const valueCheckpointReceipt = useMemo(
    () =>
      payload && valueCheckpoint
        ? buildQuickBuyerEvidenceValueCheckpointReceipt({
            payload,
            checkpoint: valueCheckpoint,
            decision: valueCheckpointDecision,
            reviewerName: valueCheckpointReviewerName,
            actualValueSignal: valueCheckpointSignal
          })
        : null,
    [payload, valueCheckpoint, valueCheckpointDecision, valueCheckpointReviewerName, valueCheckpointSignal]
  );
  const valueCheckpointOwnerHandoff = useMemo(
    () => (valueCheckpointReceipt ? buildQuickBuyerEvidenceValueCheckpointOwnerHandoff(valueCheckpointReceipt) : null),
    [valueCheckpointReceipt]
  );
  const valueOwnerCloseoutReceipt = useMemo(
    () =>
      valueCheckpointReceipt && valueCheckpointOwnerHandoff
        ? buildQuickBuyerEvidenceValueOwnerCloseoutReceipt({
            receipt: valueCheckpointReceipt,
            handoff: valueCheckpointOwnerHandoff,
            acceptedBy: valueOwnerAcceptedBy,
            evidenceNote: valueOwnerEvidenceNote,
            closedTaskIds: Object.entries(valueOwnerClosedTaskIds)
              .filter(([, closed]) => closed)
              .map(([id]) => id)
          })
        : null,
    [valueCheckpointOwnerHandoff, valueCheckpointReceipt, valueOwnerAcceptedBy, valueOwnerClosedTaskIds, valueOwnerEvidenceNote]
  );
  const valueNextWindowPacket = useMemo(
    () => (valueOwnerCloseoutReceipt ? buildQuickBuyerEvidenceValueNextWindowPacket(valueOwnerCloseoutReceipt) : null),
    [valueOwnerCloseoutReceipt]
  );

  useEffect(() => {
    if (!payload) return;
    setBuyerDecision(recommendedDecision);
    setBuyerReviewerNote(quickBuyerEvidenceDefaultReviewerNote(payload, recommendedDecision));
  }, [payload, recommendedDecision]);

  useEffect(() => {
    if (!payload || !valueCheckpoint) return;
    setValueCheckpointDecision(quickBuyerEvidenceDefaultValueCheckpointDecision(valueCheckpoint.status));
    setValueCheckpointSignal(valueCheckpoint.currentItem.evidence || valueCheckpoint.summary);
  }, [payload, valueCheckpoint]);

  useEffect(() => {
    if (!adoptionRiskLedger) return;
    setAdoptionRiskDecision(quickBuyerEvidenceAdoptionRiskDispositionDefaultDecision(adoptionRiskLedger));
    setAdoptionRiskReviewerName(adoptionRiskLedger.firstOpenRisk?.owner ?? "Buyer risk reviewer");
    setAdoptionRiskReviewerNote(adoptionRiskLedger.summary);
  }, [adoptionRiskLedger]);

  useEffect(() => {
    if (!adoptionRiskOwnerHandoff) return;
    setAdoptionRiskOwnerAcceptedBy(adoptionRiskOwnerHandoff.firstOwner);
    setAdoptionRiskOwnerEvidenceNote(adoptionRiskOwnerHandoff.summary);
    setAdoptionRiskOwnerClosedTaskIds(
      Object.fromEntries(adoptionRiskOwnerHandoff.tasks.map((task) => [task.id, task.status === "ready"]))
    );
  }, [adoptionRiskOwnerHandoff]);

  useEffect(() => {
    if (!valueCheckpointOwnerHandoff) return;
    setValueOwnerAcceptedBy(valueCheckpointOwnerHandoff.firstOwner);
    setValueOwnerEvidenceNote(valueCheckpointOwnerHandoff.summary);
    setValueOwnerClosedTaskIds(
      Object.fromEntries(valueCheckpointOwnerHandoff.tasks.map((task) => [task.id, task.status === "ready"]))
    );
  }, [valueCheckpointOwnerHandoff]);

  useEffect(() => {
    setValueOwnerVerifyStatus("idle");
    setValueOwnerVerifyResult(null);
    setValueOwnerVerifyError("");
  }, [valueOwnerCloseoutReceipt?.requestJson]);

  useEffect(() => {
    setAdoptionRiskVerifyStatus("idle");
    setAdoptionRiskVerifyResult(null);
    setAdoptionRiskVerifyError("");
  }, [adoptionRiskDispositionReceipt?.requestJson]);

  useEffect(() => {
    setAdoptionRiskOwnerVerifyStatus("idle");
    setAdoptionRiskOwnerVerifyResult(null);
    setAdoptionRiskOwnerVerifyError("");
  }, [adoptionRiskOwnerCloseoutReceipt?.requestJson]);

  useEffect(() => {
    setAdoptionRiskSendControlVerifyStatus("idle");
    setAdoptionRiskSendControlVerifyResult(null);
    setAdoptionRiskSendControlVerifyError("");
  }, [adoptionRiskSendControlReceipt?.requestJson]);

  useEffect(() => {
    setLiveAudit(null);
    setLiveAuditStatus("idle");
    setLiveAuditError("");
    setReplacementDraft({});
    setReplacementAudit(null);
    setReplacementAuditStatus("idle");
    setReplacementAuditError("");
  }, [rawPayload]);

  useEffect(() => {
    setReplacementDraft({});
    setReplacementAudit(null);
    setReplacementAuditStatus("idle");
    setReplacementAuditError("");
  }, [liveAudit]);

  async function runLiveEvidenceAudit() {
    if (!liveAuditPlan || liveAuditPlan.targets.length === 0) return;
    setLiveAuditStatus("checking");
    setLiveAuditError("");
    try {
      const clientResults = new Map<string, QuickBuyerEvidenceLiveAuditSummary["results"][number]>();
      const serverLinks = liveAuditPlan.targets.flatMap((target) => {
        const value = quickBuyerEvidenceAuditUrl(target.href);
        if (value.length > QUICK_BUYER_EVIDENCE_AUDIT_MAX_URL_LENGTH) {
          clientResults.set(target.id, quickBuyerEvidenceLongUrlAuditResult(target, value));
          return [];
        }
        return [
          {
            id: target.id,
            label: target.label,
            value
          }
        ];
      });
      if (serverLinks.length === 0) {
        const results = liveAuditPlan.targets.map((target) => clientResults.get(target.id) ?? quickBuyerEvidenceLongUrlAuditResult(target, target.href));
        setLiveAudit(quickBuyerEvidenceLiveAuditSummaryFromResults(results));
        setLiveAuditStatus("checked");
        return;
      }
      const response = await fetch("/api/proof-links/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          links: serverLinks
        })
      });
      if (!response.ok) throw new Error(`Live audit failed with HTTP ${response.status}.`);
      const result = (await response.json()) as QuickBuyerEvidenceLiveAuditSummary;
      const serverResults = new Map(result.results.map((item) => [item.id, item]));
      const results = liveAuditPlan.targets
        .map((target) => clientResults.get(target.id) ?? serverResults.get(target.id))
        .filter((item): item is QuickBuyerEvidenceLiveAuditSummary["results"][number] => Boolean(item));
      setLiveAudit(quickBuyerEvidenceLiveAuditSummaryFromResults(results, result.checkedAt));
      setLiveAuditStatus("checked");
    } catch (error) {
      setLiveAudit(null);
      setLiveAuditStatus("failed");
      setLiveAuditError(error instanceof Error ? error.message : "Live audit failed.");
    }
  }

  async function runValueOwnerCloseoutVerification() {
    if (!valueOwnerCloseoutReceipt) return;
    setValueOwnerVerifyStatus("checking");
    setValueOwnerVerifyResult(null);
    setValueOwnerVerifyError("");
    try {
      const response = await fetch("/api/receipt-verifier", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: valueOwnerCloseoutReceipt.requestJson
      });
      const body = (await response.json().catch(() => null)) as QuickBuyerEvidenceInlineVerificationResult | null;
      setValueOwnerVerifyResult(body);
      if (!response.ok || !body?.verified) {
        setValueOwnerVerifyStatus("failed");
        setValueOwnerVerifyError(body?.handoff?.nextAction || body?.error || "Closeout verifier returned a hold.");
        return;
      }
      setValueOwnerVerifyStatus("verified");
    } catch {
      setValueOwnerVerifyStatus("failed");
      setValueOwnerVerifyError("Closeout verifier could not be reached.");
    }
  }

  async function runAdoptionRiskDispositionVerification() {
    if (!adoptionRiskDispositionReceipt) return;
    setAdoptionRiskVerifyStatus("checking");
    setAdoptionRiskVerifyResult(null);
    setAdoptionRiskVerifyError("");
    try {
      const response = await fetch("/api/receipt-verifier", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: adoptionRiskDispositionReceipt.requestJson
      });
      const body = (await response.json().catch(() => null)) as QuickBuyerEvidenceInlineVerificationResult | null;
      setAdoptionRiskVerifyResult(body);
      if (!response.ok || !body?.verified) {
        setAdoptionRiskVerifyStatus("failed");
        setAdoptionRiskVerifyError(body?.handoff?.nextAction || body?.error || "Risk disposition verifier returned a hold.");
        return;
      }
      setAdoptionRiskVerifyStatus("verified");
    } catch {
      setAdoptionRiskVerifyStatus("failed");
      setAdoptionRiskVerifyError("Risk disposition verifier could not be reached.");
    }
  }

  async function runAdoptionRiskOwnerCloseoutVerification() {
    if (!adoptionRiskOwnerCloseoutReceipt) return;
    setAdoptionRiskOwnerVerifyStatus("checking");
    setAdoptionRiskOwnerVerifyResult(null);
    setAdoptionRiskOwnerVerifyError("");
    try {
      const response = await fetch("/api/receipt-verifier", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: adoptionRiskOwnerCloseoutReceipt.requestJson
      });
      const body = (await response.json().catch(() => null)) as QuickBuyerEvidenceInlineVerificationResult | null;
      setAdoptionRiskOwnerVerifyResult(body);
      if (!response.ok || !body?.verified) {
        setAdoptionRiskOwnerVerifyStatus("failed");
        setAdoptionRiskOwnerVerifyError(body?.handoff?.nextAction || body?.error || "Risk closeout verifier returned a hold.");
        return;
      }
      setAdoptionRiskOwnerVerifyStatus("verified");
    } catch {
      setAdoptionRiskOwnerVerifyStatus("failed");
      setAdoptionRiskOwnerVerifyError("Risk closeout verifier could not be reached.");
    }
  }

  async function runAdoptionRiskSendControlVerification() {
    if (!adoptionRiskSendControlReceipt) return;
    setAdoptionRiskSendControlVerifyStatus("checking");
    setAdoptionRiskSendControlVerifyResult(null);
    setAdoptionRiskSendControlVerifyError("");
    try {
      const response = await fetch("/api/receipt-verifier", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: adoptionRiskSendControlReceipt.requestJson
      });
      const body = (await response.json().catch(() => null)) as QuickBuyerEvidenceInlineVerificationResult | null;
      setAdoptionRiskSendControlVerifyResult(body);
      if (!response.ok || !body?.verified) {
        setAdoptionRiskSendControlVerifyStatus("failed");
        setAdoptionRiskSendControlVerifyError(body?.handoff?.nextAction || body?.error || "Risk control verifier returned a hold.");
        return;
      }
      setAdoptionRiskSendControlVerifyStatus("verified");
    } catch {
      setAdoptionRiskSendControlVerifyStatus("failed");
      setAdoptionRiskSendControlVerifyError("Risk control verifier could not be reached.");
    }
  }

  async function runReplacementAudit() {
    if (!replacementWorkspace || replacementWorkspace.slots.length === 0) return;
    const candidates = replacementWorkspace.slots
      .map((slot) => ({
        id: slot.id,
        label: slot.label,
        value: (replacementDraft[slot.id] ?? "").trim(),
        slot
      }))
      .filter((candidate) => candidate.value);
    if (candidates.length === 0) {
      setReplacementAudit(null);
      setReplacementAuditStatus("failed");
      setReplacementAuditError("Add at least one replacement URL before checking.");
      return;
    }
    setReplacementAuditStatus("checking");
    setReplacementAuditError("");
    try {
      const clientResults = new Map<string, QuickBuyerEvidenceLiveAuditSummary["results"][number]>();
      const serverLinks = candidates.flatMap((candidate) => {
        if (candidate.value.length > QUICK_BUYER_EVIDENCE_AUDIT_MAX_URL_LENGTH) {
          clientResults.set(candidate.id, {
            id: candidate.id,
            label: candidate.label,
            status: "block",
            url: candidate.value,
            evidence: "Replacement URL is too large to verify safely from this page.",
            action: "Use a shorter public evidence URL before reopening buyer approval."
          });
          return [];
        }
        return [{ id: candidate.id, label: candidate.label, value: candidate.value }];
      });
      if (serverLinks.length === 0) {
        const results = candidates
          .map((candidate) => clientResults.get(candidate.id))
          .filter((item): item is QuickBuyerEvidenceLiveAuditSummary["results"][number] => Boolean(item));
        setReplacementAudit(quickBuyerEvidenceLiveAuditSummaryFromResults(results));
        setReplacementAuditStatus("checked");
        return;
      }
      const response = await fetch("/api/proof-links/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ links: serverLinks })
      });
      if (!response.ok) throw new Error(`Replacement check failed with HTTP ${response.status}.`);
      const result = (await response.json()) as QuickBuyerEvidenceLiveAuditSummary;
      const serverResults = new Map(result.results.map((item) => [item.id, item]));
      const results = candidates
        .map((candidate) => clientResults.get(candidate.id) ?? serverResults.get(candidate.id))
        .filter((item): item is QuickBuyerEvidenceLiveAuditSummary["results"][number] => Boolean(item));
      setReplacementAudit(quickBuyerEvidenceLiveAuditSummaryFromResults(results, result.checkedAt));
      setReplacementAuditStatus("checked");
    } catch (error) {
      setReplacementAudit(null);
      setReplacementAuditStatus("failed");
      setReplacementAuditError(error instanceof Error ? error.message : "Replacement check failed.");
    }
  }

  function applyReplacementCloseoutToResponse() {
    if (!replacementCloseout) return;
    setBuyerDecision(replacementCloseout.canReopen ? "continue" : "revise");
    setBuyerReviewerNote(quickBuyerEvidenceReplacementCloseoutReviewerNote(replacementCloseout));
  }

  if (!payload || !liveAuditPlan || !valueCheckpoint || !adoptionRiskLedger) {
    return (
      <main className="quick-buyer-evidence-share-page blocked">
        <section className="quick-buyer-evidence-share-empty" aria-label="Buyer evidence pack missing">
          <span>
            <ClipboardCheck size={16} />
            Buyer evidence pack
          </span>
          <h1>No shared evidence pack was found</h1>
          <p>Generate a buyer room from the workflow intake, then open the Share page action from the evidence pack.</p>
          <a href={homeHref}>
            <Crosshair size={15} />
            Build evidence pack
          </a>
        </section>
      </main>
    );
  }

  const requiredArtifacts = payload.artifacts.filter((artifact) => artifact.requiredForSend);
  const operatingArtifacts = payload.artifacts.filter((artifact) => !artifact.requiredForSend);
  const decisionOptions: QuickExternalReviewDecision[] = ["continue", "revise", "stop"];
  const cockpit = buildQuickBuyerEvidenceDecisionCockpit(payload);
  const approvalChecklist = buildQuickBuyerEvidenceApprovalChecklist(payload);
  const decisionMemo = buildQuickBuyerEvidenceDecisionMemo(payload);
  const buyerProofQuestions = payload.buyerQuestions ?? [];
  const buyerProofAnswerReadyCount = buyerProofQuestions.filter((question) => question.status === "ready").length;
  const buyerAnswerBrief = buildQuickBuyerEvidenceAnswerBrief(payload);
  const disclosureBoundary = buildQuickBuyerEvidenceDisclosureBoundary(payload);
  const procurementHandoff = buildQuickBuyerEvidenceProcurementHandoff(payload);
  const decisionMeetingAgenda = buildQuickBuyerEvidenceDecisionMeetingAgenda(payload);
  const committeeMinutes = buildQuickBuyerEvidenceCommitteeMinutes(payload);
  const activationPlan = buildQuickBuyerEvidenceActivationPlan(payload);
  const adoptionRiskDecisionOptions: Array<{ id: QuickBuyerEvidenceAdoptionRiskDispositionDecision; detail: string }> = [
    { id: "accept-risk-ledger", detail: "Accept the ledger with current risk evidence." },
    { id: "repair-open-risk", detail: "Assign the first open risk before send." },
    { id: "hold-buyer-send", detail: "Hold external send until the ledger is re-exported." }
  ];
  const valueCheckpointDecisionOptions: Array<{ id: QuickBuyerEvidenceValueCheckpointDecision; detail: string }> = [
    { id: "expand", detail: "Open the next operating window." },
    { id: "repair", detail: "Assign the first open evidence repair." },
    { id: "hold", detail: "Stop expansion until evidence is re-exported." }
  ];
  const liveAuditTone = quickBuyerEvidenceLiveAuditTone(liveAuditStatus, liveAudit, liveAuditPlan.status);
  const liveAuditHeadline =
    liveAuditStatus === "checking"
      ? "Checking public evidence targets"
      : liveAuditStatus === "failed"
        ? "Live evidence audit could not finish"
        : liveAudit
          ? `${liveAudit.verifiedCount}/${liveAudit.totalCount} public targets responded`
          : liveAuditPlan.headline;
  const liveAuditSummary =
    liveAuditStatus === "failed"
      ? liveAuditError
      : liveAudit
        ? `Checked ${liveAudit.totalCount} artifact links at ${liveAudit.checkedAt}; score ${liveAudit.score}/100.`
        : liveAuditPlan.summary;
  const liveAuditButtonLabel =
    liveAuditStatus === "checking" ? "Checking" : liveAuditStatus === "checked" ? "Re-run audit" : liveAuditStatus === "failed" ? "Retry audit" : "Run live audit";
  const replacementAuditTone = replacementWorkspace ? quickBuyerEvidenceLiveAuditTone(replacementAuditStatus, replacementAudit, replacementWorkspace.status) : "blocked";
  const replacementAuditHeadline =
    replacementAuditStatus === "checking"
      ? "Checking replacement proof"
      : replacementAuditStatus === "failed"
        ? "Replacement check needs input"
        : replacementAudit
          ? `${replacementAudit.verifiedCount}/${replacementAudit.totalCount} replacements verified`
          : replacementWorkspace?.headline ?? "Check replacement proof before reopening approval";
  const replacementAuditSummary =
    replacementAuditStatus === "failed"
      ? replacementAuditError
      : replacementAudit
        ? `Checked ${replacementAudit.totalCount} replacement URL${replacementAudit.totalCount === 1 ? "" : "s"} at ${replacementAudit.checkedAt}; score ${replacementAudit.score}/100.`
        : replacementWorkspace?.summary ?? "";
  const replacementAuditButtonLabel =
    replacementAuditStatus === "checking" ? "Checking" : replacementAuditStatus === "checked" ? "Recheck replacements" : replacementAuditStatus === "failed" ? "Retry replacements" : "Verify replacements";

  return (
    <main className={cx("quick-buyer-evidence-share-page", payload.status)}>
      <section className="quick-buyer-evidence-share-hero" aria-label="Shared buyer evidence pack">
        <a className="quick-buyer-evidence-share-home" href={homeHref}>
          <Crosshair size={14} />
          Build another pack
        </a>
        <div className="quick-buyer-evidence-share-title">
          <span>
            <ClipboardCheck size={16} />
            Buyer evidence pack
          </span>
          <h1>{payload.headline}</h1>
          <p>{payload.summary}</p>
        </div>
        <div className="quick-buyer-evidence-share-strip" aria-label="Evidence pack status">
          <article>
            <span>Status</span>
            <strong>{quickBuyerEvidenceStatusLabel(payload.status)}</strong>
            <small>{payload.label}</small>
          </article>
          <article>
            <span>Buyer</span>
            <strong>{payload.buyer || "Buyer not named"}</strong>
            <small>{payload.workflow || "Workflow not included"}</small>
          </article>
          <article>
            <span>Receipt</span>
            <strong>{payload.sourceReceiptId || "Conversion receipt"}</strong>
            <small>{payload.sourceChecksum || payload.verificationApiPath}</small>
          </article>
        </div>
        <div className="quick-buyer-evidence-share-rule">
          <span>Send rule</span>
          <strong>{payload.sendRule}</strong>
        </div>
        <div className="quick-buyer-evidence-share-actions" aria-label="Shared evidence pack actions">
          <a href={payload.verifierHref} {...quickBuyerEvidenceExternalLinkAttrs(payload.verifierHref)}>
            <ShieldCheck size={15} />
            Receipt verifier
          </a>
          <a href={payload.firstAction.href} className={payload.status === "ready" ? undefined : "is-repair"} {...quickBuyerEvidenceExternalLinkAttrs(payload.firstAction.href)}>
            {payload.status === "ready" ? <ExternalLink size={15} /> : <Crosshair size={15} />}
            {payload.firstAction.label}
          </a>
        </div>
      </section>

      <section className={cx("quick-buyer-evidence-share-cockpit", cockpit.status)} aria-label="Buyer decision cockpit">
        <div className="quick-buyer-evidence-share-cockpit-main">
          <div>
            <span>
              <Gauge size={16} />
              Buyer decision cockpit
            </span>
            <strong>{cockpit.headline}</strong>
            <p>{cockpit.summary}</p>
          </div>
          <div className="quick-buyer-evidence-share-cockpit-score" aria-label="Decision confidence">
            <span>{quickBuyerEvidenceDecisionLabel(cockpit.recommendedDecision)}</span>
            <b>{cockpit.confidence}</b>
            <small>
              {cockpit.requiredReady}/{cockpit.requiredTotal} required artifacts
            </small>
          </div>
        </div>
        <div className="quick-buyer-evidence-share-cockpit-answer">
          <span>Decision question</span>
          <strong>{cockpit.primaryQuestion}</strong>
          <p>{cockpit.primaryAnswer}</p>
          <small>{cockpit.nextAction}</small>
        </div>
        <div className="quick-buyer-evidence-share-cockpit-metrics" aria-label="Buyer decision cockpit metrics">
          {cockpit.metrics.map((metric) =>
            metric.href ? (
              <a key={metric.id} href={metric.href} className={metric.status} {...quickBuyerEvidenceExternalLinkAttrs(metric.href)}>
                <span>{quickBuyerEvidenceStatusLabel(metric.status)}</span>
                <strong>{metric.label}</strong>
                <small>{metric.value}</small>
                <em>{metric.evidence}</em>
              </a>
            ) : (
              <article key={metric.id} className={metric.status}>
                <span>{quickBuyerEvidenceStatusLabel(metric.status)}</span>
                <strong>{metric.label}</strong>
                <small>{metric.value}</small>
                <em>{metric.evidence}</em>
              </article>
            )
          )}
        </div>
        <div className="quick-buyer-evidence-share-question-deck" aria-label="Buyer proof answer deck">
          <div className="quick-buyer-evidence-share-question-deck-head">
            <span>Buyer proof answers</span>
            <strong>
              {buyerProofAnswerReadyCount}/{buyerProofQuestions.length} safe to cite
            </strong>
            <p>These are the questions a buyer can answer from this shared cockpit without asking for a private walkthrough.</p>
          </div>
          <div className="quick-buyer-evidence-share-question-deck-grid">
            {buyerProofQuestions.map((question) =>
              question.href ? (
                <a key={question.id} href={question.href} className={question.status} {...quickBuyerEvidenceExternalLinkAttrs(question.href)}>
                  <span>{quickBuyerEvidenceStatusLabel(question.status)}</span>
                  <strong>{question.question}</strong>
                  <small>{question.answer}</small>
                  <em>
                    {question.owner}: {question.action || question.evidence}
                  </em>
                </a>
              ) : (
                <article key={question.id} className={question.status}>
                  <span>{quickBuyerEvidenceStatusLabel(question.status)}</span>
                  <strong>{question.question}</strong>
                  <small>{question.answer}</small>
                  <em>
                    {question.owner}: {question.action || question.evidence}
                  </em>
                </article>
              )
            )}
          </div>
        </div>
        <div className={cx("quick-buyer-evidence-share-disclosure-boundary", disclosureBoundary.status)} aria-label="Evidence disclosure boundary">
          <div className="quick-buyer-evidence-share-disclosure-boundary-head">
            <div>
              <span>
                <ShieldCheck size={15} />
                Evidence disclosure boundary
              </span>
              <strong>{disclosureBoundary.headline}</strong>
              <p>{disclosureBoundary.summary}</p>
            </div>
            <b>
              {disclosureBoundary.readyCount}/{disclosureBoundary.totalCount}
            </b>
          </div>
          <div className="quick-buyer-evidence-share-disclosure-boundary-items" aria-label="Disclosure boundary checks">
            {disclosureBoundary.items.map((item) => (
              <a key={item.id} href={item.href} className={item.status} {...quickBuyerEvidenceExternalLinkAttrs(item.href)}>
                <span>{quickBuyerEvidenceStatusLabel(item.status)}</span>
                <strong>{item.label}</strong>
                <small>{item.disclosure}</small>
                <em>
                  {item.owner}: {item.action}
                </em>
              </a>
            ))}
          </div>
          <div className="quick-buyer-evidence-share-disclosure-boundary-actions">
            <a href={disclosureBoundary.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-disclosure-boundary.md`}>
              <Download size={15} />
              Download boundary
            </a>
            <a href={disclosureBoundary.mailHref}>
              <Send size={15} />
              Email boundary
            </a>
          </div>
        </div>
        <div className={cx("quick-buyer-evidence-share-procurement-handoff", procurementHandoff.status)} aria-label="Global procurement handoff">
          <div className="quick-buyer-evidence-share-procurement-handoff-head">
            <div>
              <span>
                <ListChecks size={15} />
                Global procurement handoff
              </span>
              <strong>{procurementHandoff.headline}</strong>
              <p>{procurementHandoff.summary}</p>
            </div>
            <b>
              {procurementHandoff.readyCount}/{procurementHandoff.totalCount}
            </b>
          </div>
          <div className="quick-buyer-evidence-share-procurement-handoff-routes" aria-label="Procurement review routes">
            {procurementHandoff.routes.map((route) => (
              <a key={route.id} href={route.href} className={route.status} {...quickBuyerEvidenceExternalLinkAttrs(route.href)}>
                <span>{quickBuyerEvidenceStatusLabel(route.status)}</span>
                <strong>{route.label}</strong>
                <small>{route.reviewQuestion}</small>
                <em>{route.approvalSignal}</em>
                <small>
                  {route.owner}: {route.action}
                </small>
              </a>
            ))}
          </div>
          <div className="quick-buyer-evidence-share-procurement-handoff-actions">
            <a href={procurementHandoff.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-procurement-handoff.md`}>
              <Download size={15} />
              Download handoff
            </a>
            <a href={procurementHandoff.mailHref}>
              <Send size={15} />
              Email handoff
            </a>
          </div>
        </div>
        <div className={cx("quick-buyer-evidence-share-adoption-risk-ledger", adoptionRiskLedger.status)} aria-label="Buyer adoption risk ledger">
          <div className="quick-buyer-evidence-share-adoption-risk-ledger-head">
            <div>
              <span>
                <Radar size={15} />
                Buyer adoption risk ledger
              </span>
              <strong>{adoptionRiskLedger.headline}</strong>
              <p>{adoptionRiskLedger.summary}</p>
            </div>
            <dl>
              <div>
                <dt>Clearance</dt>
                <dd>{adoptionRiskLedger.clearanceScore}</dd>
              </div>
              <div>
                <dt>High risks</dt>
                <dd>{adoptionRiskLedger.highRiskCount}</dd>
              </div>
            </dl>
          </div>
          <div className="quick-buyer-evidence-share-adoption-risk-ledger-risks" aria-label="Adoption risk rows">
            {adoptionRiskLedger.risks.map((risk) => (
              <a key={risk.id} href={risk.href} className={risk.status} {...quickBuyerEvidenceExternalLinkAttrs(risk.href)}>
                <span>{risk.severity} risk</span>
                <strong>{risk.label}</strong>
                <small>{risk.exposure}</small>
                <em>{risk.proofRequired}</em>
                <small>
                  {risk.owner}: {risk.mitigation}
                </small>
              </a>
            ))}
          </div>
          <div className="quick-buyer-evidence-share-adoption-risk-ledger-actions">
            <a href={adoptionRiskLedger.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-adoption-risk-ledger.md`}>
              <Download size={15} />
              Download risk ledger
            </a>
            <a href={adoptionRiskLedger.csvHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-adoption-risk-ledger.csv`}>
              <FileText size={15} />
              Risk CSV
            </a>
            <a href={adoptionRiskLedger.mailHref}>
              <Send size={15} />
              Email risk ledger
            </a>
          </div>
        </div>
        {adoptionRiskDispositionReceipt && (
          <div className={cx("quick-buyer-evidence-share-adoption-risk-disposition", adoptionRiskDispositionReceipt.payload.status)} aria-label="Buyer adoption risk disposition receipt">
            <div className="quick-buyer-evidence-share-adoption-risk-disposition-head">
              <div>
                <span>
                  <ShieldCheck size={15} />
                  Risk disposition receipt
                </span>
                <strong>{quickBuyerEvidenceAdoptionRiskDispositionDecisionLabel(adoptionRiskDispositionReceipt.payload.decision)} is checksumed</strong>
                <p>{adoptionRiskDispositionReceipt.payload.nextAction}</p>
              </div>
              <dl>
                <div>
                  <dt>Disposition</dt>
                  <dd>{quickBuyerEvidenceStatusLabel(adoptionRiskDispositionReceipt.payload.status)}</dd>
                </div>
                <div>
                  <dt>Checksum</dt>
                  <dd>{adoptionRiskDispositionReceipt.checksum}</dd>
                </div>
              </dl>
            </div>
            <div className="quick-buyer-evidence-share-adoption-risk-disposition-options" role="group" aria-label="Risk disposition decision">
              {adoptionRiskDecisionOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cx(option.id === adoptionRiskDecision && "is-selected")}
                  aria-pressed={option.id === adoptionRiskDecision}
                  onClick={() => setAdoptionRiskDecision(option.id)}
                >
                  <span>{quickBuyerEvidenceAdoptionRiskDispositionDecisionLabel(option.id)}</span>
                  <small>{option.detail}</small>
                </button>
              ))}
            </div>
            <div className="quick-buyer-evidence-share-adoption-risk-disposition-fields">
              <label>
                <span>Reviewer</span>
                <input value={adoptionRiskReviewerName} onChange={(event) => setAdoptionRiskReviewerName(event.target.value)} placeholder="Buyer risk reviewer" />
              </label>
              <label>
                <span>Disposition note</span>
                <textarea value={adoptionRiskReviewerNote} onChange={(event) => setAdoptionRiskReviewerNote(event.target.value)} rows={3} />
              </label>
            </div>
            <div className="quick-buyer-evidence-share-adoption-risk-disposition-receipt">
              <article>
                <span>Source ledger</span>
                <strong>{adoptionRiskDispositionReceipt.payload.sourceLedgerHash}</strong>
                <small>
                  {adoptionRiskDispositionReceipt.payload.clearedCount}/{adoptionRiskDispositionReceipt.payload.riskTotal} risks cleared
                </small>
              </article>
              <article>
                <span>Next owner</span>
                <strong>{adoptionRiskDispositionReceipt.payload.nextOwner}</strong>
                <small>{adoptionRiskDispositionReceipt.verification.status === "verified" ? "Checksum verified in browser" : adoptionRiskDispositionReceipt.verification.instruction}</small>
              </article>
            </div>
            <div className="quick-buyer-evidence-share-adoption-risk-disposition-actions">
              <a href={adoptionRiskDispositionReceipt.requestHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-risk-disposition-receipt.json`}>
                <Download size={15} />
                Risk receipt JSON
              </a>
              <button type="button" onClick={runAdoptionRiskDispositionVerification} disabled={adoptionRiskVerifyStatus === "checking"}>
                <ShieldCheck size={15} />
                {adoptionRiskVerifyStatus === "checking" ? "Checking risk receipt" : "Verify risk receipt"}
              </button>
              <a href={adoptionRiskDispositionReceipt.verifierHref} target="_blank" rel="noreferrer">
                <ExternalLink size={15} />
                Open risk verifier
              </a>
              <a href={adoptionRiskDispositionReceipt.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-risk-disposition-receipt.md`}>
                <FileText size={15} />
                Risk receipt memo
              </a>
            </div>
            {adoptionRiskVerifyStatus !== "idle" && (
              <div
                className={cx(
                  "quick-buyer-evidence-share-adoption-risk-disposition-verifier",
                  adoptionRiskVerifyStatus === "verified" ? "ready" : adoptionRiskVerifyStatus === "checking" ? "watch" : "blocked"
                )}
                aria-label="Risk disposition inline verification"
                aria-live="polite"
              >
                <span>{adoptionRiskVerifyStatus === "verified" ? "Verified" : adoptionRiskVerifyStatus === "checking" ? "Checking" : "Needs attention"}</span>
                <strong>
                  {adoptionRiskVerifyStatus === "verified"
                    ? "Risk disposition verified by the desk"
                    : adoptionRiskVerifyStatus === "checking"
                      ? "Checking the exported risk disposition receipt"
                      : "Risk disposition receipt is held"}
                </strong>
                <small>
                  {adoptionRiskVerifyStatus === "verified"
                    ? `${adoptionRiskVerifyResult?.receiptLabel || "Buyer adoption risk disposition"} matched ${
                        adoptionRiskVerifyResult?.sourceVerifierApiPath || "/api/receipt-verifier"
                      }.`
                    : adoptionRiskVerifyError || adoptionRiskVerifyResult?.handoff?.nextAction || "Verifier is checking this risk disposition receipt."}
                </small>
              </div>
            )}
          </div>
        )}
        {adoptionRiskOwnerHandoff && (
          <div className={cx("quick-buyer-evidence-share-adoption-risk-handoff", adoptionRiskOwnerHandoff.status)} aria-label="Risk disposition owner handoff">
            <div className="quick-buyer-evidence-share-adoption-risk-handoff-head">
              <div>
                <span>
                  <ListChecks size={15} />
                  Risk disposition owner handoff
                </span>
                <strong>{adoptionRiskOwnerHandoff.headline}</strong>
                <p>{adoptionRiskOwnerHandoff.summary}</p>
              </div>
              <dl>
                <div>
                  <dt>Tasks</dt>
                  <dd>
                    {adoptionRiskOwnerHandoff.readyCount}/{adoptionRiskOwnerHandoff.taskTotal}
                  </dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>{adoptionRiskOwnerHandoff.firstOwner}</dd>
                </div>
              </dl>
            </div>
            <div className="quick-buyer-evidence-share-adoption-risk-handoff-tasks" aria-label="Risk owner handoff tasks">
              {adoptionRiskOwnerHandoff.tasks.map((task) => (
                <a key={task.id} href={task.href} className={task.status} {...quickBuyerEvidenceExternalLinkAttrs(task.href)}>
                  <span>{task.dueLabel}</span>
                  <strong>{task.label}</strong>
                  <small>
                    {task.owner}: {task.action}
                  </small>
                  <em>{task.closeCondition}</em>
                  <small>{task.evidence}</small>
                </a>
              ))}
            </div>
            <div className="quick-buyer-evidence-share-adoption-risk-handoff-actions">
              <a href={adoptionRiskOwnerHandoff.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-risk-owner-handoff.md`}>
                <Download size={15} />
                Owner handoff
              </a>
              <a href={adoptionRiskOwnerHandoff.csvHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-risk-owner-handoff.csv`}>
                <FileText size={15} />
                Handoff CSV
              </a>
              <a href={adoptionRiskOwnerHandoff.calendarHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-risk-owner-handoff.ics`}>
                <CalendarDays size={15} />
                Handoff calendar
              </a>
              <a href={adoptionRiskOwnerHandoff.mailHref}>
                <Send size={15} />
                Email risk owner
              </a>
            </div>
          </div>
        )}
        {adoptionRiskOwnerHandoff && adoptionRiskOwnerCloseoutReceipt && (
          <div
            className={cx("quick-buyer-evidence-share-value-owner-closeout quick-buyer-evidence-share-adoption-risk-owner-closeout", adoptionRiskOwnerCloseoutReceipt.payload.status)}
            aria-label="Risk owner closeout receipt"
          >
            <div className="quick-buyer-evidence-share-value-owner-closeout-head">
              <div>
                <span>
                  <ClipboardCheck size={15} />
                  Risk owner closeout receipt
                </span>
                <strong>
                  {adoptionRiskOwnerCloseoutReceipt.payload.status === "ready"
                    ? "Risk owner work is closed and ready for buyer-send recheck"
                    : "Buyer send stays held until risk owner evidence is closed"}
                </strong>
                <p>{adoptionRiskOwnerCloseoutReceipt.payload.nextAction}</p>
              </div>
              <dl>
                <div>
                  <dt>Closed tasks</dt>
                  <dd>
                    {adoptionRiskOwnerCloseoutReceipt.payload.closedTaskCount}/{adoptionRiskOwnerCloseoutReceipt.payload.taskCount}
                  </dd>
                </div>
                <div>
                  <dt>Next owner</dt>
                  <dd>{adoptionRiskOwnerCloseoutReceipt.payload.nextOwner}</dd>
                </div>
              </dl>
            </div>
            <div className="quick-buyer-evidence-share-value-owner-closeout-fields">
              <label>
                <span>Accepted by</span>
                <input value={adoptionRiskOwnerAcceptedBy} onChange={(event) => setAdoptionRiskOwnerAcceptedBy(event.target.value)} placeholder={adoptionRiskOwnerHandoff.firstOwner} />
              </label>
              <label>
                <span>Evidence note</span>
                <textarea value={adoptionRiskOwnerEvidenceNote} onChange={(event) => setAdoptionRiskOwnerEvidenceNote(event.target.value)} rows={3} />
              </label>
            </div>
            <div className="quick-buyer-evidence-share-value-owner-closeout-tasks" aria-label="Risk owner closeout tasks">
              {adoptionRiskOwnerHandoff.tasks.map((task) => {
                const closed = Boolean(adoptionRiskOwnerClosedTaskIds[task.id]);
                return (
                  <label key={task.id} className={cx(closed && "is-closed", !closed && task.status)}>
                    <input
                      type="checkbox"
                      checked={closed}
                      onChange={(event) =>
                        setAdoptionRiskOwnerClosedTaskIds((current) => ({
                          ...current,
                          [task.id]: event.target.checked
                        }))
                      }
                    />
                    <span>{task.dueLabel}</span>
                    <strong>{task.label}</strong>
                    <small>
                      {task.owner}: {task.closeCondition}
                    </small>
                  </label>
                );
              })}
            </div>
            <div className="quick-buyer-evidence-share-value-owner-closeout-actions">
              <a href={adoptionRiskOwnerCloseoutReceipt.requestHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-risk-owner-closeout-receipt.json`}>
                <Download size={15} />
                Risk closeout JSON
              </a>
              <button type="button" onClick={runAdoptionRiskOwnerCloseoutVerification} disabled={adoptionRiskOwnerVerifyStatus === "checking"}>
                <ShieldCheck size={15} />
                {adoptionRiskOwnerVerifyStatus === "checking" ? "Checking risk closeout" : "Verify risk closeout"}
              </button>
              <a href={adoptionRiskOwnerCloseoutReceipt.verifierHref} target="_blank" rel="noreferrer">
                <ExternalLink size={15} />
                Open risk closeout verifier
              </a>
              <a href={adoptionRiskOwnerCloseoutReceipt.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-risk-owner-closeout-receipt.md`}>
                <FileText size={15} />
                Risk closeout memo
              </a>
            </div>
            {adoptionRiskOwnerVerifyStatus !== "idle" && (
              <div
                className={cx(
                  "quick-buyer-evidence-share-value-owner-closeout-verifier",
                  adoptionRiskOwnerVerifyStatus === "verified" ? "ready" : adoptionRiskOwnerVerifyStatus === "checking" ? "watch" : "blocked"
                )}
                aria-label="Risk owner closeout inline verification"
                aria-live="polite"
              >
                <span>{adoptionRiskOwnerVerifyStatus === "verified" ? "Verified" : adoptionRiskOwnerVerifyStatus === "checking" ? "Checking" : "Needs attention"}</span>
                <strong>
                  {adoptionRiskOwnerVerifyStatus === "verified"
                    ? "Risk closeout verified by the desk"
                    : adoptionRiskOwnerVerifyStatus === "checking"
                      ? "Checking the exported risk owner closeout receipt"
                      : "Risk closeout receipt is held"}
                </strong>
                <small>
                  {adoptionRiskOwnerVerifyStatus === "verified"
                    ? `${adoptionRiskOwnerVerifyResult?.receiptLabel || "Buyer adoption risk owner closeout"} matched ${
                        adoptionRiskOwnerVerifyResult?.sourceVerifierApiPath || "/api/receipt-verifier"
                      }.`
                    : adoptionRiskOwnerVerifyError || adoptionRiskOwnerVerifyResult?.handoff?.nextAction || "Verifier is checking this risk owner closeout receipt."}
                </small>
              </div>
            )}
          </div>
        )}
        {adoptionRiskRecheckPacket && (
          <div className={cx("quick-buyer-evidence-share-value-next-window quick-buyer-evidence-share-adoption-risk-recheck", adoptionRiskRecheckPacket.status)} aria-label="Risk recheck packet">
            <div className="quick-buyer-evidence-share-value-next-window-head">
              <div>
                <span>
                  <Radar size={15} />
                  Risk recheck packet
                </span>
                <strong>{adoptionRiskRecheckPacket.headline}</strong>
                <p>{adoptionRiskRecheckPacket.summary}</p>
              </div>
              <dl>
                <div>
                  <dt>Window</dt>
                  <dd>
                    {adoptionRiskRecheckPacket.startDate} to {adoptionRiskRecheckPacket.endDate}
                  </dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>{adoptionRiskRecheckPacket.currentOwner}</dd>
                </div>
              </dl>
            </div>
            <div className="quick-buyer-evidence-share-value-next-window-steps" aria-label="Risk recheck steps">
              {adoptionRiskRecheckPacket.steps.map((step) => (
                <a key={step.id} href={step.href} className={step.status} {...quickBuyerEvidenceExternalLinkAttrs(step.href)}>
                  <span>Day {step.dayOffset}</span>
                  <strong>{step.label}</strong>
                  <small>
                    {step.owner}: {step.action}
                  </small>
                  <em>{step.closeCondition}</em>
                </a>
              ))}
            </div>
            <div className="quick-buyer-evidence-share-value-next-window-actions">
              <a href={adoptionRiskRecheckPacket.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-risk-recheck.md`}>
                <Download size={15} />
                Recheck memo
              </a>
              <a href={adoptionRiskRecheckPacket.calendarHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-risk-recheck.ics`}>
                <CalendarDays size={15} />
                Recheck calendar
              </a>
              <a href={adoptionRiskRecheckPacket.mailHref}>
                <Send size={15} />
                Email recheck owner
              </a>
            </div>
          </div>
        )}
        {adoptionRiskSendControlReceipt && (
          <div
            className={cx("quick-buyer-evidence-share-risk-send-control", adoptionRiskSendControlReceipt.payload.status)}
            aria-label="Buyer-send risk control"
          >
            <div className="quick-buyer-evidence-share-risk-send-control-head">
              <div>
                <span>
                  <ShieldCheck size={15} />
                  Buyer-send risk control
                </span>
                <strong>
                  {adoptionRiskSendControlReceipt.payload.decision === "reopen-buyer-send"
                    ? "Risk controls clear buyer send"
                    : adoptionRiskSendControlReceipt.payload.decision === "run-risk-recheck"
                      ? "Run the final risk recheck before buyer send"
                      : "Buyer send stays held by risk control"}
                </strong>
                <p>{adoptionRiskSendControlReceipt.payload.stopRule}</p>
              </div>
              <dl>
                <div>
                  <dt>Decision</dt>
                  <dd>{quickBuyerEvidenceRiskControlDecisionLabel(adoptionRiskSendControlReceipt.payload.decision)}</dd>
                </div>
                <div>
                  <dt>Next owner</dt>
                  <dd>{adoptionRiskSendControlReceipt.payload.nextOwner}</dd>
                </div>
              </dl>
            </div>
            <div className="quick-buyer-evidence-share-risk-send-control-next" aria-label="Risk control next action">
              <span>{quickBuyerEvidenceStatusLabel(adoptionRiskSendControlReceipt.payload.status)}</span>
              <strong>{adoptionRiskSendControlReceipt.payload.nextAction}</strong>
              <small>
                Recheck window {adoptionRiskSendControlReceipt.payload.recheckStartDate} to {adoptionRiskSendControlReceipt.payload.recheckEndDate} /
                receipt fnv1a32:{adoptionRiskSendControlReceipt.checksum}
              </small>
            </div>
            <div className="quick-buyer-evidence-share-risk-send-control-criteria" aria-label="Risk control criteria">
              {adoptionRiskSendControlReceipt.payload.criteria.map((criterion) => (
                <a
                  key={criterion.id}
                  href={criterion.href}
                  className={quickBuyerEvidenceRiskControlCriterionClass(criterion.status)}
                  {...quickBuyerEvidenceExternalLinkAttrs(criterion.href)}
                >
                  <span>{quickBuyerEvidenceRiskControlCriterionLabel(criterion.status)}</span>
                  <strong>{criterion.label}</strong>
                  <small>
                    {criterion.owner}: {criterion.action}
                  </small>
                  <em>{criterion.closeCondition}</em>
                </a>
              ))}
            </div>
            <div className="quick-buyer-evidence-share-risk-send-control-actions">
              <a href={adoptionRiskSendControlReceipt.requestHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-risk-send-control.json`}>
                <Download size={15} />
                Risk control JSON
              </a>
              <button type="button" onClick={runAdoptionRiskSendControlVerification} disabled={adoptionRiskSendControlVerifyStatus === "checking"}>
                <ShieldCheck size={15} />
                {adoptionRiskSendControlVerifyStatus === "checking" ? "Checking risk control" : "Verify risk control"}
              </button>
              <a href={adoptionRiskSendControlReceipt.verifierHref} target="_blank" rel="noreferrer">
                <ExternalLink size={15} />
                Open risk control verifier
              </a>
              <a href={adoptionRiskSendControlReceipt.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-risk-send-control.md`}>
                <FileText size={15} />
                Risk control memo
              </a>
            </div>
            {adoptionRiskSendControlVerifyStatus !== "idle" && (
              <div
                className={cx(
                  "quick-buyer-evidence-share-risk-send-control-verifier",
                  adoptionRiskSendControlVerifyStatus === "verified" ? "ready" : adoptionRiskSendControlVerifyStatus === "checking" ? "watch" : "blocked"
                )}
                aria-label="Risk control inline verification"
                aria-live="polite"
              >
                <span>{adoptionRiskSendControlVerifyStatus === "verified" ? "Verified" : adoptionRiskSendControlVerifyStatus === "checking" ? "Checking" : "Needs attention"}</span>
                <strong>
                  {adoptionRiskSendControlVerifyStatus === "verified"
                    ? "Risk control verified by the desk"
                    : adoptionRiskSendControlVerifyStatus === "checking"
                      ? "Checking the exported buyer-send risk control"
                      : "Risk control receipt is held"}
                </strong>
                <small>
                  {adoptionRiskSendControlVerifyStatus === "verified"
                    ? `${adoptionRiskSendControlVerifyResult?.receiptLabel || "Buyer-send adoption risk control"} matched ${
                        adoptionRiskSendControlVerifyResult?.sourceVerifierApiPath || "/api/receipt-verifier"
                      }.`
                    : adoptionRiskSendControlVerifyError || adoptionRiskSendControlVerifyResult?.handoff?.nextAction || "Verifier is checking this risk control receipt."}
                </small>
              </div>
            )}
          </div>
        )}
        <div className={cx("quick-buyer-evidence-share-meeting-agenda", decisionMeetingAgenda.status)} aria-label="Buyer decision meeting agenda">
          <div className="quick-buyer-evidence-share-meeting-agenda-head">
            <div>
              <span>
                <CalendarDays size={15} />
                Buyer decision meeting agenda
              </span>
              <strong>{decisionMeetingAgenda.headline}</strong>
              <p>{decisionMeetingAgenda.summary}</p>
            </div>
            <dl>
              <div>
                <dt>Duration</dt>
                <dd>{decisionMeetingAgenda.totalDurationMinutes} min</dd>
              </div>
              <div>
                <dt>Ready</dt>
                <dd>
                  {decisionMeetingAgenda.readyCount}/{decisionMeetingAgenda.totalCount}
                </dd>
              </div>
            </dl>
          </div>
          <div className="quick-buyer-evidence-share-meeting-agenda-items" aria-label="Decision meeting agenda items">
            {decisionMeetingAgenda.items.map((item) => (
              <a key={item.id} href={item.href} className={item.status} {...quickBuyerEvidenceExternalLinkAttrs(item.href)}>
                <span>{item.durationMinutes} min</span>
                <strong>{item.label}</strong>
                <small>{item.objective}</small>
                <em>{item.decisionPrompt}</em>
                <small>
                  {item.owner}: {item.action}
                </small>
              </a>
            ))}
          </div>
          <div className="quick-buyer-evidence-share-meeting-agenda-actions">
            <a href={decisionMeetingAgenda.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-decision-meeting-agenda.md`}>
              <Download size={15} />
              Download agenda
            </a>
            <a href={decisionMeetingAgenda.mailHref}>
              <Send size={15} />
              Email agenda
            </a>
          </div>
        </div>
        <div className={cx("quick-buyer-evidence-share-committee-minutes", committeeMinutes.status)} aria-label="Buyer committee minutes">
          <div className="quick-buyer-evidence-share-committee-minutes-head">
            <div>
              <span>
                <FileText size={15} />
                Buyer committee minutes
              </span>
              <strong>{committeeMinutes.headline}</strong>
              <p>{committeeMinutes.summary}</p>
            </div>
            <dl>
              <div>
                <dt>Decision</dt>
                <dd>{quickBuyerEvidenceDecisionLabel(committeeMinutes.decision)}</dd>
              </div>
              <div>
                <dt>Ready</dt>
                <dd>
                  {committeeMinutes.readyCount}/{committeeMinutes.totalCount}
                </dd>
              </div>
            </dl>
          </div>
          <div className="quick-buyer-evidence-share-committee-minutes-attendees" aria-label="Committee owners">
            {committeeMinutes.attendees.map((attendee) => (
              <span key={attendee.id} className={attendee.status}>
                {attendee.label}: {attendee.owner}
              </span>
            ))}
          </div>
          <div className="quick-buyer-evidence-share-committee-minutes-decisions" aria-label="Committee decision records">
            {committeeMinutes.decisions.map((decision) => (
              <a key={decision.id} href={decision.href} className={decision.status} {...quickBuyerEvidenceExternalLinkAttrs(decision.href)}>
                <span>{quickBuyerEvidenceStatusLabel(decision.status)}</span>
                <strong>{decision.label}</strong>
                <small>{decision.value}</small>
                <em>{decision.evidence}</em>
                <small>{decision.action}</small>
              </a>
            ))}
          </div>
          <div className="quick-buyer-evidence-share-committee-minutes-actions">
            <a href={committeeMinutes.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-committee-minutes.md`}>
              <Download size={15} />
              Download minutes
            </a>
            <a href={committeeMinutes.mailHref}>
              <Send size={15} />
              Email minutes
            </a>
          </div>
        </div>
        <div className={cx("quick-buyer-evidence-share-activation-plan", activationPlan.status)} aria-label="Buyer activation plan">
          <div className="quick-buyer-evidence-share-activation-plan-head">
            <div>
              <span>
                <CalendarDays size={15} />
                Buyer activation plan
              </span>
              <strong>{activationPlan.headline}</strong>
              <p>{activationPlan.summary}</p>
            </div>
            <dl>
              <div>
                <dt>Window</dt>
                <dd>
                  {activationPlan.startDate} to {activationPlan.endDate}
                </dd>
              </div>
              <div>
                <dt>Current owner</dt>
                <dd>{activationPlan.currentStep.owner}</dd>
              </div>
            </dl>
          </div>
          <div className="quick-buyer-evidence-share-activation-plan-steps" aria-label="Activation plan steps">
            {activationPlan.steps.map((step) => (
              <a key={step.id} href={step.href} className={step.status} {...quickBuyerEvidenceExternalLinkAttrs(step.href)}>
                <span>Day {step.dayOffset}</span>
                <strong>{step.label}</strong>
                <small>{step.objective}</small>
                <em>{step.closeCondition}</em>
                <small>
                  {step.owner}: {step.action}
                </small>
              </a>
            ))}
          </div>
          <div className="quick-buyer-evidence-share-activation-plan-actions">
            <a href={activationPlan.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-activation-plan.md`}>
              <Download size={15} />
              Download activation
            </a>
            <a href={activationPlan.calendarHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-activation.ics`}>
              <CalendarDays size={15} />
              Activation calendar
            </a>
            <a href={activationPlan.mailHref}>
              <Send size={15} />
              Email activation
            </a>
          </div>
        </div>
        <div className={cx("quick-buyer-evidence-share-value-checkpoint", valueCheckpoint.status)} aria-label="Buyer value checkpoint">
          <div className="quick-buyer-evidence-share-value-checkpoint-head">
            <div>
              <span>
                <Gauge size={15} />
                Buyer value checkpoint
              </span>
              <strong>{valueCheckpoint.headline}</strong>
              <p>{valueCheckpoint.summary}</p>
            </div>
            <dl>
              <div>
                <dt>Ready checks</dt>
                <dd>
                  {valueCheckpoint.readyCount}/{valueCheckpoint.totalCount}
                </dd>
              </div>
              <div>
                <dt>First owner</dt>
                <dd>{valueCheckpoint.currentItem.owner}</dd>
              </div>
            </dl>
          </div>
          <div className="quick-buyer-evidence-share-value-checkpoint-items" aria-label="Value checkpoint items">
            {valueCheckpoint.items.map((item) => (
              <a key={item.id} href={item.href} className={item.status} {...quickBuyerEvidenceExternalLinkAttrs(item.href)}>
                <span>{quickBuyerEvidenceStatusLabel(item.status)}</span>
                <strong>{item.label}</strong>
                <small>{item.metric}</small>
                <em>{item.target}</em>
                <small>
                  {item.owner}: {item.action}
                </small>
              </a>
            ))}
          </div>
          <div className="quick-buyer-evidence-share-value-checkpoint-actions">
            <a href={valueCheckpoint.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-value-checkpoint.md`}>
              <Download size={15} />
              Download checkpoint
            </a>
            <a href={valueCheckpoint.csvHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-value-checkpoint.csv`}>
              <FileText size={15} />
              Checkpoint CSV
            </a>
            <a href={valueCheckpoint.mailHref}>
              <Send size={15} />
              Email checkpoint
            </a>
          </div>
        </div>
        {valueCheckpointReceipt && (
          <div className={cx("quick-buyer-evidence-share-value-closeout", valueCheckpointReceipt.payload.status)} aria-label="Buyer value checkpoint receipt">
            <div className="quick-buyer-evidence-share-value-closeout-head">
              <div>
                <span>
                  <ShieldCheck size={15} />
                  Value checkpoint receipt
                </span>
                <strong>{quickBuyerEvidenceValueCheckpointDecisionLabel(valueCheckpointReceipt.payload.decision)} value decision is checksumed</strong>
                <p>{valueCheckpointReceipt.payload.nextAction}</p>
              </div>
              <dl>
                <div>
                  <dt>Receipt status</dt>
                  <dd>{quickBuyerEvidenceStatusLabel(valueCheckpointReceipt.payload.status)}</dd>
                </div>
                <div>
                  <dt>Checksum</dt>
                  <dd>{valueCheckpointReceipt.checksum}</dd>
                </div>
              </dl>
            </div>
            <div className="quick-buyer-evidence-share-value-closeout-options" role="group" aria-label="Value checkpoint decision">
              {valueCheckpointDecisionOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cx(option.id === valueCheckpointDecision && "is-selected")}
                  aria-pressed={option.id === valueCheckpointDecision}
                  onClick={() => setValueCheckpointDecision(option.id)}
                >
                  <span>{quickBuyerEvidenceValueCheckpointDecisionLabel(option.id)}</span>
                  <small>{option.detail}</small>
                </button>
              ))}
            </div>
            <div className="quick-buyer-evidence-share-value-closeout-fields">
              <label>
                <span>Reviewer</span>
                <input value={valueCheckpointReviewerName} onChange={(event) => setValueCheckpointReviewerName(event.target.value)} placeholder="Buyer value reviewer" />
              </label>
              <label>
                <span>Actual value signal</span>
                <textarea value={valueCheckpointSignal} onChange={(event) => setValueCheckpointSignal(event.target.value)} rows={3} />
              </label>
            </div>
            <div className="quick-buyer-evidence-share-value-closeout-receipt">
              <article>
                <span>Source pack</span>
                <strong>{valueCheckpointReceipt.payload.sourceReceiptId}</strong>
                <small>{valueCheckpointReceipt.payload.sourceChecksum}</small>
              </article>
              <article>
                <span>Next owner</span>
                <strong>{valueCheckpointReceipt.payload.nextOwner}</strong>
                <small>{valueCheckpointReceipt.verification.status === "verified" ? "Checksum verified in browser" : valueCheckpointReceipt.verification.instruction}</small>
              </article>
            </div>
            <div className="quick-buyer-evidence-share-value-closeout-actions">
              <a href={valueCheckpointReceipt.requestHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-value-checkpoint-receipt.json`}>
                <Download size={15} />
                Checkpoint receipt JSON
              </a>
              <a href={valueCheckpointReceipt.verifierHref} target="_blank" rel="noreferrer">
                <ShieldCheck size={15} />
                Verify checkpoint
              </a>
              <a href={valueCheckpointReceipt.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-value-checkpoint-receipt.md`}>
                <FileText size={15} />
                Receipt memo
              </a>
            </div>
          </div>
        )}
        {valueCheckpointOwnerHandoff && (
          <div className={cx("quick-buyer-evidence-share-value-handoff", valueCheckpointOwnerHandoff.status)} aria-label="Buyer value checkpoint owner handoff">
            <div className="quick-buyer-evidence-share-value-handoff-head">
              <div>
                <span>
                  <ListChecks size={15} />
                  Value checkpoint owner handoff
                </span>
                <strong>{valueCheckpointOwnerHandoff.headline}</strong>
                <p>{valueCheckpointOwnerHandoff.summary}</p>
              </div>
              <dl>
                <div>
                  <dt>Owner tasks</dt>
                  <dd>
                    {valueCheckpointOwnerHandoff.readyCount}/{valueCheckpointOwnerHandoff.taskTotal}
                  </dd>
                </div>
                <div>
                  <dt>First owner</dt>
                  <dd>{valueCheckpointOwnerHandoff.firstOwner}</dd>
                </div>
              </dl>
            </div>
            <div className="quick-buyer-evidence-share-value-handoff-tasks" aria-label="Value checkpoint owner tasks">
              {valueCheckpointOwnerHandoff.tasks.map((task) => (
                <a key={task.id} href={task.href} className={task.status} {...quickBuyerEvidenceExternalLinkAttrs(task.href)}>
                  <span>{task.dueLabel}</span>
                  <strong>{task.label}</strong>
                  <small>
                    {task.owner}: {task.action}
                  </small>
                  <em>{task.closeCondition}</em>
                </a>
              ))}
            </div>
            <div className="quick-buyer-evidence-share-value-handoff-actions">
              <a href={valueCheckpointOwnerHandoff.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-value-owner-handoff.md`}>
                <Download size={15} />
                Owner handoff
              </a>
              <a href={valueCheckpointOwnerHandoff.csvHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-value-owner-handoff.csv`}>
                <FileText size={15} />
                Handoff CSV
              </a>
              <a href={valueCheckpointOwnerHandoff.calendarHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-value-owner-handoff.ics`}>
                <CalendarDays size={15} />
                Handoff calendar
              </a>
              <a href={valueCheckpointOwnerHandoff.mailHref}>
                <Send size={15} />
                Email value owner
              </a>
            </div>
          </div>
        )}
        {valueCheckpointOwnerHandoff && valueOwnerCloseoutReceipt && (
          <div className={cx("quick-buyer-evidence-share-value-owner-closeout", valueOwnerCloseoutReceipt.payload.status)} aria-label="Buyer value owner closeout receipt">
            <div className="quick-buyer-evidence-share-value-owner-closeout-head">
              <div>
                <span>
                  <ClipboardCheck size={15} />
                  Value owner closeout receipt
                </span>
                <strong>
                  {valueOwnerCloseoutReceipt.payload.status === "ready"
                    ? "Owner work is closed and ready for the next value window"
                    : "Owner work stays held until open evidence is closed"}
                </strong>
                <p>{valueOwnerCloseoutReceipt.payload.nextAction}</p>
              </div>
              <dl>
                <div>
                  <dt>Closed tasks</dt>
                  <dd>
                    {valueOwnerCloseoutReceipt.payload.closedTaskCount}/{valueOwnerCloseoutReceipt.payload.taskCount}
                  </dd>
                </div>
                <div>
                  <dt>Next owner</dt>
                  <dd>{valueOwnerCloseoutReceipt.payload.nextOwner}</dd>
                </div>
              </dl>
            </div>
            <div className="quick-buyer-evidence-share-value-owner-closeout-fields">
              <label>
                <span>Accepted by</span>
                <input value={valueOwnerAcceptedBy} onChange={(event) => setValueOwnerAcceptedBy(event.target.value)} placeholder={valueCheckpointOwnerHandoff.firstOwner} />
              </label>
              <label>
                <span>Evidence note</span>
                <textarea value={valueOwnerEvidenceNote} onChange={(event) => setValueOwnerEvidenceNote(event.target.value)} rows={3} />
              </label>
            </div>
            <div className="quick-buyer-evidence-share-value-owner-closeout-tasks" aria-label="Value owner closeout tasks">
              {valueCheckpointOwnerHandoff.tasks.map((task) => {
                const closed = Boolean(valueOwnerClosedTaskIds[task.id]);
                return (
                  <label key={task.id} className={cx(closed && "is-closed", !closed && task.status)}>
                    <input
                      type="checkbox"
                      checked={closed}
                      onChange={(event) =>
                        setValueOwnerClosedTaskIds((current) => ({
                          ...current,
                          [task.id]: event.target.checked
                        }))
                      }
                    />
                    <span>{task.dueLabel}</span>
                    <strong>{task.label}</strong>
                    <small>
                      {task.owner}: {task.closeCondition}
                    </small>
                  </label>
                );
              })}
            </div>
            <div className="quick-buyer-evidence-share-value-owner-closeout-actions">
              <a href={valueOwnerCloseoutReceipt.requestHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-value-owner-closeout-receipt.json`}>
                <Download size={15} />
                Closeout receipt JSON
              </a>
              <button type="button" onClick={runValueOwnerCloseoutVerification} disabled={valueOwnerVerifyStatus === "checking"}>
                <ShieldCheck size={15} />
                {valueOwnerVerifyStatus === "checking" ? "Checking closeout" : "Verify closeout"}
              </button>
              <a href={valueOwnerCloseoutReceipt.verifierHref} target="_blank" rel="noreferrer">
                <ExternalLink size={15} />
                Open verifier
              </a>
              <a href={valueOwnerCloseoutReceipt.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-value-owner-closeout-receipt.md`}>
                <FileText size={15} />
                Closeout memo
              </a>
            </div>
            {valueOwnerVerifyStatus !== "idle" && (
              <div
                className={cx(
                  "quick-buyer-evidence-share-value-owner-closeout-verifier",
                  valueOwnerVerifyStatus === "verified" ? "ready" : valueOwnerVerifyStatus === "checking" ? "watch" : "blocked"
                )}
                aria-label="Value owner closeout inline verification"
                aria-live="polite"
              >
                <span>{valueOwnerVerifyStatus === "verified" ? "Verified" : valueOwnerVerifyStatus === "checking" ? "Checking" : "Needs attention"}</span>
                <strong>
                  {valueOwnerVerifyStatus === "verified"
                    ? "Receipt verified by the desk"
                    : valueOwnerVerifyStatus === "checking"
                      ? "Checking the exported closeout receipt"
                      : "Closeout receipt is held"}
                </strong>
                <small>
                  {valueOwnerVerifyStatus === "verified"
                    ? `${valueOwnerVerifyResult?.receiptLabel || "Buyer value owner closeout"} matched ${valueOwnerVerifyResult?.sourceVerifierApiPath || "/api/receipt-verifier"}.`
                    : valueOwnerVerifyError || valueOwnerVerifyResult?.handoff?.nextAction || "Verifier is checking this closeout receipt."}
                </small>
              </div>
            )}
          </div>
        )}
        {valueNextWindowPacket && (
          <div className={cx("quick-buyer-evidence-share-value-next-window", valueNextWindowPacket.status)} aria-label="Buyer value next window packet">
            <div className="quick-buyer-evidence-share-value-next-window-head">
              <div>
                <span>
                  <CalendarDays size={15} />
                  Value next window packet
                </span>
                <strong>{valueNextWindowPacket.headline}</strong>
                <p>{valueNextWindowPacket.summary}</p>
              </div>
              <dl>
                <div>
                  <dt>Window</dt>
                  <dd>
                    {valueNextWindowPacket.startDate} to {valueNextWindowPacket.endDate}
                  </dd>
                </div>
                <div>
                  <dt>Current owner</dt>
                  <dd>{valueNextWindowPacket.currentOwner}</dd>
                </div>
              </dl>
            </div>
            <div className="quick-buyer-evidence-share-value-next-window-steps" aria-label="Value next window steps">
              {valueNextWindowPacket.steps.map((step) => (
                <a key={step.id} href={step.href} className={step.status} {...quickBuyerEvidenceExternalLinkAttrs(step.href)}>
                  <span>Day {step.dayOffset}</span>
                  <strong>{step.label}</strong>
                  <small>
                    {step.owner}: {step.action}
                  </small>
                  <em>{step.closeCondition}</em>
                </a>
              ))}
            </div>
            <div className="quick-buyer-evidence-share-value-next-window-actions">
              <a href={valueNextWindowPacket.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-value-next-window.md`}>
                <Download size={15} />
                Next window memo
              </a>
              <a href={valueNextWindowPacket.calendarHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-value-next-window.ics`}>
                <CalendarDays size={15} />
                Next window calendar
              </a>
              <a href={valueNextWindowPacket.mailHref}>
                <Send size={15} />
                Email next window
              </a>
            </div>
          </div>
        )}
        <div className={cx("quick-buyer-evidence-share-answer-brief", buyerAnswerBrief.status)} aria-label="Buyer answer brief">
          <div>
            <span>
              <FileText size={15} />
              Buyer answer brief
            </span>
            <strong>{buyerAnswerBrief.headline}</strong>
            <p>{buyerAnswerBrief.summary}</p>
          </div>
          <dl>
            <div>
              <dt>Safe to cite</dt>
              <dd>
                {buyerAnswerBrief.readyCount}/{buyerAnswerBrief.totalCount}
              </dd>
            </div>
            <div>
              <dt>First open owner</dt>
              <dd>{buyerAnswerBrief.firstOpenQuestion?.owner ?? "Ready"}</dd>
            </div>
            <div>
              <dt>First open action</dt>
              <dd>{buyerAnswerBrief.firstOpenQuestion?.action || "Send with verifier attached"}</dd>
            </div>
          </dl>
          <div className="quick-buyer-evidence-share-answer-brief-actions">
            <a href={buyerAnswerBrief.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-answer-brief.md`}>
              <Download size={15} />
              Download brief
            </a>
            <a href={buyerAnswerBrief.csvHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-answer-brief.csv`}>
              <Download size={15} />
              Brief CSV
            </a>
            <a href={buyerAnswerBrief.mailHref}>
              <Send size={15} />
              Email brief
            </a>
          </div>
        </div>
        {decisionReceipt && (
          <div className={cx("quick-buyer-evidence-share-decision-dock", decisionReceipt.payload.status)} aria-label="Buyer decision action dock">
            <div>
              <span>Buyer response</span>
              <strong>{decisionReceipt.label}</strong>
              <small>{decisionReceipt.summary}</small>
            </div>
            <a href="#buyer-response-receipt">
              <Send size={15} />
              Record response
            </a>
            <a href={decisionReceipt.requestHref} download={`${decisionReceipt.payload.manifestReceiptId || "buyer-evidence"}-decision-receipt.json`}>
              <Download size={15} />
              Receipt JSON
            </a>
            <a href={decisionReceipt.verifierHref} target="_blank" rel="noreferrer">
              <ShieldCheck size={15} />
              Verify receipt
            </a>
            {decisionImpact && (
              <div className={cx("quick-buyer-evidence-share-decision-impact", decisionImpact.status)} aria-label="Selected decision impact">
                <div>
                  <span>Decision impact</span>
                  <strong>{decisionImpact.headline}</strong>
                  <small>{decisionImpact.summary}</small>
                </div>
                <dl>
                  <div>
                    <dt>Selected response</dt>
                    <dd>{decisionImpact.decisionLine}</dd>
                  </div>
                  <div>
                    <dt>Response owner</dt>
                    <dd>{decisionImpact.ownerLine}</dd>
                  </div>
                  <div>
                    <dt>First follow-up</dt>
                    <dd>{decisionImpact.followUpLine}</dd>
                  </div>
                  <div>
                    <dt>Owner workspace</dt>
                    <dd>{decisionImpact.returnLine}</dd>
                  </div>
                </dl>
                <small>{decisionImpact.nextAction}</small>
              </div>
            )}
          </div>
        )}
      </section>

      <section className={cx("quick-buyer-evidence-share-live-audit", liveAuditTone)} aria-label="Live evidence audit">
        <div className="quick-buyer-evidence-share-section-head">
          <div>
            <span>
              <Radar size={15} />
              Live evidence audit
            </span>
            <strong>{liveAuditHeadline}</strong>
          </div>
          <div className="quick-buyer-evidence-share-live-audit-actions">
            <button type="button" onClick={runLiveEvidenceAudit} disabled={liveAuditStatus === "checking" || liveAuditPlan.targets.length === 0}>
              <Radar size={15} />
              {liveAuditButtonLabel}
            </button>
            <a href={liveAuditPlan.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-live-audit-plan.md`}>
              <Download size={15} />
              Audit plan
            </a>
            {liveAuditExportHref && (
              <a href={liveAuditExportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-live-audit.md`}>
                <Download size={15} />
                Audit result
              </a>
            )}
          </div>
        </div>
        <p>{liveAuditSummary}</p>
        <div className="quick-buyer-evidence-share-live-audit-strip" aria-label="Live audit summary">
          <article>
            <span>Audit targets</span>
            <strong>{liveAuditPlan.targetCount}</strong>
            <small>{liveAuditPlan.requiredTargetCount} required before buyer send</small>
          </article>
          <article>
            <span>Packet state</span>
            <strong>{liveAuditPlan.readyTargetCount}/{liveAuditPlan.targetCount}</strong>
            <small>Ready before live audit</small>
          </article>
          <article>
            <span>Last audit</span>
            <strong>{liveAudit ? `${liveAudit.verifiedCount}/${liveAudit.totalCount}` : "Not run"}</strong>
            <small>{liveAudit ? liveAudit.checkedAt : "Run live audit from this shared page"}</small>
          </article>
        </div>
        <div className="quick-buyer-evidence-share-live-audit-results" aria-label="Live audit targets">
          {liveAudit
            ? liveAudit.results.map((result) => (
                <article key={result.id} className={quickBuyerEvidenceLiveAuditClass(result.status)}>
                  <span>{quickBuyerEvidenceLiveAuditLabel(result.status)}</span>
                  <strong>{result.label}</strong>
                  <small>{quickBuyerEvidenceCompactAuditUrl(result.url)}</small>
                  <em>{result.evidence}</em>
                  <small>{result.action}</small>
                </article>
              ))
            : liveAuditPlan.targets.map((target) => (
                <a key={target.id} href={target.href} className={target.status} {...quickBuyerEvidenceExternalLinkAttrs(target.href)}>
                  <span>{quickBuyerEvidenceStatusLabel(target.status)}</span>
                  <strong>{target.label}</strong>
                  <small>{target.requiredForSend ? "Required for buyer send" : "Operating evidence"}</small>
                  <em>{target.proof}</em>
                </a>
              ))}
        </div>
        {liveAuditRepairOrder && (
          <div className={cx("quick-buyer-evidence-share-live-repair", liveAuditRepairOrder.status)} aria-label="Live audit repair order">
            <div className="quick-buyer-evidence-share-section-head">
              <div>
                <span>
                  <Crosshair size={15} />
                  Audit repair order
                </span>
                <strong>{liveAuditRepairOrder.headline}</strong>
              </div>
              <div className="quick-buyer-evidence-share-live-repair-actions">
                <a href={liveAuditRepairOrder.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-audit-repair-order.md`}>
                  <Download size={15} />
                  Repair order
                </a>
                <a href={liveAuditRepairOrder.csvHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-audit-repair-order.csv`}>
                  <Download size={15} />
                  CSV
                </a>
                <a href={liveAuditRepairOrder.mailHref}>
                  <Send size={15} />
                  Email owner
                </a>
              </div>
            </div>
            <p>{liveAuditRepairOrder.summary}</p>
            <div className="quick-buyer-evidence-share-live-repair-strip" aria-label="Live audit repair summary">
              <article>
                <span>Blocked</span>
                <strong>{liveAuditRepairOrder.blockedCount}</strong>
                <small>Must close before buyer send</small>
              </article>
              <article>
                <span>Watch</span>
                <strong>{liveAuditRepairOrder.watchCount}</strong>
                <small>Needs owner review</small>
              </article>
              <article>
                <span>First owner</span>
                <strong>{liveAuditRepairOrder.firstTask?.owner ?? "No repair owner"}</strong>
                <small>{liveAuditRepairOrder.firstTask?.dueLabel ?? "Audit result is clean"}</small>
              </article>
            </div>
            <div className="quick-buyer-evidence-share-live-repair-tasks" aria-label="Live audit repair tasks">
              {liveAuditRepairOrder.tasks.length ? (
                liveAuditRepairOrder.tasks.map((task) => (
                  <a key={task.id} href={task.href} className={task.status} {...quickBuyerEvidenceExternalLinkAttrs(task.href)}>
                    <span>{task.dueLabel}</span>
                    <strong>{task.label}</strong>
                    <small>
                      {task.owner}: {task.action}
                    </small>
                    <em>{task.closeCondition}</em>
                  </a>
                ))
              ) : (
                <article className="ready">
                  <span>Ready</span>
                  <strong>No live audit repair task remains</strong>
                  <small>Attach the audit result to the buyer response.</small>
                </article>
              )}
            </div>
            {replacementWorkspace && replacementWorkspace.slots.length > 0 && (
              <div className={cx("quick-buyer-evidence-share-live-replacement", replacementAuditTone)} aria-label="Replacement proof check">
                <div className="quick-buyer-evidence-share-section-head">
                  <div>
                    <span>
                      <ShieldCheck size={15} />
                      Replacement check
                    </span>
                    <strong>{replacementAuditHeadline}</strong>
                  </div>
                  <div className="quick-buyer-evidence-share-live-replacement-actions">
                    <button type="button" onClick={runReplacementAudit} disabled={replacementAuditStatus === "checking"}>
                      <ShieldCheck size={15} />
                      {replacementAuditButtonLabel}
                    </button>
                    <a href={replacementWorkspace.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-replacement-workspace.md`}>
                      <Download size={15} />
                      Workspace
                    </a>
                    {replacementAuditExportHref && (
                      <a href={replacementAuditExportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-replacement-check.md`}>
                        <Download size={15} />
                        Result
                      </a>
                    )}
                  </div>
                </div>
                <p>{replacementAuditSummary}</p>
                <div className="quick-buyer-evidence-share-live-replacement-fields" aria-label="Replacement proof URL fields">
                  {replacementWorkspace.slots.map((slot) => (
                    <label key={slot.id}>
                      <span>{slot.owner}</span>
                      <strong>{slot.label}</strong>
                      <input
                        value={replacementDraft[slot.id] ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setReplacementDraft((current) => ({ ...current, [slot.id]: value }));
                          setReplacementAudit(null);
                          setReplacementAuditStatus("idle");
                          setReplacementAuditError("");
                        }}
                        placeholder={slot.placeholder}
                      />
                      <small>{quickBuyerEvidenceCompactAuditUrl(slot.currentHref)}</small>
                    </label>
                  ))}
                </div>
                {replacementAudit && (
                  <div className="quick-buyer-evidence-share-live-replacement-results" aria-label="Replacement proof results">
                    {replacementAudit.results.map((result) => (
                      <article key={result.id} className={quickBuyerEvidenceLiveAuditClass(result.status)}>
                        <span>{quickBuyerEvidenceLiveAuditLabel(result.status)}</span>
                        <strong>{result.label}</strong>
                        <small>{quickBuyerEvidenceCompactAuditUrl(result.url)}</small>
                        <em>{result.evidence}</em>
                        <small>{result.action}</small>
                      </article>
                    ))}
                  </div>
                )}
                {replacementCloseout && (
                  <div className={cx("quick-buyer-evidence-share-live-closeout", replacementCloseout.status)} aria-label="Replacement proof closeout">
                    <div className="quick-buyer-evidence-share-section-head">
                      <div>
                        <span>
                          <ListChecks size={15} />
                          Gate closeout
                        </span>
                        <strong>{replacementCloseout.headline}</strong>
                      </div>
                      <div className="quick-buyer-evidence-share-live-closeout-actions">
                        <a href={replacementCloseout.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-replacement-closeout.md`}>
                          <Download size={15} />
                          Closeout
                        </a>
                        <a href={replacementCloseout.csvHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-replacement-closeout.csv`}>
                          <Download size={15} />
                          CSV
                        </a>
                      </div>
                    </div>
                    <p>{replacementCloseout.summary}</p>
                    <div className="quick-buyer-evidence-share-live-closeout-strip" aria-label="Replacement closeout summary">
                      <article>
                        <span>Gate</span>
                        <strong>{replacementCloseout.canReopen ? "Reopen" : "Keep held"}</strong>
                        <small>{replacementCloseout.readyCount}/{replacementCloseout.slotTotal} replacement slots ready</small>
                      </article>
                      <article>
                        <span>Open slots</span>
                        <strong>{replacementCloseout.missingCount + replacementCloseout.blockedCount + replacementCloseout.watchCount}</strong>
                        <small>
                          {replacementCloseout.missingCount} missing, {replacementCloseout.blockedCount} blocked, {replacementCloseout.watchCount} watch
                        </small>
                      </article>
                      <article>
                        <span>First owner</span>
                        <strong>{replacementCloseout.firstOpenItem?.owner ?? "Ready"}</strong>
                        <small>{replacementCloseout.firstOpenItem?.label ?? "All replacement proof verified"}</small>
                      </article>
                    </div>
                    <div className="quick-buyer-evidence-share-live-closeout-items" aria-label="Replacement closeout items">
                      {replacementCloseout.items.map((item) => (
                        <article key={item.id} className={item.status}>
                          <span>{quickBuyerEvidenceStatusLabel(item.status)}</span>
                          <strong>{item.label}</strong>
                          <small>{item.owner}</small>
                          <em>{quickBuyerEvidenceCompactAuditUrl(item.replacementHref || item.currentHref)}</em>
                          <small>{item.action}</small>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section className={cx("quick-buyer-evidence-share-approval", approvalChecklist.status)} aria-label="Buyer approval checklist">
        <div className="quick-buyer-evidence-share-section-head">
          <div>
            <span>
              <ListChecks size={15} />
              Approval checklist
            </span>
            <strong>{approvalChecklist.headline}</strong>
          </div>
          <a href={approvalChecklist.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-approval-checklist.md`}>
            <Download size={15} />
            Download checklist
          </a>
        </div>
        <p>{approvalChecklist.summary}</p>
        <div className="quick-buyer-evidence-share-approval-gate" aria-label="Current approval gate">
          <div>
            <span>Decision gate</span>
            <strong>{approvalChecklist.decisionGate}</strong>
          </div>
          <b>
            {approvalChecklist.readyCount}/{approvalChecklist.totalCount}
          </b>
        </div>
        <div className="quick-buyer-evidence-share-approval-items" aria-label="Buyer approval conditions">
          {approvalChecklist.items.map((item) => (
            <a key={item.id} href={item.href} className={item.status} {...quickBuyerEvidenceExternalLinkAttrs(item.href)}>
              <span>{quickBuyerEvidenceStatusLabel(item.status)}</span>
              <strong>{item.label}</strong>
              <small>{item.question}</small>
              <em>{item.evidence}</em>
              <small>Approval: {item.approvalCondition}</small>
              <em>
                {item.owner}: {item.action}
              </em>
            </a>
          ))}
        </div>
      </section>

      <section className={cx("quick-buyer-evidence-share-memo", decisionMemo.status)} aria-label="Buyer decision memo">
        <div className="quick-buyer-evidence-share-section-head">
          <div>
            <span>
              <FileText size={15} />
              Decision memo
            </span>
            <strong>{decisionMemo.headline}</strong>
          </div>
          <a href={decisionMemo.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-decision-memo.md`}>
            <Download size={15} />
            Download memo
          </a>
        </div>
        <p>{decisionMemo.summary}</p>
        <div className="quick-buyer-evidence-share-memo-items" aria-label="Buyer decision memo evidence">
          {decisionMemo.items.map((item) =>
            item.href ? (
              <a key={item.id} href={item.href} className={item.status} {...quickBuyerEvidenceExternalLinkAttrs(item.href)}>
                <span>{quickBuyerEvidenceStatusLabel(item.status)}</span>
                <strong>{item.label}</strong>
                <small>{item.value}</small>
                <em>{item.evidence}</em>
              </a>
            ) : (
              <article key={item.id} className={item.status}>
                <span>{quickBuyerEvidenceStatusLabel(item.status)}</span>
                <strong>{item.label}</strong>
                <small>{item.value}</small>
                <em>{item.evidence}</em>
              </article>
            )
          )}
        </div>
        <div className="quick-buyer-evidence-share-questions" aria-label="Buyer questions">
          {decisionMemo.questions.map((question) =>
            question.href ? (
              <a key={question.id} href={question.href} className={question.status} {...quickBuyerEvidenceExternalLinkAttrs(question.href)}>
                <span>{quickBuyerEvidenceStatusLabel(question.status)}</span>
                <strong>{question.question}</strong>
                <small>{question.answer}</small>
                <em>{question.evidence}</em>
              </a>
            ) : (
              <article key={question.id} className={question.status}>
                <span>{quickBuyerEvidenceStatusLabel(question.status)}</span>
                <strong>{question.question}</strong>
                <small>{question.answer}</small>
                <em>{question.evidence}</em>
              </article>
            )
          )}
        </div>
      </section>

      {decisionReceipt && (
        <section id="buyer-response-receipt" className={cx("quick-buyer-evidence-share-decision", decisionReceipt.payload.status)} aria-label="Buyer decision response">
          <div className="quick-buyer-evidence-share-section-head">
            <span>Buyer response receipt</span>
            <strong>{decisionReceipt.label}</strong>
          </div>
          <p>{decisionReceipt.summary}</p>
          {replacementCloseout && (
            <div className={cx("quick-buyer-evidence-share-closeout-response", replacementCloseout.status)} aria-label="Replacement closeout response bridge">
              <div>
                <span>Replacement closeout</span>
                <strong>{replacementCloseout.canReopen ? "Closeout can prefill acceptance response" : "Closeout remains repair evidence"}</strong>
                <p>
                  {replacementCloseout.canReopen
                    ? "Apply the verified closeout to accept evidence with the replacement proof attached. Name the reviewer before final send."
                    : "Apply the closeout to record why buyer send stays held and route the remaining repair work."}
                </p>
              </div>
              <button type="button" onClick={applyReplacementCloseoutToResponse}>
                <ListChecks size={15} />
                {replacementCloseout.canReopen ? "Use closeout in response" : "Attach closeout to repair"}
              </button>
              <a href={replacementCloseout.exportHref} download={`${payload.sourceReceiptId || "buyer-evidence"}-replacement-closeout.md`}>
                <Download size={15} />
                Closeout
              </a>
            </div>
          )}
          <div className={cx("quick-buyer-evidence-share-scorecard", decisionReceipt.scorecard.status)} aria-label="Buyer evidence decision scorecard">
            <div className="quick-buyer-evidence-share-scorecard-head">
              <div>
                <span>Decision scorecard</span>
                <strong>{decisionReceipt.scorecard.headline}</strong>
                <p>{decisionReceipt.scorecard.summary}</p>
              </div>
              <b>
                {decisionReceipt.scorecard.readyCount}/{decisionReceipt.scorecard.totalCount}
              </b>
            </div>
            <div className="quick-buyer-evidence-share-scorecard-items">
              {decisionReceipt.scorecard.items.map((item) => (
                <article key={item.id} className={item.status}>
                  <span>{quickBuyerEvidenceStatusLabel(item.status)}</span>
                  <strong>{item.label}</strong>
                  <small>{item.value}</small>
                  <em>{item.evidence}</em>
                </article>
              ))}
            </div>
          </div>
          <div className="quick-buyer-evidence-share-decision-options" role="group" aria-label="Buyer evidence decision">
            {decisionOptions.map((decisionOption) => (
              <button
                key={decisionOption}
                type="button"
                className={cx(decisionOption === buyerDecision && "is-selected", decisionOption === decisionReceipt.recommendedDecision && "is-recommended")}
                aria-pressed={decisionOption === buyerDecision}
                onClick={() => {
                  setBuyerDecision(decisionOption);
                  setBuyerReviewerNote(quickBuyerEvidenceDefaultReviewerNote(payload, decisionOption));
                }}
              >
                <span>{quickBuyerEvidenceDecisionLabel(decisionOption)}</span>
                {decisionOption === decisionReceipt.recommendedDecision && <small>Recommended</small>}
              </button>
            ))}
          </div>
          <div className="quick-buyer-evidence-share-fields">
            <label>
              <span>Reviewer</span>
              <input value={buyerReviewerName} onChange={(event) => setBuyerReviewerName(event.target.value)} placeholder="Buyer reviewer" />
            </label>
            <label>
              <span>Decision note</span>
              <textarea value={buyerReviewerNote} onChange={(event) => setBuyerReviewerNote(event.target.value)} rows={3} />
            </label>
          </div>
          <div className="quick-buyer-evidence-share-receipt" aria-label="Generated buyer response receipt">
            <article>
              <span>Receipt checksum</span>
              <strong>{decisionReceipt.checksum}</strong>
              <small>{decisionReceipt.payload.testsReady}/{decisionReceipt.payload.testsTotal} required artifacts ready / {decisionReceipt.payload.confidence}% confidence</small>
            </article>
            <article>
              <span>Next action</span>
              <strong>{decisionReceipt.payload.nextAction}</strong>
              <small>{decisionReceipt.verification.status === "verified" ? "Checksum verified in browser" : decisionReceipt.verification.instruction}</small>
            </article>
            <div className="quick-buyer-evidence-share-receipt-actions">
              <a href={decisionReceipt.requestHref} download={`${decisionReceipt.payload.manifestReceiptId || "buyer-evidence"}-decision-receipt.json`}>
                <Download size={15} />
                Decision receipt
              </a>
              <a href={decisionReceipt.verifierHref} target="_blank" rel="noreferrer">
                <ShieldCheck size={15} />
                Verify decision
              </a>
              <a href={decisionReceipt.returnHref}>
                <ExternalLink size={15} />
                Return response
              </a>
            </div>
          </div>
          <div className="quick-buyer-evidence-share-handoff" aria-label="Buyer response owner handoff">
            <div className="quick-buyer-evidence-share-section-head">
              <span>Owner handoff</span>
              <strong>{decisionReceipt.owner}</strong>
            </div>
            <div className="quick-buyer-evidence-share-handoff-runbook">
              {decisionReceipt.ownerRunbook.map((item) => (
                <article key={item.id} className={item.status}>
                  <span>{item.window}</span>
                  <strong>{item.label}</strong>
                  <p>{item.action}</p>
                  <small>{item.owner}: {item.evidence}</small>
                </article>
              ))}
            </div>
            <div className="quick-buyer-evidence-share-receipt-actions">
              <a href={decisionReceipt.ownerPacketHref} download={`${decisionReceipt.payload.manifestReceiptId || "buyer-evidence"}-owner-packet.md`}>
                <Download size={15} />
                Owner packet
              </a>
              <a href={decisionReceipt.ownerMailHref}>
                <Send size={15} />
                Email owner
              </a>
            </div>
          </div>
          <div className={cx("quick-buyer-evidence-share-follow-up", decisionReceipt.followUpLedger.status)} aria-label="Buyer response follow-up ledger">
            <div className="quick-buyer-evidence-share-section-head">
              <span>Follow-up ledger</span>
              <strong>{decisionReceipt.followUpLedger.headline}</strong>
            </div>
            <p>{decisionReceipt.followUpLedger.summary}</p>
            <div className="quick-buyer-evidence-share-follow-up-status">
              <span>
                {decisionReceipt.followUpLedger.readyCount}/{decisionReceipt.followUpLedger.taskTotal} ready
              </span>
              <span>{decisionReceipt.followUpLedger.blockedCount} blocked</span>
              <span>First due {decisionReceipt.followUpLedger.firstDueLabel}</span>
            </div>
            <div className="quick-buyer-evidence-share-follow-up-tasks" aria-label="Buyer response owner tasks">
              {decisionReceipt.followUpLedger.tasks.map((task) => (
                <a key={task.id} className={task.status} href={task.href} {...quickBuyerEvidenceExternalLinkAttrs(task.href)}>
                  <span>{task.dueLabel}</span>
                  <strong>{task.label}</strong>
                  <small>
                    {task.owner}: {task.action}
                  </small>
                  <em>{task.closeCondition}</em>
                </a>
              ))}
            </div>
            <div className="quick-buyer-evidence-share-receipt-actions">
              <a href={decisionReceipt.followUpLedger.exportHref} download={`${decisionReceipt.payload.manifestReceiptId || "buyer-evidence"}-follow-up-ledger.md`}>
                <Download size={15} />
                Ledger
              </a>
              <a href={decisionReceipt.followUpLedger.csvHref} download={`${decisionReceipt.payload.manifestReceiptId || "buyer-evidence"}-follow-up.csv`}>
                <Download size={15} />
                CSV
              </a>
              {decisionReceipt.followUpLedger.calendarHref && (
                <a href={decisionReceipt.followUpLedger.calendarHref} download={`${decisionReceipt.payload.manifestReceiptId || "buyer-evidence"}-follow-up.ics`}>
                  <CalendarDays size={15} />
                  Calendar
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="quick-buyer-evidence-share-section" aria-label="Required evidence artifacts">
        <div className="quick-buyer-evidence-share-section-head">
          <span>Required before buyer send</span>
          <strong>
            {requiredArtifacts.filter((artifact) => artifact.status === "ready").length}/{requiredArtifacts.length} ready
          </strong>
        </div>
        <div className="quick-buyer-evidence-share-artifacts">
          {requiredArtifacts.map((artifact) =>
            artifact.href ? (
              <a key={artifact.id} href={artifact.href} className={artifact.status} {...quickBuyerEvidenceExternalLinkAttrs(artifact.href)}>
                <span>{quickBuyerEvidenceStatusLabel(artifact.status)}</span>
                <strong>{artifact.label}</strong>
                <small>{artifact.role}</small>
                <em>{artifact.proof}</em>
              </a>
            ) : (
              <article key={artifact.id} className={artifact.status}>
                <span>{quickBuyerEvidenceStatusLabel(artifact.status)}</span>
                <strong>{artifact.label}</strong>
                <small>{artifact.role}</small>
                <em>{artifact.proof}</em>
              </article>
            )
          )}
        </div>
      </section>

      <section className="quick-buyer-evidence-share-section" aria-label="Operating evidence artifacts">
        <div className="quick-buyer-evidence-share-section-head">
          <span>Operating packet</span>
          <strong>{operatingArtifacts.length} artifacts</strong>
        </div>
        <div className="quick-buyer-evidence-share-artifacts is-operating">
          {operatingArtifacts.map((artifact) =>
            artifact.href ? (
              <a key={artifact.id} href={artifact.href} className={artifact.status} {...quickBuyerEvidenceExternalLinkAttrs(artifact.href)}>
                <span>{quickBuyerEvidenceStatusLabel(artifact.status)}</span>
                <strong>{artifact.label}</strong>
                <small>{artifact.role}</small>
                <em>{artifact.proof}</em>
              </a>
            ) : (
              <article key={artifact.id} className={artifact.status}>
                <span>{quickBuyerEvidenceStatusLabel(artifact.status)}</span>
                <strong>{artifact.label}</strong>
                <small>{artifact.role}</small>
                <em>{artifact.proof}</em>
              </article>
            )
          )}
        </div>
      </section>
    </main>
  );
}
