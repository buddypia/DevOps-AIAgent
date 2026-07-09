import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH,
  verifyQuickWorkflowPilotRunLogRequest
} from "../server/quickWorkflowPilotRunLogReceiptVerifier";
import {
  QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION,
  quickWorkflowPilotRunLogChecksum,
  type QuickWorkflowPilotRunLogReceiptPayload
} from "../src/quickWorkflowPilotRunLogReceipt";

function runLogPayload(): QuickWorkflowPilotRunLogReceiptPayload {
  return {
    receiptVersion: QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION,
    source: "quick-workflow-pilot-run-log",
    status: "ready",
    decision: "send-closeout-note",
    buyer: "Platform release lead",
    workflow: "weekly release review",
    runWindow: "2026-07-01 to 2026-07-31",
    sourceKickoffReceiptId: "quick-kickoff-pack-ready-20260701-12345678",
    sourceKickoffChecksum: "fnv1a32:12345678",
    evidenceScore: 100,
    readyCount: 5,
    watchCount: 0,
    blockedCount: 0,
    missingProofCount: 0,
    evidenceExcerpt: "Day 0 kickoff opened. Day 3 proof verified. Day 30 acceptance recorded.",
    tasks: [
      {
        id: "day-0-kickoff",
        status: "ready",
        owner: "Pilot sponsor",
        dueDate: "2026-07-01",
        foundSignals: ["kickoff opened", "buyer owner accepted continue, revise, or stop criteria", "source contract receipt attached"],
        missingSignals: []
      },
      {
        id: "day-3-proof-recheck",
        status: "ready",
        owner: "Proof owner",
        dueDate: "2026-07-04",
        foundSignals: ["live proof verification rerun", "public proof links still open", "receipt linked to buyer room"],
        missingSignals: []
      },
      {
        id: "day-7-value-snapshot",
        status: "ready",
        owner: "Finance owner",
        dueDate: "2026-07-08",
        foundSignals: ["assisted minutes recorded", "accepted task count recorded", "value trend checked by finance"],
        missingSignals: []
      },
      {
        id: "day-14-pilot-review",
        status: "ready",
        owner: "Buyer owner",
        dueDate: "2026-07-15",
        foundSignals: ["buyer review completed", "continue, revise, or stop decision recorded", "current evidence attached"],
        missingSignals: []
      },
      {
        id: "day-30-value-acceptance",
        status: "ready",
        owner: "Procurement owner",
        dueDate: "2026-07-31",
        foundSignals: ["value floor compared", "stop-loss rule checked", "procurement or sponsor acceptance recorded"],
        missingSignals: []
      }
    ]
  };
}

describe("quick workflow pilot run log receipt verifier", () => {
  test("verifies pilot run logs for buyer closeout", () => {
    const payload = runLogPayload();
    const checksum = quickWorkflowPilotRunLogChecksum(payload);

    const result = verifyQuickWorkflowPilotRunLogRequest({ checksum, payload });

    expect(QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH).toBe("/api/quick-workflow-pilot-run-log/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-workflow-pilot-run-log.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-workflow-pilot-run-log.v1",
          status: "ready",
          decision: "send-closeout-note",
          buyer: "Platform release lead",
          runWindow: "2026-07-01 to 2026-07-31",
          sourceKickoffReceiptId: "quick-kickoff-pack-ready-20260701-12345678",
          evidenceScore: 100,
          readyCount: 5,
          missingProofCount: 0,
          taskCount: 5,
          firstOpenTask: "none"
        }
      }
    });
  });

  test("rejects changed pilot run logs with a mismatch", () => {
    const payload = runLogPayload();
    const checksum = quickWorkflowPilotRunLogChecksum(payload);

    const result = verifyQuickWorkflowPilotRunLogRequest({
      checksum,
      payload: {
        ...payload,
        evidenceScore: 80,
        missingProofCount: 2
      }
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      verification: {
        status: "mismatch",
        expectedChecksum: checksum
      }
    });
  });

  test("keeps malformed pilot run log requests out of the verifier", () => {
    const result = verifyQuickWorkflowPilotRunLogRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "quick-workflow-pilot-run-log.v1",
        source: "quick-workflow-pilot-run-log"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches pilot run logs through the receipt verification desk", () => {
    const payload = runLogPayload();
    const checksum = quickWorkflowPilotRunLogChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-workflow-pilot-run-log.v1",
        receiptLabel: "Quick workflow pilot run log",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-workflow-pilot-run-log/verify",
        nativeSkill: "quick-workflow-pilot-run-log.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });
});
