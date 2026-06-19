import { describe, expect, test } from "vitest";
import { buildDeployRecoveryPlan, renderDeployRecoveryHtml } from "../src/deployRecovery";
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
  "winner.sufficiency",
  "submission.dossier",
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
  "acceptance.matrix:tag:acceptance-matrix-lock",
  "judge.rehearsal:tag:recording-lock",
  "win.gap.radar:tag:feature-freeze-lock",
  "winner.packet:tag:winner-release-lock",
  "winner.packet:tag:get-proof",
  "winner.sufficiency:tag:winner-sufficiency-lock",
  "win.autopilot:tag:win-autopilot-lock",
  "finalist.simulate:tag:release-drift",
  "competitive.battlecard:tag:criteria-duel",
  "competitive.snapshot:tag:get-proof",
  "judge.snapshot:tag:get-proof",
  "mvp.snapshot:tag:get-proof",
  "autonomy.snapshot:tag:get-proof",
  "external.evidence:tag:external-evidence-lock",
  "observability.oracle:tag:observability-oracle-lock",
  "judge.command:tag:judge-command-lock",
  "recording.script:tag:get-proof",
  "prize.strategy:tag:prize-strategy-lock",
  "submission.publish:tag:submission-publish-lock",
  "submission.dossier:tag:submission-dossier-lock",
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
    expect(plan.hardTruth).toContain("GitHub Actions");
    expect(plan.primaryAction).toContain("gcloud auth login");
    expect(plan.primaryAction).toContain("Deploy Cloud Run workflow");
    expect(plan.commands.find((command) => command.id === "auth-login")).toMatchObject({ blocking: true, copyGroup: "auth" });
    expect(plan.commands.find((command) => command.id === "verify-github-deploy-secrets")).toMatchObject({ blocking: true, copyGroup: "auth" });
    expect(plan.commands.find((command) => command.id === "verify-github-deploy-secrets")?.command).toContain("GCP_WORKLOAD_IDENTITY_PROVIDER");
    expect(plan.commands.find((command) => command.id === "preview-github-actions-deploy-bootstrap")).toMatchObject({ blocking: false, copyGroup: "auth" });
    expect(plan.commands.find((command) => command.id === "preview-github-actions-deploy-bootstrap")?.command).toContain("DRY_RUN=1");
    expect(plan.commands.find((command) => command.id === "bootstrap-github-actions-deploy")).toMatchObject({ blocking: true, copyGroup: "auth" });
    expect(plan.commands.find((command) => command.id === "bootstrap-github-actions-deploy")?.command).toContain("./scripts/bootstrap_github_actions_deploy.sh");
    expect(plan.commands.find((command) => command.id === "github-actions-deploy")).toMatchObject({ blocking: true, copyGroup: "deploy" });
    expect(plan.commands.find((command) => command.id === "github-actions-deploy")?.command).toContain("gh workflow run deploy-cloud-run.yml");
    expect(plan.commands.find((command) => command.id === "verify-autonomy-snapshot")?.command).toContain("/api/autonomy-snapshot");
    expect(plan.commands.find((command) => command.id === "verify-recording-script")?.command).toContain("/api/recording-script");
    expect(plan.commands.find((command) => command.id === "verify-pilot-value")?.command).toContain("/api/pilot-value");
    expect(plan.commands.find((command) => command.id === "verify-external-evidence-page")?.command).toContain("/external-evidence");
    expect(plan.commands.find((command) => command.id === "verify-judge-command-page")?.command).toContain("/judge-command-center");
    expect(plan.commands.find((command) => command.id === "verify-prize-strategy-page")?.command).toContain("/prize-strategy");
    expect(plan.commands.find((command) => command.id === "verify-publisher-page")?.command).toContain("/publisher");
    expect(plan.commands.find((command) => command.id === "verify-dossier-page")?.command).toContain("/dossier");
    expect(plan.commands.find((command) => command.id === "verify-acceptance-matrix-page")?.command).toContain("/acceptance-matrix");
    expect(plan.commands.find((command) => command.id === "verify-recovery-page")?.command).toContain("/deploy-recovery");
    expect(plan.commands.find((command) => command.id === "verify-recovery-endpoint")?.command).toContain("/api/deploy-recovery");
    expect(plan.commands.find((command) => command.id === "verify-a2a-artifact")?.command).toContain("deployRecoveryPageEndpoint");
    expect(plan.commands.find((command) => command.id === "verify-a2a-artifact")?.command).toContain("prizeStrategyPageEndpoint");
    expect(plan.commands.find((command) => command.id === "verify-a2a-artifact")?.command).toContain("publisherPageEndpoint");
    expect(plan.commands.find((command) => command.id === "verify-a2a-artifact")?.command).toContain("dossierPageEndpoint");
    expect(plan.blockers.map((blocker) => blocker.id)).toEqual(expect.arrayContaining(["gcloud-auth", "agent-card-skill-surface"]));
    expect(plan.blockers.find((blocker) => blocker.id === "gcloud-auth")?.action).toContain("bootstrap script");
    expect(plan.judgeScript.join("\n")).toContain("GitHub Actions deploy workflow");
    expect(plan.a2aPayload).toMatchObject({
      skill: "deploy.recover",
      readiness: "manual-auth-required",
      pageEndpoint: "http://localhost:8080/deploy-recovery"
    });

    const html = renderDeployRecoveryHtml({
      ...plan,
      hardTruth: "<script>alert('deploy')</script>"
    });
    expect(html).toContain("Deploy Recovery");
    expect(html).toContain("Copy/Paste Commands");
    expect(html).toContain("10-Minute Recovery Steps");
    expect(html).toContain("&lt;script&gt;alert(&#39;deploy&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('deploy')</script>");
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
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("acceptance.matrix:tag:acceptance-matrix-lock");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("judge.snapshot:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("mvp.snapshot:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("autonomy.snapshot:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("observability.oracle:tag:observability-oracle-lock");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("recording.script:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("pilot.value.snapshot:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("competitive.snapshot:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("winner.packet:tag:get-proof");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("winner.sufficiency:tag:winner-sufficiency-lock");
    expect(plan.checks.find((check) => check.id === "agent-card-signals")?.evidence).toContain("win.autopilot:tag:win-autopilot-lock");
    expect(plan.commands.find((command) => command.id === "verify-agent-card-signals")).toMatchObject({
      blocking: true,
      copyGroup: "verify"
    });
    expect(plan.commands.find((command) => command.id === "verify-agent-card-signals")?.command).toContain('or .id=="winner.sufficiency"');
    expect(plan.commands.find((command) => command.id === "verify-agent-card-signals")?.command).toContain('or .id=="win.autopilot"');
    expect(plan.commands.find((command) => command.id === "verify-agent-card-signals")?.command).toContain('or .id=="observability.oracle"');
    expect(plan.commands.find((command) => command.id === "verify-agent-card-signals")?.command).toContain('or .id=="acceptance.matrix"');
    expect(plan.commands.find((command) => command.id === "verify-agent-card-signals")?.command).toContain('or .id=="autonomy.snapshot"');
    expect(plan.commands.find((command) => command.id === "verify-agent-card-signals")?.command).toContain('or .id=="recording.script"');
    expect(plan.commands.find((command) => command.id === "verify-agent-card-signals")?.command).toContain('or .id=="prize.strategy"');
    expect(plan.commands.find((command) => command.id === "verify-agent-card-signals")?.command).toContain('or .id=="submission.publish"');
    expect(plan.commands.find((command) => command.id === "verify-agent-card-signals")?.command).toContain('or .id=="submission.dossier"');
    expect(plan.commands.find((command) => command.id === "github-actions-deploy")?.command).toContain("deploy-cloud-run.yml");
    expect(plan.commands.find((command) => command.id === "verify-mvp-readiness")?.command).toContain("/api/mvp-readiness");
    expect(plan.commands.find((command) => command.id === "verify-autonomy-snapshot")?.why).toContain("Autonomy Snapshot");
    expect(plan.commands.find((command) => command.id === "verify-recording-script")?.why).toContain("Recording Script");
    expect(plan.commands.find((command) => command.id === "verify-pilot-value")?.why).toContain("Pilot Value");
    expect(plan.steps.find((step) => step.id === "skill-surface")?.status).toBe("blocked");
    expect(plan.blockers.map((blocker) => blocker.id)).toEqual(expect.arrayContaining(["agent-card-signals", "agent-card-skill-surface"]));
    expect(plan.judgeScript.join("\n")).toContain("competitive.battlecard:tag:criteria-duel");
    expect(plan.judgeScript.join("\n")).toContain("acceptance.matrix:tag:acceptance-matrix-lock");
    expect(plan.judgeScript.join("\n")).toContain("competitive.snapshot:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("judge.snapshot:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("mvp.snapshot:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("autonomy.snapshot:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("/api/autonomy-snapshot");
    expect(plan.judgeScript.join("\n")).toContain("external.evidence:tag:external-evidence-lock");
    expect(plan.judgeScript.join("\n")).toContain("observability.oracle:tag:observability-oracle-lock");
    expect(plan.judgeScript.join("\n")).toContain("judge.command:tag:judge-command-lock");
    expect(plan.judgeScript.join("\n")).toContain("/observability-oracle");
    expect(plan.judgeScript.join("\n")).toContain("recording.script:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("pilot.value.snapshot:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("prize.strategy:tag:prize-strategy-lock");
    expect(plan.judgeScript.join("\n")).toContain("submission.publish:tag:submission-publish-lock");
    expect(plan.judgeScript.join("\n")).toContain("submission.dossier:tag:submission-dossier-lock");
    expect(plan.judgeScript.join("\n")).toContain("winner.packet:tag:get-proof");
    expect(plan.judgeScript.join("\n")).toContain("winner.sufficiency:tag:winner-sufficiency-lock");
    expect(plan.judgeScript.join("\n")).toContain("win.autopilot:tag:win-autopilot-lock");
    expect(plan.judgeScript.join("\n")).toContain("/win-autopilot");
    expect(plan.judgeScript.join("\n")).toContain("/winner-sufficiency");
    expect(plan.judgeScript.join("\n")).toContain("/api/recording-script");
    expect(plan.judgeScript.join("\n")).toContain("/prize-strategy");
    expect(plan.judgeScript.join("\n")).toContain("/publisher");
    expect(plan.judgeScript.join("\n")).toContain("/dossier");
    expect(plan.judgeScript.join("\n")).toContain("/api/pilot-value");
    expect(plan.a2aPayload).toMatchObject({
      skill: "deploy.recover",
      releaseDrift: {
        missingAgentCardSignals: [
          "acceptance.matrix:tag:acceptance-matrix-lock",
          "autonomy.snapshot:tag:get-proof",
          "competitive.battlecard:tag:criteria-duel",
          "competitive.snapshot:tag:get-proof",
          "external.evidence:tag:external-evidence-lock",
          "judge.command:tag:judge-command-lock",
          "judge.snapshot:tag:get-proof",
          "mvp.snapshot:tag:get-proof",
          "observability.oracle:tag:observability-oracle-lock",
          "pilot.value.snapshot:tag:get-proof",
          "prize.strategy:tag:prize-strategy-lock",
          "recording.script:tag:get-proof",
          "submission.dossier:tag:submission-dossier-lock",
          "submission.publish:tag:submission-publish-lock",
          "win.autopilot:tag:win-autopilot-lock",
          "winner.packet:tag:get-proof",
          "winner.sufficiency:tag:winner-sufficiency-lock"
        ]
      }
    });
  });
});
