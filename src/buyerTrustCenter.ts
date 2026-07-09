import { summarizeAgentTrialEvidence, type AgentTrialEvidenceRecord } from "./agentTrialEvidence.js";
import type { AdoptionOperatingPlan } from "./adoptionOperatingPlan.js";
import type { BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import type { BuyerWorkOrderBrief, BuyerWorkOrderInput } from "./buyerWorkOrder.js";
import type { PilotAgreement, PilotAgreementTerm } from "./pilotAgreement.js";
import type { PilotEvidenceLedger } from "./pilotEvidenceLedger.js";
import type { PilotRunReceipt } from "./pilotRunReceipt.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";

export type BuyerTrustCenterReadiness = "trust-ready" | "needs-review" | "blocked";

export type BuyerTrustControl = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  owner: string;
  evidence: string;
  buyerQuestion: string;
  nextAction: string;
};

export type BuyerTrustBoundary = {
  id: string;
  from: string;
  to: string;
  dataHandled: string;
  guardrail: string;
  evidence: string;
};

export type BuyerTrustRisk = {
  id: string;
  label: string;
  severity: "watch" | "blocked";
  owner: string;
  mitigation: string;
};

export type BuyerTrustQuestion = {
  id: string;
  question: string;
  answer: string;
  evidence: string;
};

export type BuyerTrustDecisionMemoVerdict = "approve-bounded-pilot" | "hold-for-review" | "do-not-expand";

export type BuyerTrustDecisionMemoItem = {
  id: string;
  label: string;
  owner: string;
  evidence: string;
  nextAction: string;
  status: BuyerValueScenarioStatus;
};

export type BuyerTrustDecisionMemo = {
  id: string;
  verdict: BuyerTrustDecisionMemoVerdict;
  headline: string;
  sponsorAsk: string;
  committeeSummary: string;
  approvalChecks: BuyerTrustDecisionMemoItem[];
  evidenceRequests: BuyerTrustDecisionMemoItem[];
  redLines: string[];
  meetingAgenda: string[];
};

export type BuyerTrustCenter = {
  id: string;
  readiness: BuyerTrustCenterReadiness;
  trustScore: number;
  headline: string;
  hardTruth: string;
  buyer: string;
  dataBoundary: string;
  controls: BuyerTrustControl[];
  boundaries: BuyerTrustBoundary[];
  risks: BuyerTrustRisk[];
  questions: BuyerTrustQuestion[];
  commitments: string[];
  decisionMemo: BuyerTrustDecisionMemo;
  exportMarkdown: string;
};

export type BuildBuyerTrustCenterInput = {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  workOrder: BuyerWorkOrderBrief;
  workOrderInput: BuyerWorkOrderInput;
  pilotReceipt: PilotRunReceipt;
  agreement: PilotAgreement;
  ledger: PilotEvidenceLedger;
  adoptionPlan: AdoptionOperatingPlan;
  workspace: {
    targetUrl: string;
    protopediaUrl: string;
    videoUrl: string;
    agentTrialEvidence: AgentTrialEvidenceRecord[];
  };
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

function statusFrom(condition: boolean, watchCondition = false): BuyerValueScenarioStatus {
  if (condition) return "clear";
  if (watchCondition) return "watch";
  return "blocked";
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
  if (["trust-ready", "clear"].includes(status)) return "good";
  if (["blocked"].includes(status)) return "bad";
  return "watch";
}

function dataSecurityTerm(agreement: PilotAgreement): PilotAgreementTerm | undefined {
  return agreement.terms.find((term) => term.id === "data-security");
}

function publicProofCount(workspace: BuildBuyerTrustCenterInput["workspace"]) {
  return [workspace.targetUrl, workspace.protopediaUrl, workspace.videoUrl].filter(isBuyerFacingProofUrl).length;
}

function dataBoundaryLabel(input: BuyerWorkOrderInput) {
  if (input.dataSensitivity === "public") return "Public data only";
  if (input.dataSensitivity === "internal") return "Internal data allowed after reviewer confirmation";
  return "Restricted data blocked from pilot execution";
}

function buildControls(input: BuildBuyerTrustCenterInput): BuyerTrustControl[] {
  const trial = summarizeAgentTrialEvidence(input.workspace.agentTrialEvidence);
  const securityTerm = dataSecurityTerm(input.agreement);
  const publicUrls = publicProofCount(input.workspace);
  const hasSecurityOwner = input.recommendation.selected.some((agent) => ["security-sentinel", "cloud-run-sre"].includes(agent.id));
  const restricted = input.workOrderInput.dataSensitivity === "restricted";
  const internal = input.workOrderInput.dataSensitivity === "internal";
  return [
    {
      id: "data-boundary",
      label: "Data boundary",
      status: restricted ? "blocked" : internal ? statusFrom(securityTerm?.status === "clear", true) : "clear",
      owner: securityTerm?.owner ?? "Security reviewer",
      evidence:
        input.workOrderInput.dataSensitivity === "public"
          ? "The pilot can run with public or synthetic data only."
          : `${dataBoundaryLabel(input.workOrderInput)}; agreement term is ${securityTerm?.status ?? "missing"}.`,
      buyerQuestion: "Will this require private customer data?",
      nextAction: restricted ? "Move the first pilot to public or synthetic data before sharing." : "Keep the data boundary visible in the pilot agreement."
    },
    {
      id: "security-owner",
      label: "Security owner",
      status: statusFrom(hasSecurityOwner && securityTerm?.status === "clear", hasSecurityOwner || input.recommendation.after.governance >= 65),
      owner: securityTerm?.owner ?? input.recommendation.selected.find((agent) => agent.id === "security-sentinel")?.name ?? "Named security reviewer",
      evidence: `${input.recommendation.after.governance}/100 governance score; ${hasSecurityOwner ? "security-capable agent selected" : "security owner not selected"}.`,
      buyerQuestion: "Who signs the trust boundary?",
      nextAction: hasSecurityOwner ? "Use the named security owner in the sponsor review." : "Select Security Sentinel or Cloud Run SRE before buyer expansion."
    },
    {
      id: "public-product-proof",
      label: "Public product proof",
      status: statusFrom(publicUrls === 3, publicUrls > 0),
      owner: "Cloud Run SRE",
      evidence: `${publicUrls}/3 public URLs saved for runtime, ProtoPedia, and video proof.`,
      buyerQuestion: "Can an outside reviewer inspect the product?",
      nextAction: publicUrls === 3 ? "Keep public proof URLs attached to the launch room." : "Attach public runtime, ProtoPedia, and walkthrough video URLs."
    },
    {
      id: "agent-trial-proof",
      label: "Agent trial proof",
      status: statusFrom(trial.status === "ready", trial.status === "watch"),
      owner: "A2A Market Broker",
      evidence: trial.evidence,
      buyerQuestion: "Did the agent do real work or only appear in a demo?",
      nextAction: trial.status === "ready" ? "Use the accepted trial receipt as the agent proof." : "Verify and attach an accepted Agent Card trial response."
    },
    {
      id: "measured-run-proof",
      label: "Measured run proof",
      status: statusFrom(input.pilotReceipt.readiness === "accepted", input.pilotReceipt.readiness === "needs-evidence"),
      owner: input.pilotReceipt.reviewerName || "Pilot reviewer",
      evidence: `${input.pilotReceipt.actualMinutesSavedPerRun} minutes saved, ${input.pilotReceipt.acceptanceRatePercent}% accepted, evidence URL ${input.pilotReceipt.evidenceUrl ? "attached" : "missing"}.`,
      buyerQuestion: "What proof shows actual user value?",
      nextAction: input.pilotReceipt.readiness === "accepted" ? "Keep the receipt in the public packet." : "Rerun or attach measured evidence before trust approval."
    },
    {
      id: "audit-trail",
      label: "Evidence audit trail",
      status: statusFrom(input.ledger.readiness === "sponsor-ready", input.ledger.readiness === "needs-proof"),
      owner: "Sponsor owner",
      evidence: `${input.ledger.events.filter((event) => event.status === "clear").length}/${input.ledger.events.length} ledger events clear; ${input.ledger.exceptions.length} exceptions open.`,
      buyerQuestion: "Can we audit the decision later?",
      nextAction: input.ledger.readiness === "sponsor-ready" ? "Use the ledger as the review trail." : "Close ledger exceptions before external trust review."
    },
    {
      id: "stop-rules",
      label: "Stop and rollback rules",
      status: statusFrom(input.agreement.readiness === "ready-to-sign" && input.adoptionPlan.readiness === "ready-to-operate", input.agreement.readiness === "needs-redlines" || input.adoptionPlan.readiness === "needs-owner-commitment"),
      owner: input.agreement.signatures[0]?.name ?? input.valueBlueprint.primaryUser,
      evidence: `${input.agreement.stopRules.length} stop rules; adoption plan ${input.adoptionPlan.readiness}.`,
      buyerQuestion: "What happens if the pilot is unsafe or not valuable?",
      nextAction: "Keep expand, revise, and stop decisions tied to receipt evidence and sponsor review."
    }
  ];
}

function readinessFrom(controls: BuyerTrustControl[], score: number): BuyerTrustCenterReadiness {
  if (controls.some((control) => control.status === "blocked")) return "blocked";
  if (score >= 84 && controls.every((control) => control.status === "clear")) return "trust-ready";
  return "needs-review";
}

function headlineFor(readiness: BuyerTrustCenterReadiness) {
  if (readiness === "trust-ready") return "The buyer trust center is ready for external review";
  if (readiness === "needs-review") return "Trust center needs owner review before expansion";
  return "Trust center blocks external buyer rollout";
}

function hardTruthFor(readiness: BuyerTrustCenterReadiness, risks: BuyerTrustRisk[]) {
  if (readiness === "trust-ready") {
    return "A buyer can inspect the data boundary, security owner, public product proof, agent trial evidence, measured run proof, audit trail, and stop rules from one place.";
  }
  if (readiness === "needs-review") {
    return `${risks.length} trust item${risks.length === 1 ? "" : "s"} need owner confirmation before this can support expansion.`;
  }
  return `${risks.length} trust blocker${risks.length === 1 ? "" : "s"} would make this feel unsafe or unproven for a real buyer.`;
}

function buildBoundaries(input: BuildBuyerTrustCenterInput): BuyerTrustBoundary[] {
  return [
    {
      id: "buyer-to-workspace",
      from: "Buyer reviewer",
      to: "Launch room",
      dataHandled: dataBoundaryLabel(input.workOrderInput),
      guardrail: "The public launch room exposes claims and proof links, not private customer data.",
      evidence: input.workOrder.currentBaseline
    },
    {
      id: "workspace-to-agent",
      from: "A2A workspace",
      to: "Selected agent squad",
      dataHandled: "Brief, work order, acceptance criteria, and evidence URLs",
      guardrail: "Agent work is represented by auditable receipts and proof artifacts before expansion.",
      evidence: summarizeAgentTrialEvidence(input.workspace.agentTrialEvidence).evidence
    },
    {
      id: "pilot-to-sponsor",
      from: "Pilot run",
      to: "Sponsor review",
      dataHandled: "Measured minutes, task acceptance, reviewer notes, and proof URL",
      guardrail: "The sponsor decision uses a receipt, ledger, agreement, and explicit stop rules.",
      evidence: input.pilotReceipt.hardTruth
    },
    {
      id: "expansion-boundary",
      from: "First pilot",
      to: "Expanded adoption",
      dataHandled: "Operating metrics and owner commitments",
      guardrail: "Expansion waits for the adoption operating plan and trust controls to clear.",
      evidence: input.adoptionPlan.hardTruth
    }
  ];
}

function buildRisks(controls: BuyerTrustControl[]): BuyerTrustRisk[] {
  const open = controls.filter((control) => control.status !== "clear");
  if (open.length === 0) {
    return [
      {
        id: "risk-expansion-discipline",
        label: "Expansion discipline",
        severity: "watch",
        owner: "Buyer sponsor",
        mitigation: "Expand only one workflow at a time and keep the same receipt, ledger, and stop-rule discipline."
      }
    ];
  }

  return open.map((control) => ({
    id: `risk-${control.id}`,
    label: control.label,
    severity: control.status === "blocked" ? ("blocked" as const) : ("watch" as const),
    owner: control.owner,
    mitigation: control.nextAction
  }));
}

function buildQuestions(input: BuildBuyerTrustCenterInput, controls: BuyerTrustControl[]): BuyerTrustQuestion[] {
  const lookup = new Map(controls.map((control) => [control.id, control]));
  return [
    {
      id: "private-data",
      question: "Does the first pilot need private customer data?",
      answer: input.workOrderInput.dataSensitivity === "public" ? "No. The first pilot can run on public or synthetic evidence." : `${dataBoundaryLabel(input.workOrderInput)}. Expansion waits for the named security reviewer.`,
      evidence: lookup.get("data-boundary")?.evidence ?? input.workOrder.hardTruth
    },
    {
      id: "agent-proof",
      question: "How do we know the agent did real work?",
      answer: "Use accepted A2A trial evidence, measured pilot receipts, and the evidence ledger instead of relying on a visual demo.",
      evidence: `${lookup.get("agent-trial-proof")?.evidence ?? ""} ${lookup.get("measured-run-proof")?.evidence ?? ""}`.trim()
    },
    {
      id: "failure-mode",
      question: "What happens if value or safety drops?",
      answer: "The pilot agreement and adoption operating plan define stop rules before expansion spend is approved.",
      evidence: input.agreement.stopRules.join(" ")
    },
    {
      id: "public-inspection",
      question: "Can a buyer inspect the product without internal access?",
      answer: "The launch room links public product proof, buyer proof packet, receipt, ledger, adoption plan, and trust center artifacts.",
      evidence: lookup.get("public-product-proof")?.evidence ?? ""
    }
  ];
}

function buildCommitments(input: BuildBuyerTrustCenterInput) {
  return [
    `${input.agreement.signatures[0]?.name ?? input.valueBlueprint.primaryUser} owns the expand, revise, or stop decision.`,
    `${dataSecurityTerm(input.agreement)?.owner ?? "Security reviewer"} owns the data boundary before private or restricted data is introduced.`,
    `${input.recommendation.selected[0]?.name ?? "A2A Market Broker"} owns agent proof and receipt attachment.`,
    `${input.valueBlueprint.proofContract.owner} owns public proof freshness in the launch room.`
  ];
}

function verdictFor(readiness: BuyerTrustCenterReadiness): BuyerTrustDecisionMemoVerdict {
  if (readiness === "trust-ready") return "approve-bounded-pilot";
  if (readiness === "needs-review") return "hold-for-review";
  return "do-not-expand";
}

function memoHeadlineFor(verdict: BuyerTrustDecisionMemoVerdict) {
  if (verdict === "approve-bounded-pilot") return "Approve a bounded buyer pilot with receipt-backed controls";
  if (verdict === "hold-for-review") return "Hold expansion until trust owners close the review items";
  return "Do not expand until blocked proof gaps are rebuilt";
}

function sponsorAskForMemo(verdict: BuyerTrustDecisionMemoVerdict) {
  if (verdict === "approve-bounded-pilot") {
    return "Approve the next buyer pilot only inside the current data boundary, with the receipt, ledger, and stop rules attached.";
  }
  if (verdict === "hold-for-review") {
    return "Approve owner review time, not expansion spend, until the evidence requests below are closed.";
  }
  return "Do not approve external rollout. Assign owners to rebuild the blocked controls before the next buyer review.";
}

function memoItemFromControl(control: BuyerTrustControl): BuyerTrustDecisionMemoItem {
  return {
    id: `memo-${control.id}`,
    label: control.label,
    owner: control.owner,
    evidence: control.evidence,
    nextAction: control.nextAction,
    status: control.status
  };
}

function buildEvidenceRequests(controls: BuyerTrustControl[]): BuyerTrustDecisionMemoItem[] {
  const openControls = controls.filter((control) => control.status !== "clear");
  if (openControls.length > 0) return openControls.map(memoItemFromControl);

  return controls
    .filter((control) => ["measured-run-proof", "audit-trail", "stop-rules"].includes(control.id))
    .map((control) => ({
      ...memoItemFromControl(control),
      id: `memo-maintain-${control.id}`,
      nextAction: `Attach this proof to the approval record: ${control.nextAction}`
    }));
}

function buildRedLines(input: BuildBuyerTrustCenterInput, risks: BuyerTrustRisk[]) {
  const redLines = [
    "Do not add private or restricted data without rerunning the trust center and naming the security reviewer.",
    "Do not expand beyond one buyer workflow unless the receipt, ledger, and stop rules remain attached to the approval record."
  ];
  const blockedRisks = risks.filter((risk) => risk.severity === "blocked");
  if (blockedRisks.length > 0) {
    redLines.push(...blockedRisks.map((risk) => `Do not approve while ${risk.label.toLowerCase()} is blocked: ${risk.mitigation}`));
  }
  if (input.workOrderInput.dataSensitivity === "restricted") {
    redLines.push("Restricted data is outside the first pilot boundary until the work order is rewritten for public or synthetic evidence.");
  }
  return redLines;
}

function buildMeetingAgenda(memo: Pick<BuyerTrustDecisionMemo, "verdict" | "evidenceRequests">, controls: BuyerTrustControl[]) {
  const dataOwner = controls.find((control) => control.id === "data-boundary")?.owner ?? "Security reviewer";
  const receiptOwner = controls.find((control) => control.id === "measured-run-proof")?.owner ?? "Pilot reviewer";
  const openCount = memo.evidenceRequests.filter((item) => item.status !== "clear").length;
  return [
    `Confirm the data boundary and named owner: ${dataOwner}.`,
    `Review the measured receipt, audit ledger, and stop rules with ${receiptOwner}.`,
    openCount > 0 ? `Assign owners and dates for ${openCount} evidence request${openCount === 1 ? "" : "s"}.` : "Record the three maintained proof attachments in the approval notes.",
    memo.verdict === "approve-bounded-pilot" ? "Approve, revise, or stop the next bounded buyer pilot." : "Decide whether the next meeting is a proof rebuild review or a bounded pilot approval."
  ];
}

function buildDecisionMemo(input: BuildBuyerTrustCenterInput, readiness: BuyerTrustCenterReadiness, trustScore: number, controls: BuyerTrustControl[], risks: BuyerTrustRisk[]): BuyerTrustDecisionMemo {
  const verdict = verdictFor(readiness);
  const evidenceRequests = buildEvidenceRequests(controls);
  const approvalChecks = controls.map(memoItemFromControl);
  const blockedRiskCount = risks.filter((risk) => risk.severity === "blocked").length;
  const clearControls = controls.filter((control) => control.status === "clear").length;
  const partial = {
    id: `buyer-trust-decision-${verdict}-${trustScore}`,
    verdict,
    headline: memoHeadlineFor(verdict),
    sponsorAsk: sponsorAskForMemo(verdict),
    committeeSummary: `${clearControls}/${controls.length} trust controls are clear, trust score is ${trustScore}/100, and ${blockedRiskCount} blocked risk${blockedRiskCount === 1 ? "" : "s"} remain for ${input.valueBlueprint.primaryUser}.`,
    approvalChecks,
    evidenceRequests,
    redLines: buildRedLines(input, risks)
  };
  return {
    ...partial,
    meetingAgenda: buildMeetingAgenda(partial, controls)
  };
}

function buildMarkdown(input: Omit<BuyerTrustCenter, "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    "Buyer Trust Center",
    "",
    `Readiness: ${input.readiness}`,
    `Trust score: ${input.trustScore}/100`,
    `Buyer: ${input.buyer}`,
    `Data boundary: ${input.dataBoundary}`,
    "",
    input.hardTruth,
    "",
    "## Trust controls",
    ...input.controls.map((control) => `- [${control.status}] ${control.label} (${control.owner}): ${control.evidence} Next: ${control.nextAction}`),
    "",
    "## Trust boundaries",
    ...input.boundaries.map((boundary) => `- ${boundary.from} -> ${boundary.to}: ${boundary.guardrail} Evidence: ${boundary.evidence}`),
    "",
    "## Buyer questions",
    ...input.questions.map((question) => `- ${question.question} ${question.answer} Evidence: ${question.evidence}`),
    "",
    "## Procurement decision memo",
    "",
    `Verdict: ${input.decisionMemo.verdict}`,
    `Sponsor ask: ${input.decisionMemo.sponsorAsk}`,
    "",
    input.decisionMemo.committeeSummary,
    "",
    "### Evidence requests",
    ...input.decisionMemo.evidenceRequests.map((request) => `- [${request.status}] ${request.label} (${request.owner}): ${request.nextAction} Evidence: ${request.evidence}`),
    "",
    "### Red lines",
    ...input.decisionMemo.redLines.map((redLine) => `- ${redLine}`),
    "",
    "### Meeting agenda",
    ...input.decisionMemo.meetingAgenda.map((item) => `- ${item}`),
    "",
    "## Risks",
    ...input.risks.map((risk) => `- [${risk.severity}] ${risk.label} (${risk.owner}): ${risk.mitigation}`),
    "",
    "## Commitments",
    ...input.commitments.map((commitment) => `- ${commitment}`)
  ].join("\n");
}

export function buildBuyerTrustCenter(input: BuildBuyerTrustCenterInput): BuyerTrustCenter {
  const controls = buildControls(input);
  const trustScore = Math.round(
    clamp(
      average([
        input.agreement.agreementScore,
        input.ledger.ledgerScore,
        input.adoptionPlan.planScore,
        input.workOrder.workOrderScore,
        input.pilotReceipt.receiptScore,
        average(controls.map((control) => statusScore(control.status)))
      ])
    )
  );
  const readiness = readinessFrom(controls, trustScore);
  const risks = buildRisks(controls);
  const decisionMemo = buildDecisionMemo(input, readiness, trustScore, controls, risks);
  const partial = {
    id: `buyer-trust-center-${readiness}-${trustScore}`,
    readiness,
    trustScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, risks),
    buyer: input.valueBlueprint.primaryUser,
    dataBoundary: dataBoundaryLabel(input.workOrderInput),
    controls,
    boundaries: buildBoundaries(input),
    risks,
    questions: buildQuestions(input, controls),
    commitments: buildCommitments(input),
    decisionMemo
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderBuyerTrustCenterHtml(
  center: BuyerTrustCenter,
  links: {
    launchRoomUrl?: string;
    proofPacketUrl?: string;
    agreementUrl?: string;
    ledgerUrl?: string;
    adoptionPlanUrl?: string;
    manifestUrl?: string;
    jsonUrl?: string;
    markdownUrl?: string;
    appUrl?: string;
  } = {}
) {
  const linkList = [
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.proofPacketUrl ? `<a href="${escapeHtml(links.proofPacketUrl)}">Proof packet</a>` : "",
    links.agreementUrl ? `<a href="${escapeHtml(links.agreementUrl)}">Agreement</a>` : "",
    links.ledgerUrl ? `<a href="${escapeHtml(links.ledgerUrl)}">Evidence ledger</a>` : "",
    links.adoptionPlanUrl ? `<a href="${escapeHtml(links.adoptionPlanUrl)}">Adoption plan</a>` : "",
    links.manifestUrl ? `<a href="${escapeHtml(links.manifestUrl)}">Trust manifest</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON trust center</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown trust center</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const controls = center.controls
    .map(
      (control) => `
        <article class="control ${tone(control.status)}">
          <span>${escapeHtml(control.status)}</span>
          <strong>${escapeHtml(control.label)}</strong>
          <p>${escapeHtml(control.evidence)}</p>
          <small>${escapeHtml(control.owner)} - ${escapeHtml(control.nextAction)}</small>
        </article>`
    )
    .join("");
  const boundaries = center.boundaries
    .map(
      (boundary) => `
        <article class="boundary">
          <span>${escapeHtml(boundary.from)} -> ${escapeHtml(boundary.to)}</span>
          <strong>${escapeHtml(boundary.guardrail)}</strong>
          <p>${escapeHtml(boundary.dataHandled)}</p>
          <small>${escapeHtml(boundary.evidence)}</small>
        </article>`
    )
    .join("");
  const questions = center.questions
    .map(
      (question) => `
        <article class="question">
          <strong>${escapeHtml(question.question)}</strong>
          <p>${escapeHtml(question.answer)}</p>
          <small>${escapeHtml(question.evidence)}</small>
        </article>`
    )
    .join("");
  const risks = center.risks
    .map(
      (risk) => `
        <article class="risk ${tone(risk.severity)}">
          <div><strong>${escapeHtml(risk.label)}</strong><span>${escapeHtml(risk.severity)}</span></div>
          <p>${escapeHtml(risk.mitigation)}</p>
          <small>${escapeHtml(risk.owner)}</small>
        </article>`
    )
    .join("");
  const commitments = center.commitments.map((commitment) => `<li>${escapeHtml(commitment)}</li>`).join("");
  const approvalChecks = center.decisionMemo.approvalChecks
    .map(
      (item) => `
        <article class="memo-item ${tone(item.status)}">
          <div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.status)}</span></div>
          <p>${escapeHtml(item.evidence)}</p>
          <small>${escapeHtml(item.owner)} - ${escapeHtml(item.nextAction)}</small>
        </article>`
    )
    .join("");
  const evidenceRequests = center.decisionMemo.evidenceRequests
    .map(
      (item) => `
        <article class="memo-item ${tone(item.status)}">
          <div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.status)}</span></div>
          <p>${escapeHtml(item.nextAction)}</p>
          <small>${escapeHtml(item.owner)} - ${escapeHtml(item.evidence)}</small>
        </article>`
    )
    .join("");
  const redLines = center.decisionMemo.redLines.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const meetingAgenda = center.decisionMemo.meetingAgenda.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(center.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #16211f; --muted: #52645f; --line: #cad7d1; --paper: #f4f7f3; --panel: #fffdf7; --teal: #0f766e; --blue: #285b9f; --green-bg: #ebf8ef; --amber-bg: #fff7dc; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 20px; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: end; }
      .eyebrow, .control span, .boundary span, .risk span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.25rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p, small, li { color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      .stamp { min-height: 200px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #16211f, #0f766e); text-align: center; }
      .stamp span { color: #d8fff5; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { font-size: 4rem; line-height: .9; }
      .stamp small { max-width: 240px; color: rgba(255, 253, 247, .76); font-weight: 850; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .controls, .boundary-grid, .lower, .questions, .risks { display: grid; gap: 10px; }
      .controls { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .boundary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .lower { grid-template-columns: minmax(0, .8fr) minmax(320px, .5fr); align-items: start; }
      .memo { display: grid; gap: 12px; border-color: #17211f; background: linear-gradient(145deg, #fffdf7, #edf8f1); }
      .memo-head { display: grid; grid-template-columns: minmax(0, .7fr) minmax(240px, .3fr); gap: 14px; align-items: start; }
      .memo-verdict { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; color: var(--teal); background: var(--panel); font-weight: 950; text-align: center; }
      .memo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .memo-list { display: grid; gap: 8px; padding: 0; margin: 0; list-style: none; }
      .panel, .control, .boundary, .question, .risk, .memo-item, li { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(22, 33, 31, .07); }
      .panel, .control, .boundary, .question, .risk, .memo-item, li { padding: 14px; }
      .control, .boundary, .question, .risk, .memo-item { display: grid; gap: 7px; }
      .risk div, .memo-item div { display: flex; align-items: start; justify-content: space-between; gap: 10px; }
      ul { display: grid; gap: 9px; padding: 0; margin: 0; list-style: none; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      .control strong, .boundary strong, .question strong, .risk strong, .memo-item strong, p, small, li { overflow-wrap: anywhere; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 860px) { header, main, footer { width: min(100% - 24px, 640px); } .hero, .controls, .boundary-grid, .lower, .memo-head, .memo-grid { grid-template-columns: 1fr; } .stamp { min-height: 132px; } .stamp strong { font-size: 3rem; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Buyer Trust Center</span>
          <h1>${escapeHtml(center.headline)}</h1>
          <p>${escapeHtml(center.hardTruth)}</p>
          <nav>${linkList}</nav>
        </div>
        <aside class="stamp">
          <span>Trust score</span>
          <strong>${escapeHtml(center.trustScore)}</strong>
          <small>${escapeHtml(center.readiness)}</small>
        </aside>
      </div>
    </header>
    <main>
      <section class="panel">
        <h2>Data boundary</h2>
        <p><strong>${escapeHtml(center.dataBoundary)}</strong></p>
        <p>${escapeHtml(center.buyer)}</p>
      </section>
      <section class="panel">
        <h2>Trust controls</h2>
        <div class="controls" aria-label="Trust controls">${controls}</div>
      </section>
      <section class="panel">
        <h2>Trust boundaries</h2>
        <div class="boundary-grid">${boundaries}</div>
      </section>
      <section class="panel memo">
        <div class="memo-head">
          <div>
            <h2>Procurement decision memo</h2>
            <h3>${escapeHtml(center.decisionMemo.headline)}</h3>
            <p>${escapeHtml(center.decisionMemo.sponsorAsk)}</p>
            <p>${escapeHtml(center.decisionMemo.committeeSummary)}</p>
          </div>
          <strong class="memo-verdict">${escapeHtml(center.decisionMemo.verdict)}</strong>
        </div>
        <div class="memo-grid">
          <article>
            <h2>Approval checks</h2>
            <div class="questions">${approvalChecks}</div>
          </article>
          <article>
            <h2>Evidence requests</h2>
            <div class="questions">${evidenceRequests}</div>
          </article>
          <article>
            <h2>Red lines</h2>
            <ul class="memo-list">${redLines}</ul>
          </article>
          <article>
            <h2>Meeting agenda</h2>
            <ul class="memo-list">${meetingAgenda}</ul>
          </article>
        </div>
      </section>
      <section class="lower">
        <article class="panel">
          <h2>Buyer questions</h2>
          <div class="questions">${questions}</div>
        </article>
        <aside class="panel">
          <h2>Risks</h2>
          <div class="risks">${risks}</div>
          <h2>Commitments</h2>
          <ul>${commitments}</ul>
        </aside>
      </section>
    </main>
    <footer>Generated by A2A Agent Marketplace as a buyer-facing trust artifact.</footer>
  </body>
</html>`;
}
