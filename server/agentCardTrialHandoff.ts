import { createHash } from "node:crypto";
import { encodeWorkspaceShareParam, WORKSPACE_SHARE_PARAM, buildWorkspaceDraft, type WorkspaceDraft } from "../src/workspaceDraft.js";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace.js";
import type { AgentTrialEvidenceRecord } from "../src/agentTrialEvidence.js";
import { type AgentCardTrialVerification, runAgentCardTrialVerification } from "./agentCardTrialVerification.js";

export const AGENT_CARD_TRIAL_HANDOFF_SKILL_ID = "agent-card.trial-handoff";

export type AgentCardTrialHandoffStatus = "workspace-ready" | "needs-evidence" | "blocked";

export type AgentCardTrialHandoffLink = {
  id: "launch-room" | "buyer-proof-packet" | "procurement-decision" | "proof-monitor";
  label: string;
  url: string;
  purpose: string;
};

export type AgentCardTrialHandoff = {
  id: string;
  checkedAt: string;
  status: AgentCardTrialHandoffStatus;
  score: number;
  headline: string;
  buyerLine: string;
  verification: AgentCardTrialVerification;
  evidenceRecord: AgentTrialEvidenceRecord | null;
  workspace: WorkspaceDraft;
  workspaceParam: string;
  links: AgentCardTrialHandoffLink[];
  nextActions: string[];
  exportMarkdown: string;
};

type VerificationDeps = Parameters<typeof runAgentCardTrialVerification>[2];

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

function routeWithWorkspace(baseUrl: string, pathName: string, workspaceParam: string) {
  const url = new URL(pathName, `${cleanBaseUrl(baseUrl)}/`);
  url.searchParams.set(WORKSPACE_SHARE_PARAM, workspaceParam);
  return url.toString();
}

function handoffStatusFor(verification: AgentCardTrialVerification): AgentCardTrialHandoffStatus {
  if (verification.status === "accepted" && verification.artifactUrl && verification.evidenceSource) return "workspace-ready";
  if (verification.status === "failed") return "blocked";
  return "needs-evidence";
}

function headlineFor(status: AgentCardTrialHandoffStatus, verification: AgentCardTrialVerification) {
  if (status === "workspace-ready") return `Attach ${verification.agentName} proof to the buyer workspace`;
  if (status === "needs-evidence") return `${verification.agentName} proof is not ready to attach`;
  return `${verification.agentName} trial proof is blocked`;
}

function buyerLineFor(status: AgentCardTrialHandoffStatus) {
  if (status === "workspace-ready") {
    return "The accepted trial receipt is now transformed into workspace evidence and linked into the launch room, proof packet, and procurement decision.";
  }
  if (status === "needs-evidence") {
    return "The response needs stronger evidence before it can safely influence downstream buyer artifacts.";
  }
  return "The response failed a required verification check, so no buyer workspace evidence was generated.";
}

function scoreFor(status: AgentCardTrialHandoffStatus, verificationScore: number) {
  if (status === "workspace-ready") return Math.max(90, verificationScore);
  if (status === "needs-evidence") return Math.min(84, verificationScore);
  return Math.min(49, verificationScore);
}

export function evidenceRecordFromTrialVerification(verification: AgentCardTrialVerification, workspaceAgentId?: string): AgentTrialEvidenceRecord | null {
  if (verification.status !== "accepted" || !verification.artifactUrl || !verification.evidenceSource) return null;
  return {
    id: `trial-proof-${verification.expectedReceiptId}`,
    receiptId: verification.expectedReceiptId,
    agentId: workspaceAgentId?.trim() || `agent-card-${verification.planId}`,
    agentName: verification.agentName,
    skillId: verification.skillId,
    status: verification.status,
    score: verification.score,
    artifactUrl: verification.artifactUrl,
    evidenceSource: verification.evidenceSource,
    headline: verification.headline,
    summary: `${verification.agentName} returned accepted trial proof for ${verification.skillId} with ${verification.evidenceSource}.`,
    attachedAt: verification.checkedAt
  };
}

function workspaceWithEvidence(baseWorkspace: WorkspaceDraft, evidenceRecord: AgentTrialEvidenceRecord | null, updatedAt: string) {
  const evidence = evidenceRecord
    ? [evidenceRecord, ...baseWorkspace.agentTrialEvidence.filter((record) => record.id !== evidenceRecord.id)]
    : baseWorkspace.agentTrialEvidence;
  return buildWorkspaceDraft({
    activeTemplateId: baseWorkspace.activeTemplateId,
    projectBrief: baseWorkspace.projectBrief,
    selectedAgentIds: baseWorkspace.selectedAgentIds,
    customAgents: baseWorkspace.customAgents,
    agentTrialEvidence: evidence,
    buyerScenario: baseWorkspace.buyerScenario,
    pilotRun: baseWorkspace.pilotRun,
    buyerWorkOrder: baseWorkspace.buyerWorkOrder,
    targetUrl: baseWorkspace.targetUrl,
    protopediaUrl: baseWorkspace.protopediaUrl,
    videoUrl: baseWorkspace.videoUrl,
    proofVerification: baseWorkspace.proofVerification,
    updatedAt
  });
}

function linksFor(baseUrl: string, workspaceParam: string): AgentCardTrialHandoffLink[] {
  return [
    {
      id: "launch-room",
      label: "Open launch room",
      url: routeWithWorkspace(baseUrl, "/launch-room", workspaceParam),
      purpose: "Show the buyer-facing operating room with this accepted A2A trial attached."
    },
    {
      id: "buyer-proof-packet",
      label: "Open proof packet",
      url: routeWithWorkspace(baseUrl, "/buyer-proof-packet", workspaceParam),
      purpose: "Review whether value, proof, agreement, diligence, and execution artifacts are share-ready."
    },
    {
      id: "procurement-decision",
      label: "Open procurement decision",
      url: routeWithWorkspace(baseUrl, "/procurement-decision", workspaceParam),
      purpose: "Inspect the buy, pilot, or hold decision after attaching the trial receipt."
    },
    {
      id: "proof-monitor",
      label: "Open proof monitor",
      url: routeWithWorkspace(baseUrl, "/buyer-proof-monitor", workspaceParam),
      purpose: "Check whether public proof links remain fresh enough for external review."
    }
  ];
}

function buildMarkdown(handoff: Omit<AgentCardTrialHandoff, "exportMarkdown">) {
  return [
    `# ${handoff.headline}`,
    "",
    `- Status: ${handoff.status}`,
    `- Score: ${handoff.score}/100`,
    `- Verification: ${handoff.verification.status} (${handoff.verification.score}/100)`,
    `- Agent: ${handoff.verification.agentName}`,
    `- Skill: ${handoff.verification.skillId}`,
    handoff.evidenceRecord ? `- Evidence record: ${handoff.evidenceRecord.id}` : "- Evidence record: not generated",
    "",
    handoff.buyerLine,
    "",
    "## Workspace links",
    ...handoff.links.map((link) => `- ${link.label}: ${link.url}`),
    "",
    "## Next actions",
    ...handoff.nextActions.map((action) => `- ${action}`)
  ].join("\n");
}

export function buildAgentCardTrialHandoff(input: {
  verification: AgentCardTrialVerification;
  baseUrl: string;
  workspace?: WorkspaceDraft;
  checkedAt?: string;
  workspaceAgentId?: string;
}): AgentCardTrialHandoff {
  const checkedAt = input.checkedAt ?? new Date().toISOString();
  const status = handoffStatusFor(input.verification);
  const evidenceRecord = evidenceRecordFromTrialVerification(input.verification, input.workspaceAgentId);
  const baseWorkspace = input.workspace ?? buildProofBackedSampleWorkspaceDraft(checkedAt, input.baseUrl);
  const workspace = workspaceWithEvidence(baseWorkspace, evidenceRecord, checkedAt);
  const workspaceParam = encodeWorkspaceShareParam(workspace);
  const links = linksFor(input.baseUrl, workspaceParam);
  const nextActions =
    status === "workspace-ready"
      ? [
          "Open the launch room and confirm the accepted A2A trial appears in buyer proof.",
          "Use the proof packet and procurement decision links during sponsor review.",
          "Keep the artifact URL public until the buyer review is complete."
        ]
      : input.verification.nextActions;
  const withoutMarkdown = {
    id: "",
    checkedAt,
    status,
    score: scoreFor(status, input.verification.score),
    headline: headlineFor(status, input.verification),
    buyerLine: buyerLineFor(status),
    verification: input.verification,
    evidenceRecord,
    workspace,
    workspaceParam,
    links,
    nextActions
  };
  const withId = {
    ...withoutMarkdown,
    id: createHash("sha256")
      .update(JSON.stringify({ checkedAt, verificationId: input.verification.id, status, workspaceParam }))
      .digest("hex")
      .slice(0, 16)
  };
  return {
    ...withId,
    exportMarkdown: buildMarkdown(withId)
  };
}

export async function runAgentCardTrialHandoff(input: {
  sourceUrl: string;
  rawResponse: unknown;
  baseUrl: string;
  workspace?: WorkspaceDraft;
  workspaceAgentId?: string;
  deps?: VerificationDeps;
}) {
  const verification = await runAgentCardTrialVerification(input.sourceUrl, input.rawResponse, input.deps ?? {});
  return buildAgentCardTrialHandoff({ verification, baseUrl: input.baseUrl, workspace: input.workspace, workspaceAgentId: input.workspaceAgentId });
}

export function renderAgentCardTrialHandoffHtml(
  handoff: AgentCardTrialHandoff,
  links: { jsonUrl: string; markdownUrl: string; verificationUrl: string; appUrl: string }
) {
  const workspaceLinks = handoff.links
    .map(
      (link) => `
        <article class="pass">
          <span>${escapeHtml(link.id)}</span>
          <h2><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></h2>
          <p>${escapeHtml(link.purpose)}</p>
        </article>`
    )
    .join("");
  const actions = handoff.nextActions.map((action) => `<li>${escapeHtml(action)}</li>`).join("");
  const evidence = handoff.evidenceRecord
    ? `<pre>${escapeHtml(JSON.stringify(handoff.evidenceRecord, null, 2))}</pre>`
    : `<p>${escapeHtml("No workspace evidence record was generated because verification is not accepted.")}</p>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(handoff.headline)}</title>
    <style>
      :root { color: #172126; background: #edf2f4; font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-width: 320px; }
      a { color: inherit; }
      header, main, footer { width: min(1180px, calc(100vw - 28px)); margin: 0 auto; }
      header { margin-top: 14px; padding: 24px; border: 1px solid #172126; border-radius: 8px; color: #fffdf7; background: linear-gradient(120deg, #11292e, #2f4858 52%, #0f766e); }
      .eyebrow, article span { color: #b8efd4; font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      h1 { max-width: 860px; margin: 7px 0 0; font-size: clamp(2.15rem, 5vw, 4.5rem); line-height: .93; letter-spacing: 0; }
      header p { max-width: 840px; color: rgba(255,253,247,.84); line-height: 1.55; }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
      nav a { min-height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 8px 12px; color: #102226; background: #fffdf7; font-size: .82rem; font-weight: 950; text-decoration: none; }
      .metrics, .workspace-links { display: grid; gap: 8px; margin: 14px 0; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .workspace-links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      article, pre, .actions, .evidence { min-width: 0; padding: 14px; border: 1px solid #c8d4d7; border-radius: 8px; background: #fffdf7; }
      .metrics strong { display: block; margin-top: 6px; font-size: 1.45rem; line-height: 1; overflow-wrap: anywhere; }
      article.pass { border-top: 5px solid #0f766e; background: #eefaf4; }
      article.watch { border-top: 5px solid #f2b84b; background: #fff8e6; }
      article.fail { border-top: 5px solid #b56576; background: #fff1f2; }
      article h2, article strong, article p { overflow-wrap: anywhere; }
      article h2 { margin: 10px 0 0; font-size: 1.05rem; line-height: 1.12; }
      article p, footer, li, .evidence p { color: #52645f; line-height: 1.42; }
      pre { margin: 10px 0 0; overflow-x: auto; white-space: pre-wrap; color: #263238; }
      .actions ul { margin: 8px 0 0; padding-left: 20px; }
      @media (max-width: 760px) { header { padding: 16px; } .metrics, .workspace-links { grid-template-columns: 1fr; } nav a { width: 100%; } }
    </style>
  </head>
  <body>
    <header>
      <span class="eyebrow">Agent Card Trial Handoff</span>
      <h1>${escapeHtml(handoff.headline)}</h1>
      <p>${escapeHtml(handoff.buyerLine)}</p>
      <nav><a href="${escapeHtml(links.jsonUrl)}">JSON</a><a href="${escapeHtml(links.markdownUrl)}">Markdown</a><a href="${escapeHtml(links.verificationUrl)}">Verification</a><a href="${escapeHtml(links.appUrl)}">Open app</a></nav>
    </header>
    <main>
      <section class="metrics" aria-label="Trial handoff metrics">
        <article class="${handoff.status === "workspace-ready" ? "pass" : handoff.status === "needs-evidence" ? "watch" : "fail"}"><span>Status</span><strong>${escapeHtml(handoff.status)}</strong></article>
        <article><span>Score</span><strong>${escapeHtml(handoff.score)}</strong></article>
        <article><span>Verification</span><strong>${escapeHtml(handoff.verification.status)}</strong></article>
        <article><span>Workspace proof</span><strong>${escapeHtml(handoff.workspace.agentTrialEvidence.length)}</strong></article>
      </section>
      <section class="workspace-links" aria-label="Workspace handoff links">${workspaceLinks}</section>
      <section class="actions" aria-label="Next actions"><strong>Next actions</strong><ul>${actions}</ul></section>
      <section class="evidence" aria-label="Workspace evidence record"><strong>Workspace evidence record</strong>${evidence}</section>
    </main>
    <footer>Handoff id ${escapeHtml(handoff.id)} checked at ${escapeHtml(handoff.checkedAt)}.</footer>
  </body>
</html>`;
}
