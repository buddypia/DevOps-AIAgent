export type ExternalEvidenceStatus = "passed" | "watch" | "missing";
export type ExternalEvidenceReadiness = "external-ready" | "needs-external-urls" | "blocked";

export type ExternalEvidenceProbe = {
  id: "github-url" | "deployed-url" | "protopedia-url" | "video-url";
  label: string;
  status: ExternalEvidenceStatus;
  score: number;
  url: string;
  evidence: string;
  latencyMs?: number;
  required: boolean;
};

export type ExternalEvidenceAction = {
  id: string;
  label: string;
  priority: "now" | "next";
  action: string;
  proof: string;
};

export type ExternalEvidenceRun = {
  id: string;
  generatedAt: string;
  evidenceScore: number;
  readiness: ExternalEvidenceReadiness;
  summary: string;
  hardTruth: string;
  probes: ExternalEvidenceProbe[];
  nextActions: ExternalEvidenceAction[];
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

function statusScore(status: ExternalEvidenceStatus) {
  if (status === "passed") return 100;
  if (status === "watch") return 72;
  return 30;
}

function readinessFrom(probes: ExternalEvidenceProbe[]): ExternalEvidenceReadiness {
  const coreBlocked = probes.some((probe) => probe.required && probe.status === "missing" && (probe.id === "github-url" || probe.id === "deployed-url"));
  if (coreBlocked) return "blocked";
  if (probes.some((probe) => probe.status === "missing")) return "needs-external-urls";
  if (probes.some((probe) => probe.status === "watch")) return "needs-external-urls";
  return "external-ready";
}

function actionFromProbe(probe: ExternalEvidenceProbe): ExternalEvidenceAction {
  const finalAsset = probe.id === "protopedia-url" || probe.id === "video-url";
  return {
    id: probe.id,
    label: probe.label,
    priority: probe.status === "missing" || finalAsset ? "now" : "next",
    action:
      probe.id === "protopedia-url"
        ? "ProtoPedia作品URLを公開し、findy_hackathonタグと構成図を確認してから再検証する。"
        : probe.id === "video-url"
          ? "YouTube/Vimeo/Google Driveの公開動画URLを発行し、審査員が開ける状態で再検証する。"
          : `${probe.label}を公開URLで再検証し、提出フォームに貼れる状態へ戻す。`,
    proof: probe.evidence
  };
}

export function buildExternalEvidenceRun(input: {
  baseUrl: string;
  probes: ExternalEvidenceProbe[];
  generatedAt?: string;
}): ExternalEvidenceRun {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const normalized = input.probes.map((probe) => ({
    ...probe,
    score: Math.round(clamp(probe.score || statusScore(probe.status)))
  }));
  const evidenceScore = Math.round(clamp(average(normalized.map((probe) => probe.score))));
  const readiness = readinessFrom(normalized);
  const passed = normalized.filter((probe) => probe.status === "passed").length;
  const missing = normalized.filter((probe) => probe.status === "missing").length;
  const watch = normalized.filter((probe) => probe.status === "watch").length;
  const nextActions = normalized.filter((probe) => probe.status !== "passed").map(actionFromProbe);
  const base = input.baseUrl.replace(/\/$/, "");
  const id = `external-evidence-${evidenceScore}-${readiness}`;

  return {
    id,
    generatedAt,
    evidenceScore,
    readiness,
    summary: `${passed}/${normalized.length} external submission probes passed; ${watch} watch; ${missing} missing.`,
    hardTruth:
      readiness === "external-ready"
        ? "公開GitHub、Cloud Run、ProtoPedia、動画URLが審査員から開ける外部証拠として揃っています。"
        : readiness === "blocked"
          ? "公開GitHubまたはCloud Run URLが開けないため、提出前に復旧が必要です。"
          : "本体は公開済みでも、ProtoPedia作品URLと動画URLが開けるまで提出完了ではありません。",
    probes: normalized,
    nextActions,
    runbook: [
      `curl -I ${normalized.find((probe) => probe.id === "github-url")?.url || "https://github.com/buddypia/DevOps-AIAgent"}`,
      `curl -s ${normalized.find((probe) => probe.id === "deployed-url")?.url || base}/api/healthz`,
      `curl -I ${normalized.find((probe) => probe.id === "protopedia-url")?.url || "https://protopedia.net/prototype/..."}`,
      `curl -I ${normalized.find((probe) => probe.id === "video-url")?.url || "https://youtu.be/..."}`,
      `curl -s -X POST ${base}/api/external-evidence -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"],"protopediaUrl":"https://protopedia.net/prototype/...","videoUrl":"https://youtu.be/..."}'`
    ],
    a2aPayload: {
      method: "message/send",
      skill: "external.evidence",
      id,
      readiness,
      evidenceScore,
      finalUrlsReady: readiness === "external-ready",
      probes: normalized.map((probe) => ({
        id: probe.id,
        status: probe.status,
        score: probe.score,
        url: probe.url || null
      })),
      nextActions: nextActions.map((action) => ({
        id: action.id,
        priority: action.priority,
        action: action.action
      })),
      endpoints: {
        externalEvidence: `${base}/api/external-evidence`,
        submissionLaunch: `${base}/api/submission-launch`,
        submissionRunway: `${base}/api/submission-runway`
      }
    }
  };
}
