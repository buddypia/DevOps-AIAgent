import { createHash } from "node:crypto";
import { type AgentCardTrialPlan, runAgentCardTrialPlan } from "./agentCardTrialPlan.js";

export const AGENT_CARD_TRIAL_VERIFICATION_SKILL_ID = "agent-card.trial-verification";

export type AgentCardTrialVerificationStatus = "accepted" | "needs-evidence" | "failed";
export type AgentCardTrialVerificationCheckStatus = "pass" | "watch" | "fail";

export type AgentCardTrialVerificationCheck = {
  id: string;
  label: string;
  status: AgentCardTrialVerificationCheckStatus;
  required: boolean;
  evidence: string;
  action: string;
};

export type AgentCardTrialVerification = {
  id: string;
  checkedAt: string;
  sourceUrl: string;
  planId: string;
  planReadiness: AgentCardTrialPlan["readiness"];
  status: AgentCardTrialVerificationStatus;
  score: number;
  headline: string;
  buyerLine: string;
  agentName: string;
  skillId: string;
  expectedReceiptId: string;
  returnedReceiptId?: string;
  artifactUrl?: string;
  evidenceSource?: string;
  checks: AgentCardTrialVerificationCheck[];
  missingEvidence: string[];
  unsafeSignals: string[];
  nextActions: string[];
  parsedResponse: Record<string, unknown> | null;
  parseError?: string;
  exportMarkdown: string;
};

type TrialPlanDeps = Parameters<typeof runAgentCardTrialPlan>[1];
type JsonRecord = Record<string, unknown>;

function escapeHtml(value: string | number | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseResponse(rawResponse: unknown): { response: JsonRecord | null; error?: string } {
  if (typeof rawResponse === "string") {
    try {
      const parsed = JSON.parse(rawResponse) as unknown;
      return isRecord(parsed) ? { response: parsed } : { response: null, error: "Response JSON must be an object." };
    } catch (error) {
      return { response: null, error: error instanceof Error ? error.message : "Response JSON could not be parsed." };
    }
  }
  return isRecord(rawResponse) ? { response: rawResponse } : { response: null, error: "Response must be a JSON object or JSON string." };
}

function valueAtPath(record: unknown, path: string[]) {
  let current = record;
  for (const part of path) {
    if (Array.isArray(current) && /^\d+$/.test(part)) {
      current = current[Number(part)];
    } else if (isRecord(current)) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function candidateRecords(response: JsonRecord | null) {
  if (!response) return [];
  const candidates: JsonRecord[] = [response];
  const paths = [
    ["data"],
    ["result"],
    ["result", "data"],
    ["result", "receipt"],
    ["result", "artifact"],
    ["result", "artifacts", "0", "parts", "0", "data"],
    ["artifact"],
    ["receipt"]
  ];
  for (const path of paths) {
    const value = valueAtPath(response, path);
    if (isRecord(value)) candidates.push(value);
  }
  return candidates;
}

function stringAt(candidates: JsonRecord[], paths: string[][]) {
  for (const candidate of candidates) {
    for (const path of paths) {
      const value = valueAtPath(candidate, path);
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number") return String(value);
    }
  }
  return undefined;
}

function valueFrom(candidates: JsonRecord[], paths: string[][]) {
  for (const candidate of candidates) {
    for (const path of paths) {
      const value = valueAtPath(candidate, path);
      if (typeof value !== "undefined") return value;
    }
  }
  return undefined;
}

function booleanFlag(candidates: JsonRecord[], key: string) {
  const value = valueFrom(candidates, [
    [key],
    ["safety", key],
    ["metadata", key],
    ["result", key],
    ["result", "safety", key],
    ["result", "metadata", key]
  ]);
  return typeof value === "boolean" ? value : undefined;
}

function isPublicHttpsUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      host !== "localhost" &&
      host !== "127.0.0.1" &&
      host !== "0.0.0.0" &&
      !host.endsWith(".local")
    );
  } catch {
    return false;
  }
}

function statusIsComplete(value: string | undefined) {
  return /^(accepted|complete|completed|done|pass|passed|success|succeeded)$/i.test(value ?? "");
}

function statusIsFailure(value: string | undefined) {
  return /^(blocked|error|fail|failed|rejected|requires-credentials|credential-required)$/i.test(value ?? "");
}

function acceptanceCount(value: unknown) {
  if (Array.isArray(value)) return value.length;
  if (isRecord(value)) return Object.keys(value).length;
  if (typeof value === "string" && value.trim()) return 1;
  return 0;
}

function check(
  id: string,
  label: string,
  status: AgentCardTrialVerificationCheckStatus,
  required: boolean,
  evidence: string,
  action: string
): AgentCardTrialVerificationCheck {
  return { id, label, status, required, evidence, action };
}

function scoreFor(checks: AgentCardTrialVerificationCheck[], status: AgentCardTrialVerificationStatus) {
  const max = checks.reduce((sum, item) => sum + (item.required ? 2 : 1), 0);
  const earned = checks.reduce((sum, item) => {
    const weight = item.required ? 2 : 1;
    if (item.status === "pass") return sum + weight;
    if (item.status === "watch") return sum + weight * 0.45;
    return sum;
  }, 0);
  const raw = Math.round((earned / max) * 100);
  if (status === "failed") return Math.min(raw, 49);
  if (status === "needs-evidence") return Math.min(raw, 84);
  return raw;
}

function headlineFor(status: AgentCardTrialVerificationStatus, plan: AgentCardTrialPlan) {
  if (status === "accepted") return `Trial response accepted for ${plan.agentName}`;
  if (status === "needs-evidence") return `Trial response for ${plan.agentName} needs evidence`;
  return `Trial response failed verification for ${plan.agentName}`;
}

function buyerLineFor(status: AgentCardTrialVerificationStatus) {
  if (status === "accepted") {
    return "A buyer can attach this receipt to the trial packet because the response matches the plan and includes public evidence.";
  }
  if (status === "needs-evidence") {
    return "Keep this out of buyer-facing packets until the missing receipt, artifact, evidence source, or safety confirmation is supplied.";
  }
  return "Do not attach this response to a buyer packet; a required identity, status, artifact, or safety check failed.";
}

function buildMarkdown(verification: Omit<AgentCardTrialVerification, "exportMarkdown">) {
  return [
    `# ${verification.headline}`,
    "",
    `- Status: ${verification.status}`,
    `- Score: ${verification.score}/100`,
    `- Agent: ${verification.agentName}`,
    `- Skill: ${verification.skillId}`,
    `- Expected receipt: ${verification.expectedReceiptId}`,
    verification.returnedReceiptId ? `- Returned receipt: ${verification.returnedReceiptId}` : "- Returned receipt: missing",
    verification.artifactUrl ? `- Artifact: ${verification.artifactUrl}` : "- Artifact: missing",
    verification.evidenceSource ? `- Evidence source: ${verification.evidenceSource}` : "- Evidence source: missing",
    "",
    verification.buyerLine,
    "",
    "## Checks",
    ...verification.checks.map((item) => `- [${item.status}] ${item.label}: ${item.evidence}`),
    "",
    "## Next actions",
    ...verification.nextActions.map((action) => `- ${action}`),
    "",
    "## Parsed response",
    "```json",
    JSON.stringify(verification.parsedResponse, null, 2),
    "```"
  ].join("\n");
}

export function sampleTrialResponseFor(plan: AgentCardTrialPlan) {
  return {
    receiptId: plan.receiptId,
    skillId: plan.skillId,
    status: "completed",
    artifactUrl: `https://storage.googleapis.com/a2a-agent-marketplace-proof/agent-card-trials/${plan.id}.json`,
    evidenceSource: "Public Agent Card diligence report and generated A2A trial payload",
    acceptance: plan.acceptance,
    requiresCredentials: false,
    privateUrl: false,
    mutatedProduction: false,
    destructiveAction: false
  };
}

export function buildAgentCardTrialVerification(
  plan: AgentCardTrialPlan,
  rawResponse: unknown,
  checkedAt = new Date().toISOString()
): AgentCardTrialVerification {
  const parsed = parseResponse(rawResponse);
  const candidates = candidateRecords(parsed.response);
  const returnedReceiptId = stringAt(candidates, [["receiptId"], ["receipt", "id"], ["metadata", "receiptId"], ["params", "metadata", "receiptId"]]);
  const returnedSkillId = stringAt(candidates, [["skillId"], ["metadata", "skillId"], ["params", "skillId"], ["params", "metadata", "skillId"]]);
  const responseStatus = stringAt(candidates, [["status"], ["state"], ["outcome"], ["metadata", "status"]]);
  const artifactUrl = stringAt(candidates, [["artifactUrl"], ["artifact", "url"], ["metadata", "artifactUrl"], ["url"]]);
  const evidenceSource = stringAt(candidates, [["evidenceSource"], ["evidence", "source"], ["metadata", "evidenceSource"], ["source"]]);
  const acceptance = valueFrom(candidates, [["acceptance"], ["acceptanceResults"], ["results", "acceptance"], ["metadata", "acceptance"]]);
  const flags = {
    requiresCredentials: booleanFlag(candidates, "requiresCredentials"),
    privateUrl: booleanFlag(candidates, "privateUrl"),
    mutatedProduction: booleanFlag(candidates, "mutatedProduction"),
    destructiveAction: booleanFlag(candidates, "destructiveAction")
  };
  const unsafeSignals = Object.entries(flags)
    .filter(([, value]) => value === true)
    .map(([key]) => key);
  const missingSafetyFlags = Object.entries(flags)
    .filter(([, value]) => typeof value === "undefined")
    .map(([key]) => key);
  const acceptanceItems = acceptanceCount(acceptance);
  const checks = [
    check(
      "plan-readiness",
      "Trial plan readiness",
      plan.readiness === "blocked" ? "fail" : "pass",
      true,
      plan.readiness === "blocked" ? "The underlying Agent Card diligence blocked this trial plan." : `Plan readiness is ${plan.readiness}.`,
      "Repair the Agent Card diligence findings before verifying a response."
    ),
    check(
      "parse-json",
      "Parseable response JSON",
      parsed.response ? "pass" : "fail",
      true,
      parsed.response ? "Response is parseable JSON." : parsed.error ?? "Response could not be parsed.",
      "Return a JSON object or a string containing one JSON object."
    ),
    check(
      "receipt-id",
      "Receipt id",
      returnedReceiptId === plan.receiptId ? "pass" : returnedReceiptId ? "fail" : "watch",
      true,
      returnedReceiptId ? `Returned ${returnedReceiptId}; expected ${plan.receiptId}.` : `Expected ${plan.receiptId}, but no receiptId was returned.`,
      "Return the generated receiptId unchanged."
    ),
    check(
      "skill-id",
      "Skill id",
      returnedSkillId === plan.skillId ? "pass" : returnedSkillId ? "fail" : "watch",
      true,
      returnedSkillId ? `Returned ${returnedSkillId}; expected ${plan.skillId}.` : `Expected ${plan.skillId}, but no skillId was returned.`,
      "Return the generated skillId unchanged."
    ),
    check(
      "completion-status",
      "Completion status",
      statusIsComplete(responseStatus) ? "pass" : statusIsFailure(responseStatus) ? "fail" : "watch",
      true,
      responseStatus ? `Returned status ${responseStatus}.` : "No completion status was returned.",
      "Return status completed, accepted, passed, or success after the bounded task finishes."
    ),
    check(
      "artifact-url",
      "Public artifact URL",
      isPublicHttpsUrl(artifactUrl) ? "pass" : artifactUrl ? "fail" : "watch",
      true,
      artifactUrl ? `Returned artifact URL ${artifactUrl}.` : "No artifactUrl was returned.",
      "Return a public HTTPS artifactUrl that does not require credentials."
    ),
    check(
      "evidence-source",
      "Evidence source",
      evidenceSource ? "pass" : "watch",
      true,
      evidenceSource ? evidenceSource : "No evidenceSource was returned.",
      "Name the log, receipt, public endpoint, or check used as evidence."
    ),
    check(
      "acceptance",
      "Acceptance mapping",
      acceptanceItems >= plan.acceptance.length ? "pass" : acceptanceItems > 0 ? "watch" : "watch",
      false,
      acceptanceItems ? `Mapped ${acceptanceItems}/${plan.acceptance.length} acceptance criteria.` : "No acceptance mapping was returned.",
      "Map each acceptance criterion to a result before treating the receipt as final."
    ),
    check(
      "safety-boundary",
      "Safety boundary",
      unsafeSignals.length ? "fail" : missingSafetyFlags.length ? "watch" : "pass",
      true,
      unsafeSignals.length
        ? `Unsafe flags were true: ${unsafeSignals.join(", ")}.`
        : missingSafetyFlags.length
          ? `Missing safety flags: ${missingSafetyFlags.join(", ")}.`
          : "Response confirms no credentials, private URL, destructive action, or production mutation was required.",
      "Return requiresCredentials, privateUrl, mutatedProduction, and destructiveAction as false."
    )
  ];
  const hasRequiredFailure = checks.some((item) => item.required && item.status === "fail");
  const hasRequiredWatch = checks.some((item) => item.required && item.status === "watch");
  const status: AgentCardTrialVerificationStatus = hasRequiredFailure ? "failed" : hasRequiredWatch ? "needs-evidence" : "accepted";
  const missingEvidence = checks.filter((item) => item.required && item.status === "watch").map((item) => item.label);
  const nextActions =
    status === "accepted"
      ? ["Attach the verification JSON or Markdown to the buyer packet.", "Keep the trial artifact URL public for reviewer inspection."]
      : checks
          .filter((item) => item.required && item.status !== "pass")
          .map((item) => item.action)
          .filter((action, index, actions) => actions.indexOf(action) === index);
  const withoutMarkdown = {
    id: "",
    checkedAt,
    sourceUrl: plan.sourceUrl,
    planId: plan.id,
    planReadiness: plan.readiness,
    status,
    score: scoreFor(checks, status),
    headline: headlineFor(status, plan),
    buyerLine: buyerLineFor(status),
    agentName: plan.agentName,
    skillId: plan.skillId,
    expectedReceiptId: plan.receiptId,
    returnedReceiptId,
    artifactUrl,
    evidenceSource,
    checks,
    missingEvidence,
    unsafeSignals,
    nextActions,
    parsedResponse: parsed.response,
    parseError: parsed.error
  };
  const withId = {
    ...withoutMarkdown,
    id: createHash("sha256")
      .update(JSON.stringify({ checkedAt, planId: plan.id, status, returnedReceiptId, artifactUrl }))
      .digest("hex")
      .slice(0, 16)
  };
  return {
    ...withId,
    exportMarkdown: buildMarkdown(withId)
  };
}

export async function runAgentCardTrialVerification(sourceUrl: string, rawResponse: unknown, deps: TrialPlanDeps = {}) {
  return buildAgentCardTrialVerification(await runAgentCardTrialPlan(sourceUrl, deps), rawResponse);
}

export function renderAgentCardTrialVerificationHtml(
  verification: AgentCardTrialVerification,
  links: { jsonUrl: string; markdownUrl: string; trialPlanUrl: string; diligenceUrl: string; appUrl: string; handoffUrl?: string }
) {
  const checkCards = verification.checks
    .map(
      (item) => `
        <article class="${escapeHtml(item.status)}">
          <div><span>${escapeHtml(item.required ? "required" : "review")}</span><strong>${escapeHtml(item.status)}</strong></div>
          <h2>${escapeHtml(item.label)}</h2>
          <p>${escapeHtml(item.evidence)}</p>
          <small>${escapeHtml(item.action)}</small>
        </article>`
    )
    .join("");
  const actions = verification.nextActions.map((action) => `<li>${escapeHtml(action)}</li>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(verification.headline)}</title>
    <style>
      :root { color: #162022; background: #edf2f4; font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-width: 320px; }
      a { color: inherit; }
      header, main, footer { width: min(1180px, calc(100vw - 28px)); margin: 0 auto; }
      header { margin-top: 14px; padding: 24px; border: 1px solid #162022; border-radius: 8px; color: #fffdf7; background: linear-gradient(120deg, #11292e, #2f4858 52%, #0f766e); }
      .eyebrow, article span { color: #b8efd4; font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      h1 { max-width: 860px; margin: 7px 0 0; font-size: clamp(2.15rem, 5vw, 4.5rem); line-height: .93; letter-spacing: 0; }
      header p { max-width: 840px; color: rgba(255,253,247,.84); line-height: 1.55; }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
      nav a { min-height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 8px 12px; color: #102226; background: #fffdf7; font-size: .82rem; font-weight: 950; text-decoration: none; }
      .metrics, .checks { display: grid; gap: 8px; margin: 14px 0; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .checks { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      article, pre, .actions { min-width: 0; padding: 14px; border: 1px solid #c8d4d7; border-radius: 8px; background: #fffdf7; }
      .metrics strong { display: block; margin-top: 6px; font-size: 1.45rem; line-height: 1; overflow-wrap: anywhere; }
      article.pass { border-top: 5px solid #0f766e; background: #eefaf4; }
      article.watch { border-top: 5px solid #f2b84b; background: #fff8e6; }
      article.fail { border-top: 5px solid #b56576; background: #fff1f2; }
      article div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      article h2, article strong, article p, article small { overflow-wrap: anywhere; }
      article h2 { margin: 10px 0 0; font-size: 1.05rem; line-height: 1.12; }
      article p, article small, footer, li { color: #52645f; line-height: 1.42; }
      pre { margin: 10px 0 0; overflow-x: auto; white-space: pre-wrap; color: #263238; }
      .actions ul { margin: 8px 0 0; padding-left: 20px; }
      @media (max-width: 900px) { .metrics, .checks { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 560px) { header { padding: 16px; } .metrics, .checks { grid-template-columns: 1fr; } nav a { width: 100%; } }
    </style>
  </head>
  <body>
    <header>
      <span class="eyebrow">Agent Card Trial Verification</span>
      <h1>${escapeHtml(verification.headline)}</h1>
      <p>${escapeHtml(verification.buyerLine)}</p>
      <nav><a href="${escapeHtml(links.jsonUrl)}">JSON</a><a href="${escapeHtml(links.markdownUrl)}">Markdown</a><a href="${escapeHtml(links.trialPlanUrl)}">Trial plan</a><a href="${escapeHtml(links.diligenceUrl)}">Diligence</a>${links.handoffUrl ? `<a href="${escapeHtml(links.handoffUrl)}">Handoff</a>` : ""}<a href="${escapeHtml(links.appUrl)}">Open app</a></nav>
    </header>
    <main>
      <section class="metrics" aria-label="Trial verification metrics">
        <article><span>Status</span><strong>${escapeHtml(verification.status)}</strong></article>
        <article><span>Score</span><strong>${escapeHtml(verification.score)}</strong></article>
        <article><span>Skill</span><strong>${escapeHtml(verification.skillId)}</strong></article>
        <article><span>Receipt</span><strong>${escapeHtml(verification.expectedReceiptId)}</strong></article>
      </section>
      <section class="checks" aria-label="Verification checks">${checkCards}</section>
      <section class="actions" aria-label="Next actions"><strong>Next actions</strong><ul>${actions}</ul></section>
      <section aria-label="Parsed trial response"><strong>Parsed trial response</strong><pre>${escapeHtml(JSON.stringify(verification.parsedResponse, null, 2))}</pre></section>
    </main>
    <footer>Verification id ${escapeHtml(verification.id)} checked at ${escapeHtml(verification.checkedAt)}. Source ${escapeHtml(verification.sourceUrl)}</footer>
  </body>
</html>`;
}
