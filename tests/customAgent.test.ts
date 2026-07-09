import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildImportedAgentFromCard, decodeCustomAgentsParam, encodeCustomAgentsParam, mergeAgentCatalog } from "../src/customAgent";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildSquadOptimizer } from "../src/squadOptimizer";

const CLOUD_RUN_AGENT_CARD = JSON.stringify({
  name: "Cloud Run Release Auditor",
  description: "Audits Cloud Run deployments, CI evidence, runtime logs, A2A handoff receipts, and rollback gates.",
  url: "https://agents.example.com/.well-known/agent-card.json",
  provider: {
    organization: "Example Agents"
  },
  skills: [
    {
      id: "cloudrun.deploy",
      name: "Cloud Run deploy",
      description: "Deploys and rolls back Cloud Run services with health checks."
    },
    {
      id: "evidence.monitor",
      name: "Evidence monitor",
      description: "Reads CI, logs, metrics, and A2A message/send receipts."
    }
  ],
  mcp: {
    name: "gcloud-runner",
    tools: ["deploy", "describe_service", "read_logs"]
  }
});

describe("custom Agent Card intake", () => {
  test("scores an imported Agent Card as a hireable marketplace agent", () => {
    const result = buildImportedAgentFromCard(CLOUD_RUN_AGENT_CARD);

    expect(result.status).toBe("accepted");
    if (result.status !== "accepted") return;
    expect(result.agent.id).toMatch(/^custom-cloud-run-release-auditor-/);
    expect(result.agent.capabilities.cloudRun).toBeGreaterThanOrEqual(80);
    expect(result.agent.capabilities.a2a).toBeGreaterThanOrEqual(60);
    expect(result.agent.capabilities.mcp).toBeGreaterThanOrEqual(60);
    expect(result.agent.a2aSkillIds).toEqual(expect.arrayContaining(["cloudrun.deploy", "evidence.monitor"]));
    expect(result.signals.join(" ")).toContain("tools");
    expect(result.sourceUrl).toBe("https://agents.example.com/.well-known/agent-card.json");
  });

  test("keeps a supplied source URL for pasted cards that omit their public URL", () => {
    const result = buildImportedAgentFromCard(
      JSON.stringify({
        name: "Registry Release Steward",
        description: "Audits Cloud Run release evidence, A2A receipts, MCP tools, and buyer handoff gates.",
        provider: { organization: "Example Agents" },
        skills: [{ id: "release.audit", name: "Release audit", description: "Audits CI, Cloud Run, observability, and A2A proof." }]
      }),
      "https://registry.example.com/agents/release-steward.json"
    );

    expect(result.status).toBe("accepted");
    if (result.status !== "accepted") return;
    expect(result.sourceUrl).toBe("https://registry.example.com/agents/release-steward.json");
    expect(result.assessment.checks.find((check) => check.id === "public-url")?.status).toBe("pass");
  });

  test("lets recommendation use imported agents instead of losing them to the static catalog", () => {
    const result = buildImportedAgentFromCard(CLOUD_RUN_AGENT_CARD);
    if (result.status !== "accepted") throw new Error("fixture should import");
    const catalog = mergeAgentCatalog([result.agent]);
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, [result.agent.id], 160, catalog);

    expect(recommendation.selected.map((agent) => agent.id)).toEqual([result.agent.id]);
    expect(recommendation.selected[0].name).toBe("Cloud Run Release Auditor");
    expect(recommendation.mcpMatrix.some((row) => row.mcp === "gcloud-runner")).toBe(true);
    expect(recommendation.after.reliability).toBeGreaterThan(recommendation.before.reliability);
  });

  test("round-trips imported agents through public artifact query params", () => {
    const result = buildImportedAgentFromCard(CLOUD_RUN_AGENT_CARD);
    if (result.status !== "accepted") throw new Error("fixture should import");

    expect(decodeCustomAgentsParam(encodeCustomAgentsParam([result.agent]))).toEqual([result.agent]);
    expect(decodeCustomAgentsParam("broken")).toEqual([]);
  });

  test("squad optimizer can evaluate imported candidates in the same catalog", () => {
    const result = buildImportedAgentFromCard(CLOUD_RUN_AGENT_CARD);
    if (result.status !== "accepted") throw new Error("fixture should import");
    const catalog = mergeAgentCatalog([result.agent]);
    const optimizer = buildSquadOptimizer({
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds: [result.agent.id],
      budget: 180,
      maxSquadSize: 4,
      agentCatalog: catalog
    });

    expect(optimizer.current.agentIds).toContain(result.agent.id);
    expect(optimizer.current.agents.some((agent) => agent.name === "Cloud Run Release Auditor")).toBe(true);
    expect(optimizer.current.coverage.some((gate) => gate.id === "cloud-run" && gate.met)).toBe(true);
  });
});
