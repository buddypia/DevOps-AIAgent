import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import type { PilotRunReceipt } from "./pilotRunReceipt.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";

export type BuyerDecisionMatrixReadiness = "buy-a2a" | "pilot-more" | "do-not-buy";
export type BuyerDecisionAlternativeId = "a2a-squad" | "manual-process" | "generic-ai" | "internal-build";
export type BuyerDecisionAlternativeStatus = "recommended" | "viable" | "weak";

export type BuyerDecisionAlternative = {
  id: BuyerDecisionAlternativeId;
  label: string;
  status: BuyerDecisionAlternativeStatus;
  score: number;
  monthlyValueYen: number;
  firstCostYen: number;
  paybackDays: number;
  timeToValueDays: number;
  evidence: string;
  tradeoff: string;
  decision: string;
};

export type BuyerDecisionMatrixCheck = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  evidence: string;
};

export type BuyerDecisionMatrix = {
  id: string;
  readiness: BuyerDecisionMatrixReadiness;
  headline: string;
  hardTruth: string;
  targetBuyer: string;
  winnerId: BuyerDecisionAlternativeId;
  confidenceScore: number;
  alternatives: BuyerDecisionAlternative[];
  checks: BuyerDecisionMatrixCheck[];
  exportMarkdown: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundYen(value: number) {
  return Math.round(value / 1000) * 1000;
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
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
  if (["buy-a2a", "recommended", "clear"].includes(status)) return "good";
  if (["do-not-buy", "weak", "blocked"].includes(status)) return "bad";
  return "watch";
}

function paybackDays(costYen: number, monthlyValueYen: number) {
  if (monthlyValueYen <= 0) return 999;
  return Math.ceil((costYen / monthlyValueYen) * 30);
}

function paybackScore(days: number) {
  if (days <= 30) return 100;
  if (days <= 45) return 86;
  if (days <= 90) return 58;
  if (days <= 180) return 34;
  return 10;
}

function timeScore(days: number) {
  if (days <= 14) return 100;
  if (days <= 30) return 84;
  if (days <= 60) return 62;
  if (days <= 120) return 36;
  return 18;
}

function scoreAlternative(input: { monthlyValueYen: number; firstCostYen: number; paybackDays: number; timeToValueDays: number; confidence: number }) {
  const valueScore = clamp((input.monthlyValueYen / Math.max(input.firstCostYen, 1)) * 80, 0, 100);
  return Math.round(average([valueScore, paybackScore(input.paybackDays), timeScore(input.timeToValueDays), input.confidence]));
}

function statusFromRank(index: number, score: number): BuyerDecisionAlternativeStatus {
  if (index === 0 && score >= 62) return "recommended";
  if (score >= 48) return "viable";
  return "weak";
}

function buildAlternatives(input: {
  recommendation: Recommendation;
  scenario: BuyerValueScenario;
  receipt: PilotRunReceipt;
}): BuyerDecisionAlternative[] {
  const scenario = input.scenario;
  const receipt = input.receipt;
  const receiptMultiplier = receipt.readiness === "accepted" ? 1 : receipt.readiness === "needs-evidence" ? 0.72 : 0.42;
  const a2aMonthlyValueYen = roundYen(Math.max(receipt.measuredMonthlyValueYen, scenario.monthlyGrossValueYen * receiptMultiplier));
  const a2aFirstCostYen = scenario.pilotInvestmentYen;
  const genericFirstCostYen = roundYen(Math.max(60000, scenario.assumptions.teamSize * 9000 + 40000));
  const genericMonthlyValueYen = roundYen(scenario.monthlyLaborValueYen * 0.28 + scenario.monthlyRiskValueYen * 0.1);
  const internalFirstCostYen = roundYen(480000 + scenario.assumptions.teamSize * 52000 + input.recommendation.selected.length * 28000);
  const internalMonthlyValueYen = roundYen(scenario.monthlyGrossValueYen * 0.82);
  const manualMonthlyLossYen = roundYen(scenario.monthlyLaborValueYen + scenario.monthlyRiskValueYen * 0.35);
  const alternatives: Omit<BuyerDecisionAlternative, "status">[] = [
    {
      id: "a2a-squad",
      label: "A2A agent squad",
      score: 0,
      monthlyValueYen: a2aMonthlyValueYen,
      firstCostYen: a2aFirstCostYen,
      paybackDays: paybackDays(a2aFirstCostYen, a2aMonthlyValueYen),
      timeToValueDays: receipt.readiness === "accepted" ? 7 : 21,
      evidence:
        receipt.readiness === "accepted"
          ? `${receipt.actualMinutesSavedPerRun} measured minutes saved and ${receipt.acceptanceRatePercent}% accepted tasks.`
          : `${scenario.scenarioScore}/100 value score; first pilot receipt is ${receipt.readiness}.`,
      tradeoff: "Best when the buyer wants measurable value, proof artifacts, and accountable agent owners in one pilot path.",
      decision: "Choose when evidence is strong enough to sponsor-review now."
    },
    {
      id: "manual-process",
      label: "Stay manual",
      score: 0,
      monthlyValueYen: 0,
      firstCostYen: manualMonthlyLossYen,
      paybackDays: 999,
      timeToValueDays: 0,
      evidence: `${yen(manualMonthlyLossYen)} stays exposed each month as labor and avoidable risk.`,
      tradeoff: "Lowest change cost, but no operational learning, public proof, or value capture.",
      decision: "Use only if the pilot scope is not real enough to justify change."
    },
    {
      id: "generic-ai",
      label: "Generic AI subscription",
      score: 0,
      monthlyValueYen: genericMonthlyValueYen,
      firstCostYen: genericFirstCostYen,
      paybackDays: paybackDays(genericFirstCostYen, genericMonthlyValueYen),
      timeToValueDays: 14,
      evidence: `${yen(genericMonthlyValueYen)} modeled monthly value without dedicated Cloud Run, A2A, or proof ownership.`,
      tradeoff: "Fast to start, but weak on governance, acceptance evidence, and buyer-specific workflow fit.",
      decision: "Use as a stopgap if proof obligations are light."
    },
    {
      id: "internal-build",
      label: "Internal custom build",
      score: 0,
      monthlyValueYen: internalMonthlyValueYen,
      firstCostYen: internalFirstCostYen,
      paybackDays: paybackDays(internalFirstCostYen, internalMonthlyValueYen),
      timeToValueDays: 90,
      evidence: `${yen(internalFirstCostYen)} first-build estimate before the buyer sees comparable proof.`,
      tradeoff: "Maximum control, but slowest evidence cycle and highest upfront delivery risk.",
      decision: "Use when integration depth matters more than near-term proof."
    }
  ];
  const scored = alternatives
    .map((alternative) => {
      const confidence =
        alternative.id === "a2a-squad"
          ? average([scenario.confidenceScore, receipt.receiptScore])
          : alternative.id === "internal-build"
            ? scenario.confidenceScore * 0.72
            : alternative.id === "generic-ai"
              ? scenario.confidenceScore * 0.52
              : 42;
      return {
        ...alternative,
        score: scoreAlternative({
          monthlyValueYen: alternative.monthlyValueYen,
          firstCostYen: alternative.firstCostYen,
          paybackDays: alternative.paybackDays,
          timeToValueDays: alternative.timeToValueDays,
          confidence
        })
      };
    })
    .sort((left, right) => right.score - left.score);

  return scored.map((alternative, index) => ({
    ...alternative,
    status: statusFromRank(index, alternative.score)
  }));
}

function readinessFrom(input: { winnerId: BuyerDecisionAlternativeId; a2a: BuyerDecisionAlternative; receipt: PilotRunReceipt; scenario: BuyerValueScenario }): BuyerDecisionMatrixReadiness {
  if (input.winnerId === "a2a-squad" && input.a2a.score >= 72 && input.receipt.readiness !== "failed" && input.scenario.readiness !== "not-yet") return "buy-a2a";
  if (input.winnerId === "a2a-squad" || input.a2a.score >= 58) return "pilot-more";
  return "do-not-buy";
}

function headlineFor(readiness: BuyerDecisionMatrixReadiness) {
  if (readiness === "buy-a2a") return "Choose the A2A squad for the first buyer pilot";
  if (readiness === "pilot-more") return "Keep comparing, but continue the A2A pilot";
  return "Do not buy the A2A squad yet";
}

function hardTruthFor(readiness: BuyerDecisionMatrixReadiness, winner: BuyerDecisionAlternative, a2a: BuyerDecisionAlternative) {
  if (readiness === "buy-a2a") {
    return `The A2A squad wins on proof-adjusted value with ${winner.score}/100, ${winner.paybackDays}-day payback, and ${winner.timeToValueDays} days to value.`;
  }
  if (readiness === "pilot-more") {
    return `A2A is still viable, but its score is ${a2a.score}/100. Improve evidence before treating it as the default purchase.`;
  }
  return `${winner.label} currently beats A2A. Tighten the workflow, economics, or proof before making a sponsor ask.`;
}

function statusFromGap(gap: number): BuyerValueScenarioStatus {
  if (gap >= 8) return "clear";
  if (gap >= 0) return "watch";
  return "blocked";
}

function buildChecks(input: {
  alternatives: BuyerDecisionAlternative[];
  winnerId: BuyerDecisionAlternativeId;
  a2a: BuyerDecisionAlternative;
  receipt: PilotRunReceipt;
}): BuyerDecisionMatrixCheck[] {
  const comparator = input.alternatives.find((alternative) => alternative.id !== "a2a-squad") ?? input.a2a;
  const gap = input.a2a.score - comparator.score;
  return [
    {
      id: "economic-winner",
      label: "Economic winner",
      status: input.winnerId === "a2a-squad" ? "clear" : input.a2a.status === "viable" ? "watch" : "blocked",
      evidence: `${input.alternatives[0].label} leads with ${input.alternatives[0].score}/100. A2A score is ${input.a2a.score}/100.`
    },
    {
      id: "proof-adjusted",
      label: "Proof adjusted",
      status: input.receipt.readiness === "accepted" ? "clear" : input.receipt.readiness === "needs-evidence" ? "watch" : "blocked",
      evidence: `First pilot receipt is ${input.receipt.readiness} with ${input.receipt.receiptScore}/100 receipt score.`
    },
    {
      id: "payback",
      label: "A2A payback",
      status: input.a2a.paybackDays <= 45 ? "clear" : input.a2a.paybackDays <= 90 ? "watch" : "blocked",
      evidence: `${input.a2a.paybackDays}-day payback against ${yen(input.a2a.firstCostYen)} first pilot cost.`
    },
    {
      id: "winner-gap",
      label: "Winner gap",
      status: statusFromGap(gap),
      evidence: `A2A is ${gap >= 0 ? `${gap} points ahead of` : `${Math.abs(gap)} points behind`} ${comparator.label}.`
    }
  ];
}

function buildMarkdown(input: Omit<BuyerDecisionMatrix, "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    `Readiness: ${input.readiness}`,
    `Target buyer: ${input.targetBuyer}`,
    `Winner: ${input.alternatives.find((alternative) => alternative.id === input.winnerId)?.label ?? input.winnerId}`,
    `Confidence: ${input.confidenceScore}/100`,
    "",
    input.hardTruth,
    "",
    "## Alternatives",
    ...input.alternatives.map(
      (alternative) =>
        `- [${alternative.status}] ${alternative.label}: ${alternative.score}/100, ${yen(alternative.monthlyValueYen)} monthly value, ${alternative.paybackDays} day payback, ${alternative.timeToValueDays} days to value.`
    ),
    "",
    "## Checks",
    ...input.checks.map((check) => `- [${check.status}] ${check.label}: ${check.evidence}`)
  ].join("\n");
}

export function buildBuyerDecisionMatrix(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  pilotReceipt: PilotRunReceipt;
}): BuyerDecisionMatrix {
  const alternatives = buildAlternatives({ recommendation: input.recommendation, scenario: input.buyerScenario, receipt: input.pilotReceipt });
  const winner = alternatives[0];
  const a2a = alternatives.find((alternative) => alternative.id === "a2a-squad") ?? winner;
  const readiness = readinessFrom({ winnerId: winner.id, a2a, receipt: input.pilotReceipt, scenario: input.buyerScenario });
  const confidenceScore = Math.round(average([a2a.score, input.buyerScenario.confidenceScore, input.pilotReceipt.receiptScore, input.valueBlueprint.boardScore]));
  const partial = {
    id: `buyer-decision-${readiness}-${winner.id}-${confidenceScore}`,
    readiness,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, winner, a2a),
    targetBuyer: input.valueBlueprint.primaryUser,
    winnerId: winner.id,
    confidenceScore,
    alternatives,
    checks: buildChecks({ alternatives, winnerId: winner.id, a2a, receipt: input.pilotReceipt })
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderBuyerDecisionMatrixHtml(
  matrix: BuyerDecisionMatrix,
  links: { valueReportUrl?: string; pilotReceiptUrl?: string; diligenceUrl?: string; jsonUrl?: string; markdownUrl?: string; appUrl?: string } = {}
) {
  const winner = matrix.alternatives.find((alternative) => alternative.id === matrix.winnerId) ?? matrix.alternatives[0];
  const metrics = [
    { label: "Readiness", value: matrix.readiness, status: matrix.readiness },
    { label: "Winner", value: winner?.label ?? matrix.winnerId, status: winner?.status ?? "weak" },
    { label: "Confidence", value: matrix.confidenceScore, status: matrix.readiness },
    { label: "A2A payback", value: `${matrix.alternatives.find((item) => item.id === "a2a-squad")?.paybackDays ?? 999} days`, status: matrix.checks.find((item) => item.id === "payback")?.status ?? "blocked" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const alternatives = matrix.alternatives
    .map(
      (alternative) => `
        <article class="card ${tone(alternative.status)}">
          <div><strong>${escapeHtml(alternative.label)}</strong><span>${escapeHtml(alternative.status)}</span></div>
          <b>${escapeHtml(alternative.score)}/100</b>
          <p>${escapeHtml(yen(alternative.monthlyValueYen))} monthly value / ${escapeHtml(alternative.paybackDays)} day payback / ${escapeHtml(alternative.timeToValueDays)} days to value</p>
          <small>${escapeHtml(alternative.evidence)}</small>
          <small>${escapeHtml(alternative.tradeoff)}</small>
        </article>`
    )
    .join("");
  const checks = matrix.checks
    .map(
      (check) => `
        <article class="card ${tone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.evidence)}</p>
        </article>`
    )
    .join("");
  const linkList = [
    links.valueReportUrl ? `<a href="${escapeHtml(links.valueReportUrl)}">Value report</a>` : "",
    links.pilotReceiptUrl ? `<a href="${escapeHtml(links.pilotReceiptUrl)}">Pilot receipt</a>` : "",
    links.diligenceUrl ? `<a href="${escapeHtml(links.diligenceUrl)}">Diligence room</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON matrix</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown matrix</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(matrix.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #52645f; --line: #cbd7d2; --paper: #f3f7f5; --panel: #fffdf7; --teal: #0f766e; --blue: #2457a6; --green-bg: #edf8f1; --amber-bg: #fff7dd; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 22px; }
      .eyebrow, .metric span, .card span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.2rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p { color: var(--muted); }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: end; }
      .stamp { min-height: 190px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #102226, #2457a6); text-align: center; }
      .stamp span { color: #ffe4a8; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { padding: 0 18px; font-size: 1.6rem; line-height: 1; overflow-wrap: anywhere; }
      .metrics, .grid, .cards { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 20px; }
      .grid { grid-template-columns: minmax(0, .82fr) minmax(320px, .48fr); align-items: start; }
      .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .panel, .card { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.25rem; line-height: 1.1; overflow-wrap: anywhere; }
      .panel { padding: 16px; }
      .card { display: grid; gap: 7px; padding: 13px; }
      .card div { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
      .card b { width: fit-content; border-radius: 999px; padding: 4px 8px; color: #102226; background: #d8fff5; }
      .card strong, .card p, .card small { overflow-wrap: anywhere; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 780px) { header, main, footer { width: min(100% - 24px, 620px); } .hero, .metrics, .grid, .cards { grid-template-columns: 1fr; } .stamp { min-height: 132px; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Procurement Decision Matrix</span>
          <h1>${escapeHtml(matrix.headline)}</h1>
          <p>${escapeHtml(matrix.hardTruth)}</p>
          <nav>${linkList}</nav>
        </div>
        <div class="stamp">
          <span>Winner</span>
          <strong>${escapeHtml(winner?.label ?? matrix.winnerId)}</strong>
          <small>${escapeHtml(matrix.targetBuyer)}</small>
        </div>
      </div>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <section class="panel">
        <h2>Alternatives</h2>
        <div class="cards">${alternatives}</div>
      </section>
      <section class="panel">
        <h2>Decision checks</h2>
        <div class="cards">${checks}</div>
      </section>
    </main>
    <footer>Generated by A2A Agent Marketplace. Use this matrix to guide a pilot decision, not as a binding procurement approval.</footer>
  </body>
</html>`;
}
