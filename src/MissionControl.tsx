import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleAlert, ClipboardCheck, GitBranchPlus, Radar, Rocket, ShieldCheck } from "lucide-react";

import AgentAvatar from "./AgentAvatar.js";
import { MISSION_TEMPLATES } from "./missionTemplates.js";

import type { MissionView } from "./missionTypes.js";

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
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  const selectedMission = useMemo(
    () => missions.find((mission) => mission.id === selectedMissionId) ?? missions[0] ?? null,
    [missions, selectedMissionId]
  );
  const missionActive = selectedMission ? selectedMission.status === "planning" || selectedMission.status === "running" : false;

  const refreshList = useCallback(async () => {
    try {
      const response = await fetch("/api/missions?limit=8");
      const body = (await response.json()) as { missions?: MissionView[] };
      setMissions(body.missions ?? []);
    } catch {
      // 一覧取得失敗は致命的ではない (次のポーリングで再試行)
    }
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  // アクティブミッションのポーリング — 完了/失敗で親へ通知 (実績・ラン一覧の更新)
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
        setMessage(body.message ?? body.error ?? "ミッションを開始できませんでした。");
        return;
      }
      setSelectedMissionId(body.missionId);
      await refreshList();
    } catch {
      setMessage("ミッションAPIへの接続に失敗しました。");
    } finally {
      setStarting(false);
    }
  }

  const agentOf = (agentId: string): AgentIdentity => agents.get(agentId) ?? { agentId, name: agentId, handle: "", color: "#3b82f6" };

  return (
    <section className="mission-control" aria-label="Mission Control">
      <div className="mc-input-panel">
        <div className="mc-template-row" role="group" aria-label="ミッションテンプレート">
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
          placeholder="達成したい目標を書く — 例: 本番サービスの稼働リスクを総点検して"
          aria-label="ミッションの目標"
        />
        <div className="mc-start-row">
          <button type="button" className="btn-primary mc-start" onClick={handleStart} disabled={starting || missionActive || goal.trim().length < 8}>
            <Rocket size={16} /> {missionActive ? "ミッション実行中…" : starting ? "起動中…" : "ミッション開始"}
          </button>
          <p className="mc-start-hint">
            オーケストレーターが専門エージェントを自律選抜し、実実行 → 観察 → 適応 → 統合レポートまで回します。
            A2Aからも <code>mission.execute</code> で起動可能。
          </p>
        </div>
        {message ? <p className="mc-message">{message}</p> : null}
      </div>

      {missions.length > 0 ? (
        <div className="mc-history" role="tablist" aria-label="ミッション履歴">
          {missions.map((mission) => (
            <button
              key={mission.id}
              type="button"
              className={`mc-history-chip${selectedMission?.id === mission.id ? " is-active" : ""}`}
              onClick={() => setSelectedMissionId(mission.id)}
            >
              <span className={`mc-status mc-status-${mission.status}`}>{MISSION_STATUS_LABELS[mission.status]}</span>
              <span className="mc-history-goal">{mission.goal.slice(0, 42)}…</span>
              <span className="mc-history-time">{new Date(mission.startedAt).toLocaleTimeString("ja-JP")}</span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedMission ? (
        <div className="mc-live" aria-live="polite">
          <div className="mc-live-head">
            <span className={`mc-status mc-status-${selectedMission.status}`}>{MISSION_STATUS_LABELS[selectedMission.status]}</span>
            <p className="mc-live-goal">{selectedMission.goal}</p>
            <span className="mc-live-meta">
              {selectedMission.model}・{selectedMission.mode}・orchestrator ${selectedMission.usage.estimatedCostUsd}
            </span>
          </div>
          {selectedMission.planSummary ? (
            <p className="mc-plan-summary">
              <Radar size={14} /> 作戦: {selectedMission.planSummary}
            </p>
          ) : null}
          {selectedMission.error ? <p className="mc-message">{selectedMission.error}</p> : null}

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
                          <GitBranchPlus size={12} /> 適応追加
                        </span>
                      ) : null}
                      <StepStatusBadge status={step.status} />
                      {step.runId ? <code className="mc-run-id">run {step.runId.slice(0, 8)}</code> : null}
                    </div>
                    <p className="mc-step-reason">{step.reason}</p>
                    {step.observed ? (
                      <p className="mc-step-observed">
                        所見 {step.observed.findingsTotal} 件中 {step.observed.accepted} 件受入
                        {step.observed.topFinding ? ` — ${step.observed.topFinding}` : ""}
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
                      <span className={`ops-severity ops-severity-${finding.severity}`}>{finding.severity}</span>
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

          <details className="mc-phases">
            <summary>オーケストレーターの監査ログ ({selectedMission.phases.length}件)</summary>
            {selectedMission.phases.map((phase, index) => (
              <p key={`${phase.phase}-${index}`} className={`mc-phase-row${phase.status === "error" ? " is-error" : ""}`}>
                <code>{new Date(phase.at).toLocaleTimeString("ja-JP")}</code> <strong>{phase.phase}</strong> {phase.detail}
              </p>
            ))}
          </details>
        </div>
      ) : (
        <p className="mc-empty">まだミッションがありません。目標を書いて「ミッション開始」を押すと、オーケストレーターが動き出します。</p>
      )}
    </section>
  );
}
