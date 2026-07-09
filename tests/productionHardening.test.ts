import { describe, expect, test } from "vitest";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";
import { buildProductionHardeningDemoResidueAudit, buildProductionHardeningSnapshot } from "../src/productionHardening";
import { buildWorkspaceDraft, type WorkspaceDraft } from "../src/workspaceDraft";

function ownWorkspace(checkedAt = "2026-06-20T00:00:00.000Z"): WorkspaceDraft {
  return buildWorkspaceDraft({
    activeTemplateId: "custom",
    projectBrief: "Global launch workspace for a platform team that needs buyer-owned proof and production evidence.",
    selectedAgentIds: ["market-broker", "cloud-run-sre", "security-sentinel"],
    customAgents: [],
    agentTrialEvidence: [],
    buyerScenario: {
      teamSize: 8,
      hourlyCostYen: 12000,
      cyclesPerMonth: 5,
      manualHoursPerCycle: 28,
      adoptionRatePercent: 75,
      incidentRiskYenPerMonth: 240000
    },
    pilotRun: {
      observedManualMinutes: 1680,
      observedAssistedMinutes: 420,
      participants: 4,
      acceptedTasks: 3,
      totalTasks: 3,
      evidenceUrl: "https://proof.launch.example/pilot-run-receipt",
      reviewerName: "Platform sponsor",
      notes: "Buyer-owned measured run."
    },
    buyerWorkOrder: {
      request: "Convert one release-readiness review into a production proof room.",
      targetUser: "Platform lead",
      successMetric: "Approve only when proof, value, and stop rules are visible.",
      currentBaseline: "Manual notes and scattered proof.",
      dataSensitivity: "public",
      evidenceUrl: "https://proof.launch.example/work-order"
    },
    targetUrl: "https://app.launch.example",
    protopediaUrl: "https://protopedia.net/prototype/12345",
    videoUrl: "https://youtu.be/launch-proof-123",
    proofVerification: {
      checkedAt,
      verifiedCount: 5,
      totalCount: 5,
      score: 100,
      results: [
        { id: "targetUrl", label: "Deployed URL", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
        { id: "protopediaUrl", label: "ProtoPedia URL", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
        { id: "videoUrl", label: "Walkthrough video", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
        { id: "pilotEvidenceUrl", label: "Pilot receipt", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
        { id: "workOrderEvidenceUrl", label: "Work order proof", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." }
      ]
    },
    updatedAt: checkedAt
  });
}

function buildGate(workspace: WorkspaceDraft, now = new Date("2026-06-20T08:00:00.000Z")) {
  return buildProductionHardeningSnapshot({
    workspace,
    workflowIntakeHref: "#marketplace-workbench",
    currentAuditHref: "/buyer-proof-audit",
    deliveryMemoHref: "/buyer-delivery-memo",
    trustManifestHref: "/buyer-trust-manifest",
    launchRoomHref: "/launch-room",
    now
  });
}

describe("buildProductionHardeningSnapshot", () => {
  test("blocks local and reference proof before external launch", () => {
    const gate = buildGate(buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "http://127.0.0.1:8080"));

    expect(gate.status).toBe("blocked");
    expect(gate.headline).toContain("reference launch risk");
    expect(gate.firstAction).toMatchObject({ label: "Fix Public proof URLs", href: "/buyer-proof-audit" });
    expect(gate.checks.find((check) => check.id === "public-proof-urls")).toMatchObject({ status: "blocked" });
    expect(gate.checks.find((check) => check.id === "reference-artifacts")).toMatchObject({ status: "blocked" });
    expect(gate.checks.find((check) => check.id === "live-verification")).toMatchObject({ label: "Fresh live verification" });
    expect(gate.actionPacket).toMatchObject({
      status: "blocked",
      dueDate: "2026-06-21",
      openCount: 5,
      blockedCount: 5
    });
    expect(gate.actionPacket.items[0]).toMatchObject({
      id: "action-public-proof-urls",
      priority: "P0",
      owner: "Proof owner",
      acceptance: "Every proof slot uses a buyer-owned public HTTPS URL and no localhost or private host remains."
    });
    expect(gate.recoveryKit).toMatchObject({
      status: "blocked",
      headline: "5 owner-ready recovery tickets before global share",
      blockedCount: 5,
      dueDate: "2026-06-21",
      topOwner: "Proof owner"
    });
    expect(gate.recoveryKit.releaseRule).toContain("Do not share externally");
    expect(gate.recoveryKit.issues[0]).toMatchObject({
      id: "recovery-public-proof-urls",
      issueTitle: "[P0] Public proof URLs: Replace Deployed URL with a public HTTPS URL."
    });
    expect(gate.recoveryKit.issues[0].issueBody).toContain("## Acceptance");
    expect(gate.recoveryKit.issues[0].issueBody).toContain("## No-launch guardrails");
    expect(gate.recoveryKit.csvText).toContain('"priority","status","owner","due_date"');
    expect(gate.noLaunchRules).toContain("Do not send buyer proof that still points at /sample/ reference artifacts.");
    expect(JSON.stringify(gate)).not.toMatch(/demo/i);
  });

  test("clears when proof is own, public, and freshly verified", () => {
    const gate = buildGate(ownWorkspace());

    expect(gate.status).toBe("ready");
    expect(gate.score).toBe(100);
    expect(gate.readyCount).toBe(5);
    expect(gate.firstAction).toMatchObject({ label: "Open launch room", href: "/launch-room" });
    expect(gate.checks.every((check) => check.status === "ready")).toBe(true);
    expect(gate.actionPacket).toMatchObject({
      status: "ready",
      openCount: 0,
      blockedCount: 0,
      dueDate: "2026-06-27"
    });
    expect(gate.recoveryKit).toMatchObject({
      status: "ready",
      headline: "Release recovery kit is in monitor mode",
      blockedCount: 0,
      releaseRule: "External share is allowed after one fresh proof verification run inside the publication window."
    });
    expect(gate.actionPacket.summary).toContain("No blocking release action remains");
    expect(gate.exportMarkdown).toContain("## No-launch rules");
    expect(gate.exportMarkdown).toContain("## Release action packet");
    expect(gate.exportMarkdown).toContain("## Global release recovery kit");
  });

  test("blocks stale live verification even when proof URLs are public", () => {
    const gate = buildGate(ownWorkspace("2026-06-18T00:00:00.000Z"));

    expect(gate.status).toBe("blocked");
    expect(gate.checks.find((check) => check.id === "live-verification")).toMatchObject({
      status: "blocked",
      action: "Run Verify live links after replacing proof URLs."
    });
  });
});

describe("buildProductionHardeningDemoResidueAudit", () => {
  test("turns reference workspace residue into buyer-facing replacement actions", () => {
    const gate = buildGate(buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "http://127.0.0.1:8080"));
    const audit = buildProductionHardeningDemoResidueAudit(gate);

    expect(audit.status).toBe("blocked");
    expect(audit.headline).toContain("Reference residue");
    expect(audit.primaryAction).toMatchObject({ label: "Fix Public proof URLs", href: "/buyer-proof-audit" });
    expect(audit.items.find((item) => item.id === "reference-artifacts")).toMatchObject({
      label: "No reference artifacts",
      status: "blocked",
      owner: "Product owner"
    });
    expect(audit.items).toHaveLength(5);
    expect(audit.exportMarkdown).toContain("## Buyer-facing residue checks");
    expect(audit.exportMarkdown).toContain("No reference artifacts");
  });

  test("clears when the workspace is backed by own public evidence", () => {
    const audit = buildProductionHardeningDemoResidueAudit(buildGate(ownWorkspace()));

    expect(audit.status).toBe("ready");
    expect(audit.readyCount).toBe(audit.totalCount);
    expect(audit.blockedCount).toBe(0);
    expect(audit.primaryAction).toMatchObject({ label: "Open launch room", href: "/launch-room" });
    expect(audit.summary).toContain("own public URLs");
  });

  test("points stale public proof at live verification refresh", () => {
    const audit = buildProductionHardeningDemoResidueAudit(buildGate(ownWorkspace("2026-06-18T00:00:00.000Z")));

    expect(audit.status).toBe("blocked");
    expect(audit.primaryAction).toMatchObject({ label: "Fix Fresh live verification", href: "/buyer-proof-audit" });
    expect(audit.items.find((item) => item.id === "live-verification")).toMatchObject({
      label: "Fresh public proof check",
      status: "blocked",
      owner: "DevOps owner"
    });
  });
});
