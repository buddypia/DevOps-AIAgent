import { describe, expect, it } from "vitest";
import {
  BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH,
  buildBuyerAcceptancePath,
  buyerAcceptancePathReceiptChecksum,
  renderBuyerAcceptancePathHtml,
  verifyBuyerAcceptancePathReceipt
} from "../src/buyerAcceptancePath";
import { verifyBuyerAcceptancePathReceiptRequest } from "../server/buyerAcceptancePathReceiptVerifier";
import type { AdoptionOperatingPlan } from "../src/adoptionOperatingPlan";
import type { BuyerDecisionFollowUpLedger } from "../src/buyerDecisionFollowUp";
import type { BuyerProcurementDecision } from "../src/buyerProcurementDecision";
import type { BuyerReviewKit } from "../src/buyerReviewKit";
import type { CommercialOffer } from "../src/commercialOffer";

function source(
  overrides: {
    reviewStatus?: "ready" | "repair" | "hold";
    procurementReadiness?: "buy-now" | "pilot-first" | "hold";
    offerReadiness?: "offer-ready" | "needs-redlines" | "blocked";
    adoptionReadiness?: "ready-to-operate" | "needs-owner-commitment" | "blocked";
    followUpStatus?: "ready" | "attention" | "blocked";
    procurementHardTruth?: string;
    decisionRecommendedChoice?: "continue" | "revise" | "stop";
    decisionSelectedChoice?: "continue" | "revise" | "stop";
    decisionAlignment?: "aligned" | "overridden";
    decisionOpenConditionCount?: number;
    decisionBlockedConditionCount?: number;
    decisionWatchConditionCount?: number;
  } = {}
) {
  const reviewStatus = overrides.reviewStatus ?? "ready";
  const procurementReadiness = overrides.procurementReadiness ?? "buy-now";
  const offerReadiness = overrides.offerReadiness ?? "offer-ready";
  const adoptionReadiness = overrides.adoptionReadiness ?? "ready-to-operate";
  const followUpStatus = overrides.followUpStatus ?? "ready";
  const decisionRecommendedChoice = overrides.decisionRecommendedChoice ?? "continue";
  const decisionSelectedChoice = overrides.decisionSelectedChoice ?? "continue";
  const decisionAlignment = overrides.decisionAlignment ?? "aligned";
  const decisionOpenConditionCount = overrides.decisionOpenConditionCount ?? 0;
  const decisionBlockedConditionCount = overrides.decisionBlockedConditionCount ?? 0;
  const decisionWatchConditionCount = overrides.decisionWatchConditionCount ?? 0;
  return {
    reviewKit: {
      status: reviewStatus,
      headline: "Buyer review kit is ready for external approval",
      readyCount: reviewStatus === "ready" ? 4 : 2,
      watchCount: reviewStatus === "repair" ? 2 : 0,
      blockedCount: reviewStatus === "hold" ? 2 : 0,
      steps: [
        { id: "verify-manifest", label: "Verify manifest", status: "ready", evidence: "Digest verified.", action: "Replay digest.", href: "https://example.com/buyer-trust-manifest" },
        { id: "inspect-proof", label: "Inspect proof report", status: "ready", evidence: "Proof verified.", action: "Inspect proof.", href: "https://example.com/buyer-proof-verifier" },
        { id: "record-decision", label: "Record decision", status: "ready", evidence: "Receipt accepted.", action: "Record decision.", href: "https://example.com/buyer-decision-receipt" },
        { id: "assign-follow-up", label: "Assign follow-up", status: "ready", evidence: "Owners assigned.", action: "Assign follow-up.", href: "https://example.com/buyer-decision-follow-up" }
      ],
      primaryAction: {
        id: "record-decision",
        label: "Record decision",
        status: reviewStatus === "hold" ? "blocked" : "ready",
        evidence: "Receipt accepted.",
        action: reviewStatus === "hold" ? "Repair review blockers." : "Attach the decision receipt.",
        href: "https://example.com/buyer-decision-receipt"
      },
      decisionGate: {
        recommendedChoice: decisionRecommendedChoice,
        selectedChoice: decisionSelectedChoice,
        decisionAlignment,
        openConditionCount: decisionOpenConditionCount,
        blockedConditionCount: decisionBlockedConditionCount,
        watchConditionCount: decisionWatchConditionCount,
        blockingSummary:
          decisionOpenConditionCount === 0
            ? "No open evidence condition blocks a clean continue decision."
            : `${decisionBlockedConditionCount} blocked condition(s) prevent a clean continue decision.`,
        overrideWarning:
          decisionAlignment === "aligned"
            ? "Selected decision matches the current evidence state."
            : "Continue is not evidence-aligned. This receipt stays conditional until open conditions are repaired.",
        continueCriteria:
          decisionOpenConditionCount === 0
            ? ["Keep every attached proof link public through the buyer review window."]
            : ["Proof verifier: repair proof verifier blockers.", "Procurement decision: resolve commercial blockers."]
      }
    } as Pick<BuyerReviewKit, "status" | "headline" | "readyCount" | "watchCount" | "blockedCount" | "steps" | "primaryAction" | "decisionGate">,
    procurementDecision: {
      readiness: procurementReadiness,
      score: procurementReadiness === "buy-now" ? 92 : procurementReadiness === "pilot-first" ? 74 : 48,
      headline: "Approve the A2A proof pilot",
      hardTruth: overrides.procurementHardTruth ?? "A2A leads the buying table with enough proof to ask for a paid pilot.",
      targetBuyer: "Platform lead",
      firstCommitmentYen: 900000,
      monthlyValueYen: 2400000,
      paybackDays: 12,
      mutualActionPlan: {
        steps: [
          {
            status: procurementReadiness === "hold" ? "blocked" : procurementReadiness === "pilot-first" ? "watch" : "clear",
            due: "Meeting day",
            buyerOwner: "Platform sponsor",
            a2aOwner: "Buyer proof operator",
            commitment: "Confirm the selected A2A squad beats the alternative buying paths before budget is requested.",
            href: "https://example.com/procurement-decision"
          }
        ]
      },
      decisionContract: {
        approvalAsk: "Approve a 900,000 yen paid proof pilot.",
        decisionGate: "Approve only after proof and owners are attached.",
        stopRules: ["Stop if measured value falls below the accepted floor.", "Stop if public proof is blocked."]
      },
      approvalLadder: []
    } as unknown as Pick<
      BuyerProcurementDecision,
      "readiness" | "score" | "headline" | "hardTruth" | "targetBuyer" | "firstCommitmentYen" | "monthlyValueYen" | "paybackDays" | "mutualActionPlan" | "decisionContract" | "approvalLadder"
    >,
    commercialOffer: {
      readiness: offerReadiness,
      offerScore: offerReadiness === "offer-ready" ? 90 : offerReadiness === "needs-redlines" ? 72 : 42,
      headline: "The commercial offer is ready for buyer review",
      contractAsk: "Proof pilot at 900,000 yen with measured acceptance.",
      approvalMemo: {
        signer: "Platform sponsor",
        summary: "Price, scope, acceptance, trust gates, and renewal criteria are reviewable.",
        sendLine: "Send the commercial offer with proof attached.",
        conditions: [
          {
            id: "budget-cap",
            label: "Budget cap accepted",
            status: offerReadiness === "blocked" ? "blocked" : offerReadiness === "needs-redlines" ? "watch" : "clear",
            owner: "Buyer sponsor",
            evidence: "Budget cap is visible.",
            requiredBefore: "commercial signature"
          }
        ],
        redlineQueue: offerReadiness === "offer-ready" ? [] : [{ id: "budget-cap", label: "Budget cap accepted", status: "watch", owner: "Buyer sponsor", evidence: "Budget cap needs review.", requiredBefore: "commercial signature" }]
      },
      recommendedTierId: "proof-pilot",
      tiers: [{ id: "proof-pilot", label: "Proof pilot", status: "clear", priceYen: 900000, term: "14 days", scope: "One workflow", included: [], buyerValueYen: 2400000, paybackDays: 12, acceptance: "Measured run accepted." }],
      guardrails: [{ id: "budget-cap", label: "Budget cap", status: "clear", owner: "Buyer sponsor", evidence: "Under cap.", rule: "Do not expand beyond the agreed budget cap." }],
      totalFirstCommitmentYen: 900000,
      expectedMonthlyValueYen: 2400000
    } as unknown as Pick<
      CommercialOffer,
      "readiness" | "offerScore" | "headline" | "contractAsk" | "approvalMemo" | "recommendedTierId" | "tiers" | "guardrails" | "totalFirstCommitmentYen" | "expectedMonthlyValueYen"
    >,
    adoptionPlan: {
      readiness: adoptionReadiness,
      planScore: adoptionReadiness === "ready-to-operate" ? 88 : adoptionReadiness === "needs-owner-commitment" ? 70 : 40,
      headline: "The buyer has a real adoption operating plan",
      hardTruth: "A buyer can see cadence, accountable owners, health checks, interventions, and expansion criteria.",
      ownerCommitments: [
        {
          role: "Sponsor",
          owner: "Platform lead",
          commitment: "Own weekly adoption review and expansion approval.",
          artifact: "https://example.com/adoption-plan"
        }
      ],
      approvalAnchors: [
        {
          id: "day-30-review",
          label: "Day 30 review",
          status: adoptionReadiness === "ready-to-operate" ? "clear" : adoptionReadiness === "needs-owner-commitment" ? "watch" : "blocked",
          owner: "Platform lead",
          evidence: "Day 30 review is scheduled.",
          action: "Confirm day 30 review owner.",
          artifact: "Adoption calendar",
          href: "https://example.com/adoption-plan"
        }
      ],
      expansionCriteria: ["Expand only if measured monthly value stays above the renewal floor."],
      operatingCalendar: {}
    } as Pick<AdoptionOperatingPlan, "readiness" | "planScore" | "headline" | "hardTruth" | "ownerCommitments" | "approvalAnchors" | "expansionCriteria" | "operatingCalendar">,
    followUpLedger: {
      status: followUpStatus,
      firstAction: { label: "Open follow-up ledger", href: "https://example.com/buyer-decision-follow-up", external: false },
      readyCount: followUpStatus === "ready" ? 4 : 3,
      taskTotal: 4,
      blockedCount: followUpStatus === "blocked" ? 1 : 0,
      attentionCount: followUpStatus === "attention" ? 1 : 0
    } as Pick<BuyerDecisionFollowUpLedger, "status" | "firstAction" | "readyCount" | "taskTotal" | "blockedCount" | "attentionCount">,
    links: {
      reviewKitUrl: "https://example.com/buyer-review-kit",
      procurementDecisionUrl: "https://example.com/procurement-decision",
      commercialOfferUrl: "https://example.com/commercial-offer",
      adoptionPlanUrl: "https://example.com/adoption-plan",
      followUpUrl: "https://example.com/buyer-decision-follow-up",
      jsonUrl: "https://example.com/api/buyer-acceptance-path",
      markdownUrl: "https://example.com/buyer-acceptance-path.md",
      appUrl: "https://example.com"
    }
  };
}

describe("buyer acceptance path", () => {
  it("builds a go/no-go approval path when review, offer, adoption, and owners are ready", () => {
    const path = buildBuyerAcceptancePath(source());

    expect(path).toMatchObject({
      status: "ready",
      decision: "approve-pilot",
      buyer: "Platform lead",
      firstCommitmentYen: 900000,
      primaryAction: {
        label: "Approve pilot",
        href: "https://example.com/commercial-offer"
      }
    });
    expect(path.stages.map((stage) => stage.id)).toEqual(["external-review", "procurement-case", "commercial-approval", "adoption-operation", "owner-follow-up"]);
    expect(path.readyCount).toBe(5);
    expect(path.receipt).toMatchObject({
      receiptId: expect.stringMatching(/^buyer-acceptance-path-approve-pilot-[a-f0-9]{12}$/),
      checksumAlgorithm: "fnv1a-64",
      verificationApiPath: BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH,
      verification: {
        status: "verified"
      },
      payload: {
        receiptVersion: "buyer-acceptance-path.v1",
        pathId: path.id,
        decision: "approve-pilot",
        buyer: "Platform lead"
      }
    });
    expect(path.receipt.checksum).toBe(buyerAcceptancePathReceiptChecksum(path.receipt.payload));
    expect(JSON.parse(path.receipt.verificationRequestJson)).toMatchObject({
      checksum: path.receipt.checksum,
      payload: {
        pathId: path.id,
        stages: expect.any(Array)
      }
    });
    expect(path.exportMarkdown).toContain("## Acceptance stages");
    expect(path.exportMarkdown).toContain("## Owner commitments");
    expect(path.exportMarkdown).toContain(`POST ${BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH}`);
  });

  it("holds buyer delivery when the external review path is blocked", () => {
    const path = buildBuyerAcceptancePath(
      source({
        reviewStatus: "hold",
        procurementReadiness: "hold",
        offerReadiness: "blocked",
        adoptionReadiness: "blocked",
        followUpStatus: "blocked"
      })
    );

    expect(path.status).toBe("blocked");
    expect(path.decision).toBe("do-not-send");
    expect(path.blockedCount).toBeGreaterThan(0);
    expect(path.primaryAction).toMatchObject({
      label: "Fix External review",
      href: "https://example.com/buyer-review-kit"
    });
    expect(path.summary).toContain("Hold buyer delivery");
  });

  it("blocks acceptance when selected decision overrides stop evidence", () => {
    const path = buildBuyerAcceptancePath(
      source({
        decisionRecommendedChoice: "stop",
        decisionSelectedChoice: "continue",
        decisionAlignment: "overridden",
        decisionOpenConditionCount: 4,
        decisionBlockedConditionCount: 3,
        decisionWatchConditionCount: 1
      })
    );
    const html = renderBuyerAcceptancePathHtml(path, source().links);
    const serverResult = verifyBuyerAcceptancePathReceiptRequest(JSON.parse(path.receipt.verificationRequestJson));

    expect(path.status).toBe("blocked");
    expect(path.decision).toBe("do-not-send");
    expect(path.primaryAction).toMatchObject({
      label: "Fix External review",
      href: "https://example.com/buyer-review-kit"
    });
    expect(path.summary).toContain("decision receipt selected continue, but evidence recommends stop");
    expect(path.stages.find((stage) => stage.id === "external-review")).toMatchObject({
      status: "blocked",
      acceptance: "Acceptance is blocked until the selected decision matches the evidence recommendation and continue criteria are repaired."
    });
    expect(path.receipt.payload.decisionGate).toMatchObject({
      recommendedChoice: "stop",
      selectedChoice: "continue",
      decisionAlignment: "overridden",
      openConditionCount: 4
    });
    expect(serverResult).toMatchObject({
      statusCode: 200,
      body: {
        receipt: {
          decision: "do-not-send",
          decisionRecommendation: "stop",
          selectedDecision: "continue",
          decisionAlignment: "overridden"
        }
      }
    });
    expect(path.exportMarkdown).toContain("## Decision gate");
    expect(path.exportMarkdown).toContain("Evidence recommendation: stop");
    expect(path.exportMarkdown).toContain("## Continue criteria");
    expect(html).toContain("Decision gate");
    expect(html).toContain("Recommended stop, selected continue");
    expect(html).toContain("Conditions to continue");
  });

  it("adds a verified buyer reply as an execution gate", () => {
    const base = source();
    const path = buildBuyerAcceptancePath({
      ...base,
      replyRecord: {
        status: "verified",
        verified: true,
        receiptType: "quick-buyer-decision-reply-record.v1",
        receiptLabel: "Buyer reply record",
        decision: "continue",
        checksum: "ec20df22",
        buyer: "Platform release lead",
        confidence: 94,
        sourceVerifierApiPath: "/api/quick-buyer-decision-reply-record/verify",
        verifierUrl: "https://example.com/receipt-verifier?request=reply&verify=1",
        nextAction: "Open the launch room and start the day 0 kickoff."
      },
      links: {
        ...base.links,
        replyRecordVerifierUrl: "https://example.com/receipt-verifier?request=reply&verify=1"
      }
    });
    const html = renderBuyerAcceptancePathHtml(path, {
      ...base.links,
      replyRecordVerifierUrl: "https://example.com/receipt-verifier?request=reply&verify=1"
    });

    expect(path.status).toBe("ready");
    expect(path.decision).toBe("approve-pilot");
    expect(path.stages.map((stage) => stage.id)).toEqual(["external-review", "buyer-reply", "procurement-case", "commercial-approval", "adoption-operation", "owner-follow-up"]);
    expect(path.stages.find((stage) => stage.id === "buyer-reply")).toMatchObject({
      status: "accepted",
      owner: "Platform release lead",
      href: "https://example.com/receipt-verifier?request=reply&verify=1"
    });
    expect(path.ownerCommitments[0]).toMatchObject({
      role: "Buyer reply",
      owner: "Platform release lead"
    });
    expect(path.receipt.payload.replyRecord).toMatchObject({
      status: "verified",
      verified: true,
      decision: "continue",
      checksum: "ec20df22"
    });
    expect(path.receipt.payload.stages.map((stage) => stage.id)).toEqual(["external-review", "buyer-reply", "procurement-case", "commercial-approval", "adoption-operation", "owner-follow-up"]);
    expect(path.receipt.payload.stages.find((stage) => stage.id === "buyer-reply")?.href).toContain("omitted-from-receipt-payload");
    expect(path.receipt.verificationRequestJson).not.toContain("request=reply");
    expect(path.acceptanceMinutes).toBe(20);
    expect(path.exportMarkdown).toContain("Buyer reply");
    expect(html).toContain("Reply receipt");
    expect(html).toContain("Verify path");
    expect(html).toContain("The verified buyer reply approves moving from review into pilot execution.");
  });

  it("adds verified buyer validation answers as an approval stage", () => {
    const base = source();
    const path = buildBuyerAcceptancePath({
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
    const html = renderBuyerAcceptancePathHtml(path, {
      ...base.links,
      validationAnswerRecordVerifierUrl: "https://example.com/receipt-verifier?request=answers&verify=1"
    });

    expect(path.status).toBe("ready");
    expect(path.stages.map((stage) => stage.id)).toEqual(["external-review", "buyer-validation", "procurement-case", "commercial-approval", "adoption-operation", "owner-follow-up"]);
    expect(path.stages.find((stage) => stage.id === "buyer-validation")).toMatchObject({
      status: "accepted",
      owner: "Platform release lead",
      href: "https://example.com/receipt-verifier?request=answers&verify=1"
    });
    expect(path.ownerCommitments[0]).toMatchObject({
      role: "Buyer validation",
      owner: "Platform release lead"
    });
    expect(path.receipt.payload.validationAnswerRecord).toMatchObject({
      status: "verified",
      verified: true,
      answerStatus: "ready",
      answeredCount: 5,
      totalCount: 5,
      checksum: "feed1234"
    });
    expect(path.receipt.payload.stages.find((stage) => stage.id === "buyer-validation")?.href).toContain("omitted-from-receipt-payload");
    expect(path.receipt.verificationRequestJson).not.toContain("request=answers");
    expect(verifyBuyerAcceptancePathReceiptRequest(JSON.parse(path.receipt.verificationRequestJson))).toMatchObject({
      statusCode: 200,
      body: {
        receipt: {
          validationAnswerStatus: "ready",
          validationAnswerVerified: true
        }
      }
    });
    expect(path.acceptanceMinutes).toBe(21);
    expect(path.exportMarkdown).toContain("Buyer validation");
    expect(html).toContain("Answers");
    expect(html).toContain("The five buyer validation answers are evidenced and can support the pilot decision.");
  });

  it("keeps acceptance in sponsor review when validation answers need proof review", () => {
    const base = source();
    const path = buildBuyerAcceptancePath({
      ...base,
      validationAnswerRecord: {
        status: "verified",
        verified: true,
        receiptType: "quick-buyer-validation-answer-record.v1",
        receiptLabel: "Buyer validation answer record",
        answerStatus: "watch",
        checksum: "feed1234",
        buyer: "Platform release lead",
        confidence: 61,
        answeredCount: 3,
        totalCount: 5,
        verifierUrl: "https://example.com/receipt-verifier?request=answers&verify=1",
        nextAction: "Proof owner: close public proof gaps before buyer approval."
      }
    });

    expect(path.status).toBe("review");
    expect(path.decision).toBe("sponsor-review");
    expect(path.primaryAction).toMatchObject({
      label: "Review Buyer validation",
      href: "https://example.com/receipt-verifier?request=answers&verify=1",
      owner: "Platform release lead"
    });
    expect(path.stages.find((stage) => stage.id === "buyer-validation")).toMatchObject({
      status: "review",
      action: "Proof owner: close public proof gaps before buyer approval."
    });
  });

  it("verifies and rejects changed acceptance path receipt payloads", () => {
    const path = buildBuyerAcceptancePath(source());

    const verification = verifyBuyerAcceptancePathReceipt({
      checksum: path.receipt.checksum,
      payload: path.receipt.payload
    });
    const changedVerification = verifyBuyerAcceptancePathReceipt({
      checksum: path.receipt.checksum,
      payload: {
        ...path.receipt.payload,
        decision: "do-not-send"
      }
    });
    const serverResult = verifyBuyerAcceptancePathReceiptRequest(JSON.parse(path.receipt.verificationRequestJson));

    expect(verification).toMatchObject({
      status: "verified",
      actualChecksum: path.receipt.checksum
    });
    expect(changedVerification).toMatchObject({
      status: "mismatch",
      expectedChecksum: path.receipt.checksum
    });
    expect(serverResult).toMatchObject({
      statusCode: 200,
      body: {
        skill: "buyer-acceptance-path.receipt.verify",
        verification: {
          status: "verified"
        },
        receipt: {
          receiptVersion: "buyer-acceptance-path.v1",
          pathId: path.id,
          decision: "approve-pilot",
          buyer: "Platform lead",
          stageCount: 5
        }
      }
    });
  });

  it("renders escaped acceptance HTML with artifact links", () => {
    const path = buildBuyerAcceptancePath(source({ procurementHardTruth: "A2A proof is clean <script>alert(1)</script>" }));
    const html = renderBuyerAcceptancePathHtml(path, source().links);

    expect(html).toContain("Buyer Acceptance Path");
    expect(html).toContain("https://example.com/api/buyer-acceptance-path");
    expect(html).toContain("Approve pilot");
    expect(html).toContain("Receipt JSON");
    expect(html).toContain("Verify path");
    expect(html).toContain("A2A proof is clean &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("A2A proof is clean <script>alert(1)</script>");
  });
});
