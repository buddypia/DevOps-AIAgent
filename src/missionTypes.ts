// サーバー server/missionAgent.ts の Mission 型のクライアント側ミラー
// (クライアント/サーバー分離のため、API レスポンス形状のみを写像する)

export type MissionStepView = {
  agentId: string;
  input: string;
  reason: string;
  origin: "plan" | "adaptive";
  status: "planned" | "running" | "completed" | "failed" | "skipped";
  runId?: string;
  observed?: {
    serviceHealth: string;
    summary: string;
    findingsTotal: number;
    accepted: number;
    topFinding?: string;
  };
  decision?: string;
};

export type MissionReportFindingView = {
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  agentId: string;
  runId: string;
  action: string;
  citationValid: boolean;
};

export type MissionReportView = {
  verdict: "achieved" | "partial" | "blocked";
  headline: string;
  summary: string;
  keyFindings: MissionReportFindingView[];
  nextActions: string[];
};

export type MissionView = {
  id: string;
  goal: string;
  trigger: "web" | "a2a";
  status: "planning" | "running" | "completed" | "failed";
  planSummary: string;
  phases: Array<{ phase: string; status: "done" | "error"; detail: string; at: string }>;
  steps: MissionStepView[];
  report: MissionReportView | null;
  usage: { promptTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number };
  model: string;
  mode: "api-key" | "vertex";
  error?: string;
  startedAt: string;
  finishedAt?: string;
};

export type AgentTrackRecordView = {
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
