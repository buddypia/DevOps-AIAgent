import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH,
  verifyQuickWorkflowBuyerExpansionHandoffSignoffRequest
} from "../server/quickWorkflowBuyerExpansionHandoffSignoffReceiptVerifier";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_RECEIPT_VERSION,
  quickWorkflowBuyerExpansionHandoffSignoffChecksum,
  type QuickWorkflowBuyerExpansionHandoffSignoffPayload
} from "../src/quickWorkflowBuyerExpansionHandoffSignoffReceipt";

function signoffPayload(): QuickWorkflowBuyerExpansionHandoffSignoffPayload {
  return {
    receiptVersion: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_RECEIPT_VERSION,
    source: "quick-workflow-buyer-expansion-handoff-signoff",
    decision: "approve-next-window",
    status: "ready",
    buyer: "Platform release lead",
    workflow: "weekly release review",
    handoffReceiptId: "quick-buyer-expansion-handoff-ready-12345678",
    handoffChecksum: "fnv1a32:12345678",
    handoffVerifierHref: "/receipt-verifier?request=handoff&verify=1",
    approvalLine: "Approve only with Expansion quick-pilot-expansion-guardrail-ready-12345678 links decision, run, and contract receipts.",
    riskLine: "Do not expand beyond the named window unless the next retained-value recheck still clears the floor.",
    decisionMemo: "Approve the next operating window only with the source handoff, verifier result, receipt chain, and retained-value owner attached.",
    controlOwner: "Procurement owner",
    nextAction: "Record procurement signoff, then schedule the next value recheck.",
    taskReadyCount: 4,
    taskTotalCount: 4,
    requiredProof: [
      "Attach one-pager / Pilot sponsor / ready: 6/6 packet stages; Buyer expansion packet is ready",
      "Verify receipt chain / Proof owner / ready: quick-value-contract-ready-12345678 / verifier attached",
      "Record procurement signoff / Procurement owner / ready: quick-pilot-expansion-guardrail-ready-12345678 / verifier attached",
      "Schedule value recheck / Finance owner / ready: ¥720,000/month clears the ¥616,000/month accepted floor."
    ],
    operatingPacket: {
      headline: "Approval carries an owner ledger",
      summary:
        "Procurement approval now creates four owner commitments: archive the verifier, schedule the retained-value recheck, reopen proof before rollout, and stop or repair if value falls below the floor.",
      recheckWindow: "Before renewal or wider rollout",
      calendar: {
        status: "scheduled",
        startDate: "2026-07-31",
        endDate: "2026-08-01",
        summary: "Retained-value recheck for Platform release lead"
      },
      recheckCloseout: {
        status: "recordable",
        label: "Ready for 30-day retained-value closeout",
        scheduledDate: "2026-07-31",
        sourceHandoffReceiptId: "quick-buyer-expansion-handoff-ready-12345678",
        sourceHandoffChecksum: "fnv1a32:12345678",
        sourceVerifierHref: "/receipt-verifier?request=handoff&verify=1",
        valueFloorEvidence: "¥720,000/month clears the ¥616,000/month accepted floor.",
        decisionRule: "Do not expand beyond the named window unless the next retained-value recheck still clears the floor.",
        nextOwner: "Procurement owner",
        nextAction: "Record procurement signoff, then schedule the next value recheck.",
        requiredSignals: [
          "signoff verifier verified HTTP 200",
          "retained-value recheck scheduled",
          "actual retained monthly value recorded",
          "value floor outcome stated",
          "receipt chain reopened",
          "expand, revise, or stop decision recorded"
        ],
        evidenceTemplate: [
          "Recheck date: 2026-07-31.",
          "Signoff verifier verified HTTP 200 before closeout.",
          "Source handoff receipt: quick-buyer-expansion-handoff-ready-12345678 / fnv1a32:12345678.",
          "Handoff verifier output attached.",
          "Retained-value recheck scheduled on calendar for 2026-07-31.",
          "Finance retained value target named from proof: ¥720,000/month clears the ¥616,000/month accepted floor.",
          "Actual retained monthly value: ¥____/month.",
          "Value floor outcome stated: clears floor | below floor.",
          "Receipt chain reopened before decision: quick-value-contract-ready-12345678 / verifier attached.",
          "Decision recorded: expand | revise | stop.",
          "Stop or repair rule: Do not expand beyond the named window unless the next retained-value recheck still clears the floor.",
          "Next owner: Procurement owner.",
          "Next action: Record procurement signoff, then schedule the next value recheck."
        ].join("\n")
      },
      tasks: [
        {
          id: "archive-signoff-verifier",
          label: "Archive signoff verifier",
          status: "ready",
          owner: "Procurement owner",
          dueLabel: "At approval",
          action: "Save the signoff verifier output with quick-buyer-expansion-handoff-ready-12345678 before the approval leaves procurement.",
          acceptance: "The approval record includes the signoff receipt, source handoff checksum, and verifier outcome.",
          proof: "quick-pilot-expansion-guardrail-ready-12345678 / verifier attached"
        },
        {
          id: "schedule-retained-value-recheck",
          label: "Schedule retained-value recheck",
          status: "ready",
          owner: "Finance owner",
          dueLabel: "2026-07-31",
          action: "Import the retained-value recheck calendar for 2026-07-31 and name the value floor, owner, receipt to reopen, and stop condition.",
          acceptance: "Finance confirms retained value still clears the floor before renewal or wider rollout continues.",
          proof: "¥720,000/month clears the ¥616,000/month accepted floor."
        },
        {
          id: "reopen-receipt-chain",
          label: "Reopen receipt chain",
          status: "ready",
          owner: "Proof owner",
          dueLabel: "Before 2026-07-31",
          action: "Rerun the handoff, signoff, decision, run, and contract verifiers before the retained-value recheck is accepted.",
          acceptance: "Verifier results still match the exported handoff and signoff before any rollout decision.",
          proof: "quick-value-contract-ready-12345678 / verifier attached"
        },
        {
          id: "stop-or-repair-below-floor",
          label: "Stop or repair below floor",
          status: "ready",
          owner: "Pilot sponsor",
          dueLabel: "If value misses floor",
          action: "Stop expansion or open a repair run if the retained-value recheck no longer clears the floor.",
          acceptance: "No wider rollout proceeds with a failed value floor or stale verifier result.",
          proof: "Do not expand beyond the named window unless the next retained-value recheck still clears the floor."
        }
      ]
    }
  };
}

describe("quick workflow buyer expansion handoff signoff receipt verifier", () => {
  test("verifies procurement signoff receipts against the source handoff", () => {
    const payload = signoffPayload();
    const checksum = quickWorkflowBuyerExpansionHandoffSignoffChecksum(payload);

    const result = verifyQuickWorkflowBuyerExpansionHandoffSignoffRequest({ checksum, payload });

    expect(QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH).toBe("/api/quick-workflow-buyer-expansion-handoff-signoff/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-workflow-buyer-expansion-handoff-signoff.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: "quick-workflow-buyer-expansion-handoff-signoff.v1",
          decision: "approve-next-window",
          status: "ready",
          buyer: "Platform release lead",
          handoffReceiptId: "quick-buyer-expansion-handoff-ready-12345678",
          handoffChecksum: "fnv1a32:12345678",
          taskReadyCount: 4,
          taskTotalCount: 4,
          controlOwner: "Procurement owner",
          operatingPacket: {
            headline: "Approval carries an owner ledger",
            recheckWindow: "Before renewal or wider rollout",
            calendarStatus: "scheduled",
            calendarStartDate: "2026-07-31",
            closeoutStatus: "recordable",
            closeoutScheduledDate: "2026-07-31",
            taskCount: 4,
            firstDueLabel: "At approval"
          }
        }
      }
    });
  });

  test("rejects changed procurement signoffs with a mismatch", () => {
    const payload = signoffPayload();
    const checksum = quickWorkflowBuyerExpansionHandoffSignoffChecksum(payload);

    const result = verifyQuickWorkflowBuyerExpansionHandoffSignoffRequest({
      checksum,
      payload: {
        ...payload,
        decisionMemo: "Approve the next window without preserving the source handoff verifier."
      }
    });

    expect(result).toMatchObject({
      statusCode: 422,
      body: {
        verification: {
          status: "mismatch",
          expectedChecksum: checksum
        }
      }
    });
  });

  test("rejects malformed signoff requests", () => {
    const result = verifyQuickWorkflowBuyerExpansionHandoffSignoffRequest({
      checksum: "not-a-checksum",
      payload: {
        receiptVersion: "quick-workflow-buyer-expansion-handoff-signoff.v1",
        source: "quick-workflow-buyer-expansion-handoff-signoff"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches procurement signoffs through the receipt verification desk", () => {
    const payload = signoffPayload();
    const checksum = quickWorkflowBuyerExpansionHandoffSignoffChecksum(payload);

    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-workflow-buyer-expansion-handoff-signoff.v1",
        receiptLabel: "Quick workflow buyer expansion handoff signoff",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/quick-workflow-buyer-expansion-handoff-signoff/verify",
        nativeSkill: "quick-workflow-buyer-expansion-handoff-signoff.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });
});
