import type { AgentTrialEvidenceRecord } from "./agentTrialEvidence.js";
import { normalizeBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { MarketAgent } from "./types.js";

export type BuyerA2ATrialEvidenceRecordInput = {
  agent: MarketAgent;
  agentName?: string;
  skillId?: string;
  score: number;
  artifactUrl: string;
  evidenceSource?: string;
  headline?: string;
  receiptPrefix?: string;
  attachedAt?: string;
};

function compactTrialEvidenceKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildBuyerA2ATrialEvidenceRecord(input: BuyerA2ATrialEvidenceRecordInput): AgentTrialEvidenceRecord | null {
  const artifactUrl = normalizeBuyerFacingProofUrl(input.artifactUrl);
  if (!artifactUrl) return null;

  const skillId = (input.skillId || input.agent.a2aSkillIds[0] || input.agent.skills[0]?.id || "buyer.trial").slice(0, 120);
  const agentName = (input.agentName || input.agent.name).slice(0, 100);
  const score = Math.max(0, Math.min(100, Math.round(input.score)));
  const receiptPrefix = input.receiptPrefix || "buyer-trial";
  const receiptId = `${receiptPrefix}-${compactTrialEvidenceKey(input.agent.id)}-${compactTrialEvidenceKey(skillId) || "trial"}`;
  const evidenceSource = (input.evidenceSource || "Buyer-safe A2A trial response.").slice(0, 180);

  return {
    id: `trial-proof-${receiptId}`,
    receiptId,
    agentId: input.agent.id,
    agentName,
    skillId,
    status: "accepted",
    score,
    artifactUrl,
    evidenceSource,
    headline: (input.headline || "Accepted A2A trial receipt attached").slice(0, 180),
    summary: `${agentName} has a buyer-safe accepted A2A trial receipt at ${score}/100.`,
    attachedAt: input.attachedAt ?? new Date().toISOString()
  };
}
