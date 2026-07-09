import { describe, expect, it } from "vitest";
import { buildBuyerProofMonitor } from "../src/buyerProofMonitor";
import { buildBuyerProofRecoveryPlan, renderBuyerProofRecoveryPlanHtml } from "../src/buyerProofRecoveryPlan";
import {
  BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH,
  buildBuyerProofRecoveryReceipt,
  verifyBuyerProofRecoveryReceipt
} from "../src/buyerProofRecoveryReceipt";
import type { BuyerShareGateProofLink, BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";

const proofLinks: BuyerShareGateProofLink[] = [
  { id: "targetUrl", label: "Deployed URL", value: "https://launch.example/app", href: "#launch-evidence-console" },
  { id: "protopediaUrl", label: "ProtoPedia URL", value: "https://protopedia.net/project/example", href: "#launch-evidence-console" },
  { id: "videoUrl", label: "Demo video", value: "https://video.example/demo", href: "#launch-evidence-console" },
  { id: "pilotEvidenceUrl", label: "Pilot receipt", value: "https://launch.example/pilot-receipt", href: "#pilot-run-receipt" },
  { id: "workOrderEvidenceUrl", label: "Work order proof", value: "https://launch.example/work-order", href: "#buyer-work-order-studio" }
];

function verification(patch: Partial<BuyerShareGateProofVerificationSummary> = {}): BuyerShareGateProofVerificationSummary {
  return {
    checkedAt: "2026-06-20T00:00:00.000Z",
    verifiedCount: 5,
    totalCount: 5,
    score: 100,
    results: proofLinks.map((link) => ({
      id: link.id,
      label: link.label,
      status: "pass" as const,
      httpStatus: 200,
      evidence: "Public URL responded with HTTP 200.",
      action: "Keep this link attached to the launch room."
    })),
    ...patch
  };
}

describe("buyer proof recovery plan", () => {
  it("freezes external sharing until live verification exists", () => {
    const monitor = buildBuyerProofMonitor({
      proofLinks,
      now: new Date("2026-06-20T08:00:00.000Z")
    });
    const recovery = buildBuyerProofRecoveryPlan({ proofLinks, monitor });

    expect(recovery.severity).toBe("incident");
    expect(recovery.shareInstruction).toBe("Freeze external sharing");
    expect(recovery.steps).toHaveLength(1);
    expect(recovery.steps[0]).toMatchObject({
      id: "run-live-verification",
      status: "block",
      owner: "Launch operator"
    });
    expect(recovery.repairPacket).toMatchObject({
      title: "Repair buyer proof: Run live proof verification",
      owner: "Launch operator",
      due: "Now",
      severity: "incident"
    });
    expect(recovery.repairPacket.subject).toContain("Freeze external sharing");
    expect(recovery.repairPacket.copyText).toContain("# Repair buyer proof: Run live proof verification");
    expect(decodeURIComponent(recovery.repairPacket.href)).toContain("Checklist");
    expect(recovery.taskLedger).toMatchObject({
      filename: "buyer-proof-recovery-tasks.csv",
      taskCount: 1
    });
    expect(recovery.taskLedger.csvText).toContain("taskId,label,status,owner,due,source,action,acceptance,href");
    expect(recovery.taskLedger.csvText).toContain("run-live-verification,Run live proof verification,block,Launch operator,Now,Buyer proof intake");
    expect(recovery.taskLedger.href).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(recovery.exportMarkdown).toContain("Live proof verification has been run");
    expect(recovery.exportMarkdown).toContain("## Repair packet");
    expect(recovery.exportMarkdown).toContain("Task ledger: buyer-proof-recovery-tasks.csv");
    const receipt = buildBuyerProofRecoveryReceipt(recovery);
    expect(receipt).toMatchObject({
      checksumAlgorithm: "fnv1a-64",
      verification: expect.objectContaining({ status: "verified" })
    });
    expect(receipt.receiptId).toMatch(/^buyer-proof-recovery-incident-[a-f0-9]{12}$/);
    expect(receipt.payload).toMatchObject({
      receiptVersion: "buyer-proof-recovery.v1",
      severity: "incident",
      taskLedger: expect.objectContaining({ filename: "buyer-proof-recovery-tasks.csv" })
    });
    expect(receipt.copyText).toContain("# Buyer proof recovery receipt");
    expect(receipt.copyText).toContain("## Replay payload");
    expect(receipt.copyText).toContain(`POST ${BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH}`);
    expect(receipt.verificationApiPath).toBe(BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH);
    expect(receipt.payloadHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(decodeURIComponent(receipt.payloadHref)).toContain('"receiptVersion": "buyer-proof-recovery.v1"');
    expect(receipt.verificationRequestHref).toMatch(/^data:application\/json;charset=utf-8,/);
  });

  it("keeps only the routine recheck when proof is current", () => {
    const liveVerification = verification();
    const monitor = buildBuyerProofMonitor({
      proofLinks,
      verification: liveVerification,
      now: new Date("2026-06-20T08:00:00.000Z")
    });
    const recovery = buildBuyerProofRecoveryPlan({ proofLinks, monitor, verification: liveVerification });

    expect(recovery.severity).toBe("no-incident");
    expect(recovery.openTaskCount).toBe(0);
    expect(recovery.shareInstruction).toBe("External sharing open");
    expect(recovery.steps).toEqual([
      expect.objectContaining({
        id: "routine-recheck",
        status: "pass",
        due: "Within 24 hours"
      })
    ]);
    expect(recovery.repairPacket).toMatchObject({
      title: "Schedule buyer proof recheck",
      owner: "Launch operator",
      due: "Within 24 hours",
      severity: "no-incident"
    });
    expect(recovery.taskLedger).toMatchObject({
      filename: "buyer-proof-routine-tasks.csv",
      taskCount: 1
    });
    expect(recovery.taskLedger.csvText).toContain("routine-recheck,Routine proof recheck,pass");
    expect(buildBuyerProofRecoveryReceipt(recovery).receiptId).toMatch(/^buyer-proof-recovery-no-incident-[a-f0-9]{12}$/);
  });

  it("verifies the recovery receipt replay payload and rejects tampering", () => {
    const liveVerification = verification({
      verifiedCount: 4,
      score: 80,
      results: proofLinks.map((link) => ({
        id: link.id,
        label: link.label,
        status: link.id === "pilotEvidenceUrl" ? ("block" as const) : ("pass" as const),
        httpStatus: link.id === "pilotEvidenceUrl" ? 403 : 200,
        evidence: link.id === "pilotEvidenceUrl" ? "Public URL responded with HTTP 403." : "Public URL responded with HTTP 200.",
        action: link.id === "pilotEvidenceUrl" ? "Make the artifact publicly readable or attach a different proof URL." : "Keep this link attached to the launch room."
      }))
    });
    const monitor = buildBuyerProofMonitor({
      proofLinks,
      verification: liveVerification,
      now: new Date("2026-06-23T06:30:00.000Z")
    });
    const recovery = buildBuyerProofRecoveryPlan({ proofLinks, monitor, verification: liveVerification });
    const receipt = buildBuyerProofRecoveryReceipt(recovery);

    expect(verifyBuyerProofRecoveryReceipt(receipt)).toMatchObject({
      status: "verified",
      expectedChecksum: receipt.checksum,
      actualChecksum: receipt.checksum
    });
    expect(
      verifyBuyerProofRecoveryReceipt({
        checksum: receipt.checksum,
        payload: {
          ...receipt.payload,
          openTaskCount: receipt.payload.openTaskCount + 1
        }
      })
    ).toMatchObject({
      status: "mismatch",
      expectedChecksum: receipt.checksum
    });
  });

  it("assigns warning proof links without freezing external sharing", () => {
    const liveVerification = verification({
      verifiedCount: 4,
      score: 86,
      results: proofLinks.map((link) => ({
        id: link.id,
        label: link.label,
        status: link.id === "videoUrl" ? ("watch" as const) : ("pass" as const),
        httpStatus: link.id === "videoUrl" ? 503 : 200,
        evidence: link.id === "videoUrl" ? "Public URL responded with HTTP 503." : "Public URL responded with HTTP 200.",
        action: link.id === "videoUrl" ? "Retry the check or replace this proof with a more stable public artifact." : "Keep this link attached to the launch room."
      }))
    });
    const monitor = buildBuyerProofMonitor({
      proofLinks,
      verification: liveVerification,
      now: new Date("2026-06-20T08:00:00.000Z")
    });
    const recovery = buildBuyerProofRecoveryPlan({ proofLinks, monitor, verification: liveVerification });

    expect(recovery.severity).toBe("watch");
    expect(recovery.shareInstruction).toBe("Internal review only");
    expect(recovery.watchTaskCount).toBe(1);
    expect(recovery.steps[0]).toMatchObject({
      id: "proof-videoUrl",
      owner: "Demo owner",
      due: "Before buyer send"
    });
    expect(recovery.repairPacket.subject).toContain("Internal review only");
    expect(recovery.repairPacket.checklist).toContain("The video opens from a clean browser session and shows the core buyer workflow.");
  });

  it("creates an incident plan for blocked proof and stale checks", () => {
    const liveVerification = verification({
      verifiedCount: 4,
      score: 80,
      results: proofLinks.map((link) => ({
        id: link.id,
        label: link.label,
        status: link.id === "pilotEvidenceUrl" ? ("block" as const) : ("pass" as const),
        httpStatus: link.id === "pilotEvidenceUrl" ? 403 : 200,
        evidence: link.id === "pilotEvidenceUrl" ? "Public URL responded with HTTP 403." : "Public URL responded with HTTP 200.",
        action: link.id === "pilotEvidenceUrl" ? "Make the artifact publicly readable or attach a different proof URL." : "Keep this link attached to the launch room."
      }))
    });
    const monitor = buildBuyerProofMonitor({
      proofLinks,
      verification: liveVerification,
      now: new Date("2026-06-23T06:30:00.000Z")
    });
    const recovery = buildBuyerProofRecoveryPlan({ proofLinks, monitor, verification: liveVerification });

    expect(recovery.severity).toBe("incident");
    expect(recovery.blockedTaskCount).toBe(2);
    expect(recovery.firstAction).toContain("Fix document sharing");
    expect(recovery.steps.map((step) => step.id)).toEqual(["proof-pilotEvidenceUrl", "monitor-freshness"]);
    expect(recovery.resumeCriteria).toContain("Buyer Share Gate has no blocked checks after rerun.");
  });

  it("renders an escaped public recovery desk page", () => {
    const liveVerification = verification({
      verifiedCount: 4,
      score: 80,
      results: proofLinks.map((link) => ({
        id: link.id,
        label: link.label,
        status: link.id === "pilotEvidenceUrl" ? ("block" as const) : ("pass" as const),
        httpStatus: link.id === "pilotEvidenceUrl" ? 403 : 200,
        evidence: link.id === "pilotEvidenceUrl" ? "Public URL responded with HTTP 403." : "Public URL responded with HTTP 200.",
        action: link.id === "pilotEvidenceUrl" ? "Make the artifact publicly readable or attach a different proof URL." : "Keep this link attached to the launch room."
      }))
    });
    const monitor = buildBuyerProofMonitor({
      proofLinks,
      verification: liveVerification,
      now: new Date("2026-06-23T06:30:00.000Z")
    });
    const recovery = buildBuyerProofRecoveryPlan({ proofLinks, monitor, verification: liveVerification });
    const receipt = buildBuyerProofRecoveryReceipt(recovery);
    const html = renderBuyerProofRecoveryPlanHtml(
      {
        ...recovery,
        headline: "Recovery <script>alert(1)</script>"
      },
      {
        appUrl: "https://example.com/?workspace=share",
        monitorUrl: "https://example.com/buyer-proof-monitor",
        launchRoomUrl: "https://example.com/launch-room",
        jsonUrl: "https://example.com/api/buyer-proof-recovery",
        markdownUrl: "https://example.com/buyer-proof-recovery.md"
      },
      receipt
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("buyer proof recovery desk");
    expect(html).toContain("https://example.com/api/buyer-proof-recovery");
    expect(html).toContain("Proof monitor");
    expect(html).toContain("Repair packet");
    expect(html).toContain("Download repair packet");
    expect(html).toContain("Download task ledger");
    expect(html).toContain("buyer-proof-recovery-tasks.csv");
    expect(html).toContain("Download receipt");
    expect(html).toContain("Download replay payload");
    expect(html).toContain("Download verify request");
    expect(html).toContain("Packet body");
    expect(html).toContain("Checklist");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Recovery &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
