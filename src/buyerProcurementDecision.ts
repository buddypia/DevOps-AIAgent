import { buildBuyerDecisionMatrix, type BuyerDecisionAlternative } from "./buyerDecisionMatrix.js";
import { buildBuyerPilotRunCalibration } from "./buyerPilotRunCalibration.js";
import { buildBuyerValueSensitivity } from "./buyerValueSensitivity.js";
import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import { buildBuyerWorkOrderBrief, type BuyerWorkOrderBrief, type BuyerWorkOrderInput } from "./buyerWorkOrder.js";
import { buildPilotRunReceipt, normalizePilotRunReceiptInput, type PilotRunReceipt, type PilotRunReceiptInput } from "./pilotRunReceipt.js";
import { buildPilotWorkflowPlan } from "./pilotWorkflow.js";
import { buyerFacingProofUrlProblem } from "./publicProofUrl.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";

export type BuyerProcurementDecisionReadiness = "buy-now" | "pilot-first" | "hold";

export type BuyerProcurementDecisionCheck = {
  id: "economic-case" | "work-order" | "measured-proof" | "data-boundary" | "public-proof";
  label: string;
  status: BuyerValueScenarioStatus;
  evidence: string;
  action: string;
  href: string;
  owner: string;
};

export type BuyerProcurementDecisionAction = {
  id: string;
  label: string;
  owner: string;
  action: string;
  href: string;
  priority: "now" | "next";
};

export type BuyerProcurementApprovalLane = {
  id: "a2a-winner" | "adoption-floor" | "measured-run" | "data-boundary" | "public-proof";
  label: string;
  status: BuyerValueScenarioStatus;
  buyerQuestion: string;
  current: string;
  target: string;
  delta: string;
  action: string;
  href: string;
  owner: string;
};

export type BuyerProcurementMutualActionPlanReadiness = "send-offer" | "close-gaps" | "re-scope";

export type BuyerProcurementMutualActionPlanStep = {
  id: string;
  sequence: number;
  due: string;
  priority: "now" | "next" | "scheduled";
  status: BuyerValueScenarioStatus;
  buyerOwner: string;
  a2aOwner: string;
  commitment: string;
  exitCriteria: string;
  evidence: string;
  href: string;
};

export type BuyerProcurementMutualActionPlan = {
  id: string;
  readiness: BuyerProcurementMutualActionPlanReadiness;
  headline: string;
  summary: string;
  decisionGate: string;
  daysToDecision: number;
  steps: BuyerProcurementMutualActionPlanStep[];
  exportMarkdown: string;
  exportCsv: string;
};

export type BuyerProcurementDecisionContractReadiness = "ready-to-sign" | "needs-redlines" | "blocked";

export type BuyerProcurementDecisionContractClause = {
  id: "economic-floor" | "public-proof" | "mutual-owners" | "stop-boundary";
  label: string;
  status: BuyerValueScenarioStatus;
  owner: string;
  buyerCommitment: string;
  a2aCommitment: string;
  evidence: string;
  failureRule: string;
  href: string;
};

export type BuyerProcurementDecisionContract = {
  id: string;
  readiness: BuyerProcurementDecisionContractReadiness;
  headline: string;
  summary: string;
  approvalAsk: string;
  decisionGate: string;
  clearClauseCount: number;
  clauseCount: number;
  clauses: BuyerProcurementDecisionContractClause[];
  stopRules: string[];
  exportMarkdown: string;
};

export type BuyerProcurementApprovalMemoReadiness = "approve" | "approve-after-gaps" | "do-not-approve";

export type BuyerProcurementApprovalMemoSection = {
  id: "recommendation" | "economics" | "proof" | "risk" | "next-meeting";
  label: string;
  status: BuyerValueScenarioStatus;
  headline: string;
  body: string;
  evidence: string;
};

export type BuyerProcurementApprovalMemo = {
  id: string;
  readiness: BuyerProcurementApprovalMemoReadiness;
  headline: string;
  executiveSummary: string;
  recommendation: string;
  approvalLine: string;
  proofLine: string;
  riskLine: string;
  decisionGate: string;
  sections: BuyerProcurementApprovalMemoSection[];
  exportMarkdown: string;
};

export type BuyerProcurementBuyabilityLever = {
  id: BuyerProcurementApprovalLane["id"];
  label: string;
  status: BuyerValueScenarioStatus;
  priority: "now" | "next" | "sealed";
  headline: string;
  current: string;
  target: string;
  impact: string;
  action: string;
  owner: string;
  href: string;
  patch?: {
    buyerScenario?: Partial<BuyerValueScenario["assumptions"]>;
    buyerWorkOrder?: Partial<BuyerWorkOrderInput>;
    pilotRun?: Partial<PilotRunReceiptInput>;
  };
  applyLabel?: string;
};

export type BuyerProcurementDecision = {
  id: string;
  readiness: BuyerProcurementDecisionReadiness;
  score: number;
  headline: string;
  hardTruth: string;
  targetBuyer: string;
  winnerLabel: string;
  a2aScore: number;
  monthlyValueYen: number;
  firstCommitmentYen: number;
  paybackDays: number;
  timeToValueDays: number;
  confidenceScore: number;
  evidenceGapCount: number;
  selectedAgents: string[];
  checks: BuyerProcurementDecisionCheck[];
  approvalLadder: BuyerProcurementApprovalLane[];
  mutualActionPlan: BuyerProcurementMutualActionPlan;
  decisionContract: BuyerProcurementDecisionContract;
  approvalMemo: BuyerProcurementApprovalMemo;
  buyabilityLevers: BuyerProcurementBuyabilityLever[];
  actions: BuyerProcurementDecisionAction[];
  alternatives: BuyerDecisionAlternative[];
  workOrder: BuyerWorkOrderBrief;
  pilotReceipt: PilotRunReceipt;
  exportMarkdown: string;
};

export type BuildBuyerProcurementDecisionInput = {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  buyerWorkOrder: BuyerWorkOrderInput;
  pilotRun: PilotRunReceiptInput;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statusScore(status: BuyerValueScenarioStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 66;
  return 18;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function tone(status: string) {
  if (["buy-now", "clear", "recommended"].includes(status)) return "good";
  if (["hold", "blocked", "weak"].includes(status)) return "bad";
  return "watch";
}

function statusFromDecision(value: string): BuyerValueScenarioStatus {
  if (value === "buy-a2a") return "clear";
  if (value === "pilot-more") return "watch";
  return "blocked";
}

function statusFromWorkOrder(value: BuyerWorkOrderBrief["readiness"]): BuyerValueScenarioStatus {
  if (value === "ready-to-run") return "clear";
  if (value === "needs-proof") return "watch";
  return "blocked";
}

function statusFromReceipt(value: PilotRunReceipt["readiness"]): BuyerValueScenarioStatus {
  if (value === "accepted") return "clear";
  if (value === "needs-evidence") return "watch";
  return "blocked";
}

function headlineFor(readiness: BuyerProcurementDecisionReadiness) {
  if (readiness === "buy-now") return "Approve the A2A proof pilot";
  if (readiness === "pilot-first") return "Run a smaller proof pilot before buying";
  return "Hold procurement until the value proof is stronger";
}

function hardTruthFor(input: {
  readiness: BuyerProcurementDecisionReadiness;
  a2a: BuyerDecisionAlternative;
  winner: BuyerDecisionAlternative;
  evidenceGapCount: number;
}) {
  if (input.readiness === "buy-now") {
    return `A2A leads the buying table with ${input.a2a.score}/100, ${input.a2a.paybackDays}-day payback, and enough proof to ask for a paid pilot.`;
  }
  if (input.readiness === "pilot-first") {
    return `A2A is still viable, but ${input.evidenceGapCount} proof item${input.evidenceGapCount === 1 ? "" : "s"} need closure before a buyer should approve a full offer.`;
  }
  return `${input.winner.label} currently beats or blocks the A2A purchase path. Tighten scope, economics, data boundary, or measured proof before asking for budget.`;
}

function readinessFrom(input: {
  checks: BuyerProcurementDecisionCheck[];
  a2a: BuyerDecisionAlternative;
  winner: BuyerDecisionAlternative;
  buyerScenario: BuyerValueScenario;
}): BuyerProcurementDecisionReadiness {
  const blocked = input.checks.filter((check) => check.status === "blocked");
  if (input.winner.id !== "a2a-squad" || input.buyerScenario.readiness === "not-yet" || blocked.some((check) => check.id !== "public-proof")) {
    return "hold";
  }
  if (input.checks.every((check) => check.status === "clear") && input.a2a.score >= 72) return "buy-now";
  return "pilot-first";
}

function actionForCheck(check: BuyerProcurementDecisionCheck): BuyerProcurementDecisionAction {
  return {
    id: `fix-${check.id}`,
    label: check.label,
    owner: check.owner,
    action: check.action,
    href: check.href,
    priority: check.status === "blocked" ? "now" : "next"
  };
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function calibrationStatus(input: ReturnType<typeof buildBuyerPilotRunCalibration>): BuyerValueScenarioStatus {
  const coreChecks = input.checks.filter((check) => check.id !== "evidence");
  if (coreChecks.every((check) => check.status === "pass")) return "clear";
  if (coreChecks.some((check) => check.status === "block")) return "blocked";
  return "watch";
}

function buildApprovalLadder(input: {
  checks: BuyerProcurementDecisionCheck[];
  alternatives: BuyerDecisionAlternative[];
  winner: BuyerDecisionAlternative;
  a2a: BuyerDecisionAlternative;
  buyerScenario: BuyerValueScenario;
  buyerWorkOrder: BuyerWorkOrderInput;
  pilotRun: PilotRunReceiptInput;
  targetBuyer: string;
}): BuyerProcurementApprovalLane[] {
  const sensitivity = buildBuyerValueSensitivity(input.buyerScenario);
  const calibration = buildBuyerPilotRunCalibration(input.pilotRun, input.buyerScenario);
  const economicCheck = input.checks.find((check) => check.id === "economic-case");
  const dataCheck = input.checks.find((check) => check.id === "data-boundary");
  const proofCheck = input.checks.find((check) => check.id === "public-proof");
  const closestCompetitor = input.alternatives.find((alternative) => alternative.id !== "a2a-squad") ?? input.winner;
  const winnerGap = input.a2a.score - closestCompetitor.score;
  const scoreGapToBuy = Math.max(0, 72 - input.a2a.score);
  const adoptionGap = Math.max(0, sensitivity.breakEvenAdoptionPercent - input.buyerScenario.assumptions.adoptionRatePercent);
  const savingsCheck = calibration.checks.find((check) => check.id === "savings");
  const acceptanceCheck = calibration.checks.find((check) => check.id === "acceptance");
  const participantsCheck = calibration.checks.find((check) => check.id === "participants");
  const proofAttached = Boolean(input.buyerWorkOrder.evidenceUrl || input.pilotRun.evidenceUrl);

  return [
    {
      id: "a2a-winner",
      label: "A2A must beat the buying table",
      status: economicCheck?.status ?? "blocked",
      buyerQuestion: "Does this squad beat manual work, generic AI, and an internal build?",
      current: `${input.a2a.score}/100 A2A score; ${input.winner.label} leads.`,
      target: "A2A wins the table with a sponsor-safe score.",
      delta: scoreGapToBuy > 0 ? `Raise A2A by ${scoreGapToBuy} points or narrow the pilot ask.` : winnerGap >= 0 ? `${winnerGap} point lead over ${closestCompetitor.label}.` : `${Math.abs(winnerGap)} points behind ${closestCompetitor.label}.`,
      action: economicCheck?.action ?? "Tune workflow volume, adoption, or selected agents until A2A beats the alternatives.",
      href: economicCheck?.href ?? "#buyer-decision-matrix",
      owner: economicCheck?.owner ?? "Buyer sponsor"
    },
    {
      id: "adoption-floor",
      label: "Adoption must cover payback",
      status: sensitivity.guardrails.find((guardrail) => guardrail.id === "break-even-adoption")?.status ?? "blocked",
      buyerQuestion: "How much adoption is needed before the pilot is financially credible?",
      current: `${input.buyerScenario.assumptions.adoptionRatePercent}% assumed adoption.`,
      target: `${sensitivity.breakEvenAdoptionPercent}% break-even adoption.`,
      delta: adoptionGap > 0 ? `Commit ${adoptionGap} more adoption points or shrink the paid pilot.` : "Current adoption clears the payback floor.",
      action: adoptionGap > 0 ? "Reduce pilot scope or get a named buyer owner to commit to the break-even adoption floor." : "Keep the adoption owner and measurement cadence in the sponsor brief.",
      href: "#buyer-value-simulator",
      owner: input.targetBuyer || "Buyer sponsor"
    },
    {
      id: "measured-run",
      label: "Measured run must support the model",
      status: calibrationStatus(calibration),
      buyerQuestion: "Did one buyer-like run save enough time with enough accepted work?",
      current: `${calibration.actualMinutesSavedPerRun}m saved/run, ${calibration.acceptanceRatePercent}% accepted, ${input.pilotRun.participants} participants.`,
      target: `${calibration.minimumAcceptedSavingsMinutes}m saved/run, 70% accepted, 3+ participants.`,
      delta: [savingsCheck, acceptanceCheck, participantsCheck]
        .filter((check) => check && check.status !== "pass")
        .map((check) => check?.action)
        .filter(Boolean)
        .join(" "),
      action:
        calibration.readiness === "target-met" || calibration.readiness === "needs-evidence"
          ? "Use the measured run, then make the receipt public before sponsor approval."
          : "Rerun the workflow until savings, acceptance, and participant scope meet the buyer-ready floor.",
      href: "#pilot-run-receipt",
      owner: input.pilotRun.reviewerName || "Buyer reviewer"
    },
    {
      id: "data-boundary",
      label: "Data boundary must be shareable",
      status: dataCheck?.status ?? "blocked",
      buyerQuestion: "Can this workflow leave the internal workspace without exposing restricted data?",
      current: `${input.buyerWorkOrder.dataSensitivity} data boundary.`,
      target: "Public-safe or redacted internal workflow.",
      delta: input.buyerWorkOrder.dataSensitivity === "restricted" ? "Move restricted examples to synthetic or security-approved evidence." : "Data boundary is acceptable for sponsor review.",
      action: dataCheck?.action ?? "Choose a public-safe or redacted workflow before external review.",
      href: dataCheck?.href ?? "#buyer-work-order-studio",
      owner: dataCheck?.owner ?? "Security reviewer"
    },
    {
      id: "public-proof",
      label: "Proof must open outside the workspace",
      status: proofCheck?.status ?? "blocked",
      buyerQuestion: "Can a buyer open the work-order or receipt evidence without internal access?",
      current: proofAttached ? "A proof URL is attached." : "No public proof URL is attached.",
      target: "HTTPS work-order proof or pilot receipt proof.",
      delta: proofCheck?.status === "clear" ? "Proof link is attached for buyer inspection." : "Attach an HTTPS proof URL and run live verification.",
      action: proofCheck?.action ?? "Attach a public work-order proof, pilot receipt, run log, or recording URL.",
      href: proofCheck?.href ?? "#buyer-proof-intake",
      owner: proofCheck?.owner ?? "Cloud Run SRE"
    }
  ];
}

function priorityForStatus(status: BuyerValueScenarioStatus): BuyerProcurementMutualActionPlanStep["priority"] {
  if (status === "blocked") return "now";
  if (status === "watch") return "next";
  return "scheduled";
}

function a2aOwnerForLane(lane: BuyerProcurementApprovalLane, workOrder: BuyerWorkOrderBrief) {
  const byRole = (role: BuyerWorkOrderBrief["assignments"][number]["role"]) => workOrder.assignments.find((assignment) => assignment.role === role)?.agentName;
  if (lane.id === "a2a-winner") return byRole("decide") ?? "A2A market lead";
  if (lane.id === "adoption-floor") return byRole("intake") ?? "Buyer value lead";
  if (lane.id === "measured-run") return byRole("execute") ?? "Pilot execution lead";
  return byRole("prove") ?? "Cloud Run proof owner";
}

function commitmentForLane(lane: BuyerProcurementApprovalLane) {
  if (lane.id === "a2a-winner") return "Confirm the selected A2A squad beats the alternative buying paths before budget is requested.";
  if (lane.id === "adoption-floor") return "Name the adoption owner and the minimum usage floor required to protect payback.";
  if (lane.id === "measured-run") return "Run or replay one buyer-like workflow with accepted task output and measured time saved.";
  if (lane.id === "data-boundary") return "Approve the redacted or public-safe data boundary used in the proof packet.";
  return "Attach a public proof URL that procurement can open outside the internal workspace.";
}

function actionPlanReadiness(readiness: BuyerProcurementDecisionReadiness): BuyerProcurementMutualActionPlanReadiness {
  if (readiness === "buy-now") return "send-offer";
  if (readiness === "pilot-first") return "close-gaps";
  return "re-scope";
}

function actionPlanHeadline(readiness: BuyerProcurementMutualActionPlanReadiness) {
  if (readiness === "send-offer") return "Mutual action plan is ready for a paid proof-pilot ask";
  if (readiness === "close-gaps") return "Mutual action plan should close proof gaps before procurement approval";
  return "Mutual action plan should re-scope blockers before any budget ask";
}

function actionPlanSummary(input: { readiness: BuyerProcurementMutualActionPlanReadiness; evidenceGapCount: number; targetBuyer: string; daysToDecision: number }) {
  if (input.readiness === "send-offer") {
    return `${input.targetBuyer} can move from proof-pilot offer to procurement decision in ${input.daysToDecision} days if the proof room stays live.`;
  }
  if (input.readiness === "close-gaps") {
    return `${input.evidenceGapCount} proof gap${input.evidenceGapCount === 1 ? "" : "s"} must get named buyer and A2A owners before the commercial offer is sent.`;
  }
  return `Procurement should not be asked for budget yet; convert blockers into buyer-owned and A2A-owned close actions first.`;
}

function worstStatus(statuses: BuyerValueScenarioStatus[]): BuyerValueScenarioStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("watch")) return "watch";
  return "clear";
}

function buildActionPlanMarkdown(plan: Omit<BuyerProcurementMutualActionPlan, "exportMarkdown" | "exportCsv">) {
  return [
    `# ${plan.headline}`,
    "",
    `Readiness: ${plan.readiness}`,
    `Decision gate: ${plan.decisionGate}`,
    `Days to decision: ${plan.daysToDecision}`,
    "",
    plan.summary,
    "",
    "## Steps",
    ...plan.steps.map(
      (step) =>
        `- ${step.due} [${step.priority}/${step.status}] ${step.buyerOwner} + ${step.a2aOwner}: ${step.commitment} Exit: ${step.exitCriteria} Evidence: ${step.evidence} Link: ${step.href}`
    )
  ].join("\n");
}

function buildActionPlanCsv(steps: BuyerProcurementMutualActionPlanStep[]) {
  return [
    ["Sequence", "Due", "Priority", "Status", "Buyer owner", "A2A owner", "Commitment", "Exit criteria", "Evidence", "Link"].map(csvCell).join(","),
    ...steps.map((step) =>
      [
        step.sequence,
        step.due,
        step.priority,
        step.status,
        step.buyerOwner,
        step.a2aOwner,
        step.commitment,
        step.exitCriteria,
        step.evidence,
        step.href
      ]
        .map(csvCell)
        .join(",")
    )
  ].join("\n");
}

function buildMutualActionPlan(input: {
  readiness: BuyerProcurementDecisionReadiness;
  score: number;
  evidenceGapCount: number;
  targetBuyer: string;
  approvalLadder: BuyerProcurementApprovalLane[];
  workOrder: BuyerWorkOrderBrief;
}): BuyerProcurementMutualActionPlan {
  const readiness = actionPlanReadiness(input.readiness);
  const daysToDecision = input.readiness === "buy-now" ? 3 : input.readiness === "pilot-first" ? Math.min(10, 5 + input.evidenceGapCount) : 14;
  const offsets = [0, 1, 3, 5, 7];
  const steps = input.approvalLadder.map((lane, index) => {
    const priority = priorityForStatus(lane.status);
    const scheduledOffset = Math.min(daysToDecision, offsets[index] ?? daysToDecision);
    const dueOffset = priority === "now" ? 0 : priority === "next" ? Math.max(1, scheduledOffset) : scheduledOffset;
    return {
      id: `map-${lane.id}`,
      sequence: index + 1,
      due: `D+${dueOffset}`,
      priority,
      status: lane.status,
      buyerOwner: lane.owner,
      a2aOwner: a2aOwnerForLane(lane, input.workOrder),
      commitment: commitmentForLane(lane),
      exitCriteria: lane.target,
      evidence: lane.delta || lane.current,
      href: lane.href
    };
  });
  const partial = {
    id: `procurement-map-${readiness}-${input.score}`,
    readiness,
    headline: actionPlanHeadline(readiness),
    summary: actionPlanSummary({ readiness, evidenceGapCount: input.evidenceGapCount, targetBuyer: input.targetBuyer, daysToDecision }),
    decisionGate: `D+${daysToDecision} ${input.readiness === "buy-now" ? "paid proof-pilot decision" : input.readiness === "pilot-first" ? "proof-gap review" : "re-scope review"}`,
    daysToDecision,
    steps
  };

  return {
    ...partial,
    exportMarkdown: buildActionPlanMarkdown(partial),
    exportCsv: buildActionPlanCsv(steps)
  };
}

function contractReadinessFrom(clauses: BuyerProcurementDecisionContractClause[]): BuyerProcurementDecisionContractReadiness {
  if (clauses.some((clause) => clause.status === "blocked")) return "blocked";
  if (clauses.some((clause) => clause.status === "watch")) return "needs-redlines";
  return "ready-to-sign";
}

function contractHeadlineFor(readiness: BuyerProcurementDecisionContractReadiness) {
  if (readiness === "ready-to-sign") return "Decision contract is ready for procurement review";
  if (readiness === "needs-redlines") return "Decision contract needs owner redlines before the offer";
  return "Decision contract blocks the budget ask";
}

function contractSummary(input: {
  readiness: BuyerProcurementDecisionContractReadiness;
  clearClauseCount: number;
  clauseCount: number;
  targetBuyer: string;
  decisionGate: string;
}) {
  if (input.readiness === "ready-to-sign") {
    return `${input.targetBuyer} can use this as the meeting contract: ${input.clearClauseCount}/${input.clauseCount} clauses clear by ${input.decisionGate}.`;
  }
  if (input.readiness === "needs-redlines") {
    return `${input.clearClauseCount}/${input.clauseCount} contract clauses are clear; redline the watched clauses before the offer is sent.`;
  }
  return `Do not ask for budget while blocked contract clauses remain open.`;
}

function buildContractMarkdown(contract: Omit<BuyerProcurementDecisionContract, "exportMarkdown">) {
  return [
    `# ${contract.headline}`,
    "",
    `Readiness: ${contract.readiness}`,
    `Approval ask: ${contract.approvalAsk}`,
    `Decision gate: ${contract.decisionGate}`,
    `Clauses clear: ${contract.clearClauseCount}/${contract.clauseCount}`,
    "",
    contract.summary,
    "",
    "## Clauses",
    ...contract.clauses.map(
      (clause) =>
        `- [${clause.status}] ${clause.label} (${clause.owner})\n  Buyer: ${clause.buyerCommitment}\n  A2A: ${clause.a2aCommitment}\n  Evidence: ${clause.evidence}\n  Failure rule: ${clause.failureRule}\n  Link: ${clause.href}`
    ),
    "",
    "## Stop rules",
    ...contract.stopRules.map((rule) => `- ${rule}`)
  ].join("\n");
}

function buildDecisionContract(input: {
  readiness: BuyerProcurementDecisionReadiness;
  score: number;
  targetBuyer: string;
  monthlyValueYen: number;
  firstCommitmentYen: number;
  paybackDays: number;
  timeToValueDays: number;
  confidenceScore: number;
  checks: BuyerProcurementDecisionCheck[];
  approvalLadder: BuyerProcurementApprovalLane[];
  mutualActionPlan: BuyerProcurementMutualActionPlan;
  workOrder: BuyerWorkOrderBrief;
  buyerWorkOrder: BuyerWorkOrderInput;
}): BuyerProcurementDecisionContract {
  const check = (id: BuyerProcurementDecisionCheck["id"]) => input.checks.find((item) => item.id === id);
  const lane = (id: BuyerProcurementApprovalLane["id"]) => input.approvalLadder.find((item) => item.id === id);
  const economicCheck = check("economic-case");
  const measuredCheck = check("measured-proof");
  const publicProofCheck = check("public-proof");
  const dataCheck = check("data-boundary");
  const ownerStatus = worstStatus(input.mutualActionPlan.steps.map((step) => step.status));
  const ownerStep = input.mutualActionPlan.steps.find((step) => step.status !== "clear") ?? input.mutualActionPlan.steps[0];
  const dataLane = lane("data-boundary");
  const measuredLane = lane("measured-run");
  const publicProofLane = lane("public-proof");
  const approvalAsk =
    input.readiness === "buy-now"
      ? `Approve a ${yen(input.firstCommitmentYen)} paid proof pilot with ${input.paybackDays}-day payback.`
      : input.readiness === "pilot-first"
        ? `Approve proof-gap closure before any ${yen(input.firstCommitmentYen)} paid pilot ask.`
        : "Do not approve spend until the contract blockers are re-scoped.";
  const clauses: BuyerProcurementDecisionContractClause[] = [
    {
      id: "economic-floor",
      label: "Economic floor",
      status: economicCheck?.status ?? "blocked",
      owner: economicCheck?.owner ?? "Buyer sponsor",
      buyerCommitment: `Accept the ${yen(input.firstCommitmentYen)} first commitment only while the value case stays at ${yen(input.monthlyValueYen)}/month or better.`,
      a2aCommitment: `Keep the procurement matrix current at ${input.confidenceScore}/100 confidence and ${input.timeToValueDays} days to value.`,
      evidence: economicCheck?.evidence ?? `${input.score}/100 procurement decision score.`,
      failureRule: "If A2A no longer beats the buying table, switch the meeting to re-scope instead of budget approval.",
      href: economicCheck?.href ?? "#buyer-value-simulator"
    },
    {
      id: "public-proof",
      label: "Public proof room",
      status: worstStatus([measuredCheck?.status ?? "blocked", publicProofCheck?.status ?? "blocked"]),
      owner: publicProofCheck?.owner ?? measuredCheck?.owner ?? "Cloud Run proof owner",
      buyerCommitment: "Review only evidence that opens outside the internal workspace.",
      a2aCommitment: "Keep the measured receipt, public proof link, and live verification attached before the meeting.",
      evidence: `${measuredLane?.current ?? measuredCheck?.evidence ?? "Measured run missing."} ${publicProofLane?.current ?? publicProofCheck?.evidence ?? "Public proof missing."}`,
      failureRule: "If the buyer cannot open the proof room live, hold the offer and fix the proof link first.",
      href: publicProofCheck?.href ?? measuredCheck?.href ?? "#buyer-proof-intake"
    },
    {
      id: "mutual-owners",
      label: "Mutual owners",
      status: ownerStatus,
      owner: ownerStep?.buyerOwner ?? input.targetBuyer,
      buyerCommitment: `Assign buyer owners for all ${input.mutualActionPlan.steps.length} mutual action plan steps before ${input.mutualActionPlan.decisionGate}.`,
      a2aCommitment: "Assign a matching A2A owner and evidence link for every buyer-owned commitment.",
      evidence: `${input.mutualActionPlan.steps.filter((step) => step.status === "clear").length}/${input.mutualActionPlan.steps.length} action-plan steps clear.`,
      failureRule: "If a now-priority step has no accountable owner, do not send the commercial offer.",
      href: ownerStep?.href ?? "#procurement-decision-desk"
    },
    {
      id: "stop-boundary",
      label: "Stop and data boundary",
      status: dataCheck?.status ?? "blocked",
      owner: dataCheck?.owner ?? dataLane?.owner ?? "Security reviewer",
      buyerCommitment: `Use the ${input.buyerWorkOrder.dataSensitivity} data boundary stated in the work order.`,
      a2aCommitment: "Keep stop rules explicit and prevent restricted data from entering public proof artifacts.",
      evidence: dataLane?.current ?? dataCheck?.evidence ?? "Data boundary missing.",
      failureRule: dataCheck?.status === "blocked" ? dataCheck.action : "If restricted data or unapproved scope appears, stop expansion and re-scope the pilot.",
      href: dataCheck?.href ?? dataLane?.href ?? "#buyer-work-order-studio"
    }
  ];
  const readiness = contractReadinessFrom(clauses);
  const clearClauseCount = clauses.filter((clause) => clause.status === "clear").length;
  const partial: Omit<BuyerProcurementDecisionContract, "exportMarkdown"> = {
    id: `procurement-contract-${readiness}-${input.score}`,
    readiness,
    headline: contractHeadlineFor(readiness),
    summary: contractSummary({
      readiness,
      clearClauseCount,
      clauseCount: clauses.length,
      targetBuyer: input.targetBuyer,
      decisionGate: input.mutualActionPlan.decisionGate
    }),
    approvalAsk,
    decisionGate: input.mutualActionPlan.decisionGate,
    clearClauseCount,
    clauseCount: clauses.length,
    clauses,
    stopRules: [
      clauses.find((clause) => clause.id === "economic-floor")?.failureRule ?? "Stop if economics no longer clear the buying table.",
      clauses.find((clause) => clause.id === "public-proof")?.failureRule ?? "Stop if public proof cannot be opened.",
      clauses.find((clause) => clause.id === "stop-boundary")?.failureRule ?? "Stop if data boundary is no longer safe."
    ]
  };

  return {
    ...partial,
    exportMarkdown: buildContractMarkdown(partial)
  };
}

function approvalMemoReadiness(input: {
  readiness: BuyerProcurementDecisionReadiness;
  contractReadiness: BuyerProcurementDecisionContractReadiness;
  evidenceGapCount: number;
}): BuyerProcurementApprovalMemoReadiness {
  if (input.readiness === "buy-now" && input.contractReadiness === "ready-to-sign" && input.evidenceGapCount === 0) return "approve";
  if (input.readiness === "hold" || input.contractReadiness === "blocked") return "do-not-approve";
  return "approve-after-gaps";
}

function approvalMemoHeadline(readiness: BuyerProcurementApprovalMemoReadiness) {
  if (readiness === "approve") return "Approval memo is ready for sponsor review";
  if (readiness === "approve-after-gaps") return "Approval memo needs proof-gap closure first";
  return "Approval memo recommends holding spend";
}

function buildApprovalMemoMarkdown(memo: Omit<BuyerProcurementApprovalMemo, "exportMarkdown">) {
  return [
    `# ${memo.headline}`,
    "",
    `Readiness: ${memo.readiness}`,
    `Decision gate: ${memo.decisionGate}`,
    "",
    `Executive summary: ${memo.executiveSummary}`,
    `Recommendation: ${memo.recommendation}`,
    `Approval line: ${memo.approvalLine}`,
    `Proof line: ${memo.proofLine}`,
    `Risk line: ${memo.riskLine}`,
    "",
    "## Sponsor memo sections",
    ...memo.sections.map((section) => `- [${section.status}] ${section.label}: ${section.headline} ${section.body} Evidence: ${section.evidence}`)
  ].join("\n");
}

function buildApprovalMemo(input: {
  readiness: BuyerProcurementDecisionReadiness;
  score: number;
  targetBuyer: string;
  winnerLabel: string;
  monthlyValueYen: number;
  firstCommitmentYen: number;
  paybackDays: number;
  timeToValueDays: number;
  confidenceScore: number;
  evidenceGapCount: number;
  hardTruth: string;
  checks: BuyerProcurementDecisionCheck[];
  approvalLadder: BuyerProcurementApprovalLane[];
  mutualActionPlan: BuyerProcurementMutualActionPlan;
  decisionContract: BuyerProcurementDecisionContract;
  pilotReceipt: PilotRunReceipt;
}): BuyerProcurementApprovalMemo {
  const readiness = approvalMemoReadiness({
    readiness: input.readiness,
    contractReadiness: input.decisionContract.readiness,
    evidenceGapCount: input.evidenceGapCount
  });
  const firstOpenCheck = input.checks.find((check) => check.status === "blocked") ?? input.checks.find((check) => check.status === "watch");
  const proofStatus = worstStatus([
    input.checks.find((check) => check.id === "measured-proof")?.status ?? "blocked",
    input.checks.find((check) => check.id === "public-proof")?.status ?? "blocked"
  ]);
  const ownerStatus = worstStatus(input.mutualActionPlan.steps.map((step) => step.status));
  const recommendation =
    readiness === "approve"
      ? `Approve the ${yen(input.firstCommitmentYen)} paid proof pilot with ${input.targetBuyer} as sponsor.`
      : readiness === "approve-after-gaps"
        ? `Approve only after ${firstOpenCheck?.label ?? "the open proof gap"} is closed and rechecked.`
        : `Do not approve spend until ${firstOpenCheck?.label ?? "the procurement blocker"} is repaired.`;
  const approvalLine =
    readiness === "approve"
      ? `${input.winnerLabel} is the recommended path at ${input.score}/100 with ${input.paybackDays}-day payback.`
      : readiness === "approve-after-gaps"
        ? `${input.winnerLabel} remains viable, but ${input.evidenceGapCount} proof gap${input.evidenceGapCount === 1 ? "" : "s"} still shape the approval line.`
        : `The current package is not sponsor-safe at ${input.score}/100. Hold budget review.`;
  const proofLine =
    input.evidenceGapCount === 0
      ? `Proof is attached: ${input.pilotReceipt.actualMinutesSavedPerRun}m saved/run and ${input.pilotReceipt.acceptanceRatePercent}% accepted.`
      : `${input.evidenceGapCount} proof gap${input.evidenceGapCount === 1 ? "" : "s"} remain before this memo should be sent externally.`;
  const riskLine =
    input.decisionContract.readiness === "ready-to-sign"
      ? "Risk is bounded by signed decision clauses and explicit stop rules."
      : input.decisionContract.readiness === "needs-redlines"
        ? "Risk is acceptable only after watched clauses receive owner redlines."
        : "Risk is not bounded enough for a budget ask.";
  const partial: Omit<BuyerProcurementApprovalMemo, "exportMarkdown"> = {
    id: `procurement-approval-memo-${readiness}-${input.score}`,
    readiness,
    headline: approvalMemoHeadline(readiness),
    executiveSummary:
      readiness === "approve"
        ? `${input.targetBuyer} can approve a paid proof pilot because economics, proof, owners, and stop rules are all visible.`
        : readiness === "approve-after-gaps"
          ? `${input.targetBuyer} should use this memo as a gap-closure brief before the offer is sent.`
          : `${input.targetBuyer} should not receive a budget ask until the procurement blocker is repaired.`,
    recommendation,
    approvalLine,
    proofLine,
    riskLine,
    decisionGate: input.mutualActionPlan.decisionGate,
    sections: [
      {
        id: "recommendation",
        label: "Recommended decision",
        status: input.readiness === "buy-now" ? "clear" : input.readiness === "pilot-first" ? "watch" : "blocked",
        headline: recommendation,
        body: input.hardTruth,
        evidence: `${input.winnerLabel}, ${input.score}/100 procurement score.`
      },
      {
        id: "economics",
        label: "Economic case",
        status: input.checks.find((check) => check.id === "economic-case")?.status ?? "blocked",
        headline: `${yen(input.monthlyValueYen)} monthly value against ${yen(input.firstCommitmentYen)} first commitment.`,
        body: `${input.paybackDays}-day payback and ${input.timeToValueDays} days to value.`,
        evidence: `${input.confidenceScore}/100 confidence.`
      },
      {
        id: "proof",
        label: "Proof package",
        status: proofStatus,
        headline: proofLine,
        body: "Use only evidence that procurement can open outside the internal workspace.",
        evidence: `${input.pilotReceipt.receiptScore}/100 receipt score.`
      },
      {
        id: "risk",
        label: "Risk posture",
        status: input.decisionContract.readiness === "ready-to-sign" ? "clear" : input.decisionContract.readiness === "needs-redlines" ? "watch" : "blocked",
        headline: riskLine,
        body: input.decisionContract.stopRules[0] ?? "Stop if economics, proof, or data boundary no longer hold.",
        evidence: `${input.decisionContract.clearClauseCount}/${input.decisionContract.clauseCount} decision clauses clear.`
      },
      {
        id: "next-meeting",
        label: "Next meeting ask",
        status: ownerStatus,
        headline: input.mutualActionPlan.decisionGate,
        body: input.mutualActionPlan.summary,
        evidence: `${input.mutualActionPlan.steps.filter((step) => step.status === "clear").length}/${input.mutualActionPlan.steps.length} mutual action steps clear.`
      }
    ]
  };

  return {
    ...partial,
    exportMarkdown: buildApprovalMemoMarkdown(partial)
  };
}

function hasPatch(patch: BuyerProcurementBuyabilityLever["patch"] | undefined) {
  return Boolean(
    patch &&
      ((patch.buyerScenario && Object.keys(patch.buyerScenario).length > 0) ||
        (patch.buyerWorkOrder && Object.keys(patch.buyerWorkOrder).length > 0) ||
        (patch.pilotRun && Object.keys(patch.pilotRun).length > 0))
  );
}

function buildLeverPatch(input: {
  lane: BuyerProcurementApprovalLane;
  buyerScenario: BuyerValueScenario;
  buyerWorkOrder: BuyerWorkOrderInput;
  pilotRun: PilotRunReceiptInput;
}): BuyerProcurementBuyabilityLever["patch"] | undefined {
  const sensitivity = buildBuyerValueSensitivity(input.buyerScenario);
  const calibration = buildBuyerPilotRunCalibration(input.pilotRun, input.buyerScenario);
  const pilotRun = normalizePilotRunReceiptInput(input.pilotRun);

  if (input.lane.id === "adoption-floor" && sensitivity.breakEvenAdoptionPercent > input.buyerScenario.assumptions.adoptionRatePercent) {
    return {
      buyerScenario: {
        adoptionRatePercent: Math.min(100, sensitivity.breakEvenAdoptionPercent)
      }
    };
  }
  if (input.lane.id === "measured-run") {
    const pilotPatch: Partial<PilotRunReceiptInput> = {};
    if (calibration.actualMinutesSavedPerRun < calibration.minimumAcceptedSavingsMinutes) {
      pilotPatch.observedManualMinutes = Math.max(pilotRun.observedManualMinutes, pilotRun.observedAssistedMinutes + calibration.minimumAcceptedSavingsMinutes);
    }
    if (calibration.acceptanceRatePercent < 70) {
      pilotPatch.acceptedTasks = Math.min(pilotRun.totalTasks, Math.ceil(pilotRun.totalTasks * 0.7));
    }
    if (pilotRun.participants < 3) {
      pilotPatch.participants = 3;
    }
    return Object.keys(pilotPatch).length > 0 ? { pilotRun: pilotPatch } : undefined;
  }
  if (input.lane.id === "data-boundary" && input.buyerWorkOrder.dataSensitivity !== "public") {
    return {
      buyerWorkOrder: {
        dataSensitivity: "public"
      }
    };
  }
  return undefined;
}

function leverHeadlineFor(lane: BuyerProcurementApprovalLane, patch: BuyerProcurementBuyabilityLever["patch"] | undefined) {
  if (lane.status === "clear") return `Keep ${lane.label.toLowerCase()} sealed`;
  if (!hasPatch(patch)) return `Close ${lane.label.toLowerCase()} with evidence`;
  if (lane.id === "adoption-floor") return "Raise the committed adoption floor";
  if (lane.id === "measured-run") return "Set the measured-run proof floor";
  if (lane.id === "data-boundary") return "Switch to a public-safe boundary";
  return `Repair ${lane.label.toLowerCase()}`;
}

function leverImpactFor(input: { lane: BuyerProcurementApprovalLane; buyerScenario: BuyerValueScenario; pilotRun: PilotRunReceiptInput }) {
  const sensitivity = buildBuyerValueSensitivity(input.buyerScenario);
  const calibration = buildBuyerPilotRunCalibration(input.pilotRun, input.buyerScenario);

  if (input.lane.id === "a2a-winner") {
    return "Proves the selected A2A squad beats manual work, generic AI, and internal build before a budget ask.";
  }
  if (input.lane.id === "adoption-floor") {
    return `Moves the payback guardrail toward ${sensitivity.breakEvenAdoptionPercent}% break-even adoption.`;
  }
  if (input.lane.id === "measured-run") {
    return `Targets ${calibration.minimumAcceptedSavingsMinutes}m saved/run, 70% task acceptance, and 3+ participants.`;
  }
  if (input.lane.id === "data-boundary") {
    return "Turns restricted or internal evidence into a public-safe proof boundary procurement can inspect.";
  }
  return "Lets procurement open the proof outside the internal workspace without a private explanation.";
}

function applyLabelFor(lane: BuyerProcurementApprovalLane, patch: BuyerProcurementBuyabilityLever["patch"] | undefined) {
  if (!hasPatch(patch)) return undefined;
  if (lane.id === "adoption-floor") return "Apply adoption floor";
  if (lane.id === "measured-run") return "Apply run floor";
  if (lane.id === "data-boundary") return "Use public-safe data";
  return "Apply lever";
}

function buildBuyabilityLevers(input: {
  approvalLadder: BuyerProcurementApprovalLane[];
  buyerScenario: BuyerValueScenario;
  buyerWorkOrder: BuyerWorkOrderInput;
  pilotRun: PilotRunReceiptInput;
}): BuyerProcurementBuyabilityLever[] {
  const openLanes = input.approvalLadder.filter((lane) => lane.status !== "clear");
  const lanes = openLanes.length > 0 ? openLanes : input.approvalLadder.slice(0, 3);

  return lanes.map((lane) => {
    const patch = buildLeverPatch({
      lane,
      buyerScenario: input.buyerScenario,
      buyerWorkOrder: input.buyerWorkOrder,
      pilotRun: input.pilotRun
    });
    return {
      id: lane.id,
      label: lane.label,
      status: lane.status,
      priority: lane.status === "blocked" ? "now" : lane.status === "watch" ? "next" : "sealed",
      headline: leverHeadlineFor(lane, patch),
      current: lane.current,
      target: lane.target,
      impact: leverImpactFor({ lane, buyerScenario: input.buyerScenario, pilotRun: input.pilotRun }),
      action: lane.action,
      owner: lane.owner,
      href: lane.href,
      patch,
      applyLabel: applyLabelFor(lane, patch)
    };
  });
}

function buildChecks(input: {
  decisionReadiness: string;
  buyerWorkOrder: BuyerWorkOrderInput;
  workOrder: BuyerWorkOrderBrief;
  pilotReceipt: PilotRunReceipt;
  a2a: BuyerDecisionAlternative;
}): BuyerProcurementDecisionCheck[] {
  const dataBoundary = input.workOrder.checks.find((check) => check.id === "data-boundary");
  const proofUrl = input.pilotReceipt.evidenceUrl || input.buyerWorkOrder.evidenceUrl;
  const proofUrlProblem = buyerFacingProofUrlProblem(proofUrl);
  const publicProofStatus: BuyerValueScenarioStatus = proofUrlProblem ? "watch" : "clear";
  const publicProofEvidence = proofUrlProblem ? (proofUrl.trim() ? proofUrlProblem : "No public proof URL is attached.") : proofUrl;

  return [
    {
      id: "economic-case",
      label: "A2A economic case",
      status: statusFromDecision(input.decisionReadiness),
      evidence: `${input.a2a.score}/100 A2A score, ${input.a2a.paybackDays}-day payback, ${input.a2a.timeToValueDays} days to value.`,
      action: "Tune workflow volume, adoption, or selected agents until A2A beats the alternatives.",
      href: "#buyer-value-simulator",
      owner: "Buyer sponsor"
    },
    {
      id: "work-order",
      label: "Real work order",
      status: statusFromWorkOrder(input.workOrder.readiness),
      evidence: `${input.workOrder.readiness} at ${input.workOrder.workOrderScore}/100 for ${input.workOrder.targetUser}.`,
      action: input.workOrder.nextAction,
      href: "#buyer-work-order-studio",
      owner: input.workOrder.assignments[0]?.agentName ?? "Pilot owner"
    },
    {
      id: "measured-proof",
      label: "Measured pilot proof",
      status: statusFromReceipt(input.pilotReceipt.readiness),
      evidence: `${input.pilotReceipt.actualMinutesSavedPerRun}m saved/run, ${input.pilotReceipt.acceptanceRatePercent}% accepted, ${input.pilotReceipt.receiptScore}/100 receipt score.`,
      action: "Record one accepted run with manual time, assisted time, reviewer, and public receipt.",
      href: "#buyer-pilot-measured-run",
      owner: input.pilotReceipt.reviewerName || "Buyer reviewer"
    },
    {
      id: "data-boundary",
      label: "Data boundary",
      status: dataBoundary?.status ?? "blocked",
      evidence: dataBoundary?.evidence ?? "Data boundary is not reviewable.",
      action: dataBoundary?.fix ?? "Choose a public-safe or redacted workflow before external review.",
      href: "#buyer-work-order-studio",
      owner: "Security reviewer"
    },
    {
      id: "public-proof",
      label: "Public proof link",
      status: publicProofStatus,
      evidence: publicProofEvidence,
      action: proofUrlProblem ? `${proofUrlProblem} Then run live verification.` : "Keep the public work-order proof or pilot receipt attached for sponsor review.",
      href: "#buyer-proof-intake",
      owner: input.workOrder.assignments[2]?.agentName ?? "Cloud Run SRE"
    }
  ];
}

function buildMarkdown(input: Omit<BuyerProcurementDecision, "exportMarkdown" | "workOrder" | "pilotReceipt">) {
  return [
    `# ${input.headline}`,
    "",
    `Readiness: ${input.readiness}`,
    `Decision score: ${input.score}/100`,
    `Target buyer: ${input.targetBuyer}`,
    `Winner: ${input.winnerLabel}`,
    "",
    input.hardTruth,
    "",
    "## Buying numbers",
    `- A2A score: ${input.a2aScore}/100`,
    `- Monthly value: ${input.monthlyValueYen.toLocaleString("ja-JP")} yen`,
    `- First commitment: ${input.firstCommitmentYen.toLocaleString("ja-JP")} yen`,
    `- Payback: ${input.paybackDays} days`,
    `- Time to value: ${input.timeToValueDays} days`,
    `- Confidence: ${input.confidenceScore}/100`,
    "",
    "## Checks",
    ...input.checks.map((check) => `- [${check.status}] ${check.label}: ${check.evidence} Next: ${check.action}`),
    "",
    "## Approval ladder",
    ...input.approvalLadder.map((lane) => `- [${lane.status}] ${lane.label}: Current ${lane.current} Target ${lane.target} Delta ${lane.delta || "None."} Next: ${lane.action}`),
    "",
    "## Mutual action plan",
    `Decision gate: ${input.mutualActionPlan.decisionGate}`,
    ...input.mutualActionPlan.steps.map(
      (step) =>
        `- ${step.due} [${step.priority}/${step.status}] ${step.buyerOwner} + ${step.a2aOwner}: ${step.commitment} Exit: ${step.exitCriteria} Evidence: ${step.evidence}`
    ),
    "",
    "## Decision contract",
    `Readiness: ${input.decisionContract.readiness}`,
    `Approval ask: ${input.decisionContract.approvalAsk}`,
    `Clauses clear: ${input.decisionContract.clearClauseCount}/${input.decisionContract.clauseCount}`,
    ...input.decisionContract.clauses.map(
      (clause) =>
        `- [${clause.status}] ${clause.label}: Buyer ${clause.buyerCommitment} A2A ${clause.a2aCommitment} Failure: ${clause.failureRule}`
    ),
    "",
    "## Approval memo",
    `Readiness: ${input.approvalMemo.readiness}`,
    `Recommendation: ${input.approvalMemo.recommendation}`,
    `Proof line: ${input.approvalMemo.proofLine}`,
    `Risk line: ${input.approvalMemo.riskLine}`,
    ...input.approvalMemo.sections.map((section) => `- [${section.status}] ${section.label}: ${section.headline} Evidence: ${section.evidence}`),
    "",
    "## Buyability levers",
    ...input.buyabilityLevers.map(
      (lever) =>
        `- [${lever.priority}/${lever.status}] ${lever.headline}: Current ${lever.current} Target ${lever.target} Impact: ${lever.impact} Next: ${lever.action}`
    ),
    "",
    "## Next actions",
    ...input.actions.map((action) => `- [${action.priority}] ${action.owner}: ${action.action}`),
    "",
    "## Alternatives",
    ...input.alternatives.map(
      (alternative) =>
        `- [${alternative.status}] ${alternative.label}: ${alternative.score}/100, ${alternative.monthlyValueYen.toLocaleString("ja-JP")} yen/month, ${alternative.paybackDays} day payback. ${alternative.tradeoff}`
    ),
    "",
    `Selected agents: ${input.selectedAgents.join(", ") || "None"}`
  ].join("\n");
}

export function buildBuyerProcurementDecision(input: BuildBuyerProcurementDecisionInput): BuyerProcurementDecision {
  const workOrder = buildBuyerWorkOrderBrief({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    workOrder: input.buyerWorkOrder
  });
  const workflow = buildPilotWorkflowPlan({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario
  });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    workflow,
    pilotRun: input.pilotRun
  });
  const matrix = buildBuyerDecisionMatrix({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    pilotReceipt
  });
  const winner = matrix.alternatives.find((alternative) => alternative.id === matrix.winnerId) ?? matrix.alternatives[0];
  const a2a = matrix.alternatives.find((alternative) => alternative.id === "a2a-squad") ?? winner;
  const checks = buildChecks({ decisionReadiness: matrix.readiness, buyerWorkOrder: input.buyerWorkOrder, workOrder, pilotReceipt, a2a });
  const approvalLadder = buildApprovalLadder({
    checks,
    alternatives: matrix.alternatives,
    winner,
    a2a,
    buyerScenario: input.buyerScenario,
    buyerWorkOrder: input.buyerWorkOrder,
    pilotRun: input.pilotRun,
    targetBuyer: workOrder.targetUser || input.valueBlueprint.primaryUser
  });
  const evidenceGapCount = checks.filter((check) => check.status !== "clear").length;
  const readiness = readinessFrom({ checks, a2a, winner, buyerScenario: input.buyerScenario });
  const score = Math.round(
    clamp(average([matrix.confidenceScore, workOrder.workOrderScore, pilotReceipt.receiptScore, input.buyerScenario.scenarioScore, average(checks.map((check) => statusScore(check.status)))]))
  );
  const openChecks = checks.filter((check) => check.status !== "clear");
  const actions =
    openChecks.length > 0
      ? openChecks.map(actionForCheck)
      : [
          {
            id: "send-proof-pilot-offer",
            label: "Send proof pilot offer",
            owner: "Buyer sponsor",
            action: "Open the commercial offer and ask for a paid proof-pilot decision.",
            href: "#commercial-offer",
            priority: "next" as const
          },
          {
            id: "share-procurement-matrix",
            label: "Share procurement matrix",
            owner: "Procurement reviewer",
            action: "Share the public decision matrix as the economic proof behind the offer.",
            href: "#buyer-decision-matrix",
            priority: "next" as const
          }
        ];
  const mutualActionPlan = buildMutualActionPlan({
    readiness,
    score,
    evidenceGapCount,
    targetBuyer: workOrder.targetUser || input.valueBlueprint.primaryUser,
    approvalLadder,
    workOrder
  });
  const decisionContract = buildDecisionContract({
    readiness,
    score,
    targetBuyer: workOrder.targetUser || input.valueBlueprint.primaryUser,
    monthlyValueYen: a2a.monthlyValueYen,
    firstCommitmentYen: a2a.firstCostYen,
    paybackDays: a2a.paybackDays,
    timeToValueDays: a2a.timeToValueDays,
    confidenceScore: matrix.confidenceScore,
    checks,
    approvalLadder,
    mutualActionPlan,
    workOrder,
    buyerWorkOrder: input.buyerWorkOrder
  });
  const approvalMemo = buildApprovalMemo({
    readiness,
    score,
    targetBuyer: workOrder.targetUser || input.valueBlueprint.primaryUser,
    winnerLabel: winner.label,
    monthlyValueYen: a2a.monthlyValueYen,
    firstCommitmentYen: a2a.firstCostYen,
    paybackDays: a2a.paybackDays,
    timeToValueDays: a2a.timeToValueDays,
    confidenceScore: matrix.confidenceScore,
    evidenceGapCount,
    hardTruth: hardTruthFor({ readiness, a2a, winner, evidenceGapCount }),
    checks,
    approvalLadder,
    mutualActionPlan,
    decisionContract,
    pilotReceipt
  });
  const buyabilityLevers = buildBuyabilityLevers({
    approvalLadder,
    buyerScenario: input.buyerScenario,
    buyerWorkOrder: input.buyerWorkOrder,
    pilotRun: input.pilotRun
  });
  const partial = {
    id: `buyer-procurement-${readiness}-${score}-${a2a.id}`,
    readiness,
    score,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor({ readiness, a2a, winner, evidenceGapCount }),
    targetBuyer: workOrder.targetUser || input.valueBlueprint.primaryUser,
    winnerLabel: winner.label,
    a2aScore: a2a.score,
    monthlyValueYen: a2a.monthlyValueYen,
    firstCommitmentYen: a2a.firstCostYen,
    paybackDays: a2a.paybackDays,
    timeToValueDays: a2a.timeToValueDays,
    confidenceScore: matrix.confidenceScore,
    evidenceGapCount,
    selectedAgents: input.recommendation.selected.map((agent) => agent.name),
    checks,
    approvalLadder,
    mutualActionPlan,
    decisionContract,
    approvalMemo,
    buyabilityLevers,
    actions,
    alternatives: matrix.alternatives,
    workOrder,
    pilotReceipt
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderBuyerProcurementDecisionHtml(
  decision: BuyerProcurementDecision,
  links: {
    valueReportUrl?: string;
    workOrderUrl?: string;
    pilotReceiptUrl?: string;
    decisionMatrixUrl?: string;
    commercialOfferUrl?: string;
    jsonUrl?: string;
    markdownUrl?: string;
    appUrl?: string;
  } = {}
) {
  const metrics = [
    { label: "Readiness", value: decision.readiness, status: decision.readiness },
    { label: "A2A score", value: `${decision.a2aScore}/100`, status: decision.checks.find((check) => check.id === "economic-case")?.status ?? decision.readiness },
    { label: "Monthly value", value: yen(decision.monthlyValueYen), status: decision.readiness },
    { label: "Payback", value: `${decision.paybackDays} days`, status: decision.checks.find((check) => check.id === "economic-case")?.status ?? decision.readiness },
    { label: "Time to value", value: `${decision.timeToValueDays} days`, status: decision.readiness },
    { label: "Proof gaps", value: decision.evidenceGapCount, status: decision.evidenceGapCount === 0 ? "clear" : "watch" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const checks = decision.checks
    .map(
      (check) => `
        <article class="card ${tone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.evidence)}</p>
          <small>${escapeHtml(check.owner)}: ${escapeHtml(check.action)}</small>
        </article>`
    )
    .join("");
  const ladder = decision.approvalLadder
    .map(
      (lane) => `
        <article class="card ${tone(lane.status)}">
          <div><strong>${escapeHtml(lane.label)}</strong><span>${escapeHtml(lane.status)}</span></div>
          <p>${escapeHtml(lane.buyerQuestion)}</p>
          <dl>
            <div><dt>Current</dt><dd>${escapeHtml(lane.current)}</dd></div>
            <div><dt>Target</dt><dd>${escapeHtml(lane.target)}</dd></div>
            <div><dt>Delta</dt><dd>${escapeHtml(lane.delta || "None.")}</dd></div>
          </dl>
          <small>${escapeHtml(lane.owner)}: ${escapeHtml(lane.action)}</small>
        </article>`
    )
    .join("");
  const mutualActionPlan = decision.mutualActionPlan.steps
    .map(
      (step) => `
        <article class="card ${tone(step.status)}">
          <div><strong>${escapeHtml(step.due)} ${escapeHtml(step.buyerOwner)}</strong><span>${escapeHtml(step.priority)}</span></div>
          <p>${escapeHtml(step.commitment)}</p>
          <dl>
            <div><dt>A2A owner</dt><dd>${escapeHtml(step.a2aOwner)}</dd></div>
            <div><dt>Exit criteria</dt><dd>${escapeHtml(step.exitCriteria)}</dd></div>
            <div><dt>Evidence</dt><dd>${escapeHtml(step.evidence)}</dd></div>
          </dl>
          <small>${escapeHtml(step.href)}</small>
        </article>`
    )
    .join("");
  const decisionContract = decision.decisionContract.clauses
    .map(
      (clause) => `
        <article class="card ${tone(clause.status)}">
          <div><strong>${escapeHtml(clause.label)}</strong><span>${escapeHtml(clause.status)}</span></div>
          <p>${escapeHtml(clause.buyerCommitment)}</p>
          <dl>
            <div><dt>A2A</dt><dd>${escapeHtml(clause.a2aCommitment)}</dd></div>
            <div><dt>Evidence</dt><dd>${escapeHtml(clause.evidence)}</dd></div>
            <div><dt>Stop if</dt><dd>${escapeHtml(clause.failureRule)}</dd></div>
          </dl>
          <small>${escapeHtml(clause.owner)} - ${escapeHtml(clause.href)}</small>
        </article>`
    )
    .join("");
  const approvalMemo = decision.approvalMemo.sections
    .map(
      (section) => `
        <article class="card ${tone(section.status)}">
          <div><strong>${escapeHtml(section.label)}</strong><span>${escapeHtml(section.status)}</span></div>
          <p>${escapeHtml(section.headline)}</p>
          <dl>
            <div><dt>Memo point</dt><dd>${escapeHtml(section.body)}</dd></div>
            <div><dt>Evidence</dt><dd>${escapeHtml(section.evidence)}</dd></div>
          </dl>
        </article>`
    )
    .join("");
  const buyabilityLevers = decision.buyabilityLevers
    .map(
      (lever) => `
        <article class="card ${tone(lever.status)}">
          <div><strong>${escapeHtml(lever.headline)}</strong><span>${escapeHtml(lever.priority)}</span></div>
          <p>${escapeHtml(lever.impact)}</p>
          <dl>
            <div><dt>Current</dt><dd>${escapeHtml(lever.current)}</dd></div>
            <div><dt>Target</dt><dd>${escapeHtml(lever.target)}</dd></div>
            <div><dt>Next</dt><dd>${escapeHtml(lever.action)}</dd></div>
          </dl>
          <small>${escapeHtml(lever.owner)} - ${escapeHtml(lever.applyLabel ?? "Manual evidence required")}</small>
        </article>`
    )
    .join("");
  const actions = decision.actions
    .map(
      (action) => `
        <article class="card ${action.priority === "now" ? "watch" : "good"}">
          <div><strong>${escapeHtml(action.label)}</strong><span>${escapeHtml(action.priority)}</span></div>
          <p>${escapeHtml(action.action)}</p>
          <small>${escapeHtml(action.owner)} - ${escapeHtml(action.href)}</small>
        </article>`
    )
    .join("");
  const alternatives = decision.alternatives
    .map(
      (alternative) => `
        <article class="card ${tone(alternative.status)}">
          <div><strong>${escapeHtml(alternative.label)}</strong><span>${escapeHtml(alternative.status)}</span></div>
          <b>${escapeHtml(alternative.score)}/100</b>
          <p>${escapeHtml(yen(alternative.monthlyValueYen))} / month, ${escapeHtml(alternative.paybackDays)} day payback, ${escapeHtml(alternative.timeToValueDays)} days to value.</p>
          <small>${escapeHtml(alternative.tradeoff)}</small>
        </article>`
    )
    .join("");
  const linkList = [
    links.valueReportUrl ? `<a href="${escapeHtml(links.valueReportUrl)}">Value report</a>` : "",
    links.workOrderUrl ? `<a href="${escapeHtml(links.workOrderUrl)}">Work order</a>` : "",
    links.pilotReceiptUrl ? `<a href="${escapeHtml(links.pilotReceiptUrl)}">Pilot receipt</a>` : "",
    links.decisionMatrixUrl ? `<a href="${escapeHtml(links.decisionMatrixUrl)}">Decision matrix</a>` : "",
    links.commercialOfferUrl ? `<a href="${escapeHtml(links.commercialOfferUrl)}">Commercial offer</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open app</a>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(decision.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #52645f; --line: #cbd7d2; --paper: #eef2ed; --panel: #fffdf7; --teal: #0f766e; --blue: #2457a6; --green-bg: #edf8f1; --amber-bg: #fff7dd; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 18px; }
      .eyebrow, .metric span, .card span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.1rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p { color: var(--muted); }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: end; }
      .stamp { min-height: 210px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #102226, #0f766e 62%, #2457a6); text-align: center; }
      .stamp span { color: #b8efd4; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { font-size: 4.1rem; line-height: .9; }
      .stamp small { max-width: 240px; color: rgba(255, 253, 247, .78); font-weight: 900; }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .metrics, .grid, .cards { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(6, minmax(0, 1fr)); }
      .grid { grid-template-columns: minmax(0, .72fr) minmax(320px, .5fr); align-items: start; }
      .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .panel, .card { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.12rem; line-height: 1.1; overflow-wrap: anywhere; }
      .panel { padding: 16px; }
      .card { display: grid; gap: 7px; padding: 13px; }
      .card + .card { margin-top: 10px; }
      .card div { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
      .card b { width: fit-content; border-radius: 999px; padding: 4px 8px; color: #102226; background: #d8fff5; }
      .card strong, .card p, .card small { overflow-wrap: anywhere; }
      .card dl { display: grid; gap: 6px; margin: 0; }
      .card dl div { display: grid; gap: 2px; padding-top: 7px; border-top: 1px solid rgba(23, 33, 38, .1); }
      .card dt { color: var(--teal); font-size: .7rem; font-weight: 950; text-transform: uppercase; }
      .card dd { margin: 0; color: var(--muted); font-weight: 800; overflow-wrap: anywhere; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      .receipt { display: grid; gap: 10px; }
      .receipt dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 0; }
      .receipt div { min-width: 0; border: 1px solid var(--line); border-radius: 8px; padding: 10px; background: #f8fbf8; }
      dt { color: var(--teal); font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      dd { margin: 4px 0 0; font-weight: 900; overflow-wrap: anywhere; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 860px) { header, main, footer { width: min(100% - 24px, 620px); } .hero, .metrics, .grid, .cards, .receipt dl { grid-template-columns: 1fr; } .stamp { min-height: 140px; } .stamp strong { font-size: 3rem; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Procurement Decision Proof</span>
          <h1>${escapeHtml(decision.headline)}</h1>
          <p>${escapeHtml(decision.hardTruth)}</p>
          <nav>${linkList}</nav>
        </div>
        <aside class="stamp">
          <span>${escapeHtml(decision.readiness)}</span>
          <strong>${escapeHtml(decision.score)}</strong>
          <small>${escapeHtml(decision.winnerLabel)} / ${escapeHtml(decision.targetBuyer)}</small>
        </aside>
      </div>
    </header>
    <main>
      <section class="metrics" aria-label="Procurement metrics">${metrics}</section>
      <section class="grid">
        <article class="panel">
          <h2>Approval checks</h2>
          ${checks}
        </article>
        <aside class="panel">
          <h2>Next actions</h2>
          ${actions}
        </aside>
      </section>
      <section class="panel">
        <h2>Approval ladder</h2>
        <div class="cards">${ladder}</div>
      </section>
      <section class="panel">
        <h2>Mutual action plan</h2>
        <p>${escapeHtml(decision.mutualActionPlan.summary)} Gate: ${escapeHtml(decision.mutualActionPlan.decisionGate)}.</p>
        <div class="cards">${mutualActionPlan}</div>
      </section>
      <section class="panel">
        <h2>Decision contract</h2>
        <p>${escapeHtml(decision.decisionContract.summary)}</p>
        <div class="receipt">
          <dl>
            <div><dt>Readiness</dt><dd>${escapeHtml(decision.decisionContract.readiness)}</dd></div>
            <div><dt>Approval ask</dt><dd>${escapeHtml(decision.decisionContract.approvalAsk)}</dd></div>
            <div><dt>Decision gate</dt><dd>${escapeHtml(decision.decisionContract.decisionGate)}</dd></div>
            <div><dt>Clauses clear</dt><dd>${escapeHtml(`${decision.decisionContract.clearClauseCount}/${decision.decisionContract.clauseCount}`)}</dd></div>
          </dl>
        </div>
        <div class="cards">${decisionContract}</div>
      </section>
      <section class="panel">
        <h2>Approval memo</h2>
        <strong>${escapeHtml(decision.approvalMemo.headline)}</strong>
        <p>${escapeHtml(decision.approvalMemo.executiveSummary)}</p>
        <div class="receipt">
          <dl>
            <div><dt>Readiness</dt><dd>${escapeHtml(decision.approvalMemo.readiness)}</dd></div>
            <div><dt>Decision gate</dt><dd>${escapeHtml(decision.approvalMemo.decisionGate)}</dd></div>
            <div><dt>Recommendation</dt><dd>${escapeHtml(decision.approvalMemo.recommendation)}</dd></div>
            <div><dt>Risk line</dt><dd>${escapeHtml(decision.approvalMemo.riskLine)}</dd></div>
          </dl>
        </div>
        <div class="cards">${approvalMemo}</div>
      </section>
      <section class="panel">
        <h2>Buyability levers</h2>
        <p>Specific changes that move this opportunity toward a buyer-ready procurement decision.</p>
        <div class="cards">${buyabilityLevers}</div>
      </section>
      <section class="grid">
        <article class="panel">
          <h2>Buying table</h2>
          <div class="cards">${alternatives}</div>
        </article>
        <aside class="panel receipt">
          <h2>Pilot receipt</h2>
          <dl>
            <div><dt>Readiness</dt><dd>${escapeHtml(decision.pilotReceipt.readiness)}</dd></div>
            <div><dt>Saved/run</dt><dd>${escapeHtml(decision.pilotReceipt.actualMinutesSavedPerRun)}m</dd></div>
            <div><dt>Acceptance</dt><dd>${escapeHtml(decision.pilotReceipt.acceptanceRatePercent)}%</dd></div>
            <div><dt>Reviewer</dt><dd>${escapeHtml(decision.pilotReceipt.reviewerName || "missing")}</dd></div>
          </dl>
          <p>${escapeHtml(decision.pilotReceipt.evidenceUrl || "Public receipt URL is missing.")}</p>
        </aside>
      </section>
    </main>
    <footer>Generated procurement proof. This page maps the buying recommendation to economic score, scoped work order, measured pilot receipt, data boundary, and public proof links.</footer>
  </body>
</html>`;
}
