import type { BuyerValueScenario } from "./buyerValueScenario.js";
import type { BuyerPilotRunCalibration } from "./buyerPilotRunCalibration.js";
import { normalizePilotRunReceiptInput, type PilotRunReceiptInput } from "./pilotRunReceipt.js";

export type BuyerPilotMeasurementPlanStatus = "proof-ready" | "rerun-required";

export type BuyerPilotMeasurementPlanTarget = {
  id: "savings" | "acceptance" | "participants" | "evidence";
  label: string;
  current: string;
  target: string;
  action: string;
  status: "pass" | "watch" | "block";
};

export type BuyerPilotMeasurementPlan = {
  id: string;
  status: BuyerPilotMeasurementPlanStatus;
  headline: string;
  runName: string;
  targetManualMinutes: number;
  targetAssistedMinutesMax: number;
  targetAcceptedTasks: number;
  targetParticipants: number;
  valueAtStakeYen: number;
  targets: BuyerPilotMeasurementPlanTarget[];
  runScript: string[];
  evidenceChecklist: string[];
  stopRules: string[];
  exportMarkdown: string;
};

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function statusFrom(pass: boolean, watch = false) {
  if (pass) return "pass" as const;
  if (watch) return "watch" as const;
  return "block" as const;
}

function buildMarkdown(plan: Omit<BuyerPilotMeasurementPlan, "exportMarkdown">) {
  return [
    `# ${plan.headline}`,
    "",
    `Status: ${plan.status}`,
    `Run: ${plan.runName}`,
    `Value at stake: ${yen(plan.valueAtStakeYen)}`,
    "",
    "## Targets",
    `- Manual baseline: ${plan.targetManualMinutes} minutes`,
    `- Assisted run maximum: ${plan.targetAssistedMinutesMax} minutes`,
    `- Accepted tasks: ${plan.targetAcceptedTasks}`,
    `- Participants: ${plan.targetParticipants}`,
    "",
    "## Measurement gaps",
    ...plan.targets.map((target) => `- [${target.status}] ${target.label}: ${target.current} -> ${target.target}. ${target.action}`),
    "",
    "## Run script",
    ...plan.runScript.map((line, index) => `${index + 1}. ${line}`),
    "",
    "## Evidence checklist",
    ...plan.evidenceChecklist.map((item) => `- ${item}`),
    "",
    "## Stop rules",
    ...plan.stopRules.map((item) => `- ${item}`)
  ].join("\n");
}

export function buildBuyerPilotMeasurementPlan(input: {
  calibration: BuyerPilotRunCalibration;
  buyerScenario: BuyerValueScenario;
  pilotRun: Partial<PilotRunReceiptInput>;
}): BuyerPilotMeasurementPlan {
  const normalized = normalizePilotRunReceiptInput(input.pilotRun);
  const targetManualMinutes = Math.max(normalized.observedManualMinutes, normalized.observedAssistedMinutes + input.calibration.minimumAcceptedSavingsMinutes);
  const targetAssistedMinutesMax = Math.max(1, targetManualMinutes - input.calibration.minimumAcceptedSavingsMinutes);
  const targetAcceptedTasks = Math.ceil(normalized.totalTasks * 0.7);
  const targetParticipants = 3;
  const evidenceReady = input.calibration.checks.find((check) => check.id === "evidence")?.status === "pass";
  const acceptedGap = Math.max(0, targetAcceptedTasks - normalized.acceptedTasks);
  const participantGap = Math.max(0, targetParticipants - normalized.participants);
  const status: BuyerPilotMeasurementPlanStatus = input.calibration.readiness === "target-met" ? "proof-ready" : "rerun-required";
  const headline =
    status === "proof-ready"
      ? "This measured run is ready to become buyer proof"
      : "Run one buyer-ready measurement before sharing externally";
  const runName =
    input.calibration.readiness === "needs-acceptance"
      ? "Acceptance repair run"
      : input.calibration.readiness === "needs-evidence"
        ? "Receipt capture run"
        : input.calibration.readiness === "needs-scope"
          ? "Three-person proof run"
          : input.calibration.readiness === "target-met"
            ? "Buyer proof receipt"
            : "Time-savings proof run";
  const targets: BuyerPilotMeasurementPlanTarget[] = [
    {
      id: "savings",
      label: "Time saving",
      current: `${input.calibration.actualMinutesSavedPerRun}m saved`,
      target: `${input.calibration.minimumAcceptedSavingsMinutes}m saved`,
      action:
        input.calibration.savingsGapMinutes === 0
          ? "Keep the same timer setup and preserve the baseline."
          : `Cut at least ${input.calibration.savingsGapMinutes}m more from the assisted run or lower the modeled manual baseline.`,
      status: statusFrom(input.calibration.savingsGapMinutes === 0, input.calibration.actualMinutesSavedPerRun > 0)
    },
    {
      id: "acceptance",
      label: "Task acceptance",
      current: `${normalized.acceptedTasks}/${normalized.totalTasks} accepted`,
      target: `${targetAcceptedTasks}/${normalized.totalTasks} accepted`,
      action: acceptedGap === 0 ? "Use the same acceptance rubric in the receipt." : `Get ${acceptedGap} more task${acceptedGap === 1 ? "" : "s"} accepted by the reviewer.`,
      status: statusFrom(acceptedGap === 0, input.calibration.acceptanceRatePercent >= 50)
    },
    {
      id: "participants",
      label: "Participant scope",
      current: `${normalized.participants} people`,
      target: `${targetParticipants}+ people`,
      action: participantGap === 0 ? "Name each participant role in the receipt." : `Add ${participantGap} more participant${participantGap === 1 ? "" : "s"} to avoid a single-user demo signal.`,
      status: statusFrom(participantGap === 0, normalized.participants >= 2)
    },
    {
      id: "evidence",
      label: "Public evidence",
      current: evidenceReady ? "attached" : "missing",
      target: "public URL",
      action: evidenceReady ? "Keep the public receipt URL attached to the launch room." : "Publish a run log, issue, recording, or receipt URL before sponsor review.",
      status: evidenceReady ? "pass" : "block"
    }
  ];
  const runScript = [
    `Use one real buyer request. If the manual baseline is truly ${targetManualMinutes}m, record it; otherwise lower the modeled manual baseline before claiming ${input.calibration.minimumAcceptedSavingsMinutes}m saved.`,
    `Run the assisted version with the selected agent squad and keep assisted work at or below ${targetAssistedMinutesMax}m.`,
    `Ask the reviewer to accept at least ${targetAcceptedTasks}/${normalized.totalTasks} tasks against the same success rubric.`,
    `Include at least ${targetParticipants} participants or named roles so the result is not a solo demo.`,
    "Attach the public evidence URL immediately after the run and keep the raw notes with the receipt."
  ];
  const evidenceChecklist = [
    "Timer or log for manual baseline and assisted run.",
    "Reviewer name, participant count, accepted task count, and total task count.",
    "Public receipt URL that a buyer can open without internal access.",
    "Notes explaining any rejected task and whether the scope should continue, revise, or stop."
  ];
  const stopRules = [
    `Stop if assisted time is above ${targetAssistedMinutesMax}m; the value claim is not proven.`,
    `Stop if accepted tasks are below ${targetAcceptedTasks}/${normalized.totalTasks}; buyer acceptance is not strong enough.`,
    "Stop if evidence cannot be shared publicly; the result cannot support external review."
  ];
  const partial = {
    id: `buyer-pilot-measurement-${status}-${input.calibration.minimumAcceptedSavingsMinutes}-${targetAcceptedTasks}`,
    status,
    headline,
    runName,
    targetManualMinutes,
    targetAssistedMinutesMax,
    targetAcceptedTasks,
    targetParticipants,
    valueAtStakeYen: input.buyerScenario.monthlyGrossValueYen,
    targets,
    runScript,
    evidenceChecklist,
    stopRules
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}
