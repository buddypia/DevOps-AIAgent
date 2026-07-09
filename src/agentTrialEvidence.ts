import type { AgentTrialReceipt } from "./agentTrialReceipt.js";
import type { AgentTrialVerification, AgentTrialVerificationStatus } from "./agentTrialVerifier.js";
import { normalizeBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { MarketAgent } from "./types.js";

const MAX_TRIAL_EVIDENCE_RECORDS = 6;
const TRIAL_EVIDENCE_PARAM_VERSION = 1;

export type AgentTrialEvidenceRecord = {
  id: string;
  receiptId: string;
  agentId: string;
  agentName: string;
  skillId: string;
  status: AgentTrialVerificationStatus;
  score: number;
  artifactUrl: string;
  evidenceSource: string;
  headline: string;
  summary: string;
  attachedAt: string;
};

export type AgentTrialEvidenceSummary = {
  acceptedCount: number;
  bestScore: number;
  latestAccepted: AgentTrialEvidenceRecord | null;
  status: "ready" | "watch" | "missing";
  evidence: string;
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

export function buildAgentTrialEvidenceRecord(input: {
  agent: MarketAgent;
  receipt: AgentTrialReceipt;
  verification: AgentTrialVerification;
  attachedAt?: string;
}): AgentTrialEvidenceRecord {
  const attachedAt = input.attachedAt ?? new Date().toISOString();
  const artifactUrl = normalizeBuyerFacingProofUrl(input.verification.artifactUrl);
  const evidenceSource = safeText(input.verification.evidenceSource, "Trial response").slice(0, 180);
  const status = input.verification.status === "accepted" && !artifactUrl ? "needs-evidence" : input.verification.status;
  return {
    id: `trial-proof-${input.receipt.id}`,
    receiptId: input.receipt.id,
    agentId: input.agent.id,
    agentName: input.agent.name,
    skillId: input.receipt.jsonRpcPayload.params.skillId,
    status,
    score: Math.round(clamp(input.verification.score)),
    artifactUrl,
    evidenceSource,
    headline: input.verification.headline.slice(0, 180),
    summary:
      status === "accepted"
        ? `${input.agent.name} returned ${artifactUrl || "a trial receipt"} with ${evidenceSource}.`
        : `${input.agent.name} trial verification is ${status} at ${input.verification.score}/100.`,
    attachedAt
  };
}

export function normalizeAgentTrialEvidenceRecords(value: unknown): AgentTrialEvidenceRecord[] {
  const records: AgentTrialEvidenceRecord[] = [];
  const seen = new Set<string>();

  for (const raw of asArray(value)) {
    const item = asRecord(raw);
    const receiptId = safeText(item.receiptId).slice(0, 120);
    const agentId = safeText(item.agentId).slice(0, 120);
    const agentName = safeText(item.agentName).slice(0, 100);
    const skillId = safeText(item.skillId).slice(0, 120);
    const status = safeText(item.status);
    if (!receiptId || !agentId || !agentName || !skillId || !["accepted", "needs-evidence", "failed"].includes(status)) continue;
    const artifactUrl = normalizeBuyerFacingProofUrl(item.artifactUrl);
    const normalizedStatus = status === "accepted" && !artifactUrl ? "needs-evidence" : status;
    const id = safeText(item.id, `trial-proof-${receiptId}`).slice(0, 160);
    if (seen.has(id)) continue;
    seen.add(id);
    records.push({
      id,
      receiptId,
      agentId,
      agentName,
      skillId,
      status: normalizedStatus as AgentTrialVerificationStatus,
      score: Math.round(clamp(Number(item.score) || 0)),
      artifactUrl,
      evidenceSource: safeText(item.evidenceSource, "Trial response").slice(0, 180),
      headline: safeText(item.headline, "A2A trial evidence").slice(0, 180),
      summary: safeText(item.summary, "A2A trial evidence is attached.").slice(0, 260),
      attachedAt: safeText(item.attachedAt, new Date(0).toISOString()).slice(0, 40)
    });
    if (records.length >= MAX_TRIAL_EVIDENCE_RECORDS) break;
  }

  return records;
}

export function summarizeAgentTrialEvidence(value: unknown): AgentTrialEvidenceSummary {
  const records = normalizeAgentTrialEvidenceRecords(value);
  const accepted = records.filter((record) => record.status === "accepted");
  const latestAccepted = accepted.sort((left, right) => right.attachedAt.localeCompare(left.attachedAt))[0] ?? null;
  const bestScore = accepted.reduce((max, record) => Math.max(max, record.score), 0);
  if (latestAccepted) {
    return {
      acceptedCount: accepted.length,
      bestScore,
      latestAccepted,
      status: "ready",
      evidence: `${accepted.length} accepted A2A trial proof${accepted.length === 1 ? "" : "s"}; latest ${latestAccepted.agentName} / ${latestAccepted.skillId} at ${latestAccepted.score}/100.`
    };
  }
  if (records.length > 0) {
    const best = records.reduce((current, record) => (record.score > current.score ? record : current), records[0]);
    return {
      acceptedCount: 0,
      bestScore: best.score,
      latestAccepted: null,
      status: "watch",
      evidence: `${records.length} trial response${records.length === 1 ? "" : "s"} attached, but none accepted yet.`
    };
  }
  return {
    acceptedCount: 0,
    bestScore: 0,
    latestAccepted: null,
    status: "missing",
    evidence: "No accepted A2A trial verification is attached."
  };
}

export function encodeAgentTrialEvidenceParam(value: unknown) {
  const payload = {
    version: TRIAL_EVIDENCE_PARAM_VERSION,
    records: normalizeAgentTrialEvidenceRecords(value)
  };
  return base64UrlEncode(JSON.stringify(payload));
}

export function decodeAgentTrialEvidenceParam(raw: string | null | undefined) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(base64UrlDecode(raw));
    return normalizeAgentTrialEvidenceRecords(asRecord(parsed).records);
  } catch {
    return [];
  }
}
