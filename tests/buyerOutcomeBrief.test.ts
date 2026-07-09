import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerOutcomeBrief, renderBuyerOutcomeBriefHtml } from "../src/buyerOutcomeBrief";
import { mergeAgentCatalog } from "../src/customAgent";
import { buildLaunchRoom } from "../src/launchRoom";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";
import { buildValueBlueprint } from "../src/valueBlueprint";
import { buildWorkspaceDraft, type WorkspaceDraft } from "../src/workspaceDraft";

const checkedAt = "2026-06-20T00:00:00.000Z";
const baseUrl = "https://sample.example";
const proofCheckedNow = new Date("2026-06-20T08:00:00.000Z");
const submissionProof = {
  protopediaUrl: "https://protopedia.net/prototype/release-ready",
  videoUrl: "https://youtu.be/releaseReady12345"
};

function completeProofVerification() {
  return {
    checkedAt,
    verifiedCount: 5,
    totalCount: 5,
    score: 100,
    results: [
      { id: "targetUrl", label: "Deployed URL", status: "pass" as const, httpStatus: 200, evidence: "Public deployed URL responded.", action: "Keep this URL attached." },
      { id: "protopediaUrl", label: "ProtoPedia URL", status: "pass" as const, httpStatus: 200, evidence: "Public ProtoPedia URL responded.", action: "Keep this URL attached." },
      { id: "videoUrl", label: "Demo video", status: "pass" as const, httpStatus: 200, evidence: "Public demo video responded.", action: "Keep this URL attached." },
      { id: "pilotEvidenceUrl", label: "Pilot receipt", status: "pass" as const, httpStatus: 200, evidence: "Public pilot receipt responded.", action: "Keep this URL attached." },
      { id: "workOrderEvidenceUrl", label: "Work order proof", status: "pass" as const, httpStatus: 200, evidence: "Public work order proof responded.", action: "Keep this URL attached." }
    ]
  };
}

function completeWorkspace(): WorkspaceDraft {
  const sample = buildProofBackedSampleWorkspaceDraft(checkedAt, baseUrl);
  return buildWorkspaceDraft({
    ...sample,
    selectedAgentIds: ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"],
    protopediaUrl: "https://protopedia.net/project/a2a-agent-marketplace",
    videoUrl: "https://youtu.be/a2a-agent-marketplace",
    proofVerification: completeProofVerification()
  });
}

function buildBrief(workspace: WorkspaceDraft) {
  const recommendation = recommendSquad(workspace.projectBrief, workspace.selectedAgentIds, 260, mergeAgentCatalog(workspace.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, workspace.projectBrief, baseUrl);
  const buyerScenario = buildBuyerValueScenario(recommendation, workspace.buyerScenario);
  const launchRoom = buildLaunchRoom({
    workspace,
    baseUrl,
    appUrl: `${baseUrl}/?workspace=share-token`,
    now: proofCheckedNow
  });
  return buildBuyerOutcomeBrief({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace,
    pilotRun: workspace.pilotRun,
    launchRoom,
    generatedAt: checkedAt
  });
}

describe("buyer outcome brief", () => {
  test("turns a complete workspace into a sendable buyer artifact", () => {
    const brief = buildBrief(completeWorkspace());

    expect(brief.decision).toBe("send-to-buyer");
    expect(brief.status).toBe("pass");
    expect(brief.briefScore).toBeGreaterThanOrEqual(82);
    expect(brief.redLines).toEqual([]);
    expect(brief.metrics.map((metric) => metric.id)).toEqual(["modeled-value", "measured-value", "live-proof", "buyer-decision"]);
    expect(brief.story.map((item) => item.id)).toEqual(["buyer-job", "agent-work", "measured-outcome", "buyer-decision"]);
    expect(brief.exportMarkdown).toContain("Buyer Outcome Brief");
    expect(brief.exportMarkdown).toContain("Decision: send-to-buyer");
  });

  test("turns the proof-backed sample workspace into a sendable buyer artifact", () => {
    const brief = buildBrief(buildProofBackedSampleWorkspaceDraft(checkedAt, baseUrl, submissionProof));

    expect(brief.decision).toBe("send-to-buyer");
    expect(brief.status).toBe("pass");
    expect(brief.briefScore).toBeGreaterThanOrEqual(90);
    expect(brief.redLines).toEqual([]);
    expect(brief.nextAction).toMatchObject({
      label: "Buyer delivery memo",
      owner: "Platform / DevOps Lead"
    });
    expect(brief.hardTruth).toContain("measured pilot evidence");
  });

  test("keeps incomplete workspaces honest when public story proof is missing", () => {
    const sample = buildProofBackedSampleWorkspaceDraft(checkedAt, baseUrl);
    const incomplete = buildWorkspaceDraft({
      ...sample,
      protopediaUrl: "",
      videoUrl: "",
      proofVerification: null
    });
    const brief = buildBrief(incomplete);

    expect(brief.decision).toBe("repair-before-share");
    expect(brief.status).toBe("block");
    expect(brief.redLines.map((line) => line.label)).toContain("Public story proof");
    expect(brief.nextAction).toMatchObject({
      label: "Public story proof",
      owner: "Publication lead",
      href: "#launch-evidence-console"
    });
    expect(brief.hardTruth).toContain("Public story proof blocks public buyer sharing");
  });

  test("escapes buyer-facing text in the rendered public HTML", () => {
    const brief = {
      ...buildBrief(completeWorkspace()),
      headline: 'Unsafe <script>alert("x")</script>',
      hardTruth: 'Proof image <img src=x onerror=alert("x")>'
    };
    const html = renderBuyerOutcomeBriefHtml(brief, {
      appUrl: "https://sample.example/?workspace=share-token",
      launchRoomUrl: "https://sample.example/launch-room"
    });

    expect(html).toContain("Buyer Outcome Brief");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(&quot;x&quot;)&gt;");
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<img src=x");
  });
});
