import { MARKET_AGENTS } from "./market.js";
import type { MarketAgent, Recommendation } from "./types.js";
import type { WinningStrategy } from "./strategy.js";

export type OpsSignalStatus = "pass" | "watch" | "fail";
export type OpsSeverity = "healthy" | "watch" | "degraded" | "critical";
export type OpsPhase = "observe" | "triage" | "mitigate" | "verify" | "rebuy";

export type OpsObservedMetrics = {
  latencyP95Ms?: number;
  errorRatePercent?: number;
  healthOk?: boolean;
  fallbackActive?: boolean;
  budgetBurnPercent?: number;
  submissionUrlsReady?: boolean;
};

export type OpsSignal = {
  id: string;
  label: string;
  value: string;
  threshold: string;
  status: OpsSignalStatus;
  evidence: string;
};

export type OpsDecision = {
  id: string;
  actor: string;
  decision: string;
  rationale: string;
  confidence: number;
};

export type OpsStep = {
  id: string;
  phase: OpsPhase;
  actor: string;
  action: string;
  output: string;
};

export type OpsDrill = {
  id: string;
  incidentTitle: string;
  severity: OpsSeverity;
  summary: string;
  readinessScore: number;
  rollbackRecommended: boolean;
  signals: OpsSignal[];
  decisions: OpsDecision[];
  steps: OpsStep[];
  runbookCommands: string[];
  a2aPayload: Record<string, unknown>;
  nextOpsAgent: {
    id: string;
    name: string;
    reason: string;
    expectedLift: string;
  } | null;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function hasAgent(recommendation: Recommendation, id: string) {
  return recommendation.selected.some((agent) => agent.id === id);
}

function pickAgentName(recommendation: Recommendation, id: string, fallback: string) {
  return recommendation.selected.find((agent) => agent.id === id)?.name ?? fallback;
}

function capabilityAverage(recommendation: Recommendation, pick: (agent: MarketAgent) => number) {
  return average(recommendation.selected.map(pick));
}

function signalStatus(value: number, watchAt: number, failAt: number, direction: "lower" | "higher" = "lower"): OpsSignalStatus {
  if (direction === "higher") {
    if (value <= failAt) return "fail";
    if (value <= watchAt) return "watch";
    return "pass";
  }
  if (value >= failAt) return "fail";
  if (value >= watchAt) return "watch";
  return "pass";
}

function statusPoints(status: OpsSignalStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 68;
  return 24;
}

function findNextOpsAgent(recommendation: Recommendation, strategy: WinningStrategy) {
  const preferred = ["observability-oracle", "test-forge", "security-sentinel", strategy.nextBestAgent?.agent.id].filter(Boolean) as string[];
  const agent = preferred
    .map((id) => MARKET_AGENTS.find((candidate) => candidate.id === id && !hasAgent(recommendation, candidate.id)))
    .find(Boolean);

  if (!agent) return null;

  const reason =
    agent.id === "observability-oracle"
      ? "運用ログを次の市場推薦へ戻し、DevOpsの継続改善ループを見せるため。"
      : agent.id === "test-forge"
        ? "異常時の再発防止をテスト証跡へ変換し、実装力の弱点を補うため。"
        : "公開デモの信頼境界を説明可能にするため。";

  return {
    id: agent.id,
    name: agent.name,
    reason,
    expectedLift: agent.outcome
  };
}

function deriveSignals(recommendation: Recommendation, strategy: WinningStrategy, observed: OpsObservedMetrics) {
  const cloudOps = average([
    capabilityAverage(recommendation, (agent) => agent.capabilities.cloudRun),
    capabilityAverage(recommendation, (agent) => agent.capabilities.observability)
  ]);
  const testing = capabilityAverage(recommendation, (agent) => agent.capabilities.testing);
  const governance = capabilityAverage(recommendation, (agent) => (agent.capabilities.security + agent.capabilities.mcp + agent.capabilities.a2a) / 3);
  const latencyP95Ms = observed.latencyP95Ms ?? Math.round(1050 - cloudOps * 6);
  const errorRatePercent = observed.errorRatePercent ?? Number(((100 - testing) / 28).toFixed(1));
  const budgetBurnPercent = observed.budgetBurnPercent ?? Math.round(88 - governance * 0.32);
  const healthOk = observed.healthOk ?? true;
  const fallbackActive = observed.fallbackActive ?? !hasAgent(recommendation, "gemini-strategist");
  const submissionUrlsReady = observed.submissionUrlsReady ?? strategy.submissionItems.every((item) => item.done);

  return [
    {
      id: "healthz",
      label: "Cloud Run health",
      value: healthOk ? "ok" : "down",
      threshold: "ok",
      status: healthOk ? "pass" : "fail",
      evidence: "/api/healthz must return ok before ProtoPedia recording"
    },
    {
      id: "latency",
      label: "p95 latency",
      value: `${Math.max(0, latencyP95Ms)}ms`,
      threshold: "< 700ms watch / < 1200ms fail",
      status: signalStatus(latencyP95Ms, 700, 1200),
      evidence: "Cloud Run revision latency should stay below the demo comfort line"
    },
    {
      id: "errors",
      label: "5xx error rate",
      value: `${Math.max(0, errorRatePercent).toFixed(1)}%`,
      threshold: "< 1% watch / < 5% fail",
      status: signalStatus(errorRatePercent, 1, 5),
      evidence: "A public demo can tolerate warnings, not repeated server errors"
    },
    {
      id: "gemini-fallback",
      label: "Gemini fallback",
      value: fallbackActive ? "active" : "standby",
      threshold: "standby preferred",
      status: fallbackActive ? "watch" : "pass",
      evidence: "Fallback keeps the demo alive, but real Gemini output is stronger for judging"
    },
    {
      id: "budget",
      label: "Ops budget burn",
      value: `${Math.max(0, budgetBurnPercent)}%`,
      threshold: "< 85%",
      status: signalStatus(budgetBurnPercent, 85, 96),
      evidence: "The selected squad must leave room for a last-minute reliability hire"
    },
    {
      id: "submission-urls",
      label: "External URLs",
      value: submissionUrlsReady ? "ready" : "needs final URLs",
      threshold: "ready before deadline",
      status: submissionUrlsReady ? "pass" : "watch",
      evidence: "Public GitHub, ProtoPedia, and video URLs are external proof items"
    }
  ] satisfies OpsSignal[];
}

export function buildOpsDrill(recommendation: Recommendation, strategy: WinningStrategy, observed: OpsObservedMetrics = {}): OpsDrill {
  const signals = deriveSignals(recommendation, strategy, observed);
  const failures = signals.filter((signal) => signal.status === "fail").length;
  const watches = signals.filter((signal) => signal.status === "watch").length;
  const severity: OpsSeverity = failures >= 2 ? "critical" : failures === 1 ? "degraded" : watches > 0 ? "watch" : "healthy";
  const readinessScore = Math.round(clamp(average(signals.map((signal) => statusPoints(signal.status))) * 0.78 + strategy.judgeScore * 0.22));
  const rollbackRecommended = severity === "critical" || (severity === "degraded" && !hasAgent(recommendation, "cloud-run-sre"));
  const sre = pickAgentName(recommendation, "cloud-run-sre", "Cloud Run SRE");
  const broker = pickAgentName(recommendation, "market-broker", recommendation.selected[0]?.name ?? "A2A Market Broker");
  const observer = pickAgentName(recommendation, "observability-oracle", "Observability Oracle");
  const verifier = pickAgentName(recommendation, "test-forge", "Test Forge");
  const nextOpsAgent = findNextOpsAgent(recommendation, strategy);

  const decisions: OpsDecision[] = [
    {
      id: "release-gate",
      actor: sre,
      decision: rollbackRecommended ? "Rollback the public revision before the pitch" : "Keep serving and attach watch items to the demo runbook",
      rationale: rollbackRecommended
        ? "Health, latency, or error signals crossed the failure line, so the safest DevOps action is to restore the last healthy revision."
        : "No critical signal is failing, so the stronger story is guarded continuity with explicit watch evidence.",
      confidence: readinessScore
    },
    {
      id: "rebuy-loop",
      actor: broker,
      decision: nextOpsAgent ? `Hire ${nextOpsAgent.name} next` : "No additional ops hire required",
      rationale: nextOpsAgent?.reason ?? "The current squad already covers the observed runtime risk.",
      confidence: clamp(strategy.moatScore + (nextOpsAgent ? 4 : 8))
    },
    {
      id: "judge-proof",
      actor: observer,
      decision: "Turn runtime signals into submission evidence",
      rationale: "DevOps評価では、作ったことより、公開後の異常検知と判断の証跡が効く。",
      confidence: clamp(readinessScore + 6)
    }
  ];

  const steps: OpsStep[] = [
    {
      id: "observe-runtime",
      phase: "observe",
      actor: observer,
      action: "Cloud Runと提出URLのシグナルを読む",
      output: `${signals.length} signals / ${failures} fail / ${watches} watch`
    },
    {
      id: "triage-incident",
      phase: "triage",
      actor: sre,
      action: "障害の重さとピッチ影響を判定",
      output: `${severity} severity, readiness ${readinessScore}`
    },
    {
      id: "mitigate",
      phase: "mitigate",
      actor: sre,
      action: rollbackRecommended ? "ロールバック手順を選ぶ" : "継続公開とwatch項目の説明を選ぶ",
      output: rollbackRecommended ? "rollback recommended" : "guarded release accepted"
    },
    {
      id: "verify",
      phase: "verify",
      actor: verifier,
      action: "再発防止をテストとAPI確認に変換",
      output: "healthz / ops drill / build / test をrunbook化"
    },
    {
      id: "rebuy",
      phase: "rebuy",
      actor: broker,
      action: "市場から次の運用能力を買い足す",
      output: nextOpsAgent ? `${nextOpsAgent.name}: ${nextOpsAgent.expectedLift}` : "追加購入なし"
    }
  ];

  const runbookCommands = [
    "curl -s ${PUBLIC_BASE_URL:-http://localhost:8080}/api/healthz",
    "curl -s -X POST ${PUBLIC_BASE_URL:-http://localhost:8080}/api/ops-drill -H 'Content-Type: application/json' --data '{\"projectBrief\":\"A2A Cloud Run Gemini DevOps\",\"selectedAgentIds\":[\"market-broker\",\"gemini-strategist\",\"cloud-run-sre\"]}'",
    "gcloud run services describe a2a-agent-marketplace --region asia-northeast1 --format='value(status.url)'",
    "gcloud logging read 'resource.type=\"cloud_run_revision\" AND severity>=ERROR' --limit=20 --project=$GOOGLE_CLOUD_PROJECT",
    rollbackRecommended
      ? "gcloud run services update-traffic a2a-agent-marketplace --region asia-northeast1 --to-revisions PREVIOUS_REVISION=100"
      : "gcloud run services update-traffic a2a-agent-marketplace --region asia-northeast1 --to-latest"
  ];

  return {
    id: `ops-${severity}-${readinessScore}`,
    incidentTitle: "Cloud Run public demo readiness drill",
    severity,
    summary: rollbackRecommended
      ? `${sre} が失敗シグナルを検知し、公開デモ前のロールバックを選びました。`
      : `${sre} がwatch項目を分離し、公開継続と追加運用能力の買い足しを選びました。`,
    readinessScore,
    rollbackRecommended,
    signals,
    decisions,
    steps,
    runbookCommands,
    a2aPayload: {
      method: "message/send",
      skill: "ops.drill",
      severity,
      rollbackRecommended,
      signals: signals.map((signal) => ({ id: signal.id, status: signal.status, value: signal.value })),
      nextOpsAgent: nextOpsAgent?.id ?? null
    },
    nextOpsAgent
  };
}
