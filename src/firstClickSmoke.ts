import { FIRST_CLICK_PROOF_LINKS } from "./firstClick.js";

export type FirstClickSmokeStatus = "passed" | "watch" | "missing";
export type FirstClickSmokeReadiness = "smoke-passed" | "smoke-watch" | "smoke-failed";

export type FirstClickSmokeSentinel = {
  id: string;
  href: string;
  label: string;
  sentinel: string;
};

export type FirstClickSmokeProbe = FirstClickSmokeSentinel & {
  url: string;
  status: FirstClickSmokeStatus;
  score: number;
  evidence: string;
  latencyMs?: number;
};

export type FirstClickSmokeLock = {
  id: string;
  targetBaseUrl: string;
  smokeScore: number;
  readiness: FirstClickSmokeReadiness;
  headline: string;
  hardTruth: string;
  passedCount: number;
  watchCount: number;
  missingCount: number;
  probes: FirstClickSmokeProbe[];
  runbook: string[];
  a2aPayload: Record<string, unknown>;
};

export const FIRST_CLICK_SMOKE_SKILL_ID = "judge.first-click-smoke";
export const FIRST_CLICK_SMOKE_LOCK_TAG = "first-click-smoke-lock";
export const FIRST_CLICK_SMOKE_REQUIRED_SIGNAL = `${FIRST_CLICK_SMOKE_SKILL_ID}:tag:${FIRST_CLICK_SMOKE_LOCK_TAG}`;

export const FIRST_CLICK_SMOKE_SENTINELS: FirstClickSmokeSentinel[] = [
  { id: "judge-snapshot", href: "/judge-snapshot", label: "Judge Snapshot", sentinel: "Public Judge Snapshot" },
  { id: "winner-packet", href: "/winner-packet", label: "Winner Packet", sentinel: "Winner Proof Packet" },
  { id: "objection-arena", href: "/objection-arena", label: "Objection Arena", sentinel: "Objection Arena" },
  { id: "competitive-swot", href: "/competitive-swot", label: "Competitive SWOT", sentinel: "Competitive SWOT Snapshot" },
  { id: "mvp-readiness", href: "/mvp-readiness", label: "MVP Readiness", sentinel: "MVP Readiness Snapshot" },
  { id: "deploy-recovery", href: "/deploy-recovery", label: "Deploy Recovery", sentinel: "Deploy Recovery" },
  { id: "autonomy-snapshot", href: "/autonomy-snapshot", label: "Autonomy Snapshot", sentinel: "Autonomy Snapshot" },
  { id: "pilot-value", href: "/pilot-value", label: "Pilot Value", sentinel: "Pilot Value Snapshot" },
  { id: "recording-script", href: "/recording-script", label: "Recording Script", sentinel: "Recording Script" },
  { id: "architecture-pack", href: "/architecture-pack", label: "Architecture Pack", sentinel: "Architecture Pack" },
  { id: "submission-launch", href: "/submission-launch", label: "Submission Launch", sentinel: "Submission Launch Gate" },
  { id: "submission-assets", href: "/submission-assets", label: "Submission Assets", sentinel: "Submission Assets" }
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeBase(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readinessFor(input: { missingCount: number; watchCount: number; smokeScore: number }): FirstClickSmokeReadiness {
  if (input.missingCount > 0) return "smoke-failed";
  if (input.watchCount > 0 || input.smokeScore < 94) return "smoke-watch";
  return "smoke-passed";
}

export function firstClickSmokeSentinelIds() {
  return FIRST_CLICK_SMOKE_SENTINELS.map((sentinel) => sentinel.id);
}

export function buildFirstClickSmokeLock(input: {
  targetBaseUrl: string;
  probes: FirstClickSmokeProbe[];
  generatedAt?: string;
}): FirstClickSmokeLock {
  const targetBaseUrl = normalizeBase(input.targetBaseUrl);
  const probesById = new Map(input.probes.map((probe) => [probe.id, probe]));
  const probes = FIRST_CLICK_SMOKE_SENTINELS.map((sentinel) => {
    const observed = probesById.get(sentinel.id);
    return (
      observed ?? {
        ...sentinel,
        url: `${targetBaseUrl}${sentinel.href}`,
        status: "missing" as const,
        score: 24,
        evidence: "Smoke probe did not run."
      }
    );
  });
  const smokeScore = Math.round(clamp(average(probes.map((probe) => probe.score))));
  const passedCount = probes.filter((probe) => probe.status === "passed").length;
  const watchCount = probes.filter((probe) => probe.status === "watch").length;
  const missingCount = probes.filter((probe) => probe.status === "missing").length;
  const readiness = readinessFor({ missingCount, watchCount, smokeScore });

  return {
    id: `first-click-smoke-${smokeScore}-${readiness}`,
    targetBaseUrl,
    smokeScore,
    readiness,
    headline:
      readiness === "smoke-passed"
        ? "All first-click proof pages return their real judge evidence."
        : readiness === "smoke-watch"
          ? "First-click proof pages are reachable, but at least one page needs review before recording."
          : "A first-click proof URL is returning fallback or missing content; judges may not see the evidence.",
    hardTruth:
      "A 200 HTML response is not enough. The page must contain its own proof title, otherwise Cloud Run can silently serve the SPA fallback while the judge sees no proof.",
    passedCount,
    watchCount,
    missingCount,
    probes,
    runbook: [
      `curl -s ${targetBaseUrl}/api/first-click-smoke | jq '{readiness, smokeScore, passedCount, missingCount}'`,
      ...FIRST_CLICK_SMOKE_SENTINELS.map((sentinel) => `curl -s ${targetBaseUrl}${sentinel.href} | rg '${sentinel.sentinel}'`)
    ],
    a2aPayload: {
      method: "message/send",
      skill: FIRST_CLICK_SMOKE_SKILL_ID,
      id: `first-click-smoke-${smokeScore}-${readiness}`,
      readiness,
      smokeScore,
      targetBaseUrl,
      passedCount,
      missingCount,
      probes: probes.map((probe) => ({
        id: probe.id,
        status: probe.status,
        score: probe.score,
        url: probe.url,
        sentinel: probe.sentinel
      })),
      endpoints: {
        firstClickSmoke: `${targetBaseUrl}/api/first-click-smoke`,
        firstClickSmokePage: `${targetBaseUrl}/first-click-smoke`
      }
    }
  };
}

export function assertFirstClickSmokeCoverage() {
  const smokeIds = firstClickSmokeSentinelIds();
  const linkIds = FIRST_CLICK_PROOF_LINKS.map((link) => link.id);
  return linkIds.every((id) => smokeIds.includes(id)) && smokeIds.every((id) => linkIds.includes(id));
}

function tone(status: string) {
  if (["smoke-passed", "passed"].includes(status)) return "good";
  if (["smoke-failed", "missing"].includes(status)) return "bad";
  return "watch";
}

export function renderFirstClickSmokeHtml(lock: FirstClickSmokeLock) {
  const probes = lock.probes
    .map(
      (probe) => `
        <article class="probe ${tone(probe.status)}">
          <div><strong>${escapeHtml(probe.label)}</strong><span>${escapeHtml(probe.status)} / ${escapeHtml(probe.score)}</span></div>
          <p>${escapeHtml(probe.evidence)}</p>
          <dl>
            <dt>Sentinel</dt><dd>${escapeHtml(probe.sentinel)}</dd>
            <dt>URL</dt><dd><a href="${escapeHtml(probe.url)}">${escapeHtml(probe.url)}</a></dd>
          </dl>
        </article>`
    )
    .join("");
  const runbook = lock.runbook.map((command) => `<li><code>${escapeHtml(command)}</code></li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>First-Click Smoke Lock</title>
    <style>
      :root { color-scheme: light; --ink: #17201d; --muted: #5f6965; --line: #dce5df; --paper: #fbfcfa; --panel: #fff; --green: #13715d; --mint: #e6f4ed; --amber: #8a620d; --amber-bg: #fff4d4; --coral: #b24735; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; }
      header, main, footer { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.2rem); line-height: 1; letter-spacing: 0; max-width: 980px; }
      header p { color: var(--muted); max-width: 860px; }
      .metrics, .probes { display: grid; gap: 12px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 22px; }
      .metric, .probe, .runbook { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 16px; box-shadow: 0 10px 24px rgba(23, 32, 29, .06); }
      .metric span, .probe span { color: var(--muted); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.45rem; }
      .probes { grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 18px 0; }
      .probe div { display: flex; gap: 12px; justify-content: space-between; align-items: start; }
      .probe strong, .probe p, .probe dd, code { overflow-wrap: anywhere; }
      .probe dl { display: grid; grid-template-columns: 90px 1fr; gap: 6px 12px; color: var(--muted); }
      .probe dt { font-weight: 900; color: var(--ink); }
      .good { border-color: #a9d8c2; background: var(--mint); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #efb7aa; background: #fff0ec; }
      footer { padding: 20px 0 40px; color: var(--muted); }
      @media (max-width: 860px) { .metrics, .probes { grid-template-columns: 1fr; } .probe div, .probe dl { display: block; } }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">First-Click Smoke Lock</div>
      <h1>${escapeHtml(lock.headline)}</h1>
      <p>${escapeHtml(lock.hardTruth)}</p>
      <section class="metrics">
        <div class="metric ${tone(lock.readiness)}"><span>Readiness</span><strong>${escapeHtml(lock.readiness)}</strong></div>
        <div class="metric"><span>Smoke Score</span><strong>${escapeHtml(lock.smokeScore)}</strong></div>
        <div class="metric ${lock.missingCount === 0 ? "good" : "bad"}"><span>Passed</span><strong>${escapeHtml(lock.passedCount)} / ${escapeHtml(lock.probes.length)}</strong></div>
        <div class="metric ${lock.missingCount === 0 ? "good" : "bad"}"><span>Missing</span><strong>${escapeHtml(lock.missingCount)}</strong></div>
      </section>
    </header>
    <main>
      <section class="probes">${probes}</section>
      <section class="runbook"><strong>Runbook</strong><ol>${runbook}</ol></section>
    </main>
    <footer>Use this before recording or submission. It catches SPA fallback responses that still return HTTP 200.</footer>
  </body>
</html>`;
}
