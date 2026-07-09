import { normalizeAgentCardDiscoveryUrl } from "./agentCardDiscovery.js";
import type { MarketAgent } from "./types.js";

export type AgentCardAssessmentStatus = "pass" | "watch" | "fail";
export type AgentCardAssessmentReadiness = "hire-ready" | "trial-first" | "blocked";

export type AgentCardAssessmentCheck = {
  id: string;
  label: string;
  status: AgentCardAssessmentStatus;
  evidence: string;
};

export type AgentCardTrialTask = {
  method: "message/send";
  skillId: string;
  objective: string;
  acceptance: string[];
  payload: Record<string, unknown>;
};

export type AgentCardAssessment = {
  score: number;
  readiness: AgentCardAssessmentReadiness;
  riskLevel: "low" | "medium" | "high";
  headline: string;
  checks: AgentCardAssessmentCheck[];
  redFlags: string[];
  nextActions: string[];
  trialTask: AgentCardTrialTask;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function statusScore(status: AgentCardAssessmentStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 62;
  return 20;
}

function check(input: AgentCardAssessmentCheck): AgentCardAssessmentCheck {
  return input;
}

function providerName(card: Record<string, unknown>) {
  const provider = asRecord(card.provider);
  return safeText(provider.organization) || safeText(provider.name) || safeText(card.name);
}

function publicUrlStatus(card: Record<string, unknown>, sourceUrl?: string): AgentCardAssessmentCheck {
  const candidate = safeText(card.url) || safeText(sourceUrl);
  const normalized = candidate ? normalizeAgentCardDiscoveryUrl(candidate) : null;
  if (!candidate) {
    return check({
      id: "public-url",
      label: "Public Agent Card URL",
      status: "fail",
      evidence: "No card.url or discovery URL was available."
    });
  }
  if (!normalized?.ok) {
    return check({
      id: "public-url",
      label: "Public Agent Card URL",
      status: "fail",
      evidence: normalized?.error ?? "The Agent Card URL could not be normalized."
    });
  }
  return check({
    id: "public-url",
    label: "Public Agent Card URL",
    status: normalized.warnings.length > 0 ? "watch" : "pass",
    evidence: normalized.warnings[0] ?? normalized.url
  });
}

function providerStatus(card: Record<string, unknown>) {
  const name = providerName(card);
  return check({
    id: "provider",
    label: "Provider identity",
    status: name ? "pass" : "watch",
    evidence: name ? `Provider identified as ${name}.` : "Provider metadata is missing."
  });
}

function skillStatus(card: Record<string, unknown>, agent: MarketAgent) {
  const declared = asArray(card.skills).length;
  const normalized = agent.skills.length;
  return check({
    id: "skills",
    label: "Callable skills",
    status: declared >= 2 || normalized >= 2 ? "pass" : normalized >= 1 ? "watch" : "fail",
    evidence: `${normalized} usable skills normalized from ${declared} declared skills.`
  });
}

function a2aStatus(agent: MarketAgent) {
  const qualified = agent.a2aSkillIds.filter((id) => id.includes("."));
  return check({
    id: "a2a",
    label: "A2A skill contract",
    status: qualified.length > 0 ? "pass" : agent.a2aSkillIds.length > 0 ? "watch" : "fail",
    evidence: qualified.length > 0 ? `${qualified.slice(0, 3).join(" / ")} are addressable skill ids.` : "Skill ids are present but not clearly namespaced."
  });
}

function ioModeStatus(card: Record<string, unknown>) {
  const inputs = asArray(card.defaultInputModes);
  const outputs = asArray(card.defaultOutputModes);
  const hasBoth = inputs.length > 0 && outputs.length > 0;
  return check({
    id: "io-modes",
    label: "Input and output modes",
    status: hasBoth ? "pass" : inputs.length > 0 || outputs.length > 0 ? "watch" : "watch",
    evidence: hasBoth ? `${inputs.join(", ")} -> ${outputs.join(", ")}` : "Input/output modes are not fully declared."
  });
}

function toolStatus(card: Record<string, unknown>, agent: MarketAgent) {
  const topLevelTools = asArray(card.tools).length;
  const mcpTools = agent.mcp.flatMap((mcp) => mcp.tools).length;
  return check({
    id: "tools",
    label: "Tool evidence",
    status: topLevelTools + mcpTools >= 2 ? "pass" : topLevelTools + mcpTools >= 1 ? "watch" : "fail",
    evidence: `${topLevelTools + mcpTools} tools are visible across Agent Card and MCP metadata.`
  });
}

function capabilityStatus(agent: MarketAgent) {
  const relevant = [agent.capabilities.a2a, agent.capabilities.mcp, agent.capabilities.security, agent.capabilities.testing, agent.capabilities.observability];
  const average = Math.round(relevant.reduce((sum, value) => sum + value, 0) / relevant.length);
  return check({
    id: "capability-balance",
    label: "Marketplace capability balance",
    status: average >= 72 ? "pass" : average >= 58 ? "watch" : "fail",
    evidence: `A2A/MCP/security/testing/observability average is ${average}/100.`
  });
}

function readinessFrom(score: number, failedChecks: number): AgentCardAssessmentReadiness {
  if (failedChecks > 0 || score < 55) return "blocked";
  if (score >= 82) return "hire-ready";
  return "trial-first";
}

function headlineFor(readiness: AgentCardAssessmentReadiness) {
  if (readiness === "hire-ready") return "This Agent Card is strong enough for a supervised pilot";
  if (readiness === "trial-first") return "This Agent Card needs a small proof task before hiring";
  return "This Agent Card should not be hired until the gaps are fixed";
}

function trialTaskFor(agent: MarketAgent, readiness: AgentCardAssessmentReadiness): AgentCardTrialTask {
  const skillId = agent.a2aSkillIds[0] ?? agent.skills[0]?.id ?? "task.delegate";
  return {
    method: "message/send",
    skillId,
    objective:
      readiness === "hire-ready"
        ? `Run a 30-minute proof task with ${agent.name} before adding it to a buyer-facing squad.`
        : `Ask ${agent.name} to prove one narrow capability before treating it as production-ready.`,
    acceptance: [
      "Return a concrete artifact URL or JSON receipt.",
      "Name the evidence source used for every claim.",
      "Stop instead of executing if credentials, private URLs, or unclear permissions are required."
    ],
    payload: {
      agentId: agent.id,
      skillId,
      requestedArtifact: "capability-proof-receipt",
      safetyBoundary: "No credentials, private network calls, or destructive actions in the trial."
    }
  };
}

export function buildAgentCardAssessment(input: { card: unknown; agent: MarketAgent; sourceUrl?: string }): AgentCardAssessment {
  const card = asRecord(input.card);
  const checks = [
    publicUrlStatus(card, input.sourceUrl),
    providerStatus(card),
    skillStatus(card, input.agent),
    a2aStatus(input.agent),
    ioModeStatus(card),
    toolStatus(card, input.agent),
    capabilityStatus(input.agent)
  ];
  const score = Math.round(checks.reduce((sum, item) => sum + statusScore(item.status), 0) / checks.length);
  const failedChecks = checks.filter((item) => item.status === "fail").length;
  const watchChecks = checks.filter((item) => item.status === "watch").length;
  const readiness = readinessFrom(score, failedChecks);
  const redFlags = checks.filter((item) => item.status === "fail").map((item) => `${item.label}: ${item.evidence}`);
  const nextActions = [
    ...checks.filter((item) => item.status === "watch").map((item) => `Tighten ${item.label}: ${item.evidence}`),
    readiness === "hire-ready" ? "Run the generated trial task and attach the receipt to the buyer workspace." : "Resolve failed checks before sharing this agent with a sponsor."
  ].slice(0, 4);

  return {
    score,
    readiness,
    riskLevel: failedChecks > 0 ? "high" : watchChecks > 1 ? "medium" : "low",
    headline: headlineFor(readiness),
    checks,
    redFlags,
    nextActions,
    trialTask: trialTaskFor(input.agent, readiness)
  };
}
