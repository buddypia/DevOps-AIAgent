import { z } from "zod";
import type { GlobalPublishabilityReceiptPayload } from "../src/globalPublishabilityReceipt.js";
import {
  GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_PATH,
  GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERSION,
  buildGlobalPublishabilityReviewResponseReceipt,
  type GlobalPublishabilityReviewResponseChoice,
  type GlobalPublishabilityReviewResponseOutcome,
  type GlobalPublishabilityReviewResponseProofId,
  type GlobalPublishabilityReviewResponseReceipt,
  type GlobalPublishabilityReviewResponseStatus
} from "../src/globalPublishabilityReviewResponseReceipt.js";
import { verifyGlobalPublishabilityReceiptRequest } from "./globalPublishabilityReceiptVerifier.js";

export { GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_PATH };

export type GlobalPublishabilityReviewResponseBody = {
  skill: "global-publishability.review-response";
  status: GlobalPublishabilityReviewResponseStatus;
  outcome: GlobalPublishabilityReviewResponseOutcome;
  reportId: string;
  targetBuyer: string;
  reviewerName: string;
  reviewerChoice: GlobalPublishabilityReviewResponseChoice;
  responseSummary: string;
  nextAction: string;
  checkedProofCount: number;
  requiredProofCount: number;
  missingProofIds: GlobalPublishabilityReviewResponseProofId[];
  blockedProofIds: GlobalPublishabilityReviewResponseProofId[];
  watchProofIds: GlobalPublishabilityReviewResponseProofId[];
  sourceReceiptChecksum: string;
  receipt: GlobalPublishabilityReviewResponseReceipt;
  copyText: string;
  href: string;
};

export type GlobalPublishabilityReviewResponseResult = {
  statusCode: number;
  body:
    | GlobalPublishabilityReviewResponseBody
    | {
        error: string;
        issues?: unknown;
      };
};

const ReviewChoiceSchema = z.enum(["approve-bounded-pilot", "sponsor-review", "hold-public-launch"]);
const ProofIdSchema = z.enum(["buyer-value", "measured-proof", "public-proof", "buyer-decision"]);

const ReviewResponseRequestSchema = z.object({
  verificationRequest: z.unknown(),
  reviewerName: z.string().trim().min(1).max(180),
  reviewerRole: z.string().trim().max(180).optional(),
  reviewerChoice: ReviewChoiceSchema,
  reviewerNote: z.string().trim().max(1600).optional(),
  checkedProofIds: z.array(ProofIdSchema).max(4).optional()
});

function payloadFromVerificationRequest(input: unknown): GlobalPublishabilityReceiptPayload | null {
  if (!input || typeof input !== "object") return null;
  const payload = (input as { payload?: unknown }).payload;
  if (!payload || typeof payload !== "object") return null;
  return payload as GlobalPublishabilityReceiptPayload;
}

function checksumFromVerificationRequest(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const checksum = (input as { checksum?: unknown }).checksum;
  return typeof checksum === "string" ? checksum.toLowerCase() : null;
}

function uniqueProofIds(ids: GlobalPublishabilityReviewResponseProofId[]) {
  return Array.from(new Set(ids));
}

function responseStatusFor(input: {
  choice: GlobalPublishabilityReviewResponseChoice;
  payload: GlobalPublishabilityReceiptPayload;
  missingProofIds: GlobalPublishabilityReviewResponseProofId[];
  blockedProofIds: GlobalPublishabilityReviewResponseProofId[];
  watchProofIds: GlobalPublishabilityReviewResponseProofId[];
}): GlobalPublishabilityReviewResponseStatus {
  if (input.choice === "hold-public-launch" || input.blockedProofIds.length > 0 || input.payload.decision === "do-not-publish") return "blocked";
  if (
    input.choice === "approve-bounded-pilot" &&
    input.payload.decision === "publish" &&
    input.payload.status === "pass" &&
    input.missingProofIds.length === 0 &&
    input.watchProofIds.length === 0
  ) {
    return "accepted";
  }
  return "review";
}

function outcomeFor(status: GlobalPublishabilityReviewResponseStatus, choice: GlobalPublishabilityReviewResponseChoice): GlobalPublishabilityReviewResponseOutcome {
  if (status === "accepted" && choice === "approve-bounded-pilot") return "pilot-approved";
  if (status === "blocked") return "no-send";
  return "owner-follow-up";
}

function ownerFor(input: { outcome: GlobalPublishabilityReviewResponseOutcome; payload: GlobalPublishabilityReceiptPayload }) {
  if (input.outcome === "pilot-approved") return "Sponsor owner";
  return input.payload.repairs[0]?.owner ?? input.payload.launchPacket.currentOwner ?? "Launch owner";
}

function summaryFor(input: {
  reviewerName: string;
  choice: GlobalPublishabilityReviewResponseChoice;
  status: GlobalPublishabilityReviewResponseStatus;
  outcome: GlobalPublishabilityReviewResponseOutcome;
  checkedProofCount: number;
  requiredProofCount: number;
  targetBuyer: string;
}) {
  if (input.outcome === "pilot-approved") {
    return `${input.reviewerName} approved a bounded pilot for ${input.targetBuyer} after checking ${input.checkedProofCount}/${input.requiredProofCount} value-route proof items.`;
  }
  if (input.status === "blocked") {
    return `${input.reviewerName} held public launch for ${input.targetBuyer}; the response is recorded as ${input.choice}.`;
  }
  return `${input.reviewerName} requested owner follow-up for ${input.targetBuyer}; the response is recorded as ${input.choice}.`;
}

function nextActionFor(input: {
  outcome: GlobalPublishabilityReviewResponseOutcome;
  owner: string;
  payload: GlobalPublishabilityReceiptPayload;
  missingProofIds: GlobalPublishabilityReviewResponseProofId[];
  blockedProofIds: GlobalPublishabilityReviewResponseProofId[];
  watchProofIds: GlobalPublishabilityReviewResponseProofId[];
}) {
  if (input.outcome === "pilot-approved") {
    return `Send the bounded pilot approval request with this review-response receipt and the source publishability receipt attached.`;
  }
  const firstRepair = input.payload.repairs[0];
  const proofIssue = [...input.blockedProofIds, ...input.missingProofIds, ...input.watchProofIds][0];
  if (input.outcome === "no-send") {
    return firstRepair
      ? `${input.owner} must repair ${firstRepair.label}, rerun the publishability report, and collect a new review response before external sharing.`
      : `${input.owner} must repair ${proofIssue ?? "the blocked proof route"}, rerun the publishability report, and collect a new review response before external sharing.`;
  }
  if (input.missingProofIds.length > 0) {
    return `${input.owner} must ask the reviewer to inspect ${input.missingProofIds.join(", ")} or attach a replacement proof before approval.`;
  }
  if (firstRepair) return `${input.owner} must close ${firstRepair.label} or explicitly accept the watch item before buyer sharing.`;
  return `${input.owner} must resolve the reviewer note, then replay both receipts before buyer sharing.`;
}

export function runGlobalPublishabilityReviewResponse(
  input: unknown,
  deps: {
    now?: Date;
  } = {}
): GlobalPublishabilityReviewResponseResult {
  const parsed = ReviewResponseRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const sourceVerification = verifyGlobalPublishabilityReceiptRequest(parsed.data.verificationRequest);
  if (sourceVerification.statusCode !== 200) {
    return {
      statusCode: 422,
      body: {
        error: "source_receipt_not_verified",
        issues: sourceVerification.body
      }
    };
  }

  const payload = payloadFromVerificationRequest(parsed.data.verificationRequest);
  const sourceReceiptChecksum = checksumFromVerificationRequest(parsed.data.verificationRequest);
  if (!payload || !sourceReceiptChecksum) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_verification_request"
      }
    };
  }

  const requiredProofIds = payload.valueRoute.map((step) => step.id) as GlobalPublishabilityReviewResponseProofId[];
  const checkedProofIds = uniqueProofIds((parsed.data.checkedProofIds ?? []) as GlobalPublishabilityReviewResponseProofId[]);
  const checkedSet = new Set(checkedProofIds);
  const missingProofIds = requiredProofIds.filter((id) => !checkedSet.has(id));
  const blockedProofIds = payload.valueRoute.filter((step) => step.status === "block").map((step) => step.id) as GlobalPublishabilityReviewResponseProofId[];
  const watchProofIds = payload.valueRoute.filter((step) => step.status === "watch").map((step) => step.id) as GlobalPublishabilityReviewResponseProofId[];
  const status = responseStatusFor({
    choice: parsed.data.reviewerChoice,
    payload,
    missingProofIds,
    blockedProofIds,
    watchProofIds
  });
  const outcome = outcomeFor(status, parsed.data.reviewerChoice);
  const owner = ownerFor({ outcome, payload });
  const responseSummary = summaryFor({
    reviewerName: parsed.data.reviewerName,
    choice: parsed.data.reviewerChoice,
    status,
    outcome,
    checkedProofCount: checkedProofIds.length,
    requiredProofCount: requiredProofIds.length,
    targetBuyer: payload.targetBuyer
  });
  const nextAction = nextActionFor({
    outcome,
    owner,
    payload,
    missingProofIds,
    blockedProofIds,
    watchProofIds
  });
  const receipt = buildGlobalPublishabilityReviewResponseReceipt({
    receiptVersion: GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERSION,
    reportId: payload.reportId,
    sourceReceiptChecksum,
    sourceDecision: payload.decision,
    sourceStatus: payload.status,
    sourceRecommendedDecision: payload.recommendedDecision,
    sourcePublishabilityScore: payload.publishabilityScore,
    targetBuyer: payload.targetBuyer,
    reviewerName: parsed.data.reviewerName,
    reviewerRole: parsed.data.reviewerRole?.trim() || "External reviewer",
    reviewerChoice: parsed.data.reviewerChoice,
    reviewerNote: parsed.data.reviewerNote?.trim() || "No reviewer note supplied.",
    reviewedAt: (deps.now ?? new Date()).toISOString(),
    checkedProofIds,
    requiredProofIds,
    missingProofIds,
    blockedProofIds,
    watchProofIds,
    status,
    outcome,
    owner,
    responseSummary,
    nextAction,
    proofSnapshot: {
      passCount: payload.valueRoute.filter((step) => step.status === "pass").length,
      watchCount: watchProofIds.length,
      blockCount: blockedProofIds.length,
      totalCount: payload.valueRoute.length
    }
  });

  return {
    statusCode: 200,
    body: {
      skill: "global-publishability.review-response",
      status,
      outcome,
      reportId: payload.reportId,
      targetBuyer: payload.targetBuyer,
      reviewerName: parsed.data.reviewerName,
      reviewerChoice: parsed.data.reviewerChoice,
      responseSummary,
      nextAction,
      checkedProofCount: checkedProofIds.length,
      requiredProofCount: requiredProofIds.length,
      missingProofIds,
      blockedProofIds,
      watchProofIds,
      sourceReceiptChecksum,
      receipt,
      copyText: receipt.copyText,
      href: receipt.href
    }
  };
}
