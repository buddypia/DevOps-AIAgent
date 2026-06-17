import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildImpactCase } from "../src/impact";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildOpsDrill } from "../src/ops";
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

function fixture(selectedAgentIds: string[], options: { degradedSecurity?: boolean; degradedOps?: boolean } = {}) {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 180);
  const strategy = buildWinningStrategy(recommendation);
  const opsDrill = buildOpsDrill(
    recommendation,
    strategy,
    options.degradedOps
      ? {
          healthOk: false,
          latencyP95Ms: 1600,
          errorRatePercent: 9.2,
          budgetBurnPercent: 98
        }
      : undefined
  );
  const securityReview = buildSecurityReview({
    baseUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
    recommendation,
    strategy,
    allowlist: options.degradedSecurity ? { exactIpCount: 0, localDevelopmentCidrCount: 0, rakutenMobileCidrCount: 0 } : allowlist,
    ci: options.degradedSecurity ? { ...passedCi, status: "missing", conclusion: "failure", evidence: "CI failed." } : passedCi,
    geminiSecretConfigured: !options.degradedSecurity
  });
  return { recommendation, strategy, opsDrill, securityReview };
}

describe("impact case", () => {
  test("quantifies practical value for the default hackathon squad", () => {
    const impact = buildImpactCase(fixture(["market-broker", "gemini-strategist", "cloud-run-sre"]));

    expect(impact.impactScore).toBeGreaterThanOrEqual(84);
    expect(impact.posture).toBe("pilot-ready");
    expect(impact.metrics.map((metric) => metric.id)).toEqual(
      expect.arrayContaining([
        "agent-selection-hours",
        "evidence-pack-hours",
        "handoff-friction-hours",
        "runtime-risk",
        "submission-confidence",
        "experience-value"
      ])
    );
    expect(impact.metrics.find((metric) => metric.id === "agent-selection-hours")?.delta).toBeGreaterThan(3);
    expect(impact.metrics.find((metric) => metric.id === "submission-confidence")?.after).toBeGreaterThanOrEqual(80);
    expect(impact.personas).toHaveLength(3);
    expect(impact.workflow.map((step) => step.id)).toEqual(["sense", "buy", "delegate", "operate", "submit"]);
    expect(impact.adoptionPlan.map((step) => step.id)).toEqual(["day-0", "week-2", "quarter"]);
    expect(impact.nextImpactHire?.id).toBe("ux-guildmaster");
    expect(impact.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "impact.case",
      posture: "pilot-ready"
    });
  });

  test("moves from UX improvement to implementation proof after usability and observability are selected", () => {
    const impact = buildImpactCase(
      fixture(["market-broker", "gemini-strategist", "cloud-run-sre", "ux-guildmaster", "observability-oracle"])
    );

    expect(impact.impactScore).toBeGreaterThanOrEqual(86);
    expect(impact.nextImpactHire?.id).toBe("test-forge");
    expect(impact.metrics.find((metric) => metric.id === "runtime-risk")?.after).toBeLessThanOrEqual(25);
  });

  test("does not call a weak, unsafe squad practical enough", () => {
    const impact = buildImpactCase(fixture(["brief-cartographer"], { degradedSecurity: true, degradedOps: true }));

    expect(impact.posture).toBe("not-credible");
    expect(impact.impactScore).toBeLessThan(70);
    expect(impact.risks.map((risk) => risk.id)).toEqual(expect.arrayContaining(["model-assumption", "external-submit"]));
    expect(impact.hardTruth).toContain("現場価値");
  });
});
