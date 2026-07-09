import type { BuyerValueCommitmentDecision } from "./buyerValueCommitment.js";
import type { BuyerValueReport, BuyerValueReportEvidenceMode, BuyerValueReportReadiness } from "./buyerValueReport.js";
import type { BuyerValueScenarioStatus } from "./buyerValueScenario.js";

export const BUYER_VALUE_ACCEPTANCE_RECEIPT_VERSION = "buyer-value-acceptance.v1";
export const BUYER_VALUE_ACCEPTANCE_VERIFY_PATH = "/api/buyer-value-acceptance/verify";
export const BUYER_VALUE_ACCEPTANCE_VERIFIER_PATH = "/receipt-verifier";

export type BuyerValueAcceptanceStatus = "ready" | "watch" | "blocked";
export type BuyerValueAcceptanceDecision = "accept-sponsor-ask" | "accept-contained-pilot" | "hold-value-claim";

export type BuyerValueAcceptanceCheck = {
  id: string;
  label: string;
  status: BuyerValueAcceptanceStatus;
  value: string;
  evidence: string;
  acceptance: string;
};

export type BuyerValueAcceptancePayload = {
  receiptVersion: typeof BUYER_VALUE_ACCEPTANCE_RECEIPT_VERSION;
  status: BuyerValueAcceptanceStatus;
  decision: BuyerValueAcceptanceDecision;
  targetBuyer: string;
  reportId: string;
  scenarioId: string;
  sensitivityId: string;
  commitmentId: string;
  generatedAt: string;
  valueReportHref: string;
  reviewerName: string;
  reportReadiness: BuyerValueReportReadiness;
  commitmentDecision: BuyerValueCommitmentDecision;
  monthlyGrossValueYen: number;
  measuredMonthlyValueYen: number;
  supportRatioPercent: number;
  paybackDays: number;
  downsidePaybackDays: number;
  breakEvenAdoptionPercent: number;
  recommendedAskYen: number;
  publicEvidenceUrl: string;
  publicProofStatus: BuyerValueAcceptanceStatus;
  nextOwner: string;
  nextAction: string;
  buyerClaim: string;
  checks: BuyerValueAcceptanceCheck[];
};

export type BuyerValueAcceptanceVerificationRequest = {
  checksum: string;
  payload: BuyerValueAcceptancePayload;
};

export type BuyerValueAcceptanceVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type BuyerValueAcceptanceReceipt = {
  receiptId: string;
  payload: BuyerValueAcceptancePayload;
  checksum: string;
  verification: BuyerValueAcceptanceVerification;
  requestJson: string;
  requestHref: string;
  verifierHref: string;
  exportMarkdown: string;
  exportHref: string;
  headline: string;
  summary: string;
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

function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

function stablePacketHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function statusFromScenarioStatus(status: BuyerValueScenarioStatus): BuyerValueAcceptanceStatus {
  if (status === "clear") return "ready";
  if (status === "watch") return "watch";
  return "blocked";
}

function reportStatus(readiness: BuyerValueReportReadiness): BuyerValueAcceptanceStatus {
  if (readiness === "board-ready") return "ready";
  if (readiness === "pilot-only") return "watch";
  return "blocked";
}

function evidenceStatus(mode: BuyerValueReportEvidenceMode): BuyerValueAcceptanceStatus {
  if (mode === "measured-supported") return "ready";
  if (mode === "measured-partial") return "watch";
  return "blocked";
}

function aggregateStatus(checks: BuyerValueAcceptanceCheck[]): BuyerValueAcceptanceStatus {
  if (checks.some((check) => check.status === "blocked")) return "blocked";
  if (checks.some((check) => check.status === "watch")) return "watch";
  return "ready";
}

function decisionFor(status: BuyerValueAcceptanceStatus): BuyerValueAcceptanceDecision {
  if (status === "ready") return "accept-sponsor-ask";
  if (status === "watch") return "accept-contained-pilot";
  return "hold-value-claim";
}

function headlineFor(decision: BuyerValueAcceptanceDecision) {
  if (decision === "accept-sponsor-ask") return "Value proof can be sent to sponsor";
  if (decision === "accept-contained-pilot") return "Value proof is usable for a contained pilot";
  return "Value proof must be repaired before buyer review";
}

function summaryFor(status: BuyerValueAcceptanceStatus, checks: BuyerValueAcceptanceCheck[]) {
  const readyCount = checks.filter((check) => check.status === "ready").length;
  if (status === "ready") return `${readyCount}/${checks.length} checks are ready. The value claim has measured support, public proof, and a capped sponsor ask.`;
  if (status === "watch") return `${readyCount}/${checks.length} checks are ready. Keep this as pilot evidence until the watch items are closed.`;
  return `${readyCount}/${checks.length} checks are ready. Do not use this value proof externally until blocked items are repaired.`;
}

function nextOwnerFor(status: BuyerValueAcceptanceStatus, report: BuyerValueReport) {
  if (status === "ready") return report.commitment.decisionOwner;
  if (status === "watch") return report.commitment.nextProofMove.owner;
  return report.commitment.nextProofMove.owner || "Value owner";
}

function nextActionFor(status: BuyerValueAcceptanceStatus, report: BuyerValueReport) {
  if (status === "ready") return "Attach this receipt to the sponsor review packet with the value report and pilot evidence URL.";
  if (status === "watch") return report.commitment.nextProofMove.action;
  return "Repair blocked value, measured proof, or public receipt checks before sharing this claim externally.";
}

function buyerClaimFor(status: BuyerValueAcceptanceStatus, report: BuyerValueReport) {
  if (status === "ready") {
    return `${report.targetBuyer} can review ${yen(report.buyerScenario.monthlyGrossValueYen)} monthly value with ${report.evidence.supportRatioPercent}% measured support and a ${yen(report.commitment.recommendedAskYen)} capped first ask.`;
  }
  if (status === "watch") {
    return `${report.targetBuyer} can use this as contained pilot evidence, but the sponsor ask should wait for the watch checks.`;
  }
  return `${report.targetBuyer} should not receive this as a buyer-ready value claim until the blocked checks are repaired.`;
}

function buildChecks(report: BuyerValueReport): BuyerValueAcceptanceCheck[] {
  const assumptionStatus: BuyerValueAcceptanceStatus =
    report.assumptionAudit.items.some((item) => item.status === "blocked")
      ? "blocked"
      : report.assumptionAudit.clearCount === report.assumptionAudit.totalCount
        ? "ready"
        : "watch";
  const receiptCheck = report.evidence.checks.find((check) => check.id === "receipt-url");
  const publicProofStatus = statusFromScenarioStatus(receiptCheck?.status ?? "blocked");
  const sponsorAskStatus: BuyerValueAcceptanceStatus =
    report.commitment.conditions.some((condition) => condition.status === "blocked")
      ? "blocked"
      : report.commitment.decision === "send-to-sponsor"
        ? "ready"
        : report.commitment.decision === "run-contained-pilot"
          ? "watch"
          : "blocked";

  return [
    {
      id: "value-report",
      label: "Value report",
      status: reportStatus(report.readiness),
      value: report.readiness,
      evidence: report.hardTruth,
      acceptance: "Base value, payback, and sensitivity are summarized in a buyer-readable report."
    },
    {
      id: "assumption-audit",
      label: "Assumption audit",
      status: assumptionStatus,
      value: `${report.assumptionAudit.clearCount}/${report.assumptionAudit.totalCount} clear`,
      evidence: report.assumptionAudit.hardTruth,
      acceptance: "Adoption, downside payback, measured support, public receipt, and budget ask have explicit owner actions."
    },
    {
      id: "measured-proof",
      label: "Measured proof",
      status: evidenceStatus(report.evidence.mode),
      value: `${report.evidence.supportRatioPercent}% model support`,
      evidence: report.evidence.hardTruth,
      acceptance: "The value claim is tied to an observed pilot run instead of only modeled ROI."
    },
    {
      id: "public-receipt",
      label: "Public receipt",
      status: publicProofStatus,
      value: report.evidence.evidenceUrl || "missing",
      evidence: receiptCheck?.evidence ?? "Attach a public pilot receipt URL.",
      acceptance: "A reviewer can open the pilot proof without private workspace access."
    },
    {
      id: "sponsor-ask",
      label: "Sponsor ask",
      status: sponsorAskStatus,
      value: `${report.commitment.decision} / ${yen(report.commitment.recommendedAskYen)}`,
      evidence: report.commitment.askInstruction,
      acceptance: "The first ask is capped by the buyer value ceiling and guarded by red lines."
    }
  ];
}

function buildMarkdown(input: { receiptId: string; checksum: string; payload: BuyerValueAcceptancePayload; headline: string; summary: string }) {
  return [
    `# ${input.headline}`,
    "",
    `Receipt: ${input.receiptId}`,
    `Checksum: fnv1a32:${input.checksum}`,
    `Decision: ${input.payload.decision}`,
    `Status: ${input.payload.status}`,
    `Target buyer: ${input.payload.targetBuyer}`,
    `Reviewer: ${input.payload.reviewerName || "missing"}`,
    "",
    input.summary,
    "",
    "## Value claim",
    input.payload.buyerClaim,
    "",
    "## Metrics",
    `- Monthly value: ${yen(input.payload.monthlyGrossValueYen)}`,
    `- Measured value: ${yen(input.payload.measuredMonthlyValueYen)}`,
    `- Model support: ${input.payload.supportRatioPercent}%`,
    `- Base payback: ${input.payload.paybackDays} days`,
    `- Downside payback: ${input.payload.downsidePaybackDays} days`,
    `- Break-even adoption: ${input.payload.breakEvenAdoptionPercent}%`,
    `- Recommended ask: ${yen(input.payload.recommendedAskYen)}`,
    "",
    "## Acceptance checks",
    ...input.payload.checks.map((check) => `- [${check.status}] ${check.label}: ${check.value}. ${check.evidence} Acceptance: ${check.acceptance}`),
    "",
    "## Next action",
    `- ${input.payload.nextOwner}: ${input.payload.nextAction}`
  ].join("\n");
}

export function buyerValueAcceptancePayloadJson(payload: BuyerValueAcceptancePayload) {
  return canonicalJson(payload);
}

export function buyerValueAcceptanceChecksum(payload: BuyerValueAcceptancePayload) {
  return stablePacketHash(buyerValueAcceptancePayloadJson(payload));
}

export function buyerValueAcceptanceRequestJson(input: BuyerValueAcceptanceVerificationRequest) {
  return canonicalJson(input);
}

export function verifyBuyerValueAcceptanceReceipt(input: BuyerValueAcceptanceVerificationRequest): BuyerValueAcceptanceVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = buyerValueAcceptanceChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Buyer value acceptance checksum matches the value report, measured proof, sponsor ask, and acceptance checks."
      : "Buyer value acceptance checksum does not match the exported receipt. Re-export the value proof before sponsor or buyer review."
  };
}

export function buildBuyerValueAcceptanceReceipt(input: { report: BuyerValueReport; valueReportHref?: string; generatedAt?: string }): BuyerValueAcceptanceReceipt {
  const checks = buildChecks(input.report);
  const status = aggregateStatus(checks);
  const decision = decisionFor(status);
  const payload: BuyerValueAcceptancePayload = {
    receiptVersion: BUYER_VALUE_ACCEPTANCE_RECEIPT_VERSION,
    status,
    decision,
    targetBuyer: input.report.targetBuyer,
    reportId: input.report.id,
    scenarioId: input.report.buyerScenario.id,
    sensitivityId: input.report.sensitivity.id,
    commitmentId: input.report.commitment.id,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    valueReportHref: input.valueReportHref ?? "",
    reviewerName: input.report.evidence.reviewerName,
    reportReadiness: input.report.readiness,
    commitmentDecision: input.report.commitment.decision,
    monthlyGrossValueYen: input.report.buyerScenario.monthlyGrossValueYen,
    measuredMonthlyValueYen: input.report.evidence.measuredRun.measuredMonthlyValueYen,
    supportRatioPercent: input.report.evidence.supportRatioPercent,
    paybackDays: input.report.buyerScenario.paybackDays,
    downsidePaybackDays: input.report.sensitivity.cases[0]?.paybackDays ?? 999,
    breakEvenAdoptionPercent: input.report.sensitivity.breakEvenAdoptionPercent,
    recommendedAskYen: input.report.commitment.recommendedAskYen,
    publicEvidenceUrl: input.report.evidence.evidenceUrl,
    publicProofStatus: checks.find((check) => check.id === "public-receipt")?.status ?? "blocked",
    nextOwner: nextOwnerFor(status, input.report),
    nextAction: nextActionFor(status, input.report),
    buyerClaim: buyerClaimFor(status, input.report),
    checks
  };
  const checksum = buyerValueAcceptanceChecksum(payload);
  const receiptId = `buyer-value-acceptance-${status}-${checksum}`;
  const verificationRequest = { checksum, payload };
  const requestJson = buyerValueAcceptanceRequestJson(verificationRequest);
  const verification = verifyBuyerValueAcceptanceReceipt(verificationRequest);
  const headline = headlineFor(decision);
  const summary = summaryFor(status, checks);
  const exportMarkdown = buildMarkdown({ receiptId, checksum, payload, headline, summary });

  return {
    receiptId,
    payload,
    checksum,
    verification,
    requestJson,
    requestHref: `data:application/json;charset=utf-8,${encodeURIComponent(requestJson)}`,
    verifierHref: `${BUYER_VALUE_ACCEPTANCE_VERIFIER_PATH}?request=${encodeURIComponent(requestJson)}`,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`,
    headline,
    summary
  };
}
