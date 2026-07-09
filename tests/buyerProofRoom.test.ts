import { describe, expect, test } from "vitest";
import { BUYER_PROOF_ROOM_PATH, buildBuyerProofRoom, renderBuyerProofRoomHtml } from "../src/buyerProofRoom";
import type { BuyerPilotContract } from "../src/buyerPilotContract";
import type { BuyerProofVerifierReport } from "../src/buyerProofVerifier";
import type { BuyerTrustManifest } from "../src/buyerTrustManifest";

function sampleManifest(): BuyerTrustManifest {
  return {
    id: "buyer-trust-manifest-blocked-82-a1b2c3d4",
    manifestVersion: "buyer-trust-manifest.v1",
    generatedAt: "2026-06-20T00:00:00.000Z",
    issuer: "A2A Agent Marketplace",
    subject: "Platform lead",
    readiness: "blocked",
    score: 82,
    headline: "Buyer trust manifest blocks external sharing",
    decision: "Do not share externally until the live proof audit is repaired.",
    proofPacketDigest: "a1b2c3d4e5f60789",
    sponsorDecisionStatus: "signed",
    artifacts: [
      {
        id: "value-report",
        label: "Value report",
        href: "https://example.com/buyer-value",
        status: "pass",
        owner: "Platform lead",
        evidence: "Modeled monthly value is attached.",
        verifier: "Buyer proof packet row"
      },
      {
        id: "buyer-pilot-contract",
        label: "Buyer pilot contract",
        href: "https://example.com/buyer-pilot-contract",
        status: "watch",
        owner: "Sponsor",
        evidence: "Contract receipt is attached with one owner redline.",
        verifier: "POST /api/buyer-pilot-contract/receipt/verify"
      },
      {
        id: "live-proof-audit",
        label: "Live proof audit",
        href: "https://example.com/buyer-proof-audit",
        status: "block",
        owner: "Launch operator",
        evidence: "Public proof must be rerun.",
        verifier: "Server-side public proof link verifier"
      }
    ],
    receipts: [
      {
        id: "buyer-proof-packet",
        status: "pass",
        algorithm: "fnv1a-64",
        digest: "a1b2c3d4e5f60789",
        evidence: "Proof packet receipt is attached.",
        verifier: "Receipt digest"
      },
      {
        id: "buyer-pilot-contract",
        status: "watch",
        algorithm: "fnv1a-64",
        digest: "c1c2c3d4e5f60789",
        evidence: "Contract receipt is attached.",
        verifier: "POST /api/buyer-pilot-contract/receipt/verify"
      },
      {
        id: "buyer-trust-manifest",
        status: "pass",
        algorithm: "fnv1a-64",
        digest: "feedfacecafebeef",
        evidence: "Digest covers public proof artifacts.",
        verifier: "Recompute fnv1a-64 over verification.payload."
      }
    ],
    publicationGate: {
      decision: "hold",
      headline: "Hold public buyer proof until blockers are repaired",
      score: 72,
      passedCount: 5,
      totalCount: 8,
      blockedCount: 1,
      watchCount: 1,
      firstAction: "Run the live proof audit and replace any blocked public URL before buyer delivery.",
      firstActionHref: "https://example.com/buyer-proof-audit",
      checks: [
        {
          id: "live-proof-audit",
          kind: "artifact",
          label: "Live proof audit",
          status: "block",
          owner: "Launch operator",
          href: "https://example.com/buyer-proof-audit",
          evidence: "Public proof must be rerun.",
          action: "Run the live proof audit and replace any blocked public URL before buyer delivery.",
          verifier: "Server-side public proof link verifier"
        },
        {
          id: "buyer-pilot-contract",
          kind: "artifact",
          label: "Buyer pilot contract",
          status: "watch",
          owner: "Sponsor",
          href: "https://example.com/buyer-pilot-contract",
          evidence: "One contract condition needs owner confirmation.",
          action: "Clear the owner redline before buyer approval.",
          verifier: "POST /api/buyer-pilot-contract/receipt/verify"
        }
      ]
    },
    publicationWindow: {
      status: "blocked",
      generatedAt: "2026-06-20T00:00:00.000Z",
      proofExpiresAt: "2026-06-21T00:00:00.000Z",
      manifestExpiresAt: "2026-06-27T00:00:00.000Z",
      buyerReviewDueAt: "2026-06-23T00:00:00.000Z",
      summary: "Do not publish this proof chain.",
      firstRecheck: "Live proof recheck",
      firstRecheckHref: "https://example.com/buyer-proof-audit",
      schedule: []
    },
    verificationBrief: {
      headline: "External reviewers should not rely on this chain until blockers are repaired",
      machineManifestHref: "https://example.com/.well-known/buyer-proof.json",
      markdownHref: "https://example.com/buyer-trust-manifest.md",
      primaryArtifactHref: "https://example.com/buyer-proof-audit",
      digest: "feedfacecafebeef",
      proofPacketDigest: "a1b2c3d4e5f60789",
      passedArtifacts: 1,
      totalArtifacts: 3,
      firstAction: "Run live proof audit.",
      firstActionHref: "https://example.com/buyer-proof-audit",
      instructions: ["Open the machine manifest."]
    },
    verification: {
      algorithm: "fnv1a-64",
      digest: "feedfacecafebeef",
      verificationApiPath: "/api/buyer-trust-manifest/receipt/verify",
      payload: {
        manifestVersion: "buyer-trust-manifest.v1",
        subject: "Platform lead",
        generatedAt: "2026-06-20T00:00:00.000Z",
        readiness: "blocked",
        score: 82,
        proofPacketReceiptDigest: "a1b2c3d4e5f60789",
        sponsorDecisionReceiptId: "sponsor-signed",
        adoptionPlanId: "adoption",
        trustCenterId: "trust",
        commercialOfferId: "offer",
        buyerPilotContractId: "buyer-pilot-contract-needs-redlines-82",
        buyerPilotContractReceiptChecksum: "c1c2c3d4e5f60789",
        artifacts: [
          {
            id: "buyer-pilot-contract",
            status: "watch",
            href: "https://example.com/buyer-pilot-contract",
            evidence: "Contract receipt is attached with one owner redline."
          }
        ],
        publicationWindow: {
          status: "blocked",
          proofExpiresAt: "2026-06-21T00:00:00.000Z",
          manifestExpiresAt: "2026-06-27T00:00:00.000Z",
          buyerReviewDueAt: "2026-06-23T00:00:00.000Z",
          schedule: []
        }
      },
      payloadJson: "{}",
      payloadHref: "data:application/json,{}",
      verificationRequestJson: "{}",
      verificationRequestHref: "data:application/json,{}",
      replayVerification: {
        status: "verified",
        expectedDigest: "feedfacecafebeef",
        actualDigest: "feedfacecafebeef",
        instruction: "Manifest digest matches."
      },
      instruction: "Verify proof packet and buyer-pilot-contract checksums independently."
    },
    exportMarkdown: "manifest"
  };
}

function sampleProofVerifier(): BuyerProofVerifierReport {
  return {
    id: "buyer-proof-verifier-blocked",
    checkedAt: "2026-06-20T01:00:00.000Z",
    status: "blocked",
    decision: "hold",
    score: 72,
    headline: "Buyer proof should not be trusted yet",
    operatorLine: "Platform lead has a proof integrity blocker.",
    subject: "Platform lead",
    manifestId: "buyer-trust-manifest-blocked-82-a1b2c3d4",
    expectedDigest: "feedfacecafebeef",
    actualDigest: "feedfacecafebeef",
    trustManifestVerifyApiPath: "/api/buyer-trust-manifest/receipt/verify",
    checks: [
      {
        id: "upstream-receipts",
        label: "Upstream receipt alignment",
        status: "pass",
        evidence: "2 upstream receipt checksums match verification.payload.",
        action: "Verify each upstream receipt API if the reviewer asks for deeper provenance."
      },
      {
        id: "publication-gate",
        label: "Publication gate",
        status: "block",
        evidence: "1 blocking publication check remains open.",
        action: "Run the live proof audit."
      }
    ],
    nextActions: ["Run the live proof audit."],
    copyText: "report",
    exportMarkdown: "report"
  };
}

function sampleContract(): BuyerPilotContract {
  return {
    id: "buyer-pilot-contract-needs-redlines-82",
    readiness: "needs-redlines",
    contractScore: 82,
    headline: "The buyer pilot contract needs owner redlines",
    hardTruth: "One contract condition needs owner confirmation before this can leave the workspace.",
    buyer: "Platform lead",
    pilotOffer: "pilot",
    firstCommitmentYen: 900000,
    expectedMonthlyValueYen: 2400000,
    valueCoveragePercent: 266,
    paybackDays: 12,
    approvalMemo: {
      decision: "owner-redline",
      score: 82,
      signer: "Sponsor",
      headline: "Redline before buyer approval",
      sendLine: "Keep the contract in owner review until one open condition is clear.",
      validUntilDays: 7,
      redlineCount: 1
    },
    milestones: [],
    closeDecisions: [],
    attachments: [],
    stopRules: [],
    buyerQuestions: [],
    receipt: {
      receiptId: "buyer-pilot-contract-needs-redlines-c1c2c3d4e5f6",
      checksumAlgorithm: "fnv1a-64",
      checksum: "c1c2c3d4e5f60789",
      verificationApiPath: "/api/buyer-pilot-contract/receipt/verify",
      payload: {
        receiptVersion: "buyer-pilot-contract.v1",
        contractId: "buyer-pilot-contract-needs-redlines-82",
        readiness: "needs-redlines",
        contractScore: 82,
        approvalDecision: "owner-redline",
        buyer: "Platform lead",
        pilotOffer: "pilot",
        firstCommitmentYen: 900000,
        expectedMonthlyValueYen: 2400000,
        paybackDays: 12,
        valueCoveragePercent: 266,
        approvalSigner: "Sponsor",
        commercialOfferReceiptChecksum: "b1b2c3d4e5f60789",
        milestones: [],
        closeDecisions: [],
        stopRules: [],
        attachments: []
      },
      payloadJson: "{}",
      payloadHref: "data:application/json,{}",
      verificationRequestJson: "{}",
      verificationRequestHref: "data:application/json,{}",
      verification: {
        status: "verified",
        expectedChecksum: "c1c2c3d4e5f60789",
        actualChecksum: "c1c2c3d4e5f60789",
        instruction: "Checksum matches."
      },
      copyText: "receipt",
      href: "data:text/markdown,receipt"
    },
    exportMarkdown: "contract"
  };
}

function sampleLinks() {
  return {
    roomUrl: "https://example.com/buyer-proof-room",
    jsonUrl: "https://example.com/api/buyer-proof-room",
    markdownUrl: "https://example.com/buyer-proof-room.md",
    trustManifestUrl: "https://example.com/buyer-proof-room/manifest",
    trustManifestJsonUrl: "https://example.com/api/buyer-proof-room/manifest",
    proofVerifierUrl: "https://example.com/buyer-proof-room/verifier",
    proofVerifierApiUrl: "https://example.com/api/buyer-proof-verifier",
    pilotContractUrl: "https://example.com/buyer-pilot-contract",
    receiptVerifierUrl: "https://example.com/receipt-verifier",
    decisionReceiptUrl: "https://example.com/buyer-decision-receipt",
    reviewKitUrl: "https://example.com/buyer-review-kit",
    acceptancePathUrl: "https://example.com/buyer-acceptance-path",
    appUrl: "https://example.com",
    heroImageUrl: "https://example.com/assets/agent-marketplace-hero.webp"
  };
}

describe("buyer proof room", () => {
  test("bundles manifest, verifier, contract, actions, and receipts into one public room", () => {
    const room = buildBuyerProofRoom({
      manifest: sampleManifest(),
      proofVerifier: sampleProofVerifier(),
      pilotContract: sampleContract(),
      links: sampleLinks()
    });

    expect(BUYER_PROOF_ROOM_PATH).toBe("/buyer-proof-room");
    expect(room.readiness).toBe("blocked");
    expect(room.actions.map((action) => action.id)).toEqual(["first-action", "verify-proof", "open-contract", "receipt-desk"]);
    expect(room.reviewerDecisions.map((decision) => decision.id)).toEqual(["trust", "approval", "first-action", "verification"]);
    expect(room.reviewerBriefs.map((brief) => brief.id)).toEqual(["economic-buyer", "security-reviewer", "launch-operator"]);
    expect(room.reviewerBriefs[0]).toMatchObject({
      label: "Economic buyer brief",
      status: "watch",
      question: "Can I approve a contained pilot?",
      answer: "Keep the contract in owner review until one open condition is clear.",
      href: "https://example.com/buyer-pilot-contract"
    });
    expect(room.reviewerBriefs[1]).toMatchObject({
      label: "Security reviewer brief",
      status: "block",
      stopRule: "Do not forward the room until the proof verifier returns verified.",
      href: "https://example.com/buyer-proof-room/verifier"
    });
    expect(room.reviewerBriefs[2]).toMatchObject({
      label: "Launch operator brief",
      status: "block",
      stopRule: "Keep this proof room internal until every repair step is closed.",
      href: "https://example.com/buyer-proof-audit"
    });
    expect(room.decisionHandoff.recommendedDecision).toBe("stop");
    expect(room.decisionHandoff.status).toBe("blocked");
    expect(room.decisionHandoff.stopRule).toBe("Issue a stop receipt and keep the room internal until blockers are repaired.");
    expect(room.decisionHandoff.steps.map((step) => step.id)).toEqual(["review-kit", "decision-receipt", "acceptance-path"]);
    expect(room.decisionHandoff.steps.every((step) => step.href.includes("decision=stop"))).toBe(true);
    expect(room.decisionHandoff.steps.map((step) => step.href)).toEqual([
      "https://example.com/buyer-review-kit?decision=stop",
      "https://example.com/buyer-decision-receipt?decision=stop",
      "https://example.com/buyer-acceptance-path?decision=stop"
    ]);
    expect(room.ownerPacket).toMatchObject({
      status: "blocked",
      headline: "Owner packet blocks buyer send",
      currentOwner: "Launch operator",
      currentCommand: "Run the live proof audit and replace any blocked public URL before buyer delivery.",
      blockedCount: 1,
      watchCount: 1,
      itemCount: 2
    });
    expect(room.ownerPacket.sendRule).toBe("Do not send to Platform lead until 1 blocker and 1 review item close.");
    expect(room.ownerPacket.escalationRule).toContain("record a stop decision receipt");
    expect(room.ownerPacket.items[0]).toMatchObject({
      id: "live-proof-audit",
      owner: "Launch operator",
      priority: "now",
      source: "publication-gate",
      proofToAttach: "Regenerated publication gate row for Live proof audit. Public proof must be rerun."
    });
    expect(room.ownerPacket.copyText).toContain("# Buyer proof room owner packet");
    expect(room.ownerPacket.copyText).toContain("Current owner: Launch operator");
    expect(room.ownerPacket.href).toContain("data:text/markdown");
    expect(room.repairPlan).toMatchObject({
      status: "blocked",
      headline: "Repair blockers before external sharing",
      blockedCount: 1,
      watchCount: 1,
      stepCount: 2
    });
    expect(room.repairPlan.steps.map((step) => step.id)).toEqual(["live-proof-audit", "buyer-pilot-contract"]);
    expect(room.repairPlan.steps[0]).toMatchObject({
      priority: "now",
      owner: "Launch operator",
      source: "publication-gate"
    });
    expect(room.evidenceLanes.map((lane) => lane.id)).toEqual(["value-report", "buyer-pilot-contract", "live-proof-audit"]);
    expect(room.verificationRequestJson).toContain("\"manifest\"");
    expect(room.exportMarkdown).toContain("## Reviewer decisions");
    expect(room.exportMarkdown).toContain("## Reviewer briefing pack");
    expect(room.exportMarkdown).toContain("### Economic buyer brief");
    expect(room.exportMarkdown).toContain("Stop rule: Keep this proof room internal until every repair step is closed.");
    expect(room.exportMarkdown).toContain("## Decision handoff");
    expect(room.exportMarkdown).toContain("Recommended decision: stop");
    expect(room.exportMarkdown).toContain("Issue a stop receipt and keep the room internal until blockers are repaired.");
    expect(room.exportMarkdown).toContain("## Owner packet");
    expect(room.exportMarkdown).toContain("Current owner: Launch operator");
    expect(room.exportMarkdown).toContain("Proof to attach: Regenerated publication gate row for Live proof audit.");
    expect(room.exportMarkdown).toContain("## Repair plan");
    expect(room.exportMarkdown).toContain("Done signal:");
    expect(room.exportMarkdown).toContain("buyer-pilot-contract");
  });

  test("marks reviewer briefs as shareable when every gate is ready", () => {
    const manifest = sampleManifest();
    manifest.readiness = "external-ready";
    manifest.publicationGate = {
      ...manifest.publicationGate,
      decision: "publish",
      blockedCount: 0,
      watchCount: 0,
      firstAction: "Share the proof room and keep the manifest digest attached.",
      checks: manifest.publicationGate.checks.map((check) => ({ ...check, status: "pass" as const }))
    };
    const verifier = sampleProofVerifier();
    verifier.status = "verified";
    verifier.decision = "share";
    verifier.checks = verifier.checks.map((check) => ({ ...check, status: "pass" as const }));
    const contract = sampleContract();
    contract.readiness = "contract-ready";

    const room = buildBuyerProofRoom({
      manifest,
      proofVerifier: verifier,
      pilotContract: contract,
      links: sampleLinks()
    });

    expect(room.readiness).toBe("ready-to-send");
    expect(room.repairPlan.status).toBe("ready-to-send");
    expect(room.decisionHandoff.recommendedDecision).toBe("continue");
    expect(room.decisionHandoff.stopRule).toBe("Issue a continue receipt only after replaying the proof verifier in the review kit.");
    expect(room.decisionHandoff.steps.every((step) => step.href.includes("decision=continue"))).toBe(true);
    expect(room.ownerPacket).toMatchObject({
      status: "ready-to-send",
      headline: "Owner packet is ready for buyer send",
      currentOwner: "Pilot owner",
      blockedCount: 0,
      watchCount: 0,
      itemCount: 1
    });
    expect(room.ownerPacket.sendRule).toBe("Send only with the current manifest digest, proof verifier result, contract receipt, and decision receipt attached.");
    expect(room.ownerPacket.items[0]).toMatchObject({
      id: "verify-room-before-send",
      priority: "verify",
      proofToAttach: "Proof verifier rerun showing Verify room before send as pass. The proof room is ready, but the verifier should be replayed before forwarding."
    });
    expect(room.reviewerBriefs.map((brief) => [brief.id, brief.status])).toEqual([
      ["economic-buyer", "pass"],
      ["security-reviewer", "pass"],
      ["launch-operator", "pass"]
    ]);
    expect(room.reviewerBriefs.every((brief) => brief.stopRule === "Share only with the current manifest JSON and Markdown links attached.")).toBe(true);
    expect(room.exportMarkdown).toContain("Status: pass");
    expect(room.exportMarkdown).toContain("Stop rule: Share only with the current manifest JSON and Markdown links attached.");
  });

  test("renders a polished self-verifying HTML proof room", () => {
    const room = buildBuyerProofRoom({
      manifest: sampleManifest(),
      proofVerifier: sampleProofVerifier(),
      pilotContract: sampleContract(),
      links: sampleLinks()
    });

    const html = renderBuyerProofRoomHtml(room);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer Proof Room");
    expect(html).toContain("Verify this room");
    expect(html).toContain("Reviewer briefing pack");
    expect(html).toContain("Economic buyer brief");
    expect(html).toContain("Security reviewer brief");
    expect(html).toContain("Keep this proof room internal until every repair step is closed.");
    expect(html).toContain("Open reviewer evidence");
    expect(html).toContain("Decision handoff");
    expect(html).toContain("Recommended: stop");
    expect(html).toContain("Open handoff step");
    expect(html).toContain("https://example.com/buyer-review-kit?decision=stop");
    expect(html).toContain("https://example.com/buyer-decision-receipt?decision=stop");
    expect(html).toContain("https://example.com/buyer-acceptance-path?decision=stop");
    expect(html).toContain("Owner packet");
    expect(html).toContain("Owner packet blocks buyer send");
    expect(html).toContain("Current owner");
    expect(html).toContain("Download owner packet");
    expect(html).toContain("download=\"buyer-proof-room-owner-packet.md\"");
    expect(html).toContain("Repair plan");
    expect(html).toContain("Done signal:");
    expect(html).toContain("Open repair target");
    expect(html).toContain("data-verify-room");
    expect(html).toContain("buyer-proof-room-verification-config");
    expect(html).toContain("https://example.com/api/buyer-proof-room/manifest");
    expect(html).not.toContain("buyer-proof-room-verification-request");
    expect(html).toContain("agent-marketplace-hero.webp");
    expect(html).toContain("buyer-pilot-contract");
    expect(html).not.toContain("—");
    expect(html).not.toContain("–");
  });
});
