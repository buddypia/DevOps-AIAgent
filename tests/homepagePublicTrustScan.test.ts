import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { HomepageOutcomeArtifactSnapshot, HomepageProofEntrySnapshot, HomepagePublishabilitySnapshot, HomepageReviewerHandoffKitSnapshot } from "../src/App";
import HomepagePublicTrustScanPanel from "../src/HomepagePublicTrustScanPanel";
import type { HomepageValueLensSnapshot } from "../src/HomepageValueLens";
import { buildHomepagePublicTrustScan } from "../src/homepagePublicTrustScan";

type ScanStatus = "ready" | "attention" | "blocked";

function valueLensFixture(status: ScanStatus = "attention"): HomepageValueLensSnapshot {
  return {
    status,
    buyer: "Platform release lead",
    valueClaim: "Platform release lead can inspect 820,000 yen modeled monthly value, 590,000 yen measured support, and 31-day payback.",
    monthlyValueYen: status === "ready" ? 1027000 : 820000,
    measuredMonthlyValueYen: status === "ready" ? 1005000 : 590000,
    measuredSupportPercent: status === "ready" ? 98 : 72,
    paybackDays: status === "ready" ? 23 : 31,
    confidenceScore: status === "ready" ? 84 : 68,
    pilotBudgetCeilingYen: status === "ready" ? 770000 : 360000,
    assumptions: {
      teamSize: 8,
      cyclesPerMonth: 6,
      manualHoursPerCycle: 32,
      adoptionRatePercent: status === "blocked" ? 42 : 70,
      hourlyCostYen: 12000,
      incidentRiskYenPerMonth: 500000
    },
    primaryAction: {
      label: status === "blocked" ? "Fix value case" : "Open value report",
      href: status === "blocked" ? "#buyer-value-simulator" : "/buyer-value",
      external: false
    },
    workflowAction: {
      label: "Start with workflow",
      href: "#quick-workflow-intake",
      external: false
    },
    metrics: [],
    readinessCoach: {
      status,
      label: status === "ready" ? "Buyer-ready" : status === "attention" ? "Pilot first" : "Do not send",
      headline: "Frame this as a bounded pilot ask",
      summary: "One value metric still needs evidence, so the buyer ask should stay narrow.",
      sendRule: "Send a pilot ask, not a rollout claim, until the watch metric is ready.",
      buyerAsk: "Ask Platform release lead for a bounded pilot with receipt review.",
      nextMove: status === "blocked" ? "Run measured proof before budget approval." : "Attach receipt and proof packet to the buyer handoff.",
      levers: []
    },
    receipt: {
      receiptId: "homepage-value-lens-ready-12345678",
      checksumAlgorithm: "fnv1a32",
      checksum: "12345678",
      verification: { status: "verified" },
      verificationApiPath: "/api/homepage-value-lens/receipt/verify",
      verificationRequestJson: "{}",
      verificationRequestHref: "data:application/json,%7B%7D",
      payloadHref: "data:application/json,%7B%7D"
    },
    exportMarkdown: "# Homepage value lens"
  } as unknown as HomepageValueLensSnapshot;
}

function proofEntryFixture(status: ScanStatus = "ready"): HomepageProofEntrySnapshot {
  return {
    status,
    buyer: "Platform release lead",
    proofScore: status === "ready" ? 92 : 58,
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
      command: status === "ready" ? "Open launch room with proof attached." : "Fix proof route: public proof links must open without private access.",
      buyerImpact:
        status === "ready"
          ? "The buyer can inspect value, public proof, and the handoff path."
          : "The buyer cannot trust the room until the public proof route is backed by open evidence.",
      action: {
        label: status === "ready" ? "Open launch room" : "Fix proof route",
        href: status === "ready" ? "/launch-room" : "#buyer-proof-intake",
        external: false
      },
      acceptanceCriteria: ["Required public proof links open without private credentials."],
      impact: {
        currentScore: status === "ready" ? 92 : 58,
        projectedScore: status === "ready" ? 92 : 76,
        scoreDelta: status === "ready" ? 0 : 18,
        currentReadyCount: status === "ready" ? 4 : 2,
        projectedReadyCount: status === "ready" ? 4 : 3,
        readyDelta: status === "ready" ? 0 : 1,
        label: status === "ready" ? "No repair lift needed" : "+18 proof points"
      },
      ownerPacket: {
        status,
        title: "Proof owner packet",
        owner: status === "ready" ? "Pilot owner" : "Proof owner",
        due: "Before external send",
        command: "Fix proof route: public proof links must open without private access.",
        proofToAttach: "Public product URL, ProtoPedia story, walkthrough video, live proof audit, and repair-check receipt.",
        verificationLabel: "Open receipt verifier",
        verificationHref: "/receipt-verifier",
        shareRule: "No buyer send until this owner packet is checked.",
        acceptanceCriteria: ["Required public proof links open without private credentials."],
        exportMarkdown: "# Proof owner packet",
        href: "data:text/markdown,proof"
      },
      exportMarkdown: "# Next proof move"
    }
  } as unknown as HomepageProofEntrySnapshot;
}

function outcomeArtifactFixture(status: ScanStatus = "ready"): HomepageOutcomeArtifactSnapshot {
  return {
    status,
    buyer: "Platform release lead",
    score: status === "ready" ? 90 : 62,
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
    redLines: status === "ready" ? [] : [{ id: "live-proof", label: "Live proof", owner: "Proof owner", status: "block", action: "Attach public proof.", href: "#buyer-proof-intake" }]
  } as unknown as HomepageOutcomeArtifactSnapshot;
}

function publishabilityFixture(status: ScanStatus = "blocked"): HomepagePublishabilitySnapshot {
  return {
    status,
    decision: status === "ready" ? "publish" : status === "attention" ? "sponsor-review" : "do-not-publish",
    score: status === "ready" ? 91 : status === "attention" ? 72 : 48,
    hardTruth: status === "ready" ? "Public release has value, proof, and operating guardrails." : "Public product surface blocks global sharing.",
    proofSummary: "Live product, story, video, and proof audit are checked together.",
    primaryAction: {
      label: "Open publishability report",
      href: "/global-publishability",
      external: false
    },
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
      scoreGap: status === "ready" ? 0 : 38,
      projectedScoreAfterFirstFix: status === "ready" ? 91 : 74,
      summary: "Public product surface is the first lift before global-ready.",
      actions: [
        {
          id: "lift-live-surface",
          priority: "now",
          label: "Public product surface",
          status,
          scoreLift: status === "ready" ? 0 : 26,
          projectedScore: status === "ready" ? 91 : 74,
          proofRequired: "Attach public launch proof links.",
          decisionImpact: "Makes the launch inspectable by a new buyer.",
          href: "#launch-evidence-console"
        }
      ]
    }
  } as unknown as HomepagePublishabilitySnapshot;
}

function reviewerHandoffFixture(status: ScanStatus = "ready"): HomepageReviewerHandoffKitSnapshot {
  return {
    status,
    buyer: "Platform release lead",
    decision: status === "ready" ? "send" : "hold",
    headline: status === "ready" ? "Reviewer can decide from one kit" : "Reviewer kit needs owner confirmation",
    summary: "The buyer brief, proof rail, launch room, and send rule are packaged into one review path.",
    reviewAnswer: "The reviewer can inspect proof route confirmation before buyer approval.",
    sendRule: "Send only with the buyer brief, launch room, proof rail, and decision receipt attached.",
    holdRule: "Hold if any public proof link requires private access or the launch room cannot be opened.",
    readyCount: status === "ready" ? 4 : 3,
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

describe("homepage public trust scan", () => {
  test("prioritizes the first blocked public trust question before global launch", () => {
    const scan = buildHomepagePublicTrustScan({
      valueLens: valueLensFixture("attention"),
      proofEntry: proofEntryFixture("ready"),
      outcomeArtifact: outcomeArtifactFixture("ready"),
      publishability: publishabilityFixture("blocked"),
      reviewerHandoffKit: reviewerHandoffFixture("ready")
    });

    expect(scan.status).toBe("blocked");
    expect(scan.firstQuestion).toMatchObject({
      id: "public-release",
      owner: "Launch owner",
      label: "Public release"
    });
    expect(scan.primaryAction).toMatchObject({
      label: "Fix Public release",
      href: "/global-publishability"
    });
    expect(scan.publishRule).toContain("Do not send public traffic");
    expect(scan.visitorPromise).not.toContain("sees Platform release lead can inspect");
    expect(scan.answerDeckHeadline).toBe("Buyer questions still expose a public trust gap");
    expect(scan.answerDeckSummary).toContain("First gap: Launch owner must close Public release");
    expect(scan.answeredCount).toBe(3);
    expect(scan.answerCount).toBe(5);
    expect(scan.buyerAnswers[0]).toMatchObject({
      id: "public-release",
      status: "blocked",
      owner: "Launch owner",
      question: "Can the public surface carry global traffic without hiding proof gaps?"
    });
    expect(scan.buyerAnswers[0].answer).toContain("Not yet");
    expect(scan.buyerAnswers[0].decisionUse).toContain("Do not cite");
    expect(scan.exportMarkdown).toContain("# Public trust scan");
    expect(scan.exportMarkdown).toContain("## First public question");
    expect(scan.exportMarkdown).toContain("## Buyer question answer deck");
    expect(scan.exportMarkdown).toContain("Can the public surface carry global traffic without hiding proof gaps?");
    expect(scan.csvText).toContain("checkId,status,score,owner,label,buyerQuestion,action,href");
    expect(scan.markdownHref).toContain("data:text/markdown");
    expect(scan.csvHref).toContain("data:text/csv");
  });

  test("marks the scan trusted when every public buyer check is ready", () => {
    const scan = buildHomepagePublicTrustScan({
      valueLens: valueLensFixture("ready"),
      proofEntry: proofEntryFixture("ready"),
      outcomeArtifact: outcomeArtifactFixture("ready"),
      publishability: publishabilityFixture("ready"),
      reviewerHandoffKit: reviewerHandoffFixture("ready")
    });

    expect(scan.status).toBe("ready");
    expect(scan.trustedCount).toBe(5);
    expect(scan.blockedCount).toBe(0);
    expect(scan.answeredCount).toBe(5);
    expect(scan.buyerAnswers.every((answer) => answer.status === "ready")).toBe(true);
    expect(scan.answerDeckSummary).toContain("Every public buyer question has a citable answer");
    expect(scan.headline).toBe("A public buyer can trust this without a walkthrough");
    expect(JSON.stringify(scan)).not.toMatch(/demo/i);
  });

  test("renders a copyable and exportable trust scan panel", () => {
    const html = renderToStaticMarkup(
      createElement(HomepagePublicTrustScanPanel, {
        valueLens: valueLensFixture("attention"),
        proofEntry: proofEntryFixture("ready"),
        outcomeArtifact: outcomeArtifactFixture("ready"),
        publishability: publishabilityFixture("blocked"),
        reviewerHandoffKit: reviewerHandoffFixture("ready"),
        onCopyText: async () => true
      })
    );

    expect(html).toContain("Public trust scan");
    expect(html).toContain("Keep this internal until the public trust gap closes");
    expect(html).toContain("First public buyer question");
    expect(html).toContain("Buyer question answer deck");
    expect(html).toContain("Buyer answer deck");
    expect(html).toContain("safe to cite");
    expect(html).toContain("Can the public surface carry global traffic without hiding proof gaps?");
    expect(html).toContain("Do not cite this claim in public traffic");
    expect(html).toContain("Public trust checks");
    expect(html).toContain("Copy scan");
    expect(html).toContain("Export Markdown");
    expect(html).toContain("Export CSV");
    expect(html).toContain("public-trust-scan.md");
    expect(html).toContain("public-trust-scan.csv");
    expect(html).toContain("Public release");
  });
});
