import { describe, expect, it } from "vitest";

import { AGENT_JOBS, A2A_SKILL_TO_AGENT } from "../server/agentJobs.js";
import { getOpsConfig } from "../server/opsAgent.js";
import { MARKET_AGENTS } from "../src/market.js";
import type { JobContext } from "../server/agentJobs.js";
import type { OpsConfig, RawLogEntry } from "../server/opsAgent.js";
import type { MarketAgent } from "../src/types.js";

function makeConfig(overrides: Partial<OpsConfig> = {}): OpsConfig {
  return { ...getOpsConfig({} as NodeJS.ProcessEnv), project: "test-project", ...overrides };
}

function makeCtx(overrides: Partial<JobContext> = {}): JobContext {
  return {
    config: makeConfig(),
    baseUrl: "https://market.example.com",
    fetchImpl: (async () => {
      throw new Error("fetch not stubbed");
    }) as typeof fetch,
    fetchLoggingEvidence: null,
    listLogEntries: null,
    listRuns: async () => [],
    readTextFile: () => null,
    discoverCard: async () => ({ status: "rejected", error: "not stubbed", warnings: [], signals: [] }),
    ...overrides
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" }, ...init });
}

function makeAssessment(): import("../src/agentCardAssessment.js").AgentCardAssessment {
  return {
    score: 80,
    readiness: "hire-ready",
    riskLevel: "low",
    headline: "test assessment",
    checks: [],
    redFlags: [],
    nextActions: [],
    trialTask: { method: "message/send", skillId: "remote.skill.one", objective: "trial", acceptance: [], payload: {} }
  };
}

function makeMarketAgent(overrides: Partial<MarketAgent> = {}): MarketAgent {
  return {
    id: "remote-agent",
    name: "Remote Agent",
    handle: "遠隔",
    stage: "operate",
    rarity: "rare",
    price: 10,
    headline: "リモート能力",
    outcome: "外部タスク",
    color: "#000",
    accent: "#fff",
    capabilities: { autonomy: 50, planning: 50, code: 50, testing: 50, cloudRun: 50, security: 50, observability: 50, ux: 50, mcp: 50, a2a: 50 },
    skills: [],
    mcp: [],
    a2aSkillIds: ["remote.skill.one", "remote.skill.two"],
    synergyTags: [],
    ...overrides
  };
}

describe("AGENT_JOBS registry", () => {
  it("should provide a real-execution job for every market agent", () => {
    for (const agent of MARKET_AGENTS) {
      expect(AGENT_JOBS[agent.id], `missing job for ${agent.id}`).toBeDefined();
    }
    expect(Object.keys(AGENT_JOBS)).toHaveLength(MARKET_AGENTS.length);
  });

  it("should expose unique A2A skill ids mapped back to their agents", () => {
    const skillIds = Object.values(AGENT_JOBS).map((job) => job.skillId);
    expect(new Set(skillIds).size).toBe(skillIds.length);
    for (const job of Object.values(AGENT_JOBS)) {
      expect(A2A_SKILL_TO_AGENT[job.skillId]).toBe(job.agentId);
    }
  });
});

describe("brief-cartographer job", () => {
  const job = AGENT_JOBS["brief-cartographer"];

  it("should split a Japanese brief into citable spans", async () => {
    const bundle = await job.collectEvidence(makeCtx(), "検索機能を作りたい。Cloud Runで動かす必要がある。\n監視も欲しい。");
    expect(bundle.evidence.length).toBe(3);
    expect(bundle.evidence[0].id).toBe("brief-1");
    expect(bundle.evidence[0].message).toContain("検索機能");
  });

  it("should return zero evidence for an empty brief and drop short fragments", async () => {
    expect((await job.collectEvidence(makeCtx(), "")).evidence).toHaveLength(0);
    expect((await job.collectEvidence(makeCtx(), "短い。あ。")).evidence).toHaveLength(0);
  });
});

describe("cloud-run-sre job", () => {
  const job = AGENT_JOBS["cloud-run-sre"];

  it("should resolve cross-project targets and widen the window when the first fetch is empty", async () => {
    const seen: Array<{ project?: string; lookbackMinutes: number }> = [];
    const ctx = makeCtx({
      config: makeConfig({ targetAllowlist: ["agent-guild", "other-project/remote-svc"] }),
      fetchLoggingEvidence: async ({ project, lookbackMinutes }) => {
        seen.push({ project, lookbackMinutes });
        return lookbackMinutes === 1440 ? [{ id: "log-1", timestamp: "", severity: "ERROR", service: "remote-svc", message: "boom" }] : [];
      }
    });
    const bundle = await job.collectEvidence(ctx, "remote-svc");
    expect(seen.map((s) => s.project)).toEqual(["other-project", "other-project"]);
    expect(bundle.windowMinutes).toBe(1440);
    expect(bundle.evidence).toHaveLength(1);
  });

  it("should throw when Cloud Logging is not configured", async () => {
    await expect(job.collectEvidence(makeCtx({ fetchLoggingEvidence: null }), "")).rejects.toThrow("Cloud Logging未構成");
  });
});

describe("market-broker job", () => {
  const job = AGENT_JOBS["market-broker"];

  it("should evaluate the card and actually delegate when same-origin", async () => {
    const posts: string[] = [];
    const ctx = makeCtx({
      discoverCard: async () => ({
        status: "accepted",
        agent: makeMarketAgent(),
        assessment: makeAssessment(),
        warnings: [],
        signals: [],
        discoveredUrl: "https://market.example.com/.well-known/agent-card.json"
      }),
      fetchImpl: (async (url: RequestInfo | URL) => {
        posts.push(String(url));
        return jsonResponse({ jsonrpc: "2.0", id: "x", result: { id: "task-123", status: { state: "working" } } });
      }) as typeof fetch
    });
    const bundle = await job.collectEvidence(ctx, "");
    const ids = bundle.evidence.map((e) => e.id);
    expect(ids).toContain("card-name");
    expect(ids).toContain("card-skill-remote.skill.one");
    expect(ids).toContain("delegate-task");
    expect(bundle.evidence.find((e) => e.id === "delegate-task")?.message).toContain("task-123");
    expect(posts).toEqual(["https://market.example.com/a2a"]);
  });

  it("should not POST to external origins (policy evidence instead)", async () => {
    const ctx = makeCtx({
      discoverCard: async () => ({
        status: "accepted",
        agent: makeMarketAgent(),
        assessment: makeAssessment(),
        warnings: [],
        signals: [],
        discoveredUrl: "https://external.example.org/.well-known/agent-card.json"
      })
    });
    const bundle = await job.collectEvidence(ctx, "https://external.example.org/.well-known/agent-card.json");
    const ids = bundle.evidence.map((e) => e.id);
    expect(ids).toContain("delegate-policy");
    expect(ids).not.toContain("delegate-task");
  });

  it("should surface a rejection as error evidence", async () => {
    const bundle = await job.collectEvidence(makeCtx({ discoverCard: async () => ({ status: "rejected", error: "blocked host", warnings: [], signals: [] }) }), "");
    expect(bundle.evidence[0].id).toBe("card-error");
    expect(bundle.evidence[0].severity).toBe("ERROR");
  });
});

describe("test-forge job", () => {
  const job = AGENT_JOBS["test-forge"];

  it("should collect real CI runs and live contract probes", async () => {
    const ctx = makeCtx({
      fetchImpl: (async (url: RequestInfo | URL) => {
        const href = String(url);
        if (href.includes("api.github.com")) {
          return jsonResponse({
            workflow_runs: [
              { id: 111, name: "CI", head_branch: "main", status: "completed", conclusion: "success", display_title: "green build", created_at: "2026-07-10T00:00:00Z" },
              { id: 222, name: "CI", head_branch: "main", status: "completed", conclusion: "failure", display_title: "broken build", created_at: "2026-07-10T01:00:00Z" }
            ]
          });
        }
        if (href.endsWith("/api/healthz")) return jsonResponse({ ok: true });
        if (href.endsWith("/agent-card.json")) return jsonResponse({ skills: [1, 2, 3] });
        if (href.endsWith("/a2a")) return jsonResponse({ jsonrpc: "2.0", id: "probe", result: {} });
        throw new Error(`unexpected fetch: ${href}`);
      }) as typeof fetch
    });
    const bundle = await job.collectEvidence(ctx, "");
    const ids = bundle.evidence.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(["ci-111", "ci-222", "probe-healthz", "probe-card", "probe-a2a"]));
    expect(bundle.evidence.find((e) => e.id === "ci-222")?.severity).toBe("ERROR");
    expect(bundle.evidence.find((e) => e.id === "probe-a2a")?.message).toContain("適合");
  });

  it("should degrade gracefully when the GitHub API is rate limited", async () => {
    const ctx = makeCtx({
      fetchImpl: (async (url: RequestInfo | URL) => {
        const href = String(url);
        if (href.includes("api.github.com")) return jsonResponse({ message: "rate limited" }, { status: 403 });
        return jsonResponse({ ok: true, jsonrpc: "2.0", skills: [] });
      }) as typeof fetch
    });
    const bundle = await job.collectEvidence(ctx, "");
    expect(bundle.evidence.find((e) => e.id === "ci-error")?.message).toContain("403");
  });
});

describe("security-sentinel job", () => {
  const job = AGENT_JOBS["security-sentinel"];
  const pkgFixture = JSON.stringify({ dependencies: { express: "^5.2.1", zod: "^4.3.0" } });
  const lockFixture = JSON.stringify({ packages: { "node_modules/express": { version: "5.2.1" }, "node_modules/zod": { version: "4.3.0" } } });

  it("should report real OSV vulnerabilities against locked versions", async () => {
    const osvBodies: string[] = [];
    const ctx = makeCtx({
      readTextFile: (path) => (path === "package.json" ? pkgFixture : path === "package-lock.json" ? lockFixture : null),
      fetchImpl: (async (url: RequestInfo | URL, init?: RequestInit) => {
        const href = String(url);
        if (href.includes("api.osv.dev")) {
          osvBodies.push(String(init?.body ?? ""));
          return jsonResponse({ results: [{ vulns: [{ id: "GHSA-test-1234" }] }, {}] });
        }
        return new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } });
      }) as typeof fetch
    });
    const bundle = await job.collectEvidence(ctx, "");
    const ids = bundle.evidence.map((e) => e.id);
    expect(ids).toContain("deps-count");
    expect(ids).toContain("osv-express");
    expect(bundle.evidence.find((e) => e.id === "osv-express")?.message).toContain("GHSA-test-1234");
    expect(osvBodies[0]).toContain('"5.2.1"');
    expect(ids).toContain("hdr-powered");
  });

  it("should report a clean OSV result when no vulnerabilities exist", async () => {
    const ctx = makeCtx({
      readTextFile: (path) => (path === "package.json" ? pkgFixture : null),
      fetchImpl: (async (url: RequestInfo | URL) => {
        if (String(url).includes("api.osv.dev")) return jsonResponse({ results: [{}, {}] });
        return new Response("<html></html>", { status: 200 });
      }) as typeof fetch
    });
    const bundle = await job.collectEvidence(ctx, "");
    expect(bundle.evidence.map((e) => e.id)).toContain("osv-clean");
  });
});

describe("ux-guildmaster job", () => {
  const job = AGENT_JOBS["ux-guildmaster"];

  it("should extract real facts from the served HTML", async () => {
    const html = '<html lang="ja"><head><title>Agent Market</title><meta name="viewport" content="w"><meta property="og:title" content="x"></head><body><h1>市場</h1><img src="a.png"><img src="b.png" alt="hero"></body></html>';
    const ctx = makeCtx({
      fetchImpl: (async () => new Response(html, { status: 200, headers: { "content-type": "text/html" } })) as typeof fetch
    });
    const bundle = await job.collectEvidence(ctx, "");
    const byId = new Map(bundle.evidence.map((e) => [e.id, e]));
    expect(byId.get("html-title")?.message).toContain("Agent Market");
    expect(byId.get("html-lang")?.message).toContain("ja");
    expect(byId.get("html-imgalt")?.message).toContain("alt欠落 1枚");
    expect(byId.get("html-imgalt")?.severity).toBe("WARNING");
    expect(byId.get("html-desc")?.severity).toBe("WARNING");
  });
});

describe("observability-oracle job", () => {
  const job = AGENT_JOBS["observability-oracle"];

  it("should compute latency percentiles and status distribution from real request logs", async () => {
    const entries: RawLogEntry[] = [
      { httpRequest: { status: 200, latency: "0.100s", requestUrl: "https://x/api/healthz" } },
      { httpRequest: { status: 200, latency: "0.200s", requestUrl: "https://x/api/healthz" } },
      { httpRequest: { status: 500, latency: "1.500s", requestUrl: "https://x/a2a" } }
    ];
    const ctx = makeCtx({ listLogEntries: async () => entries });
    const bundle = await job.collectEvidence(ctx, "");
    const byId = new Map(bundle.evidence.map((e) => [e.id, e]));
    expect(byId.get("met-requests")?.message).toContain("3件");
    expect(byId.get("met-status")?.message).toContain("5xx=1");
    expect(byId.get("met-status")?.severity).toBe("WARNING");
    expect(byId.get("met-latency")?.message).toMatch(/p95=1500ms/);
    expect(byId.get("path-1")?.message).toContain("/api/healthz");
    expect(byId.get("loop-stats")).toBeDefined();
  });

  it("should throw when Cloud Logging is not configured", async () => {
    await expect(job.collectEvidence(makeCtx({ listLogEntries: null }), "")).rejects.toThrow("Cloud Logging未構成");
  });
});

describe("gemini-strategist job", () => {
  const job = AGENT_JOBS["gemini-strategist"];

  it("should gather live health, run statistics, judging criteria and brief spans", async () => {
    const ctx = makeCtx({
      fetchImpl: (async () => jsonResponse({ ok: true, model: "gemini-3.5-flash", geminiMode: "vertex", opsAgent: { enabled: true, runStore: "firestore" } })) as typeof fetch,
      listRuns: async () => []
    });
    const bundle = await job.collectEvidence(ctx, "審査で勝てる編成にしたい。実行の証拠を強くする。");
    const ids = bundle.evidence.map((e) => e.id);
    expect(ids).toContain("live-health");
    expect(ids).toContain("run-stats");
    expect(ids).toContain("criteria-1");
    expect(ids).toContain("brief-1");
  });
});
