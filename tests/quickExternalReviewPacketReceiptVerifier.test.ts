import { describe, expect, test } from "vitest";
import {
  QUICK_WORKFLOW_INTAKE_EXAMPLE,
  buildQuickBuyerRoomPreview,
  buildQuickGlobalPublishabilityBrief
} from "../src/QuickWorkflowIntakePanel";
import { buildWorkflowIntakeDraftFromText } from "../src/workflowIntakeDraft";
import {
  verifyQuickExternalReviewPacketArtifactSetRequest,
  verifyQuickExternalReviewPacketArtifactContentRequest,
  verifyQuickExternalReviewPacketManifestRequest
} from "../server/quickExternalReviewPacketReceiptVerifier";

function generatedVerdict() {
  const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
  const preview = buildQuickBuyerRoomPreview(draft, 0);
  return buildQuickGlobalPublishabilityBrief(draft, preview);
}

function generatedManifest() {
  return generatedVerdict().reviewPacket.manifest;
}

function generatedArtifactBundle() {
  const verdict = generatedVerdict();
  return {
    manifest: verdict.reviewPacket.manifest,
    artifacts: [
      { artifactId: "launch-certificate" as const, content: verdict.certificate.exportMarkdown },
      { artifactId: "reviewer-brief" as const, content: verdict.reviewerBrief.exportMarkdown },
      { artifactId: "claim-audit" as const, content: verdict.claimAudit.exportMarkdown },
      { artifactId: "value-route" as const, content: verdict.valueRoute.exportMarkdown },
      { artifactId: "objection-answers" as const, content: verdict.objectionDeck.exportMarkdown },
      { artifactId: "proof-freshness" as const, content: verdict.freshness.exportMarkdown }
    ]
  };
}

describe("quick external review packet receipt verifier", () => {
  test("verifies a generated external review packet manifest", () => {
    const manifest = generatedManifest();
    const result = verifyQuickExternalReviewPacketManifestRequest({ manifest });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "quick-external-review-packet.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: manifest.checksum,
        actualChecksum: manifest.checksum,
        payloadChecksumMatches: true,
        receiptIdMatches: true,
        totalCountMatches: true,
        readyCountMatches: true,
        requiredOrderMatches: true,
        clearanceMatchesStatus: true
      },
      manifest: {
        receiptVersion: "quick-external-review-packet.v1",
        receiptId: manifest.receiptId,
        status: manifest.status,
        clearance: manifest.clearance,
        artifactCount: 6,
        sourceReceiptCount: manifest.sourceReceipts.length,
        checksum: manifest.checksum
      }
    });
    expect(manifest.artifacts.every((artifact) => artifact.contentKind === "markdown")).toBe(true);
    expect(manifest.artifacts.every((artifact) => artifact.contentLength > 0)).toBe(true);
  });

  test("accepts a pasted manifest without an envelope", () => {
    const manifest = generatedManifest();
    const result = verifyQuickExternalReviewPacketManifestRequest(manifest);

    expect(result.statusCode).toBe(200);
    expect(result.body.verification).toMatchObject({
      status: "verified",
      actualChecksum: manifest.checksum
    });
  });

  test("verifies artifact markdown content against the generated packet manifest", () => {
    const verdict = generatedVerdict();
    const result = verifyQuickExternalReviewPacketArtifactContentRequest({
      manifest: verdict.reviewPacket.manifest,
      artifactId: "launch-certificate",
      content: verdict.certificate.exportMarkdown.replace(/\n/g, "\r\n")
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "quick-external-review-packet.artifact.verify",
      verification: {
        status: "verified",
        artifactId: "launch-certificate",
        artifactLabel: "Launch certificate",
        expectedChecksum: verdict.reviewPacket.manifest.artifacts.find((artifact) => artifact.id === "launch-certificate")?.contentChecksum,
        actualChecksum: verdict.reviewPacket.manifest.artifacts.find((artifact) => artifact.id === "launch-certificate")?.contentChecksum,
        expectedLength: verdict.certificate.exportMarkdown.length,
        actualLength: verdict.certificate.exportMarkdown.length,
        checksumMatches: true,
        lengthMatches: true,
        manifestStatus: "verified"
      }
    });
  });

  test("rejects artifact markdown that no longer matches the manifest", () => {
    const verdict = generatedVerdict();
    const result = verifyQuickExternalReviewPacketArtifactContentRequest({
      manifest: verdict.reviewPacket.manifest,
      artifactId: "launch-certificate",
      content: `${verdict.certificate.exportMarkdown}\nEdited after export.`
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      verification: {
        status: "mismatch",
        artifactId: "launch-certificate",
        checksumMatches: false,
        lengthMatches: false,
        manifestStatus: "verified"
      }
    });
  });

  test("verifies a complete artifact bundle against the packet manifest", () => {
    const bundle = generatedArtifactBundle();
    const result = verifyQuickExternalReviewPacketArtifactSetRequest(bundle);

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "quick-external-review-packet.artifact-set.verify",
      verification: {
        status: "verified",
        manifestStatus: "verified",
        expectedArtifactCount: 6,
        submittedArtifactCount: 6,
        verifiedCount: 6,
        mismatchCount: 0,
        missingCount: 0,
        duplicateArtifactIds: [],
        missingArtifacts: []
      }
    });
    const body = result.body as { verification: { results: Array<{ status: string }> } };
    expect(body.verification.results.every((item) => item.status === "verified")).toBe(true);
  });

  test("rejects artifact bundles with missing or edited markdown", () => {
    const bundle = generatedArtifactBundle();
    const result = verifyQuickExternalReviewPacketArtifactSetRequest({
      manifest: bundle.manifest,
      artifacts: bundle.artifacts
        .filter((artifact) => artifact.artifactId !== "proof-freshness")
        .map((artifact) =>
          artifact.artifactId === "reviewer-brief"
            ? { ...artifact, content: `${artifact.content}\nEdited after export.` }
            : artifact
        )
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      verification: {
        status: "mismatch",
        manifestStatus: "verified",
        expectedArtifactCount: 6,
        submittedArtifactCount: 5,
        verifiedCount: 4,
        mismatchCount: 1,
        missingCount: 1,
        missingArtifacts: [
          {
            artifactId: "proof-freshness",
            artifactLabel: "Proof freshness"
          }
        ]
      }
    });
  });

  test("rejects duplicate artifact ids even when the duplicate content matches", () => {
    const bundle = generatedArtifactBundle();
    const result = verifyQuickExternalReviewPacketArtifactSetRequest({
      manifest: bundle.manifest,
      artifacts: [
        ...bundle.artifacts.filter((artifact) => artifact.artifactId !== "proof-freshness"),
        bundle.artifacts[0]
      ]
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      verification: {
        status: "mismatch",
        manifestStatus: "verified",
        expectedArtifactCount: 6,
        submittedArtifactCount: 6,
        verifiedCount: 6,
        mismatchCount: 0,
        missingCount: 1,
        duplicateArtifactIds: ["launch-certificate"]
      }
    });
  });

  test("returns a mismatch when the manifest payload is changed", () => {
    const manifest = generatedManifest();
    const tamperedManifest = {
      ...manifest,
      artifacts: manifest.artifacts.map((artifact) =>
        artifact.id === "proof-freshness"
          ? {
              ...artifact,
              status: "ready" as const,
              evidence: "Fresh proof was edited after export."
            }
          : artifact
      )
    };

    const result = verifyQuickExternalReviewPacketManifestRequest({ manifest: tamperedManifest });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      verification: {
        status: "mismatch",
        expectedChecksum: manifest.checksum,
        payloadChecksumMatches: false,
        receiptIdMatches: false,
        readyCountMatches: false
      }
    });
    expect(result.body.verification).toMatchObject({
      instruction: expect.stringContaining("Do not accept")
    });
  });

  test("keeps strict schema errors visible", () => {
    const result = verifyQuickExternalReviewPacketManifestRequest({
      manifest: {
        receiptVersion: "quick-external-review-packet.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
    expect(result.body.issues).toBeDefined();
  });
});
