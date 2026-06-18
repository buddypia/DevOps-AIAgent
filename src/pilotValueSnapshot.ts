import type { ImpactCase, ImpactMetric, PersonaImpact } from "./impact.js";
import type { PilotEconomics, PilotEconomicsStatus } from "./pilotEconomics.js";
import type { UserPilotLab, UserPilotPath, UserPilotTaskStatus } from "./userPilot.js";

export type PilotValueSnapshotReadiness = "pilot-value-ready" | "pilot-value-watch" | "pilot-value-blocked";

export type PilotValueSnapshotLink = {
  id: string;
  label: string;
  method: "GET" | "POST";
  url: string;
  purpose: string;
};

export type PilotValueSnapshot = {
  id: string;
  generatedAt: string;
  readiness: PilotValueSnapshotReadiness;
  headline: string;
  hardTruth: string;
  summary: {
    impactScore: number;
    pilotScore: number;
    economicsScore: number;
    paybackDays: number;
    monthlyValueYen: number;
    savedHoursPerCycle: number;
    timeToValueSeconds: number;
    evidenceLockReadiness: PilotEconomics["evidenceLock"]["readiness"];
    personaCount: number;
    clearCheckCount: number;
    buyerObjectionCount: number;
  };
  links: PilotValueSnapshotLink[];
  personas: PersonaImpact[];
  impactMetrics: ImpactMetric[];
  pilotPaths: UserPilotPath[];
  economics: PilotEconomics["unitEconomics"];
  evidenceLock: PilotEconomics["evidenceLock"];
  buyerObjections: PilotEconomics["buyerObjections"];
  pilotPlan: PilotEconomics["pilotPlan"];
  judgeScript: string[];
  a2aPayload: Record<string, unknown>;
};

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

function endpoint(baseUrl: string, path: string) {
  return `${normalizeBase(baseUrl)}${path}`;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readinessFrom(input: {
  impactCase: ImpactCase;
  userPilot: UserPilotLab;
  pilotEconomics: PilotEconomics;
}): PilotValueSnapshotReadiness {
  if (
    input.impactCase.posture === "not-credible" ||
    input.userPilot.readiness === "needs-redesign" ||
    input.pilotEconomics.posture === "not-economic" ||
    input.pilotEconomics.evidenceLock.readiness === "blocked"
  ) {
    return "pilot-value-blocked";
  }
  if (
    input.impactCase.posture === "pilot-ready" &&
    input.userPilot.readiness === "pilot-ready" &&
    input.pilotEconomics.posture === "investment-ready" &&
    input.pilotEconomics.evidenceLock.readiness === "buyer-ready"
  ) {
    return "pilot-value-ready";
  }
  return "pilot-value-watch";
}

function headlineFor(readiness: PilotValueSnapshotReadiness) {
  if (readiness === "pilot-value-ready") return "実用性、初回体験、導入採算を審査員がGETで確認できます。";
  if (readiness === "pilot-value-watch") return "実用性の証拠はあります。watch項目を提出前に補強します。";
  return "実用性または導入判断にblocked証拠があります。";
}

function hardTruthFor(readiness: PilotValueSnapshotReadiness) {
  if (readiness === "pilot-value-ready") {
    return "開発リード、Platform/SRE、提出者の3 persona、回収日数、買い手反論、公開証拠が同じ判断ページで閉じています。";
  }
  if (readiness === "pilot-value-watch") {
    return "価値仮説を主張で終わらせず、Impact/User Pilot/Pilot Economicsの残watchを明示します。";
  }
  return "スコアやROIを盛っても、初回利用・安全境界・回収日数のblockedがある限りMVPの実用性は証明できません。";
}

function statusTone(status: string) {
  if (["pilot-value-ready", "pilot-ready", "investment-ready", "buyer-ready", "clear"].includes(status)) return "good";
  if (["pilot-value-blocked", "not-credible", "needs-redesign", "not-economic", "blocked"].includes(status)) return "bad";
  return "watch";
}

function formatYen(value: number) {
  return `${value.toLocaleString("ja-JP")}円`;
}

export function buildPilotValueSnapshot(input: {
  baseUrl: string;
  impactCase: ImpactCase;
  userPilot: UserPilotLab;
  pilotEconomics: PilotEconomics;
  generatedAt?: string;
}): PilotValueSnapshot {
  const baseUrl = normalizeBase(input.baseUrl);
  const readiness = readinessFrom(input);
  const clearCheckCount = input.pilotEconomics.evidenceLock.checks.filter((check) => check.status === "clear").length;
  const pilotValueUrl = endpoint(baseUrl, "/pilot-value");
  const pilotValueJsonUrl = endpoint(baseUrl, "/api/pilot-value");
  const impactCaseUrl = endpoint(baseUrl, "/api/impact-case");
  const userPilotUrl = endpoint(baseUrl, "/api/user-pilot");
  const pilotEconomicsUrl = endpoint(baseUrl, "/api/pilot-economics");
  const observabilityOracleUrl = endpoint(baseUrl, "/api/observability-oracle");

  return {
    id: `pilot-value-${input.impactCase.impactScore}-${input.userPilot.pilotScore}-${input.pilotEconomics.economicsScore}-${readiness}`,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    readiness,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness),
    summary: {
      impactScore: input.impactCase.impactScore,
      pilotScore: input.userPilot.pilotScore,
      economicsScore: input.pilotEconomics.economicsScore,
      paybackDays: input.pilotEconomics.unitEconomics.paybackDays,
      monthlyValueYen: input.pilotEconomics.unitEconomics.monthlyValueYen,
      savedHoursPerCycle: input.pilotEconomics.unitEconomics.savedHoursPerCycle,
      timeToValueSeconds: input.userPilot.timeToValueSeconds,
      evidenceLockReadiness: input.pilotEconomics.evidenceLock.readiness,
      personaCount: input.impactCase.personas.length,
      clearCheckCount,
      buyerObjectionCount: input.pilotEconomics.buyerObjections.length
    },
    links: [
      {
        id: "pilot-value",
        label: "Pilot Value Snapshot",
        method: "GET",
        url: pilotValueUrl,
        purpose: "実用性、初回体験、導入採算を審査員が直接読むHTML証拠。"
      },
      {
        id: "pilot-value-json",
        label: "Pilot Value JSON",
        method: "GET",
        url: pilotValueJsonUrl,
        purpose: "A2Aや自動検証で読む実用性スナップショット。"
      },
      {
        id: "impact-case",
        label: "Impact Case",
        method: "POST",
        url: impactCaseUrl,
        purpose: "対象ユーザー、時間短縮、提出信頼度、運用リスクを再計算する。"
      },
      {
        id: "user-pilot",
        label: "User Pilot",
        method: "POST",
        url: userPilotUrl,
        purpose: "3 personaの初回価値到達、摩擦、次クリックを再計算する。"
      },
      {
        id: "pilot-economics",
        label: "Pilot Economics",
        method: "POST",
        url: pilotEconomicsUrl,
        purpose: "回収日数、月次価値、価格レーン、買い手反論を再計算する。"
      },
      {
        id: "observability-oracle",
        label: "Observability Oracle",
        method: "POST",
        url: observabilityOracleUrl,
        purpose: "公開運用証拠を買い手価値へ戻す。"
      },
      {
        id: "mvp-readiness",
        label: "MVP Readiness",
        method: "GET",
        url: endpoint(baseUrl, "/mvp-readiness"),
        purpose: "MVP本体、外部gap、公開revisionの提出可否を確認する。"
      }
    ],
    personas: input.impactCase.personas,
    impactMetrics: input.impactCase.metrics,
    pilotPaths: input.userPilot.paths,
    economics: input.pilotEconomics.unitEconomics,
    evidenceLock: input.pilotEconomics.evidenceLock,
    buyerObjections: input.pilotEconomics.buyerObjections,
    pilotPlan: input.pilotEconomics.pilotPlan,
    judgeScript: [
      "最初に /pilot-value をGETで開き、実用性をImpact、User Pilot、Pilot Economicsの3証拠で見せる。",
      `${input.impactCase.personas.length} persona、${input.userPilot.timeToValueSeconds}秒以内の初回価値、${input.pilotEconomics.unitEconomics.paybackDays}日回収を読み上げる。`,
      `Pilot Evidence Lockは${input.pilotEconomics.evidenceLock.readiness}。clear checks ${clearCheckCount}/${input.pilotEconomics.evidenceLock.checks.length}.`,
      "買い手反論は既存ツール、ROI、安全性、導入摩擦の順で答え、必要ならPOST APIを再実行する。",
      "最後にMVP ReadinessとRelease Driftで、公開証拠が最新revisionに載っているかを確認する。"
    ],
    a2aPayload: {
      method: "message/send",
      skill: "pilot.value.snapshot",
      readiness,
      impactScore: input.impactCase.impactScore,
      pilotScore: input.userPilot.pilotScore,
      economicsScore: input.pilotEconomics.economicsScore,
      paybackDays: input.pilotEconomics.unitEconomics.paybackDays,
      monthlyValueYen: input.pilotEconomics.unitEconomics.monthlyValueYen,
      timeToValueSeconds: input.userPilot.timeToValueSeconds,
      evidenceLockReadiness: input.pilotEconomics.evidenceLock.readiness,
      personas: input.impactCase.personas.map((persona) => ({ id: persona.id, kpi: persona.kpi })),
      buyerObjections: input.pilotEconomics.buyerObjections.map((objection) => ({ id: objection.id, status: objection.status })),
      endpoints: {
        pilotValue: pilotValueUrl,
        pilotValueJson: pilotValueJsonUrl,
        impactCase: impactCaseUrl,
        userPilot: userPilotUrl,
        pilotEconomics: pilotEconomicsUrl,
        observabilityOracle: observabilityOracleUrl,
        mvpReadiness: endpoint(baseUrl, "/mvp-readiness")
      }
    }
  };
}

function renderLinkList(links: PilotValueSnapshotLink[]) {
  return links
    .map(
      (link) => `
        <a class="link-row" href="${escapeHtml(link.url)}">
          <span>${escapeHtml(link.method)}</span>
          <strong>${escapeHtml(link.label)}</strong>
          <small>${escapeHtml(link.purpose)}</small>
        </a>`
    )
    .join("");
}

function metricValue(metric: ImpactMetric) {
  if (metric.unit === "hours") return `${metric.after}h`;
  if (metric.unit === "percent") return `${metric.after}%`;
  return `${metric.after}`;
}

function statusFromTask(status: UserPilotTaskStatus) {
  return status === "clear" ? "good" : status === "blocked" ? "bad" : "watch";
}

function statusFromEconomics(status: PilotEconomicsStatus) {
  return status === "clear" ? "good" : status === "blocked" ? "bad" : "watch";
}

export function renderPilotValueSnapshotHtml(snapshot: PilotValueSnapshot) {
  const personas = snapshot.personas
    .map(
      (persona) => `
        <article class="persona">
          <strong>${escapeHtml(persona.persona)}</strong>
          <p>${escapeHtml(persona.pain)}</p>
          <small>${escapeHtml(persona.workflowWin)} / ${escapeHtml(persona.kpi)}</small>
        </article>`
    )
    .join("");
  const metrics = snapshot.impactMetrics
    .map(
      (metric) => `
        <article class="metric-card">
          <div><strong>${escapeHtml(metric.label)}</strong><span>${escapeHtml(metricValue(metric))}</span></div>
          <p>before ${escapeHtml(metric.before)} -> after ${escapeHtml(metric.after)} / delta ${escapeHtml(metric.delta)}</p>
          <small>${escapeHtml(metric.evidence)}</small>
        </article>`
    )
    .join("");
  const paths = snapshot.pilotPaths
    .map(
      (path) => `
        <article class="path">
          <div><strong>${escapeHtml(path.persona)}</strong><span>${escapeHtml(path.timeToValueSeconds)}s</span></div>
          <p>${escapeHtml(path.goal)}</p>
          <ol>
            ${path.tasks
              .map(
                (task) => `
                  <li class="${statusFromTask(task.status)}">
                    <b>${escapeHtml(task.label)}</b>
                    <small>${escapeHtml(task.screen)} / ${escapeHtml(task.status)} / ${escapeHtml(task.successSignal)}</small>
                  </li>`
              )
              .join("")}
          </ol>
        </article>`
    )
    .join("");
  const checks = snapshot.evidenceLock.checks
    .map(
      (check) => `
        <article class="check ${statusFromEconomics(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.proof)}</p>
          <small>${escapeHtml(check.acceptance)} / ${escapeHtml(check.evidenceRoute)}</small>
        </article>`
    )
    .join("");
  const objections = snapshot.buyerObjections
    .map(
      (objection) => `
        <article class="objection ${statusFromEconomics(objection.status)}">
          <div><strong>${escapeHtml(objection.objection)}</strong><span>${escapeHtml(objection.status)}</span></div>
          <p>${escapeHtml(objection.answer)}</p>
          <small>${escapeHtml(objection.evidence)}</small>
        </article>`
    )
    .join("");
  const plan = snapshot.pilotPlan
    .map(
      (step) => `
        <article class="plan ${statusFromEconomics(step.status)}">
          <div><strong>${escapeHtml(step.horizon)}</strong><span>${escapeHtml(step.status)}</span></div>
          <p>${escapeHtml(step.action)}</p>
          <small>${escapeHtml(step.successMetric)} / ${escapeHtml(step.proof)}</small>
        </article>`
    )
    .join("");
  const script = snapshot.judgeScript.map((line) => `<li>${escapeHtml(line)}</li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pilot Value Snapshot</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #17201d;
        --muted: #5f6965;
        --line: #dce5df;
        --paper: #fbfcfa;
        --panel: #ffffff;
        --green: #13715d;
        --mint: #e6f4ed;
        --amber: #8a620d;
        --amber-bg: #fff4d4;
        --coral: #b24735;
        --blue: #245c99;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.55;
      }
      a { color: inherit; }
      header, main, footer { width: min(1160px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: 0.78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.45rem); line-height: 1; letter-spacing: 0; max-width: 980px; }
      header p { color: var(--muted); max-width: 840px; }
      .metric-grid, .links-grid, .persona-grid, .value-grid, .path-grid, .check-grid, .objection-grid, .plan-grid {
        display: grid;
        gap: 12px;
      }
      .metric-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 22px; }
      .metric, .section, .persona, .metric-card, .path, .check, .objection, .plan {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: 0 1px 0 rgba(23, 32, 29, 0.03);
      }
      .metric { padding: 14px; min-width: 0; }
      .metric span { display: block; color: var(--muted); font-size: 0.75rem; font-weight: 800; }
      .metric strong { display: block; margin-top: 4px; font-size: 1.25rem; line-height: 1.05; overflow-wrap: anywhere; }
      .metric.good, .check.good, .objection.good, .plan.good { background: var(--mint); border-color: #b9dfd1; }
      .metric.watch, .check.watch, .objection.watch, .plan.watch { background: var(--amber-bg); border-color: #ecd58c; }
      .metric.bad, .check.bad, .objection.bad, .plan.bad { background: #ffe4de; border-color: #efb2a6; }
      .section { padding: 18px; margin: 14px 0; }
      .section h2 { margin: 0 0 12px; font-size: 1.05rem; }
      .links-grid, .persona-grid, .value-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .link-row { display: grid; gap: 4px; padding: 12px; border: 1px solid var(--line); border-radius: 8px; text-decoration: none; background: #fff; }
      .link-row span { color: var(--blue); font-size: 0.72rem; font-weight: 900; }
      .link-row small, .persona small, .metric-card small, .path small, .check small, .objection small, .plan small { color: var(--muted); overflow-wrap: anywhere; }
      .persona, .metric-card, .path, .check, .objection, .plan { padding: 12px; }
      .metric-card div, .path div, .check div, .objection div, .plan div { display: flex; gap: 10px; justify-content: space-between; align-items: center; }
      .metric-card span, .path span, .check span, .objection span, .plan span { color: var(--blue); font-size: 0.75rem; font-weight: 900; }
      .persona p, .metric-card p, .path p, .check p, .objection p, .plan p { margin: 8px 0; color: var(--ink); }
      .path-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .check-grid, .objection-grid, .plan-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      ol, ul { margin: 0; padding-left: 22px; color: var(--muted); }
      li + li { margin-top: 8px; }
      li.good b { color: var(--green); }
      li.watch b { color: var(--amber); }
      li.bad b { color: var(--coral); }
      footer { color: var(--muted); font-size: 0.84rem; padding: 10px 0 36px; }
      @media (max-width: 860px) {
        header { padding-top: 28px; }
        .metric-grid, .links-grid, .persona-grid, .value-grid, .path-grid, .check-grid, .objection-grid, .plan-grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Pilot Value Snapshot</div>
      <h1>${escapeHtml(snapshot.headline)}</h1>
      <p>${escapeHtml(snapshot.hardTruth)}</p>
      <div class="metric-grid">
        <div class="metric ${statusTone(snapshot.readiness)}"><span>Readiness</span><strong>${escapeHtml(snapshot.readiness)}</strong></div>
        <div class="metric ${statusTone(snapshot.evidenceLock.readiness)}"><span>Evidence Lock</span><strong>${escapeHtml(snapshot.evidenceLock.readiness)}</strong></div>
        <div class="metric good"><span>Payback</span><strong>${escapeHtml(snapshot.summary.paybackDays)} days</strong></div>
        <div class="metric good"><span>Monthly Value</span><strong>${escapeHtml(formatYen(snapshot.summary.monthlyValueYen))}</strong></div>
        <div class="metric good"><span>First Value</span><strong>${escapeHtml(snapshot.summary.timeToValueSeconds)}s</strong></div>
      </div>
    </header>
    <main>
      <section class="section">
        <h2>First-Click Links</h2>
        <div class="links-grid">${renderLinkList(snapshot.links)}</div>
      </section>
      <section class="section">
        <h2>Target Personas</h2>
        <div class="persona-grid">${personas}</div>
      </section>
      <section class="section">
        <h2>Practical Value Metrics</h2>
        <div class="value-grid">${metrics}</div>
      </section>
      <section class="section">
        <h2>First-Run Paths</h2>
        <div class="path-grid">${paths}</div>
      </section>
      <section class="section">
        <h2>Pilot Evidence Lock</h2>
        <p>${escapeHtml(snapshot.evidenceLock.valueClaim)}</p>
        <div class="check-grid">${checks}</div>
      </section>
      <section class="section">
        <h2>Buyer Objections</h2>
        <div class="objection-grid">${objections}</div>
      </section>
      <section class="section">
        <h2>Pilot Plan</h2>
        <div class="plan-grid">${plan}</div>
      </section>
      <section class="section">
        <h2>Judge Script</h2>
        <ol>${script}</ol>
      </section>
    </main>
    <footer>${escapeHtml(snapshot.id)} / generated ${escapeHtml(snapshot.generatedAt)}</footer>
  </body>
</html>`;
}
