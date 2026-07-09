import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import {
  QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERIFY_PATH,
  verifyQuickPublicValueReleaseReceiptRequest
} from "../server/quickPublicValueReleaseReceiptVerifier";
import {
  QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION,
  quickPublicValueReleaseReceiptChecksum,
  type QuickPublicValueReleaseReceiptPayload
} from "../src/quickPublicValueReleaseReceipt";

function samplePayload(): QuickPublicValueReleaseReceiptPayload {
  return {
    receiptVersion: QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION,
    source: "quick-workflow-intake",
    buyer: "Platform release lead",
    workflow: "Weekly release readiness review",
    status: "blocked",
    label: "Value locked",
    releaseScore: 50,
    shareableMonthlyValueYen: 0,
    lockedMonthlyValueYen: 328000,
    nextOwner: "Recording owner",
    nextAction: "Record the five-shot walkthrough and attach a public video URL.",
    releaseRule: "Do not cite the monthly value externally until Recording owner completes the walkthrough proof.",
    sourceReceiptId: "quick-conversion-blocked-12345678",
    sourceChecksum: "fnv1a32:abcdef12",
    sponsorGateReceiptId: "quick-sponsor-gate-repair-before-sponsor-87654321",
    liveProofAuditReceiptId: "",
    liveProofAuditChecksum: "",
    publicationReadyCount: 1,
    publicationTotalCount: 4,
    checks: [
      {
        id: "value",
        label: "Value floor",
        status: "ready",
        value: "¥328,000/month",
        evidence: "Downside value floor is calculated from measured pilot savings.",
        owner: "Finance owner",
        action: "Keep downside assumptions attached to the public value claim."
      },
      {
        id: "sponsor",
        label: "Sponsor send gate",
        status: "watch",
        value: "Repair before sponsor / 85/100",
        evidence: "Sponsor questions are mostly answered, but open proof still needs review.",
        owner: "Proof owner",
        action: "Close the first public proof repair before sponsor review."
      },
      {
        id: "publication",
        label: "Publication kit",
        status: "blocked",
        value: "1/4 items ready",
        evidence: "Walkthrough video and ProtoPedia story are not ready.",
        owner: "Recording owner",
        action: "Record the five-shot walkthrough and attach a public video URL."
      },
      {
        id: "live-proof",
        label: "Live proof freshness",
        status: "blocked",
        value: "No fresh proof receipt",
        evidence: "Run live proof verification to issue a fresh receipt before public sharing.",
        owner: "Proof owner",
        action: "Run live proof verification before public sharing."
      }
    ]
  };
}

describe("quick public value release receipt verifier", () => {
  test("verifies a public value release gate replay payload", () => {
    const payload = samplePayload();
    const checksum = quickPublicValueReleaseReceiptChecksum(payload);
    const result = verifyQuickPublicValueReleaseReceiptRequest({ checksum, payload });

    expect(QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERIFY_PATH).toBe("/api/quick-public-value-release/receipt/verify");
    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-public-value-release.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: checksum,
          actualChecksum: checksum
        },
        receipt: {
          receiptVersion: QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION,
          source: "quick-workflow-intake",
          buyer: "Platform release lead",
          status: "blocked",
          releaseScore: 50,
          shareableMonthlyValueYen: 0,
          lockedMonthlyValueYen: 328000,
          blockedCount: 2,
          watchCount: 1,
          sourceReceiptId: "quick-conversion-blocked-12345678",
          sourceChecksum: "fnv1a32:abcdef12",
          nextOwner: "Recording owner"
        }
      }
    });
  });

  test("returns mismatch if the locked value changes after export", () => {
    const payload = samplePayload();
    const checksum = quickPublicValueReleaseReceiptChecksum(payload);
    const result = verifyQuickPublicValueReleaseReceiptRequest({
      checksum,
      payload: {
        ...payload,
        lockedMonthlyValueYen: 1
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

  test("rejects malformed public value release receipts", () => {
    const result = verifyQuickPublicValueReleaseReceiptRequest({
      checksum: "not-valid",
      payload: {
        receiptVersion: QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches blocked release receipts through the generic verifier desk as hold packets", () => {
    const payload = samplePayload();
    const checksum = quickPublicValueReleaseReceiptChecksum(payload);
    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION,
        receiptLabel: "Public value release gate",
        proofField: "checksum",
        sourceVerifierApiPath: QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERIFY_PATH,
        nativeSkill: "quick-public-value-release.receipt.verify",
        handoff: {
          decision: "accept-receipt-hold-packet"
        }
      }
    });
  });
});
