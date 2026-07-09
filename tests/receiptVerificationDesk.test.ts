import { describe, expect, test } from "vitest";
import {
  RECEIPT_VERIFICATION_DESK_API_PATH,
  renderReceiptVerificationDeskHtml,
  verifyReceiptVerificationDeskRequest
} from "../server/receiptVerificationDesk";
import { buyerAcceptancePathReceiptChecksum, type BuyerAcceptancePathReceiptPayload } from "../src/buyerAcceptancePath";
import { buildBuyerDecisionFollowUpLedger } from "../src/buyerDecisionFollowUp";
import { buildBuyerDecisionReceipt } from "../src/buyerDecisionReceipt";
import { buildBuyerDecisionAgendaSnapshot, type BuyerDecisionAgendaBuildInput } from "../src/buyerDecisionAgenda";
import { buyerProofPacketReceiptDigest, type BuyerProofPacketReceiptPayload } from "../src/buyerProofPacket";
import { buyerTrustManifestReceiptDigest, type BuyerTrustManifestPayload } from "../src/buyerTrustManifest";
import {
  QUICK_BUYER_DECISION_REPLY_RECORD_RECEIPT_VERSION,
  quickBuyerDecisionReplyRecordChecksum,
  type QuickBuyerDecisionReplyRecordPayload
} from "../src/quickBuyerDecisionReplyRecordReceipt";
import {
  QUICK_EXTERNAL_REVIEW_PACKET_RECEIPT_VERSION,
  quickExternalReviewPacketManifestChecksum
} from "../server/quickExternalReviewPacketReceiptVerifier";
import {
  QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION,
  quickExternalReviewDecisionReceiptChecksum,
  type QuickExternalReviewDecisionReceiptPayload
} from "../src/quickExternalReviewDecisionReceipt";
import {
  QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERSION,
  quickExternalReviewOwnerPacketReceiptChecksum,
  type QuickExternalReviewOwnerPacketReceiptPayload
} from "../src/quickExternalReviewOwnerPacketReceipt";
import {
  QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERSION,
  quickBuyerEvidenceResponseOwnerPacketReceiptChecksum,
  type QuickBuyerEvidenceResponseOwnerPacketReceiptPayload
} from "../src/quickBuyerEvidenceResponseOwnerPacketReceipt";
import {
  globalPublishabilityRepairCheckReceiptChecksum,
  type GlobalPublishabilityRepairCheckReceiptPayload
} from "../server/globalPublishabilityRepairCheckReceipt";

function trustManifestPayload(): BuyerTrustManifestPayload {
  return {
    manifestVersion: "buyer-trust-manifest.v1",
    subject: "A2A buyer proof room",
    generatedAt: "2026-06-20T01:00:00.000Z",
    readiness: "external-ready",
    score: 94,
    proofPacketReceiptDigest: "1234567890abcdef",
    buyerEvidenceBoardReceiptChecksum: "abcdef1234567890",
    commercialOfferReceiptChecksum: "fedcba0987654321",
    sponsorDecisionReceiptId: "decision-receipt-send",
    adoptionPlanId: "adoption-plan-ready",
    trustCenterId: "trust-center-ready",
    commercialOfferId: "commercial-offer-ready",
    artifacts: [
      {
        id: "value-report",
        status: "pass",
        href: "https://example.com/buyer-value",
        evidence: "Buyer value report is public."
      },
      {
        id: "proof-packet",
        status: "pass",
        href: "https://example.com/buyer-proof-packet",
        evidence: "Proof packet receipt is attached."
      }
    ],
    publicationWindow: {
      status: "current",
      proofExpiresAt: "2026-06-27T01:00:00.000Z",
      manifestExpiresAt: "2026-06-27T01:00:00.000Z",
      buyerReviewDueAt: "2026-06-24T01:00:00.000Z",
      schedule: [
        {
          id: "live-proof-recheck",
          status: "pass",
          dueAt: "2026-06-21T01:00:00.000Z",
          href: "https://example.com/buyer-proof-audit",
          action: "Re-run public proof verification."
        }
      ]
    }
  };
}

function proofPacketPayload(): BuyerProofPacketReceiptPayload {
  return {
    manifestVersion: "buyer-proof-packet.v1",
    packetId: "buyer-proof-packet-share-ready-91",
    readiness: "share-ready",
    packetScore: 91,
    headline: "Buyer proof packet is ready to share",
    targetBuyer: "Platform lead",
    decisionAsk: "Share this packet with the buyer sponsor.",
    coveredArtifacts: ["value-report", "proposal", "workflow", "receipt", "decision", "agreement", "review", "ledger", "diligence", "execution"],
    sourceScores: {
      recommendation: 92,
      valueBlueprint: 90,
      buyerScenario: 91,
      proposal: 90,
      ledger: 92,
      diligence: 90,
      sponsorReview: 93,
      evidenceRows: 91
    },
    rows: [
      {
        id: "buyer-outcome",
        status: "clear",
        owner: "A2A Market Broker",
        artifactId: "value-report",
        claim: "Buyer can inspect modeled value.",
        evidence: "91/100 buyer value score.",
        nextAction: "Keep the value report attached."
      }
    ],
    gaps: [],
    realityChecks: [
      {
        label: "Modeled value",
        value: "112h/month, 1,344,000 yen",
        source: "Buyer value report"
      }
    ]
  };
}

function readyAgendaInput(): BuyerDecisionAgendaBuildInput {
  const action = { label: "Open buyer room", href: "https://example.com/buyer-room", external: false };
  return {
    proofChain: {
      status: "ready",
      verdict: "send",
      score: 96,
      primaryAction: action
    },
    publicDecisionPath: {
      status: "ready",
      decision: "send-to-buyer",
      headline: "Public buyer path is ready",
      buyerLine: "Platform lead can approve the first workflow pilot.",
      firstAction: action,
      guardrails: ["Do not send if public proof is blocked.", "Do not expand without a measured run."]
    },
    pilotContract: {
      status: "ready",
      buyer: "Platform lead",
      pilotOffer: "30-day release-readiness pilot",
      firstCommitmentYen: 900000,
      expectedMonthlyValueYen: 2400000,
      paybackDays: 12,
      proofLine: "Live proof, receipt, and trust manifest are attached.",
      stopRule: "Stop if measured acceptance falls below 70%.",
      firstAction: action,
      sendNote: {
        status: "ready",
        subject: "Approve 30-day release-readiness pilot",
        instruction: "Send with proof attached.",
        body: ["Please review the attached proof room."]
      }
    },
    trustSnapshot: {
      status: "ready",
      trustScore: 100,
      headline: "Buyer trust is ready for external review",
      dataBoundary: "Public or synthetic data only",
      firstAction: { label: "Open trust manifest", href: "https://example.com/buyer-trust-manifest", external: false }
    },
    commercialOffer: {
      status: "ready",
      recommendedTier: "Pilot",
      firstCommitmentYen: 900000,
      expectedMonthlyValueYen: 2400000,
      paybackDays: 12,
      contractLine: "Pilot tier at 900,000 yen with measured acceptance.",
      firstAction: action
    }
  };
}

function decisionReceiptRequest() {
  const receipt = buildBuyerDecisionReceipt({
    procurementDecision: {
      id: "buyer-procurement-buy-now-92-a2a",
      readiness: "buy-now",
      score: 92,
      headline: "Approve the A2A proof pilot",
      targetBuyer: "Platform lead",
      firstCommitmentYen: 900000,
      monthlyValueYen: 2400000,
      paybackDays: 12,
      decisionContract: {
        readiness: "ready-to-sign",
        approvalAsk: "Approve a 900,000 yen paid proof pilot.",
        clearClauseCount: 4,
        clauseCount: 4
      }
    },
    proofVerifier: {
      status: "verified",
      score: 100,
      actualDigest: "a1b2c3d4e5f60789",
      headline: "Buyer proof can be trusted",
      nextActions: ["Attach this verifier report to the buyer room."]
    },
    trustManifest: {
      id: "buyer-trust-manifest-external-ready-92-a1b2c3d4",
      verification: {
        digest: "a1b2c3d4e5f60789"
      }
    },
    followUpLedger: {
      status: "ready",
      headline: "Decision follow-up is ready to send",
      firstAction: {
        label: "Open follow-up ledger",
        href: "https://example.com/buyer-decision-follow-up",
        external: false
      },
      readyCount: 4,
      taskTotal: 4,
      blockedCount: 0,
      attentionCount: 0
    },
    input: {
      choice: "continue",
      reviewerName: "Platform sponsor",
      buyerNote: "Approved for the paid proof pilot.",
      decidedAt: "2026-06-20T01:00:00.000Z"
    }
  });
  return JSON.parse(receipt.verificationRequestJson) as { checksum: string; payload: typeof receipt.payload };
}

function followUpReceiptRequest() {
  const receipt = buildBuyerDecisionFollowUpLedger(buildBuyerDecisionAgendaSnapshot(readyAgendaInput())).receipt;
  return JSON.parse(receipt.verificationRequestJson) as { checksum: string; payload: typeof receipt.payload };
}

function replyRecordReceiptRequest() {
  const payload: QuickBuyerDecisionReplyRecordPayload = {
    receiptVersion: QUICK_BUYER_DECISION_REPLY_RECORD_RECEIPT_VERSION,
    status: "watch",
    decision: "revise",
    label: "Revision recorded",
    headline: "Platform sponsor requested proof repair before approval",
    buyer: "Platform release lead",
    confidence: 96,
    buyerReply: "Please revise before approval. The walkthrough video proof is missing.",
    matchedSignals: ["revise", "before", "missing"],
    nextOwner: "Proof owner",
    nextAction: "Repair the missing walkthrough proof and re-export the buyer one-pager.",
    proof: "Reply names missing proof before approval.",
    onePagerReceiptId: "quick-buyer-one-pager-watch-12345678",
    onePagerChecksum: "fnv1a32:12345678",
    activation: {
      mode: "proof-repair",
      status: "watch",
      label: "Proof repair work order",
      recommendedReply: "revise",
      sourceReceiptId: "quick-buyer-one-pager-watch-12345678",
      sourceChecksum: "fnv1a32:12345678",
      primaryHref: "#quick-workflow-source-trace",
      primaryLabel: "Source trace",
      items: [
        {
          id: "walkthrough-video",
          label: "Walkthrough video",
          status: "watch",
          owner: "Proof owner",
          command: "Publish the walkthrough video proof before forwarding approval.",
          evidence: "Buyer reply and source trace",
          href: "#quick-workflow-source-trace"
        }
      ]
    }
  };

  return {
    checksum: quickBuyerDecisionReplyRecordChecksum(payload),
    payload
  };
}

function acceptancePathReceiptRequest() {
  const payload: BuyerAcceptancePathReceiptPayload = {
    receiptVersion: "buyer-acceptance-path.v1",
    pathId: "buyer-acceptance-path-approve-pilot-1234567890",
    status: "ready",
    decision: "approve-pilot",
    headline: "Platform lead has a go/no-go path for approval",
    summary: "External review, buyer reply, procurement case, commercial offer, adoption operation, and owner follow-up are aligned.",
    buyer: "Platform lead",
    score: 94,
    readyCount: 2,
    reviewCount: 0,
    blockedCount: 0,
    firstCommitmentYen: 900000,
    expectedMonthlyValueYen: 2400000,
    paybackDays: 12,
    decisionGate: {
      recommendedChoice: "continue",
      selectedChoice: "continue",
      decisionAlignment: "aligned",
      openConditionCount: 0,
      blockedConditionCount: 0,
      watchConditionCount: 0,
      blockingSummary: "No open evidence condition blocks a clean continue decision.",
      overrideWarning: "Selected decision matches the current evidence state.",
      continueCriteria: ["Keep every attached proof link public through the buyer review window."]
    },
    replyRecord: {
      status: "verified",
      verified: true,
      receiptType: "quick-buyer-decision-reply-record.v1",
      decision: "continue",
      checksum: "abcdef1234567890"
    },
    primaryAction: {
      label: "Approve pilot",
      href: "https://example.com/commercial-offer",
      owner: "Platform lead",
      due: "Meeting close"
    },
    stages: [
      {
        id: "external-review",
        label: "External review",
        status: "accepted",
        owner: "External reviewer",
        due: "Meeting start",
        evidence: "Review kit is ready.",
        acceptance: "Trust manifest, proof verifier, decision receipt, and follow-up ledger are inspected.",
        action: "Open review kit.",
        href: "https://example.com/buyer-review-kit"
      },
      {
        id: "buyer-reply",
        label: "Buyer reply",
        status: "accepted",
        owner: "Platform release lead",
        due: "Before pilot approval",
        evidence: "Verified continue reply.",
        acceptance: "Buyer reply approves moving from review into pilot execution.",
        action: "Open launch room.",
        href: "https://example.com/receipt-verifier?request=reply&verify=1"
      }
    ],
    ownerCommitments: [
      {
        role: "Buyer reply",
        owner: "Platform release lead",
        commitment: "continue reply verified. Open launch room.",
        artifact: "https://example.com/receipt-verifier?request=reply&verify=1"
      }
    ],
    guardrails: ["Stop if measured value falls below the accepted floor."]
  };

  return {
    checksum: buyerAcceptancePathReceiptChecksum(payload),
    payload
  };
}

function externalReviewPacketManifest() {
  const manifest = {
    receiptVersion: QUICK_EXTERNAL_REVIEW_PACKET_RECEIPT_VERSION as typeof QUICK_EXTERNAL_REVIEW_PACKET_RECEIPT_VERSION,
    receiptId: "quick-external-review-blocked-00000000",
    checksumAlgorithm: "fnv1a32" as const,
    checksum: "00000000",
    payloadChecksum: "00000000",
    status: "blocked" as const,
    clearance: "internal-only" as const,
    buyer: "Platform lead",
    score: 86,
    readyCount: 0,
    totalCount: 1,
    sendRule: "Keep internal until Proof freshness is ready.",
    nextAction: "Run live proof verification before public sharing.",
    generatedFrom: ["global publishability gates", "proof freshness window"],
    artifacts: [
      {
        id: "proof-freshness" as const,
        label: "Proof freshness",
        status: "blocked" as const,
        role: "Live proof window",
        evidence: "Live proof verification has not issued a fresh receipt.",
        href: "#quick-live-proof-audit",
        contentKind: "markdown" as const,
        contentChecksum: "12345678",
        contentLength: 480,
        requiredOrder: 1
      }
    ],
    sourceReceipts: [{ label: "Review packet source", value: "quick-buyer-one-pager-blocked-12345678 / fnv1a32:12345678" }]
  };
  const checksum = quickExternalReviewPacketManifestChecksum(manifest);

  return {
    ...manifest,
    receiptId: `quick-external-review-blocked-${checksum}`,
    checksum,
    payloadChecksum: checksum
  };
}

function externalReviewDecisionReceiptRequest() {
  const payload: QuickExternalReviewDecisionReceiptPayload = {
    receiptVersion: QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION,
    decision: "revise",
    status: "watch",
    label: "External review revision",
    reviewerName: "External reviewer",
    reviewerNote: "Hold until live proof is refreshed.",
    buyer: "Platform lead",
    generatedAt: "2026-06-25T00:00:00.000Z",
    manifestReceiptId: "quick-external-review-blocked-12345678",
    manifestChecksum: "fnv1a32:12345678",
    packetStatus: "blocked",
    packetClearance: "internal-only",
    testsReady: 1,
    testsTotal: 6,
    confidence: 52,
    reviewOutcome: "Do not send this packet",
    nextAction: "Refresh live proof before requesting another review.",
    proof: "Packet verifier verified; manifest quick-external-review-blocked-12345678; 1/6 acceptance tests ready."
  };

  return {
    checksum: quickExternalReviewDecisionReceiptChecksum(payload),
    payload
  };
}

function externalReviewOwnerPacketReceiptRequest() {
  const payload: QuickExternalReviewOwnerPacketReceiptPayload = {
    receiptVersion: QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERSION,
    status: "blocked",
    label: "Stop preserved",
    buyer: "Platform lead",
    owner: "Review coordinator",
    nextAction: "Stop external sharing and repair the rendered packet before requesting another review.",
    manifestReceiptId: "quick-external-review-blocked-12345678",
    manifestChecksum: "fnv1a32:12345678",
    responseReceiptChecksum: "fnv1a32:abcdef12",
    reviewerLine: "External reviewer / 2026-06-25T00:00:00.000Z",
    acceptanceCriteria: [
      "Do not send this packet to another external reviewer until the repair is complete.",
      "Regenerate the external review packet and verify the new manifest before requesting another reviewer response."
    ],
    runbook: [
      {
        id: "repair-target",
        label: "Repair target",
        owner: "Review coordinator",
        window: "Before re-review",
        action: "Refresh live proof before requesting another review.",
        evidence: "quick-external-review-blocked-12345678",
        proof: "fnv1a32:12345678",
        status: "blocked"
      }
    ],
    followUpLedger: {
      status: "blocked",
      headline: "Reviewer stop becomes a no-send ledger",
      summary: "1 owner task carries the reviewer response into repair work.",
      readyCount: 0,
      watchCount: 0,
      blockedCount: 1,
      taskTotal: 1,
      firstDueLabel: "+1 business day",
      calendarStartDate: "2026-06-25",
      calendarEndDate: "2026-06-26",
      tasks: [
        {
          id: "repair-target",
          label: "Repair target",
          status: "blocked",
          owner: "Review coordinator",
          dueLabel: "+1 business day",
          action: "Refresh live proof before requesting another review.",
          closeCondition: "Review coordinator clears the blocker before another reviewer receives the packet.",
          evidence: "quick-external-review-blocked-12345678",
          proof: "fnv1a32:12345678",
          href: "/receipt-verifier?requestKey=quick-external-review-blocked-12345678"
        }
      ],
      csv: "taskId,label,status,owner,due,action,closeCondition,evidence,proof,href\nrepair-target,Repair target,blocked,Review coordinator,+1 business day,Refresh live proof before requesting another review.,Review coordinator clears the blocker before another reviewer receives the packet.,quick-external-review-blocked-12345678,fnv1a32:12345678,/receipt-verifier?requestKey=quick-external-review-blocked-12345678",
      calendarText: "BEGIN:VCALENDAR\r\nEND:VCALENDAR",
      exportMarkdown: "# External review response follow-up ledger\n\n- [blocked] Repair target"
    },
    ownerPacketMarkdown: "# External review owner packet\n\nOwner: Review coordinator",
    regenerationNote: "Buyer: Platform lead\nRepair target: Proof freshness",
    proof: "Owner packet generated from a verified external review response."
  };

  return {
    checksum: quickExternalReviewOwnerPacketReceiptChecksum(payload),
    payload
  };
}

function buyerEvidenceResponseOwnerPacketReceiptRequest() {
  const payload: QuickBuyerEvidenceResponseOwnerPacketReceiptPayload = {
    receiptVersion: QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERSION,
    status: "watch",
    state: "verified",
    label: "Request repairs",
    buyer: "Platform release lead",
    owner: "Proof owner",
    nextAction: "Fix Public proof repair",
    evidenceReceiptId: "quick-conversion-watch-12345678",
    evidenceChecksum: "fnv1a32:12345678",
    responseReceiptChecksum: "fnv1a32:abcdef12",
    reviewerLine: "Platform sponsor / 2026-06-25T00:00:00.000Z",
    runbook: [
      {
        id: "repair-required-evidence",
        label: "Repair required evidence",
        owner: "Proof owner",
        window: "Before buyer send",
        action: "Fix Public proof repair",
        evidence: "1/6 required artifacts ready",
        proof: "/receipt-verifier",
        status: "watch"
      }
    ],
    ownerPacketMarkdown: "# Buyer evidence response owner packet\n\nOwner: Proof owner",
    proof: "Owner packet generated from a returned buyer evidence response."
  };

  return {
    checksum: quickBuyerEvidenceResponseOwnerPacketReceiptChecksum(payload),
    payload
  };
}

function repairCheckReceiptRequest() {
  const payload: GlobalPublishabilityRepairCheckReceiptPayload = {
    receiptVersion: "global-publishability-repair-check.v1",
    reportId: "global-publishability-do-not-publish-1234567890ab",
    sourceReceiptDecision: "do-not-publish",
    sourceReceiptChecksum: "1234567890abcdef",
    checkedAt: "2026-06-25T03:00:00.000Z",
    status: "blocked",
    decision: "no-send",
    summary: "Live reachability still needs one more public proof URL for this proof slot.",
    nextAction: "Do not send externally. Attach the missing public proof, then check this repair again.",
    requiredProofCount: 3,
    suppliedProofCount: 2,
    missingProofCount: 1,
    verifiedCount: 2,
    watchCount: 0,
    blockedCount: 0,
    score: 67,
    step: {
      id: "repair-live-reachability",
      ticketId: "ticket-live-reachability",
      sequence: 1,
      priority: "now",
      status: "block",
      owner: "Launch owner",
      title: "Repair live reachability",
      proofSlot: "HTTPS product URL, ProtoPedia/story URL, walkthrough URL, and public receipt URLs.",
      proofRequirements: [
        {
          id: "targetUrl",
          label: "Live product",
          kind: "product-url",
          required: true,
          placeholder: "https://service.example/app",
          description: "Public product URL reviewers can open."
        },
        {
          id: "protopediaUrl",
          label: "ProtoPedia story",
          kind: "story-url",
          required: true,
          placeholder: "https://protopedia.net/prototype/...",
          description: "Published ProtoPedia page."
        },
        {
          id: "videoUrl",
          label: "Walkthrough video",
          kind: "video-url",
          required: true,
          placeholder: "https://youtu.be/...",
          description: "Public demo walkthrough."
        }
      ],
      acceptanceSignal: "Every required public proof URL verifies as pass.",
      recheckSignal: "global publishability rerun shows live reachability pass.",
      shareGate: "External sharing stays locked until this step verifies."
    },
    proofSummary: {
      checkedAt: "2026-06-25T03:00:00.000Z",
      verifiedCount: 2,
      totalCount: 2,
      score: 100
    },
    proofResults: [
      {
        id: "targetUrl",
        label: "Live product",
        url: "https://launch.opsbridge.ai/app",
        status: "pass",
        httpStatus: 200,
        finalUrl: "https://launch.opsbridge.ai/app",
        contentType: "text/html",
        evidence: "Public URL responded with HTTP 200.",
        action: "Keep this link attached to the launch room."
      },
      {
        id: "protopediaUrl",
        label: "ProtoPedia story",
        url: "https://protopedia.net/prototype/opsbridge",
        status: "pass",
        httpStatus: 200,
        finalUrl: "https://protopedia.net/prototype/opsbridge",
        contentType: "text/html",
        evidence: "Public URL responded with HTTP 200.",
        action: "Keep this link attached to the launch room."
      }
    ]
  };

  return {
    checksum: globalPublishabilityRepairCheckReceiptChecksum(payload),
    payload
  };
}

describe("receipt verification desk", () => {
  test("dispatches a valid buyer trust manifest receipt to its strict verifier", () => {
    const payload = trustManifestPayload();
    const digest = buyerTrustManifestReceiptDigest(payload);

    const result = verifyReceiptVerificationDeskRequest({ digest, payload });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "receipt-verifier.dispatch",
      status: "verified",
      verified: true,
      receiptType: "buyer-trust-manifest.v1",
      receiptLabel: "Buyer trust manifest",
      proofField: "digest",
      sourceVerifierApiPath: "/api/buyer-trust-manifest/receipt/verify",
      nativeSkill: "buyer-trust-manifest.receipt.verify",
      verification: {
        status: "verified",
        expectedDigest: digest,
        actualDigest: digest
      },
      summary: {
        subject: "A2A buyer proof room",
        readiness: "external-ready",
        artifactCount: 2
      },
      handoff: {
        decision: "accept-for-review",
        title: "Receipt can move into review",
        memoMarkdown: expect.stringContaining("Decision: accept-for-review")
      }
    });
    expect(result.body.supportedReceipts.map((receipt) => receipt.receiptType)).toEqual([
      "homepage-outcome-artifact.v1",
      "homepage-outcome-spine.v1",
      "homepage-value-lens.v1",
      "hero-outcome-replay.v1",
      "global-publishability.v1",
      "global-publishability-repair-check.v1",
      "global-publishability-review-response.v1",
      "quick-workflow-conversion.v1",
      "quick-workflow-value-acceptance-contract.v1",
      "quick-workflow-pilot-run-log.v1",
      "quick-workflow-pilot-decision-brief.v1",
      "quick-workflow-pilot-expansion-guardrail.v1",
      "quick-workflow-buyer-expansion-handoff.v1",
      "quick-workflow-buyer-expansion-handoff-signoff.v1",
      "quick-public-value-release.v1",
      "buyer-proof-packet.v1",
      "buyer-evidence-board.v1",
      "buyer-trust-manifest.v1",
      "buyer-decision-receipt.v1",
      "quick-buyer-decision-reply-record.v1",
      "quick-buyer-validation-answer-record.v1",
      "quick-value-realization-closeout.v1",
      "quick-value-realization-closeout-repair.v1",
      "quick-value-realization-acceptance.v1",
      "buyer-value-acceptance.v1",
      "quick-value-review-execution.v1",
      "quick-value-review-execution-closeout.v1",
      "quick-workflow-buyer-expansion-recheck-closeout.v1",
      "workflow-live-proof-audit.v1",
      "submission-final-submit-live-receipt.v1",
      "quick-buyer-evidence-response-owner-packet.v1",
      "quick-buyer-evidence-adoption-risk-disposition.v1",
      "quick-buyer-evidence-adoption-risk-owner-closeout.v1",
      "quick-buyer-evidence-adoption-risk-send-control.v1",
      "quick-buyer-evidence-value-checkpoint.v1",
      "quick-buyer-evidence-value-owner-closeout.v1",
      "quick-external-review-packet.v1",
      "quick-external-review-decision.v1",
      "quick-external-review-owner-packet.v1",
      "buyer-acceptance-path.v1",
      "buyer-decision-follow-up.v1",
      "commercial-offer.v1",
      "buyer-pilot-contract.v1"
    ]);
  });

  test("dispatches buyer approval loop receipts used by the review kit", () => {
    const decisionResult = verifyReceiptVerificationDeskRequest(decisionReceiptRequest());
    const replyRecordResult = verifyReceiptVerificationDeskRequest(replyRecordReceiptRequest());
    const buyerEvidenceOwnerPacketResult = verifyReceiptVerificationDeskRequest(buyerEvidenceResponseOwnerPacketReceiptRequest());
    const externalReviewPacketResult = verifyReceiptVerificationDeskRequest({ manifest: externalReviewPacketManifest() });
    const externalReviewDecisionResult = verifyReceiptVerificationDeskRequest(externalReviewDecisionReceiptRequest());
    const externalReviewOwnerPacketResult = verifyReceiptVerificationDeskRequest(externalReviewOwnerPacketReceiptRequest());
    const acceptancePathResult = verifyReceiptVerificationDeskRequest(acceptancePathReceiptRequest());
    const followUpResult = verifyReceiptVerificationDeskRequest(followUpReceiptRequest());
    const repairCheckResult = verifyReceiptVerificationDeskRequest(repairCheckReceiptRequest());

    expect(decisionResult).toMatchObject({
      statusCode: 200,
      body: {
        status: "verified",
        receiptType: "buyer-decision-receipt.v1",
        receiptLabel: "Buyer decision receipt",
        sourceVerifierApiPath: "/api/buyer-decision-receipt/verify",
        nativeSkill: "buyer-decision-receipt.verify",
        summary: {
          choice: "continue",
          readiness: "accepted",
          targetBuyer: "Platform lead"
        }
      }
    });
    expect(replyRecordResult).toMatchObject({
      statusCode: 200,
      body: {
        status: "verified",
        receiptType: "quick-buyer-decision-reply-record.v1",
        receiptLabel: "Buyer reply record",
        sourceVerifierApiPath: "/api/quick-buyer-decision-reply-record/verify",
        nativeSkill: "quick-buyer-decision-reply-record.receipt.verify",
        summary: {
          decision: "revise",
          status: "watch",
          buyer: "Platform release lead"
        }
      }
    });
    expect(buyerEvidenceOwnerPacketResult).toMatchObject({
      statusCode: 200,
      body: {
        status: "verified",
        receiptType: "quick-buyer-evidence-response-owner-packet.v1",
        receiptLabel: "Buyer evidence response owner packet",
        sourceVerifierApiPath: "/api/quick-buyer-evidence-response-owner-packet/verify",
        nativeSkill: "quick-buyer-evidence-response-owner-packet.receipt.verify",
        summary: {
          receiptVersion: "quick-buyer-evidence-response-owner-packet.v1",
          status: "watch",
          state: "verified",
          label: "Request repairs",
          buyer: "Platform release lead",
          owner: "Proof owner",
          evidenceReceiptId: "quick-conversion-watch-12345678",
          responseReceiptChecksum: "fnv1a32:abcdef12",
          runbookItemCount: 1,
          runbook: [
            expect.objectContaining({
              id: "repair-required-evidence",
              owner: "Proof owner",
              status: "watch",
              action: "Fix Public proof repair"
            })
          ]
        }
      }
    });
    expect(externalReviewPacketResult).toMatchObject({
      statusCode: 200,
      body: {
        status: "verified",
        receiptType: "quick-external-review-packet.v1",
        receiptLabel: "External review packet manifest",
        sourceVerifierApiPath: "/api/quick-external-review-packet/verify",
        nativeSkill: "quick-external-review-packet.receipt.verify",
        summary: {
          receiptVersion: "quick-external-review-packet.v1",
          status: "blocked",
          clearance: "internal-only",
          buyer: "Platform lead",
          artifactCount: 1
        },
        handoff: {
          decision: "accept-receipt-hold-packet",
          title: "Receipt verified, packet stays on hold",
          nextAction: expect.stringContaining("Keep the packet internal")
        }
      }
    });
    expect(externalReviewDecisionResult).toMatchObject({
      statusCode: 200,
      body: {
        status: "verified",
        receiptType: "quick-external-review-decision.v1",
        receiptLabel: "External review decision",
        sourceVerifierApiPath: "/api/quick-external-review-decision/verify",
        nativeSkill: "quick-external-review-decision.receipt.verify",
        summary: {
          receiptVersion: "quick-external-review-decision.v1",
          decision: "revise",
          status: "watch",
          buyer: "Platform lead",
          manifestReceiptId: "quick-external-review-blocked-12345678",
          testsReady: 1,
          testsTotal: 6
        },
        handoff: {
          decision: "accept-receipt-hold-packet"
        }
      }
    });
    expect(externalReviewOwnerPacketResult).toMatchObject({
      statusCode: 200,
      body: {
        status: "verified",
        receiptType: "quick-external-review-owner-packet.v1",
        receiptLabel: "External review owner packet",
        sourceVerifierApiPath: "/api/quick-external-review-owner-packet/verify",
        nativeSkill: "quick-external-review-owner-packet.receipt.verify",
        summary: {
          receiptVersion: "quick-external-review-owner-packet.v1",
          status: "blocked",
          label: "Stop preserved",
          buyer: "Platform lead",
          owner: "Review coordinator",
          manifestReceiptId: "quick-external-review-blocked-12345678",
          responseReceiptChecksum: "fnv1a32:abcdef12",
          acceptanceCriteriaCount: 2,
          runbookItemCount: 1,
          runbook: [
            expect.objectContaining({
              id: "repair-target",
              owner: "Review coordinator",
              status: "blocked",
              action: "Refresh live proof before requesting another review."
            })
          ]
        }
      }
    });
    expect(acceptancePathResult).toMatchObject({
      statusCode: 200,
      body: {
        status: "verified",
        receiptType: "buyer-acceptance-path.v1",
        receiptLabel: "Buyer acceptance path",
        sourceVerifierApiPath: "/api/buyer-acceptance-path/receipt/verify",
        nativeSkill: "buyer-acceptance-path.receipt.verify",
        summary: {
          pathId: "buyer-acceptance-path-approve-pilot-1234567890",
          status: "ready",
          decision: "approve-pilot",
          buyer: "Platform lead",
          stageCount: 2,
          decisionRecommendation: "continue",
          selectedDecision: "continue",
          decisionAlignment: "aligned",
          openDecisionConditionCount: 0,
          blockedDecisionConditionCount: 0,
          watchDecisionConditionCount: 0,
          blockingSummary: "No open evidence condition blocks a clean continue decision.",
          overrideWarning: "Selected decision matches the current evidence state.",
          continueCriteria: ["Keep every attached proof link public through the buyer review window."],
          replyDecision: "continue"
        }
      }
    });
    expect(followUpResult).toMatchObject({
      statusCode: 200,
      body: {
        status: "verified",
        receiptType: "buyer-decision-follow-up.v1",
        receiptLabel: "Buyer follow-up ledger",
        sourceVerifierApiPath: "/api/buyer-decision-follow-up/receipt/verify",
        nativeSkill: "buyer-decision-follow-up.receipt.verify",
        summary: {
          status: "ready",
          mode: "buyer-send",
          readyCount: 4
        }
      }
    });
    expect(repairCheckResult).toMatchObject({
      statusCode: 200,
      body: {
        status: "verified",
        receiptType: "global-publishability-repair-check.v1",
        receiptLabel: "Global publishability repair check",
        sourceVerifierApiPath: "/api/global-publishability/repair-check/receipt/verify",
        nativeSkill: "global-publishability-repair-check.receipt.verify",
        summary: {
          receiptVersion: "global-publishability-repair-check.v1",
          status: "blocked",
          decision: "no-send",
          sourceReceiptDecision: "do-not-publish",
          missingProofCount: 1,
          verifiedCount: 2
        },
        handoff: {
          decision: "accept-receipt-hold-packet",
          title: "Receipt verified, packet stays on hold"
        }
      }
    });
  });

  test("returns a normalized mismatch when a supported receipt payload is changed", () => {
    const payload = proofPacketPayload();
    const digest = buyerProofPacketReceiptDigest(payload);

    const result = verifyReceiptVerificationDeskRequest({
      digest,
      payload: {
        ...payload,
        packetScore: 74
      }
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      status: "mismatch",
      verified: false,
      receiptType: "buyer-proof-packet.v1",
      receiptLabel: "Buyer proof packet",
      sourceVerifierApiPath: "/api/buyer-proof-packet/receipt/verify",
      verification: {
        status: "mismatch",
        expectedDigest: digest
      },
      handoff: {
        decision: "hold-for-re-export",
        title: "Hold this receipt for re-export"
      }
    });
    expect(result.body.nextAction).toContain("Do not accept");
  });

  test("keeps strict schema errors visible for supported receipt types", () => {
    const result = verifyReceiptVerificationDeskRequest({
      checksum: "1234567890abcdef",
      payload: {
        receiptVersion: "commercial-offer.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      status: "invalid_request",
      verified: false,
      receiptType: "commercial-offer.v1",
      receiptLabel: "Commercial offer",
      error: "invalid_request",
      handoff: {
        decision: "hold-for-valid-request"
      }
    });
    expect(result.body.issues).toBeDefined();
  });

  test("rejects unsupported receipt versions without implying tampering", () => {
    const result = verifyReceiptVerificationDeskRequest({
      checksum: "1234567890abcdef",
      payload: {
        receiptVersion: "unknown-receipt.v1"
      }
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      status: "unsupported",
      verified: false,
      receiptType: "unknown-receipt.v1",
      error: "unsupported_receipt",
      handoff: {
        decision: "hold-for-valid-request"
      }
    });
    expect(result.body.supportedReceipts).toHaveLength(43);
  });

  test("renders a public receipt verification desk with a safe sample request", () => {
    const sampleRequestJson = JSON.stringify(
      {
        digest: "1234567890abcdef",
        payload: {
          manifestVersion: "buyer-proof-packet.v1",
          headline: "<script>alert(1)</script>"
        }
      },
      null,
      2
    );

    const html = renderReceiptVerificationDeskHtml({
      apiUrl: RECEIPT_VERIFICATION_DESK_API_PATH,
      sampleRequestJson,
      storedRequestKey: "quick-external-review-blocked-12345678",
      initialStatusLabel: "Verification request loaded from the URL. Running verifier...",
      autoVerify: true,
      links: {
        trustManifestUrl: "/buyer-trust-manifest",
        proofVerifierUrl: "/buyer-proof-verifier",
        appUrl: "/"
      }
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Receipt Verification Desk");
    expect(html).toContain(RECEIPT_VERIFICATION_DESK_API_PATH);
    expect(html).toContain("Verification request loaded from the URL. Running verifier...");
    expect(html).toContain("const autoVerify = true");
    expect(html).toContain("quick-external-review-blocked-12345678");
    expect(html).toContain("receipt-verifier-request:");
    expect(html).toContain('id="receipt-verifier-input"');
    expect(html).toContain('id="receipt-verifier-submit"');
    expect(html).toContain('id="receipt-verifier-result"');
    expect(html).toContain('id="receipt-verifier-handoff"');
    expect(html).toContain('id="receipt-verifier-handoff-download"');
    expect(html).toContain('id="receipt-verifier-handoff-copy"');
    expect(html).toContain("Receipt verification handoff");
    expect(html).toContain("accept-for-review");
    expect(html).toContain("accept-receipt-hold-packet");
    expect(html).toContain("hold-for-re-export");
    expect(html).toContain("The verifier accepted this receipt and the summary does not name a blocker.");
    expect(html).toContain("buyer-proof-packet.v1");
    expect(html).toContain("global-publishability.v1");
    expect(html).toContain("global-publishability-repair-check.v1");
    expect(html).toContain("global-publishability-review-response.v1");
    expect(html).toContain("buyer-decision-receipt.v1");
    expect(html).toContain("quick-buyer-decision-reply-record.v1");
    expect(html).toContain("quick-buyer-validation-answer-record.v1");
    expect(html).toContain("quick-external-review-packet.v1");
    expect(html).toContain("quick-external-review-decision.v1");
    expect(html).toContain("quick-external-review-owner-packet.v1");
    expect(html).toContain("buyer-acceptance-path.v1");
    expect(html).toContain("buyer-decision-follow-up.v1");
    expect(html).toContain("commercial-offer.v1");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
