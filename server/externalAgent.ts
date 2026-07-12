import { randomUUID } from "node:crypto";

import { discoverAgentCardFromUrl, type AgentCardDiscoveryResult } from "./agentCardDiscovery.js";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_EXTERNAL_RESPONSE_BYTES = 128 * 1024;

export type ExternalDelegationConfig = {
  externalA2AAllowlist: string[];
  externalA2ATimeoutMs: number;
};

export type ExternalDelegationRequest = {
  agentCardUrl: string;
  skillId?: string;
  message: string;
};

export type ExternalDelegationReceipt = {
  status: "accepted" | "completed";
  cardUrl: string;
  a2aEndpoint: string;
  agentName: string;
  skillId: string;
  taskId: string | null;
  taskState: string | null;
  remoteHttpStatus: number;
  responseMessage: string | null;
  evidence: Array<{ id: string; source: string; detail: string }>;
};

export type ExternalDelegationFailure = {
  ok: false;
  code: "external_delegation_disabled" | "invalid_request" | "invalid_agent_card" | "external_origin_not_allowed" | "skill_not_declared" | "external_agent_error" | "external_agent_timeout";
  httpStatus: 400 | 403 | 422 | 502 | 503 | 504;
  message: string;
};

export type ExternalDelegationResult = { ok: true; receipt: ExternalDelegationReceipt } | ExternalDelegationFailure;

type ExternalDelegationDeps = {
  discoverCard?: (url: string) => Promise<AgentCardDiscoveryResult>;
  fetchImpl?: typeof fetch;
  requestId?: () => string;
};

function originOf(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (!(["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password)) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function clip(value: string, max = 1200) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function extractText(value: unknown): string | null {
  const record = asRecord(value);
  const candidates: unknown[] = [record.message, record.history, record.artifacts, record.result];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return clip(candidate.trim());
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        const text = extractText(item);
        if (text) return text;
      }
    } else if (candidate && typeof candidate === "object") {
      const nested = asRecord(candidate);
      if (typeof nested.text === "string" && nested.text.trim()) return clip(nested.text.trim());
      const text = extractText(candidate);
      if (text) return text;
    }
  }
  const parts = Array.isArray(record.parts) ? record.parts : [];
  for (const part of parts) {
    const text = asRecord(part).text;
    if (typeof text === "string" && text.trim()) return clip(text.trim());
  }
  return null;
}

function failure(
  code: ExternalDelegationFailure["code"],
  httpStatus: ExternalDelegationFailure["httpStatus"],
  message: string
): ExternalDelegationFailure {
  return { ok: false, code, httpStatus, message };
}

function responseTooLarge(response: Response) {
  const contentLength = Number(response.headers.get("content-length") || 0);
  return Number.isFinite(contentLength) && contentLength > MAX_EXTERNAL_RESPONSE_BYTES;
}

async function readResponseJson(response: Response): Promise<unknown | null> {
  if (responseTooLarge(response)) return null;
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_EXTERNAL_RESPONSE_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function delegateExternalAgent(
  input: ExternalDelegationRequest,
  config: ExternalDelegationConfig,
  deps: ExternalDelegationDeps = {}
): Promise<ExternalDelegationResult> {
  const message = input.message.trim();
  if (!input.agentCardUrl.trim() || !message || message.length > MAX_MESSAGE_LENGTH) {
    return failure("invalid_request", 400, "Agent Card URLと依頼文を確認してください。");
  }
  if (config.externalA2AAllowlist.length === 0) {
    return failure("external_delegation_disabled", 503, "外部委任はallowlist未設定のため無効です。");
  }

  const discovery = await (deps.discoverCard ?? discoverAgentCardFromUrl)(input.agentCardUrl.trim());
  if (discovery.status !== "accepted" || !discovery.discoveredUrl || !discovery.a2aEndpoint) {
    return failure("invalid_agent_card", 422, "Agent CardまたはA2A endpointを検証できませんでした。");
  }

  const endpointOrigin = originOf(discovery.a2aEndpoint);
  const allowedOrigins = config.externalA2AAllowlist.map(originOf).filter((origin): origin is string => Boolean(origin));
  if (!endpointOrigin || !allowedOrigins.includes(endpointOrigin)) {
    return failure("external_origin_not_allowed", 403, "このAgent Cardは許可された接続先ではありません。");
  }

  const skillId = input.skillId?.trim() || discovery.agent.a2aSkillIds[0];
  if (!skillId || !discovery.agent.a2aSkillIds.includes(skillId)) {
    return failure("skill_not_declared", 422, "指定されたskillはAgent Cardに宣言されていません。");
  }

  const requestId = deps.requestId?.() ?? randomUUID();
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: requestId,
    method: "message/send",
    params: {
      message: {
        role: "user",
        parts: [{ kind: "text", text: message }],
        metadata: { skillId }
      }
    }
  });

  let response: Response;
  try {
    response = await (deps.fetchImpl ?? fetch)(discovery.a2aEndpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "user-agent": "agent-guild-external-a2a"
      },
      body,
      signal: AbortSignal.timeout(config.externalA2ATimeoutMs)
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "AbortError" || name === "TimeoutError") return failure("external_agent_timeout", 504, "外部エージェントへの接続がタイムアウトしました。");
    return failure("external_agent_error", 502, "外部エージェントへ接続できませんでした。");
  }

  let responseBody: unknown | null;
  try {
    responseBody = await readResponseJson(response);
  } catch {
    return failure("external_agent_error", 502, "外部エージェントの応答を読み取れませんでした。");
  }
  if (!response.ok || !responseBody) {
    return failure("external_agent_error", 502, "外部エージェントの応答を検証できませんでした。");
  }
  const rpc = asRecord(responseBody);
  if (rpc.jsonrpc !== "2.0" || !Object.prototype.hasOwnProperty.call(rpc, "result")) {
    return failure("external_agent_error", 502, "外部エージェントがJSON-RPC契約に適合しません。");
  }

  const remoteTask = asRecord(rpc.result);
  const taskId = typeof remoteTask.id === "string" ? remoteTask.id : null;
  const remoteStatus = asRecord(remoteTask.status);
  const taskState = typeof remoteStatus.state === "string" ? remoteStatus.state : null;
  const status = taskState === "completed" ? "completed" : "accepted";

  return {
    ok: true,
    receipt: {
      status,
      cardUrl: discovery.discoveredUrl,
      a2aEndpoint: discovery.a2aEndpoint,
      agentName: discovery.agent.name,
      skillId,
      taskId,
      taskState,
      remoteHttpStatus: response.status,
      responseMessage: extractText(remoteTask),
      evidence: [
        { id: "agent-card", source: discovery.discoveredUrl, detail: `${discovery.agent.name} / ${discovery.agent.a2aSkillIds.length} skills` },
        { id: "a2a-request", source: discovery.a2aEndpoint, detail: `message/send skill=${skillId} requestId=${requestId}` },
        { id: "a2a-response", source: discovery.a2aEndpoint, detail: `HTTP ${response.status} state=${taskState ?? "unknown"}` }
      ]
    }
  };
}
