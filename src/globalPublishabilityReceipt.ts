import type {
  GlobalPublishabilityGate,
  GlobalPublishabilityHandoffMemo,
  GlobalPublishabilityLaunchPacket,
  GlobalPublishabilityLaunchPacketItem,
  GlobalPublishabilityLink,
  GlobalPublishabilityRepairTicket,
  GlobalPublishabilityReport,
  GlobalPublishabilityReviewerBrief,
  GlobalPublishabilityValueRouteStep
} from "./globalPublishabilityReport.js";
import type { GlobalProofDossierLinkCheck } from "./globalProofDossier.js";

export const GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH = "/api/global-publishability/receipt/verify";

export type GlobalPublishabilityReceiptPayload = {
  receiptVersion: "global-publishability.v1";
  reportId: string;
  generatedAt: string;
  decision: GlobalPublishabilityReport["decision"];
  status: GlobalPublishabilityReport["status"];
  publishabilityScore: number;
  targetBuyer: string;
  verifiedSummary: string;
  recommendedDecision: GlobalPublishabilityReviewerBrief["recommendedDecision"];
  primaryAction: GlobalPublishabilityReport["primaryAction"];
  gates: Array<Pick<GlobalPublishabilityGate, "id" | "label" | "status" | "score" | "action" | "href">>;
  valueRoute: Array<Pick<GlobalPublishabilityValueRouteStep, "id" | "label" | "status" | "score" | "href">>;
  repairs: Array<Pick<GlobalPublishabilityReport["repairLedger"][number], "id" | "priority" | "owner" | "label" | "action" | "href">>;
  repairTickets: Array<
    Pick<GlobalPublishabilityRepairTicket, "id" | "sourceItemId" | "status" | "priority" | "owner" | "title" | "command" | "proofToAttach" | "acceptanceCriteria" | "recheck" | "receiptGuard">
  >;
  repairRunbook: Pick<
    GlobalPublishabilityReport["repairRunbook"],
    | "mode"
    | "status"
    | "headline"
    | "externalShareLocked"
    | "currentOwner"
    | "currentCommand"
    | "verificationCommand"
    | "shareRule"
    | "stepCount"
    | "nowCount"
    | "nextCount"
    | "verifyCount"
  > & {
    steps: Array<
      Pick<
        GlobalPublishabilityReport["repairRunbook"]["steps"][number],
        | "id"
        | "ticketId"
        | "sequence"
        | "status"
        | "priority"
        | "owner"
        | "title"
        | "inputHref"
        | "proofSlot"
        | "proofRequirements"
        | "acceptanceSignal"
        | "recheckSignal"
        | "shareGate"
      >
    >;
  };
  proofLinks: Array<Pick<GlobalProofDossierLinkCheck, "id" | "label" | "url" | "status" | "httpStatus" | "evidence" | "action">>;
  launchPacket: Pick<
    GlobalPublishabilityLaunchPacket,
    "status" | "headline" | "currentOwner" | "currentCommand" | "publishRule" | "escalationRule" | "blockedCount" | "watchCount" | "itemCount" | "additionalItemCount"
  > & {
    items: Array<Pick<GlobalPublishabilityLaunchPacketItem, "id" | "status" | "priority" | "owner" | "label" | "command" | "proofToAttach" | "doneSignal" | "href">>;
  };
  handoffMemo: Pick<GlobalPublishabilityHandoffMemo, "audience" | "subject" | "requestedDecision" | "noSendWarning"> & {
    proofLinks: Array<Pick<GlobalPublishabilityLink, "id" | "label" | "href">>;
  };
};

export type GlobalPublishabilityReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type GlobalPublishabilityReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH;
  payload: GlobalPublishabilityReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: GlobalPublishabilityReceiptVerification;
  copyText: string;
  href: string;
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

function stableDigest(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function verifyGlobalPublishabilityReceipt(
  receipt: Pick<GlobalPublishabilityReceipt, "checksum" | "payload">
): GlobalPublishabilityReceiptVerification {
  const actualChecksum = stableDigest(receipt.payload);
  const verified = actualChecksum === receipt.checksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum: receipt.checksum,
    actualChecksum,
    instruction: verified
      ? "Global publishability receipt checksum matches the attached replay payload."
      : "Global publishability receipt checksum does not match the attached replay payload. Do not accept this public-readiness decision until the report is re-exported."
  };
}

function buildReceiptMarkdown(receipt: Omit<GlobalPublishabilityReceipt, "copyText" | "href">) {
  return [
    "# Global publishability receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Decision: ${receipt.payload.decision}`,
    `Publishability score: ${receipt.payload.publishabilityScore}/100`,
    `Target buyer: ${receipt.payload.targetBuyer}`,
    `Recommended decision: ${receipt.payload.recommendedDecision}`,
    `Verified summary: ${receipt.payload.verifiedSummary}`,
    "",
    "## Replay payload",
    "```json",
    receipt.payloadJson,
    "```",
    "",
    "## Verification",
    `- Status: ${receipt.verification.status}`,
    `- Expected checksum: ${receipt.verification.expectedChecksum}`,
    `- Actual checksum: ${receipt.verification.actualChecksum}`,
    `- Instruction: ${receipt.verification.instruction}`,
    "",
    "## API verification",
    `POST ${receipt.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    receipt.verificationRequestJson,
    "```",
    "",
    "Replay rule: Recompute fnv1a-64 over the global publishability replay payload before accepting a forwarded public-readiness decision."
  ].join("\n");
}

export function buildGlobalPublishabilityReceipt(
  report: Omit<GlobalPublishabilityReport, "exportMarkdown" | "receipt">
): GlobalPublishabilityReceipt {
  const payload: GlobalPublishabilityReceiptPayload = {
    receiptVersion: "global-publishability.v1",
    reportId: report.id,
    generatedAt: report.generatedAt,
    decision: report.decision,
    status: report.status,
    publishabilityScore: report.publishabilityScore,
    targetBuyer: report.targetBuyer,
    verifiedSummary: report.verifiedSummary,
    recommendedDecision: report.reviewerBrief.recommendedDecision,
    primaryAction: report.primaryAction,
    gates: report.gates.map((gate) => ({
      id: gate.id,
      label: gate.label,
      status: gate.status,
      score: gate.score,
      action: gate.action,
      href: gate.href
    })),
    valueRoute: report.valueRoute.map((step) => ({
      id: step.id,
      label: step.label,
      status: step.status,
      score: step.score,
      href: step.href
    })),
    repairs: report.repairLedger.map((repair) => ({
      id: repair.id,
      priority: repair.priority,
      owner: repair.owner,
      label: repair.label,
      action: repair.action,
      href: repair.href
    })),
    repairTickets: report.repairTickets.map((ticket) => ({
      id: ticket.id,
      sourceItemId: ticket.sourceItemId,
      status: ticket.status,
      priority: ticket.priority,
      owner: ticket.owner,
      title: ticket.title,
      command: ticket.command,
      proofToAttach: ticket.proofToAttach,
      acceptanceCriteria: ticket.acceptanceCriteria,
      recheck: ticket.recheck,
      receiptGuard: ticket.receiptGuard
    })),
    repairRunbook: {
      mode: report.repairRunbook.mode,
      status: report.repairRunbook.status,
      headline: report.repairRunbook.headline,
      externalShareLocked: report.repairRunbook.externalShareLocked,
      currentOwner: report.repairRunbook.currentOwner,
      currentCommand: report.repairRunbook.currentCommand,
      verificationCommand: report.repairRunbook.verificationCommand,
      shareRule: report.repairRunbook.shareRule,
      stepCount: report.repairRunbook.stepCount,
      nowCount: report.repairRunbook.nowCount,
      nextCount: report.repairRunbook.nextCount,
      verifyCount: report.repairRunbook.verifyCount,
      steps: report.repairRunbook.steps.map((step) => ({
        id: step.id,
        ticketId: step.ticketId,
        sequence: step.sequence,
        status: step.status,
        priority: step.priority,
        owner: step.owner,
        title: step.title,
        inputHref: step.inputHref,
        proofSlot: step.proofSlot,
        proofRequirements: step.proofRequirements,
        acceptanceSignal: step.acceptanceSignal,
        recheckSignal: step.recheckSignal,
        shareGate: step.shareGate
      }))
    },
    proofLinks: report.proofLinks.map((link) => ({
      id: link.id,
      label: link.label,
      url: link.url,
      status: link.status,
      httpStatus: link.httpStatus,
      evidence: link.evidence,
      action: link.action
    })),
    launchPacket: {
      status: report.launchPacket.status,
      headline: report.launchPacket.headline,
      currentOwner: report.launchPacket.currentOwner,
      currentCommand: report.launchPacket.currentCommand,
      publishRule: report.launchPacket.publishRule,
      escalationRule: report.launchPacket.escalationRule,
      blockedCount: report.launchPacket.blockedCount,
      watchCount: report.launchPacket.watchCount,
      itemCount: report.launchPacket.itemCount,
      additionalItemCount: report.launchPacket.additionalItemCount,
      items: report.launchPacket.items.map((item) => ({
        id: item.id,
        status: item.status,
        priority: item.priority,
        owner: item.owner,
        label: item.label,
        command: item.command,
        proofToAttach: item.proofToAttach,
        doneSignal: item.doneSignal,
        href: item.href
      }))
    },
    handoffMemo: {
      audience: report.handoffMemo.audience,
      subject: report.handoffMemo.subject,
      requestedDecision: report.handoffMemo.requestedDecision,
      noSendWarning: report.handoffMemo.noSendWarning,
      proofLinks: report.handoffMemo.proofLinks.map((link) => ({
        id: link.id,
        label: link.label,
        href: link.href
      }))
    }
  };
  const checksum = stableDigest(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyGlobalPublishabilityReceipt({ checksum, payload });
  const partial: Omit<GlobalPublishabilityReceipt, "copyText" | "href"> = {
    receiptId: `global-publishability-${payload.decision}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };
  const copyText = buildReceiptMarkdown(partial);

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}
