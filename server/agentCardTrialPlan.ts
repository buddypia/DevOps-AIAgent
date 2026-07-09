import { createHash } from "node:crypto";
import { type AgentCardDiligence, runAgentCardDiligence } from "./agentCardDiligence.js";
import type { discoverAgentCardFromUrl } from "./agentCardDiscovery.js";

export const AGENT_CARD_TRIAL_PLAN_SKILL_ID = "agent-card.trial-plan";

export type AgentCardTrialPlanReadiness = "ready-to-run" | "needs-proof" | "blocked";
export type AgentCardTrialPlanStepStatus = "pass" | "watch" | "fail";

export type AgentCardTrialPlanStep = {
  id: string;
  label: string;
  owner: string;
  status: AgentCardTrialPlanStepStatus;
  action: string;
  evidence: string;
};

export type AgentCardTrialPlanEvidence = {
  id: string;
  label: string;
  required: string;
  rejectIfMissing: boolean;
};

export type AgentCardTrialPlan = {
  id: string;
  checkedAt: string;
  sourceUrl: string;
  diligenceId: string;
  readiness: AgentCardTrialPlanReadiness;
  trialScore: number;
  headline: string;
  buyerLine: string;
  agentName: string;
  skillId: string;
  receiptId: string;
  objective: string;
  acceptance: string[];
  evidenceContract: AgentCardTrialPlanEvidence[];
  steps: AgentCardTrialPlanStep[];
  stopRules: string[];
  jsonRpcPayload: {
    jsonrpc: "2.0";
    id: string;
    method: "message/send";
    params: {
      skillId: string;
      message: {
        role: "user";
        parts: Array<{ type: "text"; text: string } | { type: "data"; data: Record<string, unknown> }>;
      };
      metadata: {
        receiptId: string;
        diligenceId: string;
        sourceUrl: string;
        agentName: string;
        decision: AgentCardDiligence["decision"];
        riskLevel: AgentCardDiligence["riskLevel"];
      };
    };
  };
  repairActions: string[];
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

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function readinessFor(report: AgentCardDiligence): AgentCardTrialPlanReadiness {
  if (report.decision === "approve-supervised-trial") return "ready-to-run";
  if (report.decision === "run-proof-task-first") return "needs-proof";
  return "blocked";
}

function trialScoreFor(report: AgentCardDiligence, readiness: AgentCardTrialPlanReadiness) {
  if (readiness === "blocked") return 0;
  const riskAdjustment = report.riskLevel === "low" ? 8 : report.riskLevel === "medium" ? 0 : -18;
  const decisionAdjustment = readiness === "ready-to-run" ? 8 : -4;
  return clamp(Math.round(report.score + riskAdjustment + decisionAdjustment));
}

function receiptIdFor(input: { sourceUrl: string; skillId: string; objective: string; acceptance: string[] }) {
  return `trial-plan-${createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 14)}`;
}

function headlineFor(readiness: AgentCardTrialPlanReadiness, agentName: string) {
  if (readiness === "ready-to-run") return `Run a supervised trial for ${agentName}`;
  if (readiness === "needs-proof") return `Require proof before trialing ${agentName}`;
  return `Do not run ${agentName} yet`;
}

function buyerLineFor(readiness: AgentCardTrialPlanReadiness, report: AgentCardDiligence) {
  if (readiness === "ready-to-run") {
    return "The buyer can run this bounded A2A task, review the public receipt, and stop before production delegation.";
  }
  if (readiness === "needs-proof") {
    return "The buyer should request one narrow capability receipt before this agent enters any procurement packet.";
  }
  return report.error || "Discovery or trust checks failed, so this agent is not safe to trial.";
}

function evidenceContract(): AgentCardTrialPlanEvidence[] {
  return [
    {
      id: "receipt-id",
      label: "Receipt id",
      required: "The response repeats the generated receiptId.",
      rejectIfMissing: true
    },
    {
      id: "artifact-url",
      label: "Public artifact URL",
      required: "The response includes an HTTPS artifactUrl that a buyer can open without credentials.",
      rejectIfMissing: true
    },
    {
      id: "evidence-source",
      label: "Evidence source",
      required: "Every claim names the log, check, receipt, or public endpoint used as evidence.",
      rejectIfMissing: true
    },
    {
      id: "acceptance",
      label: "Acceptance acknowledgement",
      required: "The response maps each acceptance criterion to a result.",
      rejectIfMissing: false
    },
    {
      id: "safety-boundary",
      label: "Safety boundary",
      required: "The response confirms no credential, private URL, or production mutation was required.",
      rejectIfMissing: true
    }
  ];
}

function stopRules() {
  return [
    "Stop if credentials are requested.",
    "Stop if a private URL, private network, or privileged integration is required.",
    "Stop if the task would mutate production state.",
    "Stop if the response cannot return a public artifact URL.",
    "Stop if the agent changes the generated receiptId or skillId."
  ];
}

function buildSteps(input: { readiness: AgentCardTrialPlanReadiness; report: AgentCardDiligence; receiptId: string }): AgentCardTrialPlanStep[] {
  if (input.readiness === "blocked") {
    return [
      {
        id: "repair-card",
        label: "Repair Agent Card",
        owner: "Provider",
        status: "fail",
        action: input.report.actions[0] ?? "Publish a reachable Agent Card with provider, skills, tools, and input/output metadata.",
        evidence: input.report.redFlags[0] ?? input.report.error ?? "Required trust checks failed."
      },
      {
        id: "rerun-diligence",
        label: "Rerun diligence",
        owner: "Buyer",
        status: "watch",
        action: "Run Agent Card diligence again after the provider fixes discovery and trust metadata.",
        evidence: input.report.sourceUrl
      }
    ];
  }

  return [
    {
      id: "send-payload",
      label: "Send trial payload",
      owner: "Buyer operator",
      status: "pass",
      action: `Send the generated message/send payload with receipt ${input.receiptId}.`,
      evidence: input.report.trialTask?.skillId ?? "message/send"
    },
    {
      id: "collect-receipt",
      label: "Collect receipt",
      owner: "Agent owner",
      status: input.readiness === "ready-to-run" ? "pass" : "watch",
      action: "Return JSON with receiptId, skillId, status, artifactUrl, evidenceSource, acceptance, and safety flags.",
      evidence: "The response must be parseable JSON."
    },
    {
      id: "verify-response",
      label: "Verify response",
      owner: "Buyer reviewer",
      status: "watch",
      action: "Paste the response into the app verifier and attach only accepted proof to the buyer workspace.",
      evidence: "Accepted verification becomes trial evidence for downstream buyer rooms."
    }
  ];
}

function buildPayload(input: {
  report: AgentCardDiligence;
  receiptId: string;
  skillId: string;
  objective: string;
  acceptance: string[];
  evidence: AgentCardTrialPlanEvidence[];
}) {
  return {
    jsonrpc: "2.0" as const,
    id: input.receiptId,
    method: "message/send" as const,
    params: {
      skillId: input.skillId,
      message: {
        role: "user" as const,
        parts: [
          {
            type: "text" as const,
            text: input.objective
          },
          {
            type: "data" as const,
            data: {
              ...(input.report.trialTask?.payload ?? {}),
              requestedArtifact: input.report.trialTask?.payload.requestedArtifact ?? "capability-proof-receipt",
              acceptance: input.acceptance,
              evidenceContract: input.evidence,
              stopRules: stopRules(),
              responseShape: {
                receiptId: input.receiptId,
                skillId: input.skillId,
                status: "completed",
                artifactUrl: "https://...",
                evidenceSource: "named public source",
                acceptance: input.acceptance,
                requiresCredentials: false,
                privateUrl: false,
                mutatedProduction: false
              }
            }
          }
        ]
      },
      metadata: {
        receiptId: input.receiptId,
        diligenceId: input.report.id,
        sourceUrl: input.report.sourceUrl,
        agentName: input.report.agent?.name ?? "Unknown Agent Card",
        decision: input.report.decision,
        riskLevel: input.report.riskLevel
      }
    }
  };
}

function buildMarkdown(plan: Omit<AgentCardTrialPlan, "exportMarkdown">) {
  return [
    `# ${plan.headline}`,
    "",
    `- Readiness: ${plan.readiness}`,
    `- Score: ${plan.trialScore}/100`,
    `- Agent: ${plan.agentName}`,
    `- Skill: ${plan.skillId}`,
    `- Receipt: ${plan.receiptId}`,
    `- Source: ${plan.sourceUrl}`,
    "",
    plan.buyerLine,
    "",
    "## Acceptance",
    ...plan.acceptance.map((item) => `- ${item}`),
    "",
    "## Evidence contract",
    ...plan.evidenceContract.map((item) => `- ${item.label}: ${item.required}`),
    "",
    "## Steps",
    ...plan.steps.map((step) => `- [${step.status}] ${step.label} (${step.owner}): ${step.action}`),
    "",
    "## Stop rules",
    ...plan.stopRules.map((rule) => `- ${rule}`),
    "",
    "## JSON-RPC payload",
    "```json",
    JSON.stringify(plan.jsonRpcPayload, null, 2),
    "```",
    "",
    "## Repair actions",
    ...(plan.repairActions.length ? plan.repairActions.map((action) => `- ${action}`) : ["- No repair action before supervised trial."])
  ].join("\n");
}

export function buildAgentCardTrialPlan(report: AgentCardDiligence, checkedAt = new Date().toISOString()): AgentCardTrialPlan {
  const readiness = readinessFor(report);
  const agentName = report.agent?.name ?? "Unknown Agent Card";
  const skillId = report.trialTask?.skillId ?? "task.delegate";
  const acceptance = [
    ...(report.trialTask?.acceptance ?? []),
    "Return the generated receiptId and skillId unchanged.",
    "Return a public HTTPS artifactUrl and named evidenceSource."
  ];
  const evidence = evidenceContract();
  const objective = report.trialTask?.objective ?? "Do not execute a trial until Agent Card diligence can generate a safe task.";
  const receiptId = receiptIdFor({ sourceUrl: report.sourceUrl, skillId, objective, acceptance });
  const partial = {
    id: "",
    checkedAt,
    sourceUrl: report.sourceUrl,
    diligenceId: report.id,
    readiness,
    trialScore: trialScoreFor(report, readiness),
    headline: headlineFor(readiness, agentName),
    buyerLine: buyerLineFor(readiness, report),
    agentName,
    skillId,
    receiptId,
    objective,
    acceptance,
    evidenceContract: evidence,
    steps: buildSteps({ readiness, report, receiptId }),
    stopRules: stopRules(),
    jsonRpcPayload: buildPayload({ report, receiptId, skillId, objective, acceptance, evidence }),
    repairActions: readiness === "blocked" ? report.actions : report.actions.slice(0, 2)
  };
  const withId = {
    ...partial,
    id: createHash("sha256")
      .update(JSON.stringify({ receiptId, sourceUrl: report.sourceUrl, readiness, skillId }))
      .digest("hex")
      .slice(0, 16)
  };
  return {
    ...withId,
    exportMarkdown: buildMarkdown(withId)
  };
}

export async function runAgentCardTrialPlan(sourceUrl: string, deps: DiscoveryDeps = {}) {
  return buildAgentCardTrialPlan(await runAgentCardDiligence(sourceUrl, deps));
}

export function renderAgentCardTrialPlanHtml(
  plan: AgentCardTrialPlan,
  links: { jsonUrl: string; markdownUrl: string; diligenceUrl: string; appUrl: string; verificationUrl?: string }
) {
  const steps = plan.steps
    .map(
      (step) => `
        <article class="${escapeHtml(step.status)}">
          <div><span>${escapeHtml(step.owner)}</span><strong>${escapeHtml(step.status)}</strong></div>
          <h2>${escapeHtml(step.label)}</h2>
          <p>${escapeHtml(step.action)}</p>
          <small>${escapeHtml(step.evidence)}</small>
        </article>`
    )
    .join("");
  const evidence = plan.evidenceContract
    .map(
      (item) => `
        <article class="${item.rejectIfMissing ? "fail" : "watch"}">
          <span>${escapeHtml(item.rejectIfMissing ? "required" : "review")}</span>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.required)}</p>
        </article>`
    )
    .join("");
  const stopRules = plan.stopRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(plan.headline)}</title>
    <style>
      :root { color: #172126; background: #edf2f4; font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-width: 320px; }
      a { color: inherit; }
      header, main, footer { width: min(1180px, calc(100vw - 28px)); margin: 0 auto; }
      header { margin-top: 14px; padding: 24px; border: 1px solid #172126; border-radius: 8px; color: #fffdf7; background: linear-gradient(120deg, #102226, #274c77 54%, #0f766e); }
      .eyebrow, article span { color: #b8efd4; font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      h1 { max-width: 850px; margin: 7px 0 0; font-size: clamp(2.15rem, 5vw, 4.5rem); line-height: .93; letter-spacing: 0; }
      header p { max-width: 840px; color: rgba(255,253,247,.84); line-height: 1.55; }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
      nav a { min-height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 8px 12px; color: #102226; background: #fffdf7; font-size: .82rem; font-weight: 950; text-decoration: none; }
      .metrics, .steps, .evidence { display: grid; gap: 8px; margin: 14px 0; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .steps { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .evidence { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      article, pre, .stop-rules, .payload { min-width: 0; padding: 14px; border: 1px solid #c8d4d7; border-radius: 8px; background: #fffdf7; }
      .metrics strong { display: block; margin-top: 6px; font-size: 1.45rem; line-height: 1; overflow-wrap: anywhere; }
      article.pass { border-top: 5px solid #0f766e; background: #eefaf4; }
      article.watch { border-top: 5px solid #f2b84b; background: #fff8e6; }
      article.fail { border-top: 5px solid #b56576; background: #fff1f2; }
      article div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      article h2, article strong, article p, article small { overflow-wrap: anywhere; }
      article h2 { margin: 10px 0 0; font-size: 1.05rem; line-height: 1.12; }
      article p, article small, footer, li { color: #52645f; line-height: 1.42; }
      pre { margin: 10px 0 0; overflow-x: auto; white-space: pre-wrap; color: #263238; }
      .stop-rules ul { margin: 8px 0 0; padding-left: 20px; }
      @media (max-width: 900px) { .metrics, .steps, .evidence { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 560px) { header { padding: 16px; } .metrics, .steps, .evidence { grid-template-columns: 1fr; } nav a { width: 100%; } }
    </style>
  </head>
  <body>
    <header>
      <span class="eyebrow">Agent Card Trial Plan</span>
      <h1>${escapeHtml(plan.headline)}</h1>
      <p>${escapeHtml(plan.buyerLine)}</p>
      <nav><a href="${escapeHtml(links.jsonUrl)}">JSON</a><a href="${escapeHtml(links.markdownUrl)}">Markdown</a><a href="${escapeHtml(links.diligenceUrl)}">Diligence</a>${links.verificationUrl ? `<a href="${escapeHtml(links.verificationUrl)}">Sample verification</a>` : ""}<a href="${escapeHtml(links.appUrl)}">Open app</a></nav>
    </header>
    <main>
      <section class="metrics" aria-label="Trial plan metrics">
        <article><span>Readiness</span><strong>${escapeHtml(plan.readiness)}</strong></article>
        <article><span>Score</span><strong>${escapeHtml(plan.trialScore)}</strong></article>
        <article><span>Skill</span><strong>${escapeHtml(plan.skillId)}</strong></article>
        <article><span>Receipt</span><strong>${escapeHtml(plan.receiptId)}</strong></article>
      </section>
      <section class="steps" aria-label="Trial steps">${steps}</section>
      <section class="evidence" aria-label="Evidence contract">${evidence}</section>
      <section class="stop-rules" aria-label="Stop rules"><strong>Stop rules</strong><ul>${stopRules}</ul></section>
      <section class="payload" aria-label="JSON-RPC trial payload"><strong>JSON-RPC trial payload</strong><pre>${escapeHtml(JSON.stringify(plan.jsonRpcPayload, null, 2))}</pre></section>
    </main>
    <footer>Plan id ${escapeHtml(plan.id)} checked at ${escapeHtml(plan.checkedAt)}. Source ${escapeHtml(plan.sourceUrl)}</footer>
  </body>
</html>`;
}
