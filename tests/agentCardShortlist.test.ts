import { describe, expect, test } from "vitest";
import { buildAgentCardShortlist, MAX_AGENT_CARD_SHORTLIST_URLS, renderAgentCardShortlistHtml, runAgentCardShortlist } from "../server/agentCardShortlist";
import { buildAgentCardDiligence } from "../server/agentCardDiligence";
import type { AgentCardDiscoveryResult } from "../server/agentCardDiscovery";

const PUBLIC_RECORDS = [{ address: "93.184.216.34" }];

const STRONG_CARD = {
  name: "Global Release Steward",
  description: "Runs A2A release handoffs, validates MCP tools, checks Cloud Run evidence, and writes buyer safety receipts.",
  url: "https://agents.example.com/release.json",
  provider: { organization: "Example Agents" },
  defaultInputModes: ["application/json", "text/plain"],
  defaultOutputModes: ["application/json"],
  skills: [
    { id: "release.audit", name: "Release audit", description: "Audits CI, Cloud Run, observability, and A2A proof." },
    { id: "receipt.write", name: "Receipt writer", description: "Writes buyer handoff receipts with acceptance gates." }
  ],
  mcp: { name: "release-steward", tools: ["read_checks", "read_logs", "write_receipt"] }
};

const THIN_CARD = {
  name: "Thin Helper",
  description: "Small helper with limited public trust metadata.",
  skills: [{ id: "helper", name: "Helper", description: "Does a task." }]
};

describe("Agent Card shortlist", () => {
  test("ranks live Agent Card diligence reports into a buyer shortlist", async () => {
    const shortlist = await runAgentCardShortlist(["https://agents.example.com/release.json", "https://agents.example.com/thin.json"], {
      resolveHost: async () => PUBLIC_RECORDS,
      fetchImpl: async (url) =>
        new Response(JSON.stringify(String(url).includes("thin") ? THIN_CARD : { ...STRONG_CARD, url: String(url) }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
    });

    expect(shortlist.verdict).toBe("trial-ready");
    expect(shortlist.candidateCount).toBe(2);
    expect(shortlist.readyCount).toBe(1);
    expect(shortlist.leadCandidate?.agent?.name).toBe("Global Release Steward");
    expect(shortlist.leadCandidate?.recommendation).toBe("lead-trial");
    expect(shortlist.candidates[0]?.fitScore).toBeGreaterThan(shortlist.candidates[1]?.fitScore ?? 0);
    expect(shortlist.exportMarkdown).toContain("Trial-ready: 1");
  });

  test("dedupes and caps candidate URLs before fetching", async () => {
    const fetched: string[] = [];
    const urls = [
      "https://agents.example.com/release.json",
      "https://agents.example.com/release.json",
      "https://agents.example.com/second.json",
      "https://agents.example.com/third.json",
      "https://agents.example.com/fourth.json",
      "https://agents.example.com/fifth.json"
    ];
    const shortlist = await runAgentCardShortlist(urls, {
      resolveHost: async () => PUBLIC_RECORDS,
      fetchImpl: async (url) => {
        fetched.push(String(url));
        return new Response(JSON.stringify({ ...STRONG_CARD, name: String(url), url: String(url) }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
    });

    expect(shortlist.requestedCount).toBe(MAX_AGENT_CARD_SHORTLIST_URLS);
    expect(shortlist.candidateCount).toBe(MAX_AGENT_CARD_SHORTLIST_URLS);
    expect(fetched).toHaveLength(MAX_AGENT_CARD_SHORTLIST_URLS);
  });

  test("renders blocked candidates safely in HTML", () => {
    const blocked = buildAgentCardDiligence(
      "https://evil.example/<script>",
      {
        status: "rejected",
        error: "Bad <script>alert(1)</script>",
        warnings: [],
        signals: []
      } satisfies AgentCardDiscoveryResult,
      "2026-06-20T12:00:00.000Z"
    );
    const shortlist = buildAgentCardShortlist(["https://evil.example/<script>"], [blocked], "2026-06-20T12:00:00.000Z");
    const html = renderAgentCardShortlistHtml(shortlist, {
      jsonUrl: "https://proof.example/api/agent-card/shortlist?url=x",
      markdownUrl: "https://proof.example/agent-card-shortlist.md?url=x",
      appUrl: "https://proof.example/#agent-card-intake"
    });

    expect(shortlist.verdict).toBe("blocked");
    expect(html).toContain("Agent Card Shortlist");
    expect(html).toContain("Bad &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("Bad <script>");
    expect(html).not.toContain("https://evil.example/<script>");
  });
});
