import type { BattlecardSwotLink, CompetitiveBattlecard, CompetitiveBattlecardCard } from "./competitiveBattlecard.js";
import type { JudgeCriterion, WinningStrategy } from "./strategy.js";

export const COMPETITIVE_DECISION_MATRIX_SKILL_ID = "competitive.decision-matrix";
export const COMPETITIVE_DECISION_MATRIX_LOCK_TAG = "decision-matrix-lock";
export const COMPETITIVE_DECISION_MATRIX_REQUIRED_SIGNAL = `${COMPETITIVE_DECISION_MATRIX_SKILL_ID}:tag:${COMPETITIVE_DECISION_MATRIX_LOCK_TAG}`;

export type CompetitiveDecisionStatus = "win" | "contest" | "risk";
export type CompetitiveDecisionReadiness = "decision-locked" | "decision-watch" | "needs-decision-proof";

export type CompetitiveDecisionCell = {
  id: string;
  criterionId: string;
  criterionLabel: string;
  competitorId: string;
  competitor: string;
  status: CompetitiveDecisionStatus;
  score: number;
  competitorAdvantage: string;
  ourCounter: string;
  proofUrl: string;
  swotSignal: BattlecardSwotLink;
  judgeLine: string;
  recordingCue: string;
};

export type CompetitiveDecisionRow = {
  id: string;
  competitor: string;
  category: string;
  threatLevel: string;
  status: CompetitiveDecisionStatus;
  overallScore: number;
  concededStrength: string;
  decisiveCounter: string;
  hardestCriterion: string;
  mustShowProofUrl: string;
  cells: CompetitiveDecisionCell[];
};

export type CompetitiveDecisionLockCheck = {
  id: string;
  label: string;
  status: "sealed" | "watch" | "missing";
  score: number;
  proof: string;
  evidenceUrl: string;
};

export type CompetitiveDecisionLock = {
  id: string;
  matrixScore: number;
  readiness: CompetitiveDecisionReadiness;
  winCount: number;
  contestCount: number;
  riskCount: number;
  judgeLine: string;
  checks: CompetitiveDecisionLockCheck[];
};

export type CompetitiveDecisionMatrix = {
  id: string;
  generatedAt: string;
  readiness: CompetitiveDecisionReadiness;
  headline: string;
  hardTruth: string;
  matrixScore: number;
  summary: {
    competitorCount: number;
    criteriaCount: number;
    cellCount: number;
    winCount: number;
    contestCount: number;
    riskCount: number;
    highThreatCount: number;
    sourceUrlCount: number;
    swotSignalCount: number;
  };
  rows: CompetitiveDecisionRow[];
  lock: CompetitiveDecisionLock;
  judgeScript: string[];
  a2aPayload: Record<string, unknown>;
};

const CRITERION_PROOF_PATH: Record<string, string> = {
  agentCentrality: "/.well-known/agent-card.json",
  approach: "/competitive-swot",
  usability: "/judge-command-center",
  practicality: "/pilot-value",
  implementation: "/deploy-recovery"
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

function absoluteUrl(baseUrl: string, path: string) {
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

function fallbackSwotSignal(card: CompetitiveBattlecardCard): BattlecardSwotLink {
  return (
    card.swotLinks.find((link) => link.quadrant === "threats") ??
    card.swotLinks[0] ?? {
      quadrant: "threats",
      title: "競合差分の証拠不足",
      signal: "warning"
    }
  );
}

function statusFor(score: number, card: CompetitiveBattlecardCard): CompetitiveDecisionStatus {
  if (score >= 90 && card.status !== "risk") return "win";
  if (score >= 78) return "contest";
  return "risk";
}

function proofPathFor(criterion: JudgeCriterion) {
  return CRITERION_PROOF_PATH[criterion.id] ?? "/competitive-swot";
}

function buildCell(input: { baseUrl: string; card: CompetitiveBattlecardCard; criterion: JudgeCriterion }): CompetitiveDecisionCell {
  const { baseUrl, card, criterion } = input;
  const sourceScore = card.sourceUrls.length >= 2 ? 100 : card.sourceUrls.length === 1 ? 86 : 48;
  const swotScore = card.swotLinks.length >= 3 ? 100 : card.swotLinks.length >= 2 ? 88 : 64;
  const proofRouteScore = card.proofRoute.length >= 30 ? 96 : 76;
  const threatPenalty = card.threatLevel === "high" && card.score < 90 ? 4 : 0;
  const score = Math.round(clamp(average([card.score, criterion.score, sourceScore, swotScore, proofRouteScore]) - threatPenalty));
  const status = statusFor(score, card);
  const proofUrl = absoluteUrl(baseUrl, proofPathFor(criterion));
  const swotSignal = fallbackSwotSignal(card);

  return {
    id: `${card.id}-${criterion.id}`,
    criterionId: criterion.id,
    criterionLabel: criterion.label,
    competitorId: card.id,
    competitor: card.competitor,
    status,
    score,
    competitorAdvantage: card.whereTheyWin,
    ourCounter: card.shortAnswer,
    proofUrl,
    swotSignal,
    judgeLine: `${criterion.label}: ${card.competitor}は${card.whereTheyWin}で強い。こちらは${card.shortAnswer}`,
    recordingCue: `${card.competitor} -> ${criterion.label}: ${proofUrl} を開き、SWOT ${swotSignal.quadrant} を読み上げる。`
  };
}

function rowStatus(cells: CompetitiveDecisionCell[]): CompetitiveDecisionStatus {
  if (cells.some((cell) => cell.status === "risk")) return "risk";
  if (cells.some((cell) => cell.status === "contest")) return "contest";
  return "win";
}

function buildRow(input: { baseUrl: string; card: CompetitiveBattlecardCard; criteria: JudgeCriterion[] }): CompetitiveDecisionRow {
  const cells = input.criteria.map((criterion) => buildCell({ baseUrl: input.baseUrl, card: input.card, criterion }));
  const sorted = [...cells].sort((left, right) => left.score - right.score);
  const hardest = sorted[0];
  const mustShowProofUrl = hardest?.proofUrl ?? absoluteUrl(input.baseUrl, "/competitive-swot");

  return {
    id: input.card.id,
    competitor: input.card.competitor,
    category: input.card.category,
    threatLevel: input.card.threatLevel,
    status: rowStatus(cells),
    overallScore: Math.round(clamp(average(cells.map((cell) => cell.score)))),
    concededStrength: input.card.whereTheyWin,
    decisiveCounter: input.card.shortAnswer,
    hardestCriterion: hardest?.criterionLabel ?? "審査基準",
    mustShowProofUrl,
    cells
  };
}

function check(input: Omit<CompetitiveDecisionLockCheck, "score"> & { score?: number }): CompetitiveDecisionLockCheck {
  const fallback = input.status === "sealed" ? 100 : input.status === "watch" ? 72 : 30;
  return {
    ...input,
    score: Math.round(clamp(input.score ?? fallback))
  };
}

function buildLock(input: {
  baseUrl: string;
  strategy: WinningStrategy;
  battlecard: CompetitiveBattlecard;
  rows: CompetitiveDecisionRow[];
}): CompetitiveDecisionLock {
  const cells = input.rows.flatMap((row) => row.cells);
  const winCount = cells.filter((cell) => cell.status === "win").length;
  const contestCount = cells.filter((cell) => cell.status === "contest").length;
  const riskCount = cells.filter((cell) => cell.status === "risk").length;
  const criterionIds = new Set(cells.map((cell) => cell.criterionId));
  const competitorIds = new Set(input.rows.map((row) => row.id));
  const requiredCompetitorIds = new Set(input.strategy.competitors.map((competitor) => competitor.id));
  const swotSignalCount = cells.filter((cell) => cell.swotSignal.title.length > 0).length;
  const highThreatRows = input.rows.filter((row) => row.threatLevel === "high");
  const checks = [
    check({
      id: "competitor-coverage",
      label: "Competitor coverage",
      status: [...requiredCompetitorIds].every((id) => competitorIds.has(id)) ? "sealed" : "missing",
      proof: `${competitorIds.size}/${requiredCompetitorIds.size} competitors are represented in the decision matrix.`,
      evidenceUrl: absoluteUrl(input.baseUrl, "/competitive-swot")
    }),
    check({
      id: "criteria-coverage",
      label: "Criteria coverage",
      status: criterionIds.size === input.strategy.judgeCriteria.length ? "sealed" : "missing",
      proof: `${criterionIds.size}/${input.strategy.judgeCriteria.length} judging criteria have head-to-head cells.`,
      evidenceUrl: absoluteUrl(input.baseUrl, "/competitive-decision-matrix")
    }),
    check({
      id: "swot-cell-coverage",
      label: "SWOT cell coverage",
      status: swotSignalCount === cells.length ? "sealed" : swotSignalCount >= Math.floor(cells.length * 0.85) ? "watch" : "missing",
      proof: `${swotSignalCount}/${cells.length} cells carry a SWOT signal.`,
      evidenceUrl: absoluteUrl(input.baseUrl, "/competitive-decision-matrix")
    }),
    check({
      id: "proof-url-coverage",
      label: "Proof URL coverage",
      status: cells.every((cell) => cell.proofUrl.startsWith(input.baseUrl)) ? "sealed" : "watch",
      proof: `${cells.length} cells link to direct-open proof URLs.`,
      evidenceUrl: absoluteUrl(input.baseUrl, "/competitive-decision-matrix")
    }),
    check({
      id: "high-threat-response",
      label: "High threat response",
      status: highThreatRows.every((row) => row.status !== "risk") ? "sealed" : "missing",
      proof: `${highThreatRows.length} high-threat competitors have no risk row.`,
      evidenceUrl: absoluteUrl(input.baseUrl, "/api/competitive-battlecard")
    }),
    check({
      id: "battlecard-lock",
      label: "Battlecard lock",
      status:
        input.battlecard.proofLock.readiness !== "needs-counterproof" &&
        input.battlecard.winLossLock.readiness !== "needs-positioning" &&
        input.battlecard.criteriaDuel.readiness !== "needs-duel-proof"
          ? "sealed"
          : "missing",
      proof: `${input.battlecard.proofLock.readiness}; ${input.battlecard.winLossLock.readiness}; ${input.battlecard.criteriaDuel.readiness}.`,
      evidenceUrl: absoluteUrl(input.baseUrl, "/api/competitive-battlecard")
    })
  ];
  const matrixScore = Math.round(clamp(average([...cells.map((cell) => cell.score), ...checks.map((item) => item.score)])));
  const readiness: CompetitiveDecisionReadiness =
    riskCount > 0 || checks.some((item) => item.status === "missing")
      ? "needs-decision-proof"
      : contestCount > 0 || checks.some((item) => item.status === "watch")
        ? "decision-watch"
        : "decision-locked";

  return {
    id: `competitive-decision-lock-${matrixScore}-${readiness}`,
    matrixScore,
    readiness,
    winCount,
    contestCount,
    riskCount,
    judgeLine:
      readiness === "decision-locked"
        ? "All competitor x criterion cells have SWOT signals, proof URLs, and no risk rows."
        : readiness === "decision-watch"
          ? "The decision matrix is usable, but contest/watch rows should be rehearsed before the final pitch."
          : "At least one competitor x criterion cell lacks enough proof to carry the final judge comparison.",
    checks
  };
}

function headlineFor(readiness: CompetitiveDecisionReadiness) {
  if (readiness === "decision-locked") return "競合比較は決勝の質問にそのまま出せる状態です。";
  if (readiness === "decision-watch") return "競合比較は成立しています。contest行は録画で証拠を先に開きます。";
  return "競合比較に負け筋が残っています。審査前に証拠URLとSWOTを補強します。";
}

function hardTruthFor(readiness: CompetitiveDecisionReadiness) {
  if (readiness === "decision-locked") return "ADK、A2A Marketplace、Copilot Studio、LangGraphなどを否定せず、5審査項目ごとに相手の強み、こちらの反撃、開く証拠URLを固定しています。";
  if (readiness === "decision-watch") return "勝ち筋は見えていますが、contest行を言葉だけで押し切ると既存ツールに見えます。必ず証拠URLから話します。";
  return "機能追加より先に、競合に負けて見えるセルの公開証拠と短い回答を補強する必要があります。";
}

export function buildCompetitiveDecisionMatrix(input: {
  baseUrl: string;
  strategy: WinningStrategy;
  battlecard: CompetitiveBattlecard;
  generatedAt?: string;
}): CompetitiveDecisionMatrix {
  const baseUrl = normalizeBase(input.baseUrl);
  const rows = input.battlecard.cards.map((card) => buildRow({ baseUrl, card, criteria: input.strategy.judgeCriteria }));
  const lock = buildLock({ baseUrl, strategy: input.strategy, battlecard: input.battlecard, rows });
  const cells = rows.flatMap((row) => row.cells);
  const highThreatCount = rows.filter((row) => row.threatLevel === "high").length;
  const sourceUrlCount = input.battlecard.cards.reduce((sum, card) => sum + card.sourceUrls.length, 0);
  const swotSignalCount = cells.filter((cell) => cell.swotSignal.title.length > 0).length;
  const weakestRows = [...rows].sort((left, right) => left.overallScore - right.overallScore).slice(0, 3);

  return {
    id: `competitive-decision-matrix-${lock.matrixScore}-${lock.readiness}`,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    readiness: lock.readiness,
    headline: headlineFor(lock.readiness),
    hardTruth: hardTruthFor(lock.readiness),
    matrixScore: lock.matrixScore,
    summary: {
      competitorCount: rows.length,
      criteriaCount: input.strategy.judgeCriteria.length,
      cellCount: cells.length,
      winCount: lock.winCount,
      contestCount: lock.contestCount,
      riskCount: lock.riskCount,
      highThreatCount,
      sourceUrlCount,
      swotSignalCount
    },
    rows,
    lock,
    judgeScript: [
      "Competitive Decision Matrixを開き、5審査項目 x 主要競合の勝敗表を先に見せる。",
      `Matrix score ${lock.matrixScore}; ${lock.winCount} win / ${lock.contestCount} contest / ${lock.riskCount} risk cells.`,
      ...weakestRows.map((row) => `${row.competitor}: 最弱項目は${row.hardestCriterion}。${row.mustShowProofUrl}を開いてから反論する。`),
      "最後にCompetitive SWOTへ戻り、公式ソース、SWOT、Win/Loss Lock、Source Freshness Lockへ接続する。"
    ],
    a2aPayload: {
      method: "message/send",
      skill: COMPETITIVE_DECISION_MATRIX_SKILL_ID,
      readiness: lock.readiness,
      matrixScore: lock.matrixScore,
      summary: {
        competitorCount: rows.length,
        criteriaCount: input.strategy.judgeCriteria.length,
        cellCount: cells.length,
        winCount: lock.winCount,
        contestCount: lock.contestCount,
        riskCount: lock.riskCount
      },
      rows: rows.map((row) => ({
        id: row.id,
        competitor: row.competitor,
        status: row.status,
        overallScore: row.overallScore,
        hardestCriterion: row.hardestCriterion,
        mustShowProofUrl: row.mustShowProofUrl
      })),
      lock: {
        id: lock.id,
        readiness: lock.readiness,
        matrixScore: lock.matrixScore,
        checks: lock.checks.map((item) => ({ id: item.id, status: item.status, score: item.score }))
      },
      endpoints: {
        competitiveDecisionMatrix: absoluteUrl(baseUrl, "/competitive-decision-matrix"),
        competitiveDecisionMatrixJson: absoluteUrl(baseUrl, "/api/competitive-decision-matrix"),
        competitiveSwot: absoluteUrl(baseUrl, "/competitive-swot"),
        competitiveBattlecard: absoluteUrl(baseUrl, "/api/competitive-battlecard"),
        judgeSnapshot: absoluteUrl(baseUrl, "/judge-snapshot")
      }
    }
  };
}

function tone(status: string) {
  if (["decision-locked", "win", "sealed"].includes(status)) return "good";
  if (["needs-decision-proof", "risk", "missing"].includes(status)) return "bad";
  return "watch";
}

export function renderCompetitiveDecisionMatrixHtml(matrix: CompetitiveDecisionMatrix) {
  const metrics = [
    { label: "Readiness", value: matrix.readiness, status: matrix.readiness },
    { label: "Matrix Score", value: matrix.matrixScore, status: matrix.readiness },
    { label: "Cells", value: matrix.summary.cellCount, status: "sealed" },
    { label: "Win / Contest / Risk", value: `${matrix.summary.winCount} / ${matrix.summary.contestCount} / ${matrix.summary.riskCount}`, status: matrix.summary.riskCount > 0 ? "risk" : matrix.summary.contestCount > 0 ? "contest" : "win" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const rows = matrix.rows
    .map(
      (row) => `
        <tr class="${tone(row.status)}">
          <td><strong>${escapeHtml(row.competitor)}</strong><span>${escapeHtml(row.category)} / ${escapeHtml(row.threatLevel)} / ${escapeHtml(row.overallScore)}</span></td>
          ${row.cells
            .map(
              (cell) => `
                <td>
                  <strong>${escapeHtml(cell.status)} ${escapeHtml(cell.score)}</strong>
                  <span>${escapeHtml(cell.swotSignal.quadrant)}: ${escapeHtml(cell.swotSignal.title)}</span>
                  <small>${escapeHtml(cell.ourCounter)}</small>
                  <a href="${escapeHtml(cell.proofUrl)}">${escapeHtml(cell.proofUrl)}</a>
                </td>`
            )
            .join("")}
          <td><strong>${escapeHtml(row.hardestCriterion)}</strong><a href="${escapeHtml(row.mustShowProofUrl)}">${escapeHtml(row.mustShowProofUrl)}</a></td>
        </tr>`
    )
    .join("");
  const lockChecks = matrix.lock.checks
    .map(
      (check) => `
        <article class="check ${tone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)} / ${escapeHtml(check.score)}</span></div>
          <p>${escapeHtml(check.proof)}</p>
          <a href="${escapeHtml(check.evidenceUrl)}">${escapeHtml(check.evidenceUrl)}</a>
        </article>`
    )
    .join("");
  const script = matrix.judgeScript.map((line) => `<li>${escapeHtml(line)}</li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Competitive Decision Matrix</title>
    <style>
      :root { color-scheme: light; --ink: #18201e; --muted: #5f6d68; --line: #d9e3dd; --paper: #fbfcfa; --panel: #fff; --green: #13715d; --mint: #e6f4ed; --amber-bg: #fff4d4; --coral-bg: #fff0ec; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1220px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: .78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: 3rem; line-height: 1; letter-spacing: 0; max-width: 980px; }
      h2 { margin: 28px 0 10px; font-size: 1.12rem; }
      p { color: var(--muted); }
      .metrics, .checks { display: grid; gap: 12px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 22px; }
      .checks { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .metric, .panel, .check { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 16px; box-shadow: 0 10px 24px rgba(24, 32, 30, .06); min-width: 0; }
      .metric span, .check span, td span { color: var(--muted); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.35rem; overflow-wrap: anywhere; }
      .check div { display: flex; gap: 12px; justify-content: space-between; align-items: start; }
      .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      table { width: 100%; min-width: 1120px; border-collapse: collapse; }
      th, td { text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); padding: 10px; overflow-wrap: anywhere; }
      th { color: var(--muted); font-size: .74rem; text-transform: uppercase; }
      td small, td a, td span, .check a { display: block; margin-top: 5px; overflow-wrap: anywhere; }
      ol { margin: 8px 0 0; padding-left: 20px; }
      li { margin-bottom: 8px; }
      .good { border-color: #a9d8c2; background: var(--mint); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #efb7aa; background: var(--coral-bg); }
      tr.good td { background: rgba(230, 244, 237, .58); }
      tr.watch td { background: rgba(255, 244, 212, .58); }
      tr.bad td { background: rgba(255, 240, 236, .68); }
      footer { padding: 20px 0 40px; color: var(--muted); }
      @media (max-width: 900px) { h1 { font-size: 2rem; } .metrics, .checks { grid-template-columns: 1fr; } .check div { display: block; } }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Competitive Decision Matrix</div>
      <h1>${escapeHtml(matrix.headline)}</h1>
      <p><strong>${escapeHtml(matrix.hardTruth)}</strong></p>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <h2>Head-to-Head Matrix</h2>
      <section class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Competitor</th>
              <th>AI Centrality</th>
              <th>Approach</th>
              <th>Usability</th>
              <th>Practicality</th>
              <th>Implementation</th>
              <th>Hardest Proof</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>
      <h2>Decision Matrix Lock</h2>
      <section class="checks">${lockChecks}</section>
      <h2>Judge Script</h2>
      <section class="panel"><ol>${script}</ol></section>
    </main>
    <footer>${escapeHtml(matrix.id)} / A2A skill ${COMPETITIVE_DECISION_MATRIX_SKILL_ID}</footer>
  </body>
</html>`;
}
