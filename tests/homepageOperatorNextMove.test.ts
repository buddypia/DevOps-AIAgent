import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { HomepageOutcomeArtifactSnapshot, HomepageProofEntrySnapshot, HomepagePublishabilitySnapshot, HomepageReviewerHandoffKitSnapshot } from "../src/App";
import HomepageOperatorNextMovePanel from "../src/HomepageOperatorNextMovePanel";
import { buildHomepageOperatorNextMove } from "../src/homepageOperatorNextMove";

function proofEntryFixture(status: "ready" | "attention" | "blocked" = "blocked"): HomepageProofEntrySnapshot {
  return {
    status,
    buyer: "Platform release lead",
    proofScore: status === "ready" ? 94 : 64,
    readyCount: status === "ready" ? 4 : 2,
    items: [{ id: "buyer-decision" }, { id: "value-proof" }, { id: "public-proof" }, { id: "handoff" }],
    primaryAction: {
      label: status === "ready" ? "Open launch room" : "Fix proof route",
      href: status === "ready" ? "/launch-room" : "#buyer-proof-intake",
      external: false
    },
    nextMove: {
      id: status === "ready" ? "send-route" : "public-proof",
      status,
      label: status === "ready" ? "Send route" : "Next proof move",
      headline: status === "ready" ? "Send the buyer room with proof attached" : "Close public proof before buyer sharing",
      owner: status === "ready" ? "Pilot owner" : "Proof owner",
      command: status === "ready" ? "Open launch room: send value, proof, and handoff together." : "Fix proof route: public proof links must open without private access.",
      buyerImpact:
        status === "ready"
          ? "The buyer can inspect value, public proof, and the handoff path."
          : "The buyer cannot trust the room until the public proof route is backed by open evidence.",
      action: {
        label: status === "ready" ? "Open launch room" : "Fix proof route",
        href: status === "ready" ? "/launch-room" : "#buyer-proof-intake",
        external: false
      },
      acceptanceCriteria: ["Required public proof links open without private credentials.", "Live proof audit can be refreshed inside the current review window."],
      impact: {
        currentScore: status === "ready" ? 94 : 64,
        projectedScore: status === "ready" ? 94 : 76,
        scoreDelta: status === "ready" ? 0 : 12,
        currentReadyCount: status === "ready" ? 4 : 2,
        projectedReadyCount: status === "ready" ? 4 : 3,
        readyDelta: status === "ready" ? 0 : 1,
        label: status === "ready" ? "No repair lift needed" : "+12 proof points"
      },
      ownerPacket: {
        status,
        title: "Proof owner packet",
        owner: status === "ready" ? "Pilot owner" : "Proof owner",
        due: status === "ready" ? "Before buyer review" : "Before external send",
        command: "Fix proof route: public proof links must open without private access.",
        proofToAttach: "Public product URL, ProtoPedia story, walkthrough video, live proof audit, and repair-check receipt.",
        verificationLabel: "Open receipt verifier",
        verificationHref: "/receipt-verifier",
        shareRule:
          status === "ready"
            ? "Send only with the review kit, decision receipt, acceptance path, and verifier links attached."
            : "No buyer send until this owner packet is checked, proof is re-exported, and the receipt verifier accepts the replay.",
        acceptanceCriteria: ["Required public proof links open without private credentials."],
        exportMarkdown: "# Proof owner packet",
        href: "data:text/markdown,proof"
      },
      exportMarkdown: "# Next proof move"
    }
  } as unknown as HomepageProofEntrySnapshot;
}

function publishabilityFixture(status: "ready" | "attention" | "blocked" = "blocked"): HomepagePublishabilitySnapshot {
  return {
    status,
    score: status === "ready" ? 91 : 58,
    hardTruth: status === "ready" ? "Public release has value, proof, and operating guardrails." : "Public product surface blocks global sharing.",
    proofSummary: "Live product, story, video, and proof audit are checked together.",
    reportAction: {
      id: "primary",
      label: "Open publishability report",
      href: "/global-publishability",
      external: false
    },
    reviewerCover: {
      status,
      label: "Review cover",
      headline: "Review cover",
      summary: "Reviewer cover is available.",
      href: "/global-publishability",
      external: false
    },
    releaseLift: {
      targetScore: 86,
      scoreGap: status === "ready" ? 0 : 28,
      projectedScoreAfterFirstFix: status === "ready" ? 91 : 78,
      summary: "Public product surface is the first lift before global-ready.",
      actions: [
        {
          id: "lift-live-surface",
          priority: "now",
          label: status === "ready" ? "Route global traffic to the launch room" : "Public product surface",
          status,
          scoreLift: status === "ready" ? 0 : 20,
          projectedScore: status === "ready" ? 91 : 78,
          proofRequired: status === "ready" ? "Keep public proof links reachable." : "Attach public launch proof links.",
          decisionImpact: status === "ready" ? "Moves from review to acquisition routing." : "Makes the launch inspectable by a new buyer.",
          href: status === "ready" ? "/buyer-share-gate" : "#launch-evidence-console"
        }
      ]
    }
  } as unknown as HomepagePublishabilitySnapshot;
}

function outcomeArtifactFixture(status: "ready" | "attention" | "blocked" = "blocked"): HomepageOutcomeArtifactSnapshot {
  return {
    status,
    buyer: "Platform release lead",
    score: status === "ready" ? 90 : 61,
    valueClaim: "Release operators save review time when value, proof, and decision paths stay attached.",
    decisionAsk: "Send this brief and ask for a bounded pilot approval.",
    primaryAction: {
      label: "Open buyer brief",
      href: "/buyer-outcome-brief",
      external: false
    },
    packet: {
      status,
      headline: status === "ready" ? "Buyer packet is ready" : "Buyer packet needs proof repair",
      summary: "One-pager, value proof, proof gate, and decision handoff are packaged together.",
      readyCount: status === "ready" ? 4 : 2,
      itemCount: 4
    },
    redLines:
      status === "ready"
        ? []
        : [
            {
              id: "live-proof",
              label: "Live proof",
              owner: "Proof owner",
              status: "block",
              action: "Attach public proof before the buyer packet leaves the workspace.",
              href: "#buyer-proof-intake"
            }
          ]
  } as unknown as HomepageOutcomeArtifactSnapshot;
}

function reviewerHandoffFixture(status: "ready" | "attention" | "blocked" = "attention"): HomepageReviewerHandoffKitSnapshot {
  const readyCount = status === "ready" ? 4 : 3;
  return {
    status,
    buyer: "Platform release lead",
    headline: status === "ready" ? "Reviewer can decide from one kit" : "Reviewer kit needs owner confirmation",
    summary: "The buyer brief, proof rail, launch room, and send rule are packaged into one review path.",
    reviewAnswer: "The reviewer needs proof route confirmation before buyer approval.",
    sendRule: "Send only with the buyer brief, launch room, proof rail, and decision receipt attached.",
    holdRule: "Hold if any public proof link requires private access or the launch room cannot be opened.",
    readyCount,
    blockedCount: status === "blocked" ? 1 : 0,
    primaryAction: {
      label: "Open review kit",
      href: "/buyer-review-kit",
      external: false
    },
    steps: [
      { id: "buyer-brief", label: "Buyer brief", status: "ready", owner: "Sponsor", evidence: "Brief is open.", href: "/buyer-outcome-brief", actionLabel: "Open brief" },
      { id: "proof-rail", label: "Proof rail", status, owner: "Proof owner", evidence: "Proof rail needs owner confirmation.", href: "#buyer-proof-intake", actionLabel: "Review proof rail" },
      { id: "decision-room", label: "Decision room", status: "ready", owner: "Pilot owner", evidence: "Decision room is open.", href: "/launch-room", actionLabel: "Open launch room" },
      { id: "send-rule", label: "Send rule", status: "ready", owner: "Proof owner", evidence: "Send rule is visible.", href: "/buyer-review-kit", actionLabel: "Open kit" }
    ]
  } as unknown as HomepageReviewerHandoffKitSnapshot;
}

function blockedReviewerHandoffWithNoReadySteps(): HomepageReviewerHandoffKitSnapshot {
  return {
    ...reviewerHandoffFixture("blocked"),
    readyCount: 0,
    steps: [
      { id: "buyer-brief", label: "Buyer brief", status: "blocked", owner: "Sponsor", evidence: "Brief is blocked.", href: "#launch-evidence-console", actionLabel: "Fix buyer brief" },
      { id: "proof-rail", label: "Proof rail", status: "blocked", owner: "Proof owner", evidence: "Proof rail is blocked.", href: "#buyer-proof-intake", actionLabel: "Fix proof rail" },
      { id: "decision-room", label: "Decision room", status: "blocked", owner: "Pilot owner", evidence: "Decision room is blocked.", href: "/launch-room", actionLabel: "Fix decision room" },
      { id: "send-rule", label: "Send rule", status: "blocked", owner: "Proof owner", evidence: "Send rule is blocked.", href: "/buyer-review-kit", actionLabel: "Fix send rule" }
    ]
  } as unknown as HomepageReviewerHandoffKitSnapshot;
}

describe("homepage operator next move", () => {
  test("chooses the highest-lift blocked owner command across homepage proof signals", () => {
    const snapshot = buildHomepageOperatorNextMove({
      proofEntry: proofEntryFixture("blocked"),
      publishability: publishabilityFixture("blocked"),
      outcomeArtifact: outcomeArtifactFixture("blocked"),
      reviewerHandoffKit: reviewerHandoffFixture("attention")
    });

    expect(snapshot.status).toBe("blocked");
    expect(snapshot.primaryMove).toMatchObject({
      id: "publishability",
      owner: "Launch owner",
      title: "Public product surface",
      scoreDelta: 20,
      projectedScore: 78
    });
    expect(snapshot.headline).toBe("Launch owner owns the next blocking move");
    expect(snapshot.summary).toContain("Platform release lead should stay internal");
    expect(snapshot.exportMarkdown).toContain("# Operator next move");
    expect(snapshot.exportMarkdown).toContain("## Acceptance criteria");
    expect(snapshot.exportMarkdown).toContain("Attach public launch proof links.");
    expect(snapshot.csvText).toContain("moveId,status,owner,due,title,command,scoreDelta,projectedScore,source,actionHref");
    expect(snapshot.csvText).toContain("publishability,blocked,Launch owner");
    expect(snapshot.markdownHref).toContain("data:text/markdown");
    expect(snapshot.csvHref).toContain("data:text/csv");
  });

  test("renders a copyable operator queue for the proof workbench", () => {
    const html = renderToStaticMarkup(
      createElement(HomepageOperatorNextMovePanel, {
        proofEntry: proofEntryFixture("blocked"),
        publishability: publishabilityFixture("blocked"),
        outcomeArtifact: outcomeArtifactFixture("blocked"),
        reviewerHandoffKit: reviewerHandoffFixture("attention"),
        onCopyText: async () => true
      })
    );

    expect(html).toContain("Operator next move");
    expect(html).toContain("Launch owner owns the next blocking move");
    expect(html).toContain("Owner command");
    expect(html).toContain("Acceptance criteria");
    expect(html).toContain("Operator candidate queue");
    expect(html).toContain("Copy command");
    expect(html).toContain("Export Markdown");
    expect(html).toContain("Export CSV");
    expect(html).toContain("operator-next-move.md");
    expect(html).toContain("operator-next-move.csv");
    expect(html).toContain("Public product surface");
    expect(html).toContain("+20");
  });

  test("stays in ready mode when all release lanes are clear", () => {
    const snapshot = buildHomepageOperatorNextMove({
      proofEntry: proofEntryFixture("ready"),
      publishability: publishabilityFixture("ready"),
      outcomeArtifact: outcomeArtifactFixture("ready"),
      reviewerHandoffKit: reviewerHandoffFixture("ready")
    });

    expect(snapshot.status).toBe("ready");
    expect(snapshot.readyCount).toBe(4);
    expect(snapshot.blockedCount).toBe(0);
    expect(snapshot.scoreDelta).toBe(0);
    expect(snapshot.headline).toBe("Operator queue is clear for buyer review");
    expect(snapshot.exportMarkdown).toContain("Status: ready");
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);
  });

  test("keeps a zero-score owner lane as zero in the projected lift", () => {
    const snapshot = buildHomepageOperatorNextMove({
      proofEntry: proofEntryFixture("ready"),
      publishability: publishabilityFixture("ready"),
      outcomeArtifact: outcomeArtifactFixture("ready"),
      reviewerHandoffKit: blockedReviewerHandoffWithNoReadySteps()
    });

    expect(snapshot.primaryMove).toMatchObject({
      id: "reviewer-handoff",
      currentScore: 0,
      projectedScore: 25,
      scoreDelta: 25
    });
    expect(snapshot.currentScore).toBe(0);
    expect(snapshot.projectedScore).toBe(25);
    expect(snapshot.scoreDelta).toBe(25);
    expect(snapshot.exportMarkdown).toContain("Score lift: 0/100 -> 25/100 (+25)");
  });
});
