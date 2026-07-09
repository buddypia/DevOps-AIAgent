import { describe, expect, it } from "vitest";
import { buildGlobalProofDossier, renderGlobalProofDossierHtml, type GlobalProofDossierLinkSummary } from "../src/globalProofDossier";
import {
  GLOBAL_PROOF_DOSSIER_RECEIPT_VERIFY_PATH,
  buildGlobalProofDossierReceipt,
  verifyGlobalProofDossierReceipt
} from "../src/globalProofDossierReceipt";
import type { GlobalLaunchAudit } from "../src/globalLaunchAudit";

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

function liftPlan(score = 91): GlobalLaunchAudit["liftPlan"] {
  return {
    targetScore: 86,
    scoreGap: 0,
    projectedScoreAfterFirstFix: score,
    summary: "Global-ready threshold is met; keep proof fresh.",
    actions: [
      {
        id: "route-global-traffic",
        priority: "now",
        dimensionId: "global-routing",
        label: "Route global traffic to the launch room",
        currentScore: score,
        targetScore: score,
        scoreLift: 0,
        projectedScore: score,
        proofRequired: "Keep public proof links reachable.",
        decisionImpact: "Moves from review to acquisition routing.",
        href: "#buyer-share-gate"
      }
    ]
  };
}

function baseAudit(): GlobalLaunchAudit {
  return {
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
      dimension("buyer-value", "Buyer value clarity", 94),
      dimension("live-surface", "Public product surface", 96),
      dimension("proof-depth", "Proof depth", 88),
      dimension("measured-outcome", "Measured buyer outcome", 92),
      dimension("production-ops", "Production operations", 84),
      dimension("trust-offer", "Trust and offer packaging", 86)
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
}

function verifiedLinks(): GlobalProofDossierLinkSummary {
  const audit = baseAudit();
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

describe("global proof dossier", () => {
  it("promotes a verified global launch audit into a buyer-shareable dossier", () => {
    const dossier = buildGlobalProofDossier({
      audit: baseAudit(),
      liveProof: verifiedLinks(),
      generatedAt: "2026-06-20T01:00:00.000Z"
    });

    expect(dossier.decision).toBe("share-with-buyer");
    expect(dossier.dossierScore).toBeGreaterThanOrEqual(84);
    expect(dossier.redLines).toEqual([]);
    expect(dossier.claims.every((claim) => claim.status === "pass")).toBe(true);
    expect(dossier.exportMarkdown).toContain("Global Proof Dossier");
    expect(dossier.exportMarkdown).toContain("Buyer decision: share-with-buyer");
    expect(dossier.exportMarkdown).toContain("## Live proof links");
  });

  it("builds a replayable receipt for the global proof dossier decision", () => {
    const dossier = buildGlobalProofDossier({
      audit: baseAudit(),
      liveProof: verifiedLinks(),
      generatedAt: "2026-06-20T01:00:00.000Z"
    });
    const receipt = buildGlobalProofDossierReceipt(dossier);

    expect(receipt).toMatchObject({
      checksumAlgorithm: "fnv1a-64",
      verificationApiPath: GLOBAL_PROOF_DOSSIER_RECEIPT_VERIFY_PATH,
      verification: expect.objectContaining({ status: "verified" })
    });
    expect(receipt.receiptId).toMatch(/^global-proof-dossier-share-with-buyer-[a-f0-9]{12}$/);
    expect(receipt.payload).toMatchObject({
      receiptVersion: "global-proof-dossier.v1",
      decision: "share-with-buyer",
      dossierScore: dossier.dossierScore,
      targetBuyer: "Global platform lead"
    });
    expect(receipt.copyText).toContain("# Global proof dossier receipt");
    expect(receipt.copyText).toContain(`POST ${GLOBAL_PROOF_DOSSIER_RECEIPT_VERIFY_PATH}`);
    expect(receipt.payloadHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(receipt.verificationRequestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(verifyGlobalProofDossierReceipt(receipt)).toMatchObject({
      status: "verified",
      expectedChecksum: receipt.checksum,
      actualChecksum: receipt.checksum
    });
    expect(
      verifyGlobalProofDossierReceipt({
        checksum: receipt.checksum,
        payload: {
          ...receipt.payload,
          dossierScore: receipt.payload.dossierScore - 9
        }
      })
    ).toMatchObject({
      status: "mismatch",
      expectedChecksum: receipt.checksum
    });
  });

  it("holds public launch when a required proof link is blocked", () => {
    const audit = baseAudit();
    const liveProof = verifiedLinks();
    liveProof.verifiedCount = liveProof.results.length - 1;
    liveProof.score = 78;
    liveProof.results[0] = {
      ...liveProof.results[0],
      status: "block",
      httpStatus: 403,
      evidence: "Public URL responded with HTTP 403; external reviewers may not be able to open it.",
      action: "Make the artifact publicly readable or attach a different proof URL."
    };

    const dossier = buildGlobalProofDossier({ audit, liveProof });

    expect(dossier.decision).toBe("hold-public-launch");
    expect(dossier.proofLinks[0]).toMatchObject({ status: "block", label: "Live product" });
    expect(dossier.claims.find((claim) => claim.id === "public-reachability")).toMatchObject({ status: "block" });
    expect(dossier.redLines[0]).toMatchObject({ label: "Public product surface", status: "block" });
  });

  it("renders escaped public HTML with linked artifacts", () => {
    const dossier = buildGlobalProofDossier({
      audit: {
        ...baseAudit(),
        headline: 'Launch <script>alert("bad")</script>',
        targetMarket: 'Buyer <script>alert("buyer")</script>'
      },
      liveProof: verifiedLinks()
    });
    const receipt = buildGlobalProofDossierReceipt(dossier);
    const html = renderGlobalProofDossierHtml(dossier, {
      appUrl: "https://service.example/?workspace=share",
      launchRoomUrl: "https://service.example/launch-room?workspace=share",
      globalAuditUrl: "https://service.example/global-launch-audit?workspace=share",
      launchEvidenceUrl: "https://service.example/launch-evidence?workspace=share",
      jsonUrl: "https://service.example/api/global-proof-dossier?workspace=share",
      markdownUrl: "https://service.example/global-proof-dossier.md?workspace=share"
    }, receipt);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Global Proof Dossier");
    expect(html).toContain("https://service.example/launch-room?workspace=share");
    expect(html).toContain("https://service.example/api/global-proof-dossier?workspace=share");
    expect(html).toContain("Buyer decision");
    expect(html).toContain("global-proof-dossier-receipt.md");
    expect(html).toContain("global-proof-dossier-replay-payload.json");
    expect(html).toContain("global-proof-dossier-verify-request.json");
    expect(html).toContain(`POST ${GLOBAL_PROOF_DOSSIER_RECEIPT_VERIFY_PATH}`);
    expect(html).toContain("&lt;script&gt;alert(&quot;buyer&quot;)&lt;/script&gt;");
    expect(html).not.toContain('<script>alert("buyer")</script>');
  });
});
