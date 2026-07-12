import { useMemo } from "react";

import AgentAvatar from "./AgentAvatar.js";

import type { AgentIdentity } from "./MissionControl.js";
import type { AgentTrackRecordView } from "./missionTypes.js";

const TOP_N = 3;

interface RosterHighlightsProps {
  agents: AgentIdentity[];
  stats: Map<string, AgentTrackRecordView>;
}

// Bento Grid（トップの状態サマリー）用。採用率の高い上位N件だけを抜粋する。
// 全件・詳細な実績は下部の調査役一覧セクション（AgentRoster）が担う。
export default function RosterHighlights({ agents, stats }: RosterHighlightsProps) {
  const top = useMemo(() => {
    return [...agents]
      .map((agent) => ({ agent, record: stats.get(agent.agentId) }))
      .filter(({ record }) => (record?.acceptRate ?? 0) > 0)
      .sort((a, b) => (b.record?.acceptRate ?? 0) - (a.record?.acceptRate ?? 0))
      .slice(0, TOP_N);
  }, [agents, stats]);

  return (
    <article className="bento-roster">
      <p className="bento-roster-label">調査役ランキング</p>
      {top.length === 0 ? (
        <p className="bento-roster-empty">実行すると自動でランキングされます</p>
      ) : (
        top.map(({ agent, record }) => (
          <div className="bento-roster-item" key={agent.agentId}>
            <AgentAvatar agentId={agent.agentId} name={agent.name} color={agent.color} size={26} />
            <div className="bento-roster-title">
              <p className="bento-roster-name">{agent.name}</p>
              <p className="bento-roster-handle">{agent.handle}</p>
            </div>
            <span className="bento-roster-rate">{Math.round((record?.acceptRate ?? 0) * 100)}%</span>
          </div>
        ))
      )}
    </article>
  );
}
