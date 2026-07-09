import type { BuyerValueScenario } from "./buyerValueScenario.js";
import type { MarketAgent, Recommendation } from "./types.js";
import type { ValueBlueprint, ValueJob } from "./valueBlueprint.js";

export type PilotWorkflowReadiness = "ready-to-run" | "needs-scope" | "blocked";
export type PilotWorkflowStatus = "clear" | "watch" | "blocked";

export type PilotWorkflowStep = {
  id: string;
  label: string;
  owner: string;
  agentName: string;
  manualMinutes: number;
  assistedMinutes: number;
  outcome: string;
  acceptance: string;
  evidence: string;
};

export type PilotWorkflowCheckpoint = {
  id: string;
  label: string;
  status: PilotWorkflowStatus;
  question: string;
  evidence: string;
};

export type PilotWorkflowPlan = {
  id: string;
  readiness: PilotWorkflowReadiness;
  workflowScore: number;
  targetUser: string;
  workflowName: string;
  trigger: string;
  timebox: string;
  manualMinutesPerRun: number;
  assistedMinutesPerRun: number;
  minutesSavedPerRun: number;
  monthlyHoursSaved: number;
  steps: PilotWorkflowStep[];
  checkpoints: PilotWorkflowCheckpoint[];
  handoffScript: string[];
  exportMarkdown: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function statusScore(status: PilotWorkflowStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 66;
  return 18;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function minutesFromHours(value: number) {
  return Math.max(1, Math.round(value * 60));
}

function distribute(total: number, ratios: number[]) {
  const values = ratios.map((ratio) => Math.max(1, Math.round(total * ratio)));
  const remainder = total - values.slice(0, -1).reduce((sum, value) => sum + value, 0);
  values[values.length - 1] = Math.max(1, remainder);
  return values;
}

function pickAgent(input: { recommendation: Recommendation; preferredIds: string[]; fallbackIndex: number }) {
  const selected = input.recommendation.selected.length > 0 ? input.recommendation.selected : input.recommendation.ranked.map((fit) => fit.agent);
  return input.preferredIds.map((id) => selected.find((agent) => agent.id === id)).find((agent): agent is MarketAgent => Boolean(agent)) ?? selected[input.fallbackIndex % Math.max(1, selected.length)];
}

function jobFor(blueprint: ValueBlueprint, agent: MarketAgent | undefined, fallbackIndex: number): ValueJob | undefined {
  if (!agent) return blueprint.jobs[fallbackIndex];
  return blueprint.jobs.find((job) => job.id === agent.id) ?? blueprint.jobs[fallbackIndex];
}

function workflowNameFor(user: string) {
  if (/security/i.test(user)) return "Security-safe agent pilot approval";
  if (/platform|devops|sre/i.test(user)) return "Cloud Run agent pilot launch";
  if (/buyer|customer/i.test(user)) return "Buyer value proof workflow";
  if (/launch|builder/i.test(user)) return "Public launch evidence workflow";
  return "First buyer-ready agent workflow";
}

function checkpointStatus(condition: boolean, watchCondition = false): PilotWorkflowStatus {
  if (condition) return "clear";
  if (watchCondition) return "watch";
  return "blocked";
}

function buildCheckpoints(input: { recommendation: Recommendation; blueprint: ValueBlueprint; scenario: BuyerValueScenario }): PilotWorkflowCheckpoint[] {
  const hasOpsOwner = input.recommendation.selected.some((agent) => ["cloud-run-sre", "security-sentinel", "observability-oracle", "test-forge"].includes(agent.id));
  return [
    {
      id: "real-user",
      label: "Real user",
      status: checkpointStatus(input.scenario.assumptions.teamSize >= 3, input.scenario.assumptions.teamSize >= 2),
      question: "Is the pilot anchored to a named team instead of a generic demo audience?",
      evidence: `${input.blueprint.primaryUser}; ${input.scenario.assumptions.teamSize} pilot users.`
    },
    {
      id: "value-threshold",
      label: "Value threshold",
      status: checkpointStatus(input.scenario.paybackDays <= 45 && input.scenario.monthlyGrossValueYen > input.scenario.pilotInvestmentYen, input.scenario.readiness === "pilot-first"),
      question: "Can the buyer defend the first pilot budget from the expected value?",
      evidence: `${input.scenario.paybackDays}-day payback, ${input.scenario.monthlyGrossValueYen.toLocaleString("ja-JP")} yen monthly value.`
    },
    {
      id: "proof-contract",
      label: "Proof contract",
      status: checkpointStatus(input.blueprint.proofContract.mustProve.length >= 4, input.blueprint.proofContract.mustProve.length >= 3),
      question: "Does the workflow end with evidence a reviewer can inspect?",
      evidence: `${input.blueprint.proofContract.mustProve.length} proof obligations; owner ${input.blueprint.proofContract.owner}.`
    },
    {
      id: "ops-owner",
      label: "Ops owner",
      status: checkpointStatus(hasOpsOwner, input.recommendation.after.reliability >= 65),
      question: "Is there an accountable owner for launch, security, test, or observability proof?",
      evidence: hasOpsOwner ? input.recommendation.selected.map((agent) => agent.name).join(" / ") : `${input.recommendation.after.reliability}/100 reliability score.`
    }
  ];
}

function readinessFrom(input: { scenario: BuyerValueScenario; blueprint: ValueBlueprint; checkpoints: PilotWorkflowCheckpoint[] }): PilotWorkflowReadiness {
  if (input.scenario.readiness === "not-yet" || input.checkpoints.some((checkpoint) => checkpoint.status === "blocked")) return "blocked";
  if (input.scenario.readiness === "scales-now" && input.blueprint.boardScore >= 70 && input.checkpoints.every((checkpoint) => checkpoint.status === "clear")) return "ready-to-run";
  return "needs-scope";
}

function buildMarkdown(input: Omit<PilotWorkflowPlan, "exportMarkdown">) {
  return [
    `# ${input.workflowName}`,
    "",
    `Readiness: ${input.readiness}`,
    `Workflow score: ${input.workflowScore}/100`,
    `Target user: ${input.targetUser}`,
    `Trigger: ${input.trigger}`,
    `Timebox: ${input.timebox}`,
    `Time saved: ${input.minutesSavedPerRun} minutes per run / ${input.monthlyHoursSaved} monthly hours`,
    "",
    "## Steps",
    ...input.steps.flatMap((step, index) => [
      `${index + 1}. ${step.label}`,
      `   - Owner: ${step.owner} (${step.agentName})`,
      `   - Time: ${step.manualMinutes}m manual -> ${step.assistedMinutes}m assisted`,
      `   - Outcome: ${step.outcome}`,
      `   - Acceptance: ${step.acceptance}`,
      `   - Evidence: ${step.evidence}`
    ]),
    "",
    "## Checkpoints",
    ...input.checkpoints.map((checkpoint) => `- [${checkpoint.status}] ${checkpoint.label}: ${checkpoint.question} Evidence: ${checkpoint.evidence}`),
    "",
    "## Handoff script",
    ...input.handoffScript.map((line) => `- ${line}`)
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
  if (["ready-to-run", "clear"].includes(status)) return "good";
  if (["blocked"].includes(status)) return "bad";
  return "watch";
}

export function buildPilotWorkflowPlan(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
}): PilotWorkflowPlan {
  const manualMinutesPerRun = minutesFromHours(input.buyerScenario.assumptions.manualHoursPerCycle);
  const assistedMinutesPerRun = minutesFromHours(input.buyerScenario.assistedHoursPerCycle);
  const minutesSavedPerRun = Math.max(0, manualMinutesPerRun - assistedMinutesPerRun);
  const manual = distribute(manualMinutesPerRun, [0.18, 0.32, 0.3, 0.2]);
  const assisted = distribute(assistedMinutesPerRun, [0.22, 0.3, 0.28, 0.2]);
  const intakeAgent = pickAgent({ recommendation: input.recommendation, preferredIds: ["brief-cartographer", "market-broker", "ux-guildmaster"], fallbackIndex: 0 });
  const proofAgent = pickAgent({ recommendation: input.recommendation, preferredIds: ["cloud-run-sre", "test-forge", "security-sentinel"], fallbackIndex: 1 });
  const storyAgent = pickAgent({ recommendation: input.recommendation, preferredIds: ["market-broker", "gemini-strategist", "ux-guildmaster"], fallbackIndex: 2 });
  const ownerAgent = pickAgent({ recommendation: input.recommendation, preferredIds: ["security-sentinel", "observability-oracle", "cloud-run-sre"], fallbackIndex: 3 });
  const agents = [intakeAgent, proofAgent, storyAgent, ownerAgent];
  const jobs = agents.map((agent, index) => jobFor(input.valueBlueprint, agent, index));
  const checkpoints = buildCheckpoints({ recommendation: input.recommendation, blueprint: input.valueBlueprint, scenario: input.buyerScenario });
  const readiness = readinessFrom({ scenario: input.buyerScenario, blueprint: input.valueBlueprint, checkpoints });
  const workflowScore = Math.round(
    clamp(
      average([
        input.valueBlueprint.boardScore,
        input.buyerScenario.scenarioScore,
        input.buyerScenario.confidenceScore,
        average(checkpoints.map((checkpoint) => statusScore(checkpoint.status)))
      ])
    )
  );
  const workflowName = workflowNameFor(input.valueBlueprint.primaryUser);
  const trigger = `${input.valueBlueprint.primaryUser} brings one real request that must become a pilot decision without private context from the builder team.`;
  const timebox = readiness === "ready-to-run" ? "One 45-minute facilitated run, then sponsor review" : readiness === "needs-scope" ? "One 60-minute scoping run before sponsor review" : "Do not run with a buyer until blocked checkpoints are fixed";
  const steps: PilotWorkflowStep[] = [
    {
      id: "intake",
      label: "Capture the request",
      owner: "Pilot facilitator",
      agentName: intakeAgent?.name ?? "A2A Market Broker",
      manualMinutes: manual[0],
      assistedMinutes: assisted[0],
      outcome: jobs[0]?.deliveredOutcome ?? "A real buyer workflow, user, and decision boundary are written down.",
      acceptance: jobs[0]?.acceptanceCriteria[0] ?? input.valueBlueprint.proofContract.mustProve[0],
      evidence: jobs[0]?.evidenceSignals[0] ?? "brief.updated"
    },
    {
      id: "delegate",
      label: "Run delegated agent proof",
      owner: proofAgent?.name ?? "Proof owner",
      agentName: proofAgent?.name ?? "Proof owner",
      manualMinutes: manual[1],
      assistedMinutes: assisted[1],
      outcome: "A bounded A2A task produces a receipt, score, source, and public artifact.",
      acceptance: jobs[1]?.acceptanceCriteria.find((item) => item.includes("A2A")) ?? "Accepted A2A receipt is attached before sponsor review.",
      evidence: jobs[1]?.evidenceSignals[0] ?? "a2a.trial.receipt"
    },
    {
      id: "assemble",
      label: "Assemble buyer evidence",
      owner: storyAgent?.name ?? "Buyer story owner",
      agentName: storyAgent?.name ?? "Buyer story owner",
      manualMinutes: manual[2],
      assistedMinutes: assisted[2],
      outcome: "Proposal, diligence questions, and launch evidence tell the same buyer story.",
      acceptance: jobs[2]?.acceptanceCriteria[0] ?? input.valueBlueprint.proofContract.mustProve[1],
      evidence: jobs[2]?.evidenceSignals[0] ?? "buyer.proposal"
    },
    {
      id: "decide",
      label: "Decide continue, revise, or stop",
      owner: "Buyer sponsor",
      agentName: ownerAgent?.name ?? "Pilot owner",
      manualMinutes: manual[3],
      assistedMinutes: assisted[3],
      outcome: "The sponsor sees the value case, proof gaps, and stop rule in one review.",
      acceptance: input.valueBlueprint.proofContract.mustProve[input.valueBlueprint.proofContract.mustProve.length - 1],
      evidence: "buyer.diligence.room"
    }
  ];
  const handoffScript = [
    `Run exactly one workflow first: ${workflowName}.`,
    `Start when ${trigger}`,
    `Keep the run inside ${timebox}.`,
    `Accept only if ${checkpoints.filter((checkpoint) => checkpoint.status === "clear").length}/${checkpoints.length} checkpoints are clear and the evidence artifact is shareable.`,
    `Stop if ${checkpoints.find((checkpoint) => checkpoint.status === "blocked")?.label ?? "the sponsor cannot inspect the proof"} fails.`
  ];
  const partial = {
    id: `pilot-workflow-${workflowScore}-${readiness}`,
    readiness,
    workflowScore,
    targetUser: input.valueBlueprint.primaryUser,
    workflowName,
    trigger,
    timebox,
    manualMinutesPerRun,
    assistedMinutesPerRun,
    minutesSavedPerRun,
    monthlyHoursSaved: input.buyerScenario.monthlyHoursSaved,
    steps,
    checkpoints,
    handoffScript
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderPilotWorkflowHtml(
  plan: PilotWorkflowPlan,
  links: { proposalUrl?: string; diligenceUrl?: string; executionUrl?: string; jsonUrl?: string; markdownUrl?: string; appUrl?: string } = {}
) {
  const metrics = [
    { label: "Readiness", value: plan.readiness, status: plan.readiness },
    { label: "Workflow Score", value: plan.workflowScore, status: plan.readiness },
    { label: "Saved Per Run", value: `${plan.minutesSavedPerRun}m`, status: plan.minutesSavedPerRun > 0 ? "clear" : "blocked" },
    { label: "Monthly Hours", value: plan.monthlyHoursSaved, status: plan.monthlyHoursSaved > 0 ? "clear" : "blocked" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const steps = plan.steps
    .map(
      (step, index) => `
        <article class="card step">
          <span>${index + 1}</span>
          <strong>${escapeHtml(step.label)}</strong>
          <small>${escapeHtml(step.owner)} / ${escapeHtml(step.agentName)}</small>
          <p>${escapeHtml(step.outcome)}</p>
          <b>${escapeHtml(step.manualMinutes)}m → ${escapeHtml(step.assistedMinutes)}m</b>
          <small>${escapeHtml(step.acceptance)}</small>
          <code>${escapeHtml(step.evidence)}</code>
        </article>`
    )
    .join("");
  const checkpoints = plan.checkpoints
    .map(
      (checkpoint) => `
        <article class="card ${tone(checkpoint.status)}">
          <div><strong>${escapeHtml(checkpoint.label)}</strong><span>${escapeHtml(checkpoint.status)}</span></div>
          <p>${escapeHtml(checkpoint.question)}</p>
          <small>${escapeHtml(checkpoint.evidence)}</small>
        </article>`
    )
    .join("");
  const script = plan.handoffScript.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const linkList = [
    links.proposalUrl ? `<a href="${escapeHtml(links.proposalUrl)}">Buyer proposal</a>` : "",
    links.diligenceUrl ? `<a href="${escapeHtml(links.diligenceUrl)}">Diligence room</a>` : "",
    links.executionUrl ? `<a href="${escapeHtml(links.executionUrl)}">Execution handoff</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON workflow</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown workflow</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(plan.workflowName)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #52645f; --line: #cbd7d2; --paper: #f3f7f5; --panel: #fffdf7; --teal: #0f766e; --blue: #2457a6; --green-bg: #edf8f1; --amber-bg: #fff7dd; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 22px; }
      .eyebrow, .metric span, .card span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.2rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p { color: var(--muted); }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: end; }
      .score { min-height: 190px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #102226, #2457a6); }
      .score span { color: #ffe4a8; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .score strong { font-size: 5rem; line-height: .9; }
      .score small { max-width: 240px; color: rgba(255, 253, 247, .76); font-weight: 900; text-align: center; }
      .metrics, .grid { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 20px; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .panel, .card { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.25rem; line-height: 1.1; overflow-wrap: anywhere; }
      .panel { padding: 16px; }
      .card { display: grid; gap: 7px; padding: 13px; }
      .card div { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
      .card strong, .card p, .card small, .card code, li { overflow-wrap: anywhere; }
      .card code { width: fit-content; max-width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 4px 7px; background: #f7fbf8; }
      .step { border-left: 4px solid var(--blue); }
      .step b { width: fit-content; border: 1px solid var(--line); border-radius: 999px; padding: 4px 8px; color: var(--teal); background: var(--green-bg); }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      ol { margin: 0; padding-left: 20px; color: var(--muted); }
      li + li { margin-top: 8px; }
      section { margin-top: 12px; }
      .links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      .links a { display: inline-flex; min-height: 40px; align-items: center; border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; background: #d8fff5; text-decoration: none; font-weight: 900; }
      footer { padding: 22px 0 38px; color: var(--muted); }
      @media (max-width: 860px) {
        .hero, .metrics, .grid { grid-template-columns: 1fr; }
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
          <div class="eyebrow">Pilot Workflow</div>
          <h1>${escapeHtml(plan.workflowName)}</h1>
          <p>${escapeHtml(plan.trigger)}</p>
          <p><strong>${escapeHtml(plan.timebox)}</strong></p>
          <div class="links">${linkList}</div>
        </div>
        <aside class="score">
          <span>${escapeHtml(plan.readiness)}</span>
          <strong>${escapeHtml(plan.workflowScore)}</strong>
          <small>workflow score</small>
        </aside>
      </div>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <section>
        <h2>Run Sequence</h2>
        <div class="grid">${steps}</div>
      </section>
      <section>
        <h2>Decision Checkpoints</h2>
        <div class="grid">${checkpoints}</div>
      </section>
      <section class="panel">
        <h2>Handoff Script</h2>
        <ol>${script}</ol>
      </section>
    </main>
    <footer>${escapeHtml(plan.id)} / share this workflow before asking a sponsor to approve the pilot.</footer>
  </body>
</html>`;
}
