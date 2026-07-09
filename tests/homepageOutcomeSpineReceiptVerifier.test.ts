import { describe, expect, test } from "vitest";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import { verifyHomepageOutcomeSpineReceiptRequest } from "../server/homepageOutcomeSpineReceiptVerifier";
import {
  HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH,
  HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERSION,
  homepageOutcomeSpineReceiptChecksum,
  type HomepageOutcomeSpineReceiptPayload
} from "../src/homepageOutcomeSpineReceipt";

function samplePayload(): HomepageOutcomeSpineReceiptPayload {
  return {
    receiptVersion: HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERSION,
    source: "homepage-outcome-spine",
    buyer: "Platform release lead",
    status: "blocked",
    proofScore: 79,
    proofReadyCount: 1,
    proofItemCount: 4,
    packetReadyCount: 1,
    packetItemCount: 4,
    publishabilityDecision: "do-not-publish",
    reviewerDecision: "repair-before-share",
    primaryAction: {
      label: "Open repair plan",
      href: "/buyer-proof-room"
    },
    sendRule: "Do not send until public proof closes.",
    currentRoute: "Close public proof before buyer sharing. Open repair plan.",
    steps: [
      {
        id: "workflow",
        label: "Workflow",
        status: "ready",
        title: "Start with workflow",
        evidence: "One workflow note is attached.",
        href: "#quick-workflow-intake",
        actionLabel: "Start with workflow"
      },
      {
        id: "value",
        label: "Value",
        status: "ready",
        title: "1,027,000 yen",
        evidence: "Measured value is attached.",
        href: "/buyer-value",
        actionLabel: "Open value report"
      },
      {
        id: "proof",
        label: "Proof",
        status: "blocked",
        title: "1/4 proof rails ready",
        evidence: "Public proof is not ready.",
        href: "/buyer-proof-room",
        actionLabel: "Open repair plan"
      },
      {
        id: "packet",
        label: "Packet",
        status: "blocked",
        title: "1/4 packet artifacts ready",
        evidence: "Public story proof is missing.",
        href: "#launch-evidence-console",
        actionLabel: "Fix public story proof"
      },
      {
        id: "decision",
        label: "Decision",
        status: "blocked",
        title: "What must close before this buyer can review the room?",
        evidence: "Do not send until proof closes.",
        href: "/buyer-proof-room",
        actionLabel: "Open repair plan"
      }
    ]
  };
}

describe("homepage outcome spine receipt verifier", () => {
  test("verifies a first buyer decision route receipt", () => {
    const payload = samplePayload();
    const checksum = homepageOutcomeSpineReceiptChecksum(payload);
    const result = verifyHomepageOutcomeSpineReceiptRequest({ checksum, payload });

    expect(HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH).toBe("/api/homepage-outcome-spine/receipt/verify");
    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "homepage-outcome-spine.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: checksum,
        actualChecksum: checksum
      },
      receipt: {
        receiptVersion: HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERSION,
        source: "homepage-outcome-spine",
        buyer: "Platform release lead",
        status: "blocked",
        proofScore: 79,
        packetReadyCount: 1,
        packetItemCount: 4,
        publishabilityDecision: "do-not-publish",
        reviewerDecision: "repair-before-share",
        stepCount: 5,
        firstBlockedStep: "Proof",
        firstAction: "Open repair plan"
      }
    });
  });

  test("rejects mismatched route receipt checksums", () => {
    const payload = samplePayload();
    const result = verifyHomepageOutcomeSpineReceiptRequest({
      checksum: "00000000",
      payload
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      skill: "homepage-outcome-spine.receipt.verify",
      verification: {
        status: "mismatch",
        expectedChecksum: "00000000"
      }
    });
  });

  test("rejects malformed route receipt requests", () => {
    const result = verifyHomepageOutcomeSpineReceiptRequest({
      checksum: "not-valid",
      payload: {
        receiptVersion: HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERSION
      }
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });

  test("dispatches through the generic receipt verification desk", () => {
    const payload = samplePayload();
    const checksum = homepageOutcomeSpineReceiptChecksum(payload);
    const result = verifyReceiptVerificationDeskRequest({ checksum, payload });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "receipt-verifier.dispatch",
      status: "verified",
      verified: true,
      receiptType: HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERSION,
      receiptLabel: "Homepage outcome spine",
      sourceVerifierApiPath: HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH
    });
  });
});
