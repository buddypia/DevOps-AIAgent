import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleAlert, ClipboardCheck, GitBranchPlus, GitPullRequest, Globe, Package, Radar, Rocket, Server, ShieldCheck } from "lucide-react";

import AgentAvatar from "./AgentAvatar.js";
import { MISSION_TEMPLATES } from "./missionTemplates.js";
import ResultInspector from "./ResultInspector.js";
import WorkflowDiagram from "./WorkflowDiagram.js";

import type { MissionReportFindingView, MissionView } from "./missionTypes.js";

export type AgentIdentity = { agentId: string; name: string; handle: string; color: string };


const MISSION_STATUS_LABELS: Record<MissionView["status"], string> = {
  planning: "計画中",
  running: "実行中",
  completed: "完了",
  failed: "失敗"
};

const STEP_STATUS_LABELS: Record<string, string> = {
  planned: "待機",
  running: "実行中",
  completed: "完了",
  failed: "失敗",
  skipped: "スキップ"
};

const VERDICT_META: Record<string, { label: string; icon: typeof Rocket }> = {
  achieved: { label: "目標達成", icon: ClipboardCheck },
  partial: { label: "部分達成", icon: Radar },
  blocked: { label: "ブロック", icon: CircleAlert }
};

const SEVERITY_LABELS: Record<MissionReportFindingView["severity"], string> = {
  critical: "最優先",
  high: "高",
  medium: "中",
  low: "低"
};

function missionIsStale(mission: MissionView, activeMissionId: string | null): boolean {
  return (mission.status === "planning" || mission.status === "running") && activeMissionId !== mission.id;
}

function missionLabel(mission: MissionView, activeMissionId: string | null): string {
  if (missionIsStale(mission, activeMissionId)) return "要確認";
  return MISSION_STATUS_LABELS[mission.status];
}

function StepStatusBadge({ status }: { status: string }) {
  return <span className={`mc-step-status mc-step-status-${status}`}>{STEP_STATUS_LABELS[status] ?? status}</span>;
}

interface MissionControlProps {
  agents: Map<string, AgentIdentity>;
  onMissionSettled: () => void;
}

export default function MissionControl({ agents, onMissionSettled }: MissionControlProps) {
  const [goal, setGoal] = useState(MISSION_TEMPLATES[0].goal);
  const [missions, setMissions] = useState<MissionView[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  const selectedMission = useMemo(
    () => missions.find((mission) => mission.id === selectedMissionId) ?? missions[0] ?? null,
    [missions, selectedMissionId]
  );
  const missionActive = selectedMission
    ? (selectedMission.status === "planning" || selectedMission.status === "running") && activeMissionId === selectedMission.id
    : false;
  const missionStale = selectedMission
    ? (selectedMission.status === "planning" || selectedMission.status === "running") && activeMissionId !== selectedMission.id
    : false;

  const activeStepIndex = useMemo(() => {
    if (!selectedMission) return null;
    if (selectedMission.status === "completed") return 5; // すべて完了
    if (selectedMission.status === "failed") return 5;
    
    // 実行中のステップを探す
    const runningIdx = selectedMission.steps.findIndex((s) => s.status === "running");
    if (runningIdx !== -1) return runningIdx;
    
    // 最初期または計画中の場合は、最初のステップ
    const plannedIdx = selectedMission.steps.findIndex((s) => s.status === "planned");
    if (plannedIdx !== -1) return plannedIdx;
    
    return null;
  }, [selectedMission]);


  const refreshList = useCallback(async () => {
    try {
      const response = await fetch("/api/missions?limit=8");
      const body = (await response.json()) as { missions?: MissionView[]; active?: string | null };
      setMissions(body.missions ?? []);
      setActiveMissionId(body.active ?? null);
    } catch {
      // 一覧取得失敗は致命的ではない (次のポーリングで再試行)
    }
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  // アクティブミッションのポーリング。完了/失敗で親へ通知する。
  useEffect(() => {
    if (!missionActive || !selectedMission) return;
    const missionId = selectedMission.id;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/missions/${missionId}`);
          if (!response.ok) return;
          const body = (await response.json()) as { mission?: MissionView };
          if (!body.mission) return;
          setMissions((prev) => prev.map((mission) => (mission.id === missionId ? body.mission! : mission)));
          if (body.mission.status === "completed" || body.mission.status === "failed") {
            onMissionSettled();
          }
        } catch {
          // ポーリング失敗は次周期で再試行
        }
      })();
    }, 2500);
    return () => clearInterval(timer);
  }, [missionActive, selectedMission, onMissionSettled]);

  async function handleStart() {
    setStarting(true);
    setMessage("");
    try {
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goal })
      });
      const body = (await response.json()) as { missionId?: string; error?: string; message?: string };
      if (!response.ok || !body.missionId) {
        setMessage(body.message ?? body.error ?? "調査を開始できませんでした。");
        return;
      }
      setActiveMissionId(body.missionId);
      setSelectedMissionId(body.missionId);
      await refreshList();
    } catch {
      setMessage("調査APIへの接続に失敗しました。");
    } finally {
      setStarting(false);
    }
  }

  const agentOf = (agentId: string): AgentIdentity => agents.get(agentId) ?? { agentId, name: agentId, handle: "", color: "#3b82f6" };

  return (
    <section className="mission-control" aria-label="まとめて調査">
      <div className="mc-input-panel">
        <div className="mc-target" aria-label="調査対象">
          <span className="mc-target-label">調査対象</span>
          <span className="mc-target-desc">このAgent Guild自身の本番環境</span>
          <span className="mc-target-chips">
            <span className="mc-target-chip"><Server size={12} /> Cloud Run</span>
            <span className="mc-target-chip"><GitPullRequest size={12} /> CI</span>
            <span className="mc-target-chip"><Package size={12} /> 依存パッケージ</span>
            <span className="mc-target-chip"><Globe size={12} /> 配信中のHTML</span>
          </span>
        </div>
        <div className="mc-template-row" role="group" aria-label="調査テンプレート">
          {MISSION_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className={`mc-template${goal === template.goal ? " is-active" : ""}`}
              onClick={() => setGoal(template.goal)}
            >
              <span className="mc-template-label">{template.label}</span>
              <span className="mc-template-desc">{template.description}</span>
            </button>
          ))}
        </div>
        <textarea
          className="mc-goal-input"
          value={goal}
          rows={3}
          maxLength={2000}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="確認したいことを書く。例: 本番サービスの稼働リスクを総点検して"
          aria-label="調査の目的"
        />
        <div className="mc-start-row">
          <button type="button" className="btn-primary mc-start" onClick={handleStart} disabled={starting || missionActive || goal.trim().length < 8}>
            <Rocket size={16} /> {missionActive ? "調査中…" : starting ? "準備中…" : "調査を開始"}
          </button>
          <p className="mc-start-hint">
            入力内容に合わせて調査役を選び、調査 → 再確認 → 結果の整理まで自動で進めます。
            外部連携からは <code>mission.execute</code> でも起動できます。
          </p>
        </div>
        {message ? <p className="mc-message">{message}</p> : null}
      </div>

      {missions.length > 0 ? (
        <div className="mc-history" role="tablist" aria-label="調査履歴">
          {missions.map((mission) => (
            <button
              key={mission.id}
              type="button"
              className={`mc-history-chip${selectedMission?.id === mission.id ? " is-active" : ""}`}
              onClick={() => setSelectedMissionId(mission.id)}
            >
              <span className={`mc-status mc-status-${missionIsStale(mission, activeMissionId) ? "stale" : mission.status}`}>
                {missionLabel(mission, activeMissionId)}
              </span>
              <span className="mc-history-goal">{mission.goal.slice(0, 42)}…</span>
              <span className="mc-history-time">{new Date(mission.startedAt).toLocaleTimeString("ja-JP")}</span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedMission ? (
        <div className="mc-live" aria-live="polite">
          <div className="mc-live-head">
            <span className={`mc-status mc-status-${missionStale ? "stale" : selectedMission.status}`}>
              {missionStale ? "要確認" : missionLabel(selectedMission, activeMissionId)}
            </span>
            <p className="mc-live-goal">{selectedMission.goal}</p>
            <span className="mc-live-meta">
              {selectedMission.model}・{selectedMission.mode}・orchestrator ${selectedMission.usage.estimatedCostUsd}
            </span>
          </div>
          {missionStale ? (
            <div className="mc-stale-notice" role="status">
              <CircleAlert size={16} />
              <span>
                <strong>保存された履歴です。</strong> 現在のworkerは確認できないため、pollingを停止しています。新しいミッションを開始できます。
              </span>
            </div>
          ) : null}
          {selectedMission.planSummary ? (
            <p className="mc-plan-summary">
              <Radar size={14} /> 作戦: {selectedMission.planSummary}
            </p>
          ) : null}
          {selectedMission.error ? <p className="mc-message">{selectedMission.error}</p> : null}

          <WorkflowDiagram activeStep={activeStepIndex} statusText={selectedMission.planSummary || undefined} />

          <ol className="mc-steps">

            {selectedMission.steps.map((step, index) => {
              const agent = agentOf(step.agentId);
              return (
                <li key={`${step.agentId}-${index}`} className={`mc-step mc-step-${step.status}`}>
                  <AgentAvatar agentId={agent.agentId} name={agent.name} color={agent.color} size={44} />
                  <div className="mc-step-body">
                    <div className="mc-step-head">
                      <strong>{agent.name}</strong>
                      {step.origin === "adaptive" ? (
                        <span className="mc-origin-badge">
                          <GitBranchPlus size={12} /> 追加調査
                        </span>
                      ) : null}
                      <StepStatusBadge status={step.status} />
                      {step.runId ? <code className="mc-run-id">run {step.runId.slice(0, 8)}</code> : null}
                    </div>
                    <p className="mc-step-reason">{step.reason}</p>
                    {step.observed ? (
                      <p className="mc-step-observed">
                        {step.observed.findingsTotal} 件を確認、{step.observed.accepted} 件を採用
                        {step.observed.topFinding ? `。${step.observed.topFinding}` : ""}
                      </p>
                    ) : null}
                    {step.decision ? <p className="mc-step-decision">判断: {step.decision}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>

          {selectedMission.report ? (
            <div className={`mc-report mc-report-${selectedMission.report.verdict}`}>
              <div className="mc-report-head">
                {(() => {
                  const meta = VERDICT_META[selectedMission.report.verdict] ?? VERDICT_META.partial;
                  const Icon = meta.icon;
                  return (
                    <span className={`mc-verdict mc-verdict-${selectedMission.report.verdict}`}>
                      <Icon size={14} /> {meta.label}
                    </span>
                  );
                })()}
                <strong className="mc-report-headline">{selectedMission.report.headline}</strong>
              </div>
              <p className="mc-report-summary">{selectedMission.report.summary}</p>
              {selectedMission.report.keyFindings.length > 0 ? (
                <ul className="mc-findings">
                  {selectedMission.report.keyFindings.map((finding, index) => (
                    <li key={`${finding.runId}-${index}`} className={finding.citationValid ? "" : "is-invalid"}>
                      <span className={`ops-severity ops-severity-${finding.severity}`}>{SEVERITY_LABELS[finding.severity]}</span>
                      <span className="mc-finding-agent">{agentOf(finding.agentId).name}</span>
                      <span className="mc-finding-title">{finding.title}</span>
                      <code className="mc-run-id">{finding.runId.slice(0, 8)}</code>
                      <span className={`mc-citation${finding.citationValid ? "" : " is-invalid"}`}>
                        <ShieldCheck size={12} /> {finding.citationValid ? "引用検証済" : "引用無効"}
                      </span>
                      <p className="mc-finding-action">{finding.action}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              {selectedMission.report.nextActions.length > 0 ? (
                <ol className="mc-next-actions">
                  {selectedMission.report.nextActions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}

          <ResultInspector
            data={selectedMission}
            logs={[
              ...selectedMission.phases.map((phase) => ({
                at: phase.at,
                label: phase.phase,
                detail: phase.detail,
                tone: phase.status === "error" ? ("error" as const) : ("default" as const)
              })),
              ...selectedMission.steps.map((step) => ({
                at: selectedMission.finishedAt ?? selectedMission.startedAt,
                label: `${agentOf(step.agentId).name} / ${STEP_STATUS_LABELS[step.status] ?? step.status}`,
                detail: step.decision ?? step.observed?.summary ?? step.reason,
                tone: step.status === "failed" ? ("error" as const) : step.status === "completed" ? ("success" as const) : ("default" as const)
              }))
            ]}
          />
        </div>
      ) : (
        <p className="mc-empty">まだ調査履歴がありません。目的を書いて「調査を開始」を押すと、調査役が動き始めます。</p>
      )}
    </section>
  );
}
