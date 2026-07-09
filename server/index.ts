import { GoogleGenAI } from "@google/genai";
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

const app = express();
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";
const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

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

function geminiSecretConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
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
        agentCardDiscoverEndpoint: `${baseUrl}/api/agent-card/discover`
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
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);

  if (!apiKey) {
    return localGeminiRecommendation(recommendation, "GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
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
    geminiConfigured: geminiSecretConfigured(),
    ipAllowlist: ipAllowlistSummary
  });
});

app.get("/api/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "a2a-agent-marketplace",
    model,
    agents: MARKET_AGENTS.length,
    geminiConfigured: geminiSecretConfigured(),
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
