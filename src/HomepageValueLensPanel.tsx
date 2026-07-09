import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  Clock3,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  ListChecks,
  Route,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import type { BuyerValueScenarioInput } from "./buyerValueScenario";
import { downloadHrefFile, downloadJsonFile, downloadTextFile } from "./downloadArtifact";
import type { HomepageValueLensSnapshot } from "./HomepageValueLens";

type AssumptionField = {
  key: keyof BuyerValueScenarioInput;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
};

const ASSUMPTION_FIELDS: AssumptionField[] = [
  { key: "teamSize", label: "Team", min: 1, max: 200, step: 1, suffix: "people" },
  { key: "cyclesPerMonth", label: "Cycles", min: 1, max: 40, step: 1, suffix: "/ month" },
  { key: "manualHoursPerCycle", label: "Manual hours", min: 1, max: 120, step: 0.5, suffix: "/ cycle" },
  { key: "adoptionRatePercent", label: "Adoption", min: 5, max: 100, step: 1, suffix: "%" },
  { key: "hourlyCostYen", label: "Hourly cost", min: 1000, max: 50000, step: 1000, suffix: "yen" }
];

type BuyerCommitmentClause = {
  id: string;
  label: string;
  status: "ready" | "attention" | "blocked";
  target: string;
  evidence: string;
  action: string;
};

type BuyerCommitmentDraft = {
  status: "ready" | "attention" | "blocked";
  label: string;
  headline: string;
  promise: string;
  pilotAskYen: number;
  measurementWindow: string;
  stopRule: string;
  clauses: BuyerCommitmentClause[];
  markdown: string;
};

type BuyerDecisionShortcutStep = {
  id: string;
  label: string;
  status: BuyerCommitmentDraft["status"];
  href: string;
  evidence: string;
  action: string;
};

type BuyerDecisionShortcut = {
  status: BuyerCommitmentDraft["status"];
  label: string;
  headline: string;
  summary: string;
  gate: string;
  steps: BuyerDecisionShortcutStep[];
  markdown: string;
};

type BuyerValueTraceLine = {
  id: string;
  label: string;
  status: BuyerCommitmentDraft["status"];
  input: string;
  formula: string;
  result: string;
  evidence: string;
  action: string;
};

type BuyerValueTraceLedger = {
  status: BuyerCommitmentDraft["status"];
  label: string;
  headline: string;
  summary: string;
  reviewRule: string;
  lines: BuyerValueTraceLine[];
  markdown: string;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function roundYen(value: number) {
  return Math.round(value / 1000) * 1000;
}

function routeAction(href: string) {
  return /^https?:\/\//i.test(href) ? { target: "_blank", rel: "noreferrer" } : {};
}

function statusLabel(status: BuyerCommitmentDraft["status"]) {
  if (status === "ready") return "Commitment ready";
  if (status === "attention") return "Pilot terms only";
  return "Internal proof only";
}

function metricStatus(value: number, ready: number, attention: number): BuyerCommitmentDraft["status"] {
  if (value >= ready) return "ready";
  if (value >= attention) return "attention";
  return "blocked";
}

function buildBuyerCommitmentDraft(snapshot: HomepageValueLensSnapshot): BuyerCommitmentDraft {
  const pilotAskYen =
    snapshot.status === "ready"
      ? snapshot.pilotBudgetCeilingYen
      : Math.min(snapshot.pilotBudgetCeilingYen, roundYen(Math.max(snapshot.measuredMonthlyValueYen, snapshot.monthlyValueYen * 0.18)));
  const status = snapshot.status;
  const measurementWindow = status === "ready" ? "14-day measured pilot" : status === "attention" ? "21-day capped pilot" : "Next proof run only";
  const headline =
    status === "ready"
      ? "Buyer terms are ready to review"
      : status === "attention"
        ? "Use this as a pilot contract"
        : "Keep these terms internal";
  const promise =
    status === "ready"
      ? `Promise ${snapshot.buyer} a measured pilot capped at ${yen(pilotAskYen)} before any rollout spend.`
      : status === "attention"
        ? `Offer ${snapshot.buyer} a capped pilot, not a rollout promise, until the weakest acceptance clause is repaired.`
        : `Do not offer ${snapshot.buyer} a budget ask until the proof blocker is closed.`;
  const stopRule =
    status === "blocked"
      ? "Stop external review if the next proof run cannot produce a verified value receipt."
      : `Stop or narrow scope if measured support stays below 70% by the end of the ${measurementWindow.toLowerCase()}.`;
  const clauses: BuyerCommitmentClause[] = [
    {
      id: "economic-proof",
      label: "Economic proof",
      status: metricStatus(snapshot.measuredSupportPercent, 70, 40),
      target: "Measured support reaches 70% or higher.",
      evidence: `${yen(snapshot.measuredMonthlyValueYen)} measured support against ${yen(snapshot.monthlyValueYen)} modeled value.`,
      action: snapshot.measuredSupportPercent >= 70 ? "Attach the measured run to the buyer handoff." : "Run another measured proof before rollout language."
    },
    {
      id: "adoption-proof",
      label: "Adoption proof",
      status: metricStatus(snapshot.assumptions.adoptionRatePercent, 70, 55),
      target: "Pilot users can sustain at least 70% adoption.",
      evidence: `${snapshot.assumptions.adoptionRatePercent}% current adoption across ${snapshot.assumptions.teamSize} people.`,
      action: snapshot.assumptions.adoptionRatePercent >= 70 ? "Keep adoption evidence in the receipt packet." : "Limit the ask to one team until adoption is repaired."
    },
    {
      id: "budget-guardrail",
      label: "Budget guardrail",
      status: snapshot.paybackDays <= 30 ? "ready" : snapshot.paybackDays <= 60 ? "attention" : "blocked",
      target: `Pilot cap stays at or below ${yen(pilotAskYen)}.`,
      evidence: `${snapshot.paybackDays} days payback against a ${yen(snapshot.pilotBudgetCeilingYen)} ceiling.`,
      action: snapshot.paybackDays <= 30 ? "Use the current cap for buyer approval." : "Reduce the first workflow scope before budget approval."
    },
    {
      id: "receipt-review",
      label: "Receipt review",
      status: metricStatus(snapshot.confidenceScore, 76, 62),
      target: "Buyer can verify checksum and proof packet before approval.",
      evidence: `${snapshot.confidenceScore}/100 confidence with receipt ${snapshot.receipt.receiptId}.`,
      action: snapshot.confidenceScore >= 76 ? "Send the receipt, verification JSON, and value case together." : "Attach missing release and acceptance receipts first."
    }
  ];
  const markdown = [
    "# Pilot acceptance terms",
    "",
    `Buyer: ${snapshot.buyer}`,
    `Status: ${statusLabel(status)}`,
    `Promise: ${promise}`,
    `Pilot ask: ${yen(pilotAskYen)}`,
    `Measurement window: ${measurementWindow}`,
    `Stop rule: ${stopRule}`,
    "",
    "## Acceptance clauses",
    ...clauses.map((clause) => `- [${clause.status}] ${clause.label}: ${clause.target} Evidence: ${clause.evidence} Action: ${clause.action}`),
    "",
    `Receipt: ${snapshot.receipt.receiptId}`,
    `Checksum: ${snapshot.receipt.checksumAlgorithm}:${snapshot.receipt.checksum}`
  ].join("\n");

  return {
    status,
    label: statusLabel(status),
    headline,
    promise,
    pilotAskYen,
    measurementWindow,
    stopRule,
    clauses,
    markdown
  };
}

function decisionShortcutLabel(status: BuyerDecisionShortcut["status"]) {
  if (status === "ready") return "Approval path ready";
  if (status === "attention") return "Proof-gap review";
  return "Internal route only";
}

function decisionStepAction(status: BuyerCommitmentDraft["status"], ready: string, attention: string, blocked: string) {
  if (status === "ready") return ready;
  if (status === "attention") return attention;
  return blocked;
}

function shortcutLinkForMarkdown(href: string) {
  return href.startsWith("data:") ? "value-receipt.json" : href;
}

function traceLedgerLabel(status: BuyerValueTraceLedger["status"]) {
  if (status === "ready") return "Replay-ready";
  if (status === "attention") return "Trace with proof gaps";
  return "Trace before sharing";
}

function buildBuyerValueTraceLedger(snapshot: HomepageValueLensSnapshot): BuyerValueTraceLedger {
  const adoptedManualHours = round1(
    snapshot.assumptions.manualHoursPerCycle * snapshot.assumptions.cyclesPerMonth * (snapshot.assumptions.adoptionRatePercent / 100)
  );
  const impliedAutomationRate = adoptedManualHours > 0 ? round1(Math.min(100, Math.max(0, (snapshot.monthlyHoursSaved / adoptedManualHours) * 100))) : 0;
  const modeledLaborValueYen = roundYen(snapshot.monthlyHoursSaved * snapshot.assumptions.hourlyCostYen);
  const modeledRiskValueYen = Math.max(0, snapshot.monthlyValueYen - modeledLaborValueYen);
  const impliedPilotInvestmentYen = roundYen((snapshot.paybackDays / 30) * snapshot.monthlyValueYen);
  const modeledMetricStatus = snapshot.metrics.find((metric) => metric.id === "modeled-value")?.status ?? snapshot.status;
  const lines: BuyerValueTraceLine[] = [
    {
      id: "workflow-load",
      label: "Workflow load",
      status: metricStatus(snapshot.assumptions.adoptionRatePercent, 70, 55),
      input: `${snapshot.assumptions.teamSize} people, ${snapshot.assumptions.cyclesPerMonth} cycles/month, ${snapshot.assumptions.manualHoursPerCycle} manual hours/cycle, ${snapshot.assumptions.adoptionRatePercent}% adoption.`,
      formula: `manual hours x cycles x adoption x ${impliedAutomationRate}% assisted savings`,
      result: `${snapshot.monthlyHoursSaved} hours/month saved`,
      evidence: `${adoptedManualHours} adopted manual hours/month become the workload baseline.`,
      action: snapshot.assumptions.adoptionRatePercent >= 70 ? "Keep adoption evidence attached to the receipt." : "Run a first-user proof before claiming team-wide savings."
    },
    {
      id: "labor-value",
      label: "Labor value",
      status: modeledMetricStatus,
      input: `${snapshot.monthlyHoursSaved} saved hours/month at ${yen(snapshot.assumptions.hourlyCostYen)} loaded hourly cost.`,
      formula: "saved hours x loaded hourly cost",
      result: `${yen(modeledLaborValueYen)} labor value/month`,
      evidence: `Labor value is separated from the ${yen(snapshot.monthlyValueYen)} modeled monthly value.`,
      action: modeledMetricStatus === "ready" ? "Use this as the first buyer-readable value line." : "Tighten the workflow scope until labor value is material."
    },
    {
      id: "risk-adjustment",
      label: "Risk adjustment",
      status: modeledMetricStatus,
      input: `${yen(snapshot.assumptions.incidentRiskYenPerMonth)} monthly incident risk.`,
      formula: "modeled value - labor value",
      result: `${yen(modeledRiskValueYen)} risk-adjusted value/month`,
      evidence: "Risk value is reconciled after labor value so the model is inspectable.",
      action: modeledRiskValueYen > 0 ? "Attach security, testing, and observability proof to support this line." : "Do not lean on risk value until the workflow has risk evidence."
    },
    {
      id: "measured-replay",
      label: "Measured replay",
      status: metricStatus(snapshot.measuredSupportPercent, 70, 40),
      input: `${yen(snapshot.measuredMonthlyValueYen)} measured support against ${yen(snapshot.monthlyValueYen)} modeled value.`,
      formula: "measured value / modeled value",
      result: `${snapshot.measuredSupportPercent}% measured support`,
      evidence: `Receipt ${snapshot.receipt.receiptId} records the measured replay payload.`,
      action: snapshot.measuredSupportPercent >= 70 ? "Lead the buyer review with the measured run." : "Collect another measured run before rollout language."
    },
    {
      id: "payback-replay",
      label: "Payback replay",
      status: snapshot.paybackDays <= 30 ? "ready" : snapshot.paybackDays <= 60 ? "attention" : "blocked",
      input: `${yen(impliedPilotInvestmentYen)} implied pilot investment against ${yen(snapshot.monthlyValueYen)} monthly value.`,
      formula: "pilot investment / monthly value x 30 days",
      result: `${snapshot.paybackDays} days payback`,
      evidence: `Pilot ask remains bounded by the ${yen(snapshot.pilotBudgetCeilingYen)} ceiling.`,
      action: snapshot.paybackDays <= 30 ? "Keep the current cap for sponsor approval." : "Reduce the first workflow scope before budget approval."
    },
    {
      id: "receipt-confidence",
      label: "Receipt confidence",
      status: metricStatus(snapshot.confidenceScore, 76, 62),
      input: `${snapshot.confidenceScore}/100 confidence with ${snapshot.receipt.checksumAlgorithm}:${snapshot.receipt.checksum}.`,
      formula: "evidence score + checksum-verifiable receipt",
      result: `${snapshot.confidenceScore}/100 confidence`,
      evidence: `Verification API: POST ${snapshot.receipt.verificationApiPath}.`,
      action: snapshot.confidenceScore >= 76 ? "Send receipt payload and verification JSON together." : "Attach missing release and acceptance receipts first."
    }
  ];
  const firstOpenLine = lines.find((line) => line.status === "blocked") ?? lines.find((line) => line.status === "attention");
  const headline =
    snapshot.status === "ready"
      ? "Value math is replayable"
      : snapshot.status === "attention"
        ? "Replay the value math before pilot approval"
        : "Trace the blocker before sharing value";
  const summary =
    snapshot.status === "ready"
      ? `${snapshot.buyer} can recompute the headline value from assumptions, measured replay, payback, and receipt checksum.`
      : `${firstOpenLine?.label ?? "One trace line"} still needs evidence before the value case should leave the workspace.`;
  const reviewRule =
    snapshot.status === "ready"
      ? "Send only when every buyer-facing number has an input, formula, result, and receipt reference."
      : `Do not send the value case until ${firstOpenLine?.label ?? "the trace gap"} is repaired and re-exported.`;
  const markdown = [
    "# Buyer value trace ledger",
    "",
    `Buyer: ${snapshot.buyer}`,
    `Status: ${traceLedgerLabel(snapshot.status)}`,
    `Headline: ${headline}`,
    `Review rule: ${reviewRule}`,
    "",
    "## Trace lines",
    ...lines.map((line) => `- [${line.status}] ${line.label}: ${line.result}. Input: ${line.input} Formula: ${line.formula}. Evidence: ${line.evidence} Action: ${line.action}`),
    "",
    `Receipt: ${snapshot.receipt.receiptId}`,
    `Checksum: ${snapshot.receipt.checksumAlgorithm}:${snapshot.receipt.checksum}`
  ].join("\n");

  return {
    status: snapshot.status,
    label: traceLedgerLabel(snapshot.status),
    headline,
    summary,
    reviewRule,
    lines,
    markdown
  };
}

function buildBuyerDecisionShortcut(snapshot: HomepageValueLensSnapshot, commitmentDraft: BuyerCommitmentDraft): BuyerDecisionShortcut {
  const firstOpenClause =
    commitmentDraft.clauses.find((clause) => clause.status === "blocked") ??
    commitmentDraft.clauses.find((clause) => clause.status === "attention");
  const approvalStatus = snapshot.status;
  const commercialStatus = snapshot.status === "ready" && commitmentDraft.status === "ready" ? "ready" : snapshot.status === "blocked" ? "blocked" : "attention";
  const headline =
    snapshot.status === "ready"
      ? "Approval memo is the next buyer artifact"
      : snapshot.status === "attention"
        ? "Use approval memo as a gap review"
        : "Keep procurement approval internal";
  const summary =
    snapshot.status === "ready"
      ? "Carry the verified value receipt and pilot terms into sponsor approval before pricing."
      : snapshot.status === "attention"
        ? "Keep the path bounded: value receipt, pilot terms, then procurement gaps."
        : "Repair the value blocker before opening approval memo or commercial terms.";
  const gate =
    snapshot.status === "ready"
      ? `Ask ${snapshot.buyer} to review approval evidence before the commercial offer.`
      : snapshot.status === "attention"
        ? firstOpenClause?.action ?? "Close the weakest pilot clause before sponsor approval."
        : snapshot.readinessCoach.nextMove;
  const steps: BuyerDecisionShortcutStep[] = [
    {
      id: "value-receipt",
      label: "Value receipt",
      status: snapshot.status,
      href: snapshot.receipt.payloadHref,
      evidence: `${snapshot.receipt.receiptId}, ${snapshot.receipt.verification.status} checksum.`,
      action: decisionStepAction(
        snapshot.status,
        "Use as approval evidence.",
        "Attach while the proof gap is repaired.",
        "Rebuild receipt evidence before sharing."
      )
    },
    {
      id: "pilot-terms",
      label: "Pilot acceptance terms",
      status: commitmentDraft.status,
      href: "#pilot-acceptance-terms",
      evidence: `${commitmentDraft.measurementWindow}, ${yen(commitmentDraft.pilotAskYen)} maximum ask.`,
      action: decisionStepAction(
        commitmentDraft.status,
        "Send terms with the approval memo.",
        "Use terms to cap the pilot ask.",
        "Keep terms internal until blockers close."
      )
    },
    {
      id: "approval-memo",
      label: "Approval memo",
      status: approvalStatus,
      href: "#procurement-decision-desk",
      evidence: `${snapshot.buyer} has ${snapshot.measuredSupportPercent}% measured support and ${snapshot.paybackDays}-day payback.`,
      action: decisionStepAction(
        approvalStatus,
        "Open procurement approval.",
        "Review the memo as a gap list.",
        "Do not send for budget approval."
      )
    },
    {
      id: "commercial-offer",
      label: "Commercial offer",
      status: commercialStatus,
      href: "#commercial-offer",
      evidence: `Offer stays behind ${commitmentDraft.label.toLowerCase()}.`,
      action: decisionStepAction(
        commercialStatus,
        "Price only after approval evidence is ready.",
        "Hold expansion language until proof improves.",
        "Hold pricing until value proof is repaired."
      )
    }
  ];
  const markdown = [
    "# Buyer decision shortcut",
    "",
    `Buyer: ${snapshot.buyer}`,
    `Status: ${decisionShortcutLabel(snapshot.status)}`,
    `Headline: ${headline}`,
    `Gate: ${gate}`,
    "",
    "## Route",
    ...steps.map((step) => `- [${step.status}] ${step.label}: ${step.evidence} Action: ${step.action} Link: ${shortcutLinkForMarkdown(step.href)}`),
    "",
    `Value receipt: ${snapshot.receipt.receiptId}`,
    `Checksum: ${snapshot.receipt.checksumAlgorithm}:${snapshot.receipt.checksum}`
  ].join("\n");

  return {
    status: snapshot.status,
    label: decisionShortcutLabel(snapshot.status),
    headline,
    summary,
    gate,
    steps,
    markdown
  };
}

export function HomepageValueLens({
  snapshot,
  onAssumptionChange
}: {
  snapshot: HomepageValueLensSnapshot;
  onAssumptionChange: (patch: Partial<BuyerValueScenarioInput>) => void;
}) {
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "checking" | "verified" | "failed">("idle");
  const [verifyMessage, setVerifyMessage] = useState("Value receipt not checked in this browser yet.");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [traceCopyStatus, setTraceCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const commitmentDraft = buildBuyerCommitmentDraft(snapshot);
  const valueTraceLedger = buildBuyerValueTraceLedger(snapshot);
  const decisionShortcut = buildBuyerDecisionShortcut(snapshot, commitmentDraft);
  useEffect(() => {
    setVerifyStatus("idle");
    setVerifyMessage("Value receipt not checked in this browser yet.");
    setCopyStatus("idle");
    setTraceCopyStatus("idle");
  }, [snapshot.receipt.checksum]);

  function updateNumber(key: keyof BuyerValueScenarioInput, rawValue: string) {
    const nextValue = Number(rawValue);
    if (!Number.isFinite(nextValue)) return;
    onAssumptionChange({ [key]: nextValue });
  }

  async function verifyValueReceipt() {
    if (verifyStatus === "checking") return;
    setVerifyStatus("checking");
    setVerifyMessage("Checking value receipt checksum...");
    try {
      const response = await fetch(snapshot.receipt.verificationApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: snapshot.receipt.verificationRequestJson
      });
      const body = (await response.json()) as { verification?: { status?: string; instruction?: string }; error?: string };
      if (!response.ok || body.verification?.status !== "verified") {
        throw new Error(body.verification?.instruction || body.error || `Value receipt verification failed with HTTP ${response.status}.`);
      }
      setVerifyStatus("verified");
      setVerifyMessage(body.verification.instruction || "Value receipt checksum verified.");
    } catch (error) {
      setVerifyStatus("failed");
      setVerifyMessage(error instanceof Error ? error.message : "Value receipt verification failed.");
    }
  }

  async function copyCommitmentTerms() {
    try {
      await navigator.clipboard.writeText(commitmentDraft.markdown);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  async function copyValueTrace() {
    try {
      await navigator.clipboard.writeText(valueTraceLedger.markdown);
      setTraceCopyStatus("copied");
    } catch {
      setTraceCopyStatus("failed");
    }
  }

  return (
    <section className={cx("homepage-value-lens", `is-${snapshot.status}`)} aria-label="Homepage value lens">
      <div className="homepage-value-lens-main">
        <span>
          <Calculator size={14} />
          Value lens
        </span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.valueClaim}</p>
        <div className="homepage-value-lens-actions" aria-label="Homepage value actions">
          <a className="homepage-value-lens-primary" href={snapshot.primaryAction.href} {...routeAction(snapshot.primaryAction.href)}>
            <ExternalLink size={14} />
            {snapshot.primaryAction.label}
          </a>
          <a className="homepage-value-lens-link" href={snapshot.workflowAction.href} {...routeAction(snapshot.workflowAction.href)}>
            <TrendingUp size={14} />
            {snapshot.workflowAction.label}
          </a>
          <button className="homepage-value-lens-link" type="button" data-download="homepage-value-lens.md" data-download-filename="homepage-value-lens.md" onClick={() => downloadTextFile("homepage-value-lens.md", snapshot.exportMarkdown)}>
            <Download size={14} />
            Export value case
          </button>
        </div>
      </div>
      <aside className="homepage-value-lens-score" aria-label="Value lens score">
        <span>{snapshot.status}</span>
        <strong>{yen(snapshot.monthlyValueYen)}</strong>
        <small>{snapshot.paybackDays} days payback</small>
        <button className="homepage-value-lens-receipt" type="button" data-download={`${snapshot.receipt.receiptId}.json`} data-download-filename={`${snapshot.receipt.receiptId}.json`} onClick={() => downloadJsonFile(`${snapshot.receipt.receiptId}.json`, snapshot.receipt)}>
          <Download size={14} />
          Value receipt
        </button>
        <button className="homepage-value-lens-receipt" type="button" onClick={verifyValueReceipt} disabled={verifyStatus === "checking"}>
          <ShieldCheck size={14} />
          {verifyStatus === "verified" ? "Verified" : verifyStatus === "checking" ? "Checking" : "Verify value"}
        </button>
        <button className="homepage-value-lens-receipt" type="button" data-download={`${snapshot.receipt.receiptId}-verify.json`} data-download-filename={`${snapshot.receipt.receiptId}-verify.json`} onClick={() => downloadHrefFile(`${snapshot.receipt.receiptId}-verify.json`, snapshot.receipt.verificationRequestHref)}>
          <FileText size={14} />
          Verify JSON
        </button>
        <small className="homepage-value-lens-endpoint">POST {snapshot.receipt.verificationApiPath}</small>
        <small className={cx("homepage-value-lens-verify-status", verifyStatus === "verified" && "is-confirmed", verifyStatus === "failed" && "is-risk")}>
          {verifyMessage}
        </small>
      </aside>
      <div className="homepage-value-lens-controls" aria-label="Value assumptions">
        {ASSUMPTION_FIELDS.map((field) => (
          <label key={field.key}>
            <span>{field.label}</span>
            <input
              aria-label={field.label}
              type="number"
              min={field.min}
              max={field.max}
              step={field.step}
              value={snapshot.assumptions[field.key]}
              onChange={(event) => updateNumber(field.key, event.currentTarget.value)}
            />
            <small>{field.suffix}</small>
          </label>
        ))}
      </div>
      <div className="homepage-value-lens-metrics" aria-label="Value lens metrics">
        {snapshot.metrics.map((metric) => (
          <article key={metric.id} className={metric.status}>
            <span>
              {metric.status === "ready" ? <BadgeCheck size={14} /> : metric.status === "attention" ? <Gauge size={14} /> : <Clock3 size={14} />}
              {metric.label}
            </span>
            <strong>{metric.value}</strong>
            <p>{metric.evidence}</p>
          </article>
        ))}
      </div>
      <div className={cx("homepage-value-lens-trace", valueTraceLedger.status)} aria-label="Value trace ledger">
        <div className="homepage-value-lens-trace-head">
          <span>
            <FileText size={14} />
            Value trace ledger
          </span>
          <strong>{valueTraceLedger.headline}</strong>
          <p>{valueTraceLedger.summary}</p>
          <div className="homepage-value-lens-trace-actions" aria-label="Value trace ledger actions">
            <button type="button" onClick={copyValueTrace}>
              <Copy size={14} />
              {traceCopyStatus === "copied" ? "Copied" : traceCopyStatus === "failed" ? "Copy failed" : "Copy trace"}
            </button>
            <button className="homepage-value-lens-action-secondary" type="button" data-download="buyer-value-trace-ledger.md" data-download-filename="buyer-value-trace-ledger.md" onClick={() => downloadTextFile("buyer-value-trace-ledger.md", valueTraceLedger.markdown)}>
              <Download size={14} />
              Export trace
            </button>
            <button className="homepage-value-lens-action-secondary" type="button" data-download={`${snapshot.receipt.receiptId}-payload.json`} data-download-filename={`${snapshot.receipt.receiptId}-payload.json`} onClick={() => downloadHrefFile(`${snapshot.receipt.receiptId}-payload.json`, snapshot.receipt.payloadHref)}>
              <FileText size={14} />
              Receipt payload
            </button>
          </div>
        </div>
        <aside className="homepage-value-lens-trace-score" aria-label="Value trace status">
          <span>{valueTraceLedger.label}</span>
          <strong>{valueTraceLedger.lines.filter((line) => line.status === "ready").length}/{valueTraceLedger.lines.length}</strong>
          <small>Ready trace lines</small>
          <small>{snapshot.receipt.verification.status} checksum</small>
        </aside>
        <div className="homepage-value-lens-trace-rule" aria-label="Value trace review rule">
          <span>
            <ListChecks size={14} />
            Review rule
          </span>
          <strong>{valueTraceLedger.reviewRule}</strong>
        </div>
        <div className="homepage-value-lens-trace-lines" aria-label="Value trace lines">
          {valueTraceLedger.lines.map((line) => (
            <article key={line.id} className={line.status}>
              <span>
                {line.status === "ready" ? <BadgeCheck size={14} /> : line.status === "attention" ? <Gauge size={14} /> : <Clock3 size={14} />}
                {line.label}
              </span>
              <strong>{line.result}</strong>
              <small>Input: {line.input}</small>
              <small>Formula: {line.formula}</small>
              <p>{line.evidence}</p>
              <small>{line.action}</small>
            </article>
          ))}
        </div>
      </div>
      <div className={cx("homepage-value-lens-decision-shortcut", decisionShortcut.status)} aria-label="Buyer decision shortcut">
        <div className="homepage-value-lens-decision-shortcut-head">
          <span>
            <Route size={14} />
            Buyer decision shortcut
          </span>
          <strong>{decisionShortcut.headline}</strong>
          <p>{decisionShortcut.summary}</p>
          <div className="homepage-value-lens-decision-shortcut-actions" aria-label="Buyer decision shortcut actions">
            <a href="#procurement-decision-desk">
              <ClipboardCheck size={14} />
              Open approval memo
            </a>
            <button className="homepage-value-lens-action-secondary" type="button" data-download="buyer-decision-shortcut.md" data-download-filename="buyer-decision-shortcut.md" onClick={() => downloadTextFile("buyer-decision-shortcut.md", decisionShortcut.markdown)}>
              <Download size={14} />
              Export route
            </button>
          </div>
        </div>
        <aside className="homepage-value-lens-decision-shortcut-gate" aria-label="Buyer decision gate">
          <span>{decisionShortcut.label}</span>
          <strong>{snapshot.measuredSupportPercent}%</strong>
          <small>Measured support</small>
          <small>{decisionShortcut.gate}</small>
        </aside>
        <div className="homepage-value-lens-decision-shortcut-steps" aria-label="Buyer decision route">
          {decisionShortcut.steps.map((step) => (
            <a key={step.id} className={step.status} href={step.href} {...routeAction(step.href)}>
              <span>
                {step.status === "ready" ? <BadgeCheck size={14} /> : step.status === "attention" ? <Gauge size={14} /> : <Clock3 size={14} />}
                {step.label}
              </span>
              <strong>{step.evidence}</strong>
              <small>
                {step.action}
                <ArrowRight size={13} />
              </small>
            </a>
          ))}
        </div>
      </div>
      <div className={cx("homepage-value-lens-coach", snapshot.readinessCoach.status)} aria-label="Buyer value readiness coach">
        <div className="homepage-value-lens-coach-head">
          <span>
            <ShieldCheck size={14} />
            Readiness coach
          </span>
          <strong>{snapshot.readinessCoach.headline}</strong>
          <p>{snapshot.readinessCoach.summary}</p>
        </div>
        <aside className="homepage-value-lens-coach-score" aria-label="Buyer value readiness status">
          <span>{snapshot.readinessCoach.label}</span>
          <strong>{snapshot.measuredSupportPercent}%</strong>
          <small>Measured support</small>
          <small>{snapshot.readinessCoach.nextMove}</small>
        </aside>
        <div className="homepage-value-lens-coach-rule" aria-label="Buyer value readiness send rule">
          <span>Send rule</span>
          <strong>{snapshot.readinessCoach.sendRule}</strong>
          <p>{snapshot.readinessCoach.buyerAsk}</p>
        </div>
        <div className="homepage-value-lens-coach-levers" aria-label="Buyer value readiness levers">
          {snapshot.readinessCoach.levers.map((lever) => (
            <article key={lever.id} className={lever.status}>
              <span>
                {lever.status === "ready" ? <BadgeCheck size={14} /> : lever.status === "attention" ? <Gauge size={14} /> : <Clock3 size={14} />}
                {lever.label}
              </span>
              <strong>{lever.value}</strong>
              <small>{lever.evidence}</small>
              <p>{lever.action}</p>
            </article>
          ))}
        </div>
      </div>
      <div id="pilot-acceptance-terms" className={cx("homepage-value-lens-commitment", commitmentDraft.status)} aria-label="Pilot acceptance terms">
        <div className="homepage-value-lens-commitment-head">
          <span>
            <ClipboardCheck size={14} />
            Pilot acceptance terms
          </span>
          <strong>{commitmentDraft.headline}</strong>
          <p>{commitmentDraft.promise}</p>
          <div className="homepage-value-lens-commitment-actions" aria-label="Pilot acceptance term actions">
            <button type="button" onClick={copyCommitmentTerms}>
              <Copy size={14} />
              {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy terms"}
            </button>
            <button className="homepage-value-lens-action-secondary" type="button" data-download="pilot-acceptance-terms.md" data-download-filename="pilot-acceptance-terms.md" onClick={() => downloadTextFile("pilot-acceptance-terms.md", commitmentDraft.markdown)}>
              <Download size={14} />
              Export terms
            </button>
          </div>
        </div>
        <aside className="homepage-value-lens-commitment-score" aria-label="Pilot acceptance status">
          <span>{commitmentDraft.label}</span>
          <strong>{yen(commitmentDraft.pilotAskYen)}</strong>
          <small>Maximum pilot ask</small>
          <small>{commitmentDraft.measurementWindow}</small>
        </aside>
        <div className="homepage-value-lens-commitment-rule" aria-label="Pilot acceptance stop rule">
          <span>
            <ListChecks size={14} />
            Stop rule
          </span>
          <strong>{commitmentDraft.stopRule}</strong>
        </div>
        <div className="homepage-value-lens-commitment-clauses" aria-label="Pilot acceptance clauses">
          {commitmentDraft.clauses.map((clause) => (
            <article key={clause.id} className={clause.status}>
              <span>
                {clause.status === "ready" ? <BadgeCheck size={14} /> : clause.status === "attention" ? <Gauge size={14} /> : <Clock3 size={14} />}
                {clause.label}
              </span>
              <strong>{clause.target}</strong>
              <small>{clause.evidence}</small>
              <p>{clause.action}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HomepageValueLens;
