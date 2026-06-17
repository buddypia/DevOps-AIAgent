import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import type { CiProof } from "../src/proof";
import { buildSecurityReview } from "../src/security";
import { buildWinningStrategy } from "../src/strategy";

const allowlist = {
  exactIpCount: 126,
  localDevelopmentCidrCount: 2,
  rakutenMobileCidrCount: 65
};

const passedCi: CiProof = {
  status: "passed",
  conclusion: "success",
  url: "https://github.com/buddypia/DevOps-AIAgent/actions/runs/1",
  workflowUrl: "https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml",
  branch: "main",
  checkedAt: "2026-06-18T00:00:00.000Z",
  evidence: "Latest main CI run completed successfully.",
  runId: 1
};

describe("security sentinel review", () => {
  test("turns runtime trust boundaries into judge-ready security evidence", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const review = buildSecurityReview({
      baseUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
      recommendation,
      strategy,
      allowlist,
      ci: passedCi,
      geminiSecretConfigured: true
    });

    expect(review.securityScore).toBeGreaterThanOrEqual(88);
    expect(review.posture).toBe("guarded");
    expect(review.controls.map((control) => control.id)).toEqual(
      expect.arrayContaining([
        "secret-boundary",
        "ip-allowlist",
        "input-contract",
        "a2a-trust-boundary",
        "ci-quality-gate",
        "prompt-output-boundary",
        "cloud-run-runtime",
        "submission-data-minimization"
      ])
    );
    expect(review.controls.every((control) => control.status !== "fail")).toBe(true);
    expect(review.boundaries.map((boundary) => boundary.id)).toEqual(
      expect.arrayContaining(["browser-to-express", "express-to-gemini", "a2a-to-agent", "cloud-run-to-public"])
    );
    expect(review.threats.map((threat) => threat.id)).toEqual(expect.arrayContaining(["secret-leak", "prompt-injection", "a2a-overreach"]));
    expect(review.nextSecurityHire?.id).toBe("security-sentinel");
    expect(review.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "security.review",
      posture: "guarded"
    });
    expect(review.runbookCommands.join("\n")).toContain("/api/security-review");
  });

  test("removes the next security hire once Security Sentinel is selected", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "gemini-strategist", "cloud-run-sre", "security-sentinel"], 180);
    const strategy = buildWinningStrategy(recommendation);
    const review = buildSecurityReview({
      baseUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
      recommendation,
      strategy,
      allowlist,
      ci: passedCi,
      geminiSecretConfigured: true
    });

    expect(review.nextSecurityHire).toBeNull();
    expect(review.controls.find((control) => control.id === "a2a-trust-boundary")?.score).toBeGreaterThanOrEqual(94);
    expect(review.a2aPayload).toMatchObject({
      actor: "Security Sentinel",
      nextSecurityHire: null
    });
  });

  test("marks the security story exposed when core guardrails are missing", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["gemini-strategist"], 140);
    const strategy = buildWinningStrategy(recommendation);
    const review = buildSecurityReview({
      baseUrl: "http://localhost:8080",
      recommendation,
      strategy,
      allowlist: { exactIpCount: 0, localDevelopmentCidrCount: 0, rakutenMobileCidrCount: 0 },
      ci: { ...passedCi, status: "missing", conclusion: "failure", evidence: "CI failed." },
      geminiSecretConfigured: false
    });

    expect(review.posture).toBe("exposed");
    expect(review.controls.find((control) => control.id === "ip-allowlist")?.status).toBe("fail");
    expect(review.controls.find((control) => control.id === "ci-quality-gate")?.status).toBe("fail");
    expect(review.hardTruth).toContain("公開デモ");
  });
});
