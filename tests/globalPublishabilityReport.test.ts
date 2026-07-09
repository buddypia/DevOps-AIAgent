import { describe, expect, it } from "vitest";
import { buildGlobalProofDossier, type GlobalProofDossierLinkSummary } from "../src/globalProofDossier";
import type { GlobalLaunchAudit } from "../src/globalLaunchAudit";
import { buildGlobalPublishabilityReport, renderGlobalPublishabilityReportHtml } from "../src/globalPublishabilityReport";
import { GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH, verifyGlobalPublishabilityReceipt } from "../src/globalPublishabilityReceipt";

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

function liftPlan(score = 92): GlobalLaunchAudit["liftPlan"] {
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

function proofRequirementPlaceholders(report: ReturnType<typeof buildGlobalPublishabilityReport>) {
  return report.repairRunbook.steps.flatMap((step) => step.proofRequirements.map((requirement) => requirement.placeholder));
}

function expectNoFakeProofPlaceholders(placeholders: string[]) {
  const joined = placeholders.join("\n");
  expect(joined).not.toMatch(/your-service|your-company|your-cloud-run-url|artifact\.invalid/i);
  expect(joined).not.toMatch(/https:\/\/[^\s<]*\.\.\./i);
  expect(placeholders.every((placeholder) => placeholder.startsWith("<") && placeholder.endsWith(">"))).toBe(true);
}

describe("global publishability report", () => {
  it("promotes a verified proof dossier into a global publish decision", () => {
    const audit = baseAudit();
    const dossier = buildGlobalProofDossier({
      audit,
      liveProof: verifiedLinks(),
      generatedAt: "2026-06-20T01:00:00.000Z"
    });
    const report = buildGlobalPublishabilityReport({
      audit,
      dossier,
      generatedAt: "2026-06-20T02:00:00.000Z",
      links: {
        launchRoomUrl: "https://service.example/launch-room?workspace=share",
        proofDossierUrl: "https://service.example/global-proof-dossier?workspace=share",
        acceptancePathUrl: "https://service.example/buyer-acceptance-path?brief=share"
      }
    });

    expect(report.decision).toBe("publish");
    expect(report.status).toBe("pass");
    expect(report.repairLedger).toEqual([]);
    expect(report.gates.map((gate) => gate.id)).toEqual(["value-story", "live-reachability", "proof-substance", "ops-trust", "buyer-decision-path"]);
    expect(report.valueRoute.map((step) => step.id)).toEqual(["buyer-value", "measured-proof", "public-proof", "buyer-decision"]);
    expect(report.valueRoute.every((step) => step.status === "pass")).toBe(true);
    expect(report.valueRoute.find((step) => step.id === "measured-proof")).toMatchObject({
      label: "Measured proof",
      href: "https://service.example/global-proof-dossier?workspace=share"
    });
    expect(report.reviewerBrief).toMatchObject({
      recommendedDecision: "approve-bounded-pilot",
      timebox: "10-minute buyer review"
    });
    expect(report.reviewerBrief.proofChecks.map((check) => check.id)).toEqual(["buyer-value", "measured-proof", "public-proof", "buyer-decision"]);
    expect(report.reviewerBrief.decisionOptions.map((option) => option.id)).toEqual(["approve-bounded-pilot", "sponsor-review", "hold-public-launch"]);
    expect(report.reviewerBrief.stopRule).toContain("Stop the send");
    expect(report.handoffMemo).toMatchObject({
      audience: "buyer-sponsor",
      subject: "Pilot approval request: Global platform lead",
      requestedDecision: "Approve the bounded pilot from the launch room, or return one named red line."
    });
    expect(report.handoffMemo.noSendWarning).toBeUndefined();
    expect(report.handoffMemo.copyText).toContain("Subject: Pilot approval request: Global platform lead");
    expect(report.handoffMemo.copyText).toContain("Requested decision: Approve the bounded pilot");
    expect(report.handoffMemo.proofLinks.map((link) => link.label)).toContain("Launch room");
    expect(report.launchPacket).toMatchObject({
      status: "pass",
      headline: "Launch packet is ready for public send",
      currentOwner: "Launch owner",
      currentCommand: "Replay the publishability receipt and attach the current launch room, proof dossier, and acceptance path before sending.",
      blockedCount: 0,
      watchCount: 0,
      itemCount: 1
    });
    expect(report.launchPacket.items[0]).toMatchObject({
      id: "verify-public-route-before-publish",
      priority: "verify",
      href: "https://service.example/launch-room?workspace=share",
      proofToAttach: "Current publishability receipt, launch room URL, proof dossier, and acceptance path.",
      doneSignal: "Receipt verifies and every value-route step still returns pass."
    });
    expect(report.launchPacket.href).toContain("data:text/markdown");
    expect(decodeURIComponent(report.launchPacket.href.split(",")[1] ?? "")).toContain("## Launch items");
    expect(report.repairTickets).toHaveLength(1);
    expect(report.repairTickets[0]).toMatchObject({
      id: "repair-ticket-01-verify-public-route-before-publish",
      priority: "verify",
      status: "pass",
      owner: "Launch owner",
      title: "Verify public route before publish",
      recheck: {
        label: "Rerun global publishability report",
        expectedSignal: "Receipt verifies and every value-route step still returns pass."
      }
    });
    expect(report.repairTickets[0].acceptanceCriteria).toContain("Receipt verifies and every value-route step still returns pass.");
    expect(report.repairTickets[0].copyText).toContain("# Global publishability repair ticket");
    expect(report.repairTickets[0].href).toContain("data:text/markdown");
    expect(report.repairRunbook).toMatchObject({
      mode: "send-ready",
      status: "pass",
      externalShareLocked: false,
      currentOwner: "Launch owner",
      stepCount: 1,
      nowCount: 0,
      verifyCount: 1
    });
    expect(report.repairRunbook.steps[0]).toMatchObject({
      ticketId: "repair-ticket-01-verify-public-route-before-publish",
      priority: "verify",
      inputLabel: "Open final verification",
      proofSlot: "Current receipt verify JSON, launch room, proof dossier, and acceptance path.",
      proofRequirements: [
        expect.objectContaining({ id: "launchRoomUrl", label: "Launch room", placeholder: "<public launch room URL>" }),
        expect.objectContaining({ id: "proofDossierUrl", label: "Proof dossier", placeholder: "<public global proof dossier URL>" }),
        expect.objectContaining({ id: "acceptancePathUrl", label: "Acceptance path", placeholder: "<public buyer acceptance path URL>" })
      ],
      shareGate: expect.stringContaining("External send can proceed")
    });
    expectNoFakeProofPlaceholders(proofRequirementPlaceholders(report));
    expect(report.repairRunbook.copyText).toContain("# Owner repair runbook");
    expect(report.repairRunbook.csvText).toContain("ticketId");
    expect(report.repairRunbook.href).toContain("data:text/markdown");
    expect(report.repairRunbook.csvHref).toContain("data:text/csv");
    expect(report.receipt).toMatchObject({
      checksumAlgorithm: "fnv1a-64",
      verificationApiPath: GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH,
      verification: expect.objectContaining({ status: "verified" })
    });
    expect(report.receipt.receiptId).toMatch(/^global-publishability-publish-[a-f0-9]{12}$/);
    expect(report.receipt.payload).toMatchObject({
      receiptVersion: "global-publishability.v1",
      decision: "publish",
      publishabilityScore: report.publishabilityScore,
      recommendedDecision: "approve-bounded-pilot"
    });
    expect(report.receipt.payload.launchPacket).toMatchObject({
      currentOwner: "Launch owner",
      currentCommand: "Replay the publishability receipt and attach the current launch room, proof dossier, and acceptance path before sending.",
      itemCount: 1
    });
    expect(report.receipt.payload.repairTickets[0]).toMatchObject({
      title: "Verify public route before publish",
      sourceItemId: "verify-public-route-before-publish",
      receiptGuard: expect.stringContaining("replay the publishability receipt")
    });
    expect(report.receipt.payload.repairRunbook).toMatchObject({
      mode: "send-ready",
      currentOwner: "Launch owner",
      stepCount: 1,
      steps: [
        expect.objectContaining({
          ticketId: "repair-ticket-01-verify-public-route-before-publish",
          proofSlot: "Current receipt verify JSON, launch room, proof dossier, and acceptance path.",
          proofRequirements: [
            expect.objectContaining({ id: "launchRoomUrl" }),
            expect.objectContaining({ id: "proofDossierUrl" }),
            expect.objectContaining({ id: "acceptancePathUrl" })
          ]
        })
      ]
    });
    expect(verifyGlobalPublishabilityReceipt(report.receipt)).toMatchObject({
      status: "verified",
      expectedChecksum: report.receipt.checksum,
      actualChecksum: report.receipt.checksum
    });
    expect(
      verifyGlobalPublishabilityReceipt({
        checksum: report.receipt.checksum,
        payload: {
          ...report.receipt.payload,
          publishabilityScore: report.receipt.payload.publishabilityScore - 7
        }
      })
    ).toMatchObject({
      status: "mismatch",
      expectedChecksum: report.receipt.checksum
    });
    expect(report.primaryAction).toMatchObject({
      label: "Open launch room",
      href: "https://service.example/launch-room?workspace=share"
    });
    expect(report.exportMarkdown).toContain("Global Publishability Report");
    expect(report.exportMarkdown).toContain("Decision: publish");
    expect(report.exportMarkdown).toContain("## Publishability receipt");
    expect(report.exportMarkdown).toContain(`API verification: POST ${GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH}`);
    expect(report.exportMarkdown).toContain("## Handoff memo");
    expect(report.exportMarkdown).toContain("Audience: buyer-sponsor");
    expect(report.exportMarkdown).toContain("## Launch packet");
    expect(report.exportMarkdown).toContain("Proof to attach: Current publishability receipt");
    expect(report.exportMarkdown).toContain("Done signal: Receipt verifies");
    expect(report.exportMarkdown).toContain("## Repair tickets");
    expect(report.exportMarkdown).toContain("Receipt guard:");
    expect(report.exportMarkdown).toContain("## Owner repair runbook");
    expect(report.exportMarkdown).toContain("Verification command:");
    expect(report.exportMarkdown).toContain("## Reviewer decision brief");
    expect(report.exportMarkdown).toContain("Recommended decision: approve-bounded-pilot");
    expect(report.exportMarkdown).toContain("### Reviewer proof checks");
    expect(report.exportMarkdown).toContain("## Buyer value route");
    expect(report.exportMarkdown).toContain("- [pass] Measured proof: Proof shows real work, not a brochure");
    expect(report.exportMarkdown).toContain("## Publishability gates");
  });

  it("uses required public proof tokens instead of fake hosts across every repair runbook gate", () => {
    const audit: GlobalLaunchAudit = {
      ...baseAudit(),
      readiness: "not-ready",
      score: 38,
      dimensions: baseAudit().dimensions.map((item) => ({
        ...item,
        status: "block",
        score: 36,
        evidence: `${item.label} is missing public proof.`,
        action: `Repair ${item.label} before external sharing.`
      })),
      proofLinks: baseAudit().proofLinks.map((link) => ({
        ...link,
        status: "block",
        value: ""
      }))
    };
    const liveProof: GlobalProofDossierLinkSummary = {
      ...verifiedLinks(),
      verifiedCount: 0,
      score: 18,
      results: verifiedLinks().results.map((link) => ({
        ...link,
        status: "block",
        httpStatus: 404,
        evidence: `${link.label} is not reachable from a public review session.`,
        action: `Attach a public ${link.label} URL reviewers can open.`
      }))
    };
    const dossier = buildGlobalProofDossier({ audit, liveProof });
    const report = buildGlobalPublishabilityReport({
      audit,
      dossier,
      links: {
        launchEvidenceUrl: "https://service.example/launch-evidence?workspace=share",
        proofDossierUrl: "https://service.example/global-proof-dossier?workspace=share",
        globalAuditUrl: "https://service.example/global-launch-audit?workspace=share",
        acceptancePathUrl: "https://service.example/buyer-acceptance-path?workspace=share"
      }
    });
    const placeholders = proofRequirementPlaceholders(report);

    expect(report.repairRunbook.steps.map((step) => step.ticketId)).toEqual([
      "repair-ticket-01-live-reachability",
      "repair-ticket-02-proof-substance",
      "repair-ticket-03-value-story",
      "repair-ticket-04-ops-trust",
      "repair-ticket-05-buyer-decision-path"
    ]);
    expect(placeholders).toEqual(
      expect.arrayContaining([
        "<public Cloud Run product URL reviewers can open>",
        "<published ProtoPedia work URL>",
        "<public or unlisted walkthrough video URL>",
        "<public measured pilot receipt URL>",
        "<public buyer-approved work-order proof URL>",
        "<public buyer proof room URL>",
        "<public global proof dossier URL>",
        "<public trust manifest URL>",
        "<public launch room URL>",
        "<public buyer review kit URL>",
        "<public buyer acceptance path URL>"
      ])
    );
    expectNoFakeProofPlaceholders(placeholders);
    expect(report.receipt.payload.repairRunbook.steps.flatMap((step) => step.proofRequirements.map((requirement) => requirement.placeholder))).toEqual(placeholders);
  });

  it("holds global publishing when public reachability is blocked", () => {
    const audit = baseAudit();
    const liveProof = verifiedLinks();
    liveProof.score = 78;
    liveProof.verifiedCount = liveProof.results.length - 1;
    liveProof.results[0] = {
      ...liveProof.results[0],
      status: "block",
      httpStatus: 403,
      evidence: "Public URL responded with HTTP 403; external reviewers may not be able to open it.",
      action: "Make the artifact publicly readable or attach a different proof URL."
    };
    const dossier = buildGlobalProofDossier({ audit, liveProof });
    const report = buildGlobalPublishabilityReport({
      audit,
      dossier,
      links: {
        launchEvidenceUrl: "https://service.example/launch-evidence?workspace=share"
      }
    });

    expect(report.decision).toBe("do-not-publish");
    expect(report.status).toBe("block");
    expect(report.gates.find((gate) => gate.id === "live-reachability")).toMatchObject({
      status: "block",
      href: "https://service.example/launch-evidence?workspace=share"
    });
    expect(report.valueRoute.find((step) => step.id === "public-proof")).toMatchObject({
      status: "block",
      href: "https://service.example/launch-evidence?workspace=share",
      action: "Hold if the deployed product, story, demo, or receipt cannot be reached publicly."
    });
    expect(report.reviewerBrief).toMatchObject({
      recommendedDecision: "hold-public-launch",
      timebox: "10-minute blocker triage"
    });
    expect(report.reviewerBrief.stopRule).toContain("Public proof opens globally");
    expect(report.reviewerBrief.proofChecks.find((check) => check.id === "public-proof")).toMatchObject({
      status: "block",
      href: "https://service.example/launch-evidence?workspace=share"
    });
    expect(report.reviewerBrief.decisionOptions.find((option) => option.id === "hold-public-launch")).toMatchObject({
      action: "Repair Public proof opens globally before external sharing."
    });
    expect(report.handoffMemo).toMatchObject({
      audience: "launch-owner",
      subject: "Do not send: Public proof opens globally",
      requestedDecision: "Repair Public proof opens globally and rerun the publishability report."
    });
    expect(report.handoffMemo.noSendWarning).toContain("Do not send this memo to a buyer");
    expect(report.handoffMemo.copyText).toContain("Do not ask an external buyer to review this launch yet.");
    expect(report.handoffMemo.proofLinks.map((link) => link.label)).toContain("Fix Public proof opens globally");
    expect(report.launchPacket).toMatchObject({
      status: "block",
      headline: "Launch packet is locked until public proof is repaired",
      currentOwner: "Launch owner",
      currentCommand: "Hold if the deployed product, story, demo, or receipt cannot be reached publicly."
    });
    expect(report.launchPacket.publishRule).toContain("Do not publish for Global platform lead");
    expect(report.launchPacket.items[0]).toMatchObject({
      id: "launch-live-reachability",
      priority: "now",
      label: "Public proof opens globally",
      href: "https://service.example/launch-evidence?workspace=share",
      proofToAttach: expect.stringContaining("HTTPS product URL"),
      doneSignal: "Public proof opens globally returns pass in the regenerated publishability report."
    });
    expect(report.launchPacket.items.every((item) => item.doneSignal.includes("returns pass"))).toBe(true);
    expect(report.repairTickets[0]).toMatchObject({
      sourceItemId: "launch-live-reachability",
      priority: "now",
      status: "block",
      owner: "Launch owner",
      title: "Public proof opens globally",
      proofToAttach: expect.stringContaining("HTTPS product URL")
    });
    expect(report.repairTickets[0].acceptanceCriteria).toEqual([
      "Public proof opens globally returns pass in the regenerated publishability report.",
      "A reviewer can open the attached proof without private context or a separate walkthrough.",
      "The regenerated global publishability report shows this ticket's source item as pass."
    ]);
    expect(report.repairTickets[0].receiptGuard).toContain("Do not close this ticket");
    expect(decodeURIComponent(report.repairTickets[0].href.split(",")[1] ?? "")).toContain("## Acceptance criteria");
    expect(report.repairRunbook).toMatchObject({
      mode: "repair-required",
      status: "block",
      externalShareLocked: true,
      currentOwner: "Launch owner"
    });
    expect(report.repairRunbook.nowCount).toBeGreaterThan(0);
    expect(report.repairRunbook.steps[0]).toMatchObject({
      ticketId: "repair-ticket-01-live-reachability",
      inputLabel: "Open first repair surface",
      proofSlot: "HTTPS product URL, ProtoPedia/story URL, walkthrough URL, and public receipt URLs.",
      proofRequirements: [
        expect.objectContaining({ id: "targetUrl", label: "Live product" }),
        expect.objectContaining({ id: "protopediaUrl", label: "ProtoPedia story" }),
        expect.objectContaining({ id: "videoUrl", label: "Walkthrough video" })
      ],
      shareGate: expect.stringContaining("No external send")
    });
    expect(report.receipt).toMatchObject({
      receiptId: expect.stringMatching(/^global-publishability-do-not-publish-[a-f0-9]{12}$/),
      verification: expect.objectContaining({ status: "verified" })
    });
    expect(report.receipt.payload.repairs[0]).toMatchObject({
      label: "Public proof opens globally"
    });
    expect(report.receipt.payload.launchPacket).toMatchObject({
      status: "block",
      currentOwner: "Launch owner",
      currentCommand: "Hold if the deployed product, story, demo, or receipt cannot be reached publicly."
    });
    expect(report.receipt.payload.repairTickets[0]).toMatchObject({
      title: "Public proof opens globally",
      recheck: {
        href: "https://service.example/launch-evidence?workspace=share"
      }
    });
    expect(report.receipt.payload.repairRunbook).toMatchObject({
      mode: "repair-required",
      externalShareLocked: true
    });
    expect(report.receipt.payload.repairRunbook.steps[0]).toMatchObject({
      ticketId: "repair-ticket-01-live-reachability",
      proofSlot: "HTTPS product URL, ProtoPedia/story URL, walkthrough URL, and public receipt URLs.",
      proofRequirements: [
        expect.objectContaining({ id: "targetUrl" }),
        expect.objectContaining({ id: "protopediaUrl" }),
        expect.objectContaining({ id: "videoUrl" })
      ]
    });
    expect(report.repairLedger[0]).toMatchObject({
      priority: "now",
      label: "Public proof opens globally"
    });
    expect(report.primaryAction.label).toBe("Fix Public proof opens globally");
  });

  it("renders escaped public HTML with evidence links", () => {
    const audit: GlobalLaunchAudit = {
      ...baseAudit(),
      targetMarket: 'Buyer <script>alert("buyer")</script>',
      launchNarrative: 'Narrative <script>alert("bad")</script>'
    };
    const dossier = buildGlobalProofDossier({ audit, liveProof: verifiedLinks() });
    const report = buildGlobalPublishabilityReport({
      audit,
      dossier,
      links: {
        appUrl: "https://service.example/?workspace=share",
        launchRoomUrl: "https://service.example/launch-room?workspace=share",
        proofDossierUrl: "https://service.example/global-proof-dossier?workspace=share",
        globalAuditUrl: "https://service.example/global-launch-audit?workspace=share",
        launchEvidenceUrl: "https://service.example/launch-evidence?workspace=share",
        jsonUrl: "https://service.example/api/global-publishability?workspace=share",
        markdownUrl: "https://service.example/global-publishability.md?workspace=share"
      }
    });
    const html = renderGlobalPublishabilityReportHtml(report, {
      appUrl: "https://service.example/?workspace=share",
      jsonUrl: "https://service.example/api/global-publishability?workspace=share",
      markdownUrl: "https://service.example/global-publishability.md?workspace=share"
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Global Publishability Report");
    expect(html).toContain("Publishability receipt");
    expect(html).toContain("fnv1a-64");
    expect(html).toContain(GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH);
    expect(html).toContain('data-verify-receipt data-verify-api="/api/global-publishability/receipt/verify"');
    expect(html).toContain("Receipt not checked in this browser yet.");
    expect(html).toContain('id="global-publishability-receipt-verify-request"');
    expect(html).toContain("Buyer handoff memo");
    expect(html).toContain("Pilot approval request");
    expect(html).toContain("Global launch packet");
    expect(html).toContain("Owner repair tickets");
    expect(html).toContain("Evidence contract");
    expect(html).toContain("Download ticket");
    expect(html).toContain("Owner repair runbook");
    expect(html).toContain("Download runbook");
    expect(html).toContain("Download CSV");
    expect(html).toContain("Repair proof check");
    expect(html).toContain("data-repair-check-form");
    expect(html).toContain("global-publishability-repair-requirements");
    expect(html).toContain("data-proof-requirement");
    expect(html).toContain("/api/global-publishability/repair-check");
    expect(html).toContain("Check repair proof");
    expect(html).toContain("Repair proof has not been checked in this browser yet.");
    expect(html).toContain("data-repair-check-receipt-download");
    expect(html).toContain("data-repair-check-verifier");
    expect(html).toContain("/receipt-verifier?request=");
    expect(html).toContain("Download launch packet");
    expect(html).toContain('download="global-publishability-launch-packet.md"');
    expect(html).toContain("Proof to attach:");
    expect(html).toContain("Done signal:");
    expect(html).toContain("Reviewer decision brief");
    expect(html).toContain("Stop rule");
    expect(html).toContain("10-minute buyer review");
    expect(html).toContain("External review response");
    expect(html).toContain("data-review-response-form");
    expect(html).toContain("/api/global-publishability/review-response");
    expect(html).toContain("Record review response");
    expect(html).toContain("data-review-response-verifier");
    expect(html).toContain("Buyer value route");
    expect(html).toContain("Step 01 / Buyer value");
    expect(html).toContain("Step 04 / Buyer decision");
    expect(html).toContain("https://service.example/api/global-publishability?workspace=share");
    expect(html).toContain("repair-ticket-01-verify-public-route-before-publish.md");
    expect(html).toContain("&lt;script&gt;alert(&quot;buyer&quot;)&lt;/script&gt;");
    expect(html).not.toContain('<script>alert("buyer")</script>');
    expect(html).not.toContain('<script>alert("bad")</script>');
  });
});
