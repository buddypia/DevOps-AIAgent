import type { Recommendation } from "./types.js";

export type BuyerValueScenarioReadiness = "scales-now" | "pilot-first" | "not-yet";
export type BuyerValueScenarioStatus = "clear" | "watch" | "blocked";

export type BuyerValueScenarioInput = {
  teamSize: number;
  hourlyCostYen: number;
  cyclesPerMonth: number;
  manualHoursPerCycle: number;
  adoptionRatePercent: number;
  incidentRiskYenPerMonth: number;
};

export type BuyerValueScenarioMetric = {
  id: string;
  label: string;
  value: string;
  status: BuyerValueScenarioStatus;
  evidence: string;
};

export type BuyerValueScenarioAction = {
  id: string;
  owner: string;
  priority: "now" | "next";
  action: string;
  proof: string;
};

export type BuyerValueScenario = {
  id: string;
  readiness: BuyerValueScenarioReadiness;
  scenarioScore: number;
  headline: string;
  hardTruth: string;
  assumptions: BuyerValueScenarioInput;
  automationRatePercent: number;
  assistedHoursPerCycle: number;
  monthlyHoursSaved: number;
  monthlyLaborValueYen: number;
  monthlyRiskValueYen: number;
  monthlyGrossValueYen: number;
  pilotInvestmentYen: number;
  paybackDays: number;
  pilotBudgetCeilingYen: number;
  confidenceScore: number;
  metrics: BuyerValueScenarioMetric[];
  nextActions: BuyerValueScenarioAction[];
  exportMarkdown: string;
};

export const DEFAULT_BUYER_VALUE_SCENARIO: BuyerValueScenarioInput = {
  teamSize: 6,
  hourlyCostYen: 9000,
  cyclesPerMonth: 4,
  manualHoursPerCycle: 24,
  adoptionRatePercent: 70,
  incidentRiskYenPerMonth: 180000
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function roundYen(value: number) {
  return Math.round(value / 1000) * 1000;
}

function safeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeBuyerValueScenarioInput(
  value: Partial<BuyerValueScenarioInput> | null | undefined,
  fallback: BuyerValueScenarioInput = DEFAULT_BUYER_VALUE_SCENARIO
): BuyerValueScenarioInput {
  const candidate = value ?? {};
  return {
    teamSize: Math.round(clamp(safeNumber(candidate.teamSize, fallback.teamSize), 1, 200)),
    hourlyCostYen: Math.round(clamp(safeNumber(candidate.hourlyCostYen, fallback.hourlyCostYen), 1000, 50000)),
    cyclesPerMonth: Math.round(clamp(safeNumber(candidate.cyclesPerMonth, fallback.cyclesPerMonth), 1, 40)),
    manualHoursPerCycle: round1(clamp(safeNumber(candidate.manualHoursPerCycle, fallback.manualHoursPerCycle), 1, 120)),
    adoptionRatePercent: Math.round(clamp(safeNumber(candidate.adoptionRatePercent, fallback.adoptionRatePercent), 5, 100)),
    incidentRiskYenPerMonth: roundYen(clamp(safeNumber(candidate.incidentRiskYenPerMonth, fallback.incidentRiskYenPerMonth), 0, 10000000))
  };
}

function selectedRiskCapability(recommendation: Recommendation) {
  const selected = recommendation.selected;
  if (selected.length === 0) return recommendation.after.reliability;
  return average(
    selected.map((agent) =>
      average([agent.capabilities.security, agent.capabilities.testing, agent.capabilities.observability, agent.capabilities.cloudRun])
    )
  );
}

function paybackScore(paybackDays: number) {
  if (paybackDays <= 14) return 100;
  if (paybackDays <= 30) return 88;
  if (paybackDays <= 60) return 68;
  if (paybackDays <= 90) return 46;
  return 22;
}

function readinessFrom(input: { scenarioScore: number; paybackDays: number; confidenceScore: number; monthlyGrossValueYen: number }): BuyerValueScenarioReadiness {
  if (input.monthlyGrossValueYen <= 0 || input.paybackDays > 90 || input.confidenceScore < 52) return "not-yet";
  if (input.scenarioScore >= 78 && input.paybackDays <= 45 && input.confidenceScore >= 70) return "scales-now";
  return "pilot-first";
}

function headlineFor(readiness: BuyerValueScenarioReadiness) {
  if (readiness === "scales-now") return "This squad has a credible buyer-value case";
  if (readiness === "pilot-first") return "The value case is promising, but should be piloted first";
  return "The current assumptions do not justify rollout yet";
}

function hardTruthFor(readiness: BuyerValueScenarioReadiness, paybackDays: number, confidenceScore: number) {
  if (readiness === "scales-now") {
    return `Payback is ${paybackDays} days with ${confidenceScore}/100 confidence, so this can be shown as a serious adoption case.`;
  }
  if (readiness === "pilot-first") {
    return `Payback is ${paybackDays} days. Keep this as a bounded pilot until adoption or evidence confidence improves.`;
  }
  return `Payback is ${paybackDays} days or confidence is too low. Tighten scope before presenting this as a buyer-ready offer.`;
}

function statusFrom(value: number, clear: number, watch: number): BuyerValueScenarioStatus {
  if (value >= clear) return "clear";
  if (value >= watch) return "watch";
  return "blocked";
}

function buildActions(input: {
  readiness: BuyerValueScenarioReadiness;
  assumptions: BuyerValueScenarioInput;
  paybackDays: number;
  confidenceScore: number;
  monthlyGrossValueYen: number;
}): BuyerValueScenarioAction[] {
  const actions: BuyerValueScenarioAction[] = [];
  if (input.assumptions.adoptionRatePercent < 55) {
    actions.push({
      id: "adoption",
      owner: "UX Guildmaster",
      priority: "now",
      action: "Run a first-user pilot and remove the highest-friction step before claiming team-wide value.",
      proof: "User Pilot path, time-to-value, and friction owner"
    });
  }
  if (input.paybackDays > 45) {
    actions.push({
      id: "payback",
      owner: "A2A Market Broker",
      priority: "now",
      action: "Reduce the pilot scope or hire a stronger automation agent before asking for rollout budget.",
      proof: "Scenario payback days and selected-agent capability uplift"
    });
  }
  if (input.confidenceScore < 70) {
    actions.push({
      id: "confidence",
      owner: "Test Forge",
      priority: input.readiness === "not-yet" ? "now" : "next",
      action: "Attach quality gates, release drift, and acceptance evidence to the ROI memo.",
      proof: "Launch Evidence Console, CI, Agent Card, and Acceptance Matrix"
    });
  }
  if (input.monthlyGrossValueYen < 100000) {
    actions.push({
      id: "market-size",
      owner: "Gemini Strategist",
      priority: "next",
      action: "Reframe the target buyer or select a higher-cost workflow before pitching global utility.",
      proof: "Project brief, buyer segment, and scenario assumptions"
    });
  }
  if (actions.length === 0) {
    actions.push({
      id: "seal-proof",
      owner: "Cloud Run SRE",
      priority: "next",
      action: "Seal this value claim with a fresh launch evidence run and export the ROI memo.",
      proof: "Release drift, external evidence, and buyer value export"
    });
  }
  return actions;
}

function buildMarkdown(input: Omit<BuyerValueScenario, "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    `Readiness: ${input.readiness}`,
    `Scenario score: ${input.scenarioScore}/100`,
    `Confidence: ${input.confidenceScore}/100`,
    "",
    input.hardTruth,
    "",
    "## Assumptions",
    `- Team size: ${input.assumptions.teamSize}`,
    `- Loaded hourly cost: ${input.assumptions.hourlyCostYen.toLocaleString("ja-JP")} yen`,
    `- Planning cycles per month: ${input.assumptions.cyclesPerMonth}`,
    `- Manual hours per cycle: ${input.assumptions.manualHoursPerCycle}`,
    `- Adoption rate: ${input.assumptions.adoptionRatePercent}%`,
    `- Monthly incident risk: ${input.assumptions.incidentRiskYenPerMonth.toLocaleString("ja-JP")} yen`,
    "",
    "## Scenario result",
    `- Monthly value: ${input.monthlyGrossValueYen.toLocaleString("ja-JP")} yen`,
    `- Monthly hours saved: ${input.monthlyHoursSaved} hours`,
    `- Payback: ${input.paybackDays} days`,
    `- Pilot budget ceiling: ${input.pilotBudgetCeilingYen.toLocaleString("ja-JP")} yen`,
    "",
    "## Next actions",
    ...input.nextActions.map((action) => `- [${action.priority}] ${action.owner}: ${action.action}`)
  ].join("\n");
}

export function buildBuyerValueScenario(
  recommendation: Recommendation,
  input: Partial<BuyerValueScenarioInput> = DEFAULT_BUYER_VALUE_SCENARIO
): BuyerValueScenario {
  const assumptions = normalizeBuyerValueScenarioInput(input);
  const riskCapability = selectedRiskCapability(recommendation);
  const automationRatePercent = Math.round(
    clamp(28 + recommendation.uplift.total * 0.45 + recommendation.selected.length * 4 + recommendation.uplift.usability * 0.12, 20, 82)
  );
  const assistedHoursPerCycle = round1(Math.max(0.5, assumptions.manualHoursPerCycle * (1 - automationRatePercent / 100)));
  const hoursSavedPerCycle = Math.max(0, assumptions.manualHoursPerCycle - assistedHoursPerCycle);
  const monthlyHoursSaved = round1(hoursSavedPerCycle * assumptions.cyclesPerMonth * (assumptions.adoptionRatePercent / 100));
  const monthlyLaborValueYen = roundYen(monthlyHoursSaved * assumptions.hourlyCostYen);
  const riskReductionPercent = Math.round(clamp(riskCapability * 0.58 + recommendation.after.reliability * 0.22, 12, 78));
  const monthlyRiskValueYen = roundYen(assumptions.incidentRiskYenPerMonth * (riskReductionPercent / 100) * (assumptions.adoptionRatePercent / 100));
  const monthlyGrossValueYen = monthlyLaborValueYen + monthlyRiskValueYen;
  const pilotInvestmentYen = roundYen(90000 + recommendation.budgetUsed * 3500 + assumptions.teamSize * 6000);
  const paybackDays = monthlyGrossValueYen <= 0 ? 999 : Math.ceil((pilotInvestmentYen / monthlyGrossValueYen) * 30);
  const pilotBudgetCeilingYen = roundYen(Math.max(0, monthlyGrossValueYen * 0.45));
  const confidenceScore = Math.round(
    clamp(average([recommendation.after.reliability, recommendation.after.usability, recommendation.after.governance, recommendation.after.delivery]) * 0.72 + riskReductionPercent * 0.2 + recommendation.selected.length * 3)
  );
  const valueScore = clamp((monthlyGrossValueYen / Math.max(pilotInvestmentYen, 1)) * 70, 0, 100);
  const scenarioScore = Math.round(average([valueScore, paybackScore(paybackDays), confidenceScore, assumptions.adoptionRatePercent]));
  const readiness = readinessFrom({ scenarioScore, paybackDays, confidenceScore, monthlyGrossValueYen });
  const headline = headlineFor(readiness);
  const hardTruth = hardTruthFor(readiness, paybackDays, confidenceScore);
  const metrics: BuyerValueScenarioMetric[] = [
    {
      id: "automation",
      label: "Automation rate",
      value: `${automationRatePercent}%`,
      status: statusFrom(automationRatePercent, 58, 42),
      evidence: `${recommendation.selected.length} selected agents and +${recommendation.uplift.total} total score uplift.`
    },
    {
      id: "labor-value",
      label: "Labor value",
      value: `${monthlyLaborValueYen.toLocaleString("ja-JP")}円 / month`,
      status: statusFrom(monthlyLaborValueYen, 250000, 100000),
      evidence: `${monthlyHoursSaved}h saved at ${assumptions.hourlyCostYen.toLocaleString("ja-JP")}円 loaded hourly cost.`
    },
    {
      id: "risk-value",
      label: "Risk value",
      value: `${monthlyRiskValueYen.toLocaleString("ja-JP")}円 / month`,
      status: statusFrom(riskReductionPercent, 58, 40),
      evidence: `${riskReductionPercent}% risk reduction confidence from security, testing, observability, and Cloud Run coverage.`
    },
    {
      id: "confidence",
      label: "Evidence confidence",
      value: `${confidenceScore}/100`,
      status: statusFrom(confidenceScore, 76, 62),
      evidence: "Delivery, reliability, usability, governance, and selected-agent risk capability."
    }
  ];
  const partial = {
    id: `buyer-value-${scenarioScore}-${readiness}`,
    readiness,
    scenarioScore,
    headline,
    hardTruth,
    assumptions,
    automationRatePercent,
    assistedHoursPerCycle,
    monthlyHoursSaved,
    monthlyLaborValueYen,
    monthlyRiskValueYen,
    monthlyGrossValueYen,
    pilotInvestmentYen,
    paybackDays,
    pilotBudgetCeilingYen,
    confidenceScore,
    metrics,
    nextActions: buildActions({ readiness, assumptions, paybackDays, confidenceScore, monthlyGrossValueYen })
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}
