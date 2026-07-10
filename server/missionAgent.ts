import { randomUUID } from "node:crypto";
import { z } from "zod";

import { parseModelJson, redactSensitiveText } from "./opsAgent.js";

import type { GenAIClient, OpsAgentRun } from "./opsAgent.js";

// ---------------------------------------------------------------------------
// Mission — 自律ミッション実行
// ユーザーは「目標」を1つ書くだけ。オーケストレーター(Gemini)が
// ① 実行計画の立案 (どのエージェントをどの入力で走らせるか)
// ② 各エージェントの実実行 (実ログ/実CI/実脆弱性DB… 既存パイプライン再利用)
// ③ 結果の観察と適応判断 (続行 / 残りスキップ / エージェント追加投入)
// ④ 統合レポート生成 (runId引用ゲートで機械検証)
// まで自律で回す。破壊的操作は行わず、提案はすべて人間承認待ちに落とす。
// ---------------------------------------------------------------------------

export type MissionCatalogEntry = {
  agentId: string;
  title: string;
  description: string;
  inputHint: string;
};

export type MissionPhaseLog = { phase: string; status: "done" | "error"; detail: string; at: string };

export type MissionStep = {
  agentId: string;
  input: string;
  reason: string;
  origin: "plan" | "adaptive";
  status: "planned" | "running" | "completed" | "failed" | "skipped";
  runId?: string;
  observed?: {
    serviceHealth: string;
    summary: string;
    findingsTotal: number;
    accepted: number;
    topFinding?: string;
  };
  decision?: string;
};

export type MissionReportFinding = {
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  agentId: string;
  runId: string;
  action: string;
  citationValid: boolean;
};

export type MissionReport = {
  verdict: "achieved" | "partial" | "blocked";
  headline: string;
  summary: string;
  keyFindings: MissionReportFinding[];
  nextActions: string[];
};

export type Mission = {
  id: string;
  goal: string;
  trigger: "web" | "a2a";
  status: "planning" | "running" | "completed" | "failed";
  planSummary: string;
  phases: MissionPhaseLog[];
  steps: MissionStep[];
  report: MissionReport | null;
  // usage はオーケストレーター自身のGemini消費のみ (各ランの消費はラン側に記録)
  usage: { promptTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number };
  model: string;
  mode: "api-key" | "vertex";
  error?: string;
  startedAt: string;
  finishedAt?: string;
};

export type MissionSaver = { saveMission(mission: Mission): Promise<void> };

export type MissionDeps = {
  genAi: { client: GenAIClient; mode: "api-key" | "vertex" };
  model: string;
  catalog: MissionCatalogEntry[];
  // エージェントを実実行し、完了(またはfailed)したランを返す
  runAgent: (agentId: string, input: string) => Promise<OpsAgentRun>;
  store: MissionSaver;
  costInputPerMTok: number;
  costOutputPerMTok: number;
  timeBudgetMs?: number;
  maxSteps?: number;
};

const PLAN_MAX_STEPS = 4;
const MISSION_MAX_STEPS = 5; // 計画4 + 適応追加1
const MISSION_TIME_BUDGET_MS = 240_000;

// スキーマは受入側で寛容にし、長さ制限は機械検証(sanitize)側で切り詰める。
// モデルが冗長に返しただけでミッション全体をfailさせないための防御。
const PlanStepSchema = z.object({
  agentId: z.string().min(1),
  input: z.string().default(""),
  reason: z.string().min(1)
});

const PlanSchema = z.object({
  planSummary: z.string().min(1),
  steps: z.array(PlanStepSchema).min(1).max(8)
});

const AdaptSchema = z.object({
  action: z.enum(["continue", "skip-remaining", "add-step"]),
  note: z.string().min(1),
  addStep: PlanStepSchema.optional()
});

const ReportSchema = z.object({
  verdict: z.enum(["achieved", "partial", "blocked"]),
  headline: z.string().min(1),
  summary: z.string().min(1),
  keyFindings: z
    .array(
      z.object({
        title: z.string().min(1),
        severity: z.enum(["critical", "high", "medium", "low"]),
        agentId: z.string().min(1),
        runId: z.string().min(1),
        action: z.string().min(1)
      })
    )
    .max(12)
    .default([]),
  nextActions: z.array(z.string().min(1)).max(8).default([])
});

export function createMission(goal: string, trigger: "web" | "a2a", model: string, mode: "api-key" | "vertex"): Mission {
  return {
    id: randomUUID(),
    goal: redactSensitiveText(goal).slice(0, 2000),
    trigger,
    status: "planning",
    planSummary: "",
    phases: [],
    steps: [],
    report: null,
    usage: { promptTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
    model,
    mode,
    startedAt: new Date().toISOString()
  };
}

function catalogBlock(catalog: MissionCatalogEntry[]): string {
  return catalog.map((entry) => `- ${entry.agentId}: ${entry.title} — ${entry.description} (input: ${entry.inputHint})`).join("\n");
}

function addUsage(
  mission: Mission,
  deps: Pick<MissionDeps, "costInputPerMTok" | "costOutputPerMTok">,
  usage?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }
) {
  const prompt = usage?.promptTokenCount ?? 0;
  const output = usage?.candidatesTokenCount ?? 0;
  mission.usage.promptTokens += prompt;
  mission.usage.outputTokens += output;
  mission.usage.totalTokens += usage?.totalTokenCount ?? prompt + output;
  mission.usage.estimatedCostUsd = Number(
    ((mission.usage.promptTokens / 1_000_000) * deps.costInputPerMTok + (mission.usage.outputTokens / 1_000_000) * deps.costOutputPerMTok).toFixed(6)
  );
}

// 計画の機械検証: 未知のagentIdを除外し、同一agentIdの重複は先勝ちで畳み、長さを切り詰める
export function sanitizePlanSteps(
  steps: Array<{ agentId: string; input: string; reason: string }>,
  catalog: MissionCatalogEntry[]
): Array<{ agentId: string; input: string; reason: string }> {
  const known = new Set(catalog.map((entry) => entry.agentId));
  const seen = new Set<string>();
  const valid: Array<{ agentId: string; input: string; reason: string }> = [];
  for (const step of steps) {
    const agentId = step.agentId.trim();
    if (!known.has(agentId) || seen.has(agentId)) continue;
    seen.add(agentId);
    valid.push({ agentId, input: step.input.slice(0, 600), reason: step.reason.slice(0, 300) });
  }
  return valid.slice(0, PLAN_MAX_STEPS);
}

// レポートの引用ゲート: keyFindings の runId / agentId がこのミッションの実ランと一致するか機械検証
export function applyReportCitationGate(
  findings: z.infer<typeof ReportSchema>["keyFindings"],
  runsById: ReadonlyMap<string, OpsAgentRun>
): MissionReportFinding[] {
  return findings.map((finding) => {
    const run = runsById.get(finding.runId);
    return { ...finding, citationValid: Boolean(run && run.agentId === finding.agentId) };
  });
}

function observeRun(run: OpsAgentRun): NonNullable<MissionStep["observed"]> {
  const accepted = run.findings.filter((f) => f.accepted);
  return {
    serviceHealth: run.serviceHealth,
    summary: run.summary.slice(0, 300),
    findingsTotal: run.findings.length,
    accepted: accepted.length,
    topFinding: accepted[0]?.title
  };
}

export async function executeMission(mission: Mission, deps: MissionDeps): Promise<Mission> {
  const { genAi, model, catalog, runAgent, store } = deps;
  const deadline = Date.now() + (deps.timeBudgetMs ?? MISSION_TIME_BUDGET_MS);
  const maxSteps = deps.maxSteps ?? MISSION_MAX_STEPS;
  // 永続化はfail-open: ストアの一時障害でミッション自体を殺さない (1回リトライ後は次の保存機会に委ねる)
  const persist = async () => {
    try {
      await store.saveMission(mission);
    } catch {
      try {
        await store.saveMission(mission);
      } catch (error) {
        console.error("mission save failed (fail-open)", error instanceof Error ? error.message.slice(0, 200) : error);
      }
    }
  };
  const phase = async (name: string, detail: string, status: "done" | "error" = "done") => {
    mission.phases.push({ phase: name, status, detail, at: new Date().toISOString() });
    await persist();
  };
  const generate = async (contents: string, maxOutputTokens: number) => {
    const response = await genAi.client.models.generateContent({
      model,
      contents,
      config: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens }
    });
    addUsage(mission, deps, response.usageMetadata);
    return parseModelJson(response.text ?? "{}");
  };
  // thinkingを含むモデルでは出力が途中で切れてJSON parseが失敗することがあるため、plan/reportは1回リトライする
  const generateWithRetry = async (contents: string, maxOutputTokens: number, attempts = 2): Promise<unknown> => {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await generate(contents, maxOutputTokens);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("orchestrator generate failed");
  };

  try {
    await persist();

    // ① 計画 — オーケストレーターがカタログから編成を自律決定
    const planPrompt = [
      "You are the mission orchestrator of an AI agent guild for DevOps.",
      "Select which specialist agents to dispatch (order matters) to achieve the user's goal.",
      "Every agent performs REAL work against live systems (real logs, real CI, real vulnerability DB, real HTML, real A2A delegation).",
      "Return strict JSON only. Use ONLY agentIds from the catalog. 1 to 4 steps. Do not repeat an agentId.",
      "",
      "Agent catalog:",
      catalogBlock(catalog),
      "",
      "User goal:",
      mission.goal,
      "",
      "JSON schema:",
      JSON.stringify({
        planSummary: "1-2 sentence Japanese plan summary",
        steps: [{ agentId: "catalog agentId", input: "input for the agent (may be empty)", reason: "why this agent, in Japanese" }]
      })
    ].join("\n");
    const plan = PlanSchema.parse(await generateWithRetry(planPrompt, 4096));
    const validSteps = sanitizePlanSteps(plan.steps, catalog);
    if (validSteps.length === 0) {
      throw new Error("プランナーが有効なエージェントを選択できませんでした");
    }
    mission.planSummary = plan.planSummary.slice(0, 600);
    mission.steps = validSteps.map((step) => ({ ...step, origin: "plan" as const, status: "planned" as const }));
    mission.status = "running";
    await phase(
      "plan",
      `オーケストレーターが ${mission.steps.length} 体を選抜 (${mission.steps.map((s) => s.agentId).join(" → ")})${plan.steps.length !== validSteps.length ? ` / 無効な選択 ${plan.steps.length - validSteps.length} 件を機械検証で棄却` : ""}`
    );

    // ② 実行ループ — 逐次実行し、各ラン後に観察・適応判断
    const runsById = new Map<string, OpsAgentRun>();
    let adaptiveAdds = 0;
    for (let index = 0; index < mission.steps.length; index += 1) {
      const step = mission.steps[index];
      if (Date.now() > deadline) {
        for (const rest of mission.steps.slice(index)) {
          rest.status = "skipped";
          rest.decision = "hard stop: ミッション時間予算超過";
        }
        await phase("budget", "時間予算超過のため残りステップをスキップ (hard stop)");
        break;
      }

      step.status = "running";
      await persist();
      try {
        const run = await runAgent(step.agentId, step.input);
        step.runId = run.id;
        runsById.set(run.id, run);
        step.observed = observeRun(run);
        step.status = run.status === "completed" ? "completed" : "failed";
        await phase(
          "execute",
          `${step.agentId} 実行${step.status === "completed" ? "完了" : "失敗"}: 所見${step.observed.findingsTotal}件中${step.observed.accepted}件受入 (run ${run.id.slice(0, 8)})`
        );
      } catch (error) {
        step.status = "failed";
        step.decision = error instanceof Error ? error.message.slice(0, 200) : "unknown error";
        await phase("execute", `${step.agentId} 実行失敗: ${step.decision}`, "error");
      }

      // 観察 → 適応判断 (最後のステップ後は追加投入のみ判断対象)
      const remaining = mission.steps.slice(index + 1).filter((s) => s.status === "planned");
      const canAdd = adaptiveAdds < 1 && mission.steps.length < maxSteps;
      if ((remaining.length === 0 && !canAdd) || Date.now() > deadline) continue;
      try {
        const adaptPrompt = [
          "You are the mission orchestrator observing intermediate results.",
          "Decide: continue the plan, skip remaining steps (if goal already answered or futile), or add ONE extra agent (only if evidence clearly demands it).",
          "Return strict JSON only.",
          "",
          "Goal:",
          mission.goal,
          "",
          "Latest step result:",
          JSON.stringify({ agentId: step.agentId, status: step.status, observed: step.observed ?? null }),
          "",
          `Remaining planned steps: ${remaining.length > 0 ? remaining.map((s) => s.agentId).join(", ") : "(none)"}`,
          `Adding an extra agent is ${canAdd ? "allowed (max 1, must be a catalog agentId not yet used)" : "NOT allowed"}`,
          "",
          "Agent catalog:",
          catalogBlock(catalog),
          "",
          "JSON schema:",
          JSON.stringify({ action: "continue|skip-remaining|add-step", note: "short Japanese rationale", addStep: { agentId: "", input: "", reason: "" } })
        ].join("\n");
        const adapt = AdaptSchema.parse(await generate(adaptPrompt, 2048));
        // 実行失敗の記録は保持したまま、適応判断を追記する
        const decisionNote = `${adapt.action}: ${adapt.note}`;
        step.decision = (step.decision ? `${step.decision} → ${decisionNote}` : decisionNote).slice(0, 400);
        if (adapt.action === "skip-remaining") {
          for (const rest of remaining) {
            rest.status = "skipped";
            rest.decision = `オーケストレーター判断でスキップ: ${adapt.note.slice(0, 120)}`;
          }
          await phase("adapt", `残り ${remaining.length} 体をスキップ — ${adapt.note.slice(0, 140)}`);
          break;
        }
        if (adapt.action === "add-step" && adapt.addStep && canAdd) {
          const usedIds = new Set(mission.steps.map((s) => s.agentId));
          const [candidate] = sanitizePlanSteps([adapt.addStep], catalog).filter((s) => !usedIds.has(s.agentId));
          if (candidate) {
            adaptiveAdds += 1;
            mission.steps.push({ ...candidate, origin: "adaptive", status: "planned" });
            await phase("adapt", `観察結果に基づき ${candidate.agentId} を追加投入 — ${adapt.note.slice(0, 140)}`);
          }
        }
        await persist();
      } catch {
        // 適応判断の失敗は計画続行 (fail-open)
        step.decision = step.decision ?? "適応判断に失敗したため計画どおり続行";
        await persist();
      }
    }

    // ③ 統合レポート — 受入所見だけを証拠に生成し、runId引用をゲートで機械検証
    const completedRuns = [...runsById.values()].filter((run) => run.status === "completed");
    if (completedRuns.length === 0) {
      mission.report = {
        verdict: "blocked",
        headline: "実行可能なエージェントランが完了しなかった",
        summary: "全ステップが失敗またはスキップされたため、証拠に基づくレポートを生成できません。実行基盤の設定とレート制限を確認してください。",
        keyFindings: [],
        nextActions: ["実行基盤 (Gemini認証 / Cloud Logging) の設定を確認する", "レート制限解除後にミッションを再実行する"]
      };
      mission.status = "completed";
      mission.finishedAt = new Date().toISOString();
      await phase("report", "完了ランがゼロのためGeminiを呼ばずにblockedレポートを生成 (コスト0)");
      return mission;
    }

    const evidenceLines = completedRuns.flatMap((run) =>
      run.findings
        .filter((finding) => finding.accepted)
        .map((finding) => `[${run.id}] agent=${run.agentId} severity=${finding.severity} ${finding.title} — ${finding.recommendedAction.slice(0, 160)}`)
    );
    const reportPrompt = [
      "You are the mission orchestrator writing the final mission report for the user.",
      "Use ONLY the accepted findings below as evidence. Cite runId EXACTLY as it appears in [brackets]. Never invent runIds.",
      "Return strict JSON only.",
      "",
      "Goal:",
      mission.goal,
      "",
      "Executed steps:",
      JSON.stringify(mission.steps.map((s) => ({ agentId: s.agentId, status: s.status, observed: s.observed ?? null }))),
      "",
      "Accepted findings (evidence):",
      evidenceLines.length > 0 ? evidenceLines.join("\n") : "(none — all findings were rejected by gates/checker)",
      "",
      "JSON schema (at most 6 keyFindings, at most 5 nextActions):",
      JSON.stringify({
        verdict: "achieved|partial|blocked",
        headline: "one-line Japanese mission outcome",
        summary: "3-5 sentence Japanese summary grounded in evidence",
        keyFindings: [{ title: "", severity: "critical|high|medium|low", agentId: "", runId: "runId from [brackets]", action: "concrete next action in Japanese" }],
        nextActions: ["prioritized Japanese action"]
      })
    ].join("\n");
    const rawReport = ReportSchema.parse(await generateWithRetry(reportPrompt, 8192));
    const gated = applyReportCitationGate(rawReport.keyFindings, runsById).slice(0, 8);
    const rejected = gated.filter((finding) => !finding.citationValid).length;
    mission.report = {
      verdict: rawReport.verdict,
      headline: rawReport.headline.slice(0, 300),
      summary: rawReport.summary.slice(0, 2000),
      keyFindings: gated.map((finding) => ({
        ...finding,
        title: finding.title.slice(0, 300),
        action: finding.action.slice(0, 500)
      })),
      nextActions: rawReport.nextActions.slice(0, 5).map((action) => action.slice(0, 300))
    };
    mission.status = "completed";
    mission.finishedAt = new Date().toISOString();
    await phase(
      "report",
      `統合レポート生成: verdict=${rawReport.verdict}, keyFindings ${gated.length}件 (引用ゲート${rejected > 0 ? `で${rejected}件を無効化` : " 全件PASS"})`
    );
    return mission;
  } catch (error) {
    mission.status = "failed";
    mission.error = error instanceof Error ? error.message.slice(0, 300) : "unknown error";
    mission.finishedAt = new Date().toISOString();
    mission.phases.push({ phase: "error", status: "error", detail: mission.error, at: mission.finishedAt });
    await persist();
    return mission;
  }
}
