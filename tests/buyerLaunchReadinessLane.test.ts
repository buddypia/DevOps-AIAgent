import { describe, expect, test } from "vitest";
import { buildBuyerLaunchReadinessLane, buildBuyerLaunchReadinessLaneMarkdown } from "../src/BuyerLaunchReadinessLane";
import type { BuyerEvidenceTrace, BuyerEvidenceTraceClaim } from "../src/buyerEvidenceTrace";

function claim(input: {
  id: BuyerEvidenceTraceClaim["id"];
  label: string;
  status: BuyerEvidenceTraceClaim["status"];
  buyerQuestion: string;
  artifactHref: string;
}): BuyerEvidenceTraceClaim {
  return {
    id: input.id,
    label: input.label,
    status: input.status,
    score: input.status === "pass" ? 94 : input.status === "watch" ? 70 : 36,
    buyerQuestion: input.buyerQuestion,
    claim: `${input.label} is supported by launch proof.`,
    source: {
      label: `${input.label} source`,
      value: `${input.label} source evidence is available.`,
      href: `#${input.id}-source`,
      status: input.status
    },
    artifact: {
      label: `${input.label} artifact`,
      value: `${input.label} artifact can be opened.`,
      href: input.artifactHref,
      status: input.status
    },
    verification: `${input.label} verification is ready for launch readiness.`,
    nextAction: input.status === "pass" ? "Keep this gate attached." : "Repair this gate before external review.",
    auditChecks: [
      {
        id: "source-check",
        label: "Source check",
        status: input.status,
        method: "Read source evidence.",
        evidence: `${input.label} source evidence.`,
        href: `#${input.id}-source`,
        failureMode: "Source missing.",
        repairAction: "Attach source evidence."
      },
      {
        id: "artifact-link",
        label: "Artifact link",
        status: input.status,
        method: "Open artifact.",
        evidence: `${input.label} artifact evidence.`,
        href: input.artifactHref,
        failureMode: "Artifact missing.",
        repairAction: "Attach public artifact."
      },
      {
        id: "claim-match",
        label: "Claim match",
        status: input.status,
        method: "Compare claim to artifact.",
        evidence: `${input.label} claim evidence.`,
        href: input.artifactHref,
        failureMode: "Claim not supported.",
        repairAction: "Rewrite or repair claim."
      }
    ]
  };
}

function trace(): BuyerEvidenceTrace {
  const claims = [
    claim({
      id: "value-case",
      label: "Buyer value claim",
      status: "pass",
      buyerQuestion: "Can a buyer understand the value without a sales call?",
      artifactHref: "https://example.com/value"
    }),
    claim({
      id: "measured-pilot",
      label: "Measured pilot claim",
      status: "pass",
      buyerQuestion: "Is at least one buyer-like run measured and accepted?",
      artifactHref: "https://example.com/pilot"
    }),
    claim({
      id: "public-proof",
      label: "Public proof claim",
      status: "block",
      buyerQuestion: "Can an outside reviewer open every proof URL right now?",
      artifactHref: "#launch-evidence-console"
    }),
    claim({
      id: "work-order",
      label: "Work order claim",
      status: "pass",
      buyerQuestion: "Can the buyer see exactly what work is being approved?",
      artifactHref: "https://example.com/work-order"
    }),
    claim({
      id: "operating-gates",
      label: "Operating trust claim",
      status: "watch",
      buyerQuestion: "Can procurement see adoption, trust, and commercial stop rules?",
      artifactHref: "https://example.com/trust"
    }),
    claim({
      id: "buyer-decision",
      label: "Buyer decision claim",
      status: "block",
      buyerQuestion: "What is the next externally safe decision?",
      artifactHref: "https://example.com/sponsor"
    })
  ];

  return {
    id: "buyer-evidence-trace-test",
    generatedAt: "2026-06-27T00:00:00.000Z",
    readiness: "not-shareable",
    score: 61,
    headline: "Buyer claims are not safe to share yet",
    hardTruth: "Public proof still blocks sharing.",
    targetBuyer: "Platform release lead",
    shareDecision: "Repair before sharing.",
    primaryClaim: claims[2],
    claims,
    auditSummary: {
      readiness: "audit-blocked",
      passCount: 10,
      totalCount: 18,
      primaryFailure: claims[2].auditChecks[0]
    },
    approvalTrail: {
      readiness: "block",
      receiptDigest: null,
      receiptId: null,
      items: []
    },
    blockers: [
      {
        id: "public-proof",
        label: "Public proof claim",
        status: "block",
        owner: "Proof owner",
        action: "Replace the blocked URL and rerun live verification.",
        href: "#launch-evidence-console"
      }
    ],
    exportMarkdown: ""
  };
}

describe("buyer launch readiness lane", () => {
  test("turns claim trace evidence into launch gates", () => {
    const stages = buildBuyerLaunchReadinessLane(trace());

    expect(stages).toHaveLength(5);
    expect(stages.map((stage) => stage.id)).toEqual(["value-evidence", "measured-run", "public-proof", "operating-scope", "decision-record"]);
    expect(stages.find((stage) => stage.id === "value-evidence")).toMatchObject({
      status: "pass",
      owner: "Value owner",
      unlock: "Use the value case in buyer-facing material."
    });
    expect(stages.find((stage) => stage.id === "public-proof")).toMatchObject({
      status: "block",
      unlock: "Hold external sharing until public proof is reachable.",
      nextAction: "Repair this gate before external review."
    });
    expect(stages.find((stage) => stage.id === "operating-scope")?.proofLines).toContain(
      "Operating trust claim: Operating trust claim verification is ready for launch readiness."
    );
  });

  test("exports the launch lane as a markdown workback plan", () => {
    const markdown = buildBuyerLaunchReadinessLaneMarkdown(trace(), "https://example.com/buyer-evidence-trace");

    expect(markdown).toContain("# Buyer launch readiness lane");
    expect(markdown).toContain("Public trace: https://example.com/buyer-evidence-trace");
    expect(markdown).toContain("## Public proof");
    expect(markdown).toContain("Owner: Proof owner");
    expect(markdown).toContain("Unlock: Hold external sharing until public proof is reachable.");
    expect(markdown).toContain("Next action: Repair this gate before external review.");
    expect(markdown).not.toContain("undefined");
  });
});
