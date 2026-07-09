import type { BuyerValueScenario, BuyerValueScenarioAction, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import type { BuyerValueSensitivity, BuyerValueSensitivityGuardrail } from "./buyerValueSensitivity.js";

export type BuyerValueCommitmentDecision = "send-to-sponsor" | "run-contained-pilot" | "hold-pitch";

export type BuyerValueCommitmentCondition = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  value: string;
  evidence: string;
};

export type BuyerValueCommitmentRedLine = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  trigger: string;
  action: string;
};

export type BuyerValueCommitment = {
  id: string;
  decision: BuyerValueCommitmentDecision;
  headline: string;
  hardTruth: string;
  askLabel: string;
  recommendedAskYen: number;
  askInstruction: string;
  decisionOwner: string;
  conditions: BuyerValueCommitmentCondition[];
  redLines: BuyerValueCommitmentRedLine[];
  nextProofMove: BuyerValueScenarioAction;
  exportMarkdown: string;
};

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function roundYen(value: number) {
  return Math.round(value / 1000) * 1000;
}

function conditionStatus(value: number, clearAt: number, watchAt: number): BuyerValueScenarioStatus {
  if (value >= clearAt) return "clear";
  if (value >= watchAt) return "watch";
  return "blocked";
}

function askStatus(recommendedAskYen: number, scenario: BuyerValueScenario): BuyerValueScenarioStatus {
  if (recommendedAskYen <= 0) return "blocked";
  if (recommendedAskYen <= scenario.pilotBudgetCeilingYen) return "clear";
  if (recommendedAskYen <= scenario.pilotBudgetCeilingYen * 1.5) return "watch";
  return "blocked";
}

function decisionFrom(scenario: BuyerValueScenario, sensitivity: BuyerValueSensitivity): BuyerValueCommitmentDecision {
  if (scenario.readiness === "scales-now" && sensitivity.verdict === "defensible") return "send-to-sponsor";
  if (scenario.readiness !== "not-yet" && sensitivity.verdict !== "not-defensible") return "run-contained-pilot";
  return "hold-pitch";
}

function headlineFor(decision: BuyerValueCommitmentDecision) {
  if (decision === "send-to-sponsor") return "Ask for the first buyer pilot with explicit stop lines";
  if (decision === "run-contained-pilot") return "Keep the ask small until the downside case is proven";
  return "Hold the pitch and repair the value proof first";
}

function fallbackNextMove(decision: BuyerValueCommitmentDecision): BuyerValueScenarioAction {
  if (decision === "hold-pitch") {
    return {
      id: "repair-value",
      owner: "A2A Market Broker",
      priority: "now",
      action: "Tighten the buyer workflow, adoption assumption, and proof source before asking for budget.",
      proof: "Buyer Value Simulator, measurement plan, and public proof URL"
    };
  }

  return {
    id: "seal-value-proof",
    owner: "Cloud Run SRE",
    priority: decision === "send-to-sponsor" ? "next" : "now",
    action: "Attach public launch evidence and one measured run before expanding the pilot.",
    proof: "Buyer value report, pilot receipt, and live launch evidence"
  };
}

function guardrailById(sensitivity: BuyerValueSensitivity, id: string): BuyerValueSensitivityGuardrail | undefined {
  return sensitivity.guardrails.find((guardrail) => guardrail.id === id);
}

function buildRecommendedAsk(decision: BuyerValueCommitmentDecision, scenario: BuyerValueScenario) {
  if (decision === "hold-pitch") return 0;
  const ceiling = Math.max(0, scenario.pilotBudgetCeilingYen);
  const investment = Math.max(0, scenario.pilotInvestmentYen);
  if (ceiling === 0) return 0;
  const cap = decision === "send-to-sponsor" ? ceiling : roundYen(ceiling * 0.65);
  return Math.min(investment, cap);
}

function buildHardTruth(input: {
  decision: BuyerValueCommitmentDecision;
  scenario: BuyerValueScenario;
  sensitivity: BuyerValueSensitivity;
  recommendedAskYen: number;
}) {
  const downside = input.sensitivity.cases[0];
  if (input.decision === "send-to-sponsor") {
    return `The first ask can be capped at ${yen(input.recommendedAskYen)} because base payback is ${input.scenario.paybackDays} days and downside payback is ${downside.paybackDays} days.`;
  }
  if (input.decision === "run-contained-pilot") {
    return `The base case pays back in ${input.scenario.paybackDays} days, but downside payback is ${downside.paybackDays} days. Ask for a measured pilot, not rollout.`;
  }
  return `Current assumptions are not buyer-safe: base payback is ${input.scenario.paybackDays} days and break-even adoption is ${input.sensitivity.breakEvenAdoptionPercent}%.`;
}

function buildConditions(scenario: BuyerValueScenario, sensitivity: BuyerValueSensitivity, recommendedAskYen: number): BuyerValueCommitmentCondition[] {
  const downside = sensitivity.cases[0];
  const breakEven = guardrailById(sensitivity, "break-even-adoption");
  const valueAtRisk = guardrailById(sensitivity, "value-at-risk");

  return [
    {
      id: "adoption-floor",
      label: "Adoption floor",
      status: breakEven?.status ?? "blocked",
      value: `${scenario.assumptions.adoptionRatePercent}% assumed / ${sensitivity.breakEvenAdoptionPercent}% needed`,
      evidence: breakEven?.evidence ?? "Break-even adoption could not be derived from the value model."
    },
    {
      id: "downside-payback",
      label: "Downside payback",
      status: downside.status,
      value: `${downside.paybackDays} days`,
      evidence: downside.evidence
    },
    {
      id: "evidence-confidence",
      label: "Evidence confidence",
      status: conditionStatus(scenario.confidenceScore, 70, 55),
      value: `${scenario.confidenceScore}/100`,
      evidence: "Confidence blends delivery, reliability, governance, usability, and selected-agent risk coverage."
    },
    {
      id: "pilot-ask",
      label: "Pilot ask discipline",
      status: askStatus(recommendedAskYen, scenario),
      value: `${yen(recommendedAskYen)} ask / ${yen(scenario.pilotBudgetCeilingYen)} ceiling`,
      evidence: `Modeled investment is ${yen(scenario.pilotInvestmentYen)}; the buyer-facing ask is capped below the first-month value comfort line.`
    },
    {
      id: "value-at-risk",
      label: "Value at risk",
      status: valueAtRisk?.status ?? "blocked",
      value: yen(sensitivity.valueAtRiskYen),
      evidence: valueAtRisk?.evidence ?? "Value at risk could not be derived from the sensitivity model."
    }
  ];
}

function buildRedLines(scenario: BuyerValueScenario, sensitivity: BuyerValueSensitivity): BuyerValueCommitmentRedLine[] {
  const downside = sensitivity.cases[0];
  return [
    {
      id: "adoption",
      label: "Adoption falls below break-even",
      status: guardrailById(sensitivity, "break-even-adoption")?.status ?? "blocked",
      trigger: `Buyer cannot commit to at least ${sensitivity.breakEvenAdoptionPercent}% adoption in the pilot lane.`,
      action: "Shrink the pilot audience or change the workflow before presenting ROI."
    },
    {
      id: "measured-savings",
      label: "Measured savings misses the base case",
      status: downside.status,
      trigger: `Observed payback trends beyond ${Math.max(60, downside.paybackDays)} days after the first measured run.`,
      action: "Stop expansion and rerun the workflow with a narrower acceptance scope."
    },
    {
      id: "proof",
      label: "Public proof is not shareable",
      status: scenario.confidenceScore >= 70 ? "clear" : scenario.confidenceScore >= 55 ? "watch" : "blocked",
      trigger: "The buyer cannot open the proof URL, pilot receipt, or live launch evidence without internal access.",
      action: "Hold external sharing until proof links are public and verified."
    }
  ];
}

function askLabelFor(decision: BuyerValueCommitmentDecision) {
  if (decision === "hold-pitch") return "No budget ask";
  if (decision === "send-to-sponsor") return "Pilot ask ceiling";
  return "Contained pilot ask";
}

function askInstructionFor(decision: BuyerValueCommitmentDecision, recommendedAskYen: number) {
  if (decision === "hold-pitch") return "Do not request budget until adoption, payback, and public proof are repaired.";
  if (decision === "send-to-sponsor") return `Ask up to ${yen(recommendedAskYen)} and expand only after measured proof clears the red lines.`;
  return `Ask up to ${yen(recommendedAskYen)} for one measured run; keep rollout language out of the pitch.`;
}

function ownerFor(decision: BuyerValueCommitmentDecision) {
  if (decision === "hold-pitch") return "A2A Market Broker";
  if (decision === "run-contained-pilot") return "Buyer sponsor";
  return "Executive sponsor";
}

function buildMarkdown(input: Omit<BuyerValueCommitment, "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    `Decision: ${input.decision}`,
    `Decision owner: ${input.decisionOwner}`,
    `${input.askLabel}: ${yen(input.recommendedAskYen)}`,
    "",
    input.hardTruth,
    "",
    "## What must be true",
    ...input.conditions.map((condition) => `- [${condition.status}] ${condition.label}: ${condition.value}. ${condition.evidence}`),
    "",
    "## Red lines",
    ...input.redLines.map((redLine) => `- [${redLine.status}] ${redLine.label}: ${redLine.trigger} ${redLine.action}`),
    "",
    "## Next proof move",
    `- [${input.nextProofMove.priority}] ${input.nextProofMove.owner}: ${input.nextProofMove.action}`,
    `- Proof: ${input.nextProofMove.proof}`
  ].join("\n");
}

export function buildBuyerValueCommitment(input: { scenario: BuyerValueScenario; sensitivity: BuyerValueSensitivity }): BuyerValueCommitment {
  const decision = decisionFrom(input.scenario, input.sensitivity);
  const recommendedAskYen = buildRecommendedAsk(decision, input.scenario);
  const nextProofMove = input.scenario.nextActions[0] ?? fallbackNextMove(decision);
  const partial = {
    id: `buyer-value-commitment-${decision}-${input.scenario.scenarioScore}`,
    decision,
    headline: headlineFor(decision),
    hardTruth: buildHardTruth({ decision, scenario: input.scenario, sensitivity: input.sensitivity, recommendedAskYen }),
    askLabel: askLabelFor(decision),
    recommendedAskYen,
    askInstruction: askInstructionFor(decision, recommendedAskYen),
    decisionOwner: ownerFor(decision),
    conditions: buildConditions(input.scenario, input.sensitivity, recommendedAskYen),
    redLines: buildRedLines(input.scenario, input.sensitivity),
    nextProofMove
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}
