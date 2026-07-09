import { describe, expect, test } from "vitest";
import { buildHeroBuyerDecisionBrief } from "../src/HeroBuyerDecisionBrief";
import type { BuyerPilotMeasuredRunSummary } from "../src/buyerPilotMeasuredRun";
import type { BuyerPilotCommand } from "../src/buyerPilotCommand";
import type { BuyerValueScenario } from "../src/buyerValueScenario";
import type { ProofTransformation } from "../src/proofTransformation";

function command(patch: Partial<BuyerPilotCommand> = {}): BuyerPilotCommand {
  return {
    readiness: "needs-proof",
    launchScore: 62,
    headline: "Close the proof gaps before external sharing",
    targetBuyer: "Platform release lead",
    primaryMetric: "¥780,000 modeled value",
    proofClosure: "3/8 artifacts sealed",
    pathLabel: "Proof closure is the current lane",
    nextGap: {
      label: "Pilot receipt",
      owner: "Pilot reviewer",
      action: "Attach the measured receipt before buyer sharing.",
      href: "/pilot-run-receipt",
      editHref: "#pilot-run-receipt"
    },
    gapQueue: [
      {
        id: "gap-pilot-receipt",
        artifactId: "pilot-receipt",
        label: "Pilot receipt",
        status: "blocked",
        owner: "Pilot reviewer",
        action: "Attach the measured receipt before buyer sharing.",
        acceptanceSignal: "Buyer can inspect measured minutes saved, accepted tasks, and monthly value.",
        proofToAttach: "Signed pilot run receipt",
        href: "/pilot-run-receipt",
        editHref: "#pilot-run-receipt",
        isCurrent: true
      },
      {
        id: "gap-proof-audit",
        artifactId: "proof-audit",
        label: "Proof audit",
        status: "attention",
        owner: "Cloud Run SRE",
        action: "Verify every public proof URL.",
        acceptanceSignal: "All external reviewer links return buyer-safe evidence.",
        proofToAttach: "Public proof audit",
        href: "/buyer-proof-audit",
        editHref: "#buyer-proof-audit",
        isCurrent: false
      }
    ],
    steps: [
      {
        id: "workflow",
        label: "Workflow",
        status: "ready",
        owner: "Platform lead",
        href: "/workflow",
        editHref: "#marketplace-workbench",
        summary: "Buyer workflow, target user, and success metric are named.",
        isCurrent: false
      },
      {
        id: "pilot-run-receipt",
        label: "Pilot receipt",
        status: "blocked",
        owner: "Pilot reviewer",
        href: "/pilot-run-receipt",
        editHref: "#pilot-run-receipt",
        summary: "Measured pilot run receipt is missing.",
        isCurrent: true
      },
      {
        id: "trust-center",
        label: "Buyer trust center",
        status: "blocked",
        owner: "Security reviewer",
        href: "/trust-center",
        editHref: "#buyer-trust-center",
        summary: "Trust memo blocks external rollout until receipt proof is attached.",
        isCurrent: false
      },
      {
        id: "delivery-memo",
        label: "Buyer delivery memo",
        status: "blocked",
        owner: "Sponsor owner",
        href: "/buyer-delivery-memo",
        editHref: "#marketplace-workbench",
        summary: "Final buyer send room is locked until proof closure.",
        isCurrent: false
      }
    ],
    ...patch
  };
}

function transformation(patch: Partial<ProofTransformation["current"]> = {}): ProofTransformation {
  return {
    id: "proof-transformation",
    headline: "Replace starter proof with buyer-owned proof",
    hardTruth: "Current workspace is not buyer-ready yet.",
    before: {} as ProofTransformation["before"],
    after: {} as ProofTransformation["after"],
    current: {
      status: "block",
      headline: "2 current repair items before buyer sharing",
      score: 62,
      proofClosure: "not checked",
      readyCount: 3,
      watchCount: 1,
      blockedCount: 1,
      openCount: 2,
      primaryAction: "Pilot receipt: Attach the measured receipt before buyer sharing.",
      items: [],
      ...patch
    },
    deltas: [],
    generatedArtifacts: [],
    runway: []
  };
}

const buyerScenario = {
  monthlyGrossValueYen: 780000,
  paybackDays: 14
} as BuyerValueScenario;

const measuredRunSummary: BuyerPilotMeasuredRunSummary = {
  readiness: "measured",
  actualMinutesSavedPerRun: 112,
  acceptanceRatePercent: 88,
  measuredMonthlyHoursSaved: 46,
  measuredMonthlyLaborValueYen: 414000,
  measuredMonthlyValueYen: 504000,
  headline: "Measured pilot value is ready to cite"
};

describe("hero buyer decision brief", () => {
  test("holds external sharing when buyer proof blockers remain", () => {
    const brief = buildHeroBuyerDecisionBrief({
      command: command(),
      transformation: transformation(),
      buyerScenario,
      measuredRunSummary,
      launchRoomHref: "/launch-room",
      proofAuditHref: "/buyer-proof-audit",
      decisionReceiptHref: "/buyer-decision-receipt?decision=stop"
    });

    expect(brief.status).toBe("blocked");
    expect(brief.decision).toBe("hold");
    expect(brief.decisionLabel).toBe("Hold");
    expect(brief.headline).toBe("Hold external sharing: 2 buyer repair items open");
    expect(brief.evidence).toBe("Pilot receipt: Attach the measured receipt before buyer sharing.");
    expect(brief.primaryAction).toEqual({ label: "Fix Pilot receipt", href: "#pilot-run-receipt" });
    expect(brief.secondaryAction).toEqual({ label: "Open proof audit", href: "/buyer-proof-audit" });
    expect(brief.decisionReceiptAction).toEqual({ label: "Open decision receipt", href: "/buyer-decision-receipt?decision=stop" });
    expect(brief.metrics.map((metric) => metric.id)).toEqual(["value", "receipt", "proof"]);
    expect(brief.outcomeReplay.map((step) => step.id)).toEqual(["manual-work", "agent-run", "proof-packet", "buyer-decision"]);
    expect(brief.outcomeReplay.find((step) => step.id === "manual-work")).toMatchObject({
      label: "Manual work",
      status: "ready",
      value: "¥780,000 / month modeled",
      href: "#marketplace-workbench"
    });
    expect(brief.outcomeReplay.find((step) => step.id === "agent-run")).toMatchObject({
      status: "blocked",
      value: "112m saved/run",
      href: "#pilot-run-receipt"
    });
    expect(brief.outcomeReplay.find((step) => step.id === "buyer-decision")).toMatchObject({
      status: "blocked",
      value: "Hold / 62",
      href: "#pilot-run-receipt"
    });
    expect(brief.buyerQuestions.map((question) => question.id)).toEqual(["value-case", "proof-access", "trust-gate", "next-decision"]);
    expect(brief.buyerQuestions.find((question) => question.id === "value-case")).toMatchObject({
      question: "Is the pilot worth buying?",
      status: "blocked",
      href: "#pilot-run-receipt"
    });
    expect(brief.buyerQuestions.find((question) => question.id === "proof-access")).toMatchObject({
      question: "Can the reviewer open proof?",
      status: "blocked",
      href: "/buyer-proof-audit"
    });
    expect(brief.buyerQuestions.find((question) => question.id === "next-decision")?.answer).toContain("Keep internal");
    expect(brief.approvalPath.map((step) => step.id)).toEqual(["work-order", "receipt", "trust", "send-room"]);
    expect(brief.approvalPath.map((step) => step.href)).toEqual(["#marketplace-workbench", "#pilot-run-receipt", "#buyer-trust-center", "/launch-room"]);
    expect(brief.approvalPath.find((step) => step.id === "send-room")?.summary).toBe("Final send waits for Pilot receipt.");
    expect(brief.metrics.find((metric) => metric.id === "value")?.detail).toContain("14d payback");
    expect(brief.metrics.find((metric) => metric.id === "receipt")?.detail).toContain("88% accepted");
    expect(brief.packetReceipt.receiptId).toMatch(/^buyer-send-hold-[a-f0-9]{8}$/);
    expect(brief.packetReceipt.checksumAlgorithm).toBe("fnv1a32");
    expect(brief.packetReceipt.checksum).toMatch(/^[a-f0-9]{8}$/);
    expect(brief.exportMarkdown).toContain("# Buyer send packet");
    expect(brief.exportMarkdown).toContain(`Receipt: ${brief.packetReceipt.receiptId}`);
    expect(brief.exportMarkdown).toContain(`Checksum: fnv1a32:${brief.packetReceipt.checksum}`);
    expect(brief.exportMarkdown).toContain("Decision: Hold");
    expect(brief.exportMarkdown).toContain("Primary: Fix Pilot receipt (#pilot-run-receipt)");
    expect(brief.exportMarkdown).toContain("Decision receipt: Open decision receipt (/buyer-decision-receipt?decision=stop)");
    expect(brief.exportMarkdown).toContain("## Buyer send draft");
    expect(brief.exportMarkdown).toContain("Subject: Internal repair before buyer sharing: Pilot receipt");
    expect(brief.exportMarkdown).toContain("do not ask the buyer to approve from this state");
    expect(brief.exportMarkdown).toContain("## Evidence metrics");
    expect(brief.exportMarkdown).toContain("Measured receipt: 112m saved/run. 88% accepted");
    expect(brief.exportMarkdown).toContain("## Outcome replay");
    expect(brief.exportMarkdown).toContain("[blocked] Buyer decision: Hold / 62");
    expect(brief.exportMarkdown).toContain("## Buyer questions");
    expect(brief.exportMarkdown).toContain("[blocked] Can the reviewer open proof?");
    expect(brief.exportMarkdown).toContain("Link: /buyer-proof-audit");
    expect(brief.exportMarkdown).toContain("## Approval path");
    expect(brief.exportMarkdown).toContain("[blocked] Check trust memo (Security reviewer): Trust memo blocks external rollout until receipt proof is attached.");
    expect(brief.exportMarkdown).toContain("[blocked] Send room (Sponsor owner): Final send waits for Pilot receipt. Link: /launch-room");
    expect(brief.exportMarkdown).toContain("## Repair queue");
    expect(brief.exportMarkdown).toContain("[blocked] Pilot receipt (Pilot reviewer): Attach the measured receipt before buyer sharing.");
    expect(brief.exportMarkdown).toContain("Proof to attach: Signed pilot run receipt");
    expect(brief.exportMarkdown).toContain("## Artifact readiness");
    expect(brief.exportMarkdown).toContain("[ready] Workflow (Platform lead): Buyer workflow, target user, and success metric are named.");
    expect(JSON.stringify(brief)).not.toMatch(/demo/i);
  });

  test("opens the launch room when the current workspace is buyer-ready", () => {
    const brief = buildHeroBuyerDecisionBrief({
      command: command({
        readiness: "buyer-ready",
        launchScore: 94,
        headline: "Share the launch room with a buyer",
        proofClosure: "8/8 artifacts sealed",
        nextGap: {
          label: "Delivery memo",
          owner: "Cloud Run SRE",
          action: "Keep buyer artifacts fresh.",
          href: "/buyer-delivery-memo",
          editHref: "#buyer-delivery-memo"
        },
        steps: [
          {
            id: "work-order-brief",
            label: "Work order brief",
            status: "ready",
            owner: "Platform lead",
            href: "/work-order-brief",
            editHref: "#buyer-work-order-studio",
            summary: "Buyer workflow, target user, and success metric are named.",
            isCurrent: false
          },
          {
            id: "pilot-run-receipt",
            label: "Pilot receipt",
            status: "ready",
            owner: "Pilot reviewer",
            href: "/pilot-run-receipt",
            editHref: "#pilot-run-receipt",
            summary: "Measured pilot run receipt is attached.",
            isCurrent: false
          },
          {
            id: "trust-center",
            label: "Buyer trust center",
            status: "ready",
            owner: "Security reviewer",
            href: "/trust-center",
            editHref: "#buyer-trust-center",
            summary: "Trust memo is ready for approval review.",
            isCurrent: false
          },
          {
            id: "delivery-memo",
            label: "Buyer delivery memo",
            status: "ready",
            owner: "Cloud Run SRE",
            href: "/buyer-delivery-memo",
            editHref: "#buyer-delivery-memo",
            summary: "Buyer send room is ready.",
            isCurrent: true
          }
        ]
      }),
      transformation: transformation({
        status: "pass",
        headline: "Current workspace is buyer-verifiable",
        score: 94,
        proofClosure: "5/5",
        readyCount: 8,
        watchCount: 0,
        blockedCount: 0,
        openCount: 0,
        primaryAction: "Send the launch room."
      }),
      buyerScenario,
      measuredRunSummary,
      launchRoomHref: "/launch-room",
      proofAuditHref: "/buyer-proof-audit",
      decisionReceiptHref: "/buyer-decision-receipt?decision=continue"
    });

    expect(brief.status).toBe("ready");
    expect(brief.decision).toBe("send");
    expect(brief.decisionLabel).toBe("Send");
    expect(brief.headline).toBe("Send Platform release lead a buyer-verifiable pilot contract");
    expect(brief.evidence).toContain("8/8 artifacts sealed");
    expect(brief.primaryAction).toEqual({ label: "Open launch room", href: "/launch-room" });
    expect(brief.decisionReceiptAction).toEqual({ label: "Open decision receipt", href: "/buyer-decision-receipt?decision=continue" });
    expect(brief.score).toBe(94);
    expect(brief.outcomeReplay.find((step) => step.id === "proof-packet")).toMatchObject({
      status: "ready",
      value: "5/5",
      detail: "Live proof is inspectable."
    });
    expect(brief.outcomeReplay.find((step) => step.id === "buyer-decision")).toMatchObject({
      status: "ready",
      value: "Send / 94",
      href: "/launch-room"
    });
    expect(brief.buyerQuestions.every((question) => question.status === "ready")).toBe(true);
    expect(brief.buyerQuestions.find((question) => question.id === "next-decision")?.answer).toContain("record the buyer decision receipt");
    expect(brief.approvalPath.every((step) => step.status === "ready")).toBe(true);
    expect(brief.approvalPath.find((step) => step.id === "send-room")?.summary).toBe("Launch room can be sent with the buyer packet attached.");
    expect(brief.packetReceipt.receiptId).toMatch(/^buyer-send-send-[a-f0-9]{8}$/);
    expect(brief.exportMarkdown).toContain("Decision: Send");
    expect(brief.exportMarkdown).toContain(`Receipt: ${brief.packetReceipt.receiptId}`);
    expect(brief.exportMarkdown).toContain("Primary: Open launch room (/launch-room)");
    expect(brief.exportMarkdown).toContain("Decision receipt: Open decision receipt (/buyer-decision-receipt?decision=continue)");
    expect(brief.exportMarkdown).toContain("Subject: Pilot contract ready: Platform release lead");
    expect(brief.exportMarkdown).toContain("[ready] Buyer decision: Send / 94");
    expect(brief.exportMarkdown).toContain("Please review the launch room, proof audit, value case, and stop rule");
    expect(brief.exportMarkdown).toContain("[ready] What should happen next? Send the launch room, then record the buyer decision receipt.");
    expect(brief.exportMarkdown).toContain("8/8 artifacts sealed");
  });
});
