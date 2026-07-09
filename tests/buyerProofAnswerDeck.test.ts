import { describe, expect, test } from "vitest";
import { buildBuyerProofAnswerDeckMarkdown } from "../src/BuyerProofAnswerDeck";
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
    score: input.status === "pass" ? 100 : 42,
    buyerQuestion: input.buyerQuestion,
    claim: `${input.label} is backed by visible buyer evidence.`,
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
    verification: `${input.label} source, artifact, and claim match were checked.`,
    nextAction: input.status === "pass" ? "Keep this answer attached." : "Attach a public proof URL before sharing.",
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
  const valueClaim = claim({
    id: "value-case",
    label: "Buyer value claim",
    status: "pass",
    buyerQuestion: "Can a buyer understand the value without a sales call?",
    artifactHref: "https://example.com/value"
  });
  const proofClaim = claim({
    id: "public-proof",
    label: "Public proof claim",
    status: "block",
    buyerQuestion: "Can an outside reviewer open every proof URL right now?",
    artifactHref: "#launch-evidence-console"
  });

  return {
    id: "buyer-evidence-trace-test",
    generatedAt: "2026-06-27T00:00:00.000Z",
    readiness: "not-shareable",
    score: 58,
    headline: "Buyer claims are not safe to share yet",
    hardTruth: "Public proof still blocks sharing.",
    targetBuyer: "Platform release lead",
    shareDecision: "Repair before sharing.",
    primaryClaim: proofClaim,
    claims: [valueClaim, proofClaim],
    auditSummary: {
      readiness: "audit-blocked",
      passCount: 3,
      totalCount: 6,
      primaryFailure: proofClaim.auditChecks[0]
    },
    approvalTrail: {
      readiness: "block",
      receiptDigest: null,
      receiptId: null,
      items: [
        {
          id: "claim-trace",
          label: "Claim trace",
          status: "block",
          evidence: "Public proof claim is blocked.",
          href: "#buyer-evidence-trace",
          verifier: "Buyer evidence trace"
        }
      ]
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

describe("buyer proof answer deck", () => {
  test("turns the claim trace into evidence-backed buyer answers", () => {
    const markdown = buildBuyerProofAnswerDeckMarkdown(trace(), "https://example.com/buyer-evidence-trace");

    expect(markdown).toContain("# Buyer proof answer deck");
    expect(markdown).toContain("Claims linked: 1/2");
    expect(markdown).toContain("Audit checks: 3/6");
    expect(markdown).toContain("Public trace: https://example.com/buyer-evidence-trace");
    expect(markdown).toContain("## Next repair");
    expect(markdown).toContain("- Public proof claim (block)");
    expect(markdown).toContain("Owner: Proof owner");
    expect(markdown).toContain("Question: Can an outside reviewer open every proof URL right now?");
    expect(markdown).toContain("Evidence answer: Public proof claim source, artifact, and claim match were checked.");
    expect(markdown).toContain("Send rule: Do not send this answer yet. Repair the blocker first.");
    expect(markdown).not.toContain("undefined");
  });
});
