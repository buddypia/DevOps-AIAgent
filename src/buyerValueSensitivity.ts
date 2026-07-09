import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";

export type BuyerValueSensitivityCaseId = "pessimistic" | "base" | "upside";
export type BuyerValueSensitivityVerdict = "defensible" | "fragile" | "not-defensible";

export type BuyerValueSensitivityCase = {
  id: BuyerValueSensitivityCaseId;
  label: string;
  adoptionRatePercent: number;
  automationRatePercent: number;
  monthlyHoursSaved: number;
  monthlyValueYen: number;
  paybackDays: number;
  status: BuyerValueScenarioStatus;
  evidence: string;
};

export type BuyerValueSensitivityGuardrail = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  value: string;
  evidence: string;
};

export type BuyerValueSensitivity = {
  id: string;
  verdict: BuyerValueSensitivityVerdict;
  confidenceBand: string;
  breakEvenAdoptionPercent: number;
  valueAtRiskYen: number;
  cases: BuyerValueSensitivityCase[];
  guardrails: BuyerValueSensitivityGuardrail[];
  exportMarkdown: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function roundYen(value: number) {
  return Math.round(value / 1000) * 1000;
}

function formatYen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function statusFromPayback(paybackDays: number): BuyerValueScenarioStatus {
  if (paybackDays <= 60) return "clear";
  if (paybackDays <= 90) return "watch";
  return "blocked";
}

function statusFromThreshold(value: number, clear: number, watch: number): BuyerValueScenarioStatus {
  if (value <= clear) return "clear";
  if (value <= watch) return "watch";
  return "blocked";
}

function buildCase(
  scenario: BuyerValueScenario,
  input: {
    id: BuyerValueSensitivityCaseId;
    label: string;
    adoptionRatePercent: number;
    automationRatePercent: number;
    riskValueMultiplier: number;
    evidence: string;
  }
): BuyerValueSensitivityCase {
  const assumptions = scenario.assumptions;
  const assistedHoursPerCycle = Math.max(0.5, assumptions.manualHoursPerCycle * (1 - input.automationRatePercent / 100));
  const hoursSavedPerCycle = Math.max(0, assumptions.manualHoursPerCycle - assistedHoursPerCycle);
  const monthlyHoursSaved = round1(hoursSavedPerCycle * assumptions.cyclesPerMonth * (input.adoptionRatePercent / 100));
  const monthlyLaborValueYen = roundYen(monthlyHoursSaved * assumptions.hourlyCostYen);
  const monthlyRiskValueYen = roundYen(
    (scenario.monthlyRiskValueYen / Math.max(assumptions.adoptionRatePercent, 1)) * input.adoptionRatePercent * input.riskValueMultiplier
  );
  const monthlyValueYen = monthlyLaborValueYen + monthlyRiskValueYen;
  const paybackDays = monthlyValueYen <= 0 ? 999 : Math.ceil((scenario.pilotInvestmentYen / monthlyValueYen) * 30);

  return {
    id: input.id,
    label: input.label,
    adoptionRatePercent: input.adoptionRatePercent,
    automationRatePercent: input.automationRatePercent,
    monthlyHoursSaved,
    monthlyValueYen,
    paybackDays,
    status: statusFromPayback(paybackDays),
    evidence: input.evidence
  };
}

function buildBreakEvenAdoption(scenario: BuyerValueScenario) {
  const targetMonthlyValueYen = (scenario.pilotInvestmentYen * 30) / 45;
  const valuePerAdoptionPoint = scenario.monthlyGrossValueYen / Math.max(scenario.assumptions.adoptionRatePercent, 1);
  if (valuePerAdoptionPoint <= 0) return 150;
  return Math.round(clamp(Math.ceil(targetMonthlyValueYen / valuePerAdoptionPoint), 5, 150));
}

function verdictFrom(input: {
  scenario: BuyerValueScenario;
  pessimistic: BuyerValueSensitivityCase;
  base: BuyerValueSensitivityCase;
  breakEvenAdoptionPercent: number;
}): BuyerValueSensitivityVerdict {
  const currentAdoption = input.scenario.assumptions.adoptionRatePercent;
  if (input.pessimistic.paybackDays <= 60 && input.breakEvenAdoptionPercent <= currentAdoption && input.scenario.confidenceScore >= 70) {
    return "defensible";
  }
  if (input.base.paybackDays <= 60 && input.breakEvenAdoptionPercent <= Math.min(100, currentAdoption + 15) && input.scenario.confidenceScore >= 55) {
    return "fragile";
  }
  return "not-defensible";
}

function buildGuardrails(input: {
  scenario: BuyerValueScenario;
  pessimistic: BuyerValueSensitivityCase;
  base: BuyerValueSensitivityCase;
  breakEvenAdoptionPercent: number;
  valueAtRiskYen: number;
}): BuyerValueSensitivityGuardrail[] {
  const currentAdoption = input.scenario.assumptions.adoptionRatePercent;
  const valueAtRiskRatio = input.base.monthlyValueYen <= 0 ? 1 : input.valueAtRiskYen / input.base.monthlyValueYen;

  return [
    {
      id: "break-even-adoption",
      label: "Break-even adoption",
      status:
        input.breakEvenAdoptionPercent <= currentAdoption
          ? "clear"
          : input.breakEvenAdoptionPercent <= Math.min(100, currentAdoption + 15)
            ? "watch"
            : "blocked",
      value: `${input.breakEvenAdoptionPercent}%`,
      evidence: `Current assumption is ${currentAdoption}%. The pilot needs this adoption level to pay back within 45 days.`
    },
    {
      id: "downside-payback",
      label: "Downside payback",
      status: input.pessimistic.status,
      value: `${input.pessimistic.paybackDays} days`,
      evidence: "Pessimistic case reduces adoption, automation, and risk capture before the rollout ask."
    },
    {
      id: "value-at-risk",
      label: "Value at risk",
      status: statusFromThreshold(valueAtRiskRatio, 0.45, 0.7),
      value: formatYen(input.valueAtRiskYen),
      evidence: "Monthly value lost when the buyer only reaches the pessimistic case."
    }
  ];
}

function buildMarkdown(input: Omit<BuyerValueSensitivity, "exportMarkdown">) {
  return [
    "# Buyer value sensitivity",
    "",
    `Verdict: ${input.verdict}`,
    `Confidence band: ${input.confidenceBand}`,
    `Break-even adoption: ${input.breakEvenAdoptionPercent}%`,
    `Value at risk: ${formatYen(input.valueAtRiskYen)}`,
    "",
    "## Sensitivity cases",
    ...input.cases.map(
      (item) =>
        `- ${item.label}: ${formatYen(item.monthlyValueYen)} / month, ${item.monthlyHoursSaved}h saved, ${item.paybackDays} day payback, ${item.adoptionRatePercent}% adoption, ${item.automationRatePercent}% automation.`
    ),
    "",
    "## Guardrails",
    ...input.guardrails.map((guardrail) => `- [${guardrail.status}] ${guardrail.label}: ${guardrail.value} - ${guardrail.evidence}`)
  ].join("\n");
}

export function buildBuyerValueSensitivity(scenario: BuyerValueScenario): BuyerValueSensitivity {
  const assumptions = scenario.assumptions;
  const pessimistic = buildCase(scenario, {
    id: "pessimistic",
    label: "Pessimistic",
    adoptionRatePercent: Math.round(clamp(assumptions.adoptionRatePercent * 0.65, 5, 100)),
    automationRatePercent: Math.round(clamp(scenario.automationRatePercent * 0.75, 15, 90)),
    riskValueMultiplier: 0.5,
    evidence: "65% of assumed adoption, 75% of modeled automation, and half of the risk value captured."
  });
  const base = buildCase(scenario, {
    id: "base",
    label: "Base",
    adoptionRatePercent: assumptions.adoptionRatePercent,
    automationRatePercent: scenario.automationRatePercent,
    riskValueMultiplier: 1,
    evidence: "Uses the current Buyer Value Simulator assumptions."
  });
  const upside = buildCase(scenario, {
    id: "upside",
    label: "Upside",
    adoptionRatePercent: Math.round(clamp(assumptions.adoptionRatePercent * 1.15 + 8, 5, 100)),
    automationRatePercent: Math.round(clamp(scenario.automationRatePercent * 1.12 + 4, 15, 90)),
    riskValueMultiplier: 1.1,
    evidence: "Assumes smoother rollout, stronger automation reuse, and slightly higher risk capture."
  });
  const cases = [pessimistic, base, upside];
  const breakEvenAdoptionPercent = buildBreakEvenAdoption(scenario);
  const valueAtRiskYen = Math.max(0, base.monthlyValueYen - pessimistic.monthlyValueYen);
  const verdict = verdictFrom({ scenario, pessimistic, base, breakEvenAdoptionPercent });
  const confidenceBand = `${formatYen(pessimistic.monthlyValueYen)} - ${formatYen(upside.monthlyValueYen)} / month`;
  const partial = {
    id: `buyer-value-sensitivity-${verdict}-${breakEvenAdoptionPercent}`,
    verdict,
    confidenceBand,
    breakEvenAdoptionPercent,
    valueAtRiskYen,
    cases,
    guardrails: buildGuardrails({ scenario, pessimistic, base, breakEvenAdoptionPercent, valueAtRiskYen })
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}
