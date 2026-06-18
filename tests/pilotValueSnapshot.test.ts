import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildSquadContract } from "../src/contracts";
import { buildImpactCase } from "../src/impact";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
import { buildPilotEconomics } from "../src/pilotEconomics";
import { buildPilotValueSnapshot, renderPilotValueSnapshotHtml } from "../src/pilotValueSnapshot";
import type { CiProof } from "../src/proof";
import { buildSecurityReview } from "../src/security";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildWinningStrategy } from "../src/strategy";
import { buildUserPilotLab } from "../src/userPilot";

const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
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
  const mission = buildMissionRun(recommendation, strategy, "実用性・体験価値を直接開けるGET証拠にする。");
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
    baseUrl,
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
  const snapshot = buildPilotValueSnapshot({
    baseUrl,
    impactCase,
    userPilot,
    pilotEconomics,
    generatedAt: "2026-06-18T00:00:00.000Z"
  });
  return { snapshot };
}

describe("pilot value snapshot", () => {
  test("turns impact, first-run UX, and economics into a direct-open judge proof", () => {
    const { snapshot } = fixture();

    expect(snapshot.readiness).toBe("pilot-value-ready");
    expect(snapshot.summary).toMatchObject({
      impactScore: expect.any(Number),
      pilotScore: expect.any(Number),
      economicsScore: expect.any(Number),
      paybackDays: 21,
      evidenceLockReadiness: "buyer-ready",
      personaCount: 3,
      buyerObjectionCount: 4
    });
    expect(snapshot.summary.monthlyValueYen).toBeGreaterThan(snapshot.economics.pilotCostYen);
    expect(snapshot.links.map((link) => link.url)).toEqual(
      expect.arrayContaining([`${baseUrl}/pilot-value`, `${baseUrl}/api/pilot-value`, `${baseUrl}/api/impact-case`, `${baseUrl}/api/user-pilot`, `${baseUrl}/api/pilot-economics`])
    );
    expect(snapshot.pilotPaths).toHaveLength(3);
    expect(snapshot.evidenceLock.checks.find((check) => check.id === "buyer-objections-clear")?.status).toBe("clear");
    expect(snapshot.a2aPayload).toMatchObject({
      skill: "pilot.value.snapshot",
      readiness: "pilot-value-ready",
      endpoints: {
        pilotValue: `${baseUrl}/pilot-value`,
        pilotValueJson: `${baseUrl}/api/pilot-value`
      }
    });
  });

  test("does not hide unsafe or unusable pilot value claims", () => {
    const { snapshot } = fixture(["cloud-run-sre"], { degradedSecurity: true, degradedOps: true });

    expect(snapshot.readiness).toBe("pilot-value-blocked");
    expect(snapshot.evidenceLock.readiness).toBe("blocked");
    expect(snapshot.buyerObjections.map((objection) => objection.status)).toContain("blocked");
    expect(snapshot.judgeScript.join("\n")).toContain("Pilot Evidence Lock");
  });

  test("renders safe HTML for the practical value proof page", () => {
    const { snapshot } = fixture();
    snapshot.personas[0].pain = "<script>alert('pilot')</script>";

    const html = renderPilotValueSnapshotHtml(snapshot);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Pilot Value Snapshot");
    expect(html).toContain("Target Personas");
    expect(html).toContain("Buyer Objections");
    expect(html).toContain("&lt;script&gt;alert(&#39;pilot&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('pilot')</script>");
  });
});
