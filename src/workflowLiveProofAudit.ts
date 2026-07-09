import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { WorkflowIntakeProofSlot } from "./workflowIntakeShareGate.js";

export const WORKFLOW_LIVE_PROOF_AUDIT_RECEIPT_VERSION = "workflow-live-proof-audit.v1";
export const WORKFLOW_LIVE_PROOF_AUDIT_VERIFY_PATH = "/api/workflow-live-proof-audit/verify";

export type WorkflowLiveProofAuditStatus = "verified" | "action-required" | "not-run";
export type WorkflowLiveProofAuditRowStatus = "pass" | "watch" | "block" | "missing";

export type WorkflowLiveProofAuditRow = {
  id: string;
  label: string;
  url: string;
  status: WorkflowLiveProofAuditRowStatus;
  evidence: string;
  action: string;
};

export type WorkflowLiveProofAuditPayload = {
  receiptVersion: typeof WORKFLOW_LIVE_PROOF_AUDIT_RECEIPT_VERSION;
  status: WorkflowLiveProofAuditStatus;
  headline: string;
  summary: string;
  checkedAt: string;
  score: number;
  verifiedCount: number;
  totalCount: number;
  rows: WorkflowLiveProofAuditRow[];
  nextAction: string;
};

export type WorkflowLiveProofAuditVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type WorkflowLiveProofAuditVerificationRequest = {
  checksum: string;
  payload: WorkflowLiveProofAuditPayload;
};

export type WorkflowLiveProofAudit = {
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  verificationApiPath: typeof WORKFLOW_LIVE_PROOF_AUDIT_VERIFY_PATH;
  payload: WorkflowLiveProofAuditPayload;
  payloadJson: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: WorkflowLiveProofAuditVerification;
  status: WorkflowLiveProofAuditStatus;
  headline: string;
  summary: string;
  checkedAt: string;
  score: number;
  verifiedCount: number;
  totalCount: number;
  rows: WorkflowLiveProofAuditRow[];
  nextAction: string;
  copyText: string;
  exportMarkdown: string;
};

function statusLabel(status: WorkflowLiveProofAuditStatus) {
  if (status === "verified") return "verified";
  if (status === "action-required") return "action-required";
  return "not-run";
}

function buildRows(proofLinks: WorkflowIntakeProofSlot[], proofVerification: BuyerShareGateProofVerificationSummary | null | undefined): WorkflowLiveProofAuditRow[] {
  return proofLinks.map((link) => {
    const result = proofVerification?.results.find((item) => item.id === link.id);
    if (result) {
      return {
        id: link.id,
        label: link.label,
        url: link.value,
        status: result.status,
        evidence: result.evidence,
        action: result.action
      };
    }

    const hasPublicUrl = isBuyerFacingProofUrl(link.value);
    return {
      id: link.id,
      label: link.label,
      url: link.value,
      status: hasPublicUrl ? "watch" : "missing",
      evidence: hasPublicUrl ? "Public HTTPS URL is attached but has not been checked live." : "No buyer-facing HTTPS URL is attached.",
      action: hasPublicUrl ? "Run live verification before sending this proof packet." : `Attach a public URL for ${link.label}.`
    };
  });
}

function headlineFor(status: WorkflowLiveProofAuditStatus) {
  if (status === "verified") return "Live proof audit is buyer-ready";
  if (status === "action-required") return "Live proof audit needs repair";
  return "Live proof audit has not run";
}

function nextActionFor(rows: WorkflowLiveProofAuditRow[], status: WorkflowLiveProofAuditStatus) {
  if (status === "verified") return "Attach this audit receipt to the launch room and recheck before the next buyer review.";
  const firstOpen = rows.find((row) => row.status === "block" || row.status === "missing" || row.status === "watch");
  return firstOpen?.action ?? "Run live verification before external sharing.";
}

function stableAuditHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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

export function workflowLiveProofAuditPayloadJson(payload: WorkflowLiveProofAuditPayload) {
  return canonicalJson(payload);
}

export function workflowLiveProofAuditChecksum(payload: WorkflowLiveProofAuditPayload) {
  return stableAuditHash(workflowLiveProofAuditPayloadJson(payload));
}

export function workflowLiveProofAuditRequestJson(input: WorkflowLiveProofAuditVerificationRequest) {
  return canonicalJson(input);
}

export function verifyWorkflowLiveProofAuditReceipt(input: WorkflowLiveProofAuditVerificationRequest): WorkflowLiveProofAuditVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = workflowLiveProofAuditChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Live proof audit checksum matches the checked proof URLs, verifier results, score, and next action."
      : "Live proof audit checksum does not match the exported proof audit. Re-run preflight before sharing this proof packet."
  };
}

function buildCopyText(input: Omit<WorkflowLiveProofAudit, "copyText" | "exportMarkdown">) {
  return [
    `Live Proof Audit: ${input.headline}`,
    `Receipt: ${input.receiptId}`,
    `Checksum: ${input.checksumAlgorithm}:${input.checksum}`,
    `Verify: POST ${input.verificationApiPath}`,
    `Status: ${statusLabel(input.status)}`,
    `Score: ${input.score}/100`,
    `Checked: ${input.checkedAt || "not run"}`,
    `Verified: ${input.verifiedCount}/${input.totalCount}`,
    "",
    input.summary,
    "",
    "Proof links:",
    ...input.rows.map((row) => `- [${row.status}] ${row.label}: ${row.url || "missing"} - ${row.evidence} Action: ${row.action}`),
    "",
    `Next action: ${input.nextAction}`
  ].join("\n");
}

function buildMarkdown(input: Omit<WorkflowLiveProofAudit, "copyText" | "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    `Receipt: ${input.receiptId}`,
    `Checksum: ${input.checksumAlgorithm}:${input.checksum}`,
    `API verification: POST ${input.verificationApiPath}`,
    `Status: ${statusLabel(input.status)}`,
    `Score: ${input.score}/100`,
    `Checked: ${input.checkedAt || "not run"}`,
    `Verified: ${input.verifiedCount}/${input.totalCount}`,
    "",
    input.summary,
    "",
    "## Proof links",
    ...input.rows.map((row) => `- [${row.status}] ${row.label}: ${row.url || "missing"} - ${row.evidence} Action: ${row.action}`),
    "",
    "## Next action",
    input.nextAction
  ].join("\n");
}

export function buildWorkflowLiveProofAudit(input: {
  proofLinks: WorkflowIntakeProofSlot[];
  proofVerification?: BuyerShareGateProofVerificationSummary | null;
  proofVerifyError?: string;
}): WorkflowLiveProofAudit {
  const rows = buildRows(input.proofLinks, input.proofVerification);
  const proofVerification = input.proofVerification ?? null;
  const failedRows = rows.filter((row) => row.status === "block" || row.status === "missing").length;
  const watchedRows = rows.filter((row) => row.status === "watch").length;
  const status: WorkflowLiveProofAuditStatus = proofVerification
    ? failedRows > 0 || watchedRows > 0 || proofVerification.verifiedCount < input.proofLinks.length
      ? "action-required"
      : "verified"
    : "not-run";
  const verifiedCount = proofVerification?.verifiedCount ?? 0;
  const totalCount = proofVerification?.totalCount ?? input.proofLinks.length;
  const openCount = failedRows + watchedRows;
  const summary = proofVerification
    ? `${verifiedCount}/${totalCount} proof links responded live. ${openCount > 0 ? `${openCount} link${openCount === 1 ? "" : "s"} still ${openCount === 1 ? "needs" : "need"} repair.` : "All launch proof links are reachable for external review."}`
    : input.proofVerifyError
      ? `Live proof verification failed before an audit receipt could be issued: ${input.proofVerifyError}`
      : "Run live verification to issue a timestamped audit receipt for these proof links.";
  const payload: WorkflowLiveProofAuditPayload = {
    receiptVersion: WORKFLOW_LIVE_PROOF_AUDIT_RECEIPT_VERSION,
    status,
    headline: headlineFor(status),
    summary,
    checkedAt: proofVerification?.checkedAt ?? "",
    score: proofVerification?.score ?? 0,
    verifiedCount,
    totalCount,
    rows,
    nextAction: nextActionFor(rows, status)
  };
  const checksum = workflowLiveProofAuditChecksum(payload);
  const verificationRequest = { checksum, payload };
  const verificationRequestJson = workflowLiveProofAuditRequestJson(verificationRequest);
  const verification = verifyWorkflowLiveProofAuditReceipt(verificationRequest);
  const partial: Omit<WorkflowLiveProofAudit, "copyText" | "exportMarkdown"> = {
    receiptId: `workflow-live-proof-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32",
    checksum,
    verificationApiPath: WORKFLOW_LIVE_PROOF_AUDIT_VERIFY_PATH,
    payload,
    payloadJson: workflowLiveProofAuditPayloadJson(payload),
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification,
    status,
    headline: headlineFor(status),
    summary,
    checkedAt: proofVerification?.checkedAt ?? "",
    score: proofVerification?.score ?? 0,
    verifiedCount,
    totalCount,
    rows,
    nextAction: payload.nextAction
  };

  return {
    ...partial,
    copyText: buildCopyText(partial),
    exportMarkdown: buildMarkdown(partial)
  };
}
