import { describe, expect, it } from "vitest";
import {
  BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH,
  verifyBuyerProofReplacementReceiptRequest
} from "../server/buyerProofReplacementReceiptVerifier";
import { buyerProofReplacementReceiptChecksum, buildBuyerProofReplacementPacket } from "../src/buyerProofReplacementPacket";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";

function sampleReceipt() {
  return buildBuyerProofReplacementPacket({
    workspace: buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://sample.example"),
    proofVerification: null,
    workflowIntakeHref: "#marketplace-workbench",
    currentAuditHref: "/buyer-proof-audit",
    launchRoomHref: "/launch-room"
  }).receipt;
}

describe("buyer proof replacement receipt verifier", () => {
  it("uses the public replacement receipt verification API path", () => {
    expect(BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH).toBe("/api/buyer-proof-replacement/receipt/verify");
    expect(sampleReceipt().verificationApiPath).toBe(BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH);
  });

  it("verifies an untampered replacement packet receipt payload", () => {
    const receipt = sampleReceipt();

    const result = verifyBuyerProofReplacementReceiptRequest({
      checksum: receipt.checksum,
      payload: receipt.payload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "buyer-proof-replacement.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: receipt.checksum,
        actualChecksum: receipt.checksum
      },
      receipt: {
        receiptVersion: "buyer-proof-replacement.v1",
        packetId: receipt.payload.packetId,
        status: "blocked",
        mode: "replace",
        readyCount: 0,
        csvLedger: {
          filename: "buyer-proof-replacement-ledger.csv",
          rowCount: 5
        }
      }
    });
  });

  it("accepts long encoded workspace artifact links in replay receipt rows", () => {
    const receipt = sampleReceipt();
    const longAuditHref = `/buyer-proof-audit?brief=${"release-readiness-proof-".repeat(180)}`;
    const payload = {
      ...receipt.payload,
      primaryActionHref: longAuditHref,
      rows: receipt.payload.rows.map((row, index) => (index === 0 ? { ...row, href: longAuditHref } : row))
    };

    const result = verifyBuyerProofReplacementReceiptRequest({
      checksum: buyerProofReplacementReceiptChecksum(payload),
      payload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      verification: {
        status: "verified"
      }
    });
  });

  it("returns 422 when a replacement receipt payload is changed after export", () => {
    const receipt = sampleReceipt();

    const result = verifyBuyerProofReplacementReceiptRequest({
      checksum: receipt.checksum,
      payload: {
        ...receipt.payload,
        blockedCount: receipt.payload.blockedCount - 1
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

  it("rejects malformed replacement receipt verification requests", () => {
    const result = verifyBuyerProofReplacementReceiptRequest({
      checksum: "not-a-checksum",
      payload: {}
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
