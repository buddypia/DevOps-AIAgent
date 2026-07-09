import { describe, expect, it } from "vitest";
import { verifyGlobalProofDossierReceiptRequest } from "../server/globalProofDossierReceiptVerifier";
import { buildGlobalProofDossier } from "../src/globalProofDossier";
import { buildGlobalProofDossierReceipt } from "../src/globalProofDossierReceipt";
import type { GlobalLaunchAudit } from "../src/globalLaunchAudit";

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
    projectedScoreAfterFirstFix: 91,
    summary: "Global-ready threshold is met; keep proof fresh.",
    actions: [
      {
        id: "route-global-traffic",
        priority: "now",
        dimensionId: "global-routing",
        label: "Route global traffic to the launch room",
        currentScore: 91,
        targetScore: 91,
        scoreLift: 0,
        projectedScore: 91,
        proofRequired: "Keep public proof links reachable.",
        decisionImpact: "Moves from review to acquisition routing.",
        href: "#buyer-share-gate"
      }
    ]
  };
}

function sampleReceipt() {
  const audit: GlobalLaunchAudit = {
    readiness: "global-ready",
    score: 91,
    headline: "This launch can stand in front of a global buyer",
    hardTruth: "The launch has public proof.",
    targetMarket: "Global platform lead",
    launchNarrative: "A global buyer can inspect value, proof, and operations.",
    monthlyValue: "1,000,000 yen",
    measuredValue: "998,000 yen",
    proofSummary: "5/5 public links, 2 accepted A2A trials",
    opsSummary: "82/100 production capability",
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
      { id: "videoUrl", label: "Walkthrough video", value: "https://video.example/walkthrough", status: "pass", href: "#launch-evidence-console" },
      { id: "pilotEvidenceUrl", label: "Measured receipt", value: "https://evidence.example/pilot", status: "pass", href: "#pilot-run-receipt" },
      { id: "workOrderEvidenceUrl", label: "Work order proof", value: "https://evidence.example/work-order", status: "pass", href: "#buyer-work-order-studio" }
    ],
    exportMarkdown: "# Global launch audit"
  };
  const dossier = buildGlobalProofDossier({
    audit,
    generatedAt: "2026-06-20T01:00:00.000Z"
  });

  return buildGlobalProofDossierReceipt(dossier);
}

describe("global proof dossier receipt verifier", () => {
  it("verifies an untampered global proof dossier receipt payload", () => {
    const receipt = sampleReceipt();

    const result = verifyGlobalProofDossierReceiptRequest({
      checksum: receipt.checksum,
      payload: receipt.payload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "global-proof-dossier.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: receipt.checksum,
        actualChecksum: receipt.checksum
      },
      receipt: {
        receiptVersion: "global-proof-dossier.v1",
        decision: "share-with-buyer",
        targetBuyer: "Global platform lead",
        blockedClaims: 0,
        blockedProofLinks: 0
      }
    });
  });

  it("returns 422 when the dossier receipt payload is changed after export", () => {
    const receipt = sampleReceipt();

    const result = verifyGlobalProofDossierReceiptRequest({
      checksum: receipt.checksum,
      payload: {
        ...receipt.payload,
        decision: "hold-public-launch"
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

  it("rejects malformed dossier receipt verification requests", () => {
    const result = verifyGlobalProofDossierReceiptRequest({
      checksum: "not-a-checksum",
      payload: {}
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
