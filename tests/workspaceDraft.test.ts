import { describe, expect, test } from "vitest";
import {
  buildWorkspaceDraft,
  buildWorkspaceResumePacket,
  buildWorkspaceShareUrl,
  decodeWorkspaceDraft,
  decodeWorkspaceShareParam,
  defaultWorkspaceDraft,
  encodeWorkspaceDraft,
  encodeWorkspaceShareParam,
  parseWorkspaceImport,
  workspaceDraftFromTemplate,
  WORKSPACE_SHARE_PARAM
} from "../src/workspaceDraft";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";
import { workspaceMatchesPublicSample, workspacePublicArtifactHref } from "../src/workspacePublicLinks";
import { buildImportedAgentFromCard } from "../src/customAgent";
import { getBlueprintTemplate } from "../src/blueprintTemplates";

const importedAgent = () => {
  const result = buildImportedAgentFromCard(
    JSON.stringify({
      name: "Security Evidence Agent",
      description: "Scans security policy, secret handling, A2A trust, and Cloud Run evidence.",
      skills: [{ id: "security.scan", name: "Security scan", description: "Validates secret and auth boundaries." }]
    })
  );
  if (result.status !== "accepted") throw new Error("fixture should import");
  return result.agent;
};

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

function legacyShareParam(raw: string) {
  return Buffer.from(raw, "utf8").toString("base64url");
}

describe("workspace draft persistence", () => {
  test("falls back to the default launch workspace when stored JSON is invalid", () => {
    const fallback = defaultWorkspaceDraft("2026-06-18T00:00:00.000Z");
    const draft = decodeWorkspaceDraft("{not json", fallback);

    expect(draft).toEqual(fallback);
  });

  test("seeds default and template workspaces with scenario-specific ROI inputs", () => {
    const defaultDraft = defaultWorkspaceDraft("2026-06-18T00:00:00.000Z");
    const security = getBlueprintTemplate("security-review");
    const securityDraft = workspaceDraftFromTemplate(security, "2026-06-18T00:00:00.000Z");

    expect(defaultDraft.buyerScenario).toEqual(getBlueprintTemplate("platform-launch").buyerScenario);
    expect(defaultDraft.pilotRun.notes).toContain("Starter benchmark");
    expect(securityDraft).toMatchObject({
      activeTemplateId: "security-review",
      projectBrief: security.brief,
      selectedAgentIds: security.selectedAgentIds,
      buyerScenario: security.buyerScenario,
      buyerWorkOrder: security.buyerWorkOrder,
      pilotRun: expect.objectContaining({
        observedManualMinutes: 1680,
        observedAssistedMinutes: 560,
        reviewerName: "Security sponsor"
      }),
      targetUrl: "",
      protopediaUrl: "",
      videoUrl: ""
    });
    expect(defaultDraft.proofVerification).toBeNull();
    expect(securityDraft.proofVerification).toBeNull();
  });

  test("normalizes user workspace fields before saving", () => {
    const draft = buildWorkspaceDraft({
      activeTemplateId: "custom",
      projectBrief: "  Buyer needs a real launch decision.  ",
      selectedAgentIds: ["market-broker", "market-broker", "cloud-run-sre", ""],
      customAgents: [importedAgent()],
      agentTrialEvidence: acceptedTrialEvidence,
      buyerScenario: {
        teamSize: 999,
        hourlyCostYen: 20000,
        cyclesPerMonth: 6,
        manualHoursPerCycle: 32,
        adoptionRatePercent: 80,
        incidentRiskYenPerMonth: 240000
      },
      pilotRun: {
        observedManualMinutes: 300,
        observedAssistedMinutes: 120,
        participants: 4,
        acceptedTasks: 3,
        totalTasks: 3,
        evidenceUrl: " https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-run ",
        reviewerName: " Sponsor ",
        notes: " First run accepted. "
      },
      buyerWorkOrder: {
        request: " Convert one real release review into a buyer-ready work order with A2A proof. ",
        targetUser: " Platform sponsor ",
        successMetric: " Close four launch proof gaps before review. ",
        currentBaseline: " Review evidence is scattered across docs and comments. ",
        dataSensitivity: "public",
        evidenceUrl: " https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order "
      },
      targetUrl: " https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app ",
      protopediaUrl: " https://protopedia.net/prototype/123 ",
      videoUrl: " https://youtu.be/demo ",
      proofVerification: {
        checkedAt: "2026-06-18T01:00:00.000Z",
        verifiedCount: 9,
        totalCount: 99,
        score: 94.4,
        results: [
          {
            id: " targetUrl ",
            label: " Deployed URL ",
            status: "pass",
            httpStatus: 200,
            evidence: " Public URL responded with HTTP 200. ",
            action: " Keep this link attached. "
          },
          {
            id: "pilotEvidenceUrl",
            label: "Pilot receipt",
            status: "unknown" as "pass",
            httpStatus: 999,
            evidence: "Unexpected response.",
            action: "Replace proof."
          }
        ]
      },
      updatedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(draft).toMatchObject({
      activeTemplateId: "custom",
      projectBrief: "Buyer needs a real launch decision.",
      selectedAgentIds: ["market-broker", "cloud-run-sre"],
      customAgents: [expect.objectContaining({ name: "Security Evidence Agent" })],
      agentTrialEvidence: [expect.objectContaining({ receiptId: "trial-custom-agent-card-auditor", status: "accepted" })],
      buyerScenario: {
        teamSize: 200,
        hourlyCostYen: 20000,
        cyclesPerMonth: 6,
        manualHoursPerCycle: 32,
        adoptionRatePercent: 80,
        incidentRiskYenPerMonth: 240000
      },
      pilotRun: {
        observedManualMinutes: 300,
        observedAssistedMinutes: 120,
        participants: 4,
        acceptedTasks: 3,
        totalTasks: 3,
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-run",
        reviewerName: "Sponsor",
        notes: "First run accepted."
      },
      buyerWorkOrder: {
        request: "Convert one real release review into a buyer-ready work order with A2A proof.",
        targetUser: "Platform sponsor",
        successMetric: "Close four launch proof gaps before review.",
        currentBaseline: "Review evidence is scattered across docs and comments.",
        dataSensitivity: "public",
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
      },
      targetUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
      protopediaUrl: "https://protopedia.net/prototype/123",
      videoUrl: "https://youtu.be/demo",
      proofVerification: {
        checkedAt: "2026-06-18T01:00:00.000Z",
        verifiedCount: 1,
        totalCount: 2,
        score: 94,
        results: [
          expect.objectContaining({
            id: "targetUrl",
            label: "Deployed URL",
            status: "pass",
            httpStatus: 200
          }),
          expect.objectContaining({
            id: "pilotEvidenceUrl",
            status: "block",
            httpStatus: 599
          })
        ]
      }
    });
  });

  test("round-trips encoded workspace data", () => {
    const draft = buildWorkspaceDraft({
      activeTemplateId: "buyer-roi",
      projectBrief: "AI buyer evaluates ROI and public evidence.",
      selectedAgentIds: ["market-broker", "ux-guildmaster"],
      agentTrialEvidence: acceptedTrialEvidence,
      buyerScenario: {
        teamSize: 12,
        hourlyCostYen: 15000,
        cyclesPerMonth: 8,
        manualHoursPerCycle: 18,
        adoptionRatePercent: 65,
        incidentRiskYenPerMonth: 300000
      },
      pilotRun: {
        observedManualMinutes: 1080,
        observedAssistedMinutes: 420,
        participants: 5,
        acceptedTasks: 4,
        totalTasks: 4,
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-run/receipt.json",
        reviewerName: "Platform sponsor",
        notes: "Measured pilot run accepted."
      },
      buyerWorkOrder: {
        request: "Turn a buyer request into a shareable work order with agent assignments and proof.",
        targetUser: "AI product buyer",
        successMetric: "Show payback and proof gaps in one packet",
        currentBaseline: "Manual ROI notes and scattered proof links",
        dataSensitivity: "internal",
        evidenceUrl: ""
      },
      targetUrl: "https://a2a-agent-marketplace.example.com",
      protopediaUrl: "",
      videoUrl: "https://vimeo.com/123",
      proofVerification: {
        checkedAt: "2026-06-18T02:00:00.000Z",
        verifiedCount: 2,
        totalCount: 3,
        score: 72,
        results: [
          {
            id: "targetUrl",
            label: "Deployed URL",
            status: "pass",
            httpStatus: 200,
            evidence: "Public URL responded with HTTP 200.",
            action: "Keep this link attached."
          },
          {
            id: "videoUrl",
            label: "Demo video",
            status: "watch",
            httpStatus: 503,
            evidence: "Public URL responded with HTTP 503.",
            action: "Retry or replace this proof."
          }
        ]
      },
      updatedAt: "2026-06-18T00:00:00.000Z"
    });

    expect(decodeWorkspaceDraft(encodeWorkspaceDraft(draft))).toEqual(draft);
  });

  test("accepts exported workspace JSON for user import", () => {
    const draft = buildWorkspaceDraft({
      activeTemplateId: "custom",
      projectBrief: "Imported buyer workspace should restore the live launch case.",
      selectedAgentIds: ["market-broker", "cloud-run-sre", "ux-guildmaster"],
      agentTrialEvidence: acceptedTrialEvidence,
      buyerScenario: {
        teamSize: 18,
        hourlyCostYen: 16000,
        cyclesPerMonth: 10,
        manualHoursPerCycle: 20,
        adoptionRatePercent: 75,
        incidentRiskYenPerMonth: 550000
      },
      pilotRun: {
        observedManualMinutes: 1200,
        observedAssistedMinutes: 360,
        participants: 6,
        acceptedTasks: 4,
        totalTasks: 4,
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/imported-pilot",
        reviewerName: "Global sponsor",
        notes: "Imported workspace proof."
      },
      buyerWorkOrder: {
        request: "Restore a launch room that was exported by another operator.",
        targetUser: "Global launch owner",
        successMetric: "Buyer proof opens with the same evidence and value model.",
        currentBaseline: "Workspace handoff depends on one browser profile.",
        dataSensitivity: "public",
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/imported-work-order"
      },
      targetUrl: "https://marketplace.example.com",
      protopediaUrl: "https://protopedia.net/prototype/imported",
      videoUrl: "https://youtu.be/imported",
      updatedAt: "2026-06-18T03:00:00.000Z"
    });

    const result = parseWorkspaceImport(JSON.stringify(draft));

    expect(result.status).toBe("accepted");
    if (result.status !== "accepted") throw new Error("workspace import should be accepted");
    expect(result.draft).toEqual(draft);
  });

  test("rejects invalid workspace import files instead of silently falling back", () => {
    expect(parseWorkspaceImport("{not json")).toEqual({
      status: "rejected",
      reason: "Workspace file is not valid JSON."
    });
    expect(parseWorkspaceImport(JSON.stringify({ projectBrief: "Looks like JSON but not an export." }))).toEqual({
      status: "rejected",
      reason: "Workspace file is not an A2A launch workspace export."
    });
  });

  test("round-trips share links with unicode workspace data", () => {
    const draft = buildWorkspaceDraft({
      activeTemplateId: "custom",
      projectBrief: "グローバル公開に耐えるAI agent pilotを、買い手とSREが同じURLで確認する。",
      selectedAgentIds: ["market-broker", "cloud-run-sre", "security-sentinel"],
      agentTrialEvidence: acceptedTrialEvidence,
      buyerScenario: {
        teamSize: 9,
        hourlyCostYen: 18000,
        cyclesPerMonth: 7,
        manualHoursPerCycle: 21,
        adoptionRatePercent: 72,
        incidentRiskYenPerMonth: 420000
      },
      pilotRun: {
        observedManualMinutes: 1260,
        observedAssistedMinutes: 470,
        participants: 4,
        acceptedTasks: 3,
        totalTasks: 3,
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/global-pilot",
        reviewerName: "SRE sponsor",
        notes: "初回パイロットの実測証拠あり。"
      },
      buyerWorkOrder: {
        request: "グローバル公開前の実レビューを、所有者と公開証跡つきのwork orderにする。",
        targetUser: "SRE sponsor",
        successMetric: "公開前に5つの証跡を閉じる",
        currentBaseline: "証跡が手作業で散らばっている",
        dataSensitivity: "internal",
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
      },
      targetUrl: "https://a2a-marketplace.run.app",
      protopediaUrl: "https://protopedia.net/prototype/a2a-marketplace",
      videoUrl: "https://youtu.be/demo",
      updatedAt: "2026-06-18T00:00:00.000Z"
    });

    const encoded = encodeWorkspaceShareParam(draft);
    const legacyEncoded = legacyShareParam(encodeWorkspaceDraft(draft));

    expect(encoded).toMatch(/^lz1\./);
    expect(encoded.length).toBeLessThan(legacyEncoded.length);
    expect(decodeWorkspaceShareParam(encoded)).toEqual(draft);
  });

  test("builds a checksum-backed workspace resume packet for shared buyer rooms", () => {
    const draft = buildWorkspaceDraft({
      activeTemplateId: "custom",
      projectBrief: "Buyer should be able to resume this launch workspace from a shared URL.",
      selectedAgentIds: ["market-broker", "cloud-run-sre"],
      agentTrialEvidence: acceptedTrialEvidence,
      buyerScenario: {
        teamSize: 9,
        hourlyCostYen: 18000,
        cyclesPerMonth: 7,
        manualHoursPerCycle: 21,
        adoptionRatePercent: 72,
        incidentRiskYenPerMonth: 420000
      },
      pilotRun: {
        observedManualMinutes: 1260,
        observedAssistedMinutes: 470,
        participants: 4,
        acceptedTasks: 3,
        totalTasks: 3,
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/global-pilot",
        reviewerName: "SRE sponsor",
        notes: "Pilot proof can be resumed."
      },
      buyerWorkOrder: {
        request: "Resume a buyer launch room with the same value model and proof.",
        targetUser: "SRE sponsor",
        successMetric: "External reviewer can open the same launch room.",
        currentBaseline: "Workspace handoff depends on one browser.",
        dataSensitivity: "public",
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
      },
      targetUrl: "https://a2a-marketplace.run.app",
      protopediaUrl: "",
      videoUrl: "",
      updatedAt: "2026-06-18T00:00:00.000Z"
    });

    const packet = buildWorkspaceResumePacket(draft, "https://example.com/app?utm=launch#quick-workflow-intake");

    expect(packet.receiptId).toMatch(/^workspace-resume-[a-f0-9]{12}$/);
    expect(packet.checksumAlgorithm).toBe("fnv1a-64");
    expect(packet.checksum).toMatch(/^[a-f0-9]{16}$/);
    expect(packet.resumeUrl).toContain("https://example.com/app?utm=launch&workspace=lz1.");
    expect(packet.resumeUrl).not.toContain("#quick-workflow-intake");
    expect(packet.proofAuditUrl).toContain("https://example.com/buyer-proof-audit?workspace=lz1.");
    expect(packet.publicReviewUrl).toContain("https://example.com/global-publishability?workspace=lz1.");
    expect(packet.headline).toContain("handoff gap");
    expect(packet.summary).toContain("SRE sponsor");
    expect(packet.publicReview).toMatchObject({
      status: "blocked",
      headline: "Public review cover should stay internal",
      actionLabel: "Review no-send cover"
    });
    expect(packet.proofHealth).toMatchObject({
      status: "watch",
      headline: "Proof URLs attached, not checked live",
      verifiedCount: 0,
      totalCount: 3,
      score: 0,
      nextActionLabel: "Verify live proof"
    });
    expect(packet.included.map((item) => item.id)).toEqual(["brief", "agents", "value", "pilot", "work-order", "proof", "trial-evidence"]);
    expect(packet.included.find((item) => item.id === "proof")).toMatchObject({
      status: "watch",
      value: "3/5 proof URLs attached"
    });
    expect(packet.missing).toEqual(["ProtoPedia URL", "Walkthrough video", "Live proof verification"]);
    expect(packet.restoreSteps).toContain("Run live proof verification before sending this room to an external reviewer.");
    expect(packet.markdown).toContain("# Workspace resume packet");
    expect(packet.markdown).toContain(`Checksum: fnv1a-64:${packet.checksum}`);
    expect(packet.markdown).toContain("Resume URL: https://example.com/app?utm=launch&workspace=lz1.");
    expect(packet.markdown).toContain("Public review cover: https://example.com/global-publishability?workspace=lz1.");
    expect(packet.markdown).toContain("## Public review cover");
    expect(packet.markdown).toContain("## Live proof health");
    expect(packet.markdownHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
  });

  test("surfaces live proof blockers and repair actions in the resume packet", () => {
    const draft = buildWorkspaceDraft({
      activeTemplateId: "custom",
      projectBrief: "Buyer proof should show exactly which public artifact failed live verification.",
      selectedAgentIds: ["market-broker", "cloud-run-sre"],
      agentTrialEvidence: acceptedTrialEvidence,
      buyerScenario: {
        teamSize: 12,
        hourlyCostYen: 18000,
        cyclesPerMonth: 6,
        manualHoursPerCycle: 18,
        adoptionRatePercent: 70,
        incidentRiskYenPerMonth: 360000
      },
      pilotRun: {
        observedManualMinutes: 1080,
        observedAssistedMinutes: 360,
        participants: 4,
        acceptedTasks: 3,
        totalTasks: 3,
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot",
        reviewerName: "Launch sponsor",
        notes: "Pilot proof attached."
      },
      buyerWorkOrder: {
        request: "Verify the buyer proof chain before sending the workspace.",
        targetUser: "Launch sponsor",
        successMetric: "Every proof URL either passes or has a repair owner.",
        currentBaseline: "Manual handoff hides failing URLs.",
        dataSensitivity: "public",
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
      },
      targetUrl: "https://a2a-marketplace.run.app",
      protopediaUrl: "https://protopedia.net/prototype/a2a-marketplace",
      videoUrl: "https://youtu.be/demo",
      proofVerification: {
        checkedAt: "2026-06-18T04:00:00.000Z",
        verifiedCount: 1,
        totalCount: 3,
        score: 58,
        results: [
          {
            id: "targetUrl",
            label: "Deployed URL",
            status: "pass",
            httpStatus: 200,
            evidence: "Public URL responded with HTTP 200.",
            action: "Keep this link attached."
          },
          {
            id: "videoUrl",
            label: "Walkthrough video",
            status: "watch",
            httpStatus: 503,
            evidence: "Public URL responded with HTTP 503.",
            action: "Retry the check or replace the video proof."
          },
          {
            id: "pilotEvidenceUrl",
            label: "Pilot receipt",
            status: "block",
            httpStatus: 403,
            evidence: "Public URL responded with HTTP 403.",
            action: "Make the pilot receipt publicly readable."
          }
        ]
      },
      updatedAt: "2026-06-18T00:00:00.000Z"
    });

    const packet = buildWorkspaceResumePacket(draft, "https://example.com/app", "/buyer-proof-audit");

    expect(packet.publicReview).toMatchObject({
      status: "blocked",
      headline: "Public review cover should stay internal",
      actionLabel: "Review no-send cover"
    });
    expect(packet.proofHealth).toMatchObject({
      status: "blocked",
      headline: "1 live proof blocker",
      checkedAt: "2026-06-18T04:00:00.000Z",
      verifiedCount: 1,
      totalCount: 3,
      score: 58,
      nextAction: "Make the pilot receipt publicly readable.",
      nextActionLabel: "Repair Pilot receipt"
    });
    expect(packet.proofHealth.openIssues).toEqual([
      expect.objectContaining({ id: "pilotEvidenceUrl", status: "block", httpStatus: 403 }),
      expect.objectContaining({ id: "videoUrl", status: "watch", httpStatus: 503 })
    ]);
    expect(packet.missing).toEqual(["Repair blocked live proof"]);
    expect(packet.included.find((item) => item.id === "proof")).toMatchObject({
      status: "watch",
      value: "1/3 live proof links verified"
    });
    expect(packet.markdown).toContain("Status: blocked");
    expect(packet.markdown).toContain("Pilot receipt: block HTTP 403");
    expect(packet.markdown).toContain("Make the pilot receipt publicly readable.");
    expect(packet.proofAuditUrl).toContain("https://example.com/buyer-proof-audit?workspace=lz1.");
    expect(packet.publicReviewUrl).toContain("https://example.com/global-publishability?workspace=lz1.");
  });

  test("marks the public review cover sendable when proof and submission context are complete", () => {
    const draft = buildWorkspaceDraft({
      activeTemplateId: "custom",
      projectBrief: "A complete public launch room should open with a reviewer cover sheet and proof receipt.",
      selectedAgentIds: ["market-broker", "cloud-run-sre"],
      agentTrialEvidence: acceptedTrialEvidence,
      buyerScenario: {
        teamSize: 10,
        hourlyCostYen: 18000,
        cyclesPerMonth: 6,
        manualHoursPerCycle: 16,
        adoptionRatePercent: 75,
        incidentRiskYenPerMonth: 360000
      },
      pilotRun: {
        observedManualMinutes: 960,
        observedAssistedMinutes: 300,
        participants: 4,
        acceptedTasks: 4,
        totalTasks: 4,
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot",
        reviewerName: "Launch sponsor",
        notes: "Accepted pilot receipt."
      },
      buyerWorkOrder: {
        request: "Send a complete launch room for bounded pilot approval.",
        targetUser: "Launch sponsor",
        successMetric: "Reviewer can decide from the cover without a private walkthrough.",
        currentBaseline: "Manual handoff lacks a public cover sheet.",
        dataSensitivity: "public",
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
      },
      targetUrl: "https://a2a-marketplace.run.app",
      protopediaUrl: "https://protopedia.net/prototype/a2a-marketplace",
      videoUrl: "https://youtu.be/demo",
      proofVerification: {
        checkedAt: "2026-06-18T05:00:00.000Z",
        verifiedCount: 5,
        totalCount: 5,
        score: 100,
        results: [
          { id: "targetUrl", label: "Deployed URL", status: "pass", httpStatus: 200, evidence: "Public URL responded with HTTP 200.", action: "Keep this link attached." },
          { id: "protopediaUrl", label: "ProtoPedia URL", status: "pass", httpStatus: 200, evidence: "Public URL responded with HTTP 200.", action: "Keep this link attached." },
          { id: "videoUrl", label: "Walkthrough video", status: "pass", httpStatus: 200, evidence: "Public URL responded with HTTP 200.", action: "Keep this link attached." },
          { id: "pilotEvidenceUrl", label: "Pilot receipt", status: "pass", httpStatus: 200, evidence: "Public URL responded with HTTP 200.", action: "Keep this link attached." },
          { id: "workOrderEvidenceUrl", label: "Work order proof", status: "pass", httpStatus: 200, evidence: "Public URL responded with HTTP 200.", action: "Keep this link attached." }
        ]
      },
      updatedAt: "2026-06-18T00:00:00.000Z"
    });

    const packet = buildWorkspaceResumePacket(draft, "https://example.com/app?utm=launch", "/buyer-proof-audit", "/global-publishability");

    expect(packet.missing).toEqual([]);
    expect(packet.publicReview).toMatchObject({
      status: "ready",
      headline: "Public review cover is sendable",
      actionLabel: "Open review cover"
    });
    expect(packet.proofHealth).toMatchObject({
      status: "ready",
      headline: "Live proof is externally reachable",
      verifiedCount: 5,
      totalCount: 5
    });
    expect(packet.restoreSteps).toContain("Open the public review cover and ask for a bounded pilot decision.");
    expect(packet.markdown).toContain("- Status: ready");
    expect(packet.markdown).toContain("Public review cover is sendable");
    expect(packet.publicReviewUrl).toBe("https://example.com/global-publishability");
    expect(packet.markdown).toContain("Public review cover: https://example.com/global-publishability");
  });

  test("keeps reading legacy base64 workspace share parameters", () => {
    const draft = defaultWorkspaceDraft("2026-06-18T00:00:00.000Z");
    const legacyEncoded = legacyShareParam(encodeWorkspaceDraft(draft));

    expect(decodeWorkspaceShareParam(legacyEncoded)).toEqual(draft);
  });

  test("falls back when a share parameter is corrupted", () => {
    const fallback = defaultWorkspaceDraft("2026-06-18T00:00:00.000Z");

    expect(decodeWorkspaceShareParam("not-valid-base64", fallback)).toEqual(fallback);
  });

  test("builds a share URL while preserving unrelated query parameters", () => {
    const draft = defaultWorkspaceDraft("2026-06-18T00:00:00.000Z");
    const shareUrl = buildWorkspaceShareUrl(draft, "https://example.com/app?utm=launch#marketplace-workbench");
    const parsed = new URL(shareUrl);

    expect(parsed.origin + parsed.pathname).toBe("https://example.com/app");
    expect(parsed.searchParams.get("utm")).toBe("launch");
    expect(parsed.searchParams.get(WORKSPACE_SHARE_PARAM)).toBe(encodeWorkspaceShareParam(draft));
    expect(parsed.hash).toBe("");
  });

  test("uses bare public artifact URLs for the unchanged proof-backed sample", () => {
    const currentSample = buildProofBackedSampleWorkspaceDraft("2026-06-18T00:00:00.000Z", "https://sample.example");
    const freshSample = buildProofBackedSampleWorkspaceDraft("2026-06-25T00:00:00.000Z", "https://sample.example");
    const shortHref = workspacePublicArtifactHref("/global-publishability", currentSample, "https://app.example/?utm=launch#hero", freshSample);

    expect(workspaceMatchesPublicSample(currentSample, freshSample)).toBe(true);
    expect(shortHref).toBe("https://app.example/global-publishability");

    const custom = {
      ...currentSample,
      projectBrief: `${currentSample.projectBrief}\nCustom buyer deployment.`
    };
    const customHref = workspacePublicArtifactHref("/global-publishability", custom, "https://app.example/?utm=launch#hero", freshSample);

    expect(workspaceMatchesPublicSample(custom, freshSample)).toBe(false);
    expect(customHref).toContain("https://app.example/global-publishability?workspace=lz1.");
  });
});
