import { describe, expect, test } from "vitest";
import { buildDeployRecoveryPlan } from "../src/deployRecovery";
import { buildReleaseDriftGuard, type ReleaseDriftProbe } from "../src/releaseDrift";
import { SUBMISSION_PROOF } from "../src/submission";

const expectedSkillIds = [
  "evidence.monitor",
  "demo.receipt",
  "acceptance.matrix",
  "release.drift",
  "pilot.economics",
  "demo.concierge",
  "judge.command",
  "judge.rehearsal",
  "prize.strategy",
  "win.gap.radar",
  "submission.closeout",
  "deploy.recover",
  "competitive.battlecard",
  "win.autopilot"
];

const passedProbe = (id: string): ReleaseDriftProbe => ({
  id,
  label: id,
  status: "passed",
  score: 100,
  url: `${SUBMISSION_PROOF.deployedUrl}/${id}`,
  evidence: `${id} passed`,
  required: true
});

describe("deploy recovery plan", () => {
  test("requires manual auth when gcloud reauthentication blocked deployment", () => {
    const releaseDrift = buildReleaseDriftGuard({
      currentBaseUrl: "http://localhost:8080",
      targetBaseUrl: SUBMISSION_PROOF.deployedUrl,
      expectedSkillIds,
      observedSkillIds: ["evidence.monitor", "win.autopilot"],
      requiredSkillIds: expectedSkillIds,
      generatedAt: "2026-06-18T00:00:00.000Z",
      probes: [
        passedProbe("target-health"),
        {
          ...passedProbe("agent-card-skill-surface"),
          status: "watch",
          score: 58,
          evidence: "Target Agent Card exposes 29/41 skills."
        },
        {
          ...passedProbe("acceptance-endpoint"),
          status: "missing",
          score: 24,
          evidence: "Acceptance endpoint returned HTML."
        },
        {
          ...passedProbe("a2a-artifact"),
          status: "watch",
          score: 62,
          evidence: "A2A artifact lacks deploy recovery."
        },
        passedProbe("ci-main")
      ]
    });

    const plan = buildDeployRecoveryPlan({
      baseUrl: "http://localhost:8080",
      releaseDrift,
      lastDeployError: "Reauthentication failed. cannot prompt during non-interactive execution. Please run: gcloud auth login"
    });

    expect(plan.readiness).toBe("manual-auth-required");
    expect(plan.recoveryScore).toBe(73);
    expect(plan.primaryAction).toContain("gcloud auth login");
    expect(plan.commands.find((command) => command.id === "auth-login")).toMatchObject({ blocking: true, copyGroup: "auth" });
    expect(plan.commands.find((command) => command.id === "verify-recovery-endpoint")?.command).toContain("/api/deploy-recovery");
    expect(plan.blockers.map((blocker) => blocker.id)).toEqual(expect.arrayContaining(["gcloud-auth", "agent-card-skill-surface"]));
    expect(plan.a2aPayload).toMatchObject({
      skill: "deploy.recover",
      readiness: "manual-auth-required"
    });
  });

  test("marks recovery complete when release drift is current", () => {
    const releaseDrift = buildReleaseDriftGuard({
      currentBaseUrl: "http://localhost:8080",
      targetBaseUrl: SUBMISSION_PROOF.deployedUrl,
      expectedSkillIds,
      observedSkillIds: expectedSkillIds,
      requiredSkillIds: expectedSkillIds,
      generatedAt: "2026-06-18T00:00:00.000Z",
      probes: [
        passedProbe("target-health"),
        passedProbe("agent-card-skill-surface"),
        passedProbe("acceptance-endpoint"),
        passedProbe("a2a-artifact"),
        passedProbe("ci-main")
      ]
    });

    const plan = buildDeployRecoveryPlan({
      baseUrl: "http://localhost:8080",
      releaseDrift
    });

    expect(plan.readiness).toBe("recovered");
    expect(plan.recoveryScore).toBe(100);
    expect(plan.checks.find((check) => check.id === "skill-surface")?.status).toBe("ready");
    expect(plan.blockers).toHaveLength(0);
  });
});
