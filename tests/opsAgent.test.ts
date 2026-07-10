import { describe, expect, it } from "vitest";

import {
  applyCitationGate,
  createRun,
  executeAgentRun,
  getOpsConfig,
  parseModelJson,
  redactSensitiveText,
  resolveTarget,
  summarizeLogEntry
} from "../server/opsAgent.js";
import { createMemoryRunStore } from "../server/runStore.js";
import type { AgentJobRuntime, GenAIClient, LogEvidence, OpsConfig } from "../server/opsAgent.js";

function makeConfig(overrides: Partial<OpsConfig> = {}): OpsConfig {
  return { ...getOpsConfig({} as NodeJS.ProcessEnv), project: "test-project", ...overrides };
}

function makeEvidence(id: string, overrides: Partial<LogEvidence> = {}): LogEvidence {
  return {
    id,
    timestamp: "2026-07-10T00:00:00Z",
    severity: "ERROR",
    service: "a2a-agent-marketplace",
    message: "upstream timeout to payments-api",
    ...overrides
  };
}

function makeGenAiStub(outputs: string[]): { genAi: { client: GenAIClient; mode: "vertex" }; calls: () => number } {
  let calls = 0;
  const client: GenAIClient = {
    models: {
      async generateContent() {
        const text = outputs[calls] ?? outputs[outputs.length - 1];
        calls += 1;
        if (text === "__THROW__") throw new Error("stub failure");
        return { text, usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50, totalTokenCount: 150 } };
      }
    }
  };
  return { genAi: { client, mode: "vertex" }, calls: () => calls };
}

function makeJob(evidence: LogEvidence[], overrides: Partial<AgentJobRuntime> = {}): AgentJobRuntime {
  return {
    makerRole: "You are a test agent.",
    checkerRole: "You are a test reviewer.",
    emptyNote: "証拠がないため対象なし",
    collectEvidence: async () => ({ evidence }),
    ...overrides
  };
}

function makerJson(citedLogIds: string[], severity = "high") {
  return JSON.stringify({
    serviceHealth: "degraded",
    summary: "支払いAPIへのタイムアウトが発生している。",
    findings: [
      {
        title: "payments-api タイムアウト",
        severity,
        hypothesis: "上流サービスの遅延",
        recommendedAction: "gcloud run services describe payments-api で確認",
        citedLogIds
      }
    ]
  });
}

const CHECKER_CONFIRM = JSON.stringify({ reviews: [{ index: 0, verdict: "confirmed", reason: "ログと整合" }] });
const CHECKER_REFUTE = JSON.stringify({ reviews: [{ index: 0, verdict: "refuted", reason: "証拠に該当記録なし" }] });

describe("redactSensitiveText", () => {
  it("masks bearer tokens, API keys, emails, and key=value secrets", () => {
    // 疑似シークレットは動的組み立て (secret-leak-guard対策 — 実値ではない)
    const fakeBearer = "Bearer " + "abcdef1234567890";
    const fakeGoogleKey = "AIza" + "A".repeat(35);
    const fakeEmail = ["admin", "example.com"].join("@");
    const fakeKeyValue = ["api", 'key="fakefakefake123"'].join("_");
    const output = redactSensitiveText([`authorization: ${fakeBearer}`, `key ${fakeGoogleKey} leaked`, `contact ${fakeEmail}`, fakeKeyValue].join(" | "));
    expect(output).not.toContain("abcdef1234567890");
    expect(output).not.toContain(fakeGoogleKey);
    expect(output).not.toContain(fakeEmail);
    expect(output).not.toContain("fakefakefake123");
  });

  it("keeps ordinary log text and empty input unchanged", () => {
    expect(redactSensitiveText("GET /healthz -> 200 レイテンシ12ms")).toBe("GET /healthz -> 200 レイテンシ12ms");
    expect(redactSensitiveText("")).toBe("");
  });
});

describe("summarizeLogEntry", () => {
  it("prefers textPayload and truncates to 240 chars", () => {
    const summarized = summarizeLogEntry({ insertId: "abc", timestamp: "t", severity: "WARNING", textPayload: `  ${"x".repeat(500)}  ` }, 0);
    expect(summarized.id).toBe("abc");
    expect(summarized.message.length).toBe(240);
  });

  it("falls back to jsonPayload message and synthesizes id when insertId missing", () => {
    const summarized = summarizeLogEntry({ jsonPayload: { msg: "request completed" } }, 3);
    expect(summarized.id).toBe("evt-3");
    expect(summarized.message).toBe("request completed");
  });

  it("handles empty entries without throwing", () => {
    const summarized = summarizeLogEntry({}, 0);
    expect(summarized.message).toBe("(no payload)");
    expect(summarized.severity).toBe("DEFAULT");
  });
});

describe("applyCitationGate", () => {
  const evidenceIds = new Set(["log-1", "log-2"]);

  it("passes findings whose citations all exist", () => {
    const gates = applyCitationGate([{ title: "t", severity: "high", hypothesis: "h", recommendedAction: "a", citedLogIds: ["log-1"] }], evidenceIds);
    expect(gates[0]).toEqual({ citationsValid: true, invalidCitations: [] });
  });

  it("rejects fabricated citations (hallucination gate)", () => {
    const gates = applyCitationGate(
      [{ title: "t", severity: "high", hypothesis: "h", recommendedAction: "a", citedLogIds: ["log-1", "fake-99"] }],
      evidenceIds
    );
    expect(gates[0].citationsValid).toBe(false);
    expect(gates[0].invalidCitations).toEqual(["fake-99"]);
  });

  it("returns empty array for empty findings", () => {
    expect(applyCitationGate([], evidenceIds)).toEqual([]);
  });
});

describe("parseModelJson", () => {
  it("parses plain JSON, fenced JSON, and JSON with surrounding prose", () => {
    expect(parseModelJson('{"a":1}')).toEqual({ a: 1 });
    expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseModelJson('note {"a":1} end')).toEqual({ a: 1 });
  });
});

describe("executeAgentRun", () => {
  const config = makeConfig();

  it("completes the full loop: evidence -> maker -> gate -> checker -> decide", async () => {
    const { genAi, calls } = makeGenAiStub([makerJson(["log-1"]), CHECKER_CONFIRM]);
    const store = createMemoryRunStore();
    const run = createRun("cloud-run-sre", "a2a-agent-marketplace", "web", { config, genAi });
    const result = await executeAgentRun(run, {
      config,
      genAi,
      job: makeJob([makeEvidence("log-1"), makeEvidence("log-2", { severity: "WARNING" })]),
      store
    });

    expect(result.status).toBe("completed");
    expect(result.evidenceCount).toBe(2);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].accepted).toBe(true);
    expect(result.findings[0].checker.verdict).toBe("confirmed");
    expect(result.escalations).toHaveLength(1);
    expect(result.escalations[0].status).toBe("pending-human");
    expect(result.usage.totalTokens).toBe(300);
    expect(result.usage.estimatedCostUsd).toBeGreaterThan(0);
    expect(result.phases.map((p) => p.phase)).toEqual(["evidence", "triage", "gate", "review", "decide"]);
    expect(calls()).toBe(2);
    const persisted = await store.getRun(run.id);
    expect(persisted?.status).toBe("completed");
  });

  it("rejects findings with fabricated citations via the objective gate", async () => {
    const { genAi } = makeGenAiStub([makerJson(["fake-id"]), CHECKER_CONFIRM]);
    const run = createRun("cloud-run-sre", "a2a-agent-marketplace", "web", { config, genAi });
    const result = await executeAgentRun(run, {
      config,
      genAi,
      job: makeJob([makeEvidence("log-1")]),
      store: createMemoryRunStore()
    });

    expect(result.status).toBe("completed");
    expect(result.findings[0].gate.citationsValid).toBe(false);
    expect(result.findings[0].accepted).toBe(false);
    expect(result.escalations).toHaveLength(0);
  });

  it("drops findings the independent checker refutes (maker != checker)", async () => {
    const { genAi } = makeGenAiStub([makerJson(["log-1"]), CHECKER_REFUTE]);
    const run = createRun("cloud-run-sre", "a2a-agent-marketplace", "web", { config, genAi });
    const result = await executeAgentRun(run, {
      config,
      genAi,
      job: makeJob([makeEvidence("log-1")]),
      store: createMemoryRunStore()
    });

    expect(result.findings[0].gate.citationsValid).toBe(true);
    expect(result.findings[0].checker.verdict).toBe("refuted");
    expect(result.findings[0].accepted).toBe(false);
  });

  it("completes without calling Gemini when no evidence exists (cost 0)", async () => {
    const { genAi, calls } = makeGenAiStub([makerJson(["log-1"])]);
    const run = createRun("cloud-run-sre", "a2a-agent-marketplace", "web", { config, genAi });
    const result = await executeAgentRun(run, {
      config,
      genAi,
      job: makeJob([]),
      store: createMemoryRunStore()
    });

    expect(result.status).toBe("completed");
    expect(result.summary).toBe("証拠がないため対象なし");
    expect(result.findings).toHaveLength(0);
    expect(result.usage.totalTokens).toBe(0);
    expect(calls()).toBe(0);
  });

  it("fails with a hard stop when the time budget is exceeded", async () => {
    const { genAi } = makeGenAiStub([makerJson(["log-1"])]);
    const run = createRun("cloud-run-sre", "a2a-agent-marketplace", "web", { config, genAi });
    const result = await executeAgentRun(run, {
      config,
      genAi,
      job: makeJob([makeEvidence("log-1")]),
      store: createMemoryRunStore(),
      timeBudgetMs: -1
    });

    expect(result.status).toBe("failed");
    expect(result.error).toContain("hard stop");
  });


  it("marks findings uncertain instead of crashing when the checker call fails", async () => {
    const { genAi } = makeGenAiStub([makerJson(["log-1"]), "__THROW__"]);
    const run = createRun("cloud-run-sre", "a2a-agent-marketplace", "web", { config, genAi });
    const result = await executeAgentRun(run, {
      config,
      genAi,
      job: makeJob([makeEvidence("log-1")]),
      store: createMemoryRunStore()
    });

    expect(result.status).toBe("completed");
    expect(result.findings[0].checker.verdict).toBe("uncertain");
    expect(result.findings[0].accepted).toBe(true);
  });
});

describe("getOpsConfig", () => {
  it("applies defaults and parses the allowlist", () => {
    const config = getOpsConfig({ OPS_TARGET_ALLOWLIST: "svc-a, svc-b" } as NodeJS.ProcessEnv);
    expect(config.targetService).toBe("a2a-agent-marketplace");
    expect(config.targetAllowlist).toEqual(["svc-a", "svc-b"]);
    expect(config.model).toBe("gemini-3.5-flash");
  });

  it("accepts project/service allowlist entries and defaults to the personal GCP target", () => {
    const config = getOpsConfig({ OPS_TARGET_ALLOWLIST: "svc-a,other-project/svc-b" } as NodeJS.ProcessEnv);
    expect(config.targetAllowlist).toEqual(["svc-a", "other-project/svc-b"]);
    expect(getOpsConfig({} as NodeJS.ProcessEnv).targetAllowlist).toEqual(["a2a-agent-marketplace", "aitech-good-a13973/vibementor-ai"]);
  });
});

describe("resolveTarget", () => {
  const config = makeConfig({ targetAllowlist: ["a2a-agent-marketplace", "aitech-good-a13973/vibementor-ai"] });

  it("resolves a bare allowlist entry to the default project", () => {
    expect(resolveTarget(config, "a2a-agent-marketplace")).toEqual({ service: "a2a-agent-marketplace", project: "test-project" });
  });

  it("resolves a project/service entry to its own project", () => {
    expect(resolveTarget(config, "vibementor-ai")).toEqual({ service: "vibementor-ai", project: "aitech-good-a13973" });
  });

  it("falls back to the default target when the requested service is not allowlisted", () => {
    expect(resolveTarget(config, "chiebukuro-app")).toEqual({ service: "a2a-agent-marketplace", project: "test-project" });
    expect(resolveTarget(config, undefined)).toEqual({ service: "a2a-agent-marketplace", project: "test-project" });
  });

  it("handles an empty allowlist and empty service name without throwing", () => {
    expect(resolveTarget(makeConfig({ targetAllowlist: [] }), "anything")).toEqual({ service: "a2a-agent-marketplace", project: "test-project" });
    expect(resolveTarget(config, "")).toEqual({ service: "a2a-agent-marketplace", project: "test-project" });
  });
});
