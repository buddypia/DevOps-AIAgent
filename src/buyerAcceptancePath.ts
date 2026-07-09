import type { AdoptionOperatingPlan } from "./adoptionOperatingPlan.js";
import type { BuyerDecisionFollowUpLedger } from "./buyerDecisionFollowUp.js";
import type { BuyerProcurementDecision } from "./buyerProcurementDecision.js";
import {
  BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM,
  BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM,
  type BuyerReviewKit,
  type BuyerReviewKitDecisionGate,
  type BuyerReviewKitReplyRecord,
  type BuyerReviewKitValidationAnswerRecord
} from "./buyerReviewKit.js";
import type { CommercialOffer } from "./commercialOffer.js";

export const BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH = "/api/buyer-acceptance-path/receipt/verify";

export type BuyerAcceptancePathStatus = "ready" | "review" | "blocked";
export type BuyerAcceptanceCriterionStatus = "accepted" | "review" | "blocked";
export type BuyerAcceptanceDecision = "approve-pilot" | "sponsor-review" | "do-not-send";
export type BuyerAcceptanceStageId =
  | "external-review"
  | "buyer-validation"
  | "buyer-reply"
  | "procurement-case"
  | "commercial-approval"
  | "adoption-operation"
  | "owner-follow-up";

export type BuyerAcceptanceAction = {
  label: string;
  href: string;
  owner: string;
  due: string;
};

export type BuyerAcceptanceStage = BuyerAcceptanceAction & {
  id: BuyerAcceptanceStageId;
  label: string;
  status: BuyerAcceptanceCriterionStatus;
  evidence: string;
  acceptance: string;
  action: string;
};

export type BuyerAcceptanceOwnerCommitment = {
  role: string;
  owner: string;
  commitment: string;
  artifact: string;
};

export type BuyerAcceptancePathLinks = {
  reviewKitUrl?: string;
  validationAnswerRecordVerifierUrl?: string;
  replyRecordVerifierUrl?: string;
  procurementDecisionUrl?: string;
  commercialOfferUrl?: string;
  adoptionPlanUrl?: string;
  followUpUrl?: string;
  jsonUrl?: string;
  markdownUrl?: string;
  appUrl?: string;
};

export type BuyerAcceptancePathDecisionGate = BuyerReviewKitDecisionGate;

export type BuyerAcceptancePathReceiptPayload = {
  receiptVersion: "buyer-acceptance-path.v1";
  pathId: string;
  status: BuyerAcceptancePathStatus;
  decision: BuyerAcceptanceDecision;
  headline: string;
  summary: string;
  buyer: string;
  score: number;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  firstCommitmentYen: number;
  expectedMonthlyValueYen: number;
  paybackDays: number;
  decisionGate: BuyerAcceptancePathDecisionGate;
  replyRecord?: {
    status: BuyerReviewKitReplyRecord["status"];
    verified: boolean;
    receiptType: string;
    decision: string;
    checksum: string;
  };
  validationAnswerRecord?: {
    status: BuyerReviewKitValidationAnswerRecord["status"];
    verified: boolean;
    receiptType: string;
    answerStatus: string;
    answeredCount?: number;
    totalCount?: number;
    checksum: string;
  };
  primaryAction: BuyerAcceptanceAction;
  stages: Array<Pick<BuyerAcceptanceStage, "id" | "label" | "status" | "owner" | "due" | "evidence" | "acceptance" | "action" | "href">>;
  ownerCommitments: BuyerAcceptanceOwnerCommitment[];
  guardrails: string[];
};

export type BuyerAcceptancePathReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type BuyerAcceptancePathReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH;
  payload: BuyerAcceptancePathReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: BuyerAcceptancePathReceiptVerification;
  generatedFrom: string[];
};

export type BuyerAcceptancePath = {
  id: string;
  status: BuyerAcceptancePathStatus;
  decision: BuyerAcceptanceDecision;
  headline: string;
  summary: string;
  buyer: string;
  score: number;
  acceptanceMinutes: number;
  primaryAction: BuyerAcceptanceAction;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  firstCommitmentYen: number;
  expectedMonthlyValueYen: number;
  paybackDays: number;
  decisionGate: BuyerAcceptancePathDecisionGate;
  stages: BuyerAcceptanceStage[];
  ownerCommitments: BuyerAcceptanceOwnerCommitment[];
  guardrails: string[];
  receipt: BuyerAcceptancePathReceipt;
  copyText: string;
  exportMarkdown: string;
};

type BuyerAcceptancePathSource = {
  reviewKit: Pick<BuyerReviewKit, "status" | "headline" | "readyCount" | "watchCount" | "blockedCount" | "steps" | "primaryAction" | "decisionGate">;
  validationAnswerRecord?: BuyerReviewKitValidationAnswerRecord;
  replyRecord?: BuyerReviewKitReplyRecord;
  procurementDecision: Pick<
    BuyerProcurementDecision,
    | "readiness"
    | "score"
    | "headline"
    | "hardTruth"
    | "targetBuyer"
    | "firstCommitmentYen"
    | "monthlyValueYen"
    | "paybackDays"
    | "mutualActionPlan"
    | "decisionContract"
    | "approvalLadder"
  >;
  commercialOffer: Pick<
    CommercialOffer,
    "readiness" | "offerScore" | "headline" | "contractAsk" | "approvalMemo" | "recommendedTierId" | "tiers" | "guardrails" | "totalFirstCommitmentYen" | "expectedMonthlyValueYen"
  >;
  adoptionPlan: Pick<AdoptionOperatingPlan, "readiness" | "planScore" | "headline" | "hardTruth" | "ownerCommitments" | "approvalAnchors" | "expansionCriteria" | "operatingCalendar">;
  followUpLedger: Pick<BuyerDecisionFollowUpLedger, "status" | "firstAction" | "readyCount" | "taskTotal" | "blockedCount" | "attentionCount">;
  links?: BuyerAcceptancePathLinks;
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

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function criterionStatusFrom(value: string): BuyerAcceptanceCriterionStatus {
  if (["ready", "accepted", "buy-now", "offer-ready", "ready-to-operate", "clear"].includes(value)) return "accepted";
  if (["review", "repair", "conditional", "pilot-first", "needs-redlines", "needs-owner-commitment", "attention", "watch"].includes(value)) return "review";
  return "blocked";
}

function pathStatusFrom(stages: BuyerAcceptanceStage[]): BuyerAcceptancePathStatus {
  if (stages.some((stage) => stage.status === "blocked")) return "blocked";
  if (stages.some((stage) => stage.status === "review")) return "review";
  return "ready";
}

function decisionFor(status: BuyerAcceptancePathStatus): BuyerAcceptanceDecision {
  if (status === "ready") return "approve-pilot";
  if (status === "review") return "sponsor-review";
  return "do-not-send";
}

function replyRecordStageStatus(replyRecord: BuyerReviewKitReplyRecord): BuyerAcceptanceCriterionStatus {
  if (!replyRecord.verified) return "blocked";
  if (replyRecord.decision === "continue") return "accepted";
  if (replyRecord.decision === "revise") return "review";
  return "blocked";
}

function replyRecordAcceptance(replyRecord: BuyerReviewKitReplyRecord) {
  if (!replyRecord.verified) return "The buyer reply receipt must verify before the acceptance path can move forward.";
  if (replyRecord.decision === "continue") return "The verified buyer reply approves moving from review into pilot execution.";
  if (replyRecord.decision === "revise") return "The verified buyer reply requests revision before pilot approval.";
  if (replyRecord.decision === "stop") return "The verified buyer reply stops the buyer packet and preserves the audit trail.";
  return "The verified buyer reply must be classified before approval.";
}

function replyRecordAction(replyRecord: BuyerReviewKitReplyRecord) {
  if (!replyRecord.verified) return "Re-export and verify the buyer reply receipt.";
  if (replyRecord.decision === "continue") return replyRecord.nextAction;
  if (replyRecord.decision === "revise") return "Route the requested revision back to proof repair.";
  if (replyRecord.decision === "stop") return "Close the buyer audit and do not send the pilot packet.";
  return "Classify the buyer reply before approval.";
}

function validationAnswerStageStatus(record: BuyerReviewKitValidationAnswerRecord): BuyerAcceptanceCriterionStatus {
  if (!record.verified) return "blocked";
  if (record.answerStatus === "ready") return "accepted";
  if (record.answerStatus === "watch") return "review";
  return "blocked";
}

function validationAnswerAcceptance(record: BuyerReviewKitValidationAnswerRecord) {
  if (!record.verified) return "The buyer validation answer receipt must verify before the answers can support approval.";
  if (record.answerStatus === "ready") return "The five buyer validation answers are evidenced and can support the pilot decision.";
  if (record.answerStatus === "watch") return "The buyer validation answers need proof review before they can support approval.";
  return "The buyer validation answers are incomplete and must not support approval yet.";
}

function validationAnswerAction(record: BuyerReviewKitValidationAnswerRecord) {
  if (!record.verified) return "Re-export and verify the buyer validation answer receipt.";
  return record.nextAction;
}

function decisionGateStageStatus(reviewKit: BuyerAcceptancePathSource["reviewKit"]): BuyerAcceptanceCriterionStatus {
  const fallbackStatus = criterionStatusFrom(reviewKit.status);
  if (reviewKit.decisionGate.decisionAlignment === "aligned") return fallbackStatus;
  if (reviewKit.decisionGate.recommendedChoice === "stop") return "blocked";
  return fallbackStatus === "blocked" ? "blocked" : "review";
}

function decisionGateEvidence(reviewKit: BuyerAcceptancePathSource["reviewKit"], reviewStepTotal: number) {
  const gate = reviewKit.decisionGate;
  return `${reviewKit.readyCount}/${reviewStepTotal || reviewKit.steps.length} review steps ready; ${reviewKit.headline}. Decision gate recommended ${gate.recommendedChoice}, selected ${gate.selectedChoice}; ${gate.openConditionCount} open condition(s).`;
}

function decisionGateAcceptance(gate: BuyerAcceptancePathDecisionGate) {
  if (gate.decisionAlignment === "aligned") return "Trust manifest, proof verifier, decision receipt, and follow-up ledger are inspected from one review kit.";
  return "Acceptance is blocked until the selected decision matches the evidence recommendation and continue criteria are repaired.";
}

function decisionGateAction(reviewKit: BuyerAcceptancePathSource["reviewKit"]) {
  if (reviewKit.decisionGate.decisionAlignment === "aligned") return reviewKit.primaryAction.action;
  return `${reviewKit.decisionGate.overrideWarning} Open the decision receipt before accepting this path.`;
}

function headlineFor(status: BuyerAcceptancePathStatus, buyer: string) {
  if (status === "ready") return `${buyer} has a go/no-go path for approval`;
  if (status === "review") return `${buyer} needs sponsor review before approval`;
  return `${buyer} should not receive the acceptance packet yet`;
}

function summaryFor(input: BuyerAcceptancePathSource, status: BuyerAcceptancePathStatus, stages: BuyerAcceptanceStage[]) {
  const gate = input.reviewKit.decisionGate;
  if (gate.decisionAlignment === "overridden") {
    return `Hold buyer delivery: decision receipt selected ${gate.selectedChoice}, but evidence recommends ${gate.recommendedChoice}. ${gate.overrideWarning}`;
  }
  if (status === "ready") {
    const verifiedRecords = [
      input.validationAnswerRecord ? "verified buyer validation answers" : "",
      input.replyRecord ? "verified buyer reply" : ""
    ].filter(Boolean);
    return `${[...verifiedRecords, "external review", "procurement case", "commercial offer", "adoption operation", "owner follow-up"].join(", ")} are aligned for a ${yen(input.procurementDecision.firstCommitmentYen)} first commitment.`;
  }
  const firstOpen = stages.find((stage) => stage.status !== "accepted");
  if (status === "review") return `${firstOpen?.label ?? "One acceptance stage"} needs owner review before the pilot can be approved.`;
  return `Hold buyer delivery until ${firstOpen?.label.toLowerCase() ?? "the blocked acceptance stage"} is repaired.`;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function firstOpenCommercialCondition(offer: BuyerAcceptancePathSource["commercialOffer"]) {
  return offer.approvalMemo.redlineQueue[0] ?? offer.approvalMemo.conditions.find((condition) => condition.status !== "clear");
}

function firstOpenAdoptionAnchor(plan: BuyerAcceptancePathSource["adoptionPlan"]) {
  return plan.approvalAnchors.find((anchor) => anchor.status !== "clear") ?? plan.approvalAnchors[0];
}

function buildStages(input: BuyerAcceptancePathSource): BuyerAcceptanceStage[] {
  const links = input.links ?? {};
  const reviewStepTotal = input.reviewKit.readyCount + input.reviewKit.watchCount + input.reviewKit.blockedCount;
  const firstMapStep = input.procurementDecision.mutualActionPlan.steps.find((step) => step.status !== "clear") ?? input.procurementDecision.mutualActionPlan.steps[0];
  const commercialCondition = firstOpenCommercialCondition(input.commercialOffer);
  const adoptionAnchor = firstOpenAdoptionAnchor(input.adoptionPlan);
  const adoptionOwner = input.adoptionPlan.ownerCommitments[0];
  const stages: BuyerAcceptanceStage[] = [
    {
      id: "external-review",
      label: "External review",
      status: decisionGateStageStatus(input.reviewKit),
      owner: "External reviewer",
      due: "Meeting start",
      evidence: decisionGateEvidence(input.reviewKit, reviewStepTotal),
      acceptance: decisionGateAcceptance(input.reviewKit.decisionGate),
      action: decisionGateAction(input.reviewKit),
      href: links.reviewKitUrl ?? input.reviewKit.primaryAction.href
    }
  ];

  if (input.validationAnswerRecord) {
    const answers =
      typeof input.validationAnswerRecord.answeredCount === "number" && typeof input.validationAnswerRecord.totalCount === "number"
        ? `${input.validationAnswerRecord.answeredCount}/${input.validationAnswerRecord.totalCount}`
        : "unknown";
    const confidence = typeof input.validationAnswerRecord.confidence === "number" ? ` at ${input.validationAnswerRecord.confidence}/100` : "";
    const checksum = input.validationAnswerRecord.checksum ? `; checksum ${input.validationAnswerRecord.checksum}` : "";
    const buyer = input.validationAnswerRecord.buyer ? `${input.validationAnswerRecord.buyer}; ` : "";
    stages.push({
      id: "buyer-validation",
      label: "Buyer validation",
      status: validationAnswerStageStatus(input.validationAnswerRecord),
      owner: input.validationAnswerRecord.buyer ?? "External reviewer",
      due: "Before buyer reply",
      evidence: `${buyer}${answers} answers${confidence}; ${input.validationAnswerRecord.receiptLabel}/${input.validationAnswerRecord.status}; answer status ${input.validationAnswerRecord.answerStatus}${checksum}.`,
      acceptance: validationAnswerAcceptance(input.validationAnswerRecord),
      action: validationAnswerAction(input.validationAnswerRecord),
      href: links.validationAnswerRecordVerifierUrl ?? input.validationAnswerRecord.verifierUrl
    });
  }

  if (input.replyRecord) {
    const confidence = typeof input.replyRecord.confidence === "number" ? ` at ${input.replyRecord.confidence}/100` : "";
    const checksum = input.replyRecord.checksum ? `; checksum ${input.replyRecord.checksum}` : "";
    const buyer = input.replyRecord.buyer ? `${input.replyRecord.buyer}; ` : "";
    stages.push({
      id: "buyer-reply",
      label: "Buyer reply",
      status: replyRecordStageStatus(input.replyRecord),
      owner: input.replyRecord.buyer ?? "External reviewer",
      due: "Before pilot approval",
      evidence: `${buyer}${input.replyRecord.receiptLabel}/${input.replyRecord.status}; ${input.replyRecord.decision}${confidence}${checksum}.`,
      acceptance: replyRecordAcceptance(input.replyRecord),
      action: replyRecordAction(input.replyRecord),
      href: links.replyRecordVerifierUrl ?? input.replyRecord.verifierUrl
    });
  }

  stages.push(
    {
      id: "procurement-case",
      label: "Procurement case",
      status: criterionStatusFrom(input.procurementDecision.readiness),
      owner: input.procurementDecision.targetBuyer || "Buyer sponsor",
      due: firstMapStep?.due ?? "Before budget ask",
      evidence: `${input.procurementDecision.score}/100 procurement score. ${input.procurementDecision.hardTruth}`,
      acceptance: input.procurementDecision.decisionContract.approvalAsk,
      action: firstMapStep ? firstMapStep.commitment : input.procurementDecision.decisionContract.decisionGate,
      href: links.procurementDecisionUrl ?? firstMapStep?.href ?? "#procurement-decision"
    },
    {
      id: "commercial-approval",
      label: "Commercial approval",
      status: criterionStatusFrom(input.commercialOffer.readiness),
      owner: commercialCondition?.owner ?? input.commercialOffer.approvalMemo.signer,
      due: commercialCondition?.requiredBefore ?? "Before signature",
      evidence: `${input.commercialOffer.offerScore}/100 offer score. ${input.commercialOffer.contractAsk}`,
      acceptance: input.commercialOffer.approvalMemo.summary,
      action: commercialCondition ? `Clear ${commercialCondition.label}.` : input.commercialOffer.approvalMemo.sendLine,
      href: links.commercialOfferUrl ?? "#commercial-offer"
    },
    {
      id: "adoption-operation",
      label: "Adoption operation",
      status: criterionStatusFrom(input.adoptionPlan.readiness),
      owner: adoptionAnchor?.owner ?? adoptionOwner?.owner ?? "Customer success owner",
      due: adoptionAnchor?.label ?? "Day 0",
      evidence: `${input.adoptionPlan.planScore}/100 operating score. ${input.adoptionPlan.hardTruth}`,
      acceptance: input.adoptionPlan.expansionCriteria[0] ?? "Owner commitments, cadence, interventions, and expansion criteria are visible.",
      action: adoptionAnchor?.action ?? "Attach the adoption operating calendar.",
      href: links.adoptionPlanUrl ?? adoptionAnchor?.href ?? "#adoption-plan"
    },
    {
      id: "owner-follow-up",
      label: "Owner follow-up",
      status: criterionStatusFrom(input.followUpLedger.status),
      owner: "Meeting owner",
      due: "Meeting close",
      evidence: `${input.followUpLedger.readyCount}/${input.followUpLedger.taskTotal} follow-up tasks ready; ${input.followUpLedger.blockedCount} blocked and ${input.followUpLedger.attentionCount} attention.`,
      acceptance: "Every open action has an owner, due window, close condition, and public artifact link.",
      action: input.followUpLedger.status === "ready" ? "Attach the follow-up ledger to the acceptance packet." : input.followUpLedger.firstAction.label,
      href: links.followUpUrl ?? input.followUpLedger.firstAction.href
    }
  );

  return stages;
}

function buildGuardrails(input: BuyerAcceptancePathSource) {
  return [
    ...input.procurementDecision.decisionContract.stopRules.slice(0, 2),
    ...input.commercialOffer.guardrails.slice(0, 2).map((guardrail) => `${guardrail.label}: ${guardrail.rule}`),
    ...input.adoptionPlan.expansionCriteria.slice(0, 2)
  ].slice(0, 6);
}

function buildOwnerCommitments(input: BuyerAcceptancePathSource): BuyerAcceptanceOwnerCommitment[] {
  const validationCommitment = input.validationAnswerRecord
    ? [
        {
          role: "Buyer validation",
          owner: input.validationAnswerRecord.buyer ?? "External reviewer",
          commitment: input.validationAnswerRecord.verified
            ? `${input.validationAnswerRecord.answerStatus} validation answers verified. ${validationAnswerAction(input.validationAnswerRecord)}`
            : "Buyer validation answer receipt must verify before this path can be accepted.",
          artifact: input.links?.validationAnswerRecordVerifierUrl ?? input.validationAnswerRecord.verifierUrl
        }
      ]
    : [];
  const replyCommitment = input.replyRecord
    ? [
        {
          role: "Buyer reply",
          owner: input.replyRecord.buyer ?? "External reviewer",
          commitment: input.replyRecord.verified
            ? `${input.replyRecord.decision} reply verified. ${replyRecordAction(input.replyRecord)}`
            : "Reply receipt must verify before this path can be accepted.",
          artifact: input.links?.replyRecordVerifierUrl ?? input.replyRecord.verifierUrl
        }
      ]
    : [];
  const mapCommitments = input.procurementDecision.mutualActionPlan.steps.slice(0, 2).map((step) => ({
    role: step.buyerOwner,
    owner: step.a2aOwner,
    commitment: step.commitment,
    artifact: step.href
  }));
  const adoptionCommitments = input.adoptionPlan.ownerCommitments.slice(0, 3).map((commitment) => ({
    role: commitment.role,
    owner: commitment.owner,
    commitment: commitment.commitment,
    artifact: commitment.artifact
  }));
  return [...validationCommitment, ...replyCommitment, ...mapCommitments, ...adoptionCommitments].slice(0, 5);
}

export function buyerAcceptancePathReceiptChecksum(payload: BuyerAcceptancePathReceiptPayload) {
  return stableDigest(payload);
}

export function verifyBuyerAcceptancePathReceipt(input: { checksum: string; payload: BuyerAcceptancePathReceiptPayload }): BuyerAcceptancePathReceiptVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = buyerAcceptancePathReceiptChecksum(input.payload);
  const verified = actualChecksum === expectedChecksum;
  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Buyer acceptance path checksum matches the exported path payload."
      : "Buyer acceptance path checksum does not match the exported path payload. Do not approve this buyer path until it is re-issued."
  };
}

const RECEIPT_PAYLOAD_OMITTED_QUERY_VALUE = "[omitted-from-receipt-payload]";
const RECEIPT_PAYLOAD_QUERY_BLOB_KEYS = [BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM, BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM, "request"] as const;
const RECEIPT_PAYLOAD_QUERY_KEEP_KEYS = ["decision", "reviewerName", "verify"] as const;

function receiptPayloadHref(href: string) {
  const trimmed = href.trim();
  if (!trimmed) return href;
  try {
    const isAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
    const url = new URL(trimmed, "https://receipt.local");
    let changed = false;
    RECEIPT_PAYLOAD_QUERY_BLOB_KEYS.forEach((key) => {
      if (!url.searchParams.has(key)) return;
      url.searchParams.set(key, RECEIPT_PAYLOAD_OMITTED_QUERY_VALUE);
      changed = true;
    });
    if (url.search.length > 600) {
      const kept = new URLSearchParams();
      RECEIPT_PAYLOAD_QUERY_KEEP_KEYS.forEach((key) => {
        const value = url.searchParams.get(key);
        if (value) kept.set(key, value);
      });
      kept.set("context", RECEIPT_PAYLOAD_OMITTED_QUERY_VALUE);
      url.search = kept.toString();
      changed = true;
    }
    if (!changed) return href;
    return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return trimmed.length > 600 ? `${trimmed.slice(0, 240)}...${RECEIPT_PAYLOAD_OMITTED_QUERY_VALUE}` : href;
  }
}

function buildMarkdown(path: Omit<BuyerAcceptancePath, "copyText" | "exportMarkdown">) {
  return [
    `# ${path.headline}`,
    "",
    `Path: ${path.id}`,
    `Decision: ${path.decision}`,
    `Status: ${path.status}`,
    `Buyer: ${path.buyer}`,
    `Score: ${path.score}`,
    `First commitment: ${yen(path.firstCommitmentYen)}`,
    `Expected monthly value: ${yen(path.expectedMonthlyValueYen)}`,
    `Payback: ${path.paybackDays} days`,
    `Receipt: ${path.receipt.receiptId}`,
    `Checksum: ${path.receipt.checksumAlgorithm}:${path.receipt.checksum}`,
    "",
    path.summary,
    "",
    "## Decision gate",
    `Evidence recommendation: ${path.decisionGate.recommendedChoice}`,
    `Selected decision: ${path.decisionGate.selectedChoice}`,
    `Decision alignment: ${path.decisionGate.decisionAlignment}`,
    `Open decision conditions: ${path.decisionGate.openConditionCount} (${path.decisionGate.blockedConditionCount} blocked, ${path.decisionGate.watchConditionCount} watch)`,
    path.decisionGate.blockingSummary,
    path.decisionGate.overrideWarning,
    "",
    "## Continue criteria",
    ...path.decisionGate.continueCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Acceptance stages",
    ...path.stages.map((stage) => `- [${stage.status}] ${stage.label} (${stage.owner}, ${stage.due}): ${stage.acceptance} Evidence: ${stage.evidence} Action: ${stage.action} Link: ${stage.href}`),
    "",
    "## Owner commitments",
    ...path.ownerCommitments.map((commitment) => `- ${commitment.role} / ${commitment.owner}: ${commitment.commitment} (${commitment.artifact})`),
    "",
    "## Guardrails",
    ...path.guardrails.map((guardrail) => `- ${guardrail}`),
    "",
    "## Primary action",
    `${path.primaryAction.label}: ${path.primaryAction.href}`,
    "",
    "## API verification",
    `POST ${path.receipt.verificationApiPath}`,
    "```json",
    path.receipt.verificationRequestJson,
    "```"
  ].join("\n");
}

export function buildBuyerAcceptancePath(input: BuyerAcceptancePathSource): BuyerAcceptancePath {
  const stages = buildStages(input);
  const status = pathStatusFrom(stages);
  const decision = decisionFor(status);
  const primaryStage = stages.find((stage) => stage.status === "blocked") ?? stages.find((stage) => stage.status === "review") ?? stages[0];
  const readyCount = stages.filter((stage) => stage.status === "accepted").length;
  const reviewCount = stages.filter((stage) => stage.status === "review").length;
  const blockedCount = stages.filter((stage) => stage.status === "blocked").length;
  const basePath: Omit<BuyerAcceptancePath, "copyText" | "exportMarkdown" | "receipt"> = {
    id: `buyer-acceptance-path-${decision}-${stableDigest({
      review: input.reviewKit.status,
      procurement: input.procurementDecision.readiness,
      commercial: input.commercialOffer.readiness,
      adoption: input.adoptionPlan.readiness,
      followUp: input.followUpLedger.status,
      decisionGate: [
        input.reviewKit.decisionGate.recommendedChoice,
        input.reviewKit.decisionGate.selectedChoice,
        input.reviewKit.decisionGate.decisionAlignment,
        input.reviewKit.decisionGate.openConditionCount
      ],
      validationAnswer: input.validationAnswerRecord
        ? [input.validationAnswerRecord.status, input.validationAnswerRecord.answerStatus, input.validationAnswerRecord.checksum]
        : null,
      reply: input.replyRecord ? [input.replyRecord.status, input.replyRecord.decision, input.replyRecord.checksum] : null
    }).slice(0, 10)}`,
    status,
    decision,
    headline: headlineFor(status, input.procurementDecision.targetBuyer),
    summary: summaryFor(input, status, stages),
    buyer: input.procurementDecision.targetBuyer,
    score: average([input.procurementDecision.score, input.commercialOffer.offerScore, input.adoptionPlan.planScore, readyCount * 20]),
    acceptanceMinutes: status === "ready" ? 18 + (input.validationAnswerRecord ? 3 : 0) + (input.replyRecord ? 2 : 0) : 24 + (input.validationAnswerRecord ? 3 : 0) + (input.replyRecord ? 2 : 0),
    primaryAction:
      status === "ready"
        ? {
            label: "Approve pilot",
            href: input.links?.commercialOfferUrl ?? input.links?.reviewKitUrl ?? primaryStage?.href ?? "#",
            owner: input.procurementDecision.targetBuyer,
            due: "Meeting close"
          }
        : {
            label: primaryStage ? `${primaryStage.status === "blocked" ? "Fix" : "Review"} ${primaryStage.label}` : "Open acceptance path",
            href: primaryStage?.href ?? input.links?.reviewKitUrl ?? "#",
            owner: primaryStage?.owner ?? input.procurementDecision.targetBuyer,
            due: primaryStage?.due ?? "Before buyer approval"
          },
    readyCount,
    reviewCount,
    blockedCount,
    firstCommitmentYen: input.procurementDecision.firstCommitmentYen,
    expectedMonthlyValueYen: input.procurementDecision.monthlyValueYen || input.commercialOffer.expectedMonthlyValueYen,
    paybackDays: input.procurementDecision.paybackDays,
    decisionGate: input.reviewKit.decisionGate,
    stages,
    ownerCommitments: buildOwnerCommitments(input),
    guardrails: buildGuardrails(input)
  };
  const payload: BuyerAcceptancePathReceiptPayload = {
    receiptVersion: "buyer-acceptance-path.v1",
    pathId: basePath.id,
    status: basePath.status,
    decision: basePath.decision,
    headline: basePath.headline,
    summary: basePath.summary,
    buyer: basePath.buyer,
    score: basePath.score,
    readyCount: basePath.readyCount,
    reviewCount: basePath.reviewCount,
    blockedCount: basePath.blockedCount,
    firstCommitmentYen: basePath.firstCommitmentYen,
    expectedMonthlyValueYen: basePath.expectedMonthlyValueYen,
    paybackDays: basePath.paybackDays,
    decisionGate: basePath.decisionGate,
    replyRecord: input.replyRecord
      ? {
          status: input.replyRecord.status,
          verified: input.replyRecord.verified,
          receiptType: input.replyRecord.receiptType,
          decision: input.replyRecord.decision,
          checksum: input.replyRecord.checksum
        }
      : undefined,
    validationAnswerRecord: input.validationAnswerRecord
      ? {
          status: input.validationAnswerRecord.status,
          verified: input.validationAnswerRecord.verified,
          receiptType: input.validationAnswerRecord.receiptType,
          answerStatus: input.validationAnswerRecord.answerStatus,
          answeredCount: input.validationAnswerRecord.answeredCount,
          totalCount: input.validationAnswerRecord.totalCount,
          checksum: input.validationAnswerRecord.checksum
        }
      : undefined,
    primaryAction: {
      ...basePath.primaryAction,
      href: receiptPayloadHref(basePath.primaryAction.href)
    },
    stages: basePath.stages.map((stage) => ({
      id: stage.id,
      label: stage.label,
      status: stage.status,
      owner: stage.owner,
      due: stage.due,
      evidence: stage.evidence,
      acceptance: stage.acceptance,
      action: stage.action,
      href: receiptPayloadHref(stage.href)
    })),
    ownerCommitments: basePath.ownerCommitments.map((commitment) => ({
      ...commitment,
      artifact: receiptPayloadHref(commitment.artifact)
    })),
    guardrails: basePath.guardrails
  };
  const payloadJson = canonicalJson(payload);
  const checksum = buyerAcceptancePathReceiptChecksum(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const receipt: BuyerAcceptancePathReceipt = {
    receiptId: `buyer-acceptance-path-${decision}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH as typeof BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification: verifyBuyerAcceptancePathReceipt({ checksum, payload }),
    generatedFrom: [
      "buyer-review-kit",
      ...(input.validationAnswerRecord ? ["buyer-validation-answer-record"] : []),
      ...(input.replyRecord ? ["buyer-reply-record"] : []),
      "buyer-procurement-decision",
      "commercial-offer",
      "adoption-operating-plan",
      "buyer-decision-follow-up"
    ]
  };
  const partial: Omit<BuyerAcceptancePath, "copyText" | "exportMarkdown"> = {
    ...basePath,
    receipt
  };
  const exportMarkdown = buildMarkdown(partial);
  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

function tone(status: BuyerAcceptancePathStatus | BuyerAcceptanceCriterionStatus) {
  if (status === "ready" || status === "accepted") return "good";
  if (status === "blocked") return "bad";
  return "watch";
}

function receiptVerifierHref(path: BuyerAcceptancePath) {
  const params = new URLSearchParams({
    request: path.receipt.verificationRequestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

export function renderBuyerAcceptancePathHtml(path: BuyerAcceptancePath, links: BuyerAcceptancePathLinks = {}) {
  const nav = [
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}" aria-label="Markdown">MD</a>` : "",
    `<a href="${escapeHtml(path.receipt.verificationRequestHref)}" download="buyer-acceptance-path-verify-request.json" aria-label="Receipt JSON">Receipt</a>`,
    `<a href="${escapeHtml(receiptVerifierHref(path))}" aria-label="Verify path">Verify</a>`,
    links.reviewKitUrl ? `<a href="${escapeHtml(links.reviewKitUrl)}" aria-label="Review kit">Review</a>` : "",
    links.validationAnswerRecordVerifierUrl ? `<a href="${escapeHtml(links.validationAnswerRecordVerifierUrl)}" aria-label="Validation answers">Answers</a>` : "",
    links.replyRecordVerifierUrl ? `<a href="${escapeHtml(links.replyRecordVerifierUrl)}" aria-label="Reply receipt">Reply</a>` : "",
    links.procurementDecisionUrl ? `<a href="${escapeHtml(links.procurementDecisionUrl)}" aria-label="Procurement">Procure</a>` : "",
    links.commercialOfferUrl ? `<a href="${escapeHtml(links.commercialOfferUrl)}">Offer</a>` : "",
    links.adoptionPlanUrl ? `<a href="${escapeHtml(links.adoptionPlanUrl)}" aria-label="Adoption">Adopt</a>` : "",
    links.followUpUrl ? `<a href="${escapeHtml(links.followUpUrl)}" aria-label="Follow-up">Follow</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}" aria-label="Workbench">App</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const stages = path.stages
    .map(
      (stage) => `
        <article class="stage ${tone(stage.status)}">
          <div class="stage-state"><span>${escapeHtml(stage.status)}</span><b>${escapeHtml(stage.due)}</b></div>
          <div class="stage-copy">
            <h2>${escapeHtml(stage.label)}</h2>
            <p>${escapeHtml(stage.acceptance)}</p>
            <small>${escapeHtml(stage.evidence)}</small>
          </div>
          <div class="stage-action">
            <span>${escapeHtml(stage.owner)}</span>
            <a href="${escapeHtml(stage.href)}">${escapeHtml(stage.action)}</a>
          </div>
        </article>`
    )
    .join("");
  const commitments = path.ownerCommitments
    .map(
      (commitment) => `
        <li>
          <span>${escapeHtml(commitment.role)}</span>
          <strong>${escapeHtml(commitment.owner)}</strong>
          <p>${escapeHtml(commitment.commitment)}</p>
          <small>${escapeHtml(commitment.artifact)}</small>
        </li>`
    )
    .join("");
  const guardrails = path.guardrails.map((guardrail) => `<li>${escapeHtml(guardrail)}</li>`).join("");
  const continueCriteria = path.decisionGate.continueCriteria.map((criterion) => `<li>${escapeHtml(criterion)}</li>`).join("");
  const decisionGateTone = path.decisionGate.decisionAlignment === "aligned" ? tone(path.status) : "bad";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(path.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #162022; --muted: #5d686a; --paper: #f4f6f3; --panel: #ffffff; --line: #cbd7d3; --green: #0f766e; --blue: #254f9a; --red: #a82135; --amber: #a56a16; --charcoal: #202a2d; }
      * { box-sizing: border-box; }
      body { min-width: 320px; margin: 0; color: var(--ink); background: linear-gradient(180deg, #e7efea 0, var(--paper) 34%); font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", ui-sans-serif, system-ui, sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 28px)); margin: 0 auto; }
      header { padding: 30px 0 14px; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 370px); gap: 12px; align-items: stretch; }
      .hero-copy, .stamp, .primary, .decision-gate, .stage, .owners, .guardrails { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,255,255,.9); box-shadow: 0 16px 34px rgba(22,32,34,.07); }
      .hero-copy { padding: 20px; }
      .eyebrow, .stamp span, .stage-state span, .stage-action span, .decision-gate span, .owners span { color: var(--green); font-size: .72rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 920px; margin: 8px 0 10px; font-size: clamp(2.15rem, 5vw, 4.5rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0; line-height: 1.08; letter-spacing: 0; }
      p, small { color: var(--muted); }
      nav { display: flex; flex-wrap: nowrap; gap: 8px; margin-top: 18px; overflow-x: auto; padding-bottom: 2px; }
      nav a, .primary a, .stage-action a { min-height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; color: var(--ink); background: #fff; font-size: .86rem; font-weight: 900; text-decoration: none; }
      nav a { flex: 0 0 auto; white-space: nowrap; }
      .stamp { display: grid; gap: 10px; padding: 20px; color: #fff; background: linear-gradient(150deg, var(--charcoal), var(--blue) 56%, var(--green)); align-content: end; }
      .stamp span, .stamp small { color: rgba(255,255,255,.78); }
      .stamp strong { font-size: clamp(2.2rem, 7vw, 4.5rem); line-height: .9; }
      .stamp small { font-weight: 850; overflow-wrap: anywhere; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .primary { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, .42fr); gap: 12px; padding: 18px; border-left: 6px solid var(--amber); }
      .primary.good { border-left-color: var(--green); background: #edf8f1; }
      .primary.bad { border-left-color: var(--red); background: #fff1f2; }
      .primary h2 { font-size: clamp(1.5rem, 3vw, 2.2rem); }
      .decision-gate { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, .45fr); gap: 12px; padding: 18px; border-left: 6px solid var(--amber); }
      .decision-gate.good { border-left-color: var(--green); background: #edf8f1; }
      .decision-gate.bad { border-left-color: var(--red); background: #fff1f2; }
      .decision-gate h2 { margin-top: 6px; font-size: clamp(1.35rem, 2.6vw, 2rem); }
      .decision-gate p { margin: 8px 0 0; }
      .decision-gate ul { margin: 10px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; }
      .decision-gate li { padding: 9px 0; border-top: 1px solid var(--line); color: var(--muted); font-weight: 750; overflow-wrap: anywhere; }
      .metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .metrics span { display: grid; gap: 2px; padding: 10px; border: 1px solid var(--line); border-radius: 8px; color: var(--muted); background: rgba(255,255,255,.75); font-size: .8rem; font-weight: 850; overflow-wrap: anywhere; }
      .metrics b { color: var(--ink); font-size: 1.14rem; }
      .runway { display: grid; gap: 8px; }
      .stage { display: grid; grid-template-columns: 150px minmax(0, 1fr) minmax(220px, .34fr); gap: 12px; align-items: stretch; padding: 14px; border-left: 5px solid var(--amber); }
      .stage.good { border-left-color: var(--green); }
      .stage.bad { border-left-color: var(--red); }
      .stage-state, .stage-action { display: grid; gap: 6px; align-content: start; min-width: 0; }
      .stage-state b, .stage-action a, .stage-copy p, .stage-copy small { overflow-wrap: anywhere; }
      .stage-copy { min-width: 0; display: grid; gap: 6px; }
      .stage-copy p, .stage-copy small { margin: 0; }
      .supporting { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(260px, .8fr); gap: 12px; }
      .owners, .guardrails { padding: 16px; }
      .owners ol, .guardrails ul { margin: 12px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; }
      .owners li, .guardrails li { padding: 10px 0; border-top: 1px solid var(--line); }
      .owners strong, .owners p, .owners small { display: block; margin: 2px 0; overflow-wrap: anywhere; }
      footer { padding-bottom: 26px; color: var(--muted); font-size: .82rem; }
      @media (max-width: 920px) { .hero, .primary, .decision-gate, .stage, .supporting { grid-template-columns: 1fr; } .stamp { min-height: 160px; } }
      @media (max-width: 560px) { header, main, footer { width: min(100% - 22px, 520px); } .hero-copy, .stamp, .primary, .decision-gate, .stage, .owners, .guardrails { padding: 12px; } nav { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; overflow-x: visible; } nav a { min-width: 0; padding: 7px 4px; font-size: .74rem; } .primary a, .stage-action a { width: 100%; } .metrics { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div class="hero-copy">
          <span class="eyebrow">Buyer Acceptance Path</span>
          <h1>${escapeHtml(path.headline)}</h1>
          <p>${escapeHtml(path.summary)}</p>
          <nav>${nav}</nav>
        </div>
        <aside class="stamp">
          <span>${escapeHtml(path.decision)} / ${escapeHtml(`${path.acceptanceMinutes} min review`)}</span>
          <strong>${escapeHtml(`${path.readyCount}/${path.stages.length}`)}</strong>
          <small>${escapeHtml(`${yen(path.firstCommitmentYen)} first commitment / ${path.paybackDays} day payback`)}</small>
        </aside>
      </div>
    </header>
    <main>
      <section class="decision-gate ${decisionGateTone}" aria-label="Acceptance decision gate">
        <div>
          <span>Decision gate</span>
          <h2>Recommended ${escapeHtml(path.decisionGate.recommendedChoice)}, selected ${escapeHtml(path.decisionGate.selectedChoice)}</h2>
          <p>${escapeHtml(path.decisionGate.blockingSummary)}</p>
          <p>${escapeHtml(path.decisionGate.overrideWarning)}</p>
        </div>
        <div>
          <span>Conditions to continue</span>
          <ul>${continueCriteria}</ul>
        </div>
      </section>
      <section class="primary ${tone(path.status)}" aria-label="Acceptance path summary">
        <div>
          <span class="eyebrow">Primary action</span>
          <h2>${escapeHtml(path.primaryAction.label)}</h2>
          <p>${escapeHtml(`${path.primaryAction.owner} owns this by ${path.primaryAction.due}.`)}</p>
          <a href="${escapeHtml(path.primaryAction.href)}">Open primary action</a>
        </div>
        <div class="metrics" aria-label="Acceptance metrics">
          <span><b>${escapeHtml(path.readyCount)}</b> accepted</span>
          <span><b>${escapeHtml(path.reviewCount)}</b> review</span>
          <span><b>${escapeHtml(path.blockedCount)}</b> blocked</span>
        </div>
      </section>
      <section class="runway" aria-label="Acceptance runway">${stages}</section>
      <section class="supporting" aria-label="Acceptance supporting evidence">
        <aside class="owners">
          <span>Owner commitments</span>
          <h2>Who must stand behind the decision</h2>
          <ol>${commitments}</ol>
        </aside>
        <aside class="guardrails">
          <span>Stop rules</span>
          <h2>When approval must pause</h2>
          <ul>${guardrails}</ul>
        </aside>
      </section>
    </main>
    <footer>Path id ${escapeHtml(path.id)}. Receipt ${escapeHtml(path.receipt.receiptId)}. Checksum ${escapeHtml(path.receipt.checksum)}. Buyer ${escapeHtml(path.buyer)}. Expected monthly value ${escapeHtml(yen(path.expectedMonthlyValueYen))}.</footer>
  </body>
</html>`;
}
