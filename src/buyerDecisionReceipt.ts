import type { BuyerDecisionFollowUpLedger } from "./buyerDecisionFollowUp.js";
import type { BuyerProofVerifierReport } from "./buyerProofVerifier.js";
import type { BuyerProcurementDecision, BuyerProcurementDecisionContract } from "./buyerProcurementDecision.js";

export const BUYER_DECISION_RECEIPT_VERIFY_PATH = "/api/buyer-decision-receipt/verify";

export type BuyerDecisionReceiptChoice = "continue" | "revise" | "stop";
export type BuyerDecisionReceiptReadiness = "accepted" | "conditional" | "declined";
export type BuyerDecisionReceiptConditionStatus = "clear" | "watch" | "blocked";
export type BuyerDecisionReceiptDecisionAlignment = "aligned" | "overridden";

export type BuyerDecisionReceiptInput = {
  choice?: BuyerDecisionReceiptChoice;
  reviewerName?: string;
  buyerNote?: string;
  conditionNote?: string;
  decidedAt?: string;
};

export type BuyerDecisionReceiptCondition = {
  id: "proof-verifier" | "procurement-decision" | "decision-contract" | "follow-up-ledger";
  label: string;
  status: BuyerDecisionReceiptConditionStatus;
  evidence: string;
  action: string;
  href: string;
};

export type BuyerDecisionReceiptDecisionGate = {
  recommendedChoice: BuyerDecisionReceiptChoice;
  selectedChoice: BuyerDecisionReceiptChoice;
  decisionAlignment: BuyerDecisionReceiptDecisionAlignment;
  openConditionCount: number;
  blockedConditionCount: number;
  watchConditionCount: number;
  blockingSummary: string;
  overrideWarning: string;
  continueCriteria: string[];
};

export type BuyerDecisionReceiptPayload = {
  receiptVersion: "buyer-decision-receipt.v1";
  receiptId: string;
  choice: BuyerDecisionReceiptChoice;
  readiness: BuyerDecisionReceiptReadiness;
  reviewerName: string;
  decidedAt: string;
  targetBuyer: string;
  manifestDigest: string;
  proofVerifierStatus: BuyerProofVerifierReport["status"];
  procurementReadiness: BuyerProcurementDecision["readiness"];
  approvalAsk: string;
  firstCommitmentYen: number;
  expectedMonthlyValueYen: number;
  paybackDays: number;
  buyerNote: string;
  conditionNote: string;
  decisionGate: BuyerDecisionReceiptDecisionGate;
  conditions: Array<Pick<BuyerDecisionReceiptCondition, "id" | "status" | "evidence" | "action" | "href">>;
};

export type BuyerDecisionReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type BuyerDecisionReceipt = {
  receiptId: string;
  choice: BuyerDecisionReceiptChoice;
  readiness: BuyerDecisionReceiptReadiness;
  headline: string;
  summary: string;
  nextAction: string;
  reviewerName: string;
  decidedAt: string;
  targetBuyer: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof BUYER_DECISION_RECEIPT_VERIFY_PATH;
  payload: BuyerDecisionReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: BuyerDecisionReceiptVerification;
  decisionGate: BuyerDecisionReceiptDecisionGate;
  conditions: BuyerDecisionReceiptCondition[];
  copyText: string;
  exportMarkdown: string;
};

export type BuyerDecisionReceiptLinks = {
  procurementDecisionUrl?: string;
  proofVerifierUrl?: string;
  trustManifestUrl?: string;
  followUpUrl?: string;
  jsonUrl?: string;
  markdownUrl?: string;
  appUrl?: string;
};

type BuyerDecisionReceiptSource = {
  procurementDecision: Pick<BuyerProcurementDecision, "id" | "readiness" | "score" | "headline" | "targetBuyer" | "firstCommitmentYen" | "monthlyValueYen" | "paybackDays"> & {
    decisionContract: Pick<BuyerProcurementDecision["decisionContract"], "readiness" | "approvalAsk" | "clearClauseCount" | "clauseCount">;
  };
  proofVerifier: Pick<BuyerProofVerifierReport, "status" | "score" | "actualDigest" | "headline" | "nextActions">;
  trustManifest: {
    id: string;
    verification: {
      digest: string;
    };
  };
  followUpLedger: Pick<BuyerDecisionFollowUpLedger, "status" | "headline" | "firstAction" | "readyCount" | "taskTotal" | "blockedCount" | "attentionCount">;
  input?: BuyerDecisionReceiptInput;
  links?: BuyerDecisionReceiptLinks;
};

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

function escapeHtml(value: unknown) {
  return String(value ?? "")
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

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function cleanText(value: string | undefined, fallback: string, max = 700) {
  const trimmed = (value ?? "").trim();
  return (trimmed || fallback).slice(0, max);
}

function conditionStatusFrom(value: string): BuyerDecisionReceiptConditionStatus {
  if (["verified", "share", "buy-now", "ready-to-sign", "ready", "buyer-send", "publish", "external-ready"].includes(value)) return "clear";
  if (["attention", "repair", "pilot-first", "needs-redlines", "needs-proof", "sponsor-review", "recheck-required"].includes(value)) return "watch";
  return "blocked";
}

function recommendedChoice(conditions: BuyerDecisionReceiptCondition[]): BuyerDecisionReceiptChoice {
  if (conditions.some((condition) => condition.status === "blocked")) return "stop";
  if (conditions.some((condition) => condition.status === "watch")) return "revise";
  return "continue";
}

function readinessFor(choice: BuyerDecisionReceiptChoice, conditions: BuyerDecisionReceiptCondition[]): BuyerDecisionReceiptReadiness {
  if (choice === "stop") return "declined";
  if (choice === "continue" && conditions.every((condition) => condition.status === "clear")) return "accepted";
  return "conditional";
}

function headlineFor(readiness: BuyerDecisionReceiptReadiness) {
  if (readiness === "accepted") return "Buyer decision receipt accepts the proof pilot";
  if (readiness === "conditional") return "Buyer decision receipt records conditional revision";
  return "Buyer decision receipt stops external send";
}

function nextActionFor(readiness: BuyerDecisionReceiptReadiness, conditions: BuyerDecisionReceiptCondition[]) {
  if (readiness === "accepted") return "Counter-sign the pilot offer, attach this receipt, and keep the proof verifier report with the buyer room.";
  if (readiness === "declined") return "Stop the buyer send, keep this receipt with the manifest, and re-scope the blocked proof or buying condition.";
  const firstOpen = conditions.find((condition) => condition.status === "blocked") ?? conditions.find((condition) => condition.status === "watch");
  return firstOpen?.action ?? "Close the conditional items, regenerate proof, and issue a fresh buyer decision receipt.";
}

function continueCriteriaFor(conditions: BuyerDecisionReceiptCondition[]) {
  const openConditions = conditions.filter((condition) => condition.status !== "clear");
  if (!openConditions.length) {
    return [
      "Keep every attached proof link public through the buyer review window.",
      "Attach this verified receipt to the signed pilot packet."
    ];
  }
  return openConditions.slice(0, 4).map((condition) => `${condition.label}: ${condition.action}`);
}

function decisionGateFor(choice: BuyerDecisionReceiptChoice, conditions: BuyerDecisionReceiptCondition[]): BuyerDecisionReceiptDecisionGate {
  const evidenceChoice = recommendedChoice(conditions);
  const blockedConditionCount = conditions.filter((condition) => condition.status === "blocked").length;
  const watchConditionCount = conditions.filter((condition) => condition.status === "watch").length;
  const openConditionCount = blockedConditionCount + watchConditionCount;
  const decisionAlignment: BuyerDecisionReceiptDecisionAlignment = choice === evidenceChoice ? "aligned" : "overridden";
  const blockingSummary = blockedConditionCount
    ? `${blockedConditionCount} blocked condition(s) prevent a clean continue decision.`
    : watchConditionCount
      ? `${watchConditionCount} watched condition(s) need revision before a clean continue decision.`
      : "No open evidence condition blocks a clean continue decision.";
  const overrideWarning =
    decisionAlignment === "aligned"
      ? "Selected decision matches the current evidence state."
      : choice === "continue"
        ? "Continue is not evidence-aligned. This receipt stays conditional until open conditions are repaired."
        : choice === "stop" && evidenceChoice === "continue"
          ? "Stop is stricter than the evidence state. Keep the buyer reason in the receipt note."
          : "Selected decision differs from the evidence-aligned recommendation. Keep the reason in the receipt note.";
  return {
    recommendedChoice: evidenceChoice,
    selectedChoice: choice,
    decisionAlignment,
    openConditionCount,
    blockedConditionCount,
    watchConditionCount,
    blockingSummary,
    overrideWarning,
    continueCriteria: continueCriteriaFor(conditions)
  };
}

function conditionCards(input: BuyerDecisionReceiptSource): BuyerDecisionReceiptCondition[] {
  const links = input.links ?? {};
  const contract = input.procurementDecision.decisionContract;
  return [
    {
      id: "proof-verifier",
      label: "Proof verifier",
      status: conditionStatusFrom(input.proofVerifier.status),
      evidence: `${input.proofVerifier.status} at ${input.proofVerifier.score}/100; manifest digest ${input.proofVerifier.actualDigest}.`,
      action: input.proofVerifier.nextActions[0] ?? "Rerun the proof verifier before buyer signature.",
      href: links.proofVerifierUrl ?? "#buyer-proof-verifier"
    },
    {
      id: "procurement-decision",
      label: "Procurement decision",
      status: conditionStatusFrom(input.procurementDecision.readiness),
      evidence: `${input.procurementDecision.readiness} at ${input.procurementDecision.score}/100; ${input.procurementDecision.headline}.`,
      action:
        input.procurementDecision.readiness === "buy-now"
          ? "Use the procurement decision as the commercial basis for signature."
          : "Resolve the procurement decision blockers before asking for signature.",
      href: links.procurementDecisionUrl ?? "#procurement-decision"
    },
    {
      id: "decision-contract",
      label: "Decision contract",
      status: conditionStatusFrom(contract.readiness),
      evidence: `${contract.clearClauseCount}/${contract.clauseCount} clauses clear. ${contract.approvalAsk}`,
      action:
        contract.readiness === "ready-to-sign"
          ? "Keep the decision contract attached to this receipt."
          : "Redline the watched or blocked contract clauses before buyer acceptance.",
      href: links.procurementDecisionUrl ?? "#procurement-decision"
    },
    {
      id: "follow-up-ledger",
      label: "Follow-up ledger",
      status: conditionStatusFrom(input.followUpLedger.status),
      evidence: `${input.followUpLedger.readyCount}/${input.followUpLedger.taskTotal} follow-up tasks ready; ${input.followUpLedger.blockedCount} blocked and ${input.followUpLedger.attentionCount} attention.`,
      action:
        input.followUpLedger.status === "ready"
          ? "Keep the owner ledger attached for meeting follow-through."
          : input.followUpLedger.firstAction.label,
      href: links.followUpUrl ?? input.followUpLedger.firstAction.href
    }
  ];
}

export function buyerDecisionReceiptChecksum(payload: BuyerDecisionReceiptPayload) {
  return stableDigest(payload);
}

export function verifyBuyerDecisionReceipt(input: { checksum: string; payload: BuyerDecisionReceiptPayload }): BuyerDecisionReceiptVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = buyerDecisionReceiptChecksum(input.payload);
  const verified = actualChecksum === expectedChecksum;
  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Buyer decision receipt checksum matches the attached decision payload."
      : "Buyer decision receipt checksum does not match the attached decision payload. Do not rely on this buyer decision until it is re-issued."
  };
}

function buildMarkdown(receipt: Omit<BuyerDecisionReceipt, "copyText" | "exportMarkdown">) {
  return [
    `# ${receipt.headline}`,
    "",
    `Receipt: ${receipt.receiptId}`,
    `Choice: ${receipt.choice}`,
    `Readiness: ${receipt.readiness}`,
    `Reviewer: ${receipt.reviewerName}`,
    `Decided: ${receipt.decidedAt}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    "",
    receipt.summary,
    "",
    "## Evidence-aligned decision",
    `Recommended choice: ${receipt.decisionGate.recommendedChoice}`,
    `Selected choice: ${receipt.decisionGate.selectedChoice}`,
    `Alignment: ${receipt.decisionGate.decisionAlignment}`,
    `Open conditions: ${receipt.decisionGate.openConditionCount} (${receipt.decisionGate.blockedConditionCount} blocked, ${receipt.decisionGate.watchConditionCount} watch)`,
    `Blocking summary: ${receipt.decisionGate.blockingSummary}`,
    `Override warning: ${receipt.decisionGate.overrideWarning}`,
    "",
    "Continue criteria:",
    ...receipt.decisionGate.continueCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Conditions",
    ...receipt.conditions.map((condition) => `- [${condition.status}] ${condition.label}: ${condition.evidence} Action: ${condition.action} Link: ${condition.href}`),
    "",
    "## Next action",
    receipt.nextAction,
    "",
    "## API verification",
    `POST ${receipt.verificationApiPath}`,
    "```json",
    receipt.verificationRequestJson,
    "```"
  ].join("\n");
}

export function buildBuyerDecisionReceipt(input: BuyerDecisionReceiptSource): BuyerDecisionReceipt {
  const conditions = conditionCards(input);
  const choice = input.input?.choice ?? recommendedChoice(conditions);
  const readiness = readinessFor(choice, conditions);
  const decisionGate = decisionGateFor(choice, conditions);
  const decidedAt = input.input?.decidedAt ?? new Date().toISOString();
  const reviewerName = cleanText(input.input?.reviewerName, "External buyer reviewer", 160);
  const nextAction = nextActionFor(readiness, conditions);
  const receiptId = `buyer-decision-${choice}-${stableDigest({
    decidedAt,
    reviewerName,
    manifestDigest: input.trustManifest.verification.digest,
    choice,
    statuses: conditions.map((condition) => [condition.id, condition.status])
  }).slice(0, 10)}`;
  const payload: BuyerDecisionReceiptPayload = {
    receiptVersion: "buyer-decision-receipt.v1",
    receiptId,
    choice,
    readiness,
    reviewerName,
    decidedAt,
    targetBuyer: input.procurementDecision.targetBuyer,
    manifestDigest: input.trustManifest.verification.digest,
    proofVerifierStatus: input.proofVerifier.status,
    procurementReadiness: input.procurementDecision.readiness,
    approvalAsk: input.procurementDecision.decisionContract.approvalAsk,
    firstCommitmentYen: input.procurementDecision.firstCommitmentYen,
    expectedMonthlyValueYen: input.procurementDecision.monthlyValueYen,
    paybackDays: input.procurementDecision.paybackDays,
    buyerNote: cleanText(input.input?.buyerNote, "Decision recorded from the public buyer proof room.", 1000),
    conditionNote: cleanText(input.input?.conditionNote, nextAction, 1000),
    decisionGate,
    conditions: conditions.map((condition) => ({
      id: condition.id,
      status: condition.status,
      evidence: condition.evidence,
      action: condition.action,
      href: condition.href
    }))
  };
  const payloadJson = canonicalJson(payload);
  const checksum = buyerDecisionReceiptChecksum(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyBuyerDecisionReceipt({ checksum, payload });
  const partial: Omit<BuyerDecisionReceipt, "copyText" | "exportMarkdown"> = {
    receiptId,
    choice,
    readiness,
    headline: headlineFor(readiness),
    summary:
      readiness === "accepted"
        ? `${reviewerName} accepted ${input.procurementDecision.decisionContract.approvalAsk} with proof verifier digest ${input.proofVerifier.actualDigest}.`
        : readiness === "conditional"
          ? `${reviewerName} recorded ${choice} with ${conditions.filter((condition) => condition.status !== "clear").length} open condition(s).`
          : `${reviewerName} stopped external send until blocked proof or procurement conditions are repaired.`,
    nextAction,
    reviewerName,
    decidedAt,
    targetBuyer: input.procurementDecision.targetBuyer,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: BUYER_DECISION_RECEIPT_VERIFY_PATH as typeof BUYER_DECISION_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification,
    decisionGate,
    conditions
  };
  const exportMarkdown = buildMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

function tone(status: BuyerDecisionReceiptConditionStatus | BuyerDecisionReceiptReadiness) {
  if (status === "clear" || status === "accepted") return "good";
  if (status === "blocked" || status === "declined") return "bad";
  return "watch";
}

const DECISION_RECEIPT_FORM_FIELDS = new Set(["decision", "reviewerName", "buyerNote", "conditionNote", "decidedAt"]);

function hiddenWorkspaceInputs(links: BuyerDecisionReceiptLinks) {
  const sourceUrl = links.jsonUrl ?? links.markdownUrl ?? "";
  if (!sourceUrl) return "";
  try {
    const url = new URL(sourceUrl, "https://local.invalid");
    return Array.from(url.searchParams.entries())
      .filter(([name]) => !DECISION_RECEIPT_FORM_FIELDS.has(name))
      .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`)
      .join("");
  } catch {
    return "";
  }
}

export function renderBuyerDecisionReceiptHtml(receipt: BuyerDecisionReceipt, links: BuyerDecisionReceiptLinks = {}) {
  const nav = [
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON receipt</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : "",
    links.proofVerifierUrl ? `<a href="${escapeHtml(links.proofVerifierUrl)}">Proof verifier</a>` : "",
    links.trustManifestUrl ? `<a href="${escapeHtml(links.trustManifestUrl)}">Trust manifest</a>` : "",
    links.procurementDecisionUrl ? `<a href="${escapeHtml(links.procurementDecisionUrl)}">Procurement decision</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const conditions = receipt.conditions
    .map(
      (condition) => `
        <article class="condition ${tone(condition.status)}">
          <div><span>${escapeHtml(condition.id)}</span><strong>${escapeHtml(condition.status)}</strong></div>
          <h2>${escapeHtml(condition.label)}</h2>
          <p>${escapeHtml(condition.evidence)}</p>
          <small>${escapeHtml(condition.action)}</small>
          <a href="${escapeHtml(condition.href)}">Open evidence</a>
        </article>`
    )
    .join("");
  const choiceOption = (choice: BuyerDecisionReceiptChoice, label: string) => `
    <label class="choice"><input type="radio" name="decision" value="${choice}" ${receipt.choice === choice ? "checked" : ""} /> <span>${label}</span></label>`;
  const verificationClass = receipt.verification.status === "verified" ? "good" : "bad";
  const workspaceHiddenInputs = hiddenWorkspaceInputs(links);
  const continueCriteria = receipt.decisionGate.continueCriteria.map((criterion) => `<li>${escapeHtml(criterion)}</li>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(receipt.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #5a6864; --paper: #eef2ed; --panel: #fffdf7; --line: #c9d6cf; --teal: #0f766e; --blue: #2457a6; --ruby: #a82135; --gold: #b98112; }
      * { box-sizing: border-box; }
      body { min-width: 320px; margin: 0; color: var(--ink); background: var(--paper); font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", ui-sans-serif, system-ui, sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 28px)); margin: 0 auto; }
      header { padding: 30px 0 14px; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 360px); gap: 14px; align-items: stretch; }
      .hero-copy, .receipt-stamp, .decision-form, .receipt-summary, .decision-gate, .condition { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 16px 34px rgba(23,33,38,.07); }
      .hero-copy { padding: 24px; }
      .eyebrow, .receipt-stamp span, .condition span { color: var(--teal); font-size: .72rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 880px; margin: 8px 0 10px; font-size: clamp(2.1rem, 5vw, 4.5rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0; line-height: 1.08; letter-spacing: 0; }
      p, small { color: var(--muted); }
      nav, .receipt-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      nav a, .receipt-actions a, button { min-height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; color: var(--ink); background: #fff; font: inherit; font-size: .86rem; font-weight: 900; text-decoration: none; cursor: pointer; }
      button.primary { color: #fffdf7; border-color: #14201d; background: #14201d; }
      button:disabled { cursor: default; opacity: .7; }
      .receipt-stamp { min-width: 0; display: grid; gap: 8px; padding: 20px; color: #fffdf7; background: linear-gradient(150deg, #14201d, #0f766e 56%, #2457a6); align-content: end; }
      .receipt-stamp span { color: #b8efd4; }
      .receipt-stamp code { display: block; padding: 10px; border-radius: 8px; overflow-wrap: anywhere; color: #fffdf7; background: rgba(255,255,255,.14); }
      .receipt-stamp small { color: rgba(255,253,247,.76); font-weight: 850; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .receipt-summary { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, .42fr); gap: 12px; padding: 14px; border-left: 6px solid var(--gold); }
      .receipt-summary.good { border-left-color: var(--teal); background: #edf8f1; }
      .receipt-summary.bad { border-left-color: var(--ruby); background: #fff1f2; }
      .summary-copy { min-width: 0; display: grid; gap: 8px; align-content: start; }
      .summary-copy h2 { font-size: clamp(1.5rem, 3vw, 2.3rem); }
      .receipt-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .receipt-metrics span { min-width: 0; display: grid; gap: 2px; padding: 9px; border: 1px solid var(--line); border-radius: 8px; color: var(--muted); background: rgba(255,253,247,.75); font-size: .8rem; font-weight: 850; overflow-wrap: anywhere; }
      .receipt-metrics b { color: var(--ink); font-size: 1.12rem; }
      .decision-form { padding: 14px; }
      .decision-gate { display: grid; grid-template-columns: minmax(0, .8fr) minmax(260px, 1fr); gap: 12px; padding: 14px; border-left: 6px solid var(--gold); }
      .decision-gate.good { border-left-color: var(--teal); background: #edf8f1; }
      .decision-gate.bad { border-left-color: var(--ruby); background: #fff1f2; }
      .decision-gate h2 { font-size: clamp(1.25rem, 2.4vw, 1.8rem); }
      .decision-gate p { margin: 8px 0 0; }
      .decision-gate ul { margin: 0; padding-left: 18px; color: var(--muted); }
      .decision-gate li + li { margin-top: 6px; }
      form { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; align-items: end; }
      label { display: grid; gap: 5px; color: var(--muted); font-size: .82rem; font-weight: 850; }
      input[type="text"], textarea { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 10px; color: var(--ink); background: #f9fbf8; font: inherit; }
      textarea { min-height: 88px; resize: vertical; grid-column: 1 / -1; }
      .choices { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .choice { min-width: 0; display: flex; align-items: center; gap: 8px; border: 1px solid var(--line); border-radius: 8px; padding: 10px; background: #fff; color: var(--ink); }
      .condition-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
      .condition { min-width: 0; display: grid; gap: 8px; padding: 14px; border-top: 5px solid var(--gold); }
      .condition.good { border-top-color: var(--teal); background: #edf8f1; }
      .condition.bad { border-top-color: var(--ruby); background: #fff1f2; }
      .condition div { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .condition h2 { font-size: 1.02rem; overflow-wrap: anywhere; }
      .condition p, .condition small { margin: 0; overflow-wrap: anywhere; }
      .condition a { width: fit-content; border: 1px solid rgba(23,33,38,.12); border-radius: 999px; padding: 7px 10px; background: #fff; font-size: .82rem; font-weight: 900; text-decoration: none; }
      .verification-status { display: block; margin-top: 8px; color: var(--muted); font-weight: 850; overflow-wrap: anywhere; }
      .verification-status.good { color: var(--teal); }
      .verification-status.bad { color: var(--ruby); }
      footer { padding-bottom: 26px; color: var(--muted); font-size: .82rem; }
      @media (max-width: 980px) { .hero, .receipt-summary, .decision-gate, form, .condition-grid { grid-template-columns: 1fr; } .receipt-stamp { min-height: 160px; } .choices { grid-template-columns: 1fr; } }
      @media (max-width: 560px) { header, main, footer { width: min(100% - 22px, 520px); } .hero-copy, .receipt-stamp, .decision-form, .receipt-summary, .decision-gate, .condition { padding: 12px; } nav a, .receipt-actions a, button, .condition a { width: 100%; } .receipt-metrics { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div class="hero-copy">
          <span class="eyebrow">Buyer Decision Receipt</span>
          <h1>${escapeHtml(receipt.headline)}</h1>
          <p>${escapeHtml(receipt.summary)}</p>
          <nav>${nav}</nav>
        </div>
        <aside class="receipt-stamp">
          <span>${escapeHtml(receipt.readiness)} / ${escapeHtml(receipt.choice)}</span>
          <code>${escapeHtml(receipt.checksum)}</code>
          <small>${escapeHtml(receipt.reviewerName)} at ${escapeHtml(receipt.decidedAt)}</small>
        </aside>
      </div>
    </header>
    <main>
      <section class="receipt-summary ${tone(receipt.readiness)}" aria-label="Decision receipt summary">
        <div class="summary-copy">
          <span class="eyebrow">Receipt summary</span>
          <h2>${escapeHtml(receipt.nextAction)}</h2>
          <p>${escapeHtml(receipt.payload.buyerNote)}</p>
          <div class="receipt-metrics">
            <span><b>${escapeHtml(receipt.payload.proofVerifierStatus)}</b> proof verifier</span>
            <span><b>${escapeHtml(receipt.payload.procurementReadiness)}</b> procurement</span>
            <span><b>${escapeHtml(yen(receipt.payload.firstCommitmentYen))}</b> first commitment</span>
          </div>
        </div>
        <div>
          <span class="eyebrow">Receipt verification</span>
          <p>${escapeHtml(receipt.verification.instruction)}</p>
          <div class="receipt-actions">
            <button class="primary" type="button" data-verify-decision-receipt>Verify receipt</button>
            <a href="${escapeHtml(receipt.payloadHref)}" download="buyer-decision-receipt-payload.json">Download payload</a>
            <a href="${escapeHtml(receipt.verificationRequestHref)}" download="buyer-decision-receipt-verify-request.json">Download verify request</a>
          </div>
          <small class="verification-status ${verificationClass}" data-decision-receipt-status>Replay ${escapeHtml(receipt.verification.status)} for this receipt.</small>
        </div>
      </section>
      <section class="decision-gate ${receipt.decisionGate.decisionAlignment === "aligned" ? tone(receipt.readiness) : "bad"}" aria-label="Evidence aligned decision">
        <div>
          <span class="eyebrow">Evidence aligned decision</span>
          <h2>Recommended ${escapeHtml(receipt.decisionGate.recommendedChoice)}, selected ${escapeHtml(receipt.decisionGate.selectedChoice)}</h2>
          <p>${escapeHtml(receipt.decisionGate.blockingSummary)}</p>
          <p>${escapeHtml(receipt.decisionGate.overrideWarning)}</p>
        </div>
        <div>
          <span class="eyebrow">Conditions to continue</span>
          <ul>${continueCriteria}</ul>
        </div>
      </section>
      <section class="decision-form" aria-label="Record buyer decision">
        <form method="get">
          ${workspaceHiddenInputs}
          <label>Reviewer name<input type="text" name="reviewerName" value="${escapeHtml(receipt.reviewerName)}" /></label>
          <label>Decision timestamp<input type="text" name="decidedAt" value="${escapeHtml(receipt.decidedAt)}" /></label>
          <div class="choices">
            ${choiceOption("continue", "Continue")}
            ${choiceOption("revise", "Revise")}
            ${choiceOption("stop", "Stop")}
          </div>
          <textarea name="buyerNote" aria-label="Buyer note">${escapeHtml(receipt.payload.buyerNote)}</textarea>
          <textarea name="conditionNote" aria-label="Condition note">${escapeHtml(receipt.payload.conditionNote)}</textarea>
          <button class="primary" type="submit">Issue receipt</button>
        </form>
      </section>
      <section class="condition-grid" aria-label="Decision conditions">${conditions}</section>
    </main>
    <footer>Receipt id ${escapeHtml(receipt.receiptId)}. Verify with POST ${escapeHtml(receipt.verificationApiPath)}.</footer>
    <script type="application/json" id="buyer-decision-receipt-verify-request">${escapeScriptJson(receipt.verificationRequestJson)}</script>
    <script>
      (() => {
        const button = document.querySelector("[data-verify-decision-receipt]");
        const status = document.querySelector("[data-decision-receipt-status]");
        const source = document.getElementById("buyer-decision-receipt-verify-request");
        if (!button || !status || !source) return;
        button.addEventListener("click", async () => {
          button.disabled = true;
          status.textContent = "Verifying decision receipt...";
          try {
            const response = await fetch("${escapeHtml(receipt.verificationApiPath)}", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: source.textContent || ""
            });
            const result = await response.json();
            if (response.ok && result && result.verification && result.verification.status === "verified") {
              status.className = "verification-status good";
              status.textContent = "Checksum " + result.verification.actualChecksum + " matches this buyer decision.";
              return;
            }
            status.className = "verification-status bad";
            status.textContent = (result && result.verification && result.verification.instruction) || result.error || "Receipt verification failed.";
            button.disabled = false;
          } catch {
            status.className = "verification-status bad";
            status.textContent = "Could not reach the receipt verification API.";
            button.disabled = false;
          }
        });
      })();
    </script>
  </body>
</html>`;
}
