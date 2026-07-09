import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import { WORKFLOW_LIVE_PROOF_AUDIT_VERIFY_PATH, verifyWorkflowLiveProofAuditRequest } from "../server/workflowLiveProofAuditReceiptVerifier";
import { buildWorkflowLiveProofAudit, workflowLiveProofAuditChecksum } from "../src/workflowLiveProofAudit";
import type { WorkflowIntakeProofSlot } from "../src/workflowIntakeShareGate";

function proofSlots(): WorkflowIntakeProofSlot[] {
  return [
    { id: "targetUrl", label: "Deployed URL", value: "https://release.opsbridge.ai", href: "#targetUrl" },
    { id: "pilotEvidenceUrl", label: "Pilot receipt", value: "https://release.opsbridge.ai/pilot.json", href: "#pilotEvidenceUrl" }
  ];
}

describe("workflow live proof audit receipt verifier", () => {
  test("verifies live proof audit receipts", () => {
    const audit = buildWorkflowLiveProofAudit({
      proofLinks: proofSlots(),
      proofVerification: {
        checkedAt: "2026-06-25T11:30:00.000Z",
        verifiedCount: 2,
        totalCount: 2,
        score: 100,
        results: [
          {
            id: "targetUrl",
            label: "Deployed URL",
            status: "pass",
            httpStatus: 200,
            evidence: "Public URL responded with HTTP 200.",
            action: "Keep this link attached to the launch room."
          },
          {
            id: "pilotEvidenceUrl",
            label: "Pilot receipt",
            status: "pass",
            httpStatus: 200,
            evidence: "Public URL responded with HTTP 200.",
            action: "Keep this link attached to the launch room."
          }
        ]
      }
    });

    const result = verifyWorkflowLiveProofAuditRequest({ checksum: audit.checksum, payload: audit.payload });

    expect(WORKFLOW_LIVE_PROOF_AUDIT_VERIFY_PATH).toBe("/api/workflow-live-proof-audit/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "workflow-live-proof-audit.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: audit.checksum,
          actualChecksum: audit.checksum
        },
        receipt: {
          receiptVersion: "workflow-live-proof-audit.v1",
          status: "verified",
          checkedAt: "2026-06-25T11:30:00.000Z",
          score: 100,
          verifiedCount: 2,
          totalCount: 2,
          blockedCount: 0,
          watchCount: 0
        }
      }
    });
    expect(audit.verificationRequestJson).toContain('"receiptVersion": "workflow-live-proof-audit.v1"');
    expect(audit.verificationRequestHref).toContain("data:application/json");
    expect(audit.exportMarkdown).toContain("API verification: POST /api/workflow-live-proof-audit/verify");
  });

  test("rejects changed live proof audit receipts", () => {
    const audit = buildWorkflowLiveProofAudit({ proofLinks: proofSlots() });
    const checksum = workflowLiveProofAuditChecksum(audit.payload);

    const result = verifyWorkflowLiveProofAuditRequest({
      checksum,
      payload: {
        ...audit.payload,
        score: audit.payload.score + 1
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

  test("keeps malformed live proof audit requests out of the verifier", () => {
    const result = verifyWorkflowLiveProofAuditRequest({
      checksum: "12345678",
      payload: {
        receiptVersion: "workflow-live-proof-audit.v1"
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches live proof audit receipts through the receipt verification desk", () => {
    const audit = buildWorkflowLiveProofAudit({ proofLinks: proofSlots() });

    const result = verifyReceiptVerificationDeskRequest({
      checksum: audit.checksum,
      payload: audit.payload
    });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "workflow-live-proof-audit.v1",
        receiptLabel: "Workflow live proof audit",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/workflow-live-proof-audit/verify",
        nativeSkill: "workflow-live-proof-audit.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
  });
});
