import { describe, expect, it } from "vitest";
import { verifyLaunchRoomFollowUpReceiptRequest } from "../server/launchRoomFollowUpReceiptVerifier";
import { buildLaunchRoom } from "../src/launchRoom";
import { defaultWorkspaceDraft } from "../src/workspaceDraft";

function sampleReceipt() {
  return buildLaunchRoom({
    workspace: defaultWorkspaceDraft("2026-06-20T00:00:00.000Z"),
    baseUrl: "https://launch.example",
    now: new Date("2026-06-20T08:00:00.000Z")
  }).buyerActivityTrail.followUpReceipt;
}

describe("launch room follow-up receipt verifier", () => {
  it("verifies untampered follow-up exports and event log", () => {
    const receipt = sampleReceipt();

    const result = verifyLaunchRoomFollowUpReceiptRequest({
      checksum: receipt.checksum,
      replayPayload: receipt.replayPayload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "launch-room.follow-up-receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: receipt.checksum,
        actualChecksum: receipt.checksum
      },
      receipt: {
        launchRoomId: receipt.replayPayload.launchRoomId,
        targetBuyer: receipt.replayPayload.targetBuyer,
        trailStatus: receipt.replayPayload.trailStatus,
        nextOwner: receipt.replayPayload.nextOwner,
        eventCount: receipt.replayPayload.events.length
      }
    });
  });

  it("returns 422 when an exported record no longer matches the checksum", () => {
    const receipt = sampleReceipt();

    const result = verifyLaunchRoomFollowUpReceiptRequest({
      checksum: receipt.checksum,
      replayPayload: {
        ...receipt.replayPayload,
        exports: {
          ...receipt.replayPayload.exports,
          taskCsv: `${receipt.replayPayload.exports.taskCsv}\nforged,row`
        }
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

  it("accepts large generated exports before comparing the checksum", () => {
    const receipt = sampleReceipt();
    const largeExportSuffix = "\n".repeat(2) + "large exported buyer activity row,".repeat(3000);

    const result = verifyLaunchRoomFollowUpReceiptRequest({
      checksum: receipt.checksum,
      replayPayload: {
        ...receipt.replayPayload,
        exports: {
          ...receipt.replayPayload.exports,
          crmNote: `${receipt.replayPayload.exports.crmNote}${largeExportSuffix}`,
          taskCsv: `${receipt.replayPayload.exports.taskCsv}${largeExportSuffix}`
        }
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

  it("rejects malformed follow-up receipt requests", () => {
    const result = verifyLaunchRoomFollowUpReceiptRequest({
      checksum: "not-a-checksum",
      replayPayload: {}
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
