import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildSquadContract } from "../src/contracts";
import { buildImpactCase } from "../src/impact";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMissionRun } from "../src/mission";
import { buildOpsDrill } from "../src/ops";
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

function fixture(selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"]) {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy);
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const securityReview = buildSecurityReview({
    baseUrl: SUBMISSION_PROOF.deployedUrl,
    recommendation,
    strategy,
    allowlist,
    ci,
    geminiSecretConfigured: true
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
  return { recommendation, strategy, userPilot };
}

describe("user pilot lab", () => {
  test("turns the weakest usability lane into target-user first-run paths", () => {
    const { userPilot } = fixture();

    expect(userPilot.pilotScore).toBeGreaterThanOrEqual(86);
    expect(userPilot.readiness).toBe("pilot-ready");
    expect(userPilot.paths).toHaveLength(3);
    expect(userPilot.paths.map((path) => path.id)).toEqual(["dev-lead", "platform-sre", "hackathon-submitter"]);
    expect(Math.max(...userPilot.paths.map((path) => path.timeToValueSeconds))).toBeLessThanOrEqual(120);
    expect(userPilot.frictions.map((friction) => friction.id)).not.toContain("ux-capability-gap");
    expect(userPilot.guideRails.map((rail) => rail.id)).toEqual(["score-first", "proof-buttons", "external-gate"]);
    expect(userPilot.nextClicks.map((click) => click.id)).toEqual(expect.arrayContaining(["build-prize-strategy", "build-tour", "issue-contracts", "run-impact", "hire-next"]));
    expect(userPilot.validationChecklist.every((item) => item.status !== "blocked")).toBe(true);
    expect(userPilot.validationChecklist.find((item) => item.id === "guided-first-run")?.status).toBe("clear");
    expect(userPilot.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "user.pilot",
      readiness: "pilot-ready",
      guideRails: expect.arrayContaining([expect.objectContaining({ id: "score-first" })])
    });
  });

  test("promotes the pilot when UX capability is explicitly hired", () => {
    const { userPilot, strategy } = fixture(["market-broker", "gemini-strategist", "cloud-run-sre", "ux-guildmaster"]);

    expect(strategy.judgeCriteria.find((criterion) => criterion.id === "usability")?.score).toBeGreaterThanOrEqual(82);
    expect(userPilot.pilotScore).toBeGreaterThanOrEqual(86);
    expect(userPilot.readiness).toBe("pilot-ready");
    expect(userPilot.frictions.map((friction) => friction.id)).not.toContain("ux-capability-gap");
    expect(userPilot.timeToValueSeconds).toBeLessThanOrEqual(150);
  });

  test("does not hide severe first-run usability gaps", () => {
    const { userPilot } = fixture(["cloud-run-sre"]);

    expect(userPilot.readiness).toBe("needs-redesign");
    expect(userPilot.frictions.some((friction) => friction.severity === "high")).toBe(true);
    expect(userPilot.hardTruth).toContain("作り直す");
  });
});
