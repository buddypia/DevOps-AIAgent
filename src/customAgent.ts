import { buildAgentCardAssessment, type AgentCardAssessment } from "./agentCardAssessment.js";
import { CAPABILITY_LABELS, MARKET_AGENTS } from "./market.js";
import type { AgentSkill, AgentStage, CapabilityKey, MarketAgent, McpCapability } from "./types.js";

export const MAX_CUSTOM_AGENTS = 3;
const CUSTOM_AGENT_PARAM_VERSION = 1;
const CAPABILITY_KEYS = Object.keys(CAPABILITY_LABELS) as CapabilityKey[];

export type AgentCardImportResult =
  | {
      status: "accepted";
      agent: MarketAgent;
      assessment: AgentCardAssessment;
      warnings: string[];
      signals: string[];
      sourceUrl?: string;
    }
  | {
      status: "rejected";
      error: string;
      warnings: string[];
      signals: string[];
    };

const KEYWORDS: Record<CapabilityKey, string[]> = {
  autonomy: ["autonomy", "autonomous", "agent", "goal", "decision", "plan", "delegate", "自律", "判断", "委任"],
  planning: ["plan", "strategy", "roadmap", "research", "brief", "spec", "analysis", "企画", "戦略", "要件", "分析"],
  code: ["code", "develop", "implementation", "typescript", "python", "api", "build", "実装", "開発"],
  testing: ["test", "qa", "ci", "quality", "acceptance", "regression", "検証", "品質", "受入"],
  cloudRun: ["cloud run", "cloudrun", "gcp", "google cloud", "deploy", "container", "runtime", "デプロイ", "本番"],
  security: ["security", "secret", "auth", "privacy", "policy", "scan", "安全", "認証", "監査"],
  observability: ["log", "metric", "slo", "monitor", "observe", "incident", "telemetry", "ログ", "監視", "運用"],
  ux: ["ux", "ui", "design", "usability", "onboarding", "workflow", "画面", "体験", "導線"],
  mcp: ["mcp", "tool", "tools", "connector", "server", "integration", "ツール", "連携"],
  a2a: ["a2a", "agent card", "message/send", "skill", "delegate", "handoff", "agent-to-agent", "委任"]
};

const STAGE_BY_CAPABILITY: Partial<Record<CapabilityKey, AgentStage>> = {
  planning: "plan",
  autonomy: "plan",
  code: "build",
  testing: "build",
  ux: "build",
  cloudRun: "deploy",
  observability: "operate",
  security: "govern",
  mcp: "govern",
  a2a: "govern"
};

const COLOR_BY_STAGE: Record<AgentStage, { color: string; accent: string }> = {
  plan: { color: "#315a7d", accent: "#b8e0ff" },
  build: { color: "#7b4f9d", accent: "#ead7ff" },
  deploy: { color: "#1f6f9f", accent: "#bce7ff" },
  operate: { color: "#2b6659", accent: "#c7f4df" },
  govern: { color: "#6d4b22", accent: "#ffe2a8" }
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6) || "agent";
}

function slugify(value: string, fallback: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 34);
  return slug || fallback;
}

function compactId(value: string) {
  const id = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return id || "skill";
}

function countKeywordHits(text: string, keywords: string[]) {
  return keywords.reduce((sum, keyword) => (text.includes(keyword) ? sum + 1 : sum), 0);
}

function collectText(card: Record<string, unknown>) {
  const provider = asRecord(card.provider);
  const skills = asArray(card.skills);
  const tools = asArray(card.tools);
  return [
    safeText(card.name),
    safeText(card.description),
    safeText(card.url),
    safeText(provider.name),
    safeText(provider.organization),
    JSON.stringify(card.capabilities ?? {}),
    JSON.stringify(skills),
    JSON.stringify(tools),
    JSON.stringify(card.mcp ?? {})
  ]
    .join(" ")
    .toLowerCase();
}

function normalizeSkill(raw: unknown, index: number, fallbackName: string): AgentSkill {
  const item = asRecord(raw);
  const label = safeText(item.name) || safeText(item.label) || safeText(item.id) || `${fallbackName} skill ${index + 1}`;
  const proof = safeText(item.description) || safeText(item.proof) || asArray(item.tags).map((tag) => safeText(tag)).filter(Boolean).join(" / ") || "Imported from Agent Card skill metadata.";
  const text = `${label} ${proof}`.toLowerCase();
  const strongestHits = Math.max(...CAPABILITY_KEYS.map((key) => countKeywordHits(text, KEYWORDS[key])));
  return {
    id: compactId(safeText(item.id) || label),
    label: label.slice(0, 70),
    proof: proof.slice(0, 160),
    score: Math.round(clamp(68 + strongestHits * 7, 62, 96))
  };
}

function extractTools(card: Record<string, unknown>, skills: AgentSkill[]) {
  const mcp = asRecord(card.mcp);
  const topLevelTools = asArray(card.tools).map((tool) => safeText(asRecord(tool).name) || safeText(tool)).filter(Boolean);
  const mcpTools = asArray(mcp.tools).map((tool) => safeText(tool)).filter(Boolean);
  const skillTools = skills.map((skill) => skill.id).filter(Boolean);
  return [...new Set([...topLevelTools, ...mcpTools, ...skillTools])].slice(0, 6);
}

function scoreCapabilities(input: { card: Record<string, unknown>; text: string; skillCount: number; toolCount: number }) {
  const declared = JSON.stringify(input.card.capabilities ?? {}).toLowerCase();
  const scores = {} as Record<CapabilityKey, number>;

  for (const key of CAPABILITY_KEYS) {
    const keywordHits = countKeywordHits(input.text, KEYWORDS[key]);
    const declaredHit = declared.includes(key.toLowerCase()) || KEYWORDS[key].some((keyword) => declared.includes(keyword));
    const infrastructureBonus = key === "a2a" && input.skillCount > 0 ? 8 : key === "mcp" && input.toolCount > 0 ? 10 : 0;
    scores[key] = Math.round(clamp(42 + keywordHits * 9 + (declaredHit ? 14 : 0) + infrastructureBonus + Math.min(input.skillCount, 4) * 2, 36, 96));
  }

  return scores;
}

function stageFromCapabilities(capabilities: Record<CapabilityKey, number>): AgentStage {
  const [top] = CAPABILITY_KEYS.map((key) => ({ key, value: capabilities[key] })).sort((left, right) => right.value - left.value);
  return STAGE_BY_CAPABILITY[top?.key ?? "planning"] ?? "plan";
}

function rarityFrom(score: number): MarketAgent["rarity"] {
  if (score >= 86) return "legendary";
  if (score >= 76) return "epic";
  if (score >= 64) return "rare";
  return "common";
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildMcp(card: Record<string, unknown>, skills: AgentSkill[], maturity: number): McpCapability[] {
  const mcp = asRecord(card.mcp);
  const name = safeText(mcp.name) || safeText(card.url) || "imported-agent-card";
  const tools = extractTools(card, skills);
  return [
    {
      name: slugify(name, "imported-agent-card").slice(0, 48),
      tools: tools.length > 0 ? tools : skills.slice(0, 3).map((skill) => skill.id),
      maturity
    }
  ];
}

function signalsFrom(capabilities: Record<CapabilityKey, number>) {
  return CAPABILITY_KEYS.map((key) => ({ key, value: capabilities[key] }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 4)
    .map(({ key, value }) => `${CAPABILITY_LABELS[key]} ${value}`);
}

export function buildImportedAgentFromCard(raw: string, sourceUrl?: string): AgentCardImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      status: "rejected",
      error: "Agent Card JSON could not be parsed.",
      warnings: [],
      signals: []
    };
  }

  const card = asRecord(parsed);
  if (Object.keys(card).length === 0) {
    return {
      status: "rejected",
      error: "Agent Card must be a JSON object.",
      warnings: [],
      signals: []
    };
  }

  const name = safeText(card.name) || safeText(asRecord(card.provider).name) || "Imported Agent";
  const description = safeText(card.description);
  const rawSkills = asArray(card.skills);
  if (rawSkills.length === 0 && description.length < 20) {
    return {
      status: "rejected",
      error: "Agent Card needs a description or at least one skill.",
      warnings: ["No usable skill metadata was found."],
      signals: []
    };
  }

  const skills = (rawSkills.length > 0 ? rawSkills : [{ name: `${name} execution`, description }])
    .slice(0, 5)
    .map((skill, index) => normalizeSkill(skill, index, name));
  const toolCount = extractTools(card, skills).length;
  const text = collectText(card);
  const capabilities = scoreCapabilities({ card, text, skillCount: skills.length, toolCount });
  const stage = stageFromCapabilities(capabilities);
  const palette = COLOR_BY_STAGE[stage];
  const topCapabilityScore = Math.max(...CAPABILITY_KEYS.map((key) => capabilities[key]));
  const id = `custom-${slugify(name, "imported-agent")}-${stableHash(`${name}:${description}:${JSON.stringify(rawSkills)}`)}`;
  const a2aSkillIds = skills.map((skill) => skill.id).slice(0, 5);
  const topTags = CAPABILITY_KEYS.filter((key) => capabilities[key] >= 66).slice(0, 5);
  const averageCapability = average(CAPABILITY_KEYS.map((key) => capabilities[key]));
  const warnings = [
    !safeText(card.url) && !sourceUrl ? "No public Agent Card URL was included." : "",
    toolCount === 0 ? "No tool or MCP metadata was included." : ""
  ].filter(Boolean);

  const agent: MarketAgent = {
    id,
    name: name.slice(0, 80),
    handle: safeText(asRecord(card.provider).organization) || "Imported Agent Card",
    stage,
    rarity: rarityFrom(averageCapability),
    price: Math.round(clamp(18 + averageCapability * 0.28 + skills.length * 2, 20, 55)),
    headline: (description || `${name} imported from an Agent Card.`).slice(0, 110),
    outcome: (safeText(card.documentationUrl) || description || "Imported agent can be evaluated, hired, and included in the buyer workspace.").slice(0, 130),
    color: palette.color,
    accent: palette.accent,
    capabilities,
    skills,
    mcp: buildMcp(card, skills, Math.round(clamp(capabilities.mcp + toolCount * 2, 40, 96))),
    a2aSkillIds,
    synergyTags: [...new Set(["custom", "agent-card", ...topTags, ...a2aSkillIds.map((id) => id.split(".")[0])])].slice(0, 8)
  };

  return {
    status: "accepted",
    agent,
    assessment: buildAgentCardAssessment({ card, agent, sourceUrl: safeText(card.url) || sourceUrl }),
    warnings,
    signals: [`top capability ${topCapabilityScore}`, `${skills.length} skills`, `${toolCount} tools`, ...signalsFrom(capabilities)],
    sourceUrl: safeText(card.url) || sourceUrl
  };
}

export function normalizeCustomAgents(value: unknown): MarketAgent[] {
  const baseIds = new Set(MARKET_AGENTS.map((agent) => agent.id));
  const seen = new Set<string>();
  const agents: MarketAgent[] = [];

  for (const raw of asArray(value)) {
    const candidate = asRecord(raw) as Partial<MarketAgent>;
    const id = safeText(candidate.id);
    const name = safeText(candidate.name);
    if (!id.startsWith("custom-") || !name || baseIds.has(id) || seen.has(id)) continue;
    const capabilities = {} as Record<CapabilityKey, number>;
    const rawCapabilities = asRecord(candidate.capabilities);
    for (const key of CAPABILITY_KEYS) {
      const value = Number(rawCapabilities[key]);
      capabilities[key] = Math.round(clamp(Number.isFinite(value) ? value : 42, 0, 100));
    }
    const stage = ["plan", "build", "deploy", "operate", "govern"].includes(String(candidate.stage)) ? (candidate.stage as AgentStage) : stageFromCapabilities(capabilities);
    const palette = COLOR_BY_STAGE[stage];
    const skills = asArray(candidate.skills).slice(0, 5).map((skill, index) => normalizeSkill(skill, index, name));
    const normalizedSkills =
      skills.length > 0 ? skills : [normalizeSkill({ name: `${name} execution`, description: "Imported Agent Card skill." }, 0, name)];
    const mcp = asArray(candidate.mcp).slice(0, 3).map((item) => {
      const row = asRecord(item);
      const tools = asArray(row.tools).map((tool) => safeText(tool)).filter(Boolean);
      return {
        name: safeText(row.name) || "imported-agent-card",
        tools: tools.length > 0 ? tools.slice(0, 6) : skills.slice(0, 3).map((skill) => skill.id),
        maturity: Math.round(clamp(Number(row.maturity) || capabilities.mcp, 0, 100))
      };
    });

    seen.add(id);
    agents.push({
      id,
      name: name.slice(0, 80),
      handle: safeText(candidate.handle) || "Imported Agent Card",
      stage,
      rarity: ["common", "rare", "epic", "legendary"].includes(String(candidate.rarity)) ? (candidate.rarity as MarketAgent["rarity"]) : rarityFrom(average(CAPABILITY_KEYS.map((key) => capabilities[key]))),
      price: Math.round(clamp(Number(candidate.price) || 28, 1, 99)),
      headline: safeText(candidate.headline, `${name} imported from an Agent Card.`).slice(0, 110),
      outcome: safeText(candidate.outcome, "Imported agent can be evaluated in this workspace.").slice(0, 130),
      color: safeText(candidate.color, palette.color),
      accent: safeText(candidate.accent, palette.accent),
      capabilities,
      skills: normalizedSkills,
      mcp: mcp.length > 0 ? mcp : buildMcp({}, normalizedSkills, capabilities.mcp),
      a2aSkillIds: asArray(candidate.a2aSkillIds).map((skill) => safeText(skill)).filter(Boolean).slice(0, 5),
      synergyTags: asArray(candidate.synergyTags).map((tag) => safeText(tag)).filter(Boolean).slice(0, 8)
    });
    if (agents.length >= MAX_CUSTOM_AGENTS) break;
  }

  return agents;
}

export function mergeAgentCatalog(customAgents: unknown, baseAgents: MarketAgent[] = MARKET_AGENTS) {
  const baseIds = new Set(baseAgents.map((agent) => agent.id));
  return [...baseAgents, ...normalizeCustomAgents(customAgents).filter((agent) => !baseIds.has(agent.id))];
}

function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeCustomAgentsParam(customAgents: unknown) {
  const payload = {
    version: CUSTOM_AGENT_PARAM_VERSION,
    agents: normalizeCustomAgents(customAgents)
  };
  return base64UrlEncode(JSON.stringify(payload));
}

export function decodeCustomAgentsParam(raw: string | null | undefined) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(base64UrlDecode(raw));
    return normalizeCustomAgents(asRecord(parsed).agents);
  } catch {
    return [];
  }
}
