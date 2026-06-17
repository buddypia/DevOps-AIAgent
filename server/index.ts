import { GoogleGenAI } from "@google/genai";
import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { ipAllowlistMiddleware, ipAllowlistSummary } from "./ipAllowlist.js";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine.js";
import { buildSquadContract } from "../src/contracts.js";
import { buildJudgeDrill } from "../src/judgeDrill.js";
import { DEFAULT_PROJECT_BRIEF, MARKET_AGENTS } from "../src/market.js";
import { buildMissionRun } from "../src/mission.js";
import { buildOpsDrill } from "../src/ops.js";
import { buildPitchRun } from "../src/pitch.js";
import { buildJudgeProof } from "../src/proof.js";
import { SUBMISSION_PROOF } from "../src/submission.js";
import type { CiProof } from "../src/proof.js";
import { buildWinningStrategy } from "../src/strategy.js";
import type { GeminiRecommendation } from "../src/types.js";

const app = express();
const port = Number(process.env.PORT || 8080);
const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const RecommendSchema = z.object({
  projectBrief: z.string().trim().min(1).max(20000),
  selectedAgentIds: z.array(z.string()).max(8).default([])
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
        id: "contract.issue",
        name: "Issue agent contracts",
        description: "選択したAIごとの成果物、受入条件、SLA、検証コマンド、支払い条件を生成する。",
        tags: ["contract", "procurement", "acceptance", "sla", "marketplace"]
      },
      {
        id: "task.delegate",
        name: "Delegate DevOps task",
        description: "選ばれたエージェントへA2A message/send形式で検証可能なタスクを渡す。",
        tags: ["json-rpc", "handoff", "cloud-run"]
      },
      {
        id: "strategy.audit",
        name: "Audit competitive strategy",
        description: "競合、SWOT、審査スコア、提出準備を評価し、次に雇うべきAI能力を返す。",
        tags: ["competitive-analysis", "swot", "judge-score", "submission"]
      },
      {
        id: "mission.run",
        name: "Run autonomous submission mission",
        description: "審査で弱い項目を見つけ、A2A委任、検証runbook、ProtoPedia提出パックを生成する。",
        tags: ["autonomy", "evidence", "submission-pack", "devops"]
      },
      {
        id: "submission.package",
        name: "Package ProtoPedia submission assets",
        description: "動画ストーリーボード、システム構成図、ストーリー、必須タグ、提出チェックリストを返す。",
        tags: ["protopedia", "video", "architecture", "findy_hackathon"]
      },
      {
        id: "ops.drill",
        name: "Run Cloud Run operations drill",
        description: "公開デモの稼働シグナルを読み、継続・ロールバック・追加雇用を判断してDevOps証跡を返す。",
        tags: ["cloud-run", "sre", "rollback", "observability", "devops"]
      },
      {
        id: "ci.verify",
        name: "Verify GitHub Actions quality gate",
        description: "公開GitHub Actionsの最新main runを読み、typecheck/test/build/architecture checkの証跡を返す。",
        tags: ["github-actions", "ci", "quality-gate", "devops"]
      },
      {
        id: "pitch.director",
        name: "Direct the 30-second submission pitch",
        description: "審査員が30秒で価値を理解できる録画順、字幕、証拠リンク、提出残リスクを生成する。",
        tags: ["pitch", "video", "protopedia", "judge-experience", "submission"]
      },
      {
        id: "judge.drill",
        name: "Prepare skeptical judge rebuttals",
        description: "審査5項目ごとの厳しめ質問、短い回答、証拠リンク、次アクションを生成する。",
        tags: ["judge-drill", "qa", "rebuttal", "evidence", "scorecard"]
      },
      {
        id: "judge.proof",
        name: "Build one-click judge proof bundle",
        description: "Gemini、Cloud Run、A2A、競合/SWOT、Mission、Ops、CI、Pitch、Judge Drill、提出URLを1つの審査証拠束として返す。",
        tags: ["judge-proof", "gemini", "cloud-run", "a2a", "ci", "pitch", "judge-drill", "submission"]
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
  const strategy = buildWinningStrategy(recommendation);

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

type GitHubWorkflowRunsResponse = {
  workflow_runs?: Array<{
    id: number;
    name?: string;
    display_title?: string;
    head_branch: string;
    status: string;
    conclusion: string | null;
    html_url: string;
    updated_at: string;
  }>;
};

const ciRunsApiUrl = "https://api.github.com/repos/buddypia/DevOps-AIAgent/actions/workflows/ci.yml/runs?branch=main&per_page=1";

function ciUnavailable(reason: string, status: CiProof["status"] = "watch"): CiProof {
  return {
    status,
    conclusion: "unavailable",
    url: SUBMISSION_PROOF.ciWorkflowUrl,
    workflowUrl: SUBMISSION_PROOF.ciWorkflowUrl,
    branch: "main",
    checkedAt: new Date().toISOString(),
    evidence: `GitHub Actions status could not be read (${reason}); workflow URL remains public.`
  };
}

function ciStatus(status: string, conclusion: string | null): CiProof["status"] {
  if (status !== "completed") return "watch";
  return conclusion === "success" ? "passed" : "missing";
}

async function fetchCiProof(): Promise<CiProof> {
  try {
    const response = await fetch(ciRunsApiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "a2a-agent-marketplace"
      },
      signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) return ciUnavailable(`GitHub API HTTP ${response.status}`);

    const payload = (await response.json()) as GitHubWorkflowRunsResponse;
    const run = payload.workflow_runs?.[0];
    if (!run) return ciUnavailable("no workflow run on main yet");

    const status = ciStatus(run.status, run.conclusion);
    const conclusion = run.conclusion ?? run.status;
    return {
      status,
      conclusion,
      url: run.html_url || SUBMISSION_PROOF.ciWorkflowUrl,
      workflowUrl: SUBMISSION_PROOF.ciWorkflowUrl,
      branch: run.head_branch || "main",
      checkedAt: run.updated_at,
      runId: run.id,
      evidence:
        status === "passed"
          ? `Latest main CI run ${run.id} completed successfully: ${run.display_title ?? run.name ?? "CI"}.`
          : `Latest main CI run ${run.id} is ${run.status}/${conclusion}: ${run.display_title ?? run.name ?? "CI"}.`
    };
  } catch (error) {
    return ciUnavailable(error instanceof Error ? error.message : "request failed");
  }
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

app.get("/api/submission-kit", (_req, res) => {
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy);
  res.json({
    title: mission.submissionPack.protopediaTitle,
    tags: mission.submissionPack.tags,
    story: mission.submissionPack.story,
    demoScript: mission.submissionPack.demoScript,
    videoStoryboard: mission.submissionPack.videoStoryboard,
    architectureDiagramUrl: mission.submissionPack.architectureDiagramUrl,
    storyMarkdownPath: mission.submissionPack.storyMarkdownPath,
    publicGitHubUrl: mission.submissionPack.publicGitHubUrl,
    ciWorkflowUrl: mission.submissionPack.ciWorkflowUrl,
    deployedUrl: mission.submissionPack.deployedUrl,
    protopediaUrl: mission.submissionPack.protopediaUrl,
    videoUrl: mission.submissionPack.videoUrl,
    requirements: mission.submissionPack.requirements
  });
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

app.post("/api/pitch", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "30秒で審査員に価値、AI自律性、DevOps証跡、提出準備を伝える。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  res.json(
    buildPitchRun({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill
    })
  );
});

app.post("/api/judge-drill", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "審査員からの厳しい質問に、短い回答と証拠リンクで反証する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const pitch = buildPitchRun({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  res.json(
    buildJudgeDrill({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch
    })
  );
});

app.post("/api/proof", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "審査員に1クリックで提出可能性、AI実行、Cloud Run運用、A2A委任を証明する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");

  res.json(
    buildJudgeProof({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      gemini,
      ci
    })
  );
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

app.post("/a2a", (req, res) => {
  const id = typeof req.body?.id === "undefined" ? randomUUID() : req.body.id;
  const method = String(req.body?.method || "message/send");
  const text =
    req.body?.params?.message?.parts?.find((part: { text?: string }) => typeof part.text === "string")?.text ||
    req.body?.params?.text ||
    "DevOps x AI Agent marketplace request";
  const recommendation = recommendSquad(String(text), [], 140);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, String(text));
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  const judgeDrill = buildJudgeDrill({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch
  });

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
                timeline: recommendation.a2aTimeline,
                strategy: {
                  judgeScore: strategy.judgeScore,
                  mvpScore: strategy.mvpScore,
                  moatScore: strategy.moatScore,
                  nextBestAgent: strategy.nextBestAgent?.agent.name ?? null,
                  swot: strategy.swot
                },
                mission: {
                  id: mission.id,
                  summary: mission.summary,
                  autonomyScore: mission.autonomyScore,
                  weakestCriterion: mission.weakestCriterion.label,
                  verificationCommands: mission.verificationCommands,
                  submissionPack: mission.submissionPack
                },
                opsDrill: {
                  id: opsDrill.id,
                  severity: opsDrill.severity,
                  readinessScore: opsDrill.readinessScore,
                  rollbackRecommended: opsDrill.rollbackRecommended,
                  nextOpsAgent: opsDrill.nextOpsAgent?.name ?? null,
                  runbookCommands: opsDrill.runbookCommands
                },
                contract: {
                  id: squadContract.id,
                  contractScore: squadContract.contractScore,
                  totalPrice: squadContract.totalPrice,
                  remainingBudget: squadContract.remainingBudget,
                  contracts: squadContract.contracts.map((contract) => ({
                    agentId: contract.agentId,
                    risk: contract.risk,
                    acceptanceCriteria: contract.acceptanceCriteria
                  }))
                },
                pitch: {
                  id: pitch.id,
                  readinessScore: pitch.readinessScore,
                  totalSeconds: pitch.totalSeconds,
                  scenes: pitch.scenes.map((scene) => ({
                    id: scene.id,
                    timeRange: scene.timeRange,
                    screen: scene.screen,
                    proof: scene.proof
                  })),
                  warnings: pitch.submissionWarnings.map((item) => item.id)
                },
                judgeDrill: {
                  id: judgeDrill.id,
                  readinessScore: judgeDrill.readinessScore,
                  hardestQuestion: judgeDrill.hardestQuestion,
                  objections: judgeDrill.objections.map((objection) => ({
                    criterionId: objection.criterionId,
                    risk: objection.risk,
                    question: objection.question
                  }))
                },
                proofEndpoint: `${publicBaseUrl(req)}/api/proof`,
                ciWorkflowUrl: SUBMISSION_PROOF.ciWorkflowUrl
              }
            }
          ]
        }
      ]
    }
  });
});

const distPath = path.resolve(process.cwd(), "dist");
app.use("/docs", express.static(path.resolve(process.cwd(), "docs")));
app.use(express.static(distPath));
app.use((_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`A2A Agent Marketplace listening on ${port}`);
});
