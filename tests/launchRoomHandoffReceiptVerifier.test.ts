import { describe, expect, it } from "vitest";
import { verifyLaunchRoomHandoffReceiptRequest } from "../server/launchRoomHandoffReceiptVerifier";
import { buildLaunchRoom, type LaunchRoomAcceptancePathAttachment } from "../src/launchRoom";
import { defaultWorkspaceDraft } from "../src/workspaceDraft";

function sampleReceipt(acceptancePath?: LaunchRoomAcceptancePathAttachment) {
  return buildLaunchRoom({
    workspace: defaultWorkspaceDraft("2026-06-20T00:00:00.000Z"),
    baseUrl: "https://launch.example",
    now: new Date("2026-06-20T08:00:00.000Z"),
    ...(acceptancePath ? { acceptancePath } : {})
  }).handoffPacket.decisionReceipt;
}

function sampleAcceptancePath(): LaunchRoomAcceptancePathAttachment {
  return {
    status: "verified",
    verified: true,
    receiptType: "buyer-acceptance-path.v1",
    pathId: "buyer-acceptance-path-approve-pilot-a1b2c3d4e5",
    pathStatus: "ready",
    decision: "approve-pilot",
    buyer: "Procurement sponsor",
    checksum: "1234567890abcdef",
    verifierUrl: "https://launch.example/receipt-verifier?request=buyer-acceptance-path",
    stageCount: 6,
    readyCount: 6,
    reviewCount: 0,
    blockedCount: 0,
    nextAction: "Buyer acceptance path receipt is verified."
  };
}

describe("launch room handoff receipt verifier", () => {
  it("verifies an untampered replay payload", () => {
    const receipt = sampleReceipt();

    const result = verifyLaunchRoomHandoffReceiptRequest({
      checksum: receipt.checksum,
      replayPayload: receipt.replayPayload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "launch-room.handoff-receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: receipt.checksum,
        actualChecksum: receipt.checksum
      },
      receipt: {
        launchRoomId: receipt.replayPayload.launchRoomId,
        targetBuyer: receipt.replayPayload.targetBuyer,
        launchDecision: receipt.replayPayload.launchDecision,
        selectedReply: receipt.replayPayload.selectedReply
      }
    });
  });

  it("returns 422 when the replay payload no longer matches the checksum", () => {
    const receipt = sampleReceipt();

    const result = verifyLaunchRoomHandoffReceiptRequest({
      checksum: receipt.checksum,
      replayPayload: {
        ...receipt.replayPayload,
        selectedReply: receipt.replayPayload.selectedReply === "approve" ? "revise" : "approve"
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

  it("verifies replay payloads that include an attached acceptance path receipt", () => {
    const receipt = sampleReceipt(sampleAcceptancePath());

    const result = verifyLaunchRoomHandoffReceiptRequest({
      checksum: receipt.checksum,
      replayPayload: receipt.replayPayload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      verification: {
        status: "verified"
      },
      receipt: {
        launchRoomId: receipt.replayPayload.launchRoomId,
        selectedReply: receipt.replayPayload.selectedReply
      }
    });
  });

  it("rejects malformed verification requests before replaying them", () => {
    const result = verifyLaunchRoomHandoffReceiptRequest({
      checksum: "not-a-checksum",
      replayPayload: {}
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
