import { describe, expect, it } from "vitest";
import { buildBuyerPilotCommand } from "../src/buyerPilotCommand";
import { buildHomepageRouteLock } from "../src/homepageRouteLock";
import { buildLaunchRoom, type LaunchRoom } from "../src/launchRoom";
import { defaultWorkspaceDraft } from "../src/workspaceDraft";

function defaultRoom() {
  return buildLaunchRoom({
    workspace: defaultWorkspaceDraft("2026-06-20T00:00:00.000Z"),
    baseUrl: "https://launch.example",
    appUrl: "https://launch.example/?workspace=share-token"
  });
}

describe("homepage route lock", () => {
  it("routes the default workspace to the first buyer blocker", () => {
    const room = defaultRoom();
    const command = buildBuyerPilotCommand(room);
    const lock = buildHomepageRouteLock({
      room,
      command,
      launchRoomHref: "https://launch.example/launch-room?workspace=share-token",
      proofAuditHref: "/buyer-proof-audit",
      trustManifestHref: "/buyer-trust-manifest",
      decisionReceiptHref: "/buyer-decision-receipt?decision=stop",
      decisionFollowUpHref: "/buyer-decision-follow-up",
      reviewKitHref: "/buyer-review-kit?decision=stop",
      acceptancePathHref: "/buyer-acceptance-path?decision=stop"
    });

    expect(lock.verdict).toBe("hold");
    expect(lock.status).toBe("blocked");
    expect(lock.headline).toBe("Fix the first buyer blocker");
    expect(lock.primaryAction).toMatchObject({
      label: "Fix Live proof health",
      href: "#buyer-proof-intake",
      external: false
    });
    expect(lock.secondaryAction.label).toBe("Open launch room");
    expect(lock.operatorLine).toContain("Live proof health");
    expect(lock.checks.map((check) => check.id)).toEqual(["buyer-decision", "current-gap", "live-proof", "artifact-closure"]);
    expect(lock.checks.find((check) => check.id === "current-gap")).toMatchObject({
      status: "blocked",
      value: "Live proof health"
    });
    expect(lock.checks.find((check) => check.id === "live-proof")?.value).toBe("not checked");
    expect(lock.routeSteps.map((step) => step.id)).toEqual(["work-order", "value-case", "measured-run", "live-proof", "buyer-room"]);
    expect(lock.routeSteps.find((step) => step.id === "live-proof")).toMatchObject({
      label: "Live proof",
      status: "blocked",
      value: "not checked",
      href: "#launch-evidence-console",
      external: false,
      isCurrent: true
    });
    expect(lock.routeSteps.find((step) => step.id === "buyer-room")).toMatchObject({
      status: "blocked",
      value: "hold",
      isCurrent: false
    });
    expect(lock.handoffPacket).toMatchObject({
      title: "Handoff stopped",
      summary: "Do not send to Platform / DevOps Lead until Live proof health closes and the receipt updates.",
      primaryAction: {
        label: "Review blockers",
        href: "/buyer-review-kit?decision=stop",
        external: false
      },
      secondaryAction: {
        label: "Preview acceptance path",
        href: "/buyer-acceptance-path?decision=stop",
        external: false
      }
    });
    expect(lock.handoffPacket.items.map((item) => item.id)).toEqual(["decision-receipt", "trust-manifest", "live-proof-audit", "follow-up-ledger"]);
    expect(lock.handoffPacket.items.find((item) => item.id === "decision-receipt")).toMatchObject({
      title: "Stop record",
      status: "blocked",
      href: "/buyer-decision-receipt?decision=stop",
      external: false
    });
    expect(lock.handoffPacket.items.find((item) => item.id === "trust-manifest")).toMatchObject({
      title: command.proofClosure,
      href: "/buyer-trust-manifest"
    });
    expect(lock.handoffPacket.items.find((item) => item.id === "live-proof-audit")).toMatchObject({
      title: "Not checked",
      status: "blocked",
      href: "/buyer-proof-audit"
    });
    expect(lock.handoffPacket.items.find((item) => item.id === "follow-up-ledger")).toMatchObject({
      title: "Live proof health",
      status: "blocked",
      href: "/buyer-decision-follow-up"
    });
  });

  it("routes a buyer-ready room directly to the public launch room", () => {
    const baseRoom = defaultRoom();
    const readyRoom: LaunchRoom = {
      ...baseRoom,
      readiness: "buyer-ready",
      launchScore: 92,
      artifacts: baseRoom.artifacts.map((artifact) => ({ ...artifact, status: "ready" })),
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
      proofHealth: {
        ...baseRoom.proofHealth,
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
      buyerDecision: {
        verdict: "send",
        status: "ready",
        headline: "Send this to a buyer pilot",
        instruction: "The value case, measured pilot, live proof, and operating gates support external buyer review.",
        buyerQuestion: "Will the buyer approve the bounded pilot on this evidence?",
        checks: baseRoom.buyerDecision.checks.map((check) => ({ ...check, status: "ready" }))
      }
    };
    const command = buildBuyerPilotCommand(readyRoom);
    const lock = buildHomepageRouteLock({
      room: readyRoom,
      command,
      launchRoomHref: "https://launch.example/launch-room?workspace=share-token",
      proofAuditHref: "/buyer-proof-audit",
      trustManifestHref: "/buyer-trust-manifest",
      decisionReceiptHref: "https://launch.example/buyer-decision-receipt?decision=continue",
      decisionFollowUpHref: "/buyer-decision-follow-up",
      reviewKitHref: "https://launch.example/buyer-review-kit?decision=continue",
      acceptancePathHref: "https://launch.example/buyer-acceptance-path?decision=continue"
    });

    expect(lock.verdict).toBe("send");
    expect(lock.status).toBe("ready");
    expect(lock.headline).toBe("Send the buyer room now");
    expect(lock.primaryAction).toEqual({
      label: "Open buyer room",
      href: "https://launch.example/launch-room?workspace=share-token",
      external: true
    });
    expect(lock.secondaryAction.label).toBe("Review proof packet");
    expect(lock.operatorLine).toContain("can review the bounded pilot");
    expect(lock.checks.find((check) => check.id === "artifact-closure")?.status).toBe("ready");
    expect(lock.checks.find((check) => check.id === "live-proof")?.value).toBe("5/5");
    expect(lock.routeSteps.every((step) => step.status === "ready")).toBe(true);
    expect(lock.routeSteps.find((step) => step.id === "buyer-room")).toMatchObject({
      label: "Decision room",
      value: "send",
      href: "https://launch.example/launch-room?workspace=share-token",
      external: true,
      isCurrent: true
    });
    expect(lock.routeSteps.filter((step) => step.isCurrent)).toHaveLength(1);
    expect(lock.handoffPacket).toMatchObject({
      title: "Handoff attachable",
      summary: "Attach receipts, manifest, and audit when Platform / DevOps Lead receives the room.",
      primaryAction: {
        label: "Open review kit",
        href: "https://launch.example/buyer-review-kit?decision=continue",
        external: true
      },
      secondaryAction: {
        label: "Open acceptance path",
        href: "https://launch.example/buyer-acceptance-path?decision=continue",
        external: true
      }
    });
    expect(lock.handoffPacket.items.find((item) => item.id === "decision-receipt")).toMatchObject({
      title: "Continue record",
      status: "ready",
      href: "https://launch.example/buyer-decision-receipt?decision=continue",
      external: true
    });
    expect(lock.handoffPacket.items.find((item) => item.id === "live-proof-audit")).toMatchObject({
      title: "5/5 verified",
      status: "ready"
    });
    expect(lock.handoffPacket.items.find((item) => item.id === "follow-up-ledger")).toMatchObject({
      title: "Post-send ownership",
      status: "ready"
    });
  });
});
