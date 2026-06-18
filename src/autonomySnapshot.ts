import { createHash } from "node:crypto";
import type { AutonomyLedger, AutonomyLedgerStatus } from "./autonomyLedger.js";
import type { MissionRun } from "./mission.js";
import type { AgentTaskBoard, TaskBoardStatus } from "./taskBoard.js";

export type AutonomySnapshotReadiness = "autonomy-ready" | "autonomy-external-watch" | "autonomy-blocked";

export type AutonomySnapshotLink = {
  id: string;
  label: string;
  method: "GET" | "POST";
  url: string;
  purpose: string;
};

export type AutonomySnapshot = {
  id: string;
  generatedAt: string;
  readiness: AutonomySnapshotReadiness;
  headline: string;
  hardTruth: string;
  summary: {
    ledgerScore: number;
    taskScore: number;
    missionAutonomyScore: number;
    verifiedChainCount: number;
    verifiedWorkOrderCount: number;
    handoffCount: number;
    challengeCount: number;
    externalGapCount: number;
    receiptCount: number;
  };
  links: AutonomySnapshotLink[];
  chain: AutonomyLedger["chain"];
  workOrders: AgentTaskBoard["workOrders"];
  verifications: AgentTaskBoard["verifications"];
  handoffs: AutonomyLedger["handoffs"];
  challengeAnswers: AutonomyLedger["challengeAnswers"];
  receipts: Array<{ id: string; algorithm: "sha256"; digest: string; verification: string }>;
  judgeScript: string[];
  a2aPayload: Record<string, unknown>;
};

function normalizeBase(url: string) {
  return url.replace(/\/$/, "");
}

function endpoint(baseUrl: string, path: string) {
  return `${normalizeBase(baseUrl)}${path}`;
}

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusTone(status: AutonomyLedgerStatus | TaskBoardStatus | AutonomySnapshotReadiness | string) {
  if (["autonomy-ready", "verified", "delegation-ready"].includes(status)) return "good";
  if (["autonomy-blocked", "blocked", "needs-stronger-autonomy"].includes(status)) return "bad";
  if (["autonomy-external-watch", "watch", "running", "watch-verification", "agent-led-with-external-gaps"].includes(status)) return "watch";
  return "good";
}

function externalGapCount(mission: MissionRun) {
  return mission.submissionPack.requirements.filter((requirement) => requirement.status === "needs-url").length;
}

function readinessFor(input: {
  autonomyLedger: AutonomyLedger;
  taskBoard: AgentTaskBoard;
  mission: MissionRun;
}): AutonomySnapshotReadiness {
  const hasBlocked =
    input.autonomyLedger.verdict === "needs-stronger-autonomy" ||
    input.taskBoard.readiness === "blocked" ||
    input.autonomyLedger.chain.some((event) => event.status === "blocked") ||
    input.taskBoard.workOrders.some((order) => order.status === "blocked");
  if (hasBlocked) return "autonomy-blocked";

  const hasWatch =
    input.autonomyLedger.verdict === "agent-led-with-external-gaps" ||
    input.taskBoard.readiness === "watch-verification" ||
    externalGapCount(input.mission) > 0 ||
    input.autonomyLedger.chain.some((event) => event.status === "watch") ||
    input.taskBoard.workOrders.some((order) => order.status === "running");
  if (hasWatch) return "autonomy-external-watch";
  return "autonomy-ready";
}

function headlineFor(readiness: AutonomySnapshotReadiness) {
  if (readiness === "autonomy-ready") return "AIが判断、委任、検証、運用まで価値の中心にいます。";
  if (readiness === "autonomy-external-watch") return "AI中心の判断連鎖は成立しています。外部提出URLだけを最後に閉じます。";
  return "AI中心性の証拠にblockedがあります。録画前に委任または検証を直します。";
}

function hardTruthFor(readiness: AutonomySnapshotReadiness) {
  if (readiness === "autonomy-ready") {
    return "sense、decide、contract、delegate、verify、operate、submitの全工程にactor、verifier、proof URL、receiptがあります。";
  }
  if (readiness === "autonomy-external-watch") {
    return "審査員にはAIが何を判断し誰へ委任したかを先に見せ、ProtoPedia作品URLと動画URLは外部作業として明示します。";
  }
  return "賢そうな分析より、A2A委任先、受入条件、検証コマンド、公開証拠がつながっていることがAIエージェント中心性の条件です。";
}

export function buildAutonomySnapshot(input: {
  baseUrl: string;
  projectBrief?: string;
  selectedAgentIds?: string[];
  autonomyLedger: AutonomyLedger;
  taskBoard: AgentTaskBoard;
  mission: MissionRun;
  generatedAt?: string;
}): AutonomySnapshot {
  const baseUrl = normalizeBase(input.baseUrl);
  const readiness = readinessFor(input);
  const autonomySnapshotUrl = endpoint(baseUrl, "/autonomy-snapshot");
  const autonomySnapshotJsonUrl = endpoint(baseUrl, "/api/autonomy-snapshot");
  const autonomyLedgerUrl = endpoint(baseUrl, "/api/autonomy-ledger");
  const taskBoardUrl = endpoint(baseUrl, "/api/task-board");
  const agentCardUrl = endpoint(baseUrl, "/.well-known/agent-card.json");
  const verifiedChainCount = input.autonomyLedger.chain.filter((event) => event.status === "verified").length;
  const verifiedWorkOrderCount = input.taskBoard.workOrders.filter((order) => order.status === "verified").length;
  const externalGaps = externalGapCount(input.mission);
  const receipts = [
    { id: "autonomy-ledger", ...input.autonomyLedger.receipt },
    { id: "task-board", ...input.taskBoard.receipt },
    {
      id: "autonomy-snapshot",
      algorithm: "sha256" as const,
      digest: digest({
        readiness,
        ledgerScore: input.autonomyLedger.ledgerScore,
        taskScore: input.taskBoard.taskScore,
        chain: input.autonomyLedger.chain.map((event) => ({ id: event.id, status: event.status })),
        workOrders: input.taskBoard.workOrders.map((order) => ({ id: order.id, status: order.status }))
      }),
      verification: "Recompute sha256 over readiness, ledger score, task score, chain status, and work order status."
    }
  ];

  return {
    id: `autonomy-snapshot-${input.autonomyLedger.ledgerScore}-${input.taskBoard.taskScore}-${readiness}`,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    readiness,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness),
    summary: {
      ledgerScore: input.autonomyLedger.ledgerScore,
      taskScore: input.taskBoard.taskScore,
      missionAutonomyScore: input.mission.autonomyScore,
      verifiedChainCount,
      verifiedWorkOrderCount,
      handoffCount: input.autonomyLedger.handoffs.length,
      challengeCount: input.autonomyLedger.challengeAnswers.length,
      externalGapCount: externalGaps,
      receiptCount: receipts.length
    },
    links: [
      {
        id: "autonomy-snapshot",
        label: "Autonomy Snapshot",
        method: "GET",
        url: autonomySnapshotUrl,
        purpose: "審査員がAIエージェント中心性を最初に読むHTML証拠。"
      },
      {
        id: "autonomy-snapshot-json",
        label: "Autonomy Snapshot JSON",
        method: "GET",
        url: autonomySnapshotJsonUrl,
        purpose: "A2AやRelease Driftが読む機械可読の自律性証拠。"
      },
      {
        id: "autonomy-ledger",
        label: "Autonomy Ledger",
        method: "POST",
        url: autonomyLedgerUrl,
        purpose: "判断連鎖、challenge answer、sha256 receiptを再計算する。"
      },
      {
        id: "task-board",
        label: "Agent Task Board",
        method: "POST",
        url: taskBoardUrl,
        purpose: "A2A委任先、受入条件、検証コマンド、proof URLを再計算する。"
      },
      {
        id: "agent-card",
        label: "A2A Agent Card",
        method: "GET",
        url: agentCardUrl,
        purpose: "autonomy.snapshot、autonomy.ledger、task.delegateを含むskill surface。"
      },
      {
        id: "mvp-readiness",
        label: "MVP Readiness",
        method: "GET",
        url: endpoint(baseUrl, "/mvp-readiness"),
        purpose: "AI中心性を含むMVP受入と公開revisionの提出可否。"
      },
      {
        id: "pilot-value",
        label: "Pilot Value Snapshot",
        method: "GET",
        url: endpoint(baseUrl, "/pilot-value"),
        purpose: "実用性、初回体験、導入採算の証拠。"
      },
      {
        id: "a2a",
        label: "A2A JSON-RPC",
        method: "POST",
        url: endpoint(baseUrl, "/a2a"),
        purpose: "外部エージェントから成果物endpointsを発見する入口。"
      }
    ],
    chain: input.autonomyLedger.chain,
    workOrders: input.taskBoard.workOrders,
    verifications: input.taskBoard.verifications,
    handoffs: input.autonomyLedger.handoffs,
    challengeAnswers: input.autonomyLedger.challengeAnswers,
    receipts,
    judgeScript: [
      "最初に /autonomy-snapshot をGETで開き、AIエージェント中心性を判断連鎖として見せる。",
      `Autonomy Ledger ${input.autonomyLedger.ledgerScore}、Task Board ${input.taskBoard.taskScore}、Mission autonomy ${input.mission.autonomyScore}を読み上げる。`,
      `${input.autonomyLedger.chain.length} phases: ${input.autonomyLedger.chain.map((event) => event.phase).join(" -> ")}.`,
      `${input.taskBoard.workOrders.length} work orders are delegated with acceptance criteria and proof URLs; verified ${verifiedWorkOrderCount}/${input.taskBoard.workOrders.length}.`,
      externalGaps > 0
        ? `External watch ${externalGaps}: ProtoPedia作品URLと動画URLはSubmission Assets/Recording Scriptで閉じる。`
        : "External submission gaps are closed.",
      "深掘りではPOST /api/autonomy-ledger、POST /api/task-board、Agent Card、A2A artifactを順に開く。"
    ],
    a2aPayload: {
      method: "message/send",
      skill: "autonomy.snapshot",
      readiness,
      ledgerScore: input.autonomyLedger.ledgerScore,
      taskScore: input.taskBoard.taskScore,
      missionAutonomyScore: input.mission.autonomyScore,
      autonomyVerdict: input.autonomyLedger.verdict,
      taskReadiness: input.taskBoard.readiness,
      externalGapCount: externalGaps,
      chain: input.autonomyLedger.chain.map((event) => ({ id: event.id, phase: event.phase, status: event.status, endpoint: event.endpoint })),
      workOrders: input.taskBoard.workOrders.map((order) => ({ id: order.id, agentId: order.agentId, status: order.status, proofUrl: order.proofUrl })),
      receipts: receipts.map((receipt) => ({ id: receipt.id, digest: receipt.digest })),
      endpoints: {
        autonomySnapshot: autonomySnapshotUrl,
        autonomySnapshotJson: autonomySnapshotJsonUrl,
        autonomyLedger: autonomyLedgerUrl,
        taskBoard: taskBoardUrl,
        agentCard: agentCardUrl,
        mvpReadiness: endpoint(baseUrl, "/mvp-readiness"),
        pilotValue: endpoint(baseUrl, "/pilot-value"),
        a2a: endpoint(baseUrl, "/a2a")
      }
    }
  };
}

function renderLinkList(links: AutonomySnapshotLink[]) {
  return links
    .map(
      (link) => `
        <a class="link-row" href="${escapeHtml(link.url)}">
          <span>${escapeHtml(link.method)}</span>
          <strong>${escapeHtml(link.label)}</strong>
          <small>${escapeHtml(link.purpose)}</small>
        </a>`
    )
    .join("");
}

export function renderAutonomySnapshotHtml(snapshot: AutonomySnapshot) {
  const chain = snapshot.chain
    .map(
      (event) => `
        <article class="chain-card ${statusTone(event.status)}">
          <div><strong>${escapeHtml(event.phase)} / ${escapeHtml(event.actor)}</strong><span>${escapeHtml(event.status)}</span></div>
          <p>${escapeHtml(event.decision)}</p>
          <small>${escapeHtml(event.action)} / ${escapeHtml(event.verifier)} / <a href="${escapeHtml(event.endpoint)}">proof</a></small>
        </article>`
    )
    .join("");
  const workOrders = snapshot.workOrders
    .map(
      (order) => `
        <article class="work-card ${statusTone(order.status)}">
          <div><strong>${escapeHtml(order.agentName)}</strong><span>${escapeHtml(order.phase)} / ${escapeHtml(order.status)}</span></div>
          <p>${escapeHtml(order.objective)}</p>
          <ul>${order.acceptance.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <small>${escapeHtml(order.verifier)} / <a href="${escapeHtml(order.proofUrl)}">proof</a></small>
        </article>`
    )
    .join("");
  const verifications = snapshot.verifications
    .map(
      (verification) => `
        <article class="verify-card ${statusTone(verification.status)}">
          <div><strong>${escapeHtml(verification.label)}</strong><span>${escapeHtml(verification.status)}</span></div>
          <code>${escapeHtml(verification.command)}</code>
          <small>${escapeHtml(verification.proof)}</small>
        </article>`
    )
    .join("");
  const challenges = snapshot.challengeAnswers
    .map(
      (challenge) => `
        <article class="challenge">
          <strong>${escapeHtml(challenge.challenge)}</strong>
          <p>${escapeHtml(challenge.answer)}</p>
          <small>${escapeHtml(challenge.proof)}</small>
        </article>`
    )
    .join("");
  const receipts = snapshot.receipts
    .map(
      (receipt) => `
        <article class="receipt">
          <div><strong>${escapeHtml(receipt.id)}</strong><span>${escapeHtml(receipt.algorithm)}</span></div>
          <code>${escapeHtml(receipt.digest)}</code>
          <small>${escapeHtml(receipt.verification)}</small>
        </article>`
    )
    .join("");
  const scriptLines = snapshot.judgeScript.map((line) => `<li>${escapeHtml(line)}</li>`).join("");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Autonomy Snapshot</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #17201d;
        --muted: #5f6965;
        --line: #dce5df;
        --paper: #fbfcfa;
        --panel: #ffffff;
        --green: #13715d;
        --mint: #e6f4ed;
        --amber: #8a620d;
        --amber-bg: #fff4d4;
        --coral: #b24735;
        --blue: #245c99;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.55;
      }
      a { color: inherit; }
      header, main, footer { width: min(1160px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 40px 0 20px; }
      .eyebrow { color: var(--green); font-size: 0.78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
      h1 { margin: 8px 0 10px; font-size: clamp(2rem, 5vw, 4.45rem); line-height: 1; letter-spacing: 0; max-width: 980px; }
      header p { color: var(--muted); max-width: 860px; }
      .metric-grid, .links-grid, .chain-grid, .work-grid, .verify-grid, .challenge-grid, .receipt-grid {
        display: grid;
        gap: 12px;
      }
      .metric-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 22px; }
      .metric, .section, .chain-card, .work-card, .verify-card, .challenge, .receipt {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: 0 1px 0 rgba(23, 32, 29, 0.03);
      }
      .metric { padding: 14px; min-width: 0; }
      .metric span { display: block; color: var(--muted); font-size: 0.75rem; font-weight: 800; }
      .metric strong { display: block; margin-top: 4px; font-size: 1.25rem; line-height: 1.05; overflow-wrap: anywhere; }
      .good { background: var(--mint); border-color: #b9dfd1; }
      .watch { background: var(--amber-bg); border-color: #ecd58c; }
      .bad { background: #ffe4de; border-color: #efb2a6; }
      .section { padding: 18px; margin: 14px 0; }
      .section h2 { margin: 0 0 12px; font-size: 1.05rem; }
      .links-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .link-row { display: grid; gap: 4px; padding: 12px; border: 1px solid var(--line); border-radius: 8px; text-decoration: none; background: #fff; }
      .link-row span, .chain-card span, .work-card span, .verify-card span, .receipt span { color: var(--blue); font-size: 0.72rem; font-weight: 900; }
      .link-row small, .chain-card small, .work-card small, .verify-card small, .challenge small, .receipt small { color: var(--muted); overflow-wrap: anywhere; }
      .chain-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .work-grid, .challenge-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .verify-grid, .receipt-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .chain-card, .work-card, .verify-card, .challenge, .receipt { padding: 12px; }
      .chain-card div, .work-card div, .verify-card div, .receipt div { display: flex; gap: 10px; justify-content: space-between; align-items: center; }
      .chain-card p, .work-card p, .challenge p { margin: 8px 0; }
      ul, ol { margin: 0; padding-left: 22px; color: var(--muted); }
      li + li { margin-top: 8px; }
      code { display: block; white-space: pre-wrap; overflow-wrap: anywhere; padding: 10px; border-radius: 8px; background: #17201d; color: #eef8f4; font-size: 0.78rem; }
      footer { color: var(--muted); font-size: 0.84rem; padding: 10px 0 36px; }
      @media (max-width: 860px) {
        header { padding-top: 28px; }
        .metric-grid, .links-grid, .chain-grid, .work-grid, .verify-grid, .challenge-grid, .receipt-grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Autonomy Snapshot</div>
      <h1>${escapeHtml(snapshot.headline)}</h1>
      <p>${escapeHtml(snapshot.hardTruth)}</p>
      <div class="metric-grid">
        <div class="metric ${statusTone(snapshot.readiness)}"><span>Readiness</span><strong>${escapeHtml(snapshot.readiness)}</strong></div>
        <div class="metric ${statusTone(snapshot.readiness)}"><span>Ledger</span><strong>${escapeHtml(snapshot.summary.ledgerScore)}</strong></div>
        <div class="metric ${statusTone(snapshot.readiness)}"><span>Task Board</span><strong>${escapeHtml(snapshot.summary.taskScore)}</strong></div>
        <div class="metric good"><span>Verified Chain</span><strong>${escapeHtml(snapshot.summary.verifiedChainCount)} / ${escapeHtml(snapshot.chain.length)}</strong></div>
        <div class="metric ${snapshot.summary.externalGapCount > 0 ? "watch" : "good"}"><span>External Gaps</span><strong>${escapeHtml(snapshot.summary.externalGapCount)}</strong></div>
      </div>
    </header>
    <main>
      <section class="section">
        <h2>First-Click Links</h2>
        <div class="links-grid">${renderLinkList(snapshot.links)}</div>
      </section>
      <section class="section">
        <h2>Agent Decision Chain</h2>
        <div class="chain-grid">${chain}</div>
      </section>
      <section class="section">
        <h2>A2A Work Orders</h2>
        <div class="work-grid">${workOrders}</div>
      </section>
      <section class="section">
        <h2>Verification Commands</h2>
        <div class="verify-grid">${verifications}</div>
      </section>
      <section class="section">
        <h2>Challenge Answers</h2>
        <div class="challenge-grid">${challenges}</div>
      </section>
      <section class="section">
        <h2>Receipts</h2>
        <div class="receipt-grid">${receipts}</div>
      </section>
      <section class="section">
        <h2>Judge Script</h2>
        <ol>${scriptLines}</ol>
      </section>
    </main>
    <footer>${escapeHtml(snapshot.id)} / generated ${escapeHtml(snapshot.generatedAt)}</footer>
  </body>
</html>`;
}
