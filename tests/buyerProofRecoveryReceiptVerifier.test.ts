import { describe, expect, it } from "vitest";
import {
  BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH,
  verifyBuyerProofRecoveryReceiptRequest
} from "../server/buyerProofRecoveryReceiptVerifier";
import { buildBuyerProofMonitor } from "../src/buyerProofMonitor";
import { buildBuyerProofRecoveryPlan } from "../src/buyerProofRecoveryPlan";
import { buildBuyerProofRecoveryReceipt } from "../src/buyerProofRecoveryReceipt";
import type { BuyerShareGateProofLink } from "../src/buyerShareGate";

const proofLinks: BuyerShareGateProofLink[] = [
  { id: "targetUrl", label: "Deployed URL", value: "https://launch.example/app", href: "#launch-evidence-console" },
  { id: "protopediaUrl", label: "ProtoPedia URL", value: "https://protopedia.net/project/example", href: "#launch-evidence-console" },
  { id: "videoUrl", label: "Demo video", value: "https://video.example/demo", href: "#launch-evidence-console" },
  { id: "pilotEvidenceUrl", label: "Pilot receipt", value: "https://launch.example/pilot-receipt", href: "#pilot-run-receipt" },
  { id: "workOrderEvidenceUrl", label: "Work order proof", value: "https://launch.example/work-order", href: "#buyer-work-order-studio" }
];

function sampleReceipt() {
  const monitor = buildBuyerProofMonitor({
    proofLinks,
    now: new Date("2026-06-20T08:00:00.000Z")
  });
  const recovery = buildBuyerProofRecoveryPlan({ proofLinks, monitor });

  return buildBuyerProofRecoveryReceipt(recovery);
}

describe("buyer proof recovery receipt verifier", () => {
  it("uses the public recovery receipt verification API path", () => {
    expect(BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH).toBe("/api/buyer-proof-recovery/receipt/verify");
    expect(sampleReceipt().verificationApiPath).toBe(BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH);
  });

  it("verifies an untampered recovery receipt payload", () => {
    const receipt = sampleReceipt();

    const result = verifyBuyerProofRecoveryReceiptRequest({
      checksum: receipt.checksum,
      payload: receipt.payload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "buyer-proof-recovery.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: receipt.checksum,
        actualChecksum: receipt.checksum
      },
      receipt: {
        receiptVersion: "buyer-proof-recovery.v1",
        severity: "incident",
        shareInstruction: "Freeze external sharing",
        openTaskCount: 1,
        blockedTaskCount: 1,
        watchTaskCount: 0,
        taskLedger: {
          filename: "buyer-proof-recovery-tasks.csv",
          taskCount: 1
        }
      }
    });
  });

  it("returns 422 when a recovery receipt payload is changed after export", () => {
    const receipt = sampleReceipt();

    const result = verifyBuyerProofRecoveryReceiptRequest({
      checksum: receipt.checksum,
      payload: {
        ...receipt.payload,
        openTaskCount: receipt.payload.openTaskCount + 1
      }
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      verification: {
        status: "mismatch",
        expectedChecksum: receipt.checksum
      }
    });
  });

  it("rejects malformed recovery receipt requests", () => {
    const result = verifyBuyerProofRecoveryReceiptRequest({
      checksum: "not-a-checksum",
      payload: {}
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
