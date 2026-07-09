import { summarizeAgentTrialEvidence, type AgentTrialEvidenceRecord } from "./agentTrialEvidence.js";
import type { BuyerPilotCommand } from "./buyerPilotCommand.js";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";
import type { BuyerValueScenario } from "./buyerValueScenario.js";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder.js";
import type { PilotRunReceiptInput } from "./pilotRunReceipt.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";

export type BuyerEvidenceBoardStatus = "sendable" | "review-first" | "blocked";
export type BuyerEvidenceBoardItemStatus = "ready" | "watch" | "blocked";
export const BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH = "/api/buyer-evidence-board/receipt/verify";

export type BuyerEvidenceBoardItem = {
  id: "scope" | "value" | "measured-run" | "live-proof" | "agent-trust" | "decision-route";
  label: string;
  status: BuyerEvidenceBoardItemStatus;
  owner: string;
  value: string;
  evidence: string;
  nextAction: string;
  href: string;
};

export type BuyerEvidenceBoardReviewQuestion = {
  id: "workflow-approval" | "value-proof" | "public-proof" | "agent-trust";
  label: string;
  question: string;
  answer: string;
  status: BuyerEvidenceBoardItemStatus;
  nextAction: string;
  href: string;
};

export type BuyerEvidenceBoardReviewerBrief = {
  title: string;
  meetingGoal: string;
  recommendedDecision: "send" | "sponsor-review" | "hold";
  noSendRule: string;
  questions: BuyerEvidenceBoardReviewQuestion[];
  copyText: string;
};

export type BuyerEvidenceBoardHrefs = {
  workflowIntake: string;
  valueReport: string;
  measuredRun: string;
  proofAudit: string;
  trustManifest: string;
  launchRoom: string;
  publicPage?: string;
};

export type BuyerEvidenceBoardReceiptPayload = {
  manifestVersion: "buyer-evidence-board.v1";
  issuedAt: string;
  status: BuyerEvidenceBoardStatus;
  score: number;
  buyer: string;
  decision: string;
  readyCount: number;
  itemCount: number;
  firstBlocker: string;
  reviewerBrief: {
    recommendedDecision: BuyerEvidenceBoardReviewerBrief["recommendedDecision"];
    noSendRule: string;
    questions: Array<Pick<BuyerEvidenceBoardReviewQuestion, "id" | "label" | "status" | "question" | "answer" | "nextAction">>;
  };
  items: Array<Pick<BuyerEvidenceBoardItem, "id" | "label" | "status" | "value" | "evidence" | "nextAction">>;
};

export type BuyerEvidenceBoardReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH;
  payload: BuyerEvidenceBoardReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: BuyerEvidenceBoardReceiptVerification;
};

export type BuyerEvidenceBoardReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type BuyerEvidenceBoard = {
  status: BuyerEvidenceBoardStatus;
  headline: string;
  summary: string;
  score: number;
  buyer: string;
  decisionRule: string;
  readyCount: number;
  itemCount: number;
  firstBlocker: BuyerEvidenceBoardItem | null;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction: {
    label: string;
    href: string;
  };
  publicPageAction?: {
    label: string;
    href: string;
  };
  items: BuyerEvidenceBoardItem[];
  reviewerBrief: BuyerEvidenceBoardReviewerBrief;
  memoMarkdown: string;
  receipt: BuyerEvidenceBoardReceipt;
};

export type BuyerEvidenceBoardInput = {
  projectBrief: string;
  buyerScenario: BuyerValueScenario;
  pilotRun: PilotRunReceiptInput;
  buyerWorkOrder: BuyerWorkOrderInput;
  agentTrialEvidence: AgentTrialEvidenceRecord[];
  command: BuyerPilotCommand;
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  issuedAt: string;
  hrefs: BuyerEvidenceBoardHrefs;
};

export type BuyerEvidenceBoardHtmlLinks = {
  appUrl?: string;
  launchRoomUrl?: string;
  proofAuditUrl?: string;
  jsonUrl?: string;
  markdownUrl?: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function yen(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

function safeText(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed || fallback;
}

function statusScore(status: BuyerEvidenceBoardItemStatus) {
  if (status === "ready") return 100;
  if (status === "watch") return 65;
  return 0;
}

function boardStatusFor(items: BuyerEvidenceBoardItem[]): BuyerEvidenceBoardStatus {
  if (items.some((item) => item.status === "blocked")) return "blocked";
  if (items.some((item) => item.status === "watch")) return "review-first";
  return "sendable";
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

function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
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

function escapeScriptJson(value: string) {
  return value
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function proofVerificationItem(input: BuyerEvidenceBoardInput): BuyerEvidenceBoardItem {
  const proof = input.proofVerification;
  if (!proof) {
    return {
      id: "live-proof",
      label: "Live proof",
      status: "blocked",
      owner: "Cloud Run SRE",
      value: "not checked",
      evidence: "Public proof URLs have not been checked from the running app.",
      nextAction: "Run live proof verification before any external buyer share.",
      href: input.hrefs.proofAudit
    };
  }

  const blocked = proof.results.filter((result) => result.status === "block").length;
  const watch = proof.results.filter((result) => result.status === "watch").length;
  return {
    id: "live-proof",
    label: "Live proof",
    status: blocked > 0 ? "blocked" : watch > 0 ? "watch" : "ready",
    owner: "Cloud Run SRE",
    value: `${proof.verifiedCount}/${proof.totalCount} checked`,
    evidence: `Reachability score ${proof.score}/100 from ${proof.results.length} proof link checks.`,
    nextAction: blocked > 0 ? proof.results.find((result) => result.status === "block")?.action || "Repair blocked proof links." : watch > 0 ? "Review warning proof links before sending." : "Keep proof checks fresh before each share.",
    href: input.hrefs.proofAudit
  };
}

function buildItems(input: BuyerEvidenceBoardInput): BuyerEvidenceBoardItem[] {
  const scopeFields = [input.buyerWorkOrder.targetUser, input.buyerWorkOrder.request, input.buyerWorkOrder.successMetric, input.buyerWorkOrder.currentBaseline].filter((value) => value.trim());
  const workOrderProofReady = isBuyerFacingProofUrl(input.buyerWorkOrder.evidenceUrl);
  const minutesSaved = Math.max(0, input.pilotRun.observedManualMinutes - input.pilotRun.observedAssistedMinutes);
  const acceptanceRate = Math.round((input.pilotRun.acceptedTasks / Math.max(1, input.pilotRun.totalTasks)) * 100);
  const pilotProofReady = isBuyerFacingProofUrl(input.pilotRun.evidenceUrl);
  const trialSummary = summarizeAgentTrialEvidence(input.agentTrialEvidence);

  return [
    {
      id: "scope",
      label: "Buyer scope",
      status: scopeFields.length >= 4 && workOrderProofReady ? "ready" : scopeFields.length >= 3 ? "watch" : "blocked",
      owner: "Pilot owner",
      value: safeText(input.buyerWorkOrder.targetUser, "buyer missing"),
      evidence: `${scopeFields.length}/4 scope fields captured${workOrderProofReady ? " with public work-order proof" : ""}.`,
      nextAction: workOrderProofReady ? "Keep the buyer-approved work order attached." : "Attach a public work-order proof URL.",
      href: input.hrefs.workflowIntake
    },
    {
      id: "value",
      label: "Value case",
      status: input.buyerScenario.monthlyGrossValueYen <= 0 || input.buyerScenario.paybackDays > 90 ? "blocked" : input.buyerScenario.paybackDays <= 45 && input.buyerScenario.confidenceScore >= 70 ? "ready" : "watch",
      owner: "Economic buyer",
      value: `${yen(input.buyerScenario.monthlyGrossValueYen)}/mo`,
      evidence: `${input.buyerScenario.monthlyHoursSaved}h/month saved, ${input.buyerScenario.paybackDays}-day payback, ${input.buyerScenario.confidenceScore}/100 confidence.`,
      nextAction: input.buyerScenario.paybackDays <= 45 ? "Use the value report as the commercial anchor." : "Tighten scope or assumptions until payback is under 45 days.",
      href: input.hrefs.valueReport
    },
    {
      id: "measured-run",
      label: "Measured run",
      status: minutesSaved <= 0 || acceptanceRate < 50 ? "blocked" : pilotProofReady && acceptanceRate >= 70 ? "ready" : "watch",
      owner: safeText(input.pilotRun.reviewerName, "Pilot reviewer"),
      value: `${minutesSaved}m saved/run`,
      evidence: `${input.pilotRun.acceptedTasks}/${input.pilotRun.totalTasks} tasks accepted by ${safeText(input.pilotRun.reviewerName, "the reviewer")}${pilotProofReady ? " with public receipt" : ""}.`,
      nextAction: pilotProofReady ? "Keep the measured receipt attached to the buyer room." : "Attach a public measured-run receipt before buyer review.",
      href: input.hrefs.measuredRun
    },
    proofVerificationItem(input),
    {
      id: "agent-trust",
      label: "Agent trust",
      status: trialSummary.status === "ready" ? "ready" : trialSummary.status === "watch" ? "watch" : "blocked",
      owner: "Agent operator",
      value: trialSummary.status === "ready" ? `${trialSummary.acceptedCount} accepted` : "not accepted",
      evidence: trialSummary.evidence,
      nextAction: trialSummary.status === "ready" ? "Attach the accepted A2A trial proof in the buyer handoff." : "Attach at least one accepted A2A trial receipt with public artifact URL.",
      href: input.hrefs.trustManifest
    },
    {
      id: "decision-route",
      label: "Decision route",
      status: input.command.readiness === "buyer-ready" ? "ready" : input.command.launchScore >= 72 ? "watch" : "blocked",
      owner: input.command.nextGap.owner,
      value: `${clamp(input.command.launchScore)}/100`,
      evidence: `${input.command.headline}. Current gap: ${input.command.nextGap.label}.`,
      nextAction: input.command.readiness === "buyer-ready" ? "Open the launch room with receipts attached." : input.command.nextGap.action,
      href: input.hrefs.launchRoom
    }
  ];
}

function headlineFor(status: BuyerEvidenceBoardStatus) {
  if (status === "sendable") return "Buyer evidence board is sendable";
  if (status === "review-first") return "Sponsor review can continue";
  return "Do not send this buyer room yet";
}

function decisionRuleFor(status: BuyerEvidenceBoardStatus, blocker: BuyerEvidenceBoardItem | null) {
  if (status === "sendable") return "External buyer share is allowed with the memo, receipt, and live proof audit attached.";
  if (status === "review-first") return "Keep this in sponsor review until every watch item has an owner and acceptance date.";
  return `${blocker?.label ?? "Evidence"} blocks external sharing. Fix it before a buyer sees this room.`;
}

function itemById(items: BuyerEvidenceBoardItem[], id: BuyerEvidenceBoardItem["id"]) {
  return items.find((item) => item.id === id);
}

function reviewerDecisionFor(status: BuyerEvidenceBoardStatus): BuyerEvidenceBoardReviewerBrief["recommendedDecision"] {
  if (status === "sendable") return "send";
  if (status === "review-first") return "sponsor-review";
  return "hold";
}

function buildReviewerQuestion(input: {
  id: BuyerEvidenceBoardReviewQuestion["id"];
  label: string;
  question: string;
  item: BuyerEvidenceBoardItem;
  answerPrefix: string;
}): BuyerEvidenceBoardReviewQuestion {
  return {
    id: input.id,
    label: input.label,
    question: input.question,
    answer: `${input.answerPrefix} ${input.item.value}. ${input.item.evidence}`,
    status: input.item.status,
    nextAction: input.item.nextAction,
    href: input.item.href
  };
}

function buildReviewerBrief(input: {
  status: BuyerEvidenceBoardStatus;
  buyer: string;
  score: number;
  readyCount: number;
  itemCount: number;
  decisionRule: string;
  items: BuyerEvidenceBoardItem[];
}): BuyerEvidenceBoardReviewerBrief {
  const scope = itemById(input.items, "scope") ?? input.items[0];
  const value = itemById(input.items, "value") ?? input.items[1] ?? scope;
  const liveProof = itemById(input.items, "live-proof") ?? input.items[3] ?? scope;
  const agentTrust = itemById(input.items, "agent-trust") ?? input.items[4] ?? scope;
  const recommendedDecision = reviewerDecisionFor(input.status);
  const title =
    recommendedDecision === "send"
      ? `Buyer review brief for ${input.buyer}`
      : recommendedDecision === "sponsor-review"
        ? `Sponsor review brief for ${input.buyer}`
        : `Hold brief for ${input.buyer}`;
  const noSendRule =
    input.status === "sendable"
      ? "Do not send again if any evidence lane moves out of ready before the buyer opens the room."
      : input.decisionRule;
  const questions = [
    buildReviewerQuestion({
      id: "workflow-approval",
      label: "Workflow",
      question: "What workflow is the buyer approving?",
      item: scope,
      answerPrefix: "The approval scope is"
    }),
    buildReviewerQuestion({
      id: "value-proof",
      label: "Value",
      question: "What buyer value is backed by proof?",
      item: value,
      answerPrefix: "The value case is"
    }),
    buildReviewerQuestion({
      id: "public-proof",
      label: "Public proof",
      question: "Can a reviewer open the proof without a private walkthrough?",
      item: liveProof,
      answerPrefix: "The live proof lane reports"
    }),
    buildReviewerQuestion({
      id: "agent-trust",
      label: "Agent trust",
      question: "What shows the agent can be trusted to run this work?",
      item: agentTrust,
      answerPrefix: "The agent trust lane shows"
    })
  ];
  const copyText = [
    title,
    `Decision: ${recommendedDecision}`,
    `Score: ${input.score}/100, ${input.readyCount}/${input.itemCount} lanes ready`,
    `No-send rule: ${noSendRule}`,
    "",
    ...questions.map((question) => `Q: ${question.question}\nA: ${question.answer}\nNext: ${question.nextAction}`)
  ].join("\n");

  return {
    title,
    meetingGoal: `Make a continue, sponsor-review, or hold decision for ${input.buyer} from ${input.readyCount}/${input.itemCount} evidence lanes.`,
    recommendedDecision,
    noSendRule,
    questions,
    copyText
  };
}

function buildMemo(input: {
  board: Omit<BuyerEvidenceBoard, "memoMarkdown" | "receipt">;
  projectBrief: string;
  receipt: BuyerEvidenceBoardReceipt;
}) {
  return [
    `# ${input.board.headline}`,
    "",
    `Status: ${input.board.status}`,
    `Score: ${input.board.score}/100`,
    `Buyer: ${input.board.buyer}`,
    `Receipt: ${input.receipt.receiptId}`,
    `Checksum: ${input.receipt.checksumAlgorithm}:${input.receipt.checksum}`,
    "",
    input.board.summary,
    "",
    "## Decision rule",
    input.board.decisionRule,
    "",
    "## Reviewer brief",
    `Decision: ${input.board.reviewerBrief.recommendedDecision}`,
    `Meeting goal: ${input.board.reviewerBrief.meetingGoal}`,
    `No-send rule: ${input.board.reviewerBrief.noSendRule}`,
    "",
    ...input.board.reviewerBrief.questions.flatMap((question) => [
      `### ${question.label}`,
      `Question: ${question.question}`,
      `Answer: ${question.answer}`,
      `Status: ${question.status}`,
      `Next: ${question.nextAction}`,
      ""
    ]),
    "## Evidence board",
    ...input.board.items.map((item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.evidence} Next: ${item.nextAction}`),
    "",
    "## Source brief",
    input.projectBrief.trim().slice(0, 900) || "No project brief attached."
  ].join("\n");
}

export function verifyBuyerEvidenceBoardReceipt(receipt: Pick<BuyerEvidenceBoardReceipt, "checksum" | "payload">): BuyerEvidenceBoardReceiptVerification {
  const actualChecksum = stableDigest(receipt.payload);
  const verified = actualChecksum === receipt.checksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum: receipt.checksum,
    actualChecksum,
    instruction: verified
      ? "Buyer evidence board receipt checksum matches the attached replay payload."
      : "Buyer evidence board receipt checksum does not match the attached replay payload. Re-export the board before using this buyer decision."
  };
}

export function buildBuyerEvidenceBoard(input: BuyerEvidenceBoardInput): BuyerEvidenceBoard {
  const items = buildItems(input);
  const status = boardStatusFor(items);
  const score = Math.round(items.reduce((sum, item) => sum + statusScore(item.status), 0) / Math.max(1, items.length));
  const firstBlocker = items.find((item) => item.status === "blocked") ?? null;
  const readyCount = items.filter((item) => item.status === "ready").length;
  const buyer = safeText(input.buyerWorkOrder.targetUser, input.command.targetBuyer);
  const boardBase = {
    status,
    headline: headlineFor(status),
    summary:
      status === "sendable"
        ? `${buyer} can inspect scope, value, measured run, live proof, agent trust, and decision route in one packet.`
        : `${buyer} has ${readyCount}/${items.length} evidence lanes ready. ${firstBlocker ? `${firstBlocker.label} is the first blocker.` : "Watch items still need sponsor review."}`,
    score,
    buyer,
    decisionRule: decisionRuleFor(status, firstBlocker),
    readyCount,
    itemCount: items.length,
    firstBlocker,
    primaryAction: status === "sendable" ? { label: "Open launch room", href: input.hrefs.launchRoom } : { label: firstBlocker ? `Fix ${firstBlocker.label}` : "Review evidence", href: firstBlocker?.href ?? input.hrefs.workflowIntake },
    secondaryAction: { label: "Open proof audit", href: input.hrefs.proofAudit },
    publicPageAction: input.hrefs.publicPage ? { label: "Public page", href: input.hrefs.publicPage } : undefined,
    items,
    reviewerBrief: buildReviewerBrief({
      status,
      buyer,
      score,
      readyCount,
      itemCount: items.length,
      decisionRule: decisionRuleFor(status, firstBlocker),
      items
    })
  };
  const payload: BuyerEvidenceBoardReceiptPayload = {
    manifestVersion: "buyer-evidence-board.v1",
    issuedAt: input.issuedAt,
    status,
    score,
    buyer,
    decision: boardBase.decisionRule,
    readyCount,
    itemCount: items.length,
    firstBlocker: firstBlocker?.label ?? "none",
    reviewerBrief: {
      recommendedDecision: boardBase.reviewerBrief.recommendedDecision,
      noSendRule: boardBase.reviewerBrief.noSendRule,
      questions: boardBase.reviewerBrief.questions.map((question) => ({
        id: question.id,
        label: question.label,
        status: question.status,
        question: question.question,
        answer: question.answer,
        nextAction: question.nextAction
      }))
    },
    items: items.map((item) => ({
      id: item.id,
      label: item.label,
      status: item.status,
      value: item.value,
      evidence: item.evidence,
      nextAction: item.nextAction
    }))
  };
  const checksum = stableDigest(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyBuyerEvidenceBoardReceipt({ checksum, payload });
  const receipt: BuyerEvidenceBoardReceipt = {
    receiptId: `buyer-evidence-board-${status}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };

  return {
    ...boardBase,
    memoMarkdown: buildMemo({ board: boardBase, projectBrief: input.projectBrief, receipt }),
    receipt
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

function tone(status: BuyerEvidenceBoardStatus | BuyerEvidenceBoardItemStatus) {
  if (status === "sendable" || status === "ready") return "good";
  if (status === "blocked") return "bad";
  return "watch";
}

export function renderBuyerEvidenceBoardHtml(board: BuyerEvidenceBoard, links: BuyerEvidenceBoardHtmlLinks = {}) {
  const receiptVerificationRequestJson = escapeScriptJson(board.receipt.verificationRequestJson);
  const receiptVerificationApiPathJson = JSON.stringify(board.receipt.verificationApiPath);
  const nav = [
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workspace</a>` : "",
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.proofAuditUrl ? `<a href="${escapeHtml(links.proofAuditUrl)}">Proof audit</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const items = board.items
    .map(
      (item) => `
        <article class="lane ${tone(item.status)}">
          <div>
            <span>${escapeHtml(item.status)}</span>
            <strong>${escapeHtml(item.label)}</strong>
          </div>
          <b>${escapeHtml(item.value)}</b>
          <p>${escapeHtml(item.evidence)}</p>
          <small>${escapeHtml(item.owner)}: ${escapeHtml(item.nextAction)}</small>
          <a href="${escapeHtml(item.href)}">${item.status === "ready" ? "Inspect proof" : "Fix lane"}</a>
        </article>`
    )
    .join("");
  const reviewerQuestions = board.reviewerBrief.questions
    .map(
      (question) => `
        <article class="review-question ${tone(question.status)}">
          <span>${escapeHtml(question.status)}</span>
          <strong>${escapeHtml(question.question)}</strong>
          <p>${escapeHtml(question.answer)}</p>
          <small>${escapeHtml(question.nextAction)}</small>
          <a href="${escapeHtml(question.href)}">${question.status === "ready" ? "Inspect answer" : "Fix answer"}</a>
        </article>`
    )
    .join("");
  const receiptHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(board.receipt, null, 2))}`;
  const blocker = board.firstBlocker ?? {
    label: "All lanes clear",
    owner: board.buyer,
    nextAction: "Keep proof fresh before each external share."
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(board.headline)} - Buyer Evidence Board</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #5b675f; --paper: #edf3ef; --panel: #fffdf8; --line: #cbd8d2; --green: #0f766e; --blue: #255fa8; --amber: #9a6708; --rose: #b33755; --good-bg: #eaf7ef; --watch-bg: #fff7dc; --bad-bg: #fff1f3; --shadow: 0 20px 54px rgba(23, 33, 38, .1); }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: linear-gradient(180deg, #e7f0eb 0, var(--paper) 320px); font-family: Inter, Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 22px; align-items: end; padding: 42px 0 16px; }
      .eyebrow, h2, .lane span, .score span, dt { color: var(--green); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 850px; margin: 7px 0 12px; font-size: clamp(2.15rem, 5vw, 4.55rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0 0 9px; }
      p, small, dd { margin: 0; color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      nav a, .lane a, .receipt a { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: var(--panel); font-size: .9rem; font-weight: 900; text-decoration: none; }
      .score { min-height: 208px; display: grid; place-items: center; align-content: center; gap: 8px; border: 1px solid #14322e; border-radius: 8px; color: #fffdf8; background: #14322e; box-shadow: var(--shadow); text-align: center; }
      .score span, .score small { color: rgba(255, 253, 248, .78); font-weight: 950; }
      .score strong { font-size: 4.7rem; line-height: .86; }
      .score small { max-width: 170px; font-size: .78rem; line-height: 1.15; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .decision, .lanes, .receipt { min-width: 0; }
      .decision, .receipt { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: var(--shadow); padding: 18px; }
      .decision { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, .34fr); gap: 16px; align-items: center; border-left: 6px solid var(--rose); }
      .decision.good { border-left-color: var(--green); background: var(--good-bg); }
      .decision.watch { border-left-color: var(--amber); background: var(--watch-bg); }
      .decision strong { display: block; margin: 4px 0 7px; font-size: 1.45rem; line-height: 1.08; overflow-wrap: anywhere; }
      .status-pill { justify-self: end; border: 1px solid rgba(23, 33, 38, .16); border-radius: 8px; padding: 14px; background: rgba(255, 253, 248, .8); font-weight: 950; text-align: center; }
      .status-pill b { display: block; font-size: 1.7rem; line-height: 1; }
      .lanes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      .lane { min-width: 0; min-height: 222px; display: grid; grid-template-rows: auto auto minmax(52px, 1fr) auto auto; gap: 9px; border: 1px solid var(--line); border-top: 6px solid var(--rose); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .06); padding: 14px; }
      .lane.good { border-top-color: var(--green); background: var(--good-bg); }
      .lane.watch { border-top-color: var(--amber); background: var(--watch-bg); }
      .lane.bad { border-top-color: var(--rose); background: var(--bad-bg); }
      .lane div { display: grid; gap: 4px; }
      .lane strong { font-size: 1.08rem; line-height: 1.08; overflow-wrap: anywhere; }
      .lane b { font-size: 1.25rem; line-height: 1.05; overflow-wrap: anywhere; }
      .lane p, .lane small { font-size: .88rem; line-height: 1.35; overflow-wrap: anywhere; }
      .lane small { color: var(--green); font-weight: 900; }
      .lane a { justify-self: start; background: #fffdf8; }
      .reviewer { display: grid; grid-template-columns: minmax(0, .58fr) minmax(0, 1fr); gap: 12px; align-items: stretch; }
      .reviewer-intro, .review-question { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .06); padding: 16px; }
      .reviewer-intro strong { display: block; margin: 5px 0 8px; font-size: 1.35rem; line-height: 1.12; overflow-wrap: anywhere; }
      .reviewer-intro small { display: block; margin-top: 10px; color: var(--rose); font-weight: 900; overflow-wrap: anywhere; }
      .review-questions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .review-question { min-width: 0; display: grid; gap: 8px; border-top: 5px solid var(--rose); }
      .review-question.good { border-top-color: var(--green); background: var(--good-bg); }
      .review-question.watch { border-top-color: var(--amber); background: var(--watch-bg); }
      .review-question span { color: var(--green); font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .review-question strong { font-size: 1rem; line-height: 1.12; overflow-wrap: anywhere; }
      .review-question p, .review-question small { font-size: .88rem; line-height: 1.35; overflow-wrap: anywhere; }
      .review-question small { color: var(--green); font-weight: 900; }
      .review-question a { justify-self: start; }
      .receipt { display: grid; grid-template-columns: minmax(0, .82fr) minmax(260px, .44fr); gap: 18px; align-items: start; }
      .receipt strong { display: block; margin: 5px 0 8px; font-size: 1.35rem; line-height: 1.12; overflow-wrap: anywhere; }
      dl { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px 12px; margin: 0; }
      dt { color: var(--blue); }
      dd { overflow-wrap: anywhere; }
      .receipt-verify { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding-top: 10px; border-top: 1px solid rgba(23, 33, 38, .14); }
      .receipt-verify button { border: 0; border-radius: 999px; padding: 9px 13px; color: #fffdf8; background: #14322e; font: inherit; font-size: .9rem; font-weight: 950; cursor: pointer; }
      .receipt-verify button:disabled { cursor: wait; opacity: .72; }
      .receipt-verify output { min-width: 220px; color: var(--muted); font-size: .88rem; font-weight: 850; overflow-wrap: anywhere; }
      .receipt-verify output[data-status="checking"] { color: var(--blue); }
      .receipt-verify output[data-status="verified"] { color: var(--green); }
      .receipt-verify output[data-status="mismatch"], .receipt-verify output[data-status="error"] { color: var(--rose); }
      footer { padding: 0 0 30px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 900px) {
        header, .decision, .receipt, .reviewer { grid-template-columns: 1fr; }
        .score { min-height: 140px; }
        .lanes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .review-questions { grid-template-columns: 1fr; }
        .status-pill { justify-self: stretch; }
      }
      @media (max-width: 640px) {
        header, main, footer { width: min(100% - 20px, 1180px); }
        header { padding-top: 24px; }
        h1 { font-size: 2.15rem; }
        .lanes { grid-template-columns: 1fr; }
        nav a, .lane a, .receipt a { width: 100%; text-align: center; }
        dl { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <div>
        <span class="eyebrow">Buyer evidence board</span>
        <h1>${escapeHtml(board.headline)}</h1>
        <p>${escapeHtml(board.summary)}</p>
        <nav aria-label="Buyer evidence board links">${nav}</nav>
      </div>
      <aside class="score ${tone(board.status)}" aria-label="Buyer evidence score">
        <span>${escapeHtml(board.status)}</span>
        <strong>${escapeHtml(board.score)}</strong>
        <small>${escapeHtml(`${board.readyCount}/${board.itemCount} lanes ready`)}</small>
      </aside>
    </header>
    <main>
      <section class="decision ${tone(board.status)}" aria-label="Decision rule">
        <div>
          <h2>Decision rule</h2>
          <strong>${escapeHtml(board.decisionRule)}</strong>
          <p>${escapeHtml(`${blocker.owner}: ${blocker.nextAction}`)}</p>
        </div>
        <div class="status-pill">
          <span class="eyebrow">${escapeHtml(blocker.label)}</span>
          <b>${escapeHtml(board.buyer)}</b>
        </div>
      </section>
      <section class="lanes" aria-label="Evidence lanes">${items}</section>
      <section class="reviewer" aria-label="Reviewer decision brief">
        <div class="reviewer-intro">
          <span class="eyebrow">Reviewer decision brief</span>
          <strong>${escapeHtml(board.reviewerBrief.title)}</strong>
          <p>${escapeHtml(board.reviewerBrief.meetingGoal)}</p>
          <small>${escapeHtml(`No-send rule: ${board.reviewerBrief.noSendRule}`)}</small>
        </div>
        <div class="review-questions">${reviewerQuestions}</div>
      </section>
      <section class="receipt ${tone(board.status)}" aria-label="Replayable receipt">
        <div>
          <span class="eyebrow">Replayable receipt</span>
          <strong>${escapeHtml(board.receipt.receiptId)}</strong>
          <p>${escapeHtml(`This receipt seals the ${board.status} decision, ${board.score}/100 score, first blocker, and every evidence lane.`)}</p>
          <nav aria-label="Receipt actions"><a href="${escapeHtml(receiptHref)}" download="${escapeHtml(board.receipt.receiptId)}.json">Download receipt JSON</a></nav>
        </div>
        <dl>
          <dt>Checksum</dt>
          <dd>${escapeHtml(`${board.receipt.checksumAlgorithm}:${board.receipt.checksum}`)}</dd>
          <dt>Issued</dt>
          <dd>${escapeHtml(board.receipt.payload.issuedAt)}</dd>
          <dt>First blocker</dt>
          <dd>${escapeHtml(board.receipt.payload.firstBlocker)}</dd>
          <dt>Buyer</dt>
          <dd>${escapeHtml(board.receipt.payload.buyer)}</dd>
          <dt>API</dt>
          <dd><code>POST ${escapeHtml(board.receipt.verificationApiPath)}</code></dd>
          <dt>Request</dt>
          <dd><a href="${escapeHtml(board.receipt.verificationRequestHref)}" download="buyer-evidence-board-verify-request.json">Download verify request</a></dd>
        </dl>
        <div class="receipt-verify">
          <button type="button" data-board-receipt-verify>Verify receipt</button>
          <output data-board-receipt-status aria-live="polite">Receipt not checked in this browser yet.</output>
        </div>
      </section>
    </main>
    <script type="application/json" id="buyer-evidence-board-receipt-verify-request">${receiptVerificationRequestJson}</script>
    <script>
      (() => {
        const button = document.querySelector("[data-board-receipt-verify]");
        const status = document.querySelector("[data-board-receipt-status]");
        const requestNode = document.getElementById("buyer-evidence-board-receipt-verify-request");
        if (!button || !status || !requestNode) return;
        button.addEventListener("click", async () => {
          button.disabled = true;
          status.dataset.status = "checking";
          status.textContent = "Checking buyer evidence board receipt...";
          try {
            const response = await fetch(${receiptVerificationApiPathJson}, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: requestNode.textContent || ""
            });
            const result = await response.json().catch(() => ({}));
            const verification = result.verification || {};
            if (response.ok && verification.status === "verified") {
              status.dataset.status = "verified";
              status.textContent = "Verified in this browser. Checksum " + (verification.actualChecksum || "") + " matches the buyer evidence payload.";
              return;
            }
            status.dataset.status = "mismatch";
            status.textContent = verification.instruction || result.error || "Buyer evidence board receipt verification failed.";
          } catch {
            status.dataset.status = "error";
            status.textContent = "Could not verify the buyer evidence board receipt. Check the API route and try again.";
          } finally {
            button.disabled = false;
          }
        });
      })();
    </script>
    <footer>
      <p>Generated from the same buyer evidence board domain object used by the interactive workspace.</p>
    </footer>
  </body>
</html>`;
}
