import type { BuyerDecisionMatrix } from "./buyerDecisionMatrix.js";
import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import type { PilotProposal } from "./pilotProposal.js";
import type { PilotRunReceipt } from "./pilotRunReceipt.js";
import type { PilotWorkflowPlan } from "./pilotWorkflow.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";

export type PilotAgreementReadiness = "ready-to-sign" | "needs-redlines" | "blocked";

export type PilotAgreementTerm = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  owner: string;
  text: string;
  acceptance: string;
};

export type PilotAgreementSignature = {
  role: string;
  name: string;
  condition: string;
};

export type PilotAgreement = {
  id: string;
  readiness: PilotAgreementReadiness;
  agreementScore: number;
  headline: string;
  hardTruth: string;
  buyer: string;
  scopeTitle: string;
  effectiveWindow: string;
  budgetCapYen: number;
  decisionSource: string;
  terms: PilotAgreementTerm[];
  stopRules: string[];
  signatures: PilotAgreementSignature[];
  exportMarkdown: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
  if (["ready-to-sign", "clear"].includes(status)) return "good";
  if (["blocked"].includes(status)) return "bad";
  return "watch";
}

function statusScore(status: BuyerValueScenarioStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 66;
  return 18;
}

function statusFrom(condition: boolean, watchCondition = false): BuyerValueScenarioStatus {
  if (condition) return "clear";
  if (watchCondition) return "watch";
  return "blocked";
}

function readinessFrom(input: {
  agreementScore: number;
  decisionMatrix: BuyerDecisionMatrix;
  pilotReceipt: PilotRunReceipt;
  workflow: PilotWorkflowPlan;
  terms: PilotAgreementTerm[];
}): PilotAgreementReadiness {
  if (input.terms.some((term) => term.status === "blocked") || input.decisionMatrix.readiness === "do-not-buy" || input.pilotReceipt.readiness === "failed") {
    return "blocked";
  }
  if (input.agreementScore >= 82 && input.decisionMatrix.readiness === "buy-a2a" && input.pilotReceipt.readiness === "accepted" && input.workflow.readiness === "ready-to-run") {
    return "ready-to-sign";
  }
  return "needs-redlines";
}

function headlineFor(readiness: PilotAgreementReadiness) {
  if (readiness === "ready-to-sign") return "Pilot agreement is ready for sponsor signature";
  if (readiness === "needs-redlines") return "Pilot agreement needs redlines before signature";
  return "Do not sign the pilot agreement yet";
}

function hardTruthFor(readiness: PilotAgreementReadiness, terms: PilotAgreementTerm[]) {
  const openTerms = terms.filter((term) => term.status !== "clear");
  if (readiness === "ready-to-sign") {
    return "Scope, proof gates, commercial guardrails, and stop rules are explicit enough for a bounded pilot approval.";
  }
  if (readiness === "needs-redlines") {
    return `The agreement is useful, but ${openTerms.length} term${openTerms.length === 1 ? "" : "s"} still need buyer confirmation before signature.`;
  }
  return `Signing would create false confidence. Fix ${openTerms.map((term) => term.label).join(", ") || "the blocked evidence"} before approval.`;
}

function buildTerms(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  proposal: PilotProposal;
  workflow: PilotWorkflowPlan;
  decisionMatrix: BuyerDecisionMatrix;
  pilotReceipt: PilotRunReceipt;
}): PilotAgreementTerm[] {
  const securityOwner = input.recommendation.selected.find((agent) => agent.id === "security-sentinel")?.name ?? "Security owner";
  const hasSecurityOwner = input.recommendation.selected.some((agent) => ["security-sentinel", "cloud-run-sre"].includes(agent.id));
  const a2a = input.decisionMatrix.alternatives.find((alternative) => alternative.id === "a2a-squad");
  return [
    {
      id: "commercial-cap",
      label: "Commercial cap",
      status: statusFrom(input.buyerScenario.paybackDays <= 45, input.buyerScenario.paybackDays <= 90),
      owner: "Buyer sponsor",
      text: `Pilot spend is capped at ${yen(input.buyerScenario.pilotBudgetCeilingYen)} until the review committee accepts the measured outcome.`,
      acceptance: `${input.buyerScenario.paybackDays}-day modeled payback remains defensible against the buyer-value report.`
    },
    {
      id: "scope-boundary",
      label: "Scope boundary",
      status: statusFrom(input.workflow.readiness === "ready-to-run", input.workflow.readiness === "needs-scope"),
      owner: "Pilot facilitator",
      text: `Run only "${input.workflow.workflowName}" for ${input.buyerScenario.assumptions.teamSize} pilot users during ${input.workflow.timebox}.`,
      acceptance: `${input.workflow.checkpoints.filter((checkpoint) => checkpoint.status === "clear").length}/${input.workflow.checkpoints.length} workflow checkpoints are clear.`
    },
    {
      id: "proof-gate",
      label: "Proof gate",
      status: statusFrom(input.pilotReceipt.readiness === "accepted", input.pilotReceipt.readiness === "needs-evidence"),
      owner: input.pilotReceipt.reviewerName || "Pilot reviewer",
      text: `Continue only when the first run records minutes saved, accepted tasks, reviewer notes, and a shareable proof URL.`,
      acceptance: `${input.pilotReceipt.actualMinutesSavedPerRun} minutes saved per run and ${input.pilotReceipt.acceptanceRatePercent}% task acceptance.`
    },
    {
      id: "procurement-choice",
      label: "Procurement choice",
      status: statusFrom(input.decisionMatrix.readiness === "buy-a2a", input.decisionMatrix.readiness === "pilot-more"),
      owner: "Procurement reviewer",
      text: `The sponsor reviews the A2A squad against manual work, generic AI, and an internal build before funding expansion.`,
      acceptance: `${input.decisionMatrix.confidenceScore}/100 decision confidence; A2A score ${a2a?.score ?? 0}/100.`
    },
    {
      id: "data-security",
      label: "Data and security",
      status: statusFrom(hasSecurityOwner, input.recommendation.after.governance >= 65),
      owner: securityOwner,
      text: "No private customer data, production credential, or privileged integration is used until security review signs the pilot data boundary.",
      acceptance: `${input.recommendation.after.governance}/100 governance score; security owner confirms data retention and access limits before the first buyer session.`
    },
    {
      id: "delivery-owners",
      label: "Delivery owners",
      status: statusFrom(input.proposal.commitments.length >= 4, input.proposal.commitments.length >= 3),
      owner: input.valueBlueprint.proofContract.owner,
      text: `Each agent commitment has one owner, one acceptance signal, and one evidence artifact before sponsor review.`,
      acceptance: `${input.proposal.commitments.length} delivery commitments are included in the proposal.`
    }
  ];
}

function buildStopRules(input: { buyerScenario: BuyerValueScenario; workflow: PilotWorkflowPlan; pilotReceipt: PilotRunReceipt; decisionMatrix: BuyerDecisionMatrix }) {
  return [
    `Stop if measured monthly value falls below ${yen(Math.round(input.buyerScenario.monthlyGrossValueYen * 0.45))}.`,
    `Stop if A2A is not at least viable in the decision matrix; current readiness is ${input.decisionMatrix.readiness}.`,
    `Stop if the first run saves 0 minutes or acceptance drops below 50%; current acceptance is ${input.pilotReceipt.acceptanceRatePercent}%.`,
    `Stop if a blocked workflow checkpoint remains open before kickoff: ${input.workflow.checkpoints.find((checkpoint) => checkpoint.status === "blocked")?.label ?? "none"}.`
  ];
}

function buildSignatures(input: { recommendation: Recommendation; proposal: PilotProposal; pilotReceipt: PilotRunReceipt }): PilotAgreementSignature[] {
  return [
    {
      role: "Buyer sponsor",
      name: input.pilotReceipt.reviewerName || input.proposal.targetBuyer,
      condition: "Approves scope, budget cap, proof gate, and stop rules."
    },
    {
      role: "Pilot owner",
      name: input.recommendation.selected[0]?.name ?? "A2A Market Broker",
      condition: "Accepts delivery ownership for the first workflow and evidence pack."
    },
    {
      role: "Security reviewer",
      name: input.recommendation.selected.find((agent) => agent.id === "security-sentinel")?.name ?? "Named security reviewer",
      condition: "Confirms the no-private-data boundary before any buyer session."
    }
  ];
}

function buildMarkdown(input: Omit<PilotAgreement, "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    "Pilot Agreement Draft",
    "",
    `Readiness: ${input.readiness}`,
    `Agreement score: ${input.agreementScore}/100`,
    `Buyer: ${input.buyer}`,
    `Scope: ${input.scopeTitle}`,
    `Effective window: ${input.effectiveWindow}`,
    `Budget cap: ${yen(input.budgetCapYen)}`,
    `Decision source: ${input.decisionSource}`,
    "",
    input.hardTruth,
    "",
    "## Terms",
    ...input.terms.map((term) => `- [${term.status}] ${term.label} (${term.owner}): ${term.text} Acceptance: ${term.acceptance}`),
    "",
    "## Stop rules",
    ...input.stopRules.map((rule) => `- ${rule}`),
    "",
    "## Signatures",
    ...input.signatures.map((signature) => `- ${signature.role}: ${signature.name}. ${signature.condition}`),
    "",
    "Generated as a non-binding pilot SOW draft for review."
  ].join("\n");
}

export function buildPilotAgreement(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  proposal: PilotProposal;
  workflow: PilotWorkflowPlan;
  decisionMatrix: BuyerDecisionMatrix;
  pilotReceipt: PilotRunReceipt;
}): PilotAgreement {
  const terms = buildTerms(input);
  const agreementScore = Math.round(
    clamp(
      average([
        input.decisionMatrix.confidenceScore,
        input.pilotReceipt.receiptScore,
        input.workflow.workflowScore,
        input.valueBlueprint.boardScore,
        average(terms.map((term) => statusScore(term.status)))
      ])
    )
  );
  const readiness = readinessFrom({
    agreementScore,
    decisionMatrix: input.decisionMatrix,
    pilotReceipt: input.pilotReceipt,
    workflow: input.workflow,
    terms
  });
  const partial = {
    id: `pilot-agreement-${readiness}-${agreementScore}`,
    readiness,
    agreementScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, terms),
    buyer: input.valueBlueprint.primaryUser,
    scopeTitle: input.workflow.workflowName,
    effectiveWindow: input.workflow.readiness === "ready-to-run" ? "Day 0 through Week 2 sponsor review" : "Starts only after open redlines are closed",
    budgetCapYen: input.buyerScenario.pilotBudgetCeilingYen,
    decisionSource: input.decisionMatrix.headline,
    terms,
    stopRules: buildStopRules({
      buyerScenario: input.buyerScenario,
      workflow: input.workflow,
      pilotReceipt: input.pilotReceipt,
      decisionMatrix: input.decisionMatrix
    }),
    signatures: buildSignatures({
      recommendation: input.recommendation,
      proposal: input.proposal,
      pilotReceipt: input.pilotReceipt
    })
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderPilotAgreementHtml(
  agreement: PilotAgreement,
  links: { proposalUrl?: string; decisionUrl?: string; receiptUrl?: string; diligenceUrl?: string; jsonUrl?: string; markdownUrl?: string; appUrl?: string } = {}
) {
  const metrics = [
    { label: "Readiness", value: agreement.readiness, status: agreement.readiness },
    { label: "Agreement Score", value: agreement.agreementScore, status: agreement.readiness },
    { label: "Budget Cap", value: yen(agreement.budgetCapYen), status: agreement.terms.find((term) => term.id === "commercial-cap")?.status ?? "blocked" },
    { label: "Open Terms", value: agreement.terms.filter((term) => term.status !== "clear").length, status: agreement.readiness }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const terms = agreement.terms
    .map(
      (term) => `
        <article class="card ${tone(term.status)}">
          <div><strong>${escapeHtml(term.label)}</strong><span>${escapeHtml(term.status)}</span></div>
          <p>${escapeHtml(term.text)}</p>
          <small>${escapeHtml(term.owner)} / ${escapeHtml(term.acceptance)}</small>
        </article>`
    )
    .join("");
  const stopRules = agreement.stopRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("");
  const signatures = agreement.signatures
    .map(
      (signature) => `
        <article class="signature">
          <span>${escapeHtml(signature.role)}</span>
          <strong>${escapeHtml(signature.name)}</strong>
          <p>${escapeHtml(signature.condition)}</p>
        </article>`
    )
    .join("");
  const linkList = [
    links.proposalUrl ? `<a href="${escapeHtml(links.proposalUrl)}">Proposal</a>` : "",
    links.decisionUrl ? `<a href="${escapeHtml(links.decisionUrl)}">Decision matrix</a>` : "",
    links.receiptUrl ? `<a href="${escapeHtml(links.receiptUrl)}">Pilot receipt</a>` : "",
    links.diligenceUrl ? `<a href="${escapeHtml(links.diligenceUrl)}">Diligence room</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON agreement</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown agreement</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(agreement.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #52645f; --line: #cbd7d2; --paper: #f3f7f5; --panel: #fffdf7; --teal: #0f766e; --blue: #2457a6; --green-bg: #edf8f1; --amber-bg: #fff7dd; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 22px; }
      .eyebrow, .metric span, .card span, .signature span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.2rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p, li { color: var(--muted); }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: end; }
      .stamp { min-height: 190px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #102226, #0f766e); text-align: center; }
      .stamp span { color: #d8fff5; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { padding: 0 18px; font-size: 1.6rem; line-height: 1; overflow-wrap: anywhere; }
      .metrics, .grid, .cards, .signatures { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 20px; }
      .grid { grid-template-columns: minmax(0, .95fr) minmax(320px, .55fr); align-items: start; }
      .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .signatures { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .metric, .panel, .card, .signature { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.25rem; line-height: 1.1; overflow-wrap: anywhere; }
      .panel { padding: 16px; }
      .card, .signature { display: grid; gap: 7px; padding: 13px; }
      .card div { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
      .card strong, .card p, .card small, .signature strong, .signature p { overflow-wrap: anywhere; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 780px) { header, main, footer { width: min(100% - 24px, 620px); } .hero, .metrics, .grid, .cards, .signatures { grid-template-columns: 1fr; } .stamp { min-height: 132px; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Pilot Agreement Draft</span>
          <h1>${escapeHtml(agreement.headline)}</h1>
          <p>${escapeHtml(agreement.hardTruth)}</p>
          <nav>${linkList}</nav>
        </div>
        <div class="stamp">
          <span>Budget cap</span>
          <strong>${escapeHtml(yen(agreement.budgetCapYen))}</strong>
          <small>${escapeHtml(agreement.buyer)}</small>
        </div>
      </div>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <section class="panel">
        <h2>Terms</h2>
        <div class="cards">${terms}</div>
      </section>
      <section class="grid">
        <article class="panel">
          <h2>Stop rules</h2>
          <ul>${stopRules}</ul>
        </article>
        <article class="panel">
          <h2>Signature conditions</h2>
          <div class="signatures">${signatures}</div>
        </article>
      </section>
    </main>
    <footer>Generated by A2A Agent Marketplace as a non-binding pilot SOW draft for review.</footer>
  </body>
</html>`;
}
