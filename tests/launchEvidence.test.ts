import { describe, expect, test } from "vitest";
import { buildExternalEvidenceRun, type ExternalEvidenceProbe } from "../src/externalEvidence";
import { buildLaunchEvidenceDecision, renderLaunchEvidenceHtml, type LaunchEvidenceProofVerificationSummary } from "../src/launchEvidence";
import { buildLiveEvidenceRun, type LiveEvidenceProbe } from "../src/liveEvidence";
import { buildReleaseDriftGuard, type ReleaseDriftProbe } from "../src/releaseDrift";

const liveProbe = (id: string, status: LiveEvidenceProbe["status"] = "passed"): LiveEvidenceProbe => ({
  id,
  label: id,
  status,
  score: status === "passed" ? 100 : status === "watch" ? 72 : 30,
  url: `https://example.com/${id}`,
  evidence: `${id} ${status}`,
  required: true
});

const externalProbe = (id: ExternalEvidenceProbe["id"], status: ExternalEvidenceProbe["status"] = "passed"): ExternalEvidenceProbe => ({
  id,
  label: id,
  status,
  score: status === "passed" ? 100 : status === "watch" ? 72 : 30,
  url: status === "missing" ? "" : `https://example.com/${id}`,
  evidence: `${id} ${status}`,
  required: true
});

const releaseProbe = (id: string, status: ReleaseDriftProbe["status"] = "passed"): ReleaseDriftProbe => ({
  id,
  label: id,
  status,
  score: status === "passed" ? 100 : status === "watch" ? 70 : 24,
  url: `https://example.com/${id}`,
  evidence: `${id} ${status}`,
  required: true
});

const acceptedTrialEvidence = [
  {
    id: "trial-proof-trial-custom-agent-card-auditor",
    receiptId: "trial-custom-agent-card-auditor",
    agentId: "custom-agent-card-auditor",
    agentName: "Agent Card Auditor",
    skillId: "agent-card.audit",
    status: "accepted" as const,
    score: 100,
    artifactUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/agent-card-audit/receipt.json",
    evidenceSource: "Cloud Run public logs and signed A2A receipt",
    headline: "Trial evidence satisfies the generated A2A receipt",
    summary: "Agent Card Auditor returned an accepted A2A proof receipt.",
    attachedAt: "2026-06-18T00:00:00.000Z"
  }
];

const proofArtifacts = [
  { id: "targetUrl", label: "Deployed URL", value: "https://launch.example/app", href: "#launch-evidence-console" },
  { id: "protopediaUrl", label: "ProtoPedia URL", value: "https://protopedia.net/prototype/launch", href: "#launch-evidence-console" },
  { id: "videoUrl", label: "Walkthrough video", value: "https://youtu.be/launch", href: "#launch-evidence-console" },
  { id: "pilotEvidenceUrl", label: "Pilot receipt", value: "https://launch.example/pilot-receipt", href: "#pilot-run-receipt" },
  { id: "workOrderEvidenceUrl", label: "Work order proof", value: "https://github.com/buddypia/launch/issues/42", href: "#buyer-work-order-studio" }
];

function proofVerification(statuses: Array<"pass" | "watch" | "block"> = ["pass", "pass", "pass", "pass", "pass"]): LaunchEvidenceProofVerificationSummary {
  const results = proofArtifacts.map((artifact, index) => {
    const status = statuses[index] ?? "pass";
    return {
      id: artifact.id,
      label: artifact.label,
      url: artifact.value,
      status,
      httpStatus: status === "block" ? 403 : 200,
      evidence: status === "pass" ? `${artifact.label} opened publicly.` : `${artifact.label} is not publicly readable.`,
      action: status === "pass" ? `Keep ${artifact.label} attached.` : `Repair ${artifact.label} before external review.`
    };
  });
  const verifiedCount = results.filter((result) => result.status === "pass").length;
  const watchCount = results.filter((result) => result.status === "watch").length;
  return {
    checkedAt: "2026-06-18T00:00:00.000Z",
    verifiedCount,
    totalCount: results.length,
    score: Math.round((verifiedCount / results.length) * 100 + watchCount * 8),
    results
  };
}

function liveRun(status: LiveEvidenceProbe["status"] = "passed") {
  return buildLiveEvidenceRun({
    baseUrl: "https://example.com",
    generatedAt: "2026-06-18T00:00:00.000Z",
    probes: ["health", "agent-card", "squad-optimizer", "a2a", "ci"].map((id) => liveProbe(id, status))
  });
}

function externalRun(status: ExternalEvidenceProbe["status"] = "passed") {
  return buildExternalEvidenceRun({
    baseUrl: "https://example.com",
    generatedAt: "2026-06-18T00:00:00.000Z",
    probes: [
      externalProbe("github-url"),
      externalProbe("deployed-url"),
      externalProbe("protopedia-url", status),
      externalProbe("video-url", status)
    ]
  });
}

function releaseRun(kind: "current" | "drift" | "blocked" = "current") {
  const requiredSkillIds = ["task.delegate", "release.drift"];
  const observedSkillIds = kind === "drift" ? ["task.delegate"] : requiredSkillIds;
  return buildReleaseDriftGuard({
    currentBaseUrl: "https://current.example.com",
    targetBaseUrl: "https://target.example.com",
    expectedSkillIds: requiredSkillIds,
    observedSkillIds,
    requiredSkillIds,
    requiredAgentCardSignals: ["release.drift:tag:get-proof"],
    observedAgentCardSignals: kind === "drift" ? [] : ["release.drift:tag:get-proof"],
    generatedAt: "2026-06-18T00:00:00.000Z",
    probes: [
      releaseProbe("target-health", kind === "blocked" ? "missing" : "passed"),
      releaseProbe("agent-card-skill-surface", kind === "drift" ? "watch" : "passed"),
      releaseProbe("ci-main")
    ]
  });
}

describe("launch evidence decision", () => {
  test("marks launch-ready only when live and external evidence are both ready", () => {
    const decision = buildLaunchEvidenceDecision({
      generatedAt: "2026-06-18T00:00:00.000Z",
      liveEvidence: liveRun(),
      externalEvidence: externalRun(),
      releaseDrift: releaseRun(),
      agentTrialEvidence: acceptedTrialEvidence
    });

    expect(decision.readiness).toBe("launch-ready");
    expect(decision.evidenceScore).toBe(100);
    expect(decision.openGaps).toBe(0);
    expect(decision.nextActions).toHaveLength(0);
    expect(decision.exportMarkdown).toContain("Launch evidence is ready to show");
    expect(decision.exportMarkdown).toContain("Release drift: release-current");
    expect(decision.exportMarkdown).toContain("A2A trial proof: ready");
  });

  test("keeps green URL evidence in proof-watch when accepted A2A trial proof is missing", () => {
    const decision = buildLaunchEvidenceDecision({
      generatedAt: "2026-06-18T00:00:00.000Z",
      liveEvidence: liveRun(),
      externalEvidence: externalRun(),
      releaseDrift: releaseRun()
    });

    expect(decision.readiness).toBe("proof-watch");
    expect(decision.openGaps).toBe(1);
    expect(decision.nextActions[0]).toMatchObject({
      id: "trial-attach-a2a-proof",
      lane: "trial"
    });
  });

  test("keeps final URL gaps in proof-watch instead of calling the launch ready", () => {
    const decision = buildLaunchEvidenceDecision({
      liveEvidence: liveRun(),
      externalEvidence: externalRun("missing"),
      agentTrialEvidence: acceptedTrialEvidence
    });

    expect(decision.readiness).toBe("proof-watch");
    expect(decision.openGaps).toBe(2);
    expect(decision.nextActions.map((action) => action.id)).toEqual(["external-protopedia-url", "external-video-url"]);
    expect(decision.hardTruth).toContain("2 proof gaps remain");
  });

  test("blocks when a required live proof is missing", () => {
    const decision = buildLaunchEvidenceDecision({
      liveEvidence: liveRun("missing"),
      externalEvidence: externalRun(),
      agentTrialEvidence: acceptedTrialEvidence
    });

    expect(decision.readiness).toBe("blocked");
    expect(decision.evidenceScore).toBeLessThan(70);
    expect(decision.nextActions[0]?.lane).toBe("live");
    expect(decision.hardTruth).toContain("Do not call this production-ready yet");
  });

  test("downgrades the launch when the deployed target is stale", () => {
    const decision = buildLaunchEvidenceDecision({
      liveEvidence: liveRun(),
      externalEvidence: externalRun(),
      releaseDrift: releaseRun("drift"),
      agentTrialEvidence: acceptedTrialEvidence
    });

    expect(decision.readiness).toBe("proof-watch");
    expect(decision.lanes.map((lane) => lane.id)).toContain("release");
    expect(decision.nextActions.some((action) => action.lane === "release")).toBe(true);
  });

  test("blocks the launch when release drift detects a missing target health proof", () => {
    const decision = buildLaunchEvidenceDecision({
      liveEvidence: liveRun(),
      externalEvidence: externalRun(),
      releaseDrift: releaseRun("blocked"),
      agentTrialEvidence: acceptedTrialEvidence
    });

    expect(decision.readiness).toBe("blocked");
    expect(decision.nextActions[0]?.lane).toBe("release");
  });

  test("includes buyer proof artifacts in launch readiness and public exports", () => {
    const decision = buildLaunchEvidenceDecision({
      generatedAt: "2026-06-18T00:00:00.000Z",
      liveEvidence: liveRun(),
      externalEvidence: externalRun(),
      releaseDrift: releaseRun(),
      proofArtifacts,
      proofVerification: proofVerification(["pass", "pass", "pass", "pass", "block"]),
      agentTrialEvidence: acceptedTrialEvidence
    });

    expect(decision.readiness).toBe("blocked");
    expect(decision.proofArtifacts).toHaveLength(5);
    expect(decision.proofVerification?.totalCount).toBe(5);
    expect(decision.lanes.map((lane) => lane.id)).toContain("proof");
    expect(decision.nextActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "proof-workOrderEvidenceUrl",
          lane: "proof",
          label: "Work order proof",
          priority: "now"
        })
      ])
    );
    expect(decision.exportMarkdown).toContain("## Buyer proof artifacts");
    expect(decision.exportMarkdown).toContain("[block 403] Work order proof");

    const html = renderLaunchEvidenceHtml(decision);
    expect(html).toContain("Buyer proof artifacts");
    expect(html).toContain("Work order proof");
    expect(html).toContain("block / HTTP 403");
    expect(html).toContain("Repair Work order proof before external review.");
    expect(html).toContain("https://github.com/buddypia/launch/issues/42");
  });

  test("renders a shareable escaped public evidence report", () => {
    const decision = buildLaunchEvidenceDecision({
      generatedAt: "2026-06-18T00:00:00.000Z",
      liveEvidence: liveRun(),
      externalEvidence: externalRun(),
      releaseDrift: releaseRun(),
      agentTrialEvidence: acceptedTrialEvidence
    });
    const html = renderLaunchEvidenceHtml(
      {
        ...decision,
        headline: 'Launch <script>alert("headline")</script>',
        hardTruth: 'Proof <script>alert("truth")</script>'
      },
      {
        appUrl: "https://launch.example/?workspace=share",
        launchRoomUrl: "https://launch.example/launch-room?workspace=share",
        globalAuditUrl: "https://launch.example/global-launch-audit?workspace=share",
        jsonUrl: "https://launch.example/api/launch-evidence?workspace=share",
        markdownUrl: "https://launch.example/launch-evidence.md?workspace=share"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Launch Evidence Report");
    expect(html).toContain("https://launch.example/launch-room?workspace=share");
    expect(html).toContain("https://launch.example/global-launch-audit?workspace=share");
    expect(html).toContain("https://launch.example/api/launch-evidence?workspace=share");
    expect(html).toContain("Evidence lanes");
    expect(html).toContain("&lt;script&gt;alert(&quot;headline&quot;)&lt;/script&gt;");
    expect(html).toContain("Proof &lt;script&gt;alert(&quot;truth&quot;)&lt;/script&gt;");
    expect(html).not.toContain('<script>alert("headline")</script>');
    expect(html).not.toContain('<script>alert("truth")</script>');
  });
});
