import { describe, expect, test } from "vitest";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine";
import { buildCompetitiveBattlecard } from "../src/competitiveBattlecard";
import { buildJudgeSnapshot, renderJudgeSnapshotHtml } from "../src/judgeSnapshot";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildMarketIntelReport } from "../src/marketIntel";
import { buildMissionRun } from "../src/mission";
import { buildMoatStressTest } from "../src/moatStress";
import { buildOpsDrill } from "../src/ops";
import { buildJudgeProof, type CiProof } from "../src/proof";
import { buildReleaseDriftGuard, type ReleaseDriftProbe } from "../src/releaseDrift";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildWinningStrategy } from "../src/strategy";

const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
const baseUrl = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";

const ci: CiProof = {
  status: "passed",
  conclusion: "success",
  url: `${SUBMISSION_PROOF.ciWorkflowUrl}/runs/123`,
  workflowUrl: SUBMISSION_PROOF.ciWorkflowUrl,
  branch: "main",
  checkedAt: "2026-06-18T00:00:00.000Z",
  evidence: "Latest main CI passed.",
  runId: 123
};

const passedProbe = (id: string): ReleaseDriftProbe => ({
  id,
  label: id,
  status: "passed",
  score: 100,
  url: `${baseUrl}/${id}`,
  evidence: `${id} passed`,
  required: true
});

function buildArtifacts() {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds, 140);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy);
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: localGeminiRecommendation(recommendation, "snapshot test"),
    ci
  });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  return { proof, battlecard };
}

describe("judge snapshot", () => {
  test("turns POST proof surfaces into a direct-open judge snapshot", () => {
    const { proof, battlecard } = buildArtifacts();
    const snapshot = buildJudgeSnapshot({
      baseUrl,
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds,
      proof,
      battlecard,
      agentCardSkillIds: ["competitive.battlecard", "competitive.snapshot", "judge.snapshot", "release.drift"],
      generatedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(snapshot.directOpen).toBe(true);
    expect(snapshot.readiness).toBe("first-click-ready");
    expect(snapshot.links.find((link) => link.id === "judge-snapshot")).toMatchObject({
      method: "GET",
      url: `${baseUrl}/judge-snapshot`
    });
    expect(snapshot.links.find((link) => link.id === "judge-snapshot-json")).toMatchObject({
      method: "GET",
      url: `${baseUrl}/api/judge-snapshot`
    });
    expect(snapshot.links.map((link) => link.url)).toEqual(
      expect.arrayContaining([
        `${baseUrl}/competitive-swot`,
        `${baseUrl}/autonomy-snapshot`,
        `${baseUrl}/mvp-readiness`,
        `${baseUrl}/pilot-value`,
        `${baseUrl}/recording-script`,
        `${baseUrl}/submission-assets`,
        `${baseUrl}/winner-packet`
      ])
    );
    expect(snapshot.criteriaDuel.rows).toHaveLength(5);
    expect(snapshot.criteriaDuel.rows.map((row) => row.id)).toEqual(["agentCentrality", "approach", "usability", "practicality", "implementation"]);
    expect(snapshot.postApis.map((api) => `${api.method}:${api.url}`)).toEqual(
      expect.arrayContaining([
        `POST:${baseUrl}/api/competitive-battlecard`,
        `POST:${baseUrl}/api/demo-concierge`,
        `POST:${baseUrl}/api/pilot-economics`,
        `POST:${baseUrl}/api/release-drift`
      ])
    );
    expect(snapshot.postApis.find((api) => api.id === "judge-proof")?.curl).toContain("--data");
    expect(snapshot.summary).toMatchObject({
      ciStatus: "passed",
      releaseVerdict: "not-run",
      agentCardSkillCount: 4
    });
    expect(snapshot.a2aPayload).toMatchObject({
      skill: "judge.snapshot",
      directOpen: true,
      endpoints: {
        judgeSnapshot: `${baseUrl}/judge-snapshot`,
        judgeSnapshotJson: `${baseUrl}/api/judge-snapshot`,
        competitiveSwotSnapshot: `${baseUrl}/competitive-swot`,
        competitiveSwotSnapshotJson: `${baseUrl}/api/competitive-swot`,
        autonomySnapshot: `${baseUrl}/autonomy-snapshot`,
        autonomySnapshotJson: `${baseUrl}/api/autonomy-snapshot`,
        mvpReadiness: `${baseUrl}/mvp-readiness`,
        mvpReadinessJson: `${baseUrl}/api/mvp-readiness`,
        pilotValue: `${baseUrl}/pilot-value`,
        pilotValueJson: `${baseUrl}/api/pilot-value`,
        recordingScript: `${baseUrl}/recording-script`,
        recordingScriptJson: `${baseUrl}/api/recording-script`,
        submissionAssetsPage: `${baseUrl}/submission-assets`,
        winnerPacketPage: `${baseUrl}/winner-packet`,
        competitiveBattlecard: `${baseUrl}/api/competitive-battlecard`
      }
    });
  });

  test("renders a human-readable HTML page without leaking raw HTML from evidence", () => {
    const { proof, battlecard } = buildArtifacts();
    const snapshot = buildJudgeSnapshot({
      baseUrl,
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds,
      proof,
      battlecard,
      agentCardSkillIds: ["competitive.battlecard", "competitive.snapshot", "judge.snapshot", "release.drift"],
      generatedAt: "2026-06-18T00:00:00.000Z"
    });
    snapshot.proofItems[0].evidence = "<script>alert('proof')</script>";

    const html = renderJudgeSnapshotHtml(snapshot);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Public Judge Snapshot");
    expect(html).toContain(`${baseUrl}/judge-snapshot`);
    expect(html).toContain(`${baseUrl}/autonomy-snapshot`);
    expect(html).toContain(`${baseUrl}/pilot-value`);
    expect(html).toContain("Recording Script");
    expect(html).toContain("Winner Proof Packet");
    expect(html).toContain(`${baseUrl}/winner-packet`);
    expect(html).toContain("&lt;script&gt;alert(&#39;proof&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('proof')</script>");
  });

  test("keeps POST-only proof endpoints as internal anchors in the HTML page", () => {
    const { proof, battlecard } = buildArtifacts();
    const snapshot = buildJudgeSnapshot({
      baseUrl,
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds,
      proof,
      battlecard,
      agentCardSkillIds: ["competitive.battlecard", "competitive.snapshot", "judge.snapshot", "release.drift"],
      generatedAt: "2026-06-18T00:00:00.000Z"
    });

    const html = renderJudgeSnapshotHtml(snapshot);

    expect(html).toContain('href="#deep-proof-competitive-battlecard"');
    expect(html).toContain('href="#deep-proof-demo-concierge"');
    expect(html).toContain('href="#deep-proof-pilot-economics"');
    expect(html).toContain('href="#deep-proof-release-drift"');
    expect(html).not.toContain(`href="${baseUrl}/api/competitive-battlecard"`);
    expect(html).not.toContain(`href="${baseUrl}/api/demo-concierge"`);
    expect(html).not.toContain(`href="${baseUrl}/api/pilot-economics"`);
    expect(html).not.toContain(`href="${baseUrl}/api/release-drift"`);
    expect(html).toContain(`${baseUrl}/api/competitive-battlecard`);
    expect(html).toContain("POST proof: use curl below");
  });

  test("surfaces release drift when the public Agent Card lacks the GET proof signal", () => {
    const { proof, battlecard } = buildArtifacts();
    const releaseDrift = buildReleaseDriftGuard({
      currentBaseUrl: baseUrl,
      targetBaseUrl: SUBMISSION_PROOF.deployedUrl,
      expectedSkillIds: ["competitive.battlecard", "competitive.snapshot", "judge.snapshot", "release.drift"],
      observedSkillIds: ["competitive.battlecard", "competitive.snapshot", "judge.snapshot", "release.drift"],
      requiredSkillIds: ["competitive.battlecard", "competitive.snapshot", "judge.snapshot", "release.drift"],
      requiredAgentCardSignals: ["competitive.battlecard:tag:criteria-duel", "competitive.snapshot:tag:get-proof", "judge.snapshot:tag:get-proof"],
      observedAgentCardSignals: ["competitive.battlecard:tag:criteria-duel"],
      probes: [
        passedProbe("target-health"),
        {
          ...passedProbe("agent-card-skill-surface"),
          status: "watch",
          score: 58,
          evidence: "Agent Card misses judge.snapshot:tag:get-proof."
        },
        passedProbe("acceptance-endpoint"),
        passedProbe("a2a-artifact"),
        passedProbe("ci-main")
      ],
      generatedAt: "2026-06-18T00:00:00.000Z"
    });

    const snapshot = buildJudgeSnapshot({
      baseUrl,
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds,
      proof,
      battlecard,
      agentCardSkillIds: ["competitive.battlecard", "competitive.snapshot", "judge.snapshot", "release.drift"],
      releaseDrift,
      generatedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(snapshot.readiness).toBe("first-click-watch");
    expect(snapshot.summary).toMatchObject({
      releaseVerdict: "deploy-drift",
      missingReleaseSignals: 2
    });
    expect(snapshot.releaseLock.missingAgentCardSignals).toEqual(["competitive.snapshot:tag:get-proof", "judge.snapshot:tag:get-proof"]);
    expect(snapshot.judgeScript.join("\n")).toContain("Release Drift verdict: deploy-drift");
  });
});
