import type { BuyerProofMonitor, BuyerProofMonitorStatus } from "./buyerProofMonitor.js";
import type { BuyerProofRecoveryReceipt } from "./buyerProofRecoveryReceipt.js";
import type {
  BuyerShareGateProofLink,
  BuyerShareGateProofVerification,
  BuyerShareGateProofVerificationSummary
} from "./buyerShareGate.js";

export type BuyerProofRecoverySeverity = "no-incident" | "watch" | "incident";

export type BuyerProofRecoveryStep = {
  id: string;
  label: string;
  status: BuyerProofMonitorStatus;
  owner: string;
  due: string;
  source: string;
  action: string;
  acceptance: string;
  href?: string;
};

export type BuyerProofRecoveryRepairPacket = {
  subject: string;
  title: string;
  owner: string;
  due: string;
  severity: BuyerProofRecoverySeverity;
  bodyLines: string[];
  checklist: string[];
  copyText: string;
  href: string;
};

export type BuyerProofRecoveryTaskLedger = {
  filename: string;
  taskCount: number;
  csvText: string;
  href: string;
};

export type BuyerProofRecoveryPlan = {
  severity: BuyerProofRecoverySeverity;
  headline: string;
  decision: string;
  shareInstruction: string;
  firstAction: string;
  checkedAt: string;
  openTaskCount: number;
  blockedTaskCount: number;
  watchTaskCount: number;
  steps: BuyerProofRecoveryStep[];
  resumeCriteria: string[];
  repairPacket: BuyerProofRecoveryRepairPacket;
  taskLedger: BuyerProofRecoveryTaskLedger;
  exportMarkdown: string;
};

type ResolutionGuide = {
  owner: string;
  source: string;
  blockAction: string;
  watchAction: string;
  acceptance: string;
};

const RESOLUTION_GUIDES: Record<string, ResolutionGuide> = {
  targetUrl: {
    owner: "DevOps owner",
    source: "Cloud Run proof",
    blockAction: "Redeploy the service or replace the deployed URL, then verify it from a clean public session.",
    watchAction: "Rerun the public check and pin a stable deployed URL before buyer delivery.",
    acceptance: "The deployed URL returns a public 2xx or 3xx response without local-only access."
  },
  protopediaUrl: {
    owner: "Launch owner",
    source: "Submission proof",
    blockAction: "Publish or replace the ProtoPedia page URL, then confirm it opens outside the workspace.",
    watchAction: "Recheck the ProtoPedia URL and keep a fallback submission note ready.",
    acceptance: "The ProtoPedia page is publicly reachable and includes the required submission content."
  },
  videoUrl: {
    owner: "Demo owner",
    source: "Usage proof",
    blockAction: "Make the walkthrough video public or unlisted, or attach a replacement walkthrough URL.",
    watchAction: "Move the walkthrough video to a stable public URL before the next buyer send.",
    acceptance: "The video opens from a clean browser session and shows the core buyer workflow."
  },
  pilotEvidenceUrl: {
    owner: "Pilot owner",
    source: "Measured run proof",
    blockAction: "Fix document sharing or export the pilot receipt to a public artifact URL.",
    watchAction: "Recheck the pilot receipt permission and prepare a static export fallback.",
    acceptance: "The pilot receipt is readable without account-specific permission and cites measured value."
  },
  workOrderEvidenceUrl: {
    owner: "Buyer PM",
    source: "Scope proof",
    blockAction: "Publish the work order proof or attach a public issue, markdown brief, or signed scope artifact.",
    watchAction: "Recheck the work order URL and keep a public scope summary ready.",
    acceptance: "The work order proof states scope, buyer owner, and acceptance signal in a public artifact."
  }
};

function guideFor(link: BuyerShareGateProofLink | undefined, result?: BuyerShareGateProofVerification): ResolutionGuide {
  return (
    RESOLUTION_GUIDES[result?.id ?? link?.id ?? ""] ?? {
      owner: "Launch operator",
      source: result?.label ?? link?.label ?? "Buyer proof",
      blockAction: "Replace the blocked proof with a public artifact and rerun live verification.",
      watchAction: "Recheck this proof and replace it if the warning repeats.",
      acceptance: "The proof is public, current, and passes the live proof check."
    }
  );
}

function dueFor(status: BuyerProofMonitorStatus) {
  if (status === "block") return "Now";
  if (status === "watch") return "Before buyer send";
  return "Within 24 hours";
}

function severityFrom(monitor: BuyerProofMonitor): BuyerProofRecoverySeverity {
  if (monitor.stopExternalSharing || monitor.readiness === "not-armed") return "incident";
  if (monitor.readiness === "evidence-watch") return "watch";
  return "no-incident";
}

function headlineFor(severity: BuyerProofRecoverySeverity, monitor: BuyerProofMonitor) {
  if (monitor.readiness === "not-armed") return "Proof recovery is waiting on live verification";
  if (severity === "incident") return "Proof incident response is active";
  if (severity === "watch") return "Proof warning has an owner and retry path";
  return "No buyer proof incident is open";
}

function decisionFor(severity: BuyerProofRecoverySeverity, monitor: BuyerProofMonitor) {
  if (monitor.readiness === "not-armed") return "Hold external sharing until a live proof check creates a timestamp and task list.";
  if (severity === "incident") return "Freeze external sharing until blocked proof is fixed, verified, and exported.";
  if (severity === "watch") return "Keep internal review moving, but recheck or replace the warning before buyer delivery.";
  return "Keep the launch room open, with a routine proof recheck every 24 hours.";
}

function shareInstructionFor(severity: BuyerProofRecoverySeverity, monitor: BuyerProofMonitor) {
  if (monitor.readiness === "not-armed" || severity === "incident") return "Freeze external sharing";
  if (severity === "watch") return "Internal review only";
  return "External sharing open";
}

function buildProofStep(
  result: BuyerShareGateProofVerification,
  link: BuyerShareGateProofLink | undefined
): BuyerProofRecoveryStep {
  const guide = guideFor(link, result);
  return {
    id: `proof-${result.id}`,
    label: result.label,
    status: result.status,
    owner: guide.owner,
    due: dueFor(result.status),
    source: guide.source,
    action: result.status === "block" ? guide.blockAction : guide.watchAction,
    acceptance: guide.acceptance,
    href: link?.href
  };
}

function buildFreshnessStep(monitor: BuyerProofMonitor): BuyerProofRecoveryStep | undefined {
  const check = monitor.checks.find((candidate) => candidate.id === "freshness");
  if (!check || check.status === "pass") return undefined;
  return {
    id: "monitor-freshness",
    label: check.label,
    status: check.status,
    owner: check.owner,
    due: dueFor(check.status),
    source: "Proof monitor",
    action: check.nextCheck,
    acceptance: "The proof monitor has a fresh checkedAt timestamp under 24 hours old.",
    href: "#launch-evidence-console"
  };
}

function buildUnarmedSteps(proofLinks: BuyerShareGateProofLink[], monitor: BuyerProofMonitor): BuyerProofRecoveryStep[] {
  const attached = proofLinks.filter((link) => /^https?:\/\//i.test(link.value.trim())).length;
  const verificationCheck = monitor.checks.find((check) => check.id === "verification-run");
  return [
    {
      id: "run-live-verification",
      label: "Run live proof verification",
      status: "block",
      owner: verificationCheck?.owner ?? "Launch operator",
      due: "Now",
      source: "Buyer proof intake",
      action: verificationCheck?.nextCheck ?? "Run Verify live links before external sharing.",
      acceptance: `A live proof check exists for the current ${attached}/${proofLinks.length} attached proof URLs.`,
      href: "#launch-evidence-console"
    }
  ];
}

function buildRoutineStep(): BuyerProofRecoveryStep {
  return {
    id: "routine-recheck",
    label: "Routine proof recheck",
    status: "pass",
    owner: "Launch operator",
    due: "Within 24 hours",
    source: "Proof monitor",
    action: "Recheck all buyer proof links every 24 hours while the launch room is under review.",
    acceptance: "The next proof monitor export is attached to the launch room handoff.",
    href: "#launch-evidence-console"
  };
}

function resumeCriteriaFor(severity: BuyerProofRecoverySeverity, monitor: BuyerProofMonitor) {
  if (monitor.readiness === "not-armed") {
    return [
      "Live proof verification has been run for the current URLs.",
      "Every blocked proof URL has an owner and replacement path.",
      "Buyer Share Gate is rerun after verification."
    ];
  }
  if (severity === "incident") {
    return [
      "Every blocked proof URL is fixed or replaced.",
      "Freshness check is under 24 hours old.",
      "Buyer Share Gate has no blocked checks after rerun."
    ];
  }
  if (severity === "watch") {
    return [
      "Every warning proof URL passes on recheck.",
      "Freshness check remains under 24 hours old.",
      "Latest proof monitor export is attached before buyer delivery."
    ];
  }
  return [
    "Daily live proof check remains scheduled.",
    "Latest proof monitor export is kept with the launch room handoff."
  ];
}

function buildMarkdown(plan: Omit<BuyerProofRecoveryPlan, "exportMarkdown">) {
  return [
    `# ${plan.headline}`,
    "",
    "Buyer Proof Recovery Desk",
    "",
    `Severity: ${plan.severity}`,
    `Share instruction: ${plan.shareInstruction}`,
    `Checked at: ${plan.checkedAt || "not checked"}`,
    `Open tasks: ${plan.openTaskCount}`,
    "",
    plan.decision,
    "",
    `First action: ${plan.firstAction}`,
    "",
    "## Recovery tasks",
    ...plan.steps.map((step) => `- [${step.status}] ${step.label} (${step.owner}, ${step.due}): ${step.action} Acceptance: ${step.acceptance}`),
    "",
    "## Resume criteria",
    ...plan.resumeCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Repair packet",
    `Subject: ${plan.repairPacket.subject}`,
    `Owner: ${plan.repairPacket.owner}`,
    `Due: ${plan.repairPacket.due}`,
    `Task ledger: ${plan.taskLedger.filename}`,
    "",
    ...plan.repairPacket.bodyLines.map((line) => `- ${line}`),
    "",
    "### Checklist",
    ...plan.repairPacket.checklist.map((item) => `- [ ] ${item}`)
  ].join("\n");
}

function buildRepairPacket(plan: Omit<BuyerProofRecoveryPlan, "repairPacket" | "taskLedger" | "exportMarkdown">): BuyerProofRecoveryRepairPacket {
  const firstOpen = plan.steps.find((step) => step.status !== "pass") ?? plan.steps[0];
  const owner = firstOpen?.owner ?? "Launch operator";
  const due = firstOpen?.due ?? "Within 24 hours";
  const title =
    plan.severity === "no-incident"
      ? "Schedule buyer proof recheck"
      : `Repair buyer proof: ${firstOpen?.label ?? "open evidence"}`;
  const subject = `[${plan.shareInstruction}] ${title}`;
  const taskLines = plan.steps.map((step) => `${step.label} (${step.status}, ${step.owner}, ${step.due}): ${step.action}`);
  const bodyLines = [
    plan.decision,
    `First action: ${plan.firstAction}`,
    `Checked at: ${plan.checkedAt || "not checked"}`,
    `Open tasks: ${plan.openTaskCount} (${plan.blockedTaskCount} block / ${plan.watchTaskCount} watch)`,
    ...taskLines
  ];
  const checklist = [
    ...plan.steps.map((step) => step.acceptance),
    ...plan.resumeCriteria
  ];
  const copyText = [
    `# ${title}`,
    "",
    `Subject: ${subject}`,
    `Owner: ${owner}`,
    `Due: ${due}`,
    `Severity: ${plan.severity}`,
    "",
    "## Body",
    ...bodyLines.map((line) => `- ${line}`),
    "",
    "## Checklist",
    ...checklist.map((item) => `- [ ] ${item}`)
  ].join("\n");

  return {
    subject,
    title,
    owner,
    due,
    severity: plan.severity,
    bodyLines,
    checklist,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}

function escapeCsvCell(value: string | number) {
  const text = String(value);
  const escaped = text.replace(/"/g, "\"\"");
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function buildTaskLedger(plan: Omit<BuyerProofRecoveryPlan, "repairPacket" | "taskLedger" | "exportMarkdown">): BuyerProofRecoveryTaskLedger {
  const rows = [
    ["taskId", "label", "status", "owner", "due", "source", "action", "acceptance", "href"],
    ...plan.steps.map((step) => [
      step.id,
      step.label,
      step.status,
      step.owner,
      step.due,
      step.source,
      step.action,
      step.acceptance,
      step.href ?? ""
    ])
  ];
  const csvText = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const filename = plan.severity === "no-incident" ? "buyer-proof-routine-tasks.csv" : "buyer-proof-recovery-tasks.csv";

  return {
    filename,
    taskCount: plan.steps.length,
    csvText,
    href: `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`
  };
}

export function buildBuyerProofRecoveryPlan(input: {
  proofLinks: BuyerShareGateProofLink[];
  monitor: BuyerProofMonitor;
  verification?: BuyerShareGateProofVerificationSummary | null;
}): BuyerProofRecoveryPlan {
  const verification = input.verification ?? undefined;
  const severity = severityFrom(input.monitor);
  const linkById = new Map(input.proofLinks.map((link) => [link.id, link]));
  const openProofSteps = verification
    ? verification.results
        .filter((result) => result.status !== "pass")
        .map((result) => buildProofStep(result, linkById.get(result.id)))
    : buildUnarmedSteps(input.proofLinks, input.monitor);
  const freshnessStep = verification ? buildFreshnessStep(input.monitor) : undefined;
  const steps = [...openProofSteps, ...(freshnessStep ? [freshnessStep] : [])];
  const resolvedSteps = steps.length > 0 ? steps : [buildRoutineStep()];
  const openTaskCount = resolvedSteps.filter((step) => step.status !== "pass").length;
  const blockedTaskCount = resolvedSteps.filter((step) => step.status === "block").length;
  const watchTaskCount = resolvedSteps.filter((step) => step.status === "watch").length;
  const partial: Omit<BuyerProofRecoveryPlan, "repairPacket" | "taskLedger" | "exportMarkdown"> = {
    severity,
    headline: headlineFor(severity, input.monitor),
    decision: decisionFor(severity, input.monitor),
    shareInstruction: shareInstructionFor(severity, input.monitor),
    firstAction: resolvedSteps[0]?.action ?? "Keep the proof monitor current.",
    checkedAt: input.monitor.checkedAt,
    openTaskCount,
    blockedTaskCount,
    watchTaskCount,
    steps: resolvedSteps,
    resumeCriteria: resumeCriteriaFor(severity, input.monitor)
  };
  const plan = {
    ...partial,
    repairPacket: buildRepairPacket(partial),
    taskLedger: buildTaskLedger(partial)
  };

  return {
    ...plan,
    exportMarkdown: buildMarkdown(plan)
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

function tone(status: BuyerProofMonitorStatus | BuyerProofRecoverySeverity) {
  if (status === "pass" || status === "no-incident") return "pass";
  if (status === "watch") return "watch";
  return "block";
}

export function renderBuyerProofRecoveryPlanHtml(
  plan: BuyerProofRecoveryPlan,
  links: { appUrl?: string; monitorUrl?: string; launchRoomUrl?: string; jsonUrl?: string; markdownUrl?: string } = {},
  receipt?: Pick<BuyerProofRecoveryReceipt, "href" | "payloadHref" | "verificationRequestHref">
) {
  const nav = [
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workspace</a>` : "",
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.monitorUrl ? `<a href="${escapeHtml(links.monitorUrl)}">Proof monitor</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const steps = plan.steps
    .map(
      (step) => `
        <article class="${tone(step.status)}">
          <div><span>${escapeHtml(step.status)}</span><strong>${escapeHtml(step.label)}</strong><b>${escapeHtml(step.due)}</b></div>
          <p>${escapeHtml(step.action)}</p>
          <small>${escapeHtml(step.owner)} - ${escapeHtml(step.source)}</small>
          <footer>${escapeHtml(step.acceptance)}</footer>
        </article>`
    )
    .join("");
  const criteria = plan.resumeCriteria.map((criterion) => `<li>${escapeHtml(criterion)}</li>`).join("");
  const packetLines = plan.repairPacket.bodyLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const packetChecklist = plan.repairPacket.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const receiptLinks = receipt
    ? `
          <a href="${escapeHtml(receipt.href)}" download="buyer-proof-recovery-receipt.md">Download receipt</a>
          <a href="${escapeHtml(receipt.payloadHref)}" download="buyer-proof-recovery-replay-payload.json">Download replay payload</a>
          <a href="${escapeHtml(receipt.verificationRequestHref)}" download="buyer-proof-recovery-verify-request.json">Download verify request</a>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(plan.headline)}</title>
    <style>
      :root { color: #172126; background: #eef2ed; font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; }
      header, main, footer { width: min(1160px, calc(100% - 28px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: end; padding: 30px 0 14px; }
      h1, h2, p { margin: 0; }
      h1 { max-width: 860px; font-size: clamp(2.1rem, 5vw, 4.4rem); line-height: .96; letter-spacing: 0; }
      nav { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
      nav a { border: 1px solid #c8d4ce; border-radius: 999px; padding: 8px 11px; color: #172126; background: #fffdf7; font-size: .84rem; font-weight: 850; text-decoration: none; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 230px; gap: 14px; padding: 18px; border: 1px solid #172126; border-radius: 8px; color: #fffdf7; background: linear-gradient(135deg, #172126, #b56576); }
      .hero p { max-width: 760px; margin-top: 10px; color: rgba(255,253,247,.78); line-height: 1.55; }
      .score { display: grid; align-content: center; justify-items: center; min-height: 160px; border: 1px solid rgba(255,253,247,.24); border-radius: 8px; background: rgba(255,253,247,.09); text-align: center; }
      .score span, .metric span, article span, h2 { color: #0f766e; font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .hero .score span, .hero span { color: #ffe4e9; }
      .score strong { font-size: 4rem; line-height: .9; }
      .metrics, .steps { display: grid; gap: 10px; margin-top: 14px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, article, .criteria, .repair-packet { min-width: 0; border: 1px solid #d5ded8; border-radius: 8px; background: #fffdf7; padding: 14px; }
      .metric strong { display: block; margin-top: 5px; font-size: 1.25rem; overflow-wrap: anywhere; }
      article { display: grid; gap: 8px; border-left: 5px solid #0f766e; }
      article.watch { border-left-color: #f2b84b; background: #fff8e6; }
      article.block { border-left-color: #b56576; background: #fff1f2; }
      article div { display: grid; grid-template-columns: auto minmax(0,1fr) auto; gap: 10px; align-items: start; }
      article.watch span { color: #806000; }
      article.block span { color: #8d2d42; }
      strong, p, small, li, footer { overflow-wrap: anywhere; }
      p, small, li, footer { color: #44514d; line-height: 1.45; }
      .criteria, .repair-packet { margin-top: 14px; }
      .repair-packet { display: grid; grid-template-columns: minmax(0, .72fr) minmax(320px, 1fr); gap: 14px; align-items: start; border-left: 5px solid #b56576; background: #fff1f2; }
      .repair-packet.pass { border-left-color: #0f766e; background: #f1faf5; }
      .repair-packet.watch { border-left-color: #f2b84b; background: #fff8e6; }
      .repair-packet strong { display: block; margin-top: 5px; font-size: 1.2rem; line-height: 1.15; overflow-wrap: anywhere; }
      .repair-packet a { justify-self: start; border: 1px solid #c8d4ce; border-radius: 999px; padding: 8px 11px; color: #172126; background: #fffdf7; font-size: .84rem; font-weight: 850; text-decoration: none; }
      .repair-packet .packet-body { display: grid; gap: 10px; }
      ol { display: grid; gap: 8px; margin: 8px 0 0; padding-left: 22px; }
      footer.page { padding: 18px 0 32px; color: #64706b; font-size: .86rem; }
      @media (max-width: 820px) { header, .hero, .metrics, .steps, .repair-packet { grid-template-columns: 1fr; } nav { justify-content: flex-start; } .score { min-height: 120px; } article div { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <header>
      <div><h1>${escapeHtml(plan.headline)}</h1></div>
      <nav>${nav}</nav>
    </header>
    <main>
      <section class="hero">
        <div>
          <span>${escapeHtml(plan.severity)}</span>
          <p>${escapeHtml(plan.decision)}</p>
          <p><strong>${escapeHtml(plan.shareInstruction)}</strong>: ${escapeHtml(plan.firstAction)}</p>
        </div>
        <div class="score"><span>Open tasks</span><strong>${escapeHtml(plan.openTaskCount)}</strong><small>${escapeHtml(plan.blockedTaskCount)} block / ${escapeHtml(plan.watchTaskCount)} watch</small></div>
      </section>
      <section class="metrics">
        <article class="metric"><span>Checked at</span><strong>${escapeHtml(plan.checkedAt || "not checked")}</strong></article>
        <article class="metric"><span>Share instruction</span><strong>${escapeHtml(plan.shareInstruction)}</strong></article>
        <article class="metric"><span>Blocked</span><strong>${escapeHtml(plan.blockedTaskCount)}</strong></article>
        <article class="metric"><span>Warnings</span><strong>${escapeHtml(plan.watchTaskCount)}</strong></article>
      </section>
      <h2>Recovery tasks</h2>
      <section class="steps">${steps}</section>
      <section class="repair-packet ${tone(plan.repairPacket.severity)}" aria-label="Repair packet">
        <div>
          <span>${escapeHtml(plan.repairPacket.severity)}</span>
          <strong>${escapeHtml(plan.repairPacket.title)}</strong>
          <p>${escapeHtml(plan.repairPacket.subject)}</p>
          <p><strong>${escapeHtml(plan.repairPacket.owner)}</strong>: ${escapeHtml(plan.repairPacket.due)}</p>
          <a href="${escapeHtml(plan.repairPacket.href)}" download="buyer-proof-repair-packet.md">Download repair packet</a>
          <a href="${escapeHtml(plan.taskLedger.href)}" download="${escapeHtml(plan.taskLedger.filename)}">Download task ledger</a>
          ${receiptLinks}
        </div>
        <div class="packet-body">
          <div><h2>Packet body</h2><ol>${packetLines}</ol></div>
          <div><h2>Checklist</h2><ol>${packetChecklist}</ol></div>
        </div>
      </section>
      <section class="criteria"><h2>Resume criteria</h2><ol>${criteria}</ol></section>
    </main>
    <footer class="page">Generated by A2A Agent Marketplace as a buyer proof recovery desk.</footer>
  </body>
</html>`;
}
