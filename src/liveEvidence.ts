export type LiveEvidenceStatus = "passed" | "watch" | "missing";
export type LiveEvidenceReadiness = "live-ready" | "watch" | "blocked";

export type LiveEvidenceProbe = {
  id: string;
  label: string;
  status: LiveEvidenceStatus;
  score: number;
  url: string;
  evidence: string;
  latencyMs?: number;
  required: boolean;
};

export type LiveEvidenceAction = {
  id: string;
  label: string;
  priority: "now" | "next";
  action: string;
  proof: string;
};

export type LiveEvidenceRun = {
  id: string;
  generatedAt: string;
  evidenceScore: number;
  readiness: LiveEvidenceReadiness;
  summary: string;
  hardTruth: string;
  probes: LiveEvidenceProbe[];
  nextActions: LiveEvidenceAction[];
  runbook: string[];
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statusScore(status: LiveEvidenceStatus) {
  if (status === "passed") return 100;
  if (status === "watch") return 72;
  return 30;
}

function readinessFrom(probes: LiveEvidenceProbe[], score: number): LiveEvidenceReadiness {
  if (probes.some((probe) => probe.required && probe.status === "missing")) return "blocked";
  if (score >= 92 && probes.every((probe) => probe.status === "passed")) return "live-ready";
  return "watch";
}

function actionFromProbe(probe: LiveEvidenceProbe): LiveEvidenceAction {
  return {
    id: probe.id,
    label: probe.label,
    priority: probe.required || probe.status === "missing" ? "now" : "next",
    action:
      probe.status === "missing"
        ? `${probe.label} を公開URLで再検証し、失敗ログを直す。`
        : `${probe.label} のwatch状態をJudge Proofに貼れる証拠へ上げる。`,
    proof: probe.evidence
  };
}

export function buildLiveEvidenceRun(input: {
  baseUrl: string;
  probes: LiveEvidenceProbe[];
  generatedAt?: string;
}): LiveEvidenceRun {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const normalized = input.probes.map((probe) => ({
    ...probe,
    score: Math.round(clamp(probe.score || statusScore(probe.status)))
  }));
  const evidenceScore = Math.round(clamp(average(normalized.map((probe) => probe.score))));
  const readiness = readinessFrom(normalized, evidenceScore);
  const passed = normalized.filter((probe) => probe.status === "passed").length;
  const watch = normalized.filter((probe) => probe.status === "watch").length;
  const missing = normalized.filter((probe) => probe.status === "missing").length;
  const nextActions = normalized.filter((probe) => probe.status !== "passed").map(actionFromProbe);
  const base = input.baseUrl.replace(/\/$/, "");
  const id = `live-evidence-${evidenceScore}-${readiness}`;

  return {
    id,
    generatedAt,
    evidenceScore,
    readiness,
    summary: `${passed}/${normalized.length} live probes passed; ${watch} watch; ${missing} missing.`,
    hardTruth:
      readiness === "live-ready"
        ? "Cloud Run、Agent Card、A2A、Squad Optimizer、CIが公開環境で同時に証明できています。"
        : readiness === "blocked"
          ? "必須の公開証拠が落ちています。審査動画の前に公開URLまたはCIを直す必要があります。"
          : "公開環境は動いていますが、watchの証拠を提出直前にもう一段強くできます。",
    probes: normalized,
    nextActions,
    runbook: [
      `curl -s ${base}/api/healthz`,
      `curl -s ${base}/.well-known/agent-card.json`,
      `curl -s -X POST ${base}/api/squad-optimizer -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"],"budget":140,"maxSquadSize":4}'`,
      `curl -s -X POST ${base}/a2a -H 'Content-Type: application/json' --data '{"method":"message/send","params":{"text":"A2A Cloud Run Gemini DevOps"}}'`,
      "curl -s https://api.github.com/repos/buddypia/DevOps-AIAgent/actions/workflows/ci.yml/runs?branch=main\\&per_page=1"
    ],
    a2aPayload: {
      method: "message/send",
      skill: "evidence.monitor",
      id,
      readiness,
      evidenceScore,
      probes: normalized.map((probe) => ({
        id: probe.id,
        status: probe.status,
        score: probe.score,
        url: probe.url
      })),
      nextActions: nextActions.map((action) => ({
        id: action.id,
        priority: action.priority,
        action: action.action
      }))
    }
  };
}
