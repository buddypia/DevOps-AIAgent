import type { OpsAgentRun } from "./opsAgent.js";

// ---------------------------------------------------------------------------
// 実績ベースのエージェント統計 — ハードコードされた能力値の代わりに、
// Firestoreに永続化された実ランの結果だけから評判を算出する。
// 「エージェントの評判は、実際に受け入れられた仕事でしか上がらない」
// ---------------------------------------------------------------------------

export type AgentTrackRecord = {
  agentId: string;
  runs: number;
  completed: number;
  failed: number;
  findings: number;
  accepted: number;
  confirmed: number;
  acceptRate: number | null;
  confirmRate: number | null;
  costUsd: number;
  avgCostUsd: number | null;
  lastRunAt: string | null;
  rank: "S" | "A" | "B" | "C" | "-";
};

// ランクは実績から自動算出 (受入所見数 × 受入率)。演出値ではない。
export function rankFromRecord(accepted: number, acceptRate: number | null): AgentTrackRecord["rank"] {
  if (accepted >= 10 && (acceptRate ?? 0) >= 0.7) return "S";
  if (accepted >= 6) return "A";
  if (accepted >= 3) return "B";
  if (accepted >= 1) return "C";
  return "-";
}

export function computeAgentStats(runs: OpsAgentRun[], agentIds: string[]): AgentTrackRecord[] {
  const byAgent = new Map<string, OpsAgentRun[]>();
  for (const run of runs) {
    const list = byAgent.get(run.agentId) ?? [];
    list.push(run);
    byAgent.set(run.agentId, list);
  }
  const allIds = [...new Set([...agentIds, ...byAgent.keys()])];
  return allIds.map((agentId) => {
    const agentRuns = byAgent.get(agentId) ?? [];
    const findings = agentRuns.flatMap((run) => run.findings);
    const accepted = findings.filter((finding) => finding.accepted).length;
    const confirmed = findings.filter((finding) => finding.checker.verdict === "confirmed").length;
    const costUsd = Number(agentRuns.reduce((sum, run) => sum + (run.usage?.estimatedCostUsd ?? 0), 0).toFixed(6));
    const acceptRate = findings.length > 0 ? Number((accepted / findings.length).toFixed(3)) : null;
    const lastRunAt = agentRuns.reduce<string | null>((latest, run) => (latest === null || run.startedAt > latest ? run.startedAt : latest), null);
    return {
      agentId,
      runs: agentRuns.length,
      completed: agentRuns.filter((run) => run.status === "completed").length,
      failed: agentRuns.filter((run) => run.status === "failed").length,
      findings: findings.length,
      accepted,
      confirmed,
      acceptRate,
      confirmRate: findings.length > 0 ? Number((confirmed / findings.length).toFixed(3)) : null,
      costUsd,
      avgCostUsd: agentRuns.length > 0 ? Number((costUsd / agentRuns.length).toFixed(6)) : null,
      lastRunAt,
      rank: rankFromRecord(accepted, acceptRate)
    };
  });
}
