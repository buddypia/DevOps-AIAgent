import { buildBuyerPilotMeasuredRunSummary, type BuyerPilotMeasuredRunSummary } from "./buyerPilotMeasuredRun.js";
import { buildBuyerValueAcceptanceReceipt } from "./buyerValueAcceptanceReceipt.js";
import { buildBuyerValueCommitment, type BuyerValueCommitment } from "./buyerValueCommitment.js";
import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import { buildBuyerValueSensitivity, type BuyerValueSensitivity } from "./buyerValueSensitivity.js";
import { normalizePilotRunReceiptInput, type PilotRunReceiptInput } from "./pilotRunReceipt.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";

export type BuyerValueReportReadiness = "board-ready" | "pilot-only" | "do-not-pitch";
export type BuyerValueReportEvidenceMode = "measured-supported" | "measured-partial" | "measurement-needed";

export type BuyerValueReportCheck = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  evidence: string;
};

export type BuyerValueReportEvidence = {
  mode: BuyerValueReportEvidenceMode;
  headline: string;
  hardTruth: string;
  measuredRun: BuyerPilotMeasuredRunSummary;
  supportRatioPercent: number;
  evidenceUrl: string;
  reviewerName: string;
  checks: BuyerValueReportCheck[];
};

export type BuyerValueReportAssumptionAuditItem = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  current: string;
  target: string;
  impact: string;
  action: string;
};

export type BuyerValueReportAssumptionAudit = {
  headline: string;
  hardTruth: string;
  clearCount: number;
  totalCount: number;
  items: BuyerValueReportAssumptionAuditItem[];
};

export type BuyerValueReport = {
  id: string;
  readiness: BuyerValueReportReadiness;
  headline: string;
  hardTruth: string;
  targetBuyer: string;
  selectedAgents: string[];
  buyerScenario: BuyerValueScenario;
  sensitivity: BuyerValueSensitivity;
  commitment: BuyerValueCommitment;
  evidence: BuyerValueReportEvidence;
  assumptionAudit: BuyerValueReportAssumptionAudit;
  checks: BuyerValueReportCheck[];
  exportMarkdown: string;
};

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function tone(status: string) {
  if (["board-ready", "defensible", "clear", "scales-now", "measured-supported"].includes(status)) return "good";
  if (["do-not-pitch", "not-defensible", "blocked", "not-yet", "measurement-needed"].includes(status)) return "bad";
  return "watch";
}

function publicUrlStatus(value: string): BuyerValueScenarioStatus {
  if (!value) return "blocked";
  if (isBuyerFacingProofUrl(value)) return "clear";
  return "watch";
}

function statusFromSupportRatio(value: number): BuyerValueScenarioStatus {
  if (value >= 70) return "clear";
  if (value >= 40) return "watch";
  return "blocked";
}

function evidenceModeFrom(input: { measuredRun: BuyerPilotMeasuredRunSummary; supportRatioPercent: number; evidenceUrl: string }) {
  if (input.measuredRun.readiness === "measured" && input.supportRatioPercent >= 70 && publicUrlStatus(input.evidenceUrl) === "clear") return "measured-supported";
  if (input.measuredRun.readiness === "needs-savings" || input.supportRatioPercent < 40) return "measurement-needed";
  return "measured-partial";
}

function evidenceHeadlineFor(mode: BuyerValueReportEvidenceMode) {
  if (mode === "measured-supported") return "Measured pilot evidence supports the value claim";
  if (mode === "measured-partial") return "Measured pilot evidence is useful but not procurement-ready";
  return "Measured pilot evidence is still missing";
}

function buildEvidence(input: { scenario: BuyerValueScenario; pilotRun?: Partial<PilotRunReceiptInput> }): BuyerValueReportEvidence {
  const normalized = normalizePilotRunReceiptInput(input.pilotRun);
  const measuredRun = buildBuyerPilotMeasuredRunSummary(normalized, input.scenario);
  const supportRatioPercent = Math.round((measuredRun.measuredMonthlyValueYen / Math.max(1, input.scenario.monthlyGrossValueYen)) * 100);
  const mode = evidenceModeFrom({ measuredRun, supportRatioPercent, evidenceUrl: normalized.evidenceUrl });
  const receiptStatus = publicUrlStatus(normalized.evidenceUrl);
  const reviewerStatus: BuyerValueScenarioStatus = normalized.reviewerName ? "clear" : "blocked";
  const hardTruth =
    mode === "measured-supported"
      ? `Measured value covers ${supportRatioPercent}% of the model with ${measuredRun.acceptanceRatePercent}% task acceptance and a public receipt.`
      : mode === "measured-partial"
        ? `Measured value covers ${supportRatioPercent}% of the model, but reviewer, acceptance, or receipt proof still limits external sharing.`
        : `Measured value covers ${supportRatioPercent}% of the model. Treat the ROI as modeled until a stronger pilot receipt is attached.`;

  return {
    mode,
    headline: evidenceHeadlineFor(mode),
    hardTruth,
    measuredRun,
    supportRatioPercent,
    evidenceUrl: normalized.evidenceUrl,
    reviewerName: normalized.reviewerName,
    checks: [
      {
        id: "measured-value",
        label: "Measured value support",
        status: statusFromSupportRatio(supportRatioPercent),
        evidence: `${yen(measuredRun.measuredMonthlyValueYen)} measured value covers ${supportRatioPercent}% of the ${yen(input.scenario.monthlyGrossValueYen)} model.`
      },
      {
        id: "acceptance",
        label: "Task acceptance",
        status: measuredRun.acceptanceRatePercent >= 70 ? "clear" : measuredRun.acceptanceRatePercent >= 50 ? "watch" : "blocked",
        evidence: `${measuredRun.acceptanceRatePercent}% accepted in the measured run.`
      },
      {
        id: "reviewer",
        label: "Named reviewer",
        status: reviewerStatus,
        evidence: normalized.reviewerName ? `${normalized.reviewerName} can stand behind the pilot result.` : "Name the buyer-side reviewer before sharing externally."
      },
      {
        id: "receipt-url",
        label: "Public receipt",
        status: receiptStatus,
        evidence: receiptStatus === "clear" ? normalized.evidenceUrl : "Attach a public pilot receipt, recording, issue, or run log URL."
      }
    ]
  };
}

function readinessFrom(input: { scenario: BuyerValueScenario; sensitivity: BuyerValueSensitivity }): BuyerValueReportReadiness {
  if (input.scenario.readiness === "scales-now" && input.sensitivity.verdict === "defensible") return "board-ready";
  if (input.scenario.readiness === "not-yet" || input.sensitivity.verdict === "not-defensible") return "do-not-pitch";
  return "pilot-only";
}

function headlineFor(readiness: BuyerValueReportReadiness) {
  if (readiness === "board-ready") return "This buyer value case is ready for sponsor review";
  if (readiness === "pilot-only") return "This value case should stay inside a bounded pilot";
  return "Do not pitch this as buyer-ready yet";
}

function hardTruthFor(readiness: BuyerValueReportReadiness, scenario: BuyerValueScenario, sensitivity: BuyerValueSensitivity) {
  if (readiness === "board-ready") {
    return `The base case pays back in ${scenario.paybackDays} days and the downside case still stays inside ${sensitivity.cases[0].paybackDays} days.`;
  }
  if (readiness === "pilot-only") {
    return `The base case is useful, but the downside case needs ${sensitivity.cases[0].paybackDays} days. Keep the ask small until proof improves.`;
  }
  return `Payback or evidence confidence is too weak. Tighten the target workflow before presenting this to a buyer.`;
}

function buildChecks(input: { scenario: BuyerValueScenario; sensitivity: BuyerValueSensitivity }): BuyerValueReportCheck[] {
  const downside = input.sensitivity.cases[0];
  return [
    {
      id: "base-payback",
      label: "Base payback",
      status: input.scenario.paybackDays <= 45 ? "clear" : input.scenario.paybackDays <= 90 ? "watch" : "blocked",
      evidence: `${input.scenario.paybackDays} days against ${yen(input.scenario.pilotInvestmentYen)} pilot investment.`
    },
    {
      id: "downside-case",
      label: "Downside case",
      status: downside.status,
      evidence: `${yen(downside.monthlyValueYen)} monthly value at ${downside.adoptionRatePercent}% adoption and ${downside.automationRatePercent}% automation.`
    },
    {
      id: "adoption-threshold",
      label: "Adoption threshold",
      status: input.sensitivity.guardrails.find((item) => item.id === "break-even-adoption")?.status ?? "blocked",
      evidence: `${input.sensitivity.breakEvenAdoptionPercent}% adoption needed for 45-day payback. Current assumption is ${input.scenario.assumptions.adoptionRatePercent}%.`
    },
    {
      id: "evidence-confidence",
      label: "Evidence confidence",
      status: input.scenario.confidenceScore >= 76 ? "clear" : input.scenario.confidenceScore >= 62 ? "watch" : "blocked",
      evidence: `${input.scenario.confidenceScore}/100 from delivery, reliability, usability, governance, and selected-agent risk capability.`
    }
  ];
}

function auditAction(status: BuyerValueScenarioStatus, clear: string, watch: string, blocked: string) {
  if (status === "clear") return clear;
  if (status === "watch") return watch;
  return blocked;
}

function buildAssumptionAudit(input: {
  scenario: BuyerValueScenario;
  sensitivity: BuyerValueSensitivity;
  commitment: BuyerValueCommitment;
  evidence: BuyerValueReportEvidence;
}): BuyerValueReportAssumptionAudit {
  const breakEven = input.sensitivity.guardrails.find((item) => item.id === "break-even-adoption");
  const valueAtRisk = input.sensitivity.guardrails.find((item) => item.id === "value-at-risk");
  const receipt = input.evidence.checks.find((item) => item.id === "receipt-url");
  const pilotAsk = input.commitment.conditions.find((item) => item.id === "pilot-ask");
  const downside = input.sensitivity.cases[0];
  const base = input.sensitivity.cases.find((item) => item.id === "base") ?? input.sensitivity.cases[1] ?? downside;

  const items: BuyerValueReportAssumptionAuditItem[] = [
    {
      id: "adoption-floor",
      label: "Adoption floor",
      status: breakEven?.status ?? "blocked",
      current: `${input.scenario.assumptions.adoptionRatePercent}% assumed`,
      target: `${input.sensitivity.breakEvenAdoptionPercent}% for 45-day payback`,
      impact: `${yen(base.monthlyValueYen)} base value; ${yen(input.sensitivity.valueAtRiskYen)} at risk if adoption falls to the pessimistic case.`,
      action: auditAction(
        breakEven?.status ?? "blocked",
        "Keep this adoption floor in the pilot success criteria.",
        "Ask the buyer to confirm the pilot audience before presenting ROI.",
        "Shrink the workflow or team scope before presenting the value case."
      )
    },
    {
      id: "downside-payback",
      label: "Downside payback",
      status: downside.status,
      current: `${downside.paybackDays} days`,
      target: "60 days or less",
      impact: `${yen(downside.monthlyValueYen)} pessimistic monthly value after adoption, automation, and risk capture are reduced.`,
      action: auditAction(
        downside.status,
        "Use the downside case as the buyer-safe pilot floor.",
        "Keep the ask to a contained pilot until one measured run clears this case.",
        "Do not request rollout budget until the pessimistic case improves."
      )
    },
    {
      id: "measured-support",
      label: "Measured support",
      status: statusFromSupportRatio(input.evidence.supportRatioPercent),
      current: `${input.evidence.supportRatioPercent}% of model supported`,
      target: "70% or more with accepted tasks",
      impact: `${yen(input.evidence.measuredRun.measuredMonthlyValueYen)} measured labor value from ${input.evidence.measuredRun.actualMinutesSavedPerRun} minutes saved/run.`,
      action: auditAction(
        statusFromSupportRatio(input.evidence.supportRatioPercent),
        "Attach this measured run to the buyer memo.",
        "Run one more pilot replay before treating the model as procurement-ready.",
        "Treat the ROI as modeled until measured savings improves."
      )
    },
    {
      id: "public-receipt",
      label: "Public receipt",
      status: receipt?.status ?? "blocked",
      current: input.evidence.evidenceUrl || "missing",
      target: "Public HTTPS pilot receipt",
      impact: input.evidence.reviewerName ? `${input.evidence.reviewerName} can stand behind the run.` : "No named reviewer is attached to the measured run.",
      action: auditAction(
        receipt?.status ?? "blocked",
        "Keep the receipt URL attached to every buyer-facing packet.",
        "Replace this with a buyer-openable HTTPS receipt before external review.",
        "Create a public pilot receipt before sharing the value report."
      )
    },
    {
      id: "budget-ask",
      label: "Budget ask",
      status: pilotAsk?.status ?? "blocked",
      current: yen(input.commitment.recommendedAskYen),
      target: `${yen(input.scenario.pilotBudgetCeilingYen)} ceiling`,
      impact: input.commitment.askInstruction,
      action: auditAction(
        pilotAsk?.status ?? "blocked",
        "Use this ask as the maximum first buyer commitment.",
        "Reduce the ask or attach stronger measured proof before sponsor review.",
        "Do not ask for budget until the value proof is repaired."
      )
    }
  ];
  const clearCount = items.filter((item) => item.status === "clear").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const headline =
    blockedCount === 0 && clearCount === items.length
      ? "The value model has buyer-inspectable assumptions"
      : blockedCount > 0
        ? "This value case has buyer-visible assumption gaps"
        : "This value case needs explicit buyer guardrails";

  return {
    headline,
    hardTruth: `${clearCount}/${items.length} assumptions are clear. The buyer should inspect adoption, downside payback, measured support, public receipt, and budget ask before approving expansion.`,
    clearCount,
    totalCount: items.length,
    items
  };
}

function buildMarkdown(input: Omit<BuyerValueReport, "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    `Readiness: ${input.readiness}`,
    `Target buyer: ${input.targetBuyer}`,
    `Selected agents: ${input.selectedAgents.join(", ") || "None"}`,
    "",
    input.hardTruth,
    "",
    "## Base case",
    `- Monthly value: ${yen(input.buyerScenario.monthlyGrossValueYen)}`,
    `- Monthly hours saved: ${input.buyerScenario.monthlyHoursSaved}h`,
    `- Payback: ${input.buyerScenario.paybackDays} days`,
    `- Pilot budget ceiling: ${yen(input.buyerScenario.pilotBudgetCeilingYen)}`,
    "",
    "## Measured proof",
    `- Mode: ${input.evidence.mode}`,
    `- Measured monthly value: ${yen(input.evidence.measuredRun.measuredMonthlyValueYen)}`,
    `- Model support: ${input.evidence.supportRatioPercent}%`,
    `- Acceptance: ${input.evidence.measuredRun.acceptanceRatePercent}%`,
    `- Reviewer: ${input.evidence.reviewerName || "missing"}`,
    `- Receipt: ${input.evidence.evidenceUrl || "missing"}`,
    ...input.evidence.checks.map((check) => `- [${check.status}] ${check.label}: ${check.evidence}`),
    "",
    "## Assumption audit",
    input.assumptionAudit.headline,
    input.assumptionAudit.hardTruth,
    ...input.assumptionAudit.items.map((item) => `- [${item.status}] ${item.label}: current ${item.current}; target ${item.target}; impact ${item.impact}; action ${item.action}`),
    "",
    "## Sensitivity",
    `- Confidence band: ${input.sensitivity.confidenceBand}`,
    `- Break-even adoption: ${input.sensitivity.breakEvenAdoptionPercent}%`,
    `- Value at risk: ${yen(input.sensitivity.valueAtRiskYen)}`,
    ...input.sensitivity.cases.map((item) => `- ${item.label}: ${yen(item.monthlyValueYen)}, ${item.paybackDays} day payback`),
    "",
    "## Buyer commitment",
    `- Decision: ${input.commitment.decision}`,
    `- ${input.commitment.askLabel}: ${yen(input.commitment.recommendedAskYen)}`,
    `- Owner: ${input.commitment.decisionOwner}`,
    ...input.commitment.conditions.map((condition) => `- [${condition.status}] ${condition.label}: ${condition.value}`),
    "",
    "## Red lines",
    ...input.commitment.redLines.map((redLine) => `- [${redLine.status}] ${redLine.label}: ${redLine.trigger}`),
    "",
    "## Decision checks",
    ...input.checks.map((check) => `- [${check.status}] ${check.label}: ${check.evidence}`)
  ].join("\n");
}

export function buildBuyerValueReport(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  pilotRun?: Partial<PilotRunReceiptInput>;
}): BuyerValueReport {
  const sensitivity = buildBuyerValueSensitivity(input.buyerScenario);
  const commitment = buildBuyerValueCommitment({ scenario: input.buyerScenario, sensitivity });
  const evidence = buildEvidence({ scenario: input.buyerScenario, pilotRun: input.pilotRun });
  const readiness = readinessFrom({ scenario: input.buyerScenario, sensitivity });
  const assumptionAudit = buildAssumptionAudit({ scenario: input.buyerScenario, sensitivity, commitment, evidence });
  const partial = {
    id: `buyer-value-report-${readiness}-${input.buyerScenario.scenarioScore}`,
    readiness,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, input.buyerScenario, sensitivity),
    targetBuyer: input.valueBlueprint.primaryUser,
    selectedAgents: input.recommendation.selected.map((agent) => agent.name),
    buyerScenario: input.buyerScenario,
    sensitivity,
    commitment,
    evidence,
    assumptionAudit,
    checks: buildChecks({ scenario: input.buyerScenario, sensitivity })
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderBuyerValueReportHtml(
  report: BuyerValueReport,
  links: { proposalUrl?: string; diligenceUrl?: string; workflowUrl?: string; jsonUrl?: string; markdownUrl?: string; appUrl?: string; selfUrl?: string } = {}
) {
  const scenario = report.buyerScenario;
  const commitment = report.commitment;
  const evidence = report.evidence;
  const acceptance = buildBuyerValueAcceptanceReceipt({ report, valueReportHref: links.selfUrl ?? links.jsonUrl ?? links.markdownUrl ?? "" });
  const metrics = [
    { label: "Readiness", value: report.readiness, status: report.readiness },
    { label: "Monthly value", value: yen(scenario.monthlyGrossValueYen), status: scenario.readiness },
    { label: "Base payback", value: `${scenario.paybackDays} days`, status: scenario.paybackDays <= 45 ? "clear" : "watch" },
    { label: "Measured proof", value: evidence.mode, status: evidence.mode },
    { label: "Break-even", value: `${report.sensitivity.breakEvenAdoptionPercent}% adoption`, status: report.sensitivity.guardrails[0]?.status ?? "blocked" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const cases = report.sensitivity.cases
    .map(
      (item) => `
        <article class="card ${tone(item.status)}">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(yen(item.monthlyValueYen))}</strong>
          <p>${escapeHtml(item.monthlyHoursSaved)}h saved / ${escapeHtml(item.paybackDays)} day payback</p>
          <small>${escapeHtml(item.adoptionRatePercent)}% adoption, ${escapeHtml(item.automationRatePercent)}% automation. ${escapeHtml(item.evidence)}</small>
        </article>`
    )
    .join("");
	  const checks = report.checks
    .map(
      (check) => `
        <article class="card ${tone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.evidence)}</p>
        </article>`
    )
	    .join("");
  const commitmentConditions = commitment.conditions
    .map(
      (condition) => `
        <article class="card ${tone(condition.status)}">
          <div><strong>${escapeHtml(condition.label)}</strong><span>${escapeHtml(condition.status)}</span></div>
          <p>${escapeHtml(condition.value)}</p>
          <small>${escapeHtml(condition.evidence)}</small>
        </article>`
    )
    .join("");
  const evidenceChecks = evidence.checks
    .map(
      (check) => `
        <article class="card ${tone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.evidence)}</p>
        </article>`
    )
    .join("");
  const assumptionRows = report.assumptionAudit.items
    .map(
      (item) => `
        <article class="audit-row ${tone(item.status)}">
          <div>
            <span>${escapeHtml(item.status)}</span>
            <strong>${escapeHtml(item.label)}</strong>
          </div>
          <dl>
            <div><dt>Current</dt><dd>${escapeHtml(item.current)}</dd></div>
            <div><dt>Target</dt><dd>${escapeHtml(item.target)}</dd></div>
          </dl>
          <p>${escapeHtml(item.impact)}</p>
          <small>${escapeHtml(item.action)}</small>
        </article>`
    )
    .join("");
  const redLines = commitment.redLines
    .map(
      (redLine) => `
        <article class="card ${tone(redLine.status)}">
          <div><strong>${escapeHtml(redLine.label)}</strong><span>${escapeHtml(redLine.status)}</span></div>
          <p>${escapeHtml(redLine.trigger)}</p>
          <small>${escapeHtml(redLine.action)}</small>
        </article>`
    )
    .join("");
  const acceptanceChecks = acceptance.payload.checks
    .map(
      (check) => `
        <article class="card ${tone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.value)}</p>
          <small>${escapeHtml(check.evidence)}</small>
        </article>`
    )
    .join("");
  const agents = report.selectedAgents.map((agent) => `<li>${escapeHtml(agent)}</li>`).join("");
  const linkList = [
    links.proposalUrl ? `<a href="${escapeHtml(links.proposalUrl)}">Buyer proposal</a>` : "",
    links.diligenceUrl ? `<a href="${escapeHtml(links.diligenceUrl)}">Diligence room</a>` : "",
    links.workflowUrl ? `<a href="${escapeHtml(links.workflowUrl)}">Pilot workflow</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON report</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown report</a>` : "",
    `<a href="${escapeHtml(acceptance.verifierHref)}">Verify acceptance</a>`,
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(report.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #52645f; --line: #cbd7d2; --paper: #f3f7f5; --panel: #fffdf7; --teal: #0f766e; --blue: #2457a6; --green-bg: #edf8f1; --amber-bg: #fff7dd; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 22px; }
      .eyebrow, .metric span, .card span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.2rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p { color: var(--muted); }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: end; }
      .stamp { min-height: 190px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #102226, #0f766e); text-align: center; }
      .stamp span { color: #ffe4a8; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { padding: 0 18px; font-size: 1.8rem; line-height: 1; overflow-wrap: anywhere; }
	      .metrics, .grid, .cases, .commitment, .acceptance-cases { display: grid; gap: 10px; }
	      .metrics { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 20px; }
	      .grid { grid-template-columns: minmax(0, .82fr) minmax(320px, .48fr); align-items: start; }
	      .cases { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	      .acceptance-cases { grid-template-columns: repeat(5, minmax(0, 1fr)); }
	      .commitment { grid-template-columns: minmax(0, .7fr) minmax(320px, .5fr); }
	      .metric, .panel, .card { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.25rem; line-height: 1.1; overflow-wrap: anywhere; }
      .panel { padding: 16px; }
      .card { display: grid; gap: 7px; padding: 13px; }
      .card div { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
	      .card strong, .card p, .card small, li { overflow-wrap: anywhere; }
	      .ask { display: grid; gap: 7px; border-radius: 8px; padding: 16px; color: #fffdf7; background: linear-gradient(150deg, #102226, #0f766e); }
	      .ask span { color: #ffe4a8; font-size: .74rem; font-weight: 950; text-transform: uppercase; }
	      .ask strong { font-size: 2rem; line-height: 1; }
	      .ask p, .ask small { margin: 0; color: rgba(255, 253, 247, .78); }
	      .proof-strip { display: grid; grid-template-columns: minmax(0, .52fr) minmax(0, .48fr); gap: 10px; }
	      .proof-meter { display: grid; gap: 7px; border-radius: 8px; padding: 16px; color: #fffdf7; background: linear-gradient(150deg, #102226, #2457a6); }
	      .proof-meter span { color: #ffe4a8; font-size: .74rem; font-weight: 950; text-transform: uppercase; }
	      .proof-meter strong { font-size: 2rem; line-height: 1; }
	      .proof-meter p, .proof-meter small { margin: 0; color: rgba(255, 253, 247, .78); }
	      .audit { display: grid; grid-template-columns: minmax(220px, .34fr) minmax(0, 1fr); gap: 12px; }
	      .audit-head { min-width: 0; display: grid; align-content: start; gap: 8px; }
	      .audit-head strong { font-size: 1.34rem; line-height: 1.08; overflow-wrap: anywhere; }
	      .audit-head p { margin: 0; }
	      .audit-score { display: inline-flex; width: fit-content; min-height: 34px; align-items: center; border: 1px solid var(--line); border-radius: 999px; padding: 6px 10px; color: var(--teal); background: var(--green-bg); font-size: .82rem; font-weight: 950; }
	      .audit-list { display: grid; gap: 8px; }
	      .audit-row { min-width: 0; display: grid; grid-template-columns: minmax(150px, .28fr) minmax(180px, .28fr) minmax(0, .44fr); gap: 9px; align-items: start; border: 1px solid var(--line); border-left: 5px solid #f2b84b; border-radius: 8px; padding: 11px; background: var(--panel); }
	      .audit-row.good { border-left-color: #0f766e; background: var(--green-bg); }
	      .audit-row.watch { border-left-color: #f2b84b; background: var(--amber-bg); }
	      .audit-row.bad { border-left-color: #b56576; background: var(--rose-bg); }
	      .audit-row > div:first-child { display: grid; gap: 4px; }
	      .audit-row dl { display: grid; gap: 6px; margin: 0; }
	      .audit-row dl div { display: grid; gap: 2px; }
	      .audit-row dt { color: var(--muted); font-size: .68rem; font-weight: 950; text-transform: uppercase; }
	      .audit-row dd { margin: 0; font-weight: 850; overflow-wrap: anywhere; }
	      .audit-row p, .audit-row small { margin: 0; color: var(--muted); overflow-wrap: anywhere; }
	      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      ul { margin: 0; padding-left: 20px; color: var(--muted); }
      li + li { margin-top: 8px; }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
	      @media (max-width: 900px) { .audit, .audit-row { grid-template-columns: 1fr; } }
	      @media (max-width: 780px) { header, main, footer { width: min(100% - 24px, 620px); } .hero, .metrics, .grid, .cases, .acceptance-cases, .commitment, .proof-strip { grid-template-columns: 1fr; } .stamp { min-height: 132px; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Buyer Value Report</span>
          <h1>${escapeHtml(report.headline)}</h1>
          <p>${escapeHtml(report.hardTruth)}</p>
          <nav>${linkList}</nav>
        </div>
        <div class="stamp">
          <span>Decision</span>
          <strong>${escapeHtml(report.readiness)}</strong>
          <small>${escapeHtml(report.targetBuyer)}</small>
        </div>
      </div>
      <section class="metrics">${metrics}</section>
    </header>
	    <main>
	      <section class="proof-strip">
	        <aside class="proof-meter">
	          <span>Measured proof</span>
	          <strong>${escapeHtml(evidence.mode)}</strong>
	          <p>${escapeHtml(evidence.hardTruth)}</p>
	          <small>${escapeHtml(evidence.supportRatioPercent)}% model support / ${escapeHtml(evidence.measuredRun.acceptanceRatePercent)}% acceptance</small>
	        </aside>
	        <div class="panel">
	          <h2>Measured pilot checks</h2>
	          <div class="cases" style="grid-template-columns: 1fr;">${evidenceChecks}</div>
	        </div>
	      </section>
	      <section class="panel audit" aria-label="Assumption audit">
	        <div class="audit-head">
	          <h2>Assumption audit</h2>
	          <strong>${escapeHtml(report.assumptionAudit.headline)}</strong>
	          <p>${escapeHtml(report.assumptionAudit.hardTruth)}</p>
	          <span class="audit-score">${escapeHtml(report.assumptionAudit.clearCount)} / ${escapeHtml(report.assumptionAudit.totalCount)} clear</span>
	        </div>
	        <div class="audit-list">${assumptionRows}</div>
	      </section>
	      <section class="commitment">
	        <div class="panel">
	          <h2>Buyer commitment</h2>
	          <p>${escapeHtml(commitment.hardTruth)}</p>
	          <div class="cases" style="grid-template-columns: 1fr;">${commitmentConditions}</div>
	        </div>
	        <aside class="ask">
	          <span>${escapeHtml(commitment.askLabel)}</span>
	          <strong>${escapeHtml(yen(commitment.recommendedAskYen))}</strong>
	          <p>${escapeHtml(commitment.askInstruction)}</p>
	          <small>${escapeHtml(commitment.decision)} / ${escapeHtml(commitment.decisionOwner)}</small>
	        </aside>
	      </section>
	      <section class="panel">
	        <h2>Acceptance receipt</h2>
	        <p><strong>${escapeHtml(acceptance.headline)}</strong></p>
	        <p>${escapeHtml(acceptance.summary)}</p>
	        <nav>
	          <a href="${escapeHtml(acceptance.requestHref)}" download="${escapeHtml(acceptance.receiptId)}.json">Receipt JSON</a>
	          <a href="${escapeHtml(acceptance.verifierHref)}">Verify acceptance</a>
	          <a href="${escapeHtml(acceptance.exportHref)}" download="${escapeHtml(acceptance.receiptId)}.md">Acceptance memo</a>
	        </nav>
	        <div class="acceptance-cases">${acceptanceChecks}</div>
	      </section>
	      <section class="panel">
	        <h2>Value sensitivity</h2>
	        <div class="cases">${cases}</div>
	      </section>
	      <section class="grid">
	        <div class="panel">
	          <h2>Decision checks</h2>
	          <div class="cases" style="grid-template-columns: 1fr;">${checks}</div>
	        </div>
	        <aside class="panel">
          <h2>Base case</h2>
          <p><strong>${escapeHtml(yen(scenario.monthlyGrossValueYen))}</strong> monthly value from ${escapeHtml(scenario.monthlyHoursSaved)} saved hours and risk reduction.</p>
          <p>Budget ceiling: <strong>${escapeHtml(yen(scenario.pilotBudgetCeilingYen))}</strong></p>
          <p>Confidence band: <strong>${escapeHtml(report.sensitivity.confidenceBand)}</strong></p>
	          <h2>Selected agents</h2>
	          <ul>${agents}</ul>
	          <h2>Red lines</h2>
	          <div class="cases" style="grid-template-columns: 1fr;">${redLines}</div>
	        </aside>
	      </section>
    </main>
    <footer>Generated by A2A Agent Marketplace. Validate assumptions before using this as a procurement commitment.</footer>
  </body>
</html>`;
}
