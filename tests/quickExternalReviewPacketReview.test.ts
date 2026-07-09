import { describe, expect, test } from "vitest";
import { QUICK_EXTERNAL_REVIEW_PACKET_REVIEW_PATH, renderQuickExternalReviewPacketReviewHtml } from "../server/quickExternalReviewPacketReview";

describe("quick external review packet review desk", () => {
  test("renders a stored packet handoff that can auto-run the verifier", () => {
    const html = renderQuickExternalReviewPacketReviewHtml({
      apiUrl: "https://example.com/api/quick-external-review-packet/verify",
      artifactApiUrl: "https://example.com/api/quick-external-review-packet/artifact/verify",
      artifactSetApiUrl: "https://example.com/api/quick-external-review-packet/artifact-set/verify",
      decisionApiUrl: "https://example.com/api/quick-external-review-decision/verify",
      storedRequestKey: "quick-external-review-ready-abcdef12",
      autoVerify: true,
      links: {
        receiptVerifierUrl: "https://example.com/receipt-verifier",
        appUrl: "https://example.com"
      }
    });

    expect(QUICK_EXTERNAL_REVIEW_PACKET_REVIEW_PATH).toBe("/external-review-packet");
    expect(html).toContain("External Review Packet Desk");
    expect(html).toContain("external-review-packet-input");
    expect(html).toContain("external-review-packet-artifacts");
    expect(html).toContain("external-review-artifact-verifier");
    expect(html).toContain("external-review-artifact-content");
    expect(html).toContain("Verify artifact content");
    expect(html).toContain("external-review-artifact-set-verifier");
    expect(html).toContain("external-review-artifact-set-content");
    expect(html).toContain("Verify artifact bundle");
    expect(html).toContain("artifact-card");
    expect(html).toContain("Content checksum");
    expect(html).toContain("Paste an artifact markdown file and verify its manifest hash.");
    expect(html).toContain("external-review-response-panel");
    expect(html).toContain("external-review-response-verify");
    expect(html).toContain("external-review-response-workbench");
    expect(html).toContain("Generate response receipt");
    expect(html).toContain("Verify receipt");
    expect(html).toContain("Open workbench with response");
    expect(html).toContain("quick-external-review-decision.v1");
    expect(html).toContain("https://example.com/api/quick-external-review-decision/verify");
    expect(html).toContain('const artifactApiUrl = "https://example.com/api/quick-external-review-packet/artifact/verify"');
    expect(html).toContain('const artifactSetApiUrl = "https://example.com/api/quick-external-review-packet/artifact-set/verify"');
    expect(html).toContain('const receiptVerifierUrl = "https://example.com/receipt-verifier"');
    expect(html).toContain('const appUrl = "https://example.com"');
    expect(html).toContain('const packetShareParam = "packet"');
    expect(html).toContain('const responseShareParam = "reviewResponse"');
    expect(html).toContain('const responseKeyParam = "reviewResponseKey"');
    expect(html).toContain("quick-external-review-response:");
    expect(html).toContain("url.searchParams.set(packetShareParam, packetShare)");
    expect(html).toContain("responseWorkbench.href = responseWorkbenchHrefFor(requestJson, request.checksum)");
    expect(html).toContain('url.searchParams.set("request", requestJson)');
    expect(html).toContain('url.searchParams.set("verify", "1")');
    expect(html).toContain("Verify and render memo");
    expect(html).toContain("receipt-verifier-request:");
    expect(html).toContain("quick-external-review-ready-abcdef12");
    expect(html).toContain("https://example.com/api/quick-external-review-packet/verify");
    expect(html).toContain("https://example.com/receipt-verifier");
    expect(html).toContain("const autoVerify = true");
  });

  test("escapes pasted manifest JSON in the textarea and script sample", () => {
    const sampleRequestJson = JSON.stringify({
      manifest: {
        receiptVersion: "quick-external-review-packet.v1",
        buyer: "</script><img src=x onerror=alert(1)>"
      }
    });

    const html = renderQuickExternalReviewPacketReviewHtml({
      apiUrl: "/api/quick-external-review-packet/verify",
      artifactApiUrl: "/api/quick-external-review-packet/artifact/verify",
      artifactSetApiUrl: "/api/quick-external-review-packet/artifact-set/verify",
      decisionApiUrl: "/api/quick-external-review-decision/verify",
      sampleRequestJson
    });

    expect(html).not.toContain("</script><img");
    expect(html).toContain("&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("\\u003c/script\\u003e");
  });
});
