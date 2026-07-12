import { describe, expect, it } from "vitest";

import { computeAgentStats, computeEvidenceSummary, rankFromRecord } from "../server/agentStats.js";
import type { Finding, OpsAgentRun } from "../server/opsAgent.js";

function makeFinding(accepted: boolean, verdict: Finding["checker"]["verdict"] = accepted ? "confirmed" : "refuted"): Finding {
  return {
    title: "所見",
    severity: "medium",
    hypothesis: "根拠",
    recommendedAction: "対応",
    citedLogIds: ["log-1"],
    gate: { citationsValid: true, invalidCitations: [] },
    checker: { verdict, reason: "検証済み" },
    accepted
  };
}

function makeRun(agentId: string, overrides: Partial<OpsAgentRun> = {}): OpsAgentRun {
  return {
    id: `run-${agentId}-${Math.random().toString(36).slice(2, 8)}`,
    agentId,
    targetService: "agent-guild",
    trigger: "web",
    status: "completed",
    phases: [],
    evidenceCount: 3,
    evidenceWindowMinutes: 180,
    evidenceSample: [],
    serviceHealth: "healthy",
    summary: "要約",
    findings: [makeFinding(true), makeFinding(false)],
    escalations: [],
    usage: { promptTokens: 100, outputTokens: 50, totalTokens: 150, estimatedCostUsd: 0.001 },
    model: "gemini-3.5-flash",
    mode: "vertex",
    startedAt: "2026-07-11T00:00:00.000Z",
    ...overrides
  };
}

describe("rankFromRecord", () => {
  it("assigns ranks only from real accepted work", () => {
    expect(rankFromRecord(0, null)).toBe("-");
    expect(rankFromRecord(1, 0.5)).toBe("C");
    expect(rankFromRecord(3, 0.5)).toBe("B");
    expect(rankFromRecord(6, 0.5)).toBe("A");
    expect(rankFromRecord(10, 0.7)).toBe("S");
    // 受入数が多くても受入率が低ければSにならない
    expect(rankFromRecord(10, 0.5)).toBe("A");
  });
});

describe("computeAgentStats", () => {
  it("aggregates runs, findings, cost, and last activity per agent", () => {
    const runs = [
      makeRun("cloud-run-sre", { startedAt: "2026-07-11T01:00:00.000Z" }),
      makeRun("cloud-run-sre", { status: "failed", findings: [], startedAt: "2026-07-11T02:00:00.000Z" }),
      makeRun("security-sentinel", { findings: [makeFinding(true), makeFinding(true, "uncertain")] })
    ];
    const stats = computeAgentStats(runs, ["cloud-run-sre", "security-sentinel", "ux-guildmaster"]);
    const sre = stats.find((stat) => stat.agentId === "cloud-run-sre");
    const sentinel = stats.find((stat) => stat.agentId === "security-sentinel");
    const ux = stats.find((stat) => stat.agentId === "ux-guildmaster");

    expect(sre).toMatchObject({ runs: 2, completed: 1, failed: 1, findings: 2, accepted: 1, confirmed: 1, rank: "C" });
    expect(sre?.acceptRate).toBe(0.5);
    expect(sre?.costUsd).toBe(0.002);
    expect(sre?.avgCostUsd).toBe(0.001);
    expect(sre?.lastRunAt).toBe("2026-07-11T02:00:00.000Z");

    expect(sentinel).toMatchObject({ runs: 1, findings: 2, accepted: 2, confirmed: 1 });
    expect(sentinel?.acceptRate).toBe(1);

    // ラン実績ゼロのエージェントも0埋めで返す (実績が無いことを正直に表示するため)
    expect(ux).toMatchObject({ runs: 0, findings: 0, accepted: 0, rank: "-", acceptRate: null, avgCostUsd: null, lastRunAt: null });
  });

  it("includes agents that ran but are outside the requested catalog", () => {
    const stats = computeAgentStats([makeRun("retired-agent")], ["cloud-run-sre"]);
    expect(stats.map((stat) => stat.agentId).sort()).toEqual(["cloud-run-sre", "retired-agent"]);
  });

  it("handles empty runs and empty catalog without throwing", () => {
    expect(computeAgentStats([], [])).toEqual([]);
    expect(computeAgentStats([], ["cloud-run-sre"])).toHaveLength(1);
  });
});

describe("computeEvidenceSummary", () => {
  it("aggregates cost, tokens, run outcomes, and executed agents across the sample", () => {
    const runs = [
      makeRun("cloud-run-sre"),
      makeRun("cloud-run-sre", { status: "failed", findings: [] }),
      makeRun("security-sentinel", { findings: [makeFinding(true), makeFinding(true, "uncertain")] })
    ];
    const summary = computeEvidenceSummary(runs, ["cloud-run-sre", "security-sentinel", "ux-guildmaster"]);

    expect(summary.totalAgents).toBe(3);
    expect(summary.executedAgents).toBe(2); // sre と sentinel は実行済み、ux は未実行
    expect(summary.sampleRuns).toBe(3);
    expect(summary.completedRuns).toBe(2);
    expect(summary.failedRuns).toBe(1);
    expect(summary.totalFindings).toBe(4); // 2 + 0 + 2
    expect(summary.acceptedFindings).toBe(3); // 1 + 0 + 2
    expect(summary.confirmedFindings).toBe(2); // confirmed のみ (uncertain は数えない)
    expect(summary.totalCostUsd).toBe(0.003); // 0.001 × 3
    expect(summary.totalTokens).toBe(450); // 150 × 3
    expect(summary.acceptRate).toBe(0.75); // 3 / 4
    expect(summary.lastRunAt).toBe("2026-07-11T00:00:00.000Z");
  });

  it("returns zeroed totals for an empty sample without throwing", () => {
    const summary = computeEvidenceSummary([], ["cloud-run-sre"]);
    expect(summary).toMatchObject({
      totalAgents: 1,
      executedAgents: 0,
      sampleRuns: 0,
      completedRuns: 0,
      failedRuns: 0,
      totalFindings: 0,
      acceptedFindings: 0,
      confirmedFindings: 0,
      totalCostUsd: 0,
      totalTokens: 0,
      acceptRate: null,
      lastRunAt: null
    });
  });
});
