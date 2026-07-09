import type { QuickWorkflowCommercialPilotOffer } from "./QuickWorkflowIntakePanel";
import type { QuickWorkflowPilotDecisionBrief } from "./quickWorkflowPilotDecisionBrief";
import type { QuickWorkflowPilotExpansionGuardrail } from "./quickWorkflowPilotExpansionGuardrail";
import type { QuickWorkflowPilotKickoffPack } from "./quickWorkflowPilotKickoffPack";
import type { QuickWorkflowPilotRunLog } from "./quickWorkflowPilotRunLog";
import type { QuickWorkflowValueAcceptanceContract } from "./quickWorkflowValueAcceptanceContract";
import {
  buildQuickWorkflowBuyerExpansionHandoff,
  type QuickWorkflowBuyerExpansionHandoff
} from "./quickWorkflowBuyerExpansionHandoff";

type BuyerExpansionPacketStatus = QuickWorkflowCommercialPilotOffer["status"];

export type QuickWorkflowBuyerExpansionPacketStage = {
  id: "offer" | "contract" | "kickoff" | "run" | "decision" | "expansion";
  label: string;
  status: BuyerExpansionPacketStatus;
  owner: string;
  value: string;
  action: string;
  receiptId?: string;
  verifierHref?: string;
};

export type QuickWorkflowBuyerExpansionPacket = {
  status: BuyerExpansionPacketStatus;
  headline: string;
  summary: string;
  buyer: string;
  workflow: string;
  decisionAsk: string;
  primaryMetric: string;
  receiptLine: string;
  readyCount: number;
  totalCount: number;
  nextOwner: string;
  nextAction: string;
  stages: QuickWorkflowBuyerExpansionPacketStage[];
  sendNoteSubject: string;
  sendNoteBody: string;
  mailtoHref: string;
  exportMarkdown: string;
  exportHref: string;
  exportHtml: string;
  exportHtmlHref: string;
  procurementHandoff: QuickWorkflowBuyerExpansionHandoff;
};

function formatYen(value: number) {
  return `¥${Math.max(0, Math.round(value)).toLocaleString("ja-JP")}`;
}

function htmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusRank(status: BuyerExpansionPacketStatus) {
  if (status === "blocked") return 0;
  if (status === "watch") return 1;
  return 2;
}

function stageStatusFromOptional(source: { status: BuyerExpansionPacketStatus } | undefined, waitingStatus: BuyerExpansionPacketStatus) {
  return source?.status ?? waitingStatus;
}

function packetStatusFor(stages: QuickWorkflowBuyerExpansionPacketStage[], expansionGuardrail?: QuickWorkflowPilotExpansionGuardrail): BuyerExpansionPacketStatus {
  if (expansionGuardrail) return expansionGuardrail.status;
  if (stages.some((stage) => stage.status === "blocked")) return "blocked";
  return "watch";
}

function headlineFor(status: BuyerExpansionPacketStatus, expansionGuardrail?: QuickWorkflowPilotExpansionGuardrail, decisionBrief?: QuickWorkflowPilotDecisionBrief) {
  if (expansionGuardrail?.decision === "expand-next-window") return "Buyer expansion packet is ready";
  if (expansionGuardrail?.decision === "stop-expansion") return "Buyer expansion packet says stop";
  if (decisionBrief?.decision === "expand-with-guardrails") return "Decision packet is ready for value recheck";
  if (status === "blocked") return "Buyer packet has a hard blocker";
  return "Buyer packet is building its receipt chain";
}

function decisionAskFor(input: {
  contract: QuickWorkflowValueAcceptanceContract;
  runLog?: QuickWorkflowPilotRunLog;
  decisionBrief?: QuickWorkflowPilotDecisionBrief;
  expansionGuardrail?: QuickWorkflowPilotExpansionGuardrail;
}) {
  const { contract, runLog, decisionBrief, expansionGuardrail } = input;
  if (expansionGuardrail?.decision === "expand-next-window") {
    return `Approve the next operating window for ${contract.buyer} with ${expansionGuardrail.receipt.receiptId} attached.`;
  }
  if (expansionGuardrail?.decision === "stop-expansion") return "Stop expansion and convert the next sprint into value repair.";
  if (decisionBrief?.decision === "expand-with-guardrails") return "Run the 30-day value recheck, attach owner acceptance, and issue the expansion guardrail receipt.";
  if (runLog?.decision === "send-closeout-note") return "Send the decision brief with the verified run and contract receipts attached.";
  return "Complete the pilot run evidence before asking the buyer for an expansion decision.";
}

function primaryMetricFor(input: {
  contract: QuickWorkflowValueAcceptanceContract;
  runLog?: QuickWorkflowPilotRunLog;
  expansionGuardrail?: QuickWorkflowPilotExpansionGuardrail;
}) {
  const { contract, runLog, expansionGuardrail } = input;
  if (expansionGuardrail?.measuredMonthlyValueYen) return expansionGuardrail.valueRuler.detail;
  if (runLog) return `${runLog.evidenceScore}/100 pilot evidence score against ${formatYen(contract.valueFloorYen)}/month floor.`;
  return `${formatYen(contract.valueFloorYen)}/month accepted floor with ${formatYen(contract.stopLossYen)}/month stop rule.`;
}

function receiptLineFor(input: {
  contract: QuickWorkflowValueAcceptanceContract;
  kickoffPack: QuickWorkflowPilotKickoffPack;
  runLog?: QuickWorkflowPilotRunLog;
  decisionBrief?: QuickWorkflowPilotDecisionBrief;
  expansionGuardrail?: QuickWorkflowPilotExpansionGuardrail;
}) {
  const { contract, kickoffPack, runLog, decisionBrief, expansionGuardrail } = input;
  if (expansionGuardrail) return `Expansion ${expansionGuardrail.receipt.receiptId} links decision, run, and contract receipts.`;
  if (decisionBrief) return `Decision ${decisionBrief.receipt.receiptId} links ${runLog?.receipt.receiptId ?? "the run receipt"} and ${contract.receipt.receiptId}.`;
  if (runLog) return `Run ${runLog.receipt.receiptId} links kickoff ${kickoffPack.receipt.receiptId}.`;
  return `Kickoff ${kickoffPack.receipt.receiptId} starts from contract ${contract.receipt.receiptId}.`;
}

function buildHtmlOnePager(input: {
  status: BuyerExpansionPacketStatus;
  headline: string;
  summary: string;
  buyer: string;
  workflow: string;
  decisionAsk: string;
  primaryMetric: string;
  receiptLine: string;
  readyCount: number;
  totalCount: number;
  nextOwner: string;
  nextAction: string;
  stages: QuickWorkflowBuyerExpansionPacketStage[];
  procurementHandoff: QuickWorkflowBuyerExpansionHandoff;
}) {
  const {
    status,
    headline,
    summary,
    buyer,
    workflow,
    decisionAsk,
    primaryMetric,
    receiptLine,
    readyCount,
    totalCount,
    nextOwner,
    nextAction,
    stages,
    procurementHandoff
  } = input;
  const stageHtml = stages
    .map((stage) => {
      const verifierLink = stage.verifierHref
        ? `<a href="${htmlEscape(stage.verifierHref)}">Verify receipt</a>`
        : stage.receiptId
          ? `<code>${htmlEscape(stage.receiptId)}</code>`
          : "<span>No receipt yet</span>";
      return `
        <article class="stage ${htmlEscape(stage.status)}">
          <span>${htmlEscape(stage.status)}</span>
          <h3>${htmlEscape(stage.label)}</h3>
          <strong>${htmlEscape(stage.value)}</strong>
          <p>${htmlEscape(stage.action)}</p>
          <footer>
            <b>${htmlEscape(stage.owner)}</b>
            ${verifierLink}
          </footer>
        </article>`;
    })
    .join("");
  const handoffTaskHtml = procurementHandoff.tasks
    .map((task) => {
      const proofLink = task.href
        ? `<a href="${htmlEscape(task.href)}">Verify handoff proof</a>`
        : `<code>${htmlEscape(task.proof)}</code>`;
      return `
        <article class="handoff-task ${htmlEscape(task.status)}">
          <span>${htmlEscape(task.status)}</span>
          <h3>${htmlEscape(task.label)}</h3>
          <strong>${htmlEscape(task.owner)}</strong>
          <p>${htmlEscape(task.action)}</p>
          <footer>
            <b>${htmlEscape(task.acceptance)}</b>
            ${proofLink}
          </footer>
        </article>`;
    })
    .join("");
  const operatingTaskHtml = procurementHandoff.signoff.operatingPacket.tasks
    .map((task) => `
        <article class="operating-task ${htmlEscape(task.status)}">
          <span>${htmlEscape(task.dueLabel)}</span>
          <h3>${htmlEscape(task.label)}</h3>
          <strong>${htmlEscape(task.owner)}</strong>
          <p>${htmlEscape(task.action)}</p>
          <footer>
            <b>${htmlEscape(task.acceptance)}</b>
            <code>${htmlEscape(task.proof)}</code>
          </footer>
        </article>`)
    .join("");
  const operatingCalendarLink = procurementHandoff.signoff.operatingPacket.calendarHref
    ? `<a href="${htmlEscape(procurementHandoff.signoff.operatingPacket.calendarHref)}">Download recheck calendar</a>`
    : "";
  const operatingCloseoutLink = `<a href="${htmlEscape(procurementHandoff.signoff.operatingPacket.closeoutHref)}">Download closeout template</a>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${htmlEscape(headline)} - ${htmlEscape(buyer)}</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #172126;
      --muted: #617071;
      --paper: #fffdf7;
      --wash: #edf3ef;
      --line: rgba(23, 33, 38, 0.14);
      --teal: #0f766e;
      --green: #16803f;
      --amber: #9a6700;
      --rose: #b42345;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background: #e8eee9;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }
    main {
      width: min(1080px, calc(100% - 32px));
      margin: 24px auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--paper);
      box-shadow: 0 18px 48px rgba(23, 33, 38, 0.13);
      overflow: hidden;
    }
    header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(170px, 0.24fr);
      gap: 18px;
      padding: 28px;
      color: #fffdf7;
      background: linear-gradient(135deg, #101318, #173432 62%, #273b34);
    }
    .eyebrow,
    .label,
    .stage span,
    .handoff-task span {
      color: #b8efd4;
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    h1 {
      max-width: 780px;
      margin: 8px 0 10px;
      font-size: clamp(2rem, 5vw, 4.1rem);
      letter-spacing: 0;
      line-height: 0.98;
    }
    header p {
      max-width: 760px;
      margin: 0;
      color: rgba(255, 253, 247, 0.78);
      font-size: 1rem;
      font-weight: 650;
    }
    .score {
      display: grid;
      place-items: center;
      gap: 5px;
      min-height: 170px;
      border: 1px solid rgba(255, 253, 247, 0.22);
      border-radius: 8px;
      background: rgba(255, 253, 247, 0.08);
      text-align: center;
    }
    .score strong {
      color: #fffdf7;
      font-size: clamp(2.8rem, 8vw, 5.2rem);
      line-height: 0.9;
    }
    .score small {
      color: rgba(255, 253, 247, 0.72);
      font-weight: 800;
    }
    section {
      padding: 22px 28px;
      border-top: 1px solid var(--line);
    }
    .decision {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(220px, 0.35fr);
      gap: 12px;
      background: linear-gradient(135deg, rgba(237, 243, 239, 0.94), rgba(255, 253, 247, 0.95));
    }
    .decision article {
      min-width: 0;
      display: grid;
      gap: 5px;
      padding: 12px;
      border: 1px solid var(--line);
      border-left: 4px solid var(--teal);
      border-radius: 8px;
      background: rgba(255, 253, 247, 0.78);
    }
    .decision strong,
    .chain strong,
    .stage strong,
    .handoff-task strong {
      overflow-wrap: anywhere;
    }
    .decision p,
    .chain p,
    .stage p,
    .handoff-task p {
      margin: 0;
      color: var(--muted);
      font-size: 0.88rem;
      font-weight: 650;
      overflow-wrap: anywhere;
    }
    .chain {
      display: grid;
      gap: 8px;
    }
    .stages {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      background: #f8faf4;
    }
    .stage {
      min-width: 0;
      display: grid;
      align-content: start;
      gap: 8px;
      min-height: 190px;
      padding: 13px;
      border: 1px solid var(--line);
      border-top: 5px solid var(--rose);
      border-radius: 8px;
      background: var(--paper);
    }
    .handoff {
      display: grid;
      grid-template-columns: minmax(0, 0.7fr) minmax(240px, 0.3fr);
      gap: 10px;
      background: #eef5ef;
    }
    .signoff {
      display: grid;
      grid-template-columns: minmax(0, 0.68fr) minmax(240px, 0.32fr);
      gap: 10px;
      background: #fffdf7;
      border-top: 1px solid var(--line);
    }
    .operating {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(210px, 0.28fr) minmax(220px, 0.32fr);
      gap: 10px;
      background: #f8faf4;
      border-top: 1px solid var(--line);
    }
    .handoff-main,
    .handoff-rule,
    .signoff-main,
    .signoff-source,
    .operating-main,
    .operating-score,
    .operating-closeout {
      min-width: 0;
      display: grid;
      gap: 7px;
      padding: 13px;
      border: 1px solid var(--line);
      border-left: 4px solid var(--teal);
      border-radius: 8px;
      background: rgba(255, 253, 247, 0.78);
    }
    .handoff-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .handoff-actions a {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 6px 10px;
      background: rgba(255,253,247,.92);
      text-decoration: none;
    }
    .handoff-main h2,
    .handoff-rule h2,
    .signoff-main h2,
    .signoff-source h2,
    .operating-main h2,
    .operating-score h2,
    .operating-closeout h2 {
      margin: 0;
      font-size: 1.2rem;
      line-height: 1.08;
      overflow-wrap: anywhere;
    }
    .handoff-main p,
    .handoff-rule p,
    .signoff-main p,
    .signoff-source p,
    .operating-main p,
    .operating-score p,
    .operating-closeout p {
      margin: 0;
      color: var(--muted);
      font-size: 0.88rem;
      font-weight: 650;
      overflow-wrap: anywhere;
    }
    .handoff-tasks {
      grid-column: 1 / -1;
      min-width: 0;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }
    .operating-tasks {
      grid-column: 1 / -1;
      min-width: 0;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }
    .handoff-task {
      min-width: 0;
      display: grid;
      align-content: start;
      gap: 8px;
      min-height: 210px;
      padding: 13px;
      border: 1px solid var(--line);
      border-top: 5px solid var(--rose);
      border-radius: 8px;
      background: var(--paper);
    }
    .operating-task {
      min-width: 0;
      display: grid;
      align-content: start;
      gap: 8px;
      min-height: 220px;
      padding: 13px;
      border: 1px solid var(--line);
      border-top: 5px solid var(--rose);
      border-radius: 8px;
      background: var(--paper);
    }
    .handoff-task.ready { border-top-color: var(--green); }
    .handoff-task.watch { border-top-color: #d97706; }
    .handoff-task.blocked { border-top-color: var(--rose); }
    .operating-task.ready { border-top-color: var(--green); }
    .operating-task.watch { border-top-color: #d97706; }
    .operating-task.blocked { border-top-color: var(--rose); }
    .handoff-task h3 {
      margin: 0;
      font-size: 1rem;
      line-height: 1.12;
    }
    .operating-task h3 {
      margin: 0;
      font-size: 1rem;
      line-height: 1.12;
    }
    .handoff-task footer {
      align-self: end;
      display: grid;
      gap: 5px;
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 800;
    }
    .operating-task footer {
      align-self: end;
      display: grid;
      gap: 5px;
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 800;
    }
    .stage.ready { border-top-color: var(--green); }
    .stage.watch { border-top-color: #d97706; }
    .stage.blocked { border-top-color: var(--rose); }
    .stage.watch span { color: var(--amber); }
    .stage.blocked span { color: var(--rose); }
    .stage h3 {
      margin: 0;
      font-size: 1rem;
      line-height: 1.12;
    }
    .stage footer {
      align-self: end;
      display: grid;
      gap: 5px;
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 800;
    }
    a {
      color: var(--teal);
      font-weight: 900;
      overflow-wrap: anywhere;
    }
    code {
      color: var(--muted);
      font-family: "SFMono-Regular", Consolas, monospace;
      font-size: 0.72rem;
      overflow-wrap: anywhere;
    }
    @media print {
      body { background: #fff; }
      main { width: 100%; margin: 0; box-shadow: none; border: 0; }
      a { color: inherit; }
    }
    @media (max-width: 760px) {
      main { width: min(100% - 18px, 680px); margin: 9px auto; }
      header,
      .decision,
      .stages,
      .handoff,
      .signoff,
      .operating,
      .handoff-tasks,
      .operating-tasks { grid-template-columns: 1fr; }
      header,
      section { padding: 18px; }
      .score { justify-items: start; text-align: left; min-height: 120px; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <span class="eyebrow">Buyer expansion one-pager / ${htmlEscape(status)}</span>
        <h1>${htmlEscape(headline)}</h1>
        <p>${htmlEscape(summary)}</p>
      </div>
      <aside class="score" aria-label="Packet readiness">
        <span class="label">Readiness</span>
        <strong>${readyCount}/${totalCount}</strong>
        <small>${htmlEscape(primaryMetric)}</small>
      </aside>
    </header>
    <section class="decision" aria-label="Decision summary">
      <article>
        <span class="label">Buyer</span>
        <strong>${htmlEscape(buyer)}</strong>
        <p>${htmlEscape(workflow)}</p>
      </article>
      <article>
        <span class="label">Decision ask</span>
        <strong>${htmlEscape(decisionAsk)}</strong>
        <p>${htmlEscape(nextOwner)}: ${htmlEscape(nextAction)}</p>
      </article>
    </section>
    <section class="chain" aria-label="Receipt chain">
      <span class="label">Receipt chain</span>
      <strong>${htmlEscape(receiptLine)}</strong>
      <p>This one-pager is generated from the live buyer expansion packet. Keep verifier links attached before approval.</p>
    </section>
    <section class="stages" aria-label="Packet stages">
      ${stageHtml}
    </section>
	    <section class="handoff" aria-label="Procurement handoff">
	      <article class="handoff-main">
	        <span class="label">Procurement handoff</span>
        <h2>${htmlEscape(procurementHandoff.headline)}</h2>
        <p>${htmlEscape(procurementHandoff.summary)}</p>
        <code>${htmlEscape(procurementHandoff.receipt.receiptId)} / ${htmlEscape(procurementHandoff.receipt.checksumAlgorithm)}:${htmlEscape(procurementHandoff.receipt.checksum)}</code>
        <div class="handoff-actions" aria-label="Procurement handoff verification">
          <a href="${htmlEscape(procurementHandoff.receipt.verifierHref)}">Verify procurement handoff</a>
        </div>
      </article>
	      <article class="handoff-rule">
	        <span class="label">Control rule</span>
	        <h2>${htmlEscape(procurementHandoff.approvalLine)}</h2>
	        <p>${htmlEscape(procurementHandoff.riskLine)}</p>
	      </article>
	      <div class="handoff-tasks">
	        ${handoffTaskHtml}
	      </div>
	    </section>
	    <section class="signoff" aria-label="Procurement signoff packet">
	      <article class="signoff-main">
	        <span class="label">Procurement signoff</span>
	        <h2>${htmlEscape(procurementHandoff.signoff.label)}</h2>
	        <p>${htmlEscape(procurementHandoff.signoff.memo)}</p>
	        <code>${htmlEscape(procurementHandoff.signoff.receiptId)} / ${htmlEscape(procurementHandoff.signoff.checksumAlgorithm)}:${htmlEscape(procurementHandoff.signoff.checksum)}</code>
	        <div class="handoff-actions" aria-label="Procurement signoff verification">
	          <a href="${htmlEscape(procurementHandoff.signoff.verifierHref)}">Verify procurement signoff</a>
	        </div>
	      </article>
	      <article class="signoff-source">
	        <span class="label">Source handoff</span>
	        <h2>${htmlEscape(procurementHandoff.handoffId)}</h2>
	        <p>${htmlEscape(procurementHandoff.approvalLine)}</p>
	        <code>${htmlEscape(procurementHandoff.checksumAlgorithm)}:${htmlEscape(procurementHandoff.checksum)}</code>
	      </article>
	    </section>
	    <section class="operating" aria-label="Procurement operating packet">
	      <article class="operating-main">
	        <span class="label">Operating packet</span>
	        <h2>${htmlEscape(procurementHandoff.signoff.operatingPacket.headline)}</h2>
	        <p>${htmlEscape(procurementHandoff.signoff.operatingPacket.summary)}</p>
	        <div class="handoff-actions" aria-label="Procurement operating packet downloads">
	          <a href="${htmlEscape(procurementHandoff.signoff.operatingPacket.exportHref)}">Download operating packet</a>
	          <a href="${htmlEscape(procurementHandoff.signoff.operatingPacket.csvHref)}">Download owner ledger</a>
	          ${operatingCalendarLink}
	          ${operatingCloseoutLink}
	        </div>
	      </article>
	      <article class="operating-score">
	        <span class="label">${htmlEscape(procurementHandoff.signoff.operatingPacket.calendar.status)}</span>
	        <h2>${htmlEscape(procurementHandoff.signoff.operatingPacket.calendar.startDate || procurementHandoff.signoff.operatingPacket.recheckWindow)}</h2>
	        <p>${htmlEscape(String(procurementHandoff.signoff.operatingPacket.readyCount))}/${htmlEscape(String(procurementHandoff.signoff.operatingPacket.taskTotal))} owner commitments ready. ${htmlEscape(procurementHandoff.signoff.operatingPacket.calendar.summary)}</p>
	      </article>
	      <article class="operating-closeout">
	        <span class="label">${htmlEscape(procurementHandoff.signoff.operatingPacket.recheckCloseout.status)}</span>
	        <h2>${htmlEscape(procurementHandoff.signoff.operatingPacket.recheckCloseout.label)}</h2>
	        <p>${htmlEscape(procurementHandoff.signoff.operatingPacket.recheckCloseout.scheduledDate)} / ${htmlEscape(String(procurementHandoff.signoff.operatingPacket.recheckCloseout.requiredSignals.length))} required closeout signals.</p>
	      </article>
	      <div class="operating-tasks">
	        ${operatingTaskHtml}
	      </div>
	    </section>
	  </main>
</body>
</html>`;
}

export function buildQuickWorkflowBuyerExpansionPacket(input: {
  commercialPilotOffer: QuickWorkflowCommercialPilotOffer;
  contract: QuickWorkflowValueAcceptanceContract;
  kickoffPack: QuickWorkflowPilotKickoffPack;
  runLog?: QuickWorkflowPilotRunLog | null;
  decisionBrief?: QuickWorkflowPilotDecisionBrief | null;
  expansionGuardrail?: QuickWorkflowPilotExpansionGuardrail | null;
}): QuickWorkflowBuyerExpansionPacket {
  const { commercialPilotOffer, contract, kickoffPack } = input;
  const runLog = input.runLog ?? undefined;
  const decisionBrief = input.decisionBrief ?? undefined;
  const expansionGuardrail = input.expansionGuardrail ?? undefined;
  const stages: QuickWorkflowBuyerExpansionPacketStage[] = [
    {
      id: "offer",
      label: "Commercial offer",
      status: commercialPilotOffer.status,
      owner: commercialPilotOffer.owner,
      value: commercialPilotOffer.priceLine,
      action: commercialPilotOffer.sendRule
    },
    {
      id: "contract",
      label: "Value contract",
      status: contract.status,
      owner: "Finance owner",
      value: `${formatYen(contract.valueFloorYen)}/month floor`,
      action: contract.nextAction,
      receiptId: contract.receipt.receiptId,
      verifierHref: contract.receipt.verifierHref
    },
    {
      id: "kickoff",
      label: "Kickoff plan",
      status: kickoffPack.status,
      owner: kickoffPack.nextOwner,
      value: `${kickoffPack.kickoffStartDate || "No start"} to ${kickoffPack.endDate || "No end"}`,
      action: kickoffPack.nextAction,
      receiptId: kickoffPack.receipt.receiptId
    },
    {
      id: "run",
      label: "Pilot closeout",
      status: stageStatusFromOptional(runLog, kickoffPack.status === "blocked" ? "blocked" : "watch"),
      owner: runLog?.nextOwner ?? "Pilot sponsor",
      value: runLog ? `${runLog.evidenceScore}/100 evidence score` : "Waiting for live run evidence",
      action: runLog?.nextAction ?? "Paste live pilot evidence to issue the run receipt.",
      receiptId: runLog?.receipt.receiptId,
      verifierHref: runLog?.receipt.verifierHref
    },
    {
      id: "decision",
      label: "Decision brief",
      status: stageStatusFromOptional(decisionBrief, runLog?.status === "blocked" ? "blocked" : "watch"),
      owner: decisionBrief?.nextOwner ?? "Procurement owner",
      value: decisionBrief?.decision ?? "Waiting for run closeout",
      action: decisionBrief?.decisionAsk ?? "Close the pilot run log before recording the expansion decision.",
      receiptId: decisionBrief?.receipt.receiptId,
      verifierHref: decisionBrief?.receipt.verifierHref
    },
    {
      id: "expansion",
      label: "Expansion guardrail",
      status: stageStatusFromOptional(expansionGuardrail, decisionBrief?.status === "blocked" ? "blocked" : "watch"),
      owner: expansionGuardrail?.nextOwner ?? "Finance owner",
      value: expansionGuardrail?.decision ?? "Waiting for value recheck",
      action: expansionGuardrail?.nextAction ?? "Record measured value, owner acceptance, receipt chain, and next operating window.",
      receiptId: expansionGuardrail?.receipt.receiptId,
      verifierHref: expansionGuardrail?.receipt.verifierHref
    }
  ];
  const status = packetStatusFor(stages, expansionGuardrail);
  const readyCount = stages.filter((stage) => stage.status === "ready").length;
  const firstOpenStage = [...stages].sort((left, right) => statusRank(left.status) - statusRank(right.status)).find((stage) => stage.status !== "ready");
  const decisionAsk = decisionAskFor({ contract, runLog, decisionBrief, expansionGuardrail });
  const primaryMetric = primaryMetricFor({ contract, runLog, expansionGuardrail });
  const receiptLine = receiptLineFor({ contract, kickoffPack, runLog, decisionBrief, expansionGuardrail });
  const nextOwner = status === "ready" ? (expansionGuardrail?.nextOwner ?? "Procurement owner") : (firstOpenStage?.owner ?? "Procurement owner");
  const nextAction = status === "ready" ? decisionAsk : (firstOpenStage?.action ?? decisionAsk);
  const summary =
    status === "ready"
      ? `${readyCount}/${stages.length} packet stages are ready, so the buyer can inspect the full offer-to-expansion chain.`
      : status === "blocked"
        ? `${readyCount}/${stages.length} packet stages are ready, but a hard blocker prevents buyer expansion.`
        : `${readyCount}/${stages.length} packet stages are ready; keep moving the buyer from pilot evidence to an expansion decision.`;
  const sendNoteSubject = status === "ready" ? `Buyer expansion packet: ${contract.buyer}` : `Buyer packet update: ${contract.buyer}`;
  const sendNoteBody = [
    `${contract.buyer},`,
    "",
    summary,
    "",
    `Decision ask: ${decisionAsk}`,
    `Primary metric: ${primaryMetric}`,
    `Receipt chain: ${receiptLine}`,
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`,
    "",
    "Packet stages:",
    ...stages.map((stage) => `- [${stage.status}] ${stage.label}: ${stage.value}. ${stage.action}${stage.receiptId ? ` Receipt: ${stage.receiptId}` : ""}`)
  ].join("\n");
  const exportMarkdown = [
    "# Quick workflow buyer expansion packet",
    "",
    headlineFor(status, expansionGuardrail, decisionBrief),
    summary,
    `Status: ${status}`,
    `Buyer: ${contract.buyer}`,
    `Workflow: ${contract.workflow}`,
    `Decision ask: ${decisionAsk}`,
    `Primary metric: ${primaryMetric}`,
    `Receipt chain: ${receiptLine}`,
    `Next owner: ${nextOwner}`,
    `Next action: ${nextAction}`,
    "",
    "## Packet stages",
    ...stages.map((stage) =>
      [
        `- [${stage.status}] ${stage.label} (${stage.owner}): ${stage.value}. ${stage.action}`,
        stage.receiptId ? ` Receipt: ${stage.receiptId}.` : "",
        stage.verifierHref ? ` Verifier: ${stage.verifierHref}.` : ""
      ].join("")
    )
  ].join("\n");
  const procurementHandoff = buildQuickWorkflowBuyerExpansionHandoff({
    status,
    headline: headlineFor(status, expansionGuardrail, decisionBrief),
    buyer: contract.buyer,
    workflow: contract.workflow,
    decisionAsk,
    primaryMetric,
    receiptLine,
    readyCount,
    totalCount: stages.length,
    nextOwner,
    nextAction,
    stages
  });
  const exportHtml = buildHtmlOnePager({
    status,
    headline: headlineFor(status, expansionGuardrail, decisionBrief),
    summary,
    buyer: contract.buyer,
    workflow: contract.workflow,
    decisionAsk,
    primaryMetric,
    receiptLine,
    readyCount,
    totalCount: stages.length,
    nextOwner,
    nextAction,
    stages,
    procurementHandoff
  });

  return {
    status,
    headline: headlineFor(status, expansionGuardrail, decisionBrief),
    summary,
    buyer: contract.buyer,
    workflow: contract.workflow,
    decisionAsk,
    primaryMetric,
    receiptLine,
    readyCount,
    totalCount: stages.length,
    nextOwner,
    nextAction,
    stages,
    sendNoteSubject,
    sendNoteBody,
    mailtoHref: `mailto:?subject=${encodeURIComponent(sendNoteSubject)}&body=${encodeURIComponent(sendNoteBody)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    exportHtml,
    exportHtmlHref: `data:text/html;charset=utf-8,${encodeURIComponent(exportHtml)}`,
    procurementHandoff
  };
}
