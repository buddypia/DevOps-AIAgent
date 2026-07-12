import { describe, expect, it } from "vitest";

import { applyReportCitationGate, createMission, executeMission, sanitizePlanSteps } from "../server/missionAgent.js";
import { createMemoryRunStore } from "../server/runStore.js";
import type { Mission, MissionCatalogEntry, MissionDeps } from "../server/missionAgent.js";
import type { Finding, GenAIClient, OpsAgentRun } from "../server/opsAgent.js";

const CATALOG: MissionCatalogEntry[] = [
  { agentId: "cloud-run-sre", title: "実ログSREトリアージ", description: "Cloud Loggingの実ログをトリアージ", inputHint: "サービス名 (空でも可)" },
  { agentId: "security-sentinel", title: "実脆弱性スキャン", description: "OSV.devへ実照会", inputHint: "入力不要" },
  { agentId: "ux-guildmaster", title: "実HTML UX監査", description: "配信中HTMLを監査", inputHint: "入力不要" }
];

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    title: "payments-api タイムアウト",
    severity: "high",
    hypothesis: "上流の遅延",
    recommendedAction: "サービス状態を確認",
    citedLogIds: ["log-1"],
    gate: { citationsValid: true, invalidCitations: [] },
    checker: { verdict: "confirmed", reason: "ログと整合" },
    accepted: true,
    ...overrides
  };
}

function makeRun(agentId: string, overrides: Partial<OpsAgentRun> = {}): OpsAgentRun {
  return {
    id: `run-${agentId}`,
    agentId,
    targetService: "agent-guild",
    trigger: "mission",
    status: "completed",
    phases: [],
    evidenceCount: 3,
    evidenceWindowMinutes: 180,
    evidenceSample: [],
    serviceHealth: "degraded",
    summary: `${agentId} のラン結果`,
    findings: [makeFinding()],
    escalations: [],
    usage: { promptTokens: 100, outputTokens: 50, totalTokens: 150, estimatedCostUsd: 0.0002 },
    model: "gemini-3.5-flash",
    mode: "vertex",
    startedAt: "2026-07-11T00:00:00.000Z",
    finishedAt: "2026-07-11T00:00:30.000Z",
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
        return { text, usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 80, totalTokenCount: 280 } };
      }
    }
  };
  return { genAi: { client, mode: "vertex" }, calls: () => calls };
}

function planJson(steps: Array<{ agentId: string; input?: string; reason?: string }>) {
  return JSON.stringify({
    planSummary: "SREとセキュリティで総点検する",
    steps: steps.map((step) => ({ agentId: step.agentId, input: step.input ?? "", reason: step.reason ?? "目標達成に必要" }))
  });
}

const ADAPT_CONTINUE = JSON.stringify({ action: "continue", note: "計画どおり続行" });

function reportJson(keyFindings: Array<{ agentId: string; runId: string }>) {
  return JSON.stringify({
    verdict: "partial",
    headline: "検出された高リスクは1件、対応可能",
    summary: "SREトリアージで高リスクを検出した。セキュリティは問題なし。",
    keyFindings: keyFindings.map((finding) => ({
      title: "payments-api タイムアウト",
      severity: "high",
      agentId: finding.agentId,
      runId: finding.runId,
      action: "サービス状態を確認する"
    })),
    nextActions: ["エスカレーションを承認する"]
  });
}

function makeDeps(
  outputs: string[],
  overrides: Partial<MissionDeps> = {}
): { deps: MissionDeps; store: ReturnType<typeof createMemoryRunStore>; calls: () => number; executed: string[] } {
  const { genAi, calls } = makeGenAiStub(outputs);
  const store = createMemoryRunStore();
  const executed: string[] = [];
  const deps: MissionDeps = {
    genAi,
    model: "gemini-3.5-flash",
    catalog: CATALOG,
    runAgent: async (agentId) => {
      executed.push(agentId);
      return makeRun(agentId);
    },
    store,
    costInputPerMTok: 0.3,
    costOutputPerMTok: 2.5,
    ...overrides
  };
  return { deps, store, calls, executed };
}

function newMission(goal = "本番サービスの稼働リスクを総点検して"): Mission {
  return createMission(goal, "web", "gemini-3.5-flash", "vertex");
}

describe("sanitizePlanSteps", () => {
  it("drops unknown agentIds, dedupes, clamps to 4 steps, and truncates long fields", () => {
    const steps = sanitizePlanSteps(
      [
        { agentId: "cloud-run-sre", input: "x".repeat(1000), reason: "r".repeat(1000) },
        { agentId: "cloud-run-sre", input: "", reason: "重複" },
        { agentId: "not-a-real-agent", input: "", reason: "未知" },
        { agentId: "security-sentinel", input: "", reason: "必要" },
        { agentId: "ux-guildmaster", input: "", reason: "必要" }
      ],
      CATALOG
    );
    expect(steps.map((step) => step.agentId)).toEqual(["cloud-run-sre", "security-sentinel", "ux-guildmaster"]);
    expect(steps[0].input.length).toBe(600);
    expect(steps[0].reason.length).toBe(300);
  });

  it("returns empty for empty input or fully-unknown plans", () => {
    expect(sanitizePlanSteps([], CATALOG)).toEqual([]);
    expect(sanitizePlanSteps([{ agentId: "ghost", input: "", reason: "x" }], CATALOG)).toEqual([]);
  });
});

describe("applyReportCitationGate", () => {
  const runsById = new Map([["run-cloud-run-sre", makeRun("cloud-run-sre")]]);

  it("validates findings whose runId and agentId match an executed run", () => {
    const gated = applyReportCitationGate(
      [{ title: "t", severity: "high", agentId: "cloud-run-sre", runId: "run-cloud-run-sre", action: "a" }],
      runsById
    );
    expect(gated[0].citationValid).toBe(true);
  });

  it("rejects fabricated runIds and mismatched agentIds", () => {
    const gated = applyReportCitationGate(
      [
        { title: "t", severity: "high", agentId: "cloud-run-sre", runId: "run-fake", action: "a" },
        { title: "t", severity: "high", agentId: "security-sentinel", runId: "run-cloud-run-sre", action: "a" }
      ],
      runsById
    );
    expect(gated.map((finding) => finding.citationValid)).toEqual([false, false]);
  });
});

describe("executeMission", () => {
  it("runs the full autonomous loop: plan -> real runs -> adapt -> gated report", async () => {
    const { deps, store, calls, executed } = makeDeps([
      planJson([{ agentId: "cloud-run-sre" }, { agentId: "security-sentinel" }]),
      ADAPT_CONTINUE,
      ADAPT_CONTINUE,
      reportJson([{ agentId: "cloud-run-sre", runId: "run-cloud-run-sre" }])
    ]);
    const mission = newMission();
    const result = await executeMission(mission, deps);

    expect(result.status).toBe("completed");
    expect(executed).toEqual(["cloud-run-sre", "security-sentinel"]);
    expect(result.steps.map((step) => step.status)).toEqual(["completed", "completed"]);
    expect(result.steps[0].observed?.accepted).toBe(1);
    expect(result.report?.verdict).toBe("partial");
    expect(result.report?.keyFindings[0].citationValid).toBe(true);
    // plan + adapt×2 + report = 4回のオーケストレーター呼び出し
    expect(calls()).toBe(4);
    expect(result.usage.totalTokens).toBe(280 * 4);
    expect(result.usage.estimatedCostUsd).toBeGreaterThan(0);
    expect(result.phases.map((phase) => phase.phase)).toEqual(["plan", "execute", "execute", "report"]);
    const persisted = await store.getMission(mission.id);
    expect(persisted?.status).toBe("completed");
  });

  it("fails the mission when the planner selects no valid agent", async () => {
    const { deps, executed } = makeDeps([planJson([{ agentId: "ghost-agent" }])]);
    const result = await executeMission(newMission(), deps);

    expect(result.status).toBe("failed");
    expect(result.error).toContain("有効なエージェント");
    expect(executed).toEqual([]);
  });

  it("skips remaining steps when the orchestrator decides the goal is already answered", async () => {
    const { deps, executed } = makeDeps([
      planJson([{ agentId: "cloud-run-sre" }, { agentId: "security-sentinel" }, { agentId: "ux-guildmaster" }]),
      JSON.stringify({ action: "skip-remaining", note: "目標は既に回答済み" }),
      reportJson([{ agentId: "cloud-run-sre", runId: "run-cloud-run-sre" }])
    ]);
    const result = await executeMission(newMission(), deps);

    expect(result.status).toBe("completed");
    expect(executed).toEqual(["cloud-run-sre"]);
    expect(result.steps.map((step) => step.status)).toEqual(["completed", "skipped", "skipped"]);
    expect(result.phases.some((phase) => phase.phase === "adapt")).toBe(true);
  });

  it("adds at most one adaptive step when evidence demands it", async () => {
    const { deps, executed } = makeDeps([
      planJson([{ agentId: "cloud-run-sre" }]),
      JSON.stringify({
        action: "add-step",
        note: "5xxが出ているため脆弱性も確認",
        addStep: { agentId: "security-sentinel", input: "", reason: "追加調査" }
      }),
      // 追加ステップ実行後は adaptiveAdds 上限に達しており adapt は呼ばれず、次はレポート生成
      reportJson([{ agentId: "cloud-run-sre", runId: "run-cloud-run-sre" }])
    ]);
    const result = await executeMission(newMission(), deps);

    expect(result.status).toBe("completed");
    expect(executed).toEqual(["cloud-run-sre", "security-sentinel"]);
    expect(result.steps[1].origin).toBe("adaptive");
    expect(result.steps[1].status).toBe("completed");
  });

  it("invalidates report citations that reference runs that never happened", async () => {
    const { deps } = makeDeps([
      planJson([{ agentId: "cloud-run-sre" }]),
      ADAPT_CONTINUE,
      reportJson([
        { agentId: "cloud-run-sre", runId: "run-cloud-run-sre" },
        { agentId: "cloud-run-sre", runId: "run-hallucinated" }
      ])
    ]);
    const result = await executeMission(newMission(), deps);

    expect(result.status).toBe("completed");
    expect(result.report?.keyFindings.map((finding) => finding.citationValid)).toEqual([true, false]);
    const reportPhase = result.phases.find((phase) => phase.phase === "report");
    expect(reportPhase?.detail).toContain("1件を無効化");
  });

  it("marks a step failed when the run cannot start but still reports on the rest", async () => {
    const { deps } = makeDeps(
      [
        planJson([{ agentId: "cloud-run-sre" }, { agentId: "security-sentinel" }]),
        ADAPT_CONTINUE,
        ADAPT_CONTINUE,
        reportJson([{ agentId: "security-sentinel", runId: "run-security-sentinel" }])
      ],
      {
        runAgent: async (agentId) => {
          if (agentId === "cloud-run-sre") throw new Error("レート制限: ハードストップ");
          return makeRun(agentId);
        }
      }
    );
    const result = await executeMission(newMission(), deps);

    expect(result.status).toBe("completed");
    expect(result.steps[0].status).toBe("failed");
    expect(result.steps[0].decision).toContain("レート制限");
    expect(result.steps[1].status).toBe("completed");
    expect(result.report?.keyFindings[0].citationValid).toBe(true);
  });

  it("produces a blocked report without calling Gemini again when no run completes", async () => {
    const { deps, calls } = makeDeps([planJson([{ agentId: "cloud-run-sre" }])], {
      runAgent: async () => {
        throw new Error("実行基盤が未構成です");
      }
    });
    const result = await executeMission(newMission(), deps);

    expect(result.status).toBe("completed");
    expect(result.report?.verdict).toBe("blocked");
    expect(result.report?.keyFindings).toEqual([]);
    // plan + (adaptは失敗ステップ後も呼ばれ得るが、レポートはローカル生成) — レポート呼び出しがないことを確認
    expect(calls()).toBeLessThanOrEqual(2);
  });

  it("skips all remaining steps on time-budget hard stop", async () => {
    const { deps, executed } = makeDeps([planJson([{ agentId: "cloud-run-sre" }, { agentId: "security-sentinel" }])], { timeBudgetMs: -1 });
    const result = await executeMission(newMission(), deps);

    expect(result.status).toBe("completed");
    expect(executed).toEqual([]);
    expect(result.steps.every((step) => step.status === "skipped")).toBe(true);
    expect(result.report?.verdict).toBe("blocked");
  });

  it("continues the plan when the adapt decision is malformed (fail-open)", async () => {
    const { deps, executed } = makeDeps([
      planJson([{ agentId: "cloud-run-sre" }, { agentId: "security-sentinel" }]),
      "not-json at all",
      ADAPT_CONTINUE,
      reportJson([{ agentId: "cloud-run-sre", runId: "run-cloud-run-sre" }])
    ]);
    const result = await executeMission(newMission(), deps);

    expect(result.status).toBe("completed");
    expect(executed).toEqual(["cloud-run-sre", "security-sentinel"]);
  });

  it("completes the mission even when the store keeps failing (fail-open persistence)", async () => {
    const { deps } = makeDeps([
      planJson([{ agentId: "cloud-run-sre" }]),
      ADAPT_CONTINUE,
      reportJson([{ agentId: "cloud-run-sre", runId: "run-cloud-run-sre" }])
    ]);
    const failingDeps = {
      ...deps,
      store: {
        saveMission: async () => {
          throw new Error("firestore connect timeout");
        }
      }
    };
    const result = await executeMission(newMission(), failingDeps);

    expect(result.status).toBe("completed");
    expect(result.report?.verdict).toBe("partial");
  });

  it("redacts sensitive text from the goal on mission creation", () => {
    const fakeBearer = "Bearer " + "abcdef1234567890";
    const mission = createMission(`authorization: ${fakeBearer} を確認して`, "web", "gemini-3.5-flash", "vertex");
    expect(mission.goal).not.toContain("abcdef1234567890");
  });
});
