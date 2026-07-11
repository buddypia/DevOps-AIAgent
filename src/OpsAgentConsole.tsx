import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ShieldCheck, Siren } from "lucide-react";

import AgentAvatar from "./AgentAvatar.js";
import ResultInspector from "./ResultInspector.js";

type AgentJobMeta = {
  agentId: string;
  name: string;
  handle: string;
  color: string;
  title: string;
  skillId: string;
  inputKind: "none" | "text" | "url" | "service";
  inputLabel: string;
  inputPlaceholder: string;
  findingNoun: string;
};

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
  agentId: string;
  targetService: string;
  input?: string;
  trigger: "web" | "a2a" | "mission";
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
  evidence: "①ログ収集",
  triage: "②一次分析",
  gate: "③根拠の照合",
  review: "④再確認",
  decide: "⑤結果を記録",
  error: "エラー"
};

const CHECKER_LABELS: Record<RunFinding["checker"]["verdict"], string> = {
  confirmed: "確認できた",
  refuted: "裏付けなし",
  uncertain: "追加確認が必要"
};

const SEVERITY_LABELS: Record<RunFinding["severity"], string> = {
  critical: "最優先",
  high: "高",
  medium: "中",
  low: "低"
};

const HEALTH_LABELS: Record<string, string> = {
  healthy: "良好",
  degraded: "要改善",
  critical: "重大",
  unknown: "不明"
};

function StatusBadge({ status }: { status: OpsRun["status"] }) {
  const label = { queued: "待機", running: "実行中", completed: "完了", failed: "失敗" }[status];
  return <span className={`ops-status ops-status-${status}`}>{label}</span>;
}

interface OpsAgentConsoleProps {
  // 親からの更新シグナル (ミッション完了時など) でラン一覧を再取得する
  refreshSignal: number;
  // 手動ランが完了した際に親へ通知 (実績統計の更新)
  onRunSettled: () => void;
}

export default function OpsAgentConsole({ refreshSignal, onRunSettled }: OpsAgentConsoleProps) {
  const [jobs, setJobs] = useState<AgentJobMeta[]>([]);
  const [hiredIds, setHiredIds] = useState<Set<string>>(new Set());
  const [runs, setRuns] = useState<OpsRun[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("cloud-run-sre");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const selectedJob = useMemo(() => jobs.find((job) => job.agentId === selectedAgentId) ?? jobs[0] ?? null, [jobs, selectedAgentId]);
  const jobByAgent = useMemo(() => new Map(jobs.map((job) => [job.agentId, job])), [jobs]);
  const selectedRun = useMemo(() => runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null, [runs, selectedRunId]);
  const hasActiveRun = runs.some((run) => run.status === "queued" || run.status === "running");
  const hired = selectedJob ? hiredIds.has(selectedJob.agentId) : false;

  const inputValue = selectedJob ? (inputValues[selectedJob.agentId] ?? "") : "";

  const refresh = useCallback(async () => {
    try {
      const [hiresRes, runsRes] = await Promise.all([fetch("/api/hires"), fetch("/api/agent-runs?limit=12")]);
      const hires = (await hiresRes.json()) as { hires?: Array<{ agentId: string }> };
      const runsBody = (await runsRes.json()) as { runs?: OpsRun[] };
      setHiredIds(new Set((hires.hires ?? []).map((hire) => hire.agentId)));
      setRuns(runsBody.runs ?? []);
    } catch {
      setMessage("モニタリングAPIへの接続に失敗しました。");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/agent-jobs");
        const body = (await response.json()) as { jobs?: AgentJobMeta[] };
        setJobs(body.jobs ?? []);
      } catch {
        setMessage("エージェントカタログの取得に失敗しました。");
      }
      await refresh();
    })();
  }, [refresh]);

  useEffect(() => {
    if (!hasActiveRun) return;
    const timer = setInterval(() => {
      void refresh();
    }, 2500);
    return () => clearInterval(timer);
  }, [hasActiveRun, refresh]);

  // 親からの更新シグナル (ミッションがランを生成した後など)
  useEffect(() => {
    if (refreshSignal > 0) void refresh();
  }, [refreshSignal, refresh]);

  // 手動ランの完了検知 → 親の実績統計を更新
  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (wasActiveRef.current && !hasActiveRun) onRunSettled();
    wasActiveRef.current = hasActiveRun;
  }, [hasActiveRun, onRunSettled]);

  async function handleToggleHire() {
    if (!selectedJob) return;
    setBusy(true);
    setMessage("");
    try {
      if (hired) {
        await fetch(`/api/hires/${selectedJob.agentId}`, { method: "DELETE" });
      } else {
        await fetch("/api/hires", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ agentId: selectedJob.agentId })
        });
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleExecute() {
    if (!selectedJob) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/agent-runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId: selectedJob.agentId, input: selectedJob.inputKind === "none" ? undefined : inputValue })
      });
      const body = (await response.json()) as { runId?: string; error?: string; message?: string };
      if (!response.ok) {
        setMessage(
          response.status === 503
            ? "分析サービスが準備されていません。管理者はGemini APIキーまたはVertex ADCを設定してください。"
            : body.message ?? body.error ?? "調査を開始できませんでした。"
        );
        return;
      }
      if (body.runId) setSelectedRunId(body.runId);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const acceptedTotal = runs.reduce((sum, run) => sum + run.findings.filter((f) => f.accepted).length, 0);
  const costTotal = runs.reduce((sum, run) => sum + (run.usage?.estimatedCostUsd ?? 0), 0);
  const costPerAccepted = acceptedTotal > 0 ? costTotal / acceptedTotal : null;
  const selectedRunJob = selectedRun ? jobByAgent.get(selectedRun.agentId) : null;

  return (
    <div className="ops-console">
      <div className="ops-console-head">
        <div>
            <h3>
            <Activity size={16} /> 個別の調査を実行
          </h3>
          <p className="ops-console-sub">
            実際のログを集め、一次分析と再確認を通して、根拠のある結果にまとめます。
          </p>
        </div>
      </div>

      <div className="ops-agent-picker">
        {jobs.map((job) => (
          <button
            key={job.agentId}
            type="button"
            className={`ops-agent-chip${selectedAgentId === job.agentId ? " is-active" : ""}`}
            style={{ borderColor: selectedAgentId === job.agentId ? job.color : undefined }}
            onClick={() => setSelectedAgentId(job.agentId)}
          >
            <AgentAvatar agentId={job.agentId} name={job.name} color={job.color} size={22} />
            <span className="ops-agent-dot" style={{ background: hiredIds.has(job.agentId) ? job.color : "transparent", borderColor: job.color }} />
            {job.name}
          </button>
        ))}
      </div>

      {selectedJob ? (
        <div className="ops-job-panel">
          <p className="ops-job-title">
            <strong>{selectedJob.name}</strong>（{selectedJob.handle}） - {selectedJob.title}
          </p>
          {selectedJob.inputKind !== "none" ? (
            <label className="ops-job-input">
              <span>{selectedJob.inputLabel}</span>
              {selectedJob.inputKind === "text" ? (
                <textarea
                  rows={3}
                  value={inputValue}
                  placeholder={selectedJob.inputPlaceholder}
                  onChange={(event) => setInputValues((prev) => ({ ...prev, [selectedJob.agentId]: event.target.value }))}
                />
              ) : (
                <input
                  value={inputValue}
                  placeholder={selectedJob.inputPlaceholder}
                  onChange={(event) => setInputValues((prev) => ({ ...prev, [selectedJob.agentId]: event.target.value }))}
                />
              )}
            </label>
          ) : null}
          <div className="ops-console-actions">
            <button type="button" className={`btn-hire${hired ? " is-active" : ""}`} onClick={handleToggleHire} disabled={busy}>
              {hired ? "無効にする" : "この調査役を有効にする"}
            </button>
            <button type="button" className="btn-primary" onClick={handleExecute} disabled={busy || !hired}>
              調査を開始
            </button>
          </div>
          {!hired ? <p className="ops-console-hint">調査役を有効にすると、対象への調査を開始できます。</p> : null}
        </div>
      ) : null}

      {message ? <p className="ops-console-message">{message}</p> : null}

      <div className="ops-metrics">
        <div className="ops-metric">
          <span className="ops-metric-value">{runs.length}</span>
          <span className="ops-metric-label">調査回数</span>
        </div>
        <div className="ops-metric">
          <span className="ops-metric-value">{acceptedTotal}</span>
          <span className="ops-metric-label">採用した指摘</span>
        </div>
        <div className="ops-metric">
          <span className="ops-metric-value">${costTotal.toFixed(4)}</span>
          <span className="ops-metric-label">概算コスト</span>
        </div>
        <div className="ops-metric">
          <span className="ops-metric-value">{costPerAccepted === null ? "未計測" : `$${costPerAccepted.toFixed(4)}`}</span>
          <span className="ops-metric-label">採用1件あたり</span>
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
              <span>{jobByAgent.get(run.agentId)?.name ?? run.agentId}</span>
              <span className="ops-run-chip-meta">
                {new Date(run.startedAt).toLocaleTimeString("ja-JP")}・{run.trigger === "a2a" ? "外部連携" : run.trigger === "mission" ? "まとめて調査" : "画面"}・
                {run.findings.filter((f) => f.accepted).length}件採用
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="ops-console-hint">まだ調査履歴がありません。調査役を有効にして「調査を開始」を押してください。</p>
      )}

      {selectedRun ? (
        <div className="ops-run-detail">
          <div className="ops-run-summary">
            <StatusBadge status={selectedRun.status} />
            <span className={`ops-health ops-health-${selectedRun.serviceHealth}`}>
              {selectedRunJob?.name ?? selectedRun.agentId} / 対象 {selectedRun.targetService}: {HEALTH_LABELS[selectedRun.serviceHealth]}
            </span>
            <span className="ops-run-meta">
              ログ {selectedRun.evidenceCount} 件 / {selectedRun.model} ({selectedRun.mode}) / トークン {selectedRun.usage.totalTokens} (~$
              {selectedRun.usage.estimatedCostUsd})
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
                    <span className={`ops-severity ops-severity-${finding.severity}`}>{SEVERITY_LABELS[finding.severity]}</span>
                    <strong>{finding.title}</strong>
                    <span className={`ops-verdict ops-verdict-${finding.checker.verdict}`}>
                      <ShieldCheck size={12} /> 再確認: {CHECKER_LABELS[finding.checker.verdict]}
                    </span>
                    {finding.gate.citationsValid ? null : <span className="ops-verdict ops-verdict-refuted">引用ゲート棄却</span>}
                    <span className="ops-accepted">{finding.accepted ? "採用" : "対象外"}</span>
                  </div>
                  <p className="ops-run-text">根拠: {finding.hypothesis}</p>
                  <p className="ops-run-text">推奨: {finding.recommendedAction}</p>
                  <p className="ops-citations">
                    根拠ログ: {finding.citedLogIds.map((logId) => (
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
                <Siren size={14} /> 人の確認が必要な項目（変更操作は自動で行いません）
              </p>
              {selectedRun.escalations.map((escalation, index) => (
                <p key={`${escalation.title}-${index}`} className="ops-run-text">
                  [{escalation.severity}] {escalation.title} - {escalation.recommendedAction}
                </p>
              ))}
            </div>
          ) : null}

          <ResultInspector
            data={selectedRun}
            logs={[
              ...selectedRun.phases.map((phase) => ({
                at: phase.at,
                label: PHASE_LABELS[phase.phase] ?? phase.phase,
                detail: phase.detail,
                tone: phase.status === "error" ? ("error" as const) : ("default" as const)
              })),
              ...selectedRun.evidenceSample.map((evidence) => ({
                at: evidence.timestamp,
                label: `${evidence.severity}ログ / ${evidence.id}`,
                detail: evidence.message,
                tone: evidence.severity === "ERROR" || evidence.severity === "CRITICAL" ? ("error" as const) : ("default" as const)
              }))
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
