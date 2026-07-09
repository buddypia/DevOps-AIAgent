import { describe, expect, it } from "vitest";
import { verifyGlobalPublishabilityReceiptRequest } from "../server/globalPublishabilityReceiptVerifier";
import { buildGlobalProofDossier, type GlobalProofDossierLinkSummary } from "../src/globalProofDossier";
import type { GlobalLaunchAudit } from "../src/globalLaunchAudit";
import { buildGlobalPublishabilityReport } from "../src/globalPublishabilityReport";

function dimension(id: GlobalLaunchAudit["dimensions"][number]["id"], label: string): GlobalLaunchAudit["dimensions"][number] {
  return {
    id,
    label,
    status: "pass",
    score: 90,
    evidence: `${label} evidence is public and buyer-readable.`,
    action: `${label} action is closed.`,
    href: `#${id}`
  };
}

function liftPlan(): GlobalLaunchAudit["liftPlan"] {
  return {
    targetScore: 86,
    scoreGap: 0,
    projectedScoreAfterFirstFix: 92,
    summary: "Global-ready threshold is met; keep proof fresh.",
    actions: [
      {
        id: "route-global-traffic",
        priority: "now",
        dimensionId: "global-routing",
        label: "Route global traffic to the launch room",
        currentScore: 92,
        targetScore: 92,
        scoreLift: 0,
        projectedScore: 92,
        proofRequired: "Keep public proof links reachable.",
        decisionImpact: "Moves from review to acquisition routing.",
        href: "#buyer-share-gate"
      }
    ]
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
      dimension("buyer-value", "Buyer value clarity"),
      dimension("live-surface", "Public product surface"),
      dimension("proof-depth", "Proof depth"),
      dimension("measured-outcome", "Measured buyer outcome"),
      dimension("production-ops", "Production operations"),
      dimension("trust-offer", "Trust and offer packaging")
    ],
    actions: [],
    liftPlan: liftPlan(),
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

function sampleReceipt() {
  const audit = sampleAudit();
  const dossier = buildGlobalProofDossier({
    audit,
    liveProof: verifiedLinks(audit),
    generatedAt: "2026-06-20T01:00:00.000Z"
  });
  return buildGlobalPublishabilityReport({
    audit,
    dossier,
    generatedAt: "2026-06-20T02:00:00.000Z",
    links: {
      launchRoomUrl: "https://service.example/launch-room?workspace=share",
      proofDossierUrl: "https://service.example/global-proof-dossier?workspace=share"
    }
  }).receipt;
}

describe("global publishability receipt verifier", () => {
  it("verifies an untampered global publishability receipt payload", () => {
    const receipt = sampleReceipt();

    const result = verifyGlobalPublishabilityReceiptRequest({
      checksum: receipt.checksum,
      payload: receipt.payload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "global-publishability.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: receipt.checksum,
        actualChecksum: receipt.checksum
      },
      receipt: {
        receiptVersion: "global-publishability.v1",
        decision: "publish",
        recommendedDecision: "approve-bounded-pilot",
        blockedGates: 0,
        blockedProofLinks: 0,
        repairTicketCount: 1,
        firstRepairTicket: "Verify public route before publish"
      }
    });
  });

  it("returns 422 when the publishability receipt payload changes after export", () => {
    const receipt = sampleReceipt();

    const result = verifyGlobalPublishabilityReceiptRequest({
      checksum: receipt.checksum,
      payload: {
        ...receipt.payload,
        decision: "do-not-publish"
      }
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      verification: {
        status: "mismatch",
        expectedChecksum: receipt.checksum
      }
    });
  });

  it("rejects malformed publishability receipt verification requests", () => {
    const result = verifyGlobalPublishabilityReceiptRequest({
      checksum: "not-a-checksum",
      payload: {}
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
