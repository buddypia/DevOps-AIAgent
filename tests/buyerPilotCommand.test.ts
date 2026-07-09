import { describe, expect, it } from "vitest";
import { buildBuyerPilotCommand } from "../src/buyerPilotCommand";
import { buildLaunchRoom, LAUNCH_ROOM_HANDOFF_RECEIPT_VERIFY_PATH, type LaunchRoom } from "../src/launchRoom";
import { defaultWorkspaceDraft } from "../src/workspaceDraft";

function valueProofLedger(status: LaunchRoom["valueProofLedger"]["status"] = "ready"): LaunchRoom["valueProofLedger"] {
  return {
    status,
    headline: "Value proof survives downside review",
    summary: "Base, downside, and pilot evidence are ready for buyer review.",
    confidenceBand: "700,000 yen - 1,200,000 yen / month",
    breakEvenAdoption: "42%",
    valueAtRisk: "240,000 yen",
    pilotEvidence: {
      status,
      value: "900,000 yen measured / month",
      evidence: "82m saved/run, 90% accepted, reviewer Platform lead.",
      href: "https://launch.example/pilot-run-receipt"
    },
    cases: [
      { id: "pessimistic", label: "Pessimistic", status, monthlyValue: "700,000 yen", monthlyHoursSaved: "42h", paybackDays: "36 days", adoption: "50% adoption / 48% automation", evidence: "Fixture downside case." },
      { id: "base", label: "Base", status, monthlyValue: "900,000 yen", monthlyHoursSaved: "56h", paybackDays: "24 days", adoption: "75% adoption / 64% automation", evidence: "Fixture base case." },
      { id: "upside", label: "Upside", status, monthlyValue: "1,200,000 yen", monthlyHoursSaved: "72h", paybackDays: "18 days", adoption: "90% adoption / 72% automation", evidence: "Fixture upside case." }
    ],
    guardrails: [
      { id: "break-even-adoption", label: "Break-even adoption", status, value: "42%", evidence: "Fixture adoption floor." },
      { id: "downside-payback", label: "Downside payback", status, value: "36 days", evidence: "Fixture downside payback." },
      { id: "value-at-risk", label: "Value at risk", status, value: "240,000 yen", evidence: "Fixture value at risk." }
    ],
    exportMarkdown: "# Launch room value proof ledger",
    href: "data:text/markdown;charset=utf-8,%23%20Launch%20room%20value%20proof%20ledger"
  };
}

describe("buyer pilot command", () => {
  it("prioritizes the buyer value memo when value is the current blocker", () => {
    const room = buildLaunchRoom({
      workspace: defaultWorkspaceDraft("2026-06-20T00:00:00.000Z"),
      baseUrl: "https://launch.example",
      appUrl: "https://launch.example/?workspace=share-token"
    });
    const command = buildBuyerPilotCommand(room);

    expect(command.readiness).toBe("needs-value");
    expect(command.headline).toContain("buyer value");
    expect(command.nextGap.label).toBe("Buyer value memo");
    expect(command.nextGap.href).toContain("/buyer-value");
    expect(command.nextGap.editHref).toBe("#buyer-value-simulator");
    expect(command.nextGap.action).toBe("Tune the value model until the buyer can see base, downside, and break-even economics without a sales explanation.");
    expect(command.gapQueue).toHaveLength(3);
    expect(command.gapQueue[0]).toMatchObject({
      artifactId: "buyer-value",
      editHref: "https://launch.example/?workspace=share-token#buyer-value-simulator",
      isCurrent: true
    });
    expect(command.gapQueue[0].acceptanceSignal).toContain("Buyer Value Report");
    expect(command.gapQueue[1].editHref).toContain("#buyer-work-order-studio");
    expect(command.gapQueue[2].href).toContain("/buyer-proof-packet");
    expect(command.steps.find((step) => step.id === "buyer-value")?.isCurrent).toBe(true);
    expect(command.steps.find((step) => step.id === "work-order-brief")?.editHref).toBe("#buyer-work-order-studio");
    expect(command.steps.find((step) => step.id === "adoption-plan")?.editHref).toBe("#adoption-operating-plan");
    expect(command.steps.find((step) => step.id === "trust-center")?.editHref).toBe("#buyer-trust-center");
    expect(command.steps.find((step) => step.id === "commercial-offer")?.editHref).toBe("#commercial-offer");
    expect(command.steps.find((step) => step.id === "buyer-pilot-contract")?.editHref).toBe("#commercial-offer");
    expect(command.steps.find((step) => step.id === "delivery-memo")?.editHref).toBe("#marketplace-workbench");
    expect(command.steps.find((step) => step.id === "live-proof-audit")?.editHref).toBe("#launch-evidence-console");
    expect(command.steps).toHaveLength(11);
  });

  it("uses the delivery memo as the final external sharing target when ready", () => {
    const readyRoom: LaunchRoom = {
      id: "launch-room-buyer-ready-96",
      readiness: "buyer-ready",
      launchScore: 96,
      headline: "Buyer-facing launch room is ready",
      hardTruth: "Everything needed for external review is ready.",
      targetBuyer: "Platform lead",
      projectBrief: "Launch a public buyer proof workflow.",
      primaryMetric: {
        id: "value",
        label: "Modeled monthly buyer value",
        value: "900,000 yen",
        status: "ready",
        evidence: "Measured value is attached."
      },
      metrics: [],
      nextAction: {
        label: "Share buyer proof packet",
        owner: "Sponsor owner",
        action: "Send the packet.",
        href: "https://launch.example/buyer-proof-packet"
      },
      artifacts: [
        { id: "buyer-value", label: "Buyer value memo", href: "https://launch.example/buyer-value", status: "ready", owner: "Buyer", summary: "Ready", proof: "Ready" },
        { id: "work-order-brief", label: "Work order brief", href: "https://launch.example/work-order-brief", status: "ready", owner: "Pilot", summary: "Ready", proof: "Ready" },
        { id: "buyer-proof-packet", label: "Buyer proof packet", href: "https://launch.example/buyer-proof-packet", status: "ready", owner: "Sponsor", summary: "Ready", proof: "Ready" },
        { id: "live-proof-audit", label: "Live proof audit", href: "https://launch.example/buyer-proof-audit", status: "ready", owner: "Proof", summary: "Ready", proof: "Ready" },
        { id: "delivery-memo", label: "Buyer delivery memo", href: "https://launch.example/buyer-delivery-memo", status: "ready", owner: "Buyer", summary: "Ready", proof: "Ready" },
        { id: "sponsor-review", label: "Sponsor review room", href: "https://launch.example/sponsor-review", status: "ready", owner: "Sponsor", summary: "Ready", proof: "Ready" },
        { id: "pilot-run-receipt", label: "Pilot run receipt", href: "https://launch.example/pilot-run-receipt", status: "ready", owner: "Reviewer", summary: "Ready", proof: "Ready" },
        { id: "adoption-plan", label: "Adoption operating plan", href: "https://launch.example/adoption-plan", status: "ready", owner: "Sponsor", summary: "Ready", proof: "Ready" },
        { id: "trust-center", label: "Buyer trust center", href: "https://launch.example/trust-center", status: "ready", owner: "Security", summary: "Ready", proof: "Ready" },
        { id: "commercial-offer", label: "Commercial offer", href: "https://launch.example/commercial-offer", status: "ready", owner: "Buyer", summary: "Ready", proof: "Ready" },
        { id: "workspace", label: "Editable workspace", href: "https://launch.example/?workspace=share-token", status: "ready", owner: "Owner", summary: "Ready", proof: "Ready" }
      ],
      closurePlan: [
        {
          id: "closure-ready",
          artifactId: "sponsor-review",
          label: "Start buyer pilot review",
          href: "https://launch.example/sponsor-review",
          editHref: "https://launch.example/?workspace=share-token#sponsor-review-room",
          status: "ready",
          owner: "Sponsor",
          action: "Send the launch room.",
          acceptanceSignal: "Sponsor can approve, revise, or stop.",
          proofToAttach: "No missing proof remains."
        }
      ],
      agents: [],
      proofHealth: {
        readiness: "evidence-current",
        status: "ready",
        score: 100,
        checkedAt: "2026-06-20T01:00:00.000Z",
        verifiedCount: 5,
        totalCount: 5,
        blockedCount: 0,
        watchCount: 0,
        summary: "Buyer proof is current.",
        instruction: "Keep daily live proof checks."
      },
      valueProofLedger: valueProofLedger(),
      buyerDecision: {
        verdict: "send",
        status: "ready",
        headline: "Send this to a buyer pilot",
        instruction: "The value case, measured pilot, live proof, and operating gates support external buyer review.",
        buyerQuestion: "Will the buyer approve the bounded pilot on this evidence?",
        checks: []
      },
      handoffPacket: {
        status: "ready",
        sendInstruction: "Send this packet to the buyer sponsor.",
        subject: "Pilot review: Platform lead proof room is ready",
        preview: "Ready for buyer review.",
        emailBody: ["Hi Platform lead team,", "Please review the launch room."],
        agenda: [],
        acceptanceChecks: [],
        recommendedReply: "approve",
        replyRoutes: [],
        decisionReceipt: {
          receiptId: "launch-handoff-approve-test",
          checksumAlgorithm: "fnv1a-64",
          checksum: "0000000000000000",
          verificationApiPath: LAUNCH_ROOM_HANDOFF_RECEIPT_VERIFY_PATH,
          selectedReply: "approve",
          status: "ready",
          launchDecision: "send",
          targetBuyer: "Platform lead",
          owner: "Platform lead",
          subject: "Pilot review: Platform lead proof room is ready",
          record: "Record buyer approval against this launch room.",
          nextAction: "Send the pilot agreement and start the first work order.",
          evidence: "Will the buyer approve the bounded pilot on this evidence?",
          replayFields: [],
          replayPayload: {
            launchRoomId: "launch-room-buyer-ready-96",
            launchDecision: "send",
            targetBuyer: "Platform lead",
            selectedReply: "approve",
            routeStatus: "ready",
            record: "Record buyer approval against this launch room.",
            nextAction: "Send the pilot agreement and start the first work order.",
            evidence: "Will the buyer approve the bounded pilot on this evidence?",
            proofHealth: {
              readiness: "evidence-current",
              score: 100,
              verifiedCount: 5,
              totalCount: 5,
              checkedAt: "2026-06-20T01:00:00.000Z"
            },
            primaryMetric: {
              label: "Buyer value",
              value: "1,000,000 yen / month",
              evidence: "Fixture metric"
            }
          },
          replayPayloadJson: "{}",
          payloadHref: "data:application/json;charset=utf-8,%7B%7D",
          verification: {
            status: "verified",
            expectedChecksum: "0000000000000000",
            actualChecksum: "0000000000000000",
            instruction: "Receipt checksum matches the attached replay payload."
          },
          copyText: "# Launch room handoff decision receipt",
          href: "data:text/markdown;charset=utf-8,%23%20Launch%20room%20handoff%20decision%20receipt"
        }
      },
      buyerCoverSheet: {
        status: "sendable",
        headline: "Buyer can decide from this page",
        buyerPromise: "Platform lead gets value, proof, operating gates, and reply routing.",
        primaryAsk: "Approve the bounded pilot and record the approval.",
        doNotSendIf: "Do not send if live proof regresses.",
        reviewTime: "25 min",
        signals: [],
        copyText: "# Buyer cover sheet",
        href: "data:text/markdown;charset=utf-8,%23%20Buyer%20cover%20sheet"
      },
      stakeholderBriefs: [],
      buyerActivityTrail: {
        status: "ready",
        headline: "Buyer follow-up is ready to track across stakeholders",
        summary: "3/3 events ready; 0 need review and 0 are blocked. Recommended reply: approve.",
        nextOwner: "Platform lead",
        nextAction: "Send the pilot agreement and start the first work order.",
        events: [],
        copyText: "# Buyer activity trail",
        href: "data:text/markdown;charset=utf-8,%23%20Buyer%20activity%20trail",
        crmNote: "# Buyer follow-up CRM note",
        crmNoteHref: "data:text/markdown;charset=utf-8,%23%20Buyer%20follow-up%20CRM%20note",
        slackUpdate: "Buyer follow-up: ready",
        slackUpdateHref: "data:text/plain;charset=utf-8,Buyer%20follow-up%3A%20ready",
        taskCsv: "eventId,label,status,actor,signal,nextAction,evidence,href",
        taskCsvHref: "data:text/csv;charset=utf-8,eventId%2Clabel%2Cstatus%2Cactor%2Csignal%2CnextAction%2Cevidence%2Chref",
        followUpReceipt: {
          receiptId: "launch-follow-up-ready-test",
          checksumAlgorithm: "fnv1a-64",
          checksum: "0000000000000000",
          verificationApiPath: "/api/launch-room/follow-up-receipt/verify",
          status: "ready",
          targetBuyer: "Platform lead",
          owner: "Platform lead",
          summary: "Fixture buyer follow-up receipt.",
          replayFields: [],
          replayPayload: {
            launchRoomId: "launch-room-buyer-ready-96",
            targetBuyer: "Platform lead",
            trailStatus: "ready",
            headline: "Buyer follow-up is ready to track across stakeholders",
            summary: "Fixture buyer follow-up receipt.",
            nextOwner: "Platform lead",
            nextAction: "Send the pilot agreement and start the first work order.",
            events: [],
            exports: {
              crmNote: "# Buyer follow-up CRM note",
              slackUpdate: "Buyer follow-up: ready",
              taskCsv: "eventId,label,status,actor,signal,nextAction,evidence,href"
            }
          },
          replayPayloadJson: "{}",
          payloadHref: "data:application/json;charset=utf-8,%7B%7D",
          verification: {
            status: "verified",
            expectedChecksum: "0000000000000000",
            actualChecksum: "0000000000000000",
            instruction: "Follow-up receipt checksum matches the attached records."
          },
          copyText: "# Buyer follow-up receipt",
          href: "data:text/markdown;charset=utf-8,%23%20Buyer%20follow-up%20receipt"
        }
      },
      exportMarkdown: ""
    };
    const command = buildBuyerPilotCommand(readyRoom);

    expect(command.headline).toBe("Share the launch room with a buyer");
    expect(command.nextGap.label).toBe("Buyer delivery memo");
    expect(command.nextGap.editHref).toBe("#marketplace-workbench");
    expect(command.gapQueue).toHaveLength(1);
    expect(command.gapQueue[0]).toMatchObject({
      artifactId: "sponsor-review",
      editHref: "https://launch.example/?workspace=share-token#sponsor-review-room",
      status: "ready"
    });
    expect(command.proofClosure).toBe("10/10 artifacts sealed");
  });
});
