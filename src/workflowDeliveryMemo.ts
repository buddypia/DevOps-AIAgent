import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import { buildWorkflowIntakeReadiness, type WorkflowIntakeBriefInput } from "./workflowIntake.js";
import type { WorkflowIntakeProofSlot, WorkflowIntakeShareGate } from "./workflowIntakeShareGate.js";

export type WorkflowDeliveryMemoDecision = "send-to-buyer" | "internal-review" | "hold-internal";
export type WorkflowDeliveryProofStatus = "verified" | "attached" | "review" | "missing" | "blocked";
export type WorkflowDeliveryBridgeStatus = "ready" | "watch" | "blocked";

export type WorkflowDeliveryProofRow = {
  id: string;
  label: string;
  status: WorkflowDeliveryProofStatus;
  evidence: string;
  href: string;
};

export type WorkflowDeliveryBridgeMetric = {
  id: string;
  label: string;
  value: string;
  evidence: string;
  status: WorkflowDeliveryBridgeStatus;
};

export type WorkflowDeliveryDecisionBridge = {
  headline: string;
  buyerCondition: string;
  measuredSupport: string;
  metrics: WorkflowDeliveryBridgeMetric[];
};

export type WorkflowDeliveryMemo = {
  decision: WorkflowDeliveryMemoDecision;
  headline: string;
  subject: string;
  body: string;
  primaryAsk: string;
  decisionBridge: WorkflowDeliveryDecisionBridge;
  riskSummary: string;
  proofRows: WorkflowDeliveryProofRow[];
  nextSteps: string[];
  copyText: string;
  exportMarkdown: string;
};

type WorkflowDeliveryMemoInput = WorkflowIntakeBriefInput & {
  proofLinks: WorkflowIntakeProofSlot[];
  proofVerification?: BuyerShareGateProofVerificationSummary | null;
  shareGate?: WorkflowIntakeShareGate | null;
  launchRoomHref: string;
  proofAuditHref: string;
  trustManifestHref: string;
  value: {
    monthlyGrossValueYen: number;
    paybackDays: number;
    confidenceScore: number;
  };
};

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function yen(value: number) {
  return `${Math.round(Math.max(0, value)).toLocaleString("ja-JP")} yen`;
}

function minutesSaved(input: WorkflowIntakeBriefInput) {
  return Math.max(0, input.pilotRun.observedManualMinutes - input.pilotRun.observedAssistedMinutes);
}

function acceptanceRate(input: WorkflowIntakeBriefInput) {
  return Math.round((Math.max(0, input.pilotRun.acceptedTasks) / Math.max(1, input.pilotRun.totalTasks)) * 100);
}

function measuredMonthlyHoursSaved(input: WorkflowIntakeBriefInput) {
  const adoptionRate = Math.max(0, input.buyerScenario.adoptionRatePercent) / 100;
  const hours = (minutesSaved(input) / 60) * Math.max(0, input.buyerScenario.cyclesPerMonth) * adoptionRate;
  return Math.round(hours * 10) / 10;
}

function measuredMonthlyLaborValueYen(input: WorkflowIntakeBriefInput) {
  return Math.round((measuredMonthlyHoursSaved(input) * Math.max(0, input.buyerScenario.hourlyCostYen)) / 1000) * 1000;
}

function targetLabel(input: WorkflowIntakeBriefInput) {
  return input.workOrder.targetUser.trim() || "buyer sponsor";
}

function workflowLabel(input: WorkflowIntakeBriefInput) {
  return input.workOrder.request.trim() || "the proposed AI-agent workflow";
}

function proofStatus(link: WorkflowIntakeProofSlot, verification?: BuyerShareGateProofVerificationSummary | null): WorkflowDeliveryProofStatus {
  const result = verification?.results.find((item) => item.id === link.id);
  if (result?.status === "pass") return "verified";
  if (result?.status === "watch") return "review";
  if (result?.status === "block") return "blocked";
  return isBuyerFacingProofUrl(link.value) ? "attached" : "missing";
}

function proofEvidence(link: WorkflowIntakeProofSlot, status: WorkflowDeliveryProofStatus, verification?: BuyerShareGateProofVerificationSummary | null) {
  const result = verification?.results.find((item) => item.id === link.id);
  if (result) return result.evidence;
  if (status === "attached") return "Public HTTPS URL attached; live verification has not run.";
  if (status === "missing") return "No public HTTPS URL is attached.";
  return "Proof link needs review.";
}

function decisionFrom(input: WorkflowDeliveryMemoInput): WorkflowDeliveryMemoDecision {
  const readiness = buildWorkflowIntakeReadiness(input);
  if (input.shareGate?.decision === "share-ready") return "send-to-buyer";
  if (input.shareGate?.decision === "blocked" || readiness.decision === "do-not-share") return "hold-internal";
  return "internal-review";
}

function headlineFor(decision: WorkflowDeliveryMemoDecision) {
  if (decision === "send-to-buyer") return "Buyer delivery memo is ready";
  if (decision === "internal-review") return "Memo needs internal proof review";
  return "Hold this memo inside the workspace";
}

function riskSummaryFor(input: WorkflowDeliveryMemoInput, decision: WorkflowDeliveryMemoDecision, rows: WorkflowDeliveryProofRow[]) {
  const firstOpenCheck = input.shareGate?.checks.find((check) => check.status !== "clear");
  const openProofCount = rows.filter((row) => row.status !== "verified").length;
  if (decision === "send-to-buyer") return "All proof slots are live-verified and the packet can be sent with the current launch room.";
  if (firstOpenCheck) return `${firstOpenCheck.label}: ${firstOpenCheck.fix}`;
  if (openProofCount > 0) return `${openProofCount} proof link${openProofCount === 1 ? "" : "s"} still need verification before buyer delivery.`;
  return "Run the final proof audit before sending this memo externally.";
}

function nextStepsFor(input: WorkflowDeliveryMemoInput, decision: WorkflowDeliveryMemoDecision, rows: WorkflowDeliveryProofRow[]) {
  const firstOpenCheck = input.shareGate?.checks.find((check) => check.status !== "clear");
  if (decision === "send-to-buyer") {
    return [
      "Send the launch room and ask for a continue, revise, or stop decision.",
      "Keep the proof audit and trust manifest attached for reviewer inspection.",
      "Record the sponsor response in the pilot receipt before expanding scope."
    ];
  }

  const firstOpenProof = rows.find((row) => row.status === "blocked" || row.status === "missing" || row.status === "review" || row.status === "attached");
  return [
    firstOpenCheck?.fix ?? firstOpenProof?.evidence ?? "Close the first open proof item.",
    "Run live verification again after changing any proof URL.",
    "Send only after the external share gate reads share-ready."
  ];
}

function buildDecisionBridge(input: WorkflowDeliveryMemoInput, decision: WorkflowDeliveryMemoDecision, saved: number): WorkflowDeliveryDecisionBridge {
  const target = targetLabel(input);
  const acceptedRate = acceptanceRate(input);
  const measuredHours = measuredMonthlyHoursSaved(input);
  const measuredValueYen = measuredMonthlyLaborValueYen(input);
  const measuredSupportPercent = Math.round((measuredValueYen / Math.max(1, input.value.monthlyGrossValueYen)) * 100);
  const valueStatus: WorkflowDeliveryBridgeStatus =
    input.value.monthlyGrossValueYen > 0 && input.value.paybackDays <= 45 && input.value.confidenceScore >= 70
      ? "ready"
      : input.value.monthlyGrossValueYen > 0 && input.value.paybackDays <= 90 && input.value.confidenceScore >= 55
        ? "watch"
        : "blocked";
  const measuredStatus: WorkflowDeliveryBridgeStatus = saved > 0 && acceptedRate >= 80 ? "ready" : saved > 0 && acceptedRate >= 50 ? "watch" : "blocked";
  const gateStatus: WorkflowDeliveryBridgeStatus = decision === "send-to-buyer" ? "ready" : decision === "internal-review" ? "watch" : "blocked";
  const headline =
    decision === "send-to-buyer"
      ? "Send with measured proof and live links"
      : decision === "internal-review"
        ? "Value is modeled, but proof review is still open"
        : "Keep this internal until the buyer-safe boundary is fixed";
  const buyerCondition =
    decision === "send-to-buyer"
      ? `Buyer should approve a bounded pilot when ${target} accepts the measured savings, live proof, and ${input.workOrder.dataSensitivity} data boundary.`
      : decision === "internal-review"
        ? `Buyer review should wait until ${target} has live proof links and a clean share gate.`
        : `Buyer review should stay closed until ${target} has a safe data boundary and verified proof.`;

  return {
    headline,
    buyerCondition,
    measuredSupport: `Measured run backs ${measuredSupportPercent}% of modeled monthly value using labor savings only.`,
    metrics: [
      {
        id: "modeled-value",
        label: "Modeled value",
        value: `${yen(input.value.monthlyGrossValueYen)} / month`,
        evidence: `${input.value.paybackDays} day payback with ${input.value.confidenceScore}/100 confidence.`,
        status: valueStatus
      },
      {
        id: "measured-run",
        label: "Measured support",
        value: `${yen(measuredValueYen)} / month`,
        evidence: `${saved} minutes saved/run, ${measuredHours.toLocaleString("ja-JP")} hours/month, ${acceptedRate}% accepted.`,
        status: measuredStatus
      },
      {
        id: "share-gate",
        label: "External gate",
        value: decision === "send-to-buyer" ? "send-ready" : decision === "internal-review" ? "review first" : "hold internal",
        evidence: input.shareGate ? `${input.shareGate.score}/100 share score across buyer proof checks.` : "Share gate has not run for this memo.",
        status: gateStatus
      }
    ]
  };
}

function buildMarkdown(memo: Omit<WorkflowDeliveryMemo, "copyText" | "exportMarkdown">, input: WorkflowDeliveryMemoInput) {
  return [
    `# ${memo.headline}`,
    "",
    `Decision: ${memo.decision}`,
    `Subject: ${memo.subject}`,
    "",
    "## Message",
    memo.body,
    "",
    `Primary ask: ${memo.primaryAsk}`,
    "",
    "## Buyer decision bridge",
    memo.decisionBridge.headline,
    `Buyer condition: ${memo.decisionBridge.buyerCondition}`,
    `Measured support: ${memo.decisionBridge.measuredSupport}`,
    ...memo.decisionBridge.metrics.map((metric) => `- [${metric.status}] ${metric.label}: ${metric.value}. ${metric.evidence}`),
    "",
    "## Proof links",
    ...memo.proofRows.map((row) => `- [${row.status}] ${row.label}: ${row.evidence} (${row.href})`),
    "",
    "## Open risk",
    memo.riskSummary,
    "",
    "## Next steps",
    ...memo.nextSteps.map((step) => `- ${step}`),
    "",
    "## Workspace links",
    `- Launch room: ${input.launchRoomHref}`,
    `- Proof audit: ${input.proofAuditHref}`,
    `- Trust manifest: ${input.trustManifestHref}`
  ].join("\n");
}

export function buildWorkflowDeliveryMemo(input: WorkflowDeliveryMemoInput): WorkflowDeliveryMemo {
  const decision = decisionFrom(input);
  const saved = minutesSaved(input);
  const target = targetLabel(input);
  const workflow = workflowLabel(input);
  const proofRows = input.proofLinks.map((link) => {
    const status = proofStatus(link, input.proofVerification);
    return {
      id: link.id,
      label: link.label,
      status,
      evidence: proofEvidence(link, status, input.proofVerification),
      href: link.value.trim() || link.href
    };
  });
  const primaryAsk =
    decision === "send-to-buyer"
      ? "Approve continue, revise, or stop after reviewing the launch room."
      : decision === "internal-review"
        ? "Review the open proof gaps before this leaves the team."
        : "Do not send externally until the blocker is removed.";
  const body = [
    `${target} is evaluating a bounded AI-agent pilot for ${workflow}.`,
    `Current measured run: ${input.pilotRun.observedManualMinutes} manual minutes vs ${input.pilotRun.observedAssistedMinutes} assisted minutes, ${saved} minutes saved/run, ${input.pilotRun.acceptedTasks}/${input.pilotRun.totalTasks} tasks accepted.`,
    `Value case: ${yen(input.value.monthlyGrossValueYen)} monthly gross value, ${input.value.paybackDays} day payback, ${input.value.confidenceScore}/100 confidence.`,
    `Decision boundary: ${input.workOrder.dataSensitivity} data. ${primaryAsk}`
  ].join(" ");
  const subjectPrefix = decision === "send-to-buyer" ? "Buyer pilot packet ready" : decision === "internal-review" ? "Review buyer pilot packet" : "Hold buyer pilot packet";
  const decisionBridge = buildDecisionBridge(input, decision, saved);
  const riskSummary = riskSummaryFor(input, decision, proofRows);
  const nextSteps = nextStepsFor(input, decision, proofRows);
  const partial: Omit<WorkflowDeliveryMemo, "copyText" | "exportMarkdown"> = {
    decision,
    headline: headlineFor(decision),
    subject: `${subjectPrefix}: ${target}`,
    body,
    primaryAsk,
    decisionBridge,
    riskSummary,
    proofRows,
    nextSteps
  };
  const exportMarkdown = buildMarkdown(partial, input);

  return {
    ...partial,
    copyText: [
      `Subject: ${partial.subject}`,
      "",
      partial.body,
      "",
      `Decision bridge: ${partial.decisionBridge.headline}`,
      partial.decisionBridge.measuredSupport,
      `Buyer condition: ${partial.decisionBridge.buyerCondition}`,
      "",
      `Ask: ${partial.primaryAsk}`,
      "",
      `Launch room: ${input.launchRoomHref}`,
      `Proof audit: ${input.proofAuditHref}`
    ].join("\n"),
    exportMarkdown
  };
}

function tone(status: WorkflowDeliveryProofStatus | WorkflowDeliveryMemoDecision | WorkflowDeliveryBridgeStatus) {
  if (status === "verified" || status === "send-to-buyer" || status === "ready") return "good";
  if (status === "blocked" || status === "missing" || status === "hold-internal") return "bad";
  return "watch";
}

export function renderWorkflowDeliveryMemoHtml(
  memo: WorkflowDeliveryMemo,
  links: {
    jsonUrl: string;
    markdownUrl: string;
    appUrl: string;
    launchRoomUrl: string;
    proofAuditUrl: string;
    trustManifestUrl: string;
  }
) {
  const proofRows = memo.proofRows
    .map(
      (row) => `
        <article class="${tone(row.status)}">
          <div><span>${escapeHtml(row.status)}</span><strong>${escapeHtml(row.label)}</strong></div>
          <p>${escapeHtml(row.evidence)}</p>
          <a href="${escapeHtml(row.href)}">Open proof</a>
        </article>`
    )
    .join("");
  const bridgeRows = memo.decisionBridge.metrics
    .map(
      (metric) => `
        <article class="${tone(metric.status)}">
          <div><span>${escapeHtml(metric.status)}</span><strong>${escapeHtml(metric.label)}</strong></div>
          <strong>${escapeHtml(metric.value)}</strong>
          <p>${escapeHtml(metric.evidence)}</p>
        </article>`
    )
    .join("");
  const nextSteps = memo.nextSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  const nav = [
    `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>`,
    `<a href="${escapeHtml(links.proofAuditUrl)}">Proof audit</a>`,
    `<a href="${escapeHtml(links.trustManifestUrl)}">Trust manifest</a>`,
    `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>`,
    `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>`,
    `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>`
  ].join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(memo.subject)}</title>
    <style>
      :root { color-scheme: light; --ink: #14201d; --muted: #52645f; --line: #cbd8d2; --paper: #eef3ef; --panel: #fffdf7; --teal: #0f766e; --blue: #2457a6; --green: #edf8f1; --amber: #fff7dd; --rose: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; min-width: 320px; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 34px 0 18px; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: stretch; }
      .eyebrow, .metric span, article span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 880px; margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4rem); line-height: .98; letter-spacing: 0; }
      p { color: var(--muted); overflow-wrap: anywhere; }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      nav a, article a { min-height: 34px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 900; font-size: .82rem; text-decoration: none; }
      .stamp { min-height: 100%; display: grid; align-content: center; gap: 8px; padding: 18px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #14201d, #2457a6); }
      .stamp span { color: #d8fff5; font-size: .75rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { font-size: 1.35rem; line-height: 1.05; overflow-wrap: anywhere; }
      .stamp p { margin: 0; color: rgba(255, 253, 247, .76); }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .message, .bridge, .risk, .proof-grid article, .bridge-grid article { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(20, 32, 29, .07); }
      .message, .bridge, .risk { padding: 16px; }
      .message strong { display: block; margin: 5px 0 8px; font-size: 1.2rem; overflow-wrap: anywhere; }
      .bridge { display: grid; grid-template-columns: minmax(220px, .34fr) minmax(0, 1fr); gap: 14px; align-items: start; }
      .bridge-head { display: grid; gap: 6px; }
      .bridge-head strong { font-size: 1.2rem; line-height: 1.12; overflow-wrap: anywhere; }
      .bridge-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
      .bridge-grid article { display: grid; grid-template-rows: auto auto 1fr; gap: 8px; padding: 12px; border-left: 5px solid #f2b84b; box-shadow: none; }
      .bridge-grid article.good { border-left-color: #0f766e; background: var(--green); }
      .bridge-grid article.watch { border-left-color: #f2b84b; background: var(--amber); }
      .bridge-grid article.bad { border-left-color: #b56576; background: var(--rose); }
      .proof-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 9px; }
      .proof-grid article { display: grid; grid-template-rows: auto minmax(64px, 1fr) auto; gap: 8px; padding: 12px; border-top: 5px solid #f2b84b; }
      .proof-grid article.good { border-top-color: #0f766e; background: var(--green); }
      .proof-grid article.watch { border-top-color: #f2b84b; background: var(--amber); }
      .proof-grid article.bad { border-top-color: #b56576; background: var(--rose); }
      article div { display: grid; gap: 4px; }
      article strong { overflow-wrap: anywhere; }
      .risk { display: grid; grid-template-columns: minmax(220px, .34fr) minmax(0, 1fr); gap: 16px; }
      .risk ol { display: grid; gap: 5px; margin: 0; padding-left: 20px; color: var(--muted); }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .85rem; }
      @media (max-width: 900px) { .hero, .bridge, .risk { grid-template-columns: 1fr; } .bridge-grid, .proof-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 560px) { header, main, footer { width: min(100% - 24px, 640px); } .bridge-grid, .proof-grid { grid-template-columns: 1fr; } nav a, article a { width: 100%; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Buyer Delivery Memo</span>
          <h1>${escapeHtml(memo.headline)}</h1>
          <p>${escapeHtml(memo.primaryAsk)}</p>
          <nav>${nav}</nav>
        </div>
        <aside class="stamp">
          <span>Decision</span>
          <strong>${escapeHtml(memo.decision)}</strong>
          <p>${escapeHtml(memo.subject)}</p>
        </aside>
      </div>
    </header>
    <main>
      <section class="message">
        <h2>Message</h2>
        <strong>${escapeHtml(memo.subject)}</strong>
        <p>${escapeHtml(memo.body)}</p>
      </section>
      <section class="bridge" aria-label="Buyer decision bridge">
        <div class="bridge-head">
          <h2>Buyer decision bridge</h2>
          <strong>${escapeHtml(memo.decisionBridge.headline)}</strong>
          <p>${escapeHtml(memo.decisionBridge.buyerCondition)}</p>
          <p>${escapeHtml(memo.decisionBridge.measuredSupport)}</p>
        </div>
        <div class="bridge-grid">${bridgeRows}</div>
      </section>
      <section class="proof-grid" aria-label="Proof rows">${proofRows}</section>
      <section class="risk ${tone(memo.decision)}">
        <div>
          <h2>Open risk</h2>
          <p>${escapeHtml(memo.riskSummary)}</p>
        </div>
        <ol>${nextSteps}</ol>
      </section>
    </main>
    <footer>Generated by A2A Agent Marketplace from the current buyer workspace and live proof verification.</footer>
  </body>
</html>`;
}
