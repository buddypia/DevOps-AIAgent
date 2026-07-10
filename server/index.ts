import express from "express";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { ipAllowlistMiddleware, ipAllowlistSummary } from "./ipAllowlist.js";
import { discoverAgentCardFromUrl } from "./agentCardDiscovery.js";

import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine.js";
import { buildSquadContract } from "../src/contracts.js";
import { MARKET_AGENTS } from "../src/market.js";
import { buildMissionRun } from "../src/mission.js";
import { buildOpsDrill } from "../src/ops.js";
import { buildWinningStrategy } from "../src/strategy.js";
import { SUBMISSION_PROOF } from "../src/submission.js";
import type { GeminiRecommendation } from "../src/types.js";

import { AGENT_JOBS, A2A_SKILL_TO_AGENT, createDefaultReadTextFile } from "./agentJobs.js";
import { createGenAiClient, createLogLister, createLoggingEvidenceFetcher, createRun, executeAgentRun, getOpsConfig } from "./opsAgent.js";
import { createRunStore } from "./runStore.js";
import type { JobContext } from "./agentJobs.js";
import type { OpsAgentRun } from "./opsAgent.js";

const app = express();
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";
const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const opsConfig = getOpsConfig();
const opsGenAi = createGenAiClient(opsConfig);
const runStore = createRunStore(opsConfig.project, process.env.OPS_RUN_STORE);
const logLister = opsConfig.project ? createLogLister() : null;
const fetchOpsEvidence = opsConfig.project && logLister ? createLoggingEvidenceFetcher(opsConfig, logLister) : null;
const readTextFile = createDefaultReadTextFile();
const OPS_AGENT_ID = "cloud-run-sre";

// ハードストップ: ラン生成レート制限 (10分窓で最大12ラン — broker委任の連鎖分を含む)
const RUN_RATE_LIMIT = { windowMs: 10 * 60_000, max: 12 };
const recentRunStarts: number[] = [];
function runRateLimited(): boolean {
  const now = Date.now();
  while (recentRunStarts.length > 0 && now - recentRunStarts[0] > RUN_RATE_LIMIT.windowMs) recentRunStarts.shift();
  if (recentRunStarts.length >= RUN_RATE_LIMIT.max) return true;
  recentRunStarts.push(now);
  return false;
}

function buildJobContext(baseUrl: string): JobContext {
  return {
    config: opsConfig,
    baseUrl,
    fetchImpl: fetch,
    fetchLoggingEvidence: fetchOpsEvidence,
    listLogEntries: logLister,
    listRuns: (limit) => runStore.listRuns(limit),
    readTextFile,
    discoverCard: discoverAgentCardFromUrl
  };
}

async function startAgentRun(
  agentId: string,
  trigger: "web" | "a2a",
  input: string,
  baseUrl: string
): Promise<{ run?: OpsAgentRun; error?: string; status: 202 | 400 | 429 | 503 }> {
  const job = AGENT_JOBS[agentId];
  if (!job) {
    return { error: `エージェント ${agentId} は実行未対応です`, status: 400 };
  }
  if (!opsGenAi) {
    return { error: "実行基盤が未構成です (Gemini APIキー / Vertex ADC を確認)", status: 503 };
  }
  if (runRateLimited()) {
    return { error: "レート制限: 10分あたりの実行上限に達しました (ハードストップ)", status: 429 };
  }
  const ctx = buildJobContext(baseUrl);
  const run = createRun(agentId, job.runTarget(opsConfig, input), trigger, { config: opsConfig, genAi: opsGenAi }, input || undefined);
  await runStore.saveRun(run);
  void executeAgentRun(run, {
    config: opsConfig,
    genAi: opsGenAi,
    store: runStore,
    job: {
      makerRole: job.makerRole,
      checkerRole: job.checkerRole,
      emptyNote: job.emptyNote,
      collectEvidence: (runInput) => job.collectEvidence(ctx, runInput)
    }
  }).catch((error) => console.error("agent run failed", error));
  return { run, status: 202 };
}

function opsRunToA2ATask(run: OpsAgentRun) {
  const stateMap = { queued: "submitted", running: "working", completed: "completed", failed: "failed" } as const;
  return {
    kind: "task",
    id: run.id,
    contextId: run.agentId,
    status: { state: stateMap[run.status], timestamp: run.finishedAt ?? run.startedAt },
    history: run.phases.map((p) => ({ role: "agent", parts: [{ kind: "text", text: `${p.phase}: ${p.detail}` }], kind: "message" })),
    artifacts:
      run.status === "completed"
        ? [
            {
              artifactId: `${run.id}-findings`,
              parts: [
                {
                  kind: "data",
                  data: {
                    serviceHealth: run.serviceHealth,
                    summary: run.summary,
                    findings: run.findings,
                    escalations: run.escalations,
                    usage: run.usage
                  }
                }
              ]
            }
          ]
        : []
  };
}

const RecommendSchema = z.object({
  projectBrief: z.string().trim().min(1).max(20000),
  selectedAgentIds: z.array(z.string()).max(8).default([])
});

const AgentCardDiscoverySchema = z.object({
  url: z.string().trim().min(1).max(1000)
});

const MissionSchema = RecommendSchema.extend({
  objective: z.string().trim().max(20000).optional()
});

const OpsDrillSchema = RecommendSchema.extend({
  observed: z
    .object({
      latencyP95Ms: z.number().nonnegative().max(60000).optional(),
      errorRatePercent: z.number().nonnegative().max(100).optional(),
      healthOk: z.boolean().optional(),
      fallbackActive: z.boolean().optional(),
      budgetBurnPercent: z.number().nonnegative().max(100).optional(),
      submissionUrlsReady: z.boolean().optional()
    })
    .optional()
});

function publicBaseUrl(req: express.Request) {
  const configured = process.env.PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const proto = req.header("x-forwarded-proto") || req.protocol;
  return `${proto}://${req.get("host")}`;
}

function agentCard(baseUrl: string) {
  return {
    protocolVersion: "0.3.0",
    name: "Agent-To-Agent Marketplace Broker",
    description:
      "必要な能力を持つAIエージェントを市場から探索し、スキル/MCP/A2A能力を数値化して、DevOps改善タスクを委任するブローカー。",
    url: `${baseUrl}/a2a`,
    preferredTransport: "JSONRPC",
    provider: {
      organization: "A2A Agent Marketplace",
      url: baseUrl
    },
    version: "0.1.0",
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true
    },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["application/json"],
    skills: [
      {
        id: "market.discover",
        name: "Discover AI agents by capability",
        description: "プロジェクトブリーフから必要能力を抽出し、A2A/MCP/スキル成熟度で候補をランク付けする。",
        tags: ["marketplace", "a2a", "mcp", "devops"],
        examples: ["Cloud Runへ出す前に足りない能力を持つAIを探して"]
      },
      {
        id: "agent-card.discover",
        name: "Import a public Agent Card",
        description: "公開Agent Card URLを検証付きで取得し、マーケット候補として採用できる能力カードへ変換する。",
        tags: ["agent-card", "marketplace", "discovery", "ssrf-guard"],
        examples: [`${SUBMISSION_PROOF.deployedUrl}/.well-known/agent-card.json を候補として取り込んで`]
      },
      {
        id: "strategy.audit",
        name: "Audit competitive strategy",
        description: "現在の編成から競合比較、SWOT、審査5項目スコアを算出する。",
        tags: ["strategy", "swot"],
        examples: ["いまの編成で審査に勝てるか診断して"]
      },
      {
        id: "mission.run",
        name: "Run an autonomous mission",
        description: "sense→decide→delegate→verify→shipの5段階でAIの自律判断の証跡を生成する。",
        tags: ["mission", "autonomy"]
      },
      {
        id: "ops.drill",
        name: "Run an operations drill",
        description: "Cloud Run health/latency/エラー率から継続かrollbackかを判断する。",
        tags: ["ops", "cloud-run"]
      },
      ...Object.values(AGENT_JOBS).map((job) => ({
        id: job.skillId,
        name: `${job.title} (real execution)`,
        description: `${job.skillDescription} 実パイプライン(証拠→maker→引用ゲート→独立checker)で実行され、ランはFirestoreに永続化、tasks/getで追跡できる。`,
        tags: ["real-run", "maker-checker", job.agentId],
        examples: [`message/send の params.message.metadata.skillId に ${job.skillId} を指定`]
      })),
      {
        id: "contract.issue",
        name: "Issue an agent contract",
        description: "選択済みAIの成果物、受入条件、SLA、検証コマンドを契約化する。",
        tags: ["contract", "acceptance"]
      },
      {
        id: "task.delegate",
        name: "Delegate a task via A2A",
        description: "message/send形式で市場エージェントへタスクを委任し、編成・契約・戦略の要約を返す。",
        tags: ["a2a", "delegate"]
      }
    ],
    metadata: {
      endpoints: {
        marketEndpoint: `${baseUrl}/api/market`,
        recommendEndpoint: `${baseUrl}/api/recommend`,
        contractsEndpoint: `${baseUrl}/api/contracts`,
        strategyEndpoint: `${baseUrl}/api/strategy`,
        missionEndpoint: `${baseUrl}/api/mission`,
        opsDrillEndpoint: `${baseUrl}/api/ops-drill`,
        agentCardDiscoverEndpoint: `${baseUrl}/api/agent-card/discover`,
        hiresEndpoint: `${baseUrl}/api/hires`,
        agentRunsEndpoint: `${baseUrl}/api/agent-runs`
      }
    },
    supportsAuthenticatedExtendedCard: false
  };
}

function parseJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1] ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
  return JSON.parse(candidate);
}

async function runGemini(projectBrief: string, selectedAgentIds: string[]): Promise<GeminiRecommendation> {
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);

  if (!opsGenAi) {
    return localGeminiRecommendation(recommendation, "Gemini is not configured (API key / Vertex ADC)");
  }

  const ai = opsGenAi.client;
  const prompt = [
    "You are the strategy agent for an A2A AI agent marketplace product.",
    "Return strict JSON only. No markdown.",
    "",
    "Product:",
    "Agent-To-Agent Marketplace | エージェント市場 | 必要な能力を持つAIを探し雇い連携する",
    "",
    "Mandatory technology:",
    "- A2A protocol style Agent Card and message delegation",
    "- Google Cloud Run",
    "- Gemini 3.5 Flash",
    "",
    "Project brief:",
    projectBrief,
    "",
    "Selected agents:",
    recommendation.selected.map((agent) => `- ${agent.name}: ${agent.headline}`).join("\n"),
    "",
    "Current score:",
    JSON.stringify({ before: recommendation.before, after: recommendation.after, uplift: recommendation.uplift }, null, 2),
    "",
    "Competitive strategy:",
    JSON.stringify(
      {
        strategicThesis: strategy.strategicThesis,
        judgeScore: strategy.judgeScore,
        mvpScore: strategy.mvpScore,
        moatScore: strategy.moatScore,
        topCompetitors: strategy.competitors.slice(0, 4).map((competitor) => ({
          name: competitor.name,
          category: competitor.category,
          counterPosition: competitor.counterPosition,
          counterMove: competitor.counterMove
        })),
        swot: strategy.swot,
        nextBestAgent: strategy.nextBestAgent
          ? {
              name: strategy.nextBestAgent.agent.name,
              reason: strategy.nextBestAgent.reason,
              expectedLift: strategy.nextBestAgent.expectedLift
            }
          : null
      },
      null,
      2
    ),
    "",
    "JSON schema:",
    JSON.stringify(
      {
        source: "gemini",
        model,
        executiveSummary: "one sentence",
        winningAngle: "why this can win",
        risks: ["risk"],
        nextActions: ["action"],
        pitchScript: "30 second Japanese pitch"
      },
      null,
      2
    )
  ].join("\n");

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.35
    }
  });

  const parsed = parseJson(response.text ?? "{}") as GeminiRecommendation;
  return {
    ...parsed,
    source: "gemini",
    model
  };
}

async function runGeminiWithRetry(projectBrief: string, selectedAgentIds: string[], attempts = 2): Promise<GeminiRecommendation> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await runGemini(projectBrief, selectedAgentIds);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Gemini request failed");
}

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(ipAllowlistMiddleware);

app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "a2a-agent-marketplace",
    model,
    agents: MARKET_AGENTS.length,
    geminiConfigured: Boolean(opsGenAi),
    geminiMode: opsGenAi?.mode ?? "none",
    opsAgent: {
      enabled: Boolean(opsGenAi && fetchOpsEvidence),
      targetService: opsConfig.targetService,
      runStore: runStore.backend,
      executableAgents: Object.keys(AGENT_JOBS).length
    },
    ipAllowlist: ipAllowlistSummary
  });
});

app.get("/api/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "a2a-agent-marketplace",
    model,
    agents: MARKET_AGENTS.length,
    geminiConfigured: Boolean(opsGenAi),
    geminiMode: opsGenAi?.mode ?? "none",
    opsAgent: {
      enabled: Boolean(opsGenAi && fetchOpsEvidence),
      targetService: opsConfig.targetService,
      runStore: runStore.backend,
      executableAgents: Object.keys(AGENT_JOBS).length
    },
    ipAllowlist: ipAllowlistSummary
  });
});

app.get("/api/market", (_req, res) => {
  res.json({ agents: MARKET_AGENTS });
});

app.post("/api/agent-card/discover", async (req, res) => {
  const parsed = AgentCardDiscoverySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ status: "rejected", error: "invalid_request", warnings: [], signals: [], issues: parsed.error.issues });
    return;
  }
  const result = await discoverAgentCardFromUrl(parsed.data.url);
  res.json(result);
});

app.post("/api/strategy", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  res.json(buildWinningStrategy(recommendation));
});

app.post("/api/mission", (req, res) => {
  const parsed = MissionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  res.json(buildMissionRun(recommendation, strategy, parsed.data.objective));
});

app.post("/api/ops-drill", (req, res) => {
  const parsed = OpsDrillSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  res.json(buildOpsDrill(recommendation, strategy, parsed.data.observed));
});

app.post("/api/contracts", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "選択したAIを成果物、受入条件、SLA、検証コマンド付きで雇う。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  res.json(buildSquadContract({ recommendation, strategy, mission, opsDrill }));
});

app.post("/api/recommend", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  try {
    const result = await runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds);
    res.json(result);
  } catch (error) {
    const fallback = localGeminiRecommendation(
      recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds),
      error instanceof Error ? error.message : "Gemini request failed"
    );
    res.json(fallback);
  }
});

const HireSchema = z.object({ agentId: z.string().trim().min(1).max(64) });
const RunCreateSchema = z.object({
  agentId: z.string().trim().min(1).max(64),
  input: z.string().trim().max(4000).optional(),
  targetService: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,63}$/)
    .optional()
});
const RUN_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

app.get("/api/hires", async (_req, res) => {
  try {
    res.json({ hires: await runStore.listHires() });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "hire list failed" });
  }
});

app.post("/api/hires", async (req, res) => {
  const parsed = HireSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  if (!MARKET_AGENTS.some((agent) => agent.id === parsed.data.agentId)) {
    res.status(404).json({ error: "unknown_agent" });
    return;
  }
  try {
    res.status(201).json({ hire: await runStore.saveHire(parsed.data.agentId) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "hire failed" });
  }
});

app.delete("/api/hires/:agentId", async (req, res) => {
  const parsed = HireSchema.safeParse({ agentId: req.params.agentId });
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }
  try {
    await runStore.removeHire(parsed.data.agentId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "fire failed" });
  }
});

app.post("/api/agent-runs", async (req, res) => {
  const parsed = RunCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  if (!AGENT_JOBS[parsed.data.agentId]) {
    res.status(400).json({ error: "unsupported_agent", message: `実実行に対応しているのは ${Object.keys(AGENT_JOBS).join(", ")} です` });
    return;
  }
  try {
    const hires = await runStore.listHires();
    if (!hires.some((hire) => hire.agentId === parsed.data.agentId)) {
      res.status(403).json({ error: "not_hired", message: `先に ${parsed.data.agentId} を雇用してください` });
      return;
    }
    const started = await startAgentRun(parsed.data.agentId, "web", parsed.data.input ?? parsed.data.targetService ?? "", publicBaseUrl(req));
    if (!started.run) {
      res.status(started.status).json({ error: started.error });
      return;
    }
    res.status(202).json({ runId: started.run.id, status: started.run.status });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "run create failed" });
  }
});

// 実行可能エージェントのカタログ (UIのコンソールが参照)
app.get("/api/agent-jobs", (_req, res) => {
  const jobs = Object.values(AGENT_JOBS).map((job) => {
    const marketAgent = MARKET_AGENTS.find((agent) => agent.id === job.agentId);
    return {
      agentId: job.agentId,
      name: marketAgent?.name ?? job.agentId,
      handle: marketAgent?.handle ?? "",
      color: marketAgent?.color ?? "#2457a6",
      title: job.title,
      skillId: job.skillId,
      inputKind: job.inputKind,
      inputLabel: job.inputLabel,
      inputPlaceholder: job.inputPlaceholder,
      findingNoun: job.findingNoun
    };
  });
  res.json({ jobs });
});

app.get("/api/agent-runs", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  try {
    res.json({ runs: await runStore.listRuns(limit), backend: runStore.backend });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "run list failed" });
  }
});

app.get("/api/agent-runs/:id", async (req, res) => {
  if (!RUN_ID_PATTERN.test(req.params.id)) {
    res.status(400).json({ error: "invalid_run_id" });
    return;
  }
  try {
    const run = await runStore.getRun(req.params.id);
    if (!run) {
      res.status(404).json({ error: "run_not_found" });
      return;
    }
    res.json({ run });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "run get failed" });
  }
});

// 模擬インシデント注入 (SREの障害対応ドリル)。本物のログとしてCloud Loggingに載る
let lastDrillAt = 0;
app.post("/api/ops-agent/incident-drill", (_req, res) => {
  const now = Date.now();
  if (now - lastDrillAt < 60_000) {
    res.status(429).json({ error: "drill_rate_limited", message: "ドリル注入は1分に1回までです" });
    return;
  }
  lastDrillAt = now;
  const drillId = randomUUID().slice(0, 8);
  console.log(
    JSON.stringify({ severity: "ERROR", message: `[incident-drill ${drillId}] synthetic checkout latency spike: p95 4800ms, upstream timeout to payments-api` })
  );
  console.log(
    JSON.stringify({ severity: "WARNING", message: `[incident-drill ${drillId}] retry storm detected: 34 retries/min against /api/recommend` })
  );
  res.json({ ok: true, drillId, note: "実ログとしてCloud Loggingへ記録。約15秒後に実行すると検出対象になります。" });
});

app.get("/.well-known/agent-card.json", (req, res) => {
  res.json(agentCard(publicBaseUrl(req)));
});

app.post("/a2a", async (req, res) => {
  const id = typeof req.body?.id === "undefined" ? randomUUID() : req.body.id;
  const method = String(req.body?.method || "message/send");
  const text =
    req.body?.params?.message?.parts?.find((part: { text?: string }) => typeof part.text === "string")?.text ||
    req.body?.params?.text ||
    "AI agent marketplace request";
  const baseUrl = publicBaseUrl(req);

  // A2A実タスク: 実行済みランの状態照会 (state persistence 付き)
  if (method === "tasks/get") {
    const taskId = String(req.body?.params?.id || "");
    const run = RUN_ID_PATTERN.test(taskId) ? await runStore.getRun(taskId).catch(() => null) : null;
    if (!run) {
      res.json({ jsonrpc: "2.0", id, error: { code: -32001, message: "Task not found" } });
      return;
    }
    res.json({ jsonrpc: "2.0", id, result: opsRunToA2ATask(run) });
    return;
  }

  // A2A実タスク: 登録スキルへの委任 = 雇用契約 + 実実行 (8エージェント対応)
  const skillId = String(req.body?.params?.message?.metadata?.skillId || "");
  const dispatchAgentId = A2A_SKILL_TO_AGENT[skillId] ?? (/ops\.triage/i.test(String(text)) ? OPS_AGENT_ID : null);
  if (dispatchAgentId) {
    await runStore.saveHire(dispatchAgentId).catch(() => null);
    const started = await startAgentRun(dispatchAgentId, "a2a", String(text).slice(0, 4000), publicBaseUrl(req));
    if (!started.run) {
      res.json({ jsonrpc: "2.0", id, error: { code: -32000, message: started.error ?? "run failed" } });
      return;
    }
    res.json({ jsonrpc: "2.0", id, result: opsRunToA2ATask(started.run) });
    return;
  }

  const recommendation = recommendSquad(String(text), ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, String(text));
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });

  res.json({
    jsonrpc: "2.0",
    id,
    result: {
      method,
      status: "completed",
      message: {
        role: "agent",
        parts: [
          {
            kind: "data",
            data: {
              headline: recommendation.headline,
              before: recommendation.before,
              after: recommendation.after,
              uplift: recommendation.uplift,
              selected: recommendation.selected.map((agent) => ({ id: agent.id, name: agent.name, price: agent.price })),
              a2aTimeline: recommendation.a2aTimeline,
              strategy: {
                strategicThesis: strategy.strategicThesis,
                judgeScore: strategy.judgeScore,
                moatScore: strategy.moatScore
              },
              mission: { summary: mission.summary, autonomyScore: mission.autonomyScore },
              opsDrill: { severity: opsDrill.severity, rollbackRecommended: opsDrill.rollbackRecommended },
              contract: { contractScore: squadContract.contractScore, totalPrice: squadContract.totalPrice },
              endpoints: {
                market: `${baseUrl}/api/market`,
                recommend: `${baseUrl}/api/recommend`,
                contracts: `${baseUrl}/api/contracts`,
                agentCard: `${baseUrl}/.well-known/agent-card.json`
              }
            }
          }
        ]
      }
    }
  });
});

const distPath = path.resolve(process.cwd(), "dist");
app.use("/docs", express.static(path.resolve(process.cwd(), "docs")));
app.use(express.static(distPath));
app.use((_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, host, () => {
  const displayHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`A2A Agent Marketplace listening on http://${displayHost}:${port}`);
});
