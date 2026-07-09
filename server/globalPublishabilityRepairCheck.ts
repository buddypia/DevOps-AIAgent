import { z } from "zod";
import type { GlobalPublishabilityReceiptPayload } from "../src/globalPublishabilityReceipt.js";
import { GLOBAL_PUBLISHABILITY_REPAIR_CHECK_PATH } from "../src/globalPublishabilityReport.js";
import {
  GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERSION,
  buildGlobalPublishabilityRepairCheckReceipt,
  type GlobalPublishabilityRepairCheckDecision,
  type GlobalPublishabilityRepairCheckReceipt,
  type GlobalPublishabilityRepairCheckStatus
} from "./globalPublishabilityRepairCheckReceipt.js";
import {
  verifyPublicProofLinks,
  type PublicProofLinkInput,
  type PublicProofLinkVerificationSummary
} from "./proofLinkVerifier.js";
import { verifyGlobalPublishabilityReceiptRequest } from "./globalPublishabilityReceiptVerifier.js";

export { GLOBAL_PUBLISHABILITY_REPAIR_CHECK_PATH };

export type GlobalPublishabilityRepairCheckBody = {
  skill: "global-publishability.repair-check";
  status: GlobalPublishabilityRepairCheckStatus;
  decision: GlobalPublishabilityRepairCheckDecision;
  reportId: string;
  receiptDecision: GlobalPublishabilityReceiptPayload["decision"];
  receiptChecksum: string;
  checkedAt: string;
  summary: string;
  nextAction: string;
  requiredProofCount: number;
  suppliedProofCount: number;
  missingProofCount: number;
  verifiedCount: number;
  watchCount: number;
  blockedCount: number;
  score: number;
  step: Pick<
    RepairCheckStep,
    "id" | "ticketId" | "sequence" | "priority" | "status" | "owner" | "title" | "proofSlot" | "proofRequirements" | "acceptanceSignal" | "recheckSignal" | "shareGate"
  >;
  proofSummary: PublicProofLinkVerificationSummary;
  checksum: string;
  receipt: GlobalPublishabilityRepairCheckReceipt;
  copyText: string;
  href: string;
};

export type GlobalPublishabilityRepairCheckResult = {
  statusCode: number;
  body:
    | GlobalPublishabilityRepairCheckBody
    | {
        error: string;
        issues?: unknown;
      };
};

type VerifyLinks = (links: PublicProofLinkInput[]) => Promise<PublicProofLinkVerificationSummary>;
type RepairCheckStep = GlobalPublishabilityReceiptPayload["repairRunbook"]["steps"][number];

const RepairProofUrlSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(220),
  value: z.string().trim().max(1000)
});

const RepairCheckRequestSchema = z.object({
  verificationRequest: z.unknown(),
  stepId: z.string().trim().min(1).max(280),
  proofUrls: z.array(RepairProofUrlSchema).max(5)
});

function requiredProofRequirements(step: RepairCheckStep) {
  return step.proofRequirements.filter((requirement) => requirement.required);
}

function proofUrlsForStep(step: RepairCheckStep, proofUrls: PublicProofLinkInput[]) {
  const suppliedById = new Map(proofUrls.map((link) => [link.id, link.value.trim()]));
  return step.proofRequirements
    .map((requirement) => {
      const value = suppliedById.get(requirement.id) ?? "";
      return value
        ? {
            id: requirement.id,
            label: requirement.label,
            value
          }
        : null;
    })
    .filter((link): link is PublicProofLinkInput => Boolean(link));
}

function missingRequiredProofCount(step: RepairCheckStep, proofUrls: PublicProofLinkInput[]) {
  const suppliedById = new Map(proofUrls.map((link) => [link.id, link.value.trim()]));
  return requiredProofRequirements(step).filter((requirement) => !suppliedById.get(requirement.id)).length;
}

function statusFromCheck(input: { missingProofCount: number; blockedCount: number; watchCount: number }): GlobalPublishabilityRepairCheckStatus {
  if (input.missingProofCount > 0 || input.blockedCount > 0) return "blocked";
  if (input.watchCount > 0) return "needs-review";
  return "ready-to-rerun";
}

function decisionFromStatus(status: GlobalPublishabilityRepairCheckStatus): GlobalPublishabilityRepairCheckDecision {
  if (status === "ready-to-rerun") return "rerun-publishability";
  if (status === "needs-review") return "sponsor-review";
  return "no-send";
}

function summaryFor(input: {
  status: GlobalPublishabilityRepairCheckStatus;
  step: RepairCheckStep;
  verifiedCount: number;
  suppliedProofCount: number;
  requiredProofCount: number;
  missingProofCount: number;
  blockedCount: number;
  watchCount: number;
}) {
  if (input.status === "ready-to-rerun") {
    return `${input.step.title} has ${input.verifiedCount}/${input.requiredProofCount} required proof URLs verified. Rerun the global publishability report before closing the ticket.`;
  }
  if (input.missingProofCount > 0) {
    return `${input.step.title} still needs ${input.missingProofCount} more public proof URL${input.missingProofCount === 1 ? "" : "s"} for this proof slot.`;
  }
  if (input.blockedCount > 0) {
    return `${input.step.title} still has ${input.blockedCount} blocked proof URL${input.blockedCount === 1 ? "" : "s"}.`;
  }
  return `${input.step.title} has ${input.watchCount} proof URL${input.watchCount === 1 ? "" : "s"} that need sponsor review before buyer sharing.`;
}

function nextActionFor(status: GlobalPublishabilityRepairCheckStatus, step: RepairCheckStep) {
  if (status === "ready-to-rerun") return `Rerun ${step.recheckSignal}, then replay the publishability receipt before closing ${step.ticketId}.`;
  if (status === "needs-review") return `Keep external sharing internal; ${step.owner} should accept or replace the watch proof before rerunning the report.`;
  return `Do not send externally. Attach the missing public proof for ${step.proofSlot}, then check this repair again.`;
}

function buildMarkdown(check: Omit<GlobalPublishabilityRepairCheckBody, "copyText" | "href">) {
  return [
    "# Global publishability repair proof check",
    "",
    `Status: ${check.status}`,
    `Decision: ${check.decision}`,
    `Report: ${check.reportId}`,
    `Receipt checksum: ${check.receiptChecksum}`,
    `Repair check checksum: ${check.checksum}`,
    `Repair check receipt: ${check.receipt.receiptId}`,
    `Repair check verifier: POST ${check.receipt.verificationApiPath}`,
    `Checked at: ${check.checkedAt}`,
    "",
    `Step: ${check.step.sequence}. ${check.step.title}`,
    `Ticket: ${check.step.ticketId}`,
    `Owner: ${check.step.owner}`,
    `Proof slot: ${check.step.proofSlot}`,
    `Acceptance signal: ${check.step.acceptanceSignal}`,
    `Share gate: ${check.step.shareGate}`,
    "",
    check.summary,
    check.nextAction,
    "",
    "## Proof URL checks",
    ...check.proofSummary.results.map((result) => `- [${result.status}] ${result.label}: ${result.url || "missing"} - ${result.evidence}`)
  ].join("\n");
}

function payloadFromVerificationRequest(input: unknown): GlobalPublishabilityReceiptPayload | null {
  if (!input || typeof input !== "object") return null;
  const payload = (input as { payload?: unknown }).payload;
  if (!payload || typeof payload !== "object") return null;
  return payload as GlobalPublishabilityReceiptPayload;
}

export async function runGlobalPublishabilityRepairCheck(
  input: unknown,
  deps: {
    verifyLinks?: VerifyLinks;
    now?: Date;
  } = {}
): Promise<GlobalPublishabilityRepairCheckResult> {
  const parsed = RepairCheckRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const receiptVerification = verifyGlobalPublishabilityReceiptRequest(parsed.data.verificationRequest);
  if (receiptVerification.statusCode !== 200) {
    return {
      statusCode: 422,
      body: {
        error: "receipt_not_verified",
        issues: receiptVerification.body
      }
    };
  }

  const payload = payloadFromVerificationRequest(parsed.data.verificationRequest);
  const checksum = (parsed.data.verificationRequest as { checksum?: unknown }).checksum;
  if (!payload || typeof checksum !== "string") {
    return {
      statusCode: 400,
      body: {
        error: "invalid_verification_request"
      }
    };
  }

  const step = payload.repairRunbook.steps.find((candidate) => candidate.id === parsed.data.stepId || candidate.ticketId === parsed.data.stepId);
  if (!step) {
    return {
      statusCode: 404,
      body: {
        error: "runbook_step_not_found"
      }
    };
  }

  const proofUrls = parsed.data.proofUrls.filter((link) => link.value.trim());
  const stepProofUrls = proofUrlsForStep(step, proofUrls);
  const verifyLinks = deps.verifyLinks ?? verifyPublicProofLinks;
  const proofSummary = await verifyLinks(stepProofUrls);
  const requiredProofCount = requiredProofRequirements(step).length;
  const suppliedProofCount = stepProofUrls.length;
  const missingProofCount = missingRequiredProofCount(step, proofUrls);
  const blockedCount = proofSummary.results.filter((result) => result.status === "block").length;
  const watchCount = proofSummary.results.filter((result) => result.status === "watch").length;
  const verifiedCount = proofSummary.results.filter((result) => result.status === "pass").length;
  const status = statusFromCheck({ missingProofCount, blockedCount, watchCount });
  const decision = decisionFromStatus(status);
  const checkedAt = (deps.now ?? new Date()).toISOString();
  const summary = summaryFor({
    status,
    step,
    verifiedCount,
    suppliedProofCount,
    requiredProofCount,
    missingProofCount,
    blockedCount,
    watchCount
  });
  const nextAction = nextActionFor(status, step);
  const receipt = buildGlobalPublishabilityRepairCheckReceipt({
    receiptVersion: GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERSION,
    reportId: payload.reportId,
    sourceReceiptDecision: payload.decision,
    sourceReceiptChecksum: checksum.toLowerCase(),
    checkedAt,
    status,
    decision,
    summary,
    nextAction,
    requiredProofCount,
    suppliedProofCount,
    missingProofCount,
    verifiedCount,
    watchCount,
    blockedCount,
    score: proofSummary.score,
    step: {
      id: step.id,
      ticketId: step.ticketId,
      sequence: step.sequence,
      priority: step.priority,
      status: step.status,
      owner: step.owner,
      title: step.title,
      proofSlot: step.proofSlot,
      proofRequirements: step.proofRequirements,
      acceptanceSignal: step.acceptanceSignal,
      recheckSignal: step.recheckSignal,
      shareGate: step.shareGate
    },
    proofSummary: {
      checkedAt: proofSummary.checkedAt,
      verifiedCount: proofSummary.verifiedCount,
      totalCount: proofSummary.totalCount,
      score: proofSummary.score
    },
    proofResults: proofSummary.results
  });
  const base: Omit<GlobalPublishabilityRepairCheckBody, "copyText" | "href"> = {
    skill: "global-publishability.repair-check",
    status,
    decision,
    reportId: payload.reportId,
    receiptDecision: payload.decision,
    receiptChecksum: checksum.toLowerCase(),
    checkedAt,
    summary,
    nextAction,
    requiredProofCount,
    suppliedProofCount,
    missingProofCount,
    verifiedCount,
    watchCount,
    blockedCount,
    score: proofSummary.score,
    step,
    proofSummary,
    checksum: receipt.checksum,
    receipt
  };
  const copyText = buildMarkdown(base);

  return {
    statusCode: 200,
    body: {
      ...base,
      copyText,
      href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
    }
  };
}
