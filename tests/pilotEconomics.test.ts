import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildSquadContract } from "../src/contracts";
import { buildImpactCase } from "../src/impact";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildPilotEconomics } from "../src/pilotEconomics";
import type { CiProof } from "../src/proof";
import { buildSecurityReview } from "../src/security";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildWinningStrategy } from "../src/strategy";
import { buildUserPilotLab } from "../src/userPilot";

const allowlist = {
  exactIpCount: 126,
  localDevelopmentCidrCount: 2,
  rakutenMobileCidrCount: 65
};

const ci: CiProof = {
  status: "passed",
  conclusion: "success",
  url: SUBMISSION_PROOF.ciWorkflowUrl,
  workflowUrl: SUBMISSION_PROOF.ciWorkflowUrl,
  branch: "main",
  checkedAt: "2026-06-18T00:00:00.000Z",
  evidence: "Latest main CI run completed successfully.",
  runId: 1
};

function fixture(
  selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"],
  options: { degradedSecurity?: boolean; degradedOps?: boolean } = {}
) {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "導入採算を検証する。");
  const opsDrill = buildOpsDrill(
    recommendation,
    strategy,
    options.degradedOps
      ? {
          healthOk: false,
          latencyP95Ms: 1800,
          errorRatePercent: 12,
          budgetBurnPercent: 99
        }
      : undefined
  );
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const securityReview = buildSecurityReview({
    baseUrl: SUBMISSION_PROOF.deployedUrl,
    recommendation,
    strategy,
    allowlist: options.degradedSecurity ? { exactIpCount: 0, localDevelopmentCidrCount: 0, rakutenMobileCidrCount: 0 } : allowlist,
    ci: options.degradedSecurity ? { ...ci, status: "missing", conclusion: "failure", evidence: "CI failed." } : ci,
    geminiSecretConfigured: !options.degradedSecurity
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  return { pilotEconomics };
}

describe("pilot economics", () => {
  test("turns impact metrics into a buyer-facing pilot investment case", () => {
    const { pilotEconomics } = fixture();

    expect(pilotEconomics.economicsScore).toBeGreaterThanOrEqual(86);
    expect(pilotEconomics.posture).toBe("investment-ready");
    expect(pilotEconomics.unitEconomics.savedHoursPerCycle).toBeGreaterThan(8);
    expect(pilotEconomics.unitEconomics.monthlyValueYen).toBeGreaterThan(pilotEconomics.unitEconomics.pilotCostYen);
    expect(pilotEconomics.unitEconomics.paybackDays).toBeLessThanOrEqual(30);
    expect(pilotEconomics.evidenceLock).toMatchObject({
      readiness: "buyer-ready",
      targetBuyer: expect.stringContaining("DevOps"),
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "three-persona-paths", status: "clear" }),
        expect.objectContaining({ id: "payback-under-month", status: "clear" }),
        expect.objectContaining({ id: "buyer-objections-clear", status: "clear" }),
        expect.objectContaining({ id: "public-proof-ready", status: "clear" })
      ])
    });
    expect(pilotEconomics.evidenceLock.lockScore).toBeGreaterThanOrEqual(90);
    expect(pilotEconomics.evidenceLock.valueClaim).toContain("21日");
    expect(pilotEconomics.pricingLanes.map((lane) => lane.id)).toEqual(["two-week-pilot", "team-retainer", "procurement-desk"]);
    expect(pilotEconomics.pilotPlan.map((step) => step.id)).toEqual(["baseline", "first-run", "economic-check", "public-proof"]);
    expect(pilotEconomics.buyerObjections.map((objection) => objection.id)).toEqual(
      expect.arrayContaining(["existing-tools", "roi-assumption", "security", "adoption"])
    );
    expect(pilotEconomics.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "pilot.economics",
      posture: "investment-ready",
      evidenceLock: {
        readiness: "buyer-ready",
        checks: expect.arrayContaining([expect.objectContaining({ id: "buyer-objections-clear", status: "clear" })])
      }
    });
  });

  test("keeps unsafe or unusable squads out of investment-ready posture", () => {
    const { pilotEconomics } = fixture(["cloud-run-sre"], { degradedSecurity: true, degradedOps: true });

    expect(pilotEconomics.posture).toBe("not-economic");
    expect(pilotEconomics.evidenceLock.readiness).toBe("blocked");
    expect(pilotEconomics.evidenceLock.checks.map((check) => check.status)).toContain("blocked");
    expect(pilotEconomics.buyerObjections.find((objection) => objection.id === "security")?.status).toBe("blocked");
    expect(pilotEconomics.buyerObjections.find((objection) => objection.id === "adoption")?.status).toBe("blocked");
    expect(pilotEconomics.nextActions.map((action) => action.id)).toEqual(expect.arrayContaining(["security", "adoption"]));
  });
});
