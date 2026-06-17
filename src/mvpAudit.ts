import type { WinningAutopilotRun } from "./autopilot.js";
import type { SubmissionDossier } from "./dossier.js";
import type { FinalistSimulation } from "./finalist.js";
import type { MarketIntelReport } from "./marketIntel.js";
import type { MissionRun } from "./mission.js";
import type { OpsDrill } from "./ops.js";
import type { JudgeProof } from "./proof.js";
import { hasSubmissionUrl, SUBMISSION_PROOF } from "./submission.js";
import type { WinningStrategy } from "./strategy.js";
import type { Recommendation } from "./types.js";

export type MvpAuditBand = "submission-ready" | "mvp-with-external-gaps" | "not-mvp";
export type MvpGateStatus = "pass" | "watch" | "fail";
export type MvpGateCategory = "mandatory" | "ai" | "devops" | "judging" | "submission";

export type MvpAuditGate = {
  id: string;
  label: string;
  category: MvpGateCategory;
  status: MvpGateStatus;
  score: number;
  evidence: string;
  nextAction: string;
  url?: string;
};

export type MvpJudgeLane = {
  id: string;
  label: string;
  score: number;
  status: MvpGateStatus;
  evidence: string;
  nextAction: string;
};

export type MvpAuditAction = {
  id: string;
  label: string;
  priority: "now" | "next" | "later";
  owner: string;
  action: string;
  proof: string;
};

export type MvpAuditReport = {
  id: string;
  mvpScore: number;
  band: MvpAuditBand;
  verdict: string;
  hardTruth: string;
  gates: MvpAuditGate[];
  judgeLanes: MvpJudgeLane[];
  blockers: MvpAuditAction[];
  nextActions: MvpAuditAction[];
  proofUrls: Array<{ id: string; label: string; url: string }>;
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statusFromScore(score: number): MvpGateStatus {
  if (score >= 82) return "pass";
  if (score >= 58) return "watch";
  return "fail";
}

function gate(input: {
  id: string;
  label: string;
  category: MvpGateCategory;
  score: number;
  evidence: string;
  nextAction: string;
  url?: string;
  forcedStatus?: MvpGateStatus;
}): MvpAuditGate {
  const score = Math.round(clamp(input.score));
  return {
    id: input.id,
    label: input.label,
    category: input.category,
    status: input.forcedStatus ?? statusFromScore(score),
    score,
    evidence: input.evidence,
    nextAction: input.nextAction,
    url: input.url
  };
}

function actionFromGate(gateItem: MvpAuditGate): MvpAuditAction {
  const external = gateItem.id === "protopedia-url" || gateItem.id === "video-url";
  return {
    id: gateItem.id,
    label: gateItem.label,
    priority: gateItem.status === "fail" || external ? "now" : "next",
    owner: external ? "Submission owner" : gateItem.category === "devops" ? "Cloud Run SRE" : "A2A Market Broker",
    action: gateItem.nextAction,
    proof: gateItem.evidence
  };
}

function uniqueActions(actions: MvpAuditAction[]) {
  const seen = new Set<string>();
  return actions.filter((action) => {
    if (seen.has(action.id)) return false;
    seen.add(action.id);
    return true;
  });
}

function laneStatus(score: number): MvpGateStatus {
  if (score >= 80) return "pass";
  if (score >= 68) return "watch";
  return "fail";
}

function bandFrom(input: { score: number; gates: MvpAuditGate[]; blockers: MvpAuditAction[] }): MvpAuditBand {
  if (input.gates.some((item) => item.status === "fail")) return "not-mvp";
  const nonExternalWatch = input.gates.some((item) => item.status === "watch" && item.id !== "protopedia-url" && item.id !== "video-url");
  if (input.score >= 88 && input.blockers.length === 0 && !nonExternalWatch) return "submission-ready";
  return "mvp-with-external-gaps";
}

export function buildMvpAudit(input: {
  baseUrl: string;
  recommendation: Recommendation;
  strategy: WinningStrategy;
  mission: MissionRun;
  opsDrill: OpsDrill;
  finalist: FinalistSimulation;
  autopilot: WinningAutopilotRun;
  dossier: SubmissionDossier;
  proof: JudgeProof;
  marketIntel: MarketIntelReport;
}): MvpAuditReport {
  const { baseUrl, recommendation, strategy, mission, opsDrill, finalist, autopilot, dossier, proof, marketIntel } = input;
  const selectedAgentIds = new Set(recommendation.selected.map((agent) => agent.id));
  const swotCount = Object.values(strategy.swot).reduce((sum, items) => sum + items.length, 0);
  const hasAllSwotQuadrants = Object.values(strategy.swot).every((items) => items.length > 0);
  const hasGeminiAgent = selectedAgentIds.has("gemini-strategist");
  const hasA2aBroker = selectedAgentIds.has("market-broker");
  const externalVideoReady = hasSubmissionUrl(SUBMISSION_PROOF.videoUrl);
  const externalProtoPediaReady = hasSubmissionUrl(SUBMISSION_PROOF.protopediaUrl);
  const base = baseUrl.replace(/\/$/, "");

  const gates: MvpAuditGate[] = [
    gate({
      id: "cloud-run-runtime",
      label: "必須技術: Cloud Run",
      category: "mandatory",
      score: proof.scores.cloudRun,
      evidence: `${SUBMISSION_PROOF.deployedUrl} をCloud Runで公開し、/api/healthzで稼働確認できる。`,
      nextAction: "提出フォームへデプロイ済みURLを貼る",
      url: SUBMISSION_PROOF.deployedUrl
    }),
    gate({
      id: "gemini-ai",
      label: "必須技術: Gemini",
      category: "ai",
      score: hasGeminiAgent ? Math.max(proof.scores.ai, 82) : proof.scores.ai,
      evidence:
        proof.gemini.source === "gemini"
          ? `${proof.gemini.model} の実応答をJudge Proofに含めている。`
          : "Gemini StrategistとGemini API境界は実装済み。API不通時はフォールバックをwatch扱いで明示する。",
      nextAction: proof.gemini.source === "gemini" ? "Judge ProofのGemini欄を録画する" : "GEMINI_API_KEYをCloud Run Secretから渡して再実行する",
      url: `${base}/api/proof`,
      forcedStatus: hasGeminiAgent ? (proof.gemini.source === "gemini" ? "pass" : "watch") : "fail"
    }),
    gate({
      id: "a2a-core",
      label: "AIエージェント中心性",
      category: "ai",
      score: hasA2aBroker ? proof.scores.a2a : 45,
      evidence: "Agent Card、market.discover、agent.hire、task.delegate、market.intel、mvp.auditをA2A skillとして公開する。",
      nextAction: "Agent CardとA2A payloadを動画内で開く",
      url: `${base}/.well-known/agent-card.json`,
      forcedStatus: hasA2aBroker ? "pass" : "fail"
    }),
    gate({
      id: "market-swot",
      label: "競合分析/SWOT",
      category: "judging",
      score: average([marketIntel.marketScore, strategy.moatScore, strategy.competitors.length >= 6 ? 100 : 60, hasAllSwotQuadrants ? 100 : 40]),
      evidence: `${marketIntel.sources.length}公式/一次ソース、${strategy.competitors.length}競合、${swotCount} SWOT itemsを持つ。`,
      nextAction: "Market Intel Boardを30秒動画の冒頭に置く",
      url: `${base}/api/market-intel`
    }),
    gate({
      id: "ci-quality",
      label: "GitHub Actions品質ゲート",
      category: "devops",
      score: proof.scores.ci,
      evidence: proof.ci.conclusion === "success" ? `最新main CI run ${proof.ci.runId ?? ""} がsuccess。` : `CI is ${proof.ci.status}/${proof.ci.conclusion}。`,
      nextAction: "CIがsuccessであることをJudge Proofで確認する",
      url: SUBMISSION_PROOF.ciWorkflowUrl,
      forcedStatus: proof.ci.status === "passed" ? "pass" : proof.ci.status === "watch" ? "watch" : "fail"
    }),
    gate({
      id: "ops-readiness",
      label: "Cloud Run運用判断",
      category: "devops",
      score: opsDrill.rollbackRecommended ? 50 : opsDrill.readinessScore,
      evidence: `${opsDrill.signals.length} signals、severity ${opsDrill.severity}、rollback ${opsDrill.rollbackRecommended ? "recommended" : "not recommended"}。`,
      nextAction: opsDrill.rollbackRecommended ? "録画前に前revisionへ戻す" : "Ops DrillをDevOps証跡として見せる",
      url: `${base}/api/ops-drill`,
      forcedStatus: opsDrill.rollbackRecommended ? "fail" : undefined
    }),
    gate({
      id: "deployed-url",
      label: "提出物: デプロイ済みURL",
      category: "submission",
      score: hasSubmissionUrl(SUBMISSION_PROOF.deployedUrl) ? 100 : 20,
      evidence: SUBMISSION_PROOF.deployedUrl || "deployed URL missing",
      nextAction: "Cloud Run URLを提出フォームとProtoPediaに貼る",
      url: SUBMISSION_PROOF.deployedUrl,
      forcedStatus: hasSubmissionUrl(SUBMISSION_PROOF.deployedUrl) ? "pass" : "fail"
    }),
    gate({
      id: "github-url",
      label: "提出物: 公開GitHub",
      category: "submission",
      score: hasSubmissionUrl(SUBMISSION_PROOF.publicGitHubUrl) ? 100 : 20,
      evidence: SUBMISSION_PROOF.publicGitHubUrl || "public GitHub URL missing",
      nextAction: "公開GitHub URLを提出フォームとProtoPediaに貼る",
      url: SUBMISSION_PROOF.publicGitHubUrl,
      forcedStatus: hasSubmissionUrl(SUBMISSION_PROOF.publicGitHubUrl) ? "pass" : "fail"
    }),
    gate({
      id: "protopedia-url",
      label: "提出物: ProtoPedia作品URL",
      category: "submission",
      score: externalProtoPediaReady ? 100 : 58,
      evidence: externalProtoPediaReady ? SUBMISSION_PROOF.protopediaUrl : "外部登録が必要。アプリ内では未発行をwatchとして残す。",
      nextAction: "Submission Dossierのcopy blocksを貼り、findy_hackathonタグ付きでProtoPedia作品URLを発行する",
      url: externalProtoPediaReady ? SUBMISSION_PROOF.protopediaUrl : undefined,
      forcedStatus: externalProtoPediaReady ? "pass" : "watch"
    }),
    gate({
      id: "video-url",
      label: "提出物: 30秒動画URL",
      category: "submission",
      score: externalVideoReady ? 100 : 58,
      evidence: externalVideoReady ? SUBMISSION_PROOF.videoUrl : "外部録画とアップロードが必要。アプリ内では未発行をwatchとして残す。",
      nextAction: "Market Intel -> MVP Audit -> Win Autopilot -> Submission Dossierの順で30秒動画を録画する",
      url: externalVideoReady ? SUBMISSION_PROOF.videoUrl : undefined,
      forcedStatus: externalVideoReady ? "pass" : "watch"
    }),
    gate({
      id: "judge-demo",
      label: "審査員30秒導線",
      category: "judging",
      score: average([autopilot.winScore, dossier.dossierScore, finalist.finalistScore]),
      evidence: `Win ${autopilot.winScore} / dossier ${dossier.dossierScore} / finalist ${finalist.finalistScore}。`,
      nextAction: "MVP Auditでwatchを示したあとWin Autopilotへ進む",
      url: `${base}/api/win-run`
    })
  ];

  const judgeLanes: MvpJudgeLane[] = strategy.judgeCriteria.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    score: criterion.score,
    status: laneStatus(criterion.score),
    evidence: criterion.evidence,
    nextAction: criterion.nextAction
  }));
  const blockers = uniqueActions(gates.filter((item) => item.status !== "pass").map(actionFromGate));
  const nextActions = blockers.length > 0 ? blockers : uniqueActions(gates.slice(0, 3).map(actionFromGate).map((action) => ({ ...action, priority: "later" as const })));
  const mvpScore = Math.round(
    clamp(
      average([
        average(gates.map((item) => item.score)),
        average(judgeLanes.map((item) => item.score)),
        proof.overallScore,
        marketIntel.marketScore,
        finalist.finalistScore,
        autopilot.winScore
      ])
    )
  );
  const band = bandFrom({ score: mvpScore, gates, blockers });
  const hardTruth =
    band === "submission-ready"
      ? "提出URL、動画、証拠、審査導線が揃っている。"
      : band === "mvp-with-external-gaps"
        ? "コード、Cloud Run、Gemini/A2A、競合分析、CIはMVP水準。提出完了にはProtoPedia作品URLと動画URLがまだ必要。"
        : "必須技術またはDevOps証拠にfailがあるため、MVPとして押し出す前に修正が必要。";
  const verdict =
    band === "submission-ready"
      ? "Submit now"
      : band === "mvp-with-external-gaps"
        ? "MVP is credible, but external submission is not complete"
        : "Do not submit as MVP yet";

  return {
    id: `mvp-audit-${mvpScore}-${mission.id}`,
    mvpScore,
    band,
    verdict,
    hardTruth,
    gates,
    judgeLanes,
    blockers,
    nextActions,
    proofUrls: [
      { id: "app", label: "Cloud Run", url: SUBMISSION_PROOF.deployedUrl },
      { id: "github", label: "GitHub", url: SUBMISSION_PROOF.publicGitHubUrl },
      { id: "ci", label: "CI", url: SUBMISSION_PROOF.ciWorkflowUrl },
      { id: "agent-card", label: "Agent Card", url: `${base}/.well-known/agent-card.json` },
      { id: "market-intel", label: "Market Intel", url: `${base}/api/market-intel` },
      { id: "proof", label: "Judge Proof", url: `${base}/api/proof` },
      { id: "dossier", label: "Submission Dossier", url: `${base}/api/dossier` }
    ],
    a2aPayload: {
      method: "message/send",
      skill: "mvp.audit",
      mvpScore,
      band,
      verdict,
      gates: gates.map((item) => ({ id: item.id, status: item.status, score: item.score })),
      blockers: blockers.map((item) => ({ id: item.id, priority: item.priority, action: item.action })),
      judgeLanes: judgeLanes.map((item) => ({ id: item.id, status: item.status, score: item.score }))
    }
  };
}
