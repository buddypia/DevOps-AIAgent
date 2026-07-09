import type { BuyerDecisionFollowUpLedger } from "./buyerDecisionFollowUp.js";
import type { BuyerDecisionReceipt } from "./buyerDecisionReceipt.js";
import type { BuyerProofVerifierReport } from "./buyerProofVerifier.js";
import type { BuyerTrustManifest } from "./buyerTrustManifest.js";

export type BuyerReviewKitStatus = "ready" | "repair" | "hold";
export type BuyerReviewKitStepStatus = "ready" | "watch" | "blocked";
export type BuyerReviewKitStepId =
  | "verify-manifest"
  | "inspect-proof"
  | "verify-validation-answers"
  | "record-decision"
  | "assign-follow-up"
  | "verify-reply-record";

export const BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM = "replyRecordRequest";
export const BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM = "validationAnswerRecordRequest";

export type BuyerReviewKitStep = {
  id: BuyerReviewKitStepId;
  label: string;
  status: BuyerReviewKitStepStatus;
  evidence: string;
  action: string;
  href: string;
};

export type BuyerReviewKitDecisionGate = Pick<
  BuyerDecisionReceipt["decisionGate"],
  | "recommendedChoice"
  | "selectedChoice"
  | "decisionAlignment"
  | "openConditionCount"
  | "blockedConditionCount"
  | "watchConditionCount"
  | "blockingSummary"
  | "overrideWarning"
  | "continueCriteria"
>;

export type BuyerReviewKitLinks = {
  trustManifestUrl?: string;
  proofVerifierUrl?: string;
  decisionReceiptUrl?: string;
  validationAnswerRecordVerifierUrl?: string;
  replyRecordVerifierUrl?: string;
  followUpUrl?: string;
  acceptancePathUrl?: string;
  jsonUrl?: string;
  markdownUrl?: string;
  appUrl?: string;
};

export type BuyerReviewKit = {
  id: string;
  status: BuyerReviewKitStatus;
  headline: string;
  summary: string;
  primaryAction: BuyerReviewKitStep;
  reviewMinutes: number;
  manifestDigest: string;
  decisionReceiptId: string;
  decisionChoice: BuyerDecisionReceipt["choice"];
  decisionReadiness: BuyerDecisionReceipt["readiness"];
  decisionGate: BuyerReviewKitDecisionGate;
  readyCount: number;
  watchCount: number;
  blockedCount: number;
  steps: BuyerReviewKitStep[];
  copyText: string;
  exportMarkdown: string;
};

export type BuyerReviewKitReplyRecord = {
  status: "verified" | "mismatch" | "invalid_request" | "unsupported";
  verified: boolean;
  receiptType: string;
  receiptLabel: string;
  decision: string;
  checksum: string;
  buyer?: string;
  confidence?: number;
  sourceVerifierApiPath?: string;
  verifierUrl: string;
  nextAction: string;
};

export type BuyerReviewKitValidationAnswerRecord = {
  status: "verified" | "mismatch" | "invalid_request" | "unsupported";
  verified: boolean;
  receiptType: string;
  receiptLabel: string;
  answerStatus: string;
  checksum: string;
  buyer?: string;
  confidence?: number;
  answeredCount?: number;
  totalCount?: number;
  sourceReceiptId?: string;
  sourceVerifierApiPath?: string;
  verifierUrl: string;
  nextAction: string;
};

type BuyerReviewKitSource = {
  manifest: Pick<BuyerTrustManifest, "id" | "readiness" | "score" | "headline" | "publicationGate" | "publicationWindow" | "verification">;
  proofVerifier: Pick<BuyerProofVerifierReport, "status" | "decision" | "score" | "headline" | "operatorLine" | "actualDigest" | "nextActions">;
  decisionReceipt: Pick<BuyerDecisionReceipt, "receiptId" | "choice" | "readiness" | "headline" | "nextAction" | "checksum" | "verification" | "decisionGate">;
  followUpLedger: Pick<BuyerDecisionFollowUpLedger, "status" | "headline" | "summary" | "firstAction" | "readyCount" | "taskTotal" | "blockedCount" | "attentionCount">;
  validationAnswerRecord?: BuyerReviewKitValidationAnswerRecord;
  replyRecord?: BuyerReviewKitReplyRecord;
  links?: BuyerReviewKitLinks;
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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stepStatusFrom(value: string): BuyerReviewKitStepStatus {
  if (["external-ready", "publish", "verified", "share", "accepted", "continue", "ready", "buyer-send"].includes(value)) return "ready";
  if (["needs-proof", "repair", "attention", "conditional", "revise", "watch", "sponsor-review", "recheck-required"].includes(value)) return "watch";
  return "blocked";
}

function kitStatusFrom(steps: BuyerReviewKitStep[]): BuyerReviewKitStatus {
  if (steps.some((step) => step.status === "blocked")) return "hold";
  if (steps.some((step) => step.status === "watch")) return "repair";
  return "ready";
}

function headlineFor(status: BuyerReviewKitStatus) {
  if (status === "ready") return "Buyer review kit is ready for external approval";
  if (status === "repair") return "Buyer review kit needs conditional repair";
  return "Buyer review kit should stay internal";
}

function summaryFor(input: BuyerReviewKitSource, status: BuyerReviewKitStatus, steps: BuyerReviewKitStep[]) {
  const openCount = steps.filter((step) => step.status !== "ready").length;
  const gate = input.decisionReceipt.decisionGate;
  const optionalChecks = [
    input.validationAnswerRecord ? "verify the buyer validation answers" : "",
    input.replyRecord ? "verify the buyer reply receipt" : ""
  ].filter(Boolean);
  if (gate.decisionAlignment === "overridden") {
    return `Decision receipt selected ${gate.selectedChoice}, but evidence recommends ${gate.recommendedChoice}. ${gate.overrideWarning}`;
  }
  if (status === "ready") {
    const checks = ["verify digest", "inspect proof", ...optionalChecks, "record the decision", "assign follow-up"];
    return `Reviewer can ${checks.join(", ")} from one review kit. Digest ${input.manifest.verification.digest}.`;
  }
  if (status === "repair") return `${openCount} review item(s) need repair before this kit should be treated as buyer-approved.`;
  return `Stop external sharing until ${steps.find((step) => step.status === "blocked")?.label.toLowerCase() ?? "the blocked review item"} is repaired.`;
}

function decisionStepStatus(receipt: BuyerReviewKitSource["decisionReceipt"]): BuyerReviewKitStepStatus {
  if (receipt.decisionGate.decisionAlignment === "overridden" && receipt.decisionGate.recommendedChoice === "stop") return "blocked";
  if (receipt.decisionGate.decisionAlignment === "overridden") return "watch";
  return stepStatusFrom(receipt.readiness);
}

function decisionEvidence(receipt: BuyerReviewKitSource["decisionReceipt"]) {
  const gate = receipt.decisionGate;
  return `${receipt.choice}/${receipt.readiness}; recommended ${gate.recommendedChoice}; alignment ${gate.decisionAlignment}; ${gate.openConditionCount} open condition(s); checksum ${receipt.checksum}.`;
}

function decisionAction(receipt: BuyerReviewKitSource["decisionReceipt"]) {
  if (receipt.decisionGate.decisionAlignment === "overridden") return `${receipt.decisionGate.overrideWarning} Open the decision receipt before accepting the review kit.`;
  return receipt.nextAction;
}

function replyRecordStepStatus(status: BuyerReviewKitReplyRecord["status"]): BuyerReviewKitStepStatus {
  if (status === "verified") return "ready";
  if (status === "mismatch" || status === "invalid_request" || status === "unsupported") return "blocked";
  return "watch";
}

function validationAnswerRecordStepStatus(record: BuyerReviewKitValidationAnswerRecord): BuyerReviewKitStepStatus {
  if (!record.verified) return "blocked";
  if (record.answerStatus === "ready") return "ready";
  if (record.answerStatus === "watch") return "watch";
  return "blocked";
}

function replyRecordEvidence(replyRecord: BuyerReviewKitReplyRecord) {
  const checksum = replyRecord.checksum ? `; checksum ${replyRecord.checksum}` : "";
  const buyer = replyRecord.buyer ? `${replyRecord.buyer}; ` : "";
  const confidence = typeof replyRecord.confidence === "number" ? ` at ${replyRecord.confidence}/100` : "";
  return `${buyer}${replyRecord.decision || "unknown decision"}${confidence}; ${replyRecord.receiptLabel}/${replyRecord.status}${checksum}.`;
}

function validationAnswerRecordEvidence(record: BuyerReviewKitValidationAnswerRecord) {
  const checksum = record.checksum ? `; checksum ${record.checksum}` : "";
  const buyer = record.buyer ? `${record.buyer}; ` : "";
  const confidence = typeof record.confidence === "number" ? ` at ${record.confidence}/100` : "";
  const answers = typeof record.answeredCount === "number" && typeof record.totalCount === "number" ? `${record.answeredCount}/${record.totalCount} answers` : "answer count unknown";
  return `${buyer}${answers}${confidence}; ${record.receiptLabel}/${record.status}; answer status ${record.answerStatus}${checksum}.`;
}

function buildSteps(input: BuyerReviewKitSource): BuyerReviewKitStep[] {
  const links = input.links ?? {};
  const steps: BuyerReviewKitStep[] = [
    {
      id: "verify-manifest",
      label: "Verify manifest",
      status:
        input.manifest.verification.replayVerification.status === "verified"
          ? stepStatusFrom(input.manifest.publicationGate.decision)
          : "blocked",
      evidence: `${input.manifest.readiness} at ${input.manifest.score}/100; digest ${input.manifest.verification.digest}.`,
      action:
        input.manifest.publicationGate.decision === "publish"
          ? "Replay the manifest digest before relying on the packet."
          : input.manifest.publicationGate.firstAction,
      href: links.trustManifestUrl ?? "#buyer-trust-manifest"
    },
    {
      id: "inspect-proof",
      label: "Inspect proof report",
      status: stepStatusFrom(input.proofVerifier.status),
      evidence: `${input.proofVerifier.status} at ${input.proofVerifier.score}/100; ${input.proofVerifier.operatorLine}`,
      action: input.proofVerifier.nextActions[0] ?? "Open the proof verifier and repair any failed checks.",
      href: links.proofVerifierUrl ?? "#buyer-proof-verifier"
    }
  ];

  if (input.validationAnswerRecord) {
    steps.push({
      id: "verify-validation-answers",
      label: "Verify buyer validation",
      status: validationAnswerRecordStepStatus(input.validationAnswerRecord),
      evidence: validationAnswerRecordEvidence(input.validationAnswerRecord),
      action: input.validationAnswerRecord.verified
        ? input.validationAnswerRecord.nextAction
        : "Do not treat buyer validation as approval evidence until the answer receipt verifies.",
      href: links.validationAnswerRecordVerifierUrl ?? input.validationAnswerRecord.verifierUrl
    });
  }

  steps.push(
    {
      id: "record-decision",
      label: "Record decision",
      status: decisionStepStatus(input.decisionReceipt),
      evidence: decisionEvidence(input.decisionReceipt),
      action: decisionAction(input.decisionReceipt),
      href: links.decisionReceiptUrl ?? "#buyer-decision-receipt"
    },
    {
      id: "assign-follow-up",
      label: "Assign follow-up",
      status: stepStatusFrom(input.followUpLedger.status),
      evidence: `${input.followUpLedger.readyCount}/${input.followUpLedger.taskTotal} tasks ready; ${input.followUpLedger.blockedCount} blocked and ${input.followUpLedger.attentionCount} attention.`,
      action: input.followUpLedger.status === "ready" ? "Attach the follow-up ledger to the buyer decision." : input.followUpLedger.firstAction.label,
      href: links.followUpUrl ?? input.followUpLedger.firstAction.href
    }
  );

  if (input.replyRecord) {
    steps.push({
      id: "verify-reply-record",
      label: "Verify buyer reply",
      status: replyRecordStepStatus(input.replyRecord.status),
      evidence: replyRecordEvidence(input.replyRecord),
      action: input.replyRecord.verified ? input.replyRecord.nextAction : "Do not treat this buyer reply as accepted until the reply receipt verifies.",
      href: links.replyRecordVerifierUrl ?? input.replyRecord.verifierUrl
    });
  }

  return steps;
}

function buildMarkdown(kit: Omit<BuyerReviewKit, "copyText" | "exportMarkdown">) {
  return [
    `# ${kit.headline}`,
    "",
    `Kit: ${kit.id}`,
    `Status: ${kit.status}`,
    `Manifest digest: ${kit.manifestDigest}`,
    `Decision receipt: ${kit.decisionReceiptId}`,
    `Decision: ${kit.decisionChoice}/${kit.decisionReadiness}`,
    `Evidence recommendation: ${kit.decisionGate.recommendedChoice}`,
    `Decision alignment: ${kit.decisionGate.decisionAlignment}`,
    `Open decision conditions: ${kit.decisionGate.openConditionCount} (${kit.decisionGate.blockedConditionCount} blocked, ${kit.decisionGate.watchConditionCount} watch)`,
    "",
    kit.summary,
    "",
    "## Continue criteria",
    ...kit.decisionGate.continueCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Review protocol",
    ...kit.steps.map((step) => `- [${step.status}] ${step.label}: ${step.evidence} Action: ${step.action} Link: ${step.href}`),
    "",
    "## Primary action",
    `${kit.primaryAction.label}: ${kit.primaryAction.action} (${kit.primaryAction.href})`
  ].join("\n");
}

export function buildBuyerReviewKit(input: BuyerReviewKitSource): BuyerReviewKit {
  const steps = buildSteps(input);
  const status = kitStatusFrom(steps);
  const primaryAction =
    steps.find((step) => step.status === "blocked") ??
    steps.find((step) => step.status === "watch") ??
    steps.find((step) => step.id === "verify-reply-record") ??
    steps[2] ??
    steps[0];
  const partial: Omit<BuyerReviewKit, "copyText" | "exportMarkdown"> = {
    id: `buyer-review-kit-${status}-${stableDigest({
      manifestDigest: input.manifest.verification.digest,
      receiptId: input.decisionReceipt.receiptId,
      validationAnswerRecord: input.validationAnswerRecord
        ? [input.validationAnswerRecord.receiptType, input.validationAnswerRecord.status, input.validationAnswerRecord.answerStatus, input.validationAnswerRecord.checksum]
        : null,
      replyRecord: input.replyRecord ? [input.replyRecord.receiptType, input.replyRecord.status, input.replyRecord.checksum] : null,
      steps: steps.map((step) => [step.id, step.status])
    }).slice(0, 10)}`,
    status,
    headline: headlineFor(status),
    summary: summaryFor(input, status, steps),
    primaryAction,
    reviewMinutes: status === "ready" ? 12 + (input.validationAnswerRecord ? 3 : 0) + (input.replyRecord ? 2 : 0) : 15 + (input.validationAnswerRecord ? 3 : 0),
    manifestDigest: input.manifest.verification.digest,
    decisionReceiptId: input.decisionReceipt.receiptId,
    decisionChoice: input.decisionReceipt.choice,
    decisionReadiness: input.decisionReceipt.readiness,
    decisionGate: input.decisionReceipt.decisionGate,
    readyCount: steps.filter((step) => step.status === "ready").length,
    watchCount: steps.filter((step) => step.status === "watch").length,
    blockedCount: steps.filter((step) => step.status === "blocked").length,
    steps
  };
  const exportMarkdown = buildMarkdown(partial);
  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

function tone(status: BuyerReviewKitStatus | BuyerReviewKitStepStatus) {
  if (status === "ready") return "good";
  if (status === "blocked" || status === "hold") return "bad";
  return "watch";
}

export function renderBuyerReviewKitHtml(kit: BuyerReviewKit, links: BuyerReviewKitLinks = {}) {
  const nav = [
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON kit</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : "",
    links.trustManifestUrl ? `<a href="${escapeHtml(links.trustManifestUrl)}">Trust manifest</a>` : "",
    links.proofVerifierUrl ? `<a href="${escapeHtml(links.proofVerifierUrl)}">Proof verifier</a>` : "",
    links.decisionReceiptUrl ? `<a href="${escapeHtml(links.decisionReceiptUrl)}">Decision receipt</a>` : "",
    links.validationAnswerRecordVerifierUrl ? `<a href="${escapeHtml(links.validationAnswerRecordVerifierUrl)}">Validation answers</a>` : "",
    links.replyRecordVerifierUrl ? `<a href="${escapeHtml(links.replyRecordVerifierUrl)}">Reply receipt</a>` : "",
    links.followUpUrl ? `<a href="${escapeHtml(links.followUpUrl)}">Follow-up ledger</a>` : "",
    links.acceptancePathUrl ? `<a href="${escapeHtml(links.acceptancePathUrl)}">Acceptance path</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const steps = kit.steps
    .map(
      (step, index) => `
        <article class="step ${tone(step.status)}">
          <div><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(step.status)}</strong></div>
          <h2>${escapeHtml(step.label)}</h2>
          <p>${escapeHtml(step.evidence)}</p>
          <small>${escapeHtml(step.action)}</small>
          <a href="${escapeHtml(step.href)}">Open step</a>
        </article>`
    )
    .join("");
  const continueCriteria = kit.decisionGate.continueCriteria.map((criterion) => `<li>${escapeHtml(criterion)}</li>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(kit.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #5a6864; --paper: #eef2ed; --panel: #fffdf7; --line: #c9d6cf; --teal: #0f766e; --blue: #2457a6; --ruby: #a82135; --gold: #b98112; }
      * { box-sizing: border-box; }
      body { min-width: 320px; margin: 0; color: var(--ink); background: var(--paper); font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", ui-sans-serif, system-ui, sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 28px)); margin: 0 auto; }
      header { padding: 30px 0 14px; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(250px, 340px); gap: 14px; align-items: stretch; }
      .hero-copy, .review-stamp, .summary, .decision-gate, .step { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 16px 34px rgba(23,33,38,.07); }
      .hero-copy, .summary, .decision-gate, .step { padding: 18px; }
      .eyebrow, .review-stamp span, .step span { color: var(--teal); font-size: .72rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 880px; margin: 8px 0 10px; font-size: clamp(2.1rem, 5vw, 4.6rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0; line-height: 1.08; letter-spacing: 0; }
      p, small { color: var(--muted); }
      nav, .summary-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      nav a, .summary-actions a, .step a { min-height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; color: var(--ink); background: #fff; font-size: .86rem; font-weight: 900; text-decoration: none; }
      .review-stamp { min-width: 0; display: grid; gap: 8px; padding: 20px; color: #fffdf7; background: linear-gradient(150deg, #14201d, #0f766e 56%, #2457a6); align-content: end; }
      .review-stamp span { color: #b8efd4; }
      .review-stamp strong { font-size: clamp(2.4rem, 8vw, 4.8rem); line-height: .9; }
      .review-stamp small { color: rgba(255,253,247,.76); font-weight: 850; overflow-wrap: anywhere; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .summary { display: grid; grid-template-columns: minmax(0, 1fr) minmax(250px, .4fr); gap: 12px; border-left: 6px solid var(--gold); }
      .summary.good { border-left-color: var(--teal); background: #edf8f1; }
      .summary.bad { border-left-color: var(--ruby); background: #fff1f2; }
      .summary h2 { font-size: clamp(1.5rem, 3vw, 2.2rem); }
      .decision-gate { display: grid; grid-template-columns: minmax(0, .8fr) minmax(250px, 1fr); gap: 12px; border-left: 6px solid var(--gold); }
      .decision-gate.good { border-left-color: var(--teal); background: #edf8f1; }
      .decision-gate.bad { border-left-color: var(--ruby); background: #fff1f2; }
      .decision-gate h2 { font-size: clamp(1.25rem, 2.4vw, 1.8rem); }
      .decision-gate p { margin: 8px 0 0; }
      .decision-gate ul { margin: 0; padding-left: 18px; color: var(--muted); }
      .decision-gate li + li { margin-top: 6px; }
      .metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .metrics span { min-width: 0; display: grid; gap: 2px; padding: 9px; border: 1px solid var(--line); border-radius: 8px; color: var(--muted); background: rgba(255,253,247,.75); font-size: .8rem; font-weight: 850; overflow-wrap: anywhere; }
      .metrics b { color: var(--ink); font-size: 1.14rem; }
      .protocol { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 8px; }
      .step { min-width: 0; display: grid; gap: 8px; border-top: 5px solid var(--gold); }
      .step.good { border-top-color: var(--teal); background: #edf8f1; }
      .step.bad { border-top-color: var(--ruby); background: #fff1f2; }
      .step div { display: flex; justify-content: space-between; gap: 8px; }
      .step h2 { font-size: 1.02rem; overflow-wrap: anywhere; }
      .step p, .step small { margin: 0; overflow-wrap: anywhere; }
      .step a { width: fit-content; padding: 7px 10px; font-size: .82rem; }
      footer { padding-bottom: 26px; color: var(--muted); font-size: .82rem; }
      @media (max-width: 980px) { .hero, .summary, .decision-gate, .protocol { grid-template-columns: 1fr; } .review-stamp { min-height: 160px; } }
      @media (max-width: 560px) { header, main, footer { width: min(100% - 22px, 520px); } .hero-copy, .review-stamp, .summary, .decision-gate, .step { padding: 12px; } nav a, .summary-actions a, .step a { width: 100%; } .metrics { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div class="hero-copy">
          <span class="eyebrow">Buyer Review Kit</span>
          <h1>${escapeHtml(kit.headline)}</h1>
          <p>${escapeHtml(kit.summary)}</p>
          <nav>${nav}</nav>
        </div>
        <aside class="review-stamp">
          <span>${escapeHtml(kit.status)} / ${escapeHtml(`${kit.reviewMinutes} min review`)}</span>
          <strong>${escapeHtml(`${kit.readyCount}/${kit.steps.length}`)}</strong>
          <small>${escapeHtml(kit.manifestDigest)} / ${escapeHtml(kit.decisionReceiptId)}</small>
        </aside>
      </div>
    </header>
    <main>
      <section class="summary ${tone(kit.status)}" aria-label="Review kit summary">
        <div>
          <span class="eyebrow">Primary action</span>
          <h2>${escapeHtml(kit.primaryAction.action)}</h2>
          <p>${escapeHtml(kit.primaryAction.evidence)}</p>
          <div class="summary-actions"><a href="${escapeHtml(kit.primaryAction.href)}">Open primary action</a></div>
        </div>
        <div class="metrics" aria-label="Review metrics">
          <span><b>${escapeHtml(kit.readyCount)}</b> ready</span>
          <span><b>${escapeHtml(kit.watchCount)}</b> watch</span>
          <span><b>${escapeHtml(kit.blockedCount)}</b> blocked</span>
        </div>
      </section>
      <section class="decision-gate ${kit.decisionGate.decisionAlignment === "aligned" ? tone(kit.status) : "bad"}" aria-label="Review kit decision gate">
        <div>
          <span class="eyebrow">Decision gate</span>
          <h2>Recommended ${escapeHtml(kit.decisionGate.recommendedChoice)}, selected ${escapeHtml(kit.decisionGate.selectedChoice)}</h2>
          <p>${escapeHtml(kit.decisionGate.blockingSummary)}</p>
          <p>${escapeHtml(kit.decisionGate.overrideWarning)}</p>
        </div>
        <div>
          <span class="eyebrow">Conditions to continue</span>
          <ul>${continueCriteria}</ul>
        </div>
      </section>
      <section class="protocol" aria-label="Review protocol">${steps}</section>
    </main>
    <footer>Kit id ${escapeHtml(kit.id)}. Decision ${escapeHtml(`${kit.decisionChoice}/${kit.decisionReadiness}`)}.</footer>
  </body>
</html>`;
}
