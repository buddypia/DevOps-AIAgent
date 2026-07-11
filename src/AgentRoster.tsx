import { useMemo } from "react";
import { Award, History } from "lucide-react";

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
              <AgentAvatar agentId={agent.agentId} name={agent.name} color={agent.color} size={56} />
              <div className="roster-title">
                <p className="roster-name">{agent.name}</p>
                <p className="roster-handle">{agent.handle}</p>
              </div>
              <span className={`roster-rank roster-rank-${record?.rank ?? "-"}`} title="ランクは実行履歴 (受入所見数×受入率) から自動算出">
                <Award size={13} /> {record?.rank ?? "-"}
              </span>
            </div>
            <p className="roster-headline">{market?.headline ?? ""}</p>
            <dl className="roster-stats">
              <div>
                <dt>実行ラン</dt>
                <dd>{record?.runs ?? 0}</dd>
              </div>
              <div>
                <dt>受入所見</dt>
                <dd>{record?.accepted ?? 0}</dd>
              </div>
              <div>
                <dt>受入率</dt>
                <dd>{formatRate(record?.acceptRate ?? null)}</dd>
              </div>
              <div>
                <dt>checker確認率</dt>
                <dd>{formatRate(record?.confirmRate ?? null)}</dd>
              </div>
            </dl>
            <div className="roster-foot">
              <span className="roster-last">
                <History size={12} /> {formatLastRun(record?.lastRunAt ?? null)}
              </span>
              <span className="roster-cost">{record?.avgCostUsd != null ? `~$${record.avgCostUsd.toFixed(4)}/run` : "コスト実績なし"}</span>
              <button type="button" className={`btn-hire${hired ? " is-active" : ""}`} onClick={() => onToggleHire(agent.agentId)} disabled={busy}>
                {hired ? "解雇" : "雇う"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
