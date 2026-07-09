import { describe, expect, it } from "vitest";
import { buildBuyerReviewKit, renderBuyerReviewKitHtml } from "../src/buyerReviewKit";
import type { BuyerDecisionFollowUpLedger } from "../src/buyerDecisionFollowUp";
import type { BuyerDecisionReceipt } from "../src/buyerDecisionReceipt";
import type { BuyerProofVerifierReport } from "../src/buyerProofVerifier";
import type { BuyerTrustManifest } from "../src/buyerTrustManifest";

function source(
  overrides: {
    manifestDecision?: "publish" | "repair" | "hold";
    replayStatus?: "verified" | "mismatch";
    proofStatus?: "verified" | "attention" | "blocked";
    receiptChoice?: "continue" | "revise" | "stop";
    receiptReadiness?: "accepted" | "conditional" | "declined";
    decisionRecommendedChoice?: "continue" | "revise" | "stop";
    decisionAlignment?: "aligned" | "overridden";
    decisionOpenConditionCount?: number;
    decisionBlockedConditionCount?: number;
    decisionWatchConditionCount?: number;
    followUpStatus?: "ready" | "attention" | "blocked";
    operatorLine?: string;
  } = {}
) {
  const manifestDecision = overrides.manifestDecision ?? "publish";
  const proofStatus = overrides.proofStatus ?? "verified";
  const receiptChoice = overrides.receiptChoice ?? "continue";
  const receiptReadiness = overrides.receiptReadiness ?? "accepted";
  const followUpStatus = overrides.followUpStatus ?? "ready";
  const recommendedChoice = overrides.decisionRecommendedChoice ?? receiptChoice;
  const decisionAlignment = overrides.decisionAlignment ?? (recommendedChoice === receiptChoice ? "aligned" : "overridden");
  const openConditionCount = overrides.decisionOpenConditionCount ?? (receiptReadiness === "accepted" ? 0 : 1);
  const blockedConditionCount = overrides.decisionBlockedConditionCount ?? (recommendedChoice === "stop" ? openConditionCount : 0);
  const watchConditionCount = overrides.decisionWatchConditionCount ?? Math.max(0, openConditionCount - blockedConditionCount);

  return {
    manifest: {
      id: "buyer-trust-manifest-external-ready-92-a1b2c3d4",
      readiness: manifestDecision === "publish" ? "external-ready" : manifestDecision === "repair" ? "needs-proof" : "blocked",
      score: manifestDecision === "publish" ? 96 : manifestDecision === "repair" ? 72 : 44,
      headline: "Buyer trust manifest is ready",
      publicationGate: {
        decision: manifestDecision,
        headline: "Publication gate",
        score: 96,
        passedCount: 4,
        totalCount: 4,
        blockedCount: manifestDecision === "hold" ? 1 : 0,
        watchCount: manifestDecision === "repair" ? 1 : 0,
        firstAction: "Repair manifest blockers before sharing.",
        firstActionHref: "https://example.com/buyer-trust-manifest",
        checks: []
      },
      publicationWindow: {
        status: "current",
        generatedAt: "2026-06-20T00:00:00.000Z",
        proofExpiresAt: "2026-06-21T00:00:00.000Z",
        manifestExpiresAt: "2026-06-27T00:00:00.000Z",
        buyerReviewDueAt: "2026-06-23T00:00:00.000Z",
        summary: "Review window is current.",
        firstRecheck: "Recheck live proof.",
        firstRecheckHref: "https://example.com/buyer-proof-audit",
        schedule: []
      },
      verification: {
        algorithm: "fnv1a-64",
        digest: "a1b2c3d4e5f60789",
        verificationApiPath: "/api/buyer-trust-manifest/receipt/verify",
        payload: {
          manifestVersion: "buyer-trust-manifest.v1",
          subject: "Platform lead",
          generatedAt: "2026-06-20T00:00:00.000Z",
          readiness: "external-ready",
          score: 96,
          proofPacketReceiptDigest: "1111222233334444",
          sponsorDecisionReceiptId: "sponsor-signed",
          adoptionPlanId: "adoption-ready",
          trustCenterId: "trust-ready",
          commercialOfferId: "offer-ready",
          artifacts: [],
          publicationWindow: {
            status: "current",
            proofExpiresAt: "2026-06-21T00:00:00.000Z",
            manifestExpiresAt: "2026-06-27T00:00:00.000Z",
            buyerReviewDueAt: "2026-06-23T00:00:00.000Z",
            schedule: []
          }
        },
        payloadJson: "{}",
        payloadHref: "data:application/json,%7B%7D",
        verificationRequestJson: "{}",
        verificationRequestHref: "data:application/json,%7B%7D",
        replayVerification: {
          status: overrides.replayStatus ?? "verified",
          expectedDigest: "a1b2c3d4e5f60789",
          actualDigest: "a1b2c3d4e5f60789",
          instruction: "Digest verified."
        },
        instruction: "Replay the manifest digest."
      }
    } as Pick<BuyerTrustManifest, "id" | "readiness" | "score" | "headline" | "publicationGate" | "publicationWindow" | "verification">,
    proofVerifier: {
      status: proofStatus,
      decision: proofStatus === "verified" ? "share" : proofStatus === "attention" ? "repair" : "hold",
      score: proofStatus === "verified" ? 100 : proofStatus === "attention" ? 74 : 36,
      headline: "Buyer proof can be trusted",
      operatorLine: overrides.operatorLine ?? "Digest, receipts, and publication gate are aligned.",
      actualDigest: "a1b2c3d4e5f60789",
      nextActions: proofStatus === "verified" ? ["Attach this verifier report to the buyer room."] : ["Repair proof verifier blockers."]
    } as Pick<BuyerProofVerifierReport, "status" | "decision" | "score" | "headline" | "operatorLine" | "actualDigest" | "nextActions">,
    decisionReceipt: {
      receiptId: "buyer-decision-receipt-accepted-a1b2c3d4",
      choice: receiptChoice,
      readiness: receiptReadiness,
      headline: "Buyer decision is accepted",
      nextAction: receiptReadiness === "accepted" ? "Attach the receipt to the buyer room." : "Repair the conditional receipt before sharing.",
      checksum: "c0ffee1234567890",
      verification: {
        status: "verified",
        expectedChecksum: "c0ffee1234567890",
        actualChecksum: "c0ffee1234567890",
        instruction: "Checksum verified."
      },
      decisionGate: {
        recommendedChoice,
        selectedChoice: receiptChoice,
        decisionAlignment,
        openConditionCount,
        blockedConditionCount,
        watchConditionCount,
        blockingSummary:
          openConditionCount === 0
            ? "No open evidence condition blocks a clean continue decision."
            : `${blockedConditionCount} blocked condition(s) prevent a clean continue decision.`,
        overrideWarning:
          decisionAlignment === "aligned"
            ? "Selected decision matches the current evidence state."
            : "Continue is not evidence-aligned. This receipt stays conditional until open conditions are repaired.",
        continueCriteria:
          openConditionCount === 0
            ? ["Keep every attached proof link public through the buyer review window."]
            : ["Proof verifier: repair proof verifier blockers.", "Procurement decision: resolve commercial blockers."]
      }
    } as Pick<BuyerDecisionReceipt, "receiptId" | "choice" | "readiness" | "headline" | "nextAction" | "checksum" | "verification" | "decisionGate">,
    followUpLedger: {
      status: followUpStatus,
      headline: "Follow-up ledger is ready",
      summary: "Owners and due windows are assigned.",
      firstAction: {
        label: followUpStatus === "ready" ? "Open buyer decision room" : "Repair follow-up ledger",
        href: "https://example.com/buyer-decision-follow-up",
        external: false
      },
      readyCount: followUpStatus === "ready" ? 4 : 3,
      taskTotal: 4,
      blockedCount: followUpStatus === "blocked" ? 1 : 0,
      attentionCount: followUpStatus === "attention" ? 1 : 0
    } as Pick<BuyerDecisionFollowUpLedger, "status" | "headline" | "summary" | "firstAction" | "readyCount" | "taskTotal" | "blockedCount" | "attentionCount">,
    links: {
      trustManifestUrl: "https://example.com/buyer-trust-manifest",
      proofVerifierUrl: "https://example.com/buyer-proof-verifier",
      decisionReceiptUrl: "https://example.com/buyer-decision-receipt",
      followUpUrl: "https://example.com/buyer-decision-follow-up",
      jsonUrl: "https://example.com/api/buyer-review-kit",
      markdownUrl: "https://example.com/buyer-review-kit.md",
      appUrl: "https://example.com"
    }
  };
}

describe("buyer review kit", () => {
  it("builds a ready four-step external review protocol", () => {
    const kit = buildBuyerReviewKit(source());

    expect(kit.status).toBe("ready");
    expect(kit.readyCount).toBe(4);
    expect(kit.primaryAction.id).toBe("record-decision");
    expect(kit.steps.map((step) => step.id)).toEqual(["verify-manifest", "inspect-proof", "record-decision", "assign-follow-up"]);
    expect(kit.exportMarkdown).toContain("## Review protocol");
    expect(kit.exportMarkdown).toContain("Decision alignment: aligned");
    expect(kit.exportMarkdown).toContain("Decision receipt: buyer-decision-receipt-accepted-a1b2c3d4");
  });

  it("holds external sharing when proof or decision evidence is blocked", () => {
    const kit = buildBuyerReviewKit(
      source({
        manifestDecision: "hold",
        proofStatus: "blocked",
        receiptChoice: "stop",
        receiptReadiness: "declined",
        followUpStatus: "blocked"
      })
    );

    expect(kit.status).toBe("hold");
    expect(kit.blockedCount).toBeGreaterThan(0);
    expect(kit.primaryAction.status).toBe("blocked");
    expect(kit.summary).toContain("Stop external sharing");
  });

  it("holds the kit when the selected decision overrides a stop recommendation", () => {
    const kit = buildBuyerReviewKit(
      source({
        receiptChoice: "continue",
        receiptReadiness: "conditional",
        decisionRecommendedChoice: "stop",
        decisionAlignment: "overridden",
        decisionOpenConditionCount: 4,
        decisionBlockedConditionCount: 3,
        decisionWatchConditionCount: 1
      })
    );
    const html = renderBuyerReviewKitHtml(kit, source().links);

    expect(kit.status).toBe("hold");
    expect(kit.primaryAction).toMatchObject({
      id: "record-decision",
      status: "blocked"
    });
    expect(kit.summary).toContain("Decision receipt selected continue, but evidence recommends stop");
    expect(kit.exportMarkdown).toContain("Evidence recommendation: stop");
    expect(kit.exportMarkdown).toContain("Decision alignment: overridden");
    expect(html).toContain("Decision gate");
    expect(html).toContain("Recommended stop, selected continue");
    expect(html).toContain("Conditions to continue");
  });

  it("adds a verified buyer reply receipt step when one is supplied", () => {
    const base = source();
    const kit = buildBuyerReviewKit({
      ...base,
      replyRecord: {
        status: "verified",
        verified: true,
        receiptType: "quick-buyer-decision-reply-record.v1",
        receiptLabel: "Buyer reply record",
        decision: "continue",
        checksum: "abc12345",
        buyer: "Platform release lead",
        confidence: 94,
        sourceVerifierApiPath: "/api/quick-buyer-decision-reply-record/verify",
        verifierUrl: "https://example.com/receipt-verifier?request=reply&verify=1",
        nextAction: "Buyer reply record receipt is verified. The exported payload matches its checksum or digest."
      },
      links: {
        ...base.links,
        replyRecordVerifierUrl: "https://example.com/receipt-verifier?request=reply&verify=1"
      }
    });
    const html = renderBuyerReviewKitHtml(kit, {
      ...base.links,
      replyRecordVerifierUrl: "https://example.com/receipt-verifier?request=reply&verify=1"
    });

    expect(kit.status).toBe("ready");
    expect(kit.readyCount).toBe(5);
    expect(kit.reviewMinutes).toBe(14);
    expect(kit.primaryAction.id).toBe("verify-reply-record");
    expect(kit.steps.map((step) => step.id)).toEqual(["verify-manifest", "inspect-proof", "record-decision", "assign-follow-up", "verify-reply-record"]);
    expect(kit.steps.find((step) => step.id === "verify-reply-record")).toMatchObject({
      status: "ready",
      href: "https://example.com/receipt-verifier?request=reply&verify=1"
    });
    expect(kit.exportMarkdown).toContain("Verify buyer reply");
    expect(html).toContain("Reply receipt");
    expect(html).toContain("5/5");
  });

  it("adds verified buyer validation answers as a review gate", () => {
    const base = source();
    const kit = buildBuyerReviewKit({
      ...base,
      validationAnswerRecord: {
        status: "verified",
        verified: true,
        receiptType: "quick-buyer-validation-answer-record.v1",
        receiptLabel: "Buyer validation answer record",
        answerStatus: "ready",
        checksum: "feed1234",
        buyer: "Platform release lead",
        confidence: 94,
        answeredCount: 5,
        totalCount: 5,
        sourceReceiptId: "quick-workflow-conversion-ready-12345678",
        sourceVerifierApiPath: "/api/quick-buyer-validation-answer-record/verify",
        verifierUrl: "https://example.com/receipt-verifier?request=answers&verify=1",
        nextAction: "Record continue, revise, or stop with the decision recorder."
      },
      links: {
        ...base.links,
        validationAnswerRecordVerifierUrl: "https://example.com/receipt-verifier?request=answers&verify=1"
      }
    });
    const html = renderBuyerReviewKitHtml(kit, {
      ...base.links,
      validationAnswerRecordVerifierUrl: "https://example.com/receipt-verifier?request=answers&verify=1"
    });

    expect(kit.status).toBe("ready");
    expect(kit.readyCount).toBe(5);
    expect(kit.reviewMinutes).toBe(15);
    expect(kit.steps.map((step) => step.id)).toEqual(["verify-manifest", "inspect-proof", "verify-validation-answers", "record-decision", "assign-follow-up"]);
    expect(kit.steps.find((step) => step.id === "verify-validation-answers")).toMatchObject({
      status: "ready",
      href: "https://example.com/receipt-verifier?request=answers&verify=1"
    });
    expect(kit.summary).toContain("verify the buyer validation answers");
    expect(kit.exportMarkdown).toContain("Buyer validation answer record/verified");
    expect(html).toContain("Validation answers");
  });

  it("holds the kit when attached validation answers are not verified", () => {
    const base = source();
    const kit = buildBuyerReviewKit({
      ...base,
      validationAnswerRecord: {
        status: "mismatch",
        verified: false,
        receiptType: "quick-buyer-validation-answer-record.v1",
        receiptLabel: "Buyer validation answer record",
        answerStatus: "ready",
        checksum: "feed1234",
        buyer: "Platform release lead",
        verifierUrl: "https://example.com/receipt-verifier?request=answers&verify=1",
        nextAction: "Do not accept this record until it is re-exported."
      }
    });

    expect(kit.status).toBe("hold");
    expect(kit.primaryAction).toMatchObject({
      id: "verify-validation-answers",
      status: "blocked"
    });
  });

  it("renders escaped HTML with review artifact links", () => {
    const kit = buildBuyerReviewKit(source({ operatorLine: "Digest is clean <script>alert(1)</script>" }));
    const html = renderBuyerReviewKitHtml(kit, source().links);

    expect(html).toContain("Buyer Review Kit");
    expect(html).toContain("Trust manifest");
    expect(html).toContain("https://example.com/buyer-decision-receipt");
    expect(html).toContain("Digest is clean &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("Digest is clean <script>alert(1)</script>");
  });
});
