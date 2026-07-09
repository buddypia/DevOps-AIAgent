import { z } from "zod";
import {
  LAUNCH_ROOM_HANDOFF_RECEIPT_VERIFY_PATH,
  verifyLaunchRoomHandoffDecisionReceipt,
  type LaunchRoomHandoffDecisionReceiptPayload
} from "../src/launchRoom.js";

export { LAUNCH_ROOM_HANDOFF_RECEIPT_VERIFY_PATH };

const LaunchRoomHandoffReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  replayPayload: z.object({
    launchRoomId: z.string().trim().min(1).max(160),
    launchDecision: z.enum(["send", "pilot-review", "hold"]),
    targetBuyer: z.string().trim().min(1).max(240),
    selectedReply: z.enum(["approve", "revise", "hold"]),
    routeStatus: z.enum(["ready", "attention", "blocked"]),
    record: z.string().trim().min(1).max(1000),
    nextAction: z.string().trim().min(1).max(1000),
    evidence: z.string().trim().min(1).max(1000),
    proofHealth: z.object({
      readiness: z.enum(["not-armed", "evidence-current", "evidence-watch", "evidence-blocked"]),
      score: z.number().min(0).max(100),
      verifiedCount: z.number().int().min(0).max(100),
      totalCount: z.number().int().min(0).max(100),
      checkedAt: z.string().trim().min(1).max(120)
    }),
    primaryMetric: z.object({
      label: z.string().trim().min(1).max(160),
      value: z.string().trim().min(1).max(160),
      evidence: z.string().trim().min(1).max(1000)
    }),
    acceptancePath: z
      .object({
        pathId: z.string().trim().min(1).max(260),
        status: z.string().trim().min(1).max(80),
        decision: z.string().trim().min(1).max(120),
        decisionRecommendation: z.string().trim().min(1).max(120).optional(),
        selectedDecision: z.string().trim().min(1).max(120).optional(),
        decisionAlignment: z.string().trim().min(1).max(120).optional(),
        openDecisionConditionCount: z.number().int().min(0).max(20).optional(),
        blockedDecisionConditionCount: z.number().int().min(0).max(20).optional(),
        watchDecisionConditionCount: z.number().int().min(0).max(20).optional(),
        verified: z.boolean(),
        checksum: z.string().trim().min(1).max(120)
      })
      .optional()
  })
});

export function verifyLaunchRoomHandoffReceiptRequest(input: unknown) {
  const parsed = LaunchRoomHandoffReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const replayPayload = parsed.data.replayPayload as LaunchRoomHandoffDecisionReceiptPayload;
  const verification = verifyLaunchRoomHandoffDecisionReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    replayPayload
  });

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "launch-room.handoff-receipt.verify",
      verification,
      receipt: {
        launchRoomId: replayPayload.launchRoomId,
        targetBuyer: replayPayload.targetBuyer,
        launchDecision: replayPayload.launchDecision,
        selectedReply: replayPayload.selectedReply,
        routeStatus: replayPayload.routeStatus
      }
    }
  };
}
