import type { AgentCardAssessment } from "./agentCardAssessment.js";
import type { MarketAgent } from "./types.js";

export type AgentTrialReceipt = {
  id: string;
  readiness: AgentCardAssessment["readiness"];
  riskLevel: AgentCardAssessment["riskLevel"];
  digest: string;
  subject: string;
  summary: string;
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
        agentId: string;
        agentName: string;
        readiness: AgentCardAssessment["readiness"];
        riskLevel: AgentCardAssessment["riskLevel"];
      };
    };
  };
  copyText: string;
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function safeIdPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildPayload(input: { agent: MarketAgent; assessment: AgentCardAssessment; receiptId: string }) {
  const { agent, assessment, receiptId } = input;
  const task = assessment.trialTask;
  return {
    jsonrpc: "2.0" as const,
    id: receiptId,
    method: task.method,
    params: {
      skillId: task.skillId,
      message: {
        role: "user" as const,
        parts: [
          {
            type: "text" as const,
            text: task.objective
          },
          {
            type: "data" as const,
            data: {
              requestedArtifact: task.payload.requestedArtifact,
              acceptance: task.acceptance,
              safetyBoundary: task.payload.safetyBoundary,
              stopRules: [
                "Stop if credentials are required.",
                "Stop if a private URL or private network target is requested.",
                "Stop if the task would mutate production state."
              ]
            }
          }
        ]
      },
      metadata: {
        receiptId,
        agentId: agent.id,
        agentName: agent.name,
        readiness: assessment.readiness,
        riskLevel: assessment.riskLevel
      }
    }
  };
}

function buildCopyText(input: { agent: MarketAgent; assessment: AgentCardAssessment; receiptId: string; digest: string; payload: AgentTrialReceipt["jsonRpcPayload"] }) {
  const { agent, assessment, receiptId, digest, payload } = input;
  return [
    `A2A Trial Receipt: ${agent.name}`,
    `Receipt: ${receiptId}`,
    `Readiness: ${assessment.readiness}`,
    `Risk: ${assessment.riskLevel}`,
    `Digest: ${digest}`,
    "",
    "Objective:",
    assessment.trialTask.objective,
    "",
    "Acceptance:",
    ...assessment.trialTask.acceptance.map((item) => `- ${item}`),
    "",
    "Payload:",
    JSON.stringify(payload, null, 2)
  ].join("\n");
}

export function buildAgentTrialReceipt(input: { agent: MarketAgent; assessment: AgentCardAssessment }): AgentTrialReceipt {
  const base = `${input.agent.id}:${input.assessment.trialTask.skillId}:${input.assessment.readiness}:${input.assessment.riskLevel}`;
  const receiptId = `trial-${safeIdPart(input.agent.id)}-${stableHash(base).slice(0, 10)}`;
  const payload = buildPayload({ agent: input.agent, assessment: input.assessment, receiptId });
  const digest = stableHash(JSON.stringify(payload));
  return {
    id: receiptId,
    readiness: input.assessment.readiness,
    riskLevel: input.assessment.riskLevel,
    digest,
    subject: `A2A trial for ${input.agent.name}`,
    summary: `${input.assessment.trialTask.method} / ${input.assessment.trialTask.skillId} with ${input.assessment.readiness} readiness and ${input.assessment.riskLevel} risk.`,
    jsonRpcPayload: payload,
    copyText: buildCopyText({ agent: input.agent, assessment: input.assessment, receiptId, digest, payload })
  };
}
