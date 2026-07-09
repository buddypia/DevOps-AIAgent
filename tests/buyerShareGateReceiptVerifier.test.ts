import { describe, expect, it } from "vitest";
import { verifyBuyerShareGateReceiptRequest } from "../server/buyerShareGateReceiptVerifier";
import { buildBuyerShareGate, type BuyerShareGateProofLink, type BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";
import type { BuyerPilotCommand } from "../src/buyerPilotCommand";
import type { BuyerPilotMeasuredRunSummary } from "../src/buyerPilotMeasuredRun";

const proofLinks: BuyerShareGateProofLink[] = [
  { id: "targetUrl", label: "Deployed URL", value: "https://launch.example/app", href: "#launch-evidence-console" },
  { id: "protopediaUrl", label: "ProtoPedia URL", value: "https://protopedia.net/project/example", href: "#launch-evidence-console" },
  { id: "videoUrl", label: "Demo video", value: "https://video.example/demo", href: "#launch-evidence-console" },
  { id: "pilotEvidenceUrl", label: "Pilot receipt", value: "https://launch.example/pilot-receipt", href: "#pilot-run-receipt" },
  { id: "workOrderEvidenceUrl", label: "Work order proof", value: "https://launch.example/work-order", href: "#buyer-work-order-studio" }
];

const measuredRun: BuyerPilotMeasuredRunSummary = {
  readiness: "measured",
  actualMinutesSavedPerRun: 82,
  acceptanceRatePercent: 90,
  measuredMonthlyHoursSaved: 72.2,
  measuredMonthlyLaborValueYen: 866000,
  measuredMonthlyValueYen: 1046000,
  headline: "Measured pilot value is ready to cite"
};

function proofVerification(): BuyerShareGateProofVerificationSummary {
  return {
    checkedAt: "2026-06-20T00:00:00.000Z",
    verifiedCount: 5,
    totalCount: 5,
    score: 100,
    results: proofLinks.map((link) => ({
      id: link.id,
      label: link.label,
      status: "pass",
      httpStatus: 200,
      evidence: "Public URL responded with HTTP 200.",
      action: "Keep this link attached to the launch room."
    }))
  };
}

function command(): BuyerPilotCommand {
  return {
    readiness: "buyer-ready",
    launchScore: 96,
    headline: "Share the launch room with a buyer",
    targetBuyer: "Platform lead",
    primaryMetric: "1,200,000 yen modeled value",
    proofClosure: "8/8 artifacts sealed",
    pathLabel: "Ready for external review",
    nextGap: {
      label: "Buyer proof packet",
      owner: "Sponsor owner",
      action: "Send the packet.",
      href: "https://launch.example/buyer-proof-packet",
      editHref: "#launch-evidence-console"
    },
    gapQueue: [],
    steps: [
      "buyer-value",
      "work-order-brief",
      "buyer-proof-packet",
      "sponsor-review",
      "pilot-run-receipt",
      "adoption-plan",
      "trust-center",
      "commercial-offer"
    ].map((id) => ({
      id,
      label: id,
      status: "ready",
      owner: "Owner",
      href: `https://launch.example/${id}`,
      editHref: `#${id}`,
      summary: "Ready",
      isCurrent: false
    }))
  };
}

function sampleReceipt() {
  return buildBuyerShareGate({
    command: command(),
    proofLinks,
    measuredRun,
    proofVerification: proofVerification(),
    now: new Date("2026-06-20T08:00:00.000Z")
  }).receipt;
}

describe("buyer share gate receipt verifier", () => {
  it("verifies an untampered share gate receipt payload", () => {
    const receipt = sampleReceipt();

    const result = verifyBuyerShareGateReceiptRequest({
      checksum: receipt.checksum,
      payload: receipt.payload
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "buyer-share-gate.receipt.verify",
      verification: {
        status: "verified",
        expectedChecksum: receipt.checksum,
        actualChecksum: receipt.checksum
      },
      receipt: {
        receiptVersion: "buyer-share-gate.v1",
        readiness: "send-ready",
        mode: "send",
        score: 100
      }
    });
  });

  it("returns 422 when the receipt payload no longer matches the checksum", () => {
    const receipt = sampleReceipt();

    const result = verifyBuyerShareGateReceiptRequest({
      checksum: receipt.checksum,
      payload: {
        ...receipt.payload,
        mode: "hold"
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

  it("rejects malformed share gate receipt requests", () => {
    const result = verifyBuyerShareGateReceiptRequest({
      checksum: "not-a-checksum",
      payload: {}
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
