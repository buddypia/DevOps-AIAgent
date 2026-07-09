import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import type { PilotWorkflowPlan } from "./pilotWorkflow.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";

export type PilotRunReceiptReadiness = "accepted" | "needs-evidence" | "failed";

export type PilotRunReceiptInput = {
  observedManualMinutes: number;
  observedAssistedMinutes: number;
  participants: number;
  acceptedTasks: number;
  totalTasks: number;
  evidenceUrl: string;
  reviewerName: string;
  notes: string;
};

export type PilotRunReceiptCheck = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  evidence: string;
};

export type PilotRunReceipt = {
  id: string;
  readiness: PilotRunReceiptReadiness;
  receiptScore: number;
  headline: string;
  hardTruth: string;
  targetBuyer: string;
  workflowName: string;
  reviewerName: string;
  notes: string;
  evidenceUrl: string;
  participants: number;
  acceptedTasks: number;
  totalTasks: number;
  acceptanceRatePercent: number;
  observedManualMinutes: number;
  observedAssistedMinutes: number;
  actualMinutesSavedPerRun: number;
  plannedMinutesSavedPerRun: number;
  measuredMonthlyHoursSaved: number;
  measuredMonthlyValueYen: number;
  checks: PilotRunReceiptCheck[];
  exportMarkdown: string;
};

export const DEFAULT_PILOT_RUN_RECEIPT_INPUT: PilotRunReceiptInput = {
  observedManualMinutes: 90,
  observedAssistedMinutes: 55,
  participants: 2,
  acceptedTasks: 2,
  totalTasks: 3,
  evidenceUrl: "",
  reviewerName: "",
  notes: ""
};

const MAX_URL_LENGTH = 1000;
const MAX_TEXT_LENGTH = 500;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function roundYen(value: number) {
  return Math.round(value / 1000) * 1000;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function safeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tone(status: string) {
  if (["accepted", "clear"].includes(status)) return "good";
  if (["failed", "blocked"].includes(status)) return "bad";
  return "watch";
}

export function normalizePilotRunReceiptInput(
  value: Partial<PilotRunReceiptInput> | null | undefined,
  fallback: PilotRunReceiptInput = DEFAULT_PILOT_RUN_RECEIPT_INPUT
): PilotRunReceiptInput {
  const candidate = value ?? {};
  const totalTasks = Math.round(clamp(safeNumber(candidate.totalTasks, fallback.totalTasks), 1, 20));
  return {
    observedManualMinutes: Math.round(clamp(safeNumber(candidate.observedManualMinutes, fallback.observedManualMinutes), 1, 7200)),
    observedAssistedMinutes: Math.round(clamp(safeNumber(candidate.observedAssistedMinutes, fallback.observedAssistedMinutes), 1, 7200)),
    participants: Math.round(clamp(safeNumber(candidate.participants, fallback.participants), 1, 200)),
    acceptedTasks: Math.round(clamp(safeNumber(candidate.acceptedTasks, fallback.acceptedTasks), 0, totalTasks)),
    totalTasks,
    evidenceUrl: safeString(candidate.evidenceUrl, fallback.evidenceUrl).slice(0, MAX_URL_LENGTH),
    reviewerName: safeString(candidate.reviewerName, fallback.reviewerName).slice(0, 120),
    notes: safeString(candidate.notes, fallback.notes).slice(0, MAX_TEXT_LENGTH)
  };
}

function statusScore(status: BuyerValueScenarioStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 64;
  return 20;
}

function statusFromSavings(actualMinutesSaved: number, plannedMinutesSaved: number): BuyerValueScenarioStatus {
  if (actualMinutesSaved <= 0) return "blocked";
  if (plannedMinutesSaved <= 0) return "clear";
  const ratio = actualMinutesSaved / plannedMinutesSaved;
  if (ratio >= 0.7) return "clear";
  if (ratio >= 0.4) return "watch";
  return "blocked";
}

function statusFromAcceptance(rate: number): BuyerValueScenarioStatus {
  if (rate >= 70) return "clear";
  if (rate >= 50) return "watch";
  return "blocked";
}

function readinessFrom(checks: PilotRunReceiptCheck[]): PilotRunReceiptReadiness {
  if (checks.every((check) => check.status === "clear")) return "accepted";
  if (checks.some((check) => check.status === "clear" || check.status === "watch")) return "needs-evidence";
  return "failed";
}

function headlineFor(readiness: PilotRunReceiptReadiness) {
  if (readiness === "accepted") return "The first pilot run has measurable proof";
  if (readiness === "needs-evidence") return "The pilot run is useful, but proof is incomplete";
  return "The pilot run did not prove buyer value yet";
}

function hardTruthFor(input: { readiness: PilotRunReceiptReadiness; minutesSaved: number; acceptanceRate: number; evidenceUrl: string }) {
  if (input.readiness === "accepted") {
    return `${input.minutesSaved} minutes were saved in the observed run, ${input.acceptanceRate}% of tasks were accepted, and public evidence is attached.`;
  }
  if (input.readiness === "needs-evidence") {
    return `${input.minutesSaved} minutes were saved, but the receipt still needs stronger acceptance or a public evidence URL before sponsor approval.`;
  }
  return "The observed run needs a tighter workflow, stronger agent support, or a rerun before it can support the buyer case.";
}

function buildChecks(input: {
  normalized: PilotRunReceiptInput;
  actualMinutesSaved: number;
  plannedMinutesSaved: number;
  acceptanceRate: number;
}): PilotRunReceiptCheck[] {
  const evidenceReady = isBuyerFacingProofUrl(input.normalized.evidenceUrl);
  return [
    {
      id: "measured-savings",
      label: "Measured savings",
      status: statusFromSavings(input.actualMinutesSaved, input.plannedMinutesSaved),
      evidence: `${input.actualMinutesSaved} minutes saved against ${input.plannedMinutesSaved} planned minutes per run.`
    },
    {
      id: "task-acceptance",
      label: "Task acceptance",
      status: statusFromAcceptance(input.acceptanceRate),
      evidence: `${input.normalized.acceptedTasks}/${input.normalized.totalTasks} pilot tasks accepted by the reviewer.`
    },
    {
      id: "public-evidence",
      label: "Public evidence",
      status: evidenceReady ? "clear" : "blocked",
      evidence: evidenceReady ? input.normalized.evidenceUrl : "Attach a public run log, recording, issue, or receipt URL."
    },
    {
      id: "participant-scope",
      label: "Participant scope",
      status: input.normalized.participants >= 3 ? "clear" : input.normalized.participants >= 2 ? "watch" : "blocked",
      evidence: `${input.normalized.participants} people joined the observed pilot run.`
    }
  ];
}

function buildMarkdown(input: Omit<PilotRunReceipt, "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    `Readiness: ${input.readiness}`,
    `Receipt score: ${input.receiptScore}/100`,
    `Target buyer: ${input.targetBuyer}`,
    `Workflow: ${input.workflowName}`,
    `Reviewer: ${input.reviewerName || "Not named"}`,
    "",
    input.hardTruth,
    "",
    "## Measured result",
    `- Manual baseline: ${input.observedManualMinutes} minutes`,
    `- Assisted run: ${input.observedAssistedMinutes} minutes`,
    `- Saved per run: ${input.actualMinutesSavedPerRun} minutes`,
    `- Measured monthly hours: ${input.measuredMonthlyHoursSaved}h`,
    `- Measured monthly value: ${yen(input.measuredMonthlyValueYen)}`,
    `- Accepted tasks: ${input.acceptedTasks}/${input.totalTasks} (${input.acceptanceRatePercent}%)`,
    "",
    "## Evidence",
    `- URL: ${input.evidenceUrl || "missing"}`,
    `- Notes: ${input.notes || "none"}`,
    "",
    "## Checks",
    ...input.checks.map((check) => `- [${check.status}] ${check.label}: ${check.evidence}`)
  ].join("\n");
}

export function buildPilotRunReceipt(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  workflow: PilotWorkflowPlan;
  pilotRun: Partial<PilotRunReceiptInput>;
}): PilotRunReceipt {
  const normalized = normalizePilotRunReceiptInput(input.pilotRun);
  const actualMinutesSavedPerRun = Math.max(0, normalized.observedManualMinutes - normalized.observedAssistedMinutes);
  const acceptanceRatePercent = Math.round((normalized.acceptedTasks / Math.max(1, normalized.totalTasks)) * 100);
  const measuredMonthlyHoursSaved = round1(
    (actualMinutesSavedPerRun / 60) * input.buyerScenario.assumptions.cyclesPerMonth * (input.buyerScenario.assumptions.adoptionRatePercent / 100)
  );
  const measuredLaborValueYen = roundYen(measuredMonthlyHoursSaved * input.buyerScenario.assumptions.hourlyCostYen);
  const measuredRiskValueYen = roundYen(input.buyerScenario.monthlyRiskValueYen * (acceptanceRatePercent / 100) * 0.5);
  const measuredMonthlyValueYen = measuredLaborValueYen + measuredRiskValueYen;
  const checks = buildChecks({
    normalized,
    actualMinutesSaved: actualMinutesSavedPerRun,
    plannedMinutesSaved: input.workflow.minutesSavedPerRun,
    acceptanceRate: acceptanceRatePercent
  });
  const readiness = readinessFrom(checks);
  const receiptScore = Math.round(average([...checks.map((check) => statusScore(check.status)), input.buyerScenario.confidenceScore, input.workflow.workflowScore]));
  const partial = {
    id: `pilot-run-receipt-${readiness}-${receiptScore}`,
    readiness,
    receiptScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor({
      readiness,
      minutesSaved: actualMinutesSavedPerRun,
      acceptanceRate: acceptanceRatePercent,
      evidenceUrl: normalized.evidenceUrl
    }),
    targetBuyer: input.valueBlueprint.primaryUser,
    workflowName: input.workflow.workflowName,
    reviewerName: normalized.reviewerName,
    notes: normalized.notes,
    evidenceUrl: normalized.evidenceUrl,
    participants: normalized.participants,
    acceptedTasks: normalized.acceptedTasks,
    totalTasks: normalized.totalTasks,
    acceptanceRatePercent,
    observedManualMinutes: normalized.observedManualMinutes,
    observedAssistedMinutes: normalized.observedAssistedMinutes,
    actualMinutesSavedPerRun,
    plannedMinutesSavedPerRun: input.workflow.minutesSavedPerRun,
    measuredMonthlyHoursSaved,
    measuredMonthlyValueYen,
    checks
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderPilotRunReceiptHtml(
  receipt: PilotRunReceipt,
  links: { valueReportUrl?: string; workflowUrl?: string; executionUrl?: string; jsonUrl?: string; markdownUrl?: string; appUrl?: string } = {}
) {
  const metrics = [
    { label: "Readiness", value: receipt.readiness, status: receipt.readiness },
    { label: "Receipt score", value: receipt.receiptScore, status: receipt.readiness },
    { label: "Saved per run", value: `${receipt.actualMinutesSavedPerRun}m`, status: receipt.checks[0]?.status ?? "blocked" },
    { label: "Measured value", value: yen(receipt.measuredMonthlyValueYen), status: receipt.measuredMonthlyValueYen > 0 ? "clear" : "blocked" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const checks = receipt.checks
    .map(
      (check) => `
        <article class="card ${tone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.evidence)}</p>
        </article>`
    )
    .join("");
  const linkList = [
    links.valueReportUrl ? `<a href="${escapeHtml(links.valueReportUrl)}">Value report</a>` : "",
    links.workflowUrl ? `<a href="${escapeHtml(links.workflowUrl)}">Pilot workflow</a>` : "",
    links.executionUrl ? `<a href="${escapeHtml(links.executionUrl)}">Execution handoff</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON receipt</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown receipt</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(receipt.headline)}</title>
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
      .stamp { min-height: 190px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #102226, #2457a6); text-align: center; }
      .stamp span { color: #ffe4a8; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { font-size: 4.4rem; line-height: .9; }
      .stamp small { max-width: 240px; color: rgba(255, 253, 247, .76); font-weight: 900; }
      .metrics, .grid { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 20px; }
      .grid { grid-template-columns: minmax(0, .78fr) minmax(320px, .5fr); align-items: start; }
      .metric, .panel, .card { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.25rem; line-height: 1.1; overflow-wrap: anywhere; }
      .panel { padding: 16px; }
      .card { display: grid; gap: 7px; padding: 13px; }
      .card + .card { margin-top: 10px; }
      .card div { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
      .card strong, .card p, .card small { overflow-wrap: anywhere; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 780px) { header, main, footer { width: min(100% - 24px, 620px); } .hero, .metrics, .grid { grid-template-columns: 1fr; } .stamp { min-height: 132px; } .stamp strong { font-size: 3.2rem; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">First Pilot Receipt</span>
          <h1>${escapeHtml(receipt.headline)}</h1>
          <p>${escapeHtml(receipt.hardTruth)}</p>
          <nav>${linkList}</nav>
        </div>
        <div class="stamp">
          <span>Score</span>
          <strong>${escapeHtml(receipt.receiptScore)}</strong>
          <small>${escapeHtml(receipt.readiness)}</small>
        </div>
      </div>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <section class="grid">
        <div class="panel">
          <h2>Receipt checks</h2>
          ${checks}
        </div>
        <aside class="panel">
          <h2>Measured result</h2>
          <p><strong>${escapeHtml(receipt.actualMinutesSavedPerRun)} minutes</strong> saved per observed run.</p>
          <p><strong>${escapeHtml(receipt.measuredMonthlyHoursSaved)}h</strong> measured monthly hours and <strong>${escapeHtml(yen(receipt.measuredMonthlyValueYen))}</strong> measured monthly value.</p>
          <p>Accepted tasks: <strong>${escapeHtml(receipt.acceptedTasks)}/${escapeHtml(receipt.totalTasks)} (${escapeHtml(receipt.acceptanceRatePercent)}%)</strong></p>
          <p>Evidence: <a href="${escapeHtml(receipt.evidenceUrl || "#")}">${escapeHtml(receipt.evidenceUrl || "missing")}</a></p>
          <p>Reviewer: <strong>${escapeHtml(receipt.reviewerName || "Not named")}</strong></p>
          <p>${escapeHtml(receipt.notes || "No notes recorded.")}</p>
        </aside>
      </section>
    </main>
    <footer>Generated by A2A Agent Marketplace. Treat this as pilot evidence, not a production procurement commitment.</footer>
  </body>
</html>`;
}
