import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { MarketAgent, Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";

export type BuyerWorkOrderReadiness = "ready-to-run" | "needs-proof" | "needs-scope" | "blocked";
export type BuyerWorkOrderSensitivity = "public" | "internal" | "restricted";

export type BuyerWorkOrderInput = {
  request: string;
  targetUser: string;
  successMetric: string;
  currentBaseline: string;
  dataSensitivity: BuyerWorkOrderSensitivity;
  evidenceUrl: string;
};

export type BuyerWorkOrderAssignment = {
  id: string;
  role: "intake" | "execute" | "prove" | "decide";
  agentId: string;
  agentName: string;
  objective: string;
  acceptance: string;
  proof: string;
};

export type BuyerWorkOrderCheck = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  evidence: string;
  fix: string;
};

export type BuyerWorkOrderProofStep = {
  id: string;
  label: string;
  owner: string;
  status: BuyerValueScenarioStatus;
  evidence: string;
  href: string;
};

export type BuyerWorkOrderBrief = {
  id: string;
  readiness: BuyerWorkOrderReadiness;
  workOrderScore: number;
  headline: string;
  hardTruth: string;
  targetUser: string;
  request: string;
  successMetric: string;
  currentBaseline: string;
  pilotQuestion: string;
  stopRule: string;
  nextAction: string;
  assignments: BuyerWorkOrderAssignment[];
  checks: BuyerWorkOrderCheck[];
  proofPlan: BuyerWorkOrderProofStep[];
  a2aPayload: Record<string, unknown>;
  exportMarkdown: string;
};

export type BuildBuyerWorkOrderBriefInput = {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  workOrder: Partial<BuyerWorkOrderInput>;
};

export const DEFAULT_BUYER_WORK_ORDER_INPUT: BuyerWorkOrderInput = {
  request: "Turn one real release-readiness review into a buyer proof packet with owners, evidence, and a continue/revise/stop decision.",
  targetUser: "",
  successMetric: "Minutes saved per review and number of proof gaps closed before sponsor review",
  currentBaseline: "Manual review notes, scattered proof links, and unclear ownership before launch",
  dataSensitivity: "internal",
  evidenceUrl: ""
};

const MAX_TEXT = 4000;
const MAX_SHORT_TEXT = 240;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeSensitivity(value: unknown): BuyerWorkOrderSensitivity {
  return value === "public" || value === "restricted" || value === "internal" ? value : "internal";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 54);
}

function statusScore(status: BuyerValueScenarioStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 64;
  return 18;
}

function readinessFrom(checks: BuyerWorkOrderCheck[]): BuyerWorkOrderReadiness {
  const scope = checks.find((check) => check.id === "scope");
  const data = checks.find((check) => check.id === "data-boundary");
  const value = checks.find((check) => check.id === "buyer-value");
  const publicProof = checks.find((check) => check.id === "public-proof");

  if (data?.status === "blocked" || value?.status === "blocked") return "blocked";
  if (scope?.status === "blocked") return "needs-scope";
  if (publicProof?.status !== "clear" || checks.some((check) => check.status === "watch")) return "needs-proof";
  return "ready-to-run";
}

function headlineFor(readiness: BuyerWorkOrderReadiness) {
  if (readiness === "ready-to-run") return "This work order is ready for a buyer pilot";
  if (readiness === "needs-proof") return "The work order is useful, but proof needs closure";
  if (readiness === "needs-scope") return "The work order needs sharper scope";
  return "The work order should not be shared externally yet";
}

function hardTruthFor(readiness: BuyerWorkOrderReadiness, checks: BuyerWorkOrderCheck[]) {
  if (readiness === "ready-to-run") {
    return "A buyer can see the request, owners, acceptance checks, public evidence, and A2A delegation payload before committing to a pilot.";
  }
  const open = checks.filter((check) => check.status !== "clear");
  if (readiness === "needs-proof") return `${open.length} check${open.length === 1 ? "" : "s"} need proof or owner confirmation before this becomes buyer-ready.`;
  if (readiness === "needs-scope") return "The request is still too vague to delegate safely. Tighten the target user, metric, and baseline first.";
  return "Restricted data or weak economics would make this feel like a risky demo instead of a usable buyer workflow.";
}

export function normalizeBuyerWorkOrderInput(value: Partial<BuyerWorkOrderInput> | null | undefined, fallback = DEFAULT_BUYER_WORK_ORDER_INPUT): BuyerWorkOrderInput {
  const candidate = value ?? {};
  return {
    request: safeText(candidate.request, fallback.request).slice(0, MAX_TEXT) || fallback.request,
    targetUser: safeText(candidate.targetUser, fallback.targetUser).slice(0, MAX_SHORT_TEXT),
    successMetric: safeText(candidate.successMetric, fallback.successMetric).slice(0, MAX_SHORT_TEXT) || fallback.successMetric,
    currentBaseline: safeText(candidate.currentBaseline, fallback.currentBaseline).slice(0, MAX_SHORT_TEXT) || fallback.currentBaseline,
    dataSensitivity: normalizeSensitivity(candidate.dataSensitivity ?? fallback.dataSensitivity),
    evidenceUrl: safeText(candidate.evidenceUrl, fallback.evidenceUrl).slice(0, 1000)
  };
}

function pickAgent(input: { recommendation: Recommendation; preferredIds: string[]; fallbackIndex: number }) {
  const selected = input.recommendation.selected.length > 0 ? input.recommendation.selected : input.recommendation.ranked.map((fit) => fit.agent);
  return input.preferredIds.map((id) => selected.find((agent) => agent.id === id)).find((agent): agent is MarketAgent => Boolean(agent)) ?? selected[input.fallbackIndex % Math.max(1, selected.length)];
}

function buildAssignments(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  workOrder: BuyerWorkOrderInput;
  targetUser: string;
}): BuyerWorkOrderAssignment[] {
  const intake = pickAgent({ recommendation: input.recommendation, preferredIds: ["brief-cartographer", "market-broker", "ux-guildmaster"], fallbackIndex: 0 });
  const execute = pickAgent({ recommendation: input.recommendation, preferredIds: ["market-broker", "gemini-strategist", "ux-guildmaster"], fallbackIndex: 1 });
  const prove = pickAgent({ recommendation: input.recommendation, preferredIds: ["cloud-run-sre", "test-forge", "security-sentinel", "observability-oracle"], fallbackIndex: 2 });
  const decide = pickAgent({ recommendation: input.recommendation, preferredIds: ["gemini-strategist", "security-sentinel", "market-broker"], fallbackIndex: 3 });
  const firstProof = input.valueBlueprint.proofContract.mustProve[0] ?? "Public proof artifact is attached";
  const lastProof = input.valueBlueprint.proofContract.mustProve[input.valueBlueprint.proofContract.mustProve.length - 1] ?? "Sponsor decision is recorded";

  return [
    {
      id: "work-order-intake",
      role: "intake",
      agentId: intake?.id ?? "market-broker",
      agentName: intake?.name ?? "A2A Market Broker",
      objective: `Rewrite the request for ${input.targetUser} into one bounded pilot workflow.`,
      acceptance: `The request names a user, baseline, success metric, and stop condition: ${input.workOrder.successMetric}.`,
      proof: "Buyer Work Order Brief"
    },
    {
      id: "work-order-execute",
      role: "execute",
      agentId: execute?.id ?? "gemini-strategist",
      agentName: execute?.name ?? "Gemini Strategist",
      objective: `Delegate the work order through A2A and return an inspectable result for: ${input.workOrder.request.slice(0, 160)}.`,
      acceptance: firstProof,
      proof: "A2A message/send payload"
    },
    {
      id: "work-order-prove",
      role: "prove",
      agentId: prove?.id ?? "cloud-run-sre",
      agentName: prove?.name ?? "Cloud Run SRE",
      objective: "Attach public runtime, receipt, or evidence URL before this leaves the internal workspace.",
      acceptance: input.workOrder.evidenceUrl ? "Evidence URL is public and reachable." : "A public evidence URL is added before sponsor review.",
      proof: input.workOrder.evidenceUrl || "Launch Evidence Console"
    },
    {
      id: "work-order-decide",
      role: "decide",
      agentId: decide?.id ?? "market-broker",
      agentName: decide?.name ?? "A2A Market Broker",
      objective: "Decide continue, revise, or stop from the measured result and buyer proof gaps.",
      acceptance: lastProof,
      proof: "Sponsor Review Room"
    }
  ];
}

function buildChecks(input: {
  buyerScenario: BuyerValueScenario;
  workOrder: BuyerWorkOrderInput;
  targetUser: string;
  assignments: BuyerWorkOrderAssignment[];
}): BuyerWorkOrderCheck[] {
  const requestWords = input.workOrder.request.split(/\s+/).filter(Boolean).length;
  const scopeReady = requestWords >= 12 && input.targetUser.length >= 3 && input.workOrder.successMetric.length >= 12 && input.workOrder.currentBaseline.length >= 12;
  const publicEvidence = isBuyerFacingProofUrl(input.workOrder.evidenceUrl);
  const hasA2A = input.assignments.some((assignment) => assignment.agentId && assignment.proof.includes("A2A"));
  return [
    {
      id: "scope",
      label: "Specific work order",
      status: scopeReady ? "clear" : requestWords >= 8 ? "watch" : "blocked",
      evidence: `${requestWords} words, target user "${input.targetUser}", metric "${input.workOrder.successMetric}".`,
      fix: "Name the real user, current baseline, and measurable success condition."
    },
    {
      id: "buyer-value",
      label: "Buyer value",
      status: input.buyerScenario.readiness === "scales-now" ? "clear" : input.buyerScenario.readiness === "pilot-first" ? "watch" : "blocked",
      evidence: `${input.buyerScenario.scenarioScore}/100 scenario score, ${input.buyerScenario.paybackDays}-day payback, ${input.buyerScenario.monthlyHoursSaved}h/month saved.`,
      fix: "Tighten ROI assumptions or reduce pilot scope before external sharing."
    },
    {
      id: "data-boundary",
      label: "Data boundary",
      status: input.workOrder.dataSensitivity === "public" ? "clear" : input.workOrder.dataSensitivity === "internal" ? "watch" : "blocked",
      evidence:
        input.workOrder.dataSensitivity === "public"
          ? "The work order can be shown with public or synthetic data."
          : input.workOrder.dataSensitivity === "internal"
            ? "Internal data needs redaction before external review."
            : "Restricted data needs security approval before delegation.",
      fix: "Redact examples, use synthetic data, or route through security review."
    },
    {
      id: "public-proof",
      label: "Public proof",
      status: publicEvidence ? "clear" : "watch",
      evidence: publicEvidence ? input.workOrder.evidenceUrl : "No public work-order evidence URL is attached yet.",
      fix: "Attach a public receipt, issue, recording, run log, or artifact URL."
    },
    {
      id: "a2a-delegation",
      label: "A2A delegation",
      status: hasA2A ? "clear" : "watch",
      evidence: hasA2A ? "A message/send payload is generated with owner, task, and acceptance criteria." : "No A2A-capable assignment was generated.",
      fix: "Select an agent with A2A skills or import an Agent Card."
    }
  ];
}

function buildProofPlan(input: { checks: BuyerWorkOrderCheck[]; assignments: BuyerWorkOrderAssignment[] }): BuyerWorkOrderProofStep[] {
  const ownerFor = (id: string) => {
    if (id === "scope") return input.assignments[0]?.agentName ?? "Pilot facilitator";
    if (id === "public-proof") return input.assignments[2]?.agentName ?? "Cloud Run SRE";
    if (id === "data-boundary") return "Security reviewer";
    if (id === "a2a-delegation") return input.assignments[1]?.agentName ?? "A2A Market Broker";
    return input.assignments[3]?.agentName ?? "Sponsor owner";
  };
  const hrefFor = (id: string) => {
    if (id === "public-proof") return "#launch-evidence-console";
    if (id === "data-boundary") return "#buyer-diligence-room";
    if (id === "buyer-value") return "#buyer-value-simulator";
    if (id === "a2a-delegation") return "#marketplace-workbench";
    return "#buyer-work-order-studio";
  };

  return input.checks.map((check) => ({
    id: `proof-${check.id}`,
    label: check.label,
    owner: ownerFor(check.id),
    status: check.status,
    evidence: check.status === "clear" ? check.evidence : check.fix,
    href: hrefFor(check.id)
  }));
}

function nextActionFor(readiness: BuyerWorkOrderReadiness, proofPlan: BuyerWorkOrderProofStep[]) {
  if (readiness === "ready-to-run") return "Open the public work-order brief and use it as the kickoff artifact.";
  if (readiness === "needs-proof") {
    const publicProof = proofPlan.find((step) => step.id === "proof-public-proof" && step.status !== "clear");
    const dataBoundary = proofPlan.find((step) => step.id === "proof-data-boundary" && step.status !== "clear");
    if (publicProof) return publicProof.evidence;
    if (dataBoundary) return dataBoundary.evidence;
  }
  return proofPlan.find((step) => step.status === "blocked")?.evidence ?? proofPlan.find((step) => step.status === "watch")?.evidence ?? "Review open proof items.";
}

function buildMarkdown(input: Omit<BuyerWorkOrderBrief, "exportMarkdown" | "a2aPayload">) {
  return [
    `# ${input.headline}`,
    "",
    `Readiness: ${input.readiness}`,
    `Work order score: ${input.workOrderScore}/100`,
    `Target user: ${input.targetUser}`,
    "",
    input.hardTruth,
    "",
    "## Work order",
    input.request,
    "",
    `Success metric: ${input.successMetric}`,
    `Current baseline: ${input.currentBaseline}`,
    `Pilot question: ${input.pilotQuestion}`,
    `Stop rule: ${input.stopRule}`,
    "",
    "## Assignments",
    ...input.assignments.map((assignment) => `- ${assignment.role}: ${assignment.agentName} - ${assignment.objective} Acceptance: ${assignment.acceptance}`),
    "",
    "## Checks",
    ...input.checks.map((check) => `- [${check.status}] ${check.label}: ${check.evidence} Fix: ${check.fix}`),
    "",
    "## Proof plan",
    ...input.proofPlan.map((step) => `- [${step.status}] ${step.owner}: ${step.label} - ${step.evidence}`)
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
  if (["ready-to-run", "clear"].includes(status)) return "good";
  if (["blocked"].includes(status)) return "bad";
  return "watch";
}

export function buildBuyerWorkOrderBrief(input: BuildBuyerWorkOrderBriefInput): BuyerWorkOrderBrief {
  const normalized = normalizeBuyerWorkOrderInput(input.workOrder);
  const targetUser = normalized.targetUser || input.valueBlueprint.primaryUser;
  const assignments = buildAssignments({ recommendation: input.recommendation, valueBlueprint: input.valueBlueprint, workOrder: normalized, targetUser });
  const checks = buildChecks({ buyerScenario: input.buyerScenario, workOrder: normalized, targetUser, assignments });
  const proofPlan = buildProofPlan({ checks, assignments });
  const readiness = readinessFrom(checks);
  const workOrderScore = Math.round(
    clamp(
      average([
        input.buyerScenario.scenarioScore,
        input.valueBlueprint.boardScore,
        average(checks.map((check) => statusScore(check.status))),
        normalized.dataSensitivity === "restricted" ? 18 : normalized.dataSensitivity === "internal" ? 70 : 100
      ])
    )
  );
  const partial = {
    id: `buyer-work-order-${slugify(`${readiness}-${targetUser}-${normalized.request}`) || "default"}`,
    readiness,
    workOrderScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, checks),
    targetUser,
    request: normalized.request,
    successMetric: normalized.successMetric,
    currentBaseline: normalized.currentBaseline,
    pilotQuestion: `Can ${targetUser} use this A2A squad to improve "${normalized.successMetric}" from the current baseline?`,
    stopRule:
      readiness === "blocked"
        ? "Stop until data boundary and buyer economics are safe enough to share."
        : "Stop if the first run cannot attach public proof, measurable savings, or a named owner for every open gap.",
    nextAction: nextActionFor(readiness, proofPlan),
    assignments,
    checks,
    proofPlan
  };

  return {
    ...partial,
    a2aPayload: {
      jsonrpc: "2.0",
      method: "message/send",
      params: {
        skillId: "buyer-work-order.run",
        targetUser,
        request: normalized.request,
        successMetric: normalized.successMetric,
        dataSensitivity: normalized.dataSensitivity,
        assignments: assignments.map((assignment) => ({
          agentId: assignment.agentId,
          role: assignment.role,
          objective: assignment.objective,
          acceptance: assignment.acceptance
        })),
        proofPlan: proofPlan.map((step) => ({ id: step.id, owner: step.owner, status: step.status, href: step.href }))
      }
    },
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderBuyerWorkOrderBriefHtml(
  brief: BuyerWorkOrderBrief,
  links: { jsonUrl?: string; markdownUrl?: string; appUrl?: string } = {}
) {
  const metrics = [
    { label: "Readiness", value: brief.readiness, status: brief.readiness },
    { label: "Work order score", value: brief.workOrderScore, status: brief.readiness },
    { label: "Assignments", value: brief.assignments.length, status: brief.readiness },
    { label: "Clear checks", value: `${brief.checks.filter((check) => check.status === "clear").length}/${brief.checks.length}`, status: brief.readiness }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const assignments = brief.assignments
    .map(
      (assignment) => `
        <article class="card good">
          <div><strong>${escapeHtml(assignment.role)}: ${escapeHtml(assignment.agentName)}</strong><span>${escapeHtml(assignment.proof)}</span></div>
          <p>${escapeHtml(assignment.objective)}</p>
          <small>${escapeHtml(assignment.acceptance)}</small>
        </article>`
    )
    .join("");
  const checks = brief.checks
    .map(
      (check) => `
        <article class="card ${tone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.evidence)}</p>
          <small>${escapeHtml(check.fix)}</small>
        </article>`
    )
    .join("");
  const nav = [
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(brief.headline)}</title>
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
      .stamp span { color: #b7e0d8; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { font-size: 4.4rem; line-height: .9; }
      .stamp small { max-width: 240px; color: rgba(255, 253, 247, .76); font-weight: 900; }
      .metrics, .grid { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 20px; }
      .grid { grid-template-columns: minmax(0, .72fr) minmax(320px, .55fr); align-items: start; }
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
      pre { max-width: 100%; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; border-radius: 8px; padding: 12px; background: #102226; color: #fffdf7; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 780px) { header, main, footer { width: min(100% - 24px, 620px); } .hero, .metrics, .grid { grid-template-columns: 1fr; } .stamp { min-height: 132px; } .stamp strong { font-size: 3.2rem; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Buyer Work Order Brief</span>
          <h1>${escapeHtml(brief.headline)}</h1>
          <p>${escapeHtml(brief.hardTruth)}</p>
          <nav>${nav}</nav>
        </div>
        <div class="stamp">
          <span>Score</span>
          <strong>${escapeHtml(brief.workOrderScore)}</strong>
          <small>${escapeHtml(brief.readiness)}</small>
        </div>
      </div>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <section class="grid">
        <div class="panel">
          <h2>Work order</h2>
          <p><strong>${escapeHtml(brief.targetUser)}</strong></p>
          <p>${escapeHtml(brief.request)}</p>
          <p>Success metric: <strong>${escapeHtml(brief.successMetric)}</strong></p>
          <p>Baseline: ${escapeHtml(brief.currentBaseline)}</p>
          <p>${escapeHtml(brief.pilotQuestion)}</p>
        </div>
        <aside class="panel">
          <h2>Next action</h2>
          <p>${escapeHtml(brief.nextAction)}</p>
          <p>${escapeHtml(brief.stopRule)}</p>
        </aside>
      </section>
      <section class="grid">
        <div class="panel"><h2>Assignments</h2>${assignments}</div>
        <aside class="panel"><h2>Checks</h2>${checks}</aside>
      </section>
      <section class="panel">
        <h2>A2A payload</h2>
        <pre>${escapeHtml(JSON.stringify(brief.a2aPayload, null, 2))}</pre>
      </section>
    </main>
    <footer>Generated by A2A Agent Marketplace. Use this as a buyer pilot kickoff artifact, not a procurement commitment.</footer>
  </body>
</html>`;
}
