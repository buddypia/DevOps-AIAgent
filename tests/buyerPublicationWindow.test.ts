import { describe, expect, test } from "vitest";
import { buildBuyerPublicationWindowSnapshot, type BuyerPublicationWindowBuildInput } from "../src/buyerPublicationWindow";
import type { BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";

function proofVerification(patch: Partial<BuyerShareGateProofVerificationSummary> = {}): BuyerShareGateProofVerificationSummary {
  return {
    checkedAt: "2026-06-20T00:00:00.000Z",
    verifiedCount: 5,
    totalCount: 5,
    score: 100,
    results: [
      { id: "targetUrl", label: "Live product", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
      { id: "protopediaUrl", label: "ProtoPedia story", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
      { id: "videoUrl", label: "Walkthrough video", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
      { id: "pilotEvidenceUrl", label: "Pilot receipt", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
      { id: "workOrderEvidenceUrl", label: "Work order proof", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." }
    ],
    ...patch
  };
}

function baseInput(patch: Partial<BuyerPublicationWindowBuildInput> = {}): BuyerPublicationWindowBuildInput {
  return {
    proofVerification: proofVerification(),
    proofChain: { status: "ready" },
    publicDecisionPath: { status: "ready", decision: "send-to-buyer" },
    trustSnapshot: { status: "ready" },
    currentAuditHref: "/buyer-proof-audit",
    trustManifestHref: "/buyer-trust-manifest",
    launchRoomHref: "/launch-room",
    now: new Date("2026-06-20T08:00:00.000Z"),
    ...patch
  };
}

describe("buyer publication window", () => {
  test("turns a fresh proof window into an explicit send contract", () => {
    const snapshot = buildBuyerPublicationWindowSnapshot(baseInput());

    expect(snapshot.status).toBe("ready");
    expect(snapshot.handoffContract).toMatchObject({
      mode: "send",
      status: "ready",
      headline: "Send only with this live proof receipt attached",
      primaryOwner: "Launch operator",
      proofAgeHours: 8,
      verifiedCount: 5,
      totalCount: 5
    });
    expect(snapshot.handoffContract.stopRules.map((rule) => [rule.id, rule.status])).toEqual([
      ["live-proof-current", "ready"],
      ["proof-links-open", "ready"],
      ["proof-chain-sealed", "ready"],
      ["trust-manifest-current", "ready"],
      ["buyer-decision-clear", "ready"]
    ]);
    expect(snapshot.exportMarkdown).toContain("## Handoff contract");
    expect(snapshot.exportMarkdown).toContain("Mode: send");
    expect(snapshot.exportMarkdown).toContain("Verified proof: 5/5");
    expect(snapshot.exportMarkdown).toContain("### Stop rules");
  });

  test("holds handoff when live proof has never run", () => {
    const snapshot = buildBuyerPublicationWindowSnapshot(
      baseInput({
        proofVerification: null
      })
    );

    expect(snapshot.status).toBe("blocked");
    expect(snapshot.handoffContract).toMatchObject({
      mode: "hold",
      primaryOwner: "Launch operator",
      proofAgeHours: null,
      verifiedCount: 0,
      totalCount: 0
    });
    expect(snapshot.handoffContract.summary).toBe("Live proof is current: Run Verify live links before any external handoff.");
    expect(snapshot.handoffContract.stopRules[0]).toMatchObject({
      id: "live-proof-current",
      status: "blocked",
      evidence: "Live proof verification has not run in this workspace.",
      href: "/buyer-proof-audit"
    });
    expect(snapshot.firstAction).toMatchObject({ label: "Fix Live proof recheck", href: "/buyer-proof-audit" });
  });

  test("points the hold contract at the blocked proof link when freshness is still current", () => {
    const verification = proofVerification({
      verifiedCount: 4,
      score: 80,
      results: proofVerification().results.map((result) =>
        result.id === "videoUrl"
          ? {
              ...result,
              status: "block" as const,
              httpStatus: 403,
              evidence: "HTTP 403; reviewer cannot open the walkthrough.",
              action: "Publish an unlisted walkthrough URL and rerun verification."
            }
          : result
      )
    });
    const snapshot = buildBuyerPublicationWindowSnapshot(baseInput({ proofVerification: verification }));

    expect(snapshot.status).toBe("blocked");
    expect(snapshot.handoffContract.mode).toBe("hold");
    expect(snapshot.handoffContract.summary).toBe("Every proof link opens: Publish an unlisted walkthrough URL and rerun verification.");
    expect(snapshot.handoffContract.stopRules.find((rule) => rule.id === "live-proof-current")).toMatchObject({
      status: "ready"
    });
    expect(snapshot.handoffContract.stopRules.find((rule) => rule.id === "proof-links-open")).toMatchObject({
      status: "blocked",
      evidence: "4/5 links verified. Walkthrough video: HTTP 403; reviewer cannot open the walkthrough.",
      action: "Publish an unlisted walkthrough URL and rerun verification."
    });
  });

  test("moves to review mode when proof is fresh but near expiry", () => {
    const snapshot = buildBuyerPublicationWindowSnapshot(
      baseInput({
        now: new Date("2026-06-20T20:00:00.000Z")
      })
    );

    expect(snapshot.status).toBe("attention");
    expect(snapshot.timeboxLabel).toBe("4h proof window");
    expect(snapshot.handoffContract).toMatchObject({
      mode: "review",
      proofAgeHours: 20
    });
    expect(snapshot.handoffContract.summary).toBe("Live proof is current: Rerun live verification before buyer or sponsor review.");
    expect(snapshot.handoffContract.stopRules.find((rule) => rule.id === "proof-links-open")).toMatchObject({
      status: "ready"
    });
  });
});
