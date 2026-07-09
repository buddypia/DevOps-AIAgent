import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";
import type { CloseoutFinalSubmitHandoff } from "./submissionCloseout.js";

export const SUBMISSION_FINAL_SUBMIT_RECEIPT_VERSION = "submission-final-submit-live-receipt.v1";
export const SUBMISSION_FINAL_SUBMIT_RECEIPT_VERIFY_PATH = "/api/submission-final-submit/receipt/verify";

export type SubmissionFinalSubmitReceiptStatus = "submit-ready" | "action-required";
export type SubmissionFinalSubmitReceiptRowStatus = "pass" | "watch" | "block" | "missing";

export type SubmissionFinalSubmitReceiptRow = {
  id: string;
  label: string;
  url: string;
  status: SubmissionFinalSubmitReceiptRowStatus;
  httpStatus?: number;
  evidence: string;
  action: string;
};

export type SubmissionFinalSubmitReceiptPayload = {
  receiptVersion: typeof SUBMISSION_FINAL_SUBMIT_RECEIPT_VERSION;
  status: SubmissionFinalSubmitReceiptStatus;
  headline: string;
  summary: string;
  checkedAt: string;
  score: number;
  deadline: string;
  readyFieldCount: number;
  totalFieldCount: number;
  openFieldCount: number;
  invalidFieldCount: number;
  verifiedCount: number;
  totalCount: number;
  blockedCount: number;
  watchCount: number;
  rows: SubmissionFinalSubmitReceiptRow[];
  nextAction: string;
};

export type SubmissionFinalSubmitReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type SubmissionFinalSubmitReceiptVerificationRequest = {
  checksum: string;
  payload: SubmissionFinalSubmitReceiptPayload;
};

export type SubmissionFinalSubmitReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  verificationApiPath: typeof SUBMISSION_FINAL_SUBMIT_RECEIPT_VERIFY_PATH;
  payload: SubmissionFinalSubmitReceiptPayload;
  payloadJson: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: SubmissionFinalSubmitReceiptVerification;
  status: SubmissionFinalSubmitReceiptStatus;
  headline: string;
  summary: string;
  checkedAt: string;
  score: number;
  verifiedCount: number;
  totalCount: number;
  blockedCount: number;
  watchCount: number;
  nextAction: string;
  copyText: string;
  exportMarkdown: string;
};

function stableReceiptHash(value: string) {
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

function buildRows(
  handoff: Pick<CloseoutFinalSubmitHandoff, "liveProofLinks">,
  liveProof: BuyerShareGateProofVerificationSummary
): SubmissionFinalSubmitReceiptRow[] {
  return handoff.liveProofLinks.map((link) => {
    const result = liveProof.results.find((item) => item.id === link.id);
    if (result) {
      return {
        id: link.id,
        label: link.label,
        url: link.value,
        status: result.status,
        httpStatus: result.httpStatus,
        evidence: result.evidence,
        action: result.action
      };
    }

    return {
      id: link.id,
      label: link.label,
      url: link.value,
      status: link.value ? "watch" : "missing",
      evidence: link.value ? "Public URL is attached but was not returned by the live verifier." : "No public URL is attached.",
      action: link.value ? "Run the live check again before final submission." : `Attach a public URL for ${link.label}.`
    };
  });
}

function headlineFor(status: SubmissionFinalSubmitReceiptStatus) {
  if (status === "submit-ready") return "Final submission receipt is sealed";
  return "Final submission receipt needs URL repair";
}

function nextActionFor(rows: SubmissionFinalSubmitReceiptRow[], status: SubmissionFinalSubmitReceiptStatus) {
  if (status === "submit-ready") return "Attach this receipt to the final handoff and re-run it after any URL changes.";
  const firstOpen = rows.find((row) => row.status === "block" || row.status === "missing" || row.status === "watch");
  return firstOpen?.action ?? "Repair the public URL evidence, then run the final submission live check again.";
}

export function submissionFinalSubmitReceiptPayloadJson(payload: SubmissionFinalSubmitReceiptPayload) {
  return canonicalJson(payload);
}

export function submissionFinalSubmitReceiptChecksum(payload: SubmissionFinalSubmitReceiptPayload) {
  return stableReceiptHash(submissionFinalSubmitReceiptPayloadJson(payload));
}

export function submissionFinalSubmitReceiptRequestJson(input: SubmissionFinalSubmitReceiptVerificationRequest) {
  return canonicalJson(input);
}

export function verifySubmissionFinalSubmitReceipt(input: SubmissionFinalSubmitReceiptVerificationRequest): SubmissionFinalSubmitReceiptVerification {
  const expectedChecksum = input.checksum.toLowerCase();
  const actualChecksum = submissionFinalSubmitReceiptChecksum(input.payload);
  const verified = expectedChecksum === actualChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Final submission receipt checksum matches the live URL verifier result, deadline, form fields, and next action."
      : "Final submission receipt checksum does not match the exported payload. Re-run the live check before accepting this final handoff."
  };
}

function buildCopyText(input: Omit<SubmissionFinalSubmitReceipt, "copyText" | "exportMarkdown">) {
  return [
    `Final Submission Receipt: ${input.headline}`,
    `Receipt: ${input.receiptId}`,
    `Checksum: ${input.checksumAlgorithm}:${input.checksum}`,
    `Verify: POST ${input.verificationApiPath}`,
    `Status: ${input.status}`,
    `Score: ${input.score}/100`,
    `Checked: ${input.checkedAt}`,
    `Verified: ${input.verifiedCount}/${input.totalCount}`,
    "",
    input.summary,
    "",
    "Public URLs:",
    ...input.payload.rows.map((row) => `- [${row.status}] ${row.label}: ${row.url || "missing"} - ${row.evidence} Action: ${row.action}`),
    "",
    `Next action: ${input.nextAction}`
  ].join("\n");
}

function buildMarkdown(input: Omit<SubmissionFinalSubmitReceipt, "copyText" | "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    `Receipt: ${input.receiptId}`,
    `Checksum: ${input.checksumAlgorithm}:${input.checksum}`,
    `API verification: POST ${input.verificationApiPath}`,
    `Status: ${input.status}`,
    `Score: ${input.score}/100`,
    `Checked: ${input.checkedAt}`,
    `Verified: ${input.verifiedCount}/${input.totalCount}`,
    `Deadline: ${input.payload.deadline}`,
    "",
    input.summary,
    "",
    "## Public URLs",
    ...input.payload.rows.map((row) => `- [${row.status}] ${row.label}: ${row.url || "missing"} - ${row.evidence} Action: ${row.action}`),
    "",
    "## Next action",
    input.nextAction
  ].join("\n");
}

export function buildSubmissionFinalSubmitReceipt(input: {
  handoff: CloseoutFinalSubmitHandoff;
  liveProof: BuyerShareGateProofVerificationSummary;
}): SubmissionFinalSubmitReceipt {
  const rows = buildRows(input.handoff, input.liveProof);
  const blockedCount = rows.filter((row) => row.status === "block" || row.status === "missing").length;
  const watchCount = rows.filter((row) => row.status === "watch").length;
  const status: SubmissionFinalSubmitReceiptStatus =
    input.handoff.status === "ready" && blockedCount === 0 && watchCount === 0 && input.liveProof.verifiedCount === input.handoff.liveProofLinks.length
      ? "submit-ready"
      : "action-required";
  const headline = headlineFor(status);
  const summary =
    status === "submit-ready"
      ? "GitHub, Cloud Run, ProtoPedia, and video URLs responded live and match the final form handoff."
      : `${input.liveProof.verifiedCount}/${input.liveProof.totalCount} public URLs responded live. ${blockedCount + watchCount} final URL item${blockedCount + watchCount === 1 ? "" : "s"} still need repair.`;
  const payload: SubmissionFinalSubmitReceiptPayload = {
    receiptVersion: SUBMISSION_FINAL_SUBMIT_RECEIPT_VERSION,
    status,
    headline,
    summary,
    checkedAt: input.liveProof.checkedAt,
    score: input.liveProof.score,
    deadline: input.handoff.deadline,
    readyFieldCount: input.handoff.readyCount,
    totalFieldCount: input.handoff.fields.length,
    openFieldCount: input.handoff.openCount,
    invalidFieldCount: input.handoff.invalidCount,
    verifiedCount: input.liveProof.verifiedCount,
    totalCount: input.liveProof.totalCount,
    blockedCount,
    watchCount,
    rows,
    nextAction: nextActionFor(rows, status)
  };
  const checksum = submissionFinalSubmitReceiptChecksum(payload);
  const verificationRequest = { checksum, payload };
  const verificationRequestJson = submissionFinalSubmitReceiptRequestJson(verificationRequest);
  const verification = verifySubmissionFinalSubmitReceipt(verificationRequest);
  const partial: Omit<SubmissionFinalSubmitReceipt, "copyText" | "exportMarkdown"> = {
    receiptId: `submission-final-submit-${status}-${checksum}`,
    checksumAlgorithm: "fnv1a32",
    checksum,
    verificationApiPath: SUBMISSION_FINAL_SUBMIT_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson: submissionFinalSubmitReceiptPayloadJson(payload),
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification,
    status,
    headline,
    summary,
    checkedAt: input.liveProof.checkedAt,
    score: input.liveProof.score,
    verifiedCount: input.liveProof.verifiedCount,
    totalCount: input.liveProof.totalCount,
    blockedCount,
    watchCount,
    nextAction: payload.nextAction
  };

  return {
    ...partial,
    copyText: buildCopyText(partial),
    exportMarkdown: buildMarkdown(partial)
  };
}
