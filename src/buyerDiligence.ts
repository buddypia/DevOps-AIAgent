import type { BuyerValueScenario } from "./buyerValueScenario.js";
import type { PilotExecutionHandoff, PilotExecutionStatus } from "./pilotExecution.js";
import type { PilotProposal, PilotProofStatus } from "./pilotProposal.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";

export type BuyerDiligenceReadiness = "approval-ready" | "needs-evidence" | "blocked";
export type BuyerDiligenceStatus = "clear" | "watch" | "blocked";

export type BuyerDiligenceQuestion = {
  id: string;
  label: string;
  status: BuyerDiligenceStatus;
  owner: string;
  question: string;
  evidence: string;
};

export type BuyerDiligenceEvidence = {
  id: string;
  label: string;
  status: BuyerDiligenceStatus;
  owner: string;
  source: string;
  evidence: string;
  proofUrl: string;
};

export type BuyerDiligenceRisk = {
  id: string;
  label: string;
  status: BuyerDiligenceStatus;
  owner: string;
  risk: string;
  mitigation: string;
};

export type BuyerDiligenceCommercialTerm = {
  id: string;
  label: string;
  value: string;
  status: BuyerDiligenceStatus;
  evidence: string;
};

export type BuyerDiligenceReviewStep = {
  id: string;
  owner: string;
  window: string;
  decision: string;
  acceptance: string;
};

export type BuyerDiligenceRoom = {
  id: string;
  readiness: BuyerDiligenceReadiness;
  diligenceScore: number;
  headline: string;
  hardTruth: string;
  buyerQuestion: string;
  approvalQuestions: BuyerDiligenceQuestion[];
  evidenceLedger: BuyerDiligenceEvidence[];
  riskRegister: BuyerDiligenceRisk[];
  commercialTerms: BuyerDiligenceCommercialTerm[];
  reviewPath: BuyerDiligenceReviewStep[];
  exportMarkdown: string;
  a2aPayload: Record<string, unknown>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeBaseUrl(value: string | undefined) {
  return (value || "").replace(/\/$/, "");
}

function url(baseUrl: string | undefined, path: string) {
  const base = normalizeBaseUrl(baseUrl);
  return base ? `${base}${path}` : path;
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function statusScore(status: BuyerDiligenceStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 68;
  return 20;
}

function proofStatus(status: PilotProofStatus): BuyerDiligenceStatus {
  if (status === "ready") return "clear";
  if (status === "watch") return "watch";
  return "blocked";
}

function executionStatus(status: PilotExecutionStatus): BuyerDiligenceStatus {
  if (status === "ready") return "clear";
  if (status === "watch") return "watch";
  return "blocked";
}

function governanceStatus(score: number): BuyerDiligenceStatus {
  if (score >= 76) return "clear";
  if (score >= 60) return "watch";
  return "blocked";
}

function adoptionStatus(percent: number): BuyerDiligenceStatus {
  if (percent >= 68) return "clear";
  if (percent >= 45) return "watch";
  return "blocked";
}

function scenarioStatus(scenario: BuyerValueScenario): BuyerDiligenceStatus {
  if (scenario.readiness === "scales-now") return "clear";
  if (scenario.readiness === "pilot-first") return "watch";
  return "blocked";
}

function readinessFrom(input: {
  proposal: PilotProposal;
  handoff: PilotExecutionHandoff;
  scenario: BuyerValueScenario;
  questions: BuyerDiligenceQuestion[];
  risks: BuyerDiligenceRisk[];
  evidence: BuyerDiligenceEvidence[];
}): BuyerDiligenceReadiness {
  if (input.proposal.readiness === "draft" || input.handoff.readiness === "blocked" || input.scenario.readiness === "not-yet") {
    return "blocked";
  }
  if ([...input.questions, ...input.risks, ...input.evidence].some((item) => item.status === "blocked")) return "needs-evidence";
  if (input.handoff.readiness === "ready-to-start" && input.proposal.readiness === "buyer-ready") return "approval-ready";
  return "needs-evidence";
}

function headlineFor(readiness: BuyerDiligenceReadiness) {
  if (readiness === "approval-ready") return "Buyer diligence room is ready for approval";
  if (readiness === "needs-evidence") return "Buyer diligence room needs evidence before approval";
  return "Buyer diligence room should stay blocked";
}

function hardTruthFor(readiness: BuyerDiligenceReadiness) {
  if (readiness === "approval-ready") {
    return "The pilot can be reviewed by a buyer sponsor because economics, proof gates, risks, and owners are visible in one place.";
  }
  if (readiness === "needs-evidence") {
    return "The pilot may still be valuable, but a buyer sponsor should not approve it until the blocked evidence items are closed.";
  }
  return "The buyer case is not yet strong enough for approval. Fix economics or execution proof before asking a sponsor to decide.";
}

function proofUrlFor(id: string, baseUrl?: string) {
  if (id === "runtime") return url(baseUrl, "/buyer-proposal");
  if (id === "submission") return url(baseUrl, "/buyer-proposal.md");
  if (id === "a2a-trial") return url(baseUrl, "/buyer-proposal#a2a-trial");
  if (id === "economics") return url(baseUrl, "/api/buyer-proposal");
  return url(baseUrl, "/pilot-execution");
}

function buildEvidenceLedger(input: { proposal: PilotProposal; handoff: PilotExecutionHandoff; baseUrl?: string }): BuyerDiligenceEvidence[] {
  const proposalEvidence = input.proposal.proofs.map((proof) => ({
    id: `proposal-${proof.id}`,
    label: proof.label,
    status: proofStatus(proof.status),
    owner: input.handoff.gates.find((gate) => gate.id === proof.id)?.owner ?? "Buyer sponsor",
    source: "Buyer proposal",
    evidence: proof.evidence,
    proofUrl: proofUrlFor(proof.id, input.baseUrl)
  }));
  const executionEvidence = input.handoff.gates.map((gate) => ({
    id: `execution-${gate.id}`,
    label: `${gate.label} owner`,
    status: executionStatus(gate.status),
    owner: gate.owner,
    source: "Pilot execution handoff",
    evidence: gate.evidence,
    proofUrl: url(input.baseUrl, "/pilot-execution")
  }));
  return [...proposalEvidence, ...executionEvidence].slice(0, 8);
}

function buildApprovalQuestions(input: {
  proposal: PilotProposal;
  handoff: PilotExecutionHandoff;
  scenario: BuyerValueScenario;
  recommendation: Recommendation;
}): BuyerDiligenceQuestion[] {
  const runtimeProof = input.proposal.proofs.find((proof) => proof.id === "runtime");
  const submissionProof = input.proposal.proofs.find((proof) => proof.id === "submission");
  const trialProof = input.proposal.proofs.find((proof) => proof.id === "a2a-trial");
  const stopRule = input.handoff.decisions.find((decision) => decision.id === "stop");
  const governance = governanceStatus(input.recommendation.after.governance);

  return [
    {
      id: "inspectable-product",
      label: "Inspectable product",
      status: runtimeProof ? proofStatus(runtimeProof.status) : "blocked",
      owner: "Cloud Run SRE",
      question: "Can the buyer inspect the running product without asking the team for a private demo?",
      evidence: runtimeProof?.evidence ?? "Runtime proof is missing."
    },
    {
      id: "commercial-fit",
      label: "Commercial fit",
      status: scenarioStatus(input.scenario),
      owner: "A2A Market Broker",
      question: "Does the first pilot stay inside a payback and budget boundary the buyer can defend?",
      evidence: `${yen(input.scenario.monthlyGrossValueYen)} monthly value, ${input.scenario.paybackDays}-day payback, ceiling ${yen(input.scenario.pilotBudgetCeilingYen)}.`
    },
    {
      id: "agent-proof",
      label: "Agent proof",
      status: trialProof ? proofStatus(trialProof.status) : "blocked",
      owner: "A2A Market Broker",
      question: "Did a delegated agent complete a bounded A2A proof task before the sponsor review?",
      evidence: trialProof?.evidence ?? "Accepted A2A trial proof is missing."
    },
    {
      id: "launch-credibility",
      label: "Launch credibility",
      status: submissionProof ? proofStatus(submissionProof.status) : "blocked",
      owner: "Submission lead",
      question: "Can an external reviewer verify the story, video, and public receipt?",
      evidence: submissionProof?.evidence ?? "Submission proof is missing."
    },
    {
      id: "data-boundary",
      label: "Data boundary",
      status: governance,
      owner: input.recommendation.selected.find((agent) => agent.id === "security-sentinel")?.name ?? "Security reviewer",
      question: "Is the pilot bounded so private customer data is not required before security terms are accepted?",
      evidence: `${input.recommendation.after.governance}/100 governance score and proposal exclusions define the boundary.`
    },
    {
      id: "stop-rule",
      label: "Stop rule",
      status: stopRule ? "clear" : "blocked",
      owner: "Buyer sponsor",
      question: "Can the sponsor stop the pilot without debate if proof or economics fail?",
      evidence: stopRule?.rule ?? "Stop rule is missing."
    }
  ];
}

function buildRisks(input: {
  proposal: PilotProposal;
  handoff: PilotExecutionHandoff;
  scenario: BuyerValueScenario;
  recommendation: Recommendation;
}): BuyerDiligenceRisk[] {
  const runtime = input.proposal.proofs.find((proof) => proof.id === "runtime");
  const submission = input.proposal.proofs.find((proof) => proof.id === "submission");
  const trial = input.proposal.proofs.find((proof) => proof.id === "a2a-trial");
  const publicProofStatus = runtime?.status === "ready" && submission?.status === "ready" ? "clear" : runtime?.status === "missing" || submission?.status === "missing" ? "blocked" : "watch";
  const agentProofStatus = trial ? proofStatus(trial.status) : "blocked";
  const execution = input.handoff.readiness === "ready-to-start" ? "clear" : input.handoff.readiness === "needs-proof" ? "watch" : "blocked";

  return [
    {
      id: "public-proof",
      label: "Public proof",
      status: publicProofStatus,
      owner: "Cloud Run SRE",
      risk: "The buyer cannot independently verify the product or story.",
      mitigation: "Attach the deployed URL, ProtoPedia URL, and walkthrough video before approval."
    },
    {
      id: "economics",
      label: "Economics",
      status: scenarioStatus(input.scenario),
      owner: "A2A Market Broker",
      risk: "Savings assumptions do not justify the first pilot budget.",
      mitigation: "Narrow the workflow until payback and adoption assumptions are credible."
    },
    {
      id: "agent-proof",
      label: "Agent proof",
      status: agentProofStatus,
      owner: "A2A Market Broker",
      risk: "The AI agent value is asserted but not proven by a bounded delegated task.",
      mitigation: "Attach an accepted A2A trial receipt with score, source, and public artifact before approval."
    },
    {
      id: "data-boundary",
      label: "Data boundary",
      status: governanceStatus(input.recommendation.after.governance),
      owner: "Security reviewer",
      risk: "The pilot drifts into private-data handling before approval terms are explicit.",
      mitigation: "Keep private customer data out of scope until the buyer accepts retention and access terms."
    },
    {
      id: "adoption",
      label: "Adoption",
      status: adoptionStatus(input.scenario.assumptions.adoptionRatePercent),
      owner: "UX Guildmaster",
      risk: "The workflow saves time on paper but fails to become a repeated team behavior.",
      mitigation: "Run the first user through the workflow and remove the highest-friction step."
    },
    {
      id: "execution",
      label: "Execution ownership",
      status: execution,
      owner: "Pilot owner",
      risk: "The team agrees to the pilot but no one owns the proof gates.",
      mitigation: "Use the execution handoff work orders and assign every gate before kickoff."
    }
  ];
}

function buildCommercialTerms(input: { scenario: BuyerValueScenario; proposal: PilotProposal }): BuyerDiligenceCommercialTerm[] {
  const status = scenarioStatus(input.scenario);
  return [
    {
      id: "monthly-value",
      label: "Monthly value",
      value: yen(input.scenario.monthlyGrossValueYen),
      status,
      evidence: `${input.scenario.monthlyHoursSaved} hours saved plus risk reduction.`
    },
    {
      id: "payback",
      label: "Payback target",
      value: `${input.scenario.paybackDays} days`,
      status,
      evidence: "Calculated from pilot investment and monthly gross value."
    },
    {
      id: "budget-ceiling",
      label: "Pilot ceiling",
      value: yen(input.scenario.pilotBudgetCeilingYen),
      status,
      evidence: input.proposal.commercialGuardrail
    },
    {
      id: "pilot-users",
      label: "Pilot users",
      value: `${input.scenario.assumptions.teamSize} people`,
      status: adoptionStatus(input.scenario.assumptions.adoptionRatePercent),
      evidence: `${input.scenario.assumptions.adoptionRatePercent}% adoption assumption.`
    }
  ];
}

function buildReviewPath(input: { proposal: PilotProposal; handoff: PilotExecutionHandoff }): BuyerDiligenceReviewStep[] {
  return [
    {
      id: "sponsor",
      owner: "Buyer sponsor",
      window: "Before kickoff",
      decision: "Approve the single workflow and budget ceiling.",
      acceptance: input.proposal.commercialGuardrail
    },
    {
      id: "security",
      owner: "Security reviewer",
      window: "Before data access",
      decision: "Accept the pilot data boundary and exclusions.",
      acceptance: input.proposal.exclusions.find((item) => item.includes("private customer data")) ?? input.proposal.exclusions[0]
    },
    {
      id: "platform",
      owner: input.handoff.workOrders[0]?.owner ?? "Platform owner",
      window: "Day 0",
      decision: "Assign owners to every proof gate.",
      acceptance: input.handoff.workOrders[0]?.acceptance ?? "First proof gate has an accountable owner."
    },
    {
      id: "finance",
      owner: "Finance reviewer",
      window: "Week 2",
      decision: "Continue, revise, or stop from evidence.",
      acceptance: input.handoff.decisions.map((decision) => decision.label).join(" / ")
    }
  ];
}

function buildMarkdown(input: Omit<BuyerDiligenceRoom, "exportMarkdown" | "a2aPayload">) {
  return [
    `# ${input.headline}`,
    "",
    "Buyer Due Diligence Room",
    "",
    `Readiness: ${input.readiness}`,
    `Diligence score: ${input.diligenceScore}/100`,
    "",
    input.hardTruth,
    "",
    "## Buyer approval question",
    input.buyerQuestion,
    "",
    "## Approval questions",
    ...input.approvalQuestions.map((question) => `- [${question.status}] ${question.owner}: ${question.question} Evidence: ${question.evidence}`),
    "",
    "## Evidence ledger",
    ...input.evidenceLedger.map((item) => `- [${item.status}] ${item.label}: ${item.evidence} Proof: ${item.proofUrl}`),
    "",
    "## Risk register",
    ...input.riskRegister.map((risk) => `- [${risk.status}] ${risk.label}: ${risk.risk} Mitigation: ${risk.mitigation}`),
    "",
    "## Commercial terms",
    ...input.commercialTerms.map((term) => `- [${term.status}] ${term.label}: ${term.value} - ${term.evidence}`),
    "",
    "## Review path",
    ...input.reviewPath.map((step) => `- ${step.window} ${step.owner}: ${step.decision} Acceptance: ${step.acceptance}`)
  ].join("\n");
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
  if (["approval-ready", "clear"].includes(status)) return "good";
  if (["blocked"].includes(status)) return "bad";
  return "watch";
}

export function buildBuyerDiligenceRoom(input: {
  proposal: PilotProposal;
  handoff: PilotExecutionHandoff;
  buyerScenario: BuyerValueScenario;
  valueBlueprint: ValueBlueprint;
  recommendation: Recommendation;
  baseUrl?: string;
}): BuyerDiligenceRoom {
  const approvalQuestions = buildApprovalQuestions({
    proposal: input.proposal,
    handoff: input.handoff,
    scenario: input.buyerScenario,
    recommendation: input.recommendation
  });
  const evidenceLedger = buildEvidenceLedger({ proposal: input.proposal, handoff: input.handoff, baseUrl: input.baseUrl });
  const riskRegister = buildRisks({
    proposal: input.proposal,
    handoff: input.handoff,
    scenario: input.buyerScenario,
    recommendation: input.recommendation
  });
  const commercialTerms = buildCommercialTerms({ scenario: input.buyerScenario, proposal: input.proposal });
  const reviewPath = buildReviewPath({ proposal: input.proposal, handoff: input.handoff });
  const readiness = readinessFrom({
    proposal: input.proposal,
    handoff: input.handoff,
    scenario: input.buyerScenario,
    questions: approvalQuestions,
    risks: riskRegister,
    evidence: evidenceLedger
  });
  const diligenceScore = Math.round(
    clamp(
      average([
        input.proposal.proposalScore,
        input.handoff.executionScore,
        input.buyerScenario.scenarioScore,
        input.valueBlueprint.boardScore,
        average(approvalQuestions.map((question) => statusScore(question.status))),
        average(evidenceLedger.map((item) => statusScore(item.status))),
        average(riskRegister.map((risk) => statusScore(risk.status)))
      ])
    )
  );
  const id = `buyer-diligence-${diligenceScore}-${readiness}`;
  const partial = {
    id,
    readiness,
    diligenceScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness),
    buyerQuestion: "Can a sponsor approve this pilot today without private context from the builder team?",
    approvalQuestions,
    evidenceLedger,
    riskRegister,
    commercialTerms,
    reviewPath
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial),
    a2aPayload: {
      method: "message/send",
      skill: "buyer.diligence",
      id,
      readiness,
      diligenceScore,
      approvalQuestions: approvalQuestions.map((question) => ({
        id: question.id,
        owner: question.owner,
        status: question.status
      })),
      risks: riskRegister.map((risk) => ({
        id: risk.id,
        owner: risk.owner,
        status: risk.status
      })),
      reviewPath: reviewPath.map((step) => ({
        id: step.id,
        owner: step.owner,
        window: step.window
      }))
    }
  };
}

export function renderBuyerDiligenceHtml(
  room: BuyerDiligenceRoom,
  links: { proposalUrl?: string; executionUrl?: string; jsonUrl?: string; markdownUrl?: string; appUrl?: string } = {}
) {
  const metrics = [
    { label: "Readiness", value: room.readiness, status: room.readiness },
    { label: "Diligence Score", value: room.diligenceScore, status: room.readiness },
    { label: "Clear Questions", value: `${room.approvalQuestions.filter((question) => question.status === "clear").length}/${room.approvalQuestions.length}`, status: room.approvalQuestions.every((question) => question.status === "clear") ? "clear" : "watch" },
    { label: "Open Risks", value: room.riskRegister.filter((risk) => risk.status !== "clear").length, status: room.riskRegister.some((risk) => risk.status === "blocked") ? "blocked" : "clear" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const questions = room.approvalQuestions
    .map(
      (question) => `
        <article class="card ${tone(question.status)}">
          <div><strong>${escapeHtml(question.label)}</strong><span>${escapeHtml(question.status)}</span></div>
          <p>${escapeHtml(question.question)}</p>
          <small>${escapeHtml(question.owner)} / ${escapeHtml(question.evidence)}</small>
        </article>`
    )
    .join("");
  const evidence = room.evidenceLedger
    .map(
      (item) => `
        <article class="card ${tone(item.status)}">
          <div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.status)}</span></div>
          <p>${escapeHtml(item.evidence)}</p>
          <small>${escapeHtml(item.owner)} / ${escapeHtml(item.source)}</small>
          <a href="${escapeHtml(item.proofUrl)}">${escapeHtml(item.proofUrl)}</a>
        </article>`
    )
    .join("");
  const risks = room.riskRegister
    .map(
      (risk) => `
        <article class="card ${tone(risk.status)}">
          <div><strong>${escapeHtml(risk.label)}</strong><span>${escapeHtml(risk.status)}</span></div>
          <p>${escapeHtml(risk.risk)}</p>
          <small>${escapeHtml(risk.owner)} / ${escapeHtml(risk.mitigation)}</small>
        </article>`
    )
    .join("");
  const commercial = room.commercialTerms
    .map(
      (term) => `
        <article class="term ${tone(term.status)}">
          <span>${escapeHtml(term.label)}</span>
          <strong>${escapeHtml(term.value)}</strong>
          <small>${escapeHtml(term.evidence)}</small>
        </article>`
    )
    .join("");
  const reviewPath = room.reviewPath
    .map((step) => `<li><strong>${escapeHtml(step.window)} / ${escapeHtml(step.owner)}</strong> ${escapeHtml(step.decision)} <small>${escapeHtml(step.acceptance)}</small></li>`)
    .join("");
  const linkList = [
    links.proposalUrl ? `<a href="${escapeHtml(links.proposalUrl)}">Buyer proposal</a>` : "",
    links.executionUrl ? `<a href="${escapeHtml(links.executionUrl)}">Execution handoff</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON room</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown room</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");

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
      .eyebrow, .metric span, .card span, .term span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.25rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p { color: var(--muted); }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: end; }
      .score { min-height: 190px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #102226, #2457a6); }
      .score span { color: #ffe4a8; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .score strong { font-size: 5rem; line-height: .9; }
      .score small { color: rgba(255, 253, 247, .74); font-weight: 900; text-transform: uppercase; }
      .metrics, .grid, .terms { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 20px; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .terms { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .metric, .panel, .card, .term { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric, .term { padding: 14px; }
      .metric strong, .term strong { display: block; margin-top: 6px; font-size: 1.25rem; line-height: 1.1; overflow-wrap: anywhere; }
      .panel { padding: 16px; }
      .card { display: grid; gap: 7px; padding: 13px; }
      .card div { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
      .card strong, .card p, .card small, li { overflow-wrap: anywhere; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      ol { margin: 0; padding-left: 20px; color: var(--muted); }
      li + li { margin-top: 8px; }
      li small { display: block; margin-top: 2px; }
      section { margin-top: 12px; }
      .links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      .links a { display: inline-flex; min-height: 40px; align-items: center; border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; background: #d8fff5; text-decoration: none; font-weight: 900; }
      footer { padding: 22px 0 38px; color: var(--muted); }
      @media (max-width: 860px) {
        .hero, .metrics, .grid, .terms { grid-template-columns: 1fr; }
        .score { min-height: 140px; }
        .score strong { font-size: 4rem; }
        .card div { display: block; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <div class="eyebrow">Buyer Due Diligence Room</div>
          <h1>${escapeHtml(room.headline)}</h1>
          <p>${escapeHtml(room.hardTruth)}</p>
          <p><strong>${escapeHtml(room.buyerQuestion)}</strong></p>
          <div class="links">${linkList}</div>
        </div>
        <aside class="score">
          <span>${escapeHtml(room.readiness)}</span>
          <strong>${escapeHtml(room.diligenceScore)}</strong>
          <small>diligence score</small>
        </aside>
      </div>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <section>
        <h2>Commercial Case</h2>
        <div class="terms">${commercial}</div>
      </section>
      <section>
        <h2>Approval Questions</h2>
        <div class="grid">${questions}</div>
      </section>
      <section>
        <h2>Evidence Ledger</h2>
        <div class="grid">${evidence}</div>
      </section>
      <section>
        <h2>Risk Register</h2>
        <div class="grid">${risks}</div>
      </section>
      <section class="panel">
        <h2>Review Path</h2>
        <ol>${reviewPath}</ol>
      </section>
    </main>
    <footer>${escapeHtml(room.id)} / share this room when a buyer asks what must be true before approval.</footer>
  </body>
</html>`;
}
