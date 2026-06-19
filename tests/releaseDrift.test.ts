import { describe, expect, test } from "vitest";
import { buildReleaseDriftGuard, type ReleaseDriftProbe } from "../src/releaseDrift";
import { SUBMISSION_PROOF } from "../src/submission";

const expectedSkillIds = [
  "market.discover",
  "agent.hire",
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
  "judge.objection-arena",
  "submission.launch",
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
  "judge.first-click",
  "judge.first-click-smoke",
  "win.autopilot"
];

const requiredAgentCardSignals = [
  "judge.rehearsal:tag:recording-lock",
  "win.gap.radar:tag:feature-freeze-lock",
  "winner.packet:tag:winner-release-lock",
  "winner.packet:tag:get-proof",
  "winner.sufficiency:tag:winner-sufficiency-lock",
  "win.autopilot:tag:win-autopilot-lock",
  "judge.objection-arena:tag:objection-lock",
  "finalist.simulate:tag:release-drift",
  "competitive.battlecard:tag:criteria-duel",
  "competitive.battlecard:tag:win-loss-lock",
  "competitive.snapshot:tag:get-proof",
  "judge.snapshot:tag:get-proof",
  "judge.first-click:tag:first-click-route-lock",
  "judge.first-click-smoke:tag:first-click-smoke-lock",
  "mvp.snapshot:tag:get-proof",
  "autonomy.snapshot:tag:get-proof",
  "external.evidence:tag:external-evidence-lock",
  "observability.oracle:tag:observability-oracle-lock",
  "recording.script:tag:get-proof",
  "submission.launch:tag:get-proof",
  "submission.package:tag:get-proof",
  "pilot.value.snapshot:tag:get-proof",
  "deploy.recover:tag:get-proof"
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

describe("release drift guard", () => {
  test("detects a stale Cloud Run revision even when health and CI still pass", () => {
    const guard = buildReleaseDriftGuard({
      currentBaseUrl: "http://127.0.0.1:8090",
      targetBaseUrl: SUBMISSION_PROOF.deployedUrl,
      expectedSkillIds,
      observedSkillIds: ["market.discover", "agent.hire", "task.delegate",
  "external.evidence",
  "evidence.monitor", "win.autopilot"],
      requiredSkillIds: ["task.delegate",
  "external.evidence",
  "evidence.monitor", "observability.oracle", "demo.receipt", "acceptance.matrix", "release.drift", "mvp.snapshot", "autonomy.snapshot", "pilot.economics", "pilot.value.snapshot", "demo.concierge", "judge.command", "judge.rehearsal", "winner.packet", "winner.sufficiency", "judge.objection-arena", "submission.launch", "submission.runway", "submission.assets", "recording.script", "prize.strategy", "win.gap.radar", "submission.closeout", "deploy.recover", "competitive.battlecard", "competitive.snapshot", "judge.snapshot", "judge.first-click", "judge.first-click-smoke", "win.autopilot"],
      generatedAt: "2026-06-18T00:00:00.000Z",
      probes: [
        passedProbe("target-health"),
        {
          ...passedProbe("agent-card-skill-surface"),
          status: "watch",
          score: 62,
          evidence: "Agent Card exposes 29 skills; expected current release skills."
        },
        {
          ...passedProbe("acceptance-endpoint"),
          status: "missing",
          score: 24,
          evidence: "Acceptance Matrix endpoint returned HTML instead of JSON."
        },
        {
          ...passedProbe("a2a-artifact"),
          status: "watch",
          score: 66,
          evidence: "A2A artifact lacks releaseDriftEndpoint and acceptanceMatrixEndpoint."
        },
        passedProbe("ci-main")
      ]
    });

    expect(guard.verdict).toBe("deploy-drift");
    expect(guard.missingSkills).toEqual(
      expect.arrayContaining(["demo.receipt", "acceptance.matrix", "release.drift", "mvp.snapshot", "autonomy.snapshot", "pilot.economics", "pilot.value.snapshot", "demo.concierge", "judge.command", "judge.rehearsal", "winner.packet", "winner.sufficiency", "judge.objection-arena", "submission.launch", "submission.runway", "submission.assets", "recording.script", "prize.strategy", "win.gap.radar", "submission.closeout", "deploy.recover", "competitive.battlecard", "competitive.snapshot", "judge.snapshot", "judge.first-click", "judge.first-click-smoke"])
    );
    expect(guard.missingAgentCardSignals).toEqual([]);
    expect(guard.nextActions.map((action) => action.id)).toEqual(expect.arrayContaining(["agent-card-skill-surface", "acceptance-endpoint"]));
    expect(guard.runbook.join("\n")).toContain("DRY_RUN=1");
    expect(guard.runbook.join("\n")).toContain("./scripts/bootstrap_github_actions_deploy.sh");
    expect(guard.runbook.join("\n")).toContain("gh workflow run deploy-cloud-run.yml");
    expect(guard.runbook.join("\n")).toContain("gcloud builds submit");
    expect(guard.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "release.drift",
      verdict: "deploy-drift"
    });
  });

  test("accepts the release only when the target exposes the current skill surface", () => {
    const guard = buildReleaseDriftGuard({
      currentBaseUrl: SUBMISSION_PROOF.deployedUrl,
      targetBaseUrl: SUBMISSION_PROOF.deployedUrl,
      expectedSkillIds,
      observedSkillIds: expectedSkillIds,
      requiredSkillIds: ["task.delegate",
  "external.evidence",
  "evidence.monitor", "observability.oracle", "demo.receipt", "acceptance.matrix", "release.drift", "mvp.snapshot", "autonomy.snapshot", "pilot.economics", "pilot.value.snapshot", "demo.concierge", "judge.command", "judge.rehearsal", "winner.packet", "winner.sufficiency", "judge.objection-arena", "submission.launch", "submission.runway", "submission.assets", "recording.script", "prize.strategy", "win.gap.radar", "submission.closeout", "deploy.recover", "competitive.battlecard", "competitive.snapshot", "judge.first-click", "judge.first-click-smoke", "judge.snapshot", "win.autopilot"],
      requiredAgentCardSignals,
      observedAgentCardSignals: requiredAgentCardSignals,
      probes: [
        passedProbe("target-health"),
        passedProbe("agent-card-skill-surface"),
        passedProbe("acceptance-endpoint"),
        passedProbe("a2a-artifact"),
        passedProbe("ci-main")
      ]
    });

    expect(guard.verdict).toBe("release-current");
    expect(guard.driftScore).toBe(100);
    expect(guard.missingAgentCardSignals).toEqual([]);
    expect(guard.nextActions).toHaveLength(0);
  });

  test("flags deploy drift when required Agent Card signal tags are missing", () => {
    const guard = buildReleaseDriftGuard({
      currentBaseUrl: "http://127.0.0.1:8090",
      targetBaseUrl: SUBMISSION_PROOF.deployedUrl,
      expectedSkillIds,
      observedSkillIds: expectedSkillIds,
      requiredSkillIds: ["task.delegate",
  "external.evidence",
  "evidence.monitor", "observability.oracle", "demo.receipt", "acceptance.matrix", "release.drift", "mvp.snapshot", "autonomy.snapshot", "pilot.economics", "pilot.value.snapshot", "demo.concierge", "judge.command", "judge.rehearsal", "winner.packet", "winner.sufficiency", "judge.objection-arena", "submission.launch", "submission.runway", "submission.assets", "recording.script", "prize.strategy", "win.gap.radar", "submission.closeout", "deploy.recover", "competitive.battlecard", "competitive.snapshot", "judge.snapshot", "judge.first-click", "judge.first-click-smoke", "win.autopilot"],
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
          evidence: "Target Agent Card exposes all skill ids but is missing autonomy.snapshot:tag:get-proof, competitive.battlecard:tag:criteria-duel, competitive.battlecard:tag:win-loss-lock, competitive.snapshot:tag:get-proof, deploy.recover:tag:get-proof, judge.first-click-smoke:tag:first-click-smoke-lock, judge.first-click:tag:first-click-route-lock, judge.objection-arena:tag:objection-lock, judge.snapshot:tag:get-proof, mvp.snapshot:tag:get-proof, observability.oracle:tag:observability-oracle-lock, recording.script:tag:get-proof, submission.launch:tag:get-proof, submission.package:tag:get-proof, win.autopilot:tag:win-autopilot-lock, winner.sufficiency:tag:winner-sufficiency-lock, and pilot.value.snapshot:tag:get-proof."
        },
        passedProbe("acceptance-endpoint"),
        passedProbe("a2a-artifact"),
        passedProbe("ci-main")
      ]
    });

    expect(guard.verdict).toBe("deploy-drift");
    expect(guard.missingSkills).toEqual([]);
    expect(guard.missingAgentCardSignals).toEqual([
      "autonomy.snapshot:tag:get-proof",
      "competitive.battlecard:tag:criteria-duel",
      "competitive.battlecard:tag:win-loss-lock",
      "competitive.snapshot:tag:get-proof",
      "deploy.recover:tag:get-proof",
      "external.evidence:tag:external-evidence-lock",
      "judge.first-click-smoke:tag:first-click-smoke-lock",
      "judge.first-click:tag:first-click-route-lock",
      "judge.objection-arena:tag:objection-lock",
      "judge.snapshot:tag:get-proof",
      "mvp.snapshot:tag:get-proof",
      "observability.oracle:tag:observability-oracle-lock",
      "pilot.value.snapshot:tag:get-proof",
      "recording.script:tag:get-proof",
      "submission.launch:tag:get-proof",
      "submission.package:tag:get-proof",
      "win.autopilot:tag:win-autopilot-lock",
      "winner.packet:tag:get-proof",
      "winner.sufficiency:tag:winner-sufficiency-lock"
    ]);
    expect(guard.summary).toContain("0 required skills and 19 required Agent Card signals");
    expect(guard.runbook.join("\n")).toContain('or .id=="autonomy.snapshot" or .id=="external.evidence" or .id=="recording.script"');
    expect(guard.runbook.join("\n")).toContain('or .id=="win.autopilot"');
    expect(guard.runbook.join("\n")).toContain('or .id=="winner.sufficiency"');
    expect(guard.runbook.join("\n")).toContain('or .id=="deploy.recover"');
    expect(guard.runbook.join("\n")).toContain("/win-autopilot");
    expect(guard.runbook.join("\n")).toContain("/winner-sufficiency");
    expect(guard.runbook.join("\n")).toContain("/api/mvp-readiness");
    expect(guard.runbook.join("\n")).toContain("/api/autonomy-snapshot");
    expect(guard.runbook.join("\n")).toContain("/observability-oracle");
    expect(guard.runbook.join("\n")).toContain("/external-evidence");
    expect(guard.runbook.join("\n")).toContain("/api/recording-script");
    expect(guard.runbook.join("\n")).toContain("/api/submission-launch");
    expect(guard.runbook.join("\n")).toContain("/api/pilot-value");
    expect(guard.runbook.join("\n")).toContain("/deploy-recovery");
    expect(guard.a2aPayload).toMatchObject({
      skill: "release.drift",
      verdict: "deploy-drift",
      missingAgentCardSignals: [
        "autonomy.snapshot:tag:get-proof",
        "competitive.battlecard:tag:criteria-duel",
        "competitive.battlecard:tag:win-loss-lock",
        "competitive.snapshot:tag:get-proof",
        "deploy.recover:tag:get-proof",
        "external.evidence:tag:external-evidence-lock",
        "judge.first-click-smoke:tag:first-click-smoke-lock",
        "judge.first-click:tag:first-click-route-lock",
        "judge.objection-arena:tag:objection-lock",
        "judge.snapshot:tag:get-proof",
        "mvp.snapshot:tag:get-proof",
        "observability.oracle:tag:observability-oracle-lock",
        "pilot.value.snapshot:tag:get-proof",
        "recording.script:tag:get-proof",
        "submission.launch:tag:get-proof",
        "submission.package:tag:get-proof",
        "win.autopilot:tag:win-autopilot-lock",
        "winner.packet:tag:get-proof",
        "winner.sufficiency:tag:winner-sufficiency-lock"
      ]
    });
  });
});
