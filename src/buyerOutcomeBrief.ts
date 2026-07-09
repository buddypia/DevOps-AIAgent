import { buildOutcomeSnapshot, type OutcomeSnapshotStatus } from "./outcomeSnapshot.js";
import { buildPilotRunReceipt, type PilotRunReceiptInput } from "./pilotRunReceipt.js";
import { buildPilotWorkflowPlan } from "./pilotWorkflow.js";
import type { BuyerValueScenario } from "./buyerValueScenario.js";
import type { LaunchRoom, LaunchRoomStatus } from "./launchRoom.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";
import type { WorkspaceDraft } from "./workspaceDraft.js";

export type BuyerOutcomeBriefDecision = "send-to-buyer" | "sponsor-review" | "repair-before-share";
export type BuyerOutcomeBriefStatus = "pass" | "watch" | "block";

export type BuyerOutcomeBriefMetric = {
  id: string;
  label: string;
  value: string;
  evidence: string;
  status: BuyerOutcomeBriefStatus;
};

export type BuyerOutcomeBriefProof = {
  id: string;
  label: string;
  status: BuyerOutcomeBriefStatus;
  score: number;
  evidence: string;
  action: string;
  href: string;
};

export type BuyerOutcomeBriefStory = {
  id: string;
  label: string;
  narrative: string;
  proof: string;
};

export type BuyerOutcomeBriefRedLine = {
  id: string;
  label: string;
  owner: string;
  status: BuyerOutcomeBriefStatus;
  action: string;
  href: string;
};

export type BuyerOutcomeBrief = {
  id: string;
  generatedAt: string;
  decision: BuyerOutcomeBriefDecision;
  status: BuyerOutcomeBriefStatus;
  briefScore: number;
  headline: string;
  hardTruth: string;
  decisionAsk: string;
  targetBuyer: string;
  primaryMetric: string;
  measuredOutcome: string;
  valueNarrative: string;
  metrics: BuyerOutcomeBriefMetric[];
  story: BuyerOutcomeBriefStory[];
  proof: BuyerOutcomeBriefProof[];
  redLines: BuyerOutcomeBriefRedLine[];
  nextAction: {
    label: string;
    owner: string;
    action: string;
    href: string;
  };
  exportMarkdown: string;
};

export type BuildBuyerOutcomeBriefInput = {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence">;
  pilotRun: PilotRunReceiptInput;
  launchRoom: LaunchRoom;
  generatedAt?: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function statusScore(status: BuyerOutcomeBriefStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 66;
  return 18;
}

function statusFromOutcome(status: OutcomeSnapshotStatus): BuyerOutcomeBriefStatus {
  if (status === "complete") return "pass";
  if (status === "attention") return "watch";
  return "block";
}

function statusFromLaunch(status: LaunchRoomStatus): BuyerOutcomeBriefStatus {
  if (status === "ready") return "pass";
  if (status === "attention") return "watch";
  return "block";
}

function decisionFor(input: { snapshotReadiness: string; launchVerdict: string; redLines: BuyerOutcomeBriefRedLine[]; score: number }): BuyerOutcomeBriefDecision {
  const blocked = input.redLines.some((line) => line.status === "block");
  if (input.snapshotReadiness === "publish-ready" && input.launchVerdict === "send" && !blocked && input.score >= 82) return "send-to-buyer";
  if (!blocked && input.score >= 66) return "sponsor-review";
  return "repair-before-share";
}

function headlineFor(decision: BuyerOutcomeBriefDecision) {
  if (decision === "send-to-buyer") return "A buyer can understand the value and proof from one page";
  if (decision === "sponsor-review") return "The buyer story is close, but needs sponsor review";
  return "Repair the buyer proof before sharing this publicly";
}

function hardTruthFor(decision: BuyerOutcomeBriefDecision, redLines: BuyerOutcomeBriefRedLine[]) {
  if (decision === "send-to-buyer") {
    return "The brief ties the value claim to measured pilot evidence, live proof, operating gates, and a clear buyer decision.";
  }
  const first = redLines[0];
  if (decision === "sponsor-review") {
    return first ? `${first.label} needs owner confirmation before a buyer sees this page.` : "The value case is credible, but the sponsor should clear the remaining warning before buyer delivery.";
  }
  return first ? `${first.label} blocks public buyer sharing: ${first.action}` : "The brief has a buyer-facing proof gap that would make the product feel unfinished.";
}

function decisionAskFor(decision: BuyerOutcomeBriefDecision, nextAction: { label: string; owner: string }) {
  if (decision === "send-to-buyer") return "Send this brief and ask for a bounded pilot approval.";
  if (decision === "sponsor-review") return `Ask ${nextAction.owner} to clear ${nextAction.label} before buyer delivery.`;
  return `Keep this internal until ${nextAction.label} is repaired.`;
}

function buildMetrics(input: {
  buyerScenario: BuyerValueScenario;
  pilotReceipt: ReturnType<typeof buildPilotRunReceipt>;
  launchRoom: LaunchRoom;
}): BuyerOutcomeBriefMetric[] {
  return [
    {
      id: "modeled-value",
      label: "Modeled monthly value",
      value: yen(input.buyerScenario.monthlyGrossValueYen),
      evidence: `${input.buyerScenario.monthlyHoursSaved}h/month saved, ${input.buyerScenario.paybackDays}-day payback.`,
      status: input.buyerScenario.readiness === "scales-now" ? "pass" : input.buyerScenario.readiness === "pilot-first" ? "watch" : "block"
    },
    {
      id: "measured-value",
      label: "Measured pilot value",
      value: yen(input.pilotReceipt.measuredMonthlyValueYen),
      evidence: `${input.pilotReceipt.actualMinutesSavedPerRun}m saved/run, ${input.pilotReceipt.acceptanceRatePercent}% accepted.`,
      status: input.pilotReceipt.readiness === "accepted" ? "pass" : input.pilotReceipt.readiness === "needs-evidence" ? "watch" : "block"
    },
    {
      id: "live-proof",
      label: "Live proof health",
      value: input.launchRoom.proofHealth.checkedAt ? `${input.launchRoom.proofHealth.verifiedCount}/${input.launchRoom.proofHealth.totalCount}` : "not checked",
      evidence: input.launchRoom.proofHealth.summary,
      status: statusFromLaunch(input.launchRoom.proofHealth.status)
    },
    {
      id: "buyer-decision",
      label: "Buyer decision",
      value: input.launchRoom.buyerDecision.verdict,
      evidence: input.launchRoom.buyerDecision.instruction,
      status: statusFromLaunch(input.launchRoom.buyerDecision.status)
    }
  ];
}

function buildStory(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  pilotReceipt: ReturnType<typeof buildPilotRunReceipt>;
  launchRoom: LaunchRoom;
}): BuyerOutcomeBriefStory[] {
  const selectedAgents = input.recommendation.selected.map((agent) => agent.name).slice(0, 4);
  return [
    {
      id: "buyer-job",
      label: "Buyer job",
      narrative: `${input.valueBlueprint.primaryUser} needs a repeatable way to turn release-readiness work into inspected proof, not another AI demo.`,
      proof: input.launchRoom.artifacts.find((artifact) => artifact.id === "work-order-brief")?.proof ?? input.launchRoom.nextAction.action
    },
    {
      id: "agent-work",
      label: "Agent work",
      narrative: `${selectedAgents.join(", ") || "The selected agent squad"} handles value framing, Cloud Run evidence, test/security review, and buyer handoff.`,
      proof: `${input.recommendation.selected.length} agents selected, ${input.recommendation.budgetUsed} budget used.`
    },
    {
      id: "measured-outcome",
      label: "Measured outcome",
      narrative: `The first pilot receipt converts the promise into a measured result: ${input.pilotReceipt.actualMinutesSavedPerRun} minutes saved per run.`,
      proof: `${input.pilotReceipt.acceptedTasks}/${input.pilotReceipt.totalTasks} tasks accepted by ${input.pilotReceipt.reviewerName || "the pilot reviewer"}.`
    },
    {
      id: "buyer-decision",
      label: "Buyer decision",
      narrative: input.launchRoom.buyerDecision.buyerQuestion,
      proof: input.launchRoom.buyerDecision.instruction
    }
  ];
}

function buildProof(input: ReturnType<typeof buildOutcomeSnapshot>): BuyerOutcomeBriefProof[] {
  return input.checks.map((check) => ({
    id: check.id,
    label: check.label,
    status: statusFromOutcome(check.status),
    score: check.score,
    evidence: check.evidence,
    action: check.action,
    href: check.href
  }));
}

function buildRedLines(proof: BuyerOutcomeBriefProof[]): BuyerOutcomeBriefRedLine[] {
  return proof
    .filter((item) => item.status !== "pass")
    .map((item) => ({
      id: `redline-${item.id}`,
      label: item.label,
      owner: item.id === "submission-proof" ? "Publication lead" : item.id === "deployment-proof" ? "Cloud Run SRE" : "Proof owner",
      status: item.status,
      action: item.action,
      href: item.href
    }))
    .sort((left, right) => statusScore(left.status) - statusScore(right.status));
}

function buildMarkdown(brief: Omit<BuyerOutcomeBrief, "exportMarkdown">) {
  return [
    `# ${brief.headline}`,
    "",
    "Buyer Outcome Brief",
    "",
    `Decision: ${brief.decision}`,
    `Brief score: ${brief.briefScore}/100`,
    `Target buyer: ${brief.targetBuyer}`,
    `Decision ask: ${brief.decisionAsk}`,
    "",
    brief.hardTruth,
    "",
    "## Value claim",
    brief.valueNarrative,
    "",
    "## Metrics",
    ...brief.metrics.map((metric) => `- [${metric.status}] ${metric.label}: ${metric.value} - ${metric.evidence}`),
    "",
    "## Story",
    ...brief.story.map((item) => `- ${item.label}: ${item.narrative} Proof: ${item.proof}`),
    "",
    "## Proof checks",
    ...brief.proof.map((item) => `- [${item.status}] ${item.label} (${item.score}/100): ${item.evidence}`),
    "",
    "## Red lines",
    ...(brief.redLines.length ? brief.redLines.map((line) => `- [${line.status}] ${line.label}: ${line.action} Owner: ${line.owner}`) : ["- None"])
  ].join("\n");
}

export function buildBuyerOutcomeBrief(input: BuildBuyerOutcomeBriefInput): BuyerOutcomeBrief {
  const snapshot = buildOutcomeSnapshot({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    workspace: input.workspace,
    pilotRun: input.pilotRun
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
  const metrics = buildMetrics({ buyerScenario: input.buyerScenario, pilotReceipt, launchRoom: input.launchRoom });
  const story = buildStory({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    pilotReceipt,
    launchRoom: input.launchRoom
  });
  const proof = buildProof(snapshot);
  const redLines = buildRedLines(proof);
  const briefScore = Math.round(
    clamp(input.launchRoom.launchScore * 0.34 + snapshot.outcomeScore * 0.36 + metrics.reduce((sum, metric) => sum + statusScore(metric.status), 0) / Math.max(1, metrics.length) * 0.3)
  );
  const decision = decisionFor({
    snapshotReadiness: snapshot.readiness,
    launchVerdict: input.launchRoom.buyerDecision.verdict,
    redLines,
    score: briefScore
  });
  const nextAction = redLines[0]
    ? {
        label: redLines[0].label,
        owner: redLines[0].owner,
        action: redLines[0].action,
        href: redLines[0].href
      }
    : {
        label: input.launchRoom.nextAction.label,
        owner: input.launchRoom.nextAction.owner,
        action: input.launchRoom.buyerDecision.verdict === "send" ? "Share the buyer proof packet and ask for a bounded pilot approval." : input.launchRoom.nextAction.action,
        href: input.launchRoom.nextAction.href
      };
  const status = decision === "send-to-buyer" ? "pass" : decision === "sponsor-review" ? "watch" : "block";
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const partial: Omit<BuyerOutcomeBrief, "exportMarkdown"> = {
    id: `buyer-outcome-brief-${decision}-${briefScore}`,
    generatedAt,
    decision,
    status,
    briefScore,
    headline: headlineFor(decision),
    hardTruth: hardTruthFor(decision, redLines),
    decisionAsk: decisionAskFor(decision, nextAction),
    targetBuyer: input.valueBlueprint.primaryUser,
    primaryMetric: yen(input.buyerScenario.monthlyGrossValueYen),
    measuredOutcome: `${pilotReceipt.actualMinutesSavedPerRun}m saved/run, ${pilotReceipt.acceptanceRatePercent}% accepted`,
    valueNarrative: `${input.valueBlueprint.primaryUser} gets ${yen(input.buyerScenario.monthlyGrossValueYen)} modeled monthly value from ${input.buyerScenario.monthlyHoursSaved} saved hours/month and risk reduction, backed by ${pilotReceipt.actualMinutesSavedPerRun} measured minutes saved in the first pilot run.`,
    metrics,
    story,
    proof,
    redLines,
    nextAction
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tone(status: BuyerOutcomeBriefStatus | BuyerOutcomeBriefDecision) {
  if (["pass", "send-to-buyer"].includes(status)) return "good";
  if (["block", "repair-before-share"].includes(status)) return "bad";
  return "watch";
}

function linkedHref(href: string, appUrl?: string) {
  if (!href.startsWith("#")) return href;
  return appUrl ? `${appUrl.replace(/#.*$/, "")}${href}` : href;
}

export function renderBuyerOutcomeBriefHtml(
  brief: BuyerOutcomeBrief,
  links: { appUrl?: string; launchRoomUrl?: string; proofDossierUrl?: string; globalAuditUrl?: string; jsonUrl?: string; markdownUrl?: string } = {}
) {
  const nav = [
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workspace</a>` : "",
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.proofDossierUrl ? `<a href="${escapeHtml(links.proofDossierUrl)}">Proof dossier</a>` : "",
    links.globalAuditUrl ? `<a href="${escapeHtml(links.globalAuditUrl)}">Global audit</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const metrics = brief.metrics
    .map(
      (metric) => `
        <article class="metric ${tone(metric.status)}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
          <p>${escapeHtml(metric.evidence)}</p>
        </article>`
    )
    .join("");
  const story = brief.story
    .map(
      (item) => `
        <article class="story">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.narrative)}</strong>
          <p>${escapeHtml(item.proof)}</p>
        </article>`
    )
    .join("");
  const proof = brief.proof
    .map(
      (item) => `
        <article class="proof ${tone(item.status)}">
          <div><span>${escapeHtml(item.status)}</span><b>${escapeHtml(item.score)}</b></div>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.evidence)}</p>
          <small>${escapeHtml(item.action)}</small>
          <a href="${escapeHtml(linkedHref(item.href, links.appUrl))}">${item.status === "pass" ? "Inspect" : "Repair"}</a>
        </article>`
    )
    .join("");
  const redLines = brief.redLines.length
    ? brief.redLines
        .map(
          (line) => `
            <li class="${tone(line.status)}">
              <span>${escapeHtml(line.status)}</span>
              <strong>${escapeHtml(line.label)}</strong>
              <p>${escapeHtml(line.action)}</p>
              <small>${escapeHtml(line.owner)}</small>
            </li>`
        )
        .join("")
    : `<li class="good"><span>pass</span><strong>No red lines</strong><p>The brief has no blocked buyer-facing proof checks.</p><small>${escapeHtml(brief.targetBuyer)}</small></li>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(brief.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #596862; --paper: #edf3ef; --panel: #fffdf7; --line: #cbd7d1; --teal: #0f766e; --blue: #2457a6; --rose: #b1344f; --amber: #94660f; --green-bg: #edf9f3; --blue-bg: #f0f6ff; --rose-bg: #fff1f2; --amber-bg: #fff8df; --shadow: 0 20px 52px rgba(23, 33, 38, .1); }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: linear-gradient(180deg, #e9f1ec 0, var(--paper) 280px); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1160px, calc(100% - 32px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 20px; align-items: end; padding: 42px 0 16px; }
      .eyebrow, .metric span, .story span, .proof span, .red-lines span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; text-transform: uppercase; }
      h1 { max-width: 860px; margin: 8px 0 10px; font-size: clamp(2.05rem, 5vw, 4.4rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0 0 8px; }
      p, small { margin: 0; color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      nav a, .proof a { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: var(--panel); font-weight: 900; text-decoration: none; }
      .decision-card { min-height: 220px; display: grid; place-items: center; align-content: center; gap: 8px; border: 1px solid #172126; border-radius: 8px; color: #fffdf7; background: repeating-linear-gradient(135deg, #172126 0 14px, #123f3b 14px 28px); box-shadow: var(--shadow); text-align: center; }
      .decision-card span, .decision-card small { color: rgba(255, 253, 247, .8); font-size: .76rem; font-weight: 950; text-transform: uppercase; }
      .decision-card strong { padding: 0 18px; font-size: 1.5rem; line-height: 1.08; overflow-wrap: anywhere; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .metrics, .story-grid, .proof-grid { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .story-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .proof-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .metric, .story, .proof, .decision, .red-lines { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 10px 26px rgba(23, 33, 38, .05); padding: 14px; }
      .metric { display: grid; gap: 7px; border-top: 5px solid var(--blue); }
      .metric.good, .proof.good, .red-lines li.good { border-color: #add6bd; border-top-color: var(--teal); background: var(--green-bg); }
      .metric.watch, .proof.watch, .red-lines li.watch { border-color: #e2ca86; border-top-color: var(--amber); background: var(--amber-bg); }
      .metric.bad, .proof.bad, .red-lines li.bad { border-color: #e6a9b5; border-top-color: var(--rose); background: var(--rose-bg); }
      .metric strong { font-size: 1.16rem; line-height: 1.1; overflow-wrap: anywhere; }
      .decision { display: grid; grid-template-columns: minmax(0, .9fr) minmax(280px, .45fr); gap: 12px; align-items: start; }
      .decision strong { display: block; margin-top: 6px; font-size: 1.25rem; line-height: 1.22; overflow-wrap: anywhere; }
      .red-lines ul { display: grid; gap: 8px; padding: 0; margin: 0; list-style: none; }
      .red-lines li { display: grid; gap: 5px; border: 1px solid var(--line); border-left: 5px solid var(--blue); border-radius: 8px; padding: 10px; }
      .red-lines li.good { border-left-color: var(--teal); }
      .red-lines li.watch { border-left-color: var(--amber); }
      .red-lines li.bad { border-left-color: var(--rose); }
      .story { display: grid; gap: 8px; border-left: 5px solid var(--teal); }
      .story strong { line-height: 1.22; }
      .proof { display: grid; grid-template-rows: auto auto 1fr auto auto; gap: 8px; border-top: 5px solid var(--blue); }
      .proof div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .proof b { font-size: 1.55rem; line-height: 1; }
      .proof strong, .proof p, .proof small, .story strong, .story p, .red-lines strong, .red-lines p { overflow-wrap: anywhere; }
      footer { padding: 0 0 30px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 900px) { header, .decision, .metrics, .story-grid, .proof-grid { grid-template-columns: 1fr; } .decision-card { min-height: 150px; } }
    </style>
  </head>
  <body>
    <header>
      <div>
        <span class="eyebrow">Buyer Outcome Brief</span>
        <h1>${escapeHtml(brief.headline)}</h1>
        <p>${escapeHtml(brief.hardTruth)}</p>
        <nav>${nav}</nav>
      </div>
      <div class="decision-card">
        <span>${escapeHtml(brief.decision)}</span>
        <strong>${escapeHtml(brief.decisionAsk)}</strong>
        <small>${escapeHtml(brief.targetBuyer)}</small>
      </div>
    </header>
    <main>
      <section class="metrics" aria-label="Buyer outcome metrics">${metrics}</section>
      <section class="decision" aria-label="Buyer decision">
        <div>
          <h2>Value claim</h2>
          <strong>${escapeHtml(brief.valueNarrative)}</strong>
          <p>${escapeHtml(brief.measuredOutcome)}</p>
        </div>
        <aside class="red-lines">
          <h2>Red lines</h2>
          <ul>${redLines}</ul>
        </aside>
      </section>
      <section class="story-grid" aria-label="Outcome story">${story}</section>
      <section class="proof-grid" aria-label="Proof checks">${proof}</section>
    </main>
    <footer>Generated by A2A Agent Marketplace. This brief is a buyer-facing summary, not a substitute for legal, security, or procurement review.</footer>
  </body>
</html>`;
}
