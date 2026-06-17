import { GoogleGenAI } from "@google/genai";
import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { ipAllowlistMiddleware, ipAllowlistSummary } from "./ipAllowlist.js";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine.js";
import { MARKET_AGENTS } from "../src/market.js";
import type { GeminiRecommendation } from "../src/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 8080);
const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const RecommendSchema = z.object({
  projectBrief: z.string().trim().min(1).max(20000),
  selectedAgentIds: z.array(z.string()).max(8).default([])
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
      organization: "Buddypia Hackathon",
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
        id: "agent.hire",
        name: "Hire a squad",
        description: "予算内でエージェントを購入し、企画・実装・運用・統制スコアの改善量を返す。",
        tags: ["gamification", "capability-score", "squad"]
      },
      {
        id: "task.delegate",
        name: "Delegate DevOps task",
        description: "選ばれたエージェントへA2A message/send形式で検証可能なタスクを渡す。",
        tags: ["json-rpc", "handoff", "cloud-run"]
      }
    ],
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

  if (!apiKey) {
    return localGeminiRecommendation(recommendation, "GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = [
    "You are the strategy agent for a Japanese DevOps x AI Agent hackathon entry.",
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

app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));
app.use(ipAllowlistMiddleware);

app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "a2a-agent-marketplace",
    model,
    agents: MARKET_AGENTS.length,
    ipAllowlist: ipAllowlistSummary
  });
});

app.get("/api/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "a2a-agent-marketplace",
    model,
    agents: MARKET_AGENTS.length,
    ipAllowlist: ipAllowlistSummary
  });
});

app.get("/api/market", (_req, res) => {
  res.json({ agents: MARKET_AGENTS });
});

app.post("/api/recommend", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  try {
    const result = await runGemini(parsed.data.projectBrief, parsed.data.selectedAgentIds);
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

app.post("/a2a", (req, res) => {
  const id = typeof req.body?.id === "undefined" ? randomUUID() : req.body.id;
  const method = String(req.body?.method || "message/send");
  const text =
    req.body?.params?.message?.parts?.find((part: { text?: string }) => typeof part.text === "string")?.text ||
    req.body?.params?.text ||
    "DevOps x AI Agent marketplace request";
  const recommendation = recommendSquad(String(text), [], 140);

  res.json({
    jsonrpc: "2.0",
    id,
    result: {
      id: randomUUID(),
      kind: "task",
      contextId: randomUUID(),
      status: {
        state: "completed",
        message: {
          role: "agent",
          parts: [
            {
              kind: "text",
              text: `${method}: ${recommendation.headline}`
            }
          ]
        }
      },
      artifacts: [
        {
          name: "marketplace-recommendation",
          parts: [
            {
              kind: "data",
              data: {
                selected: recommendation.selected.map((agent) => agent.name),
                after: recommendation.after,
                timeline: recommendation.a2aTimeline
              }
            }
          ]
        }
      ]
    }
  });
});

const distPath = path.resolve(__dirname, "../../dist");
app.use(express.static(distPath));
app.use((_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`A2A Agent Marketplace listening on ${port}`);
});
