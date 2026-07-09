import { describe, expect, it } from "vitest";
import {
  buildLaunchRoom,
  buildLaunchRoomQuickAuditReceipt,
  launchRoomHandoffCopyText,
  renderLaunchRoomHtml,
  verifyLaunchRoomFollowUpReceipt,
  verifyLaunchRoomHandoffDecisionReceipt,
  type LaunchRoomAcceptancePathAttachment
} from "../src/launchRoom";
import { buildWorkspaceDraft, defaultWorkspaceDraft, type WorkspaceDraft } from "../src/workspaceDraft";

const proofCheckedNow = new Date("2026-06-20T08:00:00.000Z");

function readyWorkspace(patch: Partial<WorkspaceDraft> = {}) {
  const base = defaultWorkspaceDraft("2026-06-20T00:00:00.000Z");
  return buildWorkspaceDraft({
    activeTemplateId: base.activeTemplateId,
    projectBrief:
      patch.projectBrief ??
      "A public launch workspace for a DevOps AI agent that turns release-readiness reviews into buyer proof packets, Cloud Run evidence, and A2A work orders.",
    selectedAgentIds: patch.selectedAgentIds ?? ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"],
    customAgents: patch.customAgents ?? [],
    agentTrialEvidence:
      patch.agentTrialEvidence ??
      [
        {
          id: "trial-proof-1",
          receiptId: "receipt-1",
          agentId: "market-broker",
          agentName: "A2A Market Broker",
          skillId: "task.delegate",
          status: "accepted",
          score: 91,
          artifactUrl: "https://launch.example/trial-proof",
          evidenceSource: "Signed trial response",
          headline: "A2A trial accepted",
          summary: "A2A trial evidence is accepted.",
          attachedAt: "2026-06-20T00:00:00.000Z"
        }
      ],
    buyerScenario:
      patch.buyerScenario ??
      {
        teamSize: 12,
        hourlyCostYen: 12000,
        cyclesPerMonth: 6,
        manualHoursPerCycle: 32,
        adoptionRatePercent: 88,
        incidentRiskYenPerMonth: 900000
      },
    pilotRun:
      patch.pilotRun ??
      {
        observedManualMinutes: 120,
        observedAssistedMinutes: 38,
        participants: 5,
        acceptedTasks: 9,
        totalTasks: 10,
        evidenceUrl: "https://launch.example/pilot-receipt",
        reviewerName: "Pilot reviewer",
        notes: "First buyer pilot accepted the handoff."
      },
    buyerWorkOrder:
      patch.buyerWorkOrder ??
      {
        request: "Convert one release-readiness review into a public buyer proof packet with owners, acceptance checks, and a continue or revise decision.",
        targetUser: "Platform lead",
        successMetric: "Minutes saved per review and proof gaps closed before sponsor review",
        currentBaseline: "Manual release notes, scattered screenshots, and unclear owner handoffs",
        dataSensitivity: "public",
        evidenceUrl: "https://launch.example/work-order-proof"
      },
    targetUrl: patch.targetUrl ?? "https://launch.example/app",
    protopediaUrl: patch.protopediaUrl ?? "https://protopedia.net/project/example",
    videoUrl: patch.videoUrl ?? "https://video.example/demo",
    proofVerification: Object.hasOwn(patch, "proofVerification")
      ? (patch.proofVerification ?? null)
      : {
        checkedAt: "2026-06-20T01:00:00.000Z",
        verifiedCount: 5,
        totalCount: 5,
        score: 100,
        results: [
          { id: "targetUrl", label: "Deployed URL", status: "pass", httpStatus: 200, evidence: "Public URL responded with HTTP 200.", action: "Keep this link attached." },
          { id: "protopediaUrl", label: "ProtoPedia URL", status: "pass", httpStatus: 200, evidence: "Public URL responded with HTTP 200.", action: "Keep this link attached." },
          { id: "videoUrl", label: "Walkthrough video", status: "pass", httpStatus: 200, evidence: "Public URL responded with HTTP 200.", action: "Keep this link attached." },
          { id: "pilotEvidenceUrl", label: "Pilot receipt", status: "pass", httpStatus: 200, evidence: "Public URL responded with HTTP 200.", action: "Keep this link attached." },
          { id: "workOrderEvidenceUrl", label: "Work order proof", status: "pass", httpStatus: 200, evidence: "Public URL responded with HTTP 200.", action: "Keep this link attached." }
        ]
      },
    updatedAt: patch.updatedAt ?? base.updatedAt
  });
}

function verifiedAcceptancePathAttachment(patch: Partial<LaunchRoomAcceptancePathAttachment> = {}): LaunchRoomAcceptancePathAttachment {
  return {
    status: "verified",
    verified: true,
    receiptType: "buyer-acceptance-path.v1",
    pathId: "buyer-acceptance-path-approve-pilot-a1b2c3d4e5",
    pathStatus: "ready",
    decision: "approve-pilot",
    buyer: "Procurement sponsor",
    checksum: "1234567890abcdef",
    verifierUrl: "https://launch.example/receipt-verifier?request=buyer-acceptance-path",
    stageCount: 6,
    readyCount: 6,
    reviewCount: 0,
    blockedCount: 0,
    nextAction: "Buyer acceptance path receipt is verified. Keep this attached to the launch-room handoff.",
    ...patch
  };
}

describe("launch room", () => {
  it("builds a public room with artifact links from workspace state", () => {
    const room = buildLaunchRoom({
      workspace: readyWorkspace(),
      baseUrl: "https://launch.example",
      appUrl: "https://launch.example/?workspace=share-token",
      now: proofCheckedNow
    });

    expect(room.launchScore).toBeGreaterThan(70);
    expect(room.proofHealth).toMatchObject({
      readiness: "evidence-current",
      status: "ready",
      verifiedCount: 5,
      totalCount: 5
    });
    expect(room.valueProofLedger.cases.map((item) => item.id)).toEqual(["pessimistic", "base", "upside"]);
    expect(room.valueProofLedger.guardrails.map((item) => item.id)).toEqual(["break-even-adoption", "downside-payback", "value-at-risk"]);
    expect(room.valueProofLedger.confidenceBand).toContain("yen");
    expect(room.valueProofLedger.breakEvenAdoption).toMatch(/%$/);
    expect(["ready", "attention"]).toContain(room.valueProofLedger.pilotEvidence.status);
    expect(room.valueProofLedger.pilotEvidence.href).toContain("https://launch.example/pilot-run-receipt?brief=");
    expect(decodeURIComponent(room.valueProofLedger.href)).toContain("# Launch room value proof ledger");
    expect(room.buyerDecision.checks.map((check) => check.id)).toEqual(["value-case", "measured-pilot", "live-proof", "operating-gates"]);
    expect(room.buyerDecision.headline).toMatch(/buyer|sponsor/i);
    expect(room.buyerCoverSheet).toMatchObject({
      status: "review-needed",
      headline: expect.stringContaining("Sponsor review"),
      buyerPromise: expect.stringContaining(room.targetBuyer),
      primaryAsk: expect.stringContaining(room.nextAction.label),
      reviewTime: "25 min"
    });
    expect(room.buyerCoverSheet.signals.map((signal) => signal.id)).toEqual(["buyer-ask", "value-proof", "measured-proof", "trust-boundary", "reply-route"]);
    expect(room.buyerCoverSheet.signals.find((signal) => signal.id === "reply-route")).toMatchObject({
      status: "ready",
      value: "Revise and resend"
    });
    expect(room.buyerCoverSheet.copyText).toContain("# Buyer cover sheet");
    expect(room.buyerCoverSheet.copyText).toContain("## What buyer gets");
    expect(decodeURIComponent(room.buyerCoverSheet.href)).toContain("Buyer cover sheet");
    expect(room.stakeholderBriefs.map((brief) => brief.id)).toEqual(["economic-buyer", "security-reviewer", "pilot-operator", "procurement-owner"]);
    expect(room.stakeholderBriefs.find((brief) => brief.id === "economic-buyer")).toMatchObject({
      role: "Economic buyer brief",
      owner: room.targetBuyer,
      proofToOpen: "Buyer value memo"
    });
    expect(room.stakeholderBriefs.find((brief) => brief.id === "security-reviewer")?.response).toContain("Live proof");
    expect(room.stakeholderBriefs.find((brief) => brief.id === "procurement-owner")?.copyText).toContain("# Procurement owner brief");
    expect(decodeURIComponent(room.stakeholderBriefs[0]?.href ?? "")).toContain("Decision ask");
    expect(room.buyerActivityTrail.events.map((event) => event.id)).toEqual([
      "cover-sheet-prepared",
      "economic-buyer",
      "security-reviewer",
      "pilot-operator",
      "procurement-owner",
      "reply-route-recorded",
      "decision-receipt-sealed"
    ]);
    expect(room.buyerActivityTrail.summary).toContain("Recommended reply: revise");
    expect(room.buyerActivityTrail.events.find((event) => event.id === "reply-route-recorded")).toMatchObject({
      status: "ready",
      signal: "Revise and resend"
    });
    expect(room.buyerActivityTrail.copyText).toContain("# Buyer activity trail");
    expect(room.buyerActivityTrail.copyText).toContain("### Decision receipt sealed");
    expect(decodeURIComponent(room.buyerActivityTrail.href)).toContain("Buyer activity trail");
    expect(room.buyerActivityTrail.crmNote).toContain("# Buyer follow-up CRM note");
    expect(room.buyerActivityTrail.crmNote).toContain("Open items:");
    expect(room.buyerActivityTrail.slackUpdate).toContain("Buyer follow-up:");
    expect(room.buyerActivityTrail.slackUpdate).toContain("Receipt:");
    expect(room.buyerActivityTrail.taskCsv).toContain("eventId,label,status,actor,signal,nextAction,evidence,href");
    expect(room.buyerActivityTrail.taskCsv).toContain("reply-route-recorded");
    expect(room.buyerActivityTrail.crmNoteHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(room.buyerActivityTrail.slackUpdateHref).toMatch(/^data:text\/plain;charset=utf-8,/);
    expect(room.buyerActivityTrail.taskCsvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(room.buyerActivityTrail.followUpReceipt).toMatchObject({
      status: room.buyerActivityTrail.status,
      targetBuyer: room.targetBuyer,
      owner: room.buyerActivityTrail.nextOwner,
      checksumAlgorithm: "fnv1a-64"
    });
    expect(room.buyerActivityTrail.followUpReceipt.receiptId).toMatch(/^launch-follow-up-(ready|attention|blocked)-[a-f0-9]{12}$/);
    expect(room.buyerActivityTrail.followUpReceipt.checksum).toMatch(/^[a-f0-9]{16}$/);
    expect(room.buyerActivityTrail.followUpReceipt.replayFields).toEqual(["launchRoomId", "targetBuyer", "trailStatus", "headline", "summary", "nextOwner", "nextAction", "events", "exports"]);
    expect(room.buyerActivityTrail.followUpReceipt.replayPayload.exports).toMatchObject({
      crmNote: room.buyerActivityTrail.crmNote,
      slackUpdate: room.buyerActivityTrail.slackUpdate,
      taskCsv: room.buyerActivityTrail.taskCsv
    });
    expect(room.buyerActivityTrail.followUpReceipt.copyText).toContain("# Buyer follow-up receipt");
    expect(room.buyerActivityTrail.followUpReceipt.copyText).toContain("POST /api/launch-room/follow-up-receipt/verify");
    expect(decodeURIComponent(room.buyerActivityTrail.followUpReceipt.payloadHref)).toContain('"slackUpdate":');
    expect(verifyLaunchRoomFollowUpReceipt(room.buyerActivityTrail.followUpReceipt).status).toBe("verified");
    expect(
      verifyLaunchRoomFollowUpReceipt({
        checksum: room.buyerActivityTrail.followUpReceipt.checksum,
        replayPayload: {
          ...room.buyerActivityTrail.followUpReceipt.replayPayload,
          exports: {
            ...room.buyerActivityTrail.followUpReceipt.replayPayload.exports,
            slackUpdate: "tampered"
          }
        }
      }).status
    ).toBe("mismatch");
    expect(room.handoffPacket).toMatchObject({
      status: room.buyerDecision.status,
      subject: expect.stringMatching(/Pilot review|Internal repair/)
    });
    expect(room.handoffPacket.emailBody.join("\n")).toContain(room.buyerDecision.buyerQuestion);
    expect(room.handoffPacket.agenda.map((item) => item.id)).toEqual(["value", "pilot", "trust", "decision"]);
    expect(room.handoffPacket.acceptanceChecks.map((check) => check.id)).toEqual(["decision", "proof", "pilot", "operating"]);
    expect(room.handoffPacket.recommendedReply).toBe("revise");
    expect(room.handoffPacket.replyRoutes.map((route) => route.id)).toEqual(["approve", "revise", "hold"]);
    expect(room.handoffPacket.replyRoutes.find((route) => route.id === "approve")).toMatchObject({
      status: "blocked",
      record: "Do not record external approval from this packet."
    });
    expect(room.handoffPacket.replyRoutes.find((route) => route.id === "revise")).toMatchObject({
      status: "ready",
      record: "Record the revision owner and blocker being cleared."
    });
    expect(room.handoffPacket.decisionReceipt).toMatchObject({
      selectedReply: "revise",
      status: "ready",
      launchDecision: room.buyerDecision.verdict,
      record: "Record the revision owner and blocker being cleared.",
      checksumAlgorithm: "fnv1a-64"
    });
    expect(room.handoffPacket.decisionReceipt.receiptId).toMatch(/^launch-handoff-revise-[a-f0-9]{12}$/);
    expect(room.handoffPacket.decisionReceipt.checksum).toMatch(/^[a-f0-9]{16}$/);
    expect(room.handoffPacket.decisionReceipt.replayFields).toEqual([
      "launchRoomId",
      "launchDecision",
      "targetBuyer",
      "selectedReply",
      "routeStatus",
      "record",
      "nextAction",
      "evidence",
      "proofHealth",
      "primaryMetric"
    ]);
    expect(room.handoffPacket.decisionReceipt.copyText).toContain("# Launch room handoff decision receipt");
    expect(room.handoffPacket.decisionReceipt.copyText).toContain(`Receipt: ${room.handoffPacket.decisionReceipt.receiptId}`);
    expect(room.handoffPacket.decisionReceipt.copyText).toContain(`Checksum: fnv1a-64:${room.handoffPacket.decisionReceipt.checksum}`);
    expect(room.handoffPacket.decisionReceipt.copyText).toContain("## Replay payload");
    expect(room.handoffPacket.decisionReceipt.copyText).toContain('"selectedReply": "revise"');
    expect(room.handoffPacket.decisionReceipt.copyText).toContain("## Verification");
    expect(room.handoffPacket.decisionReceipt.copyText).toContain("- Status: verified");
    expect(room.handoffPacket.decisionReceipt.copyText).toContain("## API verification");
    expect(room.handoffPacket.decisionReceipt.copyText).toContain("POST /api/launch-room/handoff-receipt/verify");
    expect(room.handoffPacket.decisionReceipt.copyText).toContain('"checksum": ');
    expect(room.handoffPacket.decisionReceipt.copyText).toContain("Replay rule: Recompute fnv1a-64");
    expect(decodeURIComponent(room.handoffPacket.decisionReceipt.href)).toContain("# Launch room handoff decision receipt");
    expect(decodeURIComponent(room.handoffPacket.decisionReceipt.payloadHref)).toContain('"selectedReply": "revise"');
    expect(room.handoffPacket.decisionReceipt.verification).toMatchObject({
      status: "verified",
      expectedChecksum: room.handoffPacket.decisionReceipt.checksum,
      actualChecksum: room.handoffPacket.decisionReceipt.checksum
    });
    expect(verifyLaunchRoomHandoffDecisionReceipt(room.handoffPacket.decisionReceipt).status).toBe("verified");
    expect(
      verifyLaunchRoomHandoffDecisionReceipt({
        checksum: room.handoffPacket.decisionReceipt.checksum,
        replayPayload: {
          ...room.handoffPacket.decisionReceipt.replayPayload,
          selectedReply: "approve"
        }
      }).status
    ).toBe("mismatch");
    expect(room.artifacts.map((artifact) => artifact.id)).toEqual([
      "buyer-value",
      "work-order-brief",
      "buyer-proof-packet",
      "live-proof-audit",
      "delivery-memo",
      "sponsor-review",
      "pilot-run-receipt",
      "adoption-plan",
      "trust-center",
      "commercial-offer",
      "buyer-pilot-contract",
      "workspace"
    ]);
    expect(room.artifacts.find((artifact) => artifact.id === "work-order-brief")?.href).toContain(
      "https://launch.example/work-order-brief?brief="
    );
    expect(room.artifacts.find((artifact) => artifact.id === "work-order-brief")?.href).toContain("workOrderTargetUser=Platform+lead");
    expect(room.artifacts.find((artifact) => artifact.id === "delivery-memo")).toMatchObject({
      label: "Buyer delivery memo",
      href: expect.stringContaining("https://launch.example/buyer-delivery-memo?brief="),
      status: room.buyerDecision.status
    });
    expect(room.artifacts.find((artifact) => artifact.id === "live-proof-audit")).toMatchObject({
      label: "Live proof audit",
      href: expect.stringContaining("https://launch.example/buyer-proof-audit?brief="),
      status: room.proofHealth.status,
      owner: "Proof owner"
    });
    expect(room.artifacts.find((artifact) => artifact.id === "workspace")?.href).toBe("https://launch.example/?workspace=share-token");
    expect(room.nextAction.label).toBeTruthy();
    expect(room.closurePlan.length).toBeGreaterThan(0);
    expect(room.closurePlan.every((step) => step.action.length > 24)).toBe(true);
    expect(room.closurePlan.every((step) => step.editHref.startsWith("https://launch.example/?workspace=share-token#"))).toBe(true);
    expect(room.exportMarkdown).toContain("## Artifact links");
    expect(room.exportMarkdown).toContain("## Proof closure plan");
    expect(room.exportMarkdown).toContain("## Live proof health");
    expect(room.exportMarkdown).toContain("## Value proof ledger");
    expect(room.exportMarkdown).toContain("Confidence band:");
    expect(room.exportMarkdown).toContain("Measured pilot support:");
    expect(room.exportMarkdown).toContain("## Buyer cover sheet");
    expect(room.exportMarkdown).toContain("What buyer gets:");
    expect(room.exportMarkdown).toContain("## Stakeholder brief pack");
    expect(room.exportMarkdown).toContain("### Economic buyer brief");
    expect(room.exportMarkdown).toContain("### Security reviewer brief");
    expect(room.exportMarkdown).toContain("## Buyer activity trail");
    expect(room.exportMarkdown).toContain("Reply route recorded");
    expect(room.exportMarkdown).toContain("Decision receipt sealed");
    expect(room.exportMarkdown).toContain("CRM note: buyer-follow-up-crm-note.md");
    expect(room.exportMarkdown).toContain("Slack update: buyer-follow-up-slack-update.txt");
    expect(room.exportMarkdown).toContain("Task CSV: buyer-follow-up-tasks.csv");
    expect(room.exportMarkdown).toContain("Follow-up receipt:");
    expect(room.exportMarkdown).toContain("Follow-up checksum:");
    expect(room.exportMarkdown).toContain("Follow-up API verification: POST /api/launch-room/follow-up-receipt/verify");
    expect(room.exportMarkdown).toContain("## Buyer decision");
    expect(room.exportMarkdown).toContain("## Buyer handoff packet");
    expect(room.exportMarkdown).toContain("- Email body:");
    expect(room.exportMarkdown).toContain("- Reply router:");
    expect(room.exportMarkdown).toContain("Recommended: revise");
    expect(room.exportMarkdown).toContain("- Decision receipt:");
    expect(room.exportMarkdown).toContain(`Receipt: ${room.handoffPacket.decisionReceipt.receiptId}`);
    expect(room.exportMarkdown).toContain("Verification: verified");
    expect(room.exportMarkdown).toContain("API verification: POST /api/launch-room/handoff-receipt/verify");
    expect(room.exportMarkdown).toContain("Edit: https://launch.example/?workspace=share-token#");
    expect(room.exportMarkdown).toContain("Buyer proof packet");
    expect(room.exportMarkdown).toContain("Live proof audit");
    expect(room.exportMarkdown).toContain("Buyer delivery memo");
    expect(room.exportMarkdown).toContain("Adoption operating plan");
    expect(room.exportMarkdown).toContain("Buyer trust center");
    expect(room.exportMarkdown).toContain("Commercial offer");

    const html = renderLaunchRoomHtml(room, {
      appUrl: "https://launch.example/?workspace=share-token",
      shareGateUrl: "https://launch.example/buyer-share-gate?workspace=share-token"
    });
    expect(html).toContain('aria-label="Buyer decision room"');
    expect(html).toContain("Buyer decision room");
    expect(html).toContain("Open decision memo");
    expect(html).toContain('aria-label="Value proof ledger"');
    expect(html).toContain("Value proof ledger");
    expect(html).toContain("Download ledger");
    expect(html).toContain("Measured pilot support");
    expect(html).toContain("Copy handoff");
    expect(html).toContain("Handoff not copied in this browser yet.");
    expect(html).toContain("Receipt not verified in this browser yet.");
    expect(html).toContain("Recommended reply");
    expect(html).toContain('id="launch-room-action-config"');
    expect(html).toContain("/api/launch-room/handoff-copy");
    expect(html).toContain("/api/launch-room/handoff-receipt/request");
    expect(html).toContain("/api/launch-room/follow-up-receipt/request");
    expect(html).toContain("data-launch-room-copy-handoff");
    expect(html).toContain(room.handoffPacket.decisionReceipt.checksum);
    expect(html).not.toContain('id="launch-room-handoff-copy"');
    expect(html).not.toContain('id="launch-room-handoff-verify-request"');
    expect(html).not.toContain('id="launch-room-follow-up-verify-request"');
    expect(html).not.toContain("data:text/markdown");
    expect(html).not.toContain("data:application/json");
    expect(html.length).toBeLessThan(150_000);
    expect(html).toContain('aria-label="Buyer cover sheet"');
    expect(html).toContain("What buyer gets");
    expect(html).toContain("Download cover sheet");
    expect(html).toContain('aria-label="Stakeholder brief pack"');
    expect(html).toContain("Economic buyer brief");
    expect(html).toContain("Security reviewer brief");
    expect(html).toContain("Download brief");
    expect(html).toContain('aria-label="Buyer activity trail"');
    expect(html).toContain("Buyer follow-up");
    expect(html).toContain("Download trail");
    expect(html).toContain("buyer-follow-up-crm-note.md");
    expect(html).toContain("buyer-follow-up-slack-update.txt");
    expect(html).toContain("buyer-follow-up-tasks.csv");
    expect(html).toContain("buyer-follow-up-receipt.md");
    expect(html).toContain("buyer-follow-up-replay-payload.json");
    expect(html).toContain("data-launch-room-follow-up-verify");
    expect(html).toContain(room.buyerActivityTrail.followUpReceipt.checksum);
    expect(html).toContain("Share gate");
    expect(html).toContain("https://launch.example/buyer-share-gate?workspace=share-token");

    const handoffCopy = launchRoomHandoffCopyText(room);
    expect(handoffCopy).toContain(`Subject: ${room.handoffPacket.subject}`);
    expect(handoffCopy).toContain("Delivery memo:");
    expect(handoffCopy).toContain("/buyer-delivery-memo?brief=");
    expect(handoffCopy).toContain("Review agenda:");
    expect(handoffCopy).toContain("Acceptance checks:");
    expect(handoffCopy).toContain("Reply router:");
    expect(handoffCopy).toContain("Revise and resend");
    expect(handoffCopy).toContain("Decision receipt:");
    expect(handoffCopy).toContain(`Checksum: fnv1a-64:${room.handoffPacket.decisionReceipt.checksum}`);
    expect(handoffCopy).toContain("Verification: verified");
    expect(handoffCopy).toContain("API verification: POST /api/launch-room/handoff-receipt/verify");
    expect(handoffCopy).toContain(`Launch decision: ${room.buyerDecision.verdict}`);
    expect(handoffCopy).toContain(`Next action: ${room.nextAction.owner}: ${room.nextAction.action}`);
    expect(handoffCopy).not.toContain("[object Object]");
  });

  it("attaches a verified buyer acceptance path to the execution handoff", () => {
    const acceptancePath = verifiedAcceptancePathAttachment();
    const room = buildLaunchRoom({
      workspace: readyWorkspace(),
      baseUrl: "https://launch.example",
      appUrl: "https://launch.example/?workspace=share-token",
      now: proofCheckedNow,
      acceptancePath
    });

    expect(room.acceptancePath).toMatchObject({
      verified: true,
      pathId: acceptancePath.pathId,
      checksum: acceptancePath.checksum
    });
    expect(room.artifacts.map((artifact) => artifact.id)).toContain("acceptance-path");
    expect(room.artifacts.find((artifact) => artifact.id === "acceptance-path")).toMatchObject({
      label: "Buyer acceptance path",
      status: "ready",
      href: acceptancePath.verifierUrl,
      owner: acceptancePath.buyer
    });
    expect(room.buyerDecision.checks.find((check) => check.id === "acceptance-path")).toMatchObject({
      label: "Acceptance path",
      value: "approve-pilot / ready",
      status: "ready",
      evidence: expect.stringContaining(acceptancePath.pathId)
    });
    expect(room.handoffPacket.emailBody.join("\n")).toContain(`Acceptance path: 6/6 acceptance stages ready; ${acceptancePath.pathId}`);
    expect(room.handoffPacket.agenda.map((item) => item.id)).toEqual(["value", "pilot", "trust", "acceptance-path", "decision"]);
    expect(room.handoffPacket.acceptanceChecks.map((check) => check.id)).toEqual(["decision", "proof", "pilot", "operating", "acceptance-path"]);
    expect(room.buyerCoverSheet.signals.map((signal) => signal.id)).toEqual(["buyer-ask", "value-proof", "measured-proof", "trust-boundary", "acceptance-path", "reply-route"]);
    expect(room.buyerCoverSheet.buyerPromise).toContain("verified acceptance path");
    expect(room.stakeholderBriefs.find((brief) => brief.id === "procurement-owner")?.response).toContain("Acceptance path:");
    expect(room.buyerActivityTrail.events.map((event) => event.id)).toContain("acceptance-path-attached");
    expect(room.handoffPacket.decisionReceipt.replayFields).toContain("acceptancePath");
    expect(room.handoffPacket.decisionReceipt.replayPayload.acceptancePath).toMatchObject({
      pathId: acceptancePath.pathId,
      status: acceptancePath.pathStatus,
      decision: acceptancePath.decision,
      verified: true,
      checksum: acceptancePath.checksum
    });
    expect(room.handoffPacket.decisionReceipt.copyText).toContain('"acceptancePath":');
    expect(verifyLaunchRoomHandoffDecisionReceipt(room.handoffPacket.decisionReceipt).status).toBe("verified");
    expect(room.exportMarkdown).toContain("## Acceptance path attachment");
    expect(room.exportMarkdown).toContain(acceptancePath.pathId);

    const handoffCopy = launchRoomHandoffCopyText(room);
    expect(handoffCopy).toContain("Acceptance path:");
    expect(handoffCopy).toContain(`Path: ${acceptancePath.pathId}`);
    expect(handoffCopy).toContain(`Verifier: ${acceptancePath.verifierUrl}`);

    const html = renderLaunchRoomHtml(room, {
      appUrl: "https://launch.example/?workspace=share-token",
      jsonUrl: "https://launch.example/api/launch-room?workspace=share-token&acceptancePathRequest=receipt-json",
      markdownUrl: "https://launch.example/launch-room.md?workspace=share-token&acceptancePathRequest=receipt-json"
    });
    expect(html).toContain("Buyer acceptance path");
    expect(html).toContain("Acceptance path");
    expect(html).toContain(acceptancePath.verifierUrl);
    expect(html).toContain("acceptancePath");
  });

  it("blocks external handoff when an attached acceptance path receipt is not verified", () => {
    const room = buildLaunchRoom({
      workspace: readyWorkspace(),
      baseUrl: "https://launch.example",
      now: proofCheckedNow,
      acceptancePath: verifiedAcceptancePathAttachment({
        status: "mismatch",
        verified: false,
        pathStatus: "review",
        readyCount: 4,
        reviewCount: 1,
        blockedCount: 1,
        nextAction: "Do not accept this buyer acceptance path receipt. Re-export the path before buyer approval."
      })
    });

    const acceptanceCheck = room.buyerDecision.checks.find((check) => check.id === "acceptance-path");
    expect(acceptanceCheck).toMatchObject({
      status: "blocked",
      value: "mismatch"
    });
    expect(room.buyerDecision.verdict).toBe("hold");
    expect(room.handoffPacket.recommendedReply).toBe("hold");
    expect(room.handoffPacket.acceptanceChecks.find((check) => check.id === "acceptance-path")).toMatchObject({
      status: "blocked"
    });
  });

  it("blocks external handoff when a verified acceptance path recommends stop", () => {
    const acceptancePath = verifiedAcceptancePathAttachment({
      pathId: "buyer-acceptance-path-do-not-send-badc0ffee0",
      pathStatus: "blocked",
      decision: "do-not-send",
      decisionRecommendation: "stop",
      selectedDecision: "continue",
      decisionAlignment: "overridden",
      openDecisionConditionCount: 4,
      blockedDecisionConditionCount: 3,
      watchDecisionConditionCount: 1,
      blockingSummary: "3 blocked condition(s) prevent a clean continue decision.",
      overrideWarning: "Continue is not evidence-aligned. This receipt stays conditional until open conditions are repaired.",
      continueCriteria: ["Repair proof verifier blockers.", "Resolve procurement blockers."],
      stageCount: 5,
      readyCount: 0,
      reviewCount: 0,
      blockedCount: 5,
      nextAction: "Continue is not evidence-aligned. Repair the acceptance path before launch-room handoff."
    });
    const room = buildLaunchRoom({
      workspace: readyWorkspace(),
      baseUrl: "https://launch.example",
      now: proofCheckedNow,
      acceptancePath
    });

    const acceptanceCheck = room.buyerDecision.checks.find((check) => check.id === "acceptance-path");
    expect(acceptanceCheck).toMatchObject({
      status: "blocked",
      value: "do-not-send / blocked / stop recommended",
      evidence: expect.stringContaining("Decision gate recommends stop, selected continue")
    });
    expect(room.buyerDecision.verdict).toBe("hold");
    expect(room.handoffPacket.recommendedReply).toBe("hold");
    expect(room.handoffPacket.emailBody.join("\n")).toContain("Decision gate recommends stop, selected continue");
    expect(room.handoffPacket.decisionReceipt.replayPayload.acceptancePath).toMatchObject({
      pathId: acceptancePath.pathId,
      decision: "do-not-send",
      decisionRecommendation: "stop",
      selectedDecision: "continue",
      decisionAlignment: "overridden",
      openDecisionConditionCount: 4,
      blockedDecisionConditionCount: 3,
      watchDecisionConditionCount: 1,
      verified: true,
      checksum: acceptancePath.checksum
    });
    expect(room.buyerCoverSheet.buyerPromise).toContain("acceptance path repair gate");
    expect(room.buyerActivityTrail.events.find((event) => event.id === "acceptance-path-attached")).toMatchObject({
      status: "blocked",
      nextAction: acceptancePath.nextAction
    });
    expect(room.exportMarkdown).toContain("Evidence recommendation: stop");
    expect(room.exportMarkdown).toContain("Acceptance path continue criteria");
    expect(verifyLaunchRoomHandoffDecisionReceipt(room.handoffPacket.decisionReceipt).status).toBe("verified");
  });

  it("renders a verified Quick intake audit receipt when launch-room URL carries one", () => {
    const quickAuditReceipt = buildLaunchRoomQuickAuditReceipt({
      packet: "verified",
      receiptId: "workflow-live-proof-verified-d5780cf0",
      checksum: "fnv1a32:d5780cf0",
      status: "verified",
      checkedAt: "2026-06-23T10:20:30.000Z",
      score: "100",
      verified: "5/5"
    });

    expect(quickAuditReceipt).toMatchObject({
      receiptId: "workflow-live-proof-verified-d5780cf0",
      checksum: "fnv1a32:d5780cf0",
      score: 100,
      verifiedCount: 5,
      totalCount: 5
    });
    if (!quickAuditReceipt) throw new Error("Expected Quick audit receipt to parse.");

    const room = buildLaunchRoom({
      workspace: readyWorkspace({ proofVerification: null }),
      baseUrl: "https://launch.example",
      now: proofCheckedNow,
      quickAuditReceipt
    });
    const html = renderLaunchRoomHtml(room);

    expect(room.quickAuditReceipt).toBe(quickAuditReceipt);
    expect(room.proofHealth).toMatchObject({
      readiness: "evidence-current",
      status: "ready",
      checkedAt: "2026-06-23T10:20:30.000Z",
      verifiedCount: 5,
      totalCount: 5,
      blockedCount: 0,
      watchCount: 0
    });
    expect(room.buyerDecision.checks.find((check) => check.id === "live-proof")).toMatchObject({
      status: "ready",
      value: "5/5"
    });
    expect(room.exportMarkdown).toContain("## Quick intake audit receipt");
    expect(room.exportMarkdown).toContain("Receipt: workflow-live-proof-verified-d5780cf0");
    expect(room.exportMarkdown).toContain("Checksum: fnv1a32:d5780cf0");
    expect(launchRoomHandoffCopyText(room)).toContain("Quick intake audit: workflow-live-proof-verified-d5780cf0 (fnv1a32:d5780cf0), 5/5 verified at 2026-06-23T10:20:30.000Z.");
    expect(html).toContain('aria-label="Verified Quick intake audit"');
    expect(html).toContain("Live proof receipt is attached to this buyer room");
    expect(html).toContain("workflow-live-proof-verified-d5780cf0");
    expect(html).toContain("fnv1a32:d5780cf0");
    expect(html).toContain("2026-06-23T10:20:30.000Z");
    expect(html).toContain("5/5");
    expect(html).toContain("100/100");
  });

  it("rejects spoofed Quick audit query params before rendering the receipt panel", () => {
    expect(
      buildLaunchRoomQuickAuditReceipt({
        packet: "verified",
        receiptId: "workflow-live-proof-action-required-d5780cf0",
        checksum: "fnv1a32:d5780cf0",
        status: "verified",
        checkedAt: "2026-06-23T10:20:30.000Z",
        score: "100",
        verified: "5/5"
      })
    ).toBeNull();
    expect(
      buildLaunchRoomQuickAuditReceipt({
        packet: "verified",
        receiptId: "workflow-live-proof-verified-d5780cf0",
        checksum: "fnv1a32:d5780cf0",
        status: "verified",
        checkedAt: "2026-06-23T10:20:30.000Z",
        score: "100",
        verified: "4/5"
      })
    ).toBeNull();
    expect(
      buildLaunchRoomQuickAuditReceipt({
        packet: "verified",
        receiptId: "workflow-live-proof-verified-d5780cf0",
        checksum: "fnv1a32:d5780cf0",
        status: "verified",
        checkedAt: "not-run",
        score: "100",
        verified: "5/5"
      })
    ).toBeNull();
    const validReceipt = buildLaunchRoomQuickAuditReceipt({
      packet: "verified",
      receiptId: "workflow-live-proof-verified-d5780cf0",
      checksum: "fnv1a32:d5780cf0",
      status: "verified",
      checkedAt: "2026-06-23T10:20:30.000Z",
      score: "100",
      verified: "5/5"
    });
    if (!validReceipt) throw new Error("Expected valid Quick audit receipt to parse.");
    const incompleteRoom = buildLaunchRoom({
      workspace: readyWorkspace({ proofVerification: null, videoUrl: "" }),
      baseUrl: "https://launch.example",
      now: proofCheckedNow,
      quickAuditReceipt: validReceipt
    });

    expect(incompleteRoom.quickAuditReceipt).toBeUndefined();
    expect(incompleteRoom.proofHealth.status).not.toBe("ready");
    expect(renderLaunchRoomHtml(incompleteRoom)).not.toContain('aria-label="Verified Quick intake audit"');
    expect(renderLaunchRoomHtml(buildLaunchRoom({ workspace: readyWorkspace(), baseUrl: "https://launch.example", now: proofCheckedNow }))).not.toContain('aria-label="Verified Quick intake audit"');
  });

  it("keeps incomplete workspaces honest instead of marking them buyer-ready", () => {
    const workspace = readyWorkspace({
      agentTrialEvidence: [],
      targetUrl: "",
      protopediaUrl: "",
      videoUrl: "",
      proofVerification: null,
      pilotRun: {
        observedManualMinutes: 90,
        observedAssistedMinutes: 90,
        participants: 1,
        acceptedTasks: 0,
        totalTasks: 3,
        evidenceUrl: "",
        reviewerName: "",
        notes: ""
      },
      buyerWorkOrder: {
        request: "Review launch",
        targetUser: "",
        successMetric: "Launch readiness",
        currentBaseline: "Manual notes",
        dataSensitivity: "restricted",
        evidenceUrl: ""
      }
    });
    const room = buildLaunchRoom({ workspace, baseUrl: "https://launch.example" });

    expect(room.readiness).not.toBe("buyer-ready");
    expect(room.artifacts.some((artifact) => artifact.status === "blocked")).toBe(true);
    expect(room.nextAction.label).toBe("Work order brief");
    expect(room.nextAction.href).toContain("https://launch.example/work-order-brief");
    expect(room.closurePlan.map((step) => step.artifactId)).toContain("work-order-brief");
    const workOrderStep = room.closurePlan.find((step) => step.artifactId === "work-order-brief");
    const proofPacketStep = room.closurePlan.find((step) => step.artifactId === "buyer-proof-packet");
    expect(workOrderStep?.acceptanceSignal).toContain("Work Order Brief");
    expect(workOrderStep?.editHref).toBe("#buyer-work-order-studio");
    expect(proofPacketStep?.proofToAttach).toContain("Cloud Run URL");
    expect(proofPacketStep?.editHref).toBe("#launch-evidence-console");
    expect(room.proofHealth).toMatchObject({
      readiness: "not-armed",
      status: "blocked"
    });
    expect(room.valueProofLedger).toMatchObject({
      status: "blocked",
      pilotEvidence: {
        status: "blocked"
      }
    });
    expect(room.buyerDecision).toMatchObject({
      verdict: "hold",
      status: "blocked"
    });
    expect(room.buyerDecision.instruction).toContain("First blocker");
    expect(room.buyerCoverSheet).toMatchObject({
      status: "hold",
      headline: expect.stringContaining("Keep internal"),
      primaryAsk: expect.stringContaining("Hold external launch")
    });
    expect(room.buyerCoverSheet.doNotSendIf).toContain("Do not send if");
    expect(room.stakeholderBriefs.find((brief) => brief.id === "procurement-owner")).toMatchObject({
      status: "blocked",
      decisionAsk: expect.stringContaining("Record approve")
    });
    expect(room.buyerActivityTrail).toMatchObject({
      status: "blocked",
      headline: expect.stringContaining("stays internal")
    });
    expect(room.buyerActivityTrail.events.find((event) => event.id === "cover-sheet-prepared")).toMatchObject({
      status: "blocked",
      signal: expect.stringContaining("Keep internal")
    });
    expect(room.handoffPacket).toMatchObject({
      status: "blocked",
      sendInstruction: expect.stringContaining("Do not send")
    });
    expect(room.handoffPacket.subject).toContain("Internal repair");
    expect(room.handoffPacket.recommendedReply).toBe("hold");
    expect(room.handoffPacket.replyRoutes.find((route) => route.id === "approve")).toMatchObject({
      status: "blocked",
      record: "Do not record external approval from this packet."
    });
    expect(room.handoffPacket.replyRoutes.find((route) => route.id === "hold")).toMatchObject({
      status: "ready",
      record: "Hold external launch until the first blocker is closed."
    });
    expect(room.handoffPacket.decisionReceipt).toMatchObject({
      selectedReply: "hold",
      status: "ready",
      record: "Hold external launch until the first blocker is closed."
    });
  });

  it("escapes buyer-provided text in the public HTML", () => {
    const room = buildLaunchRoom({
      workspace: readyWorkspace({
        projectBrief: 'Launch proof <script>alert("brief")</script>',
        buyerWorkOrder: {
          request: 'Close review <script>alert("work")</script>',
          targetUser: 'Platform lead </script><script>alert("target")</script>',
          successMetric: "Minutes saved per review and proof gaps closed before sponsor review",
          currentBaseline: "Manual release notes, scattered screenshots, and unclear owner handoffs",
          dataSensitivity: "public",
          evidenceUrl: "https://launch.example/work-order-proof"
        }
      }),
      baseUrl: "https://launch.example",
      appUrl: "https://launch.example/?workspace=share-token",
      now: proofCheckedNow
    });

    const html = renderLaunchRoomHtml(room);
    expect(html).toContain('aria-label="Buyer decision room"');
    expect(html).toContain("Copy handoff");
    expect(html).toContain('id="launch-room-action-config"');
    expect(html).not.toContain('id="launch-room-handoff-copy"');
    expect(html).toContain('aria-label="Buyer cover sheet"');
    expect(html).toContain("Buyer cover sheet");
    expect(html).toContain("What buyer gets");
    expect(html).toContain("Download cover sheet");
    expect(html).toContain('aria-label="Stakeholder brief pack"');
    expect(html).toContain("Economic buyer brief");
    expect(html).toContain('aria-label="Buyer activity trail"');
    expect(html).toContain("Buyer activity trail");
    expect(html).toContain('aria-label="Buyer decision"');
    expect(html).toContain("Buyer decision");
    expect(html).toContain('aria-label="Buyer handoff packet"');
    expect(html).toContain("Suggested email");
    expect(html).toContain("Review agenda");
    expect(html).toContain("Acceptance checks");
    expect(html).toContain('aria-label="Buyer reply router"');
    expect(html).toContain("Reply router");
    expect(html).toContain("Hold external launch until the first blocker is closed.");
    expect(html).toContain('aria-label="Handoff decision receipt"');
    expect(html).toContain("Decision receipt");
    expect(html).toContain("Checksum");
    expect(html).toContain("Verification");
    expect(html).toContain("POST /api/launch-room/handoff-receipt/verify");
    expect(html).toContain("Download markdown receipt");
    expect(html).toContain("Download replay payload");
    expect(html).toContain("Verify receipt");
    expect(html).not.toContain('id="launch-room-handoff-verify-request"');
    expect(html).not.toContain('id="launch-room-follow-up-verify-request"');
    expect(html).toContain("data-launch-room-handoff-verify-result");
    expect(html).toContain("data-launch-room-follow-up-verify-result");
    expect(html).toContain(room.handoffPacket.decisionReceipt.checksum);
    expect(html).not.toContain("data:text/markdown");
    expect(html).not.toContain("data:application/json");
    expect(html).toContain(">Open delivery memo</a>");
    expect(html).not.toContain(">Delivery memo: https://launch.example/buyer-delivery-memo");
    expect(html).toContain(">Delivery memo</a>");
    expect(html).toContain("/buyer-delivery-memo");
    expect(html).not.toContain("/buyer-delivery-memo?brief=");
    expect(html).not.toContain("trialEvidence=");
    expect(html).toContain('aria-label="Live proof health"');
    expect(html).toContain("5/5 links verified");
    expect(html).toContain('aria-label="Proof queue"');
    expect(html).toContain("proof tasks before buyer-ready");
    expect(html).toContain(`Start with ${room.closurePlan[0].label}`);
    expect(html).toContain(">Fix in workspace</a>");
    expect(html).toContain(">Review artifact</a>");
    expect(html).toContain("https://launch.example/?workspace=share-token#");
    expect(html).toContain("Proof closure plan");
    expect(html).toContain("&lt;script&gt;alert(&quot;brief&quot;)&lt;/script&gt;");
    expect(html).toContain("Close review &lt;script&gt;alert(&quot;work&quot;)&lt;/script&gt;");
    expect(html).toContain("Platform lead &lt;/script&gt;&lt;script&gt;alert(&quot;target&quot;)&lt;/script&gt;");
    expect(html).not.toContain('<script>alert("brief")</script>');
    expect(html).not.toContain('<script>alert("work")</script>');
    expect(html).not.toContain('<script>alert("target")</script>');
    expect(html).not.toContain('</script><script>alert("target")</script>');
  });

  it("keeps handoff receipt replay JSON out of the public HTML", () => {
    const room = buildLaunchRoom({
      workspace: readyWorkspace(),
      baseUrl: "https://launch.example",
      now: proofCheckedNow
    });
    const unsafeRoom = {
      ...room,
      handoffPacket: {
        ...room.handoffPacket,
        decisionReceipt: {
          ...room.handoffPacket.decisionReceipt,
          replayPayload: {
            ...room.handoffPacket.decisionReceipt.replayPayload,
            targetBuyer: 'Buyer </script><script>alert("json")</script>'
          }
        }
      }
    };

    const html = renderLaunchRoomHtml(unsafeRoom);

    expect(html).toContain('id="launch-room-action-config"');
    expect(html).not.toContain("\\u003c/script\\u003e\\u003cscript\\u003ealert");
    expect(html).not.toContain("Buyer &lt;/script&gt;&lt;script&gt;alert");
    expect(html).not.toContain('</script><script>alert("json")</script>');
  });

  it("keeps raw live proof verification evidence out of the public HTML", () => {
    const room = buildLaunchRoom({
      workspace: readyWorkspace({
        proofVerification: {
          checkedAt: "2026-06-20T01:00:00.000Z",
          verifiedCount: 4,
          totalCount: 5,
          score: 82,
          results: [
            { id: "targetUrl", label: "Deployed URL", status: "pass", httpStatus: 200, evidence: "Public URL responded.", action: "Keep this link attached." },
            { id: "videoUrl", label: "Walkthrough video", status: "watch", httpStatus: 503, evidence: '<script>alert("proof")</script>', action: "Retry this proof." }
          ]
        }
      }),
      baseUrl: "https://launch.example",
      now: proofCheckedNow
    });

    const html = renderLaunchRoomHtml(room);
    expect(room.proofHealth.status).toBe("attention");
    expect(html).toContain("Live proof health");
    expect(html).toContain("1/2 links verified");
    expect(html).not.toContain('<script>alert("proof")</script>');
    expect(html).not.toContain("&lt;script&gt;alert(&quot;proof&quot;)&lt;/script&gt;");
  });
});
