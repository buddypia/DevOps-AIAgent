import { describe, expect, test } from "vitest";
import { buildAgentCardDiligence, renderAgentCardDiligenceHtml, runAgentCardDiligence } from "../server/agentCardDiligence";
import type { AgentCardDiscoveryResult } from "../server/agentCardDiscovery";

const PUBLIC_RECORDS = [{ address: "93.184.216.34" }];
const PRIVATE_RECORDS = [{ address: "10.0.0.4" }];

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

describe("Agent Card diligence report", () => {
  test("runs live discovery dependencies and approves a strong card for supervised trial", async () => {
    const report = await runAgentCardDiligence("https://agents.example.com", {
      resolveHost: async () => PUBLIC_RECORDS,
      fetchImpl: async (url) =>
        new Response(JSON.stringify({ ...STRONG_CARD, url: String(url) }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
    });

    expect(report.status).toBe("accepted");
    expect(report.decision).toBe("approve-supervised-trial");
    expect(report.score).toBeGreaterThanOrEqual(82);
    expect(report.discoveredUrl).toBe("https://agents.example.com/.well-known/agent-card.json");
    expect(report.agent?.name).toBe("Global Release Steward");
    expect(report.checks.map((check) => check.owner)).toContain("Provider");
    expect(report.trialTask?.method).toBe("message/send");
    expect(report.exportMarkdown).toContain("Decision: approve-supervised-trial");
  });

  test("returns a blocked diligence report when discovery fails before fetch", async () => {
    let fetched = false;
    const report = await runAgentCardDiligence("https://agents.example.com", {
      resolveHost: async () => PRIVATE_RECORDS,
      fetchImpl: async () => {
        fetched = true;
        return new Response(JSON.stringify(STRONG_CARD), { status: 200 });
      }
    });

    expect(fetched).toBe(false);
    expect(report.status).toBe("rejected");
    expect(report.decision).toBe("do-not-use");
    expect(report.score).toBe(0);
    expect(report.redFlags.join(" ")).toContain("private");
    expect(report.exportMarkdown).toContain("Do not use this Agent Card");
  });

  test("escapes report values in HTML while preserving action links", () => {
    const report = buildAgentCardDiligence(
      "https://evil.example/<script>",
      {
        status: "rejected",
        error: "Bad <script>alert(1)</script>",
        warnings: ["Warn <b>"],
        signals: []
      } satisfies AgentCardDiscoveryResult,
      "2026-06-20T12:00:00.000Z"
    );

    const html = renderAgentCardDiligenceHtml(report, {
      jsonUrl: "https://proof.example/api/agent-card/diligence?url=x",
      markdownUrl: "https://proof.example/agent-card-diligence.md?url=x",
      appUrl: "https://proof.example/#agent-card-intake"
    });

    expect(html).toContain("Agent Card Diligence");
    expect(html).toContain("https://proof.example/api/agent-card/diligence?url=x");
    expect(html).toContain("Bad &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("Bad <script>");
    expect(html).not.toContain("https://evil.example/<script>");
  });
});
