import { createHash } from "node:crypto";
import { type AgentCardDiligence, runAgentCardDiligence } from "./agentCardDiligence.js";
import type { discoverAgentCardFromUrl } from "./agentCardDiscovery.js";

export const AGENT_CARD_SHORTLIST_SKILL_ID = "agent-card.shortlist";
export const MAX_AGENT_CARD_SHORTLIST_URLS = 4;

export type AgentCardShortlistVerdict = "trial-ready" | "proof-required" | "blocked";

export type AgentCardShortlistCandidate = AgentCardDiligence & {
  rank: number;
  fitScore: number;
  recommendation: "lead-trial" | "backup" | "proof-task" | "reject";
  why: string;
};

export type AgentCardShortlist = {
  id: string;
  checkedAt: string;
  verdict: AgentCardShortlistVerdict;
  headline: string;
  buyerLine: string;
  requestedCount: number;
  candidateCount: number;
  readyCount: number;
  proofTaskCount: number;
  blockedCount: number;
  leadCandidate?: AgentCardShortlistCandidate;
  candidates: AgentCardShortlistCandidate[];
  actions: string[];
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

function decisionWeight(report: AgentCardDiligence) {
  if (report.decision === "approve-supervised-trial") return 3;
  if (report.decision === "run-proof-task-first") return 2;
  return 0;
}

function riskWeight(report: AgentCardDiligence) {
  if (report.riskLevel === "low") return 10;
  if (report.riskLevel === "medium") return 4;
  return -12;
}

function passedChecks(report: AgentCardDiligence) {
  return report.checks.filter((check) => check.status === "pass").length;
}

function fitScore(report: AgentCardDiligence) {
  return Math.max(0, Math.min(100, Math.round(report.score * 0.78 + decisionWeight(report) * 7 + riskWeight(report) + passedChecks(report))));
}

function recommendationFor(report: AgentCardDiligence, index: number): AgentCardShortlistCandidate["recommendation"] {
  if (report.decision === "do-not-use") return "reject";
  if (report.decision === "run-proof-task-first") return "proof-task";
  return index === 0 ? "lead-trial" : "backup";
}

function whyFor(candidate: Pick<AgentCardShortlistCandidate, "recommendation" | "score" | "riskLevel" | "checks" | "agent" | "error">) {
  if (candidate.recommendation === "lead-trial") {
    return `${candidate.agent?.name ?? "This Agent Card"} has the strongest buyer-trial fit with score ${candidate.score}/100 and ${candidate.riskLevel} risk.`;
  }
  if (candidate.recommendation === "backup") {
    return `${candidate.agent?.name ?? "This Agent Card"} is trial-capable, but another candidate has a stronger fit score.`;
  }
  if (candidate.recommendation === "proof-task") {
    return `${candidate.agent?.name ?? "This Agent Card"} needs one accepted proof task before buyer use.`;
  }
  return candidate.error ?? "Discovery or required trust checks failed.";
}

function verdictFor(candidates: AgentCardShortlistCandidate[]): AgentCardShortlistVerdict {
  if (candidates.some((candidate) => candidate.recommendation === "lead-trial")) return "trial-ready";
  if (candidates.some((candidate) => candidate.recommendation === "proof-task")) return "proof-required";
  return "blocked";
}

function headlineFor(shortlist: Pick<AgentCardShortlist, "verdict" | "leadCandidate" | "candidateCount">) {
  if (shortlist.verdict === "trial-ready" && shortlist.leadCandidate) {
    return `Start with ${shortlist.leadCandidate.agent?.name ?? "the top Agent Card"}`;
  }
  if (shortlist.verdict === "proof-required") return "Run proof tasks before choosing an Agent Card";
  if (shortlist.candidateCount === 0) return "No Agent Cards were available to compare";
  return "Do not shortlist these Agent Cards yet";
}

function buyerLineFor(shortlist: Pick<AgentCardShortlist, "verdict" | "readyCount" | "proofTaskCount" | "blockedCount">) {
  if (shortlist.verdict === "trial-ready") {
    return `${shortlist.readyCount} candidate${shortlist.readyCount === 1 ? "" : "s"} can enter a supervised trial; keep ${shortlist.blockedCount} blocked candidate${shortlist.blockedCount === 1 ? "" : "s"} out of buyer work.`;
  }
  if (shortlist.verdict === "proof-required") {
    return `${shortlist.proofTaskCount} candidate${shortlist.proofTaskCount === 1 ? "" : "s"} need proof tasks before a buyer can safely choose.`;
  }
  return `${shortlist.blockedCount} candidate${shortlist.blockedCount === 1 ? "" : "s"} failed discovery or required trust checks.`;
}

function shortlistActions(candidates: AgentCardShortlistCandidate[]) {
  const lead = candidates.find((candidate) => candidate.recommendation === "lead-trial");
  if (lead) {
    return [
      `Run ${lead.agent?.name ?? "the lead candidate"} trial task: ${lead.trialTask?.objective ?? "request one bounded proof receipt."}`,
      "Attach the returned receipt before adding the agent to a buyer packet.",
      ...candidates
        .filter((candidate) => candidate.recommendation === "proof-task" || candidate.recommendation === "reject")
        .slice(0, 2)
        .map((candidate) => `${candidate.agent?.name ?? candidate.sourceUrl}: ${candidate.actions[0] ?? candidate.why}`)
    ].slice(0, 4);
  }
  const proofTask = candidates.find((candidate) => candidate.recommendation === "proof-task");
  if (proofTask) {
    return [
      `Ask ${proofTask.agent?.name ?? "the strongest candidate"} for proof: ${proofTask.trialTask?.objective ?? proofTask.why}`,
      "Re-run the shortlist after the proof receipt is attached.",
      ...candidates.filter((candidate) => candidate.recommendation === "reject").slice(0, 2).map((candidate) => `${candidate.sourceUrl}: ${candidate.actions[0] ?? candidate.why}`)
    ].slice(0, 4);
  }
  return candidates.slice(0, 3).map((candidate) => `${candidate.sourceUrl}: ${candidate.actions[0] ?? candidate.why}`);
}

function shortlistId(input: Pick<AgentCardShortlist, "checkedAt" | "verdict" | "candidates">) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        checkedAt: input.checkedAt,
        verdict: input.verdict,
        candidates: input.candidates.map((candidate) => [candidate.sourceUrl, candidate.decision, candidate.score, candidate.fitScore])
      })
    )
    .digest("hex")
    .slice(0, 16);
}

function buildMarkdown(shortlist: Omit<AgentCardShortlist, "exportMarkdown">) {
  const lines = [
    `# ${shortlist.headline}`,
    "",
    `- Verdict: ${shortlist.verdict}`,
    `- Candidates: ${shortlist.candidateCount}/${shortlist.requestedCount}`,
    `- Trial-ready: ${shortlist.readyCount}`,
    `- Proof tasks: ${shortlist.proofTaskCount}`,
    `- Blocked: ${shortlist.blockedCount}`,
    "",
    "## Ranking",
    ...shortlist.candidates.map((candidate) => `- #${candidate.rank} ${candidate.agent?.name ?? candidate.sourceUrl}: ${candidate.recommendation}, fit ${candidate.fitScore}/100, diligence ${candidate.score}/100, ${candidate.riskLevel} risk`),
    "",
    "## Actions",
    ...(shortlist.actions.length ? shortlist.actions.map((action) => `- ${action}`) : ["- Add at least one public Agent Card URL."])
  ];
  return lines.join("\n");
}

export function buildAgentCardShortlist(sourceUrls: string[], reports: AgentCardDiligence[], checkedAt = new Date().toISOString()): AgentCardShortlist {
  const sorted = reports
    .map((report) => ({ report, fit: fitScore(report) }))
    .sort((left, right) => right.fit - left.fit || decisionWeight(right.report) - decisionWeight(left.report) || right.report.score - left.report.score);
  const candidates = sorted.map(({ report, fit }, index): AgentCardShortlistCandidate => {
    const recommendation = recommendationFor(report, index);
    const candidate = {
      ...report,
      rank: index + 1,
      fitScore: fit,
      recommendation,
      why: ""
    };
    return {
      ...candidate,
      why: whyFor(candidate)
    };
  });
  const readyCount = candidates.filter((candidate) => candidate.decision === "approve-supervised-trial").length;
  const proofTaskCount = candidates.filter((candidate) => candidate.decision === "run-proof-task-first").length;
  const blockedCount = candidates.filter((candidate) => candidate.decision === "do-not-use").length;
  const leadCandidate = candidates.find((candidate) => candidate.recommendation === "lead-trial");
  const shortlistWithoutMarkdown = {
    id: "",
    checkedAt,
    verdict: "blocked" as AgentCardShortlistVerdict,
    headline: "",
    buyerLine: "",
    requestedCount: sourceUrls.length,
    candidateCount: candidates.length,
    readyCount,
    proofTaskCount,
    blockedCount,
    leadCandidate,
    candidates,
    actions: shortlistActions(candidates)
  };
  const verdict = verdictFor(candidates);
  const shortlist = {
    ...shortlistWithoutMarkdown,
    verdict,
    headline: headlineFor({ ...shortlistWithoutMarkdown, verdict }),
    buyerLine: buyerLineFor({ ...shortlistWithoutMarkdown, verdict })
  };
  const withId = {
    ...shortlist,
    id: shortlistId(shortlist)
  };
  return {
    ...withId,
    exportMarkdown: buildMarkdown(withId)
  };
}

export async function runAgentCardShortlist(sourceUrls: string[], deps: DiscoveryDeps = {}) {
  const uniqueUrls = [...new Set(sourceUrls.map((url) => url.trim()).filter(Boolean))].slice(0, MAX_AGENT_CARD_SHORTLIST_URLS);
  const reports = await Promise.all(uniqueUrls.map((url) => runAgentCardDiligence(url, deps)));
  return buildAgentCardShortlist(uniqueUrls, reports);
}

export function renderAgentCardShortlistHtml(shortlist: AgentCardShortlist, links: { jsonUrl: string; markdownUrl: string; appUrl: string; trialPlanBaseUrl?: string }) {
  const candidateCards = shortlist.candidates
    .map((candidate) => {
      const trialPlanUrl = links.trialPlanBaseUrl ? `${links.trialPlanBaseUrl}?url=${encodeURIComponent(candidate.sourceUrl)}` : "";
      return `
        <article class="${escapeHtml(candidate.recommendation)}">
          <div><span>#${escapeHtml(candidate.rank)} ${escapeHtml(candidate.recommendation)}</span><strong>${escapeHtml(candidate.fitScore)}</strong></div>
          <h2>${escapeHtml(candidate.agent?.name ?? candidate.sourceUrl)}</h2>
          <p>${escapeHtml(candidate.why)}</p>
          <small>${escapeHtml(candidate.decision)} / diligence ${escapeHtml(candidate.score)} / ${escapeHtml(candidate.riskLevel)} risk</small>
          ${trialPlanUrl ? `<a class="candidate-link" href="${escapeHtml(trialPlanUrl)}">Trial plan</a>` : ""}
        </article>`;
    })
    .join("");
  const actionCards = shortlist.actions
    .map(
      (action) => `
        <article>
          <span>Next action</span>
          <strong>${escapeHtml(action)}</strong>
        </article>`
    )
    .join("");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(shortlist.headline)}</title>
    <style>
      :root { color: #172126; background: #edf2f4; font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-width: 320px; }
      a { color: inherit; }
      header, main, footer { width: min(1180px, calc(100vw - 28px)); margin: 0 auto; }
      header { margin-top: 14px; padding: 24px; border: 1px solid #172126; border-radius: 8px; color: #fffdf7; background: linear-gradient(120deg, #102226, #315a7d 54%, #0f766e); }
      .eyebrow, article span { color: #b8efd4; font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      h1 { max-width: 850px; margin: 7px 0 0; font-size: clamp(2.15rem, 5vw, 4.5rem); line-height: .93; letter-spacing: 0; }
      header p { max-width: 840px; color: rgba(255,253,247,.84); line-height: 1.55; }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
      nav a { min-height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 8px 12px; color: #102226; background: #fffdf7; font-size: .82rem; font-weight: 950; text-decoration: none; }
      .metrics, .candidates, .actions { display: grid; gap: 8px; margin: 14px 0; }
      .metrics { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      .candidates { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      article { min-width: 0; padding: 14px; border: 1px solid #c8d4d7; border-radius: 8px; background: #fffdf7; }
      .candidate-link { display: inline-flex; margin-top: 10px; border-radius: 999px; padding: 7px 10px; color: #fffdf7; background: #172126; font-size: .78rem; font-weight: 950; text-decoration: none; }
      .metrics strong { display: block; margin-top: 6px; font-size: 1.55rem; line-height: 1; overflow-wrap: anywhere; }
      .candidates article { border-top: 5px solid #b56576; }
      .candidates article.lead-trial { border-top-color: #0f766e; background: #eefaf4; }
      .candidates article.backup { border-top-color: #315a7d; background: #edf5ff; }
      .candidates article.proof-task { border-top-color: #f2b84b; background: #fff8e6; }
      .candidates article.reject { border-top-color: #b56576; background: #fff1f2; }
      article div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      article h2, article strong, article p, article small { overflow-wrap: anywhere; }
      article h2 { margin: 10px 0 0; font-size: 1.08rem; line-height: 1.12; }
      article p, article small, footer { color: #52645f; line-height: 1.42; }
      @media (max-width: 900px) { .metrics, .candidates, .actions { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 560px) { header { padding: 16px; } .metrics, .candidates, .actions { grid-template-columns: 1fr; } nav a { width: 100%; } }
    </style>
  </head>
  <body>
    <header>
      <span class="eyebrow">Agent Card Shortlist</span>
      <h1>${escapeHtml(shortlist.headline)}</h1>
      <p>${escapeHtml(shortlist.buyerLine)}</p>
      <nav><a href="${escapeHtml(links.jsonUrl)}">JSON</a><a href="${escapeHtml(links.markdownUrl)}">Markdown</a><a href="${escapeHtml(links.appUrl)}">Open app</a></nav>
    </header>
    <main>
      <section class="metrics" aria-label="Shortlist metrics">
        <article><span>Verdict</span><strong>${escapeHtml(shortlist.verdict)}</strong></article>
        <article><span>Candidates</span><strong>${escapeHtml(`${shortlist.candidateCount}/${shortlist.requestedCount}`)}</strong></article>
        <article><span>Trial-ready</span><strong>${escapeHtml(shortlist.readyCount)}</strong></article>
        <article><span>Proof tasks</span><strong>${escapeHtml(shortlist.proofTaskCount)}</strong></article>
        <article><span>Blocked</span><strong>${escapeHtml(shortlist.blockedCount)}</strong></article>
      </section>
      <section class="candidates" aria-label="Ranked Agent Cards">${candidateCards}</section>
      <section class="actions" aria-label="Shortlist actions">${actionCards}</section>
    </main>
    <footer>Shortlist id ${escapeHtml(shortlist.id)} checked at ${escapeHtml(shortlist.checkedAt)}</footer>
  </body>
</html>`;
}
