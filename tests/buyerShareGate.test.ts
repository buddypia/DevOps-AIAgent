import { describe, expect, it } from "vitest";
import type { BuyerPilotCommand } from "../src/buyerPilotCommand";
import type { BuyerPilotMeasuredRunSummary } from "../src/buyerPilotMeasuredRun";
import {
  buildBuyerShareGate,
  renderBuyerShareGateHtml,
  verifyBuyerShareGateReceipt,
  type BuyerShareGateProofLink,
  type BuyerShareGateProofVerificationSummary
} from "../src/buyerShareGate";

const readyMeasuredRun: BuyerPilotMeasuredRunSummary = {
  readiness: "measured",
  actualMinutesSavedPerRun: 82,
  acceptanceRatePercent: 90,
  measuredMonthlyHoursSaved: 72.2,
  measuredMonthlyLaborValueYen: 866000,
  measuredMonthlyValueYen: 1046000,
  headline: "Measured pilot value is ready to cite"
};

const proofLinks: BuyerShareGateProofLink[] = [
  { id: "targetUrl", label: "Deployed URL", value: "https://launch.example/app", href: "#launch-evidence-console" },
  { id: "protopediaUrl", label: "ProtoPedia URL", value: "https://protopedia.net/project/example", href: "#launch-evidence-console" },
  { id: "videoUrl", label: "Demo video", value: "https://video.example/demo", href: "#launch-evidence-console" },
  { id: "pilotEvidenceUrl", label: "Pilot receipt", value: "https://launch.example/pilot-receipt", href: "#pilot-run-receipt" },
  { id: "workOrderEvidenceUrl", label: "Work order proof", value: "https://launch.example/work-order", href: "#buyer-work-order-studio" }
];
const freshProofNow = new Date("2026-06-20T08:00:00.000Z");

function passingProofVerification(patch: Partial<BuyerShareGateProofVerificationSummary> = {}): BuyerShareGateProofVerificationSummary {
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

function readyCommand(patch: Partial<BuyerPilotCommand> = {}): BuyerPilotCommand {
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
      status: "ready" as const,
      owner: "Owner",
      href: `https://launch.example/${id}`,
      editHref: `#${id}`,
      summary: "Ready",
      isCurrent: false
    })),
    ...patch
  };
}

describe("buyer share gate", () => {
  it("clears external sharing only when room, proof, measured run, and artifacts are ready", () => {
    const gate = buildBuyerShareGate({
      command: readyCommand(),
      proofLinks,
      measuredRun: readyMeasuredRun,
      proofVerification: passingProofVerification(),
      now: freshProofNow
    });

    expect(gate.readiness).toBe("send-ready");
    expect(gate.score).toBe(100);
    expect(gate.blockerCount).toBe(0);
    expect(gate.primaryActionLabel).toBe("Open launch room");
    expect(gate.checks.every((check) => check.status === "pass")).toBe(true);
    expect(gate.sendPacket).toMatchObject({
      mode: "send",
      subject: "Buyer pilot packet ready: Platform lead"
    });
    expect(gate.sendPacket.messageLines).toContain("Please inspect the launch room, confirm the measured pilot receipt, and decide continue, revise, or stop.");
    expect(gate.sendPacket.acceptanceCriteria).toHaveLength(4);
    expect(gate.sendPacket.copyText).toContain("Subject: Buyer pilot packet ready: Platform lead");
    expect(gate.sendPacket.copyText).toContain("Do not send externally while any acceptance criterion is block.");
    expect(gate.repairPlan).toMatchObject({
      status: "ready",
      headline: "No repair work before buyer send",
      items: []
    });
    expect(gate.repairPlan.exportMarkdown).toContain("No repair items. Keep the receipt with the buyer packet.");
    expect(gate.receipt).toMatchObject({
      checksumAlgorithm: "fnv1a-64",
      verificationApiPath: "/api/buyer-share-gate/receipt/verify",
      payload: {
        receiptVersion: "buyer-share-gate.v1",
        readiness: "send-ready",
        mode: "send",
        score: 100,
        blockerCount: 0,
        watchCount: 0,
        repairPlan: {
          status: "ready",
          items: []
        }
      },
      verification: {
        status: "verified"
      }
    });
    expect(gate.receipt.receiptId).toMatch(/^buyer-share-gate-send-[a-f0-9]{12}$/);
    expect(gate.receipt.checksum).toMatch(/^[a-f0-9]{16}$/);
    expect(gate.receipt.payload.checks.map((check) => check.id)).toEqual(["launch-room", "public-proof", "measured-run", "artifact-closure"]);
    expect(gate.receipt.copyText).toContain("# Buyer share gate receipt");
    expect(gate.receipt.copyText).toContain("POST /api/buyer-share-gate/receipt/verify");
    expect(gate.receipt.verificationRequestJson).toContain('"receiptVersion": "buyer-share-gate.v1"');
    expect(decodeURIComponent(gate.receipt.payloadHref)).toContain('"mode": "send"');
    expect(verifyBuyerShareGateReceipt(gate.receipt).status).toBe("verified");
    expect(
      verifyBuyerShareGateReceipt({
        checksum: gate.receipt.checksum,
        payload: {
          ...gate.receipt.payload,
          score: 99
        }
      }).status
    ).toBe("mismatch");
    expect(gate.exportMarkdown).toContain("Buyer share gate is clear");
    expect(gate.exportMarkdown).toContain("## Buyer send repair plan");
    expect(gate.exportMarkdown).toContain("## Buyer send packet");
    expect(gate.exportMarkdown).toContain("Mode: send");
    expect(gate.exportMarkdown).toContain("## Decision receipt");
    expect(gate.exportMarkdown).toContain("API verification: POST /api/buyer-share-gate/receipt/verify");
  });

  it("renders escaped public HTML with send packet controls and stop rules", () => {
    const gate = {
      ...buildBuyerShareGate({
        command: readyCommand({ targetBuyer: 'Platform </script><script>alert("share")</script>' }),
        proofLinks,
        measuredRun: readyMeasuredRun,
        proofVerification: passingProofVerification(),
        now: freshProofNow
      }),
      headline: "Buyer Share <script>alert(1)</script>"
    };
    const html = renderBuyerShareGateHtml(gate, {
      appUrl: "https://launch.example/?workspace=share-token",
      launchRoomUrl: "https://launch.example/launch-room?workspace=share-token",
      proofMonitorUrl: "https://launch.example/buyer-proof-monitor?workspace=share-token",
      recoveryUrl: "https://launch.example/buyer-proof-recovery?workspace=share-token",
      evidenceTraceUrl: "https://launch.example/buyer-evidence-trace?workspace=share-token",
      jsonUrl: "https://launch.example/api/buyer-share-gate?workspace=share-token",
      markdownUrl: "https://launch.example/buyer-share-gate.md?workspace=share-token"
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer Share Gate");
    expect(html).toContain("Buyer send packet");
    expect(html).toContain("Acceptance criteria");
    expect(html).toContain("Buyer send repair plan");
    expect(html).toContain("No repair items");
    expect(html).toContain("Download repair plan");
    expect(html).toContain("Stop rules");
    expect(html).toContain("Decision receipt");
    expect(html).toContain("Verify receipt");
    expect(html).toContain('id="buyer-share-gate-receipt-verify-request"');
    expect(html).toContain("data-share-gate-receipt-status");
    expect(html).toContain("Download verify request");
    expect(html).toContain("https://launch.example/api/buyer-share-gate?workspace=share-token");
    expect(html).toContain("Buyer Share &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain('Platform &lt;/script&gt;&lt;script&gt;alert(&quot;share&quot;)&lt;/script&gt;');
    expect(html).toContain("\\u003c/script\\u003e\\u003cscript\\u003ealert");
    expect(html).not.toContain("Buyer Share <script>alert(1)</script>");
    expect(html).not.toContain('</script><script>alert("share")</script>');
  });

  it("holds external sharing when public proof links are missing", () => {
    const gate = buildBuyerShareGate({
      command: readyCommand(),
      proofLinks: proofLinks.map((link) => (link.id === "videoUrl" || link.id === "pilotEvidenceUrl" ? { ...link, value: "" } : link)),
      measuredRun: readyMeasuredRun,
      now: freshProofNow
    });

    expect(gate.readiness).toBe("needs-proof");
    expect(gate.score).toBeLessThan(90);
    expect(gate.decision).toContain("Hold external sharing");
    expect(gate.sendPacket).toMatchObject({
      mode: "hold",
      subject: "Hold buyer pilot packet: Public proof links"
    });
    expect(gate.sendPacket.messageLines).toContain("First open item: Public proof links. Attach Demo video before external sharing.");
    expect(gate.repairPlan).toMatchObject({
      status: "repair",
      headline: "Repair blockers before buyer send",
      items: [
        {
          id: "public-proof",
          sequence: 1,
          owner: "Proof owner",
          action: "Attach Demo video before external sharing.",
          unlock: "Public evidence can be cited outside the app."
        }
      ]
    });
    expect(gate.repairPlan.exportMarkdown).toContain("# Buyer send repair plan");
    expect(gate.repairPlan.exportMarkdown).toContain("Owner: Proof owner");
    expect(gate.exportMarkdown).toContain("Mode: hold");
    expect(gate.exportMarkdown).toContain("Repair blockers before buyer send");
    expect(gate.exportMarkdown).toContain("Do not use private credentials, private customer data, or non-public links as buyer proof.");
    expect(gate.checks.find((check) => check.id === "public-proof")).toMatchObject({
      status: "block",
      action: "Attach Demo video before external sharing.",
      href: "#launch-evidence-console"
    });
  });

  it("does not clear external sharing when proof links use plain HTTP", () => {
    const gate = buildBuyerShareGate({
      command: readyCommand(),
      proofLinks: proofLinks.map((link) => (link.id === "targetUrl" ? { ...link, value: "http://launch.example/app" } : link)),
      measuredRun: readyMeasuredRun,
      now: freshProofNow
    });

    expect(gate.readiness).toBe("needs-proof");
    expect(gate.checks.find((check) => check.id === "public-proof")).toMatchObject({
      status: "block",
      action: "Attach Deployed URL before external sharing."
    });
  });

  it("uses live proof verification before clearing buyer sharing", () => {
    const gate = buildBuyerShareGate({
      command: readyCommand(),
      proofLinks,
      measuredRun: readyMeasuredRun,
      proofVerification: {
        checkedAt: "2026-06-20T00:00:00.000Z",
        verifiedCount: 4,
        totalCount: 5,
        score: 86,
        results: proofLinks.map((link) => ({
          id: link.id,
          label: link.label,
          status: link.id === "pilotEvidenceUrl" ? ("watch" as const) : ("pass" as const),
          httpStatus: link.id === "pilotEvidenceUrl" ? 503 : 200,
          evidence: link.id === "pilotEvidenceUrl" ? "Public URL responded with HTTP 503; it exists but is not reliably readable right now." : "Public URL responded with HTTP 200.",
          action: link.id === "pilotEvidenceUrl" ? "Retry the check or replace this proof with a more stable public artifact." : "Keep this link attached to the launch room."
        }))
      },
      now: freshProofNow
    });

    expect(gate.readiness).toBe("almost-ready");
    expect(gate.watchCount).toBe(1);
    expect(gate.score).toBeLessThan(90);
    expect(gate.checks.find((check) => check.id === "public-proof")).toMatchObject({
      label: "Live proof reachability",
      status: "watch",
      href: "#pilot-run-receipt",
      action: "Retry the check or replace this proof with a more stable public artifact."
    });
    expect(gate.sendPacket).toMatchObject({
      mode: "review",
      subject: "Sponsor review needed: Live proof reachability"
    });
    expect(gate.exportMarkdown).toContain("Live proof reachability");
  });

  it("holds external sharing when the live proof check is stale even if every URL passed", () => {
    const gate = buildBuyerShareGate({
      command: readyCommand(),
      proofLinks,
      measuredRun: readyMeasuredRun,
      proofVerification: passingProofVerification(),
      now: new Date("2026-06-23T08:30:00.000Z")
    });

    expect(gate.readiness).toBe("needs-proof");
    expect(gate.blockerCount).toBe(1);
    expect(gate.primaryActionHref).toBe("#buyer-proof-intake");
    expect(gate.checks.find((check) => check.id === "public-proof")).toMatchObject({
      status: "block",
      evidence: expect.stringContaining("Last live proof check was 80.5 hours ago."),
      action: "Run Verify live links before external sharing."
    });
    expect(gate.sendPacket).toMatchObject({
      mode: "hold",
      subject: "Hold buyer pilot packet: Live proof reachability"
    });
    expect(gate.sendPacket.copyText).toContain("Do not send externally if the latest live proof check is older than 24 hours.");
  });

  it("holds external sharing when the measured run is not citeable", () => {
    const gate = buildBuyerShareGate({
      command: readyCommand(),
      proofLinks,
      measuredRun: {
        ...readyMeasuredRun,
        readiness: "needs-reviewer",
        headline: "Name the reviewer before sharing"
      },
      proofVerification: passingProofVerification(),
      now: freshProofNow
    });

    expect(gate.readiness).toBe("needs-measurement");
    expect(gate.blockerCount).toBe(1);
    expect(gate.primaryActionHref).toBe("#pilot-run-receipt");
    expect(gate.decision).toContain("Name the reviewer");
  });

  it("holds external sharing when measured value misses the buyer-ready savings target", () => {
    const gate = buildBuyerShareGate({
      command: readyCommand(),
      proofLinks,
      measuredRun: readyMeasuredRun,
      proofVerification: passingProofVerification(),
      now: freshProofNow,
      runCalibration: {
        readiness: "needs-savings",
        plannedMinutesSavedPerRun: 1380,
        minimumAcceptedSavingsMinutes: 966,
        actualMinutesSavedPerRun: 82,
        savingsGapMinutes: 884,
        acceptanceRatePercent: 90,
        headline: "Measure a stronger time saving run",
        checks: [
          {
            id: "savings",
            label: "Savings target",
            status: "watch",
            value: "82m saved",
            target: "966m minimum",
            action: "Save 884m more per run or lower the modeled manual baseline."
          },
          {
            id: "acceptance",
            label: "Task acceptance",
            status: "pass",
            value: "9/10 tasks",
            target: "70% accepted",
            action: "Acceptance is high enough for buyer proof."
          },
          {
            id: "evidence",
            label: "Public receipt",
            status: "pass",
            value: "attached",
            target: "public URL",
            action: "Receipt evidence can travel with the launch room."
          },
          {
            id: "participants",
            label: "Participant scope",
            status: "pass",
            value: "5 people",
            target: "3+ people",
            action: "The observed run has enough scope for first buyer proof."
          }
        ]
      }
    });

    expect(gate.readiness).toBe("needs-measurement");
    expect(gate.checks.find((check) => check.id === "measured-run")).toMatchObject({
      status: "block",
      action: "Save 884m more per run or lower the modeled manual baseline."
    });
    expect(gate.decision).toContain("Save 884m more");
  });

  it("points to the current room blocker when artifacts are not sealed", () => {
    const gate = buildBuyerShareGate({
      command: readyCommand({
        readiness: "needs-work-order",
        launchScore: 62,
        proofClosure: "5/8 artifacts sealed",
        nextGap: {
          label: "Work order brief",
          owner: "Pilot facilitator",
          action: "Sharpen the real buyer work order.",
          href: "https://launch.example/work-order-brief",
          editHref: "#buyer-work-order-studio"
        },
        steps: readyCommand().steps.map((step) =>
          step.id === "work-order-brief" ? { ...step, status: "blocked" as const, label: "Work order brief", editHref: "#buyer-work-order-studio" } : step
        )
      }),
      proofLinks,
      measuredRun: readyMeasuredRun,
      proofVerification: passingProofVerification(),
      now: freshProofNow
    });

    expect(gate.readiness).toBe("needs-room");
    expect(gate.checks.find((check) => check.id === "artifact-closure")).toMatchObject({
      status: "block",
      action: "Close Work order brief before sending.",
      href: "#buyer-work-order-studio"
    });
    expect(gate.decision).toContain("Sharpen the real buyer work order");
  });
});
