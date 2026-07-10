import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ShieldCheck, Siren } from "lucide-react";

const OPS_AGENT_ID = "cloud-run-sre";

type RunPhase = { phase: string; status: "done" | "error"; detail: string; at: string };

type RunFinding = {
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  hypothesis: string;
  recommendedAction: string;
  citedLogIds: string[];
  gate: { citationsValid: boolean; invalidCitations: string[] };
  checker: { verdict: "confirmed" | "refuted" | "uncertain"; reason: string };
  accepted: boolean;
};

type OpsRun = {
  id: string;
  targetService: string;
  trigger: "web" | "a2a";
  status: "queued" | "running" | "completed" | "failed";
  phases: RunPhase[];
  evidenceCount: number;
  evidenceWindowMinutes: number;
  evidenceSample: Array<{ id: string; timestamp: string; severity: string; message: string }>;
  serviceHealth: "healthy" | "degraded" | "critical" | "unknown";
  summary: string;
  findings: RunFinding[];
  escalations: Array<{ title: string; recommendedAction: string; severity: string; status: string }>;
  usage: { promptTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number };
  model: string;
  mode: string;
  error?: string;
  startedAt: string;
  finishedAt?: string;
};

const PHASE_LABELS: Record<string, string> = {
  evidence: "①証拠収集",
  triage: "②makerトリアージ",
  gate: "③引用ゲート",
  review: "④独立checker",
  decide: "⑤判定・記録",
  error: "エラー"
};

const HEALTH_LABELS: Record<string, string> = {
  healthy: "健全",
  degraded: "劣化",
  critical: "重大",
  unknown: "不明"
};

function StatusBadge({ status }: { status: OpsRun["status"] }) {
  const label = { queued: "待機", running: "実行中", completed: "完了", failed: "失敗" }[status];
  return <span className={`ops-status ops-status-${status}`}>{label}</span>;
}

export default function OpsAgentConsole() {
  const [hired, setHired] = useState(false);
  const [hiredLoaded, setHiredLoaded] = useState(false);
  const [runs, setRuns] = useState<OpsRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const selectedRun = useMemo(() => runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null, [runs, selectedRunId]);
  const hasActiveRun = runs.some((run) => run.status === "queued" || run.status === "running");

  const refresh = useCallback(async () => {
    try {
      const [hiresRes, runsRes] = await Promise.all([fetch("/api/hires"), fetch("/api/agent-runs?limit=10")]);
      const hires = (await hiresRes.json()) as { hires?: Array<{ agentId: string }> };
      const runsBody = (await runsRes.json()) as { runs?: OpsRun[] };
      setHired(Boolean(hires.hires?.some((hire) => hire.agentId === OPS_AGENT_ID)));
      setRuns(runsBody.runs ?? []);
      setHiredLoaded(true);
    } catch {
      setMessage("モニタリングAPIへの接続に失敗しました。");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!hasActiveRun) return;
    const timer = setInterval(() => {
      void refresh();
    }, 2500);
    return () => clearInterval(timer);
  }, [hasActiveRun, refresh]);

  async function handleToggleHire() {
    setBusy(true);
    setMessage("");
    try {
      if (hired) {
        await fetch(`/api/hires/${OPS_AGENT_ID}`, { method: "DELETE" });
      } else {
        await fetch("/api/hires", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ agentId: OPS_AGENT_ID })
        });
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleExecute() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/agent-runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId: OPS_AGENT_ID })
      });
      const body = (await response.json()) as { runId?: string; error?: string; message?: string };
      if (!response.ok) {
        setMessage(body.message ?? body.error ?? "実行に失敗しました。");
        return;
      }
      if (body.runId) setSelectedRunId(body.runId);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDrill() {
    setBusy(true);
    try {
      const response = await fetch("/api/ops-agent/incident-drill", { method: "POST" });
      const body = (await response.json()) as { note?: string; message?: string };
      setMessage(body.note ?? body.message ?? "");
    } finally {
      setBusy(false);
    }
  }

  const acceptedTotal = runs.reduce((sum, run) => sum + run.findings.filter((f) => f.accepted).length, 0);
  const costTotal = runs.reduce((sum, run) => sum + (run.usage?.estimatedCostUsd ?? 0), 0);
  const costPerAccepted = acceptedTotal > 0 ? costTotal / acceptedTotal : null;

  return (
    <div className="ops-console">
      <div className="ops-console-head">
        <div>
          <h3>
            <Activity size={16} /> Cloud Run SRE — 実運用コンソール
          </h3>
          <p className="ops-console-sub">
            実Cloud Loggingの取得 → Gemini maker → 引用ゲート(実ログID照合) → 独立checker → Firestore記録。実行はレート制限・時間予算のハードストップ付き。
          </p>
        </div>
        <div className="ops-console-actions">
          <button type="button" className={`btn-hire${hired ? " is-active" : ""}`} onClick={handleToggleHire} disabled={busy || !hiredLoaded}>
            {hired ? "解雇" : "雇う (契約を保存)"}
          </button>
          <button type="button" className="btn-primary" onClick={handleExecute} disabled={busy || !hired}>
            {hasActiveRun ? "実行中…" : "実行する"}
          </button>
          <button type="button" className="btn-secondary" onClick={handleDrill} disabled={busy} title="実ログとしてERROR/WARNINGを注入するSREドリル">
            模擬インシデント注入
          </button>
        </div>
      </div>

      {!hired && hiredLoaded ? <p className="ops-console-hint">「雇う」で契約がサーバーに保存され、実行が解放されます。</p> : null}
      {message ? <p className="ops-console-message">{message}</p> : null}

      <div className="ops-metrics">
        <div className="ops-metric">
          <span className="ops-metric-value">{runs.length}</span>
          <span className="ops-metric-label">ラン数</span>
        </div>
        <div className="ops-metric">
          <span className="ops-metric-value">{acceptedTotal}</span>
          <span className="ops-metric-label">受入findings</span>
        </div>
        <div className="ops-metric">
          <span className="ops-metric-value">${costTotal.toFixed(4)}</span>
          <span className="ops-metric-label">概算コスト</span>
        </div>
        <div className="ops-metric">
          <span className="ops-metric-value">{costPerAccepted === null ? "—" : `$${costPerAccepted.toFixed(4)}`}</span>
          <span className="ops-metric-label">受入1件あたり</span>
        </div>
      </div>

      {runs.length > 0 ? (
        <div className="ops-run-list">
          {runs.map((run) => (
            <button
              key={run.id}
              type="button"
              className={`ops-run-chip${selectedRun?.id === run.id ? " is-active" : ""}`}
              onClick={() => setSelectedRunId(run.id)}
            >
              <StatusBadge status={run.status} />
              <span>{new Date(run.startedAt).toLocaleTimeString("ja-JP")}</span>
              <span className="ops-run-chip-meta">
                {run.trigger === "a2a" ? "A2A" : "Web"}・{run.findings.filter((f) => f.accepted).length}件受入
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="ops-console-hint">まだランがありません。雇用して「実行する」を押すと、実ログのトリアージが始まります。</p>
      )}

      {selectedRun ? (
        <div className="ops-run-detail">
          <div className="ops-run-summary">
            <StatusBadge status={selectedRun.status} />
            <span className={`ops-health ops-health-${selectedRun.serviceHealth}`}>
              対象 {selectedRun.targetService}: {HEALTH_LABELS[selectedRun.serviceHealth]}
            </span>
            <span className="ops-run-meta">
              実ログ {selectedRun.evidenceCount} 件 / {selectedRun.evidenceWindowMinutes} 分窓 / {selectedRun.model} ({selectedRun.mode}) / トークン{" "}
              {selectedRun.usage.totalTokens} (~${selectedRun.usage.estimatedCostUsd})
            </span>
          </div>
          {selectedRun.summary ? <p className="ops-run-text">{selectedRun.summary}</p> : null}
          {selectedRun.error ? <p className="ops-console-message">{selectedRun.error}</p> : null}

          <div className="ops-phases">
            {selectedRun.phases.map((phase, index) => (
              <div key={`${phase.phase}-${index}`} className={`ops-phase ops-phase-${phase.status}`}>
                <span className="ops-phase-name">{PHASE_LABELS[phase.phase] ?? phase.phase}</span>
                <span className="ops-phase-detail">{phase.detail}</span>
              </div>
            ))}
          </div>

          {selectedRun.findings.length > 0 ? (
            <div className="ops-findings">
              {selectedRun.findings.map((finding, index) => (
                <div key={`${finding.title}-${index}`} className={`ops-finding${finding.accepted ? "" : " is-rejected"}`}>
                  <div className="ops-finding-head">
                    <span className={`ops-severity ops-severity-${finding.severity}`}>{finding.severity}</span>
                    <strong>{finding.title}</strong>
                    <span className={`ops-verdict ops-verdict-${finding.checker.verdict}`}>
                      <ShieldCheck size={12} /> checker: {finding.checker.verdict}
                    </span>
                    {finding.gate.citationsValid ? null : <span className="ops-verdict ops-verdict-refuted">引用ゲート棄却</span>}
                    <span className="ops-accepted">{finding.accepted ? "受入" : "棄却"}</span>
                  </div>
                  <p className="ops-run-text">仮説: {finding.hypothesis}</p>
                  <p className="ops-run-text">推奨: {finding.recommendedAction}</p>
                  <p className="ops-citations">
                    引用実ログ: {finding.citedLogIds.map((logId) => (
                      <code key={logId}>{logId}</code>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {selectedRun.escalations.length > 0 ? (
            <div className="ops-escalations">
              <p className="ops-escalations-title">
                <Siren size={14} /> 人間承認待ちエスカレーション（エージェントは破壊的操作を自動実行しない）
              </p>
              {selectedRun.escalations.map((escalation, index) => (
                <p key={`${escalation.title}-${index}`} className="ops-run-text">
                  [{escalation.severity}] {escalation.title} — {escalation.recommendedAction}
                </p>
              ))}
            </div>
          ) : null}

          {selectedRun.evidenceSample.length > 0 ? (
            <details className="ops-evidence">
              <summary>証拠ログサンプル（redaction適用済み・{selectedRun.evidenceSample.length}件表示）</summary>
              {selectedRun.evidenceSample.map((evidence) => (
                <p key={evidence.id} className="ops-evidence-row">
                  <code>{evidence.id}</code> {evidence.severity} {evidence.message}
                </p>
              ))}
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
