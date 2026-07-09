import type { BuyerDecisionMatrix } from "./buyerDecisionMatrix.js";
import type { BuyerDiligenceRoom } from "./buyerDiligence.js";
import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import type { PilotAgreement } from "./pilotAgreement.js";
import type { PilotEvidenceLedger } from "./pilotEvidenceLedger.js";
import type { PilotExecutionHandoff } from "./pilotExecution.js";
import type { PilotProposal } from "./pilotProposal.js";
import type { PilotRunReceipt } from "./pilotRunReceipt.js";
import type { PilotWorkflowPlan } from "./pilotWorkflow.js";
import type { BuyerProofPacketReceipt } from "./buyerProofPacket.js";
import type { ValueBlueprint } from "./valueBlueprint.js";
import { buildBuyerValueSensitivity } from "./buyerValueSensitivity.js";

export type SponsorReviewReadiness = "approve-review" | "close-evidence" | "blocked";
export type SponsorReviewArtifactId = "value-report" | "proposal" | "workflow" | "receipt" | "decision" | "agreement" | "ledger" | "diligence" | "execution";

export type SponsorReviewQuestion = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  owner: string;
  question: string;
  answer: string;
  evidence: string;
  artifactId: SponsorReviewArtifactId;
  nextAction: string;
};

export type SponsorObjectionBriefId = "finance-roi" | "security-boundary" | "procurement-choice" | "delivery-accountability" | "executive-stop";
export type SponsorApprovalMeetingMode = "ready-to-run" | "needs-prep" | "do-not-schedule";

export type SponsorObjectionBrief = {
  id: SponsorObjectionBriefId;
  stakeholder: string;
  status: BuyerValueScenarioStatus;
  objection: string;
  answer: string;
  evidence: string;
  owner: string;
  artifactId: SponsorReviewArtifactId;
  meetingMove: string;
  ifChallenged: string;
};

export type SponsorApprovalAgendaItem = {
  id: string;
  label: string;
  minutes: number;
  owner: string;
  status: BuyerValueScenarioStatus;
  question: string;
  evidence: string;
  artifactId: SponsorReviewArtifactId;
};

export type SponsorReviewRoom = {
  id: string;
  readiness: SponsorReviewReadiness;
  reviewScore: number;
  pressureTestScore: number;
  approvalMeetingMode: SponsorApprovalMeetingMode;
  headline: string;
  hardTruth: string;
  targetBuyer: string;
  decisionAsk: string;
  questions: SponsorReviewQuestion[];
  objectionBriefs: SponsorObjectionBrief[];
  approvalAgenda: SponsorApprovalAgendaItem[];
  nextQuestion: SponsorReviewQuestion;
  exportMarkdown: string;
};

export type SponsorDecisionChoice = "continue" | "revise" | "stop";
export type SponsorDecisionReceiptStatus = "signed" | "needs-evidence" | "stopped";

export type SponsorDecisionReceiptInput = {
  decision?: SponsorDecisionChoice;
  signerName?: string;
  sponsorNote?: string;
  conditionNote?: string;
  decidedAt?: string;
};

export type SponsorDecisionCondition = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  owner: string;
  evidence: string;
  requiredAction: string;
};

export type SponsorDecisionReceipt = {
  id: string;
  status: SponsorDecisionReceiptStatus;
  decision: SponsorDecisionChoice;
  signerName: string;
  decidedAt: string;
  headline: string;
  summary: string;
  nextStep: string;
  sponsorNote: string;
  conditions: SponsorDecisionCondition[];
  exportMarkdown: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
  if (["approve-review", "clear"].includes(status)) return "good";
  if (["blocked"].includes(status)) return "bad";
  return "watch";
}

function statusScore(status: BuyerValueScenarioStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 66;
  return 18;
}

function scenarioStatus(scenario: BuyerValueScenario): BuyerValueScenarioStatus {
  if (scenario.readiness === "scales-now") return "clear";
  if (scenario.readiness === "pilot-first") return "watch";
  return "blocked";
}

function readinessFrom(questions: SponsorReviewQuestion[]): SponsorReviewReadiness {
  if (questions.some((question) => question.status === "blocked")) return "blocked";
  if (questions.every((question) => question.status === "clear")) return "approve-review";
  return "close-evidence";
}

function headlineFor(readiness: SponsorReviewReadiness) {
  if (readiness === "approve-review") return "Sponsor review room is ready to approve";
  if (readiness === "close-evidence") return "Sponsor review room needs evidence closure";
  return "Sponsor review room should stay blocked";
}

function hardTruthFor(readiness: SponsorReviewReadiness, questions: SponsorReviewQuestion[]) {
  const open = questions.filter((question) => question.status !== "clear");
  if (readiness === "approve-review") {
    return "A sponsor can answer the approval questions from one room without hunting through the workbench.";
  }
  if (readiness === "close-evidence") {
    return `${open.length} answer${open.length === 1 ? "" : "s"} need owner confirmation before the approval ask is clean.`;
  }
  return `${open.length} approval answer${open.length === 1 ? "" : "s"} are blocked; sharing now would still feel like a demo.`;
}

function questionStatus(...statuses: BuyerValueScenarioStatus[]): BuyerValueScenarioStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("watch")) return "watch";
  return "clear";
}

function statusFromReadiness(readiness: string, clearValue: string, watchValue: string): BuyerValueScenarioStatus {
  if (readiness === clearValue) return "clear";
  if (readiness === watchValue) return "watch";
  return "blocked";
}

function meetingModeFrom(briefs: SponsorObjectionBrief[]): SponsorApprovalMeetingMode {
  if (briefs.some((brief) => brief.status === "blocked")) return "do-not-schedule";
  if (briefs.some((brief) => brief.status === "watch")) return "needs-prep";
  return "ready-to-run";
}

function buildObjectionBriefs(input: {
  buyerScenario: BuyerValueScenario;
  workflow: PilotWorkflowPlan;
  pilotReceipt: PilotRunReceipt;
  decisionMatrix: BuyerDecisionMatrix;
  agreement: PilotAgreement;
  ledger: PilotEvidenceLedger;
  diligence: BuyerDiligenceRoom;
  execution: PilotExecutionHandoff;
}): SponsorObjectionBrief[] {
  const sensitivity = buildBuyerValueSensitivity(input.buyerScenario);
  const breakEven = sensitivity.guardrails.find((guardrail) => guardrail.id === "break-even-adoption");
  const downside = sensitivity.cases.find((item) => item.id === "pessimistic");
  const dataBoundary = input.diligence.approvalQuestions.find((question) => question.id === "data-boundary");
  const dataTerm = input.agreement.terms.find((term) => term.id === "data-security");
  const blockedRisk = input.diligence.riskRegister.find((risk) => risk.status === "blocked");
  const a2a = input.decisionMatrix.alternatives.find((alternative) => alternative.id === "a2a-squad");
  const winner = input.decisionMatrix.alternatives.find((alternative) => alternative.id === input.decisionMatrix.winnerId);
  const financeStatus = questionStatus(
    scenarioStatus(input.buyerScenario),
    sensitivity.verdict === "defensible" ? "clear" : sensitivity.verdict === "fragile" ? "watch" : "blocked",
    breakEven?.status ?? "blocked"
  );
  const securityStatus = questionStatus(dataBoundary?.status ?? "blocked", dataTerm?.status ?? "blocked", blockedRisk ? "blocked" : "clear");
  const deliveryStatus = questionStatus(
    statusFromReadiness(input.workflow.readiness, "ready-to-run", "needs-scope"),
    statusFromReadiness(input.pilotReceipt.readiness, "accepted", "needs-evidence"),
    statusFromReadiness(input.execution.readiness, "ready-to-start", "needs-proof")
  );
  const executiveStatus = questionStatus(
    statusFromReadiness(input.agreement.readiness, "ready-to-sign", "needs-redlines"),
    statusFromReadiness(input.ledger.readiness, "sponsor-ready", "needs-proof"),
    statusFromReadiness(input.diligence.readiness, "approval-ready", "needs-evidence")
  );

  return [
    {
      id: "finance-roi",
      stakeholder: "Finance",
      status: financeStatus,
      objection: "The ROI depends on adoption assumptions that may not survive rollout.",
      answer:
        financeStatus === "clear"
          ? `Break-even adoption is ${sensitivity.breakEvenAdoptionPercent}% against the current ${input.buyerScenario.assumptions.adoptionRatePercent}% assumption, and downside payback is ${downside?.paybackDays ?? 999} days.`
          : `Treat approval as conditional until adoption reaches ${sensitivity.breakEvenAdoptionPercent}% or the pilot scope is reduced to protect payback.`,
      evidence: `${sensitivity.confidenceBand}; value at risk ${yen(sensitivity.valueAtRiskYen)}. ${breakEven?.evidence ?? "Break-even adoption is not available."}`,
      owner: "Buyer sponsor",
      artifactId: "value-report",
      meetingMove: "Open the value report first and ask Finance to accept the break-even adoption floor.",
      ifChallenged: "Lower the approved rollout scope and require a weekly adoption owner before expansion spend."
    },
    {
      id: "security-boundary",
      stakeholder: "Security",
      status: securityStatus,
      objection: "The pilot may leak production data or create an unmanaged integration.",
      answer: blockedRisk
        ? blockedRisk.mitigation
        : `The data boundary is covered by diligence evidence and the agreement term: ${dataTerm?.text ?? "No private data before security review."}`,
      evidence: `${dataBoundary?.evidence ?? "Data-boundary question is missing."} ${dataTerm?.acceptance ?? "Security acceptance is missing."}`,
      owner: dataBoundary?.owner ?? dataTerm?.owner ?? "Security reviewer",
      artifactId: "diligence",
      meetingMove: "Let Security inspect the diligence room before the sponsor approves any buyer session.",
      ifChallenged: "Keep the pilot on synthetic or redacted data until the named security reviewer signs the data boundary."
    },
    {
      id: "procurement-choice",
      stakeholder: "Procurement",
      status: statusFromReadiness(input.decisionMatrix.readiness, "buy-a2a", "pilot-more"),
      objection: "A generic AI subscription or internal build may be cheaper than this agent squad.",
      answer: `${winner?.label ?? input.decisionMatrix.winnerId} is the current winner; A2A scores ${a2a?.score ?? 0}/100 with ${input.decisionMatrix.confidenceScore}/100 decision confidence.`,
      evidence: `${input.decisionMatrix.alternatives.length} alternatives compared; A2A status is ${a2a?.status ?? "missing"}.`,
      owner: "Procurement reviewer",
      artifactId: "decision",
      meetingMove: "Open the decision matrix and compare A2A against manual work, generic AI, and internal build in that order.",
      ifChallenged: "Hold expansion budget and rerun the measured pilot until A2A wins the comparison table."
    },
    {
      id: "delivery-accountability",
      stakeholder: "Pilot owner",
      status: deliveryStatus,
      objection: "Approval is vague unless someone knows what starts tomorrow.",
      answer: `Start "${input.workflow.workflowName}" with ${input.execution.workOrders.length} work orders, ${input.execution.gates.length} proof gates, and the measured receipt attached.`,
      evidence: `${input.workflow.workflowScore}/100 workflow score; ${input.pilotReceipt.receiptScore}/100 receipt score; ${input.execution.executionScore}/100 execution score.`,
      owner: input.execution.workOrders[0]?.owner ?? "Pilot owner",
      artifactId: "execution",
      meetingMove: "Close the review by assigning the first work order owner and proof gate owner.",
      ifChallenged: "Do not start the pilot. Narrow the workflow until one owner, one run, and one acceptance signal are explicit."
    },
    {
      id: "executive-stop",
      stakeholder: "Executive sponsor",
      status: executiveStatus,
      objection: "The pilot may drift into a production commitment before proof is accepted.",
      answer: `The agreement has ${input.agreement.stopRules.length} stop rules and the ledger has ${input.ledger.exceptions.length} open exception${input.ledger.exceptions.length === 1 ? "" : "s"}.`,
      evidence: `${input.agreement.agreementScore}/100 agreement score; ${input.ledger.ledgerScore}/100 ledger score; ${input.diligence.diligenceScore}/100 diligence score.`,
      owner: "Buyer sponsor",
      artifactId: "agreement",
      meetingMove: "Ask the sponsor to approve, revise, or stop using the decision receipt after objections are answered.",
      ifChallenged: "Record a revise or stop decision and attach the open conditions to the sponsor decision receipt."
    }
  ];
}

function buildApprovalAgenda(briefs: SponsorObjectionBrief[]): SponsorApprovalAgendaItem[] {
  const agenda: Array<{ id: string; label: string; minutes: number; briefId: SponsorObjectionBriefId; question: string }> = [
    { id: "business-case", label: "Defend value floor", minutes: 4, briefId: "finance-roi", question: "Is the adoption floor defensible enough to approve a bounded pilot?" },
    { id: "security-boundary", label: "Confirm data boundary", minutes: 3, briefId: "security-boundary", question: "Can the first buyer run proceed without private data exposure?" },
    { id: "buying-choice", label: "Compare buying options", minutes: 4, briefId: "procurement-choice", question: "Why fund this A2A squad instead of the alternatives?" },
    { id: "operating-start", label: "Assign first run", minutes: 3, briefId: "delivery-accountability", question: "Who starts the first work order and what proof gate closes it?" },
    { id: "decision-receipt", label: "Record sponsor decision", minutes: 2, briefId: "executive-stop", question: "Approve, revise, or stop with conditions written down?" }
  ];

  return agenda.map((item) => {
    const brief = briefs.find((candidate) => candidate.id === item.briefId) ?? briefs[0];
    return {
      id: item.id,
      label: item.label,
      minutes: item.minutes,
      owner: brief.owner,
      status: brief.status,
      question: item.question,
      evidence: brief.evidence,
      artifactId: brief.artifactId
    };
  });
}

function buildQuestions(input: {
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  proposal: PilotProposal;
  workflow: PilotWorkflowPlan;
  pilotReceipt: PilotRunReceipt;
  decisionMatrix: BuyerDecisionMatrix;
  agreement: PilotAgreement;
  ledger: PilotEvidenceLedger;
  diligence: BuyerDiligenceRoom;
  execution: PilotExecutionHandoff;
}): SponsorReviewQuestion[] {
  const a2a = input.decisionMatrix.alternatives.find((alternative) => alternative.id === "a2a-squad");
  const winner = input.decisionMatrix.alternatives.find((alternative) => alternative.id === input.decisionMatrix.winnerId);
  const blockedRisk = input.diligence.riskRegister.find((risk) => risk.status === "blocked");
  const openAgreementTerms = input.agreement.terms.filter((term) => term.status !== "clear");
  const clearQuestions = input.diligence.approvalQuestions.filter((question) => question.status === "clear").length;

  return [
    {
      id: "business-value",
      label: "Business value",
      status: scenarioStatus(input.buyerScenario),
      owner: "Buyer sponsor",
      question: "What business result are we approving?",
      answer: `${input.valueBlueprint.primaryUser} gets ${input.buyerScenario.monthlyHoursSaved}h/month back with ${yen(input.buyerScenario.monthlyGrossValueYen)} modeled monthly value and ${input.buyerScenario.paybackDays}-day payback.`,
      evidence: `${input.buyerScenario.confidenceScore}/100 confidence and ${input.valueBlueprint.boardScore}/100 value blueprint score.`,
      artifactId: "value-report",
      nextAction: input.buyerScenario.readiness === "not-yet" ? "Tighten the buyer value assumptions before sponsor review." : "Use the value report as the commercial baseline."
    },
    {
      id: "proof",
      label: "Proof trail",
      status: input.ledger.readiness === "sponsor-ready" ? "clear" : input.ledger.readiness === "needs-proof" ? "watch" : "blocked",
      owner: "Pilot reviewer",
      question: "Can the sponsor inspect proof without private context?",
      answer: `${input.ledger.events.length} evidence events cover the proposal, workflow, measured run, decision, agreement, and execution handoff.`,
      evidence: `${input.ledger.exceptions.length} open ledger exceptions; first run saved ${input.pilotReceipt.actualMinutesSavedPerRun} minutes with ${input.pilotReceipt.acceptanceRatePercent}% acceptance.`,
      artifactId: "ledger",
      nextAction: input.ledger.exceptions[0]?.fix ?? "Use the ledger as the sponsor audit trail."
    },
    {
      id: "why-a2a",
      label: "Why A2A",
      status: input.decisionMatrix.readiness === "buy-a2a" ? "clear" : input.decisionMatrix.readiness === "pilot-more" ? "watch" : "blocked",
      owner: "Procurement reviewer",
      question: "Why this agent squad instead of the alternatives?",
      answer: `${winner?.label ?? input.decisionMatrix.winnerId} is the current winner; A2A is ${a2a?.status ?? "weak"} with ${a2a?.score ?? 0}/100.`,
      evidence: `${input.decisionMatrix.confidenceScore}/100 decision confidence across ${input.decisionMatrix.alternatives.length} alternatives.`,
      artifactId: "decision",
      nextAction: input.decisionMatrix.readiness === "buy-a2a" ? "Use the decision matrix to defend procurement choice." : "Resolve the decision gap before requesting expansion budget."
    },
    {
      id: "operating-plan",
      label: "Operating plan",
      status: questionStatus(
        input.workflow.readiness === "ready-to-run" ? "clear" : input.workflow.readiness === "needs-scope" ? "watch" : "blocked",
        input.execution.readiness === "ready-to-start" ? "clear" : input.execution.readiness === "needs-proof" ? "watch" : "blocked"
      ),
      owner: "Pilot owner",
      question: "What exactly starts after approval?",
      answer: `Run "${input.workflow.workflowName}" with ${input.execution.workOrders.length} work orders and ${input.execution.gates.length} proof gates.`,
      evidence: `${input.workflow.workflowScore}/100 workflow score; ${input.execution.executionScore}/100 execution score.`,
      artifactId: "workflow",
      nextAction: input.execution.readiness === "ready-to-start" ? "Assign owners and start the bounded pilot." : "Close execution proof gates before kickoff."
    },
    {
      id: "risk-boundary",
      label: "Risk boundary",
      status: questionStatus(
        input.diligence.readiness === "approval-ready" ? "clear" : input.diligence.readiness === "needs-evidence" ? "watch" : "blocked",
        openAgreementTerms.some((term) => term.status === "blocked") ? "blocked" : openAgreementTerms.length ? "watch" : "clear"
      ),
      owner: blockedRisk?.owner ?? "Security reviewer",
      question: "What stops this from becoming an unsafe rollout?",
      answer: blockedRisk ? blockedRisk.mitigation : `Diligence has ${clearQuestions}/${input.diligence.approvalQuestions.length} clear approval questions and ${input.agreement.stopRules.length} stop rules.`,
      evidence: `${input.diligence.diligenceScore}/100 diligence score; ${openAgreementTerms.length} agreement terms still open.`,
      artifactId: "diligence",
      nextAction: blockedRisk ? blockedRisk.mitigation : "Use diligence and agreement terms as the approval boundary."
    },
    {
      id: "approval-ask",
      label: "Approval ask",
      status: questionStatus(
        input.agreement.readiness === "ready-to-sign" ? "clear" : input.agreement.readiness === "needs-redlines" ? "watch" : "blocked",
        input.ledger.readiness === "sponsor-ready" ? "clear" : input.ledger.readiness === "needs-proof" ? "watch" : "blocked",
        input.diligence.readiness === "approval-ready" ? "clear" : input.diligence.readiness === "needs-evidence" ? "watch" : "blocked"
      ),
      owner: "Buyer sponsor",
      question: "What decision should the sponsor make now?",
      answer:
        input.agreement.readiness === "ready-to-sign" && input.ledger.readiness === "sponsor-ready" && input.diligence.readiness === "approval-ready"
          ? "Approve the first buyer pilot review with the agreement, ledger, and diligence room attached."
          : "Hold approval until the open evidence and agreement items are closed.",
      evidence: `${input.agreement.agreementScore}/100 agreement score, ${input.ledger.ledgerScore}/100 ledger score, ${input.diligence.diligenceScore}/100 diligence score.`,
      artifactId: "agreement",
      nextAction: "Send the sponsor review room with the handoff note."
    }
  ];
}

function buildDecisionAsk(readiness: SponsorReviewReadiness, nextQuestion: SponsorReviewQuestion) {
  if (readiness === "approve-review") return "Approve the first buyer pilot review.";
  if (readiness === "close-evidence") return `Close evidence before approval: ${nextQuestion.label}.`;
  return `Do not approve yet: ${nextQuestion.label} is blocked.`;
}

export function recommendedSponsorDecision(room: Pick<SponsorReviewRoom, "readiness">): SponsorDecisionChoice {
  if (room.readiness === "approve-review") return "continue";
  if (room.readiness === "close-evidence") return "revise";
  return "stop";
}

function receiptStatusFor(room: SponsorReviewRoom, decision: SponsorDecisionChoice): SponsorDecisionReceiptStatus {
  if (decision === "stop") return "stopped";
  if (decision === "continue" && room.readiness === "approve-review") return "signed";
  return "needs-evidence";
}

function decisionLabel(decision: SponsorDecisionChoice) {
  if (decision === "continue") return "Continue pilot";
  if (decision === "revise") return "Revise before approval";
  return "Stop external sharing";
}

function receiptHeadline(decision: SponsorDecisionChoice, status: SponsorDecisionReceiptStatus) {
  if (status === "signed") return "Sponsor signed the first pilot decision";
  if (decision === "stop") return "Sponsor stopped external sharing";
  return "Sponsor decision needs evidence closure";
}

function receiptSummary(room: SponsorReviewRoom, decision: SponsorDecisionChoice, status: SponsorDecisionReceiptStatus) {
  const open = room.questions.filter((question) => question.status !== "clear").length;
  if (status === "signed") {
    return `Approved ${room.targetBuyer} to continue with ${room.questions.length}/${room.questions.length} sponsor answers clear.`;
  }
  if (decision === "stop") {
    return `External sharing is stopped until ${room.nextQuestion.owner} resolves ${room.nextQuestion.label}.`;
  }
  return `${decisionLabel(decision)} is recorded, but ${open} approval answer${open === 1 ? "" : "s"} still need closure.`;
}

function receiptNextStep(room: SponsorReviewRoom, decision: SponsorDecisionChoice, status: SponsorDecisionReceiptStatus) {
  if (status === "signed") return "Start the bounded pilot and attach this receipt to the buyer proof packet.";
  if (decision === "stop") return `Do not share the buyer packet externally; assign ${room.nextQuestion.owner} to close ${room.nextQuestion.label}.`;
  if (decision === "continue") return `Do not start the pilot yet; close ${room.nextQuestion.label} before continuing.`;
  return `Revise the packet around ${room.nextQuestion.label}, then rerun sponsor review.`;
}

function receiptConditions(room: SponsorReviewRoom, decision: SponsorDecisionChoice, conditionNote: string): SponsorDecisionCondition[] {
  const sourceQuestions = decision === "continue" ? room.questions : room.questions.filter((question) => question.status !== "clear");
  const questions = sourceQuestions.length ? sourceQuestions : [room.nextQuestion];
  return questions.map((question) => ({
    id: `condition-${question.id}`,
    label: question.label,
    status: question.status,
    owner: question.owner,
    evidence: question.evidence,
    requiredAction: conditionNote.trim() || question.nextAction
  }));
}

function buildReceiptMarkdown(receipt: Omit<SponsorDecisionReceipt, "exportMarkdown">, room: SponsorReviewRoom) {
  return [
    `# ${receipt.headline}`,
    "",
    "Sponsor Decision Receipt",
    "",
    `Decision: ${decisionLabel(receipt.decision)}`,
    `Status: ${receipt.status}`,
    `Signer: ${receipt.signerName}`,
    `Decided at: ${receipt.decidedAt}`,
    `Review room: ${room.id}`,
    `Review score: ${room.reviewScore}/100`,
    "",
    receipt.summary,
    "",
    `Next step: ${receipt.nextStep}`,
    "",
    "## Conditions",
    ...receipt.conditions.flatMap((condition) => [
      `- [${condition.status}] ${condition.label}`,
      `  - Owner: ${condition.owner}`,
      `  - Evidence: ${condition.evidence}`,
      `  - Required action: ${condition.requiredAction}`
    ]),
    "",
    "## Sponsor note",
    receipt.sponsorNote
  ].join("\n");
}

export function buildSponsorDecisionReceipt(room: SponsorReviewRoom, input: SponsorDecisionReceiptInput = {}): SponsorDecisionReceipt {
  const decision = input.decision ?? recommendedSponsorDecision(room);
  const status = receiptStatusFor(room, decision);
  const signerName = input.signerName?.trim() || room.nextQuestion.owner || "Buyer sponsor";
  const decidedAt = input.decidedAt?.trim() || new Date().toISOString().slice(0, 10);
  const sponsorNote = input.sponsorNote?.trim() || (status === "signed" ? "Approved with the sponsor review room attached." : room.nextQuestion.nextAction);
  const partial = {
    id: `sponsor-decision-${decision}-${status}-${room.reviewScore}`,
    status,
    decision,
    signerName,
    decidedAt,
    headline: receiptHeadline(decision, status),
    summary: receiptSummary(room, decision, status),
    nextStep: receiptNextStep(room, decision, status),
    sponsorNote,
    conditions: receiptConditions(room, decision, input.conditionNote ?? "")
  };

  return {
    ...partial,
    exportMarkdown: buildReceiptMarkdown(partial, room)
  };
}

function buildMarkdown(input: Omit<SponsorReviewRoom, "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    "Sponsor Review Room",
    "",
    `Readiness: ${input.readiness}`,
    `Review score: ${input.reviewScore}/100`,
    `Target buyer: ${input.targetBuyer}`,
    `Decision ask: ${input.decisionAsk}`,
    "",
    input.hardTruth,
    "",
    "## Sponsor questions",
    ...input.questions.flatMap((question) => [
      `- [${question.status}] ${question.label}: ${question.question}`,
      `  - Answer: ${question.answer}`,
      `  - Evidence: ${question.evidence}`,
      `  - Owner: ${question.owner}`,
      `  - Next: ${question.nextAction}`
    ]),
    "",
    "## Approval objection brief",
    ...input.objectionBriefs.flatMap((brief) => [
      `- [${brief.status}] ${brief.stakeholder}: ${brief.objection}`,
      `  - Answer: ${brief.answer}`,
      `  - Evidence: ${brief.evidence}`,
      `  - Meeting move: ${brief.meetingMove}`,
      `  - If challenged: ${brief.ifChallenged}`
    ]),
    "",
    "## Approval meeting agenda",
    ...input.approvalAgenda.map((item) => `- ${item.minutes}m [${item.status}] ${item.label} (${item.owner}): ${item.question}`)
  ].join("\n");
}

export function buildSponsorReviewRoom(input: {
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  proposal: PilotProposal;
  workflow: PilotWorkflowPlan;
  pilotReceipt: PilotRunReceipt;
  decisionMatrix: BuyerDecisionMatrix;
  agreement: PilotAgreement;
  ledger: PilotEvidenceLedger;
  diligence: BuyerDiligenceRoom;
  execution: PilotExecutionHandoff;
}): SponsorReviewRoom {
  const questions = buildQuestions(input);
  const readiness = readinessFrom(questions);
  const objectionBriefs = buildObjectionBriefs(input);
  const approvalAgenda = buildApprovalAgenda(objectionBriefs);
  const pressureTestScore = Math.round(clamp(average(objectionBriefs.map((brief) => statusScore(brief.status)))));
  const reviewScore = Math.round(
    clamp(
      average([
        input.valueBlueprint.boardScore,
        input.buyerScenario.scenarioScore,
        input.ledger.ledgerScore,
        input.diligence.diligenceScore,
        average(questions.map((question) => statusScore(question.status))),
        pressureTestScore
      ])
    )
  );
  const nextQuestion = questions.find((question) => question.status === "blocked") ?? questions.find((question) => question.status === "watch") ?? questions[0];
  const partial = {
    id: `sponsor-review-${readiness}-${reviewScore}`,
    readiness,
    reviewScore,
    pressureTestScore,
    approvalMeetingMode: meetingModeFrom(objectionBriefs),
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, questions),
    targetBuyer: input.valueBlueprint.primaryUser,
    decisionAsk: buildDecisionAsk(readiness, nextQuestion),
    questions,
    objectionBriefs,
    approvalAgenda,
    nextQuestion
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderSponsorReviewRoomHtml(
  room: SponsorReviewRoom,
  links: Partial<Record<SponsorReviewArtifactId | "proof-packet" | "trust-manifest" | "json" | "markdown" | "app", string>> = {},
  proofPacketReceipt?: BuyerProofPacketReceipt
) {
  const receipt = buildSponsorDecisionReceipt(room);
  const metrics = [
    { label: "Readiness", value: room.readiness, status: room.readiness },
    { label: "Review Score", value: room.reviewScore, status: room.readiness },
    { label: "Clear Answers", value: `${room.questions.filter((question) => question.status === "clear").length}/${room.questions.length}`, status: room.readiness },
    { label: "Packet Receipt", value: proofPacketReceipt?.digest ?? "not attached", status: proofPacketReceipt ? "approve-review" : "close-evidence" },
    { label: "Next Owner", value: room.nextQuestion.owner, status: room.nextQuestion.status }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const questions = room.questions
    .map((question) => {
      const href = links[question.artifactId];
      return `
        <article class="question ${tone(question.status)}">
          <div><strong>${escapeHtml(question.label)}</strong><span>${escapeHtml(question.status)}</span></div>
          <h3>${escapeHtml(question.question)}</h3>
          <p>${escapeHtml(question.answer)}</p>
          <small>${escapeHtml(question.evidence)}</small>
          <footer>
            <em>${escapeHtml(question.owner)}</em>
            ${href ? `<a href="${escapeHtml(href)}">${escapeHtml(question.artifactId)}</a>` : `<b>${escapeHtml(question.artifactId)}</b>`}
          </footer>
        </article>`;
    })
    .join("");
  const objections = room.objectionBriefs
    .map(
      (brief) => `
        <article class="question ${tone(brief.status)}">
          <div><strong>${escapeHtml(brief.stakeholder)}</strong><span>${escapeHtml(brief.status)}</span></div>
          <h3>${escapeHtml(brief.objection)}</h3>
          <p>${escapeHtml(brief.answer)}</p>
          <small>${escapeHtml(brief.evidence)}</small>
          <footer><em>${escapeHtml(brief.owner)}</em><b>${escapeHtml(brief.artifactId)}</b></footer>
        </article>`
    )
    .join("");
  const agenda = room.approvalAgenda
    .map(
      (item) => `
        <article class="agenda-item ${tone(item.status)}">
          <span>${escapeHtml(item.minutes)}m</span>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.question)}</p>
          <small>${escapeHtml(item.owner)} / ${escapeHtml(item.artifactId)}</small>
        </article>`
    )
    .join("");
  const linkList = [
    links["value-report"] ? `<a href="${escapeHtml(links["value-report"])}">Value report</a>` : "",
    links.ledger ? `<a href="${escapeHtml(links.ledger)}">Evidence ledger</a>` : "",
    links.decision ? `<a href="${escapeHtml(links.decision)}">Decision matrix</a>` : "",
    links.agreement ? `<a href="${escapeHtml(links.agreement)}">Agreement</a>` : "",
    links.diligence ? `<a href="${escapeHtml(links.diligence)}">Diligence</a>` : "",
    links.execution ? `<a href="${escapeHtml(links.execution)}">Execution</a>` : "",
    links["proof-packet"] ? `<a href="${escapeHtml(links["proof-packet"])}">Proof packet</a>` : "",
    links["trust-manifest"] ? `<a href="${escapeHtml(links["trust-manifest"])}">Trust manifest</a>` : "",
    links.json ? `<a href="${escapeHtml(links.json)}">JSON review</a>` : "",
    links.markdown ? `<a href="${escapeHtml(links.markdown)}">Markdown review</a>` : "",
    links.app ? `<a href="${escapeHtml(links.app)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const receiptConditions = receipt.conditions
    .map(
      (condition) => `
        <article class="question ${tone(condition.status)}">
          <div><strong>${escapeHtml(condition.label)}</strong><span>${escapeHtml(condition.status)}</span></div>
          <p>${escapeHtml(condition.requiredAction)}</p>
          <small>${escapeHtml(condition.evidence)}</small>
          <footer><em>${escapeHtml(condition.owner)}</em><b>${escapeHtml(condition.id)}</b></footer>
        </article>`
    )
    .join("");
  const proofPacketReceiptSection = proofPacketReceipt
    ? `
      <section class="panel receipt-panel">
        <h2>Proof packet receipt</h2>
        <p><strong>${escapeHtml(proofPacketReceipt.algorithm)} / ${escapeHtml(proofPacketReceipt.digest)}:</strong> ${escapeHtml(proofPacketReceipt.verification)}</p>
        <p>${escapeHtml(proofPacketReceipt.coveredArtifacts.join(", "))}</p>
      </section>`
    : `
      <section class="panel receipt-panel watch">
        <h2>Proof packet receipt</h2>
        <p><strong>Not attached:</strong> open the proof packet and attach its manifest receipt before recording the sponsor decision externally.</p>
      </section>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(room.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #52645f; --line: #cbd7d2; --paper: #f3f7f5; --panel: #fffdf7; --teal: #0f766e; --blue: #2457a6; --green-bg: #edf8f1; --amber-bg: #fff7dd; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 22px; }
      .eyebrow, .metric span, .question span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.2rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p, small { color: var(--muted); }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: end; }
      .stamp { min-height: 190px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #102226, #0f766e); text-align: center; }
      .stamp span { color: #d8fff5; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { padding: 0 18px; font-size: 1.6rem; line-height: 1; overflow-wrap: anywhere; }
      .stamp small { color: rgba(255, 253, 247, .72); font-weight: 850; overflow-wrap: anywhere; }
      .metrics, .questions { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 20px; }
      .questions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .panel, .question { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric, .panel, .question { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.25rem; line-height: 1.1; overflow-wrap: anywhere; }
      .question { display: grid; gap: 8px; border-left: 4px solid #add6bd; }
      .agenda { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
      .agenda-item { min-width: 0; display: grid; gap: 7px; padding: 12px; border: 1px solid #d5ded8; border-top: 4px solid #add6bd; border-radius: 8px; background: #f4fbf1; }
      .agenda-item.watch { border-top-color: #d29a00; background: #fff8e6; }
      .agenda-item.bad { border-top-color: #be123c; background: #fff1f2; }
      .agenda-item span { color: var(--teal); font-size: .74rem; font-weight: 950; text-transform: uppercase; }
      .agenda-item strong, .agenda-item p, .agenda-item small { overflow-wrap: anywhere; }
      .question div, .question footer { display: flex; align-items: start; justify-content: space-between; gap: 10px; }
      .question h3 { margin: 0; font-size: 1.1rem; line-height: 1.2; }
      .question em { color: var(--ink); font-style: normal; font-weight: 850; }
      .question a, .question b { border: 1px solid var(--line); border-radius: 999px; padding: 4px 8px; color: var(--teal); font-size: .78rem; font-weight: 850; text-decoration: none; background: #fffdf7; }
      .question strong, .question h3, .question p, .question small, .question footer { overflow-wrap: anywhere; }
      .receipt-panel p { overflow-wrap: anywhere; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      footer.page { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 900px) { .agenda { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 780px) { header, main, footer.page { width: min(100% - 24px, 620px); } .hero, .metrics, .questions, .agenda { grid-template-columns: 1fr; } .stamp { min-height: 132px; } .question div, .question footer { flex-direction: column; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Sponsor Review Room</span>
          <h1>${escapeHtml(room.headline)}</h1>
          <p>${escapeHtml(room.hardTruth)}</p>
          <nav>${linkList}</nav>
        </div>
        <div class="stamp">
          <span>Decision ask</span>
          <strong>${escapeHtml(room.decisionAsk)}</strong>
          <small>${escapeHtml(room.targetBuyer)}</small>
        </div>
      </div>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <section class="panel">
        <h2>Next question</h2>
        <p><strong>${escapeHtml(room.nextQuestion.label)}:</strong> ${escapeHtml(room.nextQuestion.nextAction)}</p>
      </section>
      <section class="panel">
        <h2>Decision receipt</h2>
        <p><strong>${escapeHtml(decisionLabel(receipt.decision))} / ${escapeHtml(receipt.status)}:</strong> ${escapeHtml(receipt.summary)}</p>
        <p>${escapeHtml(receipt.nextStep)}</p>
      </section>
      ${proofPacketReceiptSection}
      <section class="panel">
        <h2>Approval objection brief</h2>
        <p><strong>${escapeHtml(room.approvalMeetingMode)} / ${escapeHtml(room.pressureTestScore)}/100:</strong> The sponsor can pressure-test finance, security, procurement, delivery, and stop-rule objections before signing.</p>
      </section>
      <section class="agenda">${agenda}</section>
      <section class="questions">${objections}</section>
      <section class="questions">${receiptConditions}</section>
      <section class="panel">
        <h2>Sponsor questions</h2>
        <p>Each answer names the owner, evidence source, and artifact a sponsor can inspect before approval.</p>
      </section>
      <section class="questions">${questions}</section>
    </main>
    <footer class="page">Generated by A2A Agent Marketplace as a sponsor-facing review packet.</footer>
  </body>
</html>`;
}
