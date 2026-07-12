import { describe, expect, test } from "vitest";

import { buildImportedAgentFromCard } from "../src/customAgent";
import { delegateExternalAgent, type ExternalDelegationConfig } from "../server/externalAgent";
import type { AgentCardDiscoveryResult } from "../server/agentCardDiscovery";

const CARD_URL = "https://remote.example/.well-known/agent-card.json";
const A2A_URL = "https://remote.example/a2a";

function discoveryResult(): AgentCardDiscoveryResult {
  const imported = buildImportedAgentFromCard(
    JSON.stringify({
      name: "Remote Security Agent",
      description: "Scans dependencies and returns a security proof receipt.",
      url: A2A_URL,
      skills: [{ id: "security.scan", name: "Security scan", description: "Scan dependencies." }]
    }),
    CARD_URL
  );
  if (imported.status !== "accepted") throw new Error("fixture should be accepted");
  return { ...imported, sourceUrl: CARD_URL, discoveredUrl: CARD_URL, a2aEndpoint: A2A_URL };
}

const config: ExternalDelegationConfig = {
  externalA2AAllowlist: ["https://remote.example"],
  externalA2ATimeoutMs: 6000
};

describe("external Agent Card delegation", () => {
  test("sends one JSON-RPC message and returns a task receipt", async () => {
    let request: Request | undefined;
    const result = await delegateExternalAgent(
      { agentCardUrl: CARD_URL, skillId: "security.scan", message: "脆弱性を確認してください" },
      config,
      {
        discoverCard: async () => discoveryResult(),
        fetchImpl: async (_url, init) => {
          request = new Request(A2A_URL, init);
          return new Response(JSON.stringify({ jsonrpc: "2.0", id: "r-1", result: { id: "task-1", status: { state: "working" } } }), {
            status: 200,
            headers: { "content-type": "application/json" }
          });
        }
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt.taskId).toBe("task-1");
    expect(result.receipt.taskState).toBe("working");
    expect(request?.method).toBe("POST");
    expect(request?.headers.get("authorization")).toBeNull();
    await expect(request?.json()).resolves.toMatchObject({
      jsonrpc: "2.0",
      method: "message/send",
      params: { message: { metadata: { skillId: "security.scan" } } }
    });
  });

  test("does not fetch when the A2A origin is not allowlisted", async () => {
    let fetched = false;
    const result = await delegateExternalAgent(
      { agentCardUrl: CARD_URL, message: "実行してください" },
      { ...config, externalA2AAllowlist: ["https://other.example"] },
      {
        discoverCard: async () => discoveryResult(),
        fetchImpl: async () => {
          fetched = true;
          return new Response("{}", { status: 200 });
        }
      }
    );

    expect(result).toMatchObject({ ok: false, code: "external_origin_not_allowed", httpStatus: 403 });
    expect(fetched).toBe(false);
  });

  test("rejects an undeclared skill before sending", async () => {
    let fetched = false;
    const result = await delegateExternalAgent(
      { agentCardUrl: CARD_URL, skillId: "deploy.delete", message: "実行してください" },
      config,
      {
        discoverCard: async () => discoveryResult(),
        fetchImpl: async () => {
          fetched = true;
          return new Response("{}", { status: 200 });
        }
      }
    );

    expect(result).toMatchObject({ ok: false, code: "skill_not_declared", httpStatus: 422 });
    expect(fetched).toBe(false);
  });

  test("rejects malformed JSON-RPC responses without exposing the body", async () => {
    const result = await delegateExternalAgent(
      { agentCardUrl: CARD_URL, message: "実行してください" },
      config,
      {
        discoverCard: async () => discoveryResult(),
        fetchImpl: async () => new Response(JSON.stringify({ secret: "do-not-return" }), { status: 200 })
      }
    );

    expect(result).toMatchObject({ ok: false, code: "external_agent_error", httpStatus: 502 });
    if (result.ok) return;
    expect(result.message).not.toContain("do-not-return");
  });

  test("maps a remote timeout to a safe timeout result without retrying", async () => {
    let calls = 0;
    const result = await delegateExternalAgent(
      { agentCardUrl: CARD_URL, message: "実行してください" },
      config,
      {
        discoverCard: async () => discoveryResult(),
        fetchImpl: async () => {
          calls += 1;
          const error = new Error("request timed out");
          error.name = "TimeoutError";
          throw error;
        }
      }
    );

    expect(result).toMatchObject({ ok: false, code: "external_agent_timeout", httpStatus: 504 });
    expect(calls).toBe(1);
  });
});
