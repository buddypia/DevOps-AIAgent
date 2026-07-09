import { z } from "zod";
import {
  LAUNCH_ROOM_FOLLOW_UP_RECEIPT_VERIFY_PATH,
  verifyLaunchRoomFollowUpReceipt,
  type LaunchRoomFollowUpReceiptPayload
} from "../src/launchRoom.js";

export { LAUNCH_ROOM_FOLLOW_UP_RECEIPT_VERIFY_PATH };

const FOLLOW_UP_EXPORT_TEXT_MAX = 250000;

const ActivityEventSchema = z.object({
  id: z.enum(["cover-sheet-prepared", "economic-buyer", "security-reviewer", "pilot-operator", "procurement-owner", "reply-route-recorded", "decision-receipt-sealed"]),
  label: z.string().trim().min(1).max(160),
  status: z.enum(["ready", "attention", "blocked"]),
  actor: z.string().trim().min(1).max(240),
  signal: z.string().trim().min(1).max(2000),
  evidence: z.string().trim().min(1).max(5000),
  nextAction: z.string().trim().min(1).max(2000),
  href: z.string().trim().min(1).max(120000)
});

const LaunchRoomFollowUpReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  replayPayload: z.object({
    launchRoomId: z.string().trim().min(1).max(160),
    targetBuyer: z.string().trim().min(1).max(240),
    trailStatus: z.enum(["ready", "attention", "blocked"]),
    headline: z.string().trim().min(1).max(500),
    summary: z.string().trim().min(1).max(1000),
    nextOwner: z.string().trim().min(1).max(240),
    nextAction: z.string().trim().min(1).max(2000),
    events: z.array(ActivityEventSchema).min(1).max(12),
    exports: z.object({
      crmNote: z.string().trim().min(1).max(FOLLOW_UP_EXPORT_TEXT_MAX),
      slackUpdate: z.string().trim().min(1).max(50000),
      taskCsv: z.string().trim().min(1).max(FOLLOW_UP_EXPORT_TEXT_MAX)
    })
  })
});

export function verifyLaunchRoomFollowUpReceiptRequest(input: unknown) {
  const parsed = LaunchRoomFollowUpReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const replayPayload = parsed.data.replayPayload as LaunchRoomFollowUpReceiptPayload;
  const verification = verifyLaunchRoomFollowUpReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    replayPayload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "launch-room.follow-up-receipt.verify",
      verification,
      receipt: {
        launchRoomId: replayPayload.launchRoomId,
        targetBuyer: replayPayload.targetBuyer,
        trailStatus: replayPayload.trailStatus,
        nextOwner: replayPayload.nextOwner,
        eventCount: replayPayload.events.length
      }
    }
  };
}
