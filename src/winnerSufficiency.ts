import type { CompetitiveSnapshot } from "./competitiveSnapshot.js";
import type { FirstClickSmokeLock } from "./firstClickSmoke.js";
import type { MvpSnapshot } from "./mvpSnapshot.js";
import type { SubmissionLaunchGate } from "./submissionLaunch.js";
import type { WinGapRadar } from "./winGapRadar.js";

export const WINNER_SUFFICIENCY_SKILL_ID = "winner.sufficiency";
export const WINNER_SUFFICIENCY_LOCK_TAG = "winner-sufficiency-lock";
export const WINNER_SUFFICIENCY_REQUIRED_SIGNAL = `${WINNER_SUFFICIENCY_SKILL_ID}:tag:${WINNER_SUFFICIENCY_LOCK_TAG}`;

export type WinnerSufficiencyVerdict = "winner-sufficient" | "external-closeout" | "public-drift" | "needs-feature-work";
export type WinnerSufficiencyStatus = "passed" | "watch" | "blocked";
export type WinnerSufficiencyActionPriority = "now" | "next" | "hold";

export type WinnerSufficiencyCheck = {
  id: string;
  label: string;
  status: WinnerSufficiencyStatus;
  score: number;
  evidence: string;
  action: string;
  proofUrl: string;
};

export type WinnerSufficiencyAction = {
  id: string;
  label: string;
  priority: WinnerSufficiencyActionPriority;
  owner: string;
  action: string;
  proofUrl: string;
};

export type WinnerSufficiencyLock = {
  id: string;
  generatedAt: string;
  sufficiencyScore: number;
  verdict: WinnerSufficiencyVerdict;
  headline: string;
  answer: string;
  hardTruth: string;
  checks: WinnerSufficiencyCheck[];
  actions: WinnerSufficiencyAction[];
  judgeScript: string[];
  a2aPayload: Record<string, unknown>;
};

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

function endpoint(baseUrl: string, path: string) {
  return `${normalizeBase(baseUrl)}${path}`;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function checkScore(status: WinnerSufficiencyStatus, baseScore: number) {
  if (status === "passed") return clamp(baseScore, 84, 100);
  if (status === "watch") return clamp(baseScore, 58, 83);
  return clamp(baseScore, 0, 52);
}

function statusTone(status: string) {
  if (["passed", "winner-sufficient", "winner-track", "mvp-ready", "competitive-swot-ready", "smoke-passed", "submit-ready"].includes(status)) return "good";
  if (["blocked", "public-drift", "needs-feature-work", "mvp-release-drift", "competitive-swot-exposed", "smoke-failed", "invalid-urls"].includes(status)) return "bad";
  return "watch";
}

function releaseBlocked(snapshot: MvpSnapshot) {
  return snapshot.summary.releaseVerdict === "deploy-drift" || snapshot.summary.releaseVerdict === "release-blocked" || snapshot.readiness === "mvp-release-drift";
}

function mvpStatus(snapshot: MvpSnapshot): WinnerSufficiencyStatus {
  if (snapshot.readiness === "mvp-ready" || snapshot.readiness === "mvp-ready-external-watch") return "passed";
  return "blocked";
}

function competitiveStatus(snapshot: CompetitiveSnapshot): WinnerSufficiencyStatus {
  if (snapshot.readiness === "competitive-swot-ready") return "passed";
  if (snapshot.readiness === "competitive-swot-watch") return "watch";
  return "blocked";
}

function smokeStatus(smoke: FirstClickSmokeLock): WinnerSufficiencyStatus {
  if (smoke.readiness === "smoke-passed") return "passed";
  if (smoke.readiness === "smoke-watch") return "watch";
  return "blocked";
}

function freezeStatus(radar: WinGapRadar): WinnerSufficiencyStatus {
  if (radar.featureFreezeLock.readiness === "feature-freeze-ready") return "passed";
  if (radar.featureFreezeLock.readiness === "feature-freeze-external-watch") return "watch";
  return "blocked";
}

function launchStatus(launch: SubmissionLaunchGate): WinnerSufficiencyStatus {
  if (launch.readiness === "submit-ready") return "passed";
  if (launch.readiness === "needs-external-urls") return "watch";
  return "blocked";
}

function verdictFor(input: {
  mvp: MvpSnapshot;
  competitive: CompetitiveSnapshot;
  radar: WinGapRadar;
  smoke: FirstClickSmokeLock;
  launch: SubmissionLaunchGate;
  checks: WinnerSufficiencyCheck[];
}): WinnerSufficiencyVerdict {
  if (releaseBlocked(input.mvp) || input.smoke.readiness === "smoke-failed") return "public-drift";
  if (
    input.mvp.readiness === "mvp-not-ready" ||
    input.competitive.readiness === "competitive-swot-exposed" ||
    input.radar.readiness === "not-mvp" ||
    input.radar.featureFreezeLock.readiness === "needs-feature-freeze" ||
    input.checks.some((check) => check.status === "blocked")
  ) {
    return "needs-feature-work";
  }
  if (
    input.launch.readiness !== "submit-ready" ||
    input.mvp.summary.externalGapCount > 0 ||
    input.radar.externalGaps.length > 0 ||
    input.radar.featureFreezeLock.readiness === "feature-freeze-external-watch"
  ) {
    return "external-closeout";
  }
  return "winner-sufficient";
}

function headlineFor(verdict: WinnerSufficiencyVerdict) {
  if (verdict === "winner-sufficient") return "機能、競合/SWOT、公開証拠、提出URLは優勝線で閉じています。";
  if (verdict === "external-closeout") return "MVP本体は十分です。残りは外部提出URLと録画公開です。";
  if (verdict === "public-drift") return "コードは進んでいますが、公開URLで審査員が見る証拠が古い可能性があります。";
  return "優勝を狙うには、非外部の機能証拠または競合反論を先に閉じます。";
}

function answerFor(verdict: WinnerSufficiencyVerdict) {
  if (verdict === "winner-sufficient") return "十分です。新機能追加ではなく、公開revision、録画、提出状態を維持します。";
  if (verdict === "external-closeout") return "コード側はMVP水準です。ここで機能を増やすより、ProtoPedia作品URLと動画URLを閉じるべきです。";
  if (verdict === "public-drift") return "まだ十分とは言いません。審査員が開く公開URLで最新のGET証拠ページとAgent Cardを確認できるまでblockedです。";
  return "まだ十分とは言いません。競合/SWOT、MVP受入、first-click、feature freezeのblockedを閉じる必要があります。";
}

function hardTruthFor(verdict: WinnerSufficiencyVerdict) {
  if (verdict === "winner-sufficient") return "勝ち筋は新機能の数ではなく、審査5項目、競合反論、公開証拠、提出URLが同じ物語で検収済みであることです。";
  if (verdict === "external-closeout") return "ProtoPediaと動画URLはコードでは生成できない外部作業です。未発行のままsubmit-readyとは呼びません。";
  if (verdict === "public-drift") return "GitHubとCIが緑でも、Cloud Runが古いrevisionなら審査員には未実装に見えます。";
  return "機能を足す判断も、競合に負ける角度、SWOTの弱み、初回導線、公開検収に紐づかないなら切ります。";
}

function actionPriority(status: WinnerSufficiencyStatus): WinnerSufficiencyActionPriority {
  if (status === "blocked") return "now";
  if (status === "watch") return "next";
  return "hold";
}

export function buildWinnerSufficiencyLock(input: {
  baseUrl: string;
  mvpSnapshot: MvpSnapshot;
  competitiveSnapshot: CompetitiveSnapshot;
  winGapRadar: WinGapRadar;
  firstClickSmoke: FirstClickSmokeLock;
  submissionLaunch: SubmissionLaunchGate;
  generatedAt?: string;
}): WinnerSufficiencyLock {
  const baseUrl = normalizeBase(input.baseUrl);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const mvpCheckStatus = mvpStatus(input.mvpSnapshot);
  const competitiveCheckStatus = competitiveStatus(input.competitiveSnapshot);
  const releaseCheckStatus: WinnerSufficiencyStatus = releaseBlocked(input.mvpSnapshot)
    ? "blocked"
    : input.mvpSnapshot.summary.releaseVerdict === "not-run"
      ? "watch"
      : "passed";
  const smokeCheckStatus = smokeStatus(input.firstClickSmoke);
  const freezeCheckStatus = freezeStatus(input.winGapRadar);
  const launchCheckStatus = launchStatus(input.submissionLaunch);

  const checks: WinnerSufficiencyCheck[] = [
    {
      id: "mvp-core",
      label: "MVP Core",
      status: mvpCheckStatus,
      score: checkScore(mvpCheckStatus, input.mvpSnapshot.summary.mvpScore),
      evidence: `${input.mvpSnapshot.readiness}; MVP ${input.mvpSnapshot.summary.mvpScore}; acceptance ${input.mvpSnapshot.summary.acceptanceScore}.`,
      action: mvpCheckStatus === "passed" ? "Keep the MVP scope stable and record proof." : input.mvpSnapshot.hardTruth,
      proofUrl: endpoint(baseUrl, "/mvp-readiness")
    },
    {
      id: "competitive-swot",
      label: "Competitive/SWOT Proof",
      status: competitiveCheckStatus,
      score: checkScore(competitiveCheckStatus, input.competitiveSnapshot.summary.battleScore),
      evidence: `${input.competitiveSnapshot.readiness}; ${input.competitiveSnapshot.summary.competitorCount} competitors; ${input.competitiveSnapshot.summary.swotQuadrantCount}/4 SWOT quadrants; source lock ${input.competitiveSnapshot.summary.sourceLockReadiness}.`,
      action: competitiveCheckStatus === "passed" ? "Use Competitive SWOT in the first 60 seconds." : input.competitiveSnapshot.hardTruth,
      proofUrl: endpoint(baseUrl, "/competitive-swot")
    },
    {
      id: "public-release",
      label: "Public Release",
      status: releaseCheckStatus,
      score: checkScore(releaseCheckStatus, input.mvpSnapshot.summary.releaseVerdict === "release-current" ? 100 : 72),
      evidence: `${input.mvpSnapshot.summary.releaseVerdict}; missing skills ${input.mvpSnapshot.releaseLock.missingSkills.join(", ") || "none"}; missing signals ${input.mvpSnapshot.releaseLock.missingAgentCardSignals.join(", ") || "none"}.`,
      action: releaseCheckStatus === "blocked" ? "Run Deploy Recovery and redeploy Cloud Run before recording." : "Re-run Release Drift immediately before the final recording.",
      proofUrl: endpoint(baseUrl, "/deploy-recovery")
    },
    {
      id: "first-click-proof",
      label: "First-Click Proof",
      status: smokeCheckStatus,
      score: checkScore(smokeCheckStatus, input.firstClickSmoke.smokeScore),
      evidence: `${input.firstClickSmoke.readiness}; passed ${input.firstClickSmoke.passedCount}; missing ${input.firstClickSmoke.missingCount}.`,
      action: smokeCheckStatus === "passed" ? "Open only the proof strip during the judge recording." : "Fix missing GET proof pages before claiming direct-open readiness.",
      proofUrl: endpoint(baseUrl, "/first-click-smoke")
    },
    {
      id: "feature-freeze",
      label: "Feature Freeze",
      status: freezeCheckStatus,
      score: checkScore(freezeCheckStatus, input.winGapRadar.featureFreezeLock.freezeScore),
      evidence: `${input.winGapRadar.featureFreezeLock.readiness}; ship-now ${input.winGapRadar.featureFreezeLock.shipNowCount}; external ${input.winGapRadar.featureFreezeLock.externalCount}; cut ${input.winGapRadar.featureFreezeLock.cutCount}.`,
      action: freezeCheckStatus === "blocked" ? input.winGapRadar.featureFreezeLock.operatorLine : "Stop adding core features; record proof and close external URLs.",
      proofUrl: endpoint(baseUrl, "/api/win-gap-radar")
    },
    {
      id: "submission-launch",
      label: "Submission Launch",
      status: launchCheckStatus,
      score: checkScore(launchCheckStatus, input.submissionLaunch.launchScore),
      evidence: `${input.submissionLaunch.readiness}; final submit ${input.submissionLaunch.finalSubmitLock.readiness}; missing ${input.submissionLaunch.finalSubmitLock.missingCount}; invalid ${input.submissionLaunch.finalSubmitLock.invalidCount}.`,
      action: launchCheckStatus === "passed" ? "Submit the sealed URLs and keep the receipt digest." : input.submissionLaunch.finalSubmitLock.operatorLine,
      proofUrl: endpoint(baseUrl, "/submission-launch")
    }
  ];
  const sufficiencyScore = Math.round(clamp(average(checks.map((check) => check.score))));
  const verdict = verdictFor({
    mvp: input.mvpSnapshot,
    competitive: input.competitiveSnapshot,
    radar: input.winGapRadar,
    smoke: input.firstClickSmoke,
    launch: input.submissionLaunch,
    checks
  });
  const activeChecks = checks.filter((check) => check.status !== "passed");
  const actions: WinnerSufficiencyAction[] =
    activeChecks.length > 0
      ? activeChecks.map((check) => ({
          id: check.id,
          label: check.label,
          priority: actionPriority(check.status),
          owner: check.id === "submission-launch" ? "Submission owner" : check.id === "public-release" || check.id === "first-click-proof" ? "Cloud Run SRE" : "Gemini Strategist",
          action: check.action,
          proofUrl: check.proofUrl
        }))
      : [
          {
            id: "record-proof",
            label: "Record proof path",
            priority: "hold",
            owner: "Submission owner",
            action: "Do not add new core features; record Judge Snapshot, Competitive SWOT, MVP Readiness, and Submission Launch.",
            proofUrl: endpoint(baseUrl, "/judge-snapshot")
          }
        ];

  return {
    id: `winner-sufficiency-${sufficiencyScore}-${verdict}`,
    generatedAt,
    sufficiencyScore,
    verdict,
    headline: headlineFor(verdict),
    answer: answerFor(verdict),
    hardTruth: hardTruthFor(verdict),
    checks,
    actions,
    judgeScript: [
      `Sufficiency verdict: ${verdict}; score ${sufficiencyScore}.`,
      answerFor(verdict),
      `Competitive/SWOT: ${input.competitiveSnapshot.readiness}; ${input.competitiveSnapshot.summary.competitorCount} competitors; source lock ${input.competitiveSnapshot.summary.sourceLockReadiness}.`,
      `MVP: ${input.mvpSnapshot.readiness}; release ${input.mvpSnapshot.summary.releaseVerdict}; external gaps ${input.mvpSnapshot.summary.externalGapCount}.`,
      `First click: ${input.firstClickSmoke.readiness}; ${input.firstClickSmoke.passedCount}/${input.firstClickSmoke.probes.length} proof pages passed.`,
      `Submission: ${input.submissionLaunch.readiness}; final submit ${input.submissionLaunch.finalSubmitLock.readiness}.`
    ],
    a2aPayload: {
      method: "message/send",
      skill: WINNER_SUFFICIENCY_SKILL_ID,
      verdict,
      sufficiencyScore,
      sufficientForWinner: verdict === "winner-sufficient",
      checks: checks.map((check) => ({ id: check.id, status: check.status, score: check.score, proofUrl: check.proofUrl })),
      actions: actions.map((action) => ({ id: action.id, priority: action.priority, owner: action.owner, proofUrl: action.proofUrl })),
      endpoints: {
        winnerSufficiency: endpoint(baseUrl, "/api/winner-sufficiency"),
        winnerSufficiencyPage: endpoint(baseUrl, "/winner-sufficiency"),
        mvpReadiness: endpoint(baseUrl, "/mvp-readiness"),
        competitiveSwot: endpoint(baseUrl, "/competitive-swot"),
        firstClickSmoke: endpoint(baseUrl, "/first-click-smoke"),
        submissionLaunch: endpoint(baseUrl, "/submission-launch")
      }
    }
  };
}

export function renderWinnerSufficiencyHtml(lock: WinnerSufficiencyLock) {
  const metrics = [
    { label: "Verdict", value: lock.verdict, status: lock.verdict },
    { label: "Score", value: lock.sufficiencyScore, status: lock.verdict },
    { label: "Passed", value: lock.checks.filter((check) => check.status === "passed").length, status: "passed" },
    { label: "Open Actions", value: lock.actions.filter((action) => action.priority !== "hold").length, status: lock.actions.some((action) => action.priority === "now") ? "blocked" : "watch" }
  ]
    .map(
      (metric) => `
        <article class="metric ${statusTone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const checks = lock.checks
    .map(
      (check) => `
        <article class="card ${statusTone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)} / ${escapeHtml(check.score)}</span></div>
          <p>${escapeHtml(check.evidence)}</p>
          <p>${escapeHtml(check.action)}</p>
          <a href="${escapeHtml(check.proofUrl)}">${escapeHtml(check.proofUrl)}</a>
        </article>`
    )
    .join("");
  const actions = lock.actions
    .map(
      (action) => `
        <tr>
          <td><strong>${escapeHtml(action.label)}</strong><span>${escapeHtml(action.priority)}</span></td>
          <td>${escapeHtml(action.owner)}</td>
          <td>${escapeHtml(action.action)}</td>
          <td><a href="${escapeHtml(action.proofUrl)}">${escapeHtml(action.proofUrl)}</a></td>
        </tr>`
    )
    .join("");
  const script = lock.judgeScript.map((line) => `<li>${escapeHtml(line)}</li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Winner Sufficiency Lock</title>
    <style>
      :root { color-scheme: light; --ink: #17211f; --muted: #61706a; --line: #dbe6df; --paper: #fbfcfa; --panel: #fff; --green: #13715d; --mint: #e6f4ed; --amber: #8a620d; --amber-bg: #fff4d4; --coral: #b24735; --coral-bg: #fff0ec; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.1rem); line-height: 1; letter-spacing: 0; max-width: 980px; }
      h2 { margin: 28px 0 10px; font-size: 1.12rem; }
      p { color: var(--muted); }
      .metrics, .grid { display: grid; gap: 12px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 22px; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .card, .panel { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 16px; box-shadow: 0 10px 24px rgba(23, 33, 31, .06); min-width: 0; }
      .metric span, .card span { color: var(--muted); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.45rem; overflow-wrap: anywhere; }
      .card div { display: flex; gap: 12px; justify-content: space-between; align-items: start; }
      .card strong, .card p, td, li { overflow-wrap: anywhere; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { text-align: left; border-bottom: 1px solid var(--line); padding: 10px 8px; vertical-align: top; }
      th { font-size: .78rem; text-transform: uppercase; color: var(--muted); }
      td span { display: block; color: var(--muted); font-size: .78rem; }
      .good { border-color: #a9d8c2; background: var(--mint); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #efb7aa; background: var(--coral-bg); }
      ol { margin: 8px 0 0; padding-left: 20px; }
      footer { padding: 20px 0 40px; color: var(--muted); }
      @media (max-width: 860px) { .metrics, .grid { grid-template-columns: 1fr; } .card div { display: block; } table, thead, tbody, tr, th, td { display: block; } thead { display: none; } tr { border-top: 1px solid var(--line); padding: 8px 0; } td { border-bottom: 0; padding: 8px 0; } }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Winner Sufficiency Lock</div>
      <h1>${escapeHtml(lock.headline)}</h1>
      <p><strong>${escapeHtml(lock.answer)}</strong></p>
      <p>${escapeHtml(lock.hardTruth)}</p>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <h2>Sufficiency Checks</h2>
      <section class="grid">${checks}</section>
      <h2>Next Actions</h2>
      <section class="panel">
        <table>
          <thead><tr><th>Action</th><th>Owner</th><th>Command</th><th>Proof</th></tr></thead>
          <tbody>${actions}</tbody>
        </table>
      </section>
      <h2>Judge Script</h2>
      <section class="panel"><ol>${script}</ol></section>
    </main>
    <footer>${escapeHtml(lock.id)} / generated ${escapeHtml(lock.generatedAt)} / A2A skill ${WINNER_SUFFICIENCY_SKILL_ID}</footer>
  </body>
</html>`;
}
