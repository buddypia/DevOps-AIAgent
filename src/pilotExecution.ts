import type { PilotProposal, PilotProofStatus } from "./pilotProposal.js";
import type { Recommendation } from "./types.js";

export type PilotExecutionReadiness = "ready-to-start" | "needs-proof" | "blocked";
export type PilotExecutionStatus = "ready" | "watch" | "blocked";

export type PilotExecutionWorkOrder = {
  id: string;
  owner: string;
  window: string;
  objective: string;
  acceptance: string;
  proofUrl: string;
  status: PilotExecutionStatus;
};

export type PilotExecutionGate = {
  id: string;
  label: string;
  status: PilotExecutionStatus;
  owner: string;
  evidence: string;
};

export type PilotExecutionDecision = {
  id: string;
  label: string;
  rule: string;
  proof: string;
};

export type PilotExecutionHandoff = {
  id: string;
  readiness: PilotExecutionReadiness;
  executionScore: number;
  headline: string;
  hardTruth: string;
  kickoffCommand: string;
  workOrders: PilotExecutionWorkOrder[];
  gates: PilotExecutionGate[];
  decisions: PilotExecutionDecision[];
  runbook: string[];
  exportMarkdown: string;
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeBaseUrl(value: string | undefined) {
  return (value || "").replace(/\/$/, "");
}

function url(baseUrl: string | undefined, path: string) {
  const base = normalizeBaseUrl(baseUrl);
  return base ? `${base}${path}` : path;
}

function gateStatus(status: PilotProofStatus): PilotExecutionStatus {
  if (status === "ready") return "ready";
  if (status === "watch") return "watch";
  return "blocked";
}

function statusScore(status: PilotExecutionStatus) {
  if (status === "ready") return 100;
  if (status === "watch") return 68;
  return 20;
}

function readinessFrom(input: { proposal: PilotProposal; gates: PilotExecutionGate[] }): PilotExecutionReadiness {
  if (input.proposal.readiness === "draft") return "blocked";
  if (input.gates.some((gate) => gate.status === "blocked")) return "needs-proof";
  return "ready-to-start";
}

function headlineFor(readiness: PilotExecutionReadiness) {
  if (readiness === "ready-to-start") return "Pilot execution is ready to hand off";
  if (readiness === "needs-proof") return "Pilot execution needs proof before kickoff";
  return "Pilot execution should stay blocked";
}

function hardTruthFor(readiness: PilotExecutionReadiness) {
  if (readiness === "ready-to-start") {
    return "The buyer can approve a bounded pilot because owners, proof gates, and stop conditions are explicit.";
  }
  if (readiness === "needs-proof") {
    return "Do not start the buyer pilot until missing public proof is closed or explicitly accepted as a watch item.";
  }
  return "The economics or buyer case is too weak to hand off. Fix the proposal before assigning execution work.";
}

function ownerForProof(id: string, recommendation: Recommendation) {
  if (id === "runtime") return recommendation.selected.find((agent) => agent.id === "cloud-run-sre")?.name ?? "Cloud Run SRE";
  if (id === "economics") return recommendation.selected.find((agent) => agent.id === "market-broker")?.name ?? "A2A Market Broker";
  if (id === "submission") return "Submission lead";
  if (id === "a2a-trial") return recommendation.selected.find((agent) => agent.id === "market-broker")?.name ?? "A2A Market Broker";
  return recommendation.selected.find((agent) => agent.id === "test-forge")?.name ?? "Test Forge";
}

function buildGates(input: { proposal: PilotProposal; recommendation: Recommendation }): PilotExecutionGate[] {
  return input.proposal.proofs.map((proof) => ({
    id: proof.id,
    label: proof.label,
    status: gateStatus(proof.status),
    owner: ownerForProof(proof.id, input.recommendation),
    evidence: proof.evidence
  }));
}

function workOrderStatus(index: number, readiness: PilotExecutionReadiness, gates: PilotExecutionGate[]): PilotExecutionStatus {
  if (readiness === "blocked") return "blocked";
  if (readiness === "needs-proof" && index > 0) return "watch";
  if (gates.some((gate) => gate.status === "blocked") && index === 0) return "watch";
  return "ready";
}

function buildWorkOrders(input: {
  proposal: PilotProposal;
  recommendation: Recommendation;
  readiness: PilotExecutionReadiness;
  gates: PilotExecutionGate[];
  baseUrl?: string;
}): PilotExecutionWorkOrder[] {
  const defaultOwner = input.recommendation.selected[0]?.name ?? "A2A Market Broker";
  return input.proposal.phases.map((phase, index) => {
    const commitment = input.proposal.commitments[index] ?? input.proposal.commitments[0];
    const owner = commitment?.owner ?? defaultOwner;
    return {
      id: `pilot-work-${phase.id}`,
      owner,
      window: phase.duration,
      objective: phase.buyerOutcome,
      acceptance: phase.proofGate,
      proofUrl: url(input.baseUrl, index === 0 ? "/buyer-proposal" : index === 1 ? "/api/buyer-proposal" : "/buyer-proposal.md"),
      status: workOrderStatus(index, input.readiness, input.gates)
    };
  });
}

function buildDecisions(proposal: PilotProposal): PilotExecutionDecision[] {
  return [
    {
      id: "continue",
      label: "Continue",
      rule: `Continue when all proof gates are ready and the pilot still fits: ${proposal.commercialGuardrail}`,
      proof: "Proof checklist and commercial guardrail"
    },
    {
      id: "revise",
      label: "Revise",
      rule: "Revise when exactly one proof gate is watch or the buyer accepts a narrowed workflow scope.",
      proof: "Scope, exclusions, and buyer objections"
    },
    {
      id: "stop",
      label: "Stop",
      rule: "Stop when buyer economics are draft, runtime proof is missing, or a private-data risk appears before security terms are accepted.",
      proof: "Buyer economics, runtime proof, and exclusions"
    }
  ];
}

function buildRunbook(input: { handoffId: string; readiness: PilotExecutionReadiness; baseUrl?: string }) {
  return [
    `Open ${url(input.baseUrl, "/buyer-proposal")} and confirm the buyer agrees to the pilot scope.`,
    `Open ${url(input.baseUrl, "/api/buyer-proposal")} and save the JSON receipt for the kickoff record.`,
    "Assign each pilot work order to its owner before the first buyer session.",
    "Run each proof gate before moving from Days 1-5 to Week 2.",
    input.readiness === "ready-to-start" ? "Use the Continue / Revise / Stop rule in the Week 2 review." : "Close blocked proof before starting the first buyer session.",
    `Archive execution receipt: ${input.handoffId}`
  ];
}

function buildMarkdown(input: Omit<PilotExecutionHandoff, "exportMarkdown" | "a2aPayload">) {
  return [
    `# ${input.headline}`,
    "",
    "Pilot Execution Handoff",
    "",
    `Readiness: ${input.readiness}`,
    `Execution score: ${input.executionScore}/100`,
    "",
    input.hardTruth,
    "",
    "## Kickoff command",
    input.kickoffCommand,
    "",
    "## Work orders",
    ...input.workOrders.map((order) => `- [${order.status}] ${order.window} ${order.owner}: ${order.objective} Acceptance: ${order.acceptance} Proof: ${order.proofUrl}`),
    "",
    "## Proof gates",
    ...input.gates.map((gate) => `- [${gate.status}] ${gate.owner}: ${gate.label} - ${gate.evidence}`),
    "",
    "## Decision rules",
    ...input.decisions.map((decision) => `- ${decision.label}: ${decision.rule} Proof: ${decision.proof}`),
    "",
    "## Runbook",
    ...input.runbook.map((step) => `- ${step}`)
  ].join("\n");
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
  if (["ready-to-start", "ready"].includes(status)) return "good";
  if (["blocked"].includes(status)) return "bad";
  return "watch";
}

export function buildPilotExecutionHandoff(input: {
  proposal: PilotProposal;
  recommendation: Recommendation;
  baseUrl?: string;
}): PilotExecutionHandoff {
  const gates = buildGates({ proposal: input.proposal, recommendation: input.recommendation });
  const readiness = readinessFrom({ proposal: input.proposal, gates });
  const workOrders = buildWorkOrders({
    proposal: input.proposal,
    recommendation: input.recommendation,
    readiness,
    gates,
    baseUrl: input.baseUrl
  });
  const decisions = buildDecisions(input.proposal);
  const executionScore = Math.round(
    clamp(
      average([
        input.proposal.proposalScore,
        average(gates.map((gate) => statusScore(gate.status))),
        average(workOrders.map((order) => statusScore(order.status))),
        input.proposal.commitments.length >= 3 ? 92 : 72
      ])
    )
  );
  const id = `pilot-execution-${executionScore}-${readiness}`;
  const partial = {
    id,
    readiness,
    executionScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness),
    kickoffCommand:
      readiness === "ready-to-start"
        ? `Start the pilot with ${workOrders.length} work orders and ${gates.length} proof gates.`
        : readiness === "needs-proof"
          ? "Close missing public proof, then start the pilot from the same work orders."
          : "Do not assign pilot work until the buyer proposal returns to pilot-ready or buyer-ready.",
    workOrders,
    gates,
    decisions,
    runbook: buildRunbook({ handoffId: id, readiness, baseUrl: input.baseUrl })
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial),
    a2aPayload: {
      method: "message/send",
      skill: "pilot.execute",
      id,
      readiness,
      executionScore,
      workOrders: workOrders.map((order) => ({
        id: order.id,
        owner: order.owner,
        status: order.status,
        proofUrl: order.proofUrl
      })),
      gates: gates.map((gate) => ({
        id: gate.id,
        owner: gate.owner,
        status: gate.status
      })),
      decisionRules: decisions.map((decision) => ({ id: decision.id, rule: decision.rule }))
    }
  };
}

export function renderPilotExecutionHtml(
  handoff: PilotExecutionHandoff,
  links: { jsonUrl?: string; proposalUrl?: string; markdownUrl?: string; diligenceUrl?: string } = {}
) {
  const metrics = [
    { label: "Readiness", value: handoff.readiness, status: handoff.readiness },
    { label: "Execution Score", value: handoff.executionScore, status: handoff.readiness },
    { label: "Work Orders", value: handoff.workOrders.length, status: handoff.readiness },
    { label: "Proof Gates", value: `${handoff.gates.filter((gate) => gate.status === "ready").length}/${handoff.gates.length}`, status: handoff.gates.every((gate) => gate.status === "ready") ? "ready" : "watch" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const workOrders = handoff.workOrders
    .map(
      (order) => `
        <article class="card ${tone(order.status)}">
          <div><strong>${escapeHtml(order.window)} / ${escapeHtml(order.owner)}</strong><span>${escapeHtml(order.status)}</span></div>
          <p>${escapeHtml(order.objective)}</p>
          <small>${escapeHtml(order.acceptance)}</small>
          <a href="${escapeHtml(order.proofUrl)}">${escapeHtml(order.proofUrl)}</a>
        </article>`
    )
    .join("");
  const gates = handoff.gates
    .map(
      (gate) => `
        <article class="card ${tone(gate.status)}">
          <div><strong>${escapeHtml(gate.label)}</strong><span>${escapeHtml(gate.status)}</span></div>
          <p>${escapeHtml(gate.evidence)}</p>
          <small>${escapeHtml(gate.owner)}</small>
        </article>`
    )
    .join("");
  const decisions = handoff.decisions
    .map((decision) => `<li><strong>${escapeHtml(decision.label)}</strong> ${escapeHtml(decision.rule)} <small>${escapeHtml(decision.proof)}</small></li>`)
    .join("");
  const runbook = handoff.runbook.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  const linkList = [
    links.proposalUrl ? `<a href="${escapeHtml(links.proposalUrl)}">Buyer proposal</a>` : "",
    links.diligenceUrl ? `<a href="${escapeHtml(links.diligenceUrl)}">Diligence room</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON handoff</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown handoff</a>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(handoff.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #53635d; --line: #cdd8d2; --paper: #f4f7f5; --panel: #fffdf7; --blue: #2457a6; --green: #287a55; --mint: #edf8f1; --amber-bg: #fff7dd; --rose-bg: #fff1f2; --teal: #0f766e; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 22px; }
      .eyebrow, .metric span, .card span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 940px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.4rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p { color: var(--muted); }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: end; }
      .score { min-height: 190px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #102226, #2457a6); }
      .score span { color: #ffe4a8; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .score strong { font-size: 5rem; line-height: .9; }
      .score small { color: rgba(255, 253, 247, .74); font-weight: 900; text-transform: uppercase; }
      .metrics, .grid { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 20px; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .panel, .card { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.25rem; line-height: 1.1; overflow-wrap: anywhere; }
      .panel { padding: 16px; }
      .card { display: grid; gap: 7px; padding: 13px; }
      .card div { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
      .card strong, .card p, .card small, li { overflow-wrap: anywhere; }
      .good { border-color: #add6bd; background: var(--mint); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      ol { margin: 0; padding-left: 20px; color: var(--muted); }
      section { margin-top: 12px; }
      .links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      .links a { display: inline-flex; min-height: 40px; align-items: center; border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; background: #d8fff5; text-decoration: none; font-weight: 900; }
      footer { padding: 22px 0 38px; color: var(--muted); }
      @media (max-width: 860px) {
        .hero, .metrics, .grid { grid-template-columns: 1fr; }
        .score { min-height: 140px; }
        .score strong { font-size: 4rem; }
        .card div { display: block; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <div class="eyebrow">Pilot Execution Handoff</div>
          <h1>${escapeHtml(handoff.headline)}</h1>
          <p>${escapeHtml(handoff.hardTruth)}</p>
          <p><strong>${escapeHtml(handoff.kickoffCommand)}</strong></p>
          <div class="links">${linkList}</div>
        </div>
        <aside class="score">
          <span>${escapeHtml(handoff.readiness)}</span>
          <strong>${escapeHtml(handoff.executionScore)}</strong>
          <small>execution score</small>
        </aside>
      </div>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <section>
        <h2>Work Orders</h2>
        <div class="grid">${workOrders}</div>
      </section>
      <section>
        <h2>Proof Gates</h2>
        <div class="grid">${gates}</div>
      </section>
      <section class="panel">
        <h2>Continue / Revise / Stop Rules</h2>
        <ol>${decisions}</ol>
      </section>
      <section class="panel">
        <h2>Runbook</h2>
        <ol>${runbook}</ol>
      </section>
    </main>
    <footer>${escapeHtml(handoff.id)} / use this as the accountable pilot kickoff receipt.</footer>
  </body>
</html>`;
}
