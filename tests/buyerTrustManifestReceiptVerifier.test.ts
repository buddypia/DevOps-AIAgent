import { describe, expect, it } from "vitest";
import {
  BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH,
  verifyBuyerTrustManifestReceiptRequest
} from "../server/buyerTrustManifestReceiptVerifier";
import { buyerTrustManifestReceiptDigest, type BuyerTrustManifestPayload } from "../src/buyerTrustManifest";

function samplePayload(): BuyerTrustManifestPayload {
  return {
    manifestVersion: "buyer-trust-manifest.v1",
    subject: "Platform lead",
    generatedAt: "2026-06-20T00:00:00.000Z",
    readiness: "needs-proof",
    score: 82,
    proofPacketReceiptDigest: "a1b2c3d4e5f60789",
    sponsorDecisionReceiptId: "sponsor-decision-signed",
    adoptionPlanId: "adoption-ready",
    trustCenterId: "trust-ready",
    commercialOfferId: "offer-ready",
    commercialOfferReceiptChecksum: "b1b2c3d4e5f60789",
    buyerPilotContractId: "buyer-pilot-contract-contract-ready-94",
    buyerPilotContractReceiptChecksum: "c1c2c3d4e5f60789",
    artifacts: [
      {
        id: "proof-packet",
        status: "pass",
        href: "https://example.com/buyer-proof-packet",
        evidence: "Packet digest is attached."
      },
      {
        id: "decision-follow-up",
        status: "watch",
        href: "https://example.com/buyer-decision-follow-up",
        evidence: "One owner task remains open."
      },
      {
        id: "buyer-pilot-contract",
        status: "pass",
        href: "https://example.com/buyer-pilot-contract",
        evidence: "Contract receipt is attached."
      }
    ],
    publicationWindow: {
      status: "recheck-required",
      proofExpiresAt: "2026-06-21T00:00:00.000Z",
      manifestExpiresAt: "2026-06-27T00:00:00.000Z",
      buyerReviewDueAt: "2026-06-23T00:00:00.000Z",
      schedule: [
        {
          id: "live-proof-recheck",
          status: "watch",
          dueAt: "2026-06-21T00:00:00.000Z",
          href: "https://example.com/buyer-proof-audit",
          action: "Run the live proof audit before buyer delivery."
        }
      ]
    }
  };
}

describe("buyer trust manifest receipt verifier", () => {
  it("uses the public manifest receipt verification API path", () => {
    expect(BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH).toBe("/api/buyer-trust-manifest/receipt/verify");
  });

  it("verifies an untampered manifest verification payload", () => {
    const payload = samplePayload();
    const digest = buyerTrustManifestReceiptDigest(payload);

    const result = verifyBuyerTrustManifestReceiptRequest({ digest, payload });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "buyer-trust-manifest.receipt.verify",
      verification: {
        status: "verified",
        expectedDigest: digest,
        actualDigest: digest
      },
      manifest: {
        manifestVersion: "buyer-trust-manifest.v1",
        subject: "Platform lead",
        readiness: "needs-proof",
        score: 82,
        publicationWindowStatus: "recheck-required",
        proofPacketReceiptDigest: "a1b2c3d4e5f60789",
        artifactCount: 3
      }
    });
  });

  it("accepts long encoded public artifact links in the manifest payload", () => {
    const longHref = `https://example.com/buyer-proof-audit?brief=${"manifest-proof-route-".repeat(180)}`;
    const payload: BuyerTrustManifestPayload = {
      ...samplePayload(),
      artifacts: samplePayload().artifacts.map((artifact, index) => (index === 0 ? { ...artifact, href: longHref } : artifact)),
      publicationWindow: {
        ...samplePayload().publicationWindow,
        schedule: samplePayload().publicationWindow.schedule.map((task) => ({ ...task, href: longHref }))
      }
    };

    const result = verifyBuyerTrustManifestReceiptRequest({
      digest: buyerTrustManifestReceiptDigest(payload),
      payload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      verification: {
        status: "verified"
      }
    });
  });

  it("returns 422 when the manifest payload is changed after export", () => {
    const payload = samplePayload();

    const result = verifyBuyerTrustManifestReceiptRequest({
      digest: buyerTrustManifestReceiptDigest(payload),
      payload: {
        ...payload,
        score: payload.score - 1
      }
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      verification: {
        status: "mismatch",
        expectedDigest: buyerTrustManifestReceiptDigest(payload)
      }
    });
  });

  it("rejects malformed manifest receipt verification requests", () => {
    const result = verifyBuyerTrustManifestReceiptRequest({
      digest: "not-a-digest",
      payload: {}
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
