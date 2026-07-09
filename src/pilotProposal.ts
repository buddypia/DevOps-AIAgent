import { summarizeAgentTrialEvidence } from "./agentTrialEvidence.js";
import type { BuyerValueScenario } from "./buyerValueScenario.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";
import type { WorkspaceDraft } from "./workspaceDraft.js";

export type PilotProposalReadiness = "buyer-ready" | "pilot-ready" | "draft";
export type PilotProofStatus = "ready" | "watch" | "missing";

export type PilotProposalProof = {
  id: string;
  label: string;
  status: PilotProofStatus;
  evidence: string;
};

export type PilotProposalPhase = {
  id: string;
  label: string;
  duration: string;
  buyerOutcome: string;
  proofGate: string;
};

export type PilotProposalObjection = {
  id: string;
  concern: string;
  answer: string;
  proof: string;
};

export type PilotProposalCommitment = {
  id: string;
  owner: string;
  promise: string;
  acceptance: string;
};

export type PilotProposal = {
  id: string;
  readiness: PilotProposalReadiness;
  proposalScore: number;
  title: string;
  targetBuyer: string;
  openingClaim: string;
  buyerProblem: string;
  proposedPilot: string;
  measurablePromise: string;
  commercialGuardrail: string;
  scope: string[];
  exclusions: string[];
  phases: PilotProposalPhase[];
  proofs: PilotProposalProof[];
  objections: PilotProposalObjection[];
  commitments: PilotProposalCommitment[];
  exportMarkdown: string;
};

export type BuildPilotProposalInput = {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl"> & Partial<Pick<WorkspaceDraft, "agentTrialEvidence">>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
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
  if (["buyer-ready", "ready"].includes(status)) return "good";
  if (["draft", "missing"].includes(status)) return "bad";
  return "watch";
}

function proofStatus(ready: boolean, watch = false): PilotProofStatus {
  if (ready) return "ready";
  return watch ? "watch" : "missing";
}

function readinessFor(input: { score: number; scenario: BuyerValueScenario; publicProofReady: boolean }): PilotProposalReadiness {
  if (input.score >= 82 && input.scenario.readiness === "scales-now" && input.publicProofReady) return "buyer-ready";
  if (input.score >= 62 && input.scenario.readiness !== "not-yet") return "pilot-ready";
  return "draft";
}

function titleFor(readiness: PilotProposalReadiness, buyer: string) {
  if (readiness === "buyer-ready") return `Pilot proposal ready for ${buyer}`;
  if (readiness === "pilot-ready") return `Pilot proposal needs public proof before ${buyer} sees it`;
  return `Draft the buyer case before pitching ${buyer}`;
}

function buyerProblemFor(blueprint: ValueBlueprint) {
  return blueprint.jobs[0]?.currentPain ?? "The buyer cannot turn AI-agent capability into a clear operating result, acceptance gate, and deployment plan.";
}

function buildProofs(input: BuildPilotProposalInput): PilotProposalProof[] {
  const targetReady = isBuyerFacingProofUrl(input.workspace.targetUrl);
  const protopediaReady = isBuyerFacingProofUrl(input.workspace.protopediaUrl);
  const videoReady = isBuyerFacingProofUrl(input.workspace.videoUrl);
  const trial = summarizeAgentTrialEvidence(input.workspace.agentTrialEvidence ?? []);

  return [
    {
      id: "economics",
      label: "Buyer economics",
      status: proofStatus(input.buyerScenario.readiness === "scales-now", input.buyerScenario.readiness === "pilot-first"),
      evidence: `${yen(input.buyerScenario.monthlyGrossValueYen)} monthly value, ${input.buyerScenario.paybackDays}-day payback, ${input.buyerScenario.confidenceScore}/100 confidence.`
    },
    {
      id: "runtime",
      label: "Runtime proof",
      status: proofStatus(targetReady),
      evidence: targetReady ? "Public deployed URL is attached for buyer inspection." : "Attach the Cloud Run or equivalent public URL before sending."
    },
    {
      id: "submission",
      label: "Submission proof",
      status: proofStatus(protopediaReady && videoReady, protopediaReady || videoReady),
      evidence:
        protopediaReady && videoReady
          ? "ProtoPedia and video URLs are attached."
          : protopediaReady || videoReady
            ? "One external launch URL is attached; the other still needs a public link."
            : "Attach ProtoPedia and walkthrough video URLs for public credibility."
    },
    {
      id: "a2a-trial",
      label: "A2A trial proof",
      status: proofStatus(trial.status === "ready", trial.status === "watch"),
      evidence: trial.evidence
    },
    {
      id: "acceptance",
      label: "Acceptance contract",
      status: proofStatus(input.valueBlueprint.proofContract.mustProve.length >= 3),
      evidence: `${input.valueBlueprint.proofContract.mustProve.length} buyer-facing proof obligations are defined.`
    }
  ];
}

function buildScope(input: BuildPilotProposalInput) {
  return [
    `Run one ${input.buyerScenario.assumptions.teamSize}-person workflow through the selected AI squad.`,
    `Prove at least ${input.buyerScenario.monthlyHoursSaved} monthly hours saved from the current manual process.`,
    `Keep the first pilot under ${yen(input.buyerScenario.pilotBudgetCeilingYen)} unless evidence improves.`,
    `Deliver the acceptance evidence from ${input.recommendation.selected.slice(0, 3).map((agent) => agent.name).join(", ")}.`
  ];
}

function buildExclusions(readiness: PilotProposalReadiness) {
  if (readiness === "buyer-ready") {
    return [
      "No enterprise-wide rollout before the pilot success gate is signed.",
      "No private customer data until security and retention terms are accepted.",
      "No custom integration beyond the workflow selected for the first pilot."
    ];
  }

  return [
    "Do not sell this as a full rollout until buyer economics are proven.",
    "Do not add another workflow before the first success metric is measured.",
    "Do not hide missing public proof from the buyer memo."
  ];
}

function buildPhases(input: BuildPilotProposalInput): PilotProposalPhase[] {
  const owner = input.recommendation.selected[0]?.name ?? "A2A Market Broker";
  return [
    {
      id: "shape",
      label: "Shape the pilot",
      duration: "Day 0",
      buyerOutcome: `A ${input.valueBlueprint.primaryUser} can explain the workflow, success metric, and owner.`,
      proofGate: input.valueBlueprint.proofContract.mustProve[0] ?? "Buyer problem and success condition are explicit."
    },
    {
      id: "run",
      label: "Run the workflow",
      duration: "Days 1-5",
      buyerOutcome: `${owner} turns the brief into a visible operating plan and acceptance evidence.`,
      proofGate: `${input.buyerScenario.monthlyHoursSaved}h monthly saving model is checked against first-user behavior.`
    },
    {
      id: "decide",
      label: "Decide expansion",
      duration: "Week 2",
      buyerOutcome: `The buyer chooses continue, revise, or stop with a ${input.buyerScenario.paybackDays}-day payback model.`,
      proofGate: "Launch evidence, objections, and next investment decision are exported together."
    }
  ];
}

function buildObjections(input: BuildPilotProposalInput): PilotProposalObjection[] {
  const objections: PilotProposalObjection[] = [
    {
      id: "why-now",
      concern: "Why is this worth doing now?",
      answer: `${yen(input.buyerScenario.monthlyGrossValueYen)} monthly value is at stake, and the pilot can be bounded to ${input.buyerScenario.paybackDays} days of payback evidence.`,
      proof: "Buyer Value Simulator"
    },
    {
      id: "why-this-squad",
      concern: "Why this AI squad instead of a generic tool?",
      answer: input.valueBlueprint.jobs
        .slice(0, 3)
        .map((job) => `${job.agentName}: ${job.deliveredOutcome}`)
        .join(" "),
      proof: "Value Blueprint accountable jobs"
    }
  ];

  if (!isBuyerFacingProofUrl(input.workspace.targetUrl)) {
    objections.push({
      id: "proof-gap",
      concern: "Can the buyer inspect the product independently?",
      answer: "Not yet. Attach the deployed public URL before this proposal is sent outside the team.",
      proof: "Launch Evidence Console"
    });
  }

  if (summarizeAgentTrialEvidence(input.workspace.agentTrialEvidence ?? []).status !== "ready") {
    objections.push({
      id: "a2a-proof-gap",
      concern: "Did the selected AI agent actually complete a bounded proof task?",
      answer: "Not yet. Attach an accepted A2A trial verification before treating this as an agent-led pilot.",
      proof: "Agent Card Intake response verifier"
    });
  }

  if (input.buyerScenario.readiness !== "scales-now") {
    objections.push({
      id: "economics-gap",
      concern: "What if adoption or payback is weaker than assumed?",
      answer: "Keep this as a bounded pilot and tighten the adoption or scope assumptions before asking for rollout budget.",
      proof: "Buyer Value Simulator next proof moves"
    });
  }

  return objections.slice(0, 4);
}

function buildCommitments(blueprint: ValueBlueprint): PilotProposalCommitment[] {
  return blueprint.jobs.slice(0, 4).map((job) => ({
    id: job.id,
    owner: job.agentName,
    promise: job.deliveredOutcome,
    acceptance: job.acceptanceCriteria[0] ?? "Acceptance evidence is visible to the buyer."
  }));
}

function buildMarkdown(input: Omit<PilotProposal, "exportMarkdown">) {
  return [
    `# ${input.title}`,
    "",
    `Readiness: ${input.readiness}`,
    `Proposal score: ${input.proposalScore}/100`,
    `Target buyer: ${input.targetBuyer}`,
    "",
    input.openingClaim,
    "",
    "## Buyer problem",
    input.buyerProblem,
    "",
    "## Proposed pilot",
    input.proposedPilot,
    "",
    "## Measurable promise",
    input.measurablePromise,
    "",
    "## Commercial guardrail",
    input.commercialGuardrail,
    "",
    "## Scope",
    ...input.scope.map((item) => `- ${item}`),
    "",
    "## Exclusions",
    ...input.exclusions.map((item) => `- ${item}`),
    "",
    "## Pilot phases",
    ...input.phases.map((phase) => `- ${phase.duration}: ${phase.label} - ${phase.buyerOutcome} Gate: ${phase.proofGate}`),
    "",
    "## Proof checklist",
    ...input.proofs.map((proof) => `- [${proof.status}] ${proof.label}: ${proof.evidence}`),
    "",
    "## Buyer objections",
    ...input.objections.map((objection) => `- ${objection.concern} ${objection.answer} Proof: ${objection.proof}`),
    "",
    "## Delivery commitments",
    ...input.commitments.map((commitment) => `- ${commitment.owner}: ${commitment.promise} Acceptance: ${commitment.acceptance}`)
  ].join("\n");
}

export function buildPilotProposal(input: BuildPilotProposalInput): PilotProposal {
  const proofs = buildProofs(input);
  const proofScore = proofs.reduce((sum, proof) => sum + (proof.status === "ready" ? 12 : proof.status === "watch" ? 7 : 0), 0);
  const baseScore = Math.round(
    clamp(input.buyerScenario.scenarioScore * 0.46 + input.valueBlueprint.boardScore * 0.28 + input.recommendation.after.usability * 0.16 + proofScore)
  );
  const readiness = readinessFor({
    score: baseScore,
    scenario: input.buyerScenario,
    publicProofReady: proofs.filter((proof) => proof.id === "runtime" || proof.id === "submission" || proof.id === "a2a-trial").every((proof) => proof.status === "ready")
  });
  const targetBuyer = input.valueBlueprint.primaryUser;
  const partial = {
    id: `pilot-proposal-${readiness}-${baseScore}`,
    readiness,
    proposalScore: baseScore,
    title: titleFor(readiness, targetBuyer),
    targetBuyer,
    openingClaim: `${targetBuyer} gets a bounded pilot that turns AI-agent selection into measured operating value, not a feature tour.`,
    buyerProblem: buyerProblemFor(input.valueBlueprint),
    proposedPilot: `Run the selected ${input.recommendation.selected.length || 1}-agent squad against one workflow for ${input.buyerScenario.assumptions.teamSize} users, then decide expansion from evidence.`,
    measurablePromise: `${input.buyerScenario.monthlyHoursSaved}h/month saved, ${yen(input.buyerScenario.monthlyGrossValueYen)} monthly value, ${input.buyerScenario.paybackDays}-day payback target.`,
    commercialGuardrail: `Keep pilot spend at or below ${yen(input.buyerScenario.pilotBudgetCeilingYen)} until proof status is ready.`,
    scope: buildScope(input),
    exclusions: buildExclusions(readiness),
    phases: buildPhases(input),
    proofs,
    objections: buildObjections(input),
    commitments: buildCommitments(input.valueBlueprint)
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderPilotProposalHtml(
  proposal: PilotProposal,
  links: {
    jsonUrl?: string;
    appUrl?: string;
    markdownUrl?: string;
    executionUrl?: string;
    diligenceUrl?: string;
  } = {}
) {
  const metrics = [
    { label: "Readiness", value: proposal.readiness, status: proposal.readiness },
    { label: "Proposal Score", value: proposal.proposalScore, status: proposal.readiness },
    { label: "Target Buyer", value: proposal.targetBuyer, status: proposal.readiness },
    { label: "Proofs Ready", value: `${proposal.proofs.filter((proof) => proof.status === "ready").length}/${proposal.proofs.length}`, status: proposal.proofs.every((proof) => proof.status === "ready") ? "ready" : "watch" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const scope = proposal.scope.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const exclusions = proposal.exclusions.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const proofs = proposal.proofs
    .map(
      (proof) => `
        <article class="card ${tone(proof.status)}">
          <div>
            <strong>${escapeHtml(proof.label)}</strong>
            <span>${escapeHtml(proof.status)}</span>
          </div>
          <p>${escapeHtml(proof.evidence)}</p>
        </article>`
    )
    .join("");
  const phases = proposal.phases
    .map(
      (phase) => `
        <article class="card phase">
          <span>${escapeHtml(phase.duration)}</span>
          <strong>${escapeHtml(phase.label)}</strong>
          <p>${escapeHtml(phase.buyerOutcome)}</p>
          <small>${escapeHtml(phase.proofGate)}</small>
        </article>`
    )
    .join("");
  const objections = proposal.objections
    .map(
      (objection) => `
        <article class="card objection">
          <strong>${escapeHtml(objection.concern)}</strong>
          <p>${escapeHtml(objection.answer)}</p>
          <small>${escapeHtml(objection.proof)}</small>
        </article>`
    )
    .join("");
  const commitments = proposal.commitments
    .map(
      (commitment) => `
        <article class="card commitment">
          <span>${escapeHtml(commitment.owner)}</span>
          <strong>${escapeHtml(commitment.promise)}</strong>
          <p>${escapeHtml(commitment.acceptance)}</p>
        </article>`
    )
    .join("");
  const linkList = [
    links.executionUrl ? `<a href="${escapeHtml(links.executionUrl)}">Execution handoff</a>` : "",
    links.diligenceUrl ? `<a href="${escapeHtml(links.diligenceUrl)}">Diligence room</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON receipt</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown export</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(proposal.title)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #53635d; --line: #cdd8d2; --paper: #f4f7f5; --panel: #fffdf7; --blue: #2457a6; --green: #287a55; --mint: #edf8f1; --amber: #8a620d; --amber-bg: #fff7dd; --rose: #b56576; --rose-bg: #fff1f2; --teal: #0f766e; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 22px; }
      .eyebrow, .metric span, .card span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 920px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.6rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p { color: var(--muted); }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: end; }
      .score { min-height: 190px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #102226, #2457a6); }
      .score span { color: #ffe4a8; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .score strong { font-size: 5rem; line-height: .9; }
      .score small { color: rgba(255, 253, 247, .74); font-weight: 900; text-transform: uppercase; }
      .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 20px; }
      .metric, .panel, .card { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.25rem; line-height: 1.1; overflow-wrap: anywhere; }
      .summary { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, .9fr); gap: 1px; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--line); }
      .panel { display: grid; gap: 10px; padding: 16px; border: 0; border-radius: 0; box-shadow: none; }
      .statement { font-size: 1.05rem; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .card { display: grid; gap: 7px; padding: 13px; }
      .card div { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
      .card strong, .card p, .card small, li { overflow-wrap: anywhere; }
      .good { border-color: #add6bd; background: var(--mint); }
      .watch, .objection { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      .phase { border-left: 4px solid var(--blue); background: #eef4ff; }
      .commitment { border-left: 4px solid var(--green); background: var(--mint); }
      ul { margin: 0; padding-left: 20px; color: var(--muted); }
      section { margin-top: 12px; }
      .links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      .links a { display: inline-flex; min-height: 40px; align-items: center; border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; background: #d8fff5; text-decoration: none; font-weight: 900; }
      footer { padding: 22px 0 38px; color: var(--muted); }
      @media (max-width: 860px) {
        .hero, .metrics, .summary, .grid { grid-template-columns: 1fr; }
        .score { min-height: 140px; }
        .score strong { font-size: 4rem; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <div class="eyebrow">Buyer Pilot Proposal</div>
          <h1>${escapeHtml(proposal.title)}</h1>
          <p class="statement">${escapeHtml(proposal.openingClaim)}</p>
          <div class="links">${linkList}</div>
        </div>
        <aside class="score">
          <span>${escapeHtml(proposal.readiness)}</span>
          <strong>${escapeHtml(proposal.proposalScore)}</strong>
          <small>proposal score</small>
        </aside>
      </div>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <section class="summary">
        <article class="panel">
          <h2>Buyer Problem</h2>
          <p>${escapeHtml(proposal.buyerProblem)}</p>
          <h2>Proposed Pilot</h2>
          <p>${escapeHtml(proposal.proposedPilot)}</p>
          <h2>Measurable Promise</h2>
          <p>${escapeHtml(proposal.measurablePromise)}</p>
          <h2>Commercial Guardrail</h2>
          <p>${escapeHtml(proposal.commercialGuardrail)}</p>
        </article>
        <article class="panel">
          <h2>Scope</h2>
          <ul>${scope}</ul>
          <h2>Exclusions</h2>
          <ul>${exclusions}</ul>
        </article>
      </section>
      <section>
        <h2>Proof Checklist</h2>
        <div class="grid">${proofs}</div>
      </section>
      <section>
        <h2>Pilot Path</h2>
        <div class="grid">${phases}</div>
      </section>
      <section>
        <h2>Buyer Objections</h2>
        <div class="grid">${objections}</div>
      </section>
      <section>
        <h2>Delivery Commitments</h2>
        <div class="grid">${commitments}</div>
      </section>
    </main>
    <footer>${escapeHtml(proposal.id)} / export this page as the buyer-facing receipt before rollout.</footer>
  </body>
</html>`;
}
