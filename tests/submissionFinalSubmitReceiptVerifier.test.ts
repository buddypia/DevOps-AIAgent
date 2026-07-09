import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import { SUBMISSION_FINAL_SUBMIT_RECEIPT_VERIFY_PATH, verifySubmissionFinalSubmitReceiptRequest } from "../server/submissionFinalSubmitReceiptVerifier";
import {
  buildSubmissionFinalSubmitReceipt,
  submissionFinalSubmitReceiptChecksum
} from "../src/submissionFinalSubmitReceipt";
import type { BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";
import type { CloseoutFinalSubmitHandoff } from "../src/submissionCloseout";

function handoff(status: CloseoutFinalSubmitHandoff["status"] = "watch"): CloseoutFinalSubmitHandoff {
  const protopediaUrl = status === "ready" ? "https://protopedia.net/prototype/999999" : "";
  const videoUrl = status === "ready" ? "https://youtu.be/demo1234567" : "";
  return {
    id: `final-submit-handoff-${status}`,
    status,
    readiness: status === "ready" ? "findy-form-sealed" : "external-url-watch",
    lockScore: status === "ready" ? 100 : 86,
    headline: status === "ready" ? "Findy final form is ready to submit" : "Final form is ready except published URLs",
    summary: status === "ready" ? "All final submission fields are sealed." : "2 final submission URL fields need repair.",
    deadline: "2026-07-10 23:59 JST",
    readyCount: status === "ready" ? 8 : 6,
    openCount: status === "ready" ? 0 : 2,
    invalidCount: 0,
    verifyApiPath: "/api/proof-links/verify",
    liveProofLinks: [
      { id: "github-url", label: "Public GitHub repository URL", value: "https://github.com/buddypia/DevOps-AIAgent" },
      { id: "deployed-url", label: "Deployed Cloud Run URL", value: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app" },
      { id: "protopedia-url", label: "ProtoPedia work URL", value: protopediaUrl },
      { id: "video-url", label: "Video URL", value: videoUrl }
    ],
    fields: [
      { id: "github-url", label: "Public GitHub repository URL", target: "Findy final submission form", status: "ready", value: "https://github.com/buddypia/DevOps-AIAgent", proof: "present", acceptance: "pasteable" },
      { id: "deployed-url", label: "Deployed Cloud Run URL", target: "Findy final submission form", status: "ready", value: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app", proof: "present", acceptance: "pasteable" },
      { id: "protopedia-url", label: "ProtoPedia work URL", target: "Findy final submission form", status: status === "ready" ? "ready" : "watch", value: protopediaUrl, proof: "external", acceptance: "pasteable" },
      { id: "video-url", label: "Video URL", target: "ProtoPedia media field", status: status === "ready" ? "ready" : "watch", value: videoUrl, proof: "external", acceptance: "playable" },
      { id: "findy-tag", label: "Required tag", target: "ProtoPedia tags", status: "ready", value: "findy_hackathon", proof: "tag", acceptance: "tagged" },
      { id: "work-status", label: "ProtoPedia work status", target: "ProtoPedia work status", status: "ready", value: "完成", proof: "status", acceptance: "complete" },
      { id: "proof-receipt", label: "Judge Proof receipt", target: "Submission memo / video description", status: "ready", value: "abc123", proof: "receipt", acceptance: "checkable" },
      { id: "deadline", label: "Submission deadline", target: "Operator checklist", status: "ready", value: "2026-07-10 23:59 JST", proof: "deadline", acceptance: "absolute time" }
    ],
    pasteOrder: [],
    exportMarkdown: "# Findy final submission handoff",
    exportHref: "data:text/markdown;charset=utf-8,%23%20Findy"
  };
}

function liveProof(status: "ready" | "blocked" = "blocked"): BuyerShareGateProofVerificationSummary {
  const blocked = status === "blocked";
  return {
    checkedAt: "2026-06-27T00:00:00.000Z",
    verifiedCount: blocked ? 2 : 4,
    totalCount: 4,
    score: blocked ? 50 : 100,
    results: [
      {
        id: "github-url",
        label: "Public GitHub repository URL",
        status: "pass",
        httpStatus: 200,
        evidence: "Public URL responded with HTTP 200.",
        action: "Keep this link attached to the launch room."
      },
      {
        id: "deployed-url",
        label: "Deployed Cloud Run URL",
        status: "pass",
        httpStatus: 200,
        evidence: "Public URL responded with HTTP 200.",
        action: "Keep this link attached to the launch room."
      },
      {
        id: "protopedia-url",
        label: "ProtoPedia work URL",
        status: blocked ? "block" : "pass",
        httpStatus: blocked ? undefined : 200,
        evidence: blocked ? "No public URL is attached." : "Public URL responded with HTTP 200.",
        action: blocked ? "Attach a public URL for ProtoPedia work URL." : "Keep this link attached to the launch room."
      },
      {
        id: "video-url",
        label: "Video URL",
        status: blocked ? "block" : "pass",
        httpStatus: blocked ? undefined : 200,
        evidence: blocked ? "No public URL is attached." : "Public URL responded with HTTP 200.",
        action: blocked ? "Attach a public URL for Video URL." : "Keep this link attached to the launch room."
      }
    ]
  };
}

describe("submission final submit live receipt verifier", () => {
  test("issues and verifies an action-required final submission receipt", () => {
    const receipt = buildSubmissionFinalSubmitReceipt({ handoff: handoff(), liveProof: liveProof() });
    const result = verifySubmissionFinalSubmitReceiptRequest({ checksum: receipt.checksum, payload: receipt.payload });

    expect(SUBMISSION_FINAL_SUBMIT_RECEIPT_VERIFY_PATH).toBe("/api/submission-final-submit/receipt/verify");
    expect(receipt.receiptId).toMatch(/^submission-final-submit-action-required-[a-f0-9]{8}$/);
    expect(receipt.verificationRequestJson).toContain('"receiptVersion": "submission-final-submit-live-receipt.v1"');
    expect(receipt.exportMarkdown).toContain("API verification: POST /api/submission-final-submit/receipt/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "submission-final-submit.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: receipt.checksum,
          actualChecksum: receipt.checksum
        },
        receipt: {
          receiptVersion: "submission-final-submit-live-receipt.v1",
          status: "action-required",
          score: 50,
          verifiedCount: 2,
          totalCount: 4,
          blockedCount: 2,
          watchCount: 0,
          deadline: "2026-07-10 23:59 JST"
        }
      }
    });
  });

  test("marks the final receipt submit-ready only when the form and all public URLs pass", () => {
    const receipt = buildSubmissionFinalSubmitReceipt({ handoff: handoff("ready"), liveProof: liveProof("ready") });

    expect(receipt).toMatchObject({
      status: "submit-ready",
      score: 100,
      verifiedCount: 4,
      totalCount: 4,
      blockedCount: 0,
      watchCount: 0
    });
    expect(receipt.payload.nextAction).toContain("Attach this receipt to the final handoff");
  });

  test("rejects changed final submission receipts", () => {
    const receipt = buildSubmissionFinalSubmitReceipt({ handoff: handoff(), liveProof: liveProof() });
    const checksum = submissionFinalSubmitReceiptChecksum(receipt.payload);

    const result = verifySubmissionFinalSubmitReceiptRequest({
      checksum,
      payload: {
        ...receipt.payload,
        score: receipt.payload.score + 1
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

  test("dispatches final submission receipts through the receipt verification desk", () => {
    const receipt = buildSubmissionFinalSubmitReceipt({ handoff: handoff(), liveProof: liveProof() });

    const result = verifyReceiptVerificationDeskRequest({
      checksum: receipt.checksum,
      payload: receipt.payload
    });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "submission-final-submit-live-receipt.v1",
        receiptLabel: "Final submission live receipt",
        proofField: "checksum",
        sourceVerifierApiPath: "/api/submission-final-submit/receipt/verify",
        nativeSkill: "submission-final-submit.receipt.verify",
        handoff: {
          decision: "accept-receipt-hold-packet"
        }
      }
    });
  });
});
