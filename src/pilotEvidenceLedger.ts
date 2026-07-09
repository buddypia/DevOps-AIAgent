import type { BuyerDecisionMatrix } from "./buyerDecisionMatrix.js";
import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import type { PilotAgreement } from "./pilotAgreement.js";
import type { PilotExecutionHandoff } from "./pilotExecution.js";
import type { PilotProposal } from "./pilotProposal.js";
import type { PilotRunReceipt } from "./pilotRunReceipt.js";
import type { PilotWorkflowPlan } from "./pilotWorkflow.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";

export type PilotEvidenceLedgerReadiness = "sponsor-ready" | "needs-proof" | "blocked";

export type PilotEvidenceLedgerEvent = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  owner: string;
  artifact: string;
  score: number;
  evidence: string;
  nextAction: string;
};

export type PilotEvidenceLedgerException = {
  id: string;
  label: string;
  owner: string;
  severity: "watch" | "blocked";
  fix: string;
};

export type PilotEvidenceLedger = {
  id: string;
  readiness: PilotEvidenceLedgerReadiness;
  ledgerScore: number;
  headline: string;
  hardTruth: string;
  buyer: string;
  reviewMemo: string;
  events: PilotEvidenceLedgerEvent[];
  exceptions: PilotEvidenceLedgerException[];
  exportMarkdown: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
  if (["sponsor-ready", "clear"].includes(status)) return "good";
  if (["blocked"].includes(status)) return "bad";
  return "watch";
}

function statusScore(status: BuyerValueScenarioStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 66;
  return 18;
}

function eventStatus(readiness: string, clearValues: string[], watchValues: string[] = []): BuyerValueScenarioStatus {
  if (clearValues.includes(readiness)) return "clear";
  if (watchValues.includes(readiness)) return "watch";
  return "blocked";
}

function readinessFrom(events: PilotEvidenceLedgerEvent[]): PilotEvidenceLedgerReadiness {
  if (events.some((event) => event.status === "blocked")) return "blocked";
  if (events.every((event) => event.status === "clear")) return "sponsor-ready";
  return "needs-proof";
}

function headlineFor(readiness: PilotEvidenceLedgerReadiness) {
  if (readiness === "sponsor-ready") return "Evidence ledger is ready for sponsor review";
  if (readiness === "needs-proof") return "Evidence ledger needs proof before approval";
  return "Evidence ledger blocks sponsor approval";
}

function hardTruthFor(readiness: PilotEvidenceLedgerReadiness, exceptions: PilotEvidenceLedgerException[]) {
  if (readiness === "sponsor-ready") {
    return "The buyer can inspect the value case, workflow, measured run, procurement comparison, agreement, and execution handoff from one audit trail.";
  }
  if (readiness === "needs-proof") {
    return `The story is coherent, but ${exceptions.length} exception${exceptions.length === 1 ? "" : "s"} still need owner confirmation before approval.`;
  }
  return `Do not ask for approval yet. ${exceptions.length} evidence exception${exceptions.length === 1 ? "" : "s"} would make the pilot feel like a demo.`;
}

function buildEvents(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  proposal: PilotProposal;
  workflow: PilotWorkflowPlan;
  pilotReceipt: PilotRunReceipt;
  decisionMatrix: BuyerDecisionMatrix;
  agreement: PilotAgreement;
  execution: PilotExecutionHandoff;
}): PilotEvidenceLedgerEvent[] {
  return [
    {
      id: "buyer-case",
      label: "Buyer case shaped",
      status: eventStatus(input.proposal.readiness, ["buyer-ready"], ["pilot-ready"]),
      owner: input.proposal.targetBuyer,
      artifact: "Buyer proposal",
      score: input.proposal.proposalScore,
      evidence: `${input.buyerScenario.monthlyHoursSaved}h/month saved, ${input.buyerScenario.paybackDays}-day payback, ${input.proposal.proofs.filter((proof) => proof.status === "ready").length}/${input.proposal.proofs.length} proof items ready.`,
      nextAction: input.proposal.readiness === "draft" ? "Tighten economics and public proof before sharing." : "Use proposal as the buyer-facing opening narrative."
    },
    {
      id: "workflow",
      label: "Workflow packaged",
      status: eventStatus(input.workflow.readiness, ["ready-to-run"], ["needs-scope"]),
      owner: "Pilot facilitator",
      artifact: "Pilot workflow",
      score: input.workflow.workflowScore,
      evidence: `${input.workflow.workflowName}; ${input.workflow.minutesSavedPerRun} minutes saved per run; ${input.workflow.checkpoints.filter((checkpoint) => checkpoint.status === "clear").length}/${input.workflow.checkpoints.length} checkpoints clear.`,
      nextAction: input.workflow.readiness === "blocked" ? "Close blocked workflow checkpoints before running with a buyer." : "Run exactly this workflow for first proof."
    },
    {
      id: "measured-run",
      label: "First run measured",
      status: eventStatus(input.pilotReceipt.readiness, ["accepted"], ["needs-evidence"]),
      owner: input.pilotReceipt.reviewerName || "Pilot reviewer",
      artifact: "Pilot receipt",
      score: input.pilotReceipt.receiptScore,
      evidence: `${input.pilotReceipt.actualMinutesSavedPerRun} minutes saved per run, ${input.pilotReceipt.acceptanceRatePercent}% acceptance, evidence URL ${input.pilotReceipt.evidenceUrl ? "attached" : "missing"}.`,
      nextAction: input.pilotReceipt.readiness === "accepted" ? "Use receipt as measured proof." : "Attach public run evidence or rerun the pilot."
    },
    {
      id: "procurement",
      label: "Procurement compared",
      status: eventStatus(input.decisionMatrix.readiness, ["buy-a2a"], ["pilot-more"]),
      owner: "Procurement reviewer",
      artifact: "Decision matrix",
      score: input.decisionMatrix.confidenceScore,
      evidence: `${input.decisionMatrix.alternatives.find((alternative) => alternative.id === input.decisionMatrix.winnerId)?.label ?? input.decisionMatrix.winnerId} leads; A2A status ${input.decisionMatrix.alternatives.find((alternative) => alternative.id === "a2a-squad")?.status ?? "weak"}.`,
      nextAction: input.decisionMatrix.readiness === "buy-a2a" ? "Use matrix to defend the selected path." : "Resolve the matrix gap before asking for expansion budget."
    },
    {
      id: "agreement",
      label: "Agreement drafted",
      status: eventStatus(input.agreement.readiness, ["ready-to-sign"], ["needs-redlines"]),
      owner: "Buyer sponsor",
      artifact: "Pilot agreement",
      score: input.agreement.agreementScore,
      evidence: `${input.agreement.terms.filter((term) => term.status === "clear").length}/${input.agreement.terms.length} terms clear, ${input.agreement.signatures.length} signature roles named.`,
      nextAction: input.agreement.readiness === "ready-to-sign" ? "Send the agreement draft with the sponsor packet." : "Close agreement redlines before signature."
    },
    {
      id: "execution",
      label: "Execution handoff prepared",
      status: eventStatus(input.execution.readiness, ["ready-to-start"], ["needs-proof"]),
      owner: input.recommendation.selected[0]?.name ?? input.valueBlueprint.proofContract.owner,
      artifact: "Execution handoff",
      score: input.execution.executionScore,
      evidence: `${input.execution.workOrders.length} work orders, ${input.execution.gates.filter((gate) => gate.status === "ready").length}/${input.execution.gates.length} proof gates ready.`,
      nextAction: input.execution.readiness === "ready-to-start" ? "Assign work orders and start the pilot." : "Close blocked proof gates before kickoff."
    }
  ];
}

function buildExceptions(events: PilotEvidenceLedgerEvent[]): PilotEvidenceLedgerException[] {
  return events
    .filter((event) => event.status !== "clear")
    .map((event) => ({
      id: `exception-${event.id}`,
      label: event.label,
      owner: event.owner,
      severity: event.status === "blocked" ? ("blocked" as const) : ("watch" as const),
      fix: event.nextAction
    }));
}

function buildReviewMemo(input: {
  readiness: PilotEvidenceLedgerReadiness;
  events: PilotEvidenceLedgerEvent[];
  exceptions: PilotEvidenceLedgerException[];
  buyer: string;
}) {
  const measured = input.events.find((event) => event.id === "measured-run");
  const decision = input.events.find((event) => event.id === "procurement");
  const agreement = input.events.find((event) => event.id === "agreement");
  return [
    `${input.buyer} can review the pilot as an evidence trail instead of a collection of disconnected screens.`,
    `${measured?.evidence ?? "The first-run receipt is not recorded yet"}`,
    `${decision?.evidence ?? "The procurement comparison is not recorded yet"}`,
    `${agreement?.evidence ?? "The agreement draft is not recorded yet"}`,
    input.readiness === "sponsor-ready"
      ? "Sponsor review can focus on approval terms, not basic proof discovery."
      : `Resolve ${input.exceptions.length} open exception${input.exceptions.length === 1 ? "" : "s"} before making the approval ask.`
  ].join(" ");
}

function buildMarkdown(input: Omit<PilotEvidenceLedger, "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    "Pilot Evidence Ledger",
    "",
    `Readiness: ${input.readiness}`,
    `Ledger score: ${input.ledgerScore}/100`,
    `Buyer: ${input.buyer}`,
    "",
    input.hardTruth,
    "",
    "## Review memo",
    input.reviewMemo,
    "",
    "## Evidence events",
    ...input.events.map((event) => `- [${event.status}] ${event.label} (${event.owner}, ${event.artifact}, ${event.score}/100): ${event.evidence} Next: ${event.nextAction}`),
    "",
    "## Exceptions",
    ...(input.exceptions.length ? input.exceptions.map((exception) => `- [${exception.severity}] ${exception.label} (${exception.owner}): ${exception.fix}`) : ["- none"])
  ].join("\n");
}

export function buildPilotEvidenceLedger(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  proposal: PilotProposal;
  workflow: PilotWorkflowPlan;
  pilotReceipt: PilotRunReceipt;
  decisionMatrix: BuyerDecisionMatrix;
  agreement: PilotAgreement;
  execution: PilotExecutionHandoff;
}): PilotEvidenceLedger {
  const events = buildEvents(input);
  const exceptions = buildExceptions(events);
  const ledgerScore = Math.round(clamp(average([...events.map((event) => event.score), average(events.map((event) => statusScore(event.status)))])));
  const readiness = readinessFrom(events);
  const partial = {
    id: `pilot-evidence-ledger-${readiness}-${ledgerScore}`,
    readiness,
    ledgerScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, exceptions),
    buyer: input.valueBlueprint.primaryUser,
    reviewMemo: buildReviewMemo({ readiness, events, exceptions, buyer: input.valueBlueprint.primaryUser }),
    events,
    exceptions
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderPilotEvidenceLedgerHtml(
  ledger: PilotEvidenceLedger,
  links: {
    proposalUrl?: string;
    workflowUrl?: string;
    receiptUrl?: string;
    decisionUrl?: string;
    agreementUrl?: string;
    executionUrl?: string;
    jsonUrl?: string;
    markdownUrl?: string;
    appUrl?: string;
  } = {}
) {
  const metrics = [
    { label: "Readiness", value: ledger.readiness, status: ledger.readiness },
    { label: "Ledger Score", value: ledger.ledgerScore, status: ledger.readiness },
    { label: "Events", value: ledger.events.length, status: ledger.readiness },
    { label: "Exceptions", value: ledger.exceptions.length, status: ledger.exceptions.length === 0 ? "clear" : ledger.readiness }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const events = ledger.events
    .map(
      (event) => `
        <article class="event ${tone(event.status)}">
          <span>${escapeHtml(event.status)}</span>
          <strong>${escapeHtml(event.label)}</strong>
          <b>${escapeHtml(event.score)}/100</b>
          <p>${escapeHtml(event.evidence)}</p>
          <small>${escapeHtml(event.owner)} / ${escapeHtml(event.artifact)}</small>
          <em>${escapeHtml(event.nextAction)}</em>
        </article>`
    )
    .join("");
  const exceptions = ledger.exceptions.length
    ? ledger.exceptions
        .map(
          (exception) => `
            <article class="exception ${tone(exception.severity)}">
              <div><strong>${escapeHtml(exception.label)}</strong><span>${escapeHtml(exception.severity)}</span></div>
              <p>${escapeHtml(exception.fix)}</p>
              <small>${escapeHtml(exception.owner)}</small>
            </article>`
        )
        .join("")
    : `<article class="exception good"><div><strong>No open exceptions</strong><span>clear</span></div><p>All ledger events are clear enough for sponsor review.</p></article>`;
  const linkList = [
    links.proposalUrl ? `<a href="${escapeHtml(links.proposalUrl)}">Proposal</a>` : "",
    links.workflowUrl ? `<a href="${escapeHtml(links.workflowUrl)}">Workflow</a>` : "",
    links.receiptUrl ? `<a href="${escapeHtml(links.receiptUrl)}">Receipt</a>` : "",
    links.decisionUrl ? `<a href="${escapeHtml(links.decisionUrl)}">Decision matrix</a>` : "",
    links.agreementUrl ? `<a href="${escapeHtml(links.agreementUrl)}">Agreement</a>` : "",
    links.executionUrl ? `<a href="${escapeHtml(links.executionUrl)}">Execution</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON ledger</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown ledger</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(ledger.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #52645f; --line: #cbd7d2; --paper: #f3f7f5; --panel: #fffdf7; --teal: #0f766e; --blue: #2457a6; --green-bg: #edf8f1; --amber-bg: #fff7dd; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 22px; }
      .eyebrow, .metric span, .event span, .exception span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.2rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p, small, em { color: var(--muted); }
      em { font-style: normal; font-weight: 800; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: end; }
      .stamp { min-height: 190px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #102226, #2457a6); text-align: center; }
      .stamp span { color: #d8fff5; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { padding: 0 18px; font-size: 1.6rem; line-height: 1; overflow-wrap: anywhere; }
      .stamp small { color: rgba(255, 253, 247, .72); font-weight: 850; overflow-wrap: anywhere; }
      .metrics, .grid, .events, .exceptions { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 20px; }
      .grid { grid-template-columns: minmax(0, .9fr) minmax(320px, .5fr); align-items: start; }
      .events { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .panel, .event, .exception { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric, .panel, .event, .exception { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.25rem; line-height: 1.1; overflow-wrap: anywhere; }
      .event { display: grid; gap: 7px; border-left: 4px solid #add6bd; }
      .event b { width: fit-content; border-radius: 999px; padding: 4px 8px; color: #102226; background: #d8fff5; }
      .exception { display: grid; gap: 7px; }
      .exception div { display: flex; align-items: start; justify-content: space-between; gap: 10px; }
      .event strong, .event p, .event small, .event em, .exception strong, .exception p, .exception small { overflow-wrap: anywhere; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 780px) { header, main, footer { width: min(100% - 24px, 620px); } .hero, .metrics, .grid, .events { grid-template-columns: 1fr; } .stamp { min-height: 132px; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Pilot Evidence Ledger</span>
          <h1>${escapeHtml(ledger.headline)}</h1>
          <p>${escapeHtml(ledger.hardTruth)}</p>
          <nav>${linkList}</nav>
        </div>
        <div class="stamp">
          <span>Ledger score</span>
          <strong>${escapeHtml(ledger.ledgerScore)}/100</strong>
          <small>${escapeHtml(ledger.buyer)}</small>
        </div>
      </div>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <section class="panel">
        <h2>Review memo</h2>
        <p>${escapeHtml(ledger.reviewMemo)}</p>
      </section>
      <section class="grid">
        <article class="panel">
          <h2>Evidence events</h2>
          <div class="events">${events}</div>
        </article>
        <aside class="panel">
          <h2>Exceptions</h2>
          <div class="exceptions">${exceptions}</div>
        </aside>
      </section>
    </main>
    <footer>Generated by A2A Agent Marketplace as a review ledger, not as a legal approval record.</footer>
  </body>
</html>`;
}
