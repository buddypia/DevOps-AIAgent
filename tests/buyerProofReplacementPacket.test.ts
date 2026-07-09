import { describe, expect, test } from "vitest";
import {
  BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH,
  buildBuyerProofReplacementPacket,
  verifyBuyerProofReplacementReceipt
} from "../src/buyerProofReplacementPacket";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";
import type { BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";
import { buildWorkspaceDraft, type WorkspaceDraft } from "../src/workspaceDraft";

function ownWorkspace(): WorkspaceDraft {
  return buildWorkspaceDraft({
    activeTemplateId: "custom",
    projectBrief: "Buyer proof room for a platform team replacing manual release readiness review.",
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
    proofVerification: null,
    updatedAt: "2026-06-20T00:00:00.000Z"
  });
}

function passingVerification(): BuyerShareGateProofVerificationSummary {
  return {
    checkedAt: "2026-06-20T00:00:00.000Z",
    verifiedCount: 5,
    totalCount: 5,
    score: 100,
    results: [
      { id: "targetUrl", label: "Live product", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
      { id: "protopediaUrl", label: "ProtoPedia story", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
      { id: "videoUrl", label: "Walkthrough video", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
      { id: "pilotEvidenceUrl", label: "Pilot receipt", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
      { id: "workOrderEvidenceUrl", label: "Work order proof", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." }
    ]
  };
}

function buildPacket(workspace: WorkspaceDraft, proofVerification: BuyerShareGateProofVerificationSummary | null = workspace.proofVerification, referenceWorkspace?: WorkspaceDraft) {
  return buildBuyerProofReplacementPacket({
    workspace,
    referenceWorkspace,
    proofVerification,
    workflowIntakeHref: "#marketplace-workbench",
    currentAuditHref: "/buyer-proof-audit",
    launchRoomHref: "/launch-room"
  });
}

describe("buildBuyerProofReplacementPacket", () => {
  test("turns starter proof into a blocked replacement packet", () => {
    const packet = buildPacket(buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://sample.example"));

    expect(packet.status).toBe("blocked");
    expect(packet.mode).toBe("replace");
    expect(packet.headline).toBe("Replace proof rows before buyer sharing");
    expect(packet.primaryAction).toMatchObject({ label: "Replace Live product", href: "#marketplace-workbench" });
    expect(packet.items.find((item) => item.id === "targetUrl")).toMatchObject({
      state: "starter",
      displayValue: "Reference proof",
      owner: "Proof owner"
    });
    expect(packet.reviewMessage.subject).toContain("Proof replacement packet has");
    expect(packet.reviewMessage.copyText).toContain("blocked proof rows are replaced");
    expect(packet.sendPacket).toMatchObject({
      headline: "Buyer send packet is blocked",
      nextAction: "Replace Live product"
    });
    expect(packet.sendPacket.steps.map((step) => [step.id, step.status])).toEqual([
      ["proof-rows", "blocked"],
      ["live-verification", "blocked"],
      ["buyer-review", "blocked"]
    ]);
    expect(packet.buyerHandoff.subject).toContain("Hold buyer launch room");
    expect(packet.buyerHandoff.assets.map((asset) => [asset.id, asset.status])).toEqual([
      ["launch-room", "blocked"],
      ["review-message", "blocked"],
      ["replay-receipt", "blocked"],
      ["proof-ledger", "blocked"]
    ]);
    expect(packet.buyerHandoff.copyText).toContain("not ready for external sharing");
    expect(packet.buyerHandoff.copyText).toContain("do not forward this packet to the buyer");
    expect(packet.exportMarkdown).toContain("## Replacement table");
    expect(packet.exportMarkdown).toContain("## Send packet");
    expect(packet.exportMarkdown).toContain("## Buyer handoff");
    expect(packet.exportMarkdown).toContain("## Verification receipt");
    expect(packet.exportMarkdown).toContain(`POST ${BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH}`);
    expect(packet.csv).toContain("Live product,blocked,starter");
    expect(packet.packetId).toMatch(/^proof-replacement-[a-f0-9]{8}$/);
    expect(packet.receipt).toMatchObject({
      checksumAlgorithm: "fnv1a-64",
      verificationApiPath: BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH,
      payload: {
        receiptVersion: "buyer-proof-replacement.v1",
        packetId: packet.packetId,
        mode: "replace",
        blockedCount: packet.blockedCount,
        csvLedger: {
          filename: "buyer-proof-replacement-ledger.csv",
          rowCount: 5
        }
      },
      verification: {
        status: "verified"
      }
    });
    expect(packet.receipt.receiptId).toMatch(/^buyer-proof-replacement-replace-[a-f0-9]{12}$/);
    expect(packet.receipt.copyText).toContain("Replay payload");
    expect(packet.receipt.verificationRequestJson).toContain('"receiptVersion": "buyer-proof-replacement.v1"');
    expect(JSON.stringify(packet)).not.toMatch(/demo/i);
  });

  test("blocks a hosted starter product URL when it matches the reference workspace", () => {
    const reference = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://a2a-agent-marketplace.example");
    const packet = buildPacket(reference, null, reference);

    expect(packet.status).toBe("blocked");
    expect(packet.mode).toBe("replace");
    expect(packet.primaryAction).toMatchObject({ label: "Replace Live product", href: "#marketplace-workbench" });
    expect(packet.items.find((item) => item.id === "targetUrl")).toMatchObject({
      status: "blocked",
      state: "starter",
      displayValue: "Reference proof",
      evidence: "Live product still points at reference evidence."
    });
  });

  test("requires live verification when all replacement URLs are public-shaped", () => {
    const packet = buildPacket(ownWorkspace(), null);

    expect(packet.status).toBe("attention");
    expect(packet.mode).toBe("verify");
    expect(packet.blockedCount).toBe(0);
    expect(packet.attentionCount).toBe(5);
    expect(packet.primaryAction).toMatchObject({ label: "Verify Live product", href: "/buyer-proof-audit" });
    expect(packet.items.every((item) => item.state === "unchecked")).toBe(true);
    expect(packet.sendPacket).toMatchObject({
      headline: "Buyer send packet needs live proof",
      nextAction: "Verify Live product"
    });
    expect(packet.sendPacket.steps.find((step) => step.id === "live-verification")?.status).toBe("attention");
    expect(packet.buyerHandoff.assets.every((asset) => asset.status === "attention")).toBe(true);
    expect(packet.buyerHandoff.copyText).toContain("5 proof links still need live verification");
    expect(packet.reviewMessage.subject).toBe("Buyer proof packet needs live verification: Platform lead");
    expect(packet.reviewMessage.copyText).toContain("run live verification before external sharing");
  });

  test("produces a sendable buyer review packet when all proof passes live checks", () => {
    const packet = buildPacket(ownWorkspace(), passingVerification());

    expect(packet.status).toBe("ready");
    expect(packet.mode).toBe("send");
    expect(packet.readyCount).toBe(5);
    expect(packet.primaryAction).toMatchObject({ label: "Open launch room", href: "/launch-room" });
    expect(packet.items.every((item) => item.state === "own-public")).toBe(true);
    expect(packet.sendPacket).toMatchObject({
      headline: "Buyer send packet is ready",
      nextAction: "Open launch room"
    });
    expect(packet.sendPacket.steps.every((step) => step.status === "ready")).toBe(true);
    expect(packet.buyerHandoff).toMatchObject({
      subject: "Buyer launch room ready: Platform lead",
      decisionRequest: "Please review the launch room and reply with continue, revise, or stop."
    });
    expect(packet.buyerHandoff.assets.map((asset) => [asset.id, asset.status])).toEqual([
      ["launch-room", "ready"],
      ["review-message", "ready"],
      ["replay-receipt", "ready"],
      ["proof-ledger", "ready"]
    ]);
    expect(packet.buyerHandoff.copyText).toContain("Launch room: /launch-room");
    expect(packet.buyerHandoff.copyText).toContain(`Checksum: fnv1a-64:${packet.receipt.checksum}`);
    expect(packet.reviewMessage.subject).toBe("Buyer proof packet ready: Platform lead");
    expect(packet.reviewMessage.copyText).toContain("Please review the launch room and decide continue, revise, or stop.");
    expect(packet.copyText).toContain("## Buyer review message");
    expect(packet.copyText).toContain("Buyer send packet is ready");
    expect(packet.copyText).toContain("## Buyer handoff");
    expect(packet.copyText).toContain("```csv");
  });

  test("detects replacement packet receipt tampering", () => {
    const packet = buildPacket(ownWorkspace(), passingVerification());

    expect(verifyBuyerProofReplacementReceipt(packet.receipt)).toMatchObject({
      status: "verified",
      expectedChecksum: packet.receipt.checksum,
      actualChecksum: packet.receipt.checksum
    });
    expect(
      verifyBuyerProofReplacementReceipt({
        checksum: packet.receipt.checksum,
        payload: {
          ...packet.receipt.payload,
          readyCount: packet.receipt.payload.readyCount - 1
        }
      })
    ).toMatchObject({
      status: "mismatch",
      expectedChecksum: packet.receipt.checksum
    });
  });

  test("keeps failed live checks in the replacement path", () => {
    const verification = passingVerification();
    verification.results = verification.results.map((result) =>
      result.id === "videoUrl" ? { ...result, status: "block", httpStatus: 404, evidence: "HTTP 404.", action: "Replace the walkthrough URL." } : result
    );
    const packet = buildPacket(ownWorkspace(), verification);

    expect(packet.status).toBe("blocked");
    expect(packet.mode).toBe("replace");
    expect(packet.items.find((item) => item.id === "videoUrl")).toMatchObject({
      status: "blocked",
      state: "failed",
      displayValue: "Failed check",
      href: "#marketplace-workbench"
    });
  });
});
