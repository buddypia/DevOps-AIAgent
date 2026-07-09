import { describe, expect, it } from "vitest";
import { runGlobalPublishabilityReviewResponse } from "../server/globalPublishabilityReviewResponse";
import { verifyGlobalPublishabilityReviewResponseRequest } from "../server/globalPublishabilityReviewResponseReceiptVerifier";
import type { GlobalLaunchAudit } from "../src/globalLaunchAudit";
import { buildGlobalProofDossier, type GlobalProofDossierLinkSummary } from "../src/globalProofDossier";
import { buildGlobalPublishabilityReport } from "../src/globalPublishabilityReport";
import { GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERSION } from "../src/globalPublishabilityReviewResponseReceipt";

function dimension(id: GlobalLaunchAudit["dimensions"][number]["id"], label: string, score = 90): GlobalLaunchAudit["dimensions"][number] {
  return {
    id,
    label,
    status: score >= 82 ? "pass" : score >= 58 ? "watch" : "block",
    score,
    evidence: `${label} evidence is public and buyer-readable.`,
    action: `${label} action is closed.`,
    href: `#${id}`
  };
}

function sampleAudit(): GlobalLaunchAudit {
  return {
    readiness: "global-ready",
    score: 92,
    headline: "This launch can stand in front of a global buyer",
    hardTruth: "The launch has public proof.",
    targetMarket: "Global platform lead",
    launchNarrative: "A global buyer can inspect value, measured proof, operations, and trust in one route.",
    monthlyValue: "1,000,000 yen",
    measuredValue: "998,000 yen",
    proofSummary: "5/5 public links, 2 accepted A2A trials",
    opsSummary: "86/100 production capability",
    dimensions: [
      dimension("buyer-value", "Buyer value clarity", 94),
      dimension("live-surface", "Public product surface", 96),
      dimension("proof-depth", "Proof depth", 88),
      dimension("measured-outcome", "Measured buyer outcome", 92),
      dimension("production-ops", "Production operations", 86),
      dimension("trust-offer", "Trust and offer packaging", 88)
    ],
    actions: [
      {
        id: "send-launch-room",
        priority: "now",
        owner: "Founder / PM",
        label: "Send the global launch room",
        action: "Ask for pilot approval.",
        href: "#buyer-share-gate"
      }
    ],
    liftPlan: {
      targetScore: 86,
      scoreGap: 0,
      projectedScoreAfterFirstFix: 92,
      summary: "Global-ready threshold is met; keep proof fresh.",
      actions: []
    },
    proofLinks: [
      { id: "targetUrl", label: "Live product", value: "https://service.example/app", status: "pass", href: "#launch-evidence-console" },
      { id: "protopediaUrl", label: "ProtoPedia story", value: "https://protopedia.net/prototype/global-launch", status: "pass", href: "#launch-evidence-console" },
      { id: "videoUrl", label: "Walkthrough video", value: "https://youtu.be/global-launch", status: "pass", href: "#launch-evidence-console" },
      { id: "pilotEvidenceUrl", label: "Measured receipt", value: "https://evidence.example/pilot", status: "pass", href: "#pilot-run-receipt" },
      { id: "workOrderEvidenceUrl", label: "Work order proof", value: "https://evidence.example/work-order", status: "pass", href: "#buyer-work-order-studio" }
    ],
    exportMarkdown: "# Global launch audit"
  };
}

function verifiedLinks(audit: GlobalLaunchAudit): GlobalProofDossierLinkSummary {
  return {
    checkedAt: "2026-06-20T00:00:00.000Z",
    verifiedCount: audit.proofLinks.length,
    totalCount: audit.proofLinks.length,
    score: 100,
    results: audit.proofLinks.map((link) => ({
      id: link.id,
      label: link.label,
      url: link.value,
      status: "pass",
      httpStatus: 200,
      finalUrl: link.value,
      contentType: "text/html",
      evidence: "Public URL responded with HTTP 200.",
      action: "Keep this link attached to the launch room."
    }))
  };
}

function sampleReport() {
  const audit = sampleAudit();
  return buildGlobalPublishabilityReport({
    audit,
    dossier: buildGlobalProofDossier({
      audit,
      liveProof: verifiedLinks(audit),
      generatedAt: "2026-06-20T01:00:00.000Z"
    }),
    generatedAt: "2026-06-20T02:00:00.000Z",
    links: {
      launchRoomUrl: "https://service.example/launch-room?workspace=share",
      proofDossierUrl: "https://service.example/global-proof-dossier?workspace=share"
    }
  });
}

function verificationRequestFor(report: ReturnType<typeof sampleReport>) {
  return JSON.parse(report.receipt.verificationRequestJson) as unknown;
}

describe("global publishability review response", () => {
  it("records an external bounded-pilot approval against a verified publishability receipt", () => {
    const report = sampleReport();
    const result = runGlobalPublishabilityReviewResponse(
      {
        verificationRequest: verificationRequestFor(report),
        reviewerName: "Platform sponsor",
        reviewerRole: "Buyer sponsor",
        reviewerChoice: "approve-bounded-pilot",
        reviewerNote: "The proof route is enough to approve the first bounded pilot.",
        checkedProofIds: ["buyer-value", "measured-proof", "public-proof", "buyer-decision"]
      },
      { now: new Date("2026-06-20T03:00:00.000Z") }
    );

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "global-publishability.review-response",
      status: "accepted",
      outcome: "pilot-approved",
      reportId: report.id,
      targetBuyer: "Global platform lead",
      reviewerName: "Platform sponsor",
      reviewerChoice: "approve-bounded-pilot",
      checkedProofCount: 4,
      requiredProofCount: 4,
      missingProofIds: [],
      sourceReceiptChecksum: report.receipt.checksum
    });
    if (!("receipt" in result.body)) throw new Error("Expected review response receipt.");
    expect(result.body.receipt.payload).toMatchObject({
      receiptVersion: GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERSION,
      outcome: "pilot-approved",
      status: "accepted",
      sourceReceiptChecksum: report.receipt.checksum,
      checkedProofIds: ["buyer-value", "measured-proof", "public-proof", "buyer-decision"]
    });
    expect(result.body.receipt.verification.status).toBe("verified");

    const verifierResult = verifyGlobalPublishabilityReviewResponseRequest({
      checksum: result.body.receipt.checksum,
      payload: result.body.receipt.payload
    });
    expect(verifierResult.statusCode).toBe(200);
    expect(verifierResult.body).toMatchObject({
      skill: "global-publishability-review-response.receipt.verify",
      receipt: {
        receiptVersion: GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERSION,
        outcome: "pilot-approved",
        checkedProofCount: 4,
        missingProofCount: 0
      }
    });
  });

  it("turns approval with unchecked proof into owner follow-up instead of accepting it", () => {
    const report = sampleReport();
    const result = runGlobalPublishabilityReviewResponse(
      {
        verificationRequest: verificationRequestFor(report),
        reviewerName: "Platform sponsor",
        reviewerChoice: "approve-bounded-pilot",
        checkedProofIds: ["buyer-value", "measured-proof"]
      },
      { now: new Date("2026-06-20T03:00:00.000Z") }
    );

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      status: "review",
      outcome: "owner-follow-up",
      missingProofIds: ["public-proof", "buyer-decision"],
      nextAction: expect.stringContaining("public-proof, buyer-decision")
    });
  });

  it("rejects a review response when the source publishability receipt no longer verifies", () => {
    const report = sampleReport();
    const verificationRequest = JSON.parse(report.receipt.verificationRequestJson);
    verificationRequest.payload.publishabilityScore = 41;

    const result = runGlobalPublishabilityReviewResponse({
      verificationRequest,
      reviewerName: "Platform sponsor",
      reviewerChoice: "approve-bounded-pilot",
      checkedProofIds: ["buyer-value", "measured-proof", "public-proof", "buyer-decision"]
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      error: "source_receipt_not_verified"
    });
  });

  it("rejects a tampered review-response receipt", () => {
    const report = sampleReport();
    const result = runGlobalPublishabilityReviewResponse({
      verificationRequest: verificationRequestFor(report),
      reviewerName: "Platform sponsor",
      reviewerChoice: "approve-bounded-pilot",
      checkedProofIds: ["buyer-value", "measured-proof", "public-proof", "buyer-decision"]
    });
    if (!("receipt" in result.body)) throw new Error("Expected review response receipt.");

    const verifierResult = verifyGlobalPublishabilityReviewResponseRequest({
      checksum: result.body.receipt.checksum,
      payload: {
        ...result.body.receipt.payload,
        outcome: "no-send"
      }
    });

    expect(verifierResult.statusCode).toBe(422);
    expect(verifierResult.body).toMatchObject({
      verification: {
        status: "mismatch",
        expectedChecksum: result.body.receipt.checksum
      }
    });
  });
});
