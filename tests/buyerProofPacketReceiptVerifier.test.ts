import { describe, expect, it } from "vitest";
import { verifyBuyerProofPacketReceiptRequest } from "../server/buyerProofPacketReceiptVerifier";
import { buyerProofPacketReceiptDigest, type BuyerProofPacketReceiptPayload } from "../src/buyerProofPacket";

function receiptPayload(): BuyerProofPacketReceiptPayload {
  return {
    manifestVersion: "buyer-proof-packet.v1",
    packetId: "buyer-proof-packet-share-ready-91",
    readiness: "share-ready",
    packetScore: 91,
    headline: "Buyer proof packet is ready to share",
    targetBuyer: "Platform lead",
    decisionAsk: "Share this packet with the buyer sponsor.",
    coveredArtifacts: ["value-report", "proposal", "workflow", "receipt", "decision", "agreement", "review", "ledger", "diligence", "execution"],
    sourceScores: {
      recommendation: 92,
      valueBlueprint: 90,
      buyerScenario: 91,
      proposal: 90,
      ledger: 92,
      diligence: 90,
      sponsorReview: 93,
      evidenceRows: 91
    },
    rows: [
      {
        id: "buyer-outcome",
        status: "clear",
        owner: "A2A Market Broker",
        artifactId: "value-report",
        claim: "Buyer can inspect modeled value.",
        evidence: "91/100 buyer value score.",
        nextAction: "Keep the value report attached."
      }
    ],
    gaps: [],
    realityChecks: [
      {
        label: "Modeled value",
        value: "112h/month, 1,344,000 yen",
        source: "Buyer value report"
      }
    ]
  };
}

describe("buyer proof packet receipt verifier", () => {
  it("verifies an untampered packet receipt payload", () => {
    const payload = receiptPayload();
    const digest = buyerProofPacketReceiptDigest(payload);

    const result = verifyBuyerProofPacketReceiptRequest({ digest, payload });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      skill: "buyer-proof-packet.receipt.verify",
      verification: {
        status: "verified",
        expectedDigest: digest,
        actualDigest: digest
      },
      receipt: {
        manifestVersion: "buyer-proof-packet.v1",
        packetId: payload.packetId,
        readiness: "share-ready",
        targetBuyer: "Platform lead"
      }
    });
  });

  it("returns 422 when a receipt payload is changed after export", () => {
    const payload = receiptPayload();
    const digest = buyerProofPacketReceiptDigest(payload);

    const result = verifyBuyerProofPacketReceiptRequest({
      digest,
      payload: {
        ...payload,
        packetScore: payload.packetScore - 7
      }
    });

    expect(result.statusCode).toBe(422);
    expect(result.body).toMatchObject({
      verification: {
        status: "mismatch",
        expectedDigest: digest
      }
    });
  });

  it("rejects malformed packet receipt verification requests", () => {
    const result = verifyBuyerProofPacketReceiptRequest({
      digest: "not-a-digest",
      payload: {}
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "invalid_request"
    });
  });
});
