import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { AlertTriangle, BadgeCheck, Copy, Download, ExternalLink, Gauge, ShieldCheck } from "lucide-react";
import type { HeroBuyerDecisionBrief, HeroBuyerDecisionOutcomeReplayStep } from "./HeroBuyerDecisionBrief";
import type { BuyerValueSensitivity } from "./buyerValueSensitivity";
import { downloadTextFile } from "./downloadArtifact";
import { buildHeroOutcomeReplayReceipt, type HeroOutcomeReplayReceipt } from "./heroOutcomeReplayReceipt";
import type { LaunchRoomStatus } from "./launchRoom";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function statusIcon(status: LaunchRoomStatus) {
  if (status === "ready") return <BadgeCheck size={13} />;
  if (status === "attention") return <Gauge size={13} />;
  return <AlertTriangle size={13} />;
}

function statusLabel(status: HeroBuyerDecisionBrief["status"]) {
  if (status === "ready") return "Buyer-ready";
  if (status === "attention") return "Needs review";
  return "Hold send";
}

function replayHeadline(brief: HeroBuyerDecisionBrief) {
  const blockedStep = brief.outcomeReplay.find((step) => step.status === "blocked");
  if (brief.status === "ready") return `${brief.buyer} has a sendable approval story`;
  if (blockedStep) return `${brief.buyer} approval stops at ${blockedStep.label}`;
  return `${brief.buyer} approval needs one review pass`;
}

function replaySummary(steps: HeroBuyerDecisionOutcomeReplayStep[]) {
  return steps.map((step) => step.value).join(" -> ");
}

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function downsideCase(sensitivity: BuyerValueSensitivity) {
  return sensitivity.cases.find((item) => item.id === "pessimistic") ?? sensitivity.cases[0];
}

function sensitivityLabel(sensitivity: BuyerValueSensitivity) {
  const downside = downsideCase(sensitivity);
  return `Downside ${downside?.paybackDays ?? 999}d / BE ${sensitivity.breakEvenAdoptionPercent}%`;
}

function receiptDeskHref(requestJson: string) {
  const params = new URLSearchParams({
    request: requestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

function firstOpenQuestion(brief: HeroBuyerDecisionBrief) {
  return brief.buyerQuestions.find((question) => question.status !== "ready") ?? brief.buyerQuestions.find((question) => question.id === "next-decision") ?? brief.buyerQuestions[0];
}

function firstOpenApprovalStep(brief: HeroBuyerDecisionBrief) {
  return brief.approvalPath.find((step) => step.status !== "ready") ?? brief.approvalPath.find((step) => step.id === "send-room") ?? brief.approvalPath[0];
}

function gateLine(brief: HeroBuyerDecisionBrief) {
  const question = firstOpenQuestion(brief);
  const approval = firstOpenApprovalStep(brief);
  if (!question && !approval) return replaySummary(brief.outcomeReplay);
  if (brief.status === "ready") return `Gate clear: ${question?.question ?? "send room"} / ${approval?.label ?? "approval path"}.`;
  return `Next gate: ${question?.question ?? approval?.label ?? "buyer review"} / ${approval?.summary ?? brief.primaryAction.label}`;
}

function replayMarkdown(brief: HeroBuyerDecisionBrief, sensitivity: BuyerValueSensitivity, receipt: HeroOutcomeReplayReceipt) {
  const downside = downsideCase(sensitivity);
  return [
    "# Buyer outcome replay",
    "",
    `Decision: ${brief.decisionLabel}`,
    `Buyer: ${brief.buyer}`,
    `Score: ${brief.score}`,
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Verifier: POST ${receipt.verificationApiPath}`,
    `Source packet receipt: ${brief.packetReceipt.receiptId}`,
    `Source packet checksum: ${brief.packetReceipt.checksumAlgorithm}:${brief.packetReceipt.checksum}`,
    `Decision receipt: ${brief.decisionReceiptAction.href}`,
    "",
    replayHeadline(brief),
    "",
    `Replay: ${replaySummary(brief.outcomeReplay)}`,
    "",
    "## Replay steps",
    ...brief.outcomeReplay.map((step) => `- [${step.status}] ${step.label}: ${step.value}. ${step.detail} Link: ${step.href}`),
    "",
    "## Buyer questions",
    ...brief.buyerQuestions.map((question) => `- [${question.status}] ${question.question} ${question.answer} Evidence: ${question.evidence} Link: ${question.href}`),
    "",
    "## Approval path",
    ...brief.approvalPath.map((step) => `- [${step.status}] ${step.label} (${step.owner}): ${step.summary} Link: ${step.href}`),
    "",
    "## Downside sensitivity",
    `Verdict: ${sensitivity.verdict}`,
    `Confidence band: ${sensitivity.confidenceBand}`,
    `Break-even adoption: ${sensitivity.breakEvenAdoptionPercent}%`,
    `Value at risk: ${yen(sensitivity.valueAtRiskYen)}`,
    ...(downside
      ? [
          `Downside payback: ${downside.paybackDays} days`,
          `Downside value: ${yen(downside.monthlyValueYen)} / month at ${downside.adoptionRatePercent}% adoption and ${downside.automationRatePercent}% automation.`
        ]
      : []),
    "",
    "## Sensitivity guardrails",
    ...sensitivity.guardrails.map((guardrail) => `- [${guardrail.status}] ${guardrail.label}: ${guardrail.value}. ${guardrail.evidence}`),
    "",
    "## Next action",
    `${brief.primaryAction.label}: ${brief.primaryAction.href}`
  ].join("\n");
}

export default function HeroOutcomeReplayStrip({
  brief,
  sensitivity,
  onCopyText
}: {
  brief: HeroBuyerDecisionBrief;
  sensitivity: BuyerValueSensitivity;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "checking" | "verified" | "failed">("idle");
  const [verifyMessage, setVerifyMessage] = useState("Replay receipt not checked in this browser yet.");
  const receipt = useMemo(() => buildHeroOutcomeReplayReceipt(brief, sensitivity), [brief, sensitivity]);
  const verifierDeskHref = receiptDeskHref(receipt.verificationRequestJson);
  const verifierFallbackHref = verifierDeskHref;
  const exportMarkdown = useMemo(() => replayMarkdown(brief, sensitivity, receipt), [brief, receipt, sensitivity]);
  const summary = replaySummary(brief.outcomeReplay);
  const gate = gateLine(brief);
  const copyLabel = copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Failed" : "Copy replay";
  const verifyLabel = verifyStatus === "verified" ? "Verified" : verifyStatus === "checking" ? "Checking" : verifyStatus === "failed" ? "Retry" : "Verify";

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyReplay = async () => {
    const copied = await onCopyText(exportMarkdown);
    setCopyStatus(copied ? "copied" : "failed");
  };

  async function verifyReplayReceipt() {
    if (verifyStatus === "checking") return;
    setVerifyStatus("checking");
    setVerifyMessage("Checking replay receipt checksum...");
    try {
      const response = await fetch(receipt.verificationApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: receipt.verificationRequestJson
      });
      const body = (await response.json()) as { verification?: { status?: string; instruction?: string }; error?: string };
      if (!response.ok || body.verification?.status !== "verified") {
        throw new Error(body.verification?.instruction || body.error || `Replay receipt verification failed with HTTP ${response.status}.`);
      }
      setVerifyStatus("verified");
      setVerifyMessage(body.verification.instruction || `Checksum ${receipt.checksum} matches the buyer outcome replay payload.`);
    } catch (error) {
      setVerifyStatus("failed");
      setVerifyMessage(error instanceof Error ? error.message : "Replay receipt verification failed.");
    }
  }

  function openVerifierDesk(event: MouseEvent<HTMLAnchorElement>) {
    if (typeof window === "undefined") return;
    event.preventDefault();
    try {
      const storageKey = `receipt-verifier-request:${receipt.receiptId}`;
      window.sessionStorage.setItem(storageKey, receipt.verificationRequestJson);
      window.localStorage.setItem(storageKey, receipt.verificationRequestJson);
      window.location.assign(verifierDeskHref);
    } catch {
      window.location.assign(verifierFallbackHref);
    }
  }

  return (
    <section className={cx("hero-outcome-replay-strip", `is-${brief.status}`)} aria-label="First-screen buyer outcome replay">
      <div className="hero-outcome-replay-strip-head">
        <div>
          <span>
            {statusLabel(brief.status)} / {sensitivityLabel(sensitivity)}
          </span>
          <strong>{replayHeadline(brief)}</strong>
          <p>
            {summary}. {gate}
          </p>
        </div>
        <div className="hero-outcome-replay-strip-actions" aria-label="Buyer outcome replay actions">
          <a className="hero-outcome-replay-strip-primary" href={brief.primaryAction.href}>
            <ExternalLink size={14} />
            {brief.primaryAction.label}
          </a>
          <button
            type="button"
            className={cx("hero-outcome-replay-strip-secondary", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")}
            onClick={copyReplay}
          >
            <Copy size={14} />
            {copyLabel}
          </button>
          <button
            type="button"
            className={cx("hero-outcome-replay-strip-secondary", verifyStatus === "verified" && "is-confirmed", verifyStatus === "failed" && "is-risk")}
            onClick={verifyReplayReceipt}
            disabled={verifyStatus === "checking"}
            title={verifyMessage}
          >
            <ShieldCheck size={14} />
            {verifyLabel}
          </button>
          <button type="button" className="hero-outcome-replay-strip-secondary" data-download-filename="buyer-outcome-replay.md" onClick={() => downloadTextFile("buyer-outcome-replay.md", exportMarkdown)}>
            <Download size={14} />
            Export
          </button>
          <a className="hero-outcome-replay-strip-secondary" href={verifierDeskHref} onClick={openVerifierDesk}>
            <ExternalLink size={14} />
            Desk
          </a>
        </div>
      </div>
      <div className="hero-outcome-replay-strip-steps" aria-label="First-screen buyer outcome replay steps">
        {brief.outcomeReplay.map((step) => (
          <a key={step.id} className={cx("hero-outcome-replay-strip-step", `is-${step.status}`)} href={step.href}>
            <span>
              {statusIcon(step.status)}
              {step.label}
            </span>
            <strong>{step.value}</strong>
            <small>{step.detail}</small>
          </a>
        ))}
      </div>
    </section>
  );
}
