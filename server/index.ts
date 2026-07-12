import express from "express";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { ipAllowlistMiddleware, ipAllowlistSummary } from "./ipAllowlist.js";
import { discoverAgentCardFromUrl } from "./agentCardDiscovery.js";

import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine.js";
import { MARKET_AGENTS } from "../src/market.js";
import { SUBMISSION_PROOF } from "../src/submission.js";
import type { GeminiRecommendation } from "../src/types.js";

import { AGENT_JOBS, A2A_SKILL_TO_AGENT, createDefaultReadTextFile } from "./agentJobs.js";
import { computeAgentStats } from "./agentStats.js";
import { createMission, executeMission } from "./missionAgent.js";
import { createGenAiClient, createLogLister, createLoggingEvidenceFetcher, createRun, executeAgentRun, getOpsConfig } from "./opsAgent.js";
import { createRunStore } from "./runStore.js";
import { INCIDENT_DRILL_SCENARIOS, toIncidentDrillScenarioView } from "./incidentDrill.js";
import type { JobContext } from "./agentJobs.js";
import type { Mission, MissionCatalogEntry } from "./missionAgent.js";
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

// ハードストップ: ラン生成レート制限 (10分窓で最大18ラン。broker委任の連鎖とミッションの自律実行分を含む)
const RUN_RATE_LIMIT = { windowMs: 10 * 60_000, max: 18 };
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
  trigger: "web" | "a2a" | "mission",
  input: string,
  baseUrl: string
): Promise<{ run?: OpsAgentRun; completion?: Promise<OpsAgentRun>; error?: string; status: 202 | 400 | 429 | 503 }> {
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
  // executeAgentRun は内部でエラーを吸収して run を返す。ここでの catch は store 障害等の残余のみ
  const completion = executeAgentRun(run, {
    config: opsConfig,
    genAi: opsGenAi,
    store: runStore,
    job: {
      makerRole: job.makerRole,
      checkerRole: job.checkerRole,
      emptyNote: job.emptyNote,
      collectEvidence: (runInput) => job.collectEvidence(ctx, runInput)
    }
  }).catch((error) => {
    console.error("agent run failed", error);
    return run;
  });
  return { run, completion, status: 202 };
}

// ---------------------------------------------------------------------------
// Mission Control。目標1つでオーケストレーターが計画、実実行、適応、統合レポートまで行う。
// ---------------------------------------------------------------------------

// ハードストップ: ミッションは同時1件 + 10分窓で最大2件
const MISSION_RATE_LIMIT = { windowMs: 10 * 60_000, max: 2 };
const recentMissionStarts: number[] = [];
let activeMissionId: string | null = null;
function missionRateLimited(): boolean {
  const now = Date.now();
  while (recentMissionStarts.length > 0 && now - recentMissionStarts[0] > MISSION_RATE_LIMIT.windowMs) recentMissionStarts.shift();
  if (recentMissionStarts.length >= MISSION_RATE_LIMIT.max) return true;
  recentMissionStarts.push(now);
  return false;
}

function missionCatalog(): MissionCatalogEntry[] {
  return Object.values(AGENT_JOBS).map((job) => ({
    agentId: job.agentId,
    title: job.title,
    description: job.skillDescription,
    inputHint:
      job.inputKind === "none"
        ? "入力不要。空文字を渡す"
        : job.inputKind === "text"
          ? `${job.inputLabel}。目標から分析対象のテキストを渡す`
          : job.inputKind === "url"
            ? "Agent Card URL。空文字なら自マーケットを対象にする"
            : "Cloud Runサービス名。空文字なら既定ターゲットを対象にする"
  }));
}

async function startMission(
  goal: string,
  trigger: "web" | "a2a",
  baseUrl: string
): Promise<{ mission?: Mission; error?: string; status: 202 | 409 | 429 | 503 }> {
  if (!opsGenAi) {
    return { error: "実行基盤が未構成です (Gemini APIキー / Vertex ADC を確認)", status: 503 };
  }
  if (activeMissionId) {
    return { error: "別のミッションが実行中です (同時実行は1件までのハードストップ)", status: 409 };
  }
  if (missionRateLimited()) {
    return { error: "レート制限: ミッションは10分あたり2件までです (ハードストップ)", status: 429 };
  }
  const mission = createMission(goal, trigger, opsConfig.model, opsGenAi.mode);
  activeMissionId = mission.id;
  await runStore.saveMission(mission);
  void executeMission(mission, {
    genAi: opsGenAi,
    model: opsConfig.model,
    catalog: missionCatalog(),
    runAgent: async (agentId, input) => {
      // オーケストレーターが自律的に雇用契約を結び、実実行の完了まで待つ
      await runStore.saveHire(agentId).catch(() => null);
      const started = await startAgentRun(agentId, "mission", input, baseUrl);
      if (!started.run || !started.completion) throw new Error(started.error ?? "run start failed");
      return started.completion;
    },
    store: runStore,
    costInputPerMTok: opsConfig.costInputPerMTok,
    costOutputPerMTok: opsConfig.costOutputPerMTok
  })
    .catch((error) => console.error("mission failed", error))
    .finally(() => {
      if (activeMissionId === mission.id) activeMissionId = null;
    });
  return { mission, status: 202 };
}

function missionToA2ATask(mission: Mission) {
  const stateMap = { planning: "submitted", running: "working", completed: "completed", failed: "failed" } as const;
  return {
    kind: "task",
    id: mission.id,
    contextId: "mission-control",
    status: { state: stateMap[mission.status], timestamp: mission.finishedAt ?? mission.startedAt },
    history: mission.phases.map((p) => ({ role: "agent", parts: [{ kind: "text", text: `${p.phase}: ${p.detail}` }], kind: "message" })),
    artifacts:
      mission.status === "completed" && mission.report
        ? [
            {
              artifactId: `${mission.id}-report`,
              parts: [
                {
                  kind: "data",
                  data: {
                    goal: mission.goal,
                    planSummary: mission.planSummary,
                    steps: mission.steps,
                    report: mission.report,
                    usage: mission.usage
                  }
                }
              ]
            }
          ]
        : []
  };
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

function publicBaseUrl(req: express.Request) {
  const configured = process.env.PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const proto = req.header("x-forwarded-proto") || req.protocol;
  return `${proto}://${req.get("host")}`;
}

function agentCard(baseUrl: string) {
  // 実行可能スキルのみを公開する: AGENT_JOBS の各スキルは /a2a message/send で実実行される
  const executableSkills = Object.values(AGENT_JOBS).map((job) => ({
    id: job.skillId,
    name: job.title,
    description: job.skillDescription,
    tags: ["real-run", "maker-checker", job.agentId],
    examples: [`skillId=${job.skillId} で message/send すると ${job.title} が実行される`]
  }));
  const allSkills = [
    {
      id: "mission.execute",
      name: "Autonomous mission (plan → real runs → adapt → report)",
      description:
        "目標を1つ渡すと、オーケストレーターが専門エージェントを自律選抜し、実実行→観察→適応判断→引用ゲート付き統合レポートまで回す。",
      tags: ["mission", "orchestrator", "autonomous", "real-run"],
      examples: ["skillId=mission.execute で message/send すると自律ミッションが開始される"]
    },
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
    ...executableSkills
  ];

  return {
    protocolVersion: "0.3.0",
    name: "Agent Guild — A2A Marketplace Broker",
    description:
      "Agent GuildのA2A Agent Marketplaceとして、必要な能力を持つAIエージェントを探索・編成し、DevOps改善タスクを委任するブローカー。",
    url: `${baseUrl}/a2a`,
    preferredTransport: "JSONRPC",
    provider: {
      organization: "Agent Guild",
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
    skills: allSkills,
    metadata: {
      endpoints: {
        marketEndpoint: `${baseUrl}/api/market`,
        recommendEndpoint: `${baseUrl}/api/recommend`,
        agentCardDiscoverEndpoint: `${baseUrl}/api/agent-card/discover`,
        hiresEndpoint: `${baseUrl}/api/hires`,
        agentJobsEndpoint: `${baseUrl}/api/agent-jobs`,
        agentRunsEndpoint: `${baseUrl}/api/agent-runs`,
        missionsEndpoint: `${baseUrl}/api/missions`,
        agentStatsEndpoint: `${baseUrl}/api/agent-stats`
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

  if (!opsGenAi) {
    return localGeminiRecommendation(recommendation, "Gemini is not configured (API key / Vertex ADC)");
  }

  const ai = opsGenAi.client;
  const prompt = [
    "You are the strategy agent for Agent Guild, an A2A Agent Marketplace for DevOps Mission Control.",
    "Return strict JSON only. No markdown.",
    "",
    "Product:",
    "Agent Guild | A2A Agent Marketplace for DevOps Mission Control | 必要なAIエージェントを選び、任せて検証する",
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
    service: "agent-guild",
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
    missionControl: {
      enabled: Boolean(opsGenAi),
      activeMission: activeMissionId,
      maxStepsPerMission: 5
    },
    ipAllowlist: ipAllowlistSummary
  });
});

app.get("/api/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "agent-guild",
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
    missionControl: {
      enabled: Boolean(opsGenAi),
      activeMission: activeMissionId,
      maxStepsPerMission: 5
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

// ---------------------------------------------------------------------------
// Mission Control API
// ---------------------------------------------------------------------------

const MissionCreateSchema = z.object({ goal: z.string().trim().min(8).max(2000) });

app.post("/api/missions", async (req, res) => {
  const parsed = MissionCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: "goal は8〜2000文字で入力してください", issues: parsed.error.issues });
    return;
  }
  try {
    const started = await startMission(parsed.data.goal, "web", publicBaseUrl(req));
    if (!started.mission) {
      res.status(started.status).json({ error: started.error });
      return;
    }
    res.status(202).json({ missionId: started.mission.id, status: started.mission.status });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "mission create failed" });
  }
});

app.get("/api/missions", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 30);
  try {
    res.json({ missions: await runStore.listMissions(limit), backend: runStore.backend, active: activeMissionId });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "mission list failed" });
  }
});

app.get("/api/missions/:id", async (req, res) => {
  if (!RUN_ID_PATTERN.test(req.params.id)) {
    res.status(400).json({ error: "invalid_mission_id" });
    return;
  }
  try {
    const mission = await runStore.getMission(req.params.id);
    if (!mission) {
      res.status(404).json({ error: "mission_not_found" });
      return;
    }
    res.json({ mission });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "mission get failed" });
  }
});

// 実績ベースのエージェント統計。演出値ではなく実ラン履歴から算出。
app.get("/api/agent-stats", async (_req, res) => {
  try {
    const runs = await runStore.listRuns(50);
    res.json({ stats: computeAgentStats(runs, Object.keys(AGENT_JOBS)), sampleRuns: runs.length, backend: runStore.backend });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "agent stats failed" });
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
  const scenario = INCIDENT_DRILL_SCENARIOS[Math.floor(Math.random() * INCIDENT_DRILL_SCENARIOS.length)];
  const scenarioView = toIncidentDrillScenarioView(scenario);
  console.log(
    JSON.stringify({ severity: scenarioView.signals[0].severity, scenarioId: scenario.id, message: `[incident-drill ${drillId}] ${scenarioView.signals[0].message}` })
  );
  console.log(
    JSON.stringify({ severity: scenarioView.signals[1].severity, scenarioId: scenario.id, message: `[incident-drill ${drillId}] ${scenarioView.signals[1].message}` })
  );
  res.json({
    ok: true,
    drillId,
    scenario: scenarioView,
    note: "Cloud Loggingに合成イベントを2件記録しました。約15秒後にSRE監査で検出できます。"
  });
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
    "Agent Guild mission request";
  const baseUrl = publicBaseUrl(req);

  // A2A実タスク: 実行済みラン/ミッションの状態照会 (state persistence 付き)
  if (method === "tasks/get") {
    const taskId = String(req.body?.params?.id || "");
    const run = RUN_ID_PATTERN.test(taskId) ? await runStore.getRun(taskId).catch(() => null) : null;
    if (run) {
      res.json({ jsonrpc: "2.0", id, result: opsRunToA2ATask(run) });
      return;
    }
    const mission = RUN_ID_PATTERN.test(taskId) ? await runStore.getMission(taskId).catch(() => null) : null;
    if (mission) {
      res.json({ jsonrpc: "2.0", id, result: missionToA2ATask(mission) });
      return;
    }
    res.json({ jsonrpc: "2.0", id, error: { code: -32001, message: "Task not found" } });
    return;
  }

  const skillId = String(req.body?.params?.message?.metadata?.skillId || "");

  // A2A実タスク: 自律ミッション (計画→実実行→適応→統合レポート)
  if (skillId === "mission.execute") {
    const started = await startMission(String(text).slice(0, 2000), "a2a", baseUrl);
    if (!started.mission) {
      res.json({ jsonrpc: "2.0", id, error: { code: -32000, message: started.error ?? "mission failed" } });
      return;
    }
    res.json({ jsonrpc: "2.0", id, result: missionToA2ATask(started.mission) });
    return;
  }

  // A2A実タスク: 登録スキルへの委任 = 雇用契約 + 実実行
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

  // 登録スキル外のmessage/send: 市場推薦(ローカル能力モデル)で応答し、実実行スキルの一覧を案内する
  const recommendation = recommendSquad(String(text), ["market-broker", "gemini-strategist", "release-guardian"], 140);

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
              executableSkillIds: Object.keys(A2A_SKILL_TO_AGENT),
              endpoints: {
                market: `${baseUrl}/api/market`,
                recommend: `${baseUrl}/api/recommend`,
                agentRuns: `${baseUrl}/api/agent-runs`,
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
  console.log(`Agent Guild — A2A Agent Marketplace listening on http://${displayHost}:${port}`);
});
