import type { BuyerValueScenario } from "./buyerValueScenario.js";
import { normalizePilotRunReceiptInput, type PilotRunReceiptInput } from "./pilotRunReceipt.js";

export type BuyerPilotMeasuredRunReadiness = "measured" | "needs-reviewer" | "needs-acceptance" | "needs-savings";

export type BuyerPilotMeasuredRunSummary = {
  readiness: BuyerPilotMeasuredRunReadiness;
  actualMinutesSavedPerRun: number;
  acceptanceRatePercent: number;
  measuredMonthlyHoursSaved: number;
  measuredMonthlyLaborValueYen: number;
  measuredMonthlyValueYen: number;
  headline: string;
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function roundYen(value: number) {
  return Math.round(value / 1000) * 1000;
}

function headlineFor(readiness: BuyerPilotMeasuredRunReadiness) {
  if (readiness === "measured") return "Measured pilot value is ready to cite";
  if (readiness === "needs-reviewer") return "Name the reviewer before sharing";
  if (readiness === "needs-acceptance") return "Acceptance is still too weak";
  return "The run needs measurable time savings";
}

export function buildBuyerPilotMeasuredRunSummary(pilotRun: Partial<PilotRunReceiptInput>, buyerScenario: BuyerValueScenario): BuyerPilotMeasuredRunSummary {
  const normalized = normalizePilotRunReceiptInput(pilotRun);
  const actualMinutesSavedPerRun = Math.max(0, normalized.observedManualMinutes - normalized.observedAssistedMinutes);
  const acceptanceRatePercent = Math.round((normalized.acceptedTasks / Math.max(1, normalized.totalTasks)) * 100);
  const measuredMonthlyHoursSaved = round1(
    (actualMinutesSavedPerRun / 60) * buyerScenario.assumptions.cyclesPerMonth * (buyerScenario.assumptions.adoptionRatePercent / 100)
  );
  const measuredMonthlyLaborValueYen = roundYen(measuredMonthlyHoursSaved * buyerScenario.assumptions.hourlyCostYen);
  const measuredRiskValueYen = roundYen(buyerScenario.monthlyRiskValueYen * (acceptanceRatePercent / 100) * 0.5);
  const measuredMonthlyValueYen = measuredMonthlyLaborValueYen + measuredRiskValueYen;
  const readiness: BuyerPilotMeasuredRunReadiness =
    actualMinutesSavedPerRun <= 0
      ? "needs-savings"
      : acceptanceRatePercent < 70
        ? "needs-acceptance"
        : normalized.reviewerName.trim()
          ? "measured"
          : "needs-reviewer";

  return {
    readiness,
    actualMinutesSavedPerRun,
    acceptanceRatePercent,
    measuredMonthlyHoursSaved,
    measuredMonthlyLaborValueYen,
    measuredMonthlyValueYen,
    headline: headlineFor(readiness)
  };
}
