import { describe, expect, test } from "vitest";
import { discoverAgentCardFromUrl } from "../server/agentCardDiscovery";
import { isBlockedAgentCardHostname, isBlockedIpAddress, normalizeAgentCardDiscoveryUrl } from "../src/agentCardDiscovery";

const PUBLIC_RECORDS = [{ address: "93.184.216.34" }];
const PRIVATE_RECORDS = [{ address: "10.0.0.5" }];

const AGENT_CARD = {
  name: "Remote Agent Card Auditor",
  description: "Discovers A2A Agent Cards, validates Cloud Run deployment proof, and reports MCP tool evidence.",
  skills: [
    {
      id: "agent-card.audit",
      name: "Agent Card audit",
      description: "Checks public Agent Card metadata, A2A skills, and MCP tool declarations."
    }
  ],
  mcp: {
    name: "remote-agent-card",
    tools: ["fetch_card", "verify_skills"]
  }
};

describe("Agent Card discovery guard", () => {
  test("normalizes an origin URL to the well-known Agent Card path", () => {
    const result = normalizeAgentCardDiscoveryUrl("https://agents.example.com");

    expect(result).toEqual({
      ok: true,
      url: "https://agents.example.com/.well-known/agent-card.json",
      warnings: []
    });
  });

  test("keeps explicit JSON Agent Card URLs while dropping fragments", () => {
    const result = normalizeAgentCardDiscoveryUrl("https://agents.example.com/cards/release-agent.json#readme");

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url).toBe("https://agents.example.com/cards/release-agent.json");
  });

  test("rejects private and credential-bearing discovery targets", () => {
    expect(normalizeAgentCardDiscoveryUrl("https://user:pass@agents.example.com").ok).toBe(false);
    expect(normalizeAgentCardDiscoveryUrl("http://127.0.0.1:18080/.well-known/agent-card.json").ok).toBe(false);
    expect(isBlockedAgentCardHostname("localhost")).toBe(true);
    expect(isBlockedIpAddress("10.1.2.3")).toBe(true);
    expect(isBlockedIpAddress("172.20.1.2")).toBe(true);
    expect(isBlockedIpAddress("192.168.1.2")).toBe(true);
    expect(isBlockedIpAddress("::1")).toBe(true);
    expect(isBlockedIpAddress("93.184.216.34")).toBe(false);
  });

  test("discovers and converts a public Agent Card with injected network dependencies", async () => {
    const result = await discoverAgentCardFromUrl("https://agents.example.com", {
      resolveHost: async () => PUBLIC_RECORDS,
      fetchImpl: async (url) =>
        new Response(JSON.stringify({ ...AGENT_CARD, url: "https://agents.example.com/a2a" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
    });

    expect(result.status).toBe("accepted");
    if (result.status !== "accepted") return;
    expect(result.discoveredUrl).toBe("https://agents.example.com/.well-known/agent-card.json");
    expect(result.a2aEndpoint).toBe("https://agents.example.com/a2a");
    expect(result.agent.name).toBe("Remote Agent Card Auditor");
    expect(result.agent.a2aSkillIds).toContain("agent-card.audit");
    expect(result.agent.capabilities.a2a).toBeGreaterThanOrEqual(60);
  });

  test("rejects DNS results that resolve to private addresses before fetch", async () => {
    let fetched = false;
    const result = await discoverAgentCardFromUrl("https://agents.example.com", {
      resolveHost: async () => PRIVATE_RECORDS,
      fetchImpl: async () => {
        fetched = true;
        return new Response(JSON.stringify(AGENT_CARD), { status: 200 });
      }
    });

    expect(result.status).toBe("rejected");
    expect(fetched).toBe(false);
    if (result.status === "rejected") expect(result.error).toContain("private");
  });
});
