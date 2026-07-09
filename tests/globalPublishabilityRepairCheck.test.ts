import { describe, expect, it } from "vitest";
import { runGlobalPublishabilityRepairCheck } from "../server/globalPublishabilityRepairCheck";
import { verifyGlobalPublishabilityRepairCheckReceiptRequest } from "../server/globalPublishabilityRepairCheckReceiptVerifier";
import type { PublicProofLinkInput, PublicProofLinkVerificationSummary } from "../server/proofLinkVerifier";
import type { GlobalLaunchAudit } from "../src/globalLaunchAudit";
import { buildGlobalProofDossier, type GlobalProofDossierLinkSummary } from "../src/globalProofDossier";
import { buildGlobalPublishabilityReport } from "../src/globalPublishabilityReport";

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

function baseAudit(): GlobalLaunchAudit {
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

function blockedLiveProof(): GlobalProofDossierLinkSummary {
  const audit = baseAudit();
  return {
    checkedAt: "2026-06-20T00:00:00.000Z",
    verifiedCount: audit.proofLinks.length - 1,
    totalCount: audit.proofLinks.length,
    score: 78,
    results: audit.proofLinks.map((link, index) => ({
      id: link.id,
      label: link.label,
      url: link.value,
      status: index === 0 ? "block" : "pass",
      httpStatus: index === 0 ? 403 : 200,
      finalUrl: link.value,
      contentType: "text/html",
      evidence: index === 0 ? "Public URL responded with HTTP 403." : "Public URL responded with HTTP 200.",
      action: index === 0 ? "Make the artifact publicly readable or attach a different proof URL." : "Keep this link attached to the launch room."
    }))
  };
}

function blockedReport() {
  const audit = baseAudit();
  return buildGlobalPublishabilityReport({
    audit,
    dossier: buildGlobalProofDossier({ audit, liveProof: blockedLiveProof() }),
    generatedAt: "2026-06-20T02:00:00.000Z"
  });
}

function verificationRequestFor(report: ReturnType<typeof buildGlobalPublishabilityReport>) {
  return JSON.parse(report.receipt.verificationRequestJson) as unknown;
}

function proofInputs(count = 3): PublicProofLinkInput[] {
  return [
    { id: "targetUrl", label: "Live product", value: "https://launch.opsbridge.ai/app" },
    { id: "protopediaUrl", label: "ProtoPedia story", value: "https://protopedia.net/prototype/opsbridge" },
    { id: "videoUrl", label: "Walkthrough video", value: "https://youtu.be/opsbridge-demo" }
  ].slice(0, count);
}

function summaryFor(links: PublicProofLinkInput[], statuses: Array<"pass" | "watch" | "block">): PublicProofLinkVerificationSummary {
  const results = links.map((link, index) => ({
    id: link.id,
    label: link.label,
    url: link.value,
    status: statuses[index] ?? "pass",
    httpStatus: statuses[index] === "block" ? 403 : 200,
    finalUrl: link.value,
    contentType: "text/html",
    evidence: statuses[index] === "block" ? "Public URL responded with HTTP 403." : "Public URL responded with HTTP 200.",
    action: statuses[index] === "block" ? "Make the artifact public." : "Keep this link attached."
  }));
  return {
    checkedAt: "2026-06-20T03:00:00.000Z",
    verifiedCount: results.filter((result) => result.status === "pass").length,
    totalCount: results.length,
    score: Math.round((results.filter((result) => result.status === "pass").length / Math.max(1, results.length)) * 100),
    results
  };
}

describe("global publishability repair check", () => {
  it("turns verified runbook proof into a rerun instruction", async () => {
    const report = blockedReport();
    const step = report.repairRunbook.steps[0];
    const proofUrls = proofInputs(3);
    const result = await runGlobalPublishabilityRepairCheck(
      {
        verificationRequest: verificationRequestFor(report),
        stepId: step.id,
        proofUrls
      },
      {
        now: new Date("2026-06-20T03:30:00.000Z"),
        verifyLinks: async (links) => {
          expect(links.map((link) => link.id)).toEqual(["targetUrl", "protopediaUrl", "videoUrl"]);
          return summaryFor(links, ["pass", "pass", "pass"]);
        }
      }
    );

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "global-publishability.repair-check",
      status: "ready-to-rerun",
      decision: "rerun-publishability",
      reportId: report.id,
      receiptChecksum: report.receipt.checksum,
      requiredProofCount: 3,
      suppliedProofCount: 3,
      missingProofCount: 0,
      verifiedCount: 3,
      blockedCount: 0,
      step: {
        id: step.id,
        ticketId: step.ticketId,
        proofSlot: "HTTPS product URL, ProtoPedia/story URL, walkthrough URL, and public receipt URLs.",
        proofRequirements: [
          expect.objectContaining({ id: "targetUrl", label: "Live product", kind: "product-url" }),
          expect.objectContaining({ id: "protopediaUrl", label: "ProtoPedia story", kind: "story-url" }),
          expect.objectContaining({ id: "videoUrl", label: "Walkthrough video", kind: "video-url" })
        ]
      }
    });
    expect("copyText" in result.body ? result.body.copyText : "").toContain("# Global publishability repair proof check");
    expect("href" in result.body ? result.body.href : "").toContain("data:text/markdown");
    expect("checksum" in result.body && "receipt" in result.body ? result.body.checksum : "").toBe("receipt" in result.body ? result.body.receipt.checksum : "");
    expect("receipt" in result.body ? result.body.receipt : null).toMatchObject({
      receiptId: expect.stringMatching(/^global-publishability-repair-check-ready-to-rerun-[a-f0-9]{12}$/),
      checksumAlgorithm: "fnv1a-64",
      verificationApiPath: "/api/global-publishability/repair-check/receipt/verify",
      payload: {
        receiptVersion: "global-publishability-repair-check.v1",
        reportId: report.id,
        sourceReceiptDecision: report.receipt.payload.decision,
        sourceReceiptChecksum: report.receipt.checksum,
        status: "ready-to-rerun",
        decision: "rerun-publishability",
        proofResults: [
          expect.objectContaining({ id: "targetUrl", status: "pass" }),
          expect.objectContaining({ id: "protopediaUrl", status: "pass" }),
          expect.objectContaining({ id: "videoUrl", status: "pass" })
        ]
      },
      verification: {
        status: "verified"
      }
    });
    const verification = verifyGlobalPublishabilityRepairCheckReceiptRequest(
      JSON.parse("receipt" in result.body ? result.body.receipt.verificationRequestJson : "{}")
    );
    expect(verification).toMatchObject({
      statusCode: 200,
      body: {
        skill: "global-publishability-repair-check.receipt.verify",
        verification: {
          status: "verified"
        },
        receipt: {
          reportId: report.id,
          status: "ready-to-rerun",
          decision: "rerun-publishability",
          sourceReceiptChecksum: report.receipt.checksum,
          missingProofCount: 0,
          verifiedCount: 3
        }
      }
    });
  });

  it("rejects a tampered repair-check receipt replay payload", async () => {
    const report = blockedReport();
    const result = await runGlobalPublishabilityRepairCheck(
      {
        verificationRequest: verificationRequestFor(report),
        stepId: report.repairRunbook.steps[0].id,
        proofUrls: proofInputs(3)
      },
      {
        verifyLinks: async (links) => summaryFor(links, ["pass", "pass", "pass"])
      }
    );

    if (!("receipt" in result.body)) throw new Error("repair check did not return a receipt");
    const request = JSON.parse(result.body.receipt.verificationRequestJson) as {
      checksum: string;
      payload: typeof result.body.receipt.payload;
    };
    request.payload.missingProofCount = 1;
    const verification = verifyGlobalPublishabilityRepairCheckReceiptRequest(request);

    expect(verification).toMatchObject({
      statusCode: 422,
      body: {
        skill: "global-publishability-repair-check.receipt.verify",
        verification: {
          status: "mismatch",
          expectedChecksum: result.body.receipt.checksum
        }
      }
    });
  });

  it("keeps the repair blocked when the runbook proof slot is incomplete", async () => {
    const report = blockedReport();
    const step = report.repairRunbook.steps[0];
    const proofUrls = proofInputs(1);
    const result = await runGlobalPublishabilityRepairCheck(
      {
        verificationRequest: verificationRequestFor(report),
        stepId: step.ticketId,
        proofUrls
      },
      {
        verifyLinks: async (links) => summaryFor(links, ["pass"])
      }
    );

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      status: "blocked",
      decision: "no-send",
      requiredProofCount: 3,
      suppliedProofCount: 1,
      missingProofCount: 2
    });
    expect("summary" in result.body ? result.body.summary : "").toContain("still needs 2 more public proof URLs");
  });

  it("does not count proof URLs that are not required by the selected runbook step", async () => {
    const report = blockedReport();
    const step = report.repairRunbook.steps[0];
    let checkedLinks: PublicProofLinkInput[] = [];
    const result = await runGlobalPublishabilityRepairCheck(
      {
        verificationRequest: verificationRequestFor(report),
        stepId: step.id,
        proofUrls: [{ id: "buyerReviewKitUrl", label: "Buyer review kit", value: "https://launch.opsbridge.ai/buyer-review-kit" }]
      },
      {
        verifyLinks: async (links) => {
          checkedLinks = links;
          return summaryFor(links, []);
        }
      }
    );

    expect(checkedLinks).toEqual([]);
    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      status: "blocked",
      decision: "no-send",
      requiredProofCount: 3,
      suppliedProofCount: 0,
      missingProofCount: 3
    });
  });

  it("keeps watched proof in sponsor review instead of closing the ticket", async () => {
    const report = blockedReport();
    const proofUrls = proofInputs(3);
    const result = await runGlobalPublishabilityRepairCheck(
      {
        verificationRequest: verificationRequestFor(report),
        stepId: report.repairRunbook.steps[0].id,
        proofUrls
      },
      {
        verifyLinks: async (links) => summaryFor(links, ["pass", "watch", "pass"])
      }
    );

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      status: "needs-review",
      decision: "sponsor-review",
      watchCount: 1,
      missingProofCount: 0
    });
  });

  it("rejects a tampered publishability receipt before checking proof URLs", async () => {
    const report = blockedReport();
    const verificationRequest = JSON.parse(report.receipt.verificationRequestJson) as {
      checksum: string;
      payload: { reportId: string };
    };
    verificationRequest.payload.reportId = "tampered";
    let checkedLinks = false;
    const result = await runGlobalPublishabilityRepairCheck(
      {
        verificationRequest,
        stepId: report.repairRunbook.steps[0].id,
        proofUrls: proofInputs(3)
      },
      {
        verifyLinks: async (links) => {
          checkedLinks = true;
          return summaryFor(links, ["pass", "pass", "pass"]);
        }
      }
    );

    expect(checkedLinks).toBe(false);
    expect(result).toMatchObject({
      statusCode: 422,
      body: {
        error: "receipt_not_verified"
      }
    });
  });
});
