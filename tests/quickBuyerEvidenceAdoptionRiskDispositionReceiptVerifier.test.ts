import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_VERIFY_PATH,
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_VERIFY_PATH,
  verifyQuickBuyerEvidenceAdoptionRiskSendControlRequest,
  verifyQuickBuyerEvidenceAdoptionRiskOwnerCloseoutRequest,
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_VERIFY_PATH,
  verifyQuickBuyerEvidenceAdoptionRiskDispositionRequest
} from "../server/quickBuyerEvidenceAdoptionRiskDispositionReceiptVerifier";
import {
  buildQuickBuyerEvidenceAdoptionRiskLedger,
  type QuickBuyerEvidencePackSharePayload
} from "../src/quickBuyerEvidenceShare";
import {
  buildQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt,
  buildQuickBuyerEvidenceAdoptionRiskRecheckPacket,
  buildQuickBuyerEvidenceAdoptionRiskSendControlReceipt,
  buildQuickBuyerEvidenceAdoptionRiskDispositionOwnerHandoff,
  buildQuickBuyerEvidenceAdoptionRiskDispositionReceipt,
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_RECEIPT_VERSION,
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_RECEIPT_VERSION,
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_RECEIPT_VERSION,
  quickBuyerEvidenceAdoptionRiskDispositionDefaultDecision
} from "../src/quickBuyerEvidenceAdoptionRiskDispositionReceipt";
import { QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION } from "../src/quickExternalReviewPacketShare";
import { QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH } from "../src/quickWorkflowConversionReceipt";

function payloadForRiskLedger(): QuickBuyerEvidencePackSharePayload {
  return {
    version: QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION,
    buyer: "Platform release lead",
    workflow: "Weekly Cloud Run release-readiness review",
    status: "watch",
    label: "Buyer pack needs one live proof repair",
    headline: "Platform release lead can review a receipt-backed buyer pack",
    summary: "Required artifacts are mostly ready, but live proof reachability still needs repair.",
    sendRule: "Do not send externally until Public proof links is ready and the receipt verifier remains attached.",
    verifierHref: "/receipt-verifier?request=risk-ledger",
    verificationApiPath: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH,
    sourceReceiptId: "quick-conversion-watch-12345678",
    sourceChecksum: "fnv1a32:12345678",
    firstAction: {
      label: "Fix Public proof links",
      href: "/launch-evidence"
    },
    artifacts: [
      {
        id: "decision-case",
        label: "Buyer decision case",
        status: "ready",
        href: "/launch-room",
        role: "Buyer reviewer",
        proof: "Decision case is ready for the buyer meeting.",
        requiredForSend: true
      },
      {
        id: "send-memo",
        label: "External send memo",
        status: "ready",
        href: "/buyer-evidence-board",
        role: "Launch owner",
        proof: "Send memo names the buyer and workflow.",
        requiredForSend: true
      },
      {
        id: "claim-ledger",
        label: "Claim ledger",
        status: "ready",
        href: "/buyer-proof-room",
        role: "Proof owner",
        proof: "Claims cite measured proof.",
        requiredForSend: true
      },
      {
        id: "proof-repair",
        label: "Public proof links",
        status: "watch",
        href: "/launch-evidence",
        role: "Proof owner",
        proof: "3/5 public proof links verified live.",
        requiredForSend: true
      },
      {
        id: "redaction",
        label: "Public-safe evidence board",
        status: "ready",
        href: "/buyer-evidence-board",
        role: "Security owner",
        proof: "Evidence board hides private notes.",
        requiredForSend: true
      },
      {
        id: "conversion-receipt",
        label: "Outcome receipt verifier",
        status: "ready",
        href: "/receipt-verifier?request=risk-ledger",
        role: "Review coordinator",
        proof: "Conversion receipt verifies.",
        requiredForSend: true
      },
      {
        id: "pilot-week",
        label: "Pilot value proof",
        status: "ready",
        href: "/buyer-proof-room",
        role: "Pilot owner",
        proof: "Measured pilot value is ready.",
        requiredForSend: false
      },
      {
        id: "decision-close",
        label: "Decision close path",
        status: "ready",
        href: "#buyer-response-receipt",
        role: "Decision owner",
        proof: "Decision receipt path is present.",
        requiredForSend: false
      }
    ]
  };
}

describe("quick buyer evidence adoption risk disposition receipt verifier", () => {
  test("verifies a disposition receipt against the adoption risk ledger", () => {
    const payload = payloadForRiskLedger();
    const ledger = buildQuickBuyerEvidenceAdoptionRiskLedger(payload);
    const receipt = buildQuickBuyerEvidenceAdoptionRiskDispositionReceipt({
      payload,
      ledger,
      decision: quickBuyerEvidenceAdoptionRiskDispositionDefaultDecision(ledger),
      reviewerName: "Risk reviewer",
      reviewerNote: "Public proof links must be repaired before external send.",
      generatedAt: "2026-07-01T00:00:00.000Z"
    });
    const request = JSON.parse(receipt.requestJson) as { checksum: string; payload: typeof receipt.payload };

    expect(receipt.payload).toMatchObject({
      receiptVersion: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_RECEIPT_VERSION,
      status: "watch",
      decision: "repair-open-risk",
      buyer: "Platform release lead",
      reviewerName: "Risk reviewer",
      ledgerStatus: "watch",
      riskTotal: 5,
      sourceLedgerHash: expect.stringMatching(/^fnv1a32:[a-f0-9]{8}$/)
    });
    expect(receipt.payload.risks.map((risk) => risk.id)).toEqual(["source-trust", "disclosure-boundary", "proof-reachability", "value-proof", "decision-ownership"]);
    expect(receipt.verification.status).toBe("verified");
    expect(receipt.requestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(receipt.verifierHref).toContain("/receipt-verifier?");
    expect(receipt.exportMarkdown).toContain("# Buyer adoption risk disposition receipt");
    expect(receipt.exportMarkdown).toContain("Risk clearance:");

    const handoff = buildQuickBuyerEvidenceAdoptionRiskDispositionOwnerHandoff(receipt);
    expect(handoff).toMatchObject({
      status: "watch",
      headline: "Risk disposition becomes an owner repair handoff",
      readyCount: 1,
      taskTotal: 4,
      firstOwner: "Proof owner"
    });
    expect(handoff.tasks.map((task) => task.id)).toEqual([
      "attach-risk-disposition-receipt",
      "repair-disclosure-boundary",
      "repair-proof-reachability",
      "repair-decision-ownership"
    ]);
    expect(handoff.tasks.find((task) => task.id === "repair-proof-reachability")).toMatchObject({
      dueLabel: "+2 business days",
      action: "Repair Public proof links and rerun the live audit."
    });
    expect(handoff.csv).toContain("taskId,label,status,owner,due,action,closeCondition,evidence,href");
    expect(handoff.calendarText).toContain("BEGIN:VCALENDAR");
    expect(handoff.calendarHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(handoff.exportMarkdown).toContain("# Buyer adoption risk owner handoff");
    expect(handoff.exportMarkdown).toContain("Repair Public proof links");
    expect(handoff.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(handoff.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(handoff.mailHref).toContain("mailto:?");

    const closeout = buildQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt({
      receipt,
      handoff,
      acceptedBy: "Proof owner",
      evidenceNote: "Risk proof work has partial closure; proof reachability still needs review.",
      closedTaskIds: ["attach-risk-disposition-receipt", "repair-disclosure-boundary"],
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const closeoutRequest = JSON.parse(closeout.requestJson) as { checksum: string; payload: typeof closeout.payload };
    expect(closeout).toMatchObject({
      payload: {
        receiptVersion: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_RECEIPT_VERSION,
        status: "watch",
        decision: "hold-risk-closeout",
        acceptedBy: "Proof owner",
        sourceDispositionChecksum: `fnv1a32:${receipt.checksum}`,
        sourceLedgerHash: receipt.payload.sourceLedgerHash,
        sourceHandoffStatus: "watch",
        closedTaskCount: 2,
        taskCount: 4,
        openTaskCount: 2,
        nextOwner: "Proof owner"
      },
      verification: {
        status: "verified"
      }
    });
    expect(closeout.payload.tasks.find((task) => task.id === "repair-proof-reachability")).toMatchObject({
      closed: false,
      outcomeNote: expect.stringContaining("Still open")
    });
    expect(closeout.requestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(closeout.verifierHref).toContain("/receipt-verifier?");
    expect(closeout.exportMarkdown).toContain("# Buyer adoption risk owner closeout receipt");
    expect(closeout.exportMarkdown).toContain("Closed tasks: 2/4");
    const recheckPacket = buildQuickBuyerEvidenceAdoptionRiskRecheckPacket(closeout);
    expect(recheckPacket).toMatchObject({
      status: "watch",
      headline: "Risk recheck packet stays held until owner work closes",
      readyCount: 0,
      stepTotal: 2,
      currentOwner: "Proof owner"
    });
    expect(recheckPacket.steps.map((step) => step.id)).toEqual(["close-risk-owner-work", "re-export-risk-closeout"]);
    expect(recheckPacket.exportMarkdown).toContain("# Buyer adoption risk recheck packet");
    expect(recheckPacket.exportMarkdown).toContain("Risk closeout:");
    expect(recheckPacket.calendarText).toContain("BEGIN:VCALENDAR");
    expect(recheckPacket.calendarHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(recheckPacket.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(recheckPacket.mailHref).toContain("mailto:?");
    const heldSendControl = buildQuickBuyerEvidenceAdoptionRiskSendControlReceipt({
      closeout,
      recheck: recheckPacket,
      generatedAt: "2026-07-03T00:00:00.000Z"
    });
    const heldSendControlRequest = JSON.parse(heldSendControl.requestJson) as { checksum: string; payload: typeof heldSendControl.payload };
    expect(heldSendControl).toMatchObject({
      payload: {
        receiptVersion: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_RECEIPT_VERSION,
        status: "blocked",
        decision: "hold-buyer-send",
        sourceRiskCloseoutChecksum: `fnv1a32:${closeout.checksum}`,
        sourceLedgerHash: receipt.payload.sourceLedgerHash,
        recheckReadyCount: 0,
        recheckStepTotal: 2,
        nextOwner: "Proof owner"
      },
      verification: {
        status: "verified"
      }
    });
    expect(heldSendControl.payload.criteria.map((criterion) => criterion.id)).toEqual([
      "risk-owner-closeout",
      "risk-recheck-runbook",
      "live-proof-sweep",
      "send-decision-record"
    ]);
    expect(heldSendControl.payload.criteria[0]).toMatchObject({
      status: "block",
      label: "Risk owner closeout verifies"
    });
    expect(heldSendControl.exportMarkdown).toContain("# Buyer-send risk control receipt");
    expect(heldSendControl.exportMarkdown).toContain("Stop rule:");
    expect(heldSendControl.requestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(heldSendControl.verifierHref).toContain("/receipt-verifier?");
    expect(heldSendControl.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);

    const closeoutResult = verifyQuickBuyerEvidenceAdoptionRiskOwnerCloseoutRequest(closeoutRequest);
    expect(QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_VERIFY_PATH).toBe("/api/quick-buyer-evidence-adoption-risk-owner-closeout/verify");
    expect(closeoutResult).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-buyer-evidence-adoption-risk-owner-closeout.receipt.verify",
        verification: {
          status: "verified"
        },
        receipt: {
          receiptVersion: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_RECEIPT_VERSION,
          status: "watch",
          decision: "hold-risk-closeout",
          closedTaskCount: 2,
          taskCount: 4,
          sourceLedgerHash: receipt.payload.sourceLedgerHash,
          nextOwner: "Proof owner"
        }
      }
    });

    const result = verifyQuickBuyerEvidenceAdoptionRiskDispositionRequest(request);
    expect(QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_VERIFY_PATH).toBe("/api/quick-buyer-evidence-adoption-risk-disposition/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-buyer-evidence-adoption-risk-disposition.receipt.verify",
        verification: {
          status: "verified"
        },
        receipt: {
          receiptVersion: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_RECEIPT_VERSION,
          status: "watch",
          decision: "repair-open-risk",
          clearanceScore: ledger.clearanceScore,
          riskTotal: 5,
          nextOwner: "Proof owner"
        }
      }
    });

    const heldSendControlResult = verifyQuickBuyerEvidenceAdoptionRiskSendControlRequest(heldSendControlRequest);
    expect(QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_VERIFY_PATH).toBe("/api/quick-buyer-evidence-adoption-risk-send-control/verify");
    expect(heldSendControlResult).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-buyer-evidence-adoption-risk-send-control.receipt.verify",
        verification: {
          status: "verified"
        },
        receipt: {
          receiptVersion: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_RECEIPT_VERSION,
          status: "blocked",
          decision: "hold-buyer-send",
          sourceRiskCloseoutChecksum: `fnv1a32:${closeout.checksum}`,
          sourceLedgerHash: receipt.payload.sourceLedgerHash,
          nextOwner: "Proof owner"
        }
      }
    });

    const acceptedCloseout = buildQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt({
      receipt,
      handoff,
      acceptedBy: "Proof owner",
      evidenceNote: "All owner risk tasks are closed and ready for recheck.",
      closedTaskIds: handoff.tasks.map((task) => task.id),
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const acceptedRecheck = buildQuickBuyerEvidenceAdoptionRiskRecheckPacket(acceptedCloseout);
    expect(acceptedRecheck).toMatchObject({
      status: "watch",
      headline: "Risk recheck is ready to schedule from the verified closeout",
      readyCount: 2,
      stepTotal: 4,
      currentOwner: "Proof owner"
    });
    expect(acceptedRecheck.steps.map((step) => step.id)).toEqual([
      "rerun-adoption-risk-ledger",
      "reopen-buyer-send-approval",
      "rerun-live-proof-sweep",
      "record-send-decision"
    ]);
    expect(acceptedRecheck.exportMarkdown).toContain("Reopen buyer-send approval");
    const acceptedSendControl = buildQuickBuyerEvidenceAdoptionRiskSendControlReceipt({
      closeout: acceptedCloseout,
      recheck: acceptedRecheck,
      generatedAt: "2026-07-03T00:00:00.000Z"
    });
    expect(acceptedSendControl).toMatchObject({
      payload: {
        status: "watch",
        decision: "run-risk-recheck",
        recheckReadyCount: 2,
        recheckStepTotal: 4,
        nextOwner: "Proof owner"
      }
    });
    expect(acceptedSendControl.payload.criteria.map((criterion) => `${criterion.id}:${criterion.status}`)).toEqual([
      "risk-owner-closeout:pass",
      "risk-recheck-runbook:pass",
      "live-proof-sweep:watch",
      "send-decision-record:watch"
    ]);
    expect(acceptedSendControl.exportMarkdown).toContain("Run the live proof audit one more time before sharing externally.");
  });

  test("rejects checksum mismatches and invalid requests", () => {
    const payload = payloadForRiskLedger();
    const ledger = buildQuickBuyerEvidenceAdoptionRiskLedger(payload);
    const receipt = buildQuickBuyerEvidenceAdoptionRiskDispositionReceipt({
      payload,
      ledger,
      decision: "repair-open-risk",
      generatedAt: "2026-07-01T00:00:00.000Z"
    });
    const request = JSON.parse(receipt.requestJson) as { checksum: string; payload: typeof receipt.payload };

    const mismatch = verifyQuickBuyerEvidenceAdoptionRiskDispositionRequest({
      checksum: request.checksum,
      payload: {
        ...request.payload,
        reviewerNote: "Tampered risk note"
      }
    });
    expect(mismatch).toMatchObject({
      statusCode: 422,
      body: {
        verification: {
          status: "mismatch"
        }
      }
    });

    const invalid = verifyQuickBuyerEvidenceAdoptionRiskDispositionRequest({
      checksum: request.checksum,
      payload: {
        ...request.payload,
        sourceLedgerHash: "not-a-ledger-hash"
      }
    });
    expect(invalid.statusCode).toBe(400);

    const handoff = buildQuickBuyerEvidenceAdoptionRiskDispositionOwnerHandoff(receipt);
    const closeout = buildQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt({
      receipt,
      handoff,
      closedTaskIds: ["attach-risk-disposition-receipt"],
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const closeoutRequest = JSON.parse(closeout.requestJson) as { checksum: string; payload: typeof closeout.payload };
    const closeoutMismatch = verifyQuickBuyerEvidenceAdoptionRiskOwnerCloseoutRequest({
      checksum: closeoutRequest.checksum,
      payload: {
        ...closeoutRequest.payload,
        evidenceNote: "Tampered closeout evidence"
      }
    });
    expect(closeoutMismatch).toMatchObject({
      statusCode: 422,
      body: {
        verification: {
          status: "mismatch"
        }
      }
    });

    const closeoutInvalid = verifyQuickBuyerEvidenceAdoptionRiskOwnerCloseoutRequest({
      checksum: closeoutRequest.checksum,
      payload: {
        ...closeoutRequest.payload,
        sourceDispositionChecksum: "not-a-checksum"
      }
    });
    expect(closeoutInvalid.statusCode).toBe(400);

    const recheck = buildQuickBuyerEvidenceAdoptionRiskRecheckPacket(closeout);
    const sendControl = buildQuickBuyerEvidenceAdoptionRiskSendControlReceipt({
      closeout,
      recheck,
      generatedAt: "2026-07-03T00:00:00.000Z"
    });
    const sendControlRequest = JSON.parse(sendControl.requestJson) as { checksum: string; payload: typeof sendControl.payload };
    const sendControlMismatch = verifyQuickBuyerEvidenceAdoptionRiskSendControlRequest({
      checksum: sendControlRequest.checksum,
      payload: {
        ...sendControlRequest.payload,
        stopRule: "Tampered stop rule"
      }
    });
    expect(sendControlMismatch).toMatchObject({
      statusCode: 422,
      body: {
        verification: {
          status: "mismatch"
        }
      }
    });

    const sendControlInvalid = verifyQuickBuyerEvidenceAdoptionRiskSendControlRequest({
      checksum: sendControlRequest.checksum,
      payload: {
        ...sendControlRequest.payload,
        sourceRiskCloseoutChecksum: "not-a-checksum"
      }
    });
    expect(sendControlInvalid.statusCode).toBe(400);
  });

  test("dispatches through the receipt verification desk", () => {
    const payload = payloadForRiskLedger();
    const ledger = buildQuickBuyerEvidenceAdoptionRiskLedger(payload);
    const receipt = buildQuickBuyerEvidenceAdoptionRiskDispositionReceipt({
      payload,
      ledger,
      decision: "repair-open-risk",
      reviewerName: "Risk reviewer",
      generatedAt: "2026-07-01T00:00:00.000Z"
    });
    const result = verifyReceiptVerificationDeskRequest(JSON.parse(receipt.requestJson));

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        verified: true,
        receiptType: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_RECEIPT_VERSION,
        receiptLabel: "Buyer adoption risk disposition",
        sourceVerifierApiPath: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_VERIFY_PATH,
        nativeSkill: "quick-buyer-evidence-adoption-risk-disposition.receipt.verify"
      }
    });

    const handoff = buildQuickBuyerEvidenceAdoptionRiskDispositionOwnerHandoff(receipt);
    const closeout = buildQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt({
      receipt,
      handoff,
      acceptedBy: "Proof owner",
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    const closeoutResult = verifyReceiptVerificationDeskRequest(JSON.parse(closeout.requestJson));
    expect(closeoutResult).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        verified: true,
        receiptType: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_RECEIPT_VERSION,
        receiptLabel: "Buyer adoption risk owner closeout",
        sourceVerifierApiPath: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_VERIFY_PATH,
        nativeSkill: "quick-buyer-evidence-adoption-risk-owner-closeout.receipt.verify"
      }
    });

    const recheck = buildQuickBuyerEvidenceAdoptionRiskRecheckPacket(closeout);
    const sendControl = buildQuickBuyerEvidenceAdoptionRiskSendControlReceipt({
      closeout,
      recheck,
      generatedAt: "2026-07-03T00:00:00.000Z"
    });
    const sendControlResult = verifyReceiptVerificationDeskRequest(JSON.parse(sendControl.requestJson));
    expect(sendControlResult).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        verified: true,
        receiptType: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_RECEIPT_VERSION,
        receiptLabel: "Buyer-send adoption risk control",
        sourceVerifierApiPath: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_VERIFY_PATH,
        nativeSkill: "quick-buyer-evidence-adoption-risk-send-control.receipt.verify"
      }
    });
  });
});
