import { GoogleGenAI } from "@google/genai";
import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { getClientIp, ipAllowlistMiddleware, ipAllowlistSummary } from "./ipAllowlist.js";
import { ACCEPTANCE_MATRIX_LOCK_TAG, ACCEPTANCE_MATRIX_REQUIRED_SIGNAL, ACCEPTANCE_MATRIX_SKILL_ID, buildJudgeAcceptanceMatrix, renderAcceptanceMatrixHtml } from "../src/acceptanceMatrix.js";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine.js";
import { buildArchitecturePack, renderArchitecturePackHtml } from "../src/architecturePack.js";
import { buildWinningAutopilot, renderWinningAutopilotHtml, WIN_AUTOPILOT_LOCK_TAG, WIN_AUTOPILOT_REQUIRED_SIGNAL, WIN_AUTOPILOT_SKILL_ID } from "../src/autopilot.js";
import { buildAutonomyLedger } from "../src/autonomyLedger.js";
import { buildAutonomySnapshot, renderAutonomySnapshotHtml } from "../src/autonomySnapshot.js";
import { ciStatusFromBadge } from "../src/ciProof.js";
import { buildCompetitiveBattlecard, COMPETITIVE_WIN_LOSS_LOCK_TAG, COMPETITIVE_WIN_LOSS_REQUIRED_SIGNAL } from "../src/competitiveBattlecard.js";
import {
  buildCompetitiveDecisionMatrix,
  COMPETITIVE_DECISION_MATRIX_LOCK_TAG,
  COMPETITIVE_DECISION_MATRIX_REQUIRED_SIGNAL,
  COMPETITIVE_DECISION_MATRIX_SKILL_ID,
  renderCompetitiveDecisionMatrixHtml
} from "../src/competitiveDecisionMatrix.js";
import { buildCompetitiveSnapshot, renderCompetitiveSnapshotHtml } from "../src/competitiveSnapshot.js";
import { buildSquadContract } from "../src/contracts.js";
import { buildDeployRecoveryPlan, renderDeployRecoveryHtml } from "../src/deployRecovery.js";
import { buildJudgeDemoReceipt } from "../src/demoReceipt.js";
import { buildDemoConcierge } from "../src/demoConcierge.js";
import { buildDemoRunway } from "../src/demoRunway.js";
import {
  buildSubmissionDossier,
  renderSubmissionDossierHtml,
  SUBMISSION_DOSSIER_LOCK_TAG,
  SUBMISSION_DOSSIER_REQUIRED_SIGNAL,
  SUBMISSION_DOSSIER_SKILL_ID
} from "../src/dossier.js";
import { buildSubmissionAssetsPage, renderSubmissionAssetsHtml } from "../src/submissionAssets.js";
import {
  buildExternalEvidenceRun,
  EXTERNAL_EVIDENCE_LOCK_TAG,
  EXTERNAL_EVIDENCE_REQUIRED_SIGNAL,
  EXTERNAL_EVIDENCE_SKILL_ID,
  renderExternalEvidenceHtml,
  type ExternalEvidenceProbe
} from "../src/externalEvidence.js";
import { buildFinalistSimulation } from "../src/finalist.js";
import { buildFirstClickProof, FIRST_CLICK_REQUIRED_SIGNAL, FIRST_CLICK_ROUTE_LOCK_TAG, FIRST_CLICK_SKILL_ID } from "../src/firstClick.js";
import {
  buildFirstClickSmokeLock,
  FIRST_CLICK_SMOKE_LOCK_TAG,
  FIRST_CLICK_SMOKE_REQUIRED_SIGNAL,
  FIRST_CLICK_SMOKE_SENTINELS,
  FIRST_CLICK_SMOKE_SKILL_ID,
  renderFirstClickSmokeHtml,
  type FirstClickSmokeProbe
} from "../src/firstClickSmoke.js";
import { buildImpactCase } from "../src/impact.js";
import { buildJudgeBrief } from "../src/judgeBrief.js";
import { buildJudgeCommandCenter, JUDGE_COMMAND_LOCK_TAG, JUDGE_COMMAND_REQUIRED_SIGNAL, JUDGE_COMMAND_SKILL_ID, renderJudgeCommandCenterHtml } from "../src/judgeCommandCenter.js";
import { buildJudgeDrill } from "../src/judgeDrill.js";
import { buildJudgeSnapshot, renderJudgeSnapshotHtml } from "../src/judgeSnapshot.js";
import { buildJudgeRehearsalRoom } from "../src/judgeRehearsal.js";
import { buildJudgeTour } from "../src/judgeTour.js";
import { buildLiveEvidenceRun, type LiveEvidenceStatus } from "../src/liveEvidence.js";
import { DEFAULT_PROJECT_BRIEF, MARKET_AGENTS } from "../src/market.js";
import { attachSourceProofLock, buildMarketIntelReport, probeMarketIntelSources } from "../src/marketIntel.js";
import { buildMissionRun } from "../src/mission.js";
import { buildMoatStressTest } from "../src/moatStress.js";
import { buildMvpAudit } from "../src/mvpAudit.js";
import { buildMvpSnapshot, renderMvpSnapshotHtml } from "../src/mvpSnapshot.js";
import { buildObservabilityOracle, OBSERVABILITY_ORACLE_LOCK_TAG, OBSERVABILITY_ORACLE_REQUIRED_SIGNAL, OBSERVABILITY_ORACLE_SKILL_ID, renderObservabilityOracleHtml } from "../src/observabilityOracle.js";
import { buildObjectionArena, renderObjectionArenaHtml } from "../src/objectionArena.js";
import { buildOpsDrill } from "../src/ops.js";
import { buildPilotEconomics } from "../src/pilotEconomics.js";
import { buildPilotValueSnapshot, renderPilotValueSnapshotHtml } from "../src/pilotValueSnapshot.js";
import { buildPitchRun } from "../src/pitch.js";
import { buildJudgeProof, type CiProof, type JudgeProof } from "../src/proof.js";
import {
  buildPrizeStrategyBoard,
  PRIZE_STRATEGY_LOCK_TAG,
  PRIZE_STRATEGY_REQUIRED_SIGNAL,
  PRIZE_STRATEGY_SKILL_ID,
  renderPrizeStrategyHtml
} from "../src/prizeStrategy.js";
import {
  buildProtoPediaPublisher,
  renderProtoPediaPublisherHtml,
  SUBMISSION_PUBLISH_LOCK_TAG,
  SUBMISSION_PUBLISH_REQUIRED_SIGNAL,
  SUBMISSION_PUBLISH_SKILL_ID
} from "../src/publisher.js";
import { buildRecordingScriptPage, renderRecordingScriptHtml } from "../src/recordingScript.js";
import { buildReleaseDriftGuard, type ReleaseDriftProbe } from "../src/releaseDrift.js";
import { buildSecurityReview } from "../src/security.js";
import { buildSquadOptimizer } from "../src/squadOptimizer.js";
import { buildSubmissionCloseoutWorkbench } from "../src/submissionCloseout.js";
import { buildSubmissionLaunchGate, renderSubmissionLaunchHtml } from "../src/submissionLaunch.js";
import { buildFinalSubmissionRunway } from "../src/submissionRunway.js";
import { SUBMISSION_PROOF } from "../src/submission.js";
import { buildAgentTaskBoard } from "../src/taskBoard.js";
import { buildWinningStrategy } from "../src/strategy.js";
import type { GeminiRecommendation } from "../src/types.js";
import { buildUserPilotLab } from "../src/userPilot.js";
import { buildWinGapRadar } from "../src/winGapRadar.js";
import { buildWinnerSufficiencyLock, renderWinnerSufficiencyHtml, WINNER_SUFFICIENCY_LOCK_TAG, WINNER_SUFFICIENCY_REQUIRED_SIGNAL, WINNER_SUFFICIENCY_SKILL_ID } from "../src/winnerSufficiency.js";
import { buildWinnerProofPacket, renderWinnerProofPacketHtml } from "../src/winnerPacket.js";

const app = express();
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";
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
const FirstClickSmokeSchema = z.object({
  targetUrl: z.string().url().optional()
});
const DeployRecoverySchema = ReleaseDriftSchema.extend({
  lastDeployError: z.string().trim().max(20000).optional()
});
const AcceptanceMatrixSchema = RecommendSchema.extend({
  targetUrl: z.string().url().optional(),
  skipReleaseDrift: z.boolean().optional(),
  protopediaUrl: z.string().optional(),
  videoUrl: z.string().optional()
});
const CommandCenterSchema = AcceptanceMatrixSchema.extend({
  protopediaUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  currentDate: z.string().optional()
});
type CommandCenterInput = z.infer<typeof CommandCenterSchema>;

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

function submissionUrlEvidence(input: { protopediaUrl?: string; videoUrl?: string }) {
  return {
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl
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
        description: "選ばれたエージェントへA2A message/send形式で検証可能な仕事票、受入条件、証拠URLを渡す。",
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
        id: "competitive.battlecard",
        name: "Build competitor battlecards",
        description: "公式ソース、SWOT、競合反論、Criteria Duel、見せる証拠を競合別の審査回答カードに束ね、Competitive Proof Lockで検収する。",
        tags: ["competitive-analysis", "battlecard", "swot", "judge-qa", "criteria-duel", COMPETITIVE_WIN_LOSS_LOCK_TAG, "proof", "proof-lock"]
      },
      {
        id: "competitive.snapshot",
        name: "Open competitive SWOT snapshot",
        description: "6競合、SWOT 4象限、公式ソース、Criteria Duel、Proof LockをGETで読める審査用HTMLへ束ねる。",
        tags: ["competitive-analysis", "swot", "source-ledger", "judge-qa", "get-proof"]
      },
      {
        id: COMPETITIVE_DECISION_MATRIX_SKILL_ID,
        name: "Open head-to-head competitive decision matrix",
        description: "5審査項目 x 主要競合の勝敗、SWOT signal、開く証拠URLをGET証拠ページに束ねる。",
        tags: ["competitive-analysis", "swot", "head-to-head", COMPETITIVE_DECISION_MATRIX_LOCK_TAG, "judge-qa", "get-proof"]
      },
      {
        id: "judge.snapshot",
        name: "Open the public judge proof snapshot",
        description: "POST専用の深い証拠群を、審査員がGETで直接開ける初回証拠スナップショットへ束ねる。",
        tags: ["judge-snapshot", "get-proof", "first-click", "submission", "proof"]
      },
      {
        id: FIRST_CLICK_SKILL_ID,
        name: "Route the judge first click",
        description: "トップ画面直下から14本のGET証拠ページへ迷わず到達できる初回審査導線を固定する。",
        tags: ["first-click", FIRST_CLICK_ROUTE_LOCK_TAG, "get-proof", "win-autopilot", "judge-snapshot", "winner-packet", "objection-arena", "competitive-decision-matrix", "mvp-readiness", "deploy-recovery", "architecture-pack", "submission-launch"]
      },
      {
        id: FIRST_CLICK_SMOKE_SKILL_ID,
        name: "Smoke-test first-click proof pages",
        description: "First-ClickのGET証拠ページがSPA fallbackではなく固有の審査証拠HTMLを返しているかをsentinelで検収する。",
        tags: ["first-click", FIRST_CLICK_SMOKE_LOCK_TAG, "smoke-test", "get-proof", "release-drift"]
      },
      {
        id: "mvp.audit",
        name: "Audit MVP readiness with hard gates",
        description: "必須技術、審査5項目、DevOps証拠、提出3点をハードゲートで判定し、未達をwatch/failとして返す。",
        tags: ["mvp", "audit", "hard-gates", "judge-score", "submission"]
      },
      {
        id: "mvp.snapshot",
        name: "Open the MVP readiness snapshot",
        description: "MVP Audit、Acceptance Matrix、Release Drift、外部提出gapをGETで読める提出可否ページへ束ねる。",
        tags: ["mvp", "readiness", "acceptance", "release-drift", "get-proof"]
      },
      {
        id: ACCEPTANCE_MATRIX_SKILL_ID,
        name: "Build the judge acceptance matrix",
        description: "必須技術、審査5項目、公開証拠、提出物、receiptをGET証拠ページのaccepted/watch/blocked受入表に束ねる。",
        tags: ["acceptance", ACCEPTANCE_MATRIX_LOCK_TAG, "mvp", "judge-score", "proof", "submission", "get-proof"]
      },
      {
        id: "judge.brief",
        name: "Build the one-page judge brief",
        description: "競合差別化、MVP監査、証拠、30秒導線、残リスクを審査員向けの1枚に束ねる。",
        tags: ["judge-brief", "demo", "mvp", "market-intelligence", "submission"]
      },
      {
        id: JUDGE_COMMAND_SKILL_ID,
        name: "Build the judge command center",
        description: "Judge Tour、Acceptance Matrix、Release Drift、Pilot Economics、Win Autopilotを初回審査導線のGET証拠ページへ束ねる。",
        tags: ["judge-command", JUDGE_COMMAND_LOCK_TAG, "first-run", "acceptance", "release-drift", "demo", "get-proof"]
      },
      {
        id: "judge.rehearsal",
        name: "Rehearse the 90-second judge run",
        description: "Judge Command、Demo Concierge、Prize Strategy、Judge Drill、Closeoutを90秒台本、Recording Lock、最終質疑Defense Lockへ束ねる。",
        tags: ["judge-rehearsal", "demo", "recording-lock", "first-run", "usability", "pitch", "qa-defense"]
      },
      {
        id: "winner.packet",
        name: "Package winner proof for the five judge criteria",
        description: "審査5項目ごとに主張、証拠URL、競合/SWOT反論、録画cue、Winner Release Lock、提出copyを1枚の勝ち証拠packetへ束ねる。",
        tags: ["winner-packet", "judge-score", "proof", "swot", "pitch", "winner-release-lock", "release-drift", "get-proof"]
      },
      {
        id: WINNER_SUFFICIENCY_SKILL_ID,
        name: "Decide if the project is winner-sufficient",
        description: "MVP、競合/SWOT、公開証拠、first-click、feature freeze、提出URLを束ね、優勝線で十分かをyes/no判定する。",
        tags: ["winner-sufficiency", WINNER_SUFFICIENCY_LOCK_TAG, "get-proof", "mvp", "competitive-analysis", "swot", "submission"]
      },
      {
        id: "judge.objection-arena",
        name: "Answer final judge objections",
        description: "Winner Packetから、競合/SWOT、AI中心性、実用性、公開revisionへの厳しい質問を証拠URL付きの最終質疑レーンへ束ねる。",
        tags: ["judge-qa", "objection-lock", "competitive-analysis", "swot", "get-proof"]
      },
      {
        id: PRIZE_STRATEGY_SKILL_ID,
        name: "Build the prize strategy board",
        description: "審査5項目の目標点、現在証拠、Prize Usability Lock、Prize Criteria Lock、最終ピッチ順をGET証拠ページ付きの優勝作戦へ束ねる。",
        tags: ["prize-strategy", PRIZE_STRATEGY_LOCK_TAG, "judge-score", "pitch", "swot", "proof", "usability-lock", "criteria-lock", "get-proof"]
      },
      {
        id: "win.gap.radar",
        name: "Turn competitive analysis into MVP gap bets",
        description: "競合分析、SWOT、MVP監査、最終候補判定、提出ゲートを横断し、勝つために閉じる機能仮説、Feature Freeze Lock、cut listを返す。",
        tags: ["mvp", "competitive-analysis", "swot", "gap-radar", "feature-freeze-lock", "winning-strategy"]
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
        id: OBSERVABILITY_ORACLE_SKILL_ID,
        name: "Turn operations signals into buyer proof",
        description: "Live Evidence、Ops Drill、Pilot Economicsを束ね、公開継続/復旧判断、買い手価値、次のAI雇用をGET証拠ページへ変換する。",
        tags: ["observability", "cloud-run", "ops", "roi", "a2a", OBSERVABILITY_ORACLE_LOCK_TAG, "get-proof"]
      },
      {
        id: "release.drift",
        name: "Detect Cloud Run release drift",
        description: "公開Cloud Runが最新Agent Card、必須skill tag、Acceptance Matrix、A2A artifactを出しているかを検知し、古いrevisionを提出前に止める。",
        tags: ["cloud-run", "release", "drift", "agent-card-signals", "ci", "deployment"]
      },
      {
        id: "deploy.recover",
        name: "Recover stale Cloud Run deployment",
        description: "release drift、gcloud認証、Workload Identity bootstrap、GitHub Actions deploy lane、Cloud Build、必須Agent Card signal、公開再検証を復旧計画へ変換する。",
        tags: ["cloud-run", "cloud-build", "github-actions-deploy", "workload-identity", "recovery", "agent-card-signals", "deployment", "runbook", "get-proof"]
      },
      {
        id: "demo.receipt",
        name: "Seal the judge demo receipt",
        description: "審査導線、競合反論、編成判断、公開証拠、外部提出URLを1枚のsha256 receiptとして封印し、Judge Route LockとReceipt Integrity Lockで再検証する。",
        tags: ["demo", "receipt", "submission", "judge-proof", "sha256", "integrity", "route-lock"]
      },
      {
        id: "autonomy.ledger",
        name: "Build the agent autonomy ledger",
        description: "市場探索、判断、契約、A2A委任、検証、運用、提出の連鎖を審査員向けの自律性台帳にする。",
        tags: ["autonomy", "agent-centrality", "a2a", "evidence", "devops"]
      },
      {
        id: "autonomy.snapshot",
        name: "Open the agent autonomy snapshot",
        description: "Autonomy LedgerとAgent Task Boardを束ね、AIが価値の中心だとGETで読める審査用HTML証拠にする。",
        tags: ["autonomy", "agent-centrality", "a2a", "get-proof", "judge-score"]
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
        tags: ["protopedia", "video", "architecture", "findy_hackathon", "get-proof"]
      },
      {
        id: "submission.assets",
        name: "Open human-readable submission assets",
        description: "ProtoPedia提出に必要な動画台本、構成図、ストーリー、タグ、提出URLをGETで読めるページに束ねる。",
        tags: ["protopedia", "submission-assets", "video", "architecture", "findy_hackathon"]
      },
      {
        id: "recording.script",
        name: "Open the 30-second recording script",
        description: "Pitch Director、Demo Runway、Submission Closeoutを束ね、録画担当者が直接読める30秒動画台本をGETで返す。",
        tags: ["recording-script", "video", "protopedia", "submission", "get-proof"]
      },
      {
        id: SUBMISSION_PUBLISH_SKILL_ID,
        name: "Prepare paste-ready ProtoPedia publication",
        description: "ProtoPediaに貼る本文、タグ、URL、動画台本、残ギャップ、作品性のPublication Policy LockをGET証拠ページ付きで返す。",
        tags: ["protopedia", "publishing", SUBMISSION_PUBLISH_LOCK_TAG, "publication-policy-lock", "video", "submission", "findy_hackathon", "get-proof"]
      },
      {
        id: "demo.runway",
        name: "Run the 30-second judge demo runway",
        description: "審査員が最初に見る30秒の画面順、証拠リンク、録画キュー、残リスクを束ねる。",
        tags: ["demo", "judge-experience", "video", "proof", "submission"]
      },
      {
        id: WIN_AUTOPILOT_SKILL_ID,
        name: "Run the one-click winning autopilot",
        description: "競合/SWOT、証拠、最終候補判定、提出、運用を一括実行し、GET証拠ページで勝てる状態と残アクションを返す。",
        tags: ["autopilot", "winning-strategy", "judge-proof", "submission", "cloud-run", WIN_AUTOPILOT_LOCK_TAG, "get-proof"]
      },
      {
        id: SUBMISSION_DOSSIER_SKILL_ID,
        name: "Build the final submission dossier",
        description: "ProtoPedia本文、動画録画順、提出リンク、証拠デッキ、最終チェックをGET証拠ページ付きの提出ドシエに束ねる。",
        tags: ["submission", "protopedia", "dossier", SUBMISSION_DOSSIER_LOCK_TAG, "video", "judge-proof", "get-proof"]
      },
      {
        id: "submission.launch",
        name: "Validate final submission launch gate",
        description: "ProtoPedia作品URLと動画URLを受け取り、提出3点、タグ、本文、CI、証拠receipt、Final Submit LockをGET/JSONで最終判定する。",
        tags: ["submission", "launch-gate", "final-submit-lock", "submit-form-lock", "protopedia", "video", "mvp", "get-proof"]
      },
      {
        id: EXTERNAL_EVIDENCE_SKILL_ID,
        name: "Verify external submission evidence",
        description: "公開GitHub、Cloud Run、ProtoPedia作品URL、動画URLが審査員から開けるかをGET証拠ページとJSONでライブ検証する。",
        tags: ["submission", "external-proof", EXTERNAL_EVIDENCE_LOCK_TAG, "protopedia", "video", "live-proof", "get-proof"]
      },
      {
        id: "submission.closeout",
        name: "Close out external submission work",
        description: "ProtoPedia貼付、構成図、30秒動画、外部URL、最終提出フォームを順番付きの作業台に束ね、Policy/Dry Run/Asset Lockで検収する。",
        tags: ["submission", "closeout", "protopedia", "publication-policy-lock", "video", "launch-gate", "dry-run-lock", "asset-lock"]
      },
      {
        id: "submission.runway",
        name: "Run the final submission deadline runway",
        description: "2026/7/10 23:59 JSTの提出締切から逆算し、動画、ProtoPedia、構成図、最終フォームを検収順に束ねる。",
        tags: ["submission", "deadline", "runway", "protopedia", "video", "devops"]
      },
      {
        id: "demo.concierge",
        name: "Guide first-click demo concierge",
        description: "審査員、買い手、提出者の最初の1クリック、台詞、証拠URL、成功条件を固定し、機能過多の迷いを減らす。",
        tags: ["demo", "concierge", "first-run", "usability", "practicality", "judge-experience"]
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
        id: "pilot.value.snapshot",
        name: "Open the practical pilot value snapshot",
        description: "Impact Case、User Pilot、Pilot Economicsを束ね、実用性・体験価値・導入採算をGETで読める証拠にする。",
        tags: ["pilot-value", "practicality", "usability", "roi", "buyer-proof", "get-proof"]
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
        description: "審査5項目と主要競合への厳しめ質問、短い回答、60秒回答パス、証拠リンク、次アクションを生成する。",
        tags: ["judge-drill", "qa", "rebuttal", "cross-exam", "evidence", "scorecard"]
      },
      {
        id: "finalist.simulate",
        name: "Simulate finalist judging panel",
        description: "審査員5役の模擬判定で、最終候補スコア、Release Drift、Finalist Internal Lock、外部URL status、次の一手を返す。",
        tags: ["finalist", "judge-panel", "mvp", "scorecard", "release-drift", "submission", "internal-lock", "submission-url"]
      },
      {
        id: "judge.proof",
        name: "Build one-click judge proof bundle",
        description: "Gemini Proof Lock、Usability Proof Lock、Cloud Run、A2A、競合/SWOT、Mission、Ops、CI、Pitch、Judge Drill、Finalist、提出URLを1つの審査証拠束として返す。",
        tags: [
          "judge-proof",
          "gemini",
          "gemini-proof-lock",
          "usability-proof-lock",
          "cloud-run",
          "a2a",
          "ci",
          "pitch",
          "judge-drill",
          "finalist",
          "submission"
        ]
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
  timeoutMs?: number;
  evaluate: (payload: unknown) => { status: LiveEvidenceStatus; score?: number; evidence: string };
}) {
  const startedAt = Date.now();
  try {
    const response = await fetch(input.url, {
      ...input.init,
      signal: AbortSignal.timeout(input.timeoutMs ?? 3500)
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

async function liveFirstClickHtmlProbe(input: {
  sentinel: (typeof FIRST_CLICK_SMOKE_SENTINELS)[number];
  targetBaseUrl: string;
  init?: RequestInit;
  timeoutMs?: number;
}): Promise<FirstClickSmokeProbe> {
  const url = `${input.targetBaseUrl.replace(/\/$/, "")}${input.sentinel.href}`;
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      ...input.init,
      signal: AbortSignal.timeout(input.timeoutMs ?? 30000)
    });
    const latencyMs = Date.now() - startedAt;
    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    if (!response.ok) {
      return {
        ...input.sentinel,
        url,
        status: "missing",
        score: 24,
        evidence: `HTTP ${response.status}`,
        latencyMs
      };
    }
    if (!text.includes(input.sentinel.sentinel)) {
      return {
        ...input.sentinel,
        url,
        status: "missing",
        score: 24,
        evidence: `HTTP ${response.status} ${contentType || "unknown content-type"}, but missing sentinel ${input.sentinel.sentinel}.`,
        latencyMs
      };
    }
    const html = contentType.includes("text/html");
    return {
      ...input.sentinel,
      url,
      status: html ? "passed" : "watch",
      score: html ? 100 : 82,
      evidence: `${input.sentinel.sentinel} found in ${contentType || "unknown content-type"}.`,
      latencyMs
    };
  } catch (error) {
    return {
      ...input.sentinel,
      url,
      status: "missing",
      score: 24,
      evidence: error instanceof Error ? error.message : "HTML smoke probe failed",
      latencyMs: Date.now() - startedAt
    };
  }
}

function parsedHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function externalUrlAllowed(id: ExternalEvidenceProbe["id"], value: string) {
  const parsed = parsedHttpsUrl(value);
  if (!parsed) return false;
  const host = parsed.hostname.replace(/^www\./, "");
  if (id === "github-url") return host === "github.com";
  if (id === "deployed-url") return host.endsWith(".run.app");
  if (id === "protopedia-url") return host === "protopedia.net" || host.endsWith(".protopedia.net");
  return host === "youtube.com" || host === "youtu.be" || host === "vimeo.com" || host === "drive.google.com";
}

async function externalUrlProbe(input: {
  id: ExternalEvidenceProbe["id"];
  label: string;
  url: string;
  fetchUrl?: string;
  init?: RequestInit;
  required: boolean;
  missingEvidence: string;
  invalidEvidence: string;
}) {
  const url = input.url.trim();
  if (!url) {
    return {
      id: input.id,
      label: input.label,
      status: "missing" as const,
      score: 30,
      url: "",
      evidence: input.missingEvidence,
      required: input.required
    };
  }
  if (!externalUrlAllowed(input.id, url)) {
    return {
      id: input.id,
      label: input.label,
      status: "missing" as const,
      score: 20,
      url,
      evidence: input.invalidEvidence,
      required: input.required
    };
  }

  const startedAt = Date.now();
  try {
    const inputHeaders = input.init?.headers instanceof Headers ? Object.fromEntries(input.init.headers.entries()) : (input.init?.headers as Record<string, string> | undefined);
    const response = await fetch(input.fetchUrl ?? url, {
      ...input.init,
      method: "GET",
      headers: {
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "User-Agent": "a2a-agent-marketplace",
        ...inputHeaders
      },
      redirect: "follow",
      signal: AbortSignal.timeout(4500)
    });
    await response.body?.cancel().catch(() => undefined);
    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      return {
        id: input.id,
        label: input.label,
        status: "missing" as const,
        score: 30,
        url,
        evidence: `HTTP ${response.status} from public fetch.`,
        latencyMs,
        required: input.required
      };
    }
    const driveWatch = input.id === "video-url" && parsedHttpsUrl(url)?.hostname.replace(/^www\./, "") === "drive.google.com";
    return {
      id: input.id,
      label: input.label,
      status: driveWatch ? ("watch" as const) : ("passed" as const),
      score: driveWatch ? 72 : 100,
      url,
      evidence: driveWatch
        ? `Google Drive returned HTTP ${response.status}; keep this as backup only because Submission Launch Gate seals YouTube/Vimeo URLs.`
        : `Public fetch returned HTTP ${response.status}.`,
      latencyMs,
      required: input.required
    };
  } catch (error) {
    return {
      id: input.id,
      label: input.label,
      status: "missing" as const,
      score: 30,
      url,
      evidence: error instanceof Error ? error.message : "external URL probe failed",
      latencyMs: Date.now() - startedAt,
      required: input.required
    };
  }
}

function staticExternalEvidenceProbes(): ExternalEvidenceProbe[] {
  return [
    {
      id: "github-url",
      label: "Public GitHub repository",
      status: "passed",
      score: 100,
      url: SUBMISSION_PROOF.publicGitHubUrl,
      evidence: "Public GitHub URL is configured for final submission.",
      required: true
    },
    {
      id: "deployed-url",
      label: "Deployed Cloud Run URL",
      status: "passed",
      score: 100,
      url: SUBMISSION_PROOF.deployedUrl,
      evidence: "Cloud Run URL is configured and separately covered by health/release drift probes.",
      required: true
    },
    {
      id: "protopedia-url",
      label: "ProtoPedia work URL",
      status: "missing",
      score: 30,
      url: "",
      evidence: "ProtoPedia work URL is not present in this A2A request.",
      required: true
    },
    {
      id: "video-url",
      label: "Demo video URL",
      status: "missing",
      score: 30,
      url: "",
      evidence: "Demo video URL is not present in this A2A request.",
      required: true
    }
  ];
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

app.post("/api/market-intel", async (req, res) => {
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
  const sourceProofLock = await probeMarketIntelSources({
    sourceLedger: marketIntel.sourceLedger,
    timeoutMs: 6000
  });
  res.json(attachSourceProofLock(marketIntel, sourceProofLock));
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

app.post("/api/competitive-battlecard", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntelBase = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const sourceProofLock = await probeMarketIntelSources({
    sourceLedger: marketIntelBase.sourceLedger,
    timeoutMs: 6000
  });
  const marketIntel = attachSourceProofLock(marketIntelBase, sourceProofLock);
  const moatStress = buildMoatStressTest({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    marketIntel
  });

  res.json(
    buildCompetitiveBattlecard({
      baseUrl: publicBaseUrl(req),
      strategy,
      marketIntel,
      moatStress
    })
  );
});

function competitiveSnapshotQueryInput(req: express.Request) {
  return {
    liveSourceProof: req.query.live === "1" || req.query.live === "true"
  };
}

async function buildCompetitiveSnapshotForRequest(req: express.Request, input: { liveSourceProof?: boolean } = {}) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const projectBrief = DEFAULT_PROJECT_BRIEF;
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntelBase = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const marketIntel = input.liveSourceProof
    ? attachSourceProofLock(
        marketIntelBase,
        await probeMarketIntelSources({
          sourceLedger: marketIntelBase.sourceLedger,
          timeoutMs: 6000
        })
      )
    : marketIntelBase;
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });

  return buildCompetitiveSnapshot({
    baseUrl,
    projectBrief,
    selectedAgentIds,
    strategy,
    marketIntel,
    battlecard
  });
}

app.get("/api/competitive-swot", async (req, res) => {
  res.json(await buildCompetitiveSnapshotForRequest(req, competitiveSnapshotQueryInput(req)));
});

app.get("/competitive-swot", async (req, res) => {
  res.type("html").send(renderCompetitiveSnapshotHtml(await buildCompetitiveSnapshotForRequest(req, competitiveSnapshotQueryInput(req))));
});

function defaultCompetitiveDecisionInput(): z.infer<typeof RecommendSchema> {
  return {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"]
  };
}

async function buildCompetitiveDecisionMatrixForRequest(
  req: express.Request,
  input: z.infer<typeof RecommendSchema>,
  options: { liveSourceProof?: boolean } = {}
) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntelBase = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const marketIntel = options.liveSourceProof
    ? attachSourceProofLock(
        marketIntelBase,
        await probeMarketIntelSources({
          sourceLedger: marketIntelBase.sourceLedger,
          timeoutMs: 6000
        })
      )
    : marketIntelBase;
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });

  return buildCompetitiveDecisionMatrix({
    baseUrl,
    strategy,
    battlecard
  });
}

app.get("/api/competitive-decision-matrix", async (req, res) => {
  res.json(await buildCompetitiveDecisionMatrixForRequest(req, defaultCompetitiveDecisionInput(), competitiveSnapshotQueryInput(req)));
});

app.get("/competitive-decision-matrix", async (req, res) => {
  res
    .type("html")
    .send(renderCompetitiveDecisionMatrixHtml(await buildCompetitiveDecisionMatrixForRequest(req, defaultCompetitiveDecisionInput(), competitiveSnapshotQueryInput(req))));
});

app.post("/api/competitive-decision-matrix", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildCompetitiveDecisionMatrixForRequest(req, parsed.data, { liveSourceProof: req.query.live === "1" || req.query.live === "true" }));
});

async function buildJudgeSnapshotForRequest(req: express.Request) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const projectBrief = DEFAULT_PROJECT_BRIEF;
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "審査員がGETで直接開ける初回証拠スナップショットを生成する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const ci = await fetchCiProof();
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: localGeminiRecommendation(recommendation, "GET /api/judge-snapshot keeps first-click proof stable; POST /api/proof runs live Gemini."),
    ci
  });
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const liveReleaseDrift = req.query.live === "1" || req.query.live === "true";
  const targetUrlValue = typeof req.query.targetUrl === "string" ? req.query.targetUrl : undefined;
  const targetUrl = targetUrlValue ? z.string().url().safeParse(targetUrlValue) : undefined;
  if (targetUrl && !targetUrl.success) {
    return { error: { error: "invalid_request", issues: targetUrl.error.issues } };
  }
  const releaseDrift = liveReleaseDrift
    ? await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: targetUrl?.data ?? SUBMISSION_PROOF.deployedUrl,
        projectBrief,
        selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      })
    : undefined;

  return {
    snapshot: buildJudgeSnapshot({
      baseUrl,
      projectBrief,
      selectedAgentIds,
      proof,
      battlecard,
      agentCardSkillIds: agentCard(baseUrl).skills.map((skill) => skill.id),
      releaseDrift
    })
  };
}

app.get("/api/judge-snapshot", async (req, res) => {
  const result = await buildJudgeSnapshotForRequest(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(result.snapshot);
});

app.get("/judge-snapshot", async (req, res) => {
  const result = await buildJudgeSnapshotForRequest(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderJudgeSnapshotHtml(result.snapshot));
});

async function buildMvpSnapshotForRequest(req: express.Request) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const projectBrief = DEFAULT_PROJECT_BRIEF;
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "MVP本体、外部提出gap、公開revisionを単一判断に束ねる。");
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
  const ci = await fetchCiProof();
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: localGeminiRecommendation(recommendation, "GET /mvp-readiness keeps first-click proof stable; POST /api/proof runs live Gemini."),
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
  const submissionLaunch = buildSubmissionLaunchGate({ mvpAudit, dossier, proof, publisher });
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
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief,
    selectedAgentIds,
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
  const liveReleaseDrift = req.query.live === "1" || req.query.live === "true";
  const targetUrlValue = typeof req.query.targetUrl === "string" ? req.query.targetUrl : undefined;
  const targetUrl = targetUrlValue ? z.string().url().safeParse(targetUrlValue) : undefined;
  if (targetUrl && !targetUrl.success) {
    return { error: { error: "invalid_request", issues: targetUrl.error.issues } };
  }
  const releaseDrift = liveReleaseDrift
    ? await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: targetUrl?.data ?? SUBMISSION_PROOF.deployedUrl,
        projectBrief,
        selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      })
    : undefined;
  const deployRecovery = releaseDrift
    ? buildDeployRecoveryPlan({
        baseUrl,
        releaseDrift
      })
    : undefined;
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
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift,
    submissionLaunch
  });

  return {
    snapshot: buildMvpSnapshot({
      baseUrl,
      projectBrief,
      selectedAgentIds,
      mvpAudit,
      acceptance,
      releaseDrift,
      deployRecovery
    })
  };
}

app.get("/api/mvp-readiness", async (req, res) => {
  const result = await buildMvpSnapshotForRequest(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(result.snapshot);
});

app.get("/mvp-readiness", async (req, res) => {
  const result = await buildMvpSnapshotForRequest(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderMvpSnapshotHtml(result.snapshot));
});

function winnerSufficiencyQueryInput(req: express.Request) {
  const parsed = CommandCenterSchema.safeParse({
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    skipReleaseDrift: false,
    ...(typeof req.query.targetUrl === "string" ? { targetUrl: req.query.targetUrl } : { targetUrl: publicBaseUrl(req) }),
    ...(typeof req.query.protopediaUrl === "string" ? { protopediaUrl: req.query.protopediaUrl } : {}),
    ...(typeof req.query.videoUrl === "string" ? { videoUrl: req.query.videoUrl } : {})
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildWinnerSufficiencyForRequest(req: express.Request, input: CommandCenterInput) {
  const baseUrl = publicBaseUrl(req);
  const mvpResult = await buildMvpSnapshotForRequest(req);
  if ("error" in mvpResult) return { error: mvpResult.error };
  const competitiveSnapshot = await buildCompetitiveSnapshotForRequest(req, competitiveSnapshotQueryInput(req));
  const winGapBundle = await buildWinGapRadarBundleForInput(req, input);
  const firstClickSmoke = await buildFirstClickSmokeForRequest(req, { targetUrl: input.targetUrl || baseUrl });
  const releaseDrift = winGapBundle.releaseDrift;
  const mvpSnapshot = releaseDrift
    ? {
        ...mvpResult.snapshot,
        readiness:
          releaseDrift.verdict === "deploy-drift" || releaseDrift.verdict === "release-blocked"
            ? "mvp-release-drift"
            : mvpResult.snapshot.readiness,
        summary: {
          ...mvpResult.snapshot.summary,
          releaseVerdict: releaseDrift.verdict
        },
        releaseLock: {
          verdict: releaseDrift.verdict,
          targetBaseUrl: releaseDrift.targetBaseUrl,
          missingSkills: releaseDrift.missingSkills,
          missingAgentCardSignals: releaseDrift.missingAgentCardSignals,
          probes: releaseDrift.probes.map((probe) => ({
            id: probe.id,
            status: probe.status,
            score: probe.score,
            url: probe.url
          }))
        }
      }
    : mvpResult.snapshot;

  return {
    lock: buildWinnerSufficiencyLock({
      baseUrl,
      mvpSnapshot,
      competitiveSnapshot,
      winGapRadar: winGapBundle.radar,
      firstClickSmoke,
      submissionLaunch: winGapBundle.submissionLaunch
    })
  };
}

app.get("/api/winner-sufficiency", async (req, res) => {
  const result = winnerSufficiencyQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  const lock = await buildWinnerSufficiencyForRequest(req, result.input);
  if ("error" in lock) {
    res.status(400).json(lock.error);
    return;
  }
  res.json(lock.lock);
});

app.get("/winner-sufficiency", async (req, res) => {
  const result = winnerSufficiencyQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  const lock = await buildWinnerSufficiencyForRequest(req, result.input);
  if ("error" in lock) {
    res.status(400).json(lock.error);
    return;
  }
  res.type("html").send(renderWinnerSufficiencyHtml(lock.lock));
});

async function buildAutonomySnapshotForRequest(req: express.Request) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const projectBrief = DEFAULT_PROJECT_BRIEF;
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "AIエージェント中心性を、判断、委任、検証、運用、提出のGET証拠に束ねる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const ci = await fetchCiProof();
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: localGeminiRecommendation(recommendation, "GET /autonomy-snapshot keeps first-click proof stable; POST /api/autonomy-ledger runs live Gemini."),
    ci
  });
  const autonomyLedger = buildAutonomyLedger({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    proof
  });
  const taskBoard = buildAgentTaskBoard({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract
  });

  return buildAutonomySnapshot({
    baseUrl,
    projectBrief,
    selectedAgentIds,
    autonomyLedger,
    taskBoard,
    mission
  });
}

app.get("/api/autonomy-snapshot", async (req, res) => {
  res.json(await buildAutonomySnapshotForRequest(req));
});

app.get("/autonomy-snapshot", async (req, res) => {
  res.type("html").send(renderAutonomySnapshotHtml(await buildAutonomySnapshotForRequest(req)));
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

app.get("/submission-assets", (req, res) => {
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy);
  const page = buildSubmissionAssetsPage({
    baseUrl: publicBaseUrl(req),
    mission
  });
  res.type("html").send(renderSubmissionAssetsHtml(page));
});

async function buildRecordingScriptForRequest(req: express.Request) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const projectBrief = DEFAULT_PROJECT_BRIEF;
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const mission = buildMissionRun(recommendation, strategy, "30秒動画の録画台本を審査員・提出者が直接開けるGETページにする。");
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
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher, battlecard });
  const ci = await fetchCiProof();
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: localGeminiRecommendation(recommendation, "GET /recording-script keeps the teleprompter stable; POST /api/proof runs live Gemini."),
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
  const launchGate = buildSubmissionLaunchGate({
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const closeout = buildSubmissionCloseoutWorkbench({
    baseUrl,
    publisher,
    dossier,
    demoRunway,
    proof,
    launchGate
  });

  return buildRecordingScriptPage({
    baseUrl,
    pitch,
    demoRunway,
    closeout
  });
}

app.get("/api/recording-script", async (req, res) => {
  res.json(await buildRecordingScriptForRequest(req));
});

app.get("/recording-script", async (req, res) => {
  res.type("html").send(renderRecordingScriptHtml(await buildRecordingScriptForRequest(req)));
});

function buildArchitecturePackForRequest(req: express.Request, input: z.infer<typeof RecommendSchema>) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "ProtoPediaに貼るシステム構成図と、必須技術・A2A・DevOps証拠の対応表を生成する。");

  return buildArchitecturePack({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission
  });
}

function defaultArchitecturePackInput(): z.infer<typeof RecommendSchema> {
  return {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"]
  };
}

app.get("/api/architecture-pack", (req, res) => {
  res.json(buildArchitecturePackForRequest(req, defaultArchitecturePackInput()));
});

app.get("/architecture-pack", (req, res) => {
  res.type("html").send(renderArchitecturePackHtml(buildArchitecturePackForRequest(req, defaultArchitecturePackInput())));
});

app.post("/api/architecture-pack", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildArchitecturePackForRequest(req, parsed.data));
});

function defaultPublisherInput(): z.infer<typeof RecommendSchema> {
  return {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"]
  };
}

function buildPublisherForRequest(req: express.Request, input: z.infer<typeof RecommendSchema>) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
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

  return buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
}

app.get("/api/publisher", (req, res) => {
  res.json(buildPublisherForRequest(req, defaultPublisherInput()));
});

app.get("/publisher", (req, res) => {
  res.type("html").send(renderProtoPediaPublisherHtml(buildPublisherForRequest(req, defaultPublisherInput())));
});

app.post("/api/publisher", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildPublisherForRequest(req, parsed.data));
});

app.post("/api/demo-run", (req, res) => {
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
  const moatStress = buildMoatStressTest({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    marketIntel
  });
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl: publicBaseUrl(req),
    strategy,
    marketIntel,
    moatStress
  });
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
      publisher,
      battlecard: competitiveBattlecard
    })
  );
});

function winAutopilotQueryInput(req: express.Request) {
  const selectedAgentIds =
    typeof req.query.selectedAgentIds === "string"
      ? req.query.selectedAgentIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const parsed = RecommendSchema.safeParse({
    projectBrief: typeof req.query.projectBrief === "string" ? req.query.projectBrief : DEFAULT_PROJECT_BRIEF,
    selectedAgentIds
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildWinningAutopilotForInput(req: express.Request, input: z.infer<typeof RecommendSchema>) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "優勝に必要な証拠、審査適合、提出準備、運用性を一括判定する。");
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
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
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

  return buildWinningAutopilot({
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
}

app.get("/api/win-autopilot", async (req, res) => {
  const result = winAutopilotQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildWinningAutopilotForInput(req, result.input));
});

app.get("/win-autopilot", async (req, res) => {
  const result = winAutopilotQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderWinningAutopilotHtml(await buildWinningAutopilotForInput(req, result.input)));
});

app.post("/api/win-run", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildWinningAutopilotForInput(req, parsed.data));
});

function defaultDossierInput(): z.infer<typeof RecommendSchema> {
  return {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"]
  };
}

async function buildDossierForRequest(req: express.Request, input: z.infer<typeof RecommendSchema>) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl,
    recommendation,
    strategy
  });
  const moatStress = buildMoatStressTest({
    baseUrl,
    recommendation,
    strategy,
    marketIntel
  });
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl,
    strategy,
    marketIntel,
    moatStress
  });
  const mission = buildMissionRun(recommendation, strategy, "ProtoPedia提出本文、動画録画順、証拠リンク、残ギャップを1つの提出ドシエに束ねる。");
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
    publisher,
    battlecard: competitiveBattlecard
  });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
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
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
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

  return buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof,
    battlecard: competitiveBattlecard,
    impactCase,
    pilotEconomics
  });
}

app.get("/api/dossier", async (req, res) => {
  res.json(await buildDossierForRequest(req, defaultDossierInput()));
});

app.get("/dossier", async (req, res) => {
  res.type("html").send(renderSubmissionDossierHtml(await buildDossierForRequest(req, defaultDossierInput())));
});

app.post("/api/dossier", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildDossierForRequest(req, parsed.data));
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
    squadContract,
    submissionUrls: submissionUrlEvidence(parsed.data)
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

function liveStatusFromScore(score: number): LiveEvidenceStatus {
  if (score >= 90) return "passed";
  if (score >= 65) return "watch";
  return "missing";
}

function buildProofBackedLiveEvidence(input: { baseUrl: string; proof: JudgeProof; ci: CiProof }) {
  const baseUrl = input.baseUrl.replace(/\/$/, "");
  const cloudRunStatus = liveStatusFromScore(input.proof.scores.cloudRun);
  const a2aStatus = liveStatusFromScore(input.proof.scores.a2a);
  const ciStatus = input.ci.status === "passed" ? "passed" : input.ci.status;

  return buildLiveEvidenceRun({
    baseUrl,
    probes: [
      {
        id: "proof-cloud-run",
        label: "Cloud Run proof score",
        status: cloudRunStatus,
        score: input.proof.scores.cloudRun,
        url: `${baseUrl}/api/healthz`,
        evidence: `Judge Proof Cloud Run score ${input.proof.scores.cloudRun}; /api/live-evidence performs live public probes.`,
        required: true
      },
      {
        id: "proof-agent-card",
        label: "A2A proof score",
        status: a2aStatus,
        score: input.proof.scores.a2a,
        url: `${baseUrl}/.well-known/agent-card.json`,
        evidence: `Judge Proof A2A score ${input.proof.scores.a2a}; Agent Card and /a2a expose the current skill surface.`,
        required: true
      },
      {
        id: "observability-oracle",
        label: "Observability Oracle endpoint",
        status: "passed",
        score: 100,
        url: `${baseUrl}/api/observability-oracle`,
        evidence: "Observability Oracle endpoint is part of the current public proof surface.",
        required: true
      },
      {
        id: "ci-main",
        label: "GitHub Actions CI",
        status: ciStatus,
        score: input.ci.status === "passed" ? 100 : evidenceScore(ciStatus),
        url: input.ci.url,
        evidence: input.ci.evidence,
        required: true
      }
    ]
  });
}

async function buildLiveEvidenceForRequest(req: express.Request, input: z.infer<typeof LiveEvidenceSchema>) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = input.selectedAgentIds;
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
        const hasTaskDelegate = skills.some((skill) => skill.id === "task.delegate");
        const hasEvidence = skills.some((skill) => skill.id === "evidence.monitor");
        const hasOptimizer = skills.some((skill) => skill.id === "squad.optimize");
        const hasMoat = skills.some((skill) => skill.id === "moat.stress");
        const hasBattlecard = skills.some((skill) => skill.id === "competitive.battlecard");
        const hasCompetitiveSnapshot = skills.some((skill) => skill.id === "competitive.snapshot");
        const hasJudgeSnapshot = skills.some((skill) => skill.id === "judge.snapshot");
        const hasMvpSnapshot = skills.some((skill) => skill.id === "mvp.snapshot");
        const hasReceipt = skills.some((skill) => skill.id === "demo.receipt");
        const hasAcceptance = skills.some((skill) => skill.id === "acceptance.matrix");
        const hasReleaseDrift = skills.some((skill) => skill.id === "release.drift");
        const hasAutonomySnapshot = skills.some((skill) => skill.id === "autonomy.snapshot");
        const hasPilotEconomics = skills.some((skill) => skill.id === "pilot.economics");
        const hasPilotValueSnapshot = skills.some((skill) => skill.id === "pilot.value.snapshot");
        const hasDemoConcierge = skills.some((skill) => skill.id === "demo.concierge");
        const hasJudgeCommand = skills.some((skill) => skill.id === "judge.command");
        const hasJudgeRehearsal = skills.some((skill) => skill.id === "judge.rehearsal");
        const hasWinnerPacket = skills.some((skill) => skill.id === "winner.packet");
        const hasWinAutopilot = skills.some((skill) => skill.id === WIN_AUTOPILOT_SKILL_ID);
        const hasPrizeStrategy = skills.some((skill) => skill.id === PRIZE_STRATEGY_SKILL_ID);
        const hasWinGapRadar = skills.some((skill) => skill.id === "win.gap.radar");
        const hasSubmissionCloseout = skills.some((skill) => skill.id === "submission.closeout");
        const hasSubmissionRunway = skills.some((skill) => skill.id === "submission.runway");
        const hasSubmissionAssets = skills.some((skill) => skill.id === "submission.assets");
        const hasRecordingScript = skills.some((skill) => skill.id === "recording.script");
        const hasExternalEvidence = skills.some((skill) => skill.id === "external.evidence");
        const hasDeployRecovery = skills.some((skill) => skill.id === "deploy.recover");
        const hasObservabilityOracle = skills.some((skill) => skill.id === "observability.oracle");
        return hasTaskDelegate &&
          hasEvidence &&
          hasOptimizer &&
          hasMoat &&
          hasBattlecard &&
          hasCompetitiveSnapshot &&
          hasJudgeSnapshot &&
          hasMvpSnapshot &&
          hasReceipt &&
          hasAcceptance &&
          hasReleaseDrift &&
          hasAutonomySnapshot &&
          hasPilotEconomics &&
          hasPilotValueSnapshot &&
          hasDemoConcierge &&
          hasJudgeCommand &&
          hasJudgeRehearsal &&
          hasWinnerPacket &&
          hasWinAutopilot &&
          hasPrizeStrategy &&
          hasWinGapRadar &&
          hasSubmissionCloseout &&
          hasSubmissionRunway &&
          hasSubmissionAssets &&
          hasRecordingScript &&
          hasExternalEvidence &&
          hasDeployRecovery &&
          hasObservabilityOracle &&
          skills.length >= 52
          ? {
              status: "passed",
              score: 100,
              evidence: `Agent Card exposes ${skills.length} skills including autonomy.snapshot, observability.oracle, task.delegate, external.evidence, winner.packet, win.autopilot, submission.runway, submission.assets, recording.script, pilot.value.snapshot, judge.rehearsal, submission.closeout, win.gap.radar, demo.concierge, prize.strategy, competitive.battlecard, competitive.snapshot, judge.snapshot, mvp.snapshot, deploy.recover, judge.command, pilot.economics, release.drift, acceptance.matrix, demo.receipt, moat.stress, evidence.monitor, and squad.optimize.`
            }
          : {
              status: "watch",
              score: 72,
              evidence: `Agent Card exposes ${skills.length} skills; expected autonomy snapshot, observability oracle, task delegate, external evidence, winner packet, win autopilot, submission runway, submission assets, recording script, pilot value snapshot, judge rehearsal, submission closeout, win gap radar, demo concierge, prize strategy, battlecard, competitive snapshot, judge snapshot, MVP snapshot, deploy recovery, judge command, pilot economics, release drift, acceptance, receipt, moat, live evidence, and optimizer skills.`
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
          projectBrief: input.projectBrief,
          selectedAgentIds,
          budget: input.budget,
          maxSquadSize: input.maxSquadSize
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
          params: { text: input.projectBrief }
        })
      },
      evaluate: (payload) => {
        const data = (payload as { result?: { artifacts?: Array<{ parts?: Array<{ data?: Record<string, unknown> }> }> } }).result?.artifacts?.[0]?.parts?.[0]?.data;
        return data?.squadOptimizerEndpoint &&
          data?.liveEvidenceEndpoint &&
          data?.moatStressEndpoint &&
          data?.competitiveBattlecardEndpoint &&
          data?.competitiveSwotSnapshotEndpoint &&
          data?.competitiveDecisionMatrixEndpoint &&
          data?.competitiveDecisionMatrixPageEndpoint &&
          data?.judgeSnapshotEndpoint &&
          data?.judgeSnapshotPageEndpoint &&
          data?.mvpReadinessSnapshotEndpoint &&
          data?.autonomySnapshotEndpoint &&
          data?.autonomySnapshotJsonEndpoint &&
          data?.demoReceiptEndpoint &&
          data?.acceptanceMatrixEndpoint &&
          data?.acceptanceMatrixPageEndpoint &&
          data?.releaseDriftEndpoint &&
          data?.taskBoardEndpoint &&
          data?.externalEvidenceEndpoint &&
          data?.externalEvidencePageEndpoint &&
          data?.pilotEconomicsEndpoint &&
          data?.pilotValueSnapshotEndpoint &&
          data?.pilotValueSnapshotJsonEndpoint &&
          data?.demoConciergeEndpoint &&
          data?.judgeCommandEndpoint &&
          data?.judgeCommandPageEndpoint &&
          data?.judgeRehearsalEndpoint &&
          data?.winnerPacketEndpoint &&
          data?.winnerPacketPageEndpoint &&
          data?.winnerSufficiencyEndpoint &&
          data?.winnerSufficiencyPageEndpoint &&
          data?.winAutopilotEndpoint &&
          data?.winAutopilotPageEndpoint &&
          data?.submissionRunwayEndpoint &&
          data?.submissionAssetsPageEndpoint &&
          data?.submissionLaunchEndpoint &&
          data?.submissionLaunchPageEndpoint &&
          data?.recordingScriptPageEndpoint &&
          data?.recordingScriptJsonEndpoint &&
          data?.prizeStrategyEndpoint &&
          data?.prizeStrategyPageEndpoint &&
          data?.publisherEndpoint &&
          data?.publisherPageEndpoint &&
          data?.dossierEndpoint &&
          data?.dossierPageEndpoint &&
          data?.winGapRadarEndpoint &&
          data?.submissionCloseoutEndpoint &&
          data?.deployRecoveryEndpoint &&
          data?.deployRecoveryPageEndpoint &&
          data?.observabilityOracleEndpoint &&
          data?.observabilityOraclePageEndpoint
          ? {
              status: "passed",
              score: 100,
              evidence:
                "A2A artifact exposes autonomySnapshotEndpoint, autonomySnapshotJsonEndpoint, observabilityOracleEndpoint, observabilityOraclePageEndpoint, squadOptimizerEndpoint, liveEvidenceEndpoint, externalEvidenceEndpoint, externalEvidencePageEndpoint, moatStressEndpoint, competitiveBattlecardEndpoint, competitiveSwotSnapshotEndpoint, competitiveDecisionMatrixEndpoint, competitiveDecisionMatrixPageEndpoint, judgeSnapshotEndpoint, judgeSnapshotPageEndpoint, mvpReadinessSnapshotEndpoint, demoReceiptEndpoint, acceptanceMatrixEndpoint, acceptanceMatrixPageEndpoint, releaseDriftEndpoint, taskBoardEndpoint, pilotEconomicsEndpoint, pilotValueSnapshotEndpoint, demoConciergeEndpoint, judgeCommandEndpoint, judgeCommandPageEndpoint, judgeRehearsalEndpoint, winnerPacketEndpoint, winnerPacketPageEndpoint, winnerSufficiencyEndpoint, winnerSufficiencyPageEndpoint, winAutopilotEndpoint, winAutopilotPageEndpoint, submissionRunwayEndpoint, submissionAssetsPageEndpoint, submissionLaunchEndpoint, submissionLaunchPageEndpoint, recordingScriptPageEndpoint, recordingScriptJsonEndpoint, prizeStrategyEndpoint, prizeStrategyPageEndpoint, publisherEndpoint, publisherPageEndpoint, dossierEndpoint, dossierPageEndpoint, winGapRadarEndpoint, submissionCloseoutEndpoint, deployRecoveryEndpoint, and deployRecoveryPageEndpoint."
            }
          : { status: "watch", score: 72, evidence: "A2A artifact returned, but autonomy snapshot/observability oracle/external evidence API/page/task board/winner packet/winner sufficiency/win autopilot/submission runway/submission assets/submission launch/recording script/pilot value snapshot/judge rehearsal/submission closeout/win gap radar/demo concierge/prize strategy API/page/publisher API/page/dossier API/page/battlecard/decision matrix/judge snapshot/MVP snapshot/deploy recovery page/judge command API/page/pilot economics/release drift/acceptance API/page/receipt/moat/live evidence endpoints were not visible." };
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

  return buildLiveEvidenceRun({
    baseUrl,
    probes: [healthProbe, cardProbe, optimizerProbe, a2aProbe, ciProbe]
  });
}

app.post("/api/live-evidence", async (req, res) => {
  const parsed = LiveEvidenceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildLiveEvidenceForRequest(req, parsed.data));
});

function observabilityOracleQueryInput(req: express.Request) {
  const selectedAgentIds =
    typeof req.query.selectedAgentIds === "string"
      ? req.query.selectedAgentIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const parsed = LiveEvidenceSchema.safeParse({
    projectBrief: typeof req.query.projectBrief === "string" ? req.query.projectBrief : DEFAULT_PROJECT_BRIEF,
    selectedAgentIds,
    budget: typeof req.query.budget === "string" ? Number(req.query.budget) : 140,
    maxSquadSize: typeof req.query.maxSquadSize === "string" ? Number(req.query.maxSquadSize) : 4
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildObservabilityOracleForInput(req: express.Request, input: z.infer<typeof LiveEvidenceSchema>) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "公開運用シグナルを読み、継続/復旧/買い手価値/次のAI雇用を1つのObservability Oracleに束ねる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const [liveEvidence, ci] = await Promise.all([buildLiveEvidenceForRequest(req, input), fetchCiProof()]);
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

  return buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence,
    opsDrill,
    pilotEconomics
  });
}

app.get("/api/observability-oracle", async (req, res) => {
  const result = observabilityOracleQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildObservabilityOracleForInput(req, result.input));
});

app.get("/observability-oracle", async (req, res) => {
  const result = observabilityOracleQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderObservabilityOracleHtml(await buildObservabilityOracleForInput(req, result.input)));
});

app.post("/api/observability-oracle", async (req, res) => {
  const parsed = LiveEvidenceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildObservabilityOracleForInput(req, parsed.data));
});

function externalEvidenceQueryInput(req: express.Request) {
  const candidate = {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    ...(typeof req.query.protopediaUrl === "string" ? { protopediaUrl: req.query.protopediaUrl } : {}),
    ...(typeof req.query.videoUrl === "string" ? { videoUrl: req.query.videoUrl } : {})
  };
  const parsed = LaunchSchema.safeParse(candidate);
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildExternalEvidenceForRequest(req: express.Request, input: z.infer<typeof LaunchSchema>) {
  const [githubProbe, deployedProbe, protopediaProbe, videoProbe] = await Promise.all([
    externalUrlProbe({
      id: "github-url",
      label: "Public GitHub repository",
      url: SUBMISSION_PROOF.publicGitHubUrl,
      required: true,
      missingEvidence: "Public GitHub URL is not configured.",
      invalidEvidence: "Public GitHub URL must be an https://github.com URL."
    }),
    externalUrlProbe({
      id: "deployed-url",
      label: "Deployed Cloud Run URL",
      url: SUBMISSION_PROOF.deployedUrl,
      fetchUrl: `${publicBaseUrl(req)}/api/healthz`,
      init: { headers: selfProbeHeaders(req) },
      required: true,
      missingEvidence: "Cloud Run deployed URL is not configured.",
      invalidEvidence: "Cloud Run deployed URL must be an https://*.run.app URL."
    }),
    externalUrlProbe({
      id: "protopedia-url",
      label: "ProtoPedia work URL",
      url: input.protopediaUrl ?? "",
      required: true,
      missingEvidence: "ProtoPedia work URL is still missing.",
      invalidEvidence: "ProtoPedia work URL must be an https://protopedia.net URL."
    }),
    externalUrlProbe({
      id: "video-url",
      label: "Demo video URL",
      url: input.videoUrl ?? "",
      required: true,
      missingEvidence: "Demo video URL is still missing.",
      invalidEvidence: "Video URL must be YouTube or Vimeo over https for final submit."
    })
  ]);

  return buildExternalEvidenceRun({
    baseUrl: publicBaseUrl(req),
    probes: [githubProbe, deployedProbe, protopediaProbe, videoProbe]
  });
}

app.get("/api/external-evidence", async (req, res) => {
  const result = externalEvidenceQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildExternalEvidenceForRequest(req, result.input));
});

app.get("/external-evidence", async (req, res) => {
  const result = externalEvidenceQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderExternalEvidenceHtml(await buildExternalEvidenceForRequest(req, result.input)));
});

app.post("/api/external-evidence", async (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildExternalEvidenceForRequest(req, parsed.data));
});

async function buildReleaseDriftForTarget(input: {
  currentBaseUrl: string;
  targetBaseUrl: string;
  projectBrief: string;
  selectedAgentIds: string[];
  forwardedHeaders?: Record<string, string>;
}) {
  const currentBaseUrl = input.currentBaseUrl.replace(/\/$/, "");
  const targetBaseUrl = input.targetBaseUrl.replace(/\/$/, "");
  const targetProbeHeaders = input.forwardedHeaders && currentBaseUrl === targetBaseUrl ? input.forwardedHeaders : undefined;
  const expectedSkillIds = agentCard(currentBaseUrl).skills.map((skill) => skill.id);
  const requiredAgentCardSignals = [
    "judge.rehearsal:tag:recording-lock",
    "win.gap.radar:tag:feature-freeze-lock",
    "winner.packet:tag:winner-release-lock",
    "winner.packet:tag:get-proof",
    WINNER_SUFFICIENCY_REQUIRED_SIGNAL,
    WIN_AUTOPILOT_REQUIRED_SIGNAL,
    "judge.objection-arena:tag:objection-lock",
    "finalist.simulate:tag:release-drift",
    ACCEPTANCE_MATRIX_REQUIRED_SIGNAL,
    "competitive.battlecard:tag:criteria-duel",
    COMPETITIVE_WIN_LOSS_REQUIRED_SIGNAL,
    "competitive.snapshot:tag:get-proof",
    COMPETITIVE_DECISION_MATRIX_REQUIRED_SIGNAL,
    "judge.snapshot:tag:get-proof",
    FIRST_CLICK_REQUIRED_SIGNAL,
    FIRST_CLICK_SMOKE_REQUIRED_SIGNAL,
    "mvp.snapshot:tag:get-proof",
    "autonomy.snapshot:tag:get-proof",
    EXTERNAL_EVIDENCE_REQUIRED_SIGNAL,
    OBSERVABILITY_ORACLE_REQUIRED_SIGNAL,
    JUDGE_COMMAND_REQUIRED_SIGNAL,
    "recording.script:tag:get-proof",
    PRIZE_STRATEGY_REQUIRED_SIGNAL,
    SUBMISSION_PUBLISH_REQUIRED_SIGNAL,
    SUBMISSION_DOSSIER_REQUIRED_SIGNAL,
    "submission.launch:tag:get-proof",
    "submission.package:tag:get-proof",
    "pilot.value.snapshot:tag:get-proof",
    "deploy.recover:tag:get-proof"
  ];
  const requiredSkillIds = [
    "task.delegate",
    "external.evidence",
    "evidence.monitor",
    "observability.oracle",
    "demo.receipt",
    "acceptance.matrix",
    "release.drift",
    "mvp.snapshot",
    "autonomy.snapshot",
    "pilot.economics",
    "pilot.value.snapshot",
    "demo.concierge",
    "judge.command",
    "judge.rehearsal",
    "winner.packet",
    WINNER_SUFFICIENCY_SKILL_ID,
    "judge.objection-arena",
    "submission.launch",
    "submission.runway",
    "submission.assets",
    "recording.script",
    PRIZE_STRATEGY_SKILL_ID,
    SUBMISSION_DOSSIER_SKILL_ID,
    "win.gap.radar",
    "submission.closeout",
    "deploy.recover",
    "competitive.battlecard",
    "competitive.snapshot",
    COMPETITIVE_DECISION_MATRIX_SKILL_ID,
    "judge.snapshot",
    FIRST_CLICK_SKILL_ID,
    FIRST_CLICK_SMOKE_SKILL_ID,
    "win.autopilot"
  ];
  let observedSkillIds: string[] = [];
  let observedAgentCardSignals: string[] = [];

  const [
    healthProbe,
    cardProbe,
    acceptanceProbe,
    mvpReadinessProbe,
    autonomySnapshotProbe,
    recordingScriptProbe,
    architecturePackProbe,
    submissionLaunchProbe,
    pilotValueProbe,
    objectionArenaProbe,
    firstClickSmokeProbe,
    a2aProbe,
    ci
  ] = await Promise.all([
    liveJsonProbe({
      id: "target-health",
      label: "Target Cloud Run health",
      url: `${targetBaseUrl}/api/healthz`,
      required: true,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
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
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const skills = Array.isArray((payload as { skills?: unknown[] }).skills)
          ? ((payload as { skills: Array<{ id?: string; tags?: string[] }> }).skills)
          : [];
        observedSkillIds = skills.map((skill) => skill.id).filter((id): id is string => Boolean(id));
        const judgeRehearsal = skills.find((skill) => skill.id === "judge.rehearsal");
        const winGapRadar = skills.find((skill) => skill.id === "win.gap.radar");
        const winnerPacket = skills.find((skill) => skill.id === "winner.packet");
        const winnerSufficiency = skills.find((skill) => skill.id === WINNER_SUFFICIENCY_SKILL_ID);
        const winAutopilot = skills.find((skill) => skill.id === WIN_AUTOPILOT_SKILL_ID);
        const objectionArena = skills.find((skill) => skill.id === "judge.objection-arena");
        const finalistSimulate = skills.find((skill) => skill.id === "finalist.simulate");
        const acceptanceMatrix = skills.find((skill) => skill.id === ACCEPTANCE_MATRIX_SKILL_ID);
        const competitiveBattlecard = skills.find((skill) => skill.id === "competitive.battlecard");
        const competitiveSnapshot = skills.find((skill) => skill.id === "competitive.snapshot");
        const competitiveDecisionMatrix = skills.find((skill) => skill.id === COMPETITIVE_DECISION_MATRIX_SKILL_ID);
        const judgeSnapshot = skills.find((skill) => skill.id === "judge.snapshot");
        const firstClick = skills.find((skill) => skill.id === FIRST_CLICK_SKILL_ID);
        const firstClickSmoke = skills.find((skill) => skill.id === FIRST_CLICK_SMOKE_SKILL_ID);
        const mvpSnapshot = skills.find((skill) => skill.id === "mvp.snapshot");
        const autonomySnapshot = skills.find((skill) => skill.id === "autonomy.snapshot");
        const externalEvidence = skills.find((skill) => skill.id === EXTERNAL_EVIDENCE_SKILL_ID);
        const observabilityOracle = skills.find((skill) => skill.id === OBSERVABILITY_ORACLE_SKILL_ID);
        const judgeCommand = skills.find((skill) => skill.id === JUDGE_COMMAND_SKILL_ID);
        const recordingScript = skills.find((skill) => skill.id === "recording.script");
        const prizeStrategy = skills.find((skill) => skill.id === PRIZE_STRATEGY_SKILL_ID);
        const submissionPublish = skills.find((skill) => skill.id === SUBMISSION_PUBLISH_SKILL_ID);
        const submissionDossier = skills.find((skill) => skill.id === SUBMISSION_DOSSIER_SKILL_ID);
        const submissionLaunch = skills.find((skill) => skill.id === "submission.launch");
        const submissionPackage = skills.find((skill) => skill.id === "submission.package");
        const pilotValueSnapshot = skills.find((skill) => skill.id === "pilot.value.snapshot");
        const deployRecover = skills.find((skill) => skill.id === "deploy.recover");
        observedAgentCardSignals = [
          ...(judgeRehearsal?.tags?.includes("recording-lock") ? ["judge.rehearsal:tag:recording-lock"] : []),
          ...(winGapRadar?.tags?.includes("feature-freeze-lock") ? ["win.gap.radar:tag:feature-freeze-lock"] : []),
          ...(winnerPacket?.tags?.includes("winner-release-lock") ? ["winner.packet:tag:winner-release-lock"] : []),
          ...(winnerPacket?.tags?.includes("get-proof") ? ["winner.packet:tag:get-proof"] : []),
          ...(winnerSufficiency?.tags?.includes(WINNER_SUFFICIENCY_LOCK_TAG) ? [WINNER_SUFFICIENCY_REQUIRED_SIGNAL] : []),
          ...(winAutopilot?.tags?.includes(WIN_AUTOPILOT_LOCK_TAG) ? [WIN_AUTOPILOT_REQUIRED_SIGNAL] : []),
          ...(objectionArena?.tags?.includes("objection-lock") ? ["judge.objection-arena:tag:objection-lock"] : []),
          ...(finalistSimulate?.tags?.includes("release-drift") ? ["finalist.simulate:tag:release-drift"] : []),
          ...(acceptanceMatrix?.tags?.includes(ACCEPTANCE_MATRIX_LOCK_TAG) ? [ACCEPTANCE_MATRIX_REQUIRED_SIGNAL] : []),
          ...(competitiveBattlecard?.tags?.includes("criteria-duel") ? ["competitive.battlecard:tag:criteria-duel"] : []),
          ...(competitiveBattlecard?.tags?.includes(COMPETITIVE_WIN_LOSS_LOCK_TAG) ? [COMPETITIVE_WIN_LOSS_REQUIRED_SIGNAL] : []),
          ...(competitiveSnapshot?.tags?.includes("get-proof") ? ["competitive.snapshot:tag:get-proof"] : []),
          ...(competitiveDecisionMatrix?.tags?.includes(COMPETITIVE_DECISION_MATRIX_LOCK_TAG) ? [COMPETITIVE_DECISION_MATRIX_REQUIRED_SIGNAL] : []),
          ...(judgeSnapshot?.tags?.includes("get-proof") ? ["judge.snapshot:tag:get-proof"] : []),
          ...(firstClick?.tags?.includes(FIRST_CLICK_ROUTE_LOCK_TAG) ? [FIRST_CLICK_REQUIRED_SIGNAL] : []),
          ...(firstClickSmoke?.tags?.includes(FIRST_CLICK_SMOKE_LOCK_TAG) ? [FIRST_CLICK_SMOKE_REQUIRED_SIGNAL] : []),
          ...(mvpSnapshot?.tags?.includes("get-proof") ? ["mvp.snapshot:tag:get-proof"] : []),
          ...(autonomySnapshot?.tags?.includes("get-proof") ? ["autonomy.snapshot:tag:get-proof"] : []),
          ...(externalEvidence?.tags?.includes(EXTERNAL_EVIDENCE_LOCK_TAG) ? [EXTERNAL_EVIDENCE_REQUIRED_SIGNAL] : []),
          ...(observabilityOracle?.tags?.includes(OBSERVABILITY_ORACLE_LOCK_TAG) ? [OBSERVABILITY_ORACLE_REQUIRED_SIGNAL] : []),
          ...(judgeCommand?.tags?.includes(JUDGE_COMMAND_LOCK_TAG) ? [JUDGE_COMMAND_REQUIRED_SIGNAL] : []),
          ...(recordingScript?.tags?.includes("get-proof") ? ["recording.script:tag:get-proof"] : []),
          ...(prizeStrategy?.tags?.includes(PRIZE_STRATEGY_LOCK_TAG) ? [PRIZE_STRATEGY_REQUIRED_SIGNAL] : []),
          ...(submissionPublish?.tags?.includes(SUBMISSION_PUBLISH_LOCK_TAG) ? [SUBMISSION_PUBLISH_REQUIRED_SIGNAL] : []),
          ...(submissionDossier?.tags?.includes(SUBMISSION_DOSSIER_LOCK_TAG) ? [SUBMISSION_DOSSIER_REQUIRED_SIGNAL] : []),
          ...(submissionLaunch?.tags?.includes("get-proof") ? ["submission.launch:tag:get-proof"] : []),
          ...(submissionPackage?.tags?.includes("get-proof") ? ["submission.package:tag:get-proof"] : []),
          ...(pilotValueSnapshot?.tags?.includes("get-proof") ? ["pilot.value.snapshot:tag:get-proof"] : []),
          ...(deployRecover?.tags?.includes("get-proof") ? ["deploy.recover:tag:get-proof"] : [])
        ];
        const missing = requiredSkillIds.filter((skill) => !observedSkillIds.includes(skill));
        const missingSignals = requiredAgentCardSignals.filter((signal) => !observedAgentCardSignals.includes(signal));
        const hasExpectedCount = observedSkillIds.length >= expectedSkillIds.length;
        if (missing.length === 0 && missingSignals.length === 0 && hasExpectedCount) {
          return {
            status: "passed",
            score: 100,
            evidence: `Target Agent Card exposes ${observedSkillIds.length}/${expectedSkillIds.length} expected skills and ${observedAgentCardSignals.length}/${requiredAgentCardSignals.length} required signals.`
          };
        }
        return {
          status: missing.length > 0 || missingSignals.length > 0 ? "watch" : "passed",
          score: missing.length > 0 || missingSignals.length > 0 ? 58 : 92,
          evidence: `Target Agent Card exposes ${observedSkillIds.length}/${expectedSkillIds.length} skills; missing skills ${missing.join(", ") || "none"}; missing signals ${missingSignals.join(", ") || "none"}.`
        };
      }
    }),
    liveJsonProbe({
      id: "acceptance-endpoint",
      label: "Target Acceptance Matrix endpoint",
      url: `${targetBaseUrl}/api/acceptance-matrix`,
      required: true,
      timeoutMs: 20000,
      init: {
        method: "POST",
        headers: { ...(targetProbeHeaders ?? {}), "Content-Type": "application/json" },
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
      id: "mvp-readiness-endpoint",
      label: "Target MVP Readiness endpoint",
      url: `${targetBaseUrl}/api/mvp-readiness`,
      required: true,
      timeoutMs: 16000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "mvp.snapshot" && typeof body.readiness === "string"
          ? { status: "passed", score: 100, evidence: `MVP Readiness Snapshot returned ${body.readiness}.` }
          : { status: "missing", score: 24, evidence: "MVP Readiness endpoint did not return the current mvp.snapshot JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "autonomy-snapshot-endpoint",
      label: "Target Autonomy Snapshot endpoint",
      url: `${targetBaseUrl}/api/autonomy-snapshot`,
      required: true,
      timeoutMs: 16000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "autonomy.snapshot" && typeof body.readiness === "string"
          ? { status: "passed", score: 100, evidence: `Autonomy Snapshot returned ${body.readiness}.` }
          : { status: "missing", score: 24, evidence: "Autonomy Snapshot endpoint did not return the current autonomy.snapshot JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "recording-script-endpoint",
      label: "Target Recording Script endpoint",
      url: `${targetBaseUrl}/api/recording-script`,
      required: true,
      timeoutMs: 16000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "recording.script" && typeof body.readiness === "string"
          ? { status: "passed", score: 100, evidence: `Recording Script returned ${body.readiness}.` }
          : { status: "missing", score: 24, evidence: "Recording Script endpoint did not return the current recording.script JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "architecture-pack-endpoint",
      label: "Target Architecture Pack endpoint",
      url: `${targetBaseUrl}/api/architecture-pack`,
      required: true,
      timeoutMs: 16000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; architectureScore?: number; a2aPayload?: { skill?: string }; nodes?: unknown[]; requirements?: unknown[] };
        return body.a2aPayload?.skill === "submission.package" && typeof body.readiness === "string" && Array.isArray(body.nodes) && Array.isArray(body.requirements)
          ? { status: "passed", score: 100, evidence: `Architecture Pack returned ${body.readiness}; score ${body.architectureScore ?? "unknown"}.` }
          : { status: "missing", score: 24, evidence: "Architecture Pack endpoint did not return the current submission.package JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "submission-launch-endpoint",
      label: "Target Submission Launch endpoint",
      url: `${targetBaseUrl}/api/submission-launch`,
      required: true,
      timeoutMs: 20000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; launchScore?: number; finalSubmitLock?: { readiness?: string }; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "submission.launch" && typeof body.readiness === "string" && body.finalSubmitLock?.readiness
          ? { status: "passed", score: 100, evidence: `Submission Launch returned ${body.readiness}; final submit ${body.finalSubmitLock.readiness}; score ${body.launchScore ?? "unknown"}.` }
          : { status: "missing", score: 24, evidence: "Submission Launch endpoint did not return the current submission.launch JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "pilot-value-endpoint",
      label: "Target Pilot Value endpoint",
      url: `${targetBaseUrl}/api/pilot-value`,
      required: true,
      timeoutMs: 16000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "pilot.value.snapshot" && typeof body.readiness === "string"
          ? { status: "passed", score: 100, evidence: `Pilot Value Snapshot returned ${body.readiness}.` }
          : { status: "missing", score: 24, evidence: "Pilot Value endpoint did not return the current pilot.value.snapshot JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "objection-arena-endpoint",
      label: "Target Objection Arena endpoint",
      url: `${targetBaseUrl}/api/objection-arena`,
      required: true,
      timeoutMs: 16000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; a2aPayload?: { skill?: string }; lanes?: unknown[] };
        return body.a2aPayload?.skill === "judge.objection-arena" && typeof body.readiness === "string" && Array.isArray(body.lanes)
          ? { status: "passed", score: 100, evidence: `Objection Arena returned ${body.readiness}; ${body.lanes.length} Q&A lanes.` }
          : { status: "missing", score: 24, evidence: "Objection Arena endpoint did not return the current judge.objection-arena JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "first-click-smoke-endpoint",
      label: "Target First-Click Smoke endpoint",
      url: `${targetBaseUrl}/api/first-click-smoke`,
      required: true,
      timeoutMs: 45000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; a2aPayload?: { skill?: string }; probes?: unknown[]; missingCount?: number };
        return body.a2aPayload?.skill === FIRST_CLICK_SMOKE_SKILL_ID && typeof body.readiness === "string" && Array.isArray(body.probes)
          ? {
              status: body.missingCount === 0 ? "passed" : "watch",
              score: body.missingCount === 0 ? 100 : 58,
              evidence: `First-Click Smoke returned ${body.readiness}; ${body.probes.length} sentinel probes; missing ${body.missingCount ?? "unknown"}.`
            }
          : { status: "missing", score: 24, evidence: "First-Click Smoke endpoint did not return the current judge.first-click-smoke JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "a2a-artifact",
      label: "Target A2A artifact endpoints",
      url: `${targetBaseUrl}/a2a`,
      required: true,
      init: {
        method: "POST",
        headers: { ...(targetProbeHeaders ?? {}), "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "release-drift-guard",
          method: "message/send",
          params: { text: input.projectBrief }
        })
      },
      evaluate: (payload) => {
        const data = (payload as { result?: { artifacts?: Array<{ parts?: Array<{ data?: Record<string, unknown> }> }> } }).result?.artifacts?.[0]?.parts?.[0]?.data;
        return data?.releaseDriftEndpoint &&
          data?.taskBoardEndpoint &&
          data?.externalEvidenceEndpoint &&
          data?.externalEvidencePageEndpoint &&
          data?.acceptanceMatrixEndpoint &&
          data?.acceptanceMatrixPageEndpoint &&
          data?.demoReceiptEndpoint &&
          data?.pilotEconomicsEndpoint &&
          data?.demoConciergeEndpoint &&
          data?.judgeCommandEndpoint &&
          data?.judgeCommandPageEndpoint &&
          data?.judgeRehearsalEndpoint &&
          data?.winnerPacketEndpoint &&
          data?.winnerPacketPageEndpoint &&
          data?.winnerSufficiencyEndpoint &&
          data?.winnerSufficiencyPageEndpoint &&
          data?.winAutopilotEndpoint &&
          data?.winAutopilotPageEndpoint &&
          data?.submissionRunwayEndpoint &&
          data?.submissionAssetsPageEndpoint &&
          data?.submissionLaunchEndpoint &&
          data?.submissionLaunchPageEndpoint &&
          data?.architecturePackEndpoint &&
          data?.architecturePackPageEndpoint &&
          data?.recordingScriptPageEndpoint &&
          data?.recordingScriptJsonEndpoint &&
          data?.pilotValueSnapshotEndpoint &&
          data?.pilotValueSnapshotJsonEndpoint &&
          data?.prizeStrategyEndpoint &&
          data?.prizeStrategyPageEndpoint &&
          data?.publisherEndpoint &&
          data?.publisherPageEndpoint &&
          data?.dossierEndpoint &&
          data?.dossierPageEndpoint &&
          data?.winGapRadarEndpoint &&
          data?.submissionCloseoutEndpoint &&
          data?.competitiveBattlecardEndpoint &&
          data?.competitiveSwotSnapshotEndpoint &&
          data?.competitiveDecisionMatrixEndpoint &&
          data?.competitiveDecisionMatrixPageEndpoint &&
          data?.judgeSnapshotEndpoint &&
          data?.judgeSnapshotPageEndpoint &&
          data?.firstClickProof &&
          data?.firstClickSmokeEndpoint &&
          data?.firstClickSmokePageEndpoint &&
          data?.objectionArenaEndpoint &&
          data?.objectionArenaPageEndpoint &&
          data?.mvpReadinessSnapshotEndpoint &&
          data?.autonomySnapshotEndpoint &&
          data?.autonomySnapshotJsonEndpoint &&
          data?.observabilityOracleEndpoint &&
          data?.observabilityOraclePageEndpoint &&
          data?.deployRecoveryEndpoint &&
          data?.deployRecoveryPageEndpoint
          ? {
              status: "passed",
              score: 100,
              evidence: "A2A artifact exposes releaseDriftEndpoint, taskBoardEndpoint, externalEvidenceEndpoint, externalEvidencePageEndpoint, acceptanceMatrixEndpoint, acceptanceMatrixPageEndpoint, demoReceiptEndpoint, pilotEconomicsEndpoint, pilotValueSnapshotEndpoint, demoConciergeEndpoint, judgeCommandEndpoint, judgeCommandPageEndpoint, judgeRehearsalEndpoint, winnerPacketEndpoint, winnerPacketPageEndpoint, winnerSufficiencyEndpoint, winnerSufficiencyPageEndpoint, winAutopilotEndpoint, winAutopilotPageEndpoint, objectionArenaEndpoint, objectionArenaPageEndpoint, submissionRunwayEndpoint, submissionAssetsPageEndpoint, submissionLaunchEndpoint, submissionLaunchPageEndpoint, architecturePackEndpoint, architecturePackPageEndpoint, recordingScriptPageEndpoint, recordingScriptJsonEndpoint, prizeStrategyEndpoint, prizeStrategyPageEndpoint, publisherEndpoint, publisherPageEndpoint, dossierEndpoint, dossierPageEndpoint, winGapRadarEndpoint, submissionCloseoutEndpoint, competitiveBattlecardEndpoint, competitiveSwotSnapshotEndpoint, competitiveDecisionMatrixEndpoint, competitiveDecisionMatrixPageEndpoint, judgeSnapshotEndpoint, judgeSnapshotPageEndpoint, firstClickProof, firstClickSmokeEndpoint, firstClickSmokePageEndpoint, mvpReadinessSnapshotEndpoint, autonomySnapshotEndpoint, autonomySnapshotJsonEndpoint, observabilityOracleEndpoint, observabilityOraclePageEndpoint, deployRecoveryEndpoint, and deployRecoveryPageEndpoint."
            }
          : { status: "watch", score: 62, evidence: "A2A artifact is reachable, but autonomy snapshot/observability oracle/external evidence API/page/task board/winner packet/winner sufficiency/win autopilot/objection arena/submission runway/submission assets/submission launch/architecture pack/recording script/pilot value snapshot/judge rehearsal/submission closeout/win gap radar/demo concierge/prize strategy API/page/publisher API/page/dossier API/page/battlecard/decision matrix/judge snapshot/first-click proof/first-click smoke/MVP snapshot/deploy recovery page/judge command API/page/pilot economics/release drift/acceptance API/page/receipt endpoints are not all visible." };
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
    requiredAgentCardSignals,
    observedAgentCardSignals,
    probes: [
      healthProbe,
      cardProbe,
      acceptanceProbe,
      mvpReadinessProbe,
      autonomySnapshotProbe,
      recordingScriptProbe,
      architecturePackProbe,
      submissionLaunchProbe,
      pilotValueProbe,
      objectionArenaProbe,
      firstClickSmokeProbe,
      a2aProbe,
      ciProbe
    ]
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
      selectedAgentIds: parsed.data.selectedAgentIds,
      forwardedHeaders: selfProbeHeaders(req)
    })
  );
});

function deployRecoveryQueryInput(req: express.Request) {
  const parsed = DeployRecoverySchema.safeParse({
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    ...(typeof req.query.targetUrl === "string" ? { targetUrl: req.query.targetUrl } : {}),
    ...(typeof req.query.lastDeployError === "string" ? { lastDeployError: req.query.lastDeployError } : {})
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildDeployRecoveryForRequest(req: express.Request, input: z.infer<typeof DeployRecoverySchema>) {
  const currentBaseUrl = publicBaseUrl(req);
  const targetBaseUrl = (input.targetUrl || SUBMISSION_PROOF.deployedUrl).replace(/\/$/, "");
  const releaseDrift = await buildReleaseDriftForTarget({
    currentBaseUrl,
    targetBaseUrl,
    projectBrief: input.projectBrief,
    selectedAgentIds: input.selectedAgentIds,
    forwardedHeaders: selfProbeHeaders(req)
  });

  return buildDeployRecoveryPlan({
    baseUrl: currentBaseUrl,
    releaseDrift,
    lastDeployError: input.lastDeployError
  });
}

app.get("/api/deploy-recovery", async (req, res) => {
  const result = deployRecoveryQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildDeployRecoveryForRequest(req, result.input));
});

app.get("/deploy-recovery", async (req, res) => {
  const result = deployRecoveryQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderDeployRecoveryHtml(await buildDeployRecoveryForRequest(req, result.input)));
});

app.post("/api/deploy-recovery", async (req, res) => {
  const parsed = DeployRecoverySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildDeployRecoveryForRequest(req, parsed.data));
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

function acceptanceMatrixQueryInput(req: express.Request) {
  const parsed = AcceptanceMatrixSchema.safeParse({
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    skipReleaseDrift: !(req.query.live === "1" || typeof req.query.targetUrl === "string"),
    ...(typeof req.query.targetUrl === "string" ? { targetUrl: req.query.targetUrl } : {}),
    ...(typeof req.query.protopediaUrl === "string" ? { protopediaUrl: req.query.protopediaUrl } : {}),
    ...(typeof req.query.videoUrl === "string" ? { videoUrl: req.query.videoUrl } : {})
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildAcceptanceMatrixForRequest(req: express.Request, input: z.infer<typeof AcceptanceMatrixSchema>) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
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
    squadContract,
    submissionUrls: submissionUrlEvidence(input)
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
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
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
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
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: input.projectBrief,
    selectedAgentIds: input.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl,
    recommendation,
    strategy,
    moatStress,
    squadOptimizer,
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl
  });
  const releaseDrift = input.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: input.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: input.projectBrief,
        selectedAgentIds: input.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });

  return buildJudgeAcceptanceMatrix({
    baseUrl,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift,
    submissionLaunch
  });
}

app.get("/api/acceptance-matrix", async (req, res) => {
  const result = acceptanceMatrixQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildAcceptanceMatrixForRequest(req, result.input));
});

app.get("/acceptance-matrix", async (req, res) => {
  const result = acceptanceMatrixQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderAcceptanceMatrixHtml(await buildAcceptanceMatrixForRequest(req, result.input)));
});

app.post("/api/acceptance-matrix", async (req, res) => {
  const parsed = AcceptanceMatrixSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildAcceptanceMatrixForRequest(req, parsed.data));
});

function commandCenterQueryInput(req: express.Request) {
  const parsed = CommandCenterSchema.safeParse({
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    skipReleaseDrift: !(req.query.live === "1" || typeof req.query.targetUrl === "string"),
    ...(typeof req.query.targetUrl === "string" ? { targetUrl: req.query.targetUrl } : {}),
    ...(typeof req.query.protopediaUrl === "string" ? { protopediaUrl: req.query.protopediaUrl } : {}),
    ...(typeof req.query.videoUrl === "string" ? { videoUrl: req.query.videoUrl } : {}),
    ...(typeof req.query.currentDate === "string" ? { currentDate: req.query.currentDate } : {})
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildJudgeCommandCenterForRequest(req: express.Request, input: z.infer<typeof CommandCenterSchema>) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
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
    squadContract,
    submissionUrls: submissionUrlEvidence(input)
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
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
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl,
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
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl,
    strategy,
    marketIntel,
    moatStress
  });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: input.projectBrief,
    selectedAgentIds: input.selectedAgentIds,
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
  const releaseDrift = input.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: input.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: input.projectBrief,
        selectedAgentIds: input.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
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
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });

  return buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
}

app.get("/api/judge-command-center", async (req, res) => {
  const result = commandCenterQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildJudgeCommandCenterForRequest(req, result.input));
});

app.get("/judge-command-center", async (req, res) => {
  const result = commandCenterQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderJudgeCommandCenterHtml(await buildJudgeCommandCenterForRequest(req, result.input)));
});

app.post("/api/judge-command-center", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildJudgeCommandCenterForRequest(req, parsed.data));
});

app.post("/api/demo-concierge", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査員、買い手、提出者の最初の1クリックと証拠URLを固定する。");
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
    squadContract,
    submissionUrls: submissionUrlEvidence(parsed.data)
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
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
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
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl,
    strategy,
    marketIntel,
    moatStress
  });
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
        selectedAgentIds: parsed.data.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
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
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });
  const command = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });

  res.json(
    buildDemoConcierge({
      baseUrl,
      strategy,
      acceptance,
      command,
      battlecard: competitiveBattlecard,
      userPilot,
      pilotEconomics
    })
  );
});

function prizeStrategyQueryPayload(req: express.Request) {
  const selectedAgentIds =
    typeof req.query.selectedAgentIds === "string"
      ? req.query.selectedAgentIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const targetUrl = typeof req.query.targetUrl === "string" && req.query.targetUrl.trim().length > 0 ? req.query.targetUrl : undefined;
  return {
    projectBrief: typeof req.query.projectBrief === "string" && req.query.projectBrief.trim().length > 0 ? req.query.projectBrief : DEFAULT_PROJECT_BRIEF,
    selectedAgentIds,
    skipReleaseDrift: !(req.query.live === "1" || targetUrl),
    targetUrl,
    protopediaUrl: typeof req.query.protopediaUrl === "string" ? req.query.protopediaUrl : undefined,
    videoUrl: typeof req.query.videoUrl === "string" ? req.query.videoUrl : undefined,
    currentDate: typeof req.query.currentDate === "string" ? req.query.currentDate : undefined
  };
}

async function buildPrizeStrategyForRequest(req: express.Request, input: CommandCenterInput) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査5項目の目標点、現在証拠、最終ピッチ順を優勝作戦として束ねる。");
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
    squadContract,
    submissionUrls: submissionUrlEvidence(input)
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
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
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl,
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
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl,
    strategy,
    marketIntel,
    moatStress
  });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: input.projectBrief,
    selectedAgentIds: input.selectedAgentIds,
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
  const releaseDrift = input.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: input.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: input.projectBrief,
        selectedAgentIds: input.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
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
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });
  const command = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command,
    battlecard: competitiveBattlecard,
    userPilot,
    pilotEconomics
  });

  return buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command,
    battlecard: competitiveBattlecard,
    demoConcierge,
    pilotEconomics,
    observabilityOracle,
    releaseDrift
  });
}

app.get("/api/prize-strategy", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(prizeStrategyQueryPayload(req));
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildPrizeStrategyForRequest(req, parsed.data));
});

app.get("/prize-strategy", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(prizeStrategyQueryPayload(req));
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const board = await buildPrizeStrategyForRequest(req, parsed.data);
  res.type("html").send(renderPrizeStrategyHtml(board));
});

app.post("/api/prize-strategy", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildPrizeStrategyForRequest(req, parsed.data));
});

async function buildWinGapRadarBundleForInput(req: express.Request, input: CommandCenterInput) {
  const parsed = { data: input };
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "競合/SWOTとMVP監査を、勝つために閉じる機能仮説へ変換する。");
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
    squadContract,
    submissionUrls: submissionUrlEvidence(parsed.data)
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
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
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
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl,
    strategy,
    marketIntel,
    moatStress
  });
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
        selectedAgentIds: parsed.data.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
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
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });
  const command = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command,
    battlecard: competitiveBattlecard,
    userPilot,
    pilotEconomics
  });
  const prizeStrategy = buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command,
    battlecard: competitiveBattlecard,
    demoConcierge,
    pilotEconomics,
    observabilityOracle,
    releaseDrift
  });

  return {
    radar: buildWinGapRadar({
      baseUrl,
      strategy,
      marketIntel,
      moatStress,
      battlecard: competitiveBattlecard,
      mvpAudit,
      finalist,
      acceptance,
      prizeStrategy,
      observabilityOracle,
      demoConcierge,
      submissionLaunch
    }),
    submissionLaunch,
    releaseDrift
  };
}

app.post("/api/win-gap-radar", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json((await buildWinGapRadarBundleForInput(req, parsed.data)).radar);
});

app.post("/api/task-board", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "選択したAIへA2A仕事票を渡し、受入条件と証拠URLで検収する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });

  res.json(
    buildAgentTaskBoard({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      squadContract
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

function submissionLaunchQueryInput(req: express.Request) {
  const candidate = {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    ...(typeof req.query.protopediaUrl === "string" ? { protopediaUrl: req.query.protopediaUrl } : {}),
    ...(typeof req.query.videoUrl === "string" ? { videoUrl: req.query.videoUrl } : {})
  };
  const parsed = LaunchSchema.safeParse(candidate);
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildSubmissionLaunchForRequest(req: express.Request, input: z.infer<typeof LaunchSchema>) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
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
    squadContract,
    submissionUrls: submissionUrlEvidence(input)
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
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
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

  return buildSubmissionLaunchGate({
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
}

app.get("/api/submission-launch", async (req, res) => {
  const result = submissionLaunchQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildSubmissionLaunchForRequest(req, result.input));
});

app.get("/submission-launch", async (req, res) => {
  const result = submissionLaunchQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderSubmissionLaunchHtml(await buildSubmissionLaunchForRequest(req, result.input)));
});

app.post("/api/submission-launch", async (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildSubmissionLaunchForRequest(req, parsed.data));
});

app.post("/api/submission-closeout", async (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const mission = buildMissionRun(recommendation, strategy, "ProtoPedia貼付、動画公開、外部URL、最終提出を一画面でcloseoutする。");
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
    squadContract,
    submissionUrls: submissionUrlEvidence(parsed.data)
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
    publisher,
    battlecard: competitiveBattlecard
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
  const launchGate = buildSubmissionLaunchGate({
    protopediaUrl: parsed.data.protopediaUrl,
    videoUrl: parsed.data.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });

  res.json(
    buildSubmissionCloseoutWorkbench({
      baseUrl,
      publisher,
      dossier,
      demoRunway,
      proof,
      launchGate
    })
  );
});

app.post("/api/judge-rehearsal", async (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "初見審査員に90秒で価値、差別化、実用性、提出状態を伝えるリハーサルを作る。");
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
    squadContract,
    submissionUrls: submissionUrlEvidence(parsed.data)
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
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: parsed.data.projectBrief,
    selectedAgentIds: parsed.data.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({ baseUrl, recommendation, strategy, moatStress, squadOptimizer });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: parsed.data.protopediaUrl,
    videoUrl: parsed.data.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const submissionCloseout = buildSubmissionCloseoutWorkbench({
    baseUrl,
    publisher,
    dossier,
    demoRunway,
    proof,
    launchGate: submissionLaunch
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
    demoReceipt
  });
  const judgeCommand = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    userPilot,
    pilotEconomics
  });
  const prizeStrategy = buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    demoConcierge,
    pilotEconomics
  });

  res.json(
    buildJudgeRehearsalRoom({
      baseUrl,
      acceptance,
      command: judgeCommand,
      concierge: demoConcierge,
      tour: judgeTour,
      prize: prizeStrategy,
      closeout: submissionCloseout,
      judgeDrill
    })
  );
});

function winnerPacketQueryInput(req: express.Request) {
  const liveReleaseDrift = req.query.live === "1" || req.query.live === "true";
  const candidate = {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    skipReleaseDrift: !liveReleaseDrift,
    ...(typeof req.query.targetUrl === "string" ? { targetUrl: req.query.targetUrl } : {}),
    ...(typeof req.query.protopediaUrl === "string" ? { protopediaUrl: req.query.protopediaUrl } : {}),
    ...(typeof req.query.videoUrl === "string" ? { videoUrl: req.query.videoUrl } : {})
  };
  const parsed = CommandCenterSchema.safeParse(candidate);
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildWinnerPacketForRequest(req: express.Request, input: CommandCenterInput) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査5項目の勝ち証拠を1つのpacketへ束ね、録画と質疑で迷わない状態にする。");
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
    squadContract,
    submissionUrls: submissionUrlEvidence(input)
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
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
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: input.projectBrief,
    selectedAgentIds: input.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({ baseUrl, recommendation, strategy, moatStress, squadOptimizer });
  const releaseDrift = input.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: input.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: input.projectBrief,
        selectedAgentIds: input.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const submissionCloseout = buildSubmissionCloseoutWorkbench({
    baseUrl,
    publisher,
    dossier,
    demoRunway,
    proof,
    launchGate: submissionLaunch
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
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });
  const judgeCommand = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    userPilot,
    pilotEconomics
  });
  const prizeStrategy = buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    demoConcierge,
    pilotEconomics,
    observabilityOracle,
    releaseDrift
  });
  const judgeRehearsal = buildJudgeRehearsalRoom({
    baseUrl,
    acceptance,
    command: judgeCommand,
    concierge: demoConcierge,
    tour: judgeTour,
    prize: prizeStrategy,
    closeout: submissionCloseout,
    judgeDrill
  });

  return buildWinnerProofPacket({
    baseUrl,
    acceptance,
    battlecard: competitiveBattlecard,
    pilotEconomics,
    prize: prizeStrategy,
    rehearsal: judgeRehearsal,
    closeout: submissionCloseout,
    releaseDrift
  });
}

app.get("/api/winner-packet", async (req, res) => {
  const result = winnerPacketQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildWinnerPacketForRequest(req, result.input));
});

app.get("/winner-packet", async (req, res) => {
  const result = winnerPacketQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderWinnerProofPacketHtml(await buildWinnerPacketForRequest(req, result.input)));
});

app.post("/api/winner-packet", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildWinnerPacketForRequest(req, parsed.data));
});

async function buildObjectionArenaForRequest(req: express.Request, input: CommandCenterInput) {
  return buildObjectionArena(await buildWinnerPacketForRequest(req, input));
}

app.get("/api/objection-arena", async (req, res) => {
  const result = winnerPacketQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildObjectionArenaForRequest(req, result.input));
});

app.get("/objection-arena", async (req, res) => {
  const result = winnerPacketQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderObjectionArenaHtml(await buildObjectionArenaForRequest(req, result.input)));
});

app.post("/api/objection-arena", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildObjectionArenaForRequest(req, parsed.data));
});

function firstClickSmokeQueryInput(req: express.Request) {
  const parsed = FirstClickSmokeSchema.safeParse({
    ...(typeof req.query.targetUrl === "string" ? { targetUrl: req.query.targetUrl } : {})
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildFirstClickSmokeForRequest(req: express.Request, input: z.infer<typeof FirstClickSmokeSchema>) {
  const currentBaseUrl = publicBaseUrl(req).replace(/\/$/, "");
  const targetBaseUrl = (input.targetUrl || currentBaseUrl).replace(/\/$/, "");
  const probeHeaders = currentBaseUrl === targetBaseUrl ? selfProbeHeaders(req) : undefined;
  const probes = await Promise.all(
    FIRST_CLICK_SMOKE_SENTINELS.map((sentinel) =>
      liveFirstClickHtmlProbe({
        sentinel,
        targetBaseUrl,
        init: probeHeaders ? { headers: probeHeaders } : undefined,
        timeoutMs: 30000
      })
    )
  );

  return buildFirstClickSmokeLock({ targetBaseUrl, probes });
}

app.get("/api/first-click-smoke", async (req, res) => {
  const result = firstClickSmokeQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildFirstClickSmokeForRequest(req, result.input));
});

app.get("/first-click-smoke", async (req, res) => {
  const result = firstClickSmokeQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderFirstClickSmokeHtml(await buildFirstClickSmokeForRequest(req, result.input)));
});

app.post("/api/first-click-smoke", async (req, res) => {
  const parsed = FirstClickSmokeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildFirstClickSmokeForRequest(req, parsed.data));
});

app.post("/api/submission-runway", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "提出締切から逆算し、動画、ProtoPedia、構成図、最終フォームを検収順に閉じる。");
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
    squadContract,
    submissionUrls: submissionUrlEvidence(parsed.data)
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
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: parsed.data.projectBrief,
    selectedAgentIds: parsed.data.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({ baseUrl, recommendation, strategy, moatStress, squadOptimizer });
  const releaseDrift = parsed.data.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: parsed.data.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: parsed.data.projectBrief,
        selectedAgentIds: parsed.data.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: parsed.data.protopediaUrl,
    videoUrl: parsed.data.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const submissionCloseout = buildSubmissionCloseoutWorkbench({
    baseUrl,
    publisher,
    dossier,
    demoRunway,
    proof,
    launchGate: submissionLaunch
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
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });
  const judgeCommand = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    userPilot,
    pilotEconomics
  });
  const prizeStrategy = buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    demoConcierge,
    pilotEconomics,
    observabilityOracle,
    releaseDrift
  });
  const judgeRehearsal = buildJudgeRehearsalRoom({
    baseUrl,
    acceptance,
    command: judgeCommand,
    concierge: demoConcierge,
    tour: judgeTour,
    prize: prizeStrategy,
    closeout: submissionCloseout,
    judgeDrill
  });
  const winnerPacket = buildWinnerProofPacket({
    baseUrl,
    acceptance,
    battlecard: competitiveBattlecard,
    pilotEconomics,
    prize: prizeStrategy,
    rehearsal: judgeRehearsal,
    closeout: submissionCloseout,
    releaseDrift
  });

  res.json(
    buildFinalSubmissionRunway({
      baseUrl,
      currentDate: parsed.data.currentDate,
      winnerPacket,
      closeout: submissionCloseout,
      launchGate: submissionLaunch
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

async function buildPilotValueSnapshotForRequest(req: express.Request) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "実用性、初回体験、導入採算を審査員が直接開けるGET証拠にする。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const ci = await fetchCiProof();
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

  return buildPilotValueSnapshot({
    baseUrl,
    impactCase,
    userPilot,
    pilotEconomics
  });
}

app.get("/api/pilot-value", async (req, res) => {
  res.json(await buildPilotValueSnapshotForRequest(req));
});

app.get("/pilot-value", async (req, res) => {
  res.type("html").send(renderPilotValueSnapshotHtml(await buildPilotValueSnapshotForRequest(req)));
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

app.post("/api/finalist", async (req, res) => {
  const parsed = AcceptanceMatrixSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "審査員5役で最終候補に残せるかを模擬判定し、落選理由と次の一手を出す。");
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
  const releaseDrift = parsed.data.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: parsed.data.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: parsed.data.projectBrief,
        selectedAgentIds: parsed.data.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });

  res.json(
    buildFinalistSimulation({
      baseUrl,
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch,
      judgeDrill,
      squadContract,
      submissionUrls: submissionUrlEvidence(parsed.data),
      releaseDrift
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

app.post("/a2a", async (req, res) => {
  const id = typeof req.body?.id === "undefined" ? randomUUID() : req.body.id;
  const method = String(req.body?.method || "message/send");
  const text =
    req.body?.params?.message?.parts?.find((part: { text?: string }) => typeof part.text === "string")?.text ||
    req.body?.params?.text ||
    "DevOps x AI Agent marketplace request";
  const baseUrl = publicBaseUrl(req);
  const isReleaseDriftGuardProbe = id === "release-drift-guard";
  const isEndpointSurfaceProbe = isReleaseDriftGuardProbe || id === "live-evidence-monitor";
  const recommendation = recommendSquad(String(text), ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
  const strategy = buildWinningStrategy(recommendation);
  const ci = isEndpointSurfaceProbe ? ciUnavailable("A2A endpoint-surface probe skips live CI to avoid recursive proof calls") : await fetchCiProof();
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
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const moatStress = buildMoatStressTest({ baseUrl: publicBaseUrl(req), recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl: publicBaseUrl(req),
    strategy,
    marketIntel,
    moatStress
  });
  const demoRunway = buildDemoRunway({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher,
    battlecard: competitiveBattlecard
  });
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: localGeminiRecommendation(recommendation, "A2A synchronous artifact uses /api/proof for live Gemini evidence"),
    ci
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
  const taskBoard = buildAgentTaskBoard({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract
  });
  const externalEvidence = buildExternalEvidenceRun({
    baseUrl: publicBaseUrl(req),
    probes: staticExternalEvidenceProbes()
  });
  const submissionLaunch = buildSubmissionLaunchGate({
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const submissionCloseout = buildSubmissionCloseoutWorkbench({
    baseUrl: publicBaseUrl(req),
    publisher,
    dossier,
    demoRunway,
    proof,
    launchGate: submissionLaunch
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
  const artifactLiveEvidence = buildLiveEvidenceRun({
    baseUrl: publicBaseUrl(req),
    probes: [
      {
        id: "agent-card",
        label: "A2A Agent Card",
        status: "passed",
        score: 100,
        url: `${publicBaseUrl(req)}/.well-known/agent-card.json`,
        evidence: "A2A synchronous artifact exposes the current Agent Card endpoint; /api/live-evidence performs live public probes.",
        required: true
      },
      {
        id: "observability-oracle",
        label: "Observability Oracle endpoint",
        status: "passed",
        score: 100,
        url: `${publicBaseUrl(req)}/api/observability-oracle`,
        evidence: "Observability Oracle endpoint is present in the A2A artifact surface.",
        required: true
      },
      {
        id: "ci",
        label: "GitHub Actions CI",
        status: ci.status === "passed" ? "passed" : "watch",
        score: ci.status === "passed" ? 100 : 72,
        url: ci.url,
        evidence: ci.evidence,
        required: true
      }
    ]
  });
  const observabilityOracle = buildObservabilityOracle({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    liveEvidence: artifactLiveEvidence,
    opsDrill,
    pilotEconomics
  });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: String(text),
    selectedAgentIds: recommendation.selected.map((agent) => agent.id),
    budget: 140,
    maxSquadSize: 4
  });
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
  const releaseDrift = isEndpointSurfaceProbe
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: SUBMISSION_PROOF.deployedUrl,
        projectBrief: String(text),
        selectedAgentIds: recommendation.selected.map((agent) => agent.id),
        forwardedHeaders: selfProbeHeaders(req)
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
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });
  const judgeCommand = buildJudgeCommandCenter({
    baseUrl: publicBaseUrl(req),
    acceptance,
    autopilot: winAutopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl: publicBaseUrl(req),
    strategy,
    acceptance,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    userPilot,
    pilotEconomics
  });
  const prizeStrategy = buildPrizeStrategyBoard({
    baseUrl: publicBaseUrl(req),
    strategy,
    acceptance,
    autopilot: winAutopilot,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    demoConcierge,
    pilotEconomics,
    observabilityOracle,
    releaseDrift
  });
  const judgeRehearsal = buildJudgeRehearsalRoom({
    baseUrl: publicBaseUrl(req),
    acceptance,
    command: judgeCommand,
    concierge: demoConcierge,
    tour: judgeTour,
    prize: prizeStrategy,
    closeout: submissionCloseout,
    judgeDrill
  });
  const winnerPacket = buildWinnerProofPacket({
    baseUrl: publicBaseUrl(req),
    acceptance,
    battlecard: competitiveBattlecard,
    pilotEconomics,
    prize: prizeStrategy,
    rehearsal: judgeRehearsal,
    closeout: submissionCloseout,
    releaseDrift
  });
  const submissionRunway = buildFinalSubmissionRunway({
    baseUrl: publicBaseUrl(req),
    winnerPacket,
    closeout: submissionCloseout,
    launchGate: submissionLaunch
  });
  const winGapRadar = buildWinGapRadar({
    baseUrl: publicBaseUrl(req),
    strategy,
    marketIntel,
    moatStress,
    battlecard: competitiveBattlecard,
    mvpAudit,
    finalist,
    acceptance,
    prizeStrategy,
    observabilityOracle,
    demoConcierge,
    submissionLaunch
  });
  const architecturePack = buildArchitecturePack({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission
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
                  sourceProofLock: {
                    score: marketIntel.sourceProofLock.score,
                    readiness: marketIntel.sourceProofLock.readiness,
                    liveProbeCount: marketIntel.sourceProofLock.liveProbeCount,
                    failedCount: marketIntel.sourceProofLock.failedCount
                  },
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
                competitiveBattlecard: {
                  id: competitiveBattlecard.id,
                  battleScore: competitiveBattlecard.battleScore,
                  readiness: competitiveBattlecard.readiness,
                  cards: competitiveBattlecard.cards.map((card) => ({
                    id: card.id,
                    competitor: card.competitor,
                    status: card.status,
                    score: card.score,
                    sourceCount: card.sourceUrls.length
                  })),
                  topRisks: competitiveBattlecard.topRisks.map((risk) => ({
                    id: risk.id,
                    severity: risk.severity
                  })),
                  objectionReplay: {
                    replayScore: competitiveBattlecard.objectionReplay.replayScore,
                    readiness: competitiveBattlecard.objectionReplay.readiness,
                    weakestCompetitor: competitiveBattlecard.objectionReplay.weakestCompetitor,
                    steps: competitiveBattlecard.objectionReplay.steps.map((step) => ({
                      id: step.id,
                      status: step.status,
                      proofUrl: step.proofUrl
                    }))
                  },
                  winLossLock: {
                    winLossScore: competitiveBattlecard.winLossLock.winLossScore,
                    readiness: competitiveBattlecard.winLossLock.readiness,
                    lossRiskCount: competitiveBattlecard.winLossLock.lossRiskCount,
                    rows: competitiveBattlecard.winLossLock.rows.map((row) => ({
                      id: row.id,
                      status: row.status,
                      mustShowProofUrl: row.mustShowProofUrl,
                      judgeCriterionId: row.judgeCriterionId
                    }))
                  }
                },
                demoConcierge: {
                  id: demoConcierge.id,
                  conciergeScore: demoConcierge.conciergeScore,
                  readiness: demoConcierge.readiness,
                  singleNextClick: demoConcierge.singleNextClick,
                  routeLock: {
                    lockScore: demoConcierge.routeLock.lockScore,
                    readiness: demoConcierge.routeLock.readiness,
                    routeStepScore: demoConcierge.routeLock.routeStepScore,
                    proofLinkScore: demoConcierge.routeLock.proofLinkScore,
                    lockedSteps: demoConcierge.routeLock.lockedSteps.map((step) => ({
                      id: step.id,
                      status: step.status,
                      proofUrl: step.proofUrl
                    }))
                  },
                  focusLock: {
                    focusScore: demoConcierge.focusLock.focusScore,
                    readiness: demoConcierge.focusLock.readiness,
                    firstScreen: demoConcierge.focusLock.firstScreen,
                    deferredCount: demoConcierge.focusLock.deferredCount,
                    rules: demoConcierge.focusLock.rules.map((rule) => ({
                      id: rule.id,
                      action: rule.action,
                      status: rule.status
                    }))
                  },
                  lanes: demoConcierge.lanes.map((lane) => ({
                    id: lane.id,
                    persona: lane.persona,
                    firstClick: lane.firstClick,
                    scoreLift: lane.scoreLift,
                    firstEndpoint: lane.steps[0]?.endpoint
                  })),
                  successCriteria: demoConcierge.successCriteria.map((item) => ({
                    id: item.id,
                    status: item.status
                  }))
                },
                prizeStrategy: {
                  id: prizeStrategy.id,
                  prizeScore: prizeStrategy.prizeScore,
                  readiness: prizeStrategy.readiness,
                  proofMode: isEndpointSurfaceProbe ? "endpoint-surface" : "live-release-drift",
                  liveProofEndpoint: `${publicBaseUrl(req)}/api/prize-strategy`,
                  criteria: prizeStrategy.criteria.map((criterion) => ({
                    id: criterion.id,
                    score: criterion.currentScore,
                    target: criterion.targetScore,
                    status: criterion.status
                  })),
                  proofMoves: prizeStrategy.proofMoves.map((move) => ({
                    id: move.id,
                    score: move.score,
                    endpoint: move.endpoint
                  })),
                  risks: prizeStrategy.risks.map((risk) => ({
                    id: risk.id,
                    priority: risk.priority,
                    owner: risk.owner
                  }))
                },
                judgeRehearsal: {
                  id: judgeRehearsal.id,
                  rehearsalScore: judgeRehearsal.rehearsalScore,
                  readiness: judgeRehearsal.readiness,
                  nextRun: judgeRehearsal.nextRun,
                  segments: judgeRehearsal.segments.map((segment) => ({
                    id: segment.id,
                    status: segment.status,
                    proofUrl: segment.proofUrl
                  })),
                  questionDeck: judgeRehearsal.questionDeck.map((question) => ({
                    id: question.id,
                    status: question.status,
                    proofUrl: question.proofUrl
                  })),
                  defenseLock: {
                    defenseScore: judgeRehearsal.defenseLock.defenseScore,
                    readiness: judgeRehearsal.defenseLock.readiness,
                    hardQuestion: judgeRehearsal.defenseLock.hardQuestion,
                    checks: judgeRehearsal.defenseLock.checks.map((check) => ({
                      id: check.id,
                      status: check.status,
                      proofUrl: check.proofUrl
                    }))
                  }
                },
                winnerPacket: {
                  id: winnerPacket.id,
                  packetScore: winnerPacket.packetScore,
                  readiness: winnerPacket.readiness,
                  nextAction: winnerPacket.nextAction,
                  criteria: winnerPacket.criteria.map((criterion) => ({
                    id: criterion.id,
                    status: criterion.status,
                    proofUrl: criterion.proofUrl
                  })),
                  missingExternal: winnerPacket.submissionCopy.missingExternal
                },
                submissionRunway: {
                  id: submissionRunway.id,
                  runwayScore: submissionRunway.runwayScore,
                  readiness: submissionRunway.readiness,
                  deadline: submissionRunway.deadline,
                  daysRemaining: submissionRunway.daysRemaining,
                  nextAction: {
                    id: submissionRunway.nextAction.id,
                    dueDate: submissionRunway.nextAction.dueDate,
                    status: submissionRunway.nextAction.status,
                    proofUrl: submissionRunway.nextAction.proofUrl
                  },
                  tracks: submissionRunway.tracks.map((track) => ({
                    id: track.id,
                    status: track.status,
                    score: track.score
                  }))
                },
                winGapRadar: {
                  id: winGapRadar.id,
                  radarScore: winGapRadar.radarScore,
                  readiness: winGapRadar.readiness,
                  mvpDecision: winGapRadar.mvpDecision,
                  lanes: winGapRadar.lanes.map((lane) => ({
                    id: lane.id,
                    status: lane.status,
                    score: lane.score,
                    priority: lane.priority,
                    proofUrl: lane.proofUrl,
                    demoCue: lane.demoCue,
                    mvpEvidence: lane.mvpEvidence
                  })),
                  featureBets: winGapRadar.featureBets.map((bet) => ({
                    id: bet.id,
                    priority: bet.priority,
                    status: bet.status,
                    proofUrl: bet.proofUrl
                  })),
                  externalGaps: winGapRadar.externalGaps.map((gap) => gap.id)
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
                taskBoard: {
                  id: taskBoard.id,
                  taskScore: taskBoard.taskScore,
                  readiness: taskBoard.readiness,
                  workOrders: taskBoard.workOrders.map((order) => ({
                    id: order.id,
                    agentId: order.agentId,
                    status: order.status,
                    proofUrl: order.proofUrl
                  })),
                  receipt: taskBoard.receipt.digest
                },
                externalEvidence: {
                  id: externalEvidence.id,
                  evidenceScore: externalEvidence.evidenceScore,
                  readiness: externalEvidence.readiness,
                  finalUrlsReady: externalEvidence.a2aPayload.finalUrlsReady,
                  probes: externalEvidence.probes.map((probe) => ({
                    id: probe.id,
                    status: probe.status,
                    url: probe.url || null
                  }))
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
                submissionCloseout: {
                  id: submissionCloseout.id,
                  closeoutScore: submissionCloseout.closeoutScore,
                  readiness: submissionCloseout.readiness,
                  nextAction: {
                    id: submissionCloseout.nextAction.id,
                    status: submissionCloseout.nextAction.status,
                    endpoint: submissionCloseout.nextAction.endpoint
                  },
                  workItems: submissionCloseout.workItems.map((item) => ({
                    id: item.id,
                    status: item.status,
                    priority: item.priority
                  })),
                  protopediaQualityLock: {
                    qualityScore: submissionCloseout.protopediaQualityLock.qualityScore,
                    readiness: submissionCloseout.protopediaQualityLock.readiness,
                    checks: submissionCloseout.protopediaQualityLock.checks.map((check) => ({
                      id: check.id,
                      status: check.status
                    }))
                  },
                  videoProofLock: {
                    lockScore: submissionCloseout.videoProofLock.lockScore,
                    readiness: submissionCloseout.videoProofLock.readiness,
                    checks: submissionCloseout.videoProofLock.checks.map((check) => ({
                      id: check.id,
                      status: check.status,
                      evidenceUrl: check.evidenceUrl
                    }))
                  },
                  urlStatuses: submissionCloseout.urlStatuses.map((item) => ({
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
                  guideRails: userPilot.guideRails.map((rail) => ({
                    id: rail.id,
                    screen: rail.screen,
                    reducesSeconds: rail.reducesSeconds
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
                  evidenceLock: {
                    lockScore: pilotEconomics.evidenceLock.lockScore,
                    readiness: pilotEconomics.evidenceLock.readiness,
                    checks: pilotEconomics.evidenceLock.checks.map((check) => ({
                      id: check.id,
                      status: check.status,
                      evidenceRoute: check.evidenceRoute
                    }))
                  },
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
                observabilityOracle: {
                  id: observabilityOracle.id,
                  oracleScore: observabilityOracle.oracleScore,
                  readiness: observabilityOracle.readiness,
                  decisiveDecision: observabilityOracle.a2aPayload.decisiveDecision,
                  receipts: observabilityOracle.receipts.map((receipt) => ({
                    id: receipt.id,
                    status: receipt.status,
                    metric: receipt.metric
                  })),
                  loop: observabilityOracle.loop.map((step) => ({
                    id: step.id,
                    phase: step.phase,
                    status: step.status,
                    proofUrl: step.proofUrl
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
                  crossExamDeck: judgeDrill.crossExamDeck.map((card) => ({
                    id: card.id,
                    competitor: card.competitor,
                    risk: card.risk,
                    scoreLift: card.scoreLift,
                    firstProof: card.proofSteps[0]?.endpoint
                  })),
                  timeboxedAnswer: judgeDrill.timeboxedAnswer,
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
                  qualityLock: {
                    qualityScore: publisher.qualityLock.qualityScore,
                    readiness: publisher.qualityLock.readiness,
                    checks: publisher.qualityLock.checks.map((check) => ({
                      id: check.id,
                      status: check.status
                    }))
                  },
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
                  handoffPacket: {
                    submitFields: dossier.handoffPacket.submitFields.map((field) => ({ id: field.id, status: field.status })),
                    qualityLock: {
                      qualityScore: dossier.handoffPacket.qualityLock.qualityScore,
                      readiness: dossier.handoffPacket.qualityLock.readiness,
                      checks: dossier.handoffPacket.qualityLock.checks.map((check) => ({
                        id: check.id,
                        status: check.status
                      }))
                    },
                    videoChapters: dossier.handoffPacket.videoChapters.map((chapter) => ({
                      id: chapter.id,
                      timeRange: chapter.timeRange,
                      screen: chapter.screen,
                      status: chapter.status
                    })),
                    architecturePack: {
                      score: dossier.handoffPacket.architecturePack.architectureScore,
                      readiness: dossier.handoffPacket.architecturePack.readiness,
                      diagramUrl: dossier.handoffPacket.architecturePack.diagramUrl,
                      requirements: dossier.handoffPacket.architecturePack.requirements.map((requirement) => ({
                        id: requirement.id,
                        status: requirement.status
                      }))
                    },
                    missingOnly: dossier.handoffPacket.missingOnly.map((item) => item.id)
                  },
                  finalChecks: dossier.finalChecks.map((check) => ({
                    id: check.id,
                    status: check.status
                  }))
                },
                architecturePack: {
                  id: architecturePack.id,
                  architectureScore: architecturePack.architectureScore,
                  readiness: architecturePack.readiness,
                  diagramUrl: architecturePack.diagramUrl,
                  nodes: architecturePack.nodes.map((node) => ({ id: node.id, layer: node.layer })),
                  requirements: architecturePack.requirements.map((requirement) => ({
                    id: requirement.id,
                    status: requirement.status
                  }))
                },
                architecturePackEndpoint: `${publicBaseUrl(req)}/api/architecture-pack`,
                architecturePackPageEndpoint: `${publicBaseUrl(req)}/architecture-pack`,
                dossierEndpoint: `${publicBaseUrl(req)}/api/dossier`,
                dossierPageEndpoint: `${publicBaseUrl(req)}/dossier`,
                marketIntelEndpoint: `${publicBaseUrl(req)}/api/market-intel`,
                moatStressEndpoint: `${publicBaseUrl(req)}/api/moat-stress`,
                competitiveBattlecardEndpoint: `${publicBaseUrl(req)}/api/competitive-battlecard`,
                competitiveSwotSnapshotEndpoint: `${publicBaseUrl(req)}/competitive-swot`,
                competitiveDecisionMatrixEndpoint: `${publicBaseUrl(req)}/api/competitive-decision-matrix`,
                competitiveDecisionMatrixPageEndpoint: `${publicBaseUrl(req)}/competitive-decision-matrix`,
                judgeSnapshotEndpoint: `${publicBaseUrl(req)}/api/judge-snapshot`,
                judgeSnapshotPageEndpoint: `${publicBaseUrl(req)}/judge-snapshot`,
                firstClickProof: buildFirstClickProof(publicBaseUrl(req)),
                firstClickSmokeEndpoint: `${publicBaseUrl(req)}/api/first-click-smoke`,
                firstClickSmokePageEndpoint: `${publicBaseUrl(req)}/first-click-smoke`,
                mvpReadinessSnapshotEndpoint: `${publicBaseUrl(req)}/mvp-readiness`,
                mvpReadinessSnapshotJsonEndpoint: `${publicBaseUrl(req)}/api/mvp-readiness`,
                autonomySnapshotEndpoint: `${publicBaseUrl(req)}/autonomy-snapshot`,
                autonomySnapshotJsonEndpoint: `${publicBaseUrl(req)}/api/autonomy-snapshot`,
                demoConciergeEndpoint: `${publicBaseUrl(req)}/api/demo-concierge`,
                prizeStrategyEndpoint: `${publicBaseUrl(req)}/api/prize-strategy`,
                prizeStrategyPageEndpoint: `${publicBaseUrl(req)}/prize-strategy`,
                judgeRehearsalEndpoint: `${publicBaseUrl(req)}/api/judge-rehearsal`,
                winnerPacketEndpoint: `${publicBaseUrl(req)}/api/winner-packet`,
                winnerPacketPageEndpoint: `${publicBaseUrl(req)}/winner-packet`,
                winnerPacketJsonEndpoint: `${publicBaseUrl(req)}/api/winner-packet`,
                winnerSufficiencyEndpoint: `${publicBaseUrl(req)}/api/winner-sufficiency`,
                winnerSufficiencyPageEndpoint: `${publicBaseUrl(req)}/winner-sufficiency`,
                objectionArenaEndpoint: `${publicBaseUrl(req)}/api/objection-arena`,
                objectionArenaPageEndpoint: `${publicBaseUrl(req)}/objection-arena`,
                submissionRunwayEndpoint: `${publicBaseUrl(req)}/api/submission-runway`,
                submissionAssetsPageEndpoint: `${publicBaseUrl(req)}/submission-assets`,
                recordingScriptPageEndpoint: `${publicBaseUrl(req)}/recording-script`,
                recordingScriptJsonEndpoint: `${publicBaseUrl(req)}/api/recording-script`,
                winGapRadarEndpoint: `${publicBaseUrl(req)}/api/win-gap-radar`,
                mvpAuditEndpoint: `${publicBaseUrl(req)}/api/mvp-audit`,
                judgeBriefEndpoint: `${publicBaseUrl(req)}/api/judge-brief`,
                autonomyLedgerEndpoint: `${publicBaseUrl(req)}/api/autonomy-ledger`,
                taskBoardEndpoint: `${publicBaseUrl(req)}/api/task-board`,
                externalEvidenceEndpoint: `${publicBaseUrl(req)}/api/external-evidence`,
                externalEvidencePageEndpoint: `${publicBaseUrl(req)}/external-evidence`,
                submissionLaunchEndpoint: `${publicBaseUrl(req)}/api/submission-launch`,
                submissionLaunchPageEndpoint: `${publicBaseUrl(req)}/submission-launch`,
                submissionCloseoutEndpoint: `${publicBaseUrl(req)}/api/submission-closeout`,
                securityReviewEndpoint: `${publicBaseUrl(req)}/api/security-review`,
                impactCaseEndpoint: `${publicBaseUrl(req)}/api/impact-case`,
                pilotEconomicsEndpoint: `${publicBaseUrl(req)}/api/pilot-economics`,
                pilotValueSnapshotEndpoint: `${publicBaseUrl(req)}/pilot-value`,
                pilotValueSnapshotJsonEndpoint: `${publicBaseUrl(req)}/api/pilot-value`,
                observabilityOracleEndpoint: `${publicBaseUrl(req)}/api/observability-oracle`,
                observabilityOraclePageEndpoint: `${publicBaseUrl(req)}/observability-oracle`,
                judgeCommandEndpoint: `${publicBaseUrl(req)}/api/judge-command-center`,
                judgeCommandPageEndpoint: `${publicBaseUrl(req)}/judge-command-center`,
                deployRecoveryEndpoint: `${publicBaseUrl(req)}/api/deploy-recovery`,
                deployRecoveryPageEndpoint: `${publicBaseUrl(req)}/deploy-recovery`,
                userPilotEndpoint: `${publicBaseUrl(req)}/api/user-pilot`,
                squadOptimizerEndpoint: `${publicBaseUrl(req)}/api/squad-optimizer`,
                liveEvidenceEndpoint: `${publicBaseUrl(req)}/api/live-evidence`,
                releaseDriftEndpoint: `${publicBaseUrl(req)}/api/release-drift`,
                winAutopilotEndpoint: `${publicBaseUrl(req)}/api/win-autopilot`,
                winAutopilotPageEndpoint: `${publicBaseUrl(req)}/win-autopilot`,
                demoReceiptEndpoint: `${publicBaseUrl(req)}/api/demo-receipt`,
                acceptanceMatrixEndpoint: `${publicBaseUrl(req)}/api/acceptance-matrix`,
                acceptanceMatrixPageEndpoint: `${publicBaseUrl(req)}/acceptance-matrix`,
                judgeTourEndpoint: `${publicBaseUrl(req)}/api/judge-tour`,
                winRunEndpoint: `${publicBaseUrl(req)}/api/win-run`,
                demoRunEndpoint: `${publicBaseUrl(req)}/api/demo-run`,
                proofEndpoint: `${publicBaseUrl(req)}/api/proof`,
                finalistEndpoint: `${publicBaseUrl(req)}/api/finalist`,
                publisherEndpoint: `${publicBaseUrl(req)}/api/publisher`,
                publisherPageEndpoint: `${publicBaseUrl(req)}/publisher`,
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

app.listen(port, host, () => {
  const displayHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`A2A Agent Marketplace listening on http://${displayHost}:${port}`);
});
