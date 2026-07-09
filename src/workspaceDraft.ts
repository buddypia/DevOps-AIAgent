import { normalizeAgentTrialEvidenceRecords, type AgentTrialEvidenceRecord } from "./agentTrialEvidence.js";
import { DEFAULT_BUYER_WORK_ORDER_INPUT, normalizeBuyerWorkOrderInput, type BuyerWorkOrderInput } from "./buyerWorkOrder.js";
import { DEFAULT_BUYER_VALUE_SCENARIO, normalizeBuyerValueScenarioInput, type BuyerValueScenarioInput } from "./buyerValueScenario.js";
import { DEFAULT_BLUEPRINT_TEMPLATE, type BlueprintTemplate } from "./blueprintTemplates.js";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "./compressionCodec.js";
import { DEFAULT_PILOT_RUN_RECEIPT_INPUT, normalizePilotRunReceiptInput, type PilotRunReceiptInput } from "./pilotRunReceipt.js";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";
import type { AgentStage, CapabilityKey, MarketAgent } from "./types.js";

export const WORKSPACE_STORAGE_KEY = "a2a-agent-marketplace.workspace.v1";
export const WORKSPACE_SHARE_PARAM = "workspace";

const COMPRESSED_WORKSPACE_SHARE_PREFIX = "lz1.";

export type WorkspaceDraft = {
  version: 1;
  activeTemplateId: string;
  projectBrief: string;
  selectedAgentIds: string[];
  customAgents: MarketAgent[];
  agentTrialEvidence: AgentTrialEvidenceRecord[];
  buyerScenario: BuyerValueScenarioInput;
  pilotRun: PilotRunReceiptInput;
  buyerWorkOrder: BuyerWorkOrderInput;
  targetUrl: string;
  protopediaUrl: string;
  videoUrl: string;
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  updatedAt: string;
};

export type WorkspaceImportResult =
  | {
      status: "accepted";
      draft: WorkspaceDraft;
    }
  | {
      status: "rejected";
      reason: string;
    };

export type WorkspaceResumePacket = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  resumeUrl: string;
  proofAuditUrl: string;
  publicReviewUrl: string;
  updatedAt: string;
  headline: string;
  summary: string;
  publicReview: {
    status: "ready" | "watch" | "blocked";
    headline: string;
    summary: string;
    action: string;
    actionLabel: string;
  };
  proofHealth: {
    status: "ready" | "watch" | "blocked" | "missing";
    headline: string;
    summary: string;
    checkedAt: string | null;
    verifiedCount: number;
    totalCount: number;
    score: number;
    nextAction: string;
    nextActionLabel: string;
    openIssues: Array<{
      id: string;
      label: string;
      status: "watch" | "block";
      evidence: string;
      action: string;
      httpStatus?: number;
    }>;
  };
  included: Array<{
    id: "brief" | "agents" | "value" | "pilot" | "work-order" | "proof" | "trial-evidence";
    label: string;
    value: string;
    status: "ready" | "watch" | "missing";
  }>;
  missing: string[];
  restoreSteps: string[];
  markdown: string;
  markdownHref: string;
};

type WorkspaceDraftInput = {
  activeTemplateId: string;
  projectBrief: string;
  selectedAgentIds: string[];
  customAgents?: MarketAgent[];
  agentTrialEvidence?: AgentTrialEvidenceRecord[];
  buyerScenario: BuyerValueScenarioInput;
  pilotRun?: PilotRunReceiptInput;
  buyerWorkOrder?: BuyerWorkOrderInput;
  targetUrl: string;
  protopediaUrl: string;
  videoUrl: string;
  proofVerification?: BuyerShareGateProofVerificationSummary | null;
  updatedAt?: string;
};

const MAX_BRIEF_LENGTH = 20000;
const MAX_URL_LENGTH = 1000;
const MAX_CUSTOM_AGENTS = 3;
const MAX_PROOF_VERIFICATION_RESULTS = 10;
const CAPABILITY_KEYS: CapabilityKey[] = ["autonomy", "planning", "code", "testing", "cloudRun", "security", "observability", "ux", "mcp", "a2a"];
const STAGES: AgentStage[] = ["plan", "build", "deploy", "operate", "govern"];
const PROOF_STATUSES = ["pass", "watch", "block"] as const;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function safeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function safeRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function safeUrlText(value: unknown) {
  return safeString(value).trim().slice(0, MAX_URL_LENGTH);
}

function safeIsoTimestamp(value: unknown) {
  const candidate = safeString(value).trim().slice(0, 80);
  if (!candidate) return "";
  return Number.isNaN(new Date(candidate).getTime()) ? "" : candidate;
}

function safeProofStatus(value: unknown) {
  return PROOF_STATUSES.includes(value as (typeof PROOF_STATUSES)[number]) ? (value as (typeof PROOF_STATUSES)[number]) : "block";
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return value;
}

function stableDigest(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function uniqueAgentIds(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const ids = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  return [...new Set(ids)].slice(0, 8);
}

function normalizeDraftCustomAgents(value: unknown): MarketAgent[] {
  const result: MarketAgent[] = [];
  const seen = new Set<string>();

  for (const raw of safeArray(value)) {
    const candidate = safeRecord(raw) as Partial<MarketAgent>;
    const id = safeString(candidate.id).trim();
    const name = safeString(candidate.name).trim();
    if (!id.startsWith("custom-") || !name || seen.has(id)) continue;
    const rawCapabilities = safeRecord(candidate.capabilities);
    const capabilities = {} as MarketAgent["capabilities"];
    for (const key of CAPABILITY_KEYS) {
      const score = Number(rawCapabilities[key]);
      capabilities[key] = Math.round(clamp(Number.isFinite(score) ? score : 42));
    }
    const skills = safeArray(candidate.skills).slice(0, 5).map((skill, index) => {
      const row = safeRecord(skill);
      return {
        id: safeString(row.id, `${id}-skill-${index + 1}`).slice(0, 60),
        label: safeString(row.label || row.name, `${name} skill`).slice(0, 70),
        proof: safeString(row.proof || row.description, "Imported Agent Card skill.").slice(0, 160),
        score: Math.round(clamp(Number(row.score) || 70))
      };
    });
    const a2aSkillIds = safeArray(candidate.a2aSkillIds).map((skill) => safeString(skill)).filter(Boolean).slice(0, 5);
    const mcp = safeArray(candidate.mcp).slice(0, 3).map((item) => {
      const row = safeRecord(item);
      const tools = safeArray(row.tools).map((tool) => safeString(tool)).filter(Boolean).slice(0, 6);
      return {
        name: safeString(row.name, "imported-agent-card").slice(0, 60),
        tools: tools.length > 0 ? tools : a2aSkillIds.slice(0, 3),
        maturity: Math.round(clamp(Number(row.maturity) || capabilities.mcp))
      };
    });

    seen.add(id);
    result.push({
      id,
      name: name.slice(0, 80),
      handle: safeString(candidate.handle, "Imported Agent Card").slice(0, 80),
      stage: STAGES.includes(candidate.stage as AgentStage) ? (candidate.stage as AgentStage) : "govern",
      rarity: ["common", "rare", "epic", "legendary"].includes(String(candidate.rarity)) ? (candidate.rarity as MarketAgent["rarity"]) : "rare",
      price: Math.round(clamp(Number(candidate.price) || 28, 1, 99)),
      headline: safeString(candidate.headline, `${name} imported from an Agent Card.`).slice(0, 110),
      outcome: safeString(candidate.outcome, "Imported agent can be evaluated in this workspace.").slice(0, 130),
      color: safeString(candidate.color, "#315a7d"),
      accent: safeString(candidate.accent, "#b8e0ff"),
      capabilities,
      skills: skills.length > 0 ? skills : [{ id: `${id}-skill`, label: `${name} execution`, proof: "Imported Agent Card skill.", score: 70 }],
      mcp: mcp.length > 0 ? mcp : [{ name: "imported-agent-card", tools: a2aSkillIds, maturity: capabilities.mcp }],
      a2aSkillIds,
      synergyTags: safeArray(candidate.synergyTags).map((tag) => safeString(tag)).filter(Boolean).slice(0, 8)
    });
    if (result.length >= MAX_CUSTOM_AGENTS) break;
  }

  return result;
}

function normalizeProofVerification(value: unknown): BuyerShareGateProofVerificationSummary | null {
  const row = safeRecord(value);
  if (Object.keys(row).length === 0) return null;

  const results = safeArray(row.results)
    .slice(0, MAX_PROOF_VERIFICATION_RESULTS)
    .map((item, index) => {
      const result = safeRecord(item);
      const httpStatus = Number(result.httpStatus);
      return {
        id: safeString(result.id, `proof-${index + 1}`).trim().slice(0, 80),
        label: safeString(result.label, "Proof link").trim().slice(0, 120),
        status: safeProofStatus(result.status),
        ...(Number.isFinite(httpStatus) ? { httpStatus: Math.round(clamp(httpStatus, 100, 599)) } : {}),
        evidence: safeString(result.evidence, "No evidence recorded.").trim().slice(0, 260),
        action: safeString(result.action, "Rerun live proof verification.").trim().slice(0, 260)
      };
    })
    .filter((result) => result.id && result.label);

  if (results.length === 0) return null;
  const totalCount = results.length;
  const verifiedCount = results.filter((result) => result.status === "pass").length;
  const checkedAt = safeIsoTimestamp(row.checkedAt);
  if (!checkedAt) return null;

  return {
    checkedAt,
    verifiedCount,
    totalCount,
    score: Math.round(clamp(Number(row.score) || 0)),
    results
  };
}

export function defaultWorkspaceDraft(updatedAt = new Date().toISOString()): WorkspaceDraft {
  return {
    version: 1,
    activeTemplateId: DEFAULT_BLUEPRINT_TEMPLATE.id,
    projectBrief: DEFAULT_BLUEPRINT_TEMPLATE.brief,
    selectedAgentIds: DEFAULT_BLUEPRINT_TEMPLATE.selectedAgentIds,
    customAgents: [],
    agentTrialEvidence: [],
    buyerScenario: normalizeBuyerValueScenarioInput(DEFAULT_BLUEPRINT_TEMPLATE.buyerScenario, DEFAULT_BUYER_VALUE_SCENARIO),
    pilotRun: normalizePilotRunReceiptInput(DEFAULT_BLUEPRINT_TEMPLATE.pilotRun, DEFAULT_PILOT_RUN_RECEIPT_INPUT),
    buyerWorkOrder: normalizeBuyerWorkOrderInput(DEFAULT_BLUEPRINT_TEMPLATE.buyerWorkOrder, DEFAULT_BUYER_WORK_ORDER_INPUT),
    targetUrl: "",
    protopediaUrl: "",
    videoUrl: "",
    proofVerification: null,
    updatedAt
  };
}

export function workspaceDraftFromTemplate(template: BlueprintTemplate, updatedAt = new Date().toISOString()): WorkspaceDraft {
  return buildWorkspaceDraft({
    activeTemplateId: template.id,
    projectBrief: template.brief,
    selectedAgentIds: template.selectedAgentIds,
    customAgents: [],
    agentTrialEvidence: [],
    buyerScenario: template.buyerScenario,
    pilotRun: template.pilotRun,
    buyerWorkOrder: template.buyerWorkOrder,
    targetUrl: "",
    protopediaUrl: "",
    videoUrl: "",
    proofVerification: null,
    updatedAt
  });
}

export function buildWorkspaceDraft(input: WorkspaceDraftInput): WorkspaceDraft {
  const fallback = defaultWorkspaceDraft(input.updatedAt);
  const projectBrief = safeString(input.projectBrief, fallback.projectBrief).trim().slice(0, MAX_BRIEF_LENGTH);
  const selectedAgentIds = uniqueAgentIds(input.selectedAgentIds, fallback.selectedAgentIds);

  return {
    version: 1,
    activeTemplateId: safeString(input.activeTemplateId, fallback.activeTemplateId).trim() || fallback.activeTemplateId,
    projectBrief: projectBrief || fallback.projectBrief,
    selectedAgentIds: selectedAgentIds.length > 0 ? selectedAgentIds : fallback.selectedAgentIds,
    customAgents: normalizeDraftCustomAgents(input.customAgents ?? []),
    agentTrialEvidence: normalizeAgentTrialEvidenceRecords(input.agentTrialEvidence ?? []),
    buyerScenario: normalizeBuyerValueScenarioInput(input.buyerScenario, fallback.buyerScenario),
    pilotRun: normalizePilotRunReceiptInput(input.pilotRun, fallback.pilotRun),
    buyerWorkOrder: normalizeBuyerWorkOrderInput(input.buyerWorkOrder, fallback.buyerWorkOrder),
    targetUrl: safeUrlText(input.targetUrl),
    protopediaUrl: safeUrlText(input.protopediaUrl),
    videoUrl: safeUrlText(input.videoUrl),
    proofVerification: normalizeProofVerification(input.proofVerification ?? null),
    updatedAt: input.updatedAt ?? new Date().toISOString()
  };
}

export function normalizeWorkspaceDraft(value: unknown, fallback = defaultWorkspaceDraft()): WorkspaceDraft {
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<WorkspaceDraft>;
  return buildWorkspaceDraft({
    activeTemplateId: candidate.activeTemplateId ?? fallback.activeTemplateId,
    projectBrief: candidate.projectBrief ?? fallback.projectBrief,
    selectedAgentIds: candidate.selectedAgentIds ?? fallback.selectedAgentIds,
    customAgents: candidate.customAgents ?? fallback.customAgents,
    agentTrialEvidence: candidate.agentTrialEvidence ?? fallback.agentTrialEvidence,
    buyerScenario: candidate.buyerScenario ?? fallback.buyerScenario,
    pilotRun: candidate.pilotRun ?? fallback.pilotRun,
    buyerWorkOrder: candidate.buyerWorkOrder ?? fallback.buyerWorkOrder,
    targetUrl: candidate.targetUrl ?? fallback.targetUrl,
    protopediaUrl: candidate.protopediaUrl ?? fallback.protopediaUrl,
    videoUrl: candidate.videoUrl ?? fallback.videoUrl,
    proofVerification: candidate.proofVerification ?? fallback.proofVerification,
    updatedAt: candidate.updatedAt ?? fallback.updatedAt
  });
}

export function decodeWorkspaceDraft(raw: string | null | undefined, fallback = defaultWorkspaceDraft()): WorkspaceDraft {
  if (!raw) return fallback;
  try {
    return normalizeWorkspaceDraft(JSON.parse(raw), fallback);
  } catch {
    return fallback;
  }
}

export function parseWorkspaceImport(raw: string, fallback = defaultWorkspaceDraft()): WorkspaceImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      status: "rejected",
      reason: "Workspace file is not valid JSON."
    };
  }

  const candidate = safeRecord(parsed);
  if (candidate.version !== 1) {
    return {
      status: "rejected",
      reason: "Workspace file is not an A2A launch workspace export."
    };
  }

  const draft = normalizeWorkspaceDraft(candidate, fallback);
  return {
    status: "accepted",
    draft
  };
}

export function encodeWorkspaceDraft(draft: WorkspaceDraft) {
  return JSON.stringify(normalizeWorkspaceDraft(draft));
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

export function encodeWorkspaceShareParam(draft: WorkspaceDraft) {
  const encoded = encodeWorkspaceDraft(draft);
  const compressed = compressToEncodedURIComponent(encoded);
  return compressed ? `${COMPRESSED_WORKSPACE_SHARE_PREFIX}${compressed}` : base64UrlEncode(encoded);
}

export function decodeWorkspaceShareParam(raw: string | null | undefined, fallback = defaultWorkspaceDraft()) {
  if (!raw) return fallback;
  try {
    if (raw.startsWith(COMPRESSED_WORKSPACE_SHARE_PREFIX)) {
      const decompressed = decompressFromEncodedURIComponent(raw.slice(COMPRESSED_WORKSPACE_SHARE_PREFIX.length));
      return decodeWorkspaceDraft(decompressed, fallback);
    }
    return decodeWorkspaceDraft(base64UrlDecode(raw), fallback);
  } catch {
    return fallback;
  }
}

export function buildWorkspaceShareUrl(draft: WorkspaceDraft, href: string) {
  const url = new URL(href);
  url.searchParams.set(WORKSPACE_SHARE_PARAM, encodeWorkspaceShareParam(draft));
  url.hash = "";
  return url.toString();
}

function resumeStatus(value: boolean, partial = false): "ready" | "watch" | "missing" {
  if (value) return "ready";
  if (partial) return "watch";
  return "missing";
}

function buildProofHealth(
  liveProof: BuyerShareGateProofVerificationSummary | null,
  proofUrls: string[]
): WorkspaceResumePacket["proofHealth"] {
  if (!liveProof) {
    return {
      status: proofUrls.length > 0 ? "watch" : "missing",
      headline: proofUrls.length > 0 ? "Proof URLs attached, not checked live" : "Live proof is not attached yet",
      summary:
        proofUrls.length > 0
          ? `${proofUrls.length}/5 proof URLs are attached, but external reachability has not been verified.`
          : "No buyer-facing proof URLs are attached to this workspace.",
      checkedAt: null,
      verifiedCount: 0,
      totalCount: proofUrls.length,
      score: 0,
      nextAction: "Run live proof verification before sending this room to an external reviewer.",
      nextActionLabel: "Verify live proof",
      openIssues: []
    };
  }

  const openIssues = liveProof.results
    .filter((result) => result.status !== "pass")
    .map((result) => ({
      id: result.id,
      label: result.label,
      status: (result.status === "watch" ? "watch" : "block") as "watch" | "block",
      evidence: result.evidence,
      action: result.action,
      ...(result.httpStatus ? { httpStatus: result.httpStatus } : {})
    }))
    .sort((left, right) => (left.status === "block" ? 0 : 1) - (right.status === "block" ? 0 : 1));
  const blockCount = openIssues.filter((issue) => issue.status === "block").length;
  const watchCount = openIssues.filter((issue) => issue.status === "watch").length;
  const status = blockCount > 0 ? "blocked" : watchCount > 0 || liveProof.verifiedCount < liveProof.totalCount ? "watch" : "ready";
  const headline =
    status === "ready"
      ? "Live proof is externally reachable"
      : status === "blocked"
        ? `${blockCount} live proof blocker${blockCount === 1 ? "" : "s"}`
        : `${watchCount || liveProof.totalCount - liveProof.verifiedCount} live proof link${watchCount === 1 ? "" : "s"} need review`;
  const nextIssue = openIssues[0];

  return {
    status,
    headline,
    summary: `${liveProof.verifiedCount}/${liveProof.totalCount} live links verified, score ${liveProof.score}/100.`,
    checkedAt: liveProof.checkedAt,
    verifiedCount: liveProof.verifiedCount,
    totalCount: liveProof.totalCount,
    score: liveProof.score,
    nextAction: nextIssue ? nextIssue.action : "Keep the audit fresh when proof URLs change.",
    nextActionLabel: nextIssue ? `Repair ${nextIssue.label}` : "Open proof audit",
    openIssues
  };
}

function buildPublicReview(
  proofHealth: WorkspaceResumePacket["proofHealth"],
  missing: string[]
): WorkspaceResumePacket["publicReview"] {
  if (missing.length === 0 && proofHealth.status === "ready") {
    return {
      status: "ready",
      headline: "Public review cover is sendable",
      summary: "A reviewer can open the cover sheet, inspect the value route, and follow the proof links without a private walkthrough.",
      action: "Open the public review cover and ask for a bounded pilot decision.",
      actionLabel: "Open review cover"
    };
  }
  if (proofHealth.status === "blocked" || missing.some((item) => item.includes("URL") || item.includes("proof"))) {
    return {
      status: "blocked",
      headline: "Public review cover should stay internal",
      summary: `${missing.length} handoff gap${missing.length === 1 ? "" : "s"} would make the public cover read as unfinished.`,
      action: "Open the cover as an internal repair memo, then close the first proof blocker before sharing externally.",
      actionLabel: "Review no-send cover"
    };
  }
  return {
    status: "watch",
    headline: "Public review cover needs owner review",
    summary: "The core workspace is resumable, but one reviewer-facing warning should be cleared before broad public traffic.",
    action: "Open the cover sheet and confirm the sponsor review action before sending it outside the team.",
    actionLabel: "Review cover"
  };
}

export function buildWorkspaceResumePacket(draft: WorkspaceDraft, href: string, proofAuditHref = "/buyer-proof-audit", publicReviewHref?: string): WorkspaceResumePacket {
  const normalized = normalizeWorkspaceDraft(draft);
  const resumeUrl = buildWorkspaceShareUrl(normalized, href);
  const proofAuditUrl = buildWorkspaceShareUrl(normalized, new URL(proofAuditHref, href).toString());
  const publicReviewTarget = new URL(publicReviewHref ?? "/global-publishability", href).toString();
  const publicReviewUrl = publicReviewHref === undefined ? buildWorkspaceShareUrl(normalized, publicReviewTarget) : publicReviewTarget;
  const proofUrls = [
    normalized.targetUrl,
    normalized.protopediaUrl,
    normalized.videoUrl,
    normalized.pilotRun.evidenceUrl,
    normalized.buyerWorkOrder.evidenceUrl
  ].filter(Boolean);
  const liveProof = normalized.proofVerification;
  const proofHealth = buildProofHealth(liveProof, proofUrls);
  const payload = {
    version: normalized.version,
    activeTemplateId: normalized.activeTemplateId,
    projectBrief: normalized.projectBrief,
    selectedAgentIds: normalized.selectedAgentIds,
    agentTrialEvidence: normalized.agentTrialEvidence.map((record) => ({
      agentId: record.agentId,
      skillId: record.skillId,
      status: record.status,
      score: record.score
    })),
    targetBuyer: normalized.buyerWorkOrder.targetUser,
    workOrder: normalized.buyerWorkOrder.request,
    buyerScenario: normalized.buyerScenario,
    pilotRun: normalized.pilotRun,
    buyerWorkOrder: normalized.buyerWorkOrder,
    proofUrls,
    liveProof: liveProof
      ? {
          checkedAt: liveProof.checkedAt,
          verifiedCount: liveProof.verifiedCount,
          totalCount: liveProof.totalCount,
          score: liveProof.score,
          results: liveProof.results.map((result) => ({
            id: result.id,
            label: result.label,
            status: result.status,
            httpStatus: result.httpStatus ?? null,
            evidence: result.evidence,
            action: result.action
          }))
        }
      : null
  };
  const checksum = stableDigest(payload);
  const included: WorkspaceResumePacket["included"] = [
    {
      id: "brief",
      label: "Project brief",
      value: `${normalized.projectBrief.length} characters`,
      status: resumeStatus(normalized.projectBrief.trim().length > 0)
    },
    {
      id: "agents",
      label: "Selected agents",
      value: `${normalized.selectedAgentIds.length} selected`,
      status: resumeStatus(normalized.selectedAgentIds.length > 0)
    },
    {
      id: "value",
      label: "Value model",
      value: `${normalized.buyerScenario.teamSize} people / ${normalized.buyerScenario.cyclesPerMonth} cycles/month`,
      status: resumeStatus(Boolean(normalized.buyerScenario.teamSize && normalized.buyerScenario.cyclesPerMonth && normalized.buyerScenario.manualHoursPerCycle))
    },
    {
      id: "pilot",
      label: "Measured pilot",
      value:
        normalized.pilotRun.observedManualMinutes && normalized.pilotRun.observedAssistedMinutes
          ? `${normalized.pilotRun.observedManualMinutes - normalized.pilotRun.observedAssistedMinutes} minutes saved/run`
          : "Measured run pending",
      status: resumeStatus(
        Boolean(normalized.pilotRun.observedManualMinutes && normalized.pilotRun.observedAssistedMinutes && normalized.pilotRun.acceptedTasks && normalized.pilotRun.totalTasks),
        Boolean(normalized.pilotRun.observedManualMinutes || normalized.pilotRun.observedAssistedMinutes || normalized.pilotRun.acceptedTasks)
      )
    },
    {
      id: "work-order",
      label: "Buyer work order",
      value: normalized.buyerWorkOrder.targetUser || "Target buyer pending",
      status: resumeStatus(Boolean(normalized.buyerWorkOrder.targetUser && normalized.buyerWorkOrder.request && normalized.buyerWorkOrder.successMetric))
    },
    {
      id: "proof",
      label: "Public proof",
      value: liveProof ? `${liveProof.verifiedCount}/${liveProof.totalCount} live proof links verified` : `${proofUrls.length}/5 proof URLs attached`,
      status: resumeStatus(proofHealth.status === "ready", proofHealth.status === "watch" || proofHealth.status === "blocked" || proofUrls.length > 0)
    },
    {
      id: "trial-evidence",
      label: "A2A trial evidence",
      value: `${normalized.agentTrialEvidence.length} trial receipt${normalized.agentTrialEvidence.length === 1 ? "" : "s"}`,
      status: resumeStatus(normalized.agentTrialEvidence.some((record) => record.status === "accepted"), normalized.agentTrialEvidence.length > 0)
    }
  ];
  const missing = [
    normalized.targetUrl ? "" : "Deployed URL",
    normalized.protopediaUrl ? "" : "ProtoPedia URL",
    normalized.videoUrl ? "" : "Walkthrough video",
    normalized.pilotRun.evidenceUrl ? "" : "Pilot receipt URL",
    normalized.buyerWorkOrder.evidenceUrl ? "" : "Work order proof URL",
    !liveProof ? "Live proof verification" : "",
    proofHealth.status === "blocked" ? "Repair blocked live proof" : "",
    proofHealth.status === "watch" && liveProof ? "Review unstable live proof" : ""
  ].filter(Boolean);
  const publicReview = buildPublicReview(proofHealth, missing);
  const headline = missing.length === 0 ? "Workspace can be resumed with full public proof context" : `Workspace resumes with ${missing.length} handoff gap${missing.length === 1 ? "" : "s"}`;
  const summary = `${normalized.buyerWorkOrder.targetUser || "Target buyer"} / ${normalized.selectedAgentIds.length} agents / ${proofHealth.summary} / checksum ${checksum.slice(0, 12)}.`;
  const restoreSteps = [
    "Open the resume URL in a new browser tab.",
    "Confirm the buyer, value model, pilot receipt, and selected agents match this packet.",
    publicReview.action,
    proofHealth.status === "ready" ? "Open the proof audit and confirm the verification timestamp is fresh." : proofHealth.nextAction,
    "Export or copy the launch room only after unresolved handoff gaps are closed."
  ];
  const markdown = [
    "# Workspace resume packet",
    "",
    `Receipt: workspace-resume-${checksum.slice(0, 12)}`,
    `Checksum: fnv1a-64:${checksum}`,
    `Updated: ${normalized.updatedAt}`,
    `Resume URL: ${resumeUrl}`,
    `Proof audit: ${proofAuditUrl}`,
    `Public review cover: ${publicReviewUrl}`,
    "",
    headline,
    "",
    summary,
    "",
    "## Included",
    ...included.map((item) => `- [${item.status}] ${item.label}: ${item.value}`),
    "",
    "## Public review cover",
    `- Status: ${publicReview.status}`,
    `- Headline: ${publicReview.headline}`,
    `- Summary: ${publicReview.summary}`,
    `- Action: ${publicReview.action}`,
    "",
    "## Live proof health",
    `- Status: ${proofHealth.status}`,
    `- Summary: ${proofHealth.summary}`,
    `- Checked: ${proofHealth.checkedAt ?? "not checked"}`,
    `- Next action: ${proofHealth.nextAction}`,
    ...(proofHealth.openIssues.length > 0
      ? proofHealth.openIssues.flatMap((issue) => [
          `- ${issue.label}: ${issue.status}${issue.httpStatus ? ` HTTP ${issue.httpStatus}` : ""}`,
          `  - Evidence: ${issue.evidence}`,
          `  - Action: ${issue.action}`
        ])
      : ["- No open live proof issue recorded."]),
    "",
    "## Handoff gaps",
    ...(missing.length > 0 ? missing.map((item) => `- ${item}`) : ["- none"]),
    "",
    "## Restore steps",
    ...restoreSteps.map((step, index) => `${index + 1}. ${step}`)
  ].join("\n");

  return {
    receiptId: `workspace-resume-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    resumeUrl,
    proofAuditUrl,
    publicReviewUrl,
    updatedAt: normalized.updatedAt,
    headline,
    summary,
    publicReview,
    proofHealth,
    included,
    missing,
    restoreSteps,
    markdown,
    markdownHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`
  };
}
