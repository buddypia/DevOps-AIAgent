import type {
  BuyerDecisionAgendaAction,
  BuyerDecisionAgendaItem,
  BuyerDecisionAgendaSnapshot,
  BuyerDecisionAgendaStatus
} from "./buyerDecisionAgenda.js";

export type BuyerDecisionFollowUpMode = "buyer-send" | "sponsor-review" | "blocker-closure";
export const BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH = "/api/buyer-decision-follow-up/receipt/verify";

export type BuyerDecisionFollowUpTask = {
  id: BuyerDecisionAgendaItem["id"];
  label: string;
  status: BuyerDecisionAgendaStatus;
  owner: string;
  dueLabel: string;
  nextStep: string;
  closeCondition: string;
  evidence: string;
  href: string;
};

export type BuyerDecisionFollowUpLedger = {
  status: BuyerDecisionAgendaStatus;
  mode: BuyerDecisionFollowUpMode;
  headline: string;
  summary: string;
  meetingDecision: string;
  firstAction: BuyerDecisionAgendaAction;
  readyCount: number;
  taskTotal: number;
  blockedCount: number;
  attentionCount: number;
  firstDueLabel: string;
  tasks: BuyerDecisionFollowUpTask[];
  escalationRules: string[];
  csv: string;
  csvHref: string;
  receipt: BuyerDecisionFollowUpReceipt;
  copyText: string;
  exportMarkdown: string;
};

export type BuyerDecisionFollowUpReceiptPayload = {
  receiptVersion: "buyer-decision-follow-up.v1";
  ledgerId: string;
  status: BuyerDecisionAgendaStatus;
  mode: BuyerDecisionFollowUpMode;
  headline: string;
  meetingDecision: string;
  readyCount: number;
  blockedCount: number;
  attentionCount: number;
  taskTotal: number;
  firstDueLabel: string;
  firstActionLabel: string;
  firstActionHref: string;
  tasks: Array<Pick<BuyerDecisionFollowUpTask, "id" | "label" | "status" | "owner" | "dueLabel" | "nextStep" | "closeCondition" | "evidence" | "href">>;
  escalationRules: string[];
  csvLedger: {
    filename: "buyer-decision-follow-up-ledger.csv";
    rowCount: number;
    csvText: string;
  };
};

export type BuyerDecisionFollowUpReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type BuyerDecisionFollowUpReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH;
  payload: BuyerDecisionFollowUpReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: BuyerDecisionFollowUpReceiptVerification;
  copyText: string;
  href: string;
};

export type BuyerDecisionFollowUpLinks = {
  agendaUrl?: string;
  procurementDecisionUrl?: string;
  proofPacketUrl?: string;
  trustCenterUrl?: string;
  commercialOfferUrl?: string;
  jsonUrl?: string;
  markdownUrl?: string;
  csvUrl?: string;
  appUrl?: string;
};

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScriptJson(value: string) {
  return value
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return value;
}

function stableDigest(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

function hrefIsExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function statusDueLabel(status: BuyerDecisionAgendaStatus) {
  if (status === "ready") return "Meeting day";
  if (status === "attention") return "+2 business days";
  return "Before external send";
}

function nextStepFor(item: BuyerDecisionAgendaItem) {
  if (item.status === "ready") return `Confirm ${item.label.toLowerCase()} in the meeting and attach the final decision receipt.`;
  if (item.id === "decision-request") return "Name the exact approve/revise/stop decision and who can sign it.";
  if (item.id === "commercial-boundary") return "Lock the pilot tier, first commitment, refund boundary, and owner before forwarding.";
  if (item.id === "proof-trust") return "Replace or verify the proof and trust artifact, then rerun the buyer proof check.";
  return "Get sponsor acceptance for the stop rule and write the threshold into the buyer packet.";
}

function closeConditionFor(item: BuyerDecisionAgendaItem) {
  if (item.status === "ready") return `${item.owner} confirms this row still matches the buyer meeting outcome.`;
  if (item.status === "attention") return `${item.owner} reviews the row, records the answer, and clears the no-send rule.`;
  return `${item.label} becomes ready and its evidence link is safe for an external buyer to open.`;
}

function modeFor(status: BuyerDecisionAgendaStatus): BuyerDecisionFollowUpMode {
  if (status === "ready") return "buyer-send";
  if (status === "attention") return "sponsor-review";
  return "blocker-closure";
}

function headlineFor(status: BuyerDecisionAgendaStatus, firstOpen: BuyerDecisionFollowUpTask | undefined) {
  if (status === "ready") return "Decision follow-up is ready to send";
  if (status === "attention") return `${firstOpen?.label ?? "Sponsor review"} needs a named owner after the meeting`;
  return `${firstOpen?.label ?? "Buyer follow-up"} blocks external send`;
}

function buildCsv(tasks: BuyerDecisionFollowUpTask[]) {
  return [
    ["taskId", "label", "status", "owner", "due", "nextStep", "closeCondition", "evidence", "href"],
    ...tasks.map((task) => [task.id, task.label, task.status, task.owner, task.dueLabel, task.nextStep, task.closeCondition, task.evidence, task.href])
  ]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}

type BuyerDecisionFollowUpLedgerBase = Omit<BuyerDecisionFollowUpLedger, "copyText" | "exportMarkdown" | "csvHref" | "receipt">;

export function buyerDecisionFollowUpReceiptChecksum(payload: BuyerDecisionFollowUpReceiptPayload) {
  return stableDigest(payload);
}

export function verifyBuyerDecisionFollowUpReceipt(
  receipt: Pick<BuyerDecisionFollowUpReceipt, "checksum" | "payload">
): BuyerDecisionFollowUpReceiptVerification {
  const actualChecksum = buyerDecisionFollowUpReceiptChecksum(receipt.payload);
  const expectedChecksum = receipt.checksum.toLowerCase();
  const verified = actualChecksum === expectedChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Follow-up ledger checksum matches the attached owner-task payload."
      : "Follow-up ledger checksum does not match the attached owner-task payload. Do not accept this forwarded ledger until the source workspace is re-exported."
  };
}

function buildReceiptMarkdown(receipt: Omit<BuyerDecisionFollowUpReceipt, "copyText" | "href">) {
  return [
    "# Buyer decision follow-up receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Ledger: ${receipt.payload.ledgerId}`,
    `Mode: ${receipt.payload.mode}`,
    `Tasks: ${receipt.payload.readyCount}/${receipt.payload.taskTotal} ready, ${receipt.payload.blockedCount} blocked, ${receipt.payload.attentionCount} attention`,
    `API verification: POST ${receipt.verificationApiPath}`,
    "",
    "## Payload",
    "```json",
    receipt.payloadJson,
    "```",
    "",
    "## Verification replay",
    `- Status: ${receipt.verification.status}`,
    `- Expected checksum: ${receipt.verification.expectedChecksum}`,
    `- Actual checksum: ${receipt.verification.actualChecksum}`,
    `- Instruction: ${receipt.verification.instruction}`,
    "",
    "## Verify request",
    `POST ${receipt.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    receipt.verificationRequestJson,
    "```"
  ].join("\n");
}

export function buildBuyerDecisionFollowUpReceipt(ledger: BuyerDecisionFollowUpLedgerBase): BuyerDecisionFollowUpReceipt {
  const payload: BuyerDecisionFollowUpReceiptPayload = {
    receiptVersion: "buyer-decision-follow-up.v1",
    ledgerId: `buyer-decision-follow-up-${ledger.mode}-${ledger.readyCount}-${ledger.blockedCount}-${ledger.attentionCount}`,
    status: ledger.status,
    mode: ledger.mode,
    headline: ledger.headline,
    meetingDecision: ledger.meetingDecision,
    readyCount: ledger.readyCount,
    blockedCount: ledger.blockedCount,
    attentionCount: ledger.attentionCount,
    taskTotal: ledger.taskTotal,
    firstDueLabel: ledger.firstDueLabel,
    firstActionLabel: ledger.firstAction.label,
    firstActionHref: ledger.firstAction.href,
    tasks: ledger.tasks.map((task) => ({
      id: task.id,
      label: task.label,
      status: task.status,
      owner: task.owner,
      dueLabel: task.dueLabel,
      nextStep: task.nextStep,
      closeCondition: task.closeCondition,
      evidence: task.evidence,
      href: task.href
    })),
    escalationRules: ledger.escalationRules,
    csvLedger: {
      filename: "buyer-decision-follow-up-ledger.csv",
      rowCount: ledger.tasks.length,
      csvText: ledger.csv
    }
  };
  const checksum = buyerDecisionFollowUpReceiptChecksum(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyBuyerDecisionFollowUpReceipt({ checksum, payload });
  const partial: Omit<BuyerDecisionFollowUpReceipt, "copyText" | "href"> = {
    receiptId: `buyer-decision-follow-up-${payload.mode}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };
  const copyText = buildReceiptMarkdown(partial);

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}

function buildMarkdown(ledger: BuyerDecisionFollowUpLedgerBase & { receipt: BuyerDecisionFollowUpReceipt }) {
  return [
    "# Buyer decision follow-up ledger",
    "",
    `Status: ${ledger.status}`,
    `Mode: ${ledger.mode}`,
    `Meeting decision: ${ledger.meetingDecision}`,
    `First action: ${ledger.firstAction.label} (${ledger.firstAction.href})`,
    `Open tasks: ${ledger.blockedCount} blocked, ${ledger.attentionCount} attention`,
    "",
    ledger.summary,
    "",
    "## Follow-up tasks",
    ...ledger.tasks.map(
      (task) =>
        `- [${task.status}] ${task.label} (${task.owner}, ${task.dueLabel}): ${task.nextStep} Close when: ${task.closeCondition} Evidence: ${task.evidence}`
    ),
    "",
    "## Escalation rules",
    ...ledger.escalationRules.map((rule) => `- ${rule}`),
    "",
    "## Verification receipt",
    `Receipt: ${ledger.receipt.receiptId}`,
    `Checksum: ${ledger.receipt.checksumAlgorithm}:${ledger.receipt.checksum}`,
    `API verification: POST ${ledger.receipt.verificationApiPath}`,
    `Replay status: ${ledger.receipt.verification.status}`,
    "",
    "## Receipt payload",
    "```json",
    ledger.receipt.payloadJson,
    "```",
    "",
    "## Receipt API verification",
    `POST ${ledger.receipt.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    ledger.receipt.verificationRequestJson,
    "```",
    "",
    "## CSV ledger",
    "```csv",
    ledger.csv,
    "```"
  ].join("\n");
}

export function buildBuyerDecisionFollowUpLedger(agenda: BuyerDecisionAgendaSnapshot): BuyerDecisionFollowUpLedger {
  const tasks = agenda.items.map((item): BuyerDecisionFollowUpTask => ({
    id: item.id,
    label: item.label,
    status: item.status,
    owner: item.owner,
    dueLabel: statusDueLabel(item.status),
    nextStep: nextStepFor(item),
    closeCondition: closeConditionFor(item),
    evidence: item.evidence,
    href: item.href
  }));
  const firstOpen = tasks.find((task) => task.status === "blocked") ?? tasks.find((task) => task.status === "attention");
  const blockedCount = tasks.filter((task) => task.status === "blocked").length;
  const attentionCount = tasks.filter((task) => task.status === "attention").length;
  const openTaskCount = blockedCount + attentionCount;
  const escalationRules = [
    "Every blocked row stays internal until its close condition is met.",
    "If an owner misses the due window, the decision becomes sponsor review, not buyer send.",
    agenda.status === "ready"
      ? "After the meeting, record the buyer continue/revise/stop decision in the launch room."
      : `Do not send the buyer room while ${openTaskCount} follow-up ${openTaskCount === 1 ? "task remains" : "tasks remain"} open.`
  ];
  const firstAction = firstOpen
    ? {
        label: `${firstOpen.status === "blocked" ? "Fix" : "Review"} ${firstOpen.label}`,
        href: firstOpen.href,
        external: hrefIsExternal(firstOpen.href)
      }
    : {
        label: "Open buyer decision room",
        href: agenda.firstAction.href,
        external: agenda.firstAction.external
      };
  const partial: BuyerDecisionFollowUpLedgerBase = {
    status: agenda.status,
    mode: modeFor(agenda.status),
    headline: headlineFor(agenda.status, firstOpen),
    summary:
      agenda.status === "ready"
        ? `${agenda.buyer} has a sendable follow-up ledger with owners, due windows, close conditions, and proof evidence for the buyer meeting.`
        : `${firstOpen?.owner ?? agenda.buyer} owns the first open follow-up before this can be treated as a buyer-send workflow.`,
    meetingDecision: agenda.decisionLabel,
    firstAction,
    readyCount: tasks.filter((task) => task.status === "ready").length,
    taskTotal: tasks.length,
    blockedCount,
    attentionCount,
    firstDueLabel: firstOpen?.dueLabel ?? "Meeting day",
    tasks,
    escalationRules,
    csv: buildCsv(tasks)
  };
  const receipt = buildBuyerDecisionFollowUpReceipt(partial);
  const exportMarkdown = buildMarkdown({ ...partial, receipt });

  return {
    ...partial,
    receipt,
    copyText: exportMarkdown,
    exportMarkdown,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(partial.csv)}`
  };
}

function tone(status: BuyerDecisionAgendaStatus) {
  if (status === "ready") return "good";
  if (status === "attention") return "watch";
  return "bad";
}

export function renderBuyerDecisionFollowUpHtml(ledger: BuyerDecisionFollowUpLedger, links: BuyerDecisionFollowUpLinks = {}) {
  const taskCards = ledger.tasks
    .map(
      (task) => `
        <a class="task ${tone(task.status)}" href="${escapeHtml(task.href)}">
          <span>${escapeHtml(task.status)}</span>
          <strong>${escapeHtml(task.label)}</strong>
          <b>${escapeHtml(task.owner)}</b>
          <small>${escapeHtml(task.dueLabel)}</small>
          <p>${escapeHtml(task.nextStep)}</p>
          <em>${escapeHtml(task.closeCondition)}</em>
        </a>`
    )
    .join("");
  const rules = ledger.escalationRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("");
  const receiptStatusClass = ledger.receipt.verification.status === "verified" ? "good" : "bad";
  const linkList = [
    links.agendaUrl ? `<a href="${escapeHtml(links.agendaUrl)}">Decision agenda</a>` : "",
    links.procurementDecisionUrl ? `<a href="${escapeHtml(links.procurementDecisionUrl)}">Procurement decision</a>` : "",
    links.proofPacketUrl ? `<a href="${escapeHtml(links.proofPacketUrl)}">Proof packet</a>` : "",
    links.trustCenterUrl ? `<a href="${escapeHtml(links.trustCenterUrl)}">Trust center</a>` : "",
    links.commercialOfferUrl ? `<a href="${escapeHtml(links.commercialOfferUrl)}">Commercial offer</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON ledger</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown ledger</a>` : "",
    links.csvUrl ? `<a href="${escapeHtml(links.csvUrl)}">CSV ledger</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(ledger.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #52645f; --line: #cbd7d2; --paper: #f3f7f5; --panel: #fffdf7; --teal: #0f766e; --green-bg: #edf8f1; --amber-bg: #fff7dd; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 22px; }
      .eyebrow, .metric span, .task span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.2rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p { color: var(--muted); }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: end; }
      .stamp { min-height: 190px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #102226, #275b52); text-align: center; }
      .stamp span { color: #c6f1dc; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { padding: 0 18px; font-size: 3rem; line-height: .92; overflow-wrap: anywhere; }
      .stamp small { color: rgba(255, 253, 247, .8); font-weight: 850; }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .metrics, .tasks, .rules { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 20px; }
      .receipt-lock { display: grid; grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr); gap: 10px; }
      .metric, .panel, .task, .receipt-card { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric, .receipt-card { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.25rem; line-height: 1.1; overflow-wrap: anywhere; }
      .panel { padding: 16px; }
      .tasks { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .task { display: grid; align-content: start; gap: 7px; min-height: 218px; padding: 13px; border-top-width: 5px; text-decoration: none; }
      .task strong, .task b, .task p, .task small, .task em { overflow-wrap: anywhere; }
      .task b { color: var(--ink); line-height: 1.12; }
      .task small { color: var(--teal); font-weight: 900; }
      .task em { display: block; border: 1px solid rgba(15, 118, 110, .14); border-radius: 8px; padding: 8px; background: rgba(15, 118, 110, .07); color: var(--muted); font-style: normal; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      .rules { grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 0; margin: 0; list-style: none; }
      .rules li { min-width: 0; border-left: 3px solid rgba(15, 118, 110, .45); padding-left: 10px; color: var(--muted); overflow-wrap: anywhere; }
      .receipt-card { display: grid; align-content: start; gap: 8px; }
      .receipt-card span { color: var(--teal); font-size: .74rem; font-weight: 950; text-transform: uppercase; }
      .receipt-card code { display: block; padding: 10px; border-radius: 8px; background: #172126; color: #fffdf7; overflow-wrap: anywhere; }
      .receipt-card strong, .receipt-card small { overflow-wrap: anywhere; }
      .receipt-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .receipt-card a, .receipt-card button { justify-self: start; border: 1px solid var(--line); border-radius: 999px; padding: 6px 10px; color: var(--teal); font: inherit; font-weight: 850; text-decoration: none; background: var(--panel); }
      .receipt-card button { cursor: pointer; }
      .receipt-card button:disabled { cursor: default; opacity: .72; }
      .receipt-status.good { color: var(--teal); font-weight: 900; }
      .receipt-status.bad { color: #a82135; font-weight: 900; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 860px) { header, main, footer { width: min(100% - 24px, 640px); } .hero, .metrics, .tasks, .rules, .receipt-lock { grid-template-columns: 1fr; } .stamp { min-height: 132px; } .stamp strong { font-size: 2.5rem; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Buyer decision follow-up ledger</span>
          <h1>${escapeHtml(ledger.headline)}</h1>
          <p>${escapeHtml(ledger.summary)}</p>
          <nav>${linkList}</nav>
        </div>
        <div class="stamp">
          <span>${escapeHtml(ledger.mode)}</span>
          <strong>${escapeHtml(`${ledger.readyCount}/${ledger.taskTotal}`)}</strong>
          <small>${escapeHtml(`${ledger.meetingDecision} · first due: ${ledger.firstDueLabel}`)}</small>
        </div>
      </div>
      <section class="metrics">
        <article class="metric ${tone(ledger.status)}"><span>Status</span><strong>${escapeHtml(ledger.status)}</strong></article>
        <article class="metric ${ledger.blockedCount > 0 ? "bad" : "good"}"><span>Blocked</span><strong>${escapeHtml(ledger.blockedCount)}</strong></article>
        <article class="metric ${ledger.attentionCount > 0 ? "watch" : "good"}"><span>Attention</span><strong>${escapeHtml(ledger.attentionCount)}</strong></article>
        <article class="metric"><span>First action</span><strong>${escapeHtml(ledger.firstAction.label)}</strong></article>
      </section>
    </header>
    <main>
      <section class="panel">
        <h2>Owner tasks</h2>
        <div class="tasks">${taskCards}</div>
      </section>
      <section class="panel">
        <h2>Verification receipt</h2>
        <div class="receipt-lock">
          <article class="receipt-card">
            <span>${escapeHtml(ledger.receipt.checksumAlgorithm)}</span>
            <code>${escapeHtml(ledger.receipt.checksum)}</code>
            <code>POST ${escapeHtml(ledger.receipt.verificationApiPath)}</code>
            <small>${escapeHtml(ledger.receipt.verification.instruction)}</small>
            <div class="receipt-actions">
              <button type="button" data-verify-receipt data-verify-api="${escapeHtml(ledger.receipt.verificationApiPath)}">Verify receipt</button>
              <a href="${escapeHtml(ledger.receipt.payloadHref)}" download="buyer-decision-follow-up-receipt-payload.json">Download receipt payload</a>
              <a href="${escapeHtml(ledger.receipt.verificationRequestHref)}" download="buyer-decision-follow-up-receipt-verify-request.json">Download verify request</a>
              <a href="${escapeHtml(ledger.receipt.href)}" download="buyer-decision-follow-up-receipt.md">Download receipt</a>
            </div>
            <small class="receipt-status ${receiptStatusClass}" data-receipt-status>Replay ${escapeHtml(ledger.receipt.verification.status)} for this exported ledger.</small>
          </article>
          <article class="receipt-card">
            <span>Receipt payload</span>
            <strong>${escapeHtml(ledger.receipt.receiptId)}</strong>
            <small>${escapeHtml(`${ledger.receipt.payload.tasks.length} owner tasks and ${ledger.receipt.payload.escalationRules.length} escalation rules covered.`)}</small>
          </article>
        </div>
      </section>
      <section class="panel">
        <h2>Escalation rules</h2>
        <ul class="rules">${rules}</ul>
      </section>
    </main>
    <footer>Generated by A2A Agent Marketplace. Use this follow-up ledger as an operating checklist, not as a binding procurement approval.</footer>
    <script type="application/json" id="buyer-decision-follow-up-receipt-verify-request">${escapeScriptJson(ledger.receipt.verificationRequestJson)}</script>
    <script>
      (() => {
        const button = document.querySelector("[data-verify-receipt]");
        const status = document.querySelector("[data-receipt-status]");
        const requestNode = document.getElementById("buyer-decision-follow-up-receipt-verify-request");
        if (!button || !status || !requestNode) return;
        button.addEventListener("click", async () => {
          button.disabled = true;
          button.textContent = "Checking receipt";
          status.className = "receipt-status";
          status.textContent = "Checking follow-up ledger checksum...";
          try {
            const response = await fetch(button.getAttribute("data-verify-api") || "/api/buyer-decision-follow-up/receipt/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: requestNode.textContent || ""
            });
            const result = await response.json();
            if (response.ok && result && result.verification && result.verification.status === "verified") {
              button.textContent = "Receipt verified";
              status.className = "receipt-status good";
              status.textContent = "Checksum " + result.verification.actualChecksum + " matches this ledger.";
              return;
            }
            button.disabled = false;
            button.textContent = "Verify receipt";
            status.className = "receipt-status bad";
            status.textContent = (result && result.verification && result.verification.instruction) || result.error || "Receipt verification failed.";
          } catch {
            button.disabled = false;
            button.textContent = "Verify receipt";
            status.className = "receipt-status bad";
            status.textContent = "Receipt verification could not reach the verification API.";
          }
        });
      })();
    </script>
  </body>
</html>`;
}
