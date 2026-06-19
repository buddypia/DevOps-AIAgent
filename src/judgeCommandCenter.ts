import type { JudgeAcceptanceMatrix } from "./acceptanceMatrix.js";
import type { WinningAutopilotRun } from "./autopilot.js";
import type { CompetitiveBattlecard } from "./competitiveBattlecard.js";
import type { JudgeTour } from "./judgeTour.js";
import type { PilotEconomics } from "./pilotEconomics.js";
import type { ReleaseDriftGuard } from "./releaseDrift.js";

export type CommandCenterReadiness = "pitch-ready" | "external-gaps" | "blocked";
export type CommandCenterStatus = "ready" | "watch" | "blocked";

export type CommandCenterMetric = {
  id: string;
  label: string;
  value: string;
  status: CommandCenterStatus;
  evidence: string;
};

export type CommandCenterProofButton = {
  id: string;
  label: string;
  buttonLabel: string;
  endpoint: string;
  status: CommandCenterStatus;
  score: number;
  reason: string;
};

export type CommandCenterTimelineStep = {
  id: string;
  timeRange: string;
  screen: string;
  click: string;
  say: string;
  proofButtonId: string;
  status: CommandCenterStatus;
};

export type CommandCenterBlocker = {
  id: string;
  priority: "now" | "next";
  owner: string;
  action: string;
  proof: string;
};

export type JudgeCommandCenter = {
  id: string;
  commandScore: number;
  readiness: CommandCenterReadiness;
  headline: string;
  hardTruth: string;
  openingMove: string;
  metrics: CommandCenterMetric[];
  proofButtons: CommandCenterProofButton[];
  timeline: CommandCenterTimelineStep[];
  blockers: CommandCenterBlocker[];
  judgeScript: string[];
  a2aPayload: Record<string, unknown>;
};

export const JUDGE_COMMAND_SKILL_ID = "judge.command";
export const JUDGE_COMMAND_LOCK_TAG = "judge-command-lock";
export const JUDGE_COMMAND_REQUIRED_SIGNAL = `${JUDGE_COMMAND_SKILL_ID}:tag:${JUDGE_COMMAND_LOCK_TAG}`;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function absoluteUrl(baseUrl: string, path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function statusFromScore(score: number): CommandCenterStatus {
  if (score >= 88) return "ready";
  if (score >= 70) return "watch";
  return "blocked";
}

function readinessFrom(input: {
  acceptance: JudgeAcceptanceMatrix;
  autopilot: WinningAutopilotRun;
  competitiveBattlecard: CompetitiveBattlecard;
  judgeTour: JudgeTour;
  releaseDrift?: ReleaseDriftGuard;
}): CommandCenterReadiness {
  if (input.releaseDrift && input.releaseDrift.verdict !== "release-current") return "blocked";
  if (
    input.acceptance.verdict === "not-accepted" ||
    input.autopilot.readiness === "needs-build" ||
    input.competitiveBattlecard.readiness === "exposed" ||
    input.judgeTour.readiness === "needs-fix"
  ) {
    return "blocked";
  }
  if (
    input.acceptance.verdict === "accepted-with-external-gaps" ||
    input.autopilot.readiness === "external-gaps" ||
    input.competitiveBattlecard.readiness === "needs-proof" ||
    input.judgeTour.readiness === "external-url-gaps"
  ) {
    return "external-gaps";
  }
  return "pitch-ready";
}

function proofStatusForReadiness(readiness: string): CommandCenterStatus {
  if (readiness.includes("ready") || readiness === "optimized" || readiness === "investment-ready" || readiness === "release-current") return "ready";
  if (readiness.includes("gap") || readiness.includes("watch") || readiness.includes("needs")) return "watch";
  return "blocked";
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
  if (["pitch-ready", "ready"].includes(status)) return "good";
  if (["blocked"].includes(status)) return "bad";
  return "watch";
}

function blockerFromAcceptance(row: JudgeAcceptanceMatrix["rows"][number]): CommandCenterBlocker {
  return {
    id: row.id,
    priority: row.status === "blocked" ? "now" : "next",
    owner: row.area === "submission" ? "Submission owner" : row.area === "proof" ? "Cloud Run SRE" : "A2A Market Broker",
    action: row.nextAction,
    proof: row.evidence
  };
}

function uniqueBlockers(blockers: CommandCenterBlocker[]) {
  const seen = new Set<string>();
  return blockers.filter((blocker) => {
    if (seen.has(blocker.id)) return false;
    seen.add(blocker.id);
    return true;
  });
}

export function buildJudgeCommandCenter(input: {
  baseUrl: string;
  acceptance: JudgeAcceptanceMatrix;
  autopilot: WinningAutopilotRun;
  competitiveBattlecard: CompetitiveBattlecard;
  judgeTour: JudgeTour;
  pilotEconomics: PilotEconomics;
  releaseDrift?: ReleaseDriftGuard;
}): JudgeCommandCenter {
  const { baseUrl, acceptance, autopilot, competitiveBattlecard, judgeTour, pilotEconomics, releaseDrift } = input;
  const readiness = readinessFrom({ acceptance, autopilot, competitiveBattlecard, judgeTour, releaseDrift });
  const releaseScore = releaseDrift?.driftScore ?? 92;
  const commandScore = Math.round(
    clamp(average([acceptance.acceptanceScore, autopilot.winScore, competitiveBattlecard.battleScore, judgeTour.tourScore, pilotEconomics.economicsScore, releaseScore]))
  );
  const blockedRows = acceptance.rows.filter((row) => row.status === "blocked");
  const watchRows = acceptance.rows.filter((row) => row.status === "watch");
  const releaseBlockers: CommandCenterBlocker[] =
    releaseDrift?.nextActions.map((action) => ({
      id: action.id,
      priority: action.priority,
      owner: action.owner,
      action: action.action,
      proof: action.proof
    })) ?? [];
  const autopilotBlockers: CommandCenterBlocker[] = autopilot.blockers.slice(0, 4).map((action) => ({
    id: action.id,
    priority: action.priority === "now" ? "now" : "next",
    owner: action.owner,
    action: action.command,
    proof: action.proof
  }));
  const blockers = uniqueBlockers([
    ...releaseBlockers,
    ...blockedRows.map(blockerFromAcceptance),
    ...watchRows.slice(0, 4).map(blockerFromAcceptance),
    ...autopilotBlockers
  ]);
  const firstNow = blockers.find((blocker) => blocker.priority === "now");
  const openingMove =
    readiness === "blocked"
      ? (firstNow?.action ?? "blockedの受入行を先に直し、Judge Command Centerを再実行する")
      : readiness === "external-gaps"
        ? "Judge Tourで価値を見せ、Competitive Battlecardで競合質問へ答え、Submission Launch Gateで外部URLをwatchとして正直に示す"
        : "Judge Tourを開き、Competitive Battlecard、Acceptance Matrix、Pilot Economics、Win Autopilotの順で証拠を見せる";
  const headline =
    readiness === "pitch-ready"
      ? "審査員の最初の90秒は、この司令塔から始めれば迷いません。"
      : readiness === "external-gaps"
        ? "MVPの核は説明できます。外部提出URLだけを正直にwatchとして残します。"
        : "最初に見せる前に直すべきblocked証拠があります。";
  const hardTruth =
    readiness === "blocked" && releaseDrift?.verdict === "deploy-drift"
      ? "公開Cloud Runが古いrevisionなので、ローカル実装が優れていても審査員には未実装に見えます。"
      : readiness === "blocked"
        ? "機能が多くても、受入表か公開証拠にblockedがある限りMVPとして説明できません。"
        : readiness === "external-gaps"
          ? "外部URLは未発行なら未完了扱いにしつつ、AI中心性、競合差別化、Battlecard、実用性、実装力の証拠は見せられます。"
          : "提出前の初回導線、価値、採算、公開証拠が同じ画面で説明できます。";

  const metrics: CommandCenterMetric[] = [
    {
      id: "acceptance",
      label: "Acceptance",
      value: `${acceptance.acceptanceScore}`,
      status: acceptance.verdict === "not-accepted" ? "blocked" : acceptance.verdict === "accepted-with-external-gaps" ? "watch" : "ready",
      evidence: `${acceptance.rows.length} rows / ${acceptance.verdict}`
    },
    {
      id: "win",
      label: "Win run",
      value: `${autopilot.winScore}`,
      status: proofStatusForReadiness(autopilot.readiness),
      evidence: `${autopilot.lanes.length} lanes / ${autopilot.readiness}`
    },
    {
      id: "tour",
      label: "90s tour",
      value: `${judgeTour.tourScore}`,
      status: proofStatusForReadiness(judgeTour.readiness),
      evidence: `${judgeTour.steps.length} steps / ${judgeTour.readiness}`
    },
    {
      id: "battlecard",
      label: "Battlecard",
      value: `${competitiveBattlecard.battleScore}`,
      status: proofStatusForReadiness(competitiveBattlecard.readiness),
      evidence: `${competitiveBattlecard.cards.length} competitors / ${competitiveBattlecard.readiness}`
    },
    {
      id: "economics",
      label: "Payback",
      value: `${pilotEconomics.unitEconomics.paybackDays}d`,
      status: proofStatusForReadiness(pilotEconomics.posture),
      evidence: `${pilotEconomics.economicsScore} score / ${pilotEconomics.posture}`
    },
    {
      id: "release",
      label: "Release",
      value: releaseDrift ? `${releaseDrift.observedSkillCount}/${releaseDrift.expectedSkillCount}` : "not checked",
      status: releaseDrift ? proofStatusForReadiness(releaseDrift.verdict) : "watch",
      evidence: releaseDrift?.summary ?? "Release Drift Guard was skipped."
    }
  ];

  const proofButtons: CommandCenterProofButton[] = [
    {
      id: "judge-tour",
      label: "Judge Tour",
      buttonLabel: "Open 90s route",
      endpoint: absoluteUrl(baseUrl, "/api/judge-tour"),
      status: proofStatusForReadiness(judgeTour.readiness),
      score: judgeTour.tourScore,
      reason: judgeTour.headline
    },
    {
      id: "acceptance-matrix",
      label: "Acceptance Matrix",
      buttonLabel: "Check MVP truth",
      endpoint: absoluteUrl(baseUrl, "/api/acceptance-matrix"),
      status: acceptance.verdict === "not-accepted" ? "blocked" : acceptance.verdict === "accepted-with-external-gaps" ? "watch" : "ready",
      score: acceptance.acceptanceScore,
      reason: acceptance.hardTruth
    },
    {
      id: "release-drift",
      label: "Release Drift",
      buttonLabel: "Verify public revision",
      endpoint: absoluteUrl(baseUrl, "/api/release-drift"),
      status: releaseDrift ? proofStatusForReadiness(releaseDrift.verdict) : "watch",
      score: releaseScore,
      reason: releaseDrift?.hardTruth ?? "公開Cloud Runのrevision driftを提出前に確認します。"
    },
    {
      id: "competitive-battlecard",
      label: "Competitive Battlecard",
      buttonLabel: "Answer competitor",
      endpoint: absoluteUrl(baseUrl, "/api/competitive-battlecard"),
      status: proofStatusForReadiness(competitiveBattlecard.readiness),
      score: competitiveBattlecard.battleScore,
      reason: competitiveBattlecard.headline
    },
    {
      id: "pilot-economics",
      label: "Pilot Economics",
      buttonLabel: "Show buyer proof",
      endpoint: absoluteUrl(baseUrl, "/api/pilot-economics"),
      status: proofStatusForReadiness(pilotEconomics.posture),
      score: pilotEconomics.economicsScore,
      reason: pilotEconomics.hardTruth
    },
    {
      id: "win-autopilot",
      label: "Win Autopilot",
      buttonLabel: "Run win verdict",
      endpoint: absoluteUrl(baseUrl, "/win-autopilot"),
      status: proofStatusForReadiness(autopilot.readiness),
      score: autopilot.winScore,
      reason: autopilot.headline
    }
  ];

  const timeline: CommandCenterTimelineStep[] = [
    {
      id: "open",
      timeRange: "0-12s",
      screen: "Judge Command Center",
      click: "Build command center",
      say: headline,
      proofButtonId: "judge-tour",
      status: readiness === "blocked" ? "blocked" : "ready"
    },
    {
      id: "truth",
      timeRange: "12-28s",
      screen: "Acceptance Matrix",
      click: "Check MVP truth",
      say: acceptance.headline,
      proofButtonId: "acceptance-matrix",
      status: acceptance.verdict === "not-accepted" ? "blocked" : "ready"
    },
    {
      id: "public",
      timeRange: "28-42s",
      screen: "Release Drift Guard",
      click: "Verify public revision",
      say: releaseDrift?.summary ?? "公開revisionを提出前に検査します。",
      proofButtonId: "release-drift",
      status: releaseDrift ? proofStatusForReadiness(releaseDrift.verdict) : "watch"
    },
    {
      id: "battlecard",
      timeRange: "42-56s",
      screen: "Competitive Battlecard",
      click: "Answer competitor",
      say: competitiveBattlecard.headline,
      proofButtonId: "competitive-battlecard",
      status: proofStatusForReadiness(competitiveBattlecard.readiness)
    },
    {
      id: "value",
      timeRange: "56-68s",
      screen: "Pilot Economics",
      click: "Show buyer proof",
      say: pilotEconomics.verdict,
      proofButtonId: "pilot-economics",
      status: proofStatusForReadiness(pilotEconomics.posture)
    },
    {
      id: "close",
      timeRange: "68-90s",
      screen: "Judge Tour + Win Autopilot",
      click: "Open 90s route",
      say: judgeTour.openingScript,
      proofButtonId: "win-autopilot",
      status: proofStatusForReadiness(autopilot.readiness)
    }
  ];

  const judgeScript = [
    `Opening: ${headline}`,
    `Move: ${openingMove}`,
    `Truth: Acceptance ${acceptance.acceptanceScore}, ${acceptance.verdict}.`,
    `Competition: Battlecard ${competitiveBattlecard.battleScore}, ${competitiveBattlecard.readiness}, ${competitiveBattlecard.cards.length} competitors.`,
    `Value: Pilot payback ${pilotEconomics.unitEconomics.paybackDays} days, ${pilotEconomics.posture}.`,
    `Public proof: ${releaseDrift ? `${releaseDrift.observedSkillCount}/${releaseDrift.expectedSkillCount} skills, ${releaseDrift.verdict}` : "release drift not checked"}.`
  ];

  return {
    id: `judge-command-${commandScore}-${readiness}`,
    commandScore,
    readiness,
    headline,
    hardTruth,
    openingMove,
    metrics,
    proofButtons,
    timeline,
    blockers,
    judgeScript,
    a2aPayload: {
      method: "message/send",
      skill: JUDGE_COMMAND_SKILL_ID,
      commandScore,
      readiness,
      openingMove,
      metrics: metrics.map((metric) => ({ id: metric.id, value: metric.value, status: metric.status })),
      proofButtons: proofButtons.map((button) => ({ id: button.id, endpoint: button.endpoint, status: button.status, score: button.score })),
      competitiveBattlecard: {
        battleScore: competitiveBattlecard.battleScore,
        readiness: competitiveBattlecard.readiness,
        cards: competitiveBattlecard.cards.map((card) => ({ id: card.id, status: card.status, score: card.score }))
      },
      blockers: blockers.map((blocker) => ({ id: blocker.id, priority: blocker.priority, action: blocker.action })),
      endpoints: {
        judgeCommandCenter: absoluteUrl(baseUrl, "/api/judge-command-center"),
        judgeCommandCenterPage: absoluteUrl(baseUrl, "/judge-command-center"),
        judgeSnapshot: absoluteUrl(baseUrl, "/judge-snapshot"),
        winnerSufficiency: absoluteUrl(baseUrl, "/winner-sufficiency")
      }
    }
  };
}

export function renderJudgeCommandCenterHtml(command: JudgeCommandCenter) {
  const metrics = command.metrics
    .map(
      (metric) => `
        <article class="metric ${tone(metric.status)}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
          <small>${escapeHtml(metric.evidence)}</small>
        </article>`
    )
    .join("");
  const proofButtons = command.proofButtons
    .map(
      (button) => `
        <a class="card ${tone(button.status)}" href="${escapeHtml(button.endpoint)}">
          <div><strong>${escapeHtml(button.label)}</strong><span>${escapeHtml(button.status)} / ${escapeHtml(button.score)}</span></div>
          <p>${escapeHtml(button.buttonLabel)}</p>
          <small>${escapeHtml(button.reason)}</small>
        </a>`
    )
    .join("");
  const timeline = command.timeline
    .map(
      (step) => `
        <tr>
          <td><strong>${escapeHtml(step.timeRange)}</strong><span>${escapeHtml(step.status)}</span></td>
          <td>${escapeHtml(step.screen)}</td>
          <td>${escapeHtml(step.click)}</td>
          <td>${escapeHtml(step.say)}</td>
        </tr>`
    )
    .join("");
  const blockers =
    command.blockers.length === 0
      ? `<li>No blockers. Keep the page open for the judge run.</li>`
      : command.blockers
          .map(
            (blocker) =>
              `<li><strong>${escapeHtml(blocker.owner)}</strong> ${escapeHtml(blocker.action)} <small>${escapeHtml(blocker.priority)} / ${escapeHtml(blocker.proof)}</small></li>`
          )
          .join("");
  const script = command.judgeScript.map((line) => `<li>${escapeHtml(line)}</li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Judge Command Center Proof</title>
    <style>
      :root { color-scheme: light; --ink: #18201e; --muted: #5f6d68; --line: #d9e3dd; --paper: #fbfcfa; --panel: #fff; --green: #13715d; --mint: #e6f4ed; --amber: #8a620d; --amber-bg: #fff4d4; --coral: #b24735; --coral-bg: #fff0ec; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; text-decoration: none; overflow-wrap: anywhere; }
      header, main, footer { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4rem); line-height: 1; letter-spacing: 0; max-width: 980px; }
      h2 { margin: 28px 0 10px; font-size: 1.12rem; }
      p { color: var(--muted); }
      .metrics, .grid { display: grid; gap: 12px; }
      .metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 22px; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .card, .panel { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 16px; box-shadow: 0 10px 24px rgba(24, 32, 30, .06); min-width: 0; }
      .metric span, .card span { color: var(--muted); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.45rem; overflow-wrap: anywhere; }
      .metric small, .card small, li, td { overflow-wrap: anywhere; }
      .card { display: block; }
      .card div { display: flex; gap: 12px; justify-content: space-between; align-items: start; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { text-align: left; border-bottom: 1px solid var(--line); padding: 10px 8px; vertical-align: top; }
      th { font-size: .78rem; text-transform: uppercase; color: var(--muted); }
      td span { display: block; color: var(--muted); font-size: .78rem; }
      .good { border-color: #a9d8c2; background: var(--mint); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #efb7aa; background: var(--coral-bg); }
      ol { margin: 8px 0 0; padding-left: 20px; }
      footer { padding: 20px 0 40px; color: var(--muted); }
      @media (max-width: 860px) { .metrics, .grid { grid-template-columns: 1fr; } .card div, table, thead, tbody, tr, th, td { display: block; } thead { display: none; } tr { border-top: 1px solid var(--line); padding: 8px 0; } td { border-bottom: 0; padding: 8px 0; } }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Judge Command Center Proof</div>
      <h1>${escapeHtml(command.headline)}</h1>
      <p><strong>${escapeHtml(command.openingMove)}</strong></p>
      <p>${escapeHtml(command.hardTruth)}</p>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <h2>Proof Buttons</h2>
      <section class="grid">${proofButtons}</section>
      <h2>90-Second Timeline</h2>
      <section class="panel">
        <table>
          <thead><tr><th>Time</th><th>Screen</th><th>Click</th><th>Say</th></tr></thead>
          <tbody>${timeline}</tbody>
        </table>
      </section>
      <h2>Blockers</h2>
      <section class="panel"><ol>${blockers}</ol></section>
      <h2>Judge Script</h2>
      <section class="panel"><ol>${script}</ol></section>
    </main>
    <footer>${escapeHtml(command.id)} / A2A skill ${JUDGE_COMMAND_SKILL_ID}</footer>
  </body>
</html>`;
}
