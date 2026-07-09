import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";
import MarketHeroProofSummary from "../src/MarketHeroProofSummary";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "../src/publicProofUrl";

type Props = Parameters<typeof MarketHeroProofSummary>[0];

const proofFields = [
  { key: "targetUrl", label: "Deployed URL", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.targetUrl, href: "#launch-evidence-console" },
  { key: "protopediaUrl", label: "ProtoPedia URL", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl, href: "#launch-evidence-console" },
  { key: "videoUrl", label: "Walkthrough video", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl, href: "#launch-evidence-console" },
  { key: "pilotEvidenceUrl", label: "Pilot receipt", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.pilotEvidenceUrl, href: "#pilot-run-receipt" },
  { key: "workOrderEvidenceUrl", label: "Work order proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.workOrderEvidenceUrl, href: "#buyer-work-order-studio" }
];

const proofIntake = {
  targetUrl: "https://release.opsbridge.ai",
  protopediaUrl: "https://protopedia.net/prototype/buyer-proof",
  videoUrl: "https://youtu.be/demo-recording",
  pilotEvidenceUrl: "https://release.opsbridge.ai/sample/pilot-run-receipt",
  workOrderEvidenceUrl: "https://release.opsbridge.ai/sample/work-order-proof"
};

const proofVerification: BuyerShareGateProofVerificationSummary = {
  checkedAt: "2026-06-27T00:00:00.000Z",
  verifiedCount: proofFields.length,
  totalCount: proofFields.length,
  score: 100,
  results: proofFields.map((field) => ({
    id: field.key,
    label: field.label,
    status: "pass",
    httpStatus: 200,
    evidence: `${field.label} returned HTTP 200.`,
    action: "Keep this public proof link attached."
  }))
};

const defaultShareGateChecks: Props["shareGate"]["checks"] = [
  {
    id: "launch-room",
    label: "Launch room decision",
    status: "pass",
    score: 100,
    evidence: "Launch room is buyer-ready.",
    action: "Use the launch room as the buyer-facing source of truth.",
    href: "/launch-room",
    external: false
  },
  {
    id: "public-proof",
    label: "Live proof reachability",
    status: "pass",
    score: 100,
    evidence: "5/5 evidence links verified live.",
    action: "Keep verified proof URLs attached.",
    href: "#launch-evidence-console",
    external: false
  },
  {
    id: "measured-run",
    label: "Measured pilot receipt",
    status: "pass",
    score: 100,
    evidence: "82m saved/run, 90% accepted.",
    action: "Cite the measured run as buyer proof.",
    href: "#pilot-run-receipt",
    external: false
  },
  {
    id: "artifact-closure",
    label: "Artifact closure",
    status: "pass",
    score: 100,
    evidence: "All buyer artifacts are sealed.",
    action: "All artifact links are ready for external review.",
    href: "/launch-room",
    external: false
  }
];

const defaultShareGateRepairPlan: Props["shareGate"]["repairPlan"] = {
  status: "ready",
  headline: "No repair work before buyer send",
  summary: "All share-gate checks are pass. Keep the receipt with the buyer packet.",
  exportHref: "data:text/markdown;charset=utf-8,%23%20Buyer%20send%20repair%20plan",
  items: []
};

function propsFor(shareGate: Omit<Props["shareGate"], "checks" | "repairPlan"> & { checks?: Props["shareGate"]["checks"]; repairPlan?: Props["shareGate"]["repairPlan"] }, overrides: Partial<Props> = {}): Props {
  return {
    proofVerification,
    proofVerifyStatus: "checked",
    proofVerifyError: "",
    proofFields,
    proofIntake,
    proofRepairDraft: {},
    proofEntry: {
      status: "ready",
      proofScore: 100,
      readyCount: 4,
      itemCount: 4,
      headline: "Proof rails are ready."
    },
    packet: {
      status: "ready",
      readyCount: 3,
      itemCount: 3,
      checksumAlgorithm: "fnv1a-64",
      checksum: "0123456789abcdef"
    },
    route: {
      status: "ready",
      score: 100,
      headline: "Send the buyer room now",
      operatorLine: "Buyer can inspect live proof and measured value.",
      primaryAction: {
        label: "Open launch room",
        href: "/launch-room",
        external: false
      }
    },
    publicDecisionRoute: {
      status: "ready",
      launchEvidenceHref: "/launch-evidence",
      buyerEvidencePackHref: "/buyer-decision-cockpit",
      buyerEvidenceBoardHref: "/buyer-evidence-board"
    },
    shareGate: {
      ...shareGate,
      checks: shareGate.checks ?? defaultShareGateChecks,
      repairPlan: shareGate.repairPlan ?? defaultShareGateRepairPlan
    },
    onVerifyProofLinks: () => undefined,
    onProofRepairDraftChange: () => undefined,
    onApplyProofRepairDraft: () => undefined,
    ...overrides
  };
}

describe("MarketHeroProofSummary", () => {
  test("renders a first-screen buyer send decision when the share gate is clear", () => {
    const html = renderToStaticMarkup(
      createElement(
        MarketHeroProofSummary,
        propsFor({
          readiness: "send-ready",
          mode: "send",
          score: 100,
          decision: "Send the launch room to the buyer or sponsor reviewer.",
          blockerCount: 0,
          watchCount: 0,
          primaryActionLabel: "Open launch room",
          primaryActionHref: "/launch-room",
          primaryActionExternal: false
        })
      )
    );

    expect(html).toContain("Buyer send decision");
    expect(html).toContain("Buyer send can proceed");
    expect(html).toContain("100/100 share gate");
    expect(html).toContain("Open launch room: 0 blockers / 0 warnings");
    expect(html).toContain("Gate checks");
    expect(html).toContain("pass / Live proof reachability");
    expect(html).toContain('<details class="market-hero-live-results"');
    expect(html).toContain('<details class="market-hero-share-gate-checks"');
    expect(html).not.toContain('<details open');
    expect(html).not.toContain("Repair path");
    expect(html).toContain('data-readiness="send-ready"');
    expect(html).toContain('href="/launch-room"');
    expect(html).toContain("Links checked");
    expect(html).toContain("5/5 public proof links verified live");
  });

  test("renders a public proof-to-decision route from the first screen", () => {
    const html = renderToStaticMarkup(
      createElement(
        MarketHeroProofSummary,
        propsFor({
          readiness: "send-ready",
          mode: "send",
          score: 100,
          decision: "Send the launch room to the buyer or sponsor reviewer.",
          blockerCount: 0,
          watchCount: 0,
          primaryActionLabel: "Open launch room",
          primaryActionHref: "/launch-room",
          primaryActionExternal: false
        })
      )
    );

    expect(html).toContain("Public proof-to-decision route");
    expect(html).toContain("Evidence opens where the buyer makes the call");
    expect(html).toContain("Launch evidence report");
    expect(html).toContain('href="/launch-evidence"');
    expect(html).toContain("Open buyer decision cockpit");
    expect(html).toContain('href="/buyer-decision-cockpit"');
    expect(html).toContain("Buyer evidence board");
    expect(html).toContain('href="/buyer-evidence-board"');
    expect(html.indexOf("Public proof-to-decision route")).toBeLessThan(html.indexOf("Buyer send decision"));
    expect(html.indexOf("Public proof-to-decision route")).toBeLessThan(html.indexOf("Gate checks"));
  });

  test("uses required public proof tokens in live repair inputs instead of fake URLs", () => {
    const html = renderToStaticMarkup(
      createElement(
        MarketHeroProofSummary,
        propsFor(
          {
            readiness: "needs-proof",
            mode: "hold",
            score: 76,
            decision: "Hold external sharing. Replace the unreachable proof URL before buyer delivery.",
            blockerCount: 1,
            watchCount: 0,
            primaryActionLabel: "Repair proof URL",
            primaryActionHref: "#launch-evidence-console",
            primaryActionExternal: false
          },
          {
            proofVerification: {
              checkedAt: "2026-06-27T00:00:00.000Z",
              verifiedCount: 4,
              totalCount: 5,
              score: 80,
              results: proofFields.map((field) => ({
                id: field.key,
                label: field.label,
                status: field.key === "protopediaUrl" ? "block" : "pass",
                httpStatus: field.key === "protopediaUrl" ? 404 : 200,
                evidence: `${field.label} returned HTTP 200.`,
                action: field.key === "protopediaUrl" ? "Attach the published ProtoPedia work URL reviewers can open." : "Keep this public proof link attached."
              }))
            },
            proofIntake: { ...proofIntake, protopediaUrl: "" },
            proofRepairDraft: {}
          }
        )
      )
    );

    expect(html).toContain("Repair public proof blockers");
    expect(html).toContain("Paste replacement URL");
    expect(html).toContain('placeholder="&lt;published ProtoPedia work URL&gt;"');
    expect(html).not.toMatch(/service-xyz|your-service|your-cloud-run-url|https:\/\/[^\s"']*\.\.\./i);
  });

  test("renders sponsor review as a warning decision with an external action", () => {
    const html = renderToStaticMarkup(
      createElement(
        MarketHeroProofSummary,
        propsFor({
          readiness: "almost-ready",
          mode: "review",
          score: 89,
          decision: "Share internally for review, then close the remaining warning before buyer delivery.",
          blockerCount: 0,
          watchCount: 1,
          primaryActionLabel: "Resolve blocker",
          primaryActionHref: "https://review.example.com/share-gate",
          primaryActionExternal: true
        })
      )
    );

    expect(html).toContain("Sponsor review before buyer send");
    expect(html).toContain("89/100 share gate");
    expect(html).toContain("Resolve blocker: 0 blockers / 1 warning");
    expect(html).toContain('data-readiness="almost-ready"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
  });

  test("renders hold decisions with blocker counts before the proof score cards", () => {
    const html = renderToStaticMarkup(
      createElement(
        MarketHeroProofSummary,
        propsFor({
          readiness: "needs-proof",
          mode: "hold",
          score: 72,
          decision: "Hold external sharing. Run Verify live links before external sharing.",
          blockerCount: 1,
          watchCount: 2,
          primaryActionLabel: "Resolve blocker",
          primaryActionHref: "#buyer-proof-intake",
          primaryActionExternal: false,
          repairPlan: {
            status: "repair",
            headline: "Repair blockers before buyer send",
            summary:
              "3 repair items before buyer send. Start with Launch room decision: Tune the value model until the buyer can see base, downside, and break-even economics without a sales explanation.",
            exportHref: "data:text/markdown;charset=utf-8,%23%20Buyer%20send%20repair%20plan",
            items: [
              {
                id: "launch-room",
                sequence: 1,
                label: "Launch room decision",
                status: "block",
                owner: "Pilot owner",
                action: "Tune the value model until the buyer can see base, downside, and break-even economics without a sales explanation.",
                evidence: "Launch room still has a value blocker.",
                href: "#buyer-value-simulator",
                unlock: "Buyer room can move from internal hold to sponsor review.",
                external: false
              },
              {
                id: "measured-run",
                sequence: 2,
                label: "Measured pilot receipt",
                status: "block",
                owner: "Pilot reviewer",
                action: "Record a measured run where assisted work beats the manual baseline.",
                evidence: "0m saved/run.",
                href: "#pilot-run-receipt",
                unlock: "ROI claim becomes citeable from observed work.",
                external: false
              },
              {
                id: "artifact-closure",
                sequence: 3,
                label: "Artifact closure",
                status: "watch",
                owner: "Launch owner",
                action: "Close the current artifact before sending.",
                evidence: "3/4 buyer artifacts are sealed.",
                href: "#homepage-proof-entry",
                unlock: "Send packet has the artifacts reviewers need.",
                external: false
              }
            ]
          },
          checks: [
            {
              id: "launch-room",
              label: "Launch room decision",
              status: "block",
              score: 52,
              evidence: "Launch room still has a value blocker.",
              action: "Tune the value model until the buyer can see base, downside, and break-even economics without a sales explanation.",
              href: "#buyer-value-simulator",
              external: false
            },
            {
              id: "public-proof",
              label: "Live proof reachability",
              status: "pass",
              score: 100,
              evidence: "5/5 evidence links verified live.",
              action: "Keep verified proof URLs attached.",
              href: "#launch-evidence-console",
              external: false
            },
            {
              id: "measured-run",
              label: "Measured pilot receipt",
              status: "block",
              score: 22,
              evidence: "0m saved/run.",
              action: "Record a measured run where assisted work beats the manual baseline.",
              href: "#pilot-run-receipt",
              external: false
            },
            {
              id: "artifact-closure",
              label: "Artifact closure",
              status: "watch",
              score: 75,
              evidence: "3/4 buyer artifacts are sealed.",
              action: "Close the current artifact before sending.",
              href: "#homepage-proof-entry",
              external: false
            }
          ]
        })
      )
    );

    expect(html).toContain("Buyer send is on hold");
    expect(html).toContain("72/100 share gate");
    expect(html).toContain("Resolve blocker: 1 blocker / 2 warnings");
    expect(html).toContain("block / Launch room decision");
    expect(html).toContain("Tune the value model until the buyer can see base, downside, and break-even economics without a sales explanation.");
    expect(html).toContain("pass / Live proof reachability");
    expect(html).toContain("5/5 evidence links verified live.");
    expect(html).toContain("Buyer send repair plan");
    expect(html).toContain("Repair path");
    expect(html).toContain("Export plan");
    expect(html).toContain('<details class="market-hero-share-gate-repair-plan repair"');
    expect(html).toContain("1/4 pass");
    expect(html).toContain("1. Pilot owner");
    expect(html).toContain("ROI claim becomes citeable from observed work.");
    expect(html.indexOf("pass / Live proof reachability")).toBeGreaterThan(html.indexOf("Buyer send decision"));
    expect(html.indexOf("Repair path")).toBeGreaterThan(html.indexOf("Buyer send decision"));
    expect(html.indexOf("Repair path")).toBeLessThan(html.indexOf("Gate checks"));
    expect(html).toContain('class="market-hero-share-gate block"');
    expect(html.indexOf("Buyer send decision")).toBeLessThan(html.indexOf("100/100 proof score"));
  });
});
