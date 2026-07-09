import { describe, expect, test } from "vitest";
import { buyerFacingProofUrlProblem, isBuyerFacingProofUrl, normalizeBuyerFacingProofUrl } from "../src/publicProofUrl";

describe("buyer-facing proof URL", () => {
  test("accepts only HTTPS non-local proof URLs", () => {
    expect(isBuyerFacingProofUrl("https://storage.googleapis.com/a2a-agent-marketplace-proof/run.json")).toBe(true);
    expect(isBuyerFacingProofUrl("https://proof.example.com/run")).toBe(false);
    expect(isBuyerFacingProofUrl("https://proof.example.org/run")).toBe(false);
    expect(isBuyerFacingProofUrl("https://proof.example.net/run")).toBe(false);
    expect(isBuyerFacingProofUrl("http://proof.example.com/run")).toBe(false);
    expect(isBuyerFacingProofUrl("https://localhost:5173/run")).toBe(false);
    expect(isBuyerFacingProofUrl("https://proof.your-company.com/receipts/a2a-trial.json")).toBe(false);
    expect(isBuyerFacingProofUrl("https://artifact.invalid/receipt")).toBe(false);
    expect(isBuyerFacingProofUrl("https://buyer-proof.test/receipt")).toBe(false);
    expect(isBuyerFacingProofUrl("https://proof.example.com/<public-artifact>")).toBe(false);
    expect(isBuyerFacingProofUrl("not-a-url")).toBe(false);
  });

  test("explains why placeholder proof URLs cannot be buyer-facing", () => {
    expect(buyerFacingProofUrlProblem("")).toBe("Paste a public HTTPS proof URL.");
    expect(buyerFacingProofUrlProblem("http://proof.example.com/run")).toBe("Use a secure https:// proof URL.");
    expect(buyerFacingProofUrlProblem("https://localhost:5173/run")).toBe("Use a public host reviewers can open, not a local or private network URL.");
    expect(buyerFacingProofUrlProblem("https://artifact.invalid/receipt")).toBe("Replace the placeholder proof host with a real public artifact URL.");
    expect(buyerFacingProofUrlProblem("https://proof.example.com/<public-artifact>")).toBe("Replace placeholder tokens with a real public artifact URL.");
    expect(buyerFacingProofUrlProblem("https://proof.example.com/run")).toBe("Replace the demo proof host with a real public artifact URL.");
    expect(buyerFacingProofUrlProblem("https://storage.googleapis.com/a2a-agent-marketplace-proof/run.json")).toBe("");
  });

  test("normalizes only buyer-facing HTTPS proof URLs", () => {
    expect(normalizeBuyerFacingProofUrl(" https://storage.googleapis.com/a2a-agent-marketplace-proof/run.json ")).toBe(
      "https://storage.googleapis.com/a2a-agent-marketplace-proof/run.json"
    );
    expect(normalizeBuyerFacingProofUrl(" https://proof.example.com/run ")).toBe("");
    expect(normalizeBuyerFacingProofUrl("http://proof.example.com/run")).toBe("");
    expect(normalizeBuyerFacingProofUrl("https://proof.your-company.com/receipts/a2a-trial.json")).toBe("");
  });
});
