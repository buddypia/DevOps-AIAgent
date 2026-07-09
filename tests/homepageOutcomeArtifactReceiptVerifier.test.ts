import { describe, expect, test } from "vitest";
import { verifyHomepageOutcomeArtifactReceiptRequest } from "../server/homepageOutcomeArtifactReceiptVerifier";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH,
  HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION,
  homepageOutcomeArtifactReceiptChecksum
} from "../src/homepageOutcomeArtifactReceipt";

function samplePayload() {
  return {
    receiptVersion: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION,
    source: "homepage-outcome-artifact" as const,
    buyer: "Platform release lead",
    decision: "send-to-buyer" as const,
    status: "ready" as const,
    readyCount: 4,
    itemCount: 4,
    items: [
      {
        id: "buyer-one-pager" as const,
        label: "Buyer one-pager",
        status: "ready" as const,
        value: "¥1,027,000 modeled value",
        proof: "Modeled value and buyer narrative are attached.",
        href: "/buyer-outcome-brief",
        actionLabel: "Open brief"
      },
      {
        id: "value-proof" as const,
        label: "Value proof",
        status: "ready" as const,
        value: "1260 saved minutes",
        proof: "Measured run is attached.",
        href: "/buyer-outcome-brief",
        actionLabel: "Inspect value"
      },
      {
        id: "proof-gate" as const,
        label: "Live proof gate",
        status: "ready" as const,
        value: "5/5 links",
        proof: "Public proof links are reachable.",
        href: "/buyer-proof-room",
        actionLabel: "Inspect proof"
      },
      {
        id: "decision-handoff" as const,
        label: "Decision handoff",
        status: "ready" as const,
        value: "Send this brief and ask for a bounded pilot approval.",
        proof: "The buyer can move from value and proof into a bounded pilot decision.",
        href: "/launch-room",
        actionLabel: "Open decision room"
      }
    ]
  };
}

describe("homepage outcome artifact receipt verifier", () => {
  test("verifies the first-screen buyer packet replay payload", () => {
    const payload = samplePayload();
    const checksum = homepageOutcomeArtifactReceiptChecksum(payload);
    const result = verifyHomepageOutcomeArtifactReceiptRequest({ checksum, payload });

    expect(HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH).toBe("/api/homepage-outcome-artifact/receipt/verify");
    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "homepage-outcome-artifact.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: checksum,
        actualChecksum: checksum
      },
      receipt: {
        receiptVersion: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION,
        source: "homepage-outcome-artifact",
        buyer: "Platform release lead",
        decision: "send-to-buyer",
        status: "ready",
        readyCount: 4,
        itemCount: 4,
        blockedItems: 0,
        firstAction: "Open decision room"
      }
    });
  });

  test("accepts generated buyer brief share URLs in the packet payload", () => {
    const longShareHref = `https://example.com/buyer-outcome-brief?workspace=${"a".repeat(5000)}`;
    const payload = {
      ...samplePayload(),
      items: samplePayload().items.map((item) => (item.id === "buyer-one-pager" || item.id === "value-proof" ? { ...item, href: longShareHref } : item))
    };
    const checksum = homepageOutcomeArtifactReceiptChecksum(payload);
    const result = verifyHomepageOutcomeArtifactReceiptRequest({ checksum, payload });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      verification: {
        status: "verified",
        expectedChecksum: checksum,
        actualChecksum: checksum
      }
    });
  });

  test("returns mismatch when the buyer packet changes after export", () => {
    const payload = samplePayload();
    const checksum = homepageOutcomeArtifactReceiptChecksum(payload);
    const result = verifyHomepageOutcomeArtifactReceiptRequest({
      checksum,
      payload: {
        ...payload,
        readyCount: 3
      }
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      verification: {
        status: "mismatch",
        expectedChecksum: checksum
      }
    });
  });

  test("rejects malformed homepage outcome artifact receipts", () => {
    const result = verifyHomepageOutcomeArtifactReceiptRequest({
      checksum: "not-valid",
      payload: {
        receiptVersion: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches through the generic receipt verification desk", () => {
    const payload = samplePayload();
    const checksum = homepageOutcomeArtifactReceiptChecksum(payload);
    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "receipt-verifier.dispatch",
      status: "verified",
      verified: true,
      receiptType: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION,
      receiptLabel: "Homepage outcome artifact",
      sourceVerifierApiPath: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH
    });
  });
});
