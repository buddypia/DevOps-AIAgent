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
  "pilot.economics",
  "demo.concierge",
  "judge.command",
  "judge.rehearsal",
  "winner.packet",
  "submission.runway",
  "prize.strategy",
  "win.gap.radar",
  "submission.closeout",
  "deploy.recover",
  "competitive.battlecard",
  "win.autopilot"
];

const requiredAgentCardSignals = [
  "judge.rehearsal:tag:recording-lock",
  "win.gap.radar:tag:feature-freeze-lock",
  "winner.packet:tag:winner-release-lock",
  "finalist.simulate:tag:release-drift"
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
  "evidence.monitor", "observability.oracle", "demo.receipt", "acceptance.matrix", "release.drift", "pilot.economics", "demo.concierge", "judge.command", "judge.rehearsal", "winner.packet", "submission.runway", "prize.strategy", "win.gap.radar", "submission.closeout", "deploy.recover", "competitive.battlecard"],
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
      expect.arrayContaining(["demo.receipt", "acceptance.matrix", "release.drift", "pilot.economics", "demo.concierge", "judge.command", "judge.rehearsal", "winner.packet", "submission.runway", "prize.strategy", "win.gap.radar", "submission.closeout", "deploy.recover", "competitive.battlecard"])
    );
    expect(guard.missingAgentCardSignals).toEqual([]);
    expect(guard.nextActions.map((action) => action.id)).toEqual(expect.arrayContaining(["agent-card-skill-surface", "acceptance-endpoint"]));
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
  "evidence.monitor", "observability.oracle", "demo.receipt", "acceptance.matrix", "release.drift", "pilot.economics", "demo.concierge", "judge.command", "judge.rehearsal", "winner.packet", "submission.runway", "prize.strategy", "win.gap.radar", "submission.closeout", "deploy.recover", "competitive.battlecard"],
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
  "evidence.monitor", "observability.oracle", "demo.receipt", "acceptance.matrix", "release.drift", "pilot.economics", "demo.concierge", "judge.command", "judge.rehearsal", "winner.packet", "submission.runway", "prize.strategy", "win.gap.radar", "submission.closeout", "deploy.recover", "competitive.battlecard"],
      requiredAgentCardSignals,
      observedAgentCardSignals: [
        "judge.rehearsal:tag:recording-lock",
        "win.gap.radar:tag:feature-freeze-lock",
        "finalist.simulate:tag:release-drift"
      ],
      generatedAt: "2026-06-18T00:00:00.000Z",
      probes: [
        passedProbe("target-health"),
        {
          ...passedProbe("agent-card-skill-surface"),
          status: "watch",
          score: 58,
          evidence: "Target Agent Card exposes all skill ids but is missing winner.packet:tag:winner-release-lock."
        },
        passedProbe("acceptance-endpoint"),
        passedProbe("a2a-artifact"),
        passedProbe("ci-main")
      ]
    });

    expect(guard.verdict).toBe("deploy-drift");
    expect(guard.missingSkills).toEqual([]);
    expect(guard.missingAgentCardSignals).toEqual(["winner.packet:tag:winner-release-lock"]);
    expect(guard.summary).toContain("0 required skills and 1 required Agent Card signals");
    expect(guard.runbook.join("\n")).toContain('select(.id=="judge.rehearsal" or .id=="win.gap.radar" or .id=="winner.packet" or .id=="finalist.simulate")');
    expect(guard.a2aPayload).toMatchObject({
      skill: "release.drift",
      verdict: "deploy-drift",
      missingAgentCardSignals: ["winner.packet:tag:winner-release-lock"]
    });
  });
});
