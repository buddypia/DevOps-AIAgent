import type { BuyerValueScenarioInput } from "./buyerValueScenario.js";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder.js";
import type { PilotRunReceiptInput } from "./pilotRunReceipt.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";

export type WorkflowIntakeBriefInput = {
  workOrder: BuyerWorkOrderInput;
  buyerScenario: BuyerValueScenarioInput;
  pilotRun: PilotRunReceiptInput;
};

export type WorkflowIntakeStatus = "clear" | "watch" | "blocked";
export type WorkflowIntakeDecision = "pilot-ready" | "needs-proof" | "needs-scope" | "do-not-share";

export type WorkflowIntakeCheck = {
  id: "scope" | "value-model" | "measured-run" | "data-boundary" | "public-proof";
  label: string;
  status: WorkflowIntakeStatus;
  evidence: string;
  fix: string;
};

export type WorkflowIntakeReadiness = {
  decision: WorkflowIntakeDecision;
  score: number;
  headline: string;
  nextAction: string;
  checks: WorkflowIntakeCheck[];
};

function fallback(value: string, replacement: string) {
  return value.trim() || replacement;
}

function statusScore(status: WorkflowIntakeStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 65;
  return 20;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function decisionFromChecks(checks: WorkflowIntakeCheck[]): WorkflowIntakeDecision {
  const data = checks.find((check) => check.id === "data-boundary");
  if (data?.status === "blocked") return "do-not-share";
  if (checks.some((check) => check.status === "blocked")) return "needs-scope";
  if (checks.some((check) => check.status === "watch")) return "needs-proof";
  return "pilot-ready";
}

function headlineFor(decision: WorkflowIntakeDecision) {
  if (decision === "pilot-ready") return "Pilot packet is ready for sponsor review";
  if (decision === "needs-proof") return "Useful workflow, proof still needs closure";
  if (decision === "needs-scope") return "Tighten scope before assigning agents";
  return "Do not share this packet externally";
}

function nextActionFor(decision: WorkflowIntakeDecision, checks: WorkflowIntakeCheck[]) {
  const firstOpen = checks.find((check) => check.status !== "clear");
  if (decision === "pilot-ready") return "Apply the brief, open the buyer room, and ask the sponsor for a continue/revise/stop decision.";
  if (decision === "needs-proof") return firstOpen?.fix ?? "Attach public evidence before sharing the packet.";
  if (decision === "needs-scope") return firstOpen?.fix ?? "Name the user, metric, baseline, and measured pilot run before assigning agents.";
  return "Remove restricted data or redact the workflow before it leaves the internal workspace.";
}

export function buildWorkflowIntakeReadiness({ workOrder, buyerScenario, pilotRun }: WorkflowIntakeBriefInput): WorkflowIntakeReadiness {
  const request = workOrder.request.trim();
  const targetUser = workOrder.targetUser.trim();
  const successMetric = workOrder.successMetric.trim();
  const baseline = workOrder.currentBaseline.trim();
  const minutesSaved = Math.max(0, pilotRun.observedManualMinutes - pilotRun.observedAssistedMinutes);
  const acceptanceRate = pilotRun.totalTasks > 0 ? pilotRun.acceptedTasks / pilotRun.totalTasks : 0;
  const monthlyManualHours = buyerScenario.cyclesPerMonth * buyerScenario.manualHoursPerCycle * (buyerScenario.adoptionRatePercent / 100);
  const proofUrl = workOrder.evidenceUrl || pilotRun.evidenceUrl;

  const checks: WorkflowIntakeCheck[] = [
    {
      id: "scope",
      label: "Buyer scope",
      status: targetUser && request.length >= 60 && successMetric.length >= 24 && baseline.length >= 24 ? "clear" : targetUser && request.length >= 30 ? "watch" : "blocked",
      evidence: targetUser ? `${targetUser}: ${request.slice(0, 120) || "request missing"}` : "Target buyer is missing.",
      fix: "Name one target user, one bounded workflow request, one success metric, and the current baseline."
    },
    {
      id: "value-model",
      label: "Value model",
      status: monthlyManualHours >= 20 && buyerScenario.teamSize >= 3 ? "clear" : monthlyManualHours >= 6 ? "watch" : "blocked",
      evidence: `${Math.round(monthlyManualHours)} manual hours/month under the current adoption model.`,
      fix: "Use a workflow with enough recurring manual work to justify an AI-agent pilot."
    },
    {
      id: "measured-run",
      label: "Measured run",
      status: minutesSaved >= 30 && acceptanceRate >= 0.6 ? "clear" : minutesSaved > 0 && acceptanceRate >= 0.4 ? "watch" : "blocked",
      evidence: `${minutesSaved} minutes saved/run; ${pilotRun.acceptedTasks}/${pilotRun.totalTasks} tasks accepted.`,
      fix: "Replay one run with manual and assisted timings, then record accepted tasks."
    },
    {
      id: "data-boundary",
      label: "Data boundary",
      status: workOrder.dataSensitivity === "public" ? "clear" : workOrder.dataSensitivity === "internal" ? "watch" : "blocked",
      evidence: `${workOrder.dataSensitivity} data boundary selected.`,
      fix: "Redact restricted inputs or keep the packet internal until a public-safe version exists."
    },
    {
      id: "public-proof",
      label: "Public proof",
      status: isBuyerFacingProofUrl(proofUrl) ? "clear" : "watch",
      evidence: proofUrl ? `Evidence URL entered: ${proofUrl}` : "No public evidence URL attached yet.",
      fix: "Attach a public work-order or pilot-run evidence URL before external sharing."
    }
  ];
  const decision = decisionFromChecks(checks);

  return {
    decision,
    score: Math.round(average(checks.map((check) => statusScore(check.status)))),
    headline: headlineFor(decision),
    nextAction: nextActionFor(decision, checks),
    checks
  };
}

export function buildWorkflowIntakeBrief({ workOrder, buyerScenario, pilotRun }: WorkflowIntakeBriefInput) {
  const minutesSaved = Math.max(0, pilotRun.observedManualMinutes - pilotRun.observedAssistedMinutes);
  const acceptance = `${pilotRun.acceptedTasks}/${pilotRun.totalTasks} accepted tasks`;
  const proofLine = workOrder.evidenceUrl || pilotRun.evidenceUrl ? `Evidence: ${workOrder.evidenceUrl || pilotRun.evidenceUrl}` : "Evidence: public proof URL still pending";

  return [
    `${fallback(workOrder.targetUser, "Target buyer")} needs: ${fallback(workOrder.request, "One bounded workflow converted into a buyer-ready proof packet.")}`,
    `Baseline: ${fallback(workOrder.currentBaseline, "Manual work, scattered evidence, and unclear ownership before approval.")}`,
    `Success metric: ${fallback(workOrder.successMetric, "Minutes saved, proof gaps closed, and a continue/revise/stop decision.")}`,
    `Value model: ${buyerScenario.teamSize} people, ${buyerScenario.cyclesPerMonth} cycles/month, ${buyerScenario.manualHoursPerCycle} manual hours/cycle, ${buyerScenario.adoptionRatePercent}% expected adoption.`,
    `Pilot receipt target: ${pilotRun.observedManualMinutes} manual minutes vs ${pilotRun.observedAssistedMinutes} assisted minutes, ${minutesSaved} minutes saved/run, ${pilotRun.participants} participants, ${acceptance}.`,
    `Proof boundary: ${workOrder.dataSensitivity} data. ${proofLine}.`
  ].join("\n");
}
