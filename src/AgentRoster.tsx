import { useMemo } from "react";
import { History } from "lucide-react";

import AgentAvatar from "./AgentAvatar.js";
import { MARKET_AGENTS } from "./market.js";

import type { AgentIdentity } from "./MissionControl.js";
import type { AgentTrackRecordView } from "./missionTypes.js";

function formatRate(rate: number | null): string {
  return rate === null ? "未計測" : `${Math.round(rate * 100)}%`;
}

function formatLastRun(iso: string | null): string {
  if (!iso) return "実績なし";
  return new Date(iso).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

interface AgentRosterProps {
  agents: AgentIdentity[];
  stats: Map<string, AgentTrackRecordView>;
  hiredIds: Set<string>;
  busy: boolean;
  onToggleHire: (agentId: string) => void;
}

export default function AgentRoster({ agents, stats, hiredIds, busy, onToggleHire }: AgentRosterProps) {
  const marketById = useMemo(() => new Map(MARKET_AGENTS.map((agent) => [agent.id, agent])), []);

  return (
    <div className="roster-grid">
      {agents.map((agent) => {
        const market = marketById.get(agent.agentId);
        const record = stats.get(agent.agentId);
        const hired = hiredIds.has(agent.agentId);
        return (
          <article key={agent.agentId} className="roster-card" style={{ borderColor: hired ? agent.color : undefined }}>
            <div className="roster-head">
              <div className="roster-avatar-wrap">
                <AgentAvatar agentId={agent.agentId} name={agent.name} color={agent.color} size={56} />
                <span className={`roster-rank-badge roster-rank-${record?.rank ?? "-"}`} title="ランクは実行履歴の採用した指摘数と採用率から自動算出">
                  {record?.rank ?? "-"}
                </span>
              </div>
              <div className="roster-title">
                <p className="roster-name">{agent.name}</p>
                <p className="roster-handle">{agent.handle}</p>
              </div>
            </div>
            <div
              className="roster-record"
              title="採用率 = 引用ゲートを通過し、独立チェックで反証されなかった所見の割合。実行履歴から自動計算した実績です"
            >
              <div className="roster-record-main">
                <span className="roster-record-label">採用率</span>
                <strong className="roster-record-rate">{formatRate(record?.acceptRate ?? null)}</strong>
              </div>
              <div className="roster-record-bar" aria-hidden="true">
                <span style={{ width: `${Math.round((record?.acceptRate ?? 0) * 100)}%`, background: agent.color }} />
              </div>
              <p className="roster-record-detail">
                {record && record.findings > 0
                  ? `所見${record.findings}件中 ${record.accepted}件を採用`
                  : "実績なし — 実行すると自動で記録されます"}
              </p>
            </div>
            <p className="roster-headline">{market?.headline ?? ""}</p>
            <dl className="roster-stats">
              <div>
                <dt>実行回数</dt>
                <dd>{record?.runs ?? 0}</dd>
              </div>
              <div>
                <dt>再確認一致率</dt>
                <dd>{formatRate(record?.confirmRate ?? null)}</dd>
              </div>
            </dl>
            <div className="roster-foot">
              <span className="roster-last">
                <History size={12} /> {formatLastRun(record?.lastRunAt ?? null)}
              </span>
              <span className="roster-cost">{record?.avgCostUsd != null ? `~$${record.avgCostUsd.toFixed(4)}/run` : "コスト実績なし"}</span>
              <button type="button" className={`btn-hire${hired ? " is-active" : ""}`} onClick={() => onToggleHire(agent.agentId)} disabled={busy}>
                {hired ? "無効にする" : "有効にする"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
