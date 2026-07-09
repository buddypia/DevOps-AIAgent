import { describe, expect, test } from "vitest";
import { buildAgentCardDiligence } from "../server/agentCardDiligence";
import { buildAgentCardTrialPlan, renderAgentCardTrialPlanHtml, runAgentCardTrialPlan } from "../server/agentCardTrialPlan";
import type { AgentCardDiscoveryResult } from "../server/agentCardDiscovery";

const PUBLIC_RECORDS = [{ address: "93.184.216.34" }];

const STRONG_CARD = {
  name: "Global Release Steward",
  description: "Runs A2A release handoffs, validates MCP tools, checks Cloud Run evidence, and writes buyer safety receipts.",
  url: "https://agents.example.com/.well-known/agent-card.json",
  provider: { organization: "Example Agents" },
  defaultInputModes: ["application/json", "text/plain"],
  defaultOutputModes: ["application/json"],
  skills: [
    { id: "release.audit", name: "Release audit", description: "Audits CI, Cloud Run, observability, and A2A proof." },
    { id: "receipt.write", name: "Receipt writer", description: "Writes buyer handoff receipts with acceptance gates." }
  ],
  mcp: { name: "release-steward", tools: ["read_checks", "read_logs", "write_receipt"] }
};

describe("Agent Card trial plan", () => {
  test("turns a strong public Agent Card into a supervised A2A trial plan", async () => {
    const plan = await runAgentCardTrialPlan("https://agents.example.com", {
      resolveHost: async () => PUBLIC_RECORDS,
      fetchImpl: async (url) =>
        new Response(JSON.stringify({ ...STRONG_CARD, url: String(url) }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
    });

    expect(plan.readiness).toBe("ready-to-run");
    expect(plan.trialScore).toBeGreaterThanOrEqual(90);
    expect(plan.agentName).toBe("Global Release Steward");
    expect(plan.skillId).toBe("release.audit");
    expect(plan.jsonRpcPayload).toMatchObject({
      jsonrpc: "2.0",
      method: "message/send",
      params: {
        skillId: "release.audit",
        metadata: {
          agentName: "Global Release Steward",
          decision: "approve-supervised-trial"
        }
      }
    });
    expect(plan.evidenceContract.map((item) => item.id)).toEqual(["receipt-id", "artifact-url", "evidence-source", "acceptance", "safety-boundary"]);
    expect(plan.stopRules.join(" ")).toContain("credentials");
    expect(plan.exportMarkdown).toContain("JSON-RPC payload");
  });

  test("blocks the trial plan when diligence rejects discovery", () => {
    const report = buildAgentCardDiligence(
      "https://agents.example.com/broken.json",
      {
        status: "rejected",
        error: "Host resolves to a private address.",
        warnings: [],
        signals: []
      } satisfies AgentCardDiscoveryResult,
      "2026-06-20T12:00:00.000Z"
    );
    const plan = buildAgentCardTrialPlan(report, "2026-06-20T12:00:00.000Z");

    expect(plan.readiness).toBe("blocked");
    expect(plan.trialScore).toBe(0);
    expect(plan.steps[0]).toMatchObject({
      id: "repair-card",
      status: "fail"
    });
    expect(plan.repairActions.length).toBeGreaterThan(0);
  });

  test("renders unsafe report values as escaped HTML", () => {
    const report = buildAgentCardDiligence(
      "https://evil.example/<script>",
      {
        status: "rejected",
        error: "Bad <script>alert(1)</script>",
        warnings: [],
        signals: []
      } satisfies AgentCardDiscoveryResult,
      "2026-06-20T12:00:00.000Z"
    );
    const plan = buildAgentCardTrialPlan(report, "2026-06-20T12:00:00.000Z");
    const html = renderAgentCardTrialPlanHtml(plan, {
      jsonUrl: "https://proof.example/api/agent-card/trial-plan?url=x",
      markdownUrl: "https://proof.example/agent-card-trial-plan.md?url=x",
      diligenceUrl: "https://proof.example/agent-card-diligence?url=x",
      appUrl: "https://proof.example/#agent-card-intake"
    });

    expect(html).toContain("Agent Card Trial Plan");
    expect(html).toContain("Bad &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("Bad <script>");
    expect(html).not.toContain("https://evil.example/<script>");
  });
});
