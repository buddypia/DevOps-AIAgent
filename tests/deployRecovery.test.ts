import { describe, expect, test } from "vitest";
import { buildDeployRecoveryPlan } from "../src/deployRecovery";
import { buildReleaseDriftGuard, type ReleaseDriftProbe } from "../src/releaseDrift";
import { SUBMISSION_PROOF } from "../src/submission";

const expectedSkillIds = [
  "task.delegate",
  "external.evidence",
  "evidence.monitor",
  "observability.oracle",
  "demo.receipt",
  "acceptance.matrix",
  "release.drift",
  "mvp.snapshot",
  "autonomy.snapshot",
  "pilot.economics",
  "pilot.value.snapshot",
  "demo.concierge",
  "judge.command",
  "judge.rehearsal",
  "winner.packet",
  "submission.runway",
  "submission.assets",
  "recording.script",
  "prize.strategy",
  "win.gap.radar",
  "submission.closeout",
  "deploy.recover",
  "competitive.battlecard",
  "competitive.snapshot",
  "judge.snapshot",
  "win.autopilot"
];

const requiredAgentCardSignals = [
  "judge.rehearsal:tag:recording-lock",
  "win.gap.radar:tag:feature-freeze-lock",
  "winner.packet:tag:winner-release-lock",
  "winner.packet:tag:get-proof",
  "finalist.simulate:tag:release-drift",
  "competitive.battlecard:tag:criteria-duel",
  "competitive.snapshot:tag:get-proof",
  "judge.snapshot:tag:get-proof",
  "mvp.snapshot:tag:get-proof",
  "autonomy.snapshot:tag:get-proof",
  "recording.script:tag:get-proof",
  "pilot.value.snapshot:tag:get-proof"
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
      observedSkillIds: ["task.delegate",
  "external.evidence",
  "evidence.monitor", "win.autopilot"],
      requiredSkillIds: expectedSkillIds,
      generatedAt: "2026-06-18T00:00:00.000Z",
      probes: [
        passedProbe("target-health"),
        {
          ...passedProbe("agent-card-skill-surface"),
          status: "watch",
          score: 58,
          evidence: "Target Agent Card exposes 29/44 skills."
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
    expect(plan.commands.find((command) => command.id === "verify-autonomy-snapshot")?.command).toContain("/api/autonomy-snapshot");
    expect(plan.commands.find((command) => command.id === "verify-recording-script")?.command).toContain("/api/recording-script");
    expect(plan.commands.find((command) => command.id === "verify-pilot-value")?.command).toContain("/api/pilot-value");
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
      requiredAgentCardSignals,
      observedAgentCardSignals: requiredAgentCardSignals,
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

  test("surfaces missing Agent Card signals as deploy blockers", () => {
    const releaseDrift = buildReleaseDriftGuard({
      currentBaseUrl: "http://localhost:8080",
      targetBaseUrl: SUBMISSION_PROOF.deployedUrl,
      expectedSkillIds,
      observedSkillIds: expectedSkillIds,
      requiredSkillIds: expectedSkillIds,
      requiredAgentCardSignals,
      observedAgentCardSignals: [
        "judge.rehearsal:tag:recording-lock",
        "win.gap.radar:tag:feature-freeze-lock",
        "winner.packet:tag:winner-release-lock",
        "finalist.simulate:tag:release-drift"
      ],
      generatedAt: "2026-06-18T00:00:00.000Z",
      probes: [
        passedProbe("target-health"),
        {
          ...passedProbe("agent-card-skill-surface"),
          status: "watch",
          score: 58,
          evidence: "Agent Card exposes all skills but misses autonomy.snapshot:tag:get-proof, competitive.battlecard:tag:criteria-duel, competitive.snapshot:tag:get-proof, judge.snapshot:tag:get-proof, mvp.snapshot:tag:get-proof, recording.script:tag:get-proof, and pilot.value.snapshot:tag:get-proof."
        },
        passedProbe("acceptance-endpoint"),
        passedProbe("a2a-artifact"),
        passedProbe("ci-main")
      ]
    });

    const plan = buildDeployRecoveryPlan({
      baseUrl: "http://localhost:8080",
      releaseDrift
    });

    expect(plan.readiness).toBe("redeploy-required");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")).toMatchObject({
      status: "blocked",
      evidence: expect.stringContaining("competitive.battlecard:tag:criteria-duel")
    });
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("judge.snapshot:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("mvp.snapshot:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("autonomy.snapshot:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("recording.script:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("pilot.value.snapshot:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("competitive.snapshot:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("winner.packet:tag:get-proof");
    expect(plan.commands.find((command) => command.id === "verify-agent-card-signals")).toMatchObject({
      blocking: true,
      copyGroup: "verify"
    });
    expect(plan.commands.find((command) => command.id === "verify-agent-card-signals")?.command).toContain('or .id=="autonomy.snapshot" or .id=="recording.script"');
    expect(plan.commands.find((command) => command.id === "verify-mvp-readiness")?.command).toContain("/api/mvp-readiness");
    expect(plan.commands.find((command) => command.id === "verify-autonomy-snapshot")?.why).toContain("Autonomy Snapshot");
    expect(plan.commands.find((command) => command.id === "verify-recording-script")?.why).toContain("Recording Script");
    expect(plan.commands.find((command) => command.id === "verify-pilot-value")?.why).toContain("Pilot Value");
    expect(plan.steps.find((step) => step.id === "skill-surface")?.status).toBe("blocked");
    expect(plan.blockers.map((blocker) => blocker.id)).toEqual(expect.arrayContaining(["agent-card-signals", "agent-card-skill-surface"]));
    expect(plan.judgeScript.join("\n")).toContain("competitive.battlecard:tag:criteria-duel");
    expect(plan.judgeScript.join("\n")).toContain("competitive.snapshot:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("judge.snapshot:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("mvp.snapshot:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("autonomy.snapshot:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("/api/autonomy-snapshot");
    expect(plan.judgeScript.join("\n")).toContain("recording.script:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("pilot.value.snapshot:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("winner.packet:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("/api/recording-script");
    expect(plan.judgeScript.join("\n")).toContain("/api/pilot-value");
    expect(plan.a2aPayload).toMatchObject({
      skill: "deploy.recover",
      releaseDrift: {
        missingAgentCardSignals: [
          "autonomy.snapshot:tag:get-proof",
          "competitive.battlecard:tag:criteria-duel",
          "competitive.snapshot:tag:get-proof",
          "judge.snapshot:tag:get-proof",
          "mvp.snapshot:tag:get-proof",
          "pilot.value.snapshot:tag:get-proof",
          "recording.script:tag:get-proof",
          "winner.packet:tag:get-proof"
        ]
      }
    });
  });
});
