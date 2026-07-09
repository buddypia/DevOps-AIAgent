import { z } from "zod";

export const QUICK_EXTERNAL_REVIEW_PACKET_RECEIPT_VERSION = "quick-external-review-packet.v1";
export const QUICK_EXTERNAL_REVIEW_PACKET_RECEIPT_VERIFY_PATH = "/api/quick-external-review-packet/verify";
export const QUICK_EXTERNAL_REVIEW_PACKET_ARTIFACT_VERIFY_PATH = "/api/quick-external-review-packet/artifact/verify";
export const QUICK_EXTERNAL_REVIEW_PACKET_ARTIFACT_SET_VERIFY_PATH = "/api/quick-external-review-packet/artifact-set/verify";

const QuickReviewPacketStatusSchema = z.enum(["ready", "watch", "blocked"]);
const QuickReviewPacketClearanceSchema = z.enum(["external-review", "internal-only"]);
const QuickReviewPacketArtifactIdSchema = z.enum([
  "launch-certificate",
  "reviewer-brief",
  "claim-audit",
  "value-route",
  "objection-answers",
  "proof-freshness"
]);

const QuickExternalReviewPacketArtifactSchema = z.object({
  id: QuickReviewPacketArtifactIdSchema,
  label: z.string().trim().min(1).max(180),
  status: QuickReviewPacketStatusSchema,
  role: z.string().trim().min(1).max(180),
  evidence: z.string().trim().min(1).max(2400),
  href: z.string().trim().min(1).max(1200),
  contentKind: z.literal("markdown"),
  contentChecksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  contentLength: z.number().int().min(1).max(120_000),
  requiredOrder: z.number().int().min(1).max(20)
});

const QuickExternalReviewPacketManifestSchema = z.object({
  receiptVersion: z.literal(QUICK_EXTERNAL_REVIEW_PACKET_RECEIPT_VERSION),
  receiptId: z.string().trim().regex(/^quick-external-review-(ready|watch|blocked)-[a-f0-9]{8}$/i),
  checksumAlgorithm: z.literal("fnv1a32"),
  checksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  payloadChecksum: z.string().trim().regex(/^[a-f0-9]{8}$/i),
  status: QuickReviewPacketStatusSchema,
  clearance: QuickReviewPacketClearanceSchema,
  buyer: z.string().trim().min(1).max(280),
  score: z.number().int().min(0).max(100),
  readyCount: z.number().int().min(0).max(20),
  totalCount: z.number().int().min(1).max(20),
  sendRule: z.string().trim().min(1).max(1800),
  nextAction: z.string().trim().min(1).max(1800),
  generatedFrom: z.array(z.string().trim().min(1).max(180)).min(1).max(12),
  artifacts: z.array(QuickExternalReviewPacketArtifactSchema).min(1).max(20),
  sourceReceipts: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(180),
        value: z.string().trim().min(1).max(1800)
      })
    )
    .min(1)
    .max(20)
});

const QuickExternalReviewPacketManifestRequestSchema = z.object({
  manifest: QuickExternalReviewPacketManifestSchema
});

type QuickExternalReviewPacketManifest = z.infer<typeof QuickExternalReviewPacketManifestSchema>;

const QuickExternalReviewPacketArtifactContentRequestSchema = z.object({
  manifest: QuickExternalReviewPacketManifestSchema,
  artifactId: QuickReviewPacketArtifactIdSchema,
  content: z.string().min(1).max(120_000)
});

const QuickExternalReviewPacketArtifactContentEntrySchema = z.object({
  artifactId: QuickReviewPacketArtifactIdSchema,
  content: z.string().min(1).max(120_000)
});

const QuickExternalReviewPacketArtifactSetRequestSchema = z.object({
  manifest: QuickExternalReviewPacketManifestSchema,
  artifacts: z.array(QuickExternalReviewPacketArtifactContentEntrySchema).min(1).max(20)
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function manifestFrom(input: unknown) {
  if (!isRecord(input)) return input;
  if (isRecord(input.manifest)) return input.manifest;
  if (isRecord(input.payload)) return input.payload;
  return input;
}

function fnv1a32(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function quickExternalReviewPacketManifestPayload(manifest: QuickExternalReviewPacketManifest) {
  return {
    receiptVersion: manifest.receiptVersion,
    status: manifest.status,
    clearance: manifest.clearance,
    buyer: manifest.buyer,
    score: manifest.score,
    readyCount: manifest.readyCount,
    totalCount: manifest.totalCount,
    sendRule: manifest.sendRule,
    nextAction: manifest.nextAction,
    generatedFrom: manifest.generatedFrom,
    artifacts: manifest.artifacts,
    sourceReceipts: manifest.sourceReceipts
  };
}

export function quickExternalReviewPacketManifestChecksum(manifest: QuickExternalReviewPacketManifest) {
  return fnv1a32(JSON.stringify(quickExternalReviewPacketManifestPayload(manifest), null, 2));
}

export function verifyQuickExternalReviewPacketManifest(manifest: QuickExternalReviewPacketManifest) {
  const expectedChecksum = manifest.checksum.toLowerCase();
  const actualChecksum = quickExternalReviewPacketManifestChecksum(manifest);
  const expectedReceiptId = `quick-external-review-${manifest.status}-${actualChecksum}`;
  const actualReadyCount = manifest.artifacts.filter((artifact) => artifact.status === "ready").length;
  const requiredOrderMatches = manifest.artifacts.every((artifact, index) => artifact.requiredOrder === index + 1);
  const totalCountMatches = manifest.totalCount === manifest.artifacts.length;
  const readyCountMatches = manifest.readyCount === actualReadyCount;
  const payloadChecksumMatches = manifest.payloadChecksum.toLowerCase() === actualChecksum;
  const receiptIdMatches = manifest.receiptId === expectedReceiptId;
  const clearanceMatchesStatus = manifest.status === "ready" ? manifest.clearance === "external-review" : manifest.clearance === "internal-only";
  const verified =
    expectedChecksum === actualChecksum &&
    payloadChecksumMatches &&
    receiptIdMatches &&
    totalCountMatches &&
    readyCountMatches &&
    requiredOrderMatches &&
    clearanceMatchesStatus;
  const status: "verified" | "mismatch" = verified ? "verified" : "mismatch";

  return {
    status,
    expectedChecksum,
    actualChecksum,
    expectedReceiptId,
    actualReceiptId: manifest.receiptId,
    payloadChecksumMatches,
    receiptIdMatches,
    totalCountMatches,
    readyCountMatches,
    requiredOrderMatches,
    clearanceMatchesStatus,
    instruction: verified
      ? "External review packet manifest checksum matches the packet artifacts, source receipts, and send rule."
      : "External review packet manifest does not match its payload or clearance rules. Do not accept this packet until it is re-exported from the source workspace."
  };
}

function normalizedArtifactContent(content: string) {
  return content.replace(/\r\n/g, "\n");
}

export function verifyQuickExternalReviewPacketArtifactContent(input: z.infer<typeof QuickExternalReviewPacketArtifactContentRequestSchema>) {
  const manifestVerification = verifyQuickExternalReviewPacketManifest(input.manifest);
  const artifact = input.manifest.artifacts.find((item) => item.id === input.artifactId);
  const normalizedContent = normalizedArtifactContent(input.content);
  const actualChecksum = fnv1a32(normalizedContent);
  const actualLength = normalizedContent.length;
  const expectedChecksum = artifact?.contentChecksum.toLowerCase() ?? "00000000";
  const expectedLength = artifact?.contentLength ?? 0;
  const artifactFound = Boolean(artifact);
  const checksumMatches = artifactFound && actualChecksum === expectedChecksum;
  const lengthMatches = artifactFound && actualLength === expectedLength;
  const kindMatches = artifact?.contentKind === "markdown";
  const verified = manifestVerification.status === "verified" && artifactFound && checksumMatches && lengthMatches && kindMatches;
  const status: "verified" | "mismatch" = verified ? "verified" : "mismatch";

  return {
    status,
    artifactFound,
    artifactId: input.artifactId,
    artifactLabel: artifact?.label ?? input.artifactId,
    contentKind: artifact?.contentKind ?? "markdown",
    expectedChecksum,
    actualChecksum,
    checksumMatches,
    expectedLength,
    actualLength,
    lengthMatches,
    manifestStatus: manifestVerification.status,
    instruction: verified
      ? "Artifact markdown matches the external review packet manifest checksum and length."
      : "Artifact markdown does not match the packet manifest. Do not trust this artifact until it is re-exported from the source packet."
  };
}

export function verifyQuickExternalReviewPacketArtifactSet(input: z.infer<typeof QuickExternalReviewPacketArtifactSetRequestSchema>) {
  const manifestVerification = verifyQuickExternalReviewPacketManifest(input.manifest);
  const seenArtifactIds = new Set<string>();
  const duplicateArtifactIds = new Set<string>();
  const submittedArtifactIds = new Set<string>();
  const results = input.artifacts.map((artifact) => {
    if (seenArtifactIds.has(artifact.artifactId)) duplicateArtifactIds.add(artifact.artifactId);
    seenArtifactIds.add(artifact.artifactId);
    submittedArtifactIds.add(artifact.artifactId);
    return verifyQuickExternalReviewPacketArtifactContent({
      manifest: input.manifest,
      artifactId: artifact.artifactId,
      content: artifact.content
    });
  });
  const missingArtifacts = input.manifest.artifacts
    .filter((artifact) => !submittedArtifactIds.has(artifact.id))
    .map((artifact) => ({
      artifactId: artifact.id,
      artifactLabel: artifact.label,
      expectedChecksum: artifact.contentChecksum,
      expectedLength: artifact.contentLength
    }));
  const verifiedCount = results.filter((result) => result.status === "verified").length;
  const mismatchCount = results.length - verifiedCount;
  const expectedArtifactCount = input.manifest.artifacts.length;
  const submittedArtifactCount = input.artifacts.length;
  const completeSet =
    missingArtifacts.length === 0 &&
    duplicateArtifactIds.size === 0 &&
    submittedArtifactCount === expectedArtifactCount;
  const verified = manifestVerification.status === "verified" && completeSet && mismatchCount === 0;
  const status: "verified" | "mismatch" = verified ? "verified" : "mismatch";

  return {
    status,
    manifestStatus: manifestVerification.status,
    expectedArtifactCount,
    submittedArtifactCount,
    verifiedCount,
    mismatchCount,
    missingCount: missingArtifacts.length,
    duplicateArtifactIds: Array.from(duplicateArtifactIds),
    missingArtifacts,
    results,
    instruction: verified
      ? "Every artifact markdown export matches the external review packet manifest. The packet set can be inspected as a complete bundle."
      : "The artifact set does not match the packet manifest. Re-export missing or mismatched artifacts before accepting the packet."
  };
}

export function verifyQuickExternalReviewPacketArtifactContentRequest(input: unknown) {
  const parsed = QuickExternalReviewPacketArtifactContentRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const verification = verifyQuickExternalReviewPacketArtifactContent(parsed.data);

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-external-review-packet.artifact.verify",
      verification
    }
  };
}

export function verifyQuickExternalReviewPacketArtifactSetRequest(input: unknown) {
  const parsed = QuickExternalReviewPacketArtifactSetRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const verification = verifyQuickExternalReviewPacketArtifactSet(parsed.data);

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-external-review-packet.artifact-set.verify",
      verification
    }
  };
}

export function verifyQuickExternalReviewPacketManifestRequest(input: unknown) {
  const parsed = QuickExternalReviewPacketManifestRequestSchema.safeParse({ manifest: manifestFrom(input) });
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const manifest = parsed.data.manifest;
  const verification = verifyQuickExternalReviewPacketManifest(manifest);

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "quick-external-review-packet.receipt.verify",
      verification,
      manifest: {
        receiptVersion: manifest.receiptVersion,
        receiptId: manifest.receiptId,
        status: manifest.status,
        clearance: manifest.clearance,
        buyer: manifest.buyer,
        score: manifest.score,
        readyCount: manifest.readyCount,
        totalCount: manifest.totalCount,
        artifactCount: manifest.artifacts.length,
        sourceReceiptCount: manifest.sourceReceipts.length,
        checksum: manifest.checksum
      }
    }
  };
}
