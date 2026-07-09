import type { BuyerPilotMeasuredRunSummary } from "./buyerPilotMeasuredRun";
import type { BuyerValueScenario, BuyerValueScenarioInput } from "./buyerValueScenario";
import {
  HOMEPAGE_VALUE_LENS_RECEIPT_VERSION,
  buildHomepageValueLensReceipt,
  type HomepageValueLensReceipt
} from "./homepageValueLensReceipt";

export type HomepageValueLensStatus = "ready" | "attention" | "blocked";

export type HomepageValueLensAction = {
  label: string;
  href: string;
  external: boolean;
};

export type HomepageValueLensMetric = {
  id: string;
  label: string;
  value: string;
  status: HomepageValueLensStatus;
  evidence: string;
};

export type HomepageValueLensCoachLever = {
  id: "adoption" | "measured-support" | "payback" | "confidence";
  label: string;
  status: HomepageValueLensStatus;
  value: string;
  evidence: string;
  action: string;
};

export type HomepageValueLensCoach = {
  status: HomepageValueLensStatus;
  label: string;
  headline: string;
  summary: string;
  sendRule: string;
  buyerAsk: string;
  nextMove: string;
  levers: HomepageValueLensCoachLever[];
};

export type HomepageValueLensSnapshot = {
  status: HomepageValueLensStatus;
  headline: string;
  buyer: string;
  valueClaim: string;
  monthlyValueYen: number;
  measuredMonthlyValueYen: number;
  measuredSupportPercent: number;
  paybackDays: number;
  confidenceScore: number;
  monthlyHoursSaved: number;
  pilotBudgetCeilingYen: number;
  assumptions: BuyerValueScenarioInput;
  primaryAction: HomepageValueLensAction;
  workflowAction: HomepageValueLensAction;
  metrics: HomepageValueLensMetric[];
  readinessCoach: HomepageValueLensCoach;
  receipt: HomepageValueLensReceipt;
  exportMarkdown: string;
};

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function statusFrom(input: { scenario: BuyerValueScenario; measuredRun: BuyerPilotMeasuredRunSummary; measuredSupportPercent: number }): HomepageValueLensStatus {
  if (input.scenario.readiness === "not-yet" || input.measuredRun.readiness === "needs-savings") return "blocked";
  if (input.scenario.readiness === "scales-now" && input.measuredRun.readiness === "measured" && input.measuredSupportPercent >= 70) return "ready";
  return "attention";
}

function headlineFor(status: HomepageValueLensStatus) {
  if (status === "ready") return "This workflow has a defendable value case";
  if (status === "attention") return "Start with a bounded value pilot";
  return "Tighten the workflow before pitching value";
}

function metricStatus(value: number, ready: number, attention: number): HomepageValueLensStatus {
  if (value >= ready) return "ready";
  if (value >= attention) return "attention";
  return "blocked";
}

function coachLabel(status: HomepageValueLensStatus) {
  if (status === "ready") return "Buyer-ready";
  if (status === "attention") return "Pilot first";
  return "Do not send";
}

function roundYen(value: number) {
  return Math.round(value / 1000) * 1000;
}

function buildHomepageValueLensCoach(input: {
  buyer: string;
  status: HomepageValueLensStatus;
  monthlyValueYen: number;
  measuredMonthlyValueYen: number;
  measuredSupportPercent: number;
  paybackDays: number;
  confidenceScore: number;
  pilotBudgetCeilingYen: number;
  assumptions: BuyerValueScenarioInput;
  metrics: HomepageValueLensMetric[];
}): HomepageValueLensCoach {
  const firstOpenMetric = input.metrics.find((metric) => metric.status === "blocked") ?? input.metrics.find((metric) => metric.status === "attention");
  const currentAdoption = Math.max(1, input.assumptions.adoptionRatePercent);
  const targetAdoption = Math.min(100, Math.max(70, currentAdoption + 10));
  const projectedAdoptionValueYen = roundYen(input.monthlyValueYen * (targetAdoption / currentAdoption));
  const adoptionLiftYen = Math.max(0, projectedAdoptionValueYen - input.monthlyValueYen);
  const safePilotAskYen = input.status === "ready" ? input.pilotBudgetCeilingYen : Math.min(input.pilotBudgetCeilingYen, roundYen(Math.max(input.measuredMonthlyValueYen, input.monthlyValueYen * 0.18)));
  const levers: HomepageValueLensCoachLever[] = [
    {
      id: "adoption",
      label: "Adoption lift",
      status: metricStatus(input.assumptions.adoptionRatePercent, 70, 55),
      value: input.assumptions.adoptionRatePercent >= 70 ? `${input.assumptions.adoptionRatePercent}% adoption is defendable` : `${yen(adoptionLiftYen)}/month unlocked at ${targetAdoption}% adoption`,
      evidence: `${input.assumptions.teamSize} people, ${input.assumptions.cyclesPerMonth} cycles/month, ${input.assumptions.manualHoursPerCycle} manual hours/cycle.`,
      action:
        input.assumptions.adoptionRatePercent >= 70
          ? "Keep adoption evidence attached to the value receipt."
          : "Run first-user proof and remove the adoption blocker."
    },
    {
      id: "measured-support",
      label: "Measured support",
      status: metricStatus(input.measuredSupportPercent, 70, 40),
      value: `${input.measuredSupportPercent}% measured against model`,
      evidence: `${yen(input.measuredMonthlyValueYen)} measured support for ${yen(input.monthlyValueYen)} modeled value.`,
      action:
        input.measuredSupportPercent >= 70
          ? "Use the measured run as the lead buyer proof."
          : "Collect a fresh measured run before external value sharing."
    },
    {
      id: "payback",
      label: "Payback guardrail",
      status: input.paybackDays <= 30 ? "ready" : input.paybackDays <= 60 ? "attention" : "blocked",
      value: `${input.paybackDays} days payback`,
      evidence: `${yen(input.pilotBudgetCeilingYen)} pilot ceiling against modeled monthly value.`,
      action: input.paybackDays <= 30 ? "Keep the pilot ask inside the current ceiling." : "Narrow the first pilot so payback lands under 30 days."
    },
    {
      id: "confidence",
      label: "Evidence confidence",
      status: metricStatus(input.confidenceScore, 76, 62),
      value: `${input.confidenceScore}/100 confidence`,
      evidence: "Reliability, usability, governance, delivery, and agent risk capability.",
      action: input.confidenceScore >= 76 ? "Attach receipt and proof packet to the buyer handoff." : "Attach release, acceptance, and proof receipts before review."
    }
  ];
  const headline =
    input.status === "ready"
      ? "Value claim can move to buyer review"
      : input.status === "attention"
        ? "Frame this as a bounded pilot ask"
        : "Hold the value claim inside the workspace";
  const summary =
    input.status === "ready"
      ? `${input.buyer} can inspect the value receipt, measured run, and payback guardrail before deciding.`
      : input.status === "attention"
        ? `${firstOpenMetric?.label ?? "One value metric"} still needs evidence, so the buyer ask should stay narrow.`
        : `${firstOpenMetric?.label ?? "The value case"} blocks external sharing until the next proof run closes.`;
  const sendRule =
    input.status === "ready"
      ? "Send the value report with value receipt, measured run, and proof packet attached."
      : input.status === "attention"
        ? "Send a pilot ask, not a rollout claim, until the watch metric is ready."
        : `Do not pitch the monthly value externally until ${firstOpenMetric?.label ?? "the value blocker"} is repaired.`;
  const buyerAsk =
    input.status === "ready"
      ? `Ask ${input.buyer} to approve a measured pilot capped at ${yen(safePilotAskYen)}.`
      : input.status === "attention"
        ? `Ask ${input.buyer} for a bounded pilot capped at ${yen(safePilotAskYen)} with receipt review.`
        : `Ask ${input.buyer} to confirm the workflow and run measured proof before budget approval.`;
  const nextMove = levers.find((lever) => lever.status === "blocked")?.action ?? levers.find((lever) => lever.status === "attention")?.action ?? "Keep receipts fresh and move the value case into buyer review.";

  return {
    status: input.status,
    label: coachLabel(input.status),
    headline,
    summary,
    sendRule,
    buyerAsk,
    nextMove,
    levers
  };
}

function buildMarkdown(snapshot: Omit<HomepageValueLensSnapshot, "exportMarkdown">) {
  return [
    "# Homepage value lens",
    "",
    `Buyer: ${snapshot.buyer}`,
    `Status: ${snapshot.status}`,
    `Headline: ${snapshot.headline}`,
    `Value claim: ${snapshot.valueClaim}`,
    "",
    "## Result",
    `- Modeled monthly value: ${yen(snapshot.monthlyValueYen)}`,
    `- Measured monthly value: ${yen(snapshot.measuredMonthlyValueYen)}`,
    `- Measured support: ${snapshot.measuredSupportPercent}%`,
    `- Payback: ${snapshot.paybackDays} days`,
    `- Confidence: ${snapshot.confidenceScore}/100`,
    `- Monthly hours saved: ${snapshot.monthlyHoursSaved}`,
    `- Pilot budget ceiling: ${yen(snapshot.pilotBudgetCeilingYen)}`,
    "",
    "## Assumptions",
    `- Team: ${snapshot.assumptions.teamSize}`,
    `- Cycles per month: ${snapshot.assumptions.cyclesPerMonth}`,
    `- Manual hours per cycle: ${snapshot.assumptions.manualHoursPerCycle}`,
    `- Adoption: ${snapshot.assumptions.adoptionRatePercent}%`,
    `- Hourly cost: ${yen(snapshot.assumptions.hourlyCostYen)}`,
    "",
    "## Metrics",
    ...snapshot.metrics.map((metric) => `- [${metric.status}] ${metric.label}: ${metric.value}. ${metric.evidence}`),
    "",
    "## Buyer readiness coach",
    `- Label: ${snapshot.readinessCoach.label}`,
    `- Send rule: ${snapshot.readinessCoach.sendRule}`,
    `- Buyer ask: ${snapshot.readinessCoach.buyerAsk}`,
    `- Next move: ${snapshot.readinessCoach.nextMove}`,
    ...snapshot.readinessCoach.levers.map((lever) => `- [${lever.status}] ${lever.label}: ${lever.value}. ${lever.action}`),
    "",
    "## Receipt",
    `- Receipt: ${snapshot.receipt.receiptId}`,
    `- Checksum: ${snapshot.receipt.checksumAlgorithm}:${snapshot.receipt.checksum}`,
    `- API verification: POST ${snapshot.receipt.verificationApiPath}`,
    `- Verification: ${snapshot.receipt.verification.status}`,
    "",
    `First action: ${snapshot.primaryAction.label} (${snapshot.primaryAction.href})`,
    `Workflow action: ${snapshot.workflowAction.label} (${snapshot.workflowAction.href})`
  ].join("\n");
}

export function buildHomepageValueLensSnapshot({
  buyer,
  scenario,
  measuredRun,
  valueReportHref,
  workflowIntakeHref = "#quick-workflow-intake"
}: {
  buyer: string;
  scenario: BuyerValueScenario;
  measuredRun: BuyerPilotMeasuredRunSummary;
  valueReportHref: string;
  workflowIntakeHref?: string;
}): HomepageValueLensSnapshot {
  const measuredSupportPercent = Math.round((measuredRun.measuredMonthlyValueYen / Math.max(1, scenario.monthlyGrossValueYen)) * 100);
  const status = statusFrom({ scenario, measuredRun, measuredSupportPercent });
  const primaryAction: HomepageValueLensAction = {
    label: status === "blocked" ? "Fix value case" : "Open value report",
    href: status === "blocked" ? "#buyer-value-simulator" : valueReportHref,
    external: /^https?:\/\//i.test(status === "blocked" ? "#buyer-value-simulator" : valueReportHref)
  };
  const workflowAction: HomepageValueLensAction = {
    label: "Start with workflow",
    href: workflowIntakeHref,
    external: /^https?:\/\//i.test(workflowIntakeHref)
  };
  const partial: Omit<HomepageValueLensSnapshot, "exportMarkdown" | "receipt"> = {
    status,
    headline: headlineFor(status),
    buyer,
    valueClaim: `${buyer} can inspect ${yen(scenario.monthlyGrossValueYen)} modeled monthly value, ${yen(measuredRun.measuredMonthlyValueYen)} measured support, and ${scenario.paybackDays}-day payback before opening the full report.`,
    monthlyValueYen: scenario.monthlyGrossValueYen,
    measuredMonthlyValueYen: measuredRun.measuredMonthlyValueYen,
    measuredSupportPercent,
    paybackDays: scenario.paybackDays,
    confidenceScore: scenario.confidenceScore,
    monthlyHoursSaved: scenario.monthlyHoursSaved,
    pilotBudgetCeilingYen: scenario.pilotBudgetCeilingYen,
    assumptions: scenario.assumptions,
    primaryAction,
    workflowAction,
    metrics: [
      {
        id: "modeled-value",
        label: "Modeled value",
        value: yen(scenario.monthlyGrossValueYen),
        status: metricStatus(scenario.monthlyGrossValueYen, 500000, 100000),
        evidence: `${scenario.monthlyHoursSaved} hours/month saved at ${scenario.assumptions.adoptionRatePercent}% adoption.`
      },
      {
        id: "measured-support",
        label: "Measured support",
        value: `${measuredSupportPercent}%`,
        status: metricStatus(measuredSupportPercent, 70, 40),
        evidence: `${yen(measuredRun.measuredMonthlyValueYen)} measured value from ${measuredRun.acceptanceRatePercent}% accepted tasks.`
      },
      {
        id: "payback",
        label: "Payback",
        value: `${scenario.paybackDays} days`,
        status: scenario.paybackDays <= 30 ? "ready" : scenario.paybackDays <= 60 ? "attention" : "blocked",
        evidence: `${yen(scenario.pilotInvestmentYen)} pilot investment against ${yen(scenario.monthlyGrossValueYen)} monthly value.`
      },
      {
        id: "confidence",
        label: "Confidence",
        value: `${scenario.confidenceScore}/100`,
        status: metricStatus(scenario.confidenceScore, 76, 62),
        evidence: "Based on reliability, usability, governance, delivery, and selected-agent risk capability."
      }
    ],
    readinessCoach: {
      status,
      label: coachLabel(status),
      headline: "",
      summary: "",
      sendRule: "",
      buyerAsk: "",
      nextMove: "",
      levers: []
    }
  };
  partial.readinessCoach = buildHomepageValueLensCoach({
    buyer: partial.buyer,
    status: partial.status,
    monthlyValueYen: partial.monthlyValueYen,
    measuredMonthlyValueYen: partial.measuredMonthlyValueYen,
    measuredSupportPercent: partial.measuredSupportPercent,
    paybackDays: partial.paybackDays,
    confidenceScore: partial.confidenceScore,
    pilotBudgetCeilingYen: partial.pilotBudgetCeilingYen,
    assumptions: partial.assumptions,
    metrics: partial.metrics
  });
  const receipt = buildHomepageValueLensReceipt({
    receiptVersion: HOMEPAGE_VALUE_LENS_RECEIPT_VERSION,
    source: "homepage-value-lens",
    buyer: partial.buyer,
    status: partial.status,
    headline: partial.headline,
    valueClaim: partial.valueClaim,
    monthlyValueYen: partial.monthlyValueYen,
    measuredMonthlyValueYen: partial.measuredMonthlyValueYen,
    measuredSupportPercent: partial.measuredSupportPercent,
    paybackDays: partial.paybackDays,
    confidenceScore: partial.confidenceScore,
    monthlyHoursSaved: partial.monthlyHoursSaved,
    pilotBudgetCeilingYen: partial.pilotBudgetCeilingYen,
    assumptions: partial.assumptions,
    metrics: partial.metrics,
    primaryAction: {
      label: partial.primaryAction.label,
      href: partial.primaryAction.href
    },
    workflowAction: {
      label: partial.workflowAction.label,
      href: partial.workflowAction.href
    }
  });
  const withReceipt: Omit<HomepageValueLensSnapshot, "exportMarkdown"> = {
    ...partial,
    receipt
  };

  return {
    ...withReceipt,
    exportMarkdown: buildMarkdown(withReceipt)
  };
}
