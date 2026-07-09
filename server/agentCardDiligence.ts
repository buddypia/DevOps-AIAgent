import { createHash } from "node:crypto";
import { discoverAgentCardFromUrl, type AgentCardDiscoveryResult } from "./agentCardDiscovery.js";
import type { AgentCardAssessment, AgentCardAssessmentCheck, AgentCardAssessmentReadiness } from "../src/agentCardAssessment.js";
import type { MarketAgent } from "../src/types.js";

export const AGENT_CARD_DILIGENCE_SKILL_ID = "agent-card.diligence";

export type AgentCardDiligenceDecision = "approve-supervised-trial" | "run-proof-task-first" | "do-not-use";

export type AgentCardDiligenceCheck = AgentCardAssessmentCheck & {
  owner: string;
};

export type AgentCardDiligence = {
  id: string;
  checkedAt: string;
  sourceUrl: string;
  discoveredUrl?: string;
  status: AgentCardDiscoveryResult["status"];
  decision: AgentCardDiligenceDecision;
  score: number;
  riskLevel: AgentCardAssessment["riskLevel"];
  readiness: AgentCardAssessmentReadiness;
  headline: string;
  buyerLine: string;
  providerLine: string;
  agent?: {
    id: string;
    name: string;
    handle: string;
    stage: string;
    price: number;
    headline: string;
    topCapabilities: Array<{ id: string; score: number }>;
    skills: Array<{ id: string; label: string; score: number }>;
  };
  checks: AgentCardDiligenceCheck[];
  redFlags: string[];
  actions: string[];
  trialTask?: AgentCardAssessment["trialTask"];
  warnings: string[];
  signals: string[];
  error?: string;
  exportMarkdown: string;
};

type DiscoveryDeps = Parameters<typeof discoverAgentCardFromUrl>[1];

function escapeHtml(value: string | number | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ownerForCheck(check: AgentCardAssessmentCheck) {
  if (check.id === "public-url") return "Provider";
  if (check.id === "provider") return "Provider";
  if (check.id === "skills" || check.id === "a2a") return "Agent owner";
  if (check.id === "tools" || check.id === "io-modes") return "Integration owner";
  return "Buyer";
}

function decisionFor(readiness: AgentCardAssessmentReadiness): AgentCardDiligenceDecision {
  if (readiness === "hire-ready") return "approve-supervised-trial";
  if (readiness === "trial-first") return "run-proof-task-first";
  return "do-not-use";
}

function headlineFor(decision: AgentCardDiligenceDecision) {
  if (decision === "approve-supervised-trial") return "This Agent Card can enter a supervised buyer trial";
  if (decision === "run-proof-task-first") return "Run one proof task before trusting this Agent Card";
  return "Do not use this Agent Card in a buyer workflow yet";
}

function buyerLineFor(input: Pick<AgentCardDiligence, "decision" | "score" | "riskLevel">) {
  if (input.decision === "approve-supervised-trial") {
    return `Score ${input.score}/100 with ${input.riskLevel} risk. Start with the generated trial task and attach the receipt before production use.`;
  }
  if (input.decision === "run-proof-task-first") {
    return `Score ${input.score}/100 with ${input.riskLevel} risk. Require a narrow proof task before adding this agent to a buyer packet.`;
  }
  return `Score ${input.score}/100 with ${input.riskLevel} risk. Keep this agent out of buyer-facing work until the failed checks are fixed.`;
}

function summarizeAgent(agent: MarketAgent): AgentCardDiligence["agent"] {
  const topCapabilities = Object.entries(agent.capabilities)
    .map(([id, score]) => ({ id, score }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
  return {
    id: agent.id,
    name: agent.name,
    handle: agent.handle,
    stage: agent.stage,
    price: agent.price,
    headline: agent.headline,
    topCapabilities,
    skills: agent.skills.slice(0, 5).map((skill) => ({
      id: skill.id,
      label: skill.label,
      score: skill.score
    }))
  };
}

function diligenceId(input: Pick<AgentCardDiligence, "checkedAt" | "sourceUrl" | "discoveredUrl" | "decision" | "score" | "status">) {
  return createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex")
    .slice(0, 16);
}

function buildMarkdown(report: Omit<AgentCardDiligence, "exportMarkdown">) {
  const lines = [
    `# ${report.headline}`,
    "",
    `- Decision: ${report.decision}`,
    `- Score: ${report.score}/100`,
    `- Risk: ${report.riskLevel}`,
    `- Readiness: ${report.readiness}`,
    `- Source: ${report.sourceUrl}`,
    report.discoveredUrl ? `- Discovered URL: ${report.discoveredUrl}` : "",
    report.agent ? `- Agent: ${report.agent.name} (${report.agent.handle})` : "",
    "",
    "## Buyer line",
    report.buyerLine,
    "",
    "## Checks",
    ...report.checks.map((check) => `- ${check.status}: ${check.label} (${check.owner}) - ${check.evidence}`),
    "",
    "## Actions",
    ...(report.actions.length ? report.actions.map((action) => `- ${action}`) : ["- No repair action required before supervised trial."]),
    "",
    "## Trial task",
    report.trialTask ? `- ${report.trialTask.method} / ${report.trialTask.skillId}: ${report.trialTask.objective}` : "- No trial task generated.",
    ...(report.error ? ["", "## Error", report.error] : [])
  ];
  return lines.filter((line) => line !== "").join("\n");
}

export function buildAgentCardDiligence(sourceUrl: string, result: AgentCardDiscoveryResult, checkedAt = new Date().toISOString()): AgentCardDiligence {
  if (result.status === "rejected") {
    const reportWithoutMarkdown = {
      id: "",
      checkedAt,
      sourceUrl,
      discoveredUrl: result.discoveredUrl,
      status: result.status,
      decision: "do-not-use" as const,
      score: 0,
      riskLevel: "high" as const,
      readiness: "blocked" as const,
      headline: headlineFor("do-not-use"),
      buyerLine: "Discovery failed, so this Agent Card cannot be evaluated or shared with a buyer yet.",
      providerLine: "Provider identity unavailable.",
      checks: [
        {
          id: "discovery",
          label: "Public discovery",
          status: "fail" as const,
          owner: "Provider",
          evidence: result.error
        }
      ],
      redFlags: [result.error],
      actions: [
        "Publish a reachable HTTPS Agent Card without credentials.",
        "Confirm the host resolves to a public address and returns JSON.",
        "Retry the diligence report after discovery succeeds."
      ],
      warnings: result.warnings,
      signals: result.signals,
      error: result.error
    };
    const report = {
      ...reportWithoutMarkdown,
      id: diligenceId(reportWithoutMarkdown)
    };
    return {
      ...report,
      exportMarkdown: buildMarkdown(report)
    };
  }

  const assessment = result.assessment;
  const decision = decisionFor(assessment.readiness);
  const checks = assessment.checks.map((check) => ({
    ...check,
    owner: ownerForCheck(check)
  }));
  const reportWithoutMarkdown = {
    id: "",
    checkedAt,
    sourceUrl,
    discoveredUrl: result.discoveredUrl,
    status: result.status,
    decision,
    score: assessment.score,
    riskLevel: assessment.riskLevel,
    readiness: assessment.readiness,
    headline: headlineFor(decision),
    buyerLine: "",
    providerLine: `${result.agent.name} by ${result.agent.handle}`,
    agent: summarizeAgent(result.agent),
    checks,
    redFlags: assessment.redFlags,
    actions: assessment.nextActions,
    trialTask: assessment.trialTask,
    warnings: result.warnings,
    signals: result.signals
  };
  const report = {
    ...reportWithoutMarkdown,
    id: diligenceId(reportWithoutMarkdown),
    buyerLine: buyerLineFor(reportWithoutMarkdown)
  };
  return {
    ...report,
    exportMarkdown: buildMarkdown(report)
  };
}

export async function runAgentCardDiligence(sourceUrl: string, deps: DiscoveryDeps = {}) {
  return buildAgentCardDiligence(sourceUrl, await discoverAgentCardFromUrl(sourceUrl, deps));
}

export function renderAgentCardDiligenceHtml(report: AgentCardDiligence, links: { jsonUrl: string; markdownUrl: string; appUrl: string; trialPlanUrl?: string }) {
  const checkCards = report.checks
    .map(
      (check) => `
        <article class="${escapeHtml(check.status)}">
          <div><span>${escapeHtml(check.owner)}</span><strong>${escapeHtml(check.status)}</strong></div>
          <h2>${escapeHtml(check.label)}</h2>
          <p>${escapeHtml(check.evidence)}</p>
        </article>`
    )
    .join("");
  const actionCards = report.actions
    .map(
      (action) => `
        <article>
          <span>Next action</span>
          <strong>${escapeHtml(action)}</strong>
        </article>`
    )
    .join("");
  const capabilityCards =
    report.agent?.topCapabilities
      .map(
        (capability) => `
          <article>
            <span>${escapeHtml(capability.id)}</span>
            <strong>${escapeHtml(capability.score)}</strong>
          </article>`
      )
      .join("") ?? "";
  const trialPayload = report.trialTask ? JSON.stringify(report.trialTask.payload, null, 2) : "No trial task generated.";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(report.headline)}</title>
    <style>
      :root { color: #172126; background: #edf2f4; font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-width: 320px; }
      a { color: inherit; }
      header, main, footer { width: min(1180px, calc(100vw - 28px)); margin: 0 auto; }
      header { margin-top: 14px; padding: 24px; border: 1px solid #172126; border-radius: 8px; color: #fffdf7; background: linear-gradient(120deg, #0d1b2a, #1f6f8b 56%, #0f766e); }
      .eyebrow, article span { color: #a8e7db; font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      h1 { max-width: 850px; margin: 7px 0 0; font-size: clamp(2.15rem, 5vw, 4.5rem); line-height: .93; letter-spacing: 0; }
      header p { max-width: 820px; color: rgba(255,253,247,.84); line-height: 1.55; }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
      nav a { min-height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 8px 12px; color: #102226; background: #fffdf7; font-size: .82rem; font-weight: 950; text-decoration: none; }
      .metrics, .checks, .actions, .capabilities { display: grid; gap: 8px; margin: 14px 0; }
      .metrics { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      .checks { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .actions, .capabilities { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      article, pre { min-width: 0; padding: 14px; border: 1px solid #c8d4d7; border-radius: 8px; background: #fffdf7; }
      .metrics strong { display: block; margin-top: 6px; font-size: 1.55rem; line-height: 1; overflow-wrap: anywhere; }
      .checks article { border-top: 5px solid #b56576; }
      .checks article.pass { border-top-color: #0f766e; background: #eefaf4; }
      .checks article.watch { border-top-color: #f2b84b; background: #fff8e6; }
      .checks article.fail { border-top-color: #b56576; background: #fff1f2; }
      article div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      article h2, article strong, article p { overflow-wrap: anywhere; }
      article h2 { margin: 10px 0 0; font-size: 1.05rem; line-height: 1.12; }
      article p, footer { color: #52645f; line-height: 1.42; }
      pre { overflow-x: auto; white-space: pre-wrap; color: #263238; }
      @media (max-width: 900px) { .metrics, .checks, .actions, .capabilities { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 560px) { header { padding: 16px; } .metrics, .checks, .actions, .capabilities { grid-template-columns: 1fr; } nav a { width: 100%; } }
    </style>
  </head>
  <body>
    <header>
      <span class="eyebrow">Agent Card Diligence</span>
      <h1>${escapeHtml(report.headline)}</h1>
      <p>${escapeHtml(report.buyerLine)}</p>
      <nav><a href="${escapeHtml(links.jsonUrl)}">JSON</a><a href="${escapeHtml(links.markdownUrl)}">Markdown</a>${links.trialPlanUrl ? `<a href="${escapeHtml(links.trialPlanUrl)}">Trial plan</a>` : ""}<a href="${escapeHtml(links.appUrl)}">Open app</a></nav>
    </header>
    <main>
      <section class="metrics" aria-label="Diligence metrics">
        <article><span>Score</span><strong>${escapeHtml(report.score)}</strong></article>
        <article><span>Decision</span><strong>${escapeHtml(report.decision)}</strong></article>
        <article><span>Risk</span><strong>${escapeHtml(report.riskLevel)}</strong></article>
        <article><span>Readiness</span><strong>${escapeHtml(report.readiness)}</strong></article>
        <article><span>Status</span><strong>${escapeHtml(report.status)}</strong></article>
      </section>
      ${report.agent ? `<section class="capabilities" aria-label="Top capabilities">${capabilityCards}</section>` : ""}
      <section class="checks" aria-label="Diligence checks">${checkCards}</section>
      <section class="actions" aria-label="Diligence actions">${actionCards}</section>
      <pre aria-label="Trial task payload">${escapeHtml(trialPayload)}</pre>
    </main>
    <footer>Report id ${escapeHtml(report.id)} checked at ${escapeHtml(report.checkedAt)}. Source ${escapeHtml(report.sourceUrl)}</footer>
  </body>
</html>`;
}
