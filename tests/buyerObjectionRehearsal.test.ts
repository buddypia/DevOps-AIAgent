import { describe, expect, test } from "vitest";
import { buildBuyerObjectionRehearsal, buildBuyerObjectionRehearsalMarkdown } from "../src/BuyerObjectionRehearsal";
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
    score: input.status === "pass" ? 95 : input.status === "watch" ? 72 : 40,
    buyerQuestion: input.buyerQuestion,
    claim: `${input.label} is supported by buyer proof.`,
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
    verification: `${input.label} verification is ready for objection handling.`,
    nextAction: input.status === "pass" ? "Keep this proof attached." : "Repair this proof before buyer review.",
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
    score: 62,
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

describe("buyer objection rehearsal", () => {
  test("turns claim trace evidence into objection answers", () => {
    const objections = buildBuyerObjectionRehearsal(trace());

    expect(objections).toHaveLength(5);
    expect(objections.map((objection) => objection.id)).toEqual(["demo-risk", "value-proof", "public-proof", "security-procurement", "decision-owner"]);
    expect(objections.find((objection) => objection.id === "value-proof")).toMatchObject({
      status: "pass",
      stakeholder: "Finance",
      answer: "The value answer is defensible because modeled value and a measured buyer-like run are both present."
    });
    expect(objections.find((objection) => objection.id === "public-proof")).toMatchObject({
      status: "block",
      repairAction: "Repair this proof before buyer review."
    });
    expect(objections.find((objection) => objection.id === "security-procurement")?.evidenceLines).toContain(
      "Operating trust claim: Operating trust claim verification is ready for objection handling."
    );
  });

  test("exports a rehearsal markdown packet without empty placeholders", () => {
    const markdown = buildBuyerObjectionRehearsalMarkdown(trace(), "https://example.com/buyer-evidence-trace");

    expect(markdown).toContain("# Buyer objection rehearsal");
    expect(markdown).toContain("Public trace: https://example.com/buyer-evidence-trace");
    expect(markdown).toContain("## Demo risk");
    expect(markdown).toContain("Objection: This still looks like a demo. Why should we trust it?");
    expect(markdown).toContain("Answer: Do not present this as a product-ready room while the public proof or decision claim is blocked.");
    expect(markdown).toContain("If challenged: Open the public trace first, then show the work order and share decision before discussing features.");
    expect(markdown).not.toContain("undefined");
  });
});
