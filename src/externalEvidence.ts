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

export const EXTERNAL_EVIDENCE_SKILL_ID = "external.evidence";
export const EXTERNAL_EVIDENCE_LOCK_TAG = "external-evidence-lock";
export const EXTERNAL_EVIDENCE_REQUIRED_SIGNAL = `${EXTERNAL_EVIDENCE_SKILL_ID}:tag:${EXTERNAL_EVIDENCE_LOCK_TAG}`;

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

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tone(status: string) {
  if (["external-ready", "passed"].includes(status)) return "good";
  if (["blocked", "missing"].includes(status)) return "bad";
  return "watch";
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
          ? "YouTubeまたはVimeoの公開動画URLを発行し、審査員が開ける状態で再検証する。Google Driveはbackup watch扱いに留める。"
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
      `curl -s ${base}/external-evidence | rg 'External Evidence Proof|Submission URL Probes'`,
      `curl -s ${base}/api/external-evidence | jq '{readiness, evidenceScore, finalUrlsReady: .a2aPayload.finalUrlsReady}'`,
      `curl -I ${normalized.find((probe) => probe.id === "github-url")?.url || "https://github.com/buddypia/DevOps-AIAgent"}`,
      `curl -s ${normalized.find((probe) => probe.id === "deployed-url")?.url || base}/api/healthz`,
      `curl -I ${normalized.find((probe) => probe.id === "protopedia-url")?.url || "https://protopedia.net/prototype/..."}`,
      `curl -I ${normalized.find((probe) => probe.id === "video-url")?.url || "https://youtu.be/..."}`,
      `curl -s -X POST ${base}/api/external-evidence -H 'Content-Type: application/json' --data '{"projectBrief":"A2A Cloud Run Gemini DevOps","selectedAgentIds":["market-broker","gemini-strategist","cloud-run-sre"],"protopediaUrl":"https://protopedia.net/prototype/...","videoUrl":"https://youtu.be/..."}'`
    ],
    a2aPayload: {
      method: "message/send",
      skill: EXTERNAL_EVIDENCE_SKILL_ID,
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
        externalEvidencePage: `${base}/external-evidence`,
        submissionLaunch: `${base}/api/submission-launch`,
        submissionRunway: `${base}/api/submission-runway`
      }
    }
  };
}

export function renderExternalEvidenceHtml(run: ExternalEvidenceRun) {
  const passed = run.probes.filter((probe) => probe.status === "passed").length;
  const missing = run.probes.filter((probe) => probe.status === "missing").length;
  const watch = run.probes.filter((probe) => probe.status === "watch").length;
  const metrics = [
    { label: "Readiness", value: run.readiness, status: run.readiness },
    { label: "Evidence Score", value: run.evidenceScore, status: run.readiness },
    { label: "Passed", value: `${passed} / ${run.probes.length}`, status: passed === run.probes.length ? "passed" : "watch" },
    { label: "Open Gaps", value: missing + watch, status: missing > 0 ? "missing" : watch > 0 ? "watch" : "passed" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const probes = run.probes
    .map(
      (probe) => `
        <article class="card ${tone(probe.status)}">
          <div>
            <strong>${escapeHtml(probe.label)}</strong>
            <span>${escapeHtml(probe.status)} / ${escapeHtml(probe.score)}</span>
          </div>
          <p>${escapeHtml(probe.evidence)}</p>
          <dl>
            <dt>URL</dt><dd>${probe.url ? `<a href="${escapeHtml(probe.url)}">${escapeHtml(probe.url)}</a>` : "missing"}</dd>
            <dt>Required</dt><dd>${escapeHtml(probe.required ? "yes" : "no")}</dd>
            <dt>Latency</dt><dd>${escapeHtml(probe.latencyMs === undefined ? "n/a" : `${probe.latencyMs}ms`)}</dd>
          </dl>
        </article>`
    )
    .join("");
  const actions =
    run.nextActions.length === 0
      ? `<li>All final submission URLs are externally reachable.</li>`
      : run.nextActions.map((action) => `<li><strong>${escapeHtml(action.label)}</strong> ${escapeHtml(action.action)} <small>${escapeHtml(action.proof)}</small></li>`).join("");
  const runbook = run.runbook.map((command) => `<li><code>${escapeHtml(command)}</code></li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>External Evidence Proof</title>
    <style>
      :root { color-scheme: light; --ink: #18201e; --muted: #5f6d68; --line: #d9e3dd; --paper: #fbfcfa; --panel: #fff; --green: #13715d; --mint: #e6f4ed; --amber: #8a620d; --amber-bg: #fff4d4; --coral: #b24735; --coral-bg: #fff0ec; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4rem); line-height: 1; letter-spacing: 0; max-width: 980px; }
      h2 { margin: 28px 0 10px; font-size: 1.12rem; }
      p { color: var(--muted); }
      .metrics, .grid { display: grid; gap: 12px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 22px; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .card, .panel { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 16px; box-shadow: 0 10px 24px rgba(24, 32, 30, .06); min-width: 0; }
      .metric span, .card span, dt { color: var(--muted); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.45rem; overflow-wrap: anywhere; }
      .card div { display: flex; gap: 12px; justify-content: space-between; align-items: start; }
      .card strong, .card p, .card small, dd, li, code { overflow-wrap: anywhere; }
      dl { display: grid; grid-template-columns: 90px minmax(0, 1fr); gap: 6px 10px; margin: 12px 0 0; }
      dt, dd { margin: 0; }
      .good { border-color: #a9d8c2; background: var(--mint); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #efb7aa; background: var(--coral-bg); }
      ol { margin: 8px 0 0; padding-left: 20px; }
      footer { padding: 20px 0 40px; color: var(--muted); }
      @media (max-width: 860px) { .metrics, .grid { grid-template-columns: 1fr; } .card div { display: block; } dl { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">External Evidence Proof</div>
      <h1>External Evidence Proof</h1>
      <p><strong>${escapeHtml(run.summary)}</strong></p>
      <p>${escapeHtml(run.hardTruth)}</p>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <h2>Submission URL Probes</h2>
      <section class="grid">${probes}</section>
      <h2>Next Actions</h2>
      <section class="panel"><ol>${actions}</ol></section>
      <h2>Runbook</h2>
      <section class="panel"><ol>${runbook}</ol></section>
    </main>
    <footer>${escapeHtml(run.id)} / generated ${escapeHtml(run.generatedAt)} / A2A skill ${EXTERNAL_EVIDENCE_SKILL_ID}</footer>
  </body>
</html>`;
}
