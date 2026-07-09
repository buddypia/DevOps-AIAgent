import { describe, expect, test } from "vitest";
import {
  QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM,
  QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PREFIX,
  QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PARAM,
  QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PREFIX,
  QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM,
  QUICK_BUYER_EVIDENCE_PACK_SHARE_PREFIX,
  QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION,
  QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PARAM,
  QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PREFIX,
  decodeQuickBuyerEvidencePackShareParam,
  decodeQuickBuyerEvidenceResponseShareParam,
  decodeQuickExternalReviewPacketShareParam,
  decodeQuickExternalReviewResponseShareParam,
  encodeQuickBuyerEvidencePackShareParam,
  encodeQuickBuyerEvidenceResponseShareParam,
  encodeQuickExternalReviewPacketShareParam,
  encodeQuickExternalReviewResponseShareParam,
  quickBuyerEvidencePackShareHref,
  quickBuyerEvidenceResponseShareHref,
  quickExternalReviewPacketShareHref,
  quickExternalReviewResponseShareHref
} from "../src/quickExternalReviewPacketShare";

describe("quick external review packet share links", () => {
  test("round-trips a verification request through the compressed packet parameter", () => {
    const requestJson = JSON.stringify(
      {
        manifest: {
          receiptVersion: "quick-external-review-packet.v1",
          receiptId: "quick-external-review-ready-abcdef12",
          buyer: "Platform release lead",
          artifacts: Array.from({ length: 6 }, (_, index) => ({
            id: `artifact-${index}`,
            status: "ready",
            evidence: "Verified reviewer evidence ".repeat(24)
          }))
        }
      },
      null,
      2
    );

    const encoded = encodeQuickExternalReviewPacketShareParam(requestJson);
    const href = quickExternalReviewPacketShareHref(requestJson);
    const parsed = new URL(href, "https://example.com");

    expect(encoded).toMatch(new RegExp(`^${QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PREFIX.replace(".", "\\.")}`));
    expect(encoded.length).toBeLessThan(encodeURIComponent(requestJson).length);
    expect(parsed.pathname).toBe("/external-review-packet");
    expect(parsed.searchParams.get("verify")).toBe("1");
    expect(decodeQuickExternalReviewPacketShareParam(parsed.searchParams.get(QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM))).toBe(requestJson);
  });

  test("fails closed for missing or unrelated packet parameters", () => {
    expect(encodeQuickExternalReviewPacketShareParam("   ")).toBe("");
    expect(decodeQuickExternalReviewPacketShareParam(null)).toBe("");
    expect(decodeQuickExternalReviewPacketShareParam("not-a-packet")).toBe("");
    expect(quickExternalReviewPacketShareHref("")).toBe("/external-review-packet");
  });

  test("round-trips a reviewer response through the compressed workbench parameter", () => {
    const requestJson = JSON.stringify(
      {
        checksum: "abcdef12",
        payload: {
          receiptVersion: "quick-external-review-decision.v1",
          decision: "revise",
          reviewerNote: "Repair proof freshness, then request another response.".repeat(12)
        }
      },
      null,
      2
    );
    const encoded = encodeQuickExternalReviewResponseShareParam(requestJson);
    const href = quickExternalReviewResponseShareHref(requestJson, "https://example.com/workbench");
    const parsed = new URL(href);

    expect(encoded).toMatch(new RegExp(`^${QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PREFIX.replace(".", "\\.")}`));
    expect(encoded.length).toBeLessThan(encodeURIComponent(requestJson).length);
    expect(parsed.pathname).toBe("/workbench");
    expect(parsed.hash).toBe("#quick-workflow-intake");
    expect(decodeQuickExternalReviewResponseShareParam(parsed.searchParams.get(QUICK_EXTERNAL_REVIEW_RESPONSE_SHARE_PARAM))).toBe(requestJson);
    expect(decodeQuickExternalReviewResponseShareParam(requestJson)).toBe(requestJson);
  });

  test("round-trips a buyer evidence pack through the compressed share parameter", () => {
    const payloadJson = JSON.stringify(
      {
        version: QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION,
        buyer: "Platform release lead",
        workflow: "Weekly Cloud Run release-readiness review",
        status: "ready",
        artifacts: Array.from({ length: 8 }, (_, index) => ({
          id: index === 0 ? "decision-case" : `artifact-${index}`,
          label: `Artifact ${index}`,
          status: "ready",
          proof: "Verified proof ".repeat(20)
        }))
      },
      null,
      2
    );
    const encoded = encodeQuickBuyerEvidencePackShareParam(payloadJson);
    const href = quickBuyerEvidencePackShareHref(payloadJson);
    const parsed = new URL(href, "https://example.com");

    expect(encoded).toMatch(new RegExp(`^${QUICK_BUYER_EVIDENCE_PACK_SHARE_PREFIX.replace(".", "\\.")}`));
    expect(encoded.length).toBeLessThan(encodeURIComponent(payloadJson).length);
    expect(parsed.pathname).toBe("/quick-buyer-evidence-pack");
    expect(decodeQuickBuyerEvidencePackShareParam(parsed.searchParams.get(QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM))).toBe(payloadJson);
    expect(quickBuyerEvidencePackShareHref("")).toBe("/quick-buyer-evidence-pack");
    expect(decodeQuickBuyerEvidencePackShareParam("not-an-evidence-pack")).toBe("");
  });

  test("round-trips a buyer evidence response through the compressed workbench parameter", () => {
    const requestJson = JSON.stringify(
      {
        checksum: "c0ffee12",
        payload: {
          receiptVersion: "quick-external-review-decision.v1",
          decision: "continue",
          reviewerNote: "Evidence accepted with verifier attached.".repeat(12)
        }
      },
      null,
      2
    );
    const encoded = encodeQuickBuyerEvidenceResponseShareParam(requestJson);
    const href = quickBuyerEvidenceResponseShareHref(requestJson, "https://example.com/workbench");
    const parsed = new URL(href);

    expect(encoded).toMatch(new RegExp(`^${QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PREFIX.replace(".", "\\.")}`));
    expect(encoded.length).toBeLessThan(encodeURIComponent(requestJson).length);
    expect(parsed.pathname).toBe("/workbench");
    expect(parsed.hash).toBe("#quick-workflow-intake");
    expect(decodeQuickBuyerEvidenceResponseShareParam(parsed.searchParams.get(QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PARAM))).toBe(requestJson);
    expect(decodeQuickBuyerEvidenceResponseShareParam(requestJson)).toBe(requestJson);
    expect(quickBuyerEvidenceResponseShareHref("")).toBe("/#quick-workflow-intake");
    expect(decodeQuickBuyerEvidenceResponseShareParam("not-a-prefixed-response")).toBe("not-a-prefixed-response");
  });
});
