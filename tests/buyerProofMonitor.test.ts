import { describe, expect, it } from "vitest";
import { buildBuyerProofMonitor, renderBuyerProofMonitorHtml } from "../src/buyerProofMonitor";
import type { BuyerShareGateProofLink, BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";

const proofLinks: BuyerShareGateProofLink[] = [
  { id: "targetUrl", label: "Deployed URL", value: "https://launch.example/app", href: "#launch-evidence-console" },
  { id: "protopediaUrl", label: "ProtoPedia URL", value: "https://protopedia.net/project/example", href: "#launch-evidence-console" },
  { id: "videoUrl", label: "Demo video", value: "https://video.example/demo", href: "#launch-evidence-console" },
  { id: "pilotEvidenceUrl", label: "Pilot receipt", value: "https://launch.example/pilot-receipt", href: "#pilot-run-receipt" },
  { id: "workOrderEvidenceUrl", label: "Work order proof", value: "https://launch.example/work-order", href: "#buyer-work-order-studio" }
];

function verification(patch: Partial<BuyerShareGateProofVerificationSummary> = {}): BuyerShareGateProofVerificationSummary {
  return {
    checkedAt: "2026-06-20T00:00:00.000Z",
    verifiedCount: 5,
    totalCount: 5,
    score: 100,
    results: proofLinks.map((link) => ({
      id: link.id,
      label: link.label,
      status: "pass" as const,
      httpStatus: 200,
      evidence: "Public URL responded with HTTP 200.",
      action: "Keep this link attached to the launch room."
    })),
    ...patch
  };
}

describe("buyer proof monitor", () => {
  it("stays unarmed until live proof verification is run", () => {
    const monitor = buildBuyerProofMonitor({
      proofLinks,
      now: new Date("2026-06-20T01:00:00.000Z")
    });

    expect(monitor.readiness).toBe("not-armed");
    expect(monitor.stopExternalSharing).toBe(true);
    expect(monitor.checks.find((check) => check.id === "verification-run")).toMatchObject({
      status: "block",
      nextCheck: "Run Verify live links before external sharing."
    });
    expect(monitor.exportMarkdown).toContain("Stop external sharing: yes");
  });

  it("marks current verified evidence as ready for buyer review", () => {
    const monitor = buildBuyerProofMonitor({
      proofLinks,
      verification: verification(),
      now: new Date("2026-06-20T08:00:00.000Z")
    });

    expect(monitor.readiness).toBe("evidence-current");
    expect(monitor.score).toBe(100);
    expect(monitor.freshnessHours).toBe(8);
    expect(monitor.stopExternalSharing).toBe(false);
    expect(monitor.checks.every((check) => check.status === "pass")).toBe(true);
    expect(monitor.runbook.join("\n")).toContain("Recheck all buyer proof links every 24 hours");
  });

  it("warns when one proof link is unstable", () => {
    const monitor = buildBuyerProofMonitor({
      proofLinks,
      verification: verification({
        verifiedCount: 4,
        score: 86,
        results: proofLinks.map((link) => ({
          id: link.id,
          label: link.label,
          status: link.id === "videoUrl" ? ("watch" as const) : ("pass" as const),
          httpStatus: link.id === "videoUrl" ? 503 : 200,
          evidence: link.id === "videoUrl" ? "Public URL responded with HTTP 503." : "Public URL responded with HTTP 200.",
          action: link.id === "videoUrl" ? "Retry the check or replace this proof with a more stable public artifact." : "Keep this link attached to the launch room."
        }))
      }),
      now: new Date("2026-06-20T08:00:00.000Z")
    });

    expect(monitor.readiness).toBe("evidence-watch");
    expect(monitor.stopExternalSharing).toBe(false);
    expect(monitor.checks.find((check) => check.id === "reachability")).toMatchObject({
      status: "watch",
      nextCheck: "Retry the check or replace this proof with a more stable public artifact."
    });
  });

  it("blocks external sharing when live proof is stale or unreachable", () => {
    const monitor = buildBuyerProofMonitor({
      proofLinks,
      verification: verification({
        verifiedCount: 4,
        score: 80,
        results: proofLinks.map((link) => ({
          id: link.id,
          label: link.label,
          status: link.id === "pilotEvidenceUrl" ? ("block" as const) : ("pass" as const),
          httpStatus: link.id === "pilotEvidenceUrl" ? 403 : 200,
          evidence: link.id === "pilotEvidenceUrl" ? "Public URL responded with HTTP 403." : "Public URL responded with HTTP 200.",
          action: link.id === "pilotEvidenceUrl" ? "Make the artifact publicly readable or attach a different proof URL." : "Keep this link attached to the launch room."
        }))
      }),
      now: new Date("2026-06-23T06:30:00.000Z")
    });

    expect(monitor.readiness).toBe("evidence-blocked");
    expect(monitor.freshnessHours).toBe(78.5);
    expect(monitor.stopExternalSharing).toBe(true);
    expect(monitor.checks.map((check) => [check.id, check.status])).toEqual([
      ["reachability", "block"],
      ["freshness", "block"],
      ["share-stop-rule", "block"]
    ]);
    expect(monitor.runbook.join("\n")).toContain("Resume external sharing only after the monitor has no blocked checks.");
  });

  it("renders an escaped public proof monitor page", () => {
    const monitor = buildBuyerProofMonitor({
      proofLinks,
      verification: verification(),
      now: new Date("2026-06-20T08:00:00.000Z")
    });
    const html = renderBuyerProofMonitorHtml(
      {
        ...monitor,
        headline: "Monitor <script>alert(1)</script>"
      },
      {
        appUrl: "https://example.com/?workspace=share",
        launchRoomUrl: "https://example.com/launch-room",
        recoveryUrl: "https://example.com/buyer-proof-recovery",
        jsonUrl: "https://example.com/api/buyer-proof-monitor",
        markdownUrl: "https://example.com/buyer-proof-monitor.md"
      }
    );

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("buyer-facing proof monitor");
    expect(html).toContain("https://example.com/api/buyer-proof-monitor");
    expect(html).toContain("Recovery desk");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Monitor &lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
