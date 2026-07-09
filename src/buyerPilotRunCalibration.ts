import type { BuyerValueScenario } from "./buyerValueScenario.js";
import { normalizePilotRunReceiptInput, type PilotRunReceiptInput } from "./pilotRunReceipt.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";

export type BuyerPilotRunCalibrationReadiness = "target-met" | "needs-savings" | "needs-evidence" | "needs-scope" | "needs-acceptance";

export type BuyerPilotRunCalibrationCheck = {
  id: "savings" | "acceptance" | "evidence" | "participants";
  label: string;
  status: "pass" | "watch" | "block";
  value: string;
  target: string;
  action: string;
};

export type BuyerPilotRunCalibration = {
  readiness: BuyerPilotRunCalibrationReadiness;
  plannedMinutesSavedPerRun: number;
  minimumAcceptedSavingsMinutes: number;
  actualMinutesSavedPerRun: number;
  savingsGapMinutes: number;
  acceptanceRatePercent: number;
  headline: string;
  checks: BuyerPilotRunCalibrationCheck[];
};

function minutesFromHours(value: number) {
  return Math.max(1, Math.round(value * 60));
}

function headlineFor(readiness: BuyerPilotRunCalibrationReadiness) {
  if (readiness === "target-met") return "Measured run can unlock buyer-ready artifacts";
  if (readiness === "needs-evidence") return "Attach public run evidence to unlock the receipt";
  if (readiness === "needs-acceptance") return "Task acceptance is below the buyer-ready floor";
  if (readiness === "needs-scope") return "Add enough participants for a credible buyer run";
  return "Measure a stronger time saving run";
}

export function buildBuyerPilotRunCalibration(pilotRun: Partial<PilotRunReceiptInput>, buyerScenario: BuyerValueScenario): BuyerPilotRunCalibration {
  const normalized = normalizePilotRunReceiptInput(pilotRun);
  const plannedMinutesSavedPerRun = Math.max(0, minutesFromHours(buyerScenario.assumptions.manualHoursPerCycle) - minutesFromHours(buyerScenario.assistedHoursPerCycle));
  const minimumAcceptedSavingsMinutes = Math.ceil(plannedMinutesSavedPerRun * 0.7);
  const actualMinutesSavedPerRun = Math.max(0, normalized.observedManualMinutes - normalized.observedAssistedMinutes);
  const savingsGapMinutes = Math.max(0, minimumAcceptedSavingsMinutes - actualMinutesSavedPerRun);
  const acceptanceRatePercent = Math.round((normalized.acceptedTasks / Math.max(1, normalized.totalTasks)) * 100);
  const evidenceReady = isBuyerFacingProofUrl(normalized.evidenceUrl);
  const savingsPass = actualMinutesSavedPerRun >= minimumAcceptedSavingsMinutes;
  const acceptancePass = acceptanceRatePercent >= 70;
  const participantsPass = normalized.participants >= 3;
  const readiness: BuyerPilotRunCalibrationReadiness = !savingsPass
    ? "needs-savings"
    : !acceptancePass
      ? "needs-acceptance"
      : !evidenceReady
        ? "needs-evidence"
        : !participantsPass
          ? "needs-scope"
          : "target-met";
  const checks: BuyerPilotRunCalibrationCheck[] = [
    {
      id: "savings",
      label: "Savings target",
      status: savingsPass ? "pass" : actualMinutesSavedPerRun > 0 ? "watch" : "block",
      value: `${actualMinutesSavedPerRun}m saved`,
      target: `${minimumAcceptedSavingsMinutes}m minimum`,
      action: savingsPass ? "Use this run as measured value proof." : `Save ${savingsGapMinutes}m more per run or lower the modeled manual baseline.`
    },
    {
      id: "acceptance",
      label: "Task acceptance",
      status: acceptancePass ? "pass" : acceptanceRatePercent >= 50 ? "watch" : "block",
      value: `${normalized.acceptedTasks}/${normalized.totalTasks} tasks`,
      target: "70% accepted",
      action: acceptancePass ? "Acceptance is high enough for buyer proof." : "Rerun or narrow scope until at least 70% of tasks are accepted."
    },
    {
      id: "evidence",
      label: "Public receipt",
      status: evidenceReady ? "pass" : "block",
      value: evidenceReady ? "attached" : "missing",
      target: "public URL",
      action: evidenceReady ? "Receipt evidence can travel with the launch room." : "Attach a public run log, recording, issue, or receipt URL."
    },
    {
      id: "participants",
      label: "Participant scope",
      status: participantsPass ? "pass" : normalized.participants >= 2 ? "watch" : "block",
      value: `${normalized.participants} people`,
      target: "3+ people",
      action: participantsPass ? "The observed run has enough scope for first buyer proof." : "Include at least 3 participants in the observed run."
    }
  ];

  return {
    readiness,
    plannedMinutesSavedPerRun,
    minimumAcceptedSavingsMinutes,
    actualMinutesSavedPerRun,
    savingsGapMinutes,
    acceptanceRatePercent,
    headline: headlineFor(readiness),
    checks
  };
}
