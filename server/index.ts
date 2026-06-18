import { GoogleGenAI } from "@google/genai";
import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { getClientIp, ipAllowlistMiddleware, ipAllowlistSummary } from "./ipAllowlist.js";
import { buildJudgeAcceptanceMatrix } from "../src/acceptanceMatrix.js";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine.js";
import { buildWinningAutopilot } from "../src/autopilot.js";
import { buildAutonomyLedger } from "../src/autonomyLedger.js";
import { ciStatusFromBadge } from "../src/ciProof.js";
import { buildSquadContract } from "../src/contracts.js";
import { buildDeployRecoveryPlan } from "../src/deployRecovery.js";
import { buildJudgeDemoReceipt } from "../src/demoReceipt.js";
import { buildDemoRunway } from "../src/demoRunway.js";
import { buildSubmissionDossier } from "../src/dossier.js";
import { buildFinalistSimulation } from "../src/finalist.js";
import { buildImpactCase } from "../src/impact.js";
import { buildJudgeBrief } from "../src/judgeBrief.js";
import { buildJudgeCommandCenter } from "../src/judgeCommandCenter.js";
import { buildJudgeDrill } from "../src/judgeDrill.js";
import { buildJudgeTour } from "../src/judgeTour.js";
import { buildLiveEvidenceRun, type LiveEvidenceStatus } from "../src/liveEvidence.js";
import { DEFAULT_PROJECT_BRIEF, MARKET_AGENTS } from "../src/market.js";
import { buildMarketIntelReport } from "../src/marketIntel.js";
import { buildMissionRun } from "../src/mission.js";
import { buildMoatStressTest } from "../src/moatStress.js";
import { buildMvpAudit } from "../src/mvpAudit.js";
import { buildOpsDrill } from "../src/ops.js";
import { buildPilotEconomics } from "../src/pilotEconomics.js";
import { buildPitchRun } from "../src/pitch.js";
import { buildJudgeProof } from "../src/proof.js";
import { buildProtoPediaPublisher } from "../src/publisher.js";
import { buildReleaseDriftGuard, type ReleaseDriftProbe } from "../src/releaseDrift.js";
import { buildSecurityReview } from "../src/security.js";
import { buildSquadOptimizer } from "../src/squadOptimizer.js";
import { buildSubmissionLaunchGate } from "../src/submissionLaunch.js";
import { SUBMISSION_PROOF } from "../src/submission.js";
import type { CiProof } from "../src/proof.js";
import { buildWinningStrategy } from "../src/strategy.js";
import type { GeminiRecommendation } from "../src/types.js";
import { buildUserPilotLab } from "../src/userPilot.js";

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
const LaunchSchema = RecommendSchema.extend({
  protopediaUrl: z.string().optional(),
  videoUrl: z.string().optional()
});
const SquadOptimizerSchema = RecommendSchema.extend({
  budget: z.number().int().positive().max(300).default(140),
  maxSquadSize: z.number().int().min(1).max(6).default(4)
});
const LiveEvidenceSchema = SquadOptimizerSchema;
const ReleaseDriftSchema = RecommendSchema.extend({
  targetUrl: z.string().url().optional()
});
const DeployRecoverySchema = ReleaseDriftSchema.extend({
  lastDeployError: z.string().trim().max(20000).optional()
});
const AcceptanceMatrixSchema = RecommendSchema.extend({
  targetUrl: z.string().url().optional(),
  skipReleaseDrift: z.boolean().optional()
});
const CommandCenterSchema = AcceptanceMatrixSchema.extend({
  protopediaUrl: z.string().optional(),
  videoUrl: z.string().optional()
});

function publicBaseUrl(req: express.Request) {
  const configured = process.env.PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const proto = req.header("x-forwarded-proto") || req.protocol;
  return `${proto}://${req.get("host")}`;
}

function selfProbeHeaders(req: express.Request, extraHeaders: Record<string, string> = {}) {
  const clientIp = getClientIp(req);
  return {
    ...(clientIp ? { "X-Forwarded-For": clientIp } : {}),
    "X-Forwarded-Proto": req.header("x-forwarded-proto") || req.protocol,
    ...extraHeaders
  };
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
        id: "market.intel",
        name: "Build source-backed market intelligence",
        description: "公式ソース付き競合比較、差別化仮説、審査回答、次アクションを提出向けに返す。",
        tags: ["market-intelligence", "competitive-analysis", "sources", "swot", "judge-score"]
      },
      {
        id: "moat.stress",
        name: "Stress-test competitive moat",
        description: "ADK、A2A Marketplace、LangGraph、CrewAI、Dify、AgentOpsからの反論を想定し、証拠付き回答と録画順を返す。",
        tags: ["competitive-analysis", "moat", "judge-qa", "swot", "proof"]
      },
      {
        id: "mvp.audit",
        name: "Audit MVP readiness with hard gates",
        description: "必須技術、審査5項目、DevOps証拠、提出3点をハードゲートで判定し、未達をwatch/failとして返す。",
        tags: ["mvp", "audit", "hard-gates", "judge-score", "submission"]
      },
      {
        id: "acceptance.matrix",
        name: "Build the judge acceptance matrix",
        description: "必須技術、審査5項目、公開証拠、提出物、receiptをaccepted/watch/blockedの受入表に束ねる。",
        tags: ["acceptance", "mvp", "judge-score", "proof", "submission"]
      },
      {
        id: "judge.brief",
        name: "Build the one-page judge brief",
        description: "競合差別化、MVP監査、証拠、30秒導線、残リスクを審査員向けの1枚に束ねる。",
        tags: ["judge-brief", "demo", "mvp", "market-intelligence", "submission"]
      },
      {
        id: "judge.command",
        name: "Build the judge command center",
        description: "Judge Tour、Acceptance Matrix、Release Drift、Pilot Economics、Win Autopilotを初回審査導線へ束ねる。",
        tags: ["judge-command", "first-run", "acceptance", "release-drift", "demo"]
      },
      {
        id: "judge.tour",
        name: "Build the 90-second judge walkthrough",
        description: "審査員が開く順番、話す台詞、反論、証拠リンク、残ブロッカーを90秒導線へ束ねる。",
        tags: ["judge-tour", "walkthrough", "demo", "evidence", "submission"]
      },
      {
        id: "user.pilot",
        name: "Run target-user first-run pilot",
        description: "開発リード、Platform/SRE、提出者が最初の3分で価値へ到達できるかを検証する。",
        tags: ["usability", "pilot", "persona", "first-run", "judge-score"]
      },
      {
        id: "squad.optimize",
        name: "Optimize the winning squad under budget",
        description: "予算内のエージェント編成を総当たりし、審査スコア、必須技術カバレッジ、交換計画、追加予算ギャップを返す。",
        tags: ["squad", "optimizer", "budget", "judge-score", "marketplace"]
      },
      {
        id: "evidence.monitor",
        name: "Monitor live public proof",
        description: "Cloud Run health、Agent Card、A2A、Squad Optimizer、GitHub Actions CIを公開環境でプローブし、ライブ証拠スコアを返す。",
        tags: ["live-proof", "cloud-run", "a2a", "ci", "submission"]
      },
      {
        id: "release.drift",
        name: "Detect Cloud Run release drift",
        description: "公開Cloud Runが最新Agent Card、Acceptance Matrix、A2A artifactを出しているかを検知し、古いrevisionを提出前に止める。",
        tags: ["cloud-run", "release", "drift", "ci", "deployment"]
      },
      {
        id: "deploy.recover",
        name: "Recover stale Cloud Run deployment",
        description: "release drift、gcloud認証、Cloud Build、公開再検証を復旧計画へ変換する。",
        tags: ["cloud-run", "cloud-build", "recovery", "deployment", "runbook"]
      },
      {
        id: "demo.receipt",
        name: "Seal the judge demo receipt",
        description: "審査導線、競合反論、編成判断、公開証拠、外部提出URLを1枚のsha256 receiptとして封印する。",
        tags: ["demo", "receipt", "submission", "judge-proof", "sha256"]
      },
      {
        id: "autonomy.ledger",
        name: "Build the agent autonomy ledger",
        description: "市場探索、判断、契約、A2A委任、検証、運用、提出の連鎖を審査員向けの自律性台帳にする。",
        tags: ["autonomy", "agent-centrality", "a2a", "evidence", "devops"]
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
        id: "submission.publish",
        name: "Prepare paste-ready ProtoPedia publication",
        description: "ProtoPediaに貼る本文、タグ、URL、動画台本、残ギャップを提出直前パッケージとして返す。",
        tags: ["protopedia", "publishing", "video", "submission", "findy_hackathon"]
      },
      {
        id: "demo.runway",
        name: "Run the 30-second judge demo runway",
        description: "審査員が最初に見る30秒の画面順、証拠リンク、録画キュー、残リスクを束ねる。",
        tags: ["demo", "judge-experience", "video", "proof", "submission"]
      },
      {
        id: "win.autopilot",
        name: "Run the one-click winning autopilot",
        description: "競合/SWOT、証拠、最終候補判定、提出、運用を一括実行し、勝てる状態と残アクションを返す。",
        tags: ["autopilot", "winning-strategy", "judge-proof", "submission", "cloud-run"]
      },
      {
        id: "submission.dossier",
        name: "Build the final submission dossier",
        description: "ProtoPedia本文、動画録画順、提出リンク、証拠デッキ、最終チェックを1つのドシエに束ねる。",
        tags: ["submission", "protopedia", "dossier", "video", "judge-proof"]
      },
      {
        id: "submission.launch",
        name: "Validate final submission launch gate",
        description: "ProtoPedia作品URLと動画URLを受け取り、提出3点、タグ、本文、CI、証拠receiptを最終判定する。",
        tags: ["submission", "launch-gate", "protopedia", "video", "mvp"]
      },
      {
        id: "security.review",
        name: "Review public demo security boundaries",
        description: "Secret Manager、IP allowlist、Zod入力制限、A2A信頼境界、CIを審査員向けの安全性証拠に変換する。",
        tags: ["security", "trust-boundary", "secret-manager", "a2a", "cloud-run"]
      },
      {
        id: "impact.case",
        name: "Build practical value impact case",
        description: "対象ユーザー、時間短縮、提出信頼度、運用リスク、導入計画を実用性・体験価値の証拠へ変換する。",
        tags: ["impact", "practicality", "user-value", "roi", "judge-score"]
      },
      {
        id: "pilot.economics",
        name: "Build pilot economics and buyer proof",
        description: "時間短縮、導入費用、回収日数、価格レーン、買い手の反論を投資判断の証拠へ変換する。",
        tags: ["pilot", "economics", "roi", "pricing", "buyer-objection"]
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
        id: "finalist.simulate",
        name: "Simulate finalist judging panel",
        description: "審査員5役の模擬判定で、最終候補スコア、落選理由、残ギャップ、次の一手を返す。",
        tags: ["finalist", "judge-panel", "mvp", "scorecard", "submission"]
      },
      {
        id: "judge.proof",
        name: "Build one-click judge proof bundle",
        description: "Gemini、Cloud Run、A2A、競合/SWOT、Mission、Ops、CI、Pitch、Judge Drill、Finalist、提出URLを1つの審査証拠束として返す。",
        tags: ["judge-proof", "gemini", "cloud-run", "a2a", "ci", "pitch", "judge-drill", "finalist", "submission"]
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
const ciBadgeUrl = "https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml/badge.svg?branch=main";

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

function geminiSecretConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
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

    if (!response.ok) return fetchCiBadgeProof(`GitHub API HTTP ${response.status}`);

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
    return fetchCiBadgeProof(error instanceof Error ? error.message : "request failed");
  }
}

async function fetchCiBadgeProof(apiReason: string): Promise<CiProof> {
  try {
    const response = await fetch(ciBadgeUrl, {
      headers: {
        Accept: "image/svg+xml",
        "User-Agent": "a2a-agent-marketplace"
      },
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) return ciUnavailable(`${apiReason}; badge HTTP ${response.status}`);

    const svg = await response.text();
    const status = ciStatusFromBadge(svg);
    if (status === "watch") return ciUnavailable(`${apiReason}; workflow badge is not conclusive`);

    return {
      status,
      conclusion: status === "passed" ? "badge-passing" : "badge-failing",
      url: SUBMISSION_PROOF.ciWorkflowUrl,
      workflowUrl: SUBMISSION_PROOF.ciWorkflowUrl,
      branch: "main",
      checkedAt: new Date().toISOString(),
      evidence:
        status === "passed"
          ? `GitHub API fallback used because ${apiReason}; public workflow badge reports passing.`
          : `GitHub API fallback used because ${apiReason}; public workflow badge does not report passing.`
    };
  } catch (error) {
    return ciUnavailable(`${apiReason}; badge fallback failed: ${error instanceof Error ? error.message : "request failed"}`);
  }
}

function evidenceScore(status: LiveEvidenceStatus) {
  if (status === "passed") return 100;
  if (status === "watch") return 72;
  return 30;
}

async function liveJsonProbe(input: {
  id: string;
  label: string;
  url: string;
  required: boolean;
  init?: RequestInit;
  evaluate: (payload: unknown) => { status: LiveEvidenceStatus; score?: number; evidence: string };
}) {
  const startedAt = Date.now();
  try {
    const response = await fetch(input.url, {
      ...input.init,
      signal: AbortSignal.timeout(3500)
    });
    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      return {
        id: input.id,
        label: input.label,
        status: "missing" as const,
        score: 30,
        url: input.url,
        evidence: `HTTP ${response.status}`,
        latencyMs,
        required: input.required
      };
    }

    const payload = (await response.json()) as unknown;
    const evaluated = input.evaluate(payload);
    return {
      id: input.id,
      label: input.label,
      status: evaluated.status,
      score: evaluated.score ?? evidenceScore(evaluated.status),
      url: input.url,
      evidence: evaluated.evidence,
      latencyMs,
      required: input.required
    };
  } catch (error) {
    return {
      id: input.id,
      label: input.label,
      status: "missing" as const,
      score: 30,
      url: input.url,
      evidence: error instanceof Error ? error.message : "probe failed",
      latencyMs: Date.now() - startedAt,
      required: input.required
    };
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

app.post("/api/market-intel", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  res.json(
    buildMarketIntelReport({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy
    })
  );
});

app.post("/api/moat-stress", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });

  res.json(
    buildMoatStressTest({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      marketIntel
    })
  );
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

app.post("/api/publisher", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "ProtoPediaに貼る本文、タグ、動画台本、提出URL、残ギャップを一括生成する。");
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
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });

  res.json(
    buildProtoPediaPublisher({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch,
      finalist
    })
  );
});

app.post("/api/demo-run", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "審査員が30秒で価値、証拠、提出準備、運用性を理解できる順番を生成する。");
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
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });

  res.json(
    buildDemoRunway({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch,
      finalist,
      publisher
    })
  );
});

app.post("/api/win-run", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "優勝に必要な証拠、審査適合、提出準備、運用性を一括判定する。");
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
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
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
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });

  res.json(
    buildWinningAutopilot({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      squadContract,
      pitch,
      finalist,
      publisher,
      demoRunway,
      proof
    })
  );
});

app.post("/api/dossier", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "ProtoPedia提出本文、動画録画順、証拠リンク、残ギャップを1つの提出ドシエに束ねる。");
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
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
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
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });
  const autopilot = buildWinningAutopilot({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });

  res.json(
    buildSubmissionDossier({
      recommendation,
      strategy,
      mission,
      pitch,
      finalist,
      publisher,
      demoRunway,
      autopilot,
      proof
    })
  );
});

app.post("/api/mvp-audit", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const mission = buildMissionRun(recommendation, strategy, "MVPとして提出できるかを、必須技術、審査基準、DevOps証拠、提出3点で監査する。");
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
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
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
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });
  const autopilot = buildWinningAutopilot({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });

  res.json(
    buildMvpAudit({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      finalist,
      autopilot,
      dossier,
      proof,
      marketIntel
    })
  );
});

app.post("/api/judge-brief", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const mission = buildMissionRun(recommendation, strategy, "審査員が30秒で価値、証拠、MVP状態、残リスクを理解できる1枚を生成する。");
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
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
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
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });
  const autopilot = buildWinningAutopilot({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });

  res.json(
    buildJudgeBrief({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      marketIntel,
      mvpAudit,
      autopilot,
      dossier,
      proof,
      finalist
    })
  );
});

app.post("/api/judge-tour", async (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl,
    recommendation,
    strategy
  });
  const mission = buildMissionRun(recommendation, strategy, "審査員が90秒で競合差別化、実用性、安全性、実行証拠、提出状態を理解できる導線を生成する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  const judgeDrill = buildJudgeDrill({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch
  });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
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
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const judgeBrief = buildJudgeBrief({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    dossier,
    proof,
    finalist
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: parsed.data.protopediaUrl,
    videoUrl: parsed.data.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });

  res.json(
    buildJudgeTour({
      baseUrl,
      recommendation,
      strategy,
      marketIntel,
      judgeBrief,
      impactCase,
      securityReview,
      proof,
      demoRunway,
      submissionLaunch
    })
  );
});

app.post("/api/user-pilot", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "対象ユーザーが最初の3分でAI能力調達の価値へ到達できるかを検証する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const ci = await fetchCiProof();
  const securityReview = buildSecurityReview({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });

  res.json(
    buildUserPilotLab({
      recommendation,
      strategy,
      impactCase,
      opsDrill,
      securityReview,
      squadContract
    })
  );
});

app.post("/api/squad-optimizer", (req, res) => {
  const parsed = SquadOptimizerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(
    buildSquadOptimizer({
      projectBrief: parsed.data.projectBrief,
      selectedAgentIds: parsed.data.selectedAgentIds,
      budget: parsed.data.budget,
      maxSquadSize: parsed.data.maxSquadSize
    })
  );
});

app.post("/api/live-evidence", async (req, res) => {
  const parsed = LiveEvidenceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = parsed.data.selectedAgentIds;
  const forwardedHeaders = selfProbeHeaders(req);
  const [healthProbe, cardProbe, optimizerProbe, a2aProbe, ci] = await Promise.all([
    liveJsonProbe({
      id: "health",
      label: "Cloud Run health endpoint",
      url: `${baseUrl}/api/healthz`,
      required: true,
      init: { headers: forwardedHeaders },
      evaluate: (payload) => {
        const body = payload as { ok?: boolean; service?: string };
        return body.ok && body.service === "a2a-agent-marketplace"
          ? { status: "passed", score: 100, evidence: "Health endpoint returned ok for a2a-agent-marketplace." }
          : { status: "missing", score: 30, evidence: "Health payload did not match expected service contract." };
      }
    }),
    liveJsonProbe({
      id: "agent-card",
      label: "A2A Agent Card",
      url: `${baseUrl}/.well-known/agent-card.json`,
      required: true,
      init: { headers: forwardedHeaders },
      evaluate: (payload) => {
        const skills = Array.isArray((payload as { skills?: unknown[] }).skills) ? ((payload as { skills: Array<{ id?: string }> }).skills) : [];
        const hasEvidence = skills.some((skill) => skill.id === "evidence.monitor");
        const hasOptimizer = skills.some((skill) => skill.id === "squad.optimize");
        const hasMoat = skills.some((skill) => skill.id === "moat.stress");
        const hasReceipt = skills.some((skill) => skill.id === "demo.receipt");
        const hasAcceptance = skills.some((skill) => skill.id === "acceptance.matrix");
        const hasReleaseDrift = skills.some((skill) => skill.id === "release.drift");
        const hasPilotEconomics = skills.some((skill) => skill.id === "pilot.economics");
        const hasJudgeCommand = skills.some((skill) => skill.id === "judge.command");
        const hasDeployRecovery = skills.some((skill) => skill.id === "deploy.recover");
        return hasEvidence &&
          hasOptimizer &&
          hasMoat &&
          hasReceipt &&
          hasAcceptance &&
          hasReleaseDrift &&
          hasPilotEconomics &&
          hasJudgeCommand &&
          hasDeployRecovery &&
          skills.length >= 35
          ? {
              status: "passed",
              score: 100,
              evidence: `Agent Card exposes ${skills.length} skills including deploy.recover, judge.command, pilot.economics, release.drift, acceptance.matrix, demo.receipt, moat.stress, evidence.monitor, and squad.optimize.`
            }
          : {
              status: "watch",
              score: 72,
              evidence: `Agent Card exposes ${skills.length} skills; expected deploy recovery, judge command, pilot economics, release drift, acceptance, receipt, moat, live evidence, and optimizer skills.`
            };
      }
    }),
    liveJsonProbe({
      id: "squad-optimizer",
      label: "Squad Optimizer API",
      url: `${baseUrl}/api/squad-optimizer`,
      required: true,
      init: {
        method: "POST",
        headers: selfProbeHeaders(req, { "Content-Type": "application/json" }),
        body: JSON.stringify({
          projectBrief: parsed.data.projectBrief,
          selectedAgentIds,
          budget: parsed.data.budget,
          maxSquadSize: parsed.data.maxSquadSize
        })
      },
      evaluate: (payload) => {
        const body = payload as { readiness?: string; budgetGap?: number; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "squad.optimize" && typeof body.readiness === "string"
          ? { status: "passed", score: 100, evidence: `Optimizer returned ${body.readiness}; budget gap ${body.budgetGap ?? 0}.` }
          : { status: "missing", score: 30, evidence: "Optimizer payload did not include squad.optimize evidence." };
      }
    }),
    liveJsonProbe({
      id: "a2a",
      label: "A2A JSON-RPC artifact",
      url: `${baseUrl}/a2a`,
      required: true,
      init: {
        method: "POST",
        headers: selfProbeHeaders(req, { "Content-Type": "application/json" }),
        body: JSON.stringify({
          id: "live-evidence-monitor",
          method: "message/send",
          params: { text: parsed.data.projectBrief }
        })
      },
      evaluate: (payload) => {
        const data = (payload as { result?: { artifacts?: Array<{ parts?: Array<{ data?: Record<string, unknown> }> }> } }).result?.artifacts?.[0]?.parts?.[0]?.data;
        return data?.squadOptimizerEndpoint &&
          data?.liveEvidenceEndpoint &&
          data?.moatStressEndpoint &&
          data?.demoReceiptEndpoint &&
          data?.acceptanceMatrixEndpoint &&
          data?.releaseDriftEndpoint &&
          data?.pilotEconomicsEndpoint &&
          data?.judgeCommandEndpoint &&
          data?.deployRecoveryEndpoint
          ? {
              status: "passed",
              score: 100,
              evidence:
                "A2A artifact exposes squadOptimizerEndpoint, liveEvidenceEndpoint, moatStressEndpoint, demoReceiptEndpoint, acceptanceMatrixEndpoint, releaseDriftEndpoint, pilotEconomicsEndpoint, judgeCommandEndpoint, and deployRecoveryEndpoint."
            }
          : { status: "watch", score: 72, evidence: "A2A artifact returned, but deploy recovery/judge command/pilot economics/release drift/acceptance/receipt/moat/live evidence endpoints were not visible." };
      }
    }),
    fetchCiProof()
  ]);
  const ciProbe = {
    id: "ci",
    label: "GitHub Actions CI",
    status: ci.status === "passed" ? ("passed" as const) : ci.status,
    score: ci.status === "passed" ? 100 : evidenceScore(ci.status),
    url: ci.url,
    evidence: ci.evidence,
    required: true
  };

  res.json(
    buildLiveEvidenceRun({
      baseUrl,
      probes: [healthProbe, cardProbe, optimizerProbe, a2aProbe, ciProbe]
    })
  );
});

async function buildReleaseDriftForTarget(input: {
  currentBaseUrl: string;
  targetBaseUrl: string;
  projectBrief: string;
  selectedAgentIds: string[];
}) {
  const currentBaseUrl = input.currentBaseUrl.replace(/\/$/, "");
  const targetBaseUrl = input.targetBaseUrl.replace(/\/$/, "");
  const expectedSkillIds = agentCard(currentBaseUrl).skills.map((skill) => skill.id);
  const requiredSkillIds = ["evidence.monitor", "demo.receipt", "acceptance.matrix", "release.drift", "pilot.economics", "judge.command", "deploy.recover", "win.autopilot"];
  let observedSkillIds: string[] = [];

  const [healthProbe, cardProbe, acceptanceProbe, a2aProbe, ci] = await Promise.all([
    liveJsonProbe({
      id: "target-health",
      label: "Target Cloud Run health",
      url: `${targetBaseUrl}/api/healthz`,
      required: true,
      evaluate: (payload) => {
        const body = payload as { ok?: boolean; service?: string };
        return body.ok && body.service === "a2a-agent-marketplace"
          ? { status: "passed", score: 100, evidence: "Target health endpoint returned ok for a2a-agent-marketplace." }
          : { status: "missing", score: 24, evidence: "Target health payload did not match the expected service contract." };
      }
    }),
    liveJsonProbe({
      id: "agent-card-skill-surface",
      label: "Target Agent Card skill surface",
      url: `${targetBaseUrl}/.well-known/agent-card.json`,
      required: true,
      evaluate: (payload) => {
        const skills = Array.isArray((payload as { skills?: unknown[] }).skills) ? ((payload as { skills: Array<{ id?: string }> }).skills) : [];
        observedSkillIds = skills.map((skill) => skill.id).filter((id): id is string => Boolean(id));
        const missing = requiredSkillIds.filter((skill) => !observedSkillIds.includes(skill));
        const hasExpectedCount = observedSkillIds.length >= expectedSkillIds.length;
        if (missing.length === 0 && hasExpectedCount) {
          return {
            status: "passed",
            score: 100,
            evidence: `Target Agent Card exposes ${observedSkillIds.length}/${expectedSkillIds.length} expected skills.`
          };
        }
        return {
          status: missing.length > 0 ? "watch" : "passed",
          score: missing.length > 0 ? 58 : 92,
          evidence: `Target Agent Card exposes ${observedSkillIds.length}/${expectedSkillIds.length} skills; missing ${missing.join(", ") || "none"}.`
        };
      }
    }),
    liveJsonProbe({
      id: "acceptance-endpoint",
      label: "Target Acceptance Matrix endpoint",
      url: `${targetBaseUrl}/api/acceptance-matrix`,
      required: true,
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief: input.projectBrief,
          selectedAgentIds: input.selectedAgentIds,
          skipReleaseDrift: true
        })
      },
      evaluate: (payload) => {
        const body = payload as { verdict?: string; rows?: unknown[]; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "acceptance.matrix" && Array.isArray(body.rows) && body.rows.length >= 13
          ? { status: "passed", score: 100, evidence: `Acceptance Matrix returned ${body.verdict}; ${body.rows.length} rows.` }
          : { status: "missing", score: 24, evidence: "Acceptance Matrix endpoint did not return the current acceptance.matrix JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "a2a-artifact",
      label: "Target A2A artifact endpoints",
      url: `${targetBaseUrl}/a2a`,
      required: true,
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "release-drift-guard",
          method: "message/send",
          params: { text: input.projectBrief }
        })
      },
      evaluate: (payload) => {
        const data = (payload as { result?: { artifacts?: Array<{ parts?: Array<{ data?: Record<string, unknown> }> }> } }).result?.artifacts?.[0]?.parts?.[0]?.data;
        return data?.releaseDriftEndpoint &&
          data?.acceptanceMatrixEndpoint &&
          data?.demoReceiptEndpoint &&
          data?.pilotEconomicsEndpoint &&
          data?.judgeCommandEndpoint &&
          data?.deployRecoveryEndpoint
          ? {
              status: "passed",
              score: 100,
              evidence: "A2A artifact exposes releaseDriftEndpoint, acceptanceMatrixEndpoint, demoReceiptEndpoint, pilotEconomicsEndpoint, judgeCommandEndpoint, and deployRecoveryEndpoint."
            }
          : { status: "watch", score: 62, evidence: "A2A artifact is reachable, but deploy recovery/judge command/pilot economics/release drift/acceptance/receipt endpoints are not all visible." };
      }
    }),
    fetchCiProof()
  ]);

  const ciProbe: ReleaseDriftProbe = {
    id: "ci-main",
    label: "Latest main CI",
    status: ci.status === "passed" ? "passed" : ci.status === "watch" ? "watch" : "missing",
    score: ci.status === "passed" ? 100 : ci.status === "watch" ? 70 : 24,
    url: ci.url,
    evidence: ci.evidence,
    required: true
  };

  return buildReleaseDriftGuard({
    currentBaseUrl,
    targetBaseUrl,
    expectedSkillIds,
    observedSkillIds,
    requiredSkillIds,
    probes: [healthProbe, cardProbe, acceptanceProbe, a2aProbe, ciProbe]
  });
}

app.post("/api/release-drift", async (req, res) => {
  const parsed = ReleaseDriftSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const currentBaseUrl = publicBaseUrl(req);
  const targetBaseUrl = (parsed.data.targetUrl || SUBMISSION_PROOF.deployedUrl).replace(/\/$/, "");

  res.json(
    await buildReleaseDriftForTarget({
      currentBaseUrl,
      targetBaseUrl,
      projectBrief: parsed.data.projectBrief,
      selectedAgentIds: parsed.data.selectedAgentIds
    })
  );
});

app.post("/api/deploy-recovery", async (req, res) => {
  const parsed = DeployRecoverySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const currentBaseUrl = publicBaseUrl(req);
  const targetBaseUrl = (parsed.data.targetUrl || SUBMISSION_PROOF.deployedUrl).replace(/\/$/, "");
  const releaseDrift = await buildReleaseDriftForTarget({
    currentBaseUrl,
    targetBaseUrl,
    projectBrief: parsed.data.projectBrief,
    selectedAgentIds: parsed.data.selectedAgentIds
  });

  res.json(
    buildDeployRecoveryPlan({
      baseUrl: currentBaseUrl,
      releaseDrift,
      lastDeployError: parsed.data.lastDeployError
    })
  );
});

app.post("/api/demo-receipt", (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const moatStress = buildMoatStressTest({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    marketIntel
  });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: parsed.data.projectBrief,
    selectedAgentIds: parsed.data.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });

  res.json(
    buildJudgeDemoReceipt({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      moatStress,
      squadOptimizer,
      protopediaUrl: parsed.data.protopediaUrl,
      videoUrl: parsed.data.videoUrl
    })
  );
});

app.post("/api/acceptance-matrix", async (req, res) => {
  const parsed = AcceptanceMatrixSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査5項目、必須技術、提出物、公開証拠を受入表として閉じる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
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
  const proof = buildJudgeProof({ baseUrl, recommendation, strategy, mission, opsDrill, gemini, ci });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: parsed.data.projectBrief,
    selectedAgentIds: parsed.data.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl,
    recommendation,
    strategy,
    moatStress,
    squadOptimizer
  });
  const releaseDrift = parsed.data.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: parsed.data.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: parsed.data.projectBrief,
        selectedAgentIds: parsed.data.selectedAgentIds
      });

  res.json(
    buildJudgeAcceptanceMatrix({
      baseUrl,
      strategy,
      marketIntel,
      mvpAudit,
      autopilot,
      proof,
      userPilot,
      impactCase,
      pilotEconomics,
      securityReview,
      demoReceipt,
      releaseDrift
    })
  );
});

app.post("/api/judge-command-center", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査員が最初の90秒で見る証拠、残ブロッカー、次クリックを1画面に束ねる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
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
  const proof = buildJudgeProof({ baseUrl, recommendation, strategy, mission, opsDrill, gemini, ci });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const judgeBrief = buildJudgeBrief({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    dossier,
    proof,
    finalist
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: parsed.data.protopediaUrl,
    videoUrl: parsed.data.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const judgeTour = buildJudgeTour({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    judgeBrief,
    impactCase,
    securityReview,
    proof,
    demoRunway,
    submissionLaunch
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: parsed.data.projectBrief,
    selectedAgentIds: parsed.data.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl,
    recommendation,
    strategy,
    moatStress,
    squadOptimizer
  });
  const releaseDrift = parsed.data.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: parsed.data.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: parsed.data.projectBrief,
        selectedAgentIds: parsed.data.selectedAgentIds
      });
  const acceptance = buildJudgeAcceptanceMatrix({
    baseUrl,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    securityReview,
    demoReceipt,
    releaseDrift
  });

  res.json(
    buildJudgeCommandCenter({
      baseUrl,
      acceptance,
      autopilot,
      judgeTour,
      pilotEconomics,
      releaseDrift
    })
  );
});

app.post("/api/autonomy-ledger", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "AIエージェント中心性を、判断、委任、検証、運用、提出の証拠台帳として証明する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
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
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });

  res.json(
    buildAutonomyLedger({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      squadContract,
      proof
    })
  );
});

app.post("/api/submission-launch", async (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const mission = buildMissionRun(recommendation, strategy, "ProtoPedia作品URLと動画URLを受け取り、提出可能かを最終判定する。");
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
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
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
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });
  const autopilot = buildWinningAutopilot({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });

  res.json(
    buildSubmissionLaunchGate({
      protopediaUrl: parsed.data.protopediaUrl,
      videoUrl: parsed.data.videoUrl,
      mvpAudit,
      dossier,
      proof,
      publisher
    })
  );
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

app.post("/api/security-review", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const ci = await fetchCiProof();
  res.json(
    buildSecurityReview({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      allowlist: ipAllowlistSummary,
      ci,
      geminiSecretConfigured: geminiSecretConfigured()
    })
  );
});

app.post("/api/impact-case", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const ci = await fetchCiProof();
  const securityReview = buildSecurityReview({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  res.json(buildImpactCase({ recommendation, strategy, opsDrill, securityReview }));
});

app.post("/api/pilot-economics", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "導入費用、回収日数、価格レーン、買い手の反論をpilot economicsとして検証する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const ci = await fetchCiProof();
  const securityReview = buildSecurityReview({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });

  res.json(
    buildPilotEconomics({
      recommendation,
      strategy,
      impactCase,
      userPilot,
      squadContract,
      opsDrill,
      securityReview
    })
  );
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

app.post("/api/finalist", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "審査員5役で最終候補に残せるかを模擬判定し、落選理由と次の一手を出す。");
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

  res.json(
    buildFinalistSimulation({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch,
      judgeDrill,
      squadContract
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
  const recommendation = recommendSquad(String(text), ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
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
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: localGeminiRecommendation(recommendation, "A2A synchronous artifact uses /api/proof for live Gemini evidence"),
    ci: ciUnavailable("A2A synchronous artifact uses /api/proof for live CI evidence")
  });
  const winAutopilot = buildWinningAutopilot({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot: winAutopilot,
    proof
  });
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const mvpAudit = buildMvpAudit({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot: winAutopilot,
    dossier,
    proof,
    marketIntel
  });
  const judgeBrief = buildJudgeBrief({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot: winAutopilot,
    dossier,
    proof,
    finalist
  });
  const autonomyLedger = buildAutonomyLedger({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    proof
  });
  const submissionLaunch = buildSubmissionLaunchGate({
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const securityReview = buildSecurityReview({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci: ciUnavailable("A2A synchronous artifact uses /api/security-review for live CI evidence"),
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({
    recommendation,
    strategy,
    opsDrill,
    securityReview
  });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: String(text),
    selectedAgentIds: recommendation.selected.map((agent) => agent.id),
    budget: 140,
    maxSquadSize: 4
  });
  const moatStress = buildMoatStressTest({ baseUrl: publicBaseUrl(req), recommendation, strategy, marketIntel });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    moatStress,
    squadOptimizer
  });
  const judgeTour = buildJudgeTour({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    marketIntel,
    judgeBrief,
    impactCase,
    securityReview,
    proof,
    demoRunway,
    submissionLaunch
  });
  const acceptance = buildJudgeAcceptanceMatrix({
    baseUrl: publicBaseUrl(req),
    strategy,
    marketIntel,
    mvpAudit,
    autopilot: winAutopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    securityReview,
    demoReceipt
  });
  const judgeCommand = buildJudgeCommandCenter({
    baseUrl: publicBaseUrl(req),
    acceptance,
    autopilot: winAutopilot,
    judgeTour,
    pilotEconomics
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
                marketIntel: {
                  id: marketIntel.id,
                  marketScore: marketIntel.marketScore,
                  status: marketIntel.status,
                  sourceCount: marketIntel.sources.length,
                  competitors: marketIntel.comparisons.map((comparison) => ({
                    id: comparison.id,
                    sourceIds: comparison.sourceIds,
                    threatLevel: comparison.threatLevel
                  })),
                  moves: marketIntel.moves.map((move) => ({
                    id: move.id,
                    priority: move.priority,
                    action: move.action
                  }))
                },
                mvpAudit: {
                  id: mvpAudit.id,
                  mvpScore: mvpAudit.mvpScore,
                  band: mvpAudit.band,
                  verdict: mvpAudit.verdict,
                  gates: mvpAudit.gates.map((gate) => ({
                    id: gate.id,
                    status: gate.status,
                    score: gate.score
                  })),
                  blockers: mvpAudit.blockers.map((action) => ({
                    id: action.id,
                    priority: action.priority,
                    action: action.action
                  }))
                },
                judgeBrief: {
                  id: judgeBrief.id,
                  briefScore: judgeBrief.briefScore,
                  readiness: judgeBrief.readiness,
                  oneLineVerdict: judgeBrief.oneLineVerdict,
                  metrics: judgeBrief.keyMetrics.map((metric) => ({
                    id: metric.id,
                    value: metric.value,
                    tone: metric.tone
                  })),
                  risks: judgeBrief.riskRegister.map((risk) => ({
                    id: risk.id,
                    tone: risk.tone,
                    action: risk.action
                  }))
                },
                autonomyLedger: {
                  id: autonomyLedger.id,
                  ledgerScore: autonomyLedger.ledgerScore,
                  verdict: autonomyLedger.verdict,
                  phases: autonomyLedger.chain.map((event) => ({
                    id: event.id,
                    phase: event.phase,
                    status: event.status
                  })),
                  handoffs: autonomyLedger.handoffs.map((handoff) => ({
                    id: handoff.id,
                    status: handoff.status
                  })),
                  receipt: autonomyLedger.receipt.digest
                },
                submissionLaunch: {
                  id: submissionLaunch.id,
                  launchScore: submissionLaunch.launchScore,
                  readiness: submissionLaunch.readiness,
                  verdict: submissionLaunch.verdict,
                  urls: submissionLaunch.urlStatuses.map((item) => ({
                    id: item.id,
                    status: item.status
                  }))
                },
                securityReview: {
                  id: securityReview.id,
                  securityScore: securityReview.securityScore,
                  posture: securityReview.posture,
                  verdict: securityReview.verdict,
                  controls: securityReview.controls.map((control) => ({
                    id: control.id,
                    status: control.status,
                    score: control.score
                  })),
                  threats: securityReview.threats.map((threat) => ({
                    id: threat.id,
                    severity: threat.severity,
                    likelihood: threat.likelihood
                  })),
                  nextSecurityHire: securityReview.nextSecurityHire?.name ?? null
                },
                impactCase: {
                  id: impactCase.id,
                  impactScore: impactCase.impactScore,
                  posture: impactCase.posture,
                  verdict: impactCase.verdict,
                  metrics: impactCase.metrics.map((metric) => ({
                    id: metric.id,
                    before: metric.before,
                    after: metric.after,
                    delta: metric.delta,
                    unit: metric.unit
                  })),
                  personas: impactCase.personas.map((persona) => ({
                    id: persona.id,
                    kpi: persona.kpi
                  })),
                  nextImpactHire: impactCase.nextImpactHire?.name ?? null
                },
                userPilot: {
                  id: userPilot.id,
                  pilotScore: userPilot.pilotScore,
                  readiness: userPilot.readiness,
                  timeToValueSeconds: userPilot.timeToValueSeconds,
                  usabilityLift: userPilot.usabilityLift,
                  paths: userPilot.paths.map((path) => ({
                    id: path.id,
                    persona: path.persona,
                    seconds: path.timeToValueSeconds
                  })),
                  frictions: userPilot.frictions.map((friction) => ({
                    id: friction.id,
                    severity: friction.severity,
                    owner: friction.owner
                  })),
                  nextClicks: userPilot.nextClicks.map((click) => ({
                    id: click.id,
                    screen: click.screen,
                    button: click.button
                  }))
                },
                pilotEconomics: {
                  id: pilotEconomics.id,
                  economicsScore: pilotEconomics.economicsScore,
                  posture: pilotEconomics.posture,
                  paybackDays: pilotEconomics.unitEconomics.paybackDays,
                  monthlyValueYen: pilotEconomics.unitEconomics.monthlyValueYen,
                  pilotCostYen: pilotEconomics.unitEconomics.pilotCostYen,
                  pricingLanes: pilotEconomics.pricingLanes.map((lane) => ({
                    id: lane.id,
                    priceYen: lane.priceYen,
                    status: lane.status
                  })),
                  buyerObjections: pilotEconomics.buyerObjections.map((objection) => ({
                    id: objection.id,
                    status: objection.status
                  }))
                },
                squadOptimizer: {
                  id: squadOptimizer.id,
                  optimizerScore: squadOptimizer.optimizerScore,
                  readiness: squadOptimizer.readiness,
                  budget: squadOptimizer.budget,
                  recommended: {
                    agentIds: squadOptimizer.recommended.agentIds,
                    totalPrice: squadOptimizer.recommended.totalPrice,
                    totalScore: squadOptimizer.recommended.totalScore,
                    coverageScore: squadOptimizer.recommended.coverageScore
                  },
                  stretch: squadOptimizer.stretch
                    ? {
                        agentIds: squadOptimizer.stretch.agentIds,
                        budgetGap: squadOptimizer.budgetGap,
                        totalScore: squadOptimizer.stretch.totalScore,
                        coverageScore: squadOptimizer.stretch.coverageScore
                      }
                    : null,
                  swapPlan: squadOptimizer.swapPlan.map((step) => ({
                    action: step.action,
                    label: step.label,
                    scoreImpact: step.scoreImpact
                  }))
                },
                judgeTour: {
                  id: judgeTour.id,
                  tourScore: judgeTour.tourScore,
                  readiness: judgeTour.readiness,
                  totalSeconds: judgeTour.totalSeconds,
                  headline: judgeTour.headline,
                  steps: judgeTour.steps.map((step) => ({
                    id: step.id,
                    status: step.status,
                    endpoint: step.endpoint
                  })),
                  claims: judgeTour.claims.map((claim) => ({
                    id: claim.id,
                    score: claim.score
                  })),
                  blockers: judgeTour.blockers.map((blocker) => ({
                    id: blocker.id,
                    severity: blocker.severity
                  }))
                },
                judgeCommand: {
                  id: judgeCommand.id,
                  commandScore: judgeCommand.commandScore,
                  readiness: judgeCommand.readiness,
                  openingMove: judgeCommand.openingMove,
                  metrics: judgeCommand.metrics.map((metric) => ({
                    id: metric.id,
                    value: metric.value,
                    status: metric.status
                  })),
                  proofButtons: judgeCommand.proofButtons.map((button) => ({
                    id: button.id,
                    status: button.status,
                    endpoint: button.endpoint
                  })),
                  blockers: judgeCommand.blockers.map((blocker) => ({
                    id: blocker.id,
                    priority: blocker.priority,
                    owner: blocker.owner
                  }))
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
                finalist: {
                  id: finalist.id,
                  finalistScore: finalist.finalistScore,
                  finalistBand: finalist.finalistBand,
                  judgeConsensus: finalist.judgeConsensus,
                  topConcern: finalist.topConcern,
                  gaps: finalist.gaps.map((gap) => ({
                    id: gap.id,
                    severity: gap.severity,
                    action: gap.action
                  }))
                },
                publisher: {
                  id: publisher.id,
                  publishScore: publisher.publishScore,
                  readiness: publisher.readiness,
                  pasteFields: publisher.pasteFields.map((field) => field.id),
                  missingExternal: publisher.missingExternal.map((item) => item.id)
                },
                demoRunway: {
                  id: demoRunway.id,
                  demoScore: demoRunway.demoScore,
                  readiness: demoRunway.readiness,
                  totalSeconds: demoRunway.totalSeconds,
                  steps: demoRunway.steps.map((step) => ({
                    id: step.id,
                    status: step.status,
                    evidenceUrl: step.evidenceUrl
                  })),
                  risks: demoRunway.risks.map((risk) => ({
                    id: risk.id,
                    mitigation: risk.mitigation
                  }))
                },
                winAutopilot: {
                  id: winAutopilot.id,
                  winScore: winAutopilot.winScore,
                  readiness: winAutopilot.readiness,
                  blockers: winAutopilot.blockers.map((action) => ({
                    id: action.id,
                    priority: action.priority,
                    command: action.command
                  })),
                  lanes: winAutopilot.lanes.map((lane) => ({
                    id: lane.id,
                    score: lane.score,
                    status: lane.status
                  }))
                },
                dossier: {
                  id: dossier.id,
                  dossierScore: dossier.dossierScore,
                  readiness: dossier.readiness,
                  copyBlocks: dossier.copyBlocks.map((block) => block.id),
                  missingLinks: dossier.links.filter((link) => link.status === "watch").map((link) => link.id),
                  finalChecks: dossier.finalChecks.map((check) => ({
                    id: check.id,
                    status: check.status
                  }))
                },
                dossierEndpoint: `${publicBaseUrl(req)}/api/dossier`,
                marketIntelEndpoint: `${publicBaseUrl(req)}/api/market-intel`,
                moatStressEndpoint: `${publicBaseUrl(req)}/api/moat-stress`,
                mvpAuditEndpoint: `${publicBaseUrl(req)}/api/mvp-audit`,
                judgeBriefEndpoint: `${publicBaseUrl(req)}/api/judge-brief`,
                autonomyLedgerEndpoint: `${publicBaseUrl(req)}/api/autonomy-ledger`,
                submissionLaunchEndpoint: `${publicBaseUrl(req)}/api/submission-launch`,
                securityReviewEndpoint: `${publicBaseUrl(req)}/api/security-review`,
                impactCaseEndpoint: `${publicBaseUrl(req)}/api/impact-case`,
                pilotEconomicsEndpoint: `${publicBaseUrl(req)}/api/pilot-economics`,
                judgeCommandEndpoint: `${publicBaseUrl(req)}/api/judge-command-center`,
                deployRecoveryEndpoint: `${publicBaseUrl(req)}/api/deploy-recovery`,
                userPilotEndpoint: `${publicBaseUrl(req)}/api/user-pilot`,
                squadOptimizerEndpoint: `${publicBaseUrl(req)}/api/squad-optimizer`,
                liveEvidenceEndpoint: `${publicBaseUrl(req)}/api/live-evidence`,
                releaseDriftEndpoint: `${publicBaseUrl(req)}/api/release-drift`,
                demoReceiptEndpoint: `${publicBaseUrl(req)}/api/demo-receipt`,
                acceptanceMatrixEndpoint: `${publicBaseUrl(req)}/api/acceptance-matrix`,
                judgeTourEndpoint: `${publicBaseUrl(req)}/api/judge-tour`,
                winRunEndpoint: `${publicBaseUrl(req)}/api/win-run`,
                demoRunEndpoint: `${publicBaseUrl(req)}/api/demo-run`,
                proofEndpoint: `${publicBaseUrl(req)}/api/proof`,
                finalistEndpoint: `${publicBaseUrl(req)}/api/finalist`,
                publisherEndpoint: `${publicBaseUrl(req)}/api/publisher`,
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
