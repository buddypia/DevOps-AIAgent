import { describe, expect, it } from "vitest";
import {
  BUYER_DECISION_RECEIPT_VERIFY_PATH,
  buildBuyerDecisionReceipt,
  buyerDecisionReceiptChecksum,
  renderBuyerDecisionReceiptHtml,
  verifyBuyerDecisionReceipt
} from "../src/buyerDecisionReceipt";
import { verifyBuyerDecisionReceiptRequest } from "../server/buyerDecisionReceiptVerifier";

function source(overrides: {
  proofStatus?: "verified" | "attention" | "blocked";
  procurementReadiness?: "buy-now" | "pilot-first" | "hold";
  contractReadiness?: "ready-to-sign" | "needs-redlines" | "blocked";
  followUpStatus?: "ready" | "attention" | "blocked";
} = {}) {
  const proofStatus = overrides.proofStatus ?? "verified";
  const procurementReadiness = overrides.procurementReadiness ?? "buy-now";
  const contractReadiness = overrides.contractReadiness ?? "ready-to-sign";
  const followUpStatus = overrides.followUpStatus ?? "ready";
  const followUpMode: "buyer-send" | "sponsor-review" | "blocker-closure" =
    followUpStatus === "ready" ? "buyer-send" : followUpStatus === "attention" ? "sponsor-review" : "blocker-closure";
  return {
    procurementDecision: {
      id: "buyer-procurement-buy-now-92-a2a",
      readiness: procurementReadiness,
      score: 92,
      headline: "Approve the A2A proof pilot",
      targetBuyer: "Platform lead",
      firstCommitmentYen: 900000,
      monthlyValueYen: 2400000,
      paybackDays: 12,
      decisionContract: {
        readiness: contractReadiness,
        approvalAsk: "Approve a 900,000 yen paid proof pilot.",
        clearClauseCount: contractReadiness === "ready-to-sign" ? 4 : 2,
        clauseCount: 4
      }
    },
    proofVerifier: {
      status: proofStatus,
      decision: proofStatus === "verified" ? "share" : proofStatus === "attention" ? "repair" : "hold",
      score: proofStatus === "verified" ? 100 : proofStatus === "attention" ? 74 : 42,
      actualDigest: "a1b2c3d4e5f60789",
      headline: "Buyer proof can be trusted",
      nextActions: proofStatus === "verified" ? ["Attach this verifier report to the buyer room."] : ["Repair proof verifier blockers before buyer signature."]
    },
    trustManifest: {
      id: "buyer-trust-manifest-external-ready-92-a1b2c3d4",
      proofPacketDigest: "1111222233334444",
      publicationGate: {
        decision: "publish" as const,
        firstAction: "Share the proof packet."
      },
      verification: {
        digest: "a1b2c3d4e5f60789",
        payload: {
          manifestVersion: "buyer-trust-manifest.v1" as const,
          subject: "Platform lead",
          generatedAt: "2026-06-20T00:00:00.000Z",
          readiness: "external-ready" as const,
          score: 92,
          proofPacketReceiptDigest: "1111222233334444",
          sponsorDecisionReceiptId: "sponsor-signed",
          adoptionPlanId: "adoption-ready",
          trustCenterId: "trust-ready",
          commercialOfferId: "offer-ready",
          artifacts: [],
          publicationWindow: {
            status: "current" as const,
            proofExpiresAt: "2026-06-21T00:00:00.000Z",
            manifestExpiresAt: "2026-06-27T00:00:00.000Z",
            buyerReviewDueAt: "2026-06-23T00:00:00.000Z",
            schedule: []
          }
        }
      }
    },
    followUpLedger: {
      status: followUpStatus,
      mode: followUpMode,
      headline: "Decision follow-up is ready to send",
      firstAction: {
        label: "Open follow-up ledger",
        href: "https://example.com/buyer-decision-follow-up",
        external: false
      },
      readyCount: followUpStatus === "ready" ? 4 : 3,
      taskTotal: 4,
      blockedCount: followUpStatus === "blocked" ? 1 : 0,
      attentionCount: followUpStatus === "attention" ? 1 : 0
    },
    links: {
      procurementDecisionUrl: "https://example.com/procurement-decision",
      proofVerifierUrl: "https://example.com/buyer-proof-verifier",
      trustManifestUrl: "https://example.com/buyer-trust-manifest",
      followUpUrl: "https://example.com/buyer-decision-follow-up",
      jsonUrl: "https://example.com/api/buyer-decision-receipt",
      markdownUrl: "https://example.com/buyer-decision-receipt.md",
      appUrl: "https://example.com"
    }
  };
}

describe("buyer decision receipt", () => {
  it("records an accepted buyer decision when all proof conditions are clear", () => {
    const receipt = buildBuyerDecisionReceipt({
      ...source(),
      input: {
        choice: "continue",
        reviewerName: "Platform sponsor",
        buyerNote: "Approved for the paid proof pilot.",
        decidedAt: "2026-06-20T01:00:00.000Z"
      }
    });

    expect(receipt).toMatchObject({
      choice: "continue",
      readiness: "accepted",
      reviewerName: "Platform sponsor",
      verificationApiPath: BUYER_DECISION_RECEIPT_VERIFY_PATH
    });
    expect(receipt.decisionGate).toMatchObject({
      recommendedChoice: "continue",
      selectedChoice: "continue",
      decisionAlignment: "aligned",
      openConditionCount: 0
    });
    expect(receipt.conditions.every((condition) => condition.status === "clear")).toBe(true);
    expect(receipt.payload).toMatchObject({
      receiptVersion: "buyer-decision-receipt.v1",
      approvalAsk: "Approve a 900,000 yen paid proof pilot.",
      manifestDigest: "a1b2c3d4e5f60789",
      decisionGate: {
        recommendedChoice: "continue",
        decisionAlignment: "aligned"
      }
    });
    expect(receipt.checksum).toBe(buyerDecisionReceiptChecksum(receipt.payload));
    expect(receipt.verification).toMatchObject({
      status: "verified",
      actualChecksum: receipt.checksum
    });
    expect(receipt.exportMarkdown).toContain("## Conditions");
  });

  it("recommends stop when proof or procurement conditions are blocked", () => {
    const receipt = buildBuyerDecisionReceipt({
      ...source({ proofStatus: "blocked", procurementReadiness: "hold", contractReadiness: "blocked", followUpStatus: "blocked" }),
      input: {
        reviewerName: "Security reviewer",
        decidedAt: "2026-06-20T01:00:00.000Z"
      }
    });

    expect(receipt.choice).toBe("stop");
    expect(receipt.readiness).toBe("declined");
    expect(receipt.decisionGate).toMatchObject({
      recommendedChoice: "stop",
      selectedChoice: "stop",
      decisionAlignment: "aligned",
      blockedConditionCount: 4
    });
    expect(receipt.decisionGate.continueCriteria[0]).toContain("Proof verifier");
    expect(receipt.conditions.some((condition) => condition.status === "blocked")).toBe(true);
    expect(receipt.nextAction).toContain("Stop the buyer send");
  });

  it("marks forced continue as an evidence override when conditions are blocked", () => {
    const receipt = buildBuyerDecisionReceipt({
      ...source({ proofStatus: "blocked", procurementReadiness: "hold", contractReadiness: "blocked", followUpStatus: "blocked" }),
      input: {
        choice: "continue",
        reviewerName: "Platform sponsor",
        decidedAt: "2026-06-20T01:00:00.000Z"
      }
    });

    expect(receipt).toMatchObject({
      choice: "continue",
      readiness: "conditional",
      decisionGate: {
        recommendedChoice: "stop",
        selectedChoice: "continue",
        decisionAlignment: "overridden",
        blockedConditionCount: 4
      }
    });
    expect(receipt.decisionGate.overrideWarning).toContain("Continue is not evidence-aligned");
    expect(receipt.exportMarkdown).toContain("## Evidence-aligned decision");
    expect(receipt.exportMarkdown).toContain("Recommended choice: stop");
  });

  it("detects a changed decision receipt payload", () => {
    const receipt = buildBuyerDecisionReceipt({ ...source(), input: { choice: "continue", decidedAt: "2026-06-20T01:00:00.000Z" } });

    const verification = verifyBuyerDecisionReceipt({
      checksum: receipt.checksum,
      payload: {
        ...receipt.payload,
        choice: "stop"
      }
    });

    expect(verification).toMatchObject({
      status: "mismatch",
      expectedChecksum: receipt.checksum
    });
  });

  it("verifies decision receipt requests through the server adapter", () => {
    const receipt = buildBuyerDecisionReceipt({ ...source(), input: { choice: "continue", decidedAt: "2026-06-20T01:00:00.000Z" } });

    const result = verifyBuyerDecisionReceiptRequest({
      checksum: receipt.checksum,
      payload: receipt.payload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "buyer-decision-receipt.verify",
      verification: {
        status: "verified"
      },
      receipt: {
        receiptVersion: "buyer-decision-receipt.v1",
        receiptId: receipt.receiptId,
        choice: "continue",
        readiness: "accepted"
      }
    });
  });

  it("rejects malformed decision receipt verification requests", () => {
    const result = verifyBuyerDecisionReceiptRequest({
      checksum: "not-a-checksum",
      payload: {}
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  it("renders an escaped public receipt page with a decision form and verifier", () => {
    const receipt = buildBuyerDecisionReceipt({
      ...source(),
      input: {
        choice: "revise",
        reviewerName: "Platform <script>alert(1)</script>",
        buyerNote: "Need revised terms <script>alert(2)</script>",
        decidedAt: "2026-06-20T01:00:00.000Z"
      }
    });
    const html = renderBuyerDecisionReceiptHtml(receipt, {
      ...source().links,
      jsonUrl: "https://example.com/api/buyer-decision-receipt?brief=release&agents=market-broker%2Ccloud-run-sre&decision=stop"
    });

    expect(html).toContain("Buyer Decision Receipt");
    expect(html).toContain("Evidence aligned decision");
    expect(html).toContain("Conditions to continue");
    expect(html).toContain("Issue receipt");
    expect(html).toContain("Verify receipt");
    expect(html).toContain(BUYER_DECISION_RECEIPT_VERIFY_PATH);
    expect(html).toContain('type="hidden" name="brief" value="release"');
    expect(html).toContain('type="hidden" name="agents" value="market-broker,cloud-run-sre"');
    expect(html).not.toContain('type="hidden" name="decision" value="stop"');
    expect(html).toContain("Platform &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("Need revised terms <script>alert(2)</script>");
  });
});
