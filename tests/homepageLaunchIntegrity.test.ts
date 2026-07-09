import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import HomepageLaunchIntegrityPanel, {
  buildLaunchIntegrityProofRepairTarget,
  buildLaunchIntegrityProofSlotAudit,
  buildLaunchIntegrityRepairProjection
} from "../src/HomepageLaunchIntegrityPanel";
import { buildProductionHardeningSnapshot } from "../src/productionHardening";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "../src/publicProofUrl";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";
import { defaultWorkspaceDraft, type WorkspaceDraft } from "../src/workspaceDraft";

function proofIntakeFromWorkspace(workspace: WorkspaceDraft) {
  return {
    targetUrl: workspace.targetUrl,
    protopediaUrl: workspace.protopediaUrl,
    videoUrl: workspace.videoUrl,
    pilotEvidenceUrl: workspace.pilotRun.evidenceUrl,
    workOrderEvidenceUrl: workspace.buyerWorkOrder.evidenceUrl
  };
}

const proofFields = [
  { key: "targetUrl", label: "Deployed URL", target: "Cloud Run proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.targetUrl, href: "#launch-evidence-console" },
  { key: "protopediaUrl", label: "ProtoPedia URL", target: "Public story proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl, href: "#launch-evidence-console" },
  { key: "videoUrl", label: "Walkthrough video", target: "Usage proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl, href: "#launch-evidence-console" },
  { key: "pilotEvidenceUrl", label: "Pilot receipt", target: "Measured run proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.pilotEvidenceUrl, href: "#pilot-run-receipt" },
  { key: "workOrderEvidenceUrl", label: "Work order proof", target: "Scope proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.workOrderEvidenceUrl, href: "#buyer-work-order-studio" }
];

describe("homepage launch integrity triage", () => {
  test("surfaces production hardening and reference residue before the outcome spine", () => {
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "http://127.0.0.1:8080");
    const html = renderToStaticMarkup(
      createElement(HomepageLaunchIntegrityPanel, {
        workspace,
        workflowIntakeHref: "#quick-workflow-intake",
        currentAuditHref: "/buyer-proof-audit",
        deliveryMemoHref: "/buyer-delivery-memo",
        trustManifestHref: "/buyer-trust-manifest",
        launchRoomHref: "/launch-room",
        productionHardeningHref: "/production-hardening",
        onCopyText: async () => true,
        proofRepair: {
          f: proofFields,
          i: proofIntakeFromWorkspace(workspace),
          d: { targetUrl: "https://release.buddypia.dev" },
          s: "idle",
          od: () => undefined,
          oa: () => undefined,
          ov: () => undefined
        }
      })
    );

    expect(html).toContain('aria-label="Launch integrity triage"');
    expect(html).toContain("Workspace still contains reference launch risk");
    expect(html).toContain("Fix Public proof URLs");
    expect(html).toContain('aria-label="First launch recovery issue"');
    expect(html).toContain("[P0] Public proof URLs: Replace Deployed URL with a public HTTPS URL.");
    expect(html).toContain("Do not share externally until every P0 recovery ticket is verified");
    expect(html).toContain('aria-label="Reference residue audit"');
    expect(html).toContain("Reference residue still blocks buyer review");
    expect(html).toContain("Product owner: Replace reference artifacts with your own buyer proof before external launch.");
    expect(html).toContain('aria-label="No-launch rule"');
    expect(html).toContain("Do not call the workspace globally publishable while any proof URL is localhost");
    expect(html).toContain("Copy top issue");
    expect(html).toContain("Production gate");
    expect(html).toContain('download="launch-integrity-triage.md"');
    expect(html).toContain('download="global-release-recovery-kit.csv"');
    expect(html).toContain('download="global-release-recovery-kit.json"');
    expect(html).toContain('aria-label="Launch integrity owner queue"');
    expect(html).toContain('aria-label="Launch integrity repair control"');
    expect(html).toContain("Fix Deployed URL now");
    expect(html).toContain("Cloud Run proof is blocking the global launch gate.");
    expect(html).toContain("Paste replacement URL");
    expect(html).toContain("public Cloud Run product URL reviewers can open");
    expect(html).toContain("Apply &amp; verify");
    expect(html).toContain('aria-label="Projected launch gate after repair"');
    expect(html).toContain("Repair impact");
    expect(html).toContain("ready checks");
    expect(html).toContain("open tickets");
    expect(html).toContain('aria-label="Public proof slot audit"');
    expect(html).toContain("Public proof slot audit");
    expect(html).toContain("externally usable");
    expect(html).toContain("Draft:");
  });

  test("selects the first blocked proof link as the top inline repair", () => {
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "http://127.0.0.1:8080");
    const hardening = buildProductionHardeningSnapshot({
      workspace,
      workflowIntakeHref: "#quick-workflow-intake",
      currentAuditHref: "/buyer-proof-audit",
      deliveryMemoHref: "/buyer-delivery-memo",
      trustManifestHref: "/buyer-trust-manifest",
      launchRoomHref: "/launch-room"
    });
    const target = buildLaunchIntegrityProofRepairTarget({
      hardening,
      repair: {
        f: proofFields,
        i: proofIntakeFromWorkspace(workspace),
        d: { targetUrl: "https://release.buddypia.dev" },
        s: "idle",
        od: () => undefined,
        oa: () => undefined,
        ov: () => undefined
      }
    });

    expect(target?.mode).toBe("replace-url");
    expect(target && target.mode === "replace-url" ? target.field.key : "").toBe("targetUrl");
    expect(target && target.mode === "replace-url" ? target.canApply : false).toBe(true);
  });

  test("audits every public proof slot and projects draft-ready URLs", () => {
    const workspace = {
      ...defaultWorkspaceDraft("2026-06-20T00:00:00.000Z"),
      targetUrl: "http://127.0.0.1:8080",
      protopediaUrl: "https://protopedia.net/prototype/agent-marketplace",
      videoUrl: "https://youtu.be/agent-marketplace-proof",
      pilotRun: {
        ...defaultWorkspaceDraft("2026-06-20T00:00:00.000Z").pilotRun,
        evidenceUrl: "https://storage.googleapis.com/buddypia-proof/pilot-receipt.json"
      },
      buyerWorkOrder: {
        ...defaultWorkspaceDraft("2026-06-20T00:00:00.000Z").buyerWorkOrder,
        evidenceUrl: "https://github.com/buddypia/proof/issues/42"
      }
    };
    const repair = {
      f: proofFields,
      i: proofIntakeFromWorkspace(workspace),
      d: { targetUrl: "https://release.buddypia.dev" },
      s: "idle" as const,
      od: () => undefined,
      oa: () => undefined,
      ov: () => undefined
    };
    const hardening = buildProductionHardeningSnapshot({
      workspace,
      workflowIntakeHref: "#quick-workflow-intake",
      currentAuditHref: "/buyer-proof-audit",
      deliveryMemoHref: "/buyer-delivery-memo",
      trustManifestHref: "/buyer-trust-manifest",
      launchRoomHref: "/launch-room"
    });
    const repairTarget = buildLaunchIntegrityProofRepairTarget({ hardening, repair });
    const audit = buildLaunchIntegrityProofSlotAudit({ repair, repairTarget });
    const targetSlot = audit?.items.find((item) => item.key === "targetUrl");

    expect(audit?.readyCount).toBe(4);
    expect(audit?.blockedCount).toBe(1);
    expect(audit?.draftReadyCount).toBe(5);
    expect(audit?.summary).toContain("1 blocked proof slot would become ready");
    expect(targetSlot?.status).toBe("blocked");
    expect(targetSlot?.draftStatus).toBe("ready");
    expect(targetSlot?.isActiveRepair).toBe(true);
    expect(targetSlot?.action).toContain("public Cloud Run product URL");
  });

  test("projects launch gate impact from a replacement proof URL before applying it", () => {
    const workspace = {
      ...defaultWorkspaceDraft("2026-06-20T00:00:00.000Z"),
      targetUrl: "http://127.0.0.1:8080",
      protopediaUrl: "https://protopedia.net/prototype/agent-marketplace",
      videoUrl: "https://youtu.be/agent-marketplace-proof",
      pilotRun: {
        ...defaultWorkspaceDraft("2026-06-20T00:00:00.000Z").pilotRun,
        evidenceUrl: "https://storage.googleapis.com/buddypia-proof/pilot-receipt.json",
        acceptedTasks: 3,
        totalTasks: 3,
        reviewerName: "Platform sponsor"
      },
      buyerWorkOrder: {
        ...defaultWorkspaceDraft("2026-06-20T00:00:00.000Z").buyerWorkOrder,
        targetUser: "Platform lead",
        evidenceUrl: "https://github.com/buddypia/proof/issues/42"
      },
      proofVerification: null
    };
    const input = {
      workspace,
      workflowIntakeHref: "#quick-workflow-intake",
      currentAuditHref: "/buyer-proof-audit",
      deliveryMemoHref: "/buyer-delivery-memo",
      trustManifestHref: "/buyer-trust-manifest",
      launchRoomHref: "/launch-room"
    };
    const hardening = buildProductionHardeningSnapshot(input);
    const target = buildLaunchIntegrityProofRepairTarget({
      hardening,
      repair: {
        f: proofFields,
        i: proofIntakeFromWorkspace(workspace),
        d: { targetUrl: "https://release.buddypia.dev" },
        s: "idle",
        od: () => undefined,
        oa: () => undefined,
        ov: () => undefined
      }
    });
    const projection = buildLaunchIntegrityRepairProjection({ hardening, repairTarget: target, input });

    expect(projection?.scoreAfter).toBeGreaterThan(projection?.scoreBefore ?? 0);
    expect(projection?.readyAfter).toBeGreaterThan(projection?.readyBefore ?? 0);
    expect(projection?.headline).toContain("launch score");
    expect(projection?.nextAction).toContain("Run Verify live links");
  });
});
