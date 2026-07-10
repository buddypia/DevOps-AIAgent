import { GoogleGenAI } from "@google/genai";
import { GoogleAuth } from "google-auth-library";
import { randomUUID } from "node:crypto";
import { z } from "zod";

// ---------------------------------------------------------------------------
// 設定 (Zod検証済みenv)
// ---------------------------------------------------------------------------

const OpsConfigSchema = z.object({
  project: z.string().min(1).optional(),
  location: z.string().min(1).default("asia-northeast1"),
  model: z.string().min(1).default("gemini-3.5-flash"),
  targetService: z.string().regex(/^[a-z0-9-]{1,63}$/).default("a2a-agent-marketplace"),
  // allowlist エントリ: "service" または "<gcp-project>/service" (別GCPプロジェクトのログを対象化)
  targetAllowlist: z
    .array(z.string().regex(/^(?:[a-z][a-z0-9-]{4,28}[a-z0-9]\/)?[a-z0-9-]{1,63}$/))
    .default(["a2a-agent-marketplace", "aitech-good-a13973/vibementor-ai"]),
  lookbackMinutes: z.number().int().min(5).max(1440).default(180),
  // 概算単価 (USD / 1M tokens)。実測請求ではなく見積り表示用
  costInputPerMTok: z.number().nonnegative().default(0.3),
  costOutputPerMTok: z.number().nonnegative().default(2.5)
});

export type OpsConfig = z.infer<typeof OpsConfigSchema>;

export function getOpsConfig(env: NodeJS.ProcessEnv = process.env): OpsConfig {
  return OpsConfigSchema.parse({
    project: env.GOOGLE_CLOUD_PROJECT || undefined,
    location: env.GOOGLE_CLOUD_LOCATION || undefined,
    model: env.GEMINI_MODEL || undefined,
    targetService: env.OPS_TARGET_SERVICE || undefined,
    targetAllowlist: env.OPS_TARGET_ALLOWLIST ? env.OPS_TARGET_ALLOWLIST.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    lookbackMinutes: env.OPS_LOOKBACK_MINUTES ? Number(env.OPS_LOOKBACK_MINUTES) : undefined,
    costInputPerMTok: env.OPS_COST_INPUT_PER_MTOK ? Number(env.OPS_COST_INPUT_PER_MTOK) : undefined,
    costOutputPerMTok: env.OPS_COST_OUTPUT_PER_MTOK ? Number(env.OPS_COST_OUTPUT_PER_MTOK) : undefined
  });
}

export type OpsTarget = { service: string; project?: string };

function parseTargetEntry(entry: string): OpsTarget {
  const separator = entry.indexOf("/");
  if (separator < 0) return { service: entry };
  return { project: entry.slice(0, separator), service: entry.slice(separator + 1) };
}

// 要求サービスを allowlist と照合し、監視対象の {service, project} を解決する。
// allowlist 外の要求はデフォルトターゲットへフォールバック。
export function resolveTarget(config: OpsConfig, requestedService?: string): OpsTarget {
  const targets = config.targetAllowlist.map(parseTargetEntry);
  const requested = requestedService ? targets.find((t) => t.service === requestedService) : undefined;
  const target = requested ?? targets.find((t) => t.service === config.targetService) ?? { service: config.targetService };
  return { service: target.service, project: target.project ?? config.project };
}

// ---------------------------------------------------------------------------
// Gemini クライアント (APIキー優先、なければ Vertex AI + ADC — シークレット不要)
// ---------------------------------------------------------------------------

export type GenAIClient = {
  models: {
    generateContent(params: {
      model: string;
      contents: string;
      config?: { responseMimeType?: string; temperature?: number; maxOutputTokens?: number };
    }): Promise<{ text?: string; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } }>;
  };
};

export function createGenAiClient(config: OpsConfig = getOpsConfig()): { client: GenAIClient; mode: "api-key" | "vertex" } | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (apiKey) return { client: new GoogleGenAI({ apiKey }), mode: "api-key" };
  if (config.project) {
    return { client: new GoogleGenAI({ vertexai: true, project: config.project, location: config.location }), mode: "vertex" };
  }
  return null;
}

// ---------------------------------------------------------------------------
// 証拠 (実Cloud Loggingエントリ) — redaction + 引用ID付き
// ---------------------------------------------------------------------------

export type LogEvidence = {
  id: string;
  timestamp: string;
  severity: string;
  service: string;
  message: string;
};

const REDACTION_RULES: Array<[RegExp, string]> = [
  [/(bearer\s+)[a-z0-9\-_.=+/]{8,}/gi, "$1[REDACTED]"],
  [/AIza[0-9A-Za-z\-_]{35}/g, "[REDACTED_API_KEY]"],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]"],
  [/((?:api[_-]?key|token|secret|password|authorization)["']?\s*[:=]\s*["']?)[^"'\s,}]{6,}/gi, "$1[REDACTED]"]
];

export function redactSensitiveText(text: string): string {
  let out = text;
  for (const [pattern, replacement] of REDACTION_RULES) out = out.replace(pattern, replacement);
  return out;
}

type RawLogEntry = {
  insertId?: string;
  timestamp?: string;
  severity?: string;
  textPayload?: string;
  jsonPayload?: Record<string, unknown>;
  httpRequest?: { status?: number; requestMethod?: string; requestUrl?: string; latency?: string };
  resource?: { labels?: Record<string, string> };
};

export function summarizeLogEntry(entry: RawLogEntry, index: number): LogEvidence {
  let message = "";
  if (typeof entry.textPayload === "string" && entry.textPayload.trim()) {
    message = entry.textPayload.trim();
  } else if (entry.jsonPayload && typeof entry.jsonPayload === "object") {
    const p = entry.jsonPayload;
    const candidate = [p.message, p.msg, p.error].find((v) => typeof v === "string" && v.trim());
    message = typeof candidate === "string" ? candidate.trim() : JSON.stringify(p);
  } else if (entry.httpRequest) {
    const r = entry.httpRequest;
    message = `${r.requestMethod ?? "?"} ${r.requestUrl ?? "?"} -> ${r.status ?? "?"} (${r.latency ?? "-"})`;
  } else {
    message = "(no payload)";
  }
  return {
    id: entry.insertId?.trim() || `evt-${index}`,
    timestamp: entry.timestamp ?? "",
    severity: entry.severity ?? "DEFAULT",
    service: entry.resource?.labels?.service_name ?? "",
    message: redactSensitiveText(message).slice(0, 240)
  };
}

const MAX_EVIDENCE_ENTRIES = 60;

export type EvidenceFetcher = (args: { service: string; project?: string; lookbackMinutes: number }) => Promise<LogEvidence[]>;

export function createLoggingEvidenceFetcher(config: OpsConfig, auth: GoogleAuth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" })): EvidenceFetcher {
  async function listEntries(project: string | undefined, filter: string, pageSize: number): Promise<RawLogEntry[]> {
    const token = await auth.getAccessToken();
    const response = await fetch("https://logging.googleapis.com/v2/entries:list", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        resourceNames: [`projects/${project}`],
        filter,
        orderBy: "timestamp desc",
        pageSize
      })
    });
    if (!response.ok) throw new Error(`Cloud Logging API error: ${response.status} ${(await response.text()).slice(0, 200)}`);
    const body = (await response.json()) as { entries?: RawLogEntry[] };
    return body.entries ?? [];
  }

  return async ({ service, project, lookbackMinutes }) => {
    const logProject = project ?? config.project;
    const since = new Date(Date.now() - lookbackMinutes * 60_000).toISOString();
    const base = `resource.type="cloud_run_revision" AND resource.labels.service_name="${service}" AND timestamp>="${since}"`;
    const [problems, context] = await Promise.all([
      listEntries(logProject, `${base} AND severity>=WARNING`, 40),
      listEntries(logProject, base, 20)
    ]);
    const seen = new Set<string>();
    const merged: LogEvidence[] = [];
    for (const [i, entry] of [...problems, ...context].entries()) {
      const summarized = summarizeLogEntry(entry, i);
      if (seen.has(summarized.id)) continue;
      seen.add(summarized.id);
      merged.push(summarized);
      if (merged.length >= MAX_EVIDENCE_ENTRIES) break;
    }
    return merged;
  };
}

// ---------------------------------------------------------------------------
// Maker (トリアージ) / Checker (独立検証) — maker ≠ checker
// ---------------------------------------------------------------------------

const MakerOutputSchema = z.object({
  serviceHealth: z.enum(["healthy", "degraded", "critical"]),
  summary: z.string().min(1).max(600),
  findings: z
    .array(
      z.object({
        title: z.string().min(1).max(160),
        severity: z.enum(["critical", "high", "medium", "low"]),
        hypothesis: z.string().min(1).max(500),
        recommendedAction: z.string().min(1).max(500),
        citedLogIds: z.array(z.string().min(1)).min(1).max(8)
      })
    )
    .max(5)
});

const CheckerOutputSchema = z.object({
  reviews: z.array(
    z.object({
      index: z.number().int().min(0),
      verdict: z.enum(["confirmed", "refuted", "uncertain"]),
      reason: z.string().min(1).max(300)
    })
  )
});

export type Finding = z.infer<typeof MakerOutputSchema>["findings"][number] & {
  gate: { citationsValid: boolean; invalidCitations: string[] };
  checker: { verdict: "confirmed" | "refuted" | "uncertain"; reason: string };
  accepted: boolean;
};

export function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1] ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
  return JSON.parse(candidate);
}

function evidenceBlock(evidence: LogEvidence[]): string {
  return evidence.map((e) => `[${e.id}] ${e.timestamp} ${e.severity} ${e.message}`).join("\n");
}

// 客観ゲート: 全citationが実在する証拠IDを指すか (機械検証 — 幻覚は落ちる)
export function applyCitationGate(
  findings: z.infer<typeof MakerOutputSchema>["findings"],
  evidenceIds: ReadonlySet<string>
): Array<{ citationsValid: boolean; invalidCitations: string[] }> {
  return findings.map((finding) => {
    const invalidCitations = finding.citedLogIds.filter((id) => !evidenceIds.has(id));
    return { citationsValid: invalidCitations.length === 0, invalidCitations };
  });
}

// ---------------------------------------------------------------------------
// 実行ラン (状態はストア経由で永続化 — "エージェントは忘れても、ストアは忘れない")
// ---------------------------------------------------------------------------

export type RunPhaseLog = { phase: string; status: "done" | "error"; detail: string; at: string };

export type OpsAgentRun = {
  id: string;
  agentId: string;
  targetService: string;
  trigger: "web" | "a2a";
  status: "queued" | "running" | "completed" | "failed";
  phases: RunPhaseLog[];
  evidenceCount: number;
  evidenceWindowMinutes: number;
  evidenceSample: LogEvidence[];
  serviceHealth: "healthy" | "degraded" | "critical" | "unknown";
  summary: string;
  findings: Finding[];
  escalations: Array<{ title: string; recommendedAction: string; severity: string; status: "pending-human" }>;
  usage: { promptTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number };
  model: string;
  mode: "api-key" | "vertex";
  error?: string;
  startedAt: string;
  finishedAt?: string;
};

export type RunSaver = { saveRun(run: OpsAgentRun): Promise<void> };

export type OpsRunDeps = {
  config: OpsConfig;
  genAi: { client: GenAIClient; mode: "api-key" | "vertex" };
  fetchEvidence: EvidenceFetcher;
  store: RunSaver;
  timeBudgetMs?: number;
};

export function createRun(agentId: string, targetService: string, trigger: "web" | "a2a", deps: Pick<OpsRunDeps, "config" | "genAi">): OpsAgentRun {
  return {
    id: randomUUID(),
    agentId,
    targetService,
    trigger,
    status: "queued",
    phases: [],
    evidenceCount: 0,
    evidenceWindowMinutes: deps.config.lookbackMinutes,
    evidenceSample: [],
    serviceHealth: "unknown",
    summary: "",
    findings: [],
    escalations: [],
    usage: { promptTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
    model: deps.config.model,
    mode: deps.genAi.mode,
    startedAt: new Date().toISOString()
  };
}

function addUsage(run: OpsAgentRun, config: OpsConfig, usage?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }) {
  const prompt = usage?.promptTokenCount ?? 0;
  const output = usage?.candidatesTokenCount ?? 0;
  run.usage.promptTokens += prompt;
  run.usage.outputTokens += output;
  run.usage.totalTokens += usage?.totalTokenCount ?? prompt + output;
  run.usage.estimatedCostUsd = Number(
    ((run.usage.promptTokens / 1_000_000) * config.costInputPerMTok + (run.usage.outputTokens / 1_000_000) * config.costOutputPerMTok).toFixed(6)
  );
}

export async function executeOpsAgentRun(run: OpsAgentRun, deps: OpsRunDeps): Promise<OpsAgentRun> {
  const { config, genAi, fetchEvidence, store } = deps;
  const deadline = Date.now() + (deps.timeBudgetMs ?? 55_000);
  const phase = async (name: string, detail: string, status: "done" | "error" = "done") => {
    run.phases.push({ phase: name, status, detail, at: new Date().toISOString() });
    await store.saveRun(run);
  };
  const checkDeadline = () => {
    if (Date.now() > deadline) throw new Error("hard stop: time budget exceeded");
  };

  try {
    run.status = "running";
    await store.saveRun(run);

    // ① 発見 — 実Cloud Loggingから証拠収集 (allowlist の project/service 指定があれば当該プロジェクトを参照)
    const target = resolveTarget(config, run.targetService);
    let evidence = await fetchEvidence({ service: run.targetService, project: target.project, lookbackMinutes: config.lookbackMinutes });
    if (evidence.length === 0) {
      evidence = await fetchEvidence({ service: run.targetService, project: target.project, lookbackMinutes: 1440 });
      run.evidenceWindowMinutes = 1440;
    }
    run.evidenceCount = evidence.length;
    run.evidenceSample = evidence.slice(0, 12);
    await phase("evidence", `Cloud Loggingから実ログ ${evidence.length} 件を取得 (project: ${target.project ?? "-"}, ${run.evidenceWindowMinutes}分窓, redaction適用)`);
    checkDeadline();

    if (evidence.length === 0) {
      run.serviceHealth = "unknown";
      run.summary = `対象サービス ${run.targetService} のログが直近24時間に存在しないため、トリアージ対象がありません。`;
      run.status = "completed";
      run.finishedAt = new Date().toISOString();
      await phase("decide", "証拠ゼロのため完了 (Geminiは呼び出さずコスト0)");
      return run;
    }

    // ② maker — Geminiによる実トリアージ
    const makerPrompt = [
      "You are an SRE triage agent for a Cloud Run service. Analyze ONLY the log evidence below.",
      "Return strict JSON only. Cite ONLY ids that appear in [brackets]. Never invent ids.",
      "",
      `Target service: ${run.targetService}`,
      "Log evidence:",
      evidenceBlock(evidence),
      "",
      "JSON schema:",
      JSON.stringify({
        serviceHealth: "healthy|degraded|critical",
        summary: "1-3 sentence Japanese summary of service state",
        findings: [
          {
            title: "short Japanese title",
            severity: "critical|high|medium|low",
            hypothesis: "probable cause in Japanese",
            recommendedAction: "concrete next action in Japanese (gcloud command if applicable)",
            citedLogIds: ["insertId from evidence"]
          }
        ]
      })
    ].join("\n");
    const makerResponse = await genAi.client.models.generateContent({
      model: config.model,
      contents: makerPrompt,
      config: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 2048 }
    });
    addUsage(run, config, makerResponse.usageMetadata);
    const maker = MakerOutputSchema.parse(parseModelJson(makerResponse.text ?? "{}"));
    run.serviceHealth = maker.serviceHealth;
    run.summary = maker.summary;
    await phase("triage", `maker(${config.model})がfindings ${maker.findings.length} 件を生成`);
    checkDeadline();

    // ③ 客観ゲート — 引用実在性の機械検証
    const evidenceIds = new Set(evidence.map((e) => e.id));
    const gates = applyCitationGate(maker.findings, evidenceIds);
    const gateFailures = gates.filter((g) => !g.citationsValid).length;
    await phase("gate", gateFailures === 0 ? "全findingの引用が実ログと一致 (citation gate PASS)" : `引用ゲートで ${gateFailures} 件を棄却対象に`);
    checkDeadline();

    // ④ checker — 独立レビュー (makerの推論は渡さない)
    let reviews: z.infer<typeof CheckerOutputSchema>["reviews"] = [];
    let checkerNote = "";
    if (maker.findings.length > 0) {
      try {
        const checkerPrompt = [
          "You are an INDEPENDENT SRE reviewer. You did not write these findings.",
          "For each finding, verdict whether the log evidence supports it. Refute anything unsupported.",
          "Return strict JSON only.",
          "",
          "Log evidence:",
          evidenceBlock(evidence),
          "",
          "Findings to review:",
          JSON.stringify(maker.findings.map((f, index) => ({ index, title: f.title, severity: f.severity, hypothesis: f.hypothesis, citedLogIds: f.citedLogIds }))),
          "",
          "JSON schema:",
          JSON.stringify({ reviews: [{ index: 0, verdict: "confirmed|refuted|uncertain", reason: "short Japanese reason" }] })
        ].join("\n");
        const checkerResponse = await genAi.client.models.generateContent({
          model: config.model,
          contents: checkerPrompt,
          config: { responseMimeType: "application/json", temperature: 0, maxOutputTokens: 1024 }
        });
        addUsage(run, config, checkerResponse.usageMetadata);
        reviews = CheckerOutputSchema.parse(parseModelJson(checkerResponse.text ?? "{}")).reviews;
        checkerNote = `checkerが独立検証: confirmed ${reviews.filter((r) => r.verdict === "confirmed").length} / refuted ${reviews.filter((r) => r.verdict === "refuted").length}`;
      } catch (error) {
        checkerNote = `checker失敗のためuncertain扱い: ${error instanceof Error ? error.message.slice(0, 120) : "unknown"}`;
      }
    } else {
      checkerNote = "findingsゼロのためchecker省略";
    }
    await phase("review", checkerNote);

    // ⑤ 判定 — gate PASS かつ checkerがrefutedでないものだけ受入
    run.findings = maker.findings.map((finding, index) => {
      const gate = gates[index];
      const review = reviews.find((r) => r.index === index);
      const checker = review ?? { verdict: "uncertain" as const, reason: "checker未評価" };
      return {
        ...finding,
        gate,
        checker: { verdict: checker.verdict, reason: checker.reason },
        accepted: gate.citationsValid && checker.verdict !== "refuted"
      };
    });
    run.escalations = run.findings
      .filter((f) => f.accepted && (f.severity === "critical" || f.severity === "high"))
      .map((f) => ({ title: f.title, recommendedAction: f.recommendedAction, severity: f.severity, status: "pending-human" as const }));
    run.status = "completed";
    run.finishedAt = new Date().toISOString();
    await phase(
      "decide",
      `受入 ${run.findings.filter((f) => f.accepted).length}/${run.findings.length} 件、人間承認待ちエスカレーション ${run.escalations.length} 件 (自動実行はしない)`
    );
    return run;
  } catch (error) {
    run.status = "failed";
    run.error = error instanceof Error ? error.message.slice(0, 300) : "unknown error";
    run.finishedAt = new Date().toISOString();
    run.phases.push({ phase: "error", status: "error", detail: run.error, at: run.finishedAt });
    await store.saveRun(run);
    return run;
  }
}
