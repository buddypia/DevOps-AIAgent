import { describe, expect, it } from "vitest";
import {
  BUYER_PROOF_VERIFIER_API_PATH,
  buildBuyerProofVerifierReport,
  renderBuyerProofVerifierHtml,
  type BuyerProofVerifierManifest
} from "../src/buyerProofVerifier";
import { BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH, buyerTrustManifestReceiptDigest, type BuyerTrustManifestPayload } from "../src/buyerTrustManifest";
import { verifyBuyerProofManifestRequest } from "../server/buyerProofVerifier";

function samplePayload(): BuyerTrustManifestPayload {
  return {
    manifestVersion: "buyer-trust-manifest.v1",
    subject: "Platform lead",
    generatedAt: "2026-06-20T00:00:00.000Z",
    readiness: "external-ready",
    score: 96,
    proofPacketReceiptDigest: "a1b2c3d4e5f60789",
    buyerEvidenceBoardReceiptChecksum: "1111222233334444",
    commercialOfferReceiptChecksum: "b1b2c3d4e5f60789",
    buyerPilotContractId: "buyer-pilot-contract-contract-ready-94",
    buyerPilotContractReceiptChecksum: "c1c2c3d4e5f60789",
    sponsorDecisionReceiptId: "sponsor-decision-signed",
    adoptionPlanId: "adoption-ready",
    trustCenterId: "trust-ready",
    commercialOfferId: "offer-ready",
    artifacts: [
      {
        id: "proof-packet",
        status: "pass",
        href: "https://example.com/buyer-proof-packet",
        evidence: "Packet digest is attached."
      },
      {
        id: "decision-follow-up",
        status: "pass",
        href: "https://example.com/buyer-decision-follow-up",
        evidence: "Follow-up owners are closed."
      },
      {
        id: "buyer-pilot-contract",
        status: "pass",
        href: "https://example.com/buyer-pilot-contract",
        evidence: "Contract receipt is attached."
      }
    ],
    publicationWindow: {
      status: "current",
      proofExpiresAt: "2026-06-21T00:00:00.000Z",
      manifestExpiresAt: "2026-06-27T00:00:00.000Z",
      buyerReviewDueAt: "2026-06-23T00:00:00.000Z",
      schedule: [
        {
          id: "live-proof-recheck",
          status: "pass",
          dueAt: "2026-06-21T00:00:00.000Z",
          href: "https://example.com/buyer-proof-audit",
          action: "Re-run the live proof audit before buyer delivery."
        }
      ]
    }
  };
}

function sampleManifest(): BuyerProofVerifierManifest {
  const payload = samplePayload();
  const digest = buyerTrustManifestReceiptDigest(payload);
  return {
    id: `buyer-trust-manifest-external-ready-96-${digest.slice(0, 8)}`,
    manifestVersion: "buyer-trust-manifest.v1",
    generatedAt: payload.generatedAt,
    subject: payload.subject,
    readiness: "external-ready",
    score: 96,
    proofPacketDigest: payload.proofPacketReceiptDigest,
    artifacts: payload.artifacts,
    receipts: [
      {
        id: "buyer-proof-packet",
        status: "pass",
        algorithm: "fnv1a-64",
        digest: payload.proofPacketReceiptDigest,
        evidence: "Proof packet digest is attached."
      },
      {
        id: "buyer-evidence-board",
        status: "pass",
        algorithm: "fnv1a-64",
        digest: payload.buyerEvidenceBoardReceiptChecksum ?? "",
        evidence: "Evidence board checksum is attached."
      },
      {
        id: "commercial-offer",
        status: "pass",
        algorithm: "fnv1a-64",
        digest: payload.commercialOfferReceiptChecksum ?? "",
        evidence: "Commercial offer checksum is attached."
      },
      {
        id: "buyer-pilot-contract",
        status: "pass",
        algorithm: "fnv1a-64",
        digest: payload.buyerPilotContractReceiptChecksum ?? "",
        evidence: "Buyer pilot contract checksum is attached."
      },
      {
        id: "buyer-trust-manifest",
        status: "pass",
        algorithm: "fnv1a-64",
        digest,
        evidence: "Manifest digest is attached."
      }
    ],
    publicationGate: {
      decision: "publish",
      score: 100,
      blockedCount: 0,
      watchCount: 0,
      firstAction: "Share the proof packet with the buyer.",
      firstActionHref: "https://example.com/buyer-proof-packet"
    },
    publicationWindow: {
      status: "current",
      proofExpiresAt: "2026-06-21T00:00:00.000Z",
      manifestExpiresAt: "2026-06-27T00:00:00.000Z",
      buyerReviewDueAt: "2026-06-23T00:00:00.000Z",
      firstRecheck: "Re-run the live proof audit before buyer delivery.",
      firstRecheckHref: "https://example.com/buyer-proof-audit"
    },
    verification: {
      digest,
      payload
    }
  };
}

describe("buyer proof verifier", () => {
  it("builds a shareable verifier report for a digest-matched manifest", () => {
    const manifest = sampleManifest();
    const report = buildBuyerProofVerifierReport({ manifest, checkedAt: "2026-06-20T01:00:00.000Z" });

    expect(report).toMatchObject({
      status: "verified",
      decision: "share",
      score: 100,
      subject: "Platform lead",
      expectedDigest: manifest.verification.digest,
      actualDigest: manifest.verification.digest,
      trustManifestVerifyApiPath: BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH
    });
    expect(report.checks.map((check) => check.status)).toEqual(["pass", "pass", "pass", "pass", "pass", "pass", "pass", "pass"]);
    expect(report.exportMarkdown).toContain("## Checks");
  });

  it("blocks visible upstream receipts that drift from the manifest payload", () => {
    const manifest = sampleManifest();
    const report = buildBuyerProofVerifierReport({
      manifest: {
        ...manifest,
        receipts: manifest.receipts.map((receipt) => (receipt.id === "buyer-pilot-contract" ? { ...receipt, digest: "0000000000000000" } : receipt))
      },
      checkedAt: "2026-06-20T01:00:00.000Z"
    });

    expect(report.status).toBe("blocked");
    expect(report.checks.find((check) => check.id === "upstream-receipts")).toMatchObject({
      status: "block"
    });
  });

  it("blocks a manifest whose verification payload changed after export", () => {
    const manifest = sampleManifest();
    const report = buildBuyerProofVerifierReport({
      manifest: {
        ...manifest,
        verification: {
          ...manifest.verification,
          payload: {
            ...manifest.verification.payload,
            score: 42
          }
        }
      },
      checkedAt: "2026-06-20T01:00:00.000Z"
    });

    expect(report.status).toBe("blocked");
    expect(report.decision).toBe("hold");
    expect(report.checks.find((check) => check.id === "manifest-digest")).toMatchObject({
      status: "block"
    });
  });

  it("blocks drift between the visible artifact index and the digest payload", () => {
    const manifest = sampleManifest();
    const report = buildBuyerProofVerifierReport({
      manifest: {
        ...manifest,
        artifacts: manifest.artifacts.map((artifact) =>
          artifact.id === "proof-packet" ? { ...artifact, href: "https://example.com/changed-proof-packet" } : artifact
        )
      },
      checkedAt: "2026-06-20T01:00:00.000Z"
    });

    expect(report.status).toBe("blocked");
    expect(report.checks.find((check) => check.id === "artifact-index")).toMatchObject({
      status: "block"
    });
  });

  it("verifies manifest requests through the server request adapter", () => {
    const manifest = sampleManifest();
    const result = verifyBuyerProofManifestRequest({ manifest }, "2026-06-20T01:00:00.000Z");

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "buyer-proof-verifier.report",
      report: {
        status: "verified",
        decision: "share"
      }
    });
  });

  it("rejects malformed verifier requests", () => {
    const result = verifyBuyerProofManifestRequest({ manifest: { manifestVersion: "buyer-trust-manifest.v1" } }, "2026-06-20T01:00:00.000Z");

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  it("renders a paste-and-verify public HTML tool", () => {
    const manifest = sampleManifest();
    const report = buildBuyerProofVerifierReport({ manifest, checkedAt: "2026-06-20T01:00:00.000Z" });
    const html = renderBuyerProofVerifierHtml({
      report,
      manifestJson: JSON.stringify(manifest, null, 2),
      links: {
        apiUrl: "https://example.com/api/buyer-proof-verifier",
        currentManifestUrl: "https://example.com/api/buyer-trust-manifest",
        trustManifestUrl: "https://example.com/buyer-trust-manifest",
        wellKnownUrl: "https://example.com/.well-known/buyer-proof.json",
        appUrl: "https://example.com"
      }
    });

    expect(BUYER_PROOF_VERIFIER_API_PATH).toBe("/api/buyer-proof-verifier");
    expect(html).toContain("Buyer Proof Verifier");
    expect(html).toContain("data-verify-proof");
    expect(html).toContain("data-load-current");
    expect(html).toContain("https://example.com/api/buyer-proof-verifier");
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
