import type {
  HomepageOutcomeArtifactSnapshot,
  HomepageOutcomeArtifactStatus,
  HomepageProofEntrySnapshot,
  HomepagePublishabilitySnapshot,
  HomepageReviewerHandoffKitSnapshot
} from "./App";
import type { HomepageValueLensSnapshot } from "./HomepageValueLens";

export type HomepagePublicTrustScanStatus = HomepageOutcomeArtifactStatus;

export type HomepagePublicTrustScanCheckId = "value-case" | "public-proof" | "buyer-packet" | "reviewer-decision" | "public-release";

export type HomepagePublicTrustScanCheck = {
  id: HomepagePublicTrustScanCheckId;
  label: string;
  status: HomepagePublicTrustScanStatus;
  score: number;
  owner: string;
  buyerQuestion: string;
  evidence: string;
  action: string;
  href: string;
};

export type HomepagePublicTrustBuyerAnswer = {
  id: HomepagePublicTrustScanCheckId;
  label: string;
  status: HomepagePublicTrustScanStatus;
  owner: string;
  question: string;
  answer: string;
  evidence: string;
  proofAction: string;
  decisionUse: string;
  href: string;
};

export type HomepagePublicTrustScanSnapshot = {
  status: HomepagePublicTrustScanStatus;
  headline: string;
  summary: string;
  buyer: string;
  score: number;
  trustedCount: number;
  watchCount: number;
  blockedCount: number;
  checkCount: number;
  firstQuestion: HomepagePublicTrustScanCheck;
  primaryAction: {
    label: string;
    href: string;
    external: boolean;
  };
  publishRule: string;
  visitorPromise: string;
  answerDeckHeadline: string;
  answerDeckSummary: string;
  answeredCount: number;
  answerCount: number;
  buyerAnswers: HomepagePublicTrustBuyerAnswer[];
  checks: HomepagePublicTrustScanCheck[];
  copyText: string;
  exportMarkdown: string;
  markdownHref: string;
  csvText: string;
  csvHref: string;
};

function statusScore(status: HomepagePublicTrustScanStatus) {
  if (status === "ready") return 100;
  if (status === "attention") return 66;
  return 18;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function statusPriority(status: HomepagePublicTrustScanStatus) {
  if (status === "blocked") return 0;
  if (status === "attention") return 1;
  return 2;
}

function worstStatus(checks: HomepagePublicTrustScanCheck[]) {
  if (checks.some((check) => check.status === "blocked")) return "blocked";
  if (checks.some((check) => check.status === "attention")) return "attention";
  return "ready";
}

function compactHref(href: string) {
  if (!href) return "#";
  if (href.startsWith("#")) return href;
  if (href.startsWith("data:")) return "data export";
  try {
    const url = new URL(href, "https://local.invalid");
    const path = `${url.pathname}${url.searchParams.has("workspace") ? url.search : ""}${url.hash}`;
    if (url.origin === "https://local.invalid") return path;
    return `${url.origin}${path}`;
  } catch {
    return href.split("?")[0] || href;
  }
}

function csvCell(value: string | number) {
  const text = String(value);
  const escaped = text.replace(/"/g, "\"\"");
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function headlineFor(status: HomepagePublicTrustScanStatus) {
  if (status === "ready") return "A public buyer can trust this without a walkthrough";
  if (status === "attention") return "Public review is close, but one trust gap needs evidence";
  return "Keep this internal until the public trust gap closes";
}

function summaryFor(input: { status: HomepagePublicTrustScanStatus; buyer: string; firstQuestion: HomepagePublicTrustScanCheck }) {
  if (input.status === "ready") {
    return `${input.buyer} can inspect value, proof, packet, reviewer decision, and public release evidence from the page.`;
  }
  if (input.status === "attention") {
    return `${input.firstQuestion.label} needs review before this becomes a confident public buyer route.`;
  }
  return `${input.firstQuestion.label} blocks the first public trust read: ${input.firstQuestion.action}`;
}

function publishRuleFor(status: HomepagePublicTrustScanStatus, firstQuestion: HomepagePublicTrustScanCheck) {
  if (status === "ready") return "Publish the buyer route only with value receipt, proof room, reviewer kit, and release report attached.";
  if (status === "attention") return `Use sponsor review until ${firstQuestion.label.toLowerCase()} has stronger evidence.`;
  return `Do not send public traffic until ${firstQuestion.owner} closes ${firstQuestion.label.toLowerCase()} and re-exports the scan.`;
}

function buildChecks(input: {
  valueLens: HomepageValueLensSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
  outcomeArtifact: HomepageOutcomeArtifactSnapshot;
  publishability: HomepagePublishabilitySnapshot;
  reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
}): HomepagePublicTrustScanCheck[] {
  const reviewerScore = clampScore((input.reviewerHandoffKit.readyCount / Math.max(1, input.reviewerHandoffKit.steps.length)) * 100);
  return [
    {
      id: "value-case",
      label: "Value case",
      status: input.valueLens.status,
      score: clampScore(average([input.valueLens.confidenceScore, statusScore(input.valueLens.status), input.valueLens.measuredSupportPercent])),
      owner: "Product owner",
      buyerQuestion: "Can a new buyer understand the promised value and the measured support?",
      evidence: input.valueLens.valueClaim,
      action: input.valueLens.readinessCoach.nextMove,
      href: input.valueLens.primaryAction.href
    },
    {
      id: "public-proof",
      label: "Public proof",
      status: input.proofEntry.status,
      score: clampScore(input.proofEntry.proofScore),
      owner: input.proofEntry.nextMove.owner,
      buyerQuestion: "Can the proof route be opened without private narration or credentials?",
      evidence: input.proofEntry.nextMove.buyerImpact,
      action: input.proofEntry.nextMove.command,
      href: input.proofEntry.nextMove.action.href
    },
    {
      id: "buyer-packet",
      label: "Buyer packet",
      status: input.outcomeArtifact.status,
      score: clampScore(input.outcomeArtifact.score),
      owner: input.outcomeArtifact.redLines.find((item) => item.status !== "pass")?.owner ?? "Sponsor",
      buyerQuestion: "Can the buyer take away one artifact with value, proof, and decision context?",
      evidence: input.outcomeArtifact.packet.summary,
      action: input.outcomeArtifact.decisionAsk,
      href: input.outcomeArtifact.primaryAction.href
    },
    {
      id: "reviewer-decision",
      label: "Reviewer decision",
      status: input.reviewerHandoffKit.status,
      score: reviewerScore,
      owner: input.reviewerHandoffKit.steps.find((item) => item.status !== "ready")?.owner ?? "Reviewer",
      buyerQuestion: "Can an external reviewer decide without booking a private walkthrough?",
      evidence: input.reviewerHandoffKit.reviewAnswer,
      action: input.reviewerHandoffKit.status === "ready" ? input.reviewerHandoffKit.sendRule : input.reviewerHandoffKit.holdRule,
      href: input.reviewerHandoffKit.primaryAction.href
    },
    {
      id: "public-release",
      label: "Public release",
      status: input.publishability.status,
      score: clampScore(input.publishability.score),
      owner: "Launch owner",
      buyerQuestion: "Can the public surface carry global traffic without hiding proof gaps?",
      evidence: input.publishability.hardTruth,
      action: input.publishability.releaseLift.actions.find((item) => item.status !== "ready")?.decisionImpact ?? input.publishability.proofSummary,
      href: input.publishability.primaryAction.href
    }
  ];
}

function buildMarkdown(snapshot: Omit<HomepagePublicTrustScanSnapshot, "copyText" | "exportMarkdown" | "markdownHref" | "csvText" | "csvHref">) {
  return [
    "# Public trust scan",
    "",
    `Status: ${snapshot.status}`,
    `Buyer: ${snapshot.buyer}`,
    `Score: ${snapshot.score}/100`,
    `Trusted checks: ${snapshot.trustedCount}/${snapshot.checkCount}`,
    `Watch checks: ${snapshot.watchCount}`,
    `Blocked checks: ${snapshot.blockedCount}`,
    "",
    snapshot.headline,
    snapshot.summary,
    "",
    "## First public question",
    `${snapshot.firstQuestion.buyerQuestion} Owner: ${snapshot.firstQuestion.owner}. Action: ${snapshot.firstQuestion.action}`,
    "",
    "## Visitor promise",
    snapshot.visitorPromise,
    "",
    "## Publish rule",
    snapshot.publishRule,
    "",
    "## Buyer question answer deck",
    `${snapshot.answeredCount}/${snapshot.answerCount} answers are safe to cite.`,
    snapshot.answerDeckSummary,
    "",
    ...snapshot.buyerAnswers.map(
      (answer) =>
        `- [${answer.status}] ${answer.question} Answer: ${answer.answer} Evidence: ${answer.evidence} Use: ${answer.decisionUse} Owner: ${answer.owner}. Next: ${answer.proofAction}`
    ),
    "",
    "## Checks",
    ...snapshot.checks.map(
      (check) =>
        `- [${check.status}] ${check.label}: ${check.score}/100. Question: ${check.buyerQuestion} Evidence: ${check.evidence} Action: ${check.action} Link: ${compactHref(check.href)}`
    )
  ].join("\n");
}

function buildCsv(checks: HomepagePublicTrustScanCheck[]) {
  const rows = [
    ["checkId", "status", "score", "owner", "label", "buyerQuestion", "action", "href"],
    ...checks.map((check) => [check.id, check.status, check.score, check.owner, check.label, check.buyerQuestion, check.action, compactHref(check.href)])
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function answerForCheck(check: HomepagePublicTrustScanCheck): HomepagePublicTrustBuyerAnswer {
  const answer =
    check.status === "ready"
      ? `Yes. ${check.evidence}`
      : check.status === "attention"
        ? `Partially. ${check.evidence} Close the watch item before calling this buyer-ready.`
        : `Not yet. ${check.action}`;
  const decisionUse =
    check.status === "ready"
      ? "Safe to cite in the public buyer route."
      : check.status === "attention"
        ? "Use only with sponsor caveat until the owner closes the watch item."
        : "Do not cite this claim in public traffic until the blocker is repaired.";

  return {
    id: check.id,
    label: check.label,
    status: check.status,
    owner: check.owner,
    question: check.buyerQuestion,
    answer,
    evidence: check.evidence,
    proofAction: check.status === "ready" ? "Keep the evidence link fresh and attached to the exported route." : check.action,
    decisionUse,
    href: check.href
  };
}

function answerDeckHeadlineFor(status: HomepagePublicTrustScanStatus) {
  if (status === "ready") return "Buyer questions have evidence-backed answers";
  if (status === "attention") return "Buyer answers need one sponsor caveat";
  return "Buyer questions still expose a public trust gap";
}

function answerDeckSummaryFor(input: { answeredCount: number; answerCount: number; firstAnswer: HomepagePublicTrustBuyerAnswer }) {
  if (input.answeredCount === input.answerCount) return "Every public buyer question has a citable answer and attached evidence.";
  return `${input.answerCount - input.answeredCount} buyer question${input.answerCount - input.answeredCount === 1 ? "" : "s"} cannot be cited yet. First gap: ${input.firstAnswer.owner} must close ${input.firstAnswer.label}.`;
}

export function buildHomepagePublicTrustScan({
  valueLens,
  proofEntry,
  outcomeArtifact,
  publishability,
  reviewerHandoffKit
}: {
  valueLens: HomepageValueLensSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
  outcomeArtifact: HomepageOutcomeArtifactSnapshot;
  publishability: HomepagePublishabilitySnapshot;
  reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
}): HomepagePublicTrustScanSnapshot {
  const checks = buildChecks({ valueLens, proofEntry, outcomeArtifact, publishability, reviewerHandoffKit }).sort((left, right) => {
    const statusDiff = statusPriority(left.status) - statusPriority(right.status);
    if (statusDiff !== 0) return statusDiff;
    return left.score - right.score;
  });
  const status = worstStatus(checks);
  const trustedCount = checks.filter((check) => check.status === "ready").length;
  const watchCount = checks.filter((check) => check.status === "attention").length;
  const blockedCount = checks.filter((check) => check.status === "blocked").length;
  const firstQuestion = checks.find((check) => check.status !== "ready") ?? checks[0];
  const score = clampScore(average(checks.map((check) => check.score)));
  const primaryAction = {
    label: status === "ready" ? "Open public review" : `Fix ${firstQuestion.label}`,
    href: firstQuestion.href,
    external: isExternalHref(firstQuestion.href)
  };
  const buyerAnswers = checks.map(answerForCheck);
  const answeredCount = buyerAnswers.filter((answer) => answer.status === "ready").length;
  const firstAnswer = buyerAnswers.find((answer) => answer.status !== "ready") ?? buyerAnswers[0];
  const partial: Omit<HomepagePublicTrustScanSnapshot, "copyText" | "exportMarkdown" | "markdownHref" | "csvText" | "csvHref"> = {
    status,
    headline: headlineFor(status),
    summary: summaryFor({ status, buyer: valueLens.buyer || proofEntry.buyer, firstQuestion }),
    buyer: valueLens.buyer || proofEntry.buyer,
    score,
    trustedCount,
    watchCount,
    blockedCount,
    checkCount: checks.length,
    firstQuestion,
    primaryAction,
    publishRule: publishRuleFor(status, firstQuestion),
    visitorPromise: `${valueLens.valueClaim} The same view exposes proof score ${proofEntry.proofScore}/100, packet readiness ${outcomeArtifact.packet.readyCount}/${outcomeArtifact.packet.itemCount}, reviewer decision ${reviewerHandoffKit.decision}, and public release score ${publishability.score}/100.`,
    answerDeckHeadline: answerDeckHeadlineFor(status),
    answerDeckSummary: answerDeckSummaryFor({ answeredCount, answerCount: buyerAnswers.length, firstAnswer }),
    answeredCount,
    answerCount: buyerAnswers.length,
    buyerAnswers,
    checks
  };
  const exportMarkdown = buildMarkdown(partial);
  const csvText = buildCsv(checks);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown,
    markdownHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    csvText,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`
  };
}
