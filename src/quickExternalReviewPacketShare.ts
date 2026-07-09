import LZString from "lz-string/libs/lz-string.min.js";

export const QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM = "packet";
export const QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PREFIX = "qerp1.";
export const QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PARAM = "reviewResponse";
export const QUICK_EXTERNAL_REVIEW_RESPONSE_KEY_PARAM = "reviewResponseKey";
export const QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PREFIX = "qerr1.";
export const QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM = "evidencePack";
export const QUICK_BUYER_EVIDENCE_PACK_SHARE_PREFIX = "qbep1.";
export const QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION = "quick-buyer-evidence-pack.v1";
export const QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PARAM = "evidenceResponse";
export const QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PREFIX = "qber1.";

export function encodeQuickExternalReviewPacketShareParam(verificationRequestJson: string) {
  const trimmed = verificationRequestJson.trim();
  if (!trimmed) return "";
  const compressed = LZString.compressToEncodedURIComponent(trimmed);
  return compressed ? `${QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PREFIX}${compressed}` : "";
}

export function decodeQuickExternalReviewPacketShareParam(raw: string | null | undefined) {
  if (!raw?.startsWith(QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PREFIX)) return "";
  try {
    return LZString.decompressFromEncodedURIComponent(raw.slice(QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PREFIX.length))?.trim() ?? "";
  } catch {
    return "";
  }
}

export function quickExternalReviewPacketShareHref(verificationRequestJson: string, baseHref = "/external-review-packet") {
  const packet = encodeQuickExternalReviewPacketShareParam(verificationRequestJson);
  if (!packet) return baseHref;
  const params = new URLSearchParams({
    [QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM]: packet,
    verify: "1"
  });
  return `${baseHref}?${params.toString()}`;
}

export function encodeQuickExternalReviewResponseShareParam(verificationRequestJson: string) {
  const trimmed = verificationRequestJson.trim();
  if (!trimmed) return "";
  const compressed = LZString.compressToEncodedURIComponent(trimmed);
  return compressed ? `${QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PREFIX}${compressed}` : "";
}

export function decodeQuickExternalReviewResponseShareParam(raw: string | null | undefined) {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "";
  if (!trimmed.startsWith(QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PREFIX)) return trimmed;
  try {
    return LZString.decompressFromEncodedURIComponent(trimmed.slice(QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PREFIX.length))?.trim() ?? "";
  } catch {
    return "";
  }
}

export function quickExternalReviewResponseShareHref(verificationRequestJson: string, baseHref = "/#quick-workflow-intake") {
  const response = encodeQuickExternalReviewResponseShareParam(verificationRequestJson);
  if (!response) return baseHref;
  const isAbsolute = /^[a-z][a-z\d+\-.]*:/i.test(baseHref);
  const url = new URL(baseHref, "https://example.com");
  url.searchParams.set(QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PARAM, response);
  if (!url.hash) url.hash = "quick-workflow-intake";
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

export function encodeQuickBuyerEvidencePackShareParam(payloadJson: string) {
  const trimmed = payloadJson.trim();
  if (!trimmed) return "";
  const compressed = LZString.compressToEncodedURIComponent(trimmed);
  return compressed ? `${QUICK_BUYER_EVIDENCE_PACK_SHARE_PREFIX}${compressed}` : "";
}

export function decodeQuickBuyerEvidencePackShareParam(raw: string | null | undefined) {
  if (!raw?.startsWith(QUICK_BUYER_EVIDENCE_PACK_SHARE_PREFIX)) return "";
  try {
    return LZString.decompressFromEncodedURIComponent(raw.slice(QUICK_BUYER_EVIDENCE_PACK_SHARE_PREFIX.length))?.trim() ?? "";
  } catch {
    return "";
  }
}

export function quickBuyerEvidencePackShareHref(payloadJson: string, baseHref = "/quick-buyer-evidence-pack") {
  const evidencePack = encodeQuickBuyerEvidencePackShareParam(payloadJson);
  if (!evidencePack) return baseHref;
  const isAbsolute = /^[a-z][a-z\d+\-.]*:/i.test(baseHref);
  const url = new URL(baseHref, "https://example.com");
  url.searchParams.set(QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM, evidencePack);
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

export function encodeQuickBuyerEvidenceResponseShareParam(verificationRequestJson: string) {
  const trimmed = verificationRequestJson.trim();
  if (!trimmed) return "";
  const compressed = LZString.compressToEncodedURIComponent(trimmed);
  return compressed ? `${QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PREFIX}${compressed}` : "";
}

export function decodeQuickBuyerEvidenceResponseShareParam(raw: string | null | undefined) {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "";
  if (!trimmed.startsWith(QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PREFIX)) return trimmed;
  try {
    return LZString.decompressFromEncodedURIComponent(trimmed.slice(QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PREFIX.length))?.trim() ?? "";
  } catch {
    return "";
  }
}

export function quickBuyerEvidenceResponseShareHref(verificationRequestJson: string, baseHref = "/#quick-workflow-intake") {
  const evidenceResponse = encodeQuickBuyerEvidenceResponseShareParam(verificationRequestJson);
  if (!evidenceResponse) return baseHref;
  const isAbsolute = /^[a-z][a-z\d+\-.]*:/i.test(baseHref);
  const url = new URL(baseHref, "https://example.com");
  url.searchParams.set(QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PARAM, evidenceResponse);
  if (!url.hash) url.hash = "quick-workflow-intake";
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}
