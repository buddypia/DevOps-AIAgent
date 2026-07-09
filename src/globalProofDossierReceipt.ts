import type { GlobalProofDossier, GlobalProofDossierClaim, GlobalProofDossierLinkCheck, GlobalProofDossierRedLine } from "./globalProofDossier.js";

export const GLOBAL_PROOF_DOSSIER_RECEIPT_VERIFY_PATH = "/api/global-proof-dossier/receipt/verify";

export type GlobalProofDossierReceiptPayload = {
  receiptVersion: "global-proof-dossier.v1";
  dossierId: string;
  generatedAt: string;
  decision: GlobalProofDossier["decision"];
  dossierScore: number;
  targetBuyer: string;
  decisionAsk: string;
  verifiedSummary: string;
  proofWindow: string;
  claims: Array<Pick<GlobalProofDossierClaim, "id" | "label" | "status" | "score" | "claim" | "decisionRule">>;
  proofLinks: Array<Pick<GlobalProofDossierLinkCheck, "id" | "label" | "url" | "status" | "httpStatus" | "evidence" | "action">>;
  redLines: Array<Pick<GlobalProofDossierRedLine, "id" | "status" | "label" | "owner" | "action">>;
};

export type GlobalProofDossierReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type GlobalProofDossierReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof GLOBAL_PROOF_DOSSIER_RECEIPT_VERIFY_PATH;
  payload: GlobalProofDossierReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: GlobalProofDossierReceiptVerification;
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

export function verifyGlobalProofDossierReceipt(
  receipt: Pick<GlobalProofDossierReceipt, "checksum" | "payload">
): GlobalProofDossierReceiptVerification {
  const actualChecksum = stableDigest(receipt.payload);
  const verified = actualChecksum === receipt.checksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum: receipt.checksum,
    actualChecksum,
    instruction: verified
      ? "Global proof dossier receipt checksum matches the attached replay payload."
      : "Global proof dossier receipt checksum does not match the attached replay payload. Do not accept this buyer-sharing decision until the dossier is re-exported."
  };
}

function buildReceiptMarkdown(receipt: Omit<GlobalProofDossierReceipt, "copyText" | "href">) {
  return [
    "# Global proof dossier receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Buyer decision: ${receipt.payload.decision}`,
    `Dossier score: ${receipt.payload.dossierScore}/100`,
    `Target buyer: ${receipt.payload.targetBuyer}`,
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
    "Replay rule: Recompute fnv1a-64 over the dossier replay payload before accepting a forwarded buyer-sharing decision."
  ].join("\n");
}

export function buildGlobalProofDossierReceipt(dossier: GlobalProofDossier): GlobalProofDossierReceipt {
  const payload: GlobalProofDossierReceiptPayload = {
    receiptVersion: "global-proof-dossier.v1",
    dossierId: dossier.id,
    generatedAt: dossier.generatedAt,
    decision: dossier.decision,
    dossierScore: dossier.dossierScore,
    targetBuyer: dossier.targetBuyer,
    decisionAsk: dossier.decisionAsk,
    verifiedSummary: dossier.verifiedSummary,
    proofWindow: dossier.proofWindow,
    claims: dossier.claims.map((claim) => ({
      id: claim.id,
      label: claim.label,
      status: claim.status,
      score: claim.score,
      claim: claim.claim,
      decisionRule: claim.decisionRule
    })),
    proofLinks: dossier.proofLinks.map((link) => ({
      id: link.id,
      label: link.label,
      url: link.url,
      status: link.status,
      httpStatus: link.httpStatus,
      evidence: link.evidence,
      action: link.action
    })),
    redLines: dossier.redLines.map((line) => ({
      id: line.id,
      status: line.status,
      label: line.label,
      owner: line.owner,
      action: line.action
    }))
  };
  const checksum = stableDigest(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyGlobalProofDossierReceipt({ checksum, payload });
  const partial: Omit<GlobalProofDossierReceipt, "copyText" | "href"> = {
    receiptId: `global-proof-dossier-${payload.decision}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: GLOBAL_PROOF_DOSSIER_RECEIPT_VERIFY_PATH,
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
